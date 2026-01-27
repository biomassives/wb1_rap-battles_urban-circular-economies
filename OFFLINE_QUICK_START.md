# Offline-First Quick Start Guide
**WorldBridger One - Local Storage System**

## 🎯 What Changed?

Your app now works **100% offline**! No server or database required.

All data is stored in your browser using:
- **localStorage** - Settings, preferences
- **IndexedDB** - Tracks, profiles, activities
- **Web Crypto** - Encrypted sensitive data

---

## ✅ What Works Offline

Everything! Including:
- ✅ Create and manage user profiles
- ✅ Upload and play music tracks
- ✅ Like and play tracks
- ✅ Create rap battles
- ✅ Submit environmental observations
- ✅ Enroll in courses
- ✅ Make donations (recorded locally)
- ✅ Manage NFTs
- ✅ Earn and track XP
- ✅ Export/import all your data

---

## 🚀 Quick Test

### 1. Open the app in your browser
```bash
npm run dev
```

Visit: http://localhost:4321

### 2. Connect your wallet
Click "CONNECT WALLET" and generate or import a wallet.

### 3. Create a profile
```javascript
// In browser console:
await window.formAdapter.submitProfile({
  username: 'test_user',
  email: 'test@example.com',
  bio: 'Testing offline storage!'
});
```

### 4. Upload a track
```javascript
await window.formAdapter.submitTrack({
  title: 'My First Offline Track',
  genre: 'rap',
  audioFileUrl: 'https://example.com/track.mp3',
  lyrics: 'This is stored locally!',
  coverArtUrl: 'https://example.com/cover.png'
});
```

### 5. Check your data
```javascript
// Get profile
const profile = await window.localDB.getProfile(walletAddress);
console.log('Profile:', profile);

// Get tracks
const tracks = await window.localDB.getTracks({ userWallet: walletAddress });
console.log('Tracks:', tracks);

// Get activities
const activities = await window.localDB.getActivities(walletAddress);
console.log('Activities:', activities);
```

---

## 📁 Storage Managers

### Crypto Manager (`window.cryptoManager`)
```javascript
// Encrypt sensitive data
const encrypted = await window.cryptoManager.encrypt(walletAddress, 'sensitive data');

// Decrypt
const decrypted = await window.cryptoManager.decrypt(walletAddress, encrypted);
```

### LocalStorage Manager (`window.localStore`)
```javascript
// Save preferences
window.localStore.savePreferences({
  theme: 'dark',
  favoriteAnimals: ['hippo', 'elephant']
});

// Get preferences
const prefs = window.localStore.getPreferences();
```

### IndexedDB Manager (`window.localDB`)
```javascript
// Save profile
await window.localDB.saveProfile({
  walletAddress: '...',
  username: 'myname',
  xp: 500,
  level: 5
});

// Get tracks
const tracks = await window.localDB.getTracks({
  userWallet: walletAddress,
  genre: 'rap',
  limit: 10
});

// Like a track
await window.localDB.likeTrack(trackId, walletAddress);

// Play a track
await window.localDB.playTrack(trackId, walletAddress);
```

### Form Adapter (`window.formAdapter`)
```javascript
// Submit forms (handles XP, validation, etc.)
await window.formAdapter.submitProfile(formData);
await window.formAdapter.submitTrack(formData);
await window.formAdapter.submitObservation(formData);
await window.formAdapter.enrollCourse(courseId);
await window.formAdapter.submitDonation(formData);
```

---

## 📤 Export/Import Data

### Export All Data
```javascript
// Export all user data as JSON
await window.formAdapter.exportUserData();
// Downloads: worldbridger-backup-{timestamp}.json
```

### Import Data
```javascript
// Import from file
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json';
fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  await window.formAdapter.importUserData(file);
};
fileInput.click();
```

---

## 🗑️ Clear Data

### Clear all app data
```javascript
// Clear IndexedDB
await window.localDB.clearAllData();

// Clear localStorage
window.localStore.clearAll();

console.log('✅ All data cleared');
```

---

## 🔍 Inspect Storage

### Check storage usage
```javascript
// localStorage info
const info = window.localStore.getStorageInfo();
console.log(`Using ${info.sizeMB} MB (${info.percentUsed}%)`);

// IndexedDB size
if (navigator.storage && navigator.storage.estimate) {
  const { usage, quota } = await navigator.storage.estimate();
  console.log(`Using ${(usage/1024/1024).toFixed(2)} MB of ${(quota/1024/1024/1024).toFixed(2)} GB`);
}
```

