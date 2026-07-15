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
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in public schema:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}
main();
