'use client';

import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Exercise } from '@/types';

export function useWorkoutActions() {
  const getLastSession = useCallback(async (exerciseId: string, userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('workouts')
      .select(`started_at, workout_exercises!inner (exercise_id, sets (set_number, weight, reps))`)
      .eq('user_id', userId)
      .eq('workout_exercises.exercise_id', exerciseId)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;
    const we = ((data as { workout_exercises?: Array<{ sets?: Array<{ set_number: number; weight: number; reps: number }> }> }).workout_exercises ?? [])[0];
    const raw = (we?.sets ?? []) as Array<{ set_number: number; weight: number; reps: number }>;
    if (!raw.length) return null;
    // Toutes les séries de la dernière séance, dans l'ordre
    const sets = [...raw]
      .sort((a, b) => a.set_number - b.set_number)
      .map((s) => ({ weight: s.weight, reps: s.reps }));
    const best = sets.reduce((max, s) => (s.weight > max.weight ? s : max), sets[0]);
    return { sets, best };
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

  const reorderExercisesDB = useCallback(async (orderedIds: string[]) => {
    const supabase = createClient();
    await Promise.all(
      orderedIds.map((id, i) => supabase.from('workout_exercises').update({ order_index: i }).eq('id', id))
    );
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

  const updateExerciseNote = useCallback(async (exerciseId: string, note: string) => {
    const supabase = createClient();
    await supabase.from('exercises').update({ coach_note: note.trim() || null }).eq('id', exerciseId);
  }, []);

  return { getLastSession, createWorkout, addExerciseToWorkout, reorderExercisesDB, saveSet, deleteSet, finishWorkout, cancelWorkout, checkPR, getUserExercises, updateExerciseNote };
}
