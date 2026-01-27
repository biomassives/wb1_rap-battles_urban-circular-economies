/**
 * POST /api/nft/transfer
 * Transfer an NFT to another wallet
 *
 * Body:
 * - mintAddress: NFT mint address
 * - fromAddress: Sender wallet address
 * - toAddress: Recipient wallet address
 * - signature: Transaction signature (signed on client)
 */

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { mintAddress, fromAddress, toAddress, signature } = body;

    // Validation
    if (!mintAddress || !fromAddress || !toAddress) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: mintAddress, fromAddress, toAddress'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`📤 Transfer request: ${mintAddress} from ${fromAddress} to ${toAddress}`);

    // Note: The actual transfer transaction should be signed and sent from the client
    // This endpoint is for logging and database updates

    // TODO: Store transfer record in database
    // TODO: Update NFT ownership in database
    // TODO: Award XP for transfer activity

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Transfer recorded',
        mintAddress,
        fromAddress,
        toAddress,
        signature,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error processing transfer:', error);

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
