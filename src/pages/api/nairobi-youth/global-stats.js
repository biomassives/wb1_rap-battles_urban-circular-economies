// src/pages/api/nairobi-youth/global-stats.js
// Returns global Nairobi Urban Youth impact statistics

export async function GET() {
  try {
    // Statistics for Nairobi Urban Youth programs
    const stats = {
      success: true,
      stats: {
        totalYouth: 0,
        totalValue: 0,
        activePrograms: 3,
        totalMentors: 0,
        skillsTaught: 0,
        enterprisesStarted: 0
      },
      impact_areas: {
        arts_culture: {
          programs: 2,
          beneficiaries: 0,
          description: 'Reggae production, rap battles, spoken word'
        },
        social_enterprise: {
          programs: 1,
          beneficiaries: 0,
          description: 'Plastic recycling, aluminum ingots, coconut oil'
        }
      },
      communities: [
        { name: 'Njiru, Nairobi', youth_reached: 0 },
        { name: 'Nairobi Central', youth_reached: 0 },
        { name: 'Lamu', youth_reached: 0 }
      ],
      monthly_trend: []
    };

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Global stats error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
