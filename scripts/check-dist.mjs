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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	try {
		const offenders = checkDist(process.argv[2] ?? "dist");
		if (offenders.length > 0) {
			console.error(
				`Chemins absolus dans dist/index.html : ${offenders.join(", ")}`,
			);
			process.exit(1);
		}
		console.log("dist/index.html : tous les chemins sont relatifs.");
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}
