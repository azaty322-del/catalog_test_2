import type { AuthResult, AuthService, Credentials, RegisterInput, User } from './types';

/**
 * Настоящая безопасная авторизация через серверные API и HttpOnly-cookie.
 */
export const httpAuthService: AuthService = {
  async login(credentials: Credentials): Promise<AuthResult> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      return data;
    } catch {
      return { ok: false, reason: 'invalid_credentials' };
    }
  },

  async register(input: RegisterInput): Promise<AuthResult> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      return data;
    } catch {
      return { ok: false, reason: 'invalid_credentials' };
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Игнорируем сетевые ошибки при выходе
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) return null;
      const data = await res.json();
      return data.user || null;
    } catch {
      return null;
    }
  },
};
