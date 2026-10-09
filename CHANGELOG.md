# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.
Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

### Added

- Les utilisateurs affichent la page en plein écran avec un bouton ou la touche P, et en sortent avec le même bouton ou la touche Échap ; le bouton n'apparaît pas si le navigateur ne le permet pas.

## [0.4.0] - 2026-10-09

### Added

- Les utilisateurs règlent la mesure (2/4, 3/4, 4/4 ou 6/8) et le tempo, retrouvés à la visite suivante, et lancent un métronome qui bat la mesure avec un son (qu'on peut couper) et un temps affiché à l'écran.
- La partition affiche l'indication de mesure, les barres de mesure et la durée de chaque note (de la double croche à la ronde) d'après le temps pendant lequel la touche est tenue ; les lecteurs d'écran entendent mesure, tempo et durées.

## [0.3.1] - 2026-10-09

### Fixed

- Les clés de sol et de fa restent visibles à gauche de la partition quand elle défile sur un écran étroit.

## [0.3.0] - 2026-10-09

### Added

- Quand plusieurs pianos sont branchés, les utilisateurs choisissent celui à écouter dans une liste de la barre MIDI ; si le piano choisi est débranché, la page le signale et écoute de nouveau tous les pianos.

## [0.2.0] - 2026-10-09

### Added

- L'application est publiée en ligne sur https://neolao.github.io/piano-midi-visualizer/ et se met à jour automatiquement à chaque modification, seulement si le style, les tests et la construction passent.
- Les utilisateurs voient en direct sur une partition à deux portées les notes et accords qu'ils jouent, avec un historique des accords précédents, les noms de notes en Do, Ré, Mi et le choix entre dièses et bémols.
- Les utilisateurs peuvent figer l'historique pour le relire, effacer la partition avec la possibilité d'annuler, régler les options (noms de notes, bémols, annonce vocale, raccourcis) et retrouver leurs réglages à la visite suivante.
- Les lecteurs d'écran reçoivent un résumé du dernier accord environ 2 secondes après l'arrêt du jeu, sans annonce note par note ; les raccourcis F, E et L figent, effacent et relisent l'accord.
- La page a désormais un style lisible à 1 m (papier crème, accent bleu-pétrole, cibles de 44 px) et un favicon.

## [0.1.0] - 2026-10-09

### Added

- Les utilisateurs peuvent activer le MIDI d'un clic et voir la liste de leurs pianos branchés, mise à jour à chaud, avec des messages clairs si le navigateur est incompatible, si l'accès est refusé ou en cas d'échec.

[Unreleased]: https://github.com/neolao/piano-midi-visualizer/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/neolao/piano-midi-visualizer/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/neolao/piano-midi-visualizer/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/neolao/piano-midi-visualizer/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/neolao/piano-midi-visualizer/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/neolao/piano-midi-visualizer/releases/tag/v0.1.0
