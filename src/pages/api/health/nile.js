// src/pages/api/health/nile.js
import { nileQuery } from '../../../lib/db/nile/client.js';

export async function GET() {
  try {
    await nileQuery('SELECT 1');
    return new Response(JSON.stringify({ nile: 'ok' }), {
      status: 200
    });
  } catch (e) {
    return new Response(JSON.stringify({
      nile: 'error',
      message: e.message
    }), { status: 500 });
  }
}

