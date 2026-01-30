---
layout: "../../layouts/DocLayout.astro"
title: "MOBILE_MONEY_INTEGRATION_PLAN"
---
<div data-pagefind-filter="type:docs"></div>

# Mobile Money Integration Plan - M-Pesa & Airtel Money

**Date:** 2026-01-04
**Priority:** 🔥 CRITICAL for African User Adoption
**Status:** 🚀 Ready to Implement

---

## Vision

Enable **instant crypto-to-mobile-money payouts** so African users (especially Nairobi/Lamu refugees) can convert NFT sales, music royalties, and learning rewards directly to **M-Pesa** or **Airtel Money** - money they can actually use.

---

## Why This Matters

### Current Reality in Nairobi/Lamu & East Africa

**📱 Mobile Money Penetration:**
- **Kenya:** 96% adults use M-Pesa (33M+ users)
- **Uganda:** 70% use Mobile Money (Airtel, MTN)
- **Tanzania:** 65% use mobile money
- **Rwanda:** 60% use mobile money

**🏦 Traditional Banking:**
- Refugee camps: <5% have bank accounts
- Rural Kenya: ~30% banked vs. 96% mobile money

**💡 Reality Check:**
```
NFT sold for $50 USD worth of crypto = Useless
NFT sold for 5,000 KES in M-Pesa = Can buy food TODAY
```

### User Needs

1. **Instant Access** - Payout within minutes, not days
2. **No Bank Account** - Mobile phone number is the "wallet"
3. **Local Currency** - KES, UGX, TZS (not USD or crypto)
4. **Low Fees** - <5% transaction costs
5. **Cash Out Nearby** - M-Pesa agents in every village

---

## Mobile Money Landscape

### M-Pesa (Safaricom - Kenya Leader)

**Coverage:**
- 🇰🇪 Kenya: 33M users (96% penetration)
- 🇹🇿 Tanzania: 14M users (Vodacom M-Pesa)
- 🇱🇸 Lesotho: 1.5M users
- 🇲🇿 Mozambique: 6M users (Vodacom)
- 🇬🇭 Ghana: 5M users (Vodafone)
- 🇪🇬 Egypt: 1M users

**Transaction Volume:** $314 BILLION USD annually (Kenya alone)

**Use Cases:**
- P2P transfers
- Bill payments
- Merchant payments
- Savings (M-Shwari)
- Loans (Fuliza)
- International remittance (M-Pesa Global)

**API Access:**
- **Daraja API** (Safaricom Kenya) - Production ready
- **Vodacom API** (Tanzania, Mozambique)
- **Vodafone API** (Ghana, Egypt)

### Airtel Money (Pan-African)

