# Hobby Farm NFT Collection - Deployment Guide

## Project Structure

```
hobby-farm-nft-collection/
├── hobby-farm-nft.html          # Main application file
├── api/
│   └── profile/
│       ├── get.js               # Get user profile endpoint
│       ├── upsert.js            # Create/update profile endpoint
│       └── update-nfts.js       # Update owned NFTs endpoint
├── database-schema.sql          # PostgreSQL schema
├── package.json                 # Node dependencies
├── vercel.json                  # Vercel configuration
└── README.md                    # This file
```

## Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **GitHub/GitLab Account**: For repository hosting
3. **Vercel CLI** (optional): `npm install -g vercel`

## Step 1: Database Setup

### Create Vercel Postgres Database

1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database
3. Select "Postgres" → Continue
4. Choose your region (recommend: Washington, D.C. - iad1)
5. Name your database: `hobby-farm-nft-db`
6. Click "Create"

### Initialize Database Schema

1. Once database is created, go to the "Query" tab
2. Copy the contents of `database-schema.sql`
3. Paste into the query editor
4. Click "Run Query" to create all tables

### Verify Tables Created

Run this query to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see:
- user_profiles
- nft_transactions
- activity_log
- collection_stats

## Step 2: Deploy to Vercel

### Option A: Deploy via GitHub (Recommended)

1. **Create Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Hobby Farm NFT Collection"
   ```

2. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/hobby-farm-nft.git
   git push -u origin main
   ```

3. **Import to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel will auto-detect the configuration
   - Click "Deploy"

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Step 3: Connect Database to Project

### Link Postgres to Vercel Project

1. Go to your project in Vercel dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Go to "Storage" tab
4. Click "Connect Store"
5. Select your Postgres database
6. Click "Connect"

This automatically adds these environment variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### Redeploy

After connecting the database, trigger a new deployment:
```bash
vercel --prod
```

Or via GitHub: Make any commit and push to trigger auto-deployment.

## Step 4: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain: `hub.approvideo.org` (or subdomain)
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning (~5 minutes)

## Step 5: Test the Application

### Test Wallet Connection

1. Visit your deployed site
2. Click "Connect Wallet"
3. Options:
   - **With Phantom Wallet**: Connect your Phantom wallet
   - **Without Phantom**: Auto-generates testnet wallet + 2 SOL airdrop

### Test Profile System

1. After connecting wallet, click "Profile"
2. Fill in profile information
3. Click "Save Profile"
4. Verify in database:
   ```sql
   SELECT * FROM user_profiles;
   ```

### Test API Endpoints

Test endpoints directly:

```bash
# Get profile
curl "https://YOUR_DOMAIN.vercel.app/api/profile/get?walletAddress=WALLET_ADDRESS"

# Create/Update profile
curl -X POST "https://YOUR_DOMAIN.vercel.app/api/profile/upsert" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "WALLET_ADDRESS",
    "username": "TestUser",
    "email": "test@example.com"
  }'
```

## Development Workflow

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   Create `.env` file:
   ```env
   POSTGRES_URL="postgres://..."
   ```

3. **Run Development Server**
   ```bash
   vercel dev
   ```

4. **Access Local Site**
   ```
   http://localhost:3000
   ```

### Making Changes

1. Edit files locally
2. Test with `vercel dev`
3. Commit changes
4. Push to trigger deployment

## Monitoring & Debugging

### View Logs

1. Go to Vercel dashboard → Your Project
2. Click on a deployment
3. View "Functions" tab for serverless function logs
4. View "Runtime Logs" for real-time debugging

### Database Queries

1. Go to Storage → Your Database
2. Use "Query" tab to inspect data
3. Common queries:

```sql
-- View all users
SELECT wallet_address, username, created_at, owned_nfts 
FROM user_profiles 
ORDER BY created_at DESC;

-- Count total users
SELECT COUNT(*) as total_users FROM user_profiles;

-- View recent transactions
SELECT * FROM nft_transactions 
ORDER BY transaction_time DESC 
LIMIT 10;
```

### Error Handling

Check these if issues occur:

1. **API Errors**: Check Function logs in Vercel
2. **Database Errors**: Verify environment variables are set
3. **Wallet Errors**: Check browser console for Solana errors
4. **Connection Errors**: Ensure using testnet endpoints

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **SQL Injection**: Use parameterized queries (already implemented)
3. **Rate Limiting**: Consider adding rate limits to API endpoints
4. **CORS**: Configure if needed for cross-origin requests
5. **Wallet Security**: Never store private keys in database

## Solana Testnet Configuration

### Network Details
- **Network**: Solana Testnet
- **RPC Endpoint**: `https://api.testnet.solana.com`
- **Explorer**: https://explorer.solana.com/?cluster=testnet

### Getting Test SOL

1. **Phantom Wallet Users**:
   - Switch to Testnet in Phantom settings
   - Use Phantom's built-in airdrop feature

2. **Generated Wallets**:
   - Application auto-requests 2 SOL airdrop
   - Or use: https://solfaucet.com/

### Monitoring Transactions

View transactions on Solana Explorer:
```
https://explorer.solana.com/address/YOUR_WALLET?cluster=testnet
```

## Troubleshooting

### Database Connection Issues

**Problem**: API returns 500 errors
**Solution**: 
1. Verify database is connected in Vercel
2. Check environment variables are set
3. Redeploy after connecting storage

### Wallet Not Connecting

**Problem**: Wallet button doesn't work
**Solution**:
1. Check browser console for errors
2. Ensure Solana Web3.js loaded correctly
3. Try different browser or clear cache
4. For Phantom: Ensure wallet is unlocked

### API Not Found (404)

**Problem**: `/api/profile/get` returns 404
**Solution**:
1. Ensure `api/` folder structure is correct
2. Verify `vercel.json` routes configuration
3. Redeploy project

### Profile Not Saving

**Problem**: Profile saves but doesn't show
**Solution**:
1. Check Network tab in browser DevTools
2. Verify API response is successful
3. Check database directly with SQL query
4. Clear browser cache and reload

## Upgrading to Mainnet

When ready for production:

1. **Update Configuration**
   ```javascript
   const SOLANA_NETWORK = 'mainnet-beta';
   const SOLANA_RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
   ```

2. **Update Database**
   - Consider separate production database
   - Backup testnet data first

3. **Deploy to Production**
   ```bash
   vercel --prod
   ```

4. **Test Thoroughly**
   - Test with small amounts first
   - Verify all transactions
   - Monitor for issues

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Solana Docs**: https://docs.solana.com
- **Postgres Docs**: https://vercel.com/docs/storage/vercel-postgres

## License

GPL-3.0 - Open Source

---

Built with ❤️ for sustainable living and digital ownership
