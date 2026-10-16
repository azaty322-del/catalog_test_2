import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getCategorySlug } from '@/lib/filters';

// Преобразование модели Prisma Movie в объект, совместимый с фронтендом
function formatMovieFromPrisma(m: any) {
  return {
    id: m.id,
    catalogId: m.catalogId || undefined,
    slug: m.slug,
    title: {
      ru: m.titleRu,
      en: m.titleEn || m.titleRu,
    },
    description: {
      ru: m.descriptionRu || '',
      en: m.descriptionEn || m.descriptionRu || '',
    },
    category: m.category,
    categorySlug: m.categorySlug,
    categoryId: m.categorySlug,
    episodes: m.episodesCount,
    episodesCount: m.episodesCount,
    episodeDuration: m.episodeDuration
      ? (m.episodeDuration.includes('-')
          ? { min: parseInt(m.episodeDuration.split('-')[0], 10) || 30, max: parseInt(m.episodeDuration.split('-')[1], 10) || 30 }
          : { min: parseInt(m.episodeDuration, 10) || 30, max: parseInt(m.episodeDuration, 10) || 30 })
      : { min: 30, max: 30 },
    duration: m.duration,
    totalDurationMinutes: m.totalDurationMinutes,
    quality: m.qualities || [m.quality || 'HD / 4K'],
    qualities: m.qualities || [m.quality || 'HD / 4K'],
    country: m.countries?.[0] || m.country || 'Россия',
    countries: m.countries || ['Россия'],
    year: m.year,
    yearRange: m.yearRange || String(m.year),
    languages: m.languages || ['Русский'],
    author: m.author || '',
    ageRating: m.ageRating || '12+',
    poster: m.poster || '/placeholder.png',
    image: m.poster || '/placeholder.png',
    trailerUrl: m.trailerUrl || '',
    stills: m.stills || [],
    tags: m.tags || [],
    territory: m.territory || 'Весь мир',
    rightsPeriod: m.rightsPeriod || 'До 31.12.2028',
    status: m.status || 'Опубликован',
    views: m.views || 0,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids');
    const categoryParam = searchParams.get('category');
    const queryParam = searchParams.get('q');

    const whereClause: any = {};

    if (categoryParam) {
      whereClause.categorySlug = getCategorySlug(categoryParam);
    }

    if (queryParam) {
      whereClause.OR = [
        { titleRu: { contains: queryParam, mode: 'insensitive' } },
        { titleEn: { contains: queryParam, mode: 'insensitive' } },
        { descriptionRu: { contains: queryParam, mode: 'insensitive' } },
      ];
    }

    const dbMovies = await prisma.movie.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
    });

    let result = dbMovies.map(formatMovieFromPrisma);

    if (idsParam) {
      const ids = idsParam.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      result = result.filter((m) => {
        const mId = String(m.id).toLowerCase();
        const mSlug = String(m.slug || '').toLowerCase();
        const mAid = String(m.catalogId || '').toLowerCase();
        return ids.some((id) => id === mId || id === mSlug || id === mAid);
      });
    }

    return NextResponse.json({ movies: result });
  } catch (error: any) {
    logger.error('MOVIES_GET_ERROR', { error: error?.message });
    return NextResponse.json({ error: 'Ошибка получения тайтлов' }, { status: 500 });
  }
}

