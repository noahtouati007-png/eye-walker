# Eye-Walker 👁️

**🔴 En ligne : [eye-walker.vercel.app](https://eye-walker.vercel.app)** — déploiement automatique à chaque push sur `main`.

Application d'entraînement Hyrox **Solo Pro** — programme structuré 7 séances/semaine, XP, niveaux, badges, timer intégré et surcharge progressive. 100 % client-side (localStorage), prête à déployer sur Vercel.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS v3** (3.4.17) — thème sombre uniquement
- **Framer Motion 11** — animations
- **Recharts** — statistiques (chargé en `ssr: false`)
- **sonner** — toasts
- **canvas-confetti** — confettis de fin de séance
- **date-fns** — semaines ISO (lundi)
- **geist** + **Orbitron** (`next/font/google`) — typographies

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvre http://localhost:3000

## Build de production

```bash
npm run build
npm run start
```

## Déploiement Vercel

Aucune configuration requise. Importe le repo dans Vercel → il détecte Next.js et build avec `next build`. Pas de variables d'environnement, pas de backend.

## Persistance

Toutes les données vivent dans le `localStorage` du navigateur :

| Clé            | Contenu                                   |
| -------------- | ----------------------------------------- |
| `ew_user`      | Profil athlète (VMA, FCmax, XP, niveau…)  |
| `ew_logs`      | Journaux de séances par semaine ISO       |
| `ew_badges`    | État des badges                           |
| `ew_sessions`  | Séances personnalisées                    |
| `ew_pbs`       | Records personnels                        |
| `ew_meta`      | Challenge en cours + compteurs            |
| `ew_onboarded` | Onboarding terminé                        |
| `ew_difficulties` | Difficulté choisie par type de séance  |

## Notes d'implémentation

- La spec initiale mentionnait `next.config.ts` et Geist via `next/font/google` : incompatibles avec Next 14, remplacés par `next.config.mjs` et le package officiel `geist` (résultat identique).
- Le nom affiché dans l'en-tête est **EYE-WALKER** (cohérent avec toute la spec).
