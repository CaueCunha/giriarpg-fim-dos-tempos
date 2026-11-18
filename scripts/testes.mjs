/**
 * Testes no chat (desde 0.22.0, no mesmo padrão do módulo Duelo de Dragões; o motor é o dele, adaptado).
 *
 * Regras (pedido do Cauê):
 *   1. Nenhuma macro rola teste de resistência nem aplica dano, condição ou efeito direto.
 *   2. A macro manda ao chat um card com o dano já rolado uma vez para todos, como uma magia em área. A rolagem fica
 *      só no conteúdo (classe roll--dano, para os botões de dano do sistema), não em `rolls`.
 *   3. O card tem um botão Rolar por personagem; o dono rola pela ficha. O resultado volta ao Mestre pelo socket.
 *   4. O Mestre aplica dano, metade, condição ou efeito por botões que só ele vê.
 *   5. O card usa as classes "tormenta20 item-card".
 *
 * API (game.modules.get("giriarpg-fim-dos-tempos").api.testes):
 *   await pedir({ titulo, texto, testes: [{ ator, pericia | pericias: [..], cd, bonus, rotulo }], dano, sucesso, sucessoTexto, falha, esperar })
 *     ator: Actor, token ou uuid. pericia: id da perícia ("fort") ou "atr:des" para teste de atributo.
 *     pericias: o jogador escolhe uma delas (um botão para cada). bonus: soma no total (situacional).
 *     cd: null = teste oposto ou contra CD secreta (só mostra o total; a macro compara).
 *     dano: fórmula ("4d6[fogo]"), Roll ou lista deles, rolado uma vez para todos e mostrado no card.
 *     sucesso: "metade" (passou = metade do dano) ou "evita" (passou = nada). Sem sucesso, o dano vale para todos.
 *     falha: { status: "fraco" | [..], efeito: {dados de ActiveEffect} | [..], texto } oferecidos ao Mestre em quem falhar.
 *     aoPassar: { status, efeito, texto } o mesmo para quem passar (ex.: "passou: fica abalado em vez de apavorado").
 *     esperar (padrão true): Promise com os resultados quando todos rolarem:
 *       [{ ator, nome, pericia, total, d20, cd, passou, margem, rotulo, indice }]
 *   lista([{ ator, pericia | atributo, cd, extra, titulo, motivo, dano, metade, evita, falha, sucesso, ... }]): o atalho das
 *     macros (fdtTeste/fdtTestes). Junta num card só os pedidos com o mesmo título e o mesmo dano e devolve um Roll por
 *     pedido, com o total do jogador + extra (o d20 natural em roll.options.fdt.natural).
 *   acoes(): botões do Mestre para mensagens de resumo:
 *     const A = api.testes.acoes(); A.dano(ator, roll, mult, rotulo); A.status(ator, "vulneravel"); A.tirar(ator, "caido");
 *     A.efeito(ator, dadosDoEfeito, rotulo); A.cura(ator, roll); A.pm(ator, n); A.ficha(ator, mudancas, rotulo);
 *     cada um devolve o HTML do botão (um marcador que vira botão). await A.enviar({ content, whisper, speaker })
 *   coletor(): o que as macros usam no lugar de aplicar direto (fdtAplicar): guarda o que seria aplicado e manda os
 *     botões junto com a próxima mensagem da macro (fdtEnviar) ou numa mensagem só para o Mestre no fim.
 *   rolarDano(formula, titulo): Roll avaliada, com o título que os botões de dano do sistema usam.
 *
 * Jogador sem ser Mestre: o resultado vai ao Mestre pelo socket do módulo ("socket": true no module.json).
 * Se a página do Mestre recarregar no meio, o card continua valendo (rolagens e botões de aplicar), só a parte da
 * macro que vinha depois não roda: rode a macro de novo ou anote à mão.
 */
import { MODULO } from "./assinatura.mjs";

const SOCKET = `module.${MODULO}`;
const ATRIBUTOS = { for: "Força", des: "Destreza", con: "Constituição", int: "Inteligência", sab: "Sabedoria", car: "Carisma" };
const NOMES = {
	acro: "Acrobacia", ades: "Adestramento", atle: "Atletismo", atua: "Atuação", cava: "Cavalgar", conh: "Conhecimento",
	cura: "Cura", dipl: "Diplomacia", enga: "Enganação", fort: "Fortitude", furt: "Furtividade", guer: "Guerra",
	inic: "Iniciativa", inti: "Intimidação", intu: "Intuição", inve: "Investigação", joga: "Jogatina", ladi: "Ladinagem",
	luta: "Luta", mist: "Misticismo", nobr: "Nobreza", perc: "Percepção", pilo: "Pilotagem", pont: "Pontaria",
	refl: "Reflexos", reli: "Religião", sobr: "Sobrevivência", vont: "Vontade"
};
/** Marca nas opções do Roll: já foi ao chat num card (sai dos resumos, para os dados não rolarem duas vezes). */
export const JA_NO_CHAT = "fdtNoCard";

