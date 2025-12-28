// src/pages/api/kakuma/global-stats.js
// Returns global Kakuma impact statistics

export async function GET() {
  try {
    // Seed data - replace with real data later
    const stats = {
      success: true,
      total_donations: 1247,
      total_amount_usd: 52340,
      active_projects: 8,
      beneficiaries: 3200,
      impact_areas: {
        education: { projects: 3, beneficiaries: 1200 },
        agriculture: { projects: 2, beneficiaries: 800 },
        healthcare: { projects: 1, beneficiaries: 500 },
        infrastructure: { projects: 2, beneficiaries: 700 }
      },
      recent_donations: [
        {
          amount: 50,
          currency: 'USD',
          project: 'School Supplies Program',
          donor: 'Anonymous',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          amount: 100,
          currency: 'USD',
          project: 'Clean Water Initiative',
          donor: 'Community Member',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        }
      ],
      monthly_trend: [
        { month: 'Oct', donations: 145, amount: 6200 },
        { month: 'Nov', donations: 178, amount: 7800 },
        { month: 'Dec', donations: 234, amount: 9500 }
      ]
    };

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Global stats error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
