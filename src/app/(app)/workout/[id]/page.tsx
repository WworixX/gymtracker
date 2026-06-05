'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Square, X, Trash2, TrendingUp, Calculator } from 'lucide-react';
import { Reorder } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ReorderableExerciseCard } from '@/components/features/workout/ReorderableExerciseCard';
import { RestTimer } from '@/components/features/workout/RestTimer';
import { ExercisePicker } from '@/components/features/workout/ExercisePicker';
import { PlatesCalculator } from '@/components/features/workout/PlatesCalculator';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useWorkoutStore } from '@/stores/workout-store';
import { useWorkoutActions } from '@/hooks/useWorkout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { formatDuration, getWorkoutDuration, getSetTrend } from '@/lib/utils';
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
  const [platesOpen, setPlatesOpen] = useState(false);
  const [recap, setRecap] = useState<null | { duration: number; exCount: number; totalSets: number; totalVolume: number; beaten: number; prevVolume: number }>(null);

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
      // Récap calculé depuis le store avant de vider la séance
      const exs = activeWorkout.exercises;
      const completed = exs.flatMap((e) => e.sets.filter((s) => s.completed));
      let beaten = 0;
      let prevVolume = 0;
      let exCount = 0;
      for (const e of exs) {
        const done = e.sets.filter((s) => s.completed);
        if (done.length) exCount++;
        for (const s of done) {
          if (getSetTrend({ weight: s.weight, reps: s.reps }, e.lastSets?.[s.set_number - 1]) === 'up') beaten++;
        }
        if (e.lastSets) prevVolume += e.lastSets.reduce((a, p) => a + p.weight * p.reps, 0);
      }
      const data = {
        duration: elapsed,
        exCount,
        totalSets: completed.length,
        totalVolume: completed.reduce((a, s) => a + s.weight * s.reps, 0),
        beaten,
        prevVolume,
      };
      await finishDB(activeWorkout.id);
      setFinishModalOpen(false);
      setRecap(data);
      if (data.totalSets > 0) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: ['#c8f542', '#ffffff', '#9bbf2e'] });
      }
    } catch {
      toast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setFinishing(false);
    }
  };

  const closeRecap = () => {
    setRecap(null);
    clearWorkout();
    toast('Séance enregistrée 💪', 'success');
    router.replace('/dashboard');
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
        <button
          onClick={() => setPlatesOpen(true)}
          className="flex items-center justify-center gap-2 w-full h-10 text-text-muted hover:text-accent transition-colors text-xs font-mono"
        >
          <Calculator size={14} /> Calculateur de disques
        </button>
      </div>

      <RestTimer />

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddExercise}
        selectedIds={activeWorkout.exercises.map((e) => e.exercise.id)}
      />

      <PlatesCalculator open={platesOpen} onClose={() => setPlatesOpen(false)} />

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
            <Button onClick={handleFinish} loading={finishing} fullWidth>Terminer</Button>
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

      {/* Récap post-séance */}
      <Modal open={!!recap} onClose={closeRecap} title="Séance terminée 💪">
        {recap && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Durée', value: formatDuration(recap.duration) },
                { label: 'Exercices', value: String(recap.exCount) },
                { label: 'Séries', value: String(recap.totalSets) },
                { label: 'Volume', value: `${recap.totalVolume.toLocaleString()} kg` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-bg-overlay rounded-lg p-3">
                  <p className="text-[10px] font-mono uppercase text-text-muted mb-0.5">{label}</p>
                  <p className="font-mono text-lg text-text-primary">{value}</p>
                </div>
              ))}
            </div>
            {recap.beaten > 0 && (
              <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-success/30 bg-success/10 text-success text-sm font-sans font-medium">
                <TrendingUp size={15} /> {recap.beaten} série{recap.beaten > 1 ? 's' : ''} battue{recap.beaten > 1 ? 's' : ''} vs dernière fois
              </div>
            )}
            {recap.prevVolume > 0 && (
              <p className="text-center text-xs font-mono text-text-muted">
                Volume vs dernière fois : <span className={recap.totalVolume >= recap.prevVolume ? 'text-success' : 'text-warning'}>{recap.totalVolume >= recap.prevVolume ? '+' : ''}{(recap.totalVolume - recap.prevVolume).toLocaleString()} kg</span>
              </p>
            )}
            <Button onClick={closeRecap} fullWidth>Voir le tableau de bord</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
