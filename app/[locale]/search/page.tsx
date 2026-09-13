import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogView } from '@/components/features/movies/CatalogView';
import { findMovies, getFilterValues } from '@/lib/catalog';
import { parseFilters } from '@/lib/filters';
import { getTranslator } from '@/lib/i18n';
import type { Locale } from '@/types/catalog';

interface PageProps {
  params: { locale: Locale };
  searchParams: Record<string, string | string[] | undefined>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return { title: getTranslator(params.locale)('catalog.searchResults') };
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const t = getTranslator(params.locale);
  const search = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const page = Number(searchParams.page ?? 1) || 1;
  const filters = parseFilters(searchParams);

  const [result, filterValues] = await Promise.all([
    findMovies({ search, filters, page }),
    getFilterValues(),
  ]);

  return (
    <div className="container-page py-9">
      <h1 className="text-h1">{t('catalog.searchResults')}</h1>

      <div className="mt-6">
        <Suspense fallback={null}>
          <CatalogView result={result} filterValues={filterValues} />
        </Suspense>
      </div>
    </div>
  );
}
