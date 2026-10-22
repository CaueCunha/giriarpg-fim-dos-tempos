/* =====================================================================
 * FIM DOS TEMPOS · ARCO 2 · AVENTURA 4 · "MASSACRE NA TAVERNA DOS MANÍACOS"
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Arco 2 · Av4 · Massacre na Taverna dos Maníacos" com:
 *      - Ameaças: as manifestações dos internos da Casa de Repouso (carrasco de Lena de Rylonn,
 *        cocatriz-real de Bdun e quimera de Grisgemm) e o Imagoduto.
 *      - Apoio: Click, Drasala, Calliko, Dorothea e Ellanie Millicent, e os clientes Emblyn,
 *        Blanto e Coltrack (sem ficha no livro).
 *      - Itens: as oito bebidas anãs da Terceira Opção, a partitura de Calliko, a peça do
 *        Imagoduto e as provas.
 *      - Tabelas: Efeitos de Loucura, Surtos dos Internos e Bebidas Anãs.
 *      - Diário com guia, a taverna, bandas e clientes, a investigação, a briga, o show,
 *        Dorothea, a Casa de Repouso, a batalha insana e o desfecho.
 *      - Macros: Briga de Taverna, Show na Terceira Opção, Beber na Terceira Opção,
 *        Batalha Insana e Sabotar o Imagoduto.
 *   3. Lei & Ordem continua no ator e na macro criados pela Aventura 0 (não são recriados aqui).
 *   4. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "a2av4".
 *
 * Feito a partir do código do sistema (1.6.4, out/2026). Validado no Foundry simulado do
 * módulo giriarpg-fim-dos-tempos; veja o guia a2-av4-taverna-maniacos.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "a2av4";
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
			window: { title: "Aventura 4 do Arco 2: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para a Aventura 4 do Arco 2.</p>
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
	/* 1. Construtores (mesmos das outras aventuras)                              */
	/* ------------------------------------------------------------------ */
	const NOME_PASTA = "FdT · Arco 2 · Av4 · Massacre na Taverna dos Maníacos";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#5b2a4a", flags: FLAGS() })).id;
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
					movement: { walk: { base: d.walk ?? 9, bonus: [] } },
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


	const L = (d) => (d?.uuid ? `@UUID[${d.uuid}]{${d.name}}` : "");
	const ICO = {
		caneca: `${T20I}/itens/gerais/caneca.webp`,
		bebida: `${T20I}/itens/gerais/bebida-comum.webp`,
		odre: `${T20I}/itens/gerais/odre.webp`,
		alaude: `${T20I}/itens/gerais/alaude-elfico.webp`,
		instrumento: `${T20I}/itens/gerais/instrumento-musical.webp`,
		exotico: `${T20I}/itens/gerais/instrumento-musical-exotico.webp`,
		ferramentas: `${T20I}/itens/gerais/instrumentos-de-oficio.webp`,
		pergaminho: `${T20I}/itens/gerais/pergaminho.webp`,
		cristal: `${T20I}/itens/gerais/po-de-cristal.webp`
	};
	const SURTOS = "<b>Surtos.</b> Quem falhar no teste de apaziguar por 5 ou mais fortalece a manifestação: role 1d4 na tabela <i>Surtos dos Internos</i> (a macro <i>Batalha Insana</i> faz isso e aplica o efeito).";
	const apaziguar = (interno, cd, pericias, como) => poder(`Apaziguar ${interno} (CD ${cd})`, `${T20I}/magias/curar-ferimentos.webp`,
		p(`Em vez de vencer a manifestação, o grupo pode apaziguar ${interno}: <b>5 sucessos</b> em testes de <b>${pericias}</b> contra <b>CD ${cd}</b>. ${como}`,
			"Cada teste é uma <b>ação padrão</b> e o grupo só faz <b>um teste por rodada</b>; os outros podem gastar a própria ação padrão para ajudar com as mesmas perícias. Use a macro <i>Batalha Insana</i>.",
			SURTOS),
		{ exec: "passive" });

	/* ------------------------------------------------------------------ */
	/* 2. Ameaças: as manifestações dos internos e o Imagoduto              */
	/* ------------------------------------------------------------------ */
	const atores = {};
	const INTERNO = "Manifestação de um interno da Casa de Repouso, durante a <b>Batalha Insana</b> na cela de Calliko. Os três surgem <b>um de cada vez</b>, nesta ordem: Rylonn, Bdun e Grisgemm. Não é preciso vencer todos: basta sobreviver até destruir ou desativar o Imagoduto, apaziguar os internos ou acalmar Calliko.";

	atores.carrasco = await criarNPC({
		name: "Carrasco de Lena (tormento de Rylonn)",
		tokenName: "Carrasco de Lena",
		role: "carrasco",
		img: `${T20I}/ameacas/lobo-crocodilo.png`,
		nd: 6,
		cd: 22,
		tipo: "mon",
		tamanho: "gra",
		tokenSize: 2,
		atr: { for: 5, des: 1, con: 4, int: -4, sab: 1, car: -2 },
		pv: 180,
		def: 27,
		walk: 9,
		sentidos: ["escuro"],
		pericias: { inic: 6, perc: 6, fort: 16, refl: 12, vont: 8, luta: 20 },
		ataquesTxt: "Tentáculo +20 (2d6+10 corte) e mordida +20 (2d8+20).",
		resTxt: "Inversão de dano; vulnerabilidade a cura.",
		bio: p("<b>Rylonn, o qareen masoquista:</b> \"Sim, eu mereço... Mereço sofrer!\"", INTERNO,
			"Salamandra imensa com um tentáculo terminado numa maça de cravos (<i>Ameaças de Arton</i>, p. 103). Tenta agarrar ou derrubar com o tentáculo e morder; contra vários oponentes, usa o Açoite Circular.",
			"<b>Tática do livro:</b> a melhor saída é só \"segurar\" o carrasco enquanto alguém trabalha no Imagoduto, sem derrotá-lo, para que os monstros mais fortes não cheguem. Se o grupo descobrir isso, deixe funcionar."),
		items: [
			arma("Tentáculo", `${T20I}/poderes/ameacas/agarrar.webp`, { dano: "2d6+10", tipo: "corte", desc: p("Quando caça, tenta agarrar ou derrubar a vítima com o tentáculo para deixá-la vulnerável à mordida.") }),
			arma("Mordida", "icons/creatures/abilities/mouth-teeth-long-red.webp", { dano: "2d8+20", tipo: "perfuracao" }),
			poder("Açoite Circular", `${T20I}/poderes/ameacas/varrer.webp`,
				p("Agita o tentáculo e causa <b>2d6+10 de corte</b> em todas as criaturas a até 3m. <b>Reflexos CD 22</b> reduz à metade."),
				{ exec: "action", area: "raio de 3m", save: "Reflexos CD 22 reduz à metade", rolls: [["Açoite", [["2d6+10", "corte"]]]] }),
			poder("Inversão de Dano", `${T20I}/poderes/ameacas/imunidade-magia.webp`,
				p("Converte <b>qualquer dano recebido em cura</b>. Já com PV máximos, recebe PV temporários, até um total igual aos PV máximos (180).",
					"<b>Cuidado:</b> o sistema aplica o dano normalmente; desfaça e cure à mão."),
				{ exec: "passive" }),
			poder("Vulnerabilidade a Cura", `${T20I}/poderes/ameacas/vulnerabilidade.webp`,
				p("Efeitos de cura <b>causam dano</b> ao carrasco em vez de curar. Itens alquímicos e poções de cura servem como granadas (ele reduz à metade com Reflexos contra a CD do item)."),
				{ exec: "passive" }),
			apaziguar("Rylonn", 22, "Cura ou perícias sociais", "Faça-o compreender que não merece sofrer.")
		]
	});

	atores.cocatriz = await criarNPC({
		name: "Cocatriz-Real (tormento de Bdun)",
		tokenName: "Cocatriz-Real",
		role: "cocatriz",
		img: `${T20I}/ameacas/basilisco.png`,
		nd: 7,
		cd: 26,
		tipo: "mon",
		tamanho: "gra",
		tokenSize: 2,
		atr: { for: 2, des: 7, con: 3, int: -5, sab: 1, car: -2 },
		pv: 250,
		def: 32,
		walk: 6,
		sentidos: ["escuro"],
		pericias: { inic: 17, perc: 8, fort: 20, refl: 12, vont: 7, luta: 24 },
		ataquesTxt: "Bicada +24 (2d8+12 perfuração) e cauda de serpente +20 (1d8+10 impacto).",
		resTxt: "Evasão.",
		bio: p("<b>Bdun, o goblin megalomaníaco:</b> acha que é o Rei-Imperador Thormy.", INTERNO,
			"Cocatriz gigante com cauda de serpente (<i>Ameaças de Arton</i>, p. 199). Voa só distâncias curtas: sempre termina o movimento no chão ou em outra superfície firme."),
		items: [
			arma("Bicada", `${T20I}/poderes/ameacas/bote.webp`, {
				dano: "2d8+12", tipo: "perfuracao",
				desc: p("<b>Bicada Petrificante:</b> quem sofrer dano fica <b>lento</b> (Fortitude CD 26 evita). Se já estava lento, fica <b>petrificado</b> permanentemente (efeitos que removem paralisia revertem). Botões de condição no card."),
				effects: [cond("Lento"), cond("Petrificado")]
			}),
			arma("Cauda de Serpente", `${T20I}/poderes/ameacas/cauda.webp`, { dano: "1d8+10", tipo: "impacto", ajuste: -4 }),
			poder("Voo de Galinha", `${T20I}/poderes/ameacas/asas.webp`,
				p("Deslocamento de voo 12m, mas só por curtas distâncias: termina sempre o movimento sobre o chão ou outra superfície firme."),
				{ exec: "passive", effects: [chave("Voo de galinha (12m)", `${T20I}/poderes/ameacas/asas.webp`, [["system.attributes.movement.fly.base", "12", "override"]], true)] }),
			poder("Evasão", `${T20I}/poderes/combate.webp`, p("Passando num teste de Reflexos que reduz o dano à metade, não sofre dano nenhum."), { exec: "passive" }),
			apaziguar("Bdun", 24, "Nobreza ou perícias sociais", "Trate-o como Thormy, com \"súplicas\" de seus \"súditos\", ou faça Bdun entender que não é Thormy.")
		]
	});

	atores.quimera = await criarNPC({
		name: "Quimera (tormento de Grisgemm)",
		tokenName: "Quimera",
		role: "quimera",
		img: `${T20I}/ameacas/manticora.png`,
		nd: 8,
		cd: 26,
		tipo: "mon",
		tamanho: "gra",
		tokenSize: 2,
		atr: { for: 6, des: 3, con: 4, int: 0, sab: 1, car: -2 },
		pv: 333,
		def: 33,
		walk: 9,
		sentidos: ["escuro", "faro"],
		pericias: { inic: 7, perc: 10, fort: 21, refl: 15, vont: 8, luta: 26 },
		ataquesTxt: "Três mordidas +26 (3d8+7) e duas garras +24 (2d6+10).",
		bio: p("<b>Grisgemm, o anão com múltiplas personalidades:</b> fala como três pessoas, Salassan (o elfo), Grumk (o hobgoblin) e Hans (o humano). Cada cabeça da quimera é uma delas.", INTERNO,
			"<i>Ameaças de Arton</i>, p. 204. Aqui está a quimera clássica: <b>bode, leão e dragão</b>. Para variar, troque uma cabeça por gorlogg, hidra, javali, serpente, tigre ou tubarão (veja o livro)."),
		items: [
			arma("Mordida (Salassan, cabeça de dragão)", "icons/creatures/abilities/dragon-fire-breath-orange.webp", { dano: "3d8+7", tipo: "perfuracao" }),
			arma("Mordida (Grumk, cabeça de leão)", `${T20I}/poderes/ameacas/mordida.webp`, {
				dano: "3d8+7", tipo: "perfuracao",
				desc: p("<b>Leão:</b> quando acerta esta mordida, pode usar a manobra <b>agarrar</b> como ação livre (teste +28).")
			}),
			arma("Marrada (Hans, cabeça de bode)", `${T20I}/poderes/ameacas/marrada.webp`, {
				dano: "3d8+7", tipo: "impacto",
				desc: p("<b>Bode:</b> numa investida, se acertar, arremessa a vítima 1d6 × 1,5m na direção que escolher (<b>Fortitude CD 26</b> evita). A vítima fica caída e, se bater em algo, sofre 1d6 de impacto para cada 1,5m."),
				effects: [cond("Caído")]
			}),
			arma("Garra", `${T20I}/poderes/ameacas/garras.webp`, { dano: "2d6+10", tipo: "corte", ajuste: -2 }),
			poder("Sopro de Fogo (cabeça de dragão)", `${T20I}/poderes/ameacas/sopro.webp`,
				p("Cone de 6m: <b>10d6+20 de fogo</b>, <b>Reflexos CD 26</b> reduz à metade. <b>Recarga (movimento):</b> depois de usar, gasta uma ação de movimento para poder usar de novo."),
				{ exec: "action", area: "cone de 6m", save: "Reflexos CD 26 reduz à metade", rolls: [["Sopro", [["10d6+20", "fogo"]]]] }),
			poder("Mente Tripla", `${T20I}/poderes/ameacas/visao-ampla.webp`,
				p("Em testes de <b>Percepção</b> ou <b>Vontade</b>, joga três dados e usa o melhor."), { exec: "passive" }),
			poder("Voo", `${T20I}/poderes/ameacas/asas.webp`,
				p("Asas dracônicas: voo 12m."),
				{ exec: "passive", effects: [chave("Voo (12m)", `${T20I}/poderes/ameacas/asas.webp`, [["system.attributes.movement.fly.base", "12", "override"]], true)] }),
			apaziguar("Grisgemm", 26, "Guerra ou perícias sociais", "Faça as personalidades interagirem, fazerem as pazes ou reconhecerem que são parte de um todo.")
		]
	});

	atores.imagoduto = await criarNPC({
		name: "Imagoduto da Casa de Repouso",
		tokenName: "Imagoduto",
		role: "imagoduto",
		img: `${T20I}/ameacas/engenho-de-guerra-goblin.png`,
		nd: 7,
		cd: 30,
		tipo: "con",
		papel: "special",
		tamanho: "gra",
		tokenSize: 2,
		disposition: 0,
		link: true,
		atr: { for: 0, des: -5, con: 0, int: 0, sab: 0, car: 0 },
		pv: 500,
		def: 5,
		walk: 0,
		res: { dano: { base: 20 } },
		resTxt: "RD 20 que nenhum efeito ignora.",
		bio: p("Máquina de Ghorskander instalada por Torgo há quase um ano no quarto andar, na cela que depois virou a de Calliko. Canaliza os delírios dos internos, impede que se curem, transmite imagens de Galrasia e espalha o frenesi por Valkaria (a raiva que vai materializar o Mecano-Lagarto-Terror).",
			"<b>Desativar:</b> 50 sucessos em <b>Ofício (engenhoqueiro) CD 30</b>, cada teste uma <b>ação completa</b>. Use a macro <i>Sabotar o Imagoduto</i>.",
			"<b>Destruir:</b> 500 PV e <b>RD 20</b> que não pode ser ignorada (ele absorve a energia dos golpes e a espalha como violência). Desativado ou destruído, a batalha termina na hora.",
			"Investigação ou Misticismo CD 25 na cela de Calliko revela a energia do Imagoduto e o cristal rosado. Destruí-lo ajuda os internos e restaura Lei &amp; Ordem."),
		items: [
			poder("Desativar o Imagoduto", ICO.ferramentas,
				p("<b>Ofício (engenhoqueiro) CD 30</b>, ação completa, 50 sucessos. Cada sucesso é desabilitar e entender uma pecinha de uma máquina que mexe com magia, espaço interplanar e ciência experimental."),
				{ exec: "full", save: "Ofício (engenhoqueiro) CD 30" })
		]
	});

	/* ---------- NPCs sem ficha no livro (só para tokens e retratos) ---------- */
	const SEM_FICHA = "<b>Não tem ficha no livro.</b> Este ator existe para o token no mapa e para mostrar aos jogadores.";
	const apoio = (role, name, img, raca, tipo, atr, bio) => criarNPC({
		name, role, img, disposition: 1, link: true, nd: 1, tipo, raca, papel: "special", atr, pv: 10, def: 10, bio: p(...bio, SEM_FICHA)
	});
	atores.click = await apoio("click", "Click, o Taverneiro", `${T20I}/ameacas/esqueleto.png`, "osteon (anão)", "mor", { for: 1, des: 0, con: 2, int: 0, sab: 1, car: 1 }, [
		"Anão que morreu na Guerra Artoniana e se ergueu como osteon \"porque não aguentava mais a música tocada perto do cemitério\". Nunca foi bardo, mas adora música. Abriu a <b>Terceira Opção</b> com o tesouro saqueado dos puristas, para quem não tem medo de tocar coisas diferentes. O nome antigo era Bhulgarassimm; a mandíbula estala quando ele fala.",
		"Direto e até brusco. Tem acordo com a Guilda dos Cervejeiros de Doherimm: cervejas que só os anões bebem. Quer as brigas resolvidas e paga bem por isso."
	]);
	atores.drasala = await apoio("drasala", "Drasala, a Segurança", `${T20I}/ameacas/nagah-guardiao.png`, "medusa", "hum", { for: 4, des: 0, con: 4, int: -1, sab: 0, car: -1 }, [
		"Medusa forte e resistente, ex-gladiadora da Arena de Valkaria: fazia a \"vilã\" nas lutas de exibição e aguentava dano como ninguém. Um gladiador cortou metade das serpentes da cabeça dela com um machado.",
		"Faz o serviço de três seguranças. Anda cada vez mais violenta (espancou um bandido até Click segurá-la) e não sabe por quê. Não larga o emprego para não deixar Click na mão."
	]);
	atores.calliko = await apoio("calliko", "Calliko, o Bardo Insano", "icons/svg/mystery-man.svg", "silfo", "esp", { for: -2, des: 2, con: -1, int: 1, sab: -1, car: 3 }, [
		"Silfo bardo comum de Valkaria até reclamar em voz alta: \"Só queria ter mais inspiração!\". Um aspecto de Nimb lhe deu um dado de seis faces, que virou cores e borboletas e entrou em sua cabeça. Ficou com a <b>tatuagem de um d6 no rosto</b> e inspiração infinita, descontrolada, insana.",
		"Não come nem dorme: compõe sem parar, até os dedos ficarem em carne viva. Dorothea o levou para a Casa de Repouso da avó. As melodias dele espalham a loucura de Nimb: quem ouve fica violento.",
		"Qualquer menção a limitar as composições, a Nimb ou ao Imagoduto o põe em frenesi e começa a <b>Batalha Insana</b>."
	]);
	atores.dorothea = await apoio("dorothea", "Dorothea Millicent", "icons/svg/mystery-man.svg", "humana", "hum", { for: -1, des: 0, con: 0, int: 1, sab: 1, car: 0 }, [
		"Vinte e poucos anos, casaca de couro bordada com os nomes das bandas que ama, óculos de lentes grossas, tímida e atabalhoada. Ouvido apuradíssimo para música. Neta de Ellanie: a primeira da família a não seguir o sacerdócio de Marah.",
		"Copiou as chaves e visita Calliko toda noite; vende as partituras de taverna em taverna, toda semana. Não resiste se confrontada: gagueja, mente mal e abre o jogo com um mínimo de pressão. Implora que não contem à avó."
	]);
	atores.ellanie = await apoio("ellanie", "Ellanie Millicent", "icons/svg/mystery-man.svg", "humana", "hum", { for: -1, des: -1, con: 0, int: 1, sab: 3, car: 2 }, [
		"Anciã clériga de Marah, bem-humorada e otimista, mas exausta há anos. Fundou a Casa de Repouso Millicent para Espíritos Atormentados logo antes do primeiro ataque da Tormenta e hoje cuida sozinha de dezenas de internos, com ajuda de voluntários.",
		"Responde tudo, fica horrorizada com o que a neta fez e dá acesso total: o quarto andar \"deveria estar vazio\". Admite que não sabe de um terço do que acontece lá."
	]);
	atores.emblyn = await apoio("emblyn", "Emblyn", "icons/svg/mystery-man.svg", "humana", "hum", { for: 0, des: 1, con: 0, int: 0, sab: 0, car: 1 }, [
		"Jovem fã de música, decidida e agressiva, cliente fiel da Terceira Opção. Estava na apresentação da Brasão de Kor Kovith quando começou a primeira briga. Se confundir com Dorothea, corte-a ou apresente as duas juntas, como amigas ou casal."
	]);
	atores.blanto = await apoio("blanto", "Blanto", "icons/svg/mystery-man.svg", "hynne", "hum", { for: -1, des: 2, con: 0, int: 1, sab: 1, car: 0 }, [
		"Hynne frequentador da Terceira Opção, cheio de hematomas e com um olho fechado. Reconhece uma composição de Calliko na hora e confirma: em toda briga, havia pelo menos uma música do bardo misterioso no repertório."
	]);
	atores.coltrack = await apoio("coltrack", "Coltrack", "icons/svg/mystery-man.svg", "humano", "hum", { for: 2, des: 1, con: 1, int: -1, sab: -1, car: -1 }, [
		"Capanga de aluguel e ladrão ocasional, atraído pelas brigas para roubar e bater em fracos. Nunca roubou ninguém: sempre fica com raiva demais. Apanhou de um minotauro e de um anão. Não faz ideia da música que tocava."
	]);

	/* ------------------------------------------------------------------ */
	/* 3. Itens                                                             */
	/* ------------------------------------------------------------------ */
	const itemDoc = (d) => ({ ...d, folder: pasta.Item, flags: FLAGS() });
	const tesouro = (name, img, html) => itemDoc({ name, type: "tesouro", img, system: { description: { value: html }, qtd: 1, preco: 0, peso: 0, espacos: 0 } });
	const UM_DIA = { value: 86400, units: "seconds" };
	const ALCOOL = "Ao beber, <b>Fortitude</b> contra a CD indicada (+5 por dose adicional no mesmo dia). Falhou: <b>embriagado</b> (–2 em testes de Destreza e Carisma); se já estava, <b>bebum</b> (desprevenido, –5); se já estava bebum, <b>inconsciente</b>. Tudo dura até o fim do dia. A macro <i>Beber na Terceira Opção</i> rola e aplica.";
	/** Bebidas anãs: [nome, CD, preço, descrição, efeito do benefício]. */
	const BEBIDAS = [
		["Cerveja Barbas de Heredrimm", 15, 20, "Forte, de espuma amarela e sabor adstringente. Fornece <b>+1d6 em um teste</b> à sua escolha até o fim do dia.",
			aoUsar("Barbas de Heredrimm (+1d6, uma vez)", ICO.caneca, [["roll", "1d6"]], ["skill", "attack"])],
		["Cerveja Beluhga", 20, 45, "Opaca e esbranquiçada, espuma azul no caneco, leve sabor mentolado. Fornece <b>redução de fogo 5</b>.",
			fx("Beluhga: redução de fogo 5", ICO.caneca, [["system.tracos.resistencias.fogo.bonus", "5"]], { duration: UM_DIA, transfer: false })],
		["Cerveja do Escavador", 20, 36, "Prestigiosa em Doherimm, rara na superfície. Fornece <b>+1 em Força</b>, mas <b>–3m de deslocamento</b>.",
			fx("Escavador: +1 For, –3m", ICO.caneca, [["system.atributos.for.bonus", "1"], ["system.attributes.movement.walk.base", "-3"]], { duration: UM_DIA })],
		["Cerveja Rangedente", 20, 60, "Viscosa e gosmenta, prepara as tripas para sofrimentos maiores. Fornece <b>+2 em Fortitude</b>.",
			fx("Rangedente: +2 Fortitude", ICO.caneca, [["system.pericias.fort.bonus", "2"]], { duration: UM_DIA })],
		["Destilado Limpa-Ventas", 15, 20, "Amarelo e opaco, com um inesperado sabor picante. Fornece <b>redução de frio 5</b>.",
			fx("Limpa-ventas: redução de frio 5", ICO.bebida, [["system.tracos.resistencias.frio.bonus", "5"]], { duration: UM_DIA })],
		["Destilado Tuku'tu", 20, 36, "Quente e amargo, inflama as veias e acelera o coração. Fornece <b>+2 em Reflexos</b>.",
			fx("Tuku'tu: +2 Reflexos", ICO.bebida, [["system.pericias.refl.bonus", "2"]], { duration: UM_DIA })],
		["Licor Bafo de Elfa", 15, 20, "Leve, suave e adocicado; parece nem ter álcool, até algumas doses \"inofensivas\". Fornece <b>+2 em Misticismo</b>.",
			fx("Bafo de elfa: +2 Misticismo", ICO.bebida, [["system.pericias.mist.bonus", "2"]], { duration: UM_DIA })],
		["Cerveja Água-de-Sangue", 15, 20, "Amarga e avermelhada, aumenta a concentração e a determinação. Fornece <b>+2 em Vontade</b>.",
			fx("Água-de-sangue: +2 Vontade", ICO.caneca, [["system.pericias.vont.bonus", "2"]], { duration: UM_DIA })]
	];
	const bebida = ([nome, cd, preco, desc, efeito]) => itemDoc({
		name: `${nome} (CD ${cd})`,
		type: "consumivel",
		img: nome.startsWith("Cerveja") ? ICO.caneca : ICO.bebida,
		effects: [efeito],
		system: {
			description: { value: p(desc, "Dura <b>1 dia</b>. Uma das cervejas anãs exclusivas da Terceira Opção (acordo de Click com a Guilda dos Cervejeiros de Doherimm).", ALCOOL) },
			tipo: "food",
			qtd: 1,
			preco,
			espacos: 0.5,
			ativacao: { execucao: "action", custo: 0, qtd: "", condicao: "", special: "" },
			duracao: { value: 1, units: "day", special: "" },
			resistencia: { pericia: "fort", atributo: "", bonus: 0, txt: `Fortitude CD ${cd} (+5 por dose extra no dia)` },
			rolls: []
		}
	});

	const novosItens = [
		...BEBIDAS.map(bebida),
		tesouro("Partitura de Calliko", ICO.pergaminho,
			p("Composição de Calliko, comprada de Dorothea. Ninguém nota nada de mágico, mas <b>Atuação ou Misticismo CD 20</b> revela que há algo estranho na combinação das notas.",
				"Tocada, espalha a loucura de Nimb: quem ouve fica violento (veja a Briga de Taverna). Sucessos dos Tarsos de Calliko: <i>A Sszzaazita Mais Bonita</i> e <i>Dança de Amarid</i>.",
				"<b>Prova</b> (inteira ou um pedaço rasgado).")),
		tesouro("Peça do Imagoduto", ICO.cristal,
			p("Um pedaço da máquina de Ghorskander, com o cristal rosado que aparece em toda a campanha (os olhos dos bandoleiros, a máquina de Lorelei, os implantes da Rocha Cinzenta).", "<b>Prova.</b> O Imagoduto inteiro também serve.")),
		tesouro("Depoimento de Dorothea Millicent", `${T20I}/itens/gerais/livro.webp`,
			p("Dorothea conta como tirou Calliko de um quarto imundo de taverna, levou-o para a Casa de Repouso, copiou as chaves e vende as partituras. Pode se entregar à Guarda, mas jura que o bardo é inocente.", "<b>Prova.</b> Calliko e a tatuagem de dado no rosto também servem, assim como o testemunho de um cliente da Terceira Opção.")),
		tesouro("Lousa da Terceira Opção", ICO.instrumento,
			p("<i>\"Hoje: Tarsos · Dallia: Naxia e os Monstros Errantes · Haya: Reles Rancor · Leen: palco aberto\"</i>", "Escrita com giz branco na fachada pichada e coberta de cartazes. Troque os dias pelos do seu calendário."))
	];
	const itensCriados = await Item.createDocuments(novosItens);
	const itemPorNome = (inicio) => itensCriados.find((i) => i.name.startsWith(inicio));

	/* ------------------------------------------------------------------ */
	/* 4. Tabelas                                                           */
	/* ------------------------------------------------------------------ */
	const LOUCURA = [
		"Os dois personagens mais distantes do monstro à direita e à esquerda trocam de lugar.",
		"Efeitos mágicos de cura de luz causam dano de trevas.",
		"Efeitos de dano (incluindo ataques) curam pontos de vida.",
		"O personagem mais distante do monstro troca de lugar com o mais perto do monstro (empate: aleatório).",
		"O monstro surge a 5 quadrados numa direção aleatória.",
		"Efeitos elementais mudam de tipo: role 1d6 para cada efeito (1 ácido, 2 eletricidade, 3 fogo, 4 frio, 5 luz, 6 trevas).",
		"Antigravidade. Todos \"caem para cima\": 3d6 de dano e Acrobacia CD 15 ou começam o turno caídos. No início da rodada seguinte, o mesmo acontece quando todos caem para baixo. Voadores e a criatura não são afetados.",
		"Os dois personagens mais distantes do monstro acima e abaixo trocam de lugar.",
		"Todas as criaturas perdem toda redução de dano e ganham vulnerabilidade a dano do mesmo tipo (RD geral vira vulnerabilidade a tudo).",
		"Escolha dois personagens aleatoriamente: qualquer efeito ou ação do primeiro afeta o segundo, sem importar o alcance.",
		"Resistências contra magias de Fortitude, Reflexos e Vontade viram Intuição, Investigação e Iniciativa. Misticismo e Religião para resolver magias (como Dissipar Magia) viram Acrobacia e Atletismo.",
		"Uma falha é sucesso e um sucesso é falha, em todos os testes, inclusive ataques."
	];
	const SURTO_TXT = [
		["Surto de Fúria", "O monstro recebe +5 em testes de ataque e rolagens de dano por 1 rodada."],
		["Surto de Euforia", "No próximo turno, o monstro recebe uma ação padrão adicional."],
		["Surto Psíquico", "Cada personagem sofre 2d12 de dano psíquico (Vontade CD 25 reduz à metade)."],
		["Surto de Adrenalina", "O monstro recupera 30 PV."]
	];
	const tabela = (name, img, formula, description, linhas) => RollTable.create({
		name, img, folder: pasta.RollTable, flags: FLAGS(), formula, replacement: true, displayRoll: true, description,
		results: linhas.map(([nome, desc], i) => ({ type: "text", range: [i + 1, i + 1], weight: 1, name: nome, description: desc }))
	});
	const tabLoucura = await tabela("Efeitos de Loucura", `${T20I}/magias/enfeiticar.webp`, "1d12",
		"Batalha Insana: role no início de cada rodada. O efeito vale para todos os testes da rodada e acaba no fim dela (trocas de lugar não se desfazem).",
		LOUCURA.map((t, i) => [`${i + 1}. ${t.split(/[.:]/)[0]}`, t]));
	const tabSurtos = await tabela("Surtos dos Internos", `${T20I}/poderes/ameacas/insanidade-tormenta.webp`, "1d4",
		"Quando alguém falha por 5 ou mais no teste de apaziguar um interno, a manifestação se fortalece.", SURTO_TXT);
	const tabBebidas = await tabela("Bebidas Anãs da Terceira Opção", ICO.caneca, "1d8",
		"Para quando alguém pede \"a da casa\" ou Click escolhe a rodada.",
		BEBIDAS.map(([n, cd, preco, desc]) => [n, `CD ${cd}, T$ ${preco}. ${desc.replace(/<[^>]+>/g, "")}`]));

	/* ------------------------------------------------------------------ */
	/* 5. Macros                                                            */
	/* ------------------------------------------------------------------ */

	async function macroBriga() {
		const CHAVE = "fdtBrigaTaverna";
		const NOVO = { rodada: 0, deixa: 0, boa: 0, falhas: {}, protegidos: [], segurados: [], escolha: {}, provocador: "", ninar: false };
		const e = foundry.utils.mergeObject(NOVO, game.user.getFlag("world", CHAVE) ?? {}, { inplace: false });
		const NIVEIS = ["", "só pode atacar (desarmado)", "usa arma improvisada", "usa uma arma normal ao alcance", "usa o melhor ataque, magia ou efeito de dano", "não resiste mais: luta até a briga acabar ou desmaiar"];
		const ACOES = {
			deixa: ["Deixa Disso (Diplomacia ou Enganação CD 20)", ["dipl", "enga"], 20],
			ninar: ["Canção de Ninar (Atuação CD 25)", ["atua"], 25],
			boa: ["Boa Ideia (Luta CD 20)", ["luta"], 20],
			segura: ["Me Segura! (Luta CD 20; mire o aliado)", ["luta"], 20],
			roda: ["Roda de Bardos Arruaceiros (Fortitude CD 20)", ["fort"], 20],
			amizade: ["Na Amizade (ataque contra o aliado mirado)", ["luta", "pont"], 0],
			escolha: ["Escolha Alguém do Seu Tamanho (mire o aliado)", [], 0],
			cidadao: ["Cidadão de Bem (esconder-se)", [], 0],
			cara: ["Dá na Minha Cara (Provocação Petulante)", [], 0]
		};
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Briga de Taverna (perigo complexo, ND 7)" },
			content: `<p>Rodada <b>${e.rodada}</b> · Deixa disso <b>${e.deixa}/15</b> · Boa ideia <b>${e.boa}/10</b>${e.ninar ? " · <i>Canção de Ninar valendo</i>" : ""}</p>
				<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="rodada">Começar a rodada (dano automático e Vontade CD 20)</option>
					${Object.entries(ACOES).map(([k, [n]]) => `<option value="${k}">${n}</option>`).join("")}
					<option value="zerar">Recomeçar a briga</option></select></div>
				<div class="form-group"><label>Perícia (se houver escolha)</label><select name="pericia"><option value="">a primeira</option><option value="enga">Enganação</option><option value="pont">Pontaria</option></select></div>
				<div class="form-group"><label>Resultado já rolado (opcional)</label><input type="number" name="manual"></div>
				<p style="font-size:0.85em">Começar a rodada: selecione todos os personagens na briga. Ações: selecione quem age e, se for o caso, mire o aliado.</p>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "zerar") {
			await game.user.unsetFlag("world", CHAVE);
			return ui.notifications.info("Briga de Taverna recomeçada.");
		}
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r; };
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		const alvo = [...game.user.targets][0];
		const bonus = (a, k) => Number(a.system.pericias?.[k]?.value) || 0;
		const naoVivo = (a) => ["con", "mor"].includes(a.system.detalhes?.tipo) || /osteon|golem|construto|morto/i.test(a.items.find((i) => i.type === "raca")?.name ?? "");
		let html = "";

		if (res.acao === "rodada") {
			if (!tokens.length) return ui.notifications.warn("Selecione todos os personagens que estão na briga.");
			e.rodada += 1;
			const r = e.rodada;
			const formula = r >= 5 ? "5d6" : r >= 3 ? "3d6" : "2d6";
			const tipoDano = r >= 3 ? "letal" : "não letal";
			html = `<h3>Briga de Taverna · rodada ${r}</h3><p>Dano automático: <b>${formula} ${tipoDano}</b>${r >= 5 ? " (de um tipo ao qual a vítima não tenha resistência)" : " de impacto"}.</p><ul>`;
			const vezes = {};
			for (const t of tokens) vezes[t.id] = 1;
			for (const id of e.protegidos) if (id in vezes) vezes[id] = 0;
			for (const [protetor, aliado] of Object.entries(e.escolha)) {
				if (aliado in vezes) vezes[aliado] = 0;
				if (protetor in vezes) vezes[protetor] += 2;
			}
			if (e.provocador && e.provocador in vezes) {
				const outros = tokens.filter((t) => t.id !== e.provocador);
				for (const t of outros) vezes[t.id] = 0;
				vezes[e.provocador] = 2 + outros.length;
			}
			for (const t of tokens) {
				const a = t.actor;
				let txt = `<b>${t.name}</b>: `;
				if (vezes[t.id] > 0) {
					let total = 0;
					for (let i = 0; i < vezes[t.id]; i++) total += (await rolar(formula)).total;
					const dano = await new Roll(`${total}[${r >= 5 ? "psiquico" : "impacto"}]`).evaluate();
					try { await a.applyDamageV2(dano, 1); } catch (err) { console.warn(err); }
					txt += `${total} de dano${vezes[t.id] > 1 ? ` (${vezes[t.id]} vezes, somado para a RD)` : ""}`;
				} else txt += "sem dano nesta rodada";
				if (naoVivo(a)) txt += "; não é vivo, a música não o afeta.";
				else if (e.ninar) txt += "; a Canção de Ninar dispensa o teste de Vontade.";
				else if (e.segurados.includes(t.id)) txt += "; está sendo segurado, dispensa o teste de Vontade.";
				else {
					const v = await rolar(`1d20 + ${bonus(a, "vont")}`);
					if (v.total >= 20) txt += `; Vontade ${v.total}: resiste.`;
					else {
						const n = Math.min(5, (e.falhas[a.id] ?? 0) + 1);
						e.falhas[a.id] = n;
						txt += `; Vontade ${v.total}: <b>falha ${n}</b>, ${NIVEIS[n]} um alvo aleatório.`;
					}
				}
				html += `<li>${txt}</li>`;
			}
			html += "</ul>";
			Object.assign(e, { protegidos: [], segurados: [], escolha: {}, provocador: "", ninar: false });
			await game.user.setFlag("world", CHAVE, e);
			return ChatMessage.create({ content: html, rolls });
		}

		const ator = tokens[0];
		if (!ator) return ui.notifications.warn("Selecione o personagem que age.");
		const [nome, pericias, cd] = ACOES[res.acao];
		html = `<h3>Briga de Taverna · ${nome.split(" (")[0]}</h3>`;
		let total = Number(res.manual);
		const k = pericias.includes(res.pericia) ? res.pericia : pericias[0];
		if (k && (res.manual === "" || res.manual === undefined)) total = (await rolar(`1d20 + ${bonus(ator.actor, k)}`)).total;
		if (res.acao === "amizade") {
			if (!alvo?.actor) return ui.notifications.warn("Mire o aliado com quem vai brigar \"na amizade\".");
			const def = Number(alvo.actor.system.attributes?.defesa?.value) || 10;
			const acertou = total >= def;
			if (acertou && !e.protegidos.includes(alvo.id)) e.protegidos.push(alvo.id);
			html += `<p>${ator.name} ataca ${alvo.name}: <b>${total}</b> contra Defesa ${def}. ${acertou ? `Acertou: cause o dano normal (pode ser não letal, a menos que ${ator.name} já tenha falhado 3 vezes na Vontade). ${alvo.name} <b>não sofre o dano automático</b> da próxima rodada.` : "Errou."}</p><p style="font-size:0.85em">Só vale se os dois escolherem esta ação: rode de novo para o outro.</p>`;
		} else if (res.acao === "escolha") {
			if (!alvo) return ui.notifications.warn("Mire o aliado que vai proteger.");
			e.escolha[ator.id] = alvo.id;
			html += `<p>${ator.name} protege ${alvo.name}: na próxima rodada, sofre o próprio dano, o do aliado e mais um por conta da casa (tudo somado para a RD).</p>`;
		} else if (res.acao === "cidadao") {
			if (!e.protegidos.includes(ator.id)) e.protegidos.push(ator.id);
			html += `<p>${ator.name} acha um canto e dá uns chutes pelas costas: <b>não sofre o dano automático</b> da próxima rodada (mas ainda testa Vontade).</p>`;
		} else if (res.acao === "cara") {
			e.provocador = ator.id;
			html += `<p>${ator.name} usa <b>Provocação Petulante</b>: na próxima rodada, só ele sofre dano (o próprio, o de cada aliado e mais um da casa). Quem se beneficiar não pode usar Boa Ideia, Na Amizade nem Roda de Bardos na rodada seguinte.</p>`;
		} else {
			const ok = total >= cd;
			html += `<p>${ator.name}: <b>${total}</b> contra CD ${cd}. ${ok ? "Sucesso." : "Falha."}</p>`;
			if (ok && res.acao === "deixa") e.deixa += 1;
			if (ok && res.acao === "boa") { e.boa += 1; e.deixa = Math.max(0, e.deixa - 1); }
			if (ok && res.acao === "roda") { if (e.boa > e.deixa) e.boa += 1; else e.deixa += 1; html += "<p>Conta para a contagem que está mais adiantada.</p>"; }
			if (ok && res.acao === "ninar") { e.ninar = true; html += "<p>Ninguém testa Vontade na próxima rodada.</p>"; }
			if (ok && res.acao === "segura") {
				if (alvo && !e.segurados.includes(alvo.id)) e.segurados.push(alvo.id);
				html += `<p>${alvo ? alvo.name : "O aliado"} não ataca e dispensa a Vontade na próxima rodada.</p>`;
			}
		}
		const fim = e.deixa >= 15 ? "Com 15 sucessos em Deixa Disso, <b>a briga acabou</b>!" : e.boa >= 10 ? "Com 10 sucessos em Boa Ideia, <b>todos os brigões estão no chão</b>: paz!" : "";
		html += `<p>Deixa disso <b>${e.deixa}/15</b> · Boa ideia <b>${e.boa}/10</b>.</p>${fim ? `<p>${fim}</p>` : ""}`;
		if (fim) await game.user.unsetFlag("world", CHAVE);
		else await game.user.setFlag("world", CHAVE, e);
		ChatMessage.create({ content: html, rolls });
	}

	async function macroShow() {
		const CHAVE = "fdtShowTerceira";
		const e = foundry.utils.mergeObject({ sucessos: 0, falhas: 0, extra: 0, congelados: [] }, game.user.getFlag("world", CHAVE) ?? {}, { inplace: false });
		const PERICIAS = { atua: "Atuação", inti: "Intimidação", enga: "Enganação", dipl: "Diplomacia", acro: "Acrobacia", guer: "Guerra", mist: "Misticismo", atle: "Atletismo" };
		const RESULTADOS = [
			[5, "O show foi bem-sucedido, mas só."],
			[10, "A plateia paga as bebidas: todos bebem de graça na Terceira Opção pelo resto da noite."],
			[15, "Presentes e dinheiro no palco: o grupo ganha <b>1d100 tibares</b>."],
			[20, "Fãs temporários: todos ganham os benefícios do poder <b>Torcida</b> pelo resto da aventura (com algum NPC inteligente por perto)."],
			[25, "Um <b>groupie</b>: escolham um NPC com nome (com aprovação do Mestre); ele é parceiro até o fim da aventura."],
			[30, "<b>1d6 groupies</b>, parceiros até o fim da aventura."],
			[Infinity, "Um <b>fanático</b>: o groupie vira parceiro permanente (só um)."]
		];
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Show na Terceira Opção" },
			content: `<p>Sucessos <b>${e.sucessos}/5</b> · falhas <b>${e.falhas}</b> · CD <b>${20 + e.extra}</b>${e.congelados.length ? ` · congelados: ${e.congelados.join(", ")}` : ""}</p>
				<div class="form-group"><label>Teste</label><select name="acao">
					<option value="teste">Teste de um músico</option>
					<option value="frontman">Último teste (frontman)</option>
					<option value="zerar">Recomeçar o show</option></select></div>
				<div class="form-group"><label>Perícia</label><select name="pericia">${Object.entries(PERICIAS).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></div>
				<div class="form-group"><label>Perícia alternativa sem justificativa (+2 CD daqui em diante)</label><input type="checkbox" name="semJustificativa"></div>
				<div class="form-group"><label>Resultado já rolado (opcional)</label><input type="number" name="manual"></div>
				<p style="font-size:0.85em">Selecione quem toca. Numa falha, todos os selecionados perdem 2d8 PM: deixe a banda inteira selecionada e ponha quem testa primeiro na seleção.</p>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "zerar") {
			await game.user.unsetFlag("world", CHAVE);
			return ui.notifications.info("Show recomeçado.");
		}
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		const rolls = [];
		const k = res.pericia in PERICIAS ? res.pericia : "atua";
		let total = Number(res.manual);
		let quem = "Resultado informado";
		if (res.manual === "" || res.manual === undefined) {
			const a = tokens[0]?.actor;
			if (!a) return ui.notifications.warn("Selecione quem faz o teste, ou informe o resultado.");
			if (e.congelados.includes(tokens[0].name)) return ui.notifications.warn(`${tokens[0].name} congelou e não pode mais testar.`);
			const r = await new Roll(`1d20 + ${Number(a.system.pericias?.[k]?.value) || 0}`).evaluate();
			rolls.push(r);
			total = r.total;
			quem = tokens[0].name;
		}
		const cd = 20 + e.extra;
		const ok = total >= cd;
		let html = `<h3>Show na Terceira Opção</h3><p>${quem}: ${PERICIAS[k]} <b>${total}</b> contra CD ${cd}. ${ok ? "Sucesso!" : "Falha."}</p>`;
		if (res.semJustificativa) { e.extra += 2; html += "<p>Perícia alternativa sem justificativa: a CD sobe +2.</p>"; }
		if (ok) e.sucessos += 1;
		else {
			e.falhas += 1;
			html += "<p>O nervosismo pesa em todos: <b>2d8 PM</b> cada.</p><ul>";
			for (const t of tokens) {
				const r = await new Roll("2d8").evaluate();
				rolls.push(r);
				const pm = t.actor.system.attributes?.pm;
				const novo = Math.max(0, (Number(pm?.value) || 0) - r.total);
				await t.actor.update({ "system.attributes.pm.value": novo });
				let txt = `${t.name}: –${r.total} PM (fica com ${novo})`;
				if (novo === 0 && !e.congelados.includes(t.name)) {
					e.congelados.push(t.name);
					e.extra += 5;
					txt += ". <b>Congelou no palco</b>: sai do teste e a CD sobe +5";
				}
				html += `<li>${txt}.</li>`;
			}
			html += "</ul>";
		}
		if (res.acao === "frontman") {
			if (!ok || e.sucessos < 5) html += `<p><b>O show fracassou.</b> ${e.sucessos < 5 ? `Só ${e.sucessos} de 5 sucessos.` : ""}</p>`;
			else {
				const margem = total - cd;
				const ganhos = RESULTADOS.filter(([lim], i) => i === 0 || margem > RESULTADOS[i - 1][0]).map(([, t]) => t);
				html += `<p><b>Show de sucesso</b>, margem de ${margem}. Os efeitos se acumulam:</p><ul>${ganhos.map((g) => `<li>${g}</li>`).join("")}</ul>`;
			}
			await game.user.unsetFlag("world", CHAVE);
		} else {
			html += `<p>Sucessos <b>${e.sucessos}/5</b> · falhas ${e.falhas}. ${e.sucessos >= 5 ? "Hora do frontman fazer o último teste." : ""}</p>`;
			await game.user.setFlag("world", CHAVE, e);
		}
		ChatMessage.create({ content: html, rolls });
	}

	async function macroBeber() {
		const BEBIDAS = [
			["Barbas de Heredrimm", 15, { name: "Barbas de Heredrimm: +1d6 em um teste", changes: [] }, "+1d6 em um teste à escolha até o fim do dia (some à mão)"],
			["Beluhga", 20, { name: "Beluhga: redução de fogo 5", changes: [["system.tracos.resistencias.fogo.bonus", 5]] }],
			["Escavador", 20, { name: "Escavador: +1 For, –3m", changes: [["system.atributos.for.bonus", 1], ["system.attributes.movement.walk.base", -3]] }],
			["Rangedente", 20, { name: "Rangedente: +2 Fortitude", changes: [["system.pericias.fort.bonus", 2]] }],
			["Limpa-ventas", 15, { name: "Limpa-ventas: redução de frio 5", changes: [["system.tracos.resistencias.frio.bonus", 5]] }],
			["Tuku'tu", 20, { name: "Tuku'tu: +2 Reflexos", changes: [["system.pericias.refl.bonus", 2]] }],
			["Bafo de elfa", 15, { name: "Bafo de elfa: +2 Misticismo", changes: [["system.pericias.mist.bonus", 2]] }],
			["Água-de-sangue", 15, { name: "Água-de-sangue: +2 Vontade", changes: [["system.pericias.vont.bonus", 2]] }],
			["Cerveja comum", 10, null]
		];
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Beber na Terceira Opção" },
			content: `<div class="form-group"><label>Bebida</label><select name="bebida">${BEBIDAS.map(([n, cd], i) => `<option value="${i}">${n} (CD ${cd})</option>`).join("")}<option value="fim">Fim do dia: tirar embriaguez e bebidas</option></select></div>
				<p style="font-size:0.85em">Selecione quem bebe. Cada dose adicional no mesmo dia soma +5 na CD.</p>`,
			ok: { label: "Beber", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		if (!tokens.length) return ui.notifications.warn("Selecione quem bebe.");
		if (res.bebida === "fim") {
			for (const t of tokens) {
				const a = t.actor;
				const fx = a.effects.filter((x) => x.getFlag("world", "fdtBebida"));
				if (fx.length) await a.deleteEmbeddedDocuments("ActiveEffect", fx.map((x) => x.id));
				for (const s of ["desprevenido", "inconsciente"]) if (a.statuses?.has(s)) await a.toggleStatusEffect(s, { active: false });
				await a.unsetFlag("world", "fdtDoses");
			}
			return ChatMessage.create({ content: `<h3>Fim do dia</h3><p>${tokens.map((t) => t.name).join(", ")}: embriaguez e bebidas encerradas.</p>` });
		}
		const [nome, cdBase, beneficio, nota] = BEBIDAS[Number(res.bebida)] ?? BEBIDAS[8];
		const NIVEL = [
			null,
			{ name: "Embriagado", changes: [["system.modificadores.atributos.des", -2], ["system.modificadores.atributos.car", -2]], txt: "fica <b>embriagado</b> (–2 em testes de Destreza e Carisma)" },
			{ name: "Bebum", changes: [["system.modificadores.atributos.des", -5], ["system.modificadores.atributos.car", -5]], txt: "fica <b>bebum</b> (desprevenido, –5 em testes de Destreza e Carisma)" }
		];
		const efeito = (dados, nivel) => ({
			name: dados.name,
			img: "systems/tormenta20/icons/itens/gerais/caneca.webp",
			type: "base",
			duration: { value: 86400, units: "seconds" },
			flags: { world: { fdtBebida: nivel ?? 0 } },
			system: { changes: dados.changes.map(([key, value]) => ({ key, value: String(value), type: "add", phase: "initial", priority: null })) }
		});
		const rolls = [];
		let html = `<h3>Uma rodada de ${nome}</h3><ul>`;
		for (const t of tokens) {
			const a = t.actor;
			const doses = Number(a.getFlag("world", "fdtDoses")) || 0;
			const cd = cdBase + 5 * doses;
			const r = await new Roll(`1d20 + ${Number(a.system.pericias?.fort?.value) || 0}`).evaluate();
			rolls.push(r);
			await a.setFlag("world", "fdtDoses", doses + 1);
			let txt = `${t.name}: Fortitude ${r.total} contra CD ${cd}`;
			if (beneficio) {
				await a.createEmbeddedDocuments("ActiveEffect", [efeito(beneficio)]);
				txt += `; ganha <i>${beneficio.name}</i>${nota ? ` (${nota})` : ""}`;
			}
			if (r.total >= cd) txt += ". Segura bem.";
			else {
				const atual = Math.max(0, ...a.effects.map((x) => Number(x.getFlag("world", "fdtBebida")) || 0));
				const velhos = a.effects.filter((x) => (Number(x.getFlag("world", "fdtBebida")) || 0) > 0);
				if (velhos.length) await a.deleteEmbeddedDocuments("ActiveEffect", velhos.map((x) => x.id));
				if (atual >= 2) {
					if (!a.statuses?.has("inconsciente")) await a.toggleStatusEffect("inconsciente", { active: true });
					await a.createEmbeddedDocuments("ActiveEffect", [efeito(NIVEL[2], 2)]);
					txt += ". Já estava bebum: <b>cai inconsciente</b> até o fim do dia.";
				} else {
					const n = atual + 1;
					await a.createEmbeddedDocuments("ActiveEffect", [efeito(NIVEL[n], n)]);
					if (n === 2 && !a.statuses?.has("desprevenido")) await a.toggleStatusEffect("desprevenido", { active: true });
					txt += `. ${NIVEL[n].txt} até o fim do dia.`;
				}
			}
			html += `<li>${txt}</li>`;
		}
		html += "</ul>";
		ChatMessage.create({ content: html, rolls });
	}

	async function macroBatalha() {
		const CHAVE = "fdtInternos";
		const e = foundry.utils.mergeObject({ rylonn: 0, bdun: 0, grisgemm: 0, rodada: 0 }, game.user.getFlag("world", CHAVE) ?? {}, { inplace: false });
		const INTERNOS = {
			rylonn: { nome: "Rylonn", cd: 22, role: "carrasco", pericias: ["cura", "dipl", "enga", "inti", "intu", "atua"] },
			bdun: { nome: "Bdun", cd: 24, role: "cocatriz", pericias: ["nobr", "dipl", "enga", "inti", "intu", "atua"] },
			grisgemm: { nome: "Grisgemm", cd: 26, role: "quimera", pericias: ["guer", "dipl", "enga", "inti", "intu", "atua"] }
		};
		const NOMES = { cura: "Cura", nobr: "Nobreza", guer: "Guerra", dipl: "Diplomacia", enga: "Enganação", inti: "Intimidação", intu: "Intuição", atua: "Atuação" };
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Batalha Insana" },
			content: `<p>Rodada ${e.rodada} · Rylonn <b>${e.rylonn}/5</b> · Bdun <b>${e.bdun}/5</b> · Grisgemm <b>${e.grisgemm}/5</b></p>
				<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="loucura">Nova rodada: rolar Efeitos de Loucura (1d12)</option>
					<option value="apaziguar">Apaziguar um interno</option>
					<option value="rio">Caiu no Rio de Som (Vontade CD 20)</option>
					<option value="surto">Rolar um surto (1d4)</option>
					<option value="zerar">Recomeçar a contagem</option></select></div>
				<div class="form-group"><label>Interno</label><select name="interno">${Object.entries(INTERNOS).map(([k, i]) => `<option value="${k}">${i.nome} (CD ${i.cd})</option>`).join("")}</select></div>
				<div class="form-group"><label>Perícia</label><select name="pericia">${Object.entries(NOMES).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></div>
				<div class="form-group"><label>Bônus de quem ajuda</label><input type="number" name="ajuda" value="0"></div>
				<div class="form-group"><label>Resultado já rolado (opcional)</label><input type="number" name="manual"></div>
				<p style="font-size:0.85em">Apaziguar: selecione quem testa (um teste do grupo por rodada). Rio de Som: selecione quem caiu. Surto psíquico: atinge os personagens dos jogadores na cena.</p>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "zerar") {
			await game.user.unsetFlag("world", CHAVE);
			return ui.notifications.info("Batalha Insana recomeçada.");
		}
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r; };
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		const interno = INTERNOS[res.interno] ?? INTERNOS.rylonn;
		let html = "";

		const surto = async () => {
			const d = await rolar("1d4");
			const monstros = canvas.tokens.placeables.filter((t) => t.actor?.getFlag("world", "fdtRole") === interno.role);
			let txt = "";
			if (d.total === 1) {
				for (const m of monstros) {
					await m.actor.createEmbeddedDocuments("ActiveEffect", [{
						name: "Surto de Fúria (+5)",
						img: "systems/tormenta20/icons/poderes/ameacas/insanidade-tormenta.webp",
						type: "base",
						duration: { value: 1, units: "rounds" },
						system: { changes: ["ataque", "dano"].map((t) => ({ key: `system.modificadores.${t}.geral`, value: "5", type: "add", phase: "initial", priority: null })) }
					}]);
				}
				txt = `<b>Surto de Fúria:</b> +5 em ataque e dano por 1 rodada${monstros.length ? " (efeito aplicado)" : ""}.`;
			} else if (d.total === 2) txt = "<b>Surto de Euforia:</b> no próximo turno, o monstro tem uma ação padrão adicional.";
			else if (d.total === 3) {
				txt = "<b>Surto Psíquico:</b> 2d12 psíquico em cada personagem (Vontade CD 25 reduz à metade).<ul>";
				for (const t of canvas.tokens.placeables.filter((x) => x.actor?.type === "character")) {
					const dano = await rolar("2d12");
					const v = await rolar(`1d20 + ${Number(t.actor.system.pericias?.vont?.value) || 0}`);
					const total = v.total >= 25 ? Math.floor(dano.total / 2) : dano.total;
					const r = await new Roll(`${total}[psiquico]`).evaluate();
					try { await t.actor.applyDamageV2(r, 1); } catch (err) { console.warn(err); }
					txt += `<li>${t.name}: Vontade ${v.total}, ${total} psíquico.</li>`;
				}
				txt += "</ul>";
			} else {
				for (const m of monstros) {
					const pv = m.actor.system.attributes.pv;
					await m.actor.update({ "system.attributes.pv.value": Math.min(pv.max, pv.value + 30) });
				}
				txt = `<b>Surto de Adrenalina:</b> o monstro recupera 30 PV${monstros.length ? " (aplicado)" : ""}.`;
			}
			return `<p>Surto (1d4 = ${d.total}) na manifestação de ${interno.nome}: ${txt}</p>`;
		};

		if (res.acao === "loucura") {
			e.rodada += 1;
			const tab = game.tables.find((t) => t.getFlag("world", "fdt") === "a2av4" && t.name.startsWith("Efeitos de Loucura"));
			const d = await rolar("1d12");
			const r = tab?.results.find((x) => d.total >= x.range[0] && d.total <= x.range[1]);
			html = `<h3>Batalha Insana · rodada ${e.rodada}</h3><p><b>Efeito de Loucura ${d.total}:</b> ${r?.description || r?.name || "(tabela não encontrada: importe o Ato 2)"}</p><p style="font-size:0.85em">Vale para todos os testes desta rodada e acaba no fim dela.</p>`;
		} else if (res.acao === "rio") {
			if (!tokens.length) return ui.notifications.warn("Selecione quem caiu no rio de som.");
			html = "<h3>Rio de Som</h3><ul>";
			for (const t of tokens) {
				const v = await rolar(`1d20 + ${Number(t.actor.system.pericias?.vont?.value) || 0}`);
				html += `<li>${t.name}: Vontade ${v.total} ${v.total >= 20 ? "✔️ age normalmente." : "❌ nesta rodada só pode <b>cantar e tocar</b>."}</li>`;
			}
			html += "</ul>";
		} else if (res.acao === "surto") {
			html = `<h3>Batalha Insana</h3>${await surto()}`;
		} else {
			const k = interno.pericias.includes(res.pericia) ? res.pericia : interno.pericias[0];
			let total = Number(res.manual);
			let quem = "Resultado informado";
			if (res.manual === "" || res.manual === undefined) {
				const a = tokens[0]?.actor;
				if (!a) return ui.notifications.warn("Selecione quem tenta apaziguar, ou informe o resultado.");
				total = (await rolar(`1d20 + ${Number(a.system.pericias?.[k]?.value) || 0} + ${Number(res.ajuda) || 0}`)).total;
				quem = tokens[0].name;
			}
			const ok = total >= interno.cd;
			html = `<h3>Apaziguar ${interno.nome}</h3><p>${quem}: ${NOMES[k]} <b>${total}</b> contra CD ${interno.cd}. ${ok ? "Sucesso." : "Falha."}</p>`;
			if (ok) e[res.interno in INTERNOS ? res.interno : "rylonn"] += 1;
			const n = e[res.interno in INTERNOS ? res.interno : "rylonn"];
			if (n >= 5) html += `<p><b>${interno.nome} foi apaziguado!</b> A manifestação se desfaz; o próximo interno surge.</p>`;
			else html += `<p>${interno.nome}: <b>${n}/5</b>.</p>`;
			if (!ok && interno.cd - total >= 5) html += await surto();
		}
		await game.user.setFlag("world", CHAVE, e);
		ChatMessage.create({ content: html, rolls });
	}

	async function macroImagoduto() {
		const CHAVE = "fdtImagoduto";
		const feitos = Number(game.user.getFlag("world", CHAVE)) || 0;
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Sabotar o Imagoduto" },
			content: `<p>Sucessos: <b>${feitos}/50</b> (Ofício engenhoqueiro CD 30, ação completa cada).</p>
				<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="testar">Testar com os selecionados (um teste cada)</option>
					<option value="zerar">Recomeçar a contagem</option></select></div>
				<div class="form-group"><label>Bônus de Ofício (engenhoqueiro), se a ficha não tiver</label><input type="number" name="bonus"></div>
				<div class="form-group"><label>Resultado já rolado (opcional, um teste)</label><input type="number" name="manual"></div>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "zerar") {
			await game.user.unsetFlag("world", CHAVE);
			return ui.notifications.info("Contagem do Imagoduto zerada.");
		}
		const rolls = [];
		const linhas = [];
		let ok = 0;
		if (res.manual !== "" && res.manual !== undefined) {
			const v = Number(res.manual);
			if (v >= 30) ok += 1;
			linhas.push(`Resultado informado: ${v} ${v >= 30 ? "✔️" : "❌"}`);
		} else {
			const tokens = canvas.tokens.controlled.filter((t) => t.actor);
			if (!tokens.length) return ui.notifications.warn("Selecione quem trabalha no Imagoduto, ou informe o resultado.");
			for (const t of tokens) {
				const ofi = Object.values(t.actor.system.pericias ?? {}).find((p) => /engenhoq/i.test(p?.label ?? p?.nome ?? ""));
				const b = res.bonus !== "" && res.bonus !== undefined ? Number(res.bonus) || 0 : Number(ofi?.value) || Number(t.actor.system.pericias?.ofi0?.value) || 0;
				const r = await new Roll(`1d20 + ${b}`).evaluate();
				rolls.push(r);
				if (r.total >= 30) ok += 1;
				linhas.push(`${t.name}: ${r.total} ${r.total >= 30 ? "✔️" : "❌"}`);
			}
		}
		const total = Math.min(50, feitos + ok);
		const fim = total >= 50;
		if (fim) await game.user.unsetFlag("world", CHAVE);
		else await game.user.setFlag("world", CHAVE, total);
		ChatMessage.create({
			content: `<h3>Sabotar o Imagoduto</h3><ul>${linhas.map((l) => `<li>${l}</li>`).join("")}</ul><p>Sucessos: <b>${total}/50</b>.</p>${fim ? "<p><b>O Imagoduto está desativado!</b> A batalha termina na hora: a paisagem de loucura se desfaz e os internos se acalmam. Ajuste Lei &amp; Ordem.</p>" : ""}`,
			rolls
		});
	}

	const macro = (name, img, fn) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Arco 2 · Aventura 4 · gerado por a2-av4-taverna-maniacos.js\n(${fn.toString()})();`
	});
	const macros = await Macro.createDocuments([
		macro("Av4 · Briga de Taverna", "icons/skills/melee/unarmed-punch-fist.webp", macroBriga),
		macro("Av4 · Show na Terceira Opção", ICO.alaude, macroShow),
		macro("Av4 · Beber na Terceira Opção", ICO.caneca, macroBeber),
		macro("Av4 · Batalha Insana", `${T20I}/magias/enfeiticar.webp`, macroBatalha),
		macro("Av4 · Sabotar o Imagoduto", ICO.ferramentas, macroImagoduto)
	]);
	const linkMacro = (trecho) => {
		const m = macros.find((x) => x.name.includes(trecho));
		return m ? `@UUID[${m.uuid}]{${m.name}}` : trecho;
	};

	/* ------------------------------------------------------------------ */
	/* 6. Diário                                                            */
	/* ------------------------------------------------------------------ */
	const pagina = (name, content, sort) => ({ name, type: "text", sort, text: { content, format: 1 } });
	const lista = (itens) => `<ul>${itens.map((i) => `<li>${i}</li>`).join("")}</ul>`;
	const leiOrdem = game.actors.find((a) => a.getFlag("world", "fdtRole") === "leiordem");

	await JournalEntry.create({
		name: "Arco 2 · Aventura 4 · Massacre na Taverna dos Maníacos",
		folder: pasta.JournalEntry,
		flags: FLAGS(),
		pages: [
			pagina("Guia do Mestre", `
				<blockquote><p><i>\"Não aguento mais brigas de taverna! [...] É praticamente uma batalha campal toda noite! Eu me esforço para trazer os melhores bardos e oferecer as melhores cervejas anãs, mas só atraio malucos e bandidos!\"</i> (Click)</p></blockquote>
				<h2>Resumo</h2>
				<p>Não há vilão de verdade, só gente fazendo escolhas erradas. ${L(atores.calliko)}, um bardo silfo, ganhou de um aspecto de Nimb inspiração infinita e insana. ${L(atores.dorothea)}, fã dele, levou-o para a Casa de Repouso da avó, ${L(atores.ellanie)}, e vende as partituras pela cidade. As músicas espalham a loucura: quem ouve fica violento, e a Terceira Opção de ${L(atores.click)} vira campo de batalha toda noite.</p>
				<p>Por azar (toque de Nimb), Ghorskander instalou um ${L(atores.imagoduto)} justamente na cela de Calliko: ele amplia os delírios dos internos e espalha o frenesi por Valkaria, alimentando o Mecano-Lagarto-Terror.</p>
				<h2>Fases</h2>
				${lista([
					"<b>Fase 0 · Normalidade:</b> o detetive Berthun chega atrasado, com olheiras e marcas de briga, e leva uma bronca da Xerife Mathilda.",
					"<b>Fase 1 · A Cidade da Praia:</b> role na tabela de Encontros em Valkaria.",
					`<b>Fase 2 · A Taverna Terceira Opção:</b> Click e ${L(atores.drasala)}, as bandas, os clientes, as outras tavernas.`,
					`<b>Fase 3 · A Inevitável Briga de Taverna:</b> perigo complexo ND 7 (${linkMacro("Briga")}). Pode acontecer no meio da fase 2.`,
					"<b>Fase 4 · A Traficante de Partituras:</b> encontrar Dorothea.",
					`<b>Fase 5 · A Casa de Repouso:</b> Calliko, o Imagoduto e a Batalha Insana (${linkMacro("Batalha")}).`,
					"<b>Fase 6 · Desfecho:</b> provas, pagamento e um final aberto para Calliko."
				])}
				<p>${leiOrdem ? `Lei &amp; Ordem: ${L(leiOrdem)}. Destruir o Imagoduto restaura Lei &amp; Ordem.` : "Lei &amp; Ordem fica no ator da Aventura 0 (importe o Ato 2 do módulo). Destruir o Imagoduto restaura Lei &amp; Ordem."}</p>`, 100),
			pagina("A Terceira Opção", `
				<p>Taverna larga na Cidade da Praia, tabuleta sem desenho, telhas no lugar de sapé, paredes pichadas e cheias de cartazes (${L(itemPorNome("Lousa"))}). Lá dentro: janela e cadeiras quebradas, sangue, cacos, um machado cravado no balcão e um palco grande, com lampiões e espelhos, coberto de cerveja. O nome vem da filosofia de Click: quem quer sossego só vem aqui se as tavernas comuns estiverem fechadas ou lotadas.</p>
				<h3>Informações de Click</h3>
				${lista([
					"Paga Drasala e um mínimo aos bardos; os clientes eram \"cidadãos de bem que querem fingir ser rebeldes\" e alguns criminosos e arruaceiros.",
					"Não consegue identificar a causa. Desconfia de criminosos querendo fechar a casa.",
					"Drasala faz o serviço de três seguranças. Com relutância (exige boa interpretação), conta que ela também anda violenta: espancou um bandido até ele a segurar.",
					"As brigas só acontecem nas noites de apresentação.",
					"Não tem nada a esconder. Se houver um bardo no grupo, oferece o palco."
				])}
				<h3>Informações de Drasala</h3>
				${lista([
					"Confirma tudo o que Click disse, mas não faz amigos: está ali para trabalhar.",
					"Perdeu a cabeça e espancou um bandido. Acha que é porque já sabe que haverá briga.",
					"Viu músicos de uma banda se juntando à violência, jogando coisas no público.",
					"Não larga o emprego porque precisa trabalhar e não quer deixar Click na mão."
				])}
				<h3>Outras tavernas</h3>
				<p>Múmia Medrosa, Molar do Rei, Grifo &amp; Gnoll, Velha Lareira, Coroa ou Não Coroa. Bardos dessas casas também tocam Calliko.</p>
				<h3>Bebidas</h3>
				<p>Oito cervejas e destilados anãos (${L(tabBebidas)}; ${linkMacro("Beber")}). Fortitude contra a CD (+5 por dose extra no dia); falhas levam a embriagado, bebum e inconsciente.</p>`, 200),
			pagina("Bandas e Clientes", `
				<h3>Bandas</h3>
				${lista([
					"<b>Tarsos:</b> músicas rápidas e de gosto duvidoso (<i>Quero Ser Seu Simbionte</i>, <i>Glórienn É Minha Namorada</i>, <i>Romance em Hangpharstyth</i>, <i>Asha É uma Lefou</i>, <i>Purista Mas te Amo</i>; de Calliko: <i>A Sszzaazita Mais Bonita</i> e <i>Dança de Amarid</i>). Quatro membros vestidos como o esqueleto Tarso.",
					"<b>Naxia e os Monstros Errantes:</b> música macabra e agressiva. Naxia Nix, dahllan toda de preto, e três humanos maquiados (Maxir, Almia, Zugont).",
					"<b>Reles Rancor:</b> \"superbanda\" de bardos de Aslothia mortos aos 27 anos (Jarynn, Spud, Glenna e Nasto).",
					"<b>Brasão de Kor Kovith:</b> extremamente agressiva, contra os puristas e o Reinado conivente (Chazz, Durk, Nulliandor, Mirne).",
					"<b>Vyrgillia de Azgher:</b> barda de Smokestone, ex-xerife, canções de planícies, fora da lei e pólvora.",
					"<b>Senomar:</b> o velho bardo, rápido e agressivo como sempre.",
					"<b>Crânio de Pedra:</b> três piratas que rimam sem instrumentos (Larkin Rasga-Faca, Vitta Voltania e Bolo).",
					"<b>Homúnculo:</b> duas inventoras de Moreania com autômatos de percussão (Alabarda e Acha d'Armas)."
				])}
				<p>Todas tocam músicas de Calliko e compram as partituras de Dorothea.</p>
				<h3>Clientes</h3>
				${lista([`${L(atores.emblyn)}: estava lá na primeira briga.`, `${L(atores.blanto)}: reconhece as composições de Calliko.`, `${L(atores.coltrack)}: o tipo de cliente que a briga atrai.`])}
				<h3>Contingência: outras linhas de investigação</h3>
				<p>Becos sem saída se resolvem em uma ou duas frases. O que importa transmitir: as brigas sempre acontecem durante as apresentações, todas as bandas tocam músicas de Calliko, o ódio dos fregueses é inexplicável e Calliko é uma figura misteriosa. Alternativas: um atravessador que rouba e revende partituras, ou um bardo pesquisador da Academia Arcana.</p>`, 300),
			pagina("Briga de Taverna (ND 7)", `
				<p><b>Objetivo:</b> apartar a briga. Use ${linkMacro("Briga")}: \"Começar a rodada\" aplica o dano e rola as Vontades; as ações acumulam os sucessos.</p>
				<p><b>Efeito:</b> a música de Calliko afeta toda criatura viva. No início do turno, cada afetado faz <b>Vontade CD 20</b>. Falhas acumuladas: 1ª só ataca (desarmado), 2ª arma improvisada, 3ª arma normal, 4ª melhor ataque, magia ou efeito de dano, 5ª não resiste mais.</p>
				<p><b>Dano automático</b> no início de cada rodada: 2d6 de impacto não letal; da 3ª rodada, 3d6 letal; da 5ª, 5d6 letal de um tipo sem resistência.</p>
				<p><b>Fim:</b> 15 sucessos em Deixa Disso, ou 10 em Boa Ideia, ou todos fora de combate.</p>
				${lista([
					"<b>Deixa Disso</b> (Diplomacia ou Enganação CD 20): acalma os brigões.",
					"<b>Canção de Ninar</b> (Atuação CD 25): ninguém testa Vontade na próxima rodada.",
					"<b>Escolha Alguém do Seu Tamanho:</b> protege um aliado e sofre o próprio dano, o dele e mais um da casa (somados para a RD).",
					"<b>Boa Ideia</b> (Luta CD 20): bater em alguém. Contagem paralela de 10; cada sucesso tira um do Deixa Disso.",
					"<b>Na Amizade</b> (ataque): dois heróis brigam entre si; quem é acertado não sofre o dano automático seguinte. Não letal, a menos que já tenha 3 falhas.",
					"<b>Me Segura!</b> (Luta CD 20): o aliado segurado não ataca e não testa Vontade na próxima rodada.",
					"<b>Roda de Bardos Arruaceiros</b> (Fortitude CD 20): conta como sucesso em Deixa Disso ou Boa Ideia.",
					"<b>Cidadão de Bem:</b> não sofre o dano automático seguinte (mas testa Vontade).",
					"<b>Dá na Minha Cara</b> (opcional, Provocação Petulante): poupa todos do dano seguinte; o provocador sofre tudo e mais um."
				])}`, 400),
			pagina("Show na Terceira Opção", `
				<p>Opcional, só se os jogadores quiserem. Pré-requisitos: todos tocam (treinados em Atuação ou testes de treinamento; até dois podem contribuir de outra forma), a banda tem nome, visual e estilo.</p>
				<p><b>Teste estendido de Atuação CD 20, 5 sucessos</b> (${linkMacro("Show")}).</p>
				${lista([
					"Perícia alternativa sem justificativa de que se refere ao instrumento: +2 na CD dali em diante. Com justificativa aceita (Guerra para tocar tambores do exército), não muda.",
					"Cada falha: todos perdem <b>2d8 PM</b>. Quem chega a 0 PM <b>congela</b>, sai do teste e a CD sobe +5.",
					"O frontman faz o último teste; a margem dele define o resultado (efeitos acumulam): até 5, nada; 6 a 10, bebida grátis; 11 a 15, 1d100 T$; 16 a 20, Torcida pelo resto da aventura; 21 a 25, um groupie parceiro; 26 a 30, 1d6 groupies; 31 ou mais, um fanático (parceiro permanente)."
				])}`, 500),
			pagina("A Traficante de Partituras", `
				<p>Toda linha de investigação leva às ${L(itemPorNome("Partitura"))}s. <b>Atuação ou Misticismo CD 20</b> num pedaço revela algo estranho nas notas. Os músicos contam que uma garota chamada Dorothea aparece toda semana com composições novas, dizendo-se representante de Calliko (alguns acham que ela <i>é</i> Calliko).</p>
				<p><b>Achar Dorothea:</b> teste estendido de <b>Investigação CD 17, 3 sucessos</b>; ou ela aparece na própria Terceira Opção, cercada de bardos que pagam sem hesitar. Também dá para segui-la até a Casa de Repouso.</p>
				<h3>Informações de Dorothea</h3>
				${lista([
					"É neta de Ellanie, clériga de Marah. Insegura e muito ingênua, não acredita que alguém seja realmente maligno.",
					"Acha Calliko um gênio; sabe do dado tatuado (símbolo de Nimb), mas não achou relevante. Não sabe do aspecto de Nimb.",
					"Não acredita que as músicas causem as brigas e não acha os internos perigosos.",
					"A avó não sabe de nada: ela implora que não contem.",
					"Leva o grupo à Casa de Repouso e indica o quarto. Pode se entregar à Guarda, mas o bardo é inocente.",
					"Um interno pode contar que viu <b>Torgo</b> instalando o Imagoduto há quase um ano."
				])}
				<p>${L(itemPorNome("Depoimento"))}.</p>`, 600),
			pagina("A Casa de Repouso Millicent", `
				<p>Quase um castelo no topo de uma colina, colado à muralha: manchas de umidade, símbolos de Marah tomados de limo, anjos com rostos erodidos, janelas gradeadas, porta de prisão. Ellanie criou o hospital logo antes do primeiro ataque da Tormenta e hoje é um depósito de gente, tocado por ela e por voluntários. A casa está levemente afetada pela Tormenta: a barreira entre os Planos é tênue, e no quarto andar está o Imagoduto.</p>
				<p>A subida até a cela de Calliko é uma curta jornada de horrores, mas digna de pena. Visão mística mostra pensamentos e emoções subindo para o Imagoduto. Destaque três internos: Rylonn, Bdun e Grisgemm.</p>
				<h3>O bardo insano</h3>
				<p>Cela imunda, partituras no chão, notas escritas com sangue nas paredes, e um silfo magro com um dado tatuado no rosto: \"Tragam mais pergaminhos... Mais tinta... Preciso continuar a compor...\" <b>Investigação ou Misticismo CD 25</b> revela a energia do Imagoduto e o cristal rosado. Falar em limitar as composições, em Nimb ou no Imagoduto põe Calliko em frenesi. <b>Chegando de surpresa:</b> o frenesi começa com qualquer interferência no Imagoduto.</p>
				<h3>Batalha Insana</h3>
				<p>Uma explosão de cores vira paisagem de loucura, os andares se misturam e os três internos surgem, <b>um de cada vez</b>: ${L(atores.carrasco)}, ${L(atores.cocatriz)} e ${L(atores.quimera)}. Termina ao destruir ou desativar o Imagoduto, apaziguar os internos ou acalmar Calliko.</p>
				${lista([
					`Início de cada rodada: <b>1d12</b> em ${L(tabLoucura)}.`,
					"<b>Rio de Som:</b> quem cair faz Vontade CD 20 ou só canta e toca na rodada.",
					`<b>Apaziguar:</b> 5 sucessos, um teste do grupo por rodada (ação padrão), os outros ajudam. Rylonn: Cura ou social CD 22. Bdun: Nobreza ou social CD 24. Grisgemm: Guerra ou social CD 26. Falha por 5+: ${L(tabSurtos)}.`,
					`<b>Imagoduto:</b> 50 sucessos em Ofício (engenhoqueiro) CD 30 (${linkMacro("Imagoduto")}), ou 500 PV com RD 20 que não pode ser ignorada.`,
					"<b>\"Isso é forçar a barra\":</b> os 50 sucessos existem para o grupo ter que lidar com os monstros. A melhor tática é segurar o carrasco sem derrotá-lo enquanto alguém sabota a máquina; se o grupo descobrir, deixe funcionar."
				])}
				<p>Use ${linkMacro("Batalha")} para os efeitos de loucura, o rio, os testes de apaziguar e os surtos.</p>`, 700),
			pagina("Desfecho, Provas e Pagamento", `
				<p>A Casa de Repouso volta a uma calma relativa, mas nada foi resolvido de verdade: Calliko ainda está frenético e Ellanie, desamparada. Dorothea não fez nada tecnicamente ilegal, mas causou muita destruição; o julgamento foge à alçada dos heróis. Fora da Casa, Calliko fica mais vulnerável e continua compondo; matá-lo ou mantê-lo desacordado funciona, a um custo.</p>
				<p>As partituras que já circulam não podem ser todas destruídas; as bandas da Terceira Opção param de tocá-las. O importante é que não surjam novas. Se a aventura for depois da metade do arco, os jogadores podem entender agora a que Lei &amp; Ordem se refere.</p>
				<p><b>Final infeliz?</b> Diga sim às ideias dos jogadores para salvar Calliko: a Academia Arcana, a devoção a Khalmyr, uma <i>magnum opus</i> que esgote a criatividade. Ou opte por um tom trágico, desde que o grupo possa afetar o resultado.</p>
				<h3>Provas</h3>
				${lista([
					"Calliko e a tatuagem no rosto.",
					`${L(itemPorNome("Depoimento"))}.`,
					`O Imagoduto ou ${L(itemPorNome("Peça do Imagoduto"))}.`,
					"O testemunho de um cliente da Terceira Opção.",
					`${L(itemPorNome("Partitura"))} (ou um pedaço).`
				])}
				<h3>Pagamento</h3>
				<p>Se as brigas acabarem, não importa o que aconteça com Calliko, Click paga: níveis 8 ou 9, <b>T$ 12.000</b>; nível 10, <b>T$ 24.000</b>; nível 11, <b>T$ 32.000</b>. Se o grupo fez um bom trabalho (sobretudo cuidando dos bardos), bebe de graça na Terceira Opção a qualquer hora.</p>`, 800)
		]
	});

	ui.notifications.info("Fim dos Tempos · Arco 2 · Aventura 4 (Massacre na Taverna dos Maníacos): conteúdo criado.");
})();
