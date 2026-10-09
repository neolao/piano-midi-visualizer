import { Barline, Renderer, Stave, TickContext } from "vexflow";
import type { ChordSnapshot } from "./chords";
import type { Grid } from "./grid";
import { QUARTER_NOTE, quantizeDuration } from "./rhythm";
import {
	BASS_Y,
	buildChordNote,
	createScore,
	HEIGHT,
	LINE_GAP,
	LINE_WIDTH,
	type ScoreOptions,
	scoreColors,
	TREBLE_Y,
	token,
} from "./score";
import { placeNote } from "./staff";

/** Largeur d'un temps à l'écran. */
export const BEAT_PX = 110;
/** Position du temps présent, en part de la largeur visible à droite des clés. */
const CURSOR_RATIO = 0.4;
/** Temps dessinés d'avance à droite du temps présent. */
const AHEAD_BEATS = 24;
/** On redessine quand il reste moins que l'écran plus cette marge de temps dessinés. */
const REFRESH_MARGIN_BEATS = 4;
const SVG_NS = "http://www.w3.org/2000/svg";

export interface TimelineView {
	grid: Grid;
	options: ScoreOptions;
	/** Horloge de la page (ms) : la même que celle des accords. */
	nowMs(): number;
}

export interface Timeline {
	show(snapshot: ChordSnapshot, view: TimelineView): void;
	/** Replace la piste sous le temps présent, et la redessine si elle est presque épuisée. */
	sync(): void;
	stop(): void;
}

interface Dependencies {
	raf?: (callback: () => void) => number;
	caf?: (handle: number) => void;
	width?: () => number;
	reducedMotion?: () => boolean;
}

function div(className: string): HTMLDivElement {
	const el = document.createElement("div");
	el.className = className;
	return el;
}

function line(
	className: string,
	x: number,
	y1: number,
	y2: number,
	stroke: string,
	beat: number,
): SVGLineElement {
	const el = document.createElementNS(SVG_NS, "line");
	el.setAttribute("class", className);
	el.setAttribute("x1", String(x));
	el.setAttribute("x2", String(x));
	el.setAttribute("y1", String(y1));
	el.setAttribute("y2", String(y2));
	el.setAttribute("stroke", stroke);
	el.setAttribute("stroke-width", String(LINE_WIDTH));
	el.dataset.beat = String(beat);
	return el;
}

/** Copie des clés et de la mesure, collée à gauche pendant que la piste défile. */
function buildHead(
	options: ScoreOptions,
): { svg: SVGSVGElement; width: number } | null {
	const scratch = document.createElement("div");
	createScore(scratch).render(
		{ current: [], history: [], durations: [], starts: [], currentStart: null },
		options,
	);
	const svg = scratch.querySelector<SVGSVGElement>(".clefs svg");
	if (!svg) return null;
	const width = Math.ceil(
		Number.parseFloat(svg.getAttribute("viewBox")?.split(" ")[2] ?? "0"),
	);
	svg.style.removeProperty("--clef-ratio");
	svg.style.width = `${width}px`;
	svg.style.height = `${HEIGHT}px`;
	svg.style.minWidth = "0";
	return { svg, width };
}

