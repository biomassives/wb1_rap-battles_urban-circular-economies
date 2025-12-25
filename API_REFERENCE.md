# API & Features Reference

## 📡 API Endpoints

### Profile Management

#### GET `/api/profile/get`
**Description**: Retrieve user profile by wallet address

**Query Parameters**:
- `walletAddress` (string, required): Solana wallet public key

**Response Example**:
```json
{
  "success": true,
  "profile": {
    "wallet_address": "8xGd...Kj3P",
    "username": "FarmLover123",
    "email": "user@example.com",
    "avatar_url": "https://...",
    "bio": "Passionate about sustainable farming",
    "favorite_animals": ["chicken", "goat"],
    "owned_nfts": [
      {
        "tokenId": 1,
        "type": "chicken",
        "mintAddress": "..."
      }
    ],
    "theme_preference": "meadow",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:45:00Z"
  }
}
```

**Error Response**:
```json
{
  "error": "Profile not found",
  "walletAddress": "8xGd...Kj3P"
}
```

---

#### POST `/api/profile/upsert`
**Description**: Create new profile or update existing profile

**Request Body**:
```json
{
  "walletAddress": "8xGd...Kj3P",
  "username": "FarmLover123",
  "email": "user@example.com",
  "avatarUrl": "https://...",
  "bio": "Passionate about sustainable farming",
  "favoriteAnimals": ["chicken", "goat"],
  "themePreference": "meadow",
  "notificationSettings": {
    "email": true,
    "browser": false
  }
}
```

**Response Example**:
```json
{
  "success": true,
  "profile": {
    "wallet_address": "8xGd...Kj3P",
    "username": "FarmLover123",
    ...
  },
  "message": "Profile saved successfully"
}
```

---

#### POST `/api/profile/update-nfts`
**Description**: Update user's owned NFT collection

**Request Body**:
```json
{
  "walletAddress": "8xGd...Kj3P",
  "nftTokens": [
    {
      "tokenId": 1,
      "type": "chicken",
      "name": "Chicken #001",
      "mintAddress": "DjVE...8pq",
      "rarity": "common",
      "acquiredAt": "2024-01-15T10:30:00Z"
    },
    {
      "tokenId": 54,
      "type": "rabbit",
      "name": "Rabbit #001 'Clover'",
      "mintAddress": "9kLM...2cx",
      "rarity": "legendary",
      "acquiredAt": "2024-01-20T14:45:00Z"
    }
  ]
}
```

**Response Example**:
```json
{
  "success": true,
  "walletAddress": "8xGd...Kj3P",
  "ownedNfts": [...],
  "updatedAt": "2024-01-20T14:45:00Z",
  "message": "NFT collection updated successfully"
}
```

---

## 🗄️ Database Schema

### Table: user_profiles

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| wallet_address | VARCHAR(44) | Unique Solana wallet address |
| username | VARCHAR(50) | User display name |
| email | VARCHAR(255) | Email address (optional) |
| avatar_url | TEXT | Profile picture URL |
| bio | TEXT | User biography |
| favorite_animals | JSONB | Array of favorite animal types |
| theme_preference | VARCHAR(20) | Preferred theme name |
| notification_settings | JSONB | Email/browser notification preferences |
| owned_nfts | JSONB | Array of owned NFT objects |
| created_at | TIMESTAMP | Account creation date |
| updated_at | TIMESTAMP | Last update timestamp |

**Indexes**:
- `idx_wallet_address` on `wallet_address`
- `idx_created_at` on `created_at`
- `idx_username` on `username`

---

### Table: nft_transactions (Optional)

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| signature | VARCHAR(88) | Unique transaction signature |
| transaction_type | VARCHAR(20) | mint, transfer, list, buy |
| from_wallet | VARCHAR(44) | Sender wallet |
| to_wallet | VARCHAR(44) | Receiver wallet |
| nft_id | INTEGER | NFT token ID |
| nft_type | VARCHAR(20) | Animal type |
| nft_name | VARCHAR(100) | NFT name |
| price_sol | DECIMAL(10,4) | Transaction price in SOL |
| block_number | BIGINT | Blockchain block number |
| slot | BIGINT | Blockchain slot |
| transaction_time | TIMESTAMP | Transaction timestamp |
| status | VARCHAR(20) | pending, confirmed, failed |
| metadata | JSONB | Additional transaction data |

