-- Migration 2026-06-05 — Surcharge progressive, mode force/hypertrophie, objectif poids, notes coach
-- Idempotent : safe à ré-exécuter. À lancer dans Supabase SQL Editor sur la base existante.

-- Feature 4 — mode d'entraînement par exercice (force = PR pertinent, hypertrophie = volume)
alter table public.exercises
  add column if not exists training_type text not null default 'hypertrophy';

-- Contrainte CHECK (ajoutée séparément pour rester idempotent)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'exercises_training_type_check'
  ) then
    alter table public.exercises
      add constraint exercises_training_type_check
      check (training_type in ('force', 'hypertrophy'));
  end if;
end $$;

-- Feature 2 — note persistante par exercice (réglages machine, mémo prochaine fois)
alter table public.exercises
  add column if not exists coach_note text;

-- Feature 5 — date cible pour l'objectif de poids
alter table public.profiles
  add column if not exists goal_date date;

-- Optionnel : reclasser les gros compounds existants en mode force.
-- Décommenter pour appliquer à TES exercices déjà créés.
-- update public.exercises set training_type = 'force'
--   where name in (
--     'Développé couché', 'Développé incliné', 'Développé militaire',
--     'Squat barre', 'Soulevé de terre', 'Rowing barre', 'Tractions', 'Hip thrust'
--   );
