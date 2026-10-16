import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Film } from 'lucide-react';
import { isLocale, getTranslator, Locale } from '@/lib/i18n';
import { getMovieBySlug, getRelatedMovies } from '@/lib/catalog';
import { formatYears } from '@/lib/format';
import { AddToCartButton } from '@/components/features/movies/AddToCartButton';
import { StillsGallery } from '@/components/features/movies/StillsGallery';
import { MovieCard } from '@/components/features/movies/MovieCard';
import { TrailerLink } from '@/components/features/movies/TrailerLink';
import type { Trailer } from '@/types/catalog';

interface FilmPageProps {
  params: {
    locale: string;
    slug: string;
  };
}

export default async function FilmPage({ params }: FilmPageProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const locale = params.locale as Locale;
  const t = getTranslator(locale);
  const movie = await getMovieBySlug(params.slug);

  if (!movie) {
    notFound();
  }

  const relatedMovies = await getRelatedMovies(movie, 4);

  const title =
    typeof movie.title === 'object'
      ? movie.title[locale] || movie.title.ru
      : movie.title;

  const description =
    typeof movie.description === 'object'
      ? movie.description[locale] || movie.description.ru
      : movie.description;

  const country =
    Array.isArray(movie.countries) && movie.countries.length > 0
      ? movie.countries.join(', ')
      : ((movie as any).country || 'Россия');

  const episodeDuration =
    typeof movie.episodeDuration === 'object' && movie.episodeDuration !== null
      ? (movie.episodeDuration.min === movie.episodeDuration.max
          ? `${movie.episodeDuration.max} мин`
          : `${movie.episodeDuration.min}-${movie.episodeDuration.max} мин`)
      : (movie.episodeDuration || '—');

  const totalDuration =
    movie.totalDurationMinutes
      ? `${movie.totalDurationMinutes} мин`
      : ((movie as any).duration || '—');

  const quality =
    Array.isArray(movie.qualities) && movie.qualities.length > 0
      ? movie.qualities.join(' / ')
      : ((movie as any).quality || 'Full HD');

  const language =
    Array.isArray(movie.languages) && movie.languages.length > 0
      ? movie.languages.join(', ')
      : ((movie as any).audioLang || (movie as any).language || 'Русский');

  const territory = movie.distributionTerritory || (movie as any).territory || 'Весь мир';

  const trailerObj: Trailer =
    typeof movie.trailer === 'object' && movie.trailer !== null
      ? movie.trailer
      : {
          url: (movie as any).trailerUrl || (typeof movie.trailer === 'string' ? movie.trailer : null),
          host: 'other',
        };

  // Таблица характеристик с безопасной фильтрацией незаполненных полей
  const metadataItems = [
    ...((movie as any).catalogId ? [{ label: t('film.catalogId', 'Шифр в каталоге'), value: (movie as any).catalogId }] : []),
    { label: t('film.episodes', 'Серии'), value: movie.episodes },
    { label: t('film.episodeDuration', 'Хрон серии'), value: episodeDuration },
    { label: t('film.totalDuration', 'Общий хрон'), value: movie.duration || totalDuration },
    { label: t('film.quality', 'Качество'), value: quality },
    { label: t('film.country', 'Страна'), value: country },
    { label: t('film.language', 'Язык'), value: language },
    { label: t('film.author', 'Автор / Студия'), value: (movie as any).author || 'UTV Media' },
    { label: t('film.ageRating', 'Возрастной рейтинг'), value: movie.ageRating },
    { label: t('film.territory', 'Территория'), value: territory },
    { label: t('film.year', 'Год'), value: (movie as any).yearRange || formatYears(movie) },
    ...(movie.rightsPeriod ? [{ label: t('film.rightsPeriod', 'Срок прав'), value: movie.rightsPeriod }] : []),
  ].filter((item) => item.value != null && String(item.value).trim() !== '');

  return (
    <div className="mx-auto max-w-[1400px] px-6 lg:px-12 py-8 space-y-12">
      {/* Кнопка «Назад в каталог» */}
      <div>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#ff5a1f] transition-colors"
        >
          <ArrowLeft size={16} />
          <span>{t('film.back', 'Назад в каталог')}</span>
        </Link>
      </div>

      {/* Основной блок: Постер + Характеристики */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Левая колонка: Превью постера и трейлер */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900 shadow-md">
            {movie.poster ? (
              <img
                src={movie.poster}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-500">
                <Film size={48} />
              </div>
            )}
          </div>

          {trailerObj.url && (
            <div className="pt-2">
              <TrailerLink title={title} trailer={trailerObj} />
            </div>
          )}
        </div>

        {/* Правая колонка: Название, Таблица метаданных, Теги, Кнопка корзины */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>

            {description && (
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                {description}
              </p>
            )}

            {/* Таблица метаданных с увеличенным кеглем */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 text-sm">
                {metadataItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-500 font-medium">{item.label}</span>
                    <span className="font-semibold text-slate-900 text-right ml-4">
                      {String(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Теги */}
            {movie.tags && movie.tags.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  {t('film.tags', 'Теги')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {movie.tags.map((tag, idx) => (
                    <Link
                      key={idx}
                      href={`/${locale}?q=${encodeURIComponent(tag.replace(/^#/, ''))}`}
                      className="inline-block rounded-lg bg-orange-50/80 px-3 py-1.5 text-sm font-medium text-[#ff5a1f] hover:bg-orange-100 transition-colors"
                    >
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Кнопка добавления в корзину */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <AddToCartButton movie={movie} />
          </div>
        </div>
      </div>

      {/* Галерея кадров из тайтла */}
      {movie.stills && movie.stills.length > 0 && (
        <div className="pt-8 border-t border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-5">
            {t('film.stills', 'Кадры из тайтла')}
          </h2>
          <StillsGallery stills={movie.stills} />
        </div>
      )}

      {/* Похожие тайтлы */}
      {relatedMovies && relatedMovies.length > 0 && (
        <div className="pt-8 border-t border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            {locale === 'ru' ? 'Похожие тайтлы' : 'Related titles'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedMovies.map((relMovie) => (
              <MovieCard key={relMovie.id} movie={relMovie} locale={locale} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}