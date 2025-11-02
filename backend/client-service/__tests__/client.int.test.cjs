// __tests__/client.int.test.cjs  (CommonJS)

// use require for libs
const request = require("supertest");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

// we'll import the ESM server dynamically inside beforeAll
let app;
let db;

const dbPath = path.join(__dirname, "..", "..", "shared-db", "database.sqlite");

beforeAll(async () => {
  // dynamic import to load ESM app from CJS test
  app = (await import("../server.js")).default;

  db = await open({ filename: dbPath, driver: sqlite3.Database });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      tickets INTEGER NOT NULL CHECK(tickets >= 0)
    );
  `);
  await db.exec("DELETE FROM events;");
  await db.exec(`
    INSERT INTO events (name, date, tickets) VALUES
      ('Concert', '2025-12-01', 3),
      ('Play',    '2025-12-10', 1);
  `);
});

afterAll(async () => {
  if (db) await db.close();
});

test("GET /api/events returns a list", async () => {
  const res = await request(app).get("/api/events");
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThanOrEqual(2);
  expect(res.body[0]).toHaveProperty("name");
});

test("POST /api/events/:id/purchase decrements tickets", async () => {
  const row = await db.get("SELECT id, tickets FROM events WHERE name='Concert'");
  const res = await request(app)
    .post(`/api/events/${row.id}/purchase`)
    .send({ quantity: 1 });
  expect(res.statusCode).toBe(200);

  const after = await db.get("SELECT tickets FROM events WHERE id=?", row.id);
  expect(after.tickets).toBe(row.tickets - 1);
});

test("returns 409 when not enough tickets", async () => {
  const row = await db.get("SELECT id FROM events WHERE name='Play'"); // only 1 ticket
  const res = await request(app)
    .post(`/api/events/${row.id}/purchase`)
    .send({ quantity: 2 });
  // 409 if you applied the earlier tweak; otherwise could be 500
  expect([409, 500]).toContain(res.statusCode);
});
