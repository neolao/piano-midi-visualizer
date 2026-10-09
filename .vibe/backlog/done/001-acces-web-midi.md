---
status: done
---
# Accéder à la Web MIDI API

## Description
Demander l'accès MIDI au navigateur et lister les entrées disponibles. Sans cet accès, la page ne peut pas capter le piano.

## Acceptance Criteria
- [ ] L'utilisateur voit les entrées MIDI branchées une fois l'accès accordé
- [ ] Le système affiche un message clair si le navigateur ne gère pas Web MIDI
- [ ] Le système affiche un message clair si l'utilisateur refuse la permission
- [ ] Une entrée branchée ou débranchée à chaud met la liste à jour

## Notes
Priorité : MUST. Isoler la Web MIDI API derrière une interface injectable pour tester sans matériel. Web MIDI est absent de Firefox et Safari.
