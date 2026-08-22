-- Event Management Portal — Database Schema (PostgreSQL)
-- Run with: psql -d event_portal -f schema.sql

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'student'
                CHECK (role IN ('student', 'organizer', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE events (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  category     VARCHAR(50),
  venue        VARCHAR(200),
  event_date   TIMESTAMPTZ NOT NULL,
  capacity     INTEGER NOT NULL CHECK (capacity > 0),
  banner_url   TEXT,
  organizer_id INTEGER NOT NULL REFERENCES users(id),
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE registrations (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  event_id      INTEGER NOT NULL REFERENCES events(id),
  ticket_id     VARCHAR(36) NOT NULL UNIQUE,   -- UUID, encoded in the QR code
  attended      BOOLEAN NOT NULL DEFAULT FALSE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, event_id)                   -- prevents duplicate registrations
);

-- A seed admin account (password is "admin123" hashed — replace after first login)
-- Generate a real hash with: node -e "console.log(require('bcrypt').hashSync('admin123', 10))"
