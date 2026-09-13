import { Movie } from '@/types/catalog';

export interface CatalogFilterParams {
  [key: string]: string | string[] | undefined;
}

export interface CategoryMapping {
  slug: string;
  ru: string;
  en: string;
  synonyms: string[];
}

export const CATEGORY_MAP: CategoryMapping[] = [
  { slug: 'nature', ru: 'Природа', en: 'Nature', synonyms: ['nature', 'природа', 'дикая природа'] },
  { slug: 'travel', ru: 'Путешествия', en: 'Travel', synonyms: ['travel', 'путешествия', 'туризм'] },
  { slug: 'culinary', ru: 'Кулинария и еда', en: 'Cooking & Food', synonyms: ['culinary', 'cooking', 'food', 'кулинария', 'кулинария и еда', 'еда'] },
  { slug: 'science', ru: 'Научпоп', en: 'Science', synonyms: ['science', 'popular-science', 'popular_science', 'научпоп', 'наука'] },
  { slug: 'educational', ru: 'Познавательный', en: 'Educational', synonyms: ['educational', 'education', 'познавательный', 'познавательное'] },
  { slug: 'experts', ru: 'Эксперты', en: 'Experts', synonyms: ['experts', 'expert', 'эксперты'] },
  { slug: 'garden', ru: 'Дача и сад', en: 'Home & Garden', synonyms: ['garden', 'dacha', 'дача и сад', 'дача', 'сад'] },
  { slug: 'kids', ru: 'Детям и подросткам', en: 'Kids & Teens', synonyms: ['kids', 'children', 'детям и подросткам', 'детям', 'подросткам'] },
  { slug: 'workout', ru: 'Тренировки', en: 'Workouts', synonyms: ['workout', 'workouts', 'sport', 'sports', 'fitness', 'тренировки', 'спорт'] },
  { slug: 'on-demand', ru: 'Под запрос', en: 'On Demand', synonyms: ['on-demand', 'on_demand', 'ondemand', 'request', 'custom', 'под запрос'] },
];

export function parseFilters(searchParams: Record<string, string | string[] | undefined>): CatalogFilterParams {
  const result: CatalogFilterParams = {};
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export function getCategorySlug(val: any): string {
  if (!val) return 'nature';
  const str = (typeof val === 'object' ? (val.slug || val.ru || val.en || '') : String(val)).toLowerCase().trim();
  for (const item of CATEGORY_MAP) {
    if (item.slug === str || item.synonyms.some((s) => str === s || str.includes(s) || s.includes(str))) {
      return item.slug;
    }
  }
  return str;
}

function parseDurationMinutes(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object') {
    if (val.max) return Number(val.max) || 0;
    if (val.total) return Number(val.total) || 0;
  }
  const str = String(val).toLowerCase();
  let total = 0;
  const hoursMatch = str.match(/(\d+)\s*(?:ч|h|час)/);
  if (hoursMatch) {
    total += parseInt(hoursMatch[1], 10) * 60;
  }
  const minsMatch = str.match(/(\d+)\s*(?:м|min|мин)/);
  if (minsMatch) {
    total += parseInt(minsMatch[1], 10);
  } else if (!hoursMatch) {
    const numOnly = parseInt(str.replace(/\D/g, ''), 10);
    if (!isNaN(numOnly)) total = numOnly;
  }
  return total;
}

function getMovieQualities(m: any): string[] {
  const list: string[] = [];
  if (Array.isArray(m.qualities)) list.push(...m.qualities);
  if (Array.isArray(m.quality)) list.push(...m.quality);
  if (typeof m.quality === 'string') list.push(m.quality);
  return list.map((q) => String(q).toLowerCase());
}

function getMovieCountries(m: any): string[] {
  const list: string[] = [];
  if (Array.isArray(m.countries)) list.push(...m.countries);
  if (typeof m.country === 'string') list.push(m.country);
  if (typeof m.country === 'object' && m.country) {
    if (m.country.ru) list.push(m.country.ru);
    if (m.country.en) list.push(m.country.en);
  }
  return list.map((c) => String(c).toLowerCase());
}

