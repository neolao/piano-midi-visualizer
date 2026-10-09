export const SIGNATURES = ["2/4", "3/4", "4/4", "6/8"] as const;
export type Signature = (typeof SIGNATURES)[number];

export const DEFAULT_SIGNATURE: Signature = "4/4";
export const DEFAULT_TEMPO = 80;
export const MIN_TEMPO = 40;
export const MAX_TEMPO = 200;

export interface NoteValue {
	/** Durée en croches (0,5 = double croche). */
	eighths: number;
	name: string;
	/** Durée VexFlow, ex. « qd » pour une noire pointée. */
	vex: string;
}

const NOTE_VALUES: NoteValue[] = [
	{ eighths: 0.5, name: "double croche", vex: "16" },
	{ eighths: 1, name: "croche", vex: "8" },
	{ eighths: 2, name: "noire", vex: "q" },
	{ eighths: 3, name: "noire pointée", vex: "qd" },
	{ eighths: 4, name: "blanche", vex: "h" },
	{ eighths: 6, name: "blanche pointée", vex: "hd" },
	{ eighths: 8, name: "ronde", vex: "w" },
];

/** Durée provisoire d'un accord encore tenu. */
export const QUARTER_NOTE = NOTE_VALUES[2];

export function isSignature(value: unknown): value is Signature {
	return SIGNATURES.includes(value as Signature);
}

/** Temps battus par le métronome : le 6/8 se bat en deux temps de trois croches. */
export function beatsPerMeasure(signature: Signature): number {
	return signature === "6/8" ? 2 : Number(signature[0]);
}

function eighthsPerBeat(signature: Signature): number {
	return signature === "6/8" ? 3 : 2;
}

export function measureEighths(signature: Signature): number {
	return beatsPerMeasure(signature) * eighthsPerBeat(signature);
}

export function clampTempo(value: number): number {
	if (!Number.isFinite(value)) return DEFAULT_TEMPO;
	return Math.min(MAX_TEMPO, Math.max(MIN_TEMPO, Math.round(value)));
}

/** Valeur de note la plus proche de la durée de maintien d'une touche. */
export function quantizeDuration(
	ms: number,
	tempo: number,
	signature: Signature,
): NoteValue {
	const eighthMs = 60000 / tempo / eighthsPerBeat(signature);
	const eighths = Number.isFinite(ms) && ms > 0 ? ms / eighthMs : 0;
	return NOTE_VALUES.reduce((best, candidate) =>
		Math.abs(candidate.eighths - eighths) < Math.abs(best.eighths - eighths)
			? candidate
			: best,
	);
}

/** Regroupe les indices d'accords par mesure : une mesure se ferme quand elle est pleine ou dépassée. */
export function splitMeasures(
	durations: number[],
	signature: Signature,
): number[][] {
	const length = measureEighths(signature);
	const measures: number[][] = [];
	let filled = 0;
	durations.forEach((duration, index) => {
		if (filled === 0) measures.push([]);
		measures[measures.length - 1].push(index);
		filled += duration;
		if (filled >= length) filled = 0;
	});
	return measures;
}

/** Indices des accords après lesquels une barre de mesure est tracée (mesure complète seulement). */
export function measureEnds(
	durations: number[],
	signature: Signature,
): Set<number> {
	const length = measureEighths(signature);
	const ends = new Set<number>();
	for (const measure of splitMeasures(durations, signature)) {
		const total = measure.reduce((sum, i) => sum + durations[i], 0);
		if (total >= length) ends.add(measure[measure.length - 1]);
	}
	return ends;
}
