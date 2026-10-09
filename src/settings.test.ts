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
		});
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
