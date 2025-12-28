// src/pages/api/environmental/get-courses.js
// Returns available environmental courses

export async function GET({ url }) {
  try {
    const category = url.searchParams.get('category') || 'all';
    const difficulty = url.searchParams.get('difficulty') || 'all';

    // Seed data - replace with database later
    const allCourses = [
      {
        id: 'course-001',
        title: 'Introduction to Permaculture',
        description: 'Learn the basics of sustainable agriculture and food production',
        category: 'agriculture',
        difficulty: 'beginner',
        duration: '4 weeks',
        xp_reward: 200,
        lessons: 12,
        enrolled: 0,
        thumbnail: '/images/courses/permaculture.jpg',
        instructor: 'Dr. Sarah Green',
        topics: ['Soil health', 'Water management', 'Companion planting']
      },
      {
        id: 'course-002',
        title: 'Urban Composting',
        description: 'Turn kitchen waste into nutrient-rich soil',
        category: 'waste',
        difficulty: 'beginner',
        duration: '2 weeks',
        xp_reward: 100,
        lessons: 6,
        enrolled: 0,
        thumbnail: '/images/courses/composting.jpg',
        instructor: 'Michael Torres',
        topics: ['Waste reduction', 'Soil enrichment', 'Urban gardening']
      },
      {
        id: 'course-003',
        title: 'Climate Science Fundamentals',
        description: 'Understanding climate change and its impacts',
        category: 'climate',
        difficulty: 'intermediate',
        duration: '6 weeks',
        xp_reward: 300,
        lessons: 18,
        enrolled: 0,
        thumbnail: '/images/courses/climate.jpg',
        instructor: 'Dr. James Chen',
        topics: ['Greenhouse gases', 'Climate modeling', 'Mitigation strategies']
      },
      {
        id: 'course-004',
        title: 'Water Conservation Techniques',
        description: 'Practical methods for saving water at home and in agriculture',
        category: 'water',
        difficulty: 'beginner',
        duration: '3 weeks',
        xp_reward: 150,
        lessons: 9,
        enrolled: 0,
        thumbnail: '/images/courses/water.jpg',
        instructor: 'Lisa Martinez',
        topics: ['Rainwater harvesting', 'Drip irrigation', 'Greywater systems']
      },
      {
        id: 'course-005',
        title: 'Biodiversity Monitoring',
        description: 'Learn to observe and document local ecosystems',
        category: 'biodiversity',
        difficulty: 'intermediate',
        duration: '5 weeks',
        xp_reward: 250,
        lessons: 15,
        enrolled: 0,
        thumbnail: '/images/courses/biodiversity.jpg',
        instructor: 'Dr. Amara Okonkwo',
        topics: ['Species identification', 'Data collection', 'Conservation']
      },
      {
        id: 'course-006',
        title: 'Renewable Energy Basics',
        description: 'Solar, wind, and other clean energy technologies',
        category: 'energy',
        difficulty: 'beginner',
        duration: '4 weeks',
        xp_reward: 200,
        lessons: 12,
        enrolled: 0,
        thumbnail: '/images/courses/renewable.jpg',
        instructor: 'Carlos Ramirez',
        topics: ['Solar power', 'Wind energy', 'Energy storage']
      }
    ];

    // Filter courses
    let courses = allCourses;

    if (category !== 'all') {
      courses = courses.filter(c => c.category === category);
    }

    if (difficulty !== 'all') {
      courses = courses.filter(c => c.difficulty === difficulty);
    }

    // Get categories for filter
    const categories = [
      { value: 'all', label: 'All Categories', count: allCourses.length },
      { value: 'agriculture', label: 'Agriculture', count: allCourses.filter(c => c.category === 'agriculture').length },
      { value: 'waste', label: 'Waste Management', count: allCourses.filter(c => c.category === 'waste').length },
      { value: 'climate', label: 'Climate', count: allCourses.filter(c => c.category === 'climate').length },
      { value: 'water', label: 'Water', count: allCourses.filter(c => c.category === 'water').length },
      { value: 'biodiversity', label: 'Biodiversity', count: allCourses.filter(c => c.category === 'biodiversity').length },
      { value: 'energy', label: 'Energy', count: allCourses.filter(c => c.category === 'energy').length }
    ];

    return new Response(JSON.stringify({
      success: true,
      courses,
      categories,
      total: courses.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get courses error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
