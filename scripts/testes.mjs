/**
 * Testes pedidos pelas macros da campanha: em vez de a macro rolar o teste de um PJ, ela manda ao chat um card
 * com o teste (perícia, CD, o dano que está em jogo) e um botão. O jogador clica, rola pela ficha (com os efeitos
 * de uso dele, como em qualquer teste do Tormenta20) e a macro continua com o resultado.
 *
 *   const r = await game.modules.get("giriarpg-fim-dos-tempos").api.pedirTeste({ ator, pericia: "fort", cd: 15, dano });
 *   r.total  // total do jogador (+ extra da macro)
 *
 * Quem rola:
 *   - PJ (type "character") com um jogador dono conectado: o jogador, pelo botão do card (o Mestre também pode clicar);
 *   - NPC, PJ sem jogador conectado ou a opção "Os jogadores rolam os testes das macros" desligada: a macro, como antes.
 * O retorno é sempre um Roll avaliado com o total; em `roll.options.fdt` vão o d20 natural e quem rolou.
 *
 * Quem clica pode estar em outro computador: a resposta volta por socket para quem rodou a macro.
 */
import { MODULO } from "./assinatura.mjs";

const SOCKET = `module.${MODULO}`;
const AJUSTE = "testesDosJogadores";

/** Pedidos esperando resposta neste computador: id → { resolve, dados, msg }. */
const pendentes = new Map();
/** Ids sendo respondidos daqui agora (evita clique duplo enquanto a janela de rolagem está aberta). */
const respondidos = new Set();

const NOMES = {
	acro: "Acrobacia", ades: "Adestramento", atle: "Atletismo", atua: "Atuação", cava: "Cavalgar", conh: "Conhecimento",
	cura: "Cura", dipl: "Diplomacia", enga: "Enganação", fort: "Fortitude", furt: "Furtividade", guer: "Guerra",
	inic: "Iniciativa", inti: "Intimidação", intu: "Intuição", inve: "Investigação", joga: "Jogatina", ladi: "Ladinagem",
	luta: "Luta", mist: "Misticismo", nobr: "Nobreza", perc: "Percepção", pilo: "Pilotagem", pont: "Pontaria",
	refl: "Reflexos", reli: "Religião", sobr: "Sobrevivência", vont: "Vontade", ofic: "Ofício",
	for: "Força", des: "Destreza", con: "Constituição", int: "Inteligência", sab: "Sabedoria", car: "Carisma"
};
const RESISTENCIAS = new Set(["fort", "refl", "vont"]);
/** Marca nas opções do Roll: já foi ao chat no card de um teste. */
const JA_NO_CHAT = "fdtNoCard";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const sinal = (n) => (n >= 0 ? `+${n}` : `${n}`);

/** Nome do teste (perícia ou atributo). */
export function nomeTeste(ator, { pericia, atributo } = {}) {
	if (pericia) {
		const p = ator?.system?.pericias?.[pericia];
		const rot = p?.label ? game.i18n?.localize?.(p.label) : null;
		return NOMES[pericia] ?? (rot && rot !== p.label ? rot : null) ?? pericia;
	}
	return NOMES[atributo] ?? atributo;
}

/** Bônus da ficha no teste. */
const bonusFicha = (ator, { pericia, atributo }) =>
	pericia ? Number(ator?.system?.pericias?.[pericia]?.value) || 0 : Number(ator?.system?.atributos?.[atributo]?.value) || 0;

/** Ligado por padrão; desligado, as macros voltam a rolar tudo sozinhas. */
const ligado = () => {
	try {
		return game.settings.get(MODULO, AJUSTE) !== false;
	} catch {
		return true;
	}
};

/** Jogadores (não Mestres) conectados donos do ator. */
export function jogadoresDe(ator) {
	if (!ator || ator.type !== "character") return [];
	const dono = CONST?.DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 3;
	return (game.users?.filter?.((u) => u.active && !u.isGM && ator.testUserPermission?.(u, dono)) ?? []);
}

/** O jogador rola este teste? */
export const jogadorRola = (ator) => ligado() && jogadoresDe(ator).length > 0;

/** Roll só com o número (o dado já foi mostrado no card do jogador). */
async function rollDoTotal(total, fdt) {
	const r = await new Roll(String(Number(total) || 0)).evaluate();
	r.options.fdt = fdt;
	return r;
}

/** Dano em jogo: Roll, fórmula ou lista deles (várias rolagens somadas, ex.: um 10d6 por explosivo). */
async function comoRolls(dano) {
	if (!dano) return [];
	const lista = Array.isArray(dano) ? dano : [dano];
	const out = [];
	for (const d of lista) {
		if (!d) continue;
		if (typeof d === "string") out.push(await new Roll(d).evaluate());
		else {
			if (!d._evaluated && typeof d.evaluate === "function") await d.evaluate();
			out.push(d);
		}
	}
	return out;
}

