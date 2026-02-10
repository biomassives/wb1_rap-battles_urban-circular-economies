/**
 * POST /api/nft/mint
 * Mint an animal spirit NFT from the collection (1-55) using Metaplex
 *
 * Body:
 * - walletAddress: Wallet address to receive the NFT
 * - nftId: NFT ID from collection (1-55)
 * - metadata: { name, symbol, rarity }
 */

import { sql } from '../../../lib/db.js';
import { notifyFromTemplate } from '../../../lib/notify.js';
import { mintNFT, getAuthorityBalance, isSimulateMode } from '../../../lib/solana-mint.js';

export const prerender = false;

const rarityPricing = {
  'Common': 0.25,
  'Uncommon': 0.50,
  'Rare': 0.75,
  'Legendary': 1.50
};

export async function POST({ request, url }) {
  try {
    const body = await request.json();
    const { walletAddress, nftId, metadata } = body;

    // Validation
    if (!walletAddress || !nftId || !metadata) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: walletAddress, nftId, metadata'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (nftId < 1 || nftId > 55) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid nftId. Must be between 1 and 55'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Validate Solana address format
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid Solana wallet address'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check if already minted (via DB)
    const existing = await sql`
      SELECT mint_address FROM nft_transactions WHERE nft_id = ${nftId} AND status = 'confirmed'
    `.catch(() => []);

    if (existing.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `NFT #${nftId} has already been minted`,
        mintAddress: existing[0].mint_address
      }), { status: 409, headers: { 'Content-Type': 'application/json' } });
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

    // Build metadata URI
    const siteUrl = url.origin;
    const metadataUri = `${siteUrl}/api/nft/metadata-json/${nftId}`;
    const price = rarityPricing[metadata.rarity] || 0.25;

    console.log(`Minting NFT #${nftId} to ${walletAddress} (${metadata.rarity}, ${price} SOL)`);

    // Mint via Metaplex
    const result = await mintNFT({
      name: metadata.name || `Rapper #${nftId}`,
      symbol: metadata.symbol || 'WBRAP',
      uri: metadataUri,
      sellerFeeBasisPoints: 500,
      recipientAddress: walletAddress
    });

    // Record transaction in DB
    await sql`
      INSERT INTO nft_transactions (nft_id, wallet_address, mint_address, signature, price_sol, rarity, status, created_at)
      VALUES (${nftId}, ${walletAddress}, ${result.mintAddress}, ${result.signature}, ${price}, ${metadata.rarity || 'Common'}, 'confirmed', NOW())
    `.catch(err => console.error('Failed to record transaction:', err));

    // Award XP
    await sql`
      INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata, created_at)
      VALUES (${walletAddress}, 'nft_mint', 50, ${`Minted NFT #${nftId}`}, ${JSON.stringify({ nftId, rarity: metadata.rarity })}, NOW())
    `.catch(err => console.error('Failed to award XP:', err));

    // Update user XP total
    await sql`
      UPDATE user_profiles SET xp = xp + 50, updated_at = NOW() WHERE wallet_address = ${walletAddress}
    `.catch(() => {});

    // Notify about NFT received
    try {
      await notifyFromTemplate(walletAddress, 'nft_received', {
        name: metadata.name || `Rapper #${nftId}`,
        nftId
      });
    } catch (notifError) {
      console.warn('Notification failed:', notifError.message);
    }

    const simulated = result.simulated || false;

    return new Response(JSON.stringify({
      success: true,
      message: simulated
        ? `NFT #${nftId} minted (SIMULATED) — switch SOLANA_MINT_MODE=live for on-chain`
        : `NFT #${nftId} minted successfully on-chain!`,
      nftId,
      mintAddress: result.mintAddress,
      signature: result.signature,
      explorerUrl: result.explorerUrl,
      price,
      walletAddress,
      xpEarned: 50,
      simulated
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Mint error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Minting failed'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
