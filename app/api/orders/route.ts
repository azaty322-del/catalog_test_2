import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { notifyNewOrder, OrderData } from '@/lib/notifications';
import { logger } from '@/lib/logger';

const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');

function readLocalOrders(): OrderData[] {
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

function writeLocalOrders(orders: OrderData[]): void {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (error) {
    console.error('Ошибка записи orders.json:', error);
  }
}

export async function GET() {
  try {
    // 1. Попытка чтения из PostgreSQL через Prisma
    if (isDatabaseConfigured()) {
      try {
        const dbOrders = await prisma.order.findMany({
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        });

        if (dbOrders) {
          const orders = dbOrders.map((o) => ({
            id: o.id,
            fullName: o.fullName,
            email: o.email,
            phone: o.phone,
            company: o.company || undefined,
            comment: o.comment || undefined,
            status: o.status,
            totalCount: o.totalCount,
            createdAt: o.createdAt.toISOString(),
            items: o.items.map((it) => ({
              id: it.movieId,
              title: it.title,
              poster: it.poster || undefined,
              category: it.category || undefined,
              qualities: it.qualities,
              totalDurationMinutes: it.totalDurationMinutes || undefined,
            })),
          }));

          return NextResponse.json({ orders, source: 'postgresql' });
        }
      } catch (dbErr) {
        console.warn('[API/orders] Ошибка чтения orders из Prisma, переходим на локальный файл:', dbErr);
      }
    }

    // 2. Fallback к orders.json
    const local = readLocalOrders();
    local.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ orders: local, source: 'json_fallback' });
  } catch (error: any) {
    logger.error('ORDERS_GET_ERROR', { error: error?.message });
    return NextResponse.json({ error: 'Ошибка получения заказов' }, { status: 500 });
  }
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
    const itemsList = Array.isArray(items) ? items : [];

    const newOrder: OrderData = {
      id: orderId,
      fullName: String(fullName).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      company: company ? String(company).trim() : undefined,
      comment: comment ? String(comment).trim() : undefined,
      items: itemsList,
      totalCount: itemsList.length,
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    // 1. Сохранение в PostgreSQL через Prisma
    if (isDatabaseConfigured()) {
      try {
        await prisma.order.create({
          data: {
            id: orderId,
            fullName: newOrder.fullName,
            email: newOrder.email,
            phone: newOrder.phone,
            company: newOrder.company || null,
            comment: newOrder.comment || null,
            status: 'new',
            totalCount: newOrder.totalCount,
            items: {
              create: itemsList.map((item: any) => ({
                movieId: String(item.id || item.slug || 'unknown'),
                title: typeof item.title === 'object' ? (item.title.ru || item.title.en || 'Без названия') : String(item.title || 'Без названия'),
                poster: item.poster || item.image || null,
                category: item.category || null,
                qualities: Array.isArray(item.qualities) ? item.qualities : (item.quality ? [item.quality] : []),
                totalDurationMinutes: Number(item.totalDurationMinutes) || null,
              })),
            },
          },
        });
        logger.info('ORDER_CREATED_PRISMA', { orderId, email: newOrder.email, count: newOrder.totalCount });
      } catch (dbErr: any) {
        logger.warn('PRISMA_ORDER_CREATE_FAILED', { error: dbErr?.message });
      }
    }

    // 2. Резервное сохранение в JSON
    try {
      const orders = readLocalOrders();
      orders.unshift(newOrder);
      writeLocalOrders(orders);
    } catch (fsErr) {
      console.error('Ошибка записи orders.json:', fsErr);
    }

    // 3. Отправка уведомлений (Telegram, Email)
    notifyNewOrder(newOrder).catch((err) => {
      console.error('Ошибка отправки уведомления:', err);
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

    // 1. Обновление в PostgreSQL через Prisma
    if (isDatabaseConfigured()) {
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: { status },
        });
        logger.info('ORDER_PRISMA_STATUS_UPDATED', { orderId, status });
      } catch (dbErr: any) {
        logger.warn('PRISMA_ORDER_STATUS_UPDATE_FAILED', { error: dbErr?.message });
      }
    }

    // 2. Обновление в JSON
    const orders = readLocalOrders();
    const targetOrder = orders.find((o) => o.id === orderId);

    if (targetOrder) {
      targetOrder.status = status;
      writeLocalOrders(orders);
      return NextResponse.json({ ok: true, order: targetOrder });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    logger.error('ORDER_STATUS_UPDATE_FAILED', { error: error.message });
    return NextResponse.json({ error: error.message || 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
