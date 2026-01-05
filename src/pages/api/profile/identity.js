// src/pages/api/identity.js
export async function GET({ request }) {
  const url = new URL(request.url);
  const xp = parseInt(url.searchParams.get('xp') || '0');

  // Logic: The more XP, the more complex the SVG string
  let paths = "M250 140 V190"; // The Seed
  if (xp > 500) paths += " M210 210 L235 210 M265 210 L290 210"; // The Restoration

  return new Response(JSON.stringify({
    identity_path: paths,
    glow_intensity: Math.min(1.0, xp / 1000)
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
