# NFT Storage & Media Lifecycle Plan

## Overview
WorldBridger One NFT collection requires a robust, decentralized storage strategy for media assets and metadata. This document outlines the data lifecycle for active content including audio, visual, and metadata files.

---

## Daily Generated Content

### Sound Generation System
Daily NFT rapper cards include unique generated sounds based on:

**Base Generation:**
- **Frequency:** 200-800 Hz (varies by card)
- **Wave Types:** Sine, Square, Sawtooth, Triangle
- **Daily Seed:** Date-based (YYYYMMDD format)
- **Per-Card Variation:** Card ID influences frequency/wave selection

**Advanced Remixing (Planned):**
- Remix supplied/created audio vectors
- Combine image vector data with audio synthesis
- Layer user-created beats with generative elements
- Apply effects based on rarity tier and animal spirit

### Visual Generation
SVG-based rapper personas with:
- Geodesic face geometry (male/female variations)
- 10 animal spirit overlays
- Procedural color palettes from rarity
- Dynamic badge composition

---

## File Types & Formats

### Audio Files
- `.wav` - Lossless original recordings
- `.m4a` - High-quality compressed (battle submissions)
- `.mp3` - Web-optimized streaming
- `.ogg` - Open format alternative

### Visual Files
- `.svg` - Vector rapper card templates
- `.png` - Rasterized card exports (OpenGraph, thumbnails)
- `.webp` - Optimized web delivery
- `.mp4` - Video NFT animations (future)

### Metadata Files
- `.json` - NFT metadata (Metaplex standard)
- `.json` - Collection manifest
- `.txt` - Provenance records

---

## Storage Lifecycle Architecture

### 1. **Creation Phase**
**Location:** Vercel Serverless / Client Browser
- User creates beat OR sound is procedurally generated
- SVG rapper card rendered based on battle results
- Metadata compiled (stats, badges, timestamps)

**Temporary Storage:**
- Vercel Postgres (user session data)
- Browser localStorage (draft beats/cards)
- `/tmp` directory for serverless processing

---

### 2. **Upload & Pin Phase**
**Decentralized Storage Targets:**

#### **Arweave** (Permanent Storage - Preferred)
- **Use Case:** Final NFT assets, immutable metadata
- **Cost:** One-time payment for permanent storage
- **Implementation:**
  ```javascript
  import Arweave from 'arweave';
  const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
  });

  const transaction = await arweave.createTransaction({
    data: audioBuffer
  });
  await arweave.transactions.sign(transaction, wallet);
  await arweave.transactions.post(transaction);
  ```
- **Files:** All finalized NFT assets (audio, images, metadata)
- **URL Pattern:** `https://arweave.net/[TX_ID]`

#### **Pinata (IPFS Gateway)**
- **Use Case:** Fast retrieval, redundant backup
- **Cost:** Monthly subscription based on storage
- **Implementation:**
  ```javascript
  import pinataSDK from '@pinata/sdk';
  const pinata = pinataSDK(apiKey, secretKey);

  const result = await pinata.pinFileToIPFS(file, {
    pinataMetadata: {
      name: 'rapper-card-001.svg',
      keyvalues: {
        cardId: '001',
        rarity: 'legendary'
      }
    }
  });
  ```
- **Files:** Frequently accessed assets, thumbnails
- **URL Pattern:** `https://gateway.pinata.cloud/ipfs/[CID]`

#### **NFT.Storage** (IPFS + Filecoin)
- **Use Case:** Free tier for NFT metadata, backed by Filecoin
- **Cost:** Free up to 100GB
- **Implementation:**
  ```javascript
  import { NFTStorage, File } from 'nft.storage';
  const client = new NFTStorage({ token: API_TOKEN });

  const metadata = await client.store({
    name: 'Lion Rapper #001',
    description: 'Legendary battle card',
    image: new File([imageBlob], 'card.png', { type: 'image/png' }),
    properties: {
      sound_frequency: 755,
      wave_type: 'sawtooth',
      badges: 3
    }
  });
  ```