const esperando = new Map();
let fila = Promise.resolve();

const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const BOTAO = 'style="width:auto;line-height:1.4;padding:0 6px;margin:2px 0"';

/** Mestre ativo (só um cliente anota os resultados). */
export const souMestreAtivo = () => {
	const ativo = game.users?.activeGM ?? game.users?.find?.((u) => u.isGM && u.active);
	return ativo ? ativo.isSelf ?? ativo.id === game.user?.id : !!game.user?.isGM;
};

export function nomePericia(p) {
	if (String(p).startsWith("atr:")) return ATRIBUTOS[p.slice(4)] ?? p;
	if (NOMES[p]) return NOMES[p];
	const l = CONFIG.T20?.pericias?.[p]?.label ?? CONFIG.T20?.pericias?.[p] ?? p;
	return game.i18n?.localize?.(String(l)) ?? String(l);
}
const uuidDe = (a) => (typeof a === "string" ? a : (a?.actor ?? a)?.uuid);
const atorDe = (u) => {
	try {
		return fromUuidSync(u) ?? game.actors.find((a) => a.uuid === u) ?? null;
	} catch {
		return game.actors.find((a) => a.uuid === u) ?? null;
	}
};
const d20De = (roll) => roll?.dice?.find?.((d) => d.faces === 20)?.results?.find((r) => r.active !== false)?.result ?? null;

export async function rolarDano(formula, titulo = "Dano") {
	const r = formula instanceof Roll ? formula : new Roll(String(formula), {}, { title: titulo, type: "damage" });
	if (!r._evaluated) await r.evaluate();
	r.options ??= {};
	r.options.title ??= titulo;
	return r;
}

/** Junta várias rolagens de dano numa só (ex.: uma por explosivo), para o card mostrar uma rolagem. */
async function umDano(dano) {
	if (!dano) return null;
	const lista = (Array.isArray(dano) ? dano : [dano]).filter(Boolean);
	if (!lista.length) return null;
	if (lista.length === 1) return rolarDano(lista[0]);
	// Várias rolagens (ex.: um 10d6 por explosivo): o card mostra a soma, com o total de cada uma.
	const partes = [];
	for (const d of lista) {
		const r = await rolarDano(d);
		const tipo = r.terms?.find?.((t) => t.flavor)?.flavor;
		partes.push(`${r.total}${tipo ? `[${tipo}]` : ""}`);
	}
	return rolarDano(partes.join(" + "));
}

/* ---------------- Ações do Mestre (botões de aplicar) ---------------- */

function rotuloAcao(a) {
	if (a.rotulo) return a.rotulo;
	const quem = a.nome ? `${a.nome}: ` : "";
	if (a.tipo === "dano") return a.mult === 0.5 ? `${quem}metade (${Math.floor(a.total / 2)})` : `${quem}${Math.floor(a.total * (a.mult ?? 1))} de dano`;
	if (a.tipo === "cura") return `${quem}curar ${a.total}`;
	if (a.tipo === "pm") return `${quem}${a.total >= 0 ? "tirar" : "devolver"} ${Math.abs(a.total)} PM`;
	const cond = (id) => game.i18n?.localize?.(CONFIG.statusEffects?.find?.((s) => s.id === id)?.name ?? id) ?? id;
	if (a.tipo === "status") return `${quem}${cond(a.id)}`;
	if (a.tipo === "tirar") return `${quem}tirar ${cond(a.id)}`;
	if (a.tipo === "tirarEfeito") return `${quem}tirar ${a.efeitoNome ?? "efeito"}`;
	if (a.tipo === "ficha") return `${quem}atualizar ficha`;
	return `${quem}${a.dados?.name ?? "efeito"}`;
}
const botaoAcao = (a, i) =>
	a.feito
		? `<span class="fdt-feito">✔ ${esc(rotuloAcao(a))}</span>`
		: `<button type="button" class="fdt-acao fdt-mestre" data-acao="${i}" ${BOTAO}>${esc(rotuloAcao(a))}</button>`;

