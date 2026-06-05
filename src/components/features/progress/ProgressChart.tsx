'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatDateShort } from '@/lib/utils';

interface ProgressChartProps {
  data: Array<{ date: string; weight: number; reps: number; score: number }>;
  pr: { score: number } | null;
}

export function ProgressChart({ data, pr }: ProgressChartProps) {
  const chartData = data.map((d) => ({ ...d, displayDate: formatDateShort(d.date) }));
  return (
    <div className="h-52 font-mono">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c8f542" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#c8f542" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="displayDate" tick={{ fill: '#4a4a5a', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#4a4a5a', fontSize: 11 }} axisLine={false} tickLine={false} width={36} domain={['auto', 'auto']} />
          <Tooltip
            cursor={{ stroke: 'rgba(200,245,66,0.2)', strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as { weight: number; reps: number; displayDate: string };
              return (
                <div style={{ background: '#18181f', border: '0.5px solid rgba(200,245,66,0.2)', borderRadius: 10, padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>
                  <p style={{ color: '#c8f542', fontSize: 14, margin: 0, fontWeight: 500 }}>{p.weight} kg × {p.reps}</p>
                  <p style={{ color: '#6f6f80', fontSize: 11, margin: '2px 0 0' }}>{p.displayDate}</p>
                </div>
              );
            }}
          />
          {pr && <ReferenceLine y={pr.score} stroke="#c8f542" strokeDasharray="4 4" strokeOpacity={0.4} />}
          <Area
            type="monotone"
            dataKey="score"
            stroke="#c8f542"
            strokeWidth={2}
            fill="url(#progressFill)"
            dot={{ fill: '#c8f542', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#c8f542', stroke: 'rgba(200,245,66,0.3)', strokeWidth: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
