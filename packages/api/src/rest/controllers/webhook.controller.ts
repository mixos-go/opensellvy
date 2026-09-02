import type { Handler } from 'hono';
import type { ApiEnv } from '../../env';

/**
 * POST /webhooks/:platform — receiver webhook dari platform.
 * 1. ambil plugin adapter dari registry
 * 2. verifikasi signature (plugin.webhook.verify terhadap raw body)
 * 3. map event+payload → bentuk internal, lalu emit ke event bus (jika ada)
 */
export const webhookReceiverHandler: Handler<ApiEnv> = async (c) => {
  const platform = c.req.param('platform')!;
  const api = c.get('api');

  let plugin: { webhook?: { verify(p: unknown, sig: string): Promise<boolean>; map(e: string, p: unknown): Promise<{ type: string; data: unknown }> } } | undefined;
  try {
    plugin = api.registry.get(platform as never);
  } catch {
    return c.json({ error: { code: 'PLATFORM_NOT_FOUND', message: `Platform "${platform}" tidak terdaftar` } }, 404);
  }
  if (!plugin?.webhook) {
    return c.json({ error: { code: 'WEBHOOK_UNSUPPORTED', message: `Platform "${platform}" tidak mendukung webhook` } }, 501);
  }

  const rawBody = await c.req.text();
  const signature = c.req.header('x-signature') ?? c.req.header('x-opensellvy-signature') ?? '';
  const event = c.req.header('x-hook-event') ?? '';

  const verified = await plugin.webhook.verify(rawBody, signature);
  if (!verified) {
    return c.json({ error: { code: 'SIGNATURE_INVALID', message: 'Invalid webhook signature' } }, 401);
  }

  const mapped = await plugin.webhook.map(event, rawBody);
  await api.onWebhook?.({ platform, event, type: mapped.type, data: mapped.data, signature });
  return c.json({ received: true, type: mapped.type }, 200);
};
