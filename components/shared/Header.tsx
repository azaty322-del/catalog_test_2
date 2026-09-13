'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, ChevronDown, User, ShoppingCart } from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { Category } from '@/types/catalog';
import { useCart } from '@/providers/CartProvider';

interface HeaderProps {
  locale: Locale;
  categories: Category[];
}

export function Header({ locale, categories }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { items } = useCart();
  const cartCount = items?.length || 0;

  const currentCategory = searchParams.get('category') || '';
  const currentQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(currentQuery);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSearchQuery(currentQuery);
  }, [currentQuery]);

  const mainCategories = categories.slice(0, 3);
  const moreCategories = categories.slice(3);

  const getLocalePath = (targetLocale: string) => {
    if (!pathname) return `/${targetLocale}`;
    const segments = pathname.split('/');
    segments[1] = targetLocale;
    const query = searchParams.toString();
    return `${segments.join('/') || `/${targetLocale}`}${query ? `?${query}` : ''}`;
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsMoreOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsMoreOpen(false);
    }, 150);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    router.push(`/${locale}?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-6 lg:px-12">
        {/* Логотип + Меню категорий + Язык */}
        <div className="flex items-center gap-8">
          <Link href={`/${locale}`} className="flex items-center gap-3">
            <img
              src="/logo_media_color.png"
              alt="UTV"
              className="h-8 w-auto object-contain"
            />
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Каталог контента
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-700">
            {mainCategories.map((c) => {
              const title = typeof c.title === 'object' && c.title !== null
                ? (c.title[locale] || c.title.ru)
                : ((c as any).name || c.slug);
              const isActive = currentCategory === c.slug;
              return (
                <Link
                  key={c.slug}
                  href={`/${locale}?category=${c.slug}`}
                  className={`transition-colors ${
                    isActive ? 'font-bold text-[#ff5a1f]' : 'hover:text-[#ff5a1f]'
                  }`}
                >
                  {title}
                </Link>
              );
            })}

            {/* Выпадающий список «Ещё» */}
            {moreCategories.length > 0 && (
              <div
                className="relative py-4"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div className="flex items-center gap-1 cursor-pointer transition-colors hover:text-[#ff5a1f]">
                  <span>{locale === 'en' ? 'More' : 'Ещё'}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${isMoreOpen ? 'rotate-180 text-[#ff5a1f]' : ''}`}
                  />
                </div>

                {isMoreOpen && (
                  <div className="absolute top-full left-0 w-52 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {moreCategories.map((c) => {
                      const title = typeof c.title === 'object' && c.title !== null
                        ? (c.title[locale] || c.title.ru)
                        : ((c as any).name || c.slug);
                      const isActive = currentCategory === c.slug;
                      return (
                        <Link
                          key={c.slug}
                          href={`/${locale}?category=${c.slug}`}
                          onClick={() => setIsMoreOpen(false)}
                          className={`block rounded-xl px-3.5 py-2 text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-orange-50 font-bold text-[#ff5a1f]'
                              : 'text-slate-700 hover:bg-orange-50 hover:text-[#ff5a1f]'
                          }`}
                        >
                          {title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Переключатель языка RU / EN */}
            <div className="flex items-center text-xs font-semibold ml-2">
              <Link
                href={getLocalePath('ru')}
                className={`transition-colors ${locale === 'ru' ? 'font-bold text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                RU
              </Link>
              <span className="mx-1 text-slate-300">/</span>
              <Link
                href={getLocalePath('en')}
                className={`transition-colors ${locale === 'en' ? 'font-bold text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                EN
              </Link>
            </div>
          </nav>
        </div>

        {/* Правый блок: Поиск + Корзина + Профиль */}
        <div className="flex items-center gap-3.5">
          <form onSubmit={handleSearch} className="relative hidden sm:block w-52 md:w-64">
            <button
              type="submit"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#ff5a1f] transition-colors"
            >
              <Search size={15} />
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию или тегу..."
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#ff5a1f] focus:ring-1 focus:ring-[#ff5a1f]"
            />
          </form>

          {/* Иконка корзины с бейджем количества */}
          <Link
            href={`/${locale}/cart`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:border-[#ff5a1f] hover:text-[#ff5a1f] hover:bg-orange-50/50 transition-all"
            title="Корзина"
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff5a1f] px-1 text-[10px] font-bold text-white shadow-sm">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Профиль */}
          <Link
            href={`/${locale}/account`}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 hover:ring-2 hover:ring-orange-400 transition-all"
            title="Личный кабинет"
          >
            <User size={18} className="text-slate-600" />
          </Link>
        </div>
      </div>
    </header>
  );
}
export default Header;