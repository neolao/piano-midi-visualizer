import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	checkDist,
	checkInstallable,
	findAbsolutePaths,
} from "./check-dist.mjs";

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

describe("checkInstallable", () => {
	const manifest = {
		name: "App",
		short_name: "App",
		start_url: "./",
		display: "standalone",
		icons: [
			{ src: "icons/a-192.png", sizes: "192x192", type: "image/png" },
			{ src: "icons/a-512.png", sizes: "512x512", type: "image/png" },
		],
	};
	const html = '<link rel="manifest" href="./manifest.webmanifest">';

	function site(options: {
		html?: string;
		manifest?: unknown;
		files?: string[];
	}): string {
		const dir = distWith(options.html ?? html);
		if (options.manifest !== undefined) {
			writeFileSync(
				join(dir, "manifest.webmanifest"),
				typeof options.manifest === "string"
					? options.manifest
					: JSON.stringify(options.manifest),
			);
		}
		mkdirSync(join(dir, "icons"), { recursive: true });
		for (const file of options.files ?? [
			"icons/a-192.png",
			"icons/a-512.png",
		]) {
			writeFileSync(join(dir, file), "png");
		}
		return dir;
	}

	it("ne signale rien pour un site installable", () => {
		expect(checkInstallable(site({ manifest }))).toEqual([]);
	});

	it("signale une page qui ne référence pas la fiche d'installation", () => {
		const problems = checkInstallable(
			site({ manifest, html: "<p>sans lien</p>" }),
		);
		expect(problems.join(" ")).toMatch(/rel="manifest"/);
	});

	it("signale une fiche d'installation absente", () => {
		expect(checkInstallable(site({})).join(" ")).toMatch(
			/manifest\.webmanifest/,
		);
	});

	it("signale une fiche d'installation illisible", () => {
		expect(
			checkInstallable(site({ manifest: "{pas du json" })).join(" "),
		).toMatch(/JSON/);
	});

	it("signale chaque champ obligatoire manquant", () => {
		const problems = checkInstallable(
			site({ manifest: { ...manifest, name: "", display: "browser" } }),
		);
		expect(problems.join(" ")).toMatch(/name/);
		expect(problems.join(" ")).toMatch(/display/);
	});

	it("signale une icône annoncée mais absente", () => {
		const problems = checkInstallable(
			site({ manifest, files: ["icons/a-192.png"] }),
		);
		expect(problems).toEqual([expect.stringContaining("icons/a-512.png")]);
	});

	it("exige une icône de 192 et de 512 pixels", () => {
		const problems = checkInstallable(
			site({
				manifest: { ...manifest, icons: [manifest.icons[0]] },
			}),
		);
		expect(problems.join(" ")).toMatch(/512/);
	});

	it("refuse un chemin absolu qui casserait GitHub Pages", () => {
		const problems = checkInstallable(
			site({
				manifest: {
					...manifest,
					start_url: "/",
					icons: [
						{ ...manifest.icons[0], src: "/icons/a-192.png" },
						manifest.icons[1],
					],
				},
			}),
		);
		expect(problems.join(" ")).toMatch(/start_url/);
		expect(problems.join(" ")).toMatch(/\/icons\/a-192\.png/);
	});
});
