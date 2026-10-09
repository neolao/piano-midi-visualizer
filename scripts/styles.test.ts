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
