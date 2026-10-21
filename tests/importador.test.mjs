/**
 * O importador do módulo (scripts/fdt.mjs): oferta ao abrir o mundo, botão na aba de compêndios,
 * reimportação que mantém IDs, Lei & Ordem e a ficha do grupo, e o modo "só o que falta".
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { criarMundo, carregarModulo, problemas, limparRegistros, manifesto, MODULO } from "./ajudantes.mjs";
import { politicaPadrao, politicaRoteiro } from "../tools/sim/dialogos.mjs";
import { window } from "../tools/sim/dialogos.mjs";

const versao = manifesto().version;
const papel = (mundo, col, role) => mundo.game[col].find((d) => d.getFlag("world", "fdtRole") === role);
const doModulo = (mundo) => ["actors", "items", "journal", "tables", "macros"].reduce((n, c) => n + mundo.game[c].filter((d) => d.getFlag("world", "fdt")).length, 0);

test("ao abrir o mundo, o Mestre recebe a oferta e importa os três atos", async () => {
	const mundo = await criarMundo({ semente: "imp-ready", politica: politicaPadrao });
	await carregarModulo(mundo, { ready: true });
	const oferta = mundo.dialogos.find((d) => /importar para o mundo/.test(d.titulo));
	assert.ok(oferta, "a janela de importação não apareceu no ready");
	assert.deepEqual(problemas(mundo, { avisos: true }), []);
	const reg = mundo.game.settings.get(MODULO, "importado");
	assert.deepEqual(reg, { ato1: versao, ato2: versao, campanha: versao });
	const tamanhoPacks = mundo.game.packs.filter((p) => p.metadata.packageName === MODULO).reduce((n, p) => n + p.index.size, 0);
	assert.equal(doModulo(mundo), tamanhoPacks, "o mundo deve ter um documento para cada entrada dos compêndios");

	// Abrir o mundo de novo não oferece outra vez
	limparRegistros(mundo);
	await carregarModulo(mundo, { ready: true });
	assert.equal(mundo.dialogos.length, 0, "ofereceu a importação de novo");
	mundo.encerrar();
});

test("a oferta pode ser desligada nas configurações", async () => {
	const mundo = await criarMundo({ semente: "imp-off" });
	await carregarModulo(mundo);
	await mundo.game.settings.set(MODULO, "oferecer", false);
	mundo.chamarHook("ready");
	await mundo.aguardarOcioso();
	assert.equal(mundo.dialogos.length, 0);
	assert.equal(doModulo(mundo), 0);
	mundo.encerrar();
});

test("botão na aba de compêndios abre o importador", async () => {
	const mundo = await criarMundo({ semente: "imp-botao", politica: politicaRoteiro([{ campos: { ato1: false, campanha: false } }]) });
	await carregarModulo(mundo);
	const html = window.document.createElement("section");
	html.innerHTML = '<header class="directory-header"><div class="header-actions"></div></header>';
	mundo.chamarHook("renderCompendiumDirectory", {}, html);
	mundo.chamarHook("renderCompendiumDirectory", {}, html);
	const botoes = html.querySelectorAll(".fdt-importar");
	assert.equal(botoes.length, 1, "o botão deve aparecer uma vez só");
	botoes[0].click();
	await mundo.aguardarOcioso();
	assert.deepEqual(problemas(mundo, { avisos: true }), []);
	assert.deepEqual(Object.keys(mundo.game.settings.get(MODULO, "importado")), ["ato2"]);
	assert.ok(mundo.game.actors.size > 0 && mundo.game.actors.every((a) => a.getFlag("world", "fdt")?.startsWith("a2")), "só o Ato 2 devia ter vindo");
	mundo.encerrar();
});

test("jogador não importa", async () => {
	const mundo = await criarMundo({ semente: "imp-jogador", gm: false, usuario: "Jogador" });
	await carregarModulo(mundo, { ready: true });
	assert.equal(mundo.dialogos.length, 0);
	assert.equal(await mundo.game.modules.get(MODULO).api.importar(["ato1"]), null);
	assert.equal(doModulo(mundo), 0);
	mundo.encerrar();
});

test("reimportar substitui com os mesmos IDs e preserva Lei & Ordem, grupo e tokens", async () => {
	const mundo = await criarMundo({ semente: "imp-substituir" });
	await carregarModulo(mundo);
	const api = mundo.game.modules.get(MODULO).api;
	await api.importar(["ato1", "ato2", "campanha"], { modo: "substituir" });

	const lei = papel(mundo, "actors", "leiordem");
	const grupo = papel(mundo, "journal", "grupo");
	assert.ok(lei, "ator de Lei & Ordem não foi importado");
	assert.ok(grupo, "diário do grupo não foi importado");
	const recursos = { "system.resources.primary.value": 2 };
	await lei.update(recursos);
	await grupo.setFlag("world", "fdtGrupo", { membros: ["abc"], pm: 7 });
	const ameaca = mundo.game.actors.find((a) => a.type === "npc" && a.getFlag("world", "fdt"));
	await mundo.criarCena("Cena com token");
	const token = await mundo.colocarToken(ameaca);
	await ameaca.update({ name: "Nome editado pelo Mestre" });
	const ids = new Set(mundo.game.actors.map((a) => a.id));

	limparRegistros(mundo);
	mundo.politica = politicaRoteiro([{ botao: "substituir" }]);
	const r = await api.importar(["ato1", "ato2", "campanha"]);
	assert.ok(mundo.dialogos.some((d) => /já importado/.test(d.titulo)), "não perguntou o que fazer com o conteúdo existente");
	assert.ok(r.apagados > 0 && r.criados === r.apagados, `apagou ${r.apagados}, criou ${r.criados}`);
	assert.deepEqual(problemas(mundo, { avisos: true }), []);
	assert.deepEqual(new Set(mundo.game.actors.map((a) => a.id)), ids, "os IDs mudaram");
	assert.equal(papel(mundo, "actors", "leiordem").system.resources.primary.value, 2, "Lei & Ordem voltou ao início");
	assert.deepEqual(papel(mundo, "journal", "grupo").getFlag("world", "fdtGrupo"), { membros: ["abc"], pm: 7 }, "a ficha do grupo se perdeu");
	assert.equal(token.document.actor?.id, ameaca.id, "o token perdeu o ator");
	assert.notEqual(mundo.game.actors.get(ameaca.id).name, "Nome editado pelo Mestre", "substituir devia trazer a versão do módulo");
	mundo.encerrar();
});

test("só o que falta: recria o apagado e não mexe no editado", async () => {
	const mundo = await criarMundo({ semente: "imp-faltando" });
	await carregarModulo(mundo);
	const api = mundo.game.modules.get(MODULO).api;
	await api.importar(["ato1"], { modo: "substituir" });
	const total = doModulo(mundo);
	const [a, b] = mundo.game.actors.filter((x) => x.getFlag("world", "fdt"));
	await b.update({ name: "Editado" });
	await a.delete();
	const macro = mundo.game.macros.find((m) => m.getFlag("world", "fdt"));
	await macro.delete();

	limparRegistros(mundo);
	mundo.politica = politicaRoteiro([{ botao: "faltando" }]);
	const r = await api.importar(["ato1"]);
	assert.deepEqual(problemas(mundo, { avisos: true }), []);
	assert.equal(r.criados, 2);
	assert.equal(doModulo(mundo), total);
	assert.ok(mundo.game.actors.get(a.id), "o ator apagado não voltou com o mesmo ID");
	assert.equal(mundo.game.actors.get(b.id).name, "Editado");
	mundo.encerrar();
});

test("cancelar a pergunta não muda nada", async () => {
	const mundo = await criarMundo({ semente: "imp-cancelar" });
	await carregarModulo(mundo);
	const api = mundo.game.modules.get(MODULO).api;
	await api.importar(["ato2"], { modo: "substituir" });
	const antes = doModulo(mundo);
	mundo.politica = politicaRoteiro([{ botao: "cancelar" }]);
	assert.equal(await api.importar(["ato2"]), null);
	assert.equal(doModulo(mundo), antes);
	mundo.encerrar();
});

test("importar um ato não apaga o outro", async () => {
	const mundo = await criarMundo({ semente: "imp-atos" });
	await carregarModulo(mundo);
	const api = mundo.game.modules.get(MODULO).api;
	await api.importar(["ato1"], { modo: "substituir" });
	const so1 = doModulo(mundo);
	await api.importar(["ato2"], { modo: "substituir" });
	const com2 = doModulo(mundo);
	assert.ok(com2 > so1);
	await api.importar(["ato2"], { modo: "substituir" });
	assert.equal(doModulo(mundo), com2);
	mundo.encerrar();
});
