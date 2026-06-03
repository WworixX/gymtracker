'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Check, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { createClient } from '@/lib/supabase/client';
import { MUSCLE_GROUPS } from '@/types';
import type { Exercise, MuscleGroup } from '@/types';

const newExerciseSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  muscle_group: z.string().min(1, 'Requis'),
  rest_seconds: z.number().int().min(10).max(600),
});
type NewExerciseForm = z.infer<typeof newExerciseSchema>;

interface ExercisePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  selectedIds?: string[];
}

export function ExercisePicker({ open, onClose, onSelect, selectedIds = [] }: ExercisePickerProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | ''>('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewExerciseForm>({
    resolver: zodResolver(newExerciseSchema),
    defaultValues: { rest_seconds: 90 },
  });

  const loadExercises = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('exercises').select('*').eq('user_id', user.id).order('name');
    setExercises((data ?? []) as Exercise[]);
    setLoading(false);
  }, []);

  useEffect(() => { if (open) loadExercises(); }, [open, loadExercises]);

  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) && (!filterMuscle || e.muscle_group === filterMuscle)
  );

  const onCreateSubmit = async (values: NewExerciseForm) => {
    setCreating(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('exercises').insert({ ...values, user_id: user.id }).select().single();
    if (!error && data) {
      setExercises((prev) => [...prev, data as Exercise].sort((a, b) => a.name.localeCompare(b.name)));
      onSelect(data as Exercise);
      reset();
      setShowCreate(false);
    }
    setCreating(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajouter un exercice" className="max-h-[80vh]">
      {showCreate ? (
        <form onSubmit={handleSubmit(onCreateSubmit)} className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <button type="button" onClick={() => setShowCreate(false)} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
            <span className="text-xs font-mono uppercase tracking-widest text-text-secondary">Nouvel exercice</span>
          </div>
          <Input label="Nom" {...register('name')} error={errors.name?.message} placeholder="Ex: Curl haltères" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-text-secondary">Groupe musculaire</label>
            <select {...register('muscle_group')} className="w-full h-11 px-3 bg-bg-overlay border border-border rounded-lg text-text-primary font-mono text-sm focus:outline-none focus:border-border-active">
              <option value="">Sélectionner...</option>
              {MUSCLE_GROUPS.map((mg) => <option key={mg} value={mg}>{mg}</option>)}
            </select>
            {errors.muscle_group && <p className="text-xs text-danger">{errors.muscle_group.message}</p>}
          </div>
          <Input label="Repos (secondes)" type="number" suffix="s" {...register('rest_seconds', { valueAsNumber: true })} error={errors.rest_seconds?.message} />
          <Button type="submit" loading={creating} fullWidth>Créer</Button>
        </form>
      ) : (
        <>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full h-9 pl-8 pr-3 bg-bg-overlay border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-active font-mono"
              />
            </div>
            <button onClick={() => setShowCreate(true)} className="h-9 w-9 flex items-center justify-center bg-accent/10 border border-accent/30 rounded-lg text-accent hover:bg-accent/20 transition-colors">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex gap-1.5 flex-wrap mb-3">
            <button onClick={() => setFilterMuscle('')} className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border transition-colors ${filterMuscle === '' ? 'bg-accent/10 border-accent/30 text-accent' : 'border-border text-text-muted hover:border-border-active'}`}>Tous</button>
            {MUSCLE_GROUPS.map((mg) => (
              <button key={mg} onClick={() => setFilterMuscle(mg === filterMuscle ? '' : mg)} className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border transition-colors ${filterMuscle === mg ? 'bg-accent/10 border-accent/30 text-accent' : 'border-border text-text-muted hover:border-border-active'}`}>{mg}</button>
            ))}
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
              {filtered.map((ex) => {
                const isSelected = selectedIds.includes(ex.id);
                return (
                  <button
                    key={ex.id}
                    onClick={() => onSelect(ex)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-colors text-left border ${isSelected ? 'bg-accent/10 border-accent/20' : 'hover:bg-bg-overlay border-transparent'}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-text-primary truncate">{ex.name}</span>
                      <Badge variant="muscle">{ex.muscle_group}</Badge>
                    </div>
                    {isSelected && <Check size={14} className="text-accent shrink-0" />}
                  </button>
                );
              })}
              {!filtered.length && <p className="text-center text-xs text-text-muted py-6 font-mono">Aucun résultat</p>}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
