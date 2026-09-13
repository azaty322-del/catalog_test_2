'use client';

import Link from 'next/link';
import { MovieCard } from './MovieCard';
import { useI18n } from '@/providers/I18nProvider';
import type { Movie } from '@/types/catalog';

interface CategorySectionProps {
  title: string;
  movies: Movie[];
  href?: string;
  priority?: boolean;
}

export function CategorySection({ title, movies, href, priority }: CategorySectionProps) {
  const { t } = useI18n();

  if (movies.length === 0) return null;

  return (
    <section className="mt-12 first:mt-0">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-h2">{title}</h2>
        {href && (
          <Link href={href} className="shrink-0 text-body-sm font-medium text-primary transition-colors hover:text-primary-hover">
            {t('home.showAll')}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {movies.map((movie, index) => (
          <MovieCard key={movie.id} movie={movie} priority={priority && index < 2} />
        ))}
      </div>
    </section>
  );
}
