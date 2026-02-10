// src/pages/api/nairobi-youth/programs.js
// Returns list of Nairobi Urban Youth programs

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const category = url.searchParams.get('category') || 'all';

    // Active programs - replace with database queries when ready
    let programs = [
      {
        id: 'ot-kulcha-reggae',
        title: 'OT Kulcha - "Pain in the Ghetto"',
        category: 'arts',
        description: 'Reggae collaboration album production based in Njiru, Nairobi. OT Kulcha brings together local artists to create music that speaks authentically to community struggles, resilience, and hope. The project develops artist skills in songwriting, recording, production, and music industry knowledge while producing a full-length album.',
        location: 'Njiru, Nairobi',
        target_beneficiaries: 0,
        current_beneficiaries: 0,
        funding_goal: 0,
        funding_raised: 0,
        status: 'active',
        leader: 'OT Kulcha',
        skills: ['Songwriting', 'Recording', 'Music Production', 'Performance'],
        image_url: '/images/programs/ot-kulcha.jpg'
      },
      {
        id: 'street-poets-nairobi',
        title: 'Fana Ke x Street Poets - Rap Battle Series',
        category: 'arts',
        description: 'Led by Fana Ke. A rap battle series empowering urban youth through competitive hip-hop, poetry, and spoken word. Street Poets brings together MCs, lyricists, and performers for live events with sponsors, building confidence, creative expression, and community voice across Nairobi.',
        location: 'Nairobi',
        target_beneficiaries: 0,
        current_beneficiaries: 0,
        funding_goal: 0,
        funding_raised: 0,
        status: 'active',
        leader: 'Fana Ke',
        skills: ['Rap', 'Freestyle', 'Spoken Word', 'Performance'],
        image_url: '/images/programs/street-poets.jpg',
        eventPage: '/events/street-poets-1'
      },
      {
        id: 'porefec-lamu',
        title: 'POREFEC - Lamu Coastal Enterprise',
        category: 'enterprise',
        description: 'Community-driven enterprise in Lamu focused on environmental cleanup and value creation. Activities include beach plastic collection and shredding for resale, aluminum ingot production from collected cans, and fermented coconut oil product manufacturing. Managed by a local table banking group that ensures equitable revenue distribution.',
        location: 'Lamu, Kenya',
        target_beneficiaries: 0,
        current_beneficiaries: 0,
        funding_goal: 0,
        funding_raised: 0,
        status: 'active',
        leader: 'Community Table Banking Group',
        skills: ['Plastic Recycling', 'Aluminum Processing', 'Coconut Oil Production', 'Table Banking'],
        image_url: '/images/programs/porefec-lamu.jpg'
      }
    ];

    // Filter by status
    if (status !== 'all') {
      programs = programs.filter(p => p.status === status);
    }

    // Filter by category
    if (category !== 'all') {
      programs = programs.filter(p => p.category === category);
    }

    return new Response(JSON.stringify({
      success: true,
      programs,
      total: programs.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Programs list error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
