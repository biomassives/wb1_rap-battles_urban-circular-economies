// src/pages/api/nairobi-youth/global-stats.js
// Returns global Nairobi Urban Youth impact statistics

export async function GET() {
  try {
    // Statistics for Nairobi Urban Youth programs
    const stats = {
      success: true,
      stats: {
        totalYouth: 2450,
        totalValue: 125000,
        activePrograms: 12,
        totalMentors: 85,
        skillsTaught: 34,
        enterprisesStarted: 47
      },
      impact_areas: {
        education: {
          programs: 3,
          beneficiaries: 650,
          description: 'Tutoring, scholarships, study materials'
        },
        tech_literacy: {
          programs: 2,
          beneficiaries: 420,
          description: 'Computer skills, programming, digital marketing'
        },
        ai_skills: {
          programs: 1,
          beneficiaries: 180,
          description: 'AI tools training, prompt engineering, ethics'
        },
        mentorship: {
          programs: 2,
          beneficiaries: 350,
          description: 'Career guidance, professional networking'
        },
        social_enterprise: {
          programs: 2,
          beneficiaries: 280,
          description: 'Business training, micro-grants, market access'
        },
        arts_culture: {
          programs: 1,
          beneficiaries: 320,
          description: 'Music production, visual arts, performance'
        },
        health_wellness: {
          programs: 1,
          beneficiaries: 250,
          description: 'Mental health, health education, sports'
        }
      },
      communities: [
        { name: 'Kibera', youth_reached: 680 },
        { name: 'Mathare', youth_reached: 520 },
        { name: 'Korogocho', youth_reached: 380 },
        { name: 'Mukuru', youth_reached: 340 },
        { name: 'Dandora', youth_reached: 290 },
        { name: 'Kawangware', youth_reached: 240 }
      ],
      monthly_trend: [
        { month: 'Oct', youth_supported: 180, value_generated: 8500 },
        { month: 'Nov', youth_supported: 220, value_generated: 10200 },
        { month: 'Dec', youth_supported: 285, value_generated: 12800 },
        { month: 'Jan', youth_supported: 310, value_generated: 14500 }
      ]
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
