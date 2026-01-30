# Training Quiz & POAP Certificate System - Implementation Plan

## Executive Summary
Create an educational quiz system that confirms users understand platform features and protocols, rewarding successful completion with a Solana testnet POAP-style certificate NFT. This serves as onboarding, education verification, and gamification.

**Goal**: Ensure users understand the platform before participating in battles/features
**Reward**: Solana testnet NFT certificate (proof of training completion)
**Priority**: High - Critical for user onboarding and reducing support burden

---

## System Overview

### User Flow
```
1. User signs up → Prompted to take training quiz
2. User studies training materials (docs, videos, tutorials)
3. User takes quiz (10-15 questions)
4. Passing score (80%+) → Mints POAP certificate NFT
5. Failed attempt → Review materials, retake after cooldown
6. Certificate unlocks advanced features (battles, minting, etc.)
```

### Benefits
- **Education**: Users learn platform features properly
- **Gamification**: Certificate NFT is collectible + unlocks features
- **Support**: Reduces "how do I?" questions
- **Quality**: Ensures battle participants understand rules
- **Onboarding**: Structured learning path
- **Achievement**: Proof of completion (shareable)

---

## Quiz Design

### Topics Covered

#### 1. **Platform Basics** (3 questions)
- What is Worldbridger One's mission?
- How does the platform support Urban & Coastal Youth refugee camp?
- What is the role of NFTs in the ecosystem?

**Example Question**:
```
Q: What percentage of marketplace sales supports Urban & Coastal Youth youth programs?
A) 2%
B) 5% ✓
C) 10%
D) 15%
```

#### 2. **Rap Battle System** (4 questions)
- How do battle submissions work?
- What determines card rarity?
- What are bling badges and how to earn them?
- Battle etiquette and rules

**Example Questions**:
```
Q: Which of these increases your battle card rarity chance?
A) Win streaks ✓
B) Losing battles
C) Reporting other users
D) Using profanity

Q: What happens when you win a battle?
A) Nothing
B) You get XP only
C) You mint a commemorative card with badges ✓
D) You lose your stake
```

#### 3. **Music Studio Tools** (3 questions)
- Moog synthesizer parameters
- Sampler pad usage
- Audio recording best practices

**Example Questions**:
```
Q: What do the 4 Moog dials control?
A) Volume, bass, treble, effects
B) Frequency, duration, intensity, modulation ✓
C) Pitch, tempo, rhythm, melody
D) Attack, decay, sustain, release

Q: How many sampler pads are available?
A) 8
B) 12
C) 16 ✓
D) 24
```

#### 4. **NFT & Card System** (3 questions)
- How to mint cards
- Trading and marketplace
- Airdrop tiers
- Card customization

**Example Questions**:
```
Q: What's the rarest card tier?
A) Legendary
B) Epic
C) Mythic ✓
D) Diamond

Q: What determines airdrop tier eligibility?
A) Number of cards owned ✓
B) Account age
C) Number of friends
D) Wallet balance
```

#### 5. **Community Guidelines** (2 questions)
- Respect and inclusivity
- Content policies
- Reporting system

**Example Questions**:
```
Q: What should you do if you see inappropriate content?
A) Ignore it
B) Share it with friends
C) Use the report button ✓
D) Leave the platform

Q: What type of battle content is NOT allowed?
A) Creative insults
B) Bragging about skills
C) Hate speech and discrimination ✓
D) References to hip-hop culture
```

### Quiz Structure

**Total Questions**: 15
**Passing Score**: 12/15 (80%)
**Time Limit**: 15 minutes (optional)
**Retake Policy**: Wait 4 hours after failed attempt
**Attempts Tracked**: Max 3 attempts per 24 hours

---

## POAP Certificate NFT Design