export function filterMovies(movies: Movie[], filters: CatalogFilterParams): Movie[] {
  return movies.filter((movie: any) => {
    // 1. Поиск: название, описание, теги (#водопад), страна
    if (filters.q && typeof filters.q === 'string' && filters.q.trim()) {
      const q = filters.q.toLowerCase().replace(/^#/, '').trim();

      const titleRu = typeof movie.title === 'object' ? movie.title.ru : movie.title;
      const titleEn = typeof movie.title === 'object' ? movie.title.en : '';
      const descRu = typeof movie.description === 'object' ? movie.description.ru : movie.description;
      const descEn = typeof movie.description === 'object' ? movie.description.en : '';

      const tags: string[] = Array.isArray(movie.tags)
        ? movie.tags.map((t: any) => String(t).toLowerCase().replace(/^#/, '').trim())
        : [];

      const countries = getMovieCountries(movie);

      const matchTitle = (titleRu && titleRu.toLowerCase().includes(q)) ||
                         (titleEn && titleEn.toLowerCase().includes(q));
      const matchDesc = (descRu && descRu.toLowerCase().includes(q)) ||
                        (descEn && descEn.toLowerCase().includes(q));
      const matchTag = tags.some((t) => t.includes(q) || q.includes(t));
      const matchCountry = countries.some((c) => c.includes(q));

      if (!matchTitle && !matchDesc && !matchTag && !matchCountry) {
        return false;
      }
    }

    // 2. Категория
    if (filters.category && typeof filters.category === 'string') {
      const targetSlug = getCategorySlug(filters.category);
      const movieCatSlug = getCategorySlug(movie.category || movie.categoryId || movie.categorySlug);
      if (movieCatSlug !== targetSlug) {
        return false;
      }
    }

    // 3. Качество (4K, Full HD, HD)
    if (filters.quality && typeof filters.quality === 'string') {
      const target = filters.quality.toLowerCase().trim();
      const qualities = getMovieQualities(movie);
      const match = qualities.some((q) => {
        if (target === '4k') return q.includes('4k');
        if (target === 'full hd') return q.includes('full hd') || q.includes('1080');
        if (target === 'hd') return q === 'hd' || q.includes('720');
        return q.includes(target);
      });
      if (!match) return false;
    }

    // 4. Год
    if (filters.year && typeof filters.year === 'string') {
      const y = Number(movie.year || movie.yearFrom) || 0;
      if (filters.year === '2020-') {
        if (y <= 0 || y > 2020) return false;
      } else {
        if (y !== Number(filters.year)) return false;
      }
    }

    // 5. Возрастной рейтинг
    if (filters.age && typeof filters.age === 'string') {
      const age = String(movie.ageRating || '').trim();
      if (age !== filters.age.trim()) return false;
    }

    // 6. Страна
    if (filters.country && typeof filters.country === 'string') {
      const target = filters.country.toLowerCase().trim();
      const countries = getMovieCountries(movie);
      if (!countries.some((c) => c.includes(target))) return false;
    }

    // 7. Общий хрон (duration)
    if (filters.duration && typeof filters.duration === 'string') {
      const dur = parseDurationMinutes(movie.duration || movie.totalDuration);
      if (filters.duration === '0-30' && (dur <= 0 || dur > 30)) return false;
      if (filters.duration === '30-60' && (dur <= 30 || dur > 60)) return false;
      if (filters.duration === '60-120' && (dur <= 60 || dur > 120)) return false;
      if (filters.duration === '120+' && dur <= 120) return false;
    }

    // 8. Хрон серии (episodeDuration)
    if (filters.episodeDuration && typeof filters.episodeDuration === 'string') {
      const epDur = parseDurationMinutes(movie.episodeDuration || movie.duration);
      if (filters.episodeDuration === '0-15' && (epDur <= 0 || epDur > 15)) return false;
      if (filters.episodeDuration === '15-30' && (epDur <= 15 || epDur > 30)) return false;
      if (filters.episodeDuration === '30-50' && (epDur <= 30 || epDur > 50)) return false;
      if (filters.episodeDuration === '50+' && epDur <= 50) return false;
    }

    return true;
  });
}