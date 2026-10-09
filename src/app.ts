import { type ChordSnapshot, createChordTracker } from "./chords";
import { describeChord, describeScore } from "./describe";
import { decodeMidiMessage } from "./midi";
import {
	createMidiController,
	type MidiEnvironment,
	type MidiStatus,
} from "./midi-access";
import { createMidiPanel } from "./midi-panel";
import { createScore, SLOTS } from "./score";
import { createSettings, type Settings } from "./settings";
import { STRINGS } from "./strings";

const GROUP_MS = 60;
const SILENCE_MS = 2000;
const TOAST_MS = 10000;
const DRAWER_ID = "options-drawer";

export interface AppDependencies {
	environment: MidiEnvironment;
	storage?: Storage;
	now?: () => number;
}

function el<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	className?: string,
	text?: string,
): HTMLElementTagNameMap[K] {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
}

function shortcutHint(key: string): HTMLElement {
	const hint = el("kbd", undefined, key);
	hint.setAttribute("aria-hidden", "true");
	return hint;
}

function button(
	label: string,
	onClick: () => void,
	shortcut?: string,
): HTMLButtonElement {
	const b = el("button", undefined, label);
	b.type = "button";
	b.addEventListener("click", onClick);
	if (shortcut) {
		b.append(shortcutHint(shortcut));
		b.setAttribute("aria-keyshortcuts", shortcut);
	}
	return b;
}

