import type { ChannelConnection, ConnectChannelInput, ID, PlatformCode } from '@opensellvy/types';
import type { ModuleDeps } from './deps';
import { buildIds, channelContext, requireCredentials, requireToken } from './deps';

export interface ChannelModuleImpl {
  /** mulai OAuth — return authorize URL utk redirect UI */
  getAuthorizeUrl(storeId: ID, platform: PlatformCode): Promise<string>;
  /** handle callback OAuth: tukar code → simpan token → simpan koneksi */
  connect(input: ConnectChannelInput): Promise<ChannelConnection>;
  list(storeId: ID): Promise<ChannelConnection[]>;
  disconnect(channelId: ID): Promise<void>;
  refresh(channelId: ID): Promise<ChannelConnection>;
  /** jalankan auto-sync semua channel terhubung (orders+inventory) */
  syncAll(storeId: ID, opts?: { platform?: string; since?: Date }): Promise<{ channels: string[] }>;
}

export function channelModule(deps: ModuleDeps): ChannelModuleImpl {
  const { repos, registry } = deps;
  const { id, now } = buildIds(deps);

  const requireChannel = async (channelId: string) => {
    const channel = await repos.channels.findById(channelId);
    if (!channel) throw new Error(`Channel ${channelId} not found`);
    return channel;
  };

  return {
    async getAuthorizeUrl(storeId, platform) {
      const credentials = requireCredentials(deps);
      const plugin = registry.get(platform);
      return plugin.auth.getAuthorizeUrl({
        storeId,
        platformAccountId: `${storeId}:${platform}`,
        credentials: await credentials(storeId, platform),
        token: { accessToken: '' },
      });
    },

    async connect(input) {
      const plugin = registry.get(input.platform);
      const tokens = requireToken(deps);
      const credentials = deps.credentials;
      if (!credentials) throw new Error('credentials provider belum dikonfigurasi');
      const credentialsResolved = await credentials(input.storeId, input.platform);

      const token = await plugin.auth.exchangeCode(
        {
          storeId: input.storeId,
          platformAccountId: `${input.storeId}:${input.platform}`,
          credentials: credentialsResolved,
          token: { accessToken: '' },
        },
        input.oauth.code,
      );
      const storeId = input.storeId;
      const context = {
        storeId,
        platformAccountId: `${storeId}:${input.platform}`,
        credentials: credentialsResolved,
        token,
      };
      const shop = await plugin.gateway.getShop(context);

      const stamp = now();
      const existing = await repos.channels.findByShop(input.platform, shop.platformShopId);
      const channel: ChannelConnection = {
        id: existing?.id ?? id(),
        storeId,
        platform: input.platform,
        platformShopId: shop.platformShopId,
        shopName: shop.shopName,
        marketplace: shop.marketplace,
        scopes: token.scope ?? [],
        auth: {
          state: 'connected',
          connectedAt: existing?.auth.connectedAt ?? stamp,
          lastTokenRefreshAt: stamp,
          ...(token.expiresAt ? { expiresAt: new Date(token.expiresAt).toISOString() } : {}),
        },
        settings: existing?.settings ?? { autoPullOrders: true, autoSyncInventory: true },
        createdAt: existing?.createdAt ?? stamp,
        updatedAt: stamp,
      };

      const saved = await repos.channels.save(channel);
      await tokens.save(storeId, input.platform, token);
      await deps.events?.emit('channel.connected', {
        storeId,
        platform: input.platform,
        platformShopId: shop.platformShopId,
      });
      return saved;
    },

    async list(storeId) {
      return repos.channels.findByStore(storeId);
    },

    async disconnect(channelId) {
      const channel = await requireChannel(channelId);
      await repos.channels.delete(channelId);
      await deps.tokens?.delete(channel.storeId, channel.platform);
      await deps.events?.emit('channel.disconnected', { channelId, platform: channel.platform });
    },

    async refresh(channelId) {
      const channel = await requireChannel(channelId);
      const plugin = registry.get(channel.platform);
      const context = await channelContext(deps, channel.storeId, channel.platform);
      const token = await plugin.auth.refreshToken(context);
      await deps.tokens?.save(channel.storeId, channel.platform, token);
      await repos.channels.save({ ...channel, updatedAt: now(), auth: { ...channel.auth, lastTokenRefreshAt: now() } });
      return requireChannel(channelId);
    },

    async syncAll(storeId, opts) {
      const channels = (await repos.channels.findByStore(storeId)).filter((c) => !opts?.platform || c.platform === opts.platform);
      const results: string[] = [];
      for (const channel of channels) {
        if (channel.settings.autoPullOrders) {
          await deps.events?.emit('order.sync.requested', { storeId, platform: channel.platform });
        }
        results.push(channel.platform);
      }
      return { channels: results };
    },
  };
}