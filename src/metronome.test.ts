import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type ClickPlayer, createMetronome } from "./metronome";

interface Click {
	at: number;
	accent: boolean;
}

function fakePlayer(overrides: Partial<ClickPlayer> = {}) {
	const clicks: Click[] = [];
	const player: ClickPlayer = {
		now: () => Date.now() / 1000,
		click: (at, accent) => clicks.push({ at, accent }),
		resume: async () => true,
		...overrides,
	};
	return { player, clicks };
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(0);
});
afterEach(() => vi.useRealTimers());

const setup = (overrides: Partial<ClickPlayer> = {}) => {
	const { player, clicks } = fakePlayer(overrides);
	const beats: number[] = [];
	const metronome = createMetronome(player, (beat) => beats.push(beat));
	return { metronome, clicks, beats };
};

describe("createMetronome", () => {
	it("reste arrêté tant qu'on ne le démarre pas", async () => {
		const { metronome, clicks } = setup();
		await vi.advanceTimersByTimeAsync(5000);
		expect(metronome.running).toBe(false);
		expect(clicks).toEqual([]);
	});

	it("bat chaque seconde à 60 par minute, avec le premier temps accentué", async () => {
		const { metronome, clicks } = setup();
		metronome.setRhythm({ beats: 4, tempo: 60 });
		await metronome.start();
		await vi.advanceTimersByTimeAsync(3900);
		expect(clicks.map((c) => c.accent)).toEqual([true, false, false, false]);
		const gaps = clicks.slice(1).map((c, i) => c.at - clicks[i].at);
		for (const gap of gaps) expect(gap).toBeCloseTo(1, 5);
	});

	it("recommence à l'accent après la fin de la mesure", async () => {
		const { metronome, clicks } = setup();
		metronome.setRhythm({ beats: 2, tempo: 120 });
		await metronome.start();
		await vi.advanceTimersByTimeAsync(1900);
		expect(clicks.map((c) => c.accent)).toEqual([true, false, true, false]);
	});

	it("prévient du numéro du temps au moment où il sonne", async () => {
		const { metronome, beats } = setup();
		metronome.setRhythm({ beats: 3, tempo: 60 });
		await metronome.start();
		await vi.advanceTimersByTimeAsync(3500);
		expect(beats).toEqual([0, 1, 2, 0]);
	});

	it("applique un nouveau tempo aux temps suivants", async () => {
		const { metronome, clicks } = setup();
		metronome.setRhythm({ beats: 4, tempo: 60 });
		await metronome.start();
		await vi.advanceTimersByTimeAsync(200);
		metronome.setRhythm({ beats: 4, tempo: 120 });
		await vi.advanceTimersByTimeAsync(2000);
		const gaps = clicks.slice(1).map((c, i) => c.at - clicks[i].at);
		expect(gaps.at(-1)).toBeCloseTo(0.5, 5);
	});

	it("s'arrête net et ne sonne plus", async () => {
		const { metronome, clicks, beats } = setup();
		await metronome.start();
		await vi.advanceTimersByTimeAsync(700);
		metronome.stop();
		const count = clicks.length;
		const beatCount = beats.length;
		await vi.advanceTimersByTimeAsync(5000);
		expect(metronome.running).toBe(false);
		expect(clicks).toHaveLength(count);
		expect(beats).toHaveLength(beatCount);
	});

	it("ne démarre pas deux fois", async () => {
		const { metronome, clicks } = setup();
		await metronome.start();
		await metronome.start();
		await vi.advanceTimersByTimeAsync(100);
		expect(clicks).toHaveLength(1);
	});

	it("ne sonne pas quand le son est coupé mais continue de battre", async () => {
		const { metronome, clicks, beats } = setup();
		metronome.setMuted(true);
		await metronome.start();
		await vi.advanceTimersByTimeAsync(1000);
		expect(clicks).toEqual([]);
		expect(beats.length).toBeGreaterThan(0);
	});

	it("bat quand même, sans son, si le navigateur refuse l'audio", async () => {
		const { metronome, clicks, beats } = setup({ resume: async () => false });
		const result = await metronome.start();
		await vi.advanceTimersByTimeAsync(1000);
		expect(result).toEqual({ sound: false });
		expect(clicks).toEqual([]);
		expect(beats.length).toBeGreaterThan(0);
	});

	it("bat quand même si l'audio échoue à démarrer", async () => {
		const { metronome, beats } = setup({
			resume: async () => {
				throw new Error("audio");
			},
		});
		const result = await metronome.start();
		await vi.advanceTimersByTimeAsync(1000);
		expect(result).toEqual({ sound: false });
		expect(beats.length).toBeGreaterThan(0);
	});

	it("repart sur un temps accentué quand le nombre de temps par mesure change", async () => {
		const { metronome, clicks, beats } = setup();
		metronome.setRhythm({ beats: 4, tempo: 60 });
		await metronome.start();
		await vi.advanceTimersByTimeAsync(1500);
		metronome.setRhythm({ beats: 3, tempo: 60 });
		await vi.advanceTimersByTimeAsync(1000);
		expect(beats.slice(-1)).toEqual([0]);
		expect(clicks.at(-1)?.accent).toBe(true);
	});

	it("garde le même fil de temps quand seul le tempo change", async () => {
		const { metronome, beats } = setup();
		metronome.setRhythm({ beats: 4, tempo: 60 });
		await metronome.start();
		await vi.advanceTimersByTimeAsync(1500);
		metronome.setRhythm({ beats: 4, tempo: 120 });
		await vi.advanceTimersByTimeAsync(1500);
		expect(beats.slice(0, 4)).toEqual([0, 1, 2, 3]);
	});
});
