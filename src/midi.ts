const NOMS_NOTES = [
	"C",
	"C#",
	"D",
	"D#",
	"E",
	"F",
	"F#",
	"G",
	"G#",
	"A",
	"A#",
	"B",
];

/** Convertit un numéro de note MIDI (0-127) en nom scientifique, ex. 60 → "C4". */
export function nomDeNote(numero: number): string {
	if (!Number.isInteger(numero) || numero < 0 || numero > 127) {
		throw new RangeError(`Numéro de note MIDI invalide : ${numero}`);
	}
	const octave = Math.floor(numero / 12) - 1;
	return `${NOMS_NOTES[numero % 12]}${octave}`;
}
