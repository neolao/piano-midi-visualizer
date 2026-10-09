import { describe, expect, it } from "vitest";
import { createGrid } from "./grid";

describe("createGrid", () => {
	it("est inactive tant que le métronome n'a pas démarré", () => {
		expect(createGrid().active).toBe(false);
	});

	it("compte un temps par seconde à 60 battements par minute", () => {
		const grid = createGrid();
		grid.start(1000, 60, 4);
		expect(grid.beatAt(1000)).toBe(0);
		expect(grid.beatAt(3500)).toBeCloseTo(2.5, 10);
	});

	it("compte deux temps par seconde à 120", () => {
		const grid = createGrid();
		grid.start(0, 120, 4);
		expect(grid.beatAt(1500)).toBeCloseTo(3, 10);
	});

	it("place avant le départ les instants antérieurs, en temps négatifs", () => {
		const grid = createGrid();
		grid.start(1000, 60, 4);
		expect(grid.beatAt(0)).toBeCloseTo(-1, 10);
	});

	it("garde la continuité quand le tempo change", () => {
		const grid = createGrid();
		grid.start(0, 60, 4);
		grid.setTempo(2000, 120);
		expect(grid.beatAt(2000)).toBeCloseTo(2, 10);
		expect(grid.beatAt(3000)).toBeCloseTo(4, 10);
		expect(grid.beatAt(1000)).toBeCloseTo(1, 10);
	});

	it("marque une barre de mesure tous les quatre temps en 4/4", () => {
		const grid = createGrid();
		grid.start(0, 60, 4);
		expect(grid.barBeats(-1, 9)).toEqual([0, 4, 8]);
	});

	it("marque une barre tous les trois temps en 3/4", () => {
		const grid = createGrid();
		grid.start(0, 60, 3);
		expect(grid.barBeats(0, 7)).toEqual([0, 3, 6]);
	});

	it("recommence le décompte des mesures au changement de mesure", () => {
		const grid = createGrid();
		grid.start(0, 60, 4);
		grid.setMeasure(6000, 3);
		expect(grid.barBeats(0, 13)).toEqual([0, 4, 6, 9, 12]);
	});

	it("ne marque que les barres de l'intervalle demandé, bornes comprises", () => {
		const grid = createGrid();
		grid.start(0, 60, 4);
		expect(grid.barBeats(4, 8)).toEqual([4, 8]);
		expect(grid.barBeats(4.5, 7.5)).toEqual([]);
	});

	it("ne marque aucune barre avant le départ", () => {
		const grid = createGrid();
		grid.start(0, 60, 4);
		expect(grid.barBeats(-9, -1)).toEqual([]);
	});

	it("rend une liste vide et un temps nul quand elle est inactive", () => {
		const grid = createGrid();
		expect(grid.barBeats(0, 10)).toEqual([]);
		expect(grid.beatAt(5000)).toBe(0);
	});

	it("s'arrête et peut repartir à zéro", () => {
		const grid = createGrid();
		grid.start(0, 60, 4);
		grid.stop();
		expect(grid.active).toBe(false);
		grid.start(10000, 60, 4);
		expect(grid.beatAt(10000)).toBe(0);
	});

	it("ignore un tempo ou une mesure invalide", () => {
		const grid = createGrid();
		grid.start(0, 60, 4);
		grid.setTempo(1000, 0);
		grid.setTempo(1000, Number.NaN);
		grid.setMeasure(1000, 0);
		expect(grid.beatAt(2000)).toBeCloseTo(2, 10);
		expect(grid.barBeats(0, 4)).toEqual([0, 4]);
	});
});
