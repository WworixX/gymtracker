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
    if (dx < 0) { setSwiping(true); setSwipeX(Math.max(dx, -80)); }
  };
  const handleTouchEnd = () => {
    if (swipeX < -60) { onDelete(); }
    else { setSwiping(false); setSwipeX(0); }
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="absolute inset-y-0 right-0 flex items-center px-4 bg-danger/20">
        <span className="text-danger text-xs font-mono uppercase">Suppr.</span>
      </div>
      <motion.div
        style={{ x: swiping ? swipeX : 0 }}
        transition={swiping ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 400, damping: 30 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors', set.completed ? 'bg-success/10 border-success/20' : 'bg-bg-overlay border-border')}
      >
        <span className="w-5 text-center text-xs font-mono text-text-muted shrink-0">{set.set_number}</span>
        <input
          type="number" inputMode="decimal"
          value={set.weight || ''}
          onChange={(e) => onUpdate('weight', parseFloat(e.target.value) || 0)}
          disabled={set.completed}
          placeholder="0"
          className="w-16 h-8 text-center bg-transparent border-b border-border focus:border-accent text-sm font-mono text-text-primary focus:outline-none disabled:text-text-secondary transition-colors"
        />
        <span className="text-text-muted text-xs font-mono shrink-0">kg</span>
        <span className="text-text-muted text-xs font-mono shrink-0">×</span>
        <input
          type="number" inputMode="numeric"
          value={set.reps || ''}
          onChange={(e) => onUpdate('reps', parseInt(e.target.value, 10) || 0)}
          disabled={set.completed}
          placeholder="0"
          className="w-12 h-8 text-center bg-transparent border-b border-border focus:border-accent text-sm font-mono text-text-primary focus:outline-none disabled:text-text-secondary transition-colors"
        />
        <span className="text-text-muted text-xs font-mono shrink-0">reps</span>
        <button
          onClick={onComplete}
          disabled={set.completed || !set.weight || !set.reps}
          className={cn('ml-auto w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0', set.completed ? 'bg-success/20 text-success' : 'bg-bg-elevated border border-border text-text-muted hover:border-accent hover:text-accent disabled:opacity-30')}
        >
          <Check size={14} strokeWidth={2.5} />
        </button>
      </motion.div>
    </div>
  );
}
