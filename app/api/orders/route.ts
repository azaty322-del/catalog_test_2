import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { notifyNewOrder, OrderData } from '@/lib/notifications';
import { logger } from '@/lib/logger';

const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');

function readOrders(): OrderData[] {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const content = fs.readFileSync(ORDERS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Ошибка чтения orders.json:', error);
    return [];
  }
}

function writeOrders(orders: OrderData[]): void {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (error) {
    console.error('Ошибка записи orders.json:', error);
  }
}

export async function GET() {
  const orders = readOrders();
  // Сортируем: новые сверху
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, phone, company, comment, items } = body;

    if (!fullName || !email || !phone) {
      return NextResponse.json(
        { error: 'Заполните обязательные поля: имя, email и телефон' },
        { status: 400 }
      );
    }

    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const newOrder: OrderData = {
      id: orderId,
      fullName: String(fullName).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      company: company ? String(company).trim() : undefined,
      comment: comment ? String(comment).trim() : undefined,
      items: Array.isArray(items) ? items : [],
      totalCount: Array.isArray(items) ? items.length : 0,
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    const orders = readOrders();
    orders.unshift(newOrder);
    writeOrders(orders);

    // Отправляем уведомления (Telegram, Email) асинхронно
    notifyNewOrder(newOrder).catch((err) => {
      console.error('Ошибка отправки уведомления:', err);
    });

    logger.info('ORDER_CREATED', {
      orderId: newOrder.id,
      email: newOrder.email,
      fullName: newOrder.fullName,
      totalCount: newOrder.totalCount,
    });

    return NextResponse.json({ ok: true, order: newOrder }, { status: 201 });
  } catch (error: any) {
    logger.error('ORDER_CREATION_FAILED', { error: error.message });
    return NextResponse.json({ error: error.message || 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Не указан orderId или status' }, { status: 400 });
    }

    const orders = readOrders();
    const targetOrder = orders.find((o) => o.id === orderId);

    if (!targetOrder) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }

    targetOrder.status = status;
    writeOrders(orders);

    logger.info('ORDER_STATUS_CHANGED', { orderId, status });

    return NextResponse.json({ ok: true, order: targetOrder });
  } catch (error: any) {
    logger.error('ORDER_STATUS_UPDATE_FAILED', { error: error.message });
    return NextResponse.json({ error: error.message || 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
