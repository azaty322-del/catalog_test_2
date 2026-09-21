import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const auditLogFilePath = path.join(process.cwd(), 'data', 'audit.json');

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get('level');
    const search = searchParams.get('search')?.toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (isDatabaseConfigured()) {
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
    }

    // Чтение из резервного JSON файла
    let logs: any[] = [];
    if (fs.existsSync(auditLogFilePath)) {
      try {
        logs = JSON.parse(fs.readFileSync(auditLogFilePath, 'utf-8'));
      } catch {
        logs = [];
      }
    }

    if (level && level !== 'ALL') {
      logs = logs.filter((l) => l.level === level);
    }
    if (search) {
      logs = logs.filter(
        (l) =>
          (l.action && l.action.toLowerCase().includes(search)) ||
          (l.actor && l.actor.toLowerCase().includes(search)) ||
          (l.details && JSON.stringify(l.details).toLowerCase().includes(search))
      );
    }

    return NextResponse.json({ logs: logs.slice(0, limit) });
  } catch (error: any) {
    logger.error('LOGS_FETCH_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Ошибка получения логов' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    if (isDatabaseConfigured()) {
      await prisma.auditLog.deleteMany({});
    }
    if (fs.existsSync(auditLogFilePath)) {
      fs.writeFileSync(auditLogFilePath, '[]', 'utf-8');
    }
    logger.info('LOGS_CLEARED', { message: 'Журнал аудита очищен администратором' });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
