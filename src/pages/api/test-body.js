export async function POST({ request }) {
  console.log('=== REQUEST DEBUG ===');
  console.log('Headers:', Object.fromEntries(request.headers));
  console.log('Body stream used:', request.bodyUsed);

  try {
    const text = await request.text();
    console.log('Body text:', text);
    console.log('Body length:', text.length);

    return new Response(JSON.stringify({
      success: true,
      receivedText: text,
      length: text.length,
      bodyUsed: request.bodyUsed
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
