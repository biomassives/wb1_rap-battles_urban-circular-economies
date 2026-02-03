// /api/projects/[slug].js
// Get a single user project by slug

import { neon } from '@neondatabase/serverless';

export async function GET({ params, request }) {
  const { slug } = params;
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');

  if (!slug) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Project slug is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Get project with owner info
    const projects = await sql`
      SELECT
        p.*,
        up.username as owner_username,
        up.avatar_url as owner_avatar
      FROM user_projects p
      LEFT JOIN user_profiles up ON p.owner_wallet = up.wallet_address
      WHERE p.slug = ${slug}
    `;

    if (projects.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Project not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const project = projects[0];

    // Check visibility permissions
    if (project.visibility === 'private' && project.owner_wallet !== walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This project is private'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Only show published projects to non-owners (unless unlisted/direct link)
    if (project.status !== 'published' && project.owner_wallet !== walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Project not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Increment view count (don't count owner views)
    if (project.owner_wallet !== walletAddress) {
      await sql`
        UPDATE user_projects
        SET view_count = view_count + 1
        WHERE slug = ${slug}
      `.catch(() => {}); // Don't fail if view count update fails
    }

    // Check if current user has liked
    let hasLiked = false;
    if (walletAddress) {
      const likes = await sql`
        SELECT 1 FROM user_project_likes
        WHERE project_id = ${project.id} AND wallet_address = ${walletAddress}
      `;
      hasLiked = likes.length > 0;
    }

    return new Response(JSON.stringify({
      success: true,
      project: {
        ...project,
        hasLiked,
        isOwner: project.owner_wallet === walletAddress
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching project:', error);

    // Fallback to sample projects
    const sampleProject = getSampleProject(slug);
    if (sampleProject) {
      return new Response(JSON.stringify({
        success: true,
        project: sampleProject,
        fallback: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch project'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Sample projects for fallback/demo
function getSampleProject(slug) {
  const samples = {
    'pain-in-the-ghetto': {
      id: 1,
      slug: 'pain-in-the-ghetto',
      owner_wallet: 'DEMO_WALLET_ARTIST_1',
      owner_username: 'GhettoPoet',
      title: 'Pain in the Ghetto',
      subtitle: 'A musical journey through urban struggles and hope',
      description: 'An album project exploring the realities of life in marginalized communities.',
      content: `# Pain in the Ghetto

This project was born from the streets, from the stories that never get told on mainstream platforms.

## The Vision

We wanted to create something raw and real - music that speaks to the experience of growing up in communities that are often overlooked.

## Track List

1. **Dawn** - Waking up to another day of struggle
2. **Concrete Dreams** - Finding hope in unexpected places
3. **Mama's Prayer** - Dedicated to the mothers who sacrifice everything
4. **Rise** - The anthem of resilience

## Collaborators

This project features voices from Kakuma Refugee Camp, Nairobi, and beyond.`,
      category: 'music',
      tags: ['hip-hop', 'soul', 'kakuma', 'social-justice', 'album'],
      cover_image: '/images/projects/pain-in-the-ghetto-cover.jpg',
      media_urls: [
        { type: 'audio', url: '/audio/pain-preview.mp3', caption: 'Album Preview' }
      ],
      links: [
        { title: 'Spotify', url: 'https://spotify.com', icon: 'spotify' }
      ],
      visibility: 'public',
      status: 'published',
      view_count: 1247,
      like_count: 89,
      hasLiked: false,
      isOwner: false
    },
    'fana-ke-rap-battle-glitters-and-golds': {
      id: 2,
      slug: 'fana-ke-rap-battle-glitters-and-golds',
      owner_wallet: 'DEMO_WALLET_ARTIST_2',
      owner_username: 'FanaKeBattles',
      title: 'Fana Ke Rap Battle: Glitters and Golds',
      subtitle: 'The legendary rap battle series from Kakuma',
      description: 'A rap battle competition bringing together the best lyricists from East African refugee camps.',
      content: `# Fana Ke Rap Battle: Glitters and Golds

> "Where words become weapons and stories become gold"

## About the Event

Fana Ke Rap Battle is more than just a competition - it's a platform for voices that need to be heard.

## Season Highlights

### Glitters Division
The emerging talent category, featuring first-time battlers.

### Golds Division
The championship tier, where seasoned veterans clash.

## Impact

- 50+ youth participants
- 10,000+ viewers across Africa
- 5 battlers signed to music labels`,
      category: 'music',
      tags: ['rap-battle', 'hip-hop', 'kakuma', 'competition'],
      cover_image: '/images/projects/fana-ke-cover.jpg',
      media_urls: [],
      links: [],
      visibility: 'public',
      status: 'published',
      view_count: 3421,
      like_count: 256,
      hasLiked: false,
      isOwner: false
    },
    'porefec': {
      id: 3,
      slug: 'porefec',
      owner_wallet: 'DEMO_WALLET_SCIENTIST_1',
      owner_username: 'SolarInnovator',
      title: 'POREFEC',
      subtitle: 'Portable Renewable Energy for Communities',
      description: 'Scientific research developing affordable solar energy solutions for refugee camps.',
      content: `# POREFEC - Portable Renewable Energy for Communities

## Executive Summary

POREFEC is an innovative research initiative focused on developing cost-effective, portable renewable energy systems.

## Research Objectives

1. **Affordability** - Reduce solar unit costs by 60%
2. **Portability** - Design systems that can be carried by one person
3. **Durability** - Create weather-resistant units lasting 10+ years

## Current Progress

### Phase 1: Research & Development ✅
- Completed materials analysis
- Prototype v1 tested

### Phase 2: Pilot Deployment 🔄
- 20 units deployed in Kakuma
- Performance monitoring ongoing`,
      category: 'science',
      tags: ['renewable-energy', 'solar', 'research', 'kakuma'],
      cover_image: '/images/projects/porefec-cover.jpg',
      media_urls: [],
      links: [],
      visibility: 'public',
      status: 'published',
      view_count: 892,
      like_count: 67,
      hasLiked: false,
      isOwner: false
    }
  };

  return samples[slug] || null;
}
