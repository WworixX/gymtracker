import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({ className, elevated, children, ...props }: CardProps) {
  return (
    <div className={cn('rounded-lg border border-border p-4', elevated ? 'bg-bg-elevated' : 'bg-bg-surface', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center justify-between mb-3', className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-xs font-mono uppercase tracking-widest text-text-secondary', className)} {...props}>
      {children}
    </h3>
  );
}
