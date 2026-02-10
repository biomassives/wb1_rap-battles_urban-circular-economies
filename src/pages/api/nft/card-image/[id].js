/**
 * GET /api/nft/card-image/:id
 * Serves SVG card image for animal spirit NFTs (1-55)
 * Returns Content-Type: image/svg+xml
 *
 * Uses same fixed seed as metadata-json endpoint for consistency.
 */

export const prerender = false;

const COLLECTION_SEED = 20260101;

const animalSpirits = {
  farm: ['Chicken', 'Cat', 'Goat', 'Dog', 'Bunny'],
  sky: ['Pigeon', "Cooper's Hawk", 'Eagle'],
  wild: ['Lion', 'Coywolf']
};

const rarities = [
  { name: 'Common', weight: 40, color: '#00ff00' },
  { name: 'Uncommon', weight: 30, color: '#00ffff' },
  { name: 'Rare', weight: 20, color: '#ffff00' },
  { name: 'Legendary', weight: 10, color: '#ff00ff' }
];

const hairstyles = ['Dreads', 'Fade', 'Afro', 'Braids', 'Bun', 'Waves'];
const skinTones = ['#8d5524', '#c68642', '#e0ac69', '#f1c27d', '#ffdbac', '#fef0e0'];

const animalEmojis = {
  'Chicken': '🐓', 'Cat': '🐱', 'Goat': '🐐', 'Dog': '🐕', 'Bunny': '🐰',
  'Pigeon': '🕊', "Cooper's Hawk": '🦅', 'Eagle': '🦅',
  'Lion': '🦁', 'Coywolf': '🐺'
};

function generateCard(id) {
  const i = id - 1;
  const seed = COLLECTION_SEED + i;
  const rand = (max) => Math.floor((seed * (i + 1) * 9301 + 49297) % 233280 / 233280 * max);

  let rarityRoll = rand(100);
  let selectedRarity = rarities[0];
  let cumulative = 0;
  for (const rarity of rarities) {
    cumulative += rarity.weight;
    if (rarityRoll < cumulative) {
      selectedRarity = rarity;
      break;
    }
  }

  const allAnimals = [...animalSpirits.farm, ...animalSpirits.sky, ...animalSpirits.wild];
  const animalSpirit = allAnimals[rand(allAnimals.length)];
  let category = 'farm';
  if (animalSpirits.sky.includes(animalSpirit)) category = 'sky';
  if (animalSpirits.wild.includes(animalSpirit)) category = 'wild';

  return {
    id,
    name: `${animalSpirit} Rapper #${id}`,
    animalSpirit,
    category,
    gender: rand(2) === 0 ? 'male' : 'female',
    skinTone: skinTones[rand(skinTones.length)],
    hairstyle: hairstyles[rand(hairstyles.length)],
    rarity: selectedRarity,
    soundFreq: 200 + rand(600),
    soundWave: ['sine', 'square', 'sawtooth', 'triangle'][rand(4)],
    badges: rand(3) + 1
  };
}

