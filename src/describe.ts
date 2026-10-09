import { placeNote } from "./staff";
import { STRINGS } from "./strings";

const sortedNotes = (notes: number[]) => [...notes].sort((a, b) => a - b);

export function describeChord(notes: number[], flats: boolean): string {
	return sortedNotes(notes)
		.map((n) => placeNote(n, flats).spoken)
		.join(", ");
}

export function describeScore(
	current: number[],
	history: number[][],
	flats: boolean,
): string {
	const now =
		current.length > 0
			? STRINGS.describeCurrent(describeChord(current, flats))
			: STRINGS.describeNone;
	const past =
		history.length === 0
			? STRINGS.describeHistoryEmpty
			: STRINGS.describeHistory(history.length);
	return `${now} ${past}`;
}
