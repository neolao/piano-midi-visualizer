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
