import { beforeEach, describe, expect, it } from "vitest";
import { createScore } from "./score";

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
	current: number[],
	history: number[][] = [],
	durations: number[] = [],
) => ({
	current,
	history,
	durations,
	starts: history.map((_, i) => i * 1000),
	currentStart: current.length > 0 ? history.length * 1000 : null,
});
const empty = snap([]);

describe("createScore — clés fixes", () => {
	it("ajoute une copie fixe des clés qui ne montre que le bord gauche de la portée", () => {
		createScore(host).render(empty, options);
		const overlay = host.querySelector(".clefs svg") as SVGElement;
		expect(overlay).toBeTruthy();
		const [x, y, width] = (overlay.getAttribute("viewBox") ?? "")
			.split(" ")
			.map(Number);
		expect([x, y]).toEqual([0, 0]);
		expect(width).toBeGreaterThan(10);
		expect(width).toBeLessThan(120);
	});

	it("garde une seule copie des clés après plusieurs rendus", () => {
		const score = createScore(host);
		score.render(empty, options);
		score.render(snap([60], [[64]], [1000]), options);
		expect(host.querySelectorAll(".clefs")).toHaveLength(1);
	});

	it("cache la copie aux lecteurs d'écran", () => {
		createScore(host).render(empty, options);
		expect(host.querySelector(".clefs")?.getAttribute("aria-hidden")).toBe(
			"true",
		);
	});
});

describe("createScore — rythme", () => {
	const quarters = (count: number) => ({
		...snap(
			[],
			Array.from({ length: count }, (_, i) => [60 + i]),
			Array.from({ length: count }, () => 1000),
		),
	});
	const count = (selector: string) =>
		host.querySelectorAll(`:scope > svg ${selector}`).length;
	/** Barres de mesure : hors les 2 bords de chacune des 2 portées. */
	const bars = () => count(".vf-stavebarline") - 4;

	it("affiche l'indication de mesure sur les deux portées", () => {
		createScore(host).render(empty, { ...options, signature: "3/4" });
		expect(count(".vf-timesignature")).toBeGreaterThanOrEqual(2);
	});

	it("trace une barre de mesure après quatre noires en 4/4", () => {
		createScore(host).render(quarters(4), options);
		expect(bars()).toBe(2);
	});

	it("trace une barre de plus par mesure complète", () => {
		createScore(host).render(quarters(8), options);
		expect(bars()).toBe(4);
	});

	it("ne trace pas de barre tant que la mesure n'est pas pleine", () => {
		createScore(host).render(quarters(3), options);
		expect(bars()).toBe(0);
	});

	it("change le découpage avec la mesure : trois noires remplissent une mesure en 3/4", () => {
		createScore(host).render(quarters(3), { ...options, signature: "3/4" });
		expect(bars()).toBe(2);
	});

	it("dessine une hampe pour une noire et aucune pour une ronde", () => {
		const render = (ms: number) => {
			createScore(host).render(snap([], [[64]], [ms]), options);
			return count(".vf-stem");
		};
		expect(render(1000)).toBeGreaterThan(0);
		expect(render(4000)).toBe(0);
	});
});
