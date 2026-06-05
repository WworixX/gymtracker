# PeakLog — Project Brief

## Objectif
App de suivi fitness personnelle, mobile-first PWA. Utilisée principalement sur téléphone (installée via Chrome/Safari comme app native). Dark theme premium, zéro friction entre l'utilisateur et ses données d'entraînement.

## Stack technique
- **Next.js 14** App Router, TypeScript
- **Supabase** — Auth (email/password + anonymous) + PostgreSQL + RLS
- **Zustand** — état séance active, persisté localStorage
- **Tailwind CSS v3** + variables CSS custom
- **Framer Motion** — animations, page transitions, drag-and-drop
- **Recharts** — graphiques progression + poids
- **React Hook Form + Zod** — validation formulaires
- **next/font** — Outfit (UI) + DM Mono (chiffres)
- **sharp** — génération icônes PWA

## URLs
- **Prod** : https://gymtracker-lovat.vercel.app
- **Repo** : https://github.com/WworixX/gymtracker
- **Supabase project** : PeakLog (eu-central-1)

## Design system
- **Fond** : `#0c0c0f` + glows radiaux ambiants lime + bleu
- **Accent** : `#c8f542` (lime électrique)
- **Cartes** : glassmorphism (backdrop-blur 24px, gradient 145deg, highlight edge top)
- **Typo** : Outfit pour labels/UI, DM Mono pour TOUS les chiffres (poids, reps, timer, etc.)
- **Contraste** : text-muted `#6f6f80`, text-secondary `#9a9aa8` (WCAG AA)
- **Animations** : Framer Motion, ease `[0.16,1,0.3,1]`, stagger cards, spring buttons

## Navigation (mobile bottom nav / desktop sidebar)
5 onglets : **Accueil · Historique · Prog. · Corps · Profil**

Le bouton "Démarrer une séance" est sur l'Accueil, PAS dans la nav.

---

## Fonctionnalités

### Accueil (Dashboard)
- Greeting avec avatar initiales
- Bouton principal **"Démarrer une séance"** (accent glow, h-14)
- Grille stats 2×2 : Poids actuel, Séances totales, Dernier volume, PRs récents
- Compteurs animés via Framer Motion useSpring
- **Poids du jour** — saisie rapide + sparkline 7j
- **Mes programmes** — liste des templates avec bouton Lancer
- **Dernière séance** — nom, date, exercices
- **PRs Force** — records des exos en mode force, avec 1RM estimé Epley
- **Cette semaine** — body map SVG (face + dos), muscles teintés selon le nb de séries de la semaine ISO (`MuscleHeatmap`)
- **Volume par muscle** (semaine ISO lundi→dim) — barchart horizontal

### Séance active `/workout/[id]`
- Header sticky : bouton annuler | nom séance + chrono live (DM Mono, glow lime) | bouton Terminer (rouge)
- Header avec safe-area iOS
- Exercices réordonnables par drag (GripVertical handle, Framer Reorder)
- **WorkoutExerciseCard** :
  - Badge muscle group (pill lime)
  - Temps de repos éditable inline (tap → input → Enter)
  - Sets rows : numéro | input poids (kg) | × | input reps | 🗑 supprimer | ✓ valider
  - 3 états visuels : vide (dashed border), en cours (accent border), validé (fond lime ghost + check animé)
  - Badge PR animé `🏆 PR` avec scale bounce + confetti — **uniquement pour les exos en mode force** (record absolu pertinent)
  - **Feedback surcharge progressive** : à la validation, flèche ↑/=/↓ + flash + son selon le 1RM estimé vs la même série de la dernière séance (`getSetTrend`)
  - **Note épinglée** (📌) par exercice : réglages machine / mémo persistant (`coach_note`), distincte des notes de séance
  - Bouton `+ Ajouter une série`
  - Notes collapsibles (maxLength 500)
- **RestTimer** : pilule flottante bas d'écran, barre progression colorée (vert→orange→rouge), chiffre glow, pulse animation, vibration navigator à 0s
- **Pré-remplissage automatique** : quand on re-ajoute un exo, toutes les séries de la dernière séance sont recréées avec leurs vraies valeurs (pas juste la meilleure)
- ExercisePicker modal pour ajouter exercice + création inline
- Cancel/Finish modals avec confirmation

### Historique
- Liste séances paginées (20/page)
- Carte expandable : durée, sets, volume, exercices + séries détaillées
- **Export CSV** : toutes séances → Date/Séance/Exercice/Groupe/Série/Poids/Reps/Volume (BOM UTF-8, séparateur `;`)

### Progression
- Sélection exercice (recherche + filtre muscle)
- Bouton "+ Nouveau exercice" inline
- Graphe area chart (Recharts) : max poids par séance, range 1M/3M/6M/Tout
- Ligne PR (referenceLine dashed)
- Tableau historique séances
- Dot activeDot avec outer glow lime

