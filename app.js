require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db/connection');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Auth routes
app.use('/api/auth', require('./routes/auth'));

// CRUD for questions
app.post('/api/questions', async (req, res) => {
  const { quiz_id, text } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO questions (quiz_id, text) VALUES (?, ?)',
      [quiz_id, text]
    );
    res.status(201).json({ id: result.insertId, quiz_id, text });
  } catch (err) {
    res.status(500).json({ error: 'Error creating question', message: err.message });
  }
});

app.get('/api/questions', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM questions');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching questions', message: err.message });
  }
});

app.get('/api/quizzes/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      // Get the quiz
      const [quizRows] = await pool.execute('SELECT * FROM quizzes WHERE id = ?', [id]);
      if (quizRows.length === 0) return res.status(404).json({ error: 'Quiz not found' });
  
      const quiz = quizRows[0];
  
      // Get questions for the quiz
      const [questionRows] = await pool.execute('SELECT * FROM questions WHERE quiz_id = ?', [id]);
  
      // For each question, get its options
      const questionsWithOptions = await Promise.all(
        questionRows.map(async (question) => {
          const [options] = await pool.execute('SELECT * FROM options WHERE question_id = ?', [question.id]);
          return {
            ...question,
            options: options,
          };
        })
      );
  
      quiz.questions = questionsWithOptions;
  
      res.json(quiz);
    } catch (err) {
      console.error('Error fetching quiz:', err);
      res.status(500).json({ error: 'Error fetching quiz', message: err.message });
    }
  });
  



// CRUD for quizzes
app.post('/api/quizzes', async (req, res) => {
  const { title, description } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO quizzes (title, description) VALUES (?, ?)',
      [title, description]
    );
    res.status(201).json({ id: result.insertId, title, description });
  } catch (err) {
    console.error('Error creating quiz:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

app.get('/api/quizzes', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM quizzes');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching quizzes:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

app.get('/api/quizzes/:id', async (req, res) => {
  const quizId = req.params.id;
  try {
    const [rows] = await pool.execute('SELECT * FROM quizzes WHERE id = ?', [quizId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Quiz not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching quiz:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

app.put('/api/quizzes/:id', async (req, res) => {
  const quizId = req.params.id;
  const { title, description } = req.body;
  try {
    const [result] = await pool.execute(
      'UPDATE quizzes SET title = ?, description = ? WHERE id = ?',
      [title, description, quizId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ id: quizId, title, description });
  } catch (err) {
    console.error('Error updating quiz:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});
// check
app.post('/api/quizzes/:id/submit', async (req, res) => {
  try {
    const quizId = req.params.id;
    const userAnswers = req.body.answers; // { questionId: selectedOptionId }

    // Fetch all the questions for this quiz
    const [questions] = await pool.execute(
      'SELECT * FROM questions WHERE quiz_id = ?',
      [quizId]
    );

    let score = 0;
    const correctAnswers = [];

    // Calculate the score and find the correct answers
    for (let question of questions) {
      const [options] = await pool.execute(
        'SELECT * FROM options WHERE question_id = ?',
        [question.id]
      );

      // Find the correct option for this question
      const correctOption = options.find(option => option.is_correct);
      const userAnswer = userAnswers[question.id];

      // Check if the user's answer is correct
      if (userAnswer === correctOption.id) {
        score++;
        correctAnswers.push(correctOption.id);
      }
    }

    // Send response with the score, correct answers, and win status
    res.json({
      score: score,
      correctAnswers: correctAnswers, // Array of correct answers (option IDs)
      win: score === questions.length, // Check if the user answered all questions correctly
    });
  } catch (error) {
    console.error('Error processing quiz submission:', error);
    res.status(500).send('Error submitting quiz');
  }
});


// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});