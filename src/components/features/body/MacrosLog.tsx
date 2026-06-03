'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useMacroLogs } from '@/hooks/useBodyLogs';
import { formatDateShort } from '@/lib/utils';

const schema = z.object({
  date: z.string().min(1),
  calories: z.number().int().positive(),
  protein_g: z.number().positive(),
  carbs_g: z.number().positive(),
  fat_g: z.number().positive(),
});
type FormData = z.infer<typeof schema>;

export function MacrosLog() {
  const { logs, upsert } = useMacroLogs(7);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = async (data: FormData) => {
    await upsert(data.date, data.calories, data.protein_g, data.carbs_g, data.fat_g);
    reset({ date: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  };

  const chartData = [...logs].reverse().map((l) => ({
    date: formatDateShort(l.logged_at),
    Protéines: l.protein_g ?? 0,
    Glucides: l.carbs_g ?? 0,
    Lipides: l.fat_g ?? 0,
  }));

  const today = logs[0];

  return (
    <div className="flex flex-col gap-4">
      {today && (
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Calories', value: `${today.calories ?? '—'} kcal`, color: '#c8f542' },
            { label: 'Protéines', value: `${today.protein_g ?? '—'} g`, color: '#22c55e' },
            { label: 'Glucides', value: `${today.carbs_g ?? '—'} g`, color: '#f59e0b' },
            { label: 'Lipides', value: `${today.fat_g ?? '—'} g`, color: '#ff4545' },
          ].map(({ label, value, color }) => (
            <Card key={label} className="p-3">
              <p className="text-[10px] font-mono uppercase text-text-muted mb-1">{label}</p>
              <p className="font-mono text-base font-bold" style={{ color }}>{value}</p>
            </Card>
          ))}
        </div>
      )}
      {chartData.length > 0 && (
        <Card>
          <p className="text-[10px] font-mono uppercase text-text-muted mb-3">7 derniers jours</p>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={8}>
                <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: '8px', fontSize: '11px', fontFamily: 'DM Mono', color: '#f0f0f0' }} formatter={(v: number, name: string) => [`${v}g`, name]} />
                <Bar dataKey="Protéines" fill="#22c55e" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Glucides" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Lipides" fill="#ff4545" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      {showForm ? (
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <Input label="Date" type="date" {...register('date')} />
            <Input label="Calories" type="number" suffix="kcal" {...register('calories', { valueAsNumber: true })} />
            <div className="grid grid-cols-3 gap-2">
              <Input label="Protéines" type="number" suffix="g" {...register('protein_g', { valueAsNumber: true })} />
              <Input label="Glucides" type="number" suffix="g" {...register('carbs_g', { valueAsNumber: true })} />
              <Input label="Lipides" type="number" suffix="g" {...register('fat_g', { valueAsNumber: true })} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} fullWidth>Annuler</Button>
              <Button type="submit" loading={isSubmitting} fullWidth>Enregistrer</Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button variant="secondary" onClick={() => setShowForm(true)} fullWidth>+ Macros du jour</Button>
      )}
    </div>
  );
}
