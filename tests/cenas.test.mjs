/**
 * Macro "Av3 · Montar cenas dos mapas": cria as cenas com as imagens do módulo, grid de 1,5 m, paredes,
 * portas, luzes e notas, tudo dentro dos limites da cena. Rodar de novo não duplica as cenas.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { criarMundo, carregarModulo, problemas, MODULO } from "./ajudantes.mjs";
import { politicaPadrao, politicaRoteiro } from "../tools/sim/dialogos.mjs";

const mundo = await criarMundo({ semente: "cenas" });
await carregarModulo(mundo);
await mundo.game.modules.get(MODULO).api.puxar({ atos: ["ato1"] });
const macro = mundo.game.macros.find((m) => m.name === "Av3 · Montar cenas dos mapas");
const cenas = () => mundo.game.scenes.filter((s) => s.getFlag("world", "fdtCena"));

test("a macro existe", () => assert.ok(macro));

test("cria as quatro cenas da Av3 com imagem, grid, paredes, luzes e notas", async () => {
	mundo.politica = politicaPadrao;
	await macro.execute();
	assert.deepEqual(problemas(mundo, { avisos: true }), []);
	const lista = cenas();
	assert.deepEqual(lista.map((s) => s.getFlag("world", "fdtCena")).sort(), ["carvalho", "chifre", "salao", "subsolo"]);
	for (const s of lista) {
		const d = s._source;
		const src = d.background?.src;
		assert.ok(src?.startsWith(`modules/${MODULO}/`), `${d.name}: sem imagem`);
		assert.ok(fs.existsSync(src.slice(`modules/${MODULO}/`.length)), `${d.name}: ${src} não existe`);
		assert.equal(d.grid.size, 100);
		assert.equal(d.grid.distance, 1.5);
		assert.ok(d.walls.length >= 5, `${d.name}: poucas paredes`);
		const dentro = (x, y) => x >= 0 && y >= 0 && x <= d.width && y <= d.height;
		for (const w of d.walls) {
			assert.equal(w.c.length, 4);
			assert.ok(dentro(w.c[0], w.c[1]) && dentro(w.c[2], w.c[3]), `${d.name}: parede fora da cena ${w.c}`);
		}
		const luzes = s.lights?.contents?.map((l) => l._source) ?? d.lights;
		assert.ok(s.getFlag("world", "fdtCena") === "carvalho" || luzes.length, `${d.name}: sem luzes`);
		for (const l of luzes) assert.ok(dentro(l.x, l.y), `${d.name}: luz fora da cena`);
		for (const n of d.notes) assert.ok(dentro(n.x, n.y) && n.text, `${d.name}: nota fora da cena ou sem texto`);
	}
	const subsolo = lista.find((s) => s.getFlag("world", "fdtCena") === "subsolo")._source;
	assert.equal(subsolo.walls.filter((w) => w.door === 1 && w.ds === 2).length, 2, "as duas grades das celas começam trancadas");
});

test("rodar de novo não duplica as cenas, recriando ou não", async () => {
	for (const botao of ["yes", "no"]) {
		mundo.politica = politicaRoteiro([{ botao }]);
		await macro.execute();
		assert.equal(cenas().length, 4, `depois de responder ${botao}`);
	}
});
