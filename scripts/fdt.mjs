/**
 * Fim dos Tempos · módulo da campanha (Foundry v14 + Tormenta20 1.6.x)
 *
 * O conteúdo fica nos compêndios do módulo (Ato 1 · Colinas Centrais, Ato 2 · Valkaria e Campanha).
 * As macros da campanha procuram atores, tabelas, diários e outras macros no MUNDO pelas marcas
 * flags.world.fdt/fdtRole, então o conteúdo precisa ser importado para o mundo. Este script:
 *   - oferece a importação quando o mundo ainda não tem o conteúdo (ou quando há versão nova);
 *   - põe o botão "Fim dos Tempos" no topo da aba de Compêndios e um item em Configurações;
 *   - expõe game.modules.get("giriarpg-fim-dos-tempos").api.
 *
 * Importar de novo apaga e recria só o que tem as mesmas marcas, com os mesmos IDs (tokens já
 * colocados em cenas continuam ligados). O contador de Lei & Ordem e a ficha do grupo sobrevivem.
 */
const MODULO = "giriarpg-fim-dos-tempos";
const TIPOS = ["Actor", "Item", "JournalEntry", "RollTable", "Macro"];

/** Valores que sobrevivem a uma reimportação. Mantenha igual a tools/conteudo.mjs. */
export const PRESERVAR = [
	{ documento: "Actor", role: "leiordem", caminhos: ["system.resources"] },
	{ documento: "JournalEntry", role: "grupo", caminhos: ["flags.world.fdtGrupo"] }
];

const modulo = () => game.modules.get(MODULO);
const colecao = (tipo) => game.collections?.get?.(tipo) ?? { Actor: game.actors, Item: game.items, JournalEntry: game.journal, RollTable: game.tables, Macro: game.macros, Folder: game.folders }[tipo];
const classe = (tipo) => CONFIG[tipo]?.documentClass ?? globalThis[tipo];
const marca = (d) => d?.flags?.world?.fdt ?? d?.getFlag?.("world", "fdt");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Atos descritos no module.json (flags do módulo). */
export function atos() {
	const m = modulo();
	const info = m?.flags?.[MODULO]?.atos ?? {};
	return Object.entries(info).map(([id, a]) => ({ id, rotulo: a.rotulo, packs: (a.packs ?? []).map((p) => game.packs.get(`${MODULO}.${p}`)).filter(Boolean) }));
}

const importados = () => {
	try {
		return game.settings.get(MODULO, "importado") ?? {};
	} catch {
		return {};
	}
};

/**
 * Importa os atos escolhidos para o mundo.
 * @param {string[]} ids              ids dos atos (ato1, ato2, campanha)
 * @param {object}   [o]
 * @param {"perguntar"|"substituir"|"faltando"} [o.modo]  o que fazer se o conteúdo já existe
 * @returns {Promise<{criados: number, apagados: number, mantidos: number}|null>}
 */
