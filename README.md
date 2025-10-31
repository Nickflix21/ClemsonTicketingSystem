# TigerTix — LLM-Driven Ticket Booking System

TigerTix is a Clemson-themed ticket booking system that integrates a **Large Language Model (LLM)** and a **voice-enabled conversational assistant** to allow users to search and book campus event tickets through natural language or speech.

---

## Project Overview

**Architecture**
- `backend/client-service` → Manages event data and ticket purchases using SQLite.
- `backend/llm-driven-booking` → Uses a local LLM (via Ollama + Llama 3) to parse natural language input (e.g., *“Book two tickets for Clemson Homecoming”*).
- `frontend` → React web app providing a user interface with both **manual booking** and **voice assistant** support.

---

## Directory Structure

```
ClemsonTicketingSystem/
├── backend/
│   ├── client-service/         # Express + SQLite backend for events
│   └── llm-driven-booking/     # Express + Ollama LLM parser service
├── frontend/                   # React app with voice-enabled UI
└── README.md                   # You are here
```

---

## Prerequisites

Make sure the following are installed on your system:

- **Node.js** (v18+)
- **npm** (v9+)
- **Ollama** (for local LLM inference)
  - [Install Ollama](https://ollama.ai/download)
- **SQLite3** (CLI tool, optional but useful for debugging)
- **Port availability**
  - `3000` → Frontend React app  
  - `6001` → Client service backend  
  - `6101` → LLM booking backend  
  - `11434` → Ollama model server (default Ollama port)

---

## LLM Setup (Ollama)

1. Make sure Ollama is running:
   ```bash
   ollama serve
   ```

2. Pull the Llama 3 model (or confirm it’s installed):
   ```bash
   ollama pull llama3
   ```

3. Verify the model is available:
   ```bash
   curl http://localhost:11434/api/tags
   ```

You should see:
```json
{"models":[{"name":"llama3:latest", ... }]}
```

---

## 1. Start the Client Service Backend

Handles event data and ticket purchases.

```bash
cd backend/client-service
npm install
npm start
```

Expected Output:
```
Using DB at: /path/to/backend/client-service/database.sqlite
Database initialized and ready.
Client service running on port 6001
```

Test it by visiting:  
[http://localhost:6001/api/events](http://localhost:6001/api/events)

You should see a list of events in JSON format.

---

## 2. Start the LLM-Driven Booking Backend

Parses natural language queries like “Book three tickets for Clemson Football Hate Watch.”

```bash
cd backend/llm-driven-booking
npm install
npm start
```

Expected Output:
```
llm-driven-booking running at http://localhost:6101
```

Test it manually:
```bash
curl http://localhost:6101/api/llm/parse   -X POST   -H "Content-Type: application/json"   -d '{"text":"Book two tickets for Clemson Homecoming"}'
```

You should receive JSON output like:
```json
{"intent":"propose_booking","event":"Clemson Homecoming","tickets":2}
```

---

## 3. Start the Frontend (React App)

Launches the voice-enabled web interface.

```bash
cd frontend
npm install
npm start
```

This will open the app at:
[http://localhost:3000](http://localhost:3000)

If port 3000 is already in use, React may ask to start on another port — choose **“No”** if possible, since the backend’s CORS allows only `http://localhost:3000` by default.  
If you must use another port, update CORS in `backend/client-service/server.js` accordingly.

---

## Voice Assistant Demo

1. Click **Speak**.
2. Say a command such as:
   ```
   Book three tickets for Clemson Football Hate Watch
   ```
3. You’ll see:
   - Your spoken text appear in the chat window.
   - The LLM interpret the intent.
   - A confirmation prompt:
     > I found Clemson Football Hate Watch with 3 ticket(s). Would you like to confirm this booking?
4. Say “**yes**” to confirm — the purchase will be processed through the backend.

---

## Common Issues

### “Failed to fetch”
- Backend (`client-service`) isn’t running or CORS misconfiguration.
- Fix: Ensure this is at the top of `server.js`:
  ```js
  app.use(cors());
  app.use(express.json());
  ```

### “address already in use :::6001”
- Another process is using that port.
- Run:
  ```bash
  sudo lsof -i :6001 | awk 'NR>1 {print $2}' | xargs -r kill -9
  ```

### LLM returning “Unknown Event”
- The LLM doesn’t recognize your event text.
- Fix: ensure your backend `parseController.js` sends event names from the database dynamically to the prompt.

### No sound / speech
- Chrome users: ensure microphone access is enabled.
- Firefox users: Web Speech API may need enabling in `about:config`.

---

## Shutdown Instructions

To stop all services cleanly:
```bash
# In each terminal
Ctrl + C
```

Optional cleanup:
```bash
sudo lsof -i :6001 :6101 :3000 | awk 'NR>1 {print $2}' | xargs -r kill -9
```

---