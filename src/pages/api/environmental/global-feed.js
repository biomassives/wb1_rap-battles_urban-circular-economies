import { getGlobalFeed } from '../../../lib/environmental.js';

export const prerender = false;

export const GET = async () => {
  try {
    const feed = await getGlobalFeed(30);
    return new Response(JSON.stringify(feed), { status: 200 });
  } catch (error) {
    console.error("Global Feed API error:", error.message);
    return new Response(JSON.stringify({
      error: 'Database query failed',
      details: error.message
    }), { status: 500 });
  }
};
