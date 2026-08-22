# Event Management Portal

A college event management system — students browse and register for events,
organizers create events and mark attendance via QR tickets, admins approve events.

## Tech Stack

- **Frontend**: React + Tailwind CSS + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: JWT + bcrypt

## Prerequisites

- **Node.js 18 or newer** — https://nodejs.org (check with `node --version`)
- **PostgreSQL 14 or newer**:
  - **Windows**: install from https://www.postgresql.org/download/windows/
    (remember the password you set for the `postgres` user; the installer's
    "SQL Shell (psql)" app gives you a database terminal)
  - **macOS**: `brew install postgresql@16 && brew services start postgresql@16`,
    then add it to your PATH:
    `echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc`
    and open a new terminal
  - **Linux**: `sudo apt install postgresql && sudo systemctl start postgresql`

## Setup

### 1. Database

```bash
createdb event_portal
psql -d event_portal -f database/schema.sql
```

> **Windows note**: run these in "SQL Shell (psql)" or prefix commands with the
> `postgres` user: `createdb -U postgres event_portal` and
> `psql -U postgres -d event_portal -f database/schema.sql`.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # Windows: copy .env.example .env
```

Open `.env` and set:

- `DATABASE_URL` — `postgres://localhost:5432/event_portal` usually works on
  macOS/Linux; on Windows use
  `postgres://postgres:YOUR_PASSWORD@localhost:5432/event_portal`
- `JWT_SECRET` — any long random string

Create the admin account and start the server:

```bash
node scripts/seed-admin.js     # creates admin@college.edu / admin123
npm run dev                    # API on http://localhost:5000
```

### 3. Frontend (in a second terminal)

```bash
cd frontend
npm install
npm run dev               # open http://localhost:3000 in your browser
```

The app lives at **http://localhost:3000** (the frontend forwards API calls to
the backend on port 5000 — you never open port 5000 in the browser).

### 4. Try the full flow

1. Log in as **admin@college.edu / admin123**.
2. Sign up an **organizer** account (role dropdown on the signup page) and a
   **student** account.
3. Organizer: create an event → Admin: approve it (Admin tab) → Student:
   register → My Tickets shows a QR code → Organizer: enter the ticket ID in
   the Check-in box to mark attendance. Scanning the same ticket twice shows a
   duplicate warning.

The QR ticket encodes the `ticket_id`. For a demo, scan it with any phone QR
scanner (or just copy the ticket ID shown under the QR code).

### 5. Run the tests (no database needed)

```bash
cd backend
npm test    # 27 end-to-end API checks against an in-memory Postgres (pg-mem)
```

## Troubleshooting

- **`command not found: psql` / `createdb`** — PostgreSQL isn't installed or
  isn't on your PATH. See Prerequisites above.
- **`Cannot GET /` on port 5000** — that's normal; the backend is an API only.
  Use http://localhost:3000.
- **Backend crashes with a connection error** — PostgreSQL isn't running, or
  `DATABASE_URL` in `backend/.env` is wrong (on Windows it needs the
  `postgres:YOUR_PASSWORD@` part).
- **`npm audit` warnings** — safe to ignore for this project; don't run
  `npm audit fix --force` (it can break dependencies).

## API Summary

| Method | Route | Who | What |
|---|---|---|---|
| POST | `/api/auth/signup` | anyone | Create account (student/organizer) |
| POST | `/api/auth/login` | anyone | Get JWT token |
| GET | `/api/auth/profile` | logged in | My profile |
| GET | `/api/events` | anyone | Approved upcoming events (`?category=`, `?search=`) |
| GET | `/api/events/:id` | anyone | Event details |
| GET | `/api/events/mine` | organizer/admin | My events (any status) |
| POST | `/api/events` | organizer/admin | Create event (starts as `pending`) |
| PUT | `/api/events/:id` | organizer/admin | Edit own event |
| GET | `/api/events/admin/pending` | admin | Events awaiting approval |
| PUT | `/api/events/:id/status` | admin | Approve/reject event |
| POST | `/api/registrations` | student | Register (`{event_id}`) |
| DELETE | `/api/registrations/:eventId` | student | Cancel registration |
| GET | `/api/registrations/my-events` | student | My tickets |
| GET | `/api/registrations/event/:eventId` | organizer | Attendee list |
| POST | `/api/registrations/attendance` | organizer | Mark attendance (`{ticket_id}`); flags duplicate scans |

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
