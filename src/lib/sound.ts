'use client';

import type { SetTrend } from '@/types';

// Son de surcharge progressive — synthétisé via Web Audio API (aucun fichier audio).
// Activable/désactivable, persisté en localStorage. Joué au gesture (validation série),
// donc l'AudioContext peut démarrer sans blocage navigateur.

const STORAGE_KEY = 'peaklog-sound';

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY) !== 'off';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
}

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** Une note courte avec enveloppe (évite les clics). */
function tone(freq: number, start: number, duration: number, peak = 0.16) {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(pattern); } catch {}
  }
}

/**
 * Joue le retour de surcharge progressive selon la tendance vs dernière séance.
 * up = arpège montant + double buzz · down = note grave + buzz long · equal/null = rien.
 */
export function playTrendCue(trend: SetTrend | null): void {
  if (!trend || !isSoundEnabled()) return;
  const audio = getCtx();
  if (!audio) return;
  const t = audio.currentTime;

  if (trend === 'up') {
    tone(659.25, t, 0.12);        // E5
    tone(987.77, t + 0.09, 0.16); // B5
    vibrate([18, 40, 18]);
  } else if (trend === 'down') {
    tone(311.13, t, 0.22, 0.13);  // Eb4 grave
    vibrate(90);
  }
  // 'equal' → volontairement silencieux (perf neutre)
}
