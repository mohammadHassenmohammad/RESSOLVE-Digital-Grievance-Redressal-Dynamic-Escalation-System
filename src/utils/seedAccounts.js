/**
 * seedAccounts.js
 *
 * One-time utility that creates Firebase Auth accounts for every demo role
 * and writes matching Firestore user documents.
 * It stores a flag in systemConfig/accounts so it only runs once ever.
 */

import {
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  writeBatch,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, secondaryAuth } from './firebase';

/** All demo accounts to create, one per role across every department */
export const DEMO_ACCOUNTS = [
  // ── Admin ──────────────────────────────────────────────────────────────
  {
    email: 'admin@system.com',
    password: 'Admin@123',
    name: 'John Admin',
    roleId: 'role-admin',
    deptId: null,
  },
  // ── Hostel (dept-1) ────────────────────────────────────────────────────
  {
    email: 'alice@hostel.com',
    password: 'Alice@123',
    name: 'Alice Warden',
    roleId: 'role-warden',
    deptId: 'dept-1',
  },
  {
    email: 'principal@hostel.com',
    password: 'Principal@123',
    name: 'Henry Principal',
    roleId: 'role-principal',
    deptId: 'dept-1',
  },
  {
    email: 'dean@hostel.com',
    password: 'Dean@123',
    name: 'Diana Dean',
    roleId: 'role-dean',
    deptId: 'dept-1',
  },
  // ── Revenue (dept-2) ───────────────────────────────────────────────────
  {
    email: 'vro@revenue.com',
    password: 'Vro@12345',
    name: 'Victor VRO',
    roleId: 'role-vro',
    deptId: 'dept-2',
  },
  {
    email: 'dave@govt.com',
    password: 'Dave@1234',
    name: 'Dave MRO',
    roleId: 'role-mro',
    deptId: 'dept-2',
  },
  {
    email: 'collector@revenue.com',
    password: 'Collect@123',
    name: 'Cathy Collector',
    roleId: 'role-collector',
    deptId: 'dept-2',
  },
  // ── Municipal (dept-3) ─────────────────────────────────────────────────
  {
    email: 'carol@municipal.com',
    password: 'Carol@123',
    name: 'Carol Inspector',
    roleId: 'role-inspector',
    deptId: 'dept-3',
  },
  {
    email: 'commissioner@municipal.com',
    password: 'Commiss@123',
    name: 'Mike Commissioner',
    roleId: 'role-commissioner',
    deptId: 'dept-3',
  },
  // ── Health (dept-4) ────────────────────────────────────────────────────
  {
    email: 'eve@health.com',
    password: 'Eve@12345',
    name: 'Eve Medical',
    roleId: 'role-doctor',
    deptId: 'dept-4',
  },
  {
    email: 'director@health.com',
    password: 'Direct@123',
    name: 'Sam Director',
    roleId: 'role-health-director',
    deptId: 'dept-4',
  },
  // ── Transport (dept-5) ─────────────────────────────────────────────────
  {
    email: 'frank@transport.com',
    password: 'Frank@123',
    name: 'Frank MVI',
    roleId: 'role-mvi',
    deptId: 'dept-5',
  },
  {
    email: 'rto@transport.com',
    password: 'Rto@123456',
    name: 'Rachel RTO',
    roleId: 'role-rto',
    deptId: 'dept-5',
  },
  // ── Citizen ────────────────────────────────────────────────────────────
  {
    email: 'bob@gmail.com',
    password: 'Bob@12345',
    name: 'Bob Citizen',
    roleId: 'role-citizen',
    deptId: null,
  },
  {
    email: 'sara@gmail.com',
    password: 'Sara@1234',
    name: 'Sara Student',
    roleId: 'role-citizen',
    deptId: null,
  },
];

/**
 * Attempts to create a single Firebase Auth account + Firestore user doc.
 * Silently skips if the account already exists (auth/email-already-in-use).
 */
const createAccount = async (account) => {
  try {
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      account.email,
      account.password
    );
    const uid = cred.user.uid;

    await setDoc(doc(db, 'users', uid), {
      name: account.name,
      email: account.email,
      roleId: account.roleId,
      deptId: account.deptId || null,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // Sign out from secondaryAuth so main session is untouched
    await signOut(secondaryAuth);

    console.log(`✔ Created account: ${account.email}`);
    return uid;
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log(`↳ Already exists: ${account.email}`);
    } else {
      console.error(`✘ Failed to create ${account.email}:`, err.message);
    }
    return null;
  }
};

