/**
 * BattleManager.js
 * Real-time Battle Management System
 * 
 * Handles live battle state, real-time updates, and phase transitions
 * Uses vanilla JS class structure with Supabase real-time subscriptions
 */

class BattleManager {
  constructor(battleId, supabaseClient) {
    this.battleId = battleId;
    this.supabase = supabaseClient;
    
    // State
    this.battleData = null;
    this.currentUser = null;
    this.isParticipant = false;
    this.participantType = null; // 'challenger' or 'opponent'
    this.currentPhase = 'PREP'; // PREP, LIVE, FOLLOWUP
    
    // Real-time subscriptions
    this.subscriptions = {
      battle: null,
      rounds: null,
      submissions: null,
      votes: null,
      reactions: null,
      comments: null
    };
    
    // Timers
    this.timers = new Map();
    
    // Event handlers
    this.eventHandlers = {
      battleUpdate: [],
      roundUpdate: [],
      submissionUpdate: [],
      voteUpdate: [],
      reactionUpdate: [],
      commentUpdate: [],
      phaseChange: [],
      timerTick: []
    };
  }

  /**
   * Initialize the battle manager
   */
  async initialize() {
    try {
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser();
      this.currentUser = user;
      
      // Load initial battle data
      await this.loadBattleData();
      
      // Check if user is participant
      this.checkParticipantStatus();
      
      // Setup real-time subscriptions
      this.setupRealtimeSubscriptions();
      
      // Start timers
      this.startTimers();
      
      console.log('BattleManager initialized', {
        battleId: this.battleId,
        isParticipant: this.isParticipant,
        phase: this.currentPhase
      });
      
      return true;
    } catch (error) {
      console.error('Failed to initialize BattleManager:', error);
      return false;
    }
  }

  /**
   * Load battle data from Supabase
   */
  async loadBattleData() {
    const { data, error } = await this.supabase
      .from('battles')
      .select(`
        *,
        challenger:users!battles_challenger_id_fkey(id, username, level, wallet_address),
        opponent:users!battles_opponent_id_fkey(id, username, level, wallet_address),
        rounds:battle_rounds(
          *,
          submissions:battle_submissions(
            *,
            user:users(id, username, level)
          ),
          votes:battle_votes(count)
        )
      `)
      .eq('id', this.battleId)
      .single();
    
    if (error) throw error;
    
    this.battleData = data;
    this.currentPhase = data.phase;
    
    // Emit battle update
    this.emit('battleUpdate', data);
  }

  /**
   * Check if current user is a participant
   */
  checkParticipantStatus() {
    if (!this.currentUser || !this.battleData) {
      this.isParticipant = false;
      return;
    }
    
    if (this.battleData.challenger_id === this.currentUser.id) {
      this.isParticipant = true;
      this.participantType = 'challenger';
    } else if (this.battleData.opponent_id === this.currentUser.id) {
      this.isParticipant = true;
      this.participantType = 'opponent';
    } else {
      this.isParticipant = false;
      this.participantType = null;
    }
  }

