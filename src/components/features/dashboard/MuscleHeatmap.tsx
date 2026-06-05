'use client';

import type { MuscleGroup } from '@/types';

// Body map : silhouette face + dos, chaque muscle teinté selon le nb de séries
// effectuées dans la semaine ISO en cours. Échelle gris → lime → ambre (volume élevé).

function fillFor(n: number): string {
  if (n <= 0) return 'rgba(255,255,255,0.05)';
  if (n < 5) return 'rgba(200,245,66,0.28)';
  if (n < 10) return 'rgba(200,245,66,0.5)';
  if (n < 15) return 'rgba(200,245,66,0.72)';
  if (n < 20) return 'rgba(200,245,66,0.95)';
  return '#f59e0b';
}

const STROKE = 'rgba(255,255,255,0.1)';

export function MuscleHeatmap({ setsByMuscle }: { setsByMuscle: Record<string, number> }) {
  const get = (mg: MuscleGroup) => setsByMuscle[mg] ?? 0;

  // groupe coloré + tooltip
  const G = ({ mg, children }: { mg: MuscleGroup; children: React.ReactNode }) => (
    <g fill={fillFor(get(mg))} stroke={STROKE} strokeWidth={0.5}>
      <title>{mg} — {get(mg)} série{get(mg) > 1 ? 's' : ''}</title>
      {children}
    </g>
  );

  const neutral = { fill: 'rgba(255,255,255,0.05)', stroke: STROKE, strokeWidth: 0.5 };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-center gap-4">
        {/* FACE */}
        <svg viewBox="0 0 100 215" className="h-52 w-auto" role="img" aria-label="Vue de face">
          <circle cx={50} cy={14} r={9} {...neutral} />
          <rect x={46} y={22} width={8} height={5} {...neutral} />
          <G mg="Épaules"><ellipse cx={33} cy={34} rx={9} ry={6.5} /><ellipse cx={67} cy={34} rx={9} ry={6.5} /></G>
          <G mg="Pecs"><rect x={37} y={31} width={12} height={13} rx={3} /><rect x={51} y={31} width={12} height={13} rx={3} /></G>
          <G mg="Biceps"><rect x={26} y={36} width={8} height={19} rx={4} /><rect x={66} y={36} width={8} height={19} rx={4} /></G>
          <G mg="Abdos"><rect x={43} y={45} width={14} height={22} rx={3} /></G>
          <G mg="Avant-bras"><rect x={24} y={55} width={7} height={20} rx={3.5} /><rect x={69} y={55} width={7} height={20} rx={3.5} /></G>
          <rect x={41} y={67} width={18} height={8} rx={2} {...neutral} />
          <G mg="Quadriceps"><rect x={40} y={76} width={9} height={32} rx={4} /><rect x={51} y={76} width={9} height={32} rx={4} /></G>
          <G mg="Mollets"><rect x={41} y={110} width={8} height={28} rx={4} /><rect x={51} y={110} width={8} height={28} rx={4} /></G>
        </svg>

        {/* DOS */}
        <svg viewBox="0 0 100 215" className="h-52 w-auto" role="img" aria-label="Vue de dos">
          <circle cx={50} cy={14} r={9} {...neutral} />
          <rect x={46} y={22} width={8} height={5} {...neutral} />
          <G mg="Épaules"><ellipse cx={33} cy={34} rx={9} ry={6.5} /><ellipse cx={67} cy={34} rx={9} ry={6.5} /></G>
          <G mg="Dos"><rect x={37} y={30} width={26} height={36} rx={4} /></G>
          <G mg="Triceps"><rect x={26} y={36} width={8} height={19} rx={4} /><rect x={66} y={36} width={8} height={19} rx={4} /></G>
          <G mg="Avant-bras"><rect x={24} y={55} width={7} height={20} rx={3.5} /><rect x={69} y={55} width={7} height={20} rx={3.5} /></G>
          <G mg="Fessiers"><rect x={40} y={67} width={9} height={13} rx={3} /><rect x={51} y={67} width={9} height={13} rx={3} /></G>
          <G mg="Ischio-jambiers"><rect x={40} y={82} width={9} height={26} rx={4} /><rect x={51} y={82} width={9} height={26} rx={4} /></G>
          <G mg="Mollets"><rect x={41} y={110} width={8} height={28} rx={4} /><rect x={51} y={110} width={8} height={28} rx={4} /></G>
        </svg>
      </div>

      {/* Légende */}
      <div className="flex items-center justify-center gap-2 text-[9px] font-mono text-text-muted">
        <span>Moins</span>
        {['rgba(255,255,255,0.05)', 'rgba(200,245,66,0.28)', 'rgba(200,245,66,0.5)', 'rgba(200,245,66,0.72)', 'rgba(200,245,66,0.95)', '#f59e0b'].map((c) => (
          <span key={c} className="w-4 h-2.5 rounded-sm" style={{ background: c, border: '0.5px solid rgba(255,255,255,0.08)' }} />
        ))}
        <span>Plus</span>
      </div>
    </div>
  );
}
