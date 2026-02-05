// /api/nft/marketplace/buy.js
// Purchase an NFT or place a bid

import { neon } from '@neondatabase/serverless';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      listingId,
      action = 'buy', // 'buy' for fixed price, 'bid' for auctions
      bidAmount, // Only for bids
      transactionSignature // Solana transaction signature for verification
    } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!listingId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Listing ID is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Get listing
    const listing = await sql`
      SELECT * FROM nft_listings
      WHERE id = ${listingId}
    `;

    if (listing.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Listing not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const listingData = listing[0];

    // Check listing is still active
    if (listingData.status !== 'active') {
      return new Response(JSON.stringify({
        success: false,
        error: `Listing is ${listingData.status}`,
        status: listingData.status
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Cannot buy own listing
    if (listingData.seller_wallet === walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot purchase your own listing'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Check expiration for auctions
    if (listingData.listing_type === 'auction' && listingData.expires_at) {
      if (new Date(listingData.expires_at) < new Date()) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Auction has ended'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    let result;

    if (listingData.listing_type === 'fixed' || action === 'buy') {
      // Fixed price purchase
      const price = listingData.price_sol;
      const platformFee = price * (listingData.platform_fee_pct / 100);
      const sellerReceives = price - platformFee;

      // Record the transfer
      const transferResult = await sql`
        INSERT INTO nft_transfers (
          from_wallet,
          to_wallet,
          nft_mint_address,
          transfer_type,
          price_sol,
          platform_fee_sol,
          transaction_signature,
          listing_id
        ) VALUES (
          ${listingData.seller_wallet},
          ${walletAddress},
          ${listingData.nft_mint_address},
          'sale',
          ${price},
          ${platformFee},
          ${transactionSignature || null},
          ${listingId}
        )
        RETURNING id, created_at
      `;

      // Update listing status
      await sql`
        UPDATE nft_listings
        SET status = 'sold',
            buyer_wallet = ${walletAddress},
            sold_at = NOW(),
            final_price_sol = ${price}
        WHERE id = ${listingId}
      `;

      // Award XP to both parties
      const buyerXP = 50;
      const sellerXP = 25;

      await sql`
        UPDATE user_profiles
        SET xp = xp + ${buyerXP},
            updated_at = NOW()
        WHERE wallet_address = ${walletAddress}
      `.catch(() => {});

      await sql`
        UPDATE user_profiles
        SET xp = xp + ${sellerXP},
            updated_at = NOW()
        WHERE wallet_address = ${listingData.seller_wallet}
      `.catch(() => {});

      // Log activities
      await sql`
        INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
        VALUES
          (${walletAddress}, 'nft_purchase', ${buyerXP}, 'Purchased NFT from marketplace', ${JSON.stringify({ listing_id: listingId, price })}),
          (${listingData.seller_wallet}, 'nft_sale', ${sellerXP}, 'Sold NFT on marketplace', ${JSON.stringify({ listing_id: listingId, price })})
      `.catch(() => {});

      result = {
        success: true,
        action: 'purchase',
        transfer: {
          id: transferResult[0].id,
          nftMintAddress: listingData.nft_mint_address,
          from: listingData.seller_wallet,
          to: walletAddress,
          priceSol: price,
          platformFee,
          sellerReceived: sellerReceives,
          created_at: transferResult[0].created_at
        },
        xpEarned: buyerXP,
        message: `NFT purchased for ${price} SOL! Earned ${buyerXP} XP.`
      };

    } else if (listingData.listing_type === 'auction' && action === 'bid') {
      // Auction bid
      if (!bidAmount || bidAmount <= 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Bid amount is required'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const minBid = listingData.current_bid_sol > 0
        ? listingData.current_bid_sol * 1.05 // 5% minimum increment
        : listingData.starting_bid_sol;

      if (bidAmount < minBid) {
        return new Response(JSON.stringify({
          success: false,
          error: `Bid must be at least ${minBid.toFixed(4)} SOL`,
          minBid
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Record bid
      const bidResult = await sql`
        INSERT INTO nft_bids (
          listing_id,
          bidder_wallet,
          bid_amount_sol,
          transaction_signature
        ) VALUES (
          ${listingId},
          ${walletAddress},
          ${bidAmount},
          ${transactionSignature || null}
        )
        RETURNING id, created_at
      `;

      // Update listing with new high bid
      await sql`
        UPDATE nft_listings
        SET current_bid_sol = ${bidAmount},
            highest_bidder = ${walletAddress},
            bid_count = COALESCE(bid_count, 0) + 1
        WHERE id = ${listingId}
      `;

      // Award XP for bidding
      const bidXP = 10;
      await sql`
        UPDATE user_profiles
        SET xp = xp + ${bidXP},
            updated_at = NOW()
        WHERE wallet_address = ${walletAddress}
      `.catch(() => {});

      await sql`
        INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
        VALUES (${walletAddress}, 'nft_bid', ${bidXP}, 'Placed bid on NFT auction', ${JSON.stringify({ listing_id: listingId, bid_amount: bidAmount })})
      `.catch(() => {});

      result = {
        success: true,
        action: 'bid',
        bid: {
          id: bidResult[0].id,
          listingId,
          amount: bidAmount,
          isHighestBid: true,
          created_at: bidResult[0].created_at
        },
        auction: {
          currentBid: bidAmount,
          totalBids: (listingData.bid_count || 0) + 1,
          endsAt: listingData.expires_at
        },
        xpEarned: bidXP,
        message: `Bid of ${bidAmount} SOL placed! You are the highest bidder. Earned ${bidXP} XP.`
      };
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid action for this listing type'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing purchase/bid:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
