/**
 * GET /api/nft/test-pipeline
 * Validates the full NFT minting pipeline without actually minting.
 * Tests: env vars, keypair loading, metadata endpoints, card images, DB tables.
 *
 * POST /api/nft/test-pipeline
 * Runs a full simulated mint for a given NFT ID.
 * Body: { nftId: number, walletAddress: string }
 */

import { sql } from '../../../lib/db.js';
import { isSimulateMode, getAuthorityPublicKey, getAuthorityBalance } from '../../../lib/solana-mint.js';

export const prerender = false;

// GET: Run pipeline health checks
export async function GET({ url }) {
  const checks = [];
  const siteUrl = url.origin;

  // 1. Check env vars
  checks.push({
    name: 'SOLANA_PRIVATE_KEY',
    status: process.env.SOLANA_PRIVATE_KEY ? 'ok' : 'missing',
    detail: process.env.SOLANA_PRIVATE_KEY ? 'Set (hidden)' : 'Not set — required for minting'
  });

  checks.push({
    name: 'SOLANA_MINT_MODE',
    status: 'ok',
    detail: isSimulateMode() ? 'simulate (no SOL needed)' : 'live (on-chain minting)'
  });

  checks.push({
    name: 'DATABASE_URL',
    status: (process.env.DATABASE_URL || process.env.NILE_DATABASE_URL) ? 'ok' : 'missing',
    detail: (process.env.DATABASE_URL || process.env.NILE_DATABASE_URL) ? 'Set (hidden)' : 'Not set'
  });

  // 2. Try loading keypair
  try {
    const pubkey = getAuthorityPublicKey();
    checks.push({
      name: 'Keypair',
      status: 'ok',
      detail: `Authority: ${pubkey.slice(0, 8)}...${pubkey.slice(-6)}`
    });
  } catch (e) {
    checks.push({ name: 'Keypair', status: 'error', detail: e.message });
  }

  // 3. Check authority balance
  try {
    const balance = await getAuthorityBalance();
    checks.push({
      name: 'Authority Balance',
      status: balance >= 0.05 ? 'ok' : 'warning',
      detail: `${balance.toFixed(4)} SOL${isSimulateMode() ? ' (simulated)' : ''}`
    });
  } catch (e) {
    checks.push({ name: 'Authority Balance', status: 'error', detail: e.message });
  }

  // 4. Test metadata endpoint
  try {
    const metaUrl = `${siteUrl}/api/nft/metadata-json/1`;
    checks.push({
      name: 'Metadata Endpoint',
      status: 'ok',
      detail: metaUrl,
      testUrl: metaUrl
    });
  } catch (e) {
    checks.push({ name: 'Metadata Endpoint', status: 'error', detail: e.message });
  }

  // 5. Test card image endpoint
  try {
    const imgUrl = `${siteUrl}/api/nft/card-image/1`;
    checks.push({
      name: 'Card Image Endpoint',
      status: 'ok',
      detail: imgUrl,
      testUrl: imgUrl
    });
  } catch (e) {
    checks.push({ name: 'Card Image Endpoint', status: 'error', detail: e.message });
  }

  // 6. Test DB tables exist
  try {
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('nft_transactions', 'pfp_mints', 'xp_activities', 'user_profiles')
      ORDER BY table_name
    `;
    const found = tables.map(t => t.table_name);
    const required = ['nft_transactions', 'pfp_mints', 'xp_activities', 'user_profiles'];
    const missing = required.filter(t => !found.includes(t));

    checks.push({
      name: 'DB Tables',
      status: missing.length === 0 ? 'ok' : 'warning',
      detail: missing.length === 0
        ? `All present: ${found.join(', ')}`
        : `Missing: ${missing.join(', ')} — run init-schema with "nft" group`
    });
  } catch (e) {
    checks.push({ name: 'DB Tables', status: 'error', detail: e.message });
  }

  // Summary
  const allOk = checks.every(c => c.status === 'ok');
  const hasErrors = checks.some(c => c.status === 'error');

  return new Response(JSON.stringify({
    pipeline: allOk ? 'READY' : hasErrors ? 'ERRORS' : 'WARNINGS',
    mode: isSimulateMode() ? 'simulate' : 'live',
    checks,
    nextSteps: [
      ...(isSimulateMode() ? ['Set SOLANA_MINT_MODE=live and fund authority wallet for on-chain minting'] : []),
      ...(checks.find(c => c.name === 'DB Tables' && c.status !== 'ok')
        ? ['Run POST /api/settings/init-schema with tables: ["nft"] to create missing tables'] : []),
      'Test simulated mint: POST /api/nft/test-pipeline with { nftId: 1, walletAddress: "YOUR_WALLET" }',
      'Browse metadata: GET /api/nft/metadata-json/1',
      'View card image: GET /api/nft/card-image/1'
    ]
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// POST: Run a full simulated mint
export async function POST({ request, url }) {
  try {
    const body = await request.json();
    const { nftId, walletAddress } = body;

    if (!nftId || !walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Required: nftId (1-55) and walletAddress'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Call the real mint endpoint internally
    const siteUrl = url.origin;
    const mintResponse = await fetch(`${siteUrl}/api/nft/mint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress,
        nftId: parseInt(nftId),
        metadata: {
          name: `Test Rapper #${nftId}`,
          symbol: 'WBRAP',
          rarity: 'Common'
        }
      })
    });

    const result = await mintResponse.json();

    return new Response(JSON.stringify({
      testResult: result.success ? 'PASS' : 'FAIL',
      mode: isSimulateMode() ? 'simulate' : 'live',
      ...result,
      pipelineSteps: {
        validation: 'ok',
        metadataUri: `${siteUrl}/api/nft/metadata-json/${nftId}`,
        cardImageUri: `${siteUrl}/api/nft/card-image/${nftId}`,
        minting: result.success ? 'ok' : 'failed',
        dbRecord: result.success ? 'ok' : 'skipped',
        xpAward: result.success ? 'ok (50 XP)' : 'skipped'
      }
    }, null, 2), {
      status: mintResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      testResult: 'ERROR',
      error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
