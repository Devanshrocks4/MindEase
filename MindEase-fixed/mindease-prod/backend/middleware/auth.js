/**
 * Firebase ID-token verifier middleware.
 * Usage: router.get('/protected', verifyToken, handler)
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to a
 * Firebase Admin service-account JSON file, OR set FIREBASE_PROJECT_ID,
 * FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY directly.
 */

let adminAuth = null;

try {
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    if (process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId:   process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    }
  }
  adminAuth = admin.auth();
} catch {
  console.warn('[Auth middleware] Firebase Admin not configured — token verification disabled.');
}

const verifyToken = async (req, res, next) => {
  if (!adminAuth) {
    // Demo mode: trust userId from body/query
    req.uid = req.body?.userId || req.query?.userId || 'demo';
    return next();
  }
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }
  try {
    const decoded = await adminAuth.verifyIdToken(header.split(' ')[1]);
    req.uid = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { verifyToken };