  /**
   * Setup real-time subscriptions for live updates
   */
  setupRealtimeSubscriptions() {
    // Battle updates
    this.subscriptions.battle = this.supabase
      .channel(`battle:${this.battleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battles',
          filter: `id=eq.${this.battleId}`
        },
        (payload) => this.handleBattleUpdate(payload)
      )
      .subscribe();

    // Round updates
    this.subscriptions.rounds = this.supabase
      .channel(`battle_rounds:${this.battleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_rounds',
          filter: `battle_id=eq.${this.battleId}`
        },
        (payload) => this.handleRoundUpdate(payload)
      )
      .subscribe();

    // Submission updates
    this.subscriptions.submissions = this.supabase
      .channel(`battle_submissions:${this.battleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_submissions',
          filter: `battle_id=eq.${this.battleId}`
        },
        (payload) => this.handleSubmissionUpdate(payload)
      )
      .subscribe();

    // Vote updates
    this.subscriptions.votes = this.supabase
      .channel(`battle_votes:${this.battleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'battle_votes',
          filter: `battle_id=eq.${this.battleId}`
        },
        (payload) => this.handleVoteUpdate(payload)
      )
      .subscribe();

    // Reaction updates
    this.subscriptions.reactions = this.supabase
      .channel(`battle_reactions:${this.battleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'battle_reactions',
          filter: `battle_id=eq.${this.battleId}`
        },
        (payload) => this.handleReactionUpdate(payload)
      )
      .subscribe();

    // Comment updates
    this.subscriptions.comments = this.supabase
      .channel(`battle_comments:${this.battleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_comments',
          filter: `battle_id=eq.${this.battleId}`
        },
        (payload) => this.handleCommentUpdate(payload)
      )
      .subscribe();

    // Presence tracking (who's watching)
    this.subscriptions.battle.on('presence', { event: 'sync' }, () => {
      const state = this.subscriptions.battle.presenceState();
      const spectatorCount = Object.keys(state).length;
      this.updateSpectatorCount(spectatorCount);
    });

    // Join presence
    if (this.currentUser) {
      this.subscriptions.battle.track({
        user_id: this.currentUser.id,
        online_at: new Date().toISOString()
      });
    }
  }

  /**
   * Handle real-time battle updates
   */
  handleBattleUpdate(payload) {
    const { eventType, new: newData, old: oldData } = payload;
    
    console.log('Battle updated:', eventType, newData);
    
    // Check for phase changes
    if (oldData && oldData.phase !== newData.phase) {
      this.onPhaseChange(oldData.phase, newData.phase);
    }
    
    // Update local state
    this.battleData = { ...this.battleData, ...newData };
    this.currentPhase = newData.phase;
    
    // Emit event
    this.emit('battleUpdate', newData);
  }

  /**
   * Handle round updates
   */
  handleRoundUpdate(payload) {
    console.log('Round updated:', payload);
    this.emit('roundUpdate', payload.new);
  }

  /**
   * Handle submission updates
   */
  handleSubmissionUpdate(payload) {
    console.log('Submission updated:', payload);
    
    const submission = payload.new;
    
    // If submission became visible, reload battle data
    if (submission.is_visible) {
      this.loadBattleData();
    }
    
    this.emit('submissionUpdate', submission);
  }

  /**
   * Handle vote updates
   */
  handleVoteUpdate(payload) {
    console.log('Vote received:', payload);
    this.emit('voteUpdate', payload.new);
  }

  /**
   * Handle reaction updates
   */
  handleReactionUpdate(payload) {
    console.log('Reaction received:', payload);
    this.emit('reactionUpdate', payload.new);
  }

  /**
   * Handle comment updates
   */
  handleCommentUpdate(payload) {
    console.log('Comment received:', payload);
    this.emit('commentUpdate', payload.new);
  }

  /**
   * Handle phase changes
   */
  onPhaseChange(oldPhase, newPhase) {
    console.log(`Phase changed: ${oldPhase} -> ${newPhase}`);
    
    // Perform phase-specific actions
    switch (newPhase) {
      case 'LIVE':
        this.onGoLive();
        break;
      case 'FOLLOWUP':
        this.onBattleEnd();
        break;
    }
    
    this.emit('phaseChange', { oldPhase, newPhase });
  }

  /**
   * Start timers for countdowns
   */
  startTimers() {
    // Clear existing timers
    this.timers.forEach(timer => clearInterval(timer));
    this.timers.clear();
    
    // Round deadline timer
    const roundTimer = setInterval(() => {
      this.updateRoundTimers();
    }, 1000);
    
    this.timers.set('round', roundTimer);
  }

