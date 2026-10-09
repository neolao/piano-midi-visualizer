import { createHeldNotes } from "./held-notes";

export interface ChordSnapshot {
	current: number[];
	history: number[][];
}

export interface ChordTracker {
	noteOn(note: number, time: number): void;
	noteOff(note: number): void;
	releaseAll(): void;
	snapshot(): ChordSnapshot;
	clear(): ChordSnapshot;
	restore(snapshot: ChordSnapshot): void;
	readonly heldCount: number;
}

interface Options {
	/** Fenêtre (ms) dans laquelle des notes jouées ensemble forment un accord. */
	groupMs: number;
	maxHistory: number;
}

export function createChordTracker({
	groupMs,
	maxHistory,
}: Options): ChordTracker {
	const held = createHeldNotes();
	let current: number[] = [];
	let history: number[][] = [];
	let chordStart = 0;

	const closeCurrent = () => {
		if (current.length === 0) return;
		history = [...history, current].slice(-maxHistory);
		current = [];
	};

	const sorted = (notes: number[]) => [...notes].sort((a, b) => a - b);

	return {
		noteOn(note, time) {
			if (held.sorted().includes(note)) return;
			held.press(note);
			if (current.length > 0 && time - chordStart <= groupMs) {
				current = sorted([...current, note]);
				return;
			}
			closeCurrent();
			current = [note];
			chordStart = time;
		},
		noteOff(note) {
			if (!held.sorted().includes(note)) return;
			held.release(note);
			if (held.size === 0) closeCurrent();
		},
		releaseAll() {
			held.clear();
			closeCurrent();
		},
		snapshot: () => ({
			current: [...current],
			history: history.map((c) => [...c]),
		}),
		clear() {
			const before = {
				current: [...current],
				history: history.map((c) => [...c]),
			};
			current = [];
			history = [];
			return before;
		},
		restore(snapshot) {
			current = [...snapshot.current];
			history = snapshot.history.map((c) => [...c]);
		},
		get heldCount() {
			return held.size;
		},
	};
}
