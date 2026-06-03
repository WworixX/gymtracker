'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { calcVolume } from '@/lib/utils';
import type { WorkoutHistoryItem } from '@/types';

const PAGE_SIZE = 20;

export function useHistory() {
  const [items, setItems] = useState<WorkoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  const load = useCallback(async (pageNum: number) => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('workouts')
      .select(`id, name, started_at, ended_at, notes, user_id, created_at,
        workout_exercises (
          id,
          exercise:exercises (id, name, muscle_group, rest_seconds, user_id, created_at),
          sets (id, workout_exercise_id, set_number, weight, reps, completed_at)
        )`)
      .eq('user_id', user.id)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    const mapped: WorkoutHistoryItem[] = (data ?? []).map((w) => {
      const exercises = (w.workout_exercises ?? []).map((we: {
        exercise: WorkoutHistoryItem['exercises'][number]['exercise'] | null;
        sets: WorkoutHistoryItem['exercises'][number]['sets'];
      }) => ({ exercise: we.exercise!, sets: we.sets ?? [] }));
      const allSets = exercises.flatMap((e) => e.sets);
      return { ...w, exercises, totalVolume: calcVolume(allSets), totalSets: allSets.length };
    });

    setHasMore(mapped.length === PAGE_SIZE);
    setItems((prev) => (pageNum === 0 ? mapped : [...prev, ...mapped]));
    setLoading(false);
  }, []);

  useEffect(() => { load(0); }, [load]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next);
  };

  return { items, loading, hasMore, loadMore };
}
