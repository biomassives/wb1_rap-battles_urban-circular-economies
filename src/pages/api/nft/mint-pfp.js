/**
 * POST /api/nft/mint-pfp
 * Mint a custom rapper PFP card designed in the template builder
 *
 * Body:
 * - walletAddress: Wallet to receive the NFT
 * - traits: { animal, gender, hairstyle, skinTone, accessories, background }
 * - name: User-chosen name (e.g., "MC Thunder")
 */

import { sql } from '../../../lib/db.js';
import { mintNFT, getAuthorityBalance, isSimulateMode } from '../../../lib/solana-mint.js';

export const prerender = false;

const VALID_ANIMALS = ['chicken', 'dog', 'goat', 'ermine', 'pigeon', 'eagle'];
const VALID_GENDERS = ['male', 'female'];
const VALID_HAIRSTYLES = ['dreads', 'fade', 'afro', 'braids', 'bun', 'waves'];

// PFP rarity is calculated from trait combination
function calculateRarity(traits) {
  let score = 0;
  // Rarer animals score higher
  if (['ermine', 'eagle'].includes(traits.animal)) score += 3;
  else if (['pigeon', 'goat'].includes(traits.animal)) score += 2;
  else score += 1;

  // Accessories add rarity
  if (traits.accessories && traits.accessories.length > 0) {
    score += traits.accessories.length;
  }

  if (score >= 6) return 'Legendary';
  if (score >= 4) return 'Rare';
  if (score >= 2) return 'Uncommon';
  return 'Common';
}

export async function POST({ request, url }) {
  try {
    const body = await request.json();
    const { walletAddress, traits, name } = body;

    // Validation
    if (!walletAddress || !traits || !name) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: walletAddress, traits, name'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid Solana wallet address'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!traits.animal || !VALID_ANIMALS.includes(traits.animal.toLowerCase())) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid animal. Must be one of: ${VALID_ANIMALS.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (name.length < 1 || name.length > 100) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Name must be 1-100 characters'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check authority balance
    const balance = await getAuthorityBalance();
    if (balance < 0.05) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Minting authority has insufficient SOL. Fund it with: solana airdrop 2',
        balance: `${balance.toFixed(4)} SOL`
      }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }
    // Insert PFP record first to get an ID
    const rarity = calculateRarity(traits);
    const normalizedTraits = {
      animal: traits.animal.toLowerCase(),
      gender: (traits.gender || 'male').toLowerCase(),
      hairstyle: (traits.hairstyle || 'dreads').toLowerCase(),
      skinTone: traits.skinTone || '#c68642',
      accessories: traits.accessories || [],
      background: traits.background || 'default'
    };

    const inserted = await sql`
      INSERT INTO pfp_mints (wallet_address, traits, pfp_name, rarity, status, created_at)
      VALUES (${walletAddress}, ${JSON.stringify(normalizedTraits)}, ${name}, ${rarity}, 'pending', NOW())
      RETURNING id
    `;

    const pfpId = inserted[0].id;

    // Build PFP metadata URI — serves from a query-param endpoint
    const siteUrl = url.origin;
    const metadataUri = `${siteUrl}/api/nft/pfp-metadata/${pfpId}`;

    console.log(`Minting PFP "${name}" (ID: ${pfpId}) to ${walletAddress}`);

    // Mint via Metaplex
    const result = await mintNFT({
      name: `${name} (PFP)`,
      symbol: 'WBPFP',
      uri: metadataUri,
      sellerFeeBasisPoints: 500,
      recipientAddress: walletAddress
    });

    // Update PFP record with mint data
    await sql`
      UPDATE pfp_mints
      SET mint_address = ${result.mintAddress}, signature = ${result.signature},
          metadata_uri = ${metadataUri}, status = 'confirmed'
      WHERE id = ${pfpId}
    `;

    // Award XP (75 for PFP mint)
    await sql`
      INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata, created_at)
      VALUES (${walletAddress}, 'pfp_mint', 75, ${`Minted PFP "${name}"`}, ${JSON.stringify({ pfpId, rarity, animal: normalizedTraits.animal })}, NOW())
    `.catch(err => console.error('Failed to award XP:', err));

    await sql`
      UPDATE user_profiles SET xp = xp + 75, updated_at = NOW() WHERE wallet_address = ${walletAddress}
    `.catch(() => {});

    const simulated = result.simulated || false;

    return new Response(JSON.stringify({
      success: true,
      message: simulated
        ? `PFP "${name}" minted (SIMULATED)`
        : `PFP "${name}" minted successfully on-chain!`,
      pfpId,
      mintAddress: result.mintAddress,
      signature: result.signature,
      explorerUrl: result.explorerUrl,
      rarity,
      xpEarned: 75,
      simulated
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('PFP mint error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'PFP minting failed'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
