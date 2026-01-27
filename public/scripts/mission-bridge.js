/**
 * Mission Bridge - Theme and global state utilities
 * Provides bridge functions for theme management and global app state
 */

(function() {
  'use strict';

  // Theme persistence key
  const THEME_KEY = 'mission_theme_pref';

  // Mission Bridge API
  window.MissionBridge = {
    // Get current theme
    getTheme: function() {
      return localStorage.getItem(THEME_KEY) || 'dark';
    },

    // Set theme
    setTheme: function(theme) {
      localStorage.setItem(THEME_KEY, theme);
      document.documentElement.setAttribute('data-theme', theme);
      return theme;
    },

    // Toggle between light and dark
    toggleTheme: function() {
      const current = this.getTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      return this.setTheme(next);
    },

    // Check if a feature is available
    isFeatureAvailable: function(feature) {
      const features = {
        audio: typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined',
        webgl: (function() {
          try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
          } catch (e) {
            return false;
          }
        })(),
        storage: (function() {
          try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
          } catch (e) {
            return false;
          }
        })()
      };
      return features[feature] || false;
    },

    // Version
    version: '1.0.0'
  };

  // Apply saved theme on load
  const savedTheme = window.MissionBridge.getTheme();
  document.documentElement.setAttribute('data-theme', savedTheme);

})();
