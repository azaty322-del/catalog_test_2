import * as XLSX from 'xlsx';
import { CATEGORY_MAP, getCategorySlug } from './filters';

export interface ExcelMovieRow {
  id?: string;
  catalogId?: string;
  titleRu: string;
  titleEn?: string;
  descriptionRu?: string;
  descriptionEn?: string;
  category: string;
  year?: number;
  yearRange?: string;
  author?: string;
  episodesCount?: number;
  episodeDuration?: string;
  quality?: string;
  qualities?: string[];
  duration?: string;
  totalDurationMinutes?: number;
  country?: string;
  countries?: string[];
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

const clean = (value: unknown): string => String(value ?? '').replace(/\s+/g, ' ').trim();

const splitMulti = (value: string): string[] =>
  value.split('/').map((s) => s.trim()).filter(Boolean);

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Общая длительность из таблицы заказчика. Ячейка приходит как время Excel
 * («3:48:55», «51:20:05» — часы могут быть больше 24) или числом часов («2», «0.5»).
 * Число часов заказчик пишет округлённо (19 серий × 9 мин записано как «3»),
 * поэтому, если длительность серии одна, точнее посчитать серии × длительность.
 */
function parseTotalDuration(
  text: string,
  episodes: number,
  episodeRange?: string
): { minutes: number; display: string } | null {
  let seconds: number;
  const [epMin, epMax] = (episodeRange || '').split('-').map(Number);
  const timeSeconds = text.includes(':')
    ? text.split(':').map((p) => parseFloat(p) || 0).reduce((acc, p, i) => acc + p * [3600, 60, 1][i], 0)
    : NaN;

  // Время меньше минуты — опечатка в таблице («0:00:30» при 6 × 10 мин)
  if (timeSeconds >= 60) {
    seconds = Math.round(timeSeconds);
  } else if (episodes > 0 && epMin > 0 && (epMin === epMax || !isNaN(timeSeconds))) {
    seconds = episodes * epMin * 60;
  } else {
    const hours = parseFloat(text.replace(',', '.'));
    if (isNaN(hours)) return null;
    seconds = Math.round(hours * 3600);
  }
  return {
    minutes: Math.floor(seconds / 60),
    display: `${pad2(Math.floor(seconds / 3600))}:${pad2(Math.floor(seconds / 60) % 60)}:${pad2(seconds % 60)}`,
  };
}

/** «15-23», «18—22», «30» → «min-max» */
function parseRange(text: string): string | undefined {
  const nums = (text.match(/\d+/g) || []).map(Number);
  if (nums.length === 0) return undefined;
  return `${Math.min(...nums)}-${Math.max(...nums)}`;
}

// Лист заказчика: первая строка — заголовки «Название … АЙДИ», колонки по позициям
function isCustomerSheet(header: unknown[] = []): boolean {
  const cells = header.map((c) => clean(c).toLowerCase());
  return cells[0] === 'название' && cells.includes('айди');
}

/**
 * Разбор таблицы заказчика («Каталог_контента_UTV_Media.xlsx»): лист = категория.
 * Пустые ячейки не попадают в результат, чтобы импорт не затирал то, что уже
 * заполнено в админке (английские названия, теги, постеры).
 */
function parseCustomerSheet(sheetName: string, rows: unknown[][]): ExcelMovieRow[] {
  const results: ExcelMovieRow[] = [];

  for (const row of rows.slice(1)) {
    const cell = (i: number) => clean(row[i]);
    const titleRu = cell(0);
    const catalogId = cell(15);
    if (!titleRu || !catalogId) continue;

    const episodes = parseInt(cell(2), 10);
    const episodeDuration = parseRange(cell(3));
    const total = parseTotalDuration(cell(4), episodes, episodeDuration);
    const yearRange = cell(7);
    const year = parseInt((yearRange.match(/\d{4}/) || [])[0] || '', 10);
    const rights = cell(13);
    const tags = cell(14);

    const item: ExcelMovieRow = {
      catalogId,
      titleRu,
      descriptionRu: cell(1),
      category: sheetName.trim(),
      episodesCount: isNaN(episodes) ? undefined : episodes,
      episodeDuration,
      totalDurationMinutes: total?.minutes,
      duration: total?.display,
      qualities: cell(5) ? splitMulti(cell(5)) : undefined,
      countries: cell(6) ? splitMulti(cell(6)) : undefined,
      year: isNaN(year) ? undefined : year,
      yearRange: yearRange || undefined,
      languages: cell(8) ? splitMulti(cell(8)) : undefined,
      author: cell(9) || undefined,
      ageRating: cell(10) || undefined,
      trailerUrl: cell(11) || undefined,
      territory: cell(12) || undefined,
      rightsPeriod: rights && rights !== '-' ? rights : undefined,
      tags: tags && tags !== '-' ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
    };
    item.quality = item.qualities?.[0];
    item.country = item.countries?.[0];
    results.push(item);
  }

  return results;
}

/**
 * Парсит загруженный Excel (.xlsx) файл и возвращает нормализованный список фильмов.
 * Понимает два формата: таблицу заказчика и собственный экспорт админки.
 */
export function importCatalogFromExcel(buffer: Buffer): ExcelMovieRow[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const results: ExcelMovieRow[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];

    // raw: false — берём текст, как его видно в Excel («3:48:55»), а не долю суток
    const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, blankrows: false });
    if (isCustomerSheet(grid[0])) {
      results.push(...parseCustomerSheet(sheetName, grid));
      continue;
    }

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
