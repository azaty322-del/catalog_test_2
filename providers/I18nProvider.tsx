'use client';

import React, { createContext, useContext } from 'react';
import { Locale } from '@/lib/i18n';
import ru from '@/i18n/ru.json';
import en from '@/i18n/en.json';

interface I18nContextType {
  locale: Locale;
  t: (key: string, fallback?: string) => string;
  plural: (count: number, forms: { one: string; few: string; many: string }) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const dictionaries: Record<Locale, any> = {
  ru,
  en,
};

const COMPREHENSIVE_RU_MAP: Record<string, string> = {
  'cart.title': 'Корзина',
  'cart.videos': 'фильмов',
  'cart.empty': 'Ваша корзина пуста',
  'cart.emptyDesc': 'Перейдите в каталог, чтобы выбрать интересующий контент',
  'cart.goToCatalog': 'Перейти в каталог',
  'cart.checkout': 'Оформить заказ',
  'cart.clear': 'Очистить корзину',
  'cart.total': 'Итого',
  'cart.items': 'Товары',
  'cart.remove': 'Удалить',
  'cart.success': 'Заказ успешно оформлен!',
  'cart.backToCatalog': 'Вернуться в каталог',
};

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const dict = dictionaries[locale] || dictionaries.ru;

  const t = (key: string, fallback?: string): string => {
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

    return fallback || key;
  };

  // Функция для правильного склонения слов по числам
  const plural = (count: number, forms: { one: string; few: string; many: string }): string => {
    const mod10 = count % 10;
    const mod100 = count % 100;

    if (locale === 'en') {
      return count === 1 ? forms.one : forms.many;
    }

    if (mod100 >= 11 && mod100 <= 19) {
      return forms.many;
    }
    if (mod10 === 1) {
      return forms.one;
    }
    if (mod10 >= 2 && mod10 <= 4) {
      return forms.few;
    }
    return forms.many;
  };

  return (
    <I18nContext.Provider value={{ locale, t, plural }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      locale: 'ru',
      t: (k) => k,
      plural: (c, f) => f.many,
    };
  }
  return context;
}