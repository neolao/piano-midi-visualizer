# Ubiquitous Language

## Note MIDI
Hauteur jouée au piano, identifiée par un numéro de 0 à 127 (60 = do central). Elle se convertit en nom scientifique (ex. `C4`) avant affichage sur la partition ; un numéro hors plage est refusé.
_Sources: `src/midi.ts`_

## Piano détecté
Entrée MIDI connectée que la page peut écouter. Elle apparaît dans la liste dès qu'on la branche et disparaît quand on la débranche ; une entrée à l'état déconnecté n'est pas comptée.
_Sources: `src/midi-access.ts`_

## Activation du MIDI
Action volontaire de l'utilisateur (bouton « Activer le MIDI ») qui déclenche la demande d'autorisation du navigateur. Un refus est définitif pour la session : la page indique alors comment autoriser l'accès dans les réglages du site.
_Sources: `src/midi-access.ts`, `src/midi-panel.ts`_
