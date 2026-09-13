import { httpAuthService } from './http-service';
import type { AuthService } from './types';

/**
 * Реальная серверная авторизация с HttpOnly-cookie и защитой от уязвимостей.
 */
export const authService: AuthService = httpAuthService;

export * from './types';
