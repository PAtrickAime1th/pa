require('dotenv').config();
const express = require('express'); 
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // your DB password
  database: 'quiz_app',
});

const JWT_SECRET = 'secret123';

// ===== Middleware to check if user is authenticated =====
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// ===== AUTH ROUTES =====
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  db.query(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [username, hashed],
    (err) => {
      if (err) return res.status(500).json({ error: 'User exists or DB error' });
      res.json({ message: 'Signup success' });
    }
  );
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ error: 'Invalid login' });

    const user = results[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid login' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });
});

// ===== PROTECTED ROUTES =====
app.get('/profile', authenticateToken, (req, res) => {
  res.json({ message: `Welcome ${req.user.username}` });
});

app.get('/quizzes', authenticateToken, (req, res) => {
  db.query('SELECT * FROM quizzes', (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results);
  });
});

app.get('/quiz/:id', authenticateToken, (req, res) => {
  db.query(
    `
    SELECT q.id AS question_id, q.text AS question_text, o.id AS option_id, o.text AS option_text, o.is_correct
    FROM questions q
    JOIN options o ON q.id = o.question_id
    WHERE q.quiz_id = ?
    ORDER BY q.id
  `,
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'DB error' });

      const map = {};
      results.forEach(row => {
        if (!map[row.question_id]) {
          map[row.question_id] = {
            id: row.question_id,
            text: row.question_text,
            options: []
          };
        }
        map[row.question_id].options.push({
          id: row.option_id,
          text: row.option_text,
          is_correct: row.is_correct
        });
      });
      res.json(Object.values(map));
    }
  );
});

// ===== SERVE REACT BUILD (NO `path` LIB) =====
app.use(express.static('./client/build'));
app.get('*', (req, res) =>
  res.sendFile('./client/build/index.html', { root: __dirname })
);

// ===== START SERVER =====
app.listen(3000, () => console.log('✅ Server & frontend running on http://localhost:3000'));
