'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { routes } from '@/constants';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/providers/I18nProvider';
import type { Role } from '@/lib/auth';

interface RouteGuardProps {
  /** Роль, без которой страница не отдаётся. Не указана — достаточно быть авторизованным. */
  requiredRole?: Role;
  children: React.ReactNode;
}

/**
 * Настоящая проверка доступа, а не скрытие ссылки: прямой переход по адресу
 * упирается в редирект. Контент не рендерится, пока проверка не пройдена.
 */
export function RouteGuard({ requiredRole, children }: RouteGuardProps) {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const { locale, t } = useI18n();

  const allowed = user !== null && (!requiredRole || user.role === requiredRole);

  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      router.replace(routes.login(locale));
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      router.replace(routes.forbidden(locale));
    }
  }, [isReady, user, requiredRole, router, locale]);

  if (!isReady || !allowed) {
    return (
      <div className="container-page py-20 text-center text-body-sm text-ink-muted" aria-busy="true">
        {t('common.loading')}…
      </div>
    );
  }

  return <>{children}</>;
}
