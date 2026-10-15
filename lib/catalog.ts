import fs from 'fs';
import path from 'path';
import fallbackData from '@/data/data.json';
import { Movie, Category } from '@/types/catalog';
import { filterMovies, getCategorySlug, CATEGORY_MAP, CatalogFilterParams } from './filters';
import { prisma, isDatabaseConfigured } from './prisma';

export { getCategorySlug, CATEGORY_MAP };

function getRawMovies(): any[] {
  try {
    const dataFilePath = path.join(process.cwd(), 'data', 'data.json');
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf-8');
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : (parsed.movies || parsed.items || []);
    }
  } catch {
    // fallback к статическому кэшу при ошибке файловой системы
  }

  return Array.isArray((fallbackData as any).movies)
    ? (fallbackData as any).movies
    : Array.isArray(fallbackData)
    ? fallbackData
    : [];
}

export function getAllMovies(): Movie[] {
  const rawList = getRawMovies();

  return rawList.map((m: any, idx: number) => {
    const rawCat = m.category || m.categoryId || 'Природа';
    return {
      ...m,
      id: String(m.id || idx + 1),
      catalogId: m.catalogId || undefined,
      slug: m.slug || `title-${m.catalogId ? m.catalogId.toLowerCase() : idx + 1}`,
      title: {
        ru: typeof m.title === 'object' ? (m.title.ru || m.title.en || 'Без названия') : (m.title || 'Без названия'),
        en: (m._rawTitle && m._rawTitle.en)
          ? m._rawTitle.en
          : (typeof m.title === 'object' && m.title.en && m.title.en !== m.title.ru
              ? m.title.en
              : (typeof m.title === 'object' ? m.title.ru : m.title || 'Untitled')),
      },
      description: typeof m.description === 'object' && m.description !== null
        ? m.description
        : { ru: m.description || '', en: (m._rawDescription && m._rawDescription.en) || m.description || '' },
      category: rawCat,
      categorySlug: getCategorySlug(rawCat),
      poster: m.poster || m.image || '/placeholder.png',
      year: Number(m.year || m.yearFrom) || 2024,
      yearRange: m.yearRange || String(m.year || 2024),
      author: m.author || '',
      quality: Array.isArray(m.qualities)
        ? m.qualities[0]
        : Array.isArray(m.quality)
        ? m.quality[0]
        : m.quality || 'HD / 4K',
      qualities: Array.isArray(m.qualities)
        ? m.qualities
        : m.quality
        ? (Array.isArray(m.quality) ? m.quality : [m.quality])
        : ['HD', '4K'],
      episodes: Number(m.episodesCount || m.episodes) || 1,
      episodesCount: Number(m.episodesCount || m.episodes) || 1,
      episodeDuration: m.episodeDuration || { min: 30, max: 30 },
      duration:
        typeof m.duration === 'string'
          ? m.duration
          : `${m.episodeDuration?.max || 30} мин`,
      totalDurationMinutes: Number(m.totalDurationMinutes) || 30,
      tags: Array.isArray(m.tags) ? m.tags : [],
      countries: Array.isArray(m.countries)
        ? m.countries
        : m.country
        ? (Array.isArray(m.country) ? m.country : [m.country])
        : ['Россия'],
      country: Array.isArray(m.countries)
        ? m.countries[0]
        : (Array.isArray(m.country) ? m.country[0] : m.country || 'Россия'),
      ageRating: m.ageRating || '12+',
      stills: Array.isArray(m.stills) ? m.stills : [],
      trailerUrl:
        m.trailerUrl ||
        (typeof m.trailer === 'string' ? m.trailer : m.trailer?.url) ||
        '',
    };
  });
}

