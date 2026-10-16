import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { User, Role } from './types';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const SESSION_COOKIE_NAME = 'utv_session';
if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET не задан в .env');
const SECRET: string = process.env.SESSION_SECRET;

export interface StoredUser extends User {
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, s, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: s };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const result = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return result === hash;
}

export function readUsers(): StoredUser[] {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function writeUsers(users: StoredUser[]): void {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (e) {
    console.error('Ошибка записи users.json:', e);
  }
}

export function createSessionToken(user: User): string {
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    company: user.company,
    position: user.position,
    phone: user.phone,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 дней
  });

  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');

  return Buffer.from(payload).toString('base64url') + '.' + signature;
}

export function verifySessionToken(token: string): User | null {
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;

    const payload = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const hmac = crypto.createHmac('sha256', SECRET);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    if (signature !== expectedSignature) return null;

    const data = JSON.parse(payload);
    if (data.exp && Date.now() > data.exp) return null;

    return {
      id: data.id,
      email: data.email,
      fullName: data.fullName,
      role: data.role as Role,
      company: data.company,
      position: data.position,
      phone: data.phone,
    };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME };
