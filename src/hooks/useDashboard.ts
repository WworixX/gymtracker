'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getStreakDays, calcVolume } from '@/lib/utils';
import type { Exercise, WeightLog, PRRecord } from '@/types';

interface DashboardData {
  streak: number;
  lastWorkout: { name: string; date: string; exercises: string[]; totalVolume: number } | null;
  recentPRs: PRRecord[];
  weightLogs: WeightLog[];
  volumeByMuscle: Record<string, number>;
  loading: boolean;
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData>({
    streak: 0,
    lastWorkout: null,
    recentPRs: [],
    weightLogs: [],
    volumeByMuscle: {},
    loading: true,
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [workoutsRes, weightRes] = await Promise.all([
        supabase
          .from('workouts')
          .select(`id, name, started_at, ended_at,
            workout_exercises (
              id,
              exercise:exercises (id, name, muscle_group),
              sets (weight, reps)
            )`)
          .eq('user_id', user.id)
          .not('ended_at', 'is', null)
          .gte('started_at', sevenDaysAgo.toISOString())
          .order('started_at', { ascending: false })
          .limit(20),
        supabase
          .from('weight_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false })
          .limit(7),
      ]);

      const workouts = workoutsRes.data ?? [];
      const weightLogs = (weightRes.data ?? []) as WeightLog[];
      const streak = getStreakDays(workouts.map((w) => w.started_at));

      let lastWorkout = null;
      if (workouts.length > 0) {
        const lw = workouts[0];
        const allSets = lw.workout_exercises?.flatMap((we: { sets: Array<{ weight: number; reps: number }> }) => we.sets) ?? [];
        lastWorkout = {
          name: lw.name ?? 'Séance sans titre',
          date: lw.started_at,
          exercises: lw.workout_exercises?.map((we: { exercise: { name: string } | null }) => we.exercise?.name ?? '') ?? [],
          totalVolume: calcVolume(allSets),
        };
      }

      const prMap = new Map<string, PRRecord>();
      for (const workout of workouts) {
        for (const we of workout.workout_exercises ?? []) {
          if (!we.exercise) continue;
          for (const s of we.sets ?? []) {
            const existing = prMap.get(we.exercise.id);
            if (!existing || s.weight > existing.weight) {
              prMap.set(we.exercise.id, {
                exercise: we.exercise as Exercise,
                weight: s.weight,
                reps: s.reps,
                achievedAt: workout.started_at,
              });
            }
          }
        }
      }

      const volumeByMuscle: Record<string, number> = {};
      for (const workout of workouts) {
        for (const we of workout.workout_exercises ?? []) {
          if (!we.exercise) continue;
          const mg = (we.exercise as Exercise).muscle_group;
          const vol = calcVolume(we.sets ?? []);
          volumeByMuscle[mg] = (volumeByMuscle[mg] ?? 0) + vol;
        }
      }

      setData({
        streak,
        lastWorkout,
        recentPRs: [...prMap.values()].slice(0, 3),
        weightLogs,
        volumeByMuscle,
        loading: false,
      });
    }
    load();
  }, []);

  return data;
}
