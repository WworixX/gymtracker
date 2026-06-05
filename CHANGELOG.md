# PeakLog — Changelog

Format : [date] — description

---

## 2026-06-05

### Fonctionnalités majeures (surcharge progressive & co)
- **Feedback surcharge progressive** : à la validation d'une série, comparaison au même n° de série de la dernière séance via **1RM estimé Epley**. 3 états → flèche ↑ verte + flash + son montant (mieux), `=` neutre (égal, silencieux), flèche ↓ ambre + son grave (moins bien). `getSetTrend` dans `utils`. `lastSets` (toutes les séries de la dernière séance) ajouté à `ActiveWorkoutExercise` pour la compare série-à-série
- **Sons synthétisés** `lib/sound.ts` : Web Audio API (zéro fichier), arpège/note + `navigator.vibrate`. Toggle on/off dans Profil (persisté localStorage `peaklog-sound`). Respecte `prefers-reduced-motion` pour les flashs
- **Mode Force / Hypertrophie par exercice** (`exercises.training_type`) : le badge `🏆 PR` + confetti ne se déclenchent QUE pour les exos **force** (record absolu pertinent). Les exos **hypertrophie** utilisent le feedback de progression vs dernière fois. Sélecteur `TrainingTypeField` réutilisable (séance picker, settings, progression). Dashboard "PRs Force" filtré sur les exos force. Compounds seedés en force
- **Notes épinglées par exercice** (`exercises.coach_note`) : note persistante (réglages machine, mémo), affichée en haut de la `WorkoutExerciseCard` (icône 📌), éditable inline + dans la modale settings. Distincte des notes de séance
- **Objectif poids + trajectoire** (`profiles.goal_date`) : carte dans Corps>Poids → restant, rythme requis vs rythme actuel (régression linéaire `linregSlopePerWeek`), projection à l'échéance, statut (en avance / sur la bonne voie / en retard), ETA si pas de date. Ligne `Objectif` (ReferenceLine) sur le graphe
- **Volume hebdo (lundi→dimanche) + body map** : agrégats passés de 7j glissants à la **semaine ISO** (`startOfISOWeek`). Nouveau composant `MuscleHeatmap` (silhouette SVG face + dos, chaque muscle teinté gris→lime→ambre selon le nb de séries de la semaine). `setsByMuscle` + `weeklySets` dans `useDashboard`

### Infra / Sécurité
- **Security headers** (next.config.js) : X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy, HSTS 2 ans — vérifiés en prod
- **next/font** : migration Google Fonts `@import` (render-blocking) → next/font auto-hébergé (Outfit + DM Mono), `display:swap`
- **Service worker** `public/sw.js` : PWA vraiment offline, network-first navigation, cache-first assets Next.js (prod only)
- **Error boundaries** : `app/error.tsx` + `app/global-error.tsx` fallback propre
- **maxLength inputs** : nom exercice 60, nom programme 60, notes séance 500 — anti-abus DB

### UX / Visuel
- **Système de toasts** `ToastProvider` : glassmorphism top-center, auto-dismiss 3.2s, types success/error/info. Branché sur poids sauvé, séance terminée, export CSV, créations
- **Contraste WCAG AA** : text-muted `#4a4a5a` → `#6f6f80`, text-secondary → `#9a9aa8`
- **Safe-area iOS** : header séance + toasts respectent l'encoche (`viewportFit:cover`)
- **Tap targets** : trash série 28px → 36px
- **Lazy-load charts** : Recharts en `next/dynamic` ssr:false (dashboard + progression)

### Fix
- **Modal centrage** : `createPortal(document.body)` + flex wrapper → Framer transform n'écrase plus le centrage
- **SetRow overlap** : suppression swipe-to-delete → boutons trash + valider explicites côte à côte

---

## 2026-06-04

### Fonctionnalités
- **Pré-remplissage séries** : `getLastSession` retourne toutes les séries de la dernière séance (triées par numéro) avec leurs vraies valeurs. `addExercise` crée N séries correspondantes — plus de "meilleure série unique"
- **Drag-and-drop exercices** : `Reorder.Group` + `Reorder.Item` Framer, handle GripVertical, persistance `order_index` en DB
- **Export CSV** : toutes séances → Date/Séance/Exercice/Groupe/Série/Poids/Reps/Volume. BOM UTF-8 + séparateur `;` (Excel FR)
- **Suppr "Dernière fois"** : ligne hint retirée des cartes exercice
- **Créer exercice depuis Progression** : bouton "+ Nouveau" + `CreateExerciseModal` réutilisable, auto-sélectionne l'exo créé

