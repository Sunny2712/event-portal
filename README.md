# Event Management Portal

A college event management system — students browse and register for events,
organizers create events and mark attendance via QR tickets, admins approve events.

## Tech Stack

- **Frontend**: React + Tailwind CSS (in `frontend/` — to be created with Vite)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: JWT + bcrypt

## Setup

### 1. Database

```bash
createdb event_portal
psql -d event_portal -f database/schema.sql
```

Create an admin user (generate a hash first):

```bash
cd backend && npm install
node -e "console.log(require('bcrypt').hashSync('admin123', 10))"
psql -d event_portal -c "INSERT INTO users (name, email, password_hash, role) VALUES ('Admin', 'admin@college.edu', '<paste-hash-here>', 'admin');"
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # then edit DATABASE_URL and JWT_SECRET
npm install
npm run dev               # starts on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:3000 (proxies /api to the backend)
```

The QR ticket on the My Tickets page encodes the `ticket_id`. The organizer
scans it (any phone QR scanner works for a demo — or type the ticket ID) and
enters it in the Check-in box on the Organizer Dashboard.

### 4. Run the tests (no database needed)

```bash
cd backend
npm test    # 27 end-to-end API checks against an in-memory Postgres (pg-mem)
```

## API Summary

| Method | Route | Who | What |
|---|---|---|---|
| POST | `/api/auth/signup` | anyone | Create account (student/organizer) |
| POST | `/api/auth/login` | anyone | Get JWT token |
| GET | `/api/auth/profile` | logged in | My profile |
| GET | `/api/events` | anyone | Approved upcoming events (`?category=`, `?search=`) |
| GET | `/api/events/:id` | anyone | Event details |
| GET | `/api/events/mine` | organizer | My events (any status) |
| POST | `/api/events` | organizer | Create event (starts as `pending`) |
| PUT | `/api/events/:id` | organizer | Edit own event |
| GET | `/api/events/admin/pending` | admin | Events awaiting approval |
| PUT | `/api/events/:id/status` | admin | Approve/reject event |
| POST | `/api/registrations` | student | Register (`{event_id}`) |
| DELETE | `/api/registrations/:eventId` | student | Cancel registration |
| GET | `/api/registrations/my-events` | student | My tickets |
| GET | `/api/registrations/event/:eventId` | organizer | Attendee list |
| POST | `/api/registrations/attendance` | organizer | Mark attendance (`{ticket_id}`) |

All protected routes need the header: `Authorization: Bearer <token>`

## Quick Test with curl

```bash
# Sign up
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","email":"test@college.edu","password":"pass123"}'

# Log in (copy the token from the response)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@college.edu","password":"pass123"}'

# Browse events
curl http://localhost:5000/api/events
```

## Design Decisions (interview talking points)

- **Duplicate registrations** are blocked by a database `UNIQUE(user_id, event_id)`
  constraint, not application logic — the DB is the source of truth.
- **Passwords** are stored as bcrypt hashes (salted, slow by design).
- **Login errors** are identical for wrong email vs wrong password, so an
  attacker can't discover which emails are registered.
- **Role checks** live in reusable middleware (`requireRole`), not scattered ifs.
- **Event approval** is a status field (`pending → approved/rejected`);
  public listings filter on status in the SQL query, so unapproved events can
  never leak through the frontend.
- **Capacity** is checked before insert. Under very high concurrency two
  simultaneous requests could both pass the check — the fix would be a
  transaction with `SELECT ... FOR UPDATE` on the event row (good to explain
  in an interview even though it's overkill for a college fest).
