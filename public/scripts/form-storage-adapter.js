/**
 * Form Storage Adapter
 * Connects forms to local IndexedDB storage instead of remote APIs
 *
 * Usage:
 * FormAdapter.submitTrack(formData) - Save track locally
 * FormAdapter.submitProfile(formData) - Save profile locally
 */

class FormStorageAdapter {
  constructor() {
    this.initialized = false;
  }

  /**
   * Wait for dependencies to load
   */
  async initialize() {
    if (this.initialized) return;

    // Wait for localDB and cryptoManager to be ready
    const maxWait = 5000;
    const startTime = Date.now();

    while (!window.localDB?.db || !window.cryptoManager?.salt) {
      if (Date.now() - startTime > maxWait) {
        throw new Error('Storage managers failed to initialize');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.initialized = true;
    console.log('✅ Form Storage Adapter ready');
  }

  /**
   * Get connected wallet address
   */
  getWalletAddress() {
    const wallet = window.walletManager?.connectedWallet;

    if (!wallet) {
      throw new Error('Wallet not connected. Please connect wallet first.');
    }

    return wallet;
  }

  // ==================== PROFILE FORMS ====================

  /**
   * Submit Profile (Form 7: Basic Information)
   */
  async submitProfile(formData) {
    await this.initialize();

    const walletAddress = this.getWalletAddress();

    const profile = {
      walletAddress,
      username: formData.username,
      displayName: formData.displayName || null,
      email: formData.email || null,
      bio: formData.bio || null,
      location: formData.location || null,
      language: formData.language || 'en',
      timezone: formData.timezone || null
    };

    await window.localDB.saveProfile(profile);

    // Award XP for first profile completion
    const existingProfile = await window.localDB.getProfile(walletAddress);
    if (!existingProfile || !existingProfile.username) {
      await this.awardXP(walletAddress, 25, 'profile_setup', 'Completed profile setup');
    }

    console.log('✅ Profile saved locally');
    return { success: true, profile };
  }

  /**
   * Update Preferences (Form 8)
   */
  async submitPreferences(formData) {
    window.localStore.savePreferences(formData);
    console.log('✅ Preferences saved');
    return { success: true };
  }

  /**
   * Update Notification Settings (Form 9)
   */
  async submitNotifications(formData) {
    window.localStore.saveNotificationSettings(formData);
    console.log('✅ Notification settings saved');
    return { success: true };
  }

  /**
   * Update Privacy Settings (Form 10)
   */
  async submitPrivacy(formData) {
    window.localStore.savePrivacySettings(formData);
    console.log('✅ Privacy settings saved');
    return { success: true };
  }

  // ==================== MUSIC FORMS ====================

  /**
   * Submit Track (Form 1: Track Upload)
   */
  async submitTrack(formData) {
    await this.initialize();

    const walletAddress = this.getWalletAddress();

    const track = {
      userWallet: walletAddress,
      title: formData.title,
      genre: formData.genre,
      audioFileUrl: formData.audioFileUrl, // Will be URL or Blob
      coverArtUrl: formData.coverArtUrl || null,
      lyrics: formData.lyrics || null,
      description: formData.description || null,
      duration: formData.duration || null,
      bpm: formData.bpm || null,
      key: formData.key || null,
      isCollaboration: formData.isCollaboration || false,
      collaborators: formData.collaborators || [],
      status: formData.releaseOption === 'draft' ? 'draft' : 'published',
      scheduledDate: formData.scheduledDate || null,
      plays: 0,
      likes: 0,
      tags: formData.tags || [],
      nftMintAddress: null,
      nftMetadataUri: null
    };

    const savedTrack = await window.localDB.saveTrack(track);

    // Award XP
    let xpAwarded = 100;
    if (track.lyrics) xpAwarded += 25;
    if (track.coverArtUrl) xpAwarded += 15;
    if (track.isCollaboration) xpAwarded += 30;
    if (track.description && track.description.length > 100) xpAwarded += 10;

    await this.awardXP(
      walletAddress,
      xpAwarded,
      'track_upload',
      `Uploaded track: ${track.title}`
    );

    console.log('✅ Track saved locally');
    return {
      success: true,
      track: savedTrack,
      xpAwarded
    };
  }

  /**
   * Submit Rap Battle (Form 2)
   */
  async submitBattle(formData) {
    await this.initialize();

    const walletAddress = this.getWalletAddress();

    const battle = {
      challengerWallet: walletAddress,
      opponentWallet: formData.opponentWallet || null,
      category: formData.category,
      rounds: formData.rounds || 3,
      barsPerRound: formData.barsPerRound || 16,
      timeLimit: formData.timeLimit || '48h',
      stake: formData.stake || 0,
      stakeCurrency: formData.stakeCurrency || 'XP',
      theme: formData.theme || null,
      status: 'pending',
      winnerWallet: null
    };

    // Save to battles store
    const transaction = window.localDB.db.transaction(['battles'], 'readwrite');
    const store = transaction.objectStore('battles');

    const savedBattle = await new Promise((resolve) => {
      const request = store.put(battle);
      request.onsuccess = () => resolve({ ...battle, id: request.result });
    });

    console.log('✅ Battle created locally');
    return {
      success: true,
      battle: savedBattle
    };
  }

  // ==================== LEARNING FORMS ====================

  /**
   * Submit Environmental Observation (Form 3)
   */
  async submitObservation(formData) {
    await this.initialize();

    const walletAddress = this.getWalletAddress();

    const observation = {
      userWallet: walletAddress,
      projectId: formData.projectId,
      observationType: formData.observationType,
      measurement: formData.measurement,
      unit: formData.unit,
      location: formData.location,
      datetime: formData.datetime,
      weatherConditions: formData.weatherConditions || null,
      notes: formData.notes || null,
      photos: formData.photos || [],
      dataQuality: formData.dataQuality
    };

    const transaction = window.localDB.db.transaction(['observations'], 'readwrite');
    const store = transaction.objectStore('observations');

    const savedObs = await new Promise((resolve) => {
      const request = store.put(observation);
      request.onsuccess = () => resolve({ ...observation, id: request.result });
    });

    // Award XP
    await this.awardXP(walletAddress, 75, 'observation', 'Submitted environmental observation');

    console.log('✅ Observation saved locally');
    return {
      success: true,
      observation: savedObs,
      xpAwarded: 75
    };
  }

  /**
   * Course Enrollment (Form 4)
   */
  async enrollCourse(courseId) {
    await this.initialize();

    const walletAddress = this.getWalletAddress();

    const enrollment = {
      courseId,
      userWallet: walletAddress,
      enrolledAt: new Date().toISOString(),
      progress: 0,
      completed: false
    };

    const transaction = window.localDB.db.transaction(['enrollments'], 'readwrite');
    const store = transaction.objectStore('enrollments');

    await new Promise((resolve) => {
      const request = store.put(enrollment);
      request.onsuccess = () => resolve();
    });

    // Award XP
    await this.awardXP(walletAddress, 25, 'course_enroll', 'Enrolled in course');

    console.log('✅ Course enrollment saved locally');
    return {
      success: true,
      enrollment,
      xpAwarded: 25
    };
  }

  // ==================== KAKUMA FORMS ====================

  /**
   * Submit Donation (Form 5)
   */
  async submitDonation(formData) {
    await this.initialize();

    const walletAddress = this.getWalletAddress();

    const donation = {
      userWallet: walletAddress,
      projectId: formData.projectId,
      amount: formData.amount,
      currency: formData.currency || 'USD',
      recurring: formData.recurring || false,
      message: formData.message || null,
      anonymous: formData.anonymous || false
    };

    const transaction = window.localDB.db.transaction(['donations'], 'readwrite');
    const store = transaction.objectStore('donations');

    const savedDonation = await new Promise((resolve) => {
      const request = store.put(donation);
      request.onsuccess = () => resolve({ ...donation, id: request.result });
    });

    // Award XP based on amount (1 XP per $1, max 500 XP)
    const xpAwarded = Math.min(500, Math.floor(donation.amount));
    await this.awardXP(walletAddress, xpAwarded, 'donation', `Donated $${donation.amount}`);

    console.log('✅ Donation saved locally');
    return {
      success: true,
      donation: savedDonation,
      xpAwarded
    };
  }

  // ==================== XP SYSTEM ====================

  /**
   * Award XP to user
   */
  async awardXP(walletAddress, amount, activityType, description) {
    // Update user profile XP
    const profile = await window.localDB.getProfile(walletAddress);

    if (!profile) {
      console.warn('Profile not found, creating new profile');
      await window.localDB.saveProfile({
        walletAddress,
        username: null,
        xp: amount,
        level: 1
      });
    } else {
      profile.xp = (profile.xp || 0) + amount;

      // Calculate level (100 XP per level for simplicity)
      profile.level = Math.floor(profile.xp / 100) + 1;

      await window.localDB.saveProfile(profile);
    }

    // Log activity
    await window.localDB.logActivity({
      userWallet: walletAddress,
      activityType,
      description,
      xpAwarded: amount,
      metadata: {}
    });

    // Trigger XP toast if ProgressManager exists
    if (window.progressManager) {
      window.progressManager.showXPToast(amount, description);
    }

    console.log(`✨ Awarded ${amount} XP for ${activityType}`);
  }

  // ==================== TRACK INTERACTIONS ====================

  async likeTrack(trackId) {
    await this.initialize();
    const walletAddress = this.getWalletAddress();

    const result = await window.localDB.likeTrack(trackId, walletAddress);

    // Award milestone XP to track owner
    if (result.liked) {
      const track = await window.localDB.getTrack(trackId);
      const milestones = [10, 25, 50, 100, 250, 500, 1000];

      if (milestones.includes(result.newLikeCount)) {
        const xpReward = Math.floor(result.newLikeCount / 10);
        await this.awardXP(
          track.userWallet,
          xpReward,
          'track_milestone',
          `Track reached ${result.newLikeCount} likes!`
        );
      }
    }

    return { success: true, ...result };
  }

  async playTrack(trackId) {
    await this.initialize();
    const walletAddress = this.getWalletAddress();

    const result = await window.localDB.playTrack(trackId, walletAddress);

    // Award XP every 10 plays
    if (result.newPlayCount % 10 === 0) {
      const track = await window.localDB.getTrack(trackId);
      await this.awardXP(
        track.userWallet,
        5,
        'track_plays',
        `Track reached ${result.newPlayCount} plays`
      );
    }

    return { success: true, ...result };
  }

  // ==================== DATA EXPORT/IMPORT ====================

  async exportUserData() {
    await this.initialize();
    const data = await window.localDB.exportAllData();

    // Create download
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worldbridger-backup-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);

    console.log('📤 User data exported');
    return { success: true };
  }

  async importUserData(file) {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          await window.localDB.importData(data);
          resolve({ success: true, message: 'Data imported successfully' });
        } catch (error) {
          reject({ success: false, error: error.message });
        }
      };

      reader.readAsText(file);
    });
  }
}

// Create global instance
window.formAdapter = new FormStorageAdapter();

console.log('🔗 Form Storage Adapter loaded');
