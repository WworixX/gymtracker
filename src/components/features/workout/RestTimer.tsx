'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useWorkoutStore } from '@/stores/workout-store';
import { formatDuration } from '@/lib/utils';

function playBeep(frequency = 880) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
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
    if (restTimer.active && restTimer.secondsLeft === 0 && prevSeconds.current > 0) {
      playBeep(660);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200]);
    }
    if (restTimer.active && restTimer.secondsLeft <= 10 && prevSeconds.current === restTimer.secondsLeft + 1) playBeep(880);
    prevSeconds.current = restTimer.secondsLeft;
  }, [restTimer]);

  const progress = restTimer.totalSeconds > 0 ? restTimer.secondsLeft / restTimer.totalSeconds : 0;

  const color =
    restTimer.secondsLeft <= 10 ? '#f43f5e' :
    restTimer.secondsLeft <= 30 ? '#f59e0b' :
    '#c8f542';

  return (
    <AnimatePresence>
      {restTimer.active && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 md:bottom-6"
        >
          <motion.div
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl glass-nav border border-border shadow-glass"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: restTimer.secondsLeft <= 10 ? 0.8 : 1, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Progress bar */}
            <div className="relative w-28 h-[3px] bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.9, ease: 'linear' }}
              />
            </div>

            {/* Countdown */}
            <span
              className="font-mono text-sm font-medium tabular-nums w-10 text-center"
              style={{ color, textShadow: `0 0 16px ${color}80` }}
            >
              {formatDuration(restTimer.secondsLeft)}
            </span>

            <span className="text-text-muted text-xs font-mono uppercase tracking-wider hidden sm:inline">
              repos
            </span>

            {/* Skip */}
            <button
              onClick={skipRest}
              className="w-6 h-6 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-bg-overlay transition-colors"
            >
              <X size={13} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
