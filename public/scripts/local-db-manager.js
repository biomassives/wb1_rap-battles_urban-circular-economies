/**
 * Local Database Manager
 * IndexedDB wrapper for offline-first data storage
 *
 * Database: worldbridger_local
 * Stores: profiles, tracks, activities, nfts, etc.
 */

class LocalDBManager {
  constructor() {
    this.dbName = 'worldbridger_local';
    this.dbVersion = 1;
    this.db = null;
  }

  /**
   * Initialize database and create object stores
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('❌ IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ Local Database initialized');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // User Profiles
        if (!db.objectStoreNames.contains('user_profiles')) {
          const profileStore = db.createObjectStore('user_profiles', {
            keyPath: 'walletAddress'
          });
          profileStore.createIndex('username', 'username', { unique: true });
          profileStore.createIndex('level', 'level');
          profileStore.createIndex('createdAt', 'createdAt');
        }

        // Music Tracks
        if (!db.objectStoreNames.contains('tracks')) {
          const trackStore = db.createObjectStore('tracks', {
            keyPath: 'id',
            autoIncrement: true
          });
          trackStore.createIndex('userWallet', 'userWallet');
          trackStore.createIndex('genre', 'genre');
          trackStore.createIndex('status', 'status');
          trackStore.createIndex('createdAt', 'createdAt');
          trackStore.createIndex('plays', 'plays');
          trackStore.createIndex('likes', 'likes');
        }

        // Track Likes
        if (!db.objectStoreNames.contains('track_likes')) {
          const likeStore = db.createObjectStore('track_likes', {
            keyPath: ['trackId', 'userWallet']
          });
          likeStore.createIndex('trackId', 'trackId');
          likeStore.createIndex('userWallet', 'userWallet');
          likeStore.createIndex('createdAt', 'createdAt');
        }

        // Track Plays
        if (!db.objectStoreNames.contains('track_plays')) {
          const playStore = db.createObjectStore('track_plays', {
            keyPath: 'id',
            autoIncrement: true
          });
          playStore.createIndex('trackId', 'trackId');
          playStore.createIndex('listenerWallet', 'listenerWallet');
          playStore.createIndex('createdAt', 'createdAt');
        }

        // Battles
        if (!db.objectStoreNames.contains('battles')) {
          const battleStore = db.createObjectStore('battles', {
            keyPath: 'id',
            autoIncrement: true
          });
          battleStore.createIndex('challengerWallet', 'challengerWallet');
          battleStore.createIndex('opponentWallet', 'opponentWallet');
          battleStore.createIndex('status', 'status');
          battleStore.createIndex('category', 'category');
          battleStore.createIndex('createdAt', 'createdAt');
        }

        // Observations (Environmental Data)
        if (!db.objectStoreNames.contains('observations')) {
          const obsStore = db.createObjectStore('observations', {
            keyPath: 'id',
            autoIncrement: true
          });
          obsStore.createIndex('userWallet', 'userWallet');
          obsStore.createIndex('projectId', 'projectId');
          obsStore.createIndex('observationType', 'observationType');
          obsStore.createIndex('createdAt', 'createdAt');
        }

        // Courses
        if (!db.objectStoreNames.contains('courses')) {
          const courseStore = db.createObjectStore('courses', {
            keyPath: 'id'
          });
          courseStore.createIndex('category', 'category');
          courseStore.createIndex('difficulty', 'difficulty');
        }

        // Course Enrollments
        if (!db.objectStoreNames.contains('enrollments')) {
          const enrollStore = db.createObjectStore('enrollments', {
            keyPath: ['courseId', 'userWallet']
          });
          enrollStore.createIndex('courseId', 'courseId');
          enrollStore.createIndex('userWallet', 'userWallet');
          enrollStore.createIndex('enrolledAt', 'enrolledAt');
        }

        // Donations
        if (!db.objectStoreNames.contains('donations')) {
          const donationStore = db.createObjectStore('donations', {
            keyPath: 'id',
            autoIncrement: true
          });
          donationStore.createIndex('userWallet', 'userWallet');
          donationStore.createIndex('projectId', 'projectId');
          donationStore.createIndex('createdAt', 'createdAt');
        }

        // NFTs
        if (!db.objectStoreNames.contains('nfts')) {
          const nftStore = db.createObjectStore('nfts', {
            keyPath: 'mintAddress'
          });
          nftStore.createIndex('ownerWallet', 'ownerWallet');
          nftStore.createIndex('collection', 'collection');
          nftStore.createIndex('rarity', 'rarity');
        }

        // Activity Log
        if (!db.objectStoreNames.contains('activities')) {
          const activityStore = db.createObjectStore('activities', {
            keyPath: 'id',
            autoIncrement: true
          });
          activityStore.createIndex('userWallet', 'userWallet');
          activityStore.createIndex('activityType', 'activityType');
          activityStore.createIndex('createdAt', 'createdAt');
        }

        console.log('🗄️ Database schema created');
      };
    });
  }

  // ==================== PROFILES ====================

  async saveProfile(profile) {
    const transaction = this.db.transaction(['user_profiles'], 'readwrite');
    const store = transaction.objectStore('user_profiles');

    // Add timestamps
    if (!profile.createdAt) profile.createdAt = new Date().toISOString();
    profile.updatedAt = new Date().toISOString();

    // Encrypt sensitive fields
    if (profile.email || profile.whatsappNumber) {
      profile = await window.cryptoManager.encryptObject(
        profile.walletAddress,
        profile,
        ['email', 'whatsappNumber']
      );
    }

    return new Promise((resolve, reject) => {
      const request = store.put(profile);
      request.onsuccess = () => resolve(profile);
      request.onerror = () => reject(request.error);
    });
  }

  async getProfile(walletAddress) {
    const transaction = this.db.transaction(['user_profiles'], 'readonly');
    const store = transaction.objectStore('user_profiles');

    return new Promise(async (resolve, reject) => {
      const request = store.get(walletAddress);

      request.onsuccess = async () => {
        let profile = request.result;

        // Decrypt sensitive fields
        if (profile) {
          profile = await window.cryptoManager.decryptObject(walletAddress, profile);
        }

        resolve(profile);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ==================== TRACKS ====================

  async saveTrack(track) {
    const transaction = this.db.transaction(['tracks'], 'readwrite');
    const store = transaction.objectStore('tracks');

    if (!track.createdAt) track.createdAt = new Date().toISOString();
    track.updatedAt = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const request = store.put(track);
      request.onsuccess = () => resolve({ ...track, id: request.result });
      request.onerror = () => reject(request.error);
    });
  }

  async getTrack(id) {
    const transaction = this.db.transaction(['tracks'], 'readonly');
    const store = transaction.objectStore('tracks');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getTracks(filters = {}) {
    const transaction = this.db.transaction(['tracks'], 'readonly');
    const store = transaction.objectStore('tracks');

    return new Promise((resolve, reject) => {
      let request;

      // Use index if filtering by specific field
      if (filters.userWallet) {
        const index = store.index('userWallet');
        request = index.getAll(filters.userWallet);
      } else if (filters.genre) {
        const index = store.index('genre');
        request = index.getAll(filters.genre);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let tracks = request.result;

        // Apply additional filters
        if (filters.status) {
          tracks = tracks.filter(t => t.status === filters.status);
        }

        // Sort
        if (filters.orderBy === 'plays') {
          tracks.sort((a, b) => b.plays - a.plays);
        } else if (filters.orderBy === 'likes') {
          tracks.sort((a, b) => b.likes - a.likes);
        } else {
          tracks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        // Limit
        if (filters.limit) {
          tracks = tracks.slice(0, filters.limit);
        }

        resolve(tracks);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async deleteTrack(id) {
    const transaction = this.db.transaction(['tracks'], 'readwrite');
    const store = transaction.objectStore('tracks');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== TRACK INTERACTIONS ====================

  async likeTrack(trackId, userWallet) {
    const transaction = this.db.transaction(['track_likes', 'tracks'], 'readwrite');
    const likeStore = transaction.objectStore('track_likes');
    const trackStore = transaction.objectStore('tracks');

    // Check if already liked
    const existingLike = await new Promise((resolve) => {
      const request = likeStore.get([trackId, userWallet]);
      request.onsuccess = () => resolve(request.result);
    });

    if (existingLike) {
      // Unlike
      await new Promise((resolve) => {
        const request = likeStore.delete([trackId, userWallet]);
        request.onsuccess = () => resolve();
      });

      // Decrement track like count
      const track = await new Promise((resolve) => {
        const request = trackStore.get(trackId);
        request.onsuccess = () => resolve(request.result);
      });

      track.likes = Math.max(0, track.likes - 1);
      await new Promise((resolve) => {
        const request = trackStore.put(track);
        request.onsuccess = () => resolve();
      });

      return { liked: false, newLikeCount: track.likes };
    } else {
      // Like
      await new Promise((resolve) => {
        const request = likeStore.put({
          trackId,
          userWallet,
          createdAt: new Date().toISOString()
        });
        request.onsuccess = () => resolve();
      });

      // Increment track like count
      const track = await new Promise((resolve) => {
        const request = trackStore.get(trackId);
        request.onsuccess = () => resolve(request.result);
      });

      track.likes = (track.likes || 0) + 1;
      await new Promise((resolve) => {
        const request = trackStore.put(track);
        request.onsuccess = () => resolve();
      });

      return { liked: true, newLikeCount: track.likes };
    }
  }

  async playTrack(trackId, listenerWallet) {
    const transaction = this.db.transaction(['track_plays', 'tracks'], 'readwrite');
    const playStore = transaction.objectStore('track_plays');
    const trackStore = transaction.objectStore('tracks');

    // Log play
    await new Promise((resolve) => {
      const request = playStore.put({
        trackId,
        listenerWallet,
        createdAt: new Date().toISOString()
      });
      request.onsuccess = () => resolve();
    });

    // Increment play count
    const track = await new Promise((resolve) => {
      const request = trackStore.get(trackId);
      request.onsuccess = () => resolve(request.result);
    });

    track.plays = (track.plays || 0) + 1;
    await new Promise((resolve) => {
      const request = trackStore.put(track);
      request.onsuccess = () => resolve();
    });

    return { newPlayCount: track.plays };
  }

  // ==================== ACTIVITIES ====================

  async logActivity(activity) {
    const transaction = this.db.transaction(['activities'], 'readwrite');
    const store = transaction.objectStore('activities');

    activity.createdAt = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const request = store.put(activity);
      request.onsuccess = () => resolve({ ...activity, id: request.result });
      request.onerror = () => reject(request.error);
    });
  }

  async getActivities(userWallet, limit = 50) {
    const transaction = this.db.transaction(['activities'], 'readonly');
    const store = transaction.objectStore('activities');
    const index = store.index('userWallet');

    return new Promise((resolve, reject) => {
      const request = index.getAll(userWallet);

      request.onsuccess = () => {
        let activities = request.result;
        activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        resolve(activities.slice(0, limit));
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ==================== EXPORT / IMPORT ====================

  async exportAllData() {
    const data = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      stores: {}
    };

    const storeNames = [
      'user_profiles', 'tracks', 'track_likes', 'track_plays',
      'battles', 'observations', 'courses', 'enrollments',
      'donations', 'nfts', 'activities'
    ];

    const transaction = this.db.transaction(storeNames, 'readonly');

    for (const storeName of storeNames) {
      const store = transaction.objectStore(storeName);
      const allData = await new Promise((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
      });
      data.stores[storeName] = allData;
    }

    console.log('📤 Data exported:', data);
    return data;
  }

  async importData(data) {
    console.log('📥 Importing data...');

    for (const [storeName, items] of Object.entries(data.stores)) {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      for (const item of items) {
        await new Promise((resolve) => {
          const request = store.put(item);
          request.onsuccess = () => resolve();
        });
      }
    }

    console.log('✅ Import complete');
  }

  async clearAllData() {
    const storeNames = [
      'user_profiles', 'tracks', 'track_likes', 'track_plays',
      'battles', 'observations', 'courses', 'enrollments',
      'donations', 'nfts', 'activities'
    ];

    const transaction = this.db.transaction(storeNames, 'readwrite');

    for (const storeName of storeNames) {
      const store = transaction.objectStore(storeName);
      await new Promise((resolve) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
      });
    }

    console.log('🗑️ All data cleared');
  }
}

// Create global instance
window.localDB = new LocalDBManager();

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.localDB.initialize();
  });
} else {
  window.localDB.initialize();
}

console.log('🗄️ Local DB Manager loaded');
