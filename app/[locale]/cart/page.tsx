import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CartView } from '@/components/features/cart/CartView';
import { getTranslator } from '@/lib/i18n';
import type { Locale } from '@/types/catalog';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  return { title: getTranslator(params.locale)('cart.title') };
}

export default function CartPage() {
  return (
    <Suspense fallback={<div className="container-page py-16" aria-busy="true" />}>
      <CartView />
    </Suspense>
  );
}
