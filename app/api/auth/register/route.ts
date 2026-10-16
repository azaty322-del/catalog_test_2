import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  hashPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
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
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (adminEmail && cleanEmail === adminEmail) {
      return NextResponse.json({ ok: false, reason: 'email_taken' }, { status: 409 });
    }

    const { hash, salt } = hashPassword(password);
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
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

    const createdUser: User = {
      id: dbUser.id,
      email: dbUser.email,
      fullName: dbUser.fullName,
      role: 'USER',
      company: dbUser.company || undefined,
      position: dbUser.position || undefined,
      phone: dbUser.phone || undefined,
    };

    logger.info('USER_REGISTERED_PRISMA', { email: cleanEmail, id: dbUser.id });

    // Создание токена сессии и HttpOnly cookie
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