function buildSVG(card) {
  const rc = card.rarity.color;
  const emoji = animalEmojis[card.animalSpirit] || '🎤';
  const badgeStars = '⭐'.repeat(card.badges);

  // Category gradient colors
  const gradients = {
    farm: ['#1a3a0a', '#0d2606'],
    sky: ['#0a1a3a', '#060d26'],
    wild: ['#3a0a0a', '#260606']
  };
  const [g1, g2] = gradients[card.category] || gradients.farm;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" width="400" height="560">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${g1}"/>
      <stop offset="100%" stop-color="${g2}"/>
    </linearGradient>
    <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${card.skinTone}"/>
      <stop offset="100%" stop-color="${card.skinTone}dd"/>
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
  <rect width="400" height="560" rx="16" fill="none" stroke="${rc}" stroke-width="2" opacity="0.6"/>

  <!-- Top bar -->
  <rect x="0" y="0" width="400" height="50" rx="16" fill="${rc}22"/>
  <text x="20" y="33" font-family="monospace" font-size="16" fill="${rc}" font-weight="bold">#${String(card.id).padStart(3, '0')}</text>
  <text x="380" y="33" font-family="monospace" font-size="14" fill="${rc}" text-anchor="end" font-weight="bold">${card.rarity.name.toUpperCase()}</text>

  <!-- Character area -->
  <rect x="30" y="65" width="340" height="260" rx="12" fill="#0b0f17" stroke="${rc}44" stroke-width="1"/>

  <!-- Skin tone background circle -->
  <circle cx="200" cy="175" r="80" fill="url(#skin)" opacity="0.9"/>

  <!-- Animal emoji -->
  <text x="200" y="165" font-size="72" text-anchor="middle" dominant-baseline="middle">${emoji}</text>

  <!-- Gender indicator -->
  <text x="200" y="225" font-family="monospace" font-size="12" fill="#ffffff88" text-anchor="middle">${card.gender.toUpperCase()}</text>

  <!-- Hairstyle label -->
  <rect x="140" y="240" width="120" height="22" rx="4" fill="${rc}33"/>
  <text x="200" y="256" font-family="monospace" font-size="11" fill="${rc}" text-anchor="middle">${card.hairstyle}</text>

  <!-- Sound wave visualization -->
  <g transform="translate(30, 275)" opacity="0.5">
    ${Array.from({length: 34}, (_, j) => {
      const h = 5 + Math.sin((j + card.soundFreq) * 0.3) * 15 + Math.cos(j * 0.7) * 8;
      return `<rect x="${j * 10}" y="${20 - h/2}" width="6" height="${h}" rx="2" fill="${rc}" opacity="${0.3 + (h/40)}"/>`;
    }).join('\n    ')}
  </g>

  <!-- Info section -->
  <text x="200" y="350" font-family="monospace" font-size="18" fill="#ffffff" text-anchor="middle" font-weight="bold" filter="url(#glow)">${card.name}</text>

  <!-- Details -->
  <text x="40" y="385" font-family="monospace" font-size="12" fill="#888">Spirit:</text>
  <text x="140" y="385" font-family="monospace" font-size="12" fill="#fff">${card.animalSpirit}</text>

  <text x="40" y="405" font-family="monospace" font-size="12" fill="#888">Category:</text>
  <text x="140" y="405" font-family="monospace" font-size="12" fill="#fff">${card.category.charAt(0).toUpperCase() + card.category.slice(1)}</text>

  <text x="40" y="425" font-family="monospace" font-size="12" fill="#888">Sound:</text>
  <text x="140" y="425" font-family="monospace" font-size="12" fill="#fff">${card.soundFreq}Hz ${card.soundWave}</text>

  <text x="40" y="445" font-family="monospace" font-size="12" fill="#888">Badges:</text>
  <text x="140" y="445" font-size="14">${badgeStars}</text>

  <!-- Bottom rarity bar -->
  <rect x="30" y="470" width="340" height="4" rx="2" fill="#333"/>
  <rect x="30" y="470" width="${card.rarity.name === 'Common' ? 85 : card.rarity.name === 'Uncommon' ? 170 : card.rarity.name === 'Rare' ? 255 : 340}" height="4" rx="2" fill="${rc}"/>

  <!-- Collection footer -->
  <text x="200" y="500" font-family="monospace" font-size="10" fill="#555" text-anchor="middle">WORLDBRIDGER RAPPER COLLECTION</text>
  <text x="200" y="516" font-family="monospace" font-size="10" fill="#555" text-anchor="middle">PURPLE POINT • EDITION ${card.id}/55</text>

  <!-- Corner accents -->
  <path d="M16 4 L4 4 L4 16" fill="none" stroke="${rc}" stroke-width="2" opacity="0.4"/>
  <path d="M384 4 L396 4 L396 16" fill="none" stroke="${rc}" stroke-width="2" opacity="0.4"/>
  <path d="M16 556 L4 556 L4 544" fill="none" stroke="${rc}" stroke-width="2" opacity="0.4"/>
  <path d="M384 556 L396 556 L396 544" fill="none" stroke="${rc}" stroke-width="2" opacity="0.4"/>
</svg>`;
}

export async function GET({ params }) {
  const id = parseInt(params.id);

  if (isNaN(id) || id < 1 || id > 55) {
    return new Response('Invalid ID. Must be 1-55', { status: 400 });
  }

  const card = generateCard(id);
  const svg = buildSVG(card);

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400'
    }
  });
}
