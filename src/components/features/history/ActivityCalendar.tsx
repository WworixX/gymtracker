'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { startOfISOWeek, formatDateShort } from '@/lib/utils';

const WEEKS = 18;
const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function cellColor(n: number): string {
  if (n <= 0) return 'rgba(255,255,255,0.05)';
  if (n === 1) return 'rgba(200,245,66,0.45)';
  if (n === 2) return 'rgba(200,245,66,0.72)';
  return '#c8f542';
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Cell = { label: string; count: number } | null;

export function ActivityCalendar() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const start = startOfISOWeek(new Date());
      start.setDate(start.getDate() - (WEEKS - 1) * 7);
      const { data } = await supabase
        .from('workouts')
        .select('started_at')
        .eq('user_id', user.id)
        .not('ended_at', 'is', null)
        .gte('started_at', start.toISOString());
      const map: Record<string, number> = {};
      for (const w of (data ?? []) as Array<{ started_at: string }>) {
        const k = dayKey(new Date(w.started_at));
        map[k] = (map[k] ?? 0) + 1;
      }
      setCounts(map);
      setLoading(false);
    })();
  }, []);

  // Construit WEEKS colonnes de 7 jours (lundi → dimanche), du plus ancien au plus récent
  const monday = startOfISOWeek(new Date());
  const today = new Date(); today.setHours(23, 59, 59, 999);
  const weeks: Cell[][] = [];
  for (let w = WEEKS - 1; w >= 0; w--) {
    const col: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() - w * 7 + d);
      if (date.getTime() > today.getTime()) { col.push(null); continue; }
      const k = dayKey(date);
      col.push({ label: formatDateShort(k), count: counts[k] ?? 0 });
    }
    weeks.push(col);
  }

  const total = Object.values(counts).reduce((a, n) => a + n, 0);

  if (loading) return <div className="h-24 flex items-center justify-center text-text-muted text-xs font-mono">…</div>;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-start overflow-x-auto pb-1">
        <div className="flex flex-col gap-[3px] shrink-0">
          {DAY_LABELS.map((d, i) => (
            <span key={i} className="h-[12px] text-[8px] font-mono text-text-muted leading-[12px]">{d}</span>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((cell, di) =>
                cell ? (
                  <span
                    key={di}
                    title={`${cell.label} — ${cell.count} séance${cell.count > 1 ? 's' : ''}`}
                    className="w-[12px] h-[12px] rounded-[3px]"
                    style={{ background: cellColor(cell.count) }}
                  />
                ) : (
                  <span key={di} className="w-[12px] h-[12px]" />
                )
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-text-muted">{total} séance{total > 1 ? 's' : ''} · {WEEKS} sem.</span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-mono text-text-muted">Moins</span>
          {[0, 1, 2, 3].map((n) => (
            <span key={n} className="w-[10px] h-[10px] rounded-[2px]" style={{ background: cellColor(n) }} />
          ))}
          <span className="text-[9px] font-mono text-text-muted">Plus</span>
        </div>
      </div>
    </div>
  );
}
