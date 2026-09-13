import type { Metadata } from 'next';
import { AdminDashboard } from '@/components/features/admin/AdminDashboard';
import { RouteGuard } from '@/components/shared/RouteGuard';
import { getAllMovies, getCategories } from '@/lib/catalog';
import { getTranslator } from '@/lib/i18n';
import type { Locale } from '@/types/catalog';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  return { title: getTranslator(params.locale)('admin.title') };
}

export default async function AdminPage() {
  const [movies, categories] = await Promise.all([getAllMovies(), getCategories()]);

  return (
    <RouteGuard requiredRole="ADMIN">
      <AdminDashboard movies={movies} categories={categories} />
    </RouteGuard>
  );
}
