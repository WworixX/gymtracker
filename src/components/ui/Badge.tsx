import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'muscle' | 'success' | 'warning' | 'danger' | 'pr' | 'default';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    muscle: 'bg-[var(--accent-ghost)] text-accent border-[var(--accent-glow)]',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    pr: 'border-0 text-[#0c0c0f] font-sans font-semibold shadow-pr-glow',
    default: 'bg-bg-overlay text-text-secondary border-border',
  };

  const isPR = variant === 'pr';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border',
        isPR
          ? 'px-2.5 py-1 text-[11px]'
          : 'px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-widest',
        variants[variant],
        className
      )}
      style={isPR ? { background: 'linear-gradient(135deg, #c8f542, #9bbf2e)' } : undefined}
      {...props}
    >
      {children}
    </span>
  );
}
