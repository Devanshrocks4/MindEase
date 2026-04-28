// import { db, isFirebaseConfigured } from './firebase';
// import {
//   collection,
//   addDoc,
//   getDocs,
//   doc,
//   updateDoc,
//   deleteDoc,
//   query,
//   orderBy,
//   where,
//   serverTimestamp
// } from 'firebase/firestore';

// // ── Console logging for debugging ──────────────────────────────────
// const log = (action, dataOrError) => {
//   console.group(`[FirebaseService] ${action}`);
//   if (dataOrError) {
//     if (dataOrError.error) {
//       console.error('Error:', dataOrError.error);
//     } else {
//       console.log('Success:', dataOrError.data ? `${dataOrError.data.length || 1} items` : 'Updated');
//     }
//   }
//   console.groupEnd();
// };

// // ── Demo fallback data generators (matching AdminDashboard expectations) ──
// const genDemoUsers = (n = 20) => {
//   const names = ['Aryan Sharma','Priya Singh','Rahul Verma','Ananya Patel','Vikram Nair','Meera Joshi','Kabir Das','Nisha Gupta','Aditya Kumar','Riya Malhotra','Siddharth Rao','Divya Reddy','Akash Iyer','Pooja Shah','Nikhil Mehta','Shreya Tiwari','Rohan Chauhan','Kavya Nair','Harsh Kapoor','Isha Srivastava'];
//   return Array.from({ length: n }, (_, i) => ({
//     _id: `demo_${i + 1}`,
//     id: `demo_${i + 1}`, // Firestore doc ID fallback
//     name: names[i % names.length],
//     email: `${names[i % names.length].split(' ')[0].toLowerCase()}${i + 1}@example.com`,
//     role: i === 0 ? 'admin' : 'user',
//     isActive: Math.random() > 0.15,
//     createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
//     lastLogin: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
//   }));
// };

// const genDemoAssessments = (n = 50) => {
//   const categories = ['stress', 'depression', 'anxiety', 'sleep', 'social', 'behavioral', 'emotional', 'decision', 'digital'];
//   return Array.from({ length: n }, (_, i) => ({
//     _id: `demo_assess_${i + 1}`,
//     id: `demo_assess_${i + 1}`,
//     userId: { name: genDemoUsers(1)[0].name, _id: `demo_${Math.floor(Math.random()*20)+1}` },
//     category: categories[i % categories.length],
//     categoryName: categories[i % categories.length].replace(/^\w/, c => c.toUpperCase()),
//     score: Math.floor(Math.random() * 100),
//     wellnessIndex: Math.floor(Math.random() * 100),
//     testDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
//   }));
// };

// const genDemoAnalytics = () => ({
//   totalUsers: 24,
//   onlineUsers: 3,
//   totalAssessments: 87,
//   averageRiskScore: 42,
//   issueBreakdown: { stress: 18, depression: 12, anxiety: 16, sleep: 10, social: 8, behavioral: 9, emotional: 7, decision: 4, digital: 3 },
//   riskLevelBreakdown: { Low: 35, Moderate: 38, High: 14 },
//   recentAssessments: genDemoAssessments(3),
//   userStats: genDemoUsers(2).map(u => ({ ...u, totalAssessments: Math.floor(Math.random()*10)+1, averageScore: Math.floor(Math.random()*100) })),
//   recentAssessmentsCount: 7,
// });

// // ── USERS ─────────────────────────────────────────────────────────
// export const getUsers = async (filters = {}) => {
//   try {
//     console.log('[FirebaseService] Fetching users with filters:', filters);
    
//     if (!isFirebaseConfigured) {
//       console.warn('[FirebaseService] Firebase not configured, returning demo users');
//       return { data: genDemoUsers(50), error: null };
//     }

//     let q = collection(db, 'users');
    
//     // Apply filters
//     if (filters.role) q = query(q, where('role', '==', filters.role));
//     if (filters.active !== undefined) q = query(q, where('isActive', '==', filters.active));
//     q = query(q, orderBy('createdAt', 'desc'));

//     const snapshot = await getDocs(q);
//     const users = snapshot.docs.map(doc => ({
//       id: doc.id,
//       _id: doc.id, // AdminDashboard expects _id
//       ...doc.data()
//     }));

//     log('getUsers', { data: users });
//     return { data: users, error: null };

