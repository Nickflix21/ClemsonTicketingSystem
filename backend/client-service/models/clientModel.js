import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Determine the path to the SQLite database file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Database file is located in the shared-db directory
const DB_PATH = path.resolve(__dirname, "../../shared-db/database.sqlite");

// Opens a connection to the SQLite database
async function openDB() {
  // Opens the database and returns the connection
  return open({ filename: DB_PATH, driver: sqlite3.Database });
}

// Fetches all events from the database and returns them as an array of objects
export async function getAllEvents() {
  // Open a connection to the database
  const db = await openDB();
  try {
    // Query to select all events ordered by id
    return await db.all("SELECT id, name, date, tickets FROM events ORDER BY id;");
  } finally {
    // Close the database connection when done
    await db.close();
  }
}

export async function purchaseTicket(id) {
    // Open a connection to the database
    const db = await openDB();
  try {
    // Start a transaction to ensure atomicity of the purchase operation
    await db.exec("BEGIN IMMEDIATE;");

    //  Fetches the current ticket count for the event
    const row = await db.get("SELECT tickets FROM events WHERE id = ?", [id]);
    // Returns 404 error if the event does not exist
    if (!row) {
      await db.exec("ROLLBACK;");
      return { ok: false, code: 404, error: "Event not found" };
    }

    // Decrement the ticket count if tickets are available
    const upd = await db.run(
      "UPDATE events SET tickets = tickets - 1 WHERE id = ? AND tickets > 0;",
      [id]
    );
    // If no rows were updated, it means the event is sold out
    if (upd.changes === 0) {
      await db.exec("ROLLBACK;");
      return { ok: false, code: 409, error: "Sold out" };
    }
    // Fetch the updated event details
    const updated = await db.get(
      "SELECT id, name, date, tickets FROM events WHERE id = ?",
      [id]
    );
    await db.exec("COMMIT;");
    return { ok: true, event: updated };
  } catch (e) {
    await db.exec("ROLLBACK;");
    throw e;
  } finally {
    await db.close();
  }
}