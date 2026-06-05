'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getStreakDays, calcVolume, startOfISOWeek } from '@/lib/utils';
import type { WeightLog, PRRecord, Exercise } from '@/types';

interface DashboardData {
  streak: number;
  totalWorkouts: number;
  lastWorkout: { name: string; date: string; exercises: string[]; totalVolume: number } | null;
  recentPRs: PRRecord[];
  weightLogs: WeightLog[];
  volumeByMuscle: Record<string, number>;
  /** Nb de séries par muscle sur la semaine ISO en cours (lundi→dimanche). */
  setsByMuscle: Record<string, number>;
  weeklySets: number;
  loading: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyWorkoutExercise = any;

export function useDashboard() {
  const [data, setData] = useState<DashboardData>({
    streak: 0,
    totalWorkouts: 0,
    lastWorkout: null,
    recentPRs: [],
    weightLogs: [],
    volumeByMuscle: {},
    setsByMuscle: {},
    weeklySets: 0,
    loading: true,
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [workoutsRes, weightRes, countRes] = await Promise.all([
        supabase
          .from('workouts')
          .select(`id, name, started_at, ended_at,
            workout_exercises (
              id,
              exercise:exercises (id, name, muscle_group, training_type),
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
        supabase
          .from('workouts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('ended_at', 'is', null),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const workouts: any[] = workoutsRes.data ?? [];
      const weightLogs = (weightRes.data ?? []) as WeightLog[];
      const totalWorkouts = countRes.count ?? 0;
      const streak = getStreakDays(workouts.map((w) => w.started_at as string));

      let lastWorkout = null;
      if (workouts.length > 0) {
        const lw = workouts[0];
        const allSets = (lw.workout_exercises ?? []).flatMap((we: AnyWorkoutExercise) => (we.sets ?? []) as Array<{ weight: number; reps: number }>);
        lastWorkout = {
          name: (lw.name as string) ?? 'Séance sans titre',
          date: lw.started_at as string,
          exercises: (lw.workout_exercises ?? []).map((we: AnyWorkoutExercise) => (we.exercise?.name ?? '') as string),
          totalVolume: calcVolume(allSets),
        };
      }

      // PRs — pertinents seulement pour les exercices en mode force
      const prMap = new Map<string, PRRecord>();
      for (const workout of workouts) {
        for (const we of (workout.workout_exercises ?? []) as AnyWorkoutExercise[]) {
          if (!we.exercise) continue;
          const ex = we.exercise as Exercise;
          if (ex.training_type !== 'force') continue;
          for (const s of (we.sets ?? []) as Array<{ weight: number; reps: number }>) {
            const existing = prMap.get(ex.id);
            if (!existing || s.weight > existing.weight) {
              prMap.set(ex.id, {
                exercise: ex,
                weight: s.weight,
                reps: s.reps,
                achievedAt: workout.started_at as string,
              });
            }
          }
        }
      }

      // Agrégats de la semaine ISO en cours (lundi → dimanche)
      const weekStart = startOfISOWeek(new Date()).getTime();
      const weeklyWorkouts = workouts.filter((w) => new Date(w.started_at as string).getTime() >= weekStart);
      const volumeByMuscle: Record<string, number> = {};
      const setsByMuscle: Record<string, number> = {};
      let weeklySets = 0;
      for (const workout of weeklyWorkouts) {
        for (const we of (workout.workout_exercises ?? []) as AnyWorkoutExercise[]) {
          if (!we.exercise) continue;
          const mg = (we.exercise as Exercise).muscle_group;
          const sets = (we.sets ?? []) as Array<{ weight: number; reps: number }>;
          volumeByMuscle[mg] = (volumeByMuscle[mg] ?? 0) + calcVolume(sets);
          setsByMuscle[mg] = (setsByMuscle[mg] ?? 0) + sets.length;
          weeklySets += sets.length;
        }
      }

      setData({
        streak,
        totalWorkouts,
        lastWorkout,
        recentPRs: [...prMap.values()].slice(0, 3),
        weightLogs,
        volumeByMuscle,
        setsByMuscle,
        weeklySets,
        loading: false,
      });
    }
    load();
  }, []);

  return data;
}
