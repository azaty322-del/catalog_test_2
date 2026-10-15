import { NextResponse } from 'next/server';
import { exportCatalogToExcel, importCatalogFromExcel } from '@/lib/excel';
import { getAllMovies } from '@/lib/catalog';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getCategorySlug } from '@/lib/filters';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'data.json');

export async function GET() {
  try {
    let moviesList: any[] = [];

    // 1. Попытка выгрузки из PostgreSQL через Prisma
    if (isDatabaseConfigured()) {
      try {
        const dbMovies = await prisma.movie.findMany({
          orderBy: { createdAt: 'asc' },
        });

        if (dbMovies && dbMovies.length > 0) {
          moviesList = dbMovies.map((m) => ({
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
        }
      } catch (dbErr) {
        console.warn('[API/excel] Ошибка чтения из Prisma:', dbErr);
      }
    }

    if (moviesList.length === 0) {
      moviesList = getAllMovies();
    }

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

    // 1. Сохранение в PostgreSQL через Prisma
    if (isDatabaseConfigured()) {
      try {
        const operations = parsedMovies.map((item: any) => {
          const slug = item.slug || `title-${item.catalogId ? item.catalogId.toLowerCase() : Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
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
        logger.info('EXCEL_PRISMA_IMPORTED', { count: parsedMovies.length });
      } catch (dbErr: any) {
        logger.warn('EXCEL_PRISMA_IMPORT_FAILED', { error: dbErr?.message });
      }
    }

    // 2. Читаем и обновляем локальный data.json
    let raw: any = {};
    let existingMovies: any[] = [];
    if (fs.existsSync(dataFilePath)) {
      try {
        raw = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
        existingMovies = Array.isArray(raw) ? raw : (raw.movies || raw.items || []);
      } catch {
        existingMovies = [];
      }
    }

    const mergedMovies = [...existingMovies];

    for (const item of parsedMovies) {
      const idx = mergedMovies.findIndex(
        (m: any) =>
          (item.id && String(m.id) === String(item.id)) ||
          (item.catalogId && m.catalogId === item.catalogId) ||
          m.title?.ru?.toLowerCase() === item.titleRu.toLowerCase() ||
          (typeof m.title === 'string' && m.title.toLowerCase() === item.titleRu.toLowerCase())
      );

      const movieObj = {
        id: item.id || (idx >= 0 ? mergedMovies[idx].id : `mv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
        catalogId: item.catalogId || (idx >= 0 ? mergedMovies[idx].catalogId : undefined),
        title: { ru: item.titleRu, en: item.titleEn || item.titleRu },
        description: { ru: item.descriptionRu || '', en: item.descriptionEn || '' },
        category: item.category,
        categoryId: getCategorySlug(item.category),
        categorySlug: getCategorySlug(item.category),
        year: item.year || 2024,
        yearRange: item.yearRange || String(item.year || 2024),
        quality: [item.quality || 'HD / 4K'],
        qualities: [item.quality || 'HD / 4K'],
        duration: item.duration || '30 мин',
        totalDurationMinutes: item.totalDurationMinutes || 30,
        country: [item.country || 'Россия'],
        countries: [item.country || 'Россия'],
        audioLang: item.languages || ['Русский'],
        languages: item.languages || ['Русский'],
        author: item.author || '',
        ageRating: item.ageRating || '12+',
        territory: item.territory || 'Весь мир',
        rightsPeriod: item.rightsPeriod || 'До 31.12.2028',
        trailerUrl: item.trailerUrl || '',
        poster: item.poster || (idx >= 0 ? mergedMovies[idx].poster : '/placeholder.png'),
        tags: item.tags || [],
      };

      if (idx >= 0) {
        mergedMovies[idx] = { ...mergedMovies[idx], ...movieObj };
      } else {
        mergedMovies.push(movieObj);
      }
    }

    const outputData = Array.isArray(raw) ? mergedMovies : { ...raw, movies: mergedMovies };
    fs.writeFileSync(dataFilePath, JSON.stringify(outputData, null, 2), 'utf-8');

    logger.info('EXCEL_IMPORT_SUCCESS', {
      importedCount: parsedMovies.length,
      totalCount: mergedMovies.length,
      filename: file.name,
    });

    return NextResponse.json({
      ok: true,
      importedCount: parsedMovies.length,
      totalCount: mergedMovies.length,
    });
  } catch (error: any) {
    logger.error('EXCEL_IMPORT_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Ошибка импорта Excel файла: ' + error.message }, { status: 500 });
  }
}
