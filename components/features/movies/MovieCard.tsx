'use client';

import React from 'react';
import Link from 'next/link';
import { Film } from 'lucide-react';
import { Movie } from '@/types/catalog';
import { Locale } from '@/lib/i18n';
import { formatCardMeta } from '@/lib/format';
import { useI18n } from '@/providers/I18nProvider';

export interface MovieCardProps {
  movie: Movie;
  locale?: Locale;
  priority?: boolean;
}

export function MovieCard({ movie, locale: propLocale, priority: _priority }: MovieCardProps) {
  let contextLocale: Locale = 'ru';
  try {
    const i18n = useI18n();
    if (i18n?.locale) contextLocale = i18n.locale;
  } catch {
    // fallback
  }
  const locale = propLocale || contextLocale;
  const title = typeof movie.title === 'object' 
    ? movie.title[locale] || movie.title.ru 
    : movie.title;

  const meta = formatCardMeta(movie, locale);

  return (
    <Link
      href={`/${locale}/film/${movie.slug}`}
      className="group flex flex-col transition-transform hover:-translate-y-1"
    >
      {/* 16:9 Превью с закругленными углами */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm border border-slate-100">
        {movie.poster && movie.poster !== '/placeholder.png' ? (
          <img
            src={movie.poster}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <Film size={40} />
          </div>
        )}

        {/* Бейдж шифра каталога (A1, B2, etc.) */}
        {(movie as any).catalogId && (
          <span className="absolute top-2.5 left-2.5 rounded-lg bg-black/60 backdrop-blur-sm px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
            {(movie as any).catalogId}
          </span>
        )}
      </div>

      {/* Название и мета-информация с увеличенным кеглем */}
      <div className="mt-3">
        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-[#ff5a1f] transition-colors">
          {title}
        </h3>
        {meta && (
          <p className="mt-1 text-sm text-slate-500 line-clamp-1">
            {meta}
          </p>
        )}
      </div>
    </Link>
  );
}
export default MovieCard;