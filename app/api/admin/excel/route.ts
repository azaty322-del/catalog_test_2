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

    const operations = parsedMovies.map((item: any) => {
      const slug = item.slug || `title-${item.catalogId ? item.catalogId.toLowerCase() : crypto.randomUUID()}`;
      const catSlug = getCategorySlug(item.category || 'Природа');

      const payload = {
        catalogId: item.catalogId || null,
        titleRu: item.titleRu,
        titleEn: item.titleEn || item.titleRu,
        descriptionRu: item.descriptionRu || '',
        descriptionEn: item.descriptionEn || '',
        category: item.category,
        categorySlug: catSlug,
        episodesCount: Number(item.episodesCount) || 1,
        episodeDuration: item.episodeDuration ? String(item.episodeDuration) : '30',
        duration: item.duration || '30 мин',
        totalDurationMinutes: Number(item.totalDurationMinutes) || 30,
        quality: item.quality || 'HD / 4K',
        qualities: Array.isArray(item.qualities) ? item.qualities : [item.quality || 'HD / 4K'],
        country: item.country || 'Россия',
        countries: Array.isArray(item.countries) ? item.countries : [item.country || 'Россия'],
        year: Number(item.year) || 2024,
        yearRange: item.yearRange || String(item.year || 2024),
        languages: Array.isArray(item.languages) ? item.languages : ['Русский'],
        author: item.author || null,
        ageRating: item.ageRating || '12+',
        poster: item.poster || '',
        trailerUrl: item.trailerUrl || '',
        tags: Array.isArray(item.tags) ? item.tags : [],
        territory: item.territory || 'Весь мир',
        rightsPeriod: item.rightsPeriod || 'До 31.12.2028',
        status: 'Опубликован',
      };

      return prisma.movie.upsert({
        where: { slug },
        update: payload,
        create: {
          id: item.id ? String(item.id) : undefined,
          slug,
          ...payload,
        },
      });
    });

    await prisma.$transaction(operations);
    const totalCount = await prisma.movie.count();

    logger.info('EXCEL_IMPORT_SUCCESS', {
      importedCount: parsedMovies.length,
      totalCount,
      filename: file.name,
    });

    return NextResponse.json({
      ok: true,
      importedCount: parsedMovies.length,
      totalCount,
    });
  } catch (error: any) {
    logger.error('EXCEL_IMPORT_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Ошибка импорта Excel файла: ' + error.message }, { status: 500 });
  }
}
