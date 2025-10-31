// backend/client-service/server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
  origin: function (origin, callback) {
    // allow all localhost ports for React dev
    if (!origin || origin.startsWith("http://localhost")) {
      callback(null, true);
    } else {
      console.log("Blocked CORS for origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  credentials: true,
}));
app.use(express.json()); 


// Use absolute database path (no more mismatched files)
const dbPath = path.join(__dirname, "database.sqlite");
console.log("Using DB at:", dbPath);

let db;
(async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Create table if not exists
  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      date TEXT,
      tickets INTEGER
    )
  `);

  console.log("Database initialized and ready.");
})();

// ------------------------------------------------------
// 1️Get all events
// ------------------------------------------------------
app.get("/api/events", async (req, res) => {
  try {
    const events = await db.all("SELECT * FROM events");
    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// ------------------------------------------------------
// 2️Purchase tickets (used by LLM confirmation)
// ------------------------------------------------------
app.post("/api/events/:id/purchase", async (req, res) => {
  const eventId = req.params.id;
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: "Invalid ticket quantity" });
  }

  try {
    await db.exec("BEGIN TRANSACTION");

    const event = await db.get("SELECT * FROM events WHERE id = ?", [eventId]);
    if (!event) throw new Error("Event not found");
    if (event.tickets < quantity)
      throw new Error("Not enough tickets available");

    const remaining = event.tickets - quantity;
    await db.run("UPDATE events SET tickets = ? WHERE id = ?", [
      remaining,
      eventId,
    ]);

    await db.exec("COMMIT");

    console.log(`Purchased ${quantity} ticket(s) for ${event.name}`);
    res.json({
      success: true,
      eventId,
      purchased: quantity,
      remainingTickets: remaining,
    });
  } catch (err) {
    await db.exec("ROLLBACK");
    console.error("Ticket purchase error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------
// Start the service
// ------------------------------------------------------
const PORT = process.env.PORT || 6001;
app.listen(PORT, () => {
  console.log(`Client service running on port ${PORT}`);
});
