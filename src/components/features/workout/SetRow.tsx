'use client';

import { Check, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ActiveSet, SetTrend } from '@/types';

interface SetRowProps {
  set: ActiveSet;
  isPR?: boolean;
  trend?: SetTrend | null;
  onUpdate: (field: 'weight' | 'reps', value: number) => void;
  onComplete: () => void;
  onDelete: () => void;
}

const TREND_META: Record<SetTrend, { Icon: typeof TrendingUp; color: string; label: string }> = {
  up: { Icon: TrendingUp, color: '#22c55e', label: 'Mieux que la dernière fois' },
  equal: { Icon: Minus, color: '#6f6f80', label: 'Égal à la dernière fois' },
  down: { Icon: TrendingDown, color: '#f59e0b', label: 'En dessous de la dernière fois' },
};

export function SetRow({ set, isPR, trend, onUpdate, onComplete, onDelete }: SetRowProps) {
  const reduceMotion = useReducedMotion();

  if (set.completed) {
    // Flash de fond : PR (lime fort) > progression (vert doux) > neutre
    const flash = reduceMotion
      ? { opacity: 1, scale: 1 }
      : isPR
        ? { opacity: 1, scale: 1, backgroundColor: ['rgba(200,245,66,0.055)', 'rgba(200,245,66,0.2)', 'rgba(200,245,66,0.055)'] }
        : trend === 'up'
          ? { opacity: 1, scale: 1, backgroundColor: ['rgba(34,197,94,0.06)', 'rgba(34,197,94,0.18)', 'rgba(34,197,94,0.06)'] }
          : { opacity: 1, scale: 1 };
    const t = trend ? TREND_META[trend] : null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={flash}
        transition={{ duration: isPR || trend === 'up' ? 0.6 : 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3 px-3.5 h-11 rounded-[10px] border"
        style={{ background: 'rgba(200,245,66,0.055)', borderColor: 'rgba(200,245,66,0.12)' }}
      >
        <span className="w-4 text-center text-xs font-mono text-text-muted shrink-0">{set.set_number}</span>
        <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.25, times: [0, 0.6, 1] }} className="shrink-0">
          <Check size={13} className="text-accent" strokeWidth={3} style={{ filter: 'drop-shadow(0 0 8px rgba(200,245,66,0.4))' }} />
        </motion.span>
        <span className="font-mono text-sm text-accent truncate">{set.weight} kg × {set.reps} reps</span>

        {/* Tendance surcharge progressive vs dernière séance */}
        {t && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.25, 1], opacity: 1 }}
            transition={{ duration: 0.35, ease: 'backOut' }}
            className="shrink-0 inline-flex items-center"
            style={{ color: t.color }}
            title={t.label}
            aria-label={t.label}
          >
            <t.Icon size={15} strokeWidth={2.5} style={trend === 'up' ? { filter: 'drop-shadow(0 0 6px rgba(34,197,94,0.5))' } : undefined} />
          </motion.span>
        )}

        {isPR && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.1, 1] }}
            transition={{ duration: 0.4, ease: 'backOut' }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold text-[#0c0c0f] shadow-pr-glow shrink-0"
            style={{ background: 'linear-gradient(135deg, #c8f542, #9bbf2e)' }}
          >
            🏆 PR
          </motion.span>
        )}
        <button
          onClick={onDelete}
          className="ml-auto w-9 h-9 shrink-0 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
          aria-label="Supprimer la série"
        >
          <Trash2 size={14} />
        </button>
      </motion.div>
    );
  }

  const hasValues = !!set.weight && !!set.reps;

  return (
    <div
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

      {/* Supprimer */}
      <button
        onClick={onDelete}
        className="w-9 h-10 shrink-0 flex items-center justify-center rounded-[10px] text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
        aria-label="Supprimer la série"
      >
        <Trash2 size={15} />
      </button>

      {/* Valider */}
      <button
        onClick={onComplete}
        disabled={!hasValues}
        className={cn(
          'w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 transition-all active:scale-[0.97]',
          hasValues
            ? 'bg-accent text-[#0c0c0f] hover:brightness-105'
            : 'bg-bg-elevated border border-border text-text-muted opacity-40'
        )}
        aria-label="Valider la série"
      >
        <Check size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
}
