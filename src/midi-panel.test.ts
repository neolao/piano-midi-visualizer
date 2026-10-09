import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MidiStatus } from "./midi-access";
import { createMidiPanel } from "./midi-panel";

let bar: HTMLElement;
let notice: HTMLElement;
let onActivate: () => void;

beforeEach(() => {
	document.body.innerHTML = '<div id="bar"></div><div id="notice"></div>';
	bar = document.querySelector("#bar") as HTMLElement;
	notice = document.querySelector("#notice") as HTMLElement;
	onActivate = vi.fn();
});

function show(status: MidiStatus) {
	const panel = createMidiPanel({ bar, notice }, onActivate);
	panel.render(status);
	return panel;
}

const piano = (name: string) => ({ id: name, name, manufacturer: "" });
const ready = (...names: string[]): MidiStatus => ({
	kind: "ready",
	inputs: names.map(piano),
	announcement: null,
});

describe("createMidiPanel — scène", () => {
	it("propose le bouton « Activer le MIDI » qui déclenche l'activation", () => {
		show({ kind: "idle" });
		const button = notice.querySelector("button") as HTMLButtonElement;
		expect(button.textContent).toBe("Activer le MIDI");
		button.click();
		expect(onActivate).toHaveBeenCalledTimes(1);
	});

	it("affiche la demande en cours sans bouton", () => {
		show({ kind: "requesting" });
		expect(notice.textContent).toContain("Demande d'accès en cours…");
		expect(notice.querySelector("button")).toBeNull();
	});

	it("affiche le message navigateur non compatible, sans bouton", () => {
		show({ kind: "unsupported", insecure: false });
		expect(notice.textContent).toContain(
			"Votre navigateur ne gère pas le MIDI. Essayez Chrome, Edge ou Opera.",
		);
		expect(notice.querySelector("button")).toBeNull();
	});

	it("mentionne HTTPS en contexte non sécurisé", () => {
		show({ kind: "unsupported", insecure: true });
		expect(notice.textContent).toContain("HTTPS");
	});

	it("affiche la marche à suivre après un refus, sans bouton Réessayer", () => {
		show({ kind: "denied" });
		expect(notice.textContent).toContain("L'accès au MIDI a été refusé.");
		expect(notice.textContent).toContain("réglages du site");
		expect(notice.querySelector("button")).toBeNull();
	});

	it("propose « Réessayer » après un échec inattendu", () => {
		show({ kind: "error" });
		const button = notice.querySelector("button") as HTMLButtonElement;
		expect(button.textContent).toBe("Réessayer");
		button.click();
		expect(onActivate).toHaveBeenCalledTimes(1);
	});

	it("affiche l'aide quand aucun piano n'a encore été détecté", () => {
		show(ready());
		expect(notice.textContent).toContain(
			"Aucun piano détecté. Branchez votre piano MIDI et allumez-le.",
		);
	});

	it("n'affiche rien dans la scène quand un piano est connecté", () => {
		show(ready("Yamaha P-125"));
		expect(notice.textContent).toBe("");
	});

	it("affiche le bandeau « Piano débranché » quand le piano disparaît", () => {
		const panel = show(ready("Yamaha P-125"));
		panel.render(ready());
		expect(notice.textContent).toContain(
			"Piano débranché — rebranchez-le pour continuer",
		);
		expect(notice.textContent).not.toContain("Aucun piano détecté");
	});

	it("efface le bandeau au rebranchement", () => {
		const panel = show(ready("Yamaha P-125"));
		panel.render(ready());
		panel.render(ready("Yamaha P-125"));
		expect(notice.textContent).toBe("");
	});

	it("garde le focus dans la scène quand le bouton disparaît", () => {
		const panel = show({ kind: "idle" });
		(notice.querySelector("button") as HTMLButtonElement).focus();
		panel.render({ kind: "requesting" });
		expect(notice.contains(document.activeElement)).toBe(true);
	});
});

describe("createMidiPanel — barre MIDI", () => {
	it("indique « Aucun piano » avant la connexion", () => {
		show({ kind: "idle" });
		expect(bar.textContent).toContain("Aucun piano");
		expect(bar.querySelector(".dot")?.className).not.toContain("ok");
	});

	it("affiche le nom du piano connecté avec une pastille verte", () => {
		show(ready("Yamaha P-125"));
		expect(bar.textContent).toContain("Piano connecté : Yamaha P-125");
		expect(bar.querySelector(".dot")?.className).toContain("ok");
	});

	it("liste plusieurs pianos séparés par une virgule", () => {
		show(ready("Yamaha P-125", "Roland FP-30X"));
		expect(bar.textContent).toContain(
			"Piano connecté : Yamaha P-125, Roland FP-30X",
		);
	});

	it("passe la pastille au rouge avec « Aucun piano » après un débranchement", () => {
		const panel = show(ready("Yamaha P-125"));
		panel.render(ready());
		expect(bar.textContent).toContain("Aucun piano");
		expect(bar.querySelector(".dot")?.className).toContain("off");
	});

	it("n'injecte pas de HTML venant du nom du périphérique", () => {
		show(ready("<img src=x onerror=alert(1)>"));
		expect(bar.querySelector("img")).toBeNull();
		expect(bar.textContent).toContain("<img");
	});
});
