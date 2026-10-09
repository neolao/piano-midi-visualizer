import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkDist, findAbsolutePaths } from "./check-dist.mjs";

function distWith(html?: string): string {
	const dir = mkdtempSync(join(tmpdir(), "dist-"));
	mkdirSync(dir, { recursive: true });
	if (html !== undefined) writeFileSync(join(dir, "index.html"), html);
	return dir;
}

describe("findAbsolutePaths", () => {
	it("accepte les chemins relatifs", () => {
		const html =
			'<script src="./assets/index.js"></script><link href="./assets/index.css">';
		expect(findAbsolutePaths(html)).toEqual([]);
	});

	it("repère les chemins absolus qui casseraient sous un sous-chemin", () => {
		const html =
			'<script type="module" src="/assets/index.js"></script><link rel="stylesheet" href="/assets/index.css">';
		expect(findAbsolutePaths(html)).toEqual([
			"/assets/index.js",
			"/assets/index.css",
		]);
	});

	it("repère aussi les adresses sans protocole", () => {
		expect(
			findAbsolutePaths('<script src="//cdn.exemple.fr/a.js"></script>'),
		).toEqual(["//cdn.exemple.fr/a.js"]);
	});

	it("ignore les adresses complètes et les données intégrées", () => {
		const html =
			'<a href="https://exemple.fr/">x</a><link rel="icon" href="data:image/svg+xml,%3Csvg%3E">';
		expect(findAbsolutePaths(html)).toEqual([]);
	});

	it("ignore les ancres de la page", () => {
		expect(findAbsolutePaths('<a href="#haut">haut</a>')).toEqual([]);
	});
});

describe("checkDist", () => {
	it("renvoie la liste vide pour un site construit correctement", () => {
		const dir = distWith('<script src="./assets/a.js"></script>');
		expect(checkDist(dir)).toEqual([]);
	});

	it("renvoie les chemins absolus trouvés", () => {
		const dir = distWith('<script src="/assets/a.js"></script>');
		expect(checkDist(dir)).toEqual(["/assets/a.js"]);
	});

	it("échoue clairement quand le site n'a pas été construit", () => {
		const dir = distWith();
		expect(() => checkDist(dir)).toThrow(/index\.html/);
	});
});
