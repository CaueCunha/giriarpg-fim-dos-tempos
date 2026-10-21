/* =====================================================================
 * FIM DOS TEMPOS · ARCO 1 · AV2 · GULOSEIMAS DO PALCO (ATO 4, GRONKO)
 * Gerador de itens para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria a pasta de itens "FdT · Arco 1 · Guloseimas do Gronko" com quatro consumíveis:
 *      Bolo do Picadeiro, Canapé Açucarado, Valkaria de Marzipã e Gorad em Barra.
 *   3. Arraste para a ficha de quem morder. Para usar: ação padrão e Vontade CD 15; se falhar,
 *      perde a ação e a guloseima. Mire (target) quem recebe antes de clicar no botão do card.
 *   4. Rodar de novo apaga (depois de confirmar) e recria só itens com flags.world.fdt = "a1guloseimas".
 *
 * Não foi testado num Foundry rodando.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "a1guloseimas";
	const FLAGS = () => ({ world: { fdt: TAG } });
	const T20I = "systems/tormenta20/icons";
	const NOME_PASTA = "FdT · Arco 1 · Guloseimas do Gronko";

	const antigos = game.items.filter((i) => i.getFlag("world", "fdt") === TAG);
	const pastasAntigas = game.folders.filter((f) => f.getFlag?.("world", "fdt") === TAG);
	if (antigos.length || pastasAntigas.length) {
		const ok = await foundry.applications.api.DialogV2.confirm({
			window: { title: "Guloseimas do Gronko: recriar" },
			content: `<p>Já existem <b>${antigos.length}</b> guloseimas geradas antes. Elas serão <b>apagadas e recriadas</b> (cópias já arrastadas para fichas continuam lá).</p><p>Continuar?</p>`
		});
		if (!ok) return;
		if (antigos.length) await Item.deleteDocuments(antigos.map((i) => i.id));
		if (pastasAntigas.length) await Folder.deleteDocuments(pastasAntigas.map((f) => f.id));
	}
	const pasta = await Folder.create({ name: NOME_PASTA, type: "Item", color: "#8a4a6a", flags: FLAGS() });

	const p = (...linhas) => linhas.map((l) => `<p>${l}</p>`).join("");
	const fx = (name, img, changes = [], description = "") => ({
		name, img, type: "base", transfer: false, disabled: false, duration: {}, description, statuses: [], flags: FLAGS(),
		system: { changes: changes.map(([key, value]) => ({ key, value, type: "add", phase: "initial", priority: null })), onuse: false }
	});
	const rolagem = (name, parts, i = 0) => ({ name, key: `dano${i}`, type: "dano", parts: parts.map(([f, t]) => [f, t ?? "", ""]), versatil: "", adaptavel: "" });
	const REGRA = "<b>Ilusão ou realidade? (Varia)</b> Gaste uma <b>ação padrão</b> para morder e faça <b>Vontade CD 15</b>. Se passar, recebe o benefício; se falhar, gastou a ação e a guloseima em vão. Só existe uma dose.";
	const guloseima = (nome, img, desc, o = {}) => ({
		name: nome,
		type: "consumivel",
		img,
		folder: pasta.id,
		flags: FLAGS(),
		effects: o.effects ?? [],
		system: {
			description: { value: p(desc, REGRA) },
			tipo: "food",
			qtd: 1,
			preco: 0,
			peso: 0,
			espacos: 0,
			ativacao: { execucao: "action", custo: 0, qtd: "", condicao: "", special: "" },
			duracao: { value: 0, units: o.durU ?? "inst", special: "" },
			resistencia: { pericia: "", atributo: "", bonus: 0, txt: "Vontade CD 15 para aproveitar" },
			rolls: (o.rolls ?? []).map((r, i) => rolagem(r[0], r[1], i))
		}
	});

	const bolo = "icons/consumables/food/soup-broth-bowl-wooden-yellow.webp";
	await Item.createDocuments([
		guloseima("Bolo do Picadeiro (ilusão)", bolo,
			"Um pequeno bolinho com uma reprodução em finos detalhes do palco, incluindo Gronko e os personagens. <b>Cada personagem recupera 1d8+1 PV.</b> Role uma vez por personagem: mire cada um e use <b>Aplicar Cura</b>.",
			{ rolls: [["Cura", [["1d8+1", "curapv"]]]] }),
		guloseima("Canapé Açucarado (ilusão)", bolo,
			"Bolachinhas doces com uma rodela de berinjela e um pedacinho de caramelo por cima. <b>Até o final da cena, pode rolar novamente um teste qualquer recém-realizado.</b>",
			{ durU: "scene", effects: [fx("Canapé Açucarado (rolar de novo 1 teste)", bolo, [], "Uma vez até o fim da cena, role de novo um teste qualquer recém-realizado. Apague o efeito depois de usar.")] }),
		guloseima("Valkaria de Marzipã (ilusão)", bolo,
			"Uma pequena reprodução da estátua de Valkaria feita em marzipã. A estátua sorri convidativamente. <b>+2 em testes de ataque e rolagens de dano até o final da cena.</b>",
			{ durU: "scene", effects: [fx("Valkaria de Marzipã (+2 ataque e dano)", bolo, [["system.modificadores.ataque.geral", "2"], ["system.modificadores.dano.geral", "2"]], "+2 em testes de ataque e rolagens de dano até o fim da cena.")] }),
		guloseima("Gorad em Barra (realidade)", `${T20I}/itens/gerais/gorad.webp`,
			"Uma deliciosa barra de gorad, na qual alguém deu uma generosa mordida. <b>Recupera 1d4 PM.</b>",
			{ rolls: [["PM recuperados", [["1d4", "curapm"]]]] })
	]);

	ui.notifications.info(`Guloseimas criadas: 4 itens na pasta "${NOME_PASTA}".`);
})();
