'use client';

import { Check, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/providers/CartProvider';
import { useI18n } from '@/providers/I18nProvider';
import type { Movie } from '@/types/catalog';

export function AddToCartButton({ movie }: { movie: Movie }) {
  const { has, toggle, isReady } = useCart();
  const { t } = useI18n();
  const inCart = has(movie.id);

  return (
    <Button
      variant={inCart ? 'secondary' : 'primary'}
      onClick={() => toggle(movie)}
      disabled={!isReady}
      className="min-w-[240px]"
    >
      {inCart ? <Check size={18} /> : <ShoppingCart size={18} />}
      {inCart ? t('film.inCart') : t('film.addToCart')}
    </Button>
  );
}
