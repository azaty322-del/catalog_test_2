import type { AuthResult, AuthService, Credentials, RegisterInput, User } from './types';

/**
 * Заглушка авторизации для frontend-прототипа.
 *
 * Сессия хранится в localStorage. Пароли лежат в открытом виде — это допустимо
 * только потому, что учётные записи тестовые и никуда не уходят из браузера.
 * При подключении backend этот файл заменяется на HTTP-клиент, а `lib/auth/index.ts`
 * начинает экспортировать его — остальной код не трогается.
 */

const SESSION_KEY = 'utv-session';

interface Account extends User {
  password: string;
}

// Заглушка без открытых паролей
const seedAccounts: Account[] = [];

const ACCOUNTS_KEY = 'utv-accounts';

function readAccounts(): Account[] {
  if (typeof window === 'undefined') return seedAccounts;
  try {
    const stored = window.localStorage.getItem(ACCOUNTS_KEY);
    return stored ? (JSON.parse(stored) as Account[]) : seedAccounts;
  } catch {
    return seedAccounts;
  }
}

function writeAccounts(accounts: Account[]): void {
  try {
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // приватный режим браузера — регистрация не переживёт перезагрузку
  }
}

function toUser(account: Account): User {
  const { password, ...user } = account;
  return user;
}

function saveSession(user: User): void {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // сессия останется только в памяти
  }
}

export const mockAuthService: AuthService = {
  async login({ email, password }: Credentials): Promise<AuthResult> {
    const account = readAccounts().find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
    );

    if (!account || account.password !== password) {
      return { ok: false, reason: 'invalid_credentials' };
    }

    const user = toUser(account);
    saveSession(user);
    return { ok: true, user };
  },

  async register(input: RegisterInput): Promise<AuthResult> {
    const accounts = readAccounts();
    const email = input.email.trim().toLowerCase();

    if (accounts.some((item) => item.email.toLowerCase() === email)) {
      return { ok: false, reason: 'email_taken' };
    }

    const account: Account = {
      id: `usr-${Date.now()}`,
      email,
      password: input.password,
      fullName: input.fullName,
      phone: input.phone,
      company: input.company,
      position: input.position,
      role: 'USER',
    };

    writeAccounts([...accounts, account]);

    const user = toUser(account);
    saveSession(user);
    return { ok: true, user };
  },

  async logout(): Promise<void> {
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // нечего чистить
    }
  },

  async getCurrentUser(): Promise<User | null> {
    if (typeof window === 'undefined') return null;
    try {
      const stored = window.localStorage.getItem(SESSION_KEY);
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  },
};
