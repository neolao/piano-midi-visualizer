import type { MidiStatus } from "./midi-access";
import { STRINGS } from "./strings";

export interface MidiPanel {
	render(status: MidiStatus): void;
}

interface Elements {
	bar: HTMLElement;
	notice: HTMLElement;
}

function element<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	text?: string,
): HTMLElementTagNameMap[K] {
	const el = document.createElement(tag);
	if (text !== undefined) el.textContent = text;
	return el;
}

export function createMidiPanel(
	{ bar, notice }: Elements,
	onActivate: () => void,
	onSelect: (id: string | null) => void = () => {},
): MidiPanel {
	let hadPiano = false;
	notice.tabIndex = -1;

	const button = (label: string, primary: boolean) => {
		const b = element("button", label);
		b.type = "button";
		if (primary) b.className = "primary";
		b.addEventListener("click", onActivate);
		return b;
	};

	const unpluggedBanner = (message: string) => {
		const banner = element("div");
		banner.className = "banner";
		banner.append(element("span", "⚠"), element("span", message));
		banner.firstElementChild?.setAttribute("aria-hidden", "true");
		return banner;
	};

	const chooser = (status: Extract<MidiStatus, { kind: "ready" }>) => {
		const select = element("select");
		select.setAttribute("aria-label", STRINGS.pianoChoice);
		select.append(new Option(STRINGS.allPianos, ""));
		for (const p of status.inputs) select.append(new Option(p.name, p.id));
		select.value = status.selected ?? "";
		select.addEventListener("change", () => onSelect(select.value || null));
		return select;
	};

	const noticeBody = (status: MidiStatus, pianos: number): HTMLElement[] => {
		switch (status.kind) {
			case "idle":
				return [button(STRINGS.activate, true)];
			case "requesting":
				return [element("p", STRINGS.requesting)];
			case "unsupported":
				return [
					element(
						"p",
						status.insecure ? STRINGS.insecure : STRINGS.unsupported,
					),
				];
			case "denied":
				return [element("p", STRINGS.denied)];
			case "error":
				return [element("p", STRINGS.error), button(STRINGS.retry, true)];
			case "ready": {
				if (pianos > 0 && status.lost)
					return [unpluggedBanner(STRINGS.selectedUnplugged(status.lost))];
				if (pianos > 0) return [];
				if (!hadPiano) return [element("p", STRINGS.noPianoHelp)];
				return [unpluggedBanner(STRINGS.pianoUnplugged)];
			}
		}
	};

	const renderBar = (status: MidiStatus) => {
		const pianos = status.kind === "ready" ? status.inputs : [];
		const dot = element("span");
		dot.setAttribute("aria-hidden", "true");
		dot.className = `dot${pianos.length > 0 ? " ok" : status.kind === "ready" && hadPiano ? " off" : ""}`;
		const text =
			pianos.length > 0
				? STRINGS.pianoConnected(pianos.map((p) => p.name).join(", "))
				: STRINGS.noPiano;
		const name = element("span", text);
		name.className = "bar-name";
		name.title = text;
		const hadFocus = bar.contains(document.activeElement);
		const choice =
			status.kind === "ready" && pianos.length > 1 ? chooser(status) : null;
		bar.replaceChildren(...(choice ? [dot, name, choice] : [dot, name]));
		if (hadFocus) choice?.focus();
	};

	return {
		render(status) {
			const pianos = status.kind === "ready" ? status.inputs.length : 0;
			if (pianos > 0) hadPiano = true;
			const hadFocus = notice.contains(document.activeElement);
			notice.replaceChildren(...noticeBody(status, pianos));
			renderBar(status);
			if (hadFocus) (notice.querySelector("button") ?? notice).focus();
		},
	};
}
