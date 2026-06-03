'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useWeightLogs } from '@/hooks/useBodyLogs';
import { formatDateShort } from '@/lib/utils';

const schema = z.object({
  weight: z.number().positive(),
  date: z.string().min(1),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function WeightLog() {
  const { logs, loading, upsert, remove } = useWeightLogs(30);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = async (data: FormData) => {
    await upsert(data.weight, data.date, data.notes);
    reset({ date: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  };

  const chartData = [...logs].reverse().map((l) => ({ date: formatDateShort(l.logged_at), weight: l.weight }));
  const latest = logs[0];
  const week = logs.slice(0, 7);
  const avg = week.length ? week.reduce((a, l) => a + l.weight, 0) / week.length : 0;
  const min = week.length ? Math.min(...week.map((l) => l.weight)) : 0;
  const max = week.length ? Math.max(...week.map((l) => l.weight)) : 0;

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-4">
      {latest && (
        <div className="flex gap-2">
          {[
            { label: 'Actuel', value: `${latest.weight}kg` },
            { label: 'Moy. 7j', value: avg ? `${avg.toFixed(1)}kg` : '—' },
            { label: 'Min', value: min ? `${min}kg` : '—' },
            { label: 'Max', value: max ? `${max}kg` : '—' },
          ].map(({ label, value }) => (
            <Card key={label} className="flex-1 p-3">
              <p className="text-[10px] font-mono uppercase text-text-muted mb-1">{label}</p>
              <p className="font-mono text-base font-bold text-accent">{value}</p>
            </Card>
          ))}
        </div>
      )}
      {chartData.length > 1 && (
        <Card>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555', fontSize: 10, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} width={36} />
                <Tooltip contentStyle={{ backgroundColor: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: '8px', fontSize: '12px', fontFamily: 'DM Mono', color: '#f0f0f0' }} formatter={(v: number) => [`${v} kg`, '']} />
                <Line type="monotone" dataKey="weight" stroke="#c8f542" strokeWidth={2} dot={{ fill: '#c8f542', r: 2, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      {showForm ? (
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <Input label="Poids" type="number" step="0.1" suffix="kg" {...register('weight', { valueAsNumber: true })} error={errors.weight?.message} />
            <Input label="Date" type="date" {...register('date')} />
            <Input label="Notes" {...register('notes')} placeholder="Optionnel" />
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} fullWidth>Annuler</Button>
              <Button type="submit" loading={isSubmitting} fullWidth>Enregistrer</Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button variant="secondary" onClick={() => setShowForm(true)} className="w-full"><Plus size={14} /> Ajouter un poids</Button>
      )}
      <div className="flex flex-col gap-2">
        {logs.map((l) => (
          <div key={l.id} className="flex items-center justify-between px-3 py-2 bg-bg-surface border border-border rounded-lg">
            <span className="text-xs font-mono text-text-secondary">{formatDateShort(l.logged_at)}</span>
            <span className="font-mono text-sm text-text-primary">{l.weight} kg</span>
            <button onClick={() => remove(l.id)} className="text-text-muted hover:text-danger transition-colors"><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
