import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';

const N = 16384; // 2^14
const R = 8;
const P = 1;
const KEY_LEN = 64;

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, encoded: string): Promise<boolean>;
}

/**
 * Password hashing scrypt dengan salt acak.
 * Format: `scrypt$<N>$<r>$<p>$<saltB64>$<hashB64>` — self-describing, mudah upgrade param.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await derive(password, salt, N, R, P, KEY_LEN);
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const parts = encoded.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  const expected = Buffer.from(parts[5]!, 'base64');
  const derived = await derive(password, Buffer.from(parts[4]!, 'base64'), n, r, p, expected.length);
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export function createPasswordHasher(): PasswordHasher {
  return {
    hash: hashPassword,
    verify: verifyPassword,
  };
}

function derive(password: string, salt: Buffer, n: number, r: number, p: number, keyLen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLen, { N: n, r, p }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}