//   } catch (error) {
//     console.error('[FirebaseService] getUsers error:', error);
//     return { data: genDemoUsers(20), error: error.message };
//   }
// };

// export const addUser = async (userData) => {
//   try {
//     console.log('[FirebaseService] Adding user:', userData);

//     if (!isFirebaseConfigured) {
//       const demoUser = { _id: `demo_${Date.now()}`, ...userData, createdAt: new Date() };
//       log('addUser', { data: demoUser });
//       return { data: demoUser, error: null };
//     }

//     const docRef = await addDoc(collection(db, 'users'), {
//       ...userData,
//       createdAt: serverTimestamp(),
//       updatedAt: serverTimestamp(),
//     });

//     const newUser = { _id: docRef.id, id: docRef.id, ...userData };
//     log('addUser', { data: newUser });
//     return { data: newUser, error: null };

//   } catch (error) {
//     console.error('[FirebaseService] addUser error:', error);
//     return { data: null, error: error.message };
//   }
// };

// export const updateUser = async (userId, updateData) => {
//   try {
//     console.log('[FirebaseService] Updating user:', userId, updateData);

//     if (!isFirebaseConfigured) {
//       log('updateUser', { data: { _id: userId, ...updateData } });
//       return { data: { _id: userId, ...updateData }, error: null };
//     }

//     const userRef = doc(db, 'users', userId);
//     await updateDoc(userRef, {
//       ...updateData,
//       updatedAt: serverTimestamp(),
//     });

//     log('updateUser', { data: { _id: userId, ...updateData } });
//     return { data: { _id: userId, ...updateData }, error: null };

//   } catch (error) {
//     console.error('[FirebaseService] updateUser error:', error);
//     return { data: null, error: error.message };
//   }
// };

// export const deleteUser = async (userId) => {
//   try {
//     console.log('[FirebaseService] Deleting user:', userId);

//     if (!isFirebaseConfigured) {
//       log('deleteUser', { data: userId });
//       return { data: userId, error: null };
//     }

//     await deleteDoc(doc(db, 'users', userId));
//     log('deleteUser', { data: userId });
//     return { data: userId, error: null };

//   } catch (error) {
//     console.error('[FirebaseService] deleteUser error:', error);
//     return { data: null, error: error.message };
//   }
// };

// // ── ASSESSMENTS ───────────────────────────────────────────────────
// export const getAssessments = async () => {
//   try {
//     console.log('[FirebaseService] Fetching assessments');

//     if (!isFirebaseConfigured) {
//       console.warn('[FirebaseService] Firebase not configured, returning demo assessments');
//       return { data: genDemoAssessments(50), error: null };
//     }

//     const q = query(collection(db, 'assessments'), orderBy('testDate', 'desc'));
//     const snapshot = await getDocs(q);
//     const assessments = snapshot.docs.map(doc => ({
//       id: doc.id,
//       _id: doc.id,
//       ...doc.data()
//     }));

//     log('getAssessments', { data: assessments });
//     return { data: assessments, error: null };

//   } catch (error) {
//     console.error('[FirebaseService] getAssessments error:', error);
//     return { data: genDemoAssessments(20), error: error.message };
//   }
// };

// export const deleteAssessment = async (assessmentId) => {
//   try {
//     console.log('[FirebaseService] Deleting assessment:', assessmentId);

//     if (!isFirebaseConfigured) {
//       log('deleteAssessment', { data: assessmentId });
//       return { data: assessmentId, error: null };
//     }

//     await deleteDoc(doc(db, 'assessments', assessmentId));
//     log('deleteAssessment', { data: assessmentId });
//     return { data: assessmentId, error: null };

//   } catch (error) {
//     console.error('[FirebaseService] deleteAssessment error:', error);
//     return { data: null, error: error.message };
//   }
// };

// // ── ANALYTICS (computed) ──────────────────────────────────────────
// export const getAnalytics = async () => {
//   try {
//     console.log('[FirebaseService] Computing analytics');

//     if (!isFirebaseConfigured) {
//       return { data: genDemoAnalytics(), error: null };
//     }

//     // Simple aggregation - enhance as needed
//     const usersRes = await getUsers();
//     const assessmentsRes = await getAssessments();
    
