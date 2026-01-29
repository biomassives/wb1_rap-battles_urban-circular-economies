---
layout: "../../layouts/DocLayout.astro"
title: "WALLET_SECURITY_TEST_GUIDE"
---
<div data-pagefind-filter="type:docs"></div>

# Wallet Security Test Page Guide

## 🧪 Access the Test Suite

**URL:** `http://localhost:4321/wallet-security-test`

This comprehensive test page lets you preview and validate all wallet security components before integrating them into production.

---

## 📋 What You Can Test

### 1. **Component Status Panel** (Top Section)
**Green text = Loaded ✅ | Red text = Missing ❌**

Checks:
- SecurityEducationModal component
- RecoveryPhraseModal component
- RecoveryPhraseVerification component
- WalletPINSetup component
- wallet-crypto.js utilities
- wallet-generator.js utilities
- bip39 library (BIP39 mnemonic generation)
- solana web3 library

**What to look for:** All should be green ✅

---

### 2. **LocalStorage State Panel**
Shows current browser storage:
- 📦 = Data exists
- ⬜ = No data

Keys monitored:
- `wallet_encrypted` - Encrypted wallet data
- `wallet_publicKey` - Wallet address
- `wallet_locked` - Lock status
- `anonymousWallet` - Demo wallet
- `securityEducationCompleted` - Tutorial completion
- `walletCreated` - Wallet creation flag

**What to look for:** Should be empty on first load

---

### 3. **Diagnostics Panel**
System information:
- Browser version
- Web Crypto API support (must be ✅)
- LocalStorage available (must be ✅)
- Screen width
- Current timestamp

**What to look for:** Web Crypto and LocalStorage both ✅

---

## 🎭 Component Preview Tests

### Test 1: Security Education Modal
**What it does:** Opens the 5-lesson interactive tutorial

**Click:** "LAUNCH EDUCATION"
- ✅ Modal should appear full-screen
- ✅ Progress bar shows Lesson 1 of 5
- ✅ Can navigate through all 5 lessons
- ✅ Quiz on lesson 4 (must answer all 3 correctly)
- ✅ Final summary on lesson 5

**Click:** "VIEW REPORT" to see component details

**Close modal:** Click X or use browser back button

---

### Test 2: Recovery Phrase Modal
**What it does:** Displays 12-word recovery phrase with security warnings

**Click:** "SHOW PHRASE"
- ✅ Modal shows test words (apple, forest, guitar...)
- ✅ Words are blurred (hover to reveal)
- ✅ 3 colored warning boxes visible
- ✅ 5-point checklist present
- ✅ Cannot proceed until all checked
- ✅ Download backup button available

**Click:** "VIEW REPORT" to see features list

**Test:** Try clicking "CONTINUE" before checking all boxes (should be disabled)

---

### Test 3: Phrase Verification
**What it does:** Tests user wrote down recovery phrase correctly

**Click:** "TEST VERIFICATION"
- ✅ Shows 3 random word positions to enter
- ✅ Real-time validation (green = correct, red = wrong)
- ✅ Progress bar (0/3 → 3/3)
- ✅ Attempt counter increments on wrong answers
- ✅ Help accordion available

**Click:** "VIEW REPORT" to see mechanics

**Test:**
- Enter correct words → see green checkmark
- Enter wrong word → see red X and shake animation

**Test words:** apple, forest, guitar, laptop, ocean, sunset, piano, mountain, dragon, crystal, thunder, galaxy

---

### Test 4: PIN Setup Modal
**What it does:** Creates 6-digit PIN with strength indicator

**Click:** "LAUNCH PIN SETUP"
- ✅ 3-step progress indicator (Create → Confirm → Done)
- ✅ 6 PIN input boxes visible
- ✅ Auto-focus to next box when typing
- ✅ Visual dots (●) appear as you type
- ✅ Strength meter updates (Weak/Medium/Strong)
- ✅ Tips shown below

**Click:** "VIEW REPORT" to see features

**Test:**
- Enter "123456" → should show "Weak" (red)
- Enter "246802" → should show "Medium" (yellow)
- Enter "491856" → should show "Strong" (green)
- Try paste: Copy "123456" and paste into first box
- Try backspace: Delete and retype