function novaAcao(tipo, ator, extra) {
	const a = { tipo, ator: uuidDe(ator), nome: (ator?.actor ?? ator)?.name ?? "", feito: false, ...extra };
	if (extra.roll) {
		const roll = extra.roll;
		a.roll = typeof roll.toJSON === "function" ? roll.toJSON() : roll;
		a.total = Number(roll.total) || 0;
	}
	return a;
}

export function acoes() {
	const lista = [];
	const add = (a) => {
		lista.push(a);
		return `{{acao:${lista.length - 1}}}`;
	};
	return {
		lista,
		dano: (ator, roll, mult = 1, rotulo) => add(novaAcao("dano", ator, { roll, mult, rotulo })),
		cura: (ator, roll, rotulo) => add(novaAcao("cura", ator, { roll, mult: 1, rotulo })),
		status: (ator, id, rotulo) => add(novaAcao("status", ator, { id, rotulo })),
		tirar: (ator, id, rotulo) => add(novaAcao("tirar", ator, { id, rotulo })),
		efeito: (ator, dados, rotulo) => add(novaAcao("efeito", ator, { dados, rotulo })),
		tirarEfeito: (ator, ids, rotulo) => add(novaAcao("tirarEfeito", ator, { ids: [].concat(ids), efeitoNome: rotulo, rotulo: rotulo ? `${(ator?.actor ?? ator)?.name ?? ""}: tirar ${rotulo}` : undefined })),
		pm: (ator, n, rotulo) => add(novaAcao("pm", ator, { total: Number(n) || 0, rotulo })),
		ligar: (ator, efeito, ligado = true, rotulo) => add(novaAcao("ligar", ator, { efeito: efeito?.id ?? efeito, ligado, rotulo: rotulo ?? `${(ator?.actor ?? ator)?.name ?? ""}: ${ligado ? "ligar" : "desligar"} ${efeito?.name ?? "efeito"}` })),
		ficha: (ator, mudancas, rotulo) => add(novaAcao("ficha", ator, { mudancas, rotulo })),
		async enviar(dadosMsg = {}) {
			const modelo = dadosMsg.content ?? "";
			return ChatMessage.create({
				...dadosMsg,
				content: comAcoes(modelo, lista),
				flags: foundry.utils.mergeObject(dadosMsg.flags ?? {}, { [MODULO]: { acoes: lista, modelo } })
			});
		}
	};
}
const comAcoes = (modelo, lista) => modelo.replace(/\{\{acao:(\d+)\}\}/g, (_, i) => (lista[i] ? botaoAcao(lista[i], i) : ""));

/**
 * Mudanças na ficha calculadas na hora do clique: um valor { somar: n, min, max } soma n ao valor atual (max pode ser
 * um caminho, ex. "system.attributes.pv.max"); { maior: n } fica com o maior entre o atual e n (PV/PM temporários).
 */
function mudancasAgora(ator, mudancas) {
	const out = {};
	const num = (v) => (typeof v === "string" ? Number(foundry.utils.getProperty(ator, v)) : Number(v));
	for (const [k, v] of Object.entries(mudancas)) {
		if (v && typeof v === "object" && ("somar" in v || "maior" in v)) {
			const atual = Number(foundry.utils.getProperty(ator, k)) || 0;
			let n = "maior" in v ? Math.max(atual, Number(v.maior) || 0) : atual + (Number(v.somar) || 0);
			if (v.min != null && Number.isFinite(num(v.min))) n = Math.max(num(v.min), n);
			if (v.max != null && Number.isFinite(num(v.max))) n = Math.min(num(v.max), n);
			out[k] = n;
		} else out[k] = v;
	}
	return out;
}

/** Aplica uma ação (só o Mestre). */
async function aplicar(a) {
	const ator = atorDe(a.ator);
	if (!ator) {
		ui.notifications?.warn?.(`Não achei ${a.nome} no mundo.`);
		return false;
	}
	if (a.tipo === "dano" || a.tipo === "cura") await ator.applyDamageV2(Roll.fromData(a.roll), a.tipo === "cura" ? -1 : a.mult);
	else if (a.tipo === "status") await ator.toggleStatusEffect(a.id, { active: true, ...(a.opcoes ?? {}) });
	else if (a.tipo === "tirar") await ator.toggleStatusEffect(a.id, { active: false });
	else if (a.tipo === "efeito") await ator.createEmbeddedDocuments("ActiveEffect", [a.dados]);
	else if (a.tipo === "tirarEfeito") {
		const ids = (a.ids ?? []).filter((id) => ator.effects.get(id));
		if (ids.length) await ator.deleteEmbeddedDocuments("ActiveEffect", ids);
	} else if (a.tipo === "ligar") {
		const ef = ator.effects.get(a.efeito);
		if (ef) await ef.update({ disabled: !a.ligado });
	} else if (a.tipo === "pm") {
		const pm = ator.system.attributes.pm ?? {};
		await ator.update({ "system.attributes.pm.value": Math.max(0, Math.min(Number(pm.max) || Infinity, (Number(pm.value) || 0) - a.total)) });
	} else if (a.tipo === "ficha") await ator.update(mudancasAgora(ator, a.mudancas ?? {}));
	return true;
}

