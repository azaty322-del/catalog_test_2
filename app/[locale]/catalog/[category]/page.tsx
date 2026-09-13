import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CatalogView } from '@/components/features/movies/CatalogView';
import { EmptyState } from '@/components/ui/EmptyState';
import { findMovies, getCategories, getCategoryBySlug, getFilterValues } from '@/lib/catalog';
import { parseFilters } from '@/lib/filters';
import { getTranslator, LOCALES } from '@/lib/i18n';
import { resolveText } from '@/types/catalog';
import type { Locale } from '@/types/catalog';

interface PageProps {
  params: { locale: Locale; category: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export async function generateStaticParams() {
  const categories = await getCategories();
  return LOCALES.flatMap((locale) => categories.map((c) => ({ locale, category: c.slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.category);
  return { title: category ? resolveText(category.title, params.locale) : undefined };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const category = await getCategoryBySlug(params.category);
  if (!category) notFound();

  const t = getTranslator(params.locale);
  const title = resolveText(category.title, params.locale);

  if (category.isEmpty) {
    return (
      <div className="container-page py-9">
        <h1 className="text-h1">{title}</h1>
        <div className="mt-8">
          <EmptyState title={t('catalog.empty')} description={t('catalog.emptyText')} />
        </div>
      </div>
    );
  }

  const filters = parseFilters(searchParams);
  const page = Number(searchParams.page ?? 1) || 1;

  const [result, filterValues] = await Promise.all([
    findMovies({ category: category.slug, filters, page }),
    getFilterValues(category.slug),
  ]);

  return (
    <div className="container-page py-9">
      <h1 className="text-h1">{title}</h1>

      <div className="mt-6">
        <Suspense fallback={null}>
          <CatalogView result={result} filterValues={filterValues} />
        </Suspense>
      </div>
    </div>
  );
}
