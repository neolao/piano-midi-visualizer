import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountApp } from "./app";
import type { Fullscreen } from "./fullscreen";
import type { ClickPlayer } from "./metronome";
import type { MidiAccessLike, MidiInputLike } from "./midi-access";

const renders: unknown[] = [];
vi.mock("./score", () => ({
	SLOTS: 8,
	createScore: () => ({
		render: (snapshot: unknown, options: unknown) =>
			renders.push({ snapshot, options }),
	}),
}));

let root: HTMLElement;
let piano: MidiInputLike;
let access: MidiAccessLike;

function memoryStorage(): Storage {
	const data = new Map<string, string>();
	return {
		getItem: (k) => data.get(k) ?? null,
		setItem: (k, v) => void data.set(k, v),
		removeItem: (k) => void data.delete(k),
		clear: () => data.clear(),
		key: () => null,
		get length() {
			return data.size;
		},
	};
}

function boot(
	storage: Storage = memoryStorage(),
	now = () => 0,
	player?: ClickPlayer,
	fullscreen?: Fullscreen,
) {
	piano = {
		id: "a",
		name: "Yamaha P-125",
		manufacturer: "Yamaha",
		type: "input",
		state: "connected",
	};
	access = { inputs: new Map([["a", piano]]), onstatechange: null };
	mountApp(root, {
		environment: {
			requestMIDIAccess: async () => access,
			isSecureContext: true,
		},
		storage,
		now,
		player,
		fullscreen,
	});
}

const send = (...bytes: number[]) =>
	piano.onmidimessage?.({ data: new Uint8Array(bytes) });
const flush = async () => {
	await Promise.resolve();
	await new Promise((r) => setTimeout(r, 0));
	await new Promise((r) => requestAnimationFrame(() => r(null)));
};
const buttonByText = (text: string) =>
	[...root.querySelectorAll("button")].find((b) =>
		b.textContent?.startsWith(text),
	) as HTMLButtonElement;

beforeEach(() => {
	document.body.innerHTML = '<div id="app"></div>';
	root = document.querySelector("#app") as HTMLElement;
	renders.length = 0;
	vi.useRealTimers();
});

