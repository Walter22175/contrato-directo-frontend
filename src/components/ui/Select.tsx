'use client';

import { cn } from '@/lib/utils';
import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, placeholder, ...props }, ref) => {
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
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-[35px] border border-inkline-violet bg-deep-indigo/80 px-5 py-3 text-base font-light text-pure-white',
            'transition-colors focus:border-pulse-cobalt focus:outline-none focus:ring-2 focus:ring-pulse-cobalt/40',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/30',
            className,
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-deep-indigo text-pure-white">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-2 pl-4 text-sm text-red-400">{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
export default Select;
