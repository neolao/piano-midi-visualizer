---
id: 001
date: 2026-10-09
status: accepted
flow: 001
---

# Scène unique avec barre de commandes

**Context:** concevoir l'écran principal de l'application (partition en direct, historique, enregistrement/export, options) pour un pianiste amateur, écran posé sur le piano, lu à 1 m, mains sur le clavier.
**Options considered:** A — scène unique : barre MIDI fine, partition dominante, barre de commandes basse (Enregistrer, Figer, Effacer), tiroir d'options ; B — mode jeu épuré : partition seule, tout le reste dans un menu unique ; C — deux vues Jouer / Enregistrements reliées par des onglets.
**Decision:** A.
**Reason:** les mains sont sur le piano, donc les actions utiles en jouant (enregistrer, figer pour relire, effacer) doivent rester visibles, à grande cible et avec un raccourci clavier, ce que B enfouit. C oblige à changer de vue pour enregistrer en jouant. Le produit n'a qu'un écran et un seul travail : A le garde en un seul fil, avec la partition à 60 % ou plus de la hauteur.
**Consequences:** plus facile : tout se fait sans quitter l'écran, la partition garde toujours la même place. Plus difficile : jusqu'à 6 contrôles visibles à tenir lisibles et espacés ; l'échelle de la partition est fixe (jamais réduite) et le reste défile. À surveiller : la hauteur sur tablette paysage quand le tiroir ou le clavier visuel est ouvert.