export async function importar(ids, { modo = "perguntar" } = {}) {
	if (!game.user.isGM) {
		ui.notifications.error("Só o Mestre pode importar o conteúdo do Fim dos Tempos.");
		return null;
	}
	const escolhidos = atos().filter((a) => ids.includes(a.id));
	if (!escolhidos.length) {
		ui.notifications.warn("Nenhum ato escolhido para importar.");
		return null;
	}

	// 1. Carrega os compêndios
	const lotes = [];
	for (const ato of escolhidos) {
		for (const pack of ato.packs) {
			const docs = await pack.getDocuments();
			lotes.push({ ato, pack, tipo: pack.documentName, docs, pastas: [...pack.folders.values()] });
		}
	}
	const marcas = new Set(lotes.flatMap((l) => [...l.docs, ...l.pastas].map(marca)).filter(Boolean));
	const idsNovos = new Set(lotes.flatMap((l) => [...l.docs, ...l.pastas].map((d) => d.id)));

	// 2. O que já existe no mundo (mesma marca ou mesmo id)
	const nossos = (d) => marcas.has(marca(d)) || idsNovos.has(d.id);
	const existentes = Object.fromEntries(TIPOS.map((t) => [t, colecao(t).filter(nossos)]));
	const pastasExistentes = game.folders.filter(nossos);
	const total = Object.values(existentes).reduce((n, l) => n + l.length, 0);

	if (total && modo === "perguntar") {
		const lista = TIPOS.filter((t) => existentes[t].length).map((t) => `<li>${existentes[t].length} ${game.i18n.localize(`DOCUMENT.${t}s`) === `DOCUMENT.${t}s` ? t : game.i18n.localize(`DOCUMENT.${t}s`)}</li>`).join("");
		modo = await foundry.applications.api.DialogV2.wait({
			window: { title: "Fim dos Tempos: conteúdo já importado" },
			position: { width: 460 },
			content: `<p>O mundo já tem <b>${total}</b> documentos destes atos:</p><ul>${lista}</ul>
				<p><b>Substituir</b> apaga e recria tudo com a versão do módulo (edições feitas nesses documentos se perdem).
				O contador de Lei &amp; Ordem e a ficha do grupo são mantidos, e tokens em cenas continuam ligados.</p>
				<p><b>Só o que falta</b> não mexe no que já existe.</p>`,
			buttons: [
				{ action: "substituir", label: "Substituir", icon: "fa-solid fa-rotate", default: true },
				{ action: "faltando", label: "Só o que falta", icon: "fa-solid fa-plus" },
				{ action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
			]
		});
		if (!modo || modo === "cancelar") return null;
	}
	if (modo === "perguntar") modo = "substituir";

	// 3. Guarda o que sobrevive à reimportação
	const guardado = [];
	if (modo === "substituir") {
		for (const p of PRESERVAR) {
			const doc = existentes[p.documento]?.find((d) => d.getFlag("world", "fdtRole") === p.role);
			if (!doc) continue;
			const fonte = doc.toObject();
			guardado.push({ ...p, valores: p.caminhos.map((c) => [c, foundry.utils.getProperty(fonte, c)]).filter(([, v]) => v !== undefined) });
		}
	}

	// 4. Apaga (substituir) ou descobre o que pular (faltando)
	let apagados = 0;
	let mantidos = 0;
	const pular = new Set();
	if (modo === "substituir") {
		for (const t of TIPOS) {
			const lista = existentes[t].map((d) => d.id);
			if (lista.length) await classe(t).deleteDocuments(lista);
			apagados += lista.length;
		}
		const pastas = pastasExistentes.map((f) => f.id);
		if (pastas.length) await classe("Folder").deleteDocuments(pastas);
	} else {
		for (const t of TIPOS) for (const d of existentes[t]) pular.add(d.id), pular.add(`${t}|${marca(d)}|${d.name}`);
		for (const f of pastasExistentes) pular.add(f.id);
		mantidos = total;
	}

	// 5. Pastas (pais antes dos filhos) e documentos, com os mesmos IDs do compêndio
	const todasPastas = lotes.flatMap((l) => l.pastas).filter((f) => !pular.has(f.id) && !game.folders.get(f.id));
	const profundidade = (f) => {
		let n = 0;
		let p = f.folder;
		while (p && n < 10) {
			n++;
			p = p.folder;
		}
		return n;
	};
	todasPastas.sort((a, b) => profundidade(a) - profundidade(b));
	if (todasPastas.length) await classe("Folder").createDocuments(todasPastas.map((f) => f.toObject()), { keepId: true });

	let criados = 0;
	for (const l of lotes) {
		const dados = l.docs
			.filter((d) => !pular.has(d.id) && !pular.has(`${l.tipo}|${marca(d)}|${d.name}`))
			.map((d) => {
				const o = d.toObject();
				o._stats ??= {};
				o._stats.compendiumSource ??= d.uuid;
				return o;
			});
		if (!dados.length) continue;
		const r = await classe(l.tipo).createDocuments(dados, { keepId: true });
		criados += r.length;
	}

	// 6. Devolve os valores guardados
	for (const g of guardado) {
		const doc = colecao(g.documento).find((d) => marcas.has(marca(d)) && d.getFlag("world", "fdtRole") === g.role);
		if (doc && g.valores.length) await doc.update(Object.fromEntries(g.valores));
	}

	const reg = importados();
	for (const a of escolhidos) reg[a.id] = modulo()?.version ?? "?";
	await game.settings.set(MODULO, "importado", reg);

	const nomes = escolhidos.map((a) => a.rotulo).join(", ");
	ui.notifications.info(`Fim dos Tempos: ${criados} documentos importados (${nomes}).${apagados ? ` ${apagados} substituídos.` : ""}${mantidos ? ` ${mantidos} já existiam e foram mantidos.` : ""}`);
	Hooks.callAll(`${MODULO}.importado`, { atos: escolhidos.map((a) => a.id), criados, apagados, mantidos });
	return { criados, apagados, mantidos };
}

/** Janela de escolha dos atos. */
export async function abrirImportador() {
	if (!game.user.isGM) return ui.notifications.warn("Só o Mestre pode importar o conteúdo do Fim dos Tempos.");
	const lista = atos();
	if (!lista.length) return ui.notifications.error("Fim dos Tempos: nenhum compêndio do módulo foi encontrado.");
	const reg = importados();
	const versao = modulo()?.version;
	const linhas = lista
		.map((a) => {
			const n = a.packs.reduce((t, p) => t + (p.index?.size ?? 0), 0);
			const estado = reg[a.id] ? (reg[a.id] === versao ? `importado (v${esc(reg[a.id])})` : `importado v${esc(reg[a.id])}, há v${esc(versao)}`) : "ainda não importado";
			return `<div class="form-group"><label class="checkbox"><input type="checkbox" name="${esc(a.id)}" checked> ${esc(a.rotulo)}</label>
				<p class="hint">${n} documentos · ${estado}</p></div>`;
		})
		.join("");
	const escolha = await foundry.applications.api.DialogV2.wait({
		window: { title: "Fim dos Tempos: importar para o mundo", icon: "fa-solid fa-hourglass-half" },
		position: { width: 460 },
		content: `<p>Importa ameaças, itens, diários, tabelas e macros dos compêndios do módulo para o mundo, nas mesmas pastas dos geradores.
			As macros da campanha só funcionam com o conteúdo importado.</p>${linhas}`,
		buttons: [
			{ action: "importar", label: "Importar", icon: "fa-solid fa-file-import", default: true, callback: (ev, button) => Object.entries(new foundry.applications.ux.FormDataExtended(button.form).object).filter(([, v]) => v === true).map(([k]) => k) },
			{ action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
		]
	});
	if (!Array.isArray(escolha)) return null;
	return importar(escolha);
}

/* ------------------------------------------------------------------------ */
/* Ganchos                                                                    */
/* ------------------------------------------------------------------------ */

Hooks.once("init", () => {
	game.settings.register(MODULO, "importado", { scope: "world", config: false, type: Object, default: {} });
	game.settings.register(MODULO, "oferecer", {
		name: "Oferecer a importação ao abrir o mundo",
		hint: "Quando o mundo ainda não tem o conteúdo do módulo, ou quando sai uma versão nova, o Mestre vê a janela de importação ao entrar.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	game.settings.register(MODULO, "avisado", { scope: "world", config: false, type: String, default: "" });

	const Base = foundry.applications?.api?.ApplicationV2;
	if (Base) {
		class Importador extends Base {
			render() {
				abrirImportador();
				return this;
			}
		}
		game.settings.registerMenu(MODULO, "importador", {
			name: "Importar conteúdo",
			label: "Importar para o mundo",
			hint: "Ameaças, itens, diários, tabelas e macros do Ato 1, do Ato 2 e da campanha.",
			icon: "fa-solid fa-file-import",
			type: Importador,
			restricted: true
		});
	}

	const m = modulo();
	if (m) m.api = { importar, abrirImportador, atos, PRESERVAR };
});

Hooks.once("ready", async () => {
	if (!game.user.isGM || (game.users.activeGM && game.users.activeGM !== game.user)) return;
	if (!game.settings.get(MODULO, "oferecer")) return;
	const versao = modulo()?.version;
	const reg = importados();
	const faltando = atos().filter((a) => reg[a.id] !== versao);
	if (!faltando.length || game.settings.get(MODULO, "avisado") === versao) return;
	await game.settings.set(MODULO, "avisado", versao);
	await abrirImportador();
});

Hooks.on("renderCompendiumDirectory", (app, html) => {
	if (!game.user.isGM) return;
	const raiz = html instanceof HTMLElement ? html : html?.[0];
	if (!raiz || raiz.querySelector(".fdt-importar")) return;
	const botao = document.createElement("button");
	botao.type = "button";
	botao.className = "fdt-importar";
	botao.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Fim dos Tempos: importar';
	botao.addEventListener("click", () => abrirImportador());
	const alvo = raiz.querySelector(".header-actions") ?? raiz.querySelector(".directory-header") ?? raiz;
	alvo.append(botao);
});
