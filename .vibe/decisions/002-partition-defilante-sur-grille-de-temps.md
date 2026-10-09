---
date: 2026-10-09
status: accepted
---
# Partition défilante sur une grille de temps
**Context:** voir où l'on en est dans la mesure, et placer les notes selon le moment où elles sont jouées, pendant que le métronome tourne.
**Decision:** quand le métronome tourne, une grille convertit les instants en temps (suit les changements de tempo et de mesure) ; la partition est dessinée une fois dans un grand calque que le navigateur déplace, un curseur fixe marque le temps présent, et on redessine seulement à l'arrivée d'une note ou quand le calque est presque épuisé. Métronome arrêté, la partition reste l'affichage fixe qui range les accords l'un après l'autre.
**Reason:** déplacer un calque est fluide sur une tablette, alors que redessiner la partition à chaque image est trop lourd ; garder l'affichage fixe à l'arrêt évite de perdre ce qu'on vient de jouer.
**Rejected alternatives:** redessiner tout le dessin à chaque image (saccades) ; défilement permanent même sans métronome (pas de repère de temps) ; simples repères de temps sans défilement (les notes ne reflètent pas le rythme réel).
