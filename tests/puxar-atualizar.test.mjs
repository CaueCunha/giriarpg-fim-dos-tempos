/**
 * O módulo não importa nada sozinho (scripts/fdt.mjs):
 *   - abrir o mundo não cria documentos;
 *   - "Puxar do compêndio" cria só o que falta, nas pastas Ato › aventura, com os IDs e os links do mundo;
 *   - "Atualizar do compêndio" troca só o que não foi editado e foi marcado; o editado fica como está;
 *     Lei & Ordem, a ficha do grupo, a pasta e os tokens sobrevivem.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { criarMundo, carregarModulo, problemas, limparRegistros, MODULO } from "./ajudantes.mjs";
import { politicaPadrao, politicaRoteiro, window } from "../tools/sim/dialogos.mjs";
import { assinatura } from "../scripts/assinatura.mjs";

const papel = (mundo, col, role) => mundo.game[col].find((d) => d.getFlag("world", "fdtRole") === role);
const doModulo = (mundo) => ["actors", "items", "journal", "tables", "macros"].reduce((n, c) => n + mundo.game[c].filter((d) => d.getFlag("world", "fdt")).length, 0);
const api = (mundo) => mundo.game.modules.get(MODULO).api;

/** Simula uma versão nova do módulo: muda a fonte do compêndio e acrescenta a assinatura nova ao histórico. */
function novaVersao(mundo, doc, mudar) {
	const uuid = doc._stats.compendiumSource;
	const [, , nomePack, tipo, id] = uuid.split(".");
	const pack = mundo.game.packs.get(`${MODULO}.${nomePack}`);
	const src = pack._fontes.get(id);
	mudar(src);
	const a = assinatura(src, tipo);
	src.flags[MODULO].assinatura = a;
	src.flags[MODULO].assinaturas = [...src.flags[MODULO].assinaturas, a];
	pack.delete(id);
	const e = pack.index.get(id);
	e.name = src.name;
	return a;
}

/** Marca, no diálogo, as caixas cujo rótulo contém o texto. */
const marcar = (texto, botao) => (d) => {
	for (const l of d.form.querySelectorAll("label")) {
		const c = l.querySelector("input[type=checkbox]");
		if (c && !c.disabled) c.checked = l.textContent.includes(texto);
	}
	return botao;
};

test("abrir o mundo não importa nada nem abre janela", async () => {
	const mundo = await criarMundo({ semente: "fdt-ready", politica: politicaPadrao });
	await carregarModulo(mundo, { ready: true });
	assert.deepEqual(problemas(mundo, { avisos: true }), []);
	assert.equal(mundo.dialogos.length, 0, "não devia abrir janela");
	assert.equal(doModulo(mundo), 0, "não devia criar nada no mundo");
	mundo.encerrar();
});

test("o botão da aba de Compêndios puxa só a aventura marcada, nas pastas do compêndio", async () => {
	const mundo = await criarMundo({ semente: "fdt-botao", politica: politicaRoteiro([{ botao: "puxar" }, marcar("Cultistas Puristas", "puxar")]) });
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
	const marcas = new Set(["actors", "items", "journal", "tables", "macros"].flatMap((c) => mundo.game[c].map((d) => d.getFlag("world", "fdt"))));
	assert.deepEqual([...marcas], ["av3"], "só a Av3 devia ter vindo");
	const ator = mundo.game.actors.contents[0];
	assert.equal(ator.folder?.folder?.name, "Ato 1 · Colinas Centrais", "a aventura devia ficar dentro da pasta do ato");
	assert.match(ator._stats.compendiumSource, new RegExp(`^Compendium\\.${MODULO}\\.ameacas\\.Actor\\.${ator.id}$`), "puxado com o mesmo ID e a origem");
	mundo.encerrar();
});

test("jogador não puxa nem atualiza", async () => {
	const mundo = await criarMundo({ semente: "fdt-jogador", gm: false, usuario: "Jogador" });
	await carregarModulo(mundo, { ready: true });
	assert.equal(await api(mundo).puxar({ atos: ["ato1"] }), null);
	assert.equal(await api(mundo).atualizar({ confirmar: false }), null);
	assert.equal(doModulo(mundo), 0);
	mundo.encerrar();
});

