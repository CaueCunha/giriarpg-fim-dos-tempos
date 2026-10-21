/* =====================================================================
 * FIM DOS TEMPOS · ARCO 1 · ENCONTROS NAS COLINAS CENTRAIS
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Arco 1 · Colinas Centrais" com:
 *      - Os habitantes da tabela de encontros (Tolbert, Abner, Quimby, Gormaggor, Raguria, Arlo,
 *        Mungo Joe, o Homem-Bode, Ebenezer, Dona Erneshia, o Diabo das Colinas, as três sereias,
 *        Cletus Rigby, Nada Mais que a Verdade Reston, o Ladrão de Rabos, Elmer e Fortunata),
 *        os puristas caipiras e a aparição da mina (do compêndio) e os "Cães das Colinas" da
 *        tabela especial (Ayla, Ignis, Kiki, Rexthor, Arius, Chèvre e Timm).
 *      - Itens: a alquimia fajuta do Quimby, o ensopado da Raguria, a moeda-alma do Tolbert e o
 *        metal arco-íris do Cemitério Errante.
 *      - Tabelas: Encontros nas Colinas Centrais (detalhada), Encontros Especiais, Perseguições
 *        nas Centrais, Histórias do Herói Louco e Coisas que Ofendem Cletus Rigby.
 *      - Diário com as regras da tabela, uma página por encontro e handouts (panfleto purista,
 *        pergaminho do Evento, histórias do Herói Louco).
 *      - Macros: Encontro do Dia (a mesma que a Busca pelo Templo chama), Testes dos Encontros,
 *        Bênçãos e Maldições, Perseguição ao Diabo e Alquimia do Quimby.
 *   3. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "a1colinas".
 *
 * Feito a partir do código do sistema (master, out/2026); não foi testado num Foundry rodando.
 * Veja o guia a1-encontros-colinas.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "a1colinas";
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
			window: { title: "As Colinas Centrais: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para as Colinas Centrais.</p>
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
	const NOME_PASTA = "FdT · Arco 1 · Colinas Centrais";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#5a6a2a", flags: FLAGS() })).id;
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

	ATR_PERICIA.joga = "car";

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
	/* 2. Dados (fonte única para atores, tabelas, macros e diário)         */
	/* ------------------------------------------------------------------ */
	const R = `${T20I}/racas`;
	// tipo: "npc" viaja e pode se repetir; "parado" fica sempre no mesmo lugar; "local" é fixo
	// (descoberto uma vez); "errante" pode surgir em qualquer lugar, quantas vezes for.
	const ENC = [
		{ k: "tolbert", nome: "Tolbert", tipo: "npc", roles: ["tolbert"], img: `${T20I}/itens/gerais/instrumento-musical.webp`,
			resumo: "Bardo de duas moedas sobre os olhos (por baixo, só buracos vazios). Cada moeda é uma alma, e ele tem várias outras numa bolsa. Desafia os personagens para um <b>duelo musical</b>: aposta uma alma, o personagem aposta a própria.",
			mec: "Três testes de Atuação opostos contra Tolbert (+15). Quem perde a alma a entrega como moeda: não pode ser ressuscitado e não vai a nenhum Reino dos Deuses. Quem ganha tem uma \"alma extra\" (pode vender a alma sem consequências). Enterrar a moeda ganha no Cemitério Errante dá +1 num atributo, como uma noite lá (acumula, mas não no mesmo atributo).",
			uso: "Testes dos Encontros → Duelo musical" },
		{ k: "abner", nome: "Abner", tipo: "npc", roles: ["abner"], img: `${R}/qareen.webp`,
			resumo: "Adolescente qareen, pastor de Khalmyr totalmente fanático: quase tudo é \"uma bênção de Khalmyr\". Perturbado, mas inofensivo. Quer batizar os personagens sob Khalmyr.",
			mec: "Abençoa quem é gentil ou concorda com ele; amaldiçoa e ameaça os hostis. Efeito básico de <b>Bênção</b> (+1 em ataque e dano) ou <b>Perdição</b> (–1), até o fim da próxima cena.",
			uso: "Bênçãos e Maldições → Abner" },
		{ k: "quimby", nome: "Quimby Ulysses Arronax", tipo: "npc", roles: ["quimby"], img: `${R}/anao.webp`,
			resumo: "Anão vendedor de alquimia fajuta, numa carroça puxada por um gorloggh. Devoto de Hyninn: não engana além disso, mas solta \"nunca ouvi falar\" na conversa para achar outros devotos do Deus dos Ladrões.",
			mec: "Todo item alquímico custa <b>metade do preço</b>. Ao usar, 1d6: par funciona; ímpar funciona ao contrário (ácido, fogo e granada atingem o usuário, bálsamo causa dano, essência drena PM). Para um devoto de Hyninn revelado, ele avisa dos itens e indica um depósito a algumas horas com dois bálsamos e duas essências de verdade (pede que reponha).",
			uso: "Itens do Quimby + macro Alquimia do Quimby" },
		{ k: "gormaggor", nome: "Gormaggor", tipo: "parado", roles: ["gormaggor"], img: "icons/svg/ruins.svg",
			resumo: "Gigante que parece uma colina. A criatura mais antiga e poderosa das Centrais (a única maravilha original), velho demais e cansado: dorme quase sempre, já se fundiu às colinas e tem um braço preso. Deixou cair o cachimbo (feito de dois carvalhos) e não tem energia para pegá-lo.",
			mec: "Pôr o cachimbo na mão livre, enchê-lo (ele fuma quase qualquer planta) e acendê-lo conquista a amizade dele e uma fonte quase infinita (e tediosa) de informação: histórias do Herói Louco, o Diabo, o Cemitério. Lembra que \"há algum tempo\" o Herói Louco e o Rei Juiz passaram por ali. Com perspicácia: acordou quando a Tormenta começou a afetar as Colinas, e sente algo \"fazendo cócegas na terra\".",
			uso: "Tabela Histórias do Herói Louco" },
		{ k: "raguria", nome: "Raguria", tipo: "npc", roles: ["raguria"], img: `${R}/humano.webp`,
			resumo: "Bruxa caipira numa cabana afastada. Age como a \"bruxa má\" dos contos, mas não quer o mal dos personagens. Maligna, mas não perigosa se não for provocada. Conhece Cletus (não retribui a afeição dele) e sabe que \"algo ruim está se alastrando pelas Colinas\".",
			mec: "Gentileza: um prato especial do livro básico (uma porção para cada) ou o <b>Ensopado de Rabo de Lagarto e Olho de Sapo</b> (+1 na CD de magias arcanas). Rudeza: <b>Rogar Maldição</b> num deles (não pode se comunicar nem lançar magias, –5 em todos os testes, metade do deslocamento, até o dia seguinte ou o fim da próxima cena relevante), e sai levitando e gargalhando.",
			uso: "Bênçãos e Maldições → Raguria" },
		{ k: "arlo", nome: "Arlo \"Olho de Leite\"", tipo: "npc", roles: ["arlo"], img: `${R}/humano.webp`,
			resumo: "Caolho de olho leitoso, isolado, obcecado com sobrevivência. Acha que o Reinado vem tirar seus direitos e que \"algo sujo\" contamina as Centrais. Usa armas de pólvora. Dá informações do jeito mais paranoico possível e pode ajudar na caça ao Diabo.",
			mec: "Concurso de tiro: o personagem e Arlo fazem três testes de Pontaria (CD 15, 20 e 25). Mais sucessos vence (Arlo tem +10). Empate: a CD continua subindo +5.",
			uso: "Testes dos Encontros → Concurso de tiro" },
		{ k: "mungo", nome: "Mungo Joe", tipo: "npc", roles: ["mungo"], img: `${T20I}/itens/gerais/bebida-comum.webp`,
			resumo: "Alambiqueiro caipira de chapelão, jardineira, sem camisa, descalço, desdentado e alegre. Vende uma dose da bebida fortíssima por T$ 1. Simpatia: a primeira é de graça e ele bebe junto.",
			mec: "Cada dose: Fortitude CD 15 (+1 por dose anterior no mesmo dia). Passou: +1 PM temporário. Falhou: enjoado por uma cena; na segunda falha, inconsciente por 1d12 horas.",
			uso: "Testes dos Encontros → Dose do Mungo Joe" },
		{ k: "puristas", nome: "Encontro de Puristas Caipiras", tipo: "npc", roles: ["purista"], img: `${T20I}/ameacas/recruta-supremacista.png`,
			resumo: "Odiadores de não humanos que mal conhecem a ideologia purista, mas abraçaram tudo. Um pastor prega a \"palavra de Valkaria\". Humanos vistos são convidados; não humanos, atacados.",
			mec: "Em combate, <b>8 recrutas puristas</b>. Não lutam até a morte: fogem se acharem que correm perigo (os não humanos têm \"vantagens injustas\"). Com eles, o panfleto (handout no diário).",
			uso: "Encontro do Dia → colocar tokens", qtd: 8 },
		{ k: "bode", nome: "O Homem-Bode", tipo: "npc", roles: ["jonid"], img: "icons/svg/mystery-man.svg",
			resumo: "Druida alucinado que vive transformado em bode, com os bodes. Só se distingue de um bode com profundo conhecimento de animais ou flagrando-o ao acordar (volta à forma humana dormindo). Abordado, foge ou luta.",
			mec: "Com extrema cautela e boas rolagens, conta que virou bode depois que a família morreu da \"doença misteriosa\" (mutações do Evento e corrupção da Tormenta). Nome: <b>Jonid</b>; família: Elmara, Savik e Diridda. Com sucesso extremo em testes sociais e boa interpretação, lança Curar Ferimentos (2d8+2) ou outra magia divina de 1º círculo.",
			uso: "Bênçãos e Maldições → Curar Ferimentos" },
		{ k: "duasPedras", nome: "A Cidade Fantasma de Duas Pedras", tipo: "local", roles: ["aparicao"], img: "icons/svg/village.svg",
			resumo: "Comunidade mineradora fechada pela Guilda dos Mineradores de Yuvalin há mais de 10 anos (tábuas no portão, placas oficiais). Quinquilharias, esqueletos de quem desafiou a Guilda e uma mina selada só com tiras de madeira. Fantasmas medrosos (Zadok, Draslo, Emeline, Aurinda) tentam afastar visitantes com armas fantasmagóricas; conversando, contam o que houve.",
			mec: "Procurando na aldeia: duas rolagens de dinheiro e uma de itens na Tabela 8–1 (sempre ND 1). Na mina, uma <b>aparição</b> e um veio de <b>metal arco-íris</b>. Minerar ali atrai a ira da Guilda (que pode se aliar à Irmandade no fim do arco).",
			uso: "Encontro do Dia → colocar tokens" },
		{ k: "ebenezer", nome: "Ebenezer", tipo: "npc", roles: ["ebenezer"], img: `${T20I}/magias/premonicao.webp`,
			resumo: "Velho profeta herético de Thyatis. Oferece uma profecia para cada personagem, mas como aposta: se não se cumprir, Ebenezer errou e Thyatis lhe dá uma segunda chance; se se cumprir, o personagem terá de dar uma segunda chance a alguém. Ninguém é obrigado a aceitar.",
			mec: "O Mestre decide a profecia, que se resolve dentro da aventura. Não se cumpriu: o personagem ganha <b>+20 para gastar</b> em testes na próxima aventura (+5 num, +2 noutro...). Cumpriu: o Mestre pode <b>rolar de novo cinco testes</b> contra ele até o fim do arco.",
			uso: "Bênçãos e Maldições → Aposta de Ebenezer" },
		{ k: "museu", nome: "O Museu de Coisas Quase Vivas", tipo: "local", roles: ["erneshia"], img: "icons/svg/bones.svg",
			resumo: "Museu de taxidermia de três andares. Dona Erneshia, acolhedora, cobra T$ 1 (qualquer simpatia vale entrada grátis). Misturas de bichos e criaturas do folclore: o coelho chifrudo, o meia-perna, o Ladrão de Rabos, um \"homem-bode\" recriado... e muitas recriações do Diabo das Colinas, cuja história ela conta com alegria.",
			mec: "Na caçada ao Diabo, Erneshia pode ir junto como <b>parceira ajudante mestre</b> (+4 em Atletismo, Percepção e Sobrevivência).",
			uso: "Perseguição ao Diabo → com Erneshia" },
		{ k: "diabo", nome: "O Diabo das Colinas", tipo: "npc", roles: ["diabo"], img: "icons/svg/terror.svg",
			resumo: "Mito verdadeiro: criatura do tamanho de um anão, cabeça desproporcional, bocarra de dentes afiados, sempre sorrindo. O sétimo filho amaldiçoado ainda no ventre de um minerador avarento: nasceu não humano, matou a família e fugiu com o ouro. Aparece para viajantes e os convida a persegui-lo.",
			mec: "Quem o avista é perseguido para sempre: ele reaparece em todo <b>resultado par</b> desta tabela, além do resultado normal. Perseguição: o Diabo começa com 20 quadrados de vantagem e tem +17 em tudo; se abrir 50, some. Capturado, revela a riqueza e passa a ficar perto do covil com o pote de ouro (Tabela 8–1, dinheiro ND 7, ignorando 1 a 10).",
			uso: "Perseguição ao Diabo" },
		{ k: "sereias", nome: "Shanamarie, Shaylyne e Shadolenn", tipo: "parado", roles: ["shanamarie", "shaylyne", "shadolenn"], img: `${R}/sereia.webp`,
			resumo: "Sereias do rio. Cantam para atrair aventureiros; quem se aproxima é roubado e, se resistir, afogado. Depois fogem nadando.",
			mec: "Quem vê ou ouve: Vontade oposta à Atuação delas (+10). Falha não é magia: o personagem fica inclinado a se aproximar e acha que são amigáveis (Intuição também é oposta pela Atuação). Na aproximação, uma distrai (Atuação), outra lança Hipnotismo ou Sono (CD 14) e a terceira rouba (Furtividade e Ladinagem +10). Então nadam para longe (natação 12m).",
			uso: "Testes dos Encontros → Canto e furto das sereias" },
		{ k: "cletus", nome: "Cletus Rigby", tipo: "npc", roles: ["cletus"], img: `${R}/anao.webp`,
			resumo: "Anão mago caipira, numa torre periclitante de cabanas sobre cabanas, entulhada como a casa de um acumulador. Odeia pessoas e é ranzinza; só conversa depois de ganhar confiança aos poucos. Quando o grupo chega, está transformado num <b>gato</b>: se ninguém mexer em nada, deixa-os em paz; se mexerem, vira anão e xinga (em casos extremos, ataca, e o grupo dificilmente vence). A casa fica sobre muito metal arco-íris.",
			mec: "Entrar exige Fortitude CD 15 (o cheiro): falha deixa enjoado. Um arcanista ou bardo que ganhe a confiança dele e <b>nunca o tenha ofendido</b> aprende uma magia arcana de 1º círculo. Sabe que a Tormenta se infiltra na terra, mas não vai fazer nada (os outros não perceberam? Idiotas!). Não sabe nada dos vilões.",
			uso: "Testes dos Encontros → Cabana / Ofensas" },
		{ k: "reston", nome: "Nada Mais que a Verdade Reston", tipo: "npc", roles: ["reston"], img: `${T20I}/itens/gerais/pergaminho.webp`,
			resumo: "Devota fundamentalista de Tanna-Toh compilando uma etnografia das Colinas. Pede que os heróis contem suas histórias e registra tudo. Não pode mentir e sofre até para omitir. Saiu de uma comunidade apocalíptica de fanáticos (hoje só esqueletos) com a desculpa da etnografia, e precisou fazê-la de verdade.",
			mec: "Testes de Inteligência (+4) contra CD 10, 15 ou 20 para saber qualquer coisa da região. Já ouviu boatos do Cemitério Errante (não acredita) e conhece histórias do Herói Louco. Tem o <b>pergaminho do Evento</b> (handout): não dá, mas deixa copiar. Família: Nunca Esconderei Nada de Meus Irmãos (pai), A Mentira Faz a Deusa Chorar (mãe), Toda a Verdade (irmã).",
			uso: "Testes dos Encontros → Nada Mais que a Verdade sabe?" },
		{ k: "ladrao", nome: "O Ladrão de Rabos", tipo: "npc", roles: ["ladrao"], img: "icons/svg/eye.svg",
			resumo: "Mito verdadeiro: parece um cão sem pelos com vários rabos (de gambá, de cobra, de coiote...). Visto só de longe: fica mais distante, sem se mexer, quando alguém se aproxima. Só deixa ladrões chegarem perto (e, por eles, os colegas). Entidade que sussurra na mente e rouba rabos para dominar criaturas.",
			mec: "Um \"ladrão\" (a critério do Mestre) pode roubar um rabo: Ladinagem oposta à Percepção dele (+10). Roubado, ele implora e concede um <b>desejo</b> em troca: surge em até uma semana, distorcido de forma inofensiva (literal demais, ou primitivo/caipira). Na mesa original, roubou o rabo do minotauro Arius e o controlou em certos momentos.",
			uso: "Testes dos Encontros → Roubar um rabo" },
		{ k: "elmer", nome: "Elmer", tipo: "parado", roles: ["elmer"], img: `${T20I}/ameacas/dragao-filhote.png`,
			resumo: "O dragão mendigo: peludo, comprido, asas de morcego e oito membros. Quer um tesouro, mas é preguiçoso e não é feroz. Pede moedas contando que é o único do seu tipo. Viciado em achbuld.",
			mec: "Com moedas e simpatia, fala da plantação de achbuld dos Gallobalt (e tenta arrancar mais). Generosidade demais: vira uma peste que segue o grupo. Fazê-lo sonhar com algo específico (Atuação, Diplomacia ou outra perícia) e tomar achbuld com ele leva o personagem ao sonho, de onde pode trazer um objeto: até duas melhorias, ou 1d10 × 100 Tibares. Nada mágico nem riquezas enormes.",
			uso: "Testes dos Encontros → Sonho de Elmer" },
		{ k: "fortunata", nome: "Fortunata", tipo: "npc", roles: ["fortunata"], img: `${T20I}/itens/gerais/baralho.webp`,
			resumo: "Jogadora e clériga de Nimb (talvez um avatar do Deus do Caos). Propõe Wyrt, mas aposta em qualquer coisa, sobretudo no resultado das aventuras. Prefere apostar segredos a dinheiro. Diz que Ebenezer \"não passa de um charlatão\" e aposta na caçada ao Diabo, se houver.",
			mec: "Jogatina +15. Na 1ª derrota, conta o segredo do tabuleiro. Na 2ª, conta do Cemitério Errante: quem ouve fica desorientado e \"perde\" algumas horas, e na próxima rolagem da tabela o grupo pode achar o Cemitério automaticamente. Depois disso, histórias do Herói Louco.",
			uso: "Testes dos Encontros → Aposta com Fortunata" },
		{ k: "cemiterio", nome: "O Cemitério Errante", tipo: "errante", roles: [], img: `${T20I}/itens/gerais/terra-de-cemiterio.webp`,
			resumo: "Local de luto pela divindade de Tilliann. Tumbas simples feitas por mortais e, no centro, uma tumba enorme de manufatura excepcional, com lápide lisa. Tristeza, melancolia e paz: uma saudade de algo que não se conhece. Pode surgir em qualquer lugar, várias vezes.",
			mec: "<b>10 unidades de metal arco-íris</b> no chão (arma leve 1, uma mão 2, duas mãos ou armadura leve 4, armadura pesada 8). Dormir ali: não recupera PM, mas +1 num atributo por uma semana; a segunda noite torna o bônus permanente. Quem é enterrado ali não vai aos Reinos dos Deuses; a energia passa à família. Um PJ enterrado não ressuscita, mas o próximo personagem do jogador ganha +1 num atributo.",
			uso: "Bênçãos e Maldições → Noite no Cemitério" }
	];
	const ESPECIAIS = [
		{ k: "ayla", nome: "Aylarianna Purpúrea (Ayla)", roles: ["ayla"], img: `${R}/silfide.webp`,
			resumo: "A fada mais honesta de Arton: caixeira-viajante alquimista. Bálsamos e venenos funcionam; elixir de crescer cabelo e poção de sumir verruga, não. Escondida desde que um cliente insatisfeito a acusou (a culpada é a \"irmã gêmea\" que ela \"tem\").",
			mec: "Recruta revendedores para o <b>Empório Purpúrea</b> (funil invertido, não pirâmide!): kit de cosméticos de T$ 50 e T$ 10 por mês (pagos a Belinda, no Forte). O revendedor recruta NPCs (Diplomacia ou, francamente, Enganação), que compram dele o kit e pagam T$ 10 por mês até perceberem o golpe." },
		{ k: "ignis", nome: "Ignis Crae", roles: ["ignis"], img: `${R}/golem.webp`,
			resumo: "Golem de metal, paladino de Thyatis desde o nascimento, fundador da Ordem da Cavalaria da Redenção, que oferece recomeço a quem está no fundo do poço.",
			mec: "Parceiro <b>guardião veterano</b> (+3 na Defesa) enquanto achar que o grupo segue os preceitos de Thyatis. Num rumo sombrio (vício, roubo, corrupção), tenta recrutá-los para a Ordem: serve de penitência a devotos que quebraram suas Obrigações & Restrições." },
		{ k: "kiki", nome: "Kirzanaath \"Kiki\" Odello", roles: ["kiki"], img: `${R}/medusa.webp`,
			resumo: "Medusa barda atrás de histórias, cerveja e fama. Esconde a raça até confiar. Teme virar monstruosa e quer saber o que houve com a mãe (obcecada por um tema que nem ela conhecia, fugiu com a filha e foi levada por desconhecidos). Cozinheira e boa em \"ler\" pessoas.",
			mec: "Parceira <b>ajudante veterana</b> (+2 em Atuação, Investigação e Ofício [cozinheiro]). Conta qualquer história do Herói Louco e prepara qualquer prato especial do livro básico sem custo. Fala da mãe e entra em negação." },
		{ k: "rexthor", nome: "Rexthor", roles: ["rexthor"], img: `${R}/humano.webp`,
			resumo: "O campeão das profundezas: dos Ermos Púrpuras, escravizado e posto nas arenas de Wynlla, libertado por uma aposta de uma mulher misteriosa ao sobreviver ao Abismo. Confia nas \"Deusas\" da Sorte, do Azar e do Caos (Nimb). Ingênuo, leal e bondoso por trás da fachada de exercícios, lutas e indecência.",
			mec: "Parceiro <b>fortão veterano</b>. Pode desafiar um combatente do grupo (sobretudo se houver magos) para um duelo \"amigável\": Defesa 18, 30 PV, +4 em resistências, Luta +10, 1d8+4 de impacto (a ficha dele já tem isso)." },
		{ k: "arius", nome: "Arius Gorgonius Dubitatius", roles: ["arius"], img: `${R}/minotauro.webp`,
			resumo: "Minotauro nobre de Tiberus, mago, filósofo e devoto de Tanna-Toh. Afastado pelo pai para uma legião longínqua, partiu atrás de conhecimento e só volta quando provar que a força não é o único poder. Dois metros, cabelos loiros trançados, postura encurvada, inseguro e empolgado com saber novo.",
			mec: "Dá qualquer informação ou pista à escolha do Mestre (Herói Louco, Templo do Vácuo, espaço de masmorra) e decifra idiomas desconhecidos, como a língua dos gnomos." },
		{ k: "cacadores", nome: "Chèvre e Timm", roles: ["chevre", "timm"], img: `${R}/satiro.webp`,
			resumo: "Caçadores de recompensas. Chèvre: sátiro malandro, envenenador, infiltrador e ladrão, com uma flauta-zarabatana de dardos envenenados. Timm: mago humano pomposo e enigmático, obcecado por fogo, que some numa explosão de chamas e fumaça. Põem o contrato acima de tudo.",
			mec: "Chèvre é parceiro <b>perseguidor veterano</b>; Timm, <b>destruidor (fogo) veterano</b>. No fim de qualquer interação, 50% de chance de trair o grupo (levam algo que o grupo precisa ou um NPC): disputa de Iniciativa do grupo contra a dupla (+10)." }
	];
	const PERSEG = [
		[1, 6, "Nada", null],
		[7, 8, "Obstáculo: pilha de pedras soltas bloqueia o caminho", { tipo: "obstaculo", teste: "for", cd: 15 }],
		[9, 10, "Obstáculo: lama deixa o chão escorregadio", { tipo: "obstaculo", teste: "acro", cd: 20 }],
		[11, 12, "Obstáculo: pedras rolam", { tipo: "obstaculo", teste: "refl", cd: 20 }],
		[13, 14, "Obstáculo: nuvem de poeira obscurece a visão", { tipo: "obstaculo", teste: "perc", cd: 20 }],
		[15, 16, "Atalho: um trobo no qual se pode montar", { tipo: "atalho", teste: "ades", cd: 20 }],
		[17, 18, "Atalho: caminho curto, mas bloqueado", { tipo: "atalho", teste: "for", cd: 15 }],
		[19, 20, "Atalho: passagem labiríntica", { tipo: "atalho", teste: "perc", cd: 20 }]
	];
	const HISTORIAS = [
		["O Buquê", "O Herói Louco era apaixonado pela Guerreira Distante, como quase todo mundo naquela época. Mas ela sempre ficava longe: quanto mais ele se aproximava, mais ela se afastava. Ele pensou num presente que ela pudesse achar depois, com uma carta de amor. O Bicho Bruxo sugeriu um buquê, mas o maior buquê do mundo. Sem saber qual era o tamanho a superar, o Herói Louco colheu todas as flores do mundo, e depois as outras plantas, até o mundo virar um deserto. O Rei Juiz, furioso, bateu na cabeça dele com a espada. O buquê caiu e, como tinha todas as plantas do mundo, se espalhou pelo mundo todo. A Guerreira Distante nunca soube que o Herói Louco tinha tentado fazer um buquê para ela."],
		["Os Filhos", "Um dia o Herói Louco teve filhos. Eram muitos e estavam sempre com fome. O Bicho Bruxo sugeriu fechá-los numa caverna enquanto ele buscava comida, e o Herói Louco derrubou umas pedras na entrada. No caminho, encontrou o Rei Juiz, que o convidou para um passeio; sem querer contar a verdade, ele aceitou. Quando o passeio acabou, já tinha esquecido o que ia fazer. Ao lembrar, correu à caverna: na fome, os filhos tinham devorado uns aos outros. O Rei Juiz puniu os filhos canibais, transformando-os em monstros. O Herói Louco ficou triste, mas pelo menos agora eram menos filhos, mais fáceis de cuidar."],
		["A Cabeça", "Uma vez o Herói Louco fez algo errado e o Rei Juiz cortou a cabeça dele. A cabeça rolou para longe, e o corpo foi procurá-la. Por sorte, ela parou bem perto dos pés da Guerreira Distante, que não a viu chegar e por isso não se afastou. A cabeça ficou muito feliz e criava coragem para declarar seu amor quando os filhos da Guerreira Distante viram aquilo e a levaram embora, porque sabiam que ela queria ficar longe. A cabeça ficou muito triste, mas então o corpo a achou, e pelo menos os dois continuaram juntos."],
		["Atrás da Porta", "Uma vez o Herói Louco achou uma colina que ninguém nunca tinha visto. Atrás dela, só um vale vazio. Pensou que seria um bom presente para a Guerreira Distante: se ela queria ficar longe, poderia ficar ali, onde ninguém ia. Como não conseguia chegar perto dela, o Bicho Bruxo deu uma ideia: ele guardaria a colina e o Herói Louco desenharia um caminho no chão até o presente. Ela seguiu o caminho, mas o Bicho Bruxo disse que o presente era dele, sem mencionar o Herói Louco, e fugiu. A Guerreira Distante foi ao vale antes que o Herói Louco pudesse desmentir. Ele ficou desolado, mas pelo menos ela estava feliz."],
		["A Casa", "Uma vez o Herói Louco lembrou por que vagava havia tanto tempo: tinha saído para comprar comida para os filhos. Tinha esquecido que tinha filhos, então fazia sentido não lembrar da compra. Mas não sabia mais o caminho de casa. Tentou perguntar à Guerreira Distante, que estava longe demais para ouvir, e não lembrava de mais ninguém. Vagando, encontrou o Rei Juiz, que ficou furioso: que tipo de pai esquece que tem filhos? Bateu nele como punição, e isso o fez andar ainda mais devagar. Ele nunca chegou em casa. De qualquer forma, a casa já tinha sido destruída e os filhos estavam mortos. Pelo menos ele não lembrava deles, então não ficou triste."],
		["A Coisa", "Certa vez o Herói Louco percebeu que tinha esquecido uma coisa, mas, como tinha esquecido, não lembrava o que era. A Guerreira Distante estava ainda mais longe que de costume e não ouviu. O Rei Juiz, como sempre, estava furioso com ele e não ajudou. Então veio o Larápio Ligeiro e disse que conhecia um lugar escondido onde ficavam as coisas escondidas; talvez a coisa estivesse lá. O Herói Louco procurou, mas nunca soube se tinha achado, porque não sabia o que era. O Rei Juiz olhou feio para o Larápio Ligeiro, mas, por alguma razão, não bateu nele como sempre batia no Herói Louco."]
	];
	const OFENSAS = ["Chamá-lo de feiticeiro.", "Chamá-lo de \"Rigby\".", "Retirar qualquer item, por menor que seja, da cabana.", "Falar a palavra \"choupana\".", "Chamar as Colinas Centrais de montanhas.", "Ter cabelo loiro.",
		"Ter um animal batizado em homenagem a alguém famoso.", "Cantar.", "Pedir para ser curado.", "Mencionar Abner ou Tolbert.", "Falar mal de Raguria.", "Falar sobre o clima.", "Oferecer comida.",
		"Dizer sim a ele três ou mais vezes seguidas.", "Chamar um cajado de bastão.", "Vestir a cor amarela.", "Mencionar Doherimm.", "Um erro de gramática à escolha do Mestre (\"para mim fazer\", \"esteje\", \"com nós\"...).", "Qualquer coisa que o Mestre deseje (pode mudar no meio da conversa)."];
	const SEGREDO_TABULEIRO = "\"Quem tem o tabuleiro é Khalmyr, mas quem move as peças é Nimb. Já ouviu este ditado? Depois quem tinha o tabuleiro era Tauron, mas ele morreu. Agora quem tem o tabuleiro é Valkaria. Ela ficou presa durante muito tempo, enquanto Khalmyr e Nimb jogavam! Diga-me uma coisa: se apenas Nimb permaneceu constante... Será que o tabuleiro nunca foi trocado em todo esse tempo?\"";

	/* ------------------------------------------------------------------ */
	/* 3. Atores                                                            */
	/* ------------------------------------------------------------------ */
	const NEUTRO = 0;
	const atores = {};
	// Habitantes que não são para lutar: ficha mínima, só para ter token e os bônus do livro.
	const figura = async (role, name, img, bio, o = {}) => {
		atores[role] = await criarNPC({
			name, img, role, bio,
			tokenName: o.tokenName ?? name.split(/[,(]/)[0].trim(),
			link: true,
			disposition: o.disposition ?? NEUTRO,
			nd: o.nd ?? 1,
			cd: o.cd ?? 15,
			tipo: o.tipo ?? "hum",
			papel: o.papel ?? "special",
			atr: o.atr ?? { for: 0, des: 1, con: 1, int: 1, sab: 1, car: 2 },
			pv: o.pv ?? 20,
			def: o.def ?? 15,
			walk: o.walk ?? 9,
			swim: o.swim,
			tamanho: o.tamanho,
			pericias: o.pericias ?? {},
			items: o.items ?? [],
			sentidos: o.sentidos,
			raca: o.raca
		});
		return atores[role];
	};
	const bioDe = (e, extra = "") => p(e.resumo, `<b>Mecânica:</b> ${e.mec}`, extra || "Ficha mínima (inferida): só para ter token e os bônus que o livro dá. Ajuste à vontade.");
	const E = Object.fromEntries([...ENC, ...ESPECIAIS].map((e) => [e.k, e]));

	await figura("tolbert", "Tolbert, o Bardo das Almas", `${R}/humano.webp`, bioDe(E.tolbert), { pericias: { atua: 15, intu: 8, vont: 10 }, atr: { for: 0, des: 2, con: 1, int: 2, sab: 2, car: 5 } });
	await figura("abner", "Abner, Pastor de Khalmyr", `${R}/qareen.webp`, bioDe(E.abner), { pericias: { reli: 6, vont: 6 }, atr: { for: 0, des: 0, con: 0, int: 0, sab: 3, car: 2 }, raca: "Qareen" });
	await figura("quimby", "Quimby Ulysses Arronax", `${R}/anao.webp`, bioDe(E.quimby), { pericias: { dipl: 8, enga: 8, ofi0: 6 }, raca: "Anão", walk: 6 });
	await figura("gormaggor", "Gormaggor, o Gigante-Colina", `${T20I}/ameacas/ogro.png`, bioDe(E.gormaggor, "Ficha simbólica (inferida): ele não luta, mal se mexe e tem um braço preso nas colinas. Se precisar, trate-o como invencível."),
		{ nd: 20, pv: 999, def: 40, tamanho: "col", tipo: "hum", walk: 0, atr: { for: 10, des: -2, con: 10, int: 1, sab: 4, car: 2 } });
	await figura("raguria", "Raguria, a Bruxa Caipira", `${R}/humano.webp`, bioDe(E.raguria), { pericias: { mist: 12, vont: 10, intu: 8 }, atr: { for: -1, des: 1, con: 1, int: 2, sab: 4, car: 3 } });
	await figura("arlo", "Arlo \"Olho de Leite\"", `${R}/humano.webp`, bioDe(E.arlo), { pericias: { pont: 10, sobr: 8, perc: 6 }, atr: { for: 1, des: 3, con: 2, int: 0, sab: 2, car: -1 },
		items: [distancia("Mosquete", `${T20I}/itens/equipamentos/mosquete.webp`, { dano: "2d8", tipo: "perfuracao", critM: 19, critX: 3, alcance: "medio" })] });
	await figura("mungo", "Mungo Joe, o Alambiqueiro", `${R}/humano.webp`, bioDe(E.mungo), { pericias: { fort: 10, ofi0: 8 }, atr: { for: 2, des: 0, con: 4, int: 0, sab: 1, car: 2 } });
	await figura("jonid", "Jonid, o Homem-Bode", "icons/svg/mystery-man.svg", bioDe(E.bode), {
		pericias: { sobr: 8, ades: 8, furt: 6, cura: 6 }, atr: { for: 1, des: 2, con: 1, int: 0, sab: 3, car: -1 },
		items: [magia("Curar Ferimentos", `${T20I}/magias/curar-ferimentos.webp`, p("Recupera 2d8+2 PV."), { exec: "action", alcance: "touch", rolls: [["Cura", [["2d8+2", "curapv"]]]] })] });
	await figura("ebenezer", "Ebenezer, Profeta de Thyatis", `${R}/humano.webp`, bioDe(E.ebenezer), { pericias: { reli: 10, intu: 10 }, atr: { for: -1, des: 0, con: 0, int: 2, sab: 4, car: 2 } });
	await figura("erneshia", "Dona Erneshia, Taxidermista", `${R}/humano.webp`, bioDe(E.museu, "Parceira ajudante mestre só na caçada ao Diabo: +4 em Atletismo, Percepção e Sobrevivência. A macro Perseguição ao Diabo soma isso."),
		{ pericias: { atle: 8, perc: 10, sobr: 10, ofi0: 10 }, atr: { for: 1, des: 1, con: 2, int: 3, sab: 3, car: 2 } });
	await figura("diabo", "O Diabo das Colinas", "icons/svg/terror.svg", bioDe(E.diabo, "+17 em todas as perícias relevantes (o livro não dá mais nada). Defesa e PV inferidos, para o caso de alguém tentar segurá-lo."), {
		disposition: -1, nd: 7, tipo: "mon", tamanho: "peq", pv: 60, def: 24, walk: 12,
		pericias: { atle: 17, acro: 17, refl: 17, fort: 17, vont: 17, perc: 17, furt: 17, inic: 17, ades: 17, luta: 17, enga: 17, sobr: 17 },
		atr: { for: 3, des: 5, con: 3, int: 1, sab: 3, car: 2 } });
	for (const [r, n] of [["shanamarie", "Shanamarie"], ["shaylyne", "Shaylyne"], ["shadolenn", "Shadolenn"]]) {
		await figura(r, `${n}, Sereia do Rio`, `${R}/sereia.webp`, bioDe(E.sereias), {
			disposition: -1, swim: 12, walk: 6, raca: "Sereia",
			pericias: { atua: 10, furt: 10, ladi: 10, vont: 6, perc: 6 },
			items: [magia(r === "shaylyne" ? "Hipnotismo" : "Sono", `${T20I}/magias/${r === "shaylyne" ? "hipnotismo" : "sono"}.webp`, p("Vontade CD 14."), { exec: "action", alcance: "short", save: "Vontade CD 14" })] });
	}
	await figura("cletus", "Cletus Rigby, o Mago Caipira", `${R}/anao.webp`, bioDe(E.cletus, "Ficha inferida: forte o bastante para que o grupo dificilmente vença. Veja a tabela Coisas que Ofendem Cletus Rigby."), {
		nd: 10, pv: 120, def: 26, walk: 6, raca: "Anão", pm: 60,
		pericias: { mist: 20, vont: 18, conh: 15, fort: 12, refl: 8 }, atr: { for: 0, des: 1, con: 3, int: 6, sab: 2, car: -1 },
		items: [magia("Bola de Fogo", `${T20I}/magias/bola-de-fogo.webp`, p("6d6 de fogo numa esfera de 6m (Reflexos CD 24 reduz à metade)."), { tipoMagia: "arc", circulo: 2, exec: "action", alcance: "medium", save: "Reflexos reduz à metade", rolls: [["Dano", [["6d6", "fogo"]]]] })] });
	await figura("reston", "Nada Mais que a Verdade Reston", `${R}/humano.webp`, bioDe(E.reston), { pericias: { conh: 8, reli: 8, inve: 8 }, atr: { for: -1, des: 0, con: 0, int: 4, sab: 2, car: 1 } });
	await figura("ladrao", "O Ladrão de Rabos", "icons/svg/eye.svg", bioDe(E.ladrao), { tipo: "esp", pericias: { perc: 10, furt: 15, vont: 12 }, tamanho: "med" });
	await figura("elmer", "Elmer, o Dragão Mendigo", `${T20I}/ameacas/dragao-filhote.png`, bioDe(E.elmer, "Ficha inferida: preguiçoso demais para lutar."), { tipo: "mon", tamanho: "gra", nd: 5, pv: 90, def: 20, fly: 12, pericias: { dipl: 8, enga: 10, perc: 8 } });
	await figura("fortunata", "Fortunata, Clériga de Nimb", `${R}/humano.webp`, bioDe(E.fortunata), { pericias: { joga: 15, enga: 10, intu: 10 }, atr: { for: 0, des: 2, con: 1, int: 2, sab: 3, car: 4 } });

	atores.purista = await clonarAmeaca("npoNBPUXKVObgYTY", "Recruta Purista Caipira", { role: "purista", bio: p(E.puristas.resumo, `<b>Mecânica:</b> ${E.puristas.mec}`) });
	atores.aparicao = await clonarAmeaca("MKKB4eECVXAjyvRy", "Aparição da Mina de Duas Pedras", { role: "aparicao", bio: p("Assombra a mina selada pela Guilda dos Mineradores de Yuvalin, na Cidade Fantasma de Duas Pedras. Os fantasmas da aldeia (Zadok, Draslo, Emeline, Aurinda) são outra coisa: medrosos, só tentam espantar visitantes.") });

	await figura("ayla", "Aylarianna Purpúrea (Ayla)", `${R}/silfide.webp`, bioDe(E.ayla), { tamanho: "min", fly: 12, raca: "Sílfide", pericias: { enga: 12, dipl: 10, ofi0: 10 } });
	await figura("ignis", "Ignis Crae, Paladino de Thyatis", `${R}/golem.webp`, bioDe(E.ignis), { tipo: "con", raca: "Golem", pericias: { reli: 8, vont: 8 } });
	await figura("kiki", "Kirzanaath \"Kiki\" Odello", `${R}/medusa.webp`, bioDe(E.kiki), { raca: "Medusa", pericias: { atua: 10, inve: 10, ofi0: 8 } });
	await figura("rexthor", "Rexthor, Campeão das Profundezas", `${R}/humano.webp`, bioDe(E.rexthor, "Ficha do duelo amigável do livro: Defesa 18, 30 PV, +4 em testes de resistência, Luta +10, 1d8+4 de impacto."), {
		pv: 30, def: 18, atr: { for: 4, des: 2, con: 3, int: -1, sab: 0, car: 1 },
		pericias: { luta: 10, fort: 4, refl: 4, vont: 4, atle: 8, inic: 4 },
		items: [arma("Socos e Chutes", "icons/svg/sword.svg", { dano: "1d8", tipo: "impacto", extra: [["4", ""]], desc: p("Luta +10, 1d8+4 de impacto (duelo amigável).") })] });
	await figura("arius", "Arius Gorgonius Dubitatius", `${R}/minotauro.webp`, bioDe(E.arius), { raca: "Minotauro", pericias: { conh: 10, mist: 8, reli: 6 } });
	await figura("chevre", "Chèvre, o Sátiro", `${R}/satiro.webp`, bioDe(E.cacadores), { raca: "Sátiro", pericias: { inic: 10, furt: 10, ladi: 10, pont: 8 } });
	await figura("timm", "Timm, o Piromante", `${R}/humano.webp`, bioDe(E.cacadores), { pericias: { inic: 10, mist: 10 } });

	/* ------------------------------------------------------------------ */
	/* 4. Itens                                                             */
	/* ------------------------------------------------------------------ */
	const itemDoc = (role, name, type, img, html, system = {}) => ({ name, type, img, folder: pasta.Item, flags: FLAGS(role), system: { description: { value: html }, ...system } });
	const QUIMBY = {
		acido: { nome: "Água Feroz Limpa-Calhas do Quimby Limpinho! (ácido)", img: "acido", preco: 5, bula: "Também ótima para desentupir as vias aéreas ou para dar um toque especial em qualquer bebida!", efeito: "2d4 de ácido numa criatura em alcance curto (Reflexos reduz à metade).", dano: "2d4[acido]" },
		balsamo: { nome: "Emplastro Milagroso Cura-Tudo do Dr. Quimby! (bálsamo restaurador)", img: "balsamo-restaurador", preco: 5, bula: "Garantido para todas as doenças, maldições, ferimentos e indigestões!", efeito: "Recupera 2d4 PV (ação completa).", cura: "2d4" },
		essencia: { nome: "Tônico Revigorante do Espírito e da Mente do Feiticeiro Quimby! (essência de mana)", img: "essencia-mana", preco: 25, bula: "Uma fórmula secreta confiada pelo próprio Vectorius ao maior mercador de poções mágicas do Mercado nas Nuvens!", efeito: "Recupera 1d4 PM.", pm: "1d4" },
		fogo: { nome: "Óleo Fulgurante Aquecedor de Fogueira do Professor Quimby! (fogo alquímico)", img: "fogo-alquimico", preco: 5, bula: "O maior avanço alquímico da Academia Arcana para dar uma faísca a mais nas noites frias de acampamento!", efeito: "1d6 de fogo e em chamas numa criatura em alcance curto (Reflexos reduz à metade e evita as chamas).", dano: "1d6[fogo]" },
		granada: { nome: "Estalinho Bangue-Bangue do Tio Quimby! (bomba)", img: "bomba", preco: 25, bula: "Brinquedo de criança divertido para a família inteira! *O Tio Quimby não se responsabiliza por membros perdidos ou desfigurações.", efeito: "6d6 de impacto em 3m de um ponto em alcance curto (Reflexos reduz à metade).", dano: "6d6[impacto]" }
	};
	const itens = await Item.createDocuments([
		...Object.entries(QUIMBY).map(([k, q]) => itemDoc(`quimby_${k}`, q.nome, "consumivel", `${T20I}/itens/gerais/${q.img}.webp`,
			p(`<i>"${q.bula}"</i>`, `<b>Normal:</b> ${q.efeito}`, "<b>Alquimia fajuta:</b> metade do preço. A cada uso, 1d6: par funciona; ímpar, ao contrário (o dano cai no usuário, o bálsamo fere, a essência drena PM). Use a macro <i>Colinas · Alquimia do Quimby</i> com o token de quem usa selecionado (e o alvo mirado)."),
			{ qtd: 1, preco: q.preco, peso: 0.5, espacos: 0.5, tipo: "", subtipo: "" })),
		itemDoc("ensopado", "Ensopado de Rabo de Lagarto e Olho de Sapo", "consumivel", `${T20I}/itens/gerais/panela.webp`,
			p("Prato especial de Raguria: o típico conteúdo fumegante do caldeirão de uma bruxa. Não é apetitoso, mas põe o comensal em contato com seu lado místico.", "<b>Efeito:</b> +1 na CD das suas magias arcanas. A critério do Mestre, bônus em Misticismo e outras perícias ligadas a magia ou ao sobrenatural. A macro <i>Bênçãos e Maldições</i> aplica o efeito."),
			{ qtd: 1, preco: 0, peso: 0.5, espacos: 0.5, tipo: "", subtipo: "" }),
		itemDoc("moedaAlma", "Moeda-Alma de Tolbert", "tesouro", `${T20I}/itens/gerais/joia-familia.webp`,
			p("Uma moeda que é uma alma, ganha num duelo musical contra Tolbert. Uma \"alma extra\": o personagem pode vender a alma sem consequências (o Mestre decide o que mais isso significa).", "Enterrada no Cemitério Errante, aumenta um atributo em +1, como uma noite lá (acumula com o bônus de dormir no Cemitério, mas não no mesmo atributo)."),
			{ qtd: 1, preco: 0, peso: 0, espacos: 0 }),
		itemDoc("metal", "Metal Arco-Íris (unidade)", "tesouro", `${T20I}/itens/gerais/metal-arco-iris.webp`,
			p("Minério nascido da essência de Tilliann, só encontrado nas Colinas Centrais. 1 unidade = arma leve; 2 = arma de uma mão; 4 = arma de duas mãos ou armadura leve; 8 = armadura pesada.", "Armas de metal arco-íris causam +1 de dano do elemento a que o alvo é vulnerável (ou um sorteado com 1d6), ignorando resistências, ferem lefeu e somam +1 por elemento contra habitantes corrompidos das Centrais."),
			{ qtd: 1, preco: 0, peso: 1, espacos: 1 })
	]);
	const itemPorRole = (r) => itens.find((i) => i.getFlag("world", "fdtRole") === r);

	/* ------------------------------------------------------------------ */
	/* 5. Tabelas                                                           */
	/* ------------------------------------------------------------------ */
	const tabela = (role, name, img, formula, description, linhas) => RollTable.create({
		name, img, folder: pasta.RollTable, flags: FLAGS(role), formula, replacement: true, displayRoll: true, description,
		results: linhas.map(([lo, hi, nome, desc]) => ({ type: "text", range: [lo, hi], weight: hi - lo + 1, name: nome, description: desc ?? "" }))
	});
	const tabelas = {};
	tabelas.enc = await tabela("tabelaEncontros", "Encontros nas Colinas Centrais (detalhada)", "icons/svg/village.svg", "1d20",
		"Ao sair do Forte, ou uma por dia de viagem (um hexágono). Personagens se repetem; locais ficam fixos depois de achados. A macro Encontro do Dia faz isso e guarda o que já foi visto.",
		ENC.map((e, i) => [i + 1, i + 1, e.nome, `${e.resumo} <b>Mecânica:</b> ${e.mec}`]));
	tabelas.esp = await tabela("tabelaEspeciais", "Encontros Especiais (Cães das Colinas)", `${R}/silfide.webp`, "1d6",
		"Os PJs da mesa original como NPCs. Role quando a tabela normal der um resultado inviável (repetir um local ou NPC fixo). Eles não se conhecem nem formam um grupo.",
		ESPECIAIS.map((e, i) => [i + 1, i + 1, e.nome, `${e.resumo} <b>Mecânica:</b> ${e.mec}`]));
	tabelas.perseg = await tabela("tabelaPerseguicao", "Perseguições nas Centrais", "icons/svg/falling.svg", "1d20",
		"Uma rolagem por rodada de perseguição. Obstáculo: todos testam; quem falha anda metade. Atalho: quem tenta e passa anda o dobro; quem falha anda metade. Qualquer falha causa 1d6 de dano (escorregão, topada, coice, sufocamento...).",
		PERSEG.map(([lo, hi, nome, t]) => [lo, hi, nome, t ? `${t.tipo === "atalho" ? "Atalho" : "Obstáculo"}: ${({ for: "Força", acro: "Acrobacia", refl: "Reflexos", perc: "Percepção", ades: "Adestramento" })[t.teste]} CD ${t.cd}.` : ""]));
	tabelas.historias = await tabela("tabelaHistorias", "Histórias do Herói Louco", "icons/svg/book.svg", "1d6",
		"Contadas por Gormaggor, Raguria, Nada Mais que a Verdade, Kiki, Fortunata e quase qualquer caipira. Quase ninguém conta em ordem: misture e invente apócrifas para esconder a Revolta dos Três.",
		HISTORIAS.map(([n, t], i) => [i + 1, i + 1, n, t]));
	tabelas.ofensas = await tabela("tabelaOfensas", "Coisas que Ofendem Cletus Rigby", `${R}/anao.webp`, `1d${OFENSAS.length}`,
		"Quem ofende Cletus nunca aprende magia com ele. A lista é só o começo.",
		OFENSAS.map((o, i) => [i + 1, i + 1, o]));

	/* ------------------------------------------------------------------ */
	/* 6. Macros                                                            */
	/* ------------------------------------------------------------------ */
	async function macroEncontro(D) {
		const ESTADO = "fdtColinas";
		const TAG = "a1colinas";
		const est = foundry.utils.deepClone(game.user.getFlag("world", ESTADO) ?? {});
		est.dia ??= 0;
		est.vistos ??= {};
		est.descobertos ??= [];
		est.caes ??= true;
		const op = D.enc.map((e, i) => `<option value="${i + 1}">${i + 1}. ${e.nome}${est.descobertos.includes(e.k) ? " (descoberto)" : est.vistos[e.k] ? ` (visto ${est.vistos[e.k]}x)` : ""}</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Colinas Centrais · Encontro do Dia" },
			position: { width: 480 },
			content: `
				<p>Dia ${est.dia} nas Colinas. ${est.diabo ? "<b>O Diabo das Colinas já foi avistado</b> (aparece em todo resultado par). " : ""}${est.cemiterio ? "<b>Fortunata contou do Cemitério:</b> a próxima rolagem o encontra. " : ""}</p>
				<div class="form-group"><label>Ação</label><select name="acao">
					<option value="rolar">Rolar o encontro do dia (1d20)</option>
					<option value="escolher">Usar um resultado escolhido</option>
					<option value="especial">Rolar só um encontro especial (1d6)</option>
					<option value="estado">Ver o que já foi encontrado</option>
					<option value="zerar">Zerar (começar as Colinas de novo)</option></select></div>
				<div class="form-group"><label>Resultado escolhido</label><select name="numero">${op}</select></div>
				<div class="form-group"><label>Resultado inviável rola os Cães das Colinas (1d6)</label><input type="checkbox" name="caes" ${est.caes ? "checked" : ""}></div>
				<div class="form-group"><label>Colocar os tokens (ocultos) perto do 1º token selecionado</label><input type="checkbox" name="tokens"></div>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const whisper = ChatMessage.getWhisperRecipients("GM");
		if (res.acao === "zerar") {
			await game.user.unsetFlag("world", ESTADO);
			return ui.notifications.info("Encontros das Colinas zerados.");
		}
		if (res.acao === "estado") {
			const vistos = Object.entries(est.vistos).map(([k, n]) => `${(D.enc.find((e) => e.k === k) ?? D.esp.find((e) => e.k === k))?.nome ?? k} (${n}x)`);
			return ChatMessage.create({ whisper, content: `<h3>Colinas Centrais · ${est.dia} dia(s)</h3>
				<p><b>Encontrados:</b> ${vistos.join(", ") || "ninguém ainda"}.</p>
				<p><b>Locais e NPCs fixos descobertos (cole os adesivos):</b> ${est.descobertos.map((k) => D.enc.find((e) => e.k === k)?.nome).join(", ") || "nenhum"}.</p>
				<p>Diabo das Colinas: ${est.diabo ? (est.diaboCapturado ? "capturado (fica perto do covil com o pote de ouro)" : "avistado, persegue o grupo") : "ainda não avistado"}.${est.cemiterio ? " O próximo encontro é o Cemitério Errante." : ""}</p>
				${est.log?.length ? `<p style="font-size:0.85em">${est.log.slice(-10).join(" · ")}</p>` : ""}` });
		}
		est.caes = !!res.caes;
		const rolls = [];
		const roles = (lista) => lista.map((r) => game.actors.find((a) => a.getFlag("world", "fdt") === TAG && a.getFlag("world", "fdtRole") === r)).filter(Boolean);
		const diario = game.journal.find((j) => j.getFlag("world", "fdt") === TAG && j.getFlag("world", "fdtRole") === "diarioColinas");
		const linkPg = (nome) => {
			const pg = diario?.pages.find((x) => x.name === nome);
			return pg ? `@UUID[${pg.uuid}]{página no diário}` : "";
		};
		const bloco = (e, titulo) => {
			const as = roles(e.roles ?? []);
			return `<h3>${titulo}</h3><p>${e.resumo}</p><p><b>Mecânica:</b> ${e.mec}</p>
				<p style="font-size:0.85em">${as.map((a) => `@UUID[${a.uuid}]{${a.name}}`).join(", ")}${as.length ? " · " : ""}${linkPg(e.nome)}${e.uso ? ` · <i>${e.uso}</i>` : ""}</p>`;
		};
		const especial = async () => {
			const r = await new Roll("1d6").evaluate();
			rolls.push(r);
			const e = D.esp[r.total - 1];
			est.vistos[e.k] = (est.vistos[e.k] ?? 0) + 1;
			return { e, html: bloco(e, `Encontro especial (1d6 = ${r.total}): ${e.nome}`) };
		};
		let html = "";
		const aparecem = [];
		if (res.acao === "especial") {
			const x = await especial();
			html = x.html;
			aparecem.push(x.e);
		} else {
			est.dia++;
			let n;
			if (res.acao === "escolher") n = Number(res.numero);
			else if (est.cemiterio) {
				n = 20;
				est.cemiterio = false;
				html += "<p><i>Quem ouviu Fortunata se desorienta e \"perde\" algumas horas... e, de repente, o grupo está diante do Cemitério Errante.</i></p>";
			} else {
				const r = await new Roll("1d20").evaluate();
				rolls.push(r);
				n = r.total;
			}
			const e = D.enc[n - 1];
			const fixo = e.tipo === "local" || e.tipo === "parado";
			const inviavel = fixo && est.descobertos.includes(e.k);
			html = `<p><b>Dia ${est.dia} nas Colinas Centrais · 1d20 = ${n}</b></p>${html}`;
			if (inviavel) {
				html += `<p><b>${e.nome}</b> já foi descoberto: resultado inviável.</p>`;
				if (est.caes) {
					const x = await especial();
					html += x.html;
					aparecem.push(x.e);
				} else html += "<p>O grupo passa por lá de novo, ou o dia segue sem novidades.</p>";
			} else {
				html += bloco(e, e.nome);
				aparecem.push(e);
				est.vistos[e.k] = (est.vistos[e.k] ?? 0) + 1;
				if (fixo) est.descobertos.push(e.k);
				if (e.tipo === "local" || e.tipo === "parado") html += "<p style=\"font-size:0.85em\">Fixo: marque no mapa (adesivo). Rolar de novo vira resultado inviável.</p>";
			}
			if (e.k === "diabo" && !est.diabo) {
				est.diabo = true;
				html += "<p><b>O Diabo foi avistado:</b> a partir de agora ele reaparece em todo resultado par desta tabela.</p>";
			} else if (est.diabo && !est.diaboCapturado && n % 2 === 0 && e.k !== "diabo") {
				const d = D.enc.find((x) => x.k === "diabo");
				html += `<hr><p><b>Resultado par:</b> o Diabo das Colinas aparece de novo, sorrindo, convidando a ser perseguido.</p><p style="font-size:0.85em">${roles(d.roles).map((a) => `@UUID[${a.uuid}]{${a.name}}`).join("")} · <i>${d.uso}</i></p>`;
				aparecem.push(d);
			}
			est.log = [...(est.log ?? []), `D${est.dia}: ${aparecem.map((x) => x.nome).join(" + ") || `${e.nome} (repetido)`}`].slice(-30);
		}
		if (res.tokens) {
			const ref = canvas.tokens.controlled[0];
			const gs = canvas.grid.size;
			const cx = ref ? ref.document.x : canvas.stage.pivot.x - gs / 2;
			const cy = ref ? ref.document.y : canvas.stage.pivot.y - gs / 2;
			const docs = [];
			let i = 0;
			for (const e of aparecem) for (const a of roles(e.roles ?? [])) {
				for (let q = 0; q < (e.qtd ?? 1); q++, i++) {
					const ang = (i / 8) * 2 * Math.PI;
					const raio = 4 + Math.floor(i / 8) * 2;
					docs.push((await a.getTokenDocument({ x: cx + Math.round(Math.cos(ang) * raio) * gs, y: cy + Math.round(Math.sin(ang) * raio) * gs, hidden: true })).toObject());
				}
			}
			if (docs.length) {
				await canvas.scene.createEmbeddedDocuments("Token", docs);
				html += `<p style="font-size:0.85em">${docs.length} token(s) colocados <b>ocultos</b> em volta ${ref ? `de ${ref.name}` : "do centro da tela"}.</p>`;
			}
		}
		await game.user.setFlag("world", ESTADO, est);
		ChatMessage.create({ content: html, rolls, whisper });
	}

	async function macroTestes(D) {
		const ESTADO = "fdtColinas";
		const TAG = "a1colinas";
		const est = foundry.utils.deepClone(game.user.getFlag("world", ESTADO) ?? {});
		const SITS = {
			tolbert: "Tolbert · duelo musical (Atuação ×3 contra +15)",
			arlo: "Arlo · concurso de tiro (Pontaria CD 15, 20, 25)",
			mungo: "Mungo Joe · uma dose para cada selecionado",
			mungoDia: "Mungo Joe · começou outro dia (zera as doses)",
			sereiasCanto: "Sereias · canto (Vontade de cada selecionado contra +10)",
			sereiasAbordagem: "Sereias · abordagem do 1º selecionado (distração, magia, furto)",
			ladrao: "Ladrão de Rabos · roubar um rabo (Ladinagem contra +10)",
			fortunata: "Fortunata · aposta (Jogatina contra +15)",
			reston: "Nada Mais que a Verdade · ela sabe? (Int +4)",
			cletusCabana: "Cletus · entrar na cabana (Fortitude CD 15)",
			cletusOfensa: "Cletus · o 1º selecionado o ofendeu",
			elmer: "Elmer · fazer o dragão sonhar (1º selecionado)",
			cacadores: "Chèvre e Timm · traem o grupo? (50%, Iniciativa contra +10)"
		};
		const PER = { atua: "Atuação", dipl: "Diplomacia", enga: "Enganação", joga: "Jogatina", ofi0: "Ofício", conh: "Conhecimento" };
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Colinas Centrais · Testes dos Encontros" },
			position: { width: 500 },
			content: `
				<div class="form-group"><label>Situação</label><select name="sit">${Object.entries(SITS).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></div>
				<div class="form-group"><label>CD da informação (Nada Mais que a Verdade)</label><select name="cd"><option value="10">10 · comum</option><option value="15" selected>15 · específica</option><option value="20">20 · rara</option></select></div>
				<div class="form-group"><label>Magia das sereias</label><select name="magia"><option value="hipnotismo">Hipnotismo (fascinado)</option><option value="sono">Sono (inconsciente)</option></select></div>
				<div class="form-group"><label>Perícia (sonho de Elmer)</label><select name="per">${Object.entries(PER).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></div>
				<div class="form-group"><label>Modificador extra</label><input type="number" name="mod" value="0"></div>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const mod = Number(res.mod) || 0;
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r.total; };
		const bon = (a, k) => (["for", "des", "con", "int", "sab", "car"].includes(k) ? Number(a.system.atributos?.[k]?.value) : Number(a.system.pericias?.[k]?.value)) || 0;
		const teste = (a, k, extra = 0) => rolar(`1d20 + ${bon(a, k)} + ${extra}`);
		const atores = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		const precisa = ["mungoDia", "cacadores"].includes(res.sit) ? 0 : 1;
		if (atores.length < precisa) return ui.notifications.warn("Selecione o token de quem faz o teste.");
		const a = atores[0];
		const status = async (ator, id) => { if (!ator.statuses?.has(id)) await ator.toggleStatusEffect(id, { active: true }); };
		let html = `<h3>${SITS[res.sit].split(" (")[0]}</h3>`;

		if (res.sit === "tolbert") {
			let v = 0;
			html += "<ul>";
			for (let i = 1; i <= 3; i++) {
				const pj = await teste(a, "atua", mod);
				const t = await rolar("1d20 + 15");
				if (pj > t) v++;
				html += `<li>Rodada ${i}: ${a.name} ${pj} × Tolbert ${t} ${pj > t ? "✔️" : "❌"}</li>`;
			}
			html += "</ul>";
			if (v >= 2) {
				const modelo = game.items.find((i) => i.getFlag("world", "fdt") === TAG && i.getFlag("world", "fdtRole") === "moedaAlma");
				if (modelo) { const d = modelo.toObject(); delete d._id; await a.createEmbeddedDocuments("Item", [d]); }
				html += `<p>✔️ <b>${a.name} vence ${v} a ${3 - v}.</b> Tolbert tira uma moeda da bolsa: uma alma extra (já na ficha).</p>`;
			} else {
				await a.setFlag("world", "fdtAlmaPerdida", true);
				html += `<p>❌ <b>Tolbert vence ${3 - v} a ${v}.</b> ${a.name} entrega a própria alma, que vira uma moeda nos dedos do bardo: não pode ser ressuscitado e não irá a nenhum Reino dos Deuses (marcado na ficha).</p>`;
			}
		}

		if (res.sit === "arlo") {
			let cd = 15;
			let pj = 0;
			let arlo = 0;
			html += "<ul>";
			for (let i = 0; i < 3 || (pj === arlo && i < 13); i++, cd += 5) {
				const x = await teste(a, "pont", mod);
				const y = await rolar("1d20 + 10");
				if (x >= cd) pj++;
				if (y >= cd) arlo++;
				html += `<li>CD ${cd}${i >= 3 ? " (desempate)" : ""}: ${a.name} ${x} ${x >= cd ? "✔️" : "❌"} · Arlo ${y} ${y >= cd ? "✔️" : "❌"}</li>`;
			}
			html += `</ul><p><b>${pj > arlo ? `${a.name} vence` : pj < arlo ? "Arlo vence" : "Empate"}</b> (${pj} × ${arlo}).${pj > arlo ? " Arlo fica desconfiado, mas respeita." : ""}</p>`;
		}

		if (res.sit === "mungoDia") {
			est.mungo = {};
			html += "<p>Novo dia: as doses voltam a CD 15.</p>";
		}
		if (res.sit === "mungo") {
			est.mungo ??= {};
			html += "<ul>";
			for (const x of atores) {
				const m = (est.mungo[x.name] ??= { doses: 0, falhas: 0 });
				const cd = 15 + m.doses;
				const r = await teste(x, "fort", mod);
				m.doses++;
				if (r >= cd) {
					await x.update({ "system.attributes.pm.temp": (Number(x.system.attributes.pm?.temp) || 0) + 1 });
					html += `<li>${x.name}: Fortitude ${r} (CD ${cd}) ✔️ +1 PM temporário. "Bebo porque é líquido!"</li>`;
				} else {
					m.falhas++;
					if (m.falhas >= 2) {
						const h = await rolar("1d12");
						await status(x, "inconsciente");
						html += `<li>${x.name}: Fortitude ${r} (CD ${cd}) ❌ segunda falha: <b>inconsciente por ${h} horas</b>.</li>`;
					} else {
						await status(x, "enjoado");
						html += `<li>${x.name}: Fortitude ${r} (CD ${cd}) ❌ <b>enjoado</b> por uma cena.</li>`;
					}
				}
			}
			html += "</ul>";
		}

		if (res.sit === "sereiasCanto") {
			html += "<ul>";
			for (const x of atores) {
				const v = await teste(x, "vont", mod);
				const s = await rolar("1d20 + 10");
				html += `<li>${x.name}: Vontade ${v} × Atuação ${s} ${v >= s ? "✔️ percebe que há algo errado" : "❌ quer se aproximar e acha que elas são amigáveis (Intuição também é oposta pela Atuação delas)"}</li>`;
			}
			html += "</ul><p style=\"font-size:0.85em\">A falha não é mágica: o jogador ainda decide, mas o personagem está inclinado a ir.</p>";
		}
		if (res.sit === "sereiasAbordagem") {
			const dis = await rolar("1d20 + 10");
			const intu = await teste(a, "intu");
			html += `<p>Shanamarie distrai ${a.name}: Atuação ${dis} × Intuição ${intu} ${dis > intu ? "❌ distraído" : "✔️ não se deixa distrair"}.</p>`;
			const vont = await teste(a, "vont", mod);
			const hip = res.magia === "hipnotismo";
			const caiu = vont < 14;
			html += `<p>Shaylyne lança <b>${hip ? "Hipnotismo" : "Sono"}</b> (CD 14): Vontade ${vont} ${caiu ? `❌ <b>${hip ? "fascinado" : "dormindo"}</b>` : "✔️ resiste"}.</p>`;
			if (caiu) await status(a, hip ? "fascinado" : "inconsciente");
			const lad = await rolar("1d20 + 10");
			const perc = caiu ? null : await teste(a, "perc", dis > intu ? -5 : 0);
			const roubou = caiu || lad > perc;
			const bens = a.items.filter((i) => ["tesouro", "consumivel", "equipamento", "arma"].includes(i.type) && !i.system.equipado);
			const alvo = bens.length ? bens[(await rolar(`1d${bens.length}`)) - 1] : null;
			html += `<p>Shadolenn tenta o furto: Ladinagem ${lad}${perc === null ? " (vítima indefesa)" : ` × Percepção ${perc}`} ${roubou ? `✔️ <b>rouba ${alvo ? alvo.name : "a bolsa de moedas"}</b> (sugestão; o Mestre decide e tira da ficha)` : "❌ é pega no flagra"}.</p>
				<p>${roubou ? "As três mergulham e nadam para longe (natação 12m). Dá para persegui-las nadando." : "Se houver resistência, elas tentam afogá-lo e então fogem."}</p>`;
		}

		if (res.sit === "ladrao") {
			const l = await teste(a, "ladi", mod);
			const p = await rolar("1d20 + 10");
			html += `<p>${a.name}: Ladinagem ${l} × Percepção ${p}. ${l > p ? "✔️ <b>Um rabo roubado!</b> O Ladrão de Rabos implora (a única vez em que fala em voz alta) e concede um <b>desejo</b> em troca: ele surge em até uma semana, distorcido de forma inofensiva (literal demais, ou numa versão primitiva e caipira)." : "❌ O Ladrão percebe e se afasta, ficando cada vez mais distante sem se mexer."}</p>`;
		}

		if (res.sit === "fortunata") {
			const j = await teste(a, "joga", mod);
			const f = await rolar("1d20 + 15");
			if (j > f) {
				est.fortunata = (est.fortunata ?? 0) + 1;
				const n = est.fortunata;
				html += `<p>${a.name}: Jogatina ${j} × Fortunata ${f}. ✔️ <b>Fortunata perde</b> (${n}ª vez) e paga com um segredo:</p>`;
				if (n === 1) html += `<blockquote>${D.segredo}</blockquote><p style="font-size:0.85em">Sem significado específico: avisa que a região sofre interferência dos deuses.</p>`;
				else if (n === 2) {
					est.cemiterio = true;
					html += "<p>Ela conta do <b>Cemitério Errante</b>: que existe e como achá-lo (não o que significa). Quem ouve fica desorientado e \"perde\" algumas horas. <b>A próxima rolagem de encontro acha o Cemitério</b> (a macro Encontro do Dia já sabe).</p>";
				} else {
					const h = D.historias[(await rolar(`1d${D.historias.length}`)) - 1];
					html += `<p>Uma história do Herói Louco: <b>${h[0]}</b>.</p><blockquote>${h[1]}</blockquote>`;
				}
			} else html += `<p>${a.name}: Jogatina ${j} × Fortunata ${f}. ❌ <b>Fortunata ganha</b> e cobra a aposta (dinheiro ou, melhor ainda, um segredo).</p>`;
		}

		if (res.sit === "reston") {
			const cd = Number(res.cd) || 15;
			const r = await rolar(`1d20 + 4 + ${mod}`);
			html += `<p>Inteligência ${r} contra CD ${cd}: ${r >= cd ? "✔️ <b>ela sabe</b>, e conta tudo (não consegue omitir nada)." : "❌ não sabe. E admite isso com sofrimento."}</p>`;
		}

		if (res.sit === "cletusCabana") {
			html += "<ul>";
			for (const x of atores) {
				const r = await teste(x, "fort", mod);
				if (r < 15) await status(x, "enjoado");
				html += `<li>${x.name}: Fortitude ${r} ${r >= 15 ? "✔️ aguenta o cheiro" : "❌ <b>enjoado</b>"}</li>`;
			}
			html += "</ul><p style=\"font-size:0.85em\">Cletus está transformado num gato. Se ninguém mexer em nada, ele deixa o grupo em paz.</p>";
		}
		if (res.sit === "cletusOfensa") {
			est.ofensas ??= {};
			est.ofensas[a.name] = (est.ofensas[a.name] ?? 0) + 1;
			const o = D.ofensas[(await rolar(`1d${D.ofensas.length}`)) - 1];
			html += `<p><b>${a.name} ofendeu Cletus</b> (${est.ofensas[a.name]}ª vez). Ideia para a próxima: <i>${o}</i></p><p>${a.name} nunca vai aprender uma magia com ele. Cletus xinga; em casos extremos, ataca.</p>`;
		}

		if (res.sit === "elmer") {
			const r = await teste(a, res.per, mod);
			const t = (await rolar("1d10")) * 100;
			html += `<p>${a.name} tenta guiar o sonho de Elmer (${PER[res.per]} ${r}; o livro não dá CD, sugestão inferida: 20). Com achbuld, entra no sonho e pode trazer um objeto: até duas melhorias, ou <b>T$ ${t}</b>. Nada mágico, nada de riquezas enormes.</p>`;
		}

		if (res.sit === "cacadores") {
			const traem = (await rolar("1d100")) <= 50;
			if (!traem) html += "<p>✔️ Desta vez Chèvre e Timm cumprem o combinado e vão embora.</p>";
			else {
				const dupla = await rolar("1d20 + 10");
				let melhor = -99;
				let quem = "";
				for (const x of atores) { const r = await teste(x, "inic"); if (r > melhor) { melhor = r; quem = x.name; } }
				html += `<p>❌ <b>Traição!</b> Eles tentam levar algo que o grupo precisa, ou um NPC. Iniciativa: grupo ${atores.length ? `${melhor} (${quem})` : "(ninguém selecionado)"} × dupla ${dupla}. ${melhor > dupla ? "O grupo percebe a tempo." : "Somem numa explosão de fogo e fumaça antes que alguém reaja."}</p>`;
			}
		}
		await game.user.setFlag("world", ESTADO, est);
		ChatMessage.create({ content: html, rolls });
	}

	async function macroEfeitos() {
		const TAG = "a1colinas";
		const EF = {
			bencao: "Abner · Bênção (+1 em ataque e dano)",
			perdicao: "Abner · Perdição (–1 em ataque e dano)",
			maldicao: "Raguria · Rogar Maldição",
			ensopado: "Raguria · Ensopado de Rabo de Lagarto (+1 CD arcana)",
			curar: "Homem-Bode · Curar Ferimentos (2d8+2)",
			cemiterio: "Cemitério Errante · uma noite (atributo abaixo)",
			moeda: "Cemitério Errante · enterrar a Moeda-Alma (atributo abaixo)",
			ebenezerNao: "Ebenezer · a profecia NÃO se cumpriu (+20 para gastar)",
			ebenezerGastar: "Ebenezer · gastar parte dos +20 (valor abaixo)",
			ebenezerSim: "Ebenezer · a profecia se cumpriu (5 rerrolagens do Mestre)",
			ebenezerRerrolar: "Ebenezer · o Mestre usa uma rerrolagem",
			remover: "Remover os efeitos das Colinas dos selecionados"
		};
		const ATR = { for: "Força", des: "Destreza", con: "Constituição", int: "Inteligência", sab: "Sabedoria", car: "Carisma" };
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Colinas Centrais · Bênçãos e Maldições" },
			position: { width: 480 },
			content: `
				<p>Aplica nos tokens <b>selecionados</b>.</p>
				<div class="form-group"><label>Efeito</label><select name="ef">${Object.entries(EF).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></div>
				<div class="form-group"><label>Atributo</label><select name="atr">${Object.entries(ATR).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></div>
				<div class="form-group"><label>Valor (gastar de Ebenezer)</label><input type="number" name="valor" value="5" min="1"></div>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const atores = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		if (!atores.length) return ui.notifications.warn("Selecione os tokens que recebem o efeito.");
		const ch = (key, value, type = "add") => ({ key, value: String(value), type, phase: "initial", priority: null });
		const efeito = (name, img, changes, description, extra = {}) => ({ name, img, type: "base", description, flags: { world: { fdt: TAG, ...(extra.flags ?? {}) } }, duration: extra.duration ?? {}, system: { changes } });
		const rolls = [];
		let html = `<h3>${EF[res.ef]}</h3><ul>`;
		for (const a of atores) {
			const nossos = a.effects.filter((e) => e.getFlag("world", "fdt") === TAG);
			if (res.ef === "bencao" || res.ef === "perdicao") {
				const oposto = nossos.filter((e) => e.getFlag("world", "fdtAbner"));
				if (oposto.length) await a.deleteEmbeddedDocuments("ActiveEffect", oposto.map((e) => e.id));
				const s = res.ef === "bencao" ? 1 : -1;
				await a.createEmbeddedDocuments("ActiveEffect", [efeito(res.ef === "bencao" ? "Bênção de Abner" : "Perdição de Abner", `systems/tormenta20/icons/magias/${res.ef === "bencao" ? "bencao" : "perdicao"}.webp`,
					[ch("system.modificadores.ataque.geral", s), ch("system.modificadores.dano.geral", s)], `${s > 0 ? "+1" : "–1"} em testes de ataque e rolagens de dano até o fim da próxima cena. Bênção e Perdição se anulam.`, { flags: { fdtAbner: true } })]);
				html += `<li>${a.name}: ${s > 0 ? "abençoado (+1)" : "amaldiçoado (–1)"} até o fim da próxima cena.</li>`;
			}
			if (res.ef === "maldicao") {
				await a.createEmbeddedDocuments("ActiveEffect", [efeito("Maldição de Raguria", "systems/tormenta20/icons/magias/rogar-maldicao.webp",
					[ch("system.modificadores.pericias.geral", -5), ch("system.modificadores.ataque.geral", -5), ch("system.attributes.movement.walk.value", 0.5, "multiply")],
					"Rogar Maldição (debilidade e fraqueza): não pode se comunicar nem lançar magias, –5 em todos os testes e metade do deslocamento. Até o dia seguinte ou o fim da próxima cena relevante.")]);
				html += `<li>${a.name}: amaldiçoado por Raguria, que sai levitando e gargalhando.</li>`;
			}
			if (res.ef === "ensopado") {
				await a.createEmbeddedDocuments("ActiveEffect", [efeito("Ensopado de Raguria", "systems/tormenta20/icons/itens/gerais/panela.webp",
					[ch("system.attributes.cd", 1)], "+1 na CD das magias arcanas (o efeito soma na CD geral da ficha; desligue para habilidades não arcanas). A critério do Mestre, bônus em Misticismo. Dura como um prato especial (um dia).")]);
				html += `<li>${a.name}: em contato com seu lado místico (+1 CD).</li>`;
			}
			if (res.ef === "curar") {
				const r = await new Roll("2d8+2").evaluate();
				rolls.push(r);
				const { value: antes, max } = a.system.attributes.pv;
				const novo = Math.min(max, antes + r.total);
				await a.update({ "system.attributes.pv.value": novo });
				html += `<li>${a.name}: +${novo - antes} PV (${r.total} rolados).</li>`;
			}
			if (res.ef === "cemiterio" || res.ef === "moeda") {
				const reg = foundry.utils.deepClone(a.getFlag("world", "fdtCemiterio") ?? {});
				if (res.ef === "moeda") {
					const moeda = a.items.find((i) => i.getFlag("world", "fdtRole") === "moedaAlma");
					if (!moeda) { html += `<li>${a.name}: não tem a Moeda-Alma de Tolbert.</li>`; continue; }
					if (reg[res.atr]) { html += `<li>${a.name}: a moeda não pode ir no mesmo atributo do bônus do Cemitério (${ATR[res.atr]}).</li>`; continue; }
					await moeda.delete();
					reg.moeda = res.atr;
					await a.setFlag("world", "fdtCemiterio", reg);
					await a.createEmbeddedDocuments("ActiveEffect", [efeito(`Moeda-Alma enterrada (+1 ${ATR[res.atr]})`, "systems/tormenta20/icons/itens/gerais/joia-familia.webp",
						[ch(`system.atributos.${res.atr}.bonus`, 1)], "A alma ganha de Tolbert repousa no Cemitério Errante: +1 no atributo, como uma noite ali (o livro não diz se é permanente).")]);
					html += `<li>${a.name}: enterra a moeda: <b>+1 em ${ATR[res.atr]}</b>.</li>`;
					continue;
				}
				if (reg.moeda === res.atr) { html += `<li>${a.name}: ${ATR[res.atr]} já recebeu o bônus da moeda; escolha outro atributo.</li>`; continue; }
				const noites = (reg[res.atr] ?? 0) + 1;
				reg[res.atr] = noites;
				await a.setFlag("world", "fdtCemiterio", reg);
				const antigo = nossos.filter((e) => e.getFlag("world", "fdtNoite") === res.atr);
				if (noites === 1) {
					await a.createEmbeddedDocuments("ActiveEffect", [efeito(`Noite no Cemitério Errante (+1 ${ATR[res.atr]})`, "systems/tormenta20/icons/itens/gerais/terra-de-cemiterio.webp",
						[ch(`system.atributos.${res.atr}.bonus`, 1)], "+1 no atributo por uma semana. Uma segunda noite torna o bônus permanente.", { flags: { fdtNoite: res.atr }, duration: { value: 604800, units: "seconds" } })]);
					html += `<li>${a.name}: não recupera PM esta noite (melancolia), mas ganha <b>+1 em ${ATR[res.atr]}</b> por uma semana.</li>`;
				} else if (noites === 2) {
					if (antigo.length) await a.deleteEmbeddedDocuments("ActiveEffect", antigo.map((e) => e.id));
					await a.update({ [`system.atributos.${res.atr}.base`]: (Number(a.system.atributos[res.atr].base) || 0) + 1 });
					html += `<li>${a.name}: segunda noite: o +1 em ${ATR[res.atr]} agora é <b>permanente</b> (somado ao valor base). Não recupera PM.</li>`;
				} else html += `<li>${a.name}: mais uma noite de melancolia, sem PM recuperados (o bônus já é permanente).</li>`;
			}
			if (res.ef.startsWith("ebenezer")) {
				const eb = foundry.utils.deepClone(a.getFlag("world", "fdtEbenezer") ?? { bonus: 0, rerrolagens: 0 });
				if (res.ef === "ebenezerNao") { eb.bonus = 20; html += `<li>${a.name}: Ebenezer errou. <b>+20</b> para dividir entre os testes da próxima aventura.</li>`; }
				if (res.ef === "ebenezerGastar" && eb.bonus <= 0) { html += `<li>${a.name}: não tem bônus de Ebenezer para gastar.</li>`; continue; }
				if (res.ef === "ebenezerGastar") {
					const v = Math.min(eb.bonus, Math.max(1, Number(res.valor) || 1));
					eb.bonus -= v;
					html += `<li>${a.name}: gasta <b>+${v}</b> neste teste. Restam +${eb.bonus}.</li>`;
				}
				if (res.ef === "ebenezerSim") { eb.rerrolagens = 5; html += `<li>${a.name}: a profecia se cumpriu. O Mestre pode rolar de novo <b>cinco testes</b> contra ${a.name} até o fim do arco (e ${a.name} deve uma segunda chance a alguém).</li>`; }
				if (res.ef === "ebenezerRerrolar") {
					if (eb.rerrolagens > 0) eb.rerrolagens--;
					html += `<li>${a.name}: o Mestre rola de novo. Restam ${eb.rerrolagens} rerrolagem(ns).</li>`;
				}
				await a.setFlag("world", "fdtEbenezer", eb);
				const marca = nossos.filter((e) => e.getFlag("world", "fdtEbenezer"));
				if (marca.length) await a.deleteEmbeddedDocuments("ActiveEffect", marca.map((e) => e.id));
				const partes = [eb.bonus ? `+${eb.bonus} a gastar` : "", eb.rerrolagens ? `${eb.rerrolagens} rerrolagens do Mestre` : ""].filter(Boolean);
				if (partes.length) await a.createEmbeddedDocuments("ActiveEffect", [efeito(`Profecia de Ebenezer: ${partes.join(", ")}`, "systems/tormenta20/icons/magias/premonicao.webp", [],
					"Só um lembrete: não muda nenhum valor. Use a macro Bênçãos e Maldições para gastar.", { flags: { fdtEbenezer: true } })]);
			}
			if (res.ef === "remover") {
				if (nossos.length) await a.deleteEmbeddedDocuments("ActiveEffect", nossos.map((e) => e.id));
				html += `<li>${a.name}: ${nossos.length} efeito(s) removido(s).</li>`;
			}
		}
		ChatMessage.create({ content: html + "</ul>", rolls });
	}

	async function macroPerseguicao(D) {
		const ESTADO = "fdtColinas";
		const est = foundry.utils.deepClone(game.user.getFlag("world", ESTADO) ?? {});
		const ps = est.perseg;
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Colinas Centrais · Perseguição ao Diabo" },
			position: { width: 480 },
			content: `
				<p>${ps ? `Rodada ${ps.rodada}. Diabo a ${ps.diabo.pos} quadrados; ${Object.values(ps.pjs).map((x) => `${x.nome} ${x.pos}${x.fora ? " (fora)" : ""}`).join(", ")}.` : "Nenhuma perseguição em andamento."}</p>
				<div class="form-group"><label>Ação</label><select name="acao">
					${ps ? "" : "<option value=\"iniciar\">Começar: os tokens selecionados perseguem o Diabo</option>"}
					${ps ? "<option value=\"rodada\">Próxima rodada</option><option value=\"encerrar\">Encerrar a perseguição</option>" : ""}</select></div>
				<div class="form-group"><label>Dona Erneshia ajuda (+4 em Atletismo e Percepção)</label><input type="checkbox" name="erneshia" ${ps?.erneshia ? "checked" : ""}></div>
				<div class="form-group"><label>Nos atalhos, os PJs tentam o atalho</label><input type="checkbox" name="atalho" checked></div>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r.total; };
		const bon = (a, k) => (["for", "des", "con", "int", "sab", "car"].includes(k) ? Number(a.system.atributos?.[k]?.value) : Number(a.system.pericias?.[k]?.value)) || 0;
		const NOMES = { for: "Força", acro: "Acrobacia", refl: "Reflexos", perc: "Percepção", ades: "Adestramento" };
		if (res.acao === "encerrar") {
			delete est.perseg;
			await game.user.unsetFlag("world", `${ESTADO}.perseg`);
			await game.user.setFlag("world", ESTADO, est);
			return ChatMessage.create({ content: "<p>A perseguição ao Diabo das Colinas acabou.</p>" });
		}
		if (res.acao === "iniciar") {
			const tks = canvas.tokens.controlled.filter((t) => t.actor);
			if (!tks.length) return ui.notifications.warn("Selecione os tokens de quem persegue o Diabo.");
			est.perseg = { rodada: 0, erneshia: !!res.erneshia, diabo: { pos: 20, rod: 0, fort: 0 }, pjs: Object.fromEntries(tks.map((t) => [t.id, { nome: t.name, actorId: t.actor.id, tokenId: t.id, pos: 0, rod: 0, fort: 0, fora: false }])) };
			await game.user.setFlag("world", ESTADO, est);
			return ChatMessage.create({ content: `<h3>Atrás do Diabo das Colinas!</h3><p>Ele sai correndo, sorrindo, com <b>20 quadrados</b> de vantagem. Se abrir <b>50</b>, some entre as colinas. ${tks.map((t) => t.name).join(", ")} ${tks.length > 1 ? "correm" : "corre"} atrás${res.erneshia ? ", com Dona Erneshia gritando dicas" : ""}.</p>
				<p style="font-size:0.85em">Cada rodada: Atletismo de todos (±2 por 1,5m de deslocamento acima ou abaixo de 9m) e um evento da tabela Perseguições nas Centrais. Correr dura 1 + Constituição rodadas; depois, Fortitude CD 15 (+1 por teste) ou fatigado e fora.</p>` });
		}
		ps.erneshia = !!res.erneshia;
		ps.rodada++;
		const evR = await rolar("1d20");
		const ev = D.perseg.find(([lo, hi]) => evR >= lo && evR <= hi);
		const t = ev[3];
		let html = `<h3>Perseguição ao Diabo · rodada ${ps.rodada}</h3><p>Evento (${evR}): <b>${ev[2]}</b>${t ? ` · ${NOMES[t.teste]} CD ${t.cd}` : ""}.</p><ul>`;
		const correr = async (nome, b, tb, tenta, ator, reg, con, fortB) => {
			let dist = Math.max(0, await rolar(`1d20 + ${b}`));
			let nota = `Atletismo ${dist}`;
			if (t && (t.tipo === "obstaculo" || tenta)) {
				const x = await rolar(`1d20 + ${tb}`);
				const ok = x >= t.cd;
				if (t.tipo === "atalho" && ok) dist *= 2;
				else if (!ok) dist = Math.floor(dist / 2);
				nota += `; ${NOMES[t.teste]} ${x} ${ok ? (t.tipo === "atalho" ? "✔️ dobro" : "✔️") : "❌ metade"}`;
				if (!ok) {
					const d = await rolar("1d6");
					nota += `, ${d} de dano`;
					if (ator) await ator.update({ "system.attributes.pv.value": ator.system.attributes.pv.value - d });
				}
			}
			reg.pos += dist;
			reg.rod++;
			if (reg.rod > 1 + con) {
				const cd = 15 + reg.fort;
				reg.fort++;
				const f = await rolar(`1d20 + ${fortB}`);
				if (f < cd) {
					reg.fora = true;
					if (ator && !ator.statuses?.has("fatigado")) await ator.toggleStatusEffect("fatigado", { active: true });
					nota += `; cansaço: Fortitude ${f} (CD ${cd}) ❌ <b>fatigado, fora</b>`;
				} else nota += `; cansaço: Fortitude ${f} (CD ${cd}) ✔️`;
			}
			html += `<li><b>${nome}</b>: ${nota} → avança ${dist}, total <b>${reg.pos}</b>.</li>`;
		};
		await correr("Diabo das Colinas", 17, 17, true, null, ps.diabo, 3, 17);
		for (const reg of Object.values(ps.pjs)) {
			if (reg.fora) continue;
			const a = canvas.tokens.placeables.find((x) => x.id === reg.tokenId)?.actor ?? game.actors.get(reg.actorId);
			if (!a) { reg.fora = true; continue; }
			const desl = Number(a.system.attributes.movement?.walk?.value) || 9;
			const md = Math.round(((desl - 9) / 1.5) * 2);
			const ern = ps.erneshia ? 4 : 0;
			const tb = t ? bon(a, t.teste) + (t.teste === "perc" ? ern : 0) : 0;
			await correr(reg.nome, bon(a, "atle") + md + ern, tb, res.atalho, a, reg, bon(a, "con"), bon(a, "fort"));
		}
		html += "</ul>";
		const ativos = Object.values(ps.pjs).filter((x) => !x.fora);
		const alcancou = ativos.filter((x) => x.pos >= ps.diabo.pos);
		const frente = Math.max(0, ...ativos.map((x) => x.pos));
		if (alcancou.length || ps.diabo.fora) {
			est.diaboCapturado = true;
			html += `<p>✔️ <b>${alcancou.length ? `${alcancou.map((x) => x.nome).join(" e ")} alcança o Diabo` : "O Diabo cansa e para, ofegante"}!</b> Capturado, ele revela a riqueza roubada da família: o pote de ouro (Tabela 8–1, dinheiro ND 7, ignorando 1 a 10). Daqui em diante ele fica perto do covil.</p>`;
			delete est.perseg;
		} else if (!ativos.length || ps.diabo.pos - frente >= 50) {
			html += `<p>❌ <b>O Diabo some entre as colinas</b> (${ativos.length ? `${ps.diabo.pos - frente} quadrados à frente` : "ninguém mais consegue correr"}). Ele vai aparecer de novo.</p>`;
			delete est.perseg;
		} else html += `<p>O Diabo está <b>${ps.diabo.pos - frente}</b> quadrados à frente de quem está mais perto.</p>`;
		await game.user.unsetFlag("world", `${ESTADO}.perseg`);
		await game.user.setFlag("world", ESTADO, est);
		ChatMessage.create({ content: html, rolls });
	}

	async function macroQuimby() {
		const tk = canvas.tokens.controlled.find((t) => t.actor);
		if (!tk) return ui.notifications.warn("Selecione o token de quem usa o produto do Quimby.");
		const user = tk.actor;
		const itensQ = user.items.filter((i) => (i.getFlag("world", "fdtRole") ?? "").startsWith("quimby_"));
		if (!itensQ.length) return ui.notifications.warn(`${user.name} não tem nada do Quimby (arraste o item para a ficha).`);
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Alquimia do Quimby" },
			content: `<p>Alvos: os tokens <b>mirados</b> (sem alvo, o próprio usuário).</p><div class="form-group"><label>Produto</label><select name="item">${itensQ.map((i) => `<option value="${i.id}">${i.name}</option>`).join("")}</select></div>`,
			ok: { label: "Usar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const item = user.items.get(res.item);
		const tipo = item.getFlag("world", "fdtRole").replace("quimby_", "");
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r; };
		const d6 = (await rolar("1d6")).total;
		const funciona = d6 % 2 === 0;
		const alvos = [...game.user.targets].map((t) => t.actor).filter(Boolean);
		const cd = (Number(user.system.attributes.cd) || 10) + (Number(user.system.atributos?.des?.value) || 0);
		const DANO = { acido: "2d4[acido]", fogo: "1d6[fogo]", granada: "6d6[impacto]" };
		let html = `<h3>${item.name}</h3><p>1d6 = ${d6}: ${funciona ? "✔️ <b>funciona!</b>" : "❌ <b>funciona ao contrário!</b>"}</p><ul>`;
		if (DANO[tipo]) {
			const atingidos = funciona ? (alvos.length ? alvos : []) : [user];
			if (funciona && !alvos.length) html += "<li>Sem alvo mirado: role o dano à mão.</li>";
			const dano = await rolar(DANO[tipo]);
			for (const a of atingidos) {
				const salva = funciona ? (await rolar(`1d20 + ${Number(a.system.pericias?.refl?.value) || 0}`)).total : null;
				const ok = salva !== null && salva >= cd;
				await a.applyDamageV2(dano, ok ? 0.5 : 1);
				if (tipo === "fogo" && !ok && !a.statuses?.has("emchamas")) await a.toggleStatusEffect("emchamas", { active: true });
				html += `<li>${a.name}: ${dano.total} de dano${salva !== null ? ` (Reflexos ${salva} contra CD ${cd}${ok ? ", metade" : ""})` : " (no próprio usuário!)"}${tipo === "fogo" && !ok ? ", em chamas" : ""}.</li>`;
			}
		} else {
			const quem = alvos[0] ?? user;
			if (tipo === "balsamo") {
				const r = await rolar("2d4");
				const { value: antes, max } = quem.system.attributes.pv;
				const novo = funciona ? Math.min(max, antes + r.total) : antes - r.total;
				await quem.update({ "system.attributes.pv.value": novo });
				html += `<li>${quem.name}: ${funciona ? `recupera ${novo - antes} PV` : `<b>sofre ${r.total} de dano</b> com o emplastro`}.</li>`;
			} else if (tipo === "essencia") {
				const r = await rolar("1d4");
				const { value: antes, max } = quem.system.attributes.pm;
				const novo = funciona ? Math.min(max, antes + r.total) : Math.max(0, antes - r.total);
				await quem.update({ "system.attributes.pm.value": novo });
				html += `<li>${quem.name}: ${funciona ? `recupera ${novo - antes} PM` : `<b>perde ${antes - novo} PM</b> com o tônico`}.</li>`;
			}
		}
		const qtd = (Number(item.system.qtd) || 1) - 1;
		if (qtd > 0) await item.update({ "system.qtd": qtd });
		else await item.delete();
		ChatMessage.create({ content: `${html}</ul><p style="font-size:0.85em">${qtd > 0 ? `Restam ${qtd}.` : "Acabou."}</p>`, rolls });
	}

	const macro = (name, img, fn, dados = null, role = null) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(role),
		command: `// Fim dos Tempos · Arco 1 · Colinas Centrais · gerado por a1-encontros-colinas.js\n${dados ? `const DADOS = ${JSON.stringify(dados)};\n` : ""}(${fn.toString()})(${dados ? "DADOS" : ""});`
	});
	const slim = (e) => ({ k: e.k, nome: e.nome, tipo: e.tipo, roles: e.roles, resumo: e.resumo, mec: e.mec, uso: e.uso, qtd: e.qtd });
	const macros = await Macro.createDocuments([
		macro("Colinas · Encontro do Dia", "icons/svg/village.svg", macroEncontro, { enc: ENC.map(slim), esp: ESPECIAIS.map(slim) }, "encontroColinas"),
		macro("Colinas · Testes dos Encontros", "icons/svg/d20-black.svg", macroTestes, { historias: HISTORIAS, ofensas: OFENSAS, segredo: SEGREDO_TABULEIRO }),
		macro("Colinas · Bênçãos e Maldições", `${T20I}/magias/rogar-maldicao.webp`, macroEfeitos),
		macro("Colinas · Perseguição ao Diabo", "icons/svg/terror.svg", macroPerseguicao, { perseg: PERSEG }),
		macro("Colinas · Alquimia do Quimby", `${T20I}/itens/gerais/bomba.webp`, macroQuimby)
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
	const TIPO = { npc: "Viaja pelas Centrais: pode aparecer de novo.", parado: "Fica sempre no mesmo lugar: depois de achado, marque no mapa.", local: "Local fixo: depois de descoberto, cole o adesivo no mapa.", errante: "Surge em qualquer lugar, quantas vezes for." };
	const paginaEncontro = (e, i, sort, especial = false) => pagina(e.nome, `
		<p><b>${especial ? `Encontro especial ${i + 1}` : `${i + 1} na tabela`}.</b> ${especial ? "Pode acompanhar o grupo por uma ou mais sessões como parceiro." : TIPO[e.tipo]}</p>
		<p>${e.resumo}</p>
		<h3>Mecânica</h3><p>${e.mec}</p>
		${(e.roles ?? []).length ? `<p><b>Fichas:</b> ${e.roles.map((r) => L(atores[r])).filter(Boolean).join(", ")}</p>` : ""}
		${e.uso ? `<p style="font-size:0.85em"><b>No Foundry:</b> ${e.uso}.</p>` : ""}`, sort);
	const extrasEncontro = {
		quimby: `<h3>Produtos</h3><ul>${Object.keys(QUIMBY).map((k) => `<li>${L(itemPorRole(`quimby_${k}`))}</li>`).join("")}</ul>`,
		raguria: `<p>${L(itemPorRole("ensopado"))}</p>`,
		tolbert: `<p>${L(itemPorRole("moedaAlma"))}</p>`,
		cemiterio: `<p>${L(itemPorRole("metal"))} (10 unidades no chão).</p>`,
		cletus: `<p>Veja ${L(tabelas.ofensas)}.</p><ul>${OFENSAS.map((o) => `<li>${o}</li>`).join("")}</ul>`,
		diabo: `<p>Veja ${L(tabelas.perseg)} e a macro ${linkMacro("Perseguição")}.</p>`,
		puristas: "<p>Handout: <i>Panfleto dos Puristas Caipiras</i>.</p>",
		reston: "<p>Handout: <i>O Pergaminho do Evento</i>.</p>"
	};
	const paginas = [
		pagina("Guia do Mestre", `
			<h2>A tabela de encontros</h2>
			<p>Sempre que os aventureiros deixarem o Forte Cabeça-de-Martelo, role 1d20 em ${L(tabelas.enc)}: o grupo encontra um lugar ou habitante das Colinas. Em vez de uma rolagem por saída, pode ser uma por dia de viagem (um hexágono do mapa), ou outro padrão. Na mesa original, nem sempre houve rolagem, para não quebrar a narrativa.</p>
			<ul>
				<li><b>Personagens</b> viajam pelas Centrais e podem ser encontrados mais de uma vez.</li>
				<li><b>Locais</b> são fixos: achados, ficam "descobertos" (cole os adesivos e monte seu mapa). Exceções: Elmer e as sereias ficam parados; o Cemitério Errante surge em qualquer lugar.</li>
				<li><b>Aceite as rolagens.</b> Interferir na aleatoriedade tira a graça: as Centrais são imprevisíveis até para o Mestre.</li>
				<li>NPCs e lugares são vagos de propósito. Caracterize como quiser.</li>
				<li><b>Resultado inviável</b> (repetir um local ou NPC fixo): role em ${L(tabelas.esp)} (os PJs da mesa original como NPCs, que não se conhecem).</li>
				<li><b>O Diabo das Colinas</b>, depois de avistado, reaparece em todo resultado par, além do resultado normal.</li>
			</ul>
			<h2>Macros</h2>
			<ul>
				<li>${linkMacro("Encontro do Dia")}: rola (ou usa um resultado escolhido), conta os dias, lembra o que já foi visto e descoberto, troca o inviável pelos Cães das Colinas, acrescenta o Diabo nos pares, obedece ao segredo de Fortunata e põe os tokens ocultos na cena. É a mesma que a <i>Busca pelo Templo</i> do Templo do Vácuo chama a cada dia.</li>
				<li>${linkMacro("Testes dos Encontros")}: duelo de Tolbert, tiro de Arlo, doses de Mungo Joe, canto e furto das sereias, rabo do Ladrão, apostas de Fortunata, Nada Mais que a Verdade, cabana e ofensas de Cletus, sonho de Elmer e a traição de Chèvre e Timm.</li>
				<li>${linkMacro("Bênçãos e Maldições")}: Bênção e Perdição de Abner, maldição e ensopado de Raguria, cura do Homem-Bode, noites no Cemitério, a Moeda-Alma enterrada e as apostas de Ebenezer.</li>
				<li>${linkMacro("Perseguição ao Diabo")}: a perseguição com as regras do livro básico e os eventos das Centrais.</li>
				<li>${linkMacro("Alquimia do Quimby")}: o 1d6 de cada produto fajuto.</li>
			</ul>
			<h2>Tabelas</h2>
			<p>${[tabelas.enc, tabelas.esp, tabelas.perseg, tabelas.historias, tabelas.ofensas].map(L).join(" · ")}</p>`, 100),
		...ENC.map((e, i) => {
			const pg = paginaEncontro(e, i, 200 + i * 10);
			if (extrasEncontro[e.k]) pg.text.content += extrasEncontro[e.k];
			return pg;
		}),
		...ESPECIAIS.map((e, i) => paginaEncontro(e, i, 500 + i * 10, true)),
		pagina("Perseguições nas Centrais", `
			<p>Regras do livro básico (perseguições, capítulo 6): cada participante faz um teste de Atletismo por rodada e avança esse número de quadrados (±2 para cada 1,5m de deslocamento acima ou abaixo de 9m). Correr dura 1 + Constituição rodadas; depois, Fortitude CD 15 (+1 por teste anterior) por rodada, e quem falha fica fatigado e sai.</p>
			<p>Obstáculos: todos testam, e quem falha anda metade. Atalhos: quem tenta e passa anda o dobro; quem falha anda metade. Nas Centrais, <b>qualquer falha causa 1d6 de dano</b>.</p>
			<table><tr><th>1d20</th><th>Resultado</th></tr>${PERSEG.map(([lo, hi, n, t]) => `<tr><td>${lo}–${hi}</td><td>${n}${t ? ` (${({ for: "Força", acro: "Acrobacia", refl: "Reflexos", perc: "Percepção", ades: "Adestramento" })[t.teste]} CD ${t.cd})` : ""}</td></tr>`).join("")}</table>
			<p><b>Diabo das Colinas:</b> começa com 20 quadrados de vantagem, +17 em todas as perícias relevantes, some se abrir 50.</p>`, 700),
		pagina("Handout · Panfleto dos Puristas Caipiras", `
			<blockquote><p>Irmãos,</p>
			<p>Nós não estamos sós! Existe um lugar para nós nas Colinas Centrais! Os puristas estão chegando e vocês finalmente terão o lugar que merecem aqui! Em todas as partes nós perdemos território, precisamos nos curvar para os não humanos, mas não aqui! Aqui nós seremos os chefes!</p>
			<p>Valkaria é a líder do Panteão e nós, seus filhos, somos líderes naturais das outras raças! Está no sangue dos humanos liderar, conquistar, mandar, assim como está no sangue dos não humanos obedecer!</p>
			<p>As Colinas Centrais são nossas! Nós estávamos aqui desde sempre e agora cada vez mais este lugar está infestado de não humanos! Que direito eles têm de estar aqui? Só vivem nestas terras por nossa bondade! Nós vamos tomar posse do que é nosso! Nós vamos ser senhores dos outros e tudo vai ficar bem! Chega de ter medo de orcs, gnolls e anões!</p>
			<p>Espalhem a palavra dos puristas e aguardem o dia em que tomaremos controle! Enquanto isso, suas ordens são simples! Organizem-se, consigam armas, chamem outros humanos corajosos!</p>
			<p>As Colinas serão nossas!</p></blockquote>`, 800),
		pagina("Handout · O Pergaminho do Evento", `
			<blockquote><p><b>Relatto d'O Evennto</b><br>Assín como ouvvído e reggist'rado por Da Bocca Abennsoada Soh Brotta a Verddade Reston no Anno 1037 Appohs a Chegadda de Nóssos Señôres Élfos.</p>
			<p>O Herói Lôuco chegôu às Colinnas Centraes ppela primêira Vez pôuco anntes que istto tuddo acontecêsse. Naonn sabbemos por qque êle vêio ppara cah, enbóra os sábeos espec'culem quê foe mêsmo para fujjir. Sse o Herói Lôuco sseguio os Refujjiádos at'teh êste Continnent abennsoado pêlos Deoses ou se appenas corrêu para onnde o Rey Juíz naonn pudés-se achallo naonn sabbemos. Sabbemos quê o Herói Lôuco vivêo nest'Tas Colinnas ppor um Tennpo Longo e as pesôas da regiaonn apprenderan quê êle éra um Herói. Naonn sabbemos se o Bixxo Bruxxo esttava con êle Mas sabbemos quê a Gerreira Distantt naonn esttava maes.</p>
			<p>O Rey Juíz Encont'trou o Herói Lôuco e entaonn</p>
			<p><i>(o pergaminho está totalmente riscado a partir daqui, chegando a estar um pouco rasgado e esfiapado)</i></p>
			<p>Appohs êste Evennto o Herói Lôuco nunnca maes fôi o mêsmo e as Colinnas Centraes tanbenn naonn. As Bennsaonns e Maldissaonns quê coñecêmmos commessaraonn depoes d'Istto.</p></blockquote>`, 810),
		pagina("Handout · Histórias do Herói Louco", `
			<p class="secret">Herói Louco = Tilliann; Guerreira Distante = Valkaria; Bicho Bruxo = Kallyadranoch; Rei Juiz = Khalmyr; Larápio Ligeiro = Hyninn. Mantenha vago e fora de ordem para não entregar a Revolta dos Três.</p>
			${HISTORIAS.map(([n, t]) => `<h3>${n}</h3><p>${t}</p>`).join("")}`, 820)
	];
	await JournalEntry.create({ name: "Arco 1 · Encontros nas Colinas Centrais", folder: pasta.JournalEntry, flags: FLAGS("diarioColinas"), pages: paginas });

	ui.notifications.info(`Colinas Centrais criadas: ${Object.keys(atores).length} fichas, itens, 5 tabelas, diário e 5 macros. Veja a pasta "${NOME_PASTA}".`);
})();
