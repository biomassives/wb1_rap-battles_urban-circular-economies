# API Endpoints Needed for Front-End UX
**WorldBridger One - Complete API Reference**

## Status Legend
- ✅ **Implemented** - Endpoint exists and working
- 🟡 **Partial** - Endpoint exists but needs enhancement
- ❌ **Missing** - Needs to be created

---

## 1. User & Profile Management

### ✅ GET `/api/profile/get`
**Status**: Implemented (from API_REFERENCE.md)
**Purpose**: Get user profile by wallet address
**Query Params**:
- `walletAddress` (required)

**Response**:
```json
{
  "success": true,
  "profile": {
    "wallet_address": "...",
    "username": "...",
    "email": "...",
    "bio": "...",
    "avatar_url": "...",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### ✅ POST `/api/profile/upsert`
**Status**: Implemented
**Purpose**: Create or update user profile
**Body**:
```json
{
  "walletAddress": "...",
  "username": "...",
  "email": "...",
  "bio": "...",
  "avatarUrl": "...",
  "location": "...",
  "notificationSettings": {}
}
```

### ❌ POST `/api/profile/upload-avatar`
**Status**: Missing
**Purpose**: Upload profile avatar image
**Body**: FormData with image file
**Response**:
```json
{
  "success": true,
  "avatarUrl": "https://...",
  "message": "Avatar uploaded successfully"
}
```

### ❌ GET `/api/profile/stats`
**Status**: Missing
**Purpose**: Get user's complete statistics
**Query Params**:
- `walletAddress` (required)

**Response**:
```json
{
  "success": true,
  "stats": {
    "totalXP": 1250,
    "level": 12,
    "tracksPublished": 8,
    "battlesWon": 5,
    "battlesLost": 2,
    "projectsParticipated": 3,
    "achievementsUnlocked": 15,
    "nftsOwned": 3
  }
}
```

---

## 2. XP & Progression System

### ❌ GET `/api/gamification/user-progress`
**Status**: Missing
**Purpose**: Get user's complete XP and progression data
**Query Params**:
- `walletAddress` (required)

**Response**:
```json
{
  "success": true,
  "progression": {
    "totalXP": 1250,
    "currentLevel": 12,
    "xpToNextLevel": 250,
    "rank": "OFFICER"
  },
  "music": {
    "publishedTracks": 8,
    "battles": {
      "total": 7,
      "wins": 5,
      "losses": 2
    }
  },
  "environmental": {
    "projectsParticipated": 3,
    "observationsSubmitted": 12
  },
  "recentActivity": [...]
}
```

### ❌ POST `/api/gamification/award-xp`
**Status**: Missing
**Purpose**: Award XP to user for an activity
**Body**:
```json
{
  "walletAddress": "...",
  "amount": 100,
  "activityType": "track_upload",
  "description": "Uploaded new track"
}
```

**Response**:
```json
{
  "success": true,
  "newTotalXP": 1350,
  "leveledUp": false,
  "newLevel": 12,
  "achievementsUnlocked": []
}
```

### ❌ GET `/api/gamification/leaderboard`
**Status**: Missing
**Purpose**: Get leaderboard rankings
**Query Params**:
- `type` (xp, battles, projects, etc.)
- `limit` (default: 100)
- `offset` (default: 0)

**Response**:
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "walletAddress": "...",
      "username": "...",
      "value": 5000,
      "avatarUrl": "..."
    }
  ]
}
```

---

## 3. Achievements System

### ❌ GET `/api/achievements/all`
**Status**: Missing
**Purpose**: Get all available achievements
**Response**:
```json
{
  "success": true,
  "achievements": [
    {
      "id": "first_steps",
      "name": "First Steps",
      "description": "Created your wallet",
      "icon": "⭐",
      "xpReward": 200,
      "category": "account"
    }
  ]
}
```

### ❌ GET `/api/achievements/user`
**Status**: Missing
**Purpose**: Get user's unlocked achievements
**Query Params**:
- `walletAddress` (required)

**Response**:
```json
{
  "success": true,
  "unlocked": [
    {
      "achievementId": "first_steps",
      "unlockedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "totalUnlocked": 15,
  "totalAvailable": 50
}
```

---

## 4. Music & Tracks

### ❌ POST `/api/music/create-track`
**Status**: Missing
**Purpose**: Create/upload a new track
**Body**:
```json
{
  "walletAddress": "...",
  "title": "My Track",
  "genre": "rap",
  "audioFileUrl": "https://...",
  "coverArtUrl": "https://...",
  "lyrics": "...",
  "description": "...",
  "isCollaboration": false,
  "collaborators": [],
  "mintAsNft": false
}
```

**Response**:
```json
{
  "success": true,
  "trackId": "track_123",
  "xpAwarded": 100,
  "message": "Track created successfully"
}
```

### ❌ GET `/api/music/user-tracks`
**Status**: Missing
**Purpose**: Get user's published tracks
**Query Params**:
- `walletAddress` (required)
- `status` (published, draft, all)

