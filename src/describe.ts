import { placeNote } from "./staff";
import { STRINGS } from "./strings";

const sortedNotes = (notes: number[]) => [...notes].sort((a, b) => a - b);

export function describeChord(
	notes: number[],
	flats: boolean,
	duration?: string,
): string {
	const names = sortedNotes(notes)
		.map((n) => placeNote(n, flats).spoken)
		.join(", ");
	return duration ? `${names} (${duration})` : names;
}

export function describeScore(
	current: number[],
	history: number[][],
	flats: boolean,
	rhythm?: { signature: string; tempo: number },
): string {
	const now =
		current.length > 0
			? STRINGS.describeCurrent(describeChord(current, flats))
			: STRINGS.describeNone;
	const past =
		history.length === 0
			? STRINGS.describeHistoryEmpty
			: STRINGS.describeHistory(history.length);
	const summary = `${now} ${past}`;
	return rhythm
		? `${STRINGS.describeRhythm(rhythm.signature, rhythm.tempo)} ${summary}`
		: summary;
}
