/**
 * report-templates.js — Central configuration for status report templates
 *
 * Each template defines sections, role permissions, and query mappings.
 * Used by /api/reports/generate.js and /reports.astro
 */

export const REPORT_TEMPLATES = {
  battle_event: {
    id: 'battle_event',
    name: 'Battle Event Report',
    description: 'Rap battle summary with participants, results, and XP distributed',
    icon: '⚔️',
    requiredRoles: ['admin', 'moderator'],
    sections: [
      {
        id: 'battle_overview',
        title: 'Event Overview',
        description: 'Total battles, categories, statuses',
        queryKey: 'battleOverview',
        optional: false,
        defaultEnabled: true
      },
      {
        id: 'battle_results',
        title: 'Battle Results',
        description: 'Individual battle outcomes with winners',
        queryKey: 'battleResults',
        optional: false,
        defaultEnabled: true
      },
      {
        id: 'battle_participants',
        title: 'Participant Breakdown',
        description: 'Unique participants, submission counts, top battlers',
        queryKey: 'battleParticipants',
        optional: true,
        defaultEnabled: true
      },
      {
        id: 'battle_xp',
        title: 'XP Distribution',
        description: 'XP earned from battle activities in period',
        queryKey: 'battleXP',
        optional: true,
        defaultEnabled: true
      },
      {
        id: 'challenge_summary',
        title: 'Challenge Integration',
        description: 'Linked challenges and invite code usage',
        queryKey: 'challengeSummary',
        optional: true,
        defaultEnabled: false
      }
    ]
  },

  healthcare_program: {
    id: 'healthcare_program',
    name: 'Healthcare Program Report',
    description: 'Health observations, mentoring sessions, and wellness metrics',
    icon: '💙',
    requiredRoles: ['admin', 'moderator', 'mentor'],
    sections: [
      {
        id: 'health_overview',
        title: 'Health Program Overview',
        description: 'Total observations, unique participants, data types',
        queryKey: 'healthOverview',
        optional: false,
        defaultEnabled: true
      },
      {
        id: 'health_types',
        title: 'Observation Type Breakdown',
        description: 'Counts by type: activity, wellness, nutrition, sleep, etc.',
        queryKey: 'healthTypes',
        optional: true,
        defaultEnabled: true
      },
      {
        id: 'mentoring_sessions',
        title: 'Mentoring Sessions',
        description: 'Session counts, types, durations, total XP',
        queryKey: 'mentoringSessions',
        optional: false,
        defaultEnabled: true
      },
      {
        id: 'health_streaks',
        title: 'Engagement Streaks',
        description: 'Most active participants and consistency',
        queryKey: 'healthStreaks',
        optional: true,
        defaultEnabled: false
      },
      {
        id: 'health_xp',
        title: 'XP From Health Activities',
        description: 'XP earned from health logging and mentoring',
        queryKey: 'healthXP',
        optional: true,
        defaultEnabled: true
      }
    ]
  },

  water_system: {
    id: 'water_system',
    name: 'Water System Report',
    description: 'Water quality data, environmental observations, and repair evaluations',
    icon: '💧',
    requiredRoles: ['admin', 'moderator', 'mentor'],
    sections: [
      {
        id: 'water_overview',
        title: 'Water System Overview',
        description: 'Total water quality submissions, verified count, locations',
        queryKey: 'waterOverview',
        optional: false,
        defaultEnabled: true
      },
      {
        id: 'water_quality_data',
        title: 'Water Quality Measurements',
        description: 'Individual water quality readings with location data',
        queryKey: 'waterQualityData',
        optional: false,
        defaultEnabled: true
      },
      {
        id: 'environmental_observations',
        title: 'Environmental Observations',
        description: 'Broader environmental data: biodiversity, pollution, soil, air',
        queryKey: 'environmentalObservations',
        optional: true,
        defaultEnabled: true
      },
      {
        id: 'citizen_science_summary',
        title: 'Citizen Science Contributions',
        description: 'All citizen science submissions and verifications',
        queryKey: 'citizenScienceSummary',
        optional: true,
        defaultEnabled: true
      },
      {
        id: 'location_breakdown',
        title: 'Location Breakdown',
        description: 'Data grouped by location name',
        queryKey: 'locationBreakdown',
        optional: true,
        defaultEnabled: false
      }
    ]
  },

  community_impact: {
    id: 'community_impact',
    name: 'Community Impact Report',
    description: 'Cross-platform activity, governance, and citizen science contributions',
    icon: '🌍',
    requiredRoles: ['admin', 'moderator'],
    sections: [
      {
        id: 'community_overview',
        title: 'Community Overview',
        description: 'Total users, active users, total XP generated',
        queryKey: 'communityOverview',
        optional: false,
        defaultEnabled: true
      },
      {
        id: 'artist_reviews',
        title: 'Artist Reviews',
        description: 'Review counts, average ratings, top reviewers',
        queryKey: 'artistReviews',
        optional: true,
        defaultEnabled: true
      },
      {
        id: 'governance_activity',
        title: 'Governance Participation',
        description: 'Proposals created, votes cast, delegation activity',
        queryKey: 'governanceActivity',
        optional: true,
        defaultEnabled: true
      },
      {
        id: 'music_activity',
        title: 'Music Platform Activity',
        description: 'Tracks uploaded, plays, likes',
        queryKey: 'musicActivity',
        optional: true,
        defaultEnabled: true
      },
      {
        id: 'xp_distribution',
        title: 'XP Distribution Summary',
        description: 'XP earned by activity type across the platform',
        queryKey: 'xpDistribution',
        optional: true,
        defaultEnabled: true
      }
    ]
  },

  platform_overview: {
    id: 'platform_overview',
    name: 'Platform Overview Report',
    description: 'Admin-level summary of users, battles, challenges, music, and growth',
    icon: '📊',
    requiredRoles: ['admin'],
    sections: [
      {
        id: 'platform_stats',
        title: 'Platform Statistics',
        description: 'Total users, battles, challenges, tracks, XP',
        queryKey: 'platformStats',
        optional: false,
        defaultEnabled: true
      },
      {
        id: 'user_growth',
        title: 'User Growth',
        description: 'New users by week in date range',
        queryKey: 'userGrowth',
        optional: true,
        defaultEnabled: true
      },
      {
        id: 'tier_distribution',
        title: 'Airdrop Tier Distribution',
        description: 'Users per XP tier (Bronze through Mythic)',
        queryKey: 'tierDistribution',
        optional: true,
        defaultEnabled: true
      },
      {
        id: 'top_contributors',
        title: 'Top Contributors',
        description: 'Highest XP earners in the period',
        queryKey: 'topContributors',
        optional: true,
        defaultEnabled: true
      },
      {
        id: 'activity_heatmap',
        title: 'Activity by Type',
        description: 'Breakdown of all activity types and their counts',
        queryKey: 'activityHeatmap',
        optional: true,
        defaultEnabled: false
      }
    ]
  }
};

/**
 * Get templates accessible by a given role
 */
export function getTemplatesForRole(role) {
  return Object.values(REPORT_TEMPLATES).filter(
    t => t.requiredRoles.includes(role)
  );
}

/**
 * Get a specific template by ID
 */
export function getTemplate(templateId) {
  return REPORT_TEMPLATES[templateId] || null;
}
