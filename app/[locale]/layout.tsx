import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, getTranslator, Locale, LOCALES } from '@/lib/i18n';
import { getCategories } from '@/lib/catalog';
import { I18nProvider } from '@/providers/I18nProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { CartProvider } from '@/providers/CartProvider';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

interface LayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const t = getTranslator(params.locale as Locale);

  return {
    title: {
      default: `${t('site.name')} — UTV Media`,
      template: `%s — ${t('site.name')}`,
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const locale = (params?.locale || 'ru') as Locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const categories = getCategories();

  return (
    <I18nProvider locale={locale}>
      <AuthProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col bg-white">
            <Suspense fallback={<div className="h-20 w-full border-b border-slate-100 bg-white" />}>
              <Header locale={locale} categories={categories} />
            </Suspense>
            <main className="flex-1">{children}</main>
            <Footer locale={locale} />
          </div>
        </CartProvider>
      </AuthProvider>
    </I18nProvider>
  );
}