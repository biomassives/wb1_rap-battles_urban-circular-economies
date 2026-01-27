# Offline Storage - Quick Reference
**WorldBridger One - Cheat Sheet**

---

## 🚀 Quick Start

### 1. Test the System
```bash
npm run dev
```
Visit: http://localhost:4321/offline-test

### 2. Open Browser Console
Press **F12** → **Console** tab

### 3. Check Storage Managers
```javascript
// All should be defined:
console.log(window.cryptoManager);  // ✅ Encryption
console.log(window.localStore);     // ✅ localStorage
console.log(window.localDB);        // ✅ IndexedDB
console.log(window.formAdapter);    // ✅ Form bridge
```

---

## 📝 Common Operations

### Save Profile
```javascript
await window.formAdapter.submitProfile({
  username: 'myname',
  email: 'me@example.com',
  bio: 'My bio'
});
```

### Upload Track
```javascript
await window.formAdapter.submitTrack({
  title: 'My Track',
  genre: 'rap',
  audioFileUrl: 'https://example.com/track.mp3',
  lyrics: 'My lyrics...'
});
```

### Get User Data
```javascript
const wallet = window.walletManager?.connectedWallet;

// Profile
const profile = await window.localDB.getProfile(wallet);

// Tracks
const tracks = await window.localDB.getTracks({ userWallet: wallet });

// Activities
const activities = await window.localDB.getActivities(wallet);
```

### Like/Play Track
```javascript
// Like
await window.formAdapter.likeTrack(trackId);

// Play
await window.formAdapter.playTrack(trackId);
```

### Export/Import
```javascript
// Export
await window.formAdapter.exportUserData();

// Import (shows file picker)
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json';
fileInput.onchange = async (e) => {
  await window.formAdapter.importUserData(e.target.files[0]);
};
fileInput.click();
```

---

## 🔐 Encryption

### Encrypt Data
```javascript
const wallet = window.walletManager?.connectedWallet;
const encrypted = await window.cryptoManager.encrypt(wallet, 'secret');
```

### Decrypt Data
```javascript
const decrypted = await window.cryptoManager.decrypt(wallet, encrypted);
```

---

## 💾 LocalStorage

### Preferences
```javascript
// Save
window.localStore.savePreferences({
  theme: 'dark',
  favoriteAnimals: ['hippo']
});

// Get
const prefs = window.localStore.getPreferences();
```

### Cache
```javascript
// Set cache (60 min TTL)
window.localStore.setCache('mykey', data, 60);

// Get cache
const cached = window.localStore.getCache('mykey');
```

---

## 🗄️ IndexedDB Direct Access

### Profiles
```javascript
await window.localDB.saveProfile({ walletAddress, username, xp, level });
const profile = await window.localDB.getProfile(walletAddress);
```

### Tracks
```javascript
await window.localDB.saveTrack({ userWallet, title, genre, ... });
const track = await window.localDB.getTrack(trackId);
const tracks = await window.localDB.getTracks({ userWallet, genre, limit: 10 });
await window.localDB.deleteTrack(trackId);
```

### Interactions
```javascript
await window.localDB.likeTrack(trackId, userWallet);
await window.localDB.playTrack(trackId, userWallet);
```

---

## 📊 Storage Info

### Check Usage
```javascript
// localStorage
const info = window.localStore.getStorageInfo();
console.log(`${info.sizeMB} MB (${info.percentUsed}%)`);

// IndexedDB
const { usage, quota } = await navigator.storage.estimate();
console.log(`${(usage/1024/1024).toFixed(2)} MB available`);
```

---

## 🗑️ Clear Data

### Clear Everything
```javascript
await window.localDB.clearAllData();
window.localStore.clearAll();
```

### Clear Specific Store
```javascript
// Profiles only
const tx = window.localDB.db.transaction(['user_profiles'], 'readwrite');
await tx.objectStore('user_profiles').clear();
```

---

## 🧪 Debugging

### View in DevTools
1. **F12** → **Application** tab
2. **Storage** → **Local Storage** → http://localhost:4321
3. **Storage** → **IndexedDB** → worldbridger_local

### Console Logging
```javascript
// Enable detailed logs
localStorage.setItem('debug', 'true');

// View all localStorage
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(key, localStorage.getItem(key));
}
```

---

## 🌐 Offline Detection

```javascript
// Listen for status changes
window.addEventListener('offline', () => {
  console.log('📴 Offline');
});

window.addEventListener('online', () => {
  console.log('🌐 Online');
});

// Check current status
console.log(navigator.onLine ? 'Online' : 'Offline');
```

---

## ⚡ Performance Tips

### Batch Operations
```javascript
// Good: Single transaction
const tracks = [track1, track2, track3];
for (const track of tracks) {
  await window.localDB.saveTrack(track);
}

// Better: Use transaction for multiple ops
const tx = window.localDB.db.transaction(['tracks'], 'readwrite');
const store = tx.objectStore('tracks');
tracks.forEach(track => store.put(track));
```

### Query Optimization
```javascript
// Use indexes
const tracks = await window.localDB.getTracks({
  userWallet: wallet,  // Uses index
  genre: 'rap',       // Uses index
  limit: 20           // Limits results
});
```

---

## 🔧 Troubleshooting

### Manager Not Defined
```javascript
// Wait for managers to load
async function waitForManagers() {
  while (!window.localDB?.db) {
    await new Promise(r => setTimeout(r, 100));
  }
}
await waitForManagers();
```

### Wallet Not Connected
```javascript
// Check wallet
if (!window.walletManager?.connectedWallet) {
  alert('Please connect wallet first');
  return;
}
```

### Encryption Failed
```javascript
// Use same wallet for encrypt/decrypt
const wallet = 'ABC123...';
const encrypted = await window.cryptoManager.encrypt(wallet, data);
const decrypted = await window.cryptoManager.decrypt(wallet, encrypted);
```

---

## 📚 Documentation

- **Full Docs**: `OFFLINE_ARCHITECTURE.md`
- **Quick Start**: `OFFLINE_QUICK_START.md`
- **Summary**: `OFFLINE_IMPLEMENTATION_SUMMARY.md`
- **This File**: `OFFLINE_QUICK_REFERENCE.md`

---

## 🎯 Common Form Patterns

### Basic Form Submit
```javascript
document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  try {
    await window.formAdapter.submitProfile(data);
    alert('Saved!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
});
```

### With Validation
```javascript
async function handleSubmit(e) {
  e.preventDefault();

  // Get wallet
  const wallet = window.walletManager?.connectedWallet;
  if (!wallet) {
    alert('Connect wallet first');
    return;
  }

  // Collect data
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  // Validate
  if (!data.title || data.title.length < 3) {
    alert('Title too short');
    return;
  }

  // Submit
  try {
    const result = await window.formAdapter.submitTrack(data);
    alert(`Success! +${result.xpAwarded} XP`);
  } catch (error) {
    console.error(error);
    alert('Error: ' + error.message);
  }
}
```

---

**Need help? Check the full docs or visit /offline-test**
