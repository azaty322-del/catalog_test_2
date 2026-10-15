'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown, X } from 'lucide-react';
import { Locale } from '@/lib/i18n';

export interface FilterBubblesProps {
  locale?: Locale;
  values?: any;
  total?: number;
}

interface FilterOption {
  label: string;
  value: string;
}

const FILTER_CONFIG: {
  id: string;
  nameRu: string;
  nameEn: string;
  options: FilterOption[];
}[] = [
  {
    id: 'category',
    nameRu: 'Категория',
    nameEn: 'Category',
    options: [
      { label: 'Кулинария и еда (A)', value: 'culinary' },
      { label: 'Природа (B)', value: 'nature' },
      { label: 'Путешествия (C)', value: 'travel' },
      { label: 'Научпоп (D)', value: 'science' },
      { label: 'Эксперты (E)', value: 'experts' },
      { label: 'Дача и сад (F)', value: 'garden' },
      { label: 'Познавательный (G)', value: 'educational' },
      { label: 'Детям и подросткам (H)', value: 'kids' },
      { label: 'Тренировки (I)', value: 'workout' },
      { label: 'Под запрос (J)', value: 'on-demand' },
    ],
  },
  {
    id: 'quality',
    nameRu: 'Качество',
    nameEn: 'Quality',
    options: [
      { label: '4K', value: '4K' },
      { label: 'Full HD', value: 'Full HD' },
      { label: 'HD', value: 'HD' },
    ],
  },
  {
    id: 'duration',
    nameRu: 'Общий хрон',
    nameEn: 'Total duration',
    options: [
      { label: 'до 30 мин', value: '0-30' },
      { label: '30-60 мин', value: '30-60' },
      { label: '60-120 мин', value: '60-120' },
      { label: 'более 2 часов', value: '120+' },
    ],
  },
  {
    id: 'episodeDuration',
    nameRu: 'Хрон серии',
    nameEn: 'Episode duration',
    options: [
      { label: 'до 15 мин', value: '0-15' },
      { label: '15-30 мин', value: '15-30' },
      { label: '30-50 мин', value: '30-50' },
      { label: 'более 50 мин', value: '50+' },
    ],
  },
  {
    id: 'country',
    nameRu: 'Страна',
    nameEn: 'Country',
    options: [
      { label: 'Россия', value: 'Россия' },
      { label: 'Сербия / Россия', value: 'Сербия' },
      { label: 'Съемки со всего мира', value: 'Съемки со всего мира' },
    ],
  },
  {
    id: 'year',
    nameRu: 'Год',
    nameEn: 'Year',
    options: [
      { label: '2026', value: '2026' },
      { label: '2025', value: '2025' },
      { label: '2024', value: '2024' },
      { label: '2023', value: '2023' },
      { label: '2022', value: '2022' },
      { label: '2021', value: '2021' },
      { label: '2020 и ранее', value: '2020-' },
    ],
  },
  {
    id: 'age',
    nameRu: 'Возраст',
    nameEn: 'Age rating',
    options: [
      { label: '0+', value: '0+' },
      { label: '6+', value: '6+' },
      { label: '12+', value: '12+' },
      { label: '16+', value: '16+' },
      { label: '18+', value: '18+' },
    ],
  },
];

export function FilterBubbles({ locale: propLocale, values: _values, total: _total }: FilterBubblesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale: Locale = propLocale || (pathname?.startsWith('/en') ? 'en' : 'ru');
  const searchParams = useSearchParams();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Определение активной категории из URL если страница /catalog/[slug]
  const categoryFromPath = pathname?.includes('/catalog/')
    ? pathname.split('/catalog/')[1]?.split('?')[0]?.split('/')[0]
    : null;

  // Закрытие при клике вне баблов
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentVal = key === 'category' ? (params.get('category') || categoryFromPath) : params.get(key);

    if (currentVal === value) {
      params.delete(key);
      if (key === 'category' && categoryFromPath) {
        params.delete('page');
        router.push(`/${locale}?${params.toString()}`);
        setOpenDropdown(null);
        return;
      }
    } else {
      params.set(key, value);
      if (key === 'category' && categoryFromPath) {
        params.delete('page');
        router.push(`/${locale}?${params.toString()}`);
        setOpenDropdown(null);
        return;
      }
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
    setOpenDropdown(null);
  };

  const handleClearKey = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete('page');
    if (key === 'category' && categoryFromPath) {
      router.push(`/${locale}?${params.toString()}`);
      return;
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleResetAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    FILTER_CONFIG.forEach((f) => params.delete(f.id));
    params.delete('page');
    if (categoryFromPath) {
      router.push(`/${locale}?${params.toString()}`);
      return;
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasActiveFilters = FILTER_CONFIG.some((f) => {
    if (f.id === 'category') {
      return searchParams.has('category') || Boolean(categoryFromPath);
    }
    return searchParams.has(f.id);
  });

  return (
    <div ref={containerRef} className="my-6 flex flex-wrap items-center gap-2.5">
      {FILTER_CONFIG.map((filter) => {
        let activeValue = searchParams.get(filter.id);
        if (filter.id === 'category' && !activeValue && categoryFromPath) {
          activeValue = categoryFromPath;
        }

        const isOpen = openDropdown === filter.id;
        const filterName = locale === 'ru' ? filter.nameRu : filter.nameEn;
        const activeOption = filter.options.find((o) => o.value === activeValue);

        return (
          <div key={filter.id} className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(isOpen ? null : filter.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeValue
                  ? 'bg-[#ff5a1f] text-white shadow-sm shadow-orange-500/20'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>{activeOption ? activeOption.label : filterName}</span>
              {activeValue ? (
                <span
                  onClick={(e) => handleClearKey(filter.id, e)}
                  className="rounded-full p-0.5 hover:bg-black/20"
                >
                  <X size={14} />
                </span>
              ) : (
                <ChevronDown
                  size={15}
                  className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              )}
            </button>

            {/* Выпадающее окно выбора значений с увеличенным шрифтом */}
            {isOpen && (
              <div className="absolute top-full left-0 mt-2 min-w-[220px] rounded-2xl border border-slate-100 bg-white p-2 shadow-xl z-30 animate-in fade-in slide-in-from-top-1 duration-150">
                {filter.options.map((opt) => {
                  const isSelected = activeValue === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(filter.id, opt.value)}
                      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-left transition-colors ${
                        isSelected
                          ? 'bg-orange-50 text-[#ff5a1f] font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <span className="text-[#ff5a1f] font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleResetAll}
          className="text-sm font-semibold text-[#ff5a1f] hover:underline ml-2 transition-all"
        >
          {locale === 'ru' ? 'Сбросить все' : 'Reset all'}
        </button>
      )}
    </div>
  );
}
export default FilterBubbles;