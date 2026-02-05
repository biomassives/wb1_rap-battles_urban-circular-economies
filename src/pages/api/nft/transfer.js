// /api/nft/transfer.js
// Transfer/gift an NFT to another user

import { neon } from '@neondatabase/serverless';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      fromWallet,
      toWallet,
      nftMintAddress,
      // Support legacy field names
      mintAddress,
      fromAddress,
      toAddress,
      transferType = 'gift', // 'gift', 'airdrop', 'sponsor'
      message,
      transactionSignature,
      signature
    } = body;

    // Support both old and new field names
    const from = fromWallet || fromAddress;
    const to = toWallet || toAddress;
    const mint = nftMintAddress || mintAddress;
    const txSig = transactionSignature || signature;

    if (!from) {
      return new Response(JSON.stringify({
        success: false,
        error: 'From wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!to) {
      return new Response(JSON.stringify({
        success: false,
        error: 'To wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!mint) {
      return new Response(JSON.stringify({
        success: false,
        error: 'NFT mint address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (from === to) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot transfer to yourself'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const validTransferTypes = ['gift', 'airdrop', 'sponsor', 'sale'];
    if (!validTransferTypes.includes(transferType)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Transfer type must be one of: ${validTransferTypes.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    console.log(`📤 Transfer request: ${mint} from ${from} to ${to}`);

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Check if NFT is staked or listed
    const existingStake = await sql`
      SELECT id FROM nft_stakes
      WHERE nft_mint_address = ${mint}
        AND status = 'active'
    `.catch(() => []);

    if (existingStake.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This NFT is currently staked. Unstake it first to transfer.'
      }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    const existingListing = await sql`
      SELECT id FROM nft_listings
      WHERE nft_mint_address = ${mint}
        AND status = 'active'
    `.catch(() => []);

    if (existingListing.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This NFT is currently listed for sale. Cancel the listing first to transfer.'
      }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    // Check if recipient exists
    const recipient = await sql`
      SELECT wallet_address, username FROM user_profiles
      WHERE wallet_address = ${to}
    `.catch(() => []);

    const recipientExists = recipient.length > 0;
    const recipientName = recipientExists ? recipient[0].username : 'New User';

    // Record the transfer
    const result = await sql`
      INSERT INTO nft_transfers (
        from_wallet,
        to_wallet,
        nft_mint_address,
        transfer_type,
        message,
        transaction_signature
      ) VALUES (
        ${from},
        ${to},
        ${mint},
        ${transferType},
        ${message || null},
        ${txSig || null}
      )
      RETURNING id, created_at
    `.catch(() => [{ id: null, created_at: new Date().toISOString() }]);

    const transfer = result[0];

    // Award XP to sender for gifting
    const senderXP = transferType === 'gift' ? 30 : 20;
    await sql`
      UPDATE user_profiles
      SET xp = xp + ${senderXP},
          updated_at = NOW()
      WHERE wallet_address = ${from}
    `.catch(() => {});

    // Award XP to recipient for receiving (if they exist)
    const recipientXP = 50;
    if (recipientExists) {
      await sql`
        UPDATE user_profiles
        SET xp = xp + ${recipientXP},
            updated_at = NOW()
        WHERE wallet_address = ${to}
      `.catch(() => {});
    }

    // Log activities
    await sql`
      INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
      VALUES (
        ${from},
        'nft_gift_sent',
        ${senderXP},
        ${`${transferType === 'gift' ? 'Gifted' : 'Transferred'} NFT to ${recipientName}`},
        ${JSON.stringify({ transfer_id: transfer.id, to_wallet: to, type: transferType })}
      )
    `.catch(() => {});

    if (recipientExists) {
      await sql`
        INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
        VALUES (
          ${to},
          'nft_gift_received',
          ${recipientXP},
          ${`Received NFT ${transferType} from ${from.slice(0, 8)}...`},
          ${JSON.stringify({ transfer_id: transfer.id, from_wallet: from, type: transferType })}
        )
      `.catch(() => {});
    }

    return new Response(JSON.stringify({
      success: true,
      transfer: {
        id: transfer.id,
        from,
        to,
        mintAddress: mint,
        nftMintAddress: mint,
        type: transferType,
        message: message || null,
        signature: txSig,
        created_at: transfer.created_at,
        timestamp: transfer.created_at
      },
      xp: {
        senderEarned: senderXP,
        recipientEarned: recipientExists ? recipientXP : 0
      },
      message: transferType === 'gift'
        ? `NFT gifted to ${recipientName}! You earned ${senderXP} XP for your generosity.`
        : `NFT transferred to ${to.slice(0, 8)}...`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error transferring NFT:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to transfer NFT: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// GET - Get transfer history
export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');
  const direction = url.searchParams.get('direction') || 'all'; // 'sent', 'received', 'all'
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  if (!walletAddress) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Wallet address is required'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    let transfers;

    if (direction === 'sent') {
      transfers = await sql`
        SELECT
          t.*,
          u.username as recipient_name
        FROM nft_transfers t
        LEFT JOIN user_profiles u ON t.to_wallet = u.wallet_address
        WHERE t.from_wallet = ${walletAddress}
        ORDER BY t.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (direction === 'received') {
      transfers = await sql`
        SELECT
          t.*,
          u.username as sender_name
        FROM nft_transfers t
        LEFT JOIN user_profiles u ON t.from_wallet = u.wallet_address
        WHERE t.to_wallet = ${walletAddress}
        ORDER BY t.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      transfers = await sql`
        SELECT
          t.*,
          sender.username as sender_name,
          recipient.username as recipient_name
        FROM nft_transfers t
        LEFT JOIN user_profiles sender ON t.from_wallet = sender.wallet_address
        LEFT JOIN user_profiles recipient ON t.to_wallet = recipient.wallet_address
        WHERE t.from_wallet = ${walletAddress}
           OR t.to_wallet = ${walletAddress}
        ORDER BY t.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    // Add direction indicator
    const transfersWithDirection = transfers.map(t => ({
      ...t,
      direction: t.from_wallet === walletAddress ? 'sent' : 'received'
    }));

    // Get summary
    const summary = await sql`
      SELECT
        COUNT(*) FILTER (WHERE from_wallet = ${walletAddress}) as total_sent,
        COUNT(*) FILTER (WHERE to_wallet = ${walletAddress}) as total_received,
        COUNT(*) FILTER (WHERE from_wallet = ${walletAddress} AND transfer_type = 'gift') as gifts_sent,
        COUNT(*) FILTER (WHERE to_wallet = ${walletAddress} AND transfer_type = 'gift') as gifts_received
      FROM nft_transfers
      WHERE from_wallet = ${walletAddress} OR to_wallet = ${walletAddress}
    `;

    return new Response(JSON.stringify({
      success: true,
      transfers: transfersWithDirection,
      summary: summary[0] || {},
      pagination: {
        limit,
        offset,
        count: transfers.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching transfers:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch transfers'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
