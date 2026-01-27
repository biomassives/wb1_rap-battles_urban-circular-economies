/**
 * Solana NFT Manager
 * Handles NFT operations on Solana Testnet
 *
 * Features:
 * - Mint NFTs (Metaplex standard)
 * - Transfer NFTs
 * - List/Delist NFTs for sale
 * - Query owned NFTs
 * - Fetch NFT metadata
 */

class SolanaNFTManager {
  constructor() {
    // Solana Testnet Configuration
    this.network = 'testnet';
    this.rpcEndpoint = 'https://api.testnet.solana.com';
    this.connection = null;
    this.wallet = null;

    // NFT Collection Configuration
    this.collectionConfig = {
      name: 'WorldBridger Rapper NFT Collection',
      symbol: 'WBRAP',
      sellerFeeBasisPoints: 500, // 5% royalty
      creators: [],
      totalSupply: 55
    };

    // Rarity pricing
    this.rarityPricing = {
      'Common': 0.25,      // SOL
      'Uncommon': 0.50,    // SOL
      'Rare': 0.75,        // SOL
      'Legendary': 1.50    // SOL
    };
  }

  /**
   * Initialize connection to Solana testnet
   */
  async initialize(walletAdapter) {
    try {
      console.log('🔗 Initializing Solana NFT Manager...');

      // Check if Solana web3 is available
      if (typeof window.solanaWeb3 === 'undefined') {
        throw new Error('Solana Web3.js not loaded');
      }

      this.connection = new window.solanaWeb3.Connection(
        this.rpcEndpoint,
        'confirmed'
      );

      // Set wallet from connected wallet manager
      if (walletAdapter) {
        this.wallet = walletAdapter;
      }

      console.log('✅ Solana NFT Manager initialized');
      console.log(`📡 Network: ${this.network}`);
      console.log(`🔗 RPC: ${this.rpcEndpoint}`);

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Solana NFT Manager:', error);
      return false;
    }
  }

  /**
   * Get all NFTs owned by a wallet address
   */
  async getOwnedNFTs(walletAddress) {
    try {
      console.log(`🔍 Fetching NFTs for wallet: ${walletAddress}`);

      if (!this.connection) {
        throw new Error('Connection not initialized');
      }

      const publicKey = new window.solanaWeb3.PublicKey(walletAddress);

      // Get all token accounts owned by the wallet
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: window.solanaWeb3.TOKEN_PROGRAM_ID }
      );

      console.log(`📦 Found ${tokenAccounts.value.length} token accounts`);

      // Filter for NFTs (tokens with amount = 1 and decimals = 0)
      const nftAccounts = tokenAccounts.value.filter(account => {
        const amount = account.account.data.parsed.info.tokenAmount.uiAmount;
        const decimals = account.account.data.parsed.info.tokenAmount.decimals;
        return amount === 1 && decimals === 0;
      });

      console.log(`💎 Found ${nftAccounts.length} potential NFTs`);

      // Fetch metadata for each NFT
      const nfts = await Promise.all(
        nftAccounts.map(async (account) => {
          const mint = account.account.data.parsed.info.mint;
          return await this.getNFTMetadata(mint);
        })
      );

      // Filter out null results and non-collection NFTs
      const collectionNFTs = nfts.filter(nft =>
        nft && nft.symbol === this.collectionConfig.symbol
      );