### View all data in browser DevTools
1. Open DevTools (F12)
2. Go to **Application** tab
3. Check:
   - **Local Storage** → http://localhost:4321
   - **IndexedDB** → worldbridger_local

---

## 🎨 Form Examples

### Profile Form
```html
<form id="profile-form">
  <input name="username" placeholder="Username" required>
  <input name="email" type="email" placeholder="Email">
  <textarea name="bio" placeholder="Bio"></textarea>
  <button type="submit">Save Profile</button>
</form>

<script>
document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  try {
    const result = await window.formAdapter.submitProfile(data);
    alert('Profile saved! +25 XP');
  } catch (error) {
    alert('Error: ' + error.message);
  }
});
</script>
```

### Track Upload Form
```html
<form id="track-form">
  <input name="title" placeholder="Track Title" required>
  <select name="genre" required>
    <option value="rap">Rap</option>
    <option value="reggae">Reggae</option>
    <option value="dancehall">Dancehall</option>
  </select>
  <input name="audioFileUrl" placeholder="Audio URL" required>
  <input name="coverArtUrl" placeholder="Cover Art URL">
  <textarea name="lyrics" placeholder="Lyrics"></textarea>
  <input name="bpm" type="number" placeholder="BPM">
  <input name="key" placeholder="Musical Key">
  <button type="submit">Upload Track</button>
</form>

<script>
document.getElementById('track-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  data.bpm = data.bpm ? parseInt(data.bpm) : null;

  try {
    const result = await window.formAdapter.submitTrack(data);
    alert(`Track uploaded! +${result.xpAwarded} XP`);
  } catch (error) {
    alert('Error: ' + error.message);
  }
});
</script>
```

---

## 🔐 Security Notes

- **Email & Phone**: Automatically encrypted before storage
- **Encryption Key**: Derived from your wallet address
- **Data Isolation**: Each wallet has separate data
- **No Tracking**: All data stays in your browser
- **Export Anytime**: You own your data completely

---

## 🌐 Offline Detection

```javascript
// Listen for online/offline events
window.addEventListener('offline', () => {
  console.log('📴 App is offline - all features still work!');
  // Show offline banner
});

window.addEventListener('online', () => {
  console.log('🌐 App is back online');
  // Hide offline banner
  // Optionally sync data to cloud
});

// Check current status
if (navigator.onLine) {
  console.log('🌐 Online');
} else {
  console.log('📴 Offline');
}
```

---

## 🎯 Next Steps

1. **Update existing forms** to use `window.formAdapter` instead of API calls
2. **Add export/import buttons** to the profile page
3. **Show storage usage** indicator
4. **Add offline status banner**
5. **(Optional) Implement cloud sync** for backup

---

## 📊 Example: Full Workflow

```javascript
// 1. Initialize (automatic on page load)
// Crypto manager, localDB, and formAdapter are ready

// 2. Connect wallet
const wallet = 'YOUR_WALLET_ADDRESS';

// 3. Create profile
await window.formAdapter.submitProfile({
  username: 'kakuma_artist',
  email: 'artist@kakuma.org',
  bio: 'Making music for my community'
});

// 4. Upload tracks
for (let i = 0; i < 5; i++) {
  await window.formAdapter.submitTrack({
    title: `Track ${i+1}`,
    genre: 'rap',
    audioFileUrl: `https://example.com/track${i}.mp3`,
    lyrics: `Lyrics for track ${i}...`
  });
}

// 5. Get user's tracks
const myTracks = await window.localDB.getTracks({
  userWallet: wallet,
  status: 'published'
});

console.log(`You have ${myTracks.length} tracks`);

// 6. Like and play tracks
for (const track of myTracks) {
  await window.localDB.playTrack(track.id, wallet);
  await window.localDB.likeTrack(track.id, wallet);
}

// 7. Check your progress
const profile = await window.localDB.getProfile(wallet);
console.log(`Level ${profile.level} - ${profile.xp} XP`);

// 8. View activities
const activities = await window.localDB.getActivities(wallet, 20);
activities.forEach(a => {
  console.log(`${a.activityType}: ${a.description} (+${a.xpAwarded} XP)`);
});

// 9. Export your data
await window.formAdapter.exportUserData();
```

---

## 🎉 That's It!

Your app is now fully offline-first! Everything works without a server.

**Questions?**
Check `OFFLINE_ARCHITECTURE.md` for detailed technical documentation.

**Created with ❤️ for Kakuma Refugee Camp**
**Empowering youth through accessible technology**
