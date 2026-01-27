/**
 * Join Challenge by Invite Code
 * POST /api/challenges/join/[code]
 */

export const prerender = false;

export async function POST({ params, request }) {
  try {
    const { code } = params;
    const data = await request.json();
    const { wallet } = data;

    if (!code) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid invite code'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // In a full implementation, this would:
    // 1. Look up the challenge by invite code in the database
    // 2. Verify the invite is still valid (not expired, not full)
    // 3. Add the wallet to participants
    // 4. Return the full challenge data

    // For now, return a placeholder response
    // The client-side manager handles local challenges

    console.log(`📥 Join request for code ${code} from wallet ${wallet}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Join request received',
      inviteCode: code.toUpperCase(),
      // When database is implemented, this would include:
      // challenge: { ... full challenge data ... }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Join challenge error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET({ params }) {
  const { code } = params;

  // Return challenge info for the invite code
  return new Response(JSON.stringify({
    success: true,
    inviteCode: code?.toUpperCase(),
    message: 'Use POST to join this challenge'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