**Indexes**:
- `idx_transaction_signature` on `signature`
- `idx_from_wallet` on `from_wallet`
- `idx_to_wallet` on `to_wallet`
- `idx_nft_id` on `nft_id`
- `idx_transaction_time` on `transaction_time`

---

### Table: activity_log (Optional)

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| wallet_address | VARCHAR(44) | User wallet |
| activity_type | VARCHAR(50) | Type of activity |
| activity_data | JSONB | Activity details |
| ip_address | VARCHAR(45) | User IP |
| user_agent | TEXT | Browser user agent |
| created_at | TIMESTAMP | Activity timestamp |

**Activity Types**:
- `profile_update` - Profile information changed
- `theme_change` - User changed theme
- `nft_view` - Viewed NFT detail
- `nft_favorite` - Added NFT to favorites
- `collection_browse` - Browsed collection
- `wallet_connect` - Connected wallet
- `wallet_disconnect` - Disconnected wallet

---

### Table: collection_stats (Optional)

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key (always 1) |
| total_minted | INTEGER | Total NFTs minted |
| total_holders | INTEGER | Unique wallet holders |
| floor_price_sol | DECIMAL(10,4) | Lowest listed price |
| total_volume_sol | DECIMAL(20,4) | Total trading volume |
| chickens_minted | INTEGER | Chickens minted |
| cats_minted | INTEGER | Cats minted |
| goats_minted | INTEGER | Goats minted |
| pigeons_minted | INTEGER | Pigeons minted |
| dog_minted | INTEGER | Dog minted (0 or 1) |
| rabbit_minted | INTEGER | Rabbit minted (0 or 1) |
| updated_at | TIMESTAMP | Last stats update |

---

## 🎨 Theme System

### Theme Schedule

| Time Range | Theme Name | Emoji | Featured Sequence |
|------------|------------|-------|-------------------|
| 00:00-03:59 | Green Meadow | 🌱 | Goat → Chicken → Cat → Rabbit |
| 04:00-07:59 | Sunset Farm | 🌅 | Chicken → Dog → Pigeon → Goat |
| 08:00-11:59 | Autumn Harvest | 🍂 | Cat → Rabbit → Chicken → Pigeon |
| 12:00-15:59 | Spring Bloom | 🌸 | Pigeon → Cat → Goat → Chicken |
| 16:00-19:59 | Night Pasture | 🌙 | Dog → Cat → Chicken → Goat |
| 20:00-23:59 | Winter Frost | ❄️ | Rabbit → Goat → Cat → Chicken |

### CSS Variables per Theme

Each theme sets these CSS variables:

```css
--bg-primary          /* Main background color */
--bg-gradient-1       /* First gradient color */
--bg-gradient-2       /* Second gradient color */
--bg-gradient-3       /* Third gradient color */
--text-primary        /* Primary text color */
--text-secondary      /* Secondary text color */
--accent-primary      /* Primary accent color */
--accent-secondary    /* Secondary accent color */
--accent-tertiary     /* Tertiary accent color */
--card-bg             /* Card background */
--card-bg-gradient    /* Card gradient overlay */
--border-color        /* Default border */
--border-color-hover  /* Hover border */
--trait-bg            /* Trait background */
--trait-border        /* Trait border */
--trait-color         /* Trait text color */
```

---

## 🔗 Solana Integration

### Network Configuration

**Testnet**:
```javascript
Network: 'testnet'
RPC Endpoint: 'https://api.testnet.solana.com'
Explorer: 'https://explorer.solana.com/?cluster=testnet'
```

**Mainnet** (Future):
```javascript
Network: 'mainnet-beta'
RPC Endpoint: 'https://api.mainnet-beta.solana.com'
Explorer: 'https://explorer.solana.com/'
```

### Wallet Functions

#### Connect Wallet
```javascript
walletManager.connectWallet()
// Returns: void
// Side effects: Updates UI, requests airdrop if needed
```

#### Get Balance
```javascript
await walletManager.updateBalance()
// Returns: void
// Updates: this.balance and UI displays
```

