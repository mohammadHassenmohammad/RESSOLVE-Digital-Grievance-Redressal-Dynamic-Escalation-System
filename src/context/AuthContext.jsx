import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';
import { useSystemData } from './SystemDataContext';
import { DEMO_ACCOUNTS } from '../utils/seedAccounts';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { roles } = useSystemData();

  const userRole = user ? roles.find(r => r.id === user.roleId) : null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

        // Self-healing: if Firestore record is missing, recreate it from DEMO_ACCOUNTS map
        if (!userDoc.exists()) {
          const email = firebaseUser.email;
          const demoMatch = DEMO_ACCOUNTS.find(a => a.email === email);

          const name = demoMatch?.name || firebaseUser.displayName || email.split('@')[0];
          const roleId = demoMatch?.roleId || 'role-citizen';
          const deptId = demoMatch?.deptId || null;

          try {
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              name,
              email,
              roleId,
              deptId,
              status: 'active',
              createdAt: new Date().toISOString(),
            });
            userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          } catch (e) {
            console.error('Failed to seed user metadata document:', e);
          }
        }

        if (userDoc.exists()) {
          setUser({ ...firebaseUser, ...userDoc.data() });
        } else {
          setUser({ ...firebaseUser, roleId: 'role-citizen' });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      let userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      let roleId = 'role-citizen';
      if (userDoc.exists()) {
        roleId = userDoc.data().roleId;
      } else {
        const demoMatch = DEMO_ACCOUNTS.find(a => a.email === email);
        if (demoMatch) roleId = demoMatch.roleId;
      }
      return { success: true, roleId };
    } catch (error) {
      console.error('Login Error:', error.message);
      return { success: false, error: error.message };
    }
  };

  const register = async (email, password, name) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', res.user.uid), {
        name,
        email,
        roleId: 'role-citizen',
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, userRole, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
