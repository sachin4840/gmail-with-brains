// Vercel Serverless entry point
try { require('dotenv').config(); } catch (e) {}

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Lazy-load routes to catch import errors
try {
  const emailRoutes = require('../routes/emails');
  const actionRoutes = require('../routes/actions');
  app.use('/api/emails', emailRoutes);
  app.use('/api/actions', actionRoutes);
} catch (err) {
  app.use('/api/*', (req, res) => {
    res.status(500).json({ error: 'Route loading failed', message: err.message });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

module.exports = app;
