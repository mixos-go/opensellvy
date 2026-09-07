import type { MailMessage, Mailer } from './mailer';

export interface MailgunMailerConfig {
  apiKey: string;
  domain: string;
  from: string;
  /** region API (default 'us') — EU memakai api.eu.mailgun.net */
  region?: 'us' | 'eu';
  /** injectable fetch (test tanpa network) */
  fetch?: typeof fetch;
}

/**
 * Mailer via Mailgun HTTP API (`POST /v3/{domain}/messages`).
 * Tanpa SMTP relay / port 25 — outbound hanya HTTPS ke provider.
 */
export function mailgunMailer(config: MailgunMailerConfig): Mailer {
  const base = config.region === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net';
  const http = config.fetch ?? globalThis.fetch;
  return {
    async send(message: MailMessage) {
      const body = new FormData();
      body.set('from', config.from);
      body.set('to', message.to);
      body.set('subject', message.subject);
      body.set('text', message.text);
      if (message.html !== undefined) body.set('html', message.html);

      const res = await http(`${base}/v3/${config.domain}/messages`, {
        method: 'POST',
        headers: {
          authorization: `Basic ${Buffer.from(`api:${config.apiKey}`).toString('base64')}`,
        },
        body,
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Mailgun ${res.status}: ${detail}`);
      }
    },
  };
}