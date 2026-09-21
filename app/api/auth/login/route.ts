import { NextRequest, NextResponse } from 'next/server';
import {
  readUsers,
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
} from '@/lib/auth/server';
import type { User } from '@/lib/auth/types';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ ok: false, reason: 'invalid_credentials' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@utvmedia.ru').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    let matchedUser: User | null = null;

    // 1. Проверка учетных записей администратора (admin@test.ru, admin@utvmedia.ru или из env)
    if (
      ((cleanEmail === 'admin@test.ru' || cleanEmail === 'admin@utv.ru') && password === 'admin123') ||
      (cleanEmail === adminEmail && password === adminPassword)
    ) {
      matchedUser = {
        id: 'admin-1',
        email: cleanEmail,
        fullName: 'Администратор каталога',
        role: 'ADMIN',
        company: 'UTV Media',
        position: 'Главный редактор',
      };
    } else if (cleanEmail === 'user@test.ru' && password === 'user123') {
      matchedUser = {
        id: 'usr-1',
        email: 'user@test.ru',
        fullName: 'Константин Константинопольский',
        role: 'USER',
        company: 'ООО ЮТВ Медиа',
        position: 'Редактор контента',
        phone: '+7 (911) 234-56-78',
      };
    } else {
      // 2. Проверка зарегистрированных пользователей
      const users = readUsers();
      const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (found && verifyPassword(password, found.passwordHash, found.salt)) {
        matchedUser = {
          id: found.id,
          email: found.email,
          fullName: found.fullName,
          role: found.role,
          company: found.company,
          position: found.position,
          phone: found.phone,
        };
      }
    }

    if (!matchedUser) {
      logger.security('AUTH_LOGIN_FAILED', { email: cleanEmail });
      return NextResponse.json({ ok: false, reason: 'invalid_credentials' }, { status: 401 });
    }

    logger.info('AUTH_LOGIN_SUCCESS', { email: cleanEmail, role: matchedUser.role });

    const token = createSessionToken(matchedUser);
    const res = NextResponse.json({ ok: true, user: matchedUser });

    // Устанавливаем защищенную HttpOnly cookie
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 дней
    });

    return res;
  } catch (error: any) {
    console.error('Ошибка входа:', error);
    return NextResponse.json({ ok: false, reason: 'invalid_credentials' }, { status: 500 });
  }
}
