# PeakLog — Changelog

Format : [date] — description

---

## 2026-06-06

### Fix sparkline poids dashboard — ligne plate
- Bug : `AreaChart` sans `YAxis` explicite → Recharts utilisait baseline Y=0 → poids 76-80 sur échelle 0-80 = courbe quasi-plate. Ajout d'un `YAxis` caché avec domaine zoomé sur la plage réelle (`[min-pad, max+pad]`). Dots visibles + `isAnimationActive={false}` pour un sparkline plus lisible. Dashboard fournit 14 dernières entrées (au lieu de 7)

### Corps / Poids — range selector + dates avec année
- **Sélecteur de période** sur l'onglet Poids : `7J / 1M / 1A / Tout`. Le graphe, les stats (moy / min / max) et la liste sont filtrés sur la période choisie (labels stats dynamiques : "Moy. 30j", "Min 1an", etc.)
- **Liste historique** : reflète le range, badge "X entrées", troncature à 100 lignes max avec compteur des plus anciennes
- **`formatDateShort` affiche l'année** quand la date n'est pas dans l'année courante (format `12 mai 23`). Évite que les vieux logs paraissent "récents". Impact toutes les vues qui affichent des dates courtes (progression, historique, body, macros, dashboard PRs)
- `useWeightLogs` : limite remontée à 2000 (anciennement 30) pour permettre la vue "Tout"

### Groupe musculaire "Adducteurs"
- Ajout du groupe `Adducteurs` (manquait). Hip Adduction (machine) était assigné à `Fessiers` au lieu des adducteurs intérieurs cuisses. Polygone du body map (front, haut intérieur cuisse, mal nommé `ABDUCTORS` dans react-body-highlighter) re-mappé sur `Adducteurs`. SQL one-shot (`Strong/fix-muscle-groups.sql`) pour rebrancher l'exo en DB

### Body map anatomique (dashboard)
- **`MuscleHeatmap` refait** : remplace les rectangles/ellipses approximatifs par une vraie silhouette anatomique (polygones par muscle, face + dos). Données SVG issues de `react-body-highlighter` (MIT, polygones eux-mêmes hérités de `react-native-body-highlighter`), mappées sur les groupes musculaires PeakLog (`Pecs/Dos/Épaules/...`) et exposées via `lib/muscleBodyData.ts`. Coloration inchangée (`muscleHeatColor`/`HEAT_SCALE`), tooltip par muscle, label "Face"/"Dos" sous chaque silhouette

### Fix pré-remplissage séance — "dernière perf" = la plus ancienne
- `getLastSession` triait sur `workout_exercises.created_at` au lieu de `workouts.started_at`. Sur des données importées (Strong), tous les `created_at` valent `now()` → égalité → Postgres renvoyait la 1re ligne insérée (= la séance la **plus ancienne**). Réécrit en partant de `workouts` (top-level) + embed inner `workout_exercises`/`sets`, tri `started_at` desc (même modèle que le fix progression). Le pré-remplissage reprend désormais la **vraie dernière séance**

---

## 2026-06-05

### Itération 4 — métrique progression = indice (pas 1RM)
- Le 1RM faisait redescendre la courbe quand le poids montait mais les reps baissaient (13×5 < 12×9), ce qui n'est pas voulu. Remplacé par **indice = poids + reps×0.1** : le poids prime (toute hausse de poids fait monter la courbe), les reps ajoutent un bonus à poids égal. Tooltip = poids×reps réel, tableau colonne "Indice", PR/% sur l'indice

### Itération 3 — progression centrée surcharge progressive
- **Fix requête progression** : `useProgress` ordonnait sur une colonne imbriquée (`order('workout.started_at')`) → PostgREST renvoyait null → graphe toujours vide. Réécrit avec filtres/tri top-level `workouts` + embed inner (modèle dashboard)
- **Métrique courbe = 1RM estimé de la 1re série** : on ne regarde que la 1re série (le nb de séries varie). 1RM Epley capte poids + reps → même poids avec plus de reps fait monter la courbe. Tableau : Date / Poids (S1) / Reps / 1RM. PR + % basés sur le 1RM

### Itération 2 — corrections & ajouts
- **Fix bouton "Terminer" séance** : vert `success` incohérent → bouton primary lime (style unifié)
- **Séries par muscle (au lieu du volume kg)** : section "Cette semaine" du dashboard affiche désormais le **nombre de séries/muscle** via barres HTML (`MuscleSetsBars`) + body map, plus de barchart kg. Recharts retiré de cette section
- **Body map — couleurs différenciées** : échelle partagée `lib/muscleHeat.ts` (gris→bleu→vert→lime→ambre→rouge selon séries/sem), légende chiffrée, réutilisée par la map et les barres
- **Fix police des graphes** : `fontFamily:'DM Mono'`/'Outfit' littéral (ne matchait pas next/font) → wrapper `font-mono` (héritage CSS SVG) + `var(--font-*)` pour les tooltips/labels HTML. Charts progression, poids, macros, sparkline, tooltips
- **Fix progression "pas assez de données"** : points groupés par **séance** (et non par jour) → plusieurs séances le même jour ne s'effondrent plus. Ajout **% progression** (▲▼) et colonne **1RM estimé** au tableau
- **Récap post-séance** : modale après "Terminer" → durée, exercices, séries, volume, **séries battues vs dernière fois**, Δ volume, confetti
- **Streak** : carte stat dashboard (jours consécutifs, 🔥)
- **Calculateur de disques** : modale en séance (charge totale + barre → disques par côté, codés couleur)
- **Heatmap calendrier** (Historique) : grille type GitHub 18 sem (`ActivityCalendar`), intensité selon séances/jour
- **Filtre muscle en Progression** : chips de groupes musculaires (manquait vs brief)

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
