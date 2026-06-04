'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Square, X, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { WorkoutExerciseCard } from '@/components/features/workout/WorkoutExerciseCard';
import { RestTimer } from '@/components/features/workout/RestTimer';
import { ExercisePicker } from '@/components/features/workout/ExercisePicker';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useWorkoutStore } from '@/stores/workout-store';
import { useWorkoutActions } from '@/hooks/useWorkout';
import { useAuth } from '@/components/providers/AuthProvider';
import { formatDuration, getWorkoutDuration } from '@/lib/utils';
import type { Exercise } from '@/types';

export default function WorkoutPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const { activeWorkout, clearWorkout, addExercise } = useWorkoutStore();
  const { finishWorkout: finishDB, cancelWorkout: cancelDB, addExerciseToWorkout, getLastSession } = useWorkoutActions();

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
      clearWorkout();
      router.replace('/dashboard');
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
    <div className="flex flex-col min-h-screen bg-bg-base">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg-base/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto gap-2">
          <div className="min-w-0 flex items-center gap-3">
            <button
              onClick={() => setCancelModalOpen(true)}
              className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-danger hover:border-danger/40 transition-colors"
              aria-label="Annuler"
            >
              <X size={16} />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-mono uppercase tracking-widest text-text-muted">En cours</p>
              <div className="font-mono text-accent text-xl font-bold tabular-nums leading-tight">{formatDuration(elapsed)}</div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFinishModalOpen(true)}
            className="border-success/30 text-success hover:bg-success/10 shrink-0"
          >
            <Square size={13} /> Terminer
          </Button>
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

        {activeWorkout.exercises.map((item, i) => (
          <motion.div key={item.workoutExerciseId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <WorkoutExerciseCard item={item} userId={user?.id ?? ''} />
          </motion.div>
        ))}

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
