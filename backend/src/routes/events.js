// Event routes: browse, create, edit, admin approval
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Shared SELECT: event + organizer name + registration count
const EVENT_SELECT = `
  SELECT e.*, u.name AS organizer_name, COALESCE(rc.count, 0) AS registered_count
  FROM events e
  JOIN users u ON u.id = e.organizer_id
  LEFT JOIN (SELECT event_id, COUNT(*) AS count FROM registrations GROUP BY event_id) rc
    ON rc.event_id = e.id`;

// GET /api/events?category=coding&search=hack
// Public: only approved, upcoming events. Includes registration count.
router.get('/', async (req, res) => {
  const { category, search } = req.query;

  let query = `${EVENT_SELECT} WHERE e.status = 'approved' AND e.event_date >= NOW()`;
  const params = [];

  if (category) {
    params.push(category);
    query += ' AND e.category = ?';
  }
  if (search) {
    params.push(`%${search}%`);
    query += ' AND e.title LIKE ?'; // MySQL LIKE is case-insensitive by default
  }
  query += ' ORDER BY e.event_date ASC';

  const result = await pool.query(query, params);
  res.json(result.rows);
});

// GET /api/events/mine  (organizer or admin) — my events, any status
// NOTE: must be declared before /:id so "mine" isn't matched as an id
router.get('/mine', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  const result = await pool.query(
    `SELECT e.*, COALESCE(rc.count, 0) AS registered_count
     FROM events e
     LEFT JOIN (SELECT event_id, COUNT(*) AS count FROM registrations GROUP BY event_id) rc
       ON rc.event_id = e.id
     WHERE e.organizer_id = ?
     ORDER BY e.event_date DESC`,
    [req.user.id]
  );
  res.json(result.rows);
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  const result = await pool.query(`${EVENT_SELECT} WHERE e.id = ?`, [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json(result.rows[0]);
});

// POST /api/events  (organizer or admin) — new events start as 'pending'
router.post('/', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  const { title, description, category, venue, event_date, capacity, banner_url } = req.body;

  if (!title || !event_date || !capacity) {
    return res.status(400).json({ error: 'title, event_date and capacity are required' });
  }

  const result = await pool.query(
    `INSERT INTO events (title, description, category, venue, event_date, capacity, banner_url, organizer_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description ?? null, category ?? null, venue ?? null, event_date, capacity, banner_url ?? null, req.user.id]
  );
  const created = await pool.query('SELECT * FROM events WHERE id = ?', [result.insertId]);
  res.status(201).json(created.rows[0]);
});

// PUT /api/events/:id  (only the organizer who created it, or admin)
router.put('/:id', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  const { title, description, category, venue, event_date, capacity, banner_url } = req.body;

  // Ownership check first — MySQL has no UPDATE ... RETURNING
  const owned = await pool.query(
    'SELECT id FROM events WHERE id = ? AND organizer_id = ?',
    [req.params.id, req.user.id]
  );
  if (owned.rows.length === 0) {
    return res.status(404).json({ error: 'Event not found or not yours' });
  }

  await pool.query(
    `UPDATE events
     SET title = COALESCE(?, title),
         description = COALESCE(?, description),
         category = COALESCE(?, category),
         venue = COALESCE(?, venue),
         event_date = COALESCE(?, event_date),
         capacity = COALESCE(?, capacity),
         banner_url = COALESCE(?, banner_url)
     WHERE id = ?`,
    [title ?? null, description ?? null, category ?? null, venue ?? null,
     event_date ?? null, capacity ?? null, banner_url ?? null, req.params.id]
  );
  const updated = await pool.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
  res.json(updated.rows[0]);
});

// ── Admin routes ──────────────────────────────────────────────

// GET /api/events/admin/pending  (admin only) — events waiting for approval
router.get('/admin/pending', requireAuth, requireRole('admin'), async (req, res) => {
  const result = await pool.query(
    `SELECT e.*, u.name AS organizer_name
     FROM events e JOIN users u ON u.id = e.organizer_id
     WHERE e.status = 'pending' ORDER BY e.created_at ASC`
  );
  res.json(result.rows);
});

// PUT /api/events/:id/status  (admin only) — approve or reject
router.put('/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
  }
  const result = await pool.query('UPDATE events SET status = ? WHERE id = ?', [status, req.params.id]);
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Event not found' });
  }
  const updated = await pool.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
  res.json(updated.rows[0]);
});

module.exports = router;
