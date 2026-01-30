// src/pages/api/nairobi-youth/programs.js
// Returns list of Nairobi Urban Youth programs

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const category = url.searchParams.get('category') || 'all';

    // Demo programs - replace with database queries
    let programs = [
      {
        id: 'tech-literacy-kibera',
        title: 'Tech Literacy Hub - Kibera',
        category: 'tech',
        description: 'Computer and digital skills training center in Kibera, teaching basic computer literacy to advanced programming. Preparing youth for careers in the digital economy.',
        location: 'Kibera',
        target_beneficiaries: 200,
        current_beneficiaries: 142,
        funding_goal: 15000,
        funding_raised: 9800,
        status: 'active',
        skills: ['Computer Basics', 'Microsoft Office', 'Web Development', 'Mobile Apps'],
        image_url: '/images/programs/tech-hub.jpg'
      },
      {
        id: 'ai-skills-mathare',
        title: 'AI Skills Workshop - Mathare',
        category: 'tech',
        description: 'Teaching youth to leverage AI tools for productivity, creativity, and career advancement. Includes prompt engineering, AI ethics, and practical applications.',
        location: 'Mathare',
        target_beneficiaries: 100,
        current_beneficiaries: 45,
        funding_goal: 8000,
        funding_raised: 3200,
        status: 'active',
        skills: ['ChatGPT', 'AI Image Generation', 'Prompt Engineering', 'AI Ethics'],
        image_url: '/images/programs/ai-workshop.jpg'
      },
      {
        id: 'music-studio-korogocho',
        title: 'Community Music Studio - Korogocho',
        category: 'arts',
        description: 'Professional music production training and recording studio access for aspiring artists. Creating pathways to music industry careers.',
        location: 'Korogocho',
        target_beneficiaries: 75,
        current_beneficiaries: 68,
        funding_goal: 12000,
        funding_raised: 10500,
        status: 'active',
        skills: ['Music Production', 'Audio Engineering', 'Songwriting', 'Performance'],
        image_url: '/images/programs/music-studio.jpg'
      },
      {
        id: 'youth-enterprise-mukuru',
        title: 'Youth Enterprise Incubator - Mukuru',
        category: 'enterprise',
        description: 'Business skills training, micro-grants, and mentorship for youth-led social enterprises. Building sustainable livelihoods through entrepreneurship.',
        location: 'Mukuru',
        target_beneficiaries: 50,
        current_beneficiaries: 32,
        funding_goal: 20000,
        funding_raised: 14500,
        status: 'active',
        skills: ['Business Planning', 'Financial Literacy', 'Marketing', 'Leadership'],
        image_url: '/images/programs/enterprise.jpg'
      },
      {
        id: 'health-wellness-dandora',
        title: 'Youth Health & Wellness - Dandora',
        category: 'health',
        description: 'Mental health support, health education, and sports programs addressing the unique challenges faced by urban youth.',
        location: 'Dandora',
        target_beneficiaries: 300,
        current_beneficiaries: 187,
        funding_goal: 10000,
        funding_raised: 6200,
        status: 'active',
        skills: ['Mental Health Awareness', 'Nutrition', 'Fitness', 'First Aid'],
        image_url: '/images/programs/health.jpg'
      },
      {
        id: 'career-mentorship-nairobi',
        title: 'Career Mentorship Network',
        category: 'mentorship',
        description: 'Connecting youth with professional mentors for career guidance, job readiness training, and employment connections.',
        location: 'Nairobi-wide',
        target_beneficiaries: 500,
        current_beneficiaries: 285,
        funding_goal: 25000,
        funding_raised: 18000,
        status: 'active',
        skills: ['Resume Writing', 'Interview Skills', 'Professional Networking', 'Career Planning'],
        image_url: '/images/programs/mentorship.jpg'
      },
      {
        id: 'visual-arts-kawangware',
        title: 'Visual Arts Academy - Kawangware',
        category: 'arts',
        description: 'Training in graphic design, photography, and digital art. Creating pathways to creative careers and self-expression.',
        location: 'Kawangware',
        target_beneficiaries: 60,
        current_beneficiaries: 38,
        funding_goal: 9000,
        funding_raised: 5400,
        status: 'active',
        skills: ['Graphic Design', 'Photography', 'Digital Art', 'Portfolio Building'],
        image_url: '/images/programs/visual-arts.jpg'
      },
      {
        id: 'education-support-citywide',
        title: 'Education Support Program',
        category: 'education',
        description: 'After-school tutoring, exam preparation, and scholarship matching for youth pursuing academic excellence across Nairobi.',
        location: 'Nairobi-wide',
        target_beneficiaries: 400,
        current_beneficiaries: 245,
        funding_goal: 18000,
        funding_raised: 12000,
        status: 'active',
        skills: ['Academic Tutoring', 'Study Skills', 'Exam Prep', 'Scholarship Applications'],
        image_url: '/images/programs/education.jpg'
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
