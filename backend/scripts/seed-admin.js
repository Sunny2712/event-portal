// Creates the admin account. Run from the backend/ folder:
//   node scripts/seed-admin.js [email] [password]
// Defaults: admin@college.edu / admin123
require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../src/db');

async function main() {
  const email = process.argv[2] || 'admin@college.edu';
  const password = process.argv[3] || 'admin123';

  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('Admin', $1, $2, 'admin')
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [email, hash]
  );

  if (result.rows.length > 0) {
    console.log(`Admin created: ${email} / ${password}`);
  } else {
    console.log(`A user with email ${email} already exists — nothing changed.`);
  }
  await pool.end();
}

main().catch((err) => {
  console.error('Failed:', err.message);
  console.error('Check that PostgreSQL is running and DATABASE_URL in .env is correct.');
  process.exit(1);
});
