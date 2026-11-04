'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-light rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse-cobalt/60 focus-visible:ring-offset-2 focus-visible:ring-offset-void-navy disabled:opacity-40 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-pulse-cobalt text-pure-white hover:bg-[#2c3bd0]',
      secondary: 'bg-white/5 text-pure-white border border-inkline-violet hover:border-dusk-iris hover:bg-white/10',
      outline: 'border border-pure-white/70 text-pure-white hover:bg-white/10 hover:border-pure-white',
      ghost: 'text-slate-300 hover:text-pure-white hover:bg-white/5',
      danger: 'bg-red-500 text-pure-white hover:bg-red-600',
    };

    const sizes = {
      sm: 'px-4 py-1.5 text-sm',
      md: 'px-[22px] py-[11px] text-[15px]',
      lg: 'px-7 py-3.5 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
export default Button;
