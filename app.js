require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool } = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/attempts', require('./routes/attempts'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/submissions', require('./routes/submissions'));

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'healthy' }));

// Global error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
