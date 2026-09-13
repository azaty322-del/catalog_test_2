import Link from 'next/link';
import { DEFAULT_LOCALE, getTranslator } from '@/lib/i18n';

export default function LocaleNotFound() {
  const t = getTranslator(DEFAULT_LOCALE);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-[64px] font-extrabold leading-none text-primary">404</p>
      <h1 className="mt-4 text-h2">{t('errors.notFoundTitle')}</h1>
      <p className="mt-2 max-w-sm text-body-sm text-ink-muted">{t('errors.notFoundText')}</p>
      <Link
        href={`/${DEFAULT_LOCALE}`}
        className="mt-7 inline-flex h-12 items-center rounded-control bg-primary px-6 text-body-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        {t('errors.backHome')}
      </Link>
    </div>
  );
}
