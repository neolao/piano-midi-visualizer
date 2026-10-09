# UI inventory — piano-midi-visualizer

> Written by `/ux:discover`, refreshed by `/ux:implement`. Describes the UI as it *is*, not as it should be.

## UI stack

- **Framework / UI layer:** TypeScript + DOM natif (Vite), sans framework ; VexFlow 5 pour la partition
- **Component library / design system:** aucun
- **Styling approach:** CSS global (`src/styles/base.css`) construit sur des variables CSS (`src/styles/tokens.css`)
- **UI state management:** contrôleur dédié (`createMidiController`) qui notifie le panneau
- **Routing / navigation:** aucune, un seul écran
- **i18n:** aucune bibliothèque ; toutes les chaînes françaises sont dans `src/strings.ts`
- **UI testing:** Vitest + jsdom (`src/midi-panel.test.ts`, `src/app.test.ts`) ; rendu VexFlow vérifié en navigateur

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
| Jouer et voir sa partition | `/` | `src/app.ts`, `src/midi-panel.ts`, `src/score.ts` | voir en direct ce qu'on joue ; figer, effacer, régler | `captures/001-jouer-voir-partition/after-*.png` |
| Accès refusé | `/` après refus | `src/midi-panel.ts` | expliquer comment autoriser | `captures/baseline/acces-refuse.png` |
| Échec / Réessayer | `/` après échec | `src/midi-panel.ts` | permettre de réessayer | `captures/baseline/erreur-reessayer.png` |
| Navigateur incompatible | `/` sans Web MIDI | `src/midi-panel.ts` | informer | `captures/baseline/navigateur-incompatible.png` |
| Liste des pianos / aucun piano | `/` après accès accordé | `src/midi-panel.ts` | lister les entrées | non capturée (pas de MIDI en environnement de test) |

## Reusable components

| Component | Source | Used for | States / variants supported |
|---|---|---|---|
| Barre MIDI | `src/midi-panel.ts` | piano connecté ou non | aucun piano, connecté, débranché |
| Scène d'accès MIDI | `src/midi-panel.ts` | bouton, messages et bandeau d'état | idle, requesting, unsupported (+ HTTPS), denied, error, aide « aucun piano », bandeau « débranché » |
| Partition | `src/score.ts` | deux portées VexFlow, accord en cours + historique de 8 | vide, accord en cours, historique, noms de notes, dièses ou bémols |
| Barre de commandes | `src/app.ts` | Figer, Effacer annulable, Options | désactivé hors état prêt, figé |
| Tiroir d'options | `src/app.ts` | noms de notes, bémols, annonce, raccourcis | activé / désactivé par réglage |
| Notification (toast) | `src/app.ts` | confirmation avec action « Annuler » | pause au survol et au focus, 10 s |
| Zone d'annonce | `src/app.ts` | annonces vocales polies | changements d'état, dernier accord après 2 s de silence |

## Interaction patterns in use

- Action explicite avant toute demande d'autorisation (bouton « Activer le MIDI »).
- Mise à jour à chaud de la liste, annoncée aux lecteurs d'écran.
- Textes via `textContent` uniquement.

## Known gaps

- Enregistrement et export .mid, clavier visuel, choix de piano (« Changer ») non réalisés (items 012, 011, 009).
- Le nom d'accord (« Do majeur ») n'est pas calculé.
- Pas de bascule entre la partition et une liste visible de l'historique.
- Le bandeau « Piano débranché » décale la partition de quelques pixels à son apparition.
- Sous 1000 px de large la partition défile horizontalement dans sa région (échelle 1:1 conservée).
- Les réglages ne sont pas mémorisés quand `localStorage` est bloqué, sans le dire à l'utilisateur.
