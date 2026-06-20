import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy,
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useSystemData } from './SystemDataContext';
import dayjs from 'dayjs';

const ComplaintContext = createContext();

export const ComplaintProvider = ({ children }) => {
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { categories, workflows, users } = useSystemData();

  // Keep a stable ref so the SLA timer always sees current data
  const complaintsRef = useRef([]);
  const workflowsRef  = useRef([]);
  const usersRef      = useRef([]);
  complaintsRef.current = complaints;
  workflowsRef.current  = workflows;
  usersRef.current      = users;

  // ── Firestore Listeners ────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
    return onSnapshot(q,
      snap => { setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
      err  => { console.error('Complaints listener:', err); setLoading(false); }
    );
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));
    return onSnapshot(q,
      snap => setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err  => console.error('AuditLogs listener:', err)
    );
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
    return onSnapshot(q,
      snap => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err  => console.error('Notifications listener:', err)
    );
  }, []);

  // ── Auto SLA Escalation Engine ─────────────────────────────────────────
  // Runs every 2 minutes. Finds active complaints past their SLA deadline
  // that haven't been auto-escalated yet and escalates them one level.
  useEffect(() => {
    const runSlaCheck = async () => {
      const now = dayjs();
      const activeComplaints = complaintsRef.current.filter(c =>
        !['Resolved', 'Closed', 'Rejected'].includes(c.status) &&
        c.slaDeadline &&
        now.isAfter(dayjs(c.slaDeadline)) &&
        !c.slaAutoEscalated   // flag to prevent repeated auto-escalation
      );

      for (const complaint of activeComplaints) {
        const workflow = workflowsRef.current.find(w => w.deptId === complaint.deptId);
        if (!workflow) continue;

        const currentIdx = complaint.escalationLevel - 1;

        // Find the next officer in the workflow chain
        let nextOfficer = null;
        let newLevel = complaint.escalationLevel;
        let escalationRemark = '';

        if (currentIdx + 1 < workflow.levels.length) {
          // Can still escalate within the workflow
          const nextRole = workflow.levels[currentIdx + 1];
          nextOfficer = usersRef.current.find(
            u => u.roleId === nextRole && u.deptId === complaint.deptId && u.status !== 'inactive'
          ) || usersRef.current.find(
            u => u.roleId === nextRole && u.status !== 'inactive'
          );
          newLevel = complaint.escalationLevel + 1;
          escalationRemark = `Auto-escalated to ${nextOfficer?.name || 'Higher Authority'} — SLA deadline breached`;
        } else {
          // Already at top level — mark as pending admin review
          escalationRemark = 'SLA deadline breached at top escalation level — admin review required';
        }

        try {
          await updateDoc(doc(db, 'complaints', complaint.id), {
            escalationLevel: newLevel,
            assignedOfficerId: nextOfficer?.id || complaint.assignedOfficerId,
            status: 'Escalated',
            updatedAt: now.toISOString(),
            slaAutoEscalated: true,
            timeline: [
              ...complaint.timeline,
              {
                status: 'Escalated',
                remark: escalationRemark,
                timestamp: now.toISOString(),
                auto: true,
              },
            ],
          });

          // Notify the newly assigned officer
          if (nextOfficer) {
            await addDoc(collection(db, 'notifications'), {
              userId: nextOfficer.id,
              message: `⚠️ SLA Breach: Complaint auto-escalated to you — "${complaint.title}"`,
              timestamp: now.toISOString(),
              read: false,
            });
          }

          // Notify the original submitter
          if (complaint.userId) {
            await addDoc(collection(db, 'notifications'), {
              userId: complaint.userId,
              message: `Your complaint "${complaint.title}" was escalated due to SLA breach. We apologize for the delay.`,
              timestamp: now.toISOString(),
              read: false,
            });
          }

          // Write audit log
          await addDoc(collection(db, 'auditLogs'), {
            action: 'SLA Escalation',
            userId: 'system',
            details: `Complaint #${complaint.id} auto-escalated to ${nextOfficer?.name || 'Higher Authority'} — SLA breach`,
            timestamp: now.toISOString(),
          });

          console.log(`[SLA] Auto-escalated complaint #${complaint.id}`);
        } catch (e) {
          console.error('[SLA] Failed to auto-escalate:', complaint.id, e);
        }
      }
    };

    // Run immediately on mount, then every 2 minutes
    runSlaCheck();
    const interval = setInterval(runSlaCheck, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // Empty deps — uses refs so it always sees latest data

  // ── Helpers ─────────────────────────────────────────────────────────────
  const addAuditLog = async (action, userId, details) => {
    await addDoc(collection(db, 'auditLogs'), {
      action,
      userId,
      details,
      timestamp: new Date().toISOString(),
    });
  };

  const addNotification = async (userId, message) => {
    await addDoc(collection(db, 'notifications'), {
      userId,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    });
  };

  // ── Complaint Routing ────────────────────────────────────────────────────
  const routeComplaint = (category) => {
    if (!category) return null;
    const deptId   = category.deptId;
    const workflow = workflows.find(w => w.deptId === deptId);
    if (!workflow) return null;

    const firstRole = workflow.levels[0];

    // 1st: dept-specific active officer
    let officer = users.find(
      u => u.roleId === firstRole && u.deptId === deptId && u.status !== 'inactive'
    );
    // 2nd fallback: any user with that role
    if (!officer) {
      officer = users.find(u => u.roleId === firstRole && u.status !== 'inactive');
    }

    return { officer, workflow };
  };

  // ── Add Complaint ────────────────────────────────────────────────────────
  const addComplaint = async (data) => {
    const { title, description, categoryId, userId, priority = 'Medium', manualOfficerId } = data;
    const category = categories.find(c => c.id === categoryId);
    const routing  = routeComplaint(category);

    const assignedOfficerId = manualOfficerId || routing?.officer?.id || null;
    let officerName = 'Pending Assignment';
    if (manualOfficerId) {
      officerName = users.find(u => u.id === manualOfficerId)?.name || 'Chosen Officer';
    } else if (routing?.officer) {
      officerName = routing.officer.name;
    }

    const slaDays = priority === 'Critical' ? 1 : priority === 'High' ? 2 : priority === 'Medium' ? 5 : 10;

    const newComplaint = {
      title,
      description,
      categoryId,
      deptId: category?.deptId || null,
      priority,
      status: assignedOfficerId ? 'Assigned' : 'Pending',
      userId,
      assignedOfficerId,
      escalationLevel: 1,
      slaAutoEscalated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slaDeadline: dayjs().add(slaDays, 'day').toISOString(),
      timeline: [
        { status: 'Submitted', timestamp: new Date().toISOString(), remark: 'Complaint registered successfully' },
        ...(assignedOfficerId
          ? [{ status: 'Assigned',  timestamp: new Date().toISOString(), remark: `Assigned to ${officerName}` }]
          : [{ status: 'Pending',   timestamp: new Date().toISOString(), remark: 'No officer available — pending assignment' }]
        ),
      ],
    };

    const docRef = await addDoc(collection(db, 'complaints'), newComplaint);
    addAuditLog('Complaint Created', userId, `Complaint #${docRef.id} submitted — routed to ${officerName}`);

    // Notify the assigned officer immediately
    if (assignedOfficerId) {
      addNotification(
        assignedOfficerId,
        `📋 New ${priority} priority complaint assigned to you: "${title}". SLA: ${slaDays} day${slaDays > 1 ? 's' : ''}.`
      );
    }

    return docRef.id;
  };

  // ── Update Complaint Status ───────────────────────────────────────────────
  const updateComplaintStatus = async (complaintId, status, remark, officerId) => {
    const complaint = complaints.find(c => c.id === complaintId);
    if (!complaint) return;

    const updatedTimeline = [
      ...complaint.timeline,
      { status, remark, timestamp: new Date().toISOString(), officerId },
    ];

    await updateDoc(doc(db, 'complaints', complaintId), {
      status,
      updatedAt: new Date().toISOString(),
      timeline: updatedTimeline,
      // Clear auto-escalation flag when manually resolved/acted upon
      ...(status === 'Resolved' || status === 'Closed' ? { slaAutoEscalated: true } : {}),
    });

    addAuditLog('Status Updated', officerId, `Complaint #${complaintId} → ${status}`);

    // Notify the submitting citizen when their complaint changes status
    if (complaint.userId && complaint.userId !== officerId) {
      const citizenMsg = {
        'In Progress': `Your complaint "${complaint.title}" is now being actively worked on.`,
        Resolved:      `✅ Your complaint "${complaint.title}" has been marked as Resolved.`,
        Escalated:     `Your complaint "${complaint.title}" has been escalated to a higher authority.`,
        Closed:        `Your complaint "${complaint.title}" has been closed.`,
        Rejected:      `Your complaint "${complaint.title}" was rejected. It has been escalated for review.`,
      }[status];

      if (citizenMsg) {
        addNotification(complaint.userId, citizenMsg);
      }
    }
  };

  // ── Manual Escalation ────────────────────────────────────────────────────
  const escalateComplaint = async (complaintId) => {
    const complaint = complaints.find(c => c.id === complaintId);
    if (!complaint) return;
    const workflow = workflows.find(w => w.deptId === complaint.deptId);
    if (!workflow) return;

    const currentIdx = complaint.escalationLevel - 1;

    if (currentIdx + 1 < workflow.levels.length) {
      const nextRole = workflow.levels[currentIdx + 1];

      let nextOfficer = users.find(
        u => u.roleId === nextRole && u.deptId === complaint.deptId && u.status !== 'inactive'
      );
      if (!nextOfficer) {
        nextOfficer = users.find(u => u.roleId === nextRole && u.status !== 'inactive');
      }

      const remark = `Manually escalated to ${nextOfficer?.name || 'Higher Authority'}`;

      await updateDoc(doc(db, 'complaints', complaintId), {
        escalationLevel: complaint.escalationLevel + 1,
        assignedOfficerId: nextOfficer?.id || complaint.assignedOfficerId,
        status: 'Escalated',
        updatedAt: new Date().toISOString(),
        slaAutoEscalated: false, // Reset so it can be auto-escalated again if needed
        timeline: [...complaint.timeline, {
          status: 'Escalated',
          remark,
          timestamp: new Date().toISOString(),
        }],
      });

      addAuditLog('Complaint Escalated', complaint.assignedOfficerId,
        `Complaint #${complaintId} manually escalated to ${nextOfficer?.name || 'Higher Authority'}`);

      if (nextOfficer) {
        addNotification(nextOfficer.id, `🔺 Complaint escalated to you: "${complaint.title}"`);
      }

      // Notify citizen
      if (complaint.userId) {
        addNotification(complaint.userId, `Your complaint "${complaint.title}" has been escalated to a senior officer.`);
      }
    } else {
      // Already at the top — notify admin
      await updateDoc(doc(db, 'complaints', complaintId), {
        status: 'Escalated',
        updatedAt: new Date().toISOString(),
        timeline: [...complaint.timeline, {
          status: 'Escalated',
          remark: 'Escalated to top level — requires admin intervention',
          timestamp: new Date().toISOString(),
        }],
      });
      addAuditLog('Max Escalation Reached', complaint.assignedOfficerId,
        `Complaint #${complaintId} reached maximum escalation level`);
    }
  };

  // ── Mark Notification Read ─────────────────────────────────────────────
  const markAsRead = async (notificationId) => {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  };

  return (
    <ComplaintContext.Provider value={{
      complaints,
      addComplaint,
      updateComplaintStatus,
      escalateComplaint,
      auditLogs,
      notifications,
      markAsRead,
      addNotification,
      loading,
    }}>
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaints = () => useContext(ComplaintContext);
