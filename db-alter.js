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
    console.log('Altering candidates table...');
    
    // Add referred_by_admin_id
    await client.query(`
      ALTER TABLE candidates 
      ADD COLUMN IF NOT EXISTS referred_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL
    `);
    
    // Add assigned_by_admin_id
    await client.query(`
      ALTER TABLE candidates 
      ADD COLUMN IF NOT EXISTS assigned_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL
    `);
    
    console.log('Table altered successfully.');
  } catch (err) {
    console.error('Error during alteration:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
