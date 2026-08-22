// Event routes: browse, create, edit, admin approval
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/events?category=coding&search=hack
// Public: only approved, upcoming events. Includes registration count.
router.get('/', async (req, res) => {
  const { category, search } = req.query;

  let query = `
    SELECT e.*, u.name AS organizer_name, COALESCE(rc.count, 0)::int AS registered_count
    FROM events e
    JOIN users u ON u.id = e.organizer_id
    LEFT JOIN (SELECT event_id, COUNT(*)::int AS count FROM registrations GROUP BY event_id) rc
      ON rc.event_id = e.id
    WHERE e.status = 'approved' AND e.event_date >= NOW()`;
  const params = [];

  if (category) {
    params.push(category);
    query += ` AND e.category = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    query += ` AND e.title ILIKE $${params.length}`;
  }
  query += ' ORDER BY e.event_date ASC';

  const result = await pool.query(query, params);
  res.json(result.rows);
});

// GET /api/events/mine  (organizer only) — my events, any status
// NOTE: must be declared before /:id so "mine" isn't matched as an id
router.get('/mine', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  const result = await pool.query(
    `SELECT e.*, COALESCE(rc.count, 0)::int AS registered_count
     FROM events e
     LEFT JOIN (SELECT event_id, COUNT(*)::int AS count FROM registrations GROUP BY event_id) rc
       ON rc.event_id = e.id
     WHERE e.organizer_id = $1
     ORDER BY e.event_date DESC`,
    [req.user.id]
  );
  res.json(result.rows);
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  const result = await pool.query(
    `SELECT e.*, u.name AS organizer_name, COALESCE(rc.count, 0)::int AS registered_count
     FROM events e
     JOIN users u ON u.id = e.organizer_id
     LEFT JOIN (SELECT event_id, COUNT(*)::int AS count FROM registrations GROUP BY event_id) rc
       ON rc.event_id = e.id
     WHERE e.id = $1`,
    [req.params.id]
  );
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
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [title, description, category, venue, event_date, capacity, banner_url, req.user.id]
  );
  res.status(201).json(result.rows[0]);
});

// PUT /api/events/:id  (only the organizer who created it, or admin)
router.put('/:id', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  const { title, description, category, venue, event_date, capacity, banner_url } = req.body;

  const result = await pool.query(
    `UPDATE events
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         category = COALESCE($3, category),
         venue = COALESCE($4, venue),
         event_date = COALESCE($5, event_date),
         capacity = COALESCE($6, capacity),
         banner_url = COALESCE($7, banner_url)
     WHERE id = $8 AND organizer_id = $9
     RETURNING *`,
    [title, description, category, venue, event_date, capacity, banner_url, req.params.id, req.user.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Event not found or not yours' });
  }
  res.json(result.rows[0]);
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
  const result = await pool.query(
    'UPDATE events SET status = $1 WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json(result.rows[0]);
});

module.exports = router;
