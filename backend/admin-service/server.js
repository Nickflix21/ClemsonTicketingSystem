/**
 * server.js (Admin Service)
 * Purpose: Boots the Express server for the Admin microservice.
 *           Handles all routing for admin APIs on port 5001 and connects to the shared SQLite database.
 */

import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Create Express app
const app = express();
app.use(cors());
app.use(express.json()); // Parse JSON bodies from incoming requests
app.use(express.urlencoded({ extended: false })); // Handle form-encoded bodies too

/**
 * Purpose: Initialize and verify the SQLite database before the server starts.
 * Runs setup SQL if necessary.
 */
const sharedDbPath = path.join(__dirname, "..", "shared-db", "database.sqlite");
const initSqlPath = path.join(__dirname, "..", "shared-db", "init.sql");

// Create database if it doesn’t exist
async function runSetup(dbPath, initPath) {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  const sql = fs.readFileSync(initPath, "utf8");
  await db.exec(sql);
  console.log("Admin database initialized.");
  return db;
}

let db;
runSetup(sharedDbPath, initSqlPath).then((database) => (db = database));

/**
 * Purpose: Define admin routes
 * The Admin service can create and update events.
 */
// Create event
app.post("/api/admin/events", async (req, res, next) => {
  try {
    const { name, date, tickets } = req.body;

    // Validate inputs
    if (typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid "name": non-empty string required' });
    }
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid "date": expected YYYY-MM-DD' });
    }
    const ticketsNum = Number(tickets);
    if (!Number.isInteger(ticketsNum) || ticketsNum < 0) {
      return res.status(400).json({ error: 'Invalid "tickets": non-negative integer required' });
    }

    const result = await db.run(
      "INSERT INTO events (name, date, tickets) VALUES (?, ?, ?)",
      [name.trim(), date, ticketsNum]
    );

    const inserted = { id: result.lastID, name: name.trim(), date, tickets: ticketsNum };
    return res.status(201).json({ message: "Event created", event: inserted });
  } catch (err) {
    next(err);
  }
});

// Update event
app.put("/api/admin/events/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const { name, date, tickets } = req.body;

    if (typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid "name": non-empty string required' });
    }
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid "date": expected YYYY-MM-DD' });
    }
    const ticketsNum = Number(tickets);
    if (!Number.isInteger(ticketsNum) || ticketsNum < 0) {
      return res.status(400).json({ error: 'Invalid "tickets": non-negative integer required' });
    }

    const result = await db.run(
      "UPDATE events SET name = ?, date = ?, tickets = ? WHERE id = ?",
      [name.trim(), date, ticketsNum, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.status(200).json({
      message: "Event updated",
      event: { id, name: name.trim(), date, tickets: ticketsNum }
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error("Admin service error:", err);
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
});

/**
 * Start the server
 */
const PORT = process.env.PORT || 5001;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Admin service running at http://localhost:${PORT}`);
  });
}

export default app; // <-- must be present