  /**
   * Update round countdown timers
   */
  updateRoundTimers() {
    if (!this.battleData || !this.battleData.rounds) return;
    
    const currentRound = this.battleData.rounds.find(
      r => r.round_number === this.battleData.current_round
    );
    
    if (currentRound && currentRound.submission_deadline) {
      const deadline = new Date(currentRound.submission_deadline);
      const now = new Date();
      const remaining = deadline - now;
      
      if (remaining > 0) {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        
        this.emit('timerTick', {
          roundNumber: currentRound.round_number,
          remaining,
          formatted: `${hours}h ${minutes}m ${seconds}s`
        });
      } else {
        // Time's up - auto-forfeit if no submission
        this.handleRoundTimeout(currentRound);
      }
    }
  }

  // ==========================================
  // BATTLE ACTIONS
  // ==========================================

  /**
   * Accept battle challenge (opponent)
   */
  async acceptChallenge() {
    if (!this.isParticipant || this.participantType !== 'opponent') {
      throw new Error('Only the challenged opponent can accept');
    }
    
    const { error } = await this.supabase
      .from('battles')
      .update({
        status: 'ACCEPTED',
        updated_at: new Date().toISOString()
      })
      .eq('id', this.battleId);
    
    if (error) throw error;
    
    // Create initial rounds
    await this.createRounds();
    
    // Log event
    await this.logEvent('CHALLENGE_ACCEPTED', { user_id: this.currentUser.id });
  }

  /**
   * Create battle rounds
   */
  async createRounds() {
    const rounds = [];
    for (let i = 1; i <= this.battleData.total_rounds; i++) {
      rounds.push({
        battle_id: this.battleId,
        round_number: i,
        status: i === 1 ? 'ACTIVE' : 'PENDING',
        submission_deadline: i === 1 ? 
          new Date(Date.now() + this.battleData.time_limit_hours * 60 * 60 * 1000).toISOString() :
          null
      });
    }
    
    const { error } = await this.supabase
      .from('battle_rounds')
      .insert(rounds);
    
    if (error) throw error;
  }

