export interface ClickPlayer {
	/** Heure du lecteur audio, en secondes. */
	now(): number;
	click(at: number, accent: boolean): void;
	/** Prépare l'audio ; faux quand le navigateur ne peut pas jouer de son. */
	resume(): Promise<boolean>;
}

export interface Metronome {
	readonly running: boolean;
	start(): Promise<{ sound: boolean }>;
	stop(): void;
	setRhythm(rhythm: { beats: number; tempo: number }): void;
	setMuted(muted: boolean): void;
}

const LOOKAHEAD_S = 0.1;
const TICK_MS = 25;
const FIRST_BEAT_DELAY_S = 0.05;

export function createMetronome(
	player: ClickPlayer,
	onBeat: (beat: number) => void,
): Metronome {
	let beats = 4;
	let tempo = 80;
	let muted = false;
	let running = false;
	let sound = false;
	let timer: ReturnType<typeof setInterval> | undefined;
	let pending: ReturnType<typeof setTimeout>[] = [];
	let nextAt = 0;
	let index = 0;

	const schedule = () => {
		while (nextAt < player.now() + LOOKAHEAD_S) {
			const beat = index % beats;
			if (sound && !muted) player.click(nextAt, beat === 0);
			const delay = Math.max(0, (nextAt - player.now()) * 1000);
			const handle = setTimeout(() => {
				pending = pending.filter((h) => h !== handle);
				onBeat(beat);
			}, delay);
			pending.push(handle);
			nextAt += 60 / tempo;
			index++;
		}
	};

	return {
		get running() {
			return running;
		},
		async start() {
			if (running) return { sound };
			running = true;
			try {
				sound = await player.resume();
			} catch {
				sound = false;
			}
			if (!running) return { sound };
			index = 0;
			nextAt = player.now() + FIRST_BEAT_DELAY_S;
			schedule();
			timer = setInterval(schedule, TICK_MS);
			return { sound };
		},
		stop() {
			running = false;
			clearInterval(timer);
			for (const handle of pending) clearTimeout(handle);
			pending = [];
		},
		setRhythm(rhythm) {
			beats = rhythm.beats;
			tempo = rhythm.tempo;
		},
		setMuted(value) {
			muted = value;
		},
	};
}

/** Clic synthétisé par le navigateur : aucun fichier audio. */
export function browserClickPlayer(): ClickPlayer {
	let context: AudioContext | undefined;
	return {
		now: () => context?.currentTime ?? performance.now() / 1000,
		async resume() {
			const Audio = window.AudioContext;
			if (!Audio) return false;
			context ??= new Audio();
			await context.resume();
			return context.state === "running";
		},
		click(at, accent) {
			if (!context) return;
			const oscillator = context.createOscillator();
			const gain = context.createGain();
			oscillator.frequency.value = accent ? 1500 : 1000;
			gain.gain.setValueAtTime(0.4, at);
			gain.gain.exponentialRampToValueAtTime(0.001, at + 0.05);
			oscillator.connect(gain).connect(context.destination);
			oscillator.start(at);
			oscillator.stop(at + 0.06);
		},
	};
}
