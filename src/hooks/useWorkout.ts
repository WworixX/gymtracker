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

  return { getLastSession, createWorkout, addExerciseToWorkout, saveSet, deleteSet, finishWorkout, checkPR, getUserExercises };
}
