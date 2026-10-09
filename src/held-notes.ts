export interface HeldNotes {
	press(note: number): void;
	release(note: number): void;
	clear(): void;
	sorted(): number[];
	readonly size: number;
}

export function createHeldNotes(): HeldNotes {
	const notes = new Set<number>();
	return {
		press: (note) => void notes.add(note),
		release: (note) => void notes.delete(note),
		clear: () => notes.clear(),
		sorted: () => [...notes].sort((a, b) => a - b),
		get size() {
			return notes.size;
		},
	};
}
