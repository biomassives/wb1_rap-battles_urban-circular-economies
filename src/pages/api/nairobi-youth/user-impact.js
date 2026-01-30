// src/pages/api/nairobi-youth/user-impact.js
// Returns user's personal impact on Nairobi Urban Youth programs

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // TODO: Replace with database query for real user impact data
    // For now, generate demo data based on wallet address hash
    const hash = walletAddress.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    const baseImpact = Math.abs(hash % 100);

    const userImpact = {
      success: true,
      walletAddress,
      youthImpacted: baseImpact + 5,
      totalActions: Math.floor(baseImpact * 1.5) + 10,
      valueGenerated: (baseImpact * 12) + 50,
      programsSupported: Math.floor(baseImpact / 20) + 1,
      impactBreakdown: [
        {
          type: 'music_royalties',
          icon: '🎵',
          title: 'Music Royalties',
          description: '30% of your music earnings support youth arts programs',
          value: Math.floor(baseImpact * 3.5),
          youth_helped: Math.floor(baseImpact / 5) + 1
        },
        {
          type: 'learning_completion',
          icon: '📚',
          title: 'Course Completions',
          description: 'Completed courses unlock scholarships for youth',
          value: Math.floor(baseImpact * 2),
          youth_helped: Math.floor(baseImpact / 10) + 1
        },
        {
          type: 'donations',
          icon: '💝',
          title: 'Direct Contributions',
          description: 'Direct donations to youth programs',
          value: Math.floor(baseImpact * 5),
          youth_helped: Math.floor(baseImpact / 3)
        },
        {
          type: 'mentorship',
          icon: '🤝',
          title: 'Mentorship Hours',
          description: 'Time spent mentoring Nairobi youth',
          value: Math.floor(baseImpact / 4),
          youth_helped: Math.floor(baseImpact / 8) + 1
        }
      ],
      recentActivity: [
        {
          date: new Date(Date.now() - 86400000).toISOString(),
          action: 'Completed Tech Literacy course',
          impact: 'Unlocked 1 youth scholarship'
        },
        {
          date: new Date(Date.now() - 172800000).toISOString(),
          action: 'Music track royalty share',
          impact: '$15 contributed to arts program'
        },
        {
          date: new Date(Date.now() - 259200000).toISOString(),
          action: 'Mentorship session completed',
          impact: '2 hours with Mathare youth'
        }
      ],
      badges: [
        { id: 'first_impact', name: 'First Impact', icon: '🌟', earned: true },
        { id: 'mentor', name: 'Youth Mentor', icon: '🎓', earned: baseImpact > 30 },
        { id: 'champion', name: 'Youth Champion', icon: '🏆', earned: baseImpact > 70 }
      ]
    };

    return new Response(JSON.stringify(userImpact), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('User impact error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
