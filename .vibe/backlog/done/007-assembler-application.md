---
status: done
depends_on: [001,003,005]
---
# Assembler la page de capture en direct

## Description
Brancher l'accès MIDI, le décodage, l'état des notes et la partition dans la page principale, avec un indicateur de connexion.

## Acceptance Criteria
- [ ] Une touche enfoncée au piano apparaît sur la partition en moins d'une frame d'affichage
- [ ] Relâcher la touche met la partition à jour
- [ ] La page indique si un piano est connecté ou non
- [ ] En cas d'erreur d'accès MIDI, le message s'affiche à la place de la partition

## Notes
Priorité : MUST. Page principale : statut de connexion, partition en direct. Vérifier à l'exécution avec npm run dev.
