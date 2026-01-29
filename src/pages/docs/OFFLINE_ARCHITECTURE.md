---
layout: "../../layouts/DocLayout.astro"
title: "OFFLINE_ARCHITECTURE"
---
<div data-pagefind-filter="type:docs"></div>

# Offline-First Architecture
**WorldBridger One - Local Storage System**

## 🎯 Overview

This app now works **completely offline** using browser-based storage. No remote database required!

### Storage Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    USER DATA                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  localStorage │  │  IndexedDB   │  │  Web Crypto  │  │
│  │              │  │              │  │              │  │
│  │ • Preferences│  │ • Tracks     │  │ • Encryption │  │
│  │ • Settings   │  │ • Profiles   │  │ • Keys       │  │
│  │ • Theme      │  │ • NFTs       │  │ • Sensitive  │  │
│  │ • Wallet ID  │  │ • Activities │  │   Data       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│                  ┌──────────────┐                        │
│                  │ Export/Import│                        │
│                  │              │                        │
│                  │ • JSON Backup│                        │
│                  │ • Data Sync  │                        │
│                  └──────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Storage Breakdown

### localStorage (Simple Key-Value)
**Best for**: Settings, preferences, small data
**Size Limit**: ~5-10MB per domain

**What we store**:
- User preferences (theme, language, favorites)
- Notification settings
- Privacy settings
- Last wallet address
- UI state (collapsed sections, tab positions)
- Cache timestamps

**Example**:
```javascript
localStorage.setItem('wb_theme', 'space-invaders');
localStorage.setItem('wb_lastWallet', 'ABC123...');
localStorage.setItem('wb_preferences', JSON.stringify({
  favoriteAnimals: ['hippo', 'elephant', 'zebra'],
  musicPrefs: ['show-lyrics', 'auto-play']
}));
```

---

### IndexedDB (Structured Database)
**Best for**: Large datasets, structured data, queries
**Size Limit**: ~50MB-1GB+ (browser dependent)

**Database Schema**:

```javascript
// Database: worldbridger_local
// Version: 1

Stores:
├── user_profiles       // User profile data
├── tracks             // Music tracks
├── track_likes        // Track likes
├── track_plays        // Play history
├── battles            // Rap battles
├── observations       // Environmental data
├── courses            // Learning courses
├── enrollments        // Course enrollments
├── donations          // Donation records
├── nfts               // NFT collection
├── activities         // Activity log
└── sync_queue         // Pending syncs (optional)
```

**Object Store Structures**:

```javascript
// user_profiles
{
  walletAddress: "primary key",
  username: "string",
  email: "string (encrypted)",
  bio: "string",
  avatarUrl: "string",
  level: "number",
  xp: "number",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}

// tracks
{
  id: "auto-increment primary key",
  userWallet: "string (indexed)",
  title: "string",
  genre: "string (indexed)",
  audioFileUrl: "string or Blob",
  coverArtUrl: "string or Blob",
  lyrics: "string",
  plays: "number",
  likes: "number",
  status: "published|draft|scheduled",
  createdAt: "timestamp (indexed)"
}

// activities
{
  id: "auto-increment primary key",
  userWallet: "string (indexed)",
  activityType: "string (indexed)",
  description: "string",
  xpAwarded: "number",
  metadata: "object",
  createdAt: "timestamp (indexed)"
}
```

---

### Web Crypto API (Encryption)
**Best for**: Sensitive data protection

**What we encrypt**:
- Email addresses
- WhatsApp numbers
- Personal messages
- Private keys (if stored)
- Financial data

**Encryption Method**:
- Algorithm: AES-GCM (256-bit)
- Key derivation: PBKDF2
- Salt: Random per user
- IV: Random per encrypted value

**Example Flow**:
```javascript
// Generate encryption key from wallet address + salt
const key = await deriveKey(walletAddress, salt);

// Encrypt sensitive data
const encrypted = await encrypt(key, email);

// Store encrypted value
indexedDB.put('user_profiles', {
  walletAddress,
  encryptedEmail: encrypted
});
```

---

## 🏗️ Implementation Architecture

### Core Components

```
public/scripts/
├── local-storage-manager.js    # localStorage wrapper
├── local-db-manager.js          # IndexedDB wrapper
├── crypto-manager.js            # Encryption utilities
├── form-storage-adapter.js      # Form↔Storage bridge
└── data-export-import.js        # Backup/restore
```

### Storage Manager API

```javascript
// Initialize
await LocalDBManager.initialize();

// Create/Update
await LocalDBManager.saveProfile({
  walletAddress: 'ABC123...',
  username: 'kakuma_youth',
  level: 5,
  xp: 2500
});

// Read
const profile = await LocalDBManager.getProfile('ABC123...');

// Query
const myTracks = await LocalDBManager.getTracks({
  userWallet: 'ABC123...',
  status: 'published',
  orderBy: 'createdAt',
  limit: 20
});

// Delete
await LocalDBManager.deleteTrack(trackId);

// Export all data
const backup = await LocalDBManager.exportAllData();

// Import data
await LocalDBManager.importData(backup);
```

---

## 📝 Form Integration Pattern

### Before (Remote API):
```javascript
// OLD: Submit to remote database
async function submitTrack(formData) {
  const response = await fetch('/api/music/create-track', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
  return response.json();
}
```

