'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagProps {
  children: React.ReactNode;
  active?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
  removeLabel?: string;
}

export function Tag({ children, active, onRemove, onClick, className, removeLabel = 'Remove' }: TagProps) {
  const interactive = Boolean(onClick);

  return (
    <span
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-body-sm font-medium transition-colors',
        active
          ? 'bg-primary text-white'
          : 'bg-primary-light text-primary hover:bg-primary-light/70',
        interactive && 'cursor-pointer',
        className,
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          aria-label={removeLabel}
          className="-mr-1 rounded-full p-0.5 opacity-80 transition-opacity hover:opacity-100"
        >
          <X size={14} />
        </button>
      )}
    </span>
  );
}
