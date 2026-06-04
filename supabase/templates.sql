-- Modèles de programme (templates)
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.templates enable row level security;
drop policy if exists "Users manage own templates" on public.templates;
create policy "Users manage own templates" on public.templates for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates on delete cascade,
  exercise_id uuid not null references public.exercises on delete cascade,
  order_index integer not null default 0,
  target_sets integer not null default 3
);
alter table public.template_exercises enable row level security;
drop policy if exists "Users manage own template exercises" on public.template_exercises;
create policy "Users manage own template exercises" on public.template_exercises for all
  using (auth.uid() = (select user_id from public.templates where id = template_id))
  with check (auth.uid() = (select user_id from public.templates where id = template_id));

create index if not exists idx_templates_user on public.templates(user_id, created_at desc);
create index if not exists idx_template_exercises_template on public.template_exercises(template_id, order_index);
