import { createHmac, createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';

export function hmacSign(secret: string, message: string, algorithm = 'sha256'): string {
  return createHmac(algorithm, secret).update(message).digest('hex');
}

export function sha256Hex(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

export function randomHex(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;

export interface CryptoOptions {
  key: string;
}

export class Crypto {
  private readonly key: Buffer;

  constructor(opts: CryptoOptions) {
    const raw = opts.key;
    this.key = /^[0-9a-f]{64}$/i.test(raw)
      ? Buffer.from(raw, 'hex')
      : createHash('sha256').update(raw).digest();
  }

  async encrypt(plain: string): Promise<string> {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGO, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
      iv.toString('base64'),
      tag.toString('base64'),
      encrypted.toString('base64'),
    ].join('.');
  }

  async decrypt(ciphertext: string): Promise<string> {
    const [ivB64, tagB64, dataB64] = ciphertext.split('.');
    if (!ivB64 || !tagB64 || !dataB64) {
      throw new Error('Invalid cipher format');
    }
    const decipher = createDecipheriv(ALGO, this.key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }
}