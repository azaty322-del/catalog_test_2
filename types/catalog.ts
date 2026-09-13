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
  sourceId: string;
  slug: string;
  category: string;

  title: LocalizedText;
  description: LocalizedText;

  episodes: number;
  /** Длительность одного эпизода в минутах. В источнике встречается «18-22». */
  episodeDuration: Range;
  /**
   * Общий хронометраж в минутах. В источнике три разных формата — целые часы,
   * дробные («0,5») и «3:18:00», поэтому нормализуем в минуты при импорте.
   */
  totalDurationMinutes: number;

  /** «HD / 4K» в источнике — это два значения, а не одно. */
  qualities: string[];
  /** «Съёмки со всего мира» приведено к значению «Весь мир». */
  countries: string[];

  yearFrom: number;
  yearTo: number;

  languages: Locale[];
  author: string;
  ageRating: string;
  distributionTerritory: string;
  /** null, если в источнике стоял прочерк. */
  rightsPeriod: string | null;
  tags: string[];

  /**
   * Трейлер лежит на внешнем хостинге, а не в проекте. Встречаются YouTube,
   * Rutube и Яндекс.Диск, поэтому плеер выбирается по `host`, а не по подстроке
   * в URL внутри компонента. Яндекс.Диск не встраивается — для него открываем ссылку.
   */
  trailer: Trailer;
  poster: string;
  stills: string[];
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
