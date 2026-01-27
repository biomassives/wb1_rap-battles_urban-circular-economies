/**
 * GET /api/nft/metadata/[mint]
 * Read NFT metadata from Solana blockchain
 *
 * Fetches NFT metadata directly from Solana using the mint address
 * Caches results to reduce RPC calls
 */

import { Connection, PublicKey } from '@solana/web3.js';

export async function GET({ params }) {
  try {
    const { mint } = params;

    if (!mint) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Mint address is required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🔍 Reading NFT metadata for mint: ${mint}`);

    // Connect to Solana testnet
    const connection = new Connection(
      'https://api.testnet.solana.com',
      'confirmed'
    );

    try {
      const mintPubkey = new PublicKey(mint);

      // Get metadata PDA
      const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

      const [metadataPDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from('metadata'),
          METADATA_PROGRAM_ID.toBuffer(),
          mintPubkey.toBuffer(),
        ],
        METADATA_PROGRAM_ID
      );

      console.log(`📋 Metadata PDA: ${metadataPDA.toString()}`);

      // Fetch metadata account
      const accountInfo = await connection.getAccountInfo(metadataPDA);

      if (!accountInfo) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Metadata account not found',
            message: 'This NFT may not have been minted yet or is not a Metaplex NFT'
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Parse metadata from account data
      const metadata = parseMetadata(accountInfo.data);

      console.log(`✅ Parsed metadata: ${metadata.name}`);

      // Fetch off-chain metadata from URI
      let offChainData = null;
      if (metadata.uri) {
        try {
          console.log(`🌐 Fetching off-chain data from: ${metadata.uri}`);
          const response = await fetch(metadata.uri);
          if (response.ok) {
            offChainData = await response.json();
          }
        } catch (fetchError) {
          console.error('Failed to fetch off-chain metadata:', fetchError);
          // Continue without off-chain data
        }
      }

      // Combine on-chain and off-chain metadata
      const fullMetadata = {
        success: true,
        mint,
        onChain: {
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadata.uri,
          sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
          creators: metadata.creators,
          updateAuthority: metadata.updateAuthority
        },
        offChain: offChainData,
        explorerUrl: `https://explorer.solana.com/address/${mint}?cluster=testnet`
      };

      return new Response(
        JSON.stringify(fullMetadata),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
          }
        }
      );

    } catch (solanaError) {
      console.error('Solana error:', solanaError);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to read NFT from blockchain',
          details: solanaError.message
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('❌ Error reading NFT metadata:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to read NFT metadata'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Parse Metaplex metadata from account data
 * Simplified parser - full implementation should use Metaplex SDK
 */
function parseMetadata(data) {
  try {
    let offset = 1; // Skip key byte

    // Update authority (32 bytes)
    const updateAuthority = new PublicKey(data.slice(offset, offset + 32)).toString();
    offset += 32;

    // Mint (32 bytes)
    const mint = new PublicKey(data.slice(offset, offset + 32)).toString();
    offset += 32;

    // Name (4 bytes length + string)
    const nameLength = data.readUInt32LE(offset);
    offset += 4;
    const name = data.slice(offset, offset + nameLength).toString('utf8').replace(/\0/g, '').trim();
    offset += nameLength;

    // Symbol (4 bytes length + string)
    const symbolLength = data.readUInt32LE(offset);
    offset += 4;
    const symbol = data.slice(offset, offset + symbolLength).toString('utf8').replace(/\0/g, '').trim();
    offset += symbolLength;

    // URI (4 bytes length + string)
    const uriLength = data.readUInt32LE(offset);
    offset += 4;
    const uri = data.slice(offset, offset + uriLength).toString('utf8').replace(/\0/g, '').trim();
    offset += uriLength;

    // Seller fee basis points (2 bytes)
    const sellerFeeBasisPoints = data.readUInt16LE(offset);
    offset += 2;

    // Creators (optional)
    const hasCreators = data[offset] === 1;
    offset += 1;

    let creators = [];
    if (hasCreators) {
      const creatorCount = data.readUInt32LE(offset);
      offset += 4;

      for (let i = 0; i < creatorCount; i++) {
        const address = new PublicKey(data.slice(offset, offset + 32)).toString();
        offset += 32;
        const verified = data[offset] === 1;
        offset += 1;
        const share = data[offset];
        offset += 1;

        creators.push({ address, verified, share });
      }
    }

    return {
      updateAuthority,
      mint,
      name,
      symbol,
      uri,
      sellerFeeBasisPoints,
      creators
    };

  } catch (error) {
    console.error('Error parsing metadata:', error);
    return {
      name: 'Unknown',
      symbol: '',
      uri: '',
      sellerFeeBasisPoints: 0,
      creators: []
    };
  }
}
