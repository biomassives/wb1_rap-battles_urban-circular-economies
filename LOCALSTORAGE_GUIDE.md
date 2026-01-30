# localStorage & Local JSON Guide

## Overview

The app now supports **localStorage fallback** and **local JSON data** for testing and offline functionality. This allows the app to work even when database APIs are unavailable.

## How It Works

### 1. **localStorage Fallback System**

The app tries to load data in this order:
1. **API First** - Tries to fetch from database APIs
2. **localStorage Cache** - Falls back to cached data if API fails
3. **Default Data** - Creates default data if nothing is cached

### 2. **Data Storage Keys**

localStorage keys use this format:
- `progress_{walletAddress}` - User progress data (level, XP, achievements, etc.)
- `connectedWallet` - Currently connected wallet address

### 3. **XP Award System**

When you award XP:
1. **Online Mode**: Updates database via API → caches in localStorage
2. **Offline Mode**: Updates localStorage directly → syncs to database when online

## Testing the System

### Test Page

Visit `/test-local` to test localStorage functionality:

```
http://localhost:4321/test-local
```

Features on test page:
- ✅ Connect test wallet
- ✅ Award XP (+10, +50, +100, +500)
- ✅ Load sample JSON data
- ✅ View all localStorage
- ✅ Clear localStorage

### Sample Data Files

Located in `public/data/`:
- `sample-users.json` - Demo user profiles
- `sample-battles.json` - Demo battle data
- `sample-achievements.json` - Available achievements

## Using localStorage in Your Code

### Reading Progress Data

```javascript
// From BaseLayout.astro managers
const progress = window.progressManager?.currentProgress;
console.log(progress.progression.currentLevel); // Current level
console.log(progress.progression.totalXP); // Total XP
```

### Awarding XP

```javascript
// Award 50 XP for uploading a track
await window.progressManager?.awardXP(50, 'track_upload', 'Uploaded first track');

// This works online or offline!
```

### Manually Accessing localStorage

```javascript
// Get user progress
const walletAddress = window.walletManager?.connectedWallet;
const progress = JSON.parse(localStorage.getItem(`progress_${walletAddress}`));

// Update progress
progress.progression.totalXP += 100;
localStorage.setItem(`progress_${walletAddress}`, JSON.stringify(progress));
```

## Data Structure

### Progress Data Structure

```json
{
  "success": true,
  "progression": {
    "currentLevel": 1,
    "totalXP": 0,
    "lifeStage": "egg",
    "animalMentor": "chicken",
    "nextLevel": {
      "level": 2,
      "xpNeeded": 100,
      "percentComplete": 0
    }
  },
  "user": {
    "wallet_address": "TEST_WALLET_123",
    "username": "User_TEST_W",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "music": {
    "publishedTracks": 0,
    "battles": {
      "total": 0,
      "wins": 0,
      "losses": 0,
      "winRate": 0
    }
  },
  "environmental": {
    "coursesCompleted": 0,
    "projectsParticipated": 0
  },
  "nairobi-youthImpact": {
    "youthImpacted": 0,
    "totalActions": 0,
    "valueGenerated": 0
  },
  "achievements": {
    "total": 0,
    "unlocked": []
  },
  "recentActivity": [],
  "dailyWisdom": {
    "topic": "Getting Started",
    "wisdom_text": "Welcome to WorldBridger One!"
  }
}
```

## Level Progression Formula

```javascript
// XP to Level calculation
level = floor(sqrt(totalXP / 100)) + 1
maxLevel = 120

// Life Stages
1-10: Egg (Chicken mentor)
11-25: Chick (Goat/Cat mentor)
26-50: Juvenile (Pigeon mentor)
51-75: Adult (Dog mentor)
76+: Elder (Rabbit mentor)
```

## API Integration

### When APIs are Available

The app automatically uses the database APIs:
- `/api/gamification/user-progress` - Load user data
- `/api/gamification/award-xp` - Award XP
- `/api/nairobi-youth/user-impact` - Kakuma impact data

Data is cached in localStorage for offline access.

### When APIs are Unavailable

The app falls back to:
1. Cached localStorage data
2. Default empty state
3. Local XP calculations

## Security Notes

✅ **Safe to Use:**
- localStorage is domain-scoped (secure)
- No sensitive data stored (just game state)
- Wallet addresses are public keys (not private)

⚠️ **Important:**
- Never store private keys in localStorage
- localStorage can be cleared by user
- Not a replacement for database (just a cache)

## Development Workflow

### 1. Build the App

```bash
npm run build
```

### 2. Test Locally

Visit pages:
- `/test-local` - Test localStorage features
- `/progress` - See progress page with localStorage fallback
- `/nairobi-youth` - See Kakuma page with localStorage fallback

### 3. Connect Test Wallet

Click "Connect Wallet" button on any page - creates a test wallet and initializes localStorage.

### 4. Award XP

Use the test page or integrate XP awards in your features:

```javascript
// Example: Award XP when user uploads a track
await window.progressManager?.awardXP(
  50,
  'track_upload',
  'Uploaded track: Morning Vibes'
);
```

### 5. View Storage

Open browser DevTools → Application → Local Storage to see stored data.

## Next Steps

Once databases are connected:
1. ✅ localStorage will cache API responses
2. ✅ Offline changes sync when online
3. ✅ No code changes needed - it's automatic!

## Troubleshooting

**Q: XP not updating?**
- Check if wallet is connected
- Check browser console for errors
- Try clearing localStorage and reconnecting

**Q: Data disappeared?**
- User may have cleared browser data
- localStorage is per-domain/per-browser
- Database sync will restore data when connected

**Q: Want to reset progress?**
- Visit `/test-local`
- Click "Clear All localStorage"
- Reconnect wallet for fresh start

## Benefits

✅ Works offline
✅ No database needed for testing
✅ Fast (no network requests)
✅ Easy to debug
✅ Seamless API integration when ready