async function executarAcao(msg, i) {
	if (!game.user.isGM) return ui.notifications?.warn?.("Só o Mestre aplica o resultado.");
	const f = msg.flags?.[MODULO] ?? {};
	const lista = foundry.utils.deepClone(f.acoes ?? []);
	const a = lista[i];
	if (!a || a.feito) return;
	if (!(await aplicar(a))) return;
	a.feito = true;
	const pedido = f.pedido;
	const content = pedido ? await renderPedido(pedido, lista) : comAcoes(f.modelo ?? "", lista);
	await msg.update({ content, [`flags.${MODULO}.acoes`]: lista });
}

/* ---------------- Coletor das macros (fdtAplicar) ---------------- */

/**
 * As macros não aplicam nada: chamam fdtAplicar.dano/status/efeito/... (antes eram applyDamageV2, toggleStatusEffect,
 * createEmbeddedDocuments("ActiveEffect") e update de PV/PM). Os botões vão na próxima mensagem da macro (fdtEnviar),
 * num bloco que só o Mestre vê, ou numa mensagem para o Mestre no fim da macro.
 */
export function coletor() {
	let A = acoes();
	const marcas = [];
	const anotar = (m) => {
		marcas.push(m);
		return m;
	};
	const bloco = () => {
		if (!marcas.length) return "";
		const porAtor = new Map();
		for (const m of marcas) {
			const i = Number(m.match(/\d+/)[0]);
			const a = A.lista[i];
			const k = a?.nome ?? "";
			if (!porAtor.has(k)) porAtor.set(k, []);
			porAtor.get(k).push(m);
		}
		const linhas = [...porAtor.values()].map((ms) => `<li>${ms.join(" ")}</li>`).join("");
		return `<div class="fdt-acoes fdt-mestre"><p><b>Mestre, aplique:</b></p><ul style="list-style:none;padding-left:0">${linhas}</ul></div>`;
	};
	const c = {
		dano: async (ator, roll, mult = 1, rotulo) => {
			if (ator && roll) anotar(A.dano(ator, await rolarDano(roll), mult, rotulo));
		},
		cura: async (ator, roll, rotulo) => {
			if (ator && roll) anotar(A.cura(ator, await rolarDano(roll, "Cura"), rotulo));
		},
		/** toggleStatusEffect(id, { active }) → botão de pôr ou tirar a condição. */
		status: async (ator, id, opcoes = {}) => {
			if (!ator || !id) return;
			if (opcoes?.active === false) anotar(A.tirar(ator, id));
			else anotar(A.status(ator, id));
		},
		tirar: async (ator, id, rotulo) => {
			if (ator && id) anotar(A.tirar(ator, id, rotulo));
		},
		/** createEmbeddedDocuments("ActiveEffect", lista) → um botão por efeito. */
		efeito: async (ator, lista, rotulo) => {
			if (!ator) return;
			for (const d of [].concat(lista ?? [])) if (d) anotar(A.efeito(ator, d, rotulo));
		},
		/** deleteEmbeddedDocuments("ActiveEffect", ids) → botão de tirar. */
		tirarEfeito: async (ator, ids, rotulo) => {
			const lista = [].concat(ids ?? []).filter(Boolean);
			if (!ator || !lista.length) return;
			const nome = rotulo ?? lista.map((id) => ator.effects?.get?.(id)?.name).filter(Boolean).join(", ") ?? "efeito";
			anotar(A.tirarEfeito(ator, lista, nome || "efeito"));
		},
		/** Liga ou desliga um efeito que o ator já tem (ef.update({ disabled })). */
		ligar: async (ator, efeito, ligado = true, rotulo) => {
			if (ator && efeito) anotar(A.ligar(ator, efeito, ligado, rotulo));
		},
		/** Tira n PM (n negativo devolve, até o máximo). */
		pm: async (ator, n, rotulo) => {
			if (ator && Number(n)) anotar(A.pm(ator, n, rotulo));
		},
		/** Perda de n PV (ignora RD). */
		perda: async (ator, n, rotulo) => {
			if (ator && Number(n) > 0) anotar(A.dano(ator, await rolarDano(`${Math.floor(Number(n))}[perda]`, "Perda de vida"), 1, rotulo ?? `${ator.name}: perde ${Math.floor(Number(n))} PV`));
		},
		/** Cura n PV. */
		curar: async (ator, n, rotulo) => {
			if (ator && Number(n) > 0) anotar(A.cura(ator, await rolarDano(`${Math.floor(Number(n))}[curapv]`, "Cura"), rotulo));
		},
		/** update na ficha (PV, PM, recursos) → botão "atualizar ficha" com o rótulo. */
		ficha: async (ator, mudancas, rotulo) => {
			if (ator && mudancas && Object.keys(mudancas).length) anotar(A.ficha(ator, mudancas, rotulo));
		},
		pendentes: () => marcas.length,
		/** ChatMessage.create com os botões guardados até aqui. */
		enviar: async (dados = {}) => {
			if (!marcas.length) return ChatMessage.create(dados);
			const content = `${dados.content ?? ""}${bloco()}`;
			const msg = await A.enviar({ ...dados, content });
			A = acoes();
			marcas.length = 0;
			return msg;
		},
		/** Fim da macro: o que sobrou vai numa mensagem só para o Mestre. */
		fim: async (titulo = "") => {
			if (!marcas.length) return null;
			return c.enviar({ content: titulo ? `<h3>${esc(titulo)}</h3>` : "", whisper: ChatMessage.getWhisperRecipients("GM").map((u) => u.id ?? u) });
		}
	};
	return c;
}

