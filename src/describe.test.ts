import { describe, expect, it } from "vitest";
import { describeChord, describeScore } from "./describe";

describe("describeChord", () => {
	it("nomme les notes avec leur octave, du grave à l'aigu", () => {
		expect(describeChord([67, 60, 64], false)).toBe("Do 4, Mi 4, Sol 4");
	});

	it("écrit les altérations en toutes lettres selon le réglage", () => {
		expect(describeChord([66], false)).toBe("Fa dièse 4");
		expect(describeChord([66], true)).toBe("Sol bémol 4");
	});
});

describe("describeScore", () => {
	it("décrit l'accord en cours et la taille de l'historique", () => {
		expect(describeScore([60, 64], [[62], [65]], false)).toBe(
			"Accord en cours : Do 4, Mi 4. Historique : 2 accords.",
		);
	});

	it("indique l'absence de note en cours et un historique vide", () => {
		expect(describeScore([], [], false)).toBe(
			"Aucune note en cours. Historique vide.",
		);
	});

	it("accorde « accord » au singulier", () => {
		expect(describeScore([], [[60]], false)).toBe(
			"Aucune note en cours. Historique : 1 accord.",
		);
	});
});