//     const analytics = {
//       totalUsers: usersRes.data?.length || 0,
//       totalAssessments: assessmentsRes.data?.length || 0,
//       averageRiskScore: assessmentsRes.data?.length ? 
//         Math.round(assessmentsRes.data.reduce((sum, a) => sum + (a.wellnessIndex || a.score || 0), 0) / assessmentsRes.data.length) : 0,
//       // Add more computed metrics
//     };

//     log('getAnalytics', { data: analytics });
//     return { data: analytics, error: null };

//   } catch (error) {
//     console.error('[FirebaseService] getAnalytics error:', error);
//     return { data: genDemoAnalytics(), error: error.message };
//   }
// };

// // ── Export convenience functions for AdminDashboard ───────────────
// export const adminService = {
//   getUsers,
//   getAssessments,
//   addUser,
//   updateUser,
//   deleteUser,
//   getAnalytics,
// };

import { db, isFirebaseConfigured } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

// ── Helper: convert Firestore Timestamps to JS Date ───────────────
const toDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (val?.toDate) return val.toDate();
  if (val?.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
};

// ── Demo fallback data (used when Firebase not configured) ─────────
const genDemoUsers = (n = 20) => {
  const names = ['Aryan Sharma','Priya Singh','Rahul Verma','Ananya Patel','Vikram Nair','Meera Joshi','Kabir Das','Nisha Gupta','Aditya Kumar','Riya Malhotra','Siddharth Rao','Divya Reddy','Akash Iyer','Pooja Shah','Nikhil Mehta','Shreya Tiwari','Rohan Chauhan','Kavya Nair','Harsh Kapoor','Isha Srivastava'];
  return Array.from({ length: n }, (_, i) => ({
    _id: `demo_${i + 1}`,
    id: `demo_${i + 1}`,
    name: names[i % names.length],
    email: `${names[i % names.length].split(' ')[0].toLowerCase()}${i + 1}@example.com`,
    role: i === 0 ? 'admin' : 'user',
    isActive: Math.random() > 0.15,
    loginCount: Math.floor(Math.random() * 30) + 1,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    lastLogin: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
  }));
};

const genDemoAssessments = (n = 50) => {
  const categories = ['stress', 'depression', 'confidence', 'sleep', 'social', 'behavioral', 'emotional', 'decision', 'digital'];
  const users = genDemoUsers(20);
  return Array.from({ length: n }, (_, i) => {
    const u = users[i % users.length];
    return {
      _id: `demo_assess_${i + 1}`,
      id: `demo_assess_${i + 1}`,
      userId: u._id,
      userName: u.name,
      userEmail: u.email,
      category: categories[i % categories.length],
      categoryName: categories[i % categories.length].replace(/^\w/, c => c.toUpperCase()),
      wellnessIndex: Math.floor(Math.random() * 100),
      wellnessLevel: ['Low', 'Moderate', 'Good', 'Excellent'][Math.floor(Math.random() * 4)],
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  });
};

const genDemoAnalytics = () => {
  const users = genDemoUsers(24);
  const assessments = genDemoAssessments(87);
  return {
    totalUsers: users.length,
    onlineUsers: 3,
    totalAssessments: assessments.length,
    averageRiskScore: 42,
    issueBreakdown: { stress: 18, depression: 12, confidence: 16, sleep: 10, social: 8, behavioral: 9, emotional: 7, decision: 4, digital: 3 },
    riskLevelBreakdown: { Low: 35, Moderate: 38, High: 14 },
    recentAssessments: assessments.slice(0, 5),
    userStats: users.slice(0, 10).map(u => ({
      ...u,
      totalAssessments: Math.floor(Math.random() * 10) + 1,
      averageScore: Math.floor(Math.random() * 100),
      lastAssessment: new Date(),
    })),
    recentAssessmentsCount: 7,
    loginActivities: users.slice(0, 10).map(u => ({
      userId: u._id,
      userName: u.name,
      userEmail: u.email,
      loginTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    })),
  };
};

// ── RECORD LOGIN ACTIVITY (called by AuthContext on every login) ───
export const recordLoginActivity = async (userId, userEmail, userName) => {
  try {
    if (!isFirebaseConfigured || !db) return;

    const now = serverTimestamp();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      await updateDoc(userRef, {
        lastLogin: now,
        loginCount: (userSnap.data().loginCount || 0) + 1,
        isActive: true,
        updatedAt: now,
      });
    } else {
      // Auto-create user doc for existing Firebase Auth users
      await setDoc(userRef, {
        email: userEmail || '',
        displayName: userName || userEmail?.split('@')[0] || 'User',
        role: 'user',
        isActive: true,
        loginCount: 1,
        lastLogin: now,
        createdAt: now,
      }, { merge: true });
    }

    // Log to loginActivities collection
    await addDoc(collection(db, 'loginActivities'), {
      userId,
      userEmail: userEmail || '',
      userName: userName || userEmail?.split('@')[0] || 'User',
      loginTime: now,
    });

    console.log('[FirebaseService] Login activity recorded for', userEmail);
  } catch (err) {
    // Non-fatal — never block the user's login
    console.warn('[FirebaseService] recordLoginActivity failed:', err.message);
  }
};

