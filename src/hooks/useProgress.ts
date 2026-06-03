'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Exercise } from '@/types';

interface ProgressPoint {
  date: string;
  maxWeight: number;
  totalVolume: number;
  sets: number;
}

type TimeRange = '1m' | '3m' | '6m' | 'all';

export function useProgress(exerciseId: string | null, range: TimeRange) {
  const [points, setPoints] = useState<ProgressPoint[]>([]);
  const [pr, setPr] = useState<{ weight: number; date: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!exerciseId) return;
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const cutoff = new Date();
      if (range === '1m') cutoff.setMonth(cutoff.getMonth() - 1);
      else if (range === '3m') cutoff.setMonth(cutoff.getMonth() - 3);
      else if (range === '6m') cutoff.setMonth(cutoff.getMonth() - 6);
      else cutoff.setFullYear(2000);

      const { data: weData } = await supabase
        .from('workout_exercises')
        .select(`sets (weight, reps), workout:workouts!inner (user_id, started_at, ended_at)`)
        .eq('exercise_id', exerciseId)
        .eq('workout.user_id', user.id)
        .not('workout.ended_at', 'is', null)
        .gte('workout.started_at', cutoff.toISOString())
        .order('workout.started_at', { ascending: true });

      const pointsByDate = new Map<string, ProgressPoint>();
      for (const we of weData ?? []) {
        const workout = we.workout as { started_at: string } | null;
        if (!workout) continue;
        const date = workout.started_at.split('T')[0];
        const sets = (we.sets ?? []) as Array<{ weight: number; reps: number }>;
        const maxWeight = sets.reduce((m, s) => Math.max(m, s.weight), 0);
        const totalVolume = sets.reduce((acc, s) => acc + s.weight * s.reps, 0);
        const existing = pointsByDate.get(date);
        if (!existing || maxWeight > existing.maxWeight) {
          pointsByDate.set(date, {
            date,
            maxWeight,
            totalVolume: (existing?.totalVolume ?? 0) + totalVolume,
            sets: (existing?.sets ?? 0) + sets.length,
          });
        }
      }

      const pts = [...pointsByDate.values()];
      const bestPr = pts.reduce<{ weight: number; date: string } | null>(
        (best, p) => (!best || p.maxWeight > best.weight ? { weight: p.maxWeight, date: p.date } : best),
        null
      );

      setPoints(pts);
      setPr(bestPr);
      setLoading(false);
    }
    load();
  }, [exerciseId, range]);

  return { points, pr, loading };
}

export function useExerciseList() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('exercises').select('*').eq('user_id', user.id).order('name');
    setExercises((data ?? []) as Exercise[]);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { exercises, loading, reload };
}
