'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Exercise } from '@/types';

// Indice de surcharge progressive de la 1re série.
// poids = priorité (toute hausse de poids = progression), reps = bonus secondaire.
// Donc 12×9 < 13×5 (le poids prime) ET 12×7 < 12×9 (reps à poids égal).
function progressScore(weight: number, reps: number): number {
  return Math.round((weight + reps * 0.1) * 10) / 10;
}

interface ProgressPoint {
  date: string;
  weight: number; // poids de la 1re série
  reps: number;   // reps de la 1re série
  score: number;  // indice de progression
}

type TimeRange = '1m' | '3m' | '6m' | 'all';

export function useProgress(exerciseId: string | null, range: TimeRange) {
  const [points, setPoints] = useState<ProgressPoint[]>([]);
  const [pr, setPr] = useState<{ score: number; weight: number; reps: number; date: string } | null>(null);
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
        .select(`started_at, workout_exercises!inner ( exercise_id, sets ( set_number, weight, reps ) )`)
        .eq('user_id', user.id)
        .not('ended_at', 'is', null)
        .gte('started_at', cutoff.toISOString())
        .eq('workout_exercises.exercise_id', exerciseId)
        .order('started_at', { ascending: true });

      // Un point par séance = la 1RE SÉRIE (le nb de séries varie d'une fois à l'autre).
      const pts: ProgressPoint[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const w of (wData ?? []) as any[]) {
        const sets = ((w.workout_exercises ?? []) as Array<{ sets?: Array<{ set_number: number; weight: number; reps: number }> }>)
          .flatMap((we) => we.sets ?? [])
          .filter((s) => s.weight > 0 && s.reps > 0);
        if (!sets.length) continue;
        const first = sets.reduce((m, s) => (s.set_number < m.set_number ? s : m), sets[0]);
        pts.push({ date: w.started_at as string, weight: first.weight, reps: first.reps, score: progressScore(first.weight, first.reps) });
      }
      pts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const bestPr = pts.reduce<{ score: number; weight: number; reps: number; date: string } | null>(
        (best, p) => (!best || p.score > best.score ? { score: p.score, weight: p.weight, reps: p.reps, date: p.date } : best),
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
