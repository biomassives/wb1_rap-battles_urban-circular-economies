/**
 * wallet-generator.js
 * Generate and manage Solana wallets using BIP39
 *
 * Features:
 * - BIP39 mnemonic generation (12 words)
 * - Solana keypair derivation
 * - Integration with encryption utilities
 * - User-friendly flow
 */

// Import note: These libraries should be loaded via CDN in BaseLayout or installed via npm
// For now, we'll use the npm-installed versions

/**
 * Generate a new Solana wallet with BIP39 mnemonic
 *
 * @returns {Promise<Object>} Wallet data {mnemonic, publicKey, secretKey}
 */
async function generateNewSolanaWallet() {
  try {
    // Generate 12-word mnemonic (128 bits of entropy)
    const bip39 = window.bip39;
    if (!bip39) {
      throw new Error('BIP39 library not loaded. Please refresh the page.');
    }

    const mnemonic = bip39.generateMnemonic(128); // 12 words
    const words = mnemonic.split(' ');

    // Validate mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Generated invalid mnemonic. Please try again.');
    }

    // Derive seed from mnemonic
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Create Solana keypair from seed
    const solanaWeb3 = window.solanaWeb3;
    if (!solanaWeb3) {
      throw new Error('Solana Web3 library not loaded. Please refresh the page.');
    }

    const keypair = solanaWeb3.Keypair.fromSeed(seed.slice(0, 32));
    const publicKey = keypair.publicKey.toString();

    console.log('✅ New Solana wallet generated');
    console.log('Public Key:', publicKey);

    return {
      mnemonic,
      words,
      publicKey,
      secretKey: Array.from(keypair.secretKey), // For storage
      keypair // For immediate use
    };
  } catch (error) {
    console.error('Wallet generation failed:', error);
    throw error;
  }
}

/**
 * Import wallet from recovery phrase
 *
 * @param {string} mnemonic - Recovery phrase (12 or 24 words)
 * @returns {Promise<Object>} Wallet data
 */
