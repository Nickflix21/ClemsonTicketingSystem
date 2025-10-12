-- Creates events table if not exists
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  date TEXT NOT NULL,           -- ISO date string: YYYY-MM-DD
  tickets INTEGER NOT NULL      -- available ticket count
);
