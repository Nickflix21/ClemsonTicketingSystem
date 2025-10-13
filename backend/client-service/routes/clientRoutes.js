// backend/client-service/routes/clientRoutes.js
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const router = express.Router();

function getDb() {
  // routes/ → ../.. → shared-db/database.sqlite
  const dbPath = path.join(__dirname, '..', '..', 'shared-db', 'database.sqlite');
  return new sqlite3.Database(dbPath);
}

// GET /api/events — return array (matches demo)
router.get('/events', (req, res) => {
  const db = getDb();
  db.all('SELECT id, name, date, tickets FROM events ORDER BY id;', [], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: 'Failed to retrieve events.' });
    res.status(200).json(rows);
  });
});

module.exports = router;
