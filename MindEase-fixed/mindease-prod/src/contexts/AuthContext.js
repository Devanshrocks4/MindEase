// ─────────────────────────────────────────────────────────────────
//  src/contexts/AuthContext.js  (REPLACEMENT)
//
//  Changes vs your existing file:
//    • Removes the anon-id leakage to Firestore: `userId` exposed to
//      components is ONLY a Firebase UID when a real user is signed in.
//      An "anon_" id is still returned for local-only mode (no Firebase
//      writes will use it).
//    • Records a logout activity row so the admin panel sees session
//      end times, not just logins.
//    • Robustness: marks isActive=false on logout, traps Firestore errors
//      so failures NEVER break the auth UI.
// ─────────────────────────────────────────────────────────────────
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, isFirebaseConfigured, db } from '../services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  collection,
} from 'firebase/firestore';
import { recordLoginActivity } from '../services/firebaseService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Keep this list in sync with firestore.rules → isAdmin()
const ADMIN_EMAILS = [
  'admin@mindease.com',
  'admin@mind.com',
  'devansh@mindease.com',
  'jasica@kaur.com',
  'devansh@gupta.com',
];

const isAdminEmail = (email) => ADMIN_EMAILS.includes((email || '').toLowerCase());

// Anonymous id is ONLY used for local-state continuity (e.g. demo mode).
// It is NEVER written to Firestore — saveResults guards against that.
function getOrCreateAnonId() {
  let id = localStorage.getItem('mindease_user_id');
  if (!id) {
    id = 'anon_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    localStorage.setItem('mindease_user_id', id);
  }
  return id;
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userId,      setUserId]      = useState('');
  const [isAdmin,     setIsAdmin]     = useState(false);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    // Quick optimistic restore from localStorage (saves a flash of unauth UI).
    const stored = localStorage.getItem('mindease_auth_user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u?.uid) {
          setCurrentUser(u);
          setUserId(u.uid);
          setIsAdmin(isAdminEmail(u.email));
        }
      } catch { /* ignore */ }
    } else {
      // Demo / not-signed-in: use an anon id for local-only operations.
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
        localStorage.setItem('mindease_auth_user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        }));
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

  const signup = async (email, password, displayName) => {
    if (!isFirebaseConfigured || !auth) {
      const uid  = 'anon_' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const user = { uid, email, displayName };
      setCurrentUser(user);
      setUserId(uid);
      localStorage.setItem('mindease_auth_user', JSON.stringify(user));
      localStorage.setItem('mindease_user_id', uid);
      return { user };
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(cred.user, { displayName });

    // /users/{uid} must exist BEFORE any other write, because the rules
    // for assessments/loginActivities check the auth uid only.
    if (db) {
      try {
        await setDoc(doc(db, 'users', cred.user.uid), {
          email:       cred.user.email,
          displayName: displayName || email.split('@')[0],
          role:        'user',
          isActive:    true,
          loginCount:  1,
          lastLogin:   serverTimestamp(),
          createdAt:   serverTimestamp(),
          updatedAt:   serverTimestamp(),
        });
      } catch (e) {
        console.warn('[Auth] signup users/{uid} write failed (rules?):', e.code, e.message);
      }
    }

    try {
      await recordLoginActivity(
        cred.user.uid,
        cred.user.email,
        displayName || email.split('@')[0],
      );
    } catch (e) {
      console.warn('[Auth] signup loginActivity failed:', e.code, e.message);
    }

    localStorage.setItem('mindease_user_id', cred.user.uid);
    return cred;
  };

  const login = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      const DEMO_ADMIN = { 'jasica@kaur.com': 'jasicakaur', 'devansh@gupta.com': 'devanshgupta' };
      const uid  = (DEMO_ADMIN[email] === password ? 'admin_' : 'anon_') +
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

    try {
      await recordLoginActivity(
        cred.user.uid,
        cred.user.email,
        cred.user.displayName || cred.user.email.split('@')[0],
      );
    } catch (e) {
      console.warn('[Auth] login activity write failed:', e.code, e.message);
    }

    return cred;
  };

  const logout = async () => {
    // Best-effort: record a logout event + flip isActive=false. Never block.
    try {
      if (isFirebaseConfigured && db && auth?.currentUser?.uid) {
        const uid = auth.currentUser.uid;
        await updateDoc(doc(db, 'users', uid), {
          isActive: false,
          lastLogout: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(() => {});
        await addDoc(collection(db, 'loginActivities'), {
          userId: uid,
          userEmail: auth.currentUser.email || '',
          userName: auth.currentUser.displayName || '',
          eventType: 'logout',
          loginTime: serverTimestamp(),
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('[Auth] logout side-effects failed:', e?.message);
    }

    if (isFirebaseConfigured && auth) await signOut(auth);
    setCurrentUser(null);
    setIsAdmin(false);
    localStorage.removeItem('mindease_auth_user');
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
