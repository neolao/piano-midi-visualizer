import { describe, expect, it } from "vitest";
import {
	beatsPerMeasure,
	clampTempo,
	DEFAULT_SIGNATURE,
	DEFAULT_TEMPO,
	isSignature,
	MAX_TEMPO,
	MIN_TEMPO,
	measureEighths,
	measureEnds,
	quantizeDuration,
	SIGNATURES,
	splitMeasures,
} from "./rhythm";

describe("quantizeDuration", () => {
	it("donne une noire pour 1 s à 60 battements par minute en 4/4", () => {
		expect(quantizeDuration(1000, 60, "4/4").name).toBe("noire");
	});

	it("donne une blanche pour 2 s et une croche pour 0,5 s", () => {
		expect(quantizeDuration(2000, 60, "4/4").name).toBe("blanche");
		expect(quantizeDuration(500, 60, "4/4").name).toBe("croche");
	});

	it("donne une ronde pour 4 s", () => {
		expect(quantizeDuration(4000, 60, "4/4")).toMatchObject({
			name: "ronde",
			eighths: 8,
			vex: "w",
		});
	});

	it("arrondit à la valeur la plus proche", () => {
		expect(quantizeDuration(1200, 60, "4/4").name).toBe("noire");
		expect(quantizeDuration(1700, 60, "4/4").name).toBe("noire pointée");
	});

	it("suit le tempo : même durée, tempo double, valeur double", () => {
		expect(quantizeDuration(1000, 120, "4/4").name).toBe("blanche");
	});

	it("compte le temps en 6/8 par groupes de trois croches", () => {
		expect(quantizeDuration(1000, 60, "6/8").name).toBe("noire pointée");
		expect(quantizeDuration(333, 60, "6/8").name).toBe("croche");
	});

	it("ne descend jamais sous la double croche", () => {
		expect(quantizeDuration(0, 80, "4/4").name).toBe("double croche");
	});

	it("plafonne à la ronde", () => {
		expect(quantizeDuration(60000, 60, "4/4").name).toBe("ronde");
	});

	it("traite une durée négative ou non numérique comme nulle", () => {
		expect(quantizeDuration(-5, 60, "4/4").name).toBe("double croche");
		expect(quantizeDuration(Number.NaN, 60, "4/4").name).toBe("double croche");
	});
});

describe("mesures", () => {
	it("donne le nombre de temps et la longueur en croches de chaque mesure", () => {
		expect(SIGNATURES).toEqual(["2/4", "3/4", "4/4", "6/8"]);
		expect(SIGNATURES.map(beatsPerMeasure)).toEqual([2, 3, 4, 2]);
		expect(SIGNATURES.map(measureEighths)).toEqual([4, 6, 8, 6]);
	});

	it("reconnaît une mesure valide et refuse le reste", () => {
		expect(isSignature("3/4")).toBe(true);
		expect(isSignature("5/4")).toBe(false);
		expect(isSignature(34)).toBe(false);
	});

	it("regroupe des durées en mesures et ferme une mesure pleine", () => {
		expect(splitMeasures([2, 2, 2, 2, 2], "4/4")).toEqual([[0, 1, 2, 3], [4]]);
	});

	it("ferme aussi la mesure quand une note la dépasse", () => {
		expect(splitMeasures([6, 2, 2], "4/4")).toEqual([[0, 1], [2]]);
	});

	it("rend une liste vide pour aucune durée", () => {
		expect(splitMeasures([], "2/4")).toEqual([]);
	});

	it("commence une mesure par durée de 2 croches en 2/4", () => {
		expect(splitMeasures([2, 2, 2], "2/4")).toEqual([[0, 1], [2]]);
	});
});

describe("measureEnds", () => {
	it("marque la fin de chaque mesure complète", () => {
		expect([...measureEnds([2, 2, 2, 2, 2, 2, 2, 2], "4/4")]).toEqual([3, 7]);
	});

	it("ne marque pas une mesure encore incomplète", () => {
		expect([...measureEnds([2, 2, 2, 2, 2], "4/4")]).toEqual([3]);
	});

	it("marque une mesure dépassée par une longue note", () => {
		expect([...measureEnds([6, 4, 2], "4/4")]).toEqual([1]);
	});

	it("n'invente rien sans accord", () => {
		expect(measureEnds([], "3/4").size).toBe(0);
	});
});

describe("tempo", () => {
	it("garde un tempo dans les bornes", () => {
		expect(clampTempo(96)).toBe(96);
		expect(clampTempo(10)).toBe(MIN_TEMPO);
		expect(clampTempo(999)).toBe(MAX_TEMPO);
	});

	it("arrondit et retombe sur le défaut quand la valeur est invalide", () => {
		expect(clampTempo(90.6)).toBe(91);
		expect(clampTempo(Number.NaN)).toBe(DEFAULT_TEMPO);
	});

	it("a pour défaut 4/4 à 80", () => {
		expect([DEFAULT_SIGNATURE, DEFAULT_TEMPO, MIN_TEMPO, MAX_TEMPO]).toEqual([
			"4/4",
			80,
			40,
			200,
		]);
	});
});
