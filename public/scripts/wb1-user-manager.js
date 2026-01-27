/**
 * WB1 User Manager - WorldBridger One User & Collaboration System
 *
 * Handles:
 * - Returning user detection and tracking
 * - Existing wallet identification
 * - Collaboration/partnership tracking
 * - Login streaks and engagement metrics
 * - Cross-wallet collaboration features
 */

(function() {
  'use strict';

  // Storage keys
  const STORAGE_KEYS = {
    // User identity
    USER_ID: 'wb1_user_id',
    FIRST_VISIT: 'wb1_first_visit',
    LAST_VISIT: 'wb1_last_visit',
    VISIT_COUNT: 'wb1_visit_count',

    // Login streaks
    LOGIN_STREAK: 'wb1_login_streak',
    LAST_LOGIN_DATE: 'wb1_last_login_date',
    LONGEST_STREAK: 'wb1_longest_streak',

    // Wallet associations
    WALLET_HISTORY: 'wb1_wallet_history',
    PRIMARY_WALLET: 'wb1_primary_wallet',

    // Collaborations
    COLLABORATIONS: 'wb1_collaborations',
    PENDING_COLLABS: 'wb1_pending_collabs',
    COLLAB_INVITES: 'wb1_collab_invites',

    // Engagement
    TOTAL_SESSIONS: 'wb1_total_sessions',
    SESSION_START: 'wb1_session_start',
    ACHIEVEMENTS_SHARED: 'wb1_achievements_shared'
  };

  // Collaboration types
  const COLLAB_TYPES = {
    MUSIC_COLLAB: 'music_collab',       // Music production partnership
    BATTLE_PARTNER: 'battle_partner',   // Rap battle collaboration
    LEARNING_BUDDY: 'learning_buddy',   // Environmental learning partner
    KAKUMA_SPONSOR: 'kakuma_sponsor',   // Supporting Kakuma youth
    MENTOR: 'mentor',                   // Mentorship relationship
    MENTEE: 'mentee',
    CREW_MEMBER: 'crew_member',         // Part of a music crew
    NFT_SPLIT: 'nft_split'              // NFT revenue sharing partner
  };

  /**
   * Generate a unique user ID (for tracking across sessions)
   */
  function generateUserId() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `wb1_${timestamp}_${randomPart}`;
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  function getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Calculate days between two dates
   */
  function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * WB1 User Manager Class
   */
  class WB1UserManager {
    constructor() {
      this.userId = null;
      this.isReturningUser = false;
      this.loginStreak = 0;
      this.collaborations = [];
      this.walletHistory = [];
      this.initialized = false;
    }

    /**
     * Initialize the user manager
     */
    initialize() {
      if (this.initialized) return this;

      console.log('═══════════════════════════════════════');
      console.log('🌉 WB1 User Manager Initializing');
      console.log('═══════════════════════════════════════');

      // Get or create user ID
      this.userId = localStorage.getItem(STORAGE_KEYS.USER_ID);

      if (!this.userId) {
        // New user - first visit
        this.userId = generateUserId();
        localStorage.setItem(STORAGE_KEYS.USER_ID, this.userId);
        localStorage.setItem(STORAGE_KEYS.FIRST_VISIT, new Date().toISOString());
        localStorage.setItem(STORAGE_KEYS.VISIT_COUNT, '1');
        this.isReturningUser = false;
        console.log('👋 New user detected:', this.userId);
      } else {
        // Returning user
        this.isReturningUser = true;
        this.incrementVisitCount();
        console.log('🎉 Welcome back! User:', this.userId);
      }

      // Update visit tracking
      this.updateVisitTracking();

      // Update login streak
      this.updateLoginStreak();

      // Load collaborations
      this.loadCollaborations();

      // Load wallet history
      this.loadWalletHistory();

      // Start session tracking
      this.startSession();

      this.initialized = true;

      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('wb1-user-ready', {
        detail: {
          userId: this.userId,
          isReturningUser: this.isReturningUser,
          loginStreak: this.loginStreak,
          visitCount: this.getVisitCount()
        }
      }));

      console.log('✅ WB1 User Manager Ready');
      console.log('  - Returning User:', this.isReturningUser);
      console.log('  - Login Streak:', this.loginStreak);
      console.log('  - Visit Count:', this.getVisitCount());
      console.log('═══════════════════════════════════════');

      return this;
    }

    /**
     * Increment visit count
     */
    incrementVisitCount() {
      const count = parseInt(localStorage.getItem(STORAGE_KEYS.VISIT_COUNT) || '0', 10);
      localStorage.setItem(STORAGE_KEYS.VISIT_COUNT, (count + 1).toString());
    }

    /**
     * Get total visit count
     */
    getVisitCount() {
      return parseInt(localStorage.getItem(STORAGE_KEYS.VISIT_COUNT) || '1', 10);
    }

    /**
     * Update visit tracking timestamps
     */
    updateVisitTracking() {
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.LAST_VISIT, now);
    }

    /**
     * Update login streak
     */
    updateLoginStreak() {
      const today = getTodayDate();
      const lastLoginDate = localStorage.getItem(STORAGE_KEYS.LAST_LOGIN_DATE);
      let currentStreak = parseInt(localStorage.getItem(STORAGE_KEYS.LOGIN_STREAK) || '0', 10);
      let longestStreak = parseInt(localStorage.getItem(STORAGE_KEYS.LONGEST_STREAK) || '0', 10);

      if (!lastLoginDate) {
        // First login ever
        currentStreak = 1;
      } else if (lastLoginDate === today) {
        // Already logged in today, streak unchanged
      } else {
        const daysDiff = daysBetween(lastLoginDate, today);

        if (daysDiff === 1) {
          // Consecutive day - increment streak
          currentStreak += 1;
          console.log('🔥 Login streak increased to:', currentStreak);
        } else if (daysDiff > 1) {
          // Streak broken - reset
          console.log('💔 Login streak reset (was:', currentStreak, ')');
          currentStreak = 1;
        }
      }

      // Update longest streak
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
        localStorage.setItem(STORAGE_KEYS.LONGEST_STREAK, longestStreak.toString());
        console.log('🏆 New longest streak record:', longestStreak);
      }

      // Save updates
      localStorage.setItem(STORAGE_KEYS.LOGIN_STREAK, currentStreak.toString());
      localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_DATE, today);

      this.loginStreak = currentStreak;
    }

    /**
     * Get login streak info
     */
    getStreakInfo() {
      return {
        current: this.loginStreak,
        longest: parseInt(localStorage.getItem(STORAGE_KEYS.LONGEST_STREAK) || '0', 10),
        lastLogin: localStorage.getItem(STORAGE_KEYS.LAST_LOGIN_DATE)
      };
    }

    /**
     * Start session tracking
     */
    startSession() {
      const sessionStart = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.SESSION_START, sessionStart);

      // Increment total sessions
      const totalSessions = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_SESSIONS) || '0', 10);
      localStorage.setItem(STORAGE_KEYS.TOTAL_SESSIONS, (totalSessions + 1).toString());
    }

    /**
     * Get session duration in seconds
     */
    getSessionDuration() {
      const start = localStorage.getItem(STORAGE_KEYS.SESSION_START);
      if (!start) return 0;
      return Math.floor((Date.now() - new Date(start).getTime()) / 1000);
    }

    // ========================================
    // WALLET MANAGEMENT
    // ========================================

    /**
     * Check if user has any wallet (encrypted or anonymous)
     */
    hasAnyWallet() {
      // Check for encrypted wallet
      const hasEncrypted = !!(
        localStorage.getItem('wallet_encrypted') &&
        localStorage.getItem('wallet_publicKey')
      );

      // Check for anonymous wallet
      const hasAnonymous = !!localStorage.getItem('anonymousWallet');

      // Check for external connected wallet
      const hasConnected = !!localStorage.getItem('connectedWallet');

      return hasEncrypted || hasAnonymous || hasConnected;
    }

    /**
     * Get the active wallet address
     */
    getActiveWallet() {
      // Priority: Created wallet > Connected wallet > Anonymous wallet
      const createdWallet = localStorage.getItem('wallet_publicKey');
      if (createdWallet) return { address: createdWallet, type: 'created' };

      const connectedWallet = localStorage.getItem('connectedWallet');
      if (connectedWallet && !connectedWallet.startsWith('anon_')) {
        return { address: connectedWallet, type: 'connected' };
      }

      const anonymousWallet = localStorage.getItem('anonymousWallet');
      if (anonymousWallet) return { address: anonymousWallet, type: 'anonymous' };

      return null;
    }

    /**
     * Load wallet history
     */
    loadWalletHistory() {
      try {
        const history = localStorage.getItem(STORAGE_KEYS.WALLET_HISTORY);
        this.walletHistory = history ? JSON.parse(history) : [];
      } catch (e) {
        this.walletHistory = [];
      }
    }

    /**
     * Add wallet to history
     */
    addWalletToHistory(walletAddress, walletType = 'unknown') {
      if (!walletAddress) return;

      // Check if already in history
      const exists = this.walletHistory.find(w => w.address === walletAddress);
      if (exists) {
        exists.lastUsed = new Date().toISOString();
        exists.useCount = (exists.useCount || 0) + 1;
      } else {
        this.walletHistory.push({
          address: walletAddress,
          type: walletType,
          addedAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          useCount: 1
        });
      }

      localStorage.setItem(STORAGE_KEYS.WALLET_HISTORY, JSON.stringify(this.walletHistory));
    }

    /**
     * Set primary wallet
     */
    setPrimaryWallet(walletAddress) {
      localStorage.setItem(STORAGE_KEYS.PRIMARY_WALLET, walletAddress);
      this.addWalletToHistory(walletAddress, 'primary');
    }

    /**
     * Get primary wallet
     */
    getPrimaryWallet() {
      return localStorage.getItem(STORAGE_KEYS.PRIMARY_WALLET);
    }

    // ========================================
    // COLLABORATION SYSTEM
    // ========================================

    /**
     * Load collaborations from storage
     */
    loadCollaborations() {
      try {
        const collabs = localStorage.getItem(STORAGE_KEYS.COLLABORATIONS);
        this.collaborations = collabs ? JSON.parse(collabs) : [];
      } catch (e) {
        this.collaborations = [];
      }
    }

    /**
     * Save collaborations to storage
     */
    saveCollaborations() {
      localStorage.setItem(STORAGE_KEYS.COLLABORATIONS, JSON.stringify(this.collaborations));
    }

    /**
     * Create a new collaboration
     */
    createCollaboration(partnerWallet, collabType, metadata = {}) {
      const myWallet = this.getActiveWallet();
      if (!myWallet) {
        console.error('Cannot create collab: no active wallet');
        return null;
      }

      const collab = {
        id: `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        initiator: myWallet.address,
        partner: partnerWallet,
        type: collabType,
        status: 'pending', // pending, active, completed, cancelled
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          ...metadata,
          typeName: this.getCollabTypeName(collabType)
        },
        earnings: {
          total: 0,
          initiatorShare: 50,
          partnerShare: 50
        },
        activity: [{
          action: 'created',
          timestamp: new Date().toISOString(),
          by: myWallet.address
        }]
      };

      this.collaborations.push(collab);
      this.saveCollaborations();

      // Add to pending collabs for partner notification
      this.addPendingCollab(collab);

      console.log('🤝 Collaboration created:', collab.id);

      // Dispatch event
      window.dispatchEvent(new CustomEvent('wb1-collab-created', { detail: collab }));

      return collab;
    }

    /**
     * Get collab type display name
     */
    getCollabTypeName(type) {
      const names = {
        [COLLAB_TYPES.MUSIC_COLLAB]: 'Music Collaboration',
        [COLLAB_TYPES.BATTLE_PARTNER]: 'Battle Partner',
        [COLLAB_TYPES.LEARNING_BUDDY]: 'Learning Buddy',
        [COLLAB_TYPES.KAKUMA_SPONSOR]: 'Kakuma Sponsor',
        [COLLAB_TYPES.MENTOR]: 'Mentor',
        [COLLAB_TYPES.MENTEE]: 'Mentee',
        [COLLAB_TYPES.CREW_MEMBER]: 'Crew Member',
        [COLLAB_TYPES.NFT_SPLIT]: 'NFT Revenue Share'
      };
      return names[type] || 'Collaboration';
    }

    /**
     * Add pending collab notification
     */
    addPendingCollab(collab) {
      try {
        const pending = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_COLLABS) || '[]');
        pending.push({
          collabId: collab.id,
          from: collab.initiator,
          type: collab.type,
          createdAt: collab.createdAt
        });
        localStorage.setItem(STORAGE_KEYS.PENDING_COLLABS, JSON.stringify(pending));
      } catch (e) {
        console.error('Error saving pending collab:', e);
      }
    }

    /**
     * Accept a collaboration invite
     */
    acceptCollaboration(collabId) {
      const collab = this.collaborations.find(c => c.id === collabId);
      if (!collab) {
        console.error('Collaboration not found:', collabId);
        return false;
      }

      const myWallet = this.getActiveWallet();
      if (!myWallet) return false;

      collab.status = 'active';
      collab.updatedAt = new Date().toISOString();
      collab.acceptedAt = new Date().toISOString();
      collab.activity.push({
        action: 'accepted',
        timestamp: new Date().toISOString(),
        by: myWallet.address
      });

      this.saveCollaborations();

      // Remove from pending
      this.removePendingCollab(collabId);

      console.log('✅ Collaboration accepted:', collabId);
      window.dispatchEvent(new CustomEvent('wb1-collab-accepted', { detail: collab }));

      return true;
    }

    /**
     * Decline a collaboration invite
     */
    declineCollaboration(collabId) {
      const collab = this.collaborations.find(c => c.id === collabId);
      if (!collab) return false;

      collab.status = 'declined';
      collab.updatedAt = new Date().toISOString();
      this.saveCollaborations();
      this.removePendingCollab(collabId);

      console.log('❌ Collaboration declined:', collabId);
      return true;
    }

    /**
     * Remove from pending collabs
     */
    removePendingCollab(collabId) {
      try {
        const pending = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_COLLABS) || '[]');
        const filtered = pending.filter(p => p.collabId !== collabId);
        localStorage.setItem(STORAGE_KEYS.PENDING_COLLABS, JSON.stringify(filtered));
      } catch (e) {
        console.error('Error removing pending collab:', e);
      }
    }

    /**
     * Get all active collaborations
     */
    getActiveCollaborations() {
      return this.collaborations.filter(c => c.status === 'active');
    }

    /**
     * Get pending collaboration invites
     */
    getPendingInvites() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_COLLABS) || '[]');
      } catch (e) {
        return [];
      }
    }

    /**
     * Get collaborations by type
     */
    getCollaborationsByType(type) {
      return this.collaborations.filter(c => c.type === type && c.status === 'active');
    }

    /**
     * Record collaboration earning
     */
    recordCollabEarning(collabId, amount, description = '') {
      const collab = this.collaborations.find(c => c.id === collabId);
      if (!collab) return false;

      collab.earnings.total += amount;
      collab.updatedAt = new Date().toISOString();
      collab.activity.push({
        action: 'earning',
        amount: amount,
        description: description,
        timestamp: new Date().toISOString()
      });

      this.saveCollaborations();

      console.log(`💰 Collab earning recorded: ${amount} for ${collabId}`);
      return true;
    }

    /**
     * Get collaboration stats
     */
    getCollabStats() {
      const active = this.collaborations.filter(c => c.status === 'active');
      const totalEarnings = this.collaborations.reduce((sum, c) => sum + (c.earnings?.total || 0), 0);

      const byType = {};
      for (const type of Object.values(COLLAB_TYPES)) {
        byType[type] = this.collaborations.filter(c => c.type === type).length;
      }

      return {
        total: this.collaborations.length,
        active: active.length,
        pending: this.getPendingInvites().length,
        totalEarnings: totalEarnings,
        byType: byType
      };
    }

    // ========================================
    // RETURNING USER HELPERS
    // ========================================

    /**
     * Check if this is user's first visit today
     */
    isFirstVisitToday() {
      const lastLogin = localStorage.getItem(STORAGE_KEYS.LAST_LOGIN_DATE);
      return lastLogin !== getTodayDate();
    }

    /**
     * Get user engagement level based on activity
     */
    getEngagementLevel() {
      const visitCount = this.getVisitCount();
      const streak = this.loginStreak;
      const collabCount = this.getActiveCollaborations().length;

      if (visitCount >= 100 && streak >= 30 && collabCount >= 5) return 'legendary';
      if (visitCount >= 50 && streak >= 14 && collabCount >= 3) return 'dedicated';
      if (visitCount >= 20 && streak >= 7 && collabCount >= 1) return 'active';
      if (visitCount >= 5 && streak >= 3) return 'engaged';
      if (visitCount >= 2) return 'returning';
      return 'new';
    }

    /**
     * Get welcome message for returning users
     */
    getWelcomeMessage() {
      const engagement = this.getEngagementLevel();
      const streak = this.loginStreak;
      const visitCount = this.getVisitCount();

      if (!this.isReturningUser) {
        return {
          title: 'Welcome to WorldBridger One!',
          message: 'Start your journey with music, learning, and impact.',
          icon: '🌉'
        };
      }

      if (streak >= 30) {
        return {
          title: `${streak} Day Streak! Legendary!`,
          message: 'Your dedication to the WorldBridger community is inspiring.',
          icon: '🏆'
        };
      }

      if (streak >= 7) {
        return {
          title: `${streak} Day Streak! On Fire!`,
          message: 'Keep the momentum going!',
          icon: '🔥'
        };
      }

      if (streak >= 3) {
        return {
          title: `${streak} Days Strong!`,
          message: 'Building great habits. Keep it up!',
          icon: '💪'
        };
      }

      if (visitCount >= 10) {
        return {
          title: 'Welcome Back, Bridge Builder!',
          message: `Visit #${visitCount} - Thanks for being part of WB1!`,
          icon: '🎉'
        };
      }

      return {
        title: 'Welcome Back!',
        message: 'Good to see you again. Let\'s create something amazing.',
        icon: '👋'
      };
    }

    /**
     * Get full user status
     */
    getUserStatus() {
      const wallet = this.getActiveWallet();
      const streakInfo = this.getStreakInfo();
      const collabStats = this.getCollabStats();

      return {
        userId: this.userId,
        isReturningUser: this.isReturningUser,
        visitCount: this.getVisitCount(),
        firstVisit: localStorage.getItem(STORAGE_KEYS.FIRST_VISIT),
        lastVisit: localStorage.getItem(STORAGE_KEYS.LAST_VISIT),
        engagement: this.getEngagementLevel(),
        wallet: wallet,
        hasWallet: this.hasAnyWallet(),
        streak: streakInfo,
        collaborations: collabStats,
        totalSessions: parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_SESSIONS) || '0', 10),
        currentSessionDuration: this.getSessionDuration()
      };
    }
  }

  // Create and expose global instance
  window.WB1UserManager = WB1UserManager;
  window.wb1User = new WB1UserManager();

  // Also expose collab types for easy access
  window.WB1_COLLAB_TYPES = COLLAB_TYPES;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.wb1User.initialize());
  } else {
    window.wb1User.initialize();
  }

})();
