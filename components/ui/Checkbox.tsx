'use client';

import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

export function Checkbox({ checked, indeterminate, onChange, label, className }: CheckboxProps) {
  const filled = checked || indeterminate;

  return (
    <label className={cn('flex cursor-pointer items-center gap-2.5 text-body-sm', className)}>
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border transition-colors',
          filled ? 'border-primary bg-primary text-white' : 'border-line bg-white',
        )}
      >
        {indeterminate ? <Minus size={14} /> : checked ? <Check size={14} /> : null}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
