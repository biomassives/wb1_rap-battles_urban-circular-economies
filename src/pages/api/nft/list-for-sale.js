/**
 * POST /api/nft/list-for-sale
 * List an NFT for sale on the marketplace
 *
 * Body:
 * - mintAddress: NFT mint address
 * - sellerAddress: Seller wallet address
 * - price: Price in SOL
 * - duration: Listing duration in days (optional)
 */

export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      mintAddress,
      sellerAddress,
      price,
      duration = 30
    } = body;

    // Validation
    if (!mintAddress || !sellerAddress || !price) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: mintAddress, sellerAddress, price'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (price <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Price must be greater than 0'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`📋 Listing request: ${mintAddress} for ${price} SOL`);

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);

    // Generate listing ID
    const listingId = `listing_${Date.now()}_${mintAddress.substring(0, 8)}`;

    // TODO: Store listing in database
    // TODO: Create escrow account on Solana (requires custom program)
    // TODO: Validate NFT ownership

    const listing = {
      listingId,
      mintAddress,
      sellerAddress,
      price,
      status: 'active',
      listedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      duration
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: 'NFT listed for sale',
        listing
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error listing NFT:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
