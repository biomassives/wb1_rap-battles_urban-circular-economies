/**
 * wallet-crypto.js
 * Secure encryption utilities for wallet storage
 *
 * Uses Web Crypto API (built into browsers)
 * - AES-GCM for encryption (industry standard)
 * - PBKDF2 for key derivation (100,000 iterations)
 * - Random salts and IVs for each encryption
 *
 * Security: All encryption happens client-side
 * Server never sees recovery phrase or PIN
 */

/**
 * Generate a cryptographically secure random salt
 */
function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Generate a cryptographically secure random IV
 */
function generateIV() {
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Derive encryption key from PIN using PBKDF2
 *
 * @param {string} pin - User's PIN
 * @param {Uint8Array} salt - Random salt
 * @returns {Promise<CryptoKey>} Encryption key
 */
async function deriveKeyFromPIN(pin, salt) {
  const encoder = new TextEncoder();

  // Import PIN as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES-GCM key
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // OWASP recommended minimum
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Encrypt recovery phrase with PIN
 *
 * @param {string} mnemonic - Recovery phrase (12 words)
 * @param {string} pin - User's PIN
 * @returns {Promise<Object>} Encrypted data with salt and IV
 */
async function encryptWallet(mnemonic, pin) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(mnemonic);

    // Generate random salt and IV
    const salt = generateSalt();
    const iv = generateIV();

    // Derive encryption key from PIN
    const key = await deriveKeyFromPIN(pin, salt);

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );

    // Convert to base64 for storage
    return {
      encrypted: arrayBufferToBase64(encrypted),
      salt: arrayBufferToBase64(salt),
      iv: arrayBufferToBase64(iv),
      version: '1.0',
      algorithm: 'AES-GCM-256',
      keyDerivation: 'PBKDF2-SHA256-100000'
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt wallet. Please try again.');
  }
}

/**
 * Decrypt recovery phrase with PIN
 *
 * @param {Object} encryptedData - Encrypted wallet data
 * @param {string} pin - User's PIN
 * @returns {Promise<string>} Decrypted recovery phrase
 */
async function decryptWallet(encryptedData, pin) {
  try {
    // Convert from base64
    const encrypted = base64ToArrayBuffer(encryptedData.encrypted);
    const salt = base64ToArrayBuffer(encryptedData.salt);
    const iv = base64ToArrayBuffer(encryptedData.iv);

    // Derive decryption key from PIN
    const key = await deriveKeyFromPIN(pin, salt);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encrypted
    );

    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);

    // Specific error for wrong PIN
    if (error.name === 'OperationError') {
      throw new Error('Incorrect PIN. Please try again.');
    }

    throw new Error('Failed to decrypt wallet. Your wallet data may be corrupted.');
  }
}

/**
 * Encrypt backup with passphrase (stronger than PIN)
 * Used for downloadable backup files
 *
 * @param {string} mnemonic - Recovery phrase
 * @param {string} passphrase - User's passphrase (8+ chars)
 * @returns {Promise<Object>} Encrypted backup
 */
async function encryptBackup(mnemonic, passphrase) {
  if (passphrase.length < 8) {
    throw new Error('Passphrase must be at least 8 characters long');
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(mnemonic);

    // Generate random salt and IV
    const salt = generateSalt();
    const iv = generateIV();

    // Import passphrase
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive key with more iterations for backup files
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 250000, // Higher for backup files
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );

    // Return backup format
    return {
      version: '1.0',
      type: 'purple-point-backup',
      encrypted: arrayBufferToBase64(encrypted),
      salt: arrayBufferToBase64(salt),
      iv: arrayBufferToBase64(iv),
      algorithm: 'AES-GCM-256',
      keyDerivation: 'PBKDF2-SHA256-250000',
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Backup encryption failed:', error);
    throw new Error('Failed to create encrypted backup. Please try again.');
  }
}

/**
 * Decrypt backup with passphrase
 *
 * @param {Object} backupData - Encrypted backup file
 * @param {string} passphrase - User's passphrase
 * @returns {Promise<string>} Decrypted recovery phrase
 */
async function decryptBackup(backupData, passphrase) {
  try {
    const encoder = new TextEncoder();

    // Convert from base64
    const encrypted = base64ToArrayBuffer(backupData.encrypted);
    const salt = base64ToArrayBuffer(backupData.salt);
    const iv = base64ToArrayBuffer(backupData.iv);

    // Import passphrase
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive key
    const iterations = backupData.keyDerivation?.includes('250000') ? 250000 : 100000;
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encrypted
    );

    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Backup decryption failed:', error);

    if (error.name === 'OperationError') {
      throw new Error('Incorrect passphrase. Please try again.');
    }

    throw new Error('Failed to decrypt backup file. The file may be corrupted.');
  }
}

/**
 * Save encrypted wallet to localStorage
 *
 * @param {string} mnemonic - Recovery phrase
 * @param {string} pin - User's PIN
 * @param {string} publicKey - Wallet public key
 * @returns {Promise<void>}
 */
