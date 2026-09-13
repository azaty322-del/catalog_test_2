'use client';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/providers/I18nProvider';

export default function LocaleError({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16">
      <div className="w-full max-w-md">
        <Alert title={t('errors.connectionTitle')} description={t('errors.connectionText')} />
        <Button fullWidth className="mt-5" onClick={reset}>
          {t('errors.retry')}
        </Button>
      </div>
    </div>
  );
}
