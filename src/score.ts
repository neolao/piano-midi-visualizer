import {
	Accidental,
	Formatter,
	GhostNote,
	Renderer,
	Stave,
	StaveConnector,
	StaveNote,
	Voice,
} from "vexflow";
import type { ChordSnapshot } from "./chords";
import { placeNote } from "./staff";

/** Nombre d'accords visibles : l'historique défile quand il est plein. */
export const SLOTS = 8;

export interface ScoreOptions {
	flats: boolean;
	names: boolean;
}

export interface Score {
	render(snapshot: ChordSnapshot, options: ScoreOptions): void;
}

const WIDTH = 1000;
const LINE_GAP = 12;
/** Épaisseur des portées : `--border-width` (2 px). */
const LINE_WIDTH = 2;
/** Contour de la note en cours : 3 px (.ux/style.md). */
const CURRENT_STROKE = 3;
const TREBLE_Y = 0;
const BASS_Y = 130;
const HEIGHT = 270;

function token(name: string): string {
	return (
		getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
		"currentColor"
	);
}

export function createScore(container: HTMLElement): Score {
	return {
		render(snapshot, options) {
			const colors = {
				line: token("--color-border"),
				text: token("--color-text"),
				history: token("--color-note-history"),
				current: token("--color-primary"),
				background: token("--color-surface-raised"),
				font: token("--font-ui"),
			};
			const hasCurrent = snapshot.current.length > 0;
			const past = snapshot.history.slice(-(SLOTS - (hasCurrent ? 1 : 0)));
			const chords = hasCurrent ? [...past, snapshot.current] : past;

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
			}).addClef("treble");
			const bass = new Stave(10, BASS_Y, WIDTH - 20, {
				spacingBetweenLinesPx: LINE_GAP,
			}).addClef("bass");
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
			) => {
				const placed = [...chord]
					.sort((a, b) => a - b)
					.map((m) => placeNote(m, options.flats));
				const inClef = placed.filter((n) => n.clef === clef);
				if (inClef.length === 0) return new GhostNote({ duration: "w" });
				const style = isCurrent
					? {
							fillStyle: colors.current,
							strokeStyle: colors.text,
							lineWidth: CURRENT_STROKE,
						}
					: { fillStyle: colors.history, strokeStyle: colors.history };
				const note = new StaveNote({
					keys: inClef.map((n) => n.vexKey),
					duration: "w",
					clef,
				});
				inClef.forEach((n, i) => {
					if (n.accidental === 0) return;
					const accidental = new Accidental(n.accidental > 0 ? "#" : "b");
					accidental.setStyle(style);
					note.addModifier(accidental, i);
				});
				note.setStyle(style);
				return note;
			};

			const trebleNotes: (StaveNote | GhostNote)[] = [];
			const bassNotes: (StaveNote | GhostNote)[] = [];
			for (let slot = 0; slot < SLOTS; slot++) {
				const chord = chords[slot];
				const isCurrent = hasCurrent && slot === chords.length - 1;
				trebleNotes.push(
					chord
						? notesFor("treble", chord, isCurrent)
						: new GhostNote({ duration: "w" }),
				);
				bassNotes.push(
					chord
						? notesFor("bass", chord, isCurrent)
						: new GhostNote({ duration: "w" }),
				);
			}

			const voice = (notes: (StaveNote | GhostNote)[]) =>
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

			if (hasCurrent && options.names) {
				const slot = chords.length - 1;
				const lowest = placeNote(Math.min(...snapshot.current), options.flats);
				const anchor =
					lowest.clef === "treble" ? trebleNotes[slot] : bassNotes[slot];
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
