import { sql } from '../../../lib/db.js';
export const prerender = false;

export async function GET() {
  try {
    await sql`SELECT 1`;
    return new Response(JSON.stringify({ db: 'ok' }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({
      db: 'error',
      message: e.message
    }), { status: 500 });
  }
}
