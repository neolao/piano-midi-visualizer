export interface MidiInputLike {
	id: string;
	name?: string | null;
	manufacturer?: string | null;
	type: string;
	state: string;
	onmidimessage?: ((event: { data?: ArrayLike<number> | null }) => void) | null;
}

export interface MidiAccessLike {
	inputs: { values(): Iterable<MidiInputLike> };
	onstatechange: ((event: unknown) => void) | null;
}

export interface MidiEnvironment {
	requestMIDIAccess?: () => Promise<MidiAccessLike>;
	isSecureContext: boolean;
}

export interface MidiInputInfo {
	id: string;
	name: string;
	manufacturer: string;
}

export type MidiStatus =
	| { kind: "idle" }
	| { kind: "requesting" }
	| { kind: "unsupported"; insecure: boolean }
	| { kind: "denied" }
	| { kind: "error" }
	| {
			kind: "ready";
			inputs: MidiInputInfo[];
			announcement: string | null;
			selected?: string;
			lost?: string;
	  };

export interface MidiController {
	readonly status: MidiStatus;
	activate(): Promise<void>;
	select(id: string | null): void;
}

const NOM_PAR_DEFAUT = "Entrée MIDI sans nom";
const ERREURS_DE_REFUS = ["SecurityError", "NotAllowedError"];

function connectedInputs(access: MidiAccessLike): MidiInputInfo[] {
	return [...access.inputs.values()]
		.filter((i) => i.type === "input" && i.state === "connected")
		.map((i) => ({
			id: i.id,
			name: i.name || NOM_PAR_DEFAUT,
			manufacturer: i.manufacturer ?? "",
		}));
}

function describeChanges(
	before: MidiInputInfo[],
	after: MidiInputInfo[],
): string | null {
	const beforeIds = new Set(before.map((i) => i.id));
	const afterIds = new Set(after.map((i) => i.id));
	const messages = [
		...after
			.filter((i) => !beforeIds.has(i.id))
			.map((i) => `${i.name} connecté`),
		...before
			.filter((i) => !afterIds.has(i.id))
			.map((i) => `${i.name} déconnecté`),
	];
	return messages.length > 0 ? messages.join(". ") : null;
}

export function createMidiController(
	env: MidiEnvironment,
	onChange: (status: MidiStatus) => void,
	onMessage?: (data: ArrayLike<number>) => void,
): MidiController {
	const request = env.requestMIDIAccess;
	let status: MidiStatus = request
		? { kind: "idle" }
		: { kind: "unsupported", insecure: !env.isSecureContext };

	const update = (next: MidiStatus) => {
		status = next;
		onChange(next);
	};

	let selectedId: string | null = null;
	let currentAccess: MidiAccessLike | null = null;

	const ready = (
		access: MidiAccessLike,
		announcement: string | null,
		lost?: string,
	): MidiStatus => ({
		kind: "ready",
		inputs: connectedInputs(access),
		announcement,
		...(selectedId ? { selected: selectedId } : {}),
		...(lost ? { lost } : {}),
	});

	const listenToNotes = (access: MidiAccessLike) => {
		for (const input of access.inputs.values()) {
			if (input.type !== "input") continue;
			input.onmidimessage =
				input.state === "connected" &&
				(selectedId === null || input.id === selectedId)
					? (event) => {
							if (event.data) onMessage?.(event.data);
						}
					: null;
		}
	};

	const listen = (access: MidiAccessLike) => {
		access.onstatechange = () => {
			const before = status.kind === "ready" ? status.inputs : [];
			const inputs = connectedInputs(access);
			const lost =
				selectedId !== null && !inputs.some((i) => i.id === selectedId)
					? before.find((i) => i.id === selectedId)?.name
					: undefined;
			if (selectedId !== null && !inputs.some((i) => i.id === selectedId)) {
				selectedId = null;
			}
			listenToNotes(access);
			update(ready(access, describeChanges(before, inputs), lost));
		};
	};

	return {
		get status() {
			return status;
		},
		select(id) {
			if (!currentAccess || status.kind !== "ready") return;
			if (id !== null && !status.inputs.some((i) => i.id === id)) return;
			selectedId = id;
			listenToNotes(currentAccess);
			update(ready(currentAccess, null));
		},
		async activate() {
			if (!request || (status.kind !== "idle" && status.kind !== "error"))
				return;
			update({ kind: "requesting" });
			try {
				const access = await request();
				currentAccess = access;
				listen(access);
				listenToNotes(access);
				update(ready(access, null));
			} catch (error) {
				const refused =
					error instanceof Error && ERREURS_DE_REFUS.includes(error.name);
				update({ kind: refused ? "denied" : "error" });
			}
		},
	};
}

export function browserMidiEnvironment(): MidiEnvironment {
	return {
		requestMIDIAccess:
			typeof navigator.requestMIDIAccess === "function"
				? () => navigator.requestMIDIAccess() as Promise<MidiAccessLike>
				: undefined,
		isSecureContext: window.isSecureContext,
	};
}
