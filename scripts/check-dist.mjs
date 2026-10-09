import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** Chemins qui commencent par « / » : ils cassent sous le sous-chemin de GitHub Pages. */
export function findAbsolutePaths(html) {
	const found = [];
	for (const match of html.matchAll(/\b(?:src|href)="(\/[^"]*)"/g)) {
		found.push(match[1]);
	}
	return found;
}

export function checkDist(dir) {
	const index = join(dir, "index.html");
	if (!existsSync(index)) {
		throw new Error(
			`${index} est introuvable : lancez d'abord « npm run build ».`,
		);
	}
	return findAbsolutePaths(readFileSync(index, "utf8"));
}

const REQUIRED_TEXT = ["name", "short_name", "start_url"];

/** Problèmes qui empêcheraient Chrome d'installer l'application. */
export function checkInstallable(dir) {
	const problems = [];
	const index = join(dir, "index.html");
	if (
		!existsSync(index) ||
		!/rel="manifest"/.test(readFileSync(index, "utf8"))
	) {
		problems.push('index.html ne contient pas de lien rel="manifest"');
	}
	const file = join(dir, "manifest.webmanifest");
	if (!existsSync(file)) {
		problems.push("manifest.webmanifest est introuvable");
		return problems;
	}
	let manifest;
	try {
		manifest = JSON.parse(readFileSync(file, "utf8"));
	} catch {
		problems.push("manifest.webmanifest n'est pas du JSON valide");
		return problems;
	}
	for (const key of REQUIRED_TEXT) {
		if (typeof manifest[key] !== "string" || manifest[key] === "") {
			problems.push(`manifest.webmanifest : « ${key} » manquant`);
		}
	}
	if (!["standalone", "fullscreen", "minimal-ui"].includes(manifest.display)) {
		problems.push(
			"manifest.webmanifest : « display » doit ouvrir une vraie app",
		);
	}
	if (/^(\/|[a-z]+:)/i.test(manifest.start_url ?? "")) {
		problems.push(
			`manifest.webmanifest : start_url non relatif (${manifest.start_url})`,
		);
	}
	const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
	for (const size of ["192x192", "512x512"]) {
		if (!icons.some((icon) => icon.sizes === size)) {
			problems.push(`manifest.webmanifest : icône ${size} manquante`);
		}
	}
	for (const icon of icons) {
		if (/^(\/|[a-z]+:)/i.test(icon.src ?? "")) {
			problems.push(
				`manifest.webmanifest : chemin d'icône non relatif (${icon.src})`,
			);
		} else if (!existsSync(join(dir, icon.src ?? ""))) {
			problems.push(`manifest.webmanifest : icône introuvable (${icon.src})`);
		}
	}
	return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	try {
		const dir = process.argv[2] ?? "dist";
		const offenders = checkDist(dir);
		if (offenders.length > 0) {
			console.error(
				`Chemins absolus dans dist/index.html : ${offenders.join(", ")}`,
			);
			process.exit(1);
		}
		console.log("dist/index.html : tous les chemins sont relatifs.");
		const problems = checkInstallable(dir);
		if (problems.length > 0) {
			console.error(
				`Application non installable :\n- ${problems.join("\n- ")}`,
			);
			process.exit(1);
		}
		console.log("manifest.webmanifest : l'application est installable.");
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}
