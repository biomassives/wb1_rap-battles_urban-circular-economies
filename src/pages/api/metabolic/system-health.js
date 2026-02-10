import { sql } from '../../../lib/db.js';
export const prerender = false;

export async function GET() {
  try {
    await sql`SELECT 1`;

    return new Response(JSON.stringify({
      ok: true,
      db: 'healthy'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('System health error:', error);

    return new Response(JSON.stringify({
      ok: false,
      db: 'error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
