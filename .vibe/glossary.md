# Ubiquitous Language

## Note MIDI
Hauteur jouée au piano, identifiée par un numéro de 0 à 127 (60 = do central). Elle se place sur la portée de sol à partir du do central et sur celle de fa en dessous ; un numéro hors plage est refusé.
_Sources: `src/midi.ts`, `src/staff.ts`_

## Piano détecté
Entrée MIDI connectée que la page peut écouter. Elle apparaît dans la barre MIDI dès qu'on la branche ; une entrée à l'état déconnecté n'est pas comptée. Avec plusieurs pianos, l'utilisateur peut n'en écouter qu'un ; si celui-là disparaît, la page le signale et écoute de nouveau tous les pianos. Quand le piano disparaît, les notes tenues sont relâchées et la partition reste affichée.
_Sources: `src/midi-access.ts`, `src/midi-panel.ts`_

## Activation du MIDI
Action volontaire de l'utilisateur (bouton « Activer le MIDI ») qui déclenche la demande d'autorisation du navigateur. Un refus n'est pas rejouable : la page indique comment autoriser l'accès dans les réglages du site.
_Sources: `src/midi-access.ts`, `src/midi-panel.ts`_

## Accord
Ensemble de notes jouées à moins de 60 ms les unes des autres. Il est « en cours » tant qu'une de ses touches est tenue, puis il entre dans l'historique.
_Sources: `src/chords.ts`_

## Historique
Accords déjà joués, affichés en gris sur la partition (8 au plus) et conservés en mémoire jusqu'à une limite fixe. Il se fige, s'efface (avec annulation possible) et se lit en toutes lettres pour les lecteurs d'écran.
_Sources: `src/chords.ts`, `src/app.ts`, `src/describe.ts`_

## Partition
Deux portées (sol et fa) où les notes et accords apparaissent sans rythme ni durée.
_Sources: `src/score.ts`_

## Mesure et tempo
La mesure (2/4, 3/4, 4/4 ou 6/8) fixe le nombre de temps et la longueur des barres de mesure ; le tempo, de 40 à 200 battements par minute, fixe la vitesse du métronome et la valeur de chaque note. Le 6/8 se bat en deux temps de trois croches.
_Sources: `src/rhythm.ts`, `src/metronome.ts`_

## Durée d'une note
Valeur de note (de la double croche à la ronde) la plus proche du temps pendant lequel la touche est tenue, selon le tempo. Il n'y a ni silence ni liaison ; un accord encore tenu s'affiche en noire.
_Sources: `src/rhythm.ts`, `src/score.ts`_

