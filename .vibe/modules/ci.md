# Module: ci
**Role:** Contrôles et publication : lint sans écriture, tests, build, vérification des chemins relatifs et de l'installabilité (fiche, icônes), déploiement GitHub Pages depuis main.
**Files:** `.github/workflows/deploy.yml`, `scripts/check-dist.mjs`, `public/manifest.webmanifest`, `public/icons/`
**Exports:** `checkDist(dir)`, `checkInstallable(dir)`, `findAbsolutePaths(html)`
**Depends on:** aucun
