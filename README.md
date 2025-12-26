# 🌾 Hobby Farm NFT Collection

A sustainable hobby farm NFT collection on Solana with automatic theme cycling, user profiles, and Postgres storage.

## 🎨 Amazing Features

### NFT Collection
- **55 Total NFTs**: 40 Chickens, 5 Cats, 4 Goats, 4 Pigeons, 1 Dog, 1 Rabbit
- **Rarity Tiers**: Common, Uncommon, Rare, Legendary
- **Unique Traits**: Each animal has breed, color, personality, and special attributes

### Always Dynamic Theming
- **6 Farm Themes**: Auto-cycle through themes every 4 hours
  - 🌱 Green Meadow (00:00-03:59)
  - 🌅 Sunset Farm (04:00-07:59)
  - 🍂 Autumn Harvest (08:00-11:59)
  - 🌸 Spring Bloom (12:00-15:59)
  - 🌙 Night Pasture (16:00-19:59)
  - ❄️ Winter Frost (20:00-23:59)
- **Hourly Featured Animals**: Different animals featured each hour
- **Manual Override**: Users can select any theme

### Solana Integration
- **Wallet Connection**: Phantom wallet or auto-generated testnet wallet
- **Testnet Support**: Includes automatic SOL airdrop for testing
- **Transaction Ready**: Built for NFT minting and transfers

### User Profiles
- **Postgres Storage**: User data stored in Vercel Postgres
- **Profile Management**: Username, email, bio, avatar
- **NFT Tracking**: Owned NFTs linked to wallet address
- **Theme Preferences**: Save favorite theme settings

### Tech Stack
- **Frontend**: Vanilla JavaScript with class structure
- **Blockchain**: Solana Web3.js
- **Backend**: Vercel Serverless Functions
- **Database**: Vercel Postgres (PostgreSQL)
- **Styling**: Custom CSS with CSS variables for theming

## 📁 Project Structure

```
hobby-farm-nft-collection/
├── hobby-farm-nft.html          # Main application
├── api/
│   └── profile/
│       ├── get.js               # GET user profile
│       ├── upsert.js            # POST create/update profile
│       └── update-nfts.js       # POST update NFT collection
├── database-schema.sql          # Database schema
├── package.json                 # Dependencies
├── vercel.json                  # Deployment config
├── DEPLOYMENT_GUIDE.md          # Deployment instructions
├── theme-schedule-reference.md  # Theme cycling details
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for local development)
- Vercel account
- GitHub/GitLab account (recommended)

### Local Development

1. **Clone Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/hobby-farm-nft.git
   cd hobby-farm-nft
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Environment Variables**
   Create `.env` file with Postgres connection:
   ```env
   POSTGRES_URL="your_postgres_connection_string"
   ```

4. **Run Development Server**
   ```bash
   vercel dev
   ```

5. **Open Browser**
   ```
   http://localhost:3000
   ```

### Deploy to Vercel

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

**Quick Deploy:**
```bash
vercel --prod
```

## 🎮 Usage

### Connect Wallet

1. Click "Connect Wallet" button
2. **With Phantom**: Approve connection in Phantom wallet
3. **Without Phantom**: Application generates testnet wallet and airdrops 2 SOL

### View Profile

1. After connecting, click "Profile" button
2. View your NFT collection stats
3. Edit profile information
4. Save changes to Postgres database

### Browse Collection

1. Use filters to view specific animal types
2. View featured animals that rotate hourly
3. See rarity tiers and trait details

### Change Theme

1. Use dropdown in top-right to manually select theme
2. Or let it auto-cycle through themes every 4 hours
3. Featured animals update every hour

## 🗄️ Database Schema

### Tables

#### user_profiles
- Wallet address (primary key)
- Username, email, bio, avatar
- Favorite animals (JSON array)
- Owned NFTs (JSON array)
- Theme preference
- Timestamps

#### nft_transactions (optional)
- Transaction signatures
- From/to wallets
- NFT details
- Price in SOL
- Block/slot numbers

#### activity_log (optional)
- User activity tracking
- Activity types and data
- IP and user agent

#### collection_stats (optional)
- Total minted/holders
- Floor price
- Volume tracking

See `database-schema.sql` for complete schema.

## 🔌 API Endpoints

### GET `/api/profile/get`
Get user profile by wallet address

**Query Parameters:**
- `walletAddress`: Solana wallet public key

**Response:**
```json
{
  "success": true,
  "profile": {
    "wallet_address": "...",
    "username": "...",
    "owned_nfts": [],
    ...
  }
}
```

### POST `/api/profile/upsert`
Create or update user profile

**Body:**
```json
{
  "walletAddress": "...",
  "username": "...",
  "email": "...",
  "bio": "...",
  "avatarUrl": "..."
}
```

### POST `/api/profile/update-nfts`
Update user's owned NFTs

**Body:**
```json
{
  "walletAddress": "...",
  "nftTokens": [...]
}
```

## 🎨 Theme System

### Automatic Cycling
- Changes every 4 hours
- 6 themes cover 24 hours
- Featured animals rotate hourly within each theme

### Theme Configuration
Located in `THEME_SCHEDULE` constant:
```javascript
{
  name: 'meadow',
  hours: [0, 1, 2, 3],
  emoji: '🌱',
  label: 'Green Meadow',
  animalTypes: ['goat', 'chicken', 'cat', 'rabbit']
}
```

See `theme-schedule-reference.md` for complete schedule.

## 🔐 Security

- Environment variables for sensitive data
- Parameterized SQL queries prevent injection
- No private keys stored in database
- Testnet only (for now)
- CORS configured for Vercel domains

## 🛠️ Development

### Class Structure

- **WalletManager**: Handles Solana wallet operations
- **ProfileManager**: Manages user profile CRUD
- **ThemeManager**: Controls theme cycling and featured animals
- **CollectionManager**: Manages NFT gallery and filters
- **NFTCard**: Individual NFT card component

### Adding New Features

1. Create new class or extend existing
2. Add API endpoint in `/api` folder
3. Update database schema if needed
4. Test locally with `vercel dev`
5. Deploy to production

## 📊 Analytics (Future)

Plan to add:
- View tracking per NFT
- Popular animals metrics
- Theme preference analytics
- User engagement stats

## 🐛 Troubleshooting

### Wallet Issues
- Ensure Phantom is unlocked
- Try clearing browser cache
- Check testnet selection in wallet

### Database Issues
- Verify environment variables
- Check Vercel storage connection
- Review function logs

### API Issues
- Check Network tab in DevTools
- Verify endpoint URLs
- Review serverless function logs

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md#troubleshooting) for detailed troubleshooting.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

GPL-3.0 License - see LICENSE file

## 🌟 Acknowledgments

- Built for WorldBridger One ecosystem
- Inspired by sustainable farming practices
- Part of SparkHope.space mycological innovation platform

## 📞 Support

- Create issue on GitHub
- Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- Review [theme-schedule-reference.md](theme-schedule-reference.md)

---

Made with 🌾 by [Mupy](https://hub.approvideo.org) | Powered by Solana & Vercel