function htmlCard(d, { resultado } = {}) {
	const cd = d.cd !== null && d.cd !== undefined && d.cd !== "" ? Number(d.cd) : null;
	const extra = Number(d.extra) || 0;
	let html = `<div class="fdt-teste" data-fdt-teste="${esc(d.id)}">`;
	html += `<header class="fdt-teste-cab"><img src="${esc(d.img || "icons/svg/d20-grey.svg")}" width="36" height="36"><h3>${esc(d.titulo || `Teste de ${d.nome}`)}</h3></header>`;
	if (d.motivo) html += `<p>${d.motivo}</p>`;
	html += `<p><b>${esc(d.atorNome)}</b>: ${esc(d.nome)}${cd !== null ? ` contra <b>CD ${cd}</b>` : ""}${extra ? ` (${sinal(extra)} da situação)` : ""}.</p>`;
	if (d.danoTotal !== null && d.danoTotal !== undefined) {
		html += `<p class="fdt-teste-dano">Dano em jogo: <b>${d.danoTotal}</b>${d.danoFormula ? ` <span class="fdt-ref">(${esc(d.danoFormula)})</span>` : ""}${d.metade ? " · passou, toma metade" : ""}.</p>`;
	}
	if (d.falha) html += `<p class="fdt-ref">Se falhar: ${d.falha}</p>`;
	if (d.sucesso) html += `<p class="fdt-ref">Se passar: ${d.sucesso}</p>`;
	if (resultado) {
		const ok = cd !== null ? resultado.total >= cd : null;
		html += `<p class="fdt-teste-resultado">${esc(resultado.quem)} rolou <b>${resultado.total}</b>${ok === null ? "" : ok ? " ✔️ passou" : " ❌ falhou"}.</p>`;
	} else {
		html += `<button type="button" class="fdt-teste-rolar" data-fdt-teste="${esc(d.id)}"><i class="fa-solid fa-dice-d20"></i> Rolar ${esc(d.nome)}</button>`;
	}
	return `${html}</div>`;
}

/**
 * Pede um teste. Opções:
 *   ator (Actor), pericia (id) ou atributo (id), cd, extra (somado ao total), titulo, motivo (HTML),
 *   dano (Roll, fórmula ou lista deles; aparece no card), metade (true: passou toma metade), falha / sucesso (HTML curto),
 *   auto (true: a macro rola sempre).
 */
export async function pedirTeste(opcoes = {}) {
	const { ator, pericia, atributo, extra = 0, auto = false } = opcoes;
	if (!ator) throw new Error("pedirTeste: falta o ator");
	const qual = { pericia, atributo: pericia ? undefined : atributo ?? "for" };
	const nome = nomeTeste(ator, qual);
	const danos = await comoRolls(opcoes.dano);

	if (auto || !jogadorRola(ator)) {
		const r = await new Roll(`1d20 + ${bonusFicha(ator, qual)} + ${Number(extra) || 0}`).evaluate();
		r.options.fdt = { natural: r.dice?.[0]?.total ?? null, quem: "macro" };
		return r;
	}

	const id = foundry.utils.randomID();
	const dados = {
		id,
		ator: ator.uuid,
		atorNome: ator.name,
		img: ator.img,
		...qual,
		nome,
		cd: opcoes.cd ?? null,
		extra: Number(extra) || 0,
		titulo: opcoes.titulo ?? (pericia && RESISTENCIAS.has(pericia) ? `Teste de resistência: ${nome}` : `Teste de ${nome}`),
		motivo: opcoes.motivo ?? "",
		falha: opcoes.falha ?? "",
		sucesso: opcoes.sucesso ?? "",
		metade: !!opcoes.metade,
		danoTotal: danos.length ? danos.reduce((t, r) => t + (Number(r.total) || 0), 0) : null,
		danoFormula: danos.length ? danos.map((r) => r.formula).join(" + ") : null,
		autor: game.user.id
	};
	const jogadores = jogadoresDe(ator);
	const promessa = new Promise((resolve) => pendentes.set(id, { resolve, dados }));
	const msg = await ChatMessage.create({
		speaker: ChatMessage.getSpeaker({ actor: ator }),
		content: htmlCard(dados),
		rolls: danos,
		flags: { [MODULO]: { teste: dados } }
	});
	// O dano já rolou (e o Dice So Nice já mostrou os dados) neste card: se a macro mandar a mesma rolagem
	// de novo no resumo, ela sai de lá (ver tirarRepetidas), senão os dados aparecem rolando duas vezes.
	for (const r of danos) if (r?.options) r.options[JA_NO_CHAT] = true;
	const p = pendentes.get(id);
	if (p) p.msg = msg;
	Hooks.callAll(`${MODULO}.testePedido`, { id, ator, jogadores, dados });
	return promessa;
}

/** Vários testes ao mesmo tempo (um card por ator; todos podem rolar juntos). Devolve os Rolls na mesma ordem. */
export function pedirTestes(lista = []) {
	return Promise.all(lista.map((o) => pedirTeste(o)));
}

