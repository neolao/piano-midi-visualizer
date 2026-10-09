export interface Fullscreen {
	readonly supported: boolean;
	active(): boolean;
	enter(): Promise<void>;
	exit(): Promise<void>;
	onChange(listener: () => void): void;
}

export function browserFullscreen(): Fullscreen {
	const root = document.documentElement;
	return {
		supported: typeof root.requestFullscreen === "function",
		active: () => document.fullscreenElement !== null,
		enter: () => root.requestFullscreen(),
		exit: () => document.exitFullscreen(),
		onChange: (listener) =>
			document.addEventListener("fullscreenchange", listener),
	};
}
