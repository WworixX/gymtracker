'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatDateShort } from '@/lib/utils';

interface ProgressChartProps {
  data: Array<{ date: string; maxWeight: number }>;
  pr: { weight: number; date: string } | null;
}

export function ProgressChart({ data, pr }: ProgressChartProps) {
  const chartData = data.map((d) => ({ ...d, displayDate: formatDateShort(d.date) }));
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c8f542" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#c8f542" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="displayDate" tick={{ fill: '#4a4a5a', fontSize: 10, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#4a4a5a', fontSize: 10, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}kg`} width={48} />
          <Tooltip
            cursor={{ stroke: 'rgba(200,245,66,0.2)', strokeWidth: 1 }}
            contentStyle={{ backgroundColor: '#18181f', border: '1px solid rgba(200,245,66,0.2)', borderRadius: '10px', fontSize: '12px', fontFamily: 'DM Mono', color: '#f2f2f4' }}
            formatter={(v: number) => [`${v} kg`, 'Max']}
          />
          {pr && <ReferenceLine y={pr.weight} stroke="#c8f542" strokeDasharray="4 4" strokeOpacity={0.4} />}
          <Area
            type="monotone"
            dataKey="maxWeight"
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
