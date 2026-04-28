// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { auth, isFirebaseConfigured, db } from '../services/firebase';
// import {
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   signOut,
//   onAuthStateChanged,
//   sendPasswordResetEmail,
//   updateProfile,
// } from 'firebase/auth';
// import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// const AuthContext = createContext(null);

// export const useAuth = () => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth must be used within AuthProvider');
//   return ctx;
// };

// const ADMIN_EMAILS = [
//   'admin@mindease.com',
//   'admin@mind.com',
//   'devansh@mindease.com',
//   'jasica@kaur.com',
//   'devansh@gupta.com',
// ];

// const isAdminEmail = (email) =>
//   ADMIN_EMAILS.includes((email || '').toLowerCase());

// // Stable anonymous ID — persists across sessions
// function getOrCreateAnonId() {
//   let id = localStorage.getItem('mindease_user_id');
//   if (!id) {
//     id = 'User_' + Math.random().toString(36).substr(2, 9).toUpperCase();
//     localStorage.setItem('mindease_user_id', id);
//   }
//   return id;
// }

// export const AuthProvider = ({ children }) => {
//   const [currentUser, setCurrentUser] = useState(null);
//   const [userId, setUserId]           = useState('');
//   const [isAdmin, setIsAdmin]         = useState(false);
//   const [loading, setLoading]         = useState(true);

//   /* ─── Init ─────────────────────────────────────────────────────── */
//   useEffect(() => {
//     // Try to restore a demo-mode login
//     const stored = localStorage.getItem('mindease_auth_user');
//     if (stored) {
//       try {
//         const u = JSON.parse(stored);
//         setCurrentUser(u);
//         setUserId(u.uid);
//         setIsAdmin(isAdminEmail(u.email));
//       } catch {}
//     } else {
//       setUserId(getOrCreateAnonId());
//     }

//     if (!isFirebaseConfigured || !auth) {
//       setLoading(false);
//       return;
//     }

//     const unsub = onAuthStateChanged(auth, (user) => {
//       setCurrentUser(user);
//       if (user) {
//         setUserId(user.uid);
//         setIsAdmin(isAdminEmail(user.email));
//         localStorage.setItem('mindease_auth_user', JSON.stringify({ uid: user.uid, email: user.email, displayName: user.displayName }));
//         localStorage.setItem('mindease_user_id', user.uid);
//       } else {
//         setIsAdmin(false);
//         setUserId(getOrCreateAnonId());
//         localStorage.removeItem('mindease_auth_user');
//       }
//       setLoading(false);
//     });

//     return unsub;
//   }, []); // eslint-disable-line

//   /* ─── Auth actions ──────────────────────────────────────────────── */
//   const signup = async (email, password, displayName) => {
//     if (!isFirebaseConfigured || !auth) {
//       // Demo mode
//       const uid  = 'demo_' + Math.random().toString(36).substr(2, 9).toUpperCase();
//       const user = { uid, email, displayName };
//       setCurrentUser(user);
//       setUserId(uid);
//       localStorage.setItem('mindease_auth_user', JSON.stringify(user));
//       localStorage.setItem('mindease_user_id', uid);
//       return { user };
//     }
//     const cred = await createUserWithEmailAndPassword(auth, email, password);
//     if (displayName) await updateProfile(cred.user, { displayName });
    
//     // Store user in Firestore
//     await setDoc(doc(db, "users", cred.user.uid), {
//       email: cred.user.email,
//       role: "user",
//       createdAt: serverTimestamp()
//     });
    
//     localStorage.setItem('mindease_user_id', cred.user.uid);
//     return cred;
//   };

//   const login = async (email, password) => {
//     if (!isFirebaseConfigured || !auth) {
//       // Demo credentials
//       const DEMO_ADMIN = { 'jasica@kaur.com': 'jasicakaur', 'devansh@gupta.com': 'devanshgupta' };
//       const uid  = (DEMO_ADMIN[email] === password ? 'admin_' : 'demo_') +
//                    btoa(email).replace(/[^a-zA-Z0-9]/g, '').substr(0, 10);
//       const user = { uid, email, displayName: email.split('@')[0] };
//       setCurrentUser(user);
//       setUserId(uid);
//       setIsAdmin(isAdminEmail(email));
//       localStorage.setItem('mindease_auth_user', JSON.stringify(user));
//       localStorage.setItem('mindease_user_id', uid);
//       return { user };
//     }
//     const cred = await signInWithEmailAndPassword(auth, email, password);
//     localStorage.setItem('mindease_user_id', cred.user.uid);
//     return cred;
//   };

//   const logout = async () => {
//     if (isFirebaseConfigured && auth) await signOut(auth);
//     setCurrentUser(null);
//     setIsAdmin(false);
//     localStorage.removeItem('mindease_auth_user');
//     // Keep anon ID for continuity
//     setUserId(getOrCreateAnonId());
//   };

//   const resetPassword = (email) => {
//     if (!isFirebaseConfigured || !auth)
//       throw new Error('Firebase not configured. Password reset unavailable in demo mode.');
//     return sendPasswordResetEmail(auth, email);
//   };

//   const updateUserProfile = (updates) => {
//     if (!isFirebaseConfigured || !auth)
//       throw new Error('Firebase not configured.');
//     return updateProfile(auth.currentUser, updates);
//   };

//   return (
//     <AuthContext.Provider value={{
//       currentUser, userId, isAdmin, loading,
//       signup, login, logout, resetPassword, updateUserProfile,
//     }}>
//       {!loading && children}
//     </AuthContext.Provider>
//   );
// };

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
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { recordLoginActivity } from '../services/firebaseService';

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

  useEffect(() => {
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

    // Create user document in Firestore immediately on signup
    if (db) {
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: cred.user.email,
        displayName: displayName || email.split('@')[0],
        role: 'user',
        isActive: true,
        loginCount: 1,
        lastLogin: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }

    // Record first login activity
    await recordLoginActivity(
      cred.user.uid,
      cred.user.email,
      displayName || email.split('@')[0]
    );

    localStorage.setItem('mindease_user_id', cred.user.uid);
    return cred;
  };

  const login = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      // Demo mode credentials
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

    // ✅ Record login activity in Firestore every time user logs in
    await recordLoginActivity(
      cred.user.uid,
      cred.user.email,
      cred.user.displayName || cred.user.email.split('@')[0]
    );

    return cred;
  };

  const logout = async () => {
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