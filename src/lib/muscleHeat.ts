// Échelle de chaleur partagée (body map + barres séries/muscle).
// Couleurs distinctes (tokens app) pour une lecture immédiate du volume hebdo.
// Seuils = nb de séries / semaine / muscle.

export function muscleHeatColor(n: number): string {
  if (n <= 0) return 'rgba(255,255,255,0.06)';
  if (n < 5) return '#3b82f6';   // info — faible
  if (n < 10) return '#22c55e';  // success — correct
  if (n < 15) return '#c8f542';  // accent — optimal
  if (n < 20) return '#f59e0b';  // warning — élevé
  return '#f43f5e';              // danger — très élevé
}

export const HEAT_SCALE: Array<{ color: string; label: string }> = [
  { color: 'rgba(255,255,255,0.06)', label: '0' },
  { color: '#3b82f6', label: '1-4' },
  { color: '#22c55e', label: '5-9' },
  { color: '#c8f542', label: '10-14' },
  { color: '#f59e0b', label: '15-19' },
  { color: '#f43f5e', label: '20+' },
];
