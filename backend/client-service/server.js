// backend/client-service/server.js
const express = require('express');
const cors = require('cors');
const clientRoutes = require('./routes/clientRoutes');

const app = express();
const PORT = 6001;

app.use(cors());
app.use(express.json());

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
