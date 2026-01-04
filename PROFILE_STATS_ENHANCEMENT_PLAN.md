# Profile Stats Enhancement & Email Notifications - Implementation Plan

## Executive Summary
Restructure user statistics to live primarily on the profile page with enhanced visualizations, interactive graphs, and integration with email notification system for weekly/monthly progress reports.

**Goal**: Make stats more useful, actionable, and shareable
**Current**: Basic stats scattered across progress and profile pages
**New**: Centralized, visualized stats hub on profile with email digests

---

## Current State Analysis

### `/progress` Page Stats
- Level and XP progress bar
- Quick stats grid: Achievements, Tracks, Courses, Battles
- Animal mentor section
- Achievements showcase
- Skill trees
- Recent activity feed

### `/profile` Page Stats
- Basic level badge
- Minimal profile quick stats
- NFT collection stats
- Mentor stats

### Problems
- ❌ Stats duplicated across pages
- ❌ No trends or historical data
- ❌ No visualizations (graphs, charts)
- ❌ Can't compare periods (this week vs last week)
- ❌ No shareable stat cards
- ❌ No email notifications about progress

---

## New Architecture

### Page Restructuring

#### **`/profile` (Enhanced)**
Primary stats hub with:
1. **Stats Overview Dashboard** (top section)
   - Current level, XP, stage
   - XP progress bar with milestone markers
   - Quick stats cards with trends

2. **Detailed Stats Sections** (tabbed interface)
   - Music Studio Stats
   - Battle Performance
   - Learning Progress
   - Community Impact
   - NFT Collection
   - Activity Timeline

3. **Visualizations**
   - XP earned over time (line graph)
   - Activity heatmap (GitHub-style)
   - Battle win rate pie chart
   - Skill distribution radar chart
   - Weekly activity bar chart

4. **Shareable Stat Cards**
   - Generate image cards for social sharing
   - "Wrapped" style annual summaries
   - Achievement highlight reels

#### **`/progress` (Refocused)**
Becomes a **journey/gamification page**:
- Animal mentor and daily wisdom
- Skill tree visualizations
- Quest/challenge tracking
- Milestone celebrations
- Level-up animations
- Badge collection showcase

**Separation of Concerns**:
- `/profile` = Stats, settings, data, exports
- `/progress` = Journey, gamification, mentorship, achievements

---

## Enhanced Stat Categories

### 1. Music Studio Stats

```typescript
interface MusicStats {
  // Creation Stats
  totalTracks: number;
  tracksThisWeek: number;
  tracksTrend: number; // % change from last week

  averageSessionDuration: number; // minutes
  totalStudioTime: number; // hours

  // Tool Usage
  moogSynthPlays: number;
  samplerPadHits: number;
  loopsCreated: number;

  // Engagement
  mostUsedFrequency: number; // Hz
  favoritePreset: string;
  longestRecording: number; // seconds

  // Weekly Breakdown
  weeklyActivity: {
    date: Date;
    tracksCreated: number;
    timeSpent: number;
  }[];

  // Milestones
  firstTrack: Date;
  milestone100Tracks: Date | null;
  perfectSynthScore: boolean;
}
```

**Visualizations**:
- **Line Graph**: Tracks created per week (last 12 weeks)
- **Bar Chart**: Time spent per day (last 7 days)
- **Pie Chart**: Tool usage distribution
- **Heatmap**: Active hours of day

### 2. Battle Performance Stats

```typescript
interface BattleStats {
  // Record
  totalBattles: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number; // percentage

  // Streaks
  currentWinStreak: number;
  longestWinStreak: number;
  currentLossStreak: number;

  // Performance
  averageCommunityVotes: number;
  highestVoteScore: number;
  totalBadgesEarned: number;
  uniqueBadges: number;

  // Cards
  cardsOwned: number;
  cardsByRarity: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
    mythic: number;
  };

  // Trends
  recentPerformance: {
    date: Date;
    result: 'win' | 'loss' | 'draw';
    votes: number;
  }[];

  // Ranking
  globalRank: number;
  percentile: number;
  regionalRank: number;
}
```

**Visualizations**:
- **Pie Chart**: Win/Loss/Draw distribution
- **Line Graph**: Win rate over time (rolling average)
- **Bar Chart**: Battles per week
- **Stacked Bar**: Card rarity distribution
- **Trend Line**: Community vote scores over last 10 battles

### 3. Learning Progress Stats

