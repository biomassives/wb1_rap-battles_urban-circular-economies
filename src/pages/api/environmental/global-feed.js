import { getGlobalFeed } from '../../../lib/db/nile/environmental.js';

export const GET = async () => {
  try {
    const feed = await getGlobalFeed(30);
    return new Response(JSON.stringify(feed), { status: 200 });
  } catch (error) {
    // This will show up in your terminal where 'npm run dev' is running
    console.error("DEBUG: Global Feed API Failure:", error.message);
    
    return new Response(JSON.stringify({ 
      error: 'Database query failed',
      details: error.message 
    }), { status: 500 });
  }
};