**Coverage:**
- 14 African countries (vs M-Pesa's 7)
- 30M+ active users
- Strong in: Uganda, Tanzania, Rwanda, Malawi, Zambia

**Countries:**
🇺🇬 Uganda, 🇹🇿 Tanzania, 🇷🇼 Rwanda, 🇿🇲 Zambia, 🇲🇼 Malawi, 🇳🇬 Nigeria, 🇰🇪 Kenya, 🇨🇬 DRC, 🇳🇪 Niger, 🇹🇩 Chad, 🇲🇬 Madagascar, 🇬🇦 Gabon, 🇨🇲 Cameroon, 🇸🇨 Seychelles

**API Access:**
- **Airtel Money API** - Available for registered businesses
- Sandbox for testing

### MTN Mobile Money (Also Major)

**Coverage:**
- 21 African countries
- 60M+ users
- Strong in: Ghana, Uganda, Rwanda, Cameroon

### Comparison Table

| Provider | Countries | Users | Kenya Presence | Nairobi/Lamu Access | API Difficulty |
|----------|-----------|-------|----------------|---------------|----------------|
| **M-Pesa** | 7 | 50M+ | ⭐⭐⭐ Dominant | ✅ Excellent | Easy |
| **Airtel Money** | 14 | 30M+ | ⭐ Secondary | ✅ Good | Medium |
| MTN MoMo | 21 | 60M+ | ❌ None | ❌ No | Medium |

**Recommendation for Nairobi/Lamu:** Focus on **M-Pesa** (primary) + **Airtel Money** (secondary)

---

## Integration Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────┐
│          User Earns Crypto/NFT Sale             │
│   (Polygon, Near, Solana, etc.)                 │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│       Exotopia Backend (Payout Service)         │
│  • Detects earned balance                       │
│  • Checks user payout preferences               │
│  • Initiates conversion                          │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│         Crypto Exchange/Aggregator              │
│  • Binance, Coinbase, Local Bitcoin            │
│  • Converts USDC/SOL/MATIC → USD               │
│  • Settles to exchange account                  │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│        Crypto-to-Fiat Bridge (Kenya)            │
│  • Chipper Cash, BitPesa, Flutterwave          │
│  • Converts USD → KES                           │
│  • Holds KES in local account                   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│       M-Pesa/Airtel API Integration             │
│  • Daraja API (M-Pesa)                          │
│  • Airtel Money API                              │
│  • Sends KES to user's phone number             │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│          User Receives Mobile Money             │
│  • SMS notification                              │
│  • Check balance: *234# (M-Pesa)                │
│  • Withdraw at agent or use for payments        │
└─────────────────────────────────────────────────┘
```

---

## Crypto-to-Mobile Money Bridges

### Option 1: Chipper Cash (RECOMMENDED)

**Why:**
- ✅ Already crypto-native (supports BTC, ETH, USDC)
- ✅ Direct M-Pesa/Airtel integration
- ✅ Operates in Kenya, Uganda, Tanzania, Rwanda
- ✅ API for business integration
- ✅ No minimum payout
- ✅ Fast (< 5 minutes)

**How It Works:**
1. User has crypto in Chipper Cash account
2. User converts crypto → USD in-app
3. User sends USD → M-Pesa (instant)
4. **Fee:** ~1.5% crypto conversion + M-Pesa transfer fee (free for small amounts)

**API Integration:**
```javascript
// Chipper Cash API (Hypothetical - check docs)
POST /api/v1/payouts/mobile-money
{
  "amount": 5000,           // KES
  "currency": "KES",
  "recipient_phone": "+254712345678",
  "provider": "mpesa",      // or "airtel"
  "source_wallet": "USD",   // Convert from USD balance
  "metadata": {
    "nft_sale_id": "12345",
    "reason": "NFT_SALE_PAYOUT"
  }
}
```

**Fees:**
- Crypto → USD: ~1.5%
- USD → KES: ~2%
- KES → M-Pesa: Free (under 500 KES), 1% above
- **Total:** ~3.5-4.5%

### Option 2: BitPesa (now AZA Finance)

**Why:**
- ✅ Specifically built for crypto → African fiat
- ✅ Direct M-Pesa integration
- ✅ Business API available
- ✅ Licensed in Kenya, Uganda, Tanzania

**Currencies Supported:**
- KES (Kenya Shilling)
- UGX (Uganda Shilling)
- TZS (Tanzania Shilling)
- RWF (Rwanda Franc)
- NGN (Nigeria Naira)

**Fees:** ~2-4% all-in

### Option 3: Flutterwave

**Why:**
- ✅ Pan-African (34 countries)
- ✅ Strong M-Pesa/Airtel integration
- ✅ API-first design
- ✅ Already integrated with major African fintechs

**Supported:**
- Mobile money payouts
- Bank transfers
- Cryptocurrency settlement (via partnerships)

**API Example:**
```javascript
POST /v3/payouts
{
  "account_bank": "MPESA",
  "account_number": "254712345678",  // Phone number
  "amount": 5000,
  "currency": "KES",
  "narration": "Exotopia NFT Sale Payout",
  "reference": "nft_sale_12345",
  "callback_url": "https://exotopia.world/api/payout-callback"
}
```

**Fees:** ~3% + KES 50

### Option 4: Coinbase Commerce → Local Exchange

**Flow:**
1. Accept crypto payments via Coinbase Commerce
2. Auto-sell to USD
3. Withdraw USD to Kenyan exchange (e.g., Binance Kenya)
4. Convert USD → KES
5. Send KES to M-Pesa via Daraja API

**Pros:** More control, potentially lower fees
**Cons:** More steps, slower, requires exchange account management

---

## Direct M-Pesa Integration (Daraja API)

### Prerequisites

1. **Business Registration:**
   - Register business in Kenya
   - Get Safaricom Paybill or Till Number
   - Apply for Daraja API access

2. **API Credentials:**
   - Consumer Key
   - Consumer Secret
   - Shortcode (Paybill/Till)
   - Passkey (for STK Push)

3. **Compliance:**
   - KYC for business
   - Tax registration (PIN)
   - Mobile money agent license (for high volume)

### Key Daraja API Endpoints

#### 1. B2C (Business to Customer) - PAYOUT

**Use Case:** Send money from platform to user's M-Pesa

```javascript
// Step 1: Get Access Token
POST https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials
Authorization: Basic <base64(consumer_key:consumer_secret)>

Response: { "access_token": "...", "expires_in": 3600 }

// Step 2: Send Money to User
POST https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest
Authorization: Bearer <access_token>
{
  "InitiatorName": "exotopia_api",
  "SecurityCredential": "<encrypted_password>",
  "CommandID": "BusinessPayment",
  "Amount": 5000,
  "PartyA": 600123,              // Your Paybill/Till
  "PartyB": 254712345678,        // User's phone number
  "Remarks": "Exotopia NFT Payout",
  "QueueTimeOutURL": "https://exotopia.world/api/mpesa/timeout",
  "ResultURL": "https://exotopia.world/api/mpesa/result",
  "Occasion": "NFT_SALE_12345"
}

Response (Immediate):
{
  "ConversationID": "AG_20240104_...",
  "OriginatorConversationID": "12345-...",
  "ResponseCode": "0",
  "ResponseDescription": "Accept the service request successfully."
}

// Step 3: Receive Callback (ResultURL)
POST /api/mpesa/result (from Safaricom)
{
  "Result": {
    "ResultType": 0,
    "ResultCode": 0,
    "ResultDesc": "The service request is processed successfully.",
    "OriginatorConversationID": "12345-...",
    "ConversationID": "AG_20240104_...",
    "TransactionID": "OGH12AB3CD",
    "ResultParameters": {
      "ResultParameter": [
        { "Key": "TransactionAmount", "Value": 5000 },
        { "Key": "TransactionReceipt", "Value": "OGH12AB3CD" },
        { "Key": "ReceiverPartyPublicName", "Value": "254712345678 - John Doe" },
        { "Key": "B2CWorkingAccountAvailableFunds", "Value": 150000 },
        { "Key": "B2CUtilityAccountAvailableFunds", "Value": 50000 },
        { "Key": "TransactionCompletedDateTime", "Value": "04.01.2026 15:30:45" }
      ]
    }
  }
}
```

**Fees (Kenya M-Pesa B2C):**
- 1-100 KES: Free
- 101-500 KES: 11 KES
- 501-1,000 KES: 25 KES
- 1,001-2,500 KES: 50 KES
- 2,501-5,000 KES: 75 KES
- 5,001-70,000 KES: 105 KES

#### 2. C2B (Customer to Business) - RECEIVING PAYMENTS

**Use Case:** User pays for premium features via M-Pesa

```javascript
// STK Push (Lipa Na M-Pesa Online)
POST https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest
Authorization: Bearer <access_token>
{
  "BusinessShortCode": 174379,
  "Password": "<base64(Shortcode+Passkey+Timestamp)>",
  "Timestamp": "20260104153045",
  "TransactionType": "CustomerPayBillOnline",
  "Amount": 100,
  "PartyA": 254712345678,        // User's phone
  "PartyB": 174379,              // Your shortcode
  "PhoneNumber": 254712345678,
  "CallBackURL": "https://exotopia.world/api/mpesa/stkpush-callback",
  "AccountReference": "Premium_Sub_12345",
  "TransactionDesc": "Exotopia Premium Subscription"
}

// User receives STK Push prompt on phone
// Enters M-Pesa PIN
// Callback received with payment confirmation
```

---

## Airtel Money Integration

### API Access

**Requirements:**
1. Register as Airtel Money merchant
2. Get API credentials (Client ID, Secret)
3. Sandbox testing available

### Payout API

```javascript
// Step 1: Get Access Token
POST https://openapiuat.airtel.africa/auth/oauth2/token
Content-Type: application/json
{
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "grant_type": "client_credentials"
}

Response: { "access_token": "...", "expires_in": 3600 }

// Step 2: Disburse to User
POST https://openapiuat.airtel.africa/standard/v1/disbursements/
Authorization: Bearer <access_token>
X-Country: KE
X-Currency: KES
{
  "payee": {
    "msisdn": "254712345678"
  },
  "reference": "nft_sale_12345",
  "pin": "<encrypted_pin>",
  "transaction": {
    "amount": 5000,
    "id": "unique_txn_id_12345"
  }
}

Response:
{
  "status": {
    "code": "200",
    "message": "SUCCESS",
    "result_code": "ESB000010",
    "success": true
  },
  "data": {
    "transaction": {
      "id": "unique_txn_id_12345",
      "airtel_money_id": "AM_TXN_67890"
    }
  }
}
```

**Fees (Airtel Money):**
- Similar to M-Pesa: ~1-3% depending on amount
- Slightly lower for smaller transactions

---

## Implementation Plan

### Phase 1: Foundation (Week 1-2)

#### Backend Setup

```typescript
// /api/payouts/mobile-money.ts
import { ChipperCash } from '@chipper/sdk';
import { Daraja } from '@safaricom/daraja-api';

interface MobileMoneyPayout {
  userId: string;
  amount: number;          // In crypto
  currency: string;        // 'USDC', 'SOL', 'MATIC'
  phoneNumber: string;     // +254712345678
  provider: 'mpesa' | 'airtel';
  localCurrency: 'KES' | 'UGX' | 'TZS';
}

export async function POST({ request }) {
  const { userId, amount, currency, phoneNumber, provider, localCurrency } = await request.json();

  // 1. Validate user balance
  const balance = await getUserCryptoBalance(userId, currency);
  if (balance < amount) {
    return error('Insufficient balance');
  }

  // 2. Get current exchange rate
  const exchangeRate = await getExchangeRate(currency, localCurrency);
  const localAmount = amount * exchangeRate;

  // 3. Initiate payout via Chipper Cash or direct API
  let result;
  if (process.env.USE_CHIPPER === 'true') {
    result = await chipperCashPayout(phoneNumber, localAmount, provider);
  } else {
    result = await directMobileMoneyPayout(phoneNumber, localAmount, provider);
  }

  // 4. Record transaction
  await recordPayout({
    userId,
    cryptoAmount: amount,
    cryptoCurrency: currency,
    localAmount,
    localCurrency,
    phoneNumber,
    provider,
    transactionId: result.transactionId,
    status: 'completed'
  });

  return {
    success: true,
    transactionId: result.transactionId,
    amount: localAmount,
    currency: localCurrency,
    estimatedArrival: '5 minutes'
  };
}

async function chipperCashPayout(phone: string, amount: number, provider: string) {
  const chipper = new ChipperCash(process.env.CHIPPER_API_KEY);
  return await chipper.payouts.mobileMoney({
    recipient: phone,
    amount,
    currency: 'KES',
    provider,
    memo: 'Exotopia NFT Sale Payout'
  });
}

async function directMobileMoneyPayout(phone: string, amount: number, provider: string) {
  if (provider === 'mpesa') {
    const daraja = new Daraja({
      consumerKey: process.env.MPESA_CONSUMER_KEY,
      consumerSecret: process.env.MPESA_CONSUMER_SECRET,
      environment: 'production'
    });

    const token = await daraja.getOAuthToken();
    return await daraja.b2c({
      InitiatorName: process.env.MPESA_INITIATOR,
      Amount: amount,
      PartyB: phone,
      Remarks: 'Exotopia Payout',
      CommandID: 'BusinessPayment',
      ResultURL: 'https://exotopia.world/api/mpesa/callback',
      QueueTimeOutURL: 'https://exotopia.world/api/mpesa/timeout'
    });
  } else {
    // Airtel Money logic
    return await airtelMoneyPayout(phone, amount);
  }
}
```

#### Database Schema

```sql
-- Payout Transactions
CREATE TABLE mobile_money_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  wallet_address TEXT NOT NULL,

  -- Crypto side
  crypto_amount DECIMAL(18, 8) NOT NULL,
  crypto_currency VARCHAR(10) NOT NULL,  -- 'USDC', 'SOL', 'MATIC'
  crypto_tx_hash TEXT,

  -- Fiat side
  local_amount DECIMAL(10, 2) NOT NULL,
  local_currency VARCHAR(3) NOT NULL,    -- 'KES', 'UGX', 'TZS'
  exchange_rate DECIMAL(10, 4) NOT NULL,

  -- Mobile money details
  phone_number VARCHAR(20) NOT NULL,
  provider VARCHAR(20) NOT NULL,         -- 'mpesa', 'airtel'
  provider_tx_id TEXT,
  provider_receipt TEXT,

  -- Status tracking
  status VARCHAR(20) NOT NULL,           -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,

  -- Fees
  platform_fee DECIMAL(10, 2) DEFAULT 0,
  provider_fee DECIMAL(10, 2) DEFAULT 0,
  total_fees DECIMAL(10, 2) DEFAULT 0,

  -- Metadata
  payout_reason TEXT,                    -- 'nft_sale', 'music_royalty', 'reward_claim'
  reference_id TEXT,                     -- NFT sale ID, track ID, etc.

  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  INDEX idx_user_payouts (user_id),
  INDEX idx_phone_payouts (phone_number),
  INDEX idx_status (status)
);