### Metadata Structure
```json
{
  "name": "Worldbridger Training Certificate #1234",
  "symbol": "WBTC",
  "description": "Proof of successful completion of Worldbridger One training program. Holder has demonstrated understanding of platform features, battle protocols, and community guidelines.",
  "image": "https://arweave.net/[certificate-image-hash]",
  "external_url": "https://worldbridgerone.com/certificates/1234",
  "attributes": [
    {
      "trait_type": "Certificate Type",
      "value": "Training Completion"
    },
    {
      "trait_type": "Score",
      "value": "14/15 (93%)"
    },
    {
      "trait_type": "Completion Date",
      "value": "January 3, 2026"
    },
    {
      "trait_type": "Cohort",
      "value": "Q1 2026"
    },
    {
      "trait_type": "Network",
      "value": "Solana Testnet"
    },
    {
      "trait_type": "Certificate Number",
      "value": "1234"
    },
    {
      "trait_type": "Perfect Score",
      "value": "No"
    }
  ],
  "properties": {
    "category": "certificate",
    "creators": [
      {
        "address": "WORLDBRIDGER_AUTHORITY_PUBKEY",
        "share": 100
      }
    ]
  }
}
```

### Certificate SVG Design

**Design Elements**:
- Border: Purple/blue gradient (Worldbridger colors)
- Badge: Official seal with checkmark ✓
- Text: "Certificate of Training Completion"
- Details: Username, score, date, certificate #
- Logo: Worldbridger One logo
- Signatures: Digital signatures (immutable)
- QR Code: Links to verification page

**Visual Hierarchy**:
```
╔══════════════════════════════════════════════╗
║  WORLDBRIDGER ONE                            ║
║                                              ║
║        ✓ CERTIFICATE OF COMPLETION           ║
║                                              ║
║    [Worldbridger Logo]                       ║
║                                              ║
║    This certifies that                       ║
║    [USERNAME]                                ║
║    has successfully completed the            ║
║    Worldbridger One Training Program         ║
║                                              ║
║    Score: 14/15 (93%)                        ║
║    Date: January 3, 2026                     ║
║    Certificate #1234                         ║
║                                              ║
║    [QR Code]        [Official Seal]          ║
║                                              ║
║    Signed:                                   ║
║    [Digital Signature]                       ║
║                                              ║
╚══════════════════════════════════════════════╝
```

### Rarity Variants

**Standard Certificate** (Score 80-89%):
- Bronze border
- Single badge
- "Certified" seal

**Advanced Certificate** (Score 90-94%):
- Silver border
- Double badge
- "Advanced" seal
- Slight glow effect

**Perfect Score Certificate** (Score 95-100%):
- Gold border with holographic effect
- Triple badge
- "Perfect Score" seal
- Animated glow
- Special "🏆" emoji
- Only 1-5% of certificates

---

## Database Schema

### Tables

```sql
-- Quizzes table
CREATE TABLE training_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 80, -- Percentage
  time_limit_minutes INTEGER DEFAULT 15,
  max_attempts_per_day INTEGER DEFAULT 3,
  cooldown_hours INTEGER DEFAULT 4,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Questions table
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES training_quizzes(id),
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice', -- 'multiple_choice', 'true_false', 'multi_select'
  category TEXT, -- 'platform', 'battles', 'music', 'nft', 'community'
  difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  points INTEGER DEFAULT 1,
  explanation TEXT, -- Shown after answering
  order_index INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Answer choices table
CREATE TABLE quiz_answer_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES quiz_questions(id),
  choice_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  explanation TEXT, -- Why this answer is correct/incorrect
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User quiz attempts table
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES training_quizzes(id),
  user_id UUID REFERENCES users(id),
  wallet_address TEXT,

  -- Attempt details
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  time_taken_seconds INTEGER,

  -- Scoring
  total_questions INTEGER,
  correct_answers INTEGER,
  score_percentage NUMERIC(5,2),
  passed BOOLEAN,

  -- Answers (JSON array of question_id: answer_id pairs)
  answers JSONB,

  -- Certificate minting
  certificate_minted BOOLEAN DEFAULT FALSE,
  certificate_nft_address TEXT,
  certificate_metadata_uri TEXT,
  certificate_number INTEGER,

  -- Metadata
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Certificates issued table
CREATE TABLE training_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES quiz_attempts(id),
  user_id UUID REFERENCES users(id),
  wallet_address TEXT NOT NULL,

  -- Certificate details
  certificate_number SERIAL,
  certificate_type TEXT DEFAULT 'standard', -- 'standard', 'advanced', 'perfect'
  score_percentage NUMERIC(5,2),

  -- NFT details
  nft_mint_address TEXT UNIQUE NOT NULL,
  metadata_uri TEXT NOT NULL,
  arweave_tx_id TEXT,

  -- Visual details
  svg_hash TEXT,
  cohort TEXT, -- 'Q1 2026', etc.

  -- Status
  revoked BOOLEAN DEFAULT FALSE,
  revoked_reason TEXT,
  revoked_at TIMESTAMP,

  issued_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_wallet ON quiz_attempts(wallet_address);
CREATE INDEX idx_quiz_attempts_passed ON quiz_attempts(passed);
CREATE INDEX idx_certificates_wallet ON training_certificates(wallet_address);
CREATE INDEX idx_certificates_number ON training_certificates(certificate_number);
```