/* ---------------- Pedido de teste ---------------- */

function textoDano(p, ln) {
	if (!p.dano || !ln.feito) return "";
	const total = p.dano.total;
	if (ln.passou && p.sucesso === "evita") return " · evita o dano";
	if (ln.passou && p.sucesso === "metade") return ` · sofre metade (${Math.floor(total / 2)})`;
	return ` · sofre ${total}`;
}

async function renderPedido(p, acoesLista = []) {
	const linhas = p.linhas.map((ln, l) => {
		const alvo = `<b>${esc(ln.nome)}</b>${ln.rotulo ? ` (${esc(ln.rotulo)})` : ""}`;
		const bon = ln.bonus ? ` ${ln.bonus > 0 ? "+" : ""}${ln.bonus}` : "";
		if (!ln.feito) {
			const botoes = ln.pericias
				.map((pe) => `<button type="button" class="fdt-rolar" data-linha="${l}" data-pericia="${pe}" ${BOTAO}><i class="fas fa-dice-d20"></i> Rolar ${esc(nomePericia(pe))}${bon}</button>`)
				.join(" ");
			return `<li style="margin:4px 0">${alvo}: ${ln.cd == null ? (ln.secreta ? "CD secreta" : "teste oposto") : `CD ${ln.cd}`} ${botoes}</li>`;
		}
		const res = ln.cd == null ? "" : ln.passou ? ` <span style="color:#1b6b1b">✔ passou</span>` : ` <span style="color:#9b1c1c">✘ falhou</span>`;
		const minhas = acoesLista
			.map((a, i) => [a, i])
			.filter(([a]) => a.linha === l)
			.map(([a, i]) => botaoAcao(a, i))
			.join(" ");
		const refazer = p.fechado ? "" : ` <a class="fdt-refazer fdt-mestre" data-linha="${l}" title="Mestre: deixar rolar de novo">↻</a>`;
		const consequencia = ln.cd == null ? "" : ln.passou ? p.sucessoTexto || p.aoPassar?.texto : p.falha?.texto;
		return (
			`<li style="margin:4px 0">${alvo}: ${esc(nomePericia(ln.pericia))} <b>${ln.total}</b>${bon ? ` (com${bon})` : ""}${ln.cd == null ? "" : ` contra CD ${ln.cd}`}${res}${ln.cd == null ? "" : textoDano(p, ln)}` +
			`${consequencia ? ` · ${consequencia}` : ""}${refazer}${minhas ? `<br>${minhas}` : ""}</li>`
		);
	});
	const regra = p.dano ? `<p><b>Dano:</b> ${esc(p.dano.formula)}${p.sucesso === "metade" ? " (passar reduz à metade)" : p.sucesso === "evita" ? " (passar evita)" : ""}</p>` : "";
	const cab = `<header class="card-header flexrow"><img src="${esc(p.img || "icons/svg/d20-grey.svg")}" width="36" height="36"><h3 class="item-name">${esc(p.titulo || "Teste")}</h3></header>`;
	const regras = [p.falha?.texto && `Se falhar: ${p.falha.texto}`, (p.sucessoTexto || p.aoPassar?.texto) && `Se passar: ${p.sucessoTexto || p.aoPassar.texto}`].filter(Boolean);
	return (
		`<div class="fdt-pedido tormenta20 item-card" data-fdt-pedido="1">${cab}<div class="card-content">${p.texto ? `<p>${p.texto}</p>` : ""}${regra}` +
		(p.danoHtml ? `<div class="roll roll--dano" data-roll-title="${esc(p.dano.titulo)}">${p.danoHtml}</div>` : "") +
		(regras.length && !p.fechado ? `<p class="fdt-ref">${regras.join(" ")}</p>` : "") +
		`</div><ul style="list-style:none;padding-left:0">${linhas.join("")}</ul>` +
		(p.fechado ? "" : `<p class="fdt-ref" style="font-size:0.85em;opacity:0.8">Cada jogador clica no botão do seu personagem e rola pela ficha. O Mestre aplica o resultado com os botões que aparecem.</p>`) +
		`</div>`
	);
}

