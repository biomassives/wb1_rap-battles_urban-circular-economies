/**
 * E8 Lattice Oracle - Proof of Concept
 * Post-Quantum Secure LocalStorage Encryption
 *
 * This is a simplified demonstration of the concepts.
 * Production version would use optimized lattice libraries.
 */

class E8Point {
  /**
   * Represents a point in the E8 lattice
   * E8 is an 8-dimensional lattice with special properties
   */
  constructor(coords) {
    if (coords.length !== 8) {
      throw new Error('E8 point must have exactly 8 coordinates');
    }
    this.coords = coords;
  }

  /**
   * Check if point is valid E8 lattice point
   * Constraint: all coords are integers or half-integers, and sum is even
   */
  isValid() {
    const allIntegers = this.coords.every(x => Number.isInteger(x * 2));
    const sumEven = Number.isInteger(this.coords.reduce((a, b) => a + b, 0));
    return allIntegers && sumEven;
  }

  /**
   * Euclidean norm (distance from origin)
   */
  norm() {
    return Math.sqrt(this.coords.reduce((sum, x) => sum + x * x, 0));
  }

  /**
   * Add two E8 points
   */
  add(other) {
    return new E8Point(
      this.coords.map((x, i) => x + other.coords[i])
    );
  }

  /**
   * Subtract two E8 points
   */
  subtract(other) {
    return new E8Point(
      this.coords.map((x, i) => x - other.coords[i])
    );
  }

  /**
   * Scalar multiplication
   */
  scale(scalar) {
    return new E8Point(
      this.coords.map(x => x * scalar)
    );
  }

  /**
   * Dot product with another point
   */
  dot(other) {
    return this.coords.reduce((sum, x, i) => sum + x * other.coords[i], 0);
  }

  /**
   * Serialize to bytes
   */
  toBytes() {
    const buffer = new ArrayBuffer(8 * 8); // 8 doubles
    const view = new Float64Array(buffer);
    this.coords.forEach((coord, i) => view[i] = coord);
    return new Uint8Array(buffer);
  }

  /**
   * Deserialize from bytes
   */
  static fromBytes(bytes) {
    const view = new Float64Array(bytes.buffer);
    return new E8Point(Array.from(view).slice(0, 8));
  }

  toString() {
    return `E8(${this.coords.map(x => x.toFixed(1)).join(', ')})`;
  }
}

class E8KeyPair {
  /**
   * Generate a new E8 lattice key pair
   */
  static generate() {
    // Private key: random E8 lattice point
    const privateKey = this.randomLatticePoint();

    // Public key: derived using lattice basis
    const publicKey = this.computePublicKey(privateKey);

    return {
      privateKey,
      publicKey,
      timestamp: Date.now()
    };
  }

  /**
   * Generate random valid E8 lattice point
   */
  static randomLatticePoint() {
    // Generate 7 random coordinates
    const coords = new Array(7).fill(0).map(() => {
      const isHalf = Math.random() > 0.5;
      const value = Math.floor(Math.random() * 128) - 64; // -64 to 63
      return isHalf ? value + 0.5 : value;
    });

    // Calculate 8th coordinate to ensure sum is even
    const sum = coords.reduce((a, b) => a + b, 0);
    const needsHalf = !Number.isInteger(sum);
    coords.push(needsHalf ? 0.5 : 0);

    return new E8Point(coords);
  }

  /**
   * Compute public key from private key
   * publicKey = A * privateKey + error
   */
  static computePublicKey(privateKey) {
    // Simplified: use identity matrix + small perturbation
    // Production would use actual E8 basis matrix
    const noise = new Array(8).fill(0).map(() =>
      (Math.random() - 0.5) * 0.1 // Small Gaussian-like noise
    );

    return new E8Point(
      privateKey.coords.map((x, i) => x + noise[i])
    );
  }
}

class E8Encryptor {
  /**
   * Encrypt data using E8 lattice cryptography
   */
  async encrypt(plaintext, publicKey) {
    // 1. Convert data to bytes
    const encoder = new TextEncoder();
    const bytes = encoder.encode(JSON.stringify(plaintext));

    // 2. Convert bytes to E8 lattice points (8 bytes per point)
    const points = this.bytesToLatticePoints(bytes);

    // 3. Encrypt each point
    const encrypted = points.map(point => {
      // Generate random lattice point (ephemeral key)
      const ephemeral = E8KeyPair.randomLatticePoint();

      // c1 = ephemeral
      const c1 = ephemeral;

      // c2 = publicKey * ephemeral + point
      // Simplified: just add (in production, use proper multiplication)
      const c2 = publicKey.add(ephemeral).add(point);

      return { c1, c2 };
    });

    // 4. Serialize
    return this.serializeCiphertext(encrypted);
  }

