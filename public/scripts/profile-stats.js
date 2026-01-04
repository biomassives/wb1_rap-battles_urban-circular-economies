/**
 * Profile Stats Manager
 * Handles enhanced stats dashboard with Chart.js visualizations
 */

class ProfileStatsManager {
  constructor() {
    this.charts = {};
    this.stats = null;
    this.wallet = window.walletManager?.connectedWallet;
  }

  async init() {
    console.log('Initializing Profile Stats Manager');

    // Load user stats
    await this.loadStats();

    // Render stat cards
    this.renderStatCards();

    // Initialize charts if Chart.js is available
    if (typeof Chart !== 'undefined') {
      this.initCharts();
    } else {
      console.warn('Chart.js not loaded, skipping visualizations');
    }
  }

  async loadStats() {
    try {
      if (!this.wallet) {
        throw new Error('No wallet connected');
      }

      const response = await fetch(`/api/stats/user-stats?walletAddress=${this.wallet}`);

      if (!response.ok) {
        throw new Error('Failed to load stats');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load stats');
      }

      this.stats = data.stats;
      this.weeklyData = data.weekly || [];
      this.dailyActivity = data.daily || {};

      console.log('Stats loaded:', this.stats);
      return this.stats;

    } catch (error) {
      console.error('Error loading stats:', error);

      // Use sample data for demo
      this.stats = this.getSampleStats();
      this.weeklyData = this.getSampleWeeklyData();
      this.dailyActivity = this.getSampleDailyActivity();
    }
  }

  renderStatCards() {
    if (!this.stats) return;

    // Music Stats
    this.updateStatCard('music-tracks', {
      value: this.stats.total_tracks || 0,
      label: 'Total Tracks',
      trend: this.calculateTrend(this.stats.tracks_this_week, this.stats.tracks_last_week),
      icon: '🎵'
    });

    this.updateStatCard('music-time', {
      value: this.formatTime(this.stats.total_studio_time_minutes),
      label: 'Studio Time',
      trend: null,
      icon: '⏱️'
    });

    // Battle Stats
    const winRate = this.calculateWinRate(
      this.stats.battles_won,
      this.stats.battles_lost,
      this.stats.battles_drawn
    );

    this.updateStatCard('battle-record', {
      value: `${this.stats.battles_won}-${this.stats.battles_lost}-${this.stats.battles_drawn}`,
      label: 'Battle Record',
      subtext: `${winRate}% Win Rate`,
      icon: '⚔️'
    });

    this.updateStatCard('battle-streak', {
      value: this.stats.current_win_streak || 0,
      label: 'Current Streak',
      subtext: `Best: ${this.stats.longest_win_streak || 0}`,
      icon: '🔥'
    });

    // Learning Stats
    this.updateStatCard('courses-completed', {
      value: this.stats.courses_completed || 0,
      label: 'Courses Completed',
      trend: null,
      icon: '📚'
    });

    this.updateStatCard('quiz-score', {
      value: `${Math.round(this.stats.quiz_average_score || 0)}%`,
      label: 'Avg Quiz Score',
      icon: '🎯'
    });

    // NFT Stats
    this.updateStatCard('nft-collection', {
      value: this.stats.battle_cards || 0,
      label: 'Battle Cards',
      trend: null,
      icon: '💎'
    });

    // Impact Stats
    this.updateStatCard('community-impact', {
      value: this.formatSOL(this.stats.total_donated_sol),
      label: 'Total Donated',
      icon: '🏕️'
    });
  }

  updateStatCard(elementId, data) {
    const card = document.getElementById(elementId);
    if (!card) return;

    let html = `
      <div class="stat-icon">${data.icon}</div>
      <div class="stat-main">
        <div class="stat-value">${data.value}</div>
        <div class="stat-label">${data.label}</div>
      </div>
    `;

    if (data.trend !== null && data.trend !== undefined) {
      const trendClass = data.trend > 0 ? 'positive' : data.trend < 0 ? 'negative' : 'neutral';
      const arrow = data.trend > 0 ? '↑' : data.trend < 0 ? '↓' : '→';

      html += `
        <div class="stat-trend ${trendClass}">
          <span class="trend-arrow">${arrow}</span>
          <span class="trend-value">${Math.abs(data.trend)}%</span>
        </div>
      `;
    }

    if (data.subtext) {
      html += `<div class="stat-subtext">${data.subtext}</div>`;
    }

    card.innerHTML = html;
  }

  initCharts() {
    // XP Over Time Chart
    this.renderXPChart();

    // Battle Performance Chart
    this.renderBattleChart();

    // Activity Heatmap
    this.renderActivityHeatmap();

    // Weekly Activity Bar Chart
    this.renderWeeklyActivityChart();
  }

