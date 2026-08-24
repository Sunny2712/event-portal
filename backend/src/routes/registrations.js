// Registration routes: register, cancel, my tickets, organizer views, attendance
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/registrations  { event_id }  — student registers for an event
router.post('/', requireAuth, async (req, res) => {
  const { event_id } = req.body;

  try {
    // 1. Event must exist, be approved, and not be in the past
    const eventResult = await pool.query(
      `SELECT id, capacity FROM events
       WHERE id = ? AND status = 'approved' AND event_date >= NOW()`,
      [event_id]
    );
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found or not open for registration' });
    }

    // 2. Capacity check
    const countResult = await pool.query(
      'SELECT COUNT(*) AS count FROM registrations WHERE event_id = ?',
      [event_id]
    );
    if (Number(countResult.rows[0].count) >= eventResult.rows[0].capacity) {
      return res.status(409).json({ error: 'Event is full' });
    }

    // 3. Insert — the UNIQUE (user_id, event_id) key blocks duplicates
    const ticketId = uuidv4();
    const result = await pool.query(
      'INSERT INTO registrations (user_id, event_id, ticket_id) VALUES (?, ?, ?)',
      [req.user.id, event_id, ticketId]
    );
    const created = await pool.query('SELECT * FROM registrations WHERE id = ?', [result.insertId]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Already registered for this event' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/registrations/:eventId  — cancel my registration
router.delete('/:eventId', requireAuth, async (req, res) => {
  const result = await pool.query(
    'DELETE FROM registrations WHERE user_id = ? AND event_id = ?',
    [req.user.id, req.params.eventId]
  );
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Registration not found' });
  }
  res.json({ message: 'Registration cancelled' });
});

// GET /api/registrations/my-events  — events I'm registered for (with ticket)
router.get('/my-events', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT r.ticket_id, r.attended, r.registered_at,
            e.id AS event_id, e.title, e.venue, e.event_date, e.banner_url
     FROM registrations r
     JOIN events e ON e.id = r.event_id
     WHERE r.user_id = ?
     ORDER BY e.event_date ASC`,
    [req.user.id]
  );
  // MySQL stores BOOLEAN as 0/1 — convert for a clean JSON API
  res.json(result.rows.map((row) => ({ ...row, attended: Boolean(row.attended) })));
});

// ── Organizer routes ──────────────────────────────────────────

// GET /api/registrations/event/:eventId  — attendee list for my event
router.get('/event/:eventId', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  const result = await pool.query(
    `SELECT r.id, r.ticket_id, r.attended, r.registered_at, u.name, u.email
     FROM registrations r
     JOIN users u ON u.id = r.user_id
     JOIN events e ON e.id = r.event_id
     WHERE r.event_id = ? AND (e.organizer_id = ? OR ? = 'admin')
     ORDER BY r.registered_at ASC`,
    [req.params.eventId, req.user.id, req.user.role]
  );
  res.json(result.rows.map((row) => ({ ...row, attended: Boolean(row.attended) })));
});

// POST /api/registrations/attendance  { ticket_id }  — mark attendance from QR scan
router.post('/attendance', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  const { ticket_id } = req.body;

  // Look the ticket up first so we can detect a duplicate scan
  const found = await pool.query(
    `SELECT r.id, r.attended, u.name AS attendee_name
     FROM registrations r JOIN users u ON u.id = r.user_id
     WHERE r.ticket_id = ?`,
    [ticket_id]
  );
  if (found.rows.length === 0) {
    return res.status(404).json({ error: 'Invalid ticket' });
  }

  const ticket = found.rows[0];

  // Duplicate scan: possible ticket sharing — report it instead of silently succeeding
  if (ticket.attended) {
    return res.json({
      message: 'Already checked in',
      already_checked_in: true,
      id: ticket.id,
      attended: true,
      attendee_name: ticket.attendee_name,
    });
  }

  await pool.query('UPDATE registrations SET attended = TRUE WHERE id = ?', [ticket.id]);
  res.json({
    message: 'Attendance marked',
    already_checked_in: false,
    id: ticket.id,
    attended: true,
    attendee_name: ticket.attendee_name,
  });
});

module.exports = router;
