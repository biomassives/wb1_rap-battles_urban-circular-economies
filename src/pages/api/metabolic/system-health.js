// src/pages/api/metabolic/system-health.js
import { nileQuery } from '../../../lib/db/nile/client.js';

export async function GET() {
  try {
    await nileQuery('SELECT 1');

    return new Response(JSON.stringify({
      ok: true,
      nile: 'healthy'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('System health error:', error);

    return new Response(JSON.stringify({
      ok: false,
      nile: 'error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

