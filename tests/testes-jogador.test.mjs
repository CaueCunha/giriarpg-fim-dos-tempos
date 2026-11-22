/**
 * Testes no chat (scripts/testes.mjs, no padrão do Duelo de Dragões): a macro manda um card com o dano já rolado,
 * cada dono clica em Rolar e rola pela ficha, o resultado volta ao Mestre (socket) e só ele aplica pelos botões.
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
	return { mundo, api: mod.api, T: mod.api.testes, pjs };
}
const cardsDe = (mundo) => mundo.chat.filter((m) => m.flags?.[MODULO]?.pedido);
const espera = () => new Promise((r) => setTimeout(r, 5));
const pv = (a) => a.system.attributes.pv.value;
const acaoDe = (msg, tipo, ator) => (msg.flags[MODULO].acoes ?? []).findIndex((a) => a.tipo === tipo && (!ator || a.ator === ator.uuid));

test("card: classes do sistema, dano só no conteúdo (roll--dano), botão Rolar por personagem", async () => {
	const { mundo, T, pjs } = await mesa();
	const dano = await new globalThis.Roll("4d6[fogo]").evaluate();
	let pronto = false;
	const promessa = T.pedir({ titulo: "Canhão de Fogo", testes: pjs.slice(0, 2).map(({ pj }) => ({ ator: pj, pericia: "refl", cd: 20 })), dano, sucesso: "metade" }).then((r) => ((pronto = true), r));
	await espera();
	const cards = cardsDe(mundo);
	assert.equal(cards.length, 1, "um card só para todos");
	const [card] = cards;
	assert.match(card.content, /class="fdt-pedido tormenta20 item-card"/);
	assert.match(card.content, /class="roll roll--dano"/);
	assert.equal((card.rolls ?? []).length, 0, "a rolagem não vai em rolls");
	assert.equal((card.content.match(/class="fdt-rolar"/g) ?? []).length, 2, "um botão Rolar por personagem");
	assert.match(card.content, /CD 20/);
	assert.equal(pronto, false, "a macro espera os jogadores");

	for (const i of [0, 1]) await T._teste.clicarRolar(mundo.game.messages.get(card.id), i, "refl");
	const rs = await promessa;
	assert.equal(rs.length, 2);
	assert.equal(mundo.chat.filter((m) => m.flags?.tormenta20?.rollTotal !== undefined).length, 2, "cada um rola pela ficha uma vez");
	const fim = mundo.game.messages.get(card.id);
	assert.ok(fim.flags[MODULO].pedido.fechado);
	assert.equal(fim.flags[MODULO].acoes.filter((a) => a.tipo === "dano").length, 2, "um botão de dano para cada um");
	for (const a of fim.flags[MODULO].acoes) assert.equal(a.mult, rs[a.linha].passou ? 0.5 : 1);
	assert.match(fim.content, /fdt-acao fdt-mestre/, "botões só do Mestre");
	assert.equal(await T._teste.clicarRolar(fim, 0, "refl"), null, "não rola duas vezes");
	mundo.encerrar();
});

test("nada é aplicado até o Mestre clicar; o botão aplica dano e condição uma vez", async () => {
	const { mundo, T, pjs } = await mesa();
	const pj = pjs[0].pj;
	const antes = pv(pj);
	const dano = await new globalThis.Roll("10[fogo]").evaluate();
	const promessa = T.pedir({ titulo: "Armadilha", testes: [{ ator: pj, pericia: "refl", cd: 99 }], dano, sucesso: "evita", falha: { texto: "fica em chamas.", status: "emchamas" } });
	await espera();
	const [card] = cardsDe(mundo);
	await T._teste.clicarRolar(card, 0, "refl");
	const [r] = await promessa;
	assert.equal(r.passou, false);
	assert.equal(pv(pj), antes, "o teste não aplica nada sozinho");
	assert.ok(!pj.statuses?.has?.("emchamas"));
	let msg = mundo.game.messages.get(card.id);
	await T._teste.executarAcao(msg, acaoDe(msg, "dano", pj));
	assert.ok(pv(pj) < antes, "o botão de dano aplicou");
	const depois = pv(pj);
	msg = mundo.game.messages.get(card.id);
	await T._teste.executarAcao(msg, acaoDe(msg, "dano", pj));
	assert.equal(pv(pj), depois, "o mesmo botão não aplica duas vezes");
	await T._teste.executarAcao(msg, acaoDe(msg, "status", pj));
	assert.ok(pj.statuses.has("emchamas"), "o botão de condição aplicou");
	mundo.encerrar();
});

test("atalho das macros (fdtTestes): pedidos com o mesmo título e dano vão num card, resultados na ordem", async () => {
	const { mundo, T, pjs } = await mesa();
	mundo.responderTestes = true;
	const dano = await new globalThis.Roll("2d12[psiquico]").evaluate();
	const rs = await T.lista(pjs.map(({ pj }) => ({ ator: pj, pericia: "vont", cd: 15, extra: 2, dano, metade: true, titulo: "Surto Psíquico" })));
	assert.equal(cardsDe(mundo).length, 1);
	assert.equal(rs.length, pjs.length);
	const fichas = mundo.chat.filter((m) => m.flags?.tormenta20?.rollTotal !== undefined);
	for (const [i, r] of rs.entries()) {
		assert.ok(r._evaluated);
		assert.equal(r.total, fichas[i].flags.tormenta20.rollTotal + 2, "total = rolagem do jogador + extra da macro");
		assert.equal(typeof r.options.fdt.natural, "number");
	}
	// O resumo da macro leva as rolagens da cena: o dano e os totais já mostrados saem.
	const outra = await new globalThis.Roll("1d4").evaluate();
	const resumo = await mundo.ChatMessage.create({ content: "<p>resumo</p>", rolls: [dano, ...rs, outra] });
	assert.deepEqual(resumo.rolls, [outra], "nada repetido no chat");
	mundo.encerrar();
});

test("jogador em outro computador: rola pela ficha e o resultado volta ao Mestre pelo socket", async () => {
	const { mundo, T, pjs } = await mesa();
	const enviados = [];
	let ouvinte = null;
	mundo.game.socket = { on: (canal, fn) => { assert.equal(canal, `module.${MODULO}`); ouvinte = fn; }, emit: (canal, dados) => enviados.push(dados) };
	mundo.chamarHook("ready");
	await mundo.aguardarOcioso();
	assert.ok(ouvinte, "o módulo escuta o socket");
	const promessa = T.pedir({ titulo: "Medo", testes: [{ ator: pjs[1].pj, pericia: "vont", cd: 15 }] });
	await espera();
	const [card] = cardsDe(mundo);
	// O jogador (dono do PJ, não Mestre) clica.
	const mestre = mundo.usuario;
	mundo.usuario = pjs[1].jog;
	const dados = await T._teste.clicarRolar(card, 0, "vont");
	mundo.usuario = mestre;
	assert.equal(enviados.length, 1, "o resultado vai pelo socket");
	assert.equal(enviados[0].tipo, "resultado");
	assert.equal(enviados[0].total, dados.total);
	assert.ok(!mundo.game.messages.get(card.id).flags[MODULO].pedido.linhas[0].feito, "o jogador não mexe no card");
	// O Mestre recebe e anota.
	ouvinte(enviados[0]);
	const [r] = await promessa;
	assert.equal(r.total, dados.total);
	mundo.encerrar();
});

test("coletor (fdtAplicar): as macros só deixam botões para o Mestre", async () => {
	const { mundo, T, pjs } = await mesa();
	const pj = pjs[0].pj;
	const antes = { pv: pv(pj), pm: pj.system.attributes.pm.value };
	const A = T.coletor();
	await A.dano(pj, await new globalThis.Roll("5[corte]").evaluate(), 1);
	await A.pm(pj, 1);
	await A.status(pj, "abalado", { active: true });
	await A.efeito(pj, [{ name: "Teste", type: "base", system: { changes: [] } }]);
	assert.equal(A.pendentes(), 4);
	assert.equal(pv(pj), antes.pv);
	assert.equal(pj.system.attributes.pm.value, antes.pm);
	const msg = await A.enviar({ content: "<h3>Resumo</h3>" });
	assert.match(msg.content, /fdt-acoes fdt-mestre/);
	assert.equal(msg.flags[MODULO].acoes.length, 4);
	for (const i of [0, 1, 2, 3]) await T._teste.executarAcao(mundo.game.messages.get(msg.id), i);
	assert.ok(pv(pj) < antes.pv);
	assert.equal(pj.system.attributes.pm.value, Math.max(0, antes.pm - 1));
	assert.ok(pj.statuses.has("abalado"));
	assert.ok(pj.effects.some((e) => e.name === "Teste"));
	assert.equal(await A.fim("nada"), null, "sem pendências, fim não manda nada");
	mundo.encerrar();
});

test("macros do mundo se atualizam sozinhas e as editadas ficam guardadas numa cópia", async () => {
	const { mundo, api } = await mesa();
	const pack = mundo.game.packs.get(`${MODULO}.a1-av1-macros`);
	const [i1, i2] = pack.index.contents.slice(0, 2);
	const m1 = await pack.getDocument(i1._id);
	const m2 = await pack.getDocument(i2._id);
	const fonte = (m) => ({ ...m.toObject(), _stats: { compendiumSource: m.uuid } });
	// Uma igual a uma versão antiga do compêndio (sem edição) e outra editada pelo Mestre.
	const [w1, w2] = await mundo.classes.Macro.createDocuments([fonte(m1), { ...fonte(m2), command: "// minha versão\nconsole.log(1);" }]);
	await w1.update({ command: m1.command });
	const r = await api.atualizarMacros({ rodada: "teste", forcar: true });
	assert.equal(r.trocadas, 1, "só a editada difere do compêndio");
	assert.equal(r.copias, 1);
	assert.equal(mundo.game.macros.get(w2.id).command, m2.command, "a macro do mundo recebeu a versão nova");
	const copia = mundo.game.macros.find((m) => m.name === `${m2.name} (sua edição)`);
	assert.ok(copia, "cópia da edição");
	assert.match(copia.command, /minha versão/);
	assert.match(mundo.game.folders.get(copia.folder?.id ?? copia.folder)?.name ?? "", /Cópias das suas edições/);
	assert.equal(await api.atualizarMacros({ rodada: "teste" }), null, "uma vez por rodada");
	mundo.encerrar();
});