async function importWalletFromMnemonic(mnemonic) {
  try {
    const bip39 = window.bip39;
    if (!bip39) {
      throw new Error('BIP39 library not loaded. Please refresh the page.');
    }

    // Validate mnemonic
    const cleanMnemonic = mnemonic.trim().toLowerCase();
    if (!bip39.validateMnemonic(cleanMnemonic)) {
      throw new Error('Invalid recovery phrase. Please check your words and try again.');
    }

    // Derive seed
    const seed = await bip39.mnemonicToSeed(cleanMnemonic);

    // Create keypair
    const solanaWeb3 = window.solanaWeb3;
    if (!solanaWeb3) {
      throw new Error('Solana Web3 library not loaded. Please refresh the page.');
    }

    const keypair = solanaWeb3.Keypair.fromSeed(seed.slice(0, 32));
    const publicKey = keypair.publicKey.toString();

    console.log('✅ Wallet imported successfully');
    console.log('Public Key:', publicKey);

    return {
      mnemonic: cleanMnemonic,
      words: cleanMnemonic.split(' '),
      publicKey,
      secretKey: Array.from(keypair.secretKey),
      keypair
    };
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

/**
 * Complete new wallet creation flow
 * Shows education → generates wallet → shows recovery phrase → verifies → creates PIN → encrypts
 */
async function startNewWalletFlow() {
  try {
    // Check if security education is completed
    const educationCompleted = localStorage.getItem('securityEducationCompleted');

    if (!educationCompleted) {
      // Show security education first
      if (window.showSecurityEducation) {
        window.showSecurityEducation();
      } else {
        console.error('Security education modal not loaded');
        alert('Please refresh the page and try again.');
      }
      return;
    }

    // Generate new wallet
    await window.generateNewWallet();
  } catch (error) {
    console.error('Wallet flow failed:', error);
    alert('Failed to start wallet creation. Please try again.');
  }
}

/**
 * Generate and display new wallet
 * Called after security education is complete
 */
window.generateNewWallet = async function() {
  try {
    console.log('🔐 Generating new wallet...');

    // Generate wallet
    const wallet = await generateNewSolanaWallet();

    // Store temporarily for the flow
    window._currentWallet = wallet;
    window._recoveryWords = wallet.words;

    // Show recovery phrase modal
    if (window.showRecoveryPhraseModal) {
      window.showRecoveryPhraseModal(wallet.words);
    } else {
      console.error('Recovery phrase modal not loaded');
      alert('Component not loaded. Please refresh and try again.');
    }
  } catch (error) {
    console.error('Wallet generation failed:', error);
    alert(`Failed to generate wallet: ${error.message}`);
  }
};

/**
 * Import wallet flow
 * Shows import UI → validates phrase → creates PIN → encrypts
 */
window.startImportWalletFlow = async function() {
  try {
    const mnemonic = prompt(
      'Enter your 12-word recovery phrase:\n(Separate words with spaces)',
      ''
    );

    if (!mnemonic) {
      return; // User cancelled
    }

    // Show loading
    console.log('🔐 Importing wallet...');

    // Import wallet
    const wallet = await importWalletFromMnemonic(mnemonic);

    // Store temporarily
    window._currentWallet = wallet;
    window._recoveryWords = wallet.words;

    alert(`✅ Wallet imported successfully!\n\nPublic Key:\n${wallet.publicKey.slice(0, 8)}...${wallet.publicKey.slice(-8)}`);

    // Show PIN setup directly (skip verification since they already have the phrase)
    if (window.showPINSetup) {
      window.showPINSetup();
    }
  } catch (error) {
    console.error('Import failed:', error);
    alert(`Failed to import wallet: ${error.message}`);
  }
};

/**
 * Finalize wallet setup after PIN is created
 * Encrypts and saves wallet data
 *
 * @param {string} mnemonic - Recovery phrase
 * @param {string} pin - User's PIN
 */
window.finalizeWalletSetup = async function(mnemonic, pin) {
  try {
    const wallet = window._currentWallet;

    if (!wallet) {
      throw new Error('Wallet data not found. Please start over.');
    }

    console.log('🔐 Finalizing wallet setup...');

    // Encrypt and save wallet
    await window.encryptAndSaveWallet(mnemonic, pin, wallet.publicKey);

    // Update WalletManager
    if (window.walletManager) {
      window.walletManager.connectedWallet = wallet.publicKey;
      window.walletManager.walletType = 'Purple Point Wallet';
      window.walletManager.isAnonymous = false;
      window.walletManager.updateUI();

      // Replace anonymous wallet if exists
      const anonWallet = localStorage.getItem('anonymousWallet');
      if (anonWallet) {
        await window.walletManager.claimAnonymousWallet(wallet.publicKey);
      }
    }

    // Clean up temporary data
    delete window._currentWallet;
    delete window._recoveryWords;

    // Mark wallet as created
    localStorage.setItem('walletCreated', 'true');

    console.log('✅ Wallet setup complete!');

    // Award XP
    if (window.progressManager) {
      window.progressManager.awardXP(200, 'wallet_created', 'Created secure wallet');
    }

    return wallet.publicKey;
  } catch (error) {
    console.error('Wallet finalization failed:', error);
    throw error;
  }
};

/**
 * Get current wallet balance (Solana devnet/mainnet)
 *
 * @param {string} publicKey - Wallet public key
 * @returns {Promise<number>} Balance in SOL
 */
async function getWalletBalance(publicKey) {
  try {
    const solanaWeb3 = window.solanaWeb3;
    if (!solanaWeb3) {
      throw new Error('Solana Web3 not loaded');
    }

    // Connect to devnet (change to mainnet-beta for production)
    const connection = new solanaWeb3.Connection(
      solanaWeb3.clusterApiUrl('devnet'),
      'confirmed'
    );

    const pubkey = new solanaWeb3.PublicKey(publicKey);
    const balance = await connection.getBalance(pubkey);

    // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
    const balanceInSOL = balance / solanaWeb3.LAMPORTS_PER_SOL;

    return balanceInSOL;
  } catch (error) {
    console.error('Failed to get balance:', error);
    return 0;
  }
}

/**
 * Check if user has a wallet
 *
 * @returns {boolean}
 */
function hasWallet() {
  const encrypted = localStorage.getItem('wallet_encrypted');
  const publicKey = localStorage.getItem('wallet_publicKey');
  return !!(encrypted && publicKey);
}

/**
 * Get wallet public key without unlocking
 *
 * @returns {string|null}
 */
function getWalletPublicKey() {
  return localStorage.getItem('wallet_publicKey');
}

/**
 * Delete wallet (use with caution!)
 *
 * @param {string} confirmPhrase - User must type "DELETE MY WALLET"
 * @returns {boolean} Success
 */
function deleteWallet(confirmPhrase) {
  if (confirmPhrase !== 'DELETE MY WALLET') {
    console.error('Invalid confirmation phrase');
    return false;
  }

  try {
    localStorage.removeItem('wallet_encrypted');
    localStorage.removeItem('wallet_publicKey');
    localStorage.removeItem('wallet_locked');
    localStorage.removeItem('walletCreated');

    console.log('⚠️ Wallet deleted');
    return true;
  } catch (error) {
    console.error('Failed to delete wallet:', error);
    return false;
  }
}

// Make functions globally available
if (typeof window !== 'undefined') {
  window.generateNewSolanaWallet = generateNewSolanaWallet;
  window.importWalletFromMnemonic = importWalletFromMnemonic;
  window.startNewWalletFlow = startNewWalletFlow;
  window.getWalletBalance = getWalletBalance;
  window.hasWallet = hasWallet;
  window.getWalletPublicKey = getWalletPublicKey;
  window.deleteWallet = deleteWallet;
}

console.log('💼 Wallet generator loaded');
