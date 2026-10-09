import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");
const manifest = JSON.parse(read("public/manifest.webmanifest"));
const tokens = read("src/styles/tokens.css");
const token = (name: string) =>
	new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(tokens)?.[1].toLowerCase();

describe("fiche d'installation", () => {
	it("nomme l'application et l'ouvre comme une vraie app", () => {
		expect(manifest).toMatchObject({
			name: "Piano MIDI Visualizer",
			short_name: "Piano MIDI",
			lang: "fr",
			display: "standalone",
		});
	});

	it("reste valable sous le sous-chemin de GitHub Pages", () => {
		expect(manifest.start_url).toBe("./");
		expect(manifest.scope).toBe("./");
	});

	it("reprend les couleurs du design", () => {
		expect(manifest.background_color).toBe(token("--color-surface"));
		expect(manifest.theme_color).toBe(token("--color-primary"));
	});

	it("annonce des icônes qui existent avec la taille annoncée", () => {
		for (const icon of manifest.icons) {
			const path = `public/${icon.src}`;
			expect(existsSync(path), path).toBe(true);
			const png = readFileSync(path);
			const [width, height] = icon.sizes.split("x").map(Number);
			expect(png.readUInt32BE(16), path).toBe(width);
			expect(png.readUInt32BE(20), path).toBe(height);
		}
	});

	it("fournit une icône 192, une 512 et une adaptable aux formes d'Android", () => {
		const sizes = manifest.icons.map(
			(i: { sizes: string; purpose?: string }) =>
				`${i.sizes}${i.purpose ? `:${i.purpose}` : ""}`,
		);
		expect(sizes).toEqual(["192x192", "512x512", "512x512:maskable"]);
	});
});

describe("page d'accueil", () => {
	const html = read("index.html");

	it("référence la fiche d'installation par un chemin relatif", () => {
		expect(html).toContain('rel="manifest" href="./manifest.webmanifest"');
	});

	it("colore la barre d'état comme l'application", () => {
		expect(html).toContain(
			`<meta name="theme-color" content="${token("--color-primary")}"`,
		);
	});

	it("fournit l'icône d'écran d'accueil des iPhone", () => {
		expect(html).toContain(
			'rel="apple-touch-icon" href="./icons/apple-touch-icon.png"',
		);
		expect(existsSync("public/icons/apple-touch-icon.png")).toBe(true);
	});
});
