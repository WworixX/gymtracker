'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { SetRow } from './SetRow';
import { useWorkoutStore } from '@/stores/workout-store';
import { useWorkoutActions } from '@/hooks/useWorkout';
import { cn } from '@/lib/utils';
import type { ActiveWorkoutExercise } from '@/types';
import confetti from 'canvas-confetti';

export function WorkoutExerciseCard({ item, userId }: { item: ActiveWorkoutExercise; userId: string }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [restSeconds, setRestSeconds] = useState(item.exercise.rest_seconds ?? 120);
  const [editingRest, setEditingRest] = useState(false);
  const { addSet, updateSet, completeSet, deleteSet, markSetSaved, updateExerciseNotes, startRestTimer } = useWorkoutStore();
  const { saveSet, deleteSet: deleteSetDB, checkPR } = useWorkoutActions();

  const handleComplete = async (tempId: string) => {
    const s = item.sets.find((s) => s.tempId === tempId);
    if (!s) return;
    completeSet(item.workoutExerciseId, tempId);
    startRestTimer(restSeconds);
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

  const completedCount = item.sets.filter((s) => s.completed).length;

  return (
    <div className="card-glass overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 relative z-[1]">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <span className="text-base font-medium text-text-primary">{item.exercise.name}</span>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="muscle">{item.exercise.muscle_group}</Badge>
              {completedCount > 0 && (
                <span className="text-[10px] font-mono text-accent uppercase tracking-wider">
                  {completedCount} série{completedCount > 1 ? 's' : ''} ✓
                </span>
              )}
            </div>
          </div>

          {/* Rest time — éditable inline */}
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            <Timer size={12} className="text-text-muted" />
            {editingRest ? (
              <input
                type="number"
                inputMode="numeric"
                value={restSeconds}
                onChange={(e) => setRestSeconds(Math.max(10, parseInt(e.target.value) || 120))}
                onBlur={() => setEditingRest(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingRest(false)}
                autoFocus
                className="w-14 h-6 text-center bg-bg-overlay border border-accent rounded text-xs font-mono text-accent focus:outline-none"
              />
            ) : (
              <button
                onClick={() => setEditingRest(true)}
                className="text-xs font-mono text-text-muted hover:text-accent transition-colors underline-offset-2 hover:underline"
              >
                {restSeconds}s
              </button>
            )}
          </div>
        </div>

        {item.lastSession && (
          <div className="text-xs font-mono text-text-muted bg-bg-base/60 rounded-lg px-3 py-1.5">
            Dernière fois : <span className="text-text-secondary">{item.lastSession.weight} kg × {item.lastSession.reps} reps</span>
          </div>
        )}
      </div>

      {/* Sets */}
      <div className="px-4 pb-4 flex flex-col gap-2 relative z-[1]">
        {item.sets.map((s) => (
          <SetRow
            key={s.tempId}
            set={s}
            onUpdate={(field, value) => updateSet(item.workoutExerciseId, s.tempId, field, value)}
            onComplete={() => handleComplete(s.tempId)}
            onDelete={() => handleDelete(s.tempId)}
          />
        ))}

        {/* Add set */}
        <button
          onClick={() => addSet(item.workoutExerciseId)}
          className="w-full flex items-center justify-center gap-1.5 h-10 text-xs font-mono text-text-muted hover:text-accent border border-dashed border-border hover:border-accent/40 rounded-xl transition-colors mt-1"
        >
          <Plus size={13} /> Ajouter une série
        </button>

        {/* Notes collapsible */}
        <div>
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            className="flex items-center gap-1 text-[10px] font-mono uppercase text-text-muted hover:text-text-secondary transition-colors mt-1"
          >
            <ChevronDown size={12} className={cn('transition-transform', notesOpen && 'rotate-180')} />
            Notes
          </button>
          <AnimatePresence>
            {notesOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
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
