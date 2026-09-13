'use client';

import { LayoutDashboard, LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { OrdersTable } from './OrdersTable';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { ACCOUNT_TABS, routes } from '@/constants';
import type { AccountTabId } from '@/constants';
import { formatCardMeta } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useCart } from '@/providers/CartProvider';
import { useI18n } from '@/providers/I18nProvider';
import { resolveText } from '@/types/catalog';

export function AccountView() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { user, isAdmin, logout, updateProfile } = useAuth();
  const { items: favorites, remove } = useCart();

  const [tab, setTab] = useState<AccountTabId>('profile');
  const [saved, setSaved] = useState(false);
  const [notifyOrders, setNotifyOrders] = useState(true);
  const [notifyNews, setNotifyNews] = useState(false);

  if (!user) return null;

  const update = (field: 'fullName' | 'email' | 'phone' | 'company' | 'position') =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateProfile({ [field]: event.target.value });
      setSaved(false);
    };

  const handleLogout = async () => {
    await logout();
    router.push(routes.home(locale));
  };

  return (
    <div className="container-page py-9">
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        <nav className="h-fit space-y-1" aria-label={t('account.title')}>
          <div className="surface p-2">
            {ACCOUNT_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-current={tab === item.id ? 'page' : undefined}
                className={cn(
                  'block w-full rounded-control px-4 py-2.5 text-left text-body-sm transition-colors',
                  tab === item.id ? 'bg-primary-light font-semibold text-primary' : 'hover:bg-canvas',
                )}
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>

          {isAdmin && (
            <Link
              href={routes.admin(locale)}
              className="flex items-center gap-2 rounded-card border border-primary bg-white px-4 py-2.5 text-body-sm font-semibold text-primary transition-colors hover:bg-primary-light"
            >
              <LayoutDashboard size={16} />
              {t('account.goToAdmin')}
            </Link>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-card border border-line bg-white px-4 py-2.5 text-body-sm transition-colors hover:border-danger hover:text-danger"
          >
            <LogOut size={16} />
            {t('auth.logout')}
          </button>
        </nav>

        <div className="space-y-6">
          {tab === 'profile' && (
            <section className="surface p-6 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-h3">{t('account.personalData')}</h1>
                <span className="rounded-control bg-canvas px-2.5 py-1 text-caption font-semibold text-ink-muted">
                  {t('account.role')}: {isAdmin ? t('account.roleAdmin') : t('account.roleUser')}
                </span>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Input label={t('auth.fullName')} value={user.fullName} onChange={update('fullName')} />
                <Input label={t('auth.company')} value={user.company ?? ''} onChange={update('company')} />
                <Input label={t('auth.email')} type="email" value={user.email} onChange={update('email')} />
                <Input label={t('auth.position')} value={user.position ?? ''} onChange={update('position')} />
                <Input label={t('auth.phone')} type="tel" value={user.phone ?? ''} onChange={update('phone')} />
              </div>

              <div className="mt-7 flex items-center gap-4">
                <Button onClick={() => setSaved(true)}>{t('account.save')}</Button>
                {saved && <span className="text-body-sm text-success">{t('account.saved')}</span>}
              </div>
            </section>
          )}

          {tab === 'orders' && <OrdersTable />}

          {tab === 'favorites' && (
            <section className="surface p-6 sm:p-7">
              <h1 className="text-h3">{t('account.favorites')}</h1>

              {favorites.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    title={t('account.favoritesEmpty')}
                    description={t('account.favoritesEmptyText')}
                    action={
                      <ButtonLink href={routes.home(locale)} size="medium">
                        {t('catalog.toCatalog')}
                      </ButtonLink>
                    }
                  />
                </div>
              ) : (
                <ul className="mt-6 space-y-4">
                  {favorites.map((movie) => (
                    <li key={movie.id} className="flex items-center gap-4 border-b border-line pb-4 last:border-b-0 last:pb-0">
                      <Link
                        href={routes.film(locale, movie.slug)}
                        className="relative aspect-video w-[96px] shrink-0 overflow-hidden rounded-[10px] bg-line/60"
                      >
                        <Image src={movie.poster} alt={resolveText(movie.title, locale)} fill sizes="96px" className="object-cover" />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link href={routes.film(locale, movie.slug)} className="block truncate text-body-sm font-semibold hover:text-primary">
                          {resolveText(movie.title, locale)}
                        </Link>
                        <p className="mt-1 text-caption text-ink-muted">{formatCardMeta(movie, locale)}</p>
                      </div>

                      <Button variant="ghost" size="small" onClick={() => remove(movie.id)}>
                        {t('cart.remove')}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {tab === 'settings' && (
            <section className="surface p-6 sm:p-7">
              <h1 className="text-h3">{t('account.settings')}</h1>

              <div className="mt-6">
                <h2 className="mb-3 text-body-sm font-semibold">{t('account.notifications')}</h2>
                <div className="space-y-3">
                  <Toggle label={t('account.notifyOrders')} checked={notifyOrders} onChange={setNotifyOrders} />
                  <Toggle label={t('account.notifyNews')} checked={notifyNews} onChange={setNotifyNews} />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
