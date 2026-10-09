# piano-midi-visualizer

Page web statique, hébergée sur GitHub Pages, qui capture en direct les notes MIDI d'un piano branché et les affiche sur une partition.

## Fonctionnalités

<!-- vibe:begin:features -->
- Voir en direct sur une partition à deux portées les notes et accords que l'on joue, avec l'historique des accords précédents et les noms de notes (Do, Ré, Mi…).
- Figer l'historique pour le relire, effacer la partition (avec annulation), choisir entre dièses et bémols ; les réglages sont mémorisés.
- Activer le MIDI d'un clic, avec des messages clairs si le navigateur est incompatible, si l'accès est refusé ou en cas d'échec.
- Choisir quel piano écouter quand plusieurs sont branchés, avec un avertissement si le piano choisi est débranché.
- Choisir la mesure (2/4, 3/4, 4/4, 6/8) et le tempo, lancer un métronome (son coupable, temps affiché) et voir les durées des notes et les barres de mesure sur la partition.
- Installer l'application sur Android depuis Chrome, avec son icône sur l'écran d'accueil (en ligne seulement).
- Voir la partition défiler au rythme du métronome, avec un trait qui marque le temps présent et des notes placées là où on les a jouées.
- Passer en plein écran d'un clic ou avec la touche P.
- Une annonce vocale du dernier accord après un silence et des raccourcis clavier (F, E, L) pour les lecteurs d'écran.
- Utilisable en ligne, sans installation : https://neolao.github.io/piano-midi-visualizer/
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
npm run dev       # serveur local avec rechargement
npm run build     # génère le site statique dans dist/
npm run preview   # sert le build en local
npm test          # lance les tests
npm run lint      # vérifie et corrige le style
npm run lint:ci   # vérifie le style sans rien modifier (utilisé par la CI)
npm run check:dist  # vérifie que le site construit n'utilise que des chemins relatifs
```
<!-- vibe:end:usage -->

## Déploiement

Chaque envoi sur la branche principale lance les contrôles (style, tests, construction) puis publie le site sur GitHub Pages. Rien n'est publié si un contrôle échoue ou depuis une proposition de changement.

- **Réglage à faire une fois :** dans les réglages du dépôt, rubrique Pages, choisir la source « GitHub Actions ».
- **Adresse :** https://neolao.github.io/piano-midi-visualizer/
- **Revenir en arrière :** relancer le workflow sur un commit sain (onglet Actions, « Run workflow »), ou annuler le commit fautif avec `git revert` puis l'envoyer sur la branche principale.

## Documentation

<!-- vibe:begin:docs-index -->
- [Architecture](docs/architecture.md) — comment les parties de la page s'articulent
- [Tests](docs/testing.md) — ce que couvrent les tests, comment les lancer et la CI
<!-- vibe:end:docs-index -->
