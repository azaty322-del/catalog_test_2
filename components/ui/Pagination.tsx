'use client';

import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  labels: { previous: string; next: string; nav: string };
}

/** Формирует ряд страниц с многоточием: 1 2 3 … 8 */
function buildPages(page: number, totalPages: number): Array<number | 'gap'> {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = Array.from(pages).filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const result: Array<number | 'gap'> = [];
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) result.push('gap');
    result.push(p);
  });
  return result;
}

export function Pagination({ page, totalPages, onPageChange, labels }: PaginationProps) {
  if (totalPages <= 1) return null;

  /**
   * Базовый класс намеренно не задаёт фон: если оставить здесь bg-white,
   * он конфликтует с bg-primary активной страницы. При равной специфичности
   * побеждает тот класс, который идёт позже в сгенерированном CSS, а не в строке,
   * поэтому фон задаётся явно в каждом состоянии.
   */
  const cell =
    'flex h-9 min-w-9 items-center justify-center rounded-control border border-line px-3 text-body-sm font-medium transition-colors';

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2" aria-label={labels.nav}>
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={cn(cell, 'bg-white hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink')}
      >
        {labels.previous}
      </button>

      {buildPages(page, totalPages).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-ink-muted">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              cell,
              item === page
                ? 'border-primary bg-primary text-white'
                : 'bg-white hover:border-primary hover:text-primary',
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={cn(cell, 'bg-white hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink')}
      >
        {labels.next}
      </button>
    </nav>
  );
}
