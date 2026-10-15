import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import {
  readUsers,
  writeUsers,
  hashPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  StoredUser,
} from '@/lib/auth/server';
import type { User } from '@/lib/auth/types';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, phone, company, position } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ ok: false, reason: 'invalid_credentials' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@utvmedia.ru').toLowerCase();

    if (cleanEmail === adminEmail) {
      return NextResponse.json({ ok: false, reason: 'email_taken' }, { status: 409 });
    }

    const { hash, salt } = hashPassword(password);
    let createdUser: User | null = null;

    // 1. Регистрация в PostgreSQL через Prisma
    if (isDatabaseConfigured()) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });

        if (existingUser) {
          return NextResponse.json({ ok: false, reason: 'email_taken' }, { status: 409 });
        }

        const dbUser = await prisma.user.create({
          data: {
            email: cleanEmail,
            password: hash,
            salt,
            fullName: String(fullName).trim(),
            role: 'USER',
            company: company ? String(company).trim() : null,
            position: position ? String(position).trim() : null,
            phone: phone ? String(phone).trim() : null,
          },
        });

        createdUser = {
          id: dbUser.id,
          email: dbUser.email,
          fullName: dbUser.fullName,
          role: 'USER',
          company: dbUser.company || undefined,
          position: dbUser.position || undefined,
          phone: dbUser.phone || undefined,
        };

        logger.info('USER_REGISTERED_PRISMA', { email: cleanEmail, id: dbUser.id });
      } catch (dbErr: any) {
        logger.warn('PRISMA_REGISTER_FALLBACK', { error: dbErr?.message });
      }
    }

    // 2. Резервное сохранение в JSON при отсутствии DB
    if (!createdUser) {
      const users = readUsers();
      if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
        return NextResponse.json({ ok: false, reason: 'email_taken' }, { status: 409 });
      }

      const userId = `usr-${Date.now().toString(36)}`;
      createdUser = {
        id: userId,
        email: cleanEmail,
        fullName: String(fullName).trim(),
        role: 'USER',
        company: company ? String(company).trim() : undefined,
        position: position ? String(position).trim() : undefined,
        phone: phone ? String(phone).trim() : undefined,
      };

      const storedUser: StoredUser = {
        ...createdUser,
        passwordHash: hash,
        salt,
        createdAt: new Date().toISOString(),
      };

      users.push(storedUser);
      writeUsers(users);
    }

    // 3. Создание токена сессии и HttpOnly cookie
    const token = createSessionToken(createdUser);
    const res = NextResponse.json({ ok: true, user: createdUser }, { status: 201 });

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
    logger.error('AUTH_REGISTER_ERROR', { error: error?.message });
    return NextResponse.json({ ok: false, reason: 'invalid_credentials' }, { status: 500 });
  }
}
