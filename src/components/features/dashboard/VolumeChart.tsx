'use client';

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function VolumeChart({ data }: { data: Record<string, number> }) {
  const sorted = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([muscle, volume]) => ({ muscle: muscle.slice(0, 6).toUpperCase(), volume }));

  if (!sorted.length) return <div className="h-32 flex items-center justify-center text-text-muted text-xs font-mono">Aucune donnée</div>;

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <Tooltip
            contentStyle={{ backgroundColor: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: '6px', fontSize: '11px', fontFamily: 'DM Mono, monospace', color: '#f0f0f0' }}
            formatter={(v: number) => [`${v.toLocaleString()} kg`, '']}
          />
          <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
            {sorted.map((_, i) => (
              <Cell key={i} fill={i === 0 ? '#c8f542' : `rgba(200,245,66,${Math.max(0.1, 0.3 - i * 0.03)})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
