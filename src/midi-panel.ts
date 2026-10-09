import type { MidiStatus } from "./midi-access";

export interface MidiPanel {
	render(status: MidiStatus): void;
}

const MESSAGES = {
	requesting: "Demande d'accès en cours…",
	empty: "Aucun piano détecté. Branchez votre piano MIDI et allumez-le.",
	unsupported:
		"Votre navigateur ne gère pas le MIDI. Essayez Chrome, Edge ou Opera.",
	insecure:
		"Le MIDI exige une connexion sécurisée (HTTPS). Ouvrez cette page en HTTPS, avec Chrome, Edge ou Opera.",
	denied:
		"L'accès au MIDI a été refusé. Autorisez-le dans les réglages du site (icône à côté de l'adresse), puis rechargez la page.",
	error: "Impossible d'activer le MIDI. Vérifiez votre piano puis réessayez.",
};

function element<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	text?: string,
): HTMLElementTagNameMap[K] {
	const el = document.createElement(tag);
	if (text !== undefined) el.textContent = text;
	return el;
}

export function createMidiPanel(
	root: HTMLElement,
	onActivate: () => void,
): MidiPanel {
	const content = element("section");
	content.tabIndex = -1;
	const live = element("div");
	live.setAttribute("role", "status");
	live.setAttribute("aria-live", "polite");
	root.replaceChildren(content, live);

	const button = (label: string) => {
		const b = element("button", label);
		b.type = "button";
		b.addEventListener("click", onActivate);
		return b;
	};

	const body = (status: MidiStatus): HTMLElement[] => {
		switch (status.kind) {
			case "idle":
				return [button("Activer le MIDI")];
			case "requesting":
				return [element("p", MESSAGES.requesting)];
			case "unsupported":
				return [
					element(
						"p",
						status.insecure ? MESSAGES.insecure : MESSAGES.unsupported,
					),
				];
			case "denied":
				return [element("p", MESSAGES.denied)];
			case "error":
				return [element("p", MESSAGES.error), button("Réessayer")];
			case "ready": {
				if (status.inputs.length === 0) return [element("p", MESSAGES.empty)];
				const list = element("ul");
				for (const input of status.inputs) {
					const item = element("li", input.name);
					if (input.manufacturer)
						item.append(" ", element("small", input.manufacturer));
					list.append(item);
				}
				return [list];
			}
		}
	};

	return {
		render(status) {
			const hadFocus = content.contains(document.activeElement);
			content.replaceChildren(...body(status));
			live.textContent =
				status.kind === "ready" ? (status.announcement ?? "") : "";
			if (hadFocus) (content.querySelector("button") ?? content).focus();
		},
	};
}
