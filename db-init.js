import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  console.log('Connecting to Neon DB...');
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, 'schema.sql');
    console.log(`Reading schema SQL from: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing Schema migration & seeding...');
    await client.query(sql);
    console.log('✓ Database tables created and seeded successfully.');
  } catch (err) {
    console.error('⚠️ Database setup failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
