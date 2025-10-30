// backend/client-service/server.js
const express = require('express');
const cors = require('cors');
const clientRoutes = require('./routes/clientRoutes');
require('dotenv').config();
const { OpenAI } = require('openai');

const app = express();
const PORT = 6001;

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  req.openai = openaiClient;
  next();
});

// Same as demo: mount under /api
app.use('/api', clientRoutes);

// (Optional) error handler
app.use((err, req, res, next) => {
  console.error('Client service error:', err);
  res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Client service running at http://localhost:${PORT}`);
});