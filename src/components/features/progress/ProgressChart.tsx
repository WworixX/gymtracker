'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatDateShort } from '@/lib/utils';

interface ProgressChartProps {
  data: Array<{ date: string; maxWeight: number }>;
  pr: { weight: number; date: string } | null;
}

export function ProgressChart({ data, pr }: ProgressChartProps) {
  const chartData = data.map((d) => ({ ...d, displayDate: formatDateShort(d.date) }));
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
          <XAxis dataKey="displayDate" tick={{ fill: '#555', fontSize: 10, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#555', fontSize: 10, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}kg`} width={48} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: '8px', fontSize: '12px', fontFamily: 'DM Mono', color: '#f0f0f0' }}
            formatter={(v: number) => [`${v} kg`, 'Max']}
          />
          {pr && <ReferenceLine y={pr.weight} stroke="#c8f542" strokeDasharray="4 4" strokeOpacity={0.5} />}
          <Line type="monotone" dataKey="maxWeight" stroke="#c8f542" strokeWidth={2} dot={{ fill: '#c8f542', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#c8f542' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
