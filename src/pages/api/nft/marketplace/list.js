// /api/nft/marketplace/list.js
// List an NFT for sale on the marketplace

import { neon } from '@neondatabase/serverless';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      nftMintAddress,
      listingType = 'fixed', // 'fixed', 'auction'
      priceSol,
      startingBidSol,
      reservePriceSol,
      duration = 7, // days for auction
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

    const validListingTypes = ['fixed', 'auction'];
    if (!validListingTypes.includes(listingType)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Listing type must be one of: ${validListingTypes.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (listingType === 'fixed' && (!priceSol || priceSol <= 0)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Price in SOL is required for fixed price listings'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (listingType === 'auction' && (!startingBidSol || startingBidSol <= 0)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Starting bid is required for auctions'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Check if NFT is already listed or staked
    const existingListing = await sql`
      SELECT id FROM nft_listings
      WHERE nft_mint_address = ${nftMintAddress}
        AND status = 'active'
    `;

    if (existingListing.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This NFT is already listed for sale'
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
        error: 'This NFT is currently staked. Unstake it first to list for sale.'
      }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    // Calculate listing end date for auctions
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);

    // Platform fee is 2.5%
    const platformFeePct = 2.5;

    // Create listing
    const result = await sql`
      INSERT INTO nft_listings (
        seller_wallet,
        nft_mint_address,
        listing_type,
        price_sol,
        starting_bid_sol,
        reserve_price_sol,
        current_bid_sol,
        platform_fee_pct,
        description,
        expires_at,
        status
      ) VALUES (
        ${walletAddress},
        ${nftMintAddress},
        ${listingType},
        ${listingType === 'fixed' ? priceSol : null},
        ${listingType === 'auction' ? startingBidSol : null},
        ${reservePriceSol || null},
        ${listingType === 'auction' ? 0 : null},
        ${platformFeePct},
        ${description || null},
        ${listingType === 'auction' ? expiresAt.toISOString() : null},
        'active'
      )
      RETURNING id, created_at
    `;

    const listing = result[0];

    return new Response(JSON.stringify({
      success: true,
      listing: {
        id: listing.id,
        nftMintAddress,
        listingType,
        price: listingType === 'fixed' ? priceSol : startingBidSol,
        currency: 'SOL',
        platformFeePct,
        expiresAt: listingType === 'auction' ? expiresAt.toISOString() : null,
        status: 'active',
        created_at: listing.created_at
      },
      fees: {
        platformFeePct,
        estimatedPlatformFee: (listingType === 'fixed' ? priceSol : startingBidSol) * (platformFeePct / 100),
        sellerReceives: (listingType === 'fixed' ? priceSol : startingBidSol) * (1 - platformFeePct / 100)
      },
      message: listingType === 'fixed'
        ? `NFT listed for ${priceSol} SOL!`
        : `Auction started! Starting bid: ${startingBidSol} SOL. Ends in ${duration} days.`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating listing:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create listing: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// GET - Browse marketplace listings
export async function GET({ request }) {
  const url = new URL(request.url);
  const listingType = url.searchParams.get('type');
  const sellerWallet = url.searchParams.get('seller');
  const minPrice = url.searchParams.get('minPrice');
  const maxPrice = url.searchParams.get('maxPrice');
  const sortBy = url.searchParams.get('sortBy') || 'created_at';
  const sortOrder = url.searchParams.get('sortOrder') || 'desc';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Build query
    let listings = await sql`
      SELECT
        l.id,
        l.seller_wallet,
        l.nft_mint_address,
        l.listing_type,
        l.price_sol,
        l.starting_bid_sol,
        l.current_bid_sol,
        l.highest_bidder,
        l.bid_count,
        l.platform_fee_pct,
        l.description,
        l.expires_at,
        l.status,
        l.created_at,
        u.username as seller_name,
        u.avatar_url as seller_avatar
      FROM nft_listings l
      LEFT JOIN user_profiles u ON l.seller_wallet = u.wallet_address
      WHERE l.status = 'active'
      ${listingType ? sql`AND l.listing_type = ${listingType}` : sql``}
      ${sellerWallet ? sql`AND l.seller_wallet = ${sellerWallet}` : sql``}
      ${minPrice ? sql`AND COALESCE(l.price_sol, l.current_bid_sol, l.starting_bid_sol) >= ${parseFloat(minPrice)}` : sql``}
      ${maxPrice ? sql`AND COALESCE(l.price_sol, l.current_bid_sol, l.starting_bid_sol) <= ${parseFloat(maxPrice)}` : sql``}
      ORDER BY
        CASE WHEN ${sortBy} = 'price' AND ${sortOrder} = 'asc' THEN COALESCE(l.price_sol, l.current_bid_sol) END ASC,
        CASE WHEN ${sortBy} = 'price' AND ${sortOrder} = 'desc' THEN COALESCE(l.price_sol, l.current_bid_sol) END DESC,
        CASE WHEN ${sortBy} = 'created_at' AND ${sortOrder} = 'asc' THEN l.created_at END ASC,
        CASE WHEN ${sortBy} = 'created_at' AND ${sortOrder} = 'desc' THEN l.created_at END DESC,
        l.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total FROM nft_listings
      WHERE status = 'active'
      ${listingType ? sql`AND listing_type = ${listingType}` : sql``}
      ${sellerWallet ? sql`AND seller_wallet = ${sellerWallet}` : sql``}
    `;

    const total = parseInt(countResult[0]?.total || 0);

    // Get stats
    const stats = await sql`
      SELECT
        COUNT(*) as total_listings,
        COUNT(*) FILTER (WHERE listing_type = 'fixed') as fixed_listings,
        COUNT(*) FILTER (WHERE listing_type = 'auction') as auction_listings,
        AVG(COALESCE(price_sol, current_bid_sol)) as avg_price,
        MIN(COALESCE(price_sol, starting_bid_sol)) as min_price,
        MAX(COALESCE(price_sol, current_bid_sol)) as max_price
      FROM nft_listings
      WHERE status = 'active'
    `;

    return new Response(JSON.stringify({
      success: true,
      listings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + listings.length < total
      },
      stats: stats[0] || {}
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching listings:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch listings'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
