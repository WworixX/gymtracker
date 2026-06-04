'use client';

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function VolumeChart({ data }: { data: Record<string, number> }) {
  const sorted = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([muscle, volume]) => ({ muscle: muscle.slice(0, 6).toUpperCase(), volume }));

  if (!sorted.length) return <div className="h-32 flex items-center justify-center text-text-muted text-xs font-mono">Aucune donnée</div>;

  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            contentStyle={{ backgroundColor: '#18181f', border: '1px solid rgba(200,245,66,0.2)', borderRadius: '10px', fontSize: '11px', fontFamily: 'DM Mono, monospace', color: '#f2f2f4' }}
            formatter={(v: number) => [`${v.toLocaleString()} kg`, '']}
          />
          <Bar dataKey="volume" radius={[0, 6, 6, 0]}>
            {sorted.map((_, i) => (
              <Cell key={i} fill={i === 0 ? '#c8f542' : `rgba(200,245,66,${Math.max(0.12, 0.4 - i * 0.04)})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
