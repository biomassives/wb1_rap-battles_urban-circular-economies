// /api/nft/fractional/create.js
// Fractionalize an NFT into multiple shares

import { neon } from '@neondatabase/serverless';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      nftMintAddress,
      totalFractions,
      pricePerFraction,
      royaltyPct = 5, // Creator royalty percentage
      description
    } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!nftMintAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'NFT mint address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!totalFractions || totalFractions < 10 || totalFractions > 10000) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Total fractions must be between 10 and 10,000'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!pricePerFraction || pricePerFraction <= 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Price per fraction is required and must be positive'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (royaltyPct < 0 || royaltyPct > 15) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Royalty percentage must be between 0 and 15%'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Check if NFT is already fractionalized, listed, or staked
    const existingFractional = await sql`
      SELECT id FROM fractional_nfts
      WHERE nft_mint_address = ${nftMintAddress}
        AND status != 'redeemed'
    `;

    if (existingFractional.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This NFT is already fractionalized'
      }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    const existingListing = await sql`
      SELECT id FROM nft_listings
      WHERE nft_mint_address = ${nftMintAddress}
        AND status = 'active'
    `;

    if (existingListing.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This NFT is currently listed for sale'
      }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    const existingStake = await sql`
      SELECT id FROM nft_stakes
      WHERE nft_mint_address = ${nftMintAddress}
        AND status = 'active'
    `;

    if (existingStake.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This NFT is currently staked'
      }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    // Calculate total value
    const totalValue = totalFractions * pricePerFraction;

    // Create fractional NFT record
    const result = await sql`
      INSERT INTO fractional_nfts (
        nft_mint_address,
        owner_wallet,
        total_fractions,
        fractions_sold,
        price_per_fraction_sol,
        total_value_sol,
        royalty_pct,
        royalty_pool_sol,
        description,
        status
      ) VALUES (
        ${nftMintAddress},
        ${walletAddress},
        ${totalFractions},
        0,
        ${pricePerFraction},
        ${totalValue},
        ${royaltyPct},
        0,
        ${description || null},
        'active'
      )
      RETURNING id, created_at
    `;

    const fractional = result[0];

    // Give owner all initial fractions
    await sql`
      INSERT INTO fractional_owners (
        fractional_nft_id,
        owner_wallet,
        fractions_owned,
        acquisition_price_sol,
        royalties_claimed_sol
      ) VALUES (
        ${fractional.id},
        ${walletAddress},
        ${totalFractions},
        0,
        0
      )
    `;

    // Award XP for fractionalizing
    const xpEarned = 100;
    await sql`
      UPDATE user_profiles
      SET xp = xp + ${xpEarned},
          updated_at = NOW()
      WHERE wallet_address = ${walletAddress}
    `.catch(() => {});

    await sql`
      INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
      VALUES (
        ${walletAddress},
        'nft_fractionalize',
        ${xpEarned},
        'Fractionalized NFT for shared ownership',
        ${JSON.stringify({ fractional_id: fractional.id, total_fractions: totalFractions })}
      )
    `.catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      fractional: {
        id: fractional.id,
        nftMintAddress,
        totalFractions,
        pricePerFraction,
        totalValue,
        royaltyPct,
        status: 'active',
        created_at: fractional.created_at
      },
      ownership: {
        yourFractions: totalFractions,
        yourPercentage: 100
      },
      xpEarned,
      message: `NFT fractionalized into ${totalFractions} shares! You own 100%. List fractions for sale to share ownership.`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fractionalizing NFT:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fractionalize NFT: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// GET - List fractional NFTs or get ownership
export async function GET({ request }) {
  const url = new URL(request.url);
  const fractionalId = url.searchParams.get('id');
  const walletAddress = url.searchParams.get('walletAddress');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    if (fractionalId) {
      // Get specific fractional NFT details
      const fractional = await sql`
        SELECT
          f.*,
          u.username as owner_name
        FROM fractional_nfts f
        LEFT JOIN user_profiles u ON f.owner_wallet = u.wallet_address
        WHERE f.id = ${fractionalId}
      `;

      if (fractional.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Fractional NFT not found'
        }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }

      // Get all owners
      const owners = await sql`
        SELECT
          fo.owner_wallet,
          fo.fractions_owned,
          fo.acquisition_price_sol,
          fo.royalties_claimed_sol,
          u.username,
          u.avatar_url
        FROM fractional_owners fo
        LEFT JOIN user_profiles u ON fo.owner_wallet = u.wallet_address
        WHERE fo.fractional_nft_id = ${fractionalId}
          AND fo.fractions_owned > 0
        ORDER BY fo.fractions_owned DESC
      `;

      return new Response(JSON.stringify({
        success: true,
        fractional: {
          ...fractional[0],
          availableFractions: fractional[0].total_fractions - fractional[0].fractions_sold
        },
        owners: owners.map(o => ({
          ...o,
          ownershipPct: (o.fractions_owned / fractional[0].total_fractions * 100).toFixed(2)
        })),
        ownerCount: owners.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } else if (walletAddress) {
      // Get user's fractional holdings
      const holdings = await sql`
        SELECT
          fo.fractional_nft_id,
          fo.fractions_owned,
          fo.royalties_claimed_sol,
          f.nft_mint_address,
          f.total_fractions,
          f.price_per_fraction_sol,
          f.royalty_pool_sol,
          f.status
        FROM fractional_owners fo
        JOIN fractional_nfts f ON fo.fractional_nft_id = f.id
        WHERE fo.owner_wallet = ${walletAddress}
          AND fo.fractions_owned > 0
        ORDER BY fo.fractions_owned DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      // Calculate totals
      const totals = holdings.reduce((acc, h) => {
        acc.totalFractions += h.fractions_owned;
        acc.totalValue += h.fractions_owned * parseFloat(h.price_per_fraction_sol);
        acc.unclaimedRoyalties += (parseFloat(h.royalty_pool_sol) * h.fractions_owned / h.total_fractions) - parseFloat(h.royalties_claimed_sol);
        return acc;
      }, { totalFractions: 0, totalValue: 0, unclaimedRoyalties: 0 });

      return new Response(JSON.stringify({
        success: true,
        holdings: holdings.map(h => ({
          ...h,
          ownershipPct: (h.fractions_owned / h.total_fractions * 100).toFixed(2),
          currentValue: h.fractions_owned * parseFloat(h.price_per_fraction_sol)
        })),
        totals,
        pagination: {
          limit,
          offset,
          count: holdings.length
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      // List all active fractional NFTs
      const fractionals = await sql`
        SELECT
          f.id,
          f.nft_mint_address,
          f.owner_wallet,
          f.total_fractions,
          f.fractions_sold,
          f.price_per_fraction_sol,
          f.royalty_pct,
          f.status,
          f.created_at,
          u.username as owner_name
        FROM fractional_nfts f
        LEFT JOIN user_profiles u ON f.owner_wallet = u.wallet_address
        WHERE f.status = 'active'
        ORDER BY f.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      return new Response(JSON.stringify({
        success: true,
        fractionals: fractionals.map(f => ({
          ...f,
          availableFractions: f.total_fractions - f.fractions_sold,
          percentSold: (f.fractions_sold / f.total_fractions * 100).toFixed(1)
        })),
        pagination: {
          limit,
          offset,
          count: fractionals.length
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error fetching fractional NFTs:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch fractional NFTs'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
