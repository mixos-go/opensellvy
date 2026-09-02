import type { ApiContext } from './context';

export interface AuthUser {
  userId: string;
  scope: string;
  authenticated: boolean;
  /** dari core/auth UserContext (hanya saat token JWT diverifikasi). */
  storeId?: string;
  role?: string;
  permissions?: string[];
  /** expiry access token (ISO), bila berasal dari JWT. */
  expiresAt?: string;
}

export interface ApiVariables {
  /** ApiContext (komposisi root) — di-bind oleh middleware bindContext. */
  api: ApiContext;
  /** user terautentikasi (bila dipakai bearerAuth). */
  user?: AuthUser;
  /** opsi cross-cutting (mis. cors) berasal dari context/config. */
}

export type ApiEnv = {
  Variables: ApiVariables;
};
