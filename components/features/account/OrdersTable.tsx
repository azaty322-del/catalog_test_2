'use client';

import { EmptyState } from '@/components/ui/EmptyState';
import { useI18n } from '@/providers/I18nProvider';

/**
 * История заказов появится вместе с backend: заявки из корзины пока никуда
 * не отправляются, поэтому показываем честное пустое состояние, а не выдуманные строки.
 */
export function OrdersTable() {
  const { t } = useI18n();

  return (
    <section className="surface p-6 sm:p-7">
      <h1 className="text-h3">{t('account.orderHistory')}</h1>
      <div className="mt-6">
        <EmptyState title={t('account.noOrders')} description={t('account.noOrdersText')} />
      </div>
    </section>
  );
}
