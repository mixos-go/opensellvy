import type { OAuthToken, PlatformCredentials } from '../connector.types';

export interface OAuthService {
  getAuthorizeUrl(
    platform: string,
    credentials: Pick<PlatformCredentials, 'appId' | 'redirectUri'>,
  ): Promise<string>;
  exchangeCode(
    platform: string,
    credentials: PlatformCredentials,
    code: string,
  ): Promise<OAuthToken>;
  refreshToken(
    platform: string,
    credentials: PlatformCredentials,
    refreshToken: string,
  ): Promise<OAuthToken>;
}
