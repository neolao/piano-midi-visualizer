import { browserMidiEnvironment, createMidiController } from "./midi-access";
import { createMidiPanel } from "./midi-panel";

const app = document.querySelector<HTMLElement>("#app");
if (app) {
	const title = document.createElement("h1");
	title.textContent = "Piano MIDI Visualizer";
	const midi = document.createElement("div");
	app.replaceChildren(title, midi);

	const panel = createMidiPanel(midi, () => void controller.activate());
	const controller = createMidiController(browserMidiEnvironment(), (status) =>
		panel.render(status),
	);
	panel.render(controller.status);
}
