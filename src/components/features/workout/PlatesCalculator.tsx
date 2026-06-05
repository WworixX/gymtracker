'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

// Disques standards (kg). Calcule la charge à mettre PAR CÔTÉ de la barre.
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATE_COLOR: Record<number, string> = {
  25: '#f43f5e', 20: '#3b82f6', 15: '#f59e0b', 10: '#22c55e', 5: '#f2f2f4', 2.5: '#9a9aa8', 1.25: '#6f6f80',
};

function computePlates(total: number, bar: number): { perSide: { plate: number; count: number }[]; leftover: number } | null {
  let perSide = (total - bar) / 2;
  if (perSide < 0) return null;
  const res: { plate: number; count: number }[] = [];
  for (const p of PLATES) {
    const c = Math.floor(perSide / p + 1e-9);
    if (c > 0) { res.push({ plate: p, count: c }); perSide = +(perSide - c * p).toFixed(3); }
  }
  return { perSide: res, leftover: +perSide.toFixed(3) };
}

export function PlatesCalculator({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [total, setTotal] = useState(60);
  const [bar, setBar] = useState(20);

  const result = computePlates(total, bar);

  return (
    <Modal open={open} onClose={onClose} title="Calculateur de disques">
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <Input label="Charge totale" type="number" inputMode="decimal" suffix="kg" value={total || ''} onChange={(e) => setTotal(parseFloat(e.target.value) || 0)} />
          <Input label="Barre" type="number" inputMode="decimal" suffix="kg" value={bar || ''} onChange={(e) => setBar(parseFloat(e.target.value) || 0)} />
        </div>

        {result === null ? (
          <p className="text-xs text-warning font-mono bg-warning/10 border border-warning/20 rounded-lg px-3 py-2">
            Charge inférieure au poids de la barre.
          </p>
        ) : result.perSide.length === 0 ? (
          <p className="text-xs text-text-muted font-mono py-2 text-center">Juste la barre — aucun disque.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-sans font-medium uppercase tracking-[0.12em] text-text-muted">Par côté</p>
            <div className="flex flex-col gap-1.5">
              {result.perSide.map(({ plate, count }) => (
                <div key={plate} className="flex items-center gap-2.5 px-3 py-2 bg-bg-overlay rounded-lg">
                  <span className="w-2.5 h-6 rounded-sm shrink-0" style={{ background: PLATE_COLOR[plate] ?? '#c8f542' }} />
                  <span className="font-mono text-sm text-text-primary">{plate} kg</span>
                  <span className="ml-auto font-mono text-sm text-accent">× {count}</span>
                </div>
              ))}
            </div>
            {result.leftover > 0 && (
              <p className="text-[11px] font-mono text-warning">Reste {result.leftover} kg/côté non atteignable avec ces disques.</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
