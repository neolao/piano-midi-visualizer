---
status: done
depends_on: [005]
---
# Faire défiler l'historique des notes jouées

## Description
Après relâchement, les notes ou accords jouées se décalent vers la gauche sur la partition au lieu de disparaître, pour suivre ce qui vient d'être joué.

## Acceptance Criteria
- [ ] Un accord relâché reste affiché et se place dans l'historique
- [ ] Les éléments les plus anciens sortent à gauche quand la limite est atteinte
- [ ] L'ordre d'affichage correspond à l'ordre de jeu
- [ ] L'historique ne dépasse jamais la taille maximale définie

## Notes
Priorité : MUST. Sans rythme. Borner l'historique (nombre maximal d'éléments) pour ne pas gonfler la mémoire.
