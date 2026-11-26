/**
 * Pastas da aba de Compêndios: "Giria T20 - Fim dos Tempos (Campanha)" › ato › aventura.
 *
 * O module.json declara as pastas em packFolders, mas o Foundry só as cria em alguns casos (na primeira vez que o
 * módulo é ativado no mundo, e não no The Forge nem em mundos onde o módulo já estava). Por isso, ao abrir o mundo,
 * o Mestre cria as pastas que faltam e põe nelas os compêndios do módulo que ainda não foram organizados.
 *
 * Cada compêndio é organizado uma vez por mundo (setting "compendiosOrganizados"): se você tirar um compêndio da
 * pasta ou mudar a pasta de lugar, ele fica onde você deixou. Compêndios novos de versões futuras entram na pasta.
 * A API organizarCompendios({ todos: true }) devolve todos para as pastas do módulo.
 */
import { MODULO } from "./assinatura.mjs";
import { modulo } from "./constantes.mjs";

const lista = (x) => (x ? Array.from(x) : []);

/** Pastas de compêndio do mundo, achadas pela marca do módulo ou pelo nome dentro da mesma pasta-mãe. */
function acharPasta(caminho, nome, mae) {
	const pastas = game.folders.filter((f) => f.type === "Compendium");
	return (
		pastas.find((f) => f.getFlag?.(MODULO, "pastaCompendio") === caminho) ??
		pastas.find((f) => f.name === nome && (f._source?.folder ?? f.folder?.id ?? null) === (mae ?? null))
	);
}

export async function organizarCompendios({ todos = false } = {}) {
	const mod = modulo();
	const raizes = lista(mod?.packFolders);
	if (!raizes.length) return { pastas: 0, compendios: 0 };
	const feitos = new Set(todos ? [] : (game.settings.get(MODULO, "compendiosOrganizados") ?? []));
	const config = foundry.utils.deepClone(game.settings.get("core", "compendiumConfiguration") ?? {});
	const destino = new Map(); // nome do compêndio → { pasta (caminho), sort }
	let criadas = 0;

	// Primeiro decide quais compêndios precisam de pasta, para não criar pastas à toa.
	const precisa = (nome) => {
		const id = `${MODULO}.${nome}`;
		if (!game.packs.get(id) || feitos.has(nome)) return false;
		const atual = config[id]?.folder;
		// já está numa pasta que existe (criada pelo Foundry a partir do packFolders): só registra
		return todos || !(atual && game.folders.get(atual));
	};
	const temTrabalho = (no) => lista(no.packs).some(precisa) || lista(no.folders).some(temTrabalho);

	const percorrer = async (no, caminho, mae, sort) => {
		if (!temTrabalho(no)) return;
		let pasta = acharPasta(caminho, no.name, mae);
		if (!pasta) {
			pasta = await Folder.create({
				name: no.name,
				type: "Compendium",
				folder: mae ?? null,
				sorting: no.sorting ?? "m",
				color: no.color ?? null,
				sort,
				flags: { [MODULO]: { pastaCompendio: caminho } }
			});
			criadas++;
		}
		lista(no.packs).forEach((nome, i) => {
			if (precisa(nome)) destino.set(nome, { pasta: pasta.id, sort: (i + 1) * 100 });
		});
		let i = 0;
		for (const filha of lista(no.folders)) await percorrer(filha, `${caminho}/${filha.name}`, pasta.id, ++i * 100);
	};
	for (const [i, r] of raizes.entries()) await percorrer(r, r.name, null, (i + 1) * 100);

	for (const [nome, { pasta, sort }] of destino) {
		const id = `${MODULO}.${nome}`;
		config[id] = { ...(config[id] ?? {}), folder: pasta, sort };
	}
	// Todos os compêndios do módulo que estão em alguma pasta contam como organizados.
	for (const p of game.packs.filter((p) => p.metadata?.packageName === MODULO)) {
		const f = config[p.collection]?.folder;
		if (f && game.folders.get(f)) feitos.add(p.metadata.name);
	}
	if (destino.size) await game.settings.set("core", "compendiumConfiguration", config);
	await game.settings.set(MODULO, "compendiosOrganizados", [...feitos].sort());
	return { pastas: criadas, compendios: destino.size };
}