export function createTimeline(
	host: HTMLElement,
	deps: Dependencies = {},
): Timeline {
	const raf = deps.raf ?? ((cb) => requestAnimationFrame(cb));
	const caf = deps.caf ?? ((handle) => cancelAnimationFrame(handle));
	const width = deps.width ?? (() => host.clientWidth || 1000);
	const reducedMotion =
		deps.reducedMotion ??
		(() =>
			window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

	host.setAttribute("aria-hidden", "true");
	const headHost = div("timeline-head");
	const viewport = div("timeline-view");
	const track = div("timeline-track");
	const cursor = div("timeline-cursor");
	viewport.append(track);
	host.replaceChildren(headHost, viewport, cursor);

	let snapshot: ChordSnapshot | null = null;
	let view: TimelineView | null = null;
	let headWidth = 0;
	let headSignature = "";
	let drawnLeft = 0;
	let drawnRight = 0;
	let cursorX = 0;
	let visibleBeats = 0;
	let handle: number | null = null;

	const nowBeat = (): number => {
		if (!view) return 0;
		const beat = view.grid.beatAt(view.nowMs());
		if (!Number.isFinite(beat)) return 0;
		return reducedMotion() ? Math.floor(beat) : beat;
	};

	const place = () => {
		const offset = cursorX - (nowBeat() - drawnLeft) * BEAT_PX;
		track.style.transform = `translateX(${offset}px)`;
	};

	const draw = () => {
		if (!snapshot || !view) return;
		const { grid, options } = view;
		if (headSignature !== options.signature) {
			const head = buildHead(options);
			headHost.replaceChildren(...(head ? [head.svg] : []));
			headWidth = head?.width ?? 0;
			headSignature = options.signature;
		}
		const viewWidth = Math.max(1, width() - headWidth);
		cursorX = Math.round(viewWidth * CURSOR_RATIO);
		visibleBeats = Math.ceil(viewWidth / BEAT_PX);
		viewport.style.left = `${headWidth}px`;
		cursor.style.left = `${headWidth + cursorX}px`;

		const now = nowBeat();
		drawnLeft = Math.floor(now - cursorX / BEAT_PX) - 1;
		drawnRight = Math.ceil(now + visibleBeats + AHEAD_BEATS);
		const trackWidth = (drawnRight - drawnLeft) * BEAT_PX;
		const xOf = (beat: number) => (beat - drawnLeft) * BEAT_PX;

		track.replaceChildren();
		track.dataset.leftBeat = String(drawnLeft);
		const colors = scoreColors();
		const renderer = new Renderer(
			track as HTMLDivElement,
			Renderer.Backends.SVG,
		);
		renderer.resize(trackWidth, HEIGHT);
		const context = renderer.getContext();
		const svg = track.querySelector("svg");
		svg?.setAttribute("aria-hidden", "true");
		svg?.style.setProperty("width", `${trackWidth}px`);
		svg?.style.setProperty("height", `${HEIGHT}px`);
		svg?.style.setProperty("min-width", "0");

		const lineStyle = {
			strokeStyle: colors.line,
			fillStyle: colors.line,
			lineWidth: LINE_WIDTH,
		};
		const staves = [TREBLE_Y, BASS_Y].map((y) => {
			const stave = new Stave(0, y, trackWidth, {
				spacingBetweenLinesPx: LINE_GAP,
			});
			stave.setBegBarType(Barline.type.NONE);
			stave.setEndBarType(Barline.type.NONE);
			stave.setStyle(lineStyle);
			stave.setContext(context).draw();
			return stave;
		});
		const [treble, bass] = staves;

		const top = treble.getYForLine(0);
		const bottom = bass.getYForLine(4);
		const bars = new Set(grid.barBeats(drawnLeft, drawnRight));
		if (grid.active && svg) {
			const gapTop = treble.getYForLine(4) + LINE_GAP;
			for (
				let beat = Math.max(0, Math.ceil(drawnLeft));
				beat <= drawnRight;
				beat++
			) {
				const accent = bars.has(beat);
				const tick = line(
					"timeline-beat",
					xOf(beat),
					gapTop,
					gapTop + (accent ? 30 : 14),
					colors.line,
					beat,
				);
				tick.dataset.accent = String(accent);
				svg.append(tick);
			}
			for (const beat of bars) {
				svg.append(
					line("timeline-bar", xOf(beat), top, bottom, colors.line, beat),
				);
			}
		}

		const chords =
			snapshot.current.length > 0
				? [...snapshot.history, snapshot.current]
				: snapshot.history;
		const starts = [
			...snapshot.starts,
			...(snapshot.currentStart === null ? [] : [snapshot.currentStart]),
		];
		chords.forEach((chord, i) => {
			const isCurrent =
				snapshot !== null &&
				snapshot.current.length > 0 &&
				i === chords.length - 1;
			const start = starts[i];
			if (start === undefined) return;
			const beat = grid.beatAt(start);
			if (!Number.isFinite(beat) || beat < drawnLeft - 1 || beat > drawnRight)
				return;
			const value = isCurrent
				? QUARTER_NOTE
				: quantizeDuration(
						snapshot?.durations[i] ?? 0,
						options.tempo,
						options.signature,
					);
			for (const [clef, stave] of [
				["treble", treble],
				["bass", bass],
			] as const) {
				const note = buildChordNote(
					clef,
					chord,
					isCurrent,
					value,
					options.flats,
					colors,
				);
				if (!note) continue;
				note.setStave(stave);
				new TickContext().addTickable(note).preFormat().setX(xOf(beat));
				note.setContext(context).draw();
			}
			if (isCurrent && options.names) {
				const lowest = placeNote(Math.min(...chord), options.flats);
				const label = [...chord]
					.sort((a, b) => a - b)
					.map((m) => placeNote(m, options.flats).label)
					.join(" · ");
				const fontSize = Number.parseFloat(token("--text-lg"));
				context.setFont(colors.font, fontSize, "bold");
				const textWidth = context.measureText(label).width;
				const x = xOf(beat) + 40;
				const y =
					(lowest.clef === "treble" ? treble : bass).getYForLine(2) +
					fontSize / 3;
				context.setFillStyle(colors.background);
				context.fillRect(x - 8, y - fontSize, textWidth + 16, fontSize * 1.5);
				context.setFillStyle(colors.text);
				context.fillText(label, x, y);
			}
		});
		place();
	};

	const sync = () => {
		if (!view) return;
		const remaining = drawnRight - nowBeat();
		if (remaining < visibleBeats + REFRESH_MARGIN_BEATS) draw();
		else place();
	};

	const frame = () => {
		sync();
		handle = raf(frame);
	};

	return {
		show(nextSnapshot, nextView) {
			snapshot = nextSnapshot;
			view = nextView;
			draw();
			if (handle === null) handle = raf(frame);
		},
		sync,
		stop() {
			if (handle !== null) caf(handle);
			handle = null;
		},
	};
}