---

## API Endpoints

### Quiz Management

#### `GET /api/training/quiz`
Get active training quiz details (questions without answers)

**Response**:
```json
{
  "quiz": {
    "id": "quiz-uuid",
    "title": "Worldbridger Training Quiz",
    "description": "Test your knowledge...",
    "passingScore": 80,
    "timeLimit": 15,
    "totalQuestions": 15,
    "questions": [
      {
        "id": "q1-uuid",
        "text": "What percentage of sales supports Urban & Coastal Youth?",
        "type": "multiple_choice",
        "category": "platform",
        "points": 1,
        "choices": [
          { "id": "c1-uuid", "text": "2%" },
          { "id": "c2-uuid", "text": "5%" },
          { "id": "c3-uuid", "text": "10%" },
          { "id": "c4-uuid", "text": "15%" }
        ]
      }
    ]
  },
  "userStats": {
    "attemptsToday": 1,
    "maxAttempts": 3,
    "lastAttempt": "2026-01-03T10:00:00Z",
    "canRetake": true,
    "cooldownEndsAt": null,
    "hasCertificate": false
  }
}
```

#### `POST /api/training/quiz/start`
Start a new quiz attempt

**Request**:
```json
{
  "quizId": "quiz-uuid",
  "walletAddress": "user-wallet"
}
```

**Response**:
```json
{
  "attemptId": "attempt-uuid",
  "startedAt": "2026-01-03T11:00:00Z",
  "expiresAt": "2026-01-03T11:15:00Z"
}
```

#### `POST /api/training/quiz/submit`
Submit quiz answers

**Request**:
```json
{
  "attemptId": "attempt-uuid",
  "answers": [
    { "questionId": "q1-uuid", "choiceId": "c2-uuid" },
    { "questionId": "q2-uuid", "choiceId": "c1-uuid" }
  ]
}
```

**Response**:
```json
{
  "attemptId": "attempt-uuid",
  "totalQuestions": 15,
  "correctAnswers": 14,
  "scorePercentage": 93.33,
  "passed": true,
  "timeTaken": 720,
  "results": [
    {
      "questionId": "q1-uuid",
      "correct": true,
      "explanation": "5% of all marketplace sales support Urban & Coastal Youth youth programs."
    }
  ],
  "certificate": {
    "eligible": true,
    "type": "advanced",
    "minting": true
  }
}
```

### Certificate Management

#### `POST /api/training/certificate/mint`
Mint POAP certificate NFT (automatic after passing)

**Request**:
```json
{
  "attemptId": "attempt-uuid",
  "walletAddress": "user-wallet"
}
```