### Sécurité
- **Password strength meter** : 4 segments colorés + label (Très faible→Excellent) sur signup
- **Password min** : 6 → 8 caractères

---

## 2026-06-03

### PWA + Renommage
- **Renommage GymTracker → PeakLog** : manifest, metadata, navbar, sidebar, auth, package.json
- **Icônes PWA** générées via sharp : `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (fond `#0c0c0f`, cercle `#c8f542`, "PL")
- **manifest.json** : `display:standalone`, `start_url:/dashboard`, `scope:/`, `theme_color:#0c0c0f`, `viewportFit:cover`
- **next.config.js** : header `Content-Type: application/manifest+json`

### Fonctionnalités
- **Programmes (Templates)** : CRUD complet (créer/nommer/ajouter exercices/lancer/supprimer). Tables Supabase : `templates` + `template_exercises`. Lancer = séance pré-remplie avec exercices du template + dernière perf de chacun
- **Suppression "Répéter dernière séance"** (remplacé par templates)

---

## 2026-06-02

### Refonte visuelle premium (design brief)
- **Fond ambiant** : 3 glows radiaux multi-couches (lime top, bleu droite, lime bas-gauche), `background-attachment:fixed`
- **Glassmorphism cards** : `backdrop-filter:blur(24px)`, gradient 145deg, ombres multi-couches, highlight edge top (`::before` 1px gradient), hover `translateY(-3px)`
- **Bottom nav** : `blur(28px) saturate(180%)`, icône active avec `drop-shadow` lime, dot `layoutId` animé
- **Header séance** : `blur(32px)`, chrono centré DM Mono glow lime, bouton Terminer rouge contextuel
- **SetRow 3 états** : vide (dashed), focus accent, validé (lime ghost + check bounce + glow)
- **RestTimer** : pilule compacte flottante (jamais bottom sheet), pulse animation, glow chiffre, vibration `navigator.vibrate([200])` à 0s
- **Charts Recharts** : area gradient lime, grilles `rgba(255,255,255,0.04)`, tooltip glassmorphism partagé (`ChartTooltip`), axes DM Mono
- **Page transitions** : `PageTransition` composant (fade+slide, tous les écrans)
- **Badge PR animé** : `🏆 PR` scale bounce + flash fond vert + confetti lors d'un nouveau PR en séance
- **prefers-reduced-motion** respecté
- **1RM estimé Epley** affiché sous chaque PR du dashboard
- **AnimatedNumber** compteurs spring sur les stats cards

### Corrections
- Supabase schema exécuté (tables créées) → app fonctionnelle
- RestTimer vibration ajoutée
- WeightLog + MacrosLog charts migrés vers style premium

---

## 2026-06-01

### Fixes UX séance
- Bouton OK/Suppr série : superposition corrigée (layout compact, flex)
- Poids du jour live-reload : `useWeightLogs` comme source unique
- RestTimer temps personnalisable par exercice (inline, tap pour éditer)
- Grande modale "Valider la série" remplacée par bouton compact dans la ligne

---

## 2026-05-31 (session initiale)

### Mise en place complète
- **Auth** : email/password + anonymous sign-in, schema Zod, react-hook-form
- **Supabase schema** : 10 tables, RLS, trigger `on_auth_user_created`, fonction `seed_default_exercises` (20 exos par défaut), bucket `progress-photos`
- **Navigation** : 5 onglets (Accueil/Historique/Prog./Corps/Profil), bottom nav mobile + sidebar desktop
- **Dashboard** : stats, poids, PRs, volume par muscle (7j), sparkline poids
- **Séance active** : ExercisePicker, WorkoutExerciseCard, SetRow, confetti PR, RestTimer, chrono live, cancel/finish modals
- **Historique** : liste paginée, expand par séance, durée, volume
- **Progression** : sélection exercice, graphe area, range temps, tableau, PR line
- **Corps** : WeightLog, MeasurementsLog, PhotosGrid, MacrosLog
- **Profil/Settings** : CRUD exercices, préférences profil
- **Zustand store** : séance active persistée localStorage (hydration race condition fixée)
- **PWA** : manifest initial, meta tags
