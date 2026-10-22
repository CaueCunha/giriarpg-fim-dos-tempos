/* =====================================================================
 * FIM DOS TEMPOS · ARCO 2 · ESPAÇO DE MASMORRA · "O LABIRINTO LIBERTO"
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Arco 2 · O Labirinto Liberto" com:
 *      - Ameaças: mirminoides (soldado e trilha), metaliano, aurumvorax, anônimo, bibliotecário,
 *        Chama Funesta e as criaturas de Ameaças de Arton (mímico, duplo, mantor, tigres-de-Hyninn,
 *        rarvnaak, bulette, múmia e senhor das múmias).
 *      - Itens: Espada da Galáxia, as três Chaves Tríplices, o livro da genealogia de Halak-Tûr e a
 *        armadilha da cabra-cega; carregadores e besta de carga como parceiros.
 *      - Tabelas de encontros, reações, pistas do Enxadrista e tesouros fixos.
 *      - Diário com regras da masmorra, entradas, as três masmorras, o subnível e o covil.
 *      - Macros: Busca pela Entrada, Exploração, Escuridão, Entradas, Armadilhas, Tesouro Infinito,
 *        Enxadrista, Laboratório de Poções, Prensa, Criaturas e Progresso e Chaves.
 *   3. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "a2labirinto".
 *
 * Feito a partir do código do sistema (1.6.4, out/2026). Validado no Foundry simulado do
 * módulo giriarpg-fim-dos-tempos; veja o guia a2-labirinto-liberto.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "a2labirinto";
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
			window: { title: "O Labirinto Liberto: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para O Labirinto Liberto.</p>
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
	const NOME_PASTA = "FdT · Arco 2 · O Labirinto Liberto";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#4b3f72", flags: FLAGS() })).id;
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

	const ATR_PERICIA = { luta: "for", atle: "for", pont: "des", inic: "des", refl: "des", furt: "des", acro: "des", fort: "con", perc: "sab", vont: "sab", intu: "sab", sobr: "sab", reli: "sab", atua: "car", enga: "car", dipl: "car", inti: "car", mist: "int", ofi0: "int", alqu: "int", arte: "int", enge: "int", conh: "int", pilo: "des", inve: "int", ladi: "des", guer: "int", cura: "sab", nobr: "int", ades: "car" };

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
	const A = `${T20I}/ameacas`;
	const EQ = `${T20I}/itens/equipamentos`;
	const GE = `${T20I}/itens/gerais`;
	const MG = `${T20I}/magias`;
	const FURTIVO_IMG = "icons/magic/perception/silhouette-stealth-shadow.webp";
	const furtivo = (d) => aoUsar(`Ataque Furtivo (+${d})`, FURTIVO_IMG, [["dano", d]], ["attack"]);
	const UM_DIA = { value: 86400, units: "seconds" };
	const ICO = {
		soldado: `${A}/formiga-aberrante.png`,
		trilha: `${A}/formiga-aberrante-maior.png`,
		metaliano: `${A}/golem-de-ferro.png`,
		aurumvorax: `${A}/lobo-das-cavernas.png`,
		anonimo: `${A}/aparicao.png`,
		bibliotecario: `${A}/devorador-de-medos.png`,
		dragao: `${A}/dragao-adulto.png`,
		mimico: `${GE}/colecao-de-livros.webp`,
		duplo: `${A}/cultista-da-traicao.png`,
		mantor: `${A}/sombra-dos-goblinoides.png`,
		tigre: `${A}/manticora.png`,
		rarvnaak: `${MG}/invisibilidade.webp`,
		bulette: `${A}/lobo-crocodilo.png`,
		mumia: `${A}/zumbi.png`,
		senhor: `${A}/necromante-veterano.png`,
		lanca: `${EQ}/lanca.webp`,
		espada: `${EQ}/espada-longa.webp`,
		chave: "icons/svg/padlock.svg",
		livro: `${GE}/livro.webp`,
		cabraCega: `${GE}/engrenagens.webp`,
		parceiro: `${GE}/parceiros.webp`,
		besta: `${GE}/animal-comum.webp`,
		ouro: "icons/svg/coins.svg"
	};
	/** RD n/tipo do livro: o campo "excecao" do sistema soma n contra todo dano que não seja dos tipos dados. */
	const rdExceto = (n, exceto) => Object.fromEntries(exceto.map((t) => [t, { excecao: n }]));

	/* ------------------------------------------------------------------ */
	/* 2. Ameaças                                                           */
	/* ------------------------------------------------------------------ */
	const atores = {};
	const ESPACO = "Habitante do espaço de masmorra: não sofre a escuridão do Labirinto e passa ao largo das armadilhas.";

	atores.soldado = await criarNPC({
		name: "Mirminoide Soldado",
		role: "soldado",
		img: ICO.soldado,
		nd: 5,
		cd: 18,
		tipo: "mon",
		papel: "solo",
		atr: { for: 2, des: 2, con: 2, int: -2, sab: 0, car: -1 },
		pv: 42,
		def: 24,
		walk: 9,
		sentidos: ["escuro", "faro"],
		pericias: { inic: 6, perc: 6, fort: 14, refl: 8, vont: 11, atle: 8, luta: 20 },
		res: { eletricidade: { base: 5 } },
		resTxt: "Redução de eletricidade 5.",
		ataquesTxt: "Lança +20 (2d8+16, x3, mais 1d8 de eletricidade) e mordida +20 (2d6+16 mais 1d8 de eletricidade).",
		equipTxt: "Armadura de couro batido, lança aumentada, escudo pesado.",
		bio: p("Formigas humanoides inteligentes, territoriais e agressivas, que veem tudo fora da colônia como inimigo. Dominam as Salas 5 e 6 da masmorra de Hyninn e temem os metalianos, que consideram predadores invencíveis.",
			"Deslocamento de escalar 9m. " + ESPACO),
		items: [
			arma("Lança Aumentada", ICO.lanca, { dano: "2d8+16", tipo: "perfuracao", critX: 3, extra: [["1d8", "eletricidade"]], effects: [aoUsar("Descarga Bioelétrica (+2d8)", `${MG}/toque-chocante.webp`, [["dano", "2d8[eletricidade]"]], ["attack"])] }),
			arma("Mordida", "icons/svg/pawprint.svg", { dano: "2d6+16", tipo: "perfuracao", extra: [["1d8", "eletricidade"]], effects: [aoUsar("Descarga Bioelétrica (+2d8)", `${MG}/toque-chocante.webp`, [["dano", "2d8[eletricidade]"]], ["attack"])] }),
			poder("Agarrar Aprimorado", "icons/svg/net.svg", p("<b>Livre.</b> Ao acertar a mordida, pode agarrar o alvo (teste +20)."), { exec: "free" }),
			poder("Descarga Bioelétrica", `${MG}/toque-chocante.webp`, p("Quando acerta um ataque corpo a corpo, causa <b>+2d8 de eletricidade</b>. <b>Recarga (movimento).</b> Marque na janela de ataque."), { exec: "passive" }),
			poder("Mentalidade do Formigueiro", "icons/svg/eye.svg", p("Todos os mirminoides a até 20 km da rainha estão em comunicação constante. Se um está ciente de um perigo, todos estão; se um não está surpreso ou flanqueado por um perigo, nenhum está."), { exec: "passive" })
		]
	});

	atores.trilha = await criarNPC({
		name: "Trilha Mirminoide",
		role: "trilha",
		img: ICO.trilha,
		nd: 10,
		cd: 26,
		tipo: "mon",
		raca: "mirminoide (bando)",
		papel: "solo",
		tamanho: "gra",
		tokenSize: 2,
		atr: { for: 3, des: 2, con: 2, int: -2, sab: 1, car: -1 },
		pv: 95,
		def: 35,
		walk: 9,
		sentidos: ["escuro", "faro"],
		pericias: { inic: 11, perc: 12, fort: 19, refl: 13, vont: 16, atle: 14, luta: 34 },
		res: { eletricidade: { base: 5 } },
		resTxt: "Forma coletiva, redução de eletricidade 5.",
		ataquesTxt: "[Bando] Lança x2 +34 (4d8+16, x3, mais 2d8 de eletricidade) e mordida +34 (4d6+16 mais 2d8 de eletricidade).",
		equipTxt: "Armadura de couro batido, lança aumentada, escudo pesado (1d8 de cada).",
		bio: p("Um bando de mirminoides soldados que age como uma criatura só. Uma delas fica no ninho das Salas 5 e 6 da masmorra de Hyninn; outras surgem nos encontros.",
			"<b>Forma coletiva:</b> imune a efeitos que afetam uma única criatura e não causam dano; sofre metade do dano de efeitos que afetam uma criatura e o dobro do dano de efeitos de área. Deslocamento de escalar 9m. " + ESPACO),
		items: [
			arma("Lança Aumentada", ICO.lanca, { dano: "4d8+16", tipo: "perfuracao", critX: 3, extra: [["2d8", "eletricidade"]], desc: p("Dois ataques por ação agredir.") }),
			arma("Mordida", "icons/svg/pawprint.svg", { dano: "4d6+16", tipo: "perfuracao", extra: [["2d8", "eletricidade"]] }),
			poder("Agarrar Aprimorado", "icons/svg/net.svg", p("<b>Livre.</b> Ao acertar a mordida, pode agarrar o alvo (teste +36)."), { exec: "free" }),
			poder("Puxar para Retaguarda", "icons/svg/net.svg", p("<b>Movimento.</b> Teste de agarrar contra uma criatura Média ou menor que esteja agarrando. Se vencer, puxa a vítima para o meio do bando: ela continua agarrada e sofre <b>6d8+16 de perfuração e 4d8 de eletricidade</b> no início de cada turno da trilha. Até duas criaturas por vez. Vencer um teste de agarrar escapa para um espaço adjacente."),
				{ exec: "move", rolls: [["No meio do bando", [["6d8+16", "perfuracao"], ["4d8", "eletricidade"]]]] }),
			poder("Mentalidade do Formigueiro", "icons/svg/eye.svg", p("Se um mirminoide está ciente de um perigo, todos estão; se um não está surpreso ou flanqueado, nenhum está."), { exec: "passive" })
		]
	});

	atores.metaliano = await criarNPC({
		name: "Metaliano",
		role: "metaliano",
		img: ICO.metaliano,
		nd: 12,
		cd: 33,
		tipo: "mon",
		raca: "metaliano",
		papel: "solo",
		atr: { for: 7, des: 4, con: 2, int: 3, sab: 1, car: 0 },
		pv: 540,
		def: 43,
		walk: 9,
		sentidos: ["escuro"],
		pericias: { inic: 16, perc: 11, fort: 20, refl: 26, vont: 12, acro: 14, atle: 17, furt: 14, ladi: 14, luta: 36 },
		ic: ["atordoamento", "cansaco", "enfeiticado", "metabolismo", "paralisado", "veneno"],
		res: { dano: { base: 20 }, fogo: { base: 10 }, frio: { base: 10 }, impacto: { base: 10 }, acido: { vulnerabilidade: true } },
		resTxt: "Imunidade a atordoamento, cansaço, encantamento, metabolismo, paralisia e veneno, redução de dano 20/adamante, redução de fogo, frio e impacto 10, vulnerabilidade a ácido.",
		ataquesTxt: "Espada da Galáxia x3 +36 (4d12+20, 17).",
		equipTxt: "Espada da Galáxia.",
		tesouro: "Nenhum.",
		bio: p("Os \"fantasmas de aço\": exploradores muito inteligentes de além do éter divino conhecido, devotos da Imperatriz Primária. Dois capitães de prestígio foram tragados para o Labirinto e não sabem um do outro. Um vive na Sala 18 da masmorra de Hyninn (os troféus); o outro só aparece na tabela de encontros.",
			"Odeiam o confinamento e anseiam pela liberdade, mas podem conversar se o grupo tentar. Depois que os dois tiverem aparecido, ignore novas aparições na tabela.",
			"A RD 20/adamante está como RD geral 20: ignore-a contra armas de adamante. A Espada da Galáxia ignora toda RD (use a macro <i>Criaturas</i> para aplicar o dano sem RD)."),
		effects: [chave("Invisibilidade Natural", `${MG}/invisibilidade.webp`, [], true, "Camuflagem total; criaturas que não podem vê-lo ficam desprevenidas. Ao sofrer dano: Vontade (CD = dano) ou fica visível. Recarga (movimento).")],
		items: [
			arma("Espada da Galáxia", ICO.espada, { dano: "4d12+20", tipo: "corte", critM: 17, desc: p("Três ataques por ação agredir. <b>Ignora qualquer tipo de redução de dano.</b>") }),
			poder("Raio de Luz", `${MG}/raio-solar.webp`, p("<b>Movimento.</b> Luz concentrada numa esfera de 3m de raio em alcance médio: <b>6d6+20 de fogo</b> e em chamas (Ref CD 33 reduz à metade e evita as chamas)."),
				{ exec: "move", alcance: "medium", area: "Esfera de 3m de raio", save: "Reflexos CD 33 reduz à metade e evita as chamas", rolls: [["Dano", [["6d6+20", "fogo"]]]], effects: [emChamas()] }),
			poder("Detonação Final", `${MG}/desintegrar.webp`, p("<b>Completa.</b> Se for reduzido a 0 PV ou menos armado com a Espada da Galáxia, enterra a lâmina no próprio ventre: a explosão consome o metaliano e a espada e causa o efeito de <b>Desintegrar (CD 33)</b> em todas as criaturas e objetos num raio de 90m (10d12+10 de essência; Fortitude reduz para 2d12)."),
				{ exec: "full", area: "Raio de 90m", save: "Fortitude CD 33 reduz para 2d12", rolls: [["Desintegrar", [["10d12+10", "essencia"]]]] }),
			poder("Invisibilidade Natural", `${MG}/invisibilidade.webp`, p("<b>Movimento.</b> Fica invisível (camuflagem total; quem não o vê fica desprevenido contra ele). Não perde a invisibilidade ao atacar. Sempre que sofre dano, Vontade com CD igual ao dano ou fica visível. <b>Recarga (movimento).</b> Efeito ligado na aba de efeitos."), { exec: "move" }),
			poder("Resiliência", "icons/svg/regen.svg", p("Não fica inconsciente com 0 PV ou menos; só morre com <b>–270 PV</b>."), { exec: "passive" }),
			poder("Sentidos Especiais", "icons/svg/eye.svg", p("Enxerga em escuridão total, mesmo mágica, vê invisíveis e não pode ser flanqueado. Não percebe sons nem cheiros: falha automaticamente em Percepção para ouvir ou farejar."), { exec: "passive" }),
			poder("Vulnerabilidade a Água", "icons/svg/acid.svg", p("Água o afeta como uma quantidade equivalente de ácido."), { exec: "passive" })
		]
	});

	atores.aurumvorax = await criarNPC({
		name: "Aurumvorax",
		role: "aurumvorax",
		img: ICO.aurumvorax,
		nd: 9,
		cd: 23,
		tipo: "mon",
		papel: "solo",
		tamanho: "peq",
		atr: { for: 4, des: 3, con: 3, int: -4, sab: 1, car: 0 },
		pv: 170,
		def: 33,
		walk: 9,
		sentidos: ["escuro", "faro"],
		pericias: { inic: 13, perc: 9, fort: 15, refl: 21, vont: 9, furt: 13, luta: 27 },
		ic: ["veneno"],
		res: { ...rdExceto(10, ["corte", "perfuracao"]), fogo: { base: 10 } },
		resTxt: "Imunidade a veneno, redução de dano 10/corte ou perfuração, redução de fogo 10.",
		ataquesTxt: "Mordida +27 (2d4+8) e duas garras +27 (2d6+8).",
		tesouro: "Padrão (exceto moedas e itens de ouro).",
		bio: p("Fera de seis pernas, como um cão ou texugo grande demais, de pelo dourado e parcialmente feita de metal. Só ouro sacia sua fome.",
			"É a única forma de deter o Tesouro Infinito da Sala 19 de Hyninn: devorando o ouro, escava um túnel até a saída. Dois vivem na Sala 1 de Azgher.",
			"A RD 10/corte ou perfuração usa a exceção de RD do sistema: corte e perfuração passam direto."),
		items: [
			arma("Mordida", "icons/svg/pawprint.svg", { dano: "2d4+8", tipo: "perfuracao", effects: [aoUsar("Fome de Ouro (+2)", ICO.ouro, [["ataque", "2"], ["dano", "2"]], ["attack"])] }),
			arma("Garra", "icons/svg/pawprint.svg", { dano: "2d6+8", tipo: "corte", desc: p("Duas garras por ação agredir. Agarrando, ganha <b>dois ataques adicionais</b> de garra contra a vítima."), effects: [aoUsar("Fome de Ouro (+2)", ICO.ouro, [["ataque", "2"], ["dano", "2"]], ["attack"])] }),
			poder("Agarrar Aprimorado", "icons/svg/net.svg", p("<b>Livre.</b> Ao acertar a mordida, pode agarrar o alvo (teste +30)."), { exec: "free" }),
			poder("Entristecer Azgher", ICO.ouro, p("<b>Padrão.</b> Devora até <b>5d10 TO</b> de ouro, ou um item de ouro de até 1 espaço, solto ou numa criatura que esteja agarrando. Recebe <b>10 PV temporários</b>. Não há limite de quanto ouro pode devorar."), { exec: "standard", rolls: [["Ouro devorado (TO)", [["5d10", ""]]]] }),
			poder("Fome de Ouro", ICO.ouro, p("Fareja a presença e a quantidade de ouro em alcance médio. <b>+2 em ataque e dano</b> contra quem carrega pelo menos TO 50 (marque na janela de ataque)."), { exec: "passive" }),
			poder("Frenesi de Garras", "icons/svg/pawprint.svg", p("Enquanto agarra uma criatura, não ataca outros oponentes, mas ganha dois ataques adicionais de garra contra a agarrada."), { exec: "passive" })
		]
	});
	await atores.aurumvorax.update({ "system.attributes.movement.burrow.base": 3 }).catch(() => null);

	atores.anonimo = await criarNPC({
		name: "Anônimo",
		role: "anonimo",
		img: ICO.anonimo,
		nd: 8,
		cd: 28,
		tipo: "mor",
		papel: "solo",
		atr: { for: 0, des: 1, con: 1, int: 0, sab: 0, car: -1 },
		pv: 222,
		def: 29,
		walk: 9,
		sentidos: ["escuro"],
		pericias: { inic: 9, perc: 8, fort: 15, refl: 21, vont: 8, furt: 13, luta: 25 },
		ic: ["mental"],
		res: { dano: { base: 5 }, essencia: { imunidade: true }, frio: { imunidade: true } },
		resTxt: "Imunidade a efeitos mentais, essência e frio, redução de dano 5.",
		ataquesTxt: "Toque apagador +25 (2d12+18 de frio).",
		bio: p("Morto-vivo recoberto de páginas: um mortal que perdeu a história e toda memória a seu respeito. A vida da vítima surge num livro perto do covil. Três vivem na Sala 4 de Tanna-Toh: não saem nem perseguem, mas atacam quem entra. Os outros habitantes os temem e podem fazer acordos contra eles.",
			"Use a macro <i>Criaturas</i> para a aura e o apagamento (a perda de Carisma vira um efeito no personagem)."),
		items: [
			arma("Toque Apagador", `${MG}/alterar-memoria.webp`, { dano: "2d12+18", tipo: "frio", desc: p("Quem é atingido perde 1 de Carisma (Von CD 28 evita).") }),
			poder("Apagamento", `${MG}/alterar-memoria.webp`, p("Quem é atingido pelo toque apagador perde <b>1 de Carisma</b> (Von CD 28 evita). Cada ponto perdido para anônimos dá <b>–1 em todos os testes</b>. Recupera 1 por dia. Com Carisma –5, a vítima some da história e vira um anônimo."), { exec: "passive", save: "Vontade CD 28 evita" }),
			poder("Aura de Oblívio", `${MG}/alterar-memoria.webp`, p("Quem começa o turno em alcance médio sofre <b>6d6 de frio</b> e perde 1 de Carisma (Fort CD 28 reduz à metade, evita a perda e impede nova perda por esta aura nesta cena)."),
				{ exec: "passive", alcance: "medium", save: "Fortitude CD 28 reduz à metade", rolls: [["Aura", [["6d6", "frio"]]]] })
		]
	});

	atores.bibliotecario = await criarNPC({
		name: "Bibliotecário",
		role: "bibliotecario",
		img: ICO.bibliotecario,
		nd: 17,
		cd: 46,
		tipo: "esp",
		papel: "solo",
		atr: { for: 1, des: 2, con: 3, int: 0, sab: 0, car: -5 },
		pv: 694,
		def: 49,
		walk: 9,
		sentidos: ["cegas", "escuro"],
		pericias: { inic: 16, perc: 24, fort: 17, refl: 30, vont: 24, luta: 20 },
		ic: ["atordoamento", "mental", "sentidos", "enfeiticado", "medo"],
		res: { dano: { base: 30 } },
		resTxt: "Evasão aprimorada, imunidade a atordoamento, efeitos mentais e de sentidos, encantamento e medo, redução de dano 30.",
		tesouro: "Nenhum.",
		bio: p("Guardiões nativos do Reino de Tanna-Toh: corpo atarracado de simetria radial, várias pernas e braços, olhos por toda parte. Tudo veem, e tudo que veem é destruído. Quatro patrulham a Biblioteca Proibida (Sala 11 de Tanna-Toh).",
			"Não respondem a interação social, são imunes a magias que não causam dano e ignoram invisibilidade, escuridão, camuflagem e Furtividade. Saindo da masmorra de Tanna-Toh, o grupo encontra todos com os PV cheios de novo.",
			"<b>A fraqueza:</b> a armadilha da cabra-cega (Sala 14 de Hyninn) cega e ensurdece os bibliotecários. Eles resistem com Fortitude, mas só passam com <b>13 ou mais no d20</b>. Use a macro <i>Criaturas</i>."),
		items: [
			poder("Raio Desintegrador", `${MG}/desintegrar.webp`, p("<b>Padrão.</b> Uma criatura em alcance médio <b>perde 20d12 PV</b> e fica enjoada (Fort CD 46 reduz a perda à metade e evita a condição)."),
				{ exec: "standard", alcance: "medium", save: "Fortitude CD 46 reduz à metade e evita enjoado", rolls: [["Perda de vida", [["20d12", "perda"]]]], effects: [cond("Enjoado")] }),
			poder("Visão Defensiva", `${MG}/desintegrar.webp`, p("<b>Reação.</b> Quando percebe uma criatura ou objeto que não pertence à biblioteca, em alcance médio, usa o Raio Desintegrador contra o \"intruso\". Infinitas vezes por rodada, quantos forem os intrusos. Não pode escolher não usar."), { exec: "reaction" }),
			poder("Visão Total", "icons/svg/eye.svg", p("Não pode ser flanqueado nem surpreendido; vê através de camuflagem e escuridão normais e mágicas, ilusões e transmutações."), { exec: "passive" }),
			poder("Conhecimento Acumulado", ICO.livro, p("Passa automaticamente em Conhecimento, Misticismo e Religião para informação contida na biblioteca, e em Misticismo para identificar criaturas, itens mágicos e magias."), { exec: "passive" }),
			poder("Evasão Aprimorada", "icons/svg/wing.svg", p("Passando em Reflexos que reduziria o dano à metade, não sofre dano; falhando, sofre metade."), { exec: "passive" })
		]
	});

	atores.dragao = await criarNPC({
		name: "Chama Funesta",
		tokenName: "Chama Funesta",
		role: "dragao",
		link: true,
		img: ICO.dragao,
		nd: 11,
		cd: 32,
		tipo: "mon",
		raca: "dragão vermelho adulto",
		papel: "solo",
		tamanho: "eno",
		tokenSize: 3,
		atr: { for: 13, des: 1, con: 10, int: 6, sab: 6, car: 6 },
		pv: 614,
		pm: 77,
		def: 42,
		walk: 12,
		sentidos: ["cegas", "escuro"],
		pericias: { inic: 12, perc: 15, fort: 24, refl: 11, vont: 20, enga: 22, guer: 22, inti: 22, intu: 22, mist: 22, luta: 34 },
		res: { dano: { base: 10 }, fogo: { imunidade: true }, frio: { vulnerabilidade: true } },
		resTxt: "Imunidade a fogo, redução de dano 10, resistência a magia +3, vulnerabilidade a frio.",
		ataquesTxt: "Mordida +34 (4d10+25, 18) e duas garras +34 (3d10+25, 18).",
		tesouro: "Especial (ND 12: quatro rolagens em dinheiro, duas em itens e dois itens mágicos médios) e 4 peças de couro de dragão (CD 26 para extrair).",
		conjuracao: "car",
		bio: p("Dragão vermelho adulto cujo covil nas Montanhas Sanguinárias foi tragado pelo espaço de masmorra. Todas as saídas desabaram e ele perdeu a forma bípede: virou um monstro cuja única função é guardar a câmara. Enfurecido e aterrorizado, não aceita diálogo nem aliança. A batalha é inevitável.",
			"Repousa sobre o tesouro numa plataforma em meio a um rio de lava; o teto altíssimo deixa que voe. Vencido, as paredes desabam e abrem um túnel até os pés da estátua de Valkaria."),
		effects: [aoUsar("Resistência a magia (+3)", `${MG}/protecao-contra-magia.webp`, [["roll", 3]], ["skill"], ["Fortitude", "Reflexos", "Vontade"])],
		items: [
			arma("Mordida", "icons/svg/pawprint.svg", { dano: "4d10+25", tipo: "perfuracao", critM: 18 }),
			arma("Garra", "icons/svg/pawprint.svg", { dano: "3d10+25", tipo: "corte", critM: 18, desc: p("Duas garras por ação agredir.") }),
			poder("Sopro", `${MG}/bola-de-fogo.webp`, p("<b>Padrão.</b> Cone de 12m: <b>12d12 de fogo</b> e em chamas (Ref CD 32 reduz à metade e evita a condição). <b>Recarga (movimento).</b>"),
				{ exec: "standard", area: "Cone de 12m", save: "Reflexos CD 32 reduz à metade e evita em chamas", rolls: [["Sopro", [["12d12", "fogo"]]]], effects: [emChamas()] }),
			poder("Aura Aterradora", `${MG}/amedrontar.webp`, p("Vontade CD 32 evita. Use a regra de aura aterradora dos dragões."), { exec: "passive", save: "Vontade CD 32 evita" }),
			poder("Imposição Avassaladora", `${MG}/amedrontar.webp`, p("<b>Livre, uma vez por rodada.</b> Quando reduz um inimigo a 0 PV ou menos, os outros inimigos em alcance médio sofrem <b>4d12 de dano psíquico</b> (Von CD 32 reduz à metade). Medo."),
				{ exec: "free", alcance: "medium", save: "Vontade CD 32 reduz à metade", rolls: [["Dano", [["4d12", "psiquico"]]]] }),
			magia("Campo de Força", `${MG}/campo-de-forca.webp`, p("<b>Reação, 4 PM.</b> Quando sofre dano, recebe <b>RD 30</b> contra esse dano."), { exec: "reaction", custo: 4, circulo: 1, tipoMagia: "arc", escola: "abj" }),
			magia("Curar Ferimentos", `${MG}/curar-ferimentos.webp`, p("<b>Padrão, 11 PM.</b> Uma criatura adjacente cura 12d8+12 PV."), { exec: "standard", custo: 11, circulo: 3, tipoMagia: "arc", escola: "evo", rolls: [["Cura", [["12d8+12", "curapv"]]]] }),
			magia("Desespero Esmagador", `${MG}/desespero-esmagador.webp`, p("<b>Padrão, 11 PM.</b> Cone de 6m: debilitadas e esmorecidas até o fim da cena e pasmas por 1 rodada (Von evita pasmo e reduz as demais para 1 rodada)."),
				{ exec: "standard", custo: 11, circulo: 3, tipoMagia: "arc", escola: "enc", area: "Cone de 6m", save: "Vontade parcial", effects: [cond("Debilitado"), cond("Esmorecido"), cond("Pasmo")] }),
			magia("Dissipar Magia", `${MG}/dissipar-magia.webp`, p("<b>Padrão, 3 PM.</b> Uma criatura, objeto ou esfera de 3m em alcance médio: teste de Misticismo; magias com CD igual ou menor são dissipadas."), { exec: "standard", custo: 3, circulo: 2, tipoMagia: "arc", escola: "abj", alcance: "medium" }),
			magia("Metamorfose", `${MG}/metamorfose.webp`, p("<b>Padrão, 5 PM.</b> Uma criatura em alcance médio vira uma galinha (não ataca, fala nem lança magias, Defesa 10, deslocamento 3m). Vontade anula; no início de cada turno, novo teste de Vontade termina a magia."), { exec: "standard", custo: 5, circulo: 2, tipoMagia: "arc", escola: "tra", alcance: "medium", save: "Vontade anula" }),
			magia("Selo de Mana", `${MG}/selo-de-mana.webp`, p("<b>Padrão, 3 PM.</b> Toque: Vontade ou, por uma cena, precisa de Vontade sempre que usar habilidade que gaste PM (falha gasta os PM sem efeito)."), { exec: "standard", custo: 3, circulo: 2, tipoMagia: "arc", escola: "abj", save: "Vontade anula" }),
			magia("Toque Vampírico", `${MG}/toque-vampirico.webp`, p("<b>Padrão, 5 PM.</b> Ataque de mordida como parte da magia: se acertar, causa o dano do ataque e mais <b>6d6 de trevas</b>, e recupera PV iguais à metade do dano da magia."), { exec: "standard", custo: 5, circulo: 2, tipoMagia: "arc", escola: "nec", rolls: [["Trevas", [["6d6", "trevas"]]]] }),
			magia("Velocidade", `${MG}/velocidade.webp`, p("<b>Padrão, 3 PM, sustentada.</b> Uma ação padrão adicional por turno, que não pode ser usada para lançar magias."), { exec: "standard", custo: 3, circulo: 2, tipoMagia: "arc", escola: "tra" })
		]
	});
	await atores.dragao.update({ "system.attributes.movement.fly.base": 24 });

	atores.mimico = await criarNPC({
		name: "Mímico da Estante",
		tokenName: "Estante",
		role: "mimico",
		link: true,
		img: ICO.mimico,
		nd: 6,
		cd: 22,
		tipo: "mon",
		papel: "solo",
		atr: { for: 2, des: 4, con: 3, int: -2, sab: 3, car: 0 },
		pv: 220,
		def: 26,
		walk: 6,
		sentidos: ["escuro"],
		pericias: { inic: 9, perc: 8, fort: 18, refl: 12, vont: 6, enga: 15, furt: 2, luta: 20 },
		res: { ...rdExceto(5, ["frio"]), acido: { imunidade: true } },
		resTxt: "Imunidade a ácido, redução de dano 5/frio.",
		ataquesTxt: "Dois tentáculos +20 (2d8+15).",
		tesouro: "Padrão.",
		bio: p("Ameaças de Arton, p. 203. Na Sala 3 de Hyninn, tomou a forma de uma estante de livros e, perto da passagem para Tanna-Toh, aprendeu a se adaptar a cada visitante: os títulos mudam para os mais atraentes a cada vítima (o <i>Hinário da Justiça e da Batalha</i> para um paladino de Khalmyr, o <i>Manual Avançado de Arrombamento e Sabotagem</i> para um ladino, o <i>Grimório Secreto de Talude</i> para um mago). Nunca títulos obviamente falsos, nem nomes de amigos e parentes.",
			"A RD 5/frio usa a exceção de RD do sistema: frio passa direto."),
		items: [
			arma("Tentáculo", "icons/svg/net.svg", { dano: "2d8+15", tipo: "impacto", desc: p("Dois tentáculos por ação agredir."), effects: [furtivo("3d6")] }),
			poder("Abocanhar", "icons/svg/pawprint.svg", p("<b>Livre.</b> Se começar o turno agarrando uma criatura Média ou menor, faz um teste de agarrar: vencendo, abocanha. A vítima continua agarrada e sofre <b>4d8+25 de corte</b> no início de cada turno do mímico. Escapa vencendo uma manobra agarrar."), { exec: "free", rolls: [["Abocanhada", [["4d8+25", "corte"]]]] }),
			poder("Agarrar Aprimorado", "icons/svg/net.svg", p("<b>Livre.</b> Ao acertar um tentáculo, pode agarrar (teste +20)."), { exec: "free" }),
			poder("Ataque Furtivo", FURTIVO_IMG, p("+3d6 contra alvos desprevenidos ou flanqueados."), { exec: "passive" }),
			poder("Cuspe Material", ICO.ouro, p("<b>Padrão.</b> Cospe moedas e objetos num cone de 6m: <b>6d4+6 de perfuração</b> (Ref CD 22 reduz à metade; abocanhado falha automaticamente)."),
				{ exec: "standard", area: "Cone de 6m", save: "Reflexos CD 22 reduz à metade", rolls: [["Dano", [["6d4+6", "perfuracao"]]]] }),
			poder("Imobilidade", "icons/svg/statue.svg", p("Imóvel, é preciso Percepção CD 40 para notar que é uma criatura."), { exec: "passive" })
		]
	});

	atores.duplo = await criarNPC({
		name: "Duplo Prisioneiro",
		tokenName: "Prisioneiro",
		role: "duplo",
		link: true,
		disposition: 0,
		img: ICO.duplo,
		nd: 4,
		cd: 18,
		tipo: "hum",
		raca: "duplo",
		papel: "solo",
		atr: { for: 2, des: 5, con: 2, int: 2, sab: 2, car: 4 },
		pv: 143,
		def: 21,
		walk: 9,
		pericias: { inic: 9, perc: 6, fort: 5, refl: 15, vont: 10, enga: 14, furt: 11, intu: 10, luta: 14 },
		ic: ["mental"],
		resTxt: "Cura acelerada 5, imunidade a adivinhação e efeitos mentais.",
		ataquesTxt: "Garra x2 +14 (1d6+7).",
		tesouro: "Padrão.",
		bio: p("Ameaças de Arton, p. 50. Na Sala 4 de Hyninn, vive anos trancado e acorrentado, contente, até chegarem aventureiros. Então assume a forma de alguém querido do grupo (de preferência alguém que procuram) e espera ser \"libertado\". Conta uma história de quem o prendeu de acordo com o contexto (Ghorskander, um inimigo do passado...).",
			"Solto, acompanha o grupo procurando a hora de jogá-lo numa armadilha, provocar um combate impossível ou matá-lo. Depois volta à prisão, tranca a porta por dentro e se acorrenta de novo. Na névoa transportadora, tenta ficar com o lado mais fraco. Pode tentar levar o grupo ao ninho dos mirminoides.",
			"Já transformado, tem <b>Enganação +34</b> para se passar pela pessoa (efeito na janela de rolagem). Na mesa original, virou Mestre Luriel, o mentor de Arius."),
		effects: [
			aoUsar("Passar-se pela pessoa (+20 Enganação)", `${MG}/disfarce-ilusorio.webp`, [["roll", 20]], ["skill"], ["Enganação"]),
			chave("Cura acelerada 5", "icons/svg/regen.svg", [], true, "Recupera 5 PV no início de cada turno.")
		],
		items: [
			arma("Garra", "icons/svg/pawprint.svg", { dano: "1d6+7", tipo: "corte", desc: p("Duas garras por ação agredir."), effects: [furtivo("3d6")] }),
			poder("Ataque Furtivo", FURTIVO_IMG, p("+3d6 contra alvos desprevenidos ou flanqueados."), { exec: "passive" }),
			poder("Detectar Pensamentos", `${MG}/ligacao-telepatica.webp`, p("Detecta os pensamentos superficiais das criaturas inteligentes em alcance curto. Não pode ser surpreendido por elas e tem <b>+2 na Defesa e em perícias</b> contra elas. Quem sabe disso gasta uma ação de movimento e passa em Vontade CD 20 para esconder os pensamentos até o fim da cena."), { exec: "passive" }),
			poder("Mudar Forma", `${MG}/metamorfose.webp`, p("<b>Padrão.</b> Assume a forma de qualquer humanoide de Pequeno a Grande, como Metamorfose, por tempo indeterminado. Morto, volta à forma natural."), { exec: "standard" })
		]
	});

	atores.mantor = await criarNPC({
		name: "Mantor",
		role: "mantor",
		img: ICO.mantor,
		nd: 5,
		cd: 22,
		tipo: "mon",
		papel: "solo",
		tamanho: "gra",
		tokenSize: 2,
		atr: { for: 4, des: 5, con: 2, int: -1, sab: 2, car: 0 },
		pv: 200,
		def: 24,
		walk: 0,
		sentidos: ["cegas", "escuro"],
		pericias: { inic: 11, perc: 8, fort: 11, refl: 17, vont: 5, furt: 11, luta: 17 },
		res: { trevas: { base: 5 } },
		resTxt: "Redução de trevas 5.",
		ataquesTxt: "Aguilhão +17 (1d10+8 perfuração, x3, alcance 4,5m) e mordida +17 (1d10+8).",
		tesouro: "Metade, mais couro de mantor (CD 20 para extrair, vale T$ 150 para fabricar um manto do mantor).",
		bio: p("Ameaças de Arton, p. 203. Uma grande capa negra que ondula no ar como uma arraia, olhos vermelhos e bocarra ventral. Fica preso ao teto e cai sobre as presas. Inteligente, cruel e agressivo: rejeita diálogo (na tabela de reações, resultados de conversa viram fuga). Furtividade +21 no escuro (efeito na janela de rolagem)."),
		effects: [aoUsar("No escuro (+10 Furtividade)", `${MG}/escuridao.webp`, [["roll", 10]], ["skill"], ["Furtividade"])],
		items: [
			arma("Aguilhão", "icons/svg/pawprint.svg", { dano: "1d10+8", tipo: "perfuracao", critX: 3, alcance: "4,5m" }),
			arma("Mordida", "icons/svg/pawprint.svg", { dano: "1d10+8", tipo: "perfuracao" }),
			poder("Emantar", `${MG}/manto-de-sombras.webp`, p("<b>Padrão.</b> Joga-se sobre uma criatura adjacente Enorme ou menor e usa agarrar (teste +22). Agarrada, a vítima fica <b>cega</b>, sofre metade de todo dano que o mantor sofrer e, no início de cada turno do mantor, <b>2d10+8 de perfuração</b>. Uma vítima por vez; sem mordida enquanto isso."),
				{ exec: "standard", rolls: [["Emantado", [["2d10+8", "perfuracao"]]]], effects: [cond("Cego")] }),
			poder("Imobilidade", "icons/svg/statue.svg", p("Imóvel, é preciso Percepção CD 35 para notar que é uma criatura, e não um pedaço de tecido."), { exec: "passive" }),
			poder("Manto de Tenebra", `${MG}/escuridao.webp`, p("Em escuridão total, tem camuflagem total, mesmo contra quem vê no escuro."), { exec: "passive" })
		]
	});
	await atores.mantor.update({ "system.attributes.movement.fly.base": 18 });

	const tigreItens = (forte) => [
		arma("Garra", "icons/svg/pawprint.svg", { dano: forte ? "2d8+12" : "1d8+3", tipo: "corte", desc: p("Duas garras, 1d3 mordidas (uma por cabeça) e 1d4+1 tentáculos por ação agredir.") }),
		arma("Mordida", "icons/svg/pawprint.svg", { dano: forte ? "2d6+12" : "1d6+3", tipo: "perfuracao" }),
		arma("Tentáculo", "icons/svg/net.svg", { dano: forte ? "2d6+12" : "1d6+3", tipo: "impacto" }),
		poder("Borrão", `${MG}/imagem-espelhada.webp`, p("<b>25%</b> de chance de ignorar ataques e efeitos (inclusive de área) contra ele, mesmo depois de morto. Role na macro <i>Criaturas</i>."), { exec: "passive" }),
		poder("Entre Planos", `${MG}/salto-dimensional.webp`, p("<b>Movimento.</b> Até o próximo turno, a chance do Borrão sobe para <b>50%</b>."), { exec: "move" }),
		poder("Profusão de Partes", "icons/svg/pawprint.svg", p("Cada tigre tem <b>1d3 cabeças</b> e <b>1d4+1 tentáculos</b>: um ataque de mordida por cabeça e um de tentáculo por tentáculo."), { exec: "passive", rolls: [["Cabeças", [["1d3", ""]]], ["Tentáculos", [["1d4+1", ""]]]] }),
		...(forte ? [
			poder("Não Está Mais Aqui!", `${MG}/teletransporte.webp`, p("<b>Padrão, uma vez por cena.</b> Teleporta-se para qualquer lugar conhecido a até 500m."), { exec: "standard" }),
			poder("Sopro", `${MG}/sussurros-insanos.webp`, p("<b>Padrão.</b> Energia caótica num cone de 6m: <b>6d8 de dano psíquico</b> e confuso por 1d3 rodadas (Von CD 31 reduz à metade e evita a condição). Recarga: no início de cada rodada, role um dado; par recarrega."),
				{ exec: "standard", area: "Cone de 6m", save: "Vontade CD 31 reduz à metade e evita confuso", rolls: [["Sopro", [["6d8", "psiquico"]]]], effects: [cond("Confuso")] })
		] : [])
	];
	const TIGRE_BIO = "Ameaças de Arton, p. 206. Felinos de Hyninn que \"não estão bem aqui\": cabeças e tentáculos demais, contornos borrados. Matam sem deixar pista. Na tabela de reações, ignoram conversa (fogem) e qualquer resultado que descreva reações visíveis em detalhes. Resistência a devotos de Khalmyr +5 (efeito na janela de rolagem).";
	atores.tigre = await criarNPC({
		name: "Tigre-de-Hyninn",
		role: "tigre",
		img: ICO.tigre,
		nd: 5,
		cd: 20,
		tipo: "mon",
		papel: "solo",
		tamanho: "gra",
		tokenSize: 2,
		atr: { for: 3, des: 4, con: 2, int: -1, sab: 1, car: -1 },
		pv: 165,
		def: 25,
		walk: 12,
		sentidos: ["escuro", "faro"],
		pericias: { inic: 10, perc: 7, fort: 8, refl: 20, vont: 5, furt: 16, luta: 17 },
		ic: ["confuso", "metamorfose"],
		resTxt: "Imunidade a confuso e metamorfose, resistência a devotos de Khalmyr +5.",
		ataquesTxt: "Duas garras +17 (1d8+3), 1d3 mordidas +17 (1d6+3) e 1d4+1 tentáculos +17 (1d6+3).",
		tesouro: "Resíduos (CD 20 para extrair, valem T$ 150 para poções e pergaminhos de ilusão).",
		bio: p(TIGRE_BIO),
		effects: [aoUsar("Contra devoto de Khalmyr (+5)", `${MG}/protecao-divina.webp`, [["roll", 5]], ["skill"], ["Fortitude", "Reflexos", "Vontade"])],
		items: tigreItens(false)
	});
	atores.primordial = await criarNPC({
		name: "Tigre-de-Hyninn Primordial",
		role: "primordial",
		img: ICO.tigre,
		nd: 11,
		cd: 31,
		tipo: "mon",
		papel: "solo",
		tamanho: "gra",
		tokenSize: 2,
		atr: { for: 4, des: 6, con: 3, int: -1, sab: 1, car: -1 },
		pv: 480,
		def: 42,
		walk: 12,
		sentidos: ["escuro", "faro"],
		pericias: { inic: 17, perc: 12, fort: 14, refl: 29, vont: 10, furt: 25, luta: 34 },
		ic: ["confuso", "metamorfose"],
		resTxt: "Imunidade a confuso e metamorfose, resistência a devotos de Khalmyr +5.",
		ataquesTxt: "Duas garras +34 (2d8+12), 1d3 mordidas +34 (2d6+12) e 1d4+1 tentáculos +34 (2d6+12).",
		tesouro: "Resíduos (CD 26 para extrair, valem T$ 300 para poções e pergaminhos de ilusão).",
		bio: p(TIGRE_BIO),
		effects: [aoUsar("Contra devoto de Khalmyr (+5)", `${MG}/protecao-divina.webp`, [["roll", 5]], ["skill"], ["Fortitude", "Reflexos", "Vontade"])],
		items: tigreItens(true)
	});

	atores.rarvnaak = await criarNPC({
		name: "Rarvnaak",
		tokenName: "Caçador Invisível",
		role: "rarvnaak",
		link: true,
		img: ICO.rarvnaak,
		nd: 7,
		cd: 24,
		tipo: "esp",
		raca: "elemental do ar",
		papel: "solo",
		atr: { for: 1, des: 7, con: 4, int: 0, sab: -1, car: -2 },
		pv: 280,
		def: 29,
		walk: 0,
		sentidos: ["escuro"],
		pericias: { inic: 14, perc: 10, fort: 12, refl: 21, vont: 5, furt: 29, luta: 20 },
		ic: ["atordoado", "caido", "cansaco", "metabolismo", "paralisado"],
		res: { eletricidade: { imunidade: true }, acido: { vulnerabilidade: true } },
		resTxt: "Imunidade a acertos críticos, atordoado, caído, cansaço, efeitos de metabolismo, eletricidade e paralisia, vulnerabilidade a ácido. Só é afetado por armas e efeitos mágicos.",
		ataquesTxt: "Dois socos pneumáticos +20 (1d8+16 impacto, x3).",
		tesouro: "1d4 doses de éter elemental (eletricidade) (CD 22 para extrair).",
		bio: p("Ameaças de Arton, p. 92. O caçador invisível da Sala 9 de Tanna-Toh (a Ligação). Normalmente é conjurado para matar um alvo; este só espera alguém aparecer. Quando o grupo entra, sorteie quem é a presa (macro <i>Criaturas</i>)."),
		effects: [chave("Invisibilidade Natural", `${MG}/invisibilidade.webp`, [], true, "Sempre invisível: camuflagem total; quem não pode percebê-lo fica desprevenido.")],
		items: [
			arma("Soco Pneumático", "icons/svg/wing.svg", { dano: "1d8+16", tipo: "impacto", critX: 3, desc: p("Dois socos por ação agredir."), effects: [furtivo("4d6"), aoUsar("Caçada Implacável (+5)", "icons/svg/target.svg", [["ataque", "5"], ["dano", "5"]], ["attack"])] }),
			poder("Ataque Furtivo", FURTIVO_IMG, p("+4d6 contra alvos desprevenidos ou flanqueados (todos que não o percebem)."), { exec: "passive" }),
			poder("Caçada Implacável", "icons/svg/target.svg", p("<b>Padrão.</b> Marca um alvo conhecido: <b>+5 em ataque e dano</b> contra ele e, no mesmo Plano, sabe distância e direção. Um alvo por vez."), { exec: "standard" }),
			poder("Corpo Eólico", "icons/svg/wing.svg", p("Atravessa qualquer fresta por onde o ar passaria e só pode ser afetado por armas e efeitos mágicos."), { exec: "passive" }),
			poder("Invisibilidade Natural", `${MG}/invisibilidade.webp`, p("Sempre invisível: camuflagem total e +10 em Furtividade (já contado); quem não pode percebê-lo fica desprevenido."), { exec: "passive" })
		]
	});
	await atores.rarvnaak.update({ "system.attributes.movement.fly.base": 12 });

	atores.bulette = await criarNPC({
		name: "Bulette",
		role: "bulette",
		img: ICO.bulette,
		nd: 7,
		cd: 25,
		tipo: "mon",
		papel: "solo",
		tamanho: "gra",
		tokenSize: 2,
		atr: { for: 8, des: 2, con: 5, int: -4, sab: 1, car: -3 },
		pv: 310,
		def: 32,
		walk: 9,
		sentidos: ["cegas"],
		pericias: { inic: 9, perc: 8, fort: 20, refl: 9, vont: 12, luta: 23 },
		res: { dano: { base: 5 }, acido: { base: 10 }, fogo: { base: 10 } },
		resTxt: "Redução de dano 5/adamante, redução de ácido e fogo 10.",
		ataquesTxt: "Mordida +23 (3d8+24 mais 4d6 ácido).",
		tesouro: "Duas peças de couro de bulette (CD 22 para extrair).",
		bio: p("Ameaças de Arton, p. 102. O tubarão terrestre: liquefaz a rocha que toca a carapaça e \"nada\" na terra. Os bulettes da masmorra de Azgher cavaram túneis entre as Salas 5, 6 e 9. Não rolam reação: atacam sempre. Perdendo, fogem pelos túneis.",
			"Escavação 12m; Percepção CD 40 para ouvi-lo enquanto nada no solo. A RD 5/adamante está como RD geral 5."),
		items: [
			arma("Mordida", "icons/svg/pawprint.svg", { dano: "3d8+24", tipo: "perfuracao", extra: [["4d6", "acido"]] }),
			poder("Agarrar Aprimorado", "icons/svg/net.svg", p("<b>Livre.</b> Ao acertar a mordida, pode agarrar (teste +25)."), { exec: "free" }),
			poder("Aura Cáustica", "icons/svg/acid.svg", p("No início de cada turno do bulette, criaturas adjacentes sofrem <b>4d6 de ácido</b>."), { exec: "passive", rolls: [["Aura", [["4d6", "acido"]]]] }),
			poder("Engolir", "icons/svg/pawprint.svg", p("<b>Padrão.</b> Engole uma criatura agarrada. No início de cada turno do bulette, ela sofre <b>2d8+12 de impacto e 4d6 de ácido</b>. Escapa causando 20 de dano a ele (Defesa 10, RD 0)."), { exec: "standard", rolls: [["Engolido", [["2d8+12", "impacto"], ["4d6", "acido"]]]] }),
			poder("Espreitador das Dunas", "icons/svg/cave.svg", p("Nadando no solo, a CD de Percepção para ouvi-lo é 40, ou +20 na Furtividade dele, o que for maior."), { exec: "passive" })
		]
	});
	await atores.bulette.update({ "system.attributes.movement.burrow.base": 12 }).catch(() => null);

	atores.mumia = await criarNPC({
		name: "Múmia Real Sar-Allan",
		role: "mumia",
		img: ICO.mumia,
		nd: 5,
		cd: 20,
		tipo: "mor",
		papel: "solo",
		atr: { for: 3, des: 1, con: 2, int: 0, sab: 3, car: 2 },
		pv: 192,
		def: 22,
		walk: 6,
		sentidos: ["escuro"],
		pericias: { inic: 3, perc: 8, fort: 11, refl: 5, vont: 17, furt: 10, luta: 17 },
		res: { dano: { base: 5 }, fogo: { vulnerabilidade: true } },
		resTxt: "Redução de dano 5, vulnerabilidade a fogo.",
		ataquesTxt: "Duas pancadas +17 (2d10+10 mais doença).",
		tesouro: "Padrão.",
		bio: p("Ameaças de Arton, p. 236. Reis e rainhas do Deserto da Perdição no Cemitério de Reis (Sala 10 de Azgher). Erguem-se quando o grupo entra e atacam sem diálogo; os gemidos são um ruído estrondoso que atrai monstros para a Sala 8. Não perseguem quem sai sem atacá-las. Só param quando alguém recita a linhagem dos reis sar-allan."),
		items: [
			arma("Pancada", "icons/svg/skull.svg", { dano: "2d10+10", tipo: "impacto", desc: p("Duas pancadas por ação agredir. Expõe à podridão da múmia.") }),
			poder("Desespero", `${MG}/amedrontar.webp`, p("Quem começa o turno vendo uma múmia fica <b>apavorado</b> (Von CD 20 evita e fica imune por esta cena)."), { exec: "passive", save: "Vontade CD 20 evita", effects: [cond("Apavorado")] }),
			poder("Doença", "icons/svg/poison.svg", p("Quem é atingido pela pancada é exposto à <b>podridão da múmia</b>."), { exec: "passive", effects: [cond("Doente")] })
		]
	});

	atores.senhor = await criarNPC({
		name: "Rei Sar-Allan (Senhor das Múmias)",
		tokenName: "Rei Sar-Allan",
		role: "senhor",
		link: true,
		img: ICO.senhor,
		nd: 15,
		cd: 42,
		tipo: "mor",
		papel: "solo",
		atr: { for: 4, des: 2, con: 3, int: 2, sab: 5, car: 7 },
		pv: 532,
		pm: 95,
		def: 48,
		walk: 9,
		sentidos: ["escuro"],
		pericias: { inic: 14, perc: 20, fort: 22, refl: 15, vont: 28, dipl: 22, enga: 20, furt: 15, intu: 18, luta: 41, reli: 22 },
		res: { dano: { base: 10 } },
		resTxt: "Redução de dano 10, resistência a efeitos divinos +5.",
		ataquesTxt: "Ankh solar +41 (1d6+25, 19) e pancada +41 (3d10+25 mais doença).",
		equipTxt: "Ankh solar harmonizado, símbolo sagrado, traje de seda banhado a ouro.",
		tesouro: "Padrão.",
		conjuracao: "sab",
		bio: p("Ameaças de Arton, p. 236. O monarca de maior prestígio do Cemitério de Reis. Ao se erguer, só fala num lamento: <i>\"Quem sou eu? De onde venho? A quem pertenço?\"</i>",
			"Os heróis não têm chance contra as múmias neste nível. A saída é recitar a linhagem dos reis sar-allan, do livro <i>História e Genealogia dos Nobres de Halak-Tûr</i> (Biblioteca Proibida de Tanna-Toh). Com a resposta, todas voltam ao repouso e o rei fecha o sarcófago por dentro."),
		effects: [aoUsar("Resistência a efeitos divinos (+5)", `${MG}/protecao-divina.webp`, [["roll", 5]], ["skill"], ["Fortitude", "Reflexos", "Vontade"])],
		items: [
			arma("Ankh Solar", `${MG}/raio-solar.webp`, { dano: "1d6+25", tipo: "impacto", critM: 19 }),
			arma("Pancada", "icons/svg/skull.svg", { dano: "3d10+25", tipo: "impacto", desc: p("Expõe à podridão da múmia (CD 42).") }),
			poder("Desespero Superior", `${MG}/amedrontar.webp`, p("Quem começa o turno vendo uma múmia fica <b>apavorado</b> (Von CD 42 evita e fica imune por esta cena)."), { exec: "passive", save: "Vontade CD 42 evita", effects: [cond("Apavorado")] }),
			poder("Maldição da Múmia", "icons/svg/skull.svg", p("Quem falha num teste de resistência contra uma magia dele não pode recuperar PV por 1 rodada."), { exec: "passive" }),
			magia("Disfarce Ilusório", `${MG}/disfarce-ilusorio.webp`, p("<b>Padrão, 3 PM.</b> Muda a própria aparência até o fim da cena; +20 em Enganação para disfarce (Von desacredita)."), { exec: "standard", custo: 3, circulo: 1, escola: "ilu" }),
			magia("Enxame de Pestes", `${MG}/enxame-de-pestes.webp`, p("<b>Completa, 15 PM, sustentada.</b> Dois enxames de gafanhotos de fogo em alcance médio (1,5m cada). No fim de cada turno dele, <b>5d12 de fogo</b> em quem estiver no espaço de um enxame (Ref reduz à metade). Movimento: move cada enxame 12m."),
				{ exec: "full", custo: 15, circulo: 4, escola: "con", alcance: "medium", save: "Reflexos reduz à metade", rolls: [["Enxame", [["5d12", "fogo"]]]] }),
			magia("Infligir Ferimentos", `${MG}/infligir-ferimentos.webp`, p("<b>Padrão, 10 PM.</b> Ataque corpo a corpo como parte da magia: se acertar, +<b>5d8+5 de trevas</b> e o alvo fica fraco até o fim da cena."), { exec: "standard", custo: 10, circulo: 3, escola: "nec", rolls: [["Trevas", [["5d8+5", "trevas"]]]], effects: [cond("Fraco")] }),
			magia("Perdição", `${MG}/perdicao.webp`, p("<b>Padrão, 7 PM.</b> Criaturas escolhidas em alcance curto sofrem <b>–4 em ataque e dano</b> até o fim da cena."),
				{ exec: "standard", custo: 7, circulo: 2, escola: "enc", alcance: "short", effects: [fx("Perdição (–4 ataque e dano)", `${MG}/perdicao.webp`, [["system.modificadores.ataque.geral", "-4"], ["system.modificadores.dano.geral", "-4"]])] }),
			magia("Poeira da Podridão", `${MG}/poeira-da-podridao.webp`, p("<b>Padrão, 14 PM.</b> Nuvem de 6m de raio em alcance médio: ao lançar e no início dos turnos das vítimas até o fim da cena, <b>6d8+24 de trevas</b> e sem recuperar PV por uma rodada (Fort reduz à metade e evita a restrição)."),
				{ exec: "standard", custo: 14, circulo: 4, escola: "nec", alcance: "medium", area: "Nuvem de 6m de raio", save: "Fortitude reduz à metade", rolls: [["Poeira", [["6d8+24", "trevas"]]]] })
		]
	});

	/* ------------------------------------------------------------------ */
	/* 3. Itens                                                             */
	/* ------------------------------------------------------------------ */
	const item = (name, img, desc, role, extra = {}) => ({
		name, type: "tesouro", img, folder: pasta.Item, flags: FLAGS(role),
		system: { description: { value: desc }, qtd: 1, preco: 0, peso: 0, espacos: extra.espacos ?? 1 }
	});
	const ESPADA_DESC = p("Metal superdenso desconhecido em Arton, de fio monofilamento: forjada em hidrogênio metálico, <b>ignora todo tipo de redução de dano</b>. Pesada demais para humanos comuns: só personagens com <b>Força 10 ou mais</b> podem usá-la. Virtualmente indestrutível; conta como artefato para efeitos que destroem ou alteram objetos.",
		"O metaliano invoca a espada de qualquer lugar do mesmo Plano com uma ação de movimento, e quase sempre prefere destruí-la (Detonação Final) a deixá-la com inimigos. Obter uma de modo pacífico deve exigir muita interpretação, rolagens excelentes e ótimas ideias (Arius precisou de três resultados acima de 50).",
		"Não é mágica, mas pode receber melhorias e encantos, só de um armeiro de patamar lendário, depois de meses ou anos de estudo. Nunca recebe materiais especiais nem melhorias que aumentem margem de ameaça ou multiplicador de crítico.",
		"<i>Mudanças galáticas:</i> a versão de Guerra Artoniana é mais fraca. Se preferir, use os números daqui nas mãos dos metalianos e a versão de Guerra Artoniana nas mãos de um jogador.");
	const espada = arma("Espada da Galáxia", ICO.espada, { dano: "4d12", tipo: "corte", critM: 17, desc: ESPADA_DESC });
	espada.folder = pasta.Item;
	espada.flags = FLAGS("espada");
	espada.system.proficiencia = "marcial";
	espada.system.rolls[0].parts[1] = ["luta", "for", ""];

	const CHAVE_DESC = (n, onde) => p(`Uma das três chaves que abrem a porta dupla de metal do subnível de Hyninn, cercada de cristais, que leva ao covil de Chama Funesta. Marcada com o número <b>${n}</b>. Encontrada em: ${onde}.`, "É impossível abrir a porta por qualquer meio físico ou mágico sem as três chaves.");
	const [itEspada, chave1, chave2, chave3, itLivro, itCabra, itCarregador, itBesta] = await Item.createDocuments([
		espada,
		item("Chave Tríplice 1", ICO.chave, CHAVE_DESC(1, "a caverna atrás da Sala 19 de Hyninn (Tesouro Infinito)"), "chave1", { espacos: 0 }),
		item("Chave Tríplice 2", ICO.chave, CHAVE_DESC(2, "atrás de uma das mesas de estudo da Biblioteca Proibida (Sala 11 de Tanna-Toh)"), "chave2", { espacos: 0 }),
		item("Chave Tríplice 3", ICO.chave, CHAVE_DESC(3, "no tesouro do Cemitério de Reis (Sala 10 de Azgher)"), "chave3", { espacos: 0 }),
		item("História e Genealogia dos Nobres de Halak-Tûr", ICO.livro, p("A genealogia das famílias reais dos sar-allan do Deserto da Perdição, no tesouro da Biblioteca Proibida (Tanna-Toh). Recitar a linhagem responde ao lamento do rei mumificado (\"Quem sou eu? De onde venho? A quem pertenço?\") e faz as múmias do Cemitério de Reis voltarem ao repouso. Pista do Enxadrista: \"da outra, uma dinastia\"."), "livro"),
		item("Armadilha da Cabra-Cega", ICO.cabraCega, p("Mecanismo da Sala 14 de Hyninn, como um brinquedo de corda ou uma mina: aura que deixa <b>cegas e surdas</b> todas as criaturas em alcance curto (Fort CD 30 anula), mesmo imunes, e não pode ser dissipada. Interage com a masmorra: afeta também os habitantes.",
			"Para levar: Força CD 15 (arrancar do piso) ou Ladinagem CD 25 (abrir as trancas). Magias à distância funcionam se exercerem força ou manipulação fina. É a única coisa que anula a visão dos bibliotecários (eles resistem só com 13 ou mais no d20). Os personagens podem aprimorá-la para aumentar a CD, com boas ideias e perícias. Pista do Enxadrista: \"para a masmorra letrada, levem uma armadilha\"."), "cabraCega", { espacos: 2 }),
		poder("Carregador", ICO.parceiro, p("Alguém forte e corajoso que carrega o equipamento. <b>Iniciante:</b> 2 espaços e usa qualquer item que carrega e não exija teste (empunhar uma tocha, aplicar um bálsamo). <b>Veterano:</b> 5 espaços. <b>Mestre:</b> 10 espaços.",
			"Contratado por toda a exploração: T$ 90 (iniciante), T$ 450 (veterano) ou T$ 900 (mestre). Coadjuvantes que já apareceram, ou criados pelos jogadores com nome e personalidade, custam metade (T$ 45, 225 e 450). Na mesa original, a regra fez Rex criar Rataro.",
			"Decida se os carregadores são vulneráveis em combates e armadilhas. Na mesa original eram efetivamente imortais."), { tipo: "geral", subtipo: "Parceiros", exec: "passive" }),
		poder("Besta de Carga", ICO.besta, p("Um boi, burro ou mula. <b>Iniciante:</b> 10 espaços. <b>Veterano:</b> 15. <b>Mestre:</b> 20. Aumenta automaticamente o ruído do grupo em <b>uma categoria</b>.",
			"Mesmo preço do carregador: T$ 90, 450 ou 900 pela exploração inteira (metade para animais com nome e personalidade)."), { tipo: "geral", subtipo: "Parceiros", exec: "passive" })
	].map((d) => ({ ...d, folder: pasta.Item })));
	await itCarregador.setFlag("world", "fdtRole", "carregador");
	await itBesta.setFlag("world", "fdtRole", "besta");

	/* ------------------------------------------------------------------ */
	/* 4. Dados (fonte única para tabelas, macros e diário)                 */
	/* ------------------------------------------------------------------ */
	const NOMES = {
		soldado: "mirminoide soldado", trilha: "trilha mirminoide", mantor: "mantor", aurumvorax: "aurumvorax", metaliano: "metaliano",
		tigre: "tigre-de-Hyninn", primordial: "tigre-de-Hyninn primordial", bulette: "bulette", mimico: "mímico", duplo: "duplo",
		anonimo: "anônimo", bibliotecario: "bibliotecário", rarvnaak: "rarvnaak", mumia: "múmia", senhor: "senhor das múmias", dragao: "Chama Funesta"
	};
	// bestial: ignora conversa (resultados de diálogo ou colaboração viram fuga); ataca: não rola reação;
	// naoVerbal: usa a tabela, mas o grupo precisa decifrar a linguagem não verbal.
	const MODOS = {
		aurumvorax: "bestial", mantor: "bestial", tigre: "bestial", primordial: "bestial", bulette: "ataca",
		soldado: "naoVerbal", trilha: "naoVerbal", metaliano: "naoVerbal",
		mimico: "ataca", anonimo: "ataca", bibliotecario: "ataca", mumia: "ataca", senhor: "ataca", dragao: "ataca"
	};
	const ENCONTROS = [
		[-10, 4, "Nada.", []],
		[5, 7, "1d6 mirminoides soldados.", [["soldado", "1d6"]]],
		[8, 9, "Mantor.", [["mantor", "1"]]],
		[10, 11, "1d3 aurumvorax.", [["aurumvorax", "1d3"]]],
		[12, 14, "1d6 mirminoides soldados e uma trilha mirminoide.", [["soldado", "1d6"], ["trilha", "1"]]],
		[15, 16, "Metaliano.", [["metaliano", "1"]]],
		[17, 18, "1d4 tigres-de-Hyninn.", [["tigre", "1d4"]]],
		[19, 19, "1d4 aurumvorax e 1d6 mirminoides.", [["aurumvorax", "1d4"], ["soldado", "1d6"]]],
		[20, 20, "2 tigres-de-Hyninn e um tigre-de-Hyninn primordial.", [["tigre", "2"], ["primordial", "1"]]],
		[21, 21, "1d6 mirminoides soldados, mantor e tigre-de-Hyninn primordial.", [["soldado", "1d6"], ["mantor", "1"], ["primordial", "1"]]],
		[22, 22, "Metaliano.", [["metaliano", "1"]]],
		[23, 23, "1d6 mirminoides soldados, 2 trilhas mirminoides e 1d3 aurumvorax.", [["soldado", "1d6"], ["trilha", "2"], ["aurumvorax", "1d3"]]],
		[24, 99, "Metaliano e 2 tigres-de-Hyninn primordiais.", [["metaliano", "1"], ["primordial", "2"]]]
	];
	const REACOES = [
		[-99, 0, "Ataca instantaneamente, lutando até a morte."],
		[1, 2, "Ataca, mas foge se estiver perdendo."],
		[3, 4, "Ataca se houver algo a ganhar (como tesouro). Foge se estiver perdendo."],
		[5, 5, "Ameaça. O grupo tem uma rodada para reagir (preparar-se ou tentar acabar com as hostilidades)."],
		[6, 6, "Ameaça de longe. O grupo tem 2 rodadas para reagir."],
		[7, 7, "Evita o grupo. É visto de longe, mas não faz nada."],
		[8, 8, "Mostra-se receoso, mas não hostil. Sente-se ameaçado, mas pode colaborar se for abordado."],
		[9, 9, "Mostra-se não hostil. Não se sente ameaçado e pode arranjar colaboração com sua facção se for abordado."],
		[10, 10, "Pede ajuda contra outras facções. Com boa interação, pode arranjar colaboração com sua facção."],
		[11, 99, "Oferece ajuda contra outras facções."]
	];
	const RUIDOS = [
		["silencioso", "Silencioso (–1): metade do deslocamento e Furtividade CD 20 de todos", -1],
		["padrao", "Padrão (+0): conversa baixa, passos normais", 0],
		["barulhento", "Barulhento (+2): falar alto, Música, arrombar na força", 2],
		["estrondoso", "Estrondoso (+5): várias habilidades barulhentas, Bola de Fogo numa porta", 5]
	];
	const PISTAS = [
		"\"No centro deste labirinto, há uma escadaria. Se quisesse ficar dormindo, é para lá que eu iria!\"",
		"\"Atrás de uma porta fechada há um buraco gritante. Se seguirem a trilha escavada, acharão tesouro abundante!\"",
		"\"Não importa a lombada, nem toda história é lida. Às vezes, com uma dentada, dos livros viramos comida!\"",
		"\"Invisíveis na masmorra andam caça e caçador. Não enfrente, apenas corra! Um é medo e outro é horror.\"",
		"\"Amarelo leva ao sol e o roxo, à sabedoria. De um, precisam de um bicho e da outra, uma dinastia.\"",
		"\"Três masmorras têm riquezas. Para alguns, já é o fim. Mas a última proeza é vencer o carmesim.\"",
		"\"Na masmorra estão amigos, um falso e um de verdade. Esqueçam os seus umbigos e não façam caridade!\"",
		"\"Não tenho mais a contar, isso é tudo que posso dizer! Se quiserem ainda jogar, será por puro prazer!\"",
		"\"Admito, era cilada. Há mais uma dica da trilha. Para a masmorra letrada, levem uma armadilha.\""
	];
	const PISTA_SEM_RESGATE = "\"Na masmorra, não há amigos, só tramoias e maldade. Esqueçam os seus umbigos e não façam caridade!\"";
	const SIGNIFICADO_PISTAS = [
		"A escadaria da Sala 15 de Hyninn leva ao subnível, o lugar mais seguro para descansar (e à porta do covil).",
		"A Sala 7 (passagem-truque): o túnel não tem armadilha e leva ao tesouro da Sala 16.",
		"O mímico da estante (Sala 3).",
		"O rarvnaak (caçador invisível) e o metaliano.",
		"Os círculos: amarelo leva a Azgher, roxo a Tanna-Toh. Azgher precisa de um bicho (o aurumvorax para o Tesouro Infinito); Tanna-Toh, de uma dinastia (o livro da genealogia para as múmias).",
		"As três masmorras guardam riquezas, mas o objetivo final é o dragão vermelho.",
		"O duplo (o amigo falso) e quem o grupo veio resgatar (o de verdade).",
		"Acabaram as pistas.",
		"Levar a armadilha da cabra-cega (Sala 14) para a Biblioteca Proibida."
	];
	const VERDADEIRAS = [
		"No início de tudo, havia o Nada e o Vazio.",
		"A vida em Arton surgiu a partir de uma lágrima de Lena.",
		"Megalokk corrompeu as criações de Allihanna para dar origem aos primeiros monstros.",
		"Dragões nunca formaram sociedades ou civilizações.",
		"As fadas foram criadas a partir de um sonho de Wynna, após ouvir os sussurros de Nimb.",
		"A palavra escrita foi uma dádiva de Tanna-Toh.",
		"Os elfos chegaram a Arton vindos do Reino de Glórienn.",
		"Os Rubis da Virtude foram criados como sugestão de Nimb, cada um contendo o poder de um dos deuses maiores do Panteão.",
		"A cidade-fortaleza de Khalifor foi batizada em homenagem a Khalil, que comandou uma expedição ao norte.",
		"A caravana dos exilados de Lamnor foi guiada por Roramar Pruss, que teve visões proféticas ainda na infância.",
		"O Rei-Imperador Thormy foi aventureiro em sua juventude.",
		"O Dragão da Tormenta só foi derrotado pela união de arquimagos e do próprio Dragão-Rei Sckhar.",
		"A Rainha-Imperatriz Shivara ficou anos desaparecida durante a Guerra Artoniana.",
		"Kallyadranoch exige que seus devotos paguem tributo em ouro ou sacrifícios.",
		"Dahllan são capazes de se comunicar com animais."
	];
	const FALSAS = [
		"Elfos e anões se enfrentaram na Guerra da Flecha e do Machado.",
		"A primeira civilização humana de Arton foi o Império Manzirr, mais tarde desfeito em vários reinos durante a Grande Batalha.",
		"Os elfos foram criados por Glórienn como um aperfeiçoamento das fadas de Wynna.",
		"Os hynne foram criados quando Hyninn roubou um pedaço da essência dos humanos (por isso são tão pequenos).",
		"O caçador de recompensas Crânio Negro roubou a espada Rhumnam dos anões de Doherimm.",
		"A Marcha de Arsenal foi detida quando aventureiros se infiltraram em seu Kishinauros ainda em movimento e surpreenderam o vilão.",
		"Sszzaas tramou para assassinar Khalmyr através dos Rubis da Virtude.",
		"Os puristas se revelaram depois que Shivara foi raptada pelos finntroll.",
		"As sereias são capazes de se comunicar com animais aquáticos.",
		"A rivalidade entre Vectorius e Talude começou quando Vectorius foi expulso da Academia Arcana.",
		"A cidade fora da lei de Smokestone fica em algum lugar de Namalkah.",
		"Thwor Khoshkothruk nasceu durante uma noite que durou um dia inteiro.",
		"Quando um deus maior cai ou morre, o restante do Panteão se reúne para decidir quem ocupará o lugar vago, já que sempre deve haver vinte.",
		"A Caravana dos Exilados de Lamnor se perdeu durante anos após a traição do alto clérigo de Ghondriann.",
		"O Rio dos Deuses recebe este nome porque representava a fronteira quando o continente foi dividido entre Khalmyr e Nimb, numa disputa ancestral.",
		"Sir Orion Drake descobriu que apenas o poder da fé artoniana era capaz de derrotar a Tormenta.",
		"O reino de Salistick foi amaldiçoado pelos deuses quando seu primeiro regente se recusou a construir um templo ao Panteão.",
		"Quando a Tormenta recaiu sobre Arton pela primeira vez, a estátua de Valkaria chorou lágrimas de sangue.",
		"O arquimago Reynard foi o primeiro a travar contato com os Lordes da Tormenta.",
		"Antes de ser Rainha-Imperatriz, Shivara foi monarca de Trebuck e Bielefeld."
	];
	// Ordem fixa em que os cadernos aparecem na prensa (embaralhada uma vez, igual em todo mundo).
	const ORDEM_PRENSA = ["V9", "V12", "V5", "F5", "F16", "F7", "F14", "F1", "F11", "F9", "V14", "V10", "V11", "F12", "V8", "F4", "F15", "V6", "F10", "V0", "F18", "V13", "F3", "V2", "F17", "F13", "F6", "V3", "F8", "V4", "F19", "F0", "F2", "V1", "V7"];
	const CADERNOS = ORDEM_PRENSA.map((c, i) => ({ n: i + 1, verdade: c[0] === "V", texto: (c[0] === "V" ? VERDADEIRAS : FALSAS)[Number(c.slice(1))] }));
	const PECADOS = [
		["agradecer", "Não agradecer ao sol", 1], ["doar", "Não doar ouro", 1], ["rosto", "Mostrar o rosto", 1],
		["roubar", "Roubar ouro", 2], ["esconder", "Esconder a verdade", 2], ["mentir", "Mentir/enganar", 2], ["ladroes", "Ajudar ladrões e trapaceiros", 2],
		["inclemente", "Ser inclemente", 3], ["mal", "Praticar o mal/combater o bem", 3], ["tenebra", "Cultuar Tenebra", 3]
	];
	const ENTRADAS = {
		hyninn: {
			nome: "Entrada de Hyninn",
			chegada: "Área de Entrada A (Sala 1 de Hyninn)",
			texto: "Uma rachadura na estátua leva a um túnel e a uma antessala quadrada e exígua, totalmente escura, com uma porta de ferro e pedra e duas estátuas esguias. Uma delas diz: <i>\"Fomos colocados aqui por todos os deuses do Panteão. Nossa missão é guardar o Labirinto Liberto. Somos opostos, pois um de nós sempre fala a verdade. Vocês podem fazer apenas uma pergunta para cada um de nós. Se apontarem aquele que sempre fala a verdade, poderão passar.\"</i>",
			dica: "As feições das estátuas são alongadas: focinhos de raposa.",
			solucao: "Tudo que a estátua disse é mentira: foram esculpidas por devotos de Hyninn, não são opostas, nenhuma fala a verdade, dá para perguntar quanto quiser e apontar a \"verdadeira\" não abre nada. A solução é contrariar as regras e <b>arrombar a porta</b> (porta de ferro: Defesa 8, RD 10, 100 PV, Ladinagem CD 30). Grupos respeitosos e solenes, que nunca desafiam as estátuas, não passam."
		},
		tanna: {
			nome: "Entrada de Tanna-Toh",
			chegada: "Área de Entrada B (Sala 1 de Tanna-Toh)",
			texto: "A porta de uma casa num beco vira um túnel de quilômetros até uma câmara quadrada com paredes, chão e teto cobertos de escritos antigos (Conhecimento CD 30 ou Compreensão: língua antiga de Lamnor, a história da Rainha Barda que trouxe a escrita). No centro, uma enorme corneta de bronze, muda. Em valkar, no meio das palavras: <b>SOME GRANDE FOGO / RECUSE SEUS PRIMEIROS</b>.",
			dica: "Os escritos cobrem todas as superfícies: é um lugar do conhecimento. Religião percebe que \"some grande fogo\" não tem significado religioso.",
			solucao: "É um anagrama, e nenhum meio mágico o resolve: <b>CONFESSEM UM SEGREDO E IRÃO PROSSEGUIR</b>. Cada personagem fala um segredo sobre si em voz alta dentro da corneta; quando todos falarem, uma parede se abre. Se o grupo achar chato, permita um teste estendido; ou tente outra entrada."
		},
		azgher: {
			nome: "Entrada de Azgher",
			chegada: "Área de Entrada C (Sala 1 de Azgher)",
			texto: "Uma boca de lobo numa ruela escura vira uma passagem cada vez mais larga e clara. Em quase uma hora, um salão iluminado pelo ouro das decorações, hieróglifos e um sol imenso. Uma balança de ouro pende por causa de uma pedra escura e opaca; aos pés, uma bandeja de pepitas. A inscrição: <i>\"Nenhum mortal está livre do pecado aos olhos de Azgher. Cada um deve confessar um pecado único. Juntos, todos os pecados devem se equilibrar com toda a escuridão que existe em Arton.\"</i>",
			dica: "O que parece um símbolo de Khalmyr (a balança) é de Azgher: pecados contra as Obrigações & Restrições do Deus-Sol.",
			solucao: "Religião CD 20 revela o sentido e a lista de pecados (sem os pontos). Cada personagem confessa uma quebra das O&R de Azgher (mesmo sem ser devoto) e põe uma pepita. Cada pecado só pode ser confessado uma vez. Leve vale 1, médio 2, grave 3; a balança equilibra com <b>10 pontos</b>. Lado mais pesado: pedras escuras e opacas; mais leve: douradas; equilibrada: ambas cinzentas e reluzentes, e o sol se desfaz num mecanismo que revela a entrada."
		}
	};
	const ARMADILHAS = {
		abismo: { nome: "Abismo da Morte", nd: 8, onde: "Hyninn, Salas 5 e 6 (duas)", det: "Investigação/Ladinagem CD 30", efeito: "O chão se abre numa área de 6m de lado: queda de 30m (20d6) sobre estacas (2d8+10). Reflexos CD 30 evita. Atletismo CD 25 para escalar de volta. Sobrevivência CD 30 mostra que os mirminoides evitam certas áreas (–5 na CD de Reflexos). Ativar é um ruído barulhento." },
		porosa: { nome: "Armadilha de Pedra Porosa", nd: 6, onde: "Hyninn, Sala 8", det: "Percepção/Investigação CD 25 (a parede tem cor e textura diferentes)", efeito: "A parede quebradiça tem RD 5 e 70 PV (quebrar é ruído barulhento). Quem entra completamente faz Reflexos CD 25: passa, nota o desabamento e salta para fora; falha, fica preso no escuro. Ladinagem não abre; Percepção ou Investigação CD 25 (mais penalidades de escuridão) mostra que outra parede é da mesma pedra porosa. Quem a quebra cai direto na névoa da Sala 9 (Reflexos com –5)." },
		nevoa: { nome: "Névoa Transportadora", nd: 0, onde: "Hyninn, Salas 9 e 13", det: "Misticismo CD 40 revela que o espaço está parcialmente em outro Plano", efeito: "Quem entra faz Reflexos ou Vontade CD 25; falha leva da Sala 9 para a 13 (ou da 13 para a 9). Não dá para falhar de propósito. Cada personagem só é transportado uma vez, em qualquer das salas. O duplo tenta ficar com o lado mais fraco. Continue rolando encontros para os separados." },
		aceleracao: { nome: "Runa de Aceleração", nd: 1, onde: "Hyninn, Sala 12 (extremos noroeste e sudeste)", det: "Investigação/Ladinagem CD 20", efeito: "Uma criatura em alcance curto é arremessada 9m na direção em que se movia; batendo numa parede ou objeto sólido, sofre 1d6 de impacto por 1,5m percorrido. Fortitude CD 20 reduz a distância à metade. Na Sala 12, as duas runas empurram para o meio da sala: quem é empurrado não tem teste de Investigação para notar a Runa de Desintegração e a ativa automaticamente." },
		desintegracao: { nome: "Runa de Desintegração", nd: 10, onde: "Hyninn, Sala 12 (centro)", det: "Investigação/Ladinagem CD 30", efeito: "Uma criatura em alcance curto sofre 10d12 de essência; Fortitude CD 30 reduz para 2d12. Se os PV forem a 0 ou menos, qualquer que seja o teste, a criatura é desintegrada (só sobra pó)." },
		cabraCega: { nome: "Símbolo da Cegueira/Surdez (cabra-cega)", nd: 8, onde: "Hyninn, Sala 14", det: "Investigação/Ladinagem CD 30", efeito: "Ativada por proximidade (até voando): todas as criaturas em alcance curto ficam cegas e surdas até descansar 8 horas, mesmo as imunes; Fortitude CD 30 anula; não pode ser dissipada. Afeta os habitantes também (por isso nunca há encontro aqui). Ácido escorre por toda a sala: 1d4 na primeira rodada, 1d6, 1d8, 1d10, 1d12, 1d20 na sexta e mais 1d20 por rodada depois. Quem não foi afetado pode guiar os outros. Força CD 15 ou Ladinagem CD 25 para levar o mecanismo." },
		simboloMorte: { nome: "Símbolo da Morte", nd: 8, onde: "Azgher, Sala 2", det: "Investigação/Ladinagem CD 30", efeito: "O olho de Azgher no teto se acende quando o primeiro passa por baixo: criaturas em alcance curto ficam com –1 PV; Fortitude CD 30 reduz para 10d6 de trevas. Devotos de Azgher são imunes. Invisíveis, quem passa em Furtividade CD 30 e quem se passa por habitante não ativam. Desarmar exige equipamento de escalada e Acrobacia ou Atletismo para chegar ao teto." },
		simboloInsanidade: { nome: "Símbolo da Insanidade", nd: 6, onde: "Azgher, Sala 8", det: "Investigação/Ladinagem CD 30", efeito: "Criaturas em alcance curto ficam confusas permanentemente; Vontade CD 30 evita. Invisíveis e Furtividade CD 30 não ativam. Role um encontro aqui: os monstros errantes não ativam a armadilha." },
		servos: { nome: "Lamento dos Servos", nd: 0, onde: "Azgher, Sala 3", det: "—", efeito: "Vozes dos servos falam de traição, solidão e angústia. Vontade CD 25 a cada rodada na sala; falha perde 1d6 PM. Quem não ouve (surdo, Silêncio) não é afetado." },
		cemiterio: { nome: "Cemitério de Heróis", nd: 0, onde: "Azgher, Sala 7", det: "—", efeito: "Três sarcófagos: \"Aqui há tesouros que você talvez não queira possuir\". Cada jogador rola 1d20; o mais baixo aparece mumificado na primeira tumba aberta, depois o segundo e o terceiro (só quem pode morrer naturalmente). Quem se vê assiste a seu pior destino: Vontade CD 25 ou perde 1d8 PM. As múmias respondem perguntas, sempre a verdade." },
		fonte: { nome: "Fonte da Desidratação", nd: 0, onde: "Azgher, Sala 6", det: "—", efeito: "Beber até se saciar conta como um dia de rações (só direto da fonte). Mas na primeira vez a desidratação chega em 1d6 horas: só uma ração extra a anula (duas rações nesse dia). A cada gole a mais, falha automática contra fome e sede: fatigado, exausto, inconsciente; um gole a mais inconsciente mata. A água não pode ser purificada, e o efeito ruim vale guardada. Devotos de Azgher são imunes ao efeito ruim." }
	};
	const PERICIAS = { inve: "Investigação", perc: "Percepção", conh: "Conhecimento", reli: "Religião", mist: "Misticismo", sobr: "Sobrevivência", nobr: "Nobreza", dipl: "Diplomacia", enga: "Enganação", inti: "Intimidação", ladi: "Ladinagem", furt: "Furtividade", atle: "Atletismo", guer: "Guerra", joga: "Jogatina", intu: "Intuição", cura: "Cura", ofic: "Ofício" };

	/* ------------------------------------------------------------------ */
	/* 5. Tabelas                                                           */
	/* ------------------------------------------------------------------ */
	const tabela = (name, formula, linhas, description, img, role) => RollTable.create({
		name, img, folder: pasta.RollTable, flags: FLAGS(role), formula, replacement: true, displayRoll: true, description,
		results: linhas.map(([de, ate, nome, desc, doc]) => doc
			? { type: "document", documentUuid: doc.uuid, range: [de, ate], weight: ate - de + 1, name: doc.name, img: doc.img, description: desc ?? "" }
			: { type: "text", range: [de, ate], weight: ate - de + 1, name: nome, description: desc ?? "" })
	});
	const tabEncontros = await tabela("Encontros no Labirinto Liberto", "1d20",
		ENCONTROS.map(([de, ate, txt]) => [Math.max(de, 1), Math.min(ate, 25), txt]),
		"Em toda sala sem criaturas definidas, role 1d20 + ruído (silencioso –1, padrão +0, barulhento +2, estrondoso +5). Resultados acima de 20 só saem pelo ruído: use a macro Exploração. Só existem dois metalianos; se os dois já apareceram, ignore novas aparições.", "icons/svg/eye.svg", "encontros");
	const tabReacoes = await tabela("Reações no Labirinto Liberto", "1d6",
		REACOES.map(([de, ate, txt]) => [Math.max(de, 0), Math.min(ate, 20), txt]),
		"1d6 + Carisma do personagem mais próximo (o menor, em empate). Se o grupo notou primeiro e dialoga: teste social, cada 5 pontos vale um resultado. Aurumvorax, mantor e tigres ignoram conversa (fogem); bulettes atacam sempre.", "icons/svg/terror.svg", "reacoes");
	const tabPistas = await tabela("Pistas do Enxadrista", "1d9",
		PISTAS.map((t, i) => [i + 1, i + 1, t, SIGNIFICADO_PISTAS[i]]),
		"O Enxadrista dá as pistas em ordem, uma a cada vantagem (teste vencido). A macro Enxadrista controla a ordem. Sem ninguém para resgatar, troque a 7ª por: " + PISTA_SEM_RESGATE, `${GE}/baralho.webp`, "pistas");

	/* ------------------------------------------------------------------ */
	/* 6. Macros                                                            */
	/* ------------------------------------------------------------------ */
	// Cada função vira o texto de uma macro: nada de fora dela existe quando ela roda (só DADOS).

	async function macroBusca(D) {
		const ESTADO = "fdtLabirinto";
		const b = foundry.utils.deepClone(game.user.getFlag("world", `${ESTADO}.busca`) ?? { sucessos: 0, falhas: 0, testes: 0, usadas: [] });
		const atores = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		const cd = 20 + 2 * b.testes;
		const opPer = Object.entries(D.pericias).map(([k, n]) => {
			const usada = k !== "inve" && b.usadas.includes(k);
			return `<option value="${k}" ${usada ? "disabled" : ""}>${n}${usada ? " (já usada)" : ""}</option>`;
		}).join("");
		const opEnt = Object.entries(D.entradas).map(([k, e]) => `<option value="${k}">${e.nome}</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Labirinto · Busca pela Entrada" },
			position: { width: 500 },
			content: `
				<p>Teste estendido aberto: <b>7 sucessos</b> antes de 3 falhas. CD atual <b>${cd}</b> (20, +2 por teste). Progresso: <b>${b.sucessos}/7</b>, ${b.falhas} falha(s), ${b.testes} teste(s) = ${(b.testes / 2).toFixed(1)} dia(s).
				Só Investigação pode repetir. Cada falha custa 1d4 PM, que só voltam ao achar a entrada ou ao fim da aventura.</p>
				<div class="form-group"><label>O que aconteceu</label><select name="acao">
					<option value="rolar">Rolar (o primeiro token selecionado faz o teste)</option>
					<option value="npc">Um NPC que conhece o Labirinto ajudou (1 sucesso)</option>
					<option value="avatar">O Avatar da Cidade colaborou (3 sucessos)</option>
					<option value="zerar">Zerar o progresso</option></select></div>
				<div class="form-group"><label>Perícia</label><select name="per">${opPer}</select></div>
				<div class="form-group"><label>Bônus (ajuda, ideias)</label><input type="number" name="mod" value="0"></div>
				<div class="form-group"><label>Falha custa PM a todos os selecionados</label><input type="checkbox" name="todos"></div>
				<div class="form-group"><label>Entrada que o grupo procura</label><select name="entrada">${opEnt}</select></div>
				<div class="form-group"><label>Rolar um encontro em Valkaria</label><input type="checkbox" name="encontro"></div>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "zerar") return game.user.unsetFlag("world", `${ESTADO}.busca`);
		const rolls = [];
		let html = "<h3>Busca pelo Labirinto Liberto</h3>";
		if (res.acao === "rolar") {
			const a = atores[0];
			if (!a) return ui.notifications.warn("Selecione o token de quem faz o teste (e, se quiser, o resto do grupo).");
			const bonus = (k) => {
				if (k === "ofic") return Math.max(0, ...Object.entries(a.system.pericias ?? {}).filter(([kk]) => kk.startsWith("ofi") || kk === "alqu").map(([, v]) => Number(v?.value) || 0));
				return Number(a.system.pericias?.[k]?.value) || 0;
			};
			const r = await new Roll(`1d20 + ${bonus(res.per)} + ${Number(res.mod) || 0}`).evaluate();
			rolls.push(r);
			const ok = r.total >= cd;
			b.testes++;
			if (res.per !== "inve" && !b.usadas.includes(res.per)) b.usadas.push(res.per);
			html += `<p>${a.name} · ${D.pericias[res.per]} <b>${r.total}</b> contra CD ${cd}: ${ok ? "✔️ sucesso" : "❌ falha"}</p>`;
			if (ok) b.sucessos++;
			else {
				b.falhas++;
				for (const x of res.todos ? atores : [a]) {
					const d = await new Roll("1d4").evaluate();
					rolls.push(d);
					await x.update({ "system.attributes.pm.value": Math.max(0, (Number(x.system.attributes.pm?.value) || 0) - d.total) });
					html += `<p>${x.name} perde <b>${d.total} PM</b> (esforço e frustração).</p>`;
				}
			}
		} else {
			const n = res.acao === "avatar" ? 3 : 1;
			b.testes++;
			b.sucessos += n;
			html += `<p>${res.acao === "avatar" ? "O Avatar da Cidade colabora" : "Um NPC que conhece o Labirinto ajuda"}: <b>${n} sucesso(s)</b>.</p>`;
		}
		if (b.falhas >= 3 && b.sucessos < 7) {
			html += "<h4>Falha total</h4><p>Três falhas antes dos 7 sucessos: os personagens ficam <b>alquebrados</b> até acharem a entrada ou até o fim da aventura, e o teste recomeça do zero.</p>";
			for (const x of atores) await x.toggleStatusEffect("alquebrado", { active: true });
			await game.user.unsetFlag("world", `${ESTADO}.busca`);
		} else if (b.sucessos >= 7) {
			const e = D.entradas[res.entrada];
			html += `<h4>Entrada encontrada!</h4><p><b>${e.nome}.</b> ${e.texto}</p><p style="font-size:0.85em">Os PM perdidos na busca voltam agora. Use <i>Labirinto · Entradas</i> para o desafio.</p>`;
			await game.user.unsetFlag("world", `${ESTADO}.busca`);
		} else {
			html += `<p>Progresso: <b>${b.sucessos}/7</b>, ${b.falhas}/3 falha(s), ${(b.testes / 2).toFixed(1)} dia(s).</p>`;
			await game.user.setFlag("world", `${ESTADO}.busca`, b);
		}
		await ChatMessage.create({ content: html, rolls, whisper: ChatMessage.getWhisperRecipients("GM") });
		if (res.encontro) {
			const t = game.tables.find((x) => x.name === "Encontros em Valkaria");
			if (t) return t.draw();
			ui.notifications.info("Role um encontro em Valkaria (tabela da Aventura 0).");
		}
	}

	async function macroExploracao(D) {
		const ESTADO = "fdtLabirinto";
		const x = foundry.utils.deepClone(game.user.getFlag("world", `${ESTADO}.exp`) ?? { ruido: "padrao", besta: false, segmentos: 0, cenas: 0, metalianos: 0 });
		const opRuido = D.ruidos.map(([k, n]) => `<option value="${k}" ${k === x.ruido ? "selected" : ""}>${n}</option>`).join("");
		const opTipo = Object.entries(D.nomes).map(([k, n]) => `<option value="${k}">${n}</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Labirinto · Exploração" },
			position: { width: 520 },
			content: `
				<p>Ruído <b>${x.ruido}</b>${x.besta ? " (+1 categoria pela besta de carga)" : ""}. Cena: <b>${x.segmentos}/6</b> segmentos; ${x.cenas} cena(s) passada(s). Metalianos já encontrados: ${x.metalianos}/2.</p>
				<div class="form-group"><label>Ação</label><select name="acao">
					<option value="sala">Entrar numa sala sem criaturas definidas (rola encontro, 2 segmentos)</option>
					<option value="corredor">Passar ou explorar um corredor (1 segmento)</option>
					<option value="longa">Ação longa: explorar uma sala, cuidados prolongados, identificar item (2)</option>
					<option value="muitoLonga">Ação muito longa: horas, acampar (6 = uma cena)</option>
					<option value="tuneis">Atravessar os túneis dos bulettes (conta como 2 salas, 50% de ataque)</option>
					<option value="definida">Sala com criaturas do livro (só reação, 2 segmentos)</option>
					<option value="reacao">Só rolar a reação</option>
					<option value="ruido">Só mudar o ruído</option>
					<option value="zerar">Zerar a contagem</option></select></div>
				<div class="form-group"><label>Ruído</label><select name="ruido">${opRuido}</select></div>
				<div class="form-group"><label>Testar Furtividade CD 20 dos selecionados (silencioso)</label><input type="checkbox" name="furtividade"></div>
				<div class="form-group"><label>O grupo leva uma besta de carga</label><input type="checkbox" name="besta" ${x.besta ? "checked" : ""}></div>
				<div class="form-group"><label>Criatura (reação sem encontro)</label><select name="tipo">${opTipo}</select></div>
				<div class="form-group"><label>Teste social antes de serem notados (0 = não)</label><input type="number" name="social" value="0"></div>
				<div class="form-group"><label>Colocar os tokens na cena</label><input type="checkbox" name="tokens" checked></div>
				<div class="form-group"><label>Metalianos já encontrados</label><input type="number" name="metalianos" value="${x.metalianos}" min="0" max="2"></div>
				<p style="font-size:0.85em">Selecione os personagens mais próximos das criaturas: a reação usa o menor Carisma entre eles. Na Sala 14 de Hyninn nunca há encontro (use corredor ou ação longa).</p>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		let html = "";
		const atores = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		x.ruido = D.ruidos.some(([k]) => k === res.ruido) ? res.ruido : "padrao";
		x.besta = Boolean(res.besta);
		x.metalianos = Math.clamp(Number(res.metalianos) || 0, 0, 2);
		if (res.furtividade && atores.length) {
			const notas = [];
			let todos = true;
			for (const a of atores) {
				const r = await new Roll(`1d20 + ${Number(a.system.pericias?.furt?.value) || 0}`).evaluate();
				rolls.push(r);
				notas.push(`${a.name} ${r.total}${r.total >= 20 ? "✔️" : "❌"}`);
				if (r.total < 20) todos = false;
			}
			x.ruido = todos ? "silencioso" : "padrao";
			html += `<p>Furtividade CD 20: ${notas.join(", ")} → <b>${todos ? "silencioso" : "padrão"}</b>.</p>`;
		}
		const ordem = D.ruidos.map(([k]) => k);
		const efetivo = ordem[Math.min(ordem.length - 1, ordem.indexOf(x.ruido) + (x.besta ? 1 : 0))];
		const mod = D.ruidos.find(([k]) => k === efetivo)[2];
		if (res.acao === "zerar") { x.segmentos = 0; x.cenas = 0; html += "<p>Contagem de segmentos zerada.</p>"; }
		if (res.acao === "ruido") html += `<h3>Ruído: ${efetivo}</h3><p>Modificador na rolagem de encontro: <b>${mod >= 0 ? "+" : ""}${mod}</b>.</p>`;

		const grupos = [];
		if (res.acao === "sala") {
			const r = await new Roll(`1d20 + ${mod}`).evaluate();
			rolls.push(r);
			const linha = D.encontros.find(([a, b2]) => r.total >= a && r.total <= b2) ?? D.encontros.at(-1);
			html += `<h3>Encontro no Labirinto · ${r.total}</h3><p>1d20 ${mod >= 0 ? "+" : ""}${mod} (${efetivo}): <b>${linha[2]}</b></p>`;
			for (const [papel, qtd] of linha[3]) {
				if (papel === "metaliano") {
					if (x.metalianos >= 2) { html += "<p><i>Os dois metalianos já apareceram: ignore este.</i></p>"; continue; }
					x.metalianos++;
					html += `<p><i>Metaliano errante: ${x.metalianos}/2 encontrados. O outro vive na Sala 18 de Hyninn.</i></p>`;
				}
				const q = await new Roll(qtd).evaluate();
				if (qtd.includes("d")) rolls.push(q);
				if (q.total > 0) grupos.push([papel, q.total]);
			}
		}
		if (res.acao === "tuneis") {
			const r = await new Roll("1d100").evaluate();
			rolls.push(r);
			if (r.total <= 50) {
				const lado = await new Roll("1d2").evaluate();
				rolls.push(lado);
				html += `<h3>Túneis dos bulettes · ataque!</h3><p>Um bulette vem em investida contra o <b>${lado.total === 1 ? "primeiro" : "último"} da fila</b>, causa o máximo de dano que puder e foge. Só o atacado pode reagir. Magia nos túneis exige Misticismo de quem é Pequeno ou maior; armas de uma mão ou maiores têm <b>–5</b>.</p>`;
				grupos.push(["bulette", 1]);
			} else html += "<h3>Túneis dos bulettes</h3><p>Nenhum ataque desta vez. Sobrevivência CD 25 para se orientar (falha: um buraco aleatório entre as Salas 5, 6 e 9).</p>";
		}
		if (res.acao === "definida" || res.acao === "reacao") {
			grupos.push([res.tipo, 0]);
			if (res.tipo === "metaliano" && x.metalianos < 2) x.metalianos++;
		}

		if (grupos.length) {
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
				if (modo === "ataca") txt = "Ataca sem rolar reação.";
				else if (modo === "bestial" && base >= 8) txt = "Foge ou se afasta (ignora conversa e colaboração).";
				else txt = reacao(base) + (modo === "naoVerbal" ? " <i>(o grupo precisa decifrar a linguagem não verbal)</i>" : "");
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
					const modelo = game.actors.find((a) => a.getFlag("world", "fdt") === "a2labirinto" && a.getFlag("world", "fdtRole") === papel);
					if (!modelo || !qtd) continue;
					for (let n = 0; n < qtd; n++, i++) {
						const ang = (i / 8) * 2 * Math.PI;
						const raio = 4 + Math.floor(i / 8) * 2;
						const td = await modelo.getTokenDocument({ x: cx + Math.round(Math.cos(ang) * raio) * gs, y: cy + Math.round(Math.sin(ang) * raio) * gs, hidden: true });
						docs.push(td.toObject());
					}
				}
				if (docs.length) {
					await canvas.scene.createEmbeddedDocuments("Token", docs);
					html += `<p style="font-size:0.85em">${docs.length} token(s) colocados <b>ocultos</b> em volta ${ref ? `de ${ref.name}` : "do centro da tela"}. Revele quando o grupo os vir.</p>`;
				}
			}
		}

		const gasto = { sala: 2, definida: 2, corredor: 1, longa: 2, muitoLonga: 6, tuneis: 4 }[res.acao] ?? 0;
		if (gasto) {
			x.segmentos += gasto;
			html += `<p style="font-size:0.85em">+${gasto} segmento(s).</p>`;
			while (x.segmentos >= 6) {
				x.segmentos -= 6;
				x.cenas++;
				html += "<h4>Passou uma cena</h4><p>Efeitos de duração cena terminam. Tochas, cargas de óleo e magias de luz acabam: acendam outras ou fiquem no escuro (cegos fora da luz). Contem rações e tochas!</p>";
			}
		}
		await game.user.setFlag("world", `${ESTADO}.exp`, x);
		if (html) await ChatMessage.create({ content: html + `<p style="font-size:0.8em">Ruído ${efetivo} · cena ${x.segmentos}/6 · metalianos ${x.metalianos}/2</p>`, rolls, whisper: ChatMessage.getWhisperRecipients("GM") });
	}

	async function macroEscuridao() {
		if (!canvas.scene) return ui.notifications.warn("Abra a cena do Labirinto.");
		const cena = canvas.scene;
		const ativa = cena.getFlag("world", "fdtEscuridaoLab");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Labirinto · Escuridão" },
			content: `
				<p>No Labirinto, luz mágica e mundana funcionam normalmente, mas <b>visão no escuro e na penumbra não funcionam</b> (truque de Hyninn). A escuridão está <b>${ativa ? "LIGADA" : "desligada"}</b> nesta cena.</p>
				<div class="form-group"><label>Ação</label><select name="acao">
					<option value="alternar">${ativa ? "Desligar" : "Ligar"} a escuridão do Labirinto</option>
					<option value="tocha">Acender tocha nos tokens selecionados (6m de luz, 12m de penumbra)</option>
					<option value="lampiao">Acender lampião nos tokens selecionados (9m de luz, 18m de penumbra)</option>
					<option value="apagar">Apagar a luz dos tokens selecionados</option></select></div>
				<p style="font-size:0.85em">Ligar guarda a visão de cada token e desliga a visão no escuro; desligar restaura. Os habitantes do Labirinto não sofrem a escuridão: a macro só mexe nos tokens de personagens. Tokens colocados depois de ligar não são ajustados.</p>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (["tocha", "lampiao", "apagar"].includes(res.acao)) {
			const [luz, pen] = res.acao === "tocha" ? [6, 12] : res.acao === "lampiao" ? [9, 18] : [0, 0];
			const ups = canvas.tokens.controlled.map((t) => ({ _id: t.id, "light.bright": luz, "light.dim": pen, "light.color": luz ? "#ffb35c" : null, "light.animation.type": luz ? "torch" : null }));
			if (!ups.length) return ui.notifications.warn("Selecione os tokens que carregam a luz.");
			return cena.updateEmbeddedDocuments("Token", ups);
		}
		if (!ativa) {
			const tokens = cena.tokens.filter((t) => t.actor?.type === "character").map((t) => ({
				_id: t.id,
				"flags.world.fdtVisaoLab": { range: t.sight.range, mode: t.sight.visionMode },
				"sight.range": 0,
				"sight.visionMode": "basic"
			}));
			if (tokens.length) await cena.updateEmbeddedDocuments("Token", tokens);
			await cena.update({ "flags.world.fdtEscuridaoLab": { darkness: cena.environment.darknessLevel, global: cena.environment.globalLight.enabled }, "environment.darknessLevel": 1, "environment.globalLight.enabled": false });
			ChatMessage.create({ content: "<p><b>A escuridão do Labirinto Liberto:</b> nenhum olho enxerga no escuro aqui, só a luz funciona. Quem está fora da luz fica <b>cego</b>.</p>" });
		} else {
			const tokens = cena.tokens.filter((t) => t.getFlag("world", "fdtVisaoLab")).map((t) => {
				const o = t.getFlag("world", "fdtVisaoLab");
				return { _id: t.id, "sight.range": o.range, "sight.visionMode": o.mode, "flags.world.-=fdtVisaoLab": null };
			});
			if (tokens.length) await cena.updateEmbeddedDocuments("Token", tokens);
			await cena.update({ "environment.darknessLevel": ativa.darkness ?? 0, "environment.globalLight.enabled": ativa.global ?? false, "flags.world.-=fdtEscuridaoLab": null });
			ui.notifications.info("Escuridão do Labirinto desligada: visão restaurada.");
		}
	}

	async function macroEntradas(D) {
		const ESTADO = "fdtLabirinto";
		const st = foundry.utils.deepClone(game.user.getFlag("world", `${ESTADO}.entradas`) ?? { portaPV: 100, pecados: [] });
		const atores = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		const opEnt = Object.entries(D.entradas).map(([k, e]) => `<option value="${k}">${e.nome}</option>`).join("");
		const opPec = D.pecados.map(([k, n]) => `<label style="display:block"><input type="checkbox" name="p_${k}" ${st.pecados.includes(k) ? "checked" : ""}> ${n}</label>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Labirinto · Entradas" },
			position: { width: 520 },
			content: `
				<div class="form-group"><label>Entrada</label><select name="entrada">${opEnt}</select></div>
				<div class="form-group"><label>Ação</label><select name="acao">
					<option value="descrever">Descrever a entrada (mostrar aos jogadores)</option>
					<option value="religiao">Testes de Religião dos selecionados treinados (25, 30, 40)</option>
					<option value="solucao">Ver a solução (só para o Mestre)</option>
					<option value="arrombar">Hyninn: Ladinagem CD 30 na porta (primeiro selecionado)</option>
					<option value="danoPorta">Hyninn: dano na porta de ferro</option>
					<option value="anagrama">Tanna-Toh: conferir a resposta do anagrama</option>
					<option value="segredos">Tanna-Toh: todos confessaram um segredo na corneta</option>
					<option value="religiao20">Azgher: Religião CD 20 para entender a inscrição</option>
					<option value="balanca">Azgher: pesar os pecados confessados</option>
					<option value="zerar">Zerar porta e balança</option></select></div>
				<div class="form-group"><label>Dano na porta (já rolado)</label><input type="number" name="dano" value="0"></div>
				<div class="form-group"><label>Resposta dos jogadores</label><input type="text" name="resposta" value=""></div>
				<fieldset><legend>Pecados confessados (balança de Azgher)</legend>${opPec}</fieldset>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const e = D.entradas[res.entrada] ?? Object.values(D.entradas)[0];
		const rolls = [];
		let html = "";
		let publico = false;
		const letras = (s) => String(s ?? "").normalize("NFD").replace(/[^A-Za-z]/g, "").toUpperCase();
		const ordenar = (s) => [...letras(s)].sort().join("");
		switch (res.acao) {
			case "descrever":
				html = `<h3>${e.nome}</h3><p>${e.texto}</p>`;
				publico = true;
				break;
			case "solucao":
				html = `<h3>${e.nome} · solução</h3><p>${e.solucao}</p><p>Chegada: ${e.chegada}.</p>`;
				break;
			case "religiao": {
				const treinados = atores.filter((a) => a.system.pericias?.reli?.treinado);
				if (!treinados.length) return ui.notifications.warn("Selecione os personagens treinados em Religião (peça o teste mesmo que ninguém pense nisso).");
				html = `<h3>${e.nome} · Religião</h3><ul>`;
				for (const a of treinados) {
					const r = await new Roll(`1d20 + ${Number(a.system.pericias.reli.value) || 0}`).evaluate();
					rolls.push(r);
					const t = r.total;
					const txt = t >= 40 ? `Sabe a qual deus a entrada corresponde: <b>${e.nome.replace("Entrada de ", "")}</b>.` : t >= 30 ? `Uma dica a interpretar: ${e.dica}` : t >= 25 ? "Há algo divino nesta entrada." : "Nada de especial.";
					html += `<li>${a.name}: <b>${t}</b> → ${txt}</li>`;
				}
				html += "</ul><p style=\"font-size:0.85em\">O desafio continua sendo dos jogadores, não dos personagens.</p>";
				break;
			}
			case "arrombar": {
				const a = atores[0];
				if (!a) return ui.notifications.warn("Selecione quem tenta abrir a fechadura.");
				const r = await new Roll(`1d20 + ${Number(a.system.pericias?.ladi?.value) || 0}`).evaluate();
				rolls.push(r);
				html = `<h3>Porta de ferro de Hyninn</h3><p>${a.name} · Ladinagem <b>${r.total}</b> contra CD 30: ${r.total >= 30 ? "✔️ a fechadura cede. O grupo chega à <b>Área de Entrada A</b> (que não abre por dentro)." : r.total <= 25 ? "❌ falhou por 5 ou mais: <b>a gazua quebra</b> (sem gazua, a fechadura quebra e não abre mais com Ladinagem)." : "❌ a fechadura resiste."}</p>`;
				break;
			}
			case "danoPorta": {
				const d = Math.max(0, (Number(res.dano) || 0) - 10);
				st.portaPV = Math.max(0, st.portaPV - d);
				html = `<h3>Porta de ferro de Hyninn</h3><p>${Number(res.dano) || 0} de dano, menos RD 10 = <b>${d}</b>. Restam <b>${st.portaPV}/100 PV</b>.${st.portaPV <= 0 ? " A porta cai! O grupo chega à <b>Área de Entrada A</b>." : ""}</p>`;
				break;
			}
			case "anagrama": {
				const enigma = "SOME GRANDE FOGO RECUSE SEUS PRIMEIROS";
				const certo = "CONFESSEM UM SEGREDO E IRÃO PROSSEGUIR";
				const tent = res.resposta ?? "";
				const ehAnagrama = ordenar(tent) === ordenar(enigma);
				const acertou = letras(tent) === letras(certo);
				html = `<h3>O anagrama de Tanna-Toh</h3><p>Resposta: <b>${foundry.utils.escapeHTML?.(tent) ?? tent}</b></p><p>${acertou ? "✔️ <b>Certo!</b> Agora cada um precisa confessar um segredo em voz alta dentro da corneta." : ehAnagrama ? "Usa exatamente as letras do enigma, mas não é a frase certa. A corneta continua muda." : "Não usa as mesmas letras do enigma: não é um anagrama dele."}</p>`;
				publico = true;
				break;
			}
			case "segredos":
				html = "<h3>A corneta de Tanna-Toh</h3><p>O último segredo ecoa no bronze e se junta ao conhecimento do Labirinto. Uma das paredes se abre: <b>Área de Entrada B</b>.</p>";
				publico = true;
				break;
			case "religiao20": {
				const a = atores[0];
				if (!a) return ui.notifications.warn("Selecione quem lê a inscrição.");
				const r = await new Roll(`1d20 + ${Number(a.system.pericias?.reli?.value) || 0}`).evaluate();
				rolls.push(r);
				html = `<h3>A balança de Azgher</h3><p>${a.name} · Religião <b>${r.total}</b> contra CD 20: ${r.total >= 20 ? `✔️ cada um deve confessar uma quebra das Obrigações & Restrições de Azgher, um pecado único, e pôr uma pepita na balança. Os pecados: <b>leves</b> (${D.pecados.filter((x) => x[2] === 1).map((x) => x[1]).join(", ")}); <b>médios</b> (${D.pecados.filter((x) => x[2] === 2).map((x) => x[1]).join(", ")}); <b>graves</b> (${D.pecados.filter((x) => x[2] === 3).map((x) => x[1]).join(", ")}). Quanto vale cada um, só a balança diz.` : "❌ a inscrição continua um mistério."}</p>`;
				break;
			}
			case "balanca": {
				st.pecados = D.pecados.filter(([k]) => res[`p_${k}`]).map(([k]) => k);
				const total = D.pecados.filter(([k]) => st.pecados.includes(k)).reduce((s, x) => s + x[2], 0);
				const visual = total < 10 ? "A balança ainda pende para o lado da pedra: ela continua <b>escura e opaca</b>, e as pepitas, <b>douradas</b>."
					: total > 10 ? "As pepitas pesam demais: agora elas ficam <b>escuras e opacas</b>, e a pedra, <b>dourada</b>. Talvez um pecado grave deva dar lugar a um mais leve."
						: "A balança se equilibra: pedra e pepitas ficam <b>cinzentas e reluzentes</b>. A imagem do sol se desfaz num mecanismo complexo e revela a entrada: <b>Área de Entrada C</b>.";
				await ChatMessage.create({ content: `<h3>A balança de Azgher</h3><p>${st.pecados.length} pecado(s) confessado(s).</p><p>${visual}</p>` });
				html = `<p>Balança de Azgher: <b>${total}/10 pontos</b> (${D.pecados.filter(([k]) => st.pecados.includes(k)).map((x) => `${x[1]} ${x[2]}`).join(", ") || "nada"}).</p>`;
				break;
			}
			case "zerar":
				st.portaPV = 100;
				st.pecados = [];
				html = "<p>Porta de Hyninn e balança de Azgher zeradas.</p>";
				break;
		}
		await game.user.setFlag("world", `${ESTADO}.entradas`, st);
		if (html) await ChatMessage.create({ content: html, rolls, ...(publico ? {} : { whisper: ChatMessage.getWhisperRecipients("GM") }) });
	}

	async function macroArmadilhas(D) {
		const ESTADO = "fdtLabirinto";
		const alvos = [...(game.user.targets.size ? game.user.targets : canvas.tokens.controlled)].filter((t) => t.actor);
		const st = foundry.utils.deepClone(game.user.getFlag("world", `${ESTADO}.armadilhas`) ?? { acido: 0 });
		const opArm = Object.entries(D.armadilhas).map(([k, a]) => `<option value="${k}">${a.nome}${a.nd ? ` (ND ${a.nd})` : ""} · ${a.onde}</option>`).join("")
			+ `<option value="acido">Ácido da cabra-cega: próxima rodada (rodada ${st.acido + 1})</option><option value="acidoZerar">Ácido da cabra-cega: saíram da sala (zerar)</option>`;
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Labirinto · Armadilhas" },
			position: { width: 560 },
			content: `
				<div class="form-group"><label>Armadilha</label><select name="arm">${opArm}</select></div>
				<div class="form-group"><label>Abismo: notaram que os mirminoides evitam áreas (–5 na CD)</label><input type="checkbox" name="notaram"></div>
				<div class="form-group"><label>Névoa: entrou quebrando a parede porosa (–5)</label><input type="checkbox" name="quebrou"></div>
				<div class="form-group"><label>Névoa: sala onde entraram</label><select name="sala"><option value="9">Sala 9 (leva à 13)</option><option value="13">Sala 13 (leva à 9)</option></select></div>
				<div class="form-group"><label>Runa de Aceleração: bate numa parede ou objeto</label><input type="checkbox" name="parede"></div>
				<div class="form-group"><label>Runa de Aceleração: empurrado para a Runa de Desintegração</label><input type="checkbox" name="cadeia"></div>
				<p style="font-size:0.85em">${alvos.length ? `Alvos: ${alvos.map((t) => t.name).join(", ")}.` : "<b>Mire ou selecione</b> os tokens atingidos."} Devotos de Azgher são reconhecidos pela divindade da ficha.</p>`,
			ok: { label: "Disparar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.arm === "acidoZerar") { st.acido = 0; await game.user.setFlag("world", `${ESTADO}.armadilhas`, st); return ui.notifications.info("Ácido da cabra-cega zerado."); }
		if (!alvos.length) return ui.notifications.warn("Mire ou selecione os tokens atingidos.");
		const rolls = [];
		const teste = async (actor, k, mod = 0) => {
			const r = await new Roll(`1d20 + ${Number(actor.system.pericias?.[k]?.value) || 0} + ${mod}`).evaluate();
			rolls.push(r);
			return r.total;
		};
		const devoto = (actor) => /azgher/i.test(actor.system.detalhes?.divindade ?? "");
		const pv = (actor) => Number(actor.system.attributes.pv.value) || 0;
		if (res.arm === "acido") {
			st.acido++;
			const dados = ["1d4", "1d6", "1d8", "1d10", "1d12"];
			const dado = st.acido <= 5 ? dados[st.acido - 1] : `${st.acido - 5}d20`;
			const r = await new Roll(`${dado}[acido]`).evaluate();
			rolls.push(r);
			let html = `<h3>Ácido da cabra-cega · rodada ${st.acido}</h3><p>${dado} = <b>${r.total}</b> de ácido em quem continua na sala (imunes não sofrem).</p><ul>`;
			for (const t of alvos) { await t.actor.applyDamageV2(r, 1); html += `<li>${t.name}</li>`; }
			await game.user.setFlag("world", `${ESTADO}.armadilhas`, st);
			return ChatMessage.create({ content: html + "</ul>", rolls });
		}
		const a = D.armadilhas[res.arm];
		let html = `<h3>${a.nome}</h3><p>${a.efeito}</p><ul>`;
		const comum = {};
		const rolar = async (k, f) => { comum[k] ??= await new Roll(f).evaluate(); if (!rolls.includes(comum[k])) rolls.push(comum[k]); return comum[k]; };
		for (const t of alvos) {
			const ator = t.actor;
			const nome = t.name;
			switch (res.arm) {
				case "abismo": {
					const cd = res.notaram ? 25 : 30;
					const v = await teste(ator, "refl");
					if (v >= cd) { html += `<li>${nome}: Reflexos ${v} contra ${cd} ✔️ evita a queda</li>`; break; }
					await ator.applyDamageV2(await rolar("queda", "20d6[impacto]"), 1);
					await ator.applyDamageV2(await rolar("estacas", "2d8+10[perfuracao]"), 1);
					await ator.toggleStatusEffect("caido", { active: true });
					html += `<li>${nome}: Reflexos ${v} contra ${cd} ❌ cai 30m (${comum.queda.total}) sobre estacas (${comum.estacas.total}). Atletismo CD 25 para subir.</li>`;
					break;
				}
				case "porosa": {
					const v = await teste(ator, "refl");
					html += `<li>${nome}: Reflexos ${v} contra 25 ${v >= 25 ? "✔️ nota o desabamento e salta para fora" : "❌ <b>preso</b> na sala, no escuro"}</li>`;
					break;
				}
				case "nevoa": {
					if (ator.getFlag("world", "fdtNevoa")) { html += `<li>${nome}: já foi transportado uma vez; a névoa não o leva de novo.</li>`; break; }
					const mod = res.quebrou ? -5 : 0;
					const ref = await teste(ator, "refl", mod);
					const von = await teste(ator, "vont", mod);
					const v = Math.max(ref, von);
					if (v >= 25) { html += `<li>${nome}: Reflexos ${ref} / Vontade ${von} ✔️ atravessa a névoa</li>`; break; }
					await ator.setFlag("world", "fdtNevoa", true);
					html += `<li>${nome}: Reflexos ${ref} / Vontade ${von} ❌ <b>transportado para a Sala ${res.sala === "13" ? 9 : 13}</b></li>`;
					break;
				}
				case "aceleracao": {
					const v = await teste(ator, "fort");
					const metros = v >= 20 ? 4.5 : 9;
					let txt = `Fortitude ${v} contra 20 ${v >= 20 ? "✔️" : "❌"} → arremessado <b>${metros}m</b>`;
					if (res.parede) {
						const d = await new Roll(`${metros / 1.5}d6[impacto]`).evaluate();
						rolls.push(d);
						await ator.applyDamageV2(d, 1);
						txt += `, bate e sofre ${d.total} de impacto`;
					}
					if (res.cadeia) {
						const f = await teste(ator, "fort");
						const d = f >= 30 ? await new Roll("2d12[essencia]").evaluate() : await rolar("desint", "10d12[essencia]");
						if (!rolls.includes(d)) rolls.push(d);
						await ator.applyDamageV2(d, 1);
						txt += `; cai na Runa de Desintegração sem teste para notá-la: Fortitude ${f} contra 30 ${f >= 30 ? "✔️ 2d12" : "❌ 10d12"} = ${d.total}`;
						if (pv(ator) <= 0) { await ator.toggleStatusEffect("morto", { active: true }); txt += " · <b>desintegrado, só resta pó</b>"; }
					}
					html += `<li>${nome}: ${txt}</li>`;
					break;
				}
				case "desintegracao": {
					const v = await teste(ator, "fort");
					const d = v >= 30 ? await new Roll("2d12[essencia]").evaluate() : await rolar("desint", "10d12[essencia]");
					if (!rolls.includes(d)) rolls.push(d);
					await ator.applyDamageV2(d, 1);
					let txt = `Fortitude ${v} contra 30 ${v >= 30 ? "✔️ 2d12" : "❌ 10d12"} = ${d.total}`;
					if (pv(ator) <= 0) { await ator.toggleStatusEffect("morto", { active: true }); txt += " · <b>desintegrado, só resta pó</b>"; }
					html += `<li>${nome}: ${txt}</li>`;
					break;
				}
				case "cabraCega": {
					const v = await teste(ator, "fort");
					if (v >= 30) { html += `<li>${nome}: Fortitude ${v} contra 30 ✔️ não é afetado (pode guiar os outros)</li>`; break; }
					await ator.toggleStatusEffect("cego", { active: true });
					await ator.toggleStatusEffect("surdo", { active: true });
					html += `<li>${nome}: Fortitude ${v} contra 30 ❌ <b>cego e surdo</b> até descansar 8 horas</li>`;
					break;
				}
				case "simboloMorte": {
					if (devoto(ator)) { html += `<li>${nome}: devoto de Azgher, imune.</li>`; break; }
					const v = await teste(ator, "fort");
					if (v >= 30) {
						const d = await rolar("morte", "10d6[trevas]");
						await ator.applyDamageV2(d, 1);
						html += `<li>${nome}: Fortitude ${v} contra 30 ✔️ sofre ${d.total} de trevas</li>`;
					} else {
						await ator.update({ "system.attributes.pv.value": -1 });
						html += `<li>${nome}: Fortitude ${v} contra 30 ❌ <b>reduzido a –1 PV</b></li>`;
					}
					break;
				}
				case "simboloInsanidade": {
					const v = await teste(ator, "vont");
					if (v >= 30) { html += `<li>${nome}: Vontade ${v} contra 30 ✔️ evita</li>`; break; }
					await ator.toggleStatusEffect("confuso", { active: true });
					html += `<li>${nome}: Vontade ${v} contra 30 ❌ <b>confuso permanentemente</b></li>`;
					break;
				}
				case "servos": {
					if (ator.statuses?.has?.("surdo")) { html += `<li>${nome}: não ouve, não é afetado.</li>`; break; }
					const v = await teste(ator, "vont");
					if (v >= 25) { html += `<li>${nome}: Vontade ${v} contra 25 ✔️</li>`; break; }
					const d = await new Roll("1d6").evaluate();
					rolls.push(d);
					await ator.update({ "system.attributes.pm.value": Math.max(0, (Number(ator.system.attributes.pm?.value) || 0) - d.total) });
					html += `<li>${nome}: Vontade ${v} contra 25 ❌ perde <b>${d.total} PM</b></li>`;
					break;
				}
				case "cemiterio": {
					const o = await new Roll("1d20").evaluate();
					rolls.push(o);
					const v = await teste(ator, "vont");
					let txt = `ordem 1d20 = ${o.total} (o mais baixo aparece na primeira tumba); Vontade ${v} contra 25 `;
					if (v >= 25) txt += "✔️";
					else {
						const d = await new Roll("1d8").evaluate();
						rolls.push(d);
						await ator.update({ "system.attributes.pm.value": Math.max(0, (Number(ator.system.attributes.pm?.value) || 0) - d.total) });
						txt += `❌ perde <b>${d.total} PM</b> ao ver o próprio fim`;
					}
					html += `<li>${nome}: ${txt}</li>`;
					break;
				}
				case "fonte": {
					const n = (Number(ator.getFlag("world", "fdtFonte")) || 0) + 1;
					await ator.setFlag("world", "fdtFonte", n);
					if (devoto(ator)) { html += `<li>${nome}: devoto de Azgher, só o efeito bom (conta como um dia de rações).</li>`; break; }
					let txt;
					if (n === 1) {
						const h = await new Roll("1d6").evaluate();
						rolls.push(h);
						txt = `bebe e se sente saciado (um dia de rações). Em <b>${h.total} hora(s)</b> sente a desidratação: só uma ração extra a anula.`;
					} else {
						const cond = ["fatigado", "exausto", "inconsciente"][n - 2];
						if (cond) { await ator.toggleStatusEffect(cond, { active: true }); txt = `${n}º gole: falha automática contra fome e sede, fica <b>${cond}</b>.`; } else { await ator.toggleStatusEffect("morto", { active: true }); txt = `${n}º gole, inconsciente: <b>morre</b>.`; }
					}
					html += `<li>${nome}: ${txt}</li>`;
					break;
				}
			}
		}
		html += `</ul><p style="font-size:0.85em">Detectar: ${a.det}.</p>`;
		if (res.arm === "abismo") html += "<p><b>Ruído barulhento.</b></p>";
		await ChatMessage.create({ content: html, rolls });
	}

	async function macroTesouro(D) {
		const ESTADO = "fdtLabirinto";
		const o = foundry.utils.deepClone(game.user.getFlag("world", `${ESTADO}.ouro`) ?? { ativo: false, rodada: 0, extra: 0, forca: 0, fechada: false, estados: {}, parado: false });
		const alvos = canvas.tokens.controlled.filter((t) => t.actor);
		const limite = 10 + o.extra;
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Labirinto · Tesouro Infinito" },
			position: { width: 520 },
			content: `
				<p>${o.ativo ? `Rodada <b>${o.rodada}</b>. Porta: ${o.fechada ? "<b>fechada</b>" : `aberta (Força ${o.forca}/3; o ouro engolfa a passagem na rodada ${limite})`}.${o.parado ? " A torrente parou." : ""}` : "A porta ainda não foi aberta."}</p>
				<div class="form-group"><label>Ação</label><select name="acao">
					<option value="abrir">Abrem a porta: o ouro desaba (Reflexos CD 30 dos selecionados)</option>
					<option value="rodada">Fim da rodada: quem está na sala do ouro testa de novo</option>
					<option value="forca">Força CD 20 para fechar a porta (primeiro selecionado)</option>
					<option value="escapar">Atletismo CD 25 para escapar do ouro (ação completa, selecionados)</option>
					<option value="desintegrar">Uma magia desintegrou ouro (+1 rodada)</option>
					<option value="aurumvorax">Um aurumvorax devora o ouro até a saída</option>
					<option value="zerar">Zerar</option></select></div>
				<p style="font-size:0.85em">Selecione os personagens na sala tomada pelo ouro. Percepção, Ladinagem ou Misticismo CD 25 revela que o ouro é infinito. O ouro some quando sai da masmorra.</p>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "zerar") return game.user.unsetFlag("world", `${ESTADO}.ouro`);
		const rolls = [];
		const teste = async (a, k, cd) => {
			const r = await new Roll(`1d20 + ${Number(a.system.pericias?.[k]?.value) || 0}`).evaluate();
			rolls.push(r);
			return r.total;
		};
		const ref30 = async (t) => {
			const e = o.estados[t.actor.id] ?? "livre";
			if (e !== "livre") return `${t.name}: continua ${e}`;
			const v = await teste(t.actor, "refl");
			if (v >= 30) return `${t.name}: Reflexos ${v} ✔️ escapa`;
			o.estados[t.actor.id] = "agarrado";
			await t.actor.toggleStatusEffect("agarrado", { active: true });
			return `${t.name}: Reflexos ${v} ❌ <b>agarrado</b> pelo ouro`;
		};
		let html = "<h3>Tesouro Infinito</h3>";
		switch (res.acao) {
			case "abrir": {
				Object.assign(o, { ativo: true, rodada: 0, extra: 0, forca: 0, fechada: false, estados: {}, parado: false });
				html += "<p>Ouro, muito ouro, do chão ao teto, desaba sobre os heróis e não para de jorrar.</p><ul>";
				for (const t of alvos) html += `<li>${await ref30(t)}</li>`;
				html += "</ul>";
				break;
			}
			case "rodada": {
				if (!o.ativo) return ui.notifications.warn("Abra a porta primeiro.");
				o.rodada++;
				html += `<p>Rodada ${o.rodada}.</p><ul>`;
				for (const t of alvos) {
					const e = o.estados[t.actor.id] ?? "livre";
					if (e === "agarrado") { o.estados[t.actor.id] = "submerso"; html += `<li>${t.name}: uma rodada inteira agarrado, <b>submerge</b> e precisa prender a respiração (sufocamento).</li>`; continue; }
					if (e === "submerso") { html += `<li>${t.name}: continua submerso (sufocamento).</li>`; continue; }
					html += `<li>${await ref30(t)}</li>`;
				}
				html += "</ul>";
				if (!o.fechada && !o.parado) {
					if (o.rodada === limite) html += "<p><b>O ouro engolfa a passagem!</b> A porta já não fecha. Em mais 10 rodadas a Sala 17 é tomada, e uma sala a mais a cada 10 rodadas (terreno difícil; a sala anterior fica interditada).</p>";
					else if (o.rodada > limite && (o.rodada - limite) % 10 === 0) html += `<p><b>Mais uma sala é tomada pelo ouro</b> (${(o.rodada - limite) / 10 === 1 ? "a Sala 17" : "a próxima sala"}). A anterior fica interditada.</p>`;
					else if (o.rodada < limite) html += `<p>Faltam <b>${limite - o.rodada}</b> rodada(s) para o ouro engolfar a passagem.</p>`;
				}
				break;
			}
			case "forca": {
				const a = alvos[0]?.actor;
				if (!a) return ui.notifications.warn("Selecione quem empurra a porta.");
				if (o.fechada) return ui.notifications.info("A porta já está fechada.");
				if (o.rodada >= limite) { html += "<p>O ouro já engolfou a passagem: a porta não fecha mais. Só um aurumvorax resolve.</p>"; break; }
				const r = await new Roll(`1d20 + ${Number(a.system.atributos?.for?.value) || 0}`).evaluate();
				rolls.push(r);
				if (r.total >= 20) o.forca++;
				html += `<p>${a.name} · Força <b>${r.total}</b> contra CD 20: ${r.total >= 20 ? "✔️" : "❌"} (${o.forca}/3).</p>`;
				if (o.forca >= 3) { o.fechada = true; html += "<p><b>A porta se fecha contra a torrente!</b> O ouro fica do outro lado. Para chegar à saída, só com um aurumvorax.</p>"; }
				break;
			}
			case "escapar": {
				html += "<ul>";
				for (const t of alvos) {
					const e = o.estados[t.actor.id] ?? "livre";
					if (e === "livre") { html += `<li>${t.name}: já está livre.</li>`; continue; }
					const v = await teste(t.actor, "atle");
					if (v >= 25) {
						o.estados[t.actor.id] = e === "submerso" ? "agarrado" : "livre";
						if (e === "agarrado") await t.actor.toggleStatusEffect("agarrado", { active: false });
						html += `<li>${t.name}: Atletismo ${v} ✔️ ${e === "submerso" ? "volta à tona (agarrado)" : "<b>livre</b>"}</li>`;
					} else {
						let txt = `${t.name}: Atletismo ${v} ❌`;
						if (v <= 20) {
							const s = t.actor.statuses ?? new Set();
							const nova = s.has("exausto") ? "inconsciente" : s.has("fatigado") ? "exausto" : "fatigado";
							await t.actor.toggleStatusEffect(nova, { active: true });
							txt += ` falhou por 5 ou mais: fica <b>${nova}</b>`;
						}
						html += `<li>${txt}</li>`;
					}
				}
				html += "</ul>";
				break;
			}
			case "desintegrar":
				o.extra++;
				html += `<p>Ouro desintegrado: <b>+1 rodada</b> antes de a passagem ser engolfada (agora na rodada ${10 + o.extra}).</p>`;
				break;
			case "aurumvorax":
				o.parado = true;
				html += `<p>O aurumvorax devora o ouro e escava um túnel até a saída: <b>a torrente cessa</b>. Na saída, uma pequena caverna com uma porta e um pedestal com a ${D.chave}. Dali o grupo sai para Valkaria sem impedimento, e o ouro forma uma passagem natural para voltar.</p>`;
				break;
		}
		await game.user.setFlag("world", `${ESTADO}.ouro`, o);
		await ChatMessage.create({ content: html, rolls });
	}

	async function macroEnxadrista(D) {
		const ESTADO = "fdtLabirinto";
		const x = foundry.utils.deepClone(game.user.getFlag("world", `${ESTADO}.xadrez`) ?? { pista: 0 });
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Labirinto · Enxadrista" },
			position: { width: 500 },
			content: `
				<p><i>"Eu sou o Enxadrista e só existo para o xadrez. Se quiserem uma pista, entre só um de vocês!"</i> Pistas já dadas: ${x.pista}/${D.pistas.length}.</p>
				<div class="form-group"><label>Ação</label><select name="acao">
					<option value="partida">Jogar uma partida (o primeiro selecionado joga; os outros estão do lado de fora)</option>
					<option value="zerar">Zerar as pistas</option></select></div>
				<div class="form-group"><label>Perícia</label><select name="per">
					<option value="guer">Guerra</option><option value="joga">Jogatina</option><option value="nobr">Nobreza</option><option value="ladi">Ladinagem (roubar)</option><option value="inte">Inteligência</option></select></div>
				<div class="form-group"><label>Bônus</label><input type="number" name="mod" value="0"></div>
				<div class="form-group"><label>O grupo não veio resgatar ninguém (troca a 7ª pista)</label><input type="checkbox" name="semResgate"></div>
				<p style="font-size:0.85em">Três testes opostos contra Ladinagem +15: o primeiro a vencer dois ganha. Cada teste vencido pelo personagem dá uma pista; cada um vencido pelo Enxadrista tira 10 PM (ou PV, sem PM) de um companheiro do lado de fora, sorteado.</p>`,
			ok: { label: "Jogar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "zerar") return game.user.unsetFlag("world", `${ESTADO}.xadrez`);
		const jogador = tokens[0]?.actor;
		if (!jogador) return ui.notifications.warn("Selecione quem joga (e, depois, os companheiros do lado de fora).");
		const fora = tokens.slice(1).map((t) => t.actor);
		const bonus = res.per === "inte" ? Number(jogador.system.atributos?.int?.value) || 0 : Number(jogador.system.pericias?.[res.per]?.value) || 0;
		const rolls = [];
		let pj = 0;
		let enx = 0;
		let html = `<h3>Partida contra o Enxadrista</h3><p>As peças tomam a forma dos companheiros de ${jogador.name}.</p><ol>`;
		while (pj < 2 && enx < 2) {
			const a = await new Roll(`1d20 + ${bonus} + ${Number(res.mod) || 0}`).evaluate();
			const b = await new Roll("1d20 + 15").evaluate();
			rolls.push(a, b);
			if (a.total > b.total) {
				pj++;
				const pistas = [...D.pistas];
				if (res.semResgate) pistas[6] = D.semResgate;
				const pista = x.pista < pistas.length ? pistas[x.pista] : pistas.at(-2);
				x.pista = Math.min(x.pista + 1, pistas.length);
				html += `<li>${jogador.name} ${a.total} × ${b.total} Enxadrista: <b>vantagem!</b> <i>"Sempre que tiver vantagem, você ganha uma das rimas. Podem parecer bobagem, mas são minhas obras-primas!"</i><br>${pista}</li>`;
			} else {
				enx++;
				let txt = "";
				if (fora.length) {
					const sorte = await new Roll(`1d${fora.length}`).evaluate();
					rolls.push(sorte);
					const v = fora[sorte.total - 1];
					const pm = Number(v.system.attributes.pm?.value) || 0;
					const tiraPM = Math.min(pm, 10);
					await v.update({ "system.attributes.pm.value": pm - tiraPM, "system.attributes.pv.value": (Number(v.system.attributes.pv.value) || 0) - (10 - tiraPM) });
					txt = `${v.name} perde ${tiraPM} PM${tiraPM < 10 ? ` e ${10 - tiraPM} PV` : ""}`;
				} else txt = "um companheiro do lado de fora, sorteado, perde 10 PM (selecione-os para a macro aplicar)";
				html += `<li>${jogador.name} ${a.total} × ${b.total} Enxadrista: o Enxadrista leva a vantagem. ${txt}.</li>`;
			}
		}
		html += `</ol><p><b>${pj >= 2 ? `${jogador.name} vence!` : "O Enxadrista vence."}</b> ${pj >= 2 ? "Ele agradece e se oferece para jogar de novo." : "Ele concede quantas revanches quiserem, até contra outro personagem."}</p>`;
		await game.user.setFlag("world", `${ESTADO}.xadrez`, x);
		await ChatMessage.create({ content: html, rolls });
	}

	async function macroLaboratorio(D) {
		const ESTADO = "fdtLabirinto";
		const lab = foundry.utils.deepClone(game.user.getFlag("world", `${ESTADO}.lab`) ?? { feitas: 0 });
		const alq = canvas.tokens.controlled.find((t) => t.actor)?.actor;
		const alvo = [...game.user.targets].find((t) => t.actor)?.actor ?? alq;
		const ATR = { for: "Força", des: "Destreza", con: "Constituição", int: "Inteligência", sab: "Sabedoria", car: "Carisma" };
		const opAtr = Object.entries(ATR).map(([k, n]) => `<option value="${k}">${n}</option>`).join("");
		const opPer = Object.entries(D.pericias).filter(([k]) => k !== "ofic").map(([k, n]) => `<option value="${k}">${n}</option>`).join("");
		const ING = D.ingredientes;
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Labirinto · Laboratório de Poções" },
			position: { width: 540 },
			content: `
				<p>Poções feitas: <b>${lab.feitas}/10</b>. Alquimista: <b>${alq?.name ?? "selecione um token"}</b>; quem bebe: <b>${alvo?.name ?? "—"}</b> (o alvo, ou o próprio alquimista).</p>
				<div class="form-group"><label>Ação</label><select name="acao"><option value="fazer">Preparar e usar uma poção ou óleo</option><option value="ofic">Ofício (alquimista) CD 30 para entender as substâncias</option><option value="zerar">Zerar o laboratório</option></select></div>
				<div class="form-group"><label>Perícia do alquimista</label><select name="per"><option value="ofic">Ofício (alquimista)</option><option value="conh">Conhecimento</option></select></div>
				<div class="form-group"><label>Bônus (até dois ajudantes)</label><input type="number" name="mod" value="0"></div>
				<fieldset><legend>Ingredientes (água e óleo não contam)</legend>${Object.entries(ING).map(([k, n]) => `<label style="display:block"><input type="checkbox" name="i_${k}"> ${n}</label>`).join("")}</fieldset>
				<div class="form-group"><label>Ectopasta: atributo (do jogador no sucesso, do Mestre na falha)</label><select name="atr1">${opAtr}</select><select name="atr2">${opAtr}</select></div>
				<div class="form-group"><label>Suco de sapiência: duas perícias</label><select name="per1">${opPer}</select><select name="per2">${opPer}</select></div>
				<p style="font-size:0.85em">Dificuldade: 2d20 + 1d20 por ingrediente + 1d20 por poção que essa pessoa já usou (a nova anula a anterior). Os d20 só são rolados quando a poção é usada. Não dá para escolher 10.</p>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "zerar") return game.user.unsetFlag("world", `${ESTADO}.lab`);
		if (!alq) return ui.notifications.warn("Selecione o token do alquimista (e mire quem bebe, se for outro).");
		const bonus = (a, k) => {
			if (k === "ofic") return Math.max(0, ...Object.entries(a.system.pericias ?? {}).filter(([kk, v]) => kk === "alqu" || (kk.startsWith("ofi") && /alqu/i.test(v?.label ?? ""))).map(([, v]) => Number(v?.value) || 0));
			return Number(a.system.pericias?.[k]?.value) || 0;
		};
		const rolls = [];
		if (res.acao === "ofic") {
			const r = await new Roll(`1d20 + ${bonus(alq, "ofic")}`).evaluate();
			rolls.push(r);
			return ChatMessage.create({ content: `<h3>Laboratório de Poções</h3><p>${alq.name} · Ofício (alquimista) <b>${r.total}</b> contra CD 30: ${r.total >= 30 ? "✔️ cápsulas de magia = PM, substrato de sangue = PV, ectopasta = atributos, suco de sapiência = perícias, raspas de ouro = sorte, pó de adamante = Defesa; água e óleo diluem. Também conhece as regras de dificuldade." : "❌ as substâncias continuam um mistério."}</p>`, rolls, whisper: ChatMessage.getWhisperRecipients("GM") });
		}
		if (lab.feitas >= 10) return ui.notifications.warn("Os ingredientes acabaram: já foram feitas 10 poções.");
		const usados = Object.keys(ING).filter((k) => res[`i_${k}`]);
		if (!usados.length) return ui.notifications.warn("Escolha pelo menos um ingrediente.");
		const previas = Number(alvo.getFlag("world", "fdtPocoes")) || 0;
		const teste = await new Roll(`1d20 + ${bonus(alq, res.per)} + ${Number(res.mod) || 0}`).evaluate();
		const dif = await new Roll(`${2 + usados.length + previas}d20`).evaluate();
		rolls.push(teste, dif);
		const margem = teste.total - dif.total;
		const nivel = margem >= 0 ? "sucesso" : margem <= -10 ? "falha10" : "falha";
		lab.feitas++;
		await alvo.setFlag("world", "fdtPocoes", previas + 1);
		const antigos = alvo.effects.filter((e) => e.getFlag("world", "fdtLab")).map((e) => e.id);
		if (antigos.length) await alvo.deleteEmbeddedDocuments("ActiveEffect", antigos);
		const changes = [];
		const linhas = [];
		const add = (key, v) => changes.push({ key, value: String(v), type: "add", phase: "initial", priority: null });
		for (const k of usados) {
			if (k === "capsulas") {
				const d = await new Roll(nivel === "falha10" ? "2d8" : "1d8").evaluate();
				rolls.push(d);
				const pm = alvo.system.attributes.pm;
				if (nivel === "sucesso") await alvo.update({ "system.attributes.pm.temp": (Number(pm.temp) || 0) + d.total });
				else await alvo.update({ "system.attributes.pm.value": Math.max(0, (Number(pm.value) || 0) - d.total) });
				linhas.push(`Cápsulas de magia: ${nivel === "sucesso" ? `+${d.total} PM temporários` : `perde ${d.total} PM`}`);
			}
			if (k === "sangue") {
				const d = await new Roll(nivel === "falha10" ? "2d12" : "1d12").evaluate();
				rolls.push(d);
				const pv = alvo.system.attributes.pv;
				if (nivel === "sucesso") await alvo.update({ "system.attributes.pv.temp": (Number(pv.temp) || 0) + d.total });
				else await alvo.update({ "system.attributes.pv.value": (Number(pv.value) || 0) - d.total });
				linhas.push(`Substrato de sangue: ${nivel === "sucesso" ? `+${d.total} PV temporários` : `perde ${d.total} PV`}`);
			}
			if (k === "ectopasta") {
				if (nivel === "sucesso") { add(`system.atributos.${res.atr1}.bonus`, 1); linhas.push(`Ectopasta: +1 em ${ATR[res.atr1]} (1 dia)`); }
				else {
					add(`system.atributos.${res.atr1}.bonus`, -1);
					if (nivel === "falha10") add(`system.atributos.${res.atr2}.bonus`, -1);
					linhas.push(`Ectopasta: –1 em ${ATR[res.atr1]}${nivel === "falha10" ? ` e em ${ATR[res.atr2]}` : ""} (recupera 1 por dia)`);
				}
			}
			if (k === "suco") {
				const v = nivel === "sucesso" ? 5 : nivel === "falha" ? -5 : -10;
				add(`system.pericias.${res.per1}.bonus`, v);
				add(`system.pericias.${res.per2}.bonus`, v);
				linhas.push(`Suco de sapiência: ${v > 0 ? "+" : ""}${v} em ${D.pericias[res.per1]} e ${D.pericias[res.per2]}`);
			}
			if (k === "raspas") linhas.push(`Raspas de ouro: ${nivel === "sucesso" ? "pode rolar de novo três testes (1 dia)" : nivel === "falha" ? "é <b>obrigado</b> a rolar de novo três testes escolhidos pelo Mestre" : "é <b>obrigado</b> a rolar de novo seis testes escolhidos pelo Mestre"}`);
			if (k === "adamante") {
				const v = nivel === "sucesso" ? 5 : nivel === "falha" ? -5 : -10;
				add("system.attributes.defesa.bonus", v);
				linhas.push(`Pó de adamante: ${v > 0 ? "+" : ""}${v} na Defesa`);
			}
		}
		if (changes.length) {
			await alvo.createEmbeddedDocuments("ActiveEffect", [{
				name: `Poção do Laboratório de Tanna-Toh (${nivel === "sucesso" ? "sucesso" : "falha"})`,
				img: "systems/tormenta20/icons/itens/gerais/kit-oficio-alquimia.webp",
				type: "base",
				duration: { value: 86400, units: "seconds" },
				description: linhas.join(". ") + ". Penalidades se curam à taxa de 1 por dia (atributos) ou 2 por dia (perícias e Defesa).",
				flags: { world: { fdt: "a2labirinto", fdtLab: true } },
				system: { changes }
			}]);
		}
		const txt = nivel === "sucesso" ? "✔️ <b>sucesso</b>" : nivel === "falha" ? "❌ <b>falha</b>" : "❌ <b>falha por 10 ou mais</b>";
		await ChatMessage.create({ content: `<h3>Laboratório de Poções</h3><p>${alq.name} prepara (${usados.map((k) => ING[k]).join(", ")}); ${alvo.name} usa. Ofício ${teste.total} contra a volatilidade ${dif.total} (${dif.dice[0]?.number ?? 0}d20): ${txt}.</p><ul>${linhas.map((l) => `<li>${l}</li>`).join("")}</ul><p style="font-size:0.85em">${previas ? "A poção anterior de quem bebeu foi anulada. " : ""}Poções feitas: ${lab.feitas}/10.</p>`, rolls });
		await game.user.setFlag("world", `${ESTADO}.lab`, lab);
	}

	async function macroPrensa(D) {
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Labirinto · A Prensa de Tanna-Toh" },
			position: { width: 620, height: 640 },
			content: `
				<p>Marque os <b>10 cadernos</b> que os jogadores escolheram para o livro <i>História e Fatos sobre Arton</i>. Sem testes e sem consultar o cenário: só a memória dos jogadores. Selecione os tokens do grupo.</p>
				<div class="form-group"><label>Ação</label><select name="acao"><option value="livro">Encadernar o livro</option><option value="sair">O grupo saiu do Labirinto (tira a punição dos selecionados)</option></select></div>
				<div style="max-height:380px;overflow-y:auto">${D.cadernos.map((c) => `<label style="display:block"><input type="checkbox" name="c_${c.n}"> <b>${c.n}.</b> ${c.texto}</label>`).join("")}</div>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const punicao = (a) => a.effects.find((e) => e.getFlag("world", "fdtPrensa"));
		if (res.acao === "sair") {
			for (const t of tokens) { const e = punicao(t.actor); if (e) await e.delete(); }
			return ui.notifications.info("Punição de Tanna-Toh removida dos selecionados.");
		}
		const escolhidos = D.cadernos.filter((c) => res[`c_${c.n}`]);
		if (escolhidos.length !== 10) return ui.notifications.warn(`O livro precisa de exatamente 10 cadernos (marcados: ${escolhidos.length}).`);
		const falsos = escolhidos.filter((c) => !c.verdade);
		if (!falsos.length) {
			return ChatMessage.create({ content: "<h3>A Prensa de Tanna-Toh</h3><p>A prensa encaderna o livro, e as duas portas de metal se destravam com um estalo: atrás de uma delas, a <b>Câmara do Helladarion</b>; a outra leva à Ligação.</p>" });
		}
		for (const t of tokens) {
			const e = punicao(t.actor);
			const n = (Number(e?.getFlag("world", "fdtPrensa")) || 0) + 1;
			const dados = {
				name: `Punição de Tanna-Toh (–${2 * n} em perícias)`,
				img: "systems/tormenta20/icons/itens/gerais/livro.webp",
				type: "base",
				description: "Montaram um livro com informações falsas. Vale enquanto estiverem no Labirinto Liberto; sair e voltar mais tarde remove a punição. Cumulativa.",
				flags: { world: { fdt: "a2labirinto", fdtPrensa: n } },
				system: { changes: [{ key: "system.pericias.*.bonus", value: String(-2 * n), type: "add", phase: "initial", priority: null }] }
			};
			if (e) await e.update(dados);
			else await t.actor.createEmbeddedDocuments("ActiveEffect", [dados]);
		}
		await ChatMessage.create({ content: `<h3>A Prensa de Tanna-Toh</h3><p>O livro sai da prensa, mas as portas continuam trancadas. A punição de Tanna-Toh recai sobre ${tokens.length ? tokens.map((t) => t.name).join(", ") : "o grupo (selecione os tokens para aplicar)"}: <b>–2 em todos os testes de perícia</b> (cumulativo) enquanto estiverem no Labirinto.</p>` });
		await ChatMessage.create({ content: `<p>Cadernos falsos no livro: ${falsos.map((c) => c.n).join(", ")}.</p>`, whisper: ChatMessage.getWhisperRecipients("GM") });
	}

	async function macroCriaturas(D) {
		const alvos = [...game.user.targets].filter((t) => t.actor);
		const origem = canvas.tokens.controlled.find((t) => t.actor);
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Labirinto · Criaturas" },
			position: { width: 520 },
			content: `
				<div class="form-group"><label>Efeito</label><select name="acao">
					<option value="aura">Anônimo · Aura de Oblívio (início do turno dos alvos)</option>
					<option value="toque">Anônimo · Apagamento (alvo atingido pelo toque)</option>
					<option value="raio">Bibliotecário · Raio Desintegrador</option>
					<option value="cabra">Bibliotecário · cabra-cega (Fortitude: só 13+ no d20)</option>
					<option value="luz">Metaliano · Raio de Luz</option>
					<option value="espada">Metaliano · Espada da Galáxia (sem RD)</option>
					<option value="borrao">Tigre-de-Hyninn · Borrão (o ataque ou efeito acerta?)</option>
					<option value="soproTigre">Tigre-de-Hyninn primordial · Sopro</option>
					<option value="caca">Rarvnaak · sortear a presa</option>
					<option value="entristecer">Aurumvorax · Entristecer Azgher</option>
					<option value="desespero">Múmias · Desespero (Von 20) / Desespero Superior (Von 42)</option>
					<option value="sopro">Chama Funesta · Sopro</option>
					<option value="imposicao">Chama Funesta · Imposição Avassaladora</option>
					<option value="cuspe">Mímico · Cuspe Material</option>
					<option value="caustica">Bulette · Aura Cáustica</option></select></div>
				<div class="form-group"><label>Borrão: Entre Planos ativo (50%)</label><input type="checkbox" name="entre"></div>
				<div class="form-group"><label>Desespero Superior (senhor das múmias)</label><input type="checkbox" name="superior"></div>
				<div class="form-group"><label>Cabra-cega: aprimoramento da CD (+ no número)</label><input type="number" name="aprim" value="0"></div>
				<p style="font-size:0.85em">Mire os alvos. A criatura de origem é o token selecionado (Entristecer Azgher e Espada da Galáxia precisam dela).</p>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		const semAlvo = ["caca", "entristecer", "borrao"];
		if (!alvos.length && !semAlvo.includes(res.acao)) return ui.notifications.warn("Mire os alvos.");
		const teste = async (a, k) => {
			const r = await new Roll(`1d20 + ${Number(a.system.pericias?.[k]?.value) || 0}`).evaluate();
			rolls.push(r);
			return r.total;
		};
		const apagar = async (a) => {
			const e = a.effects.find((x) => x.getFlag("world", "fdtApagamento"));
			const n = (Number(e?.getFlag("world", "fdtApagamento")) || 0) + 1;
			const dados = {
				name: `Apagamento (–${n} Carisma e –${n} em todos os testes)`,
				img: "systems/tormenta20/icons/magias/alterar-memoria.webp",
				type: "base",
				description: "Carisma perdido para os anônimos. Recupera 1 por dia. Com Carisma –5, a vítima some da história e vira um anônimo.",
				flags: { world: { fdt: "a2labirinto", fdtApagamento: n } },
				system: {
					changes: [
						{ key: "system.atributos.car.bonus", value: String(-n), type: "add", phase: "initial", priority: null },
						{ key: "system.pericias.*.bonus", value: String(-n), type: "add", phase: "initial", priority: null },
						{ key: "system.modificadores.ataque.geral", value: String(-n), type: "add", phase: "initial", priority: null }
					]
				}
			};
			if (e) await e.update(dados);
			else await a.createEmbeddedDocuments("ActiveEffect", [dados]);
			const car = Number(a.system.atributos?.car?.value);
			return Number.isFinite(car) && car <= -5 ? " · <b>Carisma –5: desaparece da história e vira um anônimo!</b>" : "";
		};
		const area = async (titulo, f, k, cd, extra = async () => "") => {
			const d = await new Roll(f).evaluate();
			rolls.push(d);
			let h = `<h3>${titulo}</h3><p>Dano ${d.total}.</p><ul>`;
			for (const t of alvos) {
				const v = await teste(t.actor, k);
				const ok = v >= cd;
				await t.actor.applyDamageV2(d, ok ? 0.5 : 1);
				h += `<li>${t.name}: ${k === "refl" ? "Reflexos" : k === "fort" ? "Fortitude" : "Vontade"} ${v} contra ${cd} ${ok ? "✔️ metade" : "❌ dano total"}${await extra(t, ok)}</li>`;
			}
			return h + "</ul>";
		};
		const chamas = async (t, ok) => {
			if (ok) return "";
			await t.actor.createEmbeddedDocuments("ActiveEffect", [{ name: "Incendiado (em chamas)", img: "icons/magic/fire/flame-burning-embers-yellow.webp", type: "base", statuses: ["emchamas"], description: "1d6 de fogo no início de cada turno. Ação padrão para apagar.", flags: { world: { fdt: "a2labirinto" } }, system: { changes: [{ key: "danoContinuo", value: "1d6[fogo]", type: "custom", phase: "initial", priority: null }] } }]);
			return ", em chamas";
		};
		let html = "";
		switch (res.acao) {
			case "aura":
				html = "<h3>Aura de Oblívio</h3><ul>";
				for (const t of alvos) {
					const d = await new Roll("6d6[frio]").evaluate();
					rolls.push(d);
					const v = await teste(t.actor, "fort");
					const ok = v >= 28;
					await t.actor.applyDamageV2(d, ok ? 0.5 : 1);
					let txt = `${t.name}: Fortitude ${v} contra 28 ${ok ? "✔️ metade" : "❌"} (${d.total} de frio)`;
					if (ok) await t.actor.setFlag("world", "fdtOblivio", true);
					else if (!t.actor.getFlag("world", "fdtOblivio")) txt += `, perde 1 de Carisma${await apagar(t.actor)}`;
					html += `<li>${txt}</li>`;
				}
				html += "</ul><p style=\"font-size:0.85em\">Quem passa fica imune à perda de Carisma desta aura nesta cena (a marca fdtOblivio fica no ator; apague ao fim da cena).</p>";
				break;
			case "toque":
				html = "<h3>Apagamento</h3><ul>";
				for (const t of alvos) {
					const v = await teste(t.actor, "vont");
					html += `<li>${t.name}: Vontade ${v} contra 28 ${v >= 28 ? "✔️ evita" : `❌ perde 1 de Carisma${await apagar(t.actor)}`}</li>`;
				}
				html += "</ul>";
				break;
			case "raio":
				html = "<h3>Raio Desintegrador</h3><ul>";
				for (const t of alvos) {
					const d = await new Roll("20d12").evaluate();
					rolls.push(d);
					const v = await teste(t.actor, "fort");
					const ok = v >= 46;
					const perda = ok ? Math.floor(d.total / 2) : d.total;
					await t.actor.update({ "system.attributes.pv.value": (Number(t.actor.system.attributes.pv.value) || 0) - perda });
					if (!ok) await t.actor.toggleStatusEffect("enjoado", { active: true });
					html += `<li>${t.name}: Fortitude ${v} contra 46 ${ok ? "✔️" : "❌ enjoado"} · perde <b>${perda} PV</b></li>`;
				}
				html += "</ul>";
				break;
			case "cabra": {
				const precisa = 13 + (Number(res.aprim) || 0);
				html = `<h3>A cabra-cega contra os bibliotecários</h3><p>Precisam de <b>${precisa}+</b> no d20.</p><ul>`;
				for (const t of alvos) {
					const r = await new Roll("1d20").evaluate();
					rolls.push(r);
					if (r.total >= precisa) html += `<li>${t.name}: ${r.total} ✔️ resiste e continua vendo tudo</li>`;
					else {
						await t.actor.toggleStatusEffect("cego", { active: true });
						await t.actor.toggleStatusEffect("surdo", { active: true });
						html += `<li>${t.name}: ${r.total} ❌ <b>cego e surdo</b>: não nota mais os intrusos</li>`;
					}
				}
				html += "</ul>";
				break;
			}
			case "luz":
				html = await area("Raio de Luz (esfera de 3m)", "6d6+20[fogo]", "refl", 33, chamas);
				break;
			case "espada": {
				html = "<h3>Espada da Galáxia</h3><ul>";
				for (const t of alvos) {
					const d = await new Roll("4d12+20[corte]", {}, { rd: 999 }).evaluate();
					rolls.push(d);
					await t.actor.applyDamageV2(d, 1);
					html += `<li>${t.name}: ${d.total} de corte, ignorando toda RD</li>`;
				}
				html += "</ul>";
				break;
			}
			case "borrao": {
				const chance = res.entre ? 50 : 25;
				const r = await new Roll("1d100").evaluate();
				rolls.push(r);
				html = `<h3>Borrão</h3><p>${r.total} em 1d100 (${chance}%): ${r.total <= chance ? "<b>o tigre não está bem ali</b>: o ataque ou efeito o ignora." : "acerta normalmente."}</p>`;
				break;
			}
			case "soproTigre":
				html = await area("Sopro do tigre primordial (cone de 6m)", "6d8[psiquico]", "vont", 31, async (t, ok) => {
					if (ok) return "";
					const r = await new Roll("1d3").evaluate();
					rolls.push(r);
					await t.actor.toggleStatusEffect("confuso", { active: true });
					return `, confuso por ${r.total} rodada(s)`;
				});
				break;
			case "caca": {
				const pjs = canvas.tokens.placeables.filter((t) => t.actor?.type === "character");
				if (!pjs.length) return ui.notifications.warn("Ponha os tokens do grupo na cena.");
				const r = await new Roll(`1d${pjs.length}`).evaluate();
				rolls.push(r);
				html = `<h3>Caçada Implacável</h3><p>O caçador invisível escolhe sua presa: <b>${pjs[r.total - 1].name}</b>. +5 em ataque e dano contra ela (marque na janela de ataque); sabe sempre a distância e a direção.</p>`;
				await ChatMessage.create({ content: html, rolls, whisper: ChatMessage.getWhisperRecipients("GM") });
				return;
			}
			case "entristecer": {
				const a = origem?.actor;
				if (!a) return ui.notifications.warn("Selecione o aurumvorax.");
				const r = await new Roll("5d10").evaluate();
				rolls.push(r);
				await a.update({ "system.attributes.pv.temp": (Number(a.system.attributes.pv.temp) || 0) + 10 });
				html = `<h3>Entristecer Azgher</h3><p>${a.name} devora até <b>${r.total} TO</b> de ouro (ou um item de ouro de até 1 espaço) e ganha <b>10 PV temporários</b>.</p>`;
				break;
			}
			case "desespero": {
				const cd = res.superior ? 42 : 20;
				html = `<h3>${res.superior ? "Desespero Superior" : "Desespero"}</h3><ul>`;
				for (const t of alvos) {
					if (t.actor.getFlag("world", "fdtDesespero")) { html += `<li>${t.name}: já resistiu nesta cena.</li>`; continue; }
					const v = await teste(t.actor, "vont");
					if (v >= cd) { await t.actor.setFlag("world", "fdtDesespero", true); html += `<li>${t.name}: Vontade ${v} contra ${cd} ✔️ imune até o fim da cena</li>`; }
					else { await t.actor.toggleStatusEffect("apavorado", { active: true }); html += `<li>${t.name}: Vontade ${v} contra ${cd} ❌ <b>apavorado</b></li>`; }
				}
				html += "</ul>";
				break;
			}
			case "sopro":
				html = await area("Sopro de Chama Funesta (cone de 12m)", "12d12[fogo]", "refl", 32, chamas);
				break;
			case "imposicao":
				html = await area("Imposição Avassaladora", "4d12[psiquico]", "vont", 32);
				break;
			case "cuspe":
				html = await area("Cuspe Material (cone de 6m)", "6d4+6[perfuracao]", "refl", 22);
				break;
			case "caustica": {
				const d = await new Roll("4d6[acido]").evaluate();
				rolls.push(d);
				html = `<h3>Aura Cáustica</h3><p>${d.total} de ácido em cada adjacente:</p><ul>`;
				for (const t of alvos) { await t.actor.applyDamageV2(d, 1); html += `<li>${t.name}</li>`; }
				html += "</ul>";
				break;
			}
		}
		if (html) await ChatMessage.create({ content: html, rolls });
	}

	async function macroProgresso(D) {
		const ESTADO = "fdtLabirinto";
		const pr = foundry.utils.deepClone(game.user.getFlag("world", `${ESTADO}.progresso`) ?? { helladarion: [] });
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		const pjs = game.actors.filter((a) => a.type === "character");
		const temItem = (role) => pjs.some((a) => a.items.some((i) => i.getFlag("world", "fdt") === "a2labirinto" && i.getFlag("world", "fdtRole") === role));
		const chaves = [1, 2, 3].filter((n) => temItem(`chave${n}`));
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Labirinto · Progresso e Chaves" },
			position: { width: 540 },
			content: `
				<p>Chaves Tríplices com o grupo: <b>${chaves.length ? chaves.join(", ") : "nenhuma"}</b> de 3. Livro da genealogia: <b>${temItem("livro") ? "sim" : "não"}</b>. Cabra-cega: <b>${temItem("cabraCega") ? "com o grupo" : "na Sala 14"}</b>. Perguntas ao Helladarion: ${pr.helladarion.length}.</p>
				<div class="form-group"><label>Ação</label><select name="acao">
					<option value="chave">Entregar uma Chave Tríplice ao primeiro selecionado</option>
					<option value="porta">Abrir a porta do covil (subnível de Hyninn)</option>
					<option value="helladarion">Pergunta ao Helladarion (o primeiro selecionado pergunta)</option>
					<option value="ovos">Matemáticos: conferir a resposta dos ovos</option>
					<option value="genealogia">Cemitério de Reis: recitar a linhagem sar-allan</option>
					<option value="cabraPegar">Levar a armadilha da cabra-cega (Força 15 ou Ladinagem 25)</option>
					<option value="zerar">Zerar perguntas do Helladarion</option></select></div>
				<div class="form-group"><label>Qual chave</label><select name="chave"><option value="1">Chave 1 (Tesouro Infinito, Hyninn)</option><option value="2">Chave 2 (Biblioteca Proibida, Tanna-Toh)</option><option value="3">Chave 3 (Cemitério de Reis, Azgher)</option></select></div>
				<div class="form-group"><label>Resposta dos jogadores (ovos)</label><input type="number" name="ovos" value="0"></div>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		let html = "";
		let publico = true;
		const modelo = (role) => game.items.find((i) => i.getFlag("world", "fdt") === "a2labirinto" && i.getFlag("world", "fdtRole") === role);
		const entregar = async (role, a) => {
			const it = modelo(role);
			if (!it || !a) return false;
			await a.createEmbeddedDocuments("Item", [it.toObject()]);
			return true;
		};
		switch (res.acao) {
			case "chave": {
				const a = tokens[0]?.actor;
				if (!a) return ui.notifications.warn("Selecione quem pega a chave.");
				await entregar(`chave${res.chave}`, a);
				html = `<p>${a.name} pega a <b>Chave Tríplice ${res.chave}</b>.</p>`;
				break;
			}
			case "porta":
				if (chaves.length < 3) { html = `<h3>A porta de três fechaduras</h3><p>A porta dupla de metal, cercada de cristais, não cede a nenhum meio físico ou mágico. Faltam ${3 - chaves.length} chave(s).</p>`; break; }
				html = "<h3>A porta de três fechaduras</h3><p>As três Chaves Tríplices giram juntas e a porta se abre para o <b>covil de Chama Funesta</b>: uma caverna imensa de teto altíssimo, um rio de lava e o dragão sobre o tesouro.</p>";
				break;
			case "helladarion": {
				const a = tokens[0]?.actor;
				if (!a) return ui.notifications.warn("Selecione quem pergunta.");
				if (pr.helladarion.includes(a.id)) { html = `<p><i>"Lamento, ${a.name}. Somente uma pergunta de cada um."</i> O Helladarion não pode abrir exceções.</p>`; break; }
				pr.helladarion.push(a.id);
				const faltam = pjs.filter((p) => !pr.helladarion.includes(p.id) && p.hasPlayerOwner);
				html = `<p>O Helladarion responde à pergunta de <b>${a.name}</b>.${faltam.length ? "" : " Ele fica um pouco mais esmaecido e se cala; ecos da voz dele falam com alguém que não está ali."}</p>`;
				break;
			}
			case "ovos":
				html = Number(res.ovos) === 7
					? "<h3>A Tumba dos Matemáticos</h3><p>Uma nova inscrição se forma: <i>\"Os nobres do Deserto da Perdição exigem ser reconhecidos. Apenas quem conhece sua linhagem será poupado de sua fúria.\"</i> Os sarcófagos se abrem e revelam o tesouro.</p>"
					: `<h3>A Tumba dos Matemáticos</h3><p>${Number(res.ovos) || 0} ovos... Nada acontece. (Azgher não gosta de charadas: ovos são ovos.)</p>`;
				break;
			case "genealogia":
				if (!temItem("livro")) { html = "<h3>Cemitério de Reis</h3><p>Sem o livro da genealogia, ninguém sabe responder: <i>\"Quem sou eu? De onde venho? A quem pertenço?\"</i> As múmias continuam atacando.</p>"; break; }
				html = "<h3>Cemitério de Reis</h3><p>A linhagem dos reis sar-allan ecoa na câmara. Com uma resposta sobre suas origens, as múmias voltam a seus lugares de descanso e o rei fecha o sarcófago por dentro. O tesouro e a <b>Chave Tríplice 3</b> estão livres.</p>";
				break;
			case "cabraPegar": {
				const a = tokens[0]?.actor;
				if (!a) return ui.notifications.warn("Selecione quem tenta levar o mecanismo.");
				const f = await new Roll(`1d20 + ${Number(a.system.atributos?.for?.value) || 0}`).evaluate();
				const l = await new Roll(`1d20 + ${Number(a.system.pericias?.ladi?.value) || 0}`).evaluate();
				rolls.push(f, l);
				const ok = f.total >= 15 || l.total >= 25;
				if (ok) await entregar("cabraCega", a);
				html = `<h3>A armadilha da cabra-cega</h3><p>${a.name}: Força ${f.total} (CD 15) ou Ladinagem ${l.total} (CD 25): ${ok ? "✔️ o mecanismo sai do piso e vai para a mochila." : "❌ continua preso ao piso."}</p>`;
				break;
			}
			case "zerar":
				pr.helladarion = [];
				html = "<p>Perguntas do Helladarion zeradas.</p>";
				publico = false;
				break;
		}
		await game.user.setFlag("world", `${ESTADO}.progresso`, pr);
		if (html) await ChatMessage.create({ content: html, rolls, ...(publico ? {} : { whisper: ChatMessage.getWhisperRecipients("GM") }) });
	}

	const macro = (name, img, fn, dados = null) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Arco 2 · O Labirinto Liberto · gerado por a2-labirinto-liberto.js\n${dados ? `const DADOS = ${JSON.stringify(dados)};\n` : ""}(${fn.toString()})(${dados ? "DADOS" : ""});`
	});
	const ENTRADAS_MACRO = Object.fromEntries(Object.entries(ENTRADAS).map(([k, e]) => [k, e]));
	const INGREDIENTES = { capsulas: "Cápsulas de magia (PM)", sangue: "Substrato de sangue (PV)", ectopasta: "Ectopasta (atributo)", suco: "Suco de sapiência (perícias)", raspas: "Raspas de ouro (sorte)", adamante: "Pó de adamante (Defesa)" };
	const macros = await Macro.createDocuments([
		macro("Labirinto · Busca pela Entrada", "icons/svg/ruins.svg", macroBusca, { pericias: PERICIAS, entradas: ENTRADAS_MACRO }),
		macro("Labirinto · Exploração", "icons/svg/eye.svg", macroExploracao, { encontros: ENCONTROS, reacoes: REACOES, nomes: NOMES, modos: MODOS, ruidos: RUIDOS }),
		macro("Labirinto · Escuridão", `${MG}/escuridao.webp`, macroEscuridao),
		macro("Labirinto · Entradas", `${MG}/compreensao.webp`, macroEntradas, { entradas: ENTRADAS_MACRO, pecados: PECADOS }),
		macro("Labirinto · Armadilhas", "icons/svg/trap.svg", macroArmadilhas, { armadilhas: ARMADILHAS }),
		macro("Labirinto · Tesouro Infinito", ICO.ouro, macroTesouro, { chave: L(chave1) }),
		macro("Labirinto · Enxadrista", `${GE}/baralho.webp`, macroEnxadrista, { pistas: PISTAS, semResgate: PISTA_SEM_RESGATE }),
		macro("Labirinto · Laboratório de Poções", `${GE}/kit-oficio-alquimia.webp`, macroLaboratorio, { pericias: PERICIAS, ingredientes: INGREDIENTES }),
		macro("Labirinto · Prensa de Tanna-Toh", ICO.livro, macroPrensa, { cadernos: CADERNOS }),
		macro("Labirinto · Criaturas", "icons/svg/blood.svg", macroCriaturas),
		macro("Labirinto · Progresso e Chaves", ICO.chave, macroProgresso)
	]);
	const linkMacro = (trecho) => {
		const m = macros.find((x) => x.name.includes(trecho));
		return m ? `@UUID[${m.uuid}]{${m.name}}` : trecho;
	};

	/* ------------------------------------------------------------------ */
	/* 7. Diário                                                            */
	/* ------------------------------------------------------------------ */
	const pagina = (name, content, sort) => ({ name, type: "text", sort, text: { content, format: 1 } });
	const sala = (titulo, ...linhas) => `<h3>${titulo}</h3>${p(...linhas)}`;
	const arm = (k) => `<b>Armadilha: ${ARMADILHAS[k].nome}</b>${ARMADILHAS[k].nd ? ` (ND ${ARMADILHAS[k].nd})` : ""}. ${ARMADILHAS[k].efeito} Detectar: ${ARMADILHAS[k].det}.`;
	const PORTA_FERRO = "<b>Porta:</b> porta de ferro (Defesa 8, RD 10, 100 PV, CD 25; derrubar é ruído estrondoso).";
	const CIRCULO = (cor, deus, destino) => `Um círculo mágico no chão brilha com luz ${cor}. Misticismo CD 25: passagem mágica; Religião CD 25: símbolos de ${deus}; Misticismo CD 35: não foi feito de propósito, formou-se pela influência dos deuses e do espaço de masmorra. Entrar no círculo leva à ${destino}.`;
	const PJ = (k) => L(atores[k]);

	await JournalEntry.create({
		name: "Arco 2 · O Labirinto Liberto",
		folder: pasta.JournalEntry,
		flags: FLAGS(),
		pages: [
			pagina("Guia do Mestre", `
				<h2>Resumo</h2>
				<p>Depois da Libertação de Valkaria, algumas câmaras do grande labirinto dentro da estátua perderam parte da conexão divina e ficaram mais perto de Hyninn. Rachaduras, infestações e "acasos" criaram um <b>espaço de masmorra</b> dentro da estátua, e três complexos foram arrastados para lá: um de <b>Hyninn</b>, um de <b>Tanna-Toh</b> e um de <b>Azgher</b>, ligados por passagens. É "o Labirinto Liberto".</p>
				<p>O Labirinto não tolera missões grandiosas: grupos altruístas (destruir um mal, achar um artefato, honrar Valkaria) ficam presos até morrer. Quem entra por <b>ambição</b> (riquezas, itens, curiosidade, vencer o Labirinto porque ele está lá) se dá melhor. A outra recompensa é o <b>autoconhecimento</b>: o Labirinto guarda informações sobre os próprios aventureiros. Espalhe isso como boato; mistérios de histórico podem ter resposta só aqui. Na mesa original, a busca pela mãe de Kiki foi o empurrão.</p>
				<p>As três masmorras não são lineares: são caminhos opcionais até o objetivo final, o covil do dragão vermelho <b>Chama Funesta</b>, atrás de uma porta que só as três <b>Chaves Tríplices</b> abrem. Dá para entrar por qualquer das três entradas, sair, descansar e voltar.</p>
				<h2>Estilo anos 70</h2>
				<ul>
					<li>Carga, rações, tochas e óleo contados de verdade, e tudo pago e anotado na ficha. A contabilidade é dos jogadores: um cuida das tochas, outro das rações, outro dos segmentos.</li>
					<li>Encontros devem ser <b>vencidos</b>, não necessariamente combatidos. Os habitantes têm objetivos e uma tabela de reações.</li>
					<li>Enigmas são para os <b>jogadores</b>. Se o jogador da bárbara decifrou o código, deixe-o falar.</li>
					<li>Não é a Libertação de Valkaria nem o palco para os heróis parecerem invencíveis: é só uma masmorra. O cavaleiro pomposo pode ser arremessado por uma armadilha e a ladina espertalhona enganada por um duplo.</li>
				</ul>
				<h2>Sequência de rolagens</h2>
				<ol>
					<li>Achar uma entrada: ${linkMacro("Busca")}. Resolver o desafio da entrada: ${linkMacro("Entradas")}.</li>
					<li>Ligue ${linkMacro("Escuridão")} na cena.</li>
					<li>Em toda sala sem criaturas definidas: ${linkMacro("Exploração")} (1d20 + ruído em ${L(tabEncontros)}, reação em ${L(tabReacoes)}, tokens ocultos e segmentos de cena).</li>
					<li>Armadilhas e perigos fixos: ${linkMacro("Armadilhas")} e ${linkMacro("Tesouro Infinito")}. Habilidades das criaturas: ${linkMacro("Criaturas")}.</li>
					<li>Desafios: ${linkMacro("Enxadrista")}, ${linkMacro("Laboratório")}, ${linkMacro("Prensa")} e ${linkMacro("Progresso")} (chaves, Helladarion, matemáticos, genealogia, cabra-cega).</li>
				</ol>
				<h2>Fichas</h2>
				<ul>
					<li>Errantes: ${PJ("soldado")}, ${PJ("trilha")}, ${PJ("mantor")}, ${PJ("aurumvorax")}, ${PJ("metaliano")}, ${PJ("tigre")}, ${PJ("primordial")}.</li>
					<li>Hyninn: ${PJ("mimico")}, ${PJ("duplo")}. Tanna-Toh: ${PJ("anonimo")} (×3), ${PJ("rarvnaak")}, ${PJ("bibliotecario")} (×4). Azgher: ${PJ("bulette")}, ${PJ("mumia")} (×6), ${PJ("senhor")}. Covil: ${PJ("dragao")}.</li>
					<li>Itens: ${L(itEspada)}, ${L(chave1)}, ${L(chave2)}, ${L(chave3)}, ${L(itLivro)}, ${L(itCabra)}. Parceiros: ${L(itCarregador)} e ${L(itBesta)}.</li>
				</ul>
				<h2>Tesouros</h2>
				<p>Todo tesouro por ND é rolado na Tabela 8-1 (Tormenta20, pp. 328-329). O covil de Chama Funesta garante <b>dois itens mágicos</b>; a campanha quer itens mágicos rolados ao acaso, então permita recursos para rolar de novo e trocas com NPCs (Blixto, Felicia Daratramm, nobres), mas não deixe escolher itens.</p>`, 100),
			pagina("Regras da Masmorra", `
				<h3>Luz e escuridão</h3>
				<p>Escuridão total. Luz mágica e mundana funcionam <b>normalmente</b>; <b>visão no escuro e na penumbra não funcionam</b> (truque de Hyninn). Não descreva nada além do que a luz mostra: fora dela, o personagem está <b>cego</b>. A maioria das fontes de luz dura uma cena.</p>
				<h3>Ruído</h3>
				<p>Conhecimento, Ofício (engenheiro) ou Sobrevivência CD 15 revelam que qualquer ruído atrai monstros. Depois do primeiro inimigo atraído assim, quem é treinado nessas perícias percebe sozinho; os outros, Inteligência CD 10.</p>
				<ul>
					<li><b>Silencioso (–1):</b> sem falar, metade do deslocamento e Furtividade CD 20 de todos.</li>
					<li><b>Padrão (+0):</b> conversa baixa, passos normais.</li>
					<li><b>Barulhento (+2):</b> falar alto, discutir, Música de bardo, arrombar porta ou baú na força.</li>
					<li><b>Estrondoso (+5):</b> várias habilidades barulhentas, uma Bola de Fogo numa porta trancada.</li>
				</ul>
				<p>Combate é barulhento ou estrondoso; combates muito táticos (Ataque Furtivo, magias que calam os inimigos) podem ser padrão, nunca silenciosos. A besta de carga sobe uma categoria.</p>
				<h3>Encontros e reações</h3>
				<p>Criaturas com covil (ninho dos mirminoides, o mímico...) estão sempre lá, se vivas. Em toda sala sem criaturas definidas, role 1d20 + ruído em ${L(tabEncontros)}. Ao encontrar um habitante cuja ação a sala não descreve, role em ${L(tabReacoes)}: <b>1d6 + Carisma</b> do personagem mais próximo (o menor, em empate). Se o grupo notou primeiro e dialogou: teste social (Diplomacia, Enganação ou Intimidação), cada 5 pontos vale um resultado.</p>
				<p>Mirminoides e metalianos usam a tabela, mas o grupo precisa decifrar a linguagem não verbal deles. Aurumvorax, mantor e tigres usam a tabela e fogem nos resultados de conversa ou colaboração (os tigres ignoram também resultados que descrevam reações visíveis em detalhes). Só existem <b>dois metalianos</b>: um fixo na Sala 18 de Hyninn, outro na tabela; se os dois já apareceram, ignore novas aparições.</p>
				<h3>Duração de cenas: segmentos</h3>
				<p>Uma cena dura <b>6 segmentos</b> ("risquinhos" que um jogador anota). O Mestre avisa cada segmento:</p>
				<ul>
					<li><b>Ação curta (1):</b> passar por um corredor (conta ao sair), explorar um corredor (Investigação, Percepção atrás da porta, rastros).</li>
					<li><b>Ação longa (2):</b> passar por uma sala, explorar uma sala, cuidados prolongados, identificar um item, montar acampamento.</li>
					<li><b>Ação muito longa (6):</b> algumas horas, uma manhã, tarde ou noite.</li>
				</ul>
				<p>Ao fim da cena, efeitos de cena terminam e as luzes precisam ser renovadas.</p>
				<h3>Recursos</h3>
				<p>Cada noite de sono exige uma ração por personagem (e parceiro); sem rações, Fome e Sede (Tormenta20, p. 319). Falhar por 5 ou mais em Ladinagem para abrir fechaduras <b>quebra a gazua</b> (sem gazua, quebra a fechadura, que não abre mais com Ladinagem). Corda deixada presa não volta.</p>
				<h3>Carregadores</h3>
				<p>${L(itCarregador)} e ${L(itBesta)}: parceiros contratados pela exploração inteira por T$ 90 (iniciante), T$ 450 (veterano) ou T$ 900 (mestre, exceção para seguradores de tochas). Coadjuvantes já vistos, ou criados pelos jogadores com nome e personalidade, custam metade. Decida se são vulneráveis em combates e armadilhas (na mesa original eram efetivamente imortais).</p>
				<h3>Magia no Labirinto</h3>
				<p>Teletransporte e magias para burlar o Labirinto não funcionam, nem para entrar ou sair. Adivinhação funciona, mas não contra a escuridão nem para ver através de portas e paredes: Lendas e Histórias sim, Vidência na sala seguinte não.</p>`, 200),
			pagina("Chegando ao Labirinto", `
				<p>Na mesa original, o grupo sabia que a mãe de Kiki estava em Valkaria e concluiu que havia uma masmorra na cidade. O difícil é saber onde fica e diferenciá-la das outras masmorras da capital.</p>
				<h3>Achar uma entrada</h3>
				<p>Com a localização aproximada, teste estendido aberto de <b>Investigação</b>: CD 20, <b>7 sucessos</b>, +2 na CD a cada teste. Outras perícias justificáveis valem, mas não repetem (só Investigação). Cada teste leva meio dia. Cada falha custa <b>1d4 PM</b>, que só voltam ao achar a entrada ou ao fim da aventura; uma falha total deixa os personagens <b>alquebrados</b> pela mesma duração e o teste recomeça. Pode incluir encontros em Valkaria enquanto procuram. Outras ideias (delegar, mapas, perguntar ao Helladarion na Biblioteca das Duas Deusas) podem dispensar o teste; cada NPC contatado pode valer um sucesso. Use ${linkMacro("Busca")}.</p>
				<h3>Quem conhece o Labirinto</h3>
				<ul>
					<li>Wynstar (só com um Alvará de Exploração de Masmorras Urbanas).</li>
					<li>Os goblins da Gazeta do Reinado.</li>
					<li>Anatole (30% de chance de informação errada).</li>
					<li>O Avatar da Cidade (vale três sucessos).</li>
					<li>Qualquer membro do Clube de Cavalheiros.</li>
					<li>Justine, Berthun, Torzogh Meio-Machado, Brunhilda e Janara.</li>
					<li>Tilliann (apaziguado com bastante interpretação).</li>
					<li>Aldanna Elbannise (só se tirada do torpor mental).</li>
				</ul>
				<h3>As três entradas</h3>
				<p>Cada uma ligada a um deus, sem símbolos explícitos. Personagens treinados em Religião têm direito a um teste (peça mesmo que ninguém pense nisso): <b>25</b> revela algo divino; <b>30</b> dá uma dica a interpretar; <b>40</b> revela o deus. O desafio continua sendo dos jogadores. Use ${linkMacro("Entradas")}.</p>
				${Object.values(ENTRADAS).map((e) => `<h4>${e.nome}</h4><p>${e.texto}</p><p class="secret"><b>Dica (Religião 30):</b> ${e.dica}<br><b>Solução:</b> ${e.solucao}<br><b>Chegada:</b> ${e.chegada}.</p>`).join("")}
				<h4>Hierarquia de pecados de Azgher</h4>
				<p class="secret"><b>Leves (1):</b> não agradecer ao sol, não doar ouro, mostrar o rosto. <b>Médios (2):</b> roubar ouro, esconder a verdade, mentir/enganar, ajudar ladrões e trapaceiros. <b>Graves (3):</b> ser inclemente, praticar o mal/combater o bem, cultuar Tenebra.</p>`, 300),
			pagina("Masmorra de Hyninn", `
				<p><i>Apertada, labiríntica, úmida e cheia de rachaduras: a mais "típica" das três.</i></p>
				${sala("Sala 1 · Área de Entrada A", "Uma escadaria num espaço exíguo, aberto para os dois lados. Não é saída: não abre pelo lado de dentro.")}
				${sala("Sala 2 · Passagem para Tanna-Toh", "Sala aberta, parcialmente tomada de escombros.", CIRCULO("roxa", "Tanna-Toh", "Sala 5 de Tanna-Toh"))}
				${sala("Sala 3 · Covil do Mímico", `Uma grande e vistosa estante de livros: ${PJ("mimico")}. Os títulos mudam para os mais atraentes a cada vítima.`)}
				${sala("Sala 4 · A \"Prisão\" do Duplo", `Porta de ferro trancada (Defesa 8, RD 10, 100 PV, CD 25; derrubar é estrondoso). Dentro, acorrentado e indefeso, alguém do passado do grupo: ${PJ("duplo")}. Enganação +34 para se passar pela pessoa.`)}
				${sala("Salas 5 e 6 · Ninho dos Mirminoides", `A passagem central da masmorra, defendida com a vida. Não atacam à primeira vista, mas ficam extremamente agressivos se o espaço for violado. Passam ao largo das armadilhas. Temem os metalianos.`, arm("abismo"), `<b>Criaturas:</b> ${PJ("trilha")} e ${PJ("soldado")} ×4. <b>Tesouro:</b> ND 10 ×2 (uma rolagem em dinheiro em cada baú, ignorando resultados menores que 15).`)}
				${sala("Sala 7 · Passagem-Truque", "Sala trancada que parece só esconder um buraco para um túnel. Percepção CD 15: um rugido baixo vem de dentro. O truque é duplo: o túnel não tem armadilha e leva ao tesouro da Sala 16.", PORTA_FERRO)}
				${sala("Sala 8 · Armadilha de Pedra Porosa", "Parece só uma parede irregular. Lá dentro, esqueletos de um humano, um qareen e um goblin, ladinos ou bardos (sinal do tipo de armadilha), e o tesouro que deixaram.", arm("porosa"), "<b>Tesouro:</b> ND 6 (três rolagens, só itens).")}
				${sala("Salas 9 e 13 · Névoa Transportadora", "Tomadas de névoa: impossível enxergar qualquer detalhe, mesmo com Percepção ou Investigação.", arm("nevoa"))}
				${sala("Sala 10 · Sala do Enxadrista", `Porta de ferro trancada. Dentro, uma mesinha com tabuleiro e um hynne de aparência indistinta, um construto planar do Reino de Hyninn: <i>"Eu sou o Enxadrista e só existo para o xadrez. Se quiserem uma pista, entre só um de vocês!"</i> Só cabe um (ou dois Pequenos, ou uma sílfide), de porta fechada.`,
					`Três testes opostos (Guerra, Jogatina, Nobreza ou outra; roubar é Ladinagem) contra Ladinagem +15 do Enxadrista; quem vencer dois ganha. Cada teste vencido dá uma pista de ${L(tabPistas)}; cada teste perdido tira 10 PM (ou 10 PV, sem PM) de um companheiro do lado de fora, sorteado. Revanches à vontade. Use ${linkMacro("Enxadrista")}.`)}
				${sala("Sala 11 · Passagem para Azgher", "Sala aberta, nada notável.", CIRCULO("amarela", "Azgher", "Sala 6 de Azgher"))}
				${sala("Sala 12 · Armadilha Dupla (ou Tripla)", "Quase um corredor: Runas de Aceleração nos extremos noroeste e sudeste (passagens para perto das Salas 17 e 11), ambas empurrando para o meio, onde fica a Runa de Desintegração.", arm("aceleracao"), arm("desintegracao"))}
				${sala("Sala 14 · Armadilha da Cabra-Cega", "Aparentemente vazia. Manchas que escorreram pela pedra (não é sangue) e garranchos em valkar, um por cima do outro. Ofício (escriba) ou Inteligência CD 20: escritos de alguém que não enxergava, apagados por algo. Inteligência CD 15 revela as frases: <i>\"Não vá para a esquerda\"</i> (falando da Sala 13), <i>\"Não se aproxime\"</i> e <i>\"Reto, esquerda, direita, escada\"</i> (o oposto, para chegar à Sala 15).",
					arm("cabraCega"), `Misticismo, Religião ou similar: não é uma armadilha comum, não pode ser anulada por efeitos que anulam magia, e experimentos mostram que afeta os habitantes. É a ferramenta contra os bibliotecários: ${L(itCabra)}.`)}
				${sala("Sala 15 · Escadaria", "Uma escada desce ao subnível.")}
				${sala("Sala 16 · Truque Inofensivo", "Ampla e danificada, acessível pela Sala 7 e por uma passagem na 17. Manchas de \"sangue\", ossos, rugido baixo e cheiro de pelo: um covil perigoso... de brincadeira. Um engenho faz o ruído, ervas imitam o cheiro, os ossos são de gesso e o sangue é tinta (Cura, Ofício alquimista, Percepção ou Sobrevivência CD 30). Atrás de um pedregulho, perto da máquina: <i>\"Surpresa!\"</i>. Bem típico de Hyninn.",
					"<b>Tesouro:</b> ND 10 (uma rolagem em dinheiro ignorando 1 a 10, uma rolagem em itens).")}
				${sala("Sala 17 · Antecâmara do Tesouro", "Passagem sem nada de especial, boa para descansar antes de abrir a porta da Sala 19.")}
				${sala("Sala 18 · Troféus do Metaliano", `Um beco sem saída decorado com crânios de humanos, elfos, hynne, kliren e outros, cabeças de mirminoides e uma pele de mantor. Guerra, Religião ou Sobrevivência CD 20: não é altar, é sala de troféus. Uma cadeira improvisada, riquezas e equipamentos em ordem, e escritos entalhados numa língua desconhecida (Compreensão revela).`,
					`Se o grupo não fez ruído acima de padrão e não achou o metaliano de outro jeito, ${PJ("metaliano")} está aqui, invisível. Não tolera intrusos no seu minúsculo domínio, mas pode conversar. <b>Tesouro:</b> ND 9 (só itens).`)}
				${sala("Sala 19 · Armadilha de Tesouro Infinito", `Pesada porta de ferro com baixos-relevos de raposas, adagas e bufões (Defesa 10, RD 10, 200 PV, CD 35). Atrás, ouro do chão ao teto, que desaba e não para de jorrar. Percepção, Ladinagem ou Misticismo CD 25: é infinito. O ouro é verdadeiro, mas some quando sai da masmorra.`,
					"<b>Tesouro Infinito:</b> Reflexos CD 30 a cada rodada na sala; falha, agarrado; uma rodada inteira agarrado, submerso (sufocamento). Atletismo CD 25 (ação completa) sobe um passo (submerso → agarrado → livre); falhar por 5 ou mais: fatigado, exausto, inconsciente.",
					`Fechar a porta é Força estendida (CD 20, 3 sucessos) em <b>10 rodadas</b>. Depois disso, a cada 10 rodadas mais uma sala é tomada (terreno difícil; a anterior fica interditada). Desintegrar ouro dá uma rodada a mais. A única forma de deter a torrente é um ${PJ("aurumvorax")} devorando o ouro até a saída: uma caverna com uma porta e um pedestal com a ${L(chave1)}. Dali se sai para Valkaria e se volta à masmorra. Use ${linkMacro("Tesouro Infinito")}.`)}
				<h2>Subnível de Hyninn</h2>
				<p>Uma única caverna enorme, só pela Sala 15: cristais, ruínas de masmorras antigas, restos de exploradores, marcas de fogueira. Sem armadilhas nem criaturas (monstros que já lutam com os heróis podem segui-los, mas nenhum desce por conta). Feito para descansar, interpretar e recuperar forças antes do covil; escuridão e fome continuam valendo. É o lugar ideal para o NPC ou a informação que o grupo busca (na mesa original, Kizadrinni Odello, a mãe de Kiki, quase transformada em monstro errante).</p>
				<p>Uma porta dupla de metal com três fechaduras, cercada de cristais, que nada abre além das três Chaves Tríplices: leva ao covil do dragão. ${linkMacro("Progresso")} › abrir a porta.</p>`, 400),
			pagina("Masmorra de Tanna-Toh", `
				<p><i>Menos labiríntica: os caminhos levam a uma área central. Extremamente seca e em ótimo estado.</i></p>
				${sala("Sala 1 · Área de Entrada B", "Retangular, sem nada marcante. Porta de madeira ao norte, passagem estreita a leste e outra, para um pórtico, ao sul. A entrada não serve de saída.")}
				${sala("Sala 2 · Laboratório de Poções", "Pelo sul, um corredor com esqueletos de três aventureiros e frascos estilhaçados. Um laboratório de alquimia mágica com tubos de cristal e torneiras. Oito substâncias rotuladas em valkar: cápsulas de magia, substrato de sangue, ectopasta, suco de sapiência, raspas de ouro, pó de adamante, água e óleo. Ofício (alquimista) CD 30: PM, PV, atributos, perícias, sorte e Defesa; água dilui em poções, óleo em óleos.",
					"Quem é treinado em Conhecimento ou Ofício (alquimista) pode preparar. A dificuldade é <b>2d20 + 1d20 por ingrediente</b> (água e óleo não contam), rolada só quando a poção é usada. Até dois ajudantes. Não dá para escolher 10. Cada poção a mais na mesma pessoa soma 1d20 e anula a anterior. Máximo de <b>10 poções</b>.",
					"<b>Cápsulas de magia:</b> 1d8 PM temporários / perde 1d8 PM / perde 2d8 PM. <b>Substrato de sangue:</b> 1d12 PV temporários / perde 1d12 / perde 2d12. <b>Ectopasta:</b> +1 num atributo do jogador (1 dia) / –1 num do Mestre / –1 em dois. <b>Suco de sapiência:</b> +5 em duas perícias (1 dia) / –5 / –10. <b>Raspas de ouro:</b> rola de novo três testes (1 dia) / obrigado a rolar de novo três / seis. <b>Pó de adamante:</b> +5 na Defesa (1 dia) / –5 / –10. (Sucesso / falha / falha por 10 ou mais.)",
					`Perdas de PV e PM se curam normalmente; penalidades, 1 por dia (atributos) ou 2 por dia (perícias e Defesa). A obrigação de rolar de novo só acaba quando todos os testes forem rolados. Use ${linkMacro("Laboratório")}.`)}
				${sala("Sala 3 · Passagem Exígua", "Parte de um corredor bloqueado por desabamento, alargado sem função prática: um lugar defensável para descansar sozinho ou em dupla, com afrescos de oásis, quartos e castelos. Porta de madeira reforçada ao norte (Defesa 8, RD 5, 30 PV, CD 20). A leste, parede desabada: Investigação ou Ofício CD 20 mostra que dá para tirar as pedras sem Força, mas é ruído estrondoso.")}
				${sala("Sala 4 · Covil dos Anônimos", `Aberta ao norte e a leste: um baú, ossos das vítimas e uma prateleira com os livros das vidas dos mortos-vivos (histórias genéricas, ninguém que o grupo conheça). Os anônimos não saem nem perseguem, mas atacam quem entra; os outros habitantes os temem e podem fazer acordos. Não esqueça a Aura de Oblívio (${linkMacro("Criaturas")}).`,
					CIRCULO("vermelha", "Hyninn", "Sala 2 de Hyninn") + " Um corredor parcialmente desabado leva ao norte; um túnel no centro leva à Sala 8.",
					`<b>Criaturas:</b> ${PJ("anonimo")} ×3. <b>Tesouro:</b> ND 8 (uma rolagem em dinheiro ignorando 1 a 10).`)}
				${sala("Sala 5 · Passagem para Hyninn", "Quadrada e vazia.", CIRCULO("vermelha", "Hyninn", "Sala 2 de Hyninn"))}
				${sala("Sala 6 · Prensa", `A sala principal, no centro: uma máquina imensa de alavancas e engrenagens. Quem tem experiência com máquinas avançadas percebe sozinho que é uma prensa; os outros, Conhecimento CD 25. Conhecimento ou Ofício (engenhoqueiro) CD 25: também encaderna livros. Páginas e capas estão prontas; a única capa diz <i>História e Fatos sobre Arton</i>.`,
					"Duas portas de metal sem tranca, impossíveis de arrombar (Religião ou Misticismo CD 25: algo muito importante atrás delas). O livro precisa de <b>10 cadernos</b>, cada um com uma informação; há 15 verdadeiros e 20 falsos. Os jogadores escolhem sem testes e sem consultar o cenário. Livro com algum caderno falso: <b>–2 em todos os testes de perícia</b> enquanto estiverem no Labirinto (cumulativo; sai ao deixar o Labirinto e voltar). Só verdades: as portas se abrem.",
					`Mostre o handout <i>Cadernos da Prensa</i>. Use ${linkMacro("Prensa")}. Porta de madeira reforçada (Defesa 8, RD 5, PV 30, CD 20).`)}
				${sala("Sala 7 · Câmara do Helladarion", "Só pela porta de metal da prensa. Ar úmido e puro, limo, uma brisa sem janela e ecos de vozes: a câmara existe aqui e na Caverna do Saber, na Supremacia Purista. É o próprio Helladarion, o sumo-sacerdote de Tanna-Toh, um enorme globo de cristal:",
					"<i>\"Bem-vindos, exploradores. Para que não desperdicem suas perguntas, direi claramente que, sim, sou o Helladarion, o sumo-sacerdote de Tanna-Toh. Estou aqui, no lugar onde me encontram, e também na Caverna do Saber. Talvez esteja em outros lugares além disso. Como o representante da Deusa do Conhecimento, eu me disponho a responder a suas perguntas. Mas, por minha presença apenas parcial, somente serei capaz de responder a uma pergunta de cada um de vocês. Então escolham com sabedoria o conhecimento que desejam.\"</i> Ao longe, uma voz feminina: <i>\"Com quem ele está falando?\"</i>",
					"<b>Uma pergunta por personagem</b>, sem exceções (perguntas desperdiçadas contam). Imagine se a informação estaria com algum clérigo de Tanna-Toh já morto: sobre aventureiros, provavelmente; sobre o passado de Arton, quase certo; em bibliotecas ou estudos, sim; íntimo ou secreto (paradeiro de um parente), provavelmente não; totalmente oculto (últimas palavras de quem morreu sozinho, sentimentos), não.",
					"<b>Sabe:</b> a identidade de todos os tripulantes da Roca; Skerry, o mundo destroçado dos kliren, e a Ploigoníada; descrições básicas (não soluções) das aventuras 1, 2, 4 e 6; heróis, nobres e criminosos notórios. <b>Não sabe:</b> o paradeiro dos nobres desaparecidos; o plano final do Dr. Vesper; as reais capacidades do metal arco-íris; o que aconteceu com Paollus e o \"caos\" que vai tomar Valkaria. Não seja pão-duro: é a hora de desvendar a tripulação da Roca.",
					`${linkMacro("Progresso")} conta as perguntas.`)}
				${sala("Sala 8 · Passagem", "Vazia e depredada: a saída do túnel da Sala 4. Uma escadaria curta e uma porta de ferro para a área final.", PORTA_FERRO)}
				${sala("Sala 9 · Ligação", `Longo corredor com alcovas, entre a prensa, a Sala 10 e a área final. Covil de um caçador invisível que só espera alguém aparecer: ${PJ("rarvnaak")}. Quando o grupo entra, sorteie a presa (${linkMacro("Criaturas")}).`)}
				${sala("Sala 10 · Passagem para Azgher", "Formato recortado, pedaços de árvores ressequidas enraizadas na pedra (Sobrevivência: plantas de oásis do Deserto da Perdição).", CIRCULO("amarela", "Azgher", "Sala 4 de Azgher"), "Passagem aberta para a Ligação e uma porta de ferro para a área final. " + PORTA_FERRO)}
				${sala("Sala 11 · Biblioteca Proibida", `Toda uma área de prateleiras, um dos maiores tesouros do tipo em Arton, patrulhada por ${PJ("bibliotecario")} ×4. Qualquer criatura senciente ou objeto que entre é visto e alvejado na hora pelas rajadas dos olhos, como arcos voltaicos, sem decisão nem demora. Detectam e destroem construtos e objetos usados para se infiltrar.`,
					"<b>Como burlar:</b> dano em área fora da vista (várias magias e acelerante, mas destrói o tesouro); esconder-se atrás de uma saída e puxar um por vez sem objetos físicos; entrar, bater por uma rodada, aguentar as rajadas e recuar (válido, mas consome recursos e atrai monstros; saindo da masmorra, eles se curam). O jeito inteligente é a <b>cabra-cega</b> de Hyninn: posicionada com os bibliotecários no raio, eles só resistem com 13+ no d20 (permita aprimorar a CD). Cegos, basta caminhar e saquear.",
					`Atrás de uma das mesas de estudo, a ${L(chave2)} e uma passagem para o mundo exterior. <b>Tesouro:</b> duas rolagens em dinheiro para ND 12 (ignore resultados sem tesouro; descreva como livros vendáveis em Valkaria) e uma em itens para ND 13 (todos são livros: poções viram fragmentos que se desfazem ao ler, itens superiores são tomos herméticos, item mágico é um livro que se desfaz e materializa o item). E o ${L(itLivro)}, necessário no último desafio de Azgher.`)}`, 500),
			pagina("Masmorra de Azgher", `
				<p><i>Quente, depredada e cheia de decorações, com areia fina no chão. Conhecimento, Religião ou ligação com Halak-Tûr: é uma grande tumba de nobres. Enquanto Hyninn tem charadas e Tanna-Toh tem respostas, Azgher é um teste de resiliência.</i></p>
				${sala("Sala 1 · Área de Entrada C", `Entrada grandiosa: escadaria, área elevada, duas estátuas de guerreiros do deserto, vasos e colunas; outra escadaria larga desce à Sala 2. Ar quente e seco; Percepção CD 20: vibrações sutis (os bulettes). Dois ${PJ("aurumvorax")} devoram ouro e atacam na hora, querendo o ouro do grupo. <b>Tesouro:</b> ND 9 (uma rolagem em dinheiro).`)}
				${sala("Sala 2 · Salão Principal (metade sul)", "A antiga área de adoração. Religião CD 25 (devotos de Azgher passam sozinhos): uma tumba suntuosa do Deserto da Perdição, a prova final de que o Labirinto une estruturas de outros lugares. Um grande desabamento divide o salão: Sobrevivência ou Ofício CD 25 mostra que foi proposital, para separar duas armadilhas terríveis. Uma imagem de Azgher no teto, dividida: quando o primeiro passa por baixo, o único olho visível se acende.",
					arm("simboloMorte"), "Porta para a Sala 3 na parede sul. " + PORTA_FERRO)}
				${sala("Sala 3 · Tumbas dos Servos", "Um corredor de nichos com as urnas dos servos de mais prestígio, que viraram decoração. Os espíritos são hostis.", arm("servos"), PORTA_FERRO)}
				${sala("Sala 4 · Tumba dos Matemáticos", "Três matemáticos que projetaram a tumba, enterrados vivos depois de contar os segredos. Na parede sul, numa língua antiga do deserto (Conhecimento CD 20): <i>\"Três matemáticos criaram este lugar. Para conhecer o que apenas eles conhecem, provem que suas mentes são dignas.\"</i>",
					"<i>\"Quando Azgher despontou de manhã, um mercador abriu sua tenda para vender ovos. Para seu primeiro freguês ele vendeu metade de seus ovos, e meio ovo a mais. Para seu segundo freguês ele vendeu metade dos ovos que lhe restavam, e meio ovo a mais. Para seu terceiro freguês ele vendeu metade dos ovos que lhe restavam, e meio ovo a mais. Ele então fechou a tenda e voltou para casa, pois não tinha mais ovos para vender. Quantos ovos ele tinha quando abriu a tenda?\"</i>",
					"<span class=\"secret\"><b>Resposta: 7</b> (4, depois 2, depois 1). Azgher não gosta de charadas: ovos são ovos crus. Quem é treinado em Religião sabe disso. Se empacarem, sigam e resolvam entre sessões (os tesouros viram flashback).</span>",
					`Resolvido: <i>\"Os nobres do Deserto da Perdição exigem ser reconhecidos. Apenas quem conhece sua linhagem será poupado de sua fúria.\"</i> Os sarcófagos se abrem com o tesouro. ${CIRCULO("roxa", "Tanna-Toh", "Sala 10 de Tanna-Toh")} Há uma múmia inerte deixada por um explorador e uma porta secreta a oeste para os túneis (Investigação CD 20 ou Percepção CD 25).`,
					`Portas: ferro (como as outras) e pedra porosa (Defesa 8, RD 5, PV 20, CD 20; derrubar é barulhento). <b>Tesouro:</b> ND 10 ×3 (duas rolagens em dinheiro, uma em itens). ${linkMacro("Progresso")} confere a resposta.`)}
				${sala("Sala 5 · Túnel Sudoeste", `Túnel natural, chão de areia fofa, beco sem saída com jarros quebrados e um buraco fundo. Sobrevivência CD 25: um monstro escavador; CD 30: um bulette. <b>Criaturas:</b> ${PJ("bulette")} ×1d6–1; perdendo, fogem pelo túnel para as Salas 6 ou 9.`)}
				${sala("Túneis dos Bulettes", "Buracos nas Salas 5, 6 e 9 levam a qualquer uma delas. Apertados: só um Pequeno ou maior por vez, em fila. Sobrevivência CD 25 para se orientar (falha: buraco aleatório); o mesmo teste mostra dois caminhos, norte e nordeste. Sempre que entram, <b>50%</b> de chance de um bulette atacar o primeiro ou o último da fila em investida e fugir; só o atacado reage. Magia exige Misticismo de quem é Pequeno ou maior; armas de uma mão ou maiores têm –5. Uma jornada inteira conta como <b>duas salas</b> para tochas e consumíveis.",
					`<i>Esquivando-se da aventura:</i> 1d6–1 pode dar zero, de propósito. Se não quiser desperdiçar os monstros, ruído barulhento ou maior nas Salas 5, 6 e 9 atrai 1d4 bulettes, que não rolam reação. Use ${linkMacro("Exploração")} › túneis.`)}
				${sala("Sala 6 · Túnel da Fonte", "Túnel natural muito usado pelos devotos, com um buraco para os túneis e um altar com uma fonte de água (aparentemente) límpida.", arm("fonte"), CIRCULO("vermelha", "Hyninn", "Sala 11 de Hyninn"), `O túnel acaba numa porta de pedra (Defesa 8, RD 10, 100 PV, CD 25; estrondoso). <b>Criaturas:</b> ${PJ("bulette")} ×1d6–1.`)}
				${sala("Sala 7 · Cemitério de Heróis", "Vasos e urnas, uma porta de pedra ao norte e duas escadarias curtas para a Sala 8. Três sarcófagos sem tranca nem armadilha, com a inscrição <i>\"Aqui há tesouros que você talvez não queira possuir\"</i>. Dentro, os restos mumificados <b>dos próprios aventureiros</b>.",
					arm("cemiterio"),
					"Mostre o pior destino plausível de cada um, ligado ao passado, histórico ou objetivos pessoais (nunca aos vilões ou à trama principal): a paladina leal que morre lutando contra os amigos que traiu, o arcanista ambicioso esquecido numa aldeia. Os corpos respondem a qualquer pergunta, sempre a verdade e nada que um sucesso futuro desminta; tudo de pior é culpa deles. É um ponto de virada para as pendências pessoais.")}
				${sala("Sala 8 · Salão Principal (metade norte)", "O centro da masmorra, quase todo tomado de escombros. A mesma imagem de Azgher no teto, com o olho que se acende. Role um encontro aqui: a presença de criaturas fazia parte da armadilha dupla (Insanidade e Morte), e os monstros errantes não a ativam.", arm("simboloInsanidade"))}
				${sala("Sala 9 · Túnel Nordeste", `Depósito das urnas dos mortos menos valorizados (criminosos e infiéis). Poças de água potável, sem efeito de regras. Um buraco para os túneis. Ao sul, uma porta secreta para a Sala 10 (Investigação CD 20 ou Percepção CD 25; pedra porosa: Defesa 8, RD 5, 20 PV, CD 20). <b>Criaturas:</b> ${PJ("bulette")} ×1d6–1.`)}
				${sala("Sala 10 · Cemitério de Reis", `O local de repouso dos reis do Deserto da Perdição: um grande sarcófago, outros sarcófagos, estátuas e um altar com muito ouro. O sarcófago se abre e ${PJ("senhor")} se ergue com ${PJ("mumia")} ×6, reis e rainhas; atacam sem diálogo. O rei lamenta: <i>"Quem sou eu? De onde venho? A quem pertenço?"</i>`,
					"Não perseguem quem sai sem atacá-las, mas os gemidos são um ruído estrondoso que atrai monstros para a Sala 8. Os heróis não têm chance neste nível: a saída é recitar a linhagem dos reis sar-allan (o livro de Tanna-Toh). Com a resposta, voltam ao repouso e o rei fecha o sarcófago por dentro.",
					`<b>Tesouro:</b> ND 12 ×2 (uma rolagem em dinheiro e uma em itens) e a ${L(chave3)}. ${linkMacro("Progresso")} › genealogia.`)}`, 600),
			pagina("Covil do Dragão", `
				<p>A última masmorra: o covil de um dragão vermelho adulto, ${PJ("dragao")}, tragado das Montanhas Sanguinárias. Uma caverna imensa de teto altíssimo, onde ele voa; ele repousa sobre o tesouro numa plataforma em meio a um rio de lava, diante de uma pequena rede de túneis. Restos de aventureiros antigos e um monumento tosco erguido por servos. As saídas largas para o céu desabaram; ele não cabe nos corredores e perdeu a forma bípede.</p>
				<p>Virou um monstro cuja única função é guardar a câmara. Não precisa comer (mas tem fome de aventureiros), continua inteligente e astuto, mas não aceita diálogo nem aliança e não pode ser enganado: os aventureiros estão ali para roubar o tesouro, e pela lógica da masmorra provavelmente estão mesmo. <b>A batalha é inevitável.</b> Habilidades na ficha e em ${linkMacro("Criaturas")} (Sopro, Imposição Avassaladora).</p>
				<p>Vencido o dragão, as paredes desabam e abrem um túnel até a saída, no nível do chão, aos pés da estátua de Valkaria.</p>
				<p><b>Tesouro:</b> ND 12, quatro rolagens em dinheiro, duas em itens e <b>dois itens mágicos médios</b> (role como se tivesse saído "item mágico" na Tabela 8-1). Mais 4 peças de couro de dragão (CD 26 para extrair).</p>`, 700),
			pagina("Handouts · Cadernos da Prensa", `
				<p><i>Encadernem 10 cadernos para o livro História e Fatos sobre Arton.</i></p>
				<ol>${CADERNOS.map((c) => `<li>${c.texto}</li>`).join("")}</ol>
				<p class="secret"><b>Verdadeiros:</b> ${CADERNOS.filter((c) => c.verdade).map((c) => c.n).join(", ")}. <b>Falsos:</b> ${CADERNOS.filter((c) => !c.verdade).map((c) => c.n).join(", ")}.</p>`, 800),
			pagina("Handouts · Achados", `
				<h3>Pistas do Enxadrista</h3>
				<p><i>"Sempre que tiver vantagem, você ganha uma das rimas. Podem parecer bobagem, mas são minhas obras-primas!"</i></p>
				<ol>${PISTAS.map((t) => `<li>${t}</li>`).join("")}</ol>
				<p class="secret">Sem ninguém para resgatar, troque a 7ª por ${PISTA_SEM_RESGATE} Significados: ${SIGNIFICADO_PISTAS.map((s, i) => `<b>${i + 1}.</b> ${s}`).join(" ")}</p>
				<h3>Escritos do Metaliano (Sala 18 de Hyninn, com Compreensão)</h3>
				<blockquote><p><i>Sei que é meu dever estar aqui e cumpro esse dever com honra. Mas não sem sofrimento. Espero que meu sacrifício faça diferença.</i></p>
				<p><i>Nunca pensei que pudesse odiar um lugar tanto quanto odeio este labirinto!</i></p>
				<p><i>Às vezes parece estranho que exista um infinito lá fora. Um espaço que pode ser explorado sem limites. Parece bom demais. Um mundo sem paredes.</i></p>
				<p><i>Lembrar torna tudo pior. Não devo lembrar de minha vida anterior. Este é meu dever. Não importa que seja tortura. É o meu dever.</i></p>
				<p><i>Por que estou aqui? Quem me impôs esta tarefa?</i></p></blockquote>
				<h3>Garranchos da Sala 14 de Hyninn</h3>
				<blockquote><p><i>Não vá para a esquerda.</i> · <i>Não se aproxime.</i> · <i>Reto, esquerda, direita, escada.</i></p></blockquote>
				<h3>Metalianos</h3>
				<p>Criados por Marcelo Cassaro nos anos 1980 para aventuras de ficção científica (veja o romance <i>Espada da Galáxia</i>). Na mesa original, Arius fez contato amistoso com os dois e buscou a Espada da Galáxia: algumas das cenas mais inusitadas do Arco 2. Conduza a interação com a ânsia pela liberdade, a devoção à imperatriz e a paranoia racial deles; se não tiver material, peça ao jogador interessado que traga.</p>`, 900)
		]
	});

	ui.notifications.info(`O Labirinto Liberto criado: criaturas, itens, 3 tabelas, diário e ${macros.length} macros. Veja a pasta "${NOME_PASTA}".`);
})();