**Response**:
```json
{
  "success": true,
  "certificate": {
    "certificateNumber": 1234,
    "nftMintAddress": "Solana-NFT-Address",
    "metadataUri": "https://arweave.net/...",
    "certificateType": "advanced",
    "score": 93.33,
    "issuedAt": "2026-01-03T11:05:00Z"
  },
  "transaction": {
    "signature": "solana-tx-signature",
    "explorerUrl": "https://explorer.solana.com/tx/..."
  }
}
```

#### `GET /api/training/certificate/:certificateNumber`
Verify and view certificate details

**Response**:
```json
{
  "certificate": {
    "number": 1234,
    "holder": "username",
    "walletAddress": "...",
    "score": 93.33,
    "type": "advanced",
    "issuedAt": "2026-01-03T11:05:00Z",
    "cohort": "Q1 2026",
    "verified": true,
    "revoked": false,
    "nftMintAddress": "...",
    "metadataUri": "...",
    "imageUrl": "..."
  }
}
```

#### `GET /api/training/my-certificates`
Get user's certificates

**Response**:
```json
{
  "certificates": [
    {
      "number": 1234,
      "type": "advanced",
      "score": 93.33,
      "issuedAt": "2026-01-03T11:05:00Z",
      "nftMintAddress": "..."
    }
  ]
}
```

---

## Solana Testnet Integration

### Network Configuration

**Network**: Solana Devnet (for testing)
**RPC**: `https://api.devnet.solana.com`
**Faucet**: `https://faucet.solana.com` (for testnet SOL)

### Metaplex Setup

```typescript
import { Metaplex, keypairIdentity, bundlrStorage } from '@metaplex-foundation/js';
import { Connection, clusterApiUrl, Keypair } from '@solana/web3.js';

// Initialize Solana connection (devnet)
const connection = new Connection(clusterApiUrl('devnet'));

// Load authority wallet (server-side keypair)
const authorityKeypair = Keypair.fromSecretKey(
  Buffer.from(process.env.SOLANA_AUTHORITY_SECRET_KEY!, 'base64')
);

// Initialize Metaplex
const metaplex = Metaplex.make(connection)
  .use(keypairIdentity(authorityKeypair))
  .use(bundlrStorage({
    address: 'https://devnet.bundlr.network',
    providerUrl: 'https://api.devnet.solana.com',
    timeout: 60000
  }));
```

### Certificate Minting Function