```typescript
interface LearningStats {
  // Courses
  coursesStarted: number;
  coursesCompleted: number;
  completionRate: number; // percentage

  // Engagement
  totalLearningTime: number; // hours
  averageSessionLength: number; // minutes
  lessonsCompleted: number;
  quizzesTaken: number;
  quizAverageScore: number; // percentage

  // Certificates
  certificatesEarned: number;
  latestCertificate: {
    name: string;
    date: Date;
    score: number;
  } | null;

  // Topics
  topicMastery: {
    topic: string;
    level: number; // 0-100
    lessonsCompleted: number;
  }[];

  // Activity
  weeklyProgress: {
    week: Date;
    lessonsCompleted: number;
    timeSpent: number;
  }[];

  // Streaks
  currentLearningStreak: number; // consecutive days
  longestLearningStreak: number;
}
```

**Visualizations**:
- **Progress Bar**: Course completion percentage
- **Radar Chart**: Topic mastery levels
- **Line Graph**: Learning time per week
- **Calendar Heatmap**: Learning streak visualization (GitHub-style)
- **Donut Chart**: Quiz pass/fail rate

### 4. Community Impact Stats

```typescript
interface ImpactStats {
  // Kakuma Support
  totalDonated: number; // SOL or USD
  livesImpacted: number; // calculated from donations
  projectsSupported: string[];

  // Volunteer Work
  volunteerHours: number;
  mentorshipSessions: number;
  studentsHelped: number;

  // Platform Contributions
  helpfulReports: number;
  communityUpvotes: number;
  postsCreated: number;
  commentsPosted: number;

  // Recognition
  impactBadges: string[];
  topContributor: boolean;
  impactRank: number;

  // Timeline
  impactHistory: {
    date: Date;
    type: 'donation' | 'volunteer' | 'mentorship';
    amount: number;
    description: string;
  }[];
}
```

**Visualizations**:
- **Bar Chart**: Donations over time
- **Pie Chart**: Contribution type distribution
- **Timeline**: Impact milestones
- **Counter Animation**: Lives impacted (odometer style)

### 5. NFT Collection Stats

```typescript
interface NFTStats {
  // Collection
  totalNFTs: number;
  uniqueCollections: number;

  // Battle Cards
  battleCards: number;
  cardsByRarity: Record<string, number>;
  cardFloorValue: number; // SOL
  cardTotalValue: number; // estimated

  // Other NFTs
  certificates: number;
  specialEditions: number;
  eventNFTs: number;

  // Trading
  nftsBought: number;
  nftsSold: number;
  tradingVolume: number; // SOL
  tradingProfit: number; // SOL

  // Rarity Score
  collectionRarityScore: number;
  topRarityNFT: {
    name: string;
    rarity: string;
    mintAddress: string;
  };

  // Airdrops
  airdropTier: number;
  airdropsClaimed: number;
  airdropValue: number; // estimated
}
```

**Visualizations**:
- **Stacked Bar**: NFT types in collection
- **Pie Chart**: Rarity distribution
- **Line Graph**: Collection value over time
- **Grid**: Featured NFTs with images

---

## UI/UX Design

### Profile Stats Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  PROFILE HEADER (Avatar, Username, Level Badge)         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  STATS OVERVIEW (Quick Cards with Trends)               │
│  ┌──────────┬──────────┬──────────┬──────────┐         │
│  │  Level 5 │ 24 Battles│ 12 Tracks│ 3 Courses│        │
│  │  ↑ +10%  │  ↑ +8    │  ↑ +3    │  → Same  │        │
│  └──────────┴──────────┴──────────┴──────────┘         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  TABBED SECTIONS                                        │
│  [Music 🎵] [Battles ⚔️] [Learning 📚] [Impact 🏕️]     │
│                                                          │
│  ┌─────────────────────────┬─────────────────────────┐ │
│  │                          │                         │ │
│  │  Left: Main Metric       │  Right: Visualization  │ │
│  │  - Total tracks: 47      │  [Line Graph]          │ │
│  │  - This week: 3 (+50%)   │  Tracks over time      │ │
│  │  - Avg session: 23 min   │                         │ │
│  │                          │                         │ │
│  └─────────────────────────┴─────────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  DETAILED BREAKDOWN                              │  │
│  │  [Activity Heatmap]                              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SHAREABLE STAT CARD                                    │
│  [Generate Card] [Share to Twitter] [Download PNG]      │
└─────────────────────────────────────────────────────────┘
```

### Stat Card Component

```astro
<div class="stat-card" data-trend={trend}>
  <div class="stat-header">
    <span class="stat-icon">{icon}</span>
    <span class="stat-category">{category}</span>
  </div>

  <div class="stat-main">
    <span class="stat-value">{value}</span>
    <span class="stat-label">{label}</span>
  </div>

  {trend && (
    <div class={`stat-trend ${trend > 0 ? 'positive' : 'negative'}`}>
      <span class="trend-arrow">{trend > 0 ? '↑' : '↓'}</span>
      <span class="trend-value">{Math.abs(trend)}%</span>
      <span class="trend-label">vs last week</span>
    </div>
  )}

  {graph && (
    <div class="stat-sparkline">
      <!-- Mini line graph visualization -->
    </div>
  )}
