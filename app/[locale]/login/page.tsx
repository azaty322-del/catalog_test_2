import type { Metadata } from 'next';
import { AuthCard } from '@/components/features/account/AuthCard';
import { getTranslator } from '@/lib/i18n';
import type { Locale } from '@/types/catalog';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  return { title: getTranslator(params.locale)('auth.login') };
}

export default function LoginPage() {
  return <AuthCard mode="login" />;
}
