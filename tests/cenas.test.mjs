/**
 * Macros "Av3 · Montar cenas dos mapas" e "Av4 · Montar cenas dos mapas": criam as cenas com as imagens do
 * módulo, grid de 1,5 m, paredes, portas, luzes e notas, tudo dentro dos limites da cena. Rodar de novo não
 * duplica as cenas, e a macro de uma aventura não mexe nas cenas da outra.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { criarMundo, carregarModulo, problemas, MODULO } from "./ajudantes.mjs";
import { politicaPadrao, politicaRoteiro } from "../tools/sim/dialogos.mjs";

const mundo = await criarMundo({ semente: "cenas" });
await carregarModulo(mundo);
await mundo.game.modules.get(MODULO).api.puxar({ atos: ["ato1"] });
const todas = () => mundo.game.scenes.filter((s) => s.getFlag("world", "fdtCena"));

const AVENTURAS = [
	{ av: "Av3", ids: ["carvalho", "chifre", "salao", "subsolo"], semLuz: ["carvalho"] },
	{ av: "Av4", ids: ["av4-casarao", "av4-conves", "av4-fazenda", "av4-leme", "av4-plantacao"], semLuz: ["av4-fazenda", "av4-plantacao"] }
];

for (const { av, ids, semLuz } of AVENTURAS) {
	const macro = mundo.game.macros.find((m) => m.name === `${av} · Montar cenas dos mapas`);
	const cenas = () => todas().filter((s) => ids.includes(s.getFlag("world", "fdtCena")));

	test(`${av}: a macro existe`, () => assert.ok(macro));

	test(`${av}: cria as cenas com imagem, grid, paredes, luzes e notas`, async () => {
		mundo.politica = politicaPadrao;
		await macro.execute();
		assert.deepEqual(problemas(mundo, { avisos: true }), []);
		const lista = cenas();
		assert.deepEqual(lista.map((s) => s.getFlag("world", "fdtCena")).sort(), ids);
		for (const s of lista) {
			const d = s._source;
			const id = s.getFlag("world", "fdtCena");
			const src = d.background?.src;
			assert.ok(src?.startsWith(`modules/${MODULO}/`), `${d.name}: sem imagem`);
			assert.ok(fs.existsSync(src.slice(`modules/${MODULO}/`.length)), `${d.name}: ${src} não existe`);
			assert.equal(d.grid.size, 100);
			assert.equal(d.grid.distance, 1.5);
			assert.ok(d.walls.length >= 5, `${d.name}: poucas paredes`);
			// Coordenadas do canvas: a imagem começa depois da margem, que o Foundry arredonda para quadrados inteiros.
			const dx = Math.ceil((d.padding * d.width) / 100) * 100;
			const dy = Math.ceil((d.padding * d.height) / 100) * 100;
			const dentro = (x, y) => x >= dx && y >= dy && x <= dx + d.width && y <= dy + d.height;
			for (const w of d.walls) {
				assert.equal(w.c.length, 4);
				assert.ok(dentro(w.c[0], w.c[1]) && dentro(w.c[2], w.c[3]), `${d.name}: parede fora da cena ${w.c}`);
			}
			const luzes = s.lights?.contents?.map((l) => l._source) ?? d.lights;
			assert.ok(semLuz.includes(id) || luzes.length, `${d.name}: sem luzes`);
			for (const l of luzes) assert.ok(dentro(l.x, l.y), `${d.name}: luz fora da cena`);
			for (const n of d.notes) assert.ok(dentro(n.x, n.y) && n.text, `${d.name}: nota fora da cena ou sem texto`);
		}
		if (av === "Av3") {
			const subsolo = lista.find((s) => s.getFlag("world", "fdtCena") === "subsolo")._source;
			assert.equal(subsolo.walls.filter((w) => w.door === 1 && w.ds === 2).length, 2, "as duas grades das celas começam trancadas");
		}
	});

	test(`${av}: rodar de novo não duplica as cenas, recriando ou não`, async () => {
		const antes = todas().length;
		for (const botao of ["yes", "no"]) {
			mundo.politica = politicaRoteiro([{ botao }]);
			await macro.execute();
			assert.equal(cenas().length, ids.length, `depois de responder ${botao}`);
			assert.equal(todas().length, antes, `depois de responder ${botao}: mexeu nas cenas de outra aventura`);
		}
	});
}
