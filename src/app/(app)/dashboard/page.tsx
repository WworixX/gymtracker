'use client';

import Link from 'next/link';
import { Zap, Flame, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { WeightSparkline } from '@/components/features/dashboard/WeightSparkline';
import { VolumeChart } from '@/components/features/dashboard/VolumeChart';
import { RecentPRs } from '@/components/features/dashboard/RecentPRs';
import { useDashboard } from '@/hooks/useDashboard';
import { formatDate } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06 } }),
};

export default function DashboardPage() {
  const { streak, lastWorkout, recentPRs, weightLogs, volumeByMuscle, loading } = useDashboard();

  if (loading) {
    return <div className="p-4 flex flex-col gap-4 max-w-2xl mx-auto">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>;
  }

  return (
    <div className="p-4 flex flex-col gap-4 max-w-2xl mx-auto">
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
        <Link href="/workout/new">
          <Button fullWidth size="lg" className="h-14 text-base"><Zap size={18} strokeWidth={2.5} />Démarrer une séance</Button>
        </Link>
      </motion.div>

      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-warning/10 border border-warning/20 rounded-xl flex items-center justify-center shrink-0">
            <Flame size={22} className="text-warning" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-text-muted">Streak actuel</p>
            <p className="font-mono text-3xl font-bold text-text-primary leading-tight">
              {streak}<span className="text-base text-text-secondary ml-1">jours</span>
            </p>
          </div>
        </Card>
      </motion.div>

      {lastWorkout && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
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

      {weightLogs.length > 0 && (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
          <Card>
            <CardHeader>
              <CardTitle>Poids (7j)</CardTitle>
              {weightLogs[0] && <span className="font-mono text-accent text-lg font-bold">{weightLogs[0].weight} kg</span>}
            </CardHeader>
            <WeightSparkline logs={weightLogs} />
          </Card>
        </motion.div>
      )}

      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
        <Card>
          <CardHeader><CardTitle>PRs récents</CardTitle><Trophy size={14} className="text-warning" /></CardHeader>
          <RecentPRs prs={recentPRs} />
        </Card>
      </motion.div>

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
