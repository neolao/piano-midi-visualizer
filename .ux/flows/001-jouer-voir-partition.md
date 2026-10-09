---
id: 001
title: Jouer et voir sa partition en direct
status: designed
date: 2026-10-09
job: Quand je m'entraîne au piano, je veux voir en direct sur une partition ce que je joue, afin de vérifier mes notes.
screens: [jouer-partition]
decision: 001
prototype: none
---

# 001 — Jouer et voir sa partition en direct

## Need

Le pianiste amateur ouvre la page, l'écran posé sur le piano, pour voir ce qu'il joue sur une partition. Le déclencheur est le branchement de son piano ; il sait que ça marche quand la première note apparaît sur la portée en moins de 100 ms. Il peut aussi revoir un passage, enregistrer sa séance et la télécharger en fichier MIDI. Il a les mains sur le clavier du piano.

## Chosen approach

Un seul écran en scène unique : une barre MIDI fine en haut (pastille d'état, nom du piano, changer), la partition à deux portées dominante au milieu, une barre de commandes basse à trois grands contrôles (Enregistrer, Figer, Effacer) et un tiroir d'options (noms de notes, dièses/bémols, clavier visuel). Tout est utilisable au clavier d'ordinateur avec des raccourcis d'une touche, parce que la souris est hors de portée en jouant. Le panneau d'accès MIDI déjà réalisé devient l'état « avant connexion » de la barre MIDI.

## Flow

| Step | User does | System shows | Screen |
|---|---|---|---|
| 1 | Ouvre la page | Portées vides, message « Activez le MIDI, puis jouez une note », bouton primaire « Activer le MIDI » au centre | jouer-partition |
| 2 | Clique « Activer le MIDI » et autorise le navigateur | « Demande d'accès en cours… » puis la barre MIDI : pastille + « Piano connecté : <nom> » annoncé | jouer-partition |
| 3 | (plusieurs pianos, premier usage) Choisit son piano | Choix par boutons radio avec les noms ; le choix est mémorisé | jouer-partition |
| 4 | Joue une note ou un accord | La note apparaît en moins de 100 ms, mise en évidence ; relâchée, elle passe dans l'historique atténué | jouer-partition |
| 5 | Continue de jouer | L'historique défile seul, borné à une limite fixe ; rien n'est annoncé note par note | jouer-partition |
| 6 | Appuie sur « Figer » (ou F) | Le défilement s'arrête, la partition passe en lecture ; « Reprendre le direct » le relance | jouer-partition |
| 7 | Ouvre le tiroir d'options et bascule noms de notes, dièses/bémols, clavier visuel | Effet immédiat sur toute la partition, anciennes notes comprises ; réglage mémorisé | jouer-partition |
| 8 | Appuie sur « Enregistrer » (ou R), joue, puis « Arrêter » | Indicateur d'enregistrement (texte, icône, durée), puis « Télécharger (.mid, 42 s) » actif | jouer-partition |
| 9 | Télécharge | Le fichier .mid est enregistré ; l'enregistrement reste disponible pour un second téléchargement | jouer-partition |

## Exit & failure paths

- **Abandon mid-flow:** les réglages (piano, noms de notes, dièses/bémols, clavier visuel) sont mémorisés localement. Fermer l'onglet avec un enregistrement non téléchargé déclenche un avertissement du navigateur.
- **Navigateur sans MIDI / accès refusé / échec :** les messages existants restent, chacun avec sa marche à suivre ; la partition vide reste visible derrière.
- **Piano débranché en jouant :** toutes les notes tenues sont relâchées, partition et historique restent affichés, « Piano débranché » est annoncé avec « rebrancher ou choisir un autre piano » ; au retour du même piano, le jeu reprend sans action. Un enregistrement en cours est conservé et marqué « interrompu, X s enregistrées ».
- **Plusieurs pianos, celui qui est actif disparaît :** pas de bascule silencieuse, on propose le choix.
- **Undo / cancel :** « Effacer » est annulable quelques secondes ; « Nouvel enregistrement » demande confirmation, en nommant la perte, seulement s'il existe un enregistrement non téléchargé.

## Acceptance criteria

- [ ] Première visite, un seul piano : clic sur « Activer le MIDI » puis autorisation → piano sélectionné et annoncé, première note affichée sans autre action.
- [ ] Deux pianos, aucun choix mémorisé → un choix simple s'affiche ; au chargement suivant le piano mémorisé est repris sans demande.
- [ ] Accord Do-Mi-Sol → trois notes alignées sur la portée adaptée ; les noms Do, Mi, Sol s'affichent sans décaler la partition quand l'option est active.
- [ ] Relâcher une note d'un accord tenu → seule cette note perd sa mise en évidence.
- [ ] Centaines de notes jouées → l'historique reste borné, l'affichage fluide, la mémoire stable.
- [ ] Passer de dièses à bémols en jouant → Fa♯ devient Sol♭ immédiatement, sans interrompre le jeu, réglage mémorisé.
- [ ] Piano débranché en jouant → plus de note fantôme, message annoncé, reprise automatique au retour.
- [ ] Enregistrer, jouer, arrêter → « Télécharger (.mid, durée) » actif ; sans note jouée, le téléchargement est désactivé avec sa raison.
- [ ] Rien n'est annoncé note par note ; une seule annonce polie environ 2 s après l'arrêt du jeu (« Do majeur : Do4, Mi4, Sol4 »), réglable.
- [ ] Avec `prefers-reduced-motion`, le défilement devient un saut sans animation ; « Figer » arrête la partition jusqu'à la reprise.
- [ ] À 200 % de zoom sur tablette étroite, aucun défilement horizontal de la page ; la partition défile dans sa région nommée, atteignable au clavier.

## Out of scope

- Rythme, durées et quantification de la partition (hors périmètre du projet).
- Lecture du fichier enregistré dans l'application ; une liste de plusieurs enregistrements.
- Interface en anglais, mode hors ligne.
- Valeurs de palette, de police et d'espacement : elles viennent de `/ux:style`.
