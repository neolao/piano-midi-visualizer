export interface Settings {
	names: boolean;
	flats: boolean;
	announce: boolean;
	shortcuts: boolean;
}

const KEY = "piano-midi-visualizer:settings";
const DEFAULTS: Settings = {
	names: true,
	flats: false,
	announce: true,
	shortcuts: true,
};

function parse(raw: string | null): Partial<Settings> {
	if (!raw) return {};
	try {
		const value: unknown = JSON.parse(raw);
		if (typeof value !== "object" || value === null) return {};
		const result: Partial<Settings> = {};
		for (const key of Object.keys(DEFAULTS) as (keyof Settings)[]) {
			const candidate = (value as Record<string, unknown>)[key];
			if (typeof candidate === "boolean") result[key] = candidate;
		}
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
