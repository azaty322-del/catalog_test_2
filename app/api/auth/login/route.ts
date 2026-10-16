import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import {
  readUsers,
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
} from '@/lib/auth/server';
import type { User, Role } from '@/lib/auth/types';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ ok: false, reason: 'invalid_credentials' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;

    let matchedUser: User | null = null;

    // 1. Администратор — только из .env (ADMIN_EMAIL / ADMIN_PASSWORD)
    if (adminEmail && adminPassword && cleanEmail === adminEmail && password === adminPassword) {
      matchedUser = {
        id: 'admin-1',
        email: cleanEmail,
        fullName: 'Администратор каталога',
        role: 'ADMIN',
        company: 'UTV Media',
        position: 'Главный редактор',
      };
    }

    // 2. Проверка в PostgreSQL через Prisma
    if (!matchedUser && isDatabaseConfigured()) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });

        if (dbUser && verifyPassword(password, dbUser.password, dbUser.salt)) {
          matchedUser = {
            id: dbUser.id,
            email: dbUser.email,
            fullName: dbUser.fullName,
            role: dbUser.role as Role,
            company: dbUser.company || undefined,
            position: dbUser.position || undefined,
            phone: dbUser.phone || undefined,
          };
        }
      } catch (dbErr: any) {
        logger.warn('PRISMA_LOGIN_CHECK_FAILED', { error: dbErr?.message });
      }
    }

    // 3. Резервная проверка в локальном JSON (если БД нет или пользователь там)
    if (!matchedUser) {
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
    logger.error('AUTH_LOGIN_ERROR', { error: error?.message });
    return NextResponse.json({ ok: false, reason: 'invalid_credentials' }, { status: 500 });
  }
}
