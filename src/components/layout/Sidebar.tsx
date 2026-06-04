'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, TrendingUp, HeartPulse, User, LogOut, Dumbbell, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkoutStore } from '@/stores/workout-store';
import { useAuth } from '@/components/providers/AuthProvider';

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Accueil' },
  { href: '/history', icon: Calendar, label: 'Historique' },
  { href: '/progress', icon: TrendingUp, label: 'Progression' },
  { href: '/body', icon: HeartPulse, label: 'Corps' },
  { href: '/settings', icon: User, label: 'Profil' },
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

      {/* Active workout banner */}
      {activeWorkout && (
        <Link
          href={`/workout/${activeWorkout.id}`}
          className="mx-3 mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors"
        >
          <Zap size={14} strokeWidth={2.5} />
          <span className="font-mono uppercase tracking-wider text-xs">Séance en cours</span>
          <span className="ml-auto w-2 h-2 bg-accent rounded-full animate-pulse" />
        </Link>
      )}

      <nav className="flex flex-col gap-1 p-3 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm', isActive ? 'bg-accent/10 text-accent border border-accent/20' : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated')}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="font-mono uppercase tracking-wider text-xs">{label}</span>
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
