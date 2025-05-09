// routes/attempts.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db/connection');
require('dotenv').config();

// Route to submit a quiz attempt
router.post('/', async (req, res) => {
  try {
    const { user_id, quiz_id, score } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO attempts (user_id, quiz_id, score, created_at) VALUES (?, ?, ?, NOW())',
      [user_id, quiz_id, score]
    );
    res.status(201).json({ message: 'Attempt recorded!', attemptId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Route to get all attempts
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM attempts');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get attempts' });
  }
});

module.exports = router;
