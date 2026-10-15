import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

interface AppSettings {
  siteName: string;
  adminEmail: string;
  telegramBotToken: string;
  telegramChatId: string;
  notificationEmails: string;
  consoleNoise?: string;
}

function readLocalSettings(): AppSettings {
  const defaults: AppSettings = {
    siteName: 'Каталог контента UTV Media',
    adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'admin@utvmedia.ru',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
    notificationEmails: 'orders@utv.ru, managers@utvmedia.ru',
    consoleNoise: 'true',
  };

  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaults, null, 2), 'utf-8');
      return defaults;
    }
    const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    return { ...defaults, ...JSON.parse(content) };
  } catch (error) {
    console.error('Ошибка чтения settings.json:', error);
    return defaults;
  }
}

function writeLocalSettings(settings: AppSettings): void {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (error) {
    console.error('Ошибка записи settings.json:', error);
  }
}

export async function GET() {
  const defaults = readLocalSettings();

  // 1. Попытка чтения настроек из PostgreSQL через Prisma
  if (isDatabaseConfigured()) {
    try {
      const dbSettings = await prisma.setting.findMany();
      if (dbSettings && dbSettings.length > 0) {
        const settingsMap: any = { ...defaults };
        dbSettings.forEach((s) => {
          settingsMap[s.key] = s.value;
        });
        return NextResponse.json({ settings: settingsMap, source: 'postgresql' });
      }
    } catch (dbErr) {
      console.warn('[API/settings] Ошибка чтения настроек из Prisma:', dbErr);
    }
  }

  return NextResponse.json({ settings: defaults, source: 'json_fallback' });
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
    const current = readLocalSettings();
    const updated: AppSettings = {
      siteName: body.siteName !== undefined ? String(body.siteName).trim() : current.siteName,
      adminEmail: body.adminEmail !== undefined ? String(body.adminEmail).trim() : current.adminEmail,
      telegramBotToken: body.telegramBotToken !== undefined ? String(body.telegramBotToken).trim() : current.telegramBotToken,
      telegramChatId: body.telegramChatId !== undefined ? String(body.telegramChatId).trim() : current.telegramChatId,
      notificationEmails: body.notificationEmails !== undefined ? String(body.notificationEmails).trim() : current.notificationEmails,
      consoleNoise: body.consoleNoise !== undefined ? String(body.consoleNoise) : current.consoleNoise,
    };

    // 1. Сохранение в PostgreSQL через Prisma
    if (isDatabaseConfigured()) {
      try {
        const entries = Object.entries(updated);
        await prisma.$transaction(
          entries.map(([key, value]) =>
            prisma.setting.upsert({
              where: { key },
              update: { value: String(value) },
              create: { key, value: String(value) },
            })
          )
        );
        logger.info('SETTINGS_PRISMA_UPDATED', { updatedKeys: Object.keys(updated) });
      } catch (dbErr: any) {
        logger.warn('PRISMA_SETTINGS_UPDATE_FAILED', { error: dbErr?.message });
      }
    }

    // 2. Резервное сохранение в JSON
    writeLocalSettings(updated);

    return NextResponse.json({ ok: true, settings: updated });
  } catch (error: any) {
    logger.error('SETTINGS_UPDATE_ERROR', { error: error?.message });
    return NextResponse.json({ error: error.message || 'Ошибка сервера' }, { status: 500 });
  }
}
