// Single shared MySQL connection pool.
// Exposes query(sql, params) returning { rows, insertId, affectedRows }
// so route code reads the same for SELECTs and writes.
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool(process.env.DATABASE_URL);

module.exports = {
  async query(sql, params = []) {
    const [result] = await pool.execute(sql, params);
    if (Array.isArray(result)) {
      return { rows: result }; // SELECT
    }
    // INSERT / UPDATE / DELETE
    return { rows: [], insertId: result.insertId, affectedRows: result.affectedRows };
  },
  end: () => pool.end(),
};
