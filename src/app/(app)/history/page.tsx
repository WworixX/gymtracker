'use client';

import { useState } from 'react';
import { Calendar, ChevronDown, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { PageTransition } from '@/components/ui/PageTransition';
import { useHistory } from '@/hooks/useHistory';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';
import { formatDate, formatDuration, getWorkoutDuration, downloadCSV } from '@/lib/utils';

export default function HistoryPage() {
  const { items, loading, hasMore, loadMore } = useHistory();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('workouts')
        .select(`name, started_at, workout_exercises ( exercise:exercises (name, muscle_group), sets (set_number, weight, reps) )`)
        .eq('user_id', user.id)
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false });

      const rows: Array<Array<string | number>> = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const w of (data ?? []) as any[]) {
        const date = (w.started_at as string).split('T')[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const we of (w.workout_exercises ?? []) as any[]) {
          const ex = Array.isArray(we.exercise) ? we.exercise[0] : we.exercise;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const s of (we.sets ?? []) as any[]) {
            rows.push([date, w.name ?? '', ex?.name ?? '', ex?.muscle_group ?? '', s.set_number, s.weight, s.reps, s.weight * s.reps]);
          }
        }
      }
      downloadCSV(
        `peaklog-export-${new Date().toISOString().split('T')[0]}.csv`,
        ['Date', 'Séance', 'Exercice', 'Groupe', 'Série', 'Poids (kg)', 'Reps', 'Volume (kg)'],
        rows
      );
      toast(`Export réussi (${rows.length} lignes)`, 'success');
    } catch {
      toast('Échec de l\'export', 'error');
    }
    finally { setExporting(false); }
  };

  return (
    <PageTransition className="p-4 max-w-2xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-[11px] font-sans font-medium uppercase tracking-[0.12em] text-text-muted mb-0.5">Historique</h1>
          <p className="text-text-muted text-xs font-mono">{items.length} séance{items.length > 1 ? 's' : ''}</p>
        </div>
        {items.length > 0 && (
          <Button variant="secondary" size="sm" loading={exporting} onClick={handleExport}>
            <Download size={14} /> Export CSV
          </Button>
        )}
      </div>
      {loading && !items.length && <div className="flex justify-center py-8"><Spinner /></div>}
      {!loading && !items.length && <EmptyState icon={<Calendar size={40} />} title="Aucune séance" description="Tes séances terminées apparaîtront ici." />}
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const isOpen = expanded === item.id;
          const duration = item.ended_at ? getWorkoutDuration(item.started_at, item.ended_at) : null;
          return (
            <Card key={item.id} className="overflow-hidden p-0">
              <button className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-elevated transition-colors" onClick={() => setExpanded(isOpen ? null : item.id)}>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-text-primary truncate block">{item.name ?? 'Séance'}</span>
                  <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
                    <span>{formatDate(item.started_at)}</span>
                    {duration && <span>{formatDuration(duration)}</span>}
                    <span>{item.totalSets} séries · {item.totalVolume.toLocaleString()} kg</span>
                  </div>
                </div>
                <ChevronDown size={16} className={`text-text-muted transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden border-t border-border">
                    <div className="px-4 py-3 flex flex-col gap-3">
                      {item.exercises.map(({ exercise, sets }) => (
                        <div key={exercise.id}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm text-text-primary">{exercise.name}</span>
                            <Badge variant="muscle">{exercise.muscle_group}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {sets.map((s) => (
                              <span key={s.id} className="text-[10px] font-mono bg-bg-overlay border border-border px-2 py-0.5 rounded text-text-secondary">{s.weight}kg×{s.reps}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
      {hasMore && <Button variant="secondary" onClick={loadMore} loading={loading} fullWidth>Charger plus</Button>}
    </PageTransition>
  );
}