-- User Mobile Money Preferences
CREATE TABLE user_mobile_money_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  phone_number VARCHAR(20) NOT NULL,
  default_provider VARCHAR(20) NOT NULL, -- 'mpesa', 'airtel'
  country_code VARCHAR(2) NOT NULL,      -- 'KE', 'UG', 'TZ'
  auto_payout_enabled BOOLEAN DEFAULT false,
  auto_payout_threshold DECIMAL(10, 2) DEFAULT 100.00,  -- Auto payout when balance > 100 KES
  verified BOOLEAN DEFAULT false,
  verification_code TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Phase 2: Frontend Integration (Week 2-3)

#### Profile Page - Payout Settings

```astro
<!-- Add to profile.astro -->
<section class="payout-settings card-retro-neon">
  <h2>💰 PAYOUT SETTINGS</h2>

  <div class="mobile-money-setup">
    <h3>Mobile Money Account</h3>

    <div class="form-group">
      <label>Phone Number</label>
      <input
        type="tel"
        id="mobile-money-phone"
        placeholder="+254712345678"
        pattern="^\+[1-9]\d{1,14}$"
      />
      <small>Format: +254712345678 (include country code)</small>
    </div>

    <div class="form-group">
      <label>Provider</label>
      <select id="mobile-money-provider">
        <option value="mpesa">M-Pesa (Kenya, Tanzania, etc.)</option>
        <option value="airtel">Airtel Money (14 countries)</option>
        <option value="mtn">MTN Mobile Money (21 countries)</option>
      </select>
    </div>

    <div class="form-group">
      <label>Country</label>
      <select id="mobile-money-country">
        <option value="KE">🇰🇪 Kenya (KES)</option>
        <option value="UG">🇺🇬 Uganda (UGX)</option>
        <option value="TZ">🇹🇿 Tanzania (TZS)</option>
        <option value="RW">🇷🇼 Rwanda (RWF)</option>
      </select>
    </div>

    <div class="form-group">
      <label>
        <input type="checkbox" id="auto-payout">
        Auto-payout when balance exceeds <input type="number" id="auto-payout-threshold" value="100" min="10" step="10"> KES
      </label>
    </div>

    <button class="btn-retro-neon" onclick="saveMobileMoneySettings()">
      SAVE SETTINGS
    </button>
  </div>

  <div class="current-balance">
    <h3>Available Balance</h3>
    <div class="balance-display">
      <div class="crypto-balance">
        <span class="amount" id="crypto-balance">0.00</span>
        <span class="currency">USDC</span>
      </div>
      <div class="arrow">→</div>
      <div class="fiat-balance">
        <span class="amount" id="fiat-balance">0.00</span>
        <span class="currency" id="fiat-currency">KES</span>
      </div>
    </div>

    <button class="btn-action btn-retro-neon" onclick="initiateInstantPayout()">
      <span class="btn-icon">💸</span>
      <span>INSTANT PAYOUT TO M-PESA</span>
    </button>
    <small>Arrives in 2-5 minutes • Fee: ~3.5%</small>
  </div>

  <div class="payout-history">
    <h3>Payout History</h3>
    <div id="payout-history-list">
      <!-- Populated via JS -->
    </div>
  </div>
</section>

<script>
async function saveMobileMoneySettings() {
  const phone = document.getElementById('mobile-money-phone').value;
  const provider = document.getElementById('mobile-money-provider').value;
  const country = document.getElementById('mobile-money-country').value;
  const autoPayout = document.getElementById('auto-payout').checked;
  const threshold = document.getElementById('auto-payout-threshold').value;

  try {
    const response = await fetch('/api/user/mobile-money-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: window.walletManager.connectedWallet,
        phoneNumber: phone,
        provider,
        countryCode: country,
        autoPayoutEnabled: autoPayout,
        autoPayoutThreshold: parseFloat(threshold)
      })
    });

    if (response.ok) {
      alert('✅ Mobile money settings saved!');
      // Send verification SMS
      await sendVerificationSMS(phone);
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
    alert('❌ Failed to save settings. Please try again.');
  }
}

async function initiateInstantPayout() {
  if (!confirm('Payout entire balance to mobile money?')) return;

  const balance = parseFloat(document.getElementById('crypto-balance').textContent);
  if (balance === 0) {
    alert('No balance to payout');
    return;
  }

  try {
    const response = await fetch('/api/payouts/mobile-money', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: window.walletManager.connectedWallet,
        amount: balance,
        currency: 'USDC',
        payoutAll: true
      })
    });

    const data = await response.json();

    if (data.success) {
      alert(`✅ Payout initiated!\n\n${data.amount} ${data.currency} will arrive in ~5 minutes.\n\nTransaction ID: ${data.transactionId}`);

      // Reload balance
      loadUserBalance();
    }
  } catch (error) {
    console.error('Payout failed:', error);
    alert('❌ Payout failed. Please contact support.');
  }
}

// Load user balance on page load
async function loadUserBalance() {
  const response = await fetch(`/api/user/balance?wallet=${window.walletManager.connectedWallet}`);
  const data = await response.json();

  document.getElementById('crypto-balance').textContent = data.cryptoBalance.toFixed(2);
  document.getElementById('fiat-balance').textContent = data.fiatEquivalent.toFixed(2);
  document.getElementById('fiat-currency').textContent = data.localCurrency;
}
</script>
```

