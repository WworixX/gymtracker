'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Template, Exercise } from '@/types';

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('templates')
      .select(`id, user_id, name, created_at,
        template_exercises ( order_index, target_sets, exercise:exercises (*) )`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data ?? []) as any[];
    const mapped: Template[] = rows.map((t) => ({
      id: t.id,
      user_id: t.user_id,
      name: t.name,
      created_at: t.created_at,
      exercises: (t.template_exercises ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((te: any) => ({
          exercise: (Array.isArray(te.exercise) ? te.exercise[0] : te.exercise) as Exercise,
          target_sets: te.target_sets ?? 3,
        }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((x: any) => x.exercise),
    }));
    setTemplates(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createTemplate = useCallback(async (name: string, exerciseIds: string[]) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: tpl, error } = await supabase
      .from('templates')
      .insert({ user_id: user.id, name })
      .select()
      .single();
    if (error) throw error;

    if (exerciseIds.length) {
      const rows = exerciseIds.map((exercise_id, i) => ({ template_id: tpl.id, exercise_id, order_index: i }));
      const { error: teErr } = await supabase.from('template_exercises').insert(rows);
      if (teErr) throw teErr;
    }
    await load();
  }, [load]);

  const deleteTemplate = useCallback(async (id: string) => {
    const supabase = createClient();
    await supabase.from('templates').delete().eq('id', id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { templates, loading, createTemplate, deleteTemplate, reload: load };
}