  /**
   * Submit bars for current round
   */
  async submitBars(bars, audioFile = null) {
    if (!this.isParticipant) {
      throw new Error('Only participants can submit bars');
    }
    
    const currentRound = this.battleData.rounds.find(
      r => r.round_number === this.battleData.current_round
    );
    
    if (!currentRound) {
      throw new Error('No active round');
    }
    
    // Check if already submitted
    const existingSubmission = currentRound.submissions?.find(
      s => s.user_id === this.currentUser.id
    );
    
    if (existingSubmission) {
      throw new Error('Already submitted for this round');
    }
    
    // Validate line count
    const lines = bars.split('\n').filter(line => line.trim());
    if (lines.length !== this.battleData.bars_per_round) {
      throw new Error(`Must submit exactly ${this.battleData.bars_per_round} lines`);
    }
    
    // Upload audio if provided
    let audioUrl = null;
    if (audioFile) {
      audioUrl = await this.uploadAudio(audioFile);
    }
    
    // Insert submission
    const { data, error } = await this.supabase
      .from('battle_submissions')
      .insert({
        round_id: currentRound.id,
        battle_id: this.battleId,
        user_id: this.currentUser.id,
        participant_type: this.participantType,
        bars,
        line_count: lines.length,
        audio_url: audioUrl
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Log event
    await this.logEvent('SUBMISSION_CREATED', {
      round_number: currentRound.round_number,
      participant: this.participantType
    });
    
    return data;
  }

  /**
   * Upload audio file to Supabase storage
   */
  async uploadAudio(file) {
    const fileName = `${this.battleId}/${Date.now()}_${file.name}`;
    
    const { data, error } = await this.supabase.storage
      .from('battle-audio')
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = this.supabase.storage
      .from('battle-audio')
      .getPublicUrl(fileName);
    
    return publicUrl;
  }

  /**
   * Vote on current round
   */
  async submitVote(voteFor, detailedScores = null) {
    if (this.isParticipant) {
      throw new Error('Participants cannot vote on their own battle');
    }
    
    const currentRound = this.battleData.rounds.find(
      r => r.round_number === this.battleData.current_round
    );
    
    if (!currentRound || currentRound.status !== 'VOTING') {
      throw new Error('Voting not open for this round');
    }
    
    // Check if already voted
    const { data: existingVote } = await this.supabase
      .from('battle_votes')
      .select('id')
      .eq('round_id', currentRound.id)
      .eq('voter_id', this.currentUser.id)
      .single();
    
    if (existingVote) {
      throw new Error('Already voted on this round');
    }
    
    // Insert vote
    const { data, error } = await this.supabase
      .from('battle_votes')
      .insert({
        round_id: currentRound.id,
        battle_id: this.battleId,
        voter_id: this.currentUser.id,
        voter_type: 'peer',
        vote_for: voteFor,
        ...detailedScores
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Award XP to voter
    await this.awardVoterXP(10);
    
    return data;
  }

  /**
   * Add reaction to battle
   */
  async addReaction(reactionType, targetType = 'battle', targetId = null) {
    const { data, error } = await this.supabase
      .from('battle_reactions')
      .insert({
        battle_id: this.battleId,
        user_id: this.currentUser.id,
        reaction_type: reactionType,
        target_type: targetType,
        target_id: targetId
      })
      .select()
      .single();
    
    if (error) {
      // If unique constraint violated, remove reaction
      if (error.code === '23505') {
        return await this.removeReaction(reactionType, targetType, targetId);
      }
      throw error;
    }
    
    return data;
  }

  /**
   * Remove reaction
   */
  async removeReaction(reactionType, targetType, targetId) {
    const { error } = await this.supabase
      .from('battle_reactions')
      .delete()
      .eq('battle_id', this.battleId)
      .eq('user_id', this.currentUser.id)
      .eq('reaction_type', reactionType)
      .eq('target_type', targetType)
      .eq('target_id', targetId);
    
    if (error) throw error;
  }

  /**
   * Post comment
   */
  async postComment(content, roundNumber = null) {
    const { data, error } = await this.supabase
      .from('battle_comments')
      .insert({
        battle_id: this.battleId,
        user_id: this.currentUser.id,
        content,
        round_number: roundNumber
      })
      .select(`
        *,
        user:users(id, username, level)
      `)
      .single();
    
    if (error) throw error;
    
    return data;
  }

  // ==========================================
  // PHASE TRANSITIONS
  // ==========================================

  /**
   * Transition battle to LIVE phase
   */
  async goLive() {
    if (this.battleData.phase !== 'PREP') {
      throw new Error('Battle must be in PREP phase to go live');
    }
    
    const { error } = await this.supabase
      .from('battles')
      .update({
        phase: 'LIVE',
        status: 'IN_PROGRESS',
        actual_start: new Date().toISOString()
      })
      .eq('id', this.battleId);
    
    if (error) throw error;
    
    await this.logEvent('BATTLE_WENT_LIVE');
  }

  /**
   * Handle battle going live
   */
  onGoLive() {
    console.log('Battle is now LIVE!');
    // Notify participants
    // Start first round timer
  }

  /**
   * End battle and transition to FOLLOWUP
   */
  async endBattle() {
    // Calculate final scores
    const winner = await this.calculateWinner();
    
    const { error } = await this.supabase
      .from('battles')
      .update({
        phase: 'FOLLOWUP',
        status: 'COMPLETED',
        actual_end: new Date().toISOString(),
        winner_id: winner.id,
        winning_score: winner.score
      })
      .eq('id', this.battleId);
    
    if (error) throw error;
    
    // Award prizes and XP
    await this.distributePrizes(winner);
    
    await this.logEvent('BATTLE_ENDED', { winner_id: winner.id });
  }

  /**
   * Handle battle ending
   */
  onBattleEnd() {
    console.log('Battle has ended');
    // Display results
    // Award achievements
  }

  /**
   * Calculate battle winner
   */
  async calculateWinner() {
    // Get all votes
    const { data: votes } = await this.supabase
      .from('battle_votes')
      .select('*')
      .eq('battle_id', this.battleId);
    
    // Weighted scoring:
    // 40% Peer votes
    // 30% Expert votes
    // 30% AI votes
    
    let challengerScore = 0;
    let opponentScore = 0;
    
    const peerVotes = votes.filter(v => v.voter_type === 'peer');
    const expertVotes = votes.filter(v => v.voter_type === 'expert');
    const aiVotes = votes.filter(v => v.voter_type === 'ai');
    
    // Count votes
    const challengerPeer = peerVotes.filter(v => v.vote_for === 'challenger').length;
    const opponentPeer = peerVotes.filter(v => v.vote_for === 'opponent').length;
    
    const challengerExpert = expertVotes.filter(v => v.vote_for === 'challenger').length;
    const opponentExpert = expertVotes.filter(v => v.vote_for === 'opponent').length;
    
    const challengerAI = aiVotes.filter(v => v.vote_for === 'challenger').length;
    const opponentAI = aiVotes.filter(v => v.vote_for === 'opponent').length;
    
    // Calculate weighted scores
    const totalPeer = peerVotes.length || 1;
    const totalExpert = expertVotes.length || 1;
    const totalAI = aiVotes.length || 1;
    
    challengerScore = (
      (challengerPeer / totalPeer) * 40 +
      (challengerExpert / totalExpert) * 30 +
      (challengerAI / totalAI) * 30
    );
    
    opponentScore = (
      (opponentPeer / totalPeer) * 40 +
      (opponentExpert / totalExpert) * 30 +
      (opponentAI / totalAI) * 30
    );
    
    const winner = challengerScore > opponentScore ? 
      { id: this.battleData.challenger_id, type: 'challenger', score: challengerScore } :
      { id: this.battleData.opponent_id, type: 'opponent', score: opponentScore };
    
    return winner;
  }

  /**
   * Distribute prizes to winner
   */
  async distributePrizes(winner) {
    // Transfer stake
    if (this.battleData.stake_amount > 0) {
      // TODO: Implement SOL transfer via wallet
    }
    
    // Award XP
    await this.awardXP(winner.id, 150); // Winner
    const loserId = winner.id === this.battleData.challenger_id ?
      this.battleData.opponent_id : this.battleData.challenger_id;
    await this.awardXP(loserId, 50); // Loser participation
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Update spectator count
   */
  async updateSpectatorCount(count) {
    const { error } = await this.supabase
      .from('battles')
      .update({ spectator_count: count })
      .eq('id', this.battleId);
    
    if (error) console.error('Failed to update spectator count:', error);
  }

  /**
   * Award XP to user
   */
  async awardXP(userId, amount) {
    // TODO: Implement XP system
    console.log(`Awarding ${amount} XP to user ${userId}`);
  }

  /**
   * Award XP to voter
   */
  async awardVoterXP(amount) {
    await this.awardXP(this.currentUser.id, amount);
  }

  /**
   * Log battle event
   */
  async logEvent(eventType, eventData = {}) {
    const { error } = await this.supabase
      .from('battle_event_log')
      .insert({
        battle_id: this.battleId,
        event_type: eventType,
        event_data: eventData,
        user_id: this.currentUser?.id
      });
    
    if (error) console.error('Failed to log event:', error);
  }

  /**
   * Handle round timeout
   */
  async handleRoundTimeout(round) {
    // Check which participants submitted
    const submissions = round.submissions || [];
    
    if (submissions.length === 0) {
      // Nobody submitted - cancel round
      await this.cancelRound(round.id);
    } else if (submissions.length === 1) {
      // One submitted - other forfeits
      const submitter = submissions[0];
      await this.forfeitRound(round.id, submitter.participant_type);
    }
  }

  /**
   * Event emitter
   */
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  emit(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(data));
    }
  }

  /**
   * Cleanup subscriptions
   */
  async destroy() {
    // Remove all subscriptions
    Object.values(this.subscriptions).forEach(sub => {
      if (sub) sub.unsubscribe();
    });
    
    // Clear timers
    this.timers.forEach(timer => clearInterval(timer));
    this.timers.clear();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BattleManager;
}
