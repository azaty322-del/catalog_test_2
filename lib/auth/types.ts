export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  company?: string;
  position?: string;
  phone?: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterInput extends Credentials {
  fullName: string;
  phone?: string;
  company?: string;
  position?: string;
}

/** Успех или понятная причина отказа — без исключений в потоке авторизации. */
export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; reason: 'invalid_credentials' | 'email_taken' };

/**
 * Контракт слоя авторизации. Сейчас реализован на mock, потом заменяется
 * на реальный API — интерфейсы компонентов при этом не меняются.
 */
export interface AuthService {
  login(credentials: Credentials): Promise<AuthResult>;
  register(input: RegisterInput): Promise<AuthResult>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}
