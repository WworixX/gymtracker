'use client';

import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import type { WeightLog } from '@/types';

export function WeightSparkline({ logs }: { logs: WeightLog[] }) {
  const data = [...logs].reverse().map((l) => ({ date: l.logged_at, weight: l.weight }));
  if (!data.length) return <div className="h-12 flex items-center justify-center text-text-muted text-xs font-mono">—</div>;
  return (
    <div className="h-12">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="weight" stroke="#c8f542" strokeWidth={1.5} dot={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: '6px', fontSize: '11px', fontFamily: 'DM Mono, monospace', color: '#f0f0f0' }}
            formatter={(v: number) => [`${v} kg`, '']}
            labelFormatter={() => ''}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