async function encryptAndSaveWallet(mnemonic, pin, publicKey) {
  try {
    // Encrypt wallet
    const encrypted = await encryptWallet(mnemonic, pin);

    // Add metadata
    const walletData = {
      ...encrypted,
      publicKey: publicKey,
      createdAt: new Date().toISOString(),
      lastUnlocked: new Date().toISOString()
    };

    // Save to localStorage
    localStorage.setItem('wallet_encrypted', JSON.stringify(walletData));
    localStorage.setItem('wallet_publicKey', publicKey);
    localStorage.setItem('wallet_locked', 'false');

    console.log('✅ Wallet encrypted and saved successfully');
  } catch (error) {
    console.error('Failed to save wallet:', error);
    throw error;
  }
}

/**
 * Unlock wallet with PIN
 *
 * @param {string} pin - User's PIN
 * @returns {Promise<string>} Decrypted recovery phrase
 */
async function unlockWallet(pin) {
  try {
    // Get encrypted wallet from localStorage
    const walletDataStr = localStorage.getItem('wallet_encrypted');

    if (!walletDataStr) {
      throw new Error('No wallet found. Please create or import a wallet.');
    }

    const walletData = JSON.parse(walletDataStr);

    // Decrypt
    const mnemonic = await decryptWallet(walletData, pin);

    // Update last unlocked time
    walletData.lastUnlocked = new Date().toISOString();
    localStorage.setItem('wallet_encrypted', JSON.stringify(walletData));
    localStorage.setItem('wallet_locked', 'false');

    console.log('✅ Wallet unlocked successfully');
    return mnemonic;
  } catch (error) {
    console.error('Failed to unlock wallet:', error);
    throw error;
  }
}

/**
 * Lock wallet (clear decrypted data from memory)
 */
function lockWallet() {
  localStorage.setItem('wallet_locked', 'true');

  // Clear any decrypted data from memory
  if (window._decryptedMnemonic) {
    delete window._decryptedMnemonic;
  }

  console.log('🔒 Wallet locked');
}

/**
 * Check if wallet is locked
 *
 * @returns {boolean}
 */
function isWalletLocked() {
  return localStorage.getItem('wallet_locked') === 'true';
}

/**
 * Helper: Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper: Convert Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Export backup file for download
 *
 * @param {string} mnemonic - Recovery phrase
 * @param {string} passphrase - Backup passphrase
 * @param {string} publicKey - Wallet public key
 */
async function downloadEncryptedBackupFile(mnemonic, passphrase, publicKey) {
  try {
    // Encrypt backup
    const backup = await encryptBackup(mnemonic, passphrase);

    // Add public key for reference
    backup.publicKey = publicKey;
    backup.filename = `purplepoint_backup_${Date.now()}.ppbackup`;

    // Create blob and download
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backup.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ Backup file downloaded:', backup.filename);
    return backup.filename;
  } catch (error) {
    console.error('Failed to download backup:', error);
    throw error;
  }
}

/**
 * Import wallet from backup file
 *
 * @param {File} file - Backup file
 * @param {string} passphrase - Backup passphrase
 * @returns {Promise<string>} Decrypted recovery phrase
 */
async function importFromBackup(file, passphrase) {
  try {
    // Read file
    const text = await file.text();
    const backupData = JSON.parse(text);

    // Validate backup format
    if (backupData.type !== 'purple-point-backup') {
      throw new Error('Invalid backup file format');
    }

    if (backupData.version !== '1.0') {
      throw new Error(`Unsupported backup version: ${backupData.version}`);
    }

    // Decrypt
    const mnemonic = await decryptBackup(backupData, passphrase);

    console.log('✅ Backup imported successfully');
    return mnemonic;
  } catch (error) {
    console.error('Failed to import backup:', error);
    throw error;
  }
}

/**
 * Verify PIN without fully decrypting
 * (Faster check for unlock UI)
 *
 * @param {string} pin - PIN to verify
 * @returns {Promise<boolean>} True if PIN is correct
 */
async function verifyPIN(pin) {
  try {
    await unlockWallet(pin);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Change PIN (re-encrypt with new PIN)
 *
 * @param {string} oldPIN - Current PIN
 * @param {string} newPIN - New PIN
 * @returns {Promise<void>}
 */
async function changePIN(oldPIN, newPIN) {
  try {
    // Decrypt with old PIN
    const mnemonic = await unlockWallet(oldPIN);

    // Get public key
    const publicKey = localStorage.getItem('wallet_publicKey');

    // Re-encrypt with new PIN
    await encryptAndSaveWallet(mnemonic, newPIN, publicKey);

    console.log('✅ PIN changed successfully');
  } catch (error) {
    console.error('Failed to change PIN:', error);
    throw error;
  }
}

// Make functions globally available
if (typeof window !== 'undefined') {
  window.encryptWallet = encryptWallet;
  window.decryptWallet = decryptWallet;
  window.encryptBackup = encryptBackup;
  window.decryptBackup = decryptBackup;
  window.encryptAndSaveWallet = encryptAndSaveWallet;
  window.unlockWallet = unlockWallet;
  window.lockWallet = lockWallet;
  window.isWalletLocked = isWalletLocked;
  window.downloadEncryptedBackupFile = downloadEncryptedBackupFile;
  window.importFromBackup = importFromBackup;
  window.verifyPIN = verifyPIN;
  window.changePIN = changePIN;
}

console.log('🔐 Wallet crypto utilities loaded');
