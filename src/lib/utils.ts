export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateStr));
}

export function calcVolume(sets: Array<{ weight: number; reps: number }>): number {
  return sets.reduce((acc, s) => acc + s.weight * s.reps, 0);
}

export function getWorkoutDuration(startedAt: string, endedAt?: string | null): number {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  return Math.floor((end - start) / 1000);
}

export function getStreakDays(workoutDates: string[]): number {
  if (!workoutDates.length) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = [
    ...new Set(
      workoutDates.map((d) => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    ),
  ].sort((a, b) => b - a);

  let streak = 0;
  let current = today.getTime();

  for (const date of dates) {
    if (date === current || date === current - 86400000) {
      streak++;
      current = date - 86400000;
    } else {
      break;
    }
  }
  return streak;
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
