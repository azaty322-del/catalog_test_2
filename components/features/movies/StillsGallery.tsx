'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';

interface StillsGalleryProps {
  stills: string[];
  movieTitle?: string;
}

export function StillsGallery({ stills, movieTitle = '' }: StillsGalleryProps) {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const isOpen = currentIndex !== null;
  const total = stills.length;

  const handleClose = useCallback(() => {
    setCurrentIndex(null);
  }, []);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev !== null ? (prev - 1 + total) % total : null));
  }, [total]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev !== null ? (prev + 1) % total : null));
  }, [total]);

  // Управление с клавиатуры (Esc для закрытия, стрелки для листания)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    // Блокируем прокрутку основного сайта при открытом просмотре
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose, handlePrev, handleNext]);

  if (!stills || stills.length === 0) return null;

  return (
    <section className="space-y-4">
      <h3 className="text-xl font-bold text-slate-900">
        {t('film.stills') || 'Кадры из фильма'}
      </h3>

      {/* Сетка превью кадров */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {stills.map((src, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-100 shadow-sm transition-transform duration-200 hover:scale-[1.02] cursor-pointer focus:outline-none"
          >
            <img
              src={src}
              alt={`${movieTitle} — кадр ${index + 1}`}
              className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-90"
            />
          </button>
        ))}
      </div>

      {/* Модальное окно с затемнением фона */}
      {isOpen && currentIndex !== null && (
        <div
          onClick={handleClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 sm:p-8 transition-opacity animate-in fade-in duration-200"
        >
          {/* Кнопка закрытия (крестик) */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Закрыть"
            className="absolute top-5 right-5 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>

          {/* Счетчик кадров */}
          {total > 1 && (
            <div className="absolute top-6 left-6 text-xs font-semibold text-white/70 bg-black/40 px-3 py-1.5 rounded-full select-none">
              {currentIndex + 1} / {total}
            </div>
          )}

          {/* Стрелка влево (Предыдущий кадр) */}
          {total > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Предыдущий кадр"
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 cursor-pointer"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Увеличенное изображение */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[85vh] max-w-5xl overflow-hidden rounded-2xl select-none"
          >
            <img
              src={stills[currentIndex]}
              alt={`${movieTitle} — кадр ${currentIndex + 1}`}
              className="max-h-[85vh] max-w-full w-auto h-auto object-contain rounded-2xl shadow-2xl"
            />
          </div>

          {/* Стрелка вправо (Следующий кадр) */}
          {total > 1 && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Следующий кадр"
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 cursor-pointer"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}