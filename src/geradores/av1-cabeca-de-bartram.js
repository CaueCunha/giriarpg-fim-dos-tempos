/* =====================================================================
 * FIM DOS TEMPOS · ARCO 1 · AVENTURA 1 · "TRAGAM-ME A CABEÇA DE BARTRAM ZONNAR"
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Av1 · Tragam-me a Cabeça de Bartram Zonnar" com:
 *      - Ameaças: o orc canibal, Khalmyr (com a adaga de metal arco-íris) e Aharadak.
 *      - Apoio: Bartram Zonnar, a velha Tanna-Toh e a galera do Forte Cabeça-de-Martelo
 *        (Belinda, Sargento Morgan, Arthemus Vesper e os soldados), sem ficha no livro.
 *      - Itens: a adaga e a espada curta de metal arco-íris e a carta no quarto de Bartram.
 *      - Tabelas: Elemento do Metal Arco-Íris e Nomes dos Orcs Canibais.
 *      - Diário com guia, o Forte, as fases da aventura, o metal arco-íris e o desfecho.
 *      - Macros: No Rastro (testes estendidos), Orcs Canibais, Conversar com Tanna-Toh,
 *        Ritual do Banquete e Metal Arco-Íris.
 *   3. Os Encontros nas Colinas Centrais ficam no gerador a1-encontros-colinas.
 *   4. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "av1".
 *
 * Feito a partir do código do sistema (1.6.4, out/2026). Validado no Foundry simulado do
 * módulo giriarpg-fim-dos-tempos; veja o guia av1-cabeca-de-bartram.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "av1";
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
			window: { title: "Aventura 1 do Arco 1: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para a Aventura 1 do Arco 1.</p>
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
	const NOME_PASTA = "FdT · Av1 · Tragam-me a Cabeça de Bartram Zonnar";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#6b4a2a", flags: FLAGS() })).id;
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
	const PA = `${T20I}/poderes/ameacas`;
	const ICO = {
		orc: `${T20I}/ameacas/orc.png`,
		chefe: `${T20I}/ameacas/orc-chefe.png`,
		clava: `${T20I}/itens/equipamentos/clava.webp`,
		adaga: `${T20I}/itens/equipamentos/adaga.webp`,
		espada: `${T20I}/itens/equipamentos/espada-curta.webp`,
		lefeu: `${PA}/terceiro-braco.webp`,
		arcoiris: `${T20I}/itens/gerais/metal-arco-iris.webp`,
		carta: `${T20I}/itens/gerais/pergaminho.webp`,
		caldeirao: `${T20I}/itens/gerais/panela.webp`,
		sangue: `${PA}/dilacerar.webp`,
		rastro: `${T20I}/magias/caminhos-da-natureza.webp`,
		tanna: `${T20I}/itens/gerais/livro.webp`,
		humano: `${T20I}/racas/humano.webp`,
		elfo: `${T20I}/racas/elfo.webp`,
		hynne: `${T20I}/racas/hynne.webp`,
		forte: "icons/svg/castle.svg"
	};

	/* ------------------------------------------------------------------ */
	/* 2. Ameaças                                                           */
	/* ------------------------------------------------------------------ */
	const atores = {};
	const ORC = {
		nd: "1/4", cd: 10, tipo: "hum", raca: "orc", papel: "lackey",
		atr: { for: 3, des: 0, con: 1, int: -2, sab: -1, car: -3 }, pv: 6, def: 11, walk: 9, sentidos: ["escuro"],
		pericias: { inic: 2, perc: -1, fort: 3, refl: 0, vont: -1, luta: 7 },
		equipTxt: "Clava (ou outra arma tosca: espada curta quebrada, pedaço de pau, osso humano), couro batido."
	};
	const BIO_ORC = "Clã de orcs das Colinas, ainda menos sofisticado que orcs comuns: uma única família, deformada pelos casamentos consanguíneos e pelo efeito divino das Centrais, e muitos mutilados por já terem servido de \"carne\". Não sofrem de sensibilidade à luz. Carregam crânios, ossos, dentes e orelhas de pessoas. Adotaram nomes de deuses, e o que acontece com o deus parece se refletir no orc homônimo.";

	atores.orc = await criarNPC({
		...ORC,
		name: "Orc Canibal",
		role: "orc",
		img: ICO.orc,
		ataquesTxt: "Clava +7 (1d6+4).",
		bio: p(BIO_ORC, "Versões mais fracas dos humanoides normais. Não lutam até o último: com um ou dois de pé e o grupo em vantagem, rendem-se e oferecem informações (macro <i>Orcs Canibais</i>).",
			"Para dar nomes aos tokens na cena, use a macro <i>Orcs Canibais</i>."),
		items: [arma("Clava", ICO.clava, { dano: "1d6+4", tipo: "impacto" })]
	});
	atores.khalmyr = await criarNPC({
		...ORC,
		name: "Khalmyr, Líder dos Batedores Orcs",
		tokenName: "Khalmyr",
		role: "khalmyr",
		img: ICO.orc,
		pericias: { ...ORC.pericias, luta: 8 },
		ataquesTxt: "Adaga de metal arco-íris +8 (1d4+5, 19).",
		equipTxt: "Adaga de metal arco-íris, couro batido, uma pele de homem usada como pele de urso.",
		bio: p(BIO_ORC, "Líder dos oito batedores deixados para trás pelo primeiro bando de caça. Pegou para si uma <b>adaga de metal arco-íris</b>: a primeira pista. Usa uma pele de homem sobre o corpo todo, como se fosse uma pele de urso."),
		items: [arma("Adaga de Metal Arco-Íris", ICO.adaga, { dano: "1d4+5", tipo: "perfuracao", critM: 19,
			effects: [aoUsar("Metal arco-íris (+1 de elemento)", ICO.arcoiris, [["dano", "1"]], ["attack"])],
			desc: p("+1 de dano de um elemento (macro <i>Metal Arco-Íris</i>).") })]
	});
	atores.aharadak = await criarNPC({
		name: "Aharadak, Líder dos Orcs Canibais",
		tokenName: "Aharadak",
		role: "aharadak",
		link: true,
		img: ICO.chefe,
		nd: 1,
		cd: 13,
		tipo: "hum",
		raca: "orc",
		papel: "solo",
		atr: { for: 4, des: 1, con: 3, int: -1, sab: 1, car: -1 },
		pv: 39,
		def: 17,
		walk: 9,
		sentidos: ["escuro"],
		pericias: { inic: 5, perc: 5, fort: 7, refl: 5, vont: 3, inti: 6, luta: 9 },
		ic: ["cansaco", "medo"],
		resTxt: "Imunidade a cansaço e medo.",
		ataquesTxt: "Clava +9 (1d6+5) e braços lefeu +9 (1d4+5).",
		equipTxt: "Clava e um facão para o Ritual do Banquete.",
		bio: p("Nasceu há poucos anos, maior e mais maligno que os outros, com <b>quatro braços</b>: o segundo par é de carapaça rubra da Tormenta. Assim que aprendeu a falar, deu a si mesmo o nome de Aharadak e tomou o clã. Adulto em menos de um ano, baniu a velha Tanna-Toh quando ela avisou que a liderança dele era perigosa.",
			"<b>A \"coisa suja\" que lhe dá poder é estrangeira.</b> O metal arco-íris causa +6 de dano contra ele e impede que o portador seja alvo dos braços lefeu. Ideias que usem a alma das Colinas (fosso, soterramento, animais, madeira, plantas e pedras) dão bônus: veja o diário.",
			"<i>\"Hoje tem comida! Comida fresca, comida gritando! [...] Abram a boca que a comida chegou!\"</i>"),
		effects: [aoUsar("Ritual do Banquete (+1 ataque)", ICO.caldeirao, [["roll", 1]], ["attack"])],
		items: [
			arma("Clava", ICO.clava, { dano: "1d6+5", tipo: "impacto" }),
			arma("Braços Lefeu", ICO.lefeu, { dano: "1d4+5", tipo: "corte", desc: p("O segundo par de braços, de carapaça rubra da Tormenta. Ataca junto com a clava. <b>Não pode mirar quem empunha metal arco-íris.</b>") }),
			poder("Cortar um Naco", ICO.sangue,
				p("<b>Completa.</b> Durante o Ritual do Banquete, corta um pedaço de Bartram (–1 PV) e o atira para um orc. O orc perde a ação padrão, mas recebe <b>5 PV temporários</b>. Anule ocupando Aharadak ou salvando Bartram. Macro <i>Ritual do Banquete</i>."),
				{ exec: "full" }),
			poder("Membros da Tormenta", ICO.lefeu, p("Corrompido pela Tormenta, mas habitante das Colinas Centrais: a essência de Tilliann rejeita a mácula. O metal arco-íris causa <b>1 de dano por elemento (+6)</b> contra ele."), { exec: "passive" })
		]
	});

	/* ---------- apoio (sem ficha no livro) ---------- */
	const SEM_FICHA = "<b>Não tem ficha no livro.</b> Este ator existe para o token no mapa e para mostrar aos jogadores.";
	const apoio = (role, name, img, raca, bio, extra = {}) => criarNPC({
		name, role, img, disposition: 1, link: true, nd: 1, tipo: "hum", raca, papel: "special",
		atr: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 }, pv: 10, def: 10, bio: p(...bio, SEM_FICHA), ...extra
	});
	atores.bartram = await apoio("bartram", "Bartram Zonnar", ICO.humano, "humano", [
		"O único ajudante de Belinda na Metais do Baixote. Humano de Zakharov que tenta levar vantagem em tudo: aprendiz de uma guilda de armeiros, denunciou os irmãos aos puristas na guerra e fugiu quando Zakharov se aliou ao Reinado. Depois foi pego roubando minério da Guilda dos Mineradores de Yuvalin. Totalmente incompetente ao ar livre: só não morreu porque achou o Forte por acaso.",
		"Três figuras sombrias o acossaram numa expedição para buscar lenha: dois criminosos da Companhia dos Irmãos e \"o homem de mantos escuros\", que não falou nada. Chantagearam-no (contar à Guilda onde ele está e contar a Belinda o que fez na guerra) para roubar todas as armas de metal arco-íris.",
		"<b>20 PV.</b> O estado em que é encontrado depende dos desvios do grupo: nenhum, ferido; um, muito ferido e sem alguns membros; dois ou mais, morto. Se sobreviver, só pode ser interrogado na próxima aventura."
	], { disposition: 0, pv: 20, tokenName: "Bartram" });
	atores.tanna = await apoio("tanna-toh", "Tanna-Toh, a Velha Orc", ICO.orc, "orc", [
		"Anciã orc, encurvada e frágil, numa caverna imunda cheia de ossos. Banida por Aharadak; alguns orcs ainda levam vítimas para ela em segredo. Maligna e canibal, mas incapaz de ferir alguém.",
		"Teme estranhos de início: a presença dos orcs ou um teste social a acalma. Forasteiros que respeitam os costumes das Centrais ganham +5 em testes sociais; valoriza livros, pergaminhos, informações e histórias.",
		"Conselho: a \"coisa suja\" de Aharadak é estrangeira; use a alma das Colinas contra ele. Se mantida viva, pode ser uma fonte de sabedoria rústica sobre as Centrais."
	], { disposition: 0, tokenName: "Tanna-Toh" });
	const FORTE = [
		["belinda", "Belinda Arting", ICO.hynne, "hynne", ["Hynne clériga de Tibar que administra a Metais do Baixote Forja & Armazém no Forte, a primeira filial da oficina do primo Blixto. Uma máquina: dorme pouco, trabalha o tempo todo, não tem paciência com desculpas. Generosa com quem ajuda a si mesmo, mas mostra amizade com ainda mais cobranças (\"podia ser melhor\"). Noiva da maga anã Felicia Daratramm, da Academia Arcana.", "Fornece quartos, comida e equipamento... mas nada é de graça. Batizou o metal arco-íris com Arthemus. Ofício +15 (Arco 1, Av5)."]],
		["morgan", "Sargento Morgan de Molok", ICO.humano, "humano", ["\"O Homem da Guerra\", \"o Azarão\". Sobreviveu a Khalifor, a Trebuck, a Crânio Negro, a Mestre Arsenal, às Guerras Táuricas e à Guerra Artoniana. Idoso, tapa-olho, mão de madeira, manca. Calado e discreto (\"Estou ocupado sendo calado e discreto. Sai pra lá.\").", "Diz querer sossego, mas secretamente deseja uma última batalha para se juntar aos recrutas mortos. O único parente vivo é o neto, Mortimer. Guerra +15 (Arco 1, Av5)."]],
		["vesper", "Dr. Arthemus Vesper", ICO.humano, "humano", ["Visitante no Forte: inventor humano idoso, alto, magro e frágil, de bengala e longa barba branca. Natural de Valkaria, estudou com Lorde Niebling, viveu com os goblins baloeiros e se formou no Colégio Real de Médicos de Salistick. Veio a Zakharov aprender sobre armas e está há cerca de duas semanas no Forte, interessado no metal arco-íris.", "Há mais sobre Arthemus Vesper do que isto."]],
		["isabrine", "Isabrine", ICO.humano, "humana", ["A melhor mente tática e a guerreira mais habilidosa do Forte. Alta, forte e séria; irrita-se com futilidades e deseja secretamente uma emergência real."]],
		["edwina", "Edwina", ICO.humano, "humana", ["Estudiosa, bem-humorada e um pouco inadequada; seria melhor bibliotecária que soldada. Entrou no Exército pela família numerosa e se ressente das broncas de Morgan."]],
		["tarik", "Tarik", ICO.elfo, "elfo", ["Elfo adotado por uma família humana, com nome e maneirismos de humano. Ostenta a raça com orgulho, sem renegar a família que o acolheu."]],
		["doran", "Doran Derinarion", ICO.humano, "humano", ["Piadista e malandro de Ahlen; consegue mercadoria proibida e segredos. Está no Exército porque a Guilda de Ladrões de Thartann o jurou de morte.", "Pedindo reforços, sai escondido com o grupo: <b>parceiro assassino iniciante</b>."]],
		["moira", "Moira", ICO.humano, "humana", ["A pessoa mais extraordinária do Forte: a caminho de ser paladina de Khalmyr, mas nega os sinais (Doran jura que ela curou uma raposa com as mãos) e, mentindo, descumpre as Obrigações & Restrições. Invoca Khalmyr em toda decisão.", "Fica chocada se o grupo abandonar Bartram e deixa de colaborar."]],
		["nadine", "Nadine", ICO.humano, "humana", ["De Namalkah: acorda cedo, trabalha duro, come muito e fala alto. Jeito caipira, não tem medo de nada e é quem melhor fala com os locais. Sentinela na noite da fuga.", "Pedindo reforços, sai escondida com o grupo: <b>parceira combatente iniciante</b>."]],
		["fermond", "Fermond Aldaman", ICO.humano, "humano", ["Soldado medíocre e puxa-saco, quinto filho de uma família nobre menor. Delata colegas para subir. Sentinela na noite da fuga: ouviu algo estranho, mas tem medo de contar.", "Denuncia Nadine e Doran se saírem escondidos."]],
		["mortimer", "Mortimer", ICO.humano, "humano", ["Soldado novato, neto e único parente vivo de Morgan. Quieto e esforçado, mas sem talento especial. Pode até negar o parentesco, mas a semelhança o denuncia."]]
	];
	for (const [role, name, img, raca, bio] of FORTE) atores[role] = await apoio(role, name, img, raca, bio);

	/* ------------------------------------------------------------------ */
	/* 3. Itens                                                             */
	/* ------------------------------------------------------------------ */
	const itemDoc = (d, role) => ({ ...d, folder: pasta.Item, flags: FLAGS(role) });
	const METAL = p("<b>Metal arco-íris.</b> Causa +1 de dano de um elemento ao qual o alvo seja vulnerável (ácido, eletricidade, fogo, frio, luz ou trevas); se não houver, role o elemento ignorando resistências e imunidades. Lefeu sofrem esse dano apesar da imunidade a elementos.",
		"Contra habitantes das Colinas corrompidos pela Tormenta (por enquanto, Aharadak e Gaspar), causa 1 por elemento (<b>+6</b>) e o portador não pode ser alvo de ataques com membros lefeu. Não funciona contra lefeu ou forasteiros corrompidos. Macro <i>Metal Arco-Íris</i>.");
	const armaArcoIris = (role, name, img, dano, tipo, desc, extra = {}) => itemDoc({
		name, type: "arma", img,
		effects: [
			aoUsar("Metal arco-íris (+1 de elemento)", ICO.arcoiris, [["dano", "1"]], ["attack"]),
			aoUsar("Contra corrompido das Colinas (+6)", ICO.arcoiris, [["dano", "6"]], ["attack"])
		],
		system: {
			description: { value: p(desc) + METAL },
			equipado: 0, qtd: 1, criticoM: 19, criticoX: 2, alcance: extra.alcance ?? "", proficiencia: "simples", proposito: "corpo-a-corpo", empunhadura: "uma",
			preco: extra.preco ?? 0, peso: 0.5, espacos: 1,
			rolls: [
				{ name: "Ataque", key: "ataque0", type: "ataque", parts: [["1d20", "", ""], ["luta", "for", ""]], versatil: "", adaptavel: "" },
				{ name: "Dano", key: "dano1", type: "dano", parts: [[dano, tipo, ""], ["@for", "", ""]], versatil: "", adaptavel: "" }
			]
		}
	}, role);
	const novosItens = [
		armaArcoIris("adaga", "Adaga de Metal Arco-Íris", ICO.adaga, "1d4", "perfuracao", "Uma das armas roubadas da forja de Belinda, tomada por Khalmyr. <b>A primeira pista.</b>"),
		armaArcoIris("espada", "Espada Curta de Metal Arco-Íris", ICO.espada, "1d6", "perfuracao", "Jogada entre os entulhos no território do clã, perto do tronco onde Bartram está amarrado."),
		itemDoc({ name: "Carta no Quarto de Bartram", type: "tesouro", img: ICO.carta,
			system: { description: { value: p("<i>Hoje à noite.<br>Estamos esperando.<br>Syvarian não vai esperar mais.</i>", "Pequenas marcas mostram que foi escrita por um <b>devoto de Hyninn</b>: uma comunicação secreta que só outro devoto reconhece.", "Opcional: na mesa original, a carta \"surgiu\" quando os jogadores procuraram no quarto de Bartram.") }, qtd: 1, preco: 0, peso: 0, espacos: 0 } }, "carta")
	];
	const itensCriados = await Item.createDocuments(novosItens);
	const itemRole = (role) => itensCriados.find((i) => i.getFlag("world", "fdtRole") === role);

	/* ------------------------------------------------------------------ */
	/* 4. Tabelas                                                           */
	/* ------------------------------------------------------------------ */
	const tabela = (name, formula, linhas, description, img, role) => RollTable.create({
		name, img, folder: pasta.RollTable, flags: FLAGS(role), formula, replacement: true, displayRoll: true, description,
		results: linhas.map(([de, ate, nome, desc]) => ({ type: "text", range: [de, ate], weight: ate - de + 1, name: nome, description: desc ?? "" }))
	});
	const tabElemento = await tabela("Elemento do Metal Arco-Íris", "1d6", [
		[1, 1, "Ácido"], [2, 2, "Eletricidade"], [3, 3, "Fogo"], [4, 4, "Frio"], [5, 5, "Luz"], [6, 6, "Trevas"]
	], "Se o alvo não é vulnerável a nenhum dos elementos, role o tipo do +1 de dano, ignorando os tipos a que ele resiste ou é imune.", ICO.arcoiris, "elemento");
	const NOMES_ORCS = ["Khalmyr", "Azgher", "Thyatis", "Lena", "Wynna", "Hyninn", "Oceano", "Tenebra", "Marah", "Nimb", "Arsenal", "Thwor", "Valkaria", "Allihanna", "Megalokk", "Kally", "Sszzaas", "Lin-Wu", "Glórienn", "Ragnar"];
	const tabNomes = await tabela("Nomes dos Orcs Canibais", "1d20", NOMES_ORCS.map((n, i) => [i + 1, i + 1, n]),
		"Os orcs do clã têm nomes de deuses (cerca de 20 no clã; nomes repetidos quando sobram orcs). Emboscada: Khalmyr (líder), Azgher, Thyatis, Lena, Wynna, Hyninn, Oceano e Tenebra. Bando: Marah, Tenebra, Nimb, Arsenal, Thwor, Valkaria, Allihanna, Megalokk, Kally, Sszzaas, Lin-Wu, Glórienn, Ragnar e Keenn.", ICO.orc, "nomes");

	/* ------------------------------------------------------------------ */
	/* 5. Macros                                                            */
	/* ------------------------------------------------------------------ */

	async function macroRastro() {
		const CHAVE = "fdtRastroBartram";
		const NOME = { sobr: "Sobrevivência", inve: "Investigação", intu: "Intuição", perc: "Percepção", conh: "Conhecimento", atle: "Atletismo", furt: "Furtividade", mist: "Misticismo", reli: "Religião", cura: "Cura", dipl: "Diplomacia", ades: "Adestramento" };
		const TRILHAS = { bartram: { nome: "o rastro de Bartram", cd: 12 }, criminosos: { nome: "o rastro dos criminosos", cd: 15 } };
		const e = foundry.utils.mergeObject({ trilha: "bartram", testes: 0, sucessos: 0, falhas: 0, usadas: [] }, game.user.getFlag("world", CHAVE) ?? {}, { inplace: false });
		const t0 = TRILHAS[e.trilha] ?? TRILHAS.bartram;
		const opcoes = (sel) => Object.entries(NOME).map(([k, n]) => `<option value="${k}"${k === sel ? " selected" : ""}>${n}${k !== "sobr" && e.usadas.includes(k) ? " (já usada)" : ""}</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "No Rastro" },
			content: `<p>${t0.nome}: <b>${e.sucessos}/3</b> sucessos, <b>${e.falhas}/3</b> falhas, próxima CD <b>${t0.cd + 2 * e.testes}</b>.</p>
				<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="testar">O primeiro selecionado rastreia (o segundo ajuda)</option>
					<option value="colina">Na colina calcinada: para onde Bartram foi (Sobrevivência CD 12)</option>
					<option value="bartram">Começar o rastro de Bartram (CD 12)</option>
					<option value="criminosos">Começar o rastro dos criminosos (CD 15)</option></select></div>
				<div class="form-group"><label>Perícia de quem rastreia</label><select name="pericia">${opcoes("sobr")}</select></div>
				<div class="form-group"><label>Perícia de quem ajuda</label><select name="ajuda">${opcoes("perc")}</select></div>
				<div class="form-group"><label>Interação ou teste social transforma uma falha em sucesso</label><input type="checkbox" name="social"></div>
				<p style="font-size:0.85em">Teste estendido (3 sucessos, CD +2 por teste depois do primeiro). Toda perícia que não seja Sobrevivência só vale uma vez no teste inteiro, para rastrear ou ajudar. Justifique o uso.</p>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao in TRILHAS) {
			await game.user.setFlag("world", CHAVE, { trilha: res.acao, testes: 0, sucessos: 0, falhas: 0, usadas: [] });
			return ChatMessage.create({ content: `<h3>No Rastro</h3><p>O grupo começa a seguir ${TRILHAS[res.acao].nome}: teste estendido, 3 sucessos, CD inicial ${TRILHAS[res.acao].cd}.</p>` });
		}
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		if (!tokens.length) return ui.notifications.warn("Selecione quem rastreia (e, se quiser, quem ajuda).");
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r.total; };
		const valor = (a, k) => Number(a.system.pericias?.[k]?.value) || 0;
		if (res.acao === "colina") {
			const r = await rolar(`1d20 + ${valor(tokens[0].actor, "sobr")}`);
			return ChatMessage.create({ rolls, content: `<h3>A colina calcinada</h3><p>Topo pedregoso com uma árvore retorcida, totalmente calcinado, como se um calor súbito e intenso tivesse deixado a marca. Mais gente esteve aqui e houve um combate: até um destreinado percebe. Bartram decididamente não é um guerreiro.</p>
				<p>${tokens[0].name}: Sobrevivência <b>${r}</b> contra CD 12. ${r >= 12 ? "Bartram seguiu sozinho, nesta direção... e depois foi arrastado por um bando de criaturas bípedes." : "Não descobre a direção."}</p>` });
		}
		const NOMES = NOME;
		const k = res.pericia in NOMES ? res.pericia : "sobr";
		const kAjuda = res.ajuda in NOMES ? res.ajuda : "perc";
		if (k !== "sobr" && e.usadas.includes(k)) return ui.notifications.warn(`${NOMES[k]} já foi usada neste teste estendido.`);
		const cd = t0.cd + 2 * e.testes;
		let html = `<h3>No Rastro · teste ${e.testes + 1}</h3>`;
		let bonus = 0;
		const ajudante = tokens[1];
		if (ajudante && (kAjuda === "sobr" || (!e.usadas.includes(kAjuda) && kAjuda !== k))) {
			const a = await rolar(`1d20 + ${valor(ajudante.actor, kAjuda)}`);
			if (a >= 10) bonus = 2;
			html += `<p>${ajudante.name} ajuda (${NOMES[kAjuda]}): ${a} contra CD 10, ${a >= 10 ? "+2" : "não ajuda"}.</p>`;
			if (kAjuda !== "sobr") e.usadas.push(kAjuda);
		} else if (ajudante) html += `<p>${ajudante.name} não pode ajudar com ${NOMES[kAjuda]} (já usada ou igual à de quem rastreia).</p>`;
		const r = await rolar(`1d20 + ${valor(tokens[0].actor, k)}${bonus ? " + 2" : ""}`);
		if (k !== "sobr") e.usadas.push(k);
		e.testes += 1;
		const ok = r >= cd || !!res.social;
		if (ok) e.sucessos += 1; else e.falhas += 1;
		html += `<p>${tokens[0].name} (${NOMES[k]}): <b>${r}</b> contra CD ${cd}: ${ok ? `sucesso${r < cd ? " (graças à ajuda de um morador)" : ""}` : "falha"}.</p>`;
		const PISTAS = e.trilha === "bartram"
			? ["Caixotes empilhados junto à paliçada; sangue nos topos afiados das toras. Bartram estava mancando.", "Ele carrega muito peso e anda à noite sem lampião (!), mas não desacelera: pedras soltas, galhos quebrados, mais sangue.", "Ele parecia desesperado. A trilha sobe para uma colina pedregosa com uma árvore retorcida."]
			: ["Os criminosos não são inexperientes como Bartram: não estão feridos e levaram tochas.", "Eles andam com pressa, sem se esconder.", "A trilha acaba de repente num local calcinado, como a colina onde encontraram Bartram: foram recolhidos por algo vindo do céu."];
		if (ok) html += `<p>${PISTAS[Math.min(e.sucessos, 3) - 1]}</p>`;
		if (e.sucessos >= 3) {
			html += e.trilha === "bartram"
				? `<p><b>O rastro leva à colina calcinada.</b>${e.falhas === 0 ? " Sem nenhuma falha, o grupo percebe que <b>Bartram estava sendo seguido</b>." : ""}${e.falhas === 2 ? " Com duas falhas no caminho, role uma vez nos Encontros nas Colinas Centrais." : ""} Use a opção <i>Na colina calcinada</i>.</p>`
				: "<p><b>A trilha acaba num local calcinado.</b> Os orcs e qualquer NPC amistoso viram uma \"luz muito brilhante no céu\" ontem à noite. A perseguição aos criminosos não leva a nada concreto (e conta como um desvio).</p>";
			await game.user.unsetFlag("world", CHAVE);
		} else if (e.falhas >= 3) {
			html += e.trilha === "bartram"
				? "<p><b>Falha total em rastrear.</b> O grupo se perde nas trilhas das Colinas, sem as informações sobre o encontro com os criminosos, e é emboscado pelos orcs canibais. A aventura continua.</p>"
				: "<p><b>A trilha esfriou.</b> Os criminosos sumiram nas Colinas.</p>";
			await game.user.unsetFlag("world", CHAVE);
		} else await game.user.setFlag("world", CHAVE, e);
		ChatMessage.create({ content: html, rolls });
	}

	async function macroOrcs() {
		const EMBOSCADA = ["Khalmyr", "Azgher", "Thyatis", "Lena", "Wynna", "Hyninn", "Oceano", "Tenebra"];
		const BANDO = ["Marah", "Tenebra", "Nimb", "Arsenal", "Thwor", "Valkaria", "Allihanna", "Megalokk", "Kally", "Sszzaas", "Lin-Wu", "Glórienn", "Ragnar", "Keenn"];
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Orcs Canibais" },
			content: `<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="nomes-emboscada">Dar nomes aos orcs da emboscada (8)</option>
					<option value="nomes-bando">Dar nomes aos orcs do bando de Aharadak (14)</option>
					<option value="espreita">Os batedores espreitam: Percepção dos selecionados contra Furtividade</option>
					<option value="render">Os últimos orcs se rendem e contam o que viram</option>
					<option value="furtividade">Chegar ao Ritual sem ser visto (Furtividade CD 15)</option></select></div>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r.total; };
		const orcs = canvas.tokens.placeables.filter((t) => t.actor?.getFlag("world", "fdt") === "av1" && t.actor.getFlag("world", "fdtRole") === "orc");
		if (res.acao.startsWith("nomes")) {
			const lista = res.acao === "nomes-bando" ? BANDO : EMBOSCADA.slice(1);
			if (!orcs.length) return ui.notifications.warn("Não há tokens de Orc Canibal nesta cena.");
			const feitos = [];
			for (let i = 0; i < orcs.length; i++) {
				const nome = lista[i % lista.length] + (i >= lista.length ? ` ${Math.floor(i / lista.length) + 1}` : "");
				await orcs[i].document.update({ name: nome });
				feitos.push(nome);
			}
			return ChatMessage.create({ whisper: ChatMessage.getWhisperRecipients("GM"), content: `<h3>Orcs Canibais</h3><p>Tokens renomeados: ${feitos.join(", ")}.${res.acao === "nomes-bando" ? " Aharadak lidera o bando." : " Khalmyr (o líder, com a adaga de metal arco-íris) é um ator à parte."}</p>` });
		}
		const pjs = canvas.tokens.controlled.filter((t) => t.actor);
		if (res.acao === "espreita") {
			if (!pjs.length) return ui.notifications.warn("Selecione os personagens.");
			const furt = await rolar("1d20");
			const linhas = [];
			for (const t of pjs) {
				const r = await rolar(`1d20 + ${Number(t.actor.system.pericias?.perc?.value) || 0}`);
				linhas.push(`<li>${t.name}: Percepção ${r} ${r >= furt ? "<b>nota os orcs</b> antes do ataque" : "não nota nada"}.</li>`);
			}
			return ChatMessage.create({ rolls, content: `<h3>Os heróis estão sendo observados</h3><p>Furtividade dos orcs: ${furt}.</p><ul>${linhas.join("")}</ul><p>Passando ou não, todos ouvem o ronco de um estômago e as palavras <b>"Carne fresca!"</b>. Os orcs atacam.</p>` });
		}
		if (res.acao === "furtividade") {
			if (!pjs.length) return ui.notifications.warn("Selecione os personagens.");
			const linhas = [];
			for (const t of pjs) {
				const r = await rolar(`1d20 + ${Number(t.actor.system.pericias?.furt?.value) || 0}`);
				linhas.push(`<li>${t.name}: Furtividade ${r}, ${r >= 15 ? "se aproxima sem ser visto" : "<b>é visto</b>"}.</li>`);
			}
			return ChatMessage.create({ rolls, content: `<h3>As Colinas Têm Olhos</h3><p>Os orcs estão atentos ao canibalismo ritualístico (CD 15).</p><ul>${linhas.join("")}</ul>` });
		}
		ChatMessage.create({ content: `<h3>Os orcs se rendem</h3><p>Com um ou dois de pé, imploram por clemência e oferecem informações:</p><ul>
			<li>Viram a transação: Bartram entregou as armas a dois forasteiros "muito perigosos", que depois sumiram num brilho vindo do céu.</li>
			<li>O primeiro bando de caça levou Bartram para o clã, onde Aharadak manda.</li>
			<li>A velha Tanna-Toh sabe mais sobre as "coisas estranhas" nas Centrais; eles indicam a caverna.</li></ul>
			<p>Três caminhos: falar com Tanna-Toh, perseguir os criminosos (não leva a nada concreto) ou salvar Bartram. Cada desvio piora o estado dele: nenhum, ferido; um, muito ferido e sem alguns membros; dois ou mais, morto.</p>` });
	}

	async function macroTanna() {
		const NOME = { dipl: "Diplomacia", enga: "Enganação", inti: "Intimidação", intu: "Intuição", nobr: "Nobreza", atua: "Atuação" };
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Conversar com Tanna-Toh" },
			content: `<div class="form-group"><label>Perícia social</label><select name="pericia">${Object.entries(NOME).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></div>
				<div class="form-group"><label>Os orcs do clã estão junto</label><input type="checkbox" name="orcs"></div>
				<div class="form-group"><label>Respeito às tradições das Centrais (+5)</label><input type="checkbox" name="respeito"></div>
				<div class="form-group"><label>Presente: livro, pergaminho, história ou nota sobre os nomes dos deuses (+2)</label><input type="checkbox" name="presente"></div>
				<div class="form-group"><label>Ela viu a adaga de metal arco-íris</label><input type="checkbox" name="adaga"></div>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const tk = canvas.tokens.controlled[0];
		const rolls = [];
		let html = "<h3>Tanna-Toh, a Velha Orc</h3>";
		let calma = !!res.orcs;
		if (!calma) {
			if (!tk?.actor) return ui.notifications.warn("Selecione quem fala com ela.");
			const k = res.pericia in NOME ? res.pericia : "dipl";
			const r = await new Roll(`1d20 + ${Number(tk.actor.system.pericias?.[k]?.value) || 0}${res.respeito ? " + 5" : ""}${res.presente ? " + 2" : ""}`).evaluate();
			rolls.push(r);
			calma = r.total >= 15;
			html += `<p>${tk.name} (${NOME[k]}): <b>${r.total}</b> contra CD 15. ${calma ? "A anciã se acalma." : "Ela se encolhe, com medo; tente de outro jeito (ou traga os orcs)."}</p>`;
		} else html += "<p>Com os orcs do clã por perto, ela se acalma.</p>";
		if (calma) {
			html += `<p>Como se tivesse algo da deusa, conta toda a história do clã e o que sabe:</p><ul>
				<li>As Centrais são um lugar especial: têm uma alma própria.</li>
				<li>Nos últimos anos, algo "sujo, ruim" vem se infiltrando. "Algo vermelho?" Sim.</li>
				<li>Os humanos de fora tentam domar as Centrais, mas as Colinas resistem: por isso "um grupo de mineradores forasteiros" nunca achou o metal arco-íris.</li>
				<li>Nas últimas luas, mais estrangeiros; nenhum corrompido. Nos últimos sóis, uns muito deslocados e urbanos (os criminosos), que já foram embora, para alívio dela.</li>
				<li><b>Conselho:</b> a coisa suja que dá poder a Aharadak é estrangeira. Usem as próprias Colinas, a alma da região, para vencê-lo.${res.adaga ? " E esse metal colorido <b>pertence às Centrais</b>." : ""}</li></ul>
				<p style="font-size:0.85em">Ela não pode ferir ninguém. Maligna e canibal, morre de fome se ninguém caçar por ela; mantida viva, é fonte de sabedoria rústica sobre as Centrais.</p>`;
		}
		ChatMessage.create({ content: html, rolls });
	}

	async function macroRitual() {
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Ritual do Banquete" },
			content: `<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="inicio">1ª rodada: Aharadak corta a mão de Bartram</option>
					<option value="rodada">Nova rodada: Bartram sangra (–1 PV)</option>
					<option value="naco">Aharadak corta um naco para o orc mirado (+5 PV temporários)</option>
					<option value="caldeirao">O selecionado tenta derrubar o caldeirão (Força CD 15)</option>
					<option value="salvar">Bartram foi salvo (para de sangrar)</option>
					<option value="desvios">Estado de Bartram pelos desvios do grupo</option></select></div>
				<div class="form-group"><label>Desvios do grupo</label><select name="desvios"><option value="0">Nenhum</option><option value="1" selected>Um</option><option value="2">Dois ou mais</option></select></div>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const bartram = game.actors.find((a) => a.getFlag("world", "fdt") === "av1" && a.getFlag("world", "fdtRole") === "bartram");
		const rolls = [];
		const ehRitual = (x) => x.getFlag("world", "fdtRitual");
		const efeito = (name, value) => ({
			name, img: "systems/tormenta20/icons/itens/gerais/panela.webp", type: "base", flags: { world: { fdtRitual: true } },
			system: { changes: [{ key: "system.modificadores.ataque.geral", value, type: "add", phase: "initial", priority: null }] }
		});
		const limpar = async () => {
			let n = 0;
			for (const t of canvas.tokens.placeables) {
				const ids = t.actor?.effects.filter(ehRitual).map((x) => x.id) ?? [];
				if (ids.length) { await t.actor.deleteEmbeddedDocuments("ActiveEffect", ids); n += ids.length; }
			}
			return n;
		};
		const pvBartram = () => Number(bartram?.system.attributes.pv.value) || 0;
		const ferirBartram = async (n) => {
			if (!bartram) return 0;
			const novo = Math.max(0, pvBartram() - n);
			await bartram.update({ "system.attributes.pv.value": novo });
			return novo;
		};
		let html = "<h3>Ritual do Banquete</h3>";
		if (res.acao === "desvios") {
			const d = Number(res.desvios) || 0;
			const pv = d === 0 ? 15 : d === 1 ? 10 : 0;
			if (bartram) await bartram.update({ "system.attributes.pv.value": pv });
			html += `<p>${["<b>Nenhum desvio:</b> Bartram está ferido, mas sem risco de vida.", "<b>Um desvio</b> (o normal): muito ferido e sem alguns membros, mas dá para salvá-lo.", "<b>Dois ou mais desvios:</b> Bartram já foi devorado."][Math.min(d, 2)]}</p>`;
			if (d < 2) html += "<p>Se o grupo chegar antes de ele ser devorado, pega o ritual pela metade: use <i>1ª rodada</i> quando o combate começar.</p>";
		}
		if (res.acao === "inicio") {
			if (bartram) await bartram.update({ "system.attributes.pv.value": Math.min(pvBartram() || 20, 10) });
			await limpar();
			let orcs = 0;
			let herois = 0;
			for (const t of canvas.tokens.placeables.filter((x) => x.actor)) {
				const role = t.actor.getFlag("world", "fdtRole");
				if (t.actor.getFlag("world", "fdt") === "av1" && ["orc", "khalmyr", "aharadak"].includes(role)) { await t.actor.createEmbeddedDocuments("ActiveEffect", [efeito("Ritual do Banquete (+1 ataque)", "1")]); orcs += 1; }
				else if (t.actor.type === "character") { await t.actor.createEmbeddedDocuments("ActiveEffect", [efeito("Vapores do caldeirão (–1 ataque)", "-1")]); herois += 1; }
			}
			html += `<p>Aharadak corta a mão de Bartram: ele fica com <b>${pvBartram() || 10} PV</b> e sangra 1 PV por rodada. O caldeirão borbulha, soltando vapores nauseabundos.</p><p>Enquanto ele sangrar: orcs <b>+1</b> em ataques (${orcs} tokens) e heróis que respiram <b>–1</b> (${herois} tokens). Tire o efeito de quem não respira.</p>`;
		}
		if (res.acao === "rodada") {
			const novo = await ferirBartram(1);
			html += `<p>Bartram sangra: <b>${novo} PV</b>.</p>`;
			if (bartram && novo <= 0) html += `<p><b>Bartram morreu.</b> O ritual se completa (${await limpar()} efeitos removidos).</p>`;
		}
		if (res.acao === "naco") {
			const alvo = [...game.user.targets].find((t) => t.actor);
			const novo = await ferirBartram(1);
			if (alvo) {
				const pv = alvo.actor.system.attributes.pv;
				await alvo.actor.update({ "system.attributes.pv.temp": Math.max(Number(pv.temp) || 0, 5) });
			}
			html += `<p>Ação completa: Aharadak corta um naco de Bartram (<b>${novo} PV</b>) e atira para ${alvo ? alvo.name : "um orc"}, que perde a ação padrão e recebe <b>5 PV temporários</b>.</p>`;
			if (bartram && novo <= 0) html += `<p><b>Bartram morreu.</b> (${await limpar()} efeitos removidos.)</p>`;
		}
		if (res.acao === "caldeirao") {
			const tk = canvas.tokens.controlled[0];
			if (!tk?.actor) return ui.notifications.warn("Selecione quem empurra o caldeirão.");
			const r = await new Roll(`1d20 + ${Number(tk.actor.system.atributos?.for?.value) || 0}`).evaluate();
			rolls.push(r);
			html += `<p>${tk.name}: Força <b>${r.total}</b> contra CD 15. `;
			if (r.total >= 15) html += `O caldeirão tomba e os vapores se dissipam (${await limpar()} efeitos removidos). Os nacos ainda funcionam.</p>`;
			else if (r.total <= 10) {
				const d = await new Roll("1d4[acido]").evaluate();
				rolls.push(d);
				try { await tk.actor.applyDamageV2(d, 1); } catch (err) { console.warn(err); }
				html += `Falha por 5 ou mais: entorna o caldeirão sobre si mesmo, <b>${d.total} de ácido</b>.</p>`;
			} else html += "O caldeirão não se mexe.</p>";
		}
		if (res.acao === "salvar") html += `<p>Bartram está a salvo e para de sangrar (${await limpar()} efeitos removidos). Sem ele, não há mais nacos. Ele não tem condições de falar: pode ser interrogado na próxima aventura.</p>`;
		ChatMessage.create({ content: html, rolls });
	}

	async function macroMetal() {
		const ELEMENTOS = ["acido", "eletricidade", "fogo", "frio", "luz", "trevas"];
		const NOME = { acido: "ácido", eletricidade: "eletricidade", fogo: "fogo", frio: "frio", luz: "luz", trevas: "trevas" };
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Metal Arco-Íris" },
			content: `<div class="form-group"><label>O alvo é um habitante das Colinas corrompido pela Tormenta (Aharadak, Gaspar)</label><input type="checkbox" name="corrompido"></div>
				<div class="form-group"><label>O alvo é lefeu (ignora a imunidade a elementos)</label><input type="checkbox" name="lefeu"></div>
				<p style="font-size:0.85em">Mire o alvo que acabou de ser atingido. A macro escolhe um elemento a que ele seja vulnerável ou rola um entre os que ele não resiste e aplica o dano.</p>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const alvo = [...game.user.targets].find((t) => t.actor);
		if (!alvo) return ui.notifications.warn("Mire o alvo atingido pela arma de metal arco-íris.");
		const rolls = [];
		const rs = alvo.actor.system.tracos?.resistencias ?? {};
		if (res.corrompido) {
			const r = await new Roll("1[acido] + 1[eletricidade] + 1[fogo] + 1[frio] + 1[luz] + 1[trevas]").evaluate();
			rolls.push(r);
			try { await alvo.actor.applyDamageV2(r, 1); } catch (err) { console.warn(err); }
			return ChatMessage.create({ rolls, content: `<h3>Metal Arco-Íris</h3><p>Contra ${alvo.name}, corrompido nas Colinas: a essência de Tilliann rejeita a mácula. <b>+1 de cada elemento (+6)</b>, e o portador não pode ser alvo dos membros lefeu.</p>` });
		}
		const vulneravel = ELEMENTOS.filter((k) => rs[k]?.vulnerabilidade);
		let tipo = vulneravel[0];
		if (!tipo) {
			const livres = res.lefeu ? ELEMENTOS : ELEMENTOS.filter((k) => !rs[k]?.imunidade && !(Number(rs[k]?.value) > 0));
			const pool = livres.length ? livres : ELEMENTOS;
			for (let i = 0; i < 20 && !tipo; i++) {
				const d = await new Roll("1d6").evaluate();
				rolls.push(d);
				if (pool.includes(ELEMENTOS[d.total - 1])) tipo = ELEMENTOS[d.total - 1];
			}
			tipo ??= pool[0];
		}
		const r = await new Roll(`1[${tipo}]`).evaluate();
		rolls.push(r);
		try { await alvo.actor.applyDamageV2(r, 1); } catch (err) { console.warn(err); }
		ChatMessage.create({ rolls, content: `<h3>Metal Arco-Íris</h3><p>${alvo.name} sofre <b>+1 de ${NOME[tipo]}</b>${vulneravel.length ? " (vulnerável)" : ""}${res.lefeu ? ", apesar da imunidade lefeu a elementos" : ""}.</p>` });
	}

	const macro = (name, img, fn) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Arco 1 · Aventura 1 · gerado por av1-cabeca-de-bartram.js\n(${fn.toString()})();`
	});
	const macros = await Macro.createDocuments([
		macro("Av1 · No Rastro (testes estendidos)", ICO.rastro, macroRastro),
		macro("Av1 · Orcs Canibais", ICO.orc, macroOrcs),
		macro("Av1 · Conversar com Tanna-Toh", ICO.tanna, macroTanna),
		macro("Av1 · Ritual do Banquete", ICO.caldeirao, macroRitual),
		macro("Av1 · Metal Arco-Íris", ICO.arcoiris, macroMetal)
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

	await JournalEntry.create({
		name: "Arco 1 · Aventura 1 · Tragam-me a Cabeça de Bartram Zonnar",
		folder: pasta.JournalEntry,
		flags: FLAGS(),
		pages: [
			pagina("Guia do Mestre", `
				<blockquote><p>Enquanto todos estavam dormindo na Metais do Baixote Forja &amp; Armazém, o assistente de Belinda Arting fugiu pelas Colinas Centrais, levando consigo todas as armas já produzidas com o misterioso metal arco-íris. Os aventureiros acordam em sua primeira manhã no Forte Cabeça-de-Martelo para descobrir que já têm uma missão.</p></blockquote>
				<h2>O vilão e seu objetivo</h2>
				<p>Os "vilões" são os orcs canibais liderados por ${L(atores.aharadak)}: só querem encher a barriga. Por trás, Syvarian coordenou, através da Companhia dos Irmãos, a chantagem de ${L(atores.bartram)} e o roubo, para levar o metal a Valkaria e ao Dr. Vesper.</p>
				<h2>Fases</h2>
				${lista([
					"<b>Fase 0 · Normalidade:</b> o desjejum no salão comunal do Forte.",
					"<b>Fase 1 · Investigação Preliminar:</b> Belinda desesperada, a forja e a paliçada.",
					"<b>Fase 2 · No Rastro:</b> teste estendido até a colina calcinada.",
					"<b>Fase 3 · Emboscada:</b> oito orcs canibais.",
					"<b>Fase 4 · Informações:</b> os orcs se rendem; a primeira grande escolha.",
					"<b>Fase 5 · Encontro nas Centrais:</b> role nos Encontros nas Colinas Centrais.",
					"<b>Fase 6A · Rastreando os Criminosos</b> ou <b>6B · Informações de Tanna-Toh</b>.",
					"<b>Fase 7 · As Colinas Têm Olhos:</b> o Ritual do Banquete e Aharadak.",
					"<b>Fase 8 · Desfecho.</b>"
				])}
				<h2>Criaturas</h2>
				${lista([`${L(atores.orc)} (ND 1/4): 8 na emboscada, 14 no bando.`, `${L(atores.khalmyr)}, líder dos batedores.`, `${L(atores.aharadak)} (ND 1). Encontros: emboscada ND 2, Aharadak e bando ND 3.`, `Apoio: ${L(atores.bartram)} e ${L(atores.tanna)}.`])}
				<h2>Macros</h2>
				${lista([
					`${linkMacro("Rastro")}: os testes estendidos do rastro de Bartram (CD 12) e dos criminosos (CD 15), com a ajuda, as perícias de uso único e a colina calcinada.`,
					`${linkMacro("Orcs")}: dá os nomes de deuses aos tokens, espreita, rendição e Furtividade para chegar ao ritual.`,
					`${linkMacro("Tanna-Toh")}, ${linkMacro("Ritual")} e ${linkMacro("Metal")}.`
				])}
				<h3>Contingência: jogadores apáticos</h3>
				<p>Se o grupo só rola dados sem interagir, role uma vez nos Encontros nas Colinas Centrais. No fim da sessão, pergunte se um estilo mais focado em combate ou mais conduzido pelo Mestre agradaria mais.</p>`, 100),
			pagina("O Forte Cabeça-de-Martelo", `
				<p>Os personagens chegaram há no máximo um dia e estão hospedados na estalagem improvisada da Metais do Baixote. Ninguém conhece a região, ninguém tem assuntos pessoais aqui, ninguém tem pressa. Eles não se conhecem, a menos que tenham um histórico em comum.</p>
				<h3>A galera do Forte</h3>
				${lista(FORTE.map(([role, name]) => `${L(atores[role])}`))}
				<p>No desjejum estão o Sargento Morgan, Isabrine, Doran, Tarik, Moira e o velho inventor Arthemus Vesper. Descreva o quadro de avisos, mas ainda sem ler as missões. Belinda e Bartram não aparecem: ela já estaria trabalhando há uma hora.</p>`, 200),
			pagina("Fases 1 e 2 · Investigação e Rastro", `
				<blockquote><p>"Eu sabia que não devia ter confiado naquele traste! [...] Todos os meses de trabalho, todo o esforço de garimpar o metal... Tudo roubado por um palerma que não consegue nem forjar uma ferradura!"</p></blockquote>
				<p>A forja não foi arrombada (ninguém tranca portas no Forte). As sentinelas eram Nadine e Fermond; ninguém viu nada, porque as sentinelas olham para fora da paliçada.</p>
				${lista([
					"<b>Investigação ou Sobrevivência CD 10:</b> houve uma fuga; caixotes empilhados para escalar a paliçada.",
					"<b>15 ou mais:</b> o fujão se arranhou nos topos afiados das toras e caiu de mau jeito do outro lado.",
					"Bartram enrolou cada arma em panos. Fermond ouviu algo, mas tem medo de decepcionar o sargento.",
					"Rastros de poucas horas: ainda dá para capturá-lo. Belinda pede ao grupo, já que os soldados não podem deixar os postos."
				])}
				<p>Opcional: ${L(itemRole("carta"))}.</p>
				<h2>No rastro</h2>
				<p>Teste estendido aberto, complexidade baixa (3 sucessos), CD 12 e <b>+2 por teste depois do primeiro</b>. Sobrevivência é a perícia básica, mas cada um pode usar outra perícia justificada; uma pessoa por teste pode ajudar. Toda perícia que não seja Sobrevivência vale uma vez no teste inteiro. Cada sucesso revela um trecho da jornada: ele mancava, carregava muito peso, andava à noite sem lampião e não desacelerava.</p>
				${lista(["Sem nenhuma falha: o grupo percebe que Bartram estava sendo seguido.", "Com duas falhas: role uma vez nos Encontros nas Colinas Centrais (ou role quando quiser, pelo ritmo).", "Interações positivas com NPCs ou bons testes sociais podem dar dicas ou transformar uma falha em sucesso."])}
				<p>No fim, a colina pedregosa com a árvore retorcida, calcinada. Sobrevivência CD 12 mostra que Bartram seguiu sozinho; qualquer um vê que houve combate. Fase rápida, sem NPCs: o foco são os personagens.</p>
				<h3>Contingência: falha em rastrear</h3>
				<p>O grupo se perde nas trilhas e é emboscado pelos orcs, sem saber do encontro com os criminosos. A aventura continua.</p>
				<p>Macro: ${linkMacro("Rastro")}.</p>`, 300),
			pagina("Fases 3 e 4 · Emboscada e Informações", `
				<p>Bartram foi arrastado por um bando de bípedes: os orcs canibais. Afastando-se do local, Percepção contra a Furtividade dos batedores. Passando ou não, todos ouvem o ronco de um estômago e <b>"Carne fresca!"</b>.</p>
				<p><b>Oito ${L(atores.orc)}</b> (ND 2 o encontro), deixados para trás pelo primeiro bando. Deviam seguir os criminosos, mas os acharam perigosos demais, e os forasteiros sumiram num brilho vindo do céu. Armas toscas; só o líder, ${L(atores.khalmyr)}, tem a ${L(itemRole("adaga"))}: <b>a primeira pista</b>. Nomes: Khalmyr, Azgher, Thyatis, Lena, Wynna, Hyninn, Oceano e Tenebra (${L(tabNomes)}).</p>
				<p>Se os heróis perderem, são levados à caverna de Tanna-Toh para serem desmembrados vivos.</p>
				<h3>Relato da mesa original</h3>
				<p>O grupo arrasou este combate (sorte e entrosamento). Com iniciantes, use-o como está; calibre o combate final pelo desempenho aqui.</p>
				<h2>Os orcs canibais das Colinas</h2>
				<p>Uma única família, deformada por consanguinidade e pelo efeito divino das Centrais. Comem de tudo, mas preferem humanoides; já atormentaram as Dahllan Daninhas, mantidas à distância por Annabel. Cerca de 20 orcs com nomes de deuses: a ascensão ou a queda do deus se reflete no orc homônimo. Aharadak nasceu com quatro braços, o segundo par de carapaça rubra da Tormenta, e baniu Tanna-Toh.</p>
				<h2>Informações</h2>
				<p>Com um ou dois de pé e o grupo em vantagem, os orcs se rendem e contam a transação que viram. Três caminhos: Tanna-Toh, os criminosos (não leva a nada concreto) ou Bartram. <b>Desvios</b> antes do covil: nenhum, Bartram ferido; um (o normal), muito ferido e sem alguns membros; dois ou mais, morto. A primeira grande escolha dos jogadores.</p>`, 400),
			pagina("Fases 5 e 6 · Encontro, Criminosos e Tanna-Toh", `
				<p><b>Fase 5:</b> depois do primeiro combate, role nos Encontros nas Colinas Centrais (uma segunda vez se o grupo fizer dois desvios). O encontro vem antes do objetivo da cena.</p>
				<h2>6A · Rastreando os criminosos</h2>
				<p>Outro teste estendido, CD inicial 15: eles não estão feridos e levaram tochas. A trilha acaba num local calcinado: foram recolhidos pelo gog'magogue. Orcs e NPCs amistosos viram uma "luz muito brilhante no céu" ontem à noite.</p>
				<h2>6B · Informações de Tanna-Toh</h2>
				<blockquote><p>Se vocês esperavam que alguém chamada Tanna-Toh estivesse numa biblioteca, a decepção não poderia ser maior. [...] Tanna-Toh não passa de uma anciã sentada no chão, encurvada e frágil.</p></blockquote>
				<p>${L(atores.tanna)} teme estranhos; os orcs ou um teste social a acalmam (+5 para quem respeita os costumes das Centrais; ela valoriza livros, pergaminhos, informações e histórias, e quem nota a ligação dos orcs com os deuses). Conta tudo, inclusive como vencer Aharadak com a alma das Colinas. Macro: ${linkMacro("Tanna-Toh")}.</p>
				<h3>Contingência: pedindo reforços</h3>
				<p>Se o grupo voltar ao Forte, Bartram estará morto quando chegarem. Morgan aconselha a desistir, mas ${L(atores.nadine)} (parceira combatente iniciante) e ${L(atores.doran)} (parceiro assassino iniciante) saem escondidos. ${L(atores.fermond)} os denuncia, e ninguém mais desobedece Morgan.</p>
				<h3>Contingência: lavando as mãos</h3>
				<p>Se o grupo abandonar Bartram, chegam ao Forte ao anoitecer, de mãos vazias. Morgan diz que "isso acontece". Moira fica chocada e não colabora mais com facilidade; Fermond se aproxima (faria o mesmo); Belinda finge entender, mas chora pelo assistente. Um fim lúgubre, como algumas histórias nas Colinas.</p>`, 500),
			pagina("Fase 7 · As Colinas Têm Olhos", `
				<p>Não é uma tribo: uma família estendida em cavernas e tendas. Os orcs cercam o tronco onde Bartram está amarrado; ${L(atores.aharadak)} corta pedaços dele e os dá ao clã com a garra insetoide. Furtividade CD 15 para chegar sem ser visto (macro ${linkMacro("Orcs")}). Entre os entulhos, a ${L(itemRole("espada"))}.</p>
				<blockquote><p>"Hoje tem comida! Comida fresca, comida gritando! Hoje a gente não come cabra roubada, nem cachorro perdido, nem resto de urubu! Eu dou pra vocês carne boa! E se alguém se achar bom demais pra comer da carne que eu dou, pode vir e vai servir de carne também! Abram a boca que a comida chegou!"</p></blockquote>
				<p><b>Encontro ND 3:</b> 14 orcs canibais (Marah, Tenebra, Nimb, Arsenal, Thwor, Valkaria, Allihanna, Megalokk, Kally, Sszzaas, Lin-Wu, Glórienn, Ragnar, Keenn) e Aharadak.</p>
				<h3>O Ritual do Banquete</h3>
				${lista([
					"Na primeira rodada, Aharadak corta a mão de Bartram: 10 PV (de 20) e sangra 1 PV por rodada. O caldeirão borbulha.",
					"Enquanto ele sangrar: orcs +1 em ataques e heróis que respiram –1 em ataques.",
					"<b>Ação completa:</b> Aharadak corta um naco (–1 PV) e atira a um orc, que perde a ação padrão e ganha 5 PV temporários. Anule ocupando Aharadak ou salvando Bartram.",
					"Derrubar o caldeirão: Força CD 15; falha por 5 ou mais entorna sobre si (1d4 de ácido)."
				])}
				<p>Macro: ${linkMacro("Ritual")}.</p>
				<h3>Usando as Colinas contra Aharadak</h3>
				<p>Quase toda ideia criativa recebe um sim, desde que venha de dentro das Centrais (subterrâneo, habitantes, animais, plantas). Atirar pedras não conta.</p>
				${lista(["Derrubá-lo num fosso: +5 na manobra.", "Soterrá-lo: +5 no teste de manobra.", "Atrair parceiros animais atrai um parceiro extra do mesmo tipo.", "Armas de madeira das Centrais: +1 em ataque e dano contra ele.", "Magias com plantas ou pedras: CD +3."])}
				<h3>Metal arco-íris</h3>
				<p>+1 de dano de um elemento a que o alvo seja vulnerável; senão, role (${L(tabElemento)}), ignorando resistências e imunidades. Lefeu sofrem o dano apesar da imunidade. Contra habitantes das Colinas corrompidos (por enquanto Aharadak e Gaspar): +1 por elemento (+6) e o portador não é alvo dos membros lefeu. A essência de Tilliann rejeita a mácula. Misticismo: "é como se duas forças dentro das Colinas Centrais estivessem lutando entre si". Macro: ${linkMacro("Metal")}.</p>
				<h3>Contingência: derrota</h3>
				<p>Os orcs não matam os heróis: guardam-nos para depois. Bartram não tem a mesma sorte. As sentinelas caem fácil em Enganação, Intimidação ou até Diplomacia, e os orcs não entendem magia.</p>
				<h3>Relato da mesa original</h3>
				<p>O grupo original não falou com Tanna-Toh e achou que o metal funcionava contra qualquer coisa da Tormenta. Kiki fez amizade com o orc Lena, sobrevivente da emboscada, que lutou ao lado do grupo na batalha final.</p>`, 600),
			pagina("Fase 8 · Desfecho", `
				<p>Vencidos os orcs, o grupo volta ao Forte. Se Bartram estiver vivo, não tem condições de falar: pode ser interrogado na próxima aventura.</p>
				<p>${L(atores.belinda)} recebe o grupo como heróis e paga <b>T$ 50</b> a cada um, com estadia grátis na Metais até chegarem fregueses pagantes. Moira aprova a bondade, Nadine a ousadia, Edwina o conhecimento novo. O Sargento Morgan entra, todos se calam; ele não desfaz a cara amarrada, mas acena: <i>"bom trabalho, garotos"</i>.</p>
				<p><b>Todos passam para o 2º nível.</b></p>`, 700)
		]
	});

	ui.notifications.info("Fim dos Tempos · Arco 1 · Aventura 1 (Tragam-me a Cabeça de Bartram Zonnar): conteúdo criado.");
})();
