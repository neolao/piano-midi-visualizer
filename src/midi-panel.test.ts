import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MidiStatus } from "./midi-access";
import { createMidiPanel } from "./midi-panel";

let root: HTMLElement;
let onActivate: () => void;

beforeEach(() => {
	document.body.innerHTML = '<main id="root"></main>';
	root = document.querySelector("#root") as HTMLElement;
	onActivate = vi.fn();
});

function show(status: MidiStatus) {
	const panel = createMidiPanel(root, onActivate);
	panel.render(status);
	return panel;
}

const live = () => root.querySelector('[role="status"]') as HTMLElement;

describe("createMidiPanel", () => {
	it("propose le bouton « Activer le MIDI » qui déclenche l'activation", () => {
		show({ kind: "idle" });
		const button = root.querySelector("button") as HTMLButtonElement;
		expect(button.textContent).toBe("Activer le MIDI");
		button.click();
		expect(onActivate).toHaveBeenCalledTimes(1);
	});

	it("affiche la demande en cours sans bouton", () => {
		show({ kind: "requesting" });
		expect(root.textContent).toContain("Demande d'accès en cours…");
		expect(root.querySelector("button")).toBeNull();
	});

	it("affiche le message d'aide quand aucun piano n'est détecté", () => {
		show({ kind: "ready", inputs: [], announcement: null });
		expect(root.textContent).toContain(
			"Aucun piano détecté. Branchez votre piano MIDI et allumez-le.",
		);
	});

	it("liste les pianos avec le fabricant en second plan", () => {
		show({
			kind: "ready",
			inputs: [{ id: "a", name: "Piano XYZ", manufacturer: "Yamaha" }],
			announcement: null,
		});
		const items = root.querySelectorAll("li");
		expect(items).toHaveLength(1);
		expect(items[0].textContent).toContain("Piano XYZ");
		expect(items[0].textContent).toContain("Yamaha");
		expect(root.textContent).not.toContain("Aucun piano");
	});

	it("affiche le message navigateur non compatible sans bouton", () => {
		show({ kind: "unsupported", insecure: false });
		expect(root.textContent).toContain(
			"Votre navigateur ne gère pas le MIDI. Essayez Chrome, Edge ou Opera.",
		);
		expect(root.querySelector("button")).toBeNull();
	});

	it("mentionne HTTPS en contexte non sécurisé", () => {
		show({ kind: "unsupported", insecure: true });
		expect(root.textContent).toContain("HTTPS");
	});

	it("affiche la marche à suivre après un refus, sans bouton Réessayer", () => {
		show({ kind: "denied" });
		expect(root.textContent).toContain("L'accès au MIDI a été refusé.");
		expect(root.textContent).toContain("réglages du site");
		expect(root.querySelector("button")).toBeNull();
	});

	it("propose « Réessayer » après un échec inattendu", () => {
		show({ kind: "error" });
		const button = root.querySelector("button") as HTMLButtonElement;
		expect(button.textContent).toBe("Réessayer");
		button.click();
		expect(onActivate).toHaveBeenCalledTimes(1);
	});

	it("annonce uniquement le changement dans la zone status", () => {
		const panel = show({ kind: "ready", inputs: [], announcement: null });
		expect(live().textContent).toBe("");
		panel.render({
			kind: "ready",
			inputs: [{ id: "a", name: "Piano XYZ", manufacturer: "Yamaha" }],
			announcement: "Piano XYZ connecté",
		});
		expect(live().textContent).toBe("Piano XYZ connecté");
		expect(live().getAttribute("aria-live")).toBe("polite");
	});

	it("n'injecte pas de HTML venant du nom du périphérique", () => {
		show({
			kind: "ready",
			inputs: [
				{ id: "a", name: "<img src=x onerror=alert(1)>", manufacturer: "" },
			],
			announcement: null,
		});
		expect(root.querySelector("img")).toBeNull();
	});

	it("garde le focus dans le panneau quand le bouton disparaît", () => {
		const panel = show({ kind: "idle" });
		(root.querySelector("button") as HTMLButtonElement).focus();
		panel.render({ kind: "requesting" });
		expect(root.contains(document.activeElement)).toBe(true);
	});
});
