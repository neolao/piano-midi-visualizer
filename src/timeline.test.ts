import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChordSnapshot } from "./chords";
import { createGrid } from "./grid";
import { BEAT_PX, createTimeline } from "./timeline";

let host: HTMLElement;

beforeEach(() => {
	document.body.innerHTML = '<div id="host"></div>';
	host = document.querySelector("#host") as HTMLElement;
});

const options = {
	flats: false,
	names: false,
	signature: "4/4" as const,
	tempo: 60,
};
const snap = (
	history: number[][] = [],
	starts: number[] = [],
	current: number[] = [],
	currentStart: number | null = null,
): ChordSnapshot => ({
	current,
	history,
	durations: history.map(() => 1000),
	starts,
	currentStart,
});

/** Grille à 60 battements par minute : un temps par seconde, départ à 0. */
function setup(nowMs: { value: number }, extra = {}) {
	const grid = createGrid();
	grid.start(0, 60, 4);
	const raf = vi.fn((_cb: () => void) => 1);
	const caf = vi.fn();
	const timeline = createTimeline(host, {
		raf,
		caf,
		width: () => 1000,
		reducedMotion: () => false,
		...extra,
	});
	const view = { grid, options, nowMs: () => nowMs.value };
	return { timeline, view, raf, caf, grid };
}

const track = () => host.querySelector(".timeline-track") as HTMLElement;
const translate = () =>
	Number(/translateX\((-?[\d.]+)px\)/.exec(track().style.transform)?.[1]);
const left = () => Number(track().dataset.leftBeat);
const bars = () =>
	[...host.querySelectorAll(".timeline-bar")].map((b) =>
		Number((b as HTMLElement).dataset.beat),
	);

describe("createTimeline — structure", () => {
	it("affiche le curseur fixe, les clés et la piste qui défile", () => {
		const { timeline, view } = setup({ value: 0 });
		timeline.show(snap(), view);
		expect(host.querySelector(".timeline-cursor")).toBeTruthy();
		expect(host.querySelector(".timeline-head svg")).toBeTruthy();
		expect(track().querySelector("svg")).toBeTruthy();
	});

	it("cache le curseur et les clés aux lecteurs d'écran", () => {
		const { timeline, view } = setup({ value: 0 });
		timeline.show(snap(), view);
		expect(host.getAttribute("aria-hidden")).toBe("true");
	});

	it("trace les barres de mesure sur les temps 0, 4, 8…", () => {
		const { timeline, view } = setup({ value: 2000 });
		timeline.show(snap(), view);
		expect(bars()).toContain(0);
		expect(bars()).toContain(4);
		expect(bars()).toContain(8);
		expect(bars().every((b) => b % 4 === 0)).toBe(true);
	});

	it("change la distance entre les barres avec la mesure", () => {
		const { timeline, view, grid } = setup({ value: 2000 });
		grid.start(0, 60, 3);
		timeline.show(snap(), view);
		expect(bars().every((b) => b % 3 === 0)).toBe(true);
	});

	it("marque chaque temps, le premier temps de la mesure en plus long", () => {
		const { timeline, view } = setup({ value: 2000 });
		timeline.show(snap(), view);
		const ticks = [...host.querySelectorAll(".timeline-beat")] as HTMLElement[];
		const byBeat = new Map(ticks.map((t) => [Number(t.dataset.beat), t]));
		expect(byBeat.has(1) && byBeat.has(2) && byBeat.has(3)).toBe(true);
		expect(byBeat.get(4)?.dataset.accent).toBe("true");
		expect(byBeat.get(5)?.dataset.accent).toBe("false");
	});
});

describe("createTimeline — défilement", () => {
	it("décale la piste vers la gauche d'un temps par seconde à 60 par minute", () => {
		const now = { value: 2000 };
		const { timeline, view } = setup(now);
		timeline.show(snap(), view);
		const before = translate();
		now.value = 3000;
		timeline.sync();
		expect(before - translate()).toBeCloseTo(BEAT_PX, 5);
	});

	it("garde le temps présent sous le curseur", () => {
		const now = { value: 2500 };
		const { timeline, view } = setup(now);
		timeline.show(snap(), view);
		const x = (2.5 - left()) * BEAT_PX + translate();
		const cursor = host.querySelector(".timeline-cursor") as HTMLElement;
		const head = host.querySelector(".timeline-head svg") as SVGElement;
		expect(x + Number.parseFloat(head.style.width)).toBeCloseTo(
			Number.parseFloat(cursor.style.left),
			5,
		);
	});

	it("saute de temps en temps quand le mouvement est réduit", () => {
		const now = { value: 2400 };
		const { timeline, view } = setup(now, { reducedMotion: () => true });
		timeline.show(snap(), view);
		const a = translate();
		now.value = 2900;
		timeline.sync();
		expect(translate()).toBe(a);
		now.value = 3000;
		timeline.sync();
		expect(translate()).toBeCloseTo(a - BEAT_PX, 5);
	});

	it("se redessine quand la partie dessinée est presque épuisée", () => {
		const now = { value: 0 };
		const { timeline, view } = setup(now);
		timeline.show(snap(), view);
		const first = left();
		now.value = 60000;
		timeline.sync();
		expect(left()).toBeGreaterThan(first + 30);
		expect(bars()).toContain(60);
	});

	it("reste figé sur le temps fourni quand l'horloge est gelée", () => {
		const now = { value: 4000 };
		const { timeline, view } = setup(now);
		timeline.show(snap(), view);
		const frozen = translate();
		timeline.sync();
		timeline.sync();
		expect(translate()).toBe(frozen);
	});
});

describe("createTimeline — notes", () => {
	it("dessine chaque accord récent", () => {
		const { timeline, view } = setup({ value: 5000 });
		timeline.show(snap([[60], [64]], [3000, 4000]), view);
		expect(
			track().querySelectorAll(".vf-stavenote").length,
		).toBeGreaterThanOrEqual(2);
	});

	it("n'en dessine aucun avant qu'une note soit jouée", () => {
		const { timeline, view } = setup({ value: 5000 });
		timeline.show(snap(), view);
		expect(track().querySelectorAll(".vf-stavenote")).toHaveLength(0);
	});

	it("laisse de côté les accords sortis de l'écran à gauche", () => {
		const { timeline, view } = setup({ value: 60000 });
		timeline.show(snap([[60]], [1000]), view);
		expect(track().querySelectorAll(".vf-stavenote")).toHaveLength(0);
	});

	it("dessine aussi l'accord en cours", () => {
		const { timeline, view } = setup({ value: 5000 });
		timeline.show(snap([], [], [67], 4500), view);
		expect(track().querySelectorAll(".vf-stavenote").length).toBeGreaterThan(0);
	});

	it("supporte un horodatage invalide sans planter", () => {
		const { timeline, view } = setup({ value: 5000 });
		expect(() => timeline.show(snap([[60]], [Number.NaN]), view)).not.toThrow();
	});
});

describe("createTimeline — animation", () => {
	it("lance l'animation une seule fois et l'arrête", () => {
		const { timeline, view, raf, caf } = setup({ value: 0 });
		timeline.show(snap(), view);
		timeline.show(snap(), view);
		expect(raf).toHaveBeenCalledTimes(1);
		timeline.stop();
		expect(caf).toHaveBeenCalledTimes(1);
	});

	it("s'arrête sans erreur quand rien ne tourne", () => {
		const { timeline, caf } = setup({ value: 0 });
		timeline.stop();
		expect(caf).not.toHaveBeenCalled();
	});
});
