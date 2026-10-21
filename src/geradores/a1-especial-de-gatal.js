/* =====================================================================
 * FIM DOS TEMPOS · ARCO 1 · AVENTURA EXTRA · "ESPECIAL DE GATAL"
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Arco 1 · Especial de Gatal" com:
 *      - Garbin (a Fada Madrinha disfarçada), os seis amigos (deuses disfarçados) e os gnolls
 *        da contingência.
 *      - Os seis presentes dos amigos como itens (Flauta Animalizante, Balança Moral, Alev,
 *        Criadora de Meios, Copo de Ar e Truque na Mágica).
 *      - Tabelas: Matérias-primas para Presentes (1d100) e Garbin Agora Parece...
 *      - Diário com guia, poema de abertura, fases, regras de fabricação e de entrega, os
 *        amigos de verdade, recompensas, contingência e epílogo, mais handouts para os jogadores.
 *      - Macros: Oficina de Gatal (relógio, fabricação, entrega e recompensas), Garbin Muda de
 *        Novo, Perseguição aos Gnolls e Usar Presente de Gatal.
 *   3. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "a1gatal".
 *
 * Feito a partir do código do sistema (master, out/2026); não foi testado num Foundry rodando.
 * Veja o guia a1-especial-de-gatal.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "a1gatal";
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
			window: { title: "O Especial de Gatal: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para o Especial de Gatal.</p>
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
	const NOME_PASTA = "FdT · Arco 1 · Especial de Gatal";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#7a3a3a", flags: FLAGS() })).id;
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
		data.system.detalhes ??= {};
		data.system.detalhes.biography ??= { value: "", public: "" };
		data.system.detalhes.biography.value = `${o.bio ?? ""}<hr>${data.system.detalhes.biography.value ?? ""}`;
		return Actor.create(data);
	};

	/* ------------------------------------------------------------------ */
	/* 2. Dados da aventura (fonte única para atores, macros e diário)      */
	/* ------------------------------------------------------------------ */
	const AMIGOS = {
		halinn: { nome: "Halinn, o Silvestre", deus: "Allihanna", perfil: "Um homem que gosta de viver na floresta, entre os animais. Odeia caçar, mas entende os ciclos da vida natural.", presente: "flauta" },
		yrma: { nome: "Yrma, a Reguladora", deus: "Khalmyr", perfil: "Uma mulher que aprecia ordem e justiça. Quer o bem de todos, mas não a custo das leis.", presente: "balanca" },
		berent: { nome: "Berent, o Umbroso", deus: "Tenebra", perfil: "Um homem esperto que ama a noite, a sedução e os truques. Tem seu lado perigoso, mas é divertido.", presente: "alev" },
		larsen: { nome: "Larsen Pugnaz", deus: "Arsenal", perfil: "Uma pessoa determinada a vencer a todo custo, que aprecia a luta e despreza o derrotismo. Gosta de colecionar objetos.", presente: "criadora" },
		enoa: { nome: "Enoa, a Pelágica", deus: "Oceano", perfil: "Uma mulher fascinada pelos mistérios e seres marinhos. Mantém-se longe de tudo e todos, parecendo sempre em calmaria profunda.", presente: "copo" },
		nan: { nome: "Nan Hierofante", deus: "Wynna", perfil: "Uma pessoa que ama as artes arcanas acima de tudo, muito generosa e exuberante. Imprevisível, em geral é o centro das atenções.", presente: "truque" }
	};
	const OBJETOS = ["Manopla com sete dedos", "Sandália para um gigante", "Flores secas aromáticas", "Jarro cheio de dentes de todas as raças", "Manivela metálica", "Cabeça de boneca", "Balança mal ajustada", "Balde de ouro", "Engrenagens de bronze", "Dois tijolos",
		"Três peças de um quebra-cabeças de madeira", "Alfinete de segurança", "Lâmina de faca", "Papéis coloridos", "Pintura de um goblin", "Conjunto de costelas", "Cordas de alaúde", "Martelo pequeno", "Pavio muito longo", "Frasco de óleo alquímico (base para qualquer produto)",
		"Baú sem tampa", "Corneta amassada", "Títere com cordas", "Lentes de uma luneta", "Botões dourados", "Tesoura sem ponta", "Carga de pólvora", "Monte de gravetos", "Traje cerimonial de Tamu-ra cortado na metade", "Cartola feita de folhas trançadas",
		"Almofada felpuda", "Hélice de brinquedo", "Calças para um centauro", "Viveiro de insetos", "Mangusto empalhado", "Quatro molas", "Apito estridente", "Cachimbo sem fundo", "Duas ferraduras", "Ampulheta intacta, mas sem areia",
		"Tabuleiro de xadrez", "Tambor em miniatura", "Saquinho de pimenta moída", "Frigideira engordurada", "Frasco de tinta roxa", "Incenso malcheiroso", "Fivela com o símbolo de Azgher", "Roda de carroça", "Xícara delicada", "Pente de âmbar com metade dos dentes",
		"Agulha e linha", "Seis pregos", "Giz multicolorido", "Alvo para dardos", "Bolinhas de vidro", "Barra de sabão", "Corrente circular", "Chave decorada", "Cristal prismático", "Olho falso",
		"Pequeno sino", "Bengala espiralada", "Cera de abelha", "Prato de orquestra", "Coleira decorada", "Pistola sem partes funcionais (só cano e coronha)", "Frasco de cola", "Gravata borboleta berrante", "Colar de pérolas obviamente falsas", "Pequeno osso esculpido na forma de um pequeno osso",
		"Pote transparente com um mosquito morto", "Coleção de borboletas (1d12 borboletas)", "Cartaz de \"procurado\" com o retrato e o nome recortados (recompensa T$ 1.000)", "Pipa com estrutura de chumbo", "Cubo de pedra absolutamente perfeito", "Dois monóculos", "Escudo totalmente enferrujado", "Regador furado", "Ábaco barulhento", "Máscara de festa deluxe",
		"Bico de pato pintado de verde", "Haltere extremamente leve", "Bandeira com o desenho de uma montanha", "Pera de porcelana", "Vassoura obra-prima", "Gaiola de pássaros", "Placa onde se lê \"proibido usar perícias\"", "Baralho com 52 ases", "Dado de 6 faces, numeradas 23, 0, 814, 9, 5.309 e 6", "Parafuso de borracha",
		"Ânfora cheia de melado", "Espelho que distorce a imagem", "Lampião feito de açúcar", "Pele de urso", "Régua com marcações aleatórias", "Pó de meteoro", "Torneira emperrada", "Colher dupla", "Nabos em conserva", "Pá de pelúcia"];
	// Garbin muda de raça a cada olhar. Os quatro primeiros são do livro, na ordem; os outros o livro sugere "forçar a barra".
	const GARBIN = [
		["humano", "um humano idoso, baixinho e gorducho, de barba branca e avental de couro"],
		["hynne", "um hynne, sem dúvida: os pés descalços e peludos aparecem por baixo do avental"],
		["anao", "claramente um anão, com a barba trançada e um orgulho enorme do próprio martelo"],
		["elfo", "um elfo muito baixinho, de orelhas pontudas escondidas no gorro"],
		["silfide", "uma sílfide! As asinhas tremulam enquanto ela ajeita um laço de fita"],
		["minotauro", "um minotauro bonachão, com o gorro enfiado entre os chifres"],
		["sereia", "uma sereia, de cauda e tudo, sentada num balde, dando instruções"],
		["goblin", "um goblin velhinho e risonho, remendando a própria barba"],
		["kliren", "um kliren de óculos grossos, que corrige a sua técnica de embrulho"],
		["qareen", "um qareen de olhos brilhantes, que garante que não pode realizar desejos (hoje)"],
		["dahllan", "uma dahllan de cabelos de folha, com flores brotando no gorro"],
		["minotauro", "de novo um minotauro... ou era uma minotaura? Garbin ri e diz que tanto faz"]
	];

	/* ------------------------------------------------------------------ */
	/* 3. Atores                                                            */
	/* ------------------------------------------------------------------ */
	const atores = {};
	atores.garbin = await criarNPC({
		name: "Garbin, o Mascate (Fada Madrinha)",
		tokenName: "Garbin",
		role: "garbin",
		link: true,
		disposition: 1,
		img: `${T20I}/racas/humano.webp`,
		nd: "1/4",
		cd: 10,
		tipo: "esp",
		papel: "special",
		atr: { for: -1, des: 0, con: 0, int: 2, sab: 3, car: 4 },
		pv: 0,
		def: 10,
		walk: 6,
		bio: p("Dono da oficina, artesão e comerciante que fabrica os presentes de Gatal dos viajantes. Encontrado no chão, quase morto (com zero pontos de vida), depois que um bando de gnolls quebrou tudo.",
			"Parece um humano idoso, baixinho e gorducho... depois um hynne, depois claramente um anão, depois um elfo muito baixinho. Force a barra cada vez mais (sílfide, minotauro, sereia...), variando gênero e descrição, mas sempre um artesão inofensivo, prestativo, bem-intencionado e meio atrapalhado. Use a macro <i>Gatal · Garbin Muda de Novo</i>: ela troca a imagem do token também.",
			"<b>Verdade:</b> Garbin é a <b>Fada Madrinha</b>, uma entidade sem raça, gênero ou idade, que só existe para distribuir presentes, fomentar a amizade e promover o espírito gatalino. Mesmo com poções e magias de cura, \"não vai ter forças para ajudar\".",
			"Ficha só para ter um token. Ele não luta.")
	});
	await atores.garbin.update({ "system.attributes.pv.max": 20 }); // PV máximos inferidos; ele começa com 0
	atores.gnoll = await clonarAmeaca("b1832Q9gYDlDpSbF", "Gnoll Arruaceiro de Gatal", {
		role: "gnoll",
		bio: p("Os gnolls que destruíram a oficina e espancaram Garbin. A neve já apagou as pegadas e eles estão muito longe: a aventura não é sobre eles. Só servem para a contingência <b>Sem Espírito Gatalino</b> (uma perseguição em que o grupo nunca os alcança).")
	});
	for (const [k, a] of Object.entries(AMIGOS)) {
		atores[k] = await criarNPC({
			name: a.nome,
			tokenName: a.nome.split(",")[0],
			role: `amigo_${k}`,
			link: true,
			disposition: 1,
			img: "icons/svg/mystery-man.svg",
			nd: 20,
			cd: 40,
			tipo: "esp",
			papel: "special",
			atr: { for: 5, des: 5, con: 5, int: 5, sab: 5, car: 5 },
			pv: 999,
			def: 50,
			bio: p(`<b>O que Garbin sabe:</b> ${a.perfil}`,
				`<b>Verdade:</b> é <b>${a.deus}</b> disfarçada(o). Interprete como um mortal extremamente excêntrico, sem raça definida, com roupas, maneirismos e postura muito parecidos com a representação normal da divindade, mas não idênticos.`,
				"Chega à meia-noite em ponto, junto com os outros cinco. Ficha só para ter um token: não é para lutar.")
		});
	}

	/* ------------------------------------------------------------------ */
	/* 4. Itens: os presentes dos amigos                                    */
	/* ------------------------------------------------------------------ */
	const itemDoc = (d) => ({ ...d, folder: pasta.Item, flags: d.flags ?? FLAGS() });
	const consumivel = (role, name, img, html, usos) => itemDoc({
		name, type: "consumivel", img, flags: FLAGS(role),
		system: { description: { value: html }, qtd: usos, preco: 0, peso: 0, espacos: 0.5, tipo: "", subtipo: "" }
	});
	const PRESENTES = {
		flauta: consumivel("presente_flauta", "Flauta Animalizante", `${T20I}/itens/gerais/flauta-mistica.webp`,
			p("<b>Presente de Halinn.</b> Uma flauta que faz uma criatura qualquer passar a se comportar, em termos de regras, como do tipo <b>animal</b> durante uma cena. Por exemplo, um lefeu fica vulnerável a habilidades contra animais.",
				"Não funciona contra criaturas com ND maior que o nível de quem toca. <b>Um uso.</b>"), 1),
		balanca: consumivel("presente_balanca", "Balança Moral", `${T20I}/magias/circulo-da-justica.webp`,
			p("<b>Presente de Yrma.</b> Uma pequena balança que, quando consultada, mostra o rumo mais bondoso e justo numa decisão: o que mais beneficia o bem comum e menos causa dano. Essencialmente, um juiz moral infalível. <b>Um uso.</b>"), 1),
		alev: consumivel("presente_alev", "Alev, a Vela de Escuridão", `${T20I}/magias/escuridao.webp`,
			p("<b>Presente de Berent.</b> Uma vela que causa escuridão em vez de luz. <b>Cinco usos</b>, cada um dura no máximo uma hora (a quantidade conta os usos)."), 5),
		copo: consumivel("presente_copo", "Copo de Ar", `${T20I}/magias/controlar-agua.webp`,
			p("<b>Presente de Enoa.</b> Literalmente um copo de ar. Quem \"bebe\" dele pode respirar sob a água. <b>Cinco usos</b>, cada um dura no máximo uma hora (a quantidade conta os usos)."), 5),
		truque: consumivel("presente_truque", "Truque na Mágica", `${T20I}/magias/criar-ilusao.webp`,
			p("<b>Presente de Nan.</b> Um papel dobrado com um \"truque divertido para enganar seus amigos\". Permite que um conjurador arcano \"modifique\" uma magia arcana para que ela seja de outra escola: aprender uma magia que normalmente não poderia, receber uma magia adicional pela sua escola, somar bônus de uma escola na magia etc. <b>Um uso.</b>"), 1),
		criadora: itemDoc({
			name: "Criadora de Meios",
			type: "arma",
			img: `${T20I}/itens/equipamentos/alabarda.webp`,
			flags: { world: { fdt: TAG, fdtRole: "presente_criadora", fdtUsos: 3 } },
			system: {
				description: { value: p("<b>Presente de Larsen.</b> Uma alabarda que permite <b>rolar de novo três testes</b>. Cada uso faz uma parte dela se desintegrar: o martelo, a ponta de lança, o machado.",
					"Use a macro <i>Gatal · Usar Presente de Gatal</i> com o token do portador selecionado: ela conta as rerrolagens e desfaz a arma no fim.") },
				equipado: 0, qtd: 1, peso: 6, espacos: 2, preco: 0,
				criticoM: 20, criticoX: 3, alcance: "", proficiencia: "marcial", proposito: "corpo-a-corpo", empunhadura: "duas",
				propriedades: { alongada: true, alo: true, duasMaos: true },
				rolls: [
					{ name: "Ataque", key: "ataque0", type: "ataque", parts: [["1d20", "", ""], ["luta", "", ""], ["0", "", ""]], versatil: "", adaptavel: "" },
					{ name: "Dano", key: "dano1", type: "dano", parts: [["1d10", "corte", ""], ["@for", "", ""]], versatil: "", adaptavel: "" }
				]
			}
		})
	};
	const itensCriados = await Item.createDocuments(Object.values(PRESENTES));
	const itemPorRole = (r) => itensCriados.find((i) => i.getFlag("world", "fdtRole") === r);

	/* ------------------------------------------------------------------ */
	/* 5. Tabelas                                                           */
	/* ------------------------------------------------------------------ */
	const tabelaObjetos = await RollTable.create({
		name: "Matérias-primas para Presentes",
		img: "icons/svg/item-bag.svg",
		folder: pasta.RollTable,
		flags: FLAGS("objetosGatal"),
		formula: "1d100",
		replacement: true,
		displayRoll: true,
		description: "Tudo o que sobrou inteiro na oficina de Garbin. Só estes objetos podem virar presentes (os amigos reconhecem materiais de fora). Cada presente usa no mínimo três.",
		results: OBJETOS.map((name, i) => ({ type: "text", range: [i + 1, i + 1], weight: 1, name: `${i + 1}. ${name}`, description: "" }))
	});
	const tabelaGarbin = await RollTable.create({
		name: "Garbin Agora Parece...",
		img: `${T20I}/racas/hynne.webp`,
		folder: pasta.RollTable,
		flags: FLAGS("garbinGatal"),
		formula: `1d${GARBIN.length}`,
		replacement: true,
		displayRoll: true,
		description: "A cada olhar, Garbin é de outra raça. A macro Garbin Muda de Novo segue a ordem do livro; esta tabela é para sortear.",
		results: GARBIN.map(([, txt], i) => ({ type: "text", range: [i + 1, i + 1], weight: 1, name: txt, description: "" }))
	});

	/* ------------------------------------------------------------------ */
	/* 6. Macros                                                            */
	/* ------------------------------------------------------------------ */
	async function macroOficina(D) {
		const ESTADO = "fdtGatal";
		const est = foundry.utils.deepClone(game.user.getFlag("world", ESTADO) ?? {});
		est.horas ??= {};
		est.usados ??= [];
		est.quebrados ??= [];
		est.presentes ??= {};
		const hora = () => 19 + Math.max(0, ...Object.values(est.horas));
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		const opAmigo = Object.entries(D.amigos).map(([k, a]) => {
			const pr = est.presentes[k];
			const st = pr?.entregue ? (pr.agradou ? " · agradado" : " · entregue") : pr?.valor ? ` · pronto (${pr.valor})` : pr?.falhas ? ` · ${pr.falhas} falha(s)` : "";
			return `<option value="${k}">${a.nome}${st}</option>`;
		}).join("");
		const opPer = Object.entries(D.pericias).map(([k, n]) => `<option value="${k}">${n}</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Oficina de Gatal" },
			position: { width: 520 },
			content: `
				<p>São <b>${hora() >= 24 ? "meia-noite" : `${hora()}h`}</b> (faltam ${Math.max(0, 24 - hora())}h no relógio de quem mais trabalhou). Objetos usados: ${est.usados.length}; quebrados: ${est.quebrados.length}.</p>
				<div class="form-group"><label>Ação</label><select name="acao">
					<option value="fabricar">Fabricar um presente (artesão = 1º token selecionado; os outros ajudam)</option>
					<option value="entregar">Entregar um presente (quem entrega = 1º token; os outros ajudam)</option>
					<option value="inspiracao">Inspiração: sortear 3 objetos ainda disponíveis</option>
					<option value="lista">Listar objetos disponíveis (para o Mestre)</option>
					<option value="relogio">Ver o relógio e o estado dos presentes</option>
					<option value="zerar">Recomeçar a noite (zerar tudo)</option></select></div>
				<div class="form-group"><label>Amigo</label><select name="amigo">${opAmigo}</select></div>
				<div class="form-group"><label>Objetos (números da lista, ex.: 3, 17, 45)</label><input type="text" name="objetos" value=""></div>
				<div class="form-group"><label>Perícia</label><select name="per">${opPer}</select></div>
				<div class="form-group"><label>Horas extras de ajuda (por ajudante)</label><input type="number" name="horasAjuda" value="0" min="0"></div>
				<div class="form-group"><label>Horas extras do artesão (ajuda a si mesmo)</label><input type="number" name="horasSi" value="0" min="0"></div>
				<div class="form-group"><label>Entrega: o presente combina com o amigo (+5)</label><input type="checkbox" name="combina"></div>
				<div class="form-group"><label>Entrega: muito espírito gatalino (+5)</label><input type="checkbox" name="espirito"></div>
				<div class="form-group"><label>Entrega: preparo especial, embrulho, meia, festa (+5)</label><input type="checkbox" name="embrulho"></div>
				<div class="form-group"><label>Outro bônus (magias, habilidades)</label><input type="number" name="mod" value="0"></div>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		const whisper = ChatMessage.getWhisperRecipients("GM");
		const bonus = (a, k) => {
			if (k === "ofic") return Math.max(0, ...Object.entries(a.system.pericias ?? {}).filter(([kk]) => kk.startsWith("ofi")).map(([, v]) => Number(v?.value) || 0));
			return Number(a.system.pericias?.[k]?.value) || 0;
		};
		const ajuda = async (a, k) => {
			const r = await new Roll(`1d20 + ${bonus(a, k)}`).evaluate();
			rolls.push(r);
			const b = r.total >= 10 ? 1 + Math.floor((r.total - 10) / 10) : 0;
			return { total: r.total, b };
		};
		const disponiveis = () => D.objetos.map((o, i) => i + 1).filter((n) => !est.usados.includes(n) && !est.quebrados.includes(n));
		const amigo = D.amigos[res.amigo];
		let html = "";
		if (res.acao === "zerar") { await game.user.unsetFlag("world", ESTADO); return ui.notifications.info("A noite de Gatal recomeçou: 19h, oficina cheia de objetos."); }
		if (res.acao === "lista") {
			html = `<h3>Objetos disponíveis (${disponiveis().length})</h3><p style="font-size:0.85em">${disponiveis().map((n) => `${n}. ${D.objetos[n - 1]}`).join(" · ")}</p>`;
			return ChatMessage.create({ content: html, whisper });
		}
		if (res.acao === "inspiracao") {
			const d = disponiveis();
			const sorteio = [];
			while (sorteio.length < 3 && sorteio.length < d.length) {
				const r = await new Roll(`1d${d.length}`).evaluate();
				const n = d[r.total - 1];
				if (!sorteio.includes(n)) sorteio.push(n);
			}
			return ChatMessage.create({ content: `<h3>Inspiração gatalina</h3><p>No meio da bagunça, alguém tropeça em:</p><ul>${sorteio.map((n) => `<li>${n}. ${D.objetos[n - 1]}</li>`).join("")}</ul>` });
		}
		if (res.acao === "relogio") {
			html = `<h3>Oficina de Garbin · ${hora() >= 24 ? "meia-noite!" : `${hora()}h`}</h3><ul>${Object.entries(est.horas).map(([n, h]) => `<li>${n}: ${h}h trabalhadas</li>`).join("") || "<li>Ninguém trabalhou ainda.</li>"}</ul><ul>`;
			for (const [k, a] of Object.entries(D.amigos)) {
				const pr = est.presentes[k];
				html += `<li><b>${a.nome}</b>: ${pr?.valor ? `pronto (fabricação ${pr.valor}, objetos ${pr.objetos.join(", ")})` : "ainda sem presente"}${pr?.entregue ? (pr.agradou ? " · ✔️ agradou" : " · entregue, não agradou") : ""}</li>`;
			}
			return ChatMessage.create({ content: html + "</ul>", whisper });
		}
		const a = tokens[0]?.actor;
		if (!a) return ui.notifications.warn("Selecione o token de quem faz o teste (e os de quem ajuda).");
		const ajudantes = tokens.slice(1).map((t) => t.actor);
		const pr = (est.presentes[res.amigo] ??= { objetos: [], falhas: 0, valor: null, entregue: false, agradou: null });

		if (res.acao === "fabricar") {
			if (pr.valor) return ui.notifications.warn(`O presente de ${amigo.nome} já está pronto (${pr.valor}).`);
			const nums = [...new Set(String(res.objetos).split(/[^0-9]+/).filter(Boolean).map(Number))];
			const invalidos = nums.filter((n) => n < 1 || n > 100);
			const indisponiveis = nums.filter((n) => est.usados.includes(n) || est.quebrados.includes(n));
			if (invalidos.length || indisponiveis.length) return ui.notifications.warn(`Objetos inválidos ou já usados/quebrados: ${[...invalidos, ...indisponiveis].join(", ")}.`);
			if (nums.length < 3) return ui.notifications.warn("Cada presente precisa de no mínimo três objetos (senão parece achado no lixo).");
			const extras = nums.length - 3;
			const cd = 25 + 2 * extras;
			const tempo = 1 + extras;
			const horasSi = Math.max(0, Number(res.horasSi) || 0);
			const horasAjuda = Math.max(0, Number(res.horasAjuda) || 0);
			const sobra = 5 - (est.horas[a.name] ?? 0);
			if (tempo + horasSi > sobra) return ui.notifications.warn(`${a.name} só tem ${Math.max(0, sobra)}h até a meia-noite; este presente pede ${tempo + horasSi}h.`);
			const semTempo = ajudantes.filter((h) => tempo + horasAjuda > 5 - (est.horas[h.name] ?? 0)).map((h) => h.name);
			let somaAjuda = 0;
			const notas = [];
			for (let i = 0; i < horasSi; i++) { const x = await ajuda(a, res.per); somaAjuda += x.b; notas.push(`${a.name} (hora extra) ${x.total} → +${x.b}`); }
			for (const h of ajudantes) for (let i = 0; i < 1 + horasAjuda; i++) { const x = await ajuda(h, res.per); somaAjuda += x.b; notas.push(`${h.name} ${x.total} → +${x.b}`); }
			const r = await new Roll(`1d20 + ${bonus(a, res.per)} + ${somaAjuda} + ${Number(res.mod) || 0}`).evaluate();
			rolls.push(r);
			est.horas[a.name] = (est.horas[a.name] ?? 0) + tempo + horasSi;
			for (const h of ajudantes) est.horas[h.name] = (est.horas[h.name] ?? 0) + tempo + horasAjuda;
			if (semTempo.length) notas.push(`sem tempo de sobra: ${semTempo.join(", ")} (o Mestre decide se a ajuda vale)`);
			html = `<h3>Fabricando o presente de ${amigo.nome}</h3><p>Objetos: ${nums.map((n) => `${n}. ${D.objetos[n - 1]}`).join("; ")}.</p>
				<p>${D.pericias[res.per]}: <b>${r.total}</b> contra CD ${cd}${somaAjuda ? ` (ajuda +${somaAjuda}: ${notas.join("; ")})` : ""}. Leva ${tempo}h.</p>`;
			if (r.total >= cd) {
				pr.valor = r.total;
				pr.objetos = nums;
				est.usados.push(...nums);
				html += `<p>✔️ <b>Presente pronto!</b> Anotem o valor: <b>${r.total}</b>. Na entrega, cada objeto além do terceiro vale +5.</p>`;
			} else {
				pr.falhas++;
				const falhaPor = cd - r.total;
				if (falhaPor >= 5) { est.quebrados.push(...nums); html += `<p>❌ Falha por ${falhaPor}: <b>todos os objetos se estragam</b>.</p>`; }
				else if (pr.falhas >= 2) {
					const q = await new Roll(`1d${nums.length}`).evaluate();
					const n = nums[q.total - 1];
					est.quebrados.push(n);
					html += `<p>❌ Segunda falha neste presente: <b>${n}. ${D.objetos[n - 1]}</b> se estraga.</p>`;
				} else html += "<p>❌ Não ficou bom, mas nada se estragou. Tentem de novo.</p>";
			}
			if (hora() >= 24) html += "<p><b>Ding, dong... É meia-noite!</b> Batem à porta: os seis amigos chegaram ao mesmo tempo.</p>";
			else html += `<p style="font-size:0.85em">Relógio: ${hora()}h.</p>`;
		}

		if (res.acao === "entregar") {
			if (!pr.valor) return ui.notifications.warn(`Ainda não há presente pronto para ${amigo.nome}.`);
			if (pr.entregue) return ui.notifications.warn(`O presente de ${amigo.nome} já foi entregue.`);
			let somaAjuda = 0;
			const notas = [];
			for (const h of ajudantes) { const x = await ajuda(h, res.per); somaAjuda += x.b; notas.push(`${h.name} ${x.total} → +${x.b}`); }
			const extras = Math.max(0, pr.objetos.length - 3);
			const fixos = 5 * extras + (res.combina ? 5 : 0) + (res.espirito ? 5 : 0) + (res.embrulho ? 5 : 0);
			const r = await new Roll(`1d20 + ${bonus(a, res.per)} + ${fixos} + ${somaAjuda} + ${Number(res.mod) || 0}`).evaluate();
			rolls.push(r);
			const soma = pr.valor + r.total;
			pr.entregue = true;
			pr.agradou = soma >= 80;
			html = `<h3>Feliz Gatal, ${amigo.nome.split(",")[0]}!</h3><p>${a.name} entrega o presente. ${D.pericias[res.per]} <b>${r.total}</b> (bônus +${fixos}${extras ? `, ${extras} objeto(s) extra` : ""}${somaAjuda ? `, ajuda +${somaAjuda}` : ""}). Fabricação ${pr.valor} + entrega ${r.total} = <b>${soma}</b> (precisa de 80).</p>`;
			if (pr.agradou) {
				const chave = D.amigos[res.amigo].presente;
				const modelo = game.items.find((i) => i.getFlag("world", "fdtRole") === `presente_${chave}`);
				if (modelo) {
					const dados = modelo.toObject();
					delete dados._id;
					await a.createEmbeddedDocuments("Item", [dados]);
				}
				html += `<p>✔️ <b>${amigo.nome.split(",")[0]} adorou!</b> E retribui com um presente: <b>${D.nomesPresentes[chave]}</b> (já na ficha de ${a.name}).</p>`;
			} else html += `<p>❌ ${amigo.nome.split(",")[0]} agradece com educação, mas não parece tocado pelo espírito gatalino.</p>`;
			await ChatMessage.create({ content: `<p class="secret"><b>Para o Mestre:</b> ${amigo.nome} é <b>${amigo.deus}</b>.</p>`, whisper });
			const todos = Object.keys(D.amigos).every((k) => est.presentes[k]?.entregue);
			if (todos) html += "<p>Os seis amigos se despedem. Quando a porta se fecha, Garbin não está mais ali... Um barulho no telhado! Pela janela, um <b>gato preto</b> voa pelo céu nevado, carregando um saco cor-de-rosa cheio de presentes.</p>";
		}
		await game.user.setFlag("world", ESTADO, est);
		ChatMessage.create({ content: html, rolls });
	}

	async function macroGarbin(D) {
		const ESTADO = "fdtGatal";
		const i = game.user.getFlag("world", `${ESTADO}.garbin`) ?? 0;
		const [raca, txt] = D.garbin[i % D.garbin.length];
		const img = `systems/tormenta20/icons/racas/${raca}.webp`;
		const ator = game.actors.find((a) => a.getFlag("world", "fdtRole") === "garbin");
		if (ator) await ator.update({ img, "prototypeToken.texture.src": img });
		const tks = canvas.tokens.placeables.filter((t) => t.actor?.getFlag("world", "fdtRole") === "garbin");
		if (tks.length) await canvas.scene.updateEmbeddedDocuments("Token", tks.map((t) => ({ _id: t.id, "texture.src": img })));
		await game.user.setFlag("world", `${ESTADO}.garbin`, i + 1);
		ChatMessage.create({ content: `<p>Vocês olham de novo para Garbin. Engraçado... agora Garbin é <b>${txt}</b>. Ninguém parece achar isso estranho, muito menos ele mesmo.</p>` });
	}

	async function macroPerseguicao(D) {
		const ESTADO = "fdtGatal";
		const i = game.user.getFlag("world", `${ESTADO}.perseguicao`) ?? 0;
		const chaves = Object.keys(D.amigos);
		if (i >= chaves.length) return ChatMessage.create({ content: "<p>O rastro dos gnolls some de vez na neve. Mas, de algum jeito, a noite já foi salva: é Gatal.</p>" });
		const k = chaves[i];
		const a = D.amigos[k];
		const ini = Math.floor((i * 100) / 6) + 1;
		const fim = Math.floor(((i + 1) * 100) / 6);
		const objs = D.objetos.slice(ini - 1, fim).map((o, j) => `${ini + j}. ${o}`);
		await game.user.setFlag("world", `${ESTADO}.perseguicao`, i + 1);
		ChatMessage.create({ content: `<h3>No rastro dos gnolls (${i + 1}/6)</h3>
			<p>As pegadas parecem frescas, mas os gnolls estão sempre um pouco mais à frente. No caminho, vocês encontram <b>${a.nome}</b>: ${a.perfil}</p>
			<p><i>"Eu ia ganhar um presente de Gatal... mas destruíram a oficina do Garbin. Vou ficar sem nada este ano."</i></p>
			<p>Espalhados pela neve, objetos que os gnolls derrubaram na fuga: ${objs.join("; ")}.</p>
			<p style="font-size:0.85em">Contingência <b>Sem Espírito Gatalino</b>: os jogadores podem fabricar o presente ali mesmo (simplifique a fabricação se precisar) e entregar na hora com a <i>Oficina de Gatal</i>.</p>` });
	}

	async function macroUsar() {
		const tk = canvas.tokens.controlled.find((t) => t.actor);
		if (!tk) return ui.notifications.warn("Selecione o token de quem usa o presente.");
		const itens = tk.actor.items.filter((i) => (i.getFlag("world", "fdtRole") ?? "").startsWith("presente_"));
		if (!itens.length) return ui.notifications.warn(`${tk.name} não tem presentes de Gatal.`);
		const op = itens.map((i) => `<option value="${i.id}">${i.name}</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Usar Presente de Gatal" },
			content: `<div class="form-group"><label>Presente</label><select name="item">${op}</select></div>`,
			ok: { label: "Usar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const item = tk.actor.items.get(res.item);
		const role = item.getFlag("world", "fdtRole");
		let html = `<h3>${item.name}</h3>`;
		if (role === "presente_criadora") {
			const usos = (item.getFlag("world", "fdtUsos") ?? 3) - 1;
			const parte = ["o machado", "a ponta de lança", "o martelo"][Math.max(0, usos)];
			html += `<p>${tk.name} rola de novo um teste. ${usos > 0 ? `<b>${parte[0].toUpperCase() + parte.slice(1)}</b> da alabarda se desfaz em purpurina. Restam ${usos} rerrolagem(ns).` : "A última parte se desintegra: <b>a Criadora de Meios acabou.</b>"}</p>`;
			if (usos > 0) await item.setFlag("world", "fdtUsos", usos);
			else await item.delete();
		} else {
			const qtd = (Number(item.system.qtd) || 1) - 1;
			const efeitos = {
				presente_flauta: "Uma criatura (ND até o nível de quem toca) passa a contar como <b>animal</b> por uma cena.",
				presente_balanca: "Os pratinhos se inclinam e mostram o rumo mais bondoso e justo.",
				presente_alev: "A vela acende... e espalha <b>escuridão</b> por até uma hora.",
				presente_copo: "Quem \"bebe\" do copo de ar respira sob a água por até uma hora.",
				presente_truque: "A magia arcana escolhida passa a contar como de outra escola."
			};
			html += `<p>${efeitos[role] ?? ""} ${qtd > 0 ? `Restam ${qtd} uso(s).` : "Foi o último uso."}</p>`;
			if (qtd > 0) await item.update({ "system.qtd": qtd });
			else await item.delete();
		}
		ChatMessage.create({ content: html });
	}

	const PERICIAS = { ofic: "Ofício (o melhor)", dipl: "Diplomacia", enga: "Enganação", atua: "Atuação", nobr: "Nobreza", inti: "Intimidação", intu: "Intuição", conh: "Conhecimento", mist: "Misticismo", reli: "Religião", sobr: "Sobrevivência", ades: "Adestramento", cura: "Cura", ladi: "Ladinagem", atle: "Atletismo", acro: "Acrobacia", pont: "Pontaria", luta: "Luta", inve: "Investigação", perc: "Percepção", guer: "Guerra", furt: "Furtividade" };
	const NOMES_PRESENTES = { flauta: "Flauta Animalizante", balanca: "Balança Moral", alev: "Alev, a vela de escuridão", criadora: "Criadora de Meios", copo: "Copo de Ar", truque: "Truque na Mágica" };
	const macro = (name, img, fn, dados = null) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Arco 1 · Especial de Gatal · gerado por a1-especial-de-gatal.js\n${dados ? `const DADOS = ${JSON.stringify(dados)};\n` : ""}(${fn.toString()})(${dados ? "DADOS" : ""});`
	});
	const macros = await Macro.createDocuments([
		macro("Gatal · Oficina de Gatal", "icons/svg/item-bag.svg", macroOficina, { amigos: AMIGOS, objetos: OBJETOS, pericias: PERICIAS, nomesPresentes: NOMES_PRESENTES }),
		macro("Gatal · Garbin Muda de Novo", `${T20I}/racas/hynne.webp`, macroGarbin, { garbin: GARBIN }),
		macro("Gatal · Perseguição aos Gnolls", `${T20I}/ameacas/gnoll.png`, macroPerseguicao, { amigos: AMIGOS, objetos: OBJETOS }),
		macro("Gatal · Usar Presente de Gatal", `${T20I}/itens/gerais/flauta-mistica.webp`, macroUsar)
	]);
	const linkMacro = (trecho) => {
		const m = macros.find((x) => x.name.includes(trecho));
		return m ? `@UUID[${m.uuid}]{${m.name}}` : trecho;
	};

	/* ------------------------------------------------------------------ */
	/* 7. Diário                                                            */
	/* ------------------------------------------------------------------ */
	const L = (d) => (d?.uuid ? `@UUID[${d.uuid}]{${d.name}}` : "");
	const pagina = (name, content, sort) => ({ name, type: "text", sort, text: { content, format: 1 } });
	const listaAmigos = Object.entries(AMIGOS).map(([k, a]) => `<li><b>${a.nome}.</b> ${a.perfil}</li>`).join("");

	await JournalEntry.create({
		name: "Arco 1 · Especial de Gatal",
		folder: pasta.JournalEntry,
		flags: FLAGS(),
		pages: [
			pagina("Guia do Mestre", `
				<h2>Resumo</h2>
				<p>Aventura de humor, <b>fora da cronologia</b> e quase apócrifa, sem nível definido. Ótima para as festas de fim de ano, quando ninguém tem tempo de preparar nada; outro jogador pode até mestrar. Decida se o que acontece aqui vale para o resto da campanha.</p>
				<p>Numa nevasca milagrosa, o grupo acha a oficina destruída de ${L(atores.garbin)}. Gnolls quebraram todos os presentes de Gatal. Faltam 5 horas para a meia-noite, quando seis amigos virão buscá-los. O grupo precisa fabricar seis presentes com as bugigangas que sobraram e entregá-los. Os amigos são deuses disfarçados; quem for agradado retribui com um presente mágico.</p>
				<p><b>Não há vilão.</b> O grupo resolve um problema, não destrói um inimigo.</p>
				<h2>Fases</h2>
				<ol>
					<li><b>Normalidade:</b> estrada, cair da noite, nevasca (não importa se é inverno ou se ali neva: é um milagre de Gatal, e eles estão despreparados). A cabana em estado deplorável e um velhinho no chão.</li>
					<li><b>Cancelaram o Gatal!</b> Garbin explica tudo: são 19h; à meia-noite em ponto os amigos batem à porta. Não adianta ir atrás dos gnolls.</li>
					<li><b>Ajudantes de Fada Madrinha:</b> a fabricação (regras na página própria).</li>
					<li><b>Então É Gatal:</b> a entrega, com teste social. Fabricação + entrega precisam somar <b>80</b>.</li>
					<li><b>Epílogo:</b> Garbin some; um gato preto voa com um saco cor-de-rosa.</li>
				</ol>
				<h2>Macros</h2>
				<ul>
					<li>${linkMacro("Oficina")}: o relógio de cada personagem, a fabricação (CD, ajudas, objetos estragados), a entrega com os bônus e os presentes de volta direto na ficha.</li>
					<li>${linkMacro("Garbin")}: a cada uso, Garbin é de outra raça (e o token muda).</li>
					<li>${linkMacro("Perseguição")}: a contingência Sem Espírito Gatalino.</li>
					<li>${linkMacro("Usar")}: gasta os usos dos presentes (e a alabarda que se desfaz).</li>
				</ul>
				<h2>Tabelas</h2>
				<p>${L(tabelaObjetos)} (a lista dos 100 objetos) e ${L(tabelaGarbin)}.</p>`, 100),
			pagina("Handout · Ajudantes de Fada Madrinha", `
				<blockquote>
				<p><i>Era véspera de Gatal<br>E pelo meio da estrada<br>Vinham cinco aventureiros<br>Entre eles, uma fada</i></p>
				<p><i>O vento soprava forte<br>A neve caía amiúde<br>Se não achassem abrigo,<br>Fariam teste de Fortitude</i></p>
				<p><i>Precisavam de oito horas<br>De descanso sem combate<br>Notaram uma cabana<br>A oficina de um mascate</i></p>
				<p><i>Bateram na porta humilde<br>Porque era melhor que morrer<br>De dentro surgiu uma voz<br>Eis um novo NPC!</i></p>
				<p><i>Não encontro aleatório<br>Isto é um beco sem saída<br>Vocês veem um velhinho<br>Com zero pontos de vida</i></p>
				<p><i>Em volta, tudo quebrado<br>No chão seus produtos jazem<br>E agora eu pergunto:<br>"Então? O que vocês fazem?"</i></p>
				</blockquote>
				<p class="secret">"Cinco aventureiros, entre eles uma fada" é o grupo original (Ayla é sílfide). Troque pelo seu grupo, se quiser.</p>`, 200),
			pagina("Garbin e a Oficina", `
				<p>Prateleiras quebradas, objetos jogados no chão, marcas de machado nas paredes, vidro quebrado, mesa estilhaçada, ferramentas destruídas. E, no centro, ${L(atores.garbin)}.</p>
				<p>Ele fabrica presentes de Gatal por encomenda. Os presentes são para os amigos dos clientes, como manda a tradição; os clientes moram longe, então os amigos passam na oficina para buscar. <i>Parece complicado demais? Não pense nisso, não podemos perder tempo, é quase dia de Gatal!</i></p>
				<p>Estava tudo pronto, ele descansava com um vinho quente, quando os gnolls atacaram: quebraram os presentes, bagunçaram tudo, espancaram o pobre ancião e fugiram. A neve já apagou as pegadas. Garbin não pode fabricar nada, está ferido demais (nem poções nem magias resolvem). <b>Só os aventureiros podem salvar o Gatal!</b></p>
				<h3>Você ainda acredita em Fada Madrinha?</h3>
				<p>A descrição básica lembra o Papai Noel, para dar um ícone reconhecível (muitos jogadores não sabem que no Gatal quem dá presentes é a Fada Madrinha). No fim, ela aparece como um <b>gato preto</b>, porque todo mundo associa Gatal a gatos. A Fada Madrinha pode ter qualquer aparência.</p>
				<h3>O que é Gatal?</h3>
				<p>Um feriado que pode ou não existir entre as fadas da Pondsmânia (talvez seja invenção da alquimista Aylarianna Purpúrea). É celebrado no dia 25 do Gato Pintado, um mês feérico, mas o feriado é móvel. O tema é a <b>amizade</b>, mais que a família: os amigos se reúnem em volta de uma mesa e comemoram amizade eterna. A Fada Madrinha surge com um saco cor-de-rosa e dá presentes; não importa ser bom ou mau: havendo amizade, há presentes.</p>`, 300),
			pagina("Handout · A Lista de Garbin", `
				<p>Garbin não conhece os amigos pessoalmente, mas tem a lista dos nomes e das personalidades:</p>
				<ul>${listaAmigos}</ul>
				<p>Eles chegam <b>à meia-noite em ponto</b>.</p>`, 400),
			pagina("Fabricação dos Presentes", `
				<p>Garbin tem todas as oficinas, bancadas e laboratórios, mas só em versões normais. Os <b>objetos</b> são só os que sobraram (${L(tabelaObjetos)}); os amigos conhecem a fama de Garbin e rejeitam materiais de fora. As ferramentas dos próprios personagens podem ser usadas.</p>
				<ul>
					<li><b>Mínimo de três objetos</b> por presente (menos parece lixo passado adiante). Mais objetos melhoram o presente.</li>
					<li><b>Tempo:</b> 1 hora, mais 1 hora por objeto além do terceiro. São 5 horas (das 19h à meia-noite) para 6 presentes.</li>
					<li><b>CD 25</b>, +2 por objeto além do terceiro.</li>
					<li><b>Ajuda:</b> cada hora a mais que um personagem gasta no mesmo presente permite outro teste de ajuda, cumulativo. Quem faz o teste pode ajudar a si mesmo assim. (Ajuda: CD 10, +1 e mais +1 a cada 10 acima.)</li>
					<li><b>Falha:</b> a primeira não estraga nada; a segunda no mesmo presente estraga um objeto aleatório; falhar por 5 ou mais estraga todos os objetos.</li>
					<li><b>Perícias</b> à escolha dos jogadores, desde que façam sentido (Ofício [culinária] para cozinhar um prato). Seja generoso. Magias e habilidades podem melhorar a manufatura, mas não inserir elementos (nada de presente feito de ilusão).</li>
					<li>Os jogadores sabem quando passam; peça que anotem o valor.</li>
				</ul>
				<p class="secret">A macro conta as horas de cada personagem; o relógio é o de quem mais trabalhou. Ajudantes gastam o tempo do presente mais as horas extras (inferido).</p>`, 500),
			pagina("Então É Gatal", `
				<p>Os seis amigos chegam ao mesmo tempo, à meia-noite. São deuses do Panteão; interprete como mortais extremamente excêntricos, sem raça definida, com roupas, maneirismos e postura muito parecidos com a representação normal do deus, mas não idênticos.</p>
				<table><tr><th>Amigo</th><th>Na verdade</th><th>Retribui com</th></tr>
				${Object.entries(AMIGOS).map(([k, a]) => `<tr><td>${L(atores[k])}</td><td>${a.deus}</td><td>${L(itemPorRole(`presente_${a.presente}`))}</td></tr>`).join("")}</table>
				<h3>A entrega</h3>
				<p>Um teste de perícia social por presente (seis ações separadas: um só personagem pode fazer todos, e os outros ajudam). Magias e habilidades valem. Não é situação tática, sem rodadas. Bônus:</p>
				<ul>
					<li>+5 por objeto além do terceiro.</li>
					<li>+5 se o presente combinar com o amigo (a critério do Mestre).</li>
					<li>+5 se o grupo mostrar muito espírito gatalino (acolhedores, dizendo "Feliz Gatal!").</li>
					<li>+5 se prepararam os presentes de um jeito especial (meias, laços de fita, uma cerimônia ou festinha).</li>
				</ul>
				<p><b>Fabricação + entrega precisam somar 80.</b> Parece alto, mas o grupo quase certamente consegue se entrar no espírito: um teste com +30 não é incomum. Cada amigo agradado dá seu presente.</p>`, 600),
			pagina("Os Presentes dos Amigos", Object.values(PRESENTES).map((d) => `<h3>${d.name}</h3>${d.system.description.value}`).join(""), 700),
			pagina("Contingência e Epílogo", `
				<h3>Contingência: Sem Espírito Gatalino</h3>
				<p>Se os jogadores insistirem em perseguir os gnolls ou curar Garbin como numa aventura tradicional:</p>
				<ol>
					<li><b>A mais simples</b> (talvez frustrante): dizer que a proposta não é combate nem tática, mas uma brincadeira com os famosos "especiais de Natal".</li>
					<li><b>A mais divertida:</b> uma trilha sempre no rastro dos gnolls, sem nunca alcançá-los. No caminho, os seis amigos, um por um, contam que queriam um presente. Perto de cada um, uma parte da lista de objetos para fabricar o presente dele. Simplifique a fabricação. Use ${linkMacro("Perseguição")} (ela divide os 100 objetos em seis partes, por ordem: inferido).</li>
				</ol>
				<h3>Epílogo</h3>
				<p>Os amigos vão embora; Garbin também não está mais ali. Um barulho lá em cima: pela janela, um <b>gato preto</b> voa pelo céu, carregando um saco cor-de-rosa cheio de presentes.</p>
				<blockquote><p><i>Vá, Ignis! Vá, Arius!<br>Vocês sabem: "é horrível!"<br>Vá Ayla, Rexthor, Kiki!<br>Um dia subirão de nível!</i></p>
				<p><i>A campanha continua<br>Só depois do nascimento<br>Mas antes do nível 20<br>Não acaba Fim dos Tempos</i></p>
				<p><i>Talvez haja um TPK<br>Ou um jogo presencial<br>Por enquanto, boa noite<br>E a todos feliz Gatal!</i></p></blockquote>
				<p class="secret">Os nomes da primeira estrofe são o grupo original. Troque por Balthazar, Felix, Hanna, Rak e Tariq, se quiser.</p>`, 800),
			pagina("Handout · O Que Sobrou na Oficina", `<p>Só estes objetos podem virar presentes:</p><ol>${OBJETOS.map((o) => `<li>${o}</li>`).join("")}</ol>`, 900)
		]
	});

	ui.notifications.info(`Especial de Gatal criado: Garbin, os seis amigos, os presentes, 2 tabelas, diário e 4 macros. Veja a pasta "${NOME_PASTA}".`);
})();
