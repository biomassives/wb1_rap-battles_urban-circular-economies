# User Stories for Small Group Adaptations

**Document:** USER_STORIES.md
**Date:** 2026-01-28
**Format:** As a [user type], I want to [action], so that [benefit]
**Scope:** 21 user stories across 7 community group types

---

## 1. Homeless Youth Drop-In Center

### Story 1.1: Anonymous Onboarding
**As a** homeless youth arriving at a shelter,
**I want to** create an account using only a phone number (no ID, no bank account required),
**So that** I can start earning XP and badges immediately without bureaucratic barriers that exclude me.

**Acceptance Criteria:**
- Phone number is the only required field
- SMS verification works on any phone (including shelter shared phones)
- Anonymous wallet auto-generated
- First 10 XP awarded on signup completion

---

### Story 1.2: Micro-Course Completion
**As a** shelter resident with unpredictable schedules,
**I want to** complete 15-minute life skills courses on my phone that work offline,
**So that** I can learn job interview skills, tenant rights, or financial basics during downtime without needing wifi.

**Acceptance Criteria:**
- Courses downloadable for offline use
- Maximum 15 minutes per module
- Progress saves automatically when connection returns
- Quiz results sync when online
- Certificate/badge awarded immediately on completion

---

### Story 1.3: Survival Milestone Recognition
**As a** case worker at a youth shelter,
**I want to** see which residents have earned "7-day streak" or "ID obtained" badges,
**So that** I can celebrate their progress and use verified achievements in housing applications or job referrals.

**Acceptance Criteria:**
- Staff dashboard shows resident badge collections
- Badges exportable as PDF verification letter
- Privacy toggle lets resident control what staff sees
- Badge history includes dates and context

---

## 2. Kenyan Women's Table Bank / Chama

### Story 2.1: Savings Streak Tracking
**As a** table bank member,
**I want to** earn an NFT badge for contributing every week for 12 consecutive weeks,
**So that** I have verifiable proof of my savings discipline that I can show to microfinance institutions when applying for larger loans.

**Acceptance Criteria:**
- System tracks weekly contribution timestamps
- Streak counter visible on member profile
- Badge auto-minted at 4, 12, 26, and 52 week milestones
- Badge includes group name and contribution record hash
- Exportable to PDF or shareable link

---

### Story 2.2: Business Pitch Competition
**As a** chama chairperson,
**I want to** create a monthly business pitch challenge where members present micro-enterprise ideas and vote on the best one,
**So that** we can allocate our group loan funds to the most promising ventures while building members' presentation skills.

**Acceptance Criteria:**
- Challenge creation with custom title, deadline, and prize (XP + loan priority)
- Video or audio submission option (max 3 minutes)
- Anonymous voting by all members
- Results displayed with vote counts
- Winner badge minted automatically

---

### Story 2.3: Group Treasury Dashboard
**As a** table bank treasurer,
**I want to** see a dashboard showing total group XP earned, NFTs held, and M-Pesa disbursements,
**So that** I can report to members on our collective digital assets alongside our traditional cash records.

**Acceptance Criteria:**
- Aggregate view of all member XP and badges
- Group-owned NFT collection display
- Transaction history (deposits, payouts, fees)
- Exportable monthly report
- Reconciliation with M-Pesa statement

---

## 3. Youth Soccer/Football Club

### Story 3.1: Skills Challenge Leaderboard
**As a** youth football player,
**I want to** submit a video of my juggling count or accuracy shots and see how I rank against teammates,
**So that** I'm motivated to practice and can track my improvement over the season.

**Acceptance Criteria:**
- Video upload with automatic timestamp
- Coach verification/approval workflow
- Leaderboard updates in real-time
- Personal best tracking with improvement percentage
- Weekly/monthly/all-time views

---

### Story 3.2: Equipment Credit Redemption
**As a** U-16 player who has earned 500 XP,
**I want to** redeem my XP for equipment credits (boots, shin guards, ball),
**So that** I receive real value for my effort without requiring cash payouts that my parents would need to manage.

**Acceptance Criteria:**
- XP-to-credit conversion rate displayed (e.g., 100 XP = 500 KES credit)
- Equipment catalog with credit prices
- Redemption request sent to team manager
- Manager approval triggers fulfillment
- Transaction logged on member profile

---

