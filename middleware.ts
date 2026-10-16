import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'utv_session';
const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// Публичные запросы — всё остальное в /api требует ADMIN
function isPublic(method: string, pathname: string): boolean {
  if (pathname.startsWith('/api/auth/')) return true; // вход, регистрация, выход, me
  if (pathname === '/api/orders' && method === 'POST') return true; // клиент оформляет заявку
  if (method === 'GET' || method === 'HEAD') {
    // Чтение заказов, настроек (там токен Telegram) и админских данных — только админу
    return !(pathname.startsWith('/api/admin/') || pathname === '/api/orders' || pathname === '/api/settings');
  }
  return !WRITE_METHODS.includes(method);
}

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

function base64UrlDecode(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// Та же подпись, что в lib/auth/server.ts (HMAC-SHA256, hex), но через Web Crypto для Edge
async function isAdminToken(token: string | undefined): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret) return false;

  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return false;

  try {
    const payload = base64UrlDecode(payloadB64);
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const expected = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
    if (expected !== signature) return false;

    const data = JSON.parse(payload);
    if (data.exp && Date.now() > data.exp) return false;
    if (data.role !== 'ADMIN') return false;

    // Админ из .env действителен, только пока email совпадает с ADMIN_EMAIL
    if (data.id === 'admin-1') {
      return data.email === process.env.ADMIN_EMAIL?.trim().toLowerCase();
    }
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(req.method, pathname)) return NextResponse.next();

  if (await isAdminToken(req.cookies.get(SESSION_COOKIE_NAME)?.value)) {
    return NextResponse.next();
  }

  return NextResponse.json({ error: 'Доступ только для администратора' }, { status: 403 });
}

export const config = {
  matcher: '/api/:path*',
};
