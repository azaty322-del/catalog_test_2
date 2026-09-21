import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAllMovies } from '@/lib/catalog';
import { logger } from '@/lib/logger';

const dataFilePath = path.join(process.cwd(), 'data', 'data.json');

const CATEGORY_MAP = [
  { slug: 'nature', ru: 'Природа', synonyms: ['nature', 'природа', 'дикая природа'] },
  { slug: 'travel', ru: 'Путешествия', synonyms: ['travel', 'путешествия', 'туризм'] },
  { slug: 'culinary', ru: 'Кулинария и еда', synonyms: ['culinary', 'cooking', 'food', 'кулинария', 'кулинария и еда', 'еда'] },
  { slug: 'science', ru: 'Научпоп', synonyms: ['science', 'popular-science', 'popular_science', 'научпоп', 'наука'] },
  { slug: 'educational', ru: 'Познавательный', synonyms: ['educational', 'education', 'познавательный', 'познавательное'] },
  { slug: 'experts', ru: 'Эксперты', synonyms: ['experts', 'expert', 'эксперты'] },
  { slug: 'garden', ru: 'Дача и сад', synonyms: ['garden', 'dacha', 'дача и сад', 'дача', 'сад'] },
  { slug: 'kids', ru: 'Детям и подросткам', synonyms: ['kids', 'children', 'детям и подросткам', 'детям', 'подросткам'] },
  { slug: 'workout', ru: 'Тренировки', synonyms: ['workout', 'workouts', 'sport', 'sports', 'fitness', 'тренировки', 'спорт'] },
  { slug: 'on-demand', ru: 'Под запрос', synonyms: ['on-demand', 'on_demand', 'ondemand', 'request', 'custom', 'под запрос'] },
];

function normalizeToRussianCategory(val: any): string {
  if (!val) return 'Природа';
  const str = (typeof val === 'object' ? (val.ru || val.en || '') : String(val)).toLowerCase().trim();
  for (const item of CATEGORY_MAP) {
    if (item.synonyms.some((s) => str === s || str.includes(s) || s.includes(str))) {
      return item.ru;
    }
  }
  return typeof val === 'object' ? (val.ru || val.en || 'Природа') : String(val);
}

function getCategorySlug(val: any): string {
  if (!val) return 'nature';
  const str = (typeof val === 'object' ? (val.ru || val.en || '') : String(val)).toLowerCase().trim();
  for (const item of CATEGORY_MAP) {
    if (item.synonyms.some((s) => str === s || str.includes(s) || s.includes(str))) {
      return item.slug;
    }
  }
  return str;
}

function getCatalogFile() {
  if (!fs.existsSync(dataFilePath)) return { raw: {}, movies: [] };
  const raw = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
  const movies = Array.isArray(raw) ? raw : (raw.movies || raw.items || []);
  return { raw, movies };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids');
    const all = getAllMovies();
    if (idsParam) {
      const ids = idsParam.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const filtered = all.filter((m) => {
        const mId = String(m.id).toLowerCase();
        const mSlug = String(m.slug || '').toLowerCase();
        const mNum = parseInt(mId.replace(/\D/g, ''), 10);
        return ids.some((id) => {
          const idNum = parseInt(id, 10);
          return id === mId || id === mSlug || (!isNaN(mNum) && !isNaN(idNum) && mNum === idNum);
        });
      });
      return NextResponse.json({ movies: filtered });
    }
    return NextResponse.json({ movies: all });
  } catch {
    return NextResponse.json({ error: 'Ошибка чтения базы' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const incomingMovies = await req.json();
    const { raw, movies: existingMovies } = getCatalogFile();

    const updatedList = incomingMovies.map((item: any) => {
      const old = existingMovies.find((m: any) => String(m.id) === String(item.id)) || {};

      const titleRu = typeof item.title === 'object' ? item.title.ru : item.title;
      const titleEn = typeof item.title === 'object' ? item.title.en : (old.title?.en || titleRu);
      const durNum = parseInt(String(item.duration || '30'), 10) || 30;

      const catRu = normalizeToRussianCategory(item.category || old.category || 'Природа');
      const catSlug = getCategorySlug(catRu);

      return {
        ...old,
        ...item,
        id: String(item.id),
        title: { ru: titleRu, en: titleEn },
        category: catRu,
        categoryId: catSlug,
        episodeDuration: old.episodeDuration || { min: durNum, max: durNum },
        countries: item.country ? [item.country] : (old.countries || ['Россия']),
        languages: item.audioLang ? [item.audioLang] : (old.languages || ['Русский']),
        quality: item.quality ? [item.quality] : (old.quality || ['Full HD']),
        qualities: [item.quality || 'Full HD'],
        poster: item.poster || old.poster || '',
        image: item.poster || old.image || '',
        trailerUrl: item.trailerUrl || old.trailerUrl || '',
        stills: item.stills || old.stills || [],
        tags: item.tags || old.tags || [],
      };
    });

    let outputData: any;
    if (Array.isArray(raw)) {
      outputData = updatedList;
    } else {
      outputData = { ...raw, movies: updatedList };
    }

    fs.writeFileSync(dataFilePath, JSON.stringify(outputData, null, 2), 'utf-8');
    logger.info('MOVIE_CATALOG_UPDATED', { count: updatedList.length });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('MOVIE_CATALOG_UPDATE_ERROR', { error: error?.message });
    return NextResponse.json({ error: 'Ошибка сохранения базы' }, { status: 500 });
  }
}