import type { Metadata } from 'next';
import { getTranslator } from '@/lib/i18n';
import type { Locale } from '@/types/catalog';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  return { title: getTranslator(params.locale)('footer.terms') };
}

export default function TermsPage({ params }: { params: { locale: Locale } }) {
  const t = getTranslator(params.locale);

  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-h1">{t('footer.terms')}</h1>
      <p className="mt-4 text-body text-ink-muted">{t('catalog.emptyText')}</p>
    </div>
  );
}
