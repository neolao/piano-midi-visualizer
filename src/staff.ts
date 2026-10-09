export interface StaffNote {
	midi: number;
	clef: "treble" | "bass";
	accidental: -1 | 0 | 1;
	octave: number;
	/** Rang diatonique : octave * 7 + lettre (do = 0). */
	diatonic: number;
	/** Nom court affiché, ex. « Fa♯ ». */
	label: string;
	/** Nom en toutes lettres avec octave, ex. « Fa dièse 4 ». */
	spoken: string;
	/** Clé VexFlow, ex. « c#/4 ». */
	vexKey: string;
}

const NAMES = ["Do", "Ré", "Mi", "Fa", "Sol", "La", "Si"];
const LETTERS = "cdefgab";
const LETTER_WITH_SHARPS = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
const LETTER_WITH_FLATS = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];
const ALTERED = [
	false,
	true,
	false,
	true,
	false,
	false,
	true,
	false,
	true,
	false,
	true,
	false,
];
const MIDDLE_C = 60;

export function placeNote(midi: number, flats: boolean): StaffNote {
	if (!Number.isInteger(midi) || midi < 0 || midi > 127) {
		throw new RangeError(`Numéro de note MIDI invalide : ${midi}`);
	}
	const pitchClass = midi % 12;
	const letter = (flats ? LETTER_WITH_FLATS : LETTER_WITH_SHARPS)[pitchClass];
	const accidental = ALTERED[pitchClass] ? (flats ? -1 : 1) : 0;
	const octave = Math.floor(midi / 12) - 1;
	const symbol = accidental === 1 ? "♯" : accidental === -1 ? "♭" : "";
	const word = accidental === 1 ? " dièse" : accidental === -1 ? " bémol" : "";
	const vexAccidental = accidental === 1 ? "#" : accidental === -1 ? "b" : "";
	return {
		midi,
		clef: midi >= MIDDLE_C ? "treble" : "bass",
		accidental,
		octave,
		diatonic: octave * 7 + letter,
		label: NAMES[letter] + symbol,
		spoken: `${NAMES[letter]}${word} ${octave}`,
		vexKey: `${LETTERS[letter]}${vexAccidental}/${octave}`,
	};
}