export function mountApp(root: HTMLElement, deps: AppDependencies): void {
	const now = deps.now ?? (() => performance.now());
	const settings = createSettings(deps.storage);
	const tracker = createChordTracker({
		groupMs: GROUP_MS,
		maxHistory: SLOTS * 5,
	});

	// --- structure de la page
	const title = el("h1", "sr", STRINGS.title);
	const bar = el("div", "bar");
	const notice = el("div", "notice");
	const hint = el("p", "hint");
	const scoreHost = el("div");
	const description = el("div", "sr");
	const score = el("div", "score");
	score.tabIndex = 0;
	score.setAttribute("role", "group");
	score.setAttribute("aria-label", STRINGS.scoreLabel);
	score.append(scoreHost, description);
	const stage = el("main", "stage");
	stage.append(notice, score, hint);
	const drawerHost = el("div");
	const toastHost = el("div");
	toastHost.setAttribute("role", "status");
	const cmd = el("div", "cmd");
	const cmdwrap = el("div", "cmdwrap");
	cmdwrap.append(cmd, drawerHost, toastHost);
	const live = el("div", "sr");
	live.setAttribute("role", "status");
	live.setAttribute("aria-live", "polite");
	const shell = el("div", "app");
	shell.append(bar, stage, cmdwrap);
	root.replaceChildren(title, shell, live);

	const scoreView = createScore(scoreHost);
	const say = (text: string) => {
		live.textContent = "";
		setTimeout(() => {
			live.textContent = text;
		}, 30);
	};

	let toastTimer: ReturnType<typeof setTimeout> | undefined;
	const dismissToast = () => toastHost.replaceChildren();
	const armToast = () => {
		clearTimeout(toastTimer);
		toastTimer = setTimeout(dismissToast, TOAST_MS);
	};
	const toast = (
		message: string,
		actionLabel: string,
		onAction: () => void,
	) => {
		const box = el("div", "toast");
		box.append(
			el("span", undefined, message),
			button(actionLabel, () => {
				onAction();
				dismissToast();
			}),
		);
		box.addEventListener("mouseenter", () => clearTimeout(toastTimer));
		box.addEventListener("focusin", () => clearTimeout(toastTimer));
		box.addEventListener("mouseleave", armToast);
		box.addEventListener("focusout", armToast);
		toastHost.replaceChildren(box);
		armToast();
	};

	// --- état
	let status: MidiStatus = { kind: "idle" };
	let frozen: ChordSnapshot | null = null;
	let drawerOpen = false;
	let renderQueued = false;
	let silenceTimer: ReturnType<typeof setTimeout> | undefined;
	let playedSinceAnnounce = false;

	const shown = (): ChordSnapshot => frozen ?? tracker.snapshot();
	const isReady = () => status.kind === "ready";
	const hasPiano = () => status.kind === "ready" && status.inputs.length > 0;

	const freezeButton = button("", () => toggleFreeze(), "F");
	const clearButton = button(STRINGS.clear, () => clearScore(), "E");
	const optionsButton = button(STRINGS.options, () => toggleDrawer());
	optionsButton.setAttribute("aria-expanded", "false");
	optionsButton.setAttribute("aria-controls", DRAWER_ID);
	const grow = el("span", "grow");
	cmd.append(freezeButton, clearButton, grow, optionsButton);

	const toggleFreeze = () => {
		if (!isReady()) return;
		frozen = frozen ? null : tracker.snapshot();
		refresh();
		freezeButton.focus();
	};

	const clearScore = () => {
		if (!isReady()) return;
		const before = tracker.clear();
		playedSinceAnnounce = false;
		const previousFrozen = frozen;
		frozen = frozen ? { current: [], history: [] } : null;
		refresh();
		toast(STRINGS.cleared, STRINGS.undo, () => {
			const since = tracker.snapshot();
			tracker.restore({
				current: since.current.length > 0 ? since.current : before.current,
				history: [
					...before.history,
					...(since.current.length > 0 && before.current.length > 0
						? [before.current]
						: []),
					...since.history,
				],
			});
			frozen = previousFrozen;
			refresh();
		});
	};

	const announceLastChord = () => {
		const { current, history } = shown();
		const chord = current.length > 0 ? current : history[history.length - 1];
		say(
			chord
				? STRINGS.chord(describeChord(chord, settings.get().flats))
				: STRINGS.noNotePlayed,
		);
	};

	const toggleDrawer = () => {
		drawerOpen = !drawerOpen;
		renderDrawer();
	};

	const closeDrawer = () => {
		drawerOpen = false;
		renderDrawer();
		optionsButton.focus();
	};

	const renderDrawer = () => {
		optionsButton.setAttribute("aria-expanded", String(drawerOpen));
		if (!drawerOpen) {
			drawerHost.replaceChildren();
			return;
		}
		const current = settings.get();
		const drawer = el("div", "drawer");
		drawer.id = DRAWER_ID;
		drawer.setAttribute("role", "group");
		drawer.setAttribute("aria-label", STRINGS.options);
		const row = (
			label: string,
			help: string,
			key: keyof Settings,
		): HTMLElement => {
			const wrapper = el("div", "option");
			const text = el("span");
			const labelEl = el("span", undefined, label);
			labelEl.id = `option-${key}-label`;
			const helpEl = el("small", undefined, help);
			helpEl.id = `option-${key}-help`;
			text.append(labelEl, helpEl);
			const toggle = button(current[key] ? STRINGS.on : STRINGS.off, () => {
				settings.set({ [key]: !settings.get()[key] });
				renderDrawer();
				refresh();
				drawerHost
					.querySelector<HTMLButtonElement>(`[data-key="${key}"]`)
					?.focus();
			});
			toggle.dataset.key = key;
			toggle.setAttribute("aria-labelledby", labelEl.id);
			toggle.setAttribute("aria-describedby", helpEl.id);
			toggle.setAttribute("aria-pressed", String(current[key]));
			wrapper.append(text, toggle);
			return wrapper;
		};
		drawer.append(
			el("h2", undefined, STRINGS.options),
			row(STRINGS.optionNames, STRINGS.optionNamesHelp, "names"),
			row(STRINGS.optionFlats, STRINGS.optionFlatsHelp, "flats"),
			row(STRINGS.optionAnnounce, STRINGS.optionAnnounceHelp, "announce"),
			row(STRINGS.optionShortcuts, STRINGS.optionShortcutsHelp, "shortcuts"),
			button(STRINGS.close, closeDrawer),
		);
		drawerHost.replaceChildren(drawer);
	};

	// --- rendu
	const renderDescription = (snapshot: ChordSnapshot, flats: boolean) => {
		const summary = el(
			"p",
			undefined,
			describeScore(snapshot.current, snapshot.history, flats),
		);
		const list = el("ul");
		for (const chord of snapshot.history) {
			list.append(el("li", undefined, describeChord(chord, flats)));
		}
		description.replaceChildren(summary, list);
	};

	const paint = () => {
		renderQueued = false;
		stage.dataset.mode = status.kind;
		const snapshot = shown();
		const current = settings.get();
		try {
			scoreView.render(snapshot, {
				flats: current.flats,
				names: current.names,
			});
		} catch (error) {
			console.error("Rendu de la partition impossible", error);
		}
		renderDescription(snapshot, current.flats);
		if (score.scrollWidth > score.clientWidth) {
			const slot = Math.min(snapshot.history.length, SLOTS - 1);
			score.scrollLeft = Math.max(
				0,
				((slot + 1) / SLOTS) * score.scrollWidth - score.clientWidth * 0.8,
			);
		}
		const empty =
			snapshot.current.length === 0 && snapshot.history.length === 0;
		hint.textContent =
			status.kind === "idle" || status.kind === "requesting"
				? STRINGS.hintInactive
				: hasPiano() && frozen && empty
					? STRINGS.hintFrozen
					: hasPiano() && empty
						? STRINGS.hintReady
						: "";
		hint.hidden = hint.textContent === "";
	};

	const refresh = () => {
		freezeButton.replaceChildren(
			document.createTextNode(frozen ? STRINGS.resume : STRINGS.freeze),
			shortcutHint("F"),
		);
		freezeButton.disabled = !isReady();
		clearButton.disabled = !isReady();
		if (!renderQueued) {
			renderQueued = true;
			requestAnimationFrame(paint);
		}
	};

	// --- notes MIDI
	const armSilence = () => {
		clearTimeout(silenceTimer);
		silenceTimer = setTimeout(() => {
			if (
				tracker.heldCount > 0 ||
				!playedSinceAnnounce ||
				!settings.get().announce
			) {
				return;
			}
			playedSinceAnnounce = false;
			const { history } = tracker.snapshot();
			const last = history[history.length - 1];
			if (last) {
				say(STRINGS.chord(describeChord(last, settings.get().flats)));
			}
		}, SILENCE_MS);
	};

	const controller = createMidiController(
		deps.environment,
		(next) => {
			status = next;
			panel.render(next);
			if (next.kind === "ready") {
				if (next.inputs.length === 0) tracker.releaseAll();
				if (next.announcement) say(next.announcement);
			}
			refresh();
		},
		(data) => {
			const event = decodeMidiMessage(data);
			if (!event) return;
			if (event.kind === "on") tracker.noteOn(event.note, now());
			else tracker.noteOff(event.note);
			playedSinceAnnounce = true;
			armSilence();
			refresh();
		},
	);
	const panel = createMidiPanel(
		{ bar, notice },
		() => void controller.activate(),
	);
	status = controller.status;
	panel.render(status);
	renderDrawer();
	refresh();

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape" && drawerOpen) {
			closeDrawer();
			return;
		}
		const target = event.target as HTMLElement | null;
		if (
			!settings.get().shortcuts ||
			event.ctrlKey ||
			event.metaKey ||
			event.altKey
		) {
			return;
		}
		if (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return;
		const key = event.key.toLowerCase();
		if (key !== "f" && key !== "e" && key !== "l") return;
		event.preventDefault();
		if (event.repeat) return;
		if (key === "f") toggleFreeze();
		else if (key === "e") clearScore();
		else announceLastChord();
	});
}
