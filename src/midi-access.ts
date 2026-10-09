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
	| { kind: "ready"; inputs: MidiInputInfo[]; announcement: string | null };

export interface MidiController {
	readonly status: MidiStatus;
	activate(): Promise<void>;
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

	const listenToNotes = (access: MidiAccessLike) => {
		for (const input of access.inputs.values()) {
			if (input.type !== "input") continue;
			input.onmidimessage =
				input.state === "connected"
					? (event) => {
							if (event.data) onMessage?.(event.data);
						}
					: null;
		}
	};

	const listen = (access: MidiAccessLike) => {
		access.onstatechange = () => {
			listenToNotes(access);
			const before = status.kind === "ready" ? status.inputs : [];
			const inputs = connectedInputs(access);
			update({
				kind: "ready",
				inputs,
				announcement: describeChanges(before, inputs),
			});
		};
	};

	return {
		get status() {
			return status;
		},
		async activate() {
			if (!request || (status.kind !== "idle" && status.kind !== "error"))
				return;
			update({ kind: "requesting" });
			try {
				const access = await request();
				listen(access);
				listenToNotes(access);
				update({
					kind: "ready",
					inputs: connectedInputs(access),
					announcement: null,
				});
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
