'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActiveWorkout, ActiveWorkoutExercise, ActiveSet, Exercise, RestTimer } from '@/types';
import { generateTempId } from '@/lib/utils';

interface WorkoutStore {
  activeWorkout: ActiveWorkout | null;
  restTimer: RestTimer;
  startWorkout: (id: string, name: string) => void;
  addExercise: (
    exercise: Exercise,
    workoutExerciseId: string,
    lastSession: { weight: number; reps: number } | null
  ) => void;
  removeExercise: (workoutExerciseId: string) => void;
  addSet: (workoutExerciseId: string) => void;
  updateSet: (workoutExerciseId: string, tempId: string, field: 'weight' | 'reps', value: number) => void;
  completeSet: (workoutExerciseId: string, tempId: string) => void;
  markSetSaved: (workoutExerciseId: string, tempId: string, realId: string) => void;
  deleteSet: (workoutExerciseId: string, tempId: string) => void;
  updateExerciseNotes: (workoutExerciseId: string, notes: string) => void;
  startRestTimer: (seconds: number) => void;
  tickRestTimer: () => void;
  skipRest: () => void;
  clearWorkout: () => void;
}

const defaultRestTimer: RestTimer = { active: false, secondsLeft: 0, totalSeconds: 0 };

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set) => ({
      activeWorkout: null,
      restTimer: defaultRestTimer,

      startWorkout: (id, name) =>
        set({ activeWorkout: { id, name, startedAt: new Date().toISOString(), exercises: [] } }),

      addExercise: (exercise, workoutExerciseId, lastSession) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          const newEx: ActiveWorkoutExercise = {
            workoutExerciseId,
            exercise,
            sets: [{
              id: '',
              tempId: generateTempId(),
              set_number: 1,
              weight: lastSession?.weight ?? 0,
              reps: lastSession?.reps ?? 0,
              completed: false,
              saved: false,
            }],
            notes: '',
            orderIndex: state.activeWorkout.exercises.length,
            lastSession,
          };
          return { activeWorkout: { ...state.activeWorkout, exercises: [...state.activeWorkout.exercises, newEx] } };
        }),

      removeExercise: (workoutExerciseId) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.filter((e) => e.workoutExerciseId !== workoutExerciseId),
            },
          };
        }),

      addSet: (workoutExerciseId) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((e) => {
                if (e.workoutExerciseId !== workoutExerciseId) return e;
                const last = e.sets[e.sets.length - 1];
                const newSet: ActiveSet = {
                  id: '',
                  tempId: generateTempId(),
                  set_number: e.sets.length + 1,
                  weight: last?.weight ?? 0,
                  reps: last?.reps ?? 0,
                  completed: false,
                  saved: false,
                };
                return { ...e, sets: [...e.sets, newSet] };
              }),
            },
          };
        }),

      updateSet: (workoutExerciseId, tempId, field, value) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((e) => {
                if (e.workoutExerciseId !== workoutExerciseId) return e;
                return { ...e, sets: e.sets.map((s) => s.tempId === tempId ? { ...s, [field]: value } : s) };
              }),
            },
          };
        }),

      completeSet: (workoutExerciseId, tempId) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((e) => {
                if (e.workoutExerciseId !== workoutExerciseId) return e;
                return { ...e, sets: e.sets.map((s) => s.tempId === tempId ? { ...s, completed: true } : s) };
              }),
            },
          };
        }),

      markSetSaved: (workoutExerciseId, tempId, realId) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((e) => {
                if (e.workoutExerciseId !== workoutExerciseId) return e;
                return { ...e, sets: e.sets.map((s) => s.tempId === tempId ? { ...s, id: realId, saved: true } : s) };
              }),
            },
          };
        }),

      deleteSet: (workoutExerciseId, tempId) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((e) => {
                if (e.workoutExerciseId !== workoutExerciseId) return e;
                const filtered = e.sets.filter((s) => s.tempId !== tempId);
                return { ...e, sets: filtered.map((s, i) => ({ ...s, set_number: i + 1 })) };
              }),
            },
          };
        }),

      updateExerciseNotes: (workoutExerciseId, notes) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((e) =>
                e.workoutExerciseId === workoutExerciseId ? { ...e, notes } : e
              ),
            },
          };
        }),

      startRestTimer: (seconds) =>
        set({ restTimer: { active: true, secondsLeft: seconds, totalSeconds: seconds } }),

      tickRestTimer: () =>
        set((state) => {
          if (!state.restTimer.active) return state;
          const next = state.restTimer.secondsLeft - 1;
          if (next <= 0) return { restTimer: defaultRestTimer };
          return { restTimer: { ...state.restTimer, secondsLeft: next } };
        }),

      skipRest: () => set({ restTimer: defaultRestTimer }),

      clearWorkout: () => set({ activeWorkout: null, restTimer: defaultRestTimer }),
    }),
    {
      name: 'gymtracker-workout',
      partialize: (state) => ({ activeWorkout: state.activeWorkout }),
    }
  )
);
