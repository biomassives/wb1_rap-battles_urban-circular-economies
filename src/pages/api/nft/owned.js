/**
 * GET /api/nft/owned
 * Get all NFTs owned by a wallet address
 */

import { Connection, PublicKey } from '@solana/web3.js';

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');

    if (!walletAddress) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'walletAddress parameter is required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🔍 Fetching NFTs for wallet: ${walletAddress}`);

    // Connect to Solana testnet
    const connection = new Connection(
      'https://api.testnet.solana.com',
      'confirmed'
    );

    const publicKey = new PublicKey(walletAddress);

    // Get all token accounts owned by the wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
      }
    );

    console.log(`📦 Found ${tokenAccounts.value.length} token accounts`);

    // Filter for NFTs (tokens with amount = 1 and decimals = 0)
    const nftAccounts = tokenAccounts.value.filter(account => {
      const amount = account.account.data.parsed.info.tokenAmount.uiAmount;
      const decimals = account.account.data.parsed.info.tokenAmount.decimals;
      return amount === 1 && decimals === 0;
    });

    console.log(`💎 Found ${nftAccounts.length} potential NFTs`);

    // Extract mint addresses and format response
    const ownedNFTs = nftAccounts.map(account => {
      const info = account.account.data.parsed.info;
      return {
        mint: info.mint,
        tokenAccount: account.pubkey.toString(),
        owner: info.owner
      };
    });

    // TODO: Fetch metadata for each NFT from Metaplex
    // For now, return basic info

    return new Response(
      JSON.stringify({
        success: true,
        walletAddress,
        count: ownedNFTs.length,
        nfts: ownedNFTs
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error fetching owned NFTs:', error);

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
