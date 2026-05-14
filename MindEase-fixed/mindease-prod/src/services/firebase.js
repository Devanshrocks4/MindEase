import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';

// Detect if Firebase is properly configured
export const isFirebaseConfigured =
  Boolean(process.env.REACT_APP_FIREBASE_API_KEY) &&
  process.env.REACT_APP_FIREBASE_API_KEY !== 'demo-api-key' &&
  Boolean(process.env.REACT_APP_FIREBASE_PROJECT_ID) &&
  process.env.REACT_APP_FIREBASE_PROJECT_ID !== 'demo-project';

let app = null;
let db  = null;
let auth = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp({
      apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId:             process.env.REACT_APP_FIREBASE_APP_ID,
    });
    db   = getFirestore(app);
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch(() => {});
  } catch (err) {
    console.warn('[MindEase] Firebase init failed — running in demo mode:', err.message);
    app = db = auth = null;
  }
} else {
  console.info('[MindEase] Firebase not configured — running in demo mode');
}

export { db, auth };
