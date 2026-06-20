import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, getDocs, writeBatch, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { DEPARTMENTS, CATEGORIES, ROLES, WORKFLOWS } from '../data/mockData';
import { seedDemoAccounts, seedSampleComplaints } from '../utils/seedAccounts';

const SystemDataContext = createContext();

// All canonical workflows, roles, and categories to ensure are in the DB
const CANONICAL_ROLES = ROLES;
const CANONICAL_WORKFLOWS = WORKFLOWS;
const CANONICAL_CATEGORIES = CATEGORIES;
const CANONICAL_DEPARTMENTS = DEPARTMENTS;

export const SystemDataProvider = ({ children }) => {
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [roles, setRoles] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsubscribers = [];

    const initialize = async () => {
      try {
        const configRef = doc(db, 'systemConfig', 'seeding');
        const configSnap = await getDoc(configRef);

        if (!configSnap.exists() && active) {
          console.log('Database not seeded. Running first-time seeding...');
          const collectionsToSeed = [
            { name: 'departments', data: CANONICAL_DEPARTMENTS },
            { name: 'categories', data: CANONICAL_CATEGORIES },
            { name: 'roles', data: CANONICAL_ROLES },
            { name: 'workflows', data: CANONICAL_WORKFLOWS },
          ];

          for (const col of collectionsToSeed) {
            const snap = await getDocs(collection(db, col.name));
            if (snap.empty && active) {
              console.log(`Seeding Firestore collection: ${col.name}`);
              const batch = writeBatch(db);
              col.data.forEach(item => {
                const docRef = doc(db, col.name, item.id);
                batch.set(docRef, item);
              });
              await batch.commit();
            }
          }

          if (active) {
            await setDoc(configRef, { seeded: true, version: 2 });
            console.log('Database seeding completed.');
          }
        } else {
          // Already seeded – run migration to add any missing records (idempotent)
          if (active) {
            console.log('Running migration check for missing roles, workflows, and categories...');

            // 1. Migrate missing roles
            const rolesSnap = await getDocs(collection(db, 'roles'));
            const existingRoleIds = rolesSnap.docs.map(d => d.id);
            const rolesBatch = writeBatch(db);
            let rolesMigrationNeeded = false;
            CANONICAL_ROLES.forEach(r => {
              if (!existingRoleIds.includes(r.id)) {
                rolesMigrationNeeded = true;
                rolesBatch.set(doc(db, 'roles', r.id), r);
              }
            });
            if (rolesMigrationNeeded) {
              console.log('Migrating missing roles...');
              await rolesBatch.commit();
            }

            // 2. Migrate missing workflows
            const wfsSnap = await getDocs(collection(db, 'workflows'));
            const existingWfIds = wfsSnap.docs.map(d => d.id);
            const wfsBatch = writeBatch(db);
            let wfsMigrationNeeded = false;
            CANONICAL_WORKFLOWS.forEach(w => {
              if (!existingWfIds.includes(w.id)) {
                wfsMigrationNeeded = true;
                wfsBatch.set(doc(db, 'workflows', w.id), w);
              }
            });
            if (wfsMigrationNeeded) {
              console.log('Migrating missing workflows...');
              await wfsBatch.commit();
            }

            // 3. Migrate missing categories
            const catsSnap = await getDocs(collection(db, 'categories'));
            const existingCatIds = catsSnap.docs.map(d => d.id);
            const catsBatch = writeBatch(db);
            let catsMigrationNeeded = false;
            CANONICAL_CATEGORIES.forEach(c => {
              if (!existingCatIds.includes(c.id)) {
                catsMigrationNeeded = true;
                catsBatch.set(doc(db, 'categories', c.id), c);
              }
            });
            if (catsMigrationNeeded) {
              console.log('Migrating missing categories...');
              await catsBatch.commit();
            }

            // 4. Migrate missing departments
            const deptsSnap = await getDocs(collection(db, 'departments'));
            const existingDeptIds = deptsSnap.docs.map(d => d.id);
            const deptsBatch = writeBatch(db);
            let deptsMigrationNeeded = false;
            CANONICAL_DEPARTMENTS.forEach(d => {
              if (!existingDeptIds.includes(d.id)) {
                deptsMigrationNeeded = true;
                deptsBatch.set(doc(db, 'departments', d.id), d);
              }
            });
            if (deptsMigrationNeeded) {
              console.log('Migrating missing departments...');
              await deptsBatch.commit();
            }
          }
        }
      } catch (err) {
        console.error('Seeding/migration check failed: ', err);
      }

      // Always ensure demo Auth accounts exist (idempotent – skips if already done)
      if (active) {
        seedDemoAccounts().catch(e => console.error('Account seeding error:', e));
        seedSampleComplaints().catch(e => console.error('Complaint seeding error:', e));
      }

      if (!active) return;

      // Set up real-time snapshot listeners
      const uDepts = onSnapshot(
        collection(db, 'departments'),
        snap => setDepartments(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        err => console.error('Error fetching departments:', err)
      );
      unsubscribers.push(uDepts);

      const uCats = onSnapshot(
        collection(db, 'categories'),
        snap => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        err => console.error('Error fetching categories:', err)
      );
      unsubscribers.push(uCats);

      const uRoles = onSnapshot(
        collection(db, 'roles'),
        snap => setRoles(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        err => console.error('Error fetching roles:', err)
      );
      unsubscribers.push(uRoles);

      const uWfs = onSnapshot(
        collection(db, 'workflows'),
        async snap => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          if (list.length === 0 && active) {
            // Workflows collection was wiped – re-seed all 5 canonical workflows
            console.log('No workflows found. Re-seeding all canonical workflows...');
            try {
              const batch = writeBatch(db);
              CANONICAL_WORKFLOWS.forEach(w => {
                batch.set(doc(db, 'workflows', w.id), w);
              });
              await batch.commit();
            } catch (e) {
              console.error('Failed to re-seed workflows:', e);
            }
          } else {
            setWorkflows(list);
          }
        },
        err => console.error('Error fetching workflows:', err)
      );
      unsubscribers.push(uWfs);

      const uUsers = onSnapshot(
        collection(db, 'users'),
        snap => {
          setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setLoading(false);
        },
        err => {
          console.error('Error fetching users:', err);
          setLoading(false);
        }
      );
      unsubscribers.push(uUsers);
    };

    initialize();

    return () => {
      active = false;
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  return (
    <SystemDataContext.Provider value={{
      departments,
      categories,
      roles,
      workflows,
      users,
      loading,
    }}>
      {children}
    </SystemDataContext.Provider>
  );
};

export const useSystemData = () => useContext(SystemDataContext);
