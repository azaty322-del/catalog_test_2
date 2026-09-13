import Link from 'next/link';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'large' | 'medium' | 'small';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover disabled:bg-primary/40 disabled:text-white',
  secondary:
    'border border-primary bg-white text-primary hover:border-primary-hover hover:text-primary-hover disabled:border-primary/30 disabled:text-primary/40',
  ghost:
    'bg-transparent text-primary hover:text-primary-hover disabled:text-primary/40',
};

const sizes: Record<ButtonSize, string> = {
  large: 'h-12 px-6 text-[15px]',
  medium: 'h-10 px-4 text-[14px]',
  small: 'h-8 px-3 text-[13px]',
};

const base =
  'inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors disabled:cursor-not-allowed';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}

export interface ButtonProps
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'large', fullWidth, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        variant === 'ghost' && 'px-0',
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

interface ButtonLinkProps extends CommonProps {
  href: string;
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'large',
  fullWidth,
  className,
  children,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        variant === 'ghost' && 'px-0',
        fullWidth && 'w-full',
        className,
      )}
    >
      {children}
    </Link>
  );
}
