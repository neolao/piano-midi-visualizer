import { describe, expect, it } from "vitest";
import { createHeldNotes } from "./held-notes";

describe("createHeldNotes", () => {
	it("ajoute une note jouée et la retire quand elle est relâchée", () => {
		const held = createHeldNotes();
		held.press(60);
		expect(held.sorted()).toEqual([60]);
		held.release(60);
		expect(held.sorted()).toEqual([]);
	});

	it("renvoie les notes triées par hauteur", () => {
		const held = createHeldNotes();
		for (const n of [67, 60, 64]) held.press(n);
		expect(held.sorted()).toEqual([60, 64, 67]);
	});

	it("ne duplique pas une note jouée deux fois sans relâchement", () => {
		const held = createHeldNotes();
		held.press(60);
		held.press(60);
		expect(held.sorted()).toEqual([60]);
	});

	it("ne change rien quand on relâche une note qui n'est pas tenue", () => {
		const held = createHeldNotes();
		held.press(60);
		held.release(61);
		expect(held.sorted()).toEqual([60]);
	});

	it("relâche tout d'un coup", () => {
		const held = createHeldNotes();
		held.press(60);
		held.press(64);
		held.clear();
		expect(held.sorted()).toEqual([]);
		expect(held.size).toBe(0);
	});
});
