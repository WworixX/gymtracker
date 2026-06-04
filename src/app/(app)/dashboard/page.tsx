'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Dumbbell, Trophy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { WeightSparkline } from '@/components/features/dashboard/WeightSparkline';
import { VolumeChart } from '@/components/features/dashboard/VolumeChart';
import { RecentPRs } from '@/components/features/dashboard/RecentPRs';
import { useDashboard } from '@/hooks/useDashboard';
import { useWorkoutStore } from '@/stores/workout-store';
import { useWorkoutActions } from '@/hooks/useWorkout';
import { useWeightLogs } from '@/hooks/useBodyLogs';
import { formatDate } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06 } }),
};

export default function DashboardPage() {
  const { totalWorkouts, lastWorkout, recentPRs, weightLogs, volumeByMuscle, loading } = useDashboard();
  const { startWorkout, activeWorkout } = useWorkoutStore();
  const { createWorkout } = useWorkoutActions();
  const { upsert: upsertWeight } = useWeightLogs(7);

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [weightSaved, setWeightSaved] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);
  const router = useRouter();

  const handleStart = async () => {
    setStartError('');
    if (activeWorkout) {
      router.push(`/workout/${activeWorkout.id}`);
      return;
    }
    setStarting(true);
    try {
      const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      const name = `Séance du ${today}`;
      const workout = await createWorkout(name);
      startWorkout(workout.id, name);
      router.push(`/workout/${workout.id}`);
    } catch (e) {
      let msg = 'Erreur inconnue';
      if (e instanceof Error) msg = e.message;
      else if (e && typeof e === 'object') {
        const obj = e as { message?: string; code?: string; details?: string; hint?: string };
        msg = obj.message || obj.details || obj.hint || obj.code || JSON.stringify(e);
      } else if (typeof e === 'string') msg = e;
      setStartError(`Impossible de démarrer : ${msg}`);
      setStarting(false);
    }
  };

  const handleSaveWeight = async () => {
    const value = parseFloat(weightInput.replace(',', '.'));
    if (!value || value <= 0) return;
    setSavingWeight(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await upsertWeight(value, today);
      setWeightSaved(true);
      setWeightInput('');
      setTimeout(() => setWeightSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingWeight(false);
    }
  };

  if (loading) {
    return <div className="p-4 flex flex-col gap-4 max-w-2xl mx-auto">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>;
  }

  const todayWeight = weightLogs[0];

  return (
    <div className="p-4 flex flex-col gap-4 max-w-2xl mx-auto">
      {/* CTA */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
        <Button
          fullWidth
          size="lg"
          className="h-14 text-base"
          loading={starting}
          onClick={handleStart}
        >
          <Zap size={18} strokeWidth={2.5} />
          {activeWorkout ? 'Reprendre la séance' : 'Démarrer une séance'}
        </Button>
        {startError && (
          <p className="mt-2 text-xs text-danger font-mono bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            {startError}
          </p>
        )}
      </motion.div>

      {/* Séances totales */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center shrink-0">
            <Dumbbell size={22} className="text-accent" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-text-muted">Séances totales</p>
            <p className="font-mono text-3xl font-bold text-text-primary leading-tight">
              {totalWorkouts}<span className="text-base text-text-secondary ml-1">séances</span>
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Poids du jour — saisie rapide */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
        <Card>
          <CardHeader>
            <CardTitle>Poids du jour</CardTitle>
            {todayWeight && <span className="font-mono text-accent text-sm font-bold">{todayWeight.weight} kg</span>}
          </CardHeader>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder={todayWeight ? `${todayWeight.weight}` : 'Ton poids'}
                className="w-full h-11 px-3 pr-10 bg-bg-overlay border border-border rounded-lg text-text-primary font-mono text-sm placeholder:text-text-muted focus:outline-none focus:border-border-active focus:ring-1 focus:ring-accent/30 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs font-mono">kg</span>
            </div>
            <Button onClick={handleSaveWeight} loading={savingWeight} disabled={!weightInput} className="px-4">
              {weightSaved ? <Check size={16} /> : 'Enregistrer'}
            </Button>
          </div>
          {weightLogs.length > 1 && (
            <div className="mt-3">
              <WeightSparkline logs={weightLogs} />
            </div>
          )}
        </Card>
      </motion.div>

      {/* Dernière séance */}
      {lastWorkout && (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
          <Card>
            <CardHeader>
              <CardTitle>Dernière séance</CardTitle>
              <span className="text-xs font-mono text-text-muted">{formatDate(lastWorkout.date)}</span>
            </CardHeader>
            <p className="text-base font-semibold text-text-primary mb-2">{lastWorkout.name}</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {lastWorkout.exercises.filter(Boolean).slice(0, 5).map((ex) => (
                <span key={ex} className="text-[10px] font-mono bg-bg-overlay border border-border px-2 py-0.5 rounded text-text-secondary">{ex}</span>
              ))}
            </div>
            <p className="text-xs font-mono text-text-muted">Volume: <span className="text-accent">{lastWorkout.totalVolume.toLocaleString()} kg</span></p>
          </Card>
        </motion.div>
      )}

      {/* PRs */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
        <Card>
          <CardHeader><CardTitle>PRs récents</CardTitle><Trophy size={14} className="text-warning" /></CardHeader>
          <RecentPRs prs={recentPRs} />
        </Card>
      </motion.div>

      {/* Volume par muscle */}
      {Object.keys(volumeByMuscle).length > 0 && (
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show">
          <Card>
            <CardHeader><CardTitle>Volume par muscle (7j)</CardTitle></CardHeader>
            <VolumeChart data={volumeByMuscle} />
          </Card>
        </motion.div>
      )}
    </div>
  );
}
