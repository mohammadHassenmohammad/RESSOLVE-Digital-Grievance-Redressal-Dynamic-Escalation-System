import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initPersistentStore,
  getStoredDepartments,
  getStoredCategories,
  getStoredRoles,
  getStoredWorkflows,
  saveStoredWorkflows,
  getStoredUsers,
  saveStoredUsers,
} from '../utils/persistentStorage';
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';

const SystemDataContext = createContext();

export const SystemDataProvider = ({ children }) => {
  // Ensure storage is initialized
  initPersistentStore();

  const [departments, setDepartments] = useState(() => getStoredDepartments());
  const [categories, setCategories] = useState(() => getStoredCategories());
  const [roles, setRoles] = useState(() => getStoredRoles());
  const [workflows, setWorkflows] = useState(() => getStoredWorkflows());
  const [users, setUsers] = useState(() => getStoredUsers());
  const [loading, setLoading] = useState(false);
  const [isFirebaseLive, setIsFirebaseLive] = useState(false);

  // Sync state whenever local storage updates
  const reloadFromStorage = useCallback(() => {
    setDepartments(getStoredDepartments());
    setCategories(getStoredCategories());
    setRoles(getStoredRoles());
    setWorkflows(getStoredWorkflows());
    setUsers(getStoredUsers());
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      reloadFromStorage();
    };
    window.addEventListener('ressolve_storage_update', handleUpdate);
    return () => window.removeEventListener('ressolve_storage_update', handleUpdate);
  }, [reloadFromStorage]);

  // Optional background Firebase sync (graceful failure without breaking the app)
  useEffect(() => {
    let unsubs = [];
    try {
      const uWf = onSnapshot(collection(db, 'workflows'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setWorkflows(list);
          saveStoredWorkflows(list);
          setIsFirebaseLive(true);
        }
      }, (err) => {
        // Fallback to local store silently on permission or network issues
        console.info('Operating in Local Active Store mode (Firestore read restricted):', err.code || err.message);
      });
      unsubs.push(uWf);

      const uUsers = onSnapshot(collection(db, 'users'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Merge with canonical users so none are lost
          const current = getStoredUsers();
          const merged = [...current];
          list.forEach(u => {
            const idx = merged.findIndex(m => m.id === u.id || m.email === u.email);
            if (idx >= 0) merged[idx] = { ...merged[idx], ...u };
            else merged.push(u);
          });
          setUsers(merged);
          saveStoredUsers(merged);
        }
      }, () => {});
      unsubs.push(uUsers);
    } catch (e) {
      console.info('Firestore listeners bypassed, local store active.');
    }

    return () => {
      unsubs.forEach(u => typeof u === 'function' && u());
    };
  }, []);

  // CRUD for Workflows
  const saveWorkflow = async (workflow) => {
    const current = getStoredWorkflows();
    const idx = current.findIndex(w => w.id === workflow.id);
    let updated;
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = workflow;
    } else {
      updated = [...current, workflow];
    }
    setWorkflows(updated);
    saveStoredWorkflows(updated);

    // Background push to Firebase if possible
    try {
      await setDoc(doc(db, 'workflows', workflow.id), workflow, { merge: true });
    } catch (e) {
      // Ignored - local store is already persistent
    }
  };

  const deleteWorkflow = async (wfId) => {
    const current = getStoredWorkflows();
    const updated = current.filter(w => w.id !== wfId);
    setWorkflows(updated);
    saveStoredWorkflows(updated);

    try {
      await deleteDoc(doc(db, 'workflows', wfId));
    } catch (e) {
      // Ignored
    }
  };

  // CRUD for Users
  const saveUser = async (userObj) => {
    const current = getStoredUsers();
    const idx = current.findIndex(u => u.id === userObj.id || u.email === userObj.email);
    let updated;
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...updated[idx], ...userObj, updatedAt: new Date().toISOString() };
    } else {
      const newUser = {
        id: userObj.id || `u-${Date.now()}`,
        status: 'active',
        createdAt: new Date().toISOString(),
        ...userObj,
      };
      updated = [...current, newUser];
    }
    setUsers(updated);
    saveStoredUsers(updated);

    try {
      await setDoc(doc(db, 'users', userObj.id || `u-${Date.now()}`), userObj, { merge: true });
    } catch (e) {
      // Ignored
    }
    return userObj;
  };

  const deleteUser = async (userId) => {
    const current = getStoredUsers();
    const updated = current.filter(u => u.id !== userId);
    setUsers(updated);
    saveStoredUsers(updated);

    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (e) {
      // Ignored
    }
  };

  const toggleUserStatus = async (userId) => {
    const current = getStoredUsers();
    const target = current.find(u => u.id === userId);
    if (!target) return;
    const newStatus = target.status === 'active' ? 'inactive' : 'active';
    const updated = current.map(u => u.id === userId ? { ...u, status: newStatus } : u);
    setUsers(updated);
    saveStoredUsers(updated);

    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
    } catch (e) {
      // Ignored
    }
  };

  return (
    <SystemDataContext.Provider value={{
      departments,
      categories,
      roles,
      workflows,
      users,
      loading,
      isFirebaseLive,
      saveWorkflow,
      deleteWorkflow,
      saveUser,
      deleteUser,
      toggleUserStatus,
      reloadFromStorage,
    }}>
      {children}
    </SystemDataContext.Provider>
  );
};

export const useSystemData = () => useContext(SystemDataContext);
