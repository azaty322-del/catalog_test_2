import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get('level');
    const search = searchParams.get('search')?.toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {};
    if (level && level !== 'ALL') where.level = level;
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { actor: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    logger.error('LOGS_FETCH_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Ошибка получения логов' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.auditLog.deleteMany({});
    logger.info('LOGS_CLEARED', { message: 'Журнал аудита очищен администратором' });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
