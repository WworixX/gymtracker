import type { UseFormRegisterReturn } from 'react-hook-form';

/** Sélecteur Force / Hypertrophie partagé par les formulaires d'exercice. */
export function TrainingTypeField({ field }: { field: UseFormRegisterReturn }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-sans font-medium uppercase tracking-[0.12em] text-text-muted">Type d&apos;entraînement</label>
      <div className="grid grid-cols-2 gap-2">
        {([['hypertrophy', 'Hypertrophie'], ['force', 'Force']] as const).map(([val, label]) => (
          <label key={val} className="relative cursor-pointer">
            <input type="radio" value={val} {...field} className="peer sr-only" />
            <span className="block text-center py-2.5 rounded-[10px] border border-border text-text-muted text-sm font-sans transition-colors peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-accent">
              {label}
            </span>
          </label>
        ))}
      </div>
      <p className="text-[10px] font-mono text-text-muted leading-relaxed">
        Force : badge PR + 1RM. Hypertrophie : focus volume & progression vs dernière fois.
      </p>
    </div>
  );
}
