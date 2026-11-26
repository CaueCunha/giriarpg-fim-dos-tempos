/**
 * Pastas da aba de Compêndios: "T20 Giria - Fim dos Tempos (Campanha)" › ato › aventura.
 *
 * O module.json declara as pastas em packFolders, mas o Foundry só as cria em alguns casos (na primeira vez que o
 * módulo é ativado no mundo, e não no The Forge nem em mundos onde o módulo já estava). Por isso, ao abrir o mundo,
 * o Mestre cria as pastas que faltam e põe nelas os compêndios do módulo que ainda não foram organizados.
 *
 * Cada compêndio é organizado uma vez por mundo (setting "compendiosOrganizados"): se você tirar um compêndio da
 * pasta ou mudar a pasta de lugar, ele fica onde você deixou. Compêndios novos de versões futuras entram na pasta.
 * A API organizarCompendios({ todos: true }) devolve todos para as pastas do módulo.
 *
 * organizarOutrosModulos() (macro "FdT · Pastas dos compêndios dos módulos") faz o mesmo com os compêndios SOLTOS
 * dos outros módulos ativos: uma pasta com o nome de cada módulo (ou as pastas que o próprio módulo declara).
 * Compêndio que já está em alguma pasta não é mexido.
 */
import { MODULO } from "./assinatura.mjs";
import { modulo } from "./constantes.mjs";

const lista = (x) => (x ? Array.from(x) : []);

/** Pastas de compêndio do mundo, achadas pela marca do módulo ou pelo nome dentro da mesma pasta-mãe. */
function acharPasta(caminho, nome, mae, chave = "pastaCompendio") {
	const pastas = game.folders.filter((f) => f.type === "Compendium");
	return (
		pastas.find((f) => f.getFlag?.(MODULO, chave) === caminho) ??
		pastas.find((f) => f.name === nome && (f._source?.folder ?? f.folder?.id ?? null) === (mae ?? null))
	);
}

/** Nomes antigos da pasta raiz (o módulo se chamava "Giria T20 - Fim dos Tempos (Campanha)" até a v0.30). */
const RAIZES_ANTIGAS = ["Giria T20 - Fim dos Tempos (Campanha)"];

/** Renomeia a pasta raiz antiga (criada pelo módulo ou pelo Foundry) para o nome atual, sem mexer no conteúdo. */
async function renomearRaiz(mod) {
	const atual = lista(mod?.packFolders)[0]?.name;
	if (!atual) return;
	const pastas = game.folders.filter((f) => f.type === "Compendium");
	for (const antigo of RAIZES_ANTIGAS) {
		if (antigo === atual) continue;
		const raiz = pastas.find((f) => !f.folder && f.name === antigo && (!f.getFlag?.(MODULO, "pastaCompendio") || f.getFlag(MODULO, "pastaCompendio") === antigo));
		if (!raiz || pastas.some((f) => !f.folder && f.name === atual)) continue;
		await raiz.update({ name: atual, [`flags.${MODULO}.pastaCompendio`]: atual });
		// as filhas guardam o caminho a partir da raiz
		const trocar = async (mae) => {
			for (const f of game.folders.filter((x) => x.type === "Compendium" && x.folder?.id === mae.id)) {
				const c = f.getFlag?.(MODULO, "pastaCompendio");
				if (c?.startsWith(`${antigo}/`)) await f.update({ [`flags.${MODULO}.pastaCompendio`]: atual + c.slice(antigo.length) });
				await trocar(f);
			}
		};
		await trocar(raiz);
	}
}

export async function organizarCompendios({ todos = false } = {}) {
	await renomearRaiz(modulo());
	return organizar(modulo(), { todos, registrar: true });
}

/** Compêndios dos módulos ativos (menos este) que não estão em pasta nenhuma. */
export async function organizarOutrosModulos() {
	const total = { pastas: 0, compendios: 0, modulos: [] };
	const mods = [...game.modules].filter((m) => m.active && m.id !== MODULO).sort((a, b) => String(a.title).localeCompare(String(b.title)));
	for (const mod of mods) {
		const r = await organizar(mod, { registrar: false });
		total.pastas += r.pastas;
		total.compendios += r.compendios;
		if (r.compendios) total.modulos.push({ titulo: mod.title ?? mod.id, compendios: r.compendios });
	}
	return total;
}

