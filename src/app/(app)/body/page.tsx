'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { WeightLog } from '@/components/features/body/WeightLog';
import { MeasurementsLog } from '@/components/features/body/MeasurementsLog';
import { PhotosGrid } from '@/components/features/body/PhotosGrid';
import { MacrosLog } from '@/components/features/body/MacrosLog';

const TABS = [
  { id: 'weight', label: 'Poids' },
  { id: 'measurements', label: 'Mensurations' },
  { id: 'photos', label: 'Photos' },
  { id: 'macros', label: 'Macros' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export default function BodyPage() {
  const [tab, setTab] = useState<TabId>('weight');
  return (
    <div className="p-4 max-w-2xl mx-auto flex flex-col gap-4">
      <h1 className="font-mono text-xs uppercase tracking-widest text-text-secondary">Corps</h1>
      <div className="flex gap-1 bg-bg-surface border border-border rounded-lg p-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn('flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded-md transition-colors', tab === t.id ? 'bg-bg-elevated text-text-primary' : 'text-text-muted hover:text-text-secondary')}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'weight' && <WeightLog />}
      {tab === 'measurements' && <MeasurementsLog />}
      {tab === 'photos' && <PhotosGrid />}
      {tab === 'macros' && <MacrosLog />}
    </div>
  );
}