---

### Test 5: Encryption Utilities
**What it does:** Tests AES-GCM encryption/decryption

**Click:** "RUN ENCRYPTION TEST"
- ✅ Encrypts test mnemonic with PIN "123456"
- ✅ Shows encrypted data (salt, IV, ciphertext)
- ✅ Decrypts and verifies match
- ✅ Shows performance metrics

**Click:** "VIEW REPORT" to see available functions

**Expected result:**
```
✅ ENCRYPTION TEST PASSED
Matches original: true
Encryption: ~50-100ms
```

---

### Test 6: Wallet Generator
**What it does:** Generates real BIP39 mnemonic and Solana keypair

**Click:** "GENERATE TEST WALLET"
- ✅ Creates 12-word BIP39 mnemonic
- ✅ Derives Solana public key (44 chars)
- ✅ Creates keypair with secret key
- ✅ Shows all 12 words in report

**Click:** "VIEW REPORT" to see available functions

**Expected result:**
```
✅ WALLET GENERATION TEST PASSED
✅ Has 12 words
✅ Valid Solana address
✅ Keypair created
```

**⚠️ IMPORTANT:** These are TEST wallets only! Do NOT send real funds.

---

## 🔄 Complete Flow Test

**What it does:** Runs all 6 steps in sequence to validate the full user journey

**Click:** "🚀 START FULL FLOW TEST"

Watch the progress:
1. ⏳ → ✅ Security Education Modal check
2. ⏳ → ✅ Generate test wallet
3. ⏳ → ✅ Recovery Phrase Modal check
4. ⏳ → ✅ Phrase Verification check
5. ⏳ → ✅ PIN Setup check
6. ⏳ → ✅ Encryption test

**Expected result:**
```
🎉 ALL TESTS PASSED! 🎉
The wallet security system is fully functional.
Ready for production integration! ✅
```

**If any step fails:** Red ❌ will appear with error message

**Click:** "🔄 RESET" to clear and run again

---

## 🛠️ Debug Tools

### Clear All Data
**What it does:** Wipes all localStorage (useful for fresh start)

**Click:** "🗑️ CLEAR LOCALSTORAGE"
- Removes all wallet data
- Resets test state
- Refreshes status panels

**Use when:** Starting over or testing fresh install flow

---

### View Console Logs
**What it does:** Shows captured console.log messages

**Click:** "📋 VIEW LOGS"
- Opens alert with timestamped logs
- Shows last 50 log entries

**Use when:** Debugging issues or verifying function calls

---

### Download Test Report
**What it does:** Exports comprehensive JSON report

**Click:** "💾 DOWNLOAD REPORT"
- Downloads `wallet-security-test-report-[timestamp].json`
- Includes: component status, localStorage state, test results, console logs

**Use when:** Documenting test results or sharing with team

---

### Simulate Errors
**What it does:** Throws test error to verify error handling

**Click:** "⚠️ TEST ERROR HANDLING"
- Throws simulated error
- Checks if caught correctly
- Updates console output

**Use when:** Testing error recovery mechanisms

---

## 📟 Console Output Panel

**What it shows:** Live feed of all console.log messages

**Updates:** Real-time as tests run

**Features:**
- Timestamped entries
- Auto-scrolls to latest
- Last 50 messages shown

**Look for:**
- 🔐 Wallet generation messages
- ✅ Success indicators
- ❌ Error messages
- 💾 Storage operations

---

## ✅ Pre-Integration Checklist

Run through these tests before integrating into production:

### Component Loading
- [ ] All components show ✅ in status panel
- [ ] Both libraries (bip39, solana web3) loaded
- [ ] All utility functions available

### Security Education
- [ ] Modal opens full-screen
- [ ] All 5 lessons display correctly
- [ ] Quiz requires all 3 correct answers
- [ ] Cannot skip without completing

### Recovery Phrase
- [ ] 12 words display with blur effect
- [ ] Hover reveals individual words
- [ ] Copy/paste disabled
- [ ] All 5 checklist items required
- [ ] Backup download works

### Verification
- [ ] Tests 3 random words
- [ ] Real-time validation works
- [ ] Progress bar updates correctly
- [ ] Cannot proceed until 3/3 correct

