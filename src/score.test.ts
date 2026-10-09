import { beforeEach, describe, expect, it } from "vitest";
import { createScore } from "./score";

let host: HTMLElement;

beforeEach(() => {
	document.body.innerHTML = '<div id="host"></div>';
	host = document.querySelector("#host") as HTMLElement;
});

const options = { flats: false, names: false };
const empty = { current: [], history: [] };

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
		score.render({ current: [60], history: [[64]] }, options);
		expect(host.querySelectorAll(".clefs")).toHaveLength(1);
	});

	it("cache la copie aux lecteurs d'écran", () => {
		createScore(host).render(empty, options);
		expect(host.querySelector(".clefs")?.getAttribute("aria-hidden")).toBe(
			"true",
		);
	});
});
