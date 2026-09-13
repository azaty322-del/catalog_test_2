'use client';

import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { routes } from '@/constants';
import { cn } from '@/lib/utils';
import { useI18n } from '@/providers/I18nProvider';

export function SearchInput({ defaultValue = '', className }: { defaultValue?: string; className?: string }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [value, setValue] = useState(defaultValue);

  const submit = () => {
    const query = value.trim();
    const base = routes.search(locale);
    router.push(query ? `${base}?q=${encodeURIComponent(query)}` : base);
  };

  return (
    <div className={cn('relative', className)}>
      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
      <input
        type="search"
        value={value}
        placeholder={t('nav.search')}
        aria-label={t('nav.searchAria')}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') submit();
        }}
        className="h-10 w-full rounded-control border border-line bg-canvas pl-10 pr-9 text-body-sm
          transition-colors placeholder:text-ink-muted focus:border-primary focus:bg-white focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          aria-label={t('nav.clear')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
