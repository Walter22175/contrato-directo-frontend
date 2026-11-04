'use client';

import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-2 block text-[10px] font-normal uppercase tracking-[0.22em] text-quartz-lavender"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-[35px] border border-inkline-violet bg-deep-indigo/80 px-5 py-3 text-base font-light text-pure-white placeholder:text-mist-lilac',
            'transition-colors focus:border-pulse-cobalt focus:outline-none focus:ring-2 focus:ring-pulse-cobalt/40',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/30',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-2 pl-4 text-sm text-red-400">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
