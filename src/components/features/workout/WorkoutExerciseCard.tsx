'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { SetRow } from './SetRow';
import { useWorkoutStore } from '@/stores/workout-store';
import { useWorkoutActions } from '@/hooks/useWorkout';
import { cn } from '@/lib/utils';
import type { ActiveWorkoutExercise } from '@/types';
import confetti from 'canvas-confetti';

export function WorkoutExerciseCard({ item, userId }: { item: ActiveWorkoutExercise; userId: string }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const { addSet, updateSet, completeSet, deleteSet, markSetSaved, updateExerciseNotes, startRestTimer } = useWorkoutStore();
  const { saveSet, deleteSet: deleteSetDB, checkPR } = useWorkoutActions();

  const handleComplete = async (tempId: string) => {
    const s = item.sets.find((s) => s.tempId === tempId);
    if (!s) return;
    completeSet(item.workoutExerciseId, tempId);
    startRestTimer(item.exercise.rest_seconds);
    try {
      const saved = await saveSet(item.workoutExerciseId, s.set_number, s.weight, s.reps);
      markSetSaved(item.workoutExerciseId, tempId, saved.id);
      const isPR = await checkPR(item.exercise.id, s.weight, userId);
      if (isPR) confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#c8f542', '#ffffff', '#9bbf2e'] });
    } catch {}
  };

  const handleDelete = async (tempId: string) => {
    const s = item.sets.find((s) => s.tempId === tempId);
    if (s?.id) deleteSetDB(s.id).catch(() => {});
    deleteSet(item.workoutExerciseId, tempId);
  };

  return (
    <div className="bg-bg-surface border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-text-primary truncate">{item.exercise.name}</span>
          <Badge variant="muscle">{item.exercise.muscle_group}</Badge>
        </div>
        <span className="text-xs font-mono text-text-muted shrink-0 ml-2">{item.exercise.rest_seconds}s</span>
      </div>
      {item.lastSession && (
        <div className="px-4 py-1.5 bg-bg-base/50 border-b border-border/50">
          <p className="text-xs font-mono text-text-muted">Dernière fois: {item.lastSession.weight}kg × {item.lastSession.reps}</p>
        </div>
      )}
      <div className="px-4 py-3">
        <div className="flex items-center gap-4 mb-2 px-3">
          <span className="w-5 text-[10px] font-mono uppercase text-text-muted">SET</span>
          <span className="w-16 text-[10px] font-mono uppercase text-text-muted text-center">KG</span>
          <span className="text-[10px] font-mono uppercase text-text-muted">×</span>
          <span className="w-12 text-[10px] font-mono uppercase text-text-muted text-center">REPS</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {item.sets.map((s) => (
            <SetRow
              key={s.tempId}
              set={s}
              onUpdate={(field, value) => updateSet(item.workoutExerciseId, s.tempId, field, value)}
              onComplete={() => handleComplete(s.tempId)}
              onDelete={() => handleDelete(s.tempId)}
            />
          ))}
        </div>
        <button
          onClick={() => addSet(item.workoutExerciseId)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 h-8 text-xs font-mono text-text-muted hover:text-accent border border-dashed border-border hover:border-accent/40 rounded-lg transition-colors"
        >
          <Plus size={12} /> Série
        </button>
        <div className="mt-2">
          <button onClick={() => setNotesOpen(!notesOpen)} className="flex items-center gap-1 text-[10px] font-mono uppercase text-text-muted hover:text-text-secondary transition-colors">
            <ChevronDown size={12} className={cn('transition-transform', notesOpen && 'rotate-180')} />
            Notes
          </button>
          <AnimatePresence>
            {notesOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <textarea
                  value={item.notes}
                  onChange={(e) => updateExerciseNotes(item.workoutExerciseId, e.target.value)}
                  placeholder="Notes..."
                  className="mt-2 w-full bg-bg-overlay border border-border rounded-lg p-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-active resize-none font-mono"
                  rows={2}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
