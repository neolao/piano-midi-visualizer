import "./styles/tokens.css";
import "./styles/base.css";
import { mountApp } from "./app";
import { browserMidiEnvironment } from "./midi-access";

const root = document.querySelector<HTMLElement>("#app");
if (root) {
	let storage: Storage | undefined;
	try {
		storage = window.localStorage;
	} catch {
		// stockage bloqué : les réglages ne seront pas mémorisés
	}
	mountApp(root, { environment: browserMidiEnvironment(), storage });
}
