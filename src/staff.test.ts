import { describe, expect, it } from "vitest";
import { placeNote } from "./staff";

describe("placeNote", () => {
	it("place le do central (60) en clé de sol sur c/4", () => {
		expect(placeNote(60, false)).toMatchObject({
			clef: "treble",
			vexKey: "c/4",
			accidental: 0,
			label: "Do",
			octave: 4,
		});
	});

	it("place les notes sous le do central en clé de fa", () => {
		expect(placeNote(59, false)).toMatchObject({
			clef: "bass",
			vexKey: "b/3",
			label: "Si",
		});
	});

	it("écrit 61 en do dièse ou en ré bémol selon le réglage", () => {
		expect(placeNote(61, false)).toMatchObject({
			vexKey: "c#/4",
			accidental: 1,
			label: "Do♯",
			spoken: "Do dièse 4",
		});
		expect(placeNote(61, true)).toMatchObject({
			vexKey: "db/4",
			accidental: -1,
			label: "Ré♭",
			spoken: "Ré bémol 4",
		});
	});

	it("écrit 70 en la dièse ou en si bémol", () => {
		expect(placeNote(70, false)).toMatchObject({
			vexKey: "a#/4",
			label: "La♯",
		});
		expect(placeNote(70, true)).toMatchObject({ vexKey: "bb/4", label: "Si♭" });
	});

	it("donne un rang diatonique croissant avec la hauteur écrite", () => {
		expect(placeNote(62, false).diatonic - placeNote(60, false).diatonic).toBe(
			1,
		);
		expect(placeNote(72, false).diatonic - placeNote(60, false).diatonic).toBe(
			7,
		);
	});

	it("gère les bornes 21 et 108 du piano ainsi que 0 et 127", () => {
		expect(placeNote(21, false)).toMatchObject({
			clef: "bass",
			vexKey: "a/0",
			label: "La",
		});
		expect(placeNote(108, false)).toMatchObject({
			clef: "treble",
			vexKey: "c/8",
		});
		expect(placeNote(0, false).octave).toBe(-1);
		expect(placeNote(127, false).label).toBe("Sol");
	});

	it("refuse un numéro hors de 0 à 127", () => {
		expect(() => placeNote(128, false)).toThrow(RangeError);
		expect(() => placeNote(-1, false)).toThrow(RangeError);
		expect(() => placeNote(60.5, false)).toThrow(RangeError);
	});
});
