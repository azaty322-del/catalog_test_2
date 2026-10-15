import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, Locale } from '@/lib/i18n';
import { findMovies, getCategories, CATEGORY_MAP } from '@/lib/catalog';
import { MovieCard } from '@/components/features/movies/MovieCard';
import { FilterBubbles } from '@/components/features/filters/FilterBubbles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: { locale: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

function pluralizeTitles(count: number, locale: Locale): string {
  if (locale === 'en') {
    return count === 1 ? '1 title' : `${count} titles`;
  }
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return `${count} тайтлов`;
  if (mod10 === 1) return `${count} тайтл`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} тайтла`;
  return `${count} тайтлов`;
}

export default async function HomePage({ params, searchParams }: PageProps) {
  const locale = (params?.locale || 'ru') as Locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const currentSearchParams = searchParams || {};
  const query = typeof currentSearchParams.q === 'string' ? currentSearchParams.q.trim() : '';
  const categorySlug = typeof currentSearchParams.category === 'string' ? currentSearchParams.category : '';
  const currentPage = Number(currentSearchParams.page) || 1;

  const { items: movies, total, totalPages } = await findMovies({
    filters: currentSearchParams,
    page: currentPage,
    limit: 12,
  });

  const categoryMeta = CATEGORY_MAP.find((c) => c.slug === categorySlug);
  const activeCategoryTitle = categoryMeta ? categoryMeta.ru : null;

  return (
    <div className="mx-auto max-w-[1400px] px-6 lg:px-12 py-8">
      {/* Заголовок с увеличенным кеглем */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
        {query
          ? `Найдено ${pluralizeTitles(total, locale)} по запросу «${query}»`
          : activeCategoryTitle
          ? `${activeCategoryTitle} — найдено ${pluralizeTitles(total, locale)}`
          : `Найдено ${pluralizeTitles(total, locale)}`}
      </h1>

      {/* Интерактивные фильтры-баблы с выбором категорий */}
      <FilterBubbles locale={locale} />

      {/* Сетка тайтлов */}
      {movies.length === 0 ? (
        <div className="py-24 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <p className="text-lg font-bold text-slate-800">Ничего не найдено</p>
          <p className="mt-1 text-sm text-slate-400">
            Попробуйте изменить поисковый запрос или сбросить параметры фильтрации.
          </p>
          <Link
            href={`/${locale}`}
            className="inline-block mt-4 text-sm font-semibold text-[#ff5a1f] hover:underline"
          >
            Показать все тайтлы
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} locale={locale} />
          ))}
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="mt-14 flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
          <Link
            href={`/${locale}?${new URLSearchParams({ ...currentSearchParams as any, page: String(Math.max(1, currentPage - 1)) })}`}
            className={`px-3.5 py-2 transition-colors ${currentPage <= 1 ? 'opacity-40 pointer-events-none' : 'hover:text-[#ff5a1f]'}`}
          >
            Назад
          </Link>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showDots = prev && p - prev > 1;
              return (
                <React.Fragment key={p}>
                  {showDots && <span className="px-1 text-slate-400">...</span>}
                  <Link
                    href={`/${locale}?${new URLSearchParams({ ...currentSearchParams as any, page: String(p) })}`}
                    className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors ${
                      currentPage === p ? 'bg-[#ff5a1f] text-white font-bold shadow-sm' : 'hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </Link>
                </React.Fragment>
              );
            })}

          <Link
            href={`/${locale}?${new URLSearchParams({ ...currentSearchParams as any, page: String(Math.min(totalPages, currentPage + 1)) })}`}
            className={`px-3.5 py-2 transition-colors ${currentPage >= totalPages ? 'opacity-40 pointer-events-none' : 'hover:text-[#ff5a1f]'}`}
          >
            Вперед
          </Link>
        </div>
      )}
    </div>
  );
}