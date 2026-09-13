export interface OrderItem {
  id: string;
  title: string;
  poster?: string;
  category?: string;
  qualities?: string[];
  totalDurationMinutes?: number;
}

export interface OrderData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  comment?: string;
  items: OrderItem[];
  totalCount: number;
  createdAt: string;
  status: 'new' | 'processing' | 'completed' | 'cancelled';
}

import fs from 'fs';
import path from 'path';

function getActiveSettings() {
  const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');
  let fileSettings: any = {};
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      fileSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
  } catch {}

  return {
    telegramBotToken: fileSettings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: fileSettings.telegramChatId || process.env.TELEGRAM_CHAT_ID,
    notificationEmail: fileSettings.adminEmail || fileSettings.notificationEmails || process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL,
  };
}

/**
 * Отправка уведомления в Telegram через Bot API
 */
export async function sendTelegramNotification(order: OrderData): Promise<boolean> {
  const settings = getActiveSettings();
  const token = settings.telegramBotToken;
  const chatId = settings.telegramChatId;

  if (!token || !chatId) {
    console.log('[Notification] Telegram Bot Token или Chat ID не настроены в Настройках админки или .env.local');
    return false;
  }

  const itemsList = order.items
    .map((item, idx) => `${idx + 1}. *${item.title}*${item.category ? ` (${item.category})` : ''}`)
    .join('\n');

  const text = `🎬 *Новая заявка на контент!*\n\n` +
    `🔖 *Номер заказа:* \`${order.id}\`\n` +
    `👤 *Клиент:* ${order.fullName}\n` +
    `📧 *Email:* ${order.email}\n` +
    `📱 *Телефон:* ${order.phone}\n` +
    (order.company ? `🏢 *Компания:* ${order.company}\n` : '') +
    `\n📦 *Выбранный контент (${order.totalCount} поз.):*\n${itemsList}\n\n` +
    `📅 *Дата:* ${new Date(order.createdAt).toLocaleString('ru-RU')}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Notification] Ошибка Telegram API:', err);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[Notification] Не удалось отправить сообщение в Telegram:', error);
    return false;
  }
}

/**
 * Отправка уведомления на Email
 */
export async function sendEmailNotification(order: OrderData): Promise<boolean> {
  const settings = getActiveSettings();
  const recipient = settings.notificationEmail;
  if (!recipient) {
    console.log('[Notification] Email администратора не задан в Настройках или .env.local');
    return false;
  }

  console.log(`[Notification] Заявка ${order.id} готова к отправке на Email: ${recipient}`);
  return true;
}

/**
 * Отправка всех видов уведомлений о заказе
 */
export async function notifyNewOrder(order: OrderData) {
  await Promise.allSettled([
    sendTelegramNotification(order),
    sendEmailNotification(order),
  ]);
}
