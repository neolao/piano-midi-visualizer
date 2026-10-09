---
status: todo
depends_on: [002]
---
# Suivre les notes actuellement tenues

## Description
Maintenir l'ensemble des notes enfoncées à un instant donné à partir des événements décodés.

## Acceptance Criteria
- [ ] Une note jouée est ajoutée à l'ensemble des notes tenues
- [ ] Une note relâchée est retirée de l'ensemble
- [ ] Relâcher une note qui n'est pas tenue ne change rien
- [ ] Jouer deux fois la même note sans la relâcher ne la duplique pas
- [ ] L'ensemble est renvoyé trié par hauteur

## Notes
Priorité : MUST. État pur et immuable ou encapsulé, sans dépendance au DOM.
