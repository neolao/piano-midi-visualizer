---
slug: jouer-partition
title: Jouer et voir sa partition
flow: 001
status: designed
source: src/main.ts, src/midi-panel.ts (état d'accès uniquement ; le reste à réaliser)
---

# Jouer et voir sa partition

## Purpose

Voir en direct ce qu'on joue sur une partition, le relire, et l'enregistrer.

## Layout

De haut en bas, en colonne unique sur toute la hauteur de la fenêtre (`100dvh`), sans défilement de la page :

1. **Barre MIDI** (fine) : pastille d'état + nom du piano (≥ 18 px) + « Changer ». Nom tronqué avec ellipse et titre complet si la largeur manque. Avant l'activation, cet espace est remplacé par le panneau d'accès existant.
2. **Partition** (≥ 60 % de la hauteur, toute la largeur) : deux portées (sol et fa), au moins 40 à 48 px par portée, échelle jamais réduite ; si la place manque, la région défile. Région focalisable et nommée. Note en cours en accent, historique atténué (contraste ≥ 4,5:1).
3. **Clavier visuel** (replié par défaut) : poignée d'au moins 44 px ; déplié, au plus 25 % de la hauteur, la partition défile plutôt que de se réduire.
4. **Barre de commandes** : trois grands contrôles (Enregistrer/Arrêter, Figer/Reprendre le direct, Effacer) et « Options » qui ouvre le tiroir (noms de notes, dièses/bémols, clavier visuel, annonce après silence, raccourcis). Cibles ≥ 44×44 px, 8 px d'écart. Au plus 6 contrôles visibles hors partition.

Tablette (1024 à 768 px de large, paysage) : même hiérarchie ; le tiroir recouvre le bas de l'écran sans réduire la partition.

## States

| State | Trigger | What the user sees | Primary action |
|---|---|---|---|
| Empty (avant activation) | première visite | portées vides, « Activez le MIDI, puis jouez une note », bouton primaire central | Activer le MIDI |
| Loading | clic sur Activer | « Demande d'accès en cours… » | — |
| Empty (prêt, rien joué) | piano détecté, aucune note | portées vides, « Jouez une note, elle apparaît ici », clavier au repos | Jouer |
| Partial (notes tenues) | touches enfoncées | notes et touches du clavier en évidence ; relâchées, elles passent dans l'historique | — |
| Partial (plusieurs pianos) | plusieurs entrées, aucun choix mémorisé | choix par boutons radio avec les noms | Choisir un piano |
| Success (jeu en cours) | notes jouées | historique qui défile, borné ; enregistrement possible | Enregistrer |
| Success (enregistrement prêt) | arrêt de l'enregistrement | « Télécharger (.mid, 42 s) » actif | Télécharger |
| Error (accès refusé / non compatible / échec) | voir le flux 001 | messages existants avec marche à suivre ; « Réessayer » uniquement pour l'échec | selon le cas |
| Error (piano débranché) | câble retiré | partition conservée, notes tenues relâchées, « Piano débranché — rebranchez ou choisissez un autre piano » | Rebrancher / Changer |
| Enregistrement vide | aucune note enregistrée | « Rien à enregistrer, jouez d'abord », téléchargement désactivé et visible | Jouer |
| Enregistrement en cours | clic sur Enregistrer | indicateur texte + icône + durée (pas la couleur seule) | Arrêter |
| Enregistrement interrompu | piano débranché pendant l'enregistrement | « Interrompu, X s enregistrées », contenu conservé | Télécharger |
| Défilement figé | clic sur Figer | partition immobile, « Reprendre le direct » | Reprendre |

## Interactions

| Element | Action | Result | Feedback (<100 ms) |
|---|---|---|---|
| Activer le MIDI | clic / Entrée | demande d'autorisation | état « Demande d'accès en cours… » |
| Changer (piano) | clic / Entrée | liste de choix | choix mémorisé à la sélection |
| Enregistrer / Arrêter | clic, Entrée ou R | démarre ou arrête l'enregistrement | texte, icône et durée ; le focus reste sur le bouton |
| Figer / Reprendre | clic ou F | arrête ou relance le défilement | libellé et `aria-pressed` |
| Effacer | clic ou E | vide la partition ; annulable quelques secondes | message « Partition effacée — Annuler » |
| Options | clic / Entrée | ouvre le tiroir sans voler le focus aux notes | tiroir visible |
| Noms de notes / Bémols / Clavier visuel | bascule | applique à toute la partition, réglage mémorisé | rendu immédiat, `aria-pressed` |
| Lire la dernière note | touche L | annonce le dernier accord | zone d'annonce |
| Télécharger | clic / Entrée | fichier .mid | annonce « Fichier enregistré » ; l'enregistrement reste |

Raccourcis d'une touche (R, F, E, L) : affichés à l'écran, désactivables, inactifs dans un champ de saisie, sans conflit avec le navigateur.

## Content

| Key | Text | Notes |
|---|---|---|
| title | Piano MIDI Visualizer | |
| empty.inactive | Activez le MIDI, puis jouez une note | |
| empty.ready | Jouez une note, elle apparaît ici | |
| midi.connected | Piano connecté : <nom> | annoncé |
| midi.disconnected | Piano débranché — rebranchez-le ou choisissez un autre piano | annoncé |
| record.start / record.stop | Enregistrer / Arrêter l'enregistrement | |
| record.empty | Rien à enregistrer, jouez d'abord | |
| record.ready | Télécharger (.mid, <durée>) | |
| record.interrupted | Interrompu, <X> s enregistrées | |
| freeze / resume | Figer l'historique / Reprendre le direct | |
| clear | Effacer la partition | |
| undo.cleared | Partition effacée — Annuler | |
| options.names | Noms de notes (Do, Ré, Mi…) | |
| options.accidentals | Dièses / Bémols — exemple : Fa♯ / Sol♭ | |
| options.keyboard | Clavier visuel | |
| error.* | textes existants du panneau d'accès MIDI | inchangés |
| a11y.chord | <nom d'accord> : <notes avec octave, en toutes lettres> | « fa dièse », jamais « fa# » |

## Accessibility

- **Keyboard order:** Barre MIDI (Changer) → partition (région focalisable) → clavier visuel (poignée) → Enregistrer → Figer → Effacer → Options. Focus visible ≥ 3:1, jamais masqué (WCAG 2.4.11).
- **Focus after each action:** après Enregistrer, Arrêter, Figer et Télécharger, le focus reste sur le bouton déclencheur, qui garde son nom et son état. Aucun déplacement de focus pendant que des notes arrivent.
- **Announcements (live regions / screen reader):** zone polie réservée aux changements d'état (connexion, débranchement, enregistrement démarré/arrêté, fichier enregistré). Jamais d'annonce note par note ; un résumé poli environ 2 s après l'arrêt du jeu, réglable ; touche L pour le relire. La partition SVG est `aria-hidden`, doublée d'une description textuelle de l'accord courant et d'une liste de l'historique accessible au clavier. Le clavier visuel est décoratif et `aria-hidden`.
- **Contrast & targets:** texte ≥ 4,5:1 ; portées, notes et contours des touches ≥ 3:1 ; cibles ≥ 44 px (jamais < 24 px) ; la note en cours n'est jamais signalée par la couleur seule (forme ou épaisseur en plus) ; thèmes clair et sombre à trancher dans `/ux:style`.
- **Motion:** défilement par pas discrets ; `prefers-reduced-motion` le remplace par un saut sans animation ; aucun clignotement ; « Figer » respecte WCAG 2.2.2.
