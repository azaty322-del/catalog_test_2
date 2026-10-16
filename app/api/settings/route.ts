import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface AppSettings {
  siteName: string;
  adminEmail: string;
  telegramBotToken: string;
  telegramChatId: string;
  notificationEmails: string;
  consoleNoise?: string;
}

const DEFAULTS: AppSettings = {
  siteName: 'Каталог контента UTV Media',
  adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || '',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  notificationEmails: '',
  consoleNoise: 'true',
};

// Настройки из БД поверх значений по умолчанию из .env
async function readSettings(): Promise<AppSettings> {
  const rows = await prisma.setting.findMany();
  return { ...DEFAULTS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
}

export async function GET() {
  try {
    return NextResponse.json({ settings: await readSettings() });
  } catch (error: any) {
    logger.error('SETTINGS_GET_ERROR', { error: error?.message });
    return NextResponse.json({ error: 'Ошибка получения настроек' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Тест Telegram
    if (body.action === 'test-telegram') {
      const token = body.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
      const chatId = body.telegramChatId || process.env.TELEGRAM_CHAT_ID;

      if (!token || !chatId) {
        return NextResponse.json(
          { error: 'Укажите Telegram Bot Token и Chat ID перед отправкой теста' },
          { status: 400 }
        );
      }

      const testRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '🔔 *Тестовое сообщение из панели управления UTV Media!*\n\nБот успешно подключен и готов отправлять новые заказы.',
          parse_mode: 'Markdown',
        }),
      });

      if (!testRes.ok) {
        const errText = await testRes.text();
        return NextResponse.json(
          { error: `Ошибка Telegram API: ${errText}` },
          { status: 400 }
        );
      }

      return NextResponse.json({ ok: true, message: 'Тестовое сообщение успешно отправлено в Telegram!' });
    }

    // Сохранение настроек
    const current = await readSettings();
    const updated: AppSettings = {
      siteName: body.siteName !== undefined ? String(body.siteName).trim() : current.siteName,
      adminEmail: body.adminEmail !== undefined ? String(body.adminEmail).trim() : current.adminEmail,
      telegramBotToken: body.telegramBotToken !== undefined ? String(body.telegramBotToken).trim() : current.telegramBotToken,
      telegramChatId: body.telegramChatId !== undefined ? String(body.telegramChatId).trim() : current.telegramChatId,
      notificationEmails: body.notificationEmails !== undefined ? String(body.notificationEmails).trim() : current.notificationEmails,
      consoleNoise: body.consoleNoise !== undefined ? String(body.consoleNoise) : current.consoleNoise,
    };

    await prisma.$transaction(
      Object.entries(updated).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );
    logger.info('SETTINGS_PRISMA_UPDATED', { updatedKeys: Object.keys(updated) });

    return NextResponse.json({ ok: true, settings: updated });
  } catch (error: any) {
    logger.error('SETTINGS_UPDATE_ERROR', { error: error?.message });
    return NextResponse.json({ error: error.message || 'Ошибка сервера' }, { status: 500 });
  }
}
