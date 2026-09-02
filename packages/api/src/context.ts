import type { Services, ModuleDeps } from '@opensellvy/module';
import type { ConnectorRegistry } from '@opensellvy/connector';

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
  /** rahasia utk mem-verifikasi signature webhook + bearer token (jika ada). */
  secrets?: {
    jwtSecret?: string;
    webhook?: Partial<Record<string, string>>;
  };
}
