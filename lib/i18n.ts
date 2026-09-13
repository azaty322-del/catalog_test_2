import ru from '@/i18n/ru.json';
import en from '@/i18n/en.json';

export type Locale = 'ru' | 'en';
export const LOCALES: Locale[] = ['ru', 'en'];
export const DEFAULT_LOCALE: Locale = 'ru';

const dictionaries: Record<Locale, any> = {
  ru,
  en,
};

const COMPREHENSIVE_RU_MAP: Record<string, string> = {
  'film.openTrailer': 'Смотреть трейлер',
  'film.trailer': 'Трейлер',
  'film.episodes': 'Серии',
  'film.episodeDuration': 'Хрон серии',
  'film.totalDuration': 'Общий хрон',
  'film.quality': 'Качество',
  'film.country': 'Страна',
  'film.rightsPeriod': 'Срок прав',
  'film.language': 'Язык',
  'film.author': 'Правообладатель',
  'film.ageRating': 'Возрастной рейтинг',
  'film.territory': 'Территория',
  'film.year': 'Год',
  'film.inCart': 'В корзине',
  'film.addToCart': 'В корзину',
  'film.stills': 'Кадры из фильма',
  'film.tags': 'Теги',
  'FILM.TAGS': 'Теги',
};

export function isLocale(value: any): value is Locale {
  return LOCALES.includes(value);
}

export function getTranslator(locale: Locale) {
  const dict = dictionaries[locale] || dictionaries[DEFAULT_LOCALE];

  return (key: string, fallback?: string): string => {
    if (!key) return '';

    if (dict[key] !== undefined && typeof dict[key] === 'string') {
      return dict[key];
    }

    const segments = key.split('.');
    let current: any = dict;
    for (const segment of segments) {
      if (current && typeof current === 'object' && segment in current) {
        current = current[segment];
      } else {
        current = undefined;
        break;
      }
    }
    if (typeof current === 'string') {
      return current;
    }

    if (COMPREHENSIVE_RU_MAP[key]) {
      return COMPREHENSIVE_RU_MAP[key];
    }

    const lowerKey = key.toLowerCase();
    if (COMPREHENSIVE_RU_MAP[lowerKey]) {
      return COMPREHENSIVE_RU_MAP[lowerKey];
    }

    return fallback || key;
  };
}