  /**
   * Decrypt data using E8 lattice cryptography
   */
  async decrypt(ciphertext, privateKey) {
    // 1. Deserialize
    const encrypted = this.deserializeCiphertext(ciphertext);

    // 2. Decrypt each point
    const points = encrypted.map(({ c1, c2 }) => {
      // message = c2 - privateKey
      // Simplified: subtract (in production, use proper operations)
      return c2.subtract(c1).subtract(privateKey);
    });

    // 3. Convert points back to bytes
    const bytes = this.latticePointsToBytes(points);

    // 4. Decode to string
    const decoder = new TextDecoder();
    const json = decoder.decode(bytes);

    return JSON.parse(json);
  }

  /**
   * Convert bytes to E8 lattice points
   */
  bytesToLatticePoints(bytes) {
    const points = [];

    for (let i = 0; i < bytes.length; i += 8) {
      // Take 8 bytes at a time
      const chunk = new Array(8);
      for (let j = 0; j < 8; j++) {
        chunk[j] = i + j < bytes.length ? bytes[i + j] : 0;
      }

      // Convert to E8 point (ensure valid lattice point)
      const sum = chunk.reduce((a, b) => a + b, 0);
      if (sum % 2 !== 0) chunk[7] += 1; // Make sum even

      points.push(new E8Point(chunk));
    }

    return points;
  }

  /**
   * Convert E8 lattice points back to bytes
   */
  latticePointsToBytes(points) {
    const allBytes = [];

    for (const point of points) {
      // Round coordinates to integers and clamp to byte range
      const bytes = point.coords.map(x => {
        const rounded = Math.round(x);
        return Math.max(0, Math.min(255, rounded));
      });
      allBytes.push(...bytes);
    }

    return new Uint8Array(allBytes);
  }

  /**
   * Serialize ciphertext to base64
   */
  serializeCiphertext(encrypted) {
    const data = {
      points: encrypted.map(({ c1, c2 }) => ({
        c1: c1.coords,
        c2: c2.coords
      })),
      version: '1.0',
      algorithm: 'E8-LATTICE'
    };

    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json);
    return btoa(String.fromCharCode(...bytes));
  }

  /**
   * Deserialize ciphertext from base64
   */
  deserializeCiphertext(base64) {
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const data = JSON.parse(json);

    return data.points.map(({ c1, c2 }) => ({
      c1: new E8Point(c1),
      c2: new E8Point(c2)
    }));
  }
}

class ConsentToken {
  /**
   * Represents user's data consent preferences
   */
  constructor(owner, permissions = {}) {
    this.owner = owner;
    this.tokenId = this.generateTokenId();
    this.permissions = {
      readXP: permissions.readXP || false,
      readMusic: permissions.readMusic || false,
      readEnvironmental: permissions.readEnvironmental || false,
      readKakuma: permissions.readKakuma || false,
      writeOracle: permissions.writeOracle || false,
      zkProve: permissions.zkProve || false,
      aggregate: permissions.aggregate || false,
      transferCustody: permissions.transferCustody || false
    };
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }

  generateTokenId() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check if a specific permission is granted
   */
  hasPermission(permission) {
    return this.permissions[permission] === true;
  }

