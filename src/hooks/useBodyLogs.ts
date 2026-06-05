'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { WeightLog, Measurement, MacroLog, Profile } from '@/types';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile((data ?? null) as Profile | null);
      setLoading(false);
    })();
  }, []);

  return { profile, loading };
}

export function useWeightLogs(limit = 30) {
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('weight_logs').select('*').eq('user_id', user.id)
      .order('logged_at', { ascending: false }).limit(limit);
    setLogs((data ?? []) as WeightLog[]);
    setLoading(false);
  }, [limit]);

  useEffect(() => { reload(); }, [reload]);

  const upsert = useCallback(async (weight: number, date: string, notes?: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('weight_logs').upsert(
      { user_id: user.id, weight, logged_at: date, notes: notes ?? null },
      { onConflict: 'user_id,logged_at' }
    );
    await reload();
  }, [reload]);

  const remove = useCallback(async (id: string) => {
    const supabase = createClient();
    await supabase.from('weight_logs').delete().eq('id', id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }, []);

  return { logs, loading, upsert, remove };
}

export function useMeasurements(type: string) {
  const [logs, setLogs] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!type) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('measurements').select('*').eq('user_id', user.id).eq('type', type)
      .order('logged_at', { ascending: false }).limit(30);
    setLogs((data ?? []) as Measurement[]);
    setLoading(false);
  }, [type]);

  useEffect(() => { reload(); }, [reload]);

  const add = useCallback(async (value: number, date: string, unit = 'cm') => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('measurements').insert({ user_id: user.id, type, value, unit, logged_at: date });
    await reload();
  }, [type, reload]);

  return { logs, loading, add };
}

export function useMacroLogs(limit = 7) {
  const [logs, setLogs] = useState<MacroLog[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('macro_logs').select('*').eq('user_id', user.id)
      .order('logged_at', { ascending: false }).limit(limit);
    setLogs((data ?? []) as MacroLog[]);
    setLoading(false);
  }, [limit]);

  useEffect(() => { reload(); }, [reload]);

  const upsert = useCallback(async (date: string, calories: number, protein_g: number, carbs_g: number, fat_g: number) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('macro_logs').upsert(
      { user_id: user.id, logged_at: date, calories, protein_g, carbs_g, fat_g },
      { onConflict: 'user_id,logged_at' }
    );
    await reload();
  }, [reload]);

  return { logs, loading, upsert };
}
