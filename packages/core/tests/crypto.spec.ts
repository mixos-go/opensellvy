import { describe, expect, it } from 'vitest';
import { Crypto, hmacSign, sha256Hex, randomHex } from '../src/crypto';

describe('crypto', () => {
  it('hmacSign deterministik per secret', () => {
    const a = hmacSign('secret', 'msg');
    expect(a).toBe(hmacSign('secret', 'msg'));
    expect(a).not.toBe(hmacSign('other', 'msg'));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('sha256Hex menghasilkan 64-hex', () => {
    expect(sha256Hex('abc')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('randomHex panjang sesuai bytes', () => {
    expect(randomHex(16)).toHaveLength(32);
    expect(randomHex()).toHaveLength(64);
    expect(randomHex(16)).not.toBe(randomHex(16));
  });

  it('Crypto encrypt/decrypt round-trip', async () => {
    const crypto = new Crypto({ key: 'my-secret-key' });
    const ct = await crypto.encrypt('rahasia');
    expect(ct).not.toContain('rahasia');
    await expect(crypto.decrypt(ct)).resolves.toBe('rahasia');
  });

  it('Crypto menolak ciphertext tidak valid', async () => {
    const crypto = new Crypto({ key: 'my-secret-key' });
    await expect(crypto.decrypt('garbage')).rejects.toThrow('Invalid cipher');
  });
});