- **Files:** NFT metadata JSON, card images
- **URL Pattern:** `ipfs://[CID]`

#### **BitTorrent (WebTorrent Protocol)**
- **Use Case:** P2P distribution for large audio collections
- **Cost:** Free (bandwidth distributed)
- **Implementation:**
  ```javascript
  import WebTorrent from 'webtorrent';
  const client = new WebTorrent();

  client.seed(audioFile, (torrent) => {
    console.log('Magnet URI:', torrent.magnetURI);
  });
  ```
- **Files:** Audio packs, beat libraries, collection bundles
- **URL Pattern:** `magnet:?xt=urn:btih:[HASH]`

#### **Cloudflare R2 (Edge Storage)**
- **Use Case:** CDN delivery, API caching, hot storage
- **Cost:** No egress fees, pay for storage
- **Implementation:**
  ```javascript
  const response = await fetch(CLOUDFLARE_R2_ENDPOINT, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'audio/wav'
    },
    body: audioBlob
  });
  ```
- **Files:** Optimized delivery copies, thumbnails, previews
- **URL Pattern:** `https://[bucket].r2.cloudflarestorage.com/[key]`

---

## Storage Strategy by File Type

| Asset Type | Primary Storage | Backup/CDN | Public Gateway |
|------------|----------------|------------|----------------|
| **NFT Metadata** | Arweave | NFT.Storage (IPFS) | Pinata |
| **Audio (Master)** | Arweave | Pinata (IPFS) | - |
| **Audio (Streaming)** | Cloudflare R2 | BitTorrent | - |
| **SVG Cards** | Arweave | Pinata (IPFS) | - |
| **PNG Thumbnails** | Cloudflare R2 | Pinata | Pinata Gateway |
| **Collection Bundles** | BitTorrent | Arweave | - |

---

## Lifecycle Stages

### Stage 1: **Active Content** (0-7 days)
- **Storage:** Cloudflare R2 (fast retrieval)
- **Caching:** Edge CDN with short TTL
- **Status:** Mutable (can update metadata before minting)

### Stage 2: **Pre-Mint** (7-30 days)
- **Storage:** Pinata IPFS (content addressing)
- **Backup:** Arweave (permanent anchor)
- **Status:** Frozen (ready for blockchain minting)

### Stage 3: **Minted NFT** (Permanent)
- **Primary:** Arweave (immutable, permanent)
- **Metadata:** On-chain (Solana/Polkadot)
- **Delivery:** Cloudflare R2 + Pinata gateways
- **Status:** Immutable (cryptographically sealed)

### Stage 4: **Archived Collections** (Historical)
- **Storage:** BitTorrent (community seeding)
- **Backup:** Arweave (historical record)
- **Access:** Public torrent + IPFS mirrors

---

## API Integration Plan

### Upload Flow
```javascript
/**
 * Upload asset to multiple storage providers
 * Returns URLs for each storage layer
 */
async function uploadAsset(file, metadata) {
  const results = {
    arweave: null,
    ipfs: null,
    cloudflare: null,
    torrent: null
  };

  // 1. Upload to Cloudflare R2 (immediate availability)
  results.cloudflare = await uploadToCloudflare(file);

  // 2. Pin to IPFS via Pinata (content-addressed)
  results.ipfs = await pinToPinata(file, metadata);

  // 3. Store permanently on Arweave (immutable)
  results.arweave = await uploadToArweave(file, {
    ...metadata,
    ipfs_cid: results.ipfs.cid,
    cf_url: results.cloudflare.url
  });

  // 4. Seed on BitTorrent (optional for large files)
  if (file.size > 10_000_000) { // >10MB
    results.torrent = await seedTorrent(file);
  }

  return results;
}
```

