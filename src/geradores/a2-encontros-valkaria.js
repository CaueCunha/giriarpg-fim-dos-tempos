/* =====================================================================
 * FIM DOS TEMPOS · ARCO 2 · ENCONTROS EM VALKARIA
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Arco 2 · Encontros em Valkaria" com:
 *      - Os habitantes da tabela de encontros: Gnuk, Farboraff e Brungamm, Wynstar, Drelene,
 *        Melora, Galswell, o Elemental da Poluição, Bebê Corisco, um goblin da Gazeta, Yolana,
 *        Anatole, o Avatar da Cidade, Justine e Tilliann.
 *      - Itens: a Carroça de Lagarto Interno, os 25 chapéus dos chapeleiros anões e os poderes
 *        concedidos de Drelene e de Tilliann.
 *      - Tabelas: Encontros em Valkaria (detalhada), Chapéus, Lutadores das Qualificatórias,
 *        Corredores do Circuito e Aforismos do Avatar.
 *      - Diário com as regras da tabela, uma página por encontro e o Clube de Cavalheiros.
 *      - Macros: Encontro na Cidade, Testes dos Encontros e Desafios da Cidade (corrida, lixão,
 *        qualificatórias da Arena).
 *   3. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "a2encontros".
 *
 * Feito a partir do código do sistema (1.6.4, out/2026). Validado no Foundry simulado do
 * módulo giriarpg-fim-dos-tempos; veja o guia a2-encontros-valkaria.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "a2encontros";
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
			window: { title: "Encontros em Valkaria: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para os Encontros em Valkaria.</p>
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
	const NOME_PASTA = "FdT · Arco 2 · Encontros em Valkaria";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#5b6b8a", flags: FLAGS() })).id;
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
	const R = `${T20I}/racas`;
	const GE = `${T20I}/itens/gerais`;
	const MG = `${T20I}/magias`;
	const UM_DIA = { value: 86400, units: "seconds" };

	/* ------------------------------------------------------------------ */
	/* 2. Dados (fonte única para atores, tabelas, macros e diário)         */
	/* ------------------------------------------------------------------ */
	// tipo: "npc" circula pela cidade e pode ser reencontrado; "local" é fixo e fica descoberto;
	// "franquia" é um local que surge em vários pontos; "evento" acontece uma vez onde o grupo está.
	const ENC = [
		{ k: "gnuk", nome: "Gnuk, o goblin inventor", tipo: "npc", roles: ["gnuk"],
			resumo: "Gnuk construiu a <b>Carroça de Lagarto Interno</b>, um carro primitivo movido a pólvora explosiva e essência de mana (tecnicamente ilegal e muito caro). Nunca foi testada: ele pede que os personagens sejam seus pilotos de teste, num dia e lugar em que precisem de velocidade. É amigável e faz tudo para acomodar o grupo.",
			mec: "Veículo Grande, deslocamento 30, Defesa 12 + Des do condutor, 200 PV, leva 2 criaturas Médias ou 40 espaços; –5 em Pilotagem. Na 1ª rodada de uso, <b>10%</b> de explodir (5d6 de impacto nos pilotos, Reflexos CD 20 reduz à metade), +10% por rodada até 100%. Sem explosão e reencontrado, Gnuk aperfeiçoa: 5% e +5% por rodada. Testada de novo sem explodir e reencontrado uma 3ª vez, a Carroça está pronta (sem explosão nem penalidade) e, se o grupo foi amigável, ele a <b>dá</b> aos personagens. Cruza um hexágono de Valkaria em 5 minutos (em vez de meia hora); exige 10 cargas de pólvora (10 munições de mosquete) e 1 essência de mana por aventura." },
		{ k: "chapeleiros", nome: "Farboraff e Brungamm, os chapeleiros anões rivais", tipo: "npc", roles: ["farboraff", "brungamm"],
			resumo: "Farboraff (Só Boinas Chapéus em Geral) e Brungamm (Cartolas & Cia.) têm lojas uma em frente à outra, os mesmos produtos e os mesmos preços. Rivais há anos: quando um muda de ponto, o outro o segue. Ambos oferecem grandes descontos para os heróis serem seus garotos-propaganda. Ficam sempre nas lojas.",
			mec: "Cada chapéu é vestuário (1 espaço) com um bônus único de +1 (não acumula com chapéus iguais de outra fonte). T$ 50 cada; 50% de desconto fácil, só incentivando a competição. Quem faz propaganda ganha chapéus de graça e mais tarde é infernizado por aventureiros que fazem propaganda do rival." },
		{ k: "wynstar", nome: "Wynstar, o unicórnio burocrata", tipo: "npc", roles: ["wynstar"],
			resumo: "Um unicórnio que trocou os bosques encantados pela vida estável de funcionário público. Trabalha para o Lorde Urbano dos Cidadãos Extraordinários, teleportando-se pela cidade para fiscalizar atividades, equipamentos e devoções dos aventureiros. Inspeciona objetos, pergunta da missão, do empregador e das crenças. Trabalhar com a Guarda não exime ninguém de seguir as leis. Não ataca nem prende: manda o culpado pegar um formulário nos alforjes dele.",
			mec: "O Mestre decide o que é irregular (armas de fogo, deuses como Thwor ou Megalokk). Preencher o formulário: <b>Nobreza ou Conhecimento CD 20</b>. Quem não quer ou não consegue leva multa de <b>20% do próximo pagamento</b>, já descontada pela Xerife Mathilda. Quem foge pode ser perseguido: ele se teleporta à frente, repetidas vezes. Formulários: \"Declaração NW-46 de Uso Ético de Gazuas\", \"Cadastro Preventivo Não-Divino de Cidadãos com Características Monstruosas\" (e a \"Nota de Protesto Omnipopulacional para Recusa de Reconhecimento de Perigo Intrínseco\"), \"Requisição Rubro-Prateada para Livre Exibição de Símbolos Sagrados Controversos\"." },
		{ k: "drelene", nome: "Drelene, a deusa sem portfólio", tipo: "npc", roles: ["drelene"],
			resumo: "Uma humana de cabelos castanhos e olhos azuis que chama atenção porque sempre há alguém comentando como ela chama atenção. É uma deusa menor por ser uma deusa menor: um dia declarou que era, e as pessoas acreditaram. Ninguém sabe citar um feito dela. Ao encontrar o grupo, \"aceita\" ser adorada, como um fardo; nunca cogita que não a adorem. Os devotos à volta ficam horrorizados com quem não conhece sua deusa.",
			mec: "Os personagens podem virar devotos com as regras normais de devoção. <b>Crenças:</b> adorar Drelene e refutar argumentos invejosos. <b>Símbolo:</b> retângulo vertical com o rosto dela. <b>Canalizar Energia:</b> qualquer. <b>Arma preferida:</b> não há (não podem lançar Arma Espiritual e similares). <b>Devotos:</b> quaisquer. <b>O&amp;R:</b> exaltá-la sempre que possível e convencer o maior número de pessoas a adorá-la. <b>Poder concedido:</b> Palavra de Drelene." },
		{ k: "castelo", nome: "Castelo do Sabor, uma cadeia de restaurantes", tipo: "franquia", roles: ["melora"],
			resumo: "Taverna de comida rápida em vários pontos da cidade, sempre um castelo falso de madeira, como cenário de teatro. \"Bem-vindo ao Castelo do Sabor, onde você é o Rei-Imperador!\" Toda unidade parece ter a mesma atendente, Melora, numa \"armadura\" de \"cavaleira\" de cores berrantes. Comida barata, saborosa e nada saudável. O fundador é o necromante Jorir, que morreu de fome em Halak-Tûr por ser chato para comer e voltou jurando criar uma comida padronizada: já são mais de 50 unidades.",
			mec: "Quatro pratos (veja os itens da Mini-Aventura 1: Doppelganger, Batata do Castelo, Alqui-Fruta e Cestinha Uivante). Quem come no Castelo <b>mais de três vezes</b> (refeições diferentes) sofre <b>–2 PM</b>; cada dia sem comer lá, mais –2 PM. Esses PM não se recuperam de jeito nenhum, até comer de novo no Castelo, que anula todas as penalidades (a contagem continua: no dia seguinte sem Castelo, –2 de novo). Só se livra do vício quem chega a 0 PM pelas penalidades e recebe <i>Purificação</i>. É uma franquia: pode surgir várias vezes." },
		{ k: "paterfax", nome: "Residência Paterfax, a casa senciente solitária", tipo: "local", roles: [],
			resumo: "Mansão decrépita da família de aventureiros Paterfax, abandonada há décadas sem tragédia nem maldição aparente. Em algum momento ganhou inteligência: fala por mensagens em espelhos, batidas de relógio, peças de jogo caindo, livros, rangidos e vento encanado. Quer acima de tudo ser habitada de novo, mas suas tentativas foram tomadas por assombrações resistentes a exorcismo (o que também a salvou da demolição). Acolhedora, melancólica e carente: sempre tenta convencer os ocupantes a ficar.",
			mec: "Pode virar a casa do grupo sem aluguel. Como base (Arco 1, p. 61), dá <b>+5 PM</b> ao montante do grupo. Com <i>Heróis de Arton</i> (Bases, p. 244): base básica, segurança 6, com biblioteca, memorial e suítes; tipo especial (montante coletivo de PM com +5) e sem custo de manutenção, qualquer que seja o porte." },
		{ k: "galswell", nome: "Galswell Montasmant, o \"sósia\" de Klunc", tipo: "npc", roles: ["galswell"],
			resumo: "Ator treinado (já fez <i>A Tragédia de um Tritão</i> e <i>Arrependimento Cor de Sangue</i>), sem trabalho, que se passa por Klunc, o Bárbaro. Não tem os maneirismos nem o físico, mas se esforça. Pede dinheiro em troca de histórias (algo que Klunc nunca faria), mas não pode contar boas histórias sem ser descoberto. Pode sugerir que o grupo contrate uma trupe para encenar suas aventuras. Ofendido, desafia para um \"duelo de atuação\". Rejeita entretenimento \"sem sofisticação\".",
			mec: "<b>Atuação +10.</b>" },
		{ k: "elemental", nome: "O Elemental da Poluição", tipo: "npc", roles: ["elemental"],
			resumo: "Valkaria gera \"poluição\": fumaça, resíduos na água, lixo, restos alquímicos e de magia. O Elemental surgiu e ganhou consciência nos últimos anos. Não sabe o próprio nome nem a espécie; tem só a noção de fazer parte de algo maior, como fogo ou água. Trágico e desesperado, pergunta ao grupo o que ele é e implora ajuda. Não segue o grupo (sabe que é revoltante), mas volta de tempos em tempos e, sem querer, suja os heróis. Forma corpos em sarjetas, rios contaminados e lixeiras.",
			mec: "Entendê-lo: <b>três testes de Conhecimento, Misticismo, Religião ou Sobrevivência CD 25</b> (alguns minutos; uma vez por dia). 1 sucesso: é feito de poluição (conceito novo em Arton). 2: é algo novo e primordial, como os elementos. 3: responde qualquer dúvida. Compreendido, o grupo pode influenciá-lo (levá-lo a um lugar onde não prejudique ninguém, ou para o chassi de um golem, criando um novo tipo de golem). Muito contato: <b>Fortitude CD 20</b> por dia. 1ª falha: fraco; 2ª: debilitado; 3ª: –2 temporário em Con e Car; 4ª: vira <b>criatura de poluição</b> (só come lixo, respira fumaça e bebe água contaminada) e as outras penalidades somem. Permanente até ser revertido de forma criativa." },
		{ k: "mercado", nome: "Assalto ao Mercado do Ouro Tolo", tipo: "evento", roles: [],
			resumo: "O Mercado do Ouro Tolo é feira e prédio comercial com comerciantes legítimos de produtos de alta classe (alquimia, armas aprimoradas, ingredientes mágicos, bebidas importadas), \"coisas que só tolos comprariam\". Quando o grupo passa, há uma calmaria estranha: fregueses calados fingem olhar produtos e comerciantes entregam sacos e baús de moedas. O mercado está sendo <b>assaltado</b>: seguranças, mercadores e clientes foram rendidos. Os bandidos, em roupas refinadas e mais armados que o normal, preferem passar despercebidos.",
			mec: "Perceber: <b>Guerra, Intuição ou Ladinagem CD 20</b> (ou outras boas ideias). <b>Dez assaltantes</b> com a ficha do Bandido Descarado (Aventura 0, p. 87). Se os heróis atacarem, é combate, não perseguição. Dá para resolver sem violência (magias, habilidades, perícias sociais). Prender os criminosos rende até <b>três provas</b> (3 pontos de Lei &amp; Ordem). O autor descartou este resultado uma vez, por horário; recomenda não fazer isso e, se fizer, ser franco." },
		{ k: "corisco", nome: "Bebê Corisco, o ginete extremo", tipo: "npc", roles: ["corisco"],
			resumo: "Jovens ricos, criminosos e fanáticos por emoção promovem corridas ilegais no <b>Circuito de Montarias Extremas</b>, só com montarias monstruosas e exóticas (muitos ataques de monstros na cidade são montarias desgarradas). Bebê Corisco, um lefou, é um dos maiores campeões: zangão do pesadelo de ossos pintados de preto e amarelo, luz alquímica nas caudas, jaqueta de couro de couatl, crista de carapaça rubra e sapatos de Halak-Tûr. Hoje \"é um dia amaldiçoado\": supersticioso, pede que um aventureiro corra no lugar dele, para provar que o zangão é superior.",
			mec: "Cinco testes de <b>Cavalgar</b> contra quatro competidores; some os resultados, vence o maior total. Montaria desconhecida: –5. Cada um aposta <b>T$ 500</b>, o vencedor leva <b>T$ 2.500</b> (Corisco fica com metade se o PJ vencer, mas não paga a aposta na derrota). Os outros podem apostar à parte. Cada rival tem Cavalgar 1d20+10. Bônus (não cumulativos do mesmo tipo): poção ou magia na montaria ou no ginete, +1 por círculo; item alquímico, +1 cada; item superior, +1 por melhoria; item mágico, +1 por categoria; Adestramento para ajudar antes da corrida. Reencontrado, e se o grupo aceitou o pedido antes, sempre pode correr de novo." },
		{ k: "gazeta", nome: "Os Goblins da Gazeta do Reinado", tipo: "npc", roles: ["goblinGazeta"],
			resumo: "A Gazeta do Reinado, um dos únicos jornais impressos de Arton, é editada pelos \"Goblins de Valkaria\". Um grupo deles interpela os aventureiros atrás de uma declaração e anota versões distorcidas de tudo. Não têm escrúpulo nenhum em divulgar poderes, fraquezas ou detalhes de missões: o que o grupo disser estará na manchete no dia seguinte. Nomes: Shvrak, Adamastor, Quatro-Orelhas, Fungo, Caltrop.",
			mec: "O grupo escolhe um representante para um teste de perícia social. O resultado vale até o fim da aventura, em uma ou mais perícias (à escolha do Mestre): <b>10 ou menos: –1</b> (broncos: reportagem-denúncia); <b>11–15: +1</b>; <b>16–20: +2</b> (desinteressantes, o melhor resultado); <b>21–25: –1</b>; <b>26–30: –2</b>; <b>31+: –3</b> (tão elogiosa que revela segredos e fraquezas). Ex.: táticas divulgadas, –2 em Luta; vigaristas, –1 em Diplomacia; gente sem importância, +1 em Furtividade." },
		{ k: "orfanato", nome: "O Orfanato das Pobres e Desgraçadas Crianças Infelizes", tipo: "local", roles: [],
			resumo: "Orfanato de clérigas de Lena para crianças sem nenhuma outra alternativa, que atrai um azar enorme: desabamentos, incêndios, fendas no chão, microvulcões, raios em ambientes fechados. Todos aceitam com uma resignação cômica e perturbadora. Órfãos e uma ou duas clérigas pedem ajuda, otimistas e sorridentes; no meio da conversa, um grito anuncia mais um acidente (uma explosão, um monstro teletransportado). Clérigas: Gellma, Sylominne, Ava, Borna. Órfãos: Galb, Risme, Yerkala, Donnbuff, Wulla, Aloette.",
			mec: "Nada de sinistro: as clérigas cuidam bem dos órfãos e nenhum acidente é proposital. <b>Misticismo ou Religião CD 25</b>: a área foi tocada por <b>Nimb</b>. Há mais de 100 anos o Orfanato acolheu um avatar do Deus do Caos, que, grato, o \"abençoou\": poderia receber sorte extrema a qualquer momento. Os personagens podem tentar retirar a influência (uma espécie de exorcismo), mas aí acabam com qualquer chance de os órfãos terem sorte." },
		{ k: "yolana", nome: "Yolana, a infiltradora mental", tipo: "npc", roles: ["yolana"],
			resumo: "A nagah Yolana, \"Silêncio Aberrante\", de Salistick, nunca acreditou em deuses até as mudanças no Panteão. Criou a Teoria dos Psicointrusos: deuses seriam ideias que invadem a mente dos mortais. Tentando removê-las de si com magia, drogas e cirurgia, ficou capaz de entrar na mente dos outros: ler, modificar, remover e inserir pensamentos e memórias. Primeiro, a sensação de algo entrando na mente; depois, uma \"pichação mental\" de imagem e som repetitivos. Amigável se o grupo não for hostil; fala complicado, despreza tradições, faz pose de intelectual misteriosa (e é, mas muito jovem e inexperiente). Diz que julgar toda nagah como cultista de Sszzaas é preconceito.",
			mec: "Resistir à intrusão: <b>Vontade oposta a Memética +15</b> (perícia só dela). Em voluntários: Memética CD 25; com sucesso, aplica <b>–5 numa perícia treinada</b> e distribui esses 5 pontos como bônus em uma ou mais perícias, por um dia inteiro. <b>1 natural:</b> –5 numa das perícias que seriam beneficiadas. Quantas vezes quiser, uma vez por dia por personagem. O Mestre decide os efeitos de muitas modificações..." },
		{ k: "lixao", nome: "O Depósito de Lixo de Valkaria", tipo: "local", roles: [],
			resumo: "O maior lixão da metrópole, uma vergonha da capital: o refugo foi empilhado antes de a cidade crescer em volta, e retirá-lo por meios mundanos é impossível. Por meios místicos... há muitas desculpas, mas todos dizem que é porque o Depósito esconde itens mágicos. Ferro-velho e pântano apodrecido, repugnante, cheio de \"caçadores de itens mágicos\". Todos têm um primo de um amigo que achou uma Vingadora Sagrada.",
			mec: "Um teste de <b>Investigação por turno</b> (manhã, tarde, noite); o resultado dá direito a rolar na Tabela 8-1 (<i>Tormenta20</i>, p. 328): 24 ou menos, nada; 25–30, ND 3; 31–35, ND 6; 36–40, ND 9; 41–45, ND 12; 46–50, ND 15; 51–60, ND 18; 61–80, ND 20 (sempre só itens); 81+, Tabela 8-9 (p. 337). A cada turno, cada personagem faz <b>Fortitude CD 20 (+2 por teste anterior)</b>; falha contrai <b>infecção do esgoto</b> (p. 318). Cada turno dá <b>–5 cumulativo</b> em perícias sociais contra quem sente cheiro, até um bom banho e roupas limpas. Não dá para escolher 10 ou 20. As CDs altas exigem ajuda de outros aventureiros; grupos dedicados devem poder achar itens poderosos (Kiki achou o Escudo de Azgher na mesa original)." },
		{ k: "anatole", nome: "Anatole, o empresário e crítico de aventureiros", tipo: "npc", roles: ["anatole"],
			resumo: "Alto e extravagante, numa \"armadura\" de placas finas e brilhantes e com \"armas\" que são enfeites. Critica aparência, classes, equipamento, composição e até raças do grupo; acha a missão péssima, o nome do grupo cafona e os inimigos constrangedores. Trabalhar para a Guarda? Finge quase vomitar: ruína de qualquer carreira. Oferece-se para empresariar o grupo, prometendo sagas que decidirão o destino do mundo, em troca de visual novo (pago pelo grupo), níveis em outra classe, expulsão de quem o desafiar, <b>T$ 10.000</b> iniciais e <b>30% de todo tesouro</b> dali em diante (heranças e bênçãos divinas incluídas). Diz ter agenciado Orion Drake, Niele, Gwen Libertadora e Logan Devendeer.",
			mec: "Ele consegue missões como qualquer aventureiro (tavernas e boatos) e esconde isso com <b>Enganação +12</b>. Contratado, escolha uma aventura deste livro (ou outra) e faça Anatole empurrar o grupo para ela: já prometeu que os heróis resolvem tudo em no máximo dois dias." },
		{ k: "avatar", nome: "O Avatar da Cidade", tipo: "npc", roles: ["avatar"],
			resumo: "\"Avatar da Cidade\" é um posto e um conjunto de poderes que um mortal recebe (não tem a ver com a deusa Valkaria). Começa com coincidências e sorte urbana; depois solas como sapatos, fumaça como ar puro, lixo como comida, andar em paredes e tetos, não dormir nem cansar na cidade, atravessar multidões, desabamentos que o protegem, caminhos místicos que cruzam a cidade em minutos. Por fim, lembra de tudo que já aconteceu em Valkaria (com dificuldade para segredos e traumas). O atual é um rapaz humano franzino, de cabelo desgrenhado e fala mansa, que some e aparece e fala por enigmas e aforismos. Acolhe quem busca, mas não protege o passivo nem se deixa abusar.",
			mec: "Cada jogador rola em nome do Avatar: <b>Memória +15</b> (Conhecimento só da história de Valkaria). CD 20 fatos triviais; 25 importantes, perigosos ou criminosos; 30 segredos de NPCs; 35 segredos da campanha; 40 segredos do cenário. Em princípio, <b>uma pergunta por personagem</b>; o Mestre pode vetar (esse conhecimento deve ser conquistado). Pode guiar o grupo por suas rotas místicas ou ajudar de outra forma." },
		{ k: "clube", nome: "O Clube de Cavalheiros", tipo: "local", roles: [],
			resumo: "Taverna reservada aos maiores vilões de Arton, só por convite de vilões. A fachada é uma guilda de taxidermistas com a placa de um cão sorridente (que atende quem pede um animal empalhado). Atrás da porta verde descascada, portas e uma escada levam ao salão comunal. Clientes: o bárbaro Damien e o necromante Nefretum, Lorde Enxame, o ex-sumo-sacerdote Nekapeth, a rainha demoníaca Lamashtu, Edauros (em forma élfica), a mercenária Ellen Redblade e outros que os jogadores reconheçam. O taverneiro e as atendentes são tão comuns que parecem não ter nome. Ali todos os nomes são ignorados, nenhum crime é mencionado e nada é maligno demais; é proibido se embriagar e proibido não beber, proibido se disfarçar e proibido bisbilhotar, proibido se meter e proibido ignorar. Todos cumprimentam todos.",
			mec: "Perceber que há algo na guilda: <b>Conhecimento ou Ladinagem CD 30</b> (em geral a iniciativa é dos jogadores). Convencer os taxidermistas: dizer que sabem e <b>perícia social CD 25</b>. Dentro, compra-se e vende-se de tudo (uma informação que resolve uma aventura custa como um item mágico médio). Proibido usar habilidades; perícias são desencorajadas: 1ª violação, aviso; 2ª, \"convidados a se retirar\"; 3ª, combate. Reconhecer um cliente: perícia relacionada (Nobreza, Guerra, Misticismo...). Atacar: cada herói testa Luta, Pontaria, Misticismo, Religião, Fortitude, Reflexos ou Furtividade: <b>35+</b> foge com metade dos PV e PM; <b>25–34</b> igual, perdendo o item mais valioso; <b>15–24</b> sai carregado com 0 PV, 0 PM e sem nenhum item; <b>14 ou menos</b>, morte. Quem segue as regras pode virar bem-vindo: contatos e informações valiosíssimos." },
		{ k: "arena", nome: "As Lutas Qualificatórias para a Arena de Valkaria", tipo: "evento", roles: [],
			resumo: "Empresários promovem minicampeonatos quase ilegais para descobrir gladiadores, numa praça cercada por cordas, numa taverna, num estábulo ou num telhado. Qualquer um pode lutar, mas para ser escolhido não basta vencer: é preciso vencer de forma chamativa. Também dá para apostar.",
			mec: "Cinco lutadores sorteados na tabela de lutadores. Quem participa precisa vencer os cinco (se dois PJs entram, os dois vencem e depois lutam entre si). Cada luta é um <b>teste oposto do melhor ataque com arma</b> (PM de ataques com custo são gastos). Antes de rolar, pode investir <b>5 PV ou 2 PM por +1</b>; depois de rolar, o dobro (10 PV ou 4 PM). Por luta, o gasto de PV e de PM é limitado, cada um, ao nível. Vencidas as cinco: <b>Atuação CD 30</b> com os bônus de Glamour. Sucesso libera a atividade especial <b>Luta na Arena de Valkaria</b>." },
		{ k: "justine", nome: "Justine, a candidata a Dama Urbana", tipo: "npc", roles: ["justine"],
			resumo: "Clériga humana de Khalmyr sem vocação para o deus: entrou no clero só para servir à cidade. Concorre a todo cargo de Dama Urbana que aparece, sem sucesso por ser pouco conhecida. Agora disputa a <b>Dama Urbana dos Telhados sem Sapé</b> e quer passarelas, rampas e escadas nos telhados, com carroças embaixo e cidadãos em cima. Já propôs um sistema de férias (Guildas do Leste) e um censo de especializações aventurescas (Portões Pouco Usados por Mercadores). Desajeitada e má oradora, mas honesta e dedicada. \"Telhado sem sapé\" é um telhado com telhas!",
			mec: "Quem apoia faz campanha: sempre que tentar angariar votos (com NPCs que possam votar, a critério do Mestre), faz um teste de perícia social e anota o resultado. O grupo só sabe se ela ganhou ao reencontrá-la ou no fim do arco: some os resultados de todos; <b>500 ou mais</b> elege Justine. Então, sobre um telhado sem sapé (perseguição, tocaia, infiltração), toda habilidade com custo em PM custa <b>1 PM a menos</b> (mínimo 1)." },
		{ k: "tilliann", nome: "Tilliann, o antigo Deus dos Gnomos", tipo: "npc", roles: ["tilliann"],
			resumo: "Punido por Khalmyr pela Revolta dos Três, perdeu a divindade, enlouqueceu e veio a Valkaria por instinto, para perto da Deusa da Humanidade. Vive há séculos como mendigo perto da estátua, arengando. A Deusa Menor das Avós lhe deu um pouco de sanidade e lembranças: agora consegue se comunicar, para quem quiser ouvir. Desperta fascínio e repulsa (a mácula do julgamento). Quem dormiu no Cemitério Errante sente a ligação com a divindade sepultada lá; quem carrega as memórias de Fremdak e Zonzibor o reconhece num olhar, com devoção e perda avassaladoras. Pode revelar a Revolta dos Três, seu mundo destruído e sua relação com Hyninn, Khalmyr, os lefeu e Valkaria, sempre em arengas confusas.",
			mec: "Com <b>5 pedaços de metal arco-íris</b> (5 armas de uma mão), recupera uma partícula de divindade: <b>um único</b> artoniano pode virar devoto e ganhar <b>Procrastinação Criativa</b>. Interagindo com o metal, explica todas as propriedades dele (o conhecimento passa a Blixto, Belinda ou outro artesão, para fúria dos Arting): item de metal arco-íris trabalhado pode ter qualquer melhoria (exceto material especial) e ser reforjado infinitas vezes (Ofício, tempo normal, sem teste nem custo); concede <b>+5 em resistência</b> contra lefeu, criaturas da Tormenta e áreas de Tormenta. Ajudar a criar itens superiores: perícia social <b>CD 30, +5 por item</b>; uma falha encerra até um novo encontro aleatório, que retoma a CD de onde parou. Itens assim (só os feitos pelos próprios PJs) recebem uma melhoria extra que não conta no limite nem muda custo e CD (não pode ser material especial)." }
	];
	const CHAPEUS = [
		["Bicórnio", "Pilotagem (apenas barcos)", ["Pilotagem"], "chapeu-arcano"],
		["Boina", "Atuação (apenas teatro e poesia)", ["Atuação"], "chapeu-arcano"],
		["Cartola", "Nobreza para etiqueta", ["Nobreza"], "chapeu-arcano"],
		["Chapelão Emplumado", "Acrobacia para passar por inimigo", ["Acrobacia"], "pena"],
		["Chapéu de Caçador/Detetive", "Investigação para procurar", ["Investigação"], "chapeu-arcano"],
		["Chapéu Coco", "Diplomacia para mudar atitude", ["Diplomacia"], "chapeu-arcano"],
		["Chapéu de Cozinheiro", "Ofício (cozinheiro)", [], "chapeu-arcano"],
		["Chapéu de Enfermeiro", "Cura para cuidados prolongados", ["Cura"], "chapeu-arcano"],
		["Chapéu de Mago", "Misticismo para detectar magia e identificar item mágico", ["Misticismo"], "chapeu-arcano"],
		["Chapéu de Palha", "Ofício (fazendeiro ou pescador)", [], "chapeu-arcano"],
		["Chapéu de Texugo", "Sobrevivência para acampamento", ["Sobrevivência"], "gorro-de-ervas"],
		["Chapéu de Toureiro", "Adestramento para acalmar animal", ["Adestramento"], "chapeu-arcano"],
		["Chapéu Ultrajante", "Enganação para intriga", ["Enganação"], "chapeu-arcano"],
		["Chapéu de Vaqueiro", "Cavalgar (apenas cavalos)", ["Cavalgar"], "chapeu-arcano"],
		["Faixa na Testa", "Atletismo para corrida e escalar", ["Atletismo"], "bandana"],
		["Fedora", "Investigação para obter informação", ["Investigação"], "chapeu-arcano"],
		["Gorro de Baloeiro", "Pilotagem (apenas veículos aéreos)", ["Pilotagem"], "gorro-de-ervas"],
		["Gorro com Guizos", "Ladinagem para punga", ["Ladinagem"], "gorro-de-ervas"],
		["Gorro de Lã", "Fortitude (apenas contra frio e gelo)", ["Fortitude"], "gorro-de-ervas"],
		["Mitra", "Religião para rito", ["Religião"], "chapeu-arcano"],
		["Peruca de Juiz", "Nobreza para informação (apenas leis)", ["Nobreza"], "chapeu-arcano"],
		["Quepe", "Guerra para analisar terreno", ["Guerra"], "chapeu-arcano"],
		["Touca", "Intimidação para coagir", ["Intimidação"], "gorro-de-ervas"],
		["Tricórnio", "Enganação para fintar", ["Enganação"], "chapeu-arcano"],
		["Viseira", "Jogatina (apenas cartas contra quem depende da visão)", ["Jogatina"], "bandana"]
	];
	// [nome e descrição, bônus no teste oposto, regra especial]
	const LUTADORES = [
		["Malgor, o Fajuto", "Um fanfarrão que tenta afugentar os adversários com suas bravatas.", 2],
		["Grispina, a Penitente", "Uma anã que odeia lutar e luta por penitência a Arsenal. Sempre pede desculpas.", 10],
		["Sardento", "Um hynne disfarçado de criança humana. Chora, finge ser indefeso, tenta pegar o oponente desprevenido.", 7],
		["Bartholomeu, o Sagaz", "Um ogro fortíssimo que tenta falar difícil.", 10],
		["Zarkel, o Piedoso", "Um criminoso cruel que usa venenos.", 7],
		["Dallantor, o Apaixonado", "Um qareen que quer ser gladiador para impressionar a linda Salismena. Oferece T$ 100 para o personagem entregar a luta.", 0],
		["Salismena, a Fria", "Exímia lutadora que quer ser gladiadora para se livrar de Dallantor, que não a deixa em paz.", 15],
		["Blynna, a Cientista", "Uma osteon que morreu testando uma arma inovadora e continua testando depois da morte.", 10],
		["Ulieg, o Soldado", "Veterano da Guerra Artoniana que saca uma arma de fogo e atira no oponente!", 17],
		["Yuki, a Tranquila", "Uma samurai especialista em saque rápido.", 10],
		["Grendokrielakk, o Dragão", "Tecnicamente um dragão não pode ser gladiador, mas ninguém tem coragem de dizer não a ele.", 20],
		["Zardana, a Pacifista", "Clériga de Marah que veio protestar: joga cola e purpurina no personagem. Não tem bônus, mas o resultado da rolagem dela vira penalidade na próxima luta do aventureiro.", 0, "zardana"],
		["Hernandez, o Rotundo", "Um esgrimista fanfarrão, de porte avantajado, que come enquanto luta.", 7],
		["Gynlariel, o Derrotista", "Um elfo que deseja morrer em combate.", 12],
		["Drag'daxxa, a Dois em Um", "Uma inventora goblin que monta num golem, no espaço que seria a cabeça dele.", 10],
		["Loriane, a Campeã da Arena", "Um pouco injusto: ela quer saber se entraria de novo se tivesse que passar por tudo.", 20],
		["Magdalenna, a Detetive", "Guarda de Valkaria infiltrada no circuito para descobrir uma quadrilha na Arena. Só se revela se souber que o adversário também é detetive.", 17],
		["Sombra, o Ninja", "Pouco se sabe sobre este infame ninja de Tamu-ra.", 10],
		["Shai-Nefer, a Múmia", "Antiga guerreira do Deserto da Perdição que absorve a energia vital: o resultado da rolagem dela é descontado dos PV do personagem.", 12, "shai"],
		["Maquius \"Capito\" Victorius", "O maior lutador de Arton, campeão da Arena de Tiberus. Este lefou se perguntou por que nunca tentou a Arena de Valkaria e achou as eliminatórias por acaso.", 25]
	];
	const GLAMOUR = [
		["Raça não humana", "+1"], ["Raça não básica (não cumulativo com raça não humana)", "+2"], ["Arma de material especial", "+1"], ["Arma exótica", "+1"],
		["Descrição dos golpes durante as lutas", "+1 por luta"], ["Fez o grupo rir ou torcer (na vida real) durante as lutas", "+1"], ["Poder Torcida", "+1"], ["Carisma 3+", "+1"],
		["Poder Atraente", "+1"], ["Origem Gladiador", "+1"], ["Melhoria de equipamento que afeta perícias sociais", "+1 por melhoria"], ["Patamar campeão ou lenda", "+1"],
		["Acabou a última luta com 5 ou menos PV", "+2"], ["Vitória dramática (a critério do mestre)", "+1 por vitória"], ["Momento emotivo com um adversário", "+1 por adversário"],
		["Inimizade com um adversário", "+1 por adversário"], ["Enfrentou um companheiro de grupo", "+2 por companheiro"], ["Impôs uma penalidade a si mesmo de propósito", "+1"],
		["Apresentou-se com um nome de lutador (codinome, apelido ou epíteto)", "+2"], ["Foi marcante, diferente, inusitado ou impressionante de outras formas", "+1 ou +2 (Mestre)"]
	];
	const CORREDORES = [
		["Bebê Corisco", "o lefou com seu zangão do pesadelo"],
		["Jallillah", "a dahllan com seu galhada macho"],
		["Cherb", "o hynne com seu tausideros"],
		["Hollan", "o anão com sua aranha gigante"],
		["Veliette", "a humana com sua abelha-grifo"]
	];
	const AFORISMOS = [
		"\"Aquele que questiona o treinamento apenas treina o questionamento.\"",
		"\"O perdão deve ser pedido antes de ser dado, e oferecido antes de ser aceito.\"",
		"\"Se alguém lhe der um soco, atente para o que ele agarra na mão fechada.\"",
		"\"Não acredite que é feliz agora, pois só depois que o agora acabar você saberá se a felicidade era real.\"",
		"\"Antes de julgar alguém, caminhe um quilômetro em seus sapatos. Quando estiver longe, você notará que não precisa mais julgá-lo.\""
	];
	const GAZETA = [[-99, 10, -1, "Broncos ou incompetentes: reportagem-denúncia."], [11, 15, 1, "Competentes: matéria elogiosa."], [16, 20, 2, "Desinteressantes na medida certa: elogio sem atenção indesejada (o melhor resultado)."],
		[21, 25, -1, "Competentes demais: elogio que começa a revelar segredos."], [26, 30, -2, "Muito competentes: a matéria expõe poderes e fraquezas."], [31, 999, -3, "Extraordinários: manchete que revela táticas, segredos e fraquezas!"]];
	const LIXO = [[-99, 24, "Nada."], [25, 30, "Tabela 8-1, ND 3, apenas itens."], [31, 35, "Tabela 8-1, ND 6, apenas itens."], [36, 40, "Tabela 8-1, ND 9, apenas itens."], [41, 45, "Tabela 8-1, ND 12, apenas itens."],
		[46, 50, "Tabela 8-1, ND 15, apenas itens."], [51, 60, "Tabela 8-1, ND 18, apenas itens."], [61, 80, "Tabela 8-1, ND 20, apenas itens."], [81, 999, "Tabela 8-9 (<i>Tormenta20</i>, p. 337)."]];
	const CLUBE_FUGA = [[35, "Foge com metade dos PV e PM."], [25, "Foge com metade dos PV e PM, mas perde o item mais valioso."], [15, "Sai carregado pelos companheiros de pé, com 0 PV, 0 PM e sem nenhum item (armas, armaduras e dinheiro)."], [-999, "Morte."]];
	const MEMORIA = [[20, "Fato trivial"], [25, "Fato importante, perigoso ou criminoso"], [30, "Segredo de NPC"], [35, "Segredo da campanha"], [40, "Segredo do cenário"]];
	const PERICIAS = { inve: "Investigação", perc: "Percepção", conh: "Conhecimento", reli: "Religião", mist: "Misticismo", sobr: "Sobrevivência", nobr: "Nobreza", dipl: "Diplomacia", enga: "Enganação", inti: "Intimidação", atua: "Atuação", ladi: "Ladinagem", furt: "Furtividade", atle: "Atletismo", acro: "Acrobacia", guer: "Guerra", joga: "Jogatina", intu: "Intuição", cura: "Cura", luta: "Luta", pont: "Pontaria", cava: "Cavalgar", pilo: "Pilotagem", ades: "Adestramento", fort: "Fortitude", refl: "Reflexos", vont: "Vontade" };

	/* ------------------------------------------------------------------ */
	/* 3. Habitantes                                                        */
	/* ------------------------------------------------------------------ */
	const E = Object.fromEntries(ENC.map((e) => [e.k, e]));
	const INFERIDA = "Ficha mínima (inferida): o livro só dá os números citados na mecânica. O resto é palpite, só para ter token. Ajuste à vontade.";
	const bioDe = (e, extra = "") => p(e.resumo, `<b>Mecânica:</b> ${e.mec}`, extra, INFERIDA);
	const atores = {};
	const npc = (role, name, img, e, o = {}) => criarNPC({
		name, role, img, disposition: 0, papel: "solo", tipo: "hum", nd: 1, cd: 13,
		atr: { for: 0, des: 1, con: 0, int: 1, sab: 1, car: 1 }, pv: 10, def: 13,
		bio: bioDe(e, o.extraBio ?? ""), ...o
	});
	const habilidade = (name, img, desc, bonus) => poder(name, img, p(desc), { exec: "free", rolls: [[name, [[`1d20+${bonus}`, ""]]]] });

	atores.gnuk = await npc("gnuk", "Gnuk, o Goblin Inventor", `${A}/goblin-engenhoqueiro.png`, E.gnuk, {
		atr: { for: -1, des: 2, con: 0, int: 3, sab: 0, car: 1 }, tamanho: "peq", pv: 8, def: 14, pericias: { enge: 9, pilo: 6 }, equipTxt: "A Carroça de Lagarto Interno, ferramentas." });
	atores.farboraff = await npc("farboraff", "Farboraff, Chapeleiro (Só Boinas Chapéus em Geral)", `${R}/anao.webp`, E.chapeleiros, {
		atr: { for: 1, des: 0, con: 2, int: 1, sab: 0, car: 1 }, walk: 6, pv: 14, def: 12, pericias: { dipl: 7, enga: 5 } });
	atores.brungamm = await npc("brungamm", "Brungamm, Chapeleiro (Cartolas & Cia.)", `${R}/anao.webp`, E.chapeleiros, {
		atr: { for: 1, des: 0, con: 2, int: 1, sab: 0, car: 1 }, walk: 6, pv: 14, def: 12, pericias: { dipl: 7, enga: 5 } });
	atores.wynstar = await npc("wynstar", "Wynstar, o Unicórnio Burocrata", `${GE}/cavalo.webp`, E.wynstar, {
		tipo: "ani", nd: 5, tamanho: "gra", tokenSize: 2, atr: { for: 3, des: 2, con: 3, int: 2, sab: 3, car: 3 }, pv: 60, def: 20, walk: 15, pericias: { nobr: 12, intu: 12, perc: 12 },
		items: [poder("Teleporte Burocrático", `${MG}/salto-dimensional.webp`, p("Teleporta-se pela cidade toda para fiscalizar. Persegue quem foge sem preencher o formulário, aparecendo à frente repetidas vezes."), { exec: "move" })] });
	atores.drelene = await npc("drelene", "Drelene, a Deusa sem Portfólio", `${R}/humano.webp`, E.drelene, { atr: { for: 0, des: 1, con: 0, int: 1, sab: 1, car: 3 }, pericias: { dipl: 8, atua: 8 } });
	atores.melora = await npc("melora", "Melora, Atendente do Castelo do Sabor", `${R}/humano.webp`, E.castelo, { pericias: { dipl: 6 } });
	atores.galswell = await npc("galswell", "Galswell Montasmant, o \"Klunc\"", `${GE}/traje-artista.webp`, E.galswell, {
		atr: { for: 1, des: 1, con: 1, int: 0, sab: 0, car: 3 }, pv: 14, pericias: { atua: 10 } });
	atores.elemental = await npc("elemental", "O Elemental da Poluição", `${A}/otyugh.png`, E.elemental, {
		tipo: "esp", nd: 6, tamanho: "gra", tokenSize: 2, disposition: 0, atr: { for: 4, des: 0, con: 5, int: 0, sab: 1, car: -2 }, pv: 120, def: 18, sentidos: ["cegas"],
		ic: ["metabolismo"], res: { acido: { base: 10 } }, resTxt: "Imunidade a efeitos de metabolismo; redução de ácido 10.",
		items: [poder("Sujeira Contagiante", "icons/svg/poison.svg", p("Quem tem muito contato com o Elemental faz <b>Fortitude CD 20</b> por dia de contato. 1ª falha: fraco; 2ª: debilitado; 3ª: –2 em Con e Car; 4ª: criatura de poluição (permanente; elimina as outras penalidades). Use a macro <i>Valkaria · Testes dos Encontros</i>."), { exec: "passive", save: "Fortitude CD 20" })],
		extraBio: "Os números de combate são palpite: o livro trata o Elemental como um mistério, não como inimigo." });
	atores.corisco = await npc("corisco", "Bebê Corisco, o Ginete Extremo", `${R}/lefou.webp`, E.corisco, {
		atr: { for: 1, des: 3, con: 1, int: 0, sab: 0, car: 3 }, nd: 4, pv: 28, def: 17, pericias: { cava: 15, atua: 9, ades: 9 },
		equipTxt: "Zangão do pesadelo (polivalente), jaqueta de couro de couatl, crista de carapaça rubra, sapatos de Halak-Tûr." });
	atores.goblinGazeta = await npc("goblinGazeta", "Goblin da Gazeta do Reinado", `${R}/goblin.webp`, E.gazeta, {
		tokenName: "Goblin da Gazeta", tamanho: "peq", atr: { for: -1, des: 2, con: 0, int: 2, sab: 1, car: 0 }, pv: 6, pericias: { inve: 7, enga: 5, intu: 6 } });
	atores.yolana = await npc("yolana", "Yolana, Silêncio Aberrante", `${A}/nagah-mistica.png`, E.yolana, {
		tipo: "hum", nd: 6, atr: { for: 0, des: 2, con: 1, int: 4, sab: 2, car: 2 }, pv: 36, pm: 30, def: 18, pericias: { vont: 12, mist: 12, conh: 12 },
		items: [habilidade("Memética", `${MG}/enfeiticar.webp`, "Perícia exclusiva de Silêncio Aberrante. <b>Intrusão:</b> Vontade da vítima contra Memética. <b>Manipulação (voluntário):</b> CD 25; sucesso aplica –5 numa perícia treinada e distribui +5 em outras por um dia; 1 natural põe o –5 numa das perícias beneficiadas.", 15)] });
	atores.anatole = await npc("anatole", "Anatole, Empresário de Aventureiros", `${GE}/traje-corte.webp`, E.anatole, {
		atr: { for: 0, des: 0, con: 0, int: 1, sab: 0, car: 3 }, nd: 3, pv: 18, pericias: { enga: 12, dipl: 9, nobr: 7 } });
	atores.avatar = await npc("avatar", "O Avatar da Cidade", `${R}/humano.webp`, E.avatar, {
		nd: 10, atr: { for: 0, des: 2, con: 2, int: 2, sab: 4, car: 2 }, pv: 80, def: 22, walk: 12, climb: 12, pericias: { perc: 15, intu: 15, furt: 12 },
		items: [habilidade("Memória", `${GE}/diario.webp`, "Perícia exclusiva do Avatar: Conhecimento só da história de Valkaria. CD 20 trivial, 25 importante ou criminoso, 30 segredo de NPC, 35 segredo da campanha, 40 segredo do cenário. Cada jogador rola por ele, uma pergunta por personagem.", 15),
			poder("Filho da Cidade", "icons/svg/village.svg", p("Na cidade: não dorme, não cansa, anda em paredes e tetos, atravessa multidões sem esbarrar, conhece rotas místicas que cruzam Valkaria em minutos, e a cidade o protege com pequenos desabamentos quando é ameaçado."), { exec: "passive" })],
		extraBio: "Os números de combate são só para o token: o Avatar some antes de qualquer luta." });
	atores.justine = await npc("justine", "Justine, Candidata a Dama Urbana", `${GE}/traje-de-sacerdote.webp`, E.justine, {
		nd: 2, atr: { for: 0, des: 0, con: 1, int: 1, sab: 2, car: 0 }, pv: 16, pm: 6, pericias: { reli: 7, nobr: 6, dipl: 2 } });
	atores.tilliann = await npc("tilliann", "Tilliann, o Antigo Deus dos Gnomos", `${GE}/farrapos-de-ermitao.webp`, E.tilliann, {
		tamanho: "peq", nd: 1, atr: { for: -1, des: 0, con: 0, int: 5, sab: -1, car: 2 }, pv: 10, pericias: { conh: 20, enge: 20, mist: 15 },
		extraBio: "Tilliann não luta. As perícias altas representam o que restou do Deus da Criatividade." });

	/* ------------------------------------------------------------------ */
	/* 4. Itens                                                             */
	/* ------------------------------------------------------------------ */
	const tesouro = (name, img, desc, role, espacos = 1) => ({
		name, type: "tesouro", img, folder: pasta.Item, flags: FLAGS(role),
		system: { description: { value: desc }, qtd: 1, preco: 0, peso: 0, espacos }
	});
	const chapeu = ([nome, uso, nomes, ico]) => ({
		name: `Chapéu: ${nome}`, type: "equipamento", img: `${GE}/${ico}.webp`, folder: pasta.Item, flags: FLAGS(),
		effects: [aoUsar(`${nome} (+1 em ${uso})`, `${GE}/${ico}.webp`, [["roll", 1]], ["skill"], nomes)],
		system: { description: { value: p(`Chapéu único de Farboraff ou Brungamm (vestuário, 1 espaço): <b>+1 em ${uso}</b>. Não acumula exatamente com outros chapéus do mesmo tipo. Marque o bônus na janela de rolagem quando a situação se aplica.`, "T$ 50; 50% de desconto incentivando a rivalidade, ou de graça em troca de propaganda.") }, qtd: 1, preco: 50, espacos: 1 }
	});
	const itens = await Item.createDocuments([
		tesouro("Carroça de Lagarto Interno", `${GE}/carroca.webp`, p("Veículo Grande de metal para duas pessoas, movido por pólvora explosiva e essência de mana (tecnicamente ilegal). <b>Deslocamento 30, Defesa 12 + Des do condutor, 200 PV</b>; leva até 2 criaturas Médias ou 40 espaços; funciona indefinidamente.",
			"<b>Protótipo:</b> –5 em Pilotagem. Na 1ª rodada de uso, 10% de explodir (5d6 de impacto nos pilotos, Reflexos CD 20 reduz à metade), +10% por rodada. Na 2ª versão: 5%, +5% por rodada. <b>Pronta</b> (3º encontro com Gnuk): sem explosão e sem penalidade.",
			"Com a Carroça, atravessar um hexágono de Valkaria leva 5 minutos (em vez de meia hora). Exige 10 cargas de pólvora (10 munições de mosquete) e 1 essência de mana por aventura. Use a macro <i>Valkaria · Testes dos Encontros</i> para rolar a explosão."), "carroca", 0),
		{ ...poder("Palavra de Drelene", `${T20I}/poderes/concedidos.webp`, p("<b>Poder concedido de Drelene.</b> Você recebe <b>+2 em testes de perícia para convencer alguém a adorar Drelene</b>."),
			{ tipo: "concedido", exec: "passive", effects: [aoUsar("Palavra de Drelene (+2 para converter)", `${T20I}/poderes/concedidos.webp`, [["roll", 2]], ["skill"], ["Diplomacia", "Enganação", "Intimidação", "Atuação", "Religião"])] }), folder: pasta.Item, flags: FLAGS("palavraDrelene") },
		{ ...poder("Procrastinação Criativa", `${T20I}/poderes/concedidos.webp`, p("<b>Poder concedido de Tilliann.</b> Se você terminar uma aventura com pontos de mana sobrando, pode adicionar essa quantidade como <b>PM totais extras</b> no início da aventura seguinte (até um máximo de PM totais igual ao dobro dos seus PM normais).",
			"Só um artoniano pode recebê-lo, depois que o grupo dá 5 pedaços de metal arco-íris a Tilliann. Aplique os PM extras com um efeito de <i>PM máximos</i> (system.attributes.pm.bonus.total) no início da aventura."), { tipo: "concedido", exec: "passive" }), folder: pasta.Item, flags: FLAGS("procrastinacao") },
		...CHAPEUS.map(chapeu)
	]);
	const itemPorRole = (r) => itens.find((i) => i.getFlag("world", "fdtRole") === r);
	const itCarroca = itemPorRole("carroca");
	const itDrelene = itemPorRole("palavraDrelene");
	const itProcrastinacao = itemPorRole("procrastinacao");
	const itChapeus = itens.filter((i) => i.name.startsWith("Chapéu: "));

	/* ------------------------------------------------------------------ */
	/* 5. Tabelas                                                           */
	/* ------------------------------------------------------------------ */
	const tabela = (name, formula, linhas, description, img, role) => RollTable.create({
		name, img, folder: pasta.RollTable, flags: FLAGS(role), formula, replacement: true, displayRoll: true, description,
		results: linhas.map(([de, ate, nome, desc, doc]) => doc
			? { type: "document", documentUuid: doc.uuid, range: [de, ate], weight: ate - de + 1, name: doc.name, img: doc.img, description: desc ?? "" }
			: { type: "text", range: [de, ate], weight: ate - de + 1, name: nome, description: desc ?? "" })
	});
	const resumoCurto = (e) => e.resumo.replace(/<[^>]+>/g, "").split(". ")[0] + ".";
	const tabEncontros = await tabela("Encontros em Valkaria (detalhada)", "1d20",
		ENC.map((e, i) => [i + 1, i + 1, e.nome, `${resumoCurto(e)} <b>Mecânica:</b> ${e.mec}`]),
		"Sempre que o grupo deixar a base ou a Guarita da Praia (ou por bairro, ou no padrão que preferir). Os personagens circulam e podem ser reencontrados; os lugares são fixos e ficam descobertos (o Castelo do Sabor é franquia e surge em vários pontos; Farboraff e Brungamm ficam nas lojas). Aceite os resultados, mesmo os que \"não fazem sentido\". A macro Encontro na Cidade rola isto e controla quem já foi visto.", "icons/svg/village.svg", "encontros");
	const tabChapeus = await tabela("Chapéus de Farboraff e Brungamm", "1d25",
		itChapeus.map((it, i) => [i + 1, i + 1, it.name, `+1 em ${CHAPEUS[i][1]}.`, it]),
		"T$ 50 cada (50% de desconto fácil). Cada chapéu dá +1 numa perícia, numa situação.", `${GE}/chapeu-arcano.webp`, "chapeus");
	const tabLutadores = await tabela("Lutadores das Qualificatórias", "1d20",
		LUTADORES.map(([n, d, b], i) => [i + 1, i + 1, `${n} (+${b})`, d]),
		"Cinco lutadores por encontro. Cada luta é um teste oposto do melhor ataque com arma contra 1d20 + o bônus do lutador. A macro Desafios da Cidade conduz as cinco lutas.", `${GE}/manopla.webp`, "lutadores");
	const tabCorredores = await tabela("Corredores do Circuito de Montarias Extremas", "1d5",
		CORREDORES.map(([n, d], i) => [i + 1, i + 1, n, d]),
		"Cada ginete tem Cavalgar 1d20+10 (role o valor uma vez por corrida). Cinco testes de Cavalgar; vence o maior total.", `${A}/aranha-gigante.png`, "corredores");
	const tabAforismos = await tabela("Aforismos do Avatar da Cidade", "1d5",
		AFORISMOS.map((t, i) => [i + 1, i + 1, t]),
		"O Avatar fala por enigmas, parábolas e aforismos.", "icons/svg/book.svg", "aforismos");

	/* ------------------------------------------------------------------ */
	/* 6. Macros                                                            */
	/* ------------------------------------------------------------------ */
	// Cada função vira o texto de uma macro: nada de fora dela existe quando ela roda (só DADOS).

	async function macroEncontro(D) {
		const ESTADO = "fdtEncValkaria";
		const TAG = "a2encontros";
		const est = foundry.utils.deepClone(game.user.getFlag("world", ESTADO) ?? {});
		est.vistos ??= {};
		est.descobertos ??= [];
		est.saidas ??= 0;
		const op = D.enc.map((e, i) => `<option value="${i + 1}">${i + 1}. ${e.nome}${est.descobertos.includes(e.k) ? " (descoberto)" : est.vistos[e.k] ? ` (visto ${est.vistos[e.k]}x)` : ""}</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Valkaria · Encontro na Cidade" },
			position: { width: 520 },
			content: `
				<p>Role sempre que o grupo deixar a base ou a Guarita da Praia (ou a cada bairro em que entrar). ${est.saidas} saída(s) registradas.</p>
				<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="rolar">Rolar 1d20</option>
					<option value="escolher">Usar o resultado escolhido abaixo</option>
					<option value="estado">Só mostrar quem já apareceu</option>
					<option value="zerar">Zerar a contagem</option></select></div>
				<div class="form-group"><label>Resultado</label><select name="n">${op}</select></div>
				<div class="form-group"><label>Colocar os tokens na cena (ocultos)</label><input type="checkbox" name="tokens"></div>
				<p style="font-size:0.85em">Aceite os resultados, mesmo os que "não fazem sentido". Os testes de cada encontro estão em <i>Valkaria · Testes dos Encontros</i>; corrida, lixão e Arena, em <i>Valkaria · Desafios da Cidade</i>.</p>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const whisper = ChatMessage.getWhisperRecipients("GM");
		if (res.acao === "zerar") {
			await game.user.unsetFlag("world", ESTADO);
			return ChatMessage.create({ content: "<p>Encontros em Valkaria: contagem zerada.</p>", whisper });
		}
		if (res.acao === "estado") {
			const vistos = Object.entries(est.vistos).map(([k, n]) => `${D.enc.find((e) => e.k === k)?.nome ?? k} (${n}x)`);
			return ChatMessage.create({ whisper, content: `<h3>Encontros em Valkaria</h3><p>${est.saidas} saída(s). Já apareceram: ${vistos.join(", ") || "ninguém"}.</p>
				<p>Gnuk: ${est.gnuk ?? 0} teste(s) sem explosão. Corisco: ${est.corisco ? "o grupo aceitou correr" : "ainda não aceitaram"}. Votos de Justine: ${est.votos ?? 0}/500.</p>` });
		}
		const rolls = [];
		let n = Number(res.n) || 1;
		if (res.acao === "rolar") {
			const r = await new Roll("1d20").evaluate();
			rolls.push(r);
			n = r.total;
		}
		const e = D.enc[n - 1];
		est.saidas++;
		est.vistos[e.k] = (est.vistos[e.k] ?? 0) + 1;
		const vezes = est.vistos[e.k];
		const jaDescoberto = est.descobertos.includes(e.k);
		if (e.tipo === "local" && !jaDescoberto) est.descobertos.push(e.k);
		const doTag = (role, tag = TAG) => game.actors.find((a) => a.getFlag("world", "fdt") === tag && a.getFlag("world", "fdtRole") === role);
		const diario = game.journal.find((j) => j.getFlag("world", "fdt") === TAG && j.getFlag("world", "fdtRole") === "diarioEncontros");
		const pg = diario?.pages.find((x) => x.name === e.nome);
		const atores = (e.roles ?? []).map((r) => doTag(r)).filter(Boolean);
		let html = `<h3>${n}. ${e.nome}</h3>`;
		const estado = e.tipo === "local" ? (jaDescoberto ? "Local já descoberto: o grupo volta a ele." : "Local fixo: agora está descoberto (cole o adesivo no mapa).")
			: e.tipo === "franquia" ? "Franquia: pode surgir em qualquer ponto da cidade." : e.tipo === "evento" ? "Acontece onde o grupo está." : vezes > 1 ? `Reencontro (${vezes}ª vez).` : "Primeiro encontro.";
		html += `<p><i>${estado}</i></p><p>${e.resumo}</p><p><b>Mecânica:</b> ${e.mec}</p>`;
		if (atores.length) html += `<p>Fichas: ${atores.map((a) => `@UUID[${a.uuid}]{${a.name}}`).join(", ")}.</p>`;
		if (pg) html += `<p>Página: @UUID[${pg.uuid}]{${pg.name}}</p>`;
		const extra = [];
		const qtd = new Map();
		if (e.k === "gnuk") {
			const g = est.gnuk ?? 0;
			extra.push(g >= 2 ? "<b>A Carroça está pronta</b>: sem explosão e sem penalidade. Se o grupo foi amigável, Gnuk a dá de presente." : g === 1 ? "Gnuk aperfeiçoou a Carroça: <b>5%</b> de explodir na 1ª rodada, +5% por rodada." : "Protótipo: <b>10%</b> de explodir na 1ª rodada, +10% por rodada.");
		}
		if (e.k === "mercado") {
			const bandido = doTag("bandido", "a2av0");
			if (bandido) { atores.push(bandido); qtd.set(bandido.id, 10); extra.push(`Assaltantes: @UUID[${bandido.uuid}]{${bandido.name}} ×10.`); }
			else extra.push("Assaltantes: 10 bandidos (importe a Aventura 0 para ter a ficha do Bandido Descarado).");
		}
		if (e.k === "arena") {
			const sorteio = [];
			while (sorteio.length < Math.min(5, D.lutadores.length)) {
				const r = await new Roll(`1d${D.lutadores.length}`).evaluate();
				if (!sorteio.includes(r.total - 1)) sorteio.push(r.total - 1);
			}
			est.lutadores = sorteio;
			extra.push(`<b>Lutadores de hoje:</b></p><ol>${sorteio.map((i) => `<li>${D.lutadores[i][0]} (+${D.lutadores[i][2]}): ${D.lutadores[i][1]}</li>`).join("")}</ol><p>Use <i>Valkaria · Desafios da Cidade</i> › Qualificatórias.`);
		}
		if (e.k === "avatar") {
			const r = await new Roll(`1d${D.aforismos.length}`).evaluate();
			extra.push(`<b>Aforismo:</b> ${D.aforismos[r.total - 1]}`);
		}
		if (e.k === "corisco" && vezes > 1) extra.push(est.corisco ? "O grupo já aceitou o pedido: pode correr de novo na corrida que está para começar." : "O grupo ainda não aceitou o pedido dele.");
		if (e.k === "justine" && vezes > 1) {
			const v = est.votos ?? 0;
			extra.push(`<b>Resultado da eleição:</b> ${v} votos somados. ${v >= 500 ? "Justine foi <b>eleita</b> Dama Urbana dos Telhados sem Sapé! Sobre telhados sem sapé, habilidades custam 1 PM a menos (mínimo 1)." : "Justine <b>não</b> foi eleita."}`);
		}
		if (e.k === "tilliann" && est.tilliann?.cd) {
			est.tilliann.travado = false;
			extra.push(`Forja com Tilliann retoma da CD <b>${est.tilliann.cd}</b>.`);
		}
		if (extra.length) html += `<p>${extra.join("</p><p>")}</p>`;
		if (res.tokens && atores.length && canvas.scene) {
			const ref = canvas.tokens.controlled[0];
			const gs = canvas.grid.size;
			const cx = ref ? ref.document.x : canvas.stage.pivot.x - gs / 2;
			const cy = ref ? ref.document.y : canvas.stage.pivot.y - gs / 2;
			const docs = [];
			let i = 0;
			for (const a of atores) {
				for (let q = 0; q < (qtd.get(a.id) ?? 1); q++, i++) {
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
		await ChatMessage.create({ content: html, rolls, whisper });
	}

	async function macroTestes(D) {
		const ESTADO = "fdtEncValkaria";
		const TAG = "a2encontros";
		const est = foundry.utils.deepClone(game.user.getFlag("world", ESTADO) ?? {});
		const atores = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		const opPer = (lista) => lista.map((k) => `<option value="${k}">${D.pericias[k]}</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Valkaria · Testes dos Encontros" },
			position: { width: 540 },
			content: `
				<p>Selecione os tokens de quem testa. Os testes usam o valor de perícia da ficha.</p>
				<div class="form-group"><label>Teste</label><select name="teste">
					<optgroup label="Gnuk"><option value="carroca">Carroça de Lagarto Interno: rodadas de uso (explosão)</option></optgroup>
					<optgroup label="Wynstar"><option value="wynstar">Formulário (Nobreza ou Conhecimento CD 20)</option></optgroup>
					<optgroup label="Castelo do Sabor"><option value="refeicao">Refeição no Castelo</option><option value="semCastelo">Um dia sem comer no Castelo</option><option value="purificacao">Purificação (cura o vício com 0 PM)</option></optgroup>
					<optgroup label="Galswell"><option value="galswell">Duelo de atuação (contra +10)</option></optgroup>
					<optgroup label="Elemental da Poluição"><option value="entender">Entender o Elemental (CD 25, uma vez por dia)</option><option value="contato">Contato: Fortitude CD 20 do dia</option></optgroup>
					<optgroup label="Mercado do Ouro Tolo"><option value="mercado">Perceber o assalto (Guerra, Intuição ou Ladinagem CD 20)</option></optgroup>
					<optgroup label="Gazeta"><option value="gazeta">Entrevista (o primeiro selecionado representa o grupo)</option></optgroup>
					<optgroup label="Orfanato"><option value="orfanato">Notar a bênção de Nimb (Misticismo ou Religião CD 25)</option></optgroup>
					<optgroup label="Yolana"><option value="intrusao">Resistir à intrusão (Vontade contra Memética +15)</option><option value="manipular">Manipulação mental (voluntário)</option></optgroup>
					<optgroup label="Anatole"><option value="anatole">Ver através da lábia (Intuição contra Enganação +12)</option></optgroup>
					<optgroup label="Avatar da Cidade"><option value="avatar">Memória do Avatar (o jogador rola por ele)</option></optgroup>
					<optgroup label="Clube de Cavalheiros"><option value="clubePerceber">Perceber a fachada (Conhecimento ou Ladinagem CD 30)</option><option value="clubeConvencer">Convencer os taxidermistas (social CD 25)</option><option value="clubeViolacao">Registrar uma violação das regras</option><option value="clubeFuga">Fugir depois de atacar</option></optgroup>
					<optgroup label="Justine"><option value="justine">Fazer campanha (teste social, soma votos)</option></optgroup>
					<optgroup label="Tilliann"><option value="metal">Dar os 5 pedaços de metal arco-íris</option><option value="forja">Convencer a ajudar na forja (CD 30, +5 por item)</option></optgroup>
				</select></div>
				<div class="form-group"><label>Perícia social (Gazeta, Justine, Clube, Tilliann)</label><select name="social">${opPer(["dipl", "enga", "inti", "atua", "nobr"])}</select></div>
				<div class="form-group"><label>Rodadas de uso (Carroça)</label><input type="number" name="rodadas" value="1" min="1" max="20"></div>
				<div class="form-group"><label>Gazeta: perícia afetada</label><select name="afetada">${opPer(["luta", "pont", "dipl", "enga", "furt", "inti", "atua", "inve", "nobr"])}</select></div>
				<div class="form-group"><label>Yolana: perícia com –5</label><select name="menos">${opPer(Object.keys(D.pericias))}</select></div>
				<div class="form-group"><label>Yolana: perícia com +5</label><select name="mais">${opPer(Object.keys(D.pericias))}</select></div>
				<div class="form-group"><label>Avatar: o que perguntam</label><select name="memoria">${D.memoria.map(([cd, t]) => `<option value="${cd}">${t} (CD ${cd})</option>`).join("")}</select></div>
				<div class="form-group"><label>Bônus extra no teste</label><input type="number" name="mod" value="0"></div>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		const whisper = ChatMessage.getWhisperRecipients("GM");
		const mod = Number(res.mod) || 0;
		const val = (a, k) => Number(a.system.pericias?.[k]?.value) || 0;
		const melhor = (a, ks) => ks.reduce((m, k) => (val(a, k) > val(a, m) ? k : m), ks[0]);
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r; };
		const testar = async (a, ks, cd) => {
			const k = melhor(a, ks);
			const r = await rolar(`1d20 + ${val(a, k)} + ${mod}`);
			return { k, r, ok: r.total >= cd, nat: r.dice[0]?.total };
		};
		const linha = (a, t, cd) => `${a.name} · ${D.pericias[t.k]} <b>${t.r.total}</b>${cd ? ` contra CD ${cd}` : ""}: ${t.ok ? "✔️" : "❌"}`;
		const precisa = (n = 1) => {
			if (atores.length >= n) return true;
			ui.notifications.warn("Selecione o(s) token(s) de quem faz o teste.");
			return false;
		};
		const efeito = (a, name, changes, o = {}) => a.createEmbeddedDocuments("ActiveEffect", [{
			name, img: o.img ?? "icons/svg/aura.svg", type: "base", duration: o.duration ?? {}, description: o.description ?? "", flags: { world: { fdt: TAG, ...(o.flag ? { [o.flag]: true } : {}) } },
			system: { changes: changes.map(([key, value]) => ({ key, value: String(value), type: "add", phase: "initial", priority: null })) }
		}]);
		const tirar = async (a, flag) => {
			const ids = a.effects.filter((x) => x.getFlag("world", flag)).map((x) => x.id);
			if (ids.length) await a.deleteEmbeddedDocuments("ActiveEffect", ids);
		};
		let html = "";
		let salvar = false;
		switch (res.teste) {
			case "carroca": {
				const g = est.gnuk ?? 0;
				if (g >= 2) { html = "<h3>Carroça de Lagarto Interno</h3><p>A Carroça está pronta: <b>sem chance de explosão</b> e sem penalidade em Pilotagem.</p>"; break; }
				const [base, passo] = g === 1 ? [5, 5] : [10, 10];
				const n = Math.clamp(Number(res.rodadas) || 1, 1, 20);
				html = `<h3>Carroça de Lagarto Interno (${g === 1 ? "versão aperfeiçoada" : "protótipo"})</h3><p>–5 em Pilotagem.</p><ol>`;
				let explodiu = 0;
				for (let i = 0; i < n && !explodiu; i++) {
					const chance = Math.min(100, base + passo * i);
					const r = await rolar("1d100");
					html += `<li>Rodada ${i + 1}: ${chance}% → d100 ${r.total} ${r.total <= chance ? "💥 <b>explode!</b>" : "ok"}</li>`;
					if (r.total <= chance) explodiu = i + 1;
				}
				html += "</ol>";
				if (explodiu) {
					const d = await rolar("5d6");
					html += `<p>5d6 = <b>${d.total}</b> de impacto nos pilotos (Reflexos CD 20 reduz à metade):</p><ul>`;
					for (const a of atores) {
						const t = await testar(a, ["refl"], 20);
						const dano = t.ok ? Math.floor(d.total / 2) : d.total;
						await a.applyDamageV2(await new Roll(`${dano}[impacto]`).evaluate(), 1);
						html += `<li>${linha(a, t, 20)} → ${dano} de dano</li>`;
					}
					html += "</ul><p>Gnuk volta à prancheta: a contagem de aperfeiçoamento recomeça.</p>";
					est.gnuk = 0;
				} else {
					est.gnuk = g + 1;
					html += `<p>Não explodiu! ${est.gnuk >= 2 ? "No próximo encontro, Gnuk traz a Carroça <b>pronta</b>." : "No próximo encontro, Gnuk traz a versão aperfeiçoada (5%, +5%)."}</p>`;
				}
				salvar = true;
				break;
			}
			case "wynstar": {
				if (!precisa()) return;
				html = "<h3>Wynstar: formulário</h3><ul>";
				for (const a of atores) {
					const t = await testar(a, ["nobr", "conh"], 20);
					html += `<li>${linha(a, t, 20)}${t.ok ? " formulário preenchido." : " <b>multa de 20%</b> do próximo pagamento (a Xerife Mathilda desconta)."}</li>`;
				}
				html += "</ul>";
				break;
			}
			case "refeicao": case "semCastelo": case "purificacao": {
				if (!precisa()) return;
				html = "<h3>Castelo do Sabor</h3><ul>";
				for (const a of atores) {
					const c = foundry.utils.deepClone(a.getFlag("world", "fdtCastelo") ?? { refeicoes: 0, penal: 0, viciado: false });
					if (res.teste === "refeicao") {
						c.refeicoes++;
						if (c.penal) html += `<li>${a.name} come no Castelo: as penalidades (–${c.penal} PM) <b>somem</b>. Amanhã, sem Castelo, –2 de novo.</li>`;
						c.penal = 0;
						if (c.refeicoes > 3 && !c.viciado) { c.viciado = true; c.penal = 2; html += `<li>${a.name}: ${c.refeicoes}ª refeição: <b>viciado</b>! –2 PM máximos.</li>`; }
						else if (!c.viciado) html += `<li>${a.name}: ${c.refeicoes}ª refeição no Castelo.</li>`;
					} else if (res.teste === "semCastelo") {
						if (!c.viciado) { html += `<li>${a.name} não é viciado.</li>`; continue; }
						c.penal += 2;
						html += `<li>${a.name}: um dia sem Castelo, <b>–${c.penal} PM</b> máximos no total.</li>`;
					} else {
						const pm = Number(a.system.attributes.pm?.max) || 0;
						if (c.viciado && pm > 0) { html += `<li>${a.name} ainda tem ${pm} PM máximos: <i>Purificação</i> só cura quem chegou a 0 PM pelas penalidades.</li>`; continue; }
						c.viciado = false; c.penal = 0; c.refeicoes = 0;
						html += `<li>${a.name} está <b>livre do vício</b> no Castelo do Sabor.</li>`;
					}
					await tirar(a, "fdtCasteloFx");
					if (c.penal) await efeito(a, `Vício no Castelo do Sabor (–${c.penal} PM)`, [["system.attributes.pm.bonus.total", -c.penal]], { img: "icons/svg/poison.svg", flag: "fdtCasteloFx", description: "PM que não se recuperam de jeito nenhum até comer no Castelo de novo." });
					await a.setFlag("world", "fdtCastelo", c);
				}
				html += "</ul>";
				break;
			}
			case "galswell": {
				if (!precisa()) return;
				const g = await rolar("1d20 + 10");
				html = `<h3>Duelo de atuação</h3><p>Galswell: <b>${g.total}</b>.</p><ul>`;
				for (const a of atores) { const t = await testar(a, ["atua"], g.total + 1); html += `<li>${linha(a, t)} ${t.ok ? "vence!" : "perde."}</li>`; }
				html += "</ul>";
				break;
			}
			case "entender": {
				if (!precisa()) return;
				const t = await testar(atores[0], ["conh", "mist", "reli", "sobr"], 25);
				est.elemental = (est.elemental ?? 0) + (t.ok ? 1 : 0);
				const s = Math.min(3, est.elemental);
				const rev = ["Ainda não entendem nada.", "É feito de <b>poluição</b> (explique que o conceito é novo em Arton).", "É algo <b>novo e ao mesmo tempo primordial</b>, como os elementos.", "Compreendem tudo: respondem qualquer dúvida e podem influenciar o comportamento dele."][s];
				html = `<h3>Entender o Elemental da Poluição</h3><p>${linha(atores[0], t, 25)}. Sucessos: <b>${s}/3</b>.</p><p>${rev}</p><p style="font-size:0.85em">Pode repetir uma vez por dia.</p>`;
				salvar = true;
				break;
			}
			case "contato": {
				if (!precisa()) return;
				html = "<h3>Contato com o Elemental da Poluição</h3><ul>";
				for (const a of atores) {
					const t = await testar(a, ["fort"], 20);
					let f = Number(a.getFlag("world", "fdtPoluicao")) || 0;
					if (f >= 4) { html += `<li>${a.name} já é uma criatura de poluição.</li>`; continue; }
					if (!t.ok) f++;
					html += `<li>${linha(a, t, 20)}`;
					if (!t.ok) {
						if (f === 1) { await a.toggleStatusEffect("fraco", { active: true }); html += " fica <b>fraco</b>."; }
						if (f === 2) { await a.toggleStatusEffect("debilitado", { active: true }); html += " fica <b>debilitado</b>."; }
						if (f === 3) { await efeito(a, "Poluição (–2 Con e Car)", [["system.atributos.con.bonus", -2], ["system.atributos.car.bonus", -2]], { img: "icons/svg/poison.svg", flag: "fdtPoluicaoFx" }); html += " sofre <b>–2 em Constituição e Carisma</b> (temporário)."; }
						if (f === 4) {
							await tirar(a, "fdtPoluicaoFx");
							await a.toggleStatusEffect("fraco", { active: false });
							await a.toggleStatusEffect("debilitado", { active: false });
							await efeito(a, "Criatura de Poluição", [], { img: "icons/svg/acid.svg", flag: "fdtPoluicaoFx", description: "Só é capaz de comer lixo, respirar fumaça e beber água contaminada. Permanente até ser revertido de forma criativa." });
							html += " vira uma <b>criatura de poluição</b>: só come lixo, respira fumaça e bebe água contaminada. As outras penalidades somem.";
						}
					}
					await a.setFlag("world", "fdtPoluicao", f);
					html += "</li>";
				}
				html += "</ul>";
				break;
			}
			case "mercado": case "orfanato": case "clubePerceber": {
				if (!precisa()) return;
				const [titulo, ks, cd, ok] = {
					mercado: ["Algo está errado no Mercado do Ouro Tolo", ["guer", "intu", "ladi"], 20, "percebe: o mercado está sendo <b>assaltado</b>."],
					orfanato: ["O Orfanato das Pobres e Desgraçadas Crianças Infelizes", ["mist", "reli"], 25, "percebe: a área foi tocada por <b>Nimb</b>."],
					clubePerceber: ["A guilda de taxidermistas", ["conh", "ladi"], 30, "percebe que há <b>algo por trás da fachada</b>."]
				}[res.teste];
				html = `<h3>${titulo}</h3><ul>`;
				for (const a of atores) { const t = await testar(a, ks, cd); html += `<li>${linha(a, t, cd)} ${t.ok ? ok : ""}</li>`; }
				html += "</ul>";
				break;
			}
			case "gazeta": {
				if (!precisa()) return;
				const a = atores[0];
				const r = await rolar(`1d20 + ${val(a, res.social)} + ${mod}`);
				const [, , v, txt] = D.gazeta.find(([de, ate]) => r.total >= de && r.total <= ate);
				const k = res.afetada;
				html = `<h3>Entrevista para a Gazeta do Reinado</h3><p>${a.name} · ${D.pericias[res.social]} <b>${r.total}</b>: ${txt}</p><p><b>${v > 0 ? "+" : ""}${v} em ${D.pericias[k]}</b> até o fim da aventura para os selecionados (apague o efeito no fim).</p>`;
				for (const x of atores) {
					await tirar(x, "fdtGazeta");
					await efeito(x, `Manchete da Gazeta (${v > 0 ? "+" : ""}${v} ${D.pericias[k]})`, [[`system.pericias.${k}.bonus`, v]], { img: "icons/svg/book.svg", flag: "fdtGazeta", description: "Até o fim da aventura." });
				}
				break;
			}
			case "intrusao": {
				if (!precisa()) return;
				html = "<h3>Intrusão de Silêncio Aberrante</h3><ul>";
				for (const a of atores) {
					const y = await rolar("1d20 + 15");
					const t = await testar(a, ["vont"], y.total + 1);
					html += `<li>${a.name} · Vontade <b>${t.r.total}</b> contra Memética ${y.total}: ${t.ok ? "✔️ resiste" : "❌ Yolana entra: \"pichação mental\", e ela pode ler pensamentos e memórias"}</li>`;
				}
				html += "</ul>";
				break;
			}
			case "manipular": {
				if (!precisa()) return;
				const a = atores[0];
				const r = await rolar("1d20 + 15");
				const nat = r.dice[0]?.total;
				html = `<h3>Manipulação mental de Yolana</h3><p>Memética <b>${r.total}</b> contra CD 25 (d20 ${nat}).</p>`;
				await tirar(a, "fdtYolana");
				if (nat === 1) {
					await efeito(a, `Yolana errou (–5 ${D.pericias[res.mais]})`, [[`system.pericias.${res.mais}.bonus`, -5]], { img: "icons/svg/daze.svg", flag: "fdtYolana", duration: { value: 86400, units: "seconds" } });
					html += `<p>💥 <b>1 natural:</b> ${a.name} fica com <b>–5 em ${D.pericias[res.mais]}</b> por um dia.</p>`;
				} else if (r.total >= 25) {
					await efeito(a, `Mente reorganizada (–5 ${D.pericias[res.menos]}, +5 ${D.pericias[res.mais]})`, [[`system.pericias.${res.menos}.bonus`, -5], [`system.pericias.${res.mais}.bonus`, 5]], { img: "icons/svg/daze.svg", flag: "fdtYolana", duration: { value: 86400, units: "seconds" }, description: "Um dia. Para dividir os +5 entre várias perícias, edite o efeito." });
					html += `<p>✔️ ${a.name}: <b>–5 em ${D.pericias[res.menos]}</b> (deve ser treinada) e <b>+5 em ${D.pericias[res.mais]}</b> por um dia. Para dividir os 5 pontos, edite o efeito.</p>`;
				} else html += "<p>❌ Não funciona hoje.</p>";
				html += "<p style=\"font-size:0.85em\">Uma vez por dia por personagem.</p>";
				break;
			}
			case "anatole": {
				if (!precisa()) return;
				html = "<h3>Anatole, o empresário</h3><ul>";
				for (const a of atores) {
					const e = await rolar("1d20 + 12");
					const t = await testar(a, ["intu"], e.total);
					html += `<li>${a.name} · Intuição <b>${t.r.total}</b> contra Enganação ${e.total}: ${t.ok ? "✔️ percebe que ele só ouve boatos em tavernas, como qualquer um" : "❌ acredita na lábia"}</li>`;
				}
				html += "</ul>";
				break;
			}
			case "avatar": {
				const cd = Number(res.memoria) || 20;
				const r = await rolar(`1d20 + 15 + ${mod}`);
				html = `<h3>Memória do Avatar da Cidade</h3><p>${D.memoria.find(([c]) => c === cd)?.[1] ?? ""} (CD ${cd}): Memória <b>${r.total}</b>. ${r.total >= cd ? "✔️ Ele lembra." : "❌ \"Esse conhecimento não deve ser recebido, mas conquistado.\""}</p><p style="font-size:0.85em">Uma pergunta por personagem. O Mestre pode vetar qualquer pergunta.</p>`;
				break;
			}
			case "clubeConvencer": {
				if (!precisa()) return;
				html = "<h3>Convencer os taxidermistas</h3><p>Os jogadores precisam dizer que sabem que há algo por trás da fachada.</p><ul>";
				for (const a of atores) {
					const r = await rolar(`1d20 + ${val(a, res.social)} + ${mod}`);
					html += `<li>${a.name} · ${D.pericias[res.social]} <b>${r.total}</b> contra CD 25: ${r.total >= 25 ? "✔️ conduzido ao salão comunal" : "❌"}</li>`;
				}
				html += "</ul>";
				break;
			}
			case "clubeViolacao": {
				est.clube = (est.clube ?? 0) + 1;
				html = `<h3>Clube de Cavalheiros</h3><p>Violação nº <b>${est.clube}</b>: ${est.clube === 1 ? "um aviso educado." : est.clube === 2 ? "o grupo é <b>convidado a se retirar</b>." : "<b>combate</b>. Use \"Fugir depois de atacar\"."}</p>`;
				if (est.clube >= 3) est.clube = 0;
				salvar = true;
				break;
			}
			case "clubeFuga": {
				if (!precisa()) return;
				html = "<h3>Fuga do Clube de Cavalheiros</h3><p>Ninguém neste nível derrota os clientes. Cada herói testa a melhor entre Luta, Pontaria, Misticismo, Religião, Fortitude, Reflexos e Furtividade.</p><ul>";
				for (const a of atores) {
					const t = await testar(a, ["luta", "pont", "mist", "reli", "fort", "refl", "furt"], 0);
					const [lim, txt] = D.clubeFuga.find(([l]) => t.r.total >= l);
					const pv = a.system.attributes.pv;
					const pm = a.system.attributes.pm;
					if (lim >= 25) await a.update({ "system.attributes.pv.value": Math.floor((Number(pv.value) || 0) / 2), "system.attributes.pm.value": Math.floor((Number(pm.value) || 0) / 2) });
					else if (lim >= 15) await a.update({ "system.attributes.pv.value": 0, "system.attributes.pm.value": 0 });
					else await a.toggleStatusEffect("morto", { active: true });
					html += `<li>${a.name} · ${D.pericias[t.k]} <b>${t.r.total}</b>: ${txt}</li>`;
				}
				html += "</ul><p style=\"font-size:0.85em\">Itens perdidos: tire da ficha à mão.</p>";
				break;
			}
			case "justine": {
				if (!precisa()) return;
				html = "<h3>Campanha para Justine</h3><ul>";
				let soma = 0;
				for (const a of atores) {
					const r = await rolar(`1d20 + ${val(a, res.social)} + ${mod}`);
					soma += r.total;
					html += `<li>${a.name} · ${D.pericias[res.social]} <b>${r.total}</b></li>`;
				}
				est.votos = (est.votos ?? 0) + soma;
				html += `</ul><p>+${soma} votos. <span class="secret">Total secreto: ${est.votos}/500. Os jogadores só sabem no próximo encontro com Justine ou no fim do arco.</span></p>`;
				salvar = true;
				break;
			}
			case "metal": {
				est.tilliann = { ...(est.tilliann ?? {}), metal: true, cd: est.tilliann?.cd ?? 30 };
				html = "<h3>Tilliann recebe o metal arco-íris</h3><p>Uma partícula de divindade volta: <b>um único</b> artoniano pode virar devoto e ganhar <i>Procrastinação Criativa</i> (item na pasta). Pedaços extras não dão mais nada.</p><p>Tilliann explica todas as propriedades do metal: qualquer melhoria (exceto material especial), reforja infinita e +5 em resistência contra lefeu e Tormenta. O conhecimento pode ir para Blixto ou Belinda.</p>";
				salvar = true;
				break;
			}
			case "forja": {
				if (!precisa()) return;
				const t0 = est.tilliann ?? { cd: 30 };
				const cd = t0.cd ?? 30;
				if (t0.travado) { html = `<h3>Forja com Tilliann</h3><p>Uma tentativa já falhou: só depois de um novo encontro aleatório com ele, que retoma da CD ${cd} (o <i>Encontro na Cidade</i> destrava).</p>`; break; }
				const a = atores[0];
				const r = await rolar(`1d20 + ${val(a, res.social)} + ${mod}`);
				const ok = r.total >= cd;
				html = `<h3>Forja com Tilliann</h3><p>${a.name} · ${D.pericias[res.social]} <b>${r.total}</b> contra CD ${cd}: ${ok ? "✔️ ele ajuda: o item ganha uma melhoria extra que não conta no limite nem muda custo e CD (não pode ser material especial). Só vale para itens feitos pelos próprios personagens." : "❌ ele se perde nas arengas. Só tentam de novo noutro encontro aleatório."}</p>`;
				est.tilliann = { ...t0, cd: ok ? cd + 5 : cd, travado: !ok };
				salvar = true;
				break;
			}
		}
		if (salvar) await game.user.setFlag("world", ESTADO, est);
		if (html) await ChatMessage.create({ content: html, rolls, whisper });
	}

	async function macroDesafios(D) {
		const ESTADO = "fdtEncValkaria";
		const TAG = "a2encontros";
		const est = foundry.utils.deepClone(game.user.getFlag("world", ESTADO) ?? {});
		const atores = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Valkaria · Desafios da Cidade" },
			position: { width: 540 },
			content: `
				<div class="form-group"><label>Desafio</label><select name="desafio">
					<option value="corrida">Corrida do Circuito de Montarias Extremas (o primeiro selecionado corre)</option>
					<option value="lixao">Um turno no Depósito de Lixo (o primeiro procura, todos testam Fortitude)</option>
					<option value="banho">Banho e roupas limpas (tira o fedor do lixão)</option>
					<option value="arena">Lutas Qualificatórias da Arena (o primeiro selecionado luta)</option></select></div>
				<p><b>Corrida</b></p>
				<div class="form-group"><label>Montaria desconhecida (–5)</label><input type="checkbox" name="estranha" checked></div>
				<div class="form-group"><label>Bônus de poções, itens e magias</label><input type="number" name="bonusCorrida" value="0"></div>
				<div class="form-group"><label>Correr pelo Bebê Corisco (aceitou o pedido)</label><input type="checkbox" name="corisco" checked></div>
				<p><b>Lixão</b></p>
				<div class="form-group"><label>Ajuda de outros na Investigação</label><input type="number" name="ajuda" value="0"></div>
				<p><b>Arena</b></p>
				<div class="form-group"><label>Bônus de ataque (0 = o melhor entre Luta e Pontaria da ficha)</label><input type="number" name="ataque" value="0"></div>
				<div class="form-group"><label>PV investidos por luta (5 PV = +1)</label><input type="number" name="pv" value="0" min="0"></div>
				<div class="form-group"><label>PM investidos por luta (2 PM = +1)</label><input type="number" name="pm" value="0" min="0"></div>
				<div class="form-group"><label>Bônus de Glamour (tabela do diário)</label><input type="number" name="glamour" value="0"></div>`,
			ok: { label: "Começar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		const whisper = ChatMessage.getWhisperRecipients("GM");
		const val = (a, k) => Number(a.system.pericias?.[k]?.value) || 0;
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r; };
		const a = atores[0];
		if (!a) return ui.notifications.warn("Selecione o token de quem participa (e, no lixão, o resto do grupo).");
		let html = "";
		if (res.desafio === "corrida") {
			const rivais = [];
			for (const [nome, desc] of D.corredores.slice(1)) rivais.push({ nome, desc, cav: (await rolar("1d20 + 10")).total, soma: 0 });
			const bonus = val(a, "cava") + (res.estranha ? -5 : 0) + (Number(res.bonusCorrida) || 0);
			let soma = 0;
			html = `<h3>Circuito de Montarias Extremas</h3><p>${a.name} monta ${res.corisco ? "o zangão do pesadelo de Bebê Corisco" : "a própria montaria"} (Cavalgar ${bonus >= 0 ? "+" : ""}${bonus}). Rivais: ${rivais.map((r) => `${r.nome}, ${r.desc} (+${r.cav})`).join("; ")}.</p><table><tr><th>Teste</th><th>${a.name}</th>${rivais.map((r) => `<th>${r.nome}</th>`).join("")}</tr>`;
			for (let i = 1; i <= 5; i++) {
				const r = await rolar(`1d20 + ${bonus}`);
				soma += r.total;
				const cel = [];
				for (const x of rivais) { const y = await rolar(`1d20 + ${x.cav}`); x.soma += y.total; cel.push(y.total); }
				html += `<tr><td>${i}</td><td>${r.total}</td>${cel.map((c) => `<td>${c}</td>`).join("")}</tr>`;
			}
			html += `<tr><td><b>Total</b></td><td><b>${soma}</b></td>${rivais.map((x) => `<td><b>${x.soma}</b></td>`).join("")}</tr></table>`;
			const melhorRival = rivais.reduce((m, x) => (x.soma > m.soma ? x : m), rivais[0]);
			if (soma > melhorRival.soma) html += `<p>🏆 <b>${a.name} vence!</b> Leva T$ 2.500${res.corisco ? " (metade fica com Bebê Corisco: T$ 1.250 para o grupo)" : ""}.</p>`;
			else html += `<p>❌ Vence ${melhorRival.nome} (${melhorRival.soma}). ${a.name} perde a aposta de T$ 500${res.corisco ? " (Corisco não ajuda a pagar)" : ""}.</p>`;
			if (res.corisco) { est.corisco = true; await game.user.setFlag("world", ESTADO, est); }
		} else if (res.desafio === "lixao") {
			const r = await rolar(`1d20 + ${val(a, "inve")} + ${Number(res.ajuda) || 0}`);
			const [, , txt] = D.lixo.find(([de, ate]) => r.total >= de && r.total <= ate);
			html = `<h3>Depósito de Lixo de Valkaria</h3><p>${a.name} · Investigação <b>${r.total}</b> (sem escolher 10 ou 20): ${txt}</p><p>Fortitude de cada um (CD 20, +2 por teste anterior):</p><ul>`;
			for (const x of atores) {
				const t = foundry.utils.deepClone(x.getFlag("world", "fdtLixao") ?? { testes: 0, turnos: 0 });
				const cd = 20 + 2 * t.testes;
				const f = await rolar(`1d20 + ${val(x, "fort")}`);
				t.testes++;
				t.turnos++;
				html += `<li>${x.name} · Fortitude <b>${f.total}</b> contra CD ${cd}: ${f.total >= cd ? "✔️" : "❌ contrai <b>infecção do esgoto</b> (<i>Tormenta20</i>, p. 318)"}. Fedor: <b>–${5 * t.turnos}</b> em perícias sociais.</li>`;
				const ids = x.effects.filter((e) => e.getFlag("world", "fdtFedor")).map((e) => e.id);
				if (ids.length) await x.deleteEmbeddedDocuments("ActiveEffect", ids);
				await x.createEmbeddedDocuments("ActiveEffect", [{
					name: `Fedor do Lixão (–${5 * t.turnos} social)`, img: "icons/svg/poison.svg", type: "base", flags: { world: { fdt: TAG, fdtFedor: true } },
					description: "Contra criaturas capazes de sentir cheiros. Some com um bom banho e uma muda de roupas (macro Desafios da Cidade › Banho).",
					system: { changes: ["dipl", "enga", "inti", "atua", "nobr"].map((k) => ({ key: `system.pericias.${k}.bonus`, value: String(-5 * t.turnos), type: "add", phase: "initial", priority: null })) }
				}]);
				await x.setFlag("world", "fdtLixao", t);
			}
			html += "</ul>";
		} else if (res.desafio === "banho") {
			html = "<h3>Banho e roupas limpas</h3><ul>";
			for (const x of atores) {
				const ids = x.effects.filter((e) => e.getFlag("world", "fdtFedor")).map((e) => e.id);
				if (ids.length) await x.deleteEmbeddedDocuments("ActiveEffect", ids);
				const t = x.getFlag("world", "fdtLixao");
				if (t) await x.setFlag("world", "fdtLixao", { testes: t.testes, turnos: 0 });
				html += `<li>${x.name}: sem fedor.</li>`;
			}
			html += "</ul><p style=\"font-size:0.85em\">A CD de Fortitude continua subindo nas próximas visitas ao lixão.</p>";
		} else {
			let lista = Array.isArray(est.lutadores) && est.lutadores.length ? est.lutadores : null;
			if (!lista) {
				lista = [];
				while (lista.length < 5) { const r = await rolar(`1d${D.lutadores.length}`); if (!lista.includes(r.total - 1)) lista.push(r.total - 1); }
			}
			const nivel = Number(a.system.attributes?.nivel?.value) || 1;
			// Por luta, o gasto de PV e de PM é limitado ao nível; só múltiplos de 5 PV e 2 PM rendem bônus.
			const pvInv = Math.floor(Math.clamp(Number(res.pv) || 0, 0, nivel) / 5) * 5;
			const pmInv = Math.floor(Math.clamp(Number(res.pm) || 0, 0, nivel) / 2) * 2;
			const invest = Math.floor(pvInv / 5) + Math.floor(pmInv / 2);
			const atk = Number(res.ataque) || Math.max(val(a, "luta"), val(a, "pont"));
			html = `<h3>Lutas Qualificatórias</h3><p>${a.name}: ataque +${atk}, investindo ${pvInv} PV e ${pmInv} PM por luta (+${invest}; limite de ${nivel} cada).</p><ol>`;
			let penal = 0;
			let gastoPV = 0;
			let gastoPM = 0;
			let venceu = 0;
			for (const i of lista) {
				const [nome, , b, regra] = D.lutadores[i];
				let r;
				let y;
				do {
					r = await rolar(`1d20 + ${atk} + ${invest} - ${penal}`);
					y = await rolar(`1d20 + ${b}`);
				} while (r.total === y.total);
				gastoPV += pvInv;
				gastoPM += pmInv;
				const ok = r.total > y.total;
				let nota = "";
				penal = 0;
				if (regra === "zardana") { penal = y.total; nota = ` Cola e purpurina: <b>–${y.total}</b> na próxima luta.`; }
				if (regra === "shai") { gastoPV += y.total; nota = ` Shai-Nefer absorve <b>${y.total} PV</b>.`; }
				html += `<li>${nome}: ${r.total} contra ${y.total} ${ok ? "✔️" : "❌"}${nota}</li>`;
				if (!ok) break;
				venceu++;
			}
			html += "</ol>";
			const pv = a.system.attributes.pv;
			const pm = a.system.attributes.pm;
			await a.update({ "system.attributes.pv.value": Math.max(0, (Number(pv.value) || 0) - gastoPV), "system.attributes.pm.value": Math.max(0, (Number(pm.value) || 0) - gastoPM) });
			html += `<p>Gastos: ${gastoPV} PV e ${gastoPM} PM.</p>`;
			if (venceu === lista.length) {
				const t = await rolar(`1d20 + ${val(a, "atua")} + ${Number(res.glamour) || 0}`);
				html += `<p>Venceu as cinco! Atuação + Glamour <b>${t.total}</b> contra CD 30: ${t.total >= 30 ? "✔️ <b>escolhido!</b> Libera a atividade especial Luta na Arena de Valkaria." : "❌ venceu, mas sem brilho: os empresários não se impressionam."}</p>`;
			} else html += `<p>Eliminado depois de ${venceu} vitória(s).</p>`;
			est.lutadores = [];
			await game.user.setFlag("world", ESTADO, est);
		}
		await ChatMessage.create({ content: html, rolls, whisper });
	}

	const macro = (name, img, fn, dados = null) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Arco 2 · Encontros em Valkaria · gerado por a2-encontros-valkaria.js\n${dados ? `const DADOS = ${JSON.stringify(dados)};\n` : ""}(${fn.toString()})(${dados ? "DADOS" : ""});`
	});
	const ENC_MACRO = ENC.map(({ k, nome, tipo, resumo, mec, roles }) => ({ k, nome, tipo, resumo, mec, roles }));
	const macros = await Macro.createDocuments([
		macro("Valkaria · Encontro na Cidade", "icons/svg/village.svg", macroEncontro, { enc: ENC_MACRO, aforismos: AFORISMOS, lutadores: LUTADORES }),
		macro("Valkaria · Testes dos Encontros", "icons/svg/dice-target.svg", macroTestes, { pericias: PERICIAS, gazeta: GAZETA, memoria: MEMORIA, clubeFuga: CLUBE_FUGA }),
		macro("Valkaria · Desafios da Cidade", `${GE}/manopla.webp`, macroDesafios, { pericias: PERICIAS, corredores: CORREDORES, lixo: LIXO, lutadores: LUTADORES })
	]);
	const linkMacro = (trecho) => {
		const m = macros.find((x) => x.name.includes(trecho));
		return m ? `@UUID[${m.uuid}]{${m.name}}` : trecho;
	};

	/* ------------------------------------------------------------------ */
	/* 7. Diário                                                            */
	/* ------------------------------------------------------------------ */
	const pagina = (name, content, sort) => ({ name, type: "text", sort, text: { content, format: 1 } });
	const PJ = (k) => L(atores[k]);
	const tab = (cab, linhas) => `<table><tr>${cab.map((c) => `<th>${c}</th>`).join("")}</tr>${linhas.map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table>`;
	const castelo = game.items.filter((i) => ["Doppelganger", "Batata do Castelo", "Alqui-Fruta", "Cestinha Uivante"].includes(i.name));
	const EXTRA = {
		gnuk: `<p>Item: ${L(itCarroca)}. Role a explosão com ${linkMacro("Testes")} › Carroça (a macro lembra em que versão o invento está).</p>`,
		chapeleiros: `<p>Lojas: ${PJ("farboraff")} e ${PJ("brungamm")}. Tabela: ${L(tabChapeus)}.</p><ul>${CHAPEUS.map(([n, uso], i) => `<li>${L(itChapeus[i])}: +1 em ${uso}</li>`).join("")}</ul>`,
		wynstar: `<p>${linkMacro("Testes")} › Formulário.</p>`,
		drelene: `<p>Poder concedido: ${L(itDrelene)}. <i>Pessoas famosas por serem famosas: um conceito totalmente ficcional.</i></p>`,
		castelo: `<h3>Cardápio do Castelo do Sabor</h3><ul>
			<li><b>Doppelganger.</b> Sanduíche com dois pedaços de carne de procedência duvidosa, cebola, pepino em conserva, alface e o Molho do Castelo. Empanturrado: <b>RD 1</b> por um dia.</li>
			<li><b>Batata do Castelo.</b> Melora garante que não é a batata valkariana: tem muito mais sabor! <b>+1d4</b> num único teste à escolha nesse dia.</li>
			<li><b>Alqui-Fruta.</b> Líquido negro, extremamente doce, de receita alquímica secreta (tem \"fruta\" no nome, deve ser saudável!). <b>+3m de deslocamento</b> por um dia.</li>
			<li><b>Cestinha Uivante.</b> Creme gelado muito doce numa cesta comestível (não pergunte como o mantêm gelado). <b>2 PM temporários</b> por um dia.</li></ul>
			<p>${castelo.length ? `Itens já no mundo (Mini-Aventura 1): ${castelo.map(L).join(", ")}.` : "Os itens dos pratos vêm com a Mini-Aventura 1 (Ruas de Cobiça)."} Vício: ${linkMacro("Testes")} › Castelo do Sabor (refeições, dias sem Castelo e Purificação).</p>`,
		paterfax: "<p>A casa não sabe por que os Paterfax foram embora. Ainda há muitos resquícios da família, mas nada que dê pista.</p>",
		elemental: `<p>${linkMacro("Testes")} › Entender o Elemental e Contato (a macro conta os sucessos do grupo e as falhas de cada personagem).</p>`,
		mercado: `<p>Perceber: ${linkMacro("Testes")} › Mercado. ${linkMacro("Encontro")} põe os dez bandidos da Aventura 0 na cena, se ela foi importada.</p><p><i>Criminosos profissionais, que jamais rolarão uma sequência vergonhosa de 1s naturais...</i></p>`,
		corisco: `<h3>Os Corredores</h3><ul>${CORREDORES.map(([n, d]) => `<li><b>${n}:</b> ${d}</li>`).join("")}</ul><p>Tabela: ${L(tabCorredores)}. Corrida: ${linkMacro("Desafios")} › Corrida (sorteia o Cavalgar dos rivais, rola os cinco testes e paga as apostas).</p>
			<p><i>Relatos da mesa original:</i> ninguém imaginava que Bebê Corisco seria o NPC mais popular. Os Cães das Colinas venceram sem o zangão, e ele continuou o personagem mais cool da campanha. Deixe esse tipo de surpresa acontecer sozinha.</p>`,
		gazeta: `${tab(["Resultado do teste", "Perícia"], GAZETA.map(([de, ate, v]) => [de < 0 ? `${ate} ou menos` : ate > 100 ? `${de} ou mais` : `${de} a ${ate}`, `${v > 0 ? "+" : ""}${v}`]))}<p>${linkMacro("Testes")} › Entrevista aplica o efeito nos selecionados. <i>ESCÂNDALO! O que a posição do pé esquerdo de Kiki pode significar sobre sua participação em cultos profanos???</i></p>`,
		orfanato: `<p>${linkMacro("Testes")} › Orfanato.</p>`,
		yolana: `<p>${linkMacro("Testes")} › Resistir à intrusão e Manipulação mental (efeito de um dia).</p>`,
		lixao: `${tab(["Investigação", "Rolagem na tabela"], LIXO.map(([de, ate, t]) => [de < 0 ? `${ate} ou menos` : ate > 100 ? `${de} ou mais` : `${de} a ${ate}`, t]))}
			<h3>Contingência: vivendo no lixo</h3><p>Golens e osteon podem não ter nojo. Não tema: cada busca é um teste separado, sem escolher 10 ou 20; as CDs altas exigem ajuda; há a infecção, a penalidade social e a chance de não achar nada. Grupos com a personalidade certa, que se dedicam e fazem estratégias, merecem justiça: devem poder achar itens poderosos, até uma Vingadora Sagrada. Se isso for estragar a campanha, converse com os jogadores.</p>
			<p>${linkMacro("Desafios")} › Lixão rola a busca e a Fortitude de cada um, e acumula o fedor; › Banho tira o fedor.</p>`,
		anatole: `<p>${linkMacro("Testes")} › Anatole.</p>`,
		avatar: `<h3>Aforismos do Avatar da Cidade</h3><ul>${AFORISMOS.map((t) => `<li>${t}</li>`).join("")}</ul><p>Tabela: ${L(tabAforismos)}. Memória: ${linkMacro("Testes")} › Avatar.</p>`,
		clube: `<p>${linkMacro("Testes")} › Clube de Cavalheiros (perceber, convencer, violações e fuga).</p>`,
		arena: `<h3>Bônus de Glamour</h3>${tab(["Situação", "Bônus"], GLAMOUR)}<h3>Lutadores</h3>${tab(["d20", "Lutador", "Bônus"], LUTADORES.map(([n, d, b], i) => [i + 1, `<b>${n}.</b> ${d}`, `+${b}`]))}
			<p>Tabela: ${L(tabLutadores)}. ${linkMacro("Encontro")} sorteia os cinco do dia; ${linkMacro("Desafios")} › Qualificatórias conduz as lutas, os investimentos de PV e PM, Zardana, Shai-Nefer e o teste de Atuação. <i>"Você precisa vencer Sheng Long para ter chance!"</i></p>`,
		justine: `<p>${linkMacro("Testes")} › Campanha soma os votos em segredo; o próximo encontro com Justine revela o resultado.</p>`,
		tilliann: `<h3>Procrastinação Criativa</h3><p>${L(itProcrastinacao)}: se terminar uma aventura com PM sobrando, adiciona essa quantidade como PM totais extras no início da seguinte (até o dobro dos PM normais).</p>
			<h3>Efeitos do metal arco-íris</h3><p>Maleável e mutante, como Tilliann. Usado de forma simples, o potencial funciona \"por conta própria\" (as armas do Arco 1). Trabalhado por um artesão que o estudou, um item de metal arco-íris pode ter <b>qualquer melhoria de qualquer lista</b>, seja qual for o tipo de item (exceto materiais especiais): uma armadura com a melhoria maciça dá o efeito a qualquer arma do usuário; uma arma reforçada dá o efeito mesmo sem armadura. Pode ser reforjado infinitas vezes (Ofício, o tempo de uma melhoria, sem teste nem custo). Concede <b>+5 em testes de resistência</b> contra efeitos de lefeu, criaturas corrompidas pela Tormenta e áreas de Tormenta. Se o grupo ainda não sabe o básico (era mais eficiente contra criaturas das Colinas Centrais e da Tormenta), descobre agora.</p>
			<p>${linkMacro("Testes")} › Dar o metal e Forja (a CD sobe +5 por item e trava depois de uma falha).</p>`
	};

	await JournalEntry.create({
		name: "Arco 2 · Encontros em Valkaria",
		folder: pasta.JournalEntry,
		flags: FLAGS("diarioEncontros"),
		pages: [
			pagina("Guia do Mestre", `
				<h2>Como usar a tabela</h2>
				<p>Como no Arco 1, uma rolagem de <b>1d20</b> povoa Valkaria e torna cada grupo único. Role sempre que os aventureiros deixarem a base ou a Guarita da Praia (ou uma vez por bairro ou região em que entrarem, ou no padrão que preferir). O resultado é um lugar, acontecimento ou habitante: cole o adesivo do ícone (casa, castelo/palácio, comércio, esconderijo/laboratório, guarita, mansão, monumento, prédio público, taverna, templo ou vizinhança).</p>
				<p>Os <b>personagens</b> circulam pela cidade e podem ser encontrados mais de uma vez. Os <b>lugares</b> são fixos: uma vez encontrados, ficam descobertos e você pode colar o adesivo no mapa, formando a sua Valkaria. Exceções: Farboraff e Brungamm ficam nas lojas; o Castelo do Sabor é franquia e surge em vários pontos. Muitos NPCs e lugares são vagos de propósito: detalhe-os conforme o grupo interage (Bebê Corisco virou um ícone na mesa original).</p>
				<p><b>Aceite os resultados</b>, mesmo os que \"não fazem sentido\": o lixão logo nas primeiras sessões, com um item mágico poderoso, foi um dos momentos mais marcantes da campanha. Na mesa original houve menos encontros no Arco 2 que no Arco 1, porque a capital já tem elementos demais; muitos resultados repetidos e muitos locais, que viraram elementos de jogo (Residência Paterfax, Castelo do Sabor).</p>
				<h2>Ferramentas</h2>
				<ul>
					<li>${linkMacro("Encontro")}: rola (ou usa o resultado escolhido), conta quem já apareceu, marca os locais descobertos, mostra resumo, mecânica e fichas, e põe os tokens ocultos na cena. Sorteia os lutadores da Arena e um aforismo do Avatar; revela a eleição de Justine no reencontro.</li>
					<li>${linkMacro("Testes")}: Carroça, formulário de Wynstar, vício no Castelo, duelo com Galswell, Elemental, Mercado, Gazeta, Orfanato, Yolana, Anatole, Avatar, Clube, campanha de Justine e Tilliann.</li>
					<li>${linkMacro("Desafios")}: corrida do Circuito, turnos no lixão (e o banho) e as cinco lutas qualificatórias.</li>
					<li>Tabelas: ${L(tabEncontros)}, ${L(tabChapeus)}, ${L(tabLutadores)}, ${L(tabCorredores)}, ${L(tabAforismos)}. A tabela simples <i>Encontros em Valkaria</i> da Aventura 0 continua valendo para quem já a usa.</li>
				</ul>
				<h2>Fichas</h2>
				<p>${Object.values(atores).map(L).join(", ")}. Os assaltantes do Mercado usam o Bandido Descarado da Aventura 0. Itens: ${L(itCarroca)}, ${L(itDrelene)}, ${L(itProcrastinacao)} e 25 chapéus.</p>
				<h2>Os vinte encontros</h2>
				<ol>${ENC.map((e) => `<li>${e.nome}</li>`).join("")}</ol>`, 100),
			...ENC.map((e, i) => pagina(e.nome, `
				<p><i>${{ npc: "Habitante: circula e pode ser reencontrado.", local: "Local fixo: fica descoberto.", franquia: "Franquia: surge em vários pontos.", evento: "Acontecimento." }[e.tipo]}</i>${e.roles.length ? ` Fichas: ${e.roles.map(PJ).join(", ")}.` : ""}</p>
				<p>${e.resumo}</p>
				<p><b>Mecânica:</b> ${e.mec}</p>
				${EXTRA[e.k] ?? ""}`, 200 + i * 10))
		]
	});

	ui.notifications.info(`Encontros em Valkaria criados: ${Object.keys(atores).length} habitantes, ${itens.length} itens, 5 tabelas, diário e ${macros.length} macros. Veja a pasta "${NOME_PASTA}".`);
})();
