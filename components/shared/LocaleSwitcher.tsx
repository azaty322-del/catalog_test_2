'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { switchLocalePath } from '@/constants';
import { LOCALES } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useI18n } from '@/providers/I18nProvider';

/**
 * Переключение языка — это навигация на тот же путь с другим сегментом,
 * поэтому используется Link, а не обработчик клика.
 */
export function LocaleSwitcher() {
  const pathname = usePathname();
  const { locale } = useI18n();

  return (
    <div className="flex items-center gap-1 text-body-sm">
      {LOCALES.map((item, index) => (
        <span key={item} className="flex items-center gap-1">
          {index > 0 && <span className="text-line">/</span>}
          <Link
            href={switchLocalePath(pathname, item)}
            className={cn(
              'font-semibold uppercase transition-colors',
              item === locale ? 'text-ink' : 'text-ink-muted hover:text-ink',
            )}
          >
            {item}
          </Link>
        </span>
      ))}
    </div>
  );
}
