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

// CRUD for attempts
app.post('/api/attempts', async (req, res) => {
  const { user_id, quiz_id, score } = req.body;
  try {
    const [results] = await pool.execute(
      'INSERT INTO attempts (user_id, quiz_id, score) VALUES (?, ?, ?)',
      [user_id, quiz_id, score]
    );
    res.status(201).json({ message: 'Attempt created successfully', id: results.insertId });
  } catch (err) {
    console.error('Error inserting attempt: ', err);
    res.status(500).json({ error: 'Failed to insert attempt' });
  }
});

app.get('/api/attempts', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM attempts');
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching attempts: ', err);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

app.get('/api/attempts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM attempts WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Attempt not found' });
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error fetching attempt: ', err);
    res.status(500).json({ error: 'Failed to fetch attempt' });
  }
});

app.put('/api/attempts/:id', async (req, res) => {
  const { id } = req.params;
  const { score } = req.body;
  try {
    const [results] = await pool.execute('UPDATE attempts SET score = ? WHERE id = ?', [score, id]);
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Attempt not found' });
    res.status(200).json({ message: 'Attempt updated successfully' });
  } catch (err) {
    console.error('Error updating attempt: ', err);
    res.status(500).json({ error: 'Failed to update attempt' });
  }
});

app.delete('/api/attempts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await pool.execute('DELETE FROM attempts WHERE id = ?', [id]);
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Attempt not found' });
    res.status(200).json({ message: 'Attempt deleted successfully' });
  } catch (err) {
    console.error('Error deleting attempt: ', err);
    res.status(500).json({ error: 'Failed to delete attempt' });
  }
});

// CRUD for options
app.post('/api/options', async (req, res) => {
  const { question_id, text, is_correct } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO options (question_id, text, is_correct) VALUES (?, ?, ?)',
      [question_id, text, is_correct]
    );
    res.status(201).json({ id: result.insertId, question_id, text, is_correct });
  } catch (err) {
    res.status(500).json({ error: 'Error creating option', message: err.message });
  }
});

app.get('/api/options', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM options');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching options', message: err.message });
  }
});

app.get('/api/options/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM options WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching option', message: err.message });
  }
});

app.put('/api/options/:id', async (req, res) => {
  const { id } = req.params;
  const { question_id, text, is_correct } = req.body;
  try {
    const [result] = await pool.execute(
      'UPDATE options SET question_id = ?, text = ?, is_correct = ? WHERE id = ?',
      [question_id, text, is_correct, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ id, question_id, text, is_correct });
  } catch (err) {
    res.status(500).json({ error: 'Error updating option', message: err.message });
  }
});

app.delete('/api/options/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute('DELETE FROM options WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Error deleting option', message: err.message });
  }
});

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

app.get('/api/questions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM questions WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching question', message: err.message });
  }
});

app.put('/api/questions/:id', async (req, res) => {
  const { id } = req.params;
  const { quiz_id, text } = req.body;
  try {
    const [result] = await pool.execute(
      'UPDATE questions SET quiz_id = ?, text = ? WHERE id = ?',
      [quiz_id, text, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ id, quiz_id, text });
  } catch (err) {
    res.status(500).json({ error: 'Error updating question', message: err.message });
  }
});

app.delete('/api/questions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute('DELETE FROM questions WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Error deleting question', message: err.message });
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

app.delete('/api/quizzes/:id', async (req, res) => {
  const quizId = req.params.id;
  try {
    const [result] = await pool.execute('DELETE FROM quizzes WHERE id = ?', [quizId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Quiz not found' });
    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting quiz:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
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