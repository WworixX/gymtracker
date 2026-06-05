'use client';

import { muscleHeatColor } from '@/lib/muscleHeat';

// Séries par muscle (semaine ISO) — barres HTML (police du site garantie,
// pas de fallback comme avec les <text> SVG de Recharts).
export function MuscleSetsBars({ setsByMuscle }: { setsByMuscle: Record<string, number> }) {
  const sorted = Object.entries(setsByMuscle)
    .filter(([, n]) => n > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  if (!sorted.length) return null;
  const max = Math.max(...sorted.map(([, n]) => n));

  return (
    <div className="flex flex-col gap-2">
      {sorted.map(([muscle, n]) => (
        <div key={muscle} className="flex items-center gap-2.5">
          <span className="w-24 shrink-0 text-xs font-sans text-text-secondary truncate">{muscle}</span>
          <div className="flex-1 h-2.5 rounded-full bg-bg-overlay overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(n / max) * 100}%`, background: muscleHeatColor(n) }} />
          </div>
          <span className="w-14 shrink-0 text-right font-mono text-xs text-text-primary">
            {n} <span className="text-text-muted">sér.</span>
          </span>
        </div>
      ))}
    </div>
  );
}
