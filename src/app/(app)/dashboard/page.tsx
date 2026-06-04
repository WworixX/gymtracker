'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Dumbbell, Trophy, Check, Scale, TrendingUp, Flame } from 'lucide-react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { WeightSparkline } from '@/components/features/dashboard/WeightSparkline';
import { VolumeChart } from '@/components/features/dashboard/VolumeChart';
import { RecentPRs } from '@/components/features/dashboard/RecentPRs';
import { TemplatesSection } from '@/components/features/dashboard/TemplatesSection';
import { useDashboard } from '@/hooks/useDashboard';
import { useWorkoutStore } from '@/stores/workout-store';
import { useWorkoutActions } from '@/hooks/useWorkout';
import { useWeightLogs } from '@/hooks/useBodyLogs';
import { useAuth } from '@/components/providers/AuthProvider';
import { formatDate } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.25, ease: [0.16, 1, 0.3, 1] as const } }),
};

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const spring = useSpring(0, { stiffness: 90, damping: 20 });
  const display = useTransform(spring, (v) => v.toFixed(decimals));
  useEffect(() => { spring.set(value); }, [spring, value]);
  return <motion.span>{display}</motion.span>;
}

function StatCard({ label, value, unit, icon, accent }: { label: string; value: React.ReactNode; unit?: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <Card accent={accent} hover className="p-4">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] font-sans font-medium uppercase tracking-[0.12em] text-text-muted">{label}</span>
        <span className="text-text-muted">{icon}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-[26px] font-medium leading-none ${accent ? 'text-accent text-glow' : 'text-text-primary'}`}>{value}</span>
        {unit && <span className="text-xs font-mono text-text-muted">{unit}</span>}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { totalWorkouts, lastWorkout, recentPRs, volumeByMuscle, loading } = useDashboard();
  const { startWorkout, activeWorkout } = useWorkoutStore();
  const { createWorkout } = useWorkoutActions();
  const { logs: weightLogs, upsert: upsertWeight } = useWeightLogs(7);
  const { user } = useAuth();

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [weightSaved, setWeightSaved] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);
  const router = useRouter();

  const handleStart = async () => {
    setStartError('');
    if (activeWorkout) { router.push(`/workout/${activeWorkout.id}`); return; }
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
      }
      setStartError(`Impossible de démarrer : ${msg}`);
      setStarting(false);
    }
  };

  const handleSaveWeight = async () => {
    const value = parseFloat(weightInput.replace(',', '.'));
    if (!value || value <= 0) return;
    setSavingWeight(true);
    try {
      await upsertWeight(value, new Date().toISOString().split('T')[0]);
      setWeightSaved(true);
      setWeightInput('');
      setTimeout(() => setWeightSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSavingWeight(false); }
  };

  if (loading) {
    return <div className="p-4 flex flex-col gap-4 max-w-2xl mx-auto">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>;
  }

  const todayWeight = weightLogs[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const pseudo = user?.email?.split('@')[0] ?? '';

  return (
    <div className="p-4 flex flex-col gap-4 max-w-2xl mx-auto">
      {/* Header greeting */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="flex items-center justify-between pt-1">
        <div>
          <p className="text-xs font-sans text-text-muted">{greeting}</p>
          <h1 className="text-lg font-sans font-medium text-text-primary capitalize">{pseudo}</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-dim flex items-center justify-center text-[#0c0c0f] font-mono font-semibold text-sm">
          {pseudo.slice(0, 2).toUpperCase()}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="flex flex-col gap-2">
        <Button fullWidth size="lg" className="h-14 text-base accent-glow" loading={starting} onClick={handleStart}>
          <Zap size={18} strokeWidth={2.5} />
          {activeWorkout ? 'Reprendre la séance' : 'Démarrer une séance'}
        </Button>
        {startError && (
          <p className="mt-1 text-xs text-danger font-mono bg-danger/10 border border-danger/20 rounded-[10px] px-3 py-2">{startError}</p>
        )}
      </motion.div>

      {/* Stats grid 2x2 */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
        <StatCard
          label="Poids actuel"
          value={todayWeight ? <AnimatedNumber value={todayWeight.weight} decimals={todayWeight.weight % 1 === 0 ? 0 : 1} /> : '—'}
          unit={todayWeight ? 'kg' : undefined}
          icon={<Scale size={16} />}
          accent
        />
        <StatCard label="Séances totales" value={<AnimatedNumber value={totalWorkouts} />} icon={<Dumbbell size={16} />} />
        <StatCard
          label="Dernier volume"
          value={lastWorkout ? <AnimatedNumber value={lastWorkout.totalVolume} /> : '—'}
          unit={lastWorkout ? 'kg' : undefined}
          icon={<TrendingUp size={16} />}
        />
        <StatCard label="PRs récents" value={<AnimatedNumber value={recentPRs.length} />} icon={<Flame size={16} />} />
      </motion.div>

      {/* Poids du jour — saisie rapide */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
        <Card>
          <CardHeader>
            <CardTitle>Poids du jour</CardTitle>
            {todayWeight && <span className="font-mono text-accent text-sm font-medium">{todayWeight.weight} kg</span>}
          </CardHeader>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number" inputMode="decimal" step="0.1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder={todayWeight ? `${todayWeight.weight}` : 'Ton poids'}
                className="w-full h-11 px-3.5 pr-10 bg-bg-overlay border border-border rounded-[10px] text-text-primary font-mono text-sm placeholder:text-text-muted focus:outline-none focus:border-border-accent focus:ring-[3px] focus:ring-accent/[0.08] transition-colors"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted text-xs font-mono">kg</span>
            </div>
            <Button onClick={handleSaveWeight} loading={savingWeight} disabled={!weightInput} className="px-4">
              {weightSaved ? <Check size={16} /> : 'Enregistrer'}
            </Button>
          </div>
          {weightLogs.length > 1 && <div className="mt-3"><WeightSparkline logs={weightLogs} /></div>}
        </Card>
      </motion.div>

      {/* Programmes */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
        <TemplatesSection />
      </motion.div>

      {/* Dernière séance */}
      {lastWorkout && (
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
          <Card hover>
            <CardHeader>
              <CardTitle>Dernière séance</CardTitle>
              <span className="text-xs font-mono text-text-muted">{formatDate(lastWorkout.date)}</span>
            </CardHeader>
            <p className="text-base font-medium text-text-primary mb-3">{lastWorkout.name}</p>
            <div className="flex flex-wrap gap-1.5">
              {lastWorkout.exercises.filter(Boolean).slice(0, 5).map((ex) => (
                <span key={ex} className="text-[10px] font-mono bg-bg-overlay border border-border px-2 py-1 rounded-full text-text-secondary">{ex}</span>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* PRs */}
      <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show">
        <Card>
          <CardHeader><CardTitle>PRs récents</CardTitle><Trophy size={14} className="text-accent" /></CardHeader>
          <RecentPRs prs={recentPRs} />
        </Card>
      </motion.div>

      {/* Volume par muscle */}
      {Object.keys(volumeByMuscle).length > 0 && (
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show">
          <Card>
            <CardHeader><CardTitle>Volume par muscle (7j)</CardTitle></CardHeader>
            <VolumeChart data={volumeByMuscle} />
          </Card>
        </motion.div>
      )}
    </div>
  );
}
