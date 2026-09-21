import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

interface AppSettings {
  siteName: string;
  adminEmail: string;
  telegramBotToken: string;
  telegramChatId: string;
  notificationEmails: string;
}

function readSettings(): AppSettings {
  const defaults: AppSettings = {
    siteName: 'Каталог контента UTV Media',
    adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'admin@utvmedia.ru',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
    notificationEmails: 'orders@utv.ru, managers@utvmedia.ru',
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

function writeSettings(settings: AppSettings): void {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (error) {
    console.error('Ошибка записи settings.json:', error);
  }
}

export async function GET() {
  const settings = readSettings();
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Проверка действия "Отправить тестовое сообщение в Telegram"
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
    const current = readSettings();
    const updated: AppSettings = {
      siteName: body.siteName !== undefined ? String(body.siteName).trim() : current.siteName,
      adminEmail: body.adminEmail !== undefined ? String(body.adminEmail).trim() : current.adminEmail,
      telegramBotToken: body.telegramBotToken !== undefined ? String(body.telegramBotToken).trim() : current.telegramBotToken,
      telegramChatId: body.telegramChatId !== undefined ? String(body.telegramChatId).trim() : current.telegramChatId,
      notificationEmails: body.notificationEmails !== undefined ? String(body.notificationEmails).trim() : current.notificationEmails,
    };

    writeSettings(updated);
    return NextResponse.json({ ok: true, settings: updated });
  } catch (error: any) {
    console.error('Ошибка сохранения настроек:', error);
    return NextResponse.json({ error: error.message || 'Ошибка сервера' }, { status: 500 });
  }
}
