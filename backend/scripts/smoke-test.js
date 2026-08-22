// End-to-end smoke test using pg-mem (in-memory Postgres) — no real DB needed.
// Run with: node scripts/smoke-test.js
const fs = require('fs');
const path = require('path');
const { newDb } = require('pg-mem');
const bcrypt = require('bcrypt');

process.env.JWT_SECRET = 'test-secret';

// 1. Boot an in-memory Postgres and load the real schema
const mem = newDb();
const schema = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
mem.public.none(schema);

// 2. Make src/db.js resolve to the in-memory pool before routes load it
const { Pool } = mem.adapters.createPg();
const dbPath = require.resolve('../src/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: new Pool() };

// 3. Build the same app as server.js
const express = require('express');
const app = express();
app.use(express.json());
app.use('/api/auth', require('../src/routes/auth'));
app.use('/api/events', require('../src/routes/events'));
app.use('/api/registrations', require('../src/routes/registrations'));

let passed = 0;
function assert(cond, name) {
  if (!cond) throw new Error(`FAIL: ${name}`);
  passed++;
  console.log(`  ok - ${name}`);
}

async function main() {
  // Seed an admin (admins can't sign up through the API)
  const pool = require('../src/db');
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')`,
    ['Admin', 'admin@college.edu', await bcrypt.hash('admin123', 4)]
  );

  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}/api`;

  async function call(pathname, { method = 'GET', body, token } = {}) {
    const res = await fetch(base + pathname, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, data: await res.json().catch(() => ({})) };
  }

  const future = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  // ── Auth ──
  let r = await call('/auth/signup', { method: 'POST', body: { name: 'Stu', email: 's@c.edu', password: 'pass123' } });
  assert(r.status === 201 && r.data.role === 'student', 'student signup');

  r = await call('/auth/signup', { method: 'POST', body: { name: 'Stu2', email: 's@c.edu', password: 'x' } });
  assert(r.status === 409, 'duplicate email rejected');

  r = await call('/auth/signup', { method: 'POST', body: { name: 'Org', email: 'o@c.edu', password: 'pass123', role: 'organizer' } });
  assert(r.status === 201 && r.data.role === 'organizer', 'organizer signup');

  r = await call('/auth/signup', { method: 'POST', body: { name: 'Evil', email: 'e@c.edu', password: 'x', role: 'admin' } });
  assert(r.status === 201 && r.data.role === 'student', 'admin role at signup downgraded to student');

  r = await call('/auth/login', { method: 'POST', body: { email: 's@c.edu', password: 'wrong' } });
  assert(r.status === 401, 'wrong password rejected');

  const student = (await call('/auth/login', { method: 'POST', body: { email: 's@c.edu', password: 'pass123' } })).data.token;
  const organizer = (await call('/auth/login', { method: 'POST', body: { email: 'o@c.edu', password: 'pass123' } })).data.token;
  const admin = (await call('/auth/login', { method: 'POST', body: { email: 'admin@college.edu', password: 'admin123' } })).data.token;
  assert(student && organizer && admin, 'all three roles can log in');

  // ── Events + approval flow ──
  r = await call('/events', { method: 'POST', token: student, body: { title: 'X', event_date: future, capacity: 5 } });
  assert(r.status === 403, 'student cannot create events');

  r = await call('/events', { method: 'POST', token: organizer, body: { title: 'Hackathon', category: 'Coding', venue: 'Hall A', event_date: future, capacity: 2 } });
  assert(r.status === 201 && r.data.status === 'pending', 'organizer creates event (pending)');
  const eventId = r.data.id;

  r = await call('/events');
  assert(r.status === 200 && r.data.length === 0, 'pending event hidden from public list');

  r = await call('/events/admin/pending', { token: organizer });
  assert(r.status === 403, 'organizer cannot see admin pending list');

  r = await call('/events/admin/pending', { token: admin });
  assert(r.status === 200 && r.data.length === 1, 'admin sees pending event');

  r = await call(`/events/${eventId}/status`, { method: 'PUT', token: admin, body: { status: 'approved' } });
  assert(r.status === 200 && r.data.status === 'approved', 'admin approves event');

  r = await call('/events');
  assert(r.data.length === 1 && r.data[0].registered_count === 0, 'approved event visible with count 0');

  r = await call('/events?search=hack');
  assert(r.data.length === 1, 'search finds event (case-insensitive)');

  r = await call('/events/mine', { token: organizer });
  assert(r.status === 200 && r.data.length === 1, 'organizer sees own events');

  // ── Registration ──
  r = await call('/registrations', { method: 'POST', token: student, body: { event_id: eventId } });
  assert(r.status === 201 && r.data.ticket_id, 'student registers, gets ticket');
  const ticketId = r.data.ticket_id;

  r = await call('/registrations', { method: 'POST', token: student, body: { event_id: eventId } });
  assert(r.status === 409, 'duplicate registration blocked');

  // Fill the last seat (capacity 2), then a third user is turned away
  await call('/auth/signup', { method: 'POST', body: { name: 'S2', email: 's2@c.edu', password: 'pass123' } });
  const student2 = (await call('/auth/login', { method: 'POST', body: { email: 's2@c.edu', password: 'pass123' } })).data.token;
  r = await call('/registrations', { method: 'POST', token: student2, body: { event_id: eventId } });
  assert(r.status === 201, 'second student fills last seat');

  await call('/auth/signup', { method: 'POST', body: { name: 'S3', email: 's3@c.edu', password: 'pass123' } });
  const student3 = (await call('/auth/login', { method: 'POST', body: { email: 's3@c.edu', password: 'pass123' } })).data.token;
  r = await call('/registrations', { method: 'POST', token: student3, body: { event_id: eventId } });
  assert(r.status === 409 && /full/i.test(r.data.error), 'registration rejected when full');

  r = await call('/registrations/my-events', { token: student });
  assert(r.status === 200 && r.data.length === 1 && r.data[0].attended === false, 'my-events shows ticket');

  // ── Attendance ──
  r = await call('/registrations/attendance', { method: 'POST', token: student, body: { ticket_id: ticketId } });
  assert(r.status === 403, 'student cannot mark attendance');

  r = await call('/registrations/attendance', { method: 'POST', token: organizer, body: { ticket_id: ticketId } });
  assert(r.status === 200 && r.data.attended === true && r.data.already_checked_in === false, 'organizer marks attendance via ticket');

  r = await call('/registrations/attendance', { method: 'POST', token: organizer, body: { ticket_id: ticketId } });
  assert(r.status === 200 && r.data.already_checked_in === true, 'second scan flagged as already checked in');

  r = await call('/registrations/attendance', { method: 'POST', token: organizer, body: { ticket_id: 'not-a-ticket' } });
  assert(r.status === 404, 'invalid ticket rejected');

  r = await call(`/registrations/event/${eventId}`, { token: organizer });
  assert(r.status === 200 && r.data.length === 2 && r.data.some((a) => a.attended), 'organizer sees attendee list');

  // ── Cancellation ──
  r = await call(`/registrations/${eventId}`, { method: 'DELETE', token: student2 });
  assert(r.status === 200, 'student cancels registration');

  r = await call('/registrations', { method: 'POST', token: student3, body: { event_id: eventId } });
  assert(r.status === 201, 'freed seat can be taken again');

  server.close();
  console.log(`\nAll ${passed} checks passed.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
