/* =====================================================================
 * FIM DOS TEMPOS · ARCO 1 · "O TEMPLO DO VÁCUO" (masmorra opcional)
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Arco 1 · Templo do Vácuo" com:
 *      - As criaturas do livro: tirano das águas e barão (com as 4 Mutações Rubras), mecanículo,
 *        monstro da ferrugem, cardume carnívoro, cocatriz, amebas gigantes jovem e adulta,
 *        estátua animada (golem de ferro do compêndio), estátua com besta, ganchador
 *        (compêndio), autômato ferreiro arruinado e a porta de ferro pesada.
 *      - Ator de apoio "Templo do Vácuo · Armadilhas" com as 11 armadilhas e as CDs do livro.
 *      - Itens: Engenhosidade, anotações de Kizadrinni, diário do aventureiro, mapa de
 *        Sambúrdia, tabuletas dos túmulos e o kit de ofício com a gazua.
 *      - Tabelas: Encontros no Templo do Vácuo (1d20 + ruído), Reações dos Encontros e
 *        Memórias dos Gnomos.
 *      - Diário com guia, como chegar, regras da masmorra, os três níveis sala a sala, o enigma
 *        das tabuletas e os handouts.
 *      - Macros: Busca pelo Templo, Exploração (ruído, salas, encontros, reação, tochas),
 *        Escuridão do Templo, Armadilhas, Testes do Templo, Criaturas e Mecanismos.
 *   3. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "a1templo".
 *
 * Feito a partir do código do sistema (master, out/2026); não foi testado num Foundry rodando.
 * Veja o guia a1-templo-do-vacuo.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "a1templo";
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
			window: { title: "O Templo do Vácuo: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para o Templo do Vácuo.</p>
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
	/* 1. Construtores (mesmos dos outros geradores)                                */
	/* ------------------------------------------------------------------ */
	const NOME_PASTA = "FdT · Arco 1 · Templo do Vácuo";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#3a4a5a", flags: FLAGS() })).id;
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
			abilityUse: { types: o.types ?? [], names: o.names ?? [], automatic: o.automatic ?? false, aumenta: false, custo: o.custo ?? 0, description: "" }
		}
	});
	/** Botão de condição no card (o nome é resolvido para a condição do sistema). */
	const cond = (nome) => fx(nome, null);
	/** Bônus opcional marcado na janela de rolagem. */
	const aoUsar = (name, img, changes, types, names = []) =>
		fx(name, img, changes, { onuse: true, disabled: true, transfer: true, types, names });
	/** Efeito ligado/desligado na aba de efeitos do ator. */
	const chave = (name, img, changes, ligado = false, description = "") => fx(name, img, changes, { disabled: !ligado, description });
	/** Em chamas com dano rolado no início de cada turno da vítima. */
	const emChamas = () => fx("Incendiado (em chamas)", "icons/magic/fire/flame-burning-embers-yellow.webp",
		[["danoContinuo", "1d6[fogo]", "custom"]], { statuses: ["emchamas"], description: "1d6 de fogo no início de cada turno. Ação padrão para apagar." });

	const rolagem = (name, parts, i = 0) => ({
		name,
		key: `dano${i}`,
		type: "dano",
		parts: parts.map(([f, t]) => [f, t ?? "", ""]),
		versatil: "",
		adaptavel: ""
	});

	const base = (o) => ({
		ativacao: { execucao: o.exec ?? "", custo: o.custo ?? 0, qtd: "", condicao: o.condicao ?? "", special: "" },
		alcance: o.alcance ?? "none",
		alvo: o.alvo ?? "",
		area: o.area ?? "",
		duracao: { value: o.durV ?? 0, units: o.durU ?? "inst", special: "" },
		resistencia: { pericia: "", atributo: "", bonus: 0, txt: o.save ?? "" },
		rolls: (o.rolls ?? []).map((r, i) => rolagem(r[0], r[1], i))
	});

	/** Poder / habilidade de criatura. */
	const poder = (name, img, desc, o = {}) => ({
		name,
		type: "poder",
		img: img ?? "icons/svg/item-bag.svg",
		flags: FLAGS(),
		effects: o.effects ?? [],
		// Poderes não têm o campo "alvo" no sistema: o texto vai para a descrição.
		system: (({ alvo, ...b }) => ({ description: { value: alvo ? `<p><b>Alvo:</b> ${alvo}</p>${desc}` : desc }, tipo: o.tipo ?? "ability", subtipo: o.subtipo ?? "", ...b }))(base(o))
	});

	/** Magia de NPC. */
	const magia = (name, img, desc, o = {}) => ({
		name,
		type: "magia",
		img,
		flags: FLAGS(),
		effects: o.effects ?? [],
		system: { description: { value: desc }, tipo: o.tipoMagia ?? "div", circulo: o.circulo ?? 1, escola: o.escola ?? "evo", preparada: true, ...base(o) }
	});

	/** Arma de NPC: usa a perícia do NPC (que já tem o bônus do livro) + ajuste. */
	const arma = (name, img, { pericia = "luta", atributo = "for", proposito = "corpo-a-corpo", ajuste = 0, dano, tipo, extra = [], critM = 20, critX = 2, alcance = "", desc = "", effects = [] }) => ({
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
			alcance,
			proficiencia: "simples",
			proposito,
			empunhadura: "uma",
			rolls: [
				{ name: "Ataque", key: "ataque0", type: "ataque", parts: [["1d20", "", ""], [pericia, atributo, ""], [String(ajuste), "", ""]], versatil: "", adaptavel: "" },
				{ name: "Dano", key: "dano1", type: "dano", parts: [[dano, tipo, ""], ["", "", ""], ...extra.map(([f, t]) => [f, t, ""])], versatil: "", adaptavel: "" }
			]
		}
	});
	const distancia = (name, img, o) => arma(name, img, { pericia: "pont", atributo: "des", proposito: "disparo", ...o });

	const ATR_PERICIA = { luta: "for", atle: "for", pont: "des", inic: "des", refl: "des", furt: "des", acro: "des", fort: "con", perc: "sab", vont: "sab", intu: "sab", sobr: "sab", reli: "sab", atua: "car", enga: "car", dipl: "car", inti: "car", mist: "int", ofi0: "int", conh: "int", pilo: "des", inve: "int", ladi: "des", guer: "int", cura: "sab", nobr: "int", ades: "car" };

	/**
	 * Cria um NPC. pericias: { chave: valor final do livro }. Fórmula: meio nível + atributo + outros.
	 * res: { tipo: { base, imunidade, vulnerabilidade } }; "dano" é a RD geral.
	 */
	async function criarNPC(d) {
		const nivel = Number(d.nd) || 1;
		const meio = Math.floor(nivel / 2);
		const atr = d.atr;
		const lado = d.tokenSize ?? 1;
		const actor = await Actor.create({
			name: d.name,
			type: "npc",
			img: d.img,
			folder: pasta.Actor,
			flags: FLAGS(d.role),
			prototypeToken: {
				name: d.tokenName ?? d.name,
				actorLink: d.link ?? false,
				disposition: d.disposition ?? -1,
				displayName: 20,
				displayBars: 20,
				bar1: { attribute: "attributes.pv" },
				width: lado,
				height: lado,
				texture: { src: d.token ?? d.img },
				sight: { enabled: true }
			},
			system: {
				atributos: Object.fromEntries(Object.entries(atr).map(([k, v]) => [k, { base: v, bonus: 0, racial: 0 }])),
				attributes: {
					nd: String(d.nd),
					cd: d.cd ?? 15,
					pv: { value: d.pv, max: d.pv, temp: 0 },
					pm: { value: d.pm ?? 0, max: d.pm ?? 0, temp: 0 },
					defesa: { base: d.def - (atr.des ?? 0), bonus: [], outros: 0 },
					movement: { walk: { base: d.walk ?? 9, bonus: [] }, swim: { base: d.swim ?? 0, bonus: [] }, fly: { base: d.fly ?? 0, bonus: [] }, climb: { base: d.climb ?? 0, bonus: [] } },
					sentidos: { value: d.sentidos ?? [], custom: "" },
					conjuracao: d.conjuracao ?? "sab"
				},
				detalhes: {
					tipo: d.tipo,
					raca: d.raca ?? "",
					role: d.papel ?? "solo",
					tesouro: d.tesouro ?? "Nenhum.",
					resistencias: d.resTxt ?? "",
					ataquescac: d.ataquesTxt ?? "",
					ataquesad: d.ataquesAdTxt ?? "",
					equipamento: d.equipTxt ?? "",
					biography: { value: d.bio ?? "", public: "" }
				},
				tracos: { tamanho: d.tamanho ?? "med", ic: { value: d.ic ?? [], custom: d.icCustom ?? "" }, idiomas: { value: ["comum"] } }
			},
			effects: d.effects ?? []
		});

		const up = {};
		for (const [k, alvo] of Object.entries(d.pericias ?? {})) {
			up[`system.pericias.${k}.treinado`] = false;
			up[`system.pericias.${k}.outros`] = alvo - meio - (atr[ATR_PERICIA[k]] ?? 0);
		}
		for (const [k, r] of Object.entries(d.recursos ?? {})) {
			up[`system.resources.${k}.value`] = r.value;
			up[`system.resources.${k}.max`] = r.max;
			up[`system.resources.${k}.label`] = r.label;
		}
		for (const [tipo, r] of Object.entries(d.res ?? {})) {
			for (const [campo, v] of Object.entries(r)) up[`system.tracos.resistencias.${tipo}.${campo}`] = v;
		}
		if (Object.keys(up).length) await actor.update(up);
		// statblockParsing evita que o sistema "limpe" a perícia do ataque das armas de NPC.
		if (d.items?.length) await actor.createEmbeddedDocuments("Item", d.items, { statblockParsing: true });
		return actor;
	}

	/** Copia uma ameaça do compêndio do sistema, com a marca deste gerador. */
	const clonarAmeaca = async (id, nome, o = {}) => {
		const doc = await game.packs.get("tormenta20.ameacas")?.getDocument(id).catch(() => null);
		if (!doc) return null;
		const data = doc.toObject();
		delete data._id;
		data.name = nome;
		data.folder = pasta.Actor;
		data.flags = foundry.utils.mergeObject(data.flags ?? {}, FLAGS(o.role));
		data.prototypeToken.name = o.tokenName ?? nome;
		data.prototypeToken.actorLink = o.link ?? false;
		if (o.img) { data.img = o.img; data.prototypeToken.texture.src = o.img; }
		if (o.pv) data.system.attributes.pv = { ...data.system.attributes.pv, value: o.pv, max: o.pv };
		data.system.detalhes ??= {};
		data.system.detalhes.biography ??= { value: "", public: "" };
		data.system.detalhes.biography.value = `${o.bio ?? ""}<hr>${data.system.detalhes.biography.value ?? ""}`;
		const actor = await Actor.create(data);
		if (o.items?.length) await actor.createEmbeddedDocuments("Item", o.items, { statblockParsing: true });
		if (o.effects?.length) await actor.createEmbeddedDocuments("ActiveEffect", o.effects);
		return actor;
	};

	/* ------------------------------------------------------------------ */
	/* 2. Criaturas do Templo                                               */
	/* ------------------------------------------------------------------ */
	const atores = {};
	const ONDE = (txt) => `<p><b>No Templo:</b> ${txt}</p>`;

	const frenesi = () => poder("Frenesi Sangrento", "icons/svg/blood.svg",
		p("Sempre que causa dano com a mordida, recebe <b>+2 cumulativo</b> em ataque e dano até o fim da cena.",
			"Use a macro <i>Templo · Criaturas › Frenesi Sangrento</i> com o token selecionado: ela empilha o bônus num efeito só."),
		{ exec: "passive" });

	atores.tirano = await criarNPC({
		name: "Tirano das Águas",
		role: "tirano",
		img: `${T20I}/ameacas/troll-aquatico.png`,
		nd: 1,
		cd: 13,
		tipo: "mon",
		papel: "lackey",
		atr: { for: 3, des: 2, con: 1, int: -1, sab: 1, car: -1 },
		pv: 16,
		def: 15,
		walk: 9,
		swim: 12,
		sentidos: ["escuro", "cegas"],
		pericias: { inic: 5, perc: 3, fort: 6, refl: 6, vont: 4, atle: 7, furt: 4 },
		tesouro: "Padrão.",
		resTxt: "Percepção às cegas só dentro d'água. Furtividade +9 dentro d'água.",
		bio: p("Homens-peixe que invadiram o Templo pelo rio subterrâneo. Consideram o rio e o Nível 2 seu território. Entendem negociação: usam a tabela de Reações.") +
			ONDE("Salas 5, 9, 10 e 12 do Nível 1; Salas 3, 4 e o rio (6) do Nível 2. A Alavanca 2 dá +3 em ataque e Defesa a todos eles."),
		items: [
			arma("Mordida", "icons/svg/blood.svg", { dano: "1d6+3", tipo: "perfuracao" }),
			arma("Garra", "icons/creatures/claws/claw-bear-paw-swipe-red.webp", { dano: "1d4+3", tipo: "corte", desc: p("Duas garras por ataque.") }),
			frenesi(),
			poder("Ataque Total", "icons/svg/sword.svg", p("Mordida +11 (1d6+3) e duas garras +11 (1d4+3)."), { exec: "action" })
		]
	});

	const mutacao = (nome, desc, changes = []) => chave(`Mutação Rubra: ${nome}`, "icons/creatures/eyes/slime-single-red.webp", changes, false, desc);
	atores.barao = await criarNPC({
		name: "Tirano das Águas Barão",
		role: "barao",
		img: `${T20I}/ameacas/troll-aquatico.png`,
		nd: 5,
		cd: 18,
		tipo: "mon",
		papel: "solo",
		atr: { for: 4, des: 2, con: 2, int: 0, sab: 1, car: -1 },
		pv: 156,
		def: 24,
		walk: 9,
		swim: 12,
		sentidos: ["escuro", "cegas"],
		pericias: { inic: 6, perc: 5, fort: 12, refl: 12, vont: 10, atle: 10, furt: 6 },
		tesouro: "Padrão.",
		resTxt: "Percepção às cegas só dentro d'água. Furtividade +11 dentro d'água.",
		bio: p("Líder dos tiranos das águas, inchado de Tormenta. <b>Ligue uma das quatro Mutações Rubras</b> na aba de efeitos (ou role 1d4: 1 Duas Cabeças, 2 Escamas Reforçadas, 3 Quatro Braços, 4 Vômito Cáustico).") +
			ONDE("Salas 9/10 e 12 do Nível 1 e o rio do Nível 2 (até 3 barões)."),
		effects: [
			mutacao("Duas Cabeças", "Um ataque adicional de mordida; não pode ser flanqueado."),
			mutacao("Escamas Reforçadas", "A Defesa se torna 28.", [["system.attributes.defesa.bonus", "4"]]),
			mutacao("Quatro Braços", "Dois ataques adicionais de garra."),
			mutacao("Vômito Cáustico", "Libera a ação Vômito Cáustico (movimento, recarga ao acertar uma mordida).")
		],
		recursos: { primary: { value: 1, max: 1, label: "Vômito carregado" } },
		items: [
			arma("Mordida", "icons/svg/blood.svg", { dano: "1d6+10", tipo: "perfuracao" }),
			arma("Garra", "icons/creatures/claws/claw-bear-paw-swipe-red.webp", { dano: "1d4+10", tipo: "corte", desc: p("Duas garras por ataque (quatro com a mutação Quatro Braços).") }),
			frenesi(),
			poder("Vômito Cáustico (mutação)", "icons/svg/acid.svg",
				p("<b>Movimento.</b> Só com a mutação. Uma criatura adjacente sofre <b>4d4 de ácido</b> e mais <b>2d4 de ácido</b> na rodada seguinte (Reflexos CD 18 reduz o dano inicial e o seguinte à metade). Recarga: acertar uma mordida.",
					"A macro <i>Templo · Criaturas › Vômito Cáustico</i> rola, aplica e deixa o dano da rodada seguinte como dano contínuo."),
				{ exec: "move", alcance: "touch", save: "Reflexos CD 18 reduz à metade", rolls: [["Ácido", [["4d4", "acido"]]], ["Rodada seguinte", [["2d4", "acido"]]]] })
		]
	});

	atores.mecanico = await criarNPC({
		name: "Mecanículo",
		role: "mecanico",
		img: `${T20I}/ameacas/engenho-de-guerra-goblin.png`,
		nd: 2,
		cd: 14,
		tipo: "con",
		papel: "lackey",
		tamanho: "peq",
		atr: { for: 3, des: 2, con: 3, int: 0, sab: 0, car: -5 },
		pv: 32,
		def: 18,
		walk: 9,
		sentidos: ["escuro"],
		pericias: { inic: 4, perc: 3, fort: 10, refl: 8, vont: 9 },
		res: { acido: { base: 5 }, eletricidade: { base: 5 }, fogo: { base: 5 } },
		ic: ["cansaco", "metabolismo", "mental"].filter(Boolean),
		resTxt: "Redução de ácido, eletricidade e fogo 5. Inteligência —: objeto semiconsciente.",
		bio: p("Pequenos construtos gnômicos com picaretas, guardiões e operários do Templo. Usam a tabela de Reações.",
			"Os autômatos da Sala de Reparos (Nível 1, Sala 11) curam 1d8+1 PV por rodada de um mecanículo na bigorna.") +
			ONDE("Corredores para o Salão Principal (5), Altar Mecânico (5), Salão da Memória (8). A Alavanca 1 ativa mais 4d6 na Sala da Estátua com +5 em ataque e Defesa; a Alavanca 2 os reduz a 10 PV com –5 em tudo."),
		items: [
			arma("Picareta Aumentada", `${T20I}/itens/equipamentos/picareta.webp`, { dano: "1d8+10", tipo: "perfuracao", critX: 4 }),
			poder("Descarregar", "icons/magic/fire/explosion-fireball-large-red-orange.webp",
				p("<b>Reação.</b> Quando é reduzido a 0 PV ou menos, faz um ataque de picareta contra uma criatura adjacente (geralmente, a última que causou dano a ele)."),
				{ exec: "reaction" })
		]
	});

	atores.ferrugem = await criarNPC({
		name: "Monstro da Ferrugem",
		role: "ferrugem",
		img: `${T20I}/ameacas/besouro-aberrante.png`,
		nd: 2,
		cd: 17,
		tipo: "mon",
		papel: "solo",
		atr: { for: 0, des: 4, con: 2, int: -4, sab: 1, car: -1 },
		pv: 72,
		def: 20,
		walk: 12,
		sentidos: ["escuro", "faro"],
		pericias: { inic: 7, perc: 4, fort: 7, refl: 9, vont: 4 },
		bio: p("Faz o ninho onde os mecanículos chegam danificados pela água. Usa a tabela de Reações, mas foge ou se afasta em qualquer resultado de diálogo.") +
			ONDE("Covil da Ferrugem (Nível 1, Sala 6), entre restos de mecanículos."),
		items: [
			arma("Antena", "icons/svg/lightning.svg", { dano: "0", tipo: "", desc: p("Sem dano: aplica Ferrugem.") }),
			arma("Mordida", "icons/svg/blood.svg", { dano: "1d8+4", tipo: "perfuracao" }),
			poder("Ferrugem", "icons/svg/acid.svg",
				p("A antena corrói qualquer objeto de metal atingido, quebrando-o na hora. Uma arma de metal que cause dano ao monstro também é corroída. Itens mágicos empunhados têm direito a <b>Fortitude CD 17</b>.",
					"<b>Contra golens e construtos de metal:</b> Fortitude CD 17; cada falha piora fatigado → exausto → paralisado. Só reparos (estátuas do Templo, Ofício [artesão]) removem.",
					"Macro: <i>Templo · Criaturas › Antena da Ferrugem</i>."),
				{ exec: "passive" })
		]
	});

	atores.cardume = await criarNPC({
		name: "Cardume Carnívoro",
		role: "cardume",
		img: `${T20I}/ameacas/convocacoes/enxame-de-pestes.webp`,
		nd: 3,
		cd: 14,
		tipo: "ani",
		papel: "solo",
		tamanho: "gra",
		tokenSize: 2,
		atr: { for: 0, des: 3, con: 1, int: -5, sab: 1, car: -2 },
		pv: 30,
		def: 18,
		walk: 0,
		swim: 12,
		sentidos: ["cegas", "penumbra"],
		pericias: { inic: 6, perc: 4, fort: 8, refl: 12, vont: 4 },
		resTxt: "Enxame: imune a manobras e a efeitos de alvo único sem dano; metade do dano de armas; +50% de dano de área.",
		bio: p("Peixes vorazes do rio subterrâneo. Atacam sem negociar.") + ONDE("Cratera (Nível 1, Sala 5), o rio do Nível 2 (até 4) e o braço do rio no Salão da Memória (3)."),
		items: [
			poder("Enxame (fim do turno)", "icons/svg/blood.svg",
				p("No fim do turno, causa <b>2d6 de corte</b> automaticamente a quem estiver no espaço dele.",
					"<b>Morte por Mil Dentes:</b> cada 6 num dado de dano soma +1d6. <b>Sangrar:</b> quem sofrer 10 ou mais do cardume na rodada fica sangrando.",
					"A macro <i>Templo · Criaturas › Cardume</i> faz tudo isso nos alvos mirados."),
				{ exec: "passive", rolls: [["Enxame", [["2d6x6", "corte"]]]] })
		]
	});

	atores.cocatriz = await criarNPC({
		name: "Cocatriz",
		role: "cocatriz",
		img: `${T20I}/ameacas/basilisco.png`,
		nd: 3,
		cd: 19,
		tipo: "mon",
		papel: "solo",
		tamanho: "peq",
		atr: { for: 0, des: 5, con: 1, int: -5, sab: 1, car: -2 },
		pv: 98,
		def: 22,
		walk: 6,
		fly: 12,
		sentidos: ["escuro"],
		pericias: { inic: 10, perc: 4, fort: 9, refl: 13, vont: 5 },
		resTxt: "Evasão.",
		bio: p("Extremamente territorial: ataca qualquer um que entre no ninho.") + ONDE("Ninho da Cocatriz (Nível 2, Sala 10)."),
		items: [
			arma("Bicada", `${T20I}/conditions/petrificado.svg`, { dano: "2d4+8", tipo: "perfuracao", desc: p("Mais bicada petrificante.") }),
			poder("Bicada Petrificante", `${T20I}/conditions/petrificado.svg`,
				p("Quem sofre dano da bicada fica <b>lento</b> (Fortitude CD 19 evita). Se já estava lento, fica <b>petrificado</b> permanentemente. Efeitos que removem paralisia revertem a petrificação.",
					"Macro: <i>Templo · Criaturas › Bicada Petrificante</i>."),
				{ exec: "passive", save: "Fortitude CD 19 evita", effects: [cond("Lento")] })
		]
	});

	const ameba = async (adulta) => criarNPC({
		name: adulta ? "Ameba Gigante Adulta" : "Ameba Gigante Jovem",
		role: adulta ? "amebaAdulta" : "ameba",
		img: `${T20I}/ameacas/glop.png`,
		nd: adulta ? 5 : 3,
		cd: adulta ? 21 : 18,
		tipo: "mon",
		papel: "solo",
		tamanho: adulta ? "eno" : "gra",
		tokenSize: adulta ? 3 : 2,
		atr: adulta ? { for: 5, des: -5, con: 9, int: 0, sab: -5, car: -5 } : { for: 4, des: -5, con: 8, int: 0, sab: -5, car: -5 },
		pv: adulta ? 209 : 126,
		def: adulta ? 21 : 18,
		walk: 4.5,
		sentidos: ["cegas"],
		pericias: adulta ? { inic: -1, perc: -1, fort: 18, refl: 4, vont: 6 } : { inic: -2, perc: -2, fort: 15, refl: 2, vont: 4 },
		res: { dano: { base: adulta ? 10 : 5 }, eletricidade: { imunidade: true }, fogo: { vulnerabilidade: true } },
		ic: ["mental"],
		resTxt: `Imunidade a eletricidade e metamorfose, redução de dano ${adulta ? 10 : 5}, vulnerabilidade a fogo. Inteligência —.`,
		tesouro: adulta ? "Padrão (apenas material inorgânico)." : "Metade (apenas material inorgânico).",
		bio: p(adulta
			? "Massa gelatinosa enorme. Ao chegarem no Nível 2, role 1d6: par, ela vai da Sala 2 para a Sala 3; ímpar, vem para a Sala 1 (circula a sala em sentido anti-horário e volta)."
			: "Circula só pelos corredores sudoeste do Nível 1, sempre para a direita, uma volta completa de cada vez. Desvia dos mecanículos e da armadilha. O ganchador sabe evitá-la.") +
			ONDE(adulta ? "Nível 2, Salas 1 e 2." : "Corredores sudoeste do Nível 1."),
		items: [
			arma("Pseudópodo", "icons/svg/acid.svg", { dano: adulta ? "1d8+5" : "1d6+4", tipo: "impacto", desc: p("Quatro pseudópodos por ataque. Ao acertar, pode agarrar como ação livre.") }),
			poder("Agarrar Aprimorado e Engolir", "icons/svg/net.svg",
				p(`<b>Livre:</b> ao acertar um pseudópodo, pode agarrar (teste +${adulta ? 20 : 14}).`,
					`<b>Engolir (padrão):</b> começando o turno agarrando uma criatura ${adulta ? "Grande" : "Média"} ou menor, faz outro teste de agarrar; se vencer, engole. A criatura engolida continua agarrada e sofre <b>2d6+${adulta ? 9 : 8} de ácido</b> no início de cada turno da ameba.`,
					"<b>Escapar:</b> causar 10 de dano à membrana (Defesa 10); sai caída na frente da ameba. <b>Núcleo:</b> em vez de escapar, ataca o núcleo (Defesa 12), ignorando a RD e causando o dobro de dano.",
					`<b>Paralisia:</b> quem é engolido fica paralisado por 1 minuto (Fortitude CD ${adulta ? 21 : 18} evita; quem passa fica imune por um dia).`,
					"Macro: <i>Templo · Criaturas › Ameba: engolir</i> e <i>Ameba: digestão</i>."),
				{ exec: "action", rolls: [["Ácido (engolido)", [[`2d6+${adulta ? 9 : 8}`, "acido"]]]] })
		]
	});
	atores.ameba = await ameba(false);
	atores.amebaAdulta = await ameba(true);

	const BIO_ESTATUA = p("<b>Estátua animada:</b> igual a um golem de ferro (ficha do compêndio), mas <b>só faz uma ação de movimento OU uma ação padrão por rodada</b>. Ataca automaticamente (sem tabela de Reações).",
		"É muito mais forte que o grupo de propósito: as estátuas são vencidas com histórias, memórias e respostas, não com espadas.");
	const umaAcao = fx("Uma ação por rodada", `${T20I}/ameacas/golem-de-ferro.png`, [], { description: "Só uma ação de movimento ou uma ação padrão por rodada." });
	atores.estatua = await clonarAmeaca("jiX0Itt2On27hc30", "Estátua Animada", {
		role: "estatua",
		bio: BIO_ESTATUA + ONDE("Altar Vazio (2), Salão Principal (4), Escadaria do Nível 2 (2) e Salão da Memória (12, com bestas)."),
		effects: [umaAcao]
	});
	atores.estatuaBesta = await clonarAmeaca("jiX0Itt2On27hc30", "Estátua Animada com Besta", {
		role: "estatuaBesta",
		bio: BIO_ESTATUA + p("<b>Salão da Memória (Nível 3):</b> falam umas por cima das outras em gnômico, repetindo as quatro perguntas, e atiram. Se o grupo atravessar o rio, largam as bestas e atacam com espadas (use a Pancada).",
			"<b>Inferido:</b> o livro não dá a ficha da besta. Usei o bônus de Luta do golem e o dano de uma besta pesada (1d12, 19)."),
		items: [arma("Besta", `${T20I}/itens/equipamentos/besta-pesada.webp`, { pericia: "luta", atributo: "", proposito: "disparo", dano: "1d12", tipo: "perfuracao", critM: 19, alcance: "medium" })],
		effects: [fx("Uma ação por rodada", `${T20I}/ameacas/golem-de-ferro.png`, [], { description: "Só uma ação de movimento ou uma ação padrão por rodada." })]
	});
	atores.ganchador = await clonarAmeaca("jS2c38gj0TLUuOgr", "Ganchador do Templo", {
		role: "ganchador",
		bio: p("Fez seu covil nos corredores sudoeste do Nível 1. Fica de tocaia, atraído pelo barulho de quem remove o desabamento. Usa a tabela de Reações, mas foge ou se afasta em qualquer resultado de diálogo.",
			"Ficha do compêndio do sistema (o livro remete ao ganchador do básico).")
	});

	atores.ferreiro = await criarNPC({
		name: "Autômato Ferreiro Arruinado (Estátua Executora)",
		tokenName: "Autômato ferreiro",
		role: "ferreiro",
		img: `${T20I}/ameacas/golem-de-ferro.png`,
		nd: 3,
		cd: 25,
		tipo: "con",
		papel: "special",
		atr: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
		pv: 100,
		def: 10,
		walk: 0,
		bio: p("Sala de Reparos Arruinada (Nível 2, Sala 8). Em vez de consertar, golpeia o que está na bigorna e qualquer criatura ao redor: trate como a armadilha <b>Estátua Executora</b>.",
			"Dá para atrair mecanículos ou criaturas para cá e fazer delas as vítimas. A bigorna funciona.",
			"<b>Inferido:</b> o livro não dá PV nem Defesa ao autômato; os números são só para ter um token."),
		items: [
			arma("Martelo (golpe 1)", `${T20I}/itens/equipamentos/martelo-de-guerra.webp`, { dano: "1d12+10", tipo: "impacto", desc: p("Reflexos CD 25 evita.") }),
			arma("Martelo (golpe 2)", `${T20I}/itens/equipamentos/martelo-de-guerra.webp`, { dano: "1d12+10", tipo: "impacto", desc: p("Reflexos CD 25 evita (teste separado).") })
		]
	});

	atores.porta = await criarNPC({
		name: "Porta de Ferro Pesada",
		tokenName: "Porta de ferro",
		role: "porta",
		img: "icons/svg/door-closed.svg",
		nd: "1/4",
		cd: 25,
		tipo: "con",
		papel: "special",
		atr: { for: 0, des: -2, con: 0, int: 0, sab: 0, car: 0 },
		pv: 100,
		def: 8,
		walk: 0,
		disposition: 0,
		res: { dano: { base: 10 } },
		bio: p("Defesa 8, RD 10, 100 PV, CD 25. Derrubá-la conta como <b>ruído de nível 5</b>.",
			"Fica no Mecanismo de Segurança (Nível 1, Sala 8), nas duas entradas do Salão Principal (Sala 14) e na Armadilha de Afogamento (Nível 2, Sala 4).")
	});

	/* ---------- Armadilhas (fonte única para o ator, a macro e o diário) ---------- */
	const ARMADILHAS = {
		agulha: { nome: "Agulha com Peçonha (Entrada B)", onde: "Fechadura da Entrada B", nd: "1/4", det: "Investigação 20 ou Percepção 25", des: "Ladinagem 25 (Ofício [engenhoqueiro] substitui)",
			efeito: "Perda de 1d12 PV por rodada durante 3 rodadas; Fortitude CD 20 reduz para 1 rodada. Arrombar a fechadura é Ladinagem 25 (não existe chave). Rearma em 1d4 dias, com mecanismos novos; o Templo só tem mana para mais 1d6 iterações do veneno.",
			res: ["fort", 20, "uma"], perda: "1d12", rodadas: 3, ic: "icons/svg/poison.svg" },
		pendulo: { nome: "Pêndulo de Teto", onde: "Nível 1, Sala 3 (Altar e Oferendas)", nd: 1, det: "Investigação 25", des: "Ladinagem 20",
			efeito: "1d12+10 de corte; Reflexos CD 25 evita. Dispara ao mexer nos tesouros ou no altar.", res: ["refl", 25, "evita"], dano: "1d12+10[corte]", ic: "icons/svg/sword.svg" },
		teto: { nome: "Teto Esmagador", onde: "Nível 1, Sala 7 (Antessala do Mecanismo de Segurança)", nd: 4, det: "Investigação 20", des: "Ladinagem 20", ruido: 5,
			efeito: "8d6 de impacto numa área de 3m de lado; Reflexos CD 25 reduz à metade. Ativada por peso: qualquer criatura maior que Pequena, ou Pequena com mais de 4 espaços de equipamento.", res: ["refl", 25, "metade"], dano: "8d6[impacto]", ic: "icons/svg/falling.svg" },
		runa: { nome: "Runa de Proteção", onde: "Corredores para o Salão Principal (Nível 1)", nd: 2, det: "Investigação 25", des: "Ladinagem 25",
			efeito: "6d6 de eletricidade em todas as criaturas a até 3m; Reflexos CD 20 reduz à metade (quem ativou não tem direito ao teste). Só detecta criaturas vivas; os mecanículos não a ativam.", res: ["refl", 20, "metade"], dano: "6d6[eletricidade]", ativador: true, ic: "icons/svg/lightning.svg" },
		fossoTriplo: { nome: "Fosso Triplo", onde: "Nível 1, Sala 15 (Antessala do Salão Principal)", nd: 4, det: "Investigação 20", des: "Ladinagem 20",
			efeito: "Queda de 18m: 12d6 de impacto; Reflexos CD 20 evita. Para escalar de volta: três sucessos seguidos em Atletismo CD 20. Quem cai chega ao Nível 3 (Sala 3). Detectar a armadilha pode revelar que o fosso é uma passagem para o nível mais fundo.", res: ["refl", 20, "evita"], dano: "12d6[impacto]", cai: true, ic: "icons/svg/falling.svg" },
		gas: { nome: "Gás Venenoso", onde: "Nível 1, Sala 15 (o baú entreaberto)", nd: 3, det: "Investigação 25", des: "Ladinagem 25",
			efeito: "Perda de 1d12 PV por veneno por rodada durante 2d4 rodadas; Fortitude CD 20 reduz à metade. O ouro do baú é ilusão (Vontade CD 18 para notar).", res: ["fort", 20, "metadePerda"], perda: "1d12", rodadas: "2d4", ic: "icons/svg/poison.svg" },
		afogamento: { nome: "Sala Alagada (Armadilha de Afogamento)", onde: "Nível 2, Sala 4", nd: 3, det: "Investigação 25", des: "Ladinagem 25", ruido: 3,
			efeito: "Uma rodada depois que o primeiro entra, a porta de ferro se fecha e a sala se enche em 1d4 rodadas. Depois disso: prender o fôlego (1 + Con rodadas, então Fortitude CD 15 +1 por teste; falha = inconsciente e perde 1d6 PV por rodada). Lutar lá dentro: –5 em testes de For, Des e Con e na Defesa; magia em condição ruim. A porta abre depois de uma hora e há 1d4 rodadas até rearmar. Ativada ao passar pela porta (mecanismo mágico).", agua: true, ic: `${T20I}/magias/controlar-agua.webp` },
		fossoProfundo: { nome: "Fosso Profundo", onde: "Nível 2, Sala 5 (Área Desabada)", nd: "1/2", det: "Investigação 20", des: "Ladinagem 20",
			efeito: "Queda de 6m: 4d6 de impacto; Reflexos CD 20 evita. Atletismo CD 20 para escalar de volta.", res: ["refl", 20, "evita"], dano: "4d6[impacto]", cai: true, ic: "icons/svg/falling.svg" },
		executora: { nome: "Estátua Executora", onde: "Nível 2, Sala 8 (Sala de Reparos Arruinada)", nd: 3, det: "Investigação 20", des: "Ladinagem 20",
			efeito: "1d12+10 mais 1d12+10 de impacto (esmagamento); dois testes de Reflexos CD 25, cada um evita um dos danos.", res: ["refl", 25, "dois"], dano: "1d12+10[impacto]", ic: `${T20I}/ameacas/golem-de-ferro.png` },
		simbolo: { nome: "Símbolo do Atordoamento", onde: "Nível 2, Sala 12 (tampa do baú da Escadaria)", nd: 5, det: "Investigação 30", des: "Ladinagem 30",
			efeito: "Criaturas em alcance curto ficam atordoadas por 1d6 rodadas; Fortitude CD 25 evita. Com o grupo atordoado, as duas estátuas atacam um a um até todos morrerem.", res: ["fort", 25, "evita"], status: "atordoado", rodadasStatus: "1d6", ic: "icons/svg/daze.svg" },
		desabamento: { nome: "Desabamento do Teto", onde: "Escadaria das Salas 8/9 para o Altar Mecânico (Nível 2)", nd: 6, det: "Investigação 25", des: "Ladinagem 25", ruido: 5,
			efeito: "15d6 de impacto em todas as criaturas numa área de 6m. O teto cai em três fases (uma por degrau): um teste de Iniciativa CD 20 por fase para escapar. Quem falha nos três faz Reflexos CD 30 para reduzir à metade.", res: ["refl", 30, "metade"], dano: "15d6[impacto]", fases: true, ic: "icons/svg/falling.svg" }
	};

	atores.armadilhas = await criarNPC({
		name: "Templo do Vácuo · Armadilhas",
		tokenName: "Armadilhas do Templo",
		role: "armadilhas",
		disposition: 0,
		img: "icons/svg/trap.svg",
		nd: 4,
		cd: 20,
		tipo: "con",
		papel: "special",
		atr: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
		pv: 1,
		def: 10,
		bio: p("<b>Ator de apoio, não vai para o mapa.</b> Cada item é uma armadilha do Templo com as CDs do livro. A macro <i>Templo · Armadilhas</i> rola as resistências nos tokens mirados e aplica dano, perda de PV e condições."),
		items: Object.values(ARMADILHAS).map((a) => poder(a.nome, a.ic,
			p(`<b>Onde:</b> ${a.onde}. <b>ND ${a.nd}.</b>`, a.efeito, `<b>Detectar:</b> ${a.det}. <b>Desarmar:</b> ${a.des}.${a.ruido ? ` <b>Ruído ${a.ruido}</b> ao disparar.` : ""}`),
			{ exec: "passive", rolls: a.dano ? [["Dano", [[a.dano.replace(/\[.*\]/, ""), a.dano.match(/\[(.*)\]/)?.[1] ?? ""]]]] : [] }))
	});

	/* ------------------------------------------------------------------ */
	/* 3. Itens                                                             */
	/* ------------------------------------------------------------------ */
	const itemDoc = (d) => ({ ...d, folder: pasta.Item, flags: FLAGS() });
	const tesouro = (name, img, html) => itemDoc({ name, type: "tesouro", img, system: { description: { value: html }, qtd: 1, preco: 0, peso: 0, espacos: 0 } });
	const ENGENHOSIDADE_DESC = p("<b>Altar da Memória (Templo do Vácuo).</b> Quando faz um teste de perícia, você pode gastar <b>2 PM</b> para somar sua Inteligência no teste. Não vale para testes de ataque. Se receber esta habilidade de novo, o custo cai em –1 PM.",
		"Marque o aprimoramento na janela de rolagem. A macro <i>Templo · Mecanismos › Altar da Memória</i> ajusta o bônus à Inteligência do personagem quando entrega o poder.");
	const itensCriados = await Item.createDocuments([
		itemDoc({ ...poder("Engenhosidade (Altar da Memória)", "icons/magic/control/mouth-smile-deception-purple.webp", ENGENHOSIDADE_DESC,
			{ tipo: "geral", exec: "free", custo: 2, effects: [aoUsar("Engenhosidade (+Int)", "icons/magic/control/mouth-smile-deception-purple.webp", [["roll", 2]], ["skill"])] }), flags: FLAGS("engenhosidade") }),
		tesouro("Anotações de Kizadrinni Odello (1, 2 e 3)", `${T20I}/itens/gerais/pergaminho.webp`,
			p("Pergaminhos da exploradora que estudou o espaço de masmorra. O texto está no diário (handouts). O autor sugere trocar Kizadrinni por um NPC ligado ao histórico de algum PJ.")),
		tesouro("Diário do Aventureiro Morto", `${T20I}/itens/gerais/diario.webp`,
			p("Perto da escada da Sala Alagada (Nível 1, Sala 4). Só a última página é legível; o texto está no diário.")),
		tesouro("Livro Semidestruído (história do Herói Louco)", `${T20I}/itens/gerais/livro.webp`,
			p("Sala de Reparos Arruinada (Nível 2, Sala 8). Algumas páginas legíveis contam uma história do Herói Louco: serve para passar pelas estátuas do Altar Vazio.")),
		tesouro("Mapa para uma Masmorra em Sambúrdia", `${T20I}/itens/gerais/pergaminho.webp`,
			p("Com aventureiros mortos há pouco tempo no Altar Mecânico (Nível 2, Sala 14). Marca uma masmorra nas Repúblicas Livres de Sambúrdia. Eles não tentavam chegar aqui: vieram parar por acidente, pelo espaço de masmorra.")),
		tesouro("Tabuletas dos Túmulos de Fremdak e Zonzibor", `${T20I}/itens/gerais/pergaminho.webp`,
			p("Tabuletas de pedra em gnômico, nos túmulos (Nível 2, Sala 11). Com Compreensão:",
				"<i>\"Parabéns, você provou ser mesmo esperto! A partir de agora, os espertos não constroem... Eles roubam!\"</i>",
				"<i>\"Parabéns, você provou ser mesmo engenhoso! O que é mais engenhoso? Criar algo ou enganar quem criou? Acho que você sabe a resposta!\"</i>",
				"Junto: gemas sortidas e instrumentos de ofício (tesouro ND 4, 1 rolagem em dinheiro).")),
		tesouro("Kit de Ofício (engenhoqueiro) e Gazua dos Túmulos", `${T20I}/itens/gerais/kit-oficio.webp`,
			p("Dos túmulos dos arquitetos (Nível 2, Sala 11). Use os itens do compêndio de equipamentos se quiser as regras completas."))
	]);
	const itemPorNome = (inicio) => itensCriados.find((i) => i.name.startsWith(inicio));

	/* ------------------------------------------------------------------ */
	/* 4. Tabelas                                                           */
	/* ------------------------------------------------------------------ */
	// [de, até, texto, grupos: [papel, quantidade]]
	const ENCONTROS = [
		[1, 5, "Nada", []],
		[6, 8, "1d6 tiranos das águas", [["tirano", "1d6"]]],
		[9, 10, "Monstro da ferrugem", [["ferrugem", "1"]]],
		[11, 12, "1d6 mecanículos", [["mecanico", "1d6"]]],
		[13, 15, "1d6 tiranos das águas e 1 tirano das águas barão", [["tirano", "1d6"], ["barao", "1"]]],
		[16, 17, "1d2 estátuas animadas", [["estatua", "1d2"]]],
		[18, 19, "Ameba gigante", [["ameba", "1"]]],
		[20, 20, "Ameba gigante e monstro da ferrugem", [["ameba", "1"], ["ferrugem", "1"]]],
		[21, 21, "Ganchador", [["ganchador", "1"]]],
		[22, 22, "Ameba gigante, monstro da ferrugem e ganchador", [["ameba", "1"], ["ferrugem", "1"], ["ganchador", "1"]]],
		[23, 23, "1d6 tiranos das águas e ameba gigante", [["tirano", "1d6"], ["ameba", "1"]]],
		[24, 24, "1d6 tiranos das águas, 2 tiranos das águas barões e ameba gigante", [["tirano", "1d6"], ["barao", "2"], ["ameba", "1"]]],
		[25, 99, "2 estátuas animadas e ganchador", [["estatua", "2"], ["ganchador", "1"]]]
	];
	const REACOES = [
		[-99, 0, "Ataca instantaneamente, lutando até a morte."],
		[1, 2, "Ataca, mas foge se estiver perdendo."],
		[3, 4, "Ataca se houver algo a ganhar (como tesouro). Foge se estiver perdendo."],
		[5, 5, "Ameaça. O grupo tem uma rodada para reagir (preparar-se ou tentar acabar com as hostilidades)."],
		[6, 6, "Ameaça de longe. O grupo tem duas rodadas para reagir."],
		[7, 7, "Evita o grupo. É visto de longe, mas não toma atitude nenhuma."],
		[8, 8, "Mostra-se receoso, mas não hostil. Sente-se ameaçado, mas pode colaborar se abordado."],
		[9, 9, "Mostra-se não hostil. Não se sente ameaçado e pode arranjar colaboração com sua facção se abordado."],
		[10, 10, "Pede ajuda contra outras facções. Com boa interação, pode arranjar colaboração com sua facção."],
		[11, 99, "Oferece ajuda contra outras facções."]
	];
	const MEMORIAS = [
		"Tecnologia mecanomágica. O cristal rosado sendo minerado e usado como parte integral desses mecanismos.",
		"Animais nunca vistos em Arton: criaturas mecânicas que de alguma forma nascem naturalmente. A gravidez e o parto como construção de autômatos.",
		"Uma sociedade guiada por exatidão, que \"domou\" a realidade com ela. Relógios por toda parte, marcando as horas com uma precisão que Arton não precisa.",
		"O nome que a raça tinha para si mesma: gnomos. Um povo que quase não fazia guerra, pacífico exceto pelos acidentes com suas invenções. Não tinham orgulho de si: tinham felicidade de ser quem eram.",
		"A vida sob Tilliann, a criatividade e a manufatura como atos sagrados. A noite em que a queda foi sentida: o choque, a falta de inspiração, mecanismos complexos que de repente não funcionavam."
	];

	const tabelaEncontros = await RollTable.create({
		name: "Encontros no Templo do Vácuo",
		img: "icons/svg/ruins.svg",
		folder: pasta.RollTable,
		flags: FLAGS("encontrosTemplo"),
		formula: "1d20",
		replacement: true,
		displayRoll: true,
		description: "Role ao entrar numa sala sem criaturas definidas, somando o nível de ruído do grupo (a macro Templo · Exploração faz isso e rola a reação).",
		results: ENCONTROS.map(([a, b, name]) => ({ type: "text", range: [a, b], weight: 1, name, description: "" }))
	});
	const tabelaReacoes = await RollTable.create({
		name: "Reações dos Encontros (Templo do Vácuo)",
		img: "icons/svg/terror.svg",
		folder: pasta.RollTable,
		flags: FLAGS("reacoesTemplo"),
		formula: "1d6",
		replacement: true,
		displayRoll: true,
		description: "1d6 + o Carisma do personagem mais próximo (o menor, se houver empate). Diálogo ativo antes de ser notado: teste social, cada 5 pontos vale um resultado. Ganchador e monstro da ferrugem fogem nos resultados de diálogo; estátuas, amebas, cardumes e a cocatriz atacam direto (resultado 0).",
		results: REACOES.map(([a, b, name]) => ({ type: "text", range: [a, b], weight: 1, name, description: "" }))
	});
	const tabelaMemorias = await RollTable.create({
		name: "Memórias dos Gnomos",
		img: "icons/svg/book.svg",
		folder: pasta.RollTable,
		flags: FLAGS("memoriasTemplo"),
		formula: "1d5",
		replacement: true,
		displayRoll: true,
		description: "O tributo do Salão Principal: cada um entrega uma memória querida e recebe uma destas. Invente outras à vontade.",
		results: MEMORIAS.map((name, i) => ({ type: "text", range: [i + 1, i + 1], weight: 1, name: `Memória ${i + 1}`, description: name }))
	});

	/* ------------------------------------------------------------------ */
	/* 5. Macros de mesa                                                    */
	/* ------------------------------------------------------------------ */
	// Cada macro recebe DADOS (injetados como JSON no comando) e guarda o progresso
	// numa flag do usuário Mestre: world.fdtTemplo.

	const PERICIAS = { sobr: "Sobrevivência", conh: "Conhecimento", perc: "Percepção", inve: "Investigação", ofic: "Ofício", reli: "Religião", mist: "Misticismo", guer: "Guerra", ades: "Adestramento", atle: "Atletismo", dipl: "Diplomacia", nobr: "Nobreza", furt: "Furtividade", cura: "Cura", intu: "Intuição", acro: "Acrobacia", ladi: "Ladinagem", vont: "Vontade", fort: "Fortitude", refl: "Reflexos", inic: "Iniciativa", luta: "Luta", for: "Força" };
	const ENTRADAS = {
		A: "<b>Entrada A:</b> porta estreita entre duas colinas que parecem cair uma sobre a outra. Ladinagem CD 20 para destrancar. Lá dentro, a sala se fecha e desce: é um elevador (ruído 3) até a Área de Entrada A. Pula as primeiras salas.",
		B: "<b>Entrada B:</b> caverna estreita (todos menos os menores andam abaixados) com uma porta de pedra no fundo. Não há chave: Ladinagem CD 25 para arrombar, e a fechadura solta a agulha com peçonha. Leva a uma parte avançada, mais perto dos tesouros e dos perigos.",
		C: "<b>Entrada C:</b> túnel escondido por rochas desabadas, quase em linha reta para baixo. Sem porta: um tapete vermelho para invasores. Começa do começo da masmorra."
	};

	async function macroBusca(D) {
		const ESTADO = "fdtTemplo";
		const est = foundry.utils.deepClone(game.user.getFlag("world", ESTADO) ?? {});
		const b = est.busca ?? { sucessos: 0, testes: 0, usadas: [], entradas: [] };
		const atores = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		const cd = 15 + 2 * b.testes;
		const opPer = Object.entries(D.pericias).filter(([k]) => !["vont", "fort", "refl", "inic", "luta", "for"].includes(k))
			.map(([k, n]) => {
				const usada = k !== "sobr" && b.usadas.includes(k);
				return `<option value="${k}" ${usada ? "disabled" : ""}>${n}${usada ? " (já usada)" : ""}</option>`;
			}).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Busca pelo Templo do Vácuo" },
			content: `
				<p>Teste estendido: <b>7 sucessos</b>. CD atual <b>${cd}</b> (15, +2 por teste). Progresso: <b>${b.sucessos}/7</b> em ${b.testes} teste(s), ${(b.testes / 2).toFixed(1)} dia(s).
				Só Sobrevivência pode repetir. Cada teste leva meio dia; cada falha custa 1d8 PV.${b.entradas.length ? ` Entradas achadas: <b>${b.entradas.join(", ")}</b>.` : ""}</p>
				<div class="form-group"><label>O que aconteceu</label><select name="acao">
					<option value="rolar">Rolar (o primeiro token selecionado faz o teste)</option>
					<option value="npc">NPC muito amigo ajudou: sucesso automático</option>
					<option value="zerar">Zerar o progresso</option></select></div>
				<div class="form-group"><label>Perícia</label><select name="per">${opPer}</select></div>
				<div class="form-group"><label>Bônus (ajuda de NPC etc.)</label><input type="number" name="mod" value="0"></div>
				<div class="form-group"><label>Falha fere todos os selecionados</label><input type="checkbox" name="todos"></div>
				<div class="form-group"><label>Rolar o encontro do dia nas Colinas</label><input type="checkbox" name="encontro" checked></div>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "zerar") return game.user.unsetFlag("world", `${ESTADO}.busca`);
		const rolls = [];
		let html = "<h3>Busca pelo Templo do Vácuo</h3>";
		if (res.acao === "rolar") {
			const a = atores[0];
			if (!a) return ui.notifications.warn("Selecione o token de quem faz o teste (e, se quiser, o resto do grupo).");
			const bonus = (k) => {
				if (k === "ofic") return Math.max(0, ...Object.entries(a.system.pericias ?? {}).filter(([kk]) => kk.startsWith("ofi")).map(([, v]) => Number(v?.value) || 0));
				return Number(a.system.pericias?.[k]?.value) || 0;
			};
			const r = await new Roll(`1d20 + ${bonus(res.per)} + ${Number(res.mod) || 0}`).evaluate();
			rolls.push(r);
			const ok = r.total >= cd;
			b.testes++;
			if (res.per !== "sobr" && !b.usadas.includes(res.per)) b.usadas.push(res.per);
			html += `<p>${a.name} · ${D.pericias[res.per]} <b>${r.total}</b> contra CD ${cd}: ${ok ? "✔️ sucesso" : "❌ falha"}</p>`;
			if (ok) b.sucessos++;
			else {
				const alvos = res.todos ? atores : [a];
				for (const x of alvos) {
					const d = await new Roll("1d8").evaluate();
					rolls.push(d);
					await x.update({ "system.attributes.pv.value": x.system.attributes.pv.value - d.total });
					html += `<p>${x.name} perde <b>${d.total} PV</b> (quedas, fadiga). Só recupera com descanso.</p>`;
				}
			}
		} else {
			b.testes++;
			b.sucessos++;
			html += "<p>Um NPC com ótima relação com o grupo dá informações valiosas: <b>sucesso automático</b>.</p>";
		}
		html += `<p>Progresso: <b>${Math.min(b.sucessos, 7)}/7</b> sucessos em ${b.testes} teste(s) (${(b.testes / 2).toFixed(1)} dia(s)).</p>`;
		const faltam = ["A", "B", "C"].filter((e) => !b.entradas.includes(e));
		if (b.sucessos >= 7 && faltam.length && b.entradas.length < b.sucessos - 6) {
			const dado = b.entradas.length ? await new Roll(`1d${faltam.length}`).evaluate() : await new Roll("1d3").evaluate();
			rolls.push(dado);
			const entrada = faltam[dado.total - 1];
			b.entradas.push(entrada);
			html += `<h4>${b.entradas.length === 1 ? "O Templo foi encontrado!" : "Outra entrada!"}</h4><p>${D.entradas[entrada]}</p>`;
			if (b.entradas.length === 1) html += "<p>Pelas histórias e evidências do caminho, o grupo percebe que esta não é a única entrada. Cada entrada extra custa mais um sucesso. Conhecimento, Ofício (engenheiro) ou Sobrevivência CD 20 revelam as particularidades de cada uma.</p>";
		} else if (b.sucessos >= 7 && !faltam.length) html += "<p>As três entradas já foram achadas.</p>";
		await game.user.setFlag("world", `${ESTADO}.busca`, b);
		await ChatMessage.create({ content: html, rolls, whisper: ChatMessage.getWhisperRecipients("GM") });
		if (res.encontro && b.testes % 2 === 0) {
			const m = game.macros.find((x) => x.getFlag("world", "fdtRole") === "encontroColinas");
			if (m) return m.execute();
			const t = game.tables.find((x) => x.name === "Encontros nas Colinas Centrais");
			if (t) return t.draw();
			ui.notifications.info("Fim do dia: role um encontro nas Colinas Centrais.");
		}
	}

	async function macroExploracao(D) {
		const ESTADO = "fdtTemplo";
		const est = foundry.utils.deepClone(game.user.getFlag("world", ESTADO) ?? {});
		const x = est.exp ?? { ruido: 1, extras: 0, unidades: 0, cenas: 0 };
		const NIVEIS = ["0 · silêncio total (parado, Furtividade, Silêncio)", "1 · sussurros, meio deslocamento, destrancar, desarmar", "2 · voz normal, deslocamento normal", "3 · discussão, risada, combate, correr, elevador", "4 · berrar, música, bater escudos", "5 · desabamento, chamar atenção de propósito"];
		const opRuido = NIVEIS.map((n, i) => `<option value="${i}" ${i === x.ruido ? "selected" : ""}>${n}</option>`).join("");
		const opTipo = Object.entries(D.nomes).map(([k, n]) => `<option value="${k}">${n}</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Templo do Vácuo · Exploração" },
			position: { width: 480 },
			content: `
				<p>Ruído atual <b>${x.ruido + x.extras}</b> (alerta a ${9 * (x.ruido + x.extras)}m). Cena: ${x.unidades}/6 (sala = 3, corredor = 1). Cenas passadas: ${x.cenas}.</p>
				<div class="form-group"><label>Ação</label><select name="acao">
					<option value="sala">Entrar numa sala sem criaturas definidas (rola encontro)</option>
					<option value="corredor">Atravessar um corredor</option>
					<option value="definida">Sala com criaturas do livro (só reação)</option>
					<option value="reacao">Só rolar a reação</option>
					<option value="ruido">Só mudar o ruído</option>
					<option value="zerar">Zerar a contagem de cena</option></select></div>
				<div class="form-group"><label>Nível de ruído</label><select name="ruido">${opRuido}</select></div>
				<div class="form-group"><label>Armaduras pesadas, Grandes e montarias</label><input type="number" name="extras" value="${x.extras}" min="0"></div>
				<div class="form-group"><label>Criatura (reação sem encontro)</label><select name="tipo">${opTipo}</select></div>
				<div class="form-group"><label>Teste social antes de serem notados (0 = não)</label><input type="number" name="social" value="0"></div>
				<div class="form-group"><label>Colocar os tokens na cena</label><input type="checkbox" name="tokens" checked></div>
				<div class="form-group"><label>Encerrar efeitos de cena ao completar uma cena</label><input type="checkbox" name="fimCena"></div>
				<p style="font-size:0.85em">Selecione os personagens mais próximos das criaturas: a reação usa o menor Carisma entre eles.</p>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		x.ruido = Number(res.ruido) || 0;
		x.extras = Math.max(0, Number(res.extras) || 0);
		const ruido = x.ruido + x.extras;
		const rolls = [];
		let html = "";
		if (res.acao === "zerar") { x.unidades = 0; x.cenas = 0; html = "<p>Contagem de cena zerada.</p>"; }
		if (res.acao === "ruido") html = `<h3>Ruído ${ruido}</h3><p>Alerta os habitantes num raio de <b>${9 * ruido}m</b> (${6 * ruido} quadrados), por espaços abertos. Portas e paredes param o som.</p>`;

		const grupos = [];
		if (res.acao === "sala") {
			const r = await new Roll(`1d20 + ${ruido}`).evaluate();
			rolls.push(r);
			const linha = D.encontros.find(([a, b2]) => r.total >= a && r.total <= b2) ?? D.encontros.at(-1);
			html += `<h3>Encontro no Templo · ${r.total}</h3><p>1d20 + ruído ${ruido}: <b>${linha[2]}</b>.</p>`;
			for (const [papel, qtd] of linha[3]) {
				const q = await new Roll(qtd).evaluate();
				if (qtd.includes("d")) rolls.push(q);
				grupos.push([papel, q.total]);
			}
		}
		if (res.acao === "definida" || res.acao === "reacao") grupos.push([res.tipo, 0]);

		if (grupos.length) {
			const atores = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
			let base;
			let comoFoi;
			const social = Number(res.social) || 0;
			if (social > 0) {
				base = Math.max(0, Math.ceil(social / 5) - 1);
				comoFoi = `teste social ${social} → resultado ${base}`;
			} else {
				const car = atores.length ? Math.min(...atores.map((a) => Number(a.system.atributos?.car?.value) || 0)) : 0;
				const r = await new Roll(`1d6 + ${car}`).evaluate();
				rolls.push(r);
				base = r.total;
				comoFoi = `1d6 + Carisma ${car}${atores.length ? "" : " (nenhum token selecionado)"} = ${r.total}`;
			}
			const reacao = (v) => (D.reacoes.find(([a, b2]) => v >= a && v <= b2) ?? D.reacoes.at(-1))[2];
			html += `<h4>Reação (${comoFoi})</h4><ul>`;
			for (const [papel, qtd] of grupos) {
				const modo = D.modos[papel] ?? "normal";
				let txt;
				if (modo === "ataca") txt = "Ataca automaticamente, sem negociar (resultado 0): " + reacao(0);
				else if (modo === "bestial" && base >= 8) txt = "Foge ou se afasta (não entende diálogo).";
				else txt = reacao(base);
				html += `<li><b>${qtd ? `${qtd}× ` : ""}${D.nomes[papel]}</b>: ${txt}</li>`;
			}
			html += "</ul>";
			if (res.tokens && canvas.scene) {
				const ref = canvas.tokens.controlled[0];
				const gs = canvas.grid.size;
				const cx = ref ? ref.document.x : canvas.stage.pivot.x - gs / 2;
				const cy = ref ? ref.document.y : canvas.stage.pivot.y - gs / 2;
				const docs = [];
				let i = 0;
				for (const [papel, qtd] of grupos) {
					if (!qtd) continue;
					const modelo = game.actors.find((a) => a.getFlag("world", "fdt") === "a1templo" && a.getFlag("world", "fdtRole") === papel);
					if (!modelo) continue;
					for (let n = 0; n < qtd; n++, i++) {
						const ang = (i / 8) * 2 * Math.PI;
						const raio = 4 + Math.floor(i / 8) * 2;
						const td = await modelo.getTokenDocument({ x: cx + Math.round(Math.cos(ang) * raio) * gs, y: cy + Math.round(Math.sin(ang) * raio) * gs, hidden: true });
						docs.push(td.toObject());
					}
				}
				if (docs.length) {
					await canvas.scene.createEmbeddedDocuments("Token", docs);
					html += `<p style="font-size:0.85em">${docs.length} token(s) colocados <b>ocultos</b> em volta ${ref ? `de ${ref.name}` : "do centro da tela"}. Mova e revele quando o grupo os vir.</p>`;
				}
			}
		}

		if (res.acao === "sala" || res.acao === "definida" || res.acao === "corredor") {
			x.unidades += res.acao === "corredor" ? 1 : 3;
			if (x.unidades >= 6) {
				x.unidades -= 6;
				x.cenas++;
				html += "<h4>Passou uma cena</h4><p>Tochas e lampiões acesos se apagam (duram uma cena). Efeitos de duração cena terminam. Contem as tochas e rações!</p>";
				if (res.fimCena) await globalThis.tormenta20?.utils?.endScene?.();
			}
		}
		await game.user.setFlag("world", `${ESTADO}.exp`, x);
		if (html) await ChatMessage.create({ content: html + `<p style="font-size:0.8em">Ruído ${ruido} · cena ${x.unidades}/6</p>`, rolls, whisper: ChatMessage.getWhisperRecipients("GM") });
	}

	async function macroEscuridao() {
		if (!canvas.scene) return ui.notifications.warn("Abra a cena do Templo.");
		const cena = canvas.scene;
		const ativa = cena.getFlag("world", "fdtEscuridao");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Escuridão do Templo" },
			content: `
				<p>Dentro do Templo, luz mágica e mundana iluminam <b>metade</b> do normal e <b>visão no escuro e na penumbra não funcionam</b>. Escuridão está <b>${ativa ? "LIGADA" : "desligada"}</b> nesta cena.</p>
				<div class="form-group"><label>Ação</label><select name="acao">
					<option value="alternar">${ativa ? "Desligar" : "Ligar"} a escuridão do Templo</option>
					<option value="tocha">Acender tocha nos tokens selecionados (9m)</option>
					<option value="lampiao">Acender lampião nos tokens selecionados (15m)</option>
					<option value="apagar">Apagar a luz dos tokens selecionados</option></select></div>
				<p style="font-size:0.85em">Ligar guarda a luz e a visão de cada token e de cada luz da cena, e desligar restaura. Tokens colocados depois de ligar não são ajustados: rode de novo (desligar e ligar).</p>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const fator = cena.getFlag("world", "fdtEscuridao") ? 0.5 : 1;
		if (res.acao === "tocha" || res.acao === "lampiao" || res.acao === "apagar") {
			const raio = res.acao === "tocha" ? 9 : res.acao === "lampiao" ? 15 : 0;
			const ups = canvas.tokens.controlled.map((t) => ({ _id: t.id, "light.dim": raio * fator, "light.bright": (raio / 2) * fator, "light.color": raio ? "#ffb35c" : null, "light.animation.type": raio ? "torch" : null }));
			if (!ups.length) return ui.notifications.warn("Selecione os tokens que carregam a luz.");
			return cena.updateEmbeddedDocuments("Token", ups);
		}
		if (!ativa) {
			const tokens = cena.tokens.map((t) => ({
				_id: t.id,
				"flags.world.fdtLuz": { dim: t.light.dim, bright: t.light.bright, range: t.sight.range, mode: t.sight.visionMode },
				"light.dim": t.light.dim / 2,
				"light.bright": t.light.bright / 2,
				"sight.range": 0,
				"sight.visionMode": "basic"
			}));
			const luzes = cena.lights.map((l) => ({ _id: l.id, "flags.world.fdtLuz": { dim: l.config.dim, bright: l.config.bright }, "config.dim": l.config.dim / 2, "config.bright": l.config.bright / 2 }));
			await cena.updateEmbeddedDocuments("Token", tokens);
			if (luzes.length) await cena.updateEmbeddedDocuments("AmbientLight", luzes);
			await cena.update({ "flags.world.fdtEscuridao": { darkness: cena.environment.darknessLevel, global: cena.environment.globalLight.enabled }, "environment.darknessLevel": 1, "environment.globalLight.enabled": false });
			ChatMessage.create({ content: "<p><b>A escuridão do Templo do Vácuo</b> engole a luz: tochas e magias iluminam metade, e nenhum olho enxerga no escuro aqui. Quem está fora da luz fica <b>cego</b>.</p>" });
		} else {
			const tokens = cena.tokens.filter((t) => t.getFlag("world", "fdtLuz")).map((t) => {
				const o = t.getFlag("world", "fdtLuz");
				return { _id: t.id, "light.dim": o.dim, "light.bright": o.bright, "sight.range": o.range, "sight.visionMode": o.mode, "flags.world.-=fdtLuz": null };
			});
			const luzes = cena.lights.filter((l) => l.getFlag("world", "fdtLuz")).map((l) => {
				const o = l.getFlag("world", "fdtLuz");
				return { _id: l.id, "config.dim": o.dim, "config.bright": o.bright, "flags.world.-=fdtLuz": null };
			});
			if (tokens.length) await cena.updateEmbeddedDocuments("Token", tokens);
			if (luzes.length) await cena.updateEmbeddedDocuments("AmbientLight", luzes);
			await cena.update({ "environment.darknessLevel": ativa.darkness ?? 0, "environment.globalLight.enabled": ativa.global ?? false, "flags.world.-=fdtEscuridao": null });
			ui.notifications.info("Escuridão do Templo desligada: luz e visão restauradas.");
		}
	}

	async function macroArmadilhas(D) {
		const alvos = [...(game.user.targets.size ? game.user.targets : canvas.tokens.controlled)].filter((t) => t.actor);
		const opArm = Object.entries(D.armadilhas).map(([k, a]) => `<option value="${k}">${a.nome} (ND ${a.nd})</option>`).join("");
		const opAtiv = `<option value="">ninguém / não se aplica</option>` + alvos.map((t) => `<option value="${t.id}">${t.name}</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Templo do Vácuo · Armadilhas" },
			position: { width: 480 },
			content: `
				<div class="form-group"><label>Armadilha</label><select name="arm">${opArm}</select></div>
				<div class="form-group"><label>Quem ativou (Runa: sem teste)</label><select name="ativ">${opAtiv}</select></div>
				<div class="form-group"><label>Perda de PV de uma vez (fora de combate)</label><input type="checkbox" name="deUmaVez" checked></div>
				<p style="font-size:0.85em">${alvos.length ? `Alvos: ${alvos.map((t) => t.name).join(", ")}.` : "<b>Mire ou selecione</b> os tokens atingidos."} Dano com RD aplicado sozinho; perda de PV ignora RD.</p>`,
			ok: { label: "Disparar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const a = D.armadilhas[res.arm];
		if (!alvos.length) return ui.notifications.warn("Mire ou selecione os tokens atingidos.");
		const rolls = [];
		const teste = async (actor, k, mod = 0) => {
			const r = await new Roll(`1d20 + ${Number(actor.system.pericias?.[k]?.value) || 0} + ${mod}`).evaluate();
			rolls.push(r);
			return r.total;
		};
		const perder = async (actor, n) => actor.update({ "system.attributes.pv.value": actor.system.attributes.pv.value - n });
		let html = `<h3>${a.nome}</h3><p>${a.efeito}</p><ul>`;
		if (a.agua) {
			const r = await new Roll("1d4").evaluate();
			rolls.push(r);
			html += `<li>A porta de ferro se fecha e a sala se enche em <b>${r.total} rodada(s)</b>. Depois disso, use <i>Testes do Templo › Prender o fôlego</i> a cada rodada.</li>`;
		}
		let danoComum = null;
		if (a.dano && a.res?.[2] !== "dois") { danoComum = await new Roll(a.dano).evaluate(); rolls.push(danoComum); html += `<li>Dano: <b>${danoComum.total}</b></li>`; }
		for (const t of alvos) {
			const ator = t.actor;
			const nome = t.name;
			if (a.agua) continue;
			if (a.fases) {
				let escapou = false;
				const notas = [];
				for (let f = 1; f <= 3 && !escapou; f++) {
					const v = await teste(ator, "inic");
					notas.push(v);
					if (v >= 20) escapou = true;
				}
				if (escapou) { html += `<li>${nome}: Iniciativa ${notas.join(", ")} → escapa do desabamento ✔️</li>`; continue; }
				const v = await teste(ator, "refl");
				const ok = v >= 30;
				await ator.applyDamageV2(danoComum, ok ? 0.5 : 1);
				html += `<li>${nome}: falhou nas três fases (${notas.join(", ")}); Reflexos ${v} ${ok ? "✔️ metade" : "❌ dano total"}</li>`;
				continue;
			}
			if (a.res?.[2] === "dois") {
				let txt = "";
				for (let g = 1; g <= 2; g++) {
					const v = await teste(ator, "refl");
					if (v >= a.res[1]) { txt += ` golpe ${g}: Reflexos ${v} ✔️;`; continue; }
					const d = await new Roll(a.dano).evaluate();
					rolls.push(d);
					await ator.applyDamageV2(d, 1);
					txt += ` golpe ${g}: Reflexos ${v} ❌ ${d.total};`;
				}
				html += `<li>${nome}:${txt}</li>`;
				continue;
			}
			const semTeste = a.ativador && res.ativ === t.id;
			const [k, cd, modo] = a.res ?? [];
			const v = semTeste || !k ? null : await teste(ator, k);
			const ok = v !== null && v >= cd;
			const rotulo = semTeste ? "ativou (sem teste)" : `${D.pericias[k]} ${v}`;
			if (a.perda) {
				const rodadasDado = await new Roll(String(a.rodadas)).evaluate();
				let rodadas = rodadasDado.total;
				if (modo === "uma" && ok) rodadas = 1;
				const meia = modo === "metadePerda" && ok;
				if (res.deUmaVez) {
					const p = await new Roll(`${rodadas}${a.perda.replace(/^\d+/, "")}`).evaluate();
					rolls.push(p);
					const total = meia ? Math.floor(p.total / 2) : p.total;
					await perder(ator, total);
					html += `<li>${nome}: ${rotulo} ${ok ? "✔️" : "❌"} → perde <b>${total} PV</b> (${rodadas} rodada(s)${meia ? ", metade" : ""}).</li>`;
				} else {
					await ator.createEmbeddedDocuments("ActiveEffect", [{
						name: `${a.nome}${meia ? " (metade)" : ""}`,
						img: a.ic,
						type: "base",
						duration: { value: rodadas, units: "rounds" },
						description: `Perda de ${meia ? "1d6 (metade de 1d12)" : a.perda} PV por rodada, por ${rodadas} rodada(s). Veneno.`,
						flags: { world: { fdt: "a1templo" } },
						system: { changes: [{ key: "danoContinuo", value: meia ? "1d6[perda]" : `${a.perda}[perda]`, type: "custom", phase: "initial", priority: null }] }
					}]);
					html += `<li>${nome}: ${rotulo} ${ok ? "✔️" : "❌"} → perde ${a.perda}${meia ? " (metade)" : ""} PV por rodada, por <b>${rodadas}</b> rodada(s) (efeito criado).</li>`;
				}
				continue;
			}
			if (a.status) {
				if (ok) { html += `<li>${nome}: ${rotulo} ✔️ resiste</li>`; continue; }
				const r = await new Roll(a.rodadasStatus).evaluate();
				rolls.push(r);
				await ator.toggleStatusEffect(a.status, { active: true });
				html += `<li>${nome}: ${rotulo} ❌ <b>${a.status}</b> por ${r.total} rodada(s)</li>`;
				continue;
			}
			const mult = modo === "evita" ? (ok ? 0 : 1) : (ok ? 0.5 : 1);
			if (mult > 0) await ator.applyDamageV2(danoComum, mult);
			if (a.cai && mult > 0) await ator.toggleStatusEffect("caido", { active: true });
			html += `<li>${nome}: ${rotulo} ${ok ? (modo === "evita" ? "✔️ evita" : "✔️ metade") : "❌ dano total"}${a.cai && mult > 0 ? ", cai no fosso" : ""}</li>`;
		}
		html += "</ul>";
		if (a.ruido) html += `<p><b>Ruído ${a.ruido}</b>: alerta a ${9 * a.ruido}m.</p>`;
		ChatMessage.create({ content: html, rolls });
	}

	async function macroTestes(D) {
		const ESTADO = "fdtTemplo";
		const est = foundry.utils.deepClone(game.user.getFlag("world", ESTADO) ?? {});
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		const op = Object.entries(D.testes).map(([k, t]) => `<option value="${k}">${t.nome}</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Templo do Vácuo · Testes" },
			position: { width: 500 },
			content: `
				<div class="form-group"><label>Situação</label><select name="sit">${op}</select></div>
				<div class="form-group"><label>Modificador extra</label><input type="number" name="mod" value="0"></div>
				<div class="form-group"><label>Boa ideia: sucesso automático (desabamento)</label><input type="checkbox" name="auto"></div>
				<div class="form-group"><label>Zerar o progresso desta situação</label><input type="checkbox" name="zerar"></div>
				<p style="font-size:0.85em">Selecione os tokens. Testes "do grupo" usam o melhor resultado; os outros rolam para cada um, na ordem da seleção.</p>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const t = D.testes[res.sit];
		const mod = Number(res.mod) || 0;
		const rolls = [];
		const bonus = (a, k) => {
			if (k === "for" || k === "con" || k === "int") return Number(a.system.atributos?.[k]?.value) || 0;
			if (k === "ofic") return Math.max(0, ...Object.entries(a.system.pericias ?? {}).filter(([kk]) => kk.startsWith("ofi")).map(([, v]) => Number(v?.value) || 0));
			return Number(a.system.pericias?.[k]?.value) || 0;
		};
		const rolar = async (a, ks, extra = 0) => {
			const k = ks.reduce((m, kk) => (bonus(a, kk) > bonus(a, m) ? kk : m), ks[0]);
			const r = await new Roll(`1d20 + ${bonus(a, k)} + ${mod + extra}`).evaluate();
			rolls.push(r);
			return { total: r.total, k };
		};
		const N = (k) => D.pericias[k] ?? k;
		const tam = (a) => a.system.tracos?.tamanho ?? "med";
		let html = `<h3>${t.nome}</h3>`;
		if (res.zerar) {
			if (t.especial === "corda") delete est.corda;
			if (t.especial === "desabamento") delete est.desab;
			if (t.especial === "tumba") delete est.tumbas;
			for (const tk of tokens) await tk.actor.unsetFlag("world", "fdtTemplo");
			await game.user.unsetFlag("world", ESTADO);
			await game.user.setFlag("world", ESTADO, est);
			return ui.notifications.info("Progresso zerado.");
		}
		if (t.especial === "desabamento") {
			const d = est.desab ?? { s: 0, f: 0, testes: 0 };
			if (res.auto) { d.s++; html += "<p>Boa ideia (Transmutar Objetos, alavanca, cordas...): <b>sucesso automático</b>.</p>"; }
			else {
				const a = tokens[0]?.actor;
				if (!a) return ui.notifications.warn("Selecione quem trabalha no desabamento.");
				const cd = 15 + 2 * d.testes;
				const { total } = await rolar(a, ["atle"]);
				d.testes++;
				if (total >= cd) d.s++; else d.f++;
				html += `<p>${a.name}: Atletismo <b>${total}</b> contra CD ${cd} ${total >= cd ? "✔️" : "❌"}</p>`;
			}
			html += `<p>Progresso: <b>${d.s}/5</b> sucessos, ${d.f}/3 falhas. Ruído 3 (2 com cuidado extra). O ganchador fica de tocaia, atraído pelo barulho.</p>`;
			if (d.s >= 5) { html += "<p><b>Passagem aberta!</b> Caminho direto até a sala da estátua e o altar.</p>"; delete est.desab; }
			else if (d.f >= 3) { html += "<p><b>Três falhas:</b> as pedras voltam a cair. O desabamento resiste (recomece com a CD inicial, se quiserem).</p>"; delete est.desab; }
			else est.desab = d;
			await game.user.unsetFlag("world", `${ESTADO}.desab`);
			await game.user.setFlag("world", ESTADO, est);
			return ChatMessage.create({ content: html, rolls });
		}
		if (!tokens.length) return ui.notifications.warn("Selecione os tokens.");
		if (t.especial === "corda") {
			est.corda ??= { medios: 0, partida: false };
			if (est.corda.partida) return ChatMessage.create({ content: html + "<p>A corda já se partiu. Será preciso outro jeito de cruzar a cratera.</p>" });
			html += "<ul>";
			for (const tk of tokens) {
				const a = tk.actor;
				if (est.corda.partida) { html += `<li>${tk.name}: a corda já se partiu.</li>`; continue; }
				const tamanho = tam(a);
				const pequeno = ["min", "peq"].includes(tamanho);
				const grande = ["gra", "eno", "col"].includes(tamanho);
				let cai = false;
				let txt = `${tk.name}: `;
				if (grande) { est.corda.partida = true; cai = true; txt += "Grande demais, a corda se parte na hora."; }
				else {
					const { total, k } = pequeno ? { total: 99, k: "" } : await rolar(a, ["atle", "acro"]);
					if (!pequeno) txt += `${N(k)} ${total} ${total >= 15 ? "✔️" : "❌"}; `;
					else txt += "Pequeno, passa sem teste; ";
					if (!pequeno) {
						const cd = 10 + est.corda.medios;
						const rc = await new Roll("1d20 + 3").evaluate();
						rolls.push(rc);
						est.corda.medios++;
						if (rc.total < cd) { est.corda.partida = true; cai = true; txt += `corda (Fortitude +3) ${rc.total} contra CD ${cd} ❌ <b>parte-se!</b>`; }
						else txt += `corda ${rc.total} contra CD ${cd} ✔️ aguenta`;
					}
					if (total < 15) cai = true;
				}
				if (cai) {
					const { total: rf } = await rolar(a, ["refl"]);
					if (rf >= 15) txt += ` · Reflexos ${rf} ✔️ se segura na borda.`;
					else {
						const d = await new Roll("1d6[impacto]").evaluate();
						rolls.push(d);
						await a.applyDamageV2(d, 1);
						txt += ` · Reflexos ${rf} ❌ <b>cai no rio</b> (${d.total} de dano). Os tiranos das águas e o cardume atacam!`;
					}
				}
				html += `<li>${txt}</li>`;
			}
			html += "</ul>";
			await game.user.setFlag("world", ESTADO, est);
			return ChatMessage.create({ content: html, rolls });
		}
		if (t.especial === "rio") {
			html += "<ul>";
			for (const tk of tokens) {
				const { total } = await rolar(tk.actor, ["atle"]);
				const falha = 20 - total;
				let txt;
				if (falha <= 0) txt = "✔️ avança metade do deslocamento";
				else if (falha <= 5) txt = "fica parado, boiando";
				else {
					const q = await new Roll("1d6").evaluate();
					rolls.push(q);
					txt = falha <= 10 ? `é levado pela correnteza <b>${q.total} quadrado(s)</b> para o norte` : `<b>afunda</b> e é levado ${q.total} quadrado(s) para o norte (prenda o fôlego)`;
				}
				html += `<li>${tk.name}: Atletismo ${total} → ${txt}</li>`;
			}
			html += "</ul><p style=\"font-size:0.85em\">Cada teste gasta uma ação de movimento; uma segunda ação de movimento permite outro teste. No fim do rio (extremo norte), o túnel fica cheio de água: quem sobreviver sai num ponto das Centrais à escolha do Mestre.</p>";
			return ChatMessage.create({ content: html, rolls });
		}
		if (t.especial === "folego") {
			html += "<ul>";
			for (const tk of tokens) {
				const a = tk.actor;
				const f = a.getFlag("world", "fdtTemplo")?.folego ?? { rodadas: 0, testes: 0 };
				f.rodadas++;
				const limite = 1 + (Number(a.system.atributos?.con?.value) || 0);
				let txt = `rodada ${f.rodadas} submerso (aguenta ${limite})`;
				if (f.rodadas > limite) {
					const cd = 15 + f.testes;
					const { total } = await rolar(a, ["fort"]);
					f.testes++;
					if (total >= cd) txt += ` · Fortitude ${total} contra CD ${cd} ✔️`;
					else {
						const d = await new Roll("1d6").evaluate();
						rolls.push(d);
						await a.toggleStatusEffect("inconsciente", { active: true });
						await a.update({ "system.attributes.pv.value": a.system.attributes.pv.value - d.total });
						txt += ` · Fortitude ${total} contra CD ${cd} ❌ <b>inconsciente</b>, perde ${d.total} PV (e 1d6 por rodada até respirar)`;
					}
				}
				await a.setFlag("world", "fdtTemplo", { folego: f });
				html += `<li>${tk.name}: ${txt}</li>`;
			}
			html += "</ul><p style=\"font-size:0.85em\">Quando respirarem, marque \"Zerar o progresso\" com os tokens selecionados.</p>";
			return ChatMessage.create({ content: html, rolls });
		}
		if (t.especial === "escalar") {
			html += "<ul>";
			for (const tk of tokens) {
				const a = tk.actor;
				const e = a.getFlag("world", "fdtTemplo")?.escalar ?? 0;
				const { total } = await rolar(a, ["atle"]);
				const n = total >= 20 ? e + 1 : 0;
				await a.setFlag("world", "fdtTemplo", { escalar: n >= t.seguidos ? 0 : n });
				html += `<li>${tk.name}: Atletismo ${total} ${total >= 20 ? "✔️" : "❌ (recomeça)"} · ${n >= t.seguidos ? "<b>saiu do fosso!</b>" : `${n}/${t.seguidos} seguidos`}</li>`;
			}
			html += "</ul>";
			return ChatMessage.create({ content: html, rolls });
		}
		if (t.especial === "tumba") {
			est.tumbas ??= { tentativas: 0 };
			const a = tokens[0].actor;
			const { total } = await rolar(a, ["for"]);
			if (total >= 25) html += `<p>${tokens[0].name}: Força ${total} ✔️ a lápide se move. ${est.tumbas.tentativas >= 3 ? "Mas o tesouro já foi arruinado pelo mecanismo." : "O tesouro está intacto."}</p>`;
			else {
				est.tumbas.tentativas++;
				html += `<p>${tokens[0].name}: Força ${total} ❌. Barulho de coisas quebrando lá dentro (${est.tumbas.tentativas}/3).${est.tumbas.tentativas >= 3 ? " <b>O tesouro desta tumba está arruinado.</b>" : ""}</p>`;
			}
			html += "<p style=\"font-size:0.85em\">O jeito certo: inverter os espelhos, cada um de frente para a tumba certa. Ladinagem não funciona. 100 de dano também abre (e conta como tentativa).</p>";
			await game.user.setFlag("world", ESTADO, est);
			return ChatMessage.create({ content: html, rolls });
		}
		// Testes simples
		if (t.cada) {
			html += "<ul>";
			for (const tk of tokens) {
				const tamanho = tam(tk.actor);
				if (t.pequenoPassa && ["min", "peq"].includes(tamanho)) { html += `<li>${tk.name}: Pequeno, passa sem teste ✔️</li>`; continue; }
				if (t.grandeNao && ["gra", "eno", "col"].includes(tamanho)) { html += `<li>${tk.name}: Grande demais, não passa ❌</li>`; continue; }
				const { total, k } = await rolar(tk.actor, t.pericias);
				html += `<li>${tk.name}: ${N(k)} ${total} ${total >= t.cd ? `✔️ ${t.ok ?? ""}` : `❌ ${t.falha ?? ""}`}</li>`;
			}
			html += "</ul>";
		} else {
			let melhor = -99;
			html += "<ul>";
			for (const tk of tokens) {
				const { total, k } = await rolar(tk.actor, t.pericias);
				melhor = Math.max(melhor, total);
				html += `<li>${tk.name}: ${N(k)} ${total}</li>`;
			}
			html += `</ul><p>Melhor ${melhor} contra CD ${t.cd}: ${melhor >= t.cd ? `✔️ ${t.ok}` : `❌ ${t.falha ?? "nada notado."}`}</p>`;
		}
		if (t.ruido) html += `<p><b>Ruído ${t.ruido}.</b></p>`;
		ChatMessage.create({ content: html, rolls, whisper: t.secreto ? ChatMessage.getWhisperRecipients("GM") : [] });
	}

	async function macroCriaturas(D) {
		const alvos = [...game.user.targets].filter((t) => t.actor);
		const fonte = canvas.tokens.controlled.find((t) => t.actor);
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Templo do Vácuo · Criaturas" },
			position: { width: 480 },
			content: `
				<div class="form-group"><label>Habilidade</label><select name="hab">
					<option value="frenesi">Frenesi Sangrento (+2 nos tiranos selecionados)</option>
					<option value="frenesiFim">Frenesi Sangrento: encerrar (fim da cena)</option>
					<option value="vomito">Vômito Cáustico (barão selecionado, alvo mirado)</option>
					<option value="bicada">Bicada Petrificante (alvos mirados que sofreram dano)</option>
					<option value="ferrugemItem">Antena da Ferrugem: item mágico empunhado (Fort CD 17)</option>
					<option value="ferrugemGolem">Antena da Ferrugem: golem ou construto de metal</option>
					<option value="cardume">Cardume: fim do turno (alvos mirados no espaço dele)</option>
					<option value="engolir">Ameba: engolir (ameba selecionada, alvo mirado agarrado)</option>
					<option value="digestao">Ameba: digestão (início do turno da ameba selecionada)</option>
					<option value="expelir">Ameba: expelir os alvos mirados (escaparam)</option></select></div>
				<p style="font-size:0.85em">Selecione a criatura que age e mire os alvos.</p>`,
			ok: { label: "Usar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		const teste = async (a, k) => {
			const r = await new Roll(`1d20 + ${Number(a.system.pericias?.[k]?.value) || 0}`).evaluate();
			rolls.push(r);
			return r.total;
		};
		const tem = (a, s) => a.statuses?.has?.(s);
		let html = "";
		if (res.hab === "frenesi" || res.hab === "frenesiFim") {
			const tiranos = canvas.tokens.controlled.filter((t) => t.actor);
			if (!tiranos.length) return ui.notifications.warn("Selecione os tiranos que morderam.");
			html = "<h3>Frenesi Sangrento</h3><ul>";
			for (const t of tiranos) {
				const ef = t.actor.effects.find((e) => e.getFlag("world", "fdtFrenesi"));
				if (res.hab === "frenesiFim") { if (ef) await ef.delete(); html += `<li>${t.name}: frenesi encerrado.</li>`; continue; }
				const n = (ef?.getFlag("world", "fdtFrenesi") ?? 0) + 1;
				const changes = [
					{ key: "system.modificadores.ataque.geral", value: String(2 * n), type: "add", phase: "initial", priority: null },
					{ key: "system.modificadores.dano.geral", value: String(2 * n), type: "add", phase: "initial", priority: null }
				];
				const nomeEf = `Frenesi Sangrento +${2 * n}`;
				if (ef) await ef.update({ name: nomeEf, "flags.world.fdtFrenesi": n, "system.changes": changes });
				else await t.actor.createEmbeddedDocuments("ActiveEffect", [{ name: nomeEf, img: "icons/svg/blood.svg", type: "base", flags: { world: { fdt: "a1templo", fdtFrenesi: n } }, system: { changes } }]);
				html += `<li>${t.name}: <b>+${2 * n}</b> em ataque e dano até o fim da cena.</li>`;
			}
			return ChatMessage.create({ content: html + "</ul>" });
		}
		if (res.hab === "engolir" || res.hab === "digestao") {
			if (!fonte) return ui.notifications.warn("Selecione o token da ameba.");
			const adulta = fonte.actor.getFlag("world", "fdtRole") === "amebaAdulta";
			const cd = adulta ? 21 : 18;
			if (res.hab === "digestao") {
				const presas = canvas.tokens.placeables.filter((t) => t.actor?.effects.some((e) => e.getFlag("world", "fdtEngolido") === fonte.id));
				if (!presas.length) return ui.notifications.info("Ninguém está dentro desta ameba.");
				const d = await new Roll(`2d6+${adulta ? 9 : 8}[acido]`).evaluate();
				rolls.push(d);
				html = `<h3>${fonte.name}: digestão</h3><p><b>${d.total}</b> de ácido em quem está engolido.</p><ul>`;
				for (const t of presas) { await t.actor.applyDamageV2(d, 1); html += `<li>${t.name}</li>`; }
				html += "</ul><p style=\"font-size:0.85em\">Escapar: 10 de dano na membrana (Defesa 10). Núcleo: Defesa 12, ignora RD, dano dobrado.</p>";
				return ChatMessage.create({ content: html, rolls });
			}
			if (!alvos.length) return ui.notifications.warn("Mire a criatura agarrada.");
			const bonusAgarrar = adulta ? 20 : 14;
			html = `<h3>${fonte.name}: engolir</h3><ul>`;
			for (const t of alvos) {
				const ra = await new Roll(`1d20 + ${bonusAgarrar}`).evaluate();
				rolls.push(ra);
				const rd = Math.max(await teste(t.actor, "luta"), await teste(t.actor, "acro"));
				if (ra.total < rd) { html += `<li>${t.name}: agarrar ${ra.total} contra ${rd} ✔️ não é engolido</li>`; continue; }
				await t.actor.createEmbeddedDocuments("ActiveEffect", [{
					name: `Engolido (${fonte.name})`, img: "icons/svg/acid.svg", type: "base", statuses: ["agarrado"],
					description: "Agarrado dentro da ameba. Sofre o ácido no início de cada turno dela.",
					flags: { world: { fdt: "a1templo", fdtEngolido: fonte.id } }, system: { changes: [] }
				}]);
				let txt = `agarrar ${ra.total} contra ${rd} ❌ <b>engolido!</b>`;
				const imune = (t.actor.getFlag("world", "fdtImuneAmeba") ?? 0) > game.time.worldTime;
				if (imune) txt += " (imune à paralisia hoje)";
				else {
					const f = await teste(t.actor, "fort");
					if (f >= cd) { txt += ` Fortitude ${f} ✔️ não fica paralisado (imune por um dia)`; await t.actor.setFlag("world", "fdtImuneAmeba", game.time.worldTime + 86400); }
					else { txt += ` Fortitude ${f} ❌ <b>paralisado</b> por 1 minuto`; await t.actor.toggleStatusEffect("paralisado", { active: true }); }
				}
				html += `<li>${t.name}: ${txt}</li>`;
			}
			return ChatMessage.create({ content: html + "</ul>", rolls });
		}
		if (res.hab === "expelir") {
			for (const t of alvos) {
				const ef = t.actor.effects.filter((e) => e.getFlag("world", "fdtEngolido"));
				for (const e of ef) await e.delete();
				await t.actor.toggleStatusEffect("caido", { active: true });
			}
			return ChatMessage.create({ content: `<p>${alvos.map((t) => t.name).join(", ")} ${alvos.length > 1 ? "rompem" : "rompe"} a membrana e cai${alvos.length > 1 ? "m" : ""} na frente da ameba.</p>` });
		}
		if (!alvos.length) return ui.notifications.warn("Mire os alvos.");
		if (res.hab === "vomito") {
			const d = await new Roll("4d4[acido]").evaluate();
			rolls.push(d);
			html = `<h3>Vômito Cáustico</h3><p><b>${d.total}</b> de ácido. Reflexos CD 18 reduz este dano e o da próxima rodada à metade.</p><ul>`;
			for (const t of alvos) {
				const v = await teste(t.actor, "refl");
				const ok = v >= 18;
				await t.actor.applyDamageV2(d, ok ? 0.5 : 1);
				await t.actor.createEmbeddedDocuments("ActiveEffect", [{
					name: `Vômito Cáustico (próxima rodada${ok ? ", metade" : ""})`, img: "icons/svg/acid.svg", type: "base", duration: { value: 1, units: "rounds" },
					description: `${ok ? "1d4" : "2d4"} de ácido no início do próximo turno.`, flags: { world: { fdt: "a1templo" } },
					system: { changes: [{ key: "danoContinuo", value: ok ? "1d4[acido]" : "2d4[acido]", type: "custom", phase: "initial", priority: null }] }
				}]);
				html += `<li>${t.name}: Reflexos ${v} ${ok ? "✔️ metade" : "❌ dano total"}</li>`;
			}
			if (fonte?.actor) await fonte.actor.update({ "system.resources.primary.value": 0 });
			html += "</ul><p style=\"font-size:0.85em\">Recarga: acertar uma mordida (devolva o recurso \"Vômito carregado\"). A metade da 2ª rodada virou 1d4.</p>";
			return ChatMessage.create({ content: html, rolls });
		}
		if (res.hab === "bicada") {
			html = "<h3>Bicada Petrificante</h3><ul>";
			for (const t of alvos) {
				const v = await teste(t.actor, "fort");
				if (v >= 19) { html += `<li>${t.name}: Fortitude ${v} ✔️</li>`; continue; }
				if (tem(t.actor, "lento")) { await t.actor.toggleStatusEffect("petrificado", { active: true }); html += `<li>${t.name}: Fortitude ${v} ❌ já estava lento: <b>PETRIFICADO</b> (permanente; efeitos que removem paralisia revertem).</li>`; }
				else { await t.actor.toggleStatusEffect("lento", { active: true }); html += `<li>${t.name}: Fortitude ${v} ❌ <b>lento</b></li>`; }
			}
			return ChatMessage.create({ content: html + "</ul>", rolls });
		}
		if (res.hab === "ferrugemItem") {
			html = "<h3>Antena da Ferrugem</h3><p>Objetos de metal comuns atingidos se desfazem em ferrugem na hora (armas de metal que ferem o monstro também). Itens mágicos empunhados testam Fortitude CD 17 (use a Fortitude do portador):</p><ul>";
			for (const t of alvos) { const v = await teste(t.actor, "fort"); html += `<li>${t.name}: ${v} ${v >= 17 ? "✔️ o item resiste" : "❌ o item vira ferrugem"}</li>`; }
			return ChatMessage.create({ content: html + "</ul>", rolls });
		}
		if (res.hab === "ferrugemGolem") {
			html = "<h3>Ferrugem contra construto</h3><ul>";
			for (const t of alvos) {
				const v = await teste(t.actor, "fort");
				if (v >= 17) { html += `<li>${t.name}: Fortitude ${v} ✔️</li>`; continue; }
				const prox = tem(t.actor, "exausto") ? "paralisado" : tem(t.actor, "fatigado") ? "exausto" : "fatigado";
				await t.actor.toggleStatusEffect(prox, { active: true });
				html += `<li>${t.name}: Fortitude ${v} ❌ <b>${prox}</b> (só reparos removem: estátuas do Templo, Ofício [artesão]).</li>`;
			}
			return ChatMessage.create({ content: html + "</ul>", rolls });
		}
		if (res.hab === "cardume") {
			const d = await new Roll("2d6x6[corte]").evaluate();
			rolls.push(d);
			html = `<h3>Cardume Carnívoro</h3><p><b>${d.total}</b> de corte (cada 6 somou +1d6: Morte por Mil Dentes).</p><ul>`;
			for (const t of alvos) {
				const antes = t.actor.system.attributes.pv.value;
				await t.actor.applyDamageV2(d, 1);
				const sofreu = antes - t.actor.system.attributes.pv.value;
				if (sofreu >= 10) await t.actor.toggleStatusEffect("sangrando", { active: true });
				html += `<li>${t.name}: sofreu ${sofreu}${sofreu >= 10 ? " · <b>sangrando</b>" : ""}</li>`;
			}
			return ChatMessage.create({ content: html + "</ul>", rolls });
		}
	}

	async function macroMecanismos(D) {
		const ESTADO = "fdtTemplo";
		const est = foundry.utils.deepClone(game.user.getFlag("world", ESTADO) ?? {});
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Templo do Vácuo · Mecanismos e Altares" },
			position: { width: 500 },
			content: `
				<div class="form-group"><label>O quê</label><select name="acao">
					<option value="alav1">Alavanca 1 (mecanículo e caveira): alerta máximo</option>
					<option value="alav2">Alavanca 2 (onda e gotas): válvulas abertas</option>
					<option value="desligar">Desligar os efeitos das alavancas</option>
					<option value="tributo">Salão Principal: pagar o tributo (tokens selecionados)</option>
					<option value="certa">Salão da Memória: resposta CERTA</option>
					<option value="errada">Salão da Memória: resposta errada</option>
					<option value="forja">Altar Mecânico: fabricar um item na forja</option>
					<option value="altar">Altar da Memória: agraciar o token selecionado</option>
					<option value="portaB">Entrada B: o grupo voltou (rearmou?)</option></select></div>
				<div class="form-group"><label>Atributo (Altar da Memória)</label><select name="atr">
					<option value="int">Inteligência (+2 no valor rolado)</option><option value="car">Carisma (+1)</option><option value="sab">Sabedoria (sem bônus)</option></select></div>
				<div class="form-group"><label>Alavanca 1: colocar os mecanículos na cena</label><input type="checkbox" name="tokens" checked></div>
				<p style="font-size:0.85em">Progresso: perguntas ${est.perguntas ?? 0}/4 · forja ${est.forja ? `${est.forja.usados}/${est.forja.total}` : "não usada"} · altar ${(est.altar ?? []).length}/2.</p>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		const nosso = (a, papeis) => a?.getFlag("world", "fdt") === "a1templo" && papeis.includes(a.getFlag("world", "fdtRole"));
		const atoresDaCena = (papeis) => canvas.tokens.placeables.filter((t) => nosso(t.actor, papeis)).map((t) => t.actor);
		const base = (papeis) => game.actors.filter((a) => nosso(a, papeis));
		const darEfeito = async (papeis, flag, dados) => {
			for (const a of [...base(papeis), ...atoresDaCena(papeis)]) {
				if (a.effects.some((e) => e.getFlag("world", flag))) continue;
				await a.createEmbeddedDocuments("ActiveEffect", [{ ...dados, type: "base", flags: { world: { fdt: "a1templo", [flag]: true } } }]);
			}
		};
		const ch = (key, value) => ({ key, value: String(value), type: "add", phase: "initial", priority: null });
		let html = "";
		if (res.acao === "alav1") {
			const r = await new Roll("4d6").evaluate();
			rolls.push(r);
			await darEfeito(["mecanico"], "fdtAlavanca1", { name: "Alerta Máximo (Alavanca 1)", img: "icons/svg/hazard.svg", description: "+5 em testes de ataque e na Defesa. Caçam qualquer criatura viva e lutam até a morte.",
				system: { changes: [ch("system.modificadores.ataque.geral", 5), ch("system.attributes.defesa.bonus", 5)] } });
			est.alav1 = game.time.worldTime;
			html = `<h3>Alavanca 1</h3><p>Um rangido corre pelo Templo. <b>${r.total} mecanículos</b> despertam na Sala da Estátua e se dividem igualmente em todas as direções, caçando qualquer criatura viva (até os gnomos que os fizeram). +5 em ataque e Defesa. A alavanca não volta antes de <b>uma hora</b>.</p>`;
			const ref = canvas.tokens.controlled[0];
			const modelo = base(["mecanico"])[0];
			if (res.tokens && ref && modelo) {
				const gs = canvas.grid.size;
				const docs = [];
				for (let i = 0; i < r.total; i++) {
					const ang = (i / r.total) * 2 * Math.PI;
					docs.push((await modelo.getTokenDocument({ x: ref.document.x + Math.round(Math.cos(ang) * 3) * gs, y: ref.document.y + Math.round(Math.sin(ang) * 3) * gs, hidden: true })).toObject());
				}
				await canvas.scene.createEmbeddedDocuments("Token", docs);
				html += `<p style="font-size:0.85em">${r.total} tokens ocultos em volta de ${ref.name} (selecione um token na Sala da Estátua antes).</p>`;
			}
		} else if (res.acao === "alav2") {
			for (const a of atoresDaCena(["mecanico"])) await a.update({ "system.attributes.pv.value": Math.min(a.system.attributes.pv.value, 10) });
			await darEfeito(["mecanico"], "fdtAlavanca2", { name: "Encharcados (Alavanca 2)", img: `systems/tormenta20/icons/magias/controlar-agua.webp`, description: "Reduzidos a 10 PV; –5 em todos os testes e na Defesa.",
				system: { changes: [ch("system.modificadores.pericias.geral", -5), ch("system.modificadores.ataque.geral", -5), ch("system.attributes.defesa.bonus", -5)] } });
			await darEfeito(["tirano", "barao"], "fdtAlavanca2", { name: "Fortalecidos (Alavanca 2)", img: `systems/tormenta20/icons/magias/controlar-agua.webp`, description: "+3 em testes de ataque e na Defesa.",
				system: { changes: [ch("system.modificadores.ataque.geral", 3), ch("system.attributes.defesa.bonus", 3)] } });
			html = "<h3>Alavanca 2</h3><p>Válvulas se abrem por todo o Templo. Não inunda, mas <b>todo o Nível 1 fica alagado</b> (terreno difícil; Acrobacia CD 10 a cada movimento para se mover normalmente). Mecanículos em atividade caem para 10 PV e sofrem –5 em tudo; os tiranos das águas ganham +3 em ataque e Defesa (efeito que os gnomos não previram).</p>";
		} else if (res.acao === "desligar") {
			for (const a of [...game.actors.filter((x) => x.getFlag("world", "fdt") === "a1templo"), ...canvas.tokens.placeables.map((t) => t.actor).filter(Boolean)]) {
				const ids = a.effects.filter((e) => e.getFlag("world", "fdtAlavanca1") || e.getFlag("world", "fdtAlavanca2")).map((e) => e.id);
				if (ids.length) await a.deleteEmbeddedDocuments("ActiveEffect", ids);
			}
			if (est.alav1 && game.time.worldTime - est.alav1 < 3600) ui.notifications.warn("Pelo livro, a Alavanca 1 não pode ser desativada antes de uma hora.");
			delete est.alav1;
			html = "<p>Efeitos das alavancas removidos.</p>";
		} else if (res.acao === "tributo") {
			const tokens = canvas.tokens.controlled.filter((t) => t.actor);
			const tabela = game.tables.find((t) => t.getFlag("world", "fdtRole") === "memoriasTemplo");
			if (!tokens.length || !tabela) return ui.notifications.warn("Selecione quem paga o tributo (e importe o conteúdo do módulo Fim dos Tempos).");
			html = "<h3>O Tributo da Cabeça de Gnomo</h3><p><i>\"Aquele que deseja prosseguir por estes corredores deve pagar o tributo. Entregue uma de suas lembranças mais caras e receba uma das nossas.\"</i></p><ul>";
			for (const t of tokens) {
				const { roll, results } = await tabela.roll();
				rolls.push(roll);
				html += `<li><b>${t.name}</b> narra uma memória querida, que some da mente (os outros lembram de ter ouvido). Recebe: <i>${results[0]?.description ?? results[0]?.name ?? ""}</i></li>`;
			}
			html += "</ul><p style=\"font-size:0.85em\">Nada engana a estátua, só Desejo. Devoto de Hyninn com Religião CD 20 nota a marca do deus e pode fazer o pacto: entrega a memória em segredo. Quando todos pagarem, a cabeça se abre: escadaria para o Nível 2. Recusar e forçar: as quatro estátuas atacam até cada um pagar (narrar leva uma rodada).</p>";
			await ChatMessage.create({ content: html, rolls, whisper: ChatMessage.getWhisperRecipients("GM") });
			return;
		} else if (res.acao === "certa" || res.acao === "errada") {
			est.perguntas = est.perguntas ?? 0;
			if (res.acao === "certa") est.perguntas++;
			const p = Math.min(est.perguntas, 4);
			html = `<h3>Salão da Memória · ${p}/4</h3>`;
			if (est.perguntas >= 4) {
				const tokens = canvas.tokens.placeables.filter((t) => nosso(t.actor, ["mecanico", "estatua", "estatuaBesta"]));
				if (tokens.length) await canvas.scene.updateEmbeddedDocuments("Token", tokens.map((t) => ({ _id: t.id, disposition: 0 })));
				html += "<p>A última resposta ecoa pelo salão. As estátuas abaixam as bestas, os mecanículos param no meio do passo. <b>Silêncio.</b> O caminho até o Altar da Memória está livre.</p>";
				est.perguntas = 0;
			} else html += `<p>${res.acao === "certa" ? "As estátuas repetem a próxima pergunta, sem parar de atacar." : "As estátuas continuam a cacofonia em gnômico e a atirar."} Cada resposta gasta uma ação padrão.</p>`;
			html += `<p style="font-size:0.85em">${D.perguntas.map((q) => `<b>${q[0]}</b> ${q[1]}`).join("<br>")}</p>`;
			await ChatMessage.create({ content: html, whisper: ChatMessage.getWhisperRecipients("GM") });
			await game.user.setFlag("world", ESTADO, est);
			return;
		} else if (res.acao === "forja") {
			if (!est.forja) {
				const r = await new Roll("1d6").evaluate();
				rolls.push(r);
				est.forja = { total: r.total, usados: 0 };
			}
			if (est.forja.usados >= est.forja.total) html = "<p>A forja do Altar Mecânico está fria: parou de funcionar.</p>";
			else {
				est.forja.usados++;
				html = `<h3>A Forja dos Gnomos</h3><p>Combinando as alavancas, a forja fabrica <b>qualquer item com até três aprimoramentos</b>. Materiais especiais vêm pelo espaço de masmorra (menos metal arco-íris). Item ${est.forja.usados} de ${est.forja.total}.${est.forja.usados >= est.forja.total ? " <b>Com um último estalo, a forja para de funcionar.</b>" : ""}</p><p style="font-size:0.85em">Entender as alavancas: Conhecimento, Ofício (engenhoqueiro) ou Ladinagem CD 20.</p>`;
			}
		} else if (res.acao === "altar") {
			est.altar = est.altar ?? [];
			const tk = canvas.tokens.controlled[0];
			if (!tk?.actor) return ui.notifications.warn("Selecione o personagem que toca o Altar da Memória.");
			if (est.altar.length >= 2) return ui.notifications.warn(`O altar já agraciou dois personagens: ${est.altar.join(", ")}.`);
			const a = tk.actor;
			let r;
			const tentativas = [];
			do { r = await new Roll("4d6kh3").evaluate(); rolls.push(r); tentativas.push(r.total); } while (r.total < 10 && tentativas.length < 50);
			const bonus = { int: 2, car: 1, sab: 0 }[res.atr];
			const pontos = r.total + bonus;
			const novo = Math.floor((pontos - 10) / 2);
			const atual = Number(a.system.atributos?.[res.atr]?.value) || 0;
			const nome = { int: "Inteligência", car: "Carisma", sab: "Sabedoria" }[res.atr];
			const aplicar = await foundry.applications.api.DialogV2.confirm({
				window: { title: "Altar da Memória" },
				content: `<p>${a.name} rolou 4d6 (sem o menor): ${tentativas.join(", ")}${tentativas.length > 1 ? " (abaixo de 10 é ignorado)" : ""}. Com o bônus: <b>${pontos}</b> na escala antiga de 3 a 18, ou seja <b>${novo >= 0 ? "+" : ""}${novo}</b> em ${nome} na escala do Tormenta20 atual.</p>
					<p>${nome} atual: <b>${atual}</b>. Aplicar o novo valor? (Não: mantém o atual e só dá Engenhosidade.)</p>`
			});
			if (aplicar) await a.update({ [`system.atributos.${res.atr}.base`]: (Number(a.system.atributos[res.atr].base) || 0) + (novo - atual) });
			const modelo = game.items.find((i) => i.getFlag("world", "fdtRole") === "engenhosidade");
			const jaTem = a.items.some((i) => i.name.startsWith("Engenhosidade"));
			if (modelo) {
				const dados = modelo.toObject();
				delete dados._id;
				const int = Number(a.system.atributos?.int?.value) || 0;
				for (const e of dados.effects ?? []) for (const c of e.system?.changes ?? []) if (c.key === "roll") c.value = String(int);
				if (jaTem) { dados.name = "Engenhosidade (Altar da Memória, de novo: –1 PM)"; dados.system.ativacao.custo = 1; }
				await a.createEmbeddedDocuments("Item", [dados]);
			}
			est.altar.push(a.name);
			html = `<h3>O Altar da Memória</h3><p><i>"Vitoriosos, sejam bem-vindos ao Altar da Memória. O Templo do Vácuo guarda a memória de uma raça condenada e a lembrança de um deus que não é mais. Vocês, que venceram o Templo, agora são os guardiões de nossa dor esquecida."</i></p>
				<p><b>${a.name}</b> recebe as memórias de ${est.altar.length === 1 ? "Fremdak" : "Zonzibor"} (pedaços da vida depois da queda de Tilliann) e a habilidade <b>Engenhosidade</b> dos kliren${jaTem ? " (de novo: custa 1 PM a menos)" : ""}. ${nome}: ${aplicar ? `agora ${novo}` : `mantido em ${atual}`}.</p>
				<p style="font-size:0.85em">No máximo dois personagens, uma vez só. Atrás do altar, as portas duplas se abrem: um túnel natural de uma hora leva à superfície, a uns dois dias de viagem de onde deveriam estar.</p>`;
		} else if (res.acao === "portaB") {
			const r = await new Roll("1d4").evaluate();
			rolls.push(r);
			est.portaB = est.portaB ?? { veneno: null, usos: 0 };
			if (est.portaB.veneno === null) { const v = await new Roll("1d6").evaluate(); rolls.push(v); est.portaB.veneno = v.total; }
			est.portaB.usos++;
			const resta = Math.max(0, est.portaB.veneno - est.portaB.usos);
			html = `<h3>Entrada B</h3><p>Fechadura e agulha ficam desarmadas por <b>${r.total} dia(s)</b> depois de abertas; depois tudo se rearma com mecanismos novos (a experiência anterior não ajuda). Mana para mais <b>${resta}</b> iteração(ões) com veneno${resta ? "" : ": a agulha agora está seca"}.</p>`;
		}
		await game.user.setFlag("world", ESTADO, est);
		if (html) ChatMessage.create({ content: html, rolls, whisper: ChatMessage.getWhisperRecipients("GM") });
	}

	/* ---------- Dados injetados nas macros ---------- */
	const NOMES_CRIATURAS = { tirano: "Tirano das águas", barao: "Tirano das águas barão", mecanico: "Mecanículo", ferrugem: "Monstro da ferrugem", ameba: "Ameba gigante jovem", amebaAdulta: "Ameba gigante adulta", ganchador: "Ganchador", estatua: "Estátua animada", estatuaBesta: "Estátua com besta", cardume: "Cardume carnívoro", cocatriz: "Cocatriz" };
	const MODOS = { tirano: "normal", barao: "normal", mecanico: "normal", ferrugem: "bestial", ganchador: "bestial", ameba: "ataca", amebaAdulta: "ataca", estatua: "ataca", estatuaBesta: "ataca", cardume: "ataca", cocatriz: "ataca" };
	const PERGUNTAS = [
		["\"O que é este lugar?\"", "Um templo a Tilliann, o Deus dos Gnomos, que perdeu a divindade como punição pela Revolta dos Três."],
		["\"Quem construiu tudo isto?\"", "Fremdak e Zonzibor, dois gnomos."],
		["\"Quem está sendo cultuado nos altares vazios?\"", "Tilliann: os altares vazios são locais de culto e de luto por sua divindade perdida."],
		["\"Qual a função deste lugar?\"", "Garantir que a memória de Tilliann e da raça gnômica seja preservada."]
	];
	const TESTES = {
		ruidoPerceber: { nome: "Perceber que o ruído atrai monstros", pericias: ["conh", "ofic", "sobr"], cd: 15, ok: "Qualquer ruído aqui pode atrair os habitantes. (Depois do primeiro monstro atraído, treinados notam sozinhos; os outros, Inteligência CD 10.)" },
		entradas: { nome: "Estudar as entradas (topografia e boatos)", pericias: ["conh", "ofic", "sobr"], cd: 20, ok: "A tem um mecanismo fechado (elevador) e pula as primeiras salas; B evita muitas salas, com armadilha, perto dos tesouros e dos perigos; C começa do começo." },
		portaA: { nome: "Destrancar a porta da Entrada A", pericias: ["ladi"], cd: 20, ok: "A porta abre; a salinha se fecha e desce (elevador, ruído 3).", cada: true },
		portaB: { nome: "Arrombar a fechadura da Entrada B (dispara a agulha)", pericias: ["ladi", "ofic"], cd: 25, ok: "Aberta, e a agulha salta (use Armadilhas › Agulha, a menos que tenham desarmado).", cada: true },
		agulhaDetectar: { nome: "Detectar a agulha da Entrada B", pericias: ["inve"], cd: 20, ok: "Há uma agulha com peçonha na fechadura. (Percepção precisa de 25.)", secreto: true },
		passagem: { nome: "Passagem estreita para a sala do elevador (N1 S2)", pericias: ["acro"], cd: 15, cada: true, pequenoPassa: true, grandeNao: true, ok: "passa", falha: "fica entalado" },
		alagado: { nome: "Chão alagado: mover-se normalmente", pericias: ["acro"], cd: 10, cada: true, ok: "move-se normalmente", falha: "terreno difícil neste movimento" },
		metalS4: { nome: "Restos na Sala Alagada (N1 S4)", pericias: ["inve"], cd: 15, ok: "Restos de metal enferrujado. (Percepção ou Conhecimento CD 15: partes de coisas humanoides, mecanículos.)" },
		ossosS7: { nome: "Ossos da Antessala (N1 S7)", pericias: ["perc", "inve", "sobr"], cd: 15, ok: "Os ossos esmagados não são de nenhuma criatura Pequena: só Médias ou Grandes." },
		tiranosS7: { nome: "Notar os tiranos vigiando (da Sala 7)", pericias: ["perc"], cd: 10, ok: "Tiranos das águas nas Salas 9/10, olhando... e não atacando." },
		tunel911: { nome: "Túnel alagado escondido (Salas 9 e 11)", pericias: ["inve"], cd: 20, ok: "Um túnel alagado liga a Sala 9 à Sala de Reparos (11)." },
		fraseEstatuas: { nome: "Entender as estátuas do Altar Vazio", pericias: ["conh"], cd: 20, ok: "\"Para passar, conte uma história do Herói Louco.\" (Compreensão também revela.)" },
		marcaHyninn: { nome: "Marca de Hyninn na cabeça de gnomo (devoto)", pericias: ["reli"], cd: 20, ok: "Uma pequena marca de Hyninn: dá para fazer o pacto e entregar a memória em segredo.", secreto: true },
		bauIlusao: { nome: "Ouro do baú da Antessala (N1 S15)", pericias: ["vont"], cd: 18, cada: true, ok: "percebe que o ouro é ilusão", falha: "vê um baú cheio de riquezas" },
		descerFosso: { nome: "Descer nadando pelo fosso dos tiranos (N1 S12)", pericias: ["atle"], cd: 15, cada: true, ok: "surge na Sala 13 do Nível 2", falha: "não consegue e volta à superfície" },
		tiranosS3: { nome: "Os tiranos guardam o tesouro? (N2 S3)", pericias: ["intu", "sobr"], cd: 20, ok: "Eles não têm interesse real nos objetos, ou já os teriam pegado: é isca para a Sala 4." },
		alavancasForja: { nome: "Entender as alavancas do Altar Mecânico", pericias: ["conh", "ofic", "ladi"], cd: 20, ok: "Armas, itens, tamanhos e símbolos: combinando as alavancas, a forja fabrica itens com até três aprimoramentos." },
		portaFerro: { nome: "Arrombar porta de ferro pesada (Força)", pericias: ["for"], cd: 25, cada: true, ok: "a porta cede", falha: "a porta resiste", ruido: 5 },
		corda: { nome: "Atravessar a corda da cratera (N1 S5)", especial: "corda" },
		rio: { nome: "Nadar no rio subterrâneo (por ação de movimento)", especial: "rio" },
		folego: { nome: "Prender o fôlego (uma rodada submerso)", especial: "folego" },
		desabamento: { nome: "Remover o desabamento dos corredores sudoeste", especial: "desabamento" },
		escalarTriplo: { nome: "Escalar o Fosso Triplo (3 sucessos seguidos)", especial: "escalar", seguidos: 3 },
		escalarProfundo: { nome: "Escalar o Fosso Profundo", especial: "escalar", seguidos: 1 },
		tumba: { nome: "Abrir uma tumba à força (Força CD 25)", especial: "tumba" }
	};
	const DADOS_ARM = Object.fromEntries(Object.entries(ARMADILHAS).map(([k, a]) => [k, a]));

	const macro = (name, img, fn, dados = null) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Arco 1 · Templo do Vácuo · gerado por a1-templo-do-vacuo.js\n${dados ? `const DADOS = ${JSON.stringify(dados)};\n` : ""}(${fn.toString()})(${dados ? "DADOS" : ""});`
	});
	const macros = await Macro.createDocuments([
		macro("Templo · Busca pelo Templo", "icons/svg/ruins.svg", macroBusca, { pericias: PERICIAS, entradas: ENTRADAS }),
		macro("Templo · Exploração", "icons/svg/eye.svg", macroExploracao, { encontros: ENCONTROS, reacoes: REACOES, nomes: NOMES_CRIATURAS, modos: MODOS }),
		macro("Templo · Escuridão do Templo", `${T20I}/magias/escuridao.webp`, macroEscuridao),
		macro("Templo · Armadilhas", "icons/svg/trap.svg", macroArmadilhas, { armadilhas: DADOS_ARM, pericias: PERICIAS }),
		macro("Templo · Testes do Templo", "icons/svg/target.svg", macroTestes, { testes: TESTES, pericias: PERICIAS }),
		macro("Templo · Criaturas", "icons/svg/blood.svg", macroCriaturas),
		macro("Templo · Mecanismos e Altares", "icons/svg/clockwork.svg", macroMecanismos, { perguntas: PERGUNTAS })
	]);
	const linkMacro = (trecho) => {
		const m = macros.find((x) => x.name.includes(trecho));
		return m ? `@UUID[${m.uuid}]{${m.name}}` : trecho;
	};

	/* ------------------------------------------------------------------ */
	/* 6. Diário                                                            */
	/* ------------------------------------------------------------------ */
	const L = (d) => (d?.uuid ? `@UUID[${d.uuid}]{${d.name}}` : "");
	const pagina = (name, content, sort) => ({ name, type: "text", sort, text: { content, format: 1 } });
	const sala = (titulo, ...linhas) => `<h3>${titulo}</h3>${p(...linhas)}`;
	const ALAGADO = "<i>Chão alagado:</i> terreno difícil; Acrobacia CD 10 a cada movimento para se mover normalmente.";
	const arm = (k) => `<b>Armadilha: ${ARMADILHAS[k].nome}</b> (ND ${ARMADILHAS[k].nd}). ${ARMADILHAS[k].efeito} Detectar ${ARMADILHAS[k].det}; desarmar ${ARMADILHAS[k].des}.`;

	await JournalEntry.create({
		name: "Arco 1 · O Templo do Vácuo",
		folder: pasta.JournalEntry,
		flags: FLAGS(),
		pages: [
			pagina("Guia do Mestre", `
				<h2>Resumo</h2>
				<p>Masmorra opcional em algum ponto das Colinas Centrais, de dificuldade fixa (pensada para o 5º ou 6º nível). Quando Tilliann perdeu a divindade, os clérigos gnomos <b>Fremdak e Zonzibor</b> fizeram contato com Hyninn, descobriram o <b>espaço de masmorra</b> e vieram até o lugar onde o deus caiu para construir um templo de luto. Só quem "pensa como um gnomo" chega à recompensa. O Templo se rearma, invoca criaturas e "aprende": o desafio que era "recitar dogmas de Tilliann" hoje é "contar uma história do Herói Louco". Não há nenhuma imagem de Tilliann: altares e murais têm um vazio no lugar dele.</p>
				<p>Não é obrigatório. Dá pistas sobre as Colinas (é um templo a Tilliann; a Revolta dos Três), sugere temas da campanha e dá itens. O grupo pode entrar, explorar um pedaço, sair e voltar.</p>
				<h2>Estilo anos 70</h2>
				<ul>
					<li>Carga, rações e <b>tochas</b> contadas de verdade. Nada de "meu caçador provavelmente teria uma corda". Divida a contabilidade entre os jogadores (um cuida das tochas, outro das rações...).</li>
					<li>Encontros devem ser <b>vencidos</b>, não necessariamente combatidos. Os habitantes não atacam sozinhos: têm objetivos e uma tabela de reações.</li>
					<li>Enigmas são para os <b>jogadores</b>. Se o jogador da bárbara decifrou o código, deixe-o falar.</li>
					<li>O grupo define o próprio objetivo (segredos das Colinas, Tilliann, riquezas, um gancho de histórico).</li>
				</ul>
				<h2>Sequência de rolagens</h2>
				<ol>
					<li>Ao entrar numa sala sem criaturas definidas: ${linkMacro("Exploração")} (1d20 + ruído em ${L(tabelaEncontros)}).</li>
					<li>Ela já rola a reação em ${L(tabelaReacoes)} e pode pôr os tokens na cena, ocultos.</li>
					<li>Conduza o encontro normalmente. Uma cena dura 2 salas ou 6 corredores: a macro avisa quando as tochas se apagam.</li>
				</ol>
				<h2>Fichas</h2>
				<ul>
					<li>${L(atores.tirano)}, ${L(atores.barao)} (ligue uma Mutação Rubra), ${L(atores.mecanico)}, ${L(atores.ferrugem)}, ${L(atores.cardume)}, ${L(atores.cocatriz)}.</li>
					<li>${L(atores.ameba)}, ${L(atores.amebaAdulta)}, ${L(atores.ganchador)}.</li>
					<li>${L(atores.estatua)} e ${L(atores.estatuaBesta)}: golem de ferro com uma ação por rodada. Fortes demais de propósito.</li>
					<li>${L(atores.ferreiro)}, ${L(atores.porta)} e ${L(atores.armadilhas)}.</li>
				</ul>
				<h2>Macros</h2>
				<ul>
					<li>${linkMacro("Busca")}: o teste estendido para achar o Templo (7 sucessos), a entrada e o encontro do dia.</li>
					<li>${linkMacro("Exploração")}: ruído, salas e corredores, encontro, reação, tokens e duração das tochas.</li>
					<li>${linkMacro("Escuridão")}: luz pela metade e sem visão no escuro na cena; acende tochas e lampiões.</li>
					<li>${linkMacro("Armadilhas")}: as 11 armadilhas, com resistência, dano, perda de PV e condições.</li>
					<li>${linkMacro("Testes")}: corda da cratera, rio, fôlego, desabamento, fossos, tumbas e os testes de pista.</li>
					<li>${linkMacro("Criaturas")}: frenesi, vômito cáustico, bicada petrificante, ferrugem, cardume e amebas.</li>
					<li>${linkMacro("Mecanismos")}: as duas alavancas, o tributo de memórias, as quatro perguntas, a forja e o Altar da Memória.</li>
				</ul>`, 100),
			pagina("Como Chegar", `
				<h3>Ouvir falar</h3>
				<p>Ninguém tem mapa. Os vilões consideram o lugar quase sagrado e os bandidos preferem extorquir. Quase todos respondem a verdade se perguntados sobre ruínas, mas poucos se oferecem. Quem conhece:</p>
				<ul>
					<li><b>Tolbert</b>, <b>Ebenezer</b>, <b>Edwina</b>, <b>Doran Derinarion</b>.</li>
					<li><b>Quimby Ulysses Arronax</b>: só conta a um devoto de Hyninn.</li>
					<li><b>Gormaggor</b>: viu o Templo ser construído, mas lembra mal; exige paciência e testes sociais.</li>
					<li><b>Cletus Rigby</b>: dá informações erradas se for irritado.</li>
					<li><b>Nada Mais que a Verdade Reston</b>: pode até se voluntariar.</li>
					<li><b>Fortunata</b>: cobra um segredo em troca.</li>
					<li><b>Tarik</b>: quer explorar, mas não tem condições.</li>
				</ul>
				<p>NPCs com ótima relação ou informação valiosa podem dar bônus num teste ou um sucesso automático (reserve para Gormaggor e Cletus bem apaziguados). Se o grupo ignorar o Templo e isso o incomodar, crie um grupo de aventureiros sumido lá dentro e um pedido de ajuda do único que escapou.</p>
				<h3>Achar</h3>
				<p>Teste estendido de <b>Sobrevivência</b>, 7 sucessos, CD 15 +2 por teste. Outras perícias valem, mas nenhuma repete (só Sobrevivência). Cada teste leva meio dia; cada falha custa <b>1d8 PV</b> (quedas, fadiga) que só o descanso cura. Todo dia, um encontro nas Colinas. Use ${linkMacro("Busca")}.</p>
				<h3>Entradas (role 1d3)</h3>
				<p>${ENTRADAS.A}</p><p>${ENTRADAS.B}</p><p>${ENTRADAS.C}</p>
				<p>Cada entrada extra custa mais um sucesso. Conhecimento, Ofício (engenheiro) ou Sobrevivência CD 20 revelam as particularidades. A exploração "otimizada": C primeiro, voltar à superfície, depois A e, se precisar, B.</p>
				<p>Há ainda duas saídas secretas que se descobrem lá dentro: o túnel da Área Desabada (Nível 2, Sala 5), que leva direto ao Nível 2, e o túnel entre raízes do Nível 3 (Sala 3), que vai dar num bosque.</p>`, 200),
			pagina("Regras da Masmorra", `
				<h3>Luz e escuridão</h3>
				<p>Luz mágica e mundana iluminam <b>metade</b> do normal; <b>visão no escuro e na penumbra não funcionam</b> (truque de Hyninn). Tocha: 9m, vira 4,5m. Lampião: 15m, vira 7,5m. Precisam ser empunhados (uma ação de movimento para deixar num ponto fixo). Quem está fora da luz fica cego (desprevenido, lento, sem Percepção para observar, –5 em perícias de For e Des, todos com camuflagem total). Não descreva nada além da luz. ${linkMacro("Escuridão")} faz isso na cena.</p>
				<p>Para efeitos de duração <b>cena</b>: <b>2 salas ou 6 corredores</b> (ou combinações, como 1 sala e 3 corredores). Uma tocha dura uma cena.</p>
				<h3>Ruído</h3>
				<ul>
					<li><b>0:</b> parado, Furtividade, magia Silêncio.</li>
					<li><b>1:</b> sussurrar, meio deslocamento, destrancar, desarmar, guardar ou sacar equipamento, vestir armadura leve.</li>
					<li><b>2:</b> voz normal, deslocamento normal, vestir armadura pesada.</li>
					<li><b>3:</b> discussão, risada, combate, correr, o elevador da Entrada A.</li>
					<li><b>4:</b> berrar, música para o grupo ouvir, bater escudos (sempre proposital).</li>
					<li><b>5:</b> desabamento, chamar atenção de propósito.</li>
				</ul>
				<p>Cada armadura pesada, criatura Grande ou montaria sobe <b>+1</b>. Cada nível alerta os habitantes num raio de <b>9m</b>, só por espaços abertos (portas e paredes param o som). Ao chegar, Conhecimento, Ofício (arquiteto ou engenheiro) ou Sobrevivência CD 15 revelam que o ruído atrai monstros.</p>
				<h3>Encontros</h3>
				<p>Criaturas com lugar fixo (tiranos no rio, mecanículos na estátua...) sempre estão lá, se vivas. Fora disso, em toda sala sem criaturas definidas, role 1d20 + ruído em ${L(tabelaEncontros)}.</p>
				<h3>Reações</h3>
				<p>1d6 + Carisma do personagem mais próximo (o menor, em empate) em ${L(tabelaReacoes)}. Se o grupo notou primeiro e dialogou ativamente: teste social, cada 5 pontos vale um resultado (5 ou menos = 0, 6 a 10 = 1...). Tiranos e mecanículos usam a tabela normalmente; o ganchador e o monstro da ferrugem fogem nos resultados de diálogo; estátuas e criaturas sem mente atacam (resultado 0).</p>
				<p><i>Ferramentas, não algemas:</i> o bandido joga uma bolsa de ouro aos tiranos que "atacam se houver algo a ganhar". E agora? Eles entendem dinheiro? Pedem mais? Não há resposta fixa: cada encontro deve ser resolvido, não necessariamente combatido.</p>`, 300),
			pagina("Nível 1", `
				${sala("Sala 1 · Área de Entrada C", "Sala quadrada com quatro pilares, chão regular.")}
				${sala("Sala 2 · Área de Entrada A", "Acesso por uma passagem estreita (Pequenos passam; Médios, Acrobacia CD 15; Grandes não passam) ou pelos corredores. Depois de usado, o elevador volta para cima.")}
				${sala("Sala 3 · Altar e Oferendas", "Altar vazio para Tilliann, rodeado de oferendas: tesouros e itens, mas nenhuma moeda reconhecível hoje. Ossos de exploradores.", arm("pendulo"), "<b>Tesouro:</b> ND 2.")}
				${sala("Sala 4 · Sala Alagada", "A correnteza destruiu tudo. Investigação CD 15: restos de metal enferrujado; Percepção ou Conhecimento CD 15: partes de coisas humanoides. Ao norte, escadaria curta que sobe.", ALAGADO,
					"Se os tiranos estiverem caçando o grupo, emboscam aqui (não sofrem o terreno difícil): mova quatro tiranos de outras áreas.",
					`Perto da escada, um aventureiro morto com um ${L(itemPorNome("Diário do Aventureiro"))}.`)}
				${sala("Sala 5 · Cratera e Rio Subterrâneo", "Um rombo enorme para o rio, que ruge lá embaixo. Descer pelo rio leva direto ao Nível 2, mas os tiranos só atacam quem entra na água (o rio é território deles).",
					"<b>Corda:</b> Atletismo ou Acrobacia CD 15 para Médios. A corda faz Fortitude +3 contra CD 10 (+1 por Médio depois do primeiro) a cada Médio; falha, ela parte. Reflexos CD 15 para não cair no rio (cair: 1d6 e ataque dos tiranos e do cardume). Pequenos não testam; Grandes partem a corda. Use <i>Testes › Corda</i>.",
					"<b>Monstros:</b> três tiranos das águas, um cardume carnívoro.")}
				${sala("Sala 6 · Covil da Ferrugem", "Detritos, pó de ferrugem e um monte de lixo onde o monstro dorme. Restos de mecanículos: das primeiras pistas da existência deles.", "<b>Monstro:</b> monstro da ferrugem.")}
				${sala("Sala 7 · Antessala do Mecanismo de Segurança", "Ossos esmagados, itens arruinados, chão manchado de sangue. Percepção, Investigação ou Sobrevivência CD 15: nenhum osso é de criatura Pequena. Os gnomos deixavam o equipamento para trás antes de passar (gesto de reverência).", arm("teto"))}
				${sala("Sala 8 · Mecanismo de Segurança", "Atrás de uma porta de ferro trancada: sala limpa e bem conservada, local sagrado (Religião percebe). Oferendas, um baú e um mecanismo com duas alavancas, a última medida contra invasões ou revolta dos mecanículos.",
					"<b>Alavanca 1</b> (baixo-relevo de mecanículo e caveira): 4d6 mecanículos despertam na Sala da Estátua, se dividem e caçam qualquer criatura viva, com +5 em ataque e Defesa, lutando até a morte. Não volta antes de uma hora. Medida suicida para os gnomos.",
					"<b>Alavanca 2</b> (onda e gotas): válvulas por todo o Templo. Mecanículos ativos caem para 10 PV e sofrem –5 em tudo; os tiranos ganham +3 em ataque e Defesa; todo o Nível 1 fica alagado.",
					`<b>Porta:</b> ${L(atores.porta)} (derrubar é ruído 5). Os tiranos não atacam aqui (conhecem a antessala), mas podem ficar de tocaia; os mecanículos atacam. <b>Tesouro:</b> ND 3. Use ${linkMacro("Mecanismos")}.`)}
				${sala("Salas 9 e 10 · Posto de Guarda dos Tiranos", "Vazias e alagadas; os tiranos vigiam os mecanículos e os intrusos. Da Sala 7, Percepção CD 10 os vê (e eles não atacam: pista da armadilha). Investigação CD 20 na Sala 9: túnel alagado até a Sala 11.", "<b>Monstros:</b> três tiranos das águas, um barão.")}
				${sala("Sala 11 · Sala de Reparos", "Bigorna ladeada por dois autômatos de gnomos ferreiros (parecem um misto de anão e hynne). Um mecanículo na bigorna recupera <b>1d8+1 PV por rodada</b>. Um golem também pode se deitar ali; equipamentos de metal são consertados. Os autômatos não distinguem objeto de criatura viva: enganar um inimigo para a bigorna causa 1d8+1 por rodada. Investigação CD 20: túnel até a Sala 9.")}
				${sala("Sala 12 · Entrada dos Tiranos", "Fosso cavado pelos tiranos até o Nível 2; sempre há ao menos três de guarda, e é para cá que fogem. Descer: Atletismo CD 15 (falha volta; pesos e cordas ajudam), surgindo na Sala 13 do Nível 2. Há uma escada de mão esquecida.", ALAGADO, "<b>Monstros:</b> dois tiranos das águas, um barão.")}
				${sala("Corredores Sudoeste", "Feitos para levar invasores ao coração do nível antes da hora. Um desabamento antigo fechou a passagem da Entrada C ao corredor sul: removê-lo é Atletismo estendido (CD 15 +2, 5 sucessos antes de 3 falhas; boas ideias, como Transmutar Objetos, valem sucessos automáticos), ruído 3 (2 com cuidado). O ganchador ataca quem remove as pedras.",
					"A ameba gigante jovem circula aqui, sempre para a direita, uma volta por vez. O ganchador sabe evitá-la.", ALAGADO, "<b>Monstros:</b> ganchador, ameba gigante jovem.")}
				${sala("Sala 13 · Altar Vazio", "Um grande altar feito vazio, inquietante para devotos. Duas estátuas animadas dão um passo à frente e falam em gnômico antigo (Conhecimento CD 20 ou Compreensão): <i>\"Para passar, conte uma história do Herói Louco.\"</i> As palavras \"Herói Louco\" soam em valkar moderno, como outra gravação: as estátuas adaptam a fala à época.",
					"Quem conta a história não é incomodado; as estátuas se ajoelham e se prostram para o altar vazio (a primeira prova de que o Herói Louco era um deus). Quem não conta é atacado. Elas não saem da sala nem perseguem, e lembram dos invasores por um dia. Não deixam passar pelos corredores sudoeste até o Salão Principal, mas um desabamento na Sala 5 contorna isso.", "<b>Monstros:</b> duas estátuas animadas.")}
				${sala("Corredores para o Salão Principal", "Guardados por mecanículos e por uma armadilha que os próprios mecanículos colocaram quando notaram uma falha no corredor (ela só detecta criaturas vivas).", arm("runa"), "<b>Monstros:</b> cinco mecanículos.")}
				${sala("Sala 14 · Salão Principal", "O maior salão do nível, muito danificado pela água. Uma enorme cabeça de gnomo de pedra, com uma expressão de grande tristeza, guardada por quatro estátuas animadas. Duas portas de ferro trancadas.", ALAGADO,
					"A cabeça fala em gnômico: <i>\"Aquele que deseja prosseguir por estes corredores deve pagar o tributo. Entregue uma de suas lembranças mais caras e receba uma das nossas.\"</i> Cada um narra uma memória importante, que some da mente dele (os outros lembram de ter ouvido), e recebe uma memória gnômica. Mentira e magia não enganam (só Desejo).",
					"<b>Pacto de Hyninn:</b> devoto com Religião CD 20 nota a marca do deus e entrega a memória sem revelá-la ao grupo.",
					`Quando todas as criaturas inteligentes pagam, a cabeça se abre: escadaria para o Nível 2. Recusar e forçar: as quatro estátuas atacam até cada um pagar (narrar leva uma rodada). A voz é ouvida em toda a masmorra, mas ninguém vem. Use ${linkMacro("Mecanismos")} › tributo e ${L(tabelaMemorias)}.`, "<b>Monstros:</b> quatro estátuas animadas.")}
				${sala("Sala 15 · Antessala do Salão Principal", "Proteção do salão e antiga entrada dos construtores. Um baú entreaberto cheio de riquezas (ilusão, Vontade CD 18) e uma armadilha no piso. Basta passar ao largo do centro e não tocar no baú. Na parede, com tinta preta: <i>\"Não puxe as alavancas. Homens-peixe cruéis.\"</i>", arm("fossoTriplo"), arm("gas"))}`, 400),
			pagina("Nível 2", `
				<p>Mais danificado que o Nível 1; o rio se ouve o tempo todo. Ao chegar pela cabeça, role 1d6: par, a ameba adulta vai da Sala 2 para a 3; ímpar, vem para a Sala 1 (circula em sentido anti-horário e volta). Ela pode trancar a passagem.</p>
				${sala("Sala 1 · Chegada", "Ligeiramente elevada, com escada para a próxima. Vazia. Ao sul, uma passagem desabada para uma caverna natural.", ALAGADO, "<b>Monstro:</b> ameba gigante adulta (de passagem).")}
				${sala("Sala 2 · Primeira Sala Alagada", "Porta aberta para a Sala 3; fechar e barrar a ameba é fácil.", ALAGADO, "<b>Monstro:</b> ameba gigante adulta.")}
				${sala("Sala 3 · Emboscada dos Tiranos", "Os tiranos tentam atrair o grupo para a Sala 4. Quem tem linha de visão vê os tesouros dela. Intuição ou Sobrevivência CD 20: os tiranos não ligam para os objetos (já os teriam pegado).", "<b>Monstros:</b> dois tiranos das águas.")}
				${sala("Sala 4 · Armadilha de Afogamento", "Riquezas e moedas espalhadas pelo chão (a sala se encheu e esvaziou muitas vezes) e ossos de aventureiros.", arm("afogamento"),
					`Dá para evitar movendo o tesouro com magia ou ficando intangível. ${ALAGADO} <b>Porta:</b> ${L(atores.porta)}. <b>Monstros:</b> dois tiranos (podem entrar junto e lutar sem penalidade). <b>Tesouro:</b> ND 3 (2 rolagens em dinheiro).`)}
				${sala("Sala 5 · Área Desabada", "Um desabamento abriu a parede entre a Sala 4 e uma caverna, um pouco elevada. Um túnel sobe por uma hora até uma passagem bloqueada: uma hora de trabalho cria uma entrada direta para o Nível 2. Na parede: <i>\"Esqueça a escadaria. Resolva o enigma ou volte para casa.\"</i>", arm("fossoProfundo"))}
				${sala("Sala 6 · Rio Subterrâneo", "Não deveria ser acessível; o desgaste abriu passagens (daí o alagamento e a infestação). Corre de sul para norte. Cair ou mergulhar no rio pula o tributo, mas é invasão: os tiranos atacam na hora.",
					"Nadar: ação de movimento e Atletismo CD 20 por rodada. Passa: avança metade do deslocamento. Falha por até 5: boia parado. Por 6 a 10: levado 1d6 quadrados. Por 11 ou mais: afunda e é levado 1d6. Uma segunda ação de movimento dá outro teste. Submerso: prende o fôlego (1 + Con rodadas, depois Fortitude CD 15 +1). Use <i>Testes › Rio</i> e <i>Prender o fôlego</i>.",
					"Primeiro, só dois tiranos e um cardume atacam; com mais gente no rio, ou se o personagem estiver vencendo, vêm todos. O extremo norte termina num túnel cheio de água: quase morte certa, e quem sobrevive sai onde o Mestre quiser nas Centrais.",
					"<b>Monstros:</b> nove tiranos das águas, três barões, quatro cardumes.")}
				${sala("Sala 7 · Passagem Desabada", "Criada por um desabamento. Os tiranos perseguem o grupo até aqui, mas não entram na Sala 11.")}
				${sala("Sala 8 · Sala de Reparos Arruinada", `Só um autômato ferreiro continua de pé, fora de controle: golpeia o que está na bigorna e quem estiver por perto (${L(atores.ferreiro)}). A bigorna funciona; dá para atrair inimigos para cá. ${L(itemPorNome("Livro Semidestruído"))}: uma história do Herói Louco.`, arm("executora"), ALAGADO)}
				${sala("Sala 9 · Escritório", "Quase tudo saqueado ou mofado: os gnomos pesquisavam como fazer os outros mortais lembrarem de Tilliann. Resta uma mesa redonda de leitura que é também o enigma para o Nível 3: <b>20 tabuletas</b> e três espaços no centro (veja a página do enigma). Colocar Valkaria, Tilliann e Kallyadranoch abre a passagem (ruído 4).", ALAGADO)}
				${sala("Sala 10 · Ninho da Cocatriz", "Um ninho de detritos e restos de aventureiros. A cocatriz, extremamente territorial, ataca quem entra.", ALAGADO, "<b>Monstro:</b> cocatriz.")}
				${sala("Sala 11 · Túmulos", "Duas tumbas com lápides em gnômico (Fremdak e Zonzibor, se decifradas). Há um espelho na frente de cada uma, e eles refletem as tumbas <b>contrárias</b>: basta inverter os espelhos para abrir. Ladinagem não funciona; à força é Força CD 25 ou 100 de dano, e um mecanismo estraga o tesouro (três tentativas arruínam o de uma tumba).",
					`Dentro: ossos gnômicos, equipamento estragado, ${L(itemPorNome("Tabuletas dos Túmulos"))}, gemas e instrumentos de ofício. Duas paredes desabadas: uma dá no rio, logo antes de ele sumir num túnel; outra na caverna da Sala 7. ${ALAGADO} <b>Tesouro:</b> ND 4 (1 rolagem em dinheiro), ${L(itemPorNome("Kit de Ofício"))}.`)}
				${sala("Sala 12 · Escadaria", "Escadaria em espiral para o Nível 3 e, ao norte, uma plataforma com um baú (fechado, sem tranca). Feita para aniquilar tolos: os aprovados passam pela Sala 9. Duas estátuas animadas atacam na hora; passar correndo e descer não é perseguido (saída esperta), mas poucos aguentam as uma ou duas rodadas necessárias. A estátua persegue até o Altar Mecânico e para ali.",
					arm("simbolo"), ALAGADO, "<b>Monstros:</b> duas estátuas animadas. <b>Tesouro:</b> ND 4 (1 rolagem em dinheiro).")}
				${sala("Sala 13 · Passagem", "Antiga antecâmara dos túmulos, destruída pelo desabamento que a ligou à caverna.", ALAGADO)}
				${sala("Sala 14 · Altar Mecânico", "O centro do nível, elevado: dois autômatos de gnomos muito elaborados, uma bigorna e alavancas. Religião ou devotos percebem a liturgia: a manufatura é sagrada aqui.",
					"<b>A Forja:</b> Conhecimento, Ofício (engenhoqueiro) ou Ladinagem CD 20 para entender as alavancas (armas, itens, tamanhos). Fabrica <b>qualquer item com até três aprimoramentos</b>, fornecendo materiais especiais pelo espaço de masmorra (menos metal arco-íris). <b>1d6 itens</b> no total, depois para. Deixe claro que é um grande feito. Use <i>Mecanismos › Forja</i>.",
					`Restos de aventureiros mortos há pouco: um deles tem o ${L(itemPorNome("Mapa para uma Masmorra"))}.`,
					arm("desabamento"), "<b>Monstros:</b> cinco mecanículos. <b>Tesouro:</b> ND 5.",
					"<i>Na mesa original</i> o autor cortou os mecanículos: seria só contar rodadas contra o golem provocador, e já passava da meia-noite. Adapte por diversão e tempo, não para salvar ou punir.")}`, 500),
			pagina("Nível 3", `
				${sala("Entradas do Nível 3", "<b>Sala 1</b> (pela passagem da Sala 9): cortada por um braço do rio, pontes caídas. Mecanículos e estátuas com bestas atacam na hora, falando por cima umas das outras em gnômico. Se o grupo cruzar o rio sob os tiros, elas largam as bestas e puxam espadas.",
					"<b>Sala 2</b>: pela escadaria em espiral da Sala 12 e um túnel longo.",
					"<b>Sala 3</b>: quem caiu do Fosso Triplo (provavelmente muito ferido). Uma passagem desabada leva a um túnel longo até um bosque, escondido em raízes: dá para sair e voltar direto ao Nível 3.")}
				${sala("Sala 4 · Salão da Memória", "Não testa nem ensina: garante que quem chega entenda o que viveu. Murais dos 20 deuses da época da Revolta dos Três; onde deveria estar Tilliann, um vazio notável. Hyninn aparece em cores berrantes, como intruso. Khalmyr pune Valkaria, Kallyadranoch e Tilliann (a lacuna), nas Colinas Centrais; Valkaria vai de deusa ativa a estátua suplicante.",
					"As estátuas repetem quatro perguntas em gnômico, sem parar de atacar. Cada resposta gasta uma <b>ação padrão</b>. Aceite qualquer variação que mostre entendimento (até conhecimento do cenário dos jogadores). Com a última certa, estátuas e mecanículos param na hora.",
					...PERGUNTAS.map(([q, r]) => `<b>${q}</b> ${r}`),
					`Use ${linkMacro("Mecanismos")} › resposta certa. <b>Monstros:</b> oito mecanículos, doze estátuas animadas (com bestas), três cardumes no rio.`)}
				${sala("O Altar da Memória", "Numa plataforma, inscrições e diagramas arcanos guardados por duas estátuas gigantes que não atacam e falam a língua dos vencedores.",
					"<i>\"Vitoriosos, sejam bem-vindos ao Altar da Memória. O Templo do Vácuo guarda a memória de uma raça condenada e a lembrança de um deus que não é mais. Vocês, que venceram o Templo, agora são os guardiões de nossa dor esquecida.\"</i>",
					"<i>\"Fremdak e Zonzibor, os arquitetos do Templo, deixaram aqui mais do que suas almas, pois a alma é pouco mais que uma casca sem um deus para recebê-la. Eles deixaram suas memórias, sua engenhosidade, sua inteligência, sua esperteza e seu amor. Dois de vocês podem ser agraciados com o poder das mentes dos arquitetos.\"</i>",
					"<b>No máximo dois personagens, uma vez só:</b> rolam de novo um atributo mental com 4d6 sem o menor dado (abaixo de 10 é ignorado), +2 em Inteligência ou +1 em Carisma (Sabedoria sem bônus), e ganham <b>Engenhosidade</b> dos kliren. Em troca, recebem pedaços das memórias de Fremdak, Zonzibor ou de ambos, sobretudo depois da queda de Tilliann.",
					`<b>Conversão (inferida):</b> o livro usa a escala antiga de 3 a 18. A macro converte o total para o Tormenta20 atual com (total – 10) ÷ 2, arredondado para baixo, e pergunta antes de trocar o valor. ${L(itemPorNome("Engenhosidade"))}.`)}
				${sala("Saída", "Atrás do altar, portas duplas se abrem para um túnel natural. Em uma hora, o grupo emerge a uns <b>dois dias de viagem</b> de onde deveria estar: mais uma prova do espaço de masmorra. Podem voltar depois por riquezas e inimigos que ficaram, mas o prêmio principal só existe uma vez.")}`, 600),
			pagina("Enigma das Tabuletas", `
				<p><b>Para o Mestre.</b> O autor desenhou cada tabuleta com hidrocor em no máximo 1 minuto, sem referência, e não permitiu rolagens nem esclarecimentos: os jogadores precisam só identificar os Três. Desenhe também, se puder (rasgue o papel ou use a mão inábil se for artista).</p>
				<ol>
					<li>Um gato, um rato e um cachorro (Allihanna).</li>
					<li>Uma moeda de ouro (Azgher).</li>
					<li>Uma cobra com braços fortes (Divina Serpente).</li>
					<li>Um arco e flecha (Glórienn).</li>
					<li><b>Uma boca cheia de dentes afiados (Kallyadranoch).</b></li>
					<li>Um canhão (Keenn).</li>
					<li>Uma coroa (Khalmyr).</li>
					<li>Um bebê (Lena).</li>
					<li>Uma katana (Lin-Wu).</li>
					<li>Uma bandeira branca (Marah).</li>
					<li>Uma gosma com chifres e cara de má (Megalokk).</li>
					<li>Uma borboleta numa ventania (Nimb).</li>
					<li>Uma vara de pescar (Oceano).</li>
					<li>Uma boca com uma língua bifurcada (Sszzaas).</li>
					<li>Uma lupa (Tanna-Toh).</li>
					<li>Um grupo de estrelas (Tenebra).</li>
					<li>Uma mão saindo de um túmulo (Thyatis).</li>
					<li><b>Uma tabuleta em branco (Tilliann).</b></li>
					<li><b>Uma mochila cheia de coisas (Valkaria).</b></li>
					<li>Um relâmpago e um arco-íris (Wynna).</li>
				</ol>
				<p>Resolvido, os jogadores devem ter certeza de que tudo nas Colinas diz respeito à Revolta dos Três e de que estão num templo a Tilliann. A história completa só no Nível 3.</p>`, 700),
			pagina("Handouts · Anotações de Kizadrinni", `
				<p class="secret">O autor esqueceu de pôr no livro um NPC com tudo sobre o espaço de masmorra; as anotações eram da mãe de Kiki, da mesa original. Faça da pesquisadora uma NPC cujos pergaminhos aparecem em lugares estratégicos, ou troque por alguém ligado ao histórico de um PJ. A terceira é achada dentro do Templo.</p>
				<h3>Anotações 1</h3>
				<blockquote><p><i>"É claro que sempre existiram estruturas subterrâneas. E nenhuma cultura, até onde sabemos, deixou de ter masmorras. Mas existe algo estranho, uma diferença entre os escritos mais antigos, de antes da Grande Batalha, e tudo que veio depois. Mais ou menos a partir do ano 650 começa a haver relatos de lugares subterrâneos onde as coisas são diferentes. (...) Depois de 650 os exploradores descrevem labirintos subterrâneos tomados por bizarria, cheios de armadilhas improváveis e criaturas raras. Talvez eu tenha descoberto o primeiro registro que pondera 'por que a aranha gigante nunca atacou os gnolls da sala ao lado, mas atacou os aventureiros assim que surgiram?'. (...) Os registros falam de corredores repletos de armadilhas que nunca eram ativadas pelos habitantes da masmorra, de portas trancadas há séculos, atrás das quais viviam guardiões sem fonte de comida, sem qualquer atividade em suas vidas a não ser esperar por aventureiros. O que significa isso? Por que a mudança?</i></p>
				<p><i>O mundo parece funcionar de forma ligeiramente diferente nas masmorras. É um espaço hostil onde cada coisa parece feita para matar, mas de uma forma astuta, quase como um jogo. É quase como se um lugar pudesse ter uma intenção. Quase como se a masmorra odiasse os exploradores. Por enquanto estou chamando este fenômeno de 'espaço de masmorra' (...) Uma das primeiras masmorras relatadas com estas características está num lugar desolado, um fim de mundo conhecido como Colinas Centrais. Mais precisamente no nordeste da região. É possível que eu precise entrar lá pessoalmente. Mas, por razões óbvias, evitarei isso ao máximo."</i></p></blockquote>
				<h3>Anotações 2</h3>
				<blockquote><p><i>"De tudo que estudei nesses anos, nunca pensei que teologia fosse o mais importante. Se soubesse, teria me dedicado mais. Existe um quebra-cabeça, mas as peças não se encaixam. O espaço de masmorra é domínio de Hyninn. Mas como explicar tudo que não faz parte dos dogmas normais do Deus dos Ladrões? Hyninn pode ser letal, eu sabia disso. Mas ele não é um corruptor. Hyninn não se deleita na degradação. Transformar uma pessoa em um monstro não parece o tipo de peça que o deus pregaria. (...) Isso não é roubar, é destruir. Já me ocorreu que possa ser um plano sszzaazita. Corrupção e, é claro, serpentes. É quase óbvio demais. (...) O que há de intrínseco nelas vem de Hyninn, não de Sszzaas. Existe algo ou alguém distorcendo tudo isso de dentro. Resta saber o que é."</i></p></blockquote>
				<h3>Anotações 3 (dentro da masmorra)</h3>
				<blockquote><p><i>"Antes que os corredores desta masmorra me aprisionem, deixo esta mensagem para quem vier aqui depois de nós. Eu ainda sou eu e, se nada mais sobrar de mim exceto a ferocidade, que sobre isto. Você não está num lugar natural. O espaço de masmorra é arquitetura mística. É o subterrâneo mítico. (...) O evento que transformou a Criação e deu origem ao espaço de masmorra foi a ascensão de Hyninn. E todos nós que vagamos pelas masmorras, exploradores e monstros errantes, somos sacrifícios ao Deus dos Ladrões. (...) Ele comprou poções de uma fada, mas foi enganado. Eram poções falsificadas. Matar através da enganação: a marca de Hyninn. O resto de meu grupo foi embora, mas eu decidi ficar. (...) Estou passando por uma transformação lenta, cumprindo o destino de minha família e me tornando o que eu sabia que iria me tornar. Mas por enquanto ainda sou eu. Pesquisadora, estudiosa, mãe. Quem quer que leia isto, lembre do meu nome e saiba que fui tudo isso, mesmo que um dia não seja mais. Eu sou Kizadrinni Odello e não sou um monstro errante. Pelo menos não ainda."</i></p></blockquote>`, 800),
			pagina("Handouts · Achados", `
				<h3>A última página do diário (Nível 1, Sala 4)</h3>
				<blockquote><p><i>"Nós nos preparamos como normal. Trouxemos tochas, cordas, armas. Eu nunca imaginei que entender o que eles falam seria tão importante. Todos os outros morreram. Tentei aguentar acordado até conseguir achar a saída, mas estou exausto. Preciso dormir algumas horas. Assim que acordar vou continuar. Sei que estou perto. A masmorra nos venceu, mas vou reunir outro grupo para voltar outro dia. E dessa vez trarei um sábio."</i></p></blockquote>
				<h3>Na parede da Antessala (Nível 1, Sala 15)</h3>
				<blockquote><p><i>"Não puxe as alavancas. Homens-peixe cruéis."</i></p></blockquote>
				<h3>Na parede da Área Desabada (Nível 2, Sala 5)</h3>
				<blockquote><p><i>"Esqueça a escadaria. Resolva o enigma ou volte para casa."</i></p></blockquote>
				<h3>As tabuletas dos túmulos (com Compreensão)</h3>
				<blockquote><p><i>"Parabéns, você provou ser mesmo esperto! A partir de agora, os espertos não constroem... Eles roubam!"</i></p>
				<p><i>"Parabéns, você provou ser mesmo engenhoso! O que é mais engenhoso? Criar algo ou enganar quem criou? Acho que você sabe a resposta!"</i></p></blockquote>
				<h3>Memórias dos gnomos (o tributo)</h3>
				<p>Narre de modo que os jogadores entendam o Mundo de Tilliann antes e durante a queda: um lugar coberto de construções, animais mecânicos fabricados uns pelos outros, o cristal rosado, tecnologia parecida com a kliren que já viram, o nome "gnomos" e o vazio quando o deus caiu.</p>
				<ol>${MEMORIAS.map((m) => `<li>${m}</li>`).join("")}</ol>`, 900)
		]
	});

	ui.notifications.info(`Templo do Vácuo criado: criaturas, armadilhas, 3 tabelas, diário e 7 macros. Veja a pasta "${NOME_PASTA}".`);
})();
