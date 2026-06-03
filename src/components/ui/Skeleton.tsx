import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-bg-elevated rounded animate-pulse', className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-bg-surface border border-border rounded-lg p-4', className)}>
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-6 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}