/** Chega a resposta: resolve o pedido (se foi feito aqui) e mostra o resultado no card. */
async function receber({ id, total, natural, quem }) {
	const p = pendentes.get(id);
	if (!p) return false;
	pendentes.delete(id);
	const roll = await rollDoTotal(total, { natural, quem });
	try {
		if (typeof p.msg?.update === "function") await p.msg.update({ content: htmlCard(p.dados, { resultado: { total, quem } }), [`flags.${MODULO}.teste.feito`]: true });
	} catch (e) {
		console.warn(`${MODULO} | não deu para atualizar o card do teste`, e);
	}
	p.resolve(roll);
	return true;
}

/**
 * Rola o teste do card (quem clicou precisa ser dono do ator). `alvo` é o id do pedido ou a mensagem do card.
 * Usa a rolagem da ficha do Tormenta20 (abre a janela de uso conforme a configuração do sistema).
 */
export async function responderTeste(alvo, { event } = {}) {
	const local = typeof alvo === "string" ? pendentes.get(alvo)?.dados : null;
	const dados = local ?? alvo?.flags?.[MODULO]?.teste ?? alvo?.getFlag?.(MODULO, "teste");
	if (!dados) return null;
	if (dados.feito || respondidos.has(dados.id)) {
		ui.notifications?.info?.("Esse teste já foi rolado.");
		return null;
	}
	const ator = await fromUuid(dados.ator);
	if (!ator) return ui.notifications?.warn?.("O personagem desse teste não existe mais.");
	if (!ator.isOwner && !game.user.isGM) return ui.notifications?.warn?.(`Só quem controla ${ator.name} rola esse teste.`);
	respondidos.add(dados.id);
	let res;
	try {
		res = dados.pericia ? await ator.rollPericia(dados.pericia, { event, message: true }) : await ator.rollAtributo(dados.atributo, { event, message: true });
	} catch (e) {
		respondidos.delete(dados.id);
		throw e;
	}
	if (!res) {
		// janela fechada sem rolar
		respondidos.delete(dados.id);
		return null;
	}
	const roll = res instanceof Roll ? res : res.rolls?.[0];
	const base = Number(roll?.total ?? res.flags?.tormenta20?.rollTotal ?? res.getFlag?.("tormenta20", "rollTotal")) || 0;
	const resposta = { id: dados.id, total: base + (Number(dados.extra) || 0), natural: roll?.dice?.[0]?.total ?? null, quem: game.user.name };
	if (!(await receber(resposta))) game.socket?.emit?.(SOCKET, { tipo: "teste", ...resposta });
	// Depois de respondido, o card marca "feito" (e o pedido sai da lista): o id não precisa mais ficar guardado.
	respondidos.delete(dados.id);
	return resposta;
}

/** Botão do card. */
function ligarCard(message, html) {
	const raiz = html instanceof HTMLElement ? html : html?.[0];
	const botao = raiz?.querySelector?.(".fdt-teste-rolar");
	if (!botao) return;
	const dados = message?.getFlag?.(MODULO, "teste") ?? message?.flags?.[MODULO]?.teste;
	if (!dados || dados.feito) return botao.remove();
	botao.addEventListener("click", async (event) => {
		event.preventDefault();
		botao.disabled = true;
		try {
			const r = await responderTeste(message, { event });
			if (!r) botao.disabled = false;
		} catch (e) {
			botao.disabled = false;
			console.error(e);
		}
	});
}

/** Lê as opções de uma rolagem da fonte da mensagem (Roll, objeto ou JSON). */
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

/** Resumo de macro com uma rolagem que já foi ao chat num card de teste: tira a repetida (os dados não rolam duas vezes). */
function tirarRepetidas(message) {
	if (message?.flags?.[MODULO]?.teste) return;
	const fonte = message?._source?.rolls ?? message?.rolls;
	if (!Array.isArray(fonte) || !fonte.some((r) => opcoesDe(r)?.[JA_NO_CHAT])) return;
	message.updateSource({ rolls: fonte.filter((r) => !opcoesDe(r)?.[JA_NO_CHAT]) });
}

export function registrarTestes() {
	game.settings.register(MODULO, AJUSTE, {
		name: "Os jogadores rolam os testes das macros",
		hint: "Quando uma macro da campanha pede um teste de um PJ (resistência, perícia ou atributo), ela manda ao chat um card com o teste, a CD e o dano em jogo, e o jogador clica para rolar. PJs sem jogador conectado e NPCs continuam rolados pela macro. Desligado, as macros rolam tudo sozinhas.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	Hooks.on("renderChatMessageHTML", ligarCard);
	Hooks.on("preCreateChatMessage", tirarRepetidas);
}

export function registrarSocket() {
	game.socket?.on?.(SOCKET, (dados) => {
		if (dados?.tipo === "teste") receber(dados);
	});
}
