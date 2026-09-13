'use client';

import { FilterBubbles } from '@/components/features/filters/FilterBubbles';
import { MovieGrid } from './MovieGrid';
import { CatalogPagination } from './CatalogPagination';
import type { CatalogResult, FilterValues } from '@/lib/catalog';

/**
 * Общая обвязка каталога: бабблы, сетка и пагинация. Используется и на странице
 * категории, и в поиске, чтобы поведение фильтров не расходилось между ними.
 */
export function CatalogView({
  result,
  filterValues,
}: {
  result: CatalogResult;
  filterValues: FilterValues;
}) {
  return (
    <>
      <FilterBubbles values={filterValues} total={result.total} />

      <MovieGrid movies={result.items} />

      {result.totalPages > 1 && (
        <div className="mt-12">
          <CatalogPagination page={result.page} totalPages={result.totalPages} />
        </div>
      )}
    </>
  );
}
