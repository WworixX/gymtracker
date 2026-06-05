'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { ChartTooltip } from '@/components/ui/ChartTooltip';
import { useWeightLogs, useProfile } from '@/hooks/useBodyLogs';
import { formatDateShort, linregSlopePerWeek, cn } from '@/lib/utils';

const schema = z.object({
  weight: z.number().positive(),
  date: z.string().min(1),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function signed(n: number): string {
  return `${n > 0 ? '+' : ''}${n.toFixed(2)}`;
}

export function WeightLog() {
  const { logs, loading, upsert, remove } = useWeightLogs(30);
  const { profile } = useProfile();
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

  // --- Trajectoire vers l'objectif ---
  const current = latest?.weight ?? profile?.current_weight ?? null;
  const goal = profile?.goal_weight ?? null;
  const goalDate = profile?.goal_date ?? null;

  const regPoints = logs.map((l) => ({ t: new Date(l.logged_at).getTime(), y: l.weight }));
  const currentRate = linregSlopePerWeek(regPoints); // kg/semaine (signé)

  let traj: null | {
    remaining: number;
    requiredRate: number | null;
    weeksLeft: number | null;
    projection: number | null;
    status: { label: string; tone: 'good' | 'warn' | 'neutral' } | null;
    etaWeeks: number | null;
  } = null;

  if (current != null && goal != null) {
    const remaining = goal - current; // signé : négatif = perte à faire
    let weeksLeft: number | null = null;
    let requiredRate: number | null = null;
    let projection: number | null = null;
    let status: { label: string; tone: 'good' | 'warn' | 'neutral' } | null = null;

    if (goalDate) {
      const days = (new Date(goalDate).getTime() - Date.now()) / 86400000;
      weeksLeft = days / 7;
      if (weeksLeft > 0.1) {
        requiredRate = remaining / weeksLeft;
        if (logs.length >= 2) {
          projection = current + currentRate * weeksLeft;
          const tol = 0.5;
          const projDiff = projection - goal;
          const needLose = remaining < 0;
          if (needLose) {
            status = projDiff <= -tol ? { label: 'En avance', tone: 'good' }
              : projDiff <= tol ? { label: 'Sur la bonne voie', tone: 'good' }
              : { label: 'En retard', tone: 'warn' };
          } else {
            status = projDiff >= tol ? { label: 'En avance', tone: 'good' }
              : projDiff >= -tol ? { label: 'Sur la bonne voie', tone: 'good' }
              : { label: 'En retard', tone: 'warn' };
          }
        }
      } else {
        status = { label: 'Échéance dépassée', tone: 'neutral' };
      }
    }

    // ETA si pas de date mais progression dans le bon sens
    let etaWeeks: number | null = null;
    if (!goalDate && logs.length >= 2 && Math.abs(remaining) > 0.1 && Math.sign(currentRate) === Math.sign(remaining) && currentRate !== 0) {
      etaWeeks = remaining / currentRate;
    }

    traj = { remaining, requiredRate, weeksLeft, projection, status, etaWeeks };
  }

  const hasGoalLine = goal != null && chartData.length > 1;
  const yDomain: [number | string, number | string] = hasGoalLine
    ? [
        Math.floor(Math.min(...chartData.map((d) => d.weight), goal as number) - 1),
        Math.ceil(Math.max(...chartData.map((d) => d.weight), goal as number) + 1),
      ]
    : ['auto', 'auto'];

  if (loading) return <Skeleton className="h-64 w-full" />;

  const toneClass = (tone: 'good' | 'warn' | 'neutral') =>
    tone === 'good' ? 'text-success border-success/30 bg-success/10'
      : tone === 'warn' ? 'text-warning border-warning/30 bg-warning/10'
      : 'text-text-muted border-border bg-bg-overlay';

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

      {/* Trajectoire objectif */}
      {traj && (
        <Card>
          <CardHeader>
            <CardTitle>Objectif</CardTitle>
            <div className="flex items-center gap-1.5">
              <Target size={13} className="text-accent" />
              <span className="font-mono text-accent text-sm font-medium">{goal} kg</span>
              {goalDate && <span className="text-[10px] font-mono text-text-muted">· {formatDateShort(goalDate)}</span>}
            </div>
          </CardHeader>
          <div className="flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-bg-overlay rounded-lg p-2.5">
                <p className="text-[10px] font-mono uppercase text-text-muted mb-0.5">Restant</p>
                <p className="font-mono text-sm text-text-primary">
                  {Math.abs(traj.remaining).toFixed(1)} kg <span className="text-text-muted">à {traj.remaining < 0 ? 'perdre' : 'prendre'}</span>
                </p>
              </div>
              <div className="bg-bg-overlay rounded-lg p-2.5">
                <p className="text-[10px] font-mono uppercase text-text-muted mb-0.5">Rythme actuel</p>
                <p className="font-mono text-sm text-text-primary">{logs.length >= 2 ? `${signed(currentRate)} kg/sem` : '—'}</p>
              </div>
              {traj.requiredRate != null && (
                <div className="bg-bg-overlay rounded-lg p-2.5">
                  <p className="text-[10px] font-mono uppercase text-text-muted mb-0.5">Rythme requis</p>
                  <p className="font-mono text-sm text-text-primary">{signed(traj.requiredRate)} kg/sem</p>
                </div>
              )}
              {traj.projection != null && (
                <div className="bg-bg-overlay rounded-lg p-2.5">
                  <p className="text-[10px] font-mono uppercase text-text-muted mb-0.5">Projection</p>
                  <p className="font-mono text-sm text-text-primary">{traj.projection.toFixed(1)} kg</p>
                </div>
              )}
            </div>
            {traj.status && (
              <div className={cn('flex items-center justify-center py-1.5 rounded-lg border text-xs font-sans font-medium', toneClass(traj.status.tone))}>
                {traj.status.label}
                {traj.projection != null && traj.status.tone !== 'neutral' && (
                  <span className="ml-1.5 font-mono text-[11px] opacity-80">→ {traj.projection.toFixed(1)}kg à l&apos;échéance</span>
                )}
              </div>
            )}
            {traj.etaWeeks != null && (
              <p className="text-[11px] font-mono text-text-muted text-center">
                À ce rythme : objectif atteint dans ~{Math.round(traj.etaWeeks)} sem
              </p>
            )}
          </div>
        </Card>
      )}

      {chartData.length > 1 && (
        <Card>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c8f542" stopOpacity={0.18} />
                    <stop offset="60%" stopColor="#c8f542" stopOpacity={0.04} />
                    <stop offset="100%" stopColor="#c8f542" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#4a4a5a', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4a4a5a', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} domain={yDomain} width={35} />
                <Tooltip content={<ChartTooltip unit=" kg" labelKey="date" />} />
                {hasGoalLine && (
                  <ReferenceLine
                    y={goal as number}
                    stroke="#f59e0b"
                    strokeDasharray="5 4"
                    strokeWidth={1.5}
                    label={{ value: `Objectif ${goal}kg`, position: 'insideTopRight', fill: '#f59e0b', fontSize: 10, fontFamily: 'DM Mono' }}
                  />
                )}
                <Area type="monotone" dataKey="weight" stroke="#c8f542" strokeWidth={2} fill="url(#weightFill)" dot={false} activeDot={{ r: 5, fill: '#c8f542', stroke: 'rgba(200,245,66,0.3)', strokeWidth: 6 }} />
              </AreaChart>
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
