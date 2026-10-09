# piano-midi-visualizer

Page web statique, hébergée sur GitHub Pages, qui capture en direct les notes MIDI d'un piano branché et les affiche sur une partition.

## Fonctionnalités

<!-- vibe:begin:features -->
- Activer le MIDI d'un clic et voir la liste de ses pianos branchés, mise à jour dès qu'on en branche ou débranche un.
- Messages clairs si le navigateur ne gère pas le MIDI, si l'accès est refusé ou en cas d'échec.
<!-- vibe:end:features -->

## Installation

<!-- vibe:begin:install -->
Prérequis : Node.js 22 ou plus récent.

```sh
git clone <url-du-dépôt>
cd piano-midi-visualizer
npm install
```
<!-- vibe:end:install -->

## Utilisation

<!-- vibe:begin:usage -->
```sh
npm run dev      # serveur local avec rechargement
npm run build    # génère le site statique dans dist/
npm run preview  # sert le build en local
npm test         # lance les tests
npm run lint     # vérifie et corrige le style
```
<!-- vibe:end:usage -->

## Documentation

<!-- vibe:begin:docs-index -->
- [Architecture](docs/architecture.md) — comment les parties de la page s'articulent
- [Tests](docs/testing.md) — ce que couvrent les tests et comment les lancer
<!-- vibe:end:docs-index -->
