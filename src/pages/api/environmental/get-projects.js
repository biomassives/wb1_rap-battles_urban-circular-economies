// src/pages/api/environmental/get-projects.js
// Returns active citizen science projects

export async function GET({ url }) {
  try {
    const status = url.searchParams.get('status') || 'all';

    // Seed data - replace with database later
    const allProjects = [
      {
        id: 'project-001',
        title: 'Urban Tree Canopy Mapping',
        description: 'Help map tree coverage in your city to track urban forest health',
        category: 'biodiversity',
        status: 'active',
        participants: 234,
        observations: 1547,
        xp_per_observation: 10,
        difficulty: 'beginner',
        image: '/images/projects/tree-canopy.jpg',
        organization: 'City Green Initiative',
        data_types: ['GPS coordinates', 'Tree species', 'Photo', 'Health assessment'],
        impact: 'Helping cities plan better urban forestry programs'
      },
      {
        id: 'project-002',
        title: 'Water Quality Monitoring',
        description: 'Test local water bodies for pH, temperature, and clarity',
        category: 'water',
        status: 'active',
        participants: 456,
        observations: 2893,
        xp_per_observation: 15,
        difficulty: 'intermediate',
        image: '/images/projects/water-quality.jpg',
        organization: 'Clean Rivers Alliance',
        data_types: ['Location', 'pH level', 'Temperature', 'Clarity', 'Photo'],
        impact: 'Tracking water pollution and ecosystem health'
      },
      {
        id: 'project-003',
        title: 'Pollinator Count',
        description: 'Observe and count bees, butterflies, and other pollinators',
        category: 'biodiversity',
        status: 'active',
        participants: 678,
        observations: 4521,
        xp_per_observation: 10,
        difficulty: 'beginner',
        image: '/images/projects/pollinators.jpg',
        organization: 'Pollinator Partnership',
        data_types: ['Species type', 'Count', 'Weather', 'Plant visited', 'Photo'],
        impact: 'Understanding pollinator decline and habitat needs'
      },
      {
        id: 'project-004',
        title: 'Plastic Waste Audit',
        description: 'Document plastic pollution in your community',
        category: 'waste',
        status: 'active',
        participants: 345,
        observations: 1876,
        xp_per_observation: 12,
        difficulty: 'beginner',
        image: '/images/projects/plastic-waste.jpg',
        organization: 'Ocean Cleanup Project',
        data_types: ['Location', 'Plastic type', 'Quantity', 'Photo'],
        impact: 'Identifying pollution hotspots and sources'
      },
      {
        id: 'project-005',
        title: 'Soil Health Assessment',
        description: 'Test soil quality in gardens and parks',
        category: 'agriculture',
        status: 'active',
        participants: 189,
        observations: 723,
        xp_per_observation: 20,
        difficulty: 'advanced',
        image: '/images/projects/soil-health.jpg',
        organization: 'Sustainable Agriculture Network',
        data_types: ['Location', 'pH', 'Nutrients', 'Texture', 'Photo'],
        impact: 'Building database of soil health across regions'
      },
      {
        id: 'project-006',
        title: 'Bird Migration Tracking',
        description: 'Observe and report migratory bird sightings',
        category: 'biodiversity',
        status: 'active',
        participants: 892,
        observations: 6234,
        xp_per_observation: 10,
        difficulty: 'beginner',
        image: '/images/projects/bird-migration.jpg',
        organization: 'Audubon Society',
        data_types: ['Species', 'Count', 'Location', 'Date/Time', 'Photo'],
        impact: 'Tracking migration patterns and climate impacts'
      }
    ];

    // Filter projects
    let projects = allProjects;

    if (status !== 'all') {
      projects = projects.filter(p => p.status === status);
    }

    // Calculate total impact
    const totalImpact = {
      total_participants: allProjects.reduce((sum, p) => sum + p.participants, 0),
      total_observations: allProjects.reduce((sum, p) => sum + p.observations, 0),
      active_projects: allProjects.filter(p => p.status === 'active').length
    };

    return new Response(JSON.stringify({
      success: true,
      projects,
      total_impact: totalImpact,
      total: projects.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get projects error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
