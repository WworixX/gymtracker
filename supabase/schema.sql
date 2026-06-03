-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Profiles
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lbs')),
  current_weight numeric,
  goal_weight numeric,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Exercises
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  name text not null,
  muscle_group text not null,
  rest_seconds integer not null default 90,
  created_at timestamptz not null default now()
);

alter table public.exercises enable row level security;

create policy "Users manage own exercises"
  on public.exercises for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Seed default exercises
create or replace function public.seed_default_exercises(p_user_id uuid)
returns void as $$
begin
  insert into public.exercises (user_id, name, muscle_group, rest_seconds) values
    (p_user_id, 'Développé couché', 'Pecs', 120),
    (p_user_id, 'Développé incliné', 'Pecs', 120),
    (p_user_id, 'Écarté poulie', 'Pecs', 90),
    (p_user_id, 'Tractions', 'Dos', 120),
    (p_user_id, 'Rowing barre', 'Dos', 120),
    (p_user_id, 'Tirage poulie haute', 'Dos', 90),
    (p_user_id, 'Développé militaire', 'Épaules', 120),
    (p_user_id, 'Élévations latérales', 'Épaules', 60),
    (p_user_id, 'Curl barre', 'Biceps', 90),
    (p_user_id, 'Curl haltère', 'Biceps', 60),
    (p_user_id, 'Dips', 'Triceps', 90),
    (p_user_id, 'Extensions triceps poulie', 'Triceps', 60),
    (p_user_id, 'Squat barre', 'Quadriceps', 180),
    (p_user_id, 'Presse à cuisses', 'Quadriceps', 120),
    (p_user_id, 'Leg curl', 'Ischio-jambiers', 90),
    (p_user_id, 'Soulevé de terre', 'Dos', 180),
    (p_user_id, 'Hip thrust', 'Fessiers', 120),
    (p_user_id, 'Mollets debout', 'Mollets', 60),
    (p_user_id, 'Crunch', 'Abdos', 60),
    (p_user_id, 'Planche', 'Abdos', 60);
end;
$$ language plpgsql security definer;

-- Workouts
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  name text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.workouts enable row level security;

create policy "Users manage own workouts"
  on public.workouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Workout exercises
create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts on delete cascade,
  exercise_id uuid not null references public.exercises on delete restrict,
  order_index integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.workout_exercises enable row level security;

create policy "Users manage own workout exercises"
  on public.workout_exercises for all
  using (
    auth.uid() = (select user_id from public.workouts where id = workout_id)
  )
  with check (
    auth.uid() = (select user_id from public.workouts where id = workout_id)
  );

-- Sets
create table public.sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises on delete cascade,
  set_number integer not null,
  weight numeric not null default 0,
  reps integer not null default 0,
  completed_at timestamptz not null default now()
);

alter table public.sets enable row level security;

create policy "Users manage own sets"
  on public.sets for all
  using (
    auth.uid() = (
      select w.user_id from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id
    )
  )
  with check (
    auth.uid() = (
      select w.user_id from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id
    )
  );

-- Weight logs
create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  weight numeric not null,
  logged_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, logged_at)
);

alter table public.weight_logs enable row level security;

create policy "Users manage own weight logs"
  on public.weight_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Measurements
create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  type text not null,
  value numeric not null,
  unit text not null default 'cm',
  logged_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.measurements enable row level security;

create policy "Users manage own measurements"
  on public.measurements for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Progress photos
create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  storage_path text not null,
  logged_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.progress_photos enable row level security;

create policy "Users manage own photos"
  on public.progress_photos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Macro logs
create table public.macro_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  logged_at date not null default current_date,
  calories integer,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  created_at timestamptz not null default now(),
  unique (user_id, logged_at)
);

alter table public.macro_logs enable row level security;

create policy "Users manage own macro logs"
  on public.macro_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Indexes
create index idx_workouts_user_started on public.workouts(user_id, started_at desc);
create index idx_sets_workout_exercise on public.sets(workout_exercise_id);
create index idx_weight_logs_user_date on public.weight_logs(user_id, logged_at desc);
create index idx_measurements_user_type on public.measurements(user_id, type, logged_at desc);
create index idx_exercises_user on public.exercises(user_id);
create index idx_macro_logs_user_date on public.macro_logs(user_id, logged_at desc);

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict do nothing;

create policy "Users can upload own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'progress-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own photos"
  on storage.objects for select
  using (
    bucket_id = 'progress-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own photos"
  on storage.objects for delete
  using (
    bucket_id = 'progress-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
