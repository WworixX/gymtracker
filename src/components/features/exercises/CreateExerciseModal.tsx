'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { MUSCLE_GROUPS } from '@/types';
import type { Exercise } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Nom requis'),
  muscle_group: z.string().min(1, 'Requis'),
  rest_seconds: z.number().int().min(10).max(600),
});
type FormData = z.infer<typeof schema>;

interface CreateExerciseModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (exercise: Exercise) => void;
}

export function CreateExerciseModal({ open, onClose, onCreated }: CreateExerciseModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { rest_seconds: 90 },
  });

  const onSubmit = async (values: FormData) => {
    setSaving(true);
    setError('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Non authentifié'); setSaving(false); return; }
    const { data, error: insErr } = await supabase
      .from('exercises')
      .insert({ ...values, user_id: user.id })
      .select()
      .single();
    setSaving(false);
    if (insErr || !data) { setError(insErr?.message ?? 'Erreur'); return; }
    onCreated(data as Exercise);
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Nouvel exercice">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Nom" {...register('name')} error={errors.name?.message} placeholder="Ex: Curl haltères" />
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-sans font-medium uppercase tracking-[0.12em] text-text-muted">Groupe musculaire</label>
          <select {...register('muscle_group')} className="w-full h-11 px-3 bg-bg-overlay border border-border rounded-[10px] text-text-primary font-mono text-sm focus:outline-none focus:border-border-accent">
            <option value="">Sélectionner...</option>
            {MUSCLE_GROUPS.map((mg) => <option key={mg} value={mg}>{mg}</option>)}
          </select>
          {errors.muscle_group && <p className="text-xs text-danger">{errors.muscle_group.message}</p>}
        </div>
        <Input label="Repos (secondes)" type="number" suffix="s" {...register('rest_seconds', { valueAsNumber: true })} error={errors.rest_seconds?.message} />
        {error && <p className="text-xs text-danger font-mono bg-danger/10 border border-danger/20 rounded-[10px] px-3 py-2">{error}</p>}
        <Button type="submit" loading={saving} fullWidth>Créer l&apos;exercice</Button>
      </form>
    </Modal>
  );
}
