import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-control bg-line/70', className)} />;
}

export function MovieCardSkeleton() {
  return (
    <div className="rounded-card bg-white p-3 shadow-card">
      <Skeleton className="aspect-video w-full rounded-[10px]" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
    </div>
  );
}
