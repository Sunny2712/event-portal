// Auth routes: signup, login, profile
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  // Only allow student/organizer at signup — admins are created manually in the DB
  const safeRole = role === 'organizer' ? 'organizer' : 'student';

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, safeRole]
    );
    res.status(201).json({ id: result.insertId, name, email, role: safeRole });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = result.rows[0];

    // Same error for "no user" and "wrong password" — don't leak which one it was
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/profile
router.get('/profile', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  res.json(result.rows[0]);
});

module.exports = router;
