/**
 * GET /api/nft/pfp-metadata/:id
 * Serves Metaplex-standard JSON metadata for custom PFP mints
 * Reads trait data from the pfp_mints table
 */

import { sql } from '../../../../lib/db.js';
export const prerender = false;

const animalEmojis = {
  'chicken': '🐓', 'dog': '🐕', 'goat': '🐐',
  'ermine': '🦦', 'pigeon': '🕊', 'eagle': '🦅'
};

export async function GET({ params, url }) {
  const id = parseInt(params.id);

  if (isNaN(id) || id < 1) {
    return new Response(JSON.stringify({ error: 'Invalid PFP ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const rows = await sql`
      SELECT pfp_name, traits, rarity, wallet_address FROM pfp_mints WHERE id = ${id}
    `;

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'PFP not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const pfp = rows[0];
    const traits = typeof pfp.traits === 'string' ? JSON.parse(pfp.traits) : pfp.traits;
    const siteUrl = url.origin;
    const emoji = animalEmojis[traits.animal] || '🎤';

    const metadata = {
      name: `${pfp.pfp_name} (PFP)`,
      symbol: 'WBPFP',
      description: `${emoji} Custom Rapper PFP — "${pfp.pfp_name}". A ${pfp.rarity} ${traits.animal} spirit with ${traits.hairstyle} hair. Designed in the WorldBridger Rapper Card Builder.`,
      image: `${siteUrl}/api/nft/pfp-image?animal=${encodeURIComponent(traits.animal)}&gender=${encodeURIComponent(traits.gender)}&hairstyle=${encodeURIComponent(traits.hairstyle)}&skinTone=${encodeURIComponent(traits.skinTone)}&name=${encodeURIComponent(pfp.pfp_name)}`,
      animation_url: null,
      external_url: `${siteUrl}/rapper-template-builder`,
      attributes: [
        { trait_type: 'Type', value: 'PFP' },
        { trait_type: 'Animal Spirit', value: traits.animal.charAt(0).toUpperCase() + traits.animal.slice(1) },
        { trait_type: 'Rarity', value: pfp.rarity },
        { trait_type: 'Gender', value: (traits.gender || 'male').charAt(0).toUpperCase() + (traits.gender || 'male').slice(1) },
        { trait_type: 'Hairstyle', value: (traits.hairstyle || 'dreads').charAt(0).toUpperCase() + (traits.hairstyle || 'dreads').slice(1) },
        { trait_type: 'Skin Tone', value: traits.skinTone },
        ...(traits.accessories && traits.accessories.length > 0
          ? [{ trait_type: 'Accessories', value: traits.accessories.join(', ') }]
          : []),
        { trait_type: 'Background', value: traits.background || 'default' }
      ],
      properties: {
        category: 'image',
        creators: [{ address: process.env.SOLANA_AUTHORITY_PUBKEY || 'AUTHORITY_PUBKEY', share: 100 }]
      },
      collection: {
        name: 'WorldBridger PFP Collection',
        family: 'WorldBridger One'
      }
    };

    return new Response(JSON.stringify(metadata, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
