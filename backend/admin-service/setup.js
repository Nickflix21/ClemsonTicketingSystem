/**
 * setup.js
 * Purpose: Initialize the shared SQLite DB using init.sql (idempotent).
 */
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

module.exports = function runSetup(dbFilePath, initSqlPath) {
  const sql = fs.readFileSync(initSqlPath, 'utf8');
  const db = new sqlite3.Database(dbFilePath);

  db.serialize(() => {
    db.exec(sql, (err) => {
      if (err) {
        console.error('DB setup error:', err);
      } else {
        console.log('DB setup complete / verified.');
      }
    });
  });

  db.close();
};
