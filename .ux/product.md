# Product — piano-midi-visualizer

> Written by `/ux:discover`. Edit freely — re-run `/ux:discover` to refresh.
> Add `<!-- keep -->` on a section heading to preserve it on refresh.

## What it is

Page web statique, hébergée sur GitHub Pages, qui capte en direct les notes MIDI d'un piano branché à l'ordinateur et les affiche sur une partition. Elle s'adresse aux pianistes amateurs qui s'entraînent.

## Platform & surface

- **Platform:** web (site statique, navigateurs avec Web MIDI : Chrome, Edge, Opera)
- **Devices & input:** ordinateur portable ou tablette posé sur le piano, lu à environ 1 m ; mains sur le clavier du piano, peu d'interactions souris/tactile pendant le jeu
- **Runs with:** `npm run dev` (http://localhost:5173)

## Users

| Role | Expertise | Frequency of use | Context of use | Main goal |
|---|---|---|---|---|
| Pianiste amateur | occasionnel, pas forcément à l'aise en solfège | hebdomadaire | chez soi, écran sur le piano, mains occupées | voir en direct ce qu'il joue sur une partition |

## Jobs to be done

1. Quand je m'entraîne au piano, je veux voir en direct sur une partition ce que je joue, afin de vérifier mes notes.
2. Quand je branche mon piano, je veux savoir tout de suite s'il est détecté, afin de ne pas perdre de temps.
3. Quand je viens de jouer un passage, je veux le revoir quelques instants, afin de le relire.

## Constraints

- **Brand / design system:** aucun (à définir avec `/ux:style`)
- **Accessibility target:** WCAG 2.2 AA
- **Localization:** français seul ; notes nommées en Do, Ré, Mi…
- **Performance / offline / other:** affichage sans à-coups pendant le jeu ; pas de mode hors ligne ; réglages (périphérique, noms de notes, dièses/bémols) mémorisés localement dans le navigateur

## Vocabulary

- **Piano détecté :** entrée MIDI connectée que la page peut écouter.
- **Activer le MIDI :** action volontaire qui déclenche la demande d'autorisation du navigateur.
- **Note MIDI :** hauteur jouée, numéro de 0 à 127 (60 = do central).
- **Partition :** deux portées (sol et fa), notes et accords sans rythme.
- **Historique :** notes déjà jouées qui défilent sur la partition.