```typescript
export async function mintTrainingCertificate(params: {
  recipientWallet: string;
  certificateNumber: number;
  score: number;
  username: string;
  completedAt: Date;
}) {
  const { recipientWallet, certificateNumber, score, username, completedAt } = params;

  // Determine certificate type
  let certificateType: 'standard' | 'advanced' | 'perfect';
  if (score >= 95) certificateType = 'perfect';
  else if (score >= 90) certificateType = 'advanced';
  else certificateType = 'standard';

  // Generate SVG certificate
  const certificateSvg = generateCertificateSVG({
    username,
    score,
    certificateNumber,
    completedAt,
    type: certificateType
  });

  // Upload to Arweave via Bundlr
  const imageUri = await metaplex.storage().upload(
    Buffer.from(certificateSvg),
    { contentType: 'image/svg+xml' }
  );

  // Create metadata
  const metadata = {
    name: `Worldbridger Training Certificate #${certificateNumber}`,
    symbol: 'WBTC',
    description: `Proof of successful completion of Worldbridger One training program. Score: ${score}%`,
    image: imageUri,
    external_url: `https://worldbridgerone.com/certificates/${certificateNumber}`,
    attributes: [
      { trait_type: 'Certificate Type', value: certificateType },
      { trait_type: 'Score', value: `${score}%` },
      { trait_type: 'Completion Date', value: completedAt.toISOString().split('T')[0] },
      { trait_type: 'Certificate Number', value: certificateNumber.toString() },
      { trait_type: 'Network', value: 'Solana Devnet' },
      { trait_type: 'Perfect Score', value: score === 100 ? 'Yes' : 'No' }
    ],
    properties: {
      category: 'certificate',
      creators: [
        {
          address: authorityKeypair.publicKey.toString(),
          share: 100
        }
      ]
    }
  };

  // Upload metadata
  const metadataUri = await metaplex.storage().uploadJson(metadata);

  // Mint NFT
  const { nft } = await metaplex.nfts().create({
    uri: metadataUri,
    name: metadata.name,
    sellerFeeBasisPoints: 0, // No royalties on certificates
    tokenOwner: new PublicKey(recipientWallet),
    isMutable: false, // Certificates are immutable
    collection: {
      address: new PublicKey(process.env.CERTIFICATE_COLLECTION_ADDRESS!),
      verified: true
    }
  });

  return {
    nftMintAddress: nft.address.toString(),
    metadataUri,
    imageUri,
    certificateType,
    transaction: nft.mint.signature
  };
}
```

### Collection Setup

```typescript
// Create certificate collection (run once)
export async function createCertificateCollection() {
  const { nft: collectionNft } = await metaplex.nfts().create({
    name: 'Worldbridger Training Certificates',
    symbol: 'WBTC',
    uri: 'https://arweave.net/collection-metadata',
    sellerFeeBasisPoints: 0,
    isCollection: true,
    collectionAuthority: authorityKeypair
  });

  console.log('Collection created:', collectionNft.address.toString());
  return collectionNft.address.toString();
}
```

---

## UI Components

### Quiz Page (`/training`)

```astro
---
// src/pages/training.astro
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Training Quiz" activeSection="learning">
  <section class="training-hero">
    <div class="container">
      <h1>🎓 Platform Training Quiz</h1>
      <p>Test your knowledge and earn your certificate NFT!</p>
    </div>
  </section>

  <section class="training-content">
    <div class="container">
      <!-- Training Materials -->
      <div id="training-materials" class="materials-section">
        <h2>📚 Study Materials</h2>
        <div class="materials-grid">
          <div class="material-card">
            <span class="material-icon">🎤</span>
            <h3>Rap Battle Guide</h3>
            <p>Learn how battles work, earning badges, and card minting</p>
            <a href="/docs/battles" class="btn-secondary">Read Guide</a>
          </div>

          <div class="material-card">
            <span class="material-icon">🎵</span>
            <h3>Music Studio Tutorial</h3>
            <p>Master the Moog synth, sampler pads, and recording</p>
            <a href="/docs/music-studio" class="btn-secondary">Watch Video</a>
          </div>

          <div class="material-card">
            <span class="material-icon">💎</span>
            <h3>NFT & Cards System</h3>
            <p>Understand rarity, trading, and airdrop rewards</p>
            <a href="/docs/nft-system" class="btn-secondary">Explore</a>
          </div>

          <div class="material-card">
            <span class="material-icon">🏕️</span>
            <h3>Community Guidelines</h3>
            <p>Learn our values, policies, and how we support Urban & Coastal Youth</p>
            <a href="/docs/community" class="btn-secondary">Read More</a>
          </div>
        </div>

        <div class="ready-check">
          <p>Studied all materials?</p>
          <button id="start-quiz-btn" class="btn-primary btn-lg">
            <span class="btn-icon">✍️</span>
            Start Quiz
          </button>
        </div>
      </div>

      <!-- Quiz Container (Hidden Initially) -->
      <div id="quiz-container" class="quiz-section" style="display: none;">
        <div class="quiz-header">
          <div class="quiz-progress">
            <div class="progress-bar">
              <div id="progress-fill" class="progress-fill" style="width: 0%"></div>
            </div>
            <span id="progress-text">Question 1 of 15</span>
          </div>

          <div class="quiz-timer">
            <span class="timer-icon">⏱️</span>
            <span id="time-remaining">15:00</span>
          </div>
        </div>

        <div id="question-container" class="question-container">
          <!-- Dynamic question content -->
        </div>

        <div class="quiz-navigation">
          <button id="prev-btn" class="btn-secondary" disabled>Previous</button>
          <button id="next-btn" class="btn-primary">Next</button>
          <button id="submit-btn" class="btn-success" style="display: none;">Submit Quiz</button>
        </div>
      </div>

      <!-- Results Container (Hidden Initially) -->
      <div id="results-container" class="results-section" style="display: none;">
        <!-- Dynamic results content -->
      </div>

      <!-- Certificate Display (After Passing) -->
      <div id="certificate-container" class="certificate-section" style="display: none;">
        <!-- Dynamic certificate content -->
      </div>
    </div>
  </section>
