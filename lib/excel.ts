import * as XLSX from 'xlsx';
import { CATEGORY_MAP, getCategorySlug } from './filters';

export interface ExcelMovieRow {
  id?: string;
  titleRu: string;
  titleEn?: string;
  descriptionRu?: string;
  descriptionEn?: string;
  category: string;
  year?: number;
  quality?: string;
  duration?: string;
  totalDurationMinutes?: number;
  country?: string;
  languages?: string[];
  ageRating?: string;
  territory?: string;
  rightsPeriod?: string;
  trailerUrl?: string;
  poster?: string;
  stills?: string[];
  tags?: string[];
}

/**
 * Экспортирует массив фильмов в буфер Excel (.xlsx) с разбивкой по листам категорий
 */
export function exportCatalogToExcel(movies: any[]): Buffer {
  const wb = XLSX.utils.book_new();

  // Группируем по 10 стандартным категориям
  for (const cat of CATEGORY_MAP) {
    const catMovies = movies.filter(
      (m) =>
        (m.category && m.category.toLowerCase().includes(cat.ru.toLowerCase())) ||
        (m.categorySlug && m.categorySlug === cat.slug)
    );

    const rows = catMovies.map((m) => {
      const titleRu = typeof m.title === 'object' ? (m.title.ru || m.titleRu || '') : (m.titleRu || m.title || '');
      const titleEn = typeof m.title === 'object' ? (m.title.en || m.titleEn || '') : (m.titleEn || '');
      const descRu = typeof m.description === 'object' ? (m.description.ru || m.descriptionRu || '') : (m.descriptionRu || m.description || '');

      return {
        'ID': m.id || '',
        'Название (RU)': titleRu,
        'Название (EN)': titleEn,
        'Описание': descRu,
        'Категория': cat.ru,
        'Год': m.year || 2024,
        'Качество': Array.isArray(m.qualities) ? m.qualities.join(', ') : (m.quality || 'Full HD'),
        'Хронометраж серии': m.duration || '30 мин',
        'Общий хронометраж (мин)': m.totalDurationMinutes || 30,
        'Страна': Array.isArray(m.countries) ? m.countries.join(', ') : (m.country || 'Россия'),
        'Язык аудио': Array.isArray(m.languages) ? m.languages.join(', ') : (m.audioLang || 'Русский'),
        'Возрастной рейтинг': m.ageRating || '12+',
        'Территория': m.territory || 'Весь мир',
        'Срок прав': m.rightsPeriod || 'До 31.12.2028',
        'Трейлер': m.trailerUrl || '',
        'Постер': m.poster || '',
        'Теги': Array.isArray(m.tags) ? m.tags.join(', ') : '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [
      {
        'ID': '',
        'Название (RU)': '',
        'Название (EN)': '',
        'Описание': '',
        'Категория': cat.ru,
        'Год': 2024,
        'Качество': 'Full HD',
        'Хронометраж серии': '30 мин',
        'Общий хронометраж (мин)': 30,
        'Страна': 'Россия',
        'Язык аудио': 'Русский',
        'Возрастной рейтинг': '12+',
        'Территория': 'Весь мир',
        'Срок прав': 'До 31.12.2028',
        'Трейлер': '',
        'Постер': '',
        'Теги': '',
      }
    ]);

    // Ограничиваем длину названия листа до 31 символа (стандарт Excel)
    const sheetName = cat.ru.length > 31 ? cat.ru.substring(0, 31) : cat.ru;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Парсит загруженный Excel (.xlsx) файл и возвращает нормализованный список фильмов
 */
export function importCatalogFromExcel(buffer: Buffer): ExcelMovieRow[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const results: ExcelMovieRow[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const titleRu = String(row['Название (RU)'] || row['Название'] || row['Title'] || '').trim();
      if (!titleRu) continue;

      const titleEn = String(row['Название (EN)'] || row['Title EN'] || '').trim() || titleRu;
      const desc = String(row['Описание'] || row['Description'] || '').trim();
      const catName = String(row['Категория'] || sheetName || 'Природа').trim();

      const yearNum = parseInt(String(row['Год'] || '2024').replace(/\D/g, '').substring(0, 4), 10) || 2024;
      const totalDur = parseInt(String(row['Общий хронометраж (мин)'] || row['Хрон общий'] || '30').replace(/\D/g, ''), 10) || 30;

      results.push({
        id: row['ID'] ? String(row['ID']).trim() : undefined,
        titleRu,
        titleEn,
        descriptionRu: desc,
        descriptionEn: desc,
        category: catName,
        year: yearNum,
        quality: String(row['Качество'] || 'Full HD').trim(),
        duration: String(row['Хронометраж серии'] || row['Хрон серии'] || '30 мин').trim(),
        totalDurationMinutes: totalDur,
        country: String(row['Страна'] || 'Россия').trim(),
        languages: [String(row['Язык аудио'] || row['Язык'] || 'Русский').trim()],
        ageRating: String(row['Возрастной рейтинг'] || '12+').trim(),
        territory: String(row['Территория'] || 'Весь мир').trim(),
        rightsPeriod: String(row['Срок прав'] || 'До 31.12.2028').trim(),
        trailerUrl: String(row['Трейлер'] || '').trim(),
        poster: String(row['Постер'] || '').trim(),
        tags: row['Теги'] ? String(row['Теги']).split(',').map((t) => t.trim()).filter(Boolean) : [],
      });
    }
  }

  return results;
}
