---
status: todo
depends_on: [003,004]
---
# Afficher les notes tenues sur deux portées

## Description
Dessiner avec VexFlow une grande portée (sol + fa) montrant les notes et accords actuellement tenus.

## Acceptance Criteria
- [ ] Une note tenue apparaît à la bonne hauteur sur la portée correspondante
- [ ] Plusieurs notes simultanées s'affichent comme un accord
- [ ] Les altérations (dièses) sont dessinées
- [ ] Quand plus aucune note n'est tenue, les portées vides restent visibles
- [ ] Un rendu répété ne multiplie pas les éléments SVG dans la page

## Notes
Priorité : MUST. Pas de rythme ni de quantification (notes rondes ou neutres). Re-dessiner sans fuite DOM à chaque changement, budget de frame respecté.
