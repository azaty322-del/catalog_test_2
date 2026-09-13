'use client';

import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { routes } from '@/constants';
import { useI18n } from '@/providers/I18nProvider';
import { resolveText } from '@/types/catalog';
import type { Movie } from '@/types/catalog';

export function HeroBanner({ movie }: { movie: Movie }) {
  const { t, locale } = useI18n();
  const title = resolveText(movie.title, locale);

  return (
    <section className="relative overflow-hidden rounded-card">
      <div className="relative aspect-[16/9] w-full sm:aspect-[21/9] lg:aspect-[2.9/1]">
        <Image src={movie.poster} alt={title} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/45 to-transparent" />
      </div>

      <div className="absolute inset-0 flex items-center">
        <div className="max-w-xl px-6 py-8 sm:px-10 lg:px-12">
          <span className="inline-flex rounded-control bg-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
            {t('home.featured')}
          </span>

          <h1 className="mt-4 text-[26px] font-extrabold leading-tight text-white sm:text-[34px]">{title}</h1>

          <p className="mt-3 hidden max-w-lg text-body-sm text-white/85 sm:block">
            {resolveText(movie.description, locale)}
          </p>

          <Link
            href={routes.film(locale, movie.slug)}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-control bg-primary px-5 text-body-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            {t('home.details')}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
