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
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
        {movie.poster ? (
          <img
            src={movie.poster}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <Film size={36} />
          </div>
        )}
      </div>

      {/* Название и мета-информация */}
      <div className="mt-3">
        <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 group-hover:text-[#ff5a1f] transition-colors">
          {title}
        </h3>
        {meta && (
          <p className="mt-1 text-xs text-slate-400 line-clamp-1">
            {meta}
          </p>
        )}
      </div>
    </Link>
  );
}
export default MovieCard;