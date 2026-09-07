import { describe, expect, it } from 'vitest';
import { memoryMailer } from '../src/mail/memory.mailer';
import { mailgunMailer } from '../src/mail/mailgun.mailer';

describe('memoryMailer', () => {
  it('menyimpan pesan dan bisa direset', async () => {
    const mailer = memoryMailer();
    await mailer.send({ to: 'a@x.id', subject: 's', text: 't' });
    expect(mailer.messages).toHaveLength(1);
    expect(mailer.messages[0]).toMatchObject({ to: 'a@x.id', subject: 's', text: 't' });
    mailer.reset();
    expect(mailer.messages).toHaveLength(0);
  });
});

describe('mailgunMailer', () => {
  it('POST ke /v3/{domain}/messages dgn auth basic + form body', async () => {
    let captured: { url: string; init: RequestInit } | undefined;
    const fetchStub = async (url: string | URL | Request, init?: RequestInit) => {
      captured = { url: String(url), init: init ?? {} };
      return new Response(JSON.stringify({ id: 'x', message: 'Queued' }), { status: 200 });
    };

    const mailer = mailgunMailer({
      apiKey: 'key-secret',
      domain: 'mg.opensellvy.test',
      from: 'OpenSellvy <no-reply@mg.opensellvy.test>',
      fetch: fetchStub as typeof fetch,
    });

    await mailer.send({ to: 'u@x.id', subject: 'Kode', text: '123456', html: '<p>123456</p>' });

    expect(captured?.url).toBe('https://api.mailgun.net/v3/mg.opensellvy.test/messages');
    const headers = (captured?.init?.headers ?? {}) as Record<string, string>;
    const auth = headers.authorization ?? '';
    expect(auth.startsWith('Basic ')).toBe(true);
    expect(Buffer.from(auth.slice(6), 'base64').toString('utf8')).toBe('api:key-secret');
  });

  it('region EU memakai api.eu.mailgun.net; non-ok → error', async () => {
    const fetchStub = async () => new Response('rate limited', { status: 429 });
    const mailer = mailgunMailer({
      apiKey: 'k',
      domain: 'd',
      from: 'f',
      region: 'eu',
      fetch: fetchStub as typeof fetch,
    });
    await expect(mailer.send({ to: 'u@x.id', subject: 's', text: 't' })).rejects.toThrow(/429/);
  });
});