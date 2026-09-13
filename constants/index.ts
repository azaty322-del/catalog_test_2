import type { Locale } from '@/types/catalog';

export const SITE = {
  email: 'info@videoteka.ru',
  phone: '+7 (495) 123-45-67',
} as const;

/**
 * Все ссылки строятся через эти функции, поэтому языковой сегмент нельзя забыть.
 */
export const routes = {
  home: (locale: Locale) => `/${locale}`,
  category: (locale: Locale, slug: string) => `/${locale}/catalog/${slug}`,
  film: (locale: Locale, slug: string) => `/${locale}/film/${slug}`,
  search: (locale: Locale) => `/${locale}/search`,
  cart: (locale: Locale) => `/${locale}/cart`,
  login: (locale: Locale) => `/${locale}/login`,
  register: (locale: Locale) => `/${locale}/register`,
  account: (locale: Locale) => `/${locale}/account`,
  admin: (locale: Locale) => `/${locale}/admin`,
  forbidden: (locale: Locale) => `/${locale}/403`,
  privacy: (locale: Locale) => `/${locale}/privacy`,
  terms: (locale: Locale) => `/${locale}/terms`,
} as const;

/** Меняет языковой сегмент, оставляя пользователя на той же странице. */
export function switchLocalePath(pathname: string, nextLocale: Locale): string {
  const segments = pathname.split('/').filter(Boolean);
  segments[0] = nextLocale;
  return `/${segments.join('/')}`;
}

export const ACCOUNT_TABS = [
  { id: 'profile', labelKey: 'account.profile' },
  { id: 'orders', labelKey: 'account.orders' },
  { id: 'favorites', labelKey: 'account.favorites' },
  { id: 'settings', labelKey: 'account.settings' },
] as const;

export type AccountTabId = (typeof ACCOUNT_TABS)[number]['id'];
