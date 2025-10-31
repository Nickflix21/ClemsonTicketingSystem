/**
 * server.js (Admin Service)
 * Purpose: Boots the Express server for the Admin microservice.
 *           Handles all routing for admin APIs on port 5001 and connects to the shared SQLite database.
 */

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// ✅ Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// ✅ Create Express app
const app = express();
app.use(cors());
app.use(express.json()); // Parse JSON bodies from incoming requests

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
  console.log("✅ Admin database initialized.");
  return db;
}

let db;
runSetup(sharedDbPath, initSqlPath).then((database) => (db = database));

/**
 * Purpose: Define admin routes
 * The Admin service can create and update events.
 */
app.post("/api/admin/events", async (req, res, next) => {
  try {
    const { name, date, tickets } = req.body;
    if (!name || !date || !tickets) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    await db.run(
      "INSERT INTO events (name, date, tickets) VALUES (?, ?, ?)",
      [name, date, tickets]
    );
    res.json({ success: true, message: "Event created successfully." });
  } catch (err) {
    next(err);
  }
});

app.put("/api/admin/events/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, date, tickets } = req.body;
    await db.run(
      "UPDATE events SET name = ?, date = ?, tickets = ? WHERE id = ?",
      [name, date, tickets, id]
    );
    res.json({ success: true, message: "Event updated successfully." });
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
app.listen(PORT, () => {
  console.log(`✅ Admin service running at http://localhost:${PORT}`);
});
