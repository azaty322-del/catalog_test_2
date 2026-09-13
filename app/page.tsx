import { redirect } from 'next/navigation';
import { DEFAULT_LOCALE } from '@/lib/i18n';

/** Корень сайта ведёт на язык по умолчанию. */
export default function RootPage() {
  redirect(`/${DEFAULT_LOCALE}`);
}
