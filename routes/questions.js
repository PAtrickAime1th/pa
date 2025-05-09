const express = require('express');
const router = express.Router();
const { executeQuery } = require('../db/connection');
require('dotenv').config();

// Create question
router.post('/', async (req, res) => {
  const { quiz_id, text } = req.body;
  try {
    const result = await executeQuery(
      'INSERT INTO questions (quiz_id, text) VALUES (?, ?)',
      [quiz_id, text]
    );
    res.status(201).json({ id: result.insertId, quiz_id, text });
  } catch (err) {
    res.status(500).json({ error: 'Error creating question', message: err.message });
  }
});

// Get all questions with options
router.get('/', async (req, res) => {
  try {
    const questions = await executeQuery('SELECT * FROM questions');

    const questionsWithOptions = await Promise.all(
      questions.map(async (question) => {
        const options = await executeQuery(
          'SELECT * FROM options WHERE question_id = ?',
          [question.id]
        );
        return { ...question, options };
      })
    );

    res.json(questionsWithOptions);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching questions with options', message: err.message });
  }
});

// Get a specific question by ID with options
router.get('/:questionId', async (req, res) => {
  const { questionId } = req.params;  // Get questionId from the route parameter
  try {
    // Fetch the question based on the ID
    const question = await executeQuery('SELECT * FROM questions WHERE id = ?', [questionId]);

    if (question.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Fetch options for the specific question
    const options = await executeQuery(
      'SELECT * FROM options WHERE question_id = ?',
      [questionId]
    );

    // Combine question and options into one object
    const questionWithOptions = { ...question[0], options };

    res.json(questionWithOptions);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching question with options', message: err.message });
  }
});

// Get questions for a specific quiz with options
router.get('/quiz/:quizId', async (req, res) => {
  const { quizId } = req.params;
  try {
    const questions = await executeQuery(
      'SELECT * FROM questions WHERE quiz_id = ?',
      [quizId]
    );

    const questionsWithOptions = await Promise.all(
      questions.map(async (question) => {
        const options = await executeQuery(
          'SELECT * FROM options WHERE question_id = ?',
          [question.id]
        );
        return { ...question, options };
      })
    );

    res.json(questionsWithOptions);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching quiz questions', message: err.message });
  }
});

module.exports = router;
