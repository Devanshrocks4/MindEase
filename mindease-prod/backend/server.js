require('dotenv').config();
const express  = require('express');
const cors     = require('cors');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'http://localhost:3000',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

// ── Request logger (dev) ───────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── Health check ──────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'MindEase API', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────
const assessmentRoutes = require('./routes/assessments');
const userRoutes       = require('./routes/users');
const chatRoutes       = require('./routes/chat');

app.use('/api/assessments', assessmentRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/chat',        chatRoutes);

// ── 404 ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Error handler ─────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ MindEase API running on http://localhost:${PORT}`);
});

module.exports = app;
