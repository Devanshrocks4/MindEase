const express = require('express');
const router  = express.Router();

// GET /api/users/stats?userId=xxx
router.get('/stats', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  // In production: query Firestore here
  res.json({ userId, assessmentsCompleted: 0, lastActive: new Date().toISOString() });
});

// GET /api/users/all  (admin only — add auth middleware in production)
router.get('/all', (_req, res) => {
  res.json({ users: [], message: 'Connect Firebase Admin SDK to populate this.' });
});

module.exports = router;
