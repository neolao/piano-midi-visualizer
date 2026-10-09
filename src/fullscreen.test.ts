import { afterEach, describe, expect, it, vi } from "vitest";
import { browserFullscreen } from "./fullscreen";

const root = document.documentElement as Partial<HTMLElement>;
const doc = document as Partial<Document>;

afterEach(() => {
	delete root.requestFullscreen;
	delete doc.exitFullscreen;
	Object.defineProperty(document, "fullscreenElement", {
		value: null,
		configurable: true,
	});
});

describe("browserFullscreen", () => {
	it("se déclare non disponible quand le navigateur n'a pas le plein écran", () => {
		expect(browserFullscreen().supported).toBe(false);
	});

	it("se déclare disponible quand le navigateur sait l'afficher", () => {
		root.requestFullscreen = async () => {};
		expect(browserFullscreen().supported).toBe(true);
	});

	it("demande le plein écran de la page et le quitte", async () => {
		root.requestFullscreen = vi.fn(async () => {});
		doc.exitFullscreen = vi.fn(async () => {});
		const fullscreen = browserFullscreen();
		await fullscreen.enter();
		await fullscreen.exit();
		expect(root.requestFullscreen).toHaveBeenCalledTimes(1);
		expect(doc.exitFullscreen).toHaveBeenCalledTimes(1);
	});

	it("sait si la page est en plein écran", () => {
		root.requestFullscreen = async () => {};
		const fullscreen = browserFullscreen();
		expect(fullscreen.active()).toBe(false);
		Object.defineProperty(document, "fullscreenElement", {
			value: root,
			configurable: true,
		});
		expect(fullscreen.active()).toBe(true);
	});

	it("prévient quand le navigateur change d'état, même sans passer par nous", () => {
		root.requestFullscreen = async () => {};
		const changes = vi.fn();
		browserFullscreen().onChange(changes);
		document.dispatchEvent(new Event("fullscreenchange"));
		expect(changes).toHaveBeenCalledTimes(1);
	});

	it("transmet le refus du navigateur", async () => {
		root.requestFullscreen = async () => {
			throw new Error("refusé");
		};
		await expect(browserFullscreen().enter()).rejects.toThrow("refusé");
	});
});