#### Request Airdrop (Testnet only)
```javascript
await walletManager.requestAirdrop()
// Airdrops: 2 SOL
// Returns: void
```

#### Disconnect
```javascript
walletManager.disconnect()
// Returns: void
// Side effects: Clears wallet data, updates UI
```

---

## 🦆 NFT Collection Data

### Collection Overview
- **Total Supply**: 55 NFTs
- **Blockchain**: Solana
- **Symbol**: HBFARM
- **Base Price**: 0.25 SOL
- **Royalties**: 5%

### Animal Distribution

| Type | Count | Rarity | Base Price |
|------|-------|--------|------------|
| Chicken | 40 | Common | 0.25 SOL |
| Cat | 5 | Uncommon | 0.50 SOL |
| Goat | 4 | Uncommon | 0.50 SOL |
| Pigeon | 4 | Rare | 0.75 SOL |
| Rabbit | 1 | Legendary | 1.50 SOL |
| Dog | 1 | Legendary | 2.00 SOL |

### Trait Structure

Each NFT includes:
```javascript
{
  id: 1,
  type: "chicken",
  name: "Chicken #001",
  rarity: "common",
  traits: {
    breed: "Rhode Island Red",
    color: "Brown",
    personality: "Friendly",
    eggColor: "Brown"
  },
  description: "A productive member of the flock...",
  image: "chicken-001.jpg",
  price: 0.25
}
```

---

## 🎮 JavaScript Classes

### WalletManager
**Responsibilities**: Solana wallet operations
**Methods**:
- `connectWallet()` - Connect Phantom or generate wallet
- `updateBalance()` - Fetch SOL balance
- `requestAirdrop()` - Request testnet SOL
- `disconnect()` - Disconnect wallet
- `loadProfile()` - Load user profile from API

### ProfileManager
**Responsibilities**: User profile CRUD
**Methods**:
- `openModal()` - Show profile modal
- `closeModal()` - Hide profile modal
- `populateProfile(profile)` - Fill form with data
- `saveProfile()` - Save to database via API
- `updateOwnedNFTs(nftTokens)` - Update NFT collection

### ThemeManager
**Responsibilities**: Theme cycling and featured animals
**Methods**:
- `updateThemeByTime()` - Auto-select theme by hour
- `switchTheme(name, isManual)` - Apply theme
- `updateFeaturedAnimals()` - Show featured NFTs
- `updateTimeDisplay()` - Update clock display

### CollectionManager
**Responsibilities**: NFT gallery management
**Methods**:
- `renderGallery()` - Display NFT cards
- `setupFilters()` - Handle filter buttons
- `updateStats()` - Update collection stats
- `syncWithSupabase()` - Sync minting status

### NFTCard
**Responsibilities**: Individual NFT display
**Methods**:
- `render()` - Generate card HTML

---

## 🔒 Security Notes

### Environment Variables
Never commit:
- `POSTGRES_URL`
- `POSTGRES_PASSWORD`
- Private keys
- API secrets

### SQL Injection Prevention
All queries use parameterized statements:
```javascript
await sql`SELECT * FROM users WHERE wallet = ${address}`
// ✅ Safe - parameterized

const query = `SELECT * FROM users WHERE wallet = '${address}'`
// ❌ Unsafe - string interpolation
```

### Wallet Security
- Private keys never stored in database
- Testnet only for development
- Always verify transactions before signing

---

## 📊 Future Features

### Planned Additions
- [ ] NFT Minting interface
- [ ] Marketplace buy/sell
- [ ] Staking system
- [ ] Breeding mechanics
- [ ] Achievement badges
- [ ] Social features (comments, likes)
- [ ] Analytics dashboard
- [ ] Mobile app

### Possible Integrations
- Metaplex for NFT standards
- Magic Eden for marketplace
- Discord for community
- IPFS for metadata storage

---

## 📞 Support Resources

**Documentation**:
- [Solana Docs](https://docs.solana.com)
- [Vercel Docs](https://vercel.com/docs)
- [Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)

**Explorers**:
- Testnet: https://explorer.solana.com/?cluster=testnet
- Mainnet: https://explorer.solana.com/

**Faucets** (Testnet SOL):
- https://solfaucet.com/
- Phantom Wallet built-in airdrop

---

Built with 🌾 for WorldBridger One ecosystem
