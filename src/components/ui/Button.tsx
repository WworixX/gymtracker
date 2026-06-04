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
    const base = 'inline-flex items-center justify-center gap-2 font-sans font-medium transition-all duration-150 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.97]';
    const variants = {
      primary: 'bg-accent text-[#0c0c0f] font-semibold hover:brightness-105',
      secondary: 'bg-bg-elevated border border-border text-text-secondary hover:border-border-active hover:text-text-primary',
      ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
      danger: 'bg-transparent border border-danger/40 text-danger hover:bg-danger/10',
    };
    const sizes = { sm: 'h-8 px-3 text-xs rounded-lg', md: 'h-11 px-4 text-sm rounded-[10px]', lg: 'h-12 px-6 text-sm rounded-[10px]' };

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