### Retrieval Flow
```javascript
/**
 * Fetch asset with fallback strategy
 * 1. Try Cloudflare R2 (fastest)
 * 2. Fall back to Pinata gateway
 * 3. Fall back to Arweave
 */
async function fetchAsset(assetId) {
  const metadata = await db.getAssetMetadata(assetId);

  try {
    return await fetch(metadata.cloudflare_url);
  } catch {
    try {
      return await fetch(`https://gateway.pinata.cloud/ipfs/${metadata.ipfs_cid}`);
    } catch {
      return await fetch(`https://arweave.net/${metadata.arweave_tx}`);
    }
  }
}
```

---

## Cost Estimates

### Monthly Operating Costs (1000 active NFTs)

| Service | Storage | Bandwidth | Monthly Cost |
|---------|---------|-----------|--------------|
| **Cloudflare R2** | 100GB | Unlimited | $1.50 |
| **Pinata** | 50GB | 100GB | $20.00 |
| **NFT.Storage** | 50GB | - | Free |
| **Arweave** | 10GB | - | $10 (one-time) |
| **BitTorrent** | - | - | Free |
| **Total** | 210GB | - | ~$22/month |

### Per-NFT Costs
- **Arweave Storage:** ~$0.01 per NFT (2MB average)
- **IPFS Pinning:** Included in Pinata subscription
- **CDN Delivery:** Free (Cloudflare R2)
- **Minting Fee:** 0.01 SOL (~$1 at current prices)

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up Cloudflare R2 bucket
- [ ] Configure Pinata API keys
- [ ] Create NFT.Storage account
- [ ] Build upload service API endpoint

### Phase 2: Integration (Weeks 3-4)
- [ ] Implement multi-provider upload function
- [ ] Add fallback retrieval logic
- [ ] Test daily sound generation pipeline
- [ ] Create metadata schema for all providers

### Phase 3: Optimization (Weeks 5-6)
- [ ] Set up Arweave wallet and funding
- [ ] Implement BitTorrent seeding for collections
- [ ] Add monitoring for storage health
- [ ] Optimize compression and formats

### Phase 4: Production (Weeks 7-8)
- [ ] Deploy to production
- [ ] Migrate existing assets to Arweave
- [ ] Enable automatic daily generation
- [ ] Launch public gallery

---

## Security & Redundancy

### Data Integrity
- **Checksums:** SHA-256 hashes for all files
- **Verification:** Cross-check between storage providers
- **Provenance:** Blockchain anchoring for authenticity

### Backup Strategy
- **3-2-1 Rule:** 3 copies, 2 different media, 1 offsite
  - Copy 1: Cloudflare R2 (production)
  - Copy 2: Pinata IPFS (distributed)
  - Copy 3: Arweave (permanent offsite)

### Access Control
- **Public Assets:** Open IPFS/Arweave access
- **Pre-Mint Drafts:** Authenticated Cloudflare R2
- **API Keys:** Environment variables, rotated monthly

---

## Monitoring & Maintenance

### Health Checks
- Daily: Verify Cloudflare R2 accessibility
- Weekly: Check IPFS pin status on Pinata
- Monthly: Audit Arweave transaction confirmations
- Quarterly: Review BitTorrent seed health

### Alerting
- Storage quota warnings (>80% capacity)
- Failed upload retries (>3 attempts)
- Gateway downtime (>5 minutes)
- Cost threshold alerts (>$50/month)

---

## References & Resources

- [Arweave Documentation](https://docs.arweave.org/)
- [Pinata IPFS Guide](https://docs.pinata.cloud/)
- [NFT.Storage API](https://nft.storage/docs/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [WebTorrent Protocol](https://webtorrent.io/docs)
- [Metaplex NFT Standard](https://docs.metaplex.com/programs/token-metadata/overview)

---

**Status:** Planning Phase
**Last Updated:** 2026-01-03
**Owner:** WorldBridger One Dev Team
