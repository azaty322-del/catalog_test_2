import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, icon, className, id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-body-sm text-ink-muted">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-11 w-full rounded-control border bg-white px-3.5 text-body-sm text-ink transition-colors',
            'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
            Boolean(icon) && 'pl-10',
            error ? 'border-danger' : 'border-line',
            className,
          )}
          aria-invalid={error ? true : undefined}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-caption text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-caption text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
});
