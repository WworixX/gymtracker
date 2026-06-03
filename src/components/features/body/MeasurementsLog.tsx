'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useMeasurements } from '@/hooks/useBodyLogs';
import { formatDateShort } from '@/lib/utils';

const MEASUREMENT_TYPES = ['Bras', 'Taille', 'Hanches', 'Cuisses', 'Mollets', 'Poitrine', 'Épaules'];
const schema = z.object({ value: z.number().positive(), date: z.string().min(1) });
type FormData = z.infer<typeof schema>;

function MeasurementSection({ type }: { type: string }) {
  const { logs, add } = useMeasurements(type);
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  });
  const onSubmit = async (data: FormData) => {
    await add(data.value, data.date);
    reset({ date: new Date().toISOString().split('T')[0] });
    setOpen(false);
  };
  const latest = logs[0];
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center justify-between w-full px-4 py-3 bg-bg-surface border border-border rounded-lg hover:bg-bg-elevated transition-colors">
        <span className="text-sm text-text-primary font-mono">{type}</span>
        <div className="flex items-center gap-2">
          {latest ? <span className="font-mono text-sm text-accent">{latest.value} cm</span> : <span className="font-mono text-xs text-text-muted">—</span>}
          <ChevronRight size={14} className="text-text-muted" />
        </div>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={type}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mb-4">
          <Input label="Valeur" type="number" step="0.1" suffix="cm" {...register('value', { valueAsNumber: true })} />
          <Input label="Date" type="date" {...register('date')} />
          <Button type="submit" fullWidth>Enregistrer</Button>
        </form>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {logs.map((l) => (
            <div key={l.id} className="flex justify-between px-3 py-2 bg-bg-overlay rounded-lg">
              <span className="text-xs font-mono text-text-secondary">{formatDateShort(l.logged_at)}</span>
              <span className="font-mono text-sm text-text-primary">{l.value} cm</span>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}

export function MeasurementsLog() {
  return (
    <div className="flex flex-col gap-2">
      {MEASUREMENT_TYPES.map((type) => <MeasurementSection key={type} type={type} />)}
    </div>
  );
}
