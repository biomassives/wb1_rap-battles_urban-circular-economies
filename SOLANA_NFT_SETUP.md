# Solana NFT Setup Guide
**WorldBridger One - Rapper NFT Collection on Solana Testnet**

## Overview
This guide covers setting up Solana NFT functionality for the WorldBridger One platform using Solana testnet.

---

## Prerequisites

### 1. Install Solana CLI
```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Verify installation
solana --version

# Expected output: solana-cli 1.18.x or higher
```

### 2. Configure Solana CLI for Testnet
```bash
# Set cluster to testnet
solana config set --url https://api.testnet.solana.com

# Verify configuration
solana config get

# Expected output:
# Config File: ~/.config/solana/cli/config.yml
# RPC URL: https://api.testnet.solana.com
# WebSocket URL: wss://api.testnet.solana.com/
# Keypair Path: ~/.config/solana/id.json
# Commitment: confirmed
```

### 3. Create Wallet (if needed)
```bash
# Generate new keypair
solana-keygen new --outfile ~/.config/solana/id.json

# Get your wallet address
solana address

# Check balance
solana balance
```

### 4. Request Testnet SOL (Airdrop)
```bash
# Request 2 SOL from testnet faucet
solana airdrop 2

# Verify balance
solana balance

# Alternative: Use web faucet
# Visit: https://solfaucet.com/
```

---

## NPM Dependencies

### Install Required Packages
```bash
cd /home/solstice/WorldbridgerOne/purple-point/pp

# Install Solana Web3.js
npm install @solana/web3.js

# Install Metaplex SDK (for NFT standards)
npm install @metaplex-foundation/js

# Install Metaplex Token Metadata
npm install @metaplex-foundation/mpl-token-metadata

# Verify installation
npm list @solana/web3.js @metaplex-foundation/js
```

---

## Project Structure

```
pp/
├── public/
│   └── scripts/
│       └── solana-nft-manager.js     # Main NFT manager class
├── src/
│   └── pages/
│       └── api/
│           └── nft/
│               ├── owned.js           # GET owned NFTs
│               ├── mint.js            # POST mint NFT
│               ├── transfer.js        # POST transfer NFT
│               └── list-for-sale.js  # POST list NFT
└── SOLANA_NFT_SETUP.md               # This file
```

---

## Configuration

### Environment Variables
Create or update `.env` file:

```bash
# Solana Configuration
SOLANA_NETWORK=testnet
SOLANA_RPC_URL=https://api.testnet.solana.com

# Collection Configuration
NFT_COLLECTION_NAME="WorldBridger Rapper NFT Collection"
NFT_COLLECTION_SYMBOL=WBRAP
NFT_ROYALTY_BASIS_POINTS=500

# Collection Authority (your wallet)
COLLECTION_AUTHORITY_PUBKEY=your_wallet_address_here

# Optional: Metaplex Sugar CLI for minting
METAPLEX_CANDY_MACHINE_ID=your_candy_machine_id
```

---

## Usage

### 1. Initialize Solana NFT Manager

Add to your HTML/Astro page:

```html
<!-- Load Solana Web3.js -->
<script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js"></script>

<!-- Load NFT Manager -->
<script src="/scripts/solana-nft-manager.js"></script>

<script>
  // Initialize NFT Manager
  const nftManager = new SolanaNFTManager();

  // Connect to testnet
  await nftManager.initialize(window.walletManager);

  // Store globally
  window.nftManager = nftManager;
</script>
```

### 2. Get Owned NFTs

```javascript
// Get all NFTs owned by a wallet
const walletAddress = window.walletManager.connectedWallet;
const ownedNFTs = await window.nftManager.getOwnedNFTs(walletAddress);

console.log(`Owned NFTs:`, ownedNFTs);
```

### 3. Transfer NFT

```javascript
// Transfer NFT to another wallet
const result = await window.nftManager.transferNFT(
  'mintAddress',      // NFT mint address
  'recipientAddress'  // Recipient wallet
);

if (result.success) {
  console.log('Transfer successful:', result.signature);
} else {
  console.error('Transfer failed:', result.message);
}
```

### 4. List NFT for Sale

```javascript
// List NFT on marketplace
const result = await window.nftManager.listNFTForSale(
  'mintAddress',  // NFT mint address
  0.5             // Price in SOL
);
```

---

## Testing on Testnet

### 1. Test Wallet Connection
```bash
# Check your testnet wallet
solana address

# Check balance
solana balance

# Request more SOL if needed
solana airdrop 1
```

### 2. Test NFT Query
```bash
# Get all token accounts for a wallet
solana account YOUR_WALLET_ADDRESS

# Get specific token account
solana account TOKEN_ACCOUNT_ADDRESS --output json
```

