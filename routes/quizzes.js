const express = require('express');
const router = express.Router();
const { executeQuery } = require('../db/connection');
require('dotenv').config();

// Create a new quiz
router.post('/', async (req, res) => {
  const { title, description } = req.body;
  try {
    const result = await executeQuery(
      'INSERT INTO quizzes (title, description) VALUES (?, ?)',
      [title, description]
    );
    res.status(201).json({ id: result.insertId, title, description });
  } catch (err) {
    res.status(500).json({ error: 'Error creating quiz', message: err.message });
  }
});

// Get all quizzes
router.get('/', async (req, res) => {
  try {
    const rows = await executeQuery('SELECT * FROM quizzes');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching quizzes', message: err.message });
  }
});

// Get a specific quiz by ID (supports /api/quizzes/2)
router.get('/:id', async (req, res) => {
  const quizId = req.params.id;
  try {
    const rows = await executeQuery('SELECT * FROM quizzes WHERE id = ?', [quizId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching quiz', message: err.message });
  }
});

module.exports = router;
