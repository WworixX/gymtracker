import { cn } from '@/lib/utils';

export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'w-3 h-3', md: 'w-5 h-5', lg: 'w-8 h-8' };
  return <div className={cn('border-2 border-border border-t-accent rounded-full animate-spin', sizes[size], className)} />;
}