### 3. Test Transfer (CLI)
```bash
# Transfer SPL token (NFT)
spl-token transfer NFT_MINT_ADDRESS 1 RECIPIENT_ADDRESS --fund-recipient
```

---

## Metaplex Integration (Advanced)

### Install Metaplex Sugar CLI
```bash
# Install Sugar (Metaplex CLI)
bash <(curl -sSf https://sugar.metaplex.com/install.sh)

# Verify installation
sugar --version
```

### Create NFT Collection with Sugar

1. **Prepare Assets**
```bash
mkdir -p nft-assets

# Create metadata files
# 0.json, 1.json, ... 54.json
# 0.png, 1.png, ... 54.png
```

2. **Configure Collection**
```bash
# Create config.json
cat > config.json <<EOF
{
  "price": 0.25,
  "number": 55,
  "symbol": "WBRAP",
  "sellerFeeBasisPoints": 500,
  "creators": [
    {
      "address": "YOUR_WALLET_ADDRESS",
      "share": 100
    }
  ],
  "uploadMethod": "bundlr",
  "guards": {}
}
EOF
```

3. **Upload and Deploy**
```bash
# Upload assets to Arweave (via Bundlr)
sugar upload

# Deploy candy machine
sugar deploy

# Mint NFTs
sugar mint
```

---

## API Endpoints

### GET /api/nft/owned
Get all NFTs owned by wallet

**Query Parameters:**
- `walletAddress` (required)

**Response:**
```json
{
  "success": true,
  "walletAddress": "...",
  "count": 3,
  "nfts": [...]
}
```

### POST /api/nft/transfer
Transfer NFT to another wallet

**Body:**
```json
{
  "mintAddress": "...",
  "fromAddress": "...",
  "toAddress": "..."
}
```

### POST /api/nft/list-for-sale
List NFT on marketplace

**Body:**
```json
{
  "mintAddress": "...",
  "sellerAddress": "...",
  "price": 0.5,
  "duration": 30
}
```

### POST /api/nft/mint
Mint new NFT (requires Metaplex)

**Body:**
```json
{
  "walletAddress": "...",
  "nftId": 1,
  "metadata": {
    "name": "Rapper #001",
    "symbol": "WBRAP",
    "uri": "https://...",
    "rarity": "Uncommon"
  }
}
```

---

## Troubleshooting

### Issue: "Wallet not connected"
**Solution:** Ensure Phantom wallet is connected
```javascript
await window.walletManager.connectWallet();
```

### Issue: "Insufficient SOL for transaction"
**Solution:** Request airdrop
```bash
solana airdrop 1
```

### Issue: "Network request failed"
**Solution:** Check RPC endpoint
```bash
solana config get
# Should show: https://api.testnet.solana.com
```

### Issue: "Token account doesn't exist"
**Solution:** The NFT manager creates token accounts automatically. Ensure recipient has enough SOL for rent (~0.002 SOL).

---

## Production Deployment

### Mainnet Configuration

**DO NOT deploy to mainnet until thoroughly tested on testnet!**

When ready for mainnet:

1. **Switch to Mainnet**
```bash
solana config set --url https://api.mainnet-beta.solana.com
```

2. **Update Environment Variables**
```bash
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

3. **Secure Private Keys**
- Never commit private keys to git
- Use hardware wallets for collection authority
- Set up multi-sig for high-value operations

4. **Use RPC Providers**
- Helius: https://helius.dev
- QuickNode: https://quicknode.com
- Alchemy: https://alchemy.com

---

## Resources

### Documentation
- Solana Docs: https://docs.solana.com
- Metaplex Docs: https://docs.metaplex.com
- Web3.js Docs: https://solana-labs.github.io/solana-web3.js/

### Tools
- Solana Explorer: https://explorer.solana.com/?cluster=testnet
- Solscan: https://solscan.io
- Phantom Wallet: https://phantom.app

### Faucets (Testnet)
- Official: `solana airdrop 2`
- Web: https://solfaucet.com/
- QuickNode: https://faucet.quicknode.com/solana/testnet

---

## Next Steps

1. ✅ Install Solana CLI and configure testnet
2. ✅ Install NPM dependencies
3. ✅ Request testnet SOL airdrop
4. ✅ Test wallet connection
5. ✅ Test querying owned NFTs
6. ⏳ Implement Metaplex minting (optional)
7. ⏳ Test NFT transfers
8. ⏳ Implement marketplace escrow (advanced)

---

**Created for WorldBridger One**
**Supporting Kakuma Refugee Camp & POREFPC Initiative**
**GPL-3.0 License**

🌾 Building on Solana testnet! ✨