  /**
   * Grant a permission
   */
  grantPermission(permission) {
    if (permission in this.permissions) {
      this.permissions[permission] = true;
      this.updatedAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Revoke a permission
   */
  revokePermission(permission) {
    if (permission in this.permissions) {
      this.permissions[permission] = false;
      this.updatedAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      owner: this.owner,
      tokenId: this.tokenId,
      permissions: this.permissions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Load from JSON
   */
  static fromJSON(data) {
    const token = new ConsentToken(data.owner, data.permissions);
    token.tokenId = data.tokenId;
    token.createdAt = data.createdAt;
    token.updatedAt = data.updatedAt;
    return token;
  }
}

class SecureLocalStorage {
  /**
   * Encrypted localStorage wrapper using E8 lattice
   */
  constructor() {
    this.encryptor = new E8Encryptor();
    this.keyPair = null;
    this.consentToken = null;
  }

  /**
   * Initialize with wallet address
   */
  async initialize(walletAddress, password = null) {
    // Load or generate E8 key pair
    const storedKeys = localStorage.getItem(`e8_keys_${walletAddress}`);

    if (storedKeys) {
      // Decrypt stored keys (simplified - production would use password)
      this.keyPair = JSON.parse(storedKeys);
      this.keyPair.privateKey = new E8Point(this.keyPair.privateKey.coords);
      this.keyPair.publicKey = new E8Point(this.keyPair.publicKey.coords);
    } else {
      // Generate new key pair
      this.keyPair = E8KeyPair.generate();

      // Store (in production, encrypt with password)
      localStorage.setItem(`e8_keys_${walletAddress}`, JSON.stringify({
        privateKey: this.keyPair.privateKey,
        publicKey: this.keyPair.publicKey,
        timestamp: this.keyPair.timestamp
      }));
    }

    // Load or create consent token
    const storedConsent = localStorage.getItem(`consent_${walletAddress}`);
    if (storedConsent) {
      this.consentToken = ConsentToken.fromJSON(JSON.parse(storedConsent));
    } else {
      // Create default consent token
      this.consentToken = new ConsentToken(walletAddress, {
        readXP: true,
        zkProve: true
      });
      localStorage.setItem(`consent_${walletAddress}`, JSON.stringify(this.consentToken));
    }

    console.log('✅ E8 Lattice Oracle initialized');
    console.log('🔑 Public Key:', this.keyPair.publicKey.toString());
    console.log('🎫 Consent Token:', this.consentToken.tokenId);
  }

  /**
   * Securely store data
   */
  async setItem(key, value) {
    if (!this.keyPair) {
      throw new Error('Not initialized');
    }

    // Encrypt data
    const encrypted = await this.encryptor.encrypt(value, this.keyPair.publicKey);

    // Store encrypted
    localStorage.setItem(`encrypted_${key}`, encrypted);

    console.log(`🔒 Encrypted and stored: ${key}`);
  }

  /**
   * Securely retrieve data
   */
  async getItem(key) {
    if (!this.keyPair) {
      throw new Error('Not initialized');
    }

    // Get encrypted data
    const encrypted = localStorage.getItem(`encrypted_${key}`);
    if (!encrypted) return null;

    // Decrypt data
    const decrypted = await this.encryptor.decrypt(encrypted, this.keyPair.privateKey);

    console.log(`🔓 Decrypted and retrieved: ${key}`);
    return decrypted;
  }

  /**
   * Migrate existing plaintext data to encrypted
   */
  async migrateData(walletAddress) {
    console.log('🔄 Migrating plaintext data to E8 encrypted...');

    // Get existing progress data
    const existingKey = `progress_${walletAddress}`;
    const existingData = localStorage.getItem(existingKey);

    if (existingData) {
      const data = JSON.parse(existingData);

      // Encrypt and store
      await this.setItem(existingKey, data);

      // Optionally remove plaintext (or keep as backup during transition)
      // localStorage.removeItem(existingKey);

      console.log('✅ Migration complete');
    }
  }

  /**
   * Generate zero-knowledge proof
   * Proves a fact about data without revealing the data
   */
  async generateZKProof(proofType, threshold) {
    if (!this.consentToken.hasPermission('zkProve')) {
      throw new Error('ZK proof generation not consented');
    }

    // Get encrypted data
    const walletAddress = this.consentToken.owner;
    const data = await this.getItem(`progress_${walletAddress}`);

    switch (proofType) {
      case 'XP_ABOVE':
        return this.proveXPAbove(data, threshold);

      case 'LEVEL_EQUALS':
        return this.proveLevelEquals(data, threshold);

      case 'HAS_ACHIEVEMENT':
        return this.proveHasAchievement(data, threshold);

      default:
        throw new Error('Unknown proof type');
    }
  }

  /**
   * Prove XP is above threshold without revealing actual XP
   */
  async proveXPAbove(data, threshold) {
    const actualXP = data.progression.totalXP;
    const isAbove = actualXP >= threshold;

    // Generate commitment (simplified)
    const randomness = Math.random() * 1000000;
    const commitment = this.hash(actualXP + randomness);

    // In production, this would be a proper zero-knowledge proof
    // For demo, we just return a boolean with commitment
    return {
      proofType: 'XP_ABOVE',
      threshold: threshold,
      result: isAbove,
      commitment: commitment,
      timestamp: Date.now(),
      // In production, include cryptographic proof that commitment is valid
      proof: this.hash(`${commitment}:${isAbove}:${randomness}`)
    };
  }

  /**
   * Prove level equals specific value
   */
  async proveLevelEquals(data, targetLevel) {
    const actualLevel = data.progression.currentLevel;
    const equals = actualLevel === targetLevel;

    const randomness = Math.random() * 1000000;
    const commitment = this.hash(actualLevel + randomness);

    return {
      proofType: 'LEVEL_EQUALS',
      targetLevel: targetLevel,
      result: equals,
      commitment: commitment,
      timestamp: Date.now(),
      proof: this.hash(`${commitment}:${equals}:${randomness}`)
    };
  }

  /**
   * Prove user has specific achievement
   */
  async proveHasAchievement(data, achievementName) {
    const hasAchievement = data.achievements.unlocked.some(
      a => a.achievement_name === achievementName
    );

    const randomness = Math.random() * 1000000;
    const commitment = this.hash(achievementName + randomness);

    return {
      proofType: 'HAS_ACHIEVEMENT',
      achievement: achievementName,
      result: hasAchievement,
      commitment: commitment,
      timestamp: Date.now(),
      proof: this.hash(`${commitment}:${hasAchievement}:${randomness}`)
    };
  }

  /**
   * Simple hash function (use crypto.subtle.digest in production)
   */
  hash(data) {
    let hash = 0;
    const str = data.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

// Global instance
window.secureStorage = new SecureLocalStorage();

console.log('🔐 E8 Lattice Oracle loaded!');
console.log('📚 Usage:');
console.log('  await secureStorage.initialize(walletAddress)');
console.log('  await secureStorage.setItem(key, value)');
console.log('  await secureStorage.getItem(key)');
console.log('  await secureStorage.generateZKProof("XP_ABOVE", 1000)');
