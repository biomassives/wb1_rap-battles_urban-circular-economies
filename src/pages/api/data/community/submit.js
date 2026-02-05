// /api/data/community/submit.js
// Submit community research (surveys, local knowledge, stories)

import { neon } from '@neondatabase/serverless';

const XP_VALUES = {
  survey: 50,
  local_knowledge: 100,
  story: 40,
  translation: 75,
  interview: 80,
  verified_bonus: 100
};

export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      researchType,
      title,
      content,
      language = 'en',
      targetCommunity,
      location,
      tags = [],
      mediaUrls = [],
      collaborators = []
    } = body;

    // Validate required fields
    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!researchType) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Research type is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const validTypes = ['survey', 'local_knowledge', 'story', 'translation', 'interview', 'case_study', 'needs_assessment'];
    if (!validTypes.includes(researchType)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid research type. Must be one of: ${validTypes.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!title || title.trim().length < 5) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Title is required (minimum 5 characters)'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!content || content.trim().length < 50) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Content is required (minimum 50 characters)'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Calculate base XP
    const baseXP = XP_VALUES[researchType] || 50;

    // Bonus for non-English content (supports localization)
    const languageBonus = language !== 'en' ? 25 : 0;

    // Bonus for media attachments
    const mediaBonus = mediaUrls.length > 0 ? 15 : 0;

    const totalXP = baseXP + languageBonus + mediaBonus;

    // Insert community research
    const result = await sql`
      INSERT INTO community_research (
        wallet_address,
        research_type,
        title,
        content,
        language,
        target_community,
        location_name,
        tags,
        media_urls,
        collaborators,
        xp_awarded,
        verification_status
      ) VALUES (
        ${walletAddress},
        ${researchType},
        ${title.trim()},
        ${content.trim()},
        ${language},
        ${targetCommunity || null},
        ${location || null},
        ${tags},
        ${JSON.stringify(mediaUrls)},
        ${collaborators},
        ${totalXP},
        'pending'
      )
      RETURNING id, created_at
    `;

    const research = result[0];

    // Award XP to user
    await sql`
      UPDATE user_profiles
      SET xp = xp + ${totalXP},
          updated_at = NOW()
      WHERE wallet_address = ${walletAddress}
    `.catch(() => {});

    // Log XP activity
    await sql`
      INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
      VALUES (
        ${walletAddress},
        'community_research',
        ${totalXP},
        ${`Submitted ${researchType}: ${title}`},
        ${JSON.stringify({ research_id: research.id, type: researchType, language })}
      )
    `.catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      research: {
        id: research.id,
        type: researchType,
        title,
        status: 'pending',
        created_at: research.created_at
      },
      xpEarned: totalXP,
      bonuses: {
        base: baseXP,
        language: languageBonus,
        media: mediaBonus
      },
      message: `Community research submitted! Earned ${totalXP} XP. Additional ${XP_VALUES.verified_bonus} XP when verified.`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error submitting community research:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to submit community research: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// GET - List community research
export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');
  const type = url.searchParams.get('type');
  const language = url.searchParams.get('language');
  const status = url.searchParams.get('status') || 'verified';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    let research;

    if (walletAddress) {
      // Get user's own research
      research = await sql`
        SELECT
          id,
          research_type,
          title,
          content,
          language,
          target_community,
          location_name,
          tags,
          media_urls,
          verification_status,
          quality_score,
          xp_awarded,
          created_at,
          verified_at
        FROM community_research
        WHERE wallet_address = ${walletAddress}
        ${type ? sql`AND research_type = ${type}` : sql``}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      // Get public verified research
      research = await sql`
        SELECT
          id,
          wallet_address,
          research_type,
          title,
          content,
          language,
          target_community,
          location_name,
          tags,
          media_urls,
          quality_score,
          created_at
        FROM community_research
        WHERE verification_status = ${status}
        ${type ? sql`AND research_type = ${type}` : sql``}
        ${language ? sql`AND language = ${language}` : sql``}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM community_research
      WHERE ${walletAddress ? sql`wallet_address = ${walletAddress}` : sql`verification_status = ${status}`}
      ${type ? sql`AND research_type = ${type}` : sql``}
    `;

    const total = parseInt(countResult[0]?.total || 0);

    return new Response(JSON.stringify({
      success: true,
      research,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + research.length < total
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error listing community research:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to list community research',
      research: [],
      pagination: { total: 0, limit, offset, hasMore: false }
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
