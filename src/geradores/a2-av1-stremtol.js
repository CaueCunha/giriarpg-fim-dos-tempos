/* =====================================================================
 * FIM DOS TEMPOS · ARCO 2 · AVENTURA 1 · "OS AVENTUREIROS DE STREMTOL"
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Arco 2 · Av1 · Os Aventureiros de Stremtol" com:
 *      - Madame Margebell, o Anjo Aprisionado (use 4) e o Servo da Escola.
 *      - Os Mata-Malvados (Torzogh, Ingwi, Thurab, Nyrimm) para a contingência de combate.
 *      - Ator de apoio "Vizinhança de Stremtol (pistas)" com as pistas e CDs de cada casa.
 *      - Itens de prova: Dossiês do Aluno, Óculos de Margebell, Pintura Subliminar, Anotações.
 *      - Diário com guia, fases, pistas por casa, handout dos Dossiês, a escola e o desfecho.
 *      - Macros: Investigar Stremtol, Pinturas Subliminares e Infiltração na Escola.
 *   3. Lei & Ordem continua no ator e na macro criados pela Aventura 0 (não são recriados aqui).
 *   4. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "a2av1".
 *
 * Feito a partir do código do sistema (master, out/2026); não foi testado num Foundry rodando.
 * Veja o guia a2-av1-stremtol.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "a2av1";
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
			window: { title: "Aventura 1 do Arco 2: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para a Aventura 1 do Arco 2.</p>
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
	const NOME_PASTA = "FdT · Arco 2 · Av1 · Os Aventureiros de Stremtol";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#5a4a6b", flags: FLAGS() })).id;
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


	/* ------------------------------------------------------------------ */
	/* 2. Pistas de Stremtol (fonte única para a macro e o diário)          */
	/* ------------------------------------------------------------------ */
	// [casa, perícias, CD (0 = sem teste), texto]
	const PISTAS = [
		["geral", ["dipl", "enga", "furt", "inve", "nobr", "perc", "intu"], 15, "Os moradores estão inquietos com a presença dos heróis, mas são receptivos à Guarda."],
		["geral", ["dipl", "enga", "furt", "inve", "nobr", "perc"], 15, "Os primeiros moradores foram Remont e Ysmenne Ronchetillon."],
		["geral", ["dipl", "enga", "furt", "inve", "nobr", "perc"], 15, "A vizinhança é nova: a primeira casa foi construída há menos de 5 anos."],
		["geral", ["dipl", "enga", "furt", "inve", "nobr", "perc"], 15, "Todos os moradores são famílias e casais relativamente jovens."],
		["geral", ["dipl", "enga", "furt", "inve", "nobr"], 20, "A área é tecnicamente dos Ronchetillon, cedida a cada morador para construir a casa. Em termos legais, os moradores são vassalos deles."],
		["geral", ["dipl", "enga", "furt", "inve", "nobr"], 20, "A família Elbannise (de Osmont) tem laços antigos de amizade com os Ronchetillon."],
		["geral", ["dipl", "enga", "furt", "inve", "nobr"], 20, "Só algumas famílias são aceitas em Stremtol. O critério é misterioso; não basta \"ser nobre\"."],
		["geral", ["dipl", "enga", "furt", "inve", "nobr"], 20, "Periodicamente há reuniões da vizinhança na casa dos Ronchetillon. Parece uma comunidade unida, embora pequena."],
		["geral", ["dipl", "enga", "inve", "nobr"], 25, "Há uma clara intenção de tornar Stremtol diferente das regiões nobres: arquitetura, roupas e jeito de falar lembram uma aldeia. Não há servos."],
		["geral", ["dipl", "enga", "inve", "nobr"], 25, "A vizinhança não exclui não humanos."],
		["geral", ["dipl", "enga", "inve", "nobr"], 25, "Nenhum morador mantém laços próximos com a família fora da vizinhança."],
		["geral", ["dipl", "enga", "inve", "nobr", "guer"], 25, "Não há nenhum tipo de guarda ou exército particular em Stremtol."],
		["geral", ["dipl", "enga", "inve", "nobr", "reli"], 25, "Todas as famílias cultuam Khalmyr, mas não há nenhum clérigo na vizinhança."],
		["geral", ["dipl", "enga", "inve", "nobr", "mist", "reli"], 25, "Não há iluminação mágica, runas de proteção, bênçãos nem defesas arcanas ou divinas na vizinhança."],
		["geral", ["dipl", "enga", "inve"], 30, "As reuniões acontecem toda semana, mas às vezes há mais de uma por semana (não se sabe em que casos)."],
		["geral", ["dipl", "enga", "inve"], 30, "Nunca houve apresentações de bardos. Alguns moradores já apresentaram uma peça ou cantaram para os outros."],
		["geral", ["dipl", "enga", "inve", "reli"], 30, "Embora Khalmyr seja um deus guerreiro, os moradores não acreditam em vingança nem em justiça violenta: preferem perdoar, quase como devotos de Thyatis."],
		["geral", ["mist"], 35, "Não há nada mágico acontecendo aqui, mas nada bloqueia a magia."],
		["geral", ["sobr"], 35, "Nenhum monstro passou por aqui nos últimos meses ou anos."],
		["geral", ["intu"], 35, "Todos aqui são felizes e parecem se amar muito."],
		["geral", ["ofic"], 35, "As casas foram construídas com técnicas humanas, sem apoio mágico ou divino, nem trabalho de monstros ou golens."],
		["geral", ["intu"], 40, "Há uma divisão: cada casa parece ter um morador de um \"lado\" e outro do \"outro lado\". Não são rivais; é só identificação com um grupo."],

		["aldanna", [], 0, "Na parede está a cabeça empalhada do javali Aníbal, o antigo companheiro animal de Aldanna (reconhecível pela pintura no quarto de Torzogh)."],
		["aldanna", ["reli"], 15, "Há um pequeno altar a Khalmyr, simples e humilde, feito para a própria família conduzir os rituais, como em aldeias sem clérigo."],
		["aldanna", ["inve"], 20, "Exceto pela cabeça do javali, não há nenhum resquício da antiga vida de Aldanna: nenhuma arma, armadura ou lembrança."],
		["aldanna", ["inve"], 25, "Há objetos de interesse de Osmont (negócios, heráldica, um retrato dele jovem), mas nada de Aldanna além de roupas e utensílios domésticos."],
		["aldanna", [], 0, "Aldanna é absolutamente sincera em tudo (qualquer teste de Intuição). Não esconde nada nem parece forçada."],
		["aldanna", [], 0, "Ela fez parte dos Mata-Malvados por anos, mas vê isso como \"uma brincadeira juvenil\". Prefere se concentrar no futuro."],
		["aldanna", [], 0, "Teve um relacionamento com Torzogh e terminaram amigavelmente. Tem carinho por ele e gostaria que ele largasse a vida de aventureiro para \"crescer\"."],
		["aldanna", [], 0, "De início resistiu a Osmont e, casada, ainda \"teimou\" na vida de aventureira. Tem vergonha disso e é grata a ele por tê-la \"ajudado a crescer\"."],
		["aldanna", ["intu"], 20, "Ela vê aventureiros com condescendência; respeita um pouco o grupo por ser da Guarda, mas acha a postura deles um pouco ridícula."],
		["aldanna", ["intu"], 25, "Fica desconfortável ao falar de habilidades especiais, magia e poderes, e mais ainda ao vê-los em ação: medo e vergonha."],
		["aldanna", ["guer", "intu"], 30, "De alguma forma, Aldanna perdeu ou esqueceu suas habilidades. Não sabe mais nem disparar um arco."],
		["aldanna", ["int"], 20, "Há uma lacuna de alguns meses entre as brigas com Osmont e a mudança para Stremtol que ela não menciona."],
		["aldanna", ["intu"], 25, "Ela não esconde o período \"vazio\": é como se não existisse. Questionada, sorri e diz que \"ficou se preparando\". Não lembra detalhes; acha que foi o nervosismo."],
		["aldanna", ["intu"], 25, "Aldanna é genuinamente feliz."],
		["aldanna", ["intu"], 30, "Aldanna está sempre feliz, como se fosse incapaz de sentir tristeza, raiva, medo ou qualquer emoção forte."],

		["inagar", ["inve"], 20, "Há um alçapão coberto por um tapete na sala. Leva a um porão com vários baús cheios de grimórios."],
		["inagar", ["mist"], 20, "Os grimórios são bastante avançados."],
		["inagar", ["inve", "perc"], 15, "Não há nenhum livro na casa além dos grimórios escondidos."],
		["inagar", [], 0, "Inagar tem muita vergonha do passado de mago, um gatilho para Albert. Quando perguntam da vida anterior, desconversa."],
		["inagar", [], 0, "Inagar não tem medo de Albert, mas não quer ferir os sentimentos dele, então escolhe bem as palavras (ou seja, o tempo todo)."],
		["inagar", ["intu"], 25, "Inagar não fala do passado para não magoar Albert."],
		["inagar", ["perc"], 20, "Os dois não fazem nada separados."],
		["inagar", ["intu"], 20, "Inagar é muito mais inteligente do que deixa transparecer, muito acima de um aprendiz de mais de 30 anos."],
		["inagar", ["intu"], 25, "Inagar tem vergonha de ser só um aprendiz na Guilda dos Contadores."],
		["inagar", ["intu"], 20, "Os dois realmente se amam, mas Albert é muito inseguro."],
		["inagar", ["intu"], 25, "Inagar é feliz, mas a felicidade não condiz com a vida dele: comportamento de infeliz, sentimento de feliz."],

		["illydna", ["inve", "perc"], 15, "Há muitas roupas luxuosas para Alvuriell, mas Illydna tem só três vestidos simples de serva."],
		["illydna", [], 0, "A casa não é feita para alguém da estatura de um goblin: Alvuriell mal alcança as prateleiras."],
		["illydna", ["conh", "inve", "perc"], 20, "Há pergaminhos de canções e poesias élficas e até uma lira élfica. Alvuriell não tem nada em termos de diversão ou interesses."],
		["illydna", ["intu"], 20, "A elfa sente, acima de tudo, pena do goblin."],
		["illydna", [], 0, "Os dois sempre dizem que Illydna \"salvou\" Alvuriell."],
		["illydna", [], 0, "O goblin fala sem vergonha do passado de ladrão, frisando como estava errado e como Illydna lhe deu tudo."],
		["illydna", ["dipl", "enga"], 30, "O nome original de Alvuriell era Grug."],
		["illydna", ["nobr", "perc"], 20, "Alvuriell tem maneirismos de quem aprendeu etiqueta numa escola, não em casa."],

		["remont", [], 0, "Uma porta dentro da casa está sempre fechada (tranca comum, de boa qualidade)."],
		["remont", ["ladi"], 20, "Atrás da porta fechada há um pequeno escritório com os cinco <b>Dossiês do Aluno</b> (handout no diário)."],
		["remont", [], 0, "Embora seja a casa de um alto nobre, não há ornamentos nem flâmulas com o brasão dos Ronchetillon."],
		["remont", [], 0, "Há uma sala com cinco cadeiras em semicírculo, mesinhas e uma prateleira de bebidas. Parece uma sala de reuniões."],
		["remont", ["dipl", "enga", "intu"], 25, "Ysmenne não sabe o que há atrás da porta, só que é \"assunto de Remont\"."],
		["remont", ["dipl", "enga", "perc"], 25, "As reuniões da vizinhança acontecem na sala das cinco cadeiras."],
		["remont", ["dipl", "enga", "perc"], 30, "Os participantes das reuniões são só Remont, Osmont, Albert, Illydna e Hugo."],
		["remont", ["dipl", "enga", "intu"], 30, "Ysmenne sai de casa quando há reunião, para deixar os convidados à vontade. Em geral visita Aldanna ou Rosa."],
		["remont", ["dipl", "enga", "intu"], 30, "Ysmenne não sabe o que é discutido nas reuniões, nem por que ela e os outros não são convidados."],
		["remont", ["intu"], 30, "Nunca ocorreu a Ysmenne perguntar o que é discutido ou por que ela não pode ouvir."],
		["remont", ["nobr"], 25, "Ysmenne tem maneirismos de etiqueta aprendidos numa escola depois de adulta, não naturais."],
		["remont", ["nobr"], 25, "Os maneirismos de Ysmenne são os mesmos de Aldanna, Inagar, Alvuriell e Rosa."],

		["hugo", [], 0, "Nenhum dos dois parece saber cuidar da casa ou da plantação."],
		["hugo", ["ofic"], 20, "Embora humilde, a casa usa os mesmos materiais caros das outras."],
		["hugo", ["ofic"], 25, "A casa é mais que humilde: é antiquada, quase falsa, como se alguém imitasse uma casa pobre."],
		["hugo", ["nobr", "ofic"], 20, "Hugo e Rosa vestem roupas de camponeses, mas limpas e bem costuradas demais. Parecem fantasias."],
		["hugo", ["conh"], 15, "Os dois usam um vocabulário atípico para gente tão simples."],
		["hugo", ["nobr"], 15, "Os dois têm maneirismos de etiqueta que lembram nobres."],
		["hugo", ["nobr"], 25, "Rosa tem os mesmos maneirismos dos outros: parece ter aprendido numa escola."],
		["hugo", ["nobr"], 20, "Hugo parece ter nascido nobre."],
		["hugo", ["nobr"], 30, "Hugo é um alto nobre de Valkaria (o conde Labonnet)."],
		["hugo", ["mist"], 25, "A pele de Rosa tem marcas de uso de magia e ela tem uma espécie de aura mágica."],
		["hugo", ["mist"], 30, "As marcas e a aura de Rosa são típicas de necromancia."],
		["hugo", ["conh", "inve", "mist"], 35, "Rosa é a notória necromante <b>Rozaryth Dez Caveiras</b>, capturada por aventureiros há cerca de dois anos."],
		["hugo", ["intu"], 25, "Rosa realmente não lembra do passado. Perguntar o que fazia antes de Hugo soa absurdo para ela."]
	];
	const CASAS = {
		geral: "Stremtol (informações gerais)",
		aldanna: "Osmont e Aldanna Elbannise",
		inagar: "Inagar e Albert",
		illydna: "Illydna e Alvuriell",
		remont: "Remont e Ysmenne Ronchetillon",
		hugo: "Hugo, Rosa e Luka"
	};
	const NOMES_PERICIA = { dipl: "Diplomacia", enga: "Enganação", furt: "Furtividade", inve: "Investigação", nobr: "Nobreza", perc: "Percepção", intu: "Intuição", guer: "Guerra", reli: "Religião", mist: "Misticismo", sobr: "Sobrevivência", ofic: "Ofício", conh: "Conhecimento", ladi: "Ladinagem", int: "Inteligência" };

	/* ------------------------------------------------------------------ */
	/* 3. Ameaças e personagens                                             */
	/* ------------------------------------------------------------------ */
	const atores = {};

	atores.margebell = await criarNPC({
		name: "Madame Margebell",
		role: "margebell",
		link: true,
		img: `${T20I}/ameacas/capelao-de-guerra.png`,
		nd: 7,
		cd: 28,
		tipo: "hum",
		raca: "humana",
		papel: "solo",
		atr: { for: 0, des: 0, con: 2, int: 4, sab: 5, car: 4 },
		pv: 98,
		pm: 57,
		def: 27,
		walk: 9,
		pericias: { inic: 7, perc: 12, fort: 18, refl: 6, vont: 12, conh: 11, dipl: 11, inti: 11, intu: 12, mist: 11, nobr: 11, reli: 14 },
		ic: ["medo"],
		resTxt: "Imunidade a medo. Campo dos anjos aprisionados (ver poder).",
		equipTxt: "Manto eclesiástico aprimorado, símbolo sagrado de Khalmyr, óculos de lentes de cristal rosado.",
		tesouro: "Padrão.",
		bio: p("Frade de Khalmyr, diretora e única professora da Escola de Etiqueta e Bom Comportamento. Baixa, meia-idade, cabelo curto, vestido que lembra robe de sacerdotisa, broche de Khalmyr, óculos pequenos, mãos enluvadas.",
			"Acha que \"normal\" é ser mundano, pacato e convencional. Tem nojo de heroísmo e de qualquer um que se destaque. Não nega os crimes: não os vê como crimes. <i>\"Bondade é normalidade.\"</i>",
			"<b>Táticas:</b> nunca ataca primeiro. Mantém o grupo o máximo possível na escola (passeio, jantar) para as pinturas agirem, e oferece aulas grátis. Se o grupo se mostrar hostil, luta até a morte e desperta os quatro anjos aprisionados. Se atacada logo de cara, foge para as galerias.",
			"<b>Óculos:</b> as lentes são de cristal rosado. Percepção ou Investigação CD 25 nota o matiz; Conhecimento ou Misticismo CD 30 identifica algo de fora de Arton. Ela tem pares de reserva numa gaveta trancada no quarto."),
		effects: [
			chave("Cólera Divina (+2 dano, aura 9m)", "icons/svg/aura.svg", [["system.modificadores.dano.geral", "2"]], false, "Movimento, 4 PM. Até o fim da cena, ela e aliados a até 9m recebem +2 em rolagens de dano."),
			chave("Oração (+2 perícias e dano)", `${T20I}/magias/oracao.webp`, [["system.modificadores.dano.geral", "2"], ["system.modificadores.pericias.geral", "2"]], false, "Sustentada. Ela e aliados em alcance curto +2 em perícias e dano; inimigos em alcance curto –2."),
			chave("Protegida pelo campo dos anjos", "icons/svg/shield.svg", [], false, "Enquanto houver anjo aprisionado de pé: ninguém entra nos 3m em volta dela e nenhum efeito externo a afeta. Ela afeta quem está fora normalmente.")
		],
		items: [
			poder("Campo dos Anjos Aprisionados", "icons/svg/shield.svg",
				p("Quando o combate começa, os quatro anjos alçam voo e projetam um campo de energia divina de 3m de raio centrado nela. <b>Nenhuma criatura entra</b> na área e <b>nenhum efeito externo a afeta</b>. Ela afeta quem está fora normalmente. O campo dura até todos os anjos caírem. Ligue o efeito \"Protegida pelo campo dos anjos\"."),
				{ exec: "passive" }),
			poder("Cólera Divina", "icons/svg/aura.svg",
				p("<b>Movimento, 4 PM.</b> Energiza o símbolo sagrado até o fim da cena: aura de 9m em que ela e aliados recebem +2 em rolagens de dano. Ligue o efeito na ficha dela e nos anjos."),
				{ exec: "move", custo: 4 }),
			poder("Dom da Verdade", "icons/svg/eye.svg",
				p("<b>Livre, 2 PM.</b> +5 em Intuição e em Percepção contra Enganação e Furtividade até o fim da cena."),
				{ exec: "free", custo: 2 }),
			poder("Erudição", "icons/svg/book.svg",
				p("<b>Reação, 4 PM.</b> Num teste de perícia (exceto ataque), soma o dobro da Inteligência (+8)."),
				{ exec: "reaction", custo: 4 }),
			poder("Fé e Razão", "icons/svg/upgrade.svg",
				p("<b>Reação, 4 PM.</b> Quando usa uma habilidade, a CD aumenta em +4."),
				{ exec: "reaction", custo: 4 }),
			magia("Bênção", `${T20I}/magias/bencao.webp`,
				p("<b>Padrão, 3 PM.</b> Aliados em alcance curto recebem +2 em ataque e dano até o fim da cena."),
				{ exec: "action", custo: 3, alcance: "short", alvo: "aliados", escola: "enc", durU: "scene",
					effects: [fx("Bênção de Margebell", `${T20I}/magias/bencao.webp`, [["system.modificadores.ataque.geral", "2"], ["system.modificadores.dano.geral", "2"]])] }),
			magia("Curar Ferimentos", `${T20I}/magias/curar-ferimentos.webp`,
				p("<b>Padrão, 8 PM.</b> Uma criatura adjacente cura <b>9d8+9 PV</b>."),
				{ exec: "action", custo: 8, alcance: "touch", alvo: "1 criatura", rolls: [["Cura", [["9d8+9", "curapv"]]]] }),
			magia("Dissipar Magia", `${T20I}/magias/dissipar-magia.webp`,
				p("<b>Padrão, 3 PM.</b> Uma criatura, objeto ou esfera de 3m em alcance médio. Teste de Misticismo: magias com CD igual ou menor que o resultado são dissipadas."),
				{ exec: "action", custo: 3, alcance: "medium", escola: "abj", circulo: 2 }),
			magia("Oração", `${T20I}/magias/oracao.webp`,
				p("<b>Padrão, 3 PM, sustentada.</b> Ela e aliados em alcance curto +2 em perícias e dano; inimigos em alcance curto –2 em perícias e dano. Cumulativo com outras magias. Ligue o efeito na ficha."),
				{ exec: "action", custo: 3, alcance: "short", escola: "enc", durU: "sust" }),
			magia("Raio Solar", `${T20I}/magias/raio-solar.webp`,
				p("<b>Padrão, 7 PM.</b> Linha de 30m: <b>6d8 de luz</b> (6d12 em mortos-vivos) e ofuscado por 1 rodada. <b>Reflexos CD 28</b> reduz à metade e evita a condição."),
				{ exec: "action", custo: 7, area: "linha de 30m", circulo: 2, save: "Reflexos CD 28 reduz à metade e evita ofuscado",
					rolls: [["Luz", [["6d8", "luz"]]]], effects: [cond("Ofuscado")] }),
			magia("Soco de Arsenal", `${T20I}/magias/soco-do-mestre.webp`,
				p("<b>Padrão, 7 PM.</b> Uma criatura em alcance médio sofre <b>6d6 de impacto</b> e é empurrada 3m (<b>Fortitude CD 28</b> reduz à metade e evita o empurrão)."),
				{ exec: "action", custo: 7, alcance: "medium", alvo: "1 criatura", circulo: 2, save: "Fortitude CD 28 reduz à metade e evita o empurrão", rolls: [["Impacto", [["6d6", "impacto"]]]] })
		]
	});

	atores.anjo = await criarNPC({
		name: "Anjo Aprisionado",
		role: "anjo",
		img: `${T20I}/classes/paladino.webp`,
		nd: 5,
		cd: 19,
		tipo: "esp",
		raca: "celestial",
		papel: "lackey",
		atr: { for: 4, des: 2, con: 3, int: 1, sab: 3, car: 3 },
		pv: 48,
		def: 24,
		walk: 9,
		sentidos: ["escuro"],
		pericias: { inic: 6, perc: 7, fort: 14, refl: 7, vont: 11, luta: 20, dipl: 9, intu: 9, reli: 9 },
		resTxt: "Evasão, resistência a magia +2.",
		equipTxt: "Armadura de couro, escudo pesado, maça.",
		bio: p("Celestiais de Khalmyr que Margebell invocou e prendeu como estátuas pintadas em tamanho real, usando as mensagens subliminares e a inocência deles. <b>Descreva as estátuas em várias salas</b> para que não surjam do nada.",
			"Voam (18m) e mantêm o campo de 3m em volta de Margebell enquanto houver um de pé. São quatro."),
		items: [
			arma("Maça", `${T20I}/itens/equipamentos/maca.webp`, { dano: "2d8+20", tipo: "impacto", extra: [["2d6+6", "luz"]],
				effects: [aoUsar("Rasante (+4d6 luz)", "icons/svg/falling.svg", [["dano", "4d6"]], ["attack"])],
				desc: p("<b>Rasante:</b> investida voando contra inimigo no solo causa +4d6 de luz (marque o aprimoramento).") }),
			poder("Campo Divino", "icons/svg/shield.svg",
				p("Com os outros anjos, projeta o campo de 3m em volta de Margebell: ninguém entra, nada de fora a afeta. Dura até todos os anjos caírem."), { exec: "passive" }),
			poder("Evasão", "icons/svg/shield.svg",
				p("Quando passa em Reflexos contra um efeito que reduz o dano à metade, não sofre dano."), { exec: "passive" })
		]
	});
	await atores.anjo?.update({ "system.attributes.movement.fly.base": 18 });

	atores.servo = await criarNPC({
		name: "Servo da Escola",
		role: "servo",
		img: `${T20I}/racas/humano.webp`,
		nd: "1/2",
		cd: 12,
		tipo: "hum",
		raca: "humano",
		papel: "lackey",
		disposition: 0,
		atr: { for: 0, des: 0, con: 1, int: 1, sab: 1, car: 1 },
		pv: 11,
		def: 10,
		walk: 9,
		pericias: { inic: 2, perc: 5, fort: 1, refl: 2, vont: 5, luta: 2, dipl: 5, intu: 5, nobr: 5 },
		bio: p("As primeiras cobaias de Margebell: aventureiros iniciantes que vieram \"ajudar uma sacerdotisa de Khalmyr\", criminosos entregues por guardas da nobreza e pelo menos um filho \"vagabundo\" de família rica. Não lembram o próprio nome: <i>\"Não se preocupe com isso, estou aqui para auxiliá-lo no que precise.\"</i>",
			"Sorriso largo e permanente. Intuição ou Percepção CD 20: os olhos são \"perdidos\".",
			"Ficha do livro: mercador do Guia de NPCs sem besta, com vassouras e ferramentas (clava), Ofício (servo) e Nobreza +5. Quase sempre é mais fácil considerar que o grupo tem sucesso contra eles. Juntos, procuram invasores com Percepção +12."),
		items: [arma("Vassoura ou Ferramenta", `${T20I}/itens/equipamentos/maca.webp`, { dano: "1d6", tipo: "impacto", desc: p("Conta como clava.") })]
	});

	/* ---------- Mata-Malvados (contingência) ---------- */
	const BIO_MM = "Fichas simplificadas do livro, só para o caso de o grupo entrar em confronto com os Mata-Malvados (contingência \"Nada para Ser Visto Aqui\").";
	atores.torzogh = await criarNPC({
		name: "Torzogh Meio-Machado",
		role: "torzogh",
		link: true,
		disposition: 0,
		img: `${T20I}/classes/barbaro.webp`,
		nd: 7,
		cd: 20,
		tipo: "hum",
		raca: "humano",
		papel: "solo",
		atr: { for: 5, des: 0, con: 4, int: 1, sab: 2, car: 1 },
		pv: 260,
		def: 30,
		walk: 12,
		pericias: { inic: 7, perc: 9, fort: 20, refl: 14, vont: 7, luta: 24, atle: 14, inti: 10, guer: 8 },
		res: { dano: { base: 4 } },
		resTxt: "Redução de dano 4, resistência a magia +5.",
		equipTxt: "Capa pesada aprimorada, couraça reforçada, machado táurico maciço.",
		bio: p("Líder dos Mata-Malvados: bárbaro de peito nu, coberto de cicatrizes, sempre na mesa cativa do Esqueleto Gordo com um machado de lâmina quebrada. Falastrão, orgulhoso, gregário e, surpreendentemente, ponderado. Querido na taverna.",
			"Contratante do caso: acha que Aldanna, ex-companheira de grupo e ex-namorada, foi \"raptada\". Tem histórico de não aceitar a saída de membros (Cirius, 1412–1414).",
			BIO_MM),
		effects: [chave("Fúria (+4 ataque e dano corpo a corpo)", "icons/svg/blood.svg", [["system.modificadores.ataque.cac", "4"], ["system.modificadores.dano.cac", "4"]], false,
			"Livre, 1×/cena. +4 em ataque e dano com armas corpo a corpo e de arremesso. Sem ações que exijam calma. Termina se, ao fim da rodada, não atacou nem foi alvo de efeito hostil.")],
		items: [
			arma("Machado Táurico (×2)", `${T20I}/itens/equipamentos/machado-taurico.webp`, { dano: "2d10+18", tipo: "corte", critX: 5,
				desc: p("Dois ataques por ação padrão. <b>Destruidor:</b> pode rolar de novo resultados 1 ou 2 nos dados de dano da arma.") }),
			poder("Fúria", "icons/svg/blood.svg", p("<b>Livre, 1×/cena.</b> Ligue o efeito na ficha."), { exec: "free" })
		]
	});
	atores.ingwi = await criarNPC({
		name: "Ingwi",
		role: "ingwi",
		link: true,
		disposition: 0,
		img: `${T20I}/classes/ladino.webp`,
		nd: 6,
		cd: 24,
		tipo: "hum",
		raca: "elfa",
		papel: "special",
		atr: { for: 0, des: 6, con: 2, int: 3, sab: 1, car: 2 },
		pv: 98,
		def: 26,
		walk: 12,
		sentidos: ["penumbra"],
		pericias: { inic: 13, perc: 8, fort: 6, refl: 18, vont: 12, luta: 18, pont: 24, acro: 14, enga: 9, furt: 13, ladi: 13, mist: 10 },
		resTxt: "Evasão.",
		equipTxt: "Adaga ×2, armadura de couro, espada curta precisa, ferramentas de alquimista aprimoradas, sapato de camurça aprimorado.",
		bio: p("Elfa ladina de olhar esperto. Acha que Aldanna se conformou com um casamento seguro em vez de investir num grupo sem futuro. Não precisa se preocupar com a idade, mas se importa com os colegas.", BIO_MM),
		items: [
			arma("Espada Curta (×2)", `${T20I}/itens/equipamentos/espada-curta.webp`, { dano: "1d6+8", tipo: "perfuracao", critM: 17,
				effects: [aoUsar("Ataque Furtivo (+4d6)", "icons/magic/perception/silhouette-stealth-shadow.webp", [["dano", "4d6"]], ["attack"])], desc: p("Dois ataques. Mais veneno.") }),
			distancia("Adaga (×2)", `${T20I}/itens/equipamentos/adaga.webp`, { dano: "1d4+8", tipo: "perfuracao", critM: 18, alcance: "short",
				effects: [aoUsar("Ataque Furtivo (+4d6)", "icons/magic/perception/silhouette-stealth-shadow.webp", [["dano", "4d6"]], ["attack"])], desc: p("Dois arremessos. Mais veneno.") }),
			poder("Veneno", "icons/svg/poison.svg",
				p("Perde <b>3d12 PV</b> e fica paralisado por 1 rodada. <b>Fortitude CD 24</b> evita a paralisia e reduz a perda para 1d12."),
				{ exec: "free", save: "Fortitude CD 24", rolls: [["Perda de vida", [["3d12", ""]]], ["Perda (passou)", [["1d12", ""]]]], effects: [cond("Paralisado")] }),
			poder("Emboscar", "icons/svg/upgrade.svg", p("Uma ação padrão adicional no primeiro turno de cada combate."), { exec: "passive" }),
			poder("Manto de Sombras", "icons/magic/perception/silhouette-stealth-shadow.webp", p("<b>Movimento.</b> Camuflagem leve até o fim da cena."), { exec: "move" }),
			poder("Rolamento Defensivo", "icons/svg/falling.svg", p("<b>Reação, 1×/rodada.</b> Ao sofrer dano, reduz à metade e fica caída."), { exec: "reaction" })
		]
	});
	atores.thurab = await criarNPC({
		name: "Thurab",
		role: "thurab",
		link: true,
		disposition: 0,
		img: `${T20I}/classes/clerigo.webp`,
		nd: 6,
		cd: 18,
		tipo: "hum",
		raca: "qareen da terra",
		papel: "special",
		atr: { for: 3, des: 0, con: 2, int: 1, sab: 4, car: 2 },
		pv: 163,
		pm: 34,
		def: 24,
		walk: 6,
		pericias: { inic: 5, perc: 9, fort: 18, refl: 6, vont: 12, luta: 18, atle: 8, conh: 6, dipl: 7, reli: 11 },
		res: { acido: { base: 10 }, fogo: { base: 10 } },
		resTxt: "Redução de ácido e fogo 10.",
		equipTxt: "Brunea reforçada, cimitarra precisa, escudo leve, manto eclesiástico aprimorado, símbolo sagrado de Azgher.",
		bio: p("Qareen clérigo de Azgher, figura ambígua de rosto coberto. Cogita servir num templo de Azgher se tudo der errado.", BIO_MM),
		items: [
			arma("Cimitarra (×2)", `${T20I}/itens/equipamentos/cimitarra.webp`, { dano: "1d6+8", tipo: "corte", critM: 17,
				effects: [aoUsar("Espada Solar (+1d6 fogo)", "icons/magic/fire/flame-burning-embers-yellow.webp", [["dano", "1d6"]], ["attack"])],
				desc: p("Dois ataques, mais o escudo.") }),
			arma("Escudo Leve", `${T20I}/itens/equipamentos/escudo-leve.webp`, { dano: "1d4+8", tipo: "impacto" }),
			poder("Desejos", "icons/svg/upgrade.svg", p("Se lançar uma magia que alguém pediu desde o último turno dele, custa –1 PM."), { exec: "passive" }),
			poder("Espada Solar", "icons/magic/fire/flame-burning-embers-yellow.webp", p("<b>1 PM.</b> A arma de corte causa +1d6 de fogo até o fim da cena (marque o aprimoramento na cimitarra)."), { exec: "free", custo: 1 }),
			magia("Arma Mágica", `${T20I}/magias/arma-magica.webp`, p("<b>Padrão, 5 PM.</b> Até o fim da cena, uma arma adjacente vira mágica: +2 em ataque e dano e +1d6 de fogo."), { exec: "action", custo: 5, escola: "tra" }),
			magia("Bênção", `${T20I}/magias/bencao.webp`, p("<b>Padrão, 3 PM.</b> Aliados em alcance curto +2 em ataque e dano até o fim da cena."), { exec: "action", custo: 3, escola: "enc" }),
			magia("Curar Ferimentos", `${T20I}/magias/curar-ferimentos.webp`, p("<b>Padrão, 6 PM.</b> Uma criatura adjacente cura <b>7d8+7 PV</b>."),
				{ exec: "action", custo: 6, alcance: "touch", rolls: [["Cura", [["7d8+7", "curapv"]]]] }),
			magia("Soco de Arsenal", `${T20I}/magias/soco-do-mestre.webp`, p("<b>Padrão, 5 PM.</b> Alcance médio: <b>5d6+3 de impacto</b> e empurrão de 3m (Fortitude CD 18 reduz à metade e evita o empurrão)."),
				{ exec: "action", custo: 5, alcance: "medium", circulo: 2, save: "Fortitude CD 18", rolls: [["Impacto", [["5d6+3", "impacto"]]]] })
		]
	});
	atores.nyrimm = await criarNPC({
		name: "Nyrimm",
		role: "nyrimm",
		link: true,
		disposition: 0,
		img: `${T20I}/racas/dahllan.webp`,
		nd: 6,
		cd: 25,
		tipo: "hum",
		raca: "dahllan",
		papel: "special",
		atr: { for: 0, des: 2, con: 2, int: 0, sab: 5, car: 1 },
		pv: 120,
		pm: 47,
		def: 22,
		walk: 9,
		pericias: { inic: 7, perc: 10, fort: 6, refl: 12, vont: 18, ades: 6, atle: 5, cura: 10, mist: 7, sobr: 10 },
		equipTxt: "Essência de mana ×2, robe místico aprimorado, varinha arcana canalizadora.",
		bio: p("Dahllan bruxa (usa Sabedoria para magias de bruxo; CD 25). Garante que Aldanna não está enfeitiçada. Sem muitas alternativas, é a mais interessada em fazer Torzogh desistir e voltar a missões lucrativas.", BIO_MM),
		items: [
			poder("Armadura de Allihanna", "icons/svg/shield.svg", p("<b>Movimento, 1 PM.</b> +2 na Defesa até o fim da cena."), { exec: "move", custo: 1,
				effects: [fx("Armadura de Allihanna", "icons/svg/shield.svg", [["system.attributes.defesa.bonus", "2"]])] }),
			poder("Empatia Selvagem", "icons/svg/eye.svg", p("Comunica-se com animais e usa Adestramento para mudar atitude e pedir favores."), { exec: "passive" }),
			magia("Adaga Mental", `${T20I}/magias/adaga-mental.webp`, p("<b>Padrão, 5 PM.</b> Alcance curto: atordoado 1 rodada (1×/cena) e <b>4d6 psíquico</b>. Vontade CD 25 reduz à metade e evita a condição."),
				{ exec: "action", custo: 5, tipoMagia: "arc", escola: "enc", alcance: "short", save: "Vontade CD 25", rolls: [["Psíquico", [["4d6", "psiquico"]]]], effects: [cond("Atordoado")] }),
			magia("Armadura Arcana", `${T20I}/magias/armadura-arcana.webp`, p("<b>Padrão, 3 PM:</b> +5 na Defesa por um dia. <b>Reação, 2 PM:</b> +5 na Defesa contra um ataque."),
				{ exec: "action", custo: 3, tipoMagia: "arc", escola: "abj", effects: [fx("Armadura Arcana", `${T20I}/magias/armadura-arcana.webp`, [["system.attributes.defesa.bonus", "5"]])] }),
			magia("Campo de Força", `${T20I}/magias/campo-de-forca.webp`, p("<b>Reação, 4 PM.</b> Ao sofrer dano, RD 30 contra esse dano."), { exec: "reaction", custo: 4, tipoMagia: "arc", escola: "abj" }),
			magia("Controlar Plantas", `${T20I}/magias/controlar-plantas.webp`, p("<b>Padrão, 2 PM.</b> Quadrado de 9m de vegetação em alcance curto vira terreno difícil; quem está lá (ou começa o turno lá) fica enredado e imóvel (Reflexos CD 25 evita). Livrar-se: ação padrão e Acrobacia ou Atletismo."),
				{ exec: "action", custo: 2, tipoMagia: "arc", escola: "tra", save: "Reflexos CD 25" })
		]
	});

	/* ---------- Ator de apoio: Stremtol ---------- */
	const porCasa = (casa) => PISTAS.filter((x) => x[0] === casa)
		.map(([, per, cd, txt]) => `<li>${cd ? `<b>${per.map((k) => NOMES_PERICIA[k]).join(", ")} CD ${cd}:</b> ` : "<b>Sem teste:</b> "}${txt}</li>`).join("");
	atores.stremtol = await criarNPC({
		name: "Vizinhança de Stremtol (pistas)",
		tokenName: "Stremtol",
		role: "stremtol",
		disposition: 0,
		img: "icons/svg/village.svg",
		nd: 7,
		cd: 20,
		tipo: "hum",
		papel: "special",
		atr: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
		pv: 1,
		def: 10,
		bio: p("<b>Ator de apoio, não vai para o mapa.</b> Cada item é uma casa com as pistas e CDs do livro. A macro <i>Investigar Stremtol</i> rola e sussurra o que cada resultado revela.",
			"Cada teste revela uma informação; bons testes podem revelar mais, e boas ideias ou interpretação podem revelar várias sem teste. O objetivo é perceberem que algo está errado, não exatamente o quê."),
		items: Object.entries(CASAS).map(([k, nome]) => poder(nome, k === "geral" ? "icons/svg/village.svg" : "icons/svg/door-closed.svg", `<ul>${porCasa(k)}</ul>`, { exec: "passive" }))
	});

	/* ------------------------------------------------------------------ */
	/* 4. Itens (provas)                                                    */
	/* ------------------------------------------------------------------ */
	const itemDoc = (d) => ({ ...d, folder: pasta.Item, flags: FLAGS() });
	const tesouro = (name, img, html) => itemDoc({ name, type: "tesouro", img, system: { description: { value: html }, qtd: 1, preco: 0, peso: 0, espacos: 0 } });
	const itensCriados = await Item.createDocuments([
		tesouro("Dossiês do Aluno (5 tomos)", `${T20I}/itens/gerais/livro.webp`,
			p("Cinco tomos bem encadernados com o símbolo de Khalmyr, um por aluno (Aldanna, Inagar, Alvuriell, Ysmenne, Rosa), carimbados com o selo da Escola de Etiqueta e Bom Comportamento de Madame Margebell. Texto no diário (handout). <b>Prova.</b>")),
		tesouro("Óculos de Margebell", "icons/svg/eye.svg",
			p("Lentes finas de <b>cristal rosado</b>. Quem as usa não é afetado pelas mensagens subliminares e consegue lê-las.",
				"Percepção ou Investigação CD 25 nota o matiz rosado; Conhecimento ou Misticismo CD 30 identifica algo de fora de Arton (o mesmo material do implante de Vadrinne nas Colinas).",
				"Usados pela cidade, revelam pichações e murais com mensagens: \"OBEDEÇA\", \"VOCÊ É IGUAL A TODOS\", \"CORAGEM É MALDADE\". Junto com uma pintura, são <b>prova</b>.")),
		tesouro("Pintura Subliminar", `${T20I}/itens/gerais/tinta.webp`,
			p("Um dos quadros da escola: uma cena inofensiva (família, baile, campo florido) com palavras escondidas. Quem olha sem os óculos faz Vontade (CD 15, +2 por teste). Junto com os óculos, é <b>prova</b>.")),
		tesouro("Anotações de Madame Margebell", `${T20I}/itens/gerais/livro-formulas.webp`,
			p("O método escrito para extirpar a \"anormalidade\" por desenhos e pinturas, baseado nos pergaminhos do \"gênio\" anônimo. <b>Prova.</b> Ghorskander já levou uma cópia."))
	]);
	const itemPorNome = (inicio) => itensCriados.find((i) => i.name.startsWith(inicio));

	/* ------------------------------------------------------------------ */
	/* 5. Macros                                                            */
	/* ------------------------------------------------------------------ */

	async function macroInvestigar() {
		const atores = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		const opCasas = Object.entries(CASAS).map(([k, n]) => `<option value="${k}">${n}</option>`).join("");
		const opPer = Object.entries(NOMES_PERICIA).map(([k, n]) => `<option value="${k}">${n}</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Investigar Stremtol" },
			content: `
				<div class="form-group"><label>Onde</label><select name="casa">${opCasas}</select></div>
				<div class="form-group"><label>Perícia</label><select name="per">${opPer}</select></div>
				<div class="form-group"><label>Resultado já rolado (opcional)</label><input type="number" name="manual" placeholder="rolar para os tokens selecionados"></div>
				<div class="form-group"><label>Incluir as pistas sem teste</label><input type="checkbox" name="semTeste"></div>`,
			ok: { label: "Investigar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const bonus = (a, k) => {
			if (k === "int") return Number(a.system.atributos?.int?.value) || 0;
			if (k === "ofic") return Math.max(0, ...Object.entries(a.system.pericias ?? {}).filter(([kk]) => kk.startsWith("ofi")).map(([, v]) => Number(v?.value) || 0));
			return Number(a.system.pericias?.[k]?.value) || 0;
		};
		const rolls = [];
		let melhor = Number(res.manual);
		let html = `<h3>${CASAS[res.casa]} · ${NOMES_PERICIA[res.per]}</h3>`;
		if (!res.manual) {
			if (!atores.length) return ui.notifications.warn("Selecione os tokens de quem investiga, ou informe o resultado.");
			melhor = -99;
			html += "<ul>";
			for (const a of atores) {
				const r = await new Roll(`1d20 + ${bonus(a, res.per)}`).evaluate();
				rolls.push(r);
				melhor = Math.max(melhor, r.total);
				html += `<li>${a.name}: <b>${r.total}</b></li>`;
			}
			html += "</ul>";
		}
		const daCasa = PISTAS.filter((x) => x[0] === res.casa);
		const reveladas = daCasa.filter(([, per, cd]) => cd && per.includes(res.per) && cd <= melhor).sort((a, b) => a[2] - b[2]);
		const proximas = daCasa.filter(([, per, cd]) => cd && per.includes(res.per) && cd > melhor);
		html += `<p>Melhor resultado: <b>${melhor}</b>. Cada teste revela uma informação; bons testes podem revelar mais (você escolhe).</p>`;
		html += reveladas.length ? `<ul>${reveladas.map(([, , cd, t]) => `<li>(CD ${cd}) ${t}</li>`).join("")}</ul>` : "<p><i>Nada com esta perícia.</i></p>";
		if (proximas.length) html += `<p style="font-size:0.85em">Ainda escondido com esta perícia: ${proximas.length} pista(s), CD ${proximas.map((x) => x[2]).join(", ")}.</p>`;
		if (res.semTeste) {
			const livres = daCasa.filter((x) => !x[2]);
			if (livres.length) html += `<p><b>Sem teste:</b></p><ul>${livres.map((x) => `<li>${x[3]}</li>`).join("")}</ul>`;
		}
		ChatMessage.create({ content: html, rolls, whisper: ChatMessage.getWhisperRecipients("GM") });
	}

	async function macroPinturas() {
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		if (!tokens.length) return ui.notifications.warn("Selecione os personagens que entraram na sala (quem está de olhos fechados ou com os óculos de Margebell não testa).");
		const SALAS = [["Sala de Espera", 3], ["Sala de Estar", 4], ["Sala de Jantar", 6], ["Sala de Música", 3], ["Sala de Crochê e Trabalhos Manuais", 5],
			["Sala de Cachimbos e Bebidas", 4], ["Cozinha Elegante", 2], ["Sala de Limpeza", 4], ["Sala de Aula", 8], ["Sala de Dança", 8], ["Berçário", 4], ["Quarto dos Alunos", 3]];
		const BILHETES = [
			"Você começa a achar sua própria roupa muito chamativa e berrante.",
			"Você começa a sentir vergonha de carregar armas.",
			"A lembrança de sua última aventura subitamente lhe provoca constrangimento.",
			"Você quer, acima de tudo, evitar fazer barulho.",
			"Você sente uma vontade enorme de se desculpar por qualquer gafe que possa ter cometido.",
			"Parece que agora seria um bom momento para elogiar a roupa de Madame Margebell.",
			"A vida em Stremtol parece pacífica e feliz.",
			"Madame Margebell é sua anfitriã. Você deveria dar um presente a ela.",
			"Você sente um ímpeto de repreender algum de seus colegas por sua falta de bons modos.",
			"Você está calado há muito tempo, deveria fazer um comentário bem-educado sobre o clima.",
			"Você acha que está sujo ou fedorento e sente vergonha por isso.",
			"Subitamente você se ressente de sua família e deseja que pudesse ter nascido em uma família normal de Valkaria.",
			"Você acha que deveria se desculpar a Madame Margebell por surgir na escola sem ter sido convidado.",
			"Você sente vontade de criticar a conduta de um de seus melhores amigos (no grupo ou fora dele).",
			"Você quer muito elogiar o trabalho que Madame Margebell fez com Aldanna."
		];
		const linhas = tokens.map((t) => {
			const e = t.actor.getFlag("world", "fdtPinturas") ?? { testes: 0, falhas: 0 };
			return `<tr><td>${t.name}</td><td>${e.testes} testes, ${e.falhas} falhas${e.semHabilidades ? ", sem habilidades" : ""}</td>
				<td><input type="checkbox" name="imune_${t.id}" title="Imune a efeitos mentais: +5"></td>
				<td><input type="checkbox" name="esgotou_${t.id}" ${e.semHabilidades ? "checked" : ""} title="Já perdeu todas as habilidades"></td></tr>`;
		}).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Pinturas Subliminares" },
			content: `
				<div class="form-group"><label>Sala</label><select name="sala">${SALAS.map(([n, q], i) => `<option value="${i}">${n} (${q} quadros)</option>`).join("")}
					<option value="zerar">Zerar a contagem dos selecionados</option></select></div>
				<table><tr><th>Quem</th><th>Até agora</th><th>Imune mental (+5)</th><th>Sem habilidades</th></tr>${linhas}</table>
				<p style="font-size:0.85em">Vontade CD 15, +2 por teste anterior do mesmo personagem. Marque "sem habilidades" quando o personagem já tiver perdido todas.</p>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.sala === "zerar") {
			for (const t of tokens) await t.actor.unsetFlag("world", "fdtPinturas");
			return ui.notifications.info("Contagem das pinturas zerada.");
		}
		const sala = SALAS[Number(res.sala)];
		const rolls = [];
		let resumo = `<h3>${sala[0]}</h3><p>${sala[1]} quadros nas paredes.</p><ul>`;
		for (const t of tokens) {
			const a = t.actor;
			const e = a.getFlag("world", "fdtPinturas") ?? { testes: 0, falhas: 0, usados: [] };
			e.usados ??= [];
			e.semHabilidades = !!res[`esgotou_${t.id}`];
			const cd = 15 + 2 * e.testes;
			const r = await new Roll(`1d20 + ${Number(a.system.pericias?.vont?.value) || 0} + ${res[`imune_${t.id}`] ? 5 : 0}`).evaluate();
			rolls.push(r);
			e.testes += 1;
			const destinatarios = [...game.users.filter((u) => u.isGM || a.testUserPermission(u, "OWNER")).map((u) => u.id)];
			if (r.total >= cd) {
				resumo += `<li>${t.name}: Vontade ${r.total} contra CD ${cd}: resiste.</li>`;
			} else {
				e.falhas += 1;
				let efeito;
				if (e.falhas <= 3) {
					const livres = BILHETES.map((_, i) => i).filter((i) => !e.usados.includes(i));
					const i = livres[Math.floor(Math.random() * livres.length)] ?? 0;
					e.usados.push(i);
					efeito = `recebe um bilhete secreto (${e.falhas}/3).`;
					ChatMessage.create({ content: `<p><i>${BILHETES[i]}</i></p>`, whisper: destinatarios, speaker: { alias: "Algo em você" } });
				} else if (!e.semHabilidades) {
					efeito = "<b>perde uma habilidade</b>: de classe (do maior nível para o menor; empate em ordem alfabética), depois devoção, origem e raça (em ordem alfabética).";
				} else {
					e.estagio = (e.estagio ?? 0) + 1;
					efeito = ["", "só tem uma ação padrão <b>ou</b> de movimento por rodada.", "fica <b>paralisado</b> (mesmo se imune).", "<b>começa a concordar com Margebell</b>: quer ser normal, levar uma vida mundana e não incomodar."][Math.min(e.estagio, 3)];
					if (e.estagio === 2) await a.toggleStatusEffect?.("paralisado", { active: true });
				}
				resumo += `<li>${t.name}: Vontade ${r.total} contra CD ${cd}: falha, ${efeito}</li>`;
			}
			await a.setFlag("world", "fdtPinturas", e);
		}
		resumo += "</ul>";
		ChatMessage.create({ content: resumo, rolls, whisper: ChatMessage.getWhisperRecipients("GM") });
	}

	async function macroInfiltracao() {
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		if (!tokens.length) return ui.notifications.warn("Selecione os personagens que estão se esgueirando.");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Infiltração na Escola" },
			content: `
				<div class="form-group"><label>Situação</label><select name="modo">
					<option value="procurados">Já foram vistos: os servos procuram juntos (Percepção +12)</option>
					<option value="escondidos">Ninguém sabe deles: cada servo na sala percebe sozinho (+5)</option></select></div>
				<div class="form-group"><label>Servos na sala</label><input type="number" name="servos" value="1"></div>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r.total; };
		let html = "<h3>Infiltração na Escola</h3>";
		const percepcoes = res.modo === "procurados" ? [await rolar("1d20 + 12")] : await Promise.all(Array.from({ length: Math.max(1, Number(res.servos) || 1) }, () => rolar("1d20 + 5")));
		html += `<p>Percepção dos servos: ${percepcoes.join(", ")}.</p><ul>`;
		let algumVisto = false;
		for (const t of tokens) {
			const f = await rolar(`1d20 + ${Number(t.actor.system.pericias?.furt?.value) || 0}`);
			const visto = percepcoes.some((pp) => pp >= f);
			algumVisto ||= visto;
			html += `<li>${t.name}: Furtividade ${f} ${visto ? "<b>é visto!</b>" : "passa despercebido."}</li>`;
		}
		html += "</ul>";
		if (algumVisto) {
			const chega = await rolar("1d6");
			html += `<p>Os servos atacam quem foi visto e chamam Madame Margebell, que chega em <b>${chega} rodada(s)</b>. Os outros podem fugir ou continuar escondidos.</p>`;
		}
		html += "<p style=\"font-size:0.85em\">Lembre: toda sala com quadros pede o teste de Vontade (macro <i>Pinturas Subliminares</i>).</p>";
		ChatMessage.create({ content: html, rolls, whisper: ChatMessage.getWhisperRecipients("GM") });
	}

	const macro = (name, img, fn, prefixo = "") => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Arco 2 · Aventura 1 · gerado por a2-av1-stremtol.js\n${prefixo}(${fn.toString()})();`
	});
	const dadosPistas = `const PISTAS = ${JSON.stringify(PISTAS)};\nconst CASAS = ${JSON.stringify(CASAS)};\nconst NOMES_PERICIA = ${JSON.stringify(NOMES_PERICIA)};\n`;
	const macros = await Macro.createDocuments([
		macro("Av1 · Investigar Stremtol", "icons/svg/village.svg", macroInvestigar, dadosPistas),
		macro("Av1 · Pinturas Subliminares", `${T20I}/itens/gerais/tinta.webp`, macroPinturas),
		macro("Av1 · Infiltração na Escola", "icons/magic/perception/silhouette-stealth-shadow.webp", macroInfiltracao)
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
	const leiOrdem = game.actors.find((a) => a.getFlag("world", "fdtRole") === "leiordem");

	await JournalEntry.create({
		name: "Arco 2 · Aventura 1 · Os Aventureiros de Stremtol",
		folder: pasta.JournalEntry,
		flags: FLAGS(),
		pages: [
			pagina("Guia do Mestre", `
				<h2>Resumo</h2>
				<p>${L(atores.torzogh)}, líder dos Mata-Malvados, contrata a Guarda: acha que a ex-companheira Aldanna foi \"raptada\" pelo marido, o conde Osmont. Ninguém acredita. Em Stremtol, uma vizinhança \"normal\" demais, o grupo descobre que Aldanna e outros cônjuges passaram pela <b>Escola de Etiqueta e Bom Comportamento</b> de ${L(atores.margebell)}, que apaga \"anormalidades\" com pinturas subliminares baseadas na pesquisa de Ghorskander.</p>
				<p><b>Nível presumido:</b> 4 personagens de nível 7. Dá um nível e até 5 de Lei &amp; Ordem${leiOrdem ? ` (${L(leiOrdem)})` : ""}.</p>
				<h2>Fases</h2>
				<ol>
					<li><b>Normalidade</b> na Guarita da Praia (Ulnsariann e Throgarimm brigando; não é gancho).</li>
					<li><b>Caminho para a taverna</b>: role na tabela Encontros em Valkaria se for o primeiro caso.</li>
					<li><b>Taverna do Esqueleto Gordo</b>: Torzogh, os Mata-Malvados, Mavorn e Engill.</li>
					<li><b>Bem-vindos a Stremtol</b>: investigação casa a casa (${L(atores.stremtol)} e ${linkMacro("Investigar")}).</li>
					<li><b>Volta às Aulas</b>: a escola, os servos e Margebell.</li>
					<li><b>Escola de Duros Golpes</b>: o passeio pelas galerias e as pinturas (${linkMacro("Pinturas")}).</li>
					<li><b>Punindo os Bagunceiros</b>: ${L(atores.margebell)} e quatro ${L(atores.anjo)}.</li>
					<li><b>Desfecho</b>, provas e pagamento.</li>
				</ol>
				<h2>Macros</h2>
				${lista([
					`${linkMacro("Investigar")}: escolha a casa e a perícia; rola para os tokens selecionados (ou use um resultado já rolado) e sussurra as pistas que a CD alcança.`,
					`${linkMacro("Pinturas")}: a cada sala com quadros, Vontade CD 15 (+2 por teste) para os selecionados. Distribui os bilhetes secretos aos donos dos personagens nas três primeiras falhas e depois avisa a perda de habilidades e os estágios finais.`,
					`${linkMacro("Infiltração")}: Furtividade contra os servos, procurando juntos (+12) ou um a um; se alguém for visto, rola em quantas rodadas Margebell chega.`
				])}`, 100),
			pagina("Fases 0 a 2 · Guarita e Esqueleto Gordo", `
				<h3>Normalidade</h3>
				<p>Ulnsariann e Throgarimm chegam de uma tocaia que durou a noite: o elfo prendeu ladrões no flagra, o anão queria segui-los até o receptador. Pedem a opinião dos novatos enquanto patrulheiros trazem os presos. Não é gancho.</p>
				<h3>A Taverna do Esqueleto Gordo</h3>
				<p>Prédio atarracado de dois andares, telhado pontudo, duas chaminés; placa de um esqueleto barrigudo mastigando um pernil. Eclética e acolhedora, com famílias jantando. O taverneiro <b>Mavorn</b> e o filho <b>Engill</b> contam a quem quiser ouvir como os Mata-Malvados salvaram o garoto de mortos-vivos há mais de 10 anos e ganharam mesa, cama e comida de graça (Engill deu o nome ao grupo).</p>
				<blockquote><p><i>"Vocês são da Guarda? E são aventureiros? Parece que finalmente a boa fortuna nos trouxe algo que não seja um tapa na cara! Sentem-se, comam, bebam e ouçam nossa história! Já derrotamos muitos vilões, mas hoje quem precisa de ajuda somos nós!"</i></p></blockquote>
				<p><b>Os Mata-Malvados:</b> ${L(atores.torzogh)} (bárbaro, líder), ${L(atores.ingwi)} (elfa ladina), ${L(atores.thurab)} (qareen clérigo de Azgher, rosto coberto) e ${L(atores.nyrimm)} (dahllan bruxa). Um grupo comum de Valkaria, do nível dos heróis.</p>
				<h3>O que se descobre com o mínimo interesse</h3>
				${lista([
					"Aldanna é caçadora e ajudou a fundar o grupo. Sua única queixa era morar em Valkaria; preferia os ermos.",
					"Há três anos, no Império de Tauron, o grupo salvou de escravistas o nobre valkariano <b>Osmont Elbannise</b>, que se apaixonou por Aldanna. Ela não parecia retribuir, mas casou com ele.",
					"Viveram separados por um tempo e brigavam muito por ela passar tempo fora. Numa visita, ela anunciou de repente a aposentadoria.",
					"Ela não parecia apaixonada; parece ter cedido à insistência dele.",
					"Os Mata-Malvados não são mais tão jovens e nenhum tem plano para a velhice.",
					"Osmont é um conde muito rico. Ingwi acha que Aldanna trocou um grupo sem futuro pela segurança.",
					"Nyrimm garante que ela não está enfeitiçada. Aldanna não tem família: nada de chantagem.",
					"Osmont deixou as cortes e foi morar com ela em <b>Stremtol</b>, região próspera e pacata. Ela virou dona de casa.",
					"Ela recebeu os ex-colegas e parecia feliz, uma anfitriã perfeita. O javali Aníbal, o arco e o equipamento dela não estavam em lugar nenhum.",
					"Os outros se recusam a interferir; para eles, \"salvá-la\" seria vilania. Concordaram em chamar a Guarda para provar que não há nada errado e seguir em frente.",
					"Torzogh e Aldanna foram um casal (1411–1415) e continuaram amigos. Ele demorou anos para aceitar a saída do minotauro Cirius."
				])}
				<p><b>No quarto de Torzogh:</b> um retrato malfeito dos Mata-Malvados jovens, com Cirius, Aldanna e o javali Aníbal. Torzogh e Aldanna lado a lado, sem pose de casal.</p>
				<p><b>Linha do tempo:</b> 1408 grupo formado · 1411 Torzogh e Aldanna juntos · 1412 Cirius sai · 1414 Torzogh aceita · 1415 separação · 1417 salvam Osmont · 1418 Aldanna e Osmont casal · 1419 casamento · 1420 Aldanna sai do grupo.</p>
				<h3>Investigando a esmo</h3>
				<p>Contratante antigo em Valkaria: uma velha guerreira aposentada que confirma tudo. Servos dos Elbannise fofocam sobre o casal e a amizade de Osmont com os <b>Ronchetillon</b>. Boatos sobre uma aventureira mediana: Investigação CD 30 revela algo sobre Stremtol.</p>
				<h3>Contingência: Nada para Ser Visto Aqui</h3>
				<p>Se desistirem, encerre: sem nível nem Lei &amp; Ordem. Se quiserem prender Torzogh, não há provas, só indícios de obsessão; os Mata-Malvados ficam do lado dele, a menos que convencidos. Para continuar depois, Osmont agradece e convida o grupo para jantar em Stremtol.</p>`, 200),
			pagina("Fase 3 · Bem-vindos a Stremtol", `
				<p>No extremo do Refúgio da Felicidade, depois de terrenos nobres com exércitos particulares (o distintivo abre caminho), surge uma aldeia em miniatura: casas novas, grandes e bonitas mas não opulentas, em volta de uma praça, com cercados, grama recém-cortada, cheiro de biscoitos, portas abertas, vizinhos conversando. Um subúrbio de filme. Acima de tudo, \"normal\".</p>
				<p>Deixe os jogadores conduzirem. Lembre que há nobres ali e que todos podem ser vítimas. Conversar ou entrar escondido funcionam igualmente. Use ${linkMacro("Investigar")} ou a lista de pistas por casa abaixo.</p>
				<h3>Por que as CDs são tão altas?</h3>
				<p>As \"informações especiais\" podem ser percebidas só observando, ao entrar: as CDs altas simulam sacadas geniais. Conversando é bem mais fácil, e boas ideias dispensam testes.</p>
				<h3>Moradores (de dia)</h3>
				${lista([
					"<b>Osmont e Aldanna Elbannise:</b> ele passa o dia em reuniões no Bairro do Recomeço e volta no fim da tarde; ela cuida da casa. Se souberem que o grupo vem dos Mata-Malvados, Osmont convoca reunião ao chegar.",
					"<b>Inagar e Albert:</b> casa vazia de dia (trabalham na Guilda dos Contadores, que serve quase só aos Ronchetillon). Inagar, ex-mago, é aprendiz 25 anos mais velho que os outros; Albert, contador, é ciumento e não o deixa sozinho.",
					"<b>Illydna e Alvuriell:</b> de dia só o goblin, vestido para um baile, sem fazer nada, diante de uma mesa farta preparada há horas. Ela é serva dos Ronchetillon e o trata como um incapaz.",
					"<b>Remont e Ysmenne Ronchetillon:</b> sempre em casa, acolhedores, contam a história completando as frases um do outro. Ysmenne era cavaleira da família.",
					"<b>Hugo, Rosa e o bebê Luka:</b> casa de camponês, teto de sapé, plantação. Sempre trabalhando, humildes demais."
				])}
				${Object.entries(CASAS).map(([k, n]) => `<h3>${n}</h3><ul>${porCasa(k)}</ul>`).join("")}
				<p class="secret"><b>Aníbal:</b> para comemorar a nova vida, Aldanna preparou o javali para o jantar e o serviu a Osmont na primeira refeição na casa nova.</p>`, 300),
			pagina("Handout · Dossiês do Aluno", `
				<p><i>Cinco tomos bem encadernados no escritório trancado de Remont, todos com o símbolo de Khalmyr e o título</i> Dossiê do Aluno<i>. Na folha de rosto, o nome de um morador e um carimbo: Escola de Etiqueta e Bom Comportamento de Madame Margebell. Letra caprichosa.</i></p>
				<h3>Aldanna</h3>
				<p><b>Passado:</b> aventureira. Especializada em viver nos ermos e derramar sangue.<br><b>Principais desafios:</b> acha-se especial. Ideias heroicas. Acostumada à vida na floresta. Tem apego perverso a um animal. Mesmo casada, quer continuar sendo anormal. Cercada de outros anormais.<br><b>Resultados:</b> livre de comportamentos desviantes após dois meses de treinamento. Mantive suas memórias, mas atreladas a sentimentos de vergonha e imaturidade. Noções de etiqueta, culinária e serviços domésticos vinculadas à sensação de maturidade. Opiniões conflitantes com as do marido extraídas.<br><b>Recomendações:</b> nenhum objeto que possa lembrá-la da vida anormal. Aulas de reforço se demonstrar vontade de sair da vizinhança.</p>
				<h3>Inagar</h3>
				<p><b>Passado:</b> mago treinado desde a juventude.<br><b>Principais desafios:</b> contato com magia arcana em períodos de formação. Solitário e antissocial, pode passar noites inteiras pesquisando. Acha-se inteligente. Gosta de ler. Curioso.<br><b>Resultados:</b> aversão por magia alcançada após um mês. Mantive suas memórias, atreladas a gatilhos de humilhação e vergonha. Dependência emocional do marido obtida após três meses. Plenamente socializado, livre de pensamento excessivo.<br><b>Recomendações:</b> manter os grimórios por perto para garantir um nível basal de vergonha. Para evitar o ressurgimento dos hábitos antissociais, proibir solidão por mais de alguns minutos.</p>
				<h3>Alvuriell</h3>
				<p><b>Passado:</b> ladrão. Vida às margens da sociedade.<br><b>Principais desafios:</b> por ser um goblin, é preciso reformular sua mente em níveis fundamentais. Seu histórico de sobrevivência leva a pensamentos independentes.<br><b>Resultados:</b> reconhecimento da anormalidade da própria raça alcançado após um mês. Nova personalidade moldada em quatro meses. Mantido em um patamar infantil, mentalidade adulta considerada supérflua para seu novo cotidiano. O nome requisitado foi implantado, mas ainda existe memória do nome anterior.<br><b>Recomendações:</b> é um incapaz, portanto deve ser tratado com piedade. Mantê-lo longe de qualquer decisão ou tarefa.</p>
				<h3>Ysmenne</h3>
				<p><b>Passado:</b> cavaleira da família Ronchetillon. Acostumada a glória. Veterana de batalhas.<br><b>Principais desafios:</b> seu histórico leva a pensamentos de orgulho. Sua posição provoca noções de heroísmo. Comportamento anormal incentivado por tradições.<br><b>Resultados:</b> primeiro sucesso total. Tornada indefesa após seis meses. Amor por Remont obtido após mais dois meses. Pensamentos de lealdade e dever para a família convertidos em servidão ao marido. Usei a memória de seus juramentos para torná-la incapaz de desobedecer.<br><b>Recomendações:</b> mantê-la longe de qualquer atividade física. Todo ato de coragem deve ser imediatamente punido. Caso haja reincidência, trazer para aulas de reforço.</p>
				<h3>Rosa</h3>
				<p><b>Passado:</b> necromante, criminosa, vilã. Acostumada à companhia de mortos-vivos.<br><b>Principais desafios:</b> a aluna tem desvios fundamentais de caráter. Seu contato com magia deixou marcas indeléveis. Sua notoriedade pode levar a reconhecimento e conflito de personalidades.<br><b>Resultados:</b> memória totalmente apagada e nova personalidade básica implantada após quatro meses. Moralidade mantida num nível primitivo. Remoção de habilidades e conhecimentos desnecessários, incluindo alfabetização. Inseri conhecimentos de bons modos, culinária e tarefas domésticas. Nome anormal trocado.<br><b>Recomendações:</b> cotidiano extremamente simples, ligado a uma vida pastoril. Uma gravidez seria ideal. Caso demonstre volta a comportamentos vilanescos, recomendo execução. Deixei-a incapaz de se defender.</p>`, 400),
			pagina("Respostas em Stremtol", `
				<p>Ninguém em Stremtol tem habilidades, equipamento ou guarda-costas: descobrir a escola é fácil. Construa com o grupo como isso acontece.</p>
				<h3>Violência ou intimidação</h3>
				<p>Os moradores só podem se render ou morrer. Lembre que os Mata-Malvados chamaram a Guarda justamente para não resolver na força, e que atacar um nobre tem repercussões. Veja a contingência abaixo.</p>
				<h3>Reunião da vizinhança</h3>
				<p>Se o grupo se fizer notar e ficar algumas horas, Remont, Osmont, Albert, Illydna e Hugo se reúnem na sala das cinco cadeiras assim que tiverem privacidade. Sem barreiras mágicas, Furtividade funciona. Remont lidera e tenta arrancar de Osmont o que Aldanna disse; Illydna e Albert têm medo; Hugo se sente moralmente superior (\"eliminou uma ameaça\"). Concordam em fingir que está tudo bem e Remont se oferece para pagar \"aulas de reforço\": é aqui que aparecem a escola e o nome de Madame Margebell.</p>
				<h3>Interrogatório</h3>
				<p>As vítimas são <b>incapazes</b> de falar das \"aulas\", nem por magia. Os outros podem revelar (Diplomacia, Enganação ou Intimidação) o nome da escola, a vida anterior de uma vítima ou os Dossiês. Ninguém sabe como a lavagem funciona.</p>
				<h3>Infiltração</h3>
				<p>A casa de Remont é a mais útil: destaque a porta fechada. Ao fim, o grupo deve saber o que aconteceu, o nome da escola e que ela fica no Refúgio da Felicidade, talvez o nome de Margebell. Não os métodos.</p>
				<h3>Salvando à força</h3>
				<p>Nenhuma vítima quer sair. Só arrastadas. Coagidas a depor, defendem os cônjuges: os heróis ficam contra todos, até quem querem ajudar.</p>
				<h3>Contingência: Bandidos contra o Crime</h3>
				<p>Ataques ou ameaças sérias fazem os moradores revelarem tudo, mas os Ronchetillon ficam sabendo. O grupo enfrenta Margebell normalmente, mas a família abafa tudo: nenhum tribunal aceita o caso e, se viva, ela fica impune. <b>Sem Lei &amp; Ordem por este caso</b> (o nível vem mesmo assim). Os Mata-Malvados ficam sob vigilância e nunca mais se aproximam de Aldanna. O pagamento fica a seu critério. Não é punição: é uma história sobre a corrupção do sistema.</p>`, 500),
			pagina("Fases 4 a 6 · A Escola", `
				<p>No Refúgio da Felicidade, a poucas horas de Stremtol: construção sóbria e discreta atrás de um muro alto, porta de ferro fundido, jardim impecável, casa grande e funcional. Poucos fora da elite a conhecem. Se quiser, role um encontro no caminho.</p>
				<p>Ao bater a aldrava, uma serva sorridente (${L(atores.servo)}) abre: <i>"Sejam bem-vindos à Escola de Etiqueta e Bom Comportamento de Madame Margebell. Por favor, queiram me acompanhar. Peço para que me informem de qualquer coisa que eu possa fazer para tornar sua visita mais agradável."</i> Um jardineiro e um mordomo têm exatamente o mesmo sorriso; o mordomo se oferece para guardar casacos e armas.</p>
				<p>Saguão de granito e mármore, enorme símbolo de Khalmyr e o lema <b>\"Bondade é normalidade\"</b>. Sala de espera com chá, biscoitos e <b>três pinturas</b> (as primeiras mensagens; ainda não peça testes).</p>
				<h3>A Professora de Normalidade</h3>
				<p><i>"Muito prazer. Sou Margebell, diretora da Escola de Etiqueta e Bom Comportamento. Desejavam ter comigo?"</i></p>
				${lista([
					"Despreza os heróis (Intuição contra a Nobreza dela nota o sorriso falso). Tem mais apreço por clérigos e devotos de Khalmyr.",
					"Responde tudo, mostra a escola e sugere que fiquem uma temporada para aprender boas maneiras (\"uma introdução aos modos da capital\").",
					"Não nega nada: Aldanna casou por vontade própria e só aprendeu a aceitar; Rosa e Alvuriell deixaram o crime; Inagar aprendeu a amar; Ysmenne subiu socialmente. <i>\"Mais importante que tudo isso, agora todos eles são normais.\"</i>",
					"Acusada, diz que é um mal-entendido e convida para conhecer as instalações.",
					"Nunca ataca primeiro. Atacada, foge para as galerias. Um ataque imediato e brutal é o jeito mais eficiente de derrotá-la, mas o grupo dificilmente desvenda o mistério."
				])}
				<h3>Escondidos na escola</h3>
				<p>Use ${linkMacro("Infiltração")}. Se foram vistos, os servos procuram juntos (+12); encontrados, são atacados e Margebell chega em 1d6 rodadas. Se ninguém sabe deles, cada servo testa sozinho.</p>
				<h3>Escola de Duros Golpes</h3>
				<p>Tudo preciso, discreto, limpo. Belas pinturas em todas as paredes e, em várias salas, <b>estátuas de anjos em tamanho real</b>, pintadas com perfeição (descreva-as!). Margebell guia o grupo por todas as galerias e, na central, convida a se matricular. Se recusarem, ataca.</p>
				<p><b>Descobrir as mensagens:</b> Conhecimento ou Nobreza CD 30 nota elementos dispostos com significado; <i>Compreensão</i> revela que há mensagens, mas não quais; só Atuação, Ofício (pintor) ou parecido CD 30 revela palavras escritas que a mente absorve.</p>
				<h3>Salas e quadros</h3>
				${lista([
					"<b>Primeiro andar:</b> Sala de Estar (4), Sala de Jantar (6, mesa sempre posta), Sala de Música (3, piano), Crochê e Trabalhos Manuais (5), Cachimbos e Bebidas (4), Cozinha Elegante (2, falsa), Sala de Limpeza (4), Sala de Aula (8), Sala de Dança (8), Berçário (4, boneco no berço).",
					"<b>Segundo andar:</b> Quarto Principal (sem quadros; trancado, Ladinagem CD 25; óculos de reserva numa gaveta trancada) e cinco Quartos dos Alunos (3 cada)."
				])}
				<h3>As pinturas</h3>
				<p>Todas têm mensagens subliminares: OBEDEÇA · VOCÊ É IGUAL A TODOS · CONFORMIDADE É FELICIDADE · HEROÍSMO É SANGUINOLÊNCIA · ACEITE SEU LUGAR · VIVA E MORRA SEM OFENDER. Só não é afetado quem não usa a visão ou usa os óculos de Margebell.</p>
				${lista([
					"Cada sala com quadros: <b>Vontade CD 15, +2 por teste</b> (efeito mental; imunes testam com +5). Cada jogador controla os próprios testes se o grupo se separar.",
					"As três primeiras falhas: um bilhete secreto cada (não é controle mental, só como o personagem se sente; ele não estranha).",
					"Depois: perde uma habilidade por falha (classe em ordem decrescente de nível, alfabética no empate; devoção; origem; raça).",
					"Sem habilidades: 1ª falha, só uma ação padrão ou de movimento por rodada; 2ª, paralisado (mesmo imune); 3ª, começa a concordar com Margebell.",
					"A conversão completa leva meses: só acontece se o personagem for abandonado na escola."
				])}
				<p><b>Temas de quadros:</b> uma senhora elegante numa cadeira; crianças num campo florido; moças e rapazes cavalgando; um baile; uma família em volta do pai; um cavalheiro corpulento de casaca.</p>`, 600),
			pagina("Fase 6 · Punindo os Bagunceiros", `
				<p>Margebell quer o grupo na escola o máximo possível: conta seus sucessos, convida para jantar (mais quadros) e, quando os julga \"domados\", oferece aulas grátis. Quando o grupo se mostrar hostil (voz de prisão, ordem de fechar), ela luta até a morte.</p>
				<blockquote><p><i>"Como ousam? Como têm coragem de falar isso dentro de um reduto de Khalmyr, de um dos únicos lugares que busca ensinar as pessoas a serem normais? Observem Stremtol e vejam a felicidade que criei! Acham que seria melhor manter um criminoso à solta, deixar que uma necromante continuasse com suas artes profanas? Acham que deveríamos tolerar caçadores e magos em nossa sociedade? Acham adequado que uma cavaleira continue trajando armaduras e portando armas após o casamento? Desejam preservar os excessos da nobreza, celebrar sua vida decadente? Tudo isso são chiliques infantis de quem só quer parecer especial! Eu presto um serviço indispensável à sociedade, fazendo todos se encaixarem com perfeição! Khalmyr me inspirou e eu estou criando normalidade! Até mesmo tive a benevolência de oferecê-la a vocês!"</i></p>
				<p><i>"O Deus da Justiça vai castigar os anormais que vêm interromper nosso trabalho! Sintam o julgamento de Khalmyr!"</i></p></blockquote>
				<h3>Encontro</h3>
				${lista([
					`${L(atores.margebell)} (ND 7) e quatro ${L(atores.anjo)} (ND 5).`,
					"Os anjos alçam voo e projetam o <b>campo de 3m</b> em volta dela: ninguém entra, nada de fora a afeta; ela age normalmente. Dura até o último anjo cair. Ligue o efeito \"Protegida pelo campo dos anjos\" na ficha dela.",
					"Ela fica no campo lançando magias e fortalecendo os anjos (Bênção, Oração, Cólera Divina)."
				])}
				<h3>A história de Margebell</h3>
				<p><b>Com conversa:</b> criada numa família comum, ordenada num templo, passou a ter enjoo físico de aventureiros celebrados e impunes. Largou o templo sem largar a fé: os mortais não entendem Khalmyr, e o mundo deveria ser antes de tudo ordeiro. Foi governanta dos Ronchetillon por anos, juntou uma pequena fortuna e partiu para sua missão.</p>
				<p><b>Com interrogatório:</b> comprava prisioneiros de carcereiros para experimentos que só destruíam personalidades. Até que um \"gênio\" discreto, sem rosto nem nome, trouxe pergaminhos sobre mensagens subliminares em imagens e as lentes que as bloqueiam. Um ano depois ela tinha o primeiro sucesso (uma cultista virou serva). Os Ronchetillon financiaram a escola: Remont amava Ysmenne, cavaleira da família \"não boa o bastante\", que foi a primeira aluna. Depois financiaram Stremtol. Os alunos seguintes eram ligados aos Ronchetillon. Ela quer apresentar o programa ao alto clero de Khalmyr. Por último, prendeu celestiais como estátuas. O cavalheiro voltou uma vez, levou uma cópia do método e sumiu.</p>
				<section class="secret"><h3>O que realmente aconteceu</h3>
				<p>Ghorskander, o oficial médico da Roca, precisava afetar a mente dos artonianos. Ouviu falar da sacerdotisa que comprava prisioneiros, entregou-lhe a pesquisa sem mostrar o rosto e deixou que ela a completasse. Depois levou o método pronto: reprogramação de personalidade <b>sem magia</b>, irreversível e indetectável.</p>
				<p>Ele ensinou criminosos menores ligados à Companhia dos Irmãos a pôr as mensagens em pichações, anúncios, brasões, murais de deuses e da Rainha-Imperatriz. Os aventureiros da capital estão perdendo seus poderes. Para proteger os próprios capangas, usou o cristal rosado (que burla o bloqueio da Rocha Cinzenta) nas lentes e em implantes.</p></section>
				<h3>Contingência: Vamos Limpar Valkaria</h3>
				<p>Com os óculos, o grupo vê mensagens pela cidade (\"OBEDEÇA\", \"CORAGEM É MALDADE\"...). Apagar tudo é longo e tedioso: melhor contratar ou convencer NPCs. Investigar os autores dá pouco (criminosos ligados à Companhia, artistas pagos por nobres, Avatares do Futuro Eterno). Mas a iniciativa tem consequências positivas na Aventura 7.</p>`, 700),
			pagina("Fase 7 · Desfecho, Provas e Pagamento", `
				<p>Derrotada Margebell, resta coletar provas e apresentá-las a Mathilda. Stremtol é desfeita e a Igreja de Khalmyr anula os casamentos das vítimas, mas elas entendem o que houve e continuam sentindo o mesmo. Não há \"resposta certa\": deixe os jogadores darem ideias.</p>
				${lista([
					"Nenhum Ronchetillon ou outro nobre é punido: não há provas de que sabiam dos procedimentos. As famílias abafam e condenam a professora em público.",
					"Illydna e Albert podem ser punidos (e merecem), mas deve ficar claro o gosto de injustiça por serem os únicos bodes expiatórios.",
					"Aldanna pode voltar aos Mata-Malvados, mas terá de reaprender tudo (do 1º nível) e esquecer a doutrinação, o que leva anos."
				])}
				<h3>Provas (até 5 de Lei &amp; Ordem)</h3>
				${lista([
					`Os Dossiês do Aluno (${L(itemPorNome("Dossiês"))}).`,
					`Uma pintura e um par de óculos (${L(itemPorNome("Pintura"))}, ${L(itemPorNome("Óculos"))}).`,
					"Um servo sem personalidade nem memória.",
					`As anotações de Madame Margebell (${L(itemPorNome("Anotações"))}).`,
					"Uma testemunha confiável (um dos maridos ou esposas de Stremtol)."
				])}
				<p>Registre com a macro <i>Arco 2 · Lei &amp; Ordem</i> (opção \"Provas entregues\").</p>
				<h3>Pagamento</h3>
				<p>Se Aldanna for posta em segurança (voltando ou não ao grupo), Torzogh paga: níveis 8 ou 9, T$ 12.000; nível 10, T$ 24.000; nível 11, T$ 32.000.</p>
				<h3>Se o caso não for resolvido</h3>
				<p>Na Aventura 7, cada PJ perde as duas últimas habilidades ativáveis que ganhou (as mensagens subliminares de Ghorskander funcionam).</p>`, 800)
		]
	});

	ui.notifications.info("Arco 2, Aventura 1 criada: Margebell, anjos, servos, Mata-Malvados, pistas de Stremtol, provas, diário e 3 macros. Veja a pasta \"" + NOME_PASTA + "\".");
})();
