import { Trophy } from 'lucide-react';
import { formatDateShort, estimate1RM } from '@/lib/utils';
import type { PRRecord } from '@/types';

export function RecentPRs({ prs }: { prs: PRRecord[] }) {
  if (!prs.length) return <p className="text-xs text-text-muted font-mono py-2">Aucun PR enregistré</p>;
  return (
    <div className="flex flex-col gap-2.5">
      {prs.map((pr) => {
        const oneRM = estimate1RM(pr.weight, pr.reps);
        return (
          <div key={pr.exercise.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Trophy size={12} className="text-accent shrink-0" />
              <div className="min-w-0">
                <span className="text-sm text-text-primary truncate block">{pr.exercise.name}</span>
                <span className="text-[10px] font-mono text-text-muted">1RM est. ~{oneRM}kg</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-sm text-accent">{pr.weight}kg</span>
              <span className="text-text-muted font-mono text-xs">×{pr.reps}</span>
              <span className="text-[10px] font-mono text-text-muted">{formatDateShort(pr.achievedAt)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
