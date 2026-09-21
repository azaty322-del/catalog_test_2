import { NextResponse } from 'next/server';
import { exportCatalogToExcel, importCatalogFromExcel } from '@/lib/excel';
import { getAllMovies } from '@/lib/catalog';
import { logger } from '@/lib/logger';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'data.json');

export async function GET() {
  try {
    const movies = getAllMovies();
    const buffer = exportCatalogToExcel(movies);

    logger.info('EXCEL_EXPORT', { moviesCount: movies.length });

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
      return NextResponse.json({ error: 'В файле не найдено строк с фильмами' }, { status: 400 });
    }

    // Читаем текущий data.json
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

    // Объединяем/обновляем фильмы
    const mergedMovies = [...existingMovies];

    for (const item of parsedMovies) {
      const idx = mergedMovies.findIndex(
        (m: any) =>
          (item.id && String(m.id) === String(item.id)) ||
          m.title?.ru?.toLowerCase() === item.titleRu.toLowerCase() ||
          (typeof m.title === 'string' && m.title.toLowerCase() === item.titleRu.toLowerCase())
      );

      const movieObj = {
        id: item.id || (idx >= 0 ? mergedMovies[idx].id : `mv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
        title: { ru: item.titleRu, en: item.titleEn || item.titleRu },
        description: { ru: item.descriptionRu || '', en: item.descriptionEn || '' },
        category: item.category,
        year: item.year || 2024,
        quality: [item.quality || 'Full HD'],
        qualities: [item.quality || 'Full HD'],
        duration: item.duration || '30 мин',
        totalDurationMinutes: item.totalDurationMinutes || 30,
        country: [item.country || 'Россия'],
        countries: [item.country || 'Россия'],
        audioLang: item.languages || ['Русский'],
        languages: item.languages || ['Русский'],
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