// ── USERS ─────────────────────────────────────────────────────────
export const getUsers = async (filters = {}) => {
  try {
    if (!isFirebaseConfigured || !db) {
      return { data: genDemoUsers(50), error: null };
    }

    let constraints = [orderBy('createdAt', 'desc')];
    if (filters.role) constraints.unshift(where('role', '==', filters.role));
    if (filters.active !== undefined) constraints.unshift(where('isActive', '==', filters.active));

    const q = query(collection(db, 'users'), ...constraints);
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(d => ({
      id: d.id,
      _id: d.id,
      ...d.data(),
      createdAt: toDate(d.data().createdAt),
      lastLogin: toDate(d.data().lastLogin),
    }));

    return { data: users, error: null };
  } catch (error) {
    console.error('[FirebaseService] getUsers error:', error);
    return { data: genDemoUsers(20), error: error.message };
  }
};

export const addUser = async (userData) => {
  try {
    if (!isFirebaseConfigured || !db) {
      const id = `demo_${Date.now()}`;
      return { data: { _id: id, id, ...userData, createdAt: new Date() }, error: null };
    }

    const docRef = await addDoc(collection(db, 'users'), {
      ...userData,
      loginCount: 0,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { data: { _id: docRef.id, id: docRef.id, ...userData }, error: null };
  } catch (error) {
    console.error('[FirebaseService] addUser error:', error);
    return { data: null, error: error.message };
  }
};

export const updateUser = async (userId, updateData) => {
  try {
    if (!isFirebaseConfigured || !db) {
      return { data: { _id: userId, ...updateData }, error: null };
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { ...updateData, updatedAt: serverTimestamp() });
    return { data: { _id: userId, ...updateData }, error: null };
  } catch (error) {
    console.error('[FirebaseService] updateUser error:', error);
    return { data: null, error: error.message };
  }
};

export const deleteUser = async (userId) => {
  try {
    if (!isFirebaseConfigured || !db) return { data: userId, error: null };
    await deleteDoc(doc(db, 'users', userId));
    return { data: userId, error: null };
  } catch (error) {
    console.error('[FirebaseService] deleteUser error:', error);
    return { data: null, error: error.message };
  }
};

// ── ASSESSMENTS ───────────────────────────────────────────────────
export const getAssessments = async () => {
  try {
    if (!isFirebaseConfigured || !db) {
      return { data: genDemoAssessments(50), error: null };
    }

    let snapshot;
    try {
      const q = query(collection(db, 'assessments'), orderBy('date', 'desc'));
      snapshot = await getDocs(q);
    } catch {
      // Fallback if Firestore index not yet created
      snapshot = await getDocs(collection(db, 'assessments'));
    }

    const assessments = snapshot.docs.map(d => ({
      id: d.id,
      _id: d.id,
      ...d.data(),
      date: toDate(d.data().date) || toDate(d.data().testDate),
    }));

    return { data: assessments, error: null };
  } catch (error) {
    console.error('[FirebaseService] getAssessments error:', error);
    return { data: genDemoAssessments(20), error: error.message };
  }
};

export const deleteAssessment = async (assessmentId) => {
  try {
    if (!isFirebaseConfigured || !db) return { data: assessmentId, error: null };
    await deleteDoc(doc(db, 'assessments', assessmentId));
    return { data: assessmentId, error: null };
  } catch (error) {
    console.error('[FirebaseService] deleteAssessment error:', error);
    return { data: null, error: error.message };
  }
};

// ── LOGIN ACTIVITIES ──────────────────────────────────────────────
export const getLoginActivities = async (limitCount = 50) => {
  try {
    if (!isFirebaseConfigured || !db) {
      return { data: genDemoAnalytics().loginActivities, error: null };
    }

    const q = query(
      collection(db, 'loginActivities'),
      orderBy('loginTime', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const activities = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
      loginTime: toDate(d.data().loginTime),
    }));

    return { data: activities, error: null };
  } catch (error) {
    console.error('[FirebaseService] getLoginActivities error:', error);
    return { data: [], error: error.message };
  }
};

// ── ANALYTICS ─────────────────────────────────────────────────────
export const getAnalytics = async () => {
  try {
    if (!isFirebaseConfigured || !db) {
      return { data: genDemoAnalytics(), error: null };
    }

    const [usersRes, assessmentsRes, loginRes] = await Promise.all([
      getUsers(),
      getAssessments(),
      getLoginActivities(100),
    ]);

    const users = usersRes.data || [];
    const assessments = assessmentsRes.data || [];
    const loginActivities = loginRes.data || [];

    const issueBreakdown = {};
    assessments.forEach(a => {
      const cat = a.category || 'unknown';
      issueBreakdown[cat] = (issueBreakdown[cat] || 0) + 1;
    });

    const riskLevelBreakdown = { Low: 0, Moderate: 0, High: 0, Excellent: 0 };
    assessments.forEach(a => {
      const lvl = a.wellnessLevel || 'Moderate';
      if (riskLevelBreakdown[lvl] !== undefined) riskLevelBreakdown[lvl]++;
    });

    const userAssessmentMap = {};
    assessments.forEach(a => {
      const uid = a.userId || 'unknown';
      if (!userAssessmentMap[uid]) {
        userAssessmentMap[uid] = { count: 0, totalScore: 0, lastAssessment: null };
      }
      userAssessmentMap[uid].count++;
      userAssessmentMap[uid].totalScore += (a.wellnessIndex || 0);
      const d = toDate(a.date);
      if (d && (!userAssessmentMap[uid].lastAssessment || d > userAssessmentMap[uid].lastAssessment)) {
        userAssessmentMap[uid].lastAssessment = d;
      }
    });

    const userStats = users.map(u => ({
      ...u,
      totalAssessments: userAssessmentMap[u.id]?.count || 0,
      averageScore: userAssessmentMap[u.id]?.count
        ? Math.round(userAssessmentMap[u.id].totalScore / userAssessmentMap[u.id].count)
        : 0,
      lastAssessment: userAssessmentMap[u.id]?.lastAssessment || null,
    }));

    const avgScore = assessments.length
      ? Math.round(assessments.reduce((s, a) => s + (a.wellnessIndex || 0), 0) / assessments.length)
      : 0;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentCount = assessments.filter(a => toDate(a.date) > sevenDaysAgo).length;

    return {
      data: {
        totalUsers: users.length,
        onlineUsers: users.filter(u => {
          const ll = toDate(u.lastLogin);
          return ll && (Date.now() - ll.getTime()) < 15 * 60 * 1000;
        }).length,
        totalAssessments: assessments.length,
        averageRiskScore: avgScore,
        issueBreakdown,
        riskLevelBreakdown,
        recentAssessments: assessments.slice(0, 5),
        recentAssessmentsCount: recentCount,
        userStats,
        loginActivities,
      },
      error: null,
    };
  } catch (error) {
    console.error('[FirebaseService] getAnalytics error:', error);
    return { data: genDemoAnalytics(), error: error.message };
  }
};

// ── fetchAll: single call that loads everything for AdminDashboard ─
// THIS WAS MISSING — caused "adminService.fetchAll is not a function" crash
export const fetchAll = async () => {
  try {
    const [usersResult, assessmentsResult, analyticsResult] = await Promise.all([
      getUsers(),
      getAssessments(),
      getAnalytics(),
    ]);

    return {
      data: {
        users: usersResult.data || [],
        assessments: assessmentsResult.data || [],
        analytics: analyticsResult.data || genDemoAnalytics(),
        groups: [],
      },
      error: null,
    };
  } catch (error) {
    console.error('[FirebaseService] fetchAll error:', error);
    return { data: null, error: error.message };
  }
};

// ── adminService export used by AdminDashboard.js ─────────────────
export const adminService = {
  getUsers,
  getAssessments,
  addUser,
  updateUser,
  deleteUser,
  getAnalytics,
  getLoginActivities,
  fetchAll,
};