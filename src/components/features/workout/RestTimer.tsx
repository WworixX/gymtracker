'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useWorkoutStore } from '@/stores/workout-store';
import { formatDuration } from '@/lib/utils';

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function playBeep(frequency = 880) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

export function RestTimer() {
  const { restTimer, tickRestTimer, skipRest } = useWorkoutStore();
  const prevSeconds = useRef(restTimer.secondsLeft);

  useEffect(() => {
    if (!restTimer.active) return;
    const interval = setInterval(() => tickRestTimer(), 1000);
    return () => clearInterval(interval);
  }, [restTimer.active, tickRestTimer]);

  useEffect(() => {
    if (restTimer.active && restTimer.secondsLeft === 0 && prevSeconds.current > 0) playBeep(660);
    if (restTimer.active && restTimer.secondsLeft === 10 && prevSeconds.current === 11) playBeep(880);
    prevSeconds.current = restTimer.secondsLeft;
  }, [restTimer]);

  const progress = restTimer.totalSeconds > 0 ? restTimer.secondsLeft / restTimer.totalSeconds : 0;
  const offset = CIRCUMFERENCE * (1 - progress);
  const timerColor = restTimer.secondsLeft <= 10 ? '#ff4545' : restTimer.secondsLeft <= 30 ? '#f59e0b' : '#c8f542';

  return (
    <BottomSheet open={restTimer.active} blocking className="pb-8">
      <div className="flex flex-col items-center px-6 pt-4 pb-6 gap-6">
        <p className="text-xs font-mono uppercase tracking-widest text-text-secondary">Temps de repos</p>
        <div className="relative flex items-center justify-center">
          <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="#2a2a2a" strokeWidth="6" />
            <motion.circle
              cx="70" cy="70" r={RADIUS} fill="none"
              stroke={timerColor} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}
              transition={{ duration: 0.9, ease: 'linear' }}
              style={{ filter: `drop-shadow(0 0 6px ${timerColor}60)` }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span
              className="font-mono font-bold leading-none"
              style={{ fontSize: '64px', color: timerColor, letterSpacing: '-2px', transition: 'color 0.5s' }}
            >
              {formatDuration(restTimer.secondsLeft)}
            </span>
          </div>
        </div>
        <Button variant="secondary" onClick={skipRest} size="lg">Passer</Button>
      </div>
    </BottomSheet>
  );
}
