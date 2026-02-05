// /api/data/review/submit.js
// Submit review decision for pending data

import { neon } from '@neondatabase/serverless';

const REVIEW_XP = {
  base: 15,
  quality_bonus_per_point: 2, // Extra XP for high-quality reviews
  verified_content_bonus: 50  // Bonus XP to original submitter when verified
};

export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      reviewerWallet,
      submissionId,
      submissionType, // 'environmental', 'community', 'health'
      decision, // 'approve', 'reject', 'needs_revision'
      qualityScore, // 1-10
      feedback,
      tags = []
    } = body;

    // Validate required fields
    if (!reviewerWallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Reviewer wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!submissionId || !submissionType) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Submission ID and type are required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const validTypes = ['environmental', 'community', 'health'];
    if (!validTypes.includes(submissionType)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid submission type. Must be one of: ${validTypes.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const validDecisions = ['approve', 'reject', 'needs_revision'];
    if (!decision || !validDecisions.includes(decision)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid decision. Must be one of: ${validDecisions.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!qualityScore || qualityScore < 1 || qualityScore > 10) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quality score is required (1-10)'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Verify reviewer is qualified
    const reviewer = await sql`
      SELECT * FROM data_reviewers
      WHERE wallet_address = ${reviewerWallet}
        AND is_active = TRUE
    `;

    if (reviewer.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Not a qualified reviewer'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Check if already reviewed
    const existingReview = await sql`
      SELECT id FROM data_reviews
      WHERE submission_id = ${submissionId}
        AND submission_type = ${submissionType}
        AND reviewer_wallet = ${reviewerWallet}
    `;

    if (existingReview.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You have already reviewed this submission'
      }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    // Get submission details
    let submission;
    let tableName;

    if (submissionType === 'environmental') {
      tableName = 'environmental_observations';
      submission = await sql`
        SELECT wallet_address, verification_status, xp_awarded
        FROM environmental_observations
        WHERE id = ${submissionId}
      `;
    } else if (submissionType === 'community') {
      tableName = 'community_research';
      submission = await sql`
        SELECT wallet_address, verification_status, xp_awarded
        FROM community_research
        WHERE id = ${submissionId}
      `;
    } else {
      // Health observations are private, limited review
      return new Response(JSON.stringify({
        success: false,
        error: 'Health observations cannot be peer reviewed due to privacy'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (submission.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Submission not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const submitterWallet = submission[0].wallet_address;

    // Cannot review own submission
    if (submitterWallet === reviewerWallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot review your own submission'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Insert the review
    const reviewResult = await sql`
      INSERT INTO data_reviews (
        submission_id,
        submission_type,
        reviewer_wallet,
        decision,
        quality_score,
        feedback,
        tags
      ) VALUES (
        ${submissionId},
        ${submissionType},
        ${reviewerWallet},
        ${decision},
        ${qualityScore},
        ${feedback || null},
        ${tags}
      )
      RETURNING id, created_at
    `;

    const review = reviewResult[0];

    // Calculate reviewer XP
    const reviewerXP = REVIEW_XP.base + (qualityScore * REVIEW_XP.quality_bonus_per_point);

    // Update reviewer stats
    await sql`
      UPDATE data_reviewers
      SET total_reviews = total_reviews + 1,
          updated_at = NOW()
      WHERE wallet_address = ${reviewerWallet}
    `;

    // Award XP to reviewer
    await sql`
      UPDATE user_profiles
      SET xp = xp + ${reviewerXP},
          updated_at = NOW()
      WHERE wallet_address = ${reviewerWallet}
    `.catch(() => {});

    await sql`
      INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
      VALUES (
        ${reviewerWallet},
        'data_review',
        ${reviewerXP},
        ${`Reviewed ${submissionType} submission`},
        ${JSON.stringify({ submission_id: submissionId, decision, quality_score: qualityScore })}
      )
    `.catch(() => {});

    // Update submission status based on decision
    let newStatus = 'pending';
    let submitterBonusXP = 0;

    if (decision === 'approve') {
      newStatus = 'verified';
      submitterBonusXP = REVIEW_XP.verified_content_bonus;
    } else if (decision === 'reject') {
      newStatus = 'rejected';
    } else {
      newStatus = 'needs_revision';
    }

    // Update the submission
    if (submissionType === 'environmental') {
      await sql`
        UPDATE environmental_observations
        SET verification_status = ${newStatus},
            quality_score = ${qualityScore},
            verified_at = ${decision === 'approve' ? sql`NOW()` : sql`NULL`}
        WHERE id = ${submissionId}
      `;
    } else if (submissionType === 'community') {
      await sql`
        UPDATE community_research
        SET verification_status = ${newStatus},
            quality_score = ${qualityScore},
            verified_at = ${decision === 'approve' ? sql`NOW()` : sql`NULL`}
        WHERE id = ${submissionId}
      `;
    }

    // Award bonus XP to submitter if approved
    if (submitterBonusXP > 0) {
      await sql`
        UPDATE user_profiles
        SET xp = xp + ${submitterBonusXP},
            updated_at = NOW()
        WHERE wallet_address = ${submitterWallet}
      `.catch(() => {});

      await sql`
        INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
        VALUES (
          ${submitterWallet},
          'submission_verified',
          ${submitterBonusXP},
          ${`${submissionType} submission verified`},
          ${JSON.stringify({ submission_id: submissionId, quality_score: qualityScore })}
        )
      `.catch(() => {});
    }

    return new Response(JSON.stringify({
      success: true,
      review: {
        id: review.id,
        decision,
        qualityScore,
        created_at: review.created_at
      },
      submission: {
        id: submissionId,
        type: submissionType,
        newStatus,
        submitterBonusXP
      },
      reviewerXP,
      message: `Review submitted! Earned ${reviewerXP} XP.${submitterBonusXP > 0 ? ` Submitter earned ${submitterBonusXP} bonus XP.` : ''}`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to submit review: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// GET - Get review history
export async function GET({ request }) {
  const url = new URL(request.url);
  const reviewerWallet = url.searchParams.get('reviewerWallet');
  const submissionId = url.searchParams.get('submissionId');
  const submissionType = url.searchParams.get('submissionType');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    let reviews;

    if (submissionId && submissionType) {
      // Get reviews for a specific submission
      reviews = await sql`
        SELECT
          r.id,
          r.reviewer_wallet,
          r.decision,
          r.quality_score,
          r.feedback,
          r.tags,
          r.created_at,
          dr.reputation_score as reviewer_reputation
        FROM data_reviews r
        LEFT JOIN data_reviewers dr ON r.reviewer_wallet = dr.wallet_address
        WHERE r.submission_id = ${submissionId}
          AND r.submission_type = ${submissionType}
        ORDER BY r.created_at DESC
      `;
    } else if (reviewerWallet) {
      // Get reviews by a specific reviewer
      reviews = await sql`
        SELECT
          id,
          submission_id,
          submission_type,
          decision,
          quality_score,
          feedback,
          created_at
        FROM data_reviews
        WHERE reviewer_wallet = ${reviewerWallet}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Either reviewerWallet or (submissionId + submissionType) is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: true,
      reviews,
      pagination: {
        limit,
        offset,
        count: reviews.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch reviews'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
