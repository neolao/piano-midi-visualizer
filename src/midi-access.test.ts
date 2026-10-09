import { describe, expect, it } from "vitest";
import {
	createMidiController,
	type MidiAccessLike,
	type MidiInputLike,
	type MidiStatus,
} from "./midi-access";

function input(
	id: string,
	name: string | null,
	state = "connected",
	manufacturer = "Yamaha",
): MidiInputLike {
	return { id, name, manufacturer, type: "input", state };
}

function fakeAccess(initial: MidiInputLike[]) {
	const map = new Map(initial.map((i) => [i.id, i]));
	const access: MidiAccessLike = { inputs: map, onstatechange: null };
	return {
		access,
		add: (i: MidiInputLike) => {
			map.set(i.id, i);
			access.onstatechange?.({});
		},
		remove: (id: string) => {
			map.delete(id);
			access.onstatechange?.({});
		},
		setState: (id: string, state: string) => {
			const current = map.get(id);
			if (current) current.state = state;
			access.onstatechange?.({});
		},
	};
}

function setup(
	request: (() => Promise<MidiAccessLike>) | undefined,
	isSecureContext = true,
) {
	const seen: MidiStatus[] = [];
	const controller = createMidiController(
		{ requestMIDIAccess: request, isSecureContext },
		(s) => seen.push(s),
	);
	return { controller, seen };
}

function domError(name: string) {
	const error = new Error(name);
	error.name = name;
	return error;
}

describe("createMidiController", () => {
	it("démarre en attente d'activation quand Web MIDI existe", () => {
		const { controller } = setup(async () => fakeAccess([]).access);
		expect(controller.status).toEqual({ kind: "idle" });
	});

	it("signale un navigateur non compatible sans rien demander", () => {
		const { controller } = setup(undefined);
		expect(controller.status).toEqual({ kind: "unsupported", insecure: false });
	});

	it("signale le contexte non sécurisé quand Web MIDI est absent hors HTTPS", () => {
		const { controller } = setup(undefined, false);
		expect(controller.status).toEqual({ kind: "unsupported", insecure: true });
	});

	it("passe par « requesting » puis liste les entrées connectées après activation", async () => {
		const fake = fakeAccess([input("a", "Piano XYZ")]);
		const { controller, seen } = setup(async () => fake.access);
		await controller.activate();
		expect(seen[0]).toEqual({ kind: "requesting" });
		expect(controller.status).toEqual({
			kind: "ready",
			inputs: [{ id: "a", name: "Piano XYZ", manufacturer: "Yamaha" }],
			announcement: null,
		});
	});

	it("affiche l'état vide quand aucun piano n'est branché", async () => {
		const { controller } = setup(async () => fakeAccess([]).access);
		await controller.activate();
		expect(controller.status).toMatchObject({ kind: "ready", inputs: [] });
	});

	it("ignore les entrées à l'état déconnecté et donne un nom par défaut sans nom", async () => {
		const fake = fakeAccess([
			input("a", "Ancien", "disconnected"),
			input("b", null),
		]);
		const { controller } = setup(async () => fake.access);
		await controller.activate();
		expect(controller.status).toMatchObject({
			inputs: [{ id: "b", name: "Entrée MIDI sans nom" }],
		});
	});

	it("met la liste à jour et annonce la connexion à chaud", async () => {
		const fake = fakeAccess([]);
		const { controller } = setup(async () => fake.access);
		await controller.activate();
		fake.add(input("a", "Piano XYZ"));
		expect(controller.status).toMatchObject({
			inputs: [{ id: "a", name: "Piano XYZ" }],
			announcement: "Piano XYZ connecté",
		});
	});

	it("annonce celui qui part quand on débranche un de deux claviers", async () => {
		const fake = fakeAccess([input("a", "Piano A"), input("b", "Piano B")]);
		const { controller } = setup(async () => fake.access);
		await controller.activate();
		fake.remove("a");
		expect(controller.status).toMatchObject({
			inputs: [{ id: "b", name: "Piano B" }],
			announcement: "Piano A déconnecté",
		});
	});

	it("annonce la déconnexion d'une entrée qui passe à l'état déconnecté", async () => {
		const fake = fakeAccess([input("a", "Piano A")]);
		const { controller } = setup(async () => fake.access);
		await controller.activate();
		fake.setState("a", "disconnected");
		expect(controller.status).toMatchObject({
			inputs: [],
			announcement: "Piano A déconnecté",
		});
	});

	it("retombe sur l'état vide quand la dernière entrée disparaît", async () => {
		const fake = fakeAccess([input("a", "Piano A")]);
		const { controller } = setup(async () => fake.access);
		await controller.activate();
		fake.remove("a");
		expect(controller.status).toMatchObject({ kind: "ready", inputs: [] });
	});

	it("passe en « denied » quand l'utilisateur refuse, sans nouvelle demande", async () => {
		let calls = 0;
		const { controller } = setup(async () => {
			calls++;
			throw domError("SecurityError");
		});
		await controller.activate();
		expect(controller.status).toEqual({ kind: "denied" });
		await controller.activate();
		expect(calls).toBe(1);
	});

	it("traite NotAllowedError comme un refus", async () => {
		const { controller } = setup(async () => {
			throw domError("NotAllowedError");
		});
		await controller.activate();
		expect(controller.status).toEqual({ kind: "denied" });
	});

	it("passe en « error » sur un échec inattendu et permet de réessayer", async () => {
		const fake = fakeAccess([input("a", "Piano A")]);
		let first = true;
		const { controller } = setup(async () => {
			if (first) {
				first = false;
				throw domError("InvalidStateError");
			}
			return fake.access;
		});
		await controller.activate();
		expect(controller.status).toEqual({ kind: "error" });
		await controller.activate();
		expect(controller.status).toMatchObject({ kind: "ready" });
	});

	it("ignore une activation quand Web MIDI est absent", async () => {
		const { controller, seen } = setup(undefined);
		await controller.activate();
		expect(seen).toEqual([]);
		expect(controller.status.kind).toBe("unsupported");
	});

	describe("réception des notes", () => {
		function withMessages(initial: MidiInputLike[]) {
			const fake = fakeAccess(initial);
			const received: number[][] = [];
			const controller = createMidiController(
				{ requestMIDIAccess: async () => fake.access, isSecureContext: true },
				() => {},
				(data) => received.push(Array.from(data)),
			);
			return { fake, controller, received };
		}

		it("transmet les messages des entrées connectées après activation", async () => {
			const piano = input("a", "Piano A");
			const { controller, received } = withMessages([piano]);
			await controller.activate();
			piano.onmidimessage?.({ data: new Uint8Array([0x90, 60, 100]) });
			expect(received).toEqual([[0x90, 60, 100]]);
		});

		it("écoute aussi un piano branché à chaud", async () => {
			const { fake, controller, received } = withMessages([]);
			await controller.activate();
			const late = input("b", "Piano B");
			fake.add(late);
			late.onmidimessage?.({ data: new Uint8Array([0x80, 60, 0]) });
			expect(received).toEqual([[0x80, 60, 0]]);
		});

		it("n'écoute plus une entrée qui passe à l'état déconnecté", async () => {
			const piano = input("a", "Piano A");
			const { fake, controller } = withMessages([piano]);
			await controller.activate();
			fake.setState("a", "disconnected");
			expect(piano.onmidimessage).toBeNull();
		});

		it("ignore un message sans données", async () => {
			const piano = input("a", "Piano A");
			const { controller, received } = withMessages([piano]);
			await controller.activate();
			piano.onmidimessage?.({ data: null });
			expect(received).toEqual([]);
		});
	});
});
