'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ExercisePicker } from '@/components/features/workout/ExercisePicker';
import { useWorkoutStore } from '@/stores/workout-store';
import { useWorkoutActions } from '@/hooks/useWorkout';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Exercise } from '@/types';

const schema = z.object({ name: z.string().optional() });
type FormData = z.infer<typeof schema>;

export default function NewWorkoutPage() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm<FormData>({ resolver: zodResolver(schema) });
  const router = useRouter();
  const { user } = useAuth();
  const { startWorkout, addExercise } = useWorkoutStore();
  const { createWorkout, addExerciseToWorkout, getLastSession } = useWorkoutActions();

  const handleAddExercise = (ex: Exercise) => {
    if (!selectedExercises.find((e) => e.id === ex.id)) setSelectedExercises((prev) => [...prev, ex]);
    setPickerOpen(false);
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setLoading(true);
    try {
      const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
      const name = data.name?.trim() || `Séance du ${today}`;
      const workout = await createWorkout(name);
      startWorkout(workout.id, name);
      for (let i = 0; i < selectedExercises.length; i++) {
        const ex = selectedExercises[i];
        const we = await addExerciseToWorkout(workout.id, ex.id, i);
        const last = await getLastSession(ex.id, user.id);
        addExercise(ex, we.id, last);
      }
      router.push(`/workout/${workout.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto flex flex-col gap-5">
      <div>
        <h1 className="font-mono text-xs uppercase tracking-widest text-text-secondary mb-1">Nouvelle séance</h1>
        <p className="text-text-muted text-xs font-mono">Configurez, puis lancez.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Input
          label="Nom de la séance"
          placeholder={`Séance du ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}
          {...register('name')}
        />
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-text-secondary mb-2">Exercices</p>
          <div className="flex flex-col gap-2">
            {selectedExercises.map((ex, i) => (
              <motion.div key={ex.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between px-3 py-2.5 bg-bg-surface border border-border rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-text-muted text-xs font-mono w-4">{i + 1}</span>
                  <span className="text-sm text-text-primary truncate">{ex.name}</span>
                  <Badge variant="muscle">{ex.muscle_group}</Badge>
                </div>
                <button type="button" onClick={() => setSelectedExercises((prev) => prev.filter((e) => e.id !== ex.id))} className="text-text-muted hover:text-danger transition-colors ml-2">
                  <Trash2 size={13} />
                </button>
              </motion.div>
            ))}
            <button type="button" onClick={() => setPickerOpen(true)} className="flex items-center justify-center gap-2 w-full h-11 border border-dashed border-border rounded-lg text-text-muted hover:text-accent hover:border-accent/40 transition-colors text-sm font-mono">
              <Plus size={14} /> Ajouter un exercice
            </button>
          </div>
        </div>
        <Button type="submit" fullWidth size="lg" loading={loading} disabled={selectedExercises.length === 0}>
          Lancer la séance
        </Button>
      </form>
      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleAddExercise} selectedIds={selectedExercises.map((e) => e.id)} />
    </div>
  );
}
