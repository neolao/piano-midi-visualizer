import { type ChordSnapshot, createChordTracker } from "./chords";
import { describeChord, describeScore } from "./describe";
import { browserFullscreen, type Fullscreen } from "./fullscreen";
import {
	browserClickPlayer,
	type ClickPlayer,
	createMetronome,
} from "./metronome";
import { decodeMidiMessage } from "./midi";
import {
	createMidiController,
	type MidiEnvironment,
	type MidiStatus,
} from "./midi-access";
import { createMidiPanel } from "./midi-panel";
import {
	beatsPerMeasure,
	clampTempo,
	MAX_TEMPO,
	MIN_TEMPO,
	quantizeDuration,
	SIGNATURES,
	type Signature,
} from "./rhythm";
import { createScore, SLOTS } from "./score";
import { type BooleanSetting, createSettings } from "./settings";
import { STRINGS } from "./strings";

const GROUP_MS = 60;
const SILENCE_MS = 2000;
const TOAST_MS = 10000;
const DRAWER_ID = "options-drawer";

export interface AppDependencies {
	environment: MidiEnvironment;
	storage?: Storage;
	now?: () => number;
	player?: ClickPlayer;
	fullscreen?: Fullscreen;
}

const TEMPO_STEP = 5;

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
	const metronomeButton = button("", () => void toggleMetronome(), "M");
	const fullscreen = deps.fullscreen ?? browserFullscreen();
	const fullscreenButton = button("", () => void toggleFullscreen(), "P");
	const beatIndicator = el("span", "beat");
	beatIndicator.setAttribute("aria-hidden", "true");
	const optionsButton = button(STRINGS.options, () => toggleDrawer());
	optionsButton.setAttribute("aria-expanded", "false");
	optionsButton.setAttribute("aria-controls", DRAWER_ID);
	const grow = el("span", "grow");
	cmd.append(
		freezeButton,
		clearButton,
		metronomeButton,
		beatIndicator,
		grow,
		...(fullscreen.supported ? [fullscreenButton] : []),
		optionsButton,
	);

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
		frozen = frozen ? { current: [], history: [], durations: [] } : null;
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
				durations: [
					...before.durations,
					...(since.current.length > 0 && before.current.length > 0 ? [0] : []),
					...since.durations,
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
			key: BooleanSetting,
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
				if (key === "muted") {
					applyRhythm();
					say(settings.get().muted ? STRINGS.soundMuted : STRINGS.soundOn);
				}
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
			rhythmSection(current.signature, current.tempo),
			row(STRINGS.optionMuted, STRINGS.optionMutedHelp, "muted"),
			row(STRINGS.optionNames, STRINGS.optionNamesHelp, "names"),
			row(STRINGS.optionFlats, STRINGS.optionFlatsHelp, "flats"),
			row(STRINGS.optionAnnounce, STRINGS.optionAnnounceHelp, "announce"),
			row(STRINGS.optionShortcuts, STRINGS.optionShortcutsHelp, "shortcuts"),
			button(STRINGS.close, closeDrawer),
		);
		drawerHost.replaceChildren(drawer);
	};

	// --- rythme
	const applyRhythm = () => {
		const { signature, tempo, muted } = settings.get();
		metronome.setRhythm({ beats: beatsPerMeasure(signature), tempo });
		metronome.setMuted(muted);
	};

	const changeRhythm = (
		change: { signature: Signature } | { tempo: number },
		message: string,
	) => {
		const { signature, tempo } = settings.get();
		settings.set(change);
		applyRhythm();
		renderDrawer();
		focusRhythmControl(change);
		refresh();
		say(message);
		toast(message, STRINGS.undo, () => {
			settings.set({ signature, tempo });
			applyRhythm();
			renderDrawer();
			refresh();
		});
	};

	const focusRhythmControl = (change: object) => {
		const key = "signature" in change ? "signature" : "tempo";
		drawerHost.querySelector<HTMLElement>(`[data-rhythm="${key}"]`)?.focus();
	};

	const setTempo = (value: number, input?: HTMLInputElement) => {
		if (!Number.isFinite(value)) {
			if (input) input.value = String(settings.get().tempo);
			say(STRINGS.tempoInvalid);
			return;
		}
		const tempo = clampTempo(value);
		if (tempo === settings.get().tempo) {
			if (input) input.value = String(tempo);
			return;
		}
		changeRhythm(
			{ tempo },
			tempo === Math.round(value)
				? STRINGS.tempoChanged(tempo)
				: STRINGS.tempoClamped(tempo),
		);
	};

	const rhythmSection = (signature: Signature, tempo: number): HTMLElement => {
		const section = el("div", "rhythm");
		const title = el("h3", undefined, STRINGS.rhythm);
		const group = el("div", "choices");
		group.setAttribute("role", "radiogroup");
		group.setAttribute("aria-label", STRINGS.signatureLabel);
		for (const option of SIGNATURES) {
			const choice = button(option, () =>
				changeRhythm({ signature: option }, STRINGS.signatureChanged(option)),
			);
			choice.setAttribute("role", "radio");
			choice.setAttribute("aria-checked", String(option === signature));
			if (option === signature) choice.dataset.rhythm = "signature";
			group.append(choice);
		}
		const tempoRow = el("div", "tempo");
		const input = el("input");
		input.type = "number";
		input.min = String(MIN_TEMPO);
		input.max = String(MAX_TEMPO);
		input.value = String(tempo);
		input.dataset.rhythm = "tempo";
		input.setAttribute("aria-label", STRINGS.tempoLabel);
		input.addEventListener("change", () =>
			setTempo(input.value === "" ? Number.NaN : Number(input.value), input),
		);
		const less = button("−", () => setTempo(settings.get().tempo - TEMPO_STEP));
		less.setAttribute("aria-label", STRINGS.tempoLess);
		const more = button("+", () => setTempo(settings.get().tempo + TEMPO_STEP));
		more.setAttribute("aria-label", STRINGS.tempoMore);
		tempoRow.append(less, input, more);
		section.append(
			title,
			group,
			el("span", "tempo-label", STRINGS.tempoLabel),
			tempoRow,
		);
		return section;
	};

	const showBeat = (beat: number) => {
		beatIndicator.textContent = String(beat + 1);
		beatIndicator.dataset.accent = String(beat === 0);
		beatIndicator.dataset.on = "true";
	};

	const toggleMetronome = async () => {
		if (metronome.running) {
			metronome.stop();
			beatIndicator.textContent = "";
			delete beatIndicator.dataset.on;
			renderMetronomeButton();
			say(STRINGS.metronomeStopped);
			return;
		}
		const started = metronome.start();
		renderMetronomeButton();
		const { sound } = await started;
		say(sound ? STRINGS.metronomeStarted : STRINGS.metronomeStartedSilent);
	};

	const renderMetronomeButton = () => {
		metronomeButton.replaceChildren(
			document.createTextNode(
				metronome.running ? STRINGS.metronomeStop : STRINGS.metronomeStart,
			),
			shortcutHint("M"),
		);
	};

	const renderFullscreenButton = () => {
		fullscreenButton.replaceChildren(
			document.createTextNode(
				fullscreen.active() ? STRINGS.fullscreenExit : STRINGS.fullscreenEnter,
			),
			shortcutHint("P"),
		);
	};

	const toggleFullscreen = async () => {
		try {
			if (fullscreen.active()) await fullscreen.exit();
			else await fullscreen.enter();
		} catch {
			say(STRINGS.fullscreenRefused);
		}
	};

	// --- rendu
	const renderDescription = (snapshot: ChordSnapshot, flats: boolean) => {
		const summary = el(
			"p",
			undefined,
			describeScore(snapshot.current, snapshot.history, flats, settings.get()),
		);
		const { signature, tempo } = settings.get();
		const list = el("ul");
		snapshot.history.forEach((chord, i) => {
			const value = quantizeDuration(
				snapshot.durations[i] ?? 0,
				tempo,
				signature,
			);
			list.append(el("li", undefined, describeChord(chord, flats, value.name)));
		});
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
				signature: current.signature,
				tempo: current.tempo,
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

	const metronome = createMetronome(
		deps.player ?? browserClickPlayer(),
		showBeat,
	);

	const controller = createMidiController(
		deps.environment,
		(next) => {
			status = next;
			panel.render(next);
			if (next.kind === "ready") {
				if (next.inputs.length === 0 || next.lost) tracker.releaseAll(now());
				if (next.announcement) say(next.announcement);
			}
			refresh();
		},
		(data) => {
			const event = decodeMidiMessage(data);
			if (!event) return;
			if (event.kind === "on") tracker.noteOn(event.note, now());
			else tracker.noteOff(event.note, now());
			playedSinceAnnounce = true;
			armSilence();
			refresh();
		},
	);
	const panel = createMidiPanel(
		{ bar, notice },
		() => void controller.activate(),
		(id) => {
			tracker.releaseAll(now());
			controller.select(id);
		},
	);
	status = controller.status;
	panel.render(status);
	applyRhythm();
	renderMetronomeButton();
	renderFullscreenButton();
	fullscreen.onChange(() => {
		renderFullscreenButton();
		say(fullscreen.active() ? STRINGS.fullscreenOn : STRINGS.fullscreenOff);
	});
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
		if (key !== "f" && key !== "e" && key !== "l" && key !== "m" && key !== "p")
			return;
		event.preventDefault();
		if (event.repeat) return;
		if (key === "f") toggleFreeze();
		else if (key === "e") clearScore();
		else if (key === "m") void toggleMetronome();
		else if (key === "p") void toggleFullscreen();
		else announceLastChord();
	});
}
