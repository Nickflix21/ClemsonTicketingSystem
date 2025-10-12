/**
 * server.js (Admin Service)
 * Purpose: Boots Express server for admin APIs on port 5001.
 * Exposes /api/admin routes.
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const adminRoutes = require('./routes/adminRoutes');
const runSetup = require('./setup');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Run DB setup (creates tables if needed)
const sharedDbPath = path.join(__dirname, '..', 'shared-db', 'database.sqlite');
const initSqlPath = path.join(__dirname, '..', 'shared-db', 'init.sql');
runSetup(sharedDbPath, initSqlPath);

// Routes
app.use('/api/admin', adminRoutes);

// Error handler (last)
app.use((err, req, res, next) => {
  console.error('Admin service error:', err);
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Admin service running at http://localhost:${PORT}`);
});

