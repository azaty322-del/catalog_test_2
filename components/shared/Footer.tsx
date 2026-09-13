import React from 'react';
import Link from 'next/link';
import { Locale } from '@/lib/i18n';

export function Footer({ locale }: { locale: Locale }) {
  return (
    <footer className="mt-20 border-t border-slate-100 bg-white pt-12 pb-8 text-xs text-slate-500">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Колонка 1: Логотип и Описание */}
          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-3">
              <img src="/logo_media_color.png" alt="UTV" className="h-6 w-auto object-contain" />
              <span className="font-bold text-slate-900 text-sm">Каталог контента</span>
            </div>
            <p className="leading-relaxed text-slate-500">
              Современная экосистема качественного документального и научно-популярного контента. Исследуйте мир с нами.
            </p>
          </div>

          {/* Колонка 2: Контакты */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-sm mb-3">Контакты</h4>
            <p>
              <a href="mailto:info@videoteka.ru" className="hover:text-[#ff5a1f] transition-colors">
                info@videoteka.ru
              </a>
            </p>
            <p>
              <a href="tel:+74951234567" className="hover:text-[#ff5a1f] transition-colors">
                +7 (495) 123-45-67
              </a>
            </p>
          </div>

          {/* Колонка 3: Правовая информация */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-sm mb-3">Правовая информация</h4>
            <p>
              <Link href={`/${locale}/privacy`} className="text-[#ff5a1f] hover:underline">
                Политика конфиденциальности
              </Link>
            </p>
            <p>
              <Link href={`/${locale}/terms`} className="hover:text-[#ff5a1f] transition-colors">
                Пользовательское соглашение
              </Link>
            </p>
          </div>
        </div>

        {/* Нижняя строчка */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-6 text-slate-400">
          <p>© 2026 Каталог контента. Все права защищены.</p>
          <p>Москва, Россия</p>
        </div>
      </div>
    </footer>
  );
}
export default Footer;