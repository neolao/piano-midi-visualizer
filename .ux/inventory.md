# UI inventory — piano-midi-visualizer

> Written by `/ux:discover`, refreshed by `/ux:implement`. Describes the UI as it *is*, not as it should be.

## UI stack

- **Framework / UI layer:** TypeScript + DOM natif (Vite), sans framework ; VexFlow prévu pour la partition
- **Component library / design system:** aucun
- **Styling approach:** aucun CSS, rendu par défaut du navigateur
- **UI state management:** contrôleur dédié (`createMidiController`) qui notifie le panneau
- **Routing / navigation:** aucune, un seul écran
- **i18n:** chaînes françaises codées en dur dans `src/midi-panel.ts`
- **UI testing:** Vitest + jsdom (`src/midi-panel.test.ts`)

## Design tokens

| Token family | Source file | Values / scale |
|---|---|---|
| Colors | — | aucun (défauts du navigateur) |
| Typography | — | aucun (serif par défaut) |
| Spacing | — | aucun |
| Radii / borders | — | aucun |
| Breakpoints | — | aucun |
| Motion | — | aucun |
| Theming (dark mode…) | — | aucun |

## Screens / views

| Screen | Entry point (route / menu / panel) | Source | Purpose | Capture |
|---|---|---|---|---|
| Accueil — Activer le MIDI | `/` | `src/main.ts`, `src/midi-panel.ts` | proposer l'activation du MIDI | `captures/baseline/accueil-activer-midi.png` |
| Accès refusé | `/` après refus | `src/midi-panel.ts` | expliquer comment autoriser | `captures/baseline/acces-refuse.png` |
| Échec / Réessayer | `/` après échec | `src/midi-panel.ts` | permettre de réessayer | `captures/baseline/erreur-reessayer.png` |
| Navigateur incompatible | `/` sans Web MIDI | `src/midi-panel.ts` | informer | `captures/baseline/navigateur-incompatible.png` |
| Liste des pianos / aucun piano | `/` après accès accordé | `src/midi-panel.ts` | lister les entrées | non capturée (pas de MIDI en environnement de test) |

## Reusable components

| Component | Source | Used for | States / variants supported |
|---|---|---|---|
| Panneau MIDI | `src/midi-panel.ts` | état de l'accès MIDI et liste des pianos | idle, requesting, unsupported (+ HTTPS), denied, error, ready (vide ou liste) |
| Zone d'annonce | `src/midi-panel.ts` | annoncer connexion/déconnexion | `role="status"`, `aria-live="polite"` |

## Interaction patterns in use

- Action explicite avant toute demande d'autorisation (bouton « Activer le MIDI »).
- Mise à jour à chaud de la liste, annoncée aux lecteurs d'écran.
- Textes via `textContent` uniquement.

## Known gaps

- Aucun style : aucune hiérarchie visuelle, aucune zone de partition, aucune mise en page.
- Pas de tokens ni de système de thème ; pas de styles de focus propres.
- Partition, historique, clavier visuel, sélecteur de périphérique non réalisés.
- Chaînes codées en dur (acceptable en français seul).
- Pas de favicon (404 au chargement).
- No design tokens yet — `style.md` is the reference until `/ux:implement` creates them.
- Liste des pianos non capturée.
