'use client';

import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Exercise } from '@/types';

export function useWorkoutActions() {
  const getLastSession = useCallback(async (exerciseId: string, userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('workout_exercises')
      .select(`sets (weight, reps), workout:workouts!inner (user_id, ended_at)`)
      .eq('exercise_id', exerciseId)
      .eq('workout.user_id', userId)
      .not('workout.ended_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;
    const sets = (data.sets ?? []) as Array<{ weight: number; reps: number }>;
    if (!sets.length) return null;
    const best = sets.reduce((max, s) => (s.weight > max.weight ? s : max), sets[0]);
    return { weight: best.weight, reps: best.reps };
  }, []);

  const createWorkout = useCallback(async (name: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('workouts')
      .insert({ user_id: user.id, name, started_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, []);

  const addExerciseToWorkout = useCallback(async (workoutId: string, exerciseId: string, orderIndex: number) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('workout_exercises')
      .insert({ workout_id: workoutId, exercise_id: exerciseId, order_index: orderIndex })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, []);

  const saveSet = useCallback(async (workoutExerciseId: string, setNumber: number, weight: number, reps: number) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('sets')
      .insert({ workout_exercise_id: workoutExerciseId, set_number: setNumber, weight, reps, completed_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, []);

  const deleteSet = useCallback(async (setId: string) => {
    const supabase = createClient();
    await supabase.from('sets').delete().eq('id', setId);
  }, []);

  const finishWorkout = useCallback(async (workoutId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('workouts')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', workoutId);
    if (error) throw error;
  }, []);

  const cancelWorkout = useCallback(async (workoutId: string) => {
    const supabase = createClient();
    // ON DELETE CASCADE supprime workout_exercises + sets
    await supabase.from('workouts').delete().eq('id', workoutId);
  }, []);

  const checkPR = useCallback(async (exerciseId: string, weight: number, userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('workout_exercises')
      .select(`sets (weight), workout:workouts!inner (user_id)`)
      .eq('exercise_id', exerciseId)
      .eq('workout.user_id', userId);

    const maxWeight = (data ?? [])
      .flatMap((we: { sets: Array<{ weight: number }> }) => we.sets)
      .reduce((max, s) => Math.max(max, s.weight), 0);

    return weight > maxWeight;
  }, []);

  const getUserExercises = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [] as Exercise[];
    const { data } = await supabase.from('exercises').select('*').eq('user_id', user.id).order('name');
    return (data ?? []) as Exercise[];
  }, []);

  /** Récupère les exercices (avec dernière perf) de la dernière séance terminée. */
  const getLastWorkoutExercises = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [] as Array<{ exercise: Exercise; lastSession: { weight: number; reps: number } | null }>;

    const { data } = await supabase
      .from('workouts')
      .select(`id, workout_exercises ( order_index, exercise:exercises (*), sets (weight, reps) )`)
      .eq('user_id', user.id)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wes = ((data as any).workout_exercises ?? []) as any[];
    return wes
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .map((we) => {
        const exercise = (Array.isArray(we.exercise) ? we.exercise[0] : we.exercise) as Exercise;
        const sets = (we.sets ?? []) as Array<{ weight: number; reps: number }>;
        const lastSession = sets.length
          ? sets.reduce((max, s) => (s.weight > max.weight ? s : max), sets[0])
          : null;
        return { exercise, lastSession: lastSession ? { weight: lastSession.weight, reps: lastSession.reps } : null };
      })
      .filter((x) => x.exercise);
  }, []);

  return { getLastSession, createWorkout, addExerciseToWorkout, saveSet, deleteSet, finishWorkout, cancelWorkout, checkPR, getUserExercises, getLastWorkoutExercises };
}
