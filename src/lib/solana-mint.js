/**
 * Server-Side Solana NFT Minting Library
 * Uses Metaplex JS SDK for devnet minting
 *
 * Supports two modes via SOLANA_MINT_MODE env var:
 * - "live"     : Real on-chain Metaplex minting (requires SOL balance)
 * - "simulate" : Full pipeline test without blockchain (default when no SOL)
 *
 * Required env vars:
 * - SOLANA_PRIVATE_KEY: Base58-encoded secret key of minting authority
 * - SOLANA_RPC_URL: Optional RPC override (defaults to devnet)
 * - SOLANA_MINT_MODE: "live" or "simulate" (default: "simulate")
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import bs58 from 'bs58';

const DEVNET_RPC = 'https://api.devnet.solana.com';

let _connection = null;
let _metaplex = null;
let _keypair = null;

/**
 * Check if we're in simulation mode
 */
export function isSimulateMode() {
  return (process.env.SOLANA_MINT_MODE || 'simulate') === 'simulate';
}

/**
 * Get or create a cached Solana connection
 */
export function getConnection() {
  if (!_connection) {
    const rpcUrl = process.env.SOLANA_RPC_URL || DEVNET_RPC;
    _connection = new Connection(rpcUrl, 'confirmed');
  }
  return _connection;
}

/**
 * Load the minting authority keypair from env
 */
function getKeypair() {
  if (!_keypair) {
    const privateKey = process.env.SOLANA_PRIVATE_KEY;
    if (!privateKey) {
      if (isSimulateMode()) {
        // Generate a throwaway keypair for simulation
        _keypair = Keypair.generate();
        return _keypair;
      }
      throw new Error('SOLANA_PRIVATE_KEY environment variable is not set. Generate a keypair with: solana-keygen new');
    }

    try {
      const decoded = bs58.decode(privateKey);
      _keypair = Keypair.fromSecretKey(decoded);
    } catch {
      try {
        const parsed = JSON.parse(privateKey);
        _keypair = Keypair.fromSecretKey(new Uint8Array(parsed));
      } catch {
        throw new Error('SOLANA_PRIVATE_KEY must be base58-encoded or a JSON array of bytes');
      }
    }
  }
  return _keypair;
}

/**
 * Get or create a cached Metaplex client
 */
export function getMetaplex() {
  if (!_metaplex) {
    const connection = getConnection();
    const keypair = getKeypair();
    _metaplex = Metaplex.make(connection).use(keypairIdentity(keypair));
  }
  return _metaplex;
}

/**
 * Get the authority public key
 */
export function getAuthorityPublicKey() {
  return getKeypair().publicKey.toString();
}

/**
 * Generate a realistic-looking simulated mint address
 */
function generateSimulatedAddress() {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = 'SIM';
  for (let i = 0; i < 41; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function generateSimulatedSignature() {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 88; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Mint a new NFT via Metaplex (or simulate)
 *
 * @param {object} params
 * @param {string} params.name - NFT name
 * @param {string} params.symbol - Token symbol (e.g., 'WBRAP')
 * @param {string} params.uri - Metadata JSON URI
 * @param {number} params.sellerFeeBasisPoints - Royalty in basis points (500 = 5%)
 * @param {string} params.recipientAddress - Wallet to receive the NFT
 * @returns {{ mintAddress: string, signature: string, explorerUrl: string, simulated: boolean }}
 */
export async function mintNFT({ name, symbol, uri, sellerFeeBasisPoints = 500, recipientAddress }) {
  // Validate recipient address format
  try {
    new PublicKey(recipientAddress);
  } catch {
    throw new Error('Invalid recipient wallet address');
  }

  // --- SIMULATION MODE ---
  if (isSimulateMode()) {
    // Simulate network delay (0.5-2s)
    await new Promise(r => setTimeout(r, 500 + Math.random() * 1500));

    const mintAddress = generateSimulatedAddress();
    const signature = generateSimulatedSignature();

    console.log(`[SIMULATE] Minted "${name}" -> ${mintAddress}`);
    console.log(`[SIMULATE] URI: ${uri}`);
    console.log(`[SIMULATE] Recipient: ${recipientAddress}`);

    return {
      mintAddress,
      signature,
      explorerUrl: `https://explorer.solana.com/address/${mintAddress}?cluster=devnet`,
      simulated: true
    };
  }

  // --- LIVE MODE ---
  const metaplex = getMetaplex();
  const recipientPubkey = new PublicKey(recipientAddress);

  const { nft, response } = await metaplex.nfts().create({
    uri,
    name,
    symbol,
    sellerFeeBasisPoints,
    tokenOwner: recipientPubkey,
  });

  const mintAddress = nft.address.toString();
  const signature = response.signature;

  return {
    mintAddress,
    signature,
    explorerUrl: `https://explorer.solana.com/address/${mintAddress}?cluster=devnet`,
    simulated: false
  };
}

/**
 * Check authority wallet SOL balance
 */
export async function getAuthorityBalance() {
  if (isSimulateMode()) {
    return 999.0; // Simulated balance
  }

  const connection = getConnection();
  const keypair = getKeypair();
  const balance = await connection.getBalance(keypair.publicKey);
  return balance / 1e9;
}
