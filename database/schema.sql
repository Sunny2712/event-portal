-- Event Management Portal — Database Schema (MySQL 8+)
-- Load with: mysql -u root -p event_portal < database/schema.sql

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('student', 'organizer', 'admin') NOT NULL DEFAULT 'student',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  category     VARCHAR(50),
  venue        VARCHAR(200),
  event_date   DATETIME NOT NULL,
  capacity     INT NOT NULL CHECK (capacity > 0),
  banner_url   TEXT,
  organizer_id INT NOT NULL,
  status       ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES users(id)
);

CREATE TABLE registrations (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  event_id      INT NOT NULL,
  ticket_id     VARCHAR(36) NOT NULL UNIQUE,   -- UUID, encoded in the QR code
  attended      BOOLEAN NOT NULL DEFAULT FALSE,
  registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (event_id) REFERENCES events(id),
  UNIQUE KEY uniq_user_event (user_id, event_id)   -- prevents duplicate registrations
);
