'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { best1RM } from '@/lib/utils';
import type { Exercise } from '@/types';

interface ProgressPoint {
  date: string;
  maxWeight: number;
  totalVolume: number;
  sets: number;
  e1rm: number;
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

      // Filtres + tri au niveau top-level (workouts) — fiable. L'exercice est
      // filtré via l'embed inner. (Filtrer/ordonner sur une table imbriquée via
      // "workout.xxx" renvoyait null silencieusement.)
      const { data: wData } = await supabase
        .from('workouts')
        .select(`started_at, workout_exercises!inner ( exercise_id, sets ( weight, reps ) )`)
        .eq('user_id', user.id)
        .not('ended_at', 'is', null)
        .gte('started_at', cutoff.toISOString())
        .eq('workout_exercises.exercise_id', exerciseId)
        .order('started_at', { ascending: true });

      // Un point par séance (et non par jour) — sinon plusieurs séances le même
      // jour s'effondrent en un seul point et la courbe paraît vide.
      const pts: ProgressPoint[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const w of (wData ?? []) as any[]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sets = ((w.workout_exercises ?? []) as any[]).flatMap((we) => (we.sets ?? [])) as Array<{ weight: number; reps: number }>;
        if (!sets.length) continue;
        const maxWeight = sets.reduce((m, s) => Math.max(m, s.weight), 0);
        const totalVolume = sets.reduce((acc, s) => acc + s.weight * s.reps, 0);
        pts.push({ date: w.started_at as string, maxWeight, totalVolume, sets: sets.length, e1rm: best1RM(sets) });
      }
      pts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
