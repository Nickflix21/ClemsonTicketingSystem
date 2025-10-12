# TigerTix Project (CPSC 3720)

## Overview
TigerTix is a two-part microservice project built in Node.js using Express and SQLite.

- **Admin Service** (Task 1): Creates and manages events.
- **Client Service** (Task 2): Views events and allows ticket purchases.

Both share a single SQLite database located in `backend/shared-db`.

---

## Project Structure
```
backend/
├── admin-service/      # Admin microservice (port 5001)
├── client-service/     # Client microservice (port 6001)
└── shared-db/          # Shared SQLite database
```

---

## Setup & Run

### Admin Service
```bash
cd backend/admin-service
npm install
npm start
```
Runs on **http://localhost:5001**

### Client Service
```bash
cd backend/client-service
npm install
npm start
```
Runs on **http://localhost:6001**

---

## Example Commands

Create event (Admin):
```bash
curl -X POST http://localhost:5001/api/admin/events   -H "Content-Type: application/json"   -d '{"name":"Clemson Game","date":"2025-10-25","tickets":5}'
```

View events (Client):
```bash
curl http://localhost:6001/api/events
```

Purchase ticket (Client):
```bash
curl -X POST http://localhost:6001/api/events/1/purchase
```

---

## Notes
- Both services must have their **own package.json and node_modules**.
- The database path should be `../../shared-db/database.sqlite` from each service’s `models` folder.

---

© 2025 - CPSC 3720 TigerTix Project