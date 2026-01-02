// /api/projects/list.js
// Generic projects endpoint - works for Kakuma and other WorldBridge One initiatives

import { neon } from '@neondatabase/serverless';

export async function GET({ request }) {
  const url = new URL(request.url);
  const initiative = url.searchParams.get('initiative'); // 'kakuma', 'general', etc.
  const category = url.searchParams.get('category'); // 'education', 'agriculture', etc.
  const status = url.searchParams.get('status') || 'active'; // 'active', 'completed', 'all'

  try {
    // Try database first
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    let query = sql`
      SELECT
        id,
        initiative,
        title,
        description,
        category,
        status,
        location,
        target_beneficiaries,
        current_beneficiaries,
        funding_goal,
        funding_raised,
        start_date,
        end_date,
        image_url,
        created_at
      FROM projects
      WHERE 1=1
    `;

    // Add filters
    if (initiative) {
      query = sql`${query} AND initiative = ${initiative}`;
    }
    if (category && category !== 'all') {
      query = sql`${query} AND category = ${category}`;
    }
    if (status !== 'all') {
      query = sql`${query} AND status = ${status}`;
    }

    query = sql`${query} ORDER BY created_at DESC`;

    const projects = await query;

    return new Response(JSON.stringify({
      success: true,
      projects,
      count: projects.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Database error, falling back to sample data:', error);

    // Fallback to sample projects
    const sampleProjects = getSampleProjects(initiative, category, status);

    return new Response(JSON.stringify({
      success: true,
      projects: sampleProjects,
      count: sampleProjects.length,
      fallback: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Sample projects for fallback
function getSampleProjects(initiative, category, status) {
  const allProjects = [
    {
      id: 'kakuma-garden-1',
      initiative: 'kakuma',
      title: 'Permaculture Garden Initiative',
      description: 'Establishing sustainable food gardens in Kakuma 1 and 2 to improve nutrition and teach permaculture skills to youth',
      category: 'agriculture',
      status: 'active',
      location: 'Kakuma 1 & 2',
      target_beneficiaries: 200,
      current_beneficiaries: 87,
      funding_goal: 10000,
      funding_raised: 6500,
      start_date: '2024-01-15',
      end_date: '2025-04-15',
      image_url: '/images/kakuma-garden.jpg',
      timeline_remaining: '3 months remaining'
    },
    {
      id: 'kakuma-solar-1',
      initiative: 'kakuma',
      title: 'Solar Panel Training Program',
      description: 'Teaching youth to install and maintain solar power systems, creating income opportunities in clean energy',
      category: 'energy',
      status: 'active',
      location: 'Kakuma 3',
      target_beneficiaries: 150,
      current_beneficiaries: 120,
      funding_goal: 15000,
      funding_raised: 12300,
      start_date: '2024-02-01',
      end_date: '2025-06-30',
      image_url: '/images/kakuma-solar.jpg',
      timeline_remaining: '5 months remaining'
    },
    {
      id: 'kakuma-music-1',
      initiative: 'kakuma',
      title: 'Music Production Academy',
      description: 'Equipping youth with music production skills, recording equipment, and online income opportunities',
      category: 'music',
      status: 'active',
      location: 'Kakuma 1',
      target_beneficiaries: 100,
      current_beneficiaries: 65,
      funding_goal: 20000,
      funding_raised: 8500,
      start_date: '2024-03-01',
      end_date: '2025-12-31',
      image_url: '/images/kakuma-music.jpg',
      timeline_remaining: '11 months remaining'
    },
    {
      id: 'kakuma-water-1',
      initiative: 'kakuma',
      title: 'Clean Water Access Initiative',
      description: 'Installing water filtration systems and teaching maintenance skills to ensure clean drinking water',
      category: 'water',
      status: 'active',
      location: 'Kakuma 2',
      target_beneficiaries: 300,
      current_beneficiaries: 180,
      funding_goal: 25000,
      funding_raised: 15000,
      start_date: '2024-01-01',
      end_date: '2025-03-31',
      image_url: '/images/kakuma-water.jpg',
      timeline_remaining: '2 months remaining'
    },
    {
      id: 'kakuma-tech-1',
      initiative: 'kakuma',
      title: 'Coding & Tech Skills Bootcamp',
      description: 'Teaching web development, app building, and freelancing skills to create remote work opportunities',
      category: 'education',
      status: 'active',
      location: 'Kakuma 1 & 3',
      target_beneficiaries: 80,
      current_beneficiaries: 45,
      funding_goal: 18000,
      funding_raised: 7200,
      start_date: '2024-04-01',
      end_date: '2025-09-30',
      image_url: '/images/kakuma-tech.jpg',
      timeline_remaining: '8 months remaining'
    }
  ];

  // Filter projects
  let filtered = allProjects;

  if (initiative) {
    filtered = filtered.filter(p => p.initiative === initiative);
  }

  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }

  if (status !== 'all') {
    filtered = filtered.filter(p => p.status === status);
  }

  return filtered;
}
