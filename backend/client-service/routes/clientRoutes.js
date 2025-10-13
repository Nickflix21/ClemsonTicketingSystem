const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const router = express.Router();

function getDb() {
  const dbPath = path.join(__dirname, '..', '..', 'shared-db', 'database.sqlite');
  return new sqlite3.Database(dbPath);
}

// GET /api/events — return array
router.get('/events', (req, res) => {
  const db = getDb();
  db.all('SELECT id, name, date, tickets FROM events ORDER BY id;', [], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: 'Failed to retrieve events.' });
    res.status(200).json(rows);
  });
});

// POST /api/events/:id/purchase — reduce tickets
router.post('/events/:id/purchase', (req, res) => {
  const id = parseInt(req.params.id);
  const db = getDb();

  db.get('SELECT tickets FROM events WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!row) return res.status(404).json({ message: 'Event not found.' });
    if (row.tickets <= 0) return res.status(400).json({ message: 'Sold out.' });

    db.run('UPDATE events SET tickets = tickets - 1 WHERE id = ?', [id], (err2) => {
      if (err2) return res.status(500).json({ error: 'Failed to purchase ticket.' });
      res.json({ message: 'Purchase successful.' });
    });
  });
});

module.exports = router;