### Corps
- 4 onglets : Poids | Mensurations | Photos | Macros
- **Poids** : saisie + historique + area chart gradient lime + **trajectoire objectif** (rythme requis vs actuel par régression, projection, statut, ligne objectif sur le graphe)
- **Mensurations** : log body measurements
- **Photos** : grid photos progression (Supabase Storage)
- **Macros** : calories/protéines/glucides/lipides par jour + barchart

### Profil (Settings)
- Édition pseudo, poids actuel, objectif poids + **date objectif**, unité kg/lbs
- **Préférences** : toggle sons de surcharge progressive
- Gestion exercices (CRUD complet) — avec **type d'entraînement** (force/hypertrophie) + **note épinglée**
- Déconnexion

### Auth
- Email/password + "Continuer sans compte" (anonymous sign-in)
- Password strength meter (4 segments colorés, labels)
- Min 8 caractères

### Programmes (Templates)
- Créer programme : nom + liste exercices
- Lancer programme → séance pré-remplie avec exercices du template + dernière perf de chacun
- Supprimer programme
- DB tables : `templates` + `template_exercises`

---

## Base de données (Supabase)

### Tables principales
- `profiles` — liées à auth.users, trigger auto-création. Colonnes : `goal_weight`, `goal_date`, `current_weight`, `weight_unit`
- `exercises` — par user (seedées au signup avec 20 exercices par défaut). Colonnes : `training_type` ('force'|'hypertrophy', défaut hypertrophy), `coach_note` (note épinglée)
- `workouts` — séances (started_at / ended_at)
- `workout_exercises` — liaison workout ↔ exercise (order_index)
- `sets` — séries (set_number, weight, reps)
- `weight_logs` — poids du corps par date (unique user+date)
- `measurements` — mensurations
- `progress_photos` — stockage Supabase bucket `progress-photos`
- `macro_logs` — macros par jour
- `templates` — programmes
- `template_exercises` — exercices dans un programme

Toutes tables ont **RLS activé** avec policies `auth.uid() = user_id`.

---

## PWA
- `public/manifest.json` : `display:standalone`, `start_url:/dashboard`, `theme_color:#0c0c0f`
- Icônes : `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (fond noir, cercle lime, "PL")
- `public/sw.js` : service worker offline (network-first navigation, cache-first assets)
- `viewportFit: cover` pour safe-area iOS

## Sécurité (headers Vercel/Next.js)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Strict-Transport-Security` (HSTS 2 ans)

## Toasts
Système global `ToastProvider` (top-center, glassmorphism, auto-dismiss 3.2s). Branché sur : poids sauvé, séance terminée, export CSV, créations/erreurs.

## Patterns importants
- `useWorkoutStore` (Zustand persist) = source de vérité pour séance active
- Montage zustand hydration → `mounted` state avant redirect workout
- Modals via `createPortal(document.body)` + flex centering (pas translate qui conflit Framer)
- `getLastSession` retourne `{ sets: [], best: {} }` (toutes séries, pas juste la meilleure)
- Charts en `next/dynamic` ssr:false (lazy-load Recharts)
- Zustand localStorage key = `gymtracker-workout` (intentionnellement pas renommé pour éviter perte de sessions en cours)
- **Surcharge progressive** : métrique = 1RM estimé Epley (`estimate1RM`), `getSetTrend` compare série n° vs `lastSets[n-1]`. Aucun jugement si pas de référence (1re fois / série en plus)
- **PR vs progression** : `🏆 PR` (record absolu) réservé aux exos `training_type === 'force'`. Les exos hypertrophie s'appuient sur le feedback de tendance + volume
- **Sons** : `lib/sound.ts` Web Audio synthétisé (pas de fichiers), toggle localStorage `peaklog-sound`. Joué au gesture de validation (l'AudioContext peut démarrer)
- **Semaine = ISO lundi→dimanche** (`startOfISOWeek`) pour les agrégats dashboard, pas du 7j glissant
- **Migration DB** : exécuter `supabase/migrations/2026-06-05_progressive-overload.sql` dans le SQL Editor (idempotent) pour ajouter `training_type`/`coach_note`/`goal_date` à la base existante

## Ce qui reste à faire (backlog)
- SWR ou React Query pour cache/dedup des fetches
- Types générés Supabase (`supabase gen types`) pour remplacer les casts `any`
- Récap post-séance (PRs battus, durée totale, volume)
- Heatmap calendrier séances (Historique) — vue type GitHub (distincte du body map muscles)
- Plates calculator (disques à mettre sur barre)
- Notifications push PWA (rappels, fin timer)
- Comparaison séances complète (récap global cette fois vs dernière) — feedback par-série déjà en place
