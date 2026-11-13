/**
 * Token padrão das ameaças (TOKEN_PADRAO em scripts/assinatura.mjs):
 *   - ameaça do módulo criada no mundo ganha o padrão no protótipo, e o token na cena também;
 *   - ao abrir o mundo, o Mestre corrige as ameaças e tokens que já estavam lá (a opção desliga);
 *   - o que não é do módulo fica como está, e a correção não faz o documento contar como editado.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { criarMundo, carregarModulo, MODULO } from "./ajudantes.mjs";
import { politicaPadrao } from "../tools/sim/dialogos.mjs";
import { TOKEN_PADRAO, correcaoToken, assinatura } from "../scripts/assinatura.mjs";

const ANTIGO = { name: "Bandido", displayName: 20, displayBars: 20, bar1: { attribute: "attributes.pv" }, texture: { src: "arte/bandido.webp" }, width: 2, height: 2, disposition: -1, actorLink: false };
const npc = (marca, proto = ANTIGO) => ({ name: "Bandido", type: "npc", prototypeToken: structuredClone(proto), flags: marca ? { world: { fdt: "teste" } } : {} });

const conferir = (t, msg) => {
	assert.deepEqual(correcaoToken(t), {}, `${msg}: fora do padrão`);
	assert.equal(t.flags.barbrawl.resourceBars.bar2.maxcolor, "#80B3FF");
	assert.equal(t.flags.barbrawl.resourceBars.bar2.position, "top-inner");
	assert.equal(t.flags.barbrawl.resourceBars.bar1.position, "bottom-inner");
};

test("ameaça do módulo criada no mundo e o token dela vêm com o padrão; o resto do token fica", async () => {
	const mundo = await criarMundo({ semente: "fdt-token", politica: politicaPadrao });
	await carregarModulo(mundo);
	const a = await mundo.classes.Actor.create(npc(true));
	const p = a._source.prototypeToken;
	conferir(p, "protótipo");
	assert.equal(p.texture.src, "arte/bandido.webp");
	assert.equal(p.width, 2);
	assert.equal(p.disposition, -1);
	assert.equal(p.actorLink, false);
	const t = await mundo.colocarToken(a, { displayName: 0, flags: { barbrawl: { resourceBars: { bar2: { mincolor: "#FF0000", maxcolor: "#80FF00" } } } } });
	conferir(t.document._source, "token na cena");

	const outro = await mundo.classes.Actor.create(npc(false));
	assert.equal(outro._source.prototypeToken.displayName, 20, "ator de fora do módulo não muda");
	mundo.encerrar();
});

test("abrir o mundo corrige ameaças e tokens que já estavam lá, sem contar como edição; a opção desliga", async () => {
	for (const ligado of [true, false]) {
		const mundo = await criarMundo({ semente: `fdt-token-ready-${ligado}`, politica: politicaPadrao });
		// mundo de antes do módulo: sem os ganchos
		const a = await mundo.classes.Actor.create(npc(true));
		const t = await mundo.colocarToken(a);
		const antes = assinatura(a.toObject(), "Actor");
		await carregarModulo(mundo);
		if (!ligado) await mundo.game.settings.set(MODULO, "corrigirTokens", false);
		mundo.chamarHook("ready");
		await mundo.aguardarOcioso();
		const proto = mundo.game.actors.get(a.id)._source.prototypeToken;
		const tok = mundo.canvas.scene.tokens.get(t.id)._source;
		if (ligado) {
			conferir(proto, "protótipo corrigido");
			conferir(tok, "token corrigido");
			assert.equal(proto.texture.src, "arte/bandido.webp", "a arte fica");
			assert.equal(assinatura(mundo.game.actors.get(a.id).toObject(), "Actor"), antes, "não pode contar como editado");
		} else {
			assert.equal(proto.displayName, 20, "com a opção desligada nada muda");
			assert.equal(tok.displayName, 20);
		}
		mundo.encerrar();
	}
});

test("TOKEN_PADRAO é o pedido: nome ao passar o mouse, barras do dono, visão, PV e PM", () => {
	assert.equal(TOKEN_PADRAO.displayName, 30);
	assert.equal(TOKEN_PADRAO.displayBars, 40);
	assert.equal(TOKEN_PADRAO.sight.enabled, true);
	assert.equal(TOKEN_PADRAO.bar1.attribute, "attributes.pv");
	assert.equal(TOKEN_PADRAO.bar2.attribute, "attributes.pm");
});