### Phase 3: Automated Payouts (Week 3-4)

#### NFT Sale Auto-Payout

```typescript
// When NFT is sold, auto-trigger payout
async function handleNFTSale(saleEvent) {
  const { sellerId, amount, currency } = saleEvent;

  // Get user's mobile money settings
  const settings = await getUserMobileMoneySettings(sellerId);

  if (settings.autoPayoutEnabled) {
    // Convert and payout immediately
    await initiateAutoPayout({
      userId: sellerId,
      amount,
      currency,
      reason: 'nft_sale',
      referenceId: saleEvent.saleId
    });
  } else {
    // Add to pending balance
    await addToPendingBalance(sellerId, amount, currency);
  }
}
```

---

## Compliance & Legal

### KYC Requirements

**For Small Payouts (< $100/day):**
- ✅ Phone number verification only
- ✅ SMS OTP

**For Medium Payouts ($100-$1000/day):**
- ✅ National ID verification
- ✅ Selfie + ID photo
- ✅ Address confirmation

**For Large Payouts (> $1000/day):**
- ✅ Full KYC (passport/ID, proof of address)
- ✅ Source of funds declaration
- ✅ Tax compliance

### Anti-Money Laundering (AML)

**Transaction Monitoring:**
- Flag transactions > $500 USD equivalent
- Daily/weekly limits per user
- Velocity checks (too many transactions too fast)

