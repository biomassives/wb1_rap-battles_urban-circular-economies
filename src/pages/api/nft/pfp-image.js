/**
 * GET /api/nft/pfp-image?animal=chicken&gender=male&hairstyle=dreads&skinTone=%238d5524&name=MC+Thunder
 * Serves SVG image for custom PFP rapper cards
 */

export const prerender = false;

const animalEmojis = {
  'chicken': '🐓', 'dog': '🐕', 'goat': '🐐',
  'ermine': '🦦', 'pigeon': '🕊', 'eagle': '🦅'
};

export async function GET({ url }) {
  const animal = url.searchParams.get('animal') || 'chicken';
  const gender = url.searchParams.get('gender') || 'male';
  const hairstyle = url.searchParams.get('hairstyle') || 'dreads';
  const skinTone = url.searchParams.get('skinTone') || '#c68642';
  const name = url.searchParams.get('name') || 'Custom Rapper';

  const emoji = animalEmojis[animal.toLowerCase()] || '🎤';
  const animalLabel = animal.charAt(0).toUpperCase() + animal.slice(1);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" width="400" height="560">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a0a2e"/>
      <stop offset="100%" stop-color="#1a0a3e"/>
    </linearGradient>
    <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${skinTone}"/>
      <stop offset="100%" stop-color="${skinTone}dd"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="400" height="560" rx="16" fill="url(#bg)"/>
  <rect width="400" height="560" rx="16" fill="none" stroke="#9945FF" stroke-width="2" opacity="0.6"/>

  <!-- PFP badge -->
  <rect x="0" y="0" width="400" height="50" rx="16" fill="#9945FF22"/>
  <text x="20" y="33" font-family="monospace" font-size="14" fill="#9945FF" font-weight="bold">PFP</text>
  <text x="380" y="33" font-family="monospace" font-size="14" fill="#9945FF" text-anchor="end" font-weight="bold">CUSTOM</text>

  <!-- Character area -->
  <rect x="30" y="65" width="340" height="260" rx="12" fill="#0b0f17" stroke="#9945FF44" stroke-width="1"/>
  <circle cx="200" cy="175" r="80" fill="url(#skin)" opacity="0.9"/>
  <text x="200" y="165" font-size="72" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
  <text x="200" y="225" font-family="monospace" font-size="12" fill="#ffffff88" text-anchor="middle">${gender.toUpperCase()}</text>

  <rect x="140" y="240" width="120" height="22" rx="4" fill="#9945FF33"/>
  <text x="200" y="256" font-family="monospace" font-size="11" fill="#9945FF" text-anchor="middle">${hairstyle.charAt(0).toUpperCase() + hairstyle.slice(1)}</text>

  <!-- Name -->
  <text x="200" y="355" font-family="monospace" font-size="20" fill="#ffffff" text-anchor="middle" font-weight="bold" filter="url(#glow)">${name.length > 20 ? name.substring(0, 20) + '...' : name}</text>

  <!-- Details -->
  <text x="40" y="395" font-family="monospace" font-size="12" fill="#888">Spirit:</text>
  <text x="140" y="395" font-family="monospace" font-size="12" fill="#fff">${animalLabel}</text>

  <text x="40" y="415" font-family="monospace" font-size="12" fill="#888">Gender:</text>
  <text x="140" y="415" font-family="monospace" font-size="12" fill="#fff">${gender.charAt(0).toUpperCase() + gender.slice(1)}</text>

  <text x="40" y="435" font-family="monospace" font-size="12" fill="#888">Style:</text>
  <text x="140" y="435" font-family="monospace" font-size="12" fill="#fff">${hairstyle.charAt(0).toUpperCase() + hairstyle.slice(1)}</text>

  <!-- Collection footer -->
  <text x="200" y="500" font-family="monospace" font-size="10" fill="#555" text-anchor="middle">WORLDBRIDGER PFP COLLECTION</text>
  <text x="200" y="516" font-family="monospace" font-size="10" fill="#555" text-anchor="middle">PURPLE POINT • CUSTOM EDITION</text>

  <!-- Corner accents -->
  <path d="M16 4 L4 4 L4 16" fill="none" stroke="#9945FF" stroke-width="2" opacity="0.4"/>
  <path d="M384 4 L396 4 L396 16" fill="none" stroke="#9945FF" stroke-width="2" opacity="0.4"/>
  <path d="M16 556 L4 556 L4 544" fill="none" stroke="#9945FF" stroke-width="2" opacity="0.4"/>
  <path d="M384 556 L396 556 L396 544" fill="none" stroke="#9945FF" stroke-width="2" opacity="0.4"/>
</svg>`;

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
