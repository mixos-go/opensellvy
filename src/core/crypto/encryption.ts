export class Crypto {
  async encrypt(plain: string): Promise<string> {
    return `enc:${Buffer.from(plain).toString('base64')}`;
  }

  async decrypt(cipher: string): Promise<string> {
    return Buffer.from(cipher.replace(/^enc:/, ''), 'base64').toString('utf8');
  }
}
