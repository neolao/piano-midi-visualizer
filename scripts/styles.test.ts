import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles/base.css", "utf8");
const block = (selector: string) =>
	css.match(
		new RegExp(
			`${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`,
		),
	)?.[1] ?? "";

describe("feuille de style", () => {
	it("empêche les lignes du tiroir d'options d'être écrasées les unes sur les autres", () => {
		expect(block(".drawer > *")).toMatch(/flex-shrink:\s*0/);
	});

	it("montre l'état actif d'un bouton de la barre par un fond plein", () => {
		expect(block('.cmd button[aria-pressed="true"]')).toMatch(
			/background:\s*var\(--color-primary\)/,
		);
	});

	it("masque les lettres de raccourci clavier sur écran tactile ou étroit", () => {
		expect(css).toMatch(
			/@media \(hover: none\), \(pointer: coarse\), \(max-width: 760px\)\s*\{\s*\.cmd kbd\s*\{\s*display:\s*none/,
		);
	});
});

describe("hauteur de la page", () => {
	const index = readFileSync("index.html", "utf8");

	it("ancre la page aux quatre bords de l'écran plutôt que de calculer une hauteur", () => {
		const app = block(".app");
		expect(app).toMatch(/position:\s*fixed/);
		expect(app).toMatch(/inset:\s*0/);
		expect(app).not.toMatch(/dvh/);
	});

	it("garde une hauteur minimale pour la partition et défile dans la page si l'écran est bas", () => {
		const app = block(".app");
		expect(app).toMatch(/overflow-y:\s*auto/);
		expect(app).toMatch(/minmax\(\d+px,\s*1fr\)/);
	});

	it("demande à s'étendre jusqu'au bord de l'écran", () => {
		expect(index).toMatch(/<meta name="viewport"[^>]*viewport-fit=cover/);
	});

	it("laisse la place de la barre de gestes sous les boutons", () => {
		expect(block(".cmd")).toMatch(/env\(safe-area-inset-bottom/);
	});

	it("colore la page comme la barre du bas pour qu'un reste de bande s'y fonde", () => {
		expect(block("html")).toMatch(
			/background:\s*var\(--color-surface-sunken\)/,
		);
	});
});
