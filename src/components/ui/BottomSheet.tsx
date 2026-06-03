'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  blocking?: boolean;
}

export function BottomSheet({ open, onClose, children, className, blocking }: BottomSheetProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {!blocking && (
            <motion.div
              className="fixed inset-0 bg-black/60 z-40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
            />
          )}
          <motion.div
            className={cn('fixed bottom-0 left-0 right-0 bg-bg-elevated border-t border-border rounded-t-2xl z-50', className)}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          >
            <div className="w-8 h-1 bg-border rounded-full mx-auto mt-3 mb-2" />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
