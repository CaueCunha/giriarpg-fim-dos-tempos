/**
 * Pastas da aba de Compêndios (scripts/pastas.mjs): o Foundry nem sempre cria as pastas do packFolders (The Forge,
 * mundo onde o módulo já estava), então o Mestre as cria ao abrir o mundo e põe os compêndios nelas, uma vez.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { criarMundo, carregarModulo, manifesto, MODULO } from "./ajudantes.mjs";

const m = manifesto();
const RAIZ_NOME = "Giria T20 - Fim dos Tempos (Campanha)";
const config = (mundo) => mundo.game.settings.get("core", "compendiumConfiguration");
const pastaDe = (mundo, nome) => mundo.game.folders.get(config(mundo)[`${MODULO}.${nome}`]?.folder);
const caminho = (f) => {
	const out = [];
	for (let p = f; p; p = p.folder) out.unshift(p.name);
	return out;
};

test("ao abrir o mundo, todos os compêndios vão para a pasta do módulo, por ato e aventura", async () => {
	const mundo = await criarMundo({ semente: "pastas" });
	try {
		await carregarModulo(mundo, { ready: true });
		const pastas = mundo.game.folders.filter((f) => f.type === "Compendium");
		const raizes = pastas.filter((f) => !f.folder);
		assert.deepEqual(raizes.map((f) => f.name), [RAIZ_NOME]);
		for (const ato of m.packFolders[0].folders) {
			for (const av of ato.folders) {
				for (const nome of av.packs) {
					const f = pastaDe(mundo, nome);
					assert.ok(f, `${nome}: sem pasta`);
					assert.deepEqual(caminho(f), [RAIZ_NOME, ato.name, av.name], nome);
				}
			}
		}
		assert.equal(mundo.game.settings.get(MODULO, "compendiosOrganizados").length, m.packs.length);

		// abrir de novo não cria pastas repetidas
		const n = pastas.length;
		const r = await mundo.game.modules.get(MODULO).api.organizarCompendios();
		assert.deepEqual(r, { pastas: 0, compendios: 0 });
		assert.equal(mundo.game.folders.filter((f) => f.type === "Compendium").length, n);

		// compêndio que o Mestre tirou da pasta fica onde ele deixou
		const tirado = m.packs[0].name;
		await mundo.game.settings.set("core", "compendiumConfiguration", { ...config(mundo), [`${MODULO}.${tirado}`]: { folder: null } });
		await mundo.game.modules.get(MODULO).api.organizarCompendios();
		assert.equal(pastaDe(mundo, tirado), undefined);

		// ...e volta com { todos: true }
		await mundo.game.modules.get(MODULO).api.organizarCompendios({ todos: true });
		assert.ok(pastaDe(mundo, tirado));
		assert.equal(mundo.game.folders.filter((f) => f.type === "Compendium").length, n);
	} finally {
		mundo.encerrar();
	}
});

test("compêndio novo de uma versão futura entra na pasta; pastas já criadas pelo Foundry são reaproveitadas", async () => {
	const mundo = await criarMundo({ semente: "pastas-2" });
	try {
		// O Foundry já criou a raiz (sem a marca do módulo)
		const raiz = await mundo.game.folders.documentClass.create({ name: RAIZ_NOME, type: "Compendium" });
		await carregarModulo(mundo, { ready: false });
		const novo = m.packs.at(-1).name;
		await mundo.game.settings.set(MODULO, "compendiosOrganizados", m.packs.map((p) => p.name).filter((n) => n !== novo));
		await mundo.game.modules.get(MODULO).api.organizarCompendios();
		const f = pastaDe(mundo, novo);
		assert.ok(f, "o compêndio novo ficou sem pasta");
		assert.equal(caminho(f)[0], RAIZ_NOME);
		assert.equal(mundo.game.folders.filter((x) => x.type === "Compendium" && !x.folder).length, 1, "raiz repetida");
		assert.equal(f.folder.folder.id, raiz.id);
		// os outros não foram mexidos
		assert.equal(Object.keys(config(mundo)).length, 1);
	} finally {
		mundo.encerrar();
	}
});

test("macro dos outros módulos: compêndios soltos vão para uma pasta com o nome de cada módulo", async () => {
	const mundo = await criarMundo({ semente: "pastas-3" });
	try {
		mundo.registrarModulo("aventura-x", { title: "Aventura - X" });
		mundo.registrarModulo("arm", { title: "Giria T20 - Armadilhas", packFolders: [{ name: "Armadilhas", packs: ["a"] }] });
		const pack = (mod, nome, label) => mundo.adicionarPack({ id: `${mod}.${nome}`, name: nome, label, type: "Item", packageName: mod, packageType: "module" }, [], []);
		pack("aventura-x", "itens", "Itens");
		pack("aventura-x", "ameacas", "Ameaças");
		pack("arm", "a", "Armadilhas A");
		pack("arm", "b", "Armadilhas B");
		const ja = pack("aventura-x", "mapas", "Mapas");
		await carregarModulo(mundo, { ready: true });
		const minha = await mundo.game.folders.documentClass.create({ name: "Minha pasta", type: "Compendium" });
		await mundo.game.settings.set("core", "compendiumConfiguration", { ...config(mundo), [ja.collection]: { folder: minha.id } });
		const api = mundo.game.modules.get(MODULO).api;
		const r = await api.organizarOutrosModulos();
		assert.equal(r.compendios, 4);
		const em = (id) => caminho(mundo.game.folders.get(config(mundo)[id]?.folder));
		assert.deepEqual(em("aventura-x.itens"), ["Aventura - X"]);
		assert.deepEqual(em("aventura-x.ameacas"), ["Aventura - X"]);
		assert.deepEqual(em("arm.a"), ["Armadilhas"]);
		assert.deepEqual(em("arm.b"), ["Giria T20 - Armadilhas"]);
		assert.deepEqual(em("aventura-x.mapas"), ["Minha pasta"], "o que já tinha pasta ficou onde estava");
		// os do Fim dos Tempos continuam na pasta dele
		assert.equal(em(`${MODULO}.${m.packs[0].name}`)[0], RAIZ_NOME);
		// rodar de novo não faz nada
		const n = mundo.game.folders.size;
		assert.equal((await api.organizarOutrosModulos()).compendios, 0);
		assert.equal(mundo.game.folders.size, n);
	} finally {
		mundo.encerrar();
	}
});
