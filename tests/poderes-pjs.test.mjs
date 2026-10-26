/**
 * PJs · Corrigir poderes (fdt-poderes-pjs.js): um PJ montado com os mesmos defeitos achados nas
 * fichas da campanha (out/2026) passa pela macro. Conferimos o que cada correção deixa na ficha,
 * que uma segunda passada não acha mais nada e que "Desfazer" devolve a ficha como era.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { criarMundo, carregarModulo, problemas, limparRegistros, MODULO } from "./ajudantes.mjs";
import { politicaRoteiro } from "../tools/sim/dialogos.mjs";

const mundo = await criarMundo({ semente: "poderes-pjs" });
await carregarModulo(mundo);
await mundo.game.modules.get(MODULO).api.importar(["campanha"], { modo: "substituir" });
await mundo.criarCena("Poderes");
const macro = (role) => mundo.game.macros.find((m) => m.getFlag("world", "fdtRole") === role);

const muda = (key, value, type = "add") => ({ key, value: String(value), type, phase: "initial", priority: null });
const ef = (name, changes, o = {}) => ({
	name,
	type: "base",
	transfer: o.transfer ?? true,
	disabled: o.disabled ?? false,
	flags: o.flags ?? {},
	description: o.description ?? "",
	system: { changes, onuse: !!o.onuse, abilityUse: { types: o.types ?? [], names: [], automatic: false, aumenta: false, custo: o.custo ?? null, description: "" } }
});
const poder = (name, effects = [], system = {}) => ({ name, type: "poder", effects, system: { description: { value: `<p>${name}</p>` }, ...system } });
const mordida = (name, dado) => poder(name, [], { rolls: [
	{ name: "Ataque", key: "ataque0", type: "ataque", parts: [["1d20", "", ""], ["luta", "", ""], ["", "", ""]], versatil: "", adaptavel: "" },
	{ name: "Dano", key: "dano1", type: "dano", parts: [[`${dado}+@for`, "perfuracao", ""]], versatil: "", adaptavel: "" }
] });
const antigo = (name, f) => ({ ...ef(name, [muda("roll", "@int")], { disabled: true }), flags: { tormenta20: { onuse: true, durationScene: false, items: "", aumenta: false, custo: "", ...f } } });

const pj = await mundo.criarPJ("Defeituoso", { nivel: 2 });
await pj.update({ "system.tracos.resistencias.luz.base": 10 });
await pj.createEmbeddedDocuments("Item", [
	poder("Resistência Elemental", [ef("Resistência Elemental", [muda("system.tracos.resistencias.???.value", 10)])]),
	mordida("Mordida (P.P)", "1d10"),
	mordida("Mordida (P.P+Fúria)", "2d6"),
	poder("Presas Primordiais", [ef("Presas Primordiais", [muda("passos", 2)], { onuse: true, disabled: true, types: ["attack"] })]),
	poder("Fúria", [], { duracao: { value: 10, units: "round", special: "" }, ativacao: { execucao: "", custo: 2, qtd: "", condicao: "", special: "" } }),
	poder("Fúria Bestial", [antigo("Fúria Bestial", { attack: true })]),
	poder("Engenhosidade", [antigo("Engenhosidade", { skill: true, custo: "2" })]),
	poder("Fraquezas Ofídicas"),
	poder("Ossos Frágeis"),
	poder("Adepto", [1, 2, 3].map(() => ef("Adepto", [], { onuse: true, disabled: true, types: ["spell"], custo: -1 })))
]);
await pj.createEmbeddedDocuments("ActiveEffect", [ef("Rak", [muda("passos", 2)], { onuse: true, disabled: true, types: ["attack"], transfer: false, description: "<p>Presas Primordiais</p>" })]);
const token = await mundo.colocarToken(pj);
const original = { itens: pj.items.map((i) => i.toObject()), efeitos: pj.effects.map((e) => e.toObject()) };

const efeitos = (nome) => pj.items.find((i) => i.name === nome)?.effects.contents ?? [];
const chaves = (nome) => efeitos(nome).flatMap((e) => e.system.changes.map((c) => `${c.key}:${c.type}:${c.value}`));

async function rodar(acao) {
	limparRegistros(mundo);
	mundo.canvas.tokens.releaseAll();
	token.control();
	let texto = "";
	mundo.politica = politicaRoteiro([(d) => {
		texto = d.form.textContent;
		d.form.querySelector("[name=acao]").value = acao;
		return "ok";
	}]);
	await macro("pjsCorrigir").execute();
	await mundo.aguardarOcioso();
	assert.deepEqual(problemas(mundo, { avisos: true }), []);
	return texto;
}

test("acha os defeitos e corrige", async () => {
	const lista = await rodar("corrigir");
	for (const nome of ["Resistência Elemental", "Mordida (P.P)", "Presas Primordiais", "Fúria:", "Fúria Bestial", "Engenhosidade", "Fraquezas Ofídicas", "Ossos Frágeis", "Adepto", 'Efeito no ator "Rak"']) {
		assert.ok(lista.includes(nome), `a lista não mostra ${nome}`);
	}
	assert.deepEqual(chaves("Resistência Elemental"), ["system.tracos.resistencias.luz.bonus:add:10"]);
	assert.equal(pj._source.system.tracos.resistencias.luz.base, 0, "a resistência digitada à mão passa para o efeito");

	const arma = pj.items.find((i) => i.type === "arma" && i.name === "Mordida");
	assert.ok(arma, "arma natural Mordida criada");
	assert.equal(arma.system.proficiencia, "natural");
	assert.deepEqual(arma.system.rolls[1].parts.map((p) => p[0]), ["1d6", "@for"]);
	assert.ok(!pj.items.some((i) => i.name === "Mordida (P.P+Fúria)"), "a cópia com Fúria embutida some");
	assert.deepEqual(pj.items.find((i) => i.type === "poder" && i.name === "Mordida").system.rolls, []);

	const [presas] = efeitos("Presas Primordiais");
	assert.equal(efeitos("Presas Primordiais").length, 1);
	assert.equal(presas.system.onuse, true);
	assert.equal(presas.transfer, false);
	assert.equal(presas.disabled, false, "vai para o card ao usar o poder");
	assert.equal(presas.duration.expiry, "sceneEnd");
	assert.deepEqual([...presas.system.abilityUse.names], ["Mordida"]);
	assert.deepEqual(chaves("Presas Primordiais"), ["passos:custom:2"]);

	const furia = pj.items.find((i) => i.name === "Fúria");
	assert.equal(furia.system.duracao.units, "special");
	const bestial = efeitos("Fúria").find((e) => e.name.startsWith("Fúria Bestial"));
	assert.ok(bestial, "Fúria Bestial vai para o card da Fúria");
	assert.deepEqual(bestial.system.changes.map((c) => `${c.key}:${c.type}:${c.value}`), ["passos:custom:2", "criticoX:add:1"]);
	assert.deepEqual(efeitos("Fúria Bestial"), []);

	const [eng] = efeitos("Engenhosidade");
	assert.equal(eng.system.onuse, true);
	assert.deepEqual([...eng.system.abilityUse.types], ["skill"]);
	assert.equal(eng.system.abilityUse.custo, 2);

	assert.deepEqual(chaves("Fraquezas Ofídicas"), ["system.tracos.resistencias.frio.danoPorDado:override:true", "roll:add:-5"]);
	assert.deepEqual(chaves("Ossos Frágeis"), ["system.tracos.resistencias.impacto.danoPorDado:override:true"]);
	assert.equal(efeitos("Adepto").filter((e) => e.system.onuse).length, 1);
	assert.ok(!pj.effects.some((e) => e.name === "Rak"), "a cópia à mão de Presas no ator some");
});

test("segunda passada não acha mais nada", async () => {
	const lista = await rodar("relatorio");
	assert.match(lista, /Nada para corrigir/);
	assert.match(mundo.chat.at(-1).content, /tudo certo/);
});

test("desfazer devolve a ficha como era", async () => {
	await rodar("desfazer");
	const nomes = (l) => l.map((x) => x.name).sort();
	assert.deepEqual(nomes(pj.items.contents), nomes(original.itens));
	assert.deepEqual(nomes(pj.effects.contents), nomes(original.efeitos));
	assert.equal(pj._source.system.tracos.resistencias.luz.base, 10);
	for (const o of original.itens) {
		const i = pj.items.get(o._id);
		assert.ok(i, `${o.name} voltou com o mesmo id`);
		assert.deepEqual(i.effects.map((e) => e.system.changes.map((c) => c.key)), o.effects.map((e) => e.system.changes.map((c) => c.key)), `efeitos de ${o.name}`);
	}
	assert.equal(pj.getFlag("world", "fdtPoderesBackup"), undefined);
	mundo.encerrar();
});
