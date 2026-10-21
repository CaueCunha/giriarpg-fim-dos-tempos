/* =====================================================================
 * FIM DOS TEMPOS · AVENTURA 2 · "EU FUI UM LEFOU ADOLESCENTE"
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Av2 · Lefou Adolescente" com:
 *      - Ameaças: Chupacabra da Tormenta (com Tylora), X'illirienn, Bhuluk, Enxame de Insetos,
 *        Gronko, Gaspar, Zardu, Cópia Ilusória de Zardu e o ator "Espetáculo" (palco e tendas).
 *      - Itens para os PJs: parceiros, Seringa de Vyrda, bênçãos das tendas, Sopa LeBlanc e tesouros.
 *      - Diário da aventura com guia do mestre e os handouts (rima, carta, página do diário).
 *      - Tabela "Redefinição de Caminhos".
 *      - Macros de mesa: Um de Nós!, Teste do Circo, Convencer Gaspar, Mil Faces, Enxames de Bhuluk
 *        e "Automação Av2 (liga/desliga)".
 *   3. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "av2".
 *
 * Nada aqui altera compêndios do sistema. Feito a partir do código do sistema (master, out/2026);
 * não foi testado num Foundry rodando. Veja o guia av2-lefou-adolescente.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "av2";
	const FLAGS = (role) => ({ world: role ? { fdt: TAG, fdtRole: role } : { fdt: TAG } });
	const T20I = "systems/tormenta20/icons";

	/* ------------------------------------------------------------------ */
	/* 0. Limpeza do que foi gerado antes                                   */
	/* ------------------------------------------------------------------ */
	const isOurs = (d) => d.getFlag?.("world", "fdt") === TAG;
	const colecoes = [game.actors, game.items, game.journal, game.tables, game.macros];
	const antigos = colecoes.flatMap((c) => c.filter(isOurs));
	if (antigos.length) {
		const ok = await foundry.applications.api.DialogV2.confirm({
			window: { title: "Aventura 2: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para a Aventura 2.</p>
				<p>Eles serão <b>apagados e recriados</b>. Tokens já colocados em cenas continuam lá, mas
				perdem o vínculo com os atores antigos.</p><p>Continuar?</p>`
		});
		if (!ok) return;
		for (const c of colecoes) {
			const ids = c.filter(isOurs).map((d) => d.id);
			if (ids.length) await c.documentClass.deleteDocuments(ids);
		}
		const pastas = game.folders.filter(isOurs).map((f) => f.id);
		if (pastas.length) await Folder.deleteDocuments(pastas);
	}

	/* ------------------------------------------------------------------ */
	/* 1. Construtores                                                      */
	/* ------------------------------------------------------------------ */
	const NOME_PASTA = "FdT · Av2 · Lefou Adolescente";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#7a1020", flags: FLAGS() })).id;
	}

	const p = (...linhas) => linhas.map((l) => `<p>${l}</p>`).join("");

	/** Efeito ativo. changes: [chave, valor, tipo?] */
	const fx = (name, img, changes = [], o = {}) => ({
		name,
		img: img ?? "icons/svg/aura.svg",
		type: "base",
		transfer: o.transfer ?? false,
		disabled: o.disabled ?? false,
		duration: o.duration ?? {},
		description: o.description ?? "",
		statuses: o.statuses ?? [],
		flags: o.flags ?? FLAGS(),
		system: {
			changes: changes.map(([key, value, type]) => ({ key, value, type: type ?? "add", phase: "initial", priority: null })),
			onuse: o.onuse ?? false,
			abilityUse: {
				types: o.types ?? [],
				names: o.names ?? [],
				automatic: false,
				aumenta: false,
				custo: o.custo ?? 0,
				description: ""
			}
		}
	});
	/** Botão de condição no card (o nome é resolvido para a condição do sistema). */
	const cond = (nome) => fx(nome, null);
	/** Bônus opcional marcado na janela de rolagem (aprimoramento "on use"). */
	const aoUsar = (name, img, changes, types, names = []) =>
		fx(name, img, changes, { onuse: true, disabled: true, transfer: true, types, names });

	const RESIST = ["Fortitude", "Reflexos", "Vontade"];

	/** Rolagem de dano/cura/perda. parts: [[fórmula, tipo]] */
	const rolagem = (name, parts, i = 0) => ({
		name,
		key: `dano${i}`,
		type: "dano",
		parts: parts.map(([f, t]) => [f, t ?? "", ""]),
		versatil: "",
		adaptavel: ""
	});

	/** Poder / habilidade de criatura. */
	const poder = (name, img, desc, o = {}) => ({
		name,
		type: "poder",
		img: img ?? "icons/svg/item-bag.svg",
		flags: FLAGS(o.role),
		effects: o.effects ?? [],
		system: {
			description: { value: desc },
			tipo: o.tipo ?? "ability",
			subtipo: o.subtipo ?? "",
			ativacao: { execucao: o.exec ?? "", custo: o.custo ?? 0, qtd: "", condicao: o.condicao ?? "", special: "" },
			alcance: o.alcance ?? "none",
			area: o.area ?? "",
			duracao: { value: o.durV ?? 0, units: o.durU ?? "inst", special: "" },
			resistencia: { pericia: "", atributo: "", bonus: 0, txt: o.save ?? "" },
			rolls: (o.rolls ?? []).map((r, i) => rolagem(r[0], r[1], i))
		}
	});

	/**
	 * Arma natural ou empunhada de NPC.
	 * O ataque usa a perícia Luta do NPC (que já tem o bônus do livro) + ajuste, para que
	 * condições como abalado e bônus globais de ataque contem automaticamente.
	 */
	const arma = (name, img, { ajuste = 0, dano, tipo, extra = [], critM = 20, critX = 2, desc = "", effects = [] }) => ({
		name,
		type: "arma",
		img,
		flags: FLAGS(),
		effects,
		system: {
			description: { value: desc },
			equipado: 1,
			qtd: 1,
			criticoM: critM,
			criticoX: critX,
			proficiencia: "natural",
			proposito: "corpo-a-corpo",
			empunhadura: "uma",
			rolls: [
				{ name: "Ataque", key: "ataque0", type: "ataque", parts: [["1d20", "", ""], ["luta", "for", ""], [String(ajuste), "", ""]], versatil: "", adaptavel: "" },
				{ name: "Dano", key: "dano1", type: "dano", parts: [[dano, tipo, ""], ["", "", ""], ...extra.map(([f, t]) => [f, t, ""])], versatil: "", adaptavel: "" }
			]
		}
	});

	const ATR_PERICIA = { luta: "for", atle: "for", pont: "des", inic: "des", refl: "des", furt: "des", acro: "des", fort: "con", perc: "sab", vont: "sab", intu: "sab", sobr: "sab", atua: "car", enga: "car", dipl: "car", inti: "car", mist: "int", ofi0: "int", conh: "int" };

	/**
	 * Cria um NPC. pericias: { chave: valor final do livro }.
	 * Fórmula do sistema (ND 2, sem treino): meio nível (1) + atributo + outros.
	 */
	async function criarNPC(d) {
		const nivel = Number(d.nd) || 1;
		const meio = Math.floor(nivel / 2);
		const atr = d.atr;
		const actorData = {
			name: d.name,
			type: "npc",
			img: d.img,
			folder: pasta.Actor,
			flags: FLAGS(d.role),
			prototypeToken: {
				name: d.tokenName ?? d.name,
				actorLink: d.link ?? true,
				disposition: d.disposition ?? -1,
				displayName: 20,
				displayBars: 20,
				bar1: { attribute: "attributes.pv" },
				width: d.tamanhoToken ?? 1,
				height: d.tamanhoToken ?? 1,
				texture: { src: d.token ?? d.img },
				sight: { enabled: true }
			},
			system: {
				atributos: Object.fromEntries(Object.entries(atr).map(([k, v]) => [k, { base: v, bonus: 0, racial: 0 }])),
				attributes: {
					nd: String(d.nd),
					cd: d.cd ?? 15,
					pv: { value: d.pv, max: d.pv, temp: 0 },
					pm: { value: 0, max: 0, temp: 0 },
					defesa: { base: d.def - (atr.des ?? 0), bonus: d.defBonus ?? [], outros: 0 },
					movement: { walk: { base: d.walk ?? 9, bonus: [] }, fly: { base: d.fly ?? 0, bonus: [] } },
					sentidos: { value: d.sentidos ?? [], custom: "" }
				},
				detalhes: {
					tipo: d.tipo,
					raca: d.raca ?? "",
					role: d.papel ?? "solo",
					tesouro: d.tesouro ?? "Nenhum.",
					resistencias: d.resTxt ?? "",
					ataquescac: d.ataquesTxt ?? "",
					equipamento: d.equipTxt ?? "",
					biography: { value: d.bio ?? "", public: "" }
				},
				tracos: {
					tamanho: d.tamanho ?? "med",
					ic: { value: d.ic ?? [], custom: d.icCustom ?? "" },
					idiomas: { value: ["comum"] }
				}
			},
			effects: d.effects ?? []
		};
		const actor = await Actor.create(actorData);

		// Perícias e recursos são coleções: atualiza campo a campo para não apagar as outras.
		const up = {};
		for (const [k, alvo] of Object.entries(d.pericias ?? {})) {
			const a = atr[ATR_PERICIA[k]] ?? 0;
			up[`system.pericias.${k}.treinado`] = false;
			up[`system.pericias.${k}.outros`] = alvo - meio - a;
		}
		for (const [k, label] of Object.entries(d.periciaLabels ?? {})) up[`system.pericias.${k}.label`] = label;
		for (const [k, r] of Object.entries(d.recursos ?? {})) {
			up[`system.resources.${k}.value`] = r.value;
			up[`system.resources.${k}.max`] = r.max;
			up[`system.resources.${k}.label`] = r.label;
		}
		for (const [tipo, r] of Object.entries(d.resist ?? {})) {
			for (const [campo, v] of Object.entries(r)) up[`system.tracos.resistencias.${tipo}.${campo}`] = v;
		}
		if (Object.keys(up).length) await actor.update(up);
		// statblockParsing evita que o sistema "limpe" a perícia do ataque das armas de NPC.
		if (d.items?.length) await actor.createEmbeddedDocuments("Item", d.items, { statblockParsing: true });
		return actor;
	}

	const IMUNE = { imunidade: true };

	/* ------------------------------------------------------------------ */
	/* 2. Ameaças                                                           */
	/* ------------------------------------------------------------------ */
	const atores = {};

	/* ---------- Ato 1: Chupacabra da Tormenta + Tylora ---------- */
	atores.chupacabra = await criarNPC({
		name: "Chupacabra da Tormenta",
		role: "chupacabra",
		img: `${T20I}/ameacas/lobo.png`,
		nd: 2,
		cd: 14,
		tipo: "mon",
		raca: "lefeu",
		atr: { for: 4, des: 3, con: 1, int: -4, sab: 1, car: -4 },
		pv: 56,
		def: 19,
		walk: 12,
		sentidos: ["escuro"],
		pericias: { inic: 7, perc: 9, fort: 6, refl: 12, vont: 5, luta: 12, furt: 7 },
		ic: ["cansaco", "metabolismo", "metamorfose", "veneno", "paralisado"],
		icCustom: "Acertos críticos; não pode ser flanqueado",
		resist: { acido: IMUNE, eletricidade: IMUNE, fogo: IMUNE, frio: IMUNE, luz: IMUNE, trevas: IMUNE },
		resTxt: "Imunidades de lefeu; não pode ser flanqueado.",
		ataquesTxt: "Mordida +12 (1d6+4) e cauda bipartida +12 (1d8+4 impacto).",
		recursos: { primary: { label: "Tylora (2 ok · 1 ferida · 0 caída)", value: 2, max: 2 } },
		bio: p(
			"<b>Ato 1 · Tylora, a Criança Domadora.</b> Uma menina com um coiote corrompido. O palco vira uma selva (cipós e folhagens para se esconder e escalar).",
			"Se o grupo já matou o Chupacabra na busca pelo circo, Tylora não luta e o espetáculo começa por X'illirienn.",
			"<b>Automação:</b> com a macro <i>Automação Av2</i> ligada, Tylora age no início de cada turno do Chupacabra, os 1d6 de dano são rolados sozinhos e Drenar Sangue é aplicado em quem estiver agarrado."
		),
		effects: [
			fx("Fúria do Chupacabra (Tylora caiu)", "icons/magic/control/fear-fright-monster-purple-blue.webp",
				[["system.modificadores.ataque.geral", "2"], ["system.modificadores.dano.geral", "2"]],
				{ disabled: true, flags: { world: { fdt: TAG, fdtFuria: true } }, description: "+2 em ataques e dano até o fim da cena." })
		],
		items: [
			arma("Mordida", "icons/creatures/abilities/mouth-teeth-long-red.webp", { dano: "1d6+4", tipo: "perfuracao",
				desc: p("Se acertar, pode fazer a manobra agarrar como ação livre (Agarrar Aprimorado, teste +12).") }),
			arma("Cauda Bipartida", "icons/creatures/abilities/tail-swipe-green.webp", { dano: "1d8+4", tipo: "impacto" }),
			poder("Agarrar Aprimorado", "icons/creatures/claws/claw-bear-paw-swipe-red.webp",
				p("<b>Livre.</b> Se o chupacabra acerta um ataque de mordida, pode fazer a manobra agarrar (teste +12, use Luta)."),
				{ exec: "free", effects: [cond("Agarrado")] }),
			poder("Drenar Sangue", "icons/magic/death/mouth-bite-fangs-vampire.webp",
				p("<b>Livre.</b> No início de cada turno do chupacabra, qualquer criatura que ele esteja agarrando perde 1d6 PV (efeito de metabolismo).",
					"O chupacabra ganha PV temporários iguais à perda causada.",
					"<i>Com a Automação Av2 ligada isso acontece sozinho em quem estiver com a condição agarrado. Sem ela, role aqui e use Aplicar Dano no alvo.</i>"),
				{ exec: "free", rolls: [["Perda de PV", [["1d6", "perda"]]]] }),
			poder("Insanidade da Tormenta", "icons/magic/control/fear-fright-monster-purple-blue.webp",
				p("Uma criatura que veja o lefeu faz um teste de Vontade. Se falhar, perde PM. Se chegar a 0 PM, fica confusa. Só afeta cada criatura uma vez por dia.",
					"<i>O livro dá só a CD 14. A perda de <b>1d4 PM</b> é uma estimativa para ND 2 (o lefeu mais fraco do Livro Básico causa 1d6).</i>",
					"No card, <b>Aplicar Dano</b> sobre a rolagem de PM tira os PM do alvo."),
				{ exec: "passive", save: "Vontade evita", rolls: [["Perda de PM", [["1d4", "curapm"]]]], effects: [cond("Confuso")] }),
			poder("Tylora: Chicote da Domadora", `${T20I}/itens/equipamentos/chicote.webp`,
				p("Enquanto Tylora ajuda o chupacabra, no início de cada turno dele um personagem em alcance curto sofre <b>1d6–1</b> em testes de perícia até o início do próximo turno do chupacabra (<b>1d4–1</b> se Tylora estiver ferida).",
					"<b>Ilusão ou realidade? (Realidade)</b> O chicote é uma serpente com presas venenosas: quem sofre a penalidade faz <b>Fortitude CD 15</b> ou perde 1 PM.",
					"<i>Com a Automação Av2 ligada, o alvo é o token que você estiver mirando (target) no início do turno do chupacabra.</i>"),
				{ exec: "free", alcance: "short",
					rolls: [["Penalidade (Tylora inteira)", [["1d6-1", ""]]], ["Penalidade (Tylora ferida)", [["1d4-1", ""]]], ["Perda de PM (Fort CD 15 evita)", [["1", "curapm"]]]] }),
			poder("Tylora: Ferida e Queda", "icons/svg/blood.svg",
				p("Sempre que o chupacabra sofrer dano, role 1d6. No primeiro 1, Tylora fica ferida (penalidade vira 1d4–1). No segundo 1, ela cai e o chupacabra fica furioso: <b>+2 em ataque e dano</b> até o fim da cena (efeito <i>Fúria do Chupacabra</i> na aba de efeitos).",
					"Acompanhe no recurso <i>Tylora</i> da ficha. A Automação Av2 faz isso sozinha."),
				{ exec: "passive", rolls: [["Teste de Tylora (1 = acerta Tylora)", [["1d6", ""]]]] })
		]
	});

	/* ---------- Ato 2: X'illirienn, a Engolidora de Fogo ---------- */
	atores.xillirienn = await criarNPC({
		name: "X'illirienn, a Engolidora de Fogo",
		tokenName: "X'illirienn",
		role: "xillirienn",
		img: `${T20I}/ameacas/placeholder.png`,
		nd: 2,
		cd: 18,
		tipo: "esp",
		raca: "elemental do fogo",
		atr: { for: 1, des: 5, con: 1, int: 0, sab: 2, car: 4 },
		pv: 55,
		def: 21,
		walk: 15,
		sentidos: ["escuro"],
		pericias: { inic: 13, perc: 7, fort: 6, refl: 12, vont: 7, luta: 12, atua: 9 },
		ic: ["atordoamento", "metabolismo", "movimento"],
		icCustom: "Acertos críticos",
		resist: { fogo: IMUNE, frio: { excecao: 5, vulnerabilidade: true } },
		resTxt: "Imune a críticos, atordoamento, fogo, metabolismo e movimento; RD 5/frio; vulnerável a frio.",
		ataquesTxt: "Língua de fogo +12 (1d6+5 corte mais 1d6 fogo).",
		bio: p(
			"<b>Ato 2.</b> Um elemental do fogo com roupas sedutoras; as ilusões fazem parecer uma mulher. O palco é tomado por chamas, sedas, tochas e fumaça.",
			"<b>Palco (Ilusão):</b> quem falhar por 5 ou mais em ataque, Atletismo, Acrobacia ou Reflexos encosta nas chamas e sofre 1d6 de fogo. Use o item <i>Ato 2 · Chamas do Palco</i> no ator Espetáculo."
		),
		items: [
			arma("Língua de Fogo", "icons/creatures/abilities/mouth-teeth-tongue-purple.webp", { dano: "1d6+5", tipo: "corte", extra: [["1d6", "fogo"]],
				desc: p("Se causar dano de fogo, use <b>Incendiar</b>. Se acertar, use <b>Pirotecnia</b>.") }),
			poder("Incendiar", "icons/magic/fire/flame-burning-embers-yellow.webp",
				p("Ao sofrer dano de fogo de X'illirienn, a vítima fica <b>em chamas</b> (Reflexos evita).",
					"O efeito do botão já rola 1d6 de fogo no início do turno da vítima. Para apagar: ação padrão (ou pular na água)."),
				{ exec: "free", save: "Reflexos evita", durU: "special",
					effects: [fx("Incendiado (em chamas)", "icons/magic/fire/flame-burning-embers-yellow.webp", [["danoContinuo", "1d6[fogo]", "custom"]], { statuses: ["emchamas"], description: "1d6 de fogo no início de cada turno. Ação padrão para apagar." })] }),
			poder("Pirotecnia", "icons/magic/light/explosion-beam-impact-silhouette.webp",
				p("<b>Livre.</b> Sempre que a língua de fogo acerta, fagulhas explodem: outras criaturas que vejam a vítima ficam <b>ofuscadas</b> por 1 rodada (Reflexos evita)."),
				{ exec: "free", save: "Reflexos evita", effects: [cond("Ofuscado")] })
		]
	});

	/* ---------- Ato 3: Bhuluk, o Anão com Barba de Insetos ---------- */
	atores.enxame = await criarNPC({
		name: "Enxame de Insetos Corrompidos",
		tokenName: "Enxame",
		role: "enxame",
		link: false,
		img: `${T20I}/ameacas/besouro-aberrante.png`,
		nd: "1/4",
		cd: 15,
		tipo: "mon",
		papel: "lackey",
		tamanho: "peq",
		atr: { for: 1, des: 2, con: 0, int: -5, sab: 0, car: -5 },
		pv: 1,
		def: 0,
		walk: 0,
		fly: 9,
		bio: p("Invocados por Bhuluk (1d4+1 por uso de <i>Enxame</i>). Não têm Defesa nem testes de resistência e falham automaticamente em testes opostos. Somem quando morrem ou no fim da cena.",
			"O livro diz \"Des 14\"; aqui foi usado Des 2. Como Defesa é 0, todo ataque acerta."),
		resTxt: "Sem Defesa; falha em todos os testes de resistência e opostos.",
		items: [
			poder("Envenenar", "icons/creatures/abilities/stinger-poison-green.webp",
				p("<b>Padrão (de Bhuluk).</b> Cada criatura adjacente a um enxame perde 1d4 PV por veneno."),
				{ exec: "action", rolls: [["Perda de PV (veneno)", [["1d4", "perda"]]]], effects: [] })
		]
	});

	atores.bhuluk = await criarNPC({
		name: "Bhuluk, o Anão com Barba de Insetos",
		tokenName: "Bhuluk",
		role: "bhuluk",
		img: `${T20I}/ameacas/placeholder.png`,
		nd: 2,
		cd: 15,
		tipo: "hum",
		raca: "anão",
		atr: { for: 2, des: 1, con: 5, int: 0, sab: 2, car: -1 },
		pv: 63,
		def: 16,
		defBonus: ["@resources.primary.value"],
		walk: 6,
		sentidos: ["escuro"],
		pericias: { inic: 4, perc: 5, fort: 9, refl: 3, vont: 4, luta: 10 },
		recursos: { primary: { label: "Insetos (bônus na Defesa)", value: 6, max: 6 } },
		ataquesTxt: "Picareta coberta de insetos +10 (1d6+2, x4 mais veneno).",
		equipTxt: "Picareta coberta de insetos.",
		bio: p(
			"<b>Ato 3.</b> Um anão guerreiro com um enxame de minúsculos lefeu. O palco vira colmeias e um zumbido forte.",
			"<b>Defesa 16 (22):</b> o recurso <i>Insetos</i> soma direto na Defesa. Com a Automação Av2 ligada, todo dano que ele sofre é reduzido à metade e o recurso cai 2 sozinho; sem ela, faça isso à mão.",
			"<b>Palco (Realidade):</b> na primeira rodada, todos fazem Vontade CD 15 contra insanidade da Tormenta ou perdem 1d4 PM. Use a macro <i>Teste do Circo</i> ou o item <i>Ato 3 · Zumbido das Colmeias</i>."
		),
		items: [
			arma("Picareta Coberta de Insetos", `${T20I}/itens/equipamentos/picareta.webp`, { dano: "1d6+2", tipo: "perfuracao", extra: [["1d4", "perda"]], critX: 4,
				desc: p("Inclui o veneno (perda de 1d4 PV) como segunda parte do dano. A perda ignora RD.") }),
			poder("Armadura de Insetos", "icons/commodities/claws/claw-insect-grey-purple.webp",
				p("Os insetos concedem <b>+6 na Defesa</b> (recurso <i>Insetos</i>). Quando Bhuluk sofre dano, o dano é reduzido à metade e o bônus cai 2. Com o bônus em 0, a habilidade para de funcionar."),
				{ exec: "passive" }),
			poder("Escudo de Insetos", "icons/creatures/abilities/stinger-poison-green.webp",
				p("<b>Reação.</b> Na primeira vez a cada turno em que uma criatura errar um ataque corpo a corpo contra Bhuluk, ela perde 1d4 PV por veneno."),
				{ exec: "reaction", rolls: [["Perda de PV (veneno)", [["1d4", "perda"]]]] }),
			poder("Enxame", `${T20I}/magias/enxame-rubro.webp`,
				p("<b>Movimento.</b> Invoca <b>1d4+1</b> enxames de insetos corrompidos em espaços livres em alcance curto (use a macro <i>Enxames de Bhuluk</i> com o token dele selecionado).",
					"Ação de movimento: os enxames voam 9m. Ação padrão: cada enxame envenena as criaturas adjacentes (perda de 1d4 PV cada)."),
				{ exec: "move", alcance: "short", rolls: [["Número de enxames", [["1d4+1", ""]]], ["Veneno dos enxames", [["1d4", "perda"]]]] })
		]
	});

	/* ---------- Ato 4: Gronko, o Faminto ---------- */
	atores.gronko = await criarNPC({
		name: "Gronko, o Faminto",
		tokenName: "Gronko",
		role: "gronko",
		img: `${T20I}/ameacas/ogro.png`,
		nd: 2,
		cd: 20,
		tipo: "hum",
		raca: "humano",
		tamanho: "gra",
		tamanhoToken: 2,
		atr: { for: 4, des: -1, con: 7, int: -1, sab: -1, car: -2 },
		pv: 70,
		def: 17,
		walk: 6,
		pericias: { inic: 0, perc: 0, fort: 15, refl: 0, vont: 3, luta: 14 },
		recursos: { primary: { label: "Regurgitar pronto (recarga: Engolir)", value: 1, max: 1 } },
		ataquesTxt: "Bocarra estomacal +14 (2d6+6 corte).",
		bio: p(
			"<b>Ato 4.</b> Um homem muito gordo com uma cabeça minúscula; o peito e a barriga se abrem numa bocarra. O palco se enche de doces e guloseimas.",
			"<b>Palco (Varia):</b> guloseimas no ator Espetáculo (item <i>Ato 4 · Guloseimas do Palco</i> e as seis guloseimas; ação padrão e Vontade CD 15 para aproveitar; uma dose de cada).",
			"Gronko: não, o nome dele não é Bocão!"
		),
		items: [
			arma("Bocarra Estomacal", "icons/creatures/abilities/mouth-teeth-long-red.webp", { dano: "2d6+6", tipo: "corte",
				desc: p("Se acertar, pode fazer a manobra agarrar como ação livre (teste +16: Luta +14 e +2 por ser Grande).") }),
			poder("Agarrar Aprimorado", "icons/creatures/claws/claw-bear-paw-swipe-red.webp",
				p("<b>Livre.</b> Se Gronko acerta a bocarra estomacal, pode fazer a manobra agarrar (teste +16)."),
				{ exec: "free", effects: [cond("Agarrado")] }),
			poder("Engolir", "icons/creatures/abilities/mouth-teeth-tongue-purple.webp",
				p("<b>Padrão.</b> Se Gronko começa o turno agarrando uma criatura Média ou menor, faz um teste de agarrar contra ela. Se vencer, a engole.",
					"Engolida, a criatura continua agarrada e sofre <b>1d4+6 de impacto mais 2d4 de ácido</b> no início de cada rodada (o efeito do botão rola isso sozinho).",
					"Para escapar: vencer um teste de agarrar ou causar 15 de dano ao estômago (Defesa 17). Ela é regurgitada e fica caída na frente de Gronko.",
					"Usar Engolir <b>recarrega</b> Regurgitar (recurso da ficha)."),
				{ exec: "action", durU: "special",
					rolls: [["Dano no estômago (impacto)", [["1d4+6", "impacto"]]], ["Dano no estômago (ácido)", [["2d4", "acido"]]]],
					effects: [fx("Engolido por Gronko", "icons/creatures/abilities/mouth-teeth-tongue-purple.webp",
						[["danoContinuo", "1d4+6[impacto]+2d4[acido]", "custom"]],
						{ statuses: ["agarrado"], description: "1d4+6 de impacto + 2d4 de ácido no início de cada rodada. Escapa com agarrar ou causando 15 de dano ao estômago (Defesa 17)." })] }),
			poder("Digestão Insana", "icons/consumables/food/pot-soup-white.webp",
				p("No início do turno de Gronko, se ele estiver engolindo alguém, cada personagem em alcance curto faz Vontade. Se falhar, passa mal e fica <b>pasmo</b> por um turno. Cada personagem só é afetado uma vez por cena."),
				{ exec: "free", alcance: "short", save: "Vontade evita", effects: [cond("Pasmo")] }),
			poder("Regurgitar", "icons/creatures/eyes/slime-single-red.webp",
				p("<b>Padrão.</b> Cone de 9m: <b>4d4 de ácido</b> e <b>enjoado</b> por uma rodada (Reflexos reduz à metade e evita enjoado).",
					"Recarga: usar Engolir. Zere o recurso da ficha ao usar."),
				{ exec: "action", alcance: "self", area: "Cone de 9m", save: "Reflexos reduz à metade e evita enjoado",
					rolls: [["Ácido", [["4d4", "acido"]]]], effects: [cond("Enjoado")] })
		]
	});

	/* ---------- Ato 5: Gaspar, o Homem Mais Forte do Mundo ---------- */
	atores.gaspar = await criarNPC({
		name: "Gaspar, o Homem Mais Forte do Mundo",
		tokenName: "Gaspar",
		role: "gaspar",
		img: `${T20I}/ameacas/maniaco-lefou.png`,
		nd: 2,
		cd: 18,
		tipo: "mon",
		raca: "lefou",
		atr: { for: 6, des: 1, con: 4, int: -1, sab: -1, car: -1 },
		pv: 64,
		def: 18,
		walk: 9,
		pericias: { inic: 4, perc: 0, fort: 8, refl: 2, vont: 1, luta: 16, atle: 19 },
		recursos: { primary: { label: "Convencido (3 vitórias = muda de lado)", value: 0, max: 3 } },
		ataquesTxt: "Marreta de madeira +16 (1d10+17).",
		equipTxt: "Marreta de madeira (tacape).",
		bio: p(
			"<b>Ato 5.</b> Apavorado e confuso, Gaspar ataca imediatamente. Zardu entra duas rodadas depois (ou quando Gaspar estiver quase vencido).",
			"<b>Palco (Realidade):</b> pesos de ferro tornam o chão terreno difícil; andar normal exige Acrobacia CD 15 (falha: 1d4 de impacto e para). Gaspar não é afetado.",
			"<b>Mudar de lado:</b> depois que Zardu aparece, o grupo vence 3 testes sociais opostos à Enganação de Zardu (macro <i>Convencer Gaspar</i>). Só vale com argumento que Gaspar entenda (mãe, irmãos, o Herói Louco). Ele nunca fica neutro: se convencido, ataca Zardu.",
			"<b>Depois da aventura:</b> se for devolvido à família e bem tratado, Mabel pode mandá-lo ajudar o grupo (item <i>Parceiro: Gaspar</i>)."
		),
		items: [
			arma("Marreta de Madeira (tacape)", `${T20I}/itens/equipamentos/tacape.webp`, { dano: "1d10+17", tipo: "impacto",
				desc: p("Se acertar, use <b>Golpe Avassalador</b>.") }),
			poder("Golpe Avassalador", "icons/magic/light/explosion-beam-impact-silhouette.webp",
				p("<b>Livre.</b> Quando acerta com o tacape, Gaspar arremessa a vítima 1d4 × 1,5m na direção que escolher. A vítima fica <b>caída</b> e, se bater em algum obstáculo, sofre 1d6 de impacto para cada 1,5m arremessado (Fortitude evita o arremesso)."),
				{ exec: "free", save: "Fortitude evita o arremesso",
					rolls: [["Distância (× 1,5m)", [["1d4", ""]]], ["Impacto por 1,5m (multiplique se bater)", [["1d6", "impacto"]]]],
					effects: [cond("Caído")] }),
			poder("Anatomia Insana", "icons/svg/blood.svg",
				p("Gaspar tem 25% de chance de ignorar o dano extra de um acerto crítico ou ataque furtivo. Role 1d4: no 1, o extra é ignorado."),
				{ exec: "passive", rolls: [["Anatomia Insana (1 = ignora o extra)", [["1d4", ""]]]] }),
			poder("Garotinho Assustado", "icons/magic/control/fear-fright-monster-purple-blue.webp",
				p("Gaspar sofre <b>–5</b> em testes de resistência contra efeitos de medo. Marque o aprimoramento na janela de rolagem quando for medo."),
				{ exec: "passive", effects: [aoUsar("Garotinho Assustado (medo)", "icons/magic/control/fear-fright-monster-purple-blue.webp", [["roll", -5]], ["skill"], RESIST)] })
		]
	});

	/* ---------- Final: Zardu, o Mestre do Picadeiro ---------- */
	const meuPalco = (nome, desc, o = {}) => poder(`Meu Palco: ${nome}`, o.img ?? `${T20I}/magias/criar-ilusao.webp`,
		p(`<b>Livre, uma vez por rodada (ilusão).</b> ${desc}`), { exec: "free", ...o });

	atores.zardu = await criarNPC({
		name: "Zardu, o Mestre do Picadeiro",
		tokenName: "Zardu",
		role: "zardu",
		img: `${T20I}/ameacas/necromante.png`,
		nd: 2,
		cd: 20,
		tipo: "hum",
		raca: "kliren",
		atr: { for: -1, des: 2, con: 3, int: 5, sab: -1, car: 2 },
		pv: 32,
		def: 18,
		walk: 9,
		pericias: { inic: 10, perc: 7, fort: 5, refl: 10, vont: 6, luta: 8, enga: 10, mist: 10, ofi0: 10 },
		periciaLabels: { ofi0: "Ofício (alquimista)" },
		resist: { impacto: { danoPorDado: true } },
		resTxt: "Ossos Frágeis: +1 de dano por dado de impacto.",
		ataquesTxt: "Adaga +8 (1d4–1, 19).",
		bio: p(
			"<b>Final.</b> Quando Zardu entra, o palco mostra um céu estrelado, a Tormenta, relógios girando e um \"estranho elmo\" (o escafandro de Syvarian): \"A missão é sagrada!\" e \"Você enlouqueceu! Não é mais um de nós...\".",
			"<b>Palco (Ilusão):</b> uma vez por rodada as Bombas Ilusórias não precisam de recarga. Quem adivinhar que é ilusão ganha +5 e pode usar Reflexos ou Vontade (macro <i>Teste do Circo</i>).",
			"Se for capturado e levado ao Forte, amanhece morto (obra de Vesper). Na casaca: página do diário. No peito: um relógio parado e quebrado."
		),
		items: [
			arma("Adaga", `${T20I}/itens/equipamentos/adaga.webp`, { dano: "1d4-1", tipo: "perfuracao", critM: 19 }),
			poder("Bombas Ilusórias", `${T20I}/itens/gerais/bomba.webp`,
				p("<b>Padrão.</b> Arremessa uma bomba numa criatura em alcance curto: <b>4d6 de impacto</b> (Reflexos reduz à metade).",
					"Ilusão: quem acertar que é ilusão ganha +5 e pode testar Reflexos ou Vontade."),
				{ exec: "action", alcance: "short", save: "Reflexos reduz à metade", rolls: [["Impacto", [["4d6", "impacto"]]]] }),
			poder("Engenhosidade", "icons/magic/control/mouth-smile-deception-purple.webp",
				p("<b>Livre, uma vez por rodada.</b> Soma a Inteligência (+5) num teste de perícia (não vale para ataque). Marque o aprimoramento na janela de rolagem."),
				{ exec: "free", effects: [aoUsar("Engenhosidade (+Int)", "icons/magic/control/mouth-smile-deception-purple.webp", [["roll", 5]], ["skill"])] }),
			meuPalco("Buraco", "O palco se abre sob uma criatura em alcance médio: <b>1d6 de impacto</b> e fica <b>caída</b> (Vontade evita o dano e a condição).",
				{ alcance: "medium", save: "Vontade evita", rolls: [["Impacto", [["1d6", "impacto"]]]], effects: [cond("Caído")] }),
			meuPalco("Fogos de Artifício", "Uma explosão de luz e cores ofusca <b>todas as criaturas</b> no palco por 1 rodada (sem teste).",
				{ img: `${T20I}/magias/explosao-caleidoscopica.webp`, effects: [cond("Ofuscado")] }),
			meuPalco("Fumaça", "Zardu fica envolto em brumas: <b>camuflagem total</b> (50% de chance de falha nos ataques contra ele) até o início do próximo turno dele.",
				{ img: `${T20I}/magias/nevoa.webp`, durV: 1, durU: "round",
					effects: [fx("Fumaça de Zardu (camuflagem total)", `${T20I}/magias/nevoa.webp`, [], { description: "Ataques contra Zardu têm 50% de chance de falha." })] }),
			meuPalco("Palhaço Sinistro", "Uma imagem de Ralphus (ilusória... ou não?) surge adjacente a uma criatura em alcance médio e a golpeia com um porrete: <b>2d6 de impacto</b> (Vontade evita).",
				{ img: `${T20I}/itens/equipamentos/clava.webp`, alcance: "medium", save: "Vontade evita", rolls: [["Impacto", [["2d6", "impacto"]]]] }),
			meuPalco("Mil Faces", "Zardu some e <b>quatro cópias</b> surgem pelo palco; os efeitos dele parecem sair de todas. Cópia que sofre dano desaparece; a última é o Zardu verdadeiro. <b>Uma vez por cena.</b> Use a macro <i>Mil Faces (Zardu)</i>.",
				{ img: `${T20I}/magias/duplicata-ilusoria.webp` }),
			poder("Ossos Frágeis", "icons/svg/bones.svg",
				p("Zardu sofre 1 ponto de dano adicional por dado de dano de impacto (já configurado na resistência a impacto da ficha)."),
				{ exec: "passive" })
		]
	});

	atores.copia = await criarNPC({
		name: "Cópia Ilusória de Zardu",
		tokenName: "Zardu",
		role: "zardu-copia",
		link: false,
		img: `${T20I}/ameacas/necromante.png`,
		nd: "1/4",
		cd: 20,
		tipo: "hum",
		papel: "lackey",
		atr: { for: -1, des: 2, con: 3, int: 5, sab: -1, car: 2 },
		pv: 1,
		def: 18,
		walk: 9,
		pericias: { refl: 10, fort: 5, vont: 6 },
		bio: p("Criada por <i>Meu Palco: Mil Faces</i>. Some ao sofrer qualquer dano. A última cópia é o Zardu verdadeiro (a macro Mil Faces faz a troca).")
	});

	/* ---------- Espetáculo: palco, tendas e guloseimas ---------- */
	const guloseima = (nome, img, desc, o = {}) => ({
		name: `Guloseima: ${nome}`,
		type: "consumivel",
		img,
		flags: FLAGS(),
		effects: o.effects ?? [],
		system: {
			description: { value: p(desc, "Gaste uma <b>ação padrão</b> para morder e faça <b>Vontade CD 15</b> (+5/–5 por Ilusão ou Realidade). Se falhar, a ação e a guloseima se perdem. Só há uma dose.") },
			tipo: "food",
			qtd: 1,
			ativacao: { execucao: "action", custo: 0, qtd: "", condicao: "", special: "" },
			duracao: { value: 0, units: o.durU ?? "inst", special: "" },
			resistencia: { pericia: "", atributo: "", bonus: 0, txt: "" },
			rolls: (o.rolls ?? []).map((r, i) => rolagem(r[0], r[1], i))
		}
	});

	atores.espetaculo = await criarNPC({
		name: "Espetáculo de Prodígios e Horrores (palco e tendas)",
		tokenName: "Espetáculo",
		role: "espetaculo",
		img: `${T20I}/magias/explosao-caleidoscopica.webp`,
		nd: 2,
		cd: 15,
		tipo: "esp",
		papel: "special",
		atr: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
		pv: 1,
		def: 10,
		bio: p(
			"<b>Ator de apoio, não vai para o mapa.</b> Abra esta ficha durante a aventura: cada item é um efeito do palco, de uma tenda ou uma guloseima, com rolagens e botões de efeito.",
			"Mire (target) o personagem afetado antes de clicar nos botões de dano, cura ou efeito do card."
		),
		items: [
			poder("Um de Nós!", `${T20I}/magias/sussurros-insanos.webp`,
				p("Na rodada em que Zardu apresenta cada atração, a plateia canta \"Um de nós!\". Todos que escutam fazem <b>Vontade CD 15</b>. Entre os que falharem, só o <b>menor resultado</b> se junta à atração na luta seguinte (o mestre controla o personagem).",
					"O jogador pode fazer \"ações mentais\": Vontade CD 15 impõe –2 nas ações do personagem dominado (–5 com uma boa ideia). Magias sem componentes verbais e gestuais: Vontade oposta contra si mesmo.",
					"Reduzido a 0 PV sob controle do circo: surge preso na plateia. A plateia bem entretida (Híbridos) pode anular este efeito em todos os combates.",
					"<b>Use a macro <i>Um de Nós!</i></b>"),
				{ exec: "passive", save: "Vontade evita", effects: [fx("Um de Nós! (aberração do circo)", `${T20I}/magias/sussurros-insanos.webp`, [], { description: "O personagem pertence à atração até o fim da luta. O mestre o controla." })] }),
			poder("Dominado: Ação Mental (–2)", `${T20I}/magias/sussurros-insanos.webp`,
				p("Quando o jogador passa em Vontade CD 15 contra o próprio personagem dominado, ele sofre –2 em todas as ações (–5 por uma boa ideia, ajuste o efeito)."),
				{ exec: "free", durV: 1, durU: "round",
					effects: [fx("Resistindo ao circo (–2)", `${T20I}/magias/sussurros-insanos.webp`, [["system.modificadores.pericias.geral", "-2"]])] }),
			poder("Correntes Rubras", "icons/svg/net.svg",
				p("Quem cair por PV negativos ou desacordado tem um turno para ser reanimado. Se na próxima iniciativa dos inimigos ainda estiver desacordado, correntes rubras o levam e ele reaparece <b>preso na plateia</b>, consciente e impotente. Ninguém morre assim.",
					"Sai quando o banco for quebrado (a plateia o defende) ou quando Zardu for vencido. Se for libertado, volta a sangrar."),
				{ exec: "passive" }),
			poder("Redefinição de Caminhos", "icons/svg/door-exit.svg",
				p("Quem tenta sair do cercado (atravessando a névoa rubra) ou ir aos bastidores rola na tabela <b>Redefinição de Caminhos</b> (macro do mesmo nome). Cada personagem rola uma vez, mesmo se saírem juntos."),
				{ exec: "passive", rolls: [["Redefinição (1-3 lado oposto · 4 tenda · 5 não sai · 6 plateia)", [["1d6", ""]]]] }),
			poder("Ato 2 · Chamas do Palco", "icons/magic/fire/flame-burning-embers-yellow.webp",
				p("<b>Ilusão.</b> Quem falhar por 5 ou mais num teste de ataque, Atletismo, Acrobacia ou Reflexos encosta nas chamas: <b>1d6 de fogo</b>.",
					"Golens e quem se cura com fogo mágico podem aceitar a cura, mas fazem Vontade CD 15: se falharem, perdem 1d4 PM (insanidade da Tormenta). Use <b>Aplicar Cura</b> no fogo para essas criaturas."),
				{ exec: "passive", save: "Vontade evita a perda de PM (só golens)", rolls: [["Fogo", [["1d6", "fogo"]]], ["Perda de PM (golem)", [["1d4", "curapm"]]]] }),
			poder("Ato 3 · Zumbido das Colmeias", "icons/creatures/abilities/stinger-poison-green.webp",
				p("<b>Realidade.</b> Na primeira rodada de combate, cada personagem faz Vontade CD 15 contra insanidade da Tormenta. Se falhar, perde <b>1d4 PM</b>. A macro <i>Teste do Circo</i> faz isso para todos de uma vez."),
				{ exec: "passive", save: "Vontade evita", rolls: [["Perda de PM", [["1d4", "curapm"]]]] }),
			poder("Ato 4 · Guloseimas do Palco", "icons/consumables/food/soup-broth-bowl-wooden-yellow.webp",
				p("<b>Varia.</b> O palco está repleto de guloseimas, algumas verdadeiras, outras ilusões. Qualquer personagem pode gastar uma <b>ação padrão</b> para morder uma e faz <b>Vontade CD 15</b>: se passar, recebe o benefício; se falhar, perde a ação e a guloseima. Há <b>uma dose</b> de cada.",
					"<b>Ilusão:</b> Bolo do Picadeiro (cada personagem recupera 1d8+1 PV), Canapé Açucarado (rolar de novo um teste recém-feito, até o fim da cena), Valkaria de Marzipã (+2 em ataque e dano até o fim da cena).",
					"<b>Realidade:</b> Gorad em Barra (1d4 PM), Merengue (2d8+2 PV), Olhinho do Amor (+5 na Defesa até o fim da cena).",
					"As seis estão nesta ficha como itens <i>Guloseima: ...</i>, com as rolagens e os efeitos."),
				{ exec: "action", save: "Vontade CD 15 para aproveitar" }),
			poder("Ato 5 · Pesos de Ferro", `${T20I}/itens/equipamentos/marreta.webp`,
				p("<b>Realidade.</b> O chão é terreno difícil. Para andar na velocidade normal: Acrobacia CD 15 (+5/–5 por Ilusão ou Realidade). Se falhar, sofre <b>1d4 de impacto</b> e para no meio do caminho. Gaspar não é afetado."),
				{ exec: "passive", rolls: [["Impacto", [["1d4", "impacto"]]]] }),
			poder("Tenda 5 · Tatuagens de Noirax", `${T20I}/itens/gerais/pergaminho.webp`,
				p("Inteligência CD 10 para interpretar as tatuagens (história de Zardu, o rapto de Gaspar, Mabel soltando Blanche). Quem passar recupera <b>1d4 PM</b>, uma vez por personagem. Use <b>Aplicar Cura</b>."),
				{ exec: "action", rolls: [["PM recuperados", [["1d4", "curapm"]]]] }),
			guloseima("Bolo do Picadeiro (ilusão)", "icons/consumables/food/soup-broth-bowl-wooden-yellow.webp",
				"Um bolinho com o palco, Gronko e os personagens em detalhes. Recupera <b>1d8+1 PV</b>.", { rolls: [["Cura", [["1d8+1", "curapv"]]]] }),
			guloseima("Canapé Açucarado (ilusão)", "icons/consumables/food/soup-broth-bowl-wooden-yellow.webp",
				"Bolachinha com berinjela e caramelo. Até o fim da cena, pode rolar de novo um teste recém-feito (uma vez).",
				{ durU: "scene", effects: [fx("Canapé Açucarado (rolar de novo 1 teste)", "icons/consumables/food/soup-broth-bowl-wooden-yellow.webp", [], { description: "Uma vez nesta cena, role de novo um teste recém-feito." })] }),
			guloseima("Valkaria de Marzipã (ilusão)", "icons/consumables/food/soup-broth-bowl-wooden-yellow.webp",
				"Uma pequena Valkaria sorridente. <b>+2 em ataque e dano</b> até o fim da cena.",
				{ durU: "scene", effects: [fx("Valkaria de Marzipã", "icons/consumables/food/soup-broth-bowl-wooden-yellow.webp", [["system.modificadores.ataque.geral", "2"], ["system.modificadores.dano.geral", "2"]])] }),
			guloseima("Gorad em Barra (realidade)", `${T20I}/itens/gerais/gorad.webp`,
				"Uma barra de gorad com uma mordida generosa. Recupera <b>1d4 PM</b>.", { rolls: [["PM", [["1d4", "curapm"]]]] }),
			guloseima("Merengue (realidade)", "icons/consumables/food/pot-soup-white.webp",
				"Coberto de confeitos (e de insetos comendo uma parte). Recupera <b>2d8+2 PV</b>.", { rolls: [["Cura", [["2d8+2", "curapv"]]]] }),
			guloseima("Olhinho do Amor (realidade)", "icons/creatures/eyes/slime-single-red.webp",
				"Um globo ocular num palito, coberto de caramelo vermelho. <b>+5 na Defesa</b> até o fim da cena.",
				{ durU: "scene", effects: [fx("Olhinho do Amor", "icons/creatures/eyes/slime-single-red.webp", [["system.attributes.defesa.bonus", "5"]])] })
		]
	});

	/* ------------------------------------------------------------------ */
	/* 3. Itens para os PJs (pasta de Itens)                                */
	/* ------------------------------------------------------------------ */
	const itemDoc = (d) => ({ ...d, folder: pasta.Item, flags: FLAGS() });
	const novosItens = [];

	async function deCompendio(packId, docId, nome, descExtra) {
		const pack = game.packs.get(packId);
		const doc = await pack?.getDocument(docId).catch(() => null);
		if (!doc) return null;
		const data = doc.toObject();
		delete data._id;
		data.name = nome;
		data.folder = pasta.Item;
		data.flags = foundry.utils.mergeObject(data.flags ?? {}, FLAGS());
		data.system.description.value = `${descExtra}<hr>${data.system.description.value ?? ""}`;
		return data;
	}

	const PARCEIROS = "tormenta20.parceiros";
	const ID = { fortao: "YAcnW6C7ok7xjdg6", atirador: "OvBibhyfED5HKbsz", combatente: "nNpGA5SWMj7rtUQR", ajudante: "ROdJSxDCkvamfzX7" };
	const parceiro = async (tipo, nome, desc) => {
		const data = await deCompendio(PARCEIROS, ID[tipo], nome, desc);
		return data ?? itemDoc(poder(nome, `${T20I}/itens/gerais/parceiros.webp`, desc, { tipo: "geral", subtipo: "Parceiros" }));
	};

	novosItens.push(
		await parceiro("fortao", "Parceiro: Vyrda (Fortão iniciante)",
			p("<b>Tenda 1.</b> Teste social CD 15 ou boa interpretação: Vyrda vira parceira <b>fortão iniciante</b> durante todos os combates do circo.")),
		await parceiro("atirador", "Parceiro: Híbridos Profanos (Atirador iniciante)",
			p("<b>Tenda 2.</b> Teste social CD 15 ou boa interpretação: os híbridos viram parceiro <b>atirador iniciante</b>.")),
		await parceiro("combatente", "Parceiro: Plateia Entretida (Combatente iniciante)",
			p("<b>Tenda 2.</b> A plateia bem entretida vira parceiro <b>combatente iniciante</b> por <b>um</b> combate, ou anula \"Um de Nós!\" em todos os combates (escolha do grupo).")),
		await parceiro("fortao", "Parceiro: Gaspar (Fortão veterano)",
			p("<b>Depois da aventura.</b> Se o grupo devolver Gaspar à família e for especialmente cuidadoso com ele, Mabel pode mandá-lo ajudar os heróis.")),
		await parceiro("ajudante", "Parceiro: Mabel LeBlanc (Ajudante veterana)",
			p("<b>Depois da aventura.</b> Grata por ter Gaspar de volta, Mabel vira aliada fervorosa e chega a lutar pelo grupo. Defina as três perícias do ajudante com a mesa."))
	);

	const seringa = await deCompendio("tormenta20.pocoes", "hjvqA8b5pxriWBRh", "Seringa de Vyrda (Poção de Físico Divino)",
		p("<b>Tenda 1.</b> Se o grupo for gentil com Vyrda e libertá-la, ela entrega esta seringa, que guardou da época dos experimentos."));
	if (seringa) novosItens.push(seringa);

	novosItens.push(
		itemDoc(poder("Bênção de Kerok (+5 contra a Tormenta)", `${T20I}/itens/gerais/orbe-cristalina.webp`,
			p("<b>Tenda 4.</b> Teste social CD 15 ou boa interpretação com Kerok (o gêmeo corrompido, que fala sempre a verdade).",
				"<b>+5 para resistir a todos os efeitos da Tormenta no circo.</b> Marque o aprimoramento na rolagem de resistência; as macros do circo já somam sozinhas.",
				"Apague o item quando o grupo sair do circo."),
			{ tipo: "geral", exec: "passive", effects: [aoUsar("Bênção de Kerok (+5 Tormenta)", `${T20I}/itens/gerais/orbe-cristalina.webp`, [["roll", 5]], ["skill"], RESIST)] })),
		itemDoc(poder("Segredo de Ralphus (+5 contra ilusões de Zardu)", `${T20I}/itens/gerais/diario.webp`,
			p("<b>Tenda 3, depois de vencer Gaspar.</b> Ralphus está escondido entre os jarros; qualquer teste social o convence a contar que tudo no circo é ilusão.",
				"<b>+5 para resistir às ilusões de Zardu.</b> Marque o aprimoramento na rolagem; as macros do circo já somam sozinhas."),
			{ tipo: "geral", exec: "passive", effects: [aoUsar("Segredo de Ralphus (+5 ilusões)", `${T20I}/itens/gerais/diario.webp`, [["roll", 5]], ["skill"], RESIST)] }))
	);

	// Sopa LeBlanc: +1 num atributo por um dia, e pesadelos (–2 contra a Tormenta).
	const ATR_NOME = { for: "Força", des: "Destreza", con: "Constituição", int: "Inteligência", sab: "Sabedoria", car: "Carisma" };
	const UM_DIA = { value: 86400, units: "seconds" };
	novosItens.push(itemDoc({
		name: "Sopa LeBlanc",
		type: "consumivel",
		img: `${T20I}/itens/gerais/panela.webp`,
		effects: [
			...Object.entries(ATR_NOME).map(([k, n]) => fx(`Sopa LeBlanc (+1 ${n})`, `${T20I}/itens/gerais/panela.webp`, [[`system.atributos.${k}.bonus`, 1]], { duration: UM_DIA })),
			fx("Pesadelos da Tormenta (Sopa LeBlanc)", "icons/magic/control/fear-fright-monster-purple-blue.webp", [], {
				duration: UM_DIA,
				description: "–2 para resistir a efeitos da Tormenta. As macros do circo descontam sozinhas; nas outras rolagens, lembre de tirar 2."
			})
		],
		system: {
			description: { value: p(
				"Antiga receita da família LeBlanc, feita com a água do poço. Revigorante, espessa e com ingredientes variados até demais.",
				"<b>+1 em um atributo à escolha por um dia</b> (clique em um dos seis botões de atributo do card).",
				"Mas o poço está contaminado pela Tormenta: quem toma tem pesadelos com a Tempestade Rubra e sofre <b>–2 para resistir a efeitos da Tormenta</b> (clique também em <i>Pesadelos</i>).",
				"Tomar a sopa <b>10 vezes</b> acaba com os pesadelos e concede um <b>poder da Tormenta</b> permanente (conta para a penalidade em Carisma)."
			) },
			tipo: "food",
			qtd: 1,
			ativacao: { execucao: "action", custo: 0, qtd: "", condicao: "", special: "" },
			duracao: { value: 1, units: "day", special: "" },
			resistencia: { pericia: "", atributo: "", bonus: 0, txt: "" },
			rolls: []
		}
	}));

	const tesouro = (name, img, desc, qtd = 1) => itemDoc({ name, type: "tesouro", img, system: { description: { value: desc }, qtd, preco: 0, peso: 0, espacos: 0 } });
	novosItens.push(
		tesouro("Bola de Cristal de Zardu", `${T20I}/itens/itens-magicos/bola-de-cristal.webp`,
			p("Achadas na carroça de Zardu. Não são bolas de cristal comuns: cada uma vigia <b>um único ponto</b> das Colinas Centrais. Foi assim que Zardu sabia quando citavam seu nome ou recitavam a rima.",
				"Podem ser vendidas, mas não valem muito. O grupo decide juntos o uso e o valor."), 6),
		tesouro("Relógio Parado e Quebrado", `${T20I}/itens/gerais/engrenagens.webp`,
			p("Encravado no peito de Zardu, como uma peça mecânica imbuída nele. É bem avançado e já foi mágico. Nada mais pode ser descoberto.",
				"Só personagens de culturas muito tecnológicas (Salistick, Sternachten, Valkaria...) têm alguma chance de reconhecer o tipo de objeto.",
				"<i>Pista da tripulação da Roca.</i>"))
	);

	const itensCriados = await Item.createDocuments(novosItens);
	const itemPorNome = (inicio) => itensCriados.find((i) => i.name.startsWith(inicio));

	/* ------------------------------------------------------------------ */
	/* 4. Tabela: Redefinição de Caminhos                                   */
	/* ------------------------------------------------------------------ */
	const tabela = await RollTable.create({
		name: "Redefinição de Caminhos",
		img: "icons/svg/door-exit.svg",
		folder: pasta.RollTable,
		flags: FLAGS(),
		formula: "1d6",
		replacement: true,
		displayRoll: true,
		description: "Para quem tenta sair do Espetáculo pela névoa rubra ou ir aos bastidores.",
		results: [
			{ type: "text", range: [1, 3], weight: 3, name: "Lado oposto", description: "O personagem ressurge no extremo oposto do Espetáculo (embaixo se saiu por cima, à esquerda se saiu pela direita)." },
			{ type: "text", range: [4, 4], weight: 1, name: "Tenda aleatória", description: "O personagem surge numa tenda aleatória (1d4+1: Vyrda, Híbridos, Erros dos Deuses, Gêmeos, Noirax)." },
			{ type: "text", range: [5, 5], weight: 1, name: "Não sai", description: "O personagem não consegue sair." },
			{ type: "text", range: [6, 6], weight: 1, name: "Plateia", description: "O personagem surge sentado num banco da plateia. Vontade CD 15 a cada rodada para levantar. Três falhas: preso até o banco ser destruído ou Zardu ser vencido." }
		]
	});

	/* ------------------------------------------------------------------ */
	/* 5. Macros de mesa                                                    */
	/* ------------------------------------------------------------------ */

	// Todas as macros abaixo são independentes: o texto de cada função vira o comando da macro.

	async function macroUmDeNos() {
		const alvos = canvas.tokens.controlled.length
			? canvas.tokens.controlled.map((t) => t.actor).filter(Boolean)
			: canvas.tokens.placeables.filter((t) => t.actor?.type === "character" && t.actor.hasPlayerOwner).map((t) => t.actor);
		if (!alvos.length) return ui.notifications.warn("Selecione os tokens dos personagens (ou coloque-os na cena).");
		const bonusTormenta = (a) =>
			(a.items.some((i) => i.name.startsWith("Bênção de Kerok")) ? 5 : 0) -
			(a.effects.some((e) => !e.disabled && e.name.startsWith("Pesadelos da Tormenta")) ? 2 : 0);
		const linhas = [];
		const rolls = [];
		for (const a of [...new Set(alvos)]) {
			const mod = (a.system.pericias?.vont?.value ?? 0) + bonusTormenta(a);
			const r = await new Roll(`1d20 + ${mod}`).evaluate();
			rolls.push(r);
			linhas.push({ a, total: r.total, falhou: r.total < 15, mod });
		}
		const falhas = linhas.filter((l) => l.falhou).sort((x, y) => x.total - y.total);
		const escolhido = falhas[0];
		const empate = falhas.filter((l) => l.total === escolhido?.total).length > 1;
		let html = `<h3>Um de Nós! Um de Nós!</h3><p>Vontade CD 15 (Kerok +5 e Sopa LeBlanc –2 já somados).</p><ul>`;
		for (const l of linhas) html += `<li>${l.a.name}: <b>${l.total}</b> ${l.falhou ? "❌" : "✔️"}</li>`;
		html += "</ul>";
		if (escolhido) {
			html += `<p><b>${escolhido.a.name}</b> tirou o menor resultado e se junta à atração na próxima luta.${empate ? " <i>Empate no menor resultado: o mestre escolhe.</i>" : ""}</p>`;
			if (!empate) {
				await escolhido.a.createEmbeddedDocuments("ActiveEffect", [{
					name: "Um de Nós! (aberração do circo)",
					img: "systems/tormenta20/icons/magias/sussurros-insanos.webp",
					type: "base",
					description: "O personagem pertence à atração até o fim da luta. O mestre o controla.",
					flags: { world: { fdt: "av2" } }
				}]);
			}
		} else html += "<p>Ninguém cedeu ao circo desta vez.</p>";
		ChatMessage.create({ content: html, rolls });
	}

	async function macroTesteDoCirco() {
		const alvos = canvas.tokens.controlled.length
			? canvas.tokens.controlled.map((t) => t.actor).filter(Boolean)
			: canvas.tokens.placeables.filter((t) => t.actor?.type === "character" && t.actor.hasPlayerOwner).map((t) => t.actor);
		if (!alvos.length) return ui.notifications.warn("Selecione os tokens (ou coloque os personagens na cena).");
		const PRESETS = {
			livre: { nome: "Teste livre", pericia: "vont", cd: 15, pm: "", tormenta: false, zardu: false },
			colmeia: { nome: "Ato 3 · Zumbido das Colmeias (insanidade)", pericia: "vont", cd: 15, pm: "1d4", tormenta: true, zardu: false },
			chupa: { nome: "Insanidade da Tormenta (Chupacabra)", pericia: "vont", cd: 14, pm: "1d4", tormenta: true, zardu: false },
			pesos: { nome: "Ato 5 · Pesos de Ferro (Acrobacia)", pericia: "acro", cd: 15, pm: "", tormenta: false, zardu: false },
			bombas: { nome: "Bombas Ilusórias de Zardu", pericia: "refl", cd: 20, pm: "", tormenta: false, zardu: true },
			buraco: { nome: "Meu Palco: Buraco / Palhaço Sinistro", pericia: "vont", cd: 20, pm: "", tormenta: false, zardu: true },
			guloseima: { nome: "Guloseima de Gronko", pericia: "vont", cd: 15, pm: "", tormenta: false, zardu: false },
			plateia: { nome: "Sentado na plateia (Redefinição 6)", pericia: "vont", cd: 15, pm: "", tormenta: false, zardu: false }
		};
		const opt = (o) => Object.entries(o).map(([k, v]) => `<option value="${k}">${v.nome ?? v}</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Teste do Circo" },
			content: `
				<div class="form-group"><label>Situação</label><select name="preset">${opt(PRESETS)}</select></div>
				<div class="form-group"><label>Ilusão ou Realidade?</label><select name="ir">
					<option value="0">Não se aplica / não escolheu</option>
					<option value="5">Acertou (+5)</option>
					<option value="-5">Errou (–5)</option></select></div>
				<div class="form-group"><label>Perícia (vazio = da situação)</label><select name="pericia">
					<option value="">—</option><option value="vont">Vontade</option><option value="refl">Reflexos</option>
					<option value="fort">Fortitude</option><option value="acro">Acrobacia</option><option value="int">Inteligência (atributo)</option></select></div>
				<div class="form-group"><label>CD (vazio = da situação)</label><input type="number" name="cd"></div>
				<p style="font-size:0.85em">Kerok (+5) e Sopa LeBlanc (–2) entram nos efeitos da Tormenta; Ralphus (+5) nas ilusões de Zardu. Quem acertar que as bombas são ilusão pode trocar para Vontade.</p>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const preset = PRESETS[res.preset];
		const pericia = res.pericia || preset.pericia;
		const cd = Number(res.cd) || preset.cd;
		const ir = Number(res.ir) || 0;
		const rolls = [];
		let html = `<h3>${preset.nome}</h3><p>${pericia.toUpperCase()} CD ${cd}${ir ? ` · Ilusão ou Realidade ${ir > 0 ? "+5" : "–5"}` : ""}</p><ul>`;
		for (const a of [...new Set(alvos)]) {
			let mod = pericia === "int" ? (a.system.atributos?.int?.value ?? 0) : (a.system.pericias?.[pericia]?.value ?? 0);
			const extras = [];
			if (preset.tormenta && a.items.some((i) => i.name.startsWith("Bênção de Kerok"))) { mod += 5; extras.push("Kerok +5"); }
			if (preset.tormenta && a.effects.some((e) => !e.disabled && e.name.startsWith("Pesadelos da Tormenta"))) { mod -= 2; extras.push("Sopa –2"); }
			if (preset.zardu && a.items.some((i) => i.name.startsWith("Segredo de Ralphus"))) { mod += 5; extras.push("Ralphus +5"); }
			mod += ir;
			const r = await new Roll(`1d20 + ${mod}`).evaluate();
			rolls.push(r);
			const ok = r.total >= cd;
			let extra = "";
			if (!ok && preset.pm) {
				const pr = await new Roll(preset.pm).evaluate();
				rolls.push(pr);
				const pm = a.system.attributes.pm;
				const novo = Math.max(0, pm.value - pr.total);
				await a.update({ "system.attributes.pm.value": novo });
				extra = ` · perdeu <b>${pr.total} PM</b> (${pm.value} → ${novo})`;
				if (novo === 0 && res.preset === "chupa") {
					await a.toggleStatusEffect?.("confuso", { active: true });
					extra += " · <b>confuso</b>";
				}
			}
			html += `<li>${a.name}: <b>${r.total}</b> ${ok ? "✔️" : "❌"}${extras.length ? ` <i>(${extras.join(", ")})</i>` : ""}${extra}</li>`;
		}
		html += "</ul>";
		ChatMessage.create({ content: html, rolls });
	}

	async function macroConvencerGaspar() {
		const gaspar = game.actors.find((a) => a.getFlag("world", "fdtRole") === "gaspar");
		const zardu = game.actors.find((a) => a.getFlag("world", "fdtRole") === "zardu");
		const pj = canvas.tokens.controlled[0]?.actor;
		if (!gaspar || !zardu) return ui.notifications.error("Atores de Gaspar e Zardu não encontrados (importe o conteúdo do módulo Fim dos Tempos).");
		if (!pj) return ui.notifications.warn("Selecione o token do personagem que está argumentando.");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Convencer Gaspar" },
			content: `
				<p>Só vale com um argumento que Gaspar entenda: a mãe, os irmãos, o Herói Louco. Apelos à justiça ou à maldade de Zardu não funcionam.</p>
				<div class="form-group"><label>Perícia</label><select name="pericia">
					<option value="dipl">Diplomacia</option><option value="enga">Enganação</option>
					<option value="inti">Intimidação</option><option value="atua">Atuação</option></select></div>
				<div class="form-group"><label>Bônus de ajuda (aliados que gastaram a ação padrão)</label><input type="number" name="ajuda" value="0"></div>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rp = await new Roll(`1d20 + ${pj.system.pericias[res.pericia].value} + ${Number(res.ajuda) || 0}`).evaluate();
		const rz = await new Roll(`1d20 + ${zardu.system.pericias.enga.value}`).evaluate();
		const venceu = rp.total > rz.total;
		const atual = gaspar.system.resources.primary.value + (venceu ? 1 : 0);
		await gaspar.update({ "system.resources.primary.value": Math.min(3, atual) });
		let html = `<h3>Convencer Gaspar</h3><p>${pj.name}: <b>${rp.total}</b> × Zardu (Enganação): <b>${rz.total}</b></p>
			<p>${venceu ? "✔️ Gaspar hesita..." : "❌ Zardu mantém Gaspar sob controle."} Vitórias: <b>${Math.min(3, atual)}/3</b></p>`;
		if (atual >= 3) {
			html += `<p><b>Gaspar muda de lado e ataca Zardu!</b></p>`;
			for (const t of gaspar.getActiveTokens(false, true)) await t.update({ disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY });
		}
		ChatMessage.create({ content: html, rolls: [rp, rz] });
	}

	async function macroMilFaces() {
		const papel = (t) => t.actor?.getFlag("world", "fdtRole");
		const zarduTok = canvas.tokens.placeables.find((t) => papel(t) === "zardu");
		const copias = canvas.tokens.placeables.filter((t) => papel(t) === "zardu-copia");
		const modelo = game.actors.find((a) => a.getFlag("world", "fdtRole") === "zardu-copia");
		if (!zarduTok || !modelo) return ui.notifications.error("Coloque o token de Zardu na cena (e importe o conteúdo do módulo Fim dos Tempos).");
		const gs = canvas.grid.size;

		if (!copias.length) {
			// Zardu some, surgem quatro cópias espalhadas.
			const docs = [];
			for (let i = 0; i < 4; i++) {
				const dx = Math.floor(Math.random() * 11) - 5;
				const dy = Math.floor(Math.random() * 11) - 5;
				const td = await modelo.getTokenDocument({ x: zarduTok.document.x + dx * gs, y: zarduTok.document.y + dy * gs, name: "Zardu" });
				docs.push(td.toObject());
			}
			await canvas.scene.createEmbeddedDocuments("Token", docs);
			await zarduTok.document.update({ hidden: true });
			return ChatMessage.create({ content: "<h3>Mil Faces!</h3><p>Zardu desaparece e quatro Zardus surgem pelo palco. Quem sofrer dano some.</p><p><i>Mestre: selecione uma cópia atingida e rode a macro de novo para removê-la.</i></p>" });
		}

		const alvo = canvas.tokens.controlled.find((t) => papel(t) === "zardu-copia");
		if (alvo) await alvo.document.delete();
		const restantes = canvas.tokens.placeables.filter((t) => papel(t) === "zardu-copia" && t.id !== alvo?.id);
		if (restantes.length === 1) {
			const ultima = restantes[0];
			await zarduTok.document.update({ x: ultima.document.x, y: ultima.document.y, hidden: false });
			await ultima.document.delete();
			ChatMessage.create({ content: "<p>Só resta uma cópia... e ela é o <b>Zardu verdadeiro</b>!</p>" });
		} else if (alvo) {
			ChatMessage.create({ content: `<p>Um Zardu se desfaz em fumaça colorida. Restam <b>${restantes.length}</b>.</p>` });
		} else {
			ui.notifications.info(`Restam ${restantes.length} cópias. Selecione a que sofreu dano e rode a macro.`);
		}
	}

	async function macroEnxames() {
		const papel = (t) => t.actor?.getFlag("world", "fdtRole");
		const bhuluk = canvas.tokens.controlled.find((t) => papel(t) === "bhuluk") ?? canvas.tokens.placeables.find((t) => papel(t) === "bhuluk");
		const modelo = game.actors.find((a) => a.getFlag("world", "fdtRole") === "enxame");
		if (!bhuluk || !modelo) return ui.notifications.error("Coloque o token de Bhuluk na cena (e importe o conteúdo do módulo Fim dos Tempos).");
		const r = await new Roll("1d4+1").evaluate();
		const gs = canvas.grid.size;
		const offs = [[2, 0], [-2, 0], [0, 2], [0, -2], [2, 2], [-2, -2], [2, -2], [-2, 2]];
		const docs = [];
		for (let i = 0; i < r.total; i++) {
			const [dx, dy] = offs[i];
			const td = await modelo.getTokenDocument({ x: bhuluk.document.x + dx * gs, y: bhuluk.document.y + dy * gs, name: `Enxame ${i + 1}` });
			docs.push(td.toObject());
		}
		await canvas.scene.createEmbeddedDocuments("Token", docs);
		ChatMessage.create({ content: `<h3>Enxame!</h3><p>Bhuluk invoca <b>${r.total}</b> enxames de insetos corrompidos.</p>`, rolls: [r] });
	}

	async function macroRedefinicao() {
		const tabela = game.tables.find((t) => t.getFlag("world", "fdt") === "av2" && t.name === "Redefinição de Caminhos");
		if (!tabela) return ui.notifications.error("Tabela não encontrada (importe o conteúdo do módulo Fim dos Tempos).");
		const atores = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		if (!atores.length) return tabela.draw();
		for (const a of atores) await tabela.draw({ messageData: { speaker: ChatMessage.getSpeaker({ actor: a }) } });
	}

	async function macroAutomacao() {
		const CHAVE = "FDT_AV2_HOOKS";
		if (globalThis[CHAVE]) {
			for (const [h, id] of globalThis[CHAVE]) Hooks.off(h, id);
			delete globalThis[CHAVE];
			return ui.notifications.info("Automação da Aventura 2 DESLIGADA.");
		}
		if (!game.user.isGM) return ui.notifications.warn("Só o Mestre liga a automação.");
		const papel = (a) => a?.getFlag("world", "fdtRole");
		const fala = (actor, content) => ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content });
		const hooks = [];

		// Bhuluk: Armadura de Insetos (metade do dano, bônus cai 2).
		// Chupacabra: guarda o dano sofrido para o teste de Tylora.
		hooks.push(["preUpdateActor", Hooks.on("preUpdateActor", (actor, changes, options) => {
			const novoPV = foundry.utils.getProperty(changes, "system.attributes.pv.value");
			const novoTemp = foundry.utils.getProperty(changes, "system.attributes.pv.temp");
			if (novoPV === undefined && novoTemp === undefined) return;
			const pv = actor.system.attributes.pv;
			if (papel(actor) === "bhuluk" && novoPV !== undefined) {
				const dano = pv.value - novoPV;
				const insetos = actor.system.resources.primary.value;
				if (dano > 0 && insetos > 0) {
					const sofrido = Math.floor(dano / 2);
					foundry.utils.setProperty(changes, "system.attributes.pv.value", pv.value - sofrido);
					foundry.utils.setProperty(changes, "system.resources.primary.value", Math.max(0, insetos - 2));
					fala(actor, `<p><b>Armadura de Insetos:</b> o dano cai de ${dano} para <b>${sofrido}</b>. Bônus dos insetos: ${insetos} → ${Math.max(0, insetos - 2)}.</p>`);
				}
			}
			if (papel(actor) === "chupacabra") {
				const antes = pv.value + (pv.temp || 0);
				const depois = (novoPV ?? pv.value) + (novoTemp ?? pv.temp ?? 0);
				if (depois < antes) options.fdtDano = antes - depois;
			}
		})]);

		// Tylora: role 1d6 sempre que o chupacabra sofrer dano.
		hooks.push(["updateActor", Hooks.on("updateActor", async (actor, changes, options, userId) => {
			if (userId !== game.user.id || papel(actor) !== "chupacabra" || !options.fdtDano) return;
			const tylora = actor.system.resources.primary.value;
			if (tylora <= 0) return;
			const r = await new Roll("1d6").evaluate();
			if (r.total !== 1) return ChatMessage.create({ content: "<p>Tylora escapa do golpe.</p>", rolls: [r], speaker: ChatMessage.getSpeaker({ actor }) });
			const novo = tylora - 1;
			await actor.update({ "system.resources.primary.value": novo });
			if (novo === 1) return ChatMessage.create({ content: "<p><b>Tylora fica ferida!</b> A penalidade do chicote cai para 1d4–1.</p>", rolls: [r], speaker: ChatMessage.getSpeaker({ actor }) });
			const furia = actor.effects.find((e) => e.getFlag("world", "fdtFuria"));
			if (furia) await furia.update({ disabled: false });
			for (const c of game.combat?.combatants ?? []) {
				const velhos = c.actor?.effects.filter((e) => e.getFlag("world", "fdtTylora")).map((e) => e.id) ?? [];
				if (velhos.length) await c.actor.deleteEmbeddedDocuments("ActiveEffect", velhos);
			}
			ChatMessage.create({ content: "<p><b>Tylora cai!</b> O chupacabra uiva de fúria: <b>+2 em ataque e dano</b> até o fim da cena.</p>", rolls: [r], speaker: ChatMessage.getSpeaker({ actor }) });
		})]);

		// Início do turno do chupacabra: Drenar Sangue e chicote de Tylora.
		hooks.push(["updateCombat", Hooks.on("updateCombat", async (combat, changed) => {
			if (!game.user.isGM || game.users.activeGM?.id !== game.user.id) return;
			if (!("turn" in changed) && !("round" in changed)) return;
			const chupa = combat.combatant?.actor;
			if (papel(chupa) !== "chupacabra") return;

			// Drenar Sangue: quem estiver agarrado perde 1d6 PV; o chupacabra ganha PV temporários.
			let drenado = 0;
			for (const c of combat.combatants) {
				const a = c.actor;
				if (!a || a === chupa || !a.statuses?.has("agarrado")) continue;
				const r = await new Roll("1d6").evaluate();
				drenado += r.total;
				await a.update({ "system.attributes.pv.value": a.system.attributes.pv.value - r.total });
				ChatMessage.create({ content: `<p><b>Drenar Sangue:</b> ${a.name} perde <b>${r.total} PV</b>.</p>`, rolls: [r], speaker: ChatMessage.getSpeaker({ actor: chupa }) });
			}
			if (drenado) await chupa.update({ "system.attributes.pv.temp": (chupa.system.attributes.pv.temp || 0) + drenado });

			// Tylora: tira a penalidade antiga e aplica a nova no alvo mirado.
			const tylora = chupa.system.resources.primary.value;
			for (const c of combat.combatants) {
				const velhos = c.actor?.effects.filter((e) => e.getFlag("world", "fdtTylora")).map((e) => e.id) ?? [];
				if (velhos.length) await c.actor.deleteEmbeddedDocuments("ActiveEffect", velhos);
			}
			if (tylora <= 0) return;
			const alvo = [...game.user.targets].map((t) => t.actor).find((a) => a && a !== chupa);
			if (!alvo) return fala(chupa, "<p><b>Tylora</b> estala o chicote. <i>Mestre: mire um personagem em alcance curto e use o item \"Tylora: Chicote da Domadora\".</i></p>");
			const r = await new Roll(tylora === 2 ? "1d6-1" : "1d4-1").evaluate();
			const rolls = [r];
			let html = `<p><b>Tylora</b> mira ${alvo.name}: <b>–${r.total}</b> em testes de perícia até o próximo turno do chupacabra.</p>`;
			if (r.total > 0) {
				await alvo.createEmbeddedDocuments("ActiveEffect", [{
					name: `Chicote de Tylora (–${r.total})`,
					img: "systems/tormenta20/icons/itens/equipamentos/chicote.webp",
					type: "base",
					flags: { world: { fdt: "av2", fdtTylora: true } },
					system: { changes: [{ key: "system.modificadores.pericias.geral", value: `-${r.total}`, type: "add", phase: "initial", priority: null }] }
				}]);
				const f = await new Roll(`1d20 + ${alvo.system.pericias?.fort?.value ?? 0}`).evaluate();
				rolls.push(f);
				if (f.total < 15) {
					const pm = alvo.system.attributes.pm;
					await alvo.update({ "system.attributes.pm.value": Math.max(0, pm.value - 1) });
					html += `<p>Veneno do chicote: Fortitude <b>${f.total}</b> contra CD 15 ❌, perde <b>1 PM</b>.</p>`;
				} else html += `<p>Veneno do chicote: Fortitude <b>${f.total}</b> contra CD 15 ✔️.</p>`;
			}
			ChatMessage.create({ content: html, rolls, speaker: ChatMessage.getSpeaker({ actor: chupa }) });
		})]);

		globalThis[CHAVE] = hooks;
		ui.notifications.info("Automação da Aventura 2 LIGADA (Bhuluk, Tylora, Drenar Sangue). Rode de novo para desligar.");
	}

	const macro = (name, img, fn) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Aventura 2 · gerado por av2-lefou-adolescente.js\n(${fn.toString()})();`
	});
	const macros = await Macro.createDocuments([
		macro("Av2 · Automação (liga/desliga)", "icons/svg/clockwork.svg", macroAutomacao),
		macro("Av2 · Um de Nós!", `${T20I}/magias/sussurros-insanos.webp`, macroUmDeNos),
		macro("Av2 · Teste do Circo", `${T20I}/magias/explosao-caleidoscopica.webp`, macroTesteDoCirco),
		macro("Av2 · Redefinição de Caminhos", "icons/svg/door-exit.svg", macroRedefinicao),
		macro("Av2 · Convencer Gaspar", `${T20I}/ameacas/maniaco-lefou.png`, macroConvencerGaspar),
		macro("Av2 · Mil Faces (Zardu)", `${T20I}/magias/duplicata-ilusoria.webp`, macroMilFaces),
		macro("Av2 · Enxames de Bhuluk", `${T20I}/magias/enxame-rubro.webp`, macroEnxames)
	]);
	const linkMacro = (inicio) => {
		const m = macros.find((x) => x.name.includes(inicio));
		return m ? `@UUID[${m.uuid}]{${m.name}}` : inicio;
	};

	/* ------------------------------------------------------------------ */
	/* 6. Diário da aventura                                                */
	/* ------------------------------------------------------------------ */
	const L = (d) => (d?.uuid ? `@UUID[${d.uuid}]{${d.name}}` : "");
	const pagina = (name, content, sort) => ({ name, type: "text", sort, text: { content, format: 1 } });

	await JournalEntry.create({
		name: "Aventura 2 · Eu Fui um Lefou Adolescente",
		folder: pasta.JournalEntry,
		flags: FLAGS(),
		pages: [
			pagina("Guia do Mestre", `
				<h2>Ordem do espetáculo</h2>
				<ol>
					<li>${L(atores.chupacabra)} com Tylora (pule se o chupacabra já morreu na busca pelo circo)</li>
					<li>${L(atores.xillirienn)}</li>
					<li>${L(atores.bhuluk)} (e o ${L(atores.enxame)})</li>
					<li>${L(atores.gronko)}</li>
					<li>${L(atores.gaspar)}; duas rodadas depois, ${L(atores.zardu)} (e a ${L(atores.copia)})</li>
				</ol>
				<p>Efeitos de palco, tendas e guloseimas: ${L(atores.espetaculo)}.</p>
				<h2>Antes de cada atração</h2>
				<ol>
					<li>Zardu apresenta a atração e o palco muda (uma rodada livre para os heróis se prepararem).</li>
					<li>Rode ${linkMacro("Um de Nós")}. Se a plateia estiver entretida e o grupo escolheu anular, pule.</li>
					<li>Ilusão ou Realidade: cada jogador declara o que acha do efeito do palco. Use ${linkMacro("Teste do Circo")} com +5 ou –5.</li>
				</ol>
				<h2>Automação</h2>
				<p>Ligue ${linkMacro("Automação")} no começo da sessão (vale só até recarregar a página, só no computador do Mestre). Ela cuida de:</p>
				<ul>
					<li>Bhuluk: metade do dano e –2 no bônus de insetos a cada dano.</li>
					<li>Chupacabra: 1d6 de Tylora a cada dano; Tylora ferida/caída; Fúria (+2) quando ela cai.</li>
					<li>Início do turno do chupacabra: Drenar Sangue em quem estiver <i>agarrado</i> e o chicote de Tylora no alvo que você estiver mirando.</li>
				</ul>
				<p>Outras macros: ${linkMacro("Enxames")}, ${linkMacro("Mil Faces")}, ${linkMacro("Convencer Gaspar")}, ${linkMacro("Redefinição")} (tabela ${L(tabela)}).</p>
				<h2>Quem cai</h2>
				<p>Um turno para ser reanimado; depois, correntes rubras o levam para a plateia. Ninguém morre assim. Se for libertado, volta a sangrar.</p>`, 100),
			pagina("As Cinco Tendas", `
				<p>Ninguém é atacado nas tendas. Personagens podem ganhar vantagens:</p>
				<ul>
					<li><b>1. Vyrda, a Mulher Monstruosa:</b> libertada com gentileza, dá a ${L(itemPorNome("Seringa de Vyrda")) || "Poção de Físico Divino"}. Teste social CD 15: ${L(itemPorNome("Parceiro: Vyrda"))}.</li>
					<li><b>2. Os Híbridos Profanos:</b> a mosca de cabeça humana explica tudo; a plateia só quer ser entretida. Social CD 15: ${L(itemPorNome("Parceiro: Híbridos"))}. Plateia entretida: ${L(itemPorNome("Parceiro: Plateia"))} por um combate <i>ou</i> anula "Um de Nós!".</li>
					<li><b>3. Os Erros dos Deuses:</b> jarros com experimentos e vítimas. PJ morto aparece aqui num jarro. Depois de Gaspar, Ralphus se esconde aqui: ${L(itemPorNome("Segredo de Ralphus"))}.</li>
					<li><b>4. Korek e Kerok:</b> Korek (não corrompido) quer ajudar, mas tudo que diz está errado; Kerok não quer colaborar, mas fala a verdade. Social CD 15 com Kerok: ${L(itemPorNome("Bênção de Kerok"))}.</li>
					<li><b>5. Noirax, a Lady Tatuada:</b> nobre de Zakharov. Inteligência CD 10 nas tatuagens: recupera 1d4 PM (uma vez cada). Item <i>Tenda 5 · Tatuagens de Noirax</i> no Espetáculo.</li>
				</ul>`, 200),
			pagina("Handout · A Rima", `
				<blockquote><p><i>À noite não adormeça<br>Sonhe fora da cama<br>Não durma e nunca cresça<br>À noite o circo nos chama</i></p></blockquote>
				<p class="secret">Não há nada de mágico na rima: é um ritual inventado por Zardu para que as crianças entreguem os pais. Se os heróis recitarem em círculo, entregam as crianças como vítimas.</p>`, 300),
			pagina("Handout · Carta de Syvarian", `
				<p><i>Cara senhora LeBlanc,</i></p>
				<p><i>A organização que represento tem interesse em adquirir suas terras. Estamos preparados para pagar uma quantia generosa, que iria devolver sua família ao status de nobreza que é seu direito. Uma quantia que garantiria esse status em qualquer lugar do Reinado.</i></p>
				<p><i>Entenda que, caso não aceite, haverá consequências.</i></p>
				<p><i>Aguardo sua resposta e sua colaboração.</i></p>
				<p><i>Cordialmente,<br>Syvarian</i></p>`, 400),
			pagina("Handout · Página do Diário de Zardu", `
				<p><i>"Este mundo já conhece o paraíso. Eles estão chegando aos poucos. Mas estão sendo combatidos. Os mortais, os tolos mortais não reconhecem a bênção que estão recebendo! Este é meu dever. Viajar por estes reinos ignorantes, estas terras atrasadas, e mostrar a maravilha da Tormenta. Mostrar a eles o que nós vimos quando fomos abençoados."</i></p>
				<p><i>"Eu sei que tinha outra tarefa, mas ela não importa mais. Será que cada um de nós recebeu uma nova missão? Será que os outros conheceram suas missões como eu, numa iluminação súbita? Até hoje imagino onde cada um deles está. Nosso vínculo é eterno, pelo que vimos e pelo que vivemos."</i></p>
				<p><i>"Syvarian veio me encontrar. Ele me disse que alguns indesejáveis deveriam ser retirados daqui, falou o nome da família LeBlanc. Pobre tolo, ele ainda pensa pequeno. Ainda está preso nas memórias que vivenciamos antes. Em nossas outras vidas. Mas há algo sagrado em nosso reencontro. Depois de tantos anos afastados, eu e ele nestas colinas ao mesmo tempo... Isso tem um significado."</i></p>
				<p><i>"E o significado é só um. A Tormenta está chegando."</i></p>`, 500),
			pagina("Desfecho e Recompensas", `
				<p>Com Zardu vencido, as ilusões somem: o Espetáculo é só uma cerca de madeira, um palco e bancos. Ralphus era o contrarregra. Os prodígios que sobraram fogem ou pedem clemência.</p>
				<ul>
					<li>No peito de Zardu: ${L(itemPorNome("Relógio Parado"))}.</li>
					<li>Na casaca: a página do diário (handout).</li>
					<li>Na carroça: seis ${L(itemPorNome("Bola de Cristal"))}.</li>
					<li>Gaspar devolvido: Mabel vira aliada para a vida toda (${L(itemPorNome("Parceiro: Mabel"))}; ${L(itemPorNome("Parceiro: Gaspar"))} se forem cuidadosos com ele) e serve ${L(itemPorNome("Sopa LeBlanc"))}.</li>
					<li>Zardu levado vivo ao Forte amanhece morto (Vesper). Se Vesper já tiver partido, ele fala de forma confusa sobre a fuga da tripulação e os gog'magogues.</li>
				</ul>`, 600)
		]
	});

	ui.notifications.info("Aventura 2 criada: 9 atores, itens, diário, tabela e 7 macros. Veja a pasta \"" + NOME_PASTA + "\".");
})();
