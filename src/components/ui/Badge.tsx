import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'muscle' | 'success' | 'warning' | 'danger' | 'default';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    muscle: 'bg-accent/10 text-accent border-accent/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    default: 'bg-bg-overlay text-text-secondary border-border',
  };
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border', variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
