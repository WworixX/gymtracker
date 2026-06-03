import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, suffix, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-mono uppercase tracking-widest text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full h-11 px-3 bg-bg-overlay border border-border rounded-lg',
              'text-text-primary font-mono text-sm placeholder:text-text-muted',
              'focus:outline-none focus:border-border-active focus:ring-1 focus:ring-accent/30 transition-colors',
              suffix && 'pr-10',
              error && 'border-danger/50 focus:ring-danger/30',
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs font-mono">{suffix}</span>
          )}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
