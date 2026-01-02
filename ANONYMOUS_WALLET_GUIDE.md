# Anonymous Wallet System Guide

## Overview

The **Anonymous Wallet System** automatically creates a temporary, claimable wallet for users who visit the platform without connecting a real wallet. This removes friction and allows users to start earning XP, tracking progress, and participating in activities immediately.

## How It Works

### 1. **Automatic Creation**

When a user visits any page without a connected wallet:
- System generates a unique anonymous wallet identifier (`anon_XXXXXXXXXX`)
- Stored in localStorage for persistence across sessions
- User can immediately start earning XP and tracking activity

### 2. **Activity Tracking**

All user activity is tracked against the anonymous wallet:
- ✅ XP and level progression
- ✅ Airdrop token balance
- ✅ Profile data
- ✅ Battle records
- ✅ Collaboration history
- ✅ Achievement unlocks

### 3. **Visual Indicators**

Users see clear indicators they're in anonymous mode:
- **Top Banner**: Purple gradient banner with "Connect Wallet" button
- **Profile Notice**: Info card explaining anonymous mode
- **Pulsing Button**: Connect wallet button pulses to draw attention
- **Button Text**: Changes from "Connect Wallet" to "Claim Progress"

### 4. **Claiming Progress**

When user connects a real wallet:
1. System detects existing anonymous wallet data
2. Prompts: "You have progress saved anonymously. Transfer it?"
3. If accepted, all data transfers to real wallet
4. Anonymous wallet data is cleared
5. Success toast notification appears

## Technical Implementation

### WalletManager Updates

```javascript
class WalletManager {
  async initialize() {
    // Check for real wallet first
    const savedWallet = localStorage.getItem('connectedWallet');
    if (savedWallet) {
      await this.connect(savedWallet);
      return;
    }

    // No real wallet - create anonymous
    await this.ensureAnonymousWallet();
  }

  async ensureAnonymousWallet() {
    let anonWallet = localStorage.getItem('anonymousWallet');

    if (!anonWallet) {
      anonWallet = 'anon_' + this.generateRandomId();
      localStorage.setItem('anonymousWallet', anonWallet);
    }

    this.anonymousWallet = anonWallet;
    this.connectedWallet = anonWallet;
    this.isAnonymous = true;

    await window.progressManager?.loadProgress(anonWallet);
    this.showAnonymousBanner();
  }

  async claimAnonymousWallet(realWalletAddress) {
    // Transfer progress data
    const anonProgress = localStorage.getItem(`progress_${this.anonymousWallet}`);
    if (anonProgress) {
      localStorage.setItem(`progress_${realWalletAddress}`, anonProgress);
    }

    // Transfer airdrop balance
    const anonBalance = localStorage.getItem(`airdrop_balance_${this.anonymousWallet}`);
    if (anonBalance) {
      localStorage.setItem(`airdrop_balance_${realWalletAddress}`, anonBalance);
    }

    // Clear anonymous data
    localStorage.removeItem('anonymousWallet');
  }
}
```

### Profile Page Updates

```javascript
async initialize() {
  const walletAddress = window.walletManager?.connectedWallet;
  const isAnonymous = window.walletManager?.isAnonymous;

  // Allow anonymous users - don't redirect
  if (!walletAddress) {
    window.location.href = '/';
    return;
  }

  // Show notice for anonymous users
  if (isAnonymous) {
    this.showAnonymousNotice();
  }

  await this.loadUserProfile(walletAddress);
  this.populateForms();
  this.setupEventListeners();
}
```

## User Experience Flow

### New User Journey

1. **Lands on site** → Anonymous wallet auto-created
2. **Sees banner** → "You're earning XP anonymously"
3. **Explores platform** → Earns XP, completes battles, claims airdrops
4. **Clicks "Claim Progress"** → Prompted to connect wallet
5. **Connects wallet** → All progress transfers automatically
6. **Banner disappears** → Now using real wallet

### Returning Anonymous User

1. **Returns to site** → Same anonymous wallet loaded from localStorage
2. **All progress intact** → XP, level, tokens preserved
3. **Can continue** → Keep earning anonymously
4. **Can claim anytime** → No pressure to connect immediately

### Returning Real Wallet User

1. **Returns to site** → Real wallet loaded from localStorage
2. **No banner shown** → Clean interface
3. **All progress synced** → Data tied to real wallet

## localStorage Structure

### Anonymous Wallet Data

```javascript
{
  // Anonymous wallet identifier
  "anonymousWallet": "anon_Xk3mP9q2Lz7R4nW8vY1tC5sB6jH0fG2d",
  "anonymousWalletCreated": "2025-01-01T12:00:00.000Z",

  // Progress data (keyed by wallet address)
  "progress_anon_Xk3mP9q2...": {
    "success": true,
    "wallet_address": "anon_Xk3mP9q2...",
    "level": {
      "current": 5,
      "title": "Seedling Farmer"
    },
    "xp": {
      "current": 1250,
      "required": 1500,
      "percentage": 83
    },
    "progression": {
      "lifeStage": "Youth",
      "animalMentor": "chicken"
    }
  },

  // Airdrop balance (keyed by wallet address)
  "airdrop_balance_anon_Xk3mP9q2...": {
    "balance": 450,
    "totalEarned": 750,
    "claimedRewards": ["artist-stream-boost", "edu-quiz-master"]
  }
}
```

