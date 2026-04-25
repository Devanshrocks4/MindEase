import { db, isFirebaseConfigured } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore';

// ── Console logging for debugging ──────────────────────────────────
const log = (action, dataOrError) => {
  console.group(`[FirebaseService] ${action}`);
  if (dataOrError) {
    if (dataOrError.error) {
      console.error('Error:', dataOrError.error);
    } else {
      console.log('Success:', dataOrError.data ? `${dataOrError.data.length || 1} items` : 'Updated');
    }
  }
  console.groupEnd();
};

// ── Demo fallback data generators (matching AdminDashboard expectations) ──
const genDemoUsers = (n = 20) => {
  const names = ['Aryan Sharma','Priya Singh','Rahul Verma','Ananya Patel','Vikram Nair','Meera Joshi','Kabir Das','Nisha Gupta','Aditya Kumar','Riya Malhotra','Siddharth Rao','Divya Reddy','Akash Iyer','Pooja Shah','Nikhil Mehta','Shreya Tiwari','Rohan Chauhan','Kavya Nair','Harsh Kapoor','Isha Srivastava'];
  return Array.from({ length: n }, (_, i) => ({
    _id: `demo_${i + 1}`,
    id: `demo_${i + 1}`, // Firestore doc ID fallback
    name: names[i % names.length],
    email: `${names[i % names.length].split(' ')[0].toLowerCase()}${i + 1}@example.com`,
    role: i === 0 ? 'admin' : 'user',
    isActive: Math.random() > 0.15,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    lastLogin: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
  }));
};

const genDemoAssessments = (n = 50) => {
  const categories = ['stress', 'depression', 'anxiety', 'sleep', 'social', 'behavioral', 'emotional', 'decision', 'digital'];
  return Array.from({ length: n }, (_, i) => ({
    _id: `demo_assess_${i + 1}`,
    id: `demo_assess_${i + 1}`,
    userId: { name: genDemoUsers(1)[0].name, _id: `demo_${Math.floor(Math.random()*20)+1}` },
    category: categories[i % categories.length],
    categoryName: categories[i % categories.length].replace(/^\w/, c => c.toUpperCase()),
    score: Math.floor(Math.random() * 100),
    wellnessIndex: Math.floor(Math.random() * 100),
    testDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
  }));
};

const genDemoAnalytics = () => ({
  totalUsers: 24,
  onlineUsers: 3,
  totalAssessments: 87,
  averageRiskScore: 42,
  issueBreakdown: { stress: 18, depression: 12, anxiety: 16, sleep: 10, social: 8, behavioral: 9, emotional: 7, decision: 4, digital: 3 },
  riskLevelBreakdown: { Low: 35, Moderate: 38, High: 14 },
  recentAssessments: genDemoAssessments(3),
  userStats: genDemoUsers(2).map(u => ({ ...u, totalAssessments: Math.floor(Math.random()*10)+1, averageScore: Math.floor(Math.random()*100) })),
  recentAssessmentsCount: 7,
});

// ── USERS ─────────────────────────────────────────────────────────
export const getUsers = async (filters = {}) => {
  try {
    console.log('[FirebaseService] Fetching users with filters:', filters);
    
    if (!isFirebaseConfigured) {
      console.warn('[FirebaseService] Firebase not configured, returning demo users');
      return { data: genDemoUsers(50), error: null };
    }

    let q = collection(db, 'users');
    
    // Apply filters
    if (filters.role) q = query(q, where('role', '==', filters.role));
    if (filters.active !== undefined) q = query(q, where('isActive', '==', filters.active));
    q = query(q, orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      _id: doc.id, // AdminDashboard expects _id
      ...doc.data()
    }));

    log('getUsers', { data: users });
    return { data: users, error: null };

  } catch (error) {
    console.error('[FirebaseService] getUsers error:', error);
    return { data: genDemoUsers(20), error: error.message };
  }
};