const listaDe = (x) => [].concat(x ?? []).filter(Boolean);

export async function pedir({ titulo = "", texto = "", img, testes = [], dano = null, sucesso = null, sucessoTexto = "", falha = null, aoPassar = null, esperar = true, whisper, speaker } = {}) {
	const linhas = testes
		.filter((t) => t?.ator)
		.map((t) => {
			const ator = t.ator?.actor ?? t.ator;
			const u = uuidDe(t.ator);
			return {
				ator: u,
				nome: t.nome ?? (typeof ator === "string" ? atorDe(u)?.name : ator.name) ?? "?",
				pericias: [...new Set([].concat(t.pericias ?? t.pericia ?? "fort"))],
				cd: t.cd == null || t.cd === "" ? null : Number(t.cd) || 0,
				secreta: !!t.secreta,
				bonus: Number(t.bonus) || 0,
				rotulo: t.rotulo ?? "",
				feito: false
			};
		});
	if (!linhas.length) return esperar ? [] : null;
	const primeiro = testes.find((t) => t?.ator);
	const p = { titulo, texto, img: img ?? (primeiro?.ator?.actor ?? primeiro?.ator)?.img, linhas, sucesso, sucessoTexto, falha, aoPassar, fechado: false };
	const roll = await umDano(dano);
	if (roll) {
		p.dano = { formula: roll.formula, total: roll.total, titulo: roll.options?.title ?? "Dano", roll: roll.toJSON() };
		p.danoHtml = await roll.render();
		roll.options[JA_NO_CHAT] = true;
		await game.dice3d?.showForRoll?.(roll, game.user, true, whisper?.length ? whisper : null);
	}
	const msg = await ChatMessage.create({
		speaker: speaker ?? { alias: titulo || "Teste" },
		content: await renderPedido(p),
		// A rolagem vai só no conteúdo (com a classe roll--dano, para os botões de aplicar do sistema).
		// Pôr também em "rolls" fazia o Foundry desenhá-la de novo embaixo do card.
		sound: roll ? CONFIG.sounds?.dice : undefined,
		whisper,
		flags: { [MODULO]: { pedido: p, acoes: [] } }
	});
	Hooks.callAll(`${MODULO}.testePedido`, { msg, pedido: p });
	if (!esperar) return msg;
	return new Promise((resolve) => esperando.set(msg.id, resolve));
}

function resultados(p) {
	return p.linhas.map((ln, indice) => ({
		ator: atorDe(ln.ator),
		uuid: ln.ator,
		nome: ln.nome,
		pericia: ln.pericia,
		total: ln.total,
		d20: ln.d20,
		cd: ln.cd,
		passou: ln.passou,
		margem: ln.cd == null ? null : ln.total - ln.cd,
		rotulo: ln.rotulo,
		indice
	}));
}

