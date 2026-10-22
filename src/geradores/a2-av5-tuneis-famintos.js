/* =====================================================================
 * FIM DOS TEMPOS · ARCO 2 · AVENTURA 5 · "TÚNEIS FAMINTOS"
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Arco 2 · Av5 · Túneis Famintos" com:
 *      - Ameaças: o dragão do esgoto, o enxame de dragões do esgoto, o enxame alfa e o
 *        biomante finntroll Khenzarr (com as magias do livro).
 *      - Apoio: Vladmir Mors, Fido, Barba de Rato, Athisza, os líderes do Povo dos Túneis e o
 *        Xerife Dallmirann (sem ficha no livro).
 *      - Itens: fedor do esgoto, infecção do esgoto, lenço, capa de couro de dragão do esgoto,
 *        o documento de cidadania de Vladmir e as provas.
 *      - Tabela: Isca para os Dragões.
 *      - Diário com guia, a Mansão do Sono e Suplício, o esgoto, os dois caminhos, o Povo dos
 *        Túneis, as ideias para achar o laboratório, o covil de Khenzarr e o desfecho.
 *      - Macros: Esgoto (fedor e infecção), Testes Estendidos do Esgoto, Isca para os Dragões,
 *        Seguir um Dragão, Barulho nos Túneis, Porta do Laboratório e Dragões Invisíveis.
 *   3. Lei & Ordem continua no ator e na macro criados pela Aventura 0 (não são recriados aqui).
 *   4. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "a2av5".
 *
 * Feito a partir do código do sistema (1.6.4, out/2026). Validado no Foundry simulado do
 * módulo giriarpg-fim-dos-tempos; veja o guia a2-av5-tuneis-famintos.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "a2av5";
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
			window: { title: "Aventura 5 do Arco 2: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para a Aventura 5 do Arco 2.</p>
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
	const NOME_PASTA = "FdT · Arco 2 · Av5 · Túneis Famintos";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#3d4a2e", flags: FLAGS() })).id;
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
	const PA = `${T20I}/poderes/ameacas`;
	const ICO = {
		mordida: `${PA}/mordida.webp`,
		emboscada: `${PA}/investida.webp`,
		invisivel: `${T20I}/magias/invisibilidade.webp`,
		furtivo: `${PA}/ataque-furtivo.webp`,
		maleta: `${T20I}/itens/gerais/maleta-de-medicamentos.webp`,
		livro: `${T20I}/itens/gerais/livro.webp`,
		pergaminho: `${T20I}/itens/gerais/pergaminho.webp`
	};
	const furtivo = (d) => aoUsar(`Ataque Furtivo (+${d})`, ICO.furtivo, [["dano", d]], ["attack"]);
	const VER_INVISIVEL = (pm) => `Uma criatura em combate contra ele pode gastar uma <b>ação de movimento e ${pm} PM</b> para ignorar a invisibilidade até o início do próximo turno (macro <i>Dragões Invisíveis</i>).`;
	const invisibilidade = (alvo, pm) => poder("Invisibilidade Natural", ICO.invisivel,
		p(`<b>Livre.</b> ${alvo} fica invisível: camuflagem total, +10 em Furtividade e quem não pode vê-lo fica desprevenido contra seus ataques. Não se torna visível quando ataca, mas a invisibilidade tem falhas sutis.`, VER_INVISIVEL(pm),
			"Ligue o efeito <i>Invisível</i> na aba de efeitos (ou use a macro)."),
		{ exec: "free", effects: [fx("Invisível (natural)", ICO.invisivel, [["system.pericias.furt.bonus", "10"]], { disabled: true, transfer: true, statuses: ["invisivel"], description: "Camuflagem total, +10 em Furtividade; quem não o vê fica desprevenido." })] });
	const emboscada = (dano) => poder("Emboscada Selvagem", ICO.emboscada,
		p("<b>Completa. Recarga (movimento).</b> Avança correndo e saltando até o <b>dobro do deslocamento</b>, passando por espaços de criaturas Grandes ou menores (nunca duas vezes pelo mesmo espaço).",
			dano ? `Causa <b>${dano} de perfuração</b> em todas as criaturas nos espaços por onde passou.` : "No fim, faz um ataque de mordida e compara com a Defesa de todas as criaturas nos espaços por onde passou: dano normal da mordida em cada acerto."),
		{ exec: "full", rolls: dano ? [["Emboscada", [[dano, "perfuracao"]]]] : [] });
	const DRAGAO_BIO = "Lagartos-terror modificados por Khenzarr a partir de material trazido de Galrasia, os \"predadores-terror\": ensaios para o Mecano-Lagarto-Terror. Caçam o Povo dos Túneis; os assassinatos na superfície são danos colaterais, quando saem por alguns minutos pelos bueiros. Não se reproduzem.";

	/* ------------------------------------------------------------------ */
	/* 2. Ameaças                                                           */
	/* ------------------------------------------------------------------ */
	const atores = {};

	atores.dragao = await criarNPC({
		name: "Dragão do Esgoto",
		role: "dragao",
		img: `${T20I}/ameacas/lobo-crocodilo.png`,
		nd: 2,
		cd: 15,
		tipo: "ani",
		tamanho: "peq",
		atr: { for: 2, des: 4, con: 3, int: -4, sab: 2, car: -3 },
		pv: 21,
		def: 19,
		walk: 12,
		sentidos: ["faro", "penumbra"],
		pericias: { inic: 9, perc: 7, fort: 7, refl: 12, vont: 3, luta: 14, furt: 11, sobr: 7 },
		ataquesTxt: "Mordida +14 (1d6+12).",
		bio: p("Do tamanho de um goblin: bocarra de dentes afiados, braços curtos e pernas poderosas.", DRAGAO_BIO,
			"<b>Seguir um até o laboratório:</b> Percepção +7, mais +5 por conhecer os túneis (macro <i>Seguir um Dragão</i>)."),
		items: [
			arma("Mordida", ICO.mordida, { dano: "1d6+12", tipo: "perfuracao", effects: [furtivo("2d6")] }),
			poder("Ataque Furtivo", ICO.furtivo, p("+2d6 contra alvos desprevenidos ou flanqueados. Marque o aprimoramento na janela de ataque."), { exec: "passive" }),
			emboscada(null),
			invisibilidade("O dragão", 1)
		]
	});

	const enxame = (role, name, nd, pv, inic, perc, fort, refl, vont, furt, sobr, dano, emb, extra) => criarNPC({
		name,
		role,
		img: `${T20I}/ameacas/lobo-crocodilo.png`,
		nd,
		cd: nd === 8 ? 23 : 21,
		tipo: "ani",
		papel: "solo",
		tamanho: "gra",
		tokenSize: 2,
		atr: { for: 4, des: 4, con: 3, int: -4, sab: 2, car: -3 },
		pv,
		def: 24,
		walk: 12,
		sentidos: ["faro", "penumbra"],
		pericias: { inic, perc, fort, refl, vont, furt, sobr },
		ataquesTxt: `Enxame ${dano} de perfuração.`,
		bio: p(`Uma matilha de dragões do esgoto agindo como uma só criatura. ${extra}`, DRAGAO_BIO,
			"<b>Couro:</b> um enxame fornece duas peças de couro (Sobrevivência ou Ofício CD 21); o alfa, três (CD 23)."),
		items: [
			poder("Enxame", ICO.mordida,
				p(`Causa <b>${dano} de perfuração</b> nas criaturas em seu espaço, no fim do turno dele.`, "<b>Predadores Oportunistas:</b> contra criaturas <b>desprevenidas</b>, o dano dobra (use a segunda rolagem)."),
				{ exec: "action", rolls: [["Enxame", [[dano, "perfuracao"]]], ["Enxame (desprevenido, dobro)", [[dano.replace(/^(\d+)d6\+(\d+)$/, (m, a, b) => `${a * 2}d6+${b * 2}`), "perfuracao"]]]] }),
			emboscada(emb),
			invisibilidade("O enxame", 2),
			poder("Predadores Oportunistas", ICO.furtivo, p("O enxame causa o <b>dobro de dano</b> contra criaturas desprevenidas."), { exec: "passive" })
		]
	});
	atores.enxame = await enxame("enxame", "Enxame de Dragões do Esgoto", 6, 240, 11, 9, 12, 18, 6, 9, 9, "6d6+6", "3d6+3",
		"Ataca na segunda falha do mapeamento dos túneis, ou quem perder dois testes ao seguir um dragão.");
	atores.alfa = await enxame("alfa", "Enxame de Dragões do Esgoto Alfa", 8, 320, 14, 12, 15, 21, 8, 12, 12, "8d6+8", "4d6+4",
		"Os predadores de Khenzarr no laboratório: atacam quando ele manda.");

	atores.khenzarr = await criarNPC({
		name: "Khenzarr, o Biomante",
		tokenName: "Khenzarr",
		role: "khenzarr",
		link: true,
		img: `${T20I}/ameacas/finntroll-feitor.png`,
		nd: 9,
		cd: 31,
		tipo: "mon",
		raca: "finntroll",
		atr: { for: -1, des: 1, con: 3, int: 7, sab: 0, car: 2 },
		pv: 250,
		pm: 79,
		def: 31,
		walk: 9,
		conjuracao: "int",
		sentidos: ["escuro"],
		pericias: { inic: 9, perc: 8, fort: 15, refl: 9, vont: 21, conh: 15, cura: 11, dipl: 10, inti: 12, intu: 8, mist: 21, ofi0: 18 },
		ic: ["atordoamento", "metamorfose"],
		resTxt: "Cura acelerada 5/ácido ou fogo; resistência a magia +2; imune a atordoamento e metamorfose.",
		equipTxt: "Coleção de livros aprimorada (Misticismo), instrumentos de ofício (alquimista) aprimorados, maleta de medicamentos aprimorada, varinha arcana.",
		tesouro: "Padrão.",
		bio: p("Mago finntroll, biomante. Saiu do Império Trollkyrka, aprendeu com o Grêmio dos Médicos Monstros em Vectora, fez experimentos com gladiadores na nobreza de Wynlla e virou discípulo de Ghorskander. Criou o Povo dos Túneis (pesquisa para a pele dos golens impostores) e os dragões do esgoto (ensaios do Mecano-Lagarto-Terror).",
			"Alto, cabeça e membros alongados, avental de médico (ou de açougueiro), sangue até os antebraços. Arrogante: não vigia a porta e acha que a superfície se compra com ouro. Em combate (e preso), fala tudo, inclusive sobre Ghorskander, para contar vantagem.",
			"Quer matar o resto do Povo dos Túneis e voltar ao Império para impressionar os nobres trolls.",
			"Ofício (alquimista) +18 está na perícia Ofício."),
		effects: [
			aoUsar("Resistência a magia (+2)", `${T20I}/magias/bencao.webp`, [["roll", 2]], ["skill"], ["Fortitude", "Reflexos", "Vontade"])
		],
		items: [
			poder("Raio Arcano", `${T20I}/magias/raio-do-enfraquecimento.webp`,
				p("<b>Padrão.</b> Uma criatura em alcance médio sofre <b>3d12+7 de trevas</b> e não pode recuperar PV por 1 rodada. <b>Reflexos CD 30</b> reduz à metade e evita a restrição de cura. (A Inteligência já está somada pelo Arcano de Batalha.)"),
				{ exec: "action", alcance: "medium", alvo: "1 criatura", save: "Reflexos CD 30 reduz à metade", rolls: [["Raio", [["3d12+7", "trevas"]]]] }),
			poder("Magia Acelerada", `${T20I}/poderes/magia.webp`,
				p("<b>Livre, 4 PM.</b> Uma vez por rodada, ao lançar uma magia de ação completa ou menor, ou usar o Raio Arcano, muda a execução para livre."), { exec: "free", custo: 4 }),
			poder("Fluxo de Mana", `${T20I}/poderes/magia.webp`, p("Mantém dois efeitos sustentados com uma única ação livre, pagando cada um."), { exec: "passive" }),
			poder("Natureza Vegetal", `${T20I}/racas/dahllan.webp`,
				p("Imune a atordoamento e metamorfose, mas afetado por efeitos contra plantas monstruosas (contra magias sem resistência, Fortitude contra a CD para evitar)."), { exec: "passive" }),
			poder("Cura Acelerada 5 (ácido ou fogo)", `${PA}/imunidade-magia.webp`,
				p("Recupera 5 PV no início de cada turno. Dano de ácido ou fogo suspende a cura acelerada até o próximo turno. <b>Intolerância a Luz:</b> exposto à luz do sol ou similar, não usa a cura acelerada (e tem sensibilidade a luz)."), { exec: "passive" }),
			magia("Armadura Arcana", `${T20I}/magias/armadura-arcana.webp`,
				p("<b>Reação, 2 PM.</b> Quando sofre um ataque, +5 na Defesa contra esse ataque."), { tipoMagia: "arc", escola: "abj", exec: "reaction", custo: 2, alcance: "self" }),
			magia("Campo de Força", `${T20I}/magias/campo-de-forca.webp`,
				p("<b>Reação, 4 PM.</b> Quando sofre dano, recebe <b>RD 30</b> contra esse dano."), { tipoMagia: "arc", escola: "abj", circulo: 2, exec: "reaction", custo: 4, alcance: "self" }),
			magia("Desespero Esmagador", `${T20I}/magias/desespero-esmagador.webp`,
				p("<b>Padrão, 8 PM.</b> Criaturas num cone de 6m ficam <b>debilitadas e esmorecidas</b> (Vontade CD 31 reduz para 1 rodada)."),
				{ tipoMagia: "arc", escola: "enc", circulo: 2, exec: "action", custo: 8, area: "cone de 6m", durU: "scene", save: "Vontade CD 31 reduz para 1 rodada", effects: [cond("Debilitado"), cond("Esmorecido")] }),
			magia("Dissipar Magia", `${T20I}/magias/dissipar-magia.webp`,
				p("<b>Padrão, 3 PM.</b> Uma criatura, objeto ou esfera de 3m em alcance médio: teste de Misticismo (+21); magias com CD menor são dissipadas."),
				{ tipoMagia: "arc", escola: "abj", circulo: 2, exec: "action", custo: 3, alcance: "medium" }),
			magia("Ferver Sangue", `${T20I}/magias/ferver-sangue.webp`,
				p("<b>Padrão, 10 PM, sustentada.</b> Uma criatura em alcance curto sofre <b>6d8+7 de fogo</b> ao ser lançada e <b>6d8</b> no início de cada turno de Khenzarr, e fica enjoada por 1 rodada (Fortitude CD 31 reduz à metade e evita). Dois sucessos seguidos dissipam. Se o alvo cair a 0 PV por esta magia, explode: 6d6 de fogo a até 3m (Reflexos reduz à metade). Não afeta construtos nem mortos-vivos."),
				{ tipoMagia: "arc", escola: "nec", circulo: 3, exec: "action", custo: 10, alcance: "short", alvo: "1 criatura", durU: "sust", save: "Fortitude CD 31 reduz à metade e evita enjoado",
					rolls: [["Ao lançar", [["6d8+7", "fogo"]]], ["Turno seguinte", [["6d8", "fogo"]]], ["Explosão", [["6d6", "fogo"]]]], effects: [cond("Enjoado")] }),
			magia("Imobilizar", `${T20I}/magias/imobilizar.webp`,
				p("<b>Padrão, 6 PM.</b> Um humanoide ou animal em alcance curto fica <b>paralisado</b> (Vontade CD 31 reduz para lento). Ação completa a cada rodada para um novo teste."),
				{ tipoMagia: "arc", escola: "enc", circulo: 3, exec: "action", custo: 6, alcance: "short", alvo: "1 humanoide ou animal", durU: "scene", save: "Vontade CD 31 reduz para lento", effects: [cond("Paralisado"), cond("Lento")] }),
			magia("Metamorfose", `${T20I}/magias/metamorfose.webp`,
				p("<b>Padrão, 6 PM.</b> Uma criatura em alcance médio vira um lagarto inofensivo (Vontade CD 31 evita): não ataca, não fala, não lança magias, deslocamento 3m e Defesa 10. Novo teste de Vontade no início de cada turno."),
				{ tipoMagia: "arc", escola: "tra", circulo: 3, exec: "action", custo: 6, alcance: "medium", alvo: "1 criatura", durU: "scene", save: "Vontade CD 31 evita" })
		]
	});

	/* ---------- NPCs sem ficha no livro ---------- */
	const SEM_FICHA = "<b>Não tem ficha no livro.</b> Este ator existe para o token no mapa e para mostrar aos jogadores.";
	const apoio = (role, name, img, raca, tipo, atr, bio) => criarNPC({
		name, role, img, disposition: 1, link: true, nd: 1, tipo, raca, papel: "special", atr, pv: 10, def: 10, bio: p(...bio, SEM_FICHA)
	});
	atores.vladmir = await apoio("vladmir", "Marquês Vladmir Mors", `${T20I}/ameacas/vampiro.png`, "vampiro", "mor", { for: 3, des: 3, con: 0, int: 2, sab: 2, car: 4 }, [
		"Vampiro alto, pálido, cabelos negros longos e oleados, melancólico e indolente, com estilo. Mora na <b>Mansão do Sono e Suplício</b>, na Baixa Vila de Lena, cercado de \"crianças da noite\": jovens sem lugar onde morar, muitos lefou expulsos de casa.",
			"Tem um pergaminho oficial do Lorde Urbano dos Habitantes Ocasionalmente Monstruosos: é cidadão de Valkaria. Alimenta-se só de voluntários há mais de 100 anos (a última pessoa que matou foi em 1309). Nunca transformou ninguém. Gosta de provocar os \"certinhos\".",
			"Acusado pelos desaparecimentos só por ser vampiro: nenhuma vítima apareceu sem sangue. Paga o grupo se os verdadeiros culpados forem revelados."
	]);
	atores.fido = await apoio("fido", "Fido", `${T20I}/ameacas/lobo.png`, "humano (lobisomem)", "hum", { for: 3, des: 1, con: 2, int: -1, sab: 0, car: -1 }, [
		"O único servo do Marquês. Lobisomem: Vladmir o acorrenta nas noites de lua cheia. Pouco inteligente, medroso, foge do grupo até o mestre tranquilizá-lo.",
		"Lista vários lugares onde acharam restos (todos perto de bueiros). Viu um \"fantasma\" translúcido arrastar um rapaz para as sombras; no dia seguinte acharam os restos."
	]);
	atores.barba = await apoio("barba", "Barba de Rato, o Terror dos Sete Esgotos", `${T20I}/racas/goblin.webp`, "goblin", "hum", { for: 0, des: 3, con: 1, int: 1, sab: 1, car: 0 }, [
		"O maior (e talvez único) pirata do esgoto de Valkaria: goblin com ratos pendurados no rosto e no pescoço como barba, numa jangada de restos. A tripulação são os bichos de estimação. Usa um <b>mosquete</b> com maestria. Saqueia desavisados de vez em quando, mas não é o culpado.",
		"Já viu as \"coisas\" invisíveis, do tamanho de goblins, correndo em grupo e arrastando um cadáver: os \"fantasmas\" são os assassinos. Sabe do Povo dos Túneis e acha que eles são o alvo de verdade.",
		"Ajuda quem quiser resolver: dá carona e, no teste de caçar com ele (Sobrevivência CD 20, 5 sucessos), qualquer um pode usar <b>Pilotagem</b> e o grupo pode repetir uma rolagem."
	]);
	atores.athisza = await apoio("athisza", "Athisza, a Sereia do Esgoto", `${T20I}/racas/sereia.webp`, "sereia", "hum", { for: 1, des: 3, con: 1, int: 1, sab: 2, car: 1 }, [
		"Sereia sem olhos que conhece os túneis como ninguém e protege o Povo dos Túneis, levando-os de um esconderijo a outro. Presume que todo mundo da superfície tem sangue nas mãos; símbolos sagrados não significam nada para quem não enxerga.",
		"Só cede a provas de boas intenções (veja <i>Demonstrações de Amizade</i> no diário) e a bons testes sociais. Pode orientar um pouco a busca pelo laboratório, mas não sabe onde fica."
	]);
	const povo = "Pessoa dos Túneis: corpo costurado com pedaços de várias raças (grampos e pontos enormes). Quase sem agressividade, por condicionamento de Khenzarr; encolhe-se quando alguém ergue a mão. Riem da aparência \"ridícula\" dos heróis, feitos de uma raça só.";
	atores.ellan = await apoio("ellan", "Ellan'grag'dakrimm", `${T20I}/racas/golem.webp`, "Povo dos Túneis", "hum", { for: 2, des: 0, con: 1, int: 0, sab: 0, car: 0 }, [
		povo, "Um dos dois \"líderes\" da comunidade. Lembra a frase de Ghorskander (homem alto e magro, casaco longo, dedos compridos demais) ao visitar as jaulas: <i>\"Comece a segunda leva de experimentos.\"</i>"
	]);
	atores.gaus = await apoio("gaus", "Gausbloppasremme", `${T20I}/racas/golem.webp`, "Povo dos Túneis", "hum", { for: 1, des: 1, con: 1, int: 0, sab: 0, car: 0 }, [
		povo, "O outro \"líder\". Conta a história: as jaulas, as cirurgias, as visitas do \"homem de metal\" (Torgo), os dragões e a fuga. Restam menos de vinte."
	]);
	atores.dallmirann = await apoio("dallmirann", "Xerife Dallmirann", `${T20I}/racas/anao.webp`, "anão", "hum", { for: 2, des: 0, con: 2, int: 1, sab: 2, car: 0 }, [
		"Xerife da <b>Guarita Noturna</b> da Baixa Vila de Lena. Anão devoto de Tenebra, ex-criminoso que cumpriu pena na Rocha Cinzenta. Desconfia de tipos \"bonzinhos demais\" como Vladmir e acredita que ele é o culpado.",
		"Detetives: Kintara (\"Flor de Aço\", dahllan durona), Gordon (humano velho e piadista, ex-Regulador rebaixado) e Vannya (qareen de Marah, negociadora de reféns). Útil para a contingência do moralismo excessivo."
	]);

	/* ------------------------------------------------------------------ */
	/* 3. Itens                                                             */
	/* ------------------------------------------------------------------ */
	const itemDoc = (d) => ({ ...d, folder: pasta.Item, flags: FLAGS() });
	const tesouro = (name, img, html) => itemDoc({ name, type: "tesouro", img, system: { description: { value: html }, qtd: 1, preco: 0, peso: 0, espacos: 0 } });

	const novosItens = [
		itemDoc(poder("Fedor do Esgoto", `${PA}/fumos-toxicos.webp`,
			p("Quem circula pelo esgoto sofre <b>–2 em testes de perícia</b> (efeito de metabolismo). Com <b>faro</b>, também fica <b>alquebrado</b>. Some depois de 1 hora fora do esgoto.",
				"Um <b>lenço</b> ou proteção sobre o nariz (item vestido) reduz para –1 e evita o alquebrado. A macro <i>Esgoto</i> liga e desliga."),
			{ tipo: "geral", exec: "passive",
				effects: [
					chave("Fedor do esgoto (–2)", `${PA}/fumos-toxicos.webp`, [["system.pericias.*.bonus", "-2"]], true),
					chave("Fedor do esgoto com lenço (–1)", `${PA}/fumos-toxicos.webp`, [["system.pericias.*.bonus", "-1"]], false)
				] })),
		itemDoc(poder("Infecção do Esgoto", `${PA}/doenca.webp`,
			p("Quem passa alguns minutos no esgoto faz <b>Fortitude CD 15</b> no fim do dia (–5 se estava ferido, abaixo dos PV máximos). Falhou: contrai <b>infecção do esgoto</b> (<i>Tormenta20</i>, p. 318). A macro <i>Esgoto</i> rola para os selecionados."),
			{ tipo: "geral", exec: "passive", save: "Fortitude CD 15" })),
		itemDoc({
			name: "Lenço contra o Fedor",
			type: "equipamento",
			img: `${T20I}/itens/gerais/bandana.webp`,
			system: { description: { value: p("Lenço ou proteção improvisada sobre o nariz. Conta como item vestido: o fedor do esgoto cai para –1 e o personagem com faro não fica alquebrado.") }, qtd: 1, preco: 0, espacos: 0 }
		}),
		itemDoc({
			name: "Capa de Couro de Dragão do Esgoto",
			type: "equipamento",
			img: `${T20I}/itens/gerais/capa-esvoacante.webp`,
			effects: [fx("Capa de couro de dragão: invisível", ICO.invisivel, [["system.pericias.furt.bonus", "10"]], { disabled: true, transfer: true, statuses: ["invisivel"], description: "Camuflagem total, +10 em Furtividade, quem não vê o usuário fica desprevenido. Acaba ao atacar ou lançar magia ofensiva; ação padrão para reajustar." })],
			system: {
				description: { value: p("<b>Regra da mesa original.</b> Vestuário, item superior com duas modificações (T$ 3.090). Exige três peças de couro de dragão do esgoto e alguém capaz de fabricar itens superiores.",
					"Ao se cobrir, fica sob efeito de <b>Invisibilidade</b>: camuflagem total, +10 em Furtividade e quem não pode vê-lo fica desprevenido. Termina se atacar ou lançar magia ofensiva; uma <b>ação padrão</b> reajusta a capa. Um inimigo em combate pode gastar uma ação de movimento para ignorar a invisibilidade até o início do próximo turno.",
					"Ligue o efeito na aba de efeitos.") },
				qtd: 1, preco: 3090, espacos: 1
			}
		}),
		tesouro("Couro de Dragão do Esgoto", `${T20I}/itens/gerais/couro-de-dragao.webp`,
			p("Extrair: Sobrevivência ou Ofício (artesão ou alfaiate) <b>CD 17</b> (um dragão dá uma peça), <b>CD 21</b> (enxame, duas peças) ou <b>CD 23</b> (enxame alfa, três peças). Três peças fazem uma capa.")),
		tesouro("Pergaminho de Cidadania de Vladmir", ICO.pergaminho,
			p("Documento oficial do Lorde Urbano dos Habitantes Ocasionalmente Monstruosos: o Marquês Vladmir Mors é cidadão de Valkaria, com todos os direitos e deveres. Matá-lo seria assassinato.")),
		tesouro("Transmissor Simples (sinalizador)", `${T20I}/itens/gerais/instrumentos-de-oficio.webp`,
			p("Ofício (engenhoqueiro) CD 20, um dia de trabalho e T$ 100: um transmissor para esconder numa isca. Alternativa: uma isca qualquer e a magia <i>Localização</i>. Veja a macro <i>Isca para os Dragões</i>.")),
		tesouro("Ferramentas Cirúrgicas de Khenzarr", ICO.maleta,
			p("Bisturis, serras, grampos e fios para costurar tecido vivo, ainda sujos de sangue.", "<b>Prova.</b>")),
		tesouro("Corpo de um Dragão do Esgoto", ICO.mordida,
			p("O cadáver de um predador-terror. Serve como prova e como demonstração de amizade a Athisza.", "<b>Prova.</b>")),
		tesouro("Depoimento do Povo dos Túneis", ICO.livro,
			p("O relato do Povo dos Túneis ou de Athisza sobre o laboratório, Khenzarr, Torgo e o homem de casaco longo.", "<b>Prova.</b> Também servem: a visita de um oficial da Guarda ao laboratório e o depoimento de um morador da Baixa Vila de Lena que viu os dragões e confirma que os ataques pararam."))
	];
	const itensCriados = await Item.createDocuments(novosItens);
	const itemPorNome = (inicio) => itensCriados.find((i) => i.name.startsWith(inicio));

	/* ------------------------------------------------------------------ */
	/* 4. Tabela                                                            */
	/* ------------------------------------------------------------------ */
	const tabIsca = await RollTable.create({
		name: "Isca para os Dragões",
		img: ICO.mordida,
		folder: pasta.RollTable,
		flags: FLAGS(),
		formula: "1d6",
		replacement: true,
		displayRoll: true,
		description: "Role uma vez por dia com a isca no lugar. Se o teste para posicionar a isca deu 30 ou mais, some 1.",
		results: [
			{ type: "text", range: [1, 2], weight: 2, name: "Outra criatura levou a isca", description: "Recomecem do zero." },
			{ type: "text", range: [3, 4], weight: 2, name: "Nada acontece", description: "Esperem mais um dia." },
			{ type: "text", range: [5, 6], weight: 2, name: "Um dragão mordeu a isca", description: "Está voltando para o esconderijo: rastreiem (Sobrevivência CD 20, 3 sucessos)." }
		]
	});

	/* ------------------------------------------------------------------ */
	/* 5. Macros                                                            */
	/* ------------------------------------------------------------------ */

	async function macroEsgoto() {
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Esgoto de Valkaria" },
			content: `<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="entrar">Entrar no esgoto (fedor)</option>
					<option value="lenco">Entrar com lenço no nariz</option>
					<option value="sair">Sair (1 hora depois, o fedor passa)</option>
					<option value="infeccao">Fim do dia: Fortitude contra infecção</option></select></div>
				<p style="font-size:0.85em">Selecione os personagens.</p>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		if (!tokens.length) return ui.notifications.warn("Selecione os personagens.");
		const ehFedor = (e) => e.getFlag("world", "fdtFedor");
		const linhas = [];
		const rolls = [];
		for (const t of tokens) {
			const a = t.actor;
			const faro = (a.system.attributes?.sentidos?.value ?? []).includes("faro");
			if (res.acao === "infeccao") {
				const pv = a.system.attributes.pv;
				const ferido = pv.value < pv.max;
				const r = await new Roll(`1d20 + ${Number(a.system.pericias?.fort?.value) || 0}${ferido ? " - 5" : ""}`).evaluate();
				rolls.push(r);
				linhas.push(`${t.name}: Fortitude ${r.total}${ferido ? " (ferido, –5)" : ""} contra CD 15: ${r.total >= 15 ? "escapou." : "<b>contraiu infecção do esgoto</b> (Tormenta20, p. 318)."}`);
				continue;
			}
			const velhos = a.effects.filter(ehFedor);
			if (velhos.length) await a.deleteEmbeddedDocuments("ActiveEffect", velhos.map((e) => e.id));
			if (res.acao === "sair") {
				if (a.statuses?.has("alquebrado")) await a.toggleStatusEffect("alquebrado", { active: false });
				linhas.push(`${t.name}: sem fedor.`);
				continue;
			}
			const lenco = res.acao === "lenco";
			await a.createEmbeddedDocuments("ActiveEffect", [{
				name: lenco ? "Fedor do esgoto com lenço (–1)" : "Fedor do esgoto (–2)",
				img: "systems/tormenta20/icons/poderes/ameacas/fumos-toxicos.webp",
				type: "base",
				flags: { world: { fdtFedor: true } },
				system: { changes: [{ key: "system.pericias.*.bonus", value: lenco ? "-1" : "-2", type: "add", phase: "initial", priority: null }] }
			}]);
			if (faro && !lenco && !a.statuses?.has("alquebrado")) await a.toggleStatusEffect("alquebrado", { active: true });
			linhas.push(`${t.name}: ${lenco ? "–1" : "–2"} em perícias${faro && !lenco ? " e <b>alquebrado</b> (faro)" : ""}.`);
		}
		ChatMessage.create({ content: `<h3>Esgoto de Valkaria</h3><ul>${linhas.map((l) => `<li>${l}</li>`).join("")}</ul>`, rolls });
	}

	async function macroEstendido() {
		const CHAVE = "fdtEstendidoEsgoto";
		const TESTES = {
			rastro: { nome: "Achar um rastro no esgoto", cd: 20, meta: 7, falhas: 0, custo: ["1d6", "1"], pericias: ["mist", "reli", "inve", "sobr"] },
			barba: { nome: "Caçar com Barba de Rato", cd: 20, meta: 5, falhas: 0, custo: ["1d6", "1"], pericias: ["sobr", "pilo"] },
			mapear: { nome: "Mapear os túneis (um dia cada)", cd: 30, meta: 7, falhas: 3, custo: ["2d6", "1d4"], pericias: ["guer", "sobr", "inve", "conh"] },
			isca: { nome: "Rastrear a isca", cd: 20, meta: 3, falhas: 3, custo: ["1d6", "1"], pericias: ["sobr"] },
			terapia: { nome: "Terapia no Povo dos Túneis", cd: 25, meta: 5, falhas: 3, custo: null, pericias: ["cura"] },
			fechadura: { nome: "Arrombar a fechadura do laboratório", cd: 25, meta: 3, falhas: 3, custo: null, pericias: ["ladi"] }
		};
		const NOMES = { mist: "Misticismo", reli: "Religião", inve: "Investigação", sobr: "Sobrevivência", pilo: "Pilotagem", guer: "Guerra", conh: "Conhecimento", cura: "Cura", ladi: "Ladinagem" };
		const e = foundry.utils.mergeObject({ teste: "", sucessos: 0, falhas: 0, repetiu: false, diasFora: 0 }, game.user.getFlag("world", CHAVE) ?? {}, { inplace: false });
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Testes Estendidos do Esgoto" },
			content: `<p>${e.teste ? `${TESTES[e.teste]?.nome}: <b>${e.sucessos}/${TESTES[e.teste]?.meta}</b> sucessos, ${e.falhas} falhas.` : "Nenhum teste em andamento."}</p>
				<div class="form-group"><label>Teste</label><select name="teste">${Object.entries(TESTES).map(([k, t]) => `<option value="${k}" ${k === e.teste ? "selected" : ""}>${t.nome} (CD ${t.cd}, ${t.meta})</option>`).join("")}</select></div>
				<div class="form-group"><label>Perícia</label><select name="pericia">${Object.entries(NOMES).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></div>
				<div class="form-group"><label>Bônus de ajuda</label><input type="number" name="ajuda" value="0"></div>
				<div class="form-group"><label>Dias sem mapear (penalidade 1d4, 1d6...)</label><input type="number" name="dias" value="${e.diasFora}"></div>
				<div class="form-group"><label>Repetir a última falha (Barba de Rato, uma vez)</label><input type="checkbox" name="repetir"></div>
				<div class="form-group"><label>Recomeçar</label><input type="checkbox" name="zerar"></div>
				<p style="font-size:0.85em">Selecione quem testa. As perdas de PV e PM por falha vão para todos os selecionados.</p>`,
			ok: { label: "Testar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.zerar) {
			await game.user.unsetFlag("world", CHAVE);
			return ui.notifications.info("Teste estendido recomeçado.");
		}
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		if (!tokens.length) return ui.notifications.warn("Selecione quem faz o teste.");
		const k = res.teste in TESTES ? res.teste : "rastro";
		const t = TESTES[k];
		if (e.teste !== k) Object.assign(e, { teste: k, sucessos: 0, falhas: 0, repetiu: false });
		const repetir = !!res.repetir && k === "barba" && !e.repetiu && e.falhas > 0;
		if (repetir) { e.repetiu = true; e.falhas -= 1; }
		const pericia = t.pericias.includes(res.pericia) ? res.pericia : t.pericias[0];
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r; };
		const a = tokens[0].actor;
		const dias = k === "mapear" ? Math.max(0, Number(res.dias) || 0) : 0;
		const dado = dias ? ["d4", "d6", "d8", "d10", "d12"][Math.min(4, dias - 1)] : "";
		const r = await rolar(`1d20 + ${Number(a.system.pericias?.[pericia]?.value) || 0} + ${Number(res.ajuda) || 0}${dado ? ` - 1${dado}` : ""}`);
		const ok = r.total >= t.cd;
		let html = `<h3>${t.nome}</h3><p>${tokens[0].name}: ${NOMES[pericia]} <b>${r.total}</b> contra CD ${t.cd}${dado ? ` (–1${dado} por ${dias} dia(s) fora)` : ""}${repetir ? " (rolagem repetida com a ajuda de Barba de Rato)" : ""}. ${ok ? "Sucesso." : "Falha."}</p>`;
		if (ok) e.sucessos += 1;
		else {
			e.falhas += 1;
			if (t.custo) {
				html += "<ul>";
				for (const tk of tokens) {
					const pv = await rolar(t.custo[0]);
					const pm = await rolar(t.custo[1]);
					const at = tk.actor.system.attributes;
					await tk.actor.update({ "system.attributes.pv.value": at.pv.value - pv.total, "system.attributes.pm.value": Math.max(0, (Number(at.pm?.value) || 0) - pm.total) });
					html += `<li>${tk.name}: –${pv.total} PV, –${pm.total} PM${k === "mapear" ? " (só voltam com descanso fora do esgoto)" : ""}.</li>`;
				}
				html += "</ul>";
			}
			if (k === "mapear" && e.falhas === 2) html += "<p><b>Segunda falha:</b> um <b>enxame de dragões do esgoto</b> ataca!</p>";
			if (k === "fechadura" && e.falhas >= 3) html += "<p>A fechadura <b>emperrou</b>: só resta quebrar a porta.</p>";
			if (k === "terapia" && e.falhas >= 3) html += "<p>Falha total: <b>danos psicológicos irreversíveis</b> no paciente.</p>";
		}
		if (k === "mapear") e.diasFora = 0;
		const venceu = e.sucessos >= t.meta;
		const perdeu = t.falhas && e.falhas >= t.falhas;
		html += `<p>${t.nome}: <b>${e.sucessos}/${t.meta}</b> sucessos, ${e.falhas} falha(s)${t.falhas ? ` de ${t.falhas}` : " (sem falha total)"}.</p>`;
		if (venceu) html += "<p><b>Concluído!</b></p>";
		else if (perdeu) html += `<p><b>Falha total.</b>${k === "mapear" ? " É impossível mapear o esgoto desse jeito." : k === "isca" ? " O sinal da isca se perdeu." : ""}</p>`;
		if (venceu || perdeu) await game.user.unsetFlag("world", CHAVE);
		else await game.user.setFlag("world", CHAVE, e);
		ChatMessage.create({ content: html, rolls });
	}

	async function macroIsca() {
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Isca para os Dragões" },
			content: `<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="posicionar">Posicionar a isca (Sobrevivência CD 25)</option>
					<option value="dia">Passar um dia esperando (1d6)</option></select></div>
				<div class="form-group"><label>Poder relacionado a armadilhas (+2)</label><input type="checkbox" name="armadilha"></div>
				<div class="form-group"><label>O posicionamento deu 30 ou mais (+1 no d6)</label><input type="checkbox" name="bom"></div>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "posicionar") {
			const a = canvas.tokens.controlled[0]?.actor;
			if (!a) return ui.notifications.warn("Selecione quem posiciona a isca.");
			const sobr = Number(a.system.pericias?.sobr?.value) || 0;
			const r = await new Roll(`1d20 + ${sobr}${res.armadilha ? " + 2" : ""}`).evaluate();
			return ChatMessage.create({
				content: `<h3>Isca para os Dragões</h3><p>Posicionar: <b>${r.total}</b> contra CD 25.</p><p style="font-size:0.85em">${r.total >= 30 ? "30 ou mais: +1 nos d6 diários. " : ""}${r.total >= 25 ? "Bem posicionada." : "Sem saber, foi mal posicionada: nas próximas 24 horas outra criatura leva a isca."}</p>`,
				rolls: [r],
				whisper: ChatMessage.getWhisperRecipients("GM")
			});
		}
		const tab = game.tables.find((t) => t.getFlag("world", "fdt") === "a2av5" && t.name.startsWith("Isca"));
		const d = await new Roll(`1d6${res.bom ? " + 1" : ""}`).evaluate();
		const v = Math.min(6, d.total);
		const r = tab?.results.find((x) => v >= x.range[0] && v <= x.range[1]);
		ChatMessage.create({ content: `<h3>Isca para os Dragões</h3><p>${d.total}: <b>${r?.name ?? (v <= 2 ? "Outra criatura levou a isca" : v <= 4 ? "Nada acontece" : "Um dragão mordeu a isca")}</b>. ${r?.description ?? ""}</p>`, rolls: [d] });
	}

	async function macroSeguir() {
		const CHAVE = "fdtSeguirDragao";
		const e = foundry.utils.mergeObject({ testes: 0, perdidos: 0 }, game.user.getFlag("world", CHAVE) ?? {}, { inplace: false });
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Seguir um Dragão do Esgoto" },
			content: `<p>Teste ${e.testes + 1} de 3 · perdidos: ${e.perdidos}</p>
				<div class="form-group"><label>Perícia</label><select name="pericia"><option value="furt">Furtividade</option><option value="sobr">Sobrevivência</option></select></div>
				<div class="form-group"><label>Recomeçar</label><input type="checkbox" name="zerar"></div>
				<p style="font-size:0.85em">Só um personagem segue o dragão (selecione-o). O dragão tem Percepção +7, +5 por conhecer os túneis.</p>`,
			ok: { label: "Seguir", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.zerar) {
			await game.user.unsetFlag("world", CHAVE);
			return ui.notifications.info("Perseguição recomeçada.");
		}
		const tk = canvas.tokens.controlled[0];
		if (!tk?.actor) return ui.notifications.warn("Selecione quem segue o dragão.");
		const k = res.pericia === "sobr" ? "sobr" : "furt";
		const r = await new Roll(`1d20 + ${Number(tk.actor.system.pericias?.[k]?.value) || 0}`).evaluate();
		const d = await new Roll("1d20 + 12").evaluate();
		e.testes += 1;
		const venceu = r.total > d.total;
		if (!venceu) e.perdidos += 1;
		let html = `<h3>Seguir um Dragão · teste ${e.testes}</h3><p>${tk.name}: ${k === "furt" ? "Furtividade" : "Sobrevivência"} <b>${r.total}</b> contra Percepção do dragão <b>${d.total}</b>. ${venceu ? "Continua na cola." : "Perdeu o rastro neste trecho."}</p>`;
		const fim = e.testes >= 3 || e.perdidos >= 2;
		if (fim) {
			if (e.perdidos === 0) html += "<p><b>Chegou ao laboratório sem ser notado!</b> Pode chamar os outros ou voltar e trazê-los com calma.</p>";
			else if (e.perdidos === 1) html += "<p>Perdeu o rastro do dragão. Tentem de novo com outro.</p>";
			else html += "<p><b>Emboscada!</b> Um enxame de dragões do esgoto ataca.</p>";
			await game.user.unsetFlag("world", CHAVE);
		} else await game.user.setFlag("world", CHAVE, e);
		ChatMessage.create({ content: html, rolls: [r, d] });
	}

	async function macroBarulho() {
		const CHAVE = "fdtBarulhoTuneis";
		const e = foundry.utils.mergeObject({ dias: 0, sucessos: 0 }, game.user.getFlag("world", CHAVE) ?? {}, { inplace: false });
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Barulho nos Túneis" },
			content: `<p>Dia ${e.dias} da semana · sucessos <b>${e.sucessos}/3</b></p>
				<div class="form-group"><label>Aliados iniciantes (1 cada)</label><input type="number" name="ini" value="0"></div>
				<div class="form-group"><label>Aliados veteranos (2 cada)</label><input type="number" name="vet" value="0"></div>
				<div class="form-group"><label>Aliados mestres (5 cada)</label><input type="number" name="mes" value="0"></div>
				<div class="form-group"><label>Soma dos ND dos combates do dia</label><input type="number" name="nd" value="0"></div>
				<div class="form-group"><label>Ideias chamativas (2 ou 5 cada, já somadas)</label><input type="number" name="ideias" value="0"></div>
				<div class="form-group"><label>Recomeçar a semana</label><input type="checkbox" name="zerar"></div>`,
			ok: { label: "Fim do dia", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.zerar) {
			await game.user.unsetFlag("world", CHAVE);
			return ui.notifications.info("Semana de barulho recomeçada.");
		}
		const n = (k) => Math.max(0, Number(res[k]) || 0);
		const pontos = n("ini") + 2 * n("vet") + 5 * n("mes") + n("nd") + n("ideias");
		const d = await new Roll("1d100").evaluate();
		e.dias += 1;
		const ok = d.total <= pontos;
		if (ok) e.sucessos += 1;
		let html = `<h3>Barulho nos Túneis · dia ${e.dias}</h3><p>Pontuação do dia <b>${pontos}</b>; 1d100 = ${d.total}. ${ok ? "Khenzarr notou o barulho!" : "Ninguém notou."}</p><p>Sucessos: <b>${e.sucessos}/3</b> na semana.</p>`;
		if (e.sucessos >= 3) html += "<p><b>Khenzarr acha que o Reinado está vasculhando os túneis e abandona o esconderijo!</b></p>";
		else if (e.dias >= 7) html += "<p>A semana acabou sem convencer Khenzarr.</p>";
		if (e.sucessos >= 3 || e.dias >= 7) await game.user.unsetFlag("world", CHAVE);
		else await game.user.setFlag("world", CHAVE, e);
		ChatMessage.create({ content: html, rolls: [d] });
	}

	async function macroPorta() {
		const CHAVE = "fdtPortaLaboratorio";
		const feitos = Number(game.user.getFlag("world", CHAVE)) || 0;
		const tokens = canvas.tokens.controlled.filter((t) => t.actor).slice(0, 2);
		if (!tokens.length) return ui.notifications.warn("Selecione quem força a porta (e até um ajudante).");
		const [forca, ajuda] = tokens;
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r; };
		let bonus = 0;
		let html = "<h3>Porta do Laboratório</h3>";
		if (ajuda) {
			const h = await rolar(`1d20 + ${Number(ajuda.actor.system.atributos?.for?.value) || 0}`);
			bonus = h.total >= 10 ? 2 : 0;
			html += `<p>${ajuda.name} ajuda: ${h.total} ${bonus ? "(+2)" : "(sem bônus)"}.</p>`;
		}
		const r = await rolar(`1d20 + ${Number(forca.actor.system.atributos?.for?.value) || 0} + ${bonus}`);
		const ok = r.total >= 20;
		html += `<p>${forca.name}: Força <b>${r.total}</b> contra CD 20. ${ok ? "A porta cede um pouco." : "Falhou!"}</p>`;
		if (!ok) {
			html += "<ul>";
			for (const t of tokens) {
				const d = await rolar("1d6");
				const dano = await new Roll(`${d.total}[impacto]`).evaluate();
				try { await t.actor.applyDamageV2(dano, 1); } catch (err) { console.warn(err); }
				html += `<li>${t.name}: ${d.total} de impacto.</li>`;
			}
			html += "</ul>";
		}
		const total = feitos + (ok ? 1 : 0);
		html += `<p>Sucessos: <b>${total}/3</b>.${total >= 3 ? " <b>A porta foi arrombada!</b> Os dragões no salão correm para avisar Khenzarr." : ""}</p>`;
		if (total >= 3) await game.user.unsetFlag("world", CHAVE);
		else await game.user.setFlag("world", CHAVE, total);
		ChatMessage.create({ content: html, rolls });
	}

	async function macroInvisiveis() {
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Dragões Invisíveis" },
			content: `<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="sumir">Dragões selecionados ficam invisíveis</option>
					<option value="aparecer">Dragões selecionados ficam visíveis</option>
					<option value="ver1">Personagem selecionado enxerga um dragão (movimento, 1 PM)</option>
					<option value="ver2">Personagem selecionado enxerga um enxame (movimento, 2 PM)</option></select></div>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		if (!tokens.length) return ui.notifications.warn("Selecione os tokens.");
		const linhas = [];
		for (const t of tokens) {
			const a = t.actor;
			if (res.acao === "sumir" || res.acao === "aparecer") {
				const fx = a.effects.find((e) => e.statuses?.has("invisivel") && e.name.startsWith("Invisível"));
				if (fx) await fx.update({ disabled: res.acao === "aparecer" });
				else if (a.statuses?.has("invisivel") !== (res.acao === "sumir")) await a.toggleStatusEffect("invisivel", { active: res.acao === "sumir" });
				linhas.push(`${t.name}: ${res.acao === "sumir" ? "invisível" : "visível"}.`);
			} else {
				const custo = res.acao === "ver2" ? 2 : 1;
				const pm = Number(a.system.attributes?.pm?.value) || 0;
				if (pm < custo) { linhas.push(`${t.name}: sem PM suficientes.`); continue; }
				await a.update({ "system.attributes.pm.value": pm - custo });
				linhas.push(`${t.name} gasta uma ação de movimento e ${custo} PM: ignora a invisibilidade até o início do próximo turno.`);
			}
		}
		ChatMessage.create({ content: `<h3>Dragões Invisíveis</h3><ul>${linhas.map((l) => `<li>${l}</li>`).join("")}</ul>` });
	}

	const macro = (name, img, fn) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Arco 2 · Aventura 5 · gerado por a2-av5-tuneis-famintos.js\n(${fn.toString()})();`
	});
	const macros = await Macro.createDocuments([
		macro("Av5 · Esgoto (fedor e infecção)", `${PA}/fumos-toxicos.webp`, macroEsgoto),
		macro("Av5 · Testes Estendidos do Esgoto", `${PA}/visao-ampla.webp`, macroEstendido),
		macro("Av5 · Isca para os Dragões", ICO.mordida, macroIsca),
		macro("Av5 · Seguir um Dragão", `${T20I}/magias/localizacao.webp`, macroSeguir),
		macro("Av5 · Barulho nos Túneis", `${PA}/gritador.webp`, macroBarulho),
		macro("Av5 · Porta do Laboratório", `${PA}/quebrar-tudo.webp`, macroPorta),
		macro("Av5 · Dragões Invisíveis", ICO.invisivel, macroInvisiveis)
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
		name: "Arco 2 · Aventura 5 · Túneis Famintos",
		folder: pasta.JournalEntry,
		flags: FLAGS(),
		pages: [
			pagina("Guia do Mestre", `
				<blockquote><p><i>\"Estou sendo acusado de atos inomináveis. Sou inocente, mas cada vez mais pessoas estão convencidas de minha culpa [...]\"</i> Vladmir Mors, na Mansão do Sono e Suplício, na Baixa Vila de Lena. <i>PS: venham depois do pôr do sol.</i></p></blockquote>
				<h2>Resumo</h2>
				<p>Nível 9. Pessoas somem à noite na Baixa Vila de Lena e o vampiro ${L(atores.vladmir)} é o bode expiatório. Os culpados são os <b>dragões do esgoto</b>, lagartos-terror invisíveis criados pelo biomante finntroll ${L(atores.khenzarr)}, discípulo de Ghorskander, para caçar o <b>Povo dos Túneis</b>: suas primeiras criações, costuradas com pedaços de cadáveres, que fugiram do laboratório. As mortes na superfície são danos colaterais.</p>
				<h2>Fases</h2>
				${lista([
					"<b>Fase 0 · Normalidade:</b> se for no fim do arco, a Dra. Zymni mostra uma autópsia estranha, ligada a algo que o grupo deixou passar. Tudo da tripulação da Roca segue dois caminhos: controle mental em massa e criação de matéria viva.",
					"<b>Fase 1 · Rumo à Baixa Vila de Lena:</b> à noite; role uma vez em Encontros em Valkaria.",
					`<b>Fase 2 · A Mansão do Sono e Suplício:</b> Vladmir, ${L(atores.fido)} e as crianças da noite. Todos os lugares ficam perto de bueiros (Investigação CD 15, ou de graça).`,
					`<b>Fase 3 · No Esgoto:</b> o rastro e os dois caminhos: ${L(atores.barba)} (o \"fantasma\") ou ${L(atores.athisza)} e o Povo dos Túneis (a \"criatura\").`,
					"<b>Fase 4 · O Laboratório Secreto:</b> um plano para achar o covil e o combate com Khenzarr.",
					"<b>Fase 5 · Desfecho.</b>"
				])}
				<p>${leiOrdem ? `Lei &amp; Ordem: ${L(leiOrdem)}.` : "Lei &amp; Ordem fica no ator da Aventura 0 (importe o Ato 2 do módulo)."}</p>`, 100),
			pagina("A Mansão do Sono e Suplício", `
				<p>A Baixa Vila de Lena à noite é uma taverna a céu aberto: gente fantasiada, bardos nas esquinas, trupes nas praças. A mansão é enorme, elegante e lúgubre; jovens pálidos de preto olham o grupo com desconfiança. Lá dentro, Vladmir bebe do pulso de uma garota voluntária.</p>
				<h3>Informações de Vladmir</h3>
				${lista([
					"Está em Valkaria há séculos (exagera dizendo que é de antes da fundação). Viu tudo desde a chegada de Talude, sempre com perspectiva lúgubre.",
					"A última pessoa que matou foi uma jovem, em 1309. O título de marquês não significa mais nada.",
					"Fido é um lobisomem: Vladmir o acorrenta na lua cheia e tem certeza de que ele não é o culpado.",
					"Entre dez e vinte desaparecimentos, à noite. Às vezes acham roupas, sangue ou pedaços; às vezes nada.",
					"Nenhuma vítima apareceu sem sangue. As pessoas preferem se sentir seguras a estar seguras.",
					"Não conhece as vítimas. Nas noites dos crimes, fazia o mesmo que agora. Nada aponta para ele além de ser vampiro."
				])}
				<h3>Informações de Fido</h3>
				${lista([
					"Foge do grupo até Vladmir tranquilizá-lo; tinha medo de ser o culpado, mas houve mortes em noites em que estava sob vigilância.",
					"Lista vários lugares onde acharam restos: todos perto de bueiros.",
					"Viu um \"fantasma\" translúcido arrastar um rapaz para as sombras. No dia seguinte, acharam os restos."
				])}
				<h3>Informações das crianças da noite</h3>
				${lista([
					"Confirmam tudo. Ninguém está sob controle mental. Fido seria incapaz de esconder um crime.",
					"Discordam de Fido: o culpado é uma criatura feita de partes (humano, elfo, goblin, anão...). Um deles a viu perto de onde acharam restos; ela fugiu.",
					"Com qualquer incentivo, notam que sempre há um bueiro por perto."
				])}
				<h3>Contingência: moralismo excessivo</h3>
				<p>Se alguém se recusar a defender um vampiro: abra o jogo (Vladmir não é maligno, ninguém está sendo enganado) ou embarque: a Xerife Mathilda não gosta, Vladmir reclama de discriminação na Guarita da Praia, e a <b>Guarita Noturna</b> do ${L(atores.dallmirann)} acha que ele é culpado. ${L(itemPorNome("Pergaminho de Cidadania"))}.</p>
				<p><b>Vampiro vegetariano:</b> para um Vladmir mais \"perigoso\", ele pode fazer teatro sobre a fome, perder o documento, ter doadores menos voluntários, ou transformar um ou dois jovens por geração (o limite recomendado).</p>`, 200),
			pagina("No Esgoto", `
				<p>Escuridão total, paredes cilíndricas, água imunda correndo e um fedor pior que qualquer magia.</p>
				${lista([
					`<b>Fedor:</b> –2 em perícias; com faro, também alquebrado. Lenço: –1 e sem alquebrado. ${L(itemPorNome("Fedor"))}; ${L(itemPorNome("Lenço"))}.`,
					`<b>Infecção:</b> Fortitude CD 15 no fim do dia (–5 se ferido). ${L(itemPorNome("Infecção"))}.`,
					`<b>Achar o rastro:</b> teste estendido CD 20, 7 sucessos, sem falha total; cada falha custa 1d6 PV e 1 PM. Misticismo ou Religião para o \"fantasma\" (emanações arcanas); Investigação ou Sobrevivência para a \"criatura\" (sangue, retalho, fios de costurar tecido vivo).`
				])}
				<p>Macros: ${linkMacro("Esgoto (")} e ${linkMacro("Estendidos")}.</p>
				<h3>Caminho 1 · Em busca do fantasma</h3>
				<p>Um túnel largo com correnteza forte e uma jangada de restos: \"Ahoy! Este é o território de Barba de Rato, o pirata do esgoto!\" Sem hostilidade, ele dá carona.</p>
				${lista([
					"Viu \"coisas\" translúcidas, do tamanho de goblins, correndo em grupo; só se notam pela água. Não são fantasmas: são materiais e invisíveis.",
					"Viu uma arrastando um cadáver: os \"fantasmas\" são os assassinos (Fido tinha razão!).",
					"Sabe do Povo dos Túneis (corpos costurados) e achou vários mortos por garras e presas. Acha que são o alvo de verdade.",
					"Caçar os \"fantasmas\" ou achar o Povo: Sobrevivência CD 20, 5 sucessos, sem falha total, 1d6 PV e 1 PM por falha. Com ele, vale Pilotagem e o grupo repete uma rolagem."
				])}
				<h3>Caminho 2 · Em busca da criatura</h3>
				<p>O rastro é desesperado e fácil. Uma sereia sem olhos barra a passagem: \"Vieram a mando do mago ou do povo da superfície? [...] Mesmo que eu precise entregar minha vida, eles não serão pegos hoje!\"</p>
				<h3>Demonstrações de amizade (para Athisza)</h3>
				${lista([
					"Mostrar que um ou mais heróis são de raças \"monstruosas\" (medusa, osteon...).",
					"Trazer Barba de Rato para confirmar as boas intenções.",
					"Aceitar ser desarmados, amarrados e vendados.",
					"Entregar um membro do grupo como refém.",
					`Oferecer o corpo de um dragão do esgoto (${L(itemPorNome("Corpo"))}).`,
					"Qualquer coisa que deixe os heróis vulneráveis, ou mostre que também são ameaçados pelos predadores."
				])}`, 300),
			pagina("O Povo dos Túneis", `
				<p>Atrás de uma placa metálica, num salão escavado: menos de vinte pessoas costuradas com pedaços de várias raças, em estado deplorável. Quem é treinado em Cura percebe que não deveriam estar vivos. Ao ver forasteiros, acham que vão morrer; só dois erguem os punhos, fracos. ${L(atores.ellan)} e ${L(atores.gaus)} falam pelo grupo. Não oferecem comida: não podem desperdiçar nada.</p>
				<h3>A história</h3>
				${lista([
					"Memórias contraditórias de antes (Doherimm e Tauron, floresta e deserto). Os nomes juntam sílabas de várias raças. A lembrança nítida começa na mesa de cirurgia de Khenzarr.",
					"Jaulas, recém-chegados sempre acolhidos, cada um mais \"funcional\" que o anterior. Cirurgias exploratórias (Cura ou Conhecimento percebe). Visitas do \"homem de metal\", Torgo.",
					"Uma visita de um homem alto e magro, de casaco longo e dedos compridos demais (Ghorskander): <i>\"Comece a segunda leva de experimentos.\"</i>",
					"Guinchos, risadas, e eles viraram comida dos \"dragões\". Depois, de coisas invisíveis.",
					"Um deles abriu a fechadura com um graveto: o que os prendia era o condicionamento. Cerca de cinquenta fugiram; Athisza os achou. Restam menos de 5% das centenas originais.",
					"Subiram à superfície por desespero e levaram os dragões junto: a onda de assassinatos atribuída a Vladmir, de quem nunca ouviram falar."
				])}
				<p><b>Terapia:</b> Cura CD 25, 5 sucessos, com magias de conexão mental ou que removam condições mentais. Falha total: danos psicológicos irreversíveis.</p>
				<p><b>Coincidências demais?</b> Os NPCs só pedem ajuda quando as coisas chegam ao ponto culminante, e a incursão leva horas ou um dia inteiro.</p>`, 400),
			pagina("O Laboratório Secreto", `
				<p>O Povo dos Túneis lembra só de uma seção labiríntica e uma galeria ampla; Athisza orienta um pouco. Achar o laboratório exige um <b>plano</b>: um teste estendido pode fazer parte, mas o plano deve também consumir recursos, exigir uma boa ideia, contar com um NPC estratégico, usar poderes do grupo ou interagir com o ambiente (pelo menos três desses). Juntar três planos diferentes como \"sucessos\" também funciona.</p>
				<h3>Ideias</h3>
				${lista([
					`<b>Mapeamento:</b> Guerra ou Sobrevivência CD 30, 7 sucessos, um dia cada; outras perícias só uma vez. Falha: 2d6 PV e 1d4 PM (só voltam fora do esgoto); na 2ª falha, um ${L(atores.enxame)} ataca; 3 falhas encerram. Pesquisa na superfície (CD 15, um dia) dá bônus de ajuda; cada dia fora dá –1d4 (–1d6, –1d8...) no teste seguinte.`,
					`<b>Sinalizador:</b> ${L(itemPorNome("Transmissor"))} ou isca com <i>Localização</i>; posicionar com Sobrevivência ou Ofício (armadilheiro) CD 25; ${L(tabIsca)} por dia; rastrear (Sobrevivência CD 20, 3 sucessos). Macro ${linkMacro("Isca")}.`,
					`<b>Perseguição:</b> um só personagem segue um ${L(atores.dragao)}: três testes de Furtividade ou Sobrevivência contra Percepção +12. Perdeu um: perde o rastro; dois: emboscada de um enxame. Macro ${linkMacro("Seguir")}.`,
					"<b>Lábia:</b> Empatia Selvagem ou Acalmar Animal custam +1 PM; o dragão começa hostil, recebe +5 para resistir, –10 nos testes se subjugado; dois sucessos dele e fica enfurecido.",
					`<b>Ameaça:</b> fazer barulho por dias até Khenzarr achar que o Reinado está nos túneis: aliados (1/2/5), ND dos combates, ideias chamativas (2 ou 5); d100 ≤ pontuação, 3 sucessos numa semana. Macro ${linkMacro("Barulho")}.`,
					"<b>Barganha:</b> mensagem presa a um dragão capturado. Khenzarr quer conhecimento de modificação corporal (provado), a localização do Povo dos Túneis ou segredos de Ghorskander, como os cristais rosados.",
					"<b>Médicos Monstros:</b> se Vectora estiver atracada, podem entregar o cliente, com muita persuasão.",
					"<b>Valkarianos:</b> em Encontros em Valkaria, Wynstar, o Elemental da Poluição, Yolana, o Avatar da Cidade, Justine e Tilliann sabem algo."
				])}`, 500),
			pagina("O Covil de Khenzarr", `
				<p>Uma grade, uma seção desativada, uma galeria alagada e um túnel isolado levam a uma porta circular de metal. Khenzarr não vigia: é arrogante demais.</p>
				${lista([
					`<b>Quebrar a porta:</b> três testes de Força CD 20; cada falha causa 1d6 de impacto (em quem força e em quem ajuda). Macro ${linkMacro("Porta")}.`,
					`<b>Arrombar:</b> Ladinagem CD 25, 3 sucessos (um ajudante); falha total emperra a fechadura (${linkMacro("Estendidos")}).`
				])}
				<p>O salão de pedra, cheio de ossadas, tem alguns dragões treinados para avisar o finntroll. Dali saem a caverna das jaulas (agora dos dragões), a sala de cirurgias e os aposentos. Khenzarr está na sala de cirurgias, com as mãos sujas de sangue até os antebraços, operando um dragão acordado e preso por tiras de metal:</p>
				<blockquote><p><i>\"Após todos esses anos, achei que nunca encontraria aventureiros na superfície. Dizem que pessoas como vocês caçam pessoas como eu... Mas estou há muito tempo convivendo em sua sociedade e fui muito bem tratado. Ninguém pede a ajuda de heróis enquanto está sendo pago.\"</i></p></blockquote>
				<p><b>Criaturas:</b> ${L(atores.khenzarr)} e um ${L(atores.alfa)}. Use ${linkMacro("Invisíveis")}. Khenzarr responde tudo durante a luta, inclusive sobre Ghorskander, e continua falando se for preso: morrer para os heróis é como levar um raio.</p>`, 600),
			pagina("Desfecho, Provas e Pagamento", `
				<p>Com Khenzarr derrotado, o problema está resolvido: os dragões que sobrarem não se reproduzem e viram missão para outros aventureiros. O Povo dos Túneis pode ser adotado por Vladmir, Athisza pode ser acolhida na superfície e a Baixa Vila de Lena pode aceitar melhor os \"esquisitos macabros\".</p>
				<h3>Provas</h3>
				${lista([
					`${L(itemPorNome("Corpo"))}.`,
					`${L(itemPorNome("Depoimento"))}.`,
					`${L(itemPorNome("Ferramentas"))}.`,
					"A visita de um oficial da Guarda à área do laboratório.",
					"O depoimento de um morador da Baixa Vila de Lena que viu os dragões e confirma que os ataques pararam."
				])}
				<h3>Pagamento</h3>
				<p>Se Khenzarr for derrotado e os culpados revelados, Vladmir paga: níveis 8 ou 9, <b>T$ 12.000</b>; nível 10, <b>T$ 24.000</b>; nível 11, <b>T$ 32.000</b>.</p>
				<h3>Mesa original: capa de couro de dragão do esgoto</h3>
				<p>${L(itemPorNome("Capa"))} e ${L(itemPorNome("Couro"))}.</p>`, 700)
		]
	});

	ui.notifications.info("Fim dos Tempos · Arco 2 · Aventura 5 (Túneis Famintos): conteúdo criado.");
})();
