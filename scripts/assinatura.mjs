/**
 * Assinatura de um documento do Fim dos Tempos: um resumo (8 dígitos hexadecimais) do conteúdo que o Mestre
 * poderia corrigir à mão. Serve para a atualização opcional saber, sem perguntar, se um documento do mundo
 * ainda é igual a alguma versão publicada do módulo (então pode ser atualizado) ou se foi editado (fica como está).
 *
 * Entra: nome, imagem, tipo, system, flags.world e flags.tormenta20, comando, fórmula, texto das páginas,
 * resultados de tabela, efeitos e itens embutidos (recursivo).
 * Fica de fora o que muda sozinho na mesa ou na importação: IDs, _stats, pasta, ordem, permissões, flags de
 * outros módulos, ligado/desligado dos efeitos, PV e PM atuais e os valores preservados (Lei & Ordem, grupo).
 * Links para documentos do módulo contam iguais no mundo e no compêndio (`Actor.X` = `Compendium.<mod>.<pack>.Actor.X`),
 * e o ID dentro deles não conta (um documento arrastado do compêndio ganha outro ID no mundo).
 *
 * Este arquivo não usa globais do Foundry: o build (Node) e o módulo usam a mesma função.
 */
export const MODULO = "giriarpg-fim-dos-tempos";

/**
 * Token padrão de toda ameaça/NPC (type "npc") do módulo. O build aplica no protótipo de cada ator, e o módulo
 * reaplica ao criar o ator ou o token no mundo (vence o padrão do mundo e o do Bar Brawl) e, ao abrir o mundo,
 * corrige o que já está lá. Nome, arte, tamanho, disposição e vínculo continuam os da ameaça.
 *   - nome ao passar o mouse para qualquer um (30), barras sempre para o dono (40), visão ligada;
 *   - barra 1 = PV, barra 2 = PM. Bar Brawl: as duas barras vão explícitas, senão ele cria a barra 2 copiando
 *     as cores da 1. PV embaixo (vermelho→verde), PM em cima (azul).
 */
export const TOKEN_PADRAO = Object.freeze({
	displayName: 30,
	displayBars: 40,
	sight: { enabled: true },
	bar1: { attribute: "attributes.pv" },
	bar2: { attribute: "attributes.pm" },
	flags: {
		barbrawl: {
			resourceBars: {
				bar1: { id: "bar1", order: 0, attribute: "attributes.pv", mincolor: "#FF0000", maxcolor: "#80FF00", position: "bottom-inner", gmVisibility: -1, ownerVisibility: 50, otherVisibility: 0 },
				bar2: { id: "bar2", order: 1, attribute: "attributes.pm", mincolor: "#000080", maxcolor: "#80B3FF", position: "top-inner", gmVisibility: -1, ownerVisibility: 50, otherVisibility: 0 }
			}
		}
	}
});

const ehObjeto = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const folhas = (o, pre = "") => Object.entries(o).flatMap(([k, v]) => (ehObjeto(v) ? folhas(v, `${pre}${k}.`) : [[`${pre}${k}`, v]]));
const pegar = (o, caminho) => caminho.split(".").reduce((x, k) => (ehObjeto(x) ? x[k] : undefined), o);
const fundir = (base, extra) => {
	const out = ehObjeto(base) ? structuredClone(base) : {};
	for (const [k, v] of Object.entries(extra)) out[k] = ehObjeto(v) ? fundir(out[k], v) : v;
	return out;
};

/** É uma ameaça/NPC do módulo? (dados crus ou documento) */
export const ehAmeacaDoModulo = (d) => {
	const src = d?._source ?? d;
	return src?.type === "npc" && !!(src.flags?.world?.fdt || src.flags?.[MODULO]);
};

/** O token (de protótipo ou de cena) com o padrão aplicado por cima, mantendo o resto. */
export const comTokenPadrao = (token) => fundir(token ?? {}, TOKEN_PADRAO);

/** Só os campos do padrão que estão diferentes no token, em chaves com ponto (vazio = já está certo). */
export function correcaoToken(token) {
	const out = {};
	for (const [k, v] of folhas(TOKEN_PADRAO)) if (pegar(token ?? {}, k) !== v) out[k] = v;
	return out;
}

/** Valores que a mesa muda e que sobrevivem a uma atualização. Mantenha igual a tools/conteudo.mjs. */
export const PRESERVAR = [
	{ documento: "Actor", role: "leiordem", caminhos: ["system.resources"] },
	{ documento: "JournalEntry", role: "grupo", caminhos: ["flags.world.fdtGrupo"] }
];

const FORA = new Set(["_id", "_key", "_stats", "folder", "sort", "ownership", "disabled", "origin"]);
const ESTADO_DA_MESA = [
	["attributes", "pv", "value"],
	["attributes", "pv", "temp"],
	["attributes", "pm", "value"],
	["attributes", "pm", "temp"]
];

