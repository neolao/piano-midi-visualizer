# Data models

## MidiStatus
Union discriminée sur `kind` : `idle`, `requesting`, `unsupported` (`insecure: boolean`), `denied`, `error`, `ready` (`inputs: MidiInputInfo[]`, `announcement: string | null`).
Defined in: `src/midi-access.ts`

## MidiInputInfo
| Field | Type | Notes |
|---|---|---|
| id | string | identifiant de l'entrée MIDI |
| name | string | « Entrée MIDI sans nom » si absent |
| manufacturer | string | vide si inconnu |
Defined in: `src/midi-access.ts`

## NoteEvent
| Field | Type | Notes |
|---|---|---|
| kind | `"on"` ou `"off"` | note on de vélocité 0 = off |
| note | number | 0 à 127 |
| velocity | number | 0 à 127 |
Defined in: `src/midi.ts`

## StaffNote
Clé (`treble` ou `bass`), altération (-1, 0, 1), octave, rang diatonique, `label` (« Fa♯ »), `spoken` (« Fa dièse 4 »), `vexKey` (« f#/4 »).
Defined in: `src/staff.ts`

## ChordSnapshot
`current` : notes de l'accord en cours ; `history` : accords déjà joués, du plus ancien au plus récent.
Defined in: `src/chords.ts`

## Settings
`names`, `flats`, `announce`, `shortcuts` (booléens, mémorisés sous `piano-midi-visualizer:settings`).
Defined in: `src/settings.ts`
