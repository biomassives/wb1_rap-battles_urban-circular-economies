-- Add user_projects table for artist/scientist public project pages
-- Supports URLs like /projects/pain-in-the-ghetto, /projects/porefec, etc.

CREATE TABLE IF NOT EXISTS user_projects (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,  -- URL-friendly identifier (e.g., 'pain-in-the-ghetto')
  owner_wallet VARCHAR(44) NOT NULL,  -- Creator's Solana wallet address
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(500),
  description TEXT,  -- Short description for previews
  content TEXT,  -- Full rich content (markdown supported)
  category VARCHAR(100) NOT NULL DEFAULT 'general',  -- 'music', 'science', 'art', 'technology', 'environment', etc.
  tags TEXT[],  -- Array of tags for discovery
  cover_image TEXT,  -- Main cover image URL
  media_urls JSONB DEFAULT '[]',  -- Array of media items [{type: 'image'|'video'|'audio', url: '...', caption: '...'}]
  links JSONB DEFAULT '[]',  -- External links [{title: '...', url: '...', icon: '...'}]
  collaborators JSONB DEFAULT '[]',  -- Array of collaborator wallet addresses or usernames
  visibility VARCHAR(20) DEFAULT 'public',  -- 'public', 'unlisted', 'private'
  featured BOOLEAN DEFAULT FALSE,  -- Featured on homepage/discovery
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft',  -- 'draft', 'published', 'archived'
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_projects_slug ON user_projects(slug);
CREATE INDEX IF NOT EXISTS idx_user_projects_owner ON user_projects(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_user_projects_category ON user_projects(category);
CREATE INDEX IF NOT EXISTS idx_user_projects_visibility ON user_projects(visibility);
CREATE INDEX IF NOT EXISTS idx_user_projects_status ON user_projects(status);
CREATE INDEX IF NOT EXISTS idx_user_projects_featured ON user_projects(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_projects_published ON user_projects(published_at DESC) WHERE status = 'published';

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_projects_updated_at_trigger ON user_projects;
CREATE TRIGGER user_projects_updated_at_trigger
  BEFORE UPDATE ON user_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_user_projects_updated_at();

-- Project likes table for tracking who liked what
CREATE TABLE IF NOT EXISTS user_project_likes (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES user_projects(id) ON DELETE CASCADE,
  wallet_address VARCHAR(44) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_project_likes_project ON user_project_likes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_wallet ON user_project_likes(wallet_address);

-- Sample projects for demonstration
INSERT INTO user_projects (
  slug,
  owner_wallet,
  title,
  subtitle,
  description,
  content,
  category,
  tags,
  cover_image,
  media_urls,
  links,
  visibility,
  status,
  published_at
) VALUES
  (
    'pain-in-the-ghetto',
    'DEMO_WALLET_ARTIST_1',
    'Pain in the Ghetto',
    'A musical journey through urban struggles and hope',
    'An album project exploring the realities of life in marginalized communities, combining hip-hop, soul, and spoken word to tell authentic stories of resilience.',
    E'# Pain in the Ghetto\n\nThis project was born from the streets, from the stories that never get told on mainstream platforms.\n\n## The Vision\n\nWe wanted to create something raw and real - music that speaks to the experience of growing up in communities that are often overlooked.\n\n## Track List\n\n1. **Dawn** - Waking up to another day of struggle\n2. **Concrete Dreams** - Finding hope in unexpected places\n3. **Mama''s Prayer** - Dedicated to the mothers who sacrifice everything\n4. **Rise** - The anthem of resilience\n\n## Collaborators\n\nThis project features voices from Kakuma Refugee Camp, Nairobi, and beyond.',
    'music',
    ARRAY['hip-hop', 'soul', 'kakuma', 'social-justice', 'album'],
    '/images/projects/pain-in-the-ghetto-cover.jpg',
    '[{"type": "audio", "url": "/audio/pain-preview.mp3", "caption": "Album Preview"}, {"type": "image", "url": "/images/projects/pig-studio.jpg", "caption": "Recording session"}]',
    '[{"title": "Spotify", "url": "https://spotify.com", "icon": "spotify"}, {"title": "SoundCloud", "url": "https://soundcloud.com", "icon": "soundcloud"}]',
    'public',
    'published',
    NOW()
  ),
  (
    'fana-ke-rap-battle-glitters-and-golds',
    'DEMO_WALLET_ARTIST_2',
    'Fana Ke Rap Battle: Glitters and Golds',
    'The legendary rap battle series from Kakuma',
    'A rap battle competition bringing together the best lyricists from East African refugee camps, showcasing raw talent and powerful storytelling.',
    E'# Fana Ke Rap Battle: Glitters and Golds\n\n> "Where words become weapons and stories become gold"\n\n## About the Event\n\nFana Ke Rap Battle is more than just a competition - it''s a platform for voices that need to be heard. Started in Kakuma Refugee Camp, this battle series has grown into a movement.\n\n## Season Highlights\n\n### Glitters Division\nThe emerging talent category, featuring first-time battlers who are discovering their voice.\n\n### Golds Division\nThe championship tier, where seasoned veterans clash with complex wordplay and deep narratives.\n\n## Impact\n\n- 50+ youth participants\n- 10,000+ viewers across Africa\n- 5 battlers signed to music labels\n- Countless stories shared and heard',
    'music',
    ARRAY['rap-battle', 'hip-hop', 'kakuma', 'competition', 'live-event'],
    '/images/projects/fana-ke-cover.jpg',
    '[{"type": "video", "url": "/video/fana-ke-highlights.mp4", "caption": "Season 3 Highlights"}, {"type": "image", "url": "/images/projects/fana-ke-crowd.jpg", "caption": "The crowd at Finals Night"}]',
    '[{"title": "YouTube", "url": "https://youtube.com", "icon": "youtube"}, {"title": "Instagram", "url": "https://instagram.com", "icon": "instagram"}]',
    'public',
    'published',
    NOW()
  ),
  (
    'porefec',
    'DEMO_WALLET_SCIENTIST_1',
    'POREFEC',
    'Portable Renewable Energy for Communities',
    'A scientific research project developing affordable, portable solar energy solutions for refugee camps and rural communities.',
    E'# POREFEC - Portable Renewable Energy for Communities\n\n## Executive Summary\n\nPOREFEC is an innovative research initiative focused on developing cost-effective, portable renewable energy systems specifically designed for displaced communities and rural areas with limited infrastructure.\n\n## Research Objectives\n\n1. **Affordability** - Reduce solar unit costs by 60%\n2. **Portability** - Design systems that can be carried by one person\n3. **Durability** - Create weather-resistant units lasting 10+ years\n4. **Accessibility** - Enable maintenance by local technicians\n\n## Current Progress\n\n### Phase 1: Research & Development ✅\n- Completed materials analysis\n- Prototype v1 tested in field conditions\n- Community feedback incorporated\n\n### Phase 2: Pilot Deployment 🔄\n- 20 units deployed in Kakuma\n- Performance monitoring ongoing\n- Training local technicians\n\n### Phase 3: Scale Manufacturing 📋\n- Partnership with local manufacturers\n- Cost optimization strategies\n- Distribution network planning\n\n## Impact Metrics\n\n| Metric | Target | Current |\n|--------|--------|---------|\n| Households Powered | 1,000 | 150 |\n| CO2 Avoided (tons) | 500 | 75 |\n| Jobs Created | 50 | 12 |\n| Training Graduates | 200 | 45 |',
    'science',
    ARRAY['renewable-energy', 'solar', 'research', 'kakuma', 'sustainability', 'engineering'],
    '/images/projects/porefec-cover.jpg',
    '[{"type": "image", "url": "/images/projects/porefec-prototype.jpg", "caption": "POREFEC Prototype v2"}, {"type": "image", "url": "/images/projects/porefec-field-test.jpg", "caption": "Field testing in Kakuma"}]',
    '[{"title": "Research Paper", "url": "/papers/porefec-whitepaper.pdf", "icon": "document"}, {"title": "GitHub", "url": "https://github.com", "icon": "github"}]',
    'public',
    'published',
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE user_projects IS 'User-created project pages for artists, scientists, and creators';
COMMENT ON COLUMN user_projects.slug IS 'URL-friendly unique identifier used in /projects/[slug] routes';
COMMENT ON COLUMN user_projects.content IS 'Full project content supporting Markdown formatting';
COMMENT ON COLUMN user_projects.media_urls IS 'Array of media objects with type, url, and caption';
COMMENT ON COLUMN user_projects.visibility IS 'public = listed everywhere, unlisted = accessible via direct link, private = owner only';