test("puxar de novo só recria o que falta e não mexe no editado", async () => {
	const mundo = await criarMundo({ semente: "fdt-faltando" });
	await carregarModulo(mundo);
	await api(mundo).puxar({ atos: ["ato1"] });
	const total = doModulo(mundo);
	const [a, b] = mundo.game.actors.filter((x) => x.getFlag("world", "fdt"));
	await b.update({ name: "Editado" });
	await a.delete();
	const r = await api(mundo).puxar({ atos: ["ato1"] });
	assert.deepEqual(problemas(mundo, { avisos: true }), []);
	assert.equal(r.criados, 1);
	assert.equal(doModulo(mundo), total);
	assert.ok(mundo.game.actors.get(a.id), "o ator apagado não voltou com o mesmo ID");
	assert.equal(mundo.game.actors.get(b.id).name, "Editado");
	mundo.encerrar();
});

test("links do compêndio funcionam no compêndio e viram links do mundo ao puxar", async () => {
	const mundo = await criarMundo({ semente: "fdt-links" });
	await carregarModulo(mundo);
	const diarios = mundo.game.packs.get(`${MODULO}.diarios`);
	let links = 0;
	for (const j of await diarios.getDocuments()) {
		for (const pg of j.pages) {
			const html = pg.text?.content ?? "";
			links += (html.match(/@UUID\[Compendium\.giriarpg/g) ?? []).length;
			mundo.verificarLinks(html, `${j.name} › ${pg.name}`);
		}
	}
	assert.ok(links > 100, `os diários deviam apontar para o compêndio (${links})`);
	assert.deepEqual(problemas(mundo), [], "link quebrado dentro do compêndio");

	await api(mundo).puxar({ atos: ["ato1", "ato2", "campanha"] });
	const restantes = mundo.game.journal.contents.flatMap((j) => j.pages.contents).filter((pg) => /@UUID\[Compendium\.giriarpg/.test(pg.text?.content ?? ""));
	assert.deepEqual(restantes.map((pg) => pg.name), [], "com tudo no mundo, os links deviam apontar para o mundo");
	mundo.encerrar();
});

test("o que foi puxado é igual ao compêndio: nada a atualizar", async () => {
	const mundo = await criarMundo({ semente: "fdt-iguais" });
	await carregarModulo(mundo);
	await api(mundo).puxar({ atos: ["ato1", "ato2", "campanha"] });
	const lista = await api(mundo).procurarAtualizacoes();
	assert.deepEqual(lista.map((p) => `${p.entrada.tipo} ${p.doc.name}: ${p.estado}`), []);
	mundo.encerrar();
});

test("atualizar troca só o que não foi editado e foi marcado; preserva Lei & Ordem, grupo, pasta e tokens", async () => {
	const mundo = await criarMundo({ semente: "fdt-atualizar" });
	await carregarModulo(mundo);
	await api(mundo).puxar({ atos: ["ato2", "campanha"] });
	const npcs = mundo.game.actors.filter((a) => a.type === "npc" && a.getFlag("world", "fdt") && !["leiordem"].includes(a.getFlag("world", "fdtRole")) && a.items.size > 0);
	const [semMexer, editado, desmarcado] = npcs;
	const lei = papel(mundo, "actors", "leiordem");
	const grupo = papel(mundo, "journal", "grupo");

	// mesa: Lei & Ordem andou, o grupo foi montado, um NPC está numa cena e numa pasta minha, outro foi corrigido à mão
	await lei.update({ "system.resources.primary.value": 2 });
	await grupo.setFlag("world", "fdtGrupo", { membros: ["abc"], pm: 7 });
	await mundo.criarCena("Cena com token");
	const token = await mundo.colocarToken(semMexer);
	const minhaPasta = await globalThis.Folder.create({ name: "Minha pasta", type: "Actor" });
	await semMexer.update({ folder: minhaPasta.id });
	await editado.update({ name: "Corrigido pelo Mestre" });
	const itemCorrigido = editado.items.contents[0];
	await itemCorrigido.update({ name: "Ataque corrigido" });
	// arrastado do compêndio sem o ID (como o Foundry faz ao arrastar): também é reconhecido pela origem
	const arrastado = mundo.game.items.find((i) => i.getFlag("world", "fdt"));
	const dadosArrastado = arrastado.toObject();
	delete dadosArrastado._id;
	await arrastado.delete();
	const [copia] = await globalThis.Item.createDocuments([dadosArrastado]);

	// versão nova do módulo: muda os quatro, a Lei & Ordem e o grupo no compêndio
	for (const d of [semMexer, editado, desmarcado, lei]) novaVersao(mundo, d, (s) => (s.name = `${s.name} (v nova)`));
	novaVersao(mundo, grupo, (s) => (s.name = `${s.name} (v nova)`));
	novaVersao(mundo, copia, (s) => (s.name = `${s.name} (v nova)`));

	const lista = await api(mundo).procurarAtualizacoes();
	const estado = Object.fromEntries(lista.map((p) => [p.doc.id, p.estado]));
	assert.equal(estado[semMexer.id], "desatualizado");
	assert.equal(estado[editado.id], "editado");
	assert.equal(estado[lei.id], "desatualizado", "Lei & Ordem mudou só no contador: não conta como edição");
	assert.equal(estado[grupo.id], "desatualizado", "o grupo montado não conta como edição");
	assert.equal(estado[copia.id], "desatualizado", "o item arrastado (outro ID) devia ser achado pela origem");

	limparRegistros(mundo);
	mundo.politica = politicaRoteiro([
		(d) => {
			const editavel = d.form.querySelector(`input[type=checkbox]:disabled`);
			assert.ok(editavel, "o editado devia aparecer travado");
			for (const l of d.form.querySelectorAll("label")) if (l.textContent.includes(desmarcado.name)) l.querySelector("input").checked = false;
			return "ok";
		}
	]);
	const r = await api(mundo).atualizar();
	assert.deepEqual(problemas(mundo, { avisos: true }), []);
	assert.equal(r.editados, 1);
	assert.equal(r.atualizados, lista.length - 2, "todos os marcados, menos o editado e o desmarcado");

	assert.match(mundo.game.actors.get(semMexer.id).name, /\(v nova\)$/);
	assert.equal(mundo.game.actors.get(semMexer.id).folder?.id, minhaPasta.id, "a pasta escolhida pelo Mestre se perdeu");
	assert.equal(token.document.actor?.id, semMexer.id, "o token perdeu o ator");
	assert.equal(mundo.game.actors.get(editado.id).name, "Corrigido pelo Mestre", "o editado não podia mudar");
	assert.equal(mundo.game.actors.get(editado.id).items.get(itemCorrigido.id).name, "Ataque corrigido");
	assert.doesNotMatch(mundo.game.actors.get(desmarcado.id).name, /v nova/, "o desmarcado não podia mudar");
	assert.match(mundo.game.items.get(copia.id).name, /\(v nova\)$/, "o arrastado devia atualizar com o ID dele");
	assert.equal(papel(mundo, "actors", "leiordem").system.resources.primary.value, 2, "Lei & Ordem voltou ao início");
	assert.deepEqual(papel(mundo, "journal", "grupo").getFlag("world", "fdtGrupo"), { membros: ["abc"], pm: 7 }, "a ficha do grupo se perdeu");
	assert.ok(mundo.chat.some((c) => /Atualização do compêndio/.test(c.content ?? "")), "faltou o resumo no chat");

	// de novo: só o editado e o desmarcado continuam na lista
	const depois = await api(mundo).procurarAtualizacoes();
	assert.deepEqual(depois.map((p) => p.doc.id).sort(), [editado.id, desmarcado.id].sort(), depois.map((p) => `${p.doc.name} ${p.estado}`).join("; "));
	mundo.encerrar();
});

test("cancelar a atualização não muda nada", async () => {
	const mundo = await criarMundo({ semente: "fdt-cancelar" });
	await carregarModulo(mundo);
	await api(mundo).puxar({ atos: ["ato2"] });
	const ator = mundo.game.actors.find((a) => a.getFlag("world", "fdt"));
	novaVersao(mundo, ator, (s) => (s.name = "Outro nome"));
	mundo.politica = politicaRoteiro([{ botao: "cancelar" }]);
	assert.equal(await api(mundo).atualizar(), null);
	assert.notEqual(mundo.game.actors.get(ator.id).name, "Outro nome");
	mundo.encerrar();
});

test("versão nova avisa no chat uma vez e não muda nada", async () => {
	const mundo = await criarMundo({ semente: "fdt-aviso" });
	await carregarModulo(mundo);
	await api(mundo).puxar({ atos: ["ato2"] });
	const ator = mundo.game.actors.find((a) => a.getFlag("world", "fdt"));
	const nome = ator.name;
	novaVersao(mundo, ator, (s) => (s.name = "Outro nome"));
	mundo.chamarHook("ready");
	await mundo.aguardarOcioso();
	assert.equal(mundo.dialogos.length, 0);
	assert.ok(mundo.chat.some((c) => /melhorias no compêndio/.test(c.content ?? "")), "faltou o aviso");
	assert.equal(mundo.game.actors.get(ator.id).name, nome);
	limparRegistros(mundo);
	mundo.chamarHook("ready");
	await mundo.aguardarOcioso();
	assert.equal(mundo.chat.length, 0, "avisou de novo na mesma versão");
	mundo.encerrar();
});

test("limpar do mundo: apaga o que não foi editado, guarda cópia e mantém editados, atores, Lei & Ordem e grupo", async () => {
	const mundo = await criarMundo({ semente: "fdt-limpar" });
	await carregarModulo(mundo);
	await api(mundo).puxar({ atos: ["ato2", "campanha"] });
	const atores = mundo.game.actors.size;
	const grupo = papel(mundo, "journal", "grupo");
	await grupo.setFlag("world", "fdtGrupo", { membros: ["abc"], pm: 7 });
	const diario = mundo.game.journal.find((j) => j.getFlag("world", "fdt") && j.id !== grupo.id);
	await diario.update({ name: "Diário corrigido" });
	// item de fora do módulo e item numa ficha: nunca entram
	const meu = await globalThis.Item.create({ name: "Item meu", type: "tesouro" });
	const pj = await mundo.criarPJ("Rak", { nivel: 3 });
	const poder = mundo.game.items.find((i) => i.getFlag("world", "fdt") && i.type === "poder");
	await pj.createEmbeddedDocuments("Item", [poder.toObject()]);

	limparRegistros(mundo);
	mundo.politica = politicaRoteiro([{ botao: "limpar" }]);
	const r = await api(mundo).abrirLimpar();
	assert.deepEqual(problemas(mundo, { avisos: true }), []);
	assert.ok(r.apagados > 50, `apagou ${r.apagados}`);
	assert.ok(mundo.game.items.get(meu.id), "apagou um item que não é do módulo");
	assert.equal(pj.items.filter((i) => i.name === poder.name).length, 1, "mexeu na ficha do PJ");
	assert.equal(mundo.game.actors.size, atores + 1, "atores só saem se marcar");
	assert.equal(mundo.game.journal.contents.map((j) => j.name).sort().join("|"), [diario.name, grupo.name].sort().join("|"), "devia sobrar só o editado e o grupo");
	assert.equal(mundo.game.items.filter((i) => i.getFlag("world", "fdt")).length, 0);
	assert.equal(mundo.game.tables.size, 0);
	assert.equal(mundo.game.macros.filter((m) => m.getFlag("world", "fdt")).length, 0);
	// cópia num compêndio do mundo
	const copias = mundo.game.packs.filter((p) => p.metadata.packageType === "world");
	assert.ok(copias.length >= 3, "faltou a cópia");
	const total = copias.reduce((n, p) => n + p.index.size, 0);
	assert.equal(total, r.apagados, "a cópia devia ter tudo o que foi apagado");
	// pastas vazias do módulo saíram; as dos atores ficaram
	assert.equal(mundo.game.folders.filter((f) => f.type === "RollTable").length, 0, "sobrou pasta vazia");
	assert.ok(mundo.game.folders.some((f) => f.type === "Actor"), "apagou pasta de atores");

	// puxar de novo traz o que saiu
	const p = await api(mundo).puxar({ atos: ["ato2"] });
	assert.ok(p.criados > 0);
	assert.ok(mundo.game.tables.size > 0);
	mundo.encerrar();
});

test("limpar com tudo marcado apaga também atores e editados; cancelar não apaga nada", async () => {
	const mundo = await criarMundo({ semente: "fdt-limpar-tudo" });
	await carregarModulo(mundo);
	await api(mundo).puxar({ atos: ["ato1"] });
	const antes = doModulo(mundo);
	mundo.politica = politicaRoteiro([{ botao: "cancelar" }]);
	assert.equal(await api(mundo).abrirLimpar(), null);
	assert.equal(doModulo(mundo), antes);
	await mundo.game.actors.find((a) => a.getFlag("world", "fdt")).update({ name: "Editado" });
	const r = await api(mundo).limpar({ tipos: ["Actor", "Item", "JournalEntry", "RollTable", "Macro"], incluirEditados: true, copia: false });
	assert.equal(r.apagados, antes);
	assert.equal(doModulo(mundo), 0);
	assert.equal(mundo.game.folders.size, 0, "sobrou pasta do módulo");
	mundo.encerrar();
});
