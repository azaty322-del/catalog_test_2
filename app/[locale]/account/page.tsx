import type { Metadata } from 'next';
import { AccountView } from '@/components/features/account/AccountView';
import { RouteGuard } from '@/components/shared/RouteGuard';
import { getTranslator } from '@/lib/i18n';
import type { Locale } from '@/types/catalog';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  return { title: getTranslator(params.locale)('account.title') };
}

export default function AccountPage() {
  return (
    <RouteGuard>
      <AccountView />
    </RouteGuard>
  );
}
