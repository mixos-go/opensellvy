import type { Capability, PlatformGateway, PlatformPlugin } from './base.connector';

/**
 * Sentinel error: method gateway yang SEMESTINYA terimplementasi nyata, namun
 * adapter masih menaruh stub "belum diimplementasi". Digunakan oleh helper
 * conformance (`assertNoStubMethods`) untuk membedakan stub dari error nyata
 * yang dilempar platform (mis. auth gagal, network, error business).
 */
export class NotImplementedError extends Error {
  constructor(method: string, public readonly platform: string) {
    super(`[${platform}] gateway method "${method}" belum diimplementasikan nyata`);
    this.name = 'NotImplementedError';
  }
}

/**
 * Peta UNTUK-TIAP-CAPABILITY → domain gateway yang wajib terimplementasi.
 * Ini "checklist universal per-platform": jika sebuah platform mendeklarasikan
 * capability `X`, maka domain gateway terkait WAJIB punya method nyata
 * (bukan stub yang melempar NotImplementedError).
 *
 * `webhook.receive` tidak memetakan ke gateway apa pun — ia dipenuhi oleh
 * `PlatformPlugin.webhook` (di luar gateway), sehingga tak ada method gateway.
 */
export const CAPABILITY_METHODS: Record<Capability, ReadonlyArray<keyof PlatformGateway>> = {
  'order.pull': ['order'],
  'order.push': ['order'],
  'order.fulfill': ['fulfillment'],
  'order.tracking': ['order'],
  'product.pull': ['product'],
  'product.push': ['product'],
  'inventory.sync': ['inventory'],
  'promotion.sync': ['promotion'],
  'return.manage': ['returns'],
  'webhook.receive': [],
  'payment.read': ['payment'],
  'shipping.rate': ['shipping'],
  'category.read': ['product'],
  'media.manage': ['media'],
  'finance.read': ['finance'],
  'merchant.read': ['merchant'],
  'shop.settings': ['shop'],
};

/**
 * Kumpulkan dot-path method gateway (mis. "order.pull") dari setiap domain yang
 * wajib karena terkait capability yang dideklarasikan plugin.
 */
export function collectRequiredMethods(plugin: PlatformPlugin): string[] {
  const paths = new Set<string>();
  for (const capability of plugin.capabilities) {
    if (capability === 'webhook.receive') continue;
    for (const domain of CAPABILITY_METHODS[capability]) {
      for (const method of Object.keys(plugin.gateway?.[domain] ?? {}) as string[]) {
        paths.add(`${String(domain)}.${method}`);
      }
    }
  }
  return [...paths];
}

/**
 * Setiap capability yang dideklarasikan WAJIB memetakan ke setidaknya SATU
 * domain gateway yang terdefinisi. Melempar register error bila tidak.
 * `webhook.receive` dikecualikan (dipenuhi oleh PlatformPlugin.webhook).
 */
export function assertCapabilitiesImplementable(plugin: PlatformPlugin): string[] {
  const missing: string[] = [];
  for (const capability of plugin.capabilities) {
    if (capability === 'webhook.receive') continue;
    const domains = CAPABILITY_METHODS[capability];
    if (domains.length === 0) continue;
    for (const domain of domains) {
      const group = plugin.gateway[domain];
      const methodCount = Object.keys(group ?? {}).length;
      if (!group || methodCount === 0) {
        missing.push(`${capability} → gateway.${String(domain)}`);
      }
    }
  }
  return missing;
}

/**
 * Wajib dipanggil dari test suite tiap adapter platform (mis.
 * pada file tersendiri bernama conformance.spec.ts di folder tests adapter).
 *
 * Untuk setiap method gateway yang terkait capability yang dideklarasikan,
 * method DIPANGGIL dengan stub context + fetch kosong. Test gagal bila method
 * melempar `NotImplementedError` (masih stub) — method wajib terimplementasi
 * nyata. Error selain NotImplementedError (auth/network/business) diizinkan,
 * sebab itu sinyal implementasi nyata yang berinteraksi dengan platform.
 */
export async function assertNoStubMethods(
  plugin: PlatformPlugin,
  makeContext: () => unknown,
): Promise<string[]> {
  const stubbed: string[] = [];
  const requiredPaths = new Set(collectRequiredMethods(plugin));
  const ctx = makeContext() as Parameters<PlatformGateway['order']['pull']>[0];
  for (const dotPath of requiredPaths) {
    const [domain, method] = dotPath.split('.') as [string, string];
    const fn = (plugin.gateway as unknown as Record<string, Record<string, unknown>>)[domain]?.[method];
    if (typeof fn !== 'function') {
      stubbed.push(`${dotPath} (bukan function)`);
      continue;
    }
    try {
      await (fn as (context: unknown) => unknown)(ctx);
    } catch (err) {
      if (err instanceof NotImplementedError) {
        stubbed.push(dotPath);
      }
    }
  }
  return stubbed;
}
