'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

export function VolumeChart({ data }: { data: Record<string, number> }) {
  const sorted = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([muscle, volume]) => ({ muscle, volume }));

  if (!sorted.length) return <div className="h-32 flex items-center justify-center text-text-muted text-xs font-mono">Aucune donnée</div>;

  const height = Math.max(120, sorted.length * 30);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ left: 0, right: 44, top: 0, bottom: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="muscle"
            width={92}
            tick={{ fill: '#9a9aa8', fontSize: 11, fontFamily: 'DM Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            contentStyle={{ backgroundColor: '#18181f', border: '1px solid rgba(200,245,66,0.2)', borderRadius: '10px', fontSize: '11px', fontFamily: 'DM Mono, monospace', color: '#f2f2f4' }}
            formatter={(v: number) => [`${v.toLocaleString()} kg`, 'Volume']}
          />
          <Bar dataKey="volume" radius={[0, 6, 6, 0]} barSize={16}>
            {sorted.map((_, i) => (
              <Cell key={i} fill={i === 0 ? '#c8f542' : `rgba(200,245,66,${Math.max(0.18, 0.5 - i * 0.045)})`} />
            ))}
            <LabelList
              dataKey="volume"
              position="right"
              formatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`)}
              style={{ fill: '#6f6f80', fontSize: 10, fontFamily: 'DM Mono' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
