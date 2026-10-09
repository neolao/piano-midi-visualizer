---
id: 002
date: 2026-10-09
status: accepted
flow: none
---

# Direction visuelle « Cabinet de lecture »

**Context:** définir le style de l'application (aucun token existant), pour un pianiste amateur, thème clair seul, ambiance « sobre et lisible » avec une touche « chaleureuse et musicale ».
**Options considered:** Cabinet de lecture — sobre, aérée, un seul accent bleu-pétrole ; Salon — papier crème, accent terre cuite, titre à empattement ; Studio — compacte, bordures nettes, partition au maximum.
**Decision:** Cabinet de lecture.
**Reason:** lecture à 1 m, mains occupées, utilisateur occasionnel : la direction la plus calme et la plus aérée laisse la partition porter l'écran, et ses couleurs froides évitent la confusion entre l'accent et l'erreur rouge qu'aurait créée la terre cuite de Salon. Toutes les paires de couleurs dépassent leur seuil WCAG (texte 4,5:1, non-texte 3:1).
**Consequences:** plus simple : un seul accent, pas de police web, pas de thème sombre. Plus difficile : la chaleur musicale passe seulement par le fond papier légèrement chaud ; le contour de 2 px sur tous les éléments porteurs d'information alourdit un peu l'écran. À surveiller : la hauteur des portées (48 px) face à la place disponible sur tablette.
