import type { Movie as DbMovie } from '@prisma/client';
import { Movie, Category } from '@/types/catalog';
import { filterMovies, getCategorySlug, CATEGORY_MAP, CatalogFilterParams } from './filters';
import { prisma } from './prisma';

export { getCategorySlug, CATEGORY_MAP };

// Единственный источник данных каталога — PostgreSQL
function fromDb(m: DbMovie): Movie {
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
}

export async function getAllMovies(): Promise<Movie[]> {
  const rows = await prisma.movie.findMany({ orderBy: { createdAt: 'asc' } });
  return rows.map(fromDb);
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

export async function getCategories(): Promise<Category[]> {
  const allMovies = await getAllMovies();
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

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
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

  const all = await getAllMovies();

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

export async function getMovieBySlug(slug: string): Promise<Movie | null> {
  const m = await prisma.movie.findFirst({
    where: { OR: [{ slug }, { id: slug }, { catalogId: { equals: slug, mode: 'insensitive' } }] },
  });
  return m ? fromDb(m) : null;
}

export async function getRelatedMovies(movie: Movie, limit = 4): Promise<Movie[]> {
  const all = await getAllMovies();
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