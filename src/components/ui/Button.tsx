'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center font-medium rounded-xl transition-all',
          {
            'bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-[var(--color-primary-dark)]': variant === 'primary',
            'bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-elevated)] text-white': variant === 'secondary',
            'bg-transparent hover:bg-[var(--color-surface-light)] text-white': variant === 'ghost',
            'bg-red-600 hover:bg-red-500 text-white': variant === 'danger',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
