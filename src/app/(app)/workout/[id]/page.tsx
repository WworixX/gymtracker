'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Square, X, Trash2 } from 'lucide-react';
import { Reorder } from 'framer-motion';
import { ReorderableExerciseCard } from '@/components/features/workout/ReorderableExerciseCard';
import { RestTimer } from '@/components/features/workout/RestTimer';
import { ExercisePicker } from '@/components/features/workout/ExercisePicker';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useWorkoutStore } from '@/stores/workout-store';
import { useWorkoutActions } from '@/hooks/useWorkout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { formatDuration, getWorkoutDuration } from '@/lib/utils';
import type { Exercise, ActiveWorkoutExercise } from '@/types';

export default function WorkoutPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeWorkout, clearWorkout, addExercise, reorderExercises } = useWorkoutStore();
  const { finishWorkout: finishDB, cancelWorkout: cancelDB, addExerciseToWorkout, getLastSession, reorderExercisesDB } = useWorkoutActions();

  const handleReorder = (newOrder: ActiveWorkoutExercise[]) => {
    reorderExercises(newOrder.map((e) => e.workoutExerciseId));
  };

  const persistOrder = () => {
    const current = useWorkoutStore.getState().activeWorkout;
    if (current) reorderExercisesDB(current.exercises.map((e) => e.workoutExerciseId)).catch(() => {});
  };

  const [elapsed, setElapsed] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Wait for zustand persist hydration before deciding to redirect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to dashboard if no matching active workout (after hydration)
  useEffect(() => {
    if (!mounted) return;
    if (!activeWorkout || activeWorkout.id !== params.id) {
      router.replace('/dashboard');
    }
  }, [mounted, activeWorkout, params.id, router]);

  // Live chrono
  useEffect(() => {
    if (!activeWorkout) return;
    const update = () => setElapsed(getWorkoutDuration(activeWorkout.startedAt));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout]);

  const handleAddExercise = async (ex: Exercise) => {
    if (!activeWorkout || !user) return;
    setPickerOpen(false);
    const we = await addExerciseToWorkout(activeWorkout.id, ex.id, activeWorkout.exercises.length);
    const last = await getLastSession(ex.id, user.id);
    addExercise(ex, we.id, last);
  };

  const handleFinish = async () => {
    if (!activeWorkout) return;
    setFinishing(true);
    try {
      await finishDB(activeWorkout.id);
      const count = activeWorkout.exercises.flatMap((e) => e.sets).filter((s) => s.completed).length;
      clearWorkout();
      toast(`Séance terminée — ${count} série${count > 1 ? 's' : ''} 💪`, 'success');
      router.replace('/dashboard');
    } catch {
      toast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setFinishing(false);
    }
  };

  const handleCancel = async () => {
    if (!activeWorkout) return;
    setCancelling(true);
    try {
      await cancelDB(activeWorkout.id);
      clearWorkout();
      router.replace('/dashboard');
    } finally {
      setCancelling(false);
    }
  };

  if (!activeWorkout || activeWorkout.id !== params.id) return null;

  const completedSets = activeWorkout.exercises.flatMap((e) => e.sets).filter((s) => s.completed).length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header premium */}
      <div className="sticky top-0 z-20 glass-header border-b border-[rgba(255,255,255,0.07)] px-4 py-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
        <div className="flex items-center justify-between max-w-2xl mx-auto gap-3">
          <button
            onClick={() => setCancelModalOpen(true)}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-[10px] border border-border text-text-muted hover:text-danger hover:border-danger/40 transition-colors"
            aria-label="Annuler"
          >
            <X size={16} />
          </button>

          <div className="flex flex-col items-center min-w-0 flex-1">
            <p className="text-[10px] font-sans uppercase tracking-[0.12em] text-text-muted truncate max-w-full">{activeWorkout.name}</p>
            <div className="font-mono text-xl font-medium tabular-nums leading-tight text-accent chrono-glow">{formatDuration(elapsed)}</div>
          </div>

          <button
            onClick={() => setFinishModalOpen(true)}
            className="shrink-0 h-9 px-3.5 inline-flex items-center gap-1.5 rounded-[10px] text-sm font-sans font-medium transition-colors"
            style={{ background: 'rgba(244,63,94,0.12)', border: '0.5px solid rgba(244,63,94,0.25)', color: '#f43f5e' }}
          >
            <Square size={13} /> Terminer
          </button>
        </div>
      </div>

      {/* Exercises */}
      <div className="flex-1 p-4 flex flex-col gap-4 max-w-2xl mx-auto w-full pb-32">
        {activeWorkout.exercises.length === 0 && (
          <EmptyState
            title="Aucun exercice"
            description="Ajoute ton premier exercice pour commencer."
          />
        )}

        <Reorder.Group
          axis="y"
          values={activeWorkout.exercises}
          onReorder={handleReorder}
          className="flex flex-col gap-4"
        >
          {activeWorkout.exercises.map((item) => (
            <ReorderableExerciseCard
              key={item.workoutExerciseId}
              item={item}
              userId={user?.id ?? ''}
              onDragEnd={persistOrder}
            />
          ))}
        </Reorder.Group>

        <button
          onClick={() => setPickerOpen(true)}
          className="flex items-center justify-center gap-2 w-full h-12 border border-dashed border-border rounded-lg text-text-muted hover:text-accent hover:border-accent/40 transition-colors text-sm font-mono"
        >
          <Plus size={14} /> Ajouter un exercice
        </button>
      </div>

      <RestTimer />

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddExercise}
        selectedIds={activeWorkout.exercises.map((e) => e.exercise.id)}
      />

      {/* Finish modal */}
      <Modal open={finishModalOpen} onClose={() => setFinishModalOpen(false)} title="Terminer la séance ?">
        <div className="flex flex-col gap-4">
          <div className="bg-bg-overlay rounded-lg p-4 flex flex-col gap-2">
            {[
              { label: 'Durée', value: formatDuration(elapsed) },
              { label: 'Exercices', value: String(activeWorkout.exercises.length) },
              { label: 'Séries complétées', value: String(completedSets) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm font-mono">
                <span className="text-text-muted">{label}</span>
                <span className="text-text-primary">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setFinishModalOpen(false)} fullWidth>Continuer</Button>
            <Button onClick={handleFinish} loading={finishing} fullWidth className="bg-success text-bg-base hover:bg-success/90">Terminer</Button>
          </div>
        </div>
      </Modal>

      {/* Cancel modal */}
      <Modal open={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Annuler l'entraînement ?">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary font-mono leading-relaxed">
            La séance et toutes les séries enregistrées seront supprimées. Action irréversible.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCancelModalOpen(false)} fullWidth>Retour</Button>
            <Button variant="danger" onClick={handleCancel} loading={cancelling} fullWidth>
              <Trash2 size={14} /> Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