async function organizar(mod, { todos = false, registrar = false } = {}) {
	if (!mod) return { pastas: 0, compendios: 0 };
	const packsDoModulo = game.packs.filter((p) => p.metadata?.packageName === mod.id && p.metadata?.packageType !== "world");
	let raizes = lista(mod.packFolders);
	// Outros módulos: os compêndios que as pastas dele não cobrem vão para uma pasta com o nome do módulo.
	if (!registrar) {
		const cobertos = new Set();
		const juntar = (no) => {
			lista(no.packs).forEach((n) => cobertos.add(n));
			lista(no.folders).forEach(juntar);
		};
		raizes.forEach(juntar);
		const titulo = (p) => String(p.title ?? p.metadata.label ?? p.metadata.name);
		const resto = packsDoModulo.filter((p) => !cobertos.has(p.metadata.name)).sort((a, b) => titulo(a).localeCompare(titulo(b)));
		if (resto.length) {
			const nome = mod.title ?? mod.id;
			const mesma = raizes.find((r) => r.name === nome);
			if (mesma) raizes = raizes.map((r) => (r === mesma ? { ...r, packs: [...lista(r.packs), ...resto.map((p) => p.metadata.name)] } : r));
			else raizes = [...raizes, { name: nome, sorting: "a", packs: resto.map((p) => p.metadata.name) }];
		}
	}
	if (!raizes.length) return { pastas: 0, compendios: 0 };
	const chave = registrar ? "pastaCompendio" : "pastaModulo";
	const feitos = new Set(todos || !registrar ? [] : (game.settings.get(MODULO, "compendiosOrganizados") ?? []));
	const config = foundry.utils.deepClone(game.settings.get("core", "compendiumConfiguration") ?? {});
	const destino = new Map(); // nome do compêndio → { pasta (caminho), sort }
	let criadas = 0;

	// Primeiro decide quais compêndios precisam de pasta, para não criar pastas à toa.
	const precisa = (nome) => {
		const id = `${mod.id}.${nome}`;
		if (!game.packs.get(id) || feitos.has(nome)) return false;
		const atual = config[id]?.folder;
		// já está numa pasta que existe (criada pelo Foundry a partir do packFolders): só registra
		return todos || !(atual && game.folders.get(atual));
	};
	const temTrabalho = (no) => lista(no.packs).some(precisa) || lista(no.folders).some(temTrabalho);

	const percorrer = async (no, caminho, mae, sort) => {
		if (!temTrabalho(no)) return;
		let pasta = acharPasta(registrar ? caminho : `${mod.id}/${caminho}`, no.name, mae, chave);
		if (!pasta) {
			pasta = await Folder.create({
				name: no.name,
				type: "Compendium",
				folder: mae ?? null,
				sorting: no.sorting ?? "m",
				color: no.color ?? null,
				sort,
				flags: { [MODULO]: { [chave]: registrar ? caminho : `${mod.id}/${caminho}` } }
			});
			criadas++;
		}
		lista(no.packs).forEach((nome, i) => {
			if (precisa(nome)) destino.set(nome, { pasta: pasta.id, sort: (i + 1) * 100 });
		});
		let i = 0;
		for (const filha of lista(no.folders)) await percorrer(filha, `${caminho}/${filha.name}`, pasta.id, ++i * 100);
	};
	// Pastas de outros módulos vão para o fim da lista, depois das pastas que já existem.
	const base = registrar ? 0 : Math.max(0, ...game.folders.filter((f) => f.type === "Compendium" && !f.folder).map((f) => f.sort ?? 0));
	for (const [i, r] of raizes.entries()) await percorrer(r, r.name, null, base + (i + 1) * 100);

	for (const [nome, { pasta, sort }] of destino) {
		const id = `${mod.id}.${nome}`;
		config[id] = { ...(config[id] ?? {}), folder: pasta, sort };
	}
	if (destino.size) await game.settings.set("core", "compendiumConfiguration", config);
	if (registrar) {
		// Todos os compêndios do módulo que estão em alguma pasta contam como organizados.
		for (const p of packsDoModulo) {
			const f = config[p.collection]?.folder;
			if (f && game.folders.get(f)) feitos.add(p.metadata.name);
		}
		await game.settings.set(MODULO, "compendiosOrganizados", [...feitos].sort());
	}
	return { pastas: criadas, compendios: destino.size };
}
