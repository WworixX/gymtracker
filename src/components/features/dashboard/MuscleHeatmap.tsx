'use client';

import type { MuscleGroup } from '@/types';
import { muscleHeatColor, HEAT_SCALE } from '@/lib/muscleHeat';
import { FRONT, BACK, type BodyPart } from '@/lib/muscleBodyData';

// Body map : silhouette anatomique face + dos (polygones par muscle, source
// react-body-highlighter MIT), chaque groupe teinté selon le nb de séries de
// la semaine ISO. Échelle de couleurs partagée (lib/muscleHeat).

const STROKE = 'rgba(255,255,255,0.16)';
const NEUTRAL = 'rgba(255,255,255,0.045)';

export function MuscleHeatmap({ setsByMuscle }: { setsByMuscle: Record<string, number> }) {
  const get = (mg: MuscleGroup) => setsByMuscle[mg] ?? 0;

  const Body = ({ data, label }: { data: BodyPart[]; label: string }) => (
    <div className="flex flex-col items-center gap-1.5">
      <svg viewBox="-2 -2 104 224" className="h-56 w-auto" role="img" aria-label={label}>
        {data.map((part, i) => {
          const n = part.mg ? get(part.mg) : 0;
          const fill = part.mg ? muscleHeatColor(n) : NEUTRAL;
          return (
            <g key={i} fill={fill} stroke={STROKE} strokeWidth={0.5} strokeLinejoin="round">
              {part.mg && (
                <title>{part.mg} — {n} série{n > 1 ? 's' : ''}</title>
              )}
              {part.polys.map((p, j) => (
                <polygon key={j} points={p} />
              ))}
            </g>
          );
        })}
      </svg>
      <span className="text-[9px] font-mono uppercase tracking-wider text-text-muted">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-center gap-5">
        <Body data={FRONT} label="Face" />
        <Body data={BACK} label="Dos" />
      </div>

      {/* Légende — séries / semaine */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {HEAT_SCALE.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ background: color, border: '0.5px solid rgba(255,255,255,0.08)' }} />
            <span className="text-[9px] font-mono text-text-muted">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