  renderXPChart() {
    const canvas = document.getElementById('xp-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Destroy existing chart
    if (this.charts.xp) {
      this.charts.xp.destroy();
    }

    this.charts.xp = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.weeklyData.map(w => this.formatWeek(w.week_start)),
        datasets: [{
          label: 'XP Earned',
          data: this.weeklyData.map(w => w.xp_earned),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#667eea',
            borderWidth: 1
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(102, 126, 234, 0.1)'
            },
            ticks: {
              color: '#999'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#999'
            }
          }
        }
      }
    });
  }

  renderBattleChart() {
    const canvas = document.getElementById('battle-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (this.charts.battle) {
      this.charts.battle.destroy();
    }

    const wins = this.stats.battles_won || 0;
    const losses = this.stats.battles_lost || 0;
    const draws = this.stats.battles_drawn || 0;

    this.charts.battle = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Wins', 'Losses', 'Draws'],
        datasets: [{
          data: [wins, losses, draws],
          backgroundColor: [
            '#4CAF50',
            '#e74c3c',
            '#95a5a6'
          ],
          borderWidth: 3,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#333',
              padding: 15,
              font: {
                size: 13
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff'
          }
        }
      }
    });
  }

  renderActivityHeatmap() {
    const container = document.getElementById('activity-heatmap');
    if (!container) return;

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364); // Last year

    let html = '<div class="heatmap-grid">';

    // Generate 52 weeks
    for (let week = 0; week < 52; week++) {
      html += '<div class="heatmap-week">';

      // Generate 7 days per week
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (week * 7) + day);

        if (currentDate > today) break;

        const dateStr = currentDate.toISOString().split('T')[0];
        const count = this.dailyActivity[dateStr] || 0;
        const level = this.getActivityLevel(count);

        html += `
          <div
            class="heatmap-day level-${level}"
            data-date="${dateStr}"
            data-count="${count}"
            title="${dateStr}: ${count} activities"
          ></div>
        `;
      }

      html += '</div>';
    }

    html += '</div>';

    // Add legend
    html += `
      <div class="heatmap-legend">
        <span>Less</span>
        <div class="legend-square level-0"></div>
        <div class="legend-square level-1"></div>
        <div class="legend-square level-2"></div>
        <div class="legend-square level-3"></div>
        <div class="legend-square level-4"></div>
        <span>More</span>
      </div>
    `;

    container.innerHTML = html;
  }

  renderWeeklyActivityChart() {
    const canvas = document.getElementById('weekly-activity-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (this.charts.weekly) {
      this.charts.weekly.destroy();
    }

    this.charts.weekly = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.weeklyData.map(w => this.formatWeek(w.week_start)),
        datasets: [
          {
            label: 'Tracks',
            data: this.weeklyData.map(w => w.tracks_created),
            backgroundColor: '#667eea'
          },
          {
            label: 'Battles',
            data: this.weeklyData.map(w => w.battles_fought),
            backgroundColor: '#764ba2'
          },
          {
            label: 'Lessons',
            data: this.weeklyData.map(w => w.lessons_completed),
            backgroundColor: '#f093fb'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          y: {
            stacked: false,
            beginAtZero: true,
            grid: {
              color: 'rgba(102, 126, 234, 0.1)'
            }
          },
          x: {
            stacked: false,
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  // Helper Functions

  calculateTrend(current, previous) {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  calculateWinRate(wins, losses, draws) {
    const total = wins + losses + draws;
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
  }

  getActivityLevel(count) {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 8) return 3;
    return 4;
  }

  formatTime(minutes) {
    if (!minutes) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  formatSOL(amount) {
    if (!amount || amount === 0) return '0 SOL';
    return `${parseFloat(amount).toFixed(2)} SOL`;
  }

  formatWeek(dateStr) {
    const date = new Date(dateStr);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  }

  // Sample Data for Demo
  getSampleStats() {
    return {
      total_tracks: 47,
      tracks_this_week: 3,
      tracks_last_week: 2,
      total_studio_time_minutes: 1240,
      moog_plays: 156,
      sampler_hits: 892,
      total_battles: 28,
      battles_won: 24,
      battles_lost: 3,
      battles_drawn: 1,
      current_win_streak: 7,
      longest_win_streak: 12,
      total_badges_earned: 18,
      courses_completed: 5,
      quiz_average_score: 91.3,
      battle_cards: 15,
      total_donated_sol: 2.45
    };
  }

  getSampleWeeklyData() {
    const weeks = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));

      weeks.push({
        week_start: date.toISOString().split('T')[0],
        tracks_created: Math.floor(Math.random() * 5) + 1,
        battles_fought: Math.floor(Math.random() * 4),
        lessons_completed: Math.floor(Math.random() * 3),
        xp_earned: Math.floor(Math.random() * 150) + 50
      });
    }
    return weeks;
  }

  getSampleDailyActivity() {
    const activity = {};
    for (let i = 364; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Random activity with some days having 0
      activity[dateStr] = Math.random() > 0.3 ? Math.floor(Math.random() * 12) : 0;
    }
    return activity;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('profile-stats-dashboard')) {
      window.profileStats = new ProfileStatsManager();
      window.profileStats.init();
    }
  });
} else {
  if (document.getElementById('profile-stats-dashboard')) {
    window.profileStats = new ProfileStatsManager();
    window.profileStats.init();
  }
}

console.log('Profile Stats Manager loaded');
