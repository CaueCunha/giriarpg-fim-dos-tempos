/* =====================================================================
 * FIM DOS TEMPOS · AVENTURA 3 · "CULTISTAS PURISTAS DEVEM MORRER"
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Av3 · Cultistas Puristas" com:
 *      - Ameaças: Lorelei Wulff, Soldado de Lorelei, Guarda de Dornbach, Aldeão de Dornbach,
 *        Zagar ("Hermann"), Máquina de Purificação e o ator de apoio "Aldeia de Dornbach".
 *      - Itens: Lampião Mecanomágico, Poções de Sono de Marwen, Panfleto Purista.
 *      - Diário com guia do mestre, missão do quadro, Dahllan Daninhas, construções,
 *        linha de tempo, ritual e desfecho.
 *      - Tabela "Demais Habitantes de Dornbach" (1d8).
 *      - Macros: Demais Habitantes, Ritual de Purificação, Infiltração em Dornbach,
 *        Lampião Mecanomágico e Montar cenas dos mapas (cria as cenas com as imagens do módulo).
 *   3. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "av3".
 *
 * Feito a partir do código do sistema (master, out/2026); não foi testado num Foundry rodando.
 * Veja o guia av3-cultistas-puristas.md.
 * ===================================================================== */
(async () => {
	// Testes dos PJs: a macro pede, o jogador rola pelo card no chat (módulo; sem ele, a macro rola).
	const FDT_TESTE = 'const fdtApi = game.modules.get("giriarpg-fim-dos-tempos")?.api;\nif (!fdtApi?.testes) throw new Error("Fim dos Tempos: ative o módulo T20 Giria - Fim dos Tempos (Campanha) para usar esta macro.");\nconst fdtTestes = (lista) => fdtApi.testes.lista(lista);\nconst fdtTeste = async (ator, pericia, o = {}) => (await fdtTestes([{ ...o, ator, pericia }]))[0];\nconst fdtAplicar = fdtApi.testes.coletor();\nconst fdtEnviar = (dados) => fdtAplicar.enviar(dados);\n';
	// Macros que pedem testes ou aplicam algo: o prefixo acima entra no comando, a macro roda dentro de um try/finally
	// (no fim, os botões que sobraram vão para o Mestre) e as mensagens dela levam os botões do Mestre (fdtEnviar).
	const usaFdt = (fn) => /fdtTestes?\(|fdtAplicar|fdtEnviar/.test(fn.toString());
	const codigo = (fn) => (usaFdt(fn) ? fn.toString().replace(/\bChatMessage\.create\(/g, "fdtEnviar(") : fn.toString());
	const chamar = (fn, chamada) => (usaFdt(fn) ? `try {\n\tawait ${chamada};\n} finally {\n\tawait fdtAplicar.fim();\n}` : `await ${chamada};`);
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "av3";
	const FLAGS = (role) => ({ world: role ? { fdt: TAG, fdtRole: role } : { fdt: TAG } });
	const T20I = "systems/tormenta20/icons";
	const ARTE = "modules/giriarpg-fim-dos-tempos/assets/arco1/av3-cultistas";

	/* ------------------------------------------------------------------ */
	/* 0. Limpeza do que foi gerado antes                                   */
	/* ------------------------------------------------------------------ */
	const isOurs = (d) => d.getFlag?.("world", "fdt") === TAG;
	const colecoes = [game.actors, game.items, game.journal, game.tables, game.macros];
	const antigos = colecoes.flatMap((c) => c.filter(isOurs));
	if (antigos.length) {
		const ok = await foundry.applications.api.DialogV2.confirm({
			window: { title: "Aventura 3: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para a Aventura 3.</p>
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
	/* 1. Construtores (mesmos da Av2)                                      */
	/* ------------------------------------------------------------------ */
	const NOME_PASTA = "FdT · Av3 · Cultistas Puristas";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#3a4a6b", flags: FLAGS() })).id;
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
			abilityUse: { types: o.types ?? [], names: o.names ?? [], automatic: false, aumenta: false, custo: o.custo ?? 0, description: "" }
		}
	});
	/** Botão de condição no card (o nome é resolvido para a condição do sistema). */
	const cond = (nome) => fx(nome, null);
	/** Bônus opcional marcado na janela de rolagem. */
	const aoUsar = (name, img, changes, types, names = []) =>
		fx(name, img, changes, { onuse: true, disabled: true, transfer: true, types, names });
	/** Efeito ligado/desligado na aba de efeitos do ator. */
	const chave = (name, img, changes, ligado = false, description = "") => fx(name, img, changes, { disabled: !ligado, description });

	const RESIST = ["Fortitude", "Reflexos", "Vontade"];

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

	/** Magia de NPC com valores fixos do livro. */
	const magia = (name, img, desc, o = {}) => ({
		name,
		type: "magia",
		img,
		flags: FLAGS(),
		effects: o.effects ?? [],
		system: { description: { value: desc }, tipo: o.tipoMagia ?? "div", circulo: o.circulo ?? 1, escola: o.escola ?? "evo", preparada: true, ...base(o) }
	});

	/** Arma de NPC: usa a perícia do NPC (que já tem o bônus do livro) + ajuste. */
	/** Efeito de Uso que mora na própria arma: o T20 só o oferece ao atacar com ela se o tipo for "self" ("attack" vale para as OUTRAS armas do ator). */
	const daArma = (effects) => effects.map((e) => (e.system?.onuse ? { ...e, system: { ...e.system, abilityUse: { ...e.system.abilityUse, types: ["self"] } } } : e));
	const arma = (name, img, { pericia = "luta", atributo = "for", proposito = "corpo-a-corpo", ajuste = 0, dano, tipo, extra = [], critM = 20, critX = 2, alcance = "", desc = "", effects = [] }) => ({
		name,
		type: "arma",
		img,
		flags: FLAGS(),
		effects: daArma(effects),
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

	const ATR_PERICIA = { luta: "for", atle: "for", pont: "des", inic: "des", refl: "des", furt: "des", acro: "des", fort: "con", perc: "sab", vont: "sab", intu: "sab", sobr: "sab", reli: "sab", atua: "car", enga: "car", dipl: "car", inti: "car", mist: "int", ofi0: "int", conh: "int" };

	/** Cria um NPC. pericias: { chave: valor final do livro }. Fórmula: meio nível + atributo + outros. */
	async function criarNPC(d) {
		const nivel = Number(d.nd) || 1;
		const meio = Math.floor(nivel / 2);
		const atr = d.atr;
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
				width: 1,
				height: 1,
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
				tracos: { tamanho: "med", ic: { value: d.ic ?? [], custom: d.icCustom ?? "" }, idiomas: { value: ["comum"] } }
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
		if (Object.keys(up).length) await actor.update(up);
		// statblockParsing evita que o sistema "limpe" a perícia do ataque das armas de NPC.
		if (d.items?.length) await actor.createEmbeddedDocuments("Item", d.items, { statblockParsing: true });
		return actor;
	}

	// Resistências especiais dos puristas: aprimoramentos marcados na rolagem de resistência.
	const resistenciasPuristas = () => [
		aoUsar("Resistência a magia divina (+5)", `${T20I}/magias/bencao.webp`, [["roll", 5]], ["skill"], RESIST),
		aoUsar("Resistência a Tormenta (+10)", "icons/magic/control/fear-fright-monster-purple-blue.webp", [["roll", 10]], ["skill"], RESIST)
	];
	const ajudantes = () => [
		chave("Ajudantes de Dornbach: dois (+5)", `${T20I}/ameacas/recruta-supremacista.png`,
			[["system.modificadores.ataque.geral", "5"], ["system.modificadores.dano.geral", "5"]], false,
			"Alternativa 2 do livro: uma dupla de aldeões ajuda este combatente. Desligue quando um ajudante for derrubado e ligue o de +2."),
		chave("Ajudantes de Dornbach: um (+2)", `${T20I}/ameacas/recruta-supremacista.png`,
			[["system.modificadores.ataque.geral", "2"], ["system.modificadores.dano.geral", "2"]], false,
			"Sobrou um ajudante. Desligue quando ele também for derrubado.")
	];

	/* ------------------------------------------------------------------ */
	/* 2. Ameaças                                                           */
	/* ------------------------------------------------------------------ */
	const atores = {};

	atores.lorelei = await criarNPC({
		name: "Capelã de Guerra Lorelei Wulff",
		tokenName: "Lorelei Wulff",
		role: "lorelei",
		link: true,
		img: `${ARTE}/lorelei.webp`,
		token: `${ARTE}/lorelei-token.webp`,
		nd: 4,
		cd: 18,
		tipo: "mon",
		raca: "lefou",
		atr: { for: 5, des: 1, con: 4, int: 0, sab: 3, car: 2 },
		pv: 110,
		pm: 24,
		def: 21,
		walk: 6,
		conjuracao: "sab",
		pericias: { inic: 5, perc: 7, fort: 10, refl: 7, vont: 15, luta: 15, mist: 4, reli: 7 },
		ic: ["medo"],
		resTxt: "Imune a medo; resistência a magia divina +5; resistência a Tormenta +10.",
		ataquesTxt: "Martelo de guerra cruel +15 (1d8+13, x3).",
		equipTxt: "Armadura completa, escudo leve, martelo de guerra cruel, símbolo sagrado, lampião mecanomágico, pergaminhos de Sono.",
		bio: p(
			"Criminosa de guerra da Supremacia Purista escondida em Dornbach. Virou clériga de Aharadak achando que cultua Valkaria e quer \"purificar\" não humanos, transformando-os em \"humanos\" (na verdade lefou). Ela mesma já é lefou e não sabe.",
			"Lança magias como clériga de 5º nível (CD 18). Prefere morrer a ser capturada; se tiver chance, se mata. Interrogada, fala com orgulho do experimento e da religião.",
			"<b>Sabe:</b> o nome \"Torgo\" (que surgiu para ela numa grande luz no céu) e que <b>Syvarian</b> é um comandante, oficial de média patente, que lidera criminosos, está nas Colinas e tem um exército. Não sabe onde.",
			`<b>Arte alternativa</b>, sem os óculos, com os olhos de inseto à mostra (para quando ela for desmascarada): retrato <code>${ARTE}/lorelei-sem-oculos.webp</code> e token <code>${ARTE}/lorelei-sem-oculos-token.webp</code> (aba Token da ficha).`
		),
		effects: [...ajudantes()],
		items: [
			arma("Martelo de Guerra Cruel", `${T20I}/itens/equipamentos/martelo-de-guerra.webp`, { dano: "1d8+13", tipo: "impacto", critX: 3 }),
			magia("Bênção", `${T20I}/magias/bencao.webp`,
				p("<b>Padrão, 3 PM.</b> Aliados em alcance curto recebem <b>+2 em ataque e dano</b> até o fim da cena. Mire os aliados e use o botão do efeito."),
				{ exec: "action", custo: 3, alcance: "short", alvo: "aliados", escola: "enc", durU: "scene",
					effects: [fx("Bênção de Lorelei", `${T20I}/magias/bencao.webp`, [["system.modificadores.ataque.geral", "2"], ["system.modificadores.dano.geral", "2"]])] }),
			magia("Curar Ferimentos", `${T20I}/magias/curar-ferimentos.webp`,
				p("<b>Padrão, 5 PM.</b> Uma criatura adjacente cura <b>6d8+6 PV</b>. Use Aplicar Cura no alvo."),
				{ exec: "action", custo: 5, alcance: "touch", alvo: "1 criatura", rolls: [["Cura", [["6d8+6", "curapv"]]]] }),
			magia("Soco de Arsenal", `${T20I}/magias/soco-do-mestre.webp`,
				p("<b>Padrão, 5 PM.</b> Uma criatura em alcance médio sofre <b>5d6+5 de impacto</b> e é empurrada 3m para trás (Fortitude reduz à metade e evita o empurrão)."),
				{ exec: "action", custo: 5, alcance: "medium", alvo: "1 criatura", circulo: 2, save: "Fortitude reduz à metade e evita o empurrão", rolls: [["Impacto", [["5d6+5", "impacto"]]]] }),
			poder("Lampião Mecanomágico", `${T20I}/itens/gerais/lampiao.webp`,
				p("Engenhoca do Dr. Vesper entregue por Torgo. Afeta qualquer <b>não humano inteligente em alcance longo</b>: <b>Vontade CD 20</b> (efeito mental). Na falha, quem usa o lampião decide uma ação de movimento da vítima por rodada. A vítima ainda faz a ação padrão, mas não pode fazer ações completas. Não dá para obrigá-la a outra coisa além de se mover.",
					"A vítima testa de novo a cada rodada; passar não a deixa imune. <b>Use a macro <i>Lampião Mecanomágico</i></b> (a CD 20 do lampião é diferente da CD 18 de Lorelei)."),
				{ exec: "free", alcance: "long",
					effects: [fx("Hipnotizado pelo Lampião", `${T20I}/itens/gerais/lampiao.webp`, [], { description: "Quem usa o lampião decide uma ação de movimento por rodada. Sem ações completas. Vontade CD 20 a cada rodada." })] }),
			poder("Resistências da Capelã", "icons/svg/shield.svg",
				p("Imune a medo. <b>+5</b> contra magia divina e <b>+10</b> contra efeitos da Tormenta: marque o aprimoramento certo na janela da rolagem de resistência.",
					"<b>Ajudantes (Alternativa 2):</b> ligue o efeito <i>Ajudantes de Dornbach</i> na aba de efeitos quando dois aldeões a estiverem ajudando."),
				{ exec: "passive", effects: resistenciasPuristas() })
		]
	});

	atores.soldado = await criarNPC({
		name: "Soldado de Lorelei",
		role: "soldado",
		img: `${ARTE}/soldado.webp`,
		token: `${ARTE}/soldado-token.webp`,
		nd: 2,
		cd: 15,
		tipo: "hum",
		raca: "humano",
		papel: "lackey",
		atr: { for: 4, des: 1, con: 3, int: -1, sab: -1, car: -1 },
		pv: 32,
		def: 21,
		walk: 6,
		pericias: { inic: 3, perc: 1, fort: 10, refl: 4, vont: 2, luta: 12, pont: 9 },
		resTxt: "Resistência a magia divina +5; resistência a Tormenta +10.",
		ataquesTxt: "Espada bastarda +12 (1d10+10, 19).",
		ataquesAdTxt: "Besta pesada +9 (1d12, 19).",
		equipTxt: "Besta pesada, escudo pesado, espada bastarda, meia armadura, virotes x10.",
		bio: p("Dois soldados escondidos com Lorelei no subsolo do salão comunal. Entram na luta 1d4 rodadas depois dos aldeões num ataque frontal.",
			"<b>Ódio Puro</b> já vem ligado (Lorelei tem ND 4). Desligue se ela cair. <b>Lutar em Formação</b> é um efeito para ligar quando os dois estiverem lado a lado."),
		effects: [
			chave("Ódio Puro (ordens de Lorelei)", "icons/magic/control/fear-fright-monster-purple-blue.webp", [["system.pericias.vont.bonus", "5"]], true,
				"+5 em Vontade enquanto segue ordens de um purista de ND 3+. O +2 de dano contra humanoides não humanos é um aprimoramento marcado na rolagem de dano."),
			chave("Lutar em Formação (+1)", "icons/svg/shield.svg", [["system.modificadores.ataque.geral", "1"], ["system.attributes.defesa.bonus", "1"]], false,
				"Adjacente a outro soldado de Lorelei: +1 em ataque e na Defesa."),
			...ajudantes()
		],
		items: [
			arma("Espada Bastarda", `${T20I}/itens/equipamentos/espada-bastarda.webp`, { dano: "1d10+10", tipo: "corte", critM: 19,
				effects: [aoUsar("Ódio Puro: alvo não humano (+2 dano)", "icons/magic/control/fear-fright-monster-purple-blue.webp", [["dano", 2]], ["attack"])] }),
			distancia("Besta Pesada", `${T20I}/itens/equipamentos/besta-pesada.webp`, { dano: "1d12", tipo: "perfuracao", critM: 19, alcance: "medio",
				effects: [aoUsar("Ódio Puro: alvo não humano (+2 dano)", "icons/magic/control/fear-fright-monster-purple-blue.webp", [["dano", 2]], ["attack"])] }),
			poder("Lutar em Formação", "icons/svg/shield.svg",
				p("Se estiver adjacente a um aliado que também tenha este poder, recebe +1 em ataque e na Defesa (ligue o efeito na ficha)."), { exec: "passive" }),
			poder("Ódio Puro", "icons/magic/control/fear-fright-monster-purple-blue.webp",
				p("Enquanto segue ordens de um purista de ND 3 ou maior, recebe +5 em Vontade e +2 em dano contra humanoides não humanos."), { exec: "passive" }),
			poder("Resistências Puristas", "icons/svg/shield.svg",
				p("+5 contra magia divina e +10 contra efeitos da Tormenta: marque o aprimoramento na rolagem de resistência."),
				{ exec: "passive", effects: resistenciasPuristas() })
		]
	});

	atores.guarda = await criarNPC({
		name: "Guarda de Dornbach",
		role: "guarda",
		img: `${ARTE}/guarda.webp`,
		token: `${ARTE}/guarda-token.webp`,
		nd: "1/2",
		cd: 15,
		tipo: "hum",
		raca: "humano",
		papel: "lackey",
		atr: { for: 2, des: 1, con: 2, int: 0, sab: -1, car: 0 },
		pv: 9,
		def: 15,
		walk: 9,
		pericias: { inic: 4, perc: 1, fort: 6, refl: 2, vont: 0, luta: 8, atle: 5 },
		ataquesTxt: "Espada curta +8 (1d6+5, 19).",
		equipTxt: "Couro batido, escudo leve, espada curta.",
		bio: p("Delmond (ferreiro, purista convicto), Marwen (taverneira, pode trocar de lado) e mais quatro homens e mulheres fortes. Renomeie os tokens ao colocá-los na cena."),
		items: [
			arma("Espada Curta", `${T20I}/itens/equipamentos/espada-curta.webp`, { dano: "1d6+5", tipo: "perfuracao", critM: 19 })
		]
	});

	atores.aldeao = await criarNPC({
		name: "Aldeão de Dornbach",
		role: "aldeao",
		img: `${T20I}/ameacas/recruta-supremacista.png`,
		nd: "1/4",
		cd: 15,
		tipo: "hum",
		raca: "humano",
		papel: "lackey",
		atr: { for: 0, des: 2, con: 1, int: -1, sab: -1, car: 0 },
		pv: 5,
		def: 10,
		walk: 9,
		pericias: { inic: 2, perc: 1, fort: 1, refl: 2, vont: -1, luta: 6, pont: 5, furt: 4, inti: 1 },
		ataquesTxt: "Clava +6 (1d6+2).",
		ataquesAdTxt: "Arco curto +5 (1d6, x3).",
		equipTxt: "Arco curto, clava, flechas x10.",
		bio: p("Ishtob, Volko, Zebedinna e Myrilla ficam \"fazendo hora\" no salão comunal. Outros nomes: Maxon, Makiah, Rommyn, Talana, Zadoch, Bleriana, Emory, Gianca, Myrta.",
			"Os aldeões têm <b>+10 para resistir</b> a tentativas de arrancar a verdade sobre Lorelei. Diplomacia ou Enganação amigável, ou prometer proteção, anula esse bônus."),
		items: [
			arma("Clava", `${T20I}/itens/equipamentos/clava.webp`, { dano: "1d6+2", tipo: "impacto" }),
			distancia("Arco Curto", `${T20I}/itens/equipamentos/arco-curto.webp`, { dano: "1d6", tipo: "perfuracao", critX: 3, alcance: "medio" })
		]
	});
	atores.zagar = await criarNPC({
		name: "Zagar, Cobaia \"Purificada\"",
		tokenName: "Hermann",
		role: "zagar",
		link: true,
		disposition: 0,
		img: `${ARTE}/hermann.webp`,
		token: `${ARTE}/zagar-token.webp`,
		nd: "1/4",
		cd: 15,
		tipo: "mon",
		raca: "lefou",
		papel: "lackey",
		atr: { for: 3, des: 2, con: 1, int: -1, sab: 0, car: -1 },
		pv: 7,
		def: 14,
		walk: 9,
		pericias: { inic: 2, perc: 2, fort: 6, refl: 1, vont: 0, luta: 7 },
		ic: ["metamorfose"],
		resTxt: "Imune a metamorfose.",
		ataquesTxt: "Tacape +7 (1d10+4).",
		equipTxt: "Tacape.",
		bio: p("O trog Zagar, único não humano de Dornbach, foi \"purificado\" por Lorelei e agora atende (com atraso) por <b>Hermann</b>, homenagem ao líder da Supremacia Purista.",
			"Não sabe usar o corpo novo: tropeça, erra os talheres, se confunde com o nome. Está apavorado e quase pedindo para ser convencido. Sem garantia de segurança, só diz que os heróis \"precisam ver o que vai acontecer à meia-noite\".",
			"Num ataque frontal, luta ao lado dos aldeões, a não ser que o grupo perceba o que há de errado com ele e o convença.",
			"No quartinho do depósito da Chifre de Bode: cama de palha suja e um desenho da menina Lylla mostrando-o como troglodita."),
		effects: [
			chave("Desajeitado (Des –3)", "icons/svg/daze.svg", [["system.atributos.des.bonus", -3]], true,
				"Destreza reduzida em 3 enquanto ele se acostuma à nova forma. Os valores entre parênteses da ficha do livro já contam isso.")
		],
		items: [
			arma("Tacape", `${T20I}/itens/equipamentos/tacape.webp`, { dano: "1d10+4", tipo: "impacto" })
		]
	});

	atores.maquina = await criarNPC({
		name: "Máquina de Purificação",
		tokenName: "Máquina de Purificação",
		role: "maquina",
		link: true,
		disposition: -1,
		img: `${T20I}/itens/gerais/orbe-cristalina.webp`,
		nd: "1/4",
		cd: 15,
		tipo: "con",
		papel: "special",
		atr: { for: 0, des: -5, con: 0, int: -5, sab: -5, car: -5 },
		pv: 40,
		def: 10,
		walk: 0,
		ic: ["mental", "metabolismo", "cansaco"],
		recursos: { primary: { label: "Rodada do ritual (0 a 5)", value: 0, max: 5 } },
		resTxt: "Objeto. Valores sugeridos, não estão no livro.",
		bio: p(
			"Uma grande gaiola cheia de bolas de cristal e cristais rosados (como os do implante de Vadrinne). Um para-raios sobe do topo e quatro lanças presas por correntes se cravam no chão.",
			"<b>O livro não dá Defesa nem PV para a máquina.</b> Os valores da ficha (Defesa 10, 40 PV) são uma sugestão; ajuste à vontade.",
			"Depois que o ritual começa (rodada 2), nem a morte de Lorelei o para: é preciso <b>destruir a máquina</b> ou <b>tirar a vítima</b> da gaiola. Use a macro <i>Ritual de Purificação</i> para avançar as rodadas."
		)
	});

	/* ---------- Aldeões e as Dahllan Daninhas (sem ficha no livro: só para os tokens) ---------- */
	const SEM_FICHA = "<b>Não tem ficha no livro.</b> Este ator existe para o token no mapa e para mostrar a arte aos jogadores.";
	const retrato = (role, name, arq, raca, atr, bio, extra = "") => criarNPC({
		name, role, img: `${ARTE}/${arq}.webp`, disposition: 0, link: true,
		nd: 1, tipo: "hum", raca, papel: "special", atr, pv: 10, def: 10, bio: p(bio, extra || SEM_FICHA)
	});
	const COMO_GUARDA = "<b>Em combate</b>, use a ficha do <i>Guarda de Dornbach</i> (ou arraste este ator e copie os números de lá).";
	atores.delmond = await retrato("delmond", "Delmond, o Ferreiro", "delmond", "humano", { for: 2, des: 1, con: 2, int: 0, sab: -1, car: 0 },
		"Ferreiro purista convicto, tem a aprendiz Braya. Montou a máquina de Lorelei com as peças de Torgo. Convida não humanos para \"conhecer o salão\" e oferece \"aprimorar as armas\". Se Lorelei morrer, tenta o ritual (50%).", COMO_GUARDA);
	atores.marwen = await retrato("marwen", "Marwen", "marwen", "humano", { for: 2, des: 1, con: 2, int: 0, sab: -1, car: 0 },
		"Taverneira da Chifre de Bode, racista \"condescendente\". Serve o jantar com Poção de Sono e pede as armaduras \"para polir\". Com bons argumentos (e a taverna pegando fogo), pode trocar de lado.", COMO_GUARDA);
	atores.orlo = await retrato("orlo", "Ancião Orlo", "orlo", "humano", { for: -1, des: 0, con: 0, int: 1, sab: 1, car: 1 },
		"O ancião da aldeia, purista convicto. Fica no salão comunal com Deron, Catagran e Bernice.");
	atores.deron = await retrato("deron", "Deron", "deron", "humano", { for: 1, des: 0, con: 1, int: 0, sab: 0, car: 0 },
		"Aldeão do salão comunal, ao lado do ancião Orlo.");
	atores.catagran = await retrato("catagran", "Catagran", "catagran", "humano", { for: 1, des: 0, con: 1, int: 0, sab: 0, car: 0 },
		"Aldeão do salão comunal, ao lado do ancião Orlo.");
	atores.bernice = await retrato("bernice", "Bernice", "bernice", "humano", { for: 0, des: 0, con: 1, int: 0, sab: 1, car: 0 },
		"Aldeã do salão comunal, ao lado do ancião Orlo.");
	atores.brixon = await retrato("brixon", "Brixon", "brixon", "humano", { for: 1, des: 0, con: 1, int: 0, sab: 0, car: -1 },
		"Do moinho, com Arsace: racistas discretos que odeiam forasteiros. O panfleto de ódio está num baú do moinho.");
	atores.arsace = await retrato("arsace", "Arsace", "arsace", "humano", { for: 1, des: 0, con: 1, int: 0, sab: 0, car: -1 },
		"Do moinho, com Brixon: racistas discretos que odeiam forasteiros.");
	atores.annabel = await retrato("annabel", "Annabel, a Dahllan Daninha", "annabel", "dahllan", { for: 2, des: 2, con: 2, int: 0, sab: 1, car: 0 },
		"A irmã mais velha: hostil, teimosa, quase paranoica, aliada feroz se ganharem sua confiança. Recebe o grupo com um tiro de besta de aviso. Depois do resgate, quer executar os aldeões.");
	atores.grena = await retrato("grena", "Grena, a Dahllan Daninha", "grena", "dahllan", { for: 0, des: 1, con: 1, int: 0, sab: 1, car: 2 },
		"Chamou o grupo pelo aviso no Forte. Tenta colaborar e desculpar a irmã mais velha.");
	atores.astelle = await retrato("astelle", "Astelle, a Dahllan Daninha", "astelle", "dahllan", { for: -1, des: 1, con: 0, int: 3, sab: 1, car: 0 },
		"A caçula estudiosa (cerca de 13 anos). Solta verdades constrangedoras sobre as irmãs. Se o grupo der as costas, foge de casa para pedir ajuda.");
	atores.andrisse = await retrato("andrisse", "Andrisse, a Dahllan Daninha", "andrisse", "dahllan", { for: -1, des: 1, con: 0, int: 0, sab: 0, car: 2 },
		"A desaparecida: seguiu hipnotizada o brilho do lampião até Dornbach e está presa sob o salão comunal, sofrendo lavagem cerebral. É a primeira vítima do ritual.");
	atores.vadrinne = await retrato("vadrinne", "Vadrinne, a Dahllan Daninha", "vadrinne", "dahllan", { for: 0, des: 1, con: 1, int: 0, sab: 0, car: 2 },
		"A irmã que as outras chamam de traidora: casou com o fazendeiro Jansel Gallobalt e vive longe da família. Reaparece na Aventura 4.");

	/* ---------- Ator de apoio: a aldeia ---------- */
	atores.aldeia = await criarNPC({
		name: "Aldeia de Dornbach (perigos e testes)",
		tokenName: "Dornbach",
		role: "aldeia",
		img: `${T20I}/ameacas/recruta-supremacista.png`,
		nd: 2,
		cd: 18,
		tipo: "hum",
		papel: "special",
		atr: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
		pv: 1,
		def: 10,
		bio: p("<b>Ator de apoio, não vai para o mapa.</b> Cada item é um perigo ou teste da aldeia, com a CD e os botões de efeito. Mire o personagem antes de clicar nos botões do card."),
		items: [
			poder("Armadilha de Alçapão", "icons/svg/trap.svg",
				p("Duas armadilhas no salão comunal, então no máximo dois personagens presos por vez. Os aldeões levam não humanos até lá com desculpas (um retrato parecido, um artefato do deus deles, uma profecia, um doente).",
					"<b>CD 18</b> em cada passo: <b>Intuição</b> para notar que é armadilha, <b>Percepção</b> para ver o alçapão, <b>Reflexos</b> para não cair.",
					"Investigação ou Ladinagem no salão revelam a armadilha de poço; Ofício (pedreiro) revela o subsolo."),
				{ exec: "passive", save: "Reflexos evita" }),
			poder("Jantar com Poção de Sono", `${T20I}/magias/sono.webp`,
				p("Às 19h Marwen serve o jantar envenenado com as poções de Sono. <b>Vontade CD 19</b> evita. Quem falhar fica muito sonolento e é levado aos quartos (humanos) ou à prisão sob o salão (não humanos)."),
				{ exec: "passive", save: "Vontade CD 19 evita", effects: [cond("Inconsciente")] }),
			poder("Infiltração (teste estendido)", "icons/svg/mystery-man.svg",
				p("Furtividade, teste estendido de complexidade média: <b>5 sucessos antes de 3 falhas</b>, CD 15 +1 por personagem além do primeiro. Use a macro <i>Infiltração em Dornbach</i>.",
					"<b>Cotidiano:</b> 3 testes de Furtividade CD 15 para chegar ao centro; uma falha sobe para CD 20, a segunda revela o personagem.",
					"<b>Cães:</b> Adestramento CD 20 para não latirem (falha conta como falha de Furtividade).",
					"<b>Disfarce de camponês:</b> troque Furtividade por Enganação (–5 sem andrajos ou estojo de disfarces, +5 sem armas e armadura).",
					"<b>Telhados:</b> um treinado pode trocar um teste por Atletismo; falha por 5 ou mais causa 1d6 de impacto."),
				{ exec: "passive", rolls: [["Queda do telhado", [["1d6", "impacto"]]]] }),
			poder("Procurando Andrisse", "icons/svg/eye.svg",
				p("Cada personagem treinado em Investigação ou Sobrevivência faz um teste <b>CD 15 +1 por dia</b> desde o rapto. Sucesso: não há sinal de luta nem de monstros; Andrisse não foi levada à força e não está em lugar nenhum da região."),
				{ exec: "passive" }),
			poder("Ataque Frontal", "icons/svg/sword.svg",
				p("Seis guardas (Delmond, Marwen e mais quatro) e os aldeões lutam primeiro. Zagar se junta a eles. <b>Lorelei e os dois soldados chegam em 1d4 rodadas.</b> No fim de cada rodada, rode a macro <i>Demais Habitantes</i>."),
				{ exec: "passive", rolls: [["Rodadas até Lorelei chegar", [["1d4", ""]]]] })
		]
	});

	/* ------------------------------------------------------------------ */
	/* 3. Itens                                                             */
	/* ------------------------------------------------------------------ */
	const itemDoc = (d) => ({ ...d, folder: pasta.Item, flags: FLAGS() });
	const novosItens = [];

	const sono = await game.packs.get("tormenta20.pocoes")?.getDocument("vjRcygbwo7vx4gOG").catch(() => null);
	if (sono) {
		const data = sono.toObject();
		delete data._id;
		data.name = "Poção de Sono (estoque de Marwen)";
		data.folder = pasta.Item;
		data.flags = foundry.utils.mergeObject(data.flags ?? {}, FLAGS());
		data.system.qtd = 6;
		data.system.description.value = `${p("Seis poções escondidas atrás do balcão da Chifre de Bode. Marwen as mistura na comida (Vontade CD 19 evita).")}<hr>${data.system.description.value ?? ""}`;
		novosItens.push(data);
	}

	novosItens.push(
		itemDoc({
			name: "Lampião Mecanomágico",
			type: "tesouro",
			img: `${T20I}/itens/gerais/lampiao.webp`,
			system: {
				description: { value: p(
					"Engenhoca do Dr. Vesper entregue a Lorelei por Torgo. Atrai não humanos inteligentes em alcance longo (Vontade CD 20, efeito mental) e deixa quem o usa decidir uma ação de movimento da vítima por rodada.",
					"É complexo demais para ser usado sem instrução. Desmontado, suas peças valem <b>T$ 300 em matéria-prima</b> para itens gerais e engenhocas."
				) },
				qtd: 1, preco: 300, peso: 1, espacos: 1
			}
		}),
		itemDoc({
			name: "Panfleto de Ódio da Guerra Artoniana",
			type: "tesouro",
			img: `${T20I}/itens/gerais/pergaminho.webp`,
			system: {
				description: { value: p(
					"Guardado num baú no moinho de Brixon e Arsace. Propaganda purista da época da guerra; o casal copiava o texto e distribuía cópias malfeitas pelas Colinas Centrais. Pista clara de que Dornbach simpatiza com os puristas."
				) },
				qtd: 1, preco: 0, peso: 0, espacos: 0
			}
		})
	);
	const itensCriados = await Item.createDocuments(novosItens);
	const itemPorNome = (inicio) => itensCriados.find((i) => i.name.startsWith(inicio));

	/* ------------------------------------------------------------------ */
	/* 4. Tabela: Demais Habitantes de Dornbach                             */
	/* ------------------------------------------------------------------ */
	const HABITANTES = [
		["Intervenção de Orlo", "O líder da vila incita os defensores contra o personagem. O NPC mais próximo pode se mover e atacá-lo como reação."],
		["Coice", "O personagem leva um coice de cavalo: 2d8 de impacto e fica caído (Reflexos CD 18 reduz à metade e evita caído)."],
		["Dejetos", "De uma janela, um aldeão atira... dejetos. O personagem fica enjoado até o fim da cena (Fortitude CD 15 reduz para 1 rodada)."],
		["Filho corajoso", "Uma criança de 7 anos se lança contra o personagem. Ele gasta uma ação padrão para afastá-la; senão, até o fim da cena todos os seus ataques têm 50% de chance de acertar a criança (1 PV). Só acontece uma vez; se sair de novo, use o resultado 5."],
		["Impropérios", "Xingamentos carregados de ódio: o personagem fica desprevenido por uma rodada (Vontade CD 15 evita)."],
		["Apedrejamento", "Aldeões atiram pedras: 2d4 de impacto (Reflexos CD 15 reduz à metade)."],
		["Vira-latas", "Um cão vadio ataca: 1d6 de corte e caído (Reflexos CD 15 evita)."],
		["Nada acontece", "Os aldeões só observam."]
	];
	const tabela = await RollTable.create({
		name: "Demais Habitantes de Dornbach",
		img: "icons/svg/village.svg",
		folder: pasta.RollTable,
		flags: FLAGS(),
		formula: "1d8",
		replacement: true,
		displayRoll: true,
		description: "No fim da 1ª rodada, aplique ao último personagem na iniciativa; a cada rodada seguinte, ao próximo em ordem decrescente.",
		results: HABITANTES.map(([name, description], i) => ({ type: "text", range: [i + 1, i + 1], weight: 1, name, description }))
	});

	/* ------------------------------------------------------------------ */
	/* 5. Macros de mesa                                                    */
	/* ------------------------------------------------------------------ */

	async function macroHabitantes() {
		const combat = game.combat;
		if (!combat) return ui.notifications.warn("Comece o combate antes.");
		// Personagens jogadores em ordem de iniciativa (maior primeiro).
		const pjs = combat.turns.filter((c) => c.actor?.type === "character");
		if (!pjs.length) return ui.notifications.warn("Nenhum personagem jogador no combate.");
		const estado = combat.getFlag("world", "fdtHabitantes") ?? { proximo: pjs.length - 1, filhoUsado: false };
		const alvoC = pjs[((estado.proximo % pjs.length) + pjs.length) % pjs.length];
		const alvo = alvoC.actor;

		let r = await new Roll("1d8").evaluate();
		let n = r.total;
		if (n === 4 && estado.filhoUsado) n = 5;
		if (n === 4) estado.filhoUsado = true;
		const rolls = [r];
		// O dano em jogo é rolado antes, para aparecer no card do teste do jogador.
		const teste = async (pericia, cd, o = {}) => {
			const d = o.dano ? await new Roll(o.dano).evaluate() : null;
			// O card leva o dano e a condição da falha: o Mestre aplica pelos botões dele.
			const t = await fdtTeste(alvo, pericia, { cd, dano: d, metade: o.metade, evita: o.evita, titulo: `Demais Habitantes: ${o.titulo}`, falha: o.falha, falhaStatus: o.falhaStatus, sucesso: o.sucesso });
			rolls.push(t);
			return { ok: t.total >= cd, total: t.total, dano: d };
		};
		const status = (id, ativo = true) => fdtAplicar.status(alvo, id, { active: ativo });

		let txt = "";
		switch (n) {
			case 1: txt = "<b>Intervenção de Orlo!</b> O NPC mais próximo pode se mover e atacar como reação."; break;
			case 2: {
				const s = await teste("refl", 18, { titulo: "Coice!", dano: "2d8[impacto]", metade: true, falha: "dano total e caído.", falhaStatus: "caido" });
				const v = s.dano.total;
				txt = `<b>Coice!</b> Reflexos ${s.total} (CD 18) ${s.ok ? "✔️ metade do dano" : "❌ dano total e caído"}. Dano rolado: ${v}.`;
				break;
			}
			case 3: {
				const s = await teste("fort", 15, { titulo: "Dejetos!", sucesso: "enjoado por 1 rodada.", falha: "enjoado até o fim da cena." });
				await status("enjoado");
				txt = `<b>Dejetos!</b> Fortitude ${s.total} (CD 15): enjoado ${s.ok ? "por 1 rodada" : "até o fim da cena"}.`;
				break;
			}
			case 4: txt = "<b>Filho corajoso!</b> Uma criança se lança contra o personagem. Ação padrão para afastá-la, ou 50% dos ataques acertam a criança (1 PV) até o fim da cena."; break;
			case 5: {
				const s = await teste("vont", 15, { titulo: "Impropérios!", falha: "desprevenido por 1 rodada.", falhaStatus: "desprevenido" });
				txt = `<b>Impropérios!</b> Vontade ${s.total} (CD 15) ${s.ok ? "✔️ ignora" : "❌ desprevenido por 1 rodada"}.`;
				break;
			}
			case 6: {
				const s = await teste("refl", 15, { titulo: "Apedrejamento!", dano: "2d4[impacto]", metade: true });
				const v = s.dano.total;
				txt = `<b>Apedrejamento!</b> Reflexos ${s.total} (CD 15) ${s.ok ? "✔️ metade" : "❌ dano total"}. Dano rolado: ${v}.`;
				break;
			}
			case 7: {
				const s = await teste("refl", 15, { titulo: "Vira-latas!", dano: "1d6[corte]", evita: true, falha: "toma o dano e fica caído.", falhaStatus: "caido", sucesso: "escapa." });
				txt = `<b>Vira-latas!</b> Reflexos ${s.total} (CD 15) ${s.ok ? "✔️ escapa" : "❌ 1d6 de corte e caído"}.`;
				break;
			}
			default: txt = "Nada acontece; os aldeões só observam.";
		}
		estado.proximo = (pjs.indexOf(alvoC) - 1 + pjs.length) % pjs.length;
		await combat.setFlag("world", "fdtHabitantes", estado);
		ChatMessage.create({ content: `<h3>Demais Habitantes · ${alvo.name}</h3><p>${txt}</p><p style="font-size:0.85em">O Mestre aplica o dano e as condições pelos botões do card.</p>`, rolls });
	}

	async function macroRitual() {
		const maquina = game.actors.find((a) => a.getFlag("world", "fdtRole") === "maquina");
		if (!maquina) return ui.notifications.error("Ator da Máquina de Purificação não encontrado (puxe a aventura do compêndio com a macro FdT · Puxar do compêndio).");
		const atual = maquina.system.resources.primary.value;
		const FASES = [
			"<b>Rodada 1.</b> Lorelei ergue os braços e entoa a oração: <i>\"Valkaria, remova a sujeira deste amaldiçoado! Um de seus filhos se oferece como ícone de sua perfeição! Que sua pele esconda a feiura, que seus ossos moldem a carne deformada, que sua mente elimine a depravação! Torne-o perfeito, minha mãe! Torne-o humano!\"</i>",
			"<b>Rodada 2.</b> Um relâmpago atinge o para-raios e líquido rubro verte da terra, sobe pelas lanças e cobre a gaiola. O <b>humano voluntário morre</b>, destroçado. A partir de agora, nem a morte de Lorelei para o ritual: destruam a máquina ou tirem a vítima.",
			"<b>Rodada 3.</b> A vítima começa a ser coberta de matéria sanguinolenta e <b>perde a primeira característica de raça</b> (na ordem do livro).",
			"<b>Rodada 4.</b> A vítima está toda coberta e <b>perde a segunda característica de raça</b>.",
			"<b>Rodada 5.</b> A vítima perde <b>todas as características de raça restantes</b> e cai desacordada com 0 PV, estabilizada. Agora é lefou (todos acham que é humana). Só um <i>Desejo</i> reverte."
		];
		if (atual >= 5) {
			const ok = await foundry.applications.api.DialogV2.confirm({ window: { title: "Ritual de Purificação" }, content: "<p>O ritual já terminou. Zerar o contador para um novo ritual?</p>" });
			if (ok) await maquina.update({ "system.resources.primary.value": 0 });
			return;
		}
		const escolha = await foundry.applications.api.DialogV2.wait({
			window: { title: `Ritual de Purificação · rodada ${atual} de 5` },
			content: "<p>Avançar o ritual uma rodada, ou interromper (máquina destruída ou vítima retirada)?</p>",
			buttons: [
				{ action: "avancar", label: "Avançar", default: true },
				{ action: "parar", label: "Interromper" }
			]
		});
		if (escolha === "parar") {
			await maquina.update({ "system.resources.primary.value": 0 });
			return ChatMessage.create({ content: "<h3>Ritual interrompido!</h3><p>A gaiola para de pulsar. O que a vítima já perdeu nas rodadas anteriores continua perdido.</p>" });
		}
		if (escolha !== "avancar") return;
		const nova = atual + 1;
		await maquina.update({ "system.resources.primary.value": nova });
		ChatMessage.create({ content: `<h3>Ritual de Purificação</h3><p>${FASES[nova - 1]}</p>` });
	}

	async function macroInfiltracao() {
		const atores = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		if (!atores.length) return ui.notifications.warn("Selecione os tokens de quem está se esgueirando.");
		const CHAVE = "fdtInfiltracao";
		const estado = game.user.getFlag("world", CHAVE) ?? { sucessos: 0, falhas: 0 };
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Infiltração em Dornbach" },
			content: `
				<p>Progresso atual: <b>${estado.sucessos}</b> sucessos e <b>${estado.falhas}</b> falhas (meta: 5 antes de 3).</p>
				<div class="form-group"><label>Perícia</label><select name="pericia">
					<option value="furt">Furtividade</option><option value="enga">Enganação (disfarce)</option>
					<option value="atle">Atletismo (telhados)</option><option value="ades">Adestramento (cães, CD 20)</option></select></div>
				<div class="form-group"><label>Modificador extra</label><input type="number" name="mod" value="0"></div>
				<div class="form-group"><label>Zerar o progresso antes</label><input type="checkbox" name="zerar"></div>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.zerar) { estado.sucessos = 0; estado.falhas = 0; }
		const cd = res.pericia === "ades" ? 20 : 15 + (atores.length - 1);
		const rolls = [];
		let html = `<h3>Infiltração em Dornbach</h3><p>CD ${cd}</p><ul>`;
		const testes = await fdtTestes(atores.map((a) => ({ ator: a, pericia: res.pericia, cd, extra: Number(res.mod) || 0, titulo: "Infiltração em Dornbach", falha: res.pericia === "atle" ? "falhando por 5 ou mais, cai do telhado (1d6 de impacto)." : "" })));
		for (const [i, a] of atores.entries()) {
			const r = testes[i];
			rolls.push(r);
			const ok = r.total >= cd;
			if (ok) estado.sucessos++; else estado.falhas++;
			const queda = res.pericia === "atle" && r.total <= cd - 5;
			html += `<li>${a.name}: <b>${r.total}</b> ${ok ? "✔️" : "❌"}${queda ? " · cai do telhado (1d6 de impacto)" : ""}</li>`;
		}
		html += `</ul><p>Progresso: <b>${estado.sucessos}/5</b> sucessos, <b>${estado.falhas}/3</b> falhas.</p>`;
		if (estado.sucessos >= 5) html += "<p><b>Sucesso!</b> Vocês veem e ouvem os primeiros acontecimentos da linha de tempo e sentem que algo estranho acontece no subsolo do salão.</p>";
		else if (estado.falhas >= 3) html += "<p><b>Descobertos!</b> Humanos são \"acolhidos\" com chifre de bode cozido em lama e escoltados para fora; não humanos são levados ao salão (armadilha de alçapão).</p>";
		if (estado.sucessos >= 5 || estado.falhas >= 3) await game.user.unsetFlag("world", CHAVE);
		else await game.user.setFlag("world", CHAVE, estado);
		ChatMessage.create({ content: html, rolls });
	}

	async function macroLampiao() {
		const alvos = [...game.user.targets].map((t) => t.actor).filter(Boolean);
		if (!alvos.length) return ui.notifications.warn("Mire (target) os não humanos inteligentes em alcance longo.");
		const rolls = [];
		let html = "<h3>Lampião Mecanomágico</h3><p>Vontade CD 20 (efeito mental). Quem falhar tem uma ação de movimento decidida por quem usa o lampião nesta rodada.</p><ul>";
		const testes = await fdtTestes(alvos.map((a) => ({ ator: a, pericia: "vont", cd: 20, titulo: "Lampião Mecanomágico", falha: "quem usa o lampião decide uma ação de movimento sua nesta rodada." })));
		for (const [i, a] of alvos.entries()) {
			const r = testes[i];
			rolls.push(r);
			const ok = r.total >= 20;
			const efeito = a.effects.find((e) => e.getFlag("world", "fdtLampiao"));
			if (!ok && !efeito) {
				await fdtAplicar.efeito(a, [{
					name: "Hipnotizado pelo Lampião",
					img: "systems/tormenta20/icons/itens/gerais/lampiao.webp",
					type: "base",
					description: "Quem usa o lampião decide uma ação de movimento por rodada. Sem ações completas. Novo teste a cada rodada.",
					flags: { world: { fdt: "av3", fdtLampiao: true } }
				}]);
			} else if (ok && efeito) await fdtAplicar.tirarEfeito(a, [efeito.id], efeito.name);
			html += `<li>${a.name}: <b>${r.total}</b> ${ok ? "✔️ resiste nesta rodada" : "❌ hipnotizado"}</li>`;
		}
		html += "</ul><p style=\"font-size:0.85em\">Passar não dá imunidade: rode de novo a cada rodada.</p>";
		ChatMessage.create({ content: html, rolls });
	}

	/* Macro: monta as cenas dos mapas da Av3 (imagens do módulo, grid, paredes, portas, luzes e notas do Mestre).
	 * Coordenadas em pixels da cena (1 quadrado = 100 px = 1,5 m). As paredes foram traçadas à mão sobre as
	 * imagens: confira no editor de paredes. Cenas que já existem não são tocadas, a não ser que o Mestre peça. */
	async function macroCenas() {
		const DIR = "modules/giriarpg-fim-dos-tempos/assets/arco1/av3-cultistas/mapas";
		const TIPOS = {
			parede: { move: 20, sight: 20, light: 20, sound: 20 },
			janela: { move: 20, sight: 0, light: 0, sound: 10 },
			cortina: { move: 0, sight: 20, light: 20, sound: 0 },
			porta: { move: 20, sight: 20, light: 20, sound: 20, door: 1, ds: 0 },
			grade: { move: 20, sight: 0, light: 0, sound: 0, door: 1, ds: 2 },
			tabuas: { move: 20, sight: 20, light: 20, sound: 20, door: 1, ds: 2 }
		};
		// Casa vista de fora: o contorno do telhado vira parede (esconde o interior) e a porta fica no meio da frente (embaixo).
		const casa = (x0, y0, x1, y1, porta = "porta") => {
			const m = Math.round((x0 + x1) / 2);
			return [["parede", [m + 9, y1, x1, y1, x1, y0, x0, y0, x0, y1, m - 9, y1]], [porta, [m - 9, y1, m + 9, y1]]];
		};
		// Aldeia de Dornbach: coordenadas em pixels da arte original (1344 x 768); k converte para a cena de 70 x 40 quadrados.
		const ALDEIA = [
			...casa(0, 68, 100, 200), ...casa(135, 145, 200, 245), ...casa(262, 95, 425, 250), ...casa(487, 32, 620, 230),
			...casa(720, 187, 925, 345), ...casa(965, 265, 1105, 480), ...casa(222, 320, 408, 428), ...casa(0, 270, 100, 450),
			...casa(140, 440, 250, 615), ...casa(378, 450, 515, 640), ...casa(728, 440, 915, 655), ...casa(588, 590, 695, 760, "tabuas")
		];
		const NOTAS_ALDEIA = [
			[822, 260, "Salão Comunal (interior e subsolo nas cenas próprias)"],
			[315, 375, "Taverna Chifre de Bode (interior na cena própria)"],
			[343, 170, "Oficina de Delmond"],
			[1035, 370, "Moinho de Brixon e Arsace"],
			[640, 675, "Templo do Panteão disfarçado de casa: porta e janelas tapadas com tábuas (a porta começa trancada)"],
			[167, 195, "Celeiro"],
			[895, 80, "Chiqueiro"],
			[1060, 180, "Píer do rio"]
		];
		const LUZ = {
			fogo: { bright: 3, dim: 7.5, color: "#ff8a3d", alpha: 0.45, animation: { type: "torch", speed: 3, intensity: 3 } },
			fogueira: { bright: 4.5, dim: 9, color: "#ff7a2a", alpha: 0.45, animation: { type: "torch", speed: 3, intensity: 4 } },
			vela: { bright: 1, dim: 3, color: "#ffb35c", alpha: 0.35, animation: { type: "torch", speed: 2, intensity: 2 } },
			braseiro: { bright: 1.5, dim: 4.5, color: "#ffa040", alpha: 0.4, animation: { type: "torch", speed: 3, intensity: 3 } },
			rubra: { bright: 1, dim: 3, color: "#ff3030", alpha: 0.5, animation: { type: "pulse", speed: 2, intensity: 3 } }
		};
		const CENAS = [
			{
				id: "chifre", nome: "Av3 · Dornbach · Taverna Chifre de Bode", arquivo: "chifre-de-bode", w: 10, h: 15, escuro: 0.5,
				paredes: [
					["parede", [60, 200, 280, 200, 280, 420, 660, 420, 660, 200, 905, 200, 905, 1500, 580, 1500]],
					["porta", [580, 1500, 420, 1500]],
					["parede", [420, 1500, 60, 1500, 60, 1150]],
					["janela", [60, 1150, 60, 780]], ["parede", [60, 780, 60, 700]],
					["janela", [60, 700, 60, 330]], ["parede", [60, 330, 60, 200]]
				],
				luzes: [["fogo", 470, 445], ["vela", 75, 487], ["vela", 75, 1185], ["vela", 890, 547], ["vela", 660, 832], ["vela", 660, 1372]],
				notas: [
					[780, 1000, "6 poções de Sono escondidas atrás do balcão"],
					[470, 480, "Lareira: o chifre de bode cozido em lama"],
					[500, 1420, "Entrada (porta posta pela macro; o mapa não mostra)"],
					[250, 1420, "Cozinha, os 2 quartos de hóspede e o quarto de Zagar ficam fora deste mapa"]
				]
			},
			{
				id: "salao", nome: "Av3 · Dornbach · Salão Comunal", arquivo: "salao-comunal", w: 12, h: 18, escuro: 0.4,
				paredes: [
					["parede", [550, 1650, 70, 1650, 50, 1100, 55, 600, 75, 40, 1140, 40, 1165, 600, 1170, 1100, 1145, 1650, 650, 1650]],
					["porta", [650, 1650, 550, 1650]]
				],
				luzes: [["fogueira", 623, 1090], ["vela", 437, 585], ["vela", 797, 585], ["vela", 437, 1112], ["vela", 797, 1112]],
				notas: [
					[620, 300, "Mesa dos anciãos (Orlo, Deron, Catagran, Bernice)"],
					[620, 80, "Retrato na parede: desculpa para atrair não humanos"],
					[230, 470, "Bandeja com pratos e talheres: alguém come escondido"],
					[480, 940, "Alçapão 1: Intuição, Percepção e Reflexos CD 18 (p. 105). Cai na cela do subsolo"],
					[765, 940, "Alçapão 2: Intuição, Percepção e Reflexos CD 18 (p. 105). Cai na cela do subsolo"],
					[1040, 150, "Passagem escondida para o subsolo (Ofício pedreiro revela)"]
				],
				alcapoes: [[430, 890], [715, 890]]
			},
			{
				id: "subsolo", nome: "Av3 · Dornbach · Subsolo do Salão", arquivo: "salao-comunal-subsolo", w: 16, h: 16, escuro: 0.85,
				paredes: [
					["parede", [200, 200, 1105, 200, 1105, 115, 1408, 115, 1408, 1488, 200, 1488, 200, 200]],
					["parede", [1030, 500, 1150, 500]], ["parede", [1200, 775, 1408, 775]],
					["parede", [200, 1040, 360, 1040]], ["grade", [360, 1040, 360, 1312]], ["parede", [360, 1312, 512, 1312, 512, 1488]],
					["parede", [512, 1250, 592, 1250]], ["grade", [592, 1250, 960, 1250]], ["parede", [960, 1250, 1040, 1250, 1040, 1488]],
					["parede", [1040, 1312, 1312, 1312]]
				],
				luzes: [["braseiro", 736, 232], ["vela", 864, 424], ["vela", 264, 480], ["vela", 424, 504], ["vela", 264, 1336], ["vela", 1280, 1160], ["rubra", 776, 1384]],
				notas: [
					[1230, 300, "Alojamento de Lorelei e dos 2 soldados"],
					[750, 800, "Montagem da Máquina de Purificação"],
					[280, 1240, "Cela de Andrisse (grade trancada)"],
					[776, 1400, "Cela de quem cai do alçapão (grade trancada)"],
					[1400, 1420, "Saída para a superfície: a máquina sobe às 22h"]
				]
			},
			{
				id: "carvalho", nome: "Av3 · Carvalho Oco das Dahllan", arquivo: "carvalho-oco", w: 14, h: 20, escuro: 0, dia: true,
				paredes: [
					["parede", [420, 530, 330, 460, 296, 340, 304, 220, 360, 124, 480, 84, 600, 110, 664, 190, 690, 300, 720, 390, 810, 396]],
					["parede", [420, 530, 500, 610]], ["cortina", [500, 610, 690, 580]],
					["parede", [930, 396, 940, 340, 970, 260, 990, 180, 1080, 124, 1200, 144, 1260, 220, 1260, 320, 1220, 420, 1140, 480, 1130, 540, 1170, 600, 1180, 700, 1120, 780, 1080, 800]],
					["cortina", [1080, 800, 1120, 1060]],
					["parede", [1120, 1060, 1150, 1080, 1120, 1150, 990, 1160, 940, 1200, 820, 1280]],
					["parede", [550, 1120, 565, 1280, 660, 1280]],
					["parede", [540, 1280, 510, 1330, 530, 1440, 530, 1560, 490, 1630, 380, 1660, 260, 1640, 150, 1600, 90, 1480, 80, 1380, 110, 1280, 220, 1220, 300, 1200]],
					["cortina", [300, 1200, 540, 1280]],
					["parede", [300, 1200, 260, 1100, 240, 940]], ["cortina", [240, 940, 250, 800]], ["parede", [250, 800, 300, 700, 430, 636, 500, 610]],
					["parede", [740, 430, 756, 660]]
				],
				luzes: [],
				notas: [
					[870, 250, "Ponte de corda: Annabel dá o tiro de aviso daqui"],
					[480, 260, "Quarto de Annabel"],
					[1150, 230, "Quarto de Grena (a cama vazia de Andrisse)"],
					[260, 1450, "Quarto de Astelle (estante, grimório)"],
					[1060, 700, "Cozinha"],
					[740, 1330, "Saída pelo chão, entre as raízes"]
				]
			},
			{
				id: "dornbach", nome: "Av3 · Dornbach · Aldeia (dia)", arquivo: "aldeia-dornbach", w: 70, h: 40, k: 7000 / 1344, escuro: 0, dia: true,
				paredes: ALDEIA,
				luzes: [],
				notas: [
					...NOTAS_ALDEIA,
					[595, 400, "Praça ao lado do Salão: vendem grãos de dia; à noite, o ritual (cena da noite)"],
					[60, 640, "Infiltração (p. 104): Furtividade CD 15, 5 sucessos antes de 3 falhas. Telhados: um teste pode ser Atletismo, falha por 5+ é 1d6 de queda; as casas são afastadas, não dá para cruzar só pelos telhados"],
					[822, 380, "Ataque frontal: 6 guardas e aldeões; Lorelei e os 2 soldados saem do Salão em 1d4 rodadas"]
				]
			},
			{
				id: "dornbach-noite", nome: "Av3 · Dornbach · Praça do ritual (noite)", arquivo: "aldeia-dornbach", w: 70, h: 40, k: 7000 / 1344, escuro: 0.8,
				paredes: ALDEIA,
				luzes: [["fogueira", 595, 400], ["fogo", 500, 320], ["fogo", 690, 320], ["fogo", 500, 480], ["fogo", 690, 480], ["fogo", 822, 360], ["fogo", 315, 440], ["vela", 553, 240]],
				notas: [
					...NOTAS_ALDEIA,
					[595, 400, "Máquina de Purificação: sobe do subsolo às 22h (ponha como tile). Ritual em 5 rodadas (p. 109): rodada 1 oração, rodada 2 relâmpago e sangue"],
					[595, 470, "Toda a aldeia reunida; Lorelei, 2 soldados, 6 ajudantes e Torgo de mantos escuros. Cada dupla de ajudantes dá +5 a um inimigo"],
					[315, 455, "Às 22h os aldeões podem atear fogo à taverna com os PJs trancados"]
				]
			}
		];

		const ids = new Set(CENAS.map((c) => c.id));
		const existentes = game.scenes.filter((s) => ids.has(s.getFlag("world", "fdtCena")));
		let recriar = false;
		if (existentes.length) {
			recriar = await foundry.applications.api.DialogV2.confirm({
				window: { title: "Av3: cenas dos mapas" },
				content: `<p>Já existem <b>${existentes.length}</b> cenas da Av3 criadas por esta macro.</p>
					<p><b>Sim</b> apaga essas cenas e cria de novo (tokens, paredes e ajustes feitos à mão nelas se perdem).<br>
					<b>Não</b> mantém as que existem e cria só as que faltam.</p>`
			});
			if (recriar) await Scene.deleteDocuments(existentes.map((s) => s.id));
		}
		const ja = new Set(recriar ? [] : existentes.map((s) => s.getFlag("world", "fdtCena")));
		const diario = game.journal.find((j) => j.name?.startsWith("Aventura 3 ·"));
		const criadas = [];
		const pulei = [];
		for (const c of CENAS) {
			if (ja.has(c.id)) {
				pulei.push(c.nome);
				continue;
			}
			const src = `${DIR}/${c.arquivo}.webp`;
			// A margem (padding) da cena desloca a imagem: o Foundry arredonda a margem para quadrados inteiros.
			const k = c.k ?? 1;
			const q = (v) => Math.round(v * k);
			// Tamanho do quadrado em pixels: 100 por padrão; "grade: 50" dobra o número de quadrados sobre a mesma imagem.
			const g = c.grade ?? 100;
			const dx = Math.ceil((0.1 * c.w * 100) / g) * g;
			const dy = Math.ceil((0.1 * c.h * 100) / g) * g;
			const walls = [];
			for (const [tipo, p] of c.paredes) {
				for (let i = 0; i + 3 < p.length; i += 2) walls.push({ c: [q(p[i]) + dx, q(p[i + 1]) + dy, q(p[i + 2]) + dx, q(p[i + 3]) + dy], ...TIPOS[tipo] });
			}
			const dados = {
				name: c.nome,
				navigation: false,
				width: c.w * 100,
				height: c.h * 100,
				padding: 0.1,
				backgroundColor: "#111111",
				grid: { type: 1, size: g, distance: 1.5, units: "m" },
				tokenVision: true,
				environment: { darknessLevel: c.escuro, globalLight: { enabled: !!c.dia } },
				walls,
				lights: c.luzes.map(([t, x, y]) => ({ x: q(x) + dx, y: q(y) + dy, config: { ...LUZ[t] } })),
				notes: c.notas.map(([x, y, text]) => ({ x: q(x) + dx, y: q(y) + dy, text, entryId: diario?.id ?? null, iconSize: 32, texture: { src: "icons/svg/book.svg" } })),
				flags: { world: { fdtCena: c.id } }
			};
			const cena = await Scene.create(dados);
			// v14: a imagem fica no nível (Level) da cena. Sem níveis (versões antigas), vai em background.
			try {
				const niveis = cena.levels;
				if (niveis && niveis.size) await cena.updateEmbeddedDocuments("Level", [{ _id: niveis.contents[0].id, background: { src } }]);
				else if (niveis) await cena.createEmbeddedDocuments("Level", [{ name: "Térreo", elevation: { bottom: 0, top: 20 }, background: { src } }]);
				else await cena.update({ "background.src": src });
			} catch (e) {
				console.error(e);
				ui.notifications.warn(`${c.nome}: não consegui pôr a imagem sozinho. Escolha ${src} nas configurações da cena.`);
			}
			// Alçapões como regiões ocultas (só o Mestre vê). Se a versão não aceitar, as notas já marcam o lugar.
			if (c.alcapoes) {
				try {
					await cena.createEmbeddedDocuments("Region", c.alcapoes.map(([x, y], i) => ({
						name: `Alçapão ${i + 1}`,
						color: "#c0392b",
						shapes: [{ type: "rectangle", x: x + dx, y: y + dy, width: 100, height: 100, rotation: 0, hole: false }]
					})));
				} catch (e) {
					console.warn("Av3 · cenas: regiões dos alçapões não criadas", e);
				}
			}
			criadas.push(cena);
		}
		const lista = criadas.map((s) => `<li>@UUID[${s.uuid}]{${s.name}}</li>`).join("");
		ChatMessage.create({
			whisper: [game.user.id],
			content: `<h3>Av3 · Cenas dos mapas</h3>${criadas.length ? `<p>Criadas:</p><ul>${lista}</ul>` : "<p>Nenhuma cena nova.</p>"}${pulei.length ? `<p>Já existiam (não mexi): ${pulei.join(", ")}.</p>` : ""}<p style="font-size:0.85em">Grid de 1,5 m, paredes, portas, luzes e notas do Mestre. As paredes foram traçadas sobre as imagens: confira e ajuste no editor de paredes antes da sessão. As grades das celas começam trancadas.</p>`
		});
	}

	const macro = (name, img, fn) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Aventura 3 · gerado por av3-cultistas-puristas.js\n${usaFdt(fn) ? FDT_TESTE : ""}${chamar(fn, `(${codigo(fn)})()`)}`
	});
	const macros = await Macro.createDocuments([
		macro("Av3 · Demais Habitantes", "icons/svg/village.svg", macroHabitantes),
		macro("Av3 · Ritual de Purificação", `${T20I}/itens/gerais/orbe-cristalina.webp`, macroRitual),
		macro("Av3 · Infiltração em Dornbach", "icons/svg/mystery-man.svg", macroInfiltracao),
		macro("Av3 · Lampião Mecanomágico", `${T20I}/itens/gerais/lampiao.webp`, macroLampiao),
		macro("Av3 · Montar cenas dos mapas", "icons/svg/house.svg", macroCenas)
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
		name: "Aventura 3 · Cultistas Puristas Devem Morrer",
		folder: pasta.JournalEntry,
		flags: FLAGS(),
		pages: [
			pagina("Guia do Mestre", `
				<h2>Resumo</h2>
				<p>A criminosa de guerra ${L(atores.lorelei)} se esconde no subsolo do salão comunal de Dornbach. Virou clériga de Aharadak achando que cultua Valkaria e, com uma máquina e ciência trazidas por Torgo (o homem de mantos escuros, agente do Dr. Vesper), \"purifica\" não humanos em \"humanos\" (lefou). Já transformou ${L(atores.zagar)} e raptou a dahllan Andrisse com o ${L(itemPorNome("Lampião"))}.</p>
				<h2>Fases</h2>
				<ol>
					<li><b>Normalidade:</b> Edwina conta a Nadine uma história do Herói Louco no salão da Metais do Baixote.</li>
					<li><b>Encontro nas Centrais</b> (opcional) a caminho do carvalho oco.</li>
					<li><b>As Dahllan Daninhas:</b> tiro de besta de aviso, Annabel hostil, Grena chamou o grupo, Astelle solta verdades constrangedoras.</li>
					<li><b>Dornbach:</b> investigação, infiltração, ataque frontal ou \"bater na porta\". Linha de tempo a partir do meio-dia.</li>
					<li><b>Ritual</b> à meia-noite e desfecho.</li>
				</ol>
				<h2>Fichas</h2>
				<ul>
					<li>${L(atores.lorelei)} (ND 4) e dois ${L(atores.soldado)} (ND 2)</li>
					<li>Seis ${L(atores.guarda)} (Delmond, Marwen e mais quatro) e ${L(atores.aldeao)} (Ishtob, Volko, Zebedinna, Myrilla...)</li>
					<li>${L(atores.zagar)} e a ${L(atores.maquina)}</li>
					<li>Perigos e testes: ${L(atores.aldeia)}</li>
				</ul>
				<h2>Combatentes de Dornbach: duas alternativas</h2>
				<p><b>Alternativa 1:</b> cada guarda e aldeão é um token.</p>
				<p><b>Alternativa 2 (recomendada pelo livro):</b> só Lorelei e os soldados são tokens. Cada um recebe uma dupla de ajudantes: ligue o efeito <i>Ajudantes de Dornbach: dois (+5)</i> na ficha. Um ataque ou efeito com dano derruba um ajudante (área não pega os dois); troque para o efeito de +2, e desligue com os dois derrubados. Use a Defesa e as resistências das fichas de guarda e aldeão.</p>
				<h2>Macros</h2>
				<ul>
					<li>${linkMacro("Demais Habitantes")}: no fim de cada rodada. Começa pelo último na iniciativa e sobe; rola a tabela ${L(tabela)}, os testes do alvo, aplica dano (com RD) e condições.</li>
					<li>${linkMacro("Ritual")}: avança as 5 rodadas do ritual com a narração de cada uma.</li>
					<li>${linkMacro("Infiltração")}: conta o teste estendido (5 sucessos antes de 3 falhas).</li>
					<li>${linkMacro("Lampião")}: Vontade CD 20 nos alvos mirados e marca quem ficou hipnotizado.</li>
				</ul>`, 100),
			pagina("Handout · Aviso no Quadro", `
				<blockquote><p><i>\"A aldeia de Dornbach está escondendo criminosos de guerra puristas! Não sabemos quem eles são ou o que planejam, mas isso é do interesse direto do Exército do Reinado. Nós mesmas já sofremos com eles e há muitos não humanos em risco nas Colinas Centrais. Venham falar conosco, podemos dar detalhes. Dornbach precisa ser investigada!</i></p>
				<p><i>Grena, no grande carvalho oco, a dois dias de viagem a noroeste do Forte Cabeça-de-Martelo\"</i></p></blockquote>
				<p class="secret"><b>Isabrine:</b> desconfia das \"Dahllan Daninhas\" e aconselha ficar longe. <b>Moira:</b> acha que merecem ajuda, nem que seja para apaziguar uma briga de vizinhos.</p>`, 200),
			pagina("As Dahllan Daninhas", `
				<p>Vivem num carvalho oco do tamanho de uma torre, sem folhas mas florindo na primavera (sinal de Allihanna), no topo de uma colina cultivada. Filhas da dríade Granúlia.</p>
				<ul>
					<li>${L(atores.annabel)}, a mais velha: hostil, teimosa, quase paranoica, aliada feroz se ganharem sua confiança. Resume as Colinas Centrais.</li>
					<li>${L(atores.grena)}: chamou o grupo, tenta colaborar e desculpar a irmã.</li>
					<li>${L(atores.astelle)}, a caçula estudiosa: revela verdades constrangedoras (Andrisse era protegida demais e muito ingênua).</li>
					<li>${L(atores.andrisse)}: a desaparecida, presa sob o salão comunal e sofrendo lavagem cerebral.</li>
				</ul>
				<p>Servos de Allihanna, druidas e aventureiros ligados à natureza ganham a simpatia delas com mais facilidade.</p>
				<h3>O que elas dizem (e o que é verdade)</h3>
				<table>
					<tr><th>Afirmação</th><th>Verdade</th></tr>
					<tr><td>Dornbach sempre deu problemas; querem o carvalho e nos ver longe.</td><td><b>Parcial.</b> Temiam Granúlia mas nunca agiram. São mais intolerantes que o resto das Centrais e, desde Lorelei, se comportam bem demais.</td></tr>
					<tr><td>Estão escondendo puristas: o único não humano sumiu, há pegadas fundas, barulho de construção à noite e Andrisse sumiu.</td><td><b>Verdade.</b> Zagar foi transformado, as pegadas são de Torgo, o barulho é a máquina.</td></tr>
					<tr><td>O Reinado nunca faz nada porque Dornbach é de humanos.</td><td><b>Falso.</b> O Exército levaria a sério se elas não tivessem tantas acusações falsas (ataque que era festival, culto a Sszzaas, maldição nas plantações).</td></tr>
					<tr><td>Andrisse simplesmente desapareceu.</td><td><b>Verdade.</b> Há cerca de duas semanas ela viu o brilho do lampião e seguiu hipnotizada até Dornbach.</td></tr>
					<tr><td>Andrisse nunca se afastaria, conhece os perigos.</td><td><b>Falso.</b> Foi tão protegida que não conhece nada do mundo.</td></tr>
				</table>
				<p><b>Se o grupo der as costas:</b> a missão falha (Vesper ganha apoio de nobres racistas em Valkaria) ou Astelle foge de casa para pedir ajuda pessoalmente.</p>`, 300),
			pagina("Construções de Dornbach", `
				<ul>
					<li><b>Oficina de ${L(atores.delmond)}:</b> ferreiro e a aprendiz Braya, ambos puristas. Pistas: nenhum sinal de que ele é inventor, talheres mordidos pelos dentes de Zagar, elos de corrente descartados.</li>
					<li><b>Chifre de Bode:</b> taverna famosa pelo chifre de bode cozido em lama. ${L(atores.marwen)} (racista \"condescendente\", pode trocar de lado), Ungus (fanático) e Zagar. Pistas: ${L(itemPorNome("Poção de Sono"))} atrás do balcão, o comportamento de Zagar, o quarto dele com roupas que não servem e o desenho de Lylla.</li>
					<li><b>Salão Comunal:</b> ancião ${L(atores.orlo)} (purista convicto), ${L(atores.deron)}, ${L(atores.catagran)} e ${L(atores.bernice)}. Ishtob, Volko, Zebedinna e Myrilla ficam \"fazendo hora\". Investigação/Ladinagem: armadilha de poço. Ofício (pedreiro): há um subsolo. Investigação: pratos e talheres sobrando (alguém escondido come ali). Enganação razoável faz os anciões mostrarem as visões puristas.</li>
					<li><b>Moinho:</b> ${L(atores.brixon)} e ${L(atores.arsace)}, racistas discretos que odeiam forasteiros. ${L(itemPorNome("Panfleto"))} num baú.</li>
					<li><b>Templo do Panteão:</b> fechado com tábuas, símbolos externos apagados há pouco, medalhões dos deuses riscados. Os aldeões contam versões diferentes de um \"ataque de orcs\".</li>
					<li><b>Casas:</b> simples, nada surpreendente. Sem mercado, só uma praça perto do salão onde se vende grão.</li>
				</ul>`, 400),
			pagina("Linha de Tempo do Ritual", `
				<table>
					<tr><td><b>12:00</b></td><td>O grupo chega. Dois aldeões \"guerreiros\" vão avisar Lorelei (Intuição CD 25 para notar).</td></tr>
					<tr><td><b>13:00</b></td><td>Marwen convida para a taverna (sem veneno ainda) e manda Zagar trabalhar. Um aldeão vigia o grupo.</td></tr>
					<tr><td><b>14:00</b></td><td>Delmond convida não humanos para \"conhecer o salão\" (armadilha). Com mais de dois, separa: alguns vão ao salão, outros para longe, onde Lorelei espera com o lampião. Oferece \"aprimorar as armas\".</td></tr>
					<tr><td><b>15:00</b></td><td>Lorelei interroga quem está preso no subsolo. Dá para ver a máquina sendo montada e falar com Andrisse na cela ao lado. Aldeões fazem de tudo para manter o resto do grupo longe do salão.</td></tr>
					<tr><td><b>16:00</b></td><td>Com hostilidade aberta, Lorelei tenta o ritual (em último caso). Lança Sono por pergaminho nos prisioneiros e tira os equipamentos.</td></tr>
					<tr><td><b>17:00</b></td><td>Delmond é chamado ao salão (problema na máquina). Equipamentos dos presos vão para a oficina, sob o entulho. Um clérigo do grupo é chamado para missa, batismos e casamentos (1 a 3 horas).</td></tr>
					<tr><td><b>18:00</b></td><td>Máquina pronta. Lorelei discursa aos prisioneiros. Soldados e guerreiros prontos no subsolo.</td></tr>
					<tr><td><b>19:00</b></td><td>Jantar grátis com Poção de Sono (Vontade CD 19). Se o grupo entregou as armas e mostrou hostilidade, Delmond as quebra (ou aldeões se armam com elas). Lorelei reza.</td></tr>
					<tr><td><b>20:00</b></td><td>Marwen insiste para dormirem e pede as armaduras \"para polir\". Janelas dos quartos com Tranca Arcana. Lorelei chama Torgo magicamente (primeira vez que o nome aparece).</td></tr>
					<tr><td><b>21:00</b></td><td>Portas trancadas por fora. Torgo chega (a pé, ou numa luz cegante do gog'magogue). Lorelei sobe para recebê-lo. Chance de fuga.</td></tr>
					<tr><td><b>22:00</b></td><td>A máquina sobe. Se houver hostilidade e alguém trancado, ateiam fogo à taverna: chance de Marwen trocar de lado com bons argumentos.</td></tr>
					<tr><td><b>23:00</b></td><td>Todos na praça. Os aldeões darão a vida para deter os heróis.</td></tr>
					<tr><td><b>00:00</b></td><td>O ritual começa: Andrisse, depois outros NPCs, depois os heróis. Torgo não interfere e vai embora quando o combate esquenta.</td></tr>
					<tr><td><b>01:00</b></td><td>Sem interferência, o ritual está completo e Lorelei chora agradecendo a \"Valkaria\".</td></tr>
				</table>`, 500),
			pagina("O Ritual de Purificação", `
				<p>Grande magia divina auxiliada pela ${L(atores.maquina)}. Só funciona em terra maculada pela Tormenta (nas Centrais); em outros lugares mata as vítimas. Precisa de uma vítima não humana presa na gaiola e de um <b>humano voluntário</b> ao lado dela.</p>
				<ol>
					<li>Lorelei entoa a oração.</li>
					<li>Relâmpago e sangue: o humano morre. A partir daqui, a morte de Lorelei não para o ritual.</li>
					<li>A vítima perde a 1ª característica de raça.</li>
					<li>Perde a 2ª característica de raça.</li>
					<li>Perde as restantes, cai com 0 PV estabilizada. Só um Desejo reverte.</li>
				</ol>
				<ul>
					<li>Para parar: destruir a máquina ou tirar a vítima da gaiola.</li>
					<li>Jogar Lorelei na gaiola não funciona: ela é lefou, não humana.</li>
					<li>Se Lorelei morrer, Delmond tenta o ritual com 50% de chance; na falha o humano morre e nada acontece à vítima.</li>
					<li>Funciona com humanoides, monstros (exceto lefou) e espíritos. Sílfides são destruídas. Não afeta mortos-vivos nem construtos.</li>
				</ul>`, 600),
			pagina("Desfecho", `
				<ul>
					<li>Lorelei prefere morrer a ser presa e tenta se matar se puder. Pode tentar se sacrificar para \"purificar\" um não humano (e ter uma péssima surpresa).</li>
					<li>Interrogada: conhece o nome Torgo (que apareceu como uma grande luz no céu, como o sumiço dos criminosos na Aventura 1) e diz que <b>Syvarian</b> é um comandante de média patente que lidera criminosos, está nas Colinas e tem um exército. Não sabe onde.</li>
					<li>Metade da aldeia colaborou com a Supremacia e com o culto à Tormenta (crimes de morte). Muitos fogem, outros pedem clemência ou fingem que nada aconteceu.</li>
					<li>Annabel quer executar os aldeões e ataca quem foi violento com ela; Grena ou os heróis conseguem detê-la.</li>
					<li>O ${L(itemPorNome("Lampião"))} vale T$ 300 em matéria-prima.</li>
				</ul>`, 700)
		]
	});

	ui.notifications.info("Aventura 3 criada: 20 atores, itens, diário, tabela e 4 macros. Veja a pasta \"" + NOME_PASTA + "\".");
})();
