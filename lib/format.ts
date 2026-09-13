import { Locale } from '@/lib/i18n';
import { Movie, Range } from '@/types/catalog';

const COUNTRY_TRANSLATIONS: Record<string, string> = {
  'Россия': 'Russia',
  'США': 'USA',
  'Великобритания': 'UK',
  'Франция': 'France',
  'Германия': 'Germany',
  'Италия': 'Italy',
  'Испания': 'Spain',
  'Китай': 'China',
  'Япония': 'Japan',
  'Канада': 'Canada',
  'Весь мир': 'Worldwide',
  'СНГ': 'CIS',
  'СНГ, страны Балтии': 'CIS, Baltic States',
  'Россия и СНГ': 'Russia & CIS',
};

const LANG_TRANSLATIONS: Record<string, string> = {
  'Русский': 'Russian',
  'Английский': 'English',
  'Французский': 'French',
  'Немецкий': 'German',
  'Испанский': 'Spanish',
};

export function translateCountry(country?: string | null, locale: Locale = 'ru'): string {
  if (!country) return '';
  if (locale === 'en') {
    return COUNTRY_TRANSLATIONS[country] || country;
  }
  return country;
}

export function translateLanguage(lang?: string | null, locale: Locale = 'ru'): string {
  if (!lang) return '';
  if (locale === 'en') {
    return LANG_TRANSLATIONS[lang] || lang;
  }
  return lang;
}

export function formatRightsPeriod(period?: string | null, locale: Locale = 'ru'): string {
  if (!period) return '';
  if (locale === 'en') {
    return period.replace(/^До\s+/i, 'Until ');
  }
  return period;
}

export function formatRange(range?: Range | null, locale: Locale = 'ru'): string {
  if (!range || typeof range.min === 'undefined') return '';
  const unit = locale === 'en' ? 'min' : 'мин';
  const min = range.min;
  const max = typeof range.max !== 'undefined' ? range.max : min;
  return min === max ? `${min} ${unit}` : `${min}–${max} ${unit}`;
}

export function formatDuration(minutes?: number | null, locale: Locale = 'ru'): string {
  if (minutes === undefined || minutes === null || isNaN(minutes) || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hUnit = locale === 'en' ? 'h' : 'ч';
  const mUnit = locale === 'en' ? 'min' : 'мин';

  if (h > 0 && m > 0) return `${h} ${hUnit} ${m} ${mUnit}`;
  if (h > 0) return `${h} ${hUnit}`;
  return `${m} ${mUnit}`;
}

export function formatYears(movieOrYear?: any, locale: Locale = 'ru'): string {
  if (!movieOrYear) return '';
  if (typeof movieOrYear === 'object') {
    const from = movieOrYear.yearFrom;
    const to = movieOrYear.yearTo;
    if (typeof from === 'number' && typeof to === 'number') {
      return from === to ? String(from) : `${from}–${to}`;
    }
    if (Array.isArray(movieOrYear.years) && movieOrYear.years.length > 0) {
      const valid = movieOrYear.years.map(Number).filter((y: number) => !isNaN(y) && y > 0);
      if (valid.length > 0) {
        const min = Math.min(...valid);
        const max = Math.max(...valid);
        return min === max ? String(min) : `${min}–${max}`;
      }
    }
    if (movieOrYear.year) return formatYear(movieOrYear.year);
    if (movieOrYear.min || movieOrYear.max) {
      const min = movieOrYear.min;
      const max = movieOrYear.max ?? min;
      return min === max ? String(min) : `${min}–${max}`;
    }
  }
  return formatYear(movieOrYear);
}

export function formatYear(year?: any): string {
  if (!year) return '';
  if (typeof year === 'number' || typeof year === 'string') return String(year);
  if (typeof year === 'object') {
    const min = year.min ?? year.yearFrom;
    const max = year.max ?? year.yearTo ?? min;
    if (min && max) return min === max ? String(min) : `${min}–${max}`;
    return String(min || max || '');
  }
  return '';
}

export function formatEpisodes(count?: number | null, locale: Locale = 'ru'): string {
  if (!count) return '';
  if (locale === 'en') return count === 1 ? '1 episode' : `${count} episodes`;
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return `${count} серий`;
  if (mod10 === 1) return `${count} серия`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} серии`;
  return `${count} серий`;
}

export function formatCardMeta(movie: Movie, locale: Locale = 'ru'): string {
  if (!movie) return '';
  const parts: string[] = [];

  const durationStr = movie.episodeDuration ? formatRange(movie.episodeDuration, locale) : '';
  if (movie.episodes && durationStr) {
    parts.push(`${movie.episodes} × ${durationStr}`);
  } else if (durationStr) {
    parts.push(durationStr);
  }

  const countries = Array.isArray(movie.countries)
    ? movie.countries
    : (movie as any).country
    ? [(movie as any).country]
    : [];

  if (countries.length > 0) {
    parts.push(countries.map((c) => translateCountry(c, locale)).join(', '));
  }

  return parts.join(' · ');
}

export function formatPrice(price?: number | null, locale: Locale = 'ru'): string {
  if (price === undefined || price === null) return locale === 'en' ? 'On request' : 'По запросу';
  return `${price.toLocaleString(locale === 'en' ? 'en-US' : 'ru-RU')} ₽`;
}