/** Mestre: anota um resultado no card (um de cada vez, na ordem em que chegam). */
export function registrar(dados) {
	fila = fila.then(() => anotar(dados)).catch((e) => console.error(`${MODULO} | teste`, e));
	return fila;
}
async function anotar({ msgId, linha, pericia, total, d20, refazer = false }) {
	const msg = game.messages.get(msgId);
	const f = msg?.flags?.[MODULO];
	if (!f?.pedido) return;
	const p = foundry.utils.deepClone(f.pedido);
	let lista = foundry.utils.deepClone(f.acoes ?? []);
	const ln = p.linhas[linha];
	if (!ln || p.fechado) return;
	if (refazer) {
		Object.assign(ln, { feito: false, total: null, d20: null, passou: null, pericia: null });
		lista = lista.filter((a) => a.linha !== linha);
	} else {
		if (ln.feito) return;
		Object.assign(ln, { feito: true, pericia, d20, total: Number(total) + ln.bonus });
		ln.passou = ln.cd == null ? null : ln.total >= ln.cd;
		// Botões padrão do Mestre para esta linha (teste oposto não tem resultado padrão).
		if (p.dano && ln.cd != null) {
			const mult = ln.passou ? (p.sucesso === "metade" ? 0.5 : p.sucesso === "evita" ? 0 : 1) : 1;
			if (mult) lista.push({ tipo: "dano", ator: ln.ator, nome: ln.nome, roll: p.dano.roll, total: p.dano.total, mult, linha, feito: false });
		}
		const conseq = ln.passou === false ? p.falha : ln.passou === true ? p.aoPassar : null;
		for (const id of listaDe(conseq?.status)) lista.push({ tipo: "status", ator: ln.ator, nome: ln.nome, id, linha, feito: false });
		for (const dados of listaDe(conseq?.efeito)) lista.push({ tipo: "efeito", ator: ln.ator, nome: ln.nome, dados, linha, feito: false });
	}
	p.fechado = p.linhas.every((x) => x.feito);
	await msg.update({ content: await renderPedido(p, lista), [`flags.${MODULO}.pedido`]: p, [`flags.${MODULO}.acoes`]: lista });
	verificarFim(msg.id, p);
}
function verificarFim(id, p) {
	const fim = esperando.get(id);
	if (fim && p.linhas.every((x) => x.feito)) {
		esperando.delete(id);
		fim(resultados(p));
	}
}

async function clicarRolar(msg, linha, pericia, event) {
	const ln = msg.flags?.[MODULO]?.pedido?.linhas?.[linha];
	if (!ln || ln.feito) return null;
	const ator = atorDe(ln.ator);
	if (!ator) return ui.notifications?.warn?.(`Não achei ${ln.nome} no mundo.`);
	if (!ator.isOwner) return ui.notifications?.warn?.(`Esse teste é de ${ln.nome}: quem controla o personagem clica.`);
	const res = pericia.startsWith("atr:") ? await ator.rollAtributo(pericia.slice(4), { event }) : await ator.rollPericia(pericia, { event });
	const roll = res?.rolls?.[0] ?? (typeof res?.total === "number" ? res : null);
	if (!roll) return null; // fechou a janela de configuração
	const total = Number(roll.total ?? res?.flags?.tormenta20?.rollTotal) || 0;
	const dados = { msgId: msg.id, linha, pericia, total, d20: d20De(roll) };
	if (game.user.isGM) return registrar(dados);
	if (!game.users.activeGM) return ui.notifications?.warn?.("Nenhum Mestre conectado para anotar o resultado: ele confere pela rolagem no chat.");
	game.socket.emit(SOCKET, { tipo: "resultado", ...dados });
	return dados;
}

/* ---------------- Atalho das macros (fdtTeste / fdtTestes) ---------------- */

async function comoRoll(res, extraFdt = {}) {
	const r = await new Roll(String(Number(res?.total) || 0)).evaluate();
	r.options.fdt = { natural: res?.d20 ?? null, passou: res?.passou ?? null, ...extraFdt };
	r.options[JA_NO_CHAT] = true;
	return r;
}

/**
 * Pedidos no formato das macros: [{ ator, pericia | atributo, cd, extra, titulo, motivo, dano, metade, evita, falha,
 * sucesso, falhaStatus, falhaEfeito, rotulo, secreta }]. Pedidos com o mesmo título e o mesmo dano vão num card só.
 * Devolve um Roll por pedido (total do jogador + extra), na mesma ordem.
 */
