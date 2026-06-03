import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, fullWidth, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-all focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed select-none';
    const variants = {
      primary: 'bg-accent text-bg-base hover:bg-accent-dim active:scale-95',
      secondary: 'bg-transparent border border-border-active text-text-secondary hover:bg-bg-elevated active:scale-95',
      ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated active:scale-95',
      danger: 'bg-transparent border border-danger/40 text-danger hover:bg-danger/10 active:scale-95',
    };
    const sizes = { sm: 'h-8 px-3 text-xs rounded-md', md: 'h-11 px-4 text-sm rounded-lg', lg: 'h-12 px-6 text-sm rounded-lg' };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
