'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Edit2, Volume2, VolumeX, Pin } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { PageTransition } from '@/components/ui/PageTransition';
import { useAuth } from '@/components/providers/AuthProvider';
import { TrainingTypeField } from '@/components/features/exercises/TrainingTypeField';
import { cn } from '@/lib/utils';
import { isSoundEnabled, setSoundEnabled } from '@/lib/sound';
import { MUSCLE_GROUPS } from '@/types';
import type { Exercise } from '@/types';

const exerciseSchema = z.object({
  name: z.string().min(2),
  muscle_group: z.string().min(1),
  rest_seconds: z.number().int().min(10).max(600),
  training_type: z.enum(['force', 'hypertrophy']),
  coach_note: z.string().max(280).optional(),
});
type ExerciseForm = z.infer<typeof exerciseSchema>;

const profileSchema = z.object({
  username: z.string().optional(),
  weight_unit: z.enum(['kg', 'lbs']),
  current_weight: z.number().optional(),
  goal_weight: z.number().optional(),
  goal_date: z.string().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [saving, setSaving] = useState(false);

  const exForm = useForm<ExerciseForm>({ resolver: zodResolver(exerciseSchema), defaultValues: { rest_seconds: 90, training_type: 'hypertrophy' } });
  const profForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => { setSoundOn(isSoundEnabled()); }, []);
  const toggleSound = () => { const next = !soundOn; setSoundOn(next); setSoundEnabled(next); };

  useEffect(() => {
    async function load() {
      if (!user) return;
      const supabase = createClient();
      const [{ data: exData }, { data: profData }] = await Promise.all([
        supabase.from('exercises').select('*').eq('user_id', user.id).order('name'),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ]);
      setExercises((exData ?? []) as Exercise[]);
      if (profData) profForm.reset({ username: profData.username ?? '', weight_unit: profData.weight_unit as 'kg' | 'lbs', current_weight: profData.current_weight ?? undefined, goal_weight: profData.goal_weight ?? undefined, goal_date: profData.goal_date ?? '' });
      setLoading(false);
    }
    load();
  }, [user, profForm]);

  const openCreate = () => { setEditingExercise(null); exForm.reset({ rest_seconds: 90, training_type: 'hypertrophy', coach_note: '' }); setExerciseModalOpen(true); };
  const openEdit = (ex: Exercise) => { setEditingExercise(ex); exForm.reset({ name: ex.name, muscle_group: ex.muscle_group, rest_seconds: ex.rest_seconds, training_type: ex.training_type, coach_note: ex.coach_note ?? '' }); setExerciseModalOpen(true); };

  const onExerciseSubmit = async (data: ExerciseForm) => {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    const payload = { ...data, coach_note: data.coach_note?.trim() || null };
    if (editingExercise) {
      const { data: updated } = await supabase.from('exercises').update(payload).eq('id', editingExercise.id).select().single();
      if (updated) setExercises((prev) => prev.map((e) => (e.id === updated.id ? updated as Exercise : e)));
    } else {
      const { data: created } = await supabase.from('exercises').insert({ ...payload, user_id: user.id }).select().single();
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
    const payload = {
      username: data.username?.trim() || null,
      weight_unit: data.weight_unit,
      current_weight: Number.isFinite(data.current_weight) ? data.current_weight : null,
      goal_weight: Number.isFinite(data.goal_weight) ? data.goal_weight : null,
      goal_date: data.goal_date ? data.goal_date : null,
    };
    await supabase.from('profiles').update(payload).eq('id', user.id);
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
          <Input label="Date objectif" type="date" {...profForm.register('goal_date')} />
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
        <CardHeader><CardTitle>Préférences</CardTitle></CardHeader>
        <button
          onClick={toggleSound}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-bg-overlay rounded-lg border border-transparent hover:border-border transition-colors"
        >
          <div className="flex items-center gap-2.5">
            {soundOn ? <Volume2 size={16} className="text-accent" /> : <VolumeX size={16} className="text-text-muted" />}
            <div className="text-left">
              <p className="text-sm text-text-primary">Sons de surcharge progressive</p>
              <p className="text-[10px] font-mono text-text-muted">Signal sonore à la validation d&apos;une série</p>
            </div>
          </div>
          <span className={cn('relative w-10 h-6 rounded-full transition-colors shrink-0', soundOn ? 'bg-accent' : 'bg-bg-hover')}>
            <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform', soundOn && 'translate-x-4')} />
          </span>
        </button>
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
                {ex.training_type === 'force' && (
                  <span className="text-[9px] font-sans font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-warning/30 text-warning bg-warning/10 shrink-0">Force</span>
                )}
                {ex.coach_note && <Pin size={11} className="text-accent shrink-0" />}
                <span className="text-[10px] font-mono text-text-muted shrink-0">{ex.rest_seconds}s</span>
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
          <TrainingTypeField field={exForm.register('training_type')} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-text-secondary">Note épinglée (optionnel)</label>
            <textarea
              {...exForm.register('coach_note')}
              maxLength={280}
              rows={2}
              placeholder="Ex: réglages machine, rappel technique…"
              className="w-full bg-bg-overlay border border-border rounded-lg p-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-active resize-none font-mono"
            />
          </div>
          <Button type="submit" loading={saving} fullWidth>{editingExercise ? 'Mettre à jour' : 'Créer'}</Button>
        </form>
      </Modal>
    </PageTransition>
  );
}
