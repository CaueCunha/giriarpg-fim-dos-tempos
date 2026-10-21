/* =====================================================================
 * FIM DOS TEMPOS · AVENTURA 4.5 · "PLANO 5 DAS COLINAS CENTRAIS"
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Av4.5 · Plano 5 das Colinas Centrais" com:
 *      - Personagens: Malakias Andronicus, a cabeça de Myrianthe, as versões corrompidas
 *        dos dois (Conclusão B) e o zumbi defeituoso do covil.
 *      - Ator de apoio "O Mistério de Malakias" com todas as pistas e CDs.
 *      - Itens: carta de Malakias, Mecanismo Necroaberrante, ordens de Syvarian.
 *      - Tabela "Encontros nas Colinas Centrais" (1d20).
 *      - Diário com guia, handouts, a verdade, reações, covil, perguntas e conclusões.
 *      - Macros: Examinar Malakias e Rastro dos Mortos.
 *   3. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "av45".
 *
 * Feito a partir do código do sistema (master, out/2026); não foi testado num Foundry rodando.
 * Veja o guia av45-plano-5-colinas.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "av45";
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
			window: { title: "Aventura 4.5: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para a Aventura 4.5.</p>
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
	/* 1. Construtores (mesmos das Av2 a Av5)                                */
	/* ------------------------------------------------------------------ */
	const NOME_PASTA = "FdT · Av4.5 · Plano 5 das Colinas Centrais";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#4a5a3a", flags: FLAGS() })).id;
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

	const ATR_PERICIA = { luta: "for", atle: "for", pont: "des", inic: "des", refl: "des", furt: "des", acro: "des", fort: "con", perc: "sab", vont: "sab", intu: "sab", sobr: "sab", reli: "sab", atua: "car", enga: "car", dipl: "car", inti: "car", mist: "int", ofi0: "int", conh: "int", pilo: "des", inve: "int", ladi: "des", guer: "int", cura: "sab" };

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


	/** Copia uma ameaça do compêndio do sistema, com a marca da Av4.5. */
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
		return Actor.create(data);
	};

	/* ------------------------------------------------------------------ */
	/* 2. Personagens e ameaças                                             */
	/* ------------------------------------------------------------------ */
	const atores = {};

	atores.malakias = await criarNPC({
		name: "Malakias Andronicus",
		tokenName: "Malakias",
		role: "malakias",
		link: true,
		disposition: 0,
		img: `${T20I}/ameacas/zumbi.png`,
		nd: "1/4",
		cd: 10,
		tipo: "mor",
		raca: "humano (morto-vivo)",
		papel: "special",
		atr: { for: 0, des: -1, con: 0, int: 0, sab: -1, car: 1 },
		pv: 10,
		def: 9,
		walk: 6,
		pericias: { perc: 0, intu: -1, vont: 1 },
		ic: ["cansaco", "metabolismo", "veneno"],
		resTxt: "Morto-vivo inteligente. Magias que só afetam humanoides não funcionam nele.",
		bio: p(
			"Velho baixo de barba branca esfiapada, chapéu puído e roupas esfarrapadas. Tagarela, ranzinza, não para de falar e se perde em tangentes. Bom anfitrião das Centrais, mas <b>não oferece comida nem bebida</b>: não há nada para comer na casa.",
			"Fala do Rei-Imperador Phylidio, o Tranquilo, como se reinasse. Não sabe o que é a Tormenta, nunca ouviu falar da Aliança Negra nem de Mestre Arsenal, acha os elfos grandes sábios.",
			"Lembra de ter acordado \"perto de Ponta de Pedra\", logo ao sul da aldeia (o cemitério). Acha que foi bebedeira. Oferece alguns porcos como pagamento... que também sumiram.",
			"<b>Verdade:</b> morreu em 1345, há 75 anos. Um Mecanismo Necroaberrante de Torgo o ergueu com o espírito intacto. A colina onde vivia tem um veio de metal arco-íris, por isso a corrupção não o dominou (por enquanto).",
			"<b>Hostilidade</b> (inclusive afastar mortos-vivos): ele tem medo, tenta se proteger e, se não der, a fúria revela a Tormenta nele. Troque o token pelo <i>Malakias Corrompido</i>.",
			"A ficha dele é só para referência (o livro não dá estatísticas)."
		)
	});

	atores.myrianthe = await criarNPC({
		name: "Myrianthe Andronicus (cabeça falante)",
		tokenName: "Myrianthe",
		role: "myrianthe",
		link: true,
		disposition: 1,
		img: `${T20I}/ameacas/aparicao.png`,
		nd: "1/4",
		cd: 10,
		tipo: "mor",
		raca: "humana (morta-viva)",
		papel: "special",
		tamanho: "min",
		atr: { for: -5, des: -5, con: 0, int: 1, sab: 2, car: 2 },
		pv: 5,
		def: 5,
		walk: 0,
		ic: ["cansaco", "metabolismo", "veneno"],
		bio: p(
			"Esposa de Malakias, morta alguns anos depois dele. Só resta a <b>cabeça</b>, num canto de um corredor do covil: Syvarian a decapitou com a serra quando ela começou a fazer perguntas. Voz de avó simpática.",
			"Lembra de tudo, sabe que morreu e entende o que aconteceu. Viu Torgo e Syvarian e sabe do plano de erguer zumbis por todas as Colinas para um ataque geral. As respostas dela estão no diário.",
			"A ficha é só para referência (o livro não dá estatísticas)."
		)
	});

	const BIO_CORROMPIDO = (quem) => p(
		`<b>Conclusão B (Escatologia & Sadismo).</b> ${quem}`,
		"<b>O livro não dá ficha</b> para os anciões corrompidos, só diz que são zumbis da Tormenta vencidos num curto combate. Esta é a ficha do uktril (Formiga Aberrante) do compêndio, como sugestão. Corte os PV se quiser um combate mais curto."
	);
	atores.malakiasCorrompido = await clonarAmeaca("a4o3vOZbpJJdoN1N", "Malakias Corrompido (zumbi da Tormenta)", {
		role: "malakiasCorrompido", tokenName: "Malakias", link: true, img: `${T20I}/ameacas/maniaco-lefou.png`,
		bio: BIO_CORROMPIDO("Confrontado com a verdade de que está morto, algo se quebra: patas e antenas quitinosas brotam da boca, ouvidos e olhos, o corpo se rompe e revela carapaça insetoide.")
	});
	atores.myrantheCorrompida = await clonarAmeaca("a4o3vOZbpJJdoN1N", "Myrianthe Corrompida (zumbi da Tormenta)", {
		role: "myriantheCorrompida", tokenName: "Myrianthe", link: true, img: `${T20I}/ameacas/aparicao.png`, pv: 25,
		bio: BIO_CORROMPIDO("Ao ver o marido se corromper, Myrianthe grita e eclode também: patas quitinosas brotam do pescoço decepado, quelíceras tomam a boca. Os PV estão reduzidos (25) porque ela é só uma cabeça.")
	});
	atores.zumbi = await clonarAmeaca("aDJoJf7PgQ33UvNA", "Zumbi Defeituoso do Covil", {
		role: "zumbi", tokenName: "Zumbi defeituoso",
		bio: p("Dois dos três mortos-vivos deixados no covil: um homem que anda há dias de cara para a parede (os pés já viraram tocos) e uma mulher com metade do tronco e um braço, a mandíbula podre, sem conseguir articular palavras.",
			"Não são uma ameaça real; servem para ambientar o covil. Use a ficha de Zumbi do sistema se o grupo atacar.")
	});

	/* ---------- Ator de apoio: o mistério ---------- */
	atores.misterio = await criarNPC({
		name: "O Mistério de Malakias (testes)",
		tokenName: "Mistério de Malakias",
		role: "misterio",
		disposition: 0,
		img: "icons/svg/skull.svg",
		nd: 4,
		cd: 20,
		tipo: "hum",
		papel: "special",
		atr: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
		pv: 1,
		def: 10,
		bio: p("<b>Ator de apoio, não vai para o mapa.</b> Cada item é uma pista ou teste da investigação, com a CD do livro. A macro <i>Examinar Malakias</i> rola os testes nos tokens selecionados e posta o que cada sucesso revela."),
		items: [
			poder("Examinar Malakias", "icons/svg/eye.svg",
				p("<b>Conhecimento CD 10:</b> ele cita fatos que não poderia ter presenciado.",
					"<b>Cura CD 25:</b> não parece vivo. Não respira de verdade, não tem batimentos, não dorme, não sua, não come nem bebe.",
					"<b>Intuição CD 20:</b> não parece maligno, mas não age como quem perdeu a família; algo nele sabe que não há motivo para se preocupar.",
					"<b>Misticismo CD 25:</b> aura necromântica, é um morto-vivo. <b>35 ou mais:</b> é uma criatura da Tormenta.",
					"<b>Magias:</b> as que só afetam humanoides falham; detectar tipo de criatura revela a natureza dele.",
					"<b>Metal arco-íris:</b> o brilho incomoda e o toque queima a pele dele, sem ferir de verdade."),
				{ exec: "passive" }),
			poder("Cemitério de Ponta de Pedra", "icons/svg/ruins.svg",
				p("Várias covas remexidas e vazias, cada uma com um <b>casulo estourado</b> preso a gavinhas vermelhas de carapaça quitinosa. As lápides da família de Malakias estão lá.",
					"<b>Investigação ou Sobrevivência</b> (o livro não dá CD; sugestão CD 15): as gavinhas levam ao <b>Mecanismo Necroaberrante</b>."),
				{ exec: "passive" }),
			poder("Mecanismo Necroaberrante", "icons/svg/clockwork.svg",
				p("Ovo de metal de uns 30 cm, aberto em gomos iguais, com cristais rosados e um núcleo de matéria vermelha. Inativo: causa só desconforto e manipulá-lo não corrompe.",
					"<b>Lefou, ou Ofício (engenhoqueiro) ou Misticismo CD 25:</b> o desconforto vem da matéria vermelha.",
					"Estudado: ciência muito além de Arton. Os cristais ligam a outra dimensão (cabe mais matéria do que o tamanho permite), é corrompido pela Tormenta e transmite aos corpos personalidade e memórias das almas."),
				{ exec: "passive" }),
			poder("Rastro dos Mortos", "icons/svg/target.svg",
				p("Teste estendido de <b>Sobrevivência CD 20, 5 sucessos</b> até o covil, a pelo menos um dia de distância. Boa interpretação com NPCs do caminho substitui uma rolagem; boa interpretação mais um sucesso social transformam uma falha em sucesso. Role na tabela de encontros pelo caminho.",
					"Use a macro <i>Rastro dos Mortos</i>."),
				{ exec: "passive" }),
			poder("O Covil", "icons/svg/hazard.svg",
				p("Abertura pequena para uma caverna ampla e corredores: uma \"mini masmorra\" criada pelo espaço de masmorra do Templo do Vácuo, usada por Syvarian como base.",
					"<b>Investigação ou Sobrevivência CD 20:</b> manchas de podridão, carne, arranhões. <b>Percepção CD 15 ou faro:</b> cheiro de podridão (Malakias não tinha). Depois de um tempo, gemidos e pés se arrastando.",
					"Roupas velhas, objetos, armas quebradas, anotações dos bandidos e as <b>ordens de Syvarian para Torgo</b>."),
				{ exec: "passive" })
		]
	});

	/* ------------------------------------------------------------------ */
	/* 3. Itens                                                             */
	/* ------------------------------------------------------------------ */
	const itemDoc = (d) => ({ ...d, folder: pasta.Item, flags: FLAGS() });
	const tesouro = (name, img, html) => itemDoc({ name, type: "tesouro", img, system: { description: { value: html }, qtd: 1, preco: 0, peso: 0, espacos: 0 } });
	const itensCriados = await Item.createDocuments([
		tesouro("Carta de Malakias", `${T20I}/itens/gerais/pergaminho.webp`,
			p("Deixada no quadro da Metais do Baixote. O texto está no diário (handout).")),
		tesouro("Mecanismo Necroaberrante (inativo)", `${T20I}/itens/gerais/orbe-cristalina.webp`,
			p("Ovo de metal de uns 30 cm, aberto, com cristais rosados e um núcleo de matéria vermelha. Inativo: só causa desconforto. Junta tudo o que o inimigo usa: magia, ciência e Tormenta.",
				"Lefou, Ofício (engenhoqueiro) ou Misticismo CD 25 reconhecem a matéria vermelha.")),
		tesouro("Ordens de Syvarian para Torgo", `${T20I}/itens/gerais/pergaminho.webp`,
			p("Encontradas no chão do covil. <b>Ao ser lido, começa a corrida contra o relógio da Aventura 5</b> (14 – 2d4 dias até o ataque). O texto está no diário."))
	]);
	const itemPorNome = (inicio) => itensCriados.find((i) => i.name.startsWith(inicio));

	/* ------------------------------------------------------------------ */
	/* 4. Tabela: Encontros nas Colinas Centrais                            */
	/* ------------------------------------------------------------------ */
	const ENCONTROS = [
		["Tolbert", "Bardo que transforma almas em moedas."],
		["Abner", "Adolescente qareen, pastor fanático de Khalmyr. Tudo é \"uma bênção de Khalmyr\"; quer batizar os heróis."],
		["Quimby Ulysses Arronax", "Anão devoto de Hyninn que vende alquimia fajuta: funciona com 1d6 par, efeito reverso com ímpar."],
		["Gormaggor", "Gigante das colinas que conheceu o Herói Louco. Dorme por décadas."],
		["Raguria", "Bruxa caipira: pratos especiais e maldições."],
		["Arlo \"Olho de Leite\"", "Caçador paranoico das armas de pólvora, preparado para quando \"ELES\" chegarem."],
		["Mungo Joe", "Alambiqueiro."],
		["Encontro de Puristas Caipiras", "Patrulha purista."],
		["O Homem-Bode", "Jonid, druida enlutado que perdeu a família."],
		["A Cidade Fantasma de Duas Pedras", "Mina fechada pela Guilda, com fantasmas e um veio de metal arco-íris. Local fixo."],
		["Ebenezer", "Profeta herético de Thyatis que faz apostas."],
		["O Museu de Coisas Quase Vivas", "Museu da taxidermista e criptozoóloga Dona Erneshia. Local fixo."],
		["O Diabo das Colinas", "Aparição amaldiçoada; vale uma perseguição com pote de ouro."],
		["Shanamarie, Shaylyne e Shadolenn", "As sereias. Ficam paradas."],
		["Cletus Rigby", "Anão mago caipira e vingativo, com uma lista de ofensas. Ama Raguria."],
		["Nada Mais que a Verdade Reston", "Devota de Tanna-Toh que não mente. Guarda o pergaminho apagado do \"Evento\"."],
		["O Ladrão de Rabos", "Entidade que distorce desejos."],
		["Elmer", "Dragão mendigo viciado em achbuld. Fica parado."],
		["Fortunata", "Clériga de Nimb."],
		["O Cemitério Errante", "Muda de lugar e guarda o luto de Tilliann (10 unidades de metal arco-íris). Uma noite ali impede recuperar PM e dá +1 num atributo por uma semana; a segunda noite torna o bônus permanente."]
	];
	const tabela = await RollTable.create({
		name: "Encontros nas Colinas Centrais",
		img: "icons/svg/village.svg",
		folder: pasta.RollTable,
		flags: FLAGS(),
		formula: "1d20",
		replacement: true,
		displayRoll: true,
		description: "Role ao sair do Forte, ou uma vez por dia de viagem. Personagens podem se repetir; locais, uma vez achados, ficam no mapa. Detalhes de cada um no livro (p. 32).",
		results: ENCONTROS.map(([name, description], i) => ({ type: "text", range: [i + 1, i + 1], weight: 1, name, description }))
	});

	/* ------------------------------------------------------------------ */
	/* 5. Macros de mesa                                                    */
	/* ------------------------------------------------------------------ */

	async function macroExaminar() {
		const atores = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		if (!atores.length) return ui.notifications.warn("Selecione os tokens de quem examina Malakias.");
		const TESTES = {
			conh: { nome: "Conhecimento", cd: 10, ok: "Malakias cita acontecimentos que não poderia ter presenciado: fala de outra época." },
			cura: { nome: "Cura", cd: 25, ok: "Ele não parece vivo: não respira de verdade, não tem batimentos, não dorme, não sua, não come nem bebe." },
			intu: { nome: "Intuição", cd: 20, ok: "Não parece maligno, mas não age como quem perdeu a família. Algo nele sabe que não há motivo para se preocupar." },
			mist: { nome: "Misticismo", cd: 25, ok: "Aura necromântica: Malakias é um morto-vivo.", ok2: [35, "É uma criatura da Tormenta."] }
		};
		const opcoes = Object.entries(TESTES).map(([k, t]) => `<option value="${k}">${t.nome} (CD ${t.cd})</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Examinar Malakias" },
			content: `<div class="form-group"><label>Teste</label><select name="pericia">${opcoes}</select></div>
				<p style="font-size:0.85em">Ele precisa deixar: estudar o corpo dele exige lábia, mas incluído no processo ele até se diverte.</p>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const t = TESTES[res.pericia];
		const rolls = [];
		let melhor = -99;
		let html = `<h3>Examinar Malakias · ${t.nome}</h3><ul>`;
		for (const a of atores) {
			const r = await new Roll(`1d20 + ${a.system.pericias?.[res.pericia]?.value ?? 0}`).evaluate();
			rolls.push(r);
			melhor = Math.max(melhor, r.total);
			html += `<li>${a.name}: <b>${r.total}</b> ${r.total >= t.cd ? "✔️" : "❌"}</li>`;
		}
		html += "</ul>";
		if (melhor >= t.cd) {
			html += `<p>${t.ok}</p>`;
			if (t.ok2 && melhor >= t.ok2[0]) html += `<p><b>${t.ok2[0]} ou mais:</b> ${t.ok2[1]}</p>`;
		} else html += "<p>Nada de estranho... além do falatório sem fim.</p>";
		ChatMessage.create({ content: html, rolls, whisper: ChatMessage.getWhisperRecipients("GM") });
	}

	async function macroRastro() {
		const atores = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		const CHAVE = "fdtRastro";
		const estado = game.user.getFlag("world", CHAVE) ?? { sucessos: 0, falhas: 0 };
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Rastro dos Mortos" },
			content: `
				<p>Sobrevivência CD 20, teste estendido: <b>5 sucessos</b>. Progresso: ${estado.sucessos} sucessos, ${estado.falhas} falhas.</p>
				<div class="form-group"><label>O que aconteceu</label><select name="acao">
					<option value="rolar">Rolar Sobrevivência (tokens selecionados)</option>
					<option value="interpretacao">Boa interpretação com um NPC (conta um sucesso)</option>
					<option value="converter">Interpretação + sucesso social (vira uma falha em sucesso)</option>
					<option value="zerar">Zerar o progresso</option></select></div>
				<div class="form-group"><label>Modificador extra</label><input type="number" name="mod" value="0"></div>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "zerar") return game.user.unsetFlag("world", CHAVE);
		const rolls = [];
		let html = "<h3>Rastro dos Mortos</h3>";
		if (res.acao === "rolar") {
			if (!atores.length) return ui.notifications.warn("Selecione quem segue o rastro.");
			html += "<ul>";
			for (const a of atores) {
				const r = await new Roll(`1d20 + ${a.system.pericias?.sobr?.value ?? 0} + ${Number(res.mod) || 0}`).evaluate();
				rolls.push(r);
				const ok = r.total >= 20;
				if (ok) estado.sucessos++; else estado.falhas++;
				html += `<li>${a.name}: <b>${r.total}</b> ${ok ? "✔️" : "❌"}</li>`;
			}
			html += "</ul>";
		} else if (res.acao === "interpretacao") {
			estado.sucessos++;
			html += "<p>Um morador do caminho viu os mortos passarem: conta como um sucesso.</p>";
		} else if (estado.falhas > 0) {
			estado.falhas--;
			estado.sucessos++;
			html += "<p>A conversa rendeu: uma falha vira sucesso.</p>";
		}
		html += `<p>Progresso: <b>${estado.sucessos}/5</b> sucessos (${estado.falhas} falha(s)).</p>`;
		if (estado.sucessos >= 5) {
			html += "<p><b>O covil!</b> Uma abertura pequena leva a uma caverna ampla e corredores largos demais para serem naturais.</p>";
			await game.user.unsetFlag("world", CHAVE);
		} else {
			html += "<p style=\"font-size:0.85em\">O livro não dá limite de falhas: cada falha custa tempo. Role na tabela de encontros pelo caminho.</p>";
			await game.user.setFlag("world", CHAVE, estado);
		}
		ChatMessage.create({ content: html, rolls });
	}

	const macro = (name, img, fn) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Aventura 4.5 · gerado por av45-plano-5.js\n(${fn.toString()})();`
	});
	const macros = await Macro.createDocuments([
		macro("Av4.5 · Examinar Malakias", "icons/svg/eye.svg", macroExaminar),
		macro("Av4.5 · Rastro dos Mortos", "icons/svg/target.svg", macroRastro)
	]);
	const linkMacro = (trecho) => {
		const m = macros.find((x) => x.name.includes(trecho));
		return m ? `@UUID[${m.uuid}]{${m.name}}` : trecho;
	};

	/* ------------------------------------------------------------------ */
	/* 6. Diário da aventura                                                */
	/* ------------------------------------------------------------------ */
	const L = (d) => (d?.uuid ? `@UUID[${d.uuid}]{${d.name}}` : "");
	const pagina = (name, content, sort) => ({ name, type: "text", sort, text: { content, format: 1 } });

	await JournalEntry.create({
		name: "Aventura 4.5 · Plano 5 das Colinas Centrais",
		folder: pasta.JournalEntry,
		flags: FLAGS(),
		pages: [
			pagina("Guia do Mestre", `
				<h2>Resumo</h2>
				<p>Mini aventura opcional, sem pressa, para o grupo respirar e fechar pontas soltas antes do fim do arco. ${L(atores.malakias)} pede ajuda para achar a família que "sumiu". Na verdade ele morreu há 75 anos e foi erguido por um Mecanismo Necroaberrante que Torgo enterrou no cemitério de Ponta de Pedra. A família continua morta, menos ${L(atores.myrianthe)}, que seguiu os zumbis até um covil de Syvarian. Lá estão as ordens do ataque ao Forte: <b>ler o pergaminho começa a Aventura 5</b>.</p>
				<p>Pode acabar em minutos (cemitério, lápides, contar a Malakias) ou num curto combate. Tudo depende da curiosidade do grupo.</p>
				<h2>Fases</h2>
				<ol>
					<li><b>Normalidade:</b> a ${L(itemPorNome("Carta"))} surge no quadro da Metais do Baixote. Nadine e Tarik comentam o velho sem pressa.</li>
					<li><b>Encontro nas Centrais:</b> role uma vez em ${L(tabela)} no caminho. Lembre que Malakias não tem pressa: dá para fazer turismo.</li>
					<li><b>Velho Ranzinza:</b> a casa da colina torta, abandonada há décadas.</li>
					<li><b>Investigação:</b> Ponta de Pedra, NPCs estudiosos, testes no velho, cemitério, ${L(itemPorNome("Mecanismo"))}, rastro.</li>
					<li><b>O covil dos mortos</b> e a cabeça de Myrianthe.</li>
					<li><b>Reencontro</b> (conclusão A ou B) e as ${L(itemPorNome("Ordens"))}.</li>
				</ol>
				<h2>Fichas</h2>
				<ul>
					<li>${L(atores.malakias)} e ${L(atores.myrianthe)} (para a parte social).</li>
					<li>Conclusão B: ${L(atores.malakiasCorrompido)} e ${L(atores.myrantheCorrompida)}.</li>
					<li>${L(atores.zumbi)} (os dois deixados no covil).</li>
					<li>Pistas e CDs: ${L(atores.misterio)}.</li>
				</ul>
				<h2>Macros</h2>
				<ul>
					<li>${linkMacro("Examinar")}: rola Conhecimento, Cura, Intuição ou Misticismo e sussurra ao Mestre o que se descobre.</li>
					<li>${linkMacro("Rastro")}: o teste estendido de Sobrevivência até o covil, contando a interpretação com NPCs.</li>
				</ul>`, 100),
			pagina("Handout · Carta de Malakias", `
				<blockquote><p><i>"Minha família sumiu! Todo mundo hoje em dia fala que tem bandidos aqui nas Colinas Centrais. Bandido sempre teve, mas pelo menos eram os nossos bandidos! Agora tem bandido de fora vindo pra cá? Onde já se viu? Não sei se os bandidos é que sumiram com a minha família, mas de qualquer forma ela sumiu. E o pessoal de Ponta de Pedra não ajuda em nada! No meu tempo os vizinhos se ajudavam! Agora parece que é cada um por si, não é? As pessoas não se ajudam, não querem saber umas das outras, é por isso que o mundo está desse jeito! A gente tenta ser solidário, mas agora precisa ser solidário sozinho, enquanto todo mundo está só preocupado consigo mesmo? Ah, não! Eles vão ver!"</i></p>
				<p>(O papel está acabando, a letra vai ficando menor e mais espremida.)</p>
				<p><i>"Enfim, a minha família sumiu. Venham ajudar."</i></p>
				<p><i>"Malakias Andronicus, casa da colina torta, a oeste de Ponta de Pedra, vocês não têm como errar, é só seguir o caminho da Mata Seca..."</i></p>
				<p>(O papel acaba.)</p></blockquote>
				<h3>O que dizem no Forte</h3>
				<p><b>Nadine:</b> <i>"Eu conheço muita gente por aqui, principalmente nas aldeias vizinhas, e nunca ouvi falar desse sujeito! (...) Bem, mas o velho não pareceu ameaça nenhuma, então..."</i></p>
				<p><b>Tarik:</b> <i>"(...) Queria ajuda, mas também ficou sentado tagarelando, sem pressa nenhuma. Pareceu se importar com a família, mas não havia urgência em seu comportamento. Enfim, é um humano diferente."</i></p>`, 200),
			pagina("O Que Aconteceu de Verdade", `
				<p>Malakias Andronicus morreu em <b>1345</b>, 75 anos atrás. Era casado com <b>Myrianthe</b> e teve os filhos <b>Ezekias</b> e <b>Mennonias</b>, a nora <b>Tankreda</b> e os netos <b>Lykurgos</b> e <b>Berta</b>.</p>
				<ul>
					<li>Myrianthe morreu de causas naturais alguns anos depois.</li>
					<li>Ezekias, Tankreda e Lykurgos morreram de peste.</li>
					<li>Mennonias foi embora com Berta, hoje uma senhora idosa em algum lugar fora das Centrais.</li>
					<li>Todos foram enterrados no cemitério de Ponta de Pedra.</li>
				</ul>
				<p>Torgo, sob ordens de Syvarian, enterra <b>Mecanismos Necroaberrantes</b> nos cemitérios das Centrais: motores do Dr. Vesper que espalham energia negativa e corrupção da Tormenta, criando "carne" de matéria vermelha em volta dos ossos. Uma falha trouxe o espírito de Malakias junto: ele é um morto-vivo inteligente e confuso, que nunca viu as lápides.</p>
				<p>A colina do casal fica sobre um rico <b>veio de metal arco-íris</b>. Parte da divindade de Tilliann impregnou os espíritos deles, por isso a Tormenta não os tomou como aos outros.</p>
				<h3>Pistas extras</h3>
				<ul>
					<li><b>Ponta de Pedra:</b> ninguém conhece Malakias. Com o grupo persuasivo (ou que já ajudou a aldeia), a velha <b>Vladimina</b> lembra vagamente de um velhinho chamado Malakias na infância dela. Outros nomes: Vyrmille, Clarence, Geraldine, Bort, Jannistra, Frellen.</li>
					<li><b>NPCs estudiosos</b> (Nada Mais que a Verdade, Edwina, Tanna-Toh) percebem que ele está deslocado no tempo, cada um com sua teoria.</li>
					<li><b>Irevash</b>, o fofoqueiro: "não se mete na vida dos outros" e já começa a contar segredos. Útil para passar qualquer pista que faltar.</li>
				</ul>`, 300),
			pagina("Eu Vejo NPCs Mortos", `
				<p>Como Malakias reage à verdade depende de como o grupo conta:</p>
				<ul>
					<li><b>Hostilidade</b> (inclusive clérigos e paladinos tentando afastá-lo ou libertá-lo): medo, tenta se proteger e, se não der, a fúria revela a Tormenta (use ${L(atores.malakiasCorrompido)}).</li>
					<li><b>Paciência e sensibilidade:</b> fica pasmo e aos poucos aceita. Pergunta o que fazer. Talvez possa viver nas Centrais como um osteon, na casa antiga.</li>
					<li><b>Estudar o corpo dele:</b> medo e desconfiança, mas incluído no processo até se diverte. Pode abrir o próprio tórax para ver o que tem dentro (e ter uma bela surpresa lefeu).</li>
					<li><b>Tom trágico:</b> chocado, esquece tudo antes da morte e passa a tratar o grupo como a família dele. Contrariado nesse estado, a fúria revela a Tormenta.</li>
				</ul>
				<h3>Contingência: o grupo não acha o covil</h3>
				<p>Malakias quer saber por que virou morto-vivo e pede para acharem Myrianthe. NPCs comentam mortos andando pelas Colinas. Ponta de Pedra contrata o grupo para descobrir quem remexeu o cemitério. Um NPC curioso sugere investigar o Mecanismo. Se mesmo assim o grupo ignorar, não force: os habitantes serão atacados sem aviso e a defesa do Forte ficará bem mais difícil.</p>`, 400),
			pagina("O Covil e Myrianthe", `
				<p>Uma abertura pequena, uma caverna ampla e corredores largos: espaço de masmorra criado pelo Templo do Vácuo, usado por Syvarian como base (ele considera o Templo sagrado demais para criminosos). Sinais de acampamento, anotações dos bandidos e as ordens para Torgo. Três mortos-vivos ficaram: dois defeituosos e a cabeça de Myrianthe.</p>
				<blockquote><p><i>"Parece que alguém achou esta caverna... Ah, vocês não são bandidos. Pelo menos não vou ficar falando sozinha pela eternidade."</i></p></blockquote>
				<h3>Perguntas e respostas</h3>
				<p><b>Quem é você?</b> <i>"Meu nome é Myrianthe. Myrianthe Andronicus. Meu marido tinha muito orgulho de ter um sobrenome, sempre fazia questão de mencioná-lo para todos. Não parava de falar, mas eu gostava de ouvi-lo."</i></p>
				<p><b>O que aconteceu aqui?</b> <i>"Exatamente o que parece. Eu morri. (...) acordei com frio, no meio da terra. (...) Havia dezenas de outros mortos se erguendo, mas nenhum como eu. (...) Uma espécie de homem enorme de armadura nos mandou segui-lo. (...) Vários dos outros mortos-vivos ficaram cada vez mais horrendos. Sua carne apodrecia. E eu... Não."</i></p>
				<p><b>Outro?</b> <i>"O homem de armadura obedecia a alguém. Um tipo pomposo, parecia um militar. (...) Ele avaliou os mortos e decidiu que eu não servia. Quando estava frente a frente com ele, comecei a fazer perguntas. Ele ficou indignado, usou uma serra e cortou minha cabeça."</i></p>
				<p><b>Os nomes?</b> <i>"O homem de armadura é Torgo. Seu chefe é Syvarian."</i></p>
				<p><b>Como é Syvarian?</b> Muito alto e muito magro, parece frágil mas é forte e rápido. Armadura de bronze com pedaços de tecido grosso, elmo redondo e enorme. E na testa <i>"um redondo, uma coisa de vidro com uns palitinhos que às vezes se mexiam"</i> (ela nunca viu um relógio; mostrando um, ela reconhece).</p>
				<p><b>O que mais?</b> Maligno e violento, fala o tempo todo na "missão". Promete uma recompensa a Torgo. Diz que Torgo não pode decepcionar a <i>"tropalução... trapulissem... tripulação!"</i></p>
				<p><b>É humano?</b> <i>"É sim! Mas nunca vi um humano tão alto e tão magro."</i> Sotaque esquisito. (É um kliren. Mostrando a imagem de um kliren, ou Zardu, ela diz que é muito parecido; Zardu é um pouco mais jovem.)</p>
				<p><b>O que eles querem?</b> <i>"Eles estavam falando de juntar um monte de mortos-vivos e atacar todas as Colinas Centrais! Disseram que é a hora, que não podem esperar mais! Falaram de uns aventureiros que estavam atrapalhando tudo..."</i></p>
				<p><b>Por que você é diferente?</b> Não sabe. Os outros foram ficando mais burros; ela não. Parecia que estavam fazendo testes, e ficaram satisfeitos.</p>
				<p><b>E seu marido?</b> <i>"Malakias? Coitado, morreu quase dez anos antes de mim! (...) graças a Lena ele continuou morto!"</i></p>`, 500),
			pagina("Reencontro", `
				<p>Contando sobre Malakias, Myrianthe fica muito triste. Reunindo os dois, escolha:</p>
				<h3>Conclusão A: O Amor Tudo Vence (recomendada pelo autor)</h3>
				<p>O "erro" é permanente: os dois são mortos-vivos inteligentes para sempre. Ficam felizes e entram na rotina de quem convive há décadas. Myrianthe explica tudo a Malakias de novo e de novo. Combina com o tema de reunir aliados contra Syvarian.</p>
				<h3>Conclusão B: Escatologia &amp; Sadismo</h3>
				<p>Um momento de felicidade, e então algo se quebra em Malakias: patas e antenas brotam da boca, ouvidos e olhos, o corpo se rompe em carapaça. Myrianthe grita e também eclode, com patas no pescoço e quelíceras na boca. Curto combate contra ${L(atores.malakiasCorrompido)} e ${L(atores.myrantheCorrompida)}. Boa para grupos que querem o lado trágico da Tormenta e uma razão para vingança.</p>`, 600),
			pagina("Handout · Ordens de Syvarian para Torgo", `
				<blockquote><p><i>"Nossas táticas fracassaram. O tal grupo de aventureiros frustrou cada uma de nossas tentativas. Eles não sabem o que estão fazendo, não entendem o mal que provocam. Chega de subterfúgios, é hora de sangue. Construímos os Mecanismos Necroaberrantes para isso. Leve os mortos, espalhe a ordem a todas as bases. Todas as tropas estão convocadas. Passaremos por cada aldeia, cada casebre, cada buraco onde o povo destas Colinas se esconde e vamos matar todos. Convergimos ao alvo principal em duas semanas. Todos juntos, para que não reste ninguém vivo lá dentro. O Forte Cabeça-de-Martelo vai cair.</i></p>
				<p><i>Syvarian"</i></p></blockquote>
				<p class="secret">Ao ser lido, começa a corrida contra o relógio: role 14 – 2d4 dias até o ataque (os heróis só sabem o prazo interrogando um inimigo). Não há mais espaço para vagar livremente: o próximo passo é avisar e recolher os NPCs. Siga para a Aventura 5.</p>`, 700)
		]
	});

	ui.notifications.info("Aventura 4.5 criada: personagens, pistas, tabela de encontros, diário e 2 macros. Veja a pasta \"" + NOME_PASTA + "\".");
})();
