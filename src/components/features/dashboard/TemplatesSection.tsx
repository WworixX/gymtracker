'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Dumbbell, Play, X } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ExercisePicker } from '@/components/features/workout/ExercisePicker';
import { useTemplates } from '@/hooks/useTemplates';
import { useWorkoutActions } from '@/hooks/useWorkout';
import { useWorkoutStore } from '@/stores/workout-store';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import type { Exercise, Template } from '@/types';

export function TemplatesSection() {
  const { templates, loading, createTemplate, deleteTemplate } = useTemplates();
  const { createWorkout, addExerciseToWorkout, getLastSession } = useWorkoutActions();
  const { startWorkout, addExercise, activeWorkout } = useWorkoutStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [createOpen, setCreateOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  const toggleExercise = (ex: Exercise) => {
    setSelected((prev) =>
      prev.some((e) => e.id === ex.id) ? prev.filter((e) => e.id !== ex.id) : [...prev, ex]
    );
  };

  const resetCreate = () => { setName(''); setSelected([]); setCreateOpen(false); };

  const handleSave = async () => {
    if (!name.trim() || !selected.length) return;
    setSaving(true);
    try {
      await createTemplate(name.trim(), selected.map((e) => e.id));
      toast('Programme créé', 'success');
      resetCreate();
    } catch {
      toast('Impossible de créer le programme', 'error');
    }
    finally { setSaving(false); }
  };

  const handleLaunch = async (tpl: Template) => {
    if (activeWorkout) { router.push(`/workout/${activeWorkout.id}`); return; }
    if (!user) return;
    setLaunchingId(tpl.id);
    try {
      const workout = await createWorkout(tpl.name);
      startWorkout(workout.id, tpl.name);
      let i = 0;
      for (const { exercise } of tpl.exercises) {
        const we = await addExerciseToWorkout(workout.id, exercise.id, i);
        const last = await getLastSession(exercise.id, user.id);
        addExercise(exercise, we.id, last);
        i++;
      }
      router.push(`/workout/${workout.id}`);
    } catch {
      toast('Impossible de lancer le programme', 'error');
      setLaunchingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mes programmes</CardTitle>
        <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-1 text-xs font-sans font-medium text-accent hover:text-accent-dim transition-colors">
          <Plus size={13} /> Nouveau
        </button>
      </CardHeader>

      {loading ? (
        <p className="text-xs text-text-muted font-mono py-2">Chargement…</p>
      ) : templates.length === 0 ? (
        <p className="text-xs text-text-muted font-mono py-2">Aucun programme. Crée ton premier modèle.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {templates.map((tpl) => (
            <div key={tpl.id} className="flex items-center gap-2 p-3 rounded-[12px] bg-bg-overlay border border-border">
              <div className="w-9 h-9 shrink-0 rounded-[10px] bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Dumbbell size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary truncate">{tpl.name}</p>
                <p className="text-[10px] font-mono text-text-muted">{tpl.exercises.length} exercice{tpl.exercises.length > 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => handleLaunch(tpl)}
                disabled={launchingId === tpl.id}
                className="h-8 px-3 inline-flex items-center gap-1.5 rounded-[10px] bg-accent text-[#0c0c0f] text-xs font-sans font-semibold hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
              >
                <Play size={12} strokeWidth={2.5} /> Lancer
              </button>
              <button onClick={() => deleteTemplate(tpl.id)} className="w-8 h-8 shrink-0 flex items-center justify-center text-text-muted hover:text-danger transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal création */}
      <Modal open={createOpen} onClose={resetCreate} title="Nouveau programme">
        <div className="flex flex-col gap-4">
          <Input label="Nom du programme" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Push / Pull / Legs" maxLength={60} />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-sans font-medium uppercase tracking-[0.12em] text-text-muted">
                Exercices ({selected.length})
              </label>
              <button onClick={() => setPickerOpen(true)} className="inline-flex items-center gap-1 text-xs font-sans font-medium text-accent hover:text-accent-dim transition-colors">
                <Plus size={13} /> Ajouter
              </button>
            </div>
            <AnimatePresence>
              {selected.length === 0 ? (
                <p className="text-xs text-text-muted font-mono py-2">Aucun exercice sélectionné.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {selected.map((ex) => (
                    <motion.div
                      key={ex.id}
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center justify-between px-3 py-2 rounded-[10px] bg-bg-overlay border border-border"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm text-text-primary truncate">{ex.name}</span>
                        <Badge variant="muscle">{ex.muscle_group}</Badge>
                      </div>
                      <button onClick={() => toggleExercise(ex)} className="text-text-muted hover:text-danger transition-colors"><X size={14} /></button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          <Button fullWidth loading={saving} disabled={!name.trim() || !selected.length} onClick={handleSave}>
            Créer le programme
          </Button>
        </div>
      </Modal>

      {/* Picker exercices (multi-sélection) */}
      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={toggleExercise}
        selectedIds={selected.map((e) => e.id)}
      />
    </Card>
  );
}
