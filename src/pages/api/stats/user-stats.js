// src/pages/api/stats/user-stats.js
// Returns comprehensive user statistics for profile dashboard

import { sql } from '@vercel/postgres';

export async function GET({ url }) {
  try {
    const walletAddress = url.searchParams.get('walletAddress');

    if (!walletAddress) {
      return new Response(JSON.stringify({
        error: 'Wallet address required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user ID from wallet address
    const { rows: users } = await sql`
      SELECT id, wallet_address, username, created_at
      FROM users
      WHERE wallet_address = ${walletAddress}
    `;

    if (users.length === 0) {
      return new Response(JSON.stringify({
        error: 'User not found',
        stats: null
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = users[0];

    // Get or create user stats
    let { rows: statsRows } = await sql`
      SELECT * FROM user_stats
      WHERE user_id = ${user.id}
    `;

    // If no stats exist, create them
    if (statsRows.length === 0) {
      await sql`
        INSERT INTO user_stats (user_id, wallet_address)
        VALUES (${user.id}, ${walletAddress})
      `;

      // Fetch the newly created stats
      const result = await sql`
        SELECT * FROM user_stats
        WHERE user_id = ${user.id}
      `;
      statsRows = result.rows;
    }

    const stats = statsRows[0];

    // Get weekly data for trends (last 12 weeks)
    const { rows: weeklyData } = await sql`
      SELECT
        week_start,
        tracks_created,
        battles_fought,
        lessons_completed,
        xp_earned,
        time_spent_minutes
      FROM user_stats_weekly
      WHERE user_id = ${user.id}
      ORDER BY week_start DESC
      LIMIT 12
    `;

    // Reverse to get chronological order
    const weeklyDataChronological = weeklyData.reverse();

    // Get daily activity for heatmap (last 365 days)
    const { rows: dailyActivity } = await sql`
      SELECT
        activity_date,
        tracks_created,
        battles_participated,
        lessons_completed,
        time_spent_minutes
      FROM user_activity_daily
      WHERE user_id = ${user.id}
        AND activity_date >= CURRENT_DATE - INTERVAL '365 days'
      ORDER BY activity_date ASC
    `;

    // Convert daily activity to object keyed by date
    const dailyActivityMap = {};
    dailyActivity.forEach(day => {
      const dateStr = day.activity_date.toISOString().split('T')[0];
      const activityCount = (day.tracks_created || 0) +
                           (day.battles_participated || 0) +
                           (day.lessons_completed || 0);
      dailyActivityMap[dateStr] = activityCount;
    });

    // Calculate previous week stats for trends
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay()); // Start of current week
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const { rows: lastWeekStats } = await sql`
      SELECT
        tracks_created as tracks_last_week,
        battles_fought as battles_last_week
      FROM user_stats_weekly
      WHERE user_id = ${user.id}
        AND week_start = ${lastWeekStart.toISOString().split('T')[0]}
    `;

    const previousWeek = lastWeekStats[0] || { tracks_last_week: 0, battles_last_week: 0 };

    // Prepare response
    const response = {
      success: true,
      stats: {
        // Music Stats
        total_tracks: stats.total_tracks || 0,
        tracks_this_week: stats.tracks_this_week || 0,
        tracks_last_week: previousWeek.tracks_last_week || 0,
        total_studio_time_minutes: stats.total_studio_time_minutes || 0,
        moog_plays: stats.moog_plays || 0,
        sampler_hits: stats.sampler_hits || 0,
        loops_created: stats.loops_created || 0,

        // Battle Stats
        total_battles: stats.total_battles || 0,
        battles_won: stats.battles_won || 0,
        battles_lost: stats.battles_lost || 0,
        battles_drawn: stats.battles_drawn || 0,
        current_win_streak: stats.current_win_streak || 0,
        longest_win_streak: stats.longest_win_streak || 0,
        total_badges_earned: stats.total_badges_earned || 0,
        unique_badges: stats.unique_badges || 0,

        // Learning Stats
        courses_started: stats.courses_started || 0,
        courses_completed: stats.courses_completed || 0,
        total_learning_time_minutes: stats.total_learning_time_minutes || 0,
        lessons_completed: stats.lessons_completed || 0,
        quizzes_taken: stats.quizzes_taken || 0,
        quiz_average_score: parseFloat(stats.quiz_average_score) || 0,
        certificates_earned: stats.certificates_earned || 0,
        current_learning_streak: stats.current_learning_streak || 0,
        longest_learning_streak: stats.longest_learning_streak || 0,

        // Community Impact Stats
        total_donated_sol: parseFloat(stats.total_donated_sol) || 0,
        volunteer_hours: stats.volunteer_hours || 0,
        mentorship_sessions: stats.mentorship_sessions || 0,
        helpful_reports: stats.helpful_reports || 0,
        community_upvotes: stats.community_upvotes || 0,

        // NFT Collection Stats
        total_nfts: stats.total_nfts || 0,
        battle_cards: stats.battle_cards || 0,
        total_collection_value_sol: parseFloat(stats.total_collection_value_sol) || 0,
        nfts_bought: stats.nfts_bought || 0,
        nfts_sold: stats.nfts_sold || 0,
        trading_volume_sol: parseFloat(stats.trading_volume_sol) || 0,

        // Engagement Metrics
        last_active: stats.last_active,
        active_days_count: stats.active_days_count || 0,
        current_streak_days: stats.current_streak_days || 0,
        longest_streak_days: stats.longest_streak_days || 0,
        updated_at: stats.updated_at
      },
      weekly: weeklyDataChronological.map(week => ({
        week_start: week.week_start.toISOString().split('T')[0],
        tracks_created: week.tracks_created || 0,
        battles_fought: week.battles_fought || 0,
        lessons_completed: week.lessons_completed || 0,
        xp_earned: week.xp_earned || 0,
        time_spent_minutes: week.time_spent_minutes || 0
      })),
      daily: dailyActivityMap,
      user: {
        username: user.username,
        wallet_address: user.wallet_address,
        member_since: user.created_at
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('User stats error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
