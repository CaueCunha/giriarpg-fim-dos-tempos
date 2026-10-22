/* =====================================================================
 * FIM DOS TEMPOS · ARCO 2 · AVENTURA 3 · "FUGA DA ROCHA CINZENTA"
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Arco 2 · Av3 · Fuga da Rocha Cinzenta" com:
 *      - Ameaças: prisioneiro bandido, carcereiro comum, chefe do corredor, turba de prisioneiros,
 *        Nerisha, Carcereiro Stoke, Rakkas, o Benfeitor, Jaydill e o dejeto vivo do subterrâneo.
 *      - Apoio: Farhuk/Majid, Tryphne e Bartolakk (sem ficha de combate no livro).
 *      - Itens: as limitações da Rocha Cinzenta, o implante de cristal rosado, os parceiros da
 *        prisão, a mensagem de Farhuk, o mapa e as provas.
 *      - Tabela: Arquétipos e Nomes de Prisioneiros.
 *      - Diário com guia, Bartolakk, as limitações, o cotidiano e os locais, o feudo do Benfeitor,
 *        a cirurgia, os planos de fuga, o túnel, a corrida para a liberdade e o desfecho.
 *      - Macros: Rocha Cinzenta (entrar/sair), Cirurgia de Tryphne, Corrida para a Liberdade,
 *        Escavando um Túnel, Amigos no Corredor e Prisioneiro Improvisado.
 *   3. Lei & Ordem continua no ator e na macro criados pela Aventura 0 (não são recriados aqui).
 *   4. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "a2av3".
 *
 * Feito a partir do código do sistema (1.6.4, out/2026). Validado no Foundry simulado do
 * módulo giriarpg-fim-dos-tempos; veja o guia a2-av3-rocha-cinzenta.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "a2av3";
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
			window: { title: "Aventura 3 do Arco 2: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para a Aventura 3 do Arco 2.</p>
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
	const NOME_PASTA = "FdT · Arco 2 · Av3 · Fuga da Rocha Cinzenta";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#4d4a46", flags: FLAGS() })).id;
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
	/** Copia um documento de um compêndio do sistema, com a marca deste gerador. */
	async function deCompendio(packId, docId, nome, descExtra, img) {
		const doc = await game.packs.get(packId)?.getDocument(docId).catch(() => null);
		if (!doc) return null;
		const data = doc.toObject();
		delete data._id;
		data.name = nome;
		data.folder = pasta.Item;
		if (img) data.img = img;
		data.flags = foundry.utils.mergeObject(data.flags ?? {}, FLAGS());
		data.system.description.value = `${descExtra}<hr>${data.system.description.value ?? ""}`;
		return data;
	}

	const furtivo = (d) => aoUsar(`Ataque Furtivo (+${d})`, "icons/magic/perception/silhouette-stealth-shadow.webp", [["dano", d]], ["attack"]);
	const FURTIVO = (d) => poder("Ataque Furtivo", "icons/magic/perception/silhouette-stealth-shadow.webp",
		p(`+${d} contra alvos desprevenidos ou flanqueados. Marque o aprimoramento na janela de ataque.`), { exec: "passive" });
	const ESTOCADA = (cd) => poder("Estocada nos Rins", "icons/svg/blood.svg",
		p(`Uma criatura desprevenida atingida fica <b>atordoada por 1 rodada</b> (só uma vez por cena) e <b>sangrando</b>. <b>Fortitude CD ${cd}</b> evita. Botões de condição no card.`),
		{ exec: "passive", save: `Fortitude CD ${cd} evita`, effects: [cond("Atordoado"), cond("Sangrando")] });
	const SEM_IMPLANTE = "<b>Sem o cristal rosado</b> (detentos comuns), ignore as habilidades ativas, como Ataque Furtivo e Estocada nos Rins.";
	const ICO = {
		adaga: `${T20I}/itens/equipamentos/adaga.webp`,
		clava: `${T20I}/itens/equipamentos/clava.webp`,
		clavaMacica: `${T20I}/itens/equipamentos/maca.webp`,
		algemas: `${T20I}/itens/gerais/algemas.webp`,
		cristal: `${T20I}/itens/gerais/po-de-cristal.webp`
	};

	/* ------------------------------------------------------------------ */
	/* 2. Ameaças                                                           */
	/* ------------------------------------------------------------------ */
	const atores = {};

	atores.bandido = await criarNPC({
		name: "Prisioneiro Bandido",
		role: "bandido",
		img: `${T20I}/ameacas/bandido.png`,
		nd: 1,
		cd: 14,
		tipo: "hum",
		raca: "humano",
		papel: "lackey",
		atr: { for: 3, des: 2, con: 2, int: 0, sab: 0, car: -1 },
		pv: 11,
		def: 13,
		pericias: { inic: 4, perc: 2, fort: 10, refl: 5, vont: 1, luta: 12 },
		ataquesTxt: "Adaga improvisada +12 (1d4+7).",
		bio: p("Bandido durão, embrutecido pela vida nos corredores da Rocha Cinzenta.", SEM_IMPLANTE),
		items: [
			arma("Adaga Improvisada", ICO.adaga, { dano: "1d4+7", tipo: "perfuracao", critM: 19, effects: [furtivo("2d6")] }),
			FURTIVO("2d6"),
			ESTOCADA(14)
		]
	});

	atores.carcereiro = await criarNPC({
		name: "Carcereiro Comum",
		role: "carcereiro",
		disposition: 0,
		img: `${T20I}/ameacas/guarda-de-cidade.png`,
		nd: 3,
		cd: 17,
		tipo: "hum",
		raca: "humano",
		papel: "lackey",
		atr: { for: 2, des: 1, con: 3, int: 1, sab: 1, car: 0 },
		pv: 40,
		def: 20,
		pericias: { inic: 4, perc: 9, fort: 10, refl: 8, vont: 9, luta: 16, inti: 5, intu: 6 },
		resTxt: "Não pode ser flanqueado.",
		equipTxt: "Algemas, cassetete (conta como clava), couro batido.",
		ataquesTxt: "Cassetete ×2 +16 (1d6+8).",
		bio: p("A maioria é honesta e só cumpre o dever. Olham para os detentos como se fossem algo saído da sarjeta. Os corruptos respondem a Stoke e ao Benfeitor."),
		items: [
			arma("Cassetete (×2)", ICO.clava, { dano: "1d6+8", tipo: "impacto", effects: [cond("Atordoado")], desc: p("Dois ataques por ação padrão. <b>Nas Costelas:</b> uma criatura atingida fica atordoada por 1 rodada (uma vez por cena, Fortitude CD 17 evita).") }),
			poder("Nas Costelas", ICO.clava, p("Uma criatura atingida pelo cassetete fica <b>atordoada por 1 rodada</b> (só uma vez por cena). <b>Fortitude CD 17</b> evita."), { exec: "passive", save: "Fortitude CD 17 evita", effects: [cond("Atordoado")] }),
			poder("Olhos nas Galerias", "icons/svg/eye.svg", p("O carcereiro nunca fica surpreendido."), { exec: "passive" })
		]
	});

	atores.chefe = await criarNPC({
		name: "Chefe do Corredor",
		role: "chefe",
		img: `${T20I}/ameacas/chefe-bandido.png`,
		nd: 4,
		cd: 18,
		tipo: "hum",
		raca: "humano",
		papel: "solo",
		atr: { for: 3, des: 2, con: 3, int: 0, sab: 1, car: 0 },
		pv: 36,
		def: 20,
		pericias: { inic: 6, perc: 6, fort: 13, refl: 10, vont: 7, luta: 17, furt: 8, intu: 7, ladi: 8 },
		resTxt: "Evasão.",
		ataquesTxt: "Porrete ×2 +17 (2d6+10).",
		bio: p("Bandido ainda mais forte e durão, que comanda alguns capangas mas ainda obedece a alguém mais poderoso.", SEM_IMPLANTE),
		items: [
			arma("Porrete (×2)", ICO.clava, { dano: "2d6+10", tipo: "impacto", effects: [furtivo("2d6")], desc: p("Dois ataques por ação padrão.") }),
			FURTIVO("2d6"),
			ESTOCADA(18),
			poder("Crimes Tatuados", "icons/svg/terror.svg", p("Uma criatura que veja o chefe pela primeira vez numa cena fica <b>abalada por 1 rodada</b>. <b>Vontade CD 18</b> evita."), { exec: "passive", save: "Vontade CD 18 evita", effects: [cond("Abalado")] }),
			poder("Evasão", "icons/svg/shield.svg", p("Quando passa em Reflexos contra um efeito que reduz o dano à metade, não sofre dano."), { exec: "passive" })
		]
	});

	atores.turba = await criarNPC({
		name: "Turba de Prisioneiros",
		role: "turba",
		img: `${T20I}/ameacas/turba-de-zumbis.png`,
		nd: 6,
		cd: 22,
		tipo: "hum",
		raca: "humano",
		papel: "lackey",
		tamanho: "gra",
		tokenSize: 2,
		atr: { for: 3, des: 2, con: 2, int: 0, sab: 0, car: -1 },
		pv: 52,
		def: 23,
		pericias: { inic: 7, perc: 5, fort: 17, refl: 12, vont: 7, luta: 24 },
		ataquesTxt: "[Bando] Adaga improvisada +24 (2d4+14).",
		bio: p("Um grupo de prisioneiros enfurecidos. É um bando (Tormenta20 / <i>Ameaças de Arton</i>).", SEM_IMPLANTE),
		items: [
			arma("[Bando] Adaga Improvisada", ICO.adaga, { dano: "2d4+14", tipo: "perfuracao", critM: 19, effects: [furtivo("4d6")] }),
			FURTIVO("4d6"),
			ESTOCADA(22)
		]
	});

	atores.nerisha = await criarNPC({
		name: "Nerisha",
		role: "nerisha",
		link: true,
		img: `${T20I}/racas/suraggel.webp`,
		nd: 5,
		cd: 22,
		tipo: "esp",
		raca: "sulfure",
		papel: "special",
		atr: { for: 0, des: 4, con: 2, int: 4, sab: 2, car: 5 },
		pv: 102,
		pm: 47,
		def: 19,
		conjuracao: "car",
		sentidos: ["escuro"],
		pericias: { inic: 8, perc: 6, fort: 7, refl: 10, vont: 16, luta: 6, dipl: 9, enga: 11, furt: 10, ladi: 8, intu: 9, nobr: 7 },
		resTxt: "Resistência a magia +2.",
		bio: p("Sulfure adolescente que <b>nasceu na Rocha Cinzenta</b>, na Ala de Contenção Demoníaca. Pediu para viver nas alas comuns e depois para continuar presa: a prisão é seu lar. Aceitou a cirurgia na hora e, pela primeira vez, sentiu-se completa. Totalmente leal ao Benfeitor.",
			"Coordena a entrada e saída de produtos e conhece todos os segredos da Rocha: poderia desenhar um mapa. Muito difícil fazê-la trair o patrono. Por trás da pose, tem medo do mundo lá fora."),
		items: [
			poder("Aparência Inofensiva", "icons/svg/sun.svg", p("A primeira criatura inteligente (Int –3 ou maior) que atacar Nerisha numa cena faz <b>Vontade CD 22</b>; se falhar, perde a ação."), { exec: "passive", save: "Vontade CD 22" }),
			poder("Foco em Enganação", "icons/svg/mystery-man.svg", p("<b>Reação, 1 PM.</b> Quando faz um teste de Enganação, rola dois dados e usa o melhor."), { exec: "reaction", custo: 1 }),
			magia("Adaga Mental", `${T20I}/magias/adaga-mental.webp`,
				p("<b>Padrão, 6 PM.</b> Uma criatura em alcance curto sofre <b>4d6 de dano psíquico</b> e fica atordoada por 1 rodada (Vontade CD 22 reduz à metade e evita; só uma vez por cena). Sem gestos, palavras ou efeitos visuais."),
				{ tipoMagia: "arc", escola: "enc", exec: "action", custo: 6, alcance: "short", alvo: "1 criatura", save: "Vontade CD 22 reduz à metade e evita atordoado", rolls: [["Psíquico", [["4d6", "psiquico"]]]], effects: [cond("Atordoado")] }),
			magia("Aparência Perfeita", `${T20I}/magias/aparencia-perfeita.webp`,
				p("<b>Padrão, 3 PM.</b> Até o fim da cena, +2 em Carisma e +5 em Diplomacia e Enganação. Pode renovar como ação livre no início de cada cena."),
				{ tipoMagia: "arc", escola: "ilu", circulo: 2, exec: "action", custo: 3, alcance: "self", durU: "scene",
					effects: [fx("Aparência Perfeita", `${T20I}/magias/aparencia-perfeita.webp`, [["system.pericias.dipl.bonus", "5"], ["system.pericias.enga.bonus", "5"]])] }),
			magia("Enfeitiçar", `${T20I}/magias/enfeiticar.webp`,
				p("<b>Padrão, 1 PM.</b> Um humanoide em alcance curto fica enfeitiçado por Nerisha até o fim da cena (Vontade CD 22 evita)."),
				{ tipoMagia: "arc", escola: "enc", exec: "action", custo: 1, alcance: "short", alvo: "1 humanoide", durU: "scene", save: "Vontade CD 22 evita", effects: [cond("Enfeitiçado")] }),
			magia("Escuridão", `${T20I}/magias/escuridao.webp`,
				p("<b>Padrão, 5 PM.</b> Até o fim da cena, um objeto em alcance curto emana escuridão total num raio de 6m, bloqueando a visão na área e através dela."),
				{ tipoMagia: "uni", escola: "nec", exec: "action", custo: 5, alcance: "short", area: "raio de 6m", durU: "scene" }),
			magia("Erupção Glacial", `${T20I}/magias/erupcao-glacial.webp`,
				p("<b>Padrão, 6 PM.</b> Quadrado de 6m em alcance médio: <b>4d6 de corte e 4d6 de frio</b>, e caídas (Reflexos CD 22 evita o corte e a condição). As estacas duram a cena: terreno difícil e cobertura; fogo mágico as destrói."),
				{ tipoMagia: "arc", escola: "evo", circulo: 3, exec: "action", custo: 6, alcance: "medium", area: "quadrado de 6m", durU: "scene", save: "Reflexos CD 22 evita o corte e caído",
					rolls: [["Gelo", [["4d6", "corte"], ["4d6", "frio"]]]], effects: [cond("Caído")] })
		]
	});

	atores.stoke = await criarNPC({
		name: "Carcereiro Stoke",
		role: "stoke",
		link: true,
		img: `${T20I}/ameacas/sargento-da-guarda.png`,
		nd: 7,
		cd: 21,
		tipo: "hum",
		raca: "humano",
		papel: "solo",
		atr: { for: 2, des: 2, con: 3, int: 1, sab: 2, car: 2 },
		pv: 240,
		def: 31,
		pericias: { inic: 9, perc: 11, fort: 20, refl: 7, vont: 14, luta: 24, inti: 11, intu: 11 },
		ic: ["medo"],
		res: { dano: { base: 5 } },
		resTxt: "Imunidade a medo, não pode ser flanqueado nem surpreendido, resistência a ilusão +5, redução de dano 5.",
		equipTxt: "Algemas, cassetete maciço (conta como clava maciça), couro batido reforçado.",
		ataquesTxt: "Cassetete maciço ×2 +24 (2d6+14, ×3).",
		bio: p("Sádico, corrupto, violento e covarde. Provavelmente a última pessoa que deveria ter poder sobre os outros, e por isso mesmo quis ser carcereiro. Comanda uma equipe e é o garoto de recados da Companhia dos Irmãos: traz o contrabando (inclusive os cristais) e entrega pessoalmente ao Benfeitor. Abaixo de todos os irmãos por nunca ter feito o juramento, desconta nos detentos comuns.",
			"Seguir Stoke pode mostrar uma taverna da Companhia, um informante ou o próprio Paollus (ou Torgo) entregando os cristais."),
		items: [
			arma("Cassetete Maciço (×2)", ICO.clavaMacica, { dano: "2d6+14", tipo: "impacto", critX: 3, desc: p("Dois ataques por ação padrão. <b>Prazer na Dor:</b> se rolar pelo menos um 6 no dano, faz um ataque adicional contra qualquer oponente no alcance.") }),
			poder("Prazer na Dor", "icons/svg/blood.svg", p("Sempre que rola pelo menos um 6 no dano do cassetete, Stoke pode fazer um ataque adicional contra qualquer oponente no alcance."), { exec: "passive" })
		]
	});

	atores.rakkas = await criarNPC({
		name: "Rakkas",
		role: "rakkas",
		link: true,
		img: `${T20I}/ameacas/trog.png`,
		nd: 7,
		cd: 24,
		tipo: "hum",
		raca: "trog",
		papel: "solo",
		atr: { for: 3, des: 2, con: 5, int: -1, sab: 0, car: -1 },
		pv: 240,
		def: 25,
		sentidos: ["escuro"],
		pericias: { inic: 9, perc: 7, fort: 19, refl: 7, vont: 13, luta: 24, furt: 8, intu: 6 },
		ic: ["atordoamento"],
		resTxt: "Imunidade a atordoamento. Sangue frio: +1 de dano por dado de frio. Furtividade +13 sem armadura ou roupas pesadas.",
		ataquesTxt: "Halteres +24 (2d6+16) e mordida +24 (1d8+16).",
		bio: p("\"O cara mais durão da prisão\". Troglodita enorme que só se exercita, parece intimidador ao lado do Benfeitor e de vez em quando espanca alguém como exemplo. Leal ao minotauro porque não consegue pensar em nada além disso. Luta até a morte se o chefe (ou ele mesmo) for desrespeitado.",
			"Vencer Rakkas numa luta na frente de todos é o jeito mais óbvio de ganhar respeito (tomada de poder ou agentes duplos)."),
		items: [
			arma("Halteres", ICO.clavaMacica, { dano: "2d6+16", tipo: "impacto", effects: [furtivo("3d6")], desc: p("Ataca com os halteres <b>e</b> a mordida na mesma ação.") }),
			arma("Mordida", "icons/creatures/abilities/mouth-teeth-sharp.webp", { dano: "1d8+16", tipo: "perfuracao", effects: [furtivo("3d6")] }),
			FURTIVO("3d6"),
			poder("Lealdade Criminosa", "icons/svg/padlock.svg", p("Quando faz um teste para evitar trair ou revelar um segredo do Benfeitor, rola dois dados e usa o melhor."), { exec: "passive" }),
			poder("Mau Cheiro", "icons/magic/air/fog-gas-smoke-green.webp",
				p("<b>Padrão.</b> Gás fétido: todas as criaturas (exceto trogs) num raio de 9m ficam <b>enjoadas por 1d6 rodadas</b>. <b>Fortitude CD 24</b> evita, e quem passa fica imune por um dia. Veneno."),
				{ exec: "action", area: "raio de 9m", save: "Fortitude CD 24 evita", rolls: [["Rodadas enjoado", [["1d6", ""]]]], effects: [cond("Enjoado")] }),
			poder("Sangue Frio", "icons/svg/frozen.svg", p("Sofre 1 ponto de dano adicional por dado de dano de frio."), { exec: "passive" })
		]
	});

	const HAHA = [2, 4, 6, 8].map((n) => aoUsar(`Ha, ha, ha, ha (+${n})`, "icons/svg/sound.svg", [["dano", String(n)]], ["attack"]));
	atores.benfeitor = await criarNPC({
		name: "O Benfeitor (Khabrias Minareus)",
		tokenName: "O Benfeitor",
		role: "benfeitor",
		link: true,
		img: `${T20I}/racas/minotauro.webp`,
		nd: 8,
		cd: 26,
		tipo: "hum",
		raca: "minotauro",
		papel: "solo",
		atr: { for: 6, des: 2, con: 4, int: 3, sab: 1, car: 2 },
		pv: 240,
		def: 27,
		sentidos: ["faro"],
		pericias: { inic: 10, perc: 9, fort: 19, refl: 10, vont: 15, luta: 26, atle: 14, enga: 12, ladi: 12, mist: 11, inti: 16, intu: 11 },
		ic: ["medo"],
		resTxt: "Evasão aprimorada, imunidade a medo, não pode ser flanqueado, redução de dano 10/acerto crítico. Medo de altura.",
		ataquesTxt: "Ataque desarmado ×2 +26 (2d6+12, 19/×3) e chifres +26 (2d6+12).",
		tesouro: "Padrão.",
		bio: p("Khabrias Minareus, irmão do meio da Companhia dos Irmãos. Preso numa ação da Guarda com três grupos de aventureiros, matou três guardas da forma mais cruel possível antes de cair. Chegou à Rocha com essa fama, reuniu um exército, corrompeu Stoke e recebeu da irmandade Tryphne e os cristais. Agora é \"o Benfeitor\": consegue qualquer coisa para qualquer prisioneiro, ao preço de uma dívida eterna. Comanda o tráfico de achbuld lá fora por Stoke e não pretende sair: ali está protegido.",
			"Muito desconfiado, não emprega gente de fora em cargos importantes, mas atende súplicas todos os dias e faz uma corte no pátio à tarde. Boa interpretação pode torná-lo amigo de um herói (o clichê do chefão que se afeiçoa ao policial disfarçado).",
			"Na mesa original, atacado enquanto comia, não estava fumando: sem charuto, sem a habilidade Charuto."),
		effects: [chave("Medo de Altura (abalado)", "icons/svg/falling.svg", [["system.modificadores.ataque.geral", "-2"], ["system.modificadores.pericias.geral", "-2"]], false,
			"Ligue quando ele estiver adjacente a uma queda de 3m ou mais, mesmo sendo imune a medo.")],
		items: [
			arma("Ataque Desarmado (×2)", "icons/skills/melee/unarmed-punch-fist.webp", { dano: "2d6+12", tipo: "impacto", critM: 19, critX: 3, effects: [furtivo("3d6"), ...HAHA],
				desc: p("Dois ataques por ação padrão, mais os chifres. <b>Um, Dois:</b> atingido pelos dois na mesma rodada, o alvo fica atordoado por 1 rodada (uma vez por cena, Fortitude CD 26 evita). <b>Ha, ha, ha, ha:</b> marque +2 por ataque que errou o Benfeitor na rodada anterior.") }),
			arma("Chifres", "icons/commodities/bones/horn-simple-grey.webp", { dano: "2d6+12", tipo: "perfuracao", effects: [furtivo("3d6"), ...HAHA] }),
			FURTIVO("3d6"),
			poder("Charuto", "icons/svg/fire.svg",
				p("<b>Movimento, uma vez por cena, se tiver um charuto.</b> Cospe o charuto na cara de um oponente adjacente, que fica <b>cego por 1d3+1 rodadas</b> (Reflexos CD 26 reduz para 1 rodada)."),
				{ exec: "move", alcance: "touch", save: "Reflexos CD 26 reduz para 1 rodada", rolls: [["Rodadas cego", [["1d3+1", ""]]]], effects: [cond("Cego")] }),
			poder("Coquetel Ilegal", `${T20I}/itens/gerais/fogo-alquimico.webp`,
				p("<b>Movimento, recarga (movimento).</b> Frasco explosivo num ponto em alcance curto: criaturas a até 1,5m sofrem <b>4d6 de fogo</b> (Reflexos CD 26 reduz à metade) e a área fica em chamas por 1d4 rodadas (quem entra sofre o mesmo, uma vez por rodada)."),
				{ exec: "move", alcance: "short", area: "raio de 1,5m", save: "Reflexos CD 26 reduz à metade", rolls: [["Fogo", [["4d6", "fogo"]]], ["Rodadas em chamas", [["1d4", ""]]]] }),
			poder("Ha, ha, ha, ha", "icons/svg/sound.svg", p("Sempre que um personagem erra um ataque contra o Benfeitor, ele recebe +2 cumulativo nas rolagens de dano corpo a corpo da próxima rodada. Marque o aprimoramento certo na janela de ataque."), { exec: "passive" }),
			poder("Investida Poderosa", "icons/commodities/bones/horn-simple-grey.webp",
				p("<b>Completa.</b> Investida com os chifres. Acertando, ergue o alvo acima da cabeça (Reflexos CD 26 evita); erguido, leva os dois ataques desarmados e depois fica caído."),
				{ exec: "full", save: "Reflexos CD 26 evita ser erguido", effects: [cond("Caído")] }),
			poder("Um, Dois", "icons/skills/melee/unarmed-punch-fist.webp", p("Atingida pelos dois ataques desarmados na mesma rodada, a criatura fica <b>atordoada por 1 rodada</b> (uma vez por cena). <b>Fortitude CD 26</b> evita."), { exec: "passive", save: "Fortitude CD 26 evita", effects: [cond("Atordoado")] }),
			poder("Evasão Aprimorada", "icons/svg/shield.svg", p("Passando em Reflexos contra efeito de metade, não sofre dano; falhando, sofre metade."), { exec: "passive" })
		]
	});

	atores.jaydill = await criarNPC({
		name: "Jaydill",
		role: "jaydill",
		link: true,
		img: `${T20I}/racas/sereia.webp`,
		nd: 8,
		cd: 26,
		tipo: "hum",
		raca: "tritão",
		papel: "solo",
		atr: { for: 0, des: 7, con: 2, int: 2, sab: 0, car: 3 },
		pv: 280,
		pm: 24,
		def: 33,
		conjuracao: "car",
		pericias: { inic: 15, perc: 7, fort: 8, refl: 21, vont: 15, luta: 26, acro: 17, enga: 11, furt: 15, inti: 11, intu: 8, ladi: 15 },
		resTxt: "Evasão aprimorada.",
		equipTxt: "Adaga.",
		ataquesTxt: "Adaga ×2 +26 (2d6+15, 18).",
		bio: p("Coordena a limpeza e a lavanderia. Muito bem-humorado e piadista, temido por detentos e carcereiros. É um <b>assassino serial</b> que chacinou famílias inteiras; quando perguntam o motivo, ri e diz que \"perdeu a cabeça\" ou \"cometeu um deslize\".",
			"<b>Em princípio não passou pela cirurgia:</b> dentro da Rocha, sem habilidades. Esta ficha é para quando ele for inimigo fora da prisão (como na mesa original). Como aliado, é parceiro <b>assassino mestre</b>."),
		items: [
			arma("Adaga (×2)", ICO.adaga, { pericia: "luta", atributo: "des", dano: "2d6+15", tipo: "perfuracao", critM: 18,
				effects: [furtivo("4d6"), aoUsar("Assassinar (Furtivo dobrado, +4d6)", "icons/svg/skull.svg", [["dano", "4d6"]], ["attack"])],
				desc: p("Dois ataques por ação padrão. <b>Grande Arte:</b> acertando, a vítima faz Reflexos (CD igual ao ataque) ou fica desprevenida contra o próximo ataque dele neste turno.") }),
			FURTIVO("4d6"),
			poder("Assassinar", "icons/svg/skull.svg", p("<b>Movimento.</b> Analisa uma criatura em alcance curto: até o fim do próximo turno, dobra os dados do primeiro Ataque Furtivo que causar dano nela (marque o aprimoramento)."), { exec: "move", alcance: "short" }),
			magia("Amedrontar", `${T20I}/magias/amedrontar.webp`,
				p("<b>Canção dos Mares. Padrão, 5 PM.</b> Uma criatura em alcance curto fica apavorada por 1d4+1 rodadas e depois abalada (Vontade CD 26 reduz para abalada por 1d4 rodadas)."),
				{ tipoMagia: "arc", escola: "nec", exec: "action", custo: 5, alcance: "short", alvo: "1 criatura", save: "Vontade CD 26 reduz para abalado", rolls: [["Rodadas", [["1d4+1", ""]]]], effects: [cond("Apavorado"), cond("Abalado")] }),
			magia("Sono", `${T20I}/magias/sono.webp`,
				p("<b>Canção dos Mares. Padrão, 5 PM.</b> Uma criatura em alcance curto fica exausta por 1d4+1 rodadas e depois fatigada (Fortitude CD 26 reduz para fatigada por 1d4 rodadas)."),
				{ tipoMagia: "arc", escola: "enc", exec: "action", custo: 5, alcance: "short", alvo: "1 criatura", save: "Fortitude CD 26 reduz para fatigado", rolls: [["Rodadas", [["1d4+1", ""]]]], effects: [cond("Exausto"), cond("Fatigado")] }),
			poder("Jogos Mentais", "icons/svg/daze.svg",
				p("<b>Movimento, mental.</b> Todas as criaturas a até 9m sofrem <b>–12 em ataques</b> até o fim da cena (Vontade CD 26 reduz para –6). Cada ataque que erra Jaydill reduz a penalidade daquela criatura em 2. Uma vez por cena por criatura. Efeitos no card."),
				{ exec: "move", area: "raio de 9m", durU: "scene", save: "Vontade CD 26 reduz para –6",
					effects: [fx("Jogos Mentais (–12)", "icons/svg/daze.svg", [["system.modificadores.ataque.geral", "-12"]]), fx("Jogos Mentais (–6)", "icons/svg/daze.svg", [["system.modificadores.ataque.geral", "-6"]])] }),
			poder("Rolamento Defensivo", "icons/svg/falling.svg", p("<b>Reação, 1×/rodada.</b> Quando sofre dano, reduz esse dano à metade e fica caído."), { exec: "reaction", effects: [cond("Caído")] }),
			poder("Evasão Aprimorada", "icons/svg/shield.svg", p("Passando em Reflexos contra efeito de metade, não sofre dano; falhando, sofre metade."), { exec: "passive" })
		]
	});
	await atores.jaydill.update({ "system.attributes.movement.swim.base": 12 });

	atores.dejeto = await criarNPC({
		name: "Dejeto Vivo",
		role: "dejeto",
		img: `${T20I}/ameacas/glop.png`,
		nd: 6,
		cd: 22,
		tipo: "mon",
		papel: "solo",
		tamanho: "gra",
		tokenSize: 2,
		atr: { for: 4, des: -1, con: 5, int: -5, sab: 1, car: 0 },
		pv: 280,
		def: 24,
		walk: 6,
		sentidos: ["cegas"],
		pericias: { inic: 2, perc: 6, fort: 18, refl: 6, vont: 12, luta: 20 },
		resTxt: "Resistência a alquimia e magia +5. Percepção às cegas (médio).",
		ataquesTxt: "Três pseudópodes +20 (1d8+10 impacto, ×2, mais 1d8 ácido).",
		tesouro: "Padrão (exceto itens alquímicos), 1d6 doses de ácido (CD 21 para extrair).",
		bio: p("Limo de lixo, alquimia e magia (<i>Ameaças de Arton</i>, p. 386) que habita o espaço de masmorra sob a Rocha Cinzenta. Lá embaixo, visão na penumbra e no escuro não funcionam.",
			"Se o grupo chegar aqui com todo o equipamento, PM e PV, troque por algo mais desafiador (serpe anciã ou uraghian adulto, <i>Ameaças de Arton</i>)."),
		items: [
			arma("Pseudópode (×3)", "icons/magic/acid/dissolve-bone-white.webp", { dano: "1d8+10", tipo: "impacto", extra: [["1d8", "acido"]], desc: p("Três ataques por ação padrão. <b>Agarrar Aprimorado (livre):</b> pseudópode, teste +22.") }),
			poder("Agarrar Aprimorado", "icons/svg/net.svg", p("<b>Livre.</b> Agarra com um pseudópode que acertou (teste +22)."), { exec: "free", rolls: [["Agarrar", [["1d20+22", ""]]]], effects: [cond("Agarrado")] }),
			poder("Engolir", "icons/magic/acid/dissolve-bone-white.webp",
				p("<b>Padrão.</b> No início de cada turno do dejeto, a criatura engolida sofre <b>2d6+10 de ácido</b>. Escapa causando 20 pontos de dano ao interior (Defesa 10)."),
				{ exec: "action", rolls: [["Ácido", [["2d6+10", "acido"]]]] }),
			poder("Odor Nauseabundo", "icons/magic/air/fog-gas-smoke-green.webp",
				p("Uma criatura que comece o turno em alcance curto fica <b>enjoada pela cena</b> (Fortitude CD 22 evita e fica imune até o fim da cena)."), { exec: "passive", save: "Fortitude CD 22 evita", effects: [cond("Enjoado")] })
		]
	});
	await atores.dejeto.update({ "system.attributes.movement.climb.base": 6, "system.attributes.movement.swim.base": 6 });

	/* ---------- Apoio (sem ficha de combate no livro) ---------- */
	const APOIO = "<b>Não tem ficha de combate no livro.</b> Os números aqui só existem para o token e as macros.";
	atores.farhuk = await criarNPC({
		name: "Farhuk (\"Majid\")",
		tokenName: "Majid",
		role: "farhuk",
		link: true,
		disposition: 0,
		img: `${T20I}/racas/qareen.webp`,
		nd: 5,
		tipo: "hum",
		raca: "qareen",
		papel: "special",
		atr: { for: 0, des: 1, con: 1, int: 2, sab: 2, car: 4 },
		pv: 30,
		def: 15,
		pericias: { enga: 14, intu: 12, inve: 12, dipl: 12 },
		bio: p("Detetive qareen da Guarda que se infiltrou na Companhia dos Irmãos como \"Majid\". Preso com a equipe de Khabrias, não tinha como provar quem era; virou conselheiro do Benfeitor e vive sob vigilância constante. Depois da cirurgia de Tryphne, encantou um pássaro e mandou a mensagem num trapo da própria roupa.",
			"Nunca está fora da vista de alguém a mando do Benfeitor. Com o minotauro fora do caminho, basta pedir testemunhas de fora a Bartolakk: é questão de tempo.",
			"Como parceiro: <b>adepto iniciante</b> e <b>ajudante veterano</b> (Enganação, Intuição e Investigação).", APOIO)
	});
	atores.tryphne = await criarNPC({
		name: "Tryphne",
		role: "tryphne",
		link: true,
		disposition: 0,
		img: `${T20I}/racas/dahllan.webp`,
		nd: 5,
		tipo: "hum",
		raca: "dahllan",
		papel: "special",
		atr: { for: 0, des: 1, con: 1, int: 2, sab: 3, car: 1 },
		pv: 30,
		pm: 20,
		def: 14,
		pericias: { reli: 7, cura: 12, intu: 8 },
		bio: p("Clériga de Lena que perdeu o filho na Marcha de Arsenal (1406), afundou na bebida e acabou devendo à Companhia dos Irmãos. Antes de ser presa, recebeu o implante de Ghorskander (que a manteve paralisada e consciente durante a cirurgia) e aprendeu a operar. Implanta os cristais no Benfeitor e nos capangas, ao menos sem dor.",
			"Soturna e melancólica, mas não maligna. Com amparo e incentivo, pode se voltar contra o Benfeitor e operar os heróis (macro <i>Cirurgia de Tryphne</i>: Religião +7, Cura +12). Como parceira: <b>médica veterana</b>.", APOIO)
	});
	atores.bartolakk = await criarNPC({
		name: "Bartolakk",
		role: "bartolakk",
		link: true,
		disposition: 1,
		img: `${T20I}/racas/golem.webp`,
		nd: 10,
		tipo: "con",
		raca: "golem",
		papel: "special",
		atr: { for: 4, des: 0, con: 4, int: 4, sab: 2, car: 0 },
		pv: 100,
		def: 25,
		pericias: { intu: 15, inve: 15, perc: 15 },
		bio: p("Diretor da Rocha Cinzenta, golem criado pela Academia Arcana. Duas almas elementais se revezam sem que ele perceba. Lógico, literal, frio e plenamente satisfeito. Vê vários pontos da prisão pelos espelhos da sala e pelos olhos dos golens guardiões; o Pequeno Bart é uma extensão dele.",
			"<b>Três diretrizes:</b> não descumprir a lei e fazê-la cumprir; não ferir mortais (salvo conflito com a primeira); defender a própria vida (salvo conflito com as anteriores). Por isso não pode negociar com a irmandade, sumir com presos, se demitir nem aceitar reprogramação. Qualquer plano ilegal precisa ser escondido dele.", APOIO)
	});

	/* ------------------------------------------------------------------ */
	/* 3. Itens                                                             */
	/* ------------------------------------------------------------------ */
	const itemDoc = (d) => ({ ...d, folder: pasta.Item, flags: FLAGS() });
	const tesouro = (name, img, html) => itemDoc({ name, type: "tesouro", img, system: { description: { value: html }, qtd: 1, preco: 0, peso: 0, espacos: 0 } });
	const PARCEIROS = "tormenta20.parceiros";
	const ID = { fortao: "YAcnW6C7ok7xjdg6", destruidor: "FIJfKOIU8dzbvSDG", ajudante: "ROdJSxDCkvamfzX7", assassino: "BNhavlxkPCr8P4Vi", medico: "rntcrujiIc63hKOp", adepto: "WP0roXCa40nveA4L" };
	const parceiro = async (tipo, nome, desc, img) => (await deCompendio(PARCEIROS, ID[tipo], nome, desc, img))
		?? itemDoc(poder(nome, img ?? `${T20I}/itens/gerais/parceiros.webp`, desc, { tipo: "geral", subtipo: "Parceiros" }));
	const ALIADO = "Amizade conquistada na Rocha Cinzenta: conta como parceiro durante o combate.";

	const novosItens = [
		itemDoc(poder("Limitações da Rocha Cinzenta", `${T20I}/itens/gerais/algemas.webp`,
			p("Dentro das muralhas, todos são \"como aldeões\": sem magia (itens mágicos perdem os poderes), <b>sem PM</b> e sem recuperá-los, sem equipamento (exceto quem entrou escondido; equipamento que faz parte do corpo para de funcionar), só deslocamento normal, sem teletransporte.",
				"Só funcionam modificadores permanentes de atributos e perícias, habilidades de tamanho e fraquezas (como Medo de Altura). Golens não desligam, mas perdem imunidades; lefou não usam poderes da Tormenta. <b>Se uma habilidade burla a prisão, ela não funciona.</b>",
				"A macro <i>Rocha Cinzenta</i> zera os PM e liga este efeito nos selecionados."),
			{ tipo: "geral", exec: "passive",
				effects: [chave("Na Rocha Cinzenta", `${T20I}/itens/gerais/algemas.webp`,
					[["system.attributes.movement.fly.base", "0", "override"], ["system.attributes.movement.climb.base", "0", "override"], ["system.attributes.movement.swim.base", "0", "override"]],
					true, "Só deslocamento normal. Sem PM e sem recuperá-los (não descanse PM aqui). Habilidades especiais não funcionam (confira à mão).")] })),
		itemDoc(poder("Implante de Cristal Rosado", ICO.cristal,
			p("Cristal rosado de origem kliren implantado por Tryphne (que aprendeu com Ghorskander). O portador usa habilidades especiais e magia dentro da Rocha Cinzenta.",
				"Depois da cirurgia, PV perdidos só voltam com descanso natural. <b>Regra opcional da mesa original:</b> pesadelos; Vontade CD 20 para descansar bem à noite, ou descanso ruim (recuperação pela metade).",
				"<b>Por que isso importa:</b> quando Valkaria estiver cheia de mensagens subliminares, os portadores do implante (os criminosos) manterão as habilidades."),
			{ tipo: "geral", exec: "passive" })),
		tesouro("Mensagem de Farhuk (trapo)", "icons/sundries/documents/document-torn-diagram-tan.webp",
			p("<i>\"Sou Farhuk e estou vivo. Estou preso na Rocha Cinzenta. Me tirem daqui. Não confiem nos carcereiros.\"</i>", "Entregue por um pássaro claramente controlado por magia.")),
		tesouro("Mapa da Rocha Cinzenta", "icons/sundries/documents/document-sealed-brown-red.webp",
			p("1) Feudo do Benfeitor, 2) Sala de Cirurgia, 3) Celas, 4) Refeitório, 5) Cozinha, 6) Despensa, 7) Depósito e serviços gerais, 8) Limpeza, 9) Forja, 10) Curtume, 11) Biblioteca, 12) Pátio.",
				"Sem mapa, uma fuga é impossível. Bartolakk pode deixar ver (não levar) com boa lábia: Inteligência CD 15 a 20 para lembrar cada detalhe. Stoke ou Nerisha podem dar um, se confiarem no grupo.")),
		tesouro("Pergaminhos da Cirurgia", `${T20I}/itens/gerais/pergaminho.webp`,
			p("Instruções da cirurgia do implante, com diagramas de origem kliren e o símbolo do relógio (a tripulação da Roca). Podem trazer trechos do Diário Científico de Ghorskander.", "<b>Prova.</b>")),
		tesouro("Cristal Rosado (avulso)", ICO.cristal,
			p("Um cristal ainda não implantado, ou tirado do corpo de um prisioneiro operado.", "<b>Prova.</b>")),
		tesouro("Documentos da Prisão", `${T20I}/itens/gerais/livro.webp`,
			p("Registros de contrabando, escalas de carcereiros corruptos e mudanças na arquitetura do feudo do Benfeitor.", "<b>Prova.</b>")),
		await parceiro("fortao", "Parceiro: Cremildhe (Fortona veterana)", p("<b>Forja.</b> Humana, a ferreira mais experiente da Rocha. Calada e ameaçadora; presa por matar duas pessoas numa briga de taverna. Não tolera desrespeito.", ALIADO)),
		await parceiro("destruidor", "Parceiro: Imnek (Destruidor iniciante, ácido)", p("<b>Forja.</b> Goblin inventor, preso por assaltos a mansões (sempre ficava para trás, só com os inventos). Anseia por construir engenhocas; aliado natural para lidar com os implantes.", ALIADO)),
		await parceiro("ajudante", "Parceiro: Borislav (Ajudante veterano)", p("<b>Biblioteca.</b> Osteon executado em vida por um crime de que não se lembra; apresentou-se à Guarda ao se erguer. Administra a biblioteca há vinte anos e não quer sair. Perícias: Conhecimento, Nobreza e Religião.", ALIADO)),
		await parceiro("ajudante", "Parceiro: Sakrizi (Ajudante veterana)", p("<b>Biblioteca.</b> Medusa ladra de livros, presa por roubar o grimório de um arquimago. Curiosidade que beira o doentio. Perícias: Furtividade, Ladinagem e Misticismo.", ALIADO)),
		await parceiro("assassino", "Parceiro: Yngri (Assassina veterana)", p("<b>Cozinha.</b> Anã, ex-ladina de aventureiros que desbaratou um culto; um cultista morto era nobre e a família a incriminou. Cozinha bem e odeia cozinhar. A prisioneira de maior confiança da Rocha, mais íntegra que muitos carcereiros.", ALIADO)),
		await parceiro("assassino", "Parceiro: Jaydill (Assassino mestre)", p("<b>Limpeza e lavanderia.</b> Tritão piadista e assassino serial. Como aliado é um assassino mestre (nada mau!); como inimigo, use a ficha dele.", ALIADO)),
		await parceiro("medico", "Parceiro: Tryphne (Médica veterana)", p("<b>Feudo do Benfeitor.</b> A clériga de Lena que faz as cirurgias, se for convencida a trair o minotauro.", ALIADO)),
		await parceiro("adepto", "Parceiro: Farhuk (Adepto iniciante)", p("Depois da cirurgia, ou fora da Rocha. Também conta como <b>ajudante veterano</b> (Enganação, Intuição e Investigação): veja o item seguinte.", ALIADO)),
		await parceiro("ajudante", "Parceiro: Farhuk (Ajudante veterano)", p("Perícias: Enganação, Intuição e Investigação. Também conta como <b>adepto iniciante</b>.", ALIADO))
	];
	const itensCriados = await Item.createDocuments(novosItens);
	const itemPorNome = (inicio) => itensCriados.find((i) => i.name.startsWith(inicio));

	/* ------------------------------------------------------------------ */
	/* 4. Tabela                                                            */
	/* ------------------------------------------------------------------ */
	const ARQUETIPOS = [["Velho sábio", "Trelot"], ["Ingênuo", "Ziera"], ["Inocente incriminado", "Scarbisse"], ["Veterano protetor", "Rathier"], ["Artista", "Rothin"],
		["Assassino refinado", "Beriokh"], ["Piadista", "Veyrak"], ["Ex-guarda", "Thariel"], ["Valentão", "Crovess"], ["Covarde traidor", "Miraith"]];
	const tabArquetipos = await RollTable.create({
		name: "Arquétipos e Nomes de Prisioneiros",
		img: `${T20I}/itens/gerais/algemas.webp`,
		folder: pasta.RollTable,
		flags: FLAGS(),
		formula: "1d10",
		replacement: true,
		displayRoll: true,
		description: "Role duas vezes: uma para o arquétipo, outra para o nome. A macro Prisioneiro Improvisado faz isso. Também serve para o companheiro de cela quando o grupo é ímpar.",
		results: ARQUETIPOS.map(([a, n], i) => ({ type: "text", range: [i + 1, i + 1], weight: 1, name: `${a} · ${n}`, description: `Arquétipo: ${a}. Nome: ${n}.` }))
	});

	/* ------------------------------------------------------------------ */
	/* 5. Macros                                                            */
	/* ------------------------------------------------------------------ */

	async function macroRocha() {
		const NOME = "Na Rocha Cinzenta";
		const LIMITES = {
			name: NOME,
			img: "systems/tormenta20/icons/itens/gerais/algemas.webp",
			type: "base",
			flags: { world: { fdtRocha: true } },
			description: "Sem magia, sem PM (e sem recuperá-los: não descanse PM aqui), sem equipamento, só deslocamento normal. Habilidades especiais não funcionam, exceto modificadores permanentes, tamanho e fraquezas.",
			system: {
				changes: ["fly", "climb", "swim"].map((m) => ({ key: `system.attributes.movement.${m}.base`, value: "0", type: "override", phase: "initial", priority: null }))
			}
		};
		const IMPLANTE = {
			name: "Implante de Cristal Rosado",
			img: "systems/tormenta20/icons/itens/gerais/po-de-cristal.webp",
			type: "base",
			flags: { world: { fdtImplante: true } },
			description: "Usa habilidades e magia dentro da Rocha Cinzenta. PV perdidos na cirurgia só voltam com descanso natural.",
			system: { changes: [] }
		};
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		if (!tokens.length) return ui.notifications.warn("Selecione os personagens.");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Rocha Cinzenta" },
			content: `<p>Selecionados: ${tokens.map((t) => t.name).join(", ")}.</p>
				<div class="form-group"><label>Ação</label><select name="acao">
					<option value="entrar">Entrar (zera os PM e liga as limitações)</option>
					<option value="sair">Sair das muralhas (desliga as limitações; PM voltam com descanso)</option>
					<option value="implante">Marcar implante (sem limitações dentro da Rocha)</option>
					<option value="tirar">Tirar o implante</option></select></div>
				<p style="font-size:0.85em">Quem entrou escondido não perde o equipamento. Confira à mão as habilidades que burlariam a prisão.</p>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const linhas = [];
		for (const t of tokens) {
			const a = t.actor;
			const limites = a.effects.filter((e) => e.getFlag("world", "fdtRocha"));
			const implante = a.effects.find((e) => e.getFlag("world", "fdtImplante"));
			if (res.acao === "entrar") {
				if (implante) { linhas.push(`${t.name}: tem o implante, mantém as habilidades.`); continue; }
				await a.update({ "system.attributes.pm.value": 0 });
				if (!limites.length) await a.createEmbeddedDocuments("ActiveEffect", [LIMITES]);
				linhas.push(`${t.name}: sem PM, sem magia, sem equipamento.`);
			} else if (res.acao === "sair") {
				if (limites.length) await a.deleteEmbeddedDocuments("ActiveEffect", limites.map((e) => e.id));
				linhas.push(`${t.name}: fora das muralhas, habilidades de volta.`);
			} else if (res.acao === "implante") {
				if (limites.length) await a.deleteEmbeddedDocuments("ActiveEffect", limites.map((e) => e.id));
				if (!implante) await a.createEmbeddedDocuments("ActiveEffect", [IMPLANTE]);
				linhas.push(`${t.name}: com o implante de cristal rosado.`);
			} else {
				if (implante) await a.deleteEmbeddedDocuments("ActiveEffect", [implante.id]);
				linhas.push(`${t.name}: sem o implante.`);
			}
		}
		ChatMessage.create({ content: `<h3>Rocha Cinzenta</h3><ul>${linhas.map((l) => `<li>${l}</li>`).join("")}</ul>`, whisper: ChatMessage.getWhisperRecipients("GM") });
	}

	async function macroCirurgia() {
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		if (!tokens.length) return ui.notifications.warn("Selecione quem vai passar pela cirurgia.");
		const tryphne = game.actors.find((a) => a.getFlag("world", "fdtRole") === "tryphne");
		const RELI = Number(tryphne?.system.pericias?.reli?.value) || 7;
		const CURA = Number(tryphne?.system.pericias?.cura?.value) || 12;
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Cirurgia de Tryphne" },
			content: `<p>Pacientes: ${tokens.map((t) => t.name).join(", ")}. Tryphne: Religião +${RELI}, Cura +${CURA}.</p>
				<div class="form-group"><label>Tryphne descansou e rezou (pular o teste de Religião)</label><input type="checkbox" name="rezou"></div>
				<div class="form-group"><label>Pesadelos (regra da mesa original)</label><input type="checkbox" name="pesadelos"></div>
				<p style="font-size:0.85em">Religião CD 15 (falha rebaixa o resultado de Fortitude); Cura CD 25 (falha: precisa tentar de novo); Fortitude CD 20 do paciente.</p>`,
			ok: { label: "Operar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r; };
		let html = "<h3>Cirurgia de Tryphne</h3>";
		let rebaixa = false;
		if (!res.rezou) {
			const r = await rolar(`1d20 + ${RELI}`);
			rebaixa = r.total < 15;
			html += `<p>Religião ${r.total} (CD 15): ${rebaixa ? "<b>poucos PM</b>, os resultados de Fortitude caem uma categoria." : "PM completos."}</p>`;
		}
		const CATS = ["1 natural", "falha", "sucesso", "20 natural"];
		html += "<ul>";
		for (const t of tokens) {
			const a = t.actor;
			const c = await rolar(`1d20 + ${CURA}`);
			if (c.total < 25) { html += `<li>${t.name}: Cura ${c.total} (CD 25). <b>A cirurgia fracassou</b>; precisa de nova tentativa.</li>`; continue; }
			const f = await rolar(`1d20 + ${Number(a.system.pericias?.fort?.value) || 0}`);
			const nat = f.dice[0]?.total;
			let cat = nat === 1 ? 0 : nat === 20 ? 3 : f.total >= 20 ? 2 : 1;
			if (rebaixa) cat = Math.max(0, cat - 1);
			const pv = a.system.attributes.pv;
			let efeito;
			if (cat === 0) {
				await a.update({ "system.attributes.pv.value": -1 });
				for (const s of ["inconsciente", "sangrando"]) if (!a.statuses?.has(s)) await a.toggleStatusEffect(s, { active: true });
				efeito = "fica com <b>–1 PV, inconsciente e sangrando</b>; Tryphne não tem PM para impedir a morte.";
			} else if (cat === 1) {
				await a.update({ "system.attributes.pv.value": Math.min(pv.value, Math.ceil(pv.max / 2)) });
				if (!a.statuses?.has("debilitado")) await a.toggleStatusEffect("debilitado", { active: true });
				efeito = "acorda com <b>metade dos PV</b> (só voltam com descanso natural) e <b>debilitado</b> até recuperá-los.";
			} else if (cat === 2) {
				await a.update({ "system.attributes.pv.value": Math.min(pv.value, Math.ceil(pv.max / 2)) });
				efeito = "acorda com <b>metade dos PV</b> (só voltam com descanso natural).";
			} else efeito = "acorda <b>sem nenhum efeito negativo</b>.";
			const limites = a.effects.filter((e) => e.getFlag("world", "fdtRocha"));
			if (limites.length) await a.deleteEmbeddedDocuments("ActiveEffect", limites.map((e) => e.id));
			if (!a.effects.some((e) => e.getFlag("world", "fdtImplante"))) {
				await a.createEmbeddedDocuments("ActiveEffect", [{
					name: "Implante de Cristal Rosado",
					img: "systems/tormenta20/icons/itens/gerais/po-de-cristal.webp",
					type: "base",
					flags: { world: { fdtImplante: true } },
					description: `Usa habilidades e magia dentro da Rocha Cinzenta. PV perdidos na cirurgia só voltam com descanso natural.${res.pesadelos ? " Pesadelos: Vontade CD 20 para descansar bem; senão, descanso ruim." : ""}`,
					system: { changes: [] }
				}]);
			}
			html += `<li>${t.name}: Cura ${c.total}, Fortitude ${f.total} (${CATS[cat]}${rebaixa ? ", rebaixado" : ""}): ${efeito} Recebe o implante.</li>`;
		}
		html += "</ul>";
		if (res.pesadelos) html += "<p><b>Pesadelos:</b> toda noite, Vontade CD 20 para descansar; falha é descanso ruim (recuperação pela metade).</p>";
		ChatMessage.create({ content: html, rolls });
	}

	async function macroCorrida() {
		const CHAVE = "fdtCorridaRocha";
		const e = game.user.getFlag("world", CHAVE) ?? { sucessos: 0, falhas: 0, prontidao: 0, evento: 0, patio: false, combateGuardas: false, outras: [], rodada: 0 };
		const EVENTOS = ["", "Corredores", "Prisioneiros", "Chance de distração", "Porta trancada", "Atravessar o pátio", "Passar por guardas"];
		const OPCOES = {
			1: [["atle", "Atletismo (rápido: +2 Prontidão, sucesso conta como dois)"], ["furt", "Furtividade (discreto: +1 Prontidão só se falhar)"]],
			2: [["luta", "Combater: Luta (+2 Prontidão)"], ["pont", "Combater: Pontaria (+2 Prontidão)"], ["dipl", "Negociar: Diplomacia"], ["enga", "Negociar: Enganação"], ["inti", "Negociar: Intimidação"], ["convidar", "Convidar para a fuga (sucesso automático, +1d4 Prontidão)"]],
			3: [["enga", "Enganação"], ["atua", "Atuação"], ["furt", "Furtividade"], ["inti", "Intimidação"], ["dipl", "Diplomacia"], ["ladi", "Ladinagem"], ["acro", "Acrobacia"], ["atle", "Atletismo"], ["perc", "Percepção"], ["inve", "Investigação"]],
			4: [["ladi", "Ladinagem (CD +2; sucesso: –1 Prontidão)"], ["atle", "Atletismo (força bruta: +1 Prontidão)"]],
			5: [["atle", "Atletismo (cada um testa)"], ["furt", "Furtividade (cada um testa)"]],
			6: [["enga", "Distração: Enganação (falha +1, sucesso –1 Prontidão)"], ["furt", "Esgueirar: Furtividade (falha por 5+ dá +1)"], ["luta", "Combater: Luta (+2 Prontidão)"], ["pont", "Combater: Pontaria (+2 Prontidão)"]]
		};
		const NOMES = { atle: "Atletismo", furt: "Furtividade", luta: "Luta", pont: "Pontaria", dipl: "Diplomacia", enga: "Enganação", inti: "Intimidação", atua: "Atuação", ladi: "Ladinagem", acro: "Acrobacia", perc: "Percepção", inve: "Investigação", conh: "Conhecimento", guer: "Guerra" };
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		const opcoes = e.evento ? OPCOES[e.evento].filter(([k]) => !(e.evento === 6 && e.combateGuardas && ["enga", "furt"].includes(k))) : [];
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Corrida para a Liberdade" },
			content: `<p>Sucessos <b>${e.sucessos}/7</b> · falhas <b>${e.falhas}/3</b> · Prontidão <b>${e.prontidao >= 0 ? "+" : ""}${e.prontidao}</b> (CD ${20 + e.prontidao}).</p>
				${e.evento ? `<p>Evento pendente: <b>${EVENTOS[e.evento]}</b>.</p>` : ""}
				<div class="form-group"><label>Ação</label><select name="acao">
					${e.evento ? "<option value=\"resolver\">Resolver o evento</option>" : "<option value=\"sortear\">Sortear o evento da rodada (1d6)</option>"}
					<option value="zerar">Recomeçar a fuga</option></select></div>
				${e.evento ? `<div class="form-group"><label>Como</label><select name="opcao">${opcoes.map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}<option value="outra">Outra perícia (uma vez cada)</option></select></div>
				<div class="form-group"><label>Outra perícia</label><select name="outra">${Object.entries(NOMES).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></div>
				<div class="form-group"><label>Discrição (–5; passando, –1 Prontidão)</label><input type="checkbox" name="discricao"></div>
				<div class="form-group"><label>Resultado já rolado (opcional)</label><input type="number" name="manual"></div>` : ""}
				<p style="font-size:0.85em">Selecione quem faz o teste (no pátio, todos os selecionados testam).</p>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "zerar") {
			await game.user.unsetFlag("world", CHAVE);
			return ui.notifications.info("Corrida para a Liberdade reiniciada.");
		}
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r; };
		if (res.acao === "sortear") {
			e.rodada += 1;
			const d = await rolar("1d6");
			e.evento = d.total === 5 && e.patio ? 1 : d.total;
			await game.user.setFlag("world", CHAVE, e);
			return ChatMessage.create({ content: `<h3>Corrida para a Liberdade · rodada ${e.rodada}</h3><p>1d6 = ${d.total}: <b>${EVENTOS[e.evento]}</b>${d.total === 5 && e.patio ? " (o pátio já foi atravessado: vale Corredores)" : ""}.</p><p>Opções: ${OPCOES[e.evento].map(([, n]) => n).join("; ")}.</p>`, rolls });
		}
		const ev = e.evento;
		let k = res.opcao;
		if (k === "outra") {
			k = res.outra;
			if (e.outras.includes(k)) return ui.notifications.warn(`${NOMES[k]} já foi usada como perícia alternativa nesta fuga.`);
			e.outras.push(k);
		}
		const disc = !!res.discricao;
		let cd = 20 + e.prontidao + (ev === 4 && k === "ladi" ? 2 : 0);
		let html = `<h3>Corrida para a Liberdade · ${EVENTOS[ev]}</h3>`;
		let ok;
		let peso = 1;
		const bonus = (a) => Number(a.system.pericias?.[k]?.value) || 0;
		if (k === "convidar") {
			ok = true;
			const p = await rolar("1d4");
			e.prontidao += p.total;
			html += `<p>Os prisioneiros entram na fuga: sucesso automático, Prontidão +${p.total}.</p>`;
		} else if (ev === 5) {
			if (!tokens.length) return ui.notifications.warn("Selecione os personagens que atravessam o pátio.");
			let passaram = 0;
			html += "<ul>";
			for (const t of tokens) {
				const luz = await rolar("1d4");
				const r = await rolar(`1d20 + ${bonus(t.actor)}${disc ? " - 5" : ""}${luz.total === 1 ? " - 5" : ""}`);
				const passou = r.total >= cd;
				if (passou) passaram += 1;
				if (passou && disc) e.prontidao -= 1;
				html += `<li>${t.name}: ${NOMES[k]} ${r.total}${luz.total === 1 ? " (uma luz mágica cruza o caminho: –5)" : ""} ${passou ? "✔️" : "❌"}</li>`;
			}
			html += "</ul>";
			ok = passaram >= tokens.length / 2;
			e.patio = true;
		} else {
			let total = Number(res.manual);
			let quem = "Resultado informado";
			if (res.manual === "" || res.manual === undefined) {
				const a = tokens[0]?.actor;
				if (!a) return ui.notifications.warn("Selecione quem faz o teste, ou informe o resultado.");
				const r = await rolar(`1d20 + ${bonus(a)}${disc ? " - 5" : ""}`);
				total = r.total;
				quem = tokens[0].name;
			}
			ok = total >= cd;
			html += `<p>${quem}: ${NOMES[k] ?? k} <b>${total}</b> contra CD ${cd}${disc ? " (com discrição)" : ""}.</p>`;
			if (ok && disc) e.prontidao -= 1;
			const falhaPor = cd - total;
			if (ev === 1 && k === "atle") { e.prontidao += 2; if (ok) peso = 2; }
			if (ev === 1 && k === "furt" && !ok) e.prontidao += 1;
			if (ev === 2 && ["luta", "pont"].includes(k)) e.prontidao += 2;
			if (ev === 3 && ok) { const r = await rolar("1d6"); e.prontidao -= r.total; html += `<p>A distração funciona: Prontidão –${r.total}.</p>`; }
			if (ev === 4 && k === "ladi" && ok) e.prontidao -= 1;
			if (ev === 4 && k === "atle") e.prontidao += 1;
			if (ev === 6 && k === "enga") e.prontidao += ok ? -1 : 1;
			if (ev === 6 && k === "furt" && !ok && falhaPor >= 5) e.prontidao += 1;
			if (ev === 6 && ["luta", "pont"].includes(k)) { e.prontidao += 2; e.combateGuardas = true; }
		}
		if (ok) e.sucessos += peso;
		else e.falhas += 1;
		html += `<p>${ok ? `<b>Sucesso${peso > 1 ? " (conta como dois)" : ""}.</b>` : "<b>Falha.</b>"} Sucessos ${e.sucessos}/7 · falhas ${e.falhas}/3 · Prontidão ${e.prontidao >= 0 ? "+" : ""}${e.prontidao}.</p>`;
		const repete = !ok && [2, 6].includes(ev);
		if (repete) html += "<p>O evento se repete: o grupo ainda precisa lidar com eles.</p>";
		else { e.evento = 0; if (ev === 6) e.combateGuardas = false; }
		if (e.sucessos >= 7) {
			html += "<p><b>Liberdade!</b> O grupo escapa da Rocha Cinzenta com Farhuk. Lá fora, a Guarda pode notar a confusão.</p>";
			await game.user.unsetFlag("world", CHAVE);
		} else if (e.falhas >= 3) {
			html += "<p><b>Falha total.</b> Um grupo grande de guardas subjuga todos: uma boa surra, 0 PV (sem sangrar), de volta às celas e vigiados. Esta fuga não pode mais ser tentada, e as outras formas de fuga ficam com CD +5.</p>";
			for (const t of tokens) await t.actor.update({ "system.attributes.pv.value": 0 });
			await game.user.unsetFlag("world", CHAVE);
		} else await game.user.setFlag("world", CHAVE, e);
		ChatMessage.create({ content: html, rolls });
	}

	async function macroTunel() {
		const CHAVE = "fdtTunelRocha";
		const e = game.user.getFlag("world", CHAVE) ?? { semana: 0, sucessos: 0, falhas: 0, extra: 0, suspeita: 0 };
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		const alvos = [...game.user.targets].filter((t) => t.actor);
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Escavando um Túnel" },
			content: `<p>Semana ${e.semana} · sucessos <b>${e.sucessos}/5</b> · falhas <b>${e.falhas}/3</b> · CD ${30 + e.extra}${e.suspeita ? ` · <b>desconfiança</b> (ocultar CD 30)` : ""}.</p>
				<div class="form-group"><label>Ação</label><select name="acao"><option value="semana">Mais uma semana de escavação</option><option value="zerar">Recomeçar do zero</option></select></div>
				<div class="form-group"><label>Têm pás, picaretas etc.</label><input type="checkbox" name="ferramentas" checked></div>
				<div class="form-group"><label>Perícia para ocultar</label><select name="ocultar"><option value="furt">Furtividade</option><option value="enga">Enganação</option><option value="dipl">Diplomacia</option><option value="inti">Intimidação</option><option value="atua">Atuação</option></select></div>
				<div class="form-group"><label>Ajuda de planejamento (bônus total)</label><input type="number" name="plano" value="0"></div>
				<p style="font-size:0.85em">Selecione o escavador (e um segundo, que ajuda com bônus dobrado). Marque como alvo (T) quem oculta a obra; quem oculta não escava.</p>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "zerar") {
			await game.user.unsetFlag("world", CHAVE);
			return ui.notifications.info("Túnel recomeçado do zero.");
		}
		const [esc, ajud] = tokens;
		if (!esc) return ui.notifications.warn("Selecione quem escava.");
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r; };
		const per = (a, k) => Number(a.system.pericias?.[k]?.value) || 0;
		e.semana += 1;
		const cd = 30 + e.extra + (res.ferramentas ? 0 : 5);
		let html = `<h3>Escavando um Túnel · semana ${e.semana}</h3>`;
		let ajuda = 0;
		if (ajud) {
			const r = await rolar(`1d20 + ${per(ajud.actor, "atle")}`);
			ajuda = Math.floor(r.total / 10) * 2;
			html += `<p>${ajud.name} ajuda: Atletismo ${r.total}, <b>+${ajuda}</b> (bônus dobrado).</p>`;
		}
		const plano = Number(res.plano) || 0;
		const r = await rolar(`1d20 + ${per(esc.actor, "atle")} + ${ajuda} + ${plano}`);
		const ok = r.total >= cd;
		html += `<p>${esc.name}: Atletismo <b>${r.total}</b> contra CD ${cd}${res.ferramentas ? "" : " (sem ferramentas)"}: ${ok ? "<b>avança</b>" : "<b>imprevisto</b> (CD +2)"}.</p>`;
		if (ok) e.sucessos += 1;
		else { e.falhas += 1; e.extra += 2; }
		const oc = alvos[0];
		if (oc) {
			const cdO = e.suspeita ? 30 : 25;
			const o = await rolar(`1d20 + ${per(oc.actor, res.ocultar)}`);
			if (o.total >= cdO) html += `<p>${oc.name} mantém a obra escondida (${o.total} contra CD ${cdO}).</p>`;
			else {
				e.suspeita += 1;
				html += e.suspeita >= 2 ? `<p>${oc.name}: ${o.total} contra CD ${cdO}. <b>Os guardas descobrem a escavação!</b></p>` : `<p>${oc.name}: ${o.total} contra CD ${cdO}. Surgem desconfianças: a CD para ocultar sobe para 30.</p>`;
			}
		} else html += "<p><i>Ninguém ocultou a obra esta semana (marque um alvo para testar).</i></p>";
		if (e.suspeita >= 2) {
			await game.user.unsetFlag("world", CHAVE);
		} else if (e.sucessos >= 5) {
			html += "<p><b>O túnel está pronto.</b> Lá embaixo fica o espaço de masmorra (e o dejeto vivo). Fora das muralhas, as habilidades voltam (o equipamento não).</p>";
			await game.user.unsetFlag("world", CHAVE);
		} else if (e.falhas >= 3) {
			const cdR = 30 + e.extra;
			html += `<p><b>O túnel desaba!</b> Quem está dentro faz dois testes de Reflexos (CD ${cdR}).</p><ul>`;
			for (const t of [esc, ajud].filter(Boolean)) {
				let f = 0;
				for (let i = 0; i < 2; i++) if ((await rolar(`1d20 + ${per(t.actor, "refl")}`)).total < cdR) f += 1;
				if (f === 1) {
					const pv = t.actor.system.attributes.pv;
					await t.actor.update({ "system.attributes.pv.value": pv.value - Math.ceil(pv.value / 2) });
					if (!t.actor.statuses?.has("fatigado")) await t.actor.toggleStatusEffect("fatigado", { active: true });
				}
				html += `<li>${t.name}: ${f === 0 ? "escapa ileso" : f === 1 ? "escapa com ferimentos graves (metade dos PV, fatigado até recuperar)" : "<b>é soterrado e morre</b>"}.</li>`;
			}
			html += "</ul><p>O túnel está perdido: qualquer nova tentativa começa do zero.</p>";
			await game.user.unsetFlag("world", CHAVE);
		} else await game.user.setFlag("world", CHAVE, e);
		html += `<p style="font-size:0.85em">Sucessos ${e.sucessos}/5 · falhas ${e.falhas}/3.</p>`;
		ChatMessage.create({ content: html, rolls, whisper: ChatMessage.getWhisperRecipients("GM") });
	}

	async function macroAmigos() {
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		if (!tokens.length) return ui.notifications.warn("Selecione quem errou o ataque (ou falhou no teste exposto).");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Amigos no Corredor" },
			content: `<p>Os amigos do prisioneiro na plateia atacam ${tokens.map((t) => t.name).join(", ")}: <b>2d6</b>, uma vez por rodada.</p>
				<div class="form-group"><label>Tipo</label><select name="tipo"><option value="impacto">Impacto (chutes, pedrada)</option><option value="corte">Corte</option><option value="perfuracao">Perfuração (estocada)</option></select></div>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rodada = game.combat ? `${game.combat.id}.${game.combat.round}` : null;
		const rolls = [];
		const linhas = [];
		for (const t of tokens) {
			const a = t.actor;
			if (rodada && a.getFlag("world", "fdtAmigosCorredor") === rodada) { linhas.push(`${t.name}: já sofreu este dano nesta rodada.`); continue; }
			const r = await new Roll(`2d6[${res.tipo}]`).evaluate();
			rolls.push(r);
			try { await a.applyDamageV2(r, 1); } catch (err) { console.warn(err); }
			if (rodada) await a.setFlag("world", "fdtAmigosCorredor", rodada);
			linhas.push(`${t.name}: <b>${r.total}</b> de ${res.tipo}.`);
		}
		ChatMessage.create({ content: `<h3>Amigos no Corredor</h3><ul>${linhas.map((l) => `<li>${l}</li>`).join("")}</ul>`, rolls });
	}

	async function macroPrisioneiro() {
		const tabela = game.tables.find((t) => t.getFlag("world", "fdt") === "a2av3" && t.name.startsWith("Arquétipos"));
		if (!tabela) return ui.notifications.error("Tabela de prisioneiros não encontrada (importe o Ato 2 do módulo Fim dos Tempos).");
		const a = await new Roll("1d10").evaluate();
		const n = await new Roll("1d10").evaluate();
		const pega = (r) => tabela.results.find((x) => r.total >= x.range[0] && r.total <= x.range[1])?.name ?? "";
		const arquetipo = pega(a).split(" · ")[0];
		const nome = pega(n).split(" · ")[1];
		ChatMessage.create({
			content: `<h3>Prisioneiro improvisado</h3><p><b>${nome}</b>, ${arquetipo.toLowerCase()}.</p><p style="font-size:0.85em">Resuma a personalidade ao traço mais marcante. Se puder, faça-o levar o grupo a um NPC que já existe.</p>`,
			rolls: [a, n],
			whisper: ChatMessage.getWhisperRecipients("GM")
		});
	}

	const macro = (name, img, fn) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Arco 2 · Aventura 3 · gerado por a2-av3-rocha-cinzenta.js\n(${fn.toString()})();`
	});
	const macros = await Macro.createDocuments([
		macro("Av3 · Rocha Cinzenta (entrar/sair)", `${T20I}/itens/gerais/algemas.webp`, macroRocha),
		macro("Av3 · Cirurgia de Tryphne", ICO.cristal, macroCirurgia),
		macro("Av3 · Corrida para a Liberdade", "icons/svg/door-exit.svg", macroCorrida),
		macro("Av3 · Escavando um Túnel", "icons/tools/hand/shovel-spade-steel-grey.webp", macroTunel),
		macro("Av3 · Amigos no Corredor", "icons/svg/combat.svg", macroAmigos),
		macro("Av3 · Prisioneiro Improvisado", "icons/svg/mystery-man.svg", macroPrisioneiro)
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
		name: "Arco 2 · Aventura 3 · Fuga da Rocha Cinzenta",
		folder: pasta.JournalEntry,
		flags: FLAGS(),
		pages: [
			pagina("Guia do Mestre", `
				<h2>Resumo</h2>
				<p>Nível 8. Um detetive infiltrado, Farhuk, está preso na Rocha Cinzenta como \"Majid\", conselheiro do Benfeitor, um minotauro da Companhia dos Irmãos que domina a prisão. Os heróis entram (provavelmente como presos), descobrem os cristais rosados de Ghorskander e tiram Farhuk de lá. Clima de filme de prisão.</p>
				<h2>Caixa de areia</h2>
				<p>Não há sequência de eventos nem plano dos vilões: eles só reagem. Trate a Rocha como uma <b>masmorra social</b> (todos os NPCs estão presos lá dentro, com relações descritas) e também como uma masmorra física (arquitetura, perigos, armadilhas). Se o plano dos jogadores pegar você de surpresa, peça um tempo e um resumo por escrito do plano.</p>
				<h2>Fases</h2>
				<ol>
					<li><b>Fase 0 · Normalidade:</b> Finley importuna Tullia Blasanov com perguntas sobre a família criminosa dela. Depois, a Xerife Mathilda e o caso secreto (${L(itemPorNome("Mensagem"))}).</li>
					<li><b>Fase 1 · Entrando na Prisão:</b> as portas mágicas, o Pequeno Bart e ${L(atores.bartolakk)}.</li>
					<li><b>Fase 2 · Atrás das Grades:</b> o cotidiano, os locais e as personalidades, o feudo do Benfeitor e a cirurgia.</li>
					<li><b>Fase 3 · Fuga Impossível:</b> tomada de poder, agentes duplos, infiltração, ataque frontal, distração ou fuga ousada.</li>
					<li><b>Fase 4 · Desfecho:</b> Farhuk volta à Guarda; provas e pagamento.</li>
				</ol>
				<h2>Macros</h2>
				${lista([
					`${linkMacro("Rocha Cinzenta")}: zera os PM e liga as limitações nos selecionados ao entrar; desliga ao sair; marca quem tem implante.`,
					`${linkMacro("Cirurgia")}: os testes de Tryphne e a Fortitude do paciente, com PV, condições e o implante aplicados.`,
					`${linkMacro("Corrida")}: o teste estendido de fuga (CD 20 + Prontidão, 7 sucessos), um evento por rodada.`,
					`${linkMacro("Túnel")}: uma semana de escavação por clique, com ocultação, imprevistos e desabamento.`,
					`${linkMacro("Amigos no Corredor")}: os 2d6 da plateia quando um herói erra um prisioneiro (uma vez por rodada).`,
					`${linkMacro("Prisioneiro Improvisado")}: arquétipo e nome sorteados de ${L(tabArquetipos)}.`
				])}
				<p>${leiOrdem ? `Lei &amp; Ordem: ${L(leiOrdem)}.` : "Lei &amp; Ordem fica no ator da Aventura 0 (importe o Ato 2 do módulo)."}</p>`, 100),
			pagina("Fases 0 e 1 · O Caso e Bartolakk", `
				<h3>O caso secreto</h3>
				<p><i>\"Querem saber do caso secreto? (...) uma vez que ouvirem, não terão escolha. Não podem dar para trás, não podem contar para ninguém e não podem se demorar.\"</i> Ninguém pode saber, nem outros detetives. Se vazar que aventureiros com a descrição do grupo estão nisso, ninguém mais poderá tentar.</p>
				<p>Farhuk, detetive qareen, infiltrou-se anos atrás na equipe do minotauro Khabrias Minareus. Numa batida da Guarda a um armazém, sumiu. Há um mês chegou a mensagem num trapo, trazida por um pássaro encantado (e magia não funciona na Rocha!). Mathilda nem o conhece pessoalmente. Recusou detetives conhecidos da irmandade; o caso exige novatos. Confia no diretor, o golem Bartolakk, incapaz de trair a função. A missão: entrar e tirar Farhuk de lá.</p>
				<h3>A Rocha Cinzenta</h3>
				<p>Bloco de pedra gigantesco no meio de Valkaria, sem portas ou janelas aparentes; vizinhos vivem normalmente em volta. Portas mágicas integradas à parede detectam a mente de quem chega. Corredor de entrada escuro com <b>quatro golens de pedra</b> (Bartolakk vê pelos olhos deles); duas portas que nunca abrem juntas. O Pequeno Bart, golem diminuto, leva à sala do diretor: mesa intacta, seis cadeiras sem uso, quatro luzes e oito espelhos que só mostram cinza.</p>
				<h3>O que Bartolakk sabe</h3>
				${lista([
					"Não conhece nenhum Farhuk.",
					"A Companhia dos Irmãos tem um irmão com tanta autoridade quanto ele: Khabrias Minareus, \"o Benfeitor\", que de algum jeito burlou a segurança.",
					"Dentro da Rocha, \"todos são como aldeões\"; mesmo assim, o Benfeitor e seus capangas têm poderes. A Academia Arcana não pode se dedicar ao problema.",
					"O principal conselheiro do Benfeitor é um qareen chamado Majid.",
					"Preso num dilema: mandar um exército seria matar guardas (segunda diretriz); um acordo é ilegal (primeira); pedir para ser desativado fere a terceira; não pode ser reprogramado.",
					"Precisa de aventureiros. Sabe que a missão não é derrubar o Benfeitor, mas não nega que seria o ideal."
				])}
				<p><b>Ponto de entrada:</b> com a ordem de uma Xerife, Bartolakk pode prendê-los legalmente, em duplas por cela (sorteie um companheiro de cela em ${L(tabArquetipos)} se o grupo for ímpar). Planos ilegais precisam ser escondidos dele. Enganar o diretor (como na mesa original) é possível, mas não pode ser fácil.</p>`, 200),
			pagina("Limitações da Rocha Cinzenta", `
				${lista([
					"Nenhuma forma de magia: habilidades mágicas param, itens mágicos perdem os poderes.",
					"Personagens perdem todos os PM e não os recuperam de forma alguma (nem descansando).",
					"Todo equipamento é retirado (exceto de quem entrou escondido). Equipamento que faz parte do corpo para de funcionar.",
					"Só deslocamento normal: asas não batem direito, teletransporte e movimentos especiais param.",
					"Todas as outras habilidades param, exceto modificadores permanentes de atributos ou perícias, habilidades de tamanho e fraquezas (como Medo de Altura)."
				])}
				<h3>Mas como...?</h3>
				<p>Todos podem existir na prisão, mas ninguém tem vantagem nela. Goblins continuam Pequenos, mas sem escalada; golens não desligam, mas perdem imunidade a algum elemento; lefou continuam macabros, sem poderes da Tormenta. <b>Se uma habilidade burla a prisão, ela não funciona.</b> Gênios a projetaram e as brechas foram corrigidas há muito tempo.</p>
				<p>Use ${linkMacro("Rocha Cinzenta")} (efeito ${L(itemPorNome("Limitações"))}). Personagens sociais ou de perícias brilham aqui.</p>`, 300),
			pagina("Fase 2 · Atrás das Grades", `
				<p>Armas e armaduras entregues, só a roupa do corpo. Corredores com portas que abrem e fecham em sincronia. Um mezanino de celas, provocações e ameaças. Horários de refeição, pátio e trabalho recitados sem emoção. As portas se fecham. <b>Vocês estão presos.</b></p>
				<h3>O cotidiano</h3>
				<p>A Rocha quer reabilitar: pagar a dívida, aprender um ofício, voltar ao mundo. Ao nascer do sol, carcereiros acendem tochas (escuridão total seria cruel demais). Mingau no salão comunal; quem tem o privilégio vai trabalhar (oficinas, copistas, curtume), os outros voltam às celas. Almoço e jantar iguais. <b>À tarde, o pátio:</b> contrabando, tentativas de assassinato, lutas, acordos, vinganças. O Benfeitor e os capangas nunca são trancados, comem banquetes e fazem corte no pátio. Desafetos ficam presos o dia todo, sem comer e sem sol, ou vão para lugares \"especiais\".</p>
				<h3>Locais e personalidades</h3>
				${lista([
					`<b>Forja</b> (uns 10 presos de confiança): <b>Cremildhe</b>, humana, a ferreira mais experiente, soturna, matou duas pessoas numa briga (${L(itemPorNome("Parceiro: Cremildhe"))}); <b>Imnek</b>, goblin inventor de uma quadrilha de assaltos, louco por engenhocas, aliado natural com os implantes (${L(itemPorNome("Parceiro: Imnek"))}).`,
					`<b>Biblioteca</b>: <b>Borislav</b>, osteon executado por um crime que não lembra, cidadão-modelo que não quer sair (${L(itemPorNome("Parceiro: Borislav"))}); <b>Sakrizi</b>, medusa ladra de livros, presa pelo grimório de um arquimago (${L(itemPorNome("Parceiro: Sakrizi"))}).`,
					`<b>Curtume, lavanderia, limpeza e serviços gerais</b> (vigilância constante, \"testes\"): <b>Jaydill</b>, tritão piadista e assassino serial (${L(atores.jaydill)}; ${L(itemPorNome("Parceiro: Jaydill"))}).`,
					`<b>Cozinha</b> (só presos-modelo, \"gente com quem ninguém mexe\"): <b>Yngri</b>, anã incriminada por desbaratar um culto, a presa de maior confiança, cozinha com a força do ódio (${L(itemPorNome("Parceiro: Yngri"))}); <b>Azure</b>, pirata do Mar Negro, cozinheiro pessoal do Benfeitor, protegido por ele.`,
					"<b>Ala de Contenção Demoníaca</b>: improvisada às pressas, pouco confiável; o número de presos varia sem explicação. Ninguém entra.",
					"<b>Ala de Contenção de Mortos-Vivos</b>: só <b>Angis</b>, fantasma sem memória que atormentava vítimas até a morte. Um advogado o tornou \"cidadão\". Quer liberdade para escolher a próxima vítima."
				])}
				<p>Outros clichês de filme de prisão existem: use ${linkMacro("Prisioneiro Improvisado")}. Lembre que a maioria cometeu crimes sérios: podem virar rivais de verdade.</p>
				<h3>Encontros prontos</h3>
				<p>${[atores.bandido, atores.carcereiro, atores.chefe, atores.turba].map(L).join(", ")}. Numa briga com plateia, ${linkMacro("Amigos no Corredor")}.</p>`, 400),
			pagina("O Feudo do Benfeitor", `
				<p>Uma ala grande com a cela expandida do minotauro (várias celas viraram um salão) e os domínios dos capangas, guardada por presos e carcereiros. Detentos vêm pedir favores e entregar comida, armas, joias, dinheiro e ferramentas. Não há saída para fora daqui. Destaques: a <b>sala de cirurgia</b> e a sala de interrogatório.</p>
				${lista([
					`${L(atores.benfeitor)}: o chefe. Desconfiado, cruel, implacável; um ser vivo, apesar de tudo.`,
					`${L(atores.stoke)}: o carcereiro corrupto que traz o contrabando e os cristais.`,
					`${L(atores.farhuk)}: o conselheiro, sempre vigiado.`,
					`${L(atores.tryphne)}: a clériga que opera. Trágica, não maligna.`,
					`${L(atores.nerisha)}: a sulfure nascida na Rocha, que controla a entrada e saída de produtos e poderia desenhar um mapa.`,
					`${L(atores.rakkas)}: o troglodita mais durão da prisão.`
				])}
				<h3>O interesse de Ghorskander</h3>
				<p>Por que o oficial médico da Roca se arriscaria por uma clériga da irmandade? Os jogadores devem achar desproporcional. Os presos são cobaias: quando Valkaria estiver cheia de mensagens subliminares, os aventureiros perderão habilidades, mas os portadores do implante não. Tudo para criar pânico e ganhar o apoio dos nobres que não foram trocados por golens.</p>
				<h3>A sala de cirurgia</h3>
				<p>Depósito das pistas que você quiser dar: diagramas de origem kliren, o símbolo do relógio, trechos do Diário Científico de Ghorskander (${L(itemPorNome("Pergaminhos"))}).</p>
				<h3>Contrabando</h3>
				<p>Stoke tem contato com criminosos lá fora e, às vezes, com a própria Companhia: recebe os cristais de gente de confiança de \"Paollus\" (o construto no lugar dele). Seguir Stoke pode mostrar uma taverna da irmandade, um informante, ou Paollus e Torgo na entrega.</p>
				<h3>O subterrâneo</h3>
				<p>Sob a Rocha e dentro das muralhas, esgotos, galerias, túneis de presos e ruínas se interligaram num pequeno labirinto: espaço de masmorra (ironia de Hyninn). Armadilhas aleatórias (solo que cede, ácido gotejando, alvenaria \"prestes a cair\") e ${L(atores.dejeto)}. Visão na penumbra e no escuro não funcionam aqui.</p>`, 500),
			pagina("A Cirurgia", `
				<p>Quem se infiltra no bando do Benfeitor quase certamente passa por ela; muitos grupos vão querer, para recuperar as habilidades. Use ${linkMacro("Cirurgia")}.</p>
				<h3>Testes de Tryphne</h3>
				${lista([
					"<b>Religião CD 15</b> (+7): passou, ela descansou e rezou, PM completos. Falhou, poucos PM: os resultados de Fortitude do paciente caem uma categoria.",
					"<b>Cura CD 25</b> (+12): passou, o paciente tem acesso às habilidades dentro da Rocha. Falhou, a cirurgia fracassa e precisa de nova tentativa."
				])}
				<h3>Teste do aventureiro: Fortitude CD 20</h3>
				${lista([
					"<b>1 natural:</b> –1 PV, inconsciente e sangrando. Pode morrer se não for socorrido; Tryphne não tem mais PM para impedir.",
					"<b>Falha:</b> acorda com metade dos PV (só voltam com descanso natural) e fica debilitado até recuperá-los.",
					"<b>Sucesso:</b> acorda com metade dos PV (só voltam com descanso natural).",
					"<b>20 natural:</b> acorda sem nenhum efeito negativo."
				])}
				<p>Golens, osteon e outros sem fisiologia normal mantêm as imunidades que a Rocha não bloqueou.</p>
				<h3>Relato da mesa original</h3>
				<p>Os jogadores morreram de medo da palavra \"cirurgia\", e o mestre correspondeu: acesso pleno a poderes, mas pesadelos (Vontade CD 20 para descansar; senão, descanso ruim) e um número limitado de cristais. Para compensar, o Benfeitor não usou tudo no combate final (atacado comendo, estava sem o charuto). Opção na macro.</p>
				<p>Item: ${L(itemPorNome("Implante"))}.</p>`, 600),
			pagina("Fase 3 · Fuga Impossível", `
				<p>Quase todo grupo segue um destes planos. Se não, peça um tempo.</p>
				<h3>Tomada de poder</h3>
				${lista([
					"<b>Intimidação:</b> ser visto vencendo (Rakkas na frente de todos é o óbvio). Carcereiros, honestos e corruptos, tentam parar a briga.",
					"<b>Vantagens:</b> oferecer algo além de medo: contrabando, contatos, tirar um NPC das garras do Benfeitor, histórias e promessas.",
					"<b>Aliados:</b> alguém que conheça a Rocha, alguém ligado aos carcereiros, alguém que conheça as estratégias do Benfeitor e alguém que organize os presos (heróis podem cumprir alguns papéis).",
					"<b>Habilidades especiais:</b> o caminho evidente é a redenção de Tryphne.",
					"<b>Discrição</b> e <b>oportunidade:</b> tudo às escondidas, depois um ataque rápido e devastador. Com a facção no poder, Farhuk pede testemunhas de fora e Bartolakk aceita."
				])}
				<h3>Agentes duplos</h3>
				<p>Audiência é fácil; o difícil é ter algo a oferecer. Ser melhor que um capanga (vencer Rakkas, cozinhar melhor que Azure, conhecer a prisão melhor que Nerisha) ou oferecer algo novo (segredos da Companhia ou da Guarda, ciência, conhecimento antigo, entretenimento). Ou conquistar a amizade dele. Para não acabar sem ação: Nerisha ou Stoke desconfia e, na hora de levar Farhuk ao diretor, o Benfeitor ataca; ou Stoke barra o caminho.</p>
				<h3>Mas e Farhuk?</h3>
				<p>Só a vigilância do Benfeitor impede Farhuk de pedir testemunhas. Ele nunca está sozinho: com o minotauro, ou cercado de capangas e carcereiros corruptos que denunciam qualquer contato com o diretor. Derrotar um vigia não basta.</p>
				<h3>Infiltração</h3>
				<p>Exige um mapa (${L(itemPorNome("Mapa"))}); depois, um teste por local. Furtividade sozinha não extrai Farhuk: é preciso se revelar a ele e usar outro plano.</p>
				<h3>Ataque frontal</h3>
				<p>Sem poderes, é suicídio: deixe claro. Os sobreviventes viram prisioneiros do Benfeitor, que os interroga e mata. Um grupo com sorte pode concentrar tudo no minotauro; os capangas querem proteger o chefe (agarrar, desarmar, conter). Com ele morto, Intimidação pode dispersar a facção. Depois de recuperar equipamento e habilidades, atacar com surpresa é ótima ideia: a prisão vira um caos.</p>
				<h3>Distração</h3>
				<p>Uma revolta geral distrai carcereiros e presos, mas raramente chega ao feudo; revoltar os capangas exige indignação maior que o medo. Depois, uma corrida de obstáculos arrastando Farhuk, e ainda um carcereiro de confiança que abra as portas contra as ordens: Bartolakk mantém os presos dentro mesmo sabendo o motivo. Com Farhuk diante dele, solitária ou lugar protegido até tudo se ajeitar.</p>
				<h3>Fuga ousada</h3>
				<p>Acesso a Farhuk, equipamento, habilidades e, acima de tudo, um mapa. Bartolakk pode deixar ver um mapa (não levar): mostre aos jogadores, mas não deixe consultar; Inteligência CD 15 a 20 para lembrar cada detalhe. Stoke ou Nerisha podem dar um. Veja a próxima página.</p>`, 700),
			pagina("Túnel e Corrida para a Liberdade", `
				<h3>Escavando um túnel</h3>
				<p>${linkMacro("Túnel")}. Teste estendido em grupo de <b>Atletismo CD 30, 5 sucessos</b>, uma semana por teste; sem ferramentas, CD +5. Dois escavam: um testa, o outro ajuda com bônus dobrado (+2 com 10, +4 com 20); outros ajudam com Conhecimento, Guerra ou Ofício. Cada falha é um imprevisto: CD +2. <b>3 falhas:</b> desabamento, dois testes de Reflexos (CD atual): uma falha, metade dos PV e fatigado até recuperar; duas, soterrado e morto. O túnel recomeça do zero.</p>
				<p>A cada semana, alguém oculta a obra (CD 25, qualquer perícia justificável; quem oculta não escava). Uma falha: desconfiança, CD 30. Duas: os guardas descobrem.</p>
				<p>No túnel, o espaço de masmorra: três ou quatro salas e o ${L(atores.dejeto)}. Fora das muralhas, as habilidades voltam (o equipamento não). Lá fora, a Guarda pode perseguir o grupo até uma guarita de confiança, ou deixe-os escapar por um beco.</p>
				<h3>Corrida para a liberdade</h3>
				<p>${linkMacro("Corrida")}. Teste estendido em grupo de várias perícias, <b>CD 20 + Prontidão, 7 sucessos</b> antes de 3 falhas. Um evento por rodada (1d6). Perícias alternativas com boas ideias, cada uma só uma vez.</p>
				${lista([
					"<b>1 Corredores:</b> Atletismo (+2 Prontidão, sucesso conta como dois) ou Furtividade (+1 só se falhar).",
					"<b>2 Prisioneiros:</b> combater (Luta ou Pontaria, +2), negociar (Diplomacia, Enganação ou Intimidação) ou convidar para a fuga (sucesso automático, +1d4). Falhando, repete.",
					"<b>3 Chance de distração:</b> uma perícia da Tabela 6-6 (Tormenta20, p. 279); passando, –1d6 de Prontidão.",
					"<b>4 Porta trancada:</b> Ladinagem (CD +2; sucesso –1) ou Atletismo (+1).",
					"<b>5 Atravessar o pátio:</b> cada um testa Atletismo ou Furtividade; metade passando é um sucesso. 1d4 = 1: uma luz mágica, –5. Só uma vez; repetido, vale Corredores.",
					"<b>6 Passar por guardas:</b> Enganação (falha +1, sucesso –1), Furtividade (falha por 5+ dá +1) ou combate (+2; não dá mais para enganar ou se esgueirar deste grupo). Falhando, repete."
				])}
				<p><b>Discrição:</b> qualquer teste pode ter –5; passando, –1 de Prontidão. <b>Falha total:</b> surra, 0 PV (sem sangrar), de volta às celas, vigiados para sempre: esta fuga vira falha automática e as outras ficam com CD +5.</p>`, 800),
			pagina("Fase 4 · Desfecho", `
				<p>Farhuk respira o ar fumacento da capital: <i>\"Finalmente posso ser eu de novo. Depois de passar anos como amigo de bandidos, estou de volta à Guarda. Cercado de heróis... E de estranhos.\"</i> Ele sente apego aos facínoras que o abrigaram e precisa recomeçar. Mais uma pessoa sozinha na multidão de Valkaria. Decida se ele fica fixo na Guarita da Praia ou aparece às vezes.</p>
				<h3>A revelação</h3>
				<p>Provavelmente a primeira menção a <b>Ghorskander</b>. A tripulação da Roca ainda controla a Companhia dos Irmãos, mesmo sem Syvarian; somado a Paollus \"mudado\", o grupo começa a juntar as peças (controle mental, ou algo pior). E o mais importante: os criminosos manterão as habilidades quando os aventureiros as perderem. Quem jogou a Aventura 1 vai entender o perigo.</p>
				<h3>Provas</h3>
				${lista([
					`${L(itemPorNome("Pergaminhos"))}.`,
					"O depoimento de Farhuk ou de Tryphne.",
					`${L(itemPorNome("Documentos"))}.`,
					"Uma inspeção da Rocha mostrando que o Benfeitor alterou a arquitetura.",
					`O corpo de um prisioneiro operado, ou ${L(itemPorNome("Cristal Rosado"))}.`
				])}
				<h3>Pagamento</h3>
				<p>Com Farhuk em segurança, a Xerife Mathilda paga <b>T$ 12.000</b> (níveis 8–9), <b>T$ 24.000</b> (nível 10) ou <b>T$ 32.000</b> (nível 11).</p>
				<h3>Parceiros na Rocha Cinzenta</h3>
				${lista([
					`Cremildhe: fortona veterana · ${L(itemPorNome("Parceiro: Cremildhe"))}`,
					`Imnek: destruidor (ácido) iniciante · ${L(itemPorNome("Parceiro: Imnek"))}`,
					`Borislav: ajudante veterano (Conhecimento, Nobreza, Religião) · ${L(itemPorNome("Parceiro: Borislav"))}`,
					`Sakrizi: ajudante veterana (Furtividade, Ladinagem, Misticismo) · ${L(itemPorNome("Parceiro: Sakrizi"))}`,
					`Yngri: assassina veterana · ${L(itemPorNome("Parceiro: Yngri"))}`,
					`Jaydill: assassino mestre · ${L(itemPorNome("Parceiro: Jaydill"))}`,
					`Tryphne: médica veterana · ${L(itemPorNome("Parceiro: Tryphne"))}`,
					`Farhuk: adepto iniciante e ajudante veterano (Enganação, Intuição, Investigação) · ${L(itemPorNome("Parceiro: Farhuk (Adepto"))} · ${L(itemPorNome("Parceiro: Farhuk (Ajudante"))}`
				])}`, 900)
		]
	});

	ui.notifications.info("Fim dos Tempos · Arco 2 · Aventura 3 (Fuga da Rocha Cinzenta): conteúdo criado.");
})();
