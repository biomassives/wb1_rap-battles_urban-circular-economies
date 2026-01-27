/**
 * Crypto Manager
 * Handles encryption/decryption of sensitive data using Web Crypto API
 *
 * Features:
 * - AES-GCM 256-bit encryption
 * - PBKDF2 key derivation
 * - Random IV generation
 * - Salt management
 */

class CryptoManager {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.iterations = 100000; // PBKDF2 iterations
    this.saltKey = 'wb_crypto_salt';
  }

  /**
   * Initialize crypto manager and generate/retrieve salt
   */
  async initialize() {
    try {
      // Get or generate salt
      let salt = localStorage.getItem(this.saltKey);

      if (!salt) {
        // Generate new salt
        const saltBytes = crypto.getRandomValues(new Uint8Array(16));
        salt = this.arrayBufferToBase64(saltBytes);
        localStorage.setItem(this.saltKey, salt);
        console.log('🔐 Generated new encryption salt');
      }

      this.salt = this.base64ToArrayBuffer(salt);
      console.log('✅ Crypto Manager initialized');
      return true;
    } catch (error) {
      console.error('❌ Crypto initialization failed:', error);
      return false;
    }
  }

  /**
   * Derive encryption key from wallet address + salt
   */
  async deriveKey(walletAddress) {
    try {
      // Use wallet address as password
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(walletAddress);

      // Import password as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordData,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      // Derive AES key
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: this.salt,
          iterations: this.iterations,
          hash: 'SHA-256'
        },
        keyMaterial,
        {
          name: this.algorithm,
          length: this.keyLength
        },
        false,
        ['encrypt', 'decrypt']
      );

      return key;
    } catch (error) {
      console.error('❌ Key derivation failed:', error);
      throw error;
    }
  }

  /**
   * Encrypt data
   * @param {string} walletAddress - Wallet address to derive key
   * @param {string} data - Data to encrypt
   * @returns {string} Base64 encoded: IV + encrypted data
   */
  async encrypt(walletAddress, data) {
    try {
      if (!data) return null;

      const key = await this.deriveKey(walletAddress);

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt data
      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(data);

      const encryptedData = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        dataBytes
      );

      // Combine IV + encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedData), iv.length);

      // Return base64 encoded
      return this.arrayBufferToBase64(combined);
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt data
   * @param {string} walletAddress - Wallet address to derive key
   * @param {string} encryptedData - Base64 encoded encrypted data
   * @returns {string} Decrypted data
   */
  async decrypt(walletAddress, encryptedData) {
    try {
      if (!encryptedData) return null;

      const key = await this.deriveKey(walletAddress);

      // Decode base64
      const combined = this.base64ToArrayBuffer(encryptedData);

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      // Decrypt
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        data
      );

      // Convert to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      return null; // Return null instead of throwing for graceful degradation
    }
  }

  /**
   * Encrypt object (encrypts specified fields)
   */
  async encryptObject(walletAddress, obj, fieldsToEncrypt = []) {
    const encrypted = { ...obj };

    for (const field of fieldsToEncrypt) {
      if (obj[field]) {
        encrypted[`encrypted_${field}`] = await this.encrypt(walletAddress, obj[field]);
        delete encrypted[field]; // Remove plain text
      }
    }

    return encrypted;
  }

  /**
   * Decrypt object (decrypts encrypted_ fields)
   */
  async decryptObject(walletAddress, obj) {
    const decrypted = { ...obj };

    // Find all encrypted_ fields
    for (const key in obj) {
      if (key.startsWith('encrypted_')) {
        const originalField = key.replace('encrypted_', '');
        decrypted[originalField] = await this.decrypt(walletAddress, obj[key]);
        delete decrypted[key]; // Remove encrypted version
      }
    }

    return decrypted;
  }

  /**
   * Hash data (one-way, for verification)
   */
  async hash(data) {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Utility: ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Utility: Base64 to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Reset salt (use with caution - will make all encrypted data unreadable)
   */
  resetSalt() {
    localStorage.removeItem(this.saltKey);
    console.warn('🔓 Encryption salt reset - all encrypted data is now unreadable');
  }
}

// Create global instance
window.cryptoManager = new CryptoManager();

// Auto-initialize when DOM loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.cryptoManager.initialize();
  });
} else {
  window.cryptoManager.initialize();
}

console.log('🔐 Crypto Manager loaded');
