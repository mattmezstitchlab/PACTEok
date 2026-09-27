# PACTE

Le contrat et le jour J, ensemble. Un PACTE signé par les deux parties devient
automatiquement une entrée de Timeline.

Stack : Vite + React 19 + TypeScript, Supabase (auth + base), fonctions
serverless Vercel dans `api/`.

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # puis renseignez vos valeurs
npm run dev
```

| Script          | Effet                                      |
| --------------- | ------------------------------------------ |
| `npm run dev`   | Serveur de développement Vite              |
| `npm run build` | `tsc -b` puis build de production → `dist` |
| `npm run preview` | Prévisualise le build de production      |
| `npm run lint`  | ESLint                                     |

## Déploiement Vercel

Le projet doit être déployé **depuis la racine du dépôt**.

Dans Vercel → Settings → Build and Deployment :

| Réglage           | Valeur          |
| ----------------- | --------------- |
| Root Directory    | `./` (vide)     |
| Framework Preset  | Vite            |
| Build Command     | `npm run build` |
| Output Directory  | `dist`          |

Le reste est déjà décrit dans `vercel.json` : preset, rewrites SPA et variables
publiques de build.

### Variables d'environnement

Les variables `VITE_*` sont **inlinées dans le bundle au moment du build**. Elles
doivent donc être disponibles pendant le build, pas seulement à l'exécution —
c'est pour cela qu'elles sont dans `build.env` et non dans `env` de
`vercel.json` (`env` ne s'applique qu'aux fonctions serverless).

Une seule variable est à déclarer manuellement, car elle est secrète :

| Variable                    | Où                                               |
| --------------------------- | ------------------------------------------------ |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel → Settings → Environment Variables         |

Cette clé contourne les Row Level Security de Supabase : elle ne doit **jamais**
être commitée. Ajoutez-la pour les environnements Production, Preview et
Development, puis redéployez.

### Routage SPA

L'application utilise `BrowserRouter`. Sans règle de rewrite, un accès direct à
`/espace` ou `/pacte/<id>` renvoie une 404 Vercel. La règle présente dans
`vercel.json` sert `index.html` pour tout ce qui n'est pas `/api/*` :

```json
{ "source": "/((?!api/).*)", "destination": "/index.html" }
```

## Structure

```
api/          Fonctions serverless Vercel (Node, ESM)
src/          Application React
  lib/        Clients Supabase et Google OAuth
docs/         Scénario de recette
```

## Avertissement

PACTE est un outil de structuration et de suivi des engagements. Les signatures
sont des validations applicatives horodatées, pas des signatures électroniques
qualifiées.
