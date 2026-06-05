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

/** 1RM estimé — formule Epley. 1 rep = poids brut. */
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

/** Meilleur 1RM estimé d'une liste de séries. */
export function best1RM(sets: Array<{ weight: number; reps: number }>): number {
  return sets.reduce((max, s) => Math.max(max, estimate1RM(s.weight, s.reps)), 0);
}

/**
 * Surcharge progressive : compare une série à la même série de la dernière séance.
 * Métrique = 1RM estimé (gère poids↑/reps↓ équitablement).
 * Retourne null si pas de référence (1re fois, série en plus) → aucun jugement.
 */
export function getSetTrend(
  current: { weight: number; reps: number },
  previous: { weight: number; reps: number } | null | undefined
): 'up' | 'equal' | 'down' | null {
  if (!previous || previous.weight <= 0 || previous.reps <= 0) return null;
  if (current.weight <= 0 || current.reps <= 0) return null;
  const cur = estimate1RM(current.weight, current.reps);
  const prev = estimate1RM(previous.weight, previous.reps);
  if (cur > prev) return 'up';
  if (cur < prev) return 'down';
  return 'equal';
}

/** Lundi 00:00 de la semaine contenant `date` (semaine ISO lundi→dimanche). */
export function startOfISOWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = dimanche
  const diff = day === 0 ? 6 : day - 1; // recule jusqu'au lundi
  d.setDate(d.getDate() - diff);
  return d;
}

/**
 * Pente d'une régression linéaire (moindres carrés) exprimée en unité/semaine.
 * points : { t: timestamp ms, y: valeur }. Retourne 0 si < 2 points.
 */
export function linregSlopePerWeek(points: Array<{ t: number; y: number }>): number {
  const n = points.length;
  if (n < 2) return 0;
  const meanT = points.reduce((a, p) => a + p.t, 0) / n;
  const meanY = points.reduce((a, p) => a + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.t - meanT) * (p.y - meanY);
    den += (p.t - meanT) ** 2;
  }
  if (den === 0) return 0;
  const slopePerMs = num / den;
  return slopePerMs * 7 * 86400000; // ms → semaine
}

/** Évalue la robustesse d'un mot de passe. Score 0-4. */
export function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  score = Math.min(score, 4);
  const labels = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Excellent'];
  return { score, label: labels[score] };
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

/** Échappe une valeur pour CSV (guillemets + séparateur). */
function csvCell(value: string | number): string {
  const s = String(value ?? '');
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Construit + télécharge un fichier CSV (séparateur ; pour Excel FR). */
export function downloadCSV(filename: string, headers: string[], rows: Array<Array<string | number>>): void {
  const lines = [headers, ...rows].map((r) => r.map(csvCell).join(';'));
  // BOM UTF-8 pour accents corrects dans Excel
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
