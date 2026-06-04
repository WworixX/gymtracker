'use client';

import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { WorkoutExerciseCard } from './WorkoutExerciseCard';
import type { ActiveWorkoutExercise } from '@/types';

interface Props {
  item: ActiveWorkoutExercise;
  userId: string;
  onDragEnd: () => void;
}

export function ReorderableExerciseCard({ item, userId, onDragEnd }: Props) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      className="list-none"
      whileDrag={{ scale: 1.02, zIndex: 10 }}
    >
      <WorkoutExerciseCard
        item={item}
        userId={userId}
        dragHandle={
          <button
            type="button"
            onPointerDown={(e) => controls.start(e)}
            className="touch-none cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary transition-colors mt-0.5 -ml-1"
            aria-label="Réordonner"
          >
            <GripVertical size={16} />
          </button>
        }
      />
    </Reorder.Item>
  );
}