      console.log(`✅ Retrieved ${collectionNFTs.length} collection NFTs`);
      return collectionNFTs;

    } catch (error) {
      console.error('❌ Error fetching owned NFTs:', error);
      return [];
    }
  }

  /**
   * Get NFT metadata from mint address
   */
  async getNFTMetadata(mintAddress) {
    try {
      // Get metadata PDA (Program Derived Address)
      const METADATA_PROGRAM_ID = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';

      const metadataPDA = await this.findMetadataPDA(mintAddress);

      // Fetch account info
      const accountInfo = await this.connection.getAccountInfo(
        new window.solanaWeb3.PublicKey(metadataPDA)
      );

      if (!accountInfo) {
        console.log(`⚠️ No metadata found for mint: ${mintAddress}`);
        return null;
      }

      // Parse metadata (simplified - full implementation needs Metaplex SDK)
      const metadata = this.parseMetadata(accountInfo.data);

      // Fetch off-chain metadata from URI
      if (metadata.uri) {
        try {
          const response = await fetch(metadata.uri);
          const offChainData = await response.json();

          return {
            mint: mintAddress,
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
            ...offChainData
          };
        } catch (error) {
          console.error('Failed to fetch off-chain metadata:', error);
        }
      }

      return {
        mint: mintAddress,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri
      };

    } catch (error) {
      console.error('❌ Error fetching NFT metadata:', error);
      return null;
    }
  }

  /**
   * Find Metaplex metadata PDA for a mint
   */
  async findMetadataPDA(mintAddress) {
    const METADATA_PROGRAM_ID = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';

    const [pda] = await window.solanaWeb3.PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        new window.solanaWeb3.PublicKey(METADATA_PROGRAM_ID).toBuffer(),
        new window.solanaWeb3.PublicKey(mintAddress).toBuffer(),
      ],
      new window.solanaWeb3.PublicKey(METADATA_PROGRAM_ID)
    );

    return pda.toString();
  }

  /**
   * Parse metadata from account data (simplified)
   */
  parseMetadata(data) {
    // This is a simplified parser
    // Full implementation should use Metaplex SDK's deserializer
    try {
      // Extract basic fields from metadata account data
      // Format: key (1) + updateAuthority (32) + mint (32) + name (variable) + symbol (variable) + uri (variable)

      let offset = 1 + 32 + 32; // Skip key, updateAuthority, mint

      // Read name (4 bytes length + string)
      const nameLength = data.readUInt32LE(offset);
      offset += 4;
      const name = data.slice(offset, offset + nameLength).toString('utf8').replace(/\0/g, '');
      offset += nameLength;

      // Read symbol (4 bytes length + string)
      const symbolLength = data.readUInt32LE(offset);
      offset += 4;
      const symbol = data.slice(offset, offset + symbolLength).toString('utf8').replace(/\0/g, '');
      offset += symbolLength;

      // Read URI (4 bytes length + string)
      const uriLength = data.readUInt32LE(offset);
      offset += 4;
      const uri = data.slice(offset, offset + uriLength).toString('utf8').replace(/\0/g, '');

      return { name, symbol, uri };
    } catch (error) {
      console.error('Error parsing metadata:', error);
      return { name: '', symbol: '', uri: '' };
    }
  }

  /**
   * Mint a new NFT
   * Note: This is a simplified version. Production should use Metaplex SDK
   */
  async mintNFT(nftData) {
    try {
      console.log('🎨 Starting NFT mint process...');

      if (!this.wallet) {
        throw new Error('Wallet not connected');
      }

      const { name, symbol, uri, rarity } = nftData;

      // Calculate price based on rarity
      const price = this.rarityPricing[rarity] || 0.25;

      console.log(`💰 Mint price: ${price} SOL`);

      // TODO: Implement full minting with Metaplex
      // This requires:
      // 1. Create mint account
      // 2. Create token account
      // 3. Mint token (amount = 1)
      // 4. Create metadata account
      // 5. Create master edition account

      // For now, return placeholder
      console.log('⚠️ Full minting implementation requires Metaplex SDK');
      console.log('📝 NFT Data:', { name, symbol, uri, rarity, price });

      return {
        success: false,
        message: 'Minting requires Metaplex SDK integration',
        mintAddress: null
      };

    } catch (error) {
      console.error('❌ Mint failed:', error);
      return {
        success: false,
        message: error.message,
        mintAddress: null
      };
    }
  }

  /**
   * Transfer NFT to another wallet
   */
  async transferNFT(mintAddress, recipientAddress) {
    try {
      console.log(`📤 Transferring NFT ${mintAddress} to ${recipientAddress}`);

      if (!this.wallet || !this.connection) {
        throw new Error('Wallet or connection not initialized');
      }

      const fromPubkey = new window.solanaWeb3.PublicKey(this.wallet.publicKey);
      const toPubkey = new window.solanaWeb3.PublicKey(recipientAddress);
      const mintPubkey = new window.solanaWeb3.PublicKey(mintAddress);

      // Get source token account (from wallet)
      const fromTokenAccount = await this.getAssociatedTokenAddress(
        mintPubkey,
        fromPubkey
      );

      // Get or create destination token account
      const toTokenAccount = await this.getAssociatedTokenAddress(
        mintPubkey,
        toPubkey
      );

      // Check if destination token account exists
      const toAccountInfo = await this.connection.getAccountInfo(toTokenAccount);

      const transaction = new window.solanaWeb3.Transaction();

      // If destination account doesn't exist, create it
      if (!toAccountInfo) {
        const createAccountInstruction = await this.createAssociatedTokenAccountInstruction(
          fromPubkey,
          toTokenAccount,
          toPubkey,
          mintPubkey
        );
        transaction.add(createAccountInstruction);
      }

      // Add transfer instruction
      const transferInstruction = window.solanaWeb3.Token.createTransferInstruction(
        window.solanaWeb3.TOKEN_PROGRAM_ID,
        fromTokenAccount,
        toTokenAccount,
        fromPubkey,
        [],
        1 // NFTs have amount = 1
      );
      transaction.add(transferInstruction);

      // Send transaction
      const signature = await this.wallet.sendTransaction(transaction, this.connection);

      // Confirm transaction
      await this.connection.confirmTransaction(signature, 'confirmed');

      console.log('✅ Transfer successful!');
      console.log(`📝 Signature: ${signature}`);

      return {
        success: true,
        signature,
        message: 'NFT transferred successfully'
      };

    } catch (error) {
      console.error('❌ Transfer failed:', error);
      return {
        success: false,
        message: error.message,
        signature: null
      };
    }
  }

  /**
   * Get Associated Token Address
   */
  async getAssociatedTokenAddress(mintPubkey, ownerPubkey) {
    const ASSOCIATED_TOKEN_PROGRAM_ID = new window.solanaWeb3.PublicKey(
      'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
    );

    const [address] = await window.solanaWeb3.PublicKey.findProgramAddress(
      [
        ownerPubkey.toBuffer(),
        window.solanaWeb3.TOKEN_PROGRAM_ID.toBuffer(),
        mintPubkey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return address;
  }

  /**
   * Create Associated Token Account instruction
   */
  async createAssociatedTokenAccountInstruction(
    payer,
    associatedToken,
    owner,
    mint
  ) {
    const ASSOCIATED_TOKEN_PROGRAM_ID = new window.solanaWeb3.PublicKey(
      'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
    );

    const keys = [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedToken, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: window.solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: window.solanaWeb3.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: window.solanaWeb3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];

    return new window.solanaWeb3.TransactionInstruction({
      keys,
      programId: ASSOCIATED_TOKEN_PROGRAM_ID,
      data: Buffer.alloc(0),
    });
  }

  /**
   * List NFT for sale (create escrow)
   */
  async listNFTForSale(mintAddress, priceInSOL) {
    try {
      console.log(`📋 Listing NFT ${mintAddress} for ${priceInSOL} SOL`);

      // TODO: Implement marketplace escrow
      // This requires:
      // 1. Create escrow account
      // 2. Transfer NFT to escrow
      // 3. Store listing data (price, seller, expiration)

      console.log('⚠️ Marketplace listing requires custom program or integration');

      return {
        success: false,
        message: 'Marketplace listing coming soon',
        listingId: null
      };

    } catch (error) {
      console.error('❌ Listing failed:', error);
      return {
        success: false,
        message: error.message,
        listingId: null
      };
    }
  }

  /**
   * Delist NFT (cancel sale)
   */
  async delistNFT(listingId) {
    try {
      console.log(`🚫 Delisting NFT listing ${listingId}`);

      // TODO: Implement marketplace delist
      // This requires:
      // 1. Close escrow account
      // 2. Return NFT to seller

      return {
        success: false,
        message: 'Marketplace delisting coming soon'
      };

    } catch (error) {
      console.error('❌ Delisting failed:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Buy NFT from marketplace
   */
  async buyNFT(listingId) {
    try {
      console.log(`🛒 Purchasing NFT from listing ${listingId}`);

      // TODO: Implement marketplace purchase
      // This requires:
      // 1. Transfer SOL to seller
      // 2. Transfer NFT from escrow to buyer
      // 3. Handle royalties and platform fees

      return {
        success: false,
        message: 'Marketplace purchase coming soon',
        signature: null
      };

    } catch (error) {
      console.error('❌ Purchase failed:', error);
      return {
        success: false,
        message: error.message,
        signature: null
      };
    }
  }

  /**
   * Get NFT holder benefits
   */
  getNFTBenefits(rarity) {
    const benefits = {
      'Common': [
        { icon: '✓', text: '+5% XP_BOOST' },
        { icon: '✓', text: 'BASIC_SOUNDS' },
        { icon: '✓', text: 'PROFILE_BADGE' }
      ],
      'Uncommon': [
        { icon: '✓', text: '+10% XP_BOOST' },
        { icon: '✓', text: 'EXCLUSIVE_SOUNDS' },
        { icon: '✓', text: 'PRIORITY_SUPPORT' }
      ],
      'Rare': [
        { icon: '✓', text: '+15% XP_BOOST' },
        { icon: '✓', text: 'RARE_SOUNDS' },
        { icon: '✓', text: 'PRIORITY_BATTLES' },
        { icon: '✓', text: 'CUSTOM_BADGE' }
      ],
      'Legendary': [
        { icon: '✓', text: '+25% XP_BOOST' },
        { icon: '✓', text: 'LEGENDARY_SOUNDS' },
        { icon: '✓', text: 'VIP_BATTLES' },
        { icon: '✓', text: 'EXCLUSIVE_BADGE' },
        { icon: '✓', text: 'GOVERNANCE_VOTE' }
      ]
    };

    return benefits[rarity] || benefits['Common'];
  }

  /**
   * Request airdrop for testnet (for testing only)
   */
  async requestAirdrop(walletAddress, amountInSOL = 1) {
    try {
      console.log(`💰 Requesting ${amountInSOL} SOL airdrop...`);

      const publicKey = new window.solanaWeb3.PublicKey(walletAddress);
      const lamports = amountInSOL * window.solanaWeb3.LAMPORTS_PER_SOL;

      const signature = await this.connection.requestAirdrop(publicKey, lamports);
      await this.connection.confirmTransaction(signature);

      console.log('✅ Airdrop successful!');
      return { success: true, signature };

    } catch (error) {
      console.error('❌ Airdrop failed:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get balance in SOL
   */
  async getBalance(walletAddress) {
    try {
      const publicKey = new window.solanaWeb3.PublicKey(walletAddress);
      const balance = await this.connection.getBalance(publicKey);
      const balanceInSOL = balance / window.solanaWeb3.LAMPORTS_PER_SOL;

      console.log(`💰 Balance: ${balanceInSOL} SOL`);
      return balanceInSOL;

    } catch (error) {
      console.error('❌ Failed to get balance:', error);
      return 0;
    }
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.SolanaNFTManager = SolanaNFTManager;
}
