import { createHeldNotes } from "./held-notes";

export interface ChordSnapshot {
	current: number[];
	history: number[][];
	/** Durée de maintien (ms) de chaque accord de l'historique. */
	durations: number[];
	/** Instant (ms) où chaque accord de l'historique a commencé. */
	starts: number[];
	/** Instant où l'accord en cours a commencé, ou null s'il n'y en a pas. */
	currentStart: number | null;
}

export interface ChordTracker {
	noteOn(note: number, time: number): void;
	noteOff(note: number, time?: number): void;
	releaseAll(time?: number): void;
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
	let durations: number[] = [];
	let starts: number[] = [];
	let chordStart = 0;

	const closeCurrent = (end: number) => {
		if (current.length === 0) return;
		history = [...history, current].slice(-maxHistory);
		durations = [...durations, Math.max(0, end - chordStart)].slice(
			-maxHistory,
		);
		starts = [...starts, chordStart].slice(-maxHistory);
		current = [];
	};

	const copy = (): ChordSnapshot => ({
		current: [...current],
		history: history.map((c) => [...c]),
		durations: [...durations],
		starts: [...starts],
		currentStart: current.length > 0 ? chordStart : null,
	});

	const sorted = (notes: number[]) => [...notes].sort((a, b) => a - b);

	return {
		noteOn(note, time) {
			if (held.sorted().includes(note)) return;
			held.press(note);
			if (current.length > 0 && time - chordStart <= groupMs) {
				current = sorted([...current, note]);
				return;
			}
			closeCurrent(time);
			current = [note];
			chordStart = time;
		},
		noteOff(note, time = chordStart) {
			if (!held.sorted().includes(note)) return;
			held.release(note);
			if (held.size === 0) closeCurrent(time);
		},
		releaseAll(time = chordStart) {
			held.clear();
			closeCurrent(time);
		},
		snapshot: copy,
		clear() {
			const before = copy();
			current = [];
			history = [];
			durations = [];
			starts = [];
			return before;
		},
		restore(snapshot) {
			current = [...snapshot.current];
			history = snapshot.history.map((c) => [...c]);
			durations = [...snapshot.durations];
			starts = [...snapshot.starts];
			if (snapshot.currentStart !== null) chordStart = snapshot.currentStart;
		},
		get heldCount() {
			return held.size;
		},
	};
}
