'use client';

import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import type { WeightLog } from '@/types';

export function WeightSparkline({ logs }: { logs: WeightLog[] }) {
  const data = [...logs].reverse().map((l) => ({ date: l.logged_at, weight: l.weight }));
  if (!data.length) return <div className="h-12 flex items-center justify-center text-text-muted text-xs font-mono">—</div>;
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
          <Area
            type="monotone"
            dataKey="weight"
            stroke="#c8f542"
            strokeWidth={2}
            fill="url(#sparkFill)"
            dot={false}
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
