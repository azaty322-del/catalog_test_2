import type { Metadata } from 'next';
import { ShieldAlert } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { routes } from '@/constants';
import { getTranslator } from '@/lib/i18n';
import type { Locale } from '@/types/catalog';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  return { title: getTranslator(params.locale)('errors.forbiddenTitle') };
}

export default function ForbiddenPage({ params }: { params: { locale: Locale } }) {
  const t = getTranslator(params.locale);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <ShieldAlert size={40} className="text-primary" strokeWidth={1.5} />
      <p className="mt-4 text-[64px] font-extrabold leading-none text-primary">403</p>
      <h1 className="mt-4 text-h2">{t('errors.forbiddenTitle')}</h1>
      <p className="mt-2 max-w-sm text-body-sm text-ink-muted">{t('errors.forbiddenText')}</p>
      <ButtonLink href={routes.account(params.locale)} className="mt-7">
        {t('account.title')}
      </ButtonLink>
    </div>
  );
}
