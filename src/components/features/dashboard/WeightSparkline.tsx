'use client';

import { ResponsiveContainer, AreaChart, Area, Tooltip, YAxis } from 'recharts';
import type { WeightLog } from '@/types';

export function WeightSparkline({ logs }: { logs: WeightLog[] }) {
  // Garde les 14 dernières entrées pour une lecture lisible
  const recent = logs.slice(0, 14);
  const data = [...recent].reverse().map((l) => ({ date: l.logged_at, weight: l.weight }));
  if (!data.length) return <div className="h-12 flex items-center justify-center text-text-muted text-xs font-mono">—</div>;

  // Domaine zoomé sur la plage réelle (sinon Recharts part de Y=0 -> courbe plate)
  const ys = data.map((d) => d.weight);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const span = hi - lo;
  const pad = Math.max(span * 0.25, 0.2); // marge mini 0.2 kg pour éviter chart plat sur 1 seul point

  return (
    <div className="h-14">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c8f542" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#c8f542" stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[lo - pad, hi + pad]} />
          <Area
            type="monotone"
            dataKey="weight"
            stroke="#c8f542"
            strokeWidth={2}
            fill="url(#sparkFill)"
            dot={data.length <= 14 ? { fill: '#c8f542', r: 2, strokeWidth: 0 } : false}
            activeDot={{ r: 4, fill: '#c8f542', stroke: 'rgba(200,245,66,0.3)', strokeWidth: 4 }}
            isAnimationActive={false}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#18181f', border: '1px solid rgba(200,245,66,0.2)', borderRadius: '10px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#f2f2f4' }}
            formatter={(v: number) => [`${v} kg`, '']}
            labelFormatter={() => ''}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
