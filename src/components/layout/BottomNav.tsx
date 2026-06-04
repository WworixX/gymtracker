'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, TrendingUp, HeartPulse, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Accueil' },
  { href: '/history', icon: Calendar, label: 'Historique' },
  { href: '/progress', icon: TrendingUp, label: 'Prog.' },
  { href: '/body', icon: HeartPulse, label: 'Corps' },
  { href: '/settings', icon: User, label: 'Profil' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 glass-nav border-t border-border md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-5 h-16">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn('flex flex-col items-center justify-center gap-1 transition-colors duration-150 relative', isActive ? 'text-accent' : 'text-text-muted hover:text-text-secondary')}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
              <span className="text-[10px] font-sans font-medium uppercase tracking-wider">{label}</span>
              {isActive && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-accent" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