</BaseLayout>

<script src="/scripts/training-quiz.js"></script>
```

### Quiz Question Component

```typescript
// public/scripts/training-quiz.js

class TrainingQuiz {
  constructor() {
    this.quizData = null;
    this.currentQuestion = 0;
    this.userAnswers = [];
    this.attemptId = null;
    this.startTime = null;
    this.timerInterval = null;
  }

  async loadQuiz() {
    try {
      const response = await fetch('/api/training/quiz');
      const data = await response.json();

      if (!data.userStats.canRetake) {
        alert('You need to wait before retaking the quiz.');
        return false;
      }

      this.quizData = data.quiz;
      return true;
    } catch (error) {
      console.error('Failed to load quiz:', error);
      return false;
    }
  }

  async startQuiz() {
    const loaded = await this.loadQuiz();
    if (!loaded) return;

    // Start attempt
    const response = await fetch('/api/training/quiz/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizId: this.quizData.id,
        walletAddress: window.walletManager?.connectedWallet
      })
    });

    const { attemptId } = await response.json();
    this.attemptId = attemptId;
    this.startTime = Date.now();

    // Hide materials, show quiz
    document.getElementById('training-materials').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'block';

    // Start timer
    this.startTimer();

    // Render first question
    this.renderQuestion();
  }

  renderQuestion() {
    const question = this.quizData.questions[this.currentQuestion];
    const container = document.getElementById('question-container');

    container.innerHTML = `
      <div class="question">
        <div class="question-header">
          <span class="question-category">${question.category}</span>
          <span class="question-points">${question.points} pt</span>
        </div>

        <h3 class="question-text">${question.text}</h3>

        <div class="choices">
          ${question.choices.map((choice, index) => `
            <label class="choice-option">
              <input
                type="radio"
                name="q${this.currentQuestion}"
                value="${choice.id}"
                ${this.userAnswers[this.currentQuestion]?.choiceId === choice.id ? 'checked' : ''}
              />
              <span class="choice-label">
                <span class="choice-letter">${String.fromCharCode(65 + index)}</span>
                <span class="choice-text">${choice.text}</span>
              </span>
            </label>
          `).join('')}
        </div>
      </div>
    `;

    // Update progress
    document.getElementById('progress-text').textContent =
      `Question ${this.currentQuestion + 1} of ${this.quizData.questions.length}`;
    document.getElementById('progress-fill').style.width =
      `${((this.currentQuestion + 1) / this.quizData.questions.length) * 100}%`;

    // Update navigation buttons
    document.getElementById('prev-btn').disabled = this.currentQuestion === 0;
    document.getElementById('next-btn').style.display =
      this.currentQuestion === this.quizData.questions.length - 1 ? 'none' : 'inline-block';
    document.getElementById('submit-btn').style.display =
      this.currentQuestion === this.quizData.questions.length - 1 ? 'inline-block' : 'none';

    // Save answer on selection
    container.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.userAnswers[this.currentQuestion] = {
          questionId: question.id,
          choiceId: e.target.value
        };
      });
    });
  }

  nextQuestion() {
    if (this.currentQuestion < this.quizData.questions.length - 1) {
      this.currentQuestion++;
      this.renderQuestion();
    }
  }

  previousQuestion() {
    if (this.currentQuestion > 0) {
      this.currentQuestion--;
      this.renderQuestion();
    }
  }

  startTimer() {
    const timeLimit = this.quizData.timeLimit * 60; // Convert to seconds
    let timeRemaining = timeLimit;

    this.timerInterval = setInterval(() => {
      timeRemaining--;

      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      document.getElementById('time-remaining').textContent =
        `${minutes}:${seconds.toString().padStart(2, '0')}`;

      if (timeRemaining <= 60) {
        document.getElementById('time-remaining').style.color = '#e74c3c'; // Red
      }

      if (timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.submitQuiz(); // Auto-submit
      }
    }, 1000);
  }

  async submitQuiz() {
    clearInterval(this.timerInterval);

    // Check if all questions answered
    const unanswered = this.quizData.questions.length - this.userAnswers.filter(a => a).length;
    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) {
        return;
      }
    }

    try {
      const response = await fetch('/api/training/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: this.attemptId,
          answers: this.userAnswers.filter(a => a) // Remove empty
        })
      });

      const results = await response.json();
      this.showResults(results);

    } catch (error) {
      console.error('Submit failed:', error);
      alert('Failed to submit quiz. Please try again.');
    }
  }

  showResults(results) {
    // Hide quiz, show results
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('results-container').style.display = 'block';

    const container = document.getElementById('results-container');
    const passed = results.passed;

    container.innerHTML = `
      <div class="results-card ${passed ? 'results-pass' : 'results-fail'}">
        <div class="results-icon">
          ${passed ? '🎉' : '📚'}
        </div>

        <h2>${passed ? 'Congratulations!' : 'Not Quite There'}</h2>
        <p class="results-message">
          ${passed
            ? 'You passed the training quiz! Your certificate is being minted...'
            : 'You need 80% to pass. Review the materials and try again.'}
        </p>

        <div class="results-score">
          <div class="score-circle">
            <span class="score-number">${results.scorePercentage}%</span>
            <span class="score-label">${results.correctAnswers}/${results.totalQuestions}</span>
          </div>
        </div>

        <div class="results-breakdown">
          <h3>Your Answers</h3>
          <div class="answer-review">
            ${results.results.map((result, index) => `
              <div class="answer-item ${result.correct ? 'correct' : 'incorrect'}">
                <div class="answer-header">
                  <span class="answer-number">Q${index + 1}</span>
                  <span class="answer-status">${result.correct ? '✓ Correct' : '✗ Incorrect'}</span>
                </div>
                <p class="answer-explanation">${result.explanation}</p>
              </div>
            `).join('')}
          </div>
        </div>

        ${passed ? `
          <div class="certificate-minting">
            <div class="minting-spinner"></div>
            <p>Minting your certificate NFT...</p>
          </div>
        ` : `
          <button class="btn-primary" onclick="location.reload()">
            Try Again (${results.attemptsRemaining} attempts left today)
          </button>
        `}
      </div>
    `;

    // If passed, mint certificate
    if (passed) {
      this.mintCertificate();
    }
  }

  async mintCertificate() {
    try {
      const response = await fetch('/api/training/certificate/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: this.attemptId,
          walletAddress: window.walletManager?.connectedWallet
        })
      });

      const { certificate, transaction } = await response.json();
      this.showCertificate(certificate, transaction);

    } catch (error) {
      console.error('Minting failed:', error);
      alert('Certificate minting failed. Please contact support.');
    }
  }

  showCertificate(certificate, transaction) {
    document.querySelector('.certificate-minting').innerHTML = `
      <div class="certificate-success">
        <h3>✅ Certificate Minted!</h3>
        <p>Certificate #${certificate.certificateNumber}</p>

        <div class="certificate-preview">
          <img src="${certificate.imageUrl}" alt="Certificate" />
        </div>

        <div class="certificate-details">
          <p><strong>Type:</strong> ${certificate.certificateType}</p>
          <p><strong>Score:</strong> ${certificate.score}%</p>
          <p><strong>NFT Address:</strong> ${certificate.nftMintAddress}</p>
        </div>

        <div class="certificate-actions">
          <a href="${transaction.explorerUrl}" target="_blank" class="btn-secondary">
            View on Solana Explorer
          </a>
          <a href="/certificates/${certificate.certificateNumber}" class="btn-primary">
            View Certificate
          </a>
          <button onclick="window.navigator.share({
            title: 'I earned my Worldbridger certificate!',
            text: 'Just completed the training quiz with ${certificate.score}%!',
            url: window.location.href
          })" class="btn-share">
            Share
          </button>
        </div>
      </div>
    `;

    // Award XP
    if (window.xpManager) {
      window.xpManager.awardXP(100, 'Earned training certificate');
    }
  }
}

