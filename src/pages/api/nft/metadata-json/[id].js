/**
 * GET /api/nft/metadata-json/:id
 * Serves Metaplex-standard JSON metadata for animal spirit NFTs (1-55)
 *
 * Uses a FIXED seed (not daily) so traits are deterministic for permanent on-chain NFTs.
 */

export const prerender = false;

// Fixed seed for permanent collection (not daily)
const COLLECTION_SEED = 20260101;

const animalSpirits = {
  farm: ['Chicken', 'Cat', 'Goat', 'Dog', 'Bunny'],
  sky: ['Pigeon', "Cooper's Hawk", 'Eagle'],
  wild: ['Lion', 'Coywolf']
};

const rarities = [
  { name: 'Common', weight: 40 },
  { name: 'Uncommon', weight: 30 },
  { name: 'Rare', weight: 20 },
  { name: 'Legendary', weight: 10 }
];

const hairstyles = ['Dreads', 'Fade', 'Afro', 'Braids', 'Bun', 'Waves'];
const skinTones = ['#8d5524', '#c68642', '#e0ac69', '#f1c27d', '#ffdbac', '#fef0e0'];

const animalEmojis = {
  'Chicken': '🐓', 'Cat': '🐱', 'Goat': '🐐', 'Dog': '🐕', 'Bunny': '🐰',
  'Pigeon': '🕊️', "Cooper's Hawk": '🦅', 'Eagle': '🦅',
  'Lion': '🦁', 'Coywolf': '🐺'
};

function generateCard(id) {
  const i = id - 1;
  const seed = COLLECTION_SEED + i;
  const rand = (max) => Math.floor((seed * (i + 1) * 9301 + 49297) % 233280 / 233280 * max);

  // Rarity
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

  // Animal
  const allAnimals = [...animalSpirits.farm, ...animalSpirits.sky, ...animalSpirits.wild];
  const animalSpirit = allAnimals[rand(allAnimals.length)];

  // Category
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
    rarity: selectedRarity.name,
    soundFreq: 200 + rand(600),
    soundWave: ['sine', 'square', 'sawtooth', 'triangle'][rand(4)],
    badges: rand(3) + 1
  };
}

export async function GET({ params, url }) {
  const id = parseInt(params.id);

  if (isNaN(id) || id < 1 || id > 55) {
    return new Response(JSON.stringify({ error: 'Invalid ID. Must be 1-55' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const card = generateCard(id);
  const siteUrl = url.origin;

  const metadata = {
    name: card.name,
    symbol: 'WBRAP',
    description: `${animalEmojis[card.animalSpirit] || '🎤'} ${card.animalSpirit} Rapper — a ${card.rarity} ${card.category} spirit from the WorldBridger collection. ${card.gender === 'male' ? 'He' : 'She'} rocks ${card.hairstyle.toLowerCase()} and vibes at ${card.soundFreq}Hz ${card.soundWave}. Edition #${card.id} of 55.`,
    image: `${siteUrl}/api/nft/card-image/${card.id}`,
    animation_url: null,
    external_url: `${siteUrl}/nft-gallery/${card.id}`,
    attributes: [
      { trait_type: 'Animal Spirit', value: card.animalSpirit },
      { trait_type: 'Category', value: card.category.charAt(0).toUpperCase() + card.category.slice(1) },
      { trait_type: 'Rarity', value: card.rarity },
      { trait_type: 'Gender', value: card.gender.charAt(0).toUpperCase() + card.gender.slice(1) },
      { trait_type: 'Hairstyle', value: card.hairstyle },
      { trait_type: 'Skin Tone', value: card.skinTone },
      { trait_type: 'Sound Frequency', value: `${card.soundFreq} Hz` },
      { trait_type: 'Wave Type', value: card.soundWave },
      { trait_type: 'Badges', value: card.badges },
      { trait_type: 'Edition', value: `#${card.id} of 55` }
    ],
    properties: {
      category: 'image',
      creators: [{ address: process.env.SOLANA_AUTHORITY_PUBKEY || 'AUTHORITY_PUBKEY', share: 100 }]
    },
    collection: {
      name: 'WorldBridger Rapper NFT Collection',
      family: 'WorldBridger One'
    }
  };

  return new Response(JSON.stringify(metadata, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400'
    }
  });
}
