'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  locale?: string;
  title?: string;
}

export function Logo({ locale = 'ru', title }: LogoProps) {
  // Название каталога на текущем языке
  const siteTitle = title || (locale === 'en' ? 'Content Catalog' : 'Каталог контента');

  return (
    <Link
      href={`/${locale}`}
      className="flex items-center gap-3.5 group select-none flex-shrink-0"
    >
      {/* Фирменный графический знак UTV MEDIA */}
      <div className="relative h-9 w-[78px] flex items-center justify-center flex-shrink-0">
        <Image
          src="/logo_media_color.png"
          alt="UTV Media"
          width={156}
          height={72}
          priority
          className="h-full w-auto object-contain transition-transform group-hover:scale-105"
        />
      </div>

      {/* Название сервиса с автоматическим переводом */}
      <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
        {siteTitle}
      </span>
    </Link>
  );
}