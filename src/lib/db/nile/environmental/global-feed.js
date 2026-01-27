// src/pages/api/environmental/global-feed.js
import { getGlobalFeed } from '../../../lib/db/nile/environmental.js';

export const GET = async () => {
  try {
    const feed = await getGlobalFeed(30);
    
    return new Response(JSON.stringify(feed), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Helpful for your "Decentralized/Interoperable" goals:
        'Access-Control-Allow-Origin': '*' 
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Feed unavailable' }), { 
      status: 500 
    });
  }
};
