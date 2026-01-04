// src/pages/api/quiz/mint-certificate.js
// Mint training certificate NFT on Solana testnet

import { sql } from '@vercel/postgres';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { attemptId, walletAddress } = body;

    if (!attemptId || !walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get attempt details
    const { rows: attempts } = await sql`
      SELECT
        qa.id,
        qa.user_id,
        qa.wallet_address,
        qa.quiz_id,
        qa.score_percentage,
        qa.passed,
        qa.certificate_minted,
        qa.completed_at,
        u.username
      FROM quiz_attempts qa
      LEFT JOIN users u ON u.id = qa.user_id
      WHERE qa.id = ${attemptId}
        AND qa.wallet_address = ${walletAddress}
    `;

    if (attempts.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quiz attempt not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const attempt = attempts[0];

    // Check if already minted
    if (attempt.certificate_minted) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Certificate already minted for this attempt'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if passed
    if (!attempt.passed) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Must pass the quiz to receive a certificate'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Determine certificate type based on score
    let certificateType = 'standard';
    if (attempt.score_percentage >= 100) {
      certificateType = 'perfect';
    } else if (attempt.score_percentage >= 90) {
      certificateType = 'advanced';
    }

    // Get next certificate number
    const { rows: certCount } = await sql`
      SELECT COUNT(*) as total FROM training_certificates
    `;
    const certificateNumber = parseInt(certCount[0]?.total || 0) + 1;

    // TODO: In production, implement actual Solana NFT minting here
    // For now, we'll simulate the minting process

    // Generate mock NFT address for demo
    const mockNftAddress = `CERT${Date.now()}${Math.random().toString(36).substring(7)}`;
    const mockMetadataUri = `https://arweave.net/mock_${certificateNumber}`;

    // Create certificate record
    const { rows: certRows } = await sql`
      INSERT INTO training_certificates (
        attempt_id,
        user_id,
        wallet_address,
        certificate_number,
        certificate_type,
        score_percentage,
        nft_mint_address,
        metadata_uri,
        cohort,
        issued_at
      )
      VALUES (
        ${attemptId},
        ${attempt.user_id},
        ${walletAddress},
        ${certificateNumber},
        ${certificateType},
        ${attempt.score_percentage},
        ${mockNftAddress},
        ${mockMetadataUri},
        'Q1 2026',
        NOW()
      )
      RETURNING id, nft_mint_address
    `;

    const certificate = certRows[0];

    // Update attempt record
    await sql`
      UPDATE quiz_attempts
      SET
        certificate_minted = TRUE,
        certificate_nft_address = ${mockNftAddress},
        certificate_metadata_uri = ${mockMetadataUri},
        certificate_number = ${certificateNumber}
      WHERE id = ${attemptId}
    `;

    // Update user stats
    if (attempt.user_id) {
      await sql`
        UPDATE user_stats
        SET
          certificates_earned = certificates_earned + 1,
          battle_cards = battle_cards + 1,
          total_nfts = total_nfts + 1,
          updated_at = NOW()
        WHERE user_id = ${attempt.user_id}
      `;
    }

    return new Response(JSON.stringify({
      success: true,
      certificateId: certificate.id,
      nftAddress: certificate.nft_mint_address,
      certificateNumber: certificateNumber,
      certificateType: certificateType,
      metadataUri: mockMetadataUri,
      message: 'Certificate minted successfully!'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Mint certificate error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/*
 * TODO: Implement actual Solana NFT minting
 *
 * Steps for production implementation:
 *
 * 1. Import Solana dependencies:
 *    - @solana/web3.js
 *    - @metaplex-foundation/js
 *
 * 2. Generate SVG certificate:
 *    - Load certificate template (standard/advanced/perfect)
 *    - Replace placeholders: {{username}}, {{score}}, {{date}}, {{certificateNumber}}
 *    - Generate final SVG
 *
 * 3. Upload to permanent storage:
 *    - Use Bundlr/Arweave for image
 *    - Create metadata JSON with attributes
 *    - Upload metadata to Arweave
 *
 * 4. Mint NFT with Metaplex:
 *    - Create mint account
 *    - Create metadata account
 *    - Mint to recipient wallet
 *    - Store mint address in database
 *
 * 5. Error handling:
 *    - Handle transaction failures
 *    - Retry logic for network issues
 *    - Rollback database on minting failure
 */
