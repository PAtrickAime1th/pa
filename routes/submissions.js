// routes/submissions.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db/connection');

// Insert a new submission
router.post('/', async (req, res) => {
  try {
    const { user_id, quiz_id, answers, score } = req.body;

    // Check required fields
    if (!user_id || !quiz_id || !answers || score === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await pool.execute(
      'INSERT INTO submissions (user_id, quiz_id, answers, score, created_at) VALUES (?, ?, ?, ?, NOW())',
      [user_id, quiz_id, JSON.stringify(answers), score]
    );

    res.status(201).json({
      message: 'Submission recorded!',
      submissionId: result.insertId
    });
  } catch (err) {
    console.error('Error inserting submission:', err.message);
    res.status(500).json({ error: 'Failed to record submission', message: err.message });
  }
});

// Get all submissions
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM submissions ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching submissions:', err.message);
    res.status(500).json({ error: 'Failed to fetch submissions', message: err.message });
  }
});

module.exports = router;
