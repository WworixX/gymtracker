'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Zap, Calendar, TrendingUp, User, Settings, LogOut, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkoutStore } from '@/stores/workout-store';
import { useAuth } from '@/components/providers/AuthProvider';

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/workout/new', icon: Zap, label: 'Séance' },
  { href: '/history', icon: Calendar, label: 'Historique' },
  { href: '/progress', icon: TrendingUp, label: 'Progression' },
  { href: '/body', icon: User, label: 'Corps' },
  { href: '/settings', icon: Settings, label: 'Paramètres' },
];

export function Sidebar() {
  const pathname = usePathname();
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const { signOut } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen fixed left-0 top-0 bg-bg-base border-r border-border z-30">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
          <Dumbbell size={16} className="text-bg-base" strokeWidth={2.5} />
        </div>
        <span className="font-mono text-sm font-semibold text-text-primary uppercase tracking-widest">GymTracker</span>
      </div>
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isWorkout = href === '/workout/new';
          const isActive = isWorkout ? pathname.startsWith('/workout') : pathname === href;
          return (
            <Link
              key={href}
              href={isWorkout && activeWorkout ? `/workout/${activeWorkout.id}` : href}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm relative', isActive ? 'bg-accent/10 text-accent border border-accent/20' : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated')}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="font-mono uppercase tracking-wider text-xs">{label}</span>
              {isWorkout && activeWorkout && <span className="ml-auto w-2 h-2 bg-accent rounded-full animate-pulse" />}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <LogOut size={16} />
          <span className="font-mono uppercase tracking-wider text-xs">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
