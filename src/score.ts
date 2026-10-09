import {
	Accidental,
	BarNote,
	Dot,
	Formatter,
	GhostNote,
	Renderer,
	Stave,
	StaveConnector,
	StaveNote,
	Voice,
} from "vexflow";
import type { ChordSnapshot } from "./chords";
import {
	measureEnds,
	type NoteValue,
	QUARTER_NOTE,
	quantizeDuration,
	type Signature,
} from "./rhythm";
import { placeNote } from "./staff";

/** Nombre d'accords visibles : l'historique défile quand il est plein. */
export const SLOTS = 8;

export interface ScoreOptions {
	flats: boolean;
	names: boolean;
	signature: Signature;
	tempo: number;
}

export interface Score {
	render(snapshot: ChordSnapshot, options: ScoreOptions): void;
}

export const WIDTH = 1000;
export const LINE_GAP = 12;
/** Épaisseur des portées : `--border-width` (2 px). */
export const LINE_WIDTH = 2;
/** Contour de la note en cours : 3 px (.ux/style.md). */
const CURRENT_STROKE = 3;
export const TREBLE_Y = 0;
export const BASS_Y = 130;
export const HEIGHT = 270;

export function token(name: string): string {
	return (
		getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
		"currentColor"
	);
}

export interface ScoreColors {
	line: string;
	text: string;
	history: string;
	current: string;
	background: string;
	font: string;
}

export function scoreColors(): ScoreColors {
	return {
		line: token("--color-border"),
		text: token("--color-text"),
		history: token("--color-note-history"),
		current: token("--color-primary"),
		background: token("--color-surface-raised"),
		font: token("--font-ui"),
	};
}

/** Note (ou accord) d'une clé : null quand l'accord n'a aucune note dans cette clé. */
export function buildChordNote(
	clef: "treble" | "bass",
	chord: number[],
	isCurrent: boolean,
	value: NoteValue,
	flats: boolean,
	colors: ScoreColors,
): StaveNote | null {
	const inClef = [...chord]
		.sort((a, b) => a - b)
		.map((m) => placeNote(m, flats))
		.filter((n) => n.clef === clef);
	if (inClef.length === 0) return null;
	const style = isCurrent
		? {
				fillStyle: colors.current,
				strokeStyle: colors.text,
				lineWidth: CURRENT_STROKE,
			}
		: { fillStyle: colors.history, strokeStyle: colors.history };
	const note = new StaveNote({
		keys: inClef.map((n) => n.vexKey),
		duration: value.vex,
		clef,
	});
	if (value.vex.endsWith("d")) {
		Dot.buildAndAttach([note], { all: true });
	}
	inClef.forEach((n, i) => {
		if (n.accidental === 0) return;
		const accidental = new Accidental(n.accidental > 0 ? "#" : "b");
		accidental.setStyle(style);
		note.addModifier(accidental, i);
	});
	note.setStyle(style);
	return note;
}

/**
 * Quand la partition défile, les clés sortent de l'écran : on en superpose une
 * copie collée à gauche (le bord gauche de la partition, sans aucune note).
 */
function pinClefs(
	container: HTMLElement,
	svg: SVGSVGElement,
	clefWidth: number,
	background: string,
): void {
	const copy = svg.cloneNode(true) as SVGSVGElement;
	copy.setAttribute("viewBox", `0 0 ${clefWidth} ${HEIGHT}`);
	const backdrop = document.createElementNS(
		"http://www.w3.org/2000/svg",
		"rect",
	);
	backdrop.setAttribute("width", String(clefWidth));
	backdrop.setAttribute("height", String(HEIGHT));
	backdrop.setAttribute("fill", background);
	backdrop.setAttribute("stroke", "none");
	copy.prepend(backdrop);
	copy.style.setProperty("--clef-ratio", String(clefWidth / WIDTH));
	const pin = document.createElement("div");
	pin.className = "clefs";
	pin.setAttribute("aria-hidden", "true");
	pin.append(copy);
	container.prepend(pin);
}

