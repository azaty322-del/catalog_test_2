'use client';

import { ExternalLink, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useI18n } from '@/providers/I18nProvider';
import type { Trailer } from '@/types/catalog';

/**
 * Трейлеры лежат на разных хостингах: YouTube, Rutube и VK встраиваются в iframe,
 * Яндекс.Диск и прочие ссылки — нет, для них показываем переход в новую вкладку.
 */
function toEmbedUrl(trailer: Trailer): string | null {
  if (!trailer.url) return null;

  if (trailer.host === 'youtube') {
    const id = trailer.url.match(/(?:youtu\.be\/|v=)([\w-]{11})/)?.[1];
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }

  if (trailer.host === 'rutube') {
    const id = trailer.url.match(/rutube\.ru\/video\/(?:private\/)?(\w+)/)?.[1];
    return id ? `https://rutube.ru/play/embed/${id}` : null;
  }

  if (trailer.host === 'vk') {
    // В ссылках VK идентификатор состоит из владельца и записи: video-150896555_456239148
    const match = trailer.url.match(/video(-?\d+)_(\d+)/);
    return match ? `https://vk.com/video_ext.php?oid=${match[1]}&id=${match[2]}&hd=2` : null;
  }

  return null;
}

export function TrailerLink({ title, trailer }: { title: string; trailer: Trailer }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  if (!trailer?.url) return null;

  const embedUrl = toEmbedUrl(trailer);

  if (!embedUrl) {
    return (
      <a
        href={trailer.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-2 text-body-sm font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary-hover"
      >
        <ExternalLink size={16} />
        {t('film.openTrailer')}
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-2 text-body-sm font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary-hover"
      >
        <PlayCircle size={17} />
        {t('film.watchTrailer')}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={title} widthClassName="max-w-3xl" closeLabel={t('common.close')}>
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full rounded-control border-0 bg-ink"
        />
      </Modal>
    </>
  );
}
