'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV !== 'production') console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center">
        <AlertTriangle size={24} className="text-danger" />
      </div>
      <div>
        <h1 className="text-lg font-sans font-medium text-text-primary mb-1">Une erreur est survenue</h1>
        <p className="text-sm text-text-muted font-mono max-w-xs">Quelque chose a planté. Réessaie ou recharge la page.</p>
      </div>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 h-11 px-5 rounded-[10px] bg-accent text-[#0c0c0f] font-sans font-semibold text-sm hover:brightness-105 active:scale-[0.97] transition-all"
      >
        <RotateCcw size={15} /> Réessayer
      </button>
    </div>
  );
}