### Story 3.3: Scout Verification
**As a** football scout evaluating talent,
**I want to** scan a QR code on a player's profile and see their verified training attendance, performance badges, and character awards,
**So that** I can trust the player's history without relying solely on coach testimonials.

**Acceptance Criteria:**
- Public profile with QR code
- Attendance percentage and streak data
- Badge collection with earn dates
- Character badges (captain, fair play) highlighted
- Contact request button (requires player approval)

---

## 4. Faith-Based Youth Group

### Story 4.1: Service Hours Logging
**As a** youth group member completing community service,
**I want to** log my volunteer hours with a photo and have my youth pastor verify them,
**So that** I earn service badges and have documented proof for college applications or scholarship requirements.

**Acceptance Criteria:**
- Log entry: date, hours, description, photo
- Supervisor verification (pastor/leader approves)
- Running total of verified hours
- Badges at 10, 25, 50, 100 hour milestones
- Exportable service transcript

---

### Story 4.2: Scripture Memorization Challenge
**As a** youth pastor,
**I want to** create a monthly memorization challenge with specific verses and a quiz at the end,
**So that** young people are motivated to engage with sacred texts through friendly competition and earn recognition.

**Acceptance Criteria:**
- Challenge setup with text passages and deadline
- Audio recording option for recitation
- Quiz auto-generated from passage content
- Pass threshold configurable (e.g., 80%)
- Completion badge with passage reference

---

### Story 4.3: Mission Trip Funding
**As a** youth group member saving for a mission trip,
**I want to** see my XP earnings converted to trip fund credits alongside my direct fundraising,
**So that** my consistent participation in group activities contributes to making the trip affordable.

**Acceptance Criteria:**
- Trip fund goal and progress tracker
- XP conversion rate to trip credits
- Combined view: cash raised + XP credits
- Automatic credit accumulation
- Payout to trip fund when threshold reached

---

## 5. Addiction Recovery Support Group

### Story 5.1: Anonymous Sobriety Milestone
**As a** person in recovery,
**I want to** receive a sobriety milestone NFT (30 days, 90 days, 1 year) that proves my achievement without revealing my identity or struggle,
**So that** I have permanent, private proof of my progress that I control completely.

**Acceptance Criteria:**
- Wallet is anonymous (no name required)
- Milestone NFT shows only: "30 Days" + date + unique ID
- No indication of what "30 days" refers to
- ZK proof available: "Has 30+ day milestone" without revealing which type
- Cannot be transferred (soul-bound)

---

### Story 5.2: Coping Strategy Rating
**As a** support group member,
**I want to** share a coping strategy I've found helpful and see how other members rate its usefulness,
**So that** effective techniques rise to the top and I feel I'm contributing to others' recovery.

**Acceptance Criteria:**
- Text submission with optional category tag
- Anonymous posting option
- Upvote/downvote or 1-5 star rating
- Top-rated strategies featured
- Contributor earns XP based on helpfulness ratings
- No negative consequences for low ratings

---

### Story 5.3: Recovery Resource Redemption
**As a** group member with accumulated XP,
**I want to** redeem my earnings for recovery resources (meditation app subscription, recovery books, retreat scholarships),
**So that** I receive value that supports my journey without cash that could trigger relapse.

**Acceptance Criteria:**
- Resource catalog (no cash option)
- Clear redemption process
- Digital delivery for apps/subscriptions
- Physical items shipped or picked up at meeting
- Sponsor/family member can manage if designated
- Transaction history private

---

## 6. Vocational Training Cohort

### Story 6.1: Skill Badge Verification
**As a** coding bootcamp graduate,
**I want to** have my completed projects minted as NFT badges with links to my actual code,
**So that** employers can verify my portfolio is real and see exactly what I built during training.

**Acceptance Criteria:**
- Project submission with GitHub/code link
- Instructor verification and grading
- Badge includes: skill tags, completion date, grade, code link
- Badge viewable on public profile
- Employer can click through to actual work

---

### Story 6.2: Peer Code Review Rewards
**As a** bootcamp student,
**I want to** earn XP for providing constructive code reviews to my classmates,
**So that** I'm incentivized to help others while reinforcing my own learning.

**Acceptance Criteria:**
- Review request queue visible to cohort
- Structured review template (what works, suggestions, questions)
- Reviewee rates helpfulness of review
- XP awarded based on helpfulness rating
- "Top Reviewer" badge for consistent quality

