'use client';

import { Check, X, Share2, Trash2, Copy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { routes } from '@/constants';
import { formatDuration, formatYears } from '@/lib/format';
import { useCart } from '@/providers/CartProvider';
import { useI18n } from '@/providers/I18nProvider';
import { resolveText } from '@/types/catalog';

interface OrderContact {
  fullName: string;
  email: string;
  phone: string;
}

const emptyContact: OrderContact = { fullName: '', email: '', phone: '' };

export function CartView() {
  const searchParams = useSearchParams();
  const { t, locale, plural } = useI18n();
  const { items, count, remove, clear, addToCart, isReady } = useCart();
  const [contact, setContact] = useState<OrderContact>(emptyContact);
  const [errors, setErrors] = useState<Partial<Record<keyof OrderContact, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importedNotice, setImportedNotice] = useState<string | null>(null);

  // Auto-import items if shared link has ?items=id1,id2
  useEffect(() => {
    const itemsParam = searchParams?.get('items');
    if (!itemsParam || !isReady) return;

    const rawIds = itemsParam.split(',').map((s) => s.trim()).filter(Boolean);
    if (rawIds.length === 0) return;

    const missingIds = rawIds.filter((id) => !items.some((item) => String(item.id) === String(id)));
    if (missingIds.length === 0) return;

    fetch(`/api/movies?ids=${missingIds.join(',')}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.movies) && data.movies.length > 0) {
          data.movies.forEach((movie: any) => addToCart(movie));
          setImportedNotice(
            locale === 'en'
              ? `Added ${data.movies.length} item(s) from shared link`
              : `Добавлено тайтлов по ссылке: ${data.movies.length}`
          );
          setTimeout(() => setImportedNotice(null), 5000);
        }
      })
      .catch((e) => console.error('Ошибка загрузки тайтлов по ссылке:', e));
  }, [searchParams, isReady]);

  const handleShare = async () => {
    if (items.length === 0) return;
    const ids = items.map((m) => m.id).join(',');
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/${locale}/cart?items=${ids}`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        throw new Error('No clipboard API');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      prompt(locale === 'en' ? 'Copy cart link:' : 'Скопируйте ссылку на корзину:', shareUrl);
    }
  };

  const update = (field: keyof OrderContact) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setContact((prev: OrderContact) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof OrderContact, string>> = {};
    if (!contact.fullName.trim()) next.fullName = t('auth.errorName');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) next.email = t('auth.errorEmail');
    if (contact.phone.replace(/\D/g, '').length < 10) next.phone = t('auth.errorPhone');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const orderItems = items.map((m) => ({
        id: m.id,
        title: resolveText(m.title, locale),
        poster: m.poster,
        category: m.category,
        qualities: m.qualities,
        totalDurationMinutes: m.totalDurationMinutes,
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: contact.fullName,
          email: contact.email,
          phone: contact.phone,
          items: orderItems,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        clear();
        setContact(emptyContact);
      } else {
        const data = await res.json();
        alert(data.error || 'Ошибка при отправке заказа');
      }
    } catch (e) {
      console.error('Ошибка отправки заказа:', e);
      setSubmitted(true);
      clear();
      setContact(emptyContact);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isReady) {
    return <div className="container-page py-16" aria-busy="true" />;
  }

  return (
    <div className="container-page py-9">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-h1">{t('cart.title')}</h1>
          <span className="text-h3 text-ink-muted">
            ({count} {plural(count, { one: t('cart.videos'), few: t('cart.videos'), many: t('cart.videos') })})
          </span>
        </div>

        {count > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-body-sm font-medium transition-colors hover:border-primary hover:text-primary active:scale-[0.98]"
              title={t('cart.share')}
            >
              {copied ? (
                <>
                  <Check size={16} className="text-success" />
                  <span className="font-semibold text-success">{t('cart.copied')}</span>
                </>
              ) : (
                <>
                  <Share2 size={16} />
                  <span>{t('cart.share')}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-caption font-medium text-ink-muted transition-colors hover:border-danger hover:text-danger"
              title={t('cart.clear')}
            >
              <Trash2 size={14} />
              <span>{t('cart.clear')}</span>
            </button>
          </div>
        )}
      </div>

      {importedNotice && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-body-sm text-success">
          <div className="flex items-center gap-2">
            <Check size={18} />
            <span>{importedNotice}</span>
          </div>
          <button type="button" onClick={() => setImportedNotice(null)} className="text-ink-muted hover:text-ink">
            <X size={16} />
          </button>
        </div>
      )}

      {count === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={t('cart.empty')}
            description={t('cart.emptyText')}
            action={
              <ButtonLink href={routes.home(locale)} size="medium">
                {t('catalog.toCatalog')}
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-8">
          <ul className="space-y-4">
            {items.map((movie) => (
              <li key={movie.id} className="surface flex items-center gap-4 p-4">
                <Link
                  href={routes.film(locale, movie.slug)}
                  className="relative aspect-video w-[112px] shrink-0 overflow-hidden rounded-[10px] bg-line/60"
                >
                  <Image src={movie.poster} alt={resolveText(movie.title, locale)} fill sizes="112px" className="object-cover" />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={routes.film(locale, movie.slug)}
                    className="block truncate text-body-sm font-bold transition-colors hover:text-primary"
                  >
                    {resolveText(movie.title, locale)}
                  </Link>
                  <p className="mt-1 text-caption text-ink-muted">
                    {formatDuration(movie.totalDurationMinutes, locale)} • {formatYears(movie)} •{' '}
                    {movie.qualities.join(' / ')}
                  </p>
                </div>

                <span className="hidden shrink-0 text-body-sm font-semibold text-primary sm:block">
                  {t('cart.priceOnRequest')}
                </span>

                <button
                  type="button"
                  onClick={() => remove(movie.id)}
                  aria-label={`${t('cart.remove')}: ${resolveText(movie.title, locale)}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line
                    text-ink-muted transition-colors hover:border-danger hover:text-danger"
                >
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>

          <aside className="surface h-fit p-6">
            <h2 className="text-h3">{t('cart.checkout')}</h2>

            <dl className="mt-5 space-y-2.5 text-body-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink-muted">{t('cart.totalSelected')}</dt>
                <dd className="font-bold">{count} {t('cart.items')}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink-muted">{t('cart.licenseCost')}</dt>
                <dd className="font-semibold text-primary">{t('cart.onRequest')}</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-center justify-between rounded-lg border border-line bg-line/20 px-3 py-2">
              <span className="text-caption text-ink-muted">{locale === 'en' ? 'Share cart link' : 'Поделиться списком'}</span>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 text-caption font-semibold text-primary hover:underline"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-success" />
                    <span className="text-success">{t('cart.copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>{t('cart.copyLink')}</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 border-t border-line pt-5">
              <p className="mb-4 text-body-sm font-bold">{t('cart.contactData')}</p>

              <div className="space-y-4">
                <Input
                  label={t('auth.fullName')}
                  value={contact.fullName}
                  onChange={update('fullName')}
                  error={errors.fullName}
                  
                  autoComplete="name"
                />
                <Input
                  label={t('auth.email')}
                  type="email"
                  value={contact.email}
                  onChange={update('email')}
                  error={errors.email}
                  
                  autoComplete="email"
                />
                <Input
                  label={t('auth.phone')}
                  type="tel"
                  value={contact.phone}
                  onChange={update('phone')}
                  error={errors.phone}
                  
                  autoComplete="tel"
                />
              </div>

              <Button fullWidth className="mt-6" onClick={submit} disabled={isSubmitting}>
                {isSubmitting ? (locale === 'en' ? 'Submitting...' : 'Отправка...') : t('cart.submit')}
              </Button>
            </div>
          </aside>
        </div>
      )}

      <Modal open={submitted} onClose={() => setSubmitted(false)} title={t('cart.sent')} closeLabel={t('common.close')}>
        <div className="flex gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
            <Check size={18} />
          </span>
          <p className="text-body-sm text-ink-muted">
            {t('cart.sentText')}
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <ButtonLink href={routes.home(locale)} size="medium">
            {t('errors.backHome')}
          </ButtonLink>
        </div>
      </Modal>
    </div>
  );
}
