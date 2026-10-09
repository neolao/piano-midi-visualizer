---
status: todo
---
# Placer une note sur la portée

## Description
Convertir un numéro de note MIDI en position sur la portée : clé de sol ou de fa, altération, hauteur VexFlow.

## Acceptance Criteria
- [ ] Les notes de 60 et plus vont en clé de sol, celles en dessous en clé de fa
- [ ] 60 donne c/4 et 61 donne c#/4 avec altération
- [ ] Les bornes 21 (La0) et 108 (Do8) sont placées sans erreur
- [ ] Un numéro hors 0-127 lève une erreur

## Notes
Priorité : MUST. Partage à définir (do central 60 en clé de sol). Utilise les dièses par défaut, voir l'item de choix dièses/bémols.
