// src/lib/db/nile/client.js
import pg from 'pg';

// Astro handles .env automatically, no need for dotenv.config()
const connectionString = process.env.NILE_DATABASE_URL;

if (!connectionString) {
  console.warn("⚠️ NILE_DATABASE_URL is missing from process.env");
}

const pool = new pg.Pool({
  connectionString: connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false // Required for Nile/Vercel connectivity
  }
});

export async function nileQuery(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    console.log('📊 Query Executed:', {
      text: text.split('\n')[0],
      duration: `${duration}ms`,
      rows: res.rowCount
    });

    return res;
  } catch (error) {
    console.error('❌ Nile Query Error:', {
      message: error.message,
      query: text
    });
    throw error;
  }
}
