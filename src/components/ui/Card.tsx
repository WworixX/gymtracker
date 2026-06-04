import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: boolean;
  hover?: boolean;
}

export function Card({ className, accent, hover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'card-glass p-5',
        accent && 'card-accent',
        hover && 'card-hover',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-[11px] font-sans font-medium uppercase tracking-[0.12em] text-text-muted', className)}
      {...props}
    >
      {children}
    </h3>
  );
}
