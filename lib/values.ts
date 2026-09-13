import type { Locale } from '@/types/catalog';

/**
 * В data.json язык и страна хранятся как «сырые» значения (код языка,
 * русское название страны), а не как LocalizedText с title.ru/title.en —
 * в отличие от названий и описаний фильмов. Поэтому перевод этих значений
 * не может идти через resolveText и живёт здесь, в одном месте, чтобы не
 * плодить локальные LANGUAGE_LABEL-таблицы по компонентам.
 *
 * Набор стран/территорий в каталоге закрытый и небольшой — как появится
 * новое значение в data.json, его нужно один раз добавить сюда.
 */

const LANGUAGE_NAMES: Record<string, Record<Locale, string>> = {
  ru: { ru: 'Русский', en: 'Russian' },
  en: { ru: 'Английский', en: 'English' },
};

export function translateLanguage(code: string, locale: Locale): string {
  return LANGUAGE_NAMES[code]?.[locale] ?? code;
}

const COUNTRY_NAMES: Record<string, Record<Locale, string>> = {
  'Весь мир': { ru: 'Весь мир', en: 'Worldwide' },
  Россия: { ru: 'Россия', en: 'Russia' },
  Сербия: { ru: 'Сербия', en: 'Serbia' },
};

export function translateCountry(value: string, locale: Locale): string {
  if (!value) return value;
  return COUNTRY_NAMES[value]?.[locale] ?? value;
}
