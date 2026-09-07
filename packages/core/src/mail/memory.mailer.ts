import type { MailMessage, Mailer } from './mailer';

export interface MemoryMailer extends Mailer {
  /** Email yang sudah "terkirim" (mode dev/test). */
  messages: MailMessage[];
  reset(): void;
}

/** Mailer in-memory — tidak benar-benar mengirim; dipakai dev & test. */
export function memoryMailer(): MemoryMailer {
  const messages: MailMessage[] = [];
  return {
    messages,
    async send(message) {
      messages.push(message);
    },
    reset() {
      messages.length = 0;
    },
  };
}