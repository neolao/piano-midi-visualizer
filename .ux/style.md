---
status: adopted
mode: propose
date: 2026-10-09
decision: 002
previews: [.ux/prototypes/style-cabinet.html, https://claude.ai/artifact/8nL5wDiipEKwRJ9tewbmKN]
---

# Look and feel — piano-midi-visualizer

> Written by `/ux:style`. This is the visual reference for `/ux:design`, `/ux:prototype`, `/ux:implement` and the review agents. Every value here is the one shown in the previews.

## Intent

Une interface calme qui s'efface devant la partition, lisible à 1 m : sobre, aérée, lisible.
**Not this:** un style « partition de musée » (serif ornée, textures de papier) qui concurrence le rendu de la partition ; un style « logiciel de studio » dense, trop petit à 1 m pour un pianiste amateur occasionnel.

## Palette

Thème clair seul (`color-scheme: light`). Valeurs et ratios calculés (WCAG), identiques à ceux de l'aperçu.

| Token | Light | Dark | Usage | Contrast (on its usual background) |
|---|---|---|---|---|
| color.surface | #F7F4EE | n/a | fond de page | — |
| color.surface-raised | #FFFDF8 | n/a | zone de la partition | — |
| color.surface-sunken | #EDE8DF | n/a | barre MIDI, barre de commandes | — |
| color.text | #1E1B18 | n/a | texte courant, notes de référence | 15,6:1 sur surface |
| color.text-muted | #5E5750 | n/a | texte secondaire, désactivé | 6,5:1 sur surface |
| color.note-history | #6F6760 | n/a | notes déjà jouées (ton plein, jamais l'opacité) | 5,5:1 sur surface-raised |
| color.primary | #1F5C7A | n/a | action primaire, note en cours (avec forme distincte) | 6,7:1 sur surface |
| color.on-primary | #FFFFFF | n/a | texte sur primaire | 7,3:1 sur primary |
| color.border | #857D74 | n/a | portées, contours de boutons et de touches | 4,0:1 sur surface-raised, 3,7:1 sur surface |
| color.focus | #1E1B18 | n/a | anneau de focus 3 px, décalage 2 px, filet clair extérieur | ≥ 3:1 sur toutes les surfaces |
| color.success | #2E6B3A | n/a | piano connecté (avec icône et texte) | 5,8:1 sur surface |
| color.error | #A32A2A | n/a | piano débranché, accès refusé (avec icône et texte) | 6,5:1 sur surface |
| color.warning | #7A4F00 | n/a | enregistrement interrompu (avec icône et texte) | 6,5:1 sur surface |
| color.record | #C2185B | n/a | enregistrement (point, icône, durée), distinct de l'erreur | 5,4:1 sur surface |

La note en cours se distingue de l'historique par la forme (tête plus grosse, contour épais de 3 px, nom en gras), pas seulement par la couleur.

## Typography

- **Families:** pile système `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` ; aucune police web (pas de requête externe, fonctionne hors ligne). La police de notation reste celle de VexFlow.
- **Scale:** 16 (minimum, raccourcis) / 18 (base, nom du piano) / 22 (libellés des grands contrôles, messages d'état) / 28 (titres) / 40 (message d'état vide, durée d'enregistrement). Interligne 1,4 en texte, 1,2 en titres.
- **Weights:** 500 en texte courant, 600 pour les libellés de contrôles et les titres ; jamais de 300.
- **Figures:** chiffres tabulaires pour la durée et les compteurs ; noms de notes en Do, Ré, Mi, en gras, 20 px minimum.

## Spacing & shape

- **Base unit and scale:** 4 px — 4 / 8 / 12 / 16 / 24 / 32 / 48. Facteur d'aération 1,25 sur les marges internes.
- **Radii:** 8 px contrôles et tiroir, 999 px pastilles.
- **Borders:** 2 px en `color.border` pour tout élément porteur d'information (contrôles, portées) ; pas de filets clairs décoratifs sur ces éléments.
- **Elevation / shadows:** aucune, sauf le tiroir d'options (une seule ombre douce).

## Density

Aérée : pianiste amateur occasionnel, écran posé sur le piano lu à 1 m, mains sur le clavier. Cibles de 44 px au minimum avec 8 px d'écart ; au plus 6 contrôles visibles hors partition ; portées de 48 px de haut au moins.

## Motion

- **Durations & easing:** 120 ms pour les retours d'état, 200 ms pour le tiroir, une seule courbe ease-out, opacité seulement ; rien au-delà de 300 ms.
- **What animates:** le tiroir d'options et les changements d'état ; l'historique défile par pas discrets.
- **Reduced motion:** les transitions sont supprimées et le défilement devient un saut direct ; aucun clignotement, aucune pulsation sur l'indicateur d'enregistrement (point fixe, texte, durée).

## Iconography

Icônes simples en trait plein, 20 px minimum, toujours accompagnées d'un libellé (●, ■, ⚠, ✓). Une icône ne se tient seule nulle part : le sens passe par le texte.

## Imagery

Aucune. L'état vide se limite à la partition vide et à un message.

## Component intent

- **Buttons:** un seul bouton plein par état (« Activer le MIDI » avant l'activation, puis « Enregistrer » en contour d'enregistrement) ; Figer, Effacer et Options en contour ; Effacer n'est jamais en couleur d'erreur car il est annulable. Désactivé : texte `text-muted`, contour en tirets, reste lisible.
- **Inputs:** libellé visible au-dessus ; sélecteurs et cases natifs, `color-scheme: light` ; anneau de focus 3 px avec décalage.
- **Surfaces:** la partition sur `surface-raised` ; barres MIDI et de commandes sur `surface-sunken` avec une bordure de 2 px ; pas d'ombre.
- **Status & feedback:** pastille d'état + texte dans la barre MIDI ; bandeau d'erreur (bordure, icône, texte) au-dessus de la partition ; toast sombre avec action « Annuler » pour Effacer.
- **Tables / lists:** liste des pianos et de l'historique en lignes de 44 px, sans zébrures.

## Tone of content

Phrases courtes, directes, vouvoiement, orientées vers l'action suivante (« Jouez une note, elle apparaît ici »). Pas d'excuses ni d'humour.

## Source of truth

`src/styles/tokens.css` (variables CSS) et `src/styles/base.css`
