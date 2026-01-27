/**
 * Local Storage Manager
 * Manages localStorage for preferences, settings, and simple data
 *
 * All keys prefixed with 'wb_' to avoid conflicts
 */

class LocalStorageManager {
  constructor() {
    this.prefix = 'wb_';
  }

  /**
   * Save data to localStorage
   */
  set(key, value) {
    try {
      const fullKey = this.prefix + key;
      const serialized = JSON.stringify(value);
      localStorage.setItem(fullKey, serialized);
      return true;
    } catch (error) {
      console.error('❌ LocalStorage set error:', error);
      return false;
    }
  }

  /**
   * Get data from localStorage
   */
  get(key, defaultValue = null) {
    try {
      const fullKey = this.prefix + key;
      const item = localStorage.getItem(fullKey);

      if (item === null) return defaultValue;

      return JSON.parse(item);
    } catch (error) {
      console.error('❌ LocalStorage get error:', error);
      return defaultValue;
    }
  }

  /**
   * Remove item from localStorage
   */
  remove(key) {
    const fullKey = this.prefix + key;
    localStorage.removeItem(fullKey);
  }

  /**
   * Clear all app data from localStorage
   */
  clearAll() {
    const keys = Object.keys(localStorage);
    const appKeys = keys.filter(key => key.startsWith(this.prefix));

    appKeys.forEach(key => localStorage.removeItem(key));
    console.log(`🗑️ Cleared ${appKeys.length} localStorage items`);
  }

  /**
   * Get storage usage info
   */
  getStorageInfo() {
    let totalSize = 0;
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        totalSize += localStorage.getItem(key).length;
      }
    });

    const sizeKB = (totalSize / 1024).toFixed(2);
    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);

    return {
      itemCount: keys.filter(k => k.startsWith(this.prefix)).length,
      sizeBytes: totalSize,
      sizeKB,
      sizeMB,
      percentUsed: (totalSize / (10 * 1024 * 1024) * 100).toFixed(2) // Assuming 10MB limit
    };
  }

  // ==================== PREFERENCES ====================

  savePreferences(prefs) {
    this.set('preferences', prefs);
  }

  getPreferences() {
    return this.get('preferences', {
      theme: 'space-invaders',
      favoriteAnimals: [],
      musicPrefs: [],
      learningPace: 'moderate'
    });
  }

  // ==================== NOTIFICATION SETTINGS ====================

  saveNotificationSettings(settings) {
    this.set('notifications', settings);
  }

  getNotificationSettings() {
    return this.get('notifications', {
      email: {},
      push: {},
      marketing: {}
    });
  }

  // ==================== PRIVACY SETTINGS ====================

  savePrivacySettings(settings) {
    this.set('privacy', settings);
  }

  getPrivacySettings() {
    return this.get('privacy', {
      profileVisibility: 'public',
      showStats: true,
      activityVisibility: 'public'
    });
  }

  // ==================== WALLET ====================

  saveLastWallet(walletAddress) {
    this.set('lastWallet', walletAddress);
  }

  getLastWallet() {
    return this.get('lastWallet');
  }

  // ==================== UI STATE ====================

  saveUIState(state) {
    this.set('uiState', state);
  }

  getUIState() {
    return this.get('uiState', {});
  }

  // ==================== CACHE ====================

  setCache(key, data, ttlMinutes = 60) {
    const cacheItem = {
      data,
      expiry: Date.now() + (ttlMinutes * 60 * 1000)
    };
    this.set(`cache_${key}`, cacheItem);
  }

  getCache(key) {
    const cacheItem = this.get(`cache_${key}`);

    if (!cacheItem) return null;

    // Check if expired
    if (Date.now() > cacheItem.expiry) {
      this.remove(`cache_${key}`);
      return null;
    }

    return cacheItem.data;
  }

  clearExpiredCache() {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(this.prefix + 'cache_'));

    let cleared = 0;
    cacheKeys.forEach(key => {
      const item = JSON.parse(localStorage.getItem(key));
      if (item && item.expiry && Date.now() > item.expiry) {
        localStorage.removeItem(key);
        cleared++;
      }
    });

    if (cleared > 0) {
      console.log(`🗑️ Cleared ${cleared} expired cache items`);
    }
  }
}

// Create global instance
window.localStore = new LocalStorageManager();

// Clear expired cache on page load
window.localStore.clearExpiredCache();

console.log('💾 LocalStorage Manager loaded');
