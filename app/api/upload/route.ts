import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { logger } from '@/lib/logger';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase() || '.jpg';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: 'Недопустимый формат файла. Разрешены только изображения.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Гарантируем существование директории на сервере
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Генерируем уникальное имя файла
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    logger.info('IMAGE_UPLOAD_SUCCESS', { filename, size: buffer.length });

    // Через API-роут: в проде Next не отдаёт файлы, добавленные в public/ после сборки
    return NextResponse.json({ url: `/api/uploads/${filename}` });
  } catch (error: any) {
    logger.error('IMAGE_UPLOAD_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Ошибка сохранения файла: ' + error.message }, { status: 500 });
  }
}