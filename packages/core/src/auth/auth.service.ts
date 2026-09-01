import type { UserContext } from './auth.types';

export interface AuthService {
  login(email: string, password: string): Promise<unknown>;
  logout(token: string): Promise<void>;
  refresh(refreshToken: string): Promise<unknown>;
  verifyToken(token: string): Promise<UserContext>;
}