export async function lista(pedidos = []) {
	const grupos = [];
	for (const [i, o] of pedidos.entries()) {
		if (!o?.ator) continue;
		const chave = `${o.titulo ?? ""}`;
		let g = grupos.find((x) => x.chave === chave && x.dano === (o.dano ?? null) && x.metade === !!o.metade && x.evita === !!o.evita);
		if (!g) {
			g = { chave, dano: o.dano ?? null, metade: !!o.metade, evita: !!o.evita, itens: [] };
			grupos.push(g);
		}
		g.itens.push({ i, o });
	}
	const out = new Array(pedidos.length).fill(null);
	await Promise.all(
		grupos.map(async (g) => {
			const o = g.itens[0].o;
			const motivos = [...new Set(g.itens.map((x) => x.o.motivo).filter(Boolean))];
			const falhaTexto = typeof o.falha === "string" ? o.falha : o.falha?.texto;
			const res = await pedir({
				titulo: o.titulo ?? (o.pericia && ["fort", "refl", "vont"].includes(o.pericia) ? `Teste de resistência: ${nomePericia(o.pericia)}` : `Teste de ${nomePericia(o.pericia ?? `atr:${o.atributo ?? "for"}`)}`),
				texto: motivos.join(" "),
				testes: g.itens.map(({ o: x }) => ({
					ator: x.ator,
					pericia: x.pericia ?? `atr:${x.atributo ?? "for"}`,
					pericias: x.pericias,
					cd: x.secreta ? null : x.cd,
					secreta: !!x.secreta,
					bonus: x.extra,
					rotulo: x.rotulo
				})),
				dano: g.dano,
				sucesso: g.metade ? "metade" : g.evita ? "evita" : null,
				sucessoTexto: typeof o.sucesso === "string" ? o.sucesso : "",
				falha: falhaTexto || o.falhaStatus || o.falhaEfeito ? { texto: falhaTexto ?? "", status: o.falhaStatus, efeito: o.falhaEfeito } : null,
				aoPassar: o.aoPassar ?? null,
				whisper: o.whisper
			});
			for (const [k, { i }] of g.itens.entries()) out[i] = await comoRoll(res[k]);
		})
	);
	return out;
}

/** Um pedido só (nome antigo das macros da 0.21). */
export async function pedirTeste(o = {}) {
	return (await lista([o]))[0];
}
export const pedirTestes = (l = []) => lista(l);

/* ---------------- Resumo de macro sem rolagens repetidas ---------------- */

function opcoesDe(r) {
	if (!r) return null;
	if (typeof r === "string") {
		try {
			return JSON.parse(r)?.options ?? null;
		} catch {
			return null;
		}
	}
	return r.options ?? null;
}

/** Mensagem com uma rolagem que já foi ao chat num card (ou que é só o total de um teste do jogador): ela sai. */
function tirarRepetidas(message) {
	const fonte = message?._source?.rolls ?? message?.rolls;
	if (!Array.isArray(fonte) || !fonte.some((r) => opcoesDe(r)?.[JA_NO_CHAT])) return;
	message.updateSource({ rolls: fonte.filter((r) => !opcoesDe(r)?.[JA_NO_CHAT]) });
}

/* ---------------- Ligação com o Foundry ---------------- */

function ligarBotoes(msg, html) {
	const raiz = html instanceof HTMLElement ? html : html?.[0];
	if (!raiz || !msg.flags?.[MODULO]) return;
	if (!game.user.isGM) raiz.querySelectorAll(".fdt-mestre").forEach((b) => b.remove());
	raiz.querySelectorAll(".fdt-rolar").forEach((b) =>
		b.addEventListener("click", async (ev) => {
			ev.preventDefault();
			ev.stopPropagation();
			b.disabled = true;
			try {
				const r = await clicarRolar(msg, Number(b.dataset.linha), b.dataset.pericia, ev);
				if (!r) b.disabled = false;
			} catch (e) {
				b.disabled = false;
				console.error(e);
			}
		})
	);
	raiz.querySelectorAll(".fdt-acao").forEach((b) =>
		b.addEventListener("click", (ev) => {
			ev.preventDefault();
			ev.stopPropagation();
			b.disabled = true;
			executarAcao(msg, Number(b.dataset.acao));
		})
	);
	raiz.querySelectorAll(".fdt-refazer").forEach((b) =>
		b.addEventListener("click", (ev) => {
			ev.preventDefault();
			ev.stopPropagation();
			registrar({ msgId: msg.id, linha: Number(b.dataset.linha), refazer: true });
		})
	);
}

export function registrarTestes() {
	Hooks.on("renderChatMessageHTML", (msg, html) => ligarBotoes(msg, html));
	Hooks.on("updateChatMessage", (msg) => {
		const p = msg.flags?.[MODULO]?.pedido;
		if (p) verificarFim(msg.id, p);
	});
	Hooks.on("preCreateChatMessage", tirarRepetidas);
}

export function registrarSocket() {
	game.socket?.on?.(SOCKET, (d) => {
		if (d?.tipo === "resultado" && souMestreAtivo()) registrar(d);
	});
}

/** Usado pelos testes automáticos (Foundry simulado): o "jogador" clica no botão de uma linha, o Mestre clica numa ação. */
export const _teste = { clicarRolar, executarAcao, esperando, aplicar };

export const api = { pedir, lista, acoes, coletor, rolarDano, nomePericia, registrar, pedirTeste, pedirTestes, _teste };