// Initialize
const quiz = new TrainingQuiz();

document.getElementById('start-quiz-btn')?.addEventListener('click', () => {
  quiz.startQuiz();
});

document.getElementById('next-btn')?.addEventListener('click', () => {
  quiz.nextQuestion();
});

document.getElementById('prev-btn')?.addEventListener('click', () => {
  quiz.previousQuestion();
});

document.getElementById('submit-btn')?.addEventListener('click', () => {
  quiz.submitQuiz();
});
```

---

## Certificate Verification Page

### `/certificates/[number]`

```astro
---
// src/pages/certificates/[number].astro
import BaseLayout from '../../layouts/BaseLayout.astro';

export function getStaticPaths() {
  return [{ params: { number: 'placeholder' } }];
}

const { number } = Astro.params;
---

<BaseLayout title="Certificate Verification">
  <section class="certificate-verify">
    <div class="container">
      <h1>🎓 Certificate Verification</h1>
      <p>Verify the authenticity of training certificates</p>

      <div id="certificate-display" class="certificate-card">
        <!-- Dynamic content loaded via API -->
      </div>

      <div class="verification-status">
        <div id="verification-badge"></div>
      </div>

      <div class="certificate-metadata">
        <h3>Certificate Details</h3>
        <div id="cert-details"></div>
      </div>
    </div>
  </section>
