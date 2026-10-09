export interface Grid {
	readonly active: boolean;
	start(atMs: number, tempo: number, beatsPerMeasure: number): void;
	setTempo(atMs: number, tempo: number): void;
	setMeasure(atMs: number, beatsPerMeasure: number): void;
	stop(): void;
	/** Temps (fractionnaire) écoulé depuis le départ du métronome à l'instant donné. */
	beatAt(ms: number): number;
	/** Temps où tombe une barre de mesure, entre les deux bornes (comprises). */
	barBeats(fromBeat: number, toBeat: number): number[];
}

interface Segment {
	atMs: number;
	beat: number;
	tempo: number;
	/** Temps où commence le décompte des mesures de ce segment. */
	origin: number;
	perMeasure: number;
}

const valid = (value: number) => Number.isFinite(value) && value > 0;

export function createGrid(): Grid {
	let segments: Segment[] = [];
	let active = false;

	const segmentAt = (ms: number): Segment => {
		let found = segments[0];
		for (const segment of segments) {
			if (segment.atMs <= ms) found = segment;
		}
		return found;
	};

	const beatIn = (segment: Segment, ms: number) =>
		segment.beat + ((ms - segment.atMs) * segment.tempo) / 60000;

	const push = (atMs: number, change: Partial<Segment>) => {
		const last = segments[segments.length - 1];
		const beat = beatIn(last, atMs);
		segments.push({ ...last, ...change, atMs, beat });
	};

	return {
		get active() {
			return active;
		},
		start(atMs, tempo, beatsPerMeasure) {
			segments = [
				{ atMs, beat: 0, tempo, origin: 0, perMeasure: beatsPerMeasure },
			];
			active = true;
		},
		setTempo(atMs, tempo) {
			if (!active || !valid(tempo)) return;
			push(atMs, { tempo });
		},
		setMeasure(atMs, beatsPerMeasure) {
			if (!active || !valid(beatsPerMeasure)) return;
			const last = segments[segments.length - 1];
			push(atMs, { perMeasure: beatsPerMeasure, origin: beatIn(last, atMs) });
		},
		stop() {
			active = false;
		},
		beatAt(ms) {
			if (segments.length === 0) return 0;
			return beatIn(segmentAt(ms), ms);
		},
		barBeats(fromBeat, toBeat) {
			const bars: number[] = [];
			segments.forEach((segment, i) => {
				const next = segments[i + 1];
				const start = Math.max(fromBeat, segment.origin);
				const end = Math.min(
					toBeat,
					next ? next.beat - 1e-9 : Number.POSITIVE_INFINITY,
				);
				if (start > end) return;
				const first = Math.ceil((start - segment.origin) / segment.perMeasure);
				for (
					let beat = segment.origin + first * segment.perMeasure;
					beat <= end + 1e-9;
					beat += segment.perMeasure
				) {
					bars.push(Math.round(beat * 1e6) / 1e6);
				}
			});
			return bars;
		},
	};
}
