---
status: done
---
# Déployer sur GitHub Pages avec Actions

## Description
Un workflow GitHub Actions lance tests, lint et build Vite, puis publie dist/ sur GitHub Pages à chaque push sur main.

## Acceptance Criteria
- [ ] Un push sur main déclenche le workflow
- [ ] Le déploiement est bloqué si les tests ou le lint échouent
- [ ] Le site est accessible à l'URL GitHub Pages du dépôt
- [ ] Les ressources (JS, CSS) se chargent sans erreur 404 sous le sous-chemin du dépôt

## Notes
Priorité : MUST. Base relative déjà configurée dans vite.config.ts. Activer Pages en mode « GitHub Actions » dans les réglages du dépôt.