/**
 * Main entry point – call this once during app bootstrap.
 * Checks systemConfig/accounts flag before doing anything.
 */
export const seedSampleComplaints = async () => {
  try {
    const complaintsSnap = await getDocs(collection(db, 'complaints'));
    const auditLogsSnap = await getDocs(collection(db, 'auditLogs'));
    
    // Check if we already have seeded complaints AND audit logs
    if (complaintsSnap.size > 1 && auditLogsSnap.size > 5) {
      console.log('Sample complaints and audit logs already exist – skipping complaint seeding.');
      return;
    }

    console.log('Clearing old complaints and audit logs for a clean seed...');
    for (const d of complaintsSnap.docs) {
      await deleteDoc(doc(db, 'complaints', d.id));
    }
    for (const d of auditLogsSnap.docs) {
      // Keep any manual logs that were added by system setup, but clear seeded ones
      if (d.data().details?.includes('submitted') || d.data().details?.includes('escalated') || d.data().details?.includes('status')) {
        await deleteDoc(doc(db, 'auditLogs', d.id));
      }
    }

    console.log('Seeding 17 sample complaints and corresponding audit logs...');
    
    // Fetch all users to map correct Firestore IDs
    const usersSnap = await getDocs(collection(db, 'users'));
    const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const bob = users.find(u => u.email === 'bob@gmail.com');
    const sara = users.find(u => u.email === 'sara@gmail.com');
    const defaultCitizenId = bob?.id || sara?.id || 'system-citizen';

    const getOfficerForDept = (deptId) => {
      if (deptId === 'dept-1') return users.find(u => u.roleId === 'role-warden');
      if (deptId === 'dept-2') return users.find(u => u.roleId === 'role-vro');
      if (deptId === 'dept-3') return users.find(u => u.roleId === 'role-inspector');
      if (deptId === 'dept-4') return users.find(u => u.roleId === 'role-doctor');
      if (deptId === 'dept-5') return users.find(u => u.roleId === 'role-mvi');
      return null;
    };

    const getEscalatedOfficerForDept = (deptId) => {
      if (deptId === 'dept-1') return users.find(u => u.roleId === 'role-principal');
      if (deptId === 'dept-2') return users.find(u => u.roleId === 'role-mro');
      if (deptId === 'dept-3') return users.find(u => u.roleId === 'role-commissioner');
      if (deptId === 'dept-4') return users.find(u => u.roleId === 'role-health-director');
      if (deptId === 'dept-5') return users.find(u => u.roleId === 'role-rto');
      return null;
    };

    const SAMPLE_COMPLAINTS_DATA = [
      {
        categoryId: 'cat-1',
        title: 'Poor hygiene in Hostel Mess 2',
        description: 'Cockroaches and dirty utensils observed in the student mess area during dinner.',
        priority: 'Critical',
        deptId: 'dept-1',
        status: 'Assigned',
      },
      {
        categoryId: 'cat-2',
        title: 'Geyser broken in Block C',
        description: 'Geyser in Block C first floor washroom is leaking and not heating water.',
        priority: 'Medium',
        deptId: 'dept-1',
        status: 'Assigned',
      },
      {
        categoryId: 'cat-7',
        title: 'Room change request due to medical condition',
        description: 'Requested shift to ground floor room due to leg injury.',
        priority: 'Low',
        deptId: 'dept-1',
        status: 'Pending',
      },
      {
        categoryId: 'cat-8',
        title: 'Block B wifi offline',
        description: 'Entire block B has had no wireless connection for over 24 hours.',
        priority: 'High',
        deptId: 'dept-1',
        status: 'In Progress',
      },
      {
        categoryId: 'cat-3',
        title: 'Illegal encroachment of survey land 45',
        description: 'Unauthorised fence built overnight on community property.',
        priority: 'Critical',
        deptId: 'dept-2',
        status: 'Escalated',
      },
      {
        categoryId: 'cat-9',
        title: 'Double taxation error on online portal',
        description: 'System showing pending dues despite payment receipts available.',
        priority: 'Low',
        deptId: 'dept-2',
        status: 'Resolved',
      },
      {
        categoryId: 'cat-10',
        title: 'Commercial vendor blocking walkway',
        description: 'Local shop has extended its display onto the public pathway.',
        priority: 'Medium',
        deptId: 'dept-2',
        status: 'Assigned',
      },
      {
        categoryId: 'cat-4',
        title: 'Contaminated black water supply',
        description: 'Tap water in sector 4 smells like sewage and is black in color.',
        priority: 'Critical',
        deptId: 'dept-3',
        status: 'Assigned',
      },
      {
        categoryId: 'cat-5',
        title: 'Frequent power fluctuations',
        description: 'Voltage drops constantly damaging home appliances.',
        priority: 'High',
        deptId: 'dept-3',
        status: 'In Progress',
      },
      {
        categoryId: 'cat-11',
        title: 'Uncollected garbage dump at street corner',
        description: 'Garbage has not been cleared for 5 days, causing foul smell.',
        priority: 'Low',
        deptId: 'dept-3',
        status: 'Resolved',
      },
      {
        categoryId: 'cat-12',
        title: 'Dangerous open pothole on Main Road',
        description: 'Massive pothole near the bus stop is causing major traffic risks.',
        priority: 'Medium',
        deptId: 'dept-3',
        status: 'Assigned',
      },
      {
        categoryId: 'cat-6',
        title: 'Lack of attending doctors during night shift',
        description: 'Emergency room had no doctors present when patient arrived at midnight.',
        priority: 'Critical',
        deptId: 'dept-4',
        status: 'Escalated',
      },
      {
        categoryId: 'cat-13',
        title: 'Broken AC in ICU Ward 1',
        description: 'Air conditioning is non-functional in critical patient ward.',
        priority: 'Medium',
        deptId: 'dept-4',
        status: 'Assigned',
      },
      {
        categoryId: 'cat-14',
        title: 'Delayed ambulance response',
        description: 'Ambulance took 45 minutes to respond to a cardiac emergency call.',
        priority: 'High',
        deptId: 'dept-4',
        status: 'Resolved',
      },
      {
        categoryId: 'cat-15',
        title: 'Speeding public buses near school zone',
        description: 'Buses consistently bypass speed limits near St. Jude School.',
        priority: 'High',
        deptId: 'dept-5',
        status: 'Assigned',
      },
      {
        categoryId: 'cat-16',
        title: 'Delayed issuance of smart card license',
        description: 'It has been 3 months since driving test and smart card is not dispatched.',
        priority: 'Low',
        deptId: 'dept-5',
        status: 'Resolved',
      },
      {
        categoryId: 'cat-17',
        title: 'Overcrowding and safety hazard in route 21B',
        description: 'Route 21B buses allow double the capacity leading to dangerous boarding.',
        priority: 'Medium',
        deptId: 'dept-5',
        status: 'In Progress',
      },
    ];

    const now = new Date();

    for (const item of SAMPLE_COMPLAINTS_DATA) {
      const officer = getOfficerForDept(item.deptId);
      const escalatedOfficer = getEscalatedOfficerForDept(item.deptId);
      const citizenId = item.categoryId === 'cat-1' || item.categoryId === 'cat-8' ? defaultCitizenId : (sara?.id || defaultCitizenId);

      const slaDays = item.priority === 'Critical' ? 1 : item.priority === 'High' ? 2 : item.priority === 'Medium' ? 5 : 10;
      const slaDeadline = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000).toISOString();

      let assignedOfficerId = null;
      let escalationLevel = 1;
      let timeline = [
        { status: 'Submitted', timestamp: now.toISOString(), remark: 'Complaint registered successfully' },
      ];

      if (item.status === 'Pending') {
        timeline.push({ status: 'Pending', timestamp: now.toISOString(), remark: 'No officer available — pending assignment' });
      } else if (item.status === 'Assigned') {
        assignedOfficerId = officer?.id || null;
        timeline.push({ status: 'Assigned', timestamp: now.toISOString(), remark: `Assigned to ${officer?.name || 'Department Officer'}` });
      } else if (item.status === 'In Progress') {
        assignedOfficerId = officer?.id || null;
        timeline.push({ status: 'Assigned', timestamp: now.toISOString(), remark: `Assigned to ${officer?.name || 'Department Officer'}` });
        timeline.push({ status: 'In Progress', timestamp: now.toISOString(), remark: 'Officer has started investigating the grievance' });
      } else if (item.status === 'Resolved') {
        assignedOfficerId = officer?.id || null;
        timeline.push({ status: 'Assigned', timestamp: now.toISOString(), remark: `Assigned to ${officer?.name || 'Department Officer'}` });
        timeline.push({ status: 'In Progress', timestamp: now.toISOString(), remark: 'Officer has started investigating the grievance' });
        timeline.push({ status: 'Resolved', timestamp: now.toISOString(), remark: 'Issue resolved successfully. Verified by department.' });
      } else if (item.status === 'Escalated') {
        assignedOfficerId = escalatedOfficer?.id || officer?.id || null;
        escalationLevel = 2;
        timeline.push({ status: 'Assigned', timestamp: now.toISOString(), remark: `Assigned to ${officer?.name || 'Department Officer'}` });
        timeline.push({ status: 'Escalated', timestamp: now.toISOString(), remark: `Auto-escalated to ${escalatedOfficer?.name || 'Higher Officer'} — SLA deadline breached` });
      }

      const complaintDoc = {
        title: item.title,
        description: item.description,
        categoryId: item.categoryId,
        deptId: item.deptId,
        priority: item.priority,
        status: item.status,
        userId: citizenId,
        assignedOfficerId,
        escalationLevel,
        slaAutoEscalated: item.status === 'Escalated',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        slaDeadline,
        timeline,
      };

      const docRef = await addDoc(collection(db, 'complaints'), complaintDoc);
      console.log(`✔ Seeded complaint: "${item.title}"`);

      // Add audit log for complaint creation
      const officerName = officer?.name || 'Department Officer';
      await addDoc(collection(db, 'auditLogs'), {
        action: 'Complaint Created',
        userId: citizenId,
        details: `Complaint #${docRef.id} submitted — routed to ${officerName}`,
        timestamp: now.toISOString(),
      });

      // Add extra audit log steps depending on stage
      if (item.status === 'In Progress') {
        await addDoc(collection(db, 'auditLogs'), {
          action: 'Status Updated',
          userId: officer?.id || 'system',
          details: `Complaint #${docRef.id} status updated to "In Progress"`,
          timestamp: now.toISOString(),
        });
      } else if (item.status === 'Resolved') {
        await addDoc(collection(db, 'auditLogs'), {
          action: 'Status Updated',
          userId: officer?.id || 'system',
          details: `Complaint #${docRef.id} status updated to "Resolved"`,
          timestamp: now.toISOString(),
        });
      } else if (item.status === 'Escalated') {
        await addDoc(collection(db, 'auditLogs'), {
          action: 'Complaint Escalated',
          userId: officer?.id || 'system',
          details: `Complaint #${docRef.id} manually escalated to ${escalatedOfficer?.name || 'Higher Officer'}`,
          timestamp: now.toISOString(),
        });
      }
    }

    console.log('All 17 sample complaints and matching audit logs seeded successfully!');
  } catch (e) {
    console.error('Failed to seed sample complaints and audit logs:', e);
  }
};

export const seedDemoAccounts = async () => {
  try {
    const flagRef = doc(db, 'systemConfig', 'accounts');
    const flagSnap = await getDoc(flagRef);

    if (flagSnap.exists() && flagSnap.data()?.seeded) {
      console.log('Demo accounts already seeded – skipping.');
      // Still attempt to seed complaints if they are missing
      await seedSampleComplaints();
      return;
    }

    console.log('Seeding demo accounts for all roles...');

    for (const account of DEMO_ACCOUNTS) {
      await createAccount(account);
    }

    await setDoc(flagRef, { seeded: true, seededAt: new Date().toISOString() });
    console.log('All demo accounts created successfully!');
    
    // Seed complaints after accounts are guaranteed to be created
    await seedSampleComplaints();
  } catch (err) {
    console.error('seedDemoAccounts failed:', err);
  }
};
