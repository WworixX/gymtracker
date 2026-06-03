import { Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatDateShort } from '@/lib/utils';
import type { PRRecord } from '@/types';

export function RecentPRs({ prs }: { prs: PRRecord[] }) {
  if (!prs.length) return <p className="text-xs text-text-muted font-mono py-2">Aucun PR enregistré</p>;
  return (
    <div className="flex flex-col gap-2">
      {prs.map((pr) => (
        <div key={pr.exercise.id} className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Trophy size={12} className="text-warning shrink-0" />
            <span className="text-sm text-text-primary truncate">{pr.exercise.name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-sm text-accent">{pr.weight}kg</span>
            <span className="text-text-muted font-mono text-xs">×{pr.reps}</span>
            <Badge variant="default">{formatDateShort(pr.achievedAt)}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
