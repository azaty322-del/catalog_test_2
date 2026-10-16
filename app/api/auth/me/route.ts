import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/server';
import type { Role } from '@/lib/auth/types';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const sessionUser = verifySessionToken(token);
    if (!sessionUser) {
      return NextResponse.json({ user: null });
    }

    // Админ из .env: токен действителен, только пока email совпадает с ADMIN_EMAIL
    if (sessionUser.id === 'admin-1') {
      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      return NextResponse.json({ user: adminEmail && sessionUser.email === adminEmail ? sessionUser : null });
    }

    // Остальные — только если пользователь ещё есть в БД
    const dbUser = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    if (!dbUser) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        fullName: dbUser.fullName,
        role: dbUser.role as Role,
        company: dbUser.company || undefined,
        position: dbUser.position || undefined,
        phone: dbUser.phone || undefined,
      },
    });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
