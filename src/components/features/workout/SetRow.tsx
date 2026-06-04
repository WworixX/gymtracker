'use client';

import { useRef, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
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

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    if (dx < 0) { setSwiping(true); setSwipeX(Math.max(dx, -80)); }
  };
  const handleTouchEnd = () => {
    if (swipeX < -60) { onDelete(); }
    else { setSwiping(false); setSwipeX(0); }
  };

  if (set.completed) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-success/10 border border-success/25">
        <span className="w-5 text-center text-xs font-mono text-text-muted shrink-0">{set.set_number}</span>
        <Check size={14} className="text-success shrink-0" strokeWidth={2.5} />
        <span className="font-mono text-sm text-success font-semibold">
          {set.weight} kg × {set.reps} reps
        </span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe-to-delete background */}
      <div className="absolute inset-y-0 right-0 flex items-center px-4 bg-danger/20 rounded-xl">
        <Trash2 size={14} className="text-danger" />
      </div>

      <motion.div
        style={{ x: swiping ? swipeX : 0 }}
        transition={swiping ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 400, damping: 30 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="bg-bg-overlay border border-border rounded-xl overflow-hidden"
      >
        {/* Inputs row */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <span className="w-5 text-center text-xs font-mono text-text-muted shrink-0">{set.set_number}</span>

          {/* Weight */}
          <div className="flex-1 flex flex-col items-center">
            <label className="text-[9px] font-mono uppercase tracking-widest text-text-muted mb-1">Poids</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="decimal"
                value={set.weight || ''}
                onChange={(e) => onUpdate('weight', parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-20 h-11 text-center bg-bg-elevated border border-border rounded-lg text-base font-mono font-semibold text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
              />
              <span className="text-text-muted text-xs font-mono">kg</span>
            </div>
          </div>

          <span className="text-text-muted text-lg font-mono shrink-0 pb-1">×</span>

          {/* Reps */}
          <div className="flex-1 flex flex-col items-center">
            <label className="text-[9px] font-mono uppercase tracking-widest text-text-muted mb-1">Reps</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="numeric"
                value={set.reps || ''}
                onChange={(e) => onUpdate('reps', parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-16 h-11 text-center bg-bg-elevated border border-border rounded-lg text-base font-mono font-semibold text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
              />
              <span className="text-text-muted text-xs font-mono">reps</span>
            </div>
          </div>
        </div>

        {/* Validate button */}
        <div className="px-3 pb-3">
          <button
            onClick={onComplete}
            disabled={!set.weight || !set.reps}
            className={cn(
              'w-full h-11 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              set.weight && set.reps
                ? 'bg-accent text-bg-base hover:bg-accent-dim active:scale-95'
                : 'bg-bg-elevated border border-border text-text-muted'
            )}
          >
            <Check size={16} strokeWidth={2.5} />
            Valider la série
          </button>
        </div>
      </motion.div>
    </div>
  );
}
