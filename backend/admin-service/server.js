/**
 * server.js (Admin Service)
 * Purpose: Boots the Express server for the Admin microservice. 
 *           Handles all routing for admin APIs on port 5001 and connects to the shared SQLite database.
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const adminRoutes = require('./routes/adminRoutes');
const runSetup = require('./setup');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();

/**
 * Purpose: To apply necessary middleware used by the server for handling requests and responses.
 * Input: None
 * Output: Configures the server to handle CORS and parse JSON data.
 */
app.use(cors());
app.use(express.json()); // Parse JSON bodies from incoming requests

/**
 * Purpose: To initialize and verify the SQLite database before the server starts handling requests.
 * Input: 
 *   - sharedDbPath: string, location of the database file
 *   - initSqlPath: string, location of the SQL file used to create tables
 * Output: 
 *   - Runs the setup function to create required tables if they do not already exist.
 */
const sharedDbPath = path.join(__dirname, '..', 'shared-db', 'database.sqlite');
const initSqlPath = path.join(__dirname, '..', 'shared-db', 'init.sql');
runSetup(sharedDbPath, initSqlPath);

/**
 * Purpose: To mount all admin-related routes under the /api/admin path.
 * Input: None
 * Output: Directs incoming admin API requests to the adminRoutes module.
 */
app.use('/api/admin', adminRoutes);

/**
 * Purpose: To handle and format all uncaught errors before sending them back to the client.
 * Input: 
 *   - err: error object containing message and optional status code
 *   - req: request object
 *   - res: response object
 *   - next: Express next() function
 * Output: 
 *   - Returns a JSON error response with the appropriate HTTP status code and error message.
 */
app.use((err, req, res, next) => {
  console.error('Admin service error:', err);
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

/**
 * Purpose: To start the Express server on the specified port (default 5001).
 * Input: None
 * Output: Logs a message to the console indicating that the Admin service is running and ready.
 */
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Admin service running at http://localhost:${PORT}`);
});


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