</BaseLayout>

<script define:vars={{ certNumber: number }}>
  async function loadCertificate() {
    const response = await fetch(`/api/training/certificate/${certNumber}`);
    const { certificate } = await response.json();

    document.getElementById('certificate-display').innerHTML = `
      <img src="${certificate.imageUrl}" alt="Certificate" class="cert-image" />
    `;

    document.getElementById('verification-badge').innerHTML = certificate.verified
      ? '<div class="badge-verified">✓ Verified Authentic</div>'
      : '<div class="badge-invalid">⚠️ Invalid Certificate</div>';

    document.getElementById('cert-details').innerHTML = `
      <table class="details-table">
        <tr><td>Holder:</td><td>${certificate.holder}</td></tr>
        <tr><td>Score:</td><td>${certificate.score}%</td></tr>
        <tr><td>Type:</td><td>${certificate.type}</td></tr>
        <tr><td>Issued:</td><td>${new Date(certificate.issuedAt).toLocaleDateString()}</td></tr>
        <tr><td>NFT Address:</td><td><code>${certificate.nftMintAddress}</code></td></tr>
        <tr><td>Cohort:</td><td>${certificate.cohort}</td></tr>
      </table>
    `;
  }

  loadCertificate();
</script>
```

---

## Next Steps

### Implementation Priority

1. **Week 1**: Database schema + quiz content creation
2. **Week 2**: API endpoints + quiz UI
3. **Week 3**: Solana integration + certificate minting
4. **Week 4**: Testing + refinement + launch

### Testing Plan

- [ ] Create 15 quiz questions across all topics
- [ ] Test quiz flow (start, answer, submit)
- [ ] Test timer functionality
- [ ] Test passing/failing scenarios
- [ ] Test devnet NFT minting
- [ ] Test certificate verification
- [ ] Test cooldown/retry limits
- [ ] Mobile responsive testing
- [ ] Cross-browser compatibility

---

**Document Status**: Planning Complete - Ready for Implementation
**Created**: January 3, 2026
**Next**: Begin database schema implementation