**Response**:
```json
{
  "success": true,
  "tracks": [
    {
      "trackId": "track_123",
      "title": "My Track",
      "genre": "rap",
      "audioUrl": "...",
      "coverArtUrl": "...",
      "plays": 247,
      "likes": 89,
      "comments": 23,
      "createdAt": "..."
    }
  ]
}
```

### ❌ GET `/api/music/track/:id`
**Status**: Missing
**Purpose**: Get single track details
**Response**:
```json
{
  "success": true,
  "track": {
    "trackId": "track_123",
    "title": "...",
    "artist": "...",
    "audioUrl": "...",
    "waveform": [...],
    "lyrics": "...",
    "stats": {}
  }
}
```

### ❌ POST `/api/music/track/:id/play`
**Status**: Missing
**Purpose**: Increment play count
**Response**:
```json
{
  "success": true,
  "newPlayCount": 248
}
```

### ❌ POST `/api/music/track/:id/like`
**Status**: Missing
**Purpose**: Like/unlike a track
**Response**:
```json
{
  "success": true,
  "liked": true,
  "newLikeCount": 90
}
```

---

## 5. Rap Battles

### ❌ POST `/api/music/create-battle`
**Status**: Missing
**Purpose**: Create a rap battle challenge
**Body**:
```json
{
  "challengerAddress": "...",
  "opponentAddress": "...",
  "category": "conscious",
  "rounds": 3,
  "barsPerRound": 16,
  "timeLimit": "48h",
  "stake": 100,
  "stakeCurrency": "XP"
}
```

**Response**:
```json
{
  "success": true,
  "battleId": "battle_123",
  "status": "pending",
  "expiresAt": "..."
}
```

### ❌ GET `/api/music/battles`
**Status**: Missing
**Purpose**: Get battles (filter by status, category, user)
**Query Params**:
- `status` (pending, active, voting, completed)
- `category` (conscious, wordplay, flow, etc.)
- `walletAddress` (optional - filter by user)

**Response**:
```json
{
  "success": true,
  "battles": [
    {
      "battleId": "battle_123",
      "challenger": "...",
      "opponent": "...",
      "category": "conscious",
      "status": "active",
      "rounds": 3,
      "currentRound": 1
    }
  ]
}
```

### ❌ GET `/api/music/battle/:id`
**Status**: Missing
**Purpose**: Get single battle details
**Response**:
```json
{
  "success": true,
  "battle": {
    "battleId": "...",
    "participants": [],
    "submissions": [],
    "votes": [],
    "winner": null,
    "status": "active"
  }
}
```

### ❌ POST `/api/music/battle/:id/submit`
**Status**: Missing
**Purpose**: Submit verse to battle
**Body**:
```json
{
  "walletAddress": "...",
  "round": 1,
  "audioUrl": "...",
  "lyrics": "..."
}
```

### ❌ POST `/api/music/battle/:id/vote`
**Status**: Missing
**Purpose**: Vote on battle
**Body**:
```json
{
  "voterAddress": "...",
  "winnerId": "..."
}
```

---

## 6. Environmental Projects

### ❌ GET `/api/environmental/projects`
**Status**: Missing
**Purpose**: Get all eco projects
**Query Params**:
- `status` (active, completed, all)
- `category` (reforestation, water, recycling, etc.)

**Response**:
```json
{
  "success": true,
  "projects": [
    {
      "projectId": "proj_123",
      "name": "Youth Forest Initiative",
      "category": "reforestation",
      "status": "active",
      "participants": 43,
      "impact": {
        "treesPlanted": 127,
        "co2Offset": "2.5 tons"
      }
    }
  ]
}
```

### ❌ GET `/api/environmental/project/:id`
**Status**: Missing
**Purpose**: Get single project details
**Response**:
```json
{
  "success": true,
  "project": {
    "projectId": "...",
    "name": "...",
    "description": "...",
    "goals": [],
    "progress": 67,
    "participants": [],
    "updates": []
  }
}
```

### ❌ POST `/api/environmental/submit-observation`
**Status**: Missing
**Purpose**: Submit environmental observation
**Body**:
```json
{
  "walletAddress": "...",
  "projectId": "...",
  "observationType": "temperature",
  "measurement": 28.5,
  "unit": "°C",
  "location": "...",
  "datetime": "...",
  "weatherConditions": "sunny",
  "notes": "...",
  "photos": []
}
```

**Response**:
```json
{
  "success": true,
  "observationId": "obs_123",
  "xpAwarded": 75
}
```

### ❌ GET `/api/environmental/user-observations`
**Status**: Missing
**Purpose**: Get user's submitted observations
**Query Params**:
- `walletAddress` (required)

---

## 7. Urban & Coastal Youth Impact

### ✅ GET `/api/nairobi-youth/programs`
**Status**: Implemented
**Purpose**: Get youth programs (Nairobi + Lamu)
**Query Params**:
- `status` (active, completed, all)
- `category` (tech, arts, enterprise, health, education, environment)

