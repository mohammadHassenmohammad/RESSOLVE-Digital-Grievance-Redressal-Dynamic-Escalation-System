import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../utils/firebase';
import { useSystemData } from './SystemDataContext';
import {
  getActiveUserSession,
  setActiveUserSession,
  clearActiveUserSession,
  getStoredUsers,
  saveStoredUsers,
} from '../utils/persistentStorage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { roles, users, saveUser } = useSystemData();
  const [user, setUser] = useState(() => getActiveUserSession());
  const [loading, setLoading] = useState(false);

  // Derive active user's role
  const userRole = user ? roles.find(r => r.id === user.roleId) : null;

  // Listen for storage events (e.g., active user updated from persona switcher)
  useEffect(() => {
    const handleStorageUpdate = (e) => {
      if (e?.detail?.key === 'ressolve_active_user_v2' || !e?.detail?.key) {
        const session = getActiveUserSession();
        setUser(session);
      }
    };
    window.addEventListener('ressolve_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('ressolve_storage_update', handleStorageUpdate);
  }, []);

  // Firebase Auth sync in background if signed in
  useEffect(() => {
    try {
      const unsub = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          const currentUsers = getStoredUsers();
          const match = currentUsers.find(u => u.email?.toLowerCase() === fbUser.email?.toLowerCase());
          if (match) {
            const enriched = { ...match, uid: fbUser.uid };
            setUser(enriched);
            setActiveUserSession(enriched);
          }
        }
      });
      return () => unsub();
    } catch (e) {
      // Ignored
    }
  }, []);

  // Login handler with dual Firebase + Local Failover
  const login = async (email, password) => {
    setLoading(true);
    const cleanEmail = (email || '').trim().toLowerCase();
    const allUsers = getStoredUsers();

    // Find in local users
    const matchedUser = allUsers.find(u => u.email?.toLowerCase() === cleanEmail);

    // Try Firebase Auth
    let fbSuccess = false;
    let fbUid = null;
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      fbSuccess = true;
      fbUid = cred.user.uid;
    } catch (fbErr) {
      // Firebase failed or credentials rejected, proceed to local check
    }

    if (matchedUser) {
      // Allow matching if password matches or standard demo format
      const validPass = !matchedUser.password || matchedUser.password === password || password === 'Demo@123' || password === 'Admin@123';
      if (validPass || fbSuccess) {
        const userSession = {
          ...matchedUser,
          uid: fbUid || matchedUser.id,
        };
        setUser(userSession);
        setActiveUserSession(userSession);
        setLoading(false);
        return { success: true, roleId: matchedUser.roleId, user: userSession };
      }
    }

    // If Firebase succeeded but not in local store, create entry
    if (fbSuccess) {
      const newUser = {
        id: fbUid,
        uid: fbUid,
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        roleId: 'role-citizen',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      await saveUser(newUser);
      setUser(newUser);
      setActiveUserSession(newUser);
      setLoading(false);
      return { success: true, roleId: 'role-citizen', user: newUser };
    }

    setLoading(false);
    return {
      success: false,
      error: 'Invalid email or password. You can also use the Quick Demo Login buttons below.',
    };
  };

  // Instant Persona Switcher
  const switchPersona = (targetUserOrId) => {
    let target = null;
    const allUsers = getStoredUsers();
    if (typeof targetUserOrId === 'string') {
      target = allUsers.find(u => u.id === targetUserOrId || u.email === targetUserOrId || u.roleId === targetUserOrId);
    } else {
      target = targetUserOrId;
    }

    if (target) {
      const session = { ...target, uid: target.id };
      setUser(session);
      setActiveUserSession(session);
      return session;
    }
    return null;
  };

  // Register new citizen
  const register = async (email, password, name, phone = '') => {
    setLoading(true);
    const cleanEmail = (email || '').trim().toLowerCase();
    const allUsers = getStoredUsers();

    if (allUsers.some(u => u.email?.toLowerCase() === cleanEmail)) {
      setLoading(false);
      return { success: false, error: 'An account with this email already exists. Please log in.' };
    }

    const newId = `u-${Date.now()}`;
    const newUser = {
      id: newId,
      uid: newId,
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      password,
      phone,
      roleId: 'role-citizen',
      deptId: null,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    // Save locally
    const updatedUsers = [...allUsers, newUser];
    saveStoredUsers(updatedUsers);

    // Set active session
    setUser(newUser);
    setActiveUserSession(newUser);

    // Try Firebase create in background
    try {
      await createUserWithEmailAndPassword(auth, cleanEmail, password);
    } catch (e) {
      // Ignored
    }

    setLoading(false);
    return { success: true, user: newUser };
  };

  // Logout
  const logout = async () => {
    setUser(null);
    clearActiveUserSession();
    try {
      await signOut(auth);
    } catch (e) {
      // Ignored
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userRole,
      login,
      logout,
      register,
      switchPersona,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