const RE_LINK = new RegExp(`Compendium\\.${MODULO.replace(/-/g, "\\-")}\\.[A-Za-z0-9_-]+\\.(Actor|Item|JournalEntry|RollTable|Macro)\\.`, "g");

/** Troca os links para o compêndio do módulo pela forma do mundo (para comparar). */
export const linkDoMundo = (s) => String(s).replace(RE_LINK, "$1.");

/** Para comparar, o ID dentro dos links não conta: um documento arrastado para o mundo ganha outro ID. */
const semIds = (s) => linkDoMundo(s).replace(/(?<![.\w])(Actor|Item|JournalEntry|RollTable|Macro)\.[A-Za-z0-9]{16}/g, "$1.*");

const vazio = (v) => v === null || v === undefined || v === "" || (Array.isArray(v) && !v.length) || (typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length);

/** Cópia limpa: sem chaves de fora, sem valores vazios, links normalizados e arrays de documentos em ordem. */
function limpar(v, chave) {
	if (typeof v === "string") return semIds(v);
	if (Array.isArray(v)) {
		const lista = v.map((x) => limpar(x)).filter((x) => !vazio(x));
		// embutidos (efeitos, itens, páginas, resultados) vêm em ordem qualquer: ordena pelo conteúdo
		if (["effects", "items", "pages", "results"].includes(chave)) lista.sort((a, b) => estavel(a).localeCompare(estavel(b)));
		return lista;
	}
	if (v && typeof v === "object") {
		const out = {};
		for (const k of Object.keys(v)) {
			if (FORA.has(k)) continue;
			const x = limpar(v[k], k);
			if (!vazio(x)) out[k] = x;
		}
		return out;
	}
	return v;
}

/** JSON com as chaves em ordem: a mesma estrutura dá o mesmo texto. */
export function estavel(v) {
	if (Array.isArray(v)) return `[${v.map(estavel).join(",")}]`;
	if (v && typeof v === "object") {
		return `{${Object.keys(v)
			.sort()
			.filter((k) => v[k] !== undefined)
			.map((k) => `${JSON.stringify(k)}:${estavel(v[k])}`)
			.join(",")}}`;
	}
	return JSON.stringify(v ?? null);
}

const apagar = (o, partes) => {
	let p = o;
	for (let i = 0; p && i < partes.length - 1; i++) p = p[partes[i]];
	if (p && typeof p === "object") delete p[partes.at(-1)];
};

/** Só as partes do documento que contam. */
function projetar(doc, documento) {
	const flags = { world: structuredClone(doc.flags?.world ?? {}), tormenta20: doc.flags?.tormenta20 ?? null };
	const system = structuredClone(doc.system ?? {});
	if (documento === "Actor" || doc.items) for (const c of ESTADO_DA_MESA) apagar(system, c);
	const role = doc.flags?.world?.fdtRole;
	for (const p of PRESERVAR) {
		if (p.documento !== documento || p.role !== role) continue;
		for (const c of p.caminhos) apagar({ system, flags }, c.split("."));
	}
	const sub = (lista, tipo) => (lista ?? []).map((e) => projetar(e, tipo));
	return {
		name: doc.name,
		type: doc.type,
		img: doc.img,
		system,
		flags,
		command: doc.command,
		formula: doc.formula,
		replacement: doc.replacement,
		text: doc.text,
		src: doc.src,
		range: doc.range,
		weight: doc.weight,
		description: doc.description,
		documentUuid: doc.documentUuid,
		changes: doc.changes,
		statuses: doc.statuses,
		duration: doc.duration ? { value: doc.duration.value, units: doc.duration.units } : undefined,
		token: doc.prototypeToken ? { name: doc.prototypeToken.name, src: doc.prototypeToken.texture?.src, w: doc.prototypeToken.width, h: doc.prototypeToken.height } : undefined,
		items: sub(doc.items, "Item"),
		effects: sub(doc.effects, "ActiveEffect"),
		pages: sub(doc.pages, "JournalEntryPage"),
		results: sub(doc.results, "TableResult")
	};
}

/**
 * @param {object} doc        documento (toObject() no Foundry ou o JSON das fontes)
 * @param {string} documento  Actor, Item, JournalEntry, RollTable ou Macro
 * @returns {string} 8 dígitos hexadecimais
 */
export function assinatura(doc, documento) {
	const texto = estavel(limpar(projetar(doc, documento)));
	let h = 0x811c9dc5;
	for (let i = 0; i < texto.length; i++) {
		h ^= texto.charCodeAt(i);
		h = Math.imul(h, 0x01000193) >>> 0;
	}
	return h.toString(16).padStart(8, "0");
}