## Benefits

### For Users

✅ **Zero friction** - Start earning immediately, no wallet required
✅ **No pressure** - Connect wallet when ready, not before
✅ **No data loss** - All progress saved and transferable
✅ **Try before commit** - Explore platform anonymously
✅ **Mobile friendly** - Works without wallet apps installed

### For Platform

✅ **Higher engagement** - Users start activities immediately
✅ **Better conversion** - Users more likely to connect after earning
✅ **Lower bounce rate** - No wallet requirement barrier
✅ **Truthful tracking** - All activity documented from day one
✅ **Viral potential** - Easy to share and demo

## Security Considerations

### Current Implementation (localStorage)

⚠️ **Browser-specific**: Data tied to single browser/device
⚠️ **Can be cleared**: User clearing browser data loses progress
⚠️ **Not portable**: Can't access from different device
⚠️ **No authentication**: Anyone with browser access can use

### Future Improvements

🔒 **Session tokens** - Temporary server-side session for anonymous users
🔒 **Magic links** - Email-based claiming without wallet
🔒 **QR codes** - Transfer anonymous wallet to mobile
🔒 **Expiration** - Anonymous wallets expire after 30 days of inactivity
🔒 **Rate limiting** - Prevent abuse of anonymous accounts

## API Compatibility

Anonymous wallets work with all existing APIs:
- `/api/gamification/user-progress?walletAddress=anon_XXXXX` ✅
- `/api/kakuma/user-impact?walletAddress=anon_XXXXX` ✅
- `/api/profile/get?walletAddress=anon_XXXXX` ✅
- Airdrop claims with anonymous wallet ✅
- Battle participation with anonymous wallet ✅

Backend treats anonymous wallets as valid wallet addresses.

## Monitoring & Analytics

Track anonymous wallet metrics:
- **Creation rate**: How many new anonymous wallets per day
- **Claim rate**: % of anonymous wallets that get claimed
- **Time to claim**: Average time before user connects wallet
- **Abandonment rate**: % of anonymous wallets never claimed
- **Activity level**: XP earned by anonymous vs. real wallets

## Testing

### Test Anonymous Flow

```bash
# 1. Open site in incognito/private mode
# 2. Check localStorage for anonymousWallet key
# 3. Earn some XP (test button or activity)
# 4. Refresh page - verify progress persists
# 5. Click "Claim Progress" button
# 6. "Connect" a test wallet
# 7. Verify progress transferred
# 8. Check localStorage - anonymous keys removed
```

### Test Edge Cases

- ✅ Multiple tabs (same anonymous wallet)
- ✅ Clearing localStorage (creates new anonymous wallet)
- ✅ Disconnecting wallet (reverts to anonymous)
- ✅ Real wallet → Anonymous → Real wallet (claim flow)

## Best Practices

### For Users

- ✅ Connect wallet before clearing browser data
- ✅ Claim progress before switching browsers
- ✅ Don't share anonymous progress links (not supported)

### For Developers

- ✅ Always check `walletManager.isAnonymous` before wallet operations
- ✅ Prefix anonymous wallets with `anon_` for easy identification
- ✅ Gracefully handle missing anonymous data
- ✅ Test claim flow thoroughly
- ✅ Log anonymous → real wallet conversions

## Troubleshooting

**Q: Anonymous wallet not persisting?**
- Check localStorage is enabled
- Verify not in private/incognito mode
- Check browser storage limits

**Q: Progress not transferring on claim?**
- Check browser console for errors
- Verify both wallets have localStorage keys
- Try manual transfer (copy/paste in console)

**Q: Banner not showing?**
- Check CSS is loaded
- Verify `showAnonymousBanner()` called
- Inspect DOM for #anonymous-wallet-banner

**Q: Button not pulsing?**
- Check `btn-pulse` class applied
- Verify CSS animation loaded
- Test in different browser

## Roadmap

### Phase 1: Basic Anonymous Wallets ✅
- [x] Auto-generation on page load
- [x] localStorage persistence
- [x] Progress tracking
- [x] Visual indicators

### Phase 2: Enhanced Claiming (Next)
- [ ] Email-based claiming
- [ ] QR code transfer
- [ ] Multi-device sync
- [ ] Grace period after claiming

### Phase 3: Backend Integration
- [ ] Server-side anonymous sessions
- [ ] Database storage for anonymous wallets
- [ ] Analytics dashboard
- [ ] Expiration & cleanup

### Phase 4: Advanced Features
- [ ] Anonymous wallet marketplace
- [ ] Social sharing (invite links)
- [ ] Referral bonuses
- [ ] Anonymous wallet NFTs

---

**Pro Tip**: The anonymous wallet system is designed to maximize user engagement while maintaining a clear path to wallet connection. Users earn first, commit later! 🚀
