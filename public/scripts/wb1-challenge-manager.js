/**
 * WB1 Challenge Manager - Challenge Workflow & Invitation System
 *
 * Handles:
 * - Challenge creation (1v1, group, open challenges)
 * - Multi-channel invitations (email, SMS, NFT invite tokens)
 * - Challenge acceptance/decline workflow
 * - Messaging dialogue between participants
 * - Challenge state management and notifications
 */

(function() {
  'use strict';

  // Storage keys
  const STORAGE_KEYS = {
    CHALLENGES: 'wb1_challenges',
    PENDING_INVITES: 'wb1_challenge_invites',
    MESSAGES: 'wb1_challenge_messages',
    NFT_INVITES: 'wb1_nft_invites',
    DRAFT_CHALLENGES: 'wb1_draft_challenges'
  };

  // Challenge types
  const CHALLENGE_TYPES = {
    RAP_BATTLE: 'rap_battle',
    BEAT_BATTLE: 'beat_battle',
    REMIX_CHALLENGE: 'remix_challenge',
    LEARNING_RACE: 'learning_race',
    ECO_CHALLENGE: 'eco_challenge',
    COLLAB_PROJECT: 'collab_project',
    FREESTYLE: 'freestyle',
    CUSTOM: 'custom'
  };

  // Challenge modes
  const CHALLENGE_MODES = {
    ONE_VS_ONE: '1v1',
    GROUP: 'group',
    OPEN: 'open',           // Anyone can join
    TOURNAMENT: 'tournament'
  };

  // Challenge states
  const CHALLENGE_STATES = {
    DRAFT: 'draft',
    PENDING: 'pending',       // Waiting for acceptance
    ACCEPTED: 'accepted',     // All parties accepted
    IN_PROGRESS: 'in_progress',
    VOTING: 'voting',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired'
  };

  // Invite methods
  const INVITE_METHODS = {
    INTERNAL: 'internal',     // In-app notification
    EMAIL: 'email',
    SMS: 'sms',
    NFT_TOKEN: 'nft_token',   // Mintable invite NFT
    LINK: 'link',             // Shareable link
    QR_CODE: 'qr_code'
  };

  // Message types
  const MESSAGE_TYPES = {
    TEXT: 'text',
    SYSTEM: 'system',
    AUDIO: 'audio',
    SUBMISSION: 'submission',
    REACTION: 'reaction',
    VOTE: 'vote'
  };

  /**
   * Generate unique ID
   */
  function generateId(prefix = 'ch') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate invite code (short, shareable)
   */
  function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * WB1 Challenge Manager Class
   */
  class WB1ChallengeManager {
    constructor() {
      this.challenges = [];
      this.pendingInvites = [];
      this.messages = {};
      this.initialized = false;
      this.eventListeners = {};
    }

    /**
     * Initialize the challenge manager
     */
    initialize() {
      if (this.initialized) return this;

      console.log('═══════════════════════════════════════');
      console.log('⚔️ WB1 Challenge Manager Initializing');
      console.log('═══════════════════════════════════════');

      this.loadChallenges();
      this.loadPendingInvites();
      this.loadMessages();

      // Check for expired challenges
      this.cleanupExpiredChallenges();

      this.initialized = true;

      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('wb1-challenges-ready', {
        detail: {
          totalChallenges: this.challenges.length,
          pendingInvites: this.pendingInvites.length
        }
      }));

      console.log('✅ Challenge Manager Ready');
      console.log('  - Total Challenges:', this.challenges.length);
      console.log('  - Pending Invites:', this.pendingInvites.length);
      console.log('═══════════════════════════════════════');

      return this;
    }

    // ========================================
    // CHALLENGE CREATION
    // ========================================

    /**
     * Create a new challenge
     */
    createChallenge(options) {
      const myWallet = this.getActiveWallet();
      if (!myWallet) {
        console.error('Cannot create challenge: no active wallet');
        return null;
      }

      const challenge = {
        id: generateId('challenge'),
        inviteCode: generateInviteCode(),

        // Creator info
        creator: {
          wallet: myWallet.address,
          username: options.creatorUsername || this.getUsername(myWallet.address),
          createdAt: new Date().toISOString()
        },

        // Challenge details
        type: options.type || CHALLENGE_TYPES.RAP_BATTLE,
        mode: options.mode || CHALLENGE_MODES.ONE_VS_ONE,
        title: options.title || this.getDefaultTitle(options.type),
        description: options.description || '',
        rules: options.rules || [],

        // Participants
        participants: [{
          wallet: myWallet.address,
          username: options.creatorUsername || this.getUsername(myWallet.address),
          role: 'creator',
          status: 'accepted',
          joinedAt: new Date().toISOString()
        }],
        maxParticipants: options.maxParticipants || (options.mode === CHALLENGE_MODES.ONE_VS_ONE ? 2 : 10),
        minParticipants: options.minParticipants || 2,

        // Invites sent
        invites: [],

        // Stakes/Rewards
        stakes: {
          type: options.stakesType || 'xp',  // xp, tokens, nft, none
          amount: options.stakesAmount || 50,
          pooled: options.stakesPooled || false
        },

        // Timing
        timing: {
          expiresAt: options.expiresAt || this.getDefaultExpiry(),
          startAt: options.startAt || null,
          endAt: options.endAt || null,
          votingEndsAt: options.votingEndsAt || null
        },

        // State
        state: CHALLENGE_STATES.DRAFT,
        stateHistory: [{
          state: CHALLENGE_STATES.DRAFT,
          timestamp: new Date().toISOString(),
          by: myWallet.address
        }],

        // Submissions
        submissions: [],

        // Voting
        voting: {
          enabled: options.votingEnabled !== false,
          type: options.votingType || 'community',  // community, judges, creator
          votes: []
        },

        // Results
        results: null,

        // Metadata
        metadata: {
          category: options.category || 'general',
          tags: options.tags || [],
          visibility: options.visibility || 'public',
          ...options.metadata
        }
      };

      // Use pre-set invite code/dbId if provided (from beat playground flow)
      if (options.inviteCode) challenge.inviteCode = options.inviteCode;
      if (options.dbId) challenge.dbId = options.dbId;
      if (options.beatConfig) challenge.beatConfig = options.beatConfig;

      this.challenges.push(challenge);
      this.saveChallenges();

      console.log('⚔️ Challenge created:', challenge.id, challenge.inviteCode);
      this.emit('challenge-created', challenge);

      // Sync to database (non-blocking)
      if (!options.dbId) {
        this.syncChallengeToServer(challenge).catch(err => {
          console.warn('DB sync failed (using localStorage):', err.message);
        });
      }

      return challenge;
    }

    /**
     * Sync a local challenge to the server database
     */
    async syncChallengeToServer(challenge) {
      try {
        const typeMap = {
          'Rap Battle': 'rap_battle',
          'Beat Battle': 'beat_battle',
          'Remix Challenge': 'remix_challenge',
          'Freestyle': 'freestyle',
          'Learning Race': 'learning_race',
          'Eco Challenge': 'eco_challenge'
        };

        const modeMap = {
          '1v1': '1v1',
          'Group': 'group',
          'Open': 'open'
        };

        const response = await fetch('/api/challenges/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creatorWallet: challenge.creator?.wallet || 'anonymous',
            title: challenge.title,
            description: challenge.description,
            type: typeMap[challenge.type] || 'rap_battle',
            mode: modeMap[challenge.mode] || '1v1',
            category: challenge.metadata?.category || 'freestyle',
            stakesType: challenge.stakes?.type || 'xp',
            stakesAmount: challenge.stakes?.amount || 50,
            beatConfig: challenge.beatConfig || null,
            maxParticipants: challenge.maxParticipants || 2,
            durationHours: 72,
            isPublic: challenge.metadata?.visibility !== 'private'
          })
        });

        if (response.ok) {
          const data = await response.json();
          // Update local challenge with server data
          challenge.dbId = data.challenge.id;
          challenge.inviteCode = data.challenge.inviteCode;
          this.saveChallenges();
          console.log('✅ Challenge synced to DB:', data.challenge.inviteCode);
          return data.challenge;
        }
      } catch (err) {
        console.warn('Challenge sync error:', err.message);
      }
      return null;
    }

    /**
     * Get default challenge title
     */
    getDefaultTitle(type) {
      const titles = {
        [CHALLENGE_TYPES.RAP_BATTLE]: 'Rap Battle Challenge',
        [CHALLENGE_TYPES.BEAT_BATTLE]: 'Beat Battle',
        [CHALLENGE_TYPES.REMIX_CHALLENGE]: 'Remix Challenge',
        [CHALLENGE_TYPES.LEARNING_RACE]: 'Learning Race',
        [CHALLENGE_TYPES.ECO_CHALLENGE]: 'Eco Challenge',
        [CHALLENGE_TYPES.COLLAB_PROJECT]: 'Collab Project',
        [CHALLENGE_TYPES.FREESTYLE]: 'Freestyle Session',
        [CHALLENGE_TYPES.CUSTOM]: 'Custom Challenge'
      };
      return titles[type] || 'New Challenge';
    }

    /**
     * Get default expiry (7 days from now)
     */
    getDefaultExpiry() {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7);
      return expiry.toISOString();
    }

    // ========================================
    // INVITATION SYSTEM
    // ========================================

    /**
     * Send challenge invitation
     */
    async sendInvite(challengeId, inviteData) {
      const challenge = this.getChallenge(challengeId);
      if (!challenge) {
        return { success: false, error: 'Challenge not found' };
      }

      const invite = {
        id: generateId('invite'),
        challengeId: challengeId,
        inviteCode: challenge.inviteCode,

        // Recipient info
        recipient: {
          wallet: inviteData.wallet || null,
          email: inviteData.email || null,
          phone: inviteData.phone || null,
          username: inviteData.username || null
        },

        // Invite method
        method: inviteData.method || INVITE_METHODS.INTERNAL,

        // Sender
        sentBy: this.getActiveWallet()?.address,
        sentAt: new Date().toISOString(),

        // Status
        status: 'pending',  // pending, sent, delivered, viewed, accepted, declined, expired
        statusHistory: [{
          status: 'pending',
          timestamp: new Date().toISOString()
        }],

        // For NFT invites
        nftData: inviteData.method === INVITE_METHODS.NFT_TOKEN ? {
          tokenId: null,
          mintTx: null,
          claimed: false
        } : null,

        // Message
        personalMessage: inviteData.message || '',

        // Expiry
        expiresAt: inviteData.expiresAt || challenge.timing.expiresAt
      };

      // Process based on invite method
      let result;
      switch (inviteData.method) {
        case INVITE_METHODS.EMAIL:
          result = await this.sendEmailInvite(invite, challenge);
          break;
        case INVITE_METHODS.SMS:
          result = await this.sendSMSInvite(invite, challenge);
          break;
        case INVITE_METHODS.NFT_TOKEN:
          result = await this.mintNFTInvite(invite, challenge);
          break;
        case INVITE_METHODS.LINK:
          result = this.generateInviteLink(invite, challenge);
          break;
        case INVITE_METHODS.QR_CODE:
          result = await this.generateQRInvite(invite, challenge);
          break;
        default:
          result = this.sendInternalInvite(invite, challenge);
      }

      if (result.success) {
        invite.status = 'sent';
        invite.statusHistory.push({
          status: 'sent',
          timestamp: new Date().toISOString(),
          details: result.details || {}
        });

        challenge.invites.push(invite);
        this.saveChallenges();

        // Add to pending invites for recipient (if internal)
        if (invite.recipient.wallet) {
          this.addPendingInvite(invite);
        }

        this.emit('invite-sent', { invite, challenge });
      }

      return { success: result.success, invite, ...result };
    }

    /**
     * Send internal (in-app) invite
     */
    sendInternalInvite(invite, challenge) {
      console.log('📨 Internal invite sent to:', invite.recipient.wallet || invite.recipient.username);
      return {
        success: true,
        details: { type: 'internal' }
      };
    }

    /**
     * Send email invite
     */
    async sendEmailInvite(invite, challenge) {
      if (!invite.recipient.email) {
        return { success: false, error: 'No email provided' };
      }

      try {
        // Call API to send email
        const response = await fetch('/api/challenges/send-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'email',
            email: invite.recipient.email,
            challengeId: challenge.id,
            inviteCode: challenge.inviteCode,
            challengeTitle: challenge.title,
            challengeType: challenge.type,
            senderWallet: invite.sentBy,
            message: invite.personalMessage,
            inviteLink: `${window.location.origin}/challenge/join/${challenge.inviteCode}`
          })
        });

        if (response.ok) {
          console.log('📧 Email invite sent to:', invite.recipient.email);
          return { success: true, details: { type: 'email', email: invite.recipient.email } };
        } else {
          // Store for later retry
          this.queueInviteForRetry(invite);
          return { success: true, details: { type: 'email', queued: true } };
        }
      } catch (error) {
        console.log('📧 Email queued for later:', invite.recipient.email);
        this.queueInviteForRetry(invite);
        return { success: true, details: { type: 'email', queued: true } };
      }
    }

    /**
     * Send SMS invite
     */
    async sendSMSInvite(invite, challenge) {
      if (!invite.recipient.phone) {
        return { success: false, error: 'No phone number provided' };
      }

      try {
        const response = await fetch('/api/challenges/send-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'sms',
            phone: invite.recipient.phone,
            challengeId: challenge.id,
            inviteCode: challenge.inviteCode,
            challengeTitle: challenge.title,
            message: `You've been challenged! ${challenge.title}. Join with code: ${challenge.inviteCode} or visit: ${window.location.origin}/challenge/join/${challenge.inviteCode}`
          })
        });

        if (response.ok) {
          console.log('📱 SMS invite sent to:', invite.recipient.phone);
          return { success: true, details: { type: 'sms', phone: invite.recipient.phone } };
        } else {
          this.queueInviteForRetry(invite);
          return { success: true, details: { type: 'sms', queued: true } };
        }
      } catch (error) {
        console.log('📱 SMS queued for later:', invite.recipient.phone);
        this.queueInviteForRetry(invite);
        return { success: true, details: { type: 'sms', queued: true } };
      }
    }

    /**
     * Mint NFT invite token
     */
    async mintNFTInvite(invite, challenge) {
      console.log('🎫 Minting NFT invite token...');

      const nftInvite = {
        id: invite.id,
        challengeId: challenge.id,
        inviteCode: challenge.inviteCode,
        creator: invite.sentBy,
        recipient: invite.recipient.wallet,
        metadata: {
          name: `Challenge Invite: ${challenge.title}`,
          description: `This NFT grants access to join "${challenge.title}". Use code: ${challenge.inviteCode}`,
          image: this.generateInviteNFTImage(challenge),
          attributes: [
            { trait_type: 'Challenge Type', value: challenge.type },
            { trait_type: 'Invite Code', value: challenge.inviteCode },
            { trait_type: 'Expires', value: challenge.timing.expiresAt }
          ],
          properties: {
            challengeId: challenge.id,
            inviteId: invite.id,
            oneTimeUse: true
          }
        },
        status: 'pending_mint',
        createdAt: new Date().toISOString()
      };

      // Store NFT invite data
      this.saveNFTInvite(nftInvite);

      // Try to mint via API
      try {
        const response = await fetch('/api/nft/mint-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nftInvite)
        });

        if (response.ok) {
          const data = await response.json();
          nftInvite.tokenId = data.tokenId;
          nftInvite.mintTx = data.txHash;
          nftInvite.status = 'minted';
          this.saveNFTInvite(nftInvite);

          console.log('🎫 NFT invite minted:', data.tokenId);
          return {
            success: true,
            details: { type: 'nft', tokenId: data.tokenId, txHash: data.txHash }
          };
        }
      } catch (error) {
        console.log('🎫 NFT mint queued for later');
      }

      // Return success with pending status (will mint when online)
      return {
        success: true,
        details: { type: 'nft', status: 'pending_mint', nftInvite }
      };
    }

    /**
     * Generate invite link
     */
    generateInviteLink(invite, challenge) {
      const link = `${window.location.origin}/challenge/join/${challenge.inviteCode}`;
      console.log('🔗 Invite link generated:', link);
      return {
        success: true,
        link: link,
        details: { type: 'link', link }
      };
    }

    /**
     * Generate QR code invite
     */
    async generateQRInvite(invite, challenge) {
      const link = `${window.location.origin}/challenge/join/${challenge.inviteCode}`;

      // Generate QR code (using a simple API or local library)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`;

      console.log('📱 QR invite generated');
      return {
        success: true,
        qrUrl: qrUrl,
        link: link,
        details: { type: 'qr', qrUrl, link }
      };
    }

    /**
     * Generate placeholder NFT image URL
     */
    generateInviteNFTImage(challenge) {
      // Return a placeholder or generate dynamic image
      return `${window.location.origin}/images/challenge-invite-${challenge.type}.png`;
    }

    /**
     * Queue invite for retry when online
     */
    queueInviteForRetry(invite) {
      try {
        const queue = JSON.parse(localStorage.getItem('wb1_invite_queue') || '[]');
        queue.push({
          invite,
          queuedAt: new Date().toISOString(),
          retryCount: 0
        });
        localStorage.setItem('wb1_invite_queue', JSON.stringify(queue));
      } catch (e) {
        console.error('Error queuing invite:', e);
      }
    }

    // ========================================
    // CHALLENGE ACCEPTANCE
    // ========================================

    /**
     * Join challenge by invite code
     */
    joinChallengeByCode(inviteCode) {
      const challenge = this.challenges.find(c => c && c.inviteCode === inviteCode);
      if (!challenge) {
        // Try to fetch from server
        return this.fetchAndJoinChallenge(inviteCode);
      }
      return this.acceptChallenge(challenge.id);
    }

    /**
     * Accept a challenge
     */
    acceptChallenge(challengeId, acceptData = {}) {
      const challenge = this.getChallenge(challengeId);
      if (!challenge) {
        return { success: false, error: 'Challenge not found' };
      }

      const myWallet = this.getActiveWallet();
      if (!myWallet) {
        return { success: false, error: 'No wallet connected' };
      }

      // Check if already a participant
      if (challenge.participants.find(p => p.wallet === myWallet.address)) {
        return { success: false, error: 'Already a participant' };
      }

      // Check if challenge is full
      if (challenge.participants.length >= challenge.maxParticipants) {
        return { success: false, error: 'Challenge is full' };
      }

      // Check if expired
      if (new Date(challenge.timing.expiresAt) < new Date()) {
        return { success: false, error: 'Challenge has expired' };
      }

      // Add as participant
      const participant = {
        wallet: myWallet.address,
        username: acceptData.username || this.getUsername(myWallet.address),
        role: 'challenger',
        status: 'accepted',
        joinedAt: new Date().toISOString()
      };

      challenge.participants.push(participant);

      // Update challenge state if enough participants
      if (challenge.participants.length >= challenge.minParticipants) {
        if (challenge.state === CHALLENGE_STATES.PENDING) {
          this.updateChallengeState(challengeId, CHALLENGE_STATES.ACCEPTED);
        }
      }

      // Mark invite as accepted
      const invite = challenge.invites.find(i =>
        i.recipient.wallet === myWallet.address && i.status === 'pending'
      );
      if (invite) {
        invite.status = 'accepted';
        invite.statusHistory.push({
          status: 'accepted',
          timestamp: new Date().toISOString()
        });
      }

      // Remove from pending invites
      this.removePendingInvite(challengeId);

      this.saveChallenges();

      // Add system message
      this.addMessage(challengeId, {
        type: MESSAGE_TYPES.SYSTEM,
        content: `${participant.username} has joined the challenge!`
      });

      console.log('✅ Challenge accepted:', challengeId);
      this.emit('challenge-accepted', { challenge, participant });

      return { success: true, challenge };
    }

    /**
     * Decline a challenge
     */
    declineChallenge(challengeId, reason = '') {
      const myWallet = this.getActiveWallet();
      if (!myWallet) {
        return { success: false, error: 'No wallet connected' };
      }

      const challenge = this.getChallenge(challengeId);
      if (challenge) {
        const invite = challenge.invites.find(i =>
          i.recipient.wallet === myWallet.address && i.status !== 'declined'
        );
        if (invite) {
          invite.status = 'declined';
          invite.statusHistory.push({
            status: 'declined',
            timestamp: new Date().toISOString(),
            reason: reason
          });
          this.saveChallenges();
        }
      }

      this.removePendingInvite(challengeId);

      console.log('❌ Challenge declined:', challengeId);
      this.emit('challenge-declined', { challengeId, reason });

      return { success: true };
    }

    /**
     * Fetch challenge from server and join
     */
    async fetchAndJoinChallenge(inviteCode) {
      try {
        const wallet = this.getActiveWallet()?.address;
        const response = await fetch(`/api/challenges/join/${inviteCode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet })
        });

        const data = await response.json();

        if (data.success && data.challenge) {
          // Convert server challenge format to local format
          const serverChallenge = data.challenge;
          const localChallenge = {
            id: generateId('challenge'),
            dbId: serverChallenge.id,
            inviteCode: serverChallenge.inviteCode,
            creator: {
              wallet: serverChallenge.creator?.wallet,
              username: serverChallenge.creator?.name,
              createdAt: serverChallenge.createdAt
            },
            type: serverChallenge.type,
            mode: serverChallenge.mode,
            title: serverChallenge.title,
            description: serverChallenge.description || '',
            participants: [{
              wallet: wallet,
              username: this.getUsername(wallet),
              role: 'challenger',
              status: 'accepted',
              joinedAt: new Date().toISOString()
            }],
            maxParticipants: serverChallenge.maxParticipants || 2,
            minParticipants: 2,
            invites: [],
            stakes: serverChallenge.stakes || { type: 'xp', amount: 50 },
            timing: {
              expiresAt: serverChallenge.expiresAt,
              startAt: null,
              endAt: null,
              votingEndsAt: null
            },
            state: serverChallenge.status || 'pending',
            stateHistory: [],
            submissions: [],
            voting: { enabled: true, type: 'community', votes: [] },
            results: null,
            metadata: {
              category: serverChallenge.category || 'general',
              tags: [],
              visibility: serverChallenge.isPublic ? 'public' : 'private'
            },
            beatConfig: serverChallenge.beatConfig || null
          };

          // Check if already in local challenges
          const existing = this.challenges.find(c =>
            c.inviteCode === inviteCode || c.dbId === serverChallenge.id
          );
          if (!existing) {
            this.challenges.push(localChallenge);
            this.saveChallenges();
          }

          this.emit('challenge-joined', localChallenge);
          return { success: true, challenge: localChallenge, alreadyJoined: data.alreadyJoined };
        }

        return { success: false, error: data.error || 'Failed to join challenge' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    // ========================================
    // MESSAGING SYSTEM
    // ========================================

    /**
     * Add message to challenge dialogue
     */
    addMessage(challengeId, messageData) {
      const myWallet = this.getActiveWallet();

      const message = {
        id: generateId('msg'),
        challengeId: challengeId,
        type: messageData.type || MESSAGE_TYPES.TEXT,
        content: messageData.content,

        sender: messageData.type === MESSAGE_TYPES.SYSTEM ? null : {
          wallet: myWallet?.address,
          username: messageData.username || this.getUsername(myWallet?.address)
        },

        // For audio messages
        audioUrl: messageData.audioUrl || null,
        audioDuration: messageData.audioDuration || null,

        // For submissions
        submissionData: messageData.submissionData || null,

        // Reactions
        reactions: [],

        // Timestamps
        createdAt: new Date().toISOString(),
        editedAt: null,
        deleted: false
      };

      if (!this.messages[challengeId]) {
        this.messages[challengeId] = [];
      }

      this.messages[challengeId].push(message);
      this.saveMessages();

      // Notify
      this.emit('message-added', { challengeId, message });

      return message;
    }

    /**
     * Send text message
     */
    sendMessage(challengeId, text) {
      return this.addMessage(challengeId, {
        type: MESSAGE_TYPES.TEXT,
        content: text
      });
    }

    /**
     * Send audio message (voice note)
     */
    sendAudioMessage(challengeId, audioBlob, duration) {
      // Store audio locally or upload
      const audioUrl = URL.createObjectURL(audioBlob);

      return this.addMessage(challengeId, {
        type: MESSAGE_TYPES.AUDIO,
        content: 'Voice message',
        audioUrl: audioUrl,
        audioDuration: duration
      });
    }

    /**
     * Submit entry to challenge
     */
    submitEntry(challengeId, submissionData) {
      const challenge = this.getChallenge(challengeId);
      if (!challenge) {
        return { success: false, error: 'Challenge not found' };
      }

      const myWallet = this.getActiveWallet();
      if (!myWallet) {
        return { success: false, error: 'No wallet connected' };
      }

      const submission = {
        id: generateId('sub'),
        challengeId: challengeId,
        participant: myWallet.address,
        type: submissionData.type,  // audio, video, text, file
        content: submissionData.content,
        fileUrl: submissionData.fileUrl || null,
        metadata: submissionData.metadata || {},
        submittedAt: new Date().toISOString(),
        votes: 0,
        reactions: []
      };

      challenge.submissions.push(submission);
      this.saveChallenges();

      // Add system message
      this.addMessage(challengeId, {
        type: MESSAGE_TYPES.SUBMISSION,
        content: `New submission from ${this.getUsername(myWallet.address)}`,
        submissionData: submission
      });

      this.emit('submission-added', { challengeId, submission });

      return { success: true, submission };
    }

    /**
     * Add reaction to message
     */
    addReaction(challengeId, messageId, emoji) {
      const messages = this.messages[challengeId];
      if (!messages) return false;

      const message = messages.find(m => m.id === messageId);
      if (!message) return false;

      const myWallet = this.getActiveWallet();
      const existingReaction = message.reactions.find(r =>
        r.wallet === myWallet?.address && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove reaction
        message.reactions = message.reactions.filter(r =>
          !(r.wallet === myWallet?.address && r.emoji === emoji)
        );
      } else {
        // Add reaction
        message.reactions.push({
          wallet: myWallet?.address,
          emoji: emoji,
          timestamp: new Date().toISOString()
        });
      }

      this.saveMessages();
      this.emit('reaction-changed', { challengeId, messageId, message });

      return true;
    }

    /**
     * Get messages for challenge
     */
    getMessages(challengeId, options = {}) {
      const messages = this.messages[challengeId] || [];

      // Filter deleted messages unless requested
      let filtered = options.includeDeleted
        ? messages
        : messages.filter(m => !m.deleted);

      // Limit
      if (options.limit) {
        filtered = filtered.slice(-options.limit);
      }

      return filtered;
    }

    // ========================================
    // CHALLENGE STATE MANAGEMENT
    // ========================================

    /**
     * Update challenge state
     */
    updateChallengeState(challengeId, newState, metadata = {}) {
      const challenge = this.getChallenge(challengeId);
      if (!challenge) return false;

      const myWallet = this.getActiveWallet();

      challenge.state = newState;
      challenge.stateHistory.push({
        state: newState,
        timestamp: new Date().toISOString(),
        by: myWallet?.address,
        ...metadata
      });

      this.saveChallenges();

      // Add system message
      const stateMessages = {
        [CHALLENGE_STATES.PENDING]: 'Challenge is now open for participants!',
        [CHALLENGE_STATES.ACCEPTED]: 'All participants are ready!',
        [CHALLENGE_STATES.IN_PROGRESS]: 'Challenge has begun! Good luck!',
        [CHALLENGE_STATES.VOTING]: 'Submissions closed. Voting is now open!',
        [CHALLENGE_STATES.COMPLETED]: 'Challenge completed!',
        [CHALLENGE_STATES.CANCELLED]: 'Challenge has been cancelled.',
        [CHALLENGE_STATES.EXPIRED]: 'Challenge has expired.'
      };

      if (stateMessages[newState]) {
        this.addMessage(challengeId, {
          type: MESSAGE_TYPES.SYSTEM,
          content: stateMessages[newState]
        });
      }

      this.emit('state-changed', { challengeId, newState, challenge });

      return true;
    }

    /**
     * Start challenge
     */
    startChallenge(challengeId) {
      const challenge = this.getChallenge(challengeId);
      if (!challenge) return { success: false, error: 'Challenge not found' };

      if (challenge.participants.length < challenge.minParticipants) {
        return { success: false, error: 'Not enough participants' };
      }

      challenge.timing.startAt = new Date().toISOString();
      this.updateChallengeState(challengeId, CHALLENGE_STATES.IN_PROGRESS);

      return { success: true, challenge };
    }

    /**
     * End submissions and start voting
     */
    startVoting(challengeId) {
      const challenge = this.getChallenge(challengeId);
      if (!challenge) return { success: false, error: 'Challenge not found' };

      challenge.timing.endAt = new Date().toISOString();
      const votingDuration = 24 * 60 * 60 * 1000; // 24 hours
      challenge.timing.votingEndsAt = new Date(Date.now() + votingDuration).toISOString();

      this.updateChallengeState(challengeId, CHALLENGE_STATES.VOTING);

      return { success: true, challenge };
    }

    /**
     * Cast vote
     */
    castVote(challengeId, submissionId) {
      const challenge = this.getChallenge(challengeId);
      if (!challenge) return { success: false, error: 'Challenge not found' };

      if (challenge.state !== CHALLENGE_STATES.VOTING) {
        return { success: false, error: 'Voting is not open' };
      }

      const myWallet = this.getActiveWallet();
      if (!myWallet) return { success: false, error: 'No wallet connected' };

      // Check if already voted
      const existingVote = challenge.voting.votes.find(v => v.voter === myWallet.address);
      if (existingVote) {
        return { success: false, error: 'Already voted' };
      }

      challenge.voting.votes.push({
        voter: myWallet.address,
        submissionId: submissionId,
        timestamp: new Date().toISOString()
      });

      // Update submission vote count
      const submission = challenge.submissions.find(s => s.id === submissionId);
      if (submission) {
        submission.votes = (submission.votes || 0) + 1;
      }

      this.saveChallenges();
      this.emit('vote-cast', { challengeId, submissionId, voter: myWallet.address });

      return { success: true };
    }

    /**
     * Complete challenge and determine winner
     */
    completeChallenge(challengeId) {
      const challenge = this.getChallenge(challengeId);
      if (!challenge) return { success: false, error: 'Challenge not found' };

      // Determine winner based on votes
      const submissions = challenge.submissions.sort((a, b) => b.votes - a.votes);
      const winner = submissions[0];

      challenge.results = {
        winner: winner ? {
          submissionId: winner.id,
          participant: winner.participant,
          votes: winner.votes
        } : null,
        rankings: submissions.map((s, i) => ({
          rank: i + 1,
          submissionId: s.id,
          participant: s.participant,
          votes: s.votes
        })),
        completedAt: new Date().toISOString()
      };

      this.updateChallengeState(challengeId, CHALLENGE_STATES.COMPLETED);

      // Award XP/stakes
      if (winner && window.progressManager) {
        window.progressManager.awardXP(
          challenge.stakes.amount,
          'challenge_win',
          `Won: ${challenge.title}`
        );
      }

      return { success: true, results: challenge.results };
    }

    // ========================================
    // HELPERS
    // ========================================

    /**
     * Get challenge by ID
     */
    getChallenge(challengeId) {
      return this.challenges.find(c => c && c.id === challengeId);
    }

    /**
     * Get my challenges (created or participating)
     */
    getMyChallenges() {
      const myWallet = this.getActiveWallet();
      if (!myWallet) return [];

      return this.challenges.filter(c =>
        c && c.creator && (
          c.creator.wallet === myWallet.address ||
          (c.participants && c.participants.some(p => p && p.wallet === myWallet.address))
        )
      );
    }

    /**
     * Get active challenges
     */
    getActiveChallenges() {
      const activeStates = [
        CHALLENGE_STATES.PENDING,
        CHALLENGE_STATES.ACCEPTED,
        CHALLENGE_STATES.IN_PROGRESS,
        CHALLENGE_STATES.VOTING
      ];
      return this.challenges.filter(c => c && activeStates.includes(c.state));
    }

    /**
     * Get username from wallet
     */
    getUsername(wallet) {
      if (!wallet) return 'Anonymous';
      // Try to get from wb1User or progress
      return 'User_' + wallet.substring(0, 6);
    }

    /**
     * Get active wallet
     */
    getActiveWallet() {
      if (window.wb1User) {
        return window.wb1User.getActiveWallet();
      }
      const publicKey = localStorage.getItem('wallet_publicKey');
      if (publicKey) return { address: publicKey, type: 'created' };
      const anon = localStorage.getItem('anonymousWallet');
      if (anon) return { address: anon, type: 'anonymous' };
      return null;
    }

    // ========================================
    // STORAGE
    // ========================================

    loadChallenges() {
      try {
        const data = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
        const parsed = data ? JSON.parse(data) : [];
        // Filter out any null/undefined/invalid entries
        this.challenges = Array.isArray(parsed) ? parsed.filter(c => c && c.id) : [];
      } catch (e) {
        this.challenges = [];
      }
    }

    saveChallenges() {
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(this.challenges));
    }

    loadPendingInvites() {
      try {
        const data = localStorage.getItem(STORAGE_KEYS.PENDING_INVITES);
        this.pendingInvites = data ? JSON.parse(data) : [];
      } catch (e) {
        this.pendingInvites = [];
      }
    }

    savePendingInvites() {
      localStorage.setItem(STORAGE_KEYS.PENDING_INVITES, JSON.stringify(this.pendingInvites));
    }

    addPendingInvite(invite) {
      this.pendingInvites.push({
        inviteId: invite.id,
        challengeId: invite.challengeId,
        inviteCode: invite.inviteCode,
        from: invite.sentBy,
        receivedAt: new Date().toISOString()
      });
      this.savePendingInvites();
    }

    removePendingInvite(challengeId) {
      this.pendingInvites = this.pendingInvites.filter(i => i.challengeId !== challengeId);
      this.savePendingInvites();
    }

    loadMessages() {
      try {
        const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
        this.messages = data ? JSON.parse(data) : {};
      } catch (e) {
        this.messages = {};
      }
    }

    saveMessages() {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(this.messages));
    }

    saveNFTInvite(nftInvite) {
      try {
        const nfts = JSON.parse(localStorage.getItem(STORAGE_KEYS.NFT_INVITES) || '[]');
        const idx = nfts.findIndex(n => n.id === nftInvite.id);
        if (idx >= 0) {
          nfts[idx] = nftInvite;
        } else {
          nfts.push(nftInvite);
        }
        localStorage.setItem(STORAGE_KEYS.NFT_INVITES, JSON.stringify(nfts));
      } catch (e) {
        console.error('Error saving NFT invite:', e);
      }
    }

    cleanupExpiredChallenges() {
      const now = new Date();
      this.challenges.forEach(challenge => {
        if (!challenge || !challenge.state || !challenge.timing) return;
        if (challenge.state !== CHALLENGE_STATES.COMPLETED &&
            challenge.state !== CHALLENGE_STATES.CANCELLED &&
            challenge.state !== CHALLENGE_STATES.EXPIRED) {
          if (new Date(challenge.timing.expiresAt) < now) {
            this.updateChallengeState(challenge.id, CHALLENGE_STATES.EXPIRED);
          }
        }
      });
    }

    // ========================================
    // EVENT SYSTEM
    // ========================================

    on(event, callback) {
      if (!this.eventListeners[event]) {
        this.eventListeners[event] = [];
      }
      this.eventListeners[event].push(callback);
    }

    off(event, callback) {
      if (this.eventListeners[event]) {
        this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
      }
    }

    emit(event, data) {
      if (this.eventListeners[event]) {
        this.eventListeners[event].forEach(cb => cb(data));
      }
      // Also dispatch DOM event
      window.dispatchEvent(new CustomEvent(`wb1-${event}`, { detail: data }));
    }
  }

  // Create and expose global instance
  window.WB1ChallengeManager = WB1ChallengeManager;
  window.wb1Challenges = new WB1ChallengeManager();

  // Expose constants
  window.WB1_CHALLENGE_TYPES = CHALLENGE_TYPES;
  window.WB1_CHALLENGE_MODES = CHALLENGE_MODES;
  window.WB1_CHALLENGE_STATES = CHALLENGE_STATES;
  window.WB1_INVITE_METHODS = INVITE_METHODS;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.wb1Challenges.initialize());
  } else {
    window.wb1Challenges.initialize();
  }

})();
