/**
 * Контракт данных каталога.
 *
 * Структура выведена из выгрузки «каталог для фигмы — Природа.csv», а не придумана:
 * поля-диапазоны (год, длительность) и множественные значения (качество, страна)
 * описаны так, как они реально приходят из источника.
 *
 * Эти же типы имеет смысл взять за основу схемы PostgreSQL.
 */

export type Locale = 'ru' | 'en';

/**
 * Текст, который зависит от языка. `en` может быть null — перевода ещё нет,
 * но место под него уже есть, и добавление не потребует менять компоненты.
 * Читать только через `resolveText`, чтобы фолбэк был в одном месте.
 */
export interface LocalizedText {
  ru: string;
  en: string | null;
}

export function resolveText(text: LocalizedText, locale: Locale): string {
  if (locale === 'en') return text.en ?? text.ru;
  return text.ru;
}

/** Диапазон значений. min === max, если в источнике было одно число. */
export interface Range {
  min: number;
  max: number;
}

export type TrailerHost = 'youtube' | 'rutube' | 'vk' | 'yandex-disk' | 'other';

export interface Trailer {
  url: string | null;
  host: TrailerHost | null;
}

export interface Category {
  id: string;
  slug: string;
  title: LocalizedText;
  showInNav: boolean;
  /** Раздел есть в навигации, но контента для него ещё нет. */
  isEmpty: boolean;
}

export interface Movie {
  id: string;
  /** Идентификатор строки в исходной таблице — для сверки выгрузок. Не первичный ключ. */
  sourceId?: string;
  catalogId?: string;
  slug: string;
  category: string;
  categoryId?: string;
  categorySlug?: string;

  title: LocalizedText;
  description: LocalizedText;

  episodes?: number;
  episodesCount?: number;
  /** Длительность одного эпизода в минутах. В источнике встречается «18-22». */
  episodeDuration?: Range | string;
  /** Форматированная общая длительность ("03:48:55", "30 мин") */
  duration?: string;
  /**
   * Общий хронометраж в минутах. В источнике три разных формата — целые часы,
   * дробные («0,5») и «3:18:00», поэтому нормализуем в минуты при импорте.
   */
  totalDurationMinutes?: number;

  /** «HD / 4K» в источнике — это два значения, а не одно. */
  qualities: string[];
  quality?: any;
  /** «Съёмки со всего мира» приведено к значению «Весь мир». */
  countries: string[];
  country?: any;

  year?: number;
  yearRange?: string;
  yearFrom?: number;
  yearTo?: number;

  languages?: any;
  author?: string;
  ageRating?: string;
  distributionTerritory?: string;
  territory?: string;
  /** null, если в источнике стоял прочерк. */
  rightsPeriod?: string | null;
  tags?: string[];

  /**
   * Трейлер лежит на внешнем хостинге, а не в проекте.
   */
  trailer?: any;
  trailerUrl?: string;
  poster: string;
  image?: string;
  stills?: string[];
  status?: string;
  views?: number;
}

export interface CatalogData {
  meta: { source: string; note: string };
  categories: Category[];
  movies: Movie[];
}

/**
 * Значения фильтров описываются здесь, а не внутри UI-компонента.
 * `values` собирается из каталога, поэтому новый год или качество в данных
 * появляется в фильтрах сам, без правок кода.
 */
export type FilterType = 'multi' | 'range';

export interface FilterConfig {
  id: FilterId;
  title: LocalizedText;
  type: FilterType;
}

export type FilterId = 'country' | 'year' | 'quality' | 'language' | 'age' | 'duration';

export interface ActiveFilters {
  country: string[];
  year: number[];
  quality: string[];
  language: Locale[];
  age: string[];
  /** Максимальная длительность эпизода в минутах. */
  duration: number | null;
}
