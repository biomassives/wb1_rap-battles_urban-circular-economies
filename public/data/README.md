# WorldBridger One - Data Structure Documentation

This directory contains all structured data for WorldBridger One projects, organized for easy modification, event customization, and cross-platform deployment.

## Directory Structure

```
/public/data/
├── master/                          # Master templates and schemas
│   └── (Future: template files for new projects)
│
└── purple-point/                    # Purple Point project data
    ├── airdrops/                    # Airdrop reward system
    │   └── rewards.json             # 25 reward templates with scheduling
    │
    ├── projects/                    # Project definitions
    │   └── projects.json            # 5 core projects (Kakuma, Music, Learning, Battles, Achievements)
    │
    ├── calendar/                    # Educational calendar system
    │   └── event-domains.json       # Learning, Cultural, Artistic, Financial domains
    │
    └── live-events/                 # Live event sampler data
        ├── bars.json                # Rap bars and verses for performances
        ├── intros.json              # Event introductions and openings
        ├── announcements.json       # Award announcements and milestones
        └── vocal-fragments.json     # Vocal samples for live mixing
```

## Data Files Overview

### Airdrops (`purple-point/airdrops/`)

**rewards.json** - 25 airdrop reward templates
- Categories: artist_promotion, educational, mentorship, events
- Each reward includes: id, name, description, token amount, XP, requirements, start/end dates
- Use for: Reward scheduling, token distribution, gamification

### Projects (`purple-point/projects/`)

**projects.json** - 5 core project definitions
- Projects: Kakuma, Music, Learning, Battles, Achievements
- Each includes: id, name, icon, description, color, tags
- Use for: Project-Airdrop wheel, project navigation, promotional materials

### Calendar (`purple-point/calendar/`)

**event-domains.json** - Educational activity domains
- 4 Domains: Learning, Cultural, Artistic, Financial
- Each includes: categories, color schemes (primary/secondary/tertiary), icons
- Use for: Weekly calendar generation, activity categorization, visual coding

### Live Events (`purple-point/live-events/`)

**bars.json** - Rap bars and performance verses
- Types: opening, verse, hook, closing
- Includes: text, BPM, category, audio files, tags
- Use for: Live performances, battle events, promotional content

**intros.json** - Event introduction segments
- Includes: speaker, text, duration, mood, visual cues
- Use for: Event openings, transitions, MC scripts

**announcements.json** - Award and milestone announcements
- Types: award, milestone, battle-result, grant, recognition
- Includes: category, presenter, visual cues, duration
- Use for: Award ceremonies, milestone celebrations, recognition events

**vocal-fragments.json** - Vocal samples and stems
- Types: chant, spoken-word, melody, experimental, call-response, beatbox, traditional-chant, manifesto
- Includes: performer role, BPM, key, mood, stem files, usage guidelines
- Use for: Live event mixing, multimedia experiences, collaborative performances

## Usage Guidelines

### For Event Coordinators

1. **Event Customization**: Modify JSON files directly to update event details, rewards, or content
2. **New Events**: Duplicate and modify existing entries, update dates and descriptions
3. **Promotional Materials**: Export data to generate posters, social media content, announcements

### For Developers

1. **Fetch Data**: Use standard fetch() or Astro data loading
   ```javascript
   const rewards = await fetch('/data/purple-point/airdrops/rewards.json').then(r => r.json());
   ```

2. **Dynamic Loading**: Data files are served statically via Vercel for fast access

3. **Type Safety**: Consider generating TypeScript interfaces from JSON schemas

### For Editors

1. **Direct Editing**: JSON files can be edited directly for quick updates
2. **Validation**: Ensure JSON syntax is valid (use JSONLint or similar tools)
3. **Future Interface**: Admin UI will be built for easier editing without JSON knowledge

### For Performers

1. **Bars & Vocals**: Reference live-events files for performance content
2. **Audio Files**: Paths point to `/audio/` directory for actual audio assets
3. **Collaboration**: Stem files allow remixing and collaborative performances

## Data Schema Templates

### Reward Template
```json
{
  "id": "unique-id",
  "category": "artist_promotion|educational|mentorship|events",
  "name": "Display Name",
  "description": "Brief description",
  "reward": "X tokens",
  "xp": 0,
  "icon": "emoji",
  "requirements": ["requirement 1", "requirement 2"],
  "frequency": "Weekly|Bi-weekly|Monthly|Per event",
  "startDate": "YYYY-MM-DDTHH:mm:ssZ",
  "endDate": "YYYY-MM-DDTHH:mm:ssZ"
}
```

### Project Template
```json
{
  "id": "project-id",
  "name": "Project Name",
  "icon": "emoji",
  "description": "Short description",
  "fullDescription": "Detailed description",
  "color": "#hexcolor",
  "tags": ["tag1", "tag2"]
}
```

### Vocal Fragment Template
```json
{
  "id": "vocal-id",
  "type": "chant|spoken-word|melody|experimental|etc",
  "performer": "Performer Name",
  "text": "Actual text/lyrics",
  "duration": 0,
  "bpm": 0,
  "key": "musical key",
  "mood": "emotional quality",
  "useCase": ["use1", "use2"],
  "audioFile": "/path/to/audio.mp3",
  "stemFiles": {},
  "tags": ["tag1", "tag2"]
}
```

## Version Control

- All JSON files are version controlled via git
- Changes should be committed with clear messages
- For production: Create pull requests for review before merging

## Future Enhancements

1. **Admin Interface**: Web-based editor for non-technical users
2. **Multi-language Support**: Translations for international events
3. **Real-time Sync**: Live updates during events via WebSocket
4. **Analytics Integration**: Track which content performs best
5. **Auto-generation**: Tools to generate promotional materials from data

## Contributing

To add new data files or modify existing ones:
1. Follow the existing schema patterns
2. Validate JSON syntax
3. Test changes locally first
4. Submit pull request with clear description
5. Await review from project maintainers

## License

Data licensed under CC BY-SA 4.0 - Attribution required, share-alike
Audio assets subject to individual performer licensing

---

**Maintained by**: WorldBridger One Development Team
**Last Updated**: 2026-01-02
