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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3 px-3.5 h-11 rounded-[10px] border"
        style={{ background: 'rgba(200,245,66,0.055)', borderColor: 'rgba(200,245,66,0.12)' }}
      >
        <span className="w-4 text-center text-xs font-mono text-text-muted">{set.set_number}</span>
        <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.25, times: [0, 0.6, 1] }}>
          <Check size={13} className="text-accent" strokeWidth={3} style={{ filter: 'drop-shadow(0 0 8px rgba(200,245,66,0.4))' }} />
        </motion.span>
        <span className="font-mono text-sm text-accent">{set.weight} kg × {set.reps} reps</span>
      </motion.div>
    );
  }

  const hasValues = !!set.weight && !!set.reps;

  return (
    <div className="relative overflow-hidden rounded-[10px]">
      <div className="absolute inset-y-0 right-0 flex items-center px-3 bg-danger/15 rounded-[10px]">
        <span className="text-danger text-[10px] font-mono uppercase tracking-wider">Suppr.</span>
      </div>
      <motion.div
        style={{ x: swiping ? swipeX : 0 }}
        transition={swiping ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 400, damping: 30 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-2 rounded-[10px] border transition-colors',
          hasValues
            ? 'bg-[rgba(200,245,66,0.03)] border-[rgba(200,245,66,0.15)]'
            : 'bg-transparent border-dashed border-[rgba(255,255,255,0.08)]',
          'focus-within:border-[rgba(200,245,66,0.3)] focus-within:bg-[rgba(200,245,66,0.03)]'
        )}
      >
        <span className="w-3.5 text-center text-xs font-mono text-text-muted shrink-0">{set.set_number}</span>

        {/* Poids */}
        <div className="relative flex-1 min-w-0">
          <input
            type="number" inputMode="decimal"
            value={set.weight || ''}
            onChange={(e) => onUpdate('weight', parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="w-full h-10 pl-2 pr-6 text-left bg-bg-elevated border border-border rounded-[10px] text-sm font-mono font-medium text-text-primary focus:outline-none focus:border-border-accent focus:ring-[2px] focus:ring-accent/[0.08] transition-colors"
          />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted text-[10px] font-mono pointer-events-none">kg</span>
        </div>

        <span className="text-text-muted text-xs font-mono shrink-0">×</span>

        {/* Reps */}
        <div className="relative flex-1 min-w-0">
          <input
            type="number" inputMode="numeric"
            value={set.reps || ''}
            onChange={(e) => onUpdate('reps', parseInt(e.target.value, 10) || 0)}
            placeholder="0"
            className="w-full h-10 pl-2 pr-8 text-left bg-bg-elevated border border-border rounded-[10px] text-sm font-mono font-medium text-text-primary focus:outline-none focus:border-border-accent focus:ring-[2px] focus:ring-accent/[0.08] transition-colors"
          />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted text-[10px] font-mono pointer-events-none">reps</span>
        </div>

        {/* Valider — icône seule, taille fixe */}
        <button
          onClick={onComplete}
          disabled={!set.weight || !set.reps}
          className={cn(
            'w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 transition-all active:scale-[0.97]',
            set.weight && set.reps
              ? 'bg-accent text-[#0c0c0f] hover:brightness-105'
              : 'bg-bg-elevated border border-border text-text-muted opacity-40'
          )}
          aria-label="Valider la série"
        >
          <Check size={16} strokeWidth={2.5} />
        </button>
      </motion.div>
    </div>
  );
}
