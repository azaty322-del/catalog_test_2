import { NextRequest, NextResponse } from 'next/server';
import {
  readUsers,
  writeUsers,
  hashPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  StoredUser,
} from '@/lib/auth/server';
import type { User } from '@/lib/auth/types';

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

    const users = readUsers();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return NextResponse.json({ ok: false, reason: 'email_taken' }, { status: 409 });
    }

    const { hash, salt } = hashPassword(password);
    const userId = `usr-${Date.now().toString(36)}`;

    const newUser: User = {
      id: userId,
      email: cleanEmail,
      fullName: String(fullName).trim(),
      role: 'USER',
      company: company ? String(company).trim() : undefined,
      position: position ? String(position).trim() : undefined,
      phone: phone ? String(phone).trim() : undefined,
    };

    const storedUser: StoredUser = {
      ...newUser,
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
    };

    users.push(storedUser);
    writeUsers(users);

    const token = createSessionToken(newUser);
    const res = NextResponse.json({ ok: true, user: newUser }, { status: 201 });

    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (error: any) {
    console.error('Ошибка регистрации:', error);
    return NextResponse.json({ ok: false, reason: 'invalid_credentials' }, { status: 500 });
  }
}
