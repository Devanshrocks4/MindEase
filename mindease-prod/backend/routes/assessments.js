const express  = require('express');
const router   = express.Router();

// In-memory store for demo — replace with Firestore/MongoDB in production
const assessments = [];

// GET  /api/assessments?userId=xxx
router.get('/', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const results = assessments
    .filter((a) => a.userId === userId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(results);
});

// POST /api/assessments
router.post('/', (req, res) => {
  const data = req.body;
  if (!data.userId || !data.category) {
    return res.status(400).json({ error: 'userId and category are required' });
  }
  const record = { id: `local_${Date.now()}`, ...data, createdAt: new Date().toISOString() };
  assessments.unshift(record);
  // Cap at 1000 records in demo mode
  if (assessments.length > 1000) assessments.pop();
  res.status(201).json(record);
});

// GET /api/assessments/:id
router.get('/:id', (req, res) => {
  const a = assessments.find((x) => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  res.json(a);
});

// DELETE /api/assessments/:id
router.delete('/:id', (req, res) => {
  const idx = assessments.findIndex((x) => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  assessments.splice(idx, 1);
  res.json({ deleted: true });
});

module.exports = router;