### After (Local Storage):
```javascript
// NEW: Save to local database
async function submitTrack(formData) {
  const track = await LocalDBManager.saveTrack({
    userWallet: window.walletManager.connectedWallet,
    ...formData,
    id: Date.now(), // Simple ID generation
    plays: 0,
    likes: 0,
    createdAt: new Date().toISOString()
  });

  // Award XP locally
  await ProgressManager.awardXP(100, 'track_upload', 'Uploaded track');

  return { success: true, track };
}
```

---

## 🔐 Security Considerations

### Data Protection
1. **Encryption at Rest**
   - Sensitive fields encrypted before storage
   - Keys derived from wallet address
   - Never store raw private keys

2. **Access Control**
   - Wallet-based authentication
   - Data scoped to connected wallet
   - Cross-wallet isolation

3. **Data Validation**
   - Input sanitization
   - Type checking
   - Size limits enforced

### Privacy
- No telemetry without consent
- No data leaves browser (unless user exports)
- Clear data option available
- GDPR compliant (user owns all data)

---

## 💾 Storage Limits & Management

### Browser Quotas
| Storage Type | Chrome | Firefox | Safari |
|--------------|--------|---------|--------|
| localStorage | 10 MB  | 10 MB   | 5 MB   |
| IndexedDB    | 60% of disk | ~2 GB | ~1 GB |

### Quota Management
```javascript
// Check available storage
if (navigator.storage && navigator.storage.estimate) {
  const { usage, quota } = await navigator.storage.estimate();
  const percentUsed = (usage / quota) * 100;

  if (percentUsed > 80) {
    console.warn('Storage almost full! Consider exporting old data.');
  }
}
```

### Cleanup Strategies
1. **Auto-archive old data** (>6 months)
2. **Compress large blobs** (images, audio)
3. **Prompt user to export** when >80% full
4. **Clear play history** (keep aggregated stats only)

---

## 📤 Export/Import System

### Export Formats

**1. Full Backup (JSON)**
```json
{
  "version": "1.0.0",
  "exportDate": "2026-01-10T12:00:00Z",
  "walletAddress": "ABC123...",
  "data": {
    "profile": {...},
    "tracks": [...],
    "activities": [...],
    "nfts": [...],
    "settings": {...}
  }
}
```

**2. Selective Export**
- Export only tracks
- Export only profile
- Export date range
- Export specific collections

**3. Import Options**
- Merge with existing data
- Replace all data
- Import specific collections
- Resolve conflicts (keep newer)

### Export UI
```javascript
// Export button handler
async function exportUserData() {
  const data = await LocalDBManager.exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `worldbridger-backup-${Date.now()}.json`;
  a.click();
}
```

---

## 🔄 Optional: Cloud Sync

If you want to enable optional cloud sync later:

```javascript
// Save locally first
await LocalDBManager.saveTrack(track);

// Then sync to cloud (if online and user opted in)
if (navigator.onLine && userEnabledSync) {
  await SyncManager.queueForSync('tracks', track.id);
}
```

**Sync Queue**:
- Operations queued while offline
- Automatic retry on reconnect
- Conflict resolution (last-write-wins or user choice)
- Background sync API support

---

## 🧪 Testing Offline Features

### Simulating Offline Mode
```javascript
// Chrome DevTools: Network tab → Throttling → Offline

// Or programmatically:
window.addEventListener('offline', () => {
  console.log('App is offline - using local storage');
  showOfflineBanner();
});

window.addEventListener('online', () => {
  console.log('App is back online');
  hideOfflineBanner();
  // optionally trigger sync
});
```

### Testing Checklist
- [ ] Forms work offline
- [ ] Data persists across page reloads
- [ ] Wallet disconnect clears data (optional)
- [ ] Export creates valid JSON
- [ ] Import restores all data
- [ ] Storage quota warnings work
- [ ] Encryption/decryption successful
- [ ] Cross-tab sync (if implemented)

---

## 📊 Data Migration

If users already have data in remote DB:

```javascript
// One-time migration script
async function migrateFromRemote() {
  try {
    // Fetch all user data from remote API
    const remoteData = await fetch('/api/export-my-data').then(r => r.json());

    // Import into local storage
    await LocalDBManager.importData(remoteData);

    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
```

---

## 🎯 Benefits of Offline-First

✅ **No server required** - Works on localhost, file://, anywhere
✅ **Instant performance** - No network latency
✅ **Privacy first** - Data stays on user's device
✅ **Works anywhere** - No internet? No problem!
✅ **Lower costs** - No database hosting fees
✅ **User ownership** - Users control their data
✅ **Resilient** - Never loses data due to server issues

---

## 📚 Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| localStorage | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| Web Crypto | ✅ | ✅ | ✅ | ✅ |
| Storage API | ✅ | ✅ | ✅ | ✅ |

**Minimum Requirements**: Modern browser (2020+)

---

## 🚀 Next Steps

1. ✅ Create storage managers
2. ✅ Implement encryption
3. ✅ Update forms
4. ✅ Add export/import UI
5. ✅ Test offline functionality
6. ⏭️ (Optional) Add cloud sync

---

**Built with ❤️ for Kakuma Refugee Camp**
**Empowering youth through offline-first technology**
