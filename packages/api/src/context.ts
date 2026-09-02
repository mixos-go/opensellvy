import type { Services, ModuleDeps } from '@opensellvy/module';
import type { ConnectorRegistry } from '@opensellvy/connector';
import type { AuthService } from '@opensellvy/core';

export interface WebhookDispatch {
  (input: {
    platform: string;
    event: string;
    type: string;
    data: unknown;
    signature: string;
  }): Promise<void> | void;
}

/**
 * ApiContext — komposisi root untuk lapisan API.
 * Tersusun dari Use Case layer (@opensellvy/module services) + registry adapter.
 * Controller TIDAK pernah mengakses repository DB langsung; mereka hanya
 * memanggil use case (services) lewat context ini.
 */
export interface ApiContext {
  /** Use Case / Service layer — sumber kebenaran bisnis (module services). */
  services: Services;
  /** satu-gate ke platform adapters (dipakai webhook receiver & oauth). */
  registry: ConnectorRegistry;
  /** token store OAuth (untuk oauth callback flow). */
  tokens?: ModuleDeps['tokens'];
  /** credential provider (untuk oauth callback flow). */
  credentials?: ModuleDeps['credentials'];
  /** dispatch webhook terverifikasi → lapisan aplikasi (sync/event). Default: no-op. */
  onWebhook?: WebhookDispatch;
  /** keamanan: jwtSecret utk bearer auth; mode auth (closed default = fail-closed). */
  secrets?: {
    jwtSecret?: string;
    webhook?: Partial<Record<string, string>>;
  };
  authMode?: 'closed' | 'open';
  /** core/auth (login/refresh/verify access token). Bila ada → bearer memakai JWT. */
  authService?: AuthService;
}