import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertProps {
  tone?: 'error' | 'success';
  title: string;
  description?: string;
  className?: string;
}

export function Alert({ tone = 'error', title, description, className }: AlertProps) {
  const isError = tone === 'error';
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-control border px-4 py-3',
        isError ? 'border-danger/30 bg-danger/5' : 'border-success/30 bg-success/5',
        className,
      )}
    >
      <Icon size={18} className={cn('mt-0.5 shrink-0', isError ? 'text-danger' : 'text-success')} />
      <div>
        <p className={cn('text-body-sm font-semibold', isError ? 'text-danger' : 'text-success')}>
          {title}
        </p>
        {description && <p className="mt-0.5 text-body-sm text-ink-muted">{description}</p>}
      </div>
    </div>
  );
}
