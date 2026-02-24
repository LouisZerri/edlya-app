# Architecture — Edlya App

## Stack

| Couche | Techno | Version |
|--------|--------|---------|
| Framework | React Native + Expo | SDK 54, RN 0.81 |
| Navigation | Expo Router | 6 |
| UI | NativeWind (Tailwind CSS) | 4 |
| API | Apollo Client (GraphQL) | 4 |
| State global | Zustand | 5 |
| Formulaires | React Hook Form + Zod | 7 / 4 |
| Langue | TypeScript strict | 5.9 |

## Arborescence

```
app/                  # Ecrans (file-based routing Expo Router)
  (auth)/             # Login, register, forgot/reset password
  (tabs)/             # Bottom tabs : accueil, logements, edl, settings
  edl/                # CRUD EDL : create, [id]/{index,edit,signature,comparatif,estimations}
  logement/           # CRUD logement : create, [id]
  import.tsx          # Import PDF avec preview editable
  onboarding.tsx      # Onboarding premiere connexion

components/           # Composants visuels reutilisables
  ui/                 # Primitives : Button, Input, Select, Card, Badge, Header...
  edl/                # Composants metier EDL : tabs, cards, modals, import preview
  home/               # Dashboard : WelcomeCard, QuickActions, RecentEdlList
  photo/              # PhotoGallery, PhotoViewer, PhotoThumbnail, PhotoCaptionEditor

hooks/                # Logique metier (custom hooks)
stores/               # State global Zustand (auth, theme, network, photos, toast, favoris)
contexts/             # React Contexts (EdlEditContext)
graphql/              # Client Apollo, queries, mutations
types/                # Types TypeScript (index.ts + graphql.ts)
utils/                # Fonctions utilitaires pures
```

## Conventions

### Nommage

| Element | Convention | Exemple |
|---------|-----------|---------|
| Composant | PascalCase | `ElementCard.tsx` |
| Hook | camelCase, prefixe `use` | `useEdlAutoSave.ts` |
| Store | camelCase, suffixe `Store` | `authStore.ts` |
| Utilitaire | camelCase | `format.ts` |
| Type/Interface | PascalCase | `ElementNode` |
| Enum-like | UPPER_SNAKE_CASE | `ELEMENT_TYPE_LABELS` |

### Ou mettre quoi

| Je veux... | Je mets dans... |
|-----------|-----------------|
| Un nouvel ecran | `app/` (file-based routing) |
| Un composant UI generique | `components/ui/` + export dans `components/ui/index.ts` |
| Un composant metier EDL | `components/edl/` + export dans `components/edl/index.ts` |
| Un composant photo | `components/photo/` + export dans `components/photo/index.ts` |
| De la logique metier reutilisable | `hooks/` + export dans `hooks/index.ts` |
| Du state global partagé | `stores/` (Zustand) |
| Du state local a un ecran | `useState` / `useReducer` dans l'ecran |
| Du state partage entre composants freres | `contexts/` (React Context) |
| Une query/mutation GraphQL | `graphql/queries/` ou `graphql/mutations/` |
| Un type TypeScript | `types/index.ts` (types metier) ou `types/graphql.ts` (types API) |
| Une fonction utilitaire pure | `utils/` |

### Barrel exports

Chaque dossier de composants a un `index.ts` qui re-exporte tout :
```ts
// components/ui/index.ts
export { Button } from './Button';
export { Input } from './Input';
// ...
```

Import depuis le barrel, jamais depuis le fichier direct :
```ts
// Bon
import { Button, Input } from '../components/ui';

// Mauvais
import { Button } from '../components/ui/Button';
```

### Path aliases

`@/` pointe vers la racine du projet (configure dans `tsconfig.json`).
Non migre sur les imports existants, mais utilisable pour les nouveaux fichiers.

## Patterns cles

### EdlEditContext (elimination du prop drilling)

L'ecran `edit.tsx` centralise tout l'etat EDL et le distribue via `EdlEditProvider`.
Les composants enfants (`EdlPiecesTab`, `ElementCard`, etc.) consomment via `useEdlEditContext()`.

```
edit.tsx
  └─ EdlEditProvider (value = state + mutations + ai)
       ├─ EdlInfosTab       → useEdlEditContext()
       ├─ EdlCompteursTab   → useEdlEditContext()
       ├─ EdlClesTab        → useEdlEditContext()
       └─ EdlPiecesTab      → useEdlEditContext()
            └─ ElementCard   → useEdlEditContext()
```

### Hooks d'edition EDL

L'ecran `edit.tsx` compose 4 hooks specialises :

| Hook | Responsabilite |
|------|---------------|
| `useEdlInitializer` | Initialise le state local depuis les donnees GraphQL |
| `useEdlAutoSave` | Debounce 3s, sauvegarde auto, indicateur Cloud/CloudOff |
| `useEdlMutations` | CRUD pieces, elements, compteurs, cles (+ sauvegarde finale) |
| `useEdlAiAnalysis` | Analyse photo IA, scan piece, application resultats |

### Stabilite des callbacks (useRef pattern)

Pour eviter que les callbacks changent a chaque render (et invalident le Context) :

```ts
const dataRef = useRef({ formData, localPieces, ... });
dataRef.current = { formData, localPieces, ... };

const handleSave = useCallback(async () => {
  const { formData, localPieces } = dataRef.current;
  // ...
}, [/* deps stables uniquement */]);
```

Utilise dans `useEdlMutations` et `useEdlAiAnalysis`.

### Lazy loading PagerView

Les 4 onglets EDL sont dans un `PagerView`. Seul l'onglet actif est monte au premier affichage.
Les autres se montent au premier swipe/tap et restent montes ensuite (`visitedTabs` Set).

### Auto-save

- Debounce 3s apres chaque modification
- Indicateur visuel : Cloud (sauve) / CloudOff (non sauve)
- Alerte a la sortie si modifications en attente

### Offline

- `offlineMutationQueue.ts` : file d'attente persistante (AsyncStorage)
- `offlineSyncManager.ts` : rejoue les mutations au retour du reseau
- `networkStore.ts` : detecte l'etat reseau via NetInfo
- `OfflineBanner` : banniere visuelle quand hors ligne

## Scripts

```bash
npm start          # Demarrer Expo dev server
npm run android    # Lancer sur Android
npm run ios        # Lancer sur iOS
npm run typecheck  # Verification TypeScript (tsc --noEmit)
npm run lint       # ESLint (0 erreurs, 0 warnings attendus)
```

## ESLint

Config flat (ESLint 9) dans `eslint.config.js`. Regles actives :
- `@typescript-eslint/no-unused-vars` (warn, ignore prefixe `_`)
- `import/order` (warn, groupes ordonnes)
- `import/no-duplicates` (warn)