**Blocked Countries:**
- OFAC sanctioned countries
- Regions with crypto bans

### Tax Reporting

**Kenya:**
- Report monthly M-Pesa payouts > KES 100,000 to KRA
- Withhold tax if required by law

---

## Cost Structure

### Example: $50 NFT Sale Payout

```
NFT Sold: $50 USD (USDC)
  ↓
Platform Fee: -$1.25 (2.5%)
  ↓
Remaining: $48.75
  ↓
Crypto → USD Conversion: -$0.73 (1.5%)
  ↓
USD → KES Conversion: -$0.98 (2%)
Exchange Rate: 1 USD = 130 KES
  ↓
KES Amount: 6,110 KES
  ↓
M-Pesa B2C Fee: -75 KES (~$0.58)
  ↓
User Receives: 6,035 KES (~$46.42)

Total Fees: $3.58 (7.16%)
User Gets: $46.42 (92.84%)
```

**Fee Breakdown:**
- Platform: 2.5%
- Conversion: 3.5%
- Mobile money: 1.16%
- **Total: 7.16%**

**Optimization:**
- Batch payouts: Reduce to ~5%
- Higher volumes: Negotiate better rates
- Direct integration: Skip intermediaries

---

## Testing Plan

### Week 1: Sandbox Testing

**M-Pesa Sandbox:**
```
Test Shortcode: 600979
Test Phone: 254708374149 (sandbox test number)
Test Amount: 10 KES
```