export interface CatalogResult {
  items: Movie[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface FilterValues {
  [key: string]: any;
}

export function getCategories(): Category[] {
  const allMovies = getAllMovies();
  return CATEGORY_MAP.map((cat) => {
    const catMovies = allMovies.filter(
      (m) => getCategorySlug(m.category) === cat.slug
    );
    const firstWithPoster = catMovies.find(
      (m) => m.poster && m.poster !== '/placeholder.png'
    );
    return {
      id: cat.slug,
      slug: cat.slug,
      name: cat.ru,
      title: { ru: cat.ru, en: cat.en || cat.ru },
      showInNav: true,
      isEmpty: catMovies.length === 0,
      count: catMovies.length,
      image: firstWithPoster ? firstWithPoster.poster : '/placeholder.png',
    } as unknown as Category;
  });
}

export function getCategoryBySlug(slug: string): Category | null {
  const categories = getCategories();
  return categories.find((c) => c.slug === slug) || null;
}

export function getFilterValues(_categorySlug?: string): FilterValues {
  return {};
}

export async function findMovies({
  category,
  search,
  filters = {},
  page = 1,
  limit = 12,
}: {
  category?: string;
  search?: string;
  filters?: CatalogFilterParams;
  page?: number;
  limit?: number;
}): Promise<CatalogResult> {
  const combinedFilters: CatalogFilterParams = { ...filters };
  if (category) combinedFilters.category = category;
  if (search) combinedFilters.q = search;

  let all: Movie[] = [];

  // Попытка чтения из PostgreSQL через Prisma
  if (isDatabaseConfigured()) {
    try {
      const dbMovies = await prisma.movie.findMany({
        orderBy: { createdAt: 'asc' },
      });

      if (dbMovies && dbMovies.length > 0) {
        all = dbMovies.map((m) => {
          let epDur: any = { min: 30, max: 30 };
          if (m.episodeDuration) {
            if (m.episodeDuration.includes('-')) {
              const parts = m.episodeDuration.split('-').map((p) => parseInt(p, 10));
              epDur = { min: parts[0] || 30, max: parts[1] || parts[0] || 30 };
            } else {
              const num = parseInt(m.episodeDuration, 10);
              if (!isNaN(num)) epDur = { min: num, max: num };
            }
          }

          return {
            id: m.id,
            catalogId: m.catalogId || undefined,
            slug: m.slug,
            title: { ru: m.titleRu, en: m.titleEn },
            description: { ru: m.descriptionRu, en: m.descriptionEn },
            category: m.category,
            categorySlug: m.categorySlug,
            episodes: m.episodesCount,
            episodesCount: m.episodesCount,
            episodeDuration: epDur,
            duration: m.duration,
            totalDurationMinutes: m.totalDurationMinutes,
            quality: m.qualities[0] || m.quality || 'HD / 4K',
            qualities: m.qualities,
            country: m.countries[0] || m.country || 'Россия',
            countries: m.countries,
            year: m.year,
            yearRange: m.yearRange || String(m.year),
            languages: m.languages,
            author: m.author || '',
            ageRating: m.ageRating,
            poster: m.poster || '/placeholder.png',
            trailerUrl: m.trailerUrl,
            stills: m.stills,
            tags: m.tags,
            territory: m.territory,
            rightsPeriod: m.rightsPeriod,
            status: m.status,
            views: m.views,
          } as unknown as Movie;
        });
      }
    } catch (e) {
      // Игнорируем ошибку и берем из локальных данных
    }
  }

  if (all.length === 0) {
    all = getAllMovies();
  }

  const filtered = filterMovies(all, combinedFilters);
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));
  const offset = (safePage - 1) * limit;
  const items = filtered.slice(offset, offset + limit);

  return {
    items,
    total,
    page: safePage,
    totalPages,
    limit,
  };
}

export function getMovieBySlug(slug: string): Movie | null {
  const all = getAllMovies();
  return all.find((m) => m.slug === slug || String(m.id) === slug || String((m as any).catalogId).toLowerCase() === slug.toLowerCase()) || null;
}

export async function getRelatedMovies(movie: Movie, limit = 4): Promise<Movie[]> {
  const all = getAllMovies();
  const targetCategory = getCategorySlug(
    (movie as any).category || (movie as any).categoryId || (movie as any).categorySlug
  );

  // Тайтлы из той же категории, исключая текущий
  const sameCategory = all.filter(
    (m) =>
      String(m.id) !== String(movie.id) &&
      getCategorySlug((m as any).category || (m as any).categoryId || (m as any).categorySlug) === targetCategory
  );

  if (sameCategory.length >= limit) {
    return sameCategory.slice(0, limit);
  }

  // Если в этой категории тайтлов меньше, дополняем остальными тайтлами каталога
  const others = all.filter(
    (m) =>
      String(m.id) !== String(movie.id) &&
      !sameCategory.some((sc) => String(sc.id) === String(m.id))
  );

  return [...sameCategory, ...others].slice(0, limit);
}