---

### Story 6.3: Employer-Sponsored XP Pool
**As a** hiring manager at a tech company,
**I want to** sponsor an XP pool for a bootcamp cohort and receive notifications when students earn specific skill badges,
**So that** I can identify and recruit top performers before they graduate.

**Acceptance Criteria:**
- Sponsor dashboard with cohort overview
- Custom badge alerts (e.g., "React Advanced" earned)
- Aggregate cohort progress metrics
- Direct message request to students (requires student opt-in)
- Sponsorship amount converts to XP pool for cohort
- Sponsor logo on relevant badges (optional)

---

## 7. Environmental Action Club

### Story 7.1: Impact Documentation
**As an** environmental club member participating in a beach cleanup,
**I want to** log my contribution (bags collected, area covered) with before/after photos,
**So that** our collective impact is quantified and I earn XP proportional to my effort.

**Acceptance Criteria:**
- Event check-in with GPS location
- Photo upload (before, during, after)
- Quantity logging (bags, kg, area)
- XP awarded based on verified contribution
- Aggregated event total displayed
- Impact badge earned at event completion

---

### Story 7.2: Advocacy Action Tracking
**As a** club organizer,
**I want to** create advocacy challenges (petition signatures, council meeting attendance, social media posts) and track member participation,
**So that** we can measure our civic engagement alongside our direct environmental work.

**Acceptance Criteria:**
- Challenge types: petition, meeting, post, letter
- Proof submission (screenshot, selfie, signature count)
- Organizer verification workflow
- XP values configurable per action type
- Advocacy badges separate from cleanup badges
- Campaign success metrics (total signatures, etc.)

---

### Story 7.3: Corporate Sponsor Matching
**As a** corporate sustainability manager,
**I want to** pledge to match XP earned by an environmental club up to a certain amount,
**So that** my company supports grassroots environmental action with real funding tied to verified activities.

**Acceptance Criteria:**
- Sponsor pledge setup (match ratio, cap, duration)
- Real-time tracking of matched amount
- Sponsor sees verified activities being matched
- Matching funds deposited to club treasury
- Tax receipt generation for sponsor
- Sponsor recognition on club profile and badges

---

## Summary Matrix

| Group Type | Story Focus Areas | Key Adaptations Required |
|------------|-------------------|--------------------------|
| Homeless Youth | Anonymous access, micro-learning, case worker integration | Remove ID requirements, offline mode, staff dashboard |
| Table Bank | Savings verification, pitch competitions, group treasury | Group wallet, M-Pesa integration, loan queue logic |
| Sports Club | Skills leaderboard, equipment credits, scout verification | Video upload, minor-safe payouts, public profiles |
| Faith Group | Service logging, memorization challenges, trip funding | Verification workflow, audio recording, fund tracking |
| Recovery | Anonymous milestones, peer ratings, resource redemption | ZK proofs, no cash option, soul-bound tokens |
| Vocational | Portfolio badges, peer review, employer sponsorship | Code linking, review system, sponsor dashboard |
| Environmental | Impact logging, advocacy tracking, corporate matching | GPS/photo verification, campaign metrics, matching logic |

---

## Implementation Priority

### Phase 1 (Core Platform - Minimal Adaptation)
- 1.1, 1.2 (Anonymous onboarding, offline courses)
- 2.1 (Streak tracking)
- 4.1 (Service hours)
- 6.1 (Skill badges)

### Phase 2 (Competition Features)
- 2.2 (Pitch competitions)
- 3.1 (Skills leaderboards)
- 4.2 (Memorization challenges)
- 7.1 (Impact documentation)

### Phase 3 (Economic Features)
- 3.2 (Equipment credits)
- 4.3 (Trip funding)
- 5.3 (Resource redemption)
- 6.2 (Peer review rewards)

### Phase 4 (External Integration)
- 1.3 (Case worker dashboard)
- 2.3 (Group treasury)
- 3.3 (Scout verification)
- 6.3, 7.3 (Sponsor dashboards)

### Phase 5 (Privacy Features)
- 5.1, 5.2 (Anonymous milestones, ratings)
- 7.2 (Advocacy tracking)

---

**Total User Stories:** 21
**Estimated Development Sprints:** 8-12 (2-week sprints)
**Recommended MVP:** Phase 1 stories (5 stories)

---

*Each story represents a real person with real needs. Build for them.*
