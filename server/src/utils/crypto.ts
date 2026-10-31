import crypto from 'node:crypto';

/**
 * Computes SHA-256 hash in hex format.
 */
export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Constant-time string comparison preventing timing attacks.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Simple CRC32 implementation for API key checksum validation.
 */
export function crc32(str: string): string {
  let crc = 0 ^ -1;
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ str.charCodeAt(i)) & 0xff];
  }
  return ((crc ^ -1) >>> 0).toString(16).padStart(8, '0');
}

const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC32_TABLE[i] = c;
}

/**
 * Generates an API key: mzn_{env}_{prefix}_{random}_{crc32}
 */
export function generateApiKey(env: 'live' | 'test' = 'live'): {
  key: string;
  keyPrefix: string;
  keyHash: string;
} {
  const prefix = crypto.randomBytes(4).toString('hex'); // 8 chars
  const randomPart = crypto.randomBytes(16).toString('hex'); // 32 chars
  const payloadToChecksum = `${env}_${prefix}_${randomPart}`;
  const checksum = crc32(payloadToChecksum);

  const key = `mzn_${env}_${prefix}_${randomPart}_${checksum}`;
  const keyHash = sha256(key);

  return {
    key,
    keyPrefix: `mzn_${env}_${prefix}`,
    keyHash,
  };
}

/**
 * Validates API key format and CRC32 checksum before database hit.
 */
export function validateApiKeyChecksum(key: string): boolean {
  if (!key.startsWith('mzn_')) return false;
  const parts = key.split('_');
  if (parts.length !== 5) return false;
  const [, env, prefix, randomPart, checksum] = parts;
  const computed = crc32(`${env}_${prefix}_${randomPart}`);
  return constantTimeCompare(computed, checksum);
}

/**
 * AES-256-GCM authenticated encryption for webhook secrets at rest.
 */
export function encryptSecret(plaintext: string, masterKeyHex: string): string {
  const masterKey = Buffer.from(masterKeyHex.padEnd(64, '0').slice(0, 64), 'hex'); // 32 bytes
  const iv = crypto.randomBytes(12); // 96 bits recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Return formatted as: iv:authTag:encrypted (base64 encoded)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * AES-256-GCM authenticated decryption for webhook secrets.
 */
export function decryptSecret(encryptedPayload: string, masterKeyHex: string): string {
  const [ivB64, authTagB64, dataB64] = encryptedPayload.split(':');
  if (!ivB64 || !authTagB64 || !dataB64) {
    throw new Error('Invalid encrypted payload format');
  }

  const masterKey = Buffer.from(masterKeyHex.padEnd(64, '0').slice(0, 64), 'hex');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const encrypted = Buffer.from(dataB64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Generates an expiring public share link token.
 */
export function generateShareToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString('base64url');
  return {
    token,
    tokenHash: sha256(token),
  };
}

/**
 * Computes HMAC-SHA256 signature.
 */
export function signHmac(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}
