export type MuscleGroup =
  | 'Pecs'
  | 'Dos'
  | 'Épaules'
  | 'Biceps'
  | 'Triceps'
  | 'Avant-bras'
  | 'Abdos'
  | 'Quadriceps'
  | 'Ischio-jambiers'
  | 'Fessiers'
  | 'Mollets'
  | 'Full Body';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Pecs',
  'Dos',
  'Épaules',
  'Biceps',
  'Triceps',
  'Avant-bras',
  'Abdos',
  'Quadriceps',
  'Ischio-jambiers',
  'Fessiers',
  'Mollets',
  'Full Body',
];

export interface Profile {
  id: string;
  username: string | null;
  weight_unit: 'kg' | 'lbs';
  current_weight: number | null;
  goal_weight: number | null;
  created_at: string;
}

export interface Exercise {
  id: string;
  user_id: string;
  name: string;
  muscle_group: MuscleGroup;
  rest_seconds: number;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_index: number;
  notes: string | null;
  exercise?: Exercise;
  sets?: Set[];
}

export interface Set {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  completed_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight: number;
  logged_at: string;
  notes: string | null;
  created_at: string;
}

export interface Measurement {
  id: string;
  user_id: string;
  type: string;
  value: number;
  unit: string;
  logged_at: string;
  created_at: string;
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  storage_path: string;
  logged_at: string;
  notes: string | null;
  created_at: string;
}

export interface MacroLog {
  id: string;
  user_id: string;
  logged_at: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  created_at: string;
}

export interface ActiveSet {
  id: string;
  tempId: string;
  set_number: number;
  weight: number;
  reps: number;
  completed: boolean;
  saved: boolean;
}

export interface ActiveWorkoutExercise {
  workoutExerciseId: string;
  exercise: Exercise;
  sets: ActiveSet[];
  notes: string;
  orderIndex: number;
  lastSession: { weight: number; reps: number } | null;
}

export interface ActiveWorkout {
  id: string;
  name: string;
  startedAt: string;
  exercises: ActiveWorkoutExercise[];
}

export interface RestTimer {
  active: boolean;
  secondsLeft: number;
  totalSeconds: number;
}

export interface WorkoutHistoryItem extends Workout {
  exercises: Array<{
    exercise: Exercise;
    sets: Set[];
  }>;
  totalVolume: number;
  totalSets: number;
}

export interface PRRecord {
  exercise: Exercise;
  weight: number;
  reps: number;
  achievedAt: string;
}

export interface TemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number;
  exercise?: Exercise;
}

export interface Template {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  exercises: Array<{ exercise: Exercise; target_sets: number }>;
}
