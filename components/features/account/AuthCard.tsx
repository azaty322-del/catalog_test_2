'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { routes } from '@/constants';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/providers/I18nProvider';

type Mode = 'login' | 'register';

interface Fields {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  password: string;
}

const EMPTY: Fields = { fullName: '', email: '', phone: '', company: '', position: '', password: '' };

export function AuthCard({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { login, register } = useAuth();

  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isRegister = mode === 'register';

  const update = (field: keyof Fields) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFields((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof Fields, string>> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) next.email = t('auth.errorEmail');
    if (isRegister ? fields.password.length < 6 : !fields.password) next.password = t('auth.errorPassword');
    if (isRegister && !fields.fullName.trim()) next.fullName = t('auth.errorName');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setPending(true);
    const result = isRegister
      ? await register({
          email: fields.email,
          password: fields.password,
          fullName: fields.fullName,
          phone: fields.phone,
          company: fields.company,
          position: fields.position,
        })
      : await login({ email: fields.email, password: fields.password });
    setPending(false);

    if (result.ok) {
      router.push(result.user.role === 'ADMIN' ? routes.admin(locale) : routes.account(locale));
      return;
    }

    setFormError(
      result.reason === 'email_taken' ? t('auth.emailTaken') : t('auth.invalidCredentials'),
    );
  };

  return (
    <div className="container-page flex justify-center py-14">
      <div className="w-full max-w-[520px] rounded-card bg-white p-8 shadow-card">
        <Tabs
          items={[
            { id: 'login', label: t('auth.login') },
            { id: 'register', label: t('auth.register') },
          ]}
          value={mode}
          onChange={(id) => router.push(id === 'login' ? routes.login(locale) : routes.register(locale))}
          className="-mx-8 mb-7 px-8"
        />

        <h1 className="text-h2">{isRegister ? t('auth.registerTitle') : t('auth.loginTitle')}</h1>
        <p className="mt-1.5 text-body-sm text-ink-muted">
          {isRegister ? t('auth.registerSubtitle') : t('auth.loginSubtitle')}
        </p>

        {formError && <Alert title={formError} className="mt-5" />}

        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          {isRegister && (
            <Input
              label={t('auth.fullName')}
              value={fields.fullName}
              onChange={update('fullName')}
              error={errors.fullName}
              autoComplete="name"
            />
          )}

          <div className={isRegister ? 'grid gap-4 sm:grid-cols-2' : undefined}>
            <Input
              label={t('auth.email')}
              type="email"
              value={fields.email}
              onChange={update('email')}
              error={errors.email}
              autoComplete="email"
            />
            {isRegister && (
              <Input
                label={t('auth.phone')}
                type="tel"
                value={fields.phone}
                onChange={update('phone')}
                autoComplete="tel"
              />
            )}
          </div>

          {isRegister && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('auth.company')}
                value={fields.company}
                onChange={update('company')}
                autoComplete="organization"
              />
              <Input
                label={t('auth.position')}
                value={fields.position}
                onChange={update('position')}
                autoComplete="organization-title"
              />
            </div>
          )}

          <Input
            label={t('auth.password')}
            type="password"
            value={fields.password}
            onChange={update('password')}
            error={errors.password}
            placeholder={isRegister ? t('auth.passwordNew') : undefined}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />

          <Button type="submit" fullWidth disabled={pending} className="!mt-7">
            {isRegister ? t('auth.submitRegister') : t('auth.signIn')}
          </Button>
        </form>

        {isRegister && (
          <p className="mt-4 text-center text-caption text-ink-muted">
            {t('auth.consent')}{' '}
            <Link href={routes.privacy(locale)} className="text-primary underline underline-offset-2">
              {t('auth.privacyLink')}
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
