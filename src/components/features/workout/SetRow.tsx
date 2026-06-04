'use client';

import { useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ActiveSet } from '@/types';

interface SetRowProps {
  set: ActiveSet;
  onUpdate: (field: 'weight' | 'reps', value: number) => void;
  onComplete: () => void;
  onDelete: () => void;
}

export function SetRow({ set, onUpdate, onComplete, onDelete }: SetRowProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    if (dx < 0) { setSwiping(true); setSwipeX(Math.max(dx, -72)); }
  };
  const handleTouchEnd = () => {
    if (swipeX < -60) { onDelete(); }
    else { setSwiping(false); setSwipeX(0); }
  };

  if (set.completed) {
    return (
      <div className="flex items-center gap-3 px-3 h-11 rounded-lg bg-success/10 border border-success/20">
        <span className="w-4 text-center text-xs font-mono text-text-muted">{set.set_number}</span>
        <Check size={12} className="text-success" strokeWidth={3} />
        <span className="font-mono text-sm text-success">{set.weight} kg × {set.reps} reps</span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="absolute inset-y-0 right-0 flex items-center px-3 bg-danger/20">
        <span className="text-danger text-[10px] font-mono uppercase">Suppr.</span>
      </div>
      <motion.div
        style={{ x: swiping ? swipeX : 0 }}
        transition={swiping ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 400, damping: 30 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-overlay border border-border"
      >
        {/* Numéro */}
        <span className="w-4 text-center text-xs font-mono text-text-muted shrink-0">{set.set_number}</span>

        {/* Poids */}
        <input
          type="number" inputMode="decimal"
          value={set.weight || ''}
          onChange={(e) => onUpdate('weight', parseFloat(e.target.value) || 0)}
          placeholder="0"
          className="w-16 h-10 text-center bg-bg-elevated border border-border rounded-lg text-sm font-mono font-semibold text-text-primary focus:outline-none focus:border-accent transition-colors"
        />
        <span className="text-text-muted text-xs font-mono shrink-0">kg</span>
        <span className="text-text-muted text-xs font-mono shrink-0">×</span>

        {/* Reps */}
        <input
          type="number" inputMode="numeric"
          value={set.reps || ''}
          onChange={(e) => onUpdate('reps', parseInt(e.target.value, 10) || 0)}
          placeholder="0"
          className="w-14 h-10 text-center bg-bg-elevated border border-border rounded-lg text-sm font-mono font-semibold text-text-primary focus:outline-none focus:border-accent transition-colors"
        />
        <span className="text-text-muted text-xs font-mono shrink-0">reps</span>

        {/* Bouton valider */}
        <button
          onClick={onComplete}
          disabled={!set.weight || !set.reps}
          className={cn(
            'ml-auto h-10 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold shrink-0 transition-all',
            set.weight && set.reps
              ? 'bg-accent text-bg-base hover:bg-accent-dim active:scale-95'
              : 'bg-bg-elevated border border-border text-text-muted opacity-40'
          )}
        >
          <Check size={13} strokeWidth={2.5} />
          <span className="hidden sm:inline">OK</span>
        </button>
      </motion.div>
    </div>
  );
}