export const addUser = async (userData) => {
  try {
    console.log('[FirebaseService] Adding user:', userData);

    if (!isFirebaseConfigured) {
      const demoUser = { _id: `demo_${Date.now()}`, ...userData, createdAt: new Date() };
      log('addUser', { data: demoUser });
      return { data: demoUser, error: null };
    }

    const docRef = await addDoc(collection(db, 'users'), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const newUser = { _id: docRef.id, id: docRef.id, ...userData };
    log('addUser', { data: newUser });
    return { data: newUser, error: null };

  } catch (error) {
    console.error('[FirebaseService] addUser error:', error);
    return { data: null, error: error.message };
  }
};

export const updateUser = async (userId, updateData) => {
  try {
    console.log('[FirebaseService] Updating user:', userId, updateData);

    if (!isFirebaseConfigured) {
      log('updateUser', { data: { _id: userId, ...updateData } });
      return { data: { _id: userId, ...updateData }, error: null };
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });

    log('updateUser', { data: { _id: userId, ...updateData } });
    return { data: { _id: userId, ...updateData }, error: null };

  } catch (error) {
    console.error('[FirebaseService] updateUser error:', error);
    return { data: null, error: error.message };
  }
};

export const deleteUser = async (userId) => {
  try {
    console.log('[FirebaseService] Deleting user:', userId);

    if (!isFirebaseConfigured) {
      log('deleteUser', { data: userId });
      return { data: userId, error: null };
    }

    await deleteDoc(doc(db, 'users', userId));
    log('deleteUser', { data: userId });
    return { data: userId, error: null };

  } catch (error) {
    console.error('[FirebaseService] deleteUser error:', error);
    return { data: null, error: error.message };
  }
};

// ── ASSESSMENTS ───────────────────────────────────────────────────
export const getAssessments = async () => {
  try {
    console.log('[FirebaseService] Fetching assessments');

    if (!isFirebaseConfigured) {
      console.warn('[FirebaseService] Firebase not configured, returning demo assessments');
      return { data: genDemoAssessments(50), error: null };
    }

    const q = query(collection(db, 'assessments'), orderBy('testDate', 'desc'));
    const snapshot = await getDocs(q);
    const assessments = snapshot.docs.map(doc => ({
      id: doc.id,
      _id: doc.id,
      ...doc.data()
    }));

    log('getAssessments', { data: assessments });
    return { data: assessments, error: null };

  } catch (error) {
    console.error('[FirebaseService] getAssessments error:', error);
    return { data: genDemoAssessments(20), error: error.message };
  }
};

export const deleteAssessment = async (assessmentId) => {
  try {
    console.log('[FirebaseService] Deleting assessment:', assessmentId);

    if (!isFirebaseConfigured) {
      log('deleteAssessment', { data: assessmentId });
      return { data: assessmentId, error: null };
    }

    await deleteDoc(doc(db, 'assessments', assessmentId));
    log('deleteAssessment', { data: assessmentId });
    return { data: assessmentId, error: null };

  } catch (error) {
    console.error('[FirebaseService] deleteAssessment error:', error);
    return { data: null, error: error.message };
  }
};

// ── ANALYTICS (computed) ──────────────────────────────────────────
export const getAnalytics = async () => {
  try {
    console.log('[FirebaseService] Computing analytics');

    if (!isFirebaseConfigured) {
      return { data: genDemoAnalytics(), error: null };
    }

    // Simple aggregation - enhance as needed
    const usersRes = await getUsers();
    const assessmentsRes = await getAssessments();
    
    const analytics = {
      totalUsers: usersRes.data?.length || 0,
      totalAssessments: assessmentsRes.data?.length || 0,
      averageRiskScore: assessmentsRes.data?.length ? 
        Math.round(assessmentsRes.data.reduce((sum, a) => sum + (a.wellnessIndex || a.score || 0), 0) / assessmentsRes.data.length) : 0,
      // Add more computed metrics
    };

    log('getAnalytics', { data: analytics });
    return { data: analytics, error: null };

  } catch (error) {
    console.error('[FirebaseService] getAnalytics error:', error);
    return { data: genDemoAnalytics(), error: error.message };
  }
};

// ── Export convenience functions for AdminDashboard ───────────────
export const adminService = {
  getUsers,
  getAssessments,
  addUser,
  updateUser,
  deleteUser,
  getAnalytics,
};
