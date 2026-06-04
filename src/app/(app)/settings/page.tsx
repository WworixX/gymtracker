'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { PageTransition } from '@/components/ui/PageTransition';
import { useAuth } from '@/components/providers/AuthProvider';
import { MUSCLE_GROUPS } from '@/types';
import type { Exercise, Profile } from '@/types';

const exerciseSchema = z.object({
  name: z.string().min(2),
  muscle_group: z.string().min(1),
  rest_seconds: z.number().int().min(10).max(600),
});
type ExerciseForm = z.infer<typeof exerciseSchema>;

const profileSchema = z.object({
  username: z.string().optional(),
  weight_unit: z.enum(['kg', 'lbs']),
  current_weight: z.number().optional(),
  goal_weight: z.number().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [saving, setSaving] = useState(false);

  const exForm = useForm<ExerciseForm>({ resolver: zodResolver(exerciseSchema), defaultValues: { rest_seconds: 90 } });
  const profForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    async function load() {
      if (!user) return;
      const supabase = createClient();
      const [{ data: exData }, { data: profData }] = await Promise.all([
        supabase.from('exercises').select('*').eq('user_id', user.id).order('name'),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ]);
      setExercises((exData ?? []) as Exercise[]);
      if (profData) profForm.reset({ username: profData.username ?? '', weight_unit: profData.weight_unit as 'kg' | 'lbs', current_weight: profData.current_weight ?? undefined, goal_weight: profData.goal_weight ?? undefined });
      setLoading(false);
    }
    load();
  }, [user, profForm]);

  const openCreate = () => { setEditingExercise(null); exForm.reset({ rest_seconds: 90 }); setExerciseModalOpen(true); };
  const openEdit = (ex: Exercise) => { setEditingExercise(ex); exForm.reset({ name: ex.name, muscle_group: ex.muscle_group, rest_seconds: ex.rest_seconds }); setExerciseModalOpen(true); };

  const onExerciseSubmit = async (data: ExerciseForm) => {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    if (editingExercise) {
      const { data: updated } = await supabase.from('exercises').update(data).eq('id', editingExercise.id).select().single();
      if (updated) setExercises((prev) => prev.map((e) => (e.id === updated.id ? updated as Exercise : e)));
    } else {
      const { data: created } = await supabase.from('exercises').insert({ ...data, user_id: user.id }).select().single();
      if (created) setExercises((prev) => [...prev, created as Exercise].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setSaving(false);
    setExerciseModalOpen(false);
  };

  const deleteExercise = async (id: string) => {
    const supabase = createClient();
    await supabase.from('exercises').delete().eq('id', id);
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

  const onProfileSubmit = async (data: ProfileForm) => {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('profiles').update(data).eq('id', user.id);
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <PageTransition className="p-4 max-w-2xl mx-auto flex flex-col gap-5">
      <h1 className="text-[11px] font-sans font-medium uppercase tracking-[0.12em] text-text-muted">Profil</h1>
      <Card>
        <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
        <form onSubmit={profForm.handleSubmit(onProfileSubmit)} className="flex flex-col gap-3">
          <Input label="Pseudo" {...profForm.register('username')} placeholder="Ton pseudo" />
          <div className="flex gap-3">
            <Input label="Poids actuel" type="number" step="0.1" suffix="kg" {...profForm.register('current_weight', { valueAsNumber: true })} />
            <Input label="Objectif" type="number" step="0.1" suffix="kg" {...profForm.register('goal_weight', { valueAsNumber: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-text-secondary">Unités</label>
            <div className="flex gap-4">
              {(['kg', 'lbs'] as const).map((unit) => (
                <label key={unit} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={unit} {...profForm.register('weight_unit')} className="accent-accent" />
                  <span className="font-mono text-sm text-text-primary">{unit}</span>
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" loading={saving} variant="secondary">Sauvegarder</Button>
        </form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Exercices ({exercises.length})</CardTitle>
          <Button size="sm" onClick={openCreate}><Plus size={13} /> Nouveau</Button>
        </CardHeader>
        <div className="flex flex-col gap-1.5">
          {exercises.map((ex) => (
            <div key={ex.id} className="flex items-center justify-between px-3 py-2 bg-bg-overlay rounded-lg border border-transparent hover:border-border transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-text-primary truncate">{ex.name}</span>
                <Badge variant="muscle">{ex.muscle_group}</Badge>
                <span className="text-[10px] font-mono text-text-muted">{ex.rest_seconds}s</span>
              </div>
              <div className="flex gap-1 ml-2 shrink-0">
                <button onClick={() => openEdit(ex)} className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-primary rounded transition-colors"><Edit2 size={13} /></button>
                <button onClick={() => deleteExercise(ex.id)} className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-danger rounded transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="border-danger/20">
        <CardHeader><CardTitle className="text-danger">Compte</CardTitle></CardHeader>
        <Button variant="danger" onClick={signOut} fullWidth>Se déconnecter</Button>
      </Card>
      <Modal open={exerciseModalOpen} onClose={() => setExerciseModalOpen(false)} title={editingExercise ? 'Modifier' : 'Nouvel exercice'}>
        <form onSubmit={exForm.handleSubmit(onExerciseSubmit)} className="flex flex-col gap-4">
          <Input label="Nom" maxLength={60} {...exForm.register('name')} error={exForm.formState.errors.name?.message} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-text-secondary">Groupe musculaire</label>
            <select {...exForm.register('muscle_group')} className="w-full h-11 px-3 bg-bg-overlay border border-border rounded-lg text-text-primary font-mono text-sm focus:outline-none focus:border-border-active">
              <option value="">Sélectionner...</option>
              {MUSCLE_GROUPS.map((mg) => <option key={mg} value={mg}>{mg}</option>)}
            </select>
          </div>
          <Input label="Repos" type="number" suffix="s" {...exForm.register('rest_seconds', { valueAsNumber: true })} error={exForm.formState.errors.rest_seconds?.message} />
          <Button type="submit" loading={saving} fullWidth>{editingExercise ? 'Mettre à jour' : 'Créer'}</Button>
        </form>
      </Modal>
    </PageTransition>
  );
}
