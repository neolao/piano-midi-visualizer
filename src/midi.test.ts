import { describe, expect, it } from "vitest";
import { decodeMidiMessage } from "./midi";

describe("decodeMidiMessage", () => {
	it("décode un note on", () => {
		expect(decodeMidiMessage([0x90, 60, 100])).toEqual({
			kind: "on",
			note: 60,
			velocity: 100,
		});
	});

	it("décode un note off", () => {
		expect(decodeMidiMessage([0x80, 60, 0])).toEqual({
			kind: "off",
			note: 60,
			velocity: 0,
		});
	});

	it("traite un note on de vélocité 0 comme un note off", () => {
		expect(decodeMidiMessage([0x90, 60, 0])).toEqual({
			kind: "off",
			note: 60,
			velocity: 0,
		});
	});

	it("reconnaît les 16 canaux", () => {
		expect(decodeMidiMessage([0x9f, 72, 64])?.kind).toBe("on");
		expect(decodeMidiMessage([0x85, 72, 64])?.kind).toBe("off");
	});

	it("ignore les messages qui ne sont pas des notes", () => {
		expect(decodeMidiMessage([0xb0, 64, 127])).toBeNull();
		expect(decodeMidiMessage([0xf8])).toBeNull();
		expect(decodeMidiMessage([0xe0, 0, 64])).toBeNull();
	});

	it("ignore les messages invalides ou tronqués", () => {
		expect(decodeMidiMessage([])).toBeNull();
		expect(decodeMidiMessage([0x90, 60])).toBeNull();
		expect(decodeMidiMessage([0x90, 200, 64])).toBeNull();
		expect(decodeMidiMessage([0x90, 60, 200])).toBeNull();
	});
});
