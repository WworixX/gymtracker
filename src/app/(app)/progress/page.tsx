'use client';

import { useState } from 'react';
import { TrendingUp, Trophy, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProgressChart } from '@/components/features/progress/ProgressChart';
import { PageTransition } from '@/components/ui/PageTransition';
import { useProgress, useExerciseList } from '@/hooks/useProgress';
import { formatDate } from '@/lib/utils';
import type { Exercise } from '@/types';

type TimeRange = '1m' | '3m' | '6m' | 'all';
const RANGES: { label: string; value: TimeRange }[] = [
  { label: '1M', value: '1m' }, { label: '3M', value: '3m' }, { label: '6M', value: '6m' }, { label: 'Tout', value: 'all' },
];

export default function ProgressPage() {
  const { exercises, loading: exLoading } = useExerciseList();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [range, setRange] = useState<TimeRange>('3m');
  const [search, setSearch] = useState('');
  const { points, pr, loading: dataLoading } = useProgress(selectedExercise?.id ?? null, range);
  const filtered = exercises.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageTransition className="p-4 max-w-2xl mx-auto flex flex-col gap-4">
      <h1 className="text-[11px] font-sans font-medium uppercase tracking-[0.12em] text-text-muted">Progression</h1>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un exercice..." className="w-full h-10 pl-8 pr-3 bg-bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-active font-mono" />
      </div>
      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
        {exLoading
          ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
          : filtered.map((ex) => (
            <button key={ex.id} onClick={() => { setSelectedExercise(ex); setSearch(''); }} className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors border ${selectedExercise?.id === ex.id ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-bg-surface border-border text-text-primary hover:bg-bg-elevated'}`}>
              <span className="text-sm">{ex.name}</span>
              <Badge variant="muscle">{ex.muscle_group}</Badge>
            </button>
          ))}
      </div>
      {selectedExercise && (
        <>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>{selectedExercise.name}</CardTitle>
                {pr && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Trophy size={12} className="text-warning" />
                    <span className="font-mono text-accent font-bold">{pr.weight} kg</span>
                    <span className="text-text-muted text-xs font-mono">· {formatDate(pr.date)}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                {RANGES.map((r) => (
                  <button key={r.value} onClick={() => setRange(r.value)} className={`text-[10px] font-mono uppercase px-2 py-1 rounded border transition-colors ${range === r.value ? 'bg-accent/10 border-accent/30 text-accent' : 'border-border text-text-muted hover:border-border-active'}`}>{r.label}</button>
                ))}
              </div>
            </CardHeader>
            {dataLoading ? <Skeleton className="h-48 w-full" /> : points.length > 1 ? <ProgressChart data={points} pr={pr} /> : <EmptyState title="Pas assez de données" description="Effectue au moins 2 séances avec cet exercice." />}
          </Card>
          {points.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Historique</CardTitle></CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-text-muted border-b border-border">
                      <th className="text-left pb-2">Date</th>
                      <th className="text-right pb-2">Max</th>
                      <th className="text-right pb-2">Volume</th>
                      <th className="text-right pb-2">Séries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...points].reverse().map((p) => (
                      <tr key={p.date} className="border-b border-border/50">
                        <td className="py-1.5 text-text-secondary">{p.date}</td>
                        <td className="py-1.5 text-right text-accent">{p.maxWeight} kg</td>
                        <td className="py-1.5 text-right text-text-secondary">{p.totalVolume.toLocaleString()} kg</td>
                        <td className="py-1.5 text-right text-text-muted">{p.sets}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
      {!selectedExercise && !exLoading && <EmptyState icon={<TrendingUp size={40} />} title="Sélectionner un exercice" description="Choisis un exercice pour voir ta progression." />}
    </PageTransition>
  );
}