### PIN Setup
- [ ] 6 digits required
- [ ] Strength meter works (test weak/strong)
- [ ] Auto-focus between inputs
- [ ] Confirmation step matches
- [ ] Success animation displays

### Encryption
- [ ] Encryption test passes
- [ ] Decryption matches original
- [ ] Performance < 200ms
- [ ] No errors in console

### Wallet Generation
- [ ] Generates 12 valid BIP39 words
- [ ] Creates 44-char Solana address
- [ ] Keypair includes secret key
- [ ] Same phrase = same address (deterministic)

### Complete Flow
- [ ] All 6 steps complete successfully
- [ ] "ALL TESTS PASSED" message appears
- [ ] No errors in any step
- [ ] Console shows success logs

### Mobile Testing
- [ ] Open on phone/tablet
- [ ] All modals fit on screen
- [ ] Touch inputs work (PIN especially)
- [ ] Scroll works in modals

---

## 🐛 Common Issues & Solutions

### "❌ Component not loaded"
**Problem:** Script tags missing or not loaded yet
**Solution:**
1. Check BaseLayout has CDN scripts in `<head>`
2. Verify `is:inline` directive on local scripts
3. Refresh page
4. Check browser console for 404 errors

### "Web Crypto ❌"
**Problem:** Browser doesn't support Web Crypto API
**Solution:**
1. Must use HTTPS in production (not localhost)
2. Update browser to latest version
3. Don't use incognito/private mode

### "All modals at once appearing"
**Problem:** Multiple test buttons clicked rapidly
**Solution:**
1. Close all modals (click X or refresh page)
2. Test one component at a time
3. Use "Clear All Data" to reset

### "Encryption test fails"
**Problem:** Web Crypto not available or data corrupted
**Solution:**
1. Check "Web Crypto ✅" in diagnostics
2. Clear localStorage and retry
3. Check browser console for specific error

### "Flow test stops mid-way"
**Problem:** Missing component or function
**Solution:**
1. Check which step failed (red ❌)
2. Verify that component loaded in status panel
3. Check console for error message
4. Refresh page and retry

---

## 📊 Understanding Test Results

### ✅ Success Indicators
- Green text/checkmarks
- "PASSED" in reports
- Progress bars at 100%
- No red text in console

### ❌ Failure Indicators
- Red text/X marks
- "FAILED" in reports
- Stopped progress bars
- Error messages in console

### ⚠️ Warning Indicators
- Yellow text
- "Missing" or "Not loaded"
- Empty status panels
- No response when clicking buttons

---

## 🚀 Next Steps After Testing

Once all tests pass:

1. **Document results:**
   - Click "Download Test Report"
   - Save screenshots of passing tests
   - Note any browser-specific issues

2. **Review integration guide:**
   - Read `WALLET_SECURITY_INTEGRATION_GUIDE.md`
   - Follow step-by-step instructions
   - Add components to BaseLayout

3. **Test in production mode:**
   - Run `npm run build`
   - Test in preview mode
   - Verify all components work after build

4. **Mobile device testing:**
   - Test on actual phone/tablet
   - Check touch interactions
   - Verify PIN keyboard appears

5. **Security audit:**
   - Review encryption implementation
   - Test with security tools
   - Consider third-party audit

---

## 💡 Pro Tips

### Efficient Testing
- Use "Complete Flow Test" first for quick validation
- Then test individual components for details
- Download report for documentation

### Debugging
- Keep Console Output visible while testing
- Check status panels between tests
- Use "Clear All Data" for fresh starts

### Mobile Testing
- Use Chrome DevTools mobile emulator first
- Then test on real devices
- Pay attention to keyboard behavior

---

## 📞 Support

### Issues Found?
1. Check console output for errors
2. Download and review test report
3. Verify all dependencies loaded
4. Check integration guide for missing steps

### Everything Passes?
🎉 **You're ready to integrate!**
- Follow `WALLET_SECURITY_INTEGRATION_GUIDE.md`
- Estimated integration time: 2-3 hours
- Full production-ready system

---

*Test Page Version: 1.0*
*Last Updated: 2026-01-04*
*Status: Ready for Testing*
