import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { createTtsWebhook } from '../src/tts.webhook';

const APP_SECRET = 'tt-app-secret';

function sign(ts: number, bodySign: string): string {
  return createHmac('sha256', APP_SECRET).update(`${ts}${bodySign}`).digest('hex');
}

const PAYLOAD = JSON.stringify({
  event_type: 'ORDER_STATUS_CHANGE',
  timestamp: 1655714431,
  sign: 'abc123',
  data: { order_id: 'ORD1', order_status: 'AWAITING_SHIPMENT' },
});

describe('tts.webhook — TikTok Shop webhook verify + map', () => {
  it('verify true untuk signature HMAC valid (X-TTK-SIGN)', async () => {
    const webhook = createTtsWebhook({ appSecret: APP_SECRET });
    const ok = await webhook.verify(PAYLOAD, sign(1655714431, 'abc123'));
    expect(ok).toBe(true);
  });

  it('verify false untuk signature salah / kosong', async () => {
    const webhook = createTtsWebhook({ appSecret: APP_SECRET });
    await expect(webhook.verify(PAYLOAD, 'deadbeef')).resolves.toBe(false);
    await expect(webhook.verify(PAYLOAD, '')).resolves.toBe(false);
  });

  it('verify menerima payload object (di-serialize internal)', async () => {
    const webhook = createTtsWebhook({ appSecret: APP_SECRET });
    const ok = await webhook.verify(JSON.parse(PAYLOAD), sign(1655714431, 'abc123'));
    expect(ok).toBe(true);
  });

  it('map menormalkan ORDER_STATUS_CHANGE → order.status_changed', async () => {
    const webhook = createTtsWebhook({ appSecret: APP_SECRET });
    const evt = await webhook.map('ORDER_STATUS_CHANGE', JSON.parse(PAYLOAD));
    expect(evt.type).toBe('order.status_changed');
  });

  it('map menormalkan RETURN_STATUS_CHANGE → return.updated dan PACKAGE_UPDATE → shipment.updated', async () => {
    const webhook = createTtsWebhook({ appSecret: APP_SECRET });
    const ret = await webhook.map('RETURN_STATUS_CHANGE', { event_type: 'RETURN_STATUS_CHANGE', data: {} });
    expect(ret.type).toBe('return.updated');
    const pkg = await webhook.map('PACKAGE_UPDATE', { event_type: 'PACKAGE_UPDATE', data: {} });
    expect(pkg.type).toBe('shipment.updated');
  });
});