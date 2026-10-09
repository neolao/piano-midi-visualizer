import {
	clampTempo,
	DEFAULT_SIGNATURE,
	DEFAULT_TEMPO,
	isSignature,
	type Signature,
} from "./rhythm";

export interface Settings {
	names: boolean;
	flats: boolean;
	announce: boolean;
	shortcuts: boolean;
	/** Clic du métronome coupé. */
	muted: boolean;
	signature: Signature;
	tempo: number;
}

export type BooleanSetting = {
	[K in keyof Settings]: Settings[K] extends boolean ? K : never;
}[keyof Settings];

const KEY = "piano-midi-visualizer:settings";
const DEFAULTS: Settings = {
	names: true,
	flats: false,
	announce: true,
	shortcuts: true,
	muted: false,
	signature: DEFAULT_SIGNATURE,
	tempo: DEFAULT_TEMPO,
};

function parse(raw: string | null): Partial<Settings> {
	if (!raw) return {};
	try {
		const value: unknown = JSON.parse(raw);
		if (typeof value !== "object" || value === null) return {};
		const stored = value as Record<string, unknown>;
		const result: Partial<Settings> = {};
		for (const key of Object.keys(DEFAULTS) as BooleanSetting[]) {
			if (
				typeof DEFAULTS[key] === "boolean" &&
				typeof stored[key] === "boolean"
			) {
				result[key] = stored[key];
			}
		}
		if (isSignature(stored.signature)) result.signature = stored.signature;
		if (typeof stored.tempo === "number")
			result.tempo = clampTempo(stored.tempo);
		return result;
	} catch {
		return {};
	}
}

/** Réglages mémorisés localement ; le stockage peut manquer ou lever une erreur sans gêner la page. */
export function createSettings(storage: Storage | undefined) {
	let current: Settings = { ...DEFAULTS };
	try {
		current = { ...DEFAULTS, ...parse(storage?.getItem(KEY) ?? null) };
	} catch {
		// stockage indisponible : on garde les valeurs par défaut
	}
	return {
		get: (): Settings => ({ ...current }),
		set(change: Partial<Settings>) {
			current = { ...current, ...change };
			try {
				storage?.setItem(KEY, JSON.stringify(current));
			} catch {
				// la valeur reste valable pour la session
			}
		},
	};
}