**Airtel Sandbox:**
```
Test API: https://openapiuat.airtel.africa
Test Phone: 254700000000 (sandbox)
```

### Week 2: Pilot (10 Users)

- Select 10 Nairobi/Lamu users
- Give $5 worth of crypto each
- Test full payout flow
- Collect feedback

### Week 3: Beta (100 Users)

- Expand to 100 users
- Monitor transaction success rates
- Optimize fee structure
- Fix edge cases

### Week 4: Production Launch

- Public announcement
- Documentation
- Support team training
- Monitoring dashboard

---

## Success Metrics

**Phase 1 (Month 1):**
- [ ] 50+ successful payouts
- [ ] <2% failure rate
- [ ] <10 min average payout time
- [ ] 90%+ user satisfaction

**Phase 2 (Month 2-3):**
- [ ] 500+ successful payouts
- [ ] $10,000+ total payout volume
- [ ] 5+ supported countries
- [ ] Integration with 3+ crypto bridges

**Phase 3 (Month 4-6):**
- [ ] 5,000+ payouts
- [ ] $100,000+ volume
- [ ] <5% total fees
- [ ] Bank account integration

---

## Next Steps

### This Week (Immediate)

1. **Choose Bridge Partner:**
   - ✅ Chipper Cash (easiest, crypto-native)
   - ✅ Flutterwave (pan-African, proven)
   - ⚠️ Direct Daraja (requires business setup)

2. **Set Up Sandbox:**
   - M-Pesa Daraja sandbox
   - Airtel Money UAT environment

3. **Create Test Account:**
   - Register on Chipper Cash/Flutterwave
   - Get API keys

### Next Week

1. Build API endpoints
2. Add database schema
3. Create frontend UI
4. Test first payout

---

**Status:** Ready to implement
**Blocker:** Need to choose primary bridge partner
**Recommendation:** Start with **Chipper Cash** (fastest path to market)

