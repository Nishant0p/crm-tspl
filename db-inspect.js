import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('Columns in users table:', res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}
main();
