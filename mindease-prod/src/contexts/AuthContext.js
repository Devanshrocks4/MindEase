import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, isFirebaseConfigured } from '../services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const ADMIN_EMAILS = [
  'admin@mindease.com',
  'admin@mind.com',
  'devansh@mindease.com',
  'jasica@kaur.com',
  'devansh@gupta.com',
];

const isAdminEmail = (email) =>
  ADMIN_EMAILS.includes((email || '').toLowerCase());

// Stable anonymous ID — persists across sessions
function getOrCreateAnonId() {
  let id = localStorage.getItem('mindease_user_id');
  if (!id) {
    id = 'User_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    localStorage.setItem('mindease_user_id', id);
  }
  return id;
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userId, setUserId]           = useState('');
  const [isAdmin, setIsAdmin]         = useState(false);
  const [loading, setLoading]         = useState(true);

  /* ─── Init ─────────────────────────────────────────────────────── */
  useEffect(() => {
    // Try to restore a demo-mode login
    const stored = localStorage.getItem('mindease_auth_user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setCurrentUser(u);
        setUserId(u.uid);
        setIsAdmin(isAdminEmail(u.email));
      } catch {}
    } else {
      setUserId(getOrCreateAnonId());
    }

    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setUserId(user.uid);
        setIsAdmin(isAdminEmail(user.email));
        localStorage.setItem('mindease_auth_user', JSON.stringify({ uid: user.uid, email: user.email, displayName: user.displayName }));
        localStorage.setItem('mindease_user_id', user.uid);
      } else {
        setIsAdmin(false);
        setUserId(getOrCreateAnonId());
        localStorage.removeItem('mindease_auth_user');
      }
      setLoading(false);
    });

    return unsub;
  }, []); // eslint-disable-line

  /* ─── Auth actions ──────────────────────────────────────────────── */
  const signup = async (email, password, displayName) => {
    if (!isFirebaseConfigured || !auth) {
      // Demo mode
      const uid  = 'demo_' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const user = { uid, email, displayName };
      setCurrentUser(user);
      setUserId(uid);
      localStorage.setItem('mindease_auth_user', JSON.stringify(user));
      localStorage.setItem('mindease_user_id', uid);
      return { user };
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(cred.user, { displayName });
    localStorage.setItem('mindease_user_id', cred.user.uid);
    return cred;
  };

  const login = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      // Demo credentials
      const DEMO_ADMIN = { 'jasica@kaur.com': 'jasicakaur', 'devansh@gupta.com': 'devanshgupta' };
      const uid  = (DEMO_ADMIN[email] === password ? 'admin_' : 'demo_') +
                   btoa(email).replace(/[^a-zA-Z0-9]/g, '').substr(0, 10);
      const user = { uid, email, displayName: email.split('@')[0] };
      setCurrentUser(user);
      setUserId(uid);
      setIsAdmin(isAdminEmail(email));
      localStorage.setItem('mindease_auth_user', JSON.stringify(user));
      localStorage.setItem('mindease_user_id', uid);
      return { user };
    }
    const cred = await signInWithEmailAndPassword(auth, email, password);
    localStorage.setItem('mindease_user_id', cred.user.uid);
    return cred;
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) await signOut(auth);
    setCurrentUser(null);
    setIsAdmin(false);
    localStorage.removeItem('mindease_auth_user');
    // Keep anon ID for continuity
    setUserId(getOrCreateAnonId());
  };

  const resetPassword = (email) => {
    if (!isFirebaseConfigured || !auth)
      throw new Error('Firebase not configured. Password reset unavailable in demo mode.');
    return sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = (updates) => {
    if (!isFirebaseConfigured || !auth)
      throw new Error('Firebase not configured.');
    return updateProfile(auth.currentUser, updates);
  };

  return (
    <AuthContext.Provider value={{
      currentUser, userId, isAdmin, loading,
      signup, login, logout, resetPassword, updateUserProfile,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
