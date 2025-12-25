# Complete Forms Reference
## Hobby Farm Gamification Platform - All Forms & Placeholders

**Created for**: WorldBridger One / POREFPC  
**Purpose**: Comprehensive catalog of all forms with implementation notes  
**Technology Stack**: Astro.js + Vanilla JavaScript + Nile DB

---

## 📋 Table of Contents

1. [Music Studio Forms](#music-studio-forms)
2. [Learning Hub Forms](#learning-hub-forms)
3. [Kakuma Impact Forms](#kakuma-impact-forms)
4. [Profile & Settings Forms](#profile--settings-forms)
5. [NFT Interaction Forms](#nft-interaction-forms)
6. [Quick Reference Table](#quick-reference-table)

---

## 🎵 Music Studio Forms

### Form 1: Track Upload Form
**Location**: `music.astro` - Tab 1: Create Track  
**Purpose**: Upload new music tracks with metadata

**Fields**:
- `title` (text, required, max 200 chars) - Track title
- `genre` (select, required) - Genre selection (rap, reggae, dancehall, etc.)
- `audioFile` (file upload, required) - Audio file (MP3, WAV, M4A, max 20MB)
- `coverArt` (file upload, optional) - Cover art image (JPG, PNG, WebP, max 5MB)
- `lyrics` (textarea, optional) - Full track lyrics with verse markers
- `description` (textarea, optional, max 1000 chars) - Track description
- `isCollaboration` (checkbox) - Mark as collaboration
- `collaborators` (dynamic list, conditional) - Collaborator wallet addresses
- `mintAsNft` (checkbox) - Option to mint track as NFT
- `releaseOption` (radio) - Publish now / Save as draft / Schedule release

**TODO Comments**:
```html
<!-- TODO: Add audio preview player -->
<!-- TODO: Show waveform visualization -->
<!-- TODO: Upload to IPFS/S3/Blob storage -->
<!-- TODO: Implement NFT minting integration -->
<!-- TODO: Add date/time picker for scheduled release -->
<!-- TODO: Implement collaborator search/autocomplete -->
```

**API Endpoint**: `POST /api/music/create-track`  
**XP Reward**: +100 XP (base) + bonuses for lyrics/collaboration

---

### Form 2: Create Rap Battle
**Location**: `music.astro` - Tab 2: Rap Battles (Modal)  
**Purpose**: Challenge others to rap battles

**Fields**:
- `opponentType` (radio) - Open challenge / Specific user
- `opponentWallet` (text, conditional) - Specific opponent's wallet address
- `category` (select, required) - Battle category (conscious, wordplay, flow, etc.)
- `rounds` (select) - Number of rounds (1, 2, 3, 5)
- `barsPerRound` (select) - Bars per round (8, 16, 32)
- `timeLimit` (select) - Time limit (24h, 48h, 72h)
- `stake` (number, optional) - Stake amount
- `stakeCurrency` (select) - XP or SOL
- `theme` (text, optional) - Battle theme/topic

**TODO Comments**:
```html
<!-- TODO: Load active battles from API -->
<!-- TODO: Implement battle submission interface -->
<!-- TODO: Add voting system integration -->
<!-- TODO: Implement stake payment handling -->
```

**API Endpoint**: `POST /api/music/create-battle`  
**XP Reward**: +150 XP if won

---

## 🌱 Learning Hub Forms

### Form 3: Submit Observation
**Location**: `learning.astro` - Citizen Science Projects (Modal)  
**Purpose**: Submit environmental data observations

**Fields**:
- `projectId` (select, required) - Which project to submit to
- `observationType` (select, required) - 8 types (temperature, rainfall, wind, crop yield, soil moisture, pest activity, plant health, water quality)
- `measurement` (number, required) - Measurement value
- `unit` (select, required) - Unit of measurement (°C, °F, mm, cm, kg, etc.)
- `location` (text, required) - Location description
- `datetime` (datetime-local, required) - When observation was made
- `weatherConditions` (select, optional) - Weather during observation
- `notes` (textarea, optional) - Additional context
- `photos` (file upload, multiple, optional) - Supporting photos
- `dataQuality` (radio, required) - Self-assessment (1-5 scale)

**TODO Comments**:
```html
<!-- TODO: Add GPS coordinates capture -->
<!-- TODO: Upload photos to IPFS -->
<!-- TODO: Show observation on map view -->
<!-- TODO: Implement photo preview grid -->
```

**API Endpoint**: `POST /api/environmental/submit-observation`  
**XP Reward**: +75 XP per observation

---

### Form 4: Course Enrollment
**Location**: `learning.astro` - Course Cards  
**Purpose**: Enroll in environmental courses

**Fields**:
- Implicit: User clicks "Enroll" button on course card
- `courseId` (passed from course card)
- `walletAddress` (from connected wallet)

**TODO Comments**:
```html
<!-- TODO: Check course prerequisites -->
<!-- TODO: Show enrollment confirmation modal -->
<!-- TODO: Award enrollment XP -->
```

**API Endpoint**: `POST /api/environmental/enroll-course`  
**XP Reward**: +25 XP on enrollment

---

## 🏕️ Kakuma Impact Forms

### Form 5: Make Donation
**Location**: `kakuma.astro` - Donation Modal  
**Purpose**: Support Kakuma projects with donations

**Fields**:
- `projectId` (select, required) - Specific project or general fund
- `amount` (number, required) - Donation amount (min $1)
- `currency` (select) - USD or SOL
- `recurring` (checkbox) - Make it monthly recurring
- `message` (textarea, optional) - Message to youth
- `anonymous` (checkbox) - Donate anonymously

**TODO Comments**:
```html
<!-- TODO: Integrate payment processor (Stripe/Solana Pay) -->
<!-- TODO: Generate donation receipt -->
<!-- TODO: Send notification to project coordinators -->
<!-- TODO: Calculate and display impact preview -->
<!-- TODO: Implement recurring donation scheduling -->
```

**API Endpoint**: `POST /api/kakuma/donate`  
**XP Reward**: Variable based on amount

---

### Form 6: Project Support
**Location**: `kakuma.astro` - Project Cards  
**Purpose**: Quick support actions for projects

**Fields**:
- `projectId` (from card)
- `actionType` (share, volunteer, fund)
- `walletAddress` (from connected wallet)

**TODO Comments**:
```html
<!-- TODO: Implement share to social media -->
<!-- TODO: Create volunteer signup flow -->
<!-- TODO: Track project engagement -->
```

**API Endpoint**: `POST /api/kakuma/support-project`  
**XP Reward**: Varies by action

---

## 👤 Profile & Settings Forms

### Form 7: Basic Information
**Location**: `profile.astro` - Tab: Basic Info  
**Purpose**: Update user profile information

**Fields**:
- `username` (text, required, 3-20 chars, alphanumeric+underscore) - Unique username
- `displayName` (text, optional, max 50 chars) - Display name
- `email` (email, optional) - Email address
- `bio` (textarea, optional, max 500 chars) - User bio
- `location` (text, optional, max 100 chars) - City, Country
- `language` (select) - Primary language
- `timezone` (select) - User timezone

**TODO Comments**:
```html
<!-- TODO: Add real-time username availability check -->
<!-- TODO: Add email verification flow -->
<!-- TODO: Implement character counter for bio -->
```

**API Endpoint**: `POST /api/profile/upsert`  
**XP Reward**: +25 XP on first profile completion

---

### Form 8: Preferences
**Location**: `profile.astro` - Tab: Preferences  
**Purpose**: Set platform preferences

**Fields**:
- `themeMode` (radio) - Auto / Light / Dark
- `favoriteAnimals` (checkbox, max 3) - Favorite NFT animals
- `interests` (checkbox, multiple) - Content interests
- `musicPrefs` (checkbox, multiple) - Music display preferences
- `learningPace` (select) - Relaxed / Moderate / Intensive

**TODO Comments**:
```html
<!-- TODO: Apply preferences in real-time -->
<!-- TODO: Limit favorite animals to 3 selections -->
<!-- TODO: Save to localStorage for instant apply -->
```

**API Endpoint**: `POST /api/profile/update-preferences`  
**XP Reward**: None

---

### Form 9: Notification Settings
**Location**: `profile.astro` - Tab: Notifications  
**Purpose**: Configure notification preferences

**Fields**:
- Email notifications (11 toggles):
  - `email-levelup` (toggle) - Level up notifications
  - `email-achievement` (toggle) - Achievement unlocks
  - `email-battle` (toggle) - Battle invites
  - `email-collab` (toggle) - Collaboration requests
  - `email-course` (toggle) - Course updates
  - `email-weekly` (toggle) - Weekly summary
  - (+ 5 more)
- Push notifications (4 toggles):
  - `push-enabled` (toggle) - Enable push
  - `push-xp` (toggle) - XP milestones
  - `push-comments` (toggle) - Track comments
  - `push-mentor` (toggle) - Mentor messages
- Marketing (2 toggles):
  - `marketing-newsletter` (toggle) - Newsletter
  - `marketing-kakuma` (toggle) - Kakuma updates

**TODO Comments**:
```html
<!-- TODO: Request browser permission for push -->
<!-- TODO: Implement email verification before enabling -->
<!-- TODO: Test notification delivery -->
```

**API Endpoint**: `POST /api/profile/update-notifications`  
**XP Reward**: None

---

### Form 10: Privacy Settings
**Location**: `profile.astro` - Tab: Privacy  
**Purpose**: Configure privacy and visibility

**Fields**:
- `profileVisibility` (radio) - Public / Members Only / Private
- `showStats` (checkbox, multiple) - Which stats to show on profile
- `activityVisibility` (radio) - Public / Hidden

**TODO Comments**:
```html
<!-- TODO: Preview how profile looks to others -->
<!-- TODO: Implement account deactivation flow -->
<!-- TODO: Implement account deletion with confirmation -->
```

**API Endpoint**: `POST /api/profile/update-privacy`  
**XP Reward**: None

---

### Form 11: Kakuma Refugee Profile
**Location**: `profile.astro` - Tab: Kakuma Profile  
**Purpose**: Special profile for Kakuma residents

**Fields**:
- `isKakumaYouth` (checkbox) - Resident confirmation
- `kakumaSection` (select, conditional) - Camp section (Kakuma 1-4, Kalobeyei)
- `kakumaBlock` (text, conditional) - Block/Zone
- `ageGroup` (select, conditional) - Age group (13-17, 18-24, 25-30, 31+)
- `kakumaInterests` (checkbox, multiple, conditional) - Learning interests
- `deviceAccess` (select, conditional) - How they access platform
- `preferredContact` (select, conditional) - Contact method
- `whatsappNumber` (tel, conditional) - WhatsApp number

**TODO Comments**:
```html
<!-- TODO: Integrate with Kakuma coordinator verification -->
<!-- TODO: Add document upload for verification -->
<!-- TODO: Create verification workflow -->
<!-- TODO: Send WhatsApp verification code -->
```

**API Endpoint**: `POST /api/profile/update-kakuma`  
**XP Reward**: +100 XP on verification

---

### Form 12: Connected Accounts
**Location**: `profile.astro` - Tab: Connected Accounts  
**Purpose**: Link social and music accounts

**Accounts**:
- Solana Wallet (primary)
- Twitter/X (OAuth)
- Discord (OAuth)
- Spotify (OAuth)
- SoundCloud (OAuth)

**TODO Comments**:
```html
<!-- TODO: Implement OAuth flows for each platform -->
<!-- TODO: Add disconnect account functionality -->
<!-- TODO: Show connected account benefits -->
<!-- TODO: Sync profile data from connected accounts -->
```

**API Endpoints**: Multiple OAuth callback endpoints  
**XP Reward**: +50 XP per connected account

---

## 💎 NFT Interaction Forms

### Form 13: Claim NFT
**Location**: `nft/[id].astro` - Claim Modal  
**Purpose**: Claim free/available NFT

**Fields**:
- `nftId` (from URL)
- `walletAddress` (from connected wallet)
- `acceptTerms` (checkbox, required) - Accept terms

**TODO Comments**:
```html
<!-- TODO: Check claim eligibility (level, existing NFTs) -->
<!-- TODO: Implement Solana NFT minting -->
<!-- TODO: Handle gas fee estimation and payment -->
<!-- TODO: Award holder benefits immediately -->
```

**API Endpoint**: `POST /api/nft/claim`  
**XP Reward**: Varies by NFT rarity

---

### Form 14: Buy NFT
**Location**: `nft/[id].astro` - Buy Modal  
**Purpose**: Purchase listed NFT

**Fields**:
- `nftId` (from URL)
- `buyerWallet` (from connected wallet)
- `acceptBuyTerms` (checkbox, required) - Confirm purchase

**TODO Comments**:
```html
<!-- TODO: Check wallet balance before purchase -->
<!-- TODO: Implement Solana marketplace transaction -->
<!-- TODO: Handle platform fee and royalty splits -->
<!-- TODO: Transfer NFT ownership on-chain -->
```

**API Endpoint**: `POST /api/nft/buy`  
**XP Reward**: None (purchase only)

---

### Form 15: Make Offer
**Location**: `nft/[id].astro` - Offer Modal  
**Purpose**: Make offer on unlisted NFT

**Fields**:
- `nftId` (from URL)
- `offerAmount` (number, required, min 0.1) - Offer in SOL
- `expiration` (select) - 1, 3, 7, or 30 days
- `message` (textarea, optional, max 500 chars) - Message to owner

**TODO Comments**:
```html
<!-- TODO: Hold offer amount in escrow -->
<!-- TODO: Notify owner of new offer -->
<!-- TODO: Implement offer acceptance/rejection flow -->
<!-- TODO: Auto-cancel expired offers and return funds -->
```

**API Endpoint**: `POST /api/nft/make-offer`  
**XP Reward**: None

---

### Form 16: List for Sale
**Location**: `nft/[id].astro` - List Sale Modal  
**Purpose**: List owned NFT for sale

**Fields**:
- `nftId` (from URL)
- `listingPrice` (number, required, min 0.1) - Price in SOL
- `duration` (select) - 7, 14, 30, 90 days, or no expiration
- `reservedFor` (text, conditional) - Reserve for specific buyer wallet

**TODO Comments**:
```html
<!-- TODO: Verify NFT ownership before listing -->
<!-- TODO: Disable NFT benefits while listed -->
<!-- TODO: Calculate and show fee breakdown -->
<!-- TODO: Create on-chain listing -->
```

**API Endpoint**: `POST /api/nft/list-for-sale`  
**XP Reward**: None

---

### Form 17: Avatar Upload
**Location**: `profile.astro` - Avatar Modal  
**Purpose**: Upload profile avatar image

**Fields**:
- `avatarFile` (file upload, required) - Image file (PNG, JPG, GIF, max 2MB)

**TODO Comments**:
```html
<!-- TODO: Implement image cropper for square aspect ratio -->
<!-- TODO: Upload to IPFS or cloud storage -->
<!-- TODO: Generate thumbnails (400x400, 100x100, 50x50) -->
<!-- TODO: Update profile with new avatar URL -->
```

**API Endpoint**: `POST /api/profile/upload-avatar`  
**XP Reward**: +10 XP on first avatar

---

## 📊 Quick Reference Table

| Form # | Name | Location | Required Fields | Optional Fields | XP Reward | Priority |
|--------|------|----------|----------------|-----------------|-----------|----------|
| 1 | Track Upload | music.astro | title, genre, audioFile | coverArt, lyrics, description, collaborators, NFT options | +100 | HIGH |
| 2 | Rap Battle | music.astro | category, rounds, bars | opponent, stake, theme | +150 (win) | HIGH |
| 3 | Submit Observation | learning.astro | project, type, measurement, unit, location, datetime, quality | weather, notes, photos | +75 | MEDIUM |
| 4 | Course Enrollment | learning.astro | courseId | none | +25 | MEDIUM |
| 5 | Donation | kakuma.astro | project, amount | message, recurring, anonymous | Variable | HIGH |
| 6 | Project Support | kakuma.astro | projectId, action | none | Variable | LOW |
| 7 | Basic Info | profile.astro | username | displayName, email, bio, location, language, timezone | +25 | HIGH |
| 8 | Preferences | profile.astro | none | all fields | None | LOW |
| 9 | Notifications | profile.astro | none | all toggles | None | LOW |
| 10 | Privacy | profile.astro | none | all fields | None | LOW |
| 11 | Kakuma Profile | profile.astro | section, age (if Kakuma) | interests, contact, whatsapp | +100 | MEDIUM |
| 12 | Connected Accounts | profile.astro | OAuth flows | none | +50 each | MEDIUM |
| 13 | Claim NFT | nft/[id].astro | acceptTerms | none | Varies | HIGH |
| 14 | Buy NFT | nft/[id].astro | acceptBuyTerms | none | None | MEDIUM |
| 15 | Make Offer | nft/[id].astro | offerAmount, expiration | message | None | LOW |
| 16 | List for Sale | nft/[id].astro | listingPrice, duration | reservedFor | None | MEDIUM |
| 17 | Avatar Upload | profile.astro | avatarFile | none | +10 | LOW |

---

## 🔄 Form Implementation Workflow

### Phase 1: Core Forms (Week 1-2)
1. ✅ Track Upload (Form 1)
2. ✅ Basic Profile Info (Form 7)
3. ✅ Claim NFT (Form 13)

### Phase 2: Engagement Forms (Week 3-4)
4. ✅ Rap Battle Creation (Form 2)
5. ✅ Submit Observation (Form 3)
6. ✅ Donation (Form 5)

### Phase 3: Settings & Preferences (Week 5-6)
7. ✅ Preferences (Form 8)
8. ✅ Notifications (Form 9)
9. ✅ Privacy (Form 10)
10. ✅ Kakuma Profile (Form 11)

### Phase 4: NFT Marketplace (Week 7-8)
11. ✅ Buy NFT (Form 14)
12. ✅ Make Offer (Form 15)
13. ✅ List for Sale (Form 16)

### Phase 5: Polish & Extras (Week 9-10)
14. ✅ Connected Accounts (Form 12)
15. ✅ Avatar Upload (Form 17)
16. ✅ Course Enrollment (Form 4)
17. ✅ Project Support (Form 6)

---

## 🛠️ Common Implementation Patterns

### File Upload Pattern
```javascript
// Drag & drop area
<div class="file-upload-area" id="upload-zone">
  <input type="file" id="file-input" accept="..." hidden />
  <div class="upload-content">
    <div class="upload-icon">📎</div>
    <p>Click to upload or drag and drop</p>
  </div>
</div>

// JavaScript handler
document.getElementById('upload-zone').addEventListener('click', () => {
  document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  // TODO: Upload to IPFS/S3/Blob
  const url = await uploadFile(file);
});
```

### Form Validation Pattern
```javascript
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Client-side validation
  if (!validate()) {
    showError('Please fill all required fields');
    return;
  }
  
  // Collect form data
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  // Add wallet address
  data.walletAddress = window.walletManager?.connectedWallet;
  
  // Submit to API
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Award XP
      await window.progressManager?.awardXP(amount, type, description);
      
      // Show success
      showSuccess('Action completed!');
      
      // Close modal/reset form
      closeModal();
    }
  } catch (error) {
    showError('Something went wrong. Please try again.');
  }
});
```

### XP Award Pattern
```javascript
// After successful form submission
await window.progressManager?.awardXP(
  100,                    // Amount
  'track_upload',        // Activity type
  'Uploaded new track'   // Description
);

// This triggers:
// 1. XP toast notification
// 2. Level up modal (if applicable)
// 3. Achievement check
// 4. Progress dashboard update
```

### Modal Toggle Pattern
```javascript
// Open modal
function openModal() {
  document.getElementById('modal-id').style.display = 'flex';
}

// Close modal
function closeModal() {
  document.getElementById('modal-id').style.display = 'none';
  document.getElementById('form-id').reset();
}

// Close on backdrop click
document.querySelector('.modal-overlay').addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    closeModal();
  }
});
```

---

## 🎯 Form-Specific Implementation Notes

### Track Upload (Form 1)
**Storage Options**:
1. **IPFS** (recommended for decentralization)
   - Use `ipfs-http-client` or Pinata
   - Store metadata and files on-chain reference
   
2. **Vercel Blob** (easiest for MVP)
   - Use `@vercel/blob` package
   - Simple upload with CDN delivery
   
3. **AWS S3** (enterprise solution)
   - Use `aws-sdk`
   - Full control over storage

**Audio Processing**:
- Generate waveform using `wavesurfer.js`
- Extract metadata using `music-metadata`
- Validate file format and duration

---

### Rap Battle (Form 2)
**Battle Flow**:
1. Create challenge → `pending`
2. Opponent accepts → `in_progress`
3. Both submit verses → `voting`
4. Voting period (48h) → `completed`

**Judging Implementation**:
- Peer voting: weighted by user level
- Expert panel: Kakuma coordinators + platform admins
- AI mentor: OpenAI GPT-4 analysis (lyrics, flow, message)

---

### Submit Observation (Form 3)
**Data Quality Assurance**:
- Photos increase credibility
- GPS coordinates verify location
- Cross-reference with weather APIs
- Flag outliers for manual review

**Impact Tracking**:
- All observations feed into research database
- Monthly reports to Kakuma coordinators
- Data used for grant applications
- Contributors get paid for quality data

---

### Donation (Form 5)
**Payment Integration**:
1. **Stripe** for USD donations
   - Set up Stripe Connect for project accounts
   - Handle recurring subscriptions
   
2. **Solana Pay** for crypto donations
   - Direct wallet-to-wallet transfers
   - Lower fees, instant settlement

**Receipt Generation**:
- PDF receipt with transaction details
- Email confirmation
- Tax documentation (if applicable)
- Impact report (what donation achieves)

---

### Kakuma Profile (Form 11)
**Verification Process**:
1. User submits profile
2. Platform flags for verification
3. Kakuma coordinator contacts via WhatsApp
4. In-person verification or video call
5. Coordinator approves → benefits activate
6. Special badge on profile

**Benefits After Verification**:
- 100% free platform access
- Priority in mentor matching
- Income opportunities
- Direct project participation
- Success story features

---

### NFT Forms (Forms 13-16)
**Blockchain Integration**:
- Use Solana Web3.js
- Phantom wallet for transactions
- Metaplex for NFT standard
- Escrow for offers/sales

**Gas Fee Handling**:
- Estimate fees before transaction
- Show clear breakdown
- Option to adjust priority fee
- Failed transaction recovery

---

## ✅ Testing Checklist

### For Each Form:
- [ ] All required fields validate
- [ ] Optional fields work correctly
- [ ] Character/file limits enforced
- [ ] Success messages display
- [ ] Error handling works
- [ ] XP awards correctly
- [ ] Database updates properly
- [ ] Modals open/close smoothly
- [ ] Form resets after submission
- [ ] Mobile responsive
- [ ] Accessibility (ARIA labels, keyboard navigation)

---

## 📚 Additional Resources

### Validation Libraries
- Native HTML5 validation (built-in)
- Custom JavaScript validation (we're using this)
- Consider: Zod for schema validation

### File Upload Services
- IPFS: https://docs.ipfs.tech/
- Pinata: https://docs.pinata.cloud/
- Vercel Blob: https://vercel.com/docs/storage/vercel-blob
- AWS S3: https://aws.amazon.com/s3/

### Payment Processing
- Stripe: https://stripe.com/docs
- Solana Pay: https://docs.solanapay.com/

### Form UX Best Practices
- https://www.nngroup.com/articles/web-form-design/
- https://www.smashingmagazine.com/web-form-design-patterns/

---

**Created by Mupy for WorldBridger One**  
**Supporting Kakuma Refugee Camp & POREFPC Initiative**  
**GPL-3.0 License**

🌾 Every form connects music, science, and humanitarian impact! ✨
