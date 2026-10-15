import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
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

    // Если подключена БД, проверяем актуальные данные пользователя
    if (isDatabaseConfigured() && !sessionUser.id.startsWith('admin-') && !sessionUser.id.startsWith('usr-1')) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: sessionUser.id },
        });

        if (dbUser) {
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
        }
      } catch (dbErr) {
        // Fallback к данным из сессионного токена
      }
    }

    return NextResponse.json({ user: sessionUser });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
