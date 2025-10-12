/**
 * adminModel.js
 * Purpose: All database operations for admin service.
 * Exports: insertEvent({ name, date, tickets })
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the shared DB file
const dbPath = path.join(__dirname, '..', '..', 'shared-db', 'database.sqlite');

/**
 * Inserts a new event row into the DB.
 * @param {{name:string, date:string, tickets:number}} eventData
 * @returns {Promise<{id:number,name:string,date:string,tickets:number}>}
 */
function insertEvent(eventData) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);

    const sql = `
      INSERT INTO events (name, date, tickets)
      VALUES (?, ?, ?)
    `;
    const params = [eventData.name, eventData.date, eventData.tickets];

    db.run(sql, params, function (err) {
      if (err) {
        db.close();
        return reject(err);
      }
      const inserted = {
        id: this.lastID,
        ...eventData
      };
      db.close();
      resolve(inserted);
    });
  });
}

module.exports = { insertEvent };
