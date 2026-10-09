# Module: score
**Role:** Dessine la partition à deux portées avec VexFlow : 8 accords visibles avec leur durée, indication de mesure, barres de mesure, accord en cours mis en évidence, noms de notes.
**Files:** `src/score.ts`
**Exports:** `createScore(container)`, `SLOTS`, `buildChordNote`, `scoreColors`
**Depends on:** `modules/staff.md`, `modules/rhythm.md`, `modules/chords.md` (type `ChordSnapshot`), tokens CSS
**Note:** une copie des clés (`.clefs`) reste collée à gauche quand la partition défile.
