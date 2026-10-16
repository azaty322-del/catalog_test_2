import { NextResponse } from 'next/server';
import { exportCatalogToExcel, importCatalogFromExcel } from '@/lib/excel';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getCategorySlug } from '@/lib/filters';

export async function GET() {
  try {
    const dbMovies = await prisma.movie.findMany({ orderBy: { createdAt: 'asc' } });
    const moviesList = dbMovies.map((m) => ({
      id: m.id,
      catalogId: m.catalogId,
      slug: m.slug,
      title: { ru: m.titleRu, en: m.titleEn },
      description: { ru: m.descriptionRu, en: m.descriptionEn },
      category: m.category,
      year: m.year,
      quality: m.qualities,
      qualities: m.qualities,
      duration: m.duration,
      totalDurationMinutes: m.totalDurationMinutes,
      countries: m.countries,
      languages: m.languages,
      ageRating: m.ageRating,
      territory: m.territory,
      rightsPeriod: m.rightsPeriod,
      trailerUrl: m.trailerUrl,
      poster: m.poster,
      tags: m.tags,
      author: m.author,
    }));

    const buffer = exportCatalogToExcel(moviesList);
    logger.info('EXCEL_EXPORT', { titlesCount: moviesList.length });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="UTV_Media_Catalog.xlsx"',
      },
    });
  } catch (error: any) {
    logger.error('EXCEL_EXPORT_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Ошибка экспорта в Excel' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Файл не прикреплен' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsedMovies = importCatalogFromExcel(buffer);
    if (parsedMovies.length === 0) {
      return NextResponse.json({ error: 'В файле не найдено строк с тайтлами' }, { status: 400 });
    }

    // Сопоставляем с существующими записями по ID (экспорт админки) или шифру АЙДИ (таблица заказчика)
    const existing = await prisma.movie.findMany({ select: { id: true, catalogId: true } });
    const byId = new Set(existing.map((m) => m.id));
    const byCatalogId = new Map(existing.filter((m) => m.catalogId).map((m) => [m.catalogId!.toLowerCase(), m.id]));

    let created = 0;
    const operations = parsedMovies.map((item) => {
      // Только заполненные в файле поля: пустая ячейка не затирает данные из админки
      const fields: Record<string, unknown> = {
        catalogId: item.catalogId,
        titleRu: item.titleRu,
        titleEn: item.titleEn,
        descriptionRu: item.descriptionRu,
        descriptionEn: item.descriptionEn,
        category: item.category,
        categorySlug: item.category ? getCategorySlug(item.category) : undefined,
        episodesCount: item.episodesCount,
        episodeDuration: item.episodeDuration,
        duration: item.duration,
        totalDurationMinutes: item.totalDurationMinutes,
        quality: item.quality,
        qualities: item.qualities,
        country: item.country,
        countries: item.countries,
        year: item.year,
        yearRange: item.yearRange,
        languages: item.languages,
        author: item.author,
        ageRating: item.ageRating,
        poster: item.poster,
        trailerUrl: item.trailerUrl,
        tags: item.tags,
        territory: item.territory,
        rightsPeriod: item.rightsPeriod,
      };
      const data = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))
      );

      const existingId =
        (item.id && byId.has(item.id) ? item.id : undefined) ||
        (item.catalogId ? byCatalogId.get(item.catalogId.toLowerCase()) : undefined);

      if (existingId) {
        return prisma.movie.update({ where: { id: existingId }, data });
      }

      created++;
      const slug = `title-${item.catalogId ? item.catalogId.toLowerCase() : crypto.randomUUID()}`;
      return prisma.movie.create({
        data: {
          ...(item.id ? { id: item.id } : {}),
          slug,
          titleRu: item.titleRu,
          titleEn: item.titleEn || item.titleRu,
          category: item.category || 'Природа',
          categorySlug: getCategorySlug(item.category || 'Природа'),
          ...data,
        },
      });
    });

    await prisma.$transaction(operations);
    const totalCount = await prisma.movie.count();

    logger.info('EXCEL_IMPORT_SUCCESS', {
      importedCount: parsedMovies.length,
      created,
      totalCount,
      filename: file.name,
    });

    return NextResponse.json({
      ok: true,
      importedCount: parsedMovies.length,
      created,
      updated: parsedMovies.length - created,
      totalCount,
    });
  } catch (error: any) {
    logger.error('EXCEL_IMPORT_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Ошибка импорта Excel файла: ' + error.message }, { status: 500 });
  }
}