</div>
```

---

## Graph/Chart Library Integration

### Recommended: Chart.js

**Why Chart.js**:
- Lightweight (60KB)
- Responsive
- Canvas-based (smooth animations)
- Extensive chart types
- Good documentation
- Free & open source

**Installation**:
```bash
npm install chart.js
```

### Example Implementation

```typescript
// public/scripts/profile-stats.js
import Chart from 'chart.js/auto';

class ProfileStatsManager {
  constructor() {
    this.charts = {};
  }

  // XP Over Time Line Graph
  renderXPChart(canvasId, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    this.charts.xp = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.weeks,
        datasets: [{
          label: 'XP Earned',
          data: data.xpValues,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'XP Earned Over Time'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'XP'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Week'
            }
          }
        }
      }
    });
  }

  // Battle Performance Pie Chart
  renderBattleChart(canvasId, wins, losses, draws) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    this.charts.battles = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Wins', 'Losses', 'Draws'],
        datasets: [{
          data: [wins, losses, draws],
          backgroundColor: [
            '#4CAF50', // Green
            '#e74c3c', // Red
            '#95a5a6'  // Gray
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Battle Record'
          }
        }
      }
    });
  }

  // Activity Heatmap (GitHub-style)
  renderActivityHeatmap(containerId, activityData) {
    // Use cal-heatmap library or custom implementation
    const container = document.getElementById(containerId);

    // activityData: { '2026-01-03': 5, '2026-01-04': 12, ... }

    // Generate 365 day grid
    const today = new Date();
    const grid = [];

    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      grid.push({
        date: dateStr,
        count: activityData[dateStr] || 0,
        level: this.getActivityLevel(activityData[dateStr] || 0)
      });
    }

    // Render as div grid with CSS colors
    container.innerHTML = grid.map(day => `
      <div class="activity-day" data-level="${day.level}" title="${day.date}: ${day.count} activities">
      </div>
    `).join('');
  }

  getActivityLevel(count) {
    if (count === 0) return 0;
    if (count <= 3) return 1;
    if (count <= 6) return 2;
    if (count <= 9) return 3;
    return 4;
  }

  // Skills Radar Chart
  renderSkillsRadar(canvasId, skills) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    this.charts.skills = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: skills.map(s => s.name),
        datasets: [{
          label: 'Skill Level',
          data: skills.map(s => s.level),
          backgroundColor: 'rgba(102, 126, 234, 0.2)',
          borderColor: '#667eea',
          borderWidth: 2,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#667eea'
        }]
      },
      options: {
        responsive: true,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Skill Distribution'
          }
        }
      }
    });
  }
}