// Поле БД → ключи входящего объекта, из которых оно вычисляется
const FIELD_SOURCES: Record<string, string[]> = {
  catalogId: ['catalogId'],
  titleRu: ['title', 'titleRu'],
  titleEn: ['title', 'titleEn'],
  descriptionRu: ['description', 'descriptionRu'],
  descriptionEn: ['description', 'descriptionEn'],
  category: ['category'],
  categorySlug: ['category', 'categorySlug'],
  episodesCount: ['episodesCount', 'episodes'],
  episodeDuration: ['episodeDuration'],
  duration: ['duration'],
  totalDurationMinutes: ['totalDurationMinutes'],
  status: ['status'],
  quality: ['qualities', 'quality'],
  qualities: ['qualities', 'quality'],
  country: ['countries', 'country'],
  countries: ['countries', 'country'],
  year: ['year'],
  yearRange: ['yearRange'],
  languages: ['languages', 'audioLang'],
  author: ['author'],
  ageRating: ['ageRating'],
  poster: ['poster', 'image'],
  trailerUrl: ['trailerUrl'],
  stills: ['stills'],
  tags: ['tags'],
  territory: ['territory'],
  rightsPeriod: ['rightsPeriod'],
  views: ['views'],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incomingList = Array.isArray(body) ? body : [body];

    const operations = incomingList.map((item: any) => {
      const titleRu = (typeof item.title === 'object' ? item.title?.ru : item.title) || item.titleRu || 'Без названия';
      const titleEn = (typeof item.title === 'object' ? item.title?.en : item.titleEn) || titleRu;
      const descRu = typeof item.description === 'object' ? item.description.ru : (item.descriptionRu || item.description || '');
      const descEn = typeof item.description === 'object' ? item.description.en : (item.descriptionEn || descRu);
      const id = item.id ? String(item.id) : crypto.randomUUID();
      const slug = item.slug || `title-${item.catalogId ? item.catalogId.toLowerCase() : id}`;
      const catSlug = getCategorySlug(item.category || item.categorySlug || 'Природа');

      const movieData = {
        catalogId: item.catalogId || null,
        titleRu,
        titleEn,
        descriptionRu: descRu,
        descriptionEn: descEn,
        category: item.category || 'Природа',
        categorySlug: catSlug,
        episodesCount: Number(item.episodesCount || item.episodes) || 1,
        episodeDuration: typeof item.episodeDuration === 'object' && item.episodeDuration
          ? `${item.episodeDuration.min}-${item.episodeDuration.max}`
          : String(item.episodeDuration || '30'),
        duration: String(item.duration || '30 мин'),
        totalDurationMinutes: Number(item.totalDurationMinutes) || 30,
        status: item.status || 'Опубликован',
        quality: Array.isArray(item.qualities) ? item.qualities[0] : (item.quality || 'HD / 4K'),
        qualities: Array.isArray(item.qualities) ? item.qualities : [item.quality || 'HD / 4K'],
        country: Array.isArray(item.countries) ? item.countries[0] : (item.country || 'Россия'),
        countries: Array.isArray(item.countries) ? item.countries : [item.country || 'Россия'],
        year: Number(item.year) || 2024,
        yearRange: item.yearRange || String(item.year || 2024),
        languages: Array.isArray(item.languages) ? item.languages : (item.audioLang ? [item.audioLang] : ['Русский']),
        author: item.author || null,
        ageRating: item.ageRating || '12+',
        poster: item.poster || item.image || '',
        trailerUrl: item.trailerUrl || '',
        stills: Array.isArray(item.stills) ? item.stills : [],
        tags: Array.isArray(item.tags) ? item.tags : [],
        territory: item.territory || 'Весь мир',
        rightsPeriod: item.rightsPeriod || 'До 31.12.2028',
        views: Number(item.views) || 0,
      };

      // При обновлении трогаем только поля, которые реально пришли (форма админки шлёт не все)
      const update = Object.fromEntries(
        Object.entries(movieData).filter(([key]) => FIELD_SOURCES[key].some((src) => item[src] !== undefined))
      );

      // id — стабильный ключ (админка не присылает slug)
      return prisma.movie.upsert({
        where: { id },
        update,
        create: { id, slug, ...movieData },
      });
    });

    await prisma.$transaction(operations);
    logger.info('MOVIES_PRISMA_UPSERTED', { count: incomingList.length });

    return NextResponse.json({ success: true, count: incomingList.length });
  } catch (error: any) {
    logger.error('MOVIES_POST_ERROR', { error: error?.message });
    return NextResponse.json({ error: 'Ошибка сохранения тайтлов', details: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    if (!id && !slug) {
      return NextResponse.json({ error: 'Укажите id или slug для удаления' }, { status: 400 });
    }

    await prisma.movie.deleteMany({ where: id ? { id } : { slug: slug! } });
    logger.info('MOVIE_PRISMA_DELETED', { id, slug });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('MOVIE_DELETE_ERROR', { error: error?.message });
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 });
  }
}