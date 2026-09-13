'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Pagination } from '@/components/ui/Pagination';
import { useI18n } from '@/providers/I18nProvider';

interface CatalogPaginationProps {
  page: number;
  totalPages: number;
}

/** Пагинация, которая сохраняет все остальные параметры адресной строки. */
export function CatalogPagination({ page, totalPages }: CatalogPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const goTo = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) params.delete('page');
    else params.set('page', String(nextPage));

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: true });
  };

  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      onPageChange={goTo}
      labels={{ previous: t('common.back'), next: t('common.forward'), nav: t('common.pagination') }}
    />
  );
}