describe("mountApp", () => {
	it("invite à activer le MIDI avant l'activation, avec Figer et Effacer désactivés", async () => {
		boot();
		await flush();
		expect(root.textContent).toContain("Activez le MIDI, puis jouez une note");
		expect(buttonByText("Activer le MIDI")).toBeTruthy();
		expect(buttonByText("Figer l'historique").disabled).toBe(true);
		expect(buttonByText("Effacer la partition").disabled).toBe(true);
	});

	it("affiche l'invitation à jouer une fois le piano connecté, puis l'accord joué", async () => {
		boot();
		buttonByText("Activer le MIDI").click();
		await flush();
		expect(root.textContent).toContain("Piano connecté : Yamaha P-125");
		expect(root.textContent).toContain("Jouez une note, elle apparaît ici");
		send(0x90, 60, 100);
		send(0x90, 64, 100);
		await flush();
		expect(renders.at(-1)).toMatchObject({ snapshot: { current: [60, 64] } });
		expect(root.querySelector(".hint")?.hasAttribute("hidden")).toBe(true);
		expect(root.querySelector(".score .sr")?.textContent).toBe(
			"Mesure 4/4, tempo 80. Accord en cours : Do 4, Mi 4. Historique vide.",
		);
	});

	it("fige la partition puis reprend le direct", async () => {
		boot();
		buttonByText("Activer le MIDI").click();
		await flush();
		send(0x90, 60, 100);
		await flush();
		buttonByText("Figer l'historique").click();
		send(0x80, 60, 0);
		send(0x90, 72, 100);
		await flush();
		expect(renders.at(-1)).toMatchObject({
			snapshot: { current: [60], history: [] },
		});
		expect(buttonByText("Reprendre le direct")).toBeTruthy();
		buttonByText("Reprendre le direct").click();
		await flush();
		expect(renders.at(-1)).toMatchObject({
			snapshot: { current: [72], history: [[60]] },
		});
	});

	it("efface la partition et permet d'annuler", async () => {
		let t = 0;
		boot(memoryStorage(), () => t);
		buttonByText("Activer le MIDI").click();
		await flush();
		send(0x90, 60, 100);
		send(0x80, 60, 0);
		t = 500;
		send(0x90, 64, 100);
		await flush();
		buttonByText("Effacer la partition").click();
		await flush();
		expect(renders.at(-1)).toMatchObject({
			snapshot: { current: [], history: [] },
		});
		expect(root.textContent).toContain("Partition effacée");
		buttonByText("Annuler").click();
		await flush();
		expect(renders.at(-1)).toMatchObject({
			snapshot: { current: [64], history: [[60]] },
		});
	});

	it("applique et mémorise le choix bémols depuis le tiroir d'options", async () => {
		const storage = memoryStorage();
		boot(storage);
		buttonByText("Activer le MIDI").click();
		await flush();
		buttonByText("Options").click();
		expect(root.querySelector("#options-drawer")).toBeTruthy();
		(root.querySelector('[data-key="flats"]') as HTMLButtonElement).click();
		await flush();
		expect(renders.at(-1)).toMatchObject({ options: { flats: true } });
		expect(storage.getItem("piano-midi-visualizer:settings")).toContain(
			'"flats":true',
		);
	});

	it("ferme le tiroir avec Échap et rend le focus à Options", async () => {
		boot();
		buttonByText("Options").click();
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
		expect(root.querySelector("#options-drawer")).toBeNull();
		expect(document.activeElement).toBe(buttonByText("Options"));
	});

	it("ne déclenche pas les raccourcis quand ils sont désactivés", async () => {
		const storage = memoryStorage();
		storage.setItem(
			"piano-midi-visualizer:settings",
			JSON.stringify({ shortcuts: false }),
		);
		boot(storage);
		buttonByText("Activer le MIDI").click();
		await flush();
		document.dispatchEvent(
			new KeyboardEvent("keydown", { key: "f", bubbles: true }),
		);
		expect(buttonByText("Figer l'historique")).toBeTruthy();
		expect(root.textContent).not.toContain("Reprendre le direct");
	});

	it("fige avec la touche F quand les raccourcis sont actifs", async () => {
		boot();
		buttonByText("Activer le MIDI").click();
		await flush();
		document.dispatchEvent(
			new KeyboardEvent("keydown", { key: "f", bubbles: true }),
		);
		expect(buttonByText("Reprendre le direct")).toBeTruthy();
	});

	it("relâche les notes tenues quand le piano est débranché", async () => {
		boot();
		buttonByText("Activer le MIDI").click();
		await flush();
		send(0x90, 60, 100);
		piano.state = "disconnected";
		access.onstatechange?.({});
		await flush();
		expect(renders.at(-1)).toMatchObject({
			snapshot: { current: [], history: [[60]] },
		});
		expect(root.textContent).toContain("Piano débranché");
	});

	it("annonce le dernier accord après deux secondes de silence", async () => {
		vi.useFakeTimers();
		boot();
		buttonByText("Activer le MIDI").click();
		await vi.advanceTimersByTimeAsync(10);
		send(0x90, 60, 100);
		send(0x80, 60, 0);
		await vi.advanceTimersByTimeAsync(2100);
		expect(root.querySelector('[role="status"][aria-live]')?.textContent).toBe(
			"Accord : Do 4",
		);
	});

	it("annuler un effacement garde les notes jouées depuis", async () => {
		let t = 0;
		boot(memoryStorage(), () => t);
		buttonByText("Activer le MIDI").click();
		await flush();
		send(0x90, 60, 100);
		send(0x80, 60, 0);
		buttonByText("Effacer la partition").click();
		t = 500;
		send(0x90, 72, 100);
		send(0x80, 72, 0);
		buttonByText("Annuler").click();
		await flush();
		expect(renders.at(-1)).toMatchObject({
			snapshot: { current: [], history: [[60], [72]] },
		});
	});

	it("garde le bouton Annuler quand on relit l'accord avec L", async () => {
		boot();
		buttonByText("Activer le MIDI").click();
		await flush();
		buttonByText("Effacer la partition").click();
		document.dispatchEvent(
			new KeyboardEvent("keydown", { key: "l", bubbles: true }),
		);
		expect(buttonByText("Annuler")).toBeTruthy();
	});

	it("indique que l'historique est figé quand rien ne s'affiche", async () => {
		boot();
		buttonByText("Activer le MIDI").click();
		await flush();
		buttonByText("Figer l'historique").click();
		await flush();
		expect(root.querySelector(".hint")?.textContent).toBe(
			"Historique figé. Reprenez le direct pour voir vos notes.",
		);
	});

	it("nomme chaque bascule du tiroir par son réglage", async () => {
		boot();
		buttonByText("Options").click();
		const names = [
			...root.querySelectorAll<HTMLButtonElement>("[data-key]"),
		].map(
			(b) =>
				document.getElementById(b.getAttribute("aria-labelledby") ?? "")
					?.textContent,
		);
		expect(names).toEqual([
			"Couper le son du métronome",
			"Noms de notes",
			"Bémols à la place des dièses",
			"Annonce du dernier accord après un silence",
			"Raccourcis clavier",
		]);
	});

	it("laisse le focus sur Options à l'ouverture du tiroir", async () => {
		boot();
		buttonByText("Options").focus();
		buttonByText("Options").click();
		expect(document.activeElement).toBe(buttonByText("Options"));
		expect(buttonByText("Options").getAttribute("aria-controls")).toBe(
			"options-drawer",
		);
	});

	it("ignore la répétition automatique d'une touche maintenue", async () => {
		boot();
		buttonByText("Activer le MIDI").click();
		await flush();
		document.dispatchEvent(
			new KeyboardEvent("keydown", { key: "f", bubbles: true }),
		);
		document.dispatchEvent(
			new KeyboardEvent("keydown", { key: "f", bubbles: true, repeat: true }),
		);
		expect(buttonByText("Reprendre le direct")).toBeTruthy();
	});

	it("annonce encore l'accord après un second silence", async () => {
		vi.useFakeTimers();
		boot();
		buttonByText("Activer le MIDI").click();
		await vi.advanceTimersByTimeAsync(10);
		send(0x90, 60, 100);
		send(0x80, 60, 0);
		await vi.advanceTimersByTimeAsync(2100);
		send(0x90, 64, 100);
		send(0x80, 64, 0);
		await vi.advanceTimersByTimeAsync(2100);
		expect(root.querySelector('[role="status"][aria-live]')?.textContent).toBe(
			"Accord : Mi 4",
		);
	});

	it("garde la partition visible quand l'accès MIDI est refusé", async () => {
		const denied = new Error("refus");
		denied.name = "SecurityError";
		piano = {
			id: "a",
			name: "P",
			manufacturer: "",
			type: "input",
			state: "connected",
		};
		mountApp(root, {
			environment: {
				requestMIDIAccess: async () => {
					throw denied;
				},
				isSecureContext: true,
			},
			storage: memoryStorage(),
		});
		buttonByText("Activer le MIDI").click();
		await flush();
		expect(root.textContent).toContain("L'accès au MIDI a été refusé.");
		expect(root.querySelector<HTMLElement>(".score")?.hidden).toBe(false);
	});

	it("n'affiche que les notes du piano choisi et relâche les notes tenues", async () => {
		boot();
		const second: MidiInputLike = {
			id: "b",
			name: "Roland FP-30X",
			manufacturer: "Roland",
			type: "input",
			state: "connected",
		};
		(access.inputs as Map<string, MidiInputLike>).set("b", second);
		buttonByText("Activer le MIDI").click();
		await flush();
		send(0x90, 60, 100);
		const select = root.querySelector("select") as HTMLSelectElement;
		select.value = "b";
		select.dispatchEvent(new Event("change"));
		await flush();
		expect(renders.at(-1)).toMatchObject({
			snapshot: { current: [], history: [[60]] },
		});
		send(0x90, 64, 100);
		second.onmidimessage?.({ data: new Uint8Array([0x90, 67, 100]) });
		await flush();
		expect(renders.at(-1)).toMatchObject({ snapshot: { current: [67] } });
	});

	it("prévient quand le piano choisi est débranché", async () => {
		boot();
		const second: MidiInputLike = {
			id: "b",
			name: "Roland FP-30X",
			manufacturer: "Roland",
			type: "input",
			state: "connected",
		};
		(access.inputs as Map<string, MidiInputLike>).set("b", second);
		buttonByText("Activer le MIDI").click();
		await flush();
		const select = root.querySelector("select") as HTMLSelectElement;
		select.value = "b";
		select.dispatchEvent(new Event("change"));
		second.state = "disconnected";
		access.onstatechange?.({});
		await flush();
		expect(root.textContent).toContain("Roland FP-30X débranché");
	});

	describe("rythme", () => {
		const clicks: boolean[] = [];
		let audioOk = true;
		const player: ClickPlayer = {
			now: () => Date.now() / 1000,
			click: (_, accent) => clicks.push(accent),
			resume: async () => audioOk,
		};
		const live = () => root.querySelectorAll<HTMLElement>("[role=status]");
		const said = () => [...live()].map((n) => n.textContent).join(" | ");
		const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

		beforeEach(() => {
			clicks.length = 0;
			audioOk = true;
		});

		const open = () => buttonByText("Options").click();
		const signature = (label: string) =>
			[...root.querySelectorAll<HTMLButtonElement>("[role=radio]")].find(
				(b) => b.textContent === label,
			) as HTMLButtonElement;
		const tempoInput = () =>
			root.querySelector('input[data-rhythm="tempo"]') as HTMLInputElement;

		it("propose 2/4, 3/4, 4/4 et 6/8 avec 4/4 et 80 par défaut, rien ne sonne", async () => {
			boot(memoryStorage(), () => 0, player);
			open();
			const radios = [
				...root.querySelectorAll<HTMLButtonElement>("[role=radio]"),
			];
			expect(radios.map((b) => b.textContent)).toEqual([
				"2/4",
				"3/4",
				"4/4",
				"6/8",
			]);
			expect(radios.map((b) => b.getAttribute("aria-checked"))).toEqual([
				"false",
				"false",
				"true",
				"false",
			]);
			expect(tempoInput().value).toBe("80");
			await wait(200);
			expect(clicks).toEqual([]);
			expect(buttonByText("Démarrer le métronome")).toBeTruthy();
		});

		it("mémorise la mesure et le tempo choisis et les transmet à la partition", async () => {
			const storage = memoryStorage();
			boot(storage, () => 0, player);
			open();
			signature("3/4").click();
			setTempoValue("96");
			await flush();
			expect(renders.at(-1)).toMatchObject({
				options: { signature: "3/4", tempo: 96 },
			});
			expect(storage.getItem("piano-midi-visualizer:settings")).toContain(
				'"signature":"3/4","tempo":96',
			);
		});

		function setTempoValue(value: string) {
			tempoInput().value = value;
			tempoInput().dispatchEvent(new Event("change"));
		}

		it("limite un tempo hors bornes et le dit", async () => {
			boot(memoryStorage(), () => 0, player);
			open();
			setTempoValue("999");
			await wait(60);
			expect(tempoInput().value).toBe("200");
			expect(said()).toContain("Tempo limité à 200");
		});

		it("refuse un tempo vide sans changer le réglage", async () => {
			boot(memoryStorage(), () => 0, player);
			open();
			setTempoValue("");
			await wait(60);
			expect(tempoInput().value).toBe("80");
			expect(said()).toContain("Tempo non valide");
		});

		it("accélère et ralentit le tempo par pas de 5 avec les gros boutons", async () => {
			boot(memoryStorage(), () => 0, player);
			open();
			(root.querySelector('[aria-label="Accélérer"]') as HTMLElement).click();
			expect(tempoInput().value).toBe("85");
			(root.querySelector('[aria-label="Ralentir"]') as HTMLElement).click();
			(root.querySelector('[aria-label="Ralentir"]') as HTMLElement).click();
			expect(tempoInput().value).toBe("75");
		});

		it("annule un changement de mesure sans perdre l'historique", async () => {
			boot(memoryStorage(), () => 0, player);
			buttonByText("Activer le MIDI").click();
			await flush();
			send(0x90, 60, 100);
			send(0x80, 60, 0);
			open();
			signature("6/8").click();
			await flush();
			expect(renders.at(-1)).toMatchObject({
				snapshot: { history: [[60]] },
				options: { signature: "6/8" },
			});
			buttonByText("Annuler").click();
			await flush();
			expect(renders.at(-1)).toMatchObject({
				snapshot: { history: [[60]] },
				options: { signature: "4/4" },
			});
		});

		it("démarre et arrête le métronome en annonçant l'état une seule fois", async () => {
			boot(memoryStorage(), () => 0, player);
			buttonByText("Démarrer le métronome").click();
			await wait(250);
			expect(clicks[0]).toBe(true);
			expect(said()).toContain("Métronome en marche");
			expect(root.querySelector(".beat")?.textContent).toBe("1");
			buttonByText("Arrêter le métronome").click();
			await wait(60);
			expect(said()).toContain("Métronome arrêté");
			expect(root.querySelector(".beat")?.textContent).toBe("");
		});

		it("se pilote avec la touche M quand les raccourcis sont actifs", async () => {
			boot(memoryStorage(), () => 0, player);
			document.dispatchEvent(new KeyboardEvent("keydown", { key: "m" }));
			await wait(100);
			expect(buttonByText("Arrêter le métronome")).toBeTruthy();
			document.dispatchEvent(new KeyboardEvent("keydown", { key: "m" }));
			expect(buttonByText("Démarrer le métronome")).toBeTruthy();
		});

		it("n'émet aucun son quand il est coupé mais garde le temps affiché", async () => {
			boot(memoryStorage(), () => 0, player);
			open();
			(root.querySelector('[data-key="muted"]') as HTMLButtonElement).click();
			await wait(60);
			expect(said()).toContain("Son du métronome coupé");
			buttonByText("Démarrer le métronome").click();
			await wait(250);
			expect(clicks).toEqual([]);
			expect(root.querySelector(".beat")?.textContent).toBe("1");
		});

		it("prévient quand le navigateur refuse l'audio, et bat quand même", async () => {
			audioOk = false;
			boot(memoryStorage(), () => 0, player);
			buttonByText("Démarrer le métronome").click();
			await wait(250);
			expect(said()).toContain("sans son");
			expect(root.querySelector(".beat")?.textContent).toBe("1");
		});

		it("décrit la durée de chaque accord de l'historique pour les lecteurs d'écran", async () => {
			let t = 0;
			boot(memoryStorage(), () => t, player);
			buttonByText("Activer le MIDI").click();
			await flush();
			send(0x90, 60, 100);
			t = 1125;
			send(0x80, 60, 0);
			await flush();
			expect(root.querySelector(".score .sr")?.textContent).toContain(
				"Do 4 (noire pointée)",
			);
		});
	});

	describe("plein écran", () => {
		/** État propre à chaque test : les anciennes pages montées gardent le leur. */
		let state = { active: false, refuse: false, listener: () => {} };
		const fake = (supported = true): Fullscreen => {
			const own = state;
			return {
				supported,
				active: () => own.active,
				enter: async () => {
					if (own.refuse) throw new Error("refusé");
					own.active = true;
					own.listener();
				},
				exit: async () => {
					own.active = false;
					own.listener();
				},
				onChange: (l) => {
					own.listener = l;
				},
			};
		};
		const said = () =>
			[...root.querySelectorAll("[role=status]")]
				.map((n) => n.textContent)
				.join(" | ");
		const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
		const bootFullscreen = (supported = true, storage = memoryStorage()) =>
			boot(storage, () => 0, undefined, fake(supported));

		beforeEach(() => {
			state = { active: false, refuse: false, listener: () => {} };
		});

		it("passe en plein écran puis le quitte avec le bouton", async () => {
			bootFullscreen();
			buttonByText("Plein écran").click();
			await wait(60);
			expect(buttonByText("Quitter le plein écran")).toBeTruthy();
			expect(said()).toContain("Plein écran activé");
			buttonByText("Quitter le plein écran").click();
			await wait(60);
			expect(buttonByText("Plein écran")).toBeTruthy();
			expect(said()).toContain("Plein écran quitté");
		});

		it("se pilote avec la touche P", async () => {
			bootFullscreen();
			document.dispatchEvent(new KeyboardEvent("keydown", { key: "p" }));
			await wait(60);
			expect(buttonByText("Quitter le plein écran")).toBeTruthy();
		});

		it("ignore la touche P quand les raccourcis sont désactivés", async () => {
			const storage = memoryStorage();
			storage.setItem("piano-midi-visualizer:settings", '{"shortcuts":false}');
			bootFullscreen(true, storage);
			document.dispatchEvent(new KeyboardEvent("keydown", { key: "p" }));
			await wait(60);
			expect(buttonByText("Plein écran")).toBeTruthy();
		});

		it("remet le bouton à jour quand le navigateur quitte le plein écran (Échap)", async () => {
			bootFullscreen();
			buttonByText("Plein écran").click();
			await wait(60);
			state.active = false;
			state.listener();
			await wait(60);
			expect(buttonByText("Plein écran")).toBeTruthy();
		});

		it("n'affiche pas le bouton quand le navigateur ne gère pas le plein écran", () => {
			bootFullscreen(false);
			expect(
				[...root.querySelectorAll("button")].some(
					(b) =>
						b.textContent?.includes("plein écran") ||
						b.textContent?.startsWith("Plein écran"),
				),
			).toBe(false);
		});

		it("prévient quand le navigateur refuse et reste sur « Plein écran »", async () => {
			state.refuse = true;
			bootFullscreen();
			buttonByText("Plein écran").click();
			await wait(60);
			expect(said()).toContain("Le navigateur n'a pas autorisé le plein écran");
			expect(buttonByText("Plein écran")).toBeTruthy();
		});
	});
});
