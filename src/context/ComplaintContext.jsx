import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  getStoredComplaints,
  saveStoredComplaints,
  getStoredAuditLogs,
  saveStoredAuditLogs,
  getStoredNotifications,
  saveStoredNotifications,
} from '../utils/persistentStorage';
import { useSystemData } from './SystemDataContext';
import dayjs from 'dayjs';

const ComplaintContext = createContext();

export const ComplaintProvider = ({ children }) => {
  const [complaints, setComplaints] = useState(() => getStoredComplaints());
  const [auditLogs, setAuditLogs] = useState(() => getStoredAuditLogs());
  const [notifications, setNotifications] = useState(() => getStoredNotifications());
  const [loading, setLoading] = useState(false);
  const { categories, workflows, users, departments } = useSystemData();

  const complaintsRef = useRef(complaints);
  const workflowsRef = useRef(workflows);
  const usersRef = useRef(users);
  complaintsRef.current = complaints;
  workflowsRef.current = workflows;
  usersRef.current = users;

  // React to storage updates from other tabs / components
  const reloadFromStorage = useCallback(() => {
    setComplaints(getStoredComplaints());
    setAuditLogs(getStoredAuditLogs());
    setNotifications(getStoredNotifications());
  }, []);

  useEffect(() => {
    const handleUpdate = (e) => {
      if (
        !e?.detail?.key ||
        e.detail.key === 'ressolve_complaints_v2' ||
        e.detail.key === 'ressolve_audit_logs_v2' ||
        e.detail.key === 'ressolve_notifications_v2'
      ) {
        reloadFromStorage();
      }
    };
    window.addEventListener('ressolve_storage_update', handleUpdate);
    return () => window.removeEventListener('ressolve_storage_update', handleUpdate);
  }, [reloadFromStorage]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const addAuditLog = (action, userId, details, userName) => {
    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      userId,
      userName: userName || usersRef.current.find(u => u.id === userId)?.name || 'System',
      details,
      timestamp: new Date().toISOString(),
    };
    const current = getStoredAuditLogs();
    const updated = [newLog, ...current];
    setAuditLogs(updated);
    saveStoredAuditLogs(updated);
  };

  const addNotification = (userId, message, complaintId = null) => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      message,
      complaintId,
      timestamp: new Date().toISOString(),
      read: false,
    };
    const current = getStoredNotifications();
    const updated = [newNotif, ...current];
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const markAsRead = (notificationId) => {
    const current = getStoredNotifications();
    const updated = current.map(n => n.id === notificationId ? { ...n, read: true } : n);
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const markAllNotificationsRead = (userId) => {
    const current = getStoredNotifications();
    const updated = current.map(n => (n.userId === userId || !userId) ? { ...n, read: true } : n);
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  // ── Complaint Routing Engine ─────────────────────────────────────────────
  const routeComplaint = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return null;
    const deptId = category.deptId;
    const workflow = workflows.find(w => w.deptId === deptId);
    if (!workflow || !workflow.levels || workflow.levels.length === 0) return null;

    const firstRoleId = workflow.levels[0];
    // Find active officer for this department & role
    let officer = users.find(
      u => u.roleId === firstRoleId && u.deptId === deptId && u.status !== 'inactive'
    ) || users.find(
      u => u.roleId === firstRoleId && u.status !== 'inactive'
    );

    return { officer, workflow, department: departments.find(d => d.id === deptId) };
  };

  // ── Add New Complaint ───────────────────────────────────────────────────
  const addComplaint = async (data) => {
    const {
      title,
      description,
      categoryId,
      userId,
      citizenName,
      priority = 'Medium',
      manualOfficerId,
      location = '',
      attachments = [],
    } = data;

    const category = categories.find(c => c.id === categoryId);
    const routing = routeComplaint(categoryId);

    const assignedOfficerId = manualOfficerId || routing?.officer?.id || null;
    let officerName = 'Pending Assignment';
    if (manualOfficerId) {
      officerName = users.find(u => u.id === manualOfficerId)?.name || 'Selected Officer';
    } else if (routing?.officer) {
      officerName = routing.officer.name;
    }

    // SLA calculation based on priority
    const slaHours = priority === 'Critical' ? 24 : priority === 'High' ? 48 : priority === 'Medium' ? 96 : 168;
    const now = dayjs();
    const slaDeadline = now.add(slaHours, 'hour').toISOString();

    const uniqueNum = Math.floor(1000 + Math.random() * 9000);
    const newId = `GRV-2026-${uniqueNum}`;

    const newComplaint = {
      id: newId,
      title,
      description,
      categoryId,
      deptId: category?.deptId || routing?.workflow?.deptId || 'dept-1',
      priority,
      status: assignedOfficerId ? 'Assigned' : 'Pending',
      userId,
      citizenName: citizenName || users.find(u => u.id === userId)?.name || 'Citizen',
      assignedOfficerId,
      assignedOfficerName: officerName,
      escalationLevel: 1,
      location: location || 'General Public Jurisdiction',
      slaAutoEscalated: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      slaDeadline,
      attachments: attachments || [],
      messages: [],
      timeline: [
        {
          status: 'Submitted',
          timestamp: now.toISOString(),
          remark: `Grievance officially submitted under Priority: ${priority}`,
          user: citizenName || 'Citizen',
        },
        ...(assignedOfficerId
          ? [{
              status: 'Assigned',
              timestamp: now.add(1, 'minute').toISOString(),
              remark: `Auto-routed to ${officerName} (Level 1 SLA: ${Math.round(slaHours / 24)} days)`,
              user: 'Routing Engine',
            }]
          : [{
              status: 'Pending',
              timestamp: now.toISOString(),
              remark: 'No active officer immediately available; queued for admin triage',
              user: 'System',
            }]
        ),
      ],
    };

    const currentComplaints = getStoredComplaints();
    const updated = [newComplaint, ...currentComplaints];
    setComplaints(updated);
    saveStoredComplaints(updated);

    addAuditLog('Complaint Created', userId, `Complaint #${newId} filed — Routed to ${officerName}`);

    // Notify assigned officer
    if (assignedOfficerId) {
      addNotification(
        assignedOfficerId,
        `📋 New ${priority} Priority grievance assigned to you: "${title}". SLA: ${Math.round(slaHours / 24)} days.`,
        newId
      );
    }

    return newId;
  };

  // ── Update Complaint Status ──────────────────────────────────────────────
  const updateComplaintStatus = async (complaintId, status, remark, officerId, resolutionProof = null) => {
    const currentComplaints = getStoredComplaints();
    const complaint = currentComplaints.find(c => c.id === complaintId);
    if (!complaint) return;

    const actor = usersRef.current.find(u => u.id === officerId);
    const actorName = actor?.name || 'Officer';
    const now = new Date().toISOString();

    const updatedTimeline = [
      ...complaint.timeline,
      {
        status,
        remark: remark || `Status transitioned to ${status}`,
        timestamp: now,
        user: actorName,
        officerId,
      },
    ];

    const updatedComplaint = {
      ...complaint,
      status,
      updatedAt: now,
      timeline: updatedTimeline,
      ...(resolutionProof ? { resolutionProof } : {}),
      ...(status === 'Resolved' || status === 'Closed' ? { slaAutoEscalated: true } : {}),
    };

    const updated = currentComplaints.map(c => c.id === complaintId ? updatedComplaint : c);
    setComplaints(updated);
    saveStoredComplaints(updated);

    addAuditLog('Status Updated', officerId, `Complaint #${complaintId} changed to ${status}: ${remark}`);

    // Notify citizen
    if (complaint.userId) {
      const messages = {
        'In Progress': `⚙️ Your grievance "${complaint.title}" is now actively being worked on by ${actorName}.`,
        Resolved: `✅ Your grievance "${complaint.title}" has been marked as Resolved. Please review and provide feedback.`,
        Escalated: `🔺 Your grievance "${complaint.title}" has been escalated to higher departmental authority.`,
        Closed: `🔒 Your grievance "${complaint.title}" has been verified and closed.`,
      };
      if (messages[status]) {
        addNotification(complaint.userId, messages[status], complaintId);
      }
    }
  };

  // ── Manual Escalation ────────────────────────────────────────────────────
  const escalateComplaint = async (complaintId, manualRemark = '') => {
    const currentComplaints = getStoredComplaints();
    const complaint = currentComplaints.find(c => c.id === complaintId);
    if (!complaint) return;

    const workflow = workflowsRef.current.find(w => w.deptId === complaint.deptId);
    const currentLevel = complaint.escalationLevel || 1;
    let nextOfficer = null;
    let newLevel = currentLevel;
    let remark = manualRemark;

    if (workflow && currentLevel < workflow.levels.length) {
      const nextRoleId = workflow.levels[currentLevel];
      nextOfficer = usersRef.current.find(
        u => u.roleId === nextRoleId && u.deptId === complaint.deptId && u.status !== 'inactive'
      ) || usersRef.current.find(
        u => u.roleId === nextRoleId && u.status !== 'inactive'
      );
      newLevel = currentLevel + 1;
      remark = remark || `Manually escalated to Level ${newLevel} (${nextOfficer?.name || 'Higher Authority'})`;
    } else {
      remark = remark || `Escalated to Top Authority / State Oversight for urgent review`;
    }

    const now = new Date().toISOString();
    const updatedComplaint = {
      ...complaint,
      escalationLevel: newLevel,
      assignedOfficerId: nextOfficer?.id || complaint.assignedOfficerId,
      assignedOfficerName: nextOfficer?.name || complaint.assignedOfficerName,
      status: 'Escalated',
      updatedAt: now,
      timeline: [
        ...complaint.timeline,
        {
          status: 'Escalated',
          remark,
          timestamp: now,
          user: 'Manual Escalation',
        },
      ],
    };

    const updated = currentComplaints.map(c => c.id === complaintId ? updatedComplaint : c);
    setComplaints(updated);
    saveStoredComplaints(updated);

    addAuditLog('Complaint Escalated', complaint.assignedOfficerId, `Complaint #${complaintId} escalated to Level ${newLevel}`);

    if (nextOfficer) {
      addNotification(nextOfficer.id, `🔺 Escalated Grievance Assigned: "${complaint.title}" requires your action.`, complaintId);
    }
    if (complaint.userId) {
      addNotification(complaint.userId, `Your grievance "${complaint.title}" has been escalated to senior authority.`, complaintId);
    }
  };

  // ── Send Chat Message on Grievance ──────────────────────────────────────
  const addComplaintMessage = async (complaintId, messageText, sender) => {
    const currentComplaints = getStoredComplaints();
    const complaint = currentComplaints.find(c => c.id === complaintId);
    if (!complaint || !messageText.trim()) return;

    const newMessage = {
      id: `m-${Date.now()}`,
      senderId: sender.id || sender.uid,
      senderName: sender.name || 'User',
      senderRole: sender.roleId === 'role-citizen' ? 'Citizen' : 'Officer',
      text: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...(complaint.messages || []), newMessage];
    const updatedComplaint = {
      ...complaint,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };

    const updated = currentComplaints.map(c => c.id === complaintId ? updatedComplaint : c);
    setComplaints(updated);
    saveStoredComplaints(updated);

    // Notify other party
    if (sender.id === complaint.userId) {
      if (complaint.assignedOfficerId) {
        addNotification(complaint.assignedOfficerId, `💬 Citizen message on #${complaint.id}: "${messageText.slice(0, 50)}..."`, complaintId);
      }
    } else {
      if (complaint.userId) {
        addNotification(complaint.userId, `💬 Officer response on #${complaint.id}: "${messageText.slice(0, 50)}..."`, complaintId);
      }
    }
  };

  // ── Citizen Satisfaction Rating ─────────────────────────────────────────
  const rateComplaint = async (complaintId, rating, feedback) => {
    const currentComplaints = getStoredComplaints();
    const complaint = currentComplaints.find(c => c.id === complaintId);
    if (!complaint) return;

    const now = new Date().toISOString();
    const updatedComplaint = {
      ...complaint,
      status: 'Closed',
      rating,
      feedback,
      updatedAt: now,
      timeline: [
        ...complaint.timeline,
        {
          status: 'Closed',
          remark: `Citizen closed grievance with ${rating} ★ rating. Feedback: "${feedback || 'No comments'}"`,
          timestamp: now,
          user: complaint.citizenName || 'Citizen',
        },
      ],
    };

    const updated = currentComplaints.map(c => c.id === complaintId ? updatedComplaint : c);
    setComplaints(updated);
    saveStoredComplaints(updated);

    addAuditLog('Complaint Closed', complaint.userId, `Complaint #${complaintId} verified and rated ${rating}★ by citizen`);
  };

  // ── Auto SLA Escalation Engine ──────────────────────────────────────────
  useEffect(() => {
    const checkSlaBreaches = () => {
      const now = dayjs();
      const currentList = getStoredComplaints();
      let hasChanges = false;

      const updated = currentList.map(c => {
        if (
          !['Resolved', 'Closed', 'Rejected'].includes(c.status) &&
          c.slaDeadline &&
          now.isAfter(dayjs(c.slaDeadline)) &&
          !c.slaAutoEscalated
        ) {
          hasChanges = true;
          const workflow = workflowsRef.current.find(w => w.deptId === c.deptId);
          const currentLevel = c.escalationLevel || 1;
          let nextOfficer = null;
          let newLevel = currentLevel;

          if (workflow && currentLevel < workflow.levels.length) {
            const nextRoleId = workflow.levels[currentLevel];
            nextOfficer = usersRef.current.find(
              u => u.roleId === nextRoleId && u.deptId === c.deptId && u.status !== 'inactive'
            ) || usersRef.current.find(
              u => u.roleId === nextRoleId && u.status !== 'inactive'
            );
            newLevel = currentLevel + 1;
          }

          const remark = `SLA Threshold Breached! Auto-escalated to Level ${newLevel} (${nextOfficer?.name || 'Higher Authority'})`;

          return {
            ...c,
            status: 'Escalated',
            escalationLevel: newLevel,
            assignedOfficerId: nextOfficer?.id || c.assignedOfficerId,
            assignedOfficerName: nextOfficer?.name || c.assignedOfficerName,
            slaAutoEscalated: true,
            updatedAt: now.toISOString(),
            timeline: [
              ...c.timeline,
              {
                status: 'Escalated',
                remark,
                timestamp: now.toISOString(),
                user: 'Auto SLA Engine',
                auto: true,
              },
            ],
          };
        }
        return c;
      });

      if (hasChanges) {
        setComplaints(updated);
        saveStoredComplaints(updated);
      }
    };

    checkSlaBreaches();
    const interval = setInterval(checkSlaBreaches, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ComplaintContext.Provider value={{
      complaints,
      addComplaint,
      updateComplaintStatus,
      escalateComplaint,
      addComplaintMessage,
      rateComplaint,
      auditLogs,
      notifications,
      markAsRead,
      markAllNotificationsRead,
      addAuditLog,
      addNotification,
      loading,
    }}>
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaints = () => useContext(ComplaintContext);
