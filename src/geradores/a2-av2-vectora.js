/* =====================================================================
 * FIM DOS TEMPOS · ARCO 2 · AVENTURA 2 · "CONEXÃO VECTORA"
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Arco 2 · Av2 · Conexão Vectora" com:
 *      - As quatro facções: os elfos de Elyrionn, Janara e os agentes do Reinado, o casal de
 *        anões Rolthurr e Mazynne, sir Androwe Heribran e os cavaleiros corrompidos; os
 *        bandidos da Tropa da Floresta e das Montanhas; Andrus, o Aranha; grifos de montaria.
 *      - Itens: o baú com o simbionte, as Asas do Devorador (pterodraco), o medalhão de Janara,
 *        o baú do pagamento, o anel do sacrifício e as provas.
 *      - Tabelas: Eventos da Perseguição Aérea, Eventos da Perseguição a Pé e Transportes Disponíveis.
 *      - Diário com guia, facções, as seis fases, as contingências, provas e pagamento.
 *      - Macros: Vectora Atracou?, Achar os Elfos, Créditos do Mestre, Perseguição em Vectora,
 *        Batalha no Campo de Keenn, Andrus Ataca e Transportes para Vectora.
 *   3. Lei & Ordem continua no ator e na macro criados pela Aventura 0 (não são recriados aqui).
 *   4. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "a2av2".
 *
 * Feito a partir do código do sistema (1.6.4, out/2026). Validado no Foundry simulado do
 * módulo giriarpg-fim-dos-tempos; veja o guia a2-av2-vectora.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "a2av2";
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
			window: { title: "Aventura 2 do Arco 2: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para a Aventura 2 do Arco 2.</p>
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
	const NOME_PASTA = "FdT · Arco 2 · Av2 · Conexão Vectora";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#6b5a2a", flags: FLAGS() })).id;
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

	const ATR_PERICIA = { luta: "for", atle: "for", pont: "des", inic: "des", refl: "des", furt: "des", acro: "des", fort: "con", perc: "sab", vont: "sab", intu: "sab", sobr: "sab", reli: "sab", atua: "car", enga: "car", dipl: "car", inti: "car", mist: "int", ofi0: "int", conh: "int", pilo: "des", inve: "int", ladi: "des", guer: "int", cura: "sab", nobr: "int", ades: "car", cava: "des" };

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
		data.system.detalhes ??= {};
		data.system.detalhes.biography ??= { value: "", public: "" };
		data.system.detalhes.biography.value = `${o.bio ?? ""}<hr>${data.system.detalhes.biography.value ?? ""}`;
		return Actor.create(data);
	};

	const furtivo = (d) => aoUsar(`Ataque Furtivo (+${d})`, "icons/magic/perception/silhouette-stealth-shadow.webp", [["dano", d]], ["attack"]);
	const ICO = {
		espadaCurta: `${T20I}/itens/equipamentos/espada-curta.webp`,
		espadaBastarda: `${T20I}/itens/equipamentos/espada-bastarda.webp`,
		espadaLonga: `${T20I}/itens/equipamentos/espada-longa.webp`,
		lanca: `${T20I}/itens/equipamentos/lanca-montada.webp`,
		florete: `${T20I}/itens/equipamentos/florete.webp`,
		adaga: `${T20I}/itens/equipamentos/adaga.webp`,
		martelo: `${T20I}/itens/equipamentos/martelo-de-guerra.webp`,
		machadinha: `${T20I}/itens/equipamentos/machadinha.webp`,
		besta: `${T20I}/itens/equipamentos/besta-leve.webp`,
		cimitarra: `${T20I}/itens/equipamentos/cimitarra.webp`,
		escudo: `${T20I}/itens/equipamentos/escudo-pesado.webp`
	};
	const BLOQUEIO = (quem, rd) => poder("Bloqueio", "icons/svg/shield.svg",
		p(`<b>Reação, 1×/rodada.</b> Quando sofre dano de um ataque, ${quem} reduz esse dano em ${rd}.`), { exec: "reaction" });
	const ROLAMENTO = (quem) => poder("Rolamento Defensivo", "icons/svg/falling.svg",
		p(`<b>Reação, 1×/rodada.</b> Quando sofre dano, ${quem} reduz esse dano à metade e fica caído.`), { exec: "reaction", effects: [cond("Caído")] });
	const EVASAO = () => poder("Evasão", "icons/svg/shield.svg",
		p("Quando passa em Reflexos contra um efeito que reduz o dano à metade, não sofre dano."), { exec: "passive" });
	const CAVALEIRO_EXPERIENTE = (quem) => poder("Cavaleiro Experiente", `${T20I}/itens/gerais/grifo.webp`,
		p(`${quem} passa automaticamente em Cavalgar para não cair da montaria quando sofre dano e não sofre penalidade para atacar à distância montado.`,
			"<b>Investida montada:</b> +2d8 de dano (marque o aprimoramento) e pode continuar se movendo depois do ataque, em linha reta, até o dobro do deslocamento."),
		{ exec: "passive" });
	const DUELO = (quem) => poder("Duelo", "icons/svg/sword.svg",
		p(`<b>Livre, 1×/rodada.</b> ${quem} escolhe um oponente em alcance curto e recebe +4 em ataque e dano contra ele até o fim da cena ou até atacar outro oponente. Ligue o efeito "Duelo" na ficha.`),
		{ exec: "free" });
	const efeitoDuelo = () => chave("Duelo (+4 contra o oponente escolhido)", "icons/svg/sword.svg", [["system.modificadores.ataque.geral", "4"], ["system.modificadores.dano.geral", "4"]], false,
		"Só contra o oponente escolhido. Desligue quando ele atacar outro alvo ou no fim da cena.");
	const investida = () => aoUsar("Investida montada (+2d8)", `${T20I}/itens/gerais/grifo.webp`, [["dano", "2d8"]], ["attack"]);

	/* ------------------------------------------------------------------ */
	/* 2. As facções                                                        */
	/* ------------------------------------------------------------------ */
	const atores = {};

	/* ---------- Os elfos ---------- */
	const BIO_ELFOS = "Quadrilha de oito elfos vindos do Império de Tauron, embrutecidos e cheios de cicatrizes. Traficam itens da Tempestade Rubra desde o caos que se seguiu à morte do Deus da Força. Lutam até a morte, mas acima de tudo protegem o baú: são precisos dois elfos para carregá-lo, e eles escapam se dois passarem 2 rodadas seguidas com ele e um vencer Furtividade contra a Percepção do grupo. Vencendo, não matam os heróis: assassinatos chamariam atenção e assustariam os compradores.";
	atores.elyrionn = await criarNPC({
		name: "Elyrionn",
		role: "elyrionn",
		link: true,
		img: `${T20I}/racas/elfo.webp`,
		nd: 8,
		cd: 20,
		tipo: "hum",
		raca: "elfo",
		papel: "solo",
		atr: { for: 1, des: 5, con: 0, int: 2, sab: 0, car: 2 },
		pv: 140,
		def: 31,
		walk: 15,
		sentidos: ["penumbra"],
		pericias: { inic: 13, perc: 10, fort: 9, refl: 21, vont: 16, luta: 26, acro: 15, atle: 11, furt: 15, inti: 11, ladi: 15 },
		resTxt: "Evasão.",
		equipTxt: "Armadura de couro, bandana, espada curta precisa, sapato de camurça.",
		ataquesTxt: "Espada curta ×2 +26 (2d6+13, 18).",
		bio: p("Líder dos elfos: alto, cabelo rente, cicatriz em X no rosto. Frio e implacável, não hesita em matar e valoriza o ouro acima de tudo.",
			"Capturado, tenta negociar a vida. Conta a história da quadrilha, o leilão no submundo de Tiberus (sem revelar que era um simbionte), que sir Androwe tentou comprar o item e é cultista, e que a Tropa da Floresta e das Montanhas é uma irmandade menor mas perigosa. Pode dar <b>Ladinagem +15 como ajuda</b> para achar os cavaleiros.",
			"Como aliado na fase 5, conta como parceiro <b>atirador veterano</b>.", BIO_ELFOS),
		items: [
			arma("Espada Curta Precisa (×2)", ICO.espadaCurta, { dano: "2d6+13", tipo: "perfuracao", critM: 18, effects: [furtivo("5d6")],
				desc: p("Dois ataques por ação padrão. Pode usar o Ataque Furtivo em até dois ataques na mesma rodada.") }),
			poder("Ataque Furtivo", "icons/magic/perception/silhouette-stealth-shadow.webp", p("+5d6 contra alvos desprevenidos ou flanqueados, em até dois ataques por rodada. Marque o aprimoramento na janela de ataque."), { exec: "passive" }),
			poder("Escudo Arcano", `${T20I}/magias/campo-de-forca.webp`,
				p("<b>Reação, 1×/rodada.</b> Quando sofre dano, cria uma proteção equivalente a <i>Campo de Força</i> e recebe <b>redução de dano 30</b> contra esse dano."), { exec: "reaction" }),
			poder("Emboscar", "icons/magic/perception/silhouette-stealth-shadow.webp",
				p("<b>Livre.</b> Na primeira rodada de cada combate, executa uma ação padrão adicional no seu turno."), { exec: "free" }),
			ROLAMENTO("Elyrionn"),
			EVASAO()
		]
	});

	atores.elfo = await criarNPC({
		name: "Elfo Fora da Lei",
		role: "elfo",
		img: `${T20I}/racas/elfo.webp`,
		nd: 7,
		cd: 19,
		tipo: "hum",
		raca: "elfo",
		papel: "lackey",
		atr: { for: 1, des: 4, con: 0, int: 2, sab: 0, car: 1 },
		pv: 60,
		def: 28,
		walk: 15,
		sentidos: ["penumbra"],
		pericias: { inic: 11, perc: 9, fort: 8, refl: 19, vont: 14, luta: 26, acro: 12, atle: 10, furt: 13, inti: 9, ladi: 13 },
		resTxt: "Evasão.",
		equipTxt: "Armadura de couro, bandana, espada curta, sapato de camurça.",
		ataquesTxt: "Espada curta ×2 +26 (2d6+13, 19).",
		bio: p("Use sete. É um lacaio na batalha do Campo de Keenn (ferido com 1 ou 2 no d6 da macro <i>Batalha no Campo de Keenn</i>).",
			"<b>Sumiço do Baú:</b> um deles tem o <i>Anel do Sacrifício</i>. Se o grupo tomar o baú e os elfos não tiverem saída dentro das regras, ele se joga sobre o baú e explode, teleportando-o (gaste um crédito na macro <i>Créditos do Mestre</i>).", BIO_ELFOS),
		items: [
			arma("Espada Curta (×2)", ICO.espadaCurta, { dano: "2d6+13", tipo: "perfuracao", critM: 19, effects: [furtivo("4d6")],
				desc: p("Dois ataques por ação padrão. Pode usar o Ataque Furtivo em até dois ataques na mesma rodada.") }),
			poder("Ataque Furtivo", "icons/magic/perception/silhouette-stealth-shadow.webp", p("+4d6 contra alvos desprevenidos ou flanqueados, em até dois ataques por rodada."), { exec: "passive" }),
			ROLAMENTO("o elfo"),
			EVASAO()
		]
	});

	/* ---------- Os humanos (agentes da Coroa) ---------- */
	atores.janara = await criarNPC({
		name: "Janara",
		role: "janara",
		link: true,
		disposition: 0,
		img: `${T20I}/classes/bucaneiro.webp`,
		nd: 8,
		cd: 21,
		tipo: "hum",
		raca: "humana",
		papel: "solo",
		atr: { for: 1, des: 4, con: 3, int: 2, sab: 1, car: 3 },
		pv: 290,
		def: 33,
		walk: 9,
		pericias: { inic: 12, perc: 9, fort: 15, refl: 19, vont: 10, luta: 26, pont: 26, acro: 12, atle: 9, guer: 10, inve: 10, intu: 10, nobr: 10 },
		icCustom: "encantamento",
		resTxt: "Esquiva sobrenatural, evasão, imunidade a encantamento, resistência a medo +2.",
		equipTxt: "Couraça sob medida, florete preciso, enfeite de elmo, medalhão do Reinado (até Andrus roubá-lo).",
		ataquesTxt: "Florete ×2 +26 (2d8+13, 15).",
		ataquesAdTxt: "Adaga +26 (2d4+12, 19).",
		bio: p("Espadachim veterana de cabelos brancos, de casaca. <b>Ex-integrante do Protetorado do Reino</b> (serviu sob Arkam Braço Metálico), hoje agente da Coroa: foi mandada comprar o \"artefato\" e tirá-lo de circulação com o mínimo de violência. Não conhece a natureza do item. A Guarda nunca foi avisada, para proteger o disfarce.",
			"Muito prática. Não quer matar, mas tem pouca paciência para \"heróis\" e se considera acima da Guarda. Sem o medalhão (que Andrus rouba no Campo de Keenn), só tem a palavra: Intuição revela que \"ela parece falar a verdade\", com –5 porque tudo nela é suspeito.",
			"<b>Matar Janara custa –5 de Lei &amp; Ordem</b> (o grupo descobre depois que era tudo verdade). Como aliada na fase 5, conta como parceira <b>combatente veterana</b>."),
		items: [
			arma("Florete Preciso (×2)", ICO.florete, { pericia: "luta", atributo: "des", dano: "2d8+13", tipo: "perfuracao", critM: 15, effects: [cond("Sangrando")],
				desc: p("Dois ataques por ação padrão. <b>Estocada Perfurante:</b> ignora 5 de RD. <b>Ferimento Profundo:</b> críticos deixam o alvo sangrando (botão no card).") }),
			distancia("Adaga", ICO.adaga, { dano: "2d4+12", tipo: "perfuracao", critM: 19, alcance: "curto" }),
			poder("Audácia", "icons/svg/upgrade.svg", p("<b>Reação, 1×/cena.</b> Soma o Carisma (+3) num teste de perícia."), { exec: "reaction" }),
			poder("Bloqueio Resistente", "icons/svg/shield.svg",
				p("<b>Reação, 1×/rodada.</b> Quando é atingida por um ataque, faz um teste de ataque com o florete: o dano é reduzido pelo resultado desse teste."),
				{ exec: "reaction", rolls: [["Bloqueio (redução)", [["1d20+26", ""]]]] }),
			poder("Estocada Perfurante", "icons/svg/sword.svg", p("Os ataques corpo a corpo ignoram 5 pontos de redução de dano."), { exec: "passive" }),
			poder("Ferimento Profundo", "icons/svg/blood.svg", p("Acertos críticos deixam o alvo sangrando."), { exec: "passive" }),
			poder("Mexa-se, Soldado!", "icons/svg/upgrade.svg", p("<b>Movimento.</b> Comanda um aliado em alcance médio, que faz uma ação padrão imediatamente."), { exec: "move" }),
			EVASAO()
		]
	});

	atores.agente = await criarNPC({
		name: "Humano Agente do Reinado",
		role: "agente",
		disposition: 0,
		img: `${T20I}/classes/guerreiro.webp`,
		nd: 7,
		cd: 19,
		tipo: "hum",
		raca: "humano",
		papel: "lackey",
		atr: { for: 3, des: 1, con: 3, int: 1, sab: 0, car: 1 },
		pv: 66,
		def: 24,
		walk: 9,
		pericias: { inic: 8, perc: 7, fort: 19, refl: 8, vont: 14, luta: 26, atle: 10, guer: 8, inti: 8 },
		equipTxt: "Cota de malha, espada bastarda, espada curta. Dois deles carregam o baú do pagamento.",
		ataquesTxt: "Espada bastarda +26 (2d12+15, 19) e espada curta +26 (2d6+15, 19).",
		bio: p("Use cinco. Aparência de mercenários, com armas e armaduras variadas. Obedecem a Janara e não contam como parceiros para mais ninguém."),
		items: [
			arma("Espada Bastarda", ICO.espadaBastarda, { dano: "2d12+15", tipo: "corte", critM: 19, effects: [aoUsar("Trabalho em Equipe (+1d8)", "icons/svg/combat.svg", [["dano", "1d8"]], ["attack"])],
				desc: p("Ataca com a espada bastarda <b>e</b> a espada curta na mesma ação. <b>Trabalho em Equipe:</b> flanqueando com Janara ou outro agente, +2 no ataque e +1d8 no dano (além do flanco).") }),
			arma("Espada Curta", ICO.espadaCurta, { dano: "2d6+15", tipo: "perfuracao", critM: 19 }),
			BLOQUEIO("o agente", 5),
			poder("Trabalho em Equipe", "icons/svg/combat.svg", p("Quando flanqueia com Janara ou outro agente do Reinado: +2 no ataque e +1d8 no dano, além do bônus de flanco."), { exec: "passive" })
		]
	});

	/* ---------- Os anões ---------- */
	const BIO_ANOES = "Casal de anões endividado com a Tropa da Floresta e das Montanhas: Rolthurr perdeu no jogo e a dívida se paga com o item. Muito apaixonados, chamam-se de \"meu Pedregulho\" e \"Trobinha\". Nervosos e apavorados; cada um protege o outro. Juntos, contam como um único parceiro assassino iniciante (+1d6). Saída óbvia (e desonesta): roubar o baú do pagamento de Janara.";
	atores.rolthurr = await criarNPC({
		name: "Rolthurr",
		role: "rolthurr",
		link: true,
		disposition: 0,
		img: `${T20I}/racas/anao.webp`,
		nd: 4,
		cd: 16,
		tipo: "hum",
		raca: "anão",
		papel: "special",
		atr: { for: 3, des: 0, con: 3, int: 1, sab: 0, car: -1 },
		pv: 120,
		def: 12,
		walk: 6,
		sentidos: ["escuro"],
		pericias: { inic: 2, perc: 2, fort: 16, refl: 4, vont: 10, luta: 17, atle: 7, ofi0: 9 },
		res: { fogo: { base: 2 } },
		resTxt: "Resistência a fogo +2. Percepção +4 em subterrâneo.",
		equipTxt: "Avental de couro (conta como armadura de couro), instrumentos de ofício (ferreiro), martelo de guerra.",
		ataquesTxt: "Martelo de guerra ×2 +17 (1d8+7).",
		bio: p("Ferreiro. Foi a dívida de jogo dele que meteu o casal nisso.", BIO_ANOES),
		items: [
			arma("Martelo de Guerra (×2)", ICO.martelo, { dano: "1d8+7", tipo: "impacto", critX: 3,
				effects: [aoUsar("Martelo e Bigorna (+2)", ICO.martelo, [["ataque", "2"], ["dano", "2"]], ["attack"])],
				desc: p("Dois ataques por ação padrão. <b>Martelo e Bigorna:</b> +2 no ataque e no dano ao usar a manobra quebrar ou atacar um objeto ou construto.") }),
			poder("Martelo e Bigorna", ICO.martelo, p("+2 no ataque e no dano quando usa a manobra quebrar ou ataca um objeto ou construto."), { exec: "passive" })
		]
	});

	const pocao = (name, img, desc, o) => poder(name, img, p(desc), { exec: "action", alcance: "short", ...o });
	atores.mazynne = await criarNPC({
		name: "Mazynne",
		role: "mazynne",
		link: true,
		disposition: 0,
		img: `${T20I}/racas/anao.webp`,
		nd: 4,
		cd: 20,
		tipo: "hum",
		raca: "anã",
		papel: "special",
		atr: { for: 0, des: 0, con: 4, int: 3, sab: 2, car: 2 },
		pv: 80,
		def: 20,
		walk: 6,
		sentidos: ["escuro"],
		pericias: { inic: 4, perc: 6, fort: 4, refl: 10, vont: 16, luta: 15, pont: 13, ladi: 4, ofi0: 9 },
		res: { acido: { base: 5 }, fogo: { base: 5 } },
		resTxt: "Redução de ácido e fogo 5. Percepção +8 em subterrâneo.",
		equipTxt: "Besta leve, couro batido, instrumentos de ofício (alquimista) aprimorados, machadinha, virotes ×20.",
		ataquesTxt: "Machadinha +15 (1d6+8, ×3).",
		ataquesAdTxt: "Besta leve +13 (2d8+10, 19, mais 2d4 de ácido).",
		bio: p("Alquimista diletante. É a bomba de fumaça dela que começa a batalha no Campo de Keenn.", BIO_ANOES),
		items: [
			arma("Machadinha", ICO.machadinha, { dano: "1d6+8", tipo: "corte", critX: 3 }),
			distancia("Besta Leve", ICO.besta, { dano: "2d8+10", tipo: "perfuracao", critM: 19, alcance: "medio", extra: [["2d4", "acido"]] }),
			pocao("Bomba de Fumaça", `${T20I}/itens/gerais/bomba-fumaca.webp`,
				"<b>Alquimista Diletante (padrão).</b> Fumaça espessa em raio de 6m a partir de um ponto em alcance curto: obscurece toda visão, camuflagem a até 1,5m e camuflagem total a partir de 3m. Dura até o fim da cena.",
				{ area: "raio de 6m", durU: "scene" }),
			pocao("Estalinho Gury", `${T20I}/itens/gerais/bomba.webp`,
				"<b>Alquimista Diletante (padrão).</b> Raio de 3m em alcance curto: <b>4d6 de impacto</b> e surdo. <b>Fortitude CD 20</b> reduz à metade e evita a condição.",
				{ area: "raio de 3m", save: "Fortitude CD 20 reduz à metade e evita surdo", rolls: [["Impacto", [["4d6", "impacto"]]]], effects: [cond("Surdo")] }),
			pocao("Granada de Fogo", `${T20I}/itens/gerais/fogo-alquimico.webp`,
				"<b>Alquimista Diletante (padrão).</b> Raio de 6m em alcance curto: <b>8d6 de fogo</b>. <b>Reflexos CD 20</b> reduz à metade.",
				{ area: "raio de 6m", save: "Reflexos CD 20 reduz à metade", rolls: [["Fogo", [["8d6", "fogo"]]]] }),
			pocao("Visco Persistente", `${T20I}/itens/gerais/acido.webp`,
				"<b>Alquimista Diletante (padrão).</b> Uma criatura em alcance curto: <b>4d4 de ácido</b> e enredada. <b>Fortitude CD 20</b> reduz à metade e evita a condição. Soltar-se: ação padrão e Atletismo contra a CD do visco.",
				{ alvo: "1 criatura", save: "Fortitude CD 20 reduz à metade e evita enredado", rolls: [["Ácido", [["4d4", "acido"]]]], effects: [cond("Enredado")] })
		]
	});

	/* ---------- Os cavaleiros ---------- */
	const BIO_CAV = "Cavaleiros da Luz corrompidos pela Tormenta que ainda resta em Norm, convertidos em cultistas. Armaduras de cavaleiros da Luz cheias de mossas, com detalhes de carapaça rubra quase invisíveis. No Campo de Keenn ficam ocultos por invisibilidade (Percepção CD 30 nota o ar tremeluzindo; Misticismo CD 15 identifica magia). Na fase 5 fogem em grifos e lutam até a morte, sem nunca se aliar a ninguém.";
	atores.androwe = await criarNPC({
		name: "Sir Androwe Heribran",
		role: "androwe",
		link: true,
		img: `${T20I}/ameacas/cavaleiro-supremacista.png`,
		nd: 8,
		cd: 21,
		tipo: "hum",
		raca: "humano",
		papel: "solo",
		atr: { for: 4, des: 1, con: 3, int: 1, sab: 1, car: 3 },
		pv: 310,
		def: 35,
		walk: 9,
		pericias: { inic: 9, perc: 9, fort: 20, refl: 9, vont: 15, luta: 26, atle: 12, cava: 11, dipl: 14, guer: 9, inti: 12, nobr: 9 },
		res: { dano: { base: 5 } },
		resTxt: "Redução de dano 5, resistência a medo +5.",
		equipTxt: "Armadura completa, escudo pesado, espada bastarda precisa, lança montada maciça, tabardo aprimorado.",
		ataquesTxt: "Lança montada ×2 +26 (2d6+19, ×4, alcance 3m) ou espada bastarda ×2 +26 (2d6+19, 18).",
		tesouro: "Metade.",
		bio: p("Líder dos cavaleiros: sádico e brutal, tem prazer em matar. Tentou comprar o simbionte dos elfos e não tinha ouro para cobrir a oferta de Janara.",
			"<b>Rodada 5 no Campo de Keenn:</b> vence a disputa, toma o baú e parte a galope (corrida montada).",
			"<b>Truque sujo:</b> se o grupo terminar a batalha com o baú, ele funde dois cavaleiros e seus cavalos numa criatura alada de carne e carapaça vermelha, que agarra o baú e foge (macro <i>Créditos do Mestre</i>).",
			"<b>Fase 5:</b> se metade dos cavaleiros cair, gasta 2 rodadas abrindo o baú e se ligando ao pterodraco. O grupo pode impedir depois da primeira rodada (baú aberto, simbiose ainda não feita). Ligado, ganha voo 9m e a adrenalina do simbionte (efeito na ficha).", BIO_CAV),
		effects: [
			efeitoDuelo(),
			chave("Simbionte: Asas do Devorador (voo 9m, +2 ataque)", `${T20I}/itens/gerais/materia-vermelha.webp`, [["system.attributes.movement.fly.base", "9", "upgrade"], ["system.modificadores.ataque.geral", "2"]], false,
				"Ligue quando ele se ligar ao pterodraco. O +2 no ataque e o +1d6 no dano (aprimoramento nas armas) valem até o fim do primeiro combate depois da simbiose.")
		],
		items: [
			arma("Lança Montada Maciça (×2)", ICO.lanca, { dano: "2d6+19", tipo: "perfuracao", critX: 4,
				effects: [furtivo("4d6"), investida(), aoUsar("Adrenalina do simbionte (+1d6)", `${T20I}/itens/gerais/materia-vermelha.webp`, [["dano", "1d6"]], ["attack"])],
				desc: p("Dois ataques por ação padrão, alcance 3m.") }),
			arma("Espada Bastarda Precisa (×2)", ICO.espadaBastarda, { dano: "2d6+19", tipo: "corte", critM: 18,
				effects: [furtivo("4d6"), aoUsar("Adrenalina do simbionte (+1d6)", `${T20I}/itens/gerais/materia-vermelha.webp`, [["dano", "1d6"]], ["attack"])],
				desc: p("Dois ataques por ação padrão.") }),
			poder("Ataque Furtivo", "icons/magic/perception/silhouette-stealth-shadow.webp", p("+4d6 contra alvos desprevenidos ou flanqueados."), { exec: "passive" }),
			poder("Bloqueio com Escudo", ICO.escudo, p("<b>Reação, 1×/rodada.</b> Quando sofre dano de um ataque, reduz esse dano em 5."), { exec: "reaction" }),
			CAVALEIRO_EXPERIENTE("Sir Androwe"),
			DUELO("Sir Androwe"),
			poder("Simbionte (pterodraco)", `${T20I}/itens/gerais/materia-vermelha.webp`,
				p("Se estiver usando o pterodraco: deslocamento de voo 9m. Pela adrenalina da simbiose, +2 nos ataques e +1d6 no dano com armas até o fim do primeiro combate depois de se ligar."), { exec: "passive" })
		]
	});

	atores.cavaleiro = await criarNPC({
		name: "Cavaleiro Corrompido",
		role: "cavaleiro",
		img: `${T20I}/ameacas/soldado-supremacista.png`,
		nd: 6,
		cd: 18,
		tipo: "hum",
		raca: "humano",
		papel: "lackey",
		atr: { for: 3, des: 1, con: 3, int: 0, sab: 1, car: 2 },
		pv: 56,
		def: 25,
		walk: 6,
		pericias: { inic: 6, perc: 6, fort: 18, refl: 10, vont: 8, luta: 19, atle: 8, cava: 8, guer: 5, inti: 8, nobr: 5 },
		resTxt: "Resistência a medo +5.",
		equipTxt: "Escudo pesado, espada longa, lança montada, meia armadura.",
		ataquesTxt: "Lança montada ×2 +19 (2d6+12, ×3, alcance 3m) ou espada longa ×2 +19 (2d6+12, 19).",
		tesouro: "Metade.",
		bio: p("Use quatro. Fanáticos que obedecem cegamente a sir Androwe e dão a vida pela Tormenta. A investida deles no Campo de Keenn é particularmente letal (opção na macro da batalha).", BIO_CAV),
		effects: [efeitoDuelo()],
		items: [
			arma("Lança Montada (×2)", ICO.lanca, { dano: "2d6+12", tipo: "perfuracao", critX: 3, effects: [furtivo("2d6"), investida()], desc: p("Dois ataques por ação padrão, alcance 3m.") }),
			arma("Espada Longa (×2)", ICO.espadaLonga, { dano: "2d6+12", tipo: "corte", critM: 19, effects: [furtivo("2d6")], desc: p("Dois ataques por ação padrão.") }),
			poder("Ataque Furtivo", "icons/magic/perception/silhouette-stealth-shadow.webp", p("+2d6 contra alvos desprevenidos ou flanqueados."), { exec: "passive" }),
			CAVALEIRO_EXPERIENTE("O cavaleiro"),
			DUELO("O cavaleiro")
		]
	});

	/* ---------- A irmandade e o ladrão ---------- */
	atores.bandido = await criarNPC({
		name: "Bandido da Floresta e das Montanhas",
		role: "bandido",
		img: `${T20I}/ameacas/bandido.png`,
		nd: 6,
		cd: 18,
		tipo: "hum",
		raca: "elfo",
		papel: "lackey",
		atr: { for: 1, des: 3, con: 2, int: 0, sab: 1, car: 0 },
		pv: 50,
		def: 26,
		walk: 12,
		sentidos: ["penumbra"],
		pericias: { inic: 10, perc: 8, fort: 12, refl: 17, vont: 7, luta: 24, pont: 24, acro: 8, atle: 6, furt: 10, ladi: 10, sobr: 6 },
		resTxt: "Evasão. Sem redução de deslocamento por terreno difícil natural.",
		equipTxt: "Cimitarra, couro batido ajustado, escudo leve ajustado, machadinha ×2.",
		ataquesTxt: "Cimitarra ×2 +24 (2d6+18, 18).",
		ataquesAdTxt: "Machadinha +24 (1d6+18, ×3).",
		tesouro: "Metade.",
		bio: p("Membros da <b>Tropa da Floresta e das Montanhas</b>, a irmandade a quem os anões devem. Só aparecem se, por milagre, os anões fugirem com o baú: são quatro, no esconderijo da Tropa."),
		items: [
			arma("Cimitarra (×2)", ICO.cimitarra, { dano: "2d6+18", tipo: "corte", critM: 18, effects: [furtivo("3d6")], desc: p("Dois ataques por ação padrão.") }),
			distancia("Machadinha", ICO.machadinha, { dano: "1d6+18", tipo: "corte", critX: 3, alcance: "curto", effects: [furtivo("3d6")] }),
			poder("Ataque Furtivo", "icons/magic/perception/silhouette-stealth-shadow.webp", p("+3d6 contra alvos desprevenidos ou flanqueados."), { exec: "passive" }),
			poder("Bloqueio com Escudo", `${T20I}/itens/equipamentos/escudo-leve.webp`, p("<b>Reação.</b> Quando sofre dano pela primeira vez na rodada, recebe RD 5 contra esse dano (só empunhando o escudo)."), { exec: "reaction" }),
			poder("Saque Rápido", "icons/svg/upgrade.svg", p("Saca e guarda itens como ação livre."), { exec: "passive" }),
			EVASAO()
		]
	});

	atores.andrus = await criarNPC({
		name: "Andrus, o Aranha",
		role: "andrus",
		link: true,
		disposition: 0,
		img: `${T20I}/classes/ladino.webp`,
		nd: 15,
		cd: 30,
		tipo: "hum",
		raca: "desconhecida",
		papel: "special",
		atr: { for: 1, des: 6, con: 2, int: 4, sab: 3, car: 4 },
		pv: 200,
		def: 40,
		walk: 12,
		pericias: { inic: 20, perc: 25, refl: 25, vont: 20, ladi: 35, furt: 30, enga: 25, acro: 25 },
		resTxt: "Não se combate Andrus nesta aventura.",
		bio: p("O maior ladrão de Arton, com uma carreira de décadas e nunca capturado. Não é especialmente maligno nem ligado à Tormenta. <b>O livro não traz ficha:</b> só <b>Ladinagem +35</b>. Os outros números aqui são só para a macro funcionar; não é para lutar com ele.",
			"Cartão de visitas: uma teia de aranha onde estava o objeto roubado. Aparece três vezes (macro <i>Andrus Ataca</i>): na perseguição dos elfos (1d4 = 4), no Campo de Keenn (rouba o medalhão de Janara) e em queda livre na fase 5 (o baú, o simbionte ou um item).",
			"Na fase 6 deixa um bilhete e encontra o grupo atrás da Guarita da Praia para devolver tudo. Ver o diário.")
	});

	atores.grifo = await clonarAmeaca("PHQxelq8EGMXXlR8", "Grifo dos Cavaleiros", {
		role: "grifo",
		bio: p("Montaria dos cavaleiros corrompidos na fase 5 (um para cada). Contratar um grifo para perseguir custa T$ 5.000 e funciona como parceiro montaria veterano (tabela de Transportes).")
	});

	/* ------------------------------------------------------------------ */
	/* 3. Itens                                                             */
	/* ------------------------------------------------------------------ */
	const itemDoc = (d) => ({ ...d, folder: pasta.Item, flags: FLAGS() });
	const tesouro = (name, img, html, preco = 0, qtd = 1) => itemDoc({ name, type: "tesouro", img, system: { description: { value: html }, qtd, preco, peso: 0, espacos: 0 } });
	const itensCriados = await Item.createDocuments([
		tesouro("Baú com o Simbionte", "icons/svg/chest.svg",
			p("Grande baú que os elfos protegem com todo cuidado. São precisos <b>dois</b> para carregá-lo. Dentro, uma forma larval que lembra uma grande concha com olhos telescópicos e centenas de patas: um par de <b>Asas do Devorador</b>.",
				"<b>Prova</b> (com ou sem o simbionte)."), 0),
		itemDoc({
			name: "Asas do Devorador (pterodraco)",
			type: "poder",
			img: `${T20I}/itens/gerais/materia-vermelha.webp`,
			effects: [chave("Asas do Devorador (voo sustentado)", `${T20I}/magias/voo.webp`, [["system.attributes.movement.fly.base", "9", "upgrade"]], false,
				"Ligue ao ativar (2 PM, sustentado). Ajuste o valor para o deslocamento em terra do hospedeiro.")],
			system: {
				description: { value: p("Simbionte da Tormenta que se instala nas costas do hospedeiro: as patas se cravam até a coluna e se prendem para sempre. Quando a simbiose dá certo, cresce um par de grandes asas membranosas.",
					"<b>Ativar:</b> gaste <b>2 PM</b> para ganhar deslocamento de voo igual ao seu deslocamento em terra, com duração sustentada. Ligue o efeito e ajuste o valor (está em 9m).",
					"Regras de simbiose (aquisição, perda de Carisma, impossibilidade de remover) em <i>Ameaças de Arton</i>, pp. 60–61. Preço: T$ 27.000.",
					"<b>Nesta aventura:</b> só se obtém \"legalmente\" impedindo que sir Androwe se ligue a ele depois de o baú estar aberto. Andrus pode entregá-lo ao grupo na fase 6. Ficar com ele corta o pagamento da SPIMA pela metade.") },
				tipo: "geral",
				subtipo: "tormenta",
				ativacao: { execucao: "free", custo: 2, qtd: "", condicao: "", special: "" },
				alcance: "self",
				duracao: { value: 0, units: "sust", special: "" },
				resistencia: { pericia: "", atributo: "", bonus: 0, txt: "" },
				rolls: []
			}
		}),
		tesouro("Medalhão do Reinado (de Janara)", `${T20I}/itens/gerais/medalhao-de-prata.webp`,
			p("Prova de que Janara serve à Coroa do Reinado. Andrus o rouba no Campo de Keenn e, na fase 6, entrega ao grupo: \"Decidam se querem devolvê-lo a ela.\"", "<b>Prova.</b>")),
		tesouro("Baú do Pagamento", "icons/svg/coins.svg",
			p("Baú menor carregado pelos comandados de Janara, com o valor combinado com os elfos (o livro não diz quanto).",
				"Os anões pedem ajuda para roubá-lo e saldar a dívida com a Tropa. Entregue à Guarda, conta como <b>prova</b> (e não pode ser gasto).")),
		tesouro("Anel do Sacrifício", `${T20I}/itens/gerais/anel-sinete.webp`,
			p("Anel de um dos elfos: leva um objeto até um local designado, ao custo da vida de quem o usa. Usado, se desfaz junto com o elfo (truque <i>Sumiço do Baú</i>).")),
		tesouro("Pedaço de Armadura Corrompida", `${T20I}/itens/gerais/materia-vermelha.webp`,
			p("Placa de armadura de cavaleiro da Luz, amassada, com veios de carapaça rubra crescendo por baixo do metal.", "<b>Prova.</b>")),
		tesouro("Bilhete de Andrus", `${T20I}/itens/gerais/pergaminho.webp`,
			p("<i>\"Encontrem-me atrás da Guarita da Praia. Venham sozinhos, não há perigo. É de seu interesse. –A\"</i>",
				"Fica no lugar do objeto que Andrus roubou na fase 5."))
	]);
	const itemPorNome = (inicio) => itensCriados.find((i) => i.name.startsWith(inicio));

	/* ------------------------------------------------------------------ */
	/* 4. Tabelas (fonte única para as macros e o diário)                   */
	/* ------------------------------------------------------------------ */
	// [de, até, tipo, testes [[chave, CD]], descrição, extra]
	const EV_AEREA = [
		[1, 4, "Nenhum", [], "—", {}],
		[5, 6, "Obstáculo", [["int", 15]], "Ventos fazem pedregulhos flutuantes se moverem em padrões erráticos.", {}],
		[7, 8, "Obstáculo", [["acro", 25]], "Um apressadinho alado corta a frente dos perseguidores.", {}],
		[9, 10, "Obstáculo", [["mist", 25], ["sobr", 25]], "Um vórtice antigravitacional se forma no caminho. Quem falha também perde 1d4 PM.", { pm: "1d4" }],
		[11, 12, "Obstáculo", [["acro", 25], ["perc", 25]], "Um grande navio voador surge no caminho. Quem falha também sofre 4d6 de impacto; em veículo ou montaria, Reflexos CD 20 ou cai.", { dano: "4d6[impacto]", queda: 20 }],
		[13, 14, "Atalho", [["sobr", 25]], "Fortes lufadas de vento dão um impulso adicional.", {}],
		[15, 16, "Atalho", [["acro", 25]], "Um pedregulho flutuante em que dá para subir corta o céu.", {}],
		[17, 18, "Atalho", [["dipl", 25]], "Viajantes alados indicam as melhores correntes de vento.", {}],
		[19, 20, "Atalho", [["car", 15]], "Uma figura poderosa intervém a favor. Quem passa também recebe +2 nos testes de perícia da perseguição até o fim da cena.", { bonusCena: 2 }]
	];
	const EV_PE = [
		[1, 4, "Nenhum", [], "—", {}],
		[5, 6, "Obstáculo", [["con", 15]], "Carroça de esterco de otyugh empesteia o ambiente.", {}],
		[7, 8, "Obstáculo", [["acro", 25], ["mist", 25]], "Um portal se abre na rua e despeja viajantes recém-chegados.", {}],
		[9, 10, "Obstáculo", [["perc", 25]], "Os elfos se misturam à multidão de uma rua movimentada.", {}],
		[11, 12, "Obstáculo", [["refl", 25]], "Discussão entre dois alquimistas vira duelo de poções. Quem falha também sofre 6d4 de ácido.", { dano: "6d4[acido]" }],
		[13, 14, "Atalho", [["int", 15]], "A perseguição passa por uma rua famosa; reconhecer o lugar lembra um atalho.", {}],
		[15, 16, "Atalho", [["acro", 25]], "Saltar um muro alto corta caminho.", {}],
		[17, 18, "Atalho", [["ades", 25], ["sobr", 25]], "Baleotes voam baixo o bastante para uma carona rápida.", {}],
		[19, 20, "Atalho", [["dipl", 25]], "Transeuntes prestativos tentam bloquear os elfos. Se ao menos um passar, todos os perseguidores recebem +2 no Atletismo desta rodada.", { todos: 2 }]
	];
	// [nome, preço, regra]. O livro manda rolar 1d10 três vezes, mas lista oito transportes:
	// 9 e 10 repetem a rolagem (inferido).
	const TRANSPORTES = [
		["Balão Goblin", "T$ 20 por pessoa", "Até 8 criaturas Médias (com o goblin baloeiro), voo 12m. O baloeiro faz os testes de perseguição por todos com Pilotagem +10."],
		["Grifo", "T$ 5.000", "Funciona como parceiro montaria veterano (Tormenta20, p. 262)."],
		["Catapulta", "T$ 15 por disparo", "Arremessa uma criatura Grande ou menor. Pontaria do goblin (+5) ou do personagem contra a Defesa do cavaleiro-alvo. Acertando, Atletismo ou Cavalgar CD 20 para montar no grifo junto dele. Errando ou falhando, cai e sofre 8d6 de impacto. Depois de 3 rodadas, os cavaleiros saem do alcance."],
		["Foguete Goblin", "T$ 250", "Uma criatura Média ou menor, voo 24m. Pilotagem com –5; d20 de 1 a 3 manda o foguete numa direção aleatória. Três desses seguidos: para e cai (10d6 de impacto); se o terceiro for 1 natural, explode (+6d6 de fogo). Para de funcionar depois da perseguição."],
		["Teletransporte", "T$ 360 por pessoa", "Círculo operado por um mago, uma criatura por vez. Misticismo ou Vontade CD 20: surge montado no grifo de um cavaleiro à escolha. Falhando, perde a rodada."],
		["Ornitóptero Goblin", "T$ 20 por pessoa", "Até 2 criaturas Médias (com o goblin piloto), voo 15m. Só um goblin pilota."],
		["Serpe", "T$ 2.500", "Parceiro montaria veterano com voo 18m que leva mais uma criatura Média ou menor. Mal domada: Adestramento CD 20 ao montar, ou perde 1 rodada."],
		["Magia de Voo", "T$ 360", "Um conjurador lança Voo: deslocamento de voo 12m até o fim da cena."]
	];

	const tabela = (name, img, formula, description, linhas) => RollTable.create({
		name, img, folder: pasta.RollTable, flags: FLAGS(), formula, replacement: true, displayRoll: true, description,
		results: linhas.map(([de, ate, nome, desc]) => ({ type: "text", range: [de, ate], weight: ate - de + 1, name: nome, description: desc }))
	});
	const NOMES = { int: "Inteligência", con: "Constituição", car: "Carisma", acro: "Acrobacia", mist: "Misticismo", sobr: "Sobrevivência", perc: "Percepção", dipl: "Diplomacia", refl: "Reflexos", ades: "Adestramento", atle: "Atletismo", pilo: "Pilotagem", inve: "Investigação", ladi: "Ladinagem", fort: "Fortitude", vont: "Vontade" };
	const testeTxt = (t) => t.map(([k, cd]) => `${NOMES[k]} CD ${cd}`).join(" ou ");
	const tabAerea = await tabela("Eventos da Perseguição Aérea (Vectora)", `${T20I}/itens/gerais/balao-goblin.webp`, "1d20",
		"Uma vez por rodada. Obstáculo: quem falha avança metade. Atalho: quem tenta e passa avança o dobro. A macro Perseguição em Vectora já rola isto.",
		EV_AEREA.map(([de, ate, tipo, t, d]) => [de, ate, tipo === "Nenhum" ? "Nenhum" : `${tipo}: ${testeTxt(t)}`, d]));
	const tabPe = await tabela("Eventos da Perseguição a Pé (Vectora)", "icons/svg/target.svg", "1d20",
		"Uma vez por rodada. Obstáculo: quem falha avança metade. Atalho: quem tenta e passa avança o dobro. A macro Perseguição em Vectora já rola isto.",
		EV_PE.map(([de, ate, tipo, t, d]) => [de, ate, tipo === "Nenhum" ? "Nenhum" : `${tipo}: ${testeTxt(t)}`, d]));
	const tabTransportes = await tabela("Transportes Disponíveis (Vectora)", `${T20I}/itens/gerais/grifo.webp`, "1d10",
		"Role três vezes; cada resultado é um meio de chegar aos cavaleiros. Pegar qualquer um leva 1d3 rodadas (boas ideias, como roubar um veículo, encurtam). O livro lista oito transportes para 1d10: 9 e 10 rolam de novo (inferido).",
		[...TRANSPORTES.map(([n, preco, regra], i) => [i + 1, i + 1, `${n} (${preco})`, regra]), [9, 10, "Role de novo", "O livro lista só oito transportes."]]);

	/* ------------------------------------------------------------------ */
	/* 5. Macros                                                            */
	/* ------------------------------------------------------------------ */

	async function macroVectora() {
		const CHAVE = "fdtVectora";
		const e = game.user.getFlag("world", CHAVE) ?? { aventuras: 0, chegou: false };
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Vectora atracou?" },
			content: `<p>Aventuras concluídas desde a Av0: <b>${e.aventuras}</b>. ${e.chegou ? "<b>Vectora já está atracada.</b>" : ""}</p>
				<div class="form-group"><label>Ação</label><select name="acao">
					<option value="rolar">Fim de uma aventura: rolar 1d6</option>
					<option value="chegou">Vectora chega agora (escolha do Mestre)</option>
					<option value="partiu">Vectora partiu / caso encerrado</option>
					<option value="zerar">Zerar a contagem</option></select></div>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "zerar") {
			await game.user.unsetFlag("world", CHAVE);
			return ui.notifications.info("Contagem de Vectora zerada.");
		}
		if (res.acao === "partiu") {
			await game.user.setFlag("world", CHAVE, { ...e, chegou: false });
			return ChatMessage.create({ content: "<h3>Vectora partiu</h3><p>O Mercado nas Nuvens deixou Valkaria.</p>", whisper: ChatMessage.getWhisperRecipients("GM") });
		}
		if (res.acao === "chegou") {
			await game.user.setFlag("world", CHAVE, { ...e, chegou: true });
			return ChatMessage.create({ content: "<h3>Vectora está chegando!</h3><p>O caso <b>Conexão Vectora</b> fica disponível no Quadro de Casos.</p>" });
		}
		const n = e.aventuras + 1;
		const minimo = Math.max(1, 7 - n);
		const r = await new Roll("1d6").evaluate();
		const chegou = r.total >= minimo;
		await game.user.setFlag("world", CHAVE, { aventuras: n, chegou: chegou || e.chegou });
		const lo = game.actors.find((a) => a.getFlag("world", "fdtRole") === "leiordem");
		const aviso = lo && Number(lo.system.resources?.primary?.value) <= 0 ? "<p><b>Lei &amp; Ordem já chegou a zero:</b> o arco acaba sem Vectora, a menos que você queira mestrar o caso mesmo assim.</p>" : "";
		ChatMessage.create({
			content: `<h3>Vectora atracou?</h3><p>Depois da aventura ${n}: precisa de ${minimo}+ no d6. Resultado <b>${r.total}</b>: ${chegou ? "<b>Vectora está chegando!</b> O caso Conexão Vectora fica disponível." : "ainda não."}</p>${aviso}`,
			rolls: [r],
			whisper: ChatMessage.getWhisperRecipients("GM")
		});
	}

	async function macroAcharElfos() {
		const CHAVE = "fdtVectoraBusca";
		const e = game.user.getFlag("world", CHAVE) ?? { sucessos: 0, rolagens: 0, creditos: 0, achou: false };
		const DADOS = ["", "1d20", "1d12", "1d10", "1d8", "1d6", "1d4", "1d3"];
		const atores = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Achar os elfos no céu de Vectora" },
			content: `<p>${e.achou ? "<b>Os elfos já foram achados.</b> " : ""}Rolagens: <b>${e.rolagens}</b> · sucessos: <b>${e.sucessos}</b> · créditos do Mestre: <b>${e.creditos}</b>.</p>
				<div class="form-group"><label>Ação</label><select name="acao">
					<option value="testar">Teste do representante (CD 25)</option>
					<option value="zerar">Começar de novo (zera rolagens, sucessos e créditos)</option></select></div>
				<div class="form-group"><label>Perícia</label><select name="per"><option value="inve">Investigação</option><option value="perc">Percepção</option>
					<option value="guer">Guerra</option><option value="mist">Misticismo</option><option value="sobr">Sobrevivência</option></select></div>
				<div class="form-group"><label>Resultado já rolado (opcional)</label><input type="number" name="manual" placeholder="rola para o token selecionado"></div>
				<p style="font-size:0.85em">Voar entre a multidão, luneta ou magia não dão bônus: são o que permite fazer o teste. Aceite outras perícias com boa justificativa.</p>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "zerar") {
			await game.user.unsetFlag("world", CHAVE);
			return ui.notifications.info("Busca pelos elfos reiniciada.");
		}
		const rolls = [];
		let total = Number(res.manual);
		let quem = "Resultado informado";
		if (res.manual === "" || res.manual === undefined) {
			const a = atores[0];
			if (!a) return ui.notifications.warn("Selecione o token do representante do grupo, ou informe o resultado.");
			const r = await new Roll(`1d20 + ${Number(a.system.pericias?.[res.per]?.value) || 0}`).evaluate();
			rolls.push(r);
			total = r.total;
			quem = a.name;
		}
		e.rolagens += 1;
		let html = `<h3>Achar os elfos · rolagem ${e.rolagens}</h3><p>${quem}: <b>${total}</b> contra CD 25.</p>`;
		if (total >= 25) {
			e.sucessos += 1;
			const dado = DADOS[Math.min(e.sucessos, 7)];
			const d = await new Roll(dado).evaluate();
			rolls.push(d);
			if (d.total === 1) {
				e.achou = true;
				html += `<p>Sucesso ${e.sucessos}: ${dado} = <b>1</b>. <b>É o grupo certo!</b></p>`;
			} else {
				e.creditos += 1;
				html += `<p>Sucesso ${e.sucessos}: ${dado} = ${d.total}. Outro grupo de elfos. <b>+1 crédito</b> para o Mestre.</p>`;
			}
		} else {
			e.creditos += 1;
			html += "<p>Falha. <b>+1 crédito</b> para o Mestre.</p>";
		}
		if (e.achou) {
			html += e.rolagens <= 5 ? "<p>Os elfos <b>ainda estão descendo</b> de Vectora: perseguição <b>aérea</b>.</p>"
				: e.rolagens <= 8 ? "<p>Os elfos já estão <b>a caminho do Campo de Keenn</b>, mas ainda dá para interceptá-los: perseguição <b>a pé</b>.</p>"
					: "<p>Achados tarde demais: siga para a fase 3 e o Campo de Keenn.</p>";
		} else if (e.rolagens >= 9) {
			html += "<p><b>Mais de 8 rolagens: os elfos sumiram.</b> Siga para a fase 3 (achar o ponto de encontro: Investigação CD 25).</p>";
		}
		html += `<p style="font-size:0.85em">Créditos do Mestre: ${e.creditos}. Use a macro <i>Créditos do Mestre</i> para gastá-los nos truques.</p>`;
		await game.user.setFlag("world", CHAVE, e);
		ChatMessage.create({ content: html, rolls });
	}

	async function macroCreditos() {
		const CHAVE = "fdtVectoraBusca";
		const e = game.user.getFlag("world", CHAVE) ?? { sucessos: 0, rolagens: 0, creditos: 0, achou: false };
		const TRUQUES = {
			sumico: ["Sumiço do Baú (fase 2)", "Um elfo se joga sobre o baú; um brilho verde cega todos e ele explode num clarão de magia. O baú foi teleportado. Todos ficam cobertos de sangue, fuligem e pedaços de elfo.", "Sem crédito: a explosão tem um efeito inesperado e <b>todos os personagens recuperam todos os PM</b>."],
			monstro: ["Monstro de Carne (fase 3)", "Com uma palavra profana, sir Androwe funde dois cavaleiros e seus cavalos numa criatura grotesca de carne, sangue e carapaça vermelha. Asas horrendas brotam, tentáculos agarram o baú e a coisa foge voando. <b>Quem testemunhar ganha a aliança imediata de todas as outras facções.</b>", "Sem crédito: além da aliança, o grupo ganha <b>+1 de Lei &amp; Ordem</b> (a história assusta o submundo)."],
			ultimo: ["Último instante (fase 5)", "Não importa quanto demorem: o grupo chega aos cavaleiros no instante em que os grifos alçam voo. É a última trapaça; não gasta crédito.", ""]
		};
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Créditos do Mestre (Conexão Vectora)" },
			content: `<p>Créditos disponíveis: <b>${e.creditos}</b>.</p>
				<div class="form-group"><label>Truque</label><select name="truque">${Object.entries(TRUQUES).map(([k, t]) => `<option value="${k}">${t[0]}</option>`).join("")}</select></div>
				<div class="form-group"><label>Aplicar o bônus sem crédito automaticamente</label><input type="checkbox" name="aplicar" checked></div>
				<p style="font-size:0.85em">Para o Sumiço do Baú sem crédito, selecione os personagens que recuperam PM.</p>`,
			ok: { label: "Usar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const [nome, texto, semCredito] = TRUQUES[res.truque];
		let html = `<h3>${nome}</h3><p>${texto}</p>`;
		if (res.truque !== "ultimo") {
			if (e.creditos > 0) {
				e.creditos -= 1;
				html += `<p>Gasta 1 crédito (restam ${e.creditos}).</p>`;
			} else {
				html += `<p>${semCredito}</p>`;
				if (res.aplicar && res.truque === "sumico") {
					for (const t of tokens) {
						const pm = t.actor.system.attributes?.pm;
						if (pm) await t.actor.update({ "system.attributes.pm.value": pm.max });
					}
					if (tokens.length) html += `<p>PM recuperados: ${tokens.map((t) => t.name).join(", ")}.</p>`;
				}
				if (res.aplicar && res.truque === "monstro") {
					const lo = game.actors.find((a) => a.getFlag("world", "fdtRole") === "leiordem");
					if (lo) {
						const v = Number(lo.system.resources?.primary?.value) || 0;
						await lo.update({ "system.resources.primary.value": v + 1 });
						html += `<p>Lei &amp; Ordem: ${v} → <b>${v + 1}</b>.</p>`;
					} else html += "<p>Ator de Lei &amp; Ordem não encontrado (importe o Ato 2 do módulo Fim dos Tempos): ajuste à mão.</p>";
				}
			}
			await game.user.setFlag("world", CHAVE, e);
		}
		ChatMessage.create({ content: html });
	}

	async function macroPerseguicao() {
		const CHAVE = "fdtPerseguicaoVectora";
		const estado = game.user.getFlag("world", CHAVE);
		const atorDe = (part) => canvas.tokens.get(part.token)?.actor ?? game.actors.get(part.actor);
		const bonus = (a, k) => (["for", "des", "con", "int", "sab", "car"].includes(k) ? Number(a.system.atributos?.[k]?.value) || 0 : Number(a.system.pericias?.[k]?.value) || 0);
		const opcoes = estado
			? `<option value="rodada">Próxima rodada (${estado.rodada + 1})</option><option value="encerrar">Encerrar a perseguição</option>`
			: "<option value=\"iniciar\">Iniciar: selecionados perseguem, alvos (T) fogem</option>";
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Perseguição em Vectora" },
			content: `
				<div class="form-group"><label>Ação</label><select name="acao">${opcoes}</select></div>
				${estado ? `<p>${estado.tipo === "aerea" ? "Perseguição aérea" : "Perseguição a pé"}, rodada ${estado.rodada}.</p>` : `
				<div class="form-group"><label>Tipo</label><select name="tipo"><option value="aerea">Aérea (descendo de Vectora / grifos)</option><option value="pe">A pé (ruas de Valkaria)</option></select></div>
				<div class="form-group"><label>Teste dos perseguidores</label><select name="base"><option value="atle">Atletismo</option><option value="acro">Acrobacia</option><option value="pilo">Pilotagem</option></select></div>
				<div class="form-group"><label>Piloto do veículo (bônus; 0 = cada um rola)</label><input type="number" name="piloto" value="0"></div>
				<div class="form-group"><label>Rodadas de atraso (contratar baloeiro: 1d3)</label><input type="number" name="atraso" value="0"></div>
				<div class="form-group"><label>Vantagem dos fugitivos (quadrados)</label><input type="number" name="vantagem" value="6"></div>
				<div class="form-group"><label>Fugitivos escapam com (quadrados)</label><input type="number" name="meta" value="80"></div>
				<p style="font-size:0.85em">Em veículo, o piloto faz os testes pelo grupo (baloeiro goblin: Pilotagem +10).</p>`}`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "encerrar") {
			await game.user.unsetFlag("world", CHAVE);
			return ChatMessage.create({ content: "<h3>Perseguição encerrada</h3>" });
		}
		if (res.acao === "iniciar") {
			const ps = canvas.tokens.controlled;
			const fs = [...game.user.targets];
			if (!ps.length || !fs.length) return ui.notifications.warn("Selecione os perseguidores e marque como alvo (T) os fugitivos.");
			const vantagem = Number(res.vantagem) || 0;
			const atraso = Math.max(0, Number(res.atraso) || 0);
			const parts = [
				...ps.map((t) => ({ token: t.id, actor: t.actor?.id, nome: t.name, lado: "p", dist: 0, espera: atraso })),
				...fs.map((t) => ({ token: t.id, actor: t.actor?.id, nome: t.name, lado: "f", dist: vantagem, espera: 0 }))
			].map((x) => ({ ...x, correu: 0, testesFort: 0, bonusCena: 0, fora: false, status: "" }));
			await game.user.setFlag("world", CHAVE, { tipo: res.tipo, base: res.base, piloto: Number(res.piloto) || 0, rodada: 0, meta: Number(res.meta) || 80, parts });
			return ChatMessage.create({
				content: `<h3>Perseguição ${res.tipo === "aerea" ? "aérea" : "a pé"}!</h3><p>Perseguidores: ${ps.map((t) => t.name).join(", ")}${atraso ? ` (entram ${atraso} rodada(s) atrasados)` : ""}.</p>
					<p>Fugitivos: ${fs.map((t) => t.name).join(", ")} (${vantagem} quadrados de vantagem; escapam aos ${Number(res.meta) || 80}).</p>`
			});
		}

		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r; };
		const NOMES = { int: "Inteligência", con: "Constituição", car: "Carisma", acro: "Acrobacia", mist: "Misticismo", sobr: "Sobrevivência", perc: "Percepção", dipl: "Diplomacia", refl: "Reflexos", ades: "Adestramento", atle: "Atletismo", pilo: "Pilotagem" };
		const TABELA = estado.tipo === "aerea" ? EV_AEREA : EV_PE;
		estado.rodada += 1;
		const d = await rolar("1d20");
		const [, , tipoEv, testes, descEv, extra] = TABELA.find((l) => d.total >= l[0] && d.total <= l[1]);
		const atalho = tipoEv === "Atalho";
		let html = `<h3>Perseguição · rodada ${estado.rodada}</h3><p>Evento (${d.total}): <b>${tipoEv}</b>${testes.length ? ` · ${testes.map(([k, cd]) => `${NOMES[k]} CD ${cd}`).join(" ou ")}` : ""}. ${descEv}</p>`;
		// Transeuntes prestativos: se um perseguidor passar, todos ganham +2.
		const resultados = new Map();
		for (const x of estado.parts) {
			if (x.fora || x.espera > 0) continue;
			const a = atorDe(x);
			if (!a || !testes.length) continue;
			const [k, cd] = testes.reduce((m, t) => (bonus(a, t[0]) - t[1] > bonus(a, m[0]) - m[1] ? t : m));
			const r = await rolar(`1d20 + ${bonus(a, k)} + ${x.bonusCena}`);
			resultados.set(x, { ok: r.total >= cd, txt: `${NOMES[k]} ${r.total} ${r.total >= cd ? "✔️" : "❌"}` });
		}
		const todos = extra.todos && [...resultados].some(([x, r]) => x.lado === "p" && r.ok) ? extra.todos : 0;
		const piloto = estado.piloto ? await rolar(`1d20 + ${estado.piloto}`) : null;
		if (piloto) html += `<p>Piloto do veículo: <b>${piloto.total}</b> para todos os perseguidores.</p>`;

		html += `<table><tr><th>Quem</th><th>Evento</th><th>${NOMES[estado.base] ?? "Teste"}</th><th>Avança</th><th>Total</th></tr>`;
		for (const x of estado.parts) {
			if (x.fora) continue;
			const a = atorDe(x);
			if (!a) { x.fora = true; continue; }
			if (x.espera > 0) {
				x.espera -= 1;
				html += `<tr><td>${x.nome}</td><td colspan="3">Arrumando transporte</td><td>${x.dist}</td></tr>`;
				continue;
			}
			let mult = 1;
			let mod = x.bonusCena;
			let evTxt = "—";
			const r0 = resultados.get(x);
			if (r0) {
				evTxt = r0.txt;
				if (atalho) {
					mult = r0.ok ? 2 : 0.5;
					if (r0.ok && extra.bonusCena) { x.bonusCena = extra.bonusCena; mod = x.bonusCena; }
				} else if (!r0.ok) {
					mult = 0.5;
					if (extra.dano) {
						const dano = await rolar(extra.dano);
						try { await a.applyDamageV2(dano, 1); } catch (err) { console.warn(err); }
						evTxt += ` (${dano.total} de dano)`;
					}
					if (extra.pm) {
						const perda = await rolar(extra.pm);
						const pm = a.system.attributes?.pm;
						if (pm) await a.update({ "system.attributes.pm.value": Math.max(0, (Number(pm.value) || 0) - perda.total) });
						evTxt += ` (–${perda.total} PM)`;
					}
					if (extra.queda) {
						const f = await rolar(`1d20 + ${bonus(a, "refl")}`);
						if (f.total < extra.queda) evTxt += ` · Reflexos ${f.total}: <b>cai se estiver em veículo ou montaria</b>`;
					}
				}
			}
			if (x.lado === "p" && todos) mod += todos;
			const veiculo = x.lado === "p" && piloto;
			const r = veiculo ? piloto : await rolar(`1d20 + ${bonus(a, x.lado === "p" ? estado.base : "atle")} + ${mod}`);
			const avanca = Math.max(0, Math.floor((veiculo ? r.total + mod : r.total) * mult));
			x.dist += avanca;
			x.correu += 1;
			html += `<tr><td>${x.nome}</td><td>${evTxt}</td><td>${veiculo ? r.total + mod : r.total}</td><td>${avanca}</td><td><b>${x.dist}</b></td></tr>`;
			// Cansaço (perseguições do Tormenta20): 1 + Constituição rodadas, depois Fortitude CD 15 +1 por teste.
			const con = Number(a.system.atributos?.con?.value) || 0;
			if (!veiculo && estado.tipo === "pe" && x.correu > 1 + con) {
				const cd = 15 + x.testesFort;
				x.testesFort += 1;
				const f = await rolar(`1d20 + ${bonus(a, "fort")}`);
				if (f.total < cd) {
					x.fora = true;
					x.status = "fatigado";
					html += `<tr><td colspan="5">${x.nome} falha em Fortitude (${f.total} contra CD ${cd}): fica <b>fatigado</b> e sai da perseguição.</td></tr>`;
				}
			}
		}
		html += "</table>";
		if (todos) html += "<p>Os transeuntes bloqueiam os elfos: <b>+2</b> para todos os perseguidores nesta rodada.</p>";
		const ativosP = estado.parts.filter((x) => x.lado === "p" && x.status !== "fatigado");
		for (const f of estado.parts.filter((x) => x.lado === "f" && !x.fora)) {
			const pegou = ativosP.find((pp) => pp.dist > f.dist);
			if (pegou) {
				f.fora = true;
				f.status = "alcançado";
				html += `<p><b>${pegou.nome} alcança ${f.nome}!</b> Começa o combate (Primeiro Confronto).</p>`;
			} else if (f.dist >= estado.meta) {
				f.fora = true;
				f.status = "escapou";
				html += `<p><b>${f.nome} escapa.</b> Siga para a fase 3.</p>`;
			}
		}
		const restam = estado.parts.filter((x) => x.lado === "f" && !x.fora);
		const perseguindo = estado.parts.filter((x) => x.lado === "p" && !x.fora);
		if (!restam.length || !perseguindo.length) {
			html += "<p><i>Fim da perseguição.</i></p>";
			await game.user.unsetFlag("world", CHAVE);
		} else await game.user.setFlag("world", CHAVE, estado);
		ChatMessage.create({ content: html, rolls });
	}

	async function macroKeenn() {
		const CHAVE = "fdtKeenn";
		const e = game.user.getFlag("world", CHAVE) ?? { rodada: 0 };
		const ROTEIRO = [
			"",
			"<b>Rodada 1:</b> Mazynne gasta uma ação completa para preparar e arremessar mais uma bomba de fumaça. Rolthurr corre (ação completa) e chega ao baú. Elfos e humanos se atacam.",
			"<b>Rodada 2:</b> Rolthurr pega o baú (padrão) e se afasta (movimento). Mazynne se aproxima e segura um lado. Elyrionn e Janara percebem os anões; os comandados continuam lutando.",
			"<b>Rodada 3:</b> Elyrionn e Janara se aproximam (movimento) e seguram o baú (padrão). Os cavaleiros saem da invisibilidade e fazem uma <b>investida</b> que atinge elfos e humanos.",
			"<b>Rodada 4:</b> Elyrionn, Janara, sir Androwe, Rolthurr e Mazynne disputam o baú sem vencedor. Cavaleiros, elfos e humanos lutam sem ordem.",
			"<b>Rodada 5:</b> sir Androwe vence a disputa, toma o baú e parte a galope (corrida montada); os cavaleiros o seguem. Janara se revela e ordena que anões e elfos se rendam à autoridade do Reinado (e descobre que o medalhão sumiu)."
		];
		const LACAIOS = ["elfo", "agente", "cavaleiro", "bandido"];
		const npcs = canvas.tokens.placeables.filter((t) => t.actor && t.actor.type === "npc" && t.actor.getFlag("world", "fdt") === "a2av2" && (Number(t.actor.system.attributes?.pv?.value) || 0) > 0);
		const linhas = npcs.map((t) => `<tr><td>${t.name}</td><td>${t.actor.system.attributes.pv.value}/${t.actor.system.attributes.pv.max}</td>
			<td><input type="checkbox" name="atk_${t.id}"></td><td><input type="checkbox" name="muitos_${t.id}"></td>
			<td><input type="checkbox" name="lacaio_${t.id}"></td><td><input type="checkbox" name="inv_${t.id}"></td></tr>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Batalha no Campo de Keenn" },
			content: `
				<div class="form-group"><label>Ação</label><select name="acao">
					<option value="rodada">Fim da rodada ${e.rodada + 1}: roteiro e luta entre NPCs</option>
					<option value="zerar">Recomeçar a batalha</option></select></div>
				${npcs.length ? `<table><tr><th>NPC</th><th>PV</th><th>Foi atacado</th><th>Muitos ataques (+1)</th><th>Por um lacaio (+1)</th><th>Investida dos cavaleiros</th></tr>${linhas}</table>`
					: "<p><i>Nenhum NPC desta aventura na cena.</i></p>"}
				<p style="font-size:0.85em">Marque só os NPCs atacados por outros NPCs. 1d6: ferido (perde metade dos PV máximos) com 1; lacaios com 2. Investida: +1 e quem é ferido cai.</p>`,
			ok: { label: "Resolver", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "zerar") {
			await game.user.unsetFlag("world", CHAVE);
			return ui.notifications.info("Batalha no Campo de Keenn reiniciada.");
		}
		e.rodada += 1;
		const rolls = [];
		let html = `<h3>Campo de Keenn · rodada ${e.rodada}</h3><p>${ROTEIRO[e.rodada] ?? "Depois da rodada 5 a batalha segue normalmente; adapte o roteiro ao que o grupo fez."}</p>`;
		const feridos = [];
		for (const t of npcs) {
			if (!res[`atk_${t.id}`] && !res[`inv_${t.id}`]) continue;
			const a = t.actor;
			const lacaio = LACAIOS.includes(a.getFlag("world", "fdtRole"));
			let limite = lacaio ? 2 : 1;
			if (res[`muitos_${t.id}`]) limite += 1;
			if (res[`lacaio_${t.id}`]) limite += 1;
			const investida = !!res[`inv_${t.id}`];
			if (investida) limite += 1;
			const r = await new Roll("1d6").evaluate();
			rolls.push(r);
			if (r.total <= limite) {
				const pv = a.system.attributes.pv;
				const novo = investida ? 0 : Math.max(0, pv.value - Math.ceil(pv.max / 2));
				await a.update({ "system.attributes.pv.value": novo });
				feridos.push(`${t.name} (${r.total} ≤ ${limite}): ${novo <= 0 ? "<b>derrotado</b>" : `ferido, ${novo} PV`}`);
			} else feridos.push(`${t.name} (${r.total} > ${limite}): ileso`);
		}
		if (feridos.length) html += `<p><b>Luta entre NPCs:</b></p><ul>${feridos.map((f) => `<li>${f}</li>`).join("")}</ul>`;
		if (e.rodada === 3) html += "<p>Ainda nesta rodada: role a macro <i>Andrus Ataca</i> (Campo de Keenn). O grupo tem uma rodada para impedir o roubo do medalhão.</p>";
		await game.user.setFlag("world", CHAVE, e);
		ChatMessage.create({ content: html, rolls, whisper: ChatMessage.getWhisperRecipients("GM") });
	}

	async function macroAndrus() {
		const CHAVE = "fdtAndrus";
		const roubos = game.user.getFlag("world", CHAVE) ?? [];
		const andrus = game.actors.find((a) => a.getFlag("world", "fdtRole") === "andrus");
		const LADINAGEM = Number(andrus?.system.pericias?.ladi?.value) || 35;
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Andrus Ataca" },
			content: `
				<div class="form-group"><label>Momento</label><select name="momento">
					<option value="elfos">Fase 2 · perseguindo os elfos (1d4; com 4 ele aparece)</option>
					<option value="keenn">Fase 3 · Campo de Keenn (o medalhão de Janara)</option>
					<option value="queda">Fase 5 · em queda livre (o baú, o simbionte ou um item)</option>
					<option value="devolver">Fase 6 · atrás da Guarita da Praia (devolve tudo)</option></select></div>
				<div class="form-group"><label>Objeto roubado (para a lista da fase 6)</label><input type="text" name="objeto" placeholder="o item mais valioso que não esteja em uso"></div>
				<div class="form-group"><label>Forçar a aparição</label><input type="checkbox" name="forcar"></div>
				<p style="font-size:0.85em">Selecione os personagens presentes. Na fase 2 o alvo é sorteado entre eles; na fase 5 selecione quem está com o baú (ou ninguém).</p>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r; };
		const per = (a, k) => Number(a.system.pericias?.[k]?.value) || 0;
		const ainda = tokens.filter((t) => !roubos.some((r) => r.actor === t.actor.id));
		const sortear = (l) => l[Math.floor(Math.random() * l.length)];
		let html = "";
		const registrar = async (dono, objeto) => {
			roubos.push({ actor: dono?.actor?.id ?? null, nome: dono?.name ?? "Janara", objeto: objeto || "item mais valioso" });
			await game.user.setFlag("world", CHAVE, roubos);
		};
		if (res.momento === "elfos") {
			const d = await rolar("1d4");
			html = `<h3>Andrus · perseguição dos elfos</h3><p>1d4 = ${d.total}.</p>`;
			if (d.total === 4 || res.forcar) {
				const alvo = sortear(tokens);
				if (!alvo) return ui.notifications.warn("Selecione os personagens presentes.");
				const p = await rolar(`1d20 + ${per(alvo.actor, "perc")}`);
				const l = await rolar(`1d20 + ${LADINAGEM}`);
				if (p.total >= l.total) html += `<p>${alvo.name} sente a mão leve (Percepção ${p.total} contra Ladinagem ${l.total}) e <b>segura o que ia ser roubado</b>. Um vulto de manto escuro some na multidão.</p>`;
				else {
					await registrar(alvo, res.objeto);
					html += `<p>${alvo.name}: Percepção ${p.total} contra Ladinagem ${l.total}. <b>Roubado:</b> ${res.objeto || "o item mais valioso que não esteja em uso (peça a ficha)"}. No lugar, algo sedoso e grudento: teia de aranha.</p>`;
				}
			} else html += "<p>Nada desta vez.</p>";
		} else if (res.momento === "keenn") {
			html = "<h3>Andrus · Campo de Keenn</h3><p>Percepção CD 25 nota um vulto a mais entre os combatentes, de manto escuro. Ele vai roubar <b>o medalhão de Janara</b>; Janara sozinha não percebe.</p><ul>";
			for (const t of tokens) {
				const p = await rolar(`1d20 + ${per(t.actor, "perc")}`);
				html += `<li>${t.name}: Percepção ${p.total} ${p.total >= 25 ? "<b>nota o vulto</b> (uma rodada para agir; impedir: Ladinagem oposta, Andrus +" + LADINAGEM + ")" : "não nota"}</li>`;
			}
			html += "</ul>";
			await registrar(null, "Medalhão do Reinado (de Janara)");
		} else if (res.momento === "queda") {
			html = "<h3>Andrus · em queda livre</h3><p>Um vulto despenca como se tivesse se jogado de Vectora! Percepção CD 20 reconhece Andrus.</p>";
			const alvo = tokens[0] ?? sortear(ainda);
			if (alvo) {
				const l1 = await rolar(`1d20 + ${per(alvo.actor, "ladi")}`);
				const l2 = await rolar(`1d20 + ${LADINAGEM}`);
				const objeto = res.objeto || "o baú com o simbionte (ou um item à escolha do Mestre)";
				if (l1.total >= l2.total) html += `<p>${alvo.name} vence a Ladinagem oposta (${l1.total} contra ${l2.total}) e <b>não perde ${objeto}</b>. Andrus se balança num fio invisível e some.</p>`;
				else {
					await registrar(alvo, objeto);
					html += `<p>${alvo.name}: Ladinagem ${l1.total} contra ${l2.total}. Andrus agarra <b>${objeto}</b>, se balança num fio invisível e some nas sombras. Onde estava o objeto há um bilhete (item <i>Bilhete de Andrus</i>).</p>`;
				}
			} else html += "<p>Selecione quem está com o baú (ou o personagem que ele vai furtar).</p>";
		} else {
			html = `<h3>Andrus devolve tudo</h3><p>Num beco escuro atrás da Guarita da Praia, ele sai das sombras, sorri e abre o manto.</p>
				${roubos.length ? `<ul>${roubos.map((r) => `<li>${r.nome}: ${r.objeto}</li>`).join("")}</ul>` : "<p><i>Nada foi roubado nesta aventura.</i></p>"}
				<p><i>"Nunca fui seu inimigo. (...) Fiquem com o medalhão de Janara. É mais divertido assim. Decidam se querem devolvê-lo a ela. Ah, e podem também ficar com o simbionte. Apenas não o entreguem à Coroa."</i></p>`;
			await game.user.unsetFlag("world", CHAVE);
		}
		ChatMessage.create({ content: html, rolls, whisper: ChatMessage.getWhisperRecipients("GM") });
	}

	async function macroTransportes() {
		const tabela = game.tables.find((t) => t.getFlag("world", "fdt") === "a2av2" && t.name.startsWith("Transportes"));
		if (!tabela) return ui.notifications.error("Tabela de Transportes não encontrada (importe o Ato 2 do módulo Fim dos Tempos).");
		const rolls = [];
		const achados = [];
		let tentativas = 0;
		while (achados.length < 3 && tentativas < 20) {
			tentativas += 1;
			const r = await new Roll("1d10").evaluate();
			if (r.total > 8) continue;
			rolls.push(r);
			const res = tabela.results.find((x) => r.total >= x.range[0] && r.total <= x.range[1]);
			const t = await new Roll("1d3").evaluate();
			rolls.push(t);
			achados.push(`<li><b>${res?.name ?? r.total}</b> · leva ${t.total} rodada(s) para pegar. ${res?.description ?? ""}</li>`);
		}
		ChatMessage.create({ content: `<h3>Transportes para Vectora</h3><p>Os grifos alçam voo. Por perto há:</p><ul>${achados.join("")}</ul>`, rolls });
	}

	const macro = (name, img, fn, prefixo = "") => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Arco 2 · Aventura 2 · gerado por a2-av2-vectora.js\n${prefixo}(${fn.toString()})();`
	});
	const dadosEventos = `const EV_AEREA = ${JSON.stringify(EV_AEREA)};\nconst EV_PE = ${JSON.stringify(EV_PE)};\n`;
	const macros = await Macro.createDocuments([
		macro("Av2 · Vectora Atracou?", `${T20I}/itens/gerais/balao-goblin.webp`, macroVectora),
		macro("Av2 · Achar os Elfos", `${T20I}/itens/gerais/luneta.webp`, macroAcharElfos),
		macro("Av2 · Créditos do Mestre", "icons/svg/coins.svg", macroCreditos),
		macro("Av2 · Perseguição em Vectora", "icons/svg/wing.svg", macroPerseguicao, dadosEventos),
		macro("Av2 · Batalha no Campo de Keenn", "icons/svg/combat.svg", macroKeenn),
		macro("Av2 · Andrus Ataca", "icons/svg/net.svg", macroAndrus),
		macro("Av2 · Transportes para Vectora", `${T20I}/itens/gerais/grifo.webp`, macroTransportes)
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
	const lista = (itens) => `<ul>${itens.map((i) => `<li>${i}</li>`).join("")}</ul>`;
	const tabelaHtml = (cab, linhas) => `<table><tr>${cab.map((c) => `<th>${c}</th>`).join("")}</tr>${linhas.map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table>`;
	const leiOrdem = game.actors.find((a) => a.getFlag("world", "fdtRole") === "leiordem");
	const eventosHtml = (ev) => tabelaHtml(["d20", "Evento", "Teste", "Descrição"], ev.map(([de, ate, tipo, t, d]) => [de === ate ? de : `${de}–${ate}`, tipo, t.length ? testeTxt(t) : "—", d]));

	await JournalEntry.create({
		name: "Arco 2 · Aventura 2 · Conexão Vectora",
		folder: pasta.JournalEntry,
		flags: FLAGS(),
		pages: [
			pagina("Guia do Mestre", `
				<h2>Resumo</h2>
				<p>Nível 7. A <b>SPIMA</b> avisa a Guarda: uma quadrilha de elfos vai descer de Vectora com um artefato da Tormenta para vendê-lo em Valkaria. Quatro facções querem o baú (um simbionte <i>Asas do Devorador</i>) e Andrus, o Aranha, paira sobre tudo. Clima de filme de assalto dos anos 90 e de superladrão dos anos 70: tempo correndo, reviravoltas, todo mundo traindo todo mundo.</p>
				<p><b>Disponibilidade:</b> só acontece com Vectora atracada. Ao fim de cada aventura, ${linkMacro("Vectora Atracou")} rola 1d6 (6 na primeira, 5+ na segunda...). Se Lei &amp; Ordem chegar a 0 antes, o arco acaba sem Vectora, a menos que você escolha o momento.</p>
				<h2>Cenas, não relógio</h2>
				<p>Esta aventura é uma \"história\" com sequência definida. As cenas acontecem quando o grupo chega, no momento em que precisam. O mestre tem <b>créditos</b> (ganhos quando o grupo demora a achar os elfos) para gastar em truques que mantêm o baú longe; quanto mais truques sem crédito, maior a vantagem do grupo no final. <b>Não altere rolagens.</b> Se o grupo frustrar tudo, ria, dê os parabéns e conte como deveria ter sido.</p>
				<h2>Fases</h2>
				<ol>
					<li><b>Fase 0 · Normalidade:</b> esperar Vectora; boa hora para Felicia procurar o grupo.</li>
					<li><b>Fase 1 · Este Mundo Está Perdido:</b> a SPIMA na Rua dos Facóceros (role um encontro no caminho).</li>
					<li><b>Fase 2 · Duas Cidades:</b> Vectora atraca; achar os elfos (${linkMacro("Achar os Elfos")}), perseguir (${linkMacro("Perseguição em Vectora")}), primeiro confronto.</li>
					<li><b>Fase 3 · Ponto de Encontro:</b> o Campo de Keenn e a batalha das quatro facções (${linkMacro("Batalha no Campo de Keenn")}).</li>
					<li><b>Fase 4 · Explicações:</b> Janara sem medalhão, Elyrionn negociando, os anões apavorados; rastrear os cavaleiros.</li>
					<li><b>Fase 5 · Fuga para Vectora:</b> perseguição aérea e combate contra os cavaleiros em grifos (${linkMacro("Transportes")}).</li>
					<li><b>Fase 6 · Desfecho:</b> Andrus devolve tudo; provas e pagamento.</li>
				</ol>
				<h2>Macros</h2>
				${lista([
					`${linkMacro("Vectora Atracou")}: a rolagem depois de cada aventura (a contagem fica guardada com você).`,
					`${linkMacro("Achar os Elfos")}: o teste estendido especial (CD 25, dado que encolhe, créditos).`,
					`${linkMacro("Créditos do Mestre")}: gasta créditos nos truques e aplica o bônus quando não há crédito.`,
					`${linkMacro("Perseguição em Vectora")}: perseguição aérea ou a pé com as tabelas desta aventura (selecione os perseguidores e marque os fugitivos como alvo).`,
					`${linkMacro("Batalha no Campo de Keenn")}: roteiro das 5 rodadas e a regra de luta entre NPCs.`,
					`${linkMacro("Andrus Ataca")}: as três aparições do Aranha e a devolução da fase 6.`,
					`${linkMacro("Transportes")}: três transportes sorteados para a fase 5.`
				])}
				<p>${leiOrdem ? `Lei &amp; Ordem: ${L(leiOrdem)}.` : "Lei &amp; Ordem fica no ator da Aventura 0 (importe o Ato 2 do módulo)."} As provas vão na opção \"Provas entregues\" da macro de Lei &amp; Ordem.</p>`, 100),
			pagina("As Facções", `
				<p>Não se preocupe com cada indivíduo: basta o estilo do grupo, o líder e o objetivo.</p>
				<h3>Os elfos · ${L(atores.elyrionn)} e ${L(atores.elfo)} ×7</h3>
				<p>Oito elfos do Império de Tauron, embrutecidos, com o simbionte. Elyrionn: alto, cabelo rente, cicatriz em X. Frio, implacável, ama o ouro. Vão encontrar os compradores num balão saindo de Vectora.</p>
				<h3>Os humanos · ${L(atores.janara)} e ${L(atores.agente)} ×5</h3>
				<p>Os compradores parecem cultistas, mas são agentes da Coroa. Janara, ex-Protetorado, quer o item fora de circulação sem violência e despreza \"heróis\" interferindo.</p>
				<h3>Os anões · ${L(atores.rolthurr)} e ${L(atores.mazynne)}</h3>
				<p>Amadores endividados com a Tropa da Floresta e das Montanhas. \"Meu Pedregulho\" e \"Trobinha\". Apavorados.</p>
				<h3>Os cavaleiros · ${L(atores.androwe)} e ${L(atores.cavaleiro)} ×4</h3>
				<p>Cavaleiros da Luz corrompidos pela Tormenta em Norm. Androwe é sádico; os outros, fanáticos. Táticas brutais e nada sutis.</p>
				<h3>O ladrão · ${L(atores.andrus)}</h3>
				<p>O maior ladrão de Arton. Não é o maior antagonista, mas é a maior incógnita: dá para combater qualquer facção, exceto Andrus. Uma vez que ele tenha sucesso, o grupo depende da benevolência dele.</p>
				<h3>Extras</h3>
				${lista([`${L(atores.bandido)} ×4: só se os anões fugirem com o baú.`, `${L(atores.grifo)}: montarias dos cavaleiros na fase 5.`])}`, 200),
			pagina("Fase 1 · A SPIMA", `
				<p>A Rua dos Facóceros, na Vila Élfica, destoa do bairro: estreita, serpenteante, pacata, de pais e mães de família. Poucos elfos. A <b>casa verde</b> fica entre um prédio de três ou quatro famílias e um fabricante de rodas. No térreo, \"Willet e Filhos, Confecção e Conserto de Calçados em Geral\"; uma placa menor: \"Sociedade Pontifícia de Intercessão Moral Artoniana, sede principal: segundo andar\". Passa-se pelo balcão do sapateiro e sobe-se uma escada apertada.</p>
				<p>Sala atopetada de pergaminhos e símbolos sagrados, cinco pessoas, um cartaz da deusa Valkaria chorando: \"Seus filhos podem ser cultistas da Tormenta! A negligência paterna faz Valkaria chorar\". <b>Crisântemo Horizonte</b> (humano idoso, ex-clérigo de Glórienn, fazendo um colar de miçangas): <i>\"Rostos jovens! Sejam bem-vindos, vocês estão no lugar certo se querem evitar a corrupção e a loucura que dominam o Reinado!\"</i></p>
				${lista([
					"Pensam que os heróis vieram \"ouvir a verdade\". Falatório sobre a Tormenta em toda parte e os \"velhos e bons tempos\"; boa hora para uma lenda urbana. Tudo para quando os heróis dizem que são da Guarda.",
					"Um <b>lefou</b> no grupo apavora os ex-clérigos (\"eles\" vieram levá-los). Se ele for amigável, podem acolhê-lo e oferecer \"redenção\".",
					"Tudo para eles é corrupção, modernidade e ausência dos deuses antigos: isso deve fazer o grupo desconfiar. Mas a informação é legítima."
				])}
				<h3>A dica</h3>
				<p>Uma quadrilha de elfos usa Vectora para se mover pelo Reinado com um item valioso, que vão vender. Saem do Mercado nas Nuvens num balão, na cobertura da multidão. A SPIMA não sabe quem compra nem onde. A informação chegou por acaso, pela rede de boatos de gente que vê Tormenta em tudo; Crisântemo só soube por ter sido clérigo de Glórienn. Ressalte que não é mistério: uma venda dessas sempre vaza (e a Coroa também soube).</p>
				<p><b>Brunhilda</b> (anã de Valkaria, preguiçosa) toma a frente, com medo genuíno: <i>\"Está correndo o boato de que o maior ladrão de Arton está interessado no artefato. (...) Qualquer lugar pode ser corrompido, qualquer pessoa pode enlouquecer se um objeto da Tormenta cair nas mãos de Andrus, o Aranha.\"</i></p>`, 300),
			pagina("Fase 2 · Duas Cidades", `
				<p>Role um encontro no caminho se o grupo partir com folga; ignore se houver pressa.</p>
				<p>Vectora singra os céus sobre o cume invertido de uma montanha, com ilhas flutuantes em volta e as rachaduras da batalha contra o Dragão da Tormenta preenchidas com ouro. Centenas de pessoas no atracadouro (uma torre de metal); goblins anunciando transporte aos gritos e brigando (baloeiro contra ornitóptero, catapulta contra fogos de artifício); magos com serviços caros e seguros; cavaleiros de grifos com jaulas; valkarianos com escadas de mão enormes. Correntes saltam da cidade e se prendem à torre: <b>Vectora atracou.</b> Logo o ar vira um emaranhado de balões, grifos, alados e engenhos voadores.</p>
				<h3>Achar os elfos</h3>
				<p>Descrição: elfos fortes e embrutecidos, liderado por um homem com cicatriz em X, com um grande baú (talvez num veículo; talvez não seja um balão). Vários grupos se encaixam. Use ${linkMacro("Achar os Elfos")}:</p>
				${lista([
					"Teste estendido de Investigação ou Percepção, <b>CD 25</b>, que não fica mais difícil e não tem número de sucessos.",
					"Cada sucesso rola um dado: 1 sucesso 1d20, 2 → 1d12, 3 → 1d10, 4 → 1d8, 5 → 1d6, 6 → 1d4, 7+ → 1d3. <b>Com 1, é o grupo certo.</b>",
					"Cada falha e cada dado que não der 1 dá um <b>crédito</b> ao Mestre. Explique isso aos jogadores.",
					"Achados em até 5 rolagens: ainda descendo (perseguição <b>aérea</b>). Em 6 a 8: a caminho do Campo de Keenn (perseguição <b>a pé</b>). Mais de 8: perdidos, fase 3.",
					"Voar, luneta ou magia não dão bônus: são o que permite testar. Aceite perícias criativas (Guerra para uma formação de escolta, Misticismo para sentir a Tormenta).",
					"Um personagem que se desgarra pode testar sozinho, mas os sucessos dele não somam aos do grupo."
				])}
				<h3>Perseguindo os elfos</h3>
				<p>Regras de perseguição do Tormenta20 (p. 274) com as tabelas ${L(tabAerea)} e ${L(tabPe)}, que ${linkMacro("Perseguição em Vectora")} já aplica. Sem voo próprio: <b>baloeiro goblin</b>, 1d3 rodadas e T$ 20 por passageiro, até 8 criaturas Médias, voo 12m; o piloto testa por todos com Pilotagem +10.</p>
				<h3>Primeiro confronto</h3>
				<p>Encontro: ${L(atores.elyrionn)} e ${L(atores.elfo)} ×7. Lutam até a morte, mas salvam o baú acima de tudo: o ideal é o grupo vencer e alguns elfos fugirem com ele enquanto os outros se sacrificam. Dois elfos carregam o baú; escapam se passarem 2 rodadas seguidas segurando (desarmar o baú ou derrubar um deles reinicia a contagem) e um vencer Furtividade contra a Percepção do grupo. Se vencerem, não matam ninguém.</p>
				<p><b>Andrus:</b> em algum ponto, ${linkMacro("Andrus Ataca")} (1d4; com 4, rouba o item mais valioso de um personagem sorteado, Percepção contra Ladinagem +35). Não pegue armadura vestida nem espada na bainha: uma gema, um colar, um item alquímico.</p>
				<h3>Sumiço do Baú</h3>
				<p>Se o grupo tomar o baú e os elfos não tiverem saída dentro das regras (nem a morte impede): um elfo se joga sobre o baú, um brilho verde cega todos e ele explode. O baú foi teleportado pelo ${L(itemPorNome("Anel"))}. Gaste um crédito em ${linkMacro("Créditos")}; <b>sem crédito, todos recuperam todos os PM</b>.</p>
				<h3>Contingência: Emboscada</h3>
				<p>Se planejarem uma emboscada e tomarem o baú, ótimo. Cada fase tem um truque para manter o baú longe, e um bônus para o grupo se o Mestre usá-lo sem crédito.</p>
				<h3>Nem Tão Forçado</h3>
				<p>Se achar forçado que os elfos desçam no exato instante: incentive uma <b>tocaia</b> (Investigação ou Percepção; uma falha não trava o jogo, só dá crédito ao Mestre) ou deixe o grupo investigar em Vectora e descobrir hora e local por um NPC (Klunc e Maquius sem perceber, Zebediah Nash ou Luigi Sortudo de propósito). O confronto deve acontecer nas ruas de Valkaria, não em Vectora.</p>
				<h3>Tabelas</h3>
				<h4>Perseguição aérea</h4>${eventosHtml(EV_AEREA)}
				<h4>Perseguição a pé</h4>${eventosHtml(EV_PE)}`, 400),
			pagina("Fase 3 · O Campo de Keenn", `
				<p>Campo de treinamento do exército de Deheon e da Guarda, engolido pelas muralhas. Alojamentos, pistas de obstáculos, altares a Arsenal, bonecos e coberturas, áreas vazias. Aberto à população, cenário de duelos e acampamentos de nobres guerreiros: tipos armados não chamam atenção, e \"conversar\" ali não é ilegal. Hoje, por causa de Vectora, só há o crime.</p>
				<p><b>Achar o ponto de encontro:</b> Investigação CD 25 (ou estendido CD 20, 3 sucessos, se quiser segurar o ritmo).</p>
				<h3>Resultados possíveis da fase 2</h3>
				${lista([
					"<b>Baú teleportado, alguns elfos fugiram:</b> o fugitivo vai ao Campo de Keenn, onde o baú o espera. Rastreá-lo, ou interrogar um elfo capturado (não é cultista: com garantias, trai a quadrilha).",
					"<b>Baú teleportado, todos os elfos caíram:</b> Investigação CD 25 (Misticismo como ajuda). Os anões chegam antes e tentam escapar com o baú.",
					"<b>Os aventureiros estão com o baú:</b> ainda há os compradores. Disfarçar-se de elfos e armar uma armadilha é ótimo; incentive. Os anões abordam no caminho; os cavaleiros atacam (use o truque). Se só levarem o baú à guarita, os anões abordam no meio do caminho, os cavaleiros atacam perto da guarita e Janara chega tarde e se revela, repreendendo-os.",
					"<b>Os aventureiros dominam a situação:</b> deixe que vençam. Mathilda se surpreende, Janara vai à guarita e os elogia (respeita se não quiserem entregar o baú). Alguém acha na algibeira: <i>\"Nem mesmo eu esperava por isso. Vocês têm talento para o crime. Se quiserem mudar de carreira, venham falar comigo. Não vão me achar, mas eu vou achá-los. –A\"</i>"
				])}
				<h3>Cenário ideal</h3>
				<p>Dois grupos no campo semicircular: os elfos com o baú e cinco humanos liderados por uma mulher de cabelos brancos, de casaca, com espada de esgrima. Se o grupo se revelar, é emboscada e combate. Escondidos, ouvem a conversa e testam Percepção duas vezes: <b>CD 20</b> nota Rolthurr e Mazynne atrás de um obstáculo; <b>CD 30</b> nota o ar tremeluzindo (os cavaleiros invisíveis; Misticismo CD 15 identifica magia; aura moderada de perto).</p>
				<p><i>Elyrionn: \"Então você é Janara?\" Janara: \"Não viemos aqui para nos conhecer. Trouxe a coisa?\" (...) \"Traga o baú até aqui. Deixe seu pessoal para trás. (...) Nos encontramos no meio do caminho e cada um abre o que trouxe, ao mesmo tempo.\"</i> Quando pousam os baús, uma bomba de fumaça cai entre os dois e duas figuras pequenas correm de trás de um alojamento. <b>\"Emboscada!\"</b></p>
				<h3>Encontro: as quatro facções</h3>
				<p>${[atores.elyrionn, atores.elfo, atores.janara, atores.agente, atores.mazynne, atores.rolthurr, atores.androwe, atores.cavaleiro].map(L).join(", ")} (desconte os elfos já derrotados). Use ${linkMacro("Batalha no Campo de Keenn")} no fim de cada rodada.</p>
				<h3>Roteiro</h3>
				<ol>
					<li>Mazynne joga mais uma bomba de fumaça; Rolthurr corre até o baú; elfos e humanos se atacam.</li>
					<li>Rolthurr pega o baú e se afasta; Mazynne segura o outro lado; Elyrionn e Janara notam os anões.</li>
					<li>Elyrionn e Janara seguram o baú; os cavaleiros saem da invisibilidade em investida contra elfos e humanos.</li>
					<li>Todos disputam o baú sem vencedor; luta sem ordem.</li>
					<li>Sir Androwe toma o baú e parte a galope; Janara se revela e ordena a rendição.</li>
				</ol>
				<h3>Luta entre NPCs</h3>
				${lista([
					"No fim de cada rodada, 1d6 para cada NPC atacado ou alvo de efeito com dano: com 1, perde metade dos PV (dois ferimentos derrubam).",
					"Muitos ataques ou efeitos: +1 no número.",
					"Lacaios (elfos fora da lei, agentes, cavaleiros) são feridos com 2; cada NPC atacado por um lacaio soma +1.",
					"A investida dos cavaleiros soma +1, e quem é ferido por ela é derrotado."
				])}
				<h3>Andrus</h3>
				<p>Percepção CD 25 nota um vulto a mais. Desta vez ele rouba de <b>Janara</b>: o medalhão que prova que ela serve à Coroa. O grupo tem uma rodada; impedir pede Ladinagem oposta (+35). Sozinha, Janara não percebe.</p>
				<h3>Sumiço do Baú</h3>
				<p>Se o grupo tiver o baú, todas as facções o atacam para pegar o item (não para matar); quem carrega é o alvo e, se cair, o próximo NPC na iniciativa pega o baú. Se mesmo assim o grupo terminar com ele, sir Androwe funde dois cavaleiros e cavalos num monstro alado que foge com o baú (${linkMacro("Créditos")}). Quem vê ganha a aliança de todas as outras facções; <b>sem crédito, também +1 de Lei &amp; Ordem</b>.</p>
				<h3>Pobres anões!</h3>
				<p>Se um anão sobreviver, converse com um aventureiro: peixes pequenos num oceano de tubarões, quase vítimas inocentes. Imploram pelo baú para escapar da Tropa. Saída óbvia e desonesta: roubar o ${L(itemPorNome("Baú do Pagamento"))}. Sozinhos, são incapazes. Sucesso rende só a gratidão eterna deles (e convencê-los a não apostar o ouro).</p>`, 500),
			pagina("Fase 4 · Explicações", `
				<p>Corpos de elfos pelo chão, humanos feridos, Janara tentando se levantar, os anões saindo de fininho. <i>\"Parados! Vocês também, aventureiros. Meu nome é Janara e estou aqui pela autoridade da Coroa do Reinado. Aqui está meu medalhão... Ei, onde está meu medalhão?\"</i></p>
				<h3>O que cada um sabe</h3>
				${lista([
					"<b>Janara:</b> ex-Protetorado (sob Arkam Braço Metálico). Nobres e assessores da Rainha-Imperatriz souberam do artefato e dos elfos; ela foi mandada se infiltrar e obter o item com o mínimo de violência, sem prender ninguém (isso seria da Guarda, que nunca foi avisada). Meses negociando por intermediários. Furiosa: culpa o grupo, mas sabe que falhou; não sabia dos cavaleiros nem dos anões.",
					"<b>Elyrionn:</b> negocia a vida. A quadrilha prosperou no caos de Tauron traficando itens da Tormenta; espalhou a venda pelo submundo de Tiberus sem dizer que era um simbionte; viajou em Vectora porque lá ninguém mete o nariz nas mercadorias. Sir Androwe tentou comprar, não tinha ouro e ficou furioso. A Tropa é menor, mas perigosa.",
					"<b>Os anões:</b> não sabiam nem do artefato até receberem a ordem."
				])}
				<h3>Rastrear os cavaleiros</h3>
				<p>Teste estendido de Investigação <b>CD 20, 5 sucessos</b>. Elyrionn dá <b>Ladinagem +15 como ajuda</b>; boa interpretação ou testes sociais que tornem Janara e os anões aliados valem um sucesso automático. Conclusão: os cavaleiros precisam de um lugar fora da jurisdição da Guarda e da Coroa, e protegido. Ironicamente, <b>Vectora</b>.</p>
				<h3>Se outra facção ficou com o baú</h3>
				${lista([
					"<b>Os elfos:</b> voltam a Vectora em grifos; a fase 5 é igual, contra os elfos (com o deslocamento dos grifos). Janara e os anões podem ajudar; os cavaleiros nunca.",
					"<b>Janara:</b> só tem a palavra. Intuição: \"ela parece falar a verdade\", com –5 (tudo nela é suspeito: não diz superiores, destino nem como soube). Se confiarem, ela encerra o caso e os elogia a Mathilda. Se atacarem, foge para Vectora em grifos e a fase 5 é contra os agentes. <b>Matá-la custa –5 de Lei &amp; Ordem.</b>",
					`<b>Os anões:</b> fogem (perseguição a pé quase formal). Se escaparem, chegam a um esconderijo da Tropa: combate contra ${L(atores.bandido)} ×4. Se pegos, imploram para ficar com o baú. A aventura termina aqui.`,
					"<b>Os personagens:</b> se até o truque sujo falhou, eles merecem: a aventura termina e impressionam Mathilda e Janara."
				])}
				<h3>Contingência: \"Nós fazemos alguma diferença?\"</h3>
				<p>Aqui os heróis são mais uma facção (a Guarda), não o pináculo da bondade. Se a Guarda vence, criminosos presos, mas a Coroa falha e os anões morrem nas mãos da Tropa. Se Janara vence, o item fica seguro, os criminosos saem livres e os anões morrem. Se os anões vencem, o amor triunfa e uma irmandade fica com um artefato da Tormenta. Só por intervenção dos heróis os anões sobrevivem, Janara ganha credibilidade ou os elfos são presos; sem eles, os cavaleiros ficariam com o baú. Isto é Valkaria: aqui são \"peixes médios\".</p>`, 600),
			pagina("Fase 5 · Fuga para Vectora", `
				<p>Anoitecendo, a sombra da estátua de Valkaria corta a luz entre os prédios. O ponto de referência é o Mercado nas Nuvens preso ao atracadouro. Um grifo alça voo, depois outro e outro; crianças apontam, bêbados admiram, aventureiros iniciantes aplaudem. Mas são cultistas assassinos. Se chegarem a Vectora com o artefato, tudo estará perdido.</p>
				<p><b>Última trapaça:</b> não importa a demora, o grupo chega quando os grifos estão decolando. Daqui em diante, a aventura segue como qualquer outra.</p>
				<h3>Transportes</h3>
				<p>${linkMacro("Transportes")} sorteia três de ${L(tabTransportes)}; cada um leva 1d3 rodadas (boas ideias encurtam, como roubar um veículo e ser caçado por patrulheiros).</p>
				${tabelaHtml(["Transporte", "Preço", "Regra"], TRANSPORTES)}
				<h3>Perseguição e combate</h3>
				<p>${linkMacro("Perseguição em Vectora")} com a tabela aérea. Alcançados, os cavaleiros lutam voando para Vectora, até a morte. Desmontar alguém ou derrubar seu voo é uma queda de dezenas de metros (pedregulhos e detritos flutuantes em volta de Vectora podem amortecer). Encontro: ${L(atores.androwe)} e ${L(atores.cavaleiro)} ×4 em ${L(atores.grifo)}.</p>
				<p><b>A simbiose:</b> com metade dos cavaleiros caídos, sir Androwe gasta 2 rodadas abrindo o baú e se ligando ao pterodraco. Dá para impedir depois da primeira rodada (baú aberto, simbiose não feita); depois do contato, nada a fazer (ligue o efeito na ficha dele). Impedida a simbiose, um personagem pode adquirir as ${L(itemPorNome("Asas"))} pelas regras de <i>Ameaças de Arton</i> (pp. 60–61): é o único jeito \"legal\", e Janara e Mathilda entendem depois.</p>
				<h3>Más companhias</h3>
				<p>Aliados viram parceiros: Elyrionn atirador veterano, Janara combatente veterana, o casal de anões um único assassino iniciante (+1d6). Os comandados não contam. Contra elfos, humanos ou a Tropa, os cavaleiros nunca são parceiros.</p>
				<h3>Andrus em queda livre</h3>
				<p>Um vulto despenca de Vectora (Percepção CD 20: é Andrus). Se o baú ou o simbionte estiver com um personagem, é o alvo (Ladinagem oposta, +35). Senão, rouba um item de quem ainda não foi furtado. Balança num fio invisível e some: impossível rastreá-lo. No lugar do objeto, o ${L(itemPorNome("Bilhete"))}. Use ${linkMacro("Andrus Ataca")}.</p>`, 700),
			pagina("Fase 6 · Desfecho", `
				<p>No beco escuro atrás da Guarita da Praia, Andrus sai das sombras, sorri e abre o manto com tudo o que roubou (${linkMacro("Andrus Ataca")}, opção da fase 6, lista o que foi roubado):</p>
				<p><i>\"Nunca fui seu inimigo. Não gosto de bandidos como os elfos de Elyrionn, muito menos de cultistas como aqueles cavaleiros. E não confio em ninguém que esteja disposto a pagar por um simbionte, mesmo que esteja a mando da própria Rainha-Imperatriz. Roubei seus itens para que soubessem que sou melhor que vocês. Roubei o medalhão de Janara para impedi-la de conseguir o simbionte. Tudo que fiz hoje foi para mostrar a vocês que as coisas poderiam ser piores... Mas eu não quis, pois não sou seu inimigo. Aqui está tudo que vocês perderam. Fiquem com o medalhão de Janara. É mais divertido assim. Decidam se querem devolvê-lo a ela. Ah, e podem também ficar com o simbionte. Apenas não o entreguem à Coroa. Aventureiros são mais confiáveis que agentes do Reinado, mesmo que sejam membros da Guarda. E, se me traírem... Bem, podem dar adeus a seus objetos. Todos eles.\"</i></p>
				${lista([
					"<b>Andrus roubou o simbionte</b> (resultado ideal): entrega ao grupo, a melhor opção entre as facções.",
					"<b>Não roubou:</b> só devolve os itens. Lamenta, mas a destruição da criatura foi boa alternativa; se um personagem ficou com o pterodraco, \"era o planejado desde o início\".",
					"<b>Janara ficou com ele:</b> balança a cabeça; vai ter todo o trabalho de roubá-lo de novo."
				])}
				<p>Depois, pontas soltas: Janara explica o que faltou; os anões pedem ajuda. <i>\"Admito minha derrota. A Guarda de Valkaria ganhou essa. Mas nunca mais interfiram com missões da Coroa.\"</i> Tudo se passou num dia.</p>
				<h3>Quem acaba onde</h3>
				${lista([
					"Janara insiste em ficar com o simbionte, mas sem o medalhão não prova autoridade e não está acima da Guarda. Vai embora resmungando. Se o baú do pagamento \"sumiu\", fica ainda mais desconfiada, mas não prova nada.",
					"Elfos: mortos ou presos, a menos que tenham vencido.",
					"Anões: só se saem bem com ajuda do grupo; senão morrem num combate ou depois, nas mãos da Tropa.",
					"Cavaleiros: provavelmente mortos."
				])}
				<h3>Provas</h3>
				${lista([
					`${L(itemPorNome("Baú com"))}, com ou sem o simbionte.`,
					`${L(itemPorNome("Medalhão"))}.`,
					`${L(itemPorNome("Baú do Pagamento"))} (aí não pode ser gasto).`,
					"Um criminoso disposto a delatar os outros (Elyrionn ou um dos anões).",
					`${L(itemPorNome("Pedaço"))}.`
				])}
				<h3>Pagamento</h3>
				<p>Simbionte destruído ou entregue à Guarita da Praia: a SPIMA paga <b>T$ 12.000</b> (níveis 8–9), <b>T$ 24.000</b> (nível 10) ou <b>T$ 32.000</b> (nível 11). Se o grupo ou Janara ficarem com o simbionte, <b>metade</b> (a SPIMA os acha \"mais loucos que estão estragando nossa querida Arton\" ou \"capachos dessa Rainha-Imperatriz usurpadora\"). <b>Matar Janara: –5 de Lei &amp; Ordem.</b></p>
				<p>Agradeça aos jogadores o bom humor numa aventura \"diferente\". Desta vez trapaceamos bastante; na próxima tudo volta ao normal, ou tão normal quanto Valkaria permite.</p>`, 800)
		]
	});

	ui.notifications.info("Fim dos Tempos · Arco 2 · Aventura 2 (Conexão Vectora): conteúdo criado.");
})();