// Initialize
window.profileStats = new ProfileStatsManager();
```

---

## Email Notification System

### Weekly Progress Digest

**Sent**: Every Monday at 9 AM user local time
**Subject**: "🎵 Your Weekly Worldbridger Progress"

**Email Template**:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      padding: 30px;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
      display: block;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }
    .stat-trend {
      font-size: 12px;
      color: #4CAF50;
      margin-top: 5px;
    }
    .stat-trend.negative {
      color: #e74c3c;
    }
    .highlights {
      padding: 30px;
      border-top: 1px solid #eee;
    }
    .highlight-item {
      margin-bottom: 15px;
    }
    .highlight-icon {
      display: inline-block;
      margin-right: 10px;
      font-size: 20px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 15px 30px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      margin: 20px auto;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🎵 Your Weekly Progress</h1>
      <p>Week of {{weekStart}} - {{weekEnd}}</p>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-value">{{tracksCreated}}</span>
        <div class="stat-label">Tracks Created</div>
        <div class="stat-trend {{tracksCreated > lastWeek.tracksCreated ? '' : 'negative'}}">
          {{tracksTrend > 0 ? '↑' : '↓'}} {{Math.abs(tracksTrend)}}% vs last week
        </div>
      </div>

      <div class="stat-card">
        <span class="stat-value">{{battles}}</span>
        <div class="stat-label">Battles Fought</div>
        <div class="stat-trend {{battles > lastWeek.battles ? '' : 'negative'}}">
          {{battlesTrend > 0 ? '↑' : '↓'}} {{Math.abs(battlesTrend)}}% vs last week
        </div>
      </div>

      <div class="stat-card">
        <span class="stat-value">{{xpEarned}}</span>
        <div class="stat-label">XP Earned</div>
        <div class="stat-trend">
          {{xpToNextLevel}} to Level {{nextLevel}}
        </div>
      </div>

      <div class="stat-card">
        <span class="stat-value">{{activeStreakDays}}</span>
        <div class="stat-label">Day Streak</div>
        <div class="stat-trend">
          Keep it going! 🔥
        </div>
      </div>
    </div>

    <!-- Highlights -->
    <div class="highlights">
      <h2>This Week's Highlights</h2>

      {{#if wonBattle}}
      <div class="highlight-item">
        <span class="highlight-icon">🏆</span>
        <strong>Victory!</strong> You won a battle and earned the {{badgeEarned}} badge!
      </div>
      {{/if}}

      {{#if newLevel}}
      <div class="highlight-item">
        <span class="highlight-icon">⭐</span>
        <strong>Level Up!</strong> You reached Level {{currentLevel}} - {{stageName}}
      </div>
      {{/if}}

      {{#if certificate}}
      <div class="highlight-item">
        <span class="highlight-icon">🎓</span>
        <strong>Certified!</strong> You earned your training certificate with {{certificateScore}}%
      </div>
      {{/if}}

      {{#if topTrack}}
      <div class="highlight-item">
        <span class="highlight-icon">🎵</span>
        <strong>Top Track:</strong> "{{topTrackName}}" got {{topTrackPlays}} plays
      </div>
      {{/if}}
    </div>

    <!-- CTA -->
    <div style="text-align: center; padding: 30px;">
      <a href="https://worldbridgerone.com/profile" class="cta-button">
        View Full Stats →
      </a>
    </div>

    <!-- Upcoming -->
    <div class="highlights">
      <h2>Coming Up</h2>
      <div class="highlight-item">
        <span class="highlight-icon">🎯</span>
        {{nextMilestone}}
      </div>
      <div class="highlight-item">
        <span class="highlight-icon">🎁</span>
        Next airdrop snapshot in {{daysToSnapshot}} days
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>You're receiving this because you opted in to weekly digests.</p>
      <p>
        <a href="{{unsubscribeLink}}">Unsubscribe</a> |
        <a href="{{preferencesLink}}">Email Preferences</a>
      </p>
      <p>© 2026 Worldbridger One</p>
    </div>
  </div>
</body>
</html>
```

### Monthly Wrapped Summary

**Sent**: First day of each month
**Subject**: "📊 Your {{Month}} Worldbridger Wrapped"

**Includes**:
- Total stats for the month
- Top achievements
- Progress towards annual goals
- Comparison to community averages
- Shareable image card
- Predictions for next month

### Milestone Notifications

**Triggered by events**:
- Level up
- Achievement unlocked
- Win streak milestone (5, 10, 25, 50, 100)
- Certificate earned
- NFT minted
- First battle won
- Collection milestone (10, 25, 50, 100 cards)

**Email Template** (Milestone):
```html
<div class="milestone-card">
  <div class="milestone-icon">🎉</div>
  <h1>Milestone Unlocked!</h1>
  <h2>{{milestoneName}}</h2>
  <p>{{milestoneDescription}}</p>

  <div class="milestone-reward">
    <strong>Reward:</strong> {{rewardDescription}}
  </div>

  <a href="{{shareLink}}" class="cta-button">
    Share Your Achievement →
  </a>
</div>
```

---

## Implementation Checklist

### Phase 1: Data Layer (Week 1)
- [ ] Extend database schema for stats tracking
- [ ] Create stats aggregation queries
- [ ] Build API endpoints for stats retrieval
- [ ] Implement caching for performance

### Phase 2: Profile UI (Week 2)
- [ ] Redesign profile page layout
- [ ] Create stat card components
- [ ] Implement tabbed sections
- [ ] Add Chart.js library
- [ ] Build graph components

### Phase 3: Visualizations (Week 3)
- [ ] XP over time line graph
- [ ] Activity heatmap
- [ ] Battle performance charts
- [ ] Skills radar chart
- [ ] Weekly activity bars

### Phase 4: Email System (Week 4)
- [ ] Set up email service (SendGrid/Mailgun)
- [ ] Create email templates
- [ ] Build digest generation logic
- [ ] Schedule weekly/monthly cron jobs
- [ ] Add unsubscribe/preferences

### Phase 5: Sharing (Week 5)
- [ ] Generate shareable stat cards (PNG)
- [ ] Social media meta tags
- [ ] "Share to Twitter" functionality
- [ ] Annual "Wrapped" feature

---

**Document Status**: Planning Complete
**Created**: January 3, 2026
**Next**: Begin profile page redesign