**Response**:
```json
{
  "success": true,
  "programs": [
    {
      "id": "street-poets-nairobi",
      "title": "Street Poets Youth Empowerment",
      "category": "arts",
      "location": "Nairobi, Kenya",
      "leader": "Fana Ke"
    }
  ],
  "total": 8
}
```

### ✅ GET `/api/nairobi-youth/global-stats`
**Status**: Implemented
**Purpose**: Get overall impact statistics
**Response**:
```json
{
  "success": true,
  "stats": {
    "totalYouth": 2450,
    "totalValue": 125000,
    "activePrograms": 12
  },
  "communities": [
    { "name": "Kibera", "youth_reached": 680 }
  ]
}
```

### ✅ GET `/api/nairobi-youth/user-impact`
**Status**: Implemented
**Purpose**: Get user's youth program impact statistics
**Query Params**:
- `walletAddress` (required)

**Response**:
```json
{
  "success": true,
  "walletAddress": "...",
  "youthImpacted": 15,
  "totalActions": 25,
  "valueGenerated": 500,
  "programsSupported": 3,
  "badges": []
}
```

---

## 8. NFT Operations (Already Created)

### ✅ GET `/api/nft/owned`
**Status**: Implemented

### ✅ POST `/api/nft/transfer`
**Status**: Implemented

### ✅ POST `/api/nft/list-for-sale`
**Status**: Implemented

### ✅ POST `/api/nft/mint`
**Status**: Implemented (needs Metaplex SDK)

### ❌ GET `/api/nft/marketplace-listings`
**Status**: Missing
**Purpose**: Get all NFTs listed for sale

### ❌ POST `/api/nft/buy`
**Status**: Missing
**Purpose**: Purchase NFT from marketplace

---

## 9. Activity Feed

### ❌ GET `/api/activity/feed`
**Status**: Missing
**Purpose**: Get user's activity feed
**Query Params**:
- `walletAddress` (required)
- `limit` (default: 20)
- `offset` (default: 0)

**Response**:
```json
{
  "success": true,
  "activities": [
    {
      "activityId": "...",
      "type": "track_upload",
      "description": "Uploaded new track",
      "xpAwarded": 100,
      "timestamp": "..."
    }
  ]
}
```

---

## 10. Search & Discovery

### ❌ GET `/api/search`
**Status**: Missing
**Purpose**: Universal search across tracks, users, projects
**Query Params**:
- `q` (search query)
- `type` (tracks, users, projects, all)
- `limit` (default: 20)

---

## Priority Implementation Order

### Phase 1: Core User System (Week 1)
1. ❌ `POST /api/profile/upload-avatar`
2. ❌ `GET /api/profile/stats`
3. ❌ `GET /api/gamification/user-progress`
4. ❌ `POST /api/gamification/award-xp`
5. ❌ `GET /api/activity/feed`

### Phase 2: Content Creation (Week 2)
6. ❌ `POST /api/music/create-track`
7. ❌ `GET /api/music/user-tracks`
8. ❌ `GET /api/music/track/:id`
9. ❌ `POST /api/music/track/:id/play`
10. ❌ `POST /api/music/track/:id/like`

### Phase 3: Battles & Engagement (Week 3)
11. ❌ `POST /api/music/create-battle`
12. ❌ `GET /api/music/battles`
13. ❌ `GET /api/music/battle/:id`
14. ❌ `POST /api/music/battle/:id/submit`
15. ❌ `POST /api/music/battle/:id/vote`

### Phase 4: Environmental & Youth Impact (Week 4)
16. ❌ `GET /api/environmental/projects`
17. ❌ `POST /api/environmental/submit-observation`
18. ✅ `GET /api/nairobi-youth/programs`
19. ✅ `GET /api/nairobi-youth/global-stats`
20. ✅ `GET /api/nairobi-youth/user-impact`

### Phase 5: Achievements & Leaderboards (Week 5)
21. ❌ `GET /api/achievements/all`
22. ❌ `GET /api/achievements/user`
23. ❌ `GET /api/gamification/leaderboard`

---

## Database Schema Needed

For these endpoints to work, we need these tables:

1. **users** (wallet_address, username, email, bio, avatar_url, xp, level, created_at)
2. **user_progress** (user_id, total_xp, current_level, rank, stats_json)
3. **tracks** (track_id, user_id, title, genre, audio_url, cover_art_url, lyrics, plays, likes, created_at)
4. **battles** (battle_id, challenger_id, opponent_id, category, status, rounds, created_at)
5. **battle_submissions** (submission_id, battle_id, user_id, round, audio_url, lyrics, submitted_at)
6. **projects** (project_id, name, category, description, status, goals, progress, created_at)
7. **observations** (observation_id, user_id, project_id, type, measurement, location, datetime, created_at)
8. **donations** (donation_id, user_id, project_id, amount, currency, anonymous, created_at)
9. **achievements** (achievement_id, name, description, icon, xp_reward, category)
10. **user_achievements** (user_id, achievement_id, unlocked_at)
11. **activity_log** (activity_id, user_id, activity_type, description, xp_awarded, created_at)

---

**Let's start implementing! Which phase should we tackle first?**
