import type { MailMessage } from '@opensellvy/core';
import type { OtpPurpose } from '@opensellvy/core';

const OTP_TTL_MINUTES = 10;

export function renderOtpEmail(email: string, code: string, purpose: OtpPurpose): MailMessage {
  const label = purpose === '2fa' ? 'Kode masuk dua langkah' : purpose === 'verify_email' ? 'Verifikasi email' : 'Kode masuk';
  const subject = `${label} — OpenSellvy`;
  const text = [
    `${label}`,
    '',
    `Gunakan kode berikut untuk melanjutkan:`,
    '',
    code,
    '',
    `Kode berlaku ${OTP_TTL_MINUTES} menit dan hanya bisa dipakai sekali.`,
    `Kalau kamu tidak meminta kode ini, abaikan email ini.`,
  ].join('\n');
  const html = `<div style="font-family:sans-serif;max-width:480px">
<h2>${label}</h2>
<p>Gunakan kode berikut untuk melanjutkan:</p>
<p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p>
<p>Kode berlaku <strong>${OTP_TTL_MINUTES} menit</strong> dan hanya bisa dipakai sekali.</p>
<p style="color:#666">Kalau kamu tidak meminta kode ini, abaikan email ini.</p>
</div>`;
  return { to: email, subject, text, html };
}