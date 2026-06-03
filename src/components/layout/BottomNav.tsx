'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Zap, Calendar, TrendingUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkoutStore } from '@/stores/workout-store';

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/workout/new', icon: Zap, label: 'Séance' },
  { href: '/history', icon: Calendar, label: 'Historique' },
  { href: '/progress', icon: TrendingUp, label: 'Prog.' },
  { href: '/body', icon: User, label: 'Corps' },
];

export function BottomNav() {
  const pathname = usePathname();
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-bg-base border-t border-border md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-5 h-16">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isWorkout = href === '/workout/new';
          const isActive = isWorkout ? pathname.startsWith('/workout') : pathname === href;
          return (
            <Link
              key={href}
              href={isWorkout && activeWorkout ? `/workout/${activeWorkout.id}` : href}
              className={cn('flex flex-col items-center justify-center gap-1 transition-colors relative', isActive ? 'text-accent' : 'text-text-muted hover:text-text-secondary')}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                {isWorkout && activeWorkout && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full animate-pulse" />
                )}
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
