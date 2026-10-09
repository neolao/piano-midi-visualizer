import { describe, expect, it } from "vitest";
import { nomDeNote } from "./midi";

describe("nomDeNote", () => {
	it("retourne C4 pour le do central (60)", () => {
		expect(nomDeNote(60)).toBe("C4");
	});

	it("gère les bornes 0 et 127", () => {
		expect(nomDeNote(0)).toBe("C-1");
		expect(nomDeNote(127)).toBe("G9");
	});

	it("nomme les dièses", () => {
		expect(nomDeNote(61)).toBe("C#4");
	});

	it("lève une erreur hors plage", () => {
		expect(() => nomDeNote(128)).toThrow(RangeError);
		expect(() => nomDeNote(-1)).toThrow(RangeError);
	});
});