export function createScore(container: HTMLElement): Score {
	return {
		render(snapshot, options) {
			const colors = scoreColors();
			const hasCurrent = snapshot.current.length > 0;
			const values: NoteValue[] = snapshot.history.map((_, i) =>
				quantizeDuration(
					snapshot.durations[i] ?? 0,
					options.tempo,
					options.signature,
				),
			);
			if (hasCurrent) values.push(QUARTER_NOTE);
			const allChords = hasCurrent
				? [...snapshot.history, snapshot.current]
				: snapshot.history;
			const ends = measureEnds(
				values.map((v) => v.eighths),
				options.signature,
			);
			const first = Math.max(0, allChords.length - SLOTS);
			const chords = allChords.slice(first);
			const shownValues = values.slice(first);

			container.replaceChildren();
			const renderer = new Renderer(
				container as HTMLDivElement,
				Renderer.Backends.SVG,
			);
			renderer.resize(WIDTH, HEIGHT);
			const context = renderer.getContext();
			const svg = container.querySelector("svg");
			svg?.setAttribute("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);
			svg?.setAttribute("aria-hidden", "true");
			svg?.removeAttribute("width");
			svg?.removeAttribute("height");
			svg?.style.removeProperty("width");
			svg?.style.removeProperty("height");

			const lineStyle = {
				strokeStyle: colors.line,
				fillStyle: colors.line,
				lineWidth: LINE_WIDTH,
			};
			const treble = new Stave(10, TREBLE_Y, WIDTH - 20, {
				spacingBetweenLinesPx: LINE_GAP,
			})
				.addClef("treble")
				.addTimeSignature(options.signature);
			const bass = new Stave(10, BASS_Y, WIDTH - 20, {
				spacingBetweenLinesPx: LINE_GAP,
			})
				.addClef("bass")
				.addTimeSignature(options.signature);
			for (const stave of [treble, bass]) {
				stave.setStyle(lineStyle);
				stave.setContext(context).draw();
			}
			for (const type of [
				StaveConnector.type.BRACE,
				StaveConnector.type.SINGLE_LEFT,
			]) {
				const connector = new StaveConnector(treble, bass).setType(type);
				connector.setStyle(lineStyle);
				connector.setContext(context).draw();
			}

			const notesFor = (
				clef: "treble" | "bass",
				chord: number[],
				isCurrent: boolean,
				value: NoteValue,
			) =>
				buildChordNote(clef, chord, isCurrent, value, options.flats, colors) ??
				new GhostNote({ duration: value.vex });

			type Tickable = StaveNote | GhostNote | BarNote;
			const trebleNotes: Tickable[] = [];
			const bassNotes: Tickable[] = [];
			const anchors: { treble: Tickable; bass: Tickable }[] = [];
			for (let slot = 0; slot < SLOTS; slot++) {
				const chord = chords[slot];
				const value = shownValues[slot] ?? QUARTER_NOTE;
				const isCurrent = hasCurrent && slot === chords.length - 1;
				const treble = chord
					? notesFor("treble", chord, isCurrent, value)
					: new GhostNote({ duration: value.vex });
				const bass = chord
					? notesFor("bass", chord, isCurrent, value)
					: new GhostNote({ duration: value.vex });
				trebleNotes.push(treble);
				bassNotes.push(bass);
				anchors.push({ treble, bass });
				if (chord && ends.has(first + slot)) {
					trebleNotes.push(new BarNote());
					bassNotes.push(new BarNote());
				}
			}

			const voice = (notes: Tickable[]) =>
				new Voice({ numBeats: SLOTS, beatValue: 1 })
					.setMode(Voice.Mode.SOFT)
					.addTickables(notes);
			const trebleVoice = voice(trebleNotes);
			const bassVoice = voice(bassNotes);
			new Formatter()
				.joinVoices([trebleVoice])
				.joinVoices([bassVoice])
				.format(
					[trebleVoice, bassVoice],
					treble.getNoteEndX() - treble.getNoteStartX() - 40,
				);
			trebleVoice.draw(context, treble);
			bassVoice.draw(context, bass);
			if (svg)
				pinClefs(container, svg, treble.getNoteStartX(), colors.background);

			if (hasCurrent && options.names) {
				const slot = chords.length - 1;
				const lowest = placeNote(Math.min(...snapshot.current), options.flats);
				const anchor =
					lowest.clef === "treble" ? anchors[slot].treble : anchors[slot].bass;
				const stave = lowest.clef === "treble" ? treble : bass;
				const label = [...snapshot.current]
					.sort((a, b) => a - b)
					.map((m) => placeNote(m, options.flats).label)
					.join(" · ");
				const fontSize = Number.parseFloat(token("--text-lg"));
				context.setFont(colors.font, fontSize, "bold");
				const textWidth = context.measureText(label).width;
				const anchorX = anchor.getAbsoluteX();
				const fitsRight = anchorX + 40 + textWidth <= WIDTH - 20;
				const x = fitsRight ? anchorX + 40 : anchorX - 40 - textWidth;
				const y = stave.getYForLine(2) + fontSize / 3;
				context.setFillStyle(colors.background);
				context.fillRect(x - 8, y - fontSize, textWidth + 16, fontSize * 1.5);
				context.setFillStyle(colors.text);
				context.fillText(label, x, y);
			}
		},
	};
}
