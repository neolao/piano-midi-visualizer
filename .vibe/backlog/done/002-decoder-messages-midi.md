---
status: todo
---
# Décoder les messages MIDI de notes

## Description
Transformer les octets MIDI bruts en événements « note jouée » et « note relâchée ». Une note on de vélocité 0 vaut une note off.

## Acceptance Criteria
- [ ] Un note on [0x90, 60, 100] produit un événement « jouée » pour la note 60
- [ ] Un note off [0x80, 60, 0] produit un événement « relâchée »
- [ ] Un note on de vélocité 0 produit un événement « relâchée »
- [ ] Les messages hors notes (contrôleurs, horloge) et les messages invalides sont ignorés sans erreur
- [ ] Les canaux 1 à 16 sont tous reconnus

## Notes
Priorité : MUST. Fonction pure dans src/midi.ts, ignorer les autres types de messages.
