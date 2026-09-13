import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'primary' | 'success' | 'danger';

const tones: Record<Tone, string> = {
  neutral: 'bg-canvas text-ink-muted',
  primary: 'bg-primary text-white',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-control px-2.5 py-1 text-caption font-semibold uppercase tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
