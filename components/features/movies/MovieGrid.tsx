'use client';

import { MovieCard } from './MovieCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useI18n } from '@/providers/I18nProvider';
import type { Movie } from '@/types/catalog';

export function MovieGrid({ movies, emptyAction }: { movies: Movie[]; emptyAction?: React.ReactNode }) {
  const { t } = useI18n();

  if (movies.length === 0) {
    return (
      <EmptyState
        title={t('catalog.notFound')}
        description={t('catalog.notFoundText')}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {movies.map((movie, index) => (
        <MovieCard key={movie.id} movie={movie} priority={index < 4} />
      ))}
    </div>
  );
}
