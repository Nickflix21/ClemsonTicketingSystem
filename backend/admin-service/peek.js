const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'shared-db', 'database.sqlite');
console.log('Reading from:', dbPath);

const db = new sqlite3.Database(dbPath);
db.all('SELECT * FROM events ORDER BY id;', [], (err, rows) => {
  if (err) { console.error(err); process.exit(1); }
  console.log('Events:');
  console.table(rows);
  db.close();
});
