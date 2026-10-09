import { describe, expect, it } from "vitest";
import { createChordTracker } from "./chords";

function setup(options = {}) {
	return createChordTracker({ groupMs: 60, maxHistory: 3, ...options });
}

describe("createChordTracker", () => {
	it("regroupe des notes jouées à moins de 60 ms en un seul accord", () => {
		const t = setup();
		t.noteOn(60, 0);
		t.noteOn(64, 20);
		t.noteOn(67, 50);
		expect(t.snapshot().current).toEqual([60, 64, 67]);
		expect(t.snapshot().history).toEqual([]);
	});

	it("met l'accord dans l'historique quand toutes ses touches sont relâchées", () => {
		const t = setup();
		t.noteOn(60, 0);
		t.noteOn(64, 10);
		t.noteOff(60, 400);
		expect(t.snapshot().current).toEqual([60, 64]);
		t.noteOff(64, 500);
		expect(t.snapshot()).toEqual({
			current: [],
			history: [[60, 64]],
			durations: [500],
		});
	});

	it("démarre un nouvel accord quand une note arrive plus de 60 ms après", () => {
		const t = setup();
		t.noteOn(60, 0);
		t.noteOn(64, 200);
		expect(t.snapshot()).toEqual({
			current: [64],
			history: [[60]],
			durations: [200],
		});
	});

	it("garde l'accord tenu tant qu'une touche reste enfoncée", () => {
		const t = setup();
		t.noteOn(60, 0);
		t.noteOn(64, 10);
		t.noteOff(64);
		expect(t.snapshot().current).toEqual([60, 64]);
	});

	it("ignore un second note on sur une note déjà tenue et un note off inconnu", () => {
		const t = setup();
		t.noteOn(60, 0);
		t.noteOn(60, 10);
		t.noteOff(99);
		expect(t.snapshot()).toEqual({
			current: [60],
			history: [],
			durations: [],
		});
	});

	it("borne l'historique en supprimant les plus anciens accords", () => {
		const t = setup();
		for (let i = 0; i < 6; i++) {
			t.noteOn(60 + i, i * 1000);
			t.noteOff(60 + i);
		}
		expect(t.snapshot().history).toEqual([[63], [64], [65]]);
		expect(t.snapshot().durations).toHaveLength(3);
	});

	it("relâche toutes les notes d'un coup quand le piano disparaît", () => {
		const t = setup();
		t.noteOn(60, 0);
		t.noteOn(64, 10);
		t.releaseAll(300);
		expect(t.snapshot()).toEqual({
			current: [],
			history: [[60, 64]],
			durations: [300],
		});
		expect(t.heldCount).toBe(0);
	});

	it("efface la partition et permet de la restaurer", () => {
		const t = setup();
		t.noteOn(60, 0);
		t.noteOff(60, 250);
		t.noteOn(64, 500);
		const before = t.clear();
		expect(t.snapshot()).toEqual({ current: [], history: [], durations: [] });
		t.restore(before);
		expect(t.snapshot()).toEqual({
			current: [64],
			history: [[60]],
			durations: [250],
		});
	});

	it("continue de suivre la touche tenue après un effacement", () => {
		const t = setup();
		t.noteOn(60, 0);
		t.clear();
		t.noteOff(60);
		expect(t.snapshot()).toEqual({ current: [], history: [], durations: [] });
	});

	it("mesure la durée d'un accord jusqu'au relâchement de sa dernière touche", () => {
		const t = setup();
		t.noteOn(60, 1000);
		t.noteOn(64, 1020);
		t.noteOff(60, 1500);
		t.noteOff(64, 2300);
		expect(t.snapshot().durations).toEqual([1300]);
	});

	it("garde autant de durées que d'accords quand l'historique est borné", () => {
		const t = setup();
		for (let i = 0; i < 6; i++) {
			t.noteOn(60 + i, i * 1000);
			t.noteOff(60 + i, i * 1000 + 100 * (i + 1));
		}
		expect(t.snapshot().history).toEqual([[63], [64], [65]]);
		expect(t.snapshot().durations).toEqual([400, 500, 600]);
	});

	it("n'enregistre jamais de durée négative", () => {
		const t = setup();
		t.noteOn(60, 1000);
		t.noteOff(60, 900);
		expect(t.snapshot().durations).toEqual([0]);
	});
});
