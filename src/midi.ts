export interface NoteEvent {
	kind: "on" | "off";
	note: number;
	velocity: number;
}

const NOTE_OFF = 0x80;
const NOTE_ON = 0x90;

/** Décode un message MIDI brut ; renvoie null pour tout ce qui n'est pas une note valide. */
export function decodeMidiMessage(data: ArrayLike<number>): NoteEvent | null {
	if (data.length < 3) return null;
	const [status, note, velocity] = [data[0], data[1], data[2]];
	const type = status & 0xf0;
	if (type !== NOTE_OFF && type !== NOTE_ON) return null;
	if (note > 127 || velocity > 127) return null;
	const isOn = type === NOTE_ON && velocity > 0;
	return { kind: isOn ? "on" : "off", note, velocity };
}
