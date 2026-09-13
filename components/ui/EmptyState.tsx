import { Film } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card bg-canvas px-6 py-16 text-center">
      <Film size={32} className="mb-4 text-ink-muted" strokeWidth={1.5} />
      <p className="text-body font-semibold">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-body-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
