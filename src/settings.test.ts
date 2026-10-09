import { describe, expect, it } from "vitest";
import { createSettings } from "./settings";

function memoryStorage(initial: Record<string, string> = {}): Storage {
	const data = new Map(Object.entries(initial));
	return {
		getItem: (k) => data.get(k) ?? null,
		setItem: (k, v) => void data.set(k, v),
		removeItem: (k) => void data.delete(k),
		clear: () => data.clear(),
		key: () => null,
		get length() {
			return data.size;
		},
	};
}

describe("createSettings", () => {
	it("propose les valeurs par défaut", () => {
		expect(createSettings(memoryStorage()).get()).toEqual({
			names: true,
			flats: false,
			announce: true,
			shortcuts: true,
			muted: false,
			signature: "4/4",
			tempo: 80,
		});
	});

	it("retrouve la mesure, le tempo et le son coupé à la visite suivante", () => {
		const storage = memoryStorage();
		createSettings(storage).set({ signature: "3/4", tempo: 96, muted: true });
		expect(createSettings(storage).get()).toMatchObject({
			signature: "3/4",
			tempo: 96,
			muted: true,
		});
	});

	it("ignore une mesure inconnue et un tempo hors bornes mémorisés", () => {
		const raw = '{"signature":"5/4","tempo":999,"muted":"oui"}';
		expect(
			createSettings(
				memoryStorage({ "piano-midi-visualizer:settings": raw }),
			).get(),
		).toMatchObject({ signature: "4/4", tempo: 200, muted: false });
	});

	it("ignore un tempo qui n'est pas un nombre", () => {
		const raw = '{"tempo":"vite"}';
		expect(
			createSettings(
				memoryStorage({ "piano-midi-visualizer:settings": raw }),
			).get().tempo,
		).toBe(80);
	});

	it("mémorise un changement et le retrouve à la visite suivante", () => {
		const storage = memoryStorage();
		createSettings(storage).set({ flats: true });
		expect(createSettings(storage).get().flats).toBe(true);
	});

	it("ignore un contenu mémorisé corrompu ou de mauvais type", () => {
		expect(
			createSettings(
				memoryStorage({ "piano-midi-visualizer:settings": "{pas du json" }),
			).get().names,
		).toBe(true);
		expect(
			createSettings(
				memoryStorage({ "piano-midi-visualizer:settings": '{"names":"oui"}' }),
			).get().names,
		).toBe(true);
	});

	it("fonctionne sans stockage disponible", () => {
		const settings = createSettings(undefined);
		settings.set({ names: false });
		expect(settings.get().names).toBe(false);
	});

	it("fonctionne quand le stockage lève une erreur", () => {
		const broken = {
			getItem: () => {
				throw new Error("bloqué");
			},
			setItem: () => {
				throw new Error("bloqué");
			},
		} as unknown as Storage;
		const settings = createSettings(broken);
		expect(() => settings.set({ announce: false })).not.toThrow();
		expect(settings.get().announce).toBe(false);
	});
});
