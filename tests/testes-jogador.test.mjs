/**
 * Testes pedidos pelas macros (scripts/testes.mjs): a macro manda um card ao chat com o teste, a CD e o dano
 * em jogo, o jogador clica e rola pela ficha, e a macro continua com o resultado.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { criarMundo, carregarModulo, prepararMesa, MODULO } from "./ajudantes.mjs";
import { politicaPadrao } from "../tools/sim/dialogos.mjs";

async function mesa() {
	const mundo = await criarMundo({ semente: "fdt-testes", politica: politicaPadrao });
	const mod = await carregarModulo(mundo);
	mundo.responderTestes = false;
	const pjs = await prepararMesa(mundo, { alvoNpc: false });
	const npc = await mundo.classes.Actor.create({ name: "Bandido", type: "npc" });
	return { mundo, api: mod.api, pjs, npc };
}
const cardsDe = (mundo) => mundo.chat.filter((m) => m.flags?.[MODULO]?.teste);
const espera = () => new Promise((r) => setTimeout(r, 5));

test("PJ com jogador conectado: card com CD, dano e botão; a macro espera o jogador rolar", async () => {
	const { mundo, api, pjs } = await mesa();
	const pj = pjs[0].pj;
	const dano = await new globalThis.Roll("4d6[fogo]").evaluate();
	let pronto = false;
	const promessa = api.pedirTeste({ ator: pj, pericia: "refl", cd: 20, extra: 2, dano, metade: true, titulo: "Canhão de Fogo" }).then((r) => ((pronto = true), r));
	await espera();
	const [card] = cardsDe(mundo);
	assert.ok(card, "o card não foi para o chat");
	assert.match(card.content, /Canhão de Fogo/);
	assert.match(card.content, /CD 20/);
	assert.match(card.content, new RegExp(`Dano em jogo: <b>${dano.total}</b>`));
	assert.match(card.content, /fdt-teste-rolar/);
	assert.equal(card.rolls[0], dano, "a rolagem de dano vai junto no card");
	assert.equal(pronto, false, "a macro não pode seguir antes do jogador rolar");

	const resposta = await api.responderTeste(card.flags[MODULO].teste.id);
	const r = await promessa;
	const rolagem = mundo.chat.find((m) => m.flags?.tormenta20?.rollTotal !== undefined);
	assert.ok(rolagem, "o jogador rola pela ficha (card do sistema)");
	assert.equal(r.total, rolagem.flags.tormenta20.rollTotal + 2, "total = rolagem do jogador + extra da macro");
	assert.equal(resposta.total, r.total);
	assert.ok(r._evaluated);
	assert.equal(typeof r.options.fdt.natural, "number");
	assert.equal(await api.responderTeste(card.flags[MODULO].teste.id), null, "não rola duas vezes");
	mundo.encerrar();
});

test("NPC, PJ sem jogador e a opção desligada: a macro rola sozinha, sem card", async () => {
	const { mundo, api, pjs, npc } = await mesa();
	const r1 = await api.pedirTeste({ ator: npc, pericia: "fort", cd: 15 });
	assert.ok(r1._evaluated);
	assert.equal(cardsDe(mundo).length, 0);

	const orfao = await mundo.criarPJ("Sem Jogador", { nivel: 3 });
	await api.pedirTeste({ ator: orfao, pericia: "vont" });
	assert.equal(cardsDe(mundo).length, 0, "PJ sem jogador conectado");

	await mundo.game.settings.set(MODULO, "testesDosJogadores", false);
	const r3 = await api.pedirTeste({ ator: pjs[1].pj, atributo: "for", extra: 3 });
	assert.ok(r3.total >= 4);
	assert.equal(cardsDe(mundo).length, 0, "opção desligada");
	mundo.encerrar();
});

test("vários PJs ao mesmo tempo: todos os cards saem antes de alguém rolar", async () => {
	const { mundo, api, pjs } = await mesa();
	const promessa = api.pedirTestes(pjs.map(({ pj }) => ({ ator: pj, pericia: "vont", cd: 15 })));
	await espera();
	const cards = cardsDe(mundo);
	assert.equal(cards.length, pjs.length);
	for (const c of [...cards].reverse()) await api.responderTeste(c.flags[MODULO].teste.id);
	const rs = await promessa;
	assert.equal(rs.length, pjs.length);
	for (const r of rs) assert.ok(r._evaluated);
	mundo.encerrar();
});

test("jogador em outro computador: a resposta volta por socket para quem rodou a macro", async () => {
	const { mundo, api, pjs } = await mesa();
	const enviados = [];
	let ouvinte = null;
	mundo.game.socket = { on: (canal, fn) => { assert.equal(canal, `module.${MODULO}`); ouvinte = fn; }, emit: (canal, dados) => enviados.push(dados) };
	mundo.chamarHook("ready");
	await mundo.aguardarOcioso();
	assert.ok(ouvinte, "o módulo escuta o socket");

	// Clique num card que não foi pedido neste computador: rola e manda pelo socket.
	const card = { flags: { [MODULO]: { teste: { id: "outroPC0000000001", ator: pjs[2].pj.uuid, pericia: "atle", extra: 1 } } } };
	const resp = await api.responderTeste(card);
	assert.equal(enviados.length, 1);
	assert.equal(enviados[0].id, "outroPC0000000001");
	assert.equal(enviados[0].total, resp.total);

	// Quem pediu recebe a resposta pelo socket.
	const promessa = api.pedirTeste({ ator: pjs[0].pj, pericia: "luta" });
	await espera();
	const pedido = cardsDe(mundo).at(-1).flags[MODULO].teste;
	ouvinte({ tipo: "teste", id: pedido.id, total: 17, natural: 12, quem: "Jogador 1" });
	const r = await promessa;
	assert.equal(r.total, 17);
	assert.equal(r.options.fdt.quem, "Jogador 1");
	mundo.encerrar();
});

test("o dano do card não rola de novo no resumo da macro (nada duplicado no chat)", async () => {
	const { mundo, api, pjs } = await mesa();
	const pj = pjs[0].pj;
	const dano = await new globalThis.Roll("2d12[psiquico]").evaluate();
	const promessa = api.pedirTeste({ ator: pj, pericia: "vont", cd: 25, dano, metade: true });
	await espera();
	const [card] = cardsDe(mundo);
	await api.responderTeste(card.flags[MODULO].teste.id);
	const r = await promessa;
	assert.equal(cardsDe(mundo).length, 1, "um card só");
	assert.equal(mundo.chat.filter((m) => m.flags?.tormenta20?.rollTotal !== undefined).length, 1, "o jogador rola uma vez só");
	// O resumo da macro costuma mandar as rolagens da cena (incluindo o dano que já foi no card).
	const outra = await new globalThis.Roll("1d4").evaluate();
	const resumo = await mundo.ChatMessage.create({ content: "<p>Surto Psíquico</p>", rolls: [dano, r, outra] });
	assert.ok(!resumo.rolls.includes(dano), "o dano já mostrado no card sai do resumo");
	assert.ok(resumo.rolls.includes(outra), "as outras rolagens ficam");
	// Sem card (NPC), o dano não foi ao chat: fica no resumo.
	const npcDano = await new globalThis.Roll("2d12").evaluate();
	await api.pedirTeste({ ator: await mundo.classes.Actor.create({ name: "Ogro", type: "npc" }), pericia: "vont", dano: npcDano });
	const resumo2 = await mundo.ChatMessage.create({ content: "<p>x</p>", rolls: [npcDano] });
	assert.ok(resumo2.rolls.includes(npcDano));
	mundo.encerrar();
});
