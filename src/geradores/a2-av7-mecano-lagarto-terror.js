/* =====================================================================
 * FIM DOS TEMPOS · ARCO 2 · AVENTURA 7 · "O ATAQUE DO MECANO-LAGARTO-TERROR DE 50 METROS DE ALTURA"
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Arco 2 · Av7 · O Ataque do Mecano-Lagarto-Terror" com:
 *      - Ameaças: Ghorskander (vilão final do arco), Torgo, o Mecano-Lagarto-Terror (as armas
 *        do monstro) e um ator-objeto para cada ponto fraco, ninho de metralhadoras e lança-mísseis.
 *      - Itens: suprimentos da Guarita, benefícios de Lei & Ordem e de "Eu <3 Valkaria".
 *      - Tabelas: Situações em Valkaria (1d12) e NPCs (d100).
 *      - Diário com guia, Caminho de Destruição, as 12 situações, os segmentos do monstro,
 *        a luta contra Ghorskander e o desfecho.
 *      - Macros: Caminho de Destruição, Situação em Valkaria, Escalar e Sabotar, Defesas do
 *        Mecano-Lagarto-Terror, Ghorskander em Combate e Suprimentos da Guarita.
 *   3. Lei & Ordem continua no ator e na macro criados pela Aventura 0 (não são recriados aqui).
 *      Os enxames de dragões do esgoto são os da Aventura 5.
 *   4. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "a2av7".
 *
 * Feito a partir do código do sistema (1.6.4, out/2026). Validado no Foundry simulado do
 * módulo giriarpg-fim-dos-tempos; veja o guia a2-av7-mecano-lagarto-terror.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "a2av7";
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
			window: { title: "Aventura 7 do Arco 2: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para a Aventura 7 do Arco 2.</p>
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
	const NOME_PASTA = "FdT · Arco 2 · Av7 · O Ataque do Mecano-Lagarto-Terror";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#7a4a1e", flags: FLAGS() })).id;
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
		kliren: `${T20I}/racas/kliren.webp`,
		lagarto: `${T20I}/ameacas/dragao-rei.png`,
		golem: `${T20I}/ameacas/golem-de-ferro.png`,
		engenho: `${T20I}/ameacas/engenho-de-guerra-goblin.png`,
		garras: `${PA}/garras.webp`,
		garra: `${PA}/garra.webp`,
		ferrao: `${PA}/ferrao.webp`,
		pancada: `${PA}/pancada.webp`,
		cauda: `${PA}/cauda.webp`,
		pisotear: `${PA}/quebrar-tudo.webp`,
		sopro: `${PA}/sopro.webp`,
		olhar: `${PA}/olhar-petrificante.webp`,
		agarrar: `${PA}/agarrar.webp`,
		medo: `${PA}/aura-aterradora.webp`,
		relogio: `${PA}/percepcao-temporal.webp`,
		veneno: `${PA}/veneno.webp`,
		furia: `${PA}/odio-puro.webp`,
		metralhadora: `${T20I}/itens/equipamentos/pistola.webp`,
		missil: `${T20I}/itens/equipamentos/mosquete.webp`,
		explosao: `${T20I}/magias/explosao-de-chamas.webp`,
		relampago: `${T20I}/magias/relampago.webp`,
		engrenagens: `${T20I}/itens/gerais/engrenagens.webp`,
		laudano: `${T20I}/itens/itens-magicos/pocao-granada.webp`,
		maleta: `${T20I}/itens/gerais/maleta-de-medicamentos.webp`,
		pocao: `${T20I}/itens/itens-magicos/pocao.webp`,
		poAzul: `${T20I}/itens/gerais/bolsa-de-po.webp`,
		valkaria: `${T20I}/magias/heroismo.webp`,
		lei: `${T20I}/magias/circulo-da-justica.webp`,
		velocidade: `${T20I}/magias/velocidade.webp`,
		reparo: `${T20I}/magias/curar-ferimentos.webp`
	};
	const ARTE_A1 = "modules/giriarpg-fim-dos-tempos/assets/arco1/av4-terror";
	const TITANICO = "Devido ao tamanho quase titânico do Mecano-Lagarto-Terror, este efeito <b>ignora qualquer redução de dano</b>.";

	/* ------------------------------------------------------------------ */
	/* 2. Ameaças                                                           */
	/* ------------------------------------------------------------------ */
	const atores = {};

	atores.ghorskander = await criarNPC({
		name: "Ghorskander",
		role: "ghorskander",
		link: true,
		img: ICO.kliren,
		nd: 12,
		cd: 35,
		tipo: "hum",
		raca: "kliren",
		papel: "solo",
		atr: { for: 0, des: 3, con: 4, int: 6, sab: 2, car: 2 },
		pv: 435,
		def: 41,
		walk: 9,
		sentidos: ["escuro"],
		pericias: { inic: 13, perc: 12, fort: 20, refl: 12, vont: 26, luta: 34, conh: 16, cura: 18, inve: 16, mist: 16, alqu: 19, arte: 17 },
		ic: ["sangrando", "veneno"],
		res: { dano: { base: 5 } },
		resTxt: "Evasão, imunidade a sangramento e veneno, redução de dano 5, resistência a efeitos mentais e medo +3.",
		ataquesTxt: "Garras-bisturi +34 (2d12+35, 17) e garra-injetora +34 (2d8+35, ×3).",
		equipTxt: "Instrumentos de ofício (alquimista e artesão) aprimorados, maleta de medicamentos aprimorada.",
		bio: p("Vilão final do Arco 2: o oficial médico da Roca. Kliren alto e esquálido, de cartola, capa e avental sujo de sangue; lâminas e instrumentos cirúrgicos se misturam aos incontáveis dedos. A parte de trás do crânio é achatada: é o mostrador de um relógio.",
			"Pragmático e materialista, foi o único a votar contra preservar o Cofre Encarnatório. Mudou ao ajudar Vesper nos experimentos: hoje é devotado à missão e, mais ainda, ao prazer macabro das cirurgias. Viu a relação com Lakshrimi como um experimento social e a convenceu a sacrificar o próprio corpo.",
			"Despreza os heróis, não tem honra nem apreço pela própria vida: mira primeiro o aventureiro mais frágil. Interprete alguém tão superior que nem chega a ser arrogante, como quem leva um animal ao veterinário.",
			"<b>Só luta depois que três segmentos forem desativados.</b> Antes disso, viaja por dentro do corpo do monstro. Se a nobreza abandonar Valkaria (10 hexágonos destruídos), tenta fugir e deixa Torgo para deter o grupo; nesse caso volta no Arco 3."),
		effects: [
			aoUsar("Resistência a mental e medo (+3)", ICO.medo, [["roll", 3]], ["skill"], ["Vontade"]),
			aoUsar("Engenhosidade (+6, 1×/rodada)", ICO.engrenagens, [["roll", 6]], ["skill"]),
			chave("Forma Final", ICO.relogio, [], false, "A cabeça girou: uma face de relógio no lugar do rosto. Ganha Mãos Independentes e Tique-Taque Dominador continua.")
		],
		items: [
			arma("Garras-bisturi", ICO.garras, { dano: "2d12+35", tipo: "corte", critM: 17, effects: [cond("Lento"), cond("Vulnerável")],
				desc: p("<b>Romper Tendões:</b> num acerto crítico, a vítima fica <b>lenta e vulnerável</b> (botões no card).", "Acertar recarrega o Surto Serotônico.") }),
			arma("Garra-injetora", ICO.ferrao, { dano: "2d8+35", tipo: "perfuracao", critX: 3,
				effects: [fx("Injetor Parasitário (–1 em perícias)", ICO.veneno, [["system.pericias.*.bonus", "-1"]], { description: "Penalidade cumulativa de –1 em testes de perícia até o fim da cena. Aplique uma vez por acerto." })],
				desc: p("<b>Injetor Parasitário:</b> quem é atingido sofre –1 cumulativo em testes de perícia até o fim da cena (botão no card; aplique uma vez por acerto).") }),
			poder("Forma Final", ICO.relogio,
				p("<b>Reação.</b> Na primeira vez em cada cena em que é reduzido a 145 PV ou menos, assume a forma final até o fim da cena: os PV se tornam <b>145</b> e uma enorme face de relógio toma o lugar do rosto. Quem vê fica <b>abalado</b> (Vontade CD 35 evita). Ganha Mãos Independentes. A macro <i>Ghorskander em Combate</i> faz tudo isso."),
				{ exec: "reaction", save: "Vontade CD 35 evita", effects: [cond("Abalado")] }),
			poder("Mãos Independentes", ICO.agarrar,
				p("<b>Movimento. Só na forma final. Recarga (movimento).</b> As mãos flutuam até uma criatura em alcance curto e tentam agarrá-la (teste +34). Se passarem, apertam a garganta: a vítima fica em condição terrível para lançar magias e começa a sufocar. Se falharem, ou se o alvo se soltar, voltam para Ghorskander."),
				{ exec: "move", alcance: "short", alvo: "1 criatura", effects: [cond("Agarrado")] }),
			poder("Tique-Taque Dominador", ICO.relogio,
				p("<b>Padrão. Uma vez por cena.</b> O relógio produz um som ritmado. Criaturas em alcance médio sob efeito do Injetor Parasitário ficam <b>confusas</b> (Vontade CD 35 evita)."),
				{ exec: "action", alcance: "medium", save: "Vontade CD 35 evita", effects: [cond("Confuso")] }),
			poder("Láudano Mentagênico", ICO.laudano,
				p("<b>Padrão. Recarga (movimento).</b> Arremessa um preparado alquímico que explode numa esfera de 3m em alcance curto: <b>8d8 de dano psíquico</b> e <b>alquebrado</b> (Vontade CD 35 reduz à metade e evita a condição)."),
				{ exec: "action", alcance: "short", area: "esfera de 3m de raio", save: "Vontade CD 35 reduz à metade e evita", rolls: [["Láudano", [["8d8", "psiquico"]]]], effects: [cond("Alquebrado")] }),
			poder("Engenhosidade", ICO.engrenagens, p("<b>Reação. Uma vez por rodada.</b> Soma a Inteligência (+6) num teste de perícia (marque o bônus na janela de rolagem)."), { exec: "reaction" }),
			poder("Surto Serotônico", ICO.velocidade,
				p("<b>Livre. Uma vez por rodada.</b> Percorre até 18m instantaneamente, inclusive por superfícies verticais e ignorando terreno difícil (mas não paredes). Recarga (acertar um ataque com garra-bisturi)."),
				{ exec: "free" }),
			poder("Ossos Frágeis", `${PA}/vulnerabilidade.webp`, p("Sofre <b>1 ponto de dano adicional por dado</b> de dano de impacto (some na mão)."), { exec: "passive" }),
			poder("Evasão", `${PA}/visao-ampla.webp`, p("Quando sofre um efeito que permite Reflexos para reduzir o dano à metade, não sofre dano se passar."), { exec: "passive" })
		]
	});

	atores.torgo = await criarNPC({
		name: "Torgo (Arco 2)",
		tokenName: "Torgo",
		role: "torgo",
		img: `${ARTE_A1}/torgo.webp`,
		token: `${ARTE_A1}/torgo-token.webp`,
		nd: 10,
		cd: 30,
		tipo: "con",
		raca: "golem",
		papel: "solo",
		atr: { for: 6, des: 3, con: 5, int: 0, sab: 1, car: -2 },
		pv: 400,
		def: 36,
		walk: 9,
		sentidos: ["escuro"],
		pericias: { inic: 12, perc: 12, fort: 22, refl: 14, vont: 12, acro: 14, atle: 20, luta: 29 },
		res: { dano: { base: 5 }, eletricidade: { imunidade: true } },
		resTxt: "Imunidade a eletricidade, redução de dano 5.",
		ataquesTxt: "Pancada ×2 +29 (2d8+17 mais 4d6 eletricidade).",
		equipTxt: "Poção de relâmpago (aprimoramento para alcance médio e alvo: criaturas escolhidas).",
		bio: p("O golem em forma de gorila está de volta: a tripulação da Roca usa o fato de Torgo ter vários corpos para tê-lo sempre à mão como bucha de canhão. No Mecano-Lagarto-Terror, corre pelas plataformas do tronco e, se ainda estiver de pé, defende a cabeça.",
			"Só pode ser redimido ou libertado se o grupo tiver acesso às memórias ou à \"alma\" dele. Convencê-lo ou derrotá-lo em combate só faz com que volte mais uma vez.",
			"Deslocamento 9m, escalada 9m."),
		effects: [chave("Fúria (+5 ataque e dano)", ICO.furia, [["system.modificadores.ataque.geral", "5"], ["system.modificadores.dano.geral", "5"]], false,
			"Termina se, ao fim da rodada, Torgo não atacou nem foi alvo de efeito hostil. Recarga (matar uma criatura).")],
		items: [
			arma("Pancada (×2)", ICO.pancada, { dano: "2d8+17", tipo: "impacto", extra: [["4d6", "eletricidade"]], desc: p("Dois ataques por ação padrão.") }),
			poder("Canalizar Reparos", ICO.reparo, p("<b>Movimento. Recarga (movimento).</b> Recupera <b>40 PV</b>."), { exec: "move", rolls: [["Reparos", [["40", "curapv"]]]] }),
			poder("Espírito Elemental", ICO.relampago,
				p("Se for sofrer dano mágico de eletricidade, em vez disso recupera metade desse dano em PV e, até o fim do próximo turno, as pancadas e o Olhar Elétrico causam <b>+1d6 de eletricidade</b>."), { exec: "passive" }),
			poder("Fúria", ICO.furia,
				p("<b>Livre. Recarga (matar uma criatura).</b> +5 em testes de ataque e rolagens de dano corpo a corpo, mas não pode fazer ações que exijam calma (como Furtividade). Termina se, ao fim da rodada, não atacou nem foi alvo de um efeito hostil. Ligue o efeito na aba de efeitos."), { exec: "free" }),
			poder("Olhar Elétrico", ICO.olhar,
				p("<b>Movimento. Recarga (movimento).</b> Rajada elétrica dos olhos numa linha de 9m: <b>12d6 de eletricidade</b> (Reflexos CD 30 reduz à metade)."),
				{ exec: "move", area: "linha de 9m", save: "Reflexos CD 30 reduz à metade", rolls: [["Olhar elétrico", [["12d6", "eletricidade"]]]] })
		]
	});
	await atores.torgo.update({ "system.attributes.movement.climb.base": 9 });

	/* ---------- o monstro ---------- */
	atores.mecano = await criarNPC({
		name: "Mecano-Lagarto-Terror de 50 Metros de Altura",
		tokenName: "Mecano-Lagarto-Terror",
		role: "mecano",
		link: true,
		img: ICO.lagarto,
		tokenSize: 6,
		nd: 12,
		cd: 32,
		tipo: "mon",
		papel: "solo",
		tamanho: "col",
		atr: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
		pv: 1,
		def: 10,
		walk: 30,
		pericias: { luta: 28 },
		ic: ["mental"],
		resTxt: "Não pode ser atacado diretamente: só os pontos fracos dos segmentos (atores à parte). Efeitos que impõem penalidades não funcionam contra o monstro.",
		ataquesTxt: "Garra +28 (4d12+16 corte, 19), contra todas as criaturas num ombro ou na cabeça.",
		recursos: { primary: { label: "Segmentos desativados", value: 0, max: 4 } },
		bio: p("Um lagarto-terror de Galrasia com partes metálicas, metralhadoras giratórias e lança-mísseis, materializado a partir da raiva dos valkarianos pelos Imagodutos de Ghorskander (projeto baseado nas pesquisas de Khenzarr). O único objetivo é destruir o bastante para a nobreza abandonar a capital e ir para o Dr. Vesper.",
			"Este ator guarda as armas do monstro inteiro. Os PV não importam: cada segmento é um <b>objeto Colossal com RD 10</b> e tem um ponto fraco próprio (os atores <i>Ponto Fraco</i>). Para vencê-lo, desative <b>quatro segmentos</b> quaisquer (a cabeça conta como dois). O recurso conta os segmentos desativados.",
			"Segmentos: pernas e cauda (acessíveis do chão), tronco (cinco mecanismos), braços (dois ombros) e cabeça (sopro e dois olhos)."),
		items: [
			arma("Garra", ICO.garra, { dano: "4d12+16", tipo: "corte", critM: 19,
				desc: p("Cada braço funcional faz <b>um</b> ataque, contra <b>todas</b> as criaturas num ombro (o do lado oposto) ou na cabeça (contagem 10): uma rolagem comparada com a Defesa de cada uma.", TITANICO, "A macro <i>Defesas do Mecano-Lagarto-Terror</i> aplica.") }),
			poder("Pisotear", ICO.pisotear,
				p("Antes de começar a subir pelas pernas, criaturas Grandes ou menores são pisoteadas: <b>12d6 de impacto</b> (Reflexos CD 32 reduz à metade).", TITANICO, "Não acontece mais se as pernas forem desabilitadas."),
				{ exec: "reaction", save: "Reflexos CD 32 reduz à metade", rolls: [["Pisão", [["12d6", "impacto"]]]] }),
			poder("Golpe de Cauda", ICO.cauda,
				p("Antes de começar a subir pela cauda, criaturas Grandes ou menores sofrem <b>8d6 de impacto</b> e são empurradas 1 hexágono para trás (Reflexos CD 33 reduz à metade e evita o empurrão).", TITANICO, "Não acontece mais se a cauda for desabilitada."),
				{ exec: "reaction", save: "Reflexos CD 33 reduz à metade e evita o empurrão", rolls: [["Cauda", [["8d6", "impacto"]]]] }),
			poder("Sacudir a Cauda", ICO.cauda,
				p("No fim de cada rodada, quem ainda está escalando a cauda faz Atletismo ou Reflexos CD 33. Falha: <b>4d6 de impacto</b>. Falha por 5 ou mais: também é arremessado e cai da altura que tinha escalado."),
				{ exec: "reaction", save: "Atletismo ou Reflexos CD 33", rolls: [["Sacudida", [["4d6", "impacto"]]]] }),
			poder("Descargas das Plataformas", ICO.relampago,
				p("No início de cada turno, quem está nas plataformas de manutenção das pernas sofre <b>4d6 de eletricidade</b> e fica <b>ofuscado</b> por 1 rodada (Reflexos CD 32 evita o dano e a condição)."),
				{ exec: "reaction", save: "Reflexos CD 32 evita", rolls: [["Descarga", [["4d6", "eletricidade"]]]], effects: [cond("Ofuscado")] }),
			poder("Sopro de Fúria", ICO.sopro,
				p("<b>Contagem de iniciativa 20, uma vez por rodada.</b> Cone de 9m de poluição, energia mágica e ódio destilado: <b>8d6 de essência</b>; para cada 6 nos dados, a criatura também <b>perde 1 PM</b> (Reflexos CD 30 reduz o dano à metade e evita a perda de PM).", TITANICO,
					"Quem chega a 0 PM assim entra em frenesi: só pode atacar fisicamente um alvo aleatório até recuperar 1 PM. Quem está desabilitando o sopro falha automaticamente."),
				{ exec: "reaction", area: "cone de 9m", save: "Reflexos CD 30 reduz à metade e evita a perda de PM", rolls: [["Sopro", [["8d6", "essencia"]]]] }),
			poder("Raios Oculares", ICO.olhar,
				p("<b>Contagem de iniciativa 15.</b> Cada olho dispara um raio numa criatura em alcance médio: <b>6d6 de luz</b> e <b>ofuscado</b> por 1 rodada (Fortitude CD 30 evita a condição).", TITANICO, "Quem está desabilitando um olho falha automaticamente."),
				{ exec: "reaction", alcance: "medium", save: "Fortitude CD 30 evita a condição", rolls: [["Raio", [["6d6", "luz"]]]], effects: [cond("Ofuscado")] }),
			poder("Lagarto Teimoso", ICO.velocidade,
				p("Até três vezes (uma por rodada), avança um hexágono adicional, mesmo que o grupo tenha usado Lei & Ordem para detê-lo. Não destrói esse hexágono e <b>sacrifica os ninhos de metralhadoras de um ombro</b>. A macro <i>Caminho de Destruição</i> controla."), { exec: "passive" }),
			poder("Equilíbrio Abalado", ICO.cauda, p("Com a cauda desabilitada, a CD de todos os efeitos do monstro cai em –2 (as macros descontam)."), { exec: "passive" }),
			poder("Matéria de Ódio", ICO.furia, p("Feito das emoções violentas dos valkarianos. Depois que o tronco é desativado, não se rolam mais situações quando o monstro avança."), { exec: "passive" })
		]
	});

	/* ---------- pontos fracos e defesas (objetos) ---------- */
	const OBJETO = "<b>Objeto.</b> Ataque normalmente ou sabote com uma ação completa: Ladinagem ou Ofício (engenhoqueiro) CD 25, e o ponto fraco perde PV iguais ao resultado (macro <i>Escalar e Sabotar</i>).";
	const segmento = (role, name, tokenName, def, pv, rd, bio, extra = {}) => criarNPC({
		name, tokenName, role, img: extra.img ?? ICO.engenho, nd: 12, cd: 32, tipo: "con", papel: "special", tamanho: extra.tamanho ?? "col", tokenSize: extra.tokenSize ?? 2,
		atr: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 }, pv, def, walk: 0, ic: ["mental", "metabolismo", "cansaco"],
		pericias: extra.pericias ?? {}, res: rd ? { dano: { base: rd } } : {}, resTxt: rd ? `Redução de dano ${rd}.` : "", bio: p(...bio, extra.sabotar ?? OBJETO), items: extra.items ?? []
	});
	atores.pernas = await segmento("seg-pernas", "Ponto Fraco · Pernas (plataformas de manutenção)", "Pernas", 28, 500, 10, [
		"Plataformas de manutenção a <b>20m de altura</b>, sem passarelas: escalar a superfície escamosa é Atletismo CD 25 (ou voe, ou teletransporte). Antes de subir, criaturas Grandes ou menores são pisoteadas (12d6, Reflexos CD 32).",
		"Defesas: dois ninhos de metralhadoras nos joelhos (meia altura) no fim de cada rodada e descargas de 4d6 de eletricidade no início de cada turno de quem está nas plataformas.",
		"Não é obrigatório desabilitar: das plataformas dá para seguir para o tronco. <b>Desabilitado:</b> o monstro fica com metade da velocidade (10 rodadas de combate por hexágono) e não pisoteia mais quem volta."
	]);
	atores.cauda = await segmento("seg-cauda", "Ponto Fraco · Cauda (escotilha de manutenção)", "Cauda", 26, 450, 10, [
		"Escotilha logo abaixo da cintura, a <b>20m de altura</b>. Escalar a cauda é mais fácil: Atletismo CD 22. Antes de subir, golpe de cauda (8d6, Reflexos CD 33, empurra 1 hexágono).",
		"Quatro plataformas a meia altura, cada uma com um lança-mísseis. No fim de cada rodada, quem ainda está escalando faz Atletismo ou Reflexos CD 33 (4d6; falha por 5 ou mais, cai).",
		"<b>Desabilitada:</b> –2 na CD de todos os efeitos do monstro e não há mais golpe de cauda."
	]);
	atores.tronco = await segmento("seg-tronco", "Ponto Fraco · Mecanismo do Tronco", "Mecanismo do Tronco", 15, 250, 0, [
		"O tronco tem <b>cinco</b> mecanismos de movimentação (coloque cinco tokens; alcançar cada um é uma ação de movimento). Destruídos os cinco, o tronco é desativado.",
		"Não precisa de escalada a partir das pernas ou da cauda; do tronco se anda livremente para os braços. Defesas: dois ninhos de metralhadoras, quatro lança-mísseis, <b>quatro enxames de dragões do esgoto</b> e Torgo.",
		"<b>Desativado:</b> o ódio concentrado se desfaz e a cidade começa a voltar ao normal: não role mais situações a cada hexágono."
	], { tamanho: "eno", tokenSize: 1 });
	atores.ombro = await segmento("seg-ombro", "Ponto Fraco · Mecanismos do Ombro", "Ombro", 30, 350, 10, [
		"Cada braço tem um ombro (coloque dois tokens). Há plataformas e passarelas: não precisa de Atletismo para circular entre os braços e o tronco. Cada ombro tem dois ninhos de metralhadoras e dois lança-mísseis.",
		"A garra de um braço defende o ombro oposto: um ataque +28 (4d12+16, 19, ignora RD) contra <b>todos</b> naquele ombro.",
		"Destruir um ombro inutiliza aquela garra. Os dois juntos desabilitam o segmento e impedem que os braços defendam a cabeça."
	], { tokenSize: 2 });
	atores.sopro = await segmento("seg-sopro", "Ponto Fraco · Sopro de Fúria", "Sopro de Fúria", 28, 150, 0, [
		"Na cabeça (a 10m de escalada do tronco ou dos braços, Atletismo CD 25; pelas costas, 20m mas sem os ataques das garras). A cabeça não tem um ponto fraco único: é desabilitada quando o sopro, os dois olhos e os defensores caem.",
		"Quem está desabilitando o sopro fica de frente para ele e <b>falha automaticamente</b> na resistência.",
		"Destruir a cabeça conta como desabilitar <b>dois</b> segmentos. Ao chegar à cabeça, o monstro para de andar por Valkaria."
	], { img: ICO.explosao, tamanho: "gra", tokenSize: 1 });
	atores.olho = await segmento("seg-olho", "Ponto Fraco · Olho", "Olho", 25, 100, 0, [
		"Cada olho (coloque dois tokens) dispara um raio ocular na contagem 15: 6d6 de luz e ofuscado (Fortitude CD 30 evita a condição), ignorando RD.",
		"Quem está desabilitando um olho fica de frente para ele e <b>falha automaticamente</b> na resistência."
	], { img: ICO.olhar, tamanho: "gra", tokenSize: 1 });
	atores.ninho = await segmento("ninho", "Ninho de Metralhadoras", "Ninho de Metralhadoras", 35, 60, 5, [
		"Objeto Grande espalhado pelo corpo. Dispara <b>duas vezes por rodada</b> na última contagem de iniciativa, contra dois personagens diferentes sorteados: +32 (4d8 de perfuração, 19/×3, alcance longo).",
		"Pernas: 2 (joelhos). Tronco: 2. Cada ombro: 2. Lagarto Teimoso sacrifica os ninhos de um ombro."
	], { img: ICO.metralhadora, tamanho: "gra", tokenSize: 1, pericias: { pont: 32 }, sabotar: "Destrua causando dano ou sabote com Ladinagem ou Ofício (engenhoqueiro) CD 30 (macro <i>Escalar e Sabotar</i>).",
		items: [distancia("Metralhadora Giratória (×2)", ICO.metralhadora, { dano: "4d8", tipo: "perfuracao", critM: 19, critX: 3, alcance: "long", desc: p("Dois disparos por rodada, na última contagem, contra dois alvos sorteados.") })] });
	atores.missil = await segmento("missil", "Lança-Mísseis", "Lança-Mísseis", 35, 60, 5, [
		"Plataforma de bombas autopropelidas guiadas por tecnologia mágica. Objeto Grande que dispara <b>uma vez por rodada</b>, na última contagem, contra uma criatura a até 90m: <b>6d10 de impacto</b> e –2 cumulativo em todos os testes por 1 rodada (Reflexos CD 30 reduz à metade e evita a penalidade).",
		"Cauda: 4. Tronco: 4. Cada ombro: 2."
	], { img: ICO.missil, tamanho: "gra", tokenSize: 1, sabotar: "Destrua causando dano ou sabote com <b>Ladinagem</b> CD 30 (macro <i>Escalar e Sabotar</i>).",
		items: [poder("Míssil", ICO.explosao, p("Uma criatura a até 90m: 6d10 de impacto e –2 em todos os testes por 1 rodada, cumulativo (Reflexos CD 30 reduz à metade e evita a penalidade)."),
			{ exec: "reaction", alcance: "long", save: "Reflexos CD 30 reduz à metade e evita a penalidade", rolls: [["Míssil", [["6d10", "impacto"]]]],
				effects: [fx("Míssil (–2 em testes)", ICO.explosao, [["system.pericias.*.bonus", "-2"]], { duration: { value: 1, units: "rounds" }, description: "–2 em todos os testes por 1 rodada (cumulativo)." })] })] });
	// Os pontos fracos não andam nem fazem testes.
	for (const k of ["pernas", "cauda", "tronco", "ombro", "sopro", "olho", "ninho", "missil"]) await atores[k].update({ "system.attributes.movement.walk.base": 0 });

	const enxameAv5 = game.actors.find((a) => a.getFlag("world", "fdt") === "a2av5" && a.getFlag("world", "fdtRole") === "enxame");
	const alfaAv5 = game.actors.find((a) => a.getFlag("world", "fdt") === "a2av5" && a.getFlag("world", "fdtRole") === "alfa");

	/* ------------------------------------------------------------------ */
	/* 3. Itens                                                             */
	/* ------------------------------------------------------------------ */
	const itemDoc = (d, role) => ({ ...d, folder: pasta.Item, flags: FLAGS(role) });
	const consumivel = (role, name, img, tipo, html, o = {}) => itemDoc({
		name, type: "consumivel", img,
		system: {
			description: { value: html }, tipo, qtd: 1, preco: o.preco ?? 0, peso: 0, espacos: 0.5, subtipo: "",
			ativacao: { execucao: o.exec ?? "action", custo: 0, qtd: "", condicao: "", special: "" },
			duracao: { value: 0, units: "inst", special: "" },
			rolls: (o.rolls ?? []).map((r, i) => rolagem(r[0], r[1], i))
		}
	}, role);
	const textoPoder = (role, name, img, html) => itemDoc(poder(name, img, html, { exec: "passive" }), role);

	const novosItens = [
		consumivel("pocao", "Poção de Curar Ferimentos (Guarita da Praia)", ICO.pocao, "potion",
			p("Recupera <b>11d8+11 PV</b>. Valkaria está em caos e a Guarita da Praia abre todos os recursos: quem passa um turno lá recebe uma (macro <i>Suprimentos da Guarita</i>)."),
			{ rolls: [["Cura", [["11d8+11", "curapv"]]]] }),
		consumivel("po-azul", "Pó Azul", ICO.poAzul, "alchemy",
			p("Preparado alquímico originário de Galrasia. Consumir é uma <b>ação completa</b> que recupera <b>2d4 PM</b>. A Guarita da Praia dá uma dose para cada um."),
			{ exec: "full", rolls: [["PM recuperados", [["2d4", "curapm"]]]] }),
		textoPoder("lo-beneficios", "Benefícios de Lei & Ordem (excesso)", ICO.lei,
			p("Se a aventura começa sem o contador chegar a 0, cada ponto restante vira um benefício, a qualquer momento:") +
			`<ul><li>Um personagem recupera <b>4d8+4 PV</b> ou <b>2d4 PM</b> (1 ponto).</li><li>Rolar de novo um teste de perícia recém-feito, uma vez por teste (1 ponto).</li><li>O monstro não se move nesta rodada: 2 pontos, +2 a cada uso (2, 4, 6...).</li><li>Valkaria resiste a 1 hexágono destruído a mais antes de a nobreza ir embora: 1 ponto, +1 a cada uso (1, 2, 3...).</li><li>Anular a abominação dos cultistas (1 ponto).</li></ul>` +
			p("A macro <i>Caminho de Destruição</i> desconta do ator Lei & Ordem.")),
		textoPoder("eu-valkaria", "Eu <3 Valkaria", ICO.valkaria,
			p("Durante ou logo antes da luta contra Ghorskander, de preferência quando o grupo leva a pior: valkarianos surgem nas janelas, nas ruas, em naves aéreas e telhados, vaiam o oficial médico, jogam frutas podres e gritam os nomes dos heróis. Use só se o grupo teve apreço pela cidade.",
				"Cada aventureiro escolhe um benefício:") +
			`<ul><li>Os efeitos de uma noite de descanso em acomodações normais.</li><li>O efeito de uma atividade em Valkaria qualquer.</li><li>O efeito de um parceiro veterano qualquer (algum valkariano sabe fazer o que é preciso).</li></ul>` +
			p("Ou, se todos concordarem, abrem mão disso em troca dos <b>efeitos de estar na base do grupo</b>: toda Valkaria conta como a base durante o combate.")),
		textoPoder("velozes", "Velozes e Valorosos", ICO.velocidade,
			p("Quem tem acesso <b>o tempo todo</b> a um meio rápido de atravessar a capital avança um hexágono adicional numa única rodada (sem situação nesse hexágono). Não sugira: deixe os jogadores lembrarem.") +
			`<ul><li>Carroça de Lagarto Interno.</li><li>Amizade com Wynstar (o unicórnio teletransporta o grupo).</li><li>Justine eleita (telhados sem sapé mais acessíveis).</li><li>Amizade com o Avatar da Cidade.</li><li>Amizade com Bebê Corisco.</li><li>Confiança de Janara (organiza oficiais e aventureiros).</li><li>Aliança com o Povo dos Túneis.</li><li>Amizade com Alfraye (o dinheiro compra tudo).</li></ul>`)
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
	const tabSituacoes = await tabela("Situações em Valkaria", "1d12", [
		[1, 1, "Saque", "Luta, Pontaria, Diplomacia, Intimidação ou Misticismo CD 30, 3 sucessos."],
		[2, 2, "Quadrilha", "Luta, Pontaria, Diplomacia, Intimidação ou Misticismo CD 32, 4 sucessos."],
		[3, 3, "Desabamento", "Atletismo CD 30, 3 sucessos."],
		[4, 4, "Incêndio", "Fortitude CD 32, 4 sucessos."],
		[5, 5, "Monstros à Solta", "Adestramento CD 32, 3 sucessos."],
		[6, 6, "Infestação de Mortos-Vivos", "Luta, Pontaria, Misticismo ou Religião CD 33, 4 sucessos. Não pode ser ignorada."],
		[7, 7, "Alagamento de Poções", "Fortitude, Ofício (alquimista) ou Reflexos CD 32, 3 sucessos."],
		[8, 8, "Área de Magia Selvagem", "Fortitude, Reflexos, Vontade ou Misticismo CD 33, 4 sucessos."],
		[9, 9, "Tumulto", "Diplomacia, Guerra ou Intimidação CD 33, 3 sucessos. Role três NPCs."],
		[10, 10, "Batalha Campal", "Diplomacia, Guerra, Intimidação, Luta, Misticismo ou Pontaria CD 35, 3 sucessos por grupo. Três NPCs. Não pode ser ignorada."],
		[11, 11, "Aventureiros em Pânico", "Três perícias sorteadas (Tabela 6-6), CD 33, 4 sucessos."],
		[12, 12, "Cultistas", "Luta, Misticismo, Pontaria ou Religião CD 35, 5 sucessos."]
	], "Sempre que o grupo entra num hexágono. Cada personagem faz um único teste; três falhas ou não juntar os sucessos é fracasso. Use a macro Situação em Valkaria.", ICO.explosao, "situacoes");
	const NPCS = [
		"Gnuk", "Farboraff e Brungamm", "Wynstar", "Drelene", "Yolana", "Galswell Montasmant", "Justine",
		["Os Goblins da Gazeta do Reinado", "Salvá-los dá +2 em um teste de perícia de cada personagem até o fim da fase 1."],
		["Uma clériga e duas crianças do Orfanato das Pobres e Desgraçadas Crianças Infelizes", "Ignorar uma situação com eles: cada personagem perde 1d4 PM (remorso)."],
		"Bebê Corisco", "Anatole",
		["Um lutador das qualificatórias da Arena de Valkaria", "Salvá-lo dá +2 em um teste de Luta até o fim da fase 1."],
		"Xerife Mathilda Nolt", ["Dra. Zymni", "Salvá-la recupera 10 PV de cada personagem."], "Ulnsariann", "Throgarimm", "Saeba", "Hannah", "Finley", "Tullia Blasanov", "Berthun",
		"Blixto Arting", "Basil Arting", "Felicia Daratramm", "Aldanna", "Albert", "Grug (Alvuriell)", "Ysmenne", "Os membros da SPIMA", "Farhuk", "Click e Drasala",
		"Banda Naxia e os Monstros Errantes", "Banda Brasão de Kor Kovith", "Banda Tarsos", "Banda Reles Rancor", "Vyrgillia de Azgher", "Senomar", "Banda Crânio de Pedra",
		"Marquês Vladmir Mors", "Fido", "Ellan'grag'dakrimm e Gausblopparesmme", "Duquesa Alfraye Oppulak de Trylon e Foltomett", "Torzogh Meio-Machado e mais um dos Mata-Malvados",
		"Janara", "Rolthurr e Mazynne", "Dorothea Millicent", "Um jovem nobre sobrevivente do Baile da Primavera", "Um NPC trazido das Colinas Centrais",
		["Um NPC famoso ou lendário à sua escolha", "Se morrer na situação, sobrevive, mas cada personagem perde 2d4 PM."],
		["NPC enfurecido", "Role de novo: o NPC está enfurecido e ataca o grupo. Não dá para ignorar a situação, +5 nas CD e cada teste falho custa 2d6 PV."]
	];
	const tabNpcs = await tabela("NPCs em Valkaria (situações)", "1d100",
		NPCS.map((n, i) => [i * 2 + 1, i * 2 + 2, Array.isArray(n) ? n[0] : n, Array.isArray(n) ? n[1] : ""]),
		"Role um NPC por situação (três no Tumulto e na Batalha Campal). Ignore NPCs mortos, presos, ausentes ou que já estejam com o grupo. NPCs poderosos estão feridos ou exaustos e precisam ser salvos.", `${T20I}/itens/gerais/diario.webp`, "npcs");

	/* ------------------------------------------------------------------ */
	/* 5. Macros                                                            */
	/* ------------------------------------------------------------------ */

	async function macroCaminho() {
		const CHAVE = "fdtMecano";
		const SEG = { pernas: "Pernas", cauda: "Cauda", tronco: "Tronco", bracoE: "Braço esquerdo (ombro)", bracoD: "Braço direito (ombro)", cabeca: "Cabeça (conta como dois)" };
		const BENEF = { cura: "Curar 4d8+4 PV ou 2d4 PM (1 ponto)", rerolar: "Rolar de novo um teste de perícia (1 ponto)", parar: "O monstro não se move nesta rodada (2, 4, 6...)", resistir: "Valkaria resiste a +1 hexágono (1, 2, 3...)", abominacao: "Anular a abominação dos cultistas (1 ponto)" };
		const e = foundry.utils.mergeObject({ rodada: 0, destruidos: 0, extraLimite: 0, teimoso: 0, parado: 0, estatua: false, palacio: false, usosParar: 0, usosResistir: 0, abominacao: null, nobrezaFoi: false, seg: {} }, game.user.getFlag("world", CHAVE) ?? {}, { inplace: false });
		const desativados = () => ["pernas", "cauda", "tronco"].filter((k) => e.seg[k]).length + (e.seg.bracoE && e.seg.bracoD ? 1 : 0) + (e.seg.cabeca ? 2 : 0);
		const limite = () => 10 + e.extraLimite;
		const lo = game.actors.find((a) => a.getFlag("world", "fdtRole") === "leiordem");
		const loValor = Number(lo?.system.resources?.primary?.value) || 0;
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Caminho de Destruição" },
			content: `<p>Rodada <b>${e.rodada}</b> · hexágonos destruídos <b>${e.destruidos}/${limite()}</b> · segmentos desativados <b>${desativados()}/4</b> · Lei &amp; Ordem <b>${loValor}</b></p>
				<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="rodada">Nova rodada: o monstro avança</option>
					<option value="ascensao">A ascensão: onde o monstro surge</option>
					<option value="plano">Tudo de acordo com o plano (aventuras não resolvidas)</option>
					<option value="lo">Gastar Lei &amp; Ordem</option>
					<option value="segmento">Segmento desativado (ou reativado)</option>
					<option value="estatua">O monstro chegou à estátua de Valkaria</option>
					<option value="palacio">O monstro chegou ao Palácio Imperial</option>
					<option value="destruir">Hexágonos destruídos por uma situação</option>
					<option value="zerar">Recomeçar a aventura</option></select></div>
				<div class="form-group"><label>Benefício de Lei &amp; Ordem</label><select name="beneficio">${Object.entries(BENEF).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></div>
				<div class="form-group"><label>Segmento</label><select name="segmento">${Object.entries(SEG).map(([k, n]) => `<option value="${k}">${n}${e.seg[k] ? " (desativado)" : ""}</option>`).join("")}</select></div>
				<div class="form-group"><label>Quantidade</label><input type="number" name="qtd" value="1"></div>
				<div class="form-group"><label>Lagarto Teimoso (${e.teimoso}/3)</label><input type="checkbox" name="teimoso"></div>
				<div class="form-group"><label>O grupo está na cabeça</label><input type="checkbox" name="cabeca"></div>
				<fieldset><legend>Aventuras não resolvidas</legend>
					<label><input type="checkbox" name="av1"> Av1</label> <label><input type="checkbox" name="av3"> Av3</label>
					<label><input type="checkbox" name="av5"> Av5</label> <label><input type="checkbox" name="av6"> Av6</label></fieldset>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "zerar") {
			await game.user.unsetFlag("world", CHAVE);
			return ui.notifications.info("Caminho de Destruição recomeçado.");
		}
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r.total; };
		const DIRECAO = ["", "para cima (face de cima do hexágono)", "para cima e à direita", "para baixo e à direita", "para baixo", "para baixo e à esquerda", "para cima e à esquerda"];
		const qtd = Math.max(1, Math.trunc(Number(res.qtd) || 1));
		let html = "";
		const checarNobreza = () => {
			if (e.destruidos >= limite() && !e.nobrezaFoi) {
				e.nobrezaFoi = true;
				html += `<p><b>${e.destruidos} hexágonos destruídos: o plano de Ghorskander deu certo.</b> A nobreza abandona a capital rumo ao Dr. Vesper. O monstro continua matando inocentes; Ghorskander tenta fugir e deixa Torgo para deter o grupo (ele volta no Arco 3).</p>`;
			}
		};
		if (res.acao === "ascensao") {
			const d = await rolar("1d6");
			const dist = await rolar("2d4");
			html += `<p>A partir do hexágono do grupo, o Mecano-Lagarto-Terror se ergue <b>${dist} hexágonos</b> ${DIRECAO[d]} (1d6 = ${d}, em sentido horário a partir da face de cima). Se cair fora das muralhas, role de novo.</p>
				<p>Na Guarita da Praia, cada personagem que passar um turno recebe uma poção de curar ferimentos e uma dose de pó azul (macro <i>Suprimentos da Guarita</i>).</p>`;
		}
		else if (res.acao === "plano") {
			const linhas = [];
			if (res.av1) linhas.push("<b>Av1:</b> mensagens subliminares. Cada personagem perde acesso às duas últimas habilidades ativáveis que adquiriu.");
			if (res.av3) linhas.push("<b>Av3:</b> a Companhia dos Irmãos tem as habilidades plenas. Antes de perseguir o monstro, o grupo enfrenta uma situação <b>Quadrilha</b> e não avança nessa rodada (o monstro avança).");
			if (res.av5) linhas.push(`<b>Av5:</b> os dragões do esgoto saem para um lanchinho. Situação <b>Monstros à Solta</b> antes de perseguir o monstro${res.av3 ? " (depois da Quadrilha)" : ""}; o grupo não avança nessa rodada.`);
			if (res.av6) { e.destruidos += 1; linhas.push("<b>Av6:</b> influenciados pelos replicoides, alguns nobres vão embora já. Valkaria sofre <b>1 hexágono</b> de dano."); }
			html += linhas.length ? `<ul>${linhas.map((l) => `<li>${l}</li>`).join("")}</ul><p style="font-size:0.85em">Se o grupo já tomou medidas contra um efeito (como cristais rosados contra as mensagens), ele não se aplica.</p>` : "<p>Nenhuma penalidade: o grupo resolveu as aventuras ligadas à trama.</p>";
			checarNobreza();
		}
		else if (res.acao === "estatua" || res.acao === "palacio") {
			const estatua = res.acao === "estatua";
			const ja = estatua ? e.estatua : e.palacio;
			if (estatua) e.estatua = true; else e.palacio = true;
			e.parado = Math.max(e.parado, 1);
			html += `<p>${estatua ? "O monstro ataca a <b>estátua de Valkaria</b> com fúria máxima (tem só um décimo do tamanho dela)." : "O monstro ataca o <b>Palácio Imperial</b>, o centro do poder do Reinado."} Este hexágono não é destruído e o monstro <b>não se move na próxima rodada</b>.${ja ? " (Já registrado antes.)" : ""}</p>
				<p>Os cidadãos ficam chocados: a partir de agora, todo hexágono conta como destruído para as situações (<b>+${(e.estatua ? 5 : 0) + (e.palacio ? 5 : 0)} nas CD</b> e <b>+${(e.estatua ? 10 : 0) + (e.palacio ? 10 : 0)}%</b> de chance de morte de NPCs, já contando a estátua e o palácio).</p>`;
		}
		else if (res.acao === "destruir") {
			e.destruidos += qtd;
			html += `<p>Mais <b>${qtd}</b> hexágono(s) destruído(s).</p>`;
			checarNobreza();
		}
		else if (res.acao === "segmento") {
			const k = res.segmento in SEG ? res.segmento : "pernas";
			e.seg[k] = !e.seg[k];
			const n = desativados();
			html += `<p><b>${SEG[k]}</b> ${e.seg[k] ? "desativado" : "funcionando de novo"}. Segmentos desativados: <b>${n}/4</b>.</p>`;
			if (e.seg[k] && k === "pernas") html += "<p>O monstro fica com metade da velocidade: agora são <b>10 rodadas de combate</b> por hexágono, e ninguém é pisoteado ao voltar.</p>";
			if (e.seg[k] && k === "cauda") html += "<p>Equilíbrio abalado: <b>–2 na CD</b> de todos os efeitos do monstro, e não há mais golpe de cauda.</p>";
			if (e.seg[k] && k === "tronco") html += "<p>O ódio concentrado se desfaz: <b>não role mais situações</b> quando o monstro avança.</p>";
			if (e.seg[k] && (k === "bracoE" || k === "bracoD")) html += `<p>Essa garra não ataca mais.${e.seg.bracoE && e.seg.bracoD ? " Com os dois ombros destruídos, os braços não defendem mais a cabeça." : ""}</p>`;
			if (n >= 4) html += "<h3>O Mecano-Lagarto-Terror cai!</h3><p>Fim da fase 2. Se Ghorskander ainda está de pé, a luta pelo destino de Valkaria continua (fase 3).</p>";
			else if (n === 3) html += "<p><b>Três segmentos desativados:</b> Ghorskander sai de dentro do corpo do monstro e enfrenta o grupo no próximo segmento.</p>";
			const mecano = game.actors.find((a) => a.getFlag("world", "fdt") === "a2av7" && a.getFlag("world", "fdtRole") === "mecano");
			if (mecano) await mecano.update({ "system.resources.primary.value": Math.min(n, 4) });
		}
		else if (res.acao === "lo") {
			const b = res.beneficio in BENEF ? res.beneficio : "cura";
			const custo = b === "parar" ? 2 * (e.usosParar + 1) : b === "resistir" ? e.usosResistir + 1 : 1;
			if (!lo) return ui.notifications.error("Não achei o ator \"Valkaria · Lei & Ordem\" (Aventura 0).");
			if (loValor < custo) return ui.notifications.warn(`Lei & Ordem tem ${loValor}; o benefício custa ${custo}.`);
			if (b === "abominacao" && !e.abominacao) return ui.notifications.warn("Não há abominação dos cultistas vagando pela cidade.");
			const alvos = canvas.tokens.controlled.filter((t) => t.actor);
			if (b === "cura" && !alvos.length) return ui.notifications.warn("Selecione quem recebe a cura.");
			await lo.update({ "system.resources.primary.value": loValor - custo });
			html += `<p>Gasto de <b>${custo}</b> ponto(s) de Lei &amp; Ordem (restam ${loValor - custo}).</p>`;
			if (b === "cura") {
				for (const t of alvos) {
					const { pv, pm } = t.actor.system.attributes;
					const faltaPv = (pv.max ?? 0) - (pv.value ?? 0);
					if (faltaPv >= 10 || (pm.max ?? 0) - (pm.value ?? 0) < 2) {
						const v = await rolar("4d8+4");
						await t.actor.update({ "system.attributes.pv.value": Math.min(pv.max ?? 0, (pv.value ?? 0) + v) });
						html += `<p>${t.name} recupera <b>${v} PV</b>.</p>`;
					} else {
						const v = await rolar("2d4");
						await t.actor.update({ "system.attributes.pm.value": Math.min(pm.max ?? 0, (pm.value ?? 0) + v) });
						html += `<p>${t.name} recupera <b>${v} PM</b>.</p>`;
					}
				}
				html += "<p style=\"font-size:0.85em\">A macro escolhe PV quando faltam 10 ou mais; se o jogador preferir o outro, ajuste na ficha.</p>";
			}
			if (b === "rerolar") html += "<p>Um personagem rola de novo um teste de perícia recém-feito (só uma vez por teste).</p>";
			if (b === "parar") { e.usosParar += 1; e.parado = Math.max(e.parado, 1); html += `<p>O monstro <b>não se move</b> na próxima rodada (ainda pode usar o Lagarto Teimoso). O próximo uso custa ${2 * (e.usosParar + 1)}.</p>`; }
			if (b === "resistir") { e.usosResistir += 1; e.extraLimite += 1; html += `<p>Valkaria aguenta mais: a nobreza só vai embora com <b>${limite()}</b> hexágonos destruídos. O próximo uso custa ${e.usosResistir + 1}.</p>`; }
			if (b === "abominacao") { e.abominacao = null; html += "<p>A abominação dos cultistas é anulada.</p>"; }
		}
		else {
			e.rodada += 1;
			html += `<p><b>Rodada ${e.rodada}.</b></p>`;
			if (res.cabeca) html += "<p>O grupo está na cabeça: o monstro <b>para</b> de andar por Valkaria para lidar com as defesas.</p>";
			else if (e.parado > 0) {
				e.parado -= 1;
				html += "<p>O monstro <b>não se move</b> nesta rodada.</p>";
			} else {
				const d = await rolar("1d6");
				e.destruidos += 1;
				html += `<p>O monstro avança um hexágono <b>${DIRECAO[d]}</b> (1d6 = ${d}) e destrói o hexágono que deixou para trás.</p>`;
			}
			if (res.teimoso && !res.cabeca) {
				if (e.teimoso >= 3) html += "<p>O Lagarto Teimoso já foi usado três vezes.</p>";
				else {
					e.teimoso += 1;
					const d = await rolar("1d6");
					html += `<p><b>Lagarto Teimoso (${e.teimoso}/3):</b> avança mais um hexágono ${DIRECAO[d]}, sem destruí-lo, e sacrifica os ninhos de metralhadoras de um ombro.</p>`;
				}
			}
			if (e.abominacao && (e.rodada - e.abominacao.desde) > 0 && (e.rodada - e.abominacao.desde) % e.abominacao.ritmo === 0) {
				e.destruidos += 1;
				html += `<p>A abominação dos cultistas destrói <b>1 hexágono</b> (a cada ${e.abominacao.ritmo} rodadas; 1 ponto de Lei &amp; Ordem a anula).</p>`;
			}
			checarNobreza();
			html += `<p>Agora o grupo escolhe um hexágono adjacente e avança. ${e.seg.tronco ? "O tronco foi desativado: <b>não há mais situações</b>." : "Role a situação no hexágono do grupo (macro <i>Situação em Valkaria</i>)."} Se o grupo terminar a rodada no hexágono do monstro, começa a fase 2.</p>
				<p style="font-size:0.85em">Na fase 2, cada ${e.seg.pernas ? 10 : 5} rodadas de combate equivalem a uma rodada destas.</p>`;
		}
		const cd = (e.estatua ? 5 : 0) + (e.palacio ? 5 : 0);
		html += `<p style="font-size:0.85em">Destruídos: ${e.destruidos}/${limite()}${e.nobrezaFoi ? " (a nobreza já foi embora)" : ""} · Teimoso: ${e.teimoso}/3${cd ? ` · situações com +${cd} nas CD e +${cd * 2}% de morte` : ""}${e.abominacao ? ` · abominação à solta (1 hexágono a cada ${e.abominacao.ritmo} rodadas)` : ""}.</p>`;
		await game.user.setFlag("world", CHAVE, e);
		ChatMessage.create({ content: `<h3>Caminho de Destruição</h3>${html}`, rolls, whisper: ChatMessage.getWhisperRecipients("GM") });
	}

	async function macroSituacao() {
		const NOME_PERICIA = { luta: "Luta", pont: "Pontaria", dipl: "Diplomacia", inti: "Intimidação", mist: "Misticismo", atle: "Atletismo", fort: "Fortitude", ades: "Adestramento", reli: "Religião", alqu: "Ofício (alquimista)", refl: "Reflexos", vont: "Vontade", guer: "Guerra", acro: "Acrobacia", furt: "Furtividade", enga: "Enganação", sobr: "Sobrevivência", perc: "Percepção", inic: "Iniciativa", cura: "Cura", inve: "Investigação", conh: "Conhecimento" };
		const SITUACOES = {
			1: { nome: "Saque", pericias: ["luta", "pont", "dipl", "inti", "mist"], cd: 30, n: 3, falha: { txt: "perde 1 item consumível à escolha (sem item: 1d6 PV)" },
				suc: "Todos os NPCs salvos. Cada personagem recebe um item consumível de até T$ 100 à escolha do jogador.",
				fra: { txt: "Na próxima rodada, cada personagem sofre –2 em testes que usem equipamento (ataques com armas, ferramentas).", morte: 50 },
				ign: { txt: "", morte: 80 } },
			2: { nome: "Quadrilha", pericias: ["luta", "pont", "dipl", "inti", "mist"], cd: 32, n: 4, falha: { perda: "2d6" },
				suc: "Todos os NPCs salvos. Cada personagem recebe 1d4 para somar em um teste de perícia até o fim da fase 1.",
				fra: { txt: "O grupo não avança um hexágono na próxima rodada (mas encontra uma nova situação).", morte: 50 },
				ign: { txt: "Cada personagem perde 1d6 PV.", morte: 60, todos: ["1d6", "perda"] } },
			3: { nome: "Desabamento", pericias: ["atle", "mist"], cd: 30, n: 3, falha: { dano: ["4d6", "impacto"] }, mist: true,
				suc: "Todos os NPCs salvos e o caminho à frente está livre.",
				fra: { txt: "Cada personagem sofre 4d6 de impacto e o grupo procura outro caminho: não avança na próxima rodada (mas encontra uma situação).", morte: 65, todos: ["4d6", "impacto"] },
				ign: { txt: "Ignorar aqui não dá o hexágono adicional (mas evita o dano do desabamento).", morte: 65 } },
			4: { nome: "Incêndio", pericias: ["fort", "mist"], cd: 32, n: 4, falha: { dano: ["4d6", "fogo"] }, mist: true,
				suc: "Todos os NPCs salvos.",
				fra: { txt: "Cada personagem sofre 4d6 de fogo e fica fatigado até passar uma situação descansando (sem fazer teste).", morte: 65, todos: ["4d6", "fogo"], cond: "fatigado" },
				ign: { txt: "Cada personagem sofre 2d6 de fogo.", morte: 80, todos: ["2d6", "fogo"] } },
			5: { nome: "Monstros à Solta", pericias: ["ades", "mist"], cd: 32, n: 3, falha: { perda: "2d6" }, mist: true,
				suc: "Todos os NPCs salvos.",
				fra: { txt: "Monstros perseguem o grupo: a cada teste falho em situações, mais 1d6 PV. Para se livrar, aceite +5 na CD de uma situação; se ela der certo, os monstros somem (marque as opções na macro).", morte: 65 },
				ign: { txt: "Monstros perseguem o grupo (veja acima).", morte: 75 } },
			6: { nome: "Infestação de Mortos-Vivos", pericias: ["luta", "pont", "mist", "reli"], cd: 33, n: 4, falha: { dano: ["4d6", "trevas"] },
				extra: "Quem tem Canalizar Energia pode gastar 6 PM para um sucesso automático (some à mão).",
				suc: "Todos os NPCs salvos.",
				fra: { txt: "Espíritos perseguem o grupo: 2d6 de trevas no início de cada rodada até passarem uma rodada inteira parados (não avançam, mas não encontram situação).", morte: 65 },
				ign: null },
			7: { nome: "Alagamento de Poções", pericias: ["fort", "alqu", "refl"], cd: 32, n: 3, falha: { condicao: true },
				suc: "Todos os NPCs salvos. Cada personagem encontra 1d4 preparados alquímicos de até T$ 50 à escolha.",
				fra: { txt: "As condições sorteadas duram até o personagem passar uma rodada se recuperando (anda com o grupo, mas não testa na situação).", morte: 50 },
				ign: { txt: "Cada personagem perde 1d12 PV por veneno (Fortitude CD 32 reduz à metade).", morte: 65, todos: ["1d12", "perda", "fort", 32] } },
			8: { nome: "Área de Magia Selvagem", pericias: ["fort", "refl", "vont", "mist"], cd: 33, n: 4, falha: {},
				extra: "Quem lança Dissipar Magia pode gastar 3 PM para um sucesso automático (some à mão).",
				suc: "Todos os NPCs salvos e cada personagem recupera 1d4 PM.",
				fra: { txt: "", morte: 65, selvagem: true },
				ign: { txt: "A cada rodada a partir da próxima, 50% de chance desta situação se repetir no hexágono do grupo (além da rolada); a chance cai 10% por rodada.", morte: 75 } },
			9: { nome: "Tumulto", pericias: ["dipl", "guer", "inti"], cd: 33, n: 3, falha: { dano: ["4d6", "impacto"], meioVoo: true }, npcs: 3,
				suc: "Todos os NPCs salvos.",
				fra: { txt: "O grupo é arrastado para um hexágono sorteado (exceto na direção do monstro).", morte: 50 },
				ign: { txt: "", morte: 75 } },
			10: { nome: "Batalha Campal", pericias: ["dipl", "guer", "inti", "luta", "mist", "pont"], cd: 35, n: 3, falha: { perda: "3d4" }, npcs: 3, batalha: true,
				suc: "O grupo escolhido é salvo; os demais NPCs têm 75% de chance de morrer. Salvando dois grupos, na próxima rodada o grupo avança 1 hexágono adicional sem situação.",
				fra: { txt: "Os NPCs do grupo escolhido têm 65% de chance de morrer e os demais 80%. O hexágono é destruído.", morte: 80 },
				ign: null },
			11: { nome: "Aventureiros em Pânico", pericias: null, cd: 33, n: 4, falha: { perda: "2d6", txt: "ou 1 PM, à escolha" },
				suc: "Todos os NPCs salvos. Os aventureiros derrotados ajudam: a próxima situação resolvida com sucesso faz o grupo avançar 1 hexágono adicional.",
				fra: { txt: "Cada personagem perde 2d6 PV e 1d4 PM.", morte: 50, todos: ["2d6", "perda"], pm: "1d4" },
				ign: { txt: "Com mais aventureiros atacando, a população desconfia: cada NPC em situação tem 10% de chance de se voltar contra o grupo (como um 99-00).", morte: 65 } },
			12: { nome: "Cultistas", pericias: ["luta", "mist", "pont", "reli"], cd: 35, n: 5, falha: { pm: "1d6" },
				suc: "Todos os NPCs salvos. O grupo canaliza o ritual: cada personagem recebe os benefícios de uma noite de descanso normal.",
				fra: { txt: "Os cultistas invocam a abominação, enfraquecida: destrói 1 hexágono a cada 3 rodadas.", morte: 50, abominacao: 3 },
				ign: { txt: "Uma abominação é convocada: destrói 1 hexágono a cada 2 rodadas (1 ponto de Lei & Ordem a anula).", morte: 75, abominacao: 2 } }
		};
		const PANICO = ["luta", "pont", "atle", "acro", "furt", "inti", "dipl", "enga", "mist", "reli", "sobr", "perc", "vont", "refl", "fort", "guer", "cura", "inve"];
		const ultimo = game.user.getFlag("world", "fdtSituacao") ?? null;
		const mecano = game.user.getFlag("world", "fdtMecano") ?? {};
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Situação em Valkaria" },
			content: `<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="rolar">Rolar a situação e o NPC do hexágono</option>
					<option value="resolver">Os personagens selecionados resolvem (um teste cada)</option>
					<option value="ignorar">O grupo ignora a situação</option></select></div>
				<div class="form-group"><label>Situação</label><select name="situacao"><option value="0">${ultimo ? `A última rolada (${SITUACOES[ultimo.s]?.nome})` : "Rolar 1d12"}</option>${Object.entries(SITUACOES).map(([k, s]) => `<option value="${k}">${k}. ${s.nome}</option>`).join("")}</select></div>
				<div class="form-group"><label>Hexágono já destruído (+5 CD, +10%)</label><input type="checkbox" name="destruido"></div>
				<div class="form-group"><label>NPC enfurecido (+5 CD, 2d6 PV por falha)</label><input type="checkbox" name="enfurecido"></div>
				<div class="form-group"><label>Monstros perseguem o grupo (1d6 PV por falha)</label><input type="checkbox" name="perseguidos"></div>
				<div class="form-group"><label>Tentar se livrar dos monstros (+5 CD)</label><input type="checkbox" name="livrar"></div>
				<div class="form-group"><label>Batalha Campal: grupo protegido</label><select name="grupo"><option value="0">Lado 1</option><option value="1">Lado 2</option><option value="2">Inocentes</option></select></div>
				<div class="form-group"><label>Batalha Campal: dois testes cada (–5)</label><input type="checkbox" name="dobrar"></div>
				<div class="form-group"><label>Bônus nos testes</label><input type="number" name="bonus" value="0"></div>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const gm = ChatMessage.getWhisperRecipients("GM");
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r.total; };
		const tabNpc = game.tables.find((t) => t.getFlag("world", "fdt") === "a2av7" && t.getFlag("world", "fdtRole") === "npcs");
		const sortearNpc = async () => {
			let enfurecido = false;
			for (let i = 0; i < 10; i++) {
				const d = await rolar("1d100");
				if (d >= 99) { enfurecido = true; continue; }
				const r = tabNpc?.results.find((x) => x.range[0] <= d && d <= x.range[1]);
				return { nome: r?.name ?? `NPC nº ${d} da tabela`, enfurecido };
			}
			return { nome: "um NPC à escolha do Mestre", enfurecido: true };
		};
		let html = "";
		let estado = ultimo;
		const escolhida = Number(res.situacao) || 0;
		if (res.acao === "rolar" || (!estado && !escolhida) || (escolhida && estado?.s !== escolhida)) {
			const s = escolhida || await rolar("1d12");
			const sit = SITUACOES[s] ?? SITUACOES[1];
			const npcs = [];
			for (let i = 0; i < (sit.npcs ?? 1); i++) npcs.push(await sortearNpc());
			const pericias = sit.pericias ?? [...PANICO].sort(() => Math.random() - 0.5).slice(0, 3);
			estado = { s, npcs, pericias };
			await game.user.setFlag("world", "fdtSituacao", estado);
			if (mecano.seg?.tronco) html += "<p><b>Atenção:</b> o tronco já foi desativado; pelas regras, não há mais situações.</p>";
		}
		const sit = SITUACOES[estado.s] ?? SITUACOES[1];
		const enfurecido = !!res.enfurecido || estado.npcs.some((n) => n.enfurecido);
		const cdGlobal = (mecano.estatua ? 5 : 0) + (mecano.palacio ? 5 : 0);
		const cd = sit.cd + (res.destruido ? 5 : 0) + cdGlobal + (enfurecido ? 5 : 0) + (res.livrar ? 5 : 0);
		const morteMod = (res.destruido ? 10 : 0) + cdGlobal * 2;
		const nomesPericias = estado.pericias.map((k) => NOME_PERICIA[k] ?? k);
		const grupoBatalha = ["o lado 1 da batalha", "o lado 2 da batalha", "os inocentes"];
		html += `<h3>${estado.s}. ${sit.nome}</h3><p>${nomesPericias.join(", ")} · CD <b>${cd}</b> · <b>${sit.n}</b> sucessos${sit.batalha ? " por grupo" : ""} · um teste por personagem; três falhas é fracasso.${sit.ign ? "" : " <b>Não pode ser ignorada.</b>"}</p>
			<p>NPC${estado.npcs.length > 1 ? "s" : ""}: ${estado.npcs.map((n, i) => `<b>${n.nome}</b>${n.enfurecido ? " (enfurecido!)" : ""}${sit.batalha ? ` (${grupoBatalha[i]})` : ""}`).join(", ")}.</p>`;
		if (sit.mist) html += "<p style=\"font-size:0.85em\">Quem tem magias úteis (critério do Mestre) pode usar Misticismo pagando o custo básico da magia.</p>";
		if (sit.extra) html += `<p style="font-size:0.85em">${sit.extra}</p>`;
		if (res.acao === "rolar") return ChatMessage.create({ content: html, rolls, whisper: gm });

		const alvosGrupo = canvas.tokens.controlled.filter((t) => t.actor);
		const perderPm = async (a, f) => {
			const v = await rolar(f);
			const pm = a.system.attributes.pm;
			await a.update({ "system.attributes.pm.value": Math.max(0, (pm.value ?? 0) - v) });
			return v;
		};
		const ferir = async (a, formula, tipo, meio = false) => {
			const v = await rolar(formula);
			const valor = meio ? Math.floor(v / 2) : v;
			const r = await new Roll(`${valor}[${tipo}]`).evaluate();
			try { await a.applyDamageV2(r, 1); } catch (err) { console.warn(err); }
			return valor;
		};
		const matarNpcs = async (chances) => {
			const linhas = [];
			for (let i = 0; i < estado.npcs.length; i++) {
				const n = estado.npcs[i];
				const chance = Math.min(100, chances[i] + morteMod);
				const d = await rolar("1d100");
				const morre = d <= chance;
				const lendario = n.nome.startsWith("Um NPC famoso");
				linhas.push(chance < 0 ? `<li>${n.nome}: salvo pelo grupo.</li>` : `<li>${n.nome}: ${chance}% · ${d}: ${morre ? (lendario ? "sobreviveria por pouco, mas cada personagem perde <b>2d4 PM</b>" : "<b>morre</b>") : "sobrevive"}.</li>`);
				if (morre && lendario) for (const t of alvosGrupo) await perderPm(t.actor, "2d4");
			}
			return linhas.length ? `<p>NPCs:</p><ul>${linhas.join("")}</ul>` : "";
		};
		const todos = async (efeito) => {
			if (!efeito) return "";
			const [f, tipo, pericia, cdRes] = efeito;
			const linhas = [];
			for (const t of alvosGrupo) {
				let meio = false;
				if (pericia) {
					const r = await rolar(`1d20 + ${Number(t.actor.system.pericias?.[pericia]?.value) || 0}`);
					meio = r >= cdRes;
				}
				const v = await ferir(t.actor, f, tipo, meio);
				linhas.push(`${t.name}: ${v}${meio ? " (metade)" : ""}`);
			}
			return linhas.length ? `<p>${linhas.join(" · ")}.</p>` : "";
		};

		if (res.acao === "ignorar") {
			if (!sit.ign || enfurecido) {
				html += `<p><b>Não dá para ignorar</b>${enfurecido ? ": o NPC enfurecido obriga o grupo a lidar com a situação" : ""}. Use <i>resolver</i>.</p>`;
				return ChatMessage.create({ content: html, rolls, whisper: gm });
			}
			html += `<p><b>O grupo ignora a situação</b> e avança um hexágono adicional nesta rodada${estado.s === 3 ? " (no desabamento, não)" : ""}.</p>${sit.ign.txt ? `<p>${sit.ign.txt}</p>` : ""}`;
			html += await todos(sit.ign.todos);
			if (sit.ign.abominacao) await game.user.setFlag("world", "fdtMecano", { ...mecano, abominacao: { ritmo: sit.ign.abominacao, desde: mecano.rodada ?? 0 } });
			if (estado.npcs.some((n) => n.nome.includes("Orfanato"))) {
				const linhas = [];
				for (const t of alvosGrupo) linhas.push(`${t.name} −${await perderPm(t.actor, "1d4")} PM`);
				html += `<p>Remorso por abandonar as crianças do orfanato: ${linhas.join(", ") || "cada personagem perde 1d4 PM"}.</p>`;
			}
			html += await matarNpcs(estado.npcs.map(() => sit.ign.morte));
			await game.user.unsetFlag("world", "fdtSituacao");
			return ChatMessage.create({ content: html, rolls });
		}

		if (!alvosGrupo.length) return ui.notifications.warn("Selecione os personagens que vão resolver a situação.");
		const testes = res.dobrar && sit.batalha ? 2 : 1;
		const bonus = Math.trunc(Number(res.bonus) || 0) - (testes === 2 ? 5 : 0);
		const COND = ["", "alquebrado", "cego", "enjoado", "lento"];
		let suc = 0;
		let fal = 0;
		const linhas = [];
		for (const t of alvosGrupo) {
			for (let i = 0; i < testes; i++) {
				if (fal >= 3 || (!sit.batalha && suc >= sit.n)) break;
				const a = t.actor;
				const melhor = estado.pericias.reduce((m, k) => {
					const v = Number(a.system.pericias?.[k]?.value) || 0;
					return v > m.v ? { k, v } : m;
				}, { k: estado.pericias[0], v: Number(a.system.pericias?.[estado.pericias[0]]?.value) || 0 });
				const total = await rolar(`1d20 + ${melhor.v}${bonus ? ` + ${bonus}` : ""}`);
				if (total >= cd) { suc += 1; linhas.push(`<li>${t.name} (${NOME_PERICIA[melhor.k] ?? melhor.k}): ${total}, sucesso.</li>`); continue; }
				fal += 1;
				const efeitos = [];
				if (sit.falha.dano) {
					const m = a.system.attributes.movement ?? {};
					const voa = sit.falha.meioVoo && ((Number(m.climb?.value ?? m.climb?.base) || 0) > 0 || (Number(m.fly?.value ?? m.fly?.base) || 0) > 0);
					efeitos.push(`${await ferir(a, sit.falha.dano[0], sit.falha.dano[1], voa)} de ${sit.falha.dano[1]}${voa ? " (metade: escala ou voa)" : ""}`);
				}
				if (sit.falha.perda) efeitos.push(`perde ${await ferir(a, sit.falha.perda, "perda")} PV${sit.falha.txt ? ` (${sit.falha.txt})` : ""}`);
				else if (sit.falha.txt) efeitos.push(sit.falha.txt);
				if (sit.falha.pm) efeitos.push(`perde ${await perderPm(a, sit.falha.pm)} PM`);
				if (sit.falha.condicao) {
					const c = COND[await rolar("1d4")];
					if (!a.statuses?.has(c)) await a.toggleStatusEffect(c, { active: true });
					efeitos.push(`fica <b>${c}</b> até o fim da próxima rodada`);
				}
				if (enfurecido) efeitos.push(`o NPC enfurecido tira ${await ferir(a, "2d6", "perda")} PV`);
				if (res.perseguidos) efeitos.push(`os monstros tiram ${await ferir(a, "1d6", "perda")} PV`);
				linhas.push(`<li>${t.name} (${NOME_PERICIA[melhor.k] ?? melhor.k}): ${total}, falha${efeitos.length ? `: ${efeitos.join(", ")}` : ""}.</li>`);
			}
		}
		html += `<ul>${linhas.join("")}</ul>`;
		const salvos = sit.batalha ? Math.floor(suc / sit.n) : 0;
		const sucesso = fal < 3 && (sit.batalha ? salvos >= 1 : suc >= sit.n);
		html += `<p>${suc} sucesso(s), ${fal} falha(s): <b>${sucesso ? "SUCESSO" : "FRACASSO"}</b>.</p>`;
		if (sucesso) {
			html += `<p>${sit.suc}</p>`;
			if (res.livrar) html += "<p>O grupo se livrou dos monstros que o perseguiam.</p>";
			if (estado.s === 8) {
				const l = [];
				for (const t of alvosGrupo) {
					const v = await rolar("1d4");
					const pm = t.actor.system.attributes.pm;
					await t.actor.update({ "system.attributes.pm.value": Math.min(pm.max ?? 0, (pm.value ?? 0) + v) });
					l.push(`${t.name} +${v} PM`);
				}
				html += `<p>${l.join(", ")}.</p>`;
			}
			if (estado.s === 6) {
				const d = await rolar("1d100");
				html += `<p>Energias necromânticas: ${d <= 75 ? "<b>um NPC que morreu na fase 1 está aqui e volta à vida</b>" : "nenhum morto volta"} (${d}, 75%).</p>`;
			}
			if (estado.npcs.some((n) => n.nome.includes("Zymni"))) {
				for (const t of alvosGrupo) {
					const pv = t.actor.system.attributes.pv;
					await t.actor.update({ "system.attributes.pv.value": Math.min(pv.max ?? 0, (pv.value ?? 0) + 10) });
				}
				html += "<p>A Dra. Zymni, salva, cura <b>10 PV</b> de cada personagem.</p>";
			}
			if (sit.batalha) {
				const g = Math.min(2, Math.max(0, Number(res.grupo) || 0));
				const protegidos = salvos >= 2 ? [g, (g + 1) % 3] : [g];
				if (salvos >= 2) html += "<p>Dois grupos salvos: na próxima rodada o grupo avança 1 hexágono adicional e não enfrenta situação.</p>";
				html += await matarNpcs(estado.npcs.map((n, i) => (protegidos.includes(i) || salvos >= 3 ? -1000 : 75)));
			}
		} else {
			html += sit.fra.txt ? `<p>${sit.fra.txt}</p>` : "";
			html += await todos(sit.fra.todos);
			if (sit.fra.cond) for (const t of alvosGrupo) if (!t.actor.statuses?.has(sit.fra.cond)) await t.actor.toggleStatusEffect(sit.fra.cond, { active: true });
			if (sit.fra.pm) for (const t of alvosGrupo) await perderPm(t.actor, sit.fra.pm);
			if (sit.fra.abominacao) await game.user.setFlag("world", "fdtMecano", { ...mecano, abominacao: { ritmo: sit.fra.abominacao, desde: mecano.rodada ?? 0 } });
			if (sit.fra.selvagem) {
				const s = Math.min(3, suc);
				html += `<p>Efeitos cumulativos por ${s} sucesso(s): cada personagem sofre 6d6 de ${s >= 3 ? "fogo" : "perda de vida"} (Reflexos CD 33 reduz à metade).${s <= 1 ? " Cada um sofre uma <b>mutação mágica</b>: o Mestre ganha 1d6 por personagem para aumentar a CD ou o resultado de um teste contra ele até o fim da aventura." : ""}${s === 0 ? " O grupo é <b>teleportado 1 hexágono</b> na direção oposta ao monstro." : ""}</p>`;
				html += await todos(["6d6", s >= 3 ? "fogo" : "perda", "refl", 33]);
			}
			if (sit.batalha) {
				const g = Math.min(2, Math.max(0, Number(res.grupo) || 0));
				html += await matarNpcs(estado.npcs.map((n, i) => (i === g ? 65 : 80)));
				await game.user.setFlag("world", "fdtMecano", { ...mecano, destruidos: (mecano.destruidos ?? 0) + 1 });
				html += "<p>O hexágono foi destruído (já somado no <i>Caminho de Destruição</i>).</p>";
			} else html += await matarNpcs(estado.npcs.map(() => sit.fra.morte));
		}
		await game.user.unsetFlag("world", "fdtSituacao");
		ChatMessage.create({ content: html, rolls });
	}

	async function macroEscalar() {
		const ONDE = {
			pernas: { nome: "Pernas: escalar até as plataformas (20m)", cd: 25, pericias: ["atle"] },
			cauda: { nome: "Cauda: escalar até a escotilha (20m)", cd: 22, pericias: ["atle"] },
			cabeca: { nome: "Cabeça: escalar do tronco ou dos braços (10m)", cd: 25, pericias: ["atle"] },
			costas: { nome: "Cabeça pelas costas (20m, sem as garras)", cd: 25, pericias: ["atle"] },
			saltoTronco: { nome: "Saltar de um prédio para o tronco ou os braços", cd: 25, pericias: ["acro", "atle"] },
			saltoCabeca: { nome: "Saltar de um prédio para a cabeça", cd: 30, pericias: ["acro", "atle"] },
			vooTronco: { nome: "Voar até o tronco ou os braços", cd: 25, pericias: ["acro", "pilo", "mist"] },
			vooCabeca: { nome: "Voar até a cabeça", cd: 30, pericias: ["acro", "pilo", "mist"] },
			teleTronco: { nome: "Teletransporte para o tronco ou os braços", cd: 25, pericias: ["mist"] },
			teleCabeca: { nome: "Teletransporte para a cabeça", cd: 30, pericias: ["mist"] }
		};
		const NOME = { atle: "Atletismo", acro: "Acrobacia", pilo: "Pilotagem", mist: "Misticismo", ladi: "Ladinagem", enge: "Ofício (engenhoqueiro)", refl: "Reflexos" };
		const e = game.user.getFlag("world", "fdtMecano") ?? {};
		const seg = e.seg ?? {};
		const red = seg.cauda ? 2 : 0;
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Escalar e Sabotar" },
			content: `<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="escalar">Personagem selecionado aborda o monstro</option>
					<option value="sabotar">Personagem selecionado sabota o ponto fraco mirado</option>
					<option value="pisoteio">Pisoteio nos alvos (antes de subir pelas pernas)</option>
					<option value="cauda">Golpe de cauda nos alvos (antes de subir pela cauda)</option>
					<option value="sacudir">Fim da rodada: a cauda sacode quem ainda escala</option>
					<option value="descarga">Início do turno: descargas nas plataformas das pernas</option></select></div>
				<div class="form-group"><label>Por onde</label><select name="onde">${Object.entries(ONDE).map(([k, o]) => `<option value="${k}">${o.nome} (CD ${o.cd})</option>`).join("")}</select></div>
				<div class="form-group"><label>Altura já escalada (m)</label><input type="number" name="altura" value="10"></div>
				<p style="font-size:0.85em">Pisoteio, cauda e descargas usam os alvos mirados e ignoram RD.${red ? " Cauda desabilitada: –2 nas CD do monstro." : ""} Para sabotar, mire o token do ponto fraco, do ninho ou do lança-mísseis.</p>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r.total; };
		const valor = (a, k) => Number(a.system.pericias?.[k]?.value) || 0;
		const melhor = (a, ks) => ks.reduce((m, k) => (valor(a, k) > m.v ? { k, v: valor(a, k) } : m), { k: ks[0], v: valor(a, ks[0]) });
		const titanico = async (a, formula, tipo) => {
			const v = await rolar(formula);
			const r = await new Roll(`${v}[${tipo}]`, {}, { rd: 999 }).evaluate();
			try { await a.applyDamageV2(r, 1); } catch (err) { console.warn(err); }
			return v;
		};
		let html = "";
		if (res.acao === "escalar" || res.acao === "sabotar") {
			const tk = canvas.tokens.controlled[0];
			if (!tk?.actor) return ui.notifications.warn("Selecione o personagem.");
			if (res.acao === "escalar") {
				const o = ONDE[res.onde] ?? ONDE.pernas;
				const m = melhor(tk.actor, o.pericias);
				const total = await rolar(`1d20 + ${m.v}`);
				const ok = total >= o.cd;
				html += `<h3>${o.nome}</h3><p>${tk.name} (${NOME[m.k]}): <b>${total}</b> contra CD ${o.cd}. ${ok ? "Consegue." : total <= o.cd - 5 ? "Falha por 5 ou mais." : "Falha, mas não perde terreno."}</p>`;
				if (!ok) {
					if (res.onde.startsWith("salto")) html += "<p>Quem falha no salto sofre a queda da altura equivalente.</p>";
					else if (res.onde.startsWith("voo") || res.onde.startsWith("tele")) html += "<p>Falhando, sofre os ataques totais das defesas do segmento sem conseguir abordá-lo (macro <i>Defesas</i>).</p>";
					else if (total <= o.cd - 5) html += "<p>Cai da altura que tinha escalado.</p>";
				}
				if (!res.onde.startsWith("pernas") && !res.onde.startsWith("cauda") && !res.onde.startsWith("cabeca") && !res.onde.startsWith("costas")) html += "<p style=\"font-size:0.85em\">Logo antes de abordar, o personagem é alvejado por todas as defesas do segmento (macro <i>Defesas do Mecano-Lagarto-Terror</i>, opção \"abordar\"). Teletransporte pode evitar a barragem, a critério do Mestre.</p>";
				if (res.onde === "pernas" && !seg.pernas) html += "<p style=\"font-size:0.85em\">Antes de subir, criaturas Grandes ou menores são pisoteadas (opção Pisoteio).</p>";
				if (res.onde === "cauda" && !seg.cauda) html += "<p style=\"font-size:0.85em\">Antes de subir, golpe de cauda (opção Golpe de cauda).</p>";
				if (res.onde === "cabeca" && !(seg.bracoE && seg.bracoD)) html += "<p style=\"font-size:0.85em\">Se demorar mais de uma rodada, no fim da primeira todos sofrem dois ataques das garras (pelas costas evita).</p>";
				return ChatMessage.create({ content: html, rolls });
			}
			const alvo = [...game.user.targets][0];
			const role = alvo?.actor?.getFlag("world", "fdtRole") ?? "";
			const ehArma = role === "ninho" || role === "missil";
			const pericias = role === "missil" ? ["ladi"] : ["ladi", "enge"];
			const m = melhor(tk.actor, pericias);
			const cd = ehArma ? 30 : 25;
			const total = await rolar(`1d20 + ${m.v}`);
			html += `<h3>Sabotagem</h3><p>${tk.name} gasta uma ação completa (${NOME[m.k]}): <b>${total}</b> contra CD ${cd}.</p>`;
			if (!alvo?.actor || !(role.startsWith("seg-") || ehArma)) html += "<p>Mire o token de um ponto fraco, ninho ou lança-mísseis para aplicar o resultado.</p>";
			else if (total < cd) html += `<p>Não consegue sabotar ${alvo.name}.</p>`;
			else {
				const pv = alvo.actor.system.attributes.pv;
				const novo = ehArma ? 0 : Math.max(0, (pv.value ?? 0) - total);
				await alvo.actor.update({ "system.attributes.pv.value": novo });
				html += ehArma ? `<p><b>${alvo.name} sabotado</b>: não dispara mais.</p>` : `<p>${alvo.name} perde <b>${total} PV</b> (${novo} restantes).${novo <= 0 ? " <b>Destruído!</b> Registre o segmento no <i>Caminho de Destruição</i> quando todos os pontos dele caírem." : ""}</p>`;
			}
			return ChatMessage.create({ content: html, rolls });
		}
		const alvos = [...game.user.targets].filter((t) => t.actor);
		if (!alvos.length) return ui.notifications.warn("Mire as criaturas afetadas.");
		const linhas = [];
		if (res.acao === "pisoteio") {
			if (seg.pernas) html += "<p>As pernas estão desabilitadas: ninguém é pisoteado.</p>";
			else {
				const cd = 32 - red;
				for (const t of alvos) {
					const r = await rolar(`1d20 + ${valor(t.actor, "refl")}`);
					const v = await titanico(t.actor, r >= cd ? "6d6" : "12d6", "impacto");
					linhas.push(`${t.name}: Reflexos ${r}, ${v} de impacto${r >= cd ? " (metade)" : ""}`);
				}
				html += `<h3>Pisoteio</h3><p>12d6 de impacto, Reflexos CD ${cd} reduz à metade, ignora RD.</p>`;
			}
		}
		if (res.acao === "cauda") {
			if (seg.cauda) html += "<p>A cauda está desabilitada: não há golpe de cauda.</p>";
			else {
				const cd = 33 - red;
				for (const t of alvos) {
					const r = await rolar(`1d20 + ${valor(t.actor, "refl")}`);
					const v = await titanico(t.actor, r >= cd ? "4d6" : "8d6", "impacto");
					linhas.push(`${t.name}: Reflexos ${r}, ${v} de impacto${r >= cd ? " (metade)" : " e <b>empurrado 1 hexágono para trás</b>"}`);
				}
				html += `<h3>Golpe de Cauda</h3><p>8d6 de impacto, Reflexos CD ${cd} reduz à metade e evita o empurrão, ignora RD.</p>`;
			}
		}
		if (res.acao === "sacudir") {
			const cd = 33 - red;
			for (const t of alvos) {
				const m = melhor(t.actor, ["atle", "refl"]);
				const r = await rolar(`1d20 + ${m.v}`);
				if (r >= cd) { linhas.push(`${t.name}: ${NOME[m.k]} ${r}, se segura`); continue; }
				const v = await rolar("4d6");
				const dano = await new Roll(`${v}[impacto]`).evaluate();
				try { await t.actor.applyDamageV2(dano, 1); } catch (err) { console.warn(err); }
				linhas.push(`${t.name}: ${NOME[m.k]} ${r}, ${v} de impacto${r <= cd - 5 ? ` e <b>arremessado</b> (cai ${Math.max(0, Number(res.altura) || 0)}m)` : ""}`);
			}
			html += `<h3>A cauda sacode</h3><p>Atletismo ou Reflexos CD ${cd}: falha, 4d6 de impacto; falha por 5 ou mais, cai.</p>`;
		}
		if (res.acao === "descarga") {
			const cd = 32 - red;
			for (const t of alvos) {
				const r = await rolar(`1d20 + ${valor(t.actor, "refl")}`);
				if (r >= cd) { linhas.push(`${t.name}: Reflexos ${r}, evita`); continue; }
				const v = await rolar("4d6");
				const dano = await new Roll(`${v}[eletricidade]`).evaluate();
				try { await t.actor.applyDamageV2(dano, 1); } catch (err) { console.warn(err); }
				if (!t.actor.statuses?.has("ofuscado")) await t.actor.toggleStatusEffect("ofuscado", { active: true });
				linhas.push(`${t.name}: Reflexos ${r}, ${v} de eletricidade e <b>ofuscado</b>`);
			}
			html += `<h3>Descargas das plataformas</h3><p>4d6 de eletricidade e ofuscado por 1 rodada (Reflexos CD ${cd} evita tudo).</p>`;
		}
		html += linhas.length ? `<ul>${linhas.map((l) => `<li>${l}</li>`).join("")}</ul>` : "";
		ChatMessage.create({ content: html, rolls });
	}

	async function macroDefesas() {
		const PRESETS = {
			pernas: { nome: "Fim da rodada nas pernas", ninhos: 2, misseis: 0, garras: 0, raios: 0, sopro: false },
			cauda: { nome: "Fim da rodada na cauda", ninhos: 0, misseis: 4, garras: 0, raios: 0, sopro: false },
			tronco: { nome: "Fim da rodada no tronco", ninhos: 2, misseis: 4, garras: 0, raios: 0, sopro: false },
			ombro: { nome: "Fim da rodada num ombro", ninhos: 2, misseis: 2, garras: 1, raios: 0, sopro: false },
			abordarTronco: { nome: "Barragem ao abordar o tronco", ninhos: 2, misseis: 4, garras: 0, raios: 0, sopro: false },
			abordarBracos: { nome: "Barragem ao abordar os braços", ninhos: 4, misseis: 2, garras: 2, raios: 0, sopro: false },
			abordarCabeca: { nome: "Barragem ao abordar a cabeça", ninhos: 0, misseis: 0, garras: 2, raios: 2, sopro: true },
			cabecaSopro: { nome: "Cabeça · contagem 20: sopro de fúria", ninhos: 0, misseis: 0, garras: 0, raios: 0, sopro: true },
			cabecaRaios: { nome: "Cabeça · contagem 15: raios oculares", ninhos: 0, misseis: 0, garras: 0, raios: 2, sopro: false },
			cabecaGarras: { nome: "Cabeça · contagem 10: garras", ninhos: 0, misseis: 0, garras: 2, raios: 0, sopro: false },
			garrasEscalada: { nome: "Garras em quem demora a escalar até a cabeça", ninhos: 0, misseis: 0, garras: 2, raios: 0, sopro: false }
		};
		const e = game.user.getFlag("world", "fdtMecano") ?? {};
		const seg = e.seg ?? {};
		const red = seg.cauda ? 2 : 0;
		const bracos = (seg.bracoE ? 0 : 1) + (seg.bracoD ? 0 : 1);
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Defesas do Mecano-Lagarto-Terror" },
			content: `<div class="form-group"><label>Defesas</label><select name="preset">${Object.entries(PRESETS).map(([k, o]) => `<option value="${k}">${o.nome}</option>`).join("")}</select></div>
				<div class="form-group"><label>Ninhos ativos (vazio = padrão)</label><input type="number" name="ninhos" value=""></div>
				<div class="form-group"><label>Lança-mísseis ativos (vazio = padrão)</label><input type="number" name="misseis" value=""></div>
				<div class="form-group"><label>Olhos ativos (vazio = padrão)</label><input type="number" name="raios" value=""></div>
				<div class="form-group"><label>Os alvos estão desabilitando o sopro ou o olho (falham na resistência)</label><input type="checkbox" name="frente"></div>
				<p style="font-size:0.85em">Mire todos os personagens no segmento: cada disparo sorteia um alvo. Braços funcionais: ${bracos}.${red ? " Cauda desabilitada: –2 nas CD." : ""} Garras, sopro e raios ignoram RD.</p>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const alvos = [...game.user.targets].filter((t) => t.actor);
		if (!alvos.length) return ui.notifications.warn("Mire os personagens que estão no segmento.");
		const pr = PRESETS[res.preset] ?? PRESETS.pernas;
		const num = (v, padrao) => (v === "" || v === undefined || v === null || Number.isNaN(Number(v)) ? padrao : Math.max(0, Math.trunc(Number(v))));
		const ninhos = num(res.ninhos, pr.ninhos);
		const misseis = num(res.misseis, pr.misseis);
		const raios = num(res.raios, pr.raios);
		const garras = res.preset === "ombro" ? (bracos === 2 ? 1 : bracos === 1 ? 1 : 0) : Math.min(pr.garras, bracos);
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r; };
		const sortear = async () => alvos[(await rolar(`1d${alvos.length}`)).total - 1];
		const defesa = (a) => Number(a.system.attributes?.defesa?.value) || 10;
		const resist = async (a, k) => (await rolar(`1d20 + ${Number(a.system.pericias?.[k]?.value) || 0}`)).total;
		const aplicar = async (a, v, tipo, ignoraRd) => {
			const r = await new Roll(`${v}[${tipo}]`, {}, ignoraRd ? { rd: 999 } : {}).evaluate();
			try { await a.applyDamageV2(r, 1); } catch (err) { console.warn(err); }
		};
		const linhas = [];
		for (let n = 0; n < ninhos; n++) {
			const usados = [];
			for (let i = 0; i < 2; i++) {
				const livres = alvos.filter((t) => !usados.includes(t));
				const t = livres.length ? livres[(await rolar(`1d${livres.length}`)).total - 1] : await sortear();
				usados.push(t);
				const atk = await rolar("1d20 + 32");
				const nat = atk.dice[0]?.total ?? 0;
				if (atk.total < defesa(t.actor) && nat !== 20) { linhas.push(`Ninho ${n + 1} → ${t.name}: ${atk.total}, erra.`); continue; }
				const critico = nat >= 19;
				const d = await rolar(critico ? "12d8" : "4d8");
				await aplicar(t.actor, d.total, "perfuracao", false);
				linhas.push(`Ninho ${n + 1} → ${t.name}: ${atk.total}${critico ? " <b>crítico</b>" : ""}, ${d.total} de perfuração.`);
			}
		}
		for (let n = 0; n < misseis; n++) {
			const t = await sortear();
			const d = await rolar("6d10");
			const r = await resist(t.actor, "refl");
			const ok = r >= 30 - red;
			await aplicar(t.actor, ok ? Math.floor(d.total / 2) : d.total, "impacto", false);
			if (!ok) await t.actor.createEmbeddedDocuments("ActiveEffect", [{
				name: "Míssil (–2 em testes)",
				img: "systems/tormenta20/icons/magias/explosao-de-chamas.webp",
				type: "base",
				duration: { value: 1, units: "rounds" },
				flags: { world: { fdtMissil: true } },
				system: { changes: [{ key: "system.pericias.*.bonus", value: "-2", type: "add", phase: "initial", priority: null }] }
			}]);
			linhas.push(`Míssil ${n + 1} → ${t.name}: Reflexos ${r}, ${ok ? `${Math.floor(d.total / 2)} de impacto (metade)` : `${d.total} de impacto e <b>–2 em todos os testes</b> por 1 rodada`}.`);
		}
		for (let n = 0; n < garras; n++) {
			const atk = await rolar("1d20 + 28");
			const nat = atk.dice[0]?.total ?? 0;
			const d = await rolar(nat >= 19 ? "8d12 + 16" : "4d12 + 16");
			const acertos = [];
			for (const t of alvos) {
				if (atk.total >= defesa(t.actor) || nat === 20) { await aplicar(t.actor, d.total, "corte", true); acertos.push(t.name); }
			}
			linhas.push(`Garra ${n + 1}: ${atk.total}${nat >= 19 ? " <b>crítico</b>" : ""} contra todos, ${d.total} de corte (ignora RD) em: ${acertos.join(", ") || "ninguém"}.`);
		}
		if (pr.sopro) {
			const d = await rolar("8d6");
			const seis = d.dice[0]?.results?.filter((x) => x.result === 6).length ?? 0;
			for (const t of alvos) {
				const r = res.frente ? 0 : await resist(t.actor, "refl");
				const ok = !res.frente && r >= 30 - red;
				await aplicar(t.actor, ok ? Math.floor(d.total / 2) : d.total, "essencia", true);
				let extra = "";
				if (!ok && seis) {
					const pm = t.actor.system.attributes.pm;
					const novo = Math.max(0, (pm.value ?? 0) - seis);
					await t.actor.update({ "system.attributes.pm.value": novo });
					extra = `, perde ${seis} PM${novo === 0 ? " e entra em <b>frenesi</b> (só ataca fisicamente um alvo aleatório até recuperar 1 PM)" : ""}`;
				}
				linhas.push(`Sopro → ${t.name}: ${res.frente ? "de frente, falha" : `Reflexos ${r}`}, ${ok ? Math.floor(d.total / 2) : d.total} de essência${extra}.`);
			}
		}
		for (let n = 0; n < raios; n++) {
			const t = await sortear();
			const d = await rolar("6d6");
			await aplicar(t.actor, d.total, "luz", true);
			const r = res.frente ? 0 : await resist(t.actor, "fort");
			const ok = !res.frente && r >= 30 - red;
			if (!ok && !t.actor.statuses?.has("ofuscado")) await t.actor.toggleStatusEffect("ofuscado", { active: true });
			linhas.push(`Raio ocular ${n + 1} → ${t.name}: ${d.total} de luz${ok ? ` (Fortitude ${r}, evita a condição)` : " e <b>ofuscado</b> por 1 rodada"}.`);
		}
		ChatMessage.create({ content: `<h3>${pr.nome}</h3>${linhas.length ? `<ul>${linhas.map((l) => `<li>${l}</li>`).join("")}</ul>` : "<p>Nenhuma defesa ativa.</p>"}`, rolls });
	}

	async function macroGhorskander() {
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Ghorskander em Combate" },
			content: `<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="laudano">Láudano Mentagênico nos alvos (Vontade CD 35)</option>
					<option value="injetor">Injetor Parasitário nos alvos (–1 cumulativo)</option>
					<option value="tique">Tique-Taque Dominador (alvos com o injetor)</option>
					<option value="tendoes">Romper Tendões nos alvos (crítico com garra-bisturi)</option>
					<option value="forma">Forma Final (145 PV ou menos)</option>
					<option value="maos">Mãos Independentes no alvo (agarrar +34)</option>
					<option value="discurso">O discurso de Ghorskander</option>
					<option value="valkaria">Eu &lt;3 Valkaria</option></select></div>
				<p style="font-size:0.85em">Mire os alvos. Forma Final também mira quem vê a transformação.</p>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r.total; };
		const vont = async (a) => rolar(`1d20 + ${Number(a.system.pericias?.vont?.value) || 0}`);
		const cond = async (a, c) => { if (!a.statuses?.has(c)) await a.toggleStatusEffect(c, { active: true }); };
		if (res.acao === "discurso") {
			return ChatMessage.create({ content: `<h3>Ghorskander</h3><blockquote><p><i>"Vocês ainda não compreendem contra o que estão lutando. O Doutor Vesper revelou nossa missão sublime, a luta para destruir o tempo... Mas ainda assim ele foi modesto. [...] Carne e máquinas não são diferentes para mim."</i></p>
				<p><i>"Vocês escolhem estar limitados! Escolhem ser humanos, elfos ou anões! [...] Não percebem que podem ser tudo! Que podem ter tudo!"</i></p>
				<p><i>"Vocês são insetos atacando um deus, são vermes tentando defender a carniça onde vivem. Não percebem que tudo que fiz... Foi para libertá-los. Deixem de lado suas mentes e seus corpos! Abandonem suas almas! Permitam que eu os leve ao próximo estágio... Então permitam que Arthemus Vesper lhes conceda a plenitude."</i></p></blockquote>` });
		}
		if (res.acao === "valkaria") {
			return ChatMessage.create({ content: `<h3>Eu &lt;3 Valkaria</h3><p>Valkarianos surgem nas janelas, nas ruas, pendurados em naves aéreas e sobre os telhados. Vaiam Ghorskander, jogam frutas podres, pedras e lixo, e gritam os nomes dos heróis da cidade!</p>
				<p>Cada aventureiro escolhe um benefício:</p><ul><li>Os efeitos de uma noite de descanso em acomodações normais.</li><li>O efeito de uma atividade em Valkaria qualquer.</li><li>O efeito de um parceiro veterano qualquer (algum valkariano sabe fazer o que é preciso).</li></ul>
				<p>Ou, se todos concordarem, abrem mão disso: <b>toda Valkaria conta como a base do grupo</b> durante este combate.</p>` });
		}
		const alvos = [...game.user.targets].filter((t) => t.actor);
		const linhas = [];
		let html = "";
		if (res.acao === "forma") {
			const g = game.actors.find((a) => a.getFlag("world", "fdt") === "a2av7" && a.getFlag("world", "fdtRole") === "ghorskander");
			if (g) {
				await g.update({ "system.attributes.pv.value": 145 });
				const ef = g.effects.find((x) => x.name === "Forma Final");
				if (ef) await ef.update({ disabled: false });
			}
			html += "<h3>Forma Final</h3><p>A cabeça de Ghorskander gira e uma enorme face de relógio toma o lugar do rosto. Os PV se tornam <b>145</b> e ele ganha <b>Mãos Independentes</b> até o fim da cena.</p>";
			for (const t of alvos) {
				if (t.actor === g) continue;
				const v = await vont(t.actor);
				if (v < 35) await cond(t.actor, "abalado");
				linhas.push(`${t.name}: Vontade ${v}${v >= 35 ? ", resiste" : ", <b>abalado</b>"}`);
			}
		} else {
			if (!alvos.length) return ui.notifications.warn("Mire os alvos.");
			if (res.acao === "laudano") {
				const d = await rolar("8d8");
				html += `<h3>Láudano Mentagênico</h3><p>Esfera de 3m: <b>${d}</b> de dano psíquico.</p>`;
				for (const t of alvos) {
					const v = await vont(t.actor);
					const ok = v >= 35;
					const valor = ok ? Math.floor(d / 2) : d;
					const r = await new Roll(`${valor}[psiquico]`).evaluate();
					try { await t.actor.applyDamageV2(r, 1); } catch (err) { console.warn(err); }
					if (!ok) await cond(t.actor, "alquebrado");
					linhas.push(`${t.name}: Vontade ${v}, ${valor}${ok ? " (metade)" : " e <b>alquebrado</b>"}`);
				}
			}
			if (res.acao === "injetor") {
				html += "<h3>Injetor Parasitário</h3>";
				for (const t of alvos) {
					await t.actor.createEmbeddedDocuments("ActiveEffect", [{
						name: "Injetor Parasitário (–1 em perícias)",
						img: "systems/tormenta20/icons/poderes/ameacas/veneno.webp",
						type: "base",
						flags: { world: { fdtInjetor: true } },
						system: { changes: [{ key: "system.pericias.*.bonus", value: "-1", type: "add", phase: "initial", priority: null }] }
					}]);
					const n = t.actor.effects.filter((x) => x.getFlag("world", "fdtInjetor") || x.name.startsWith("Injetor")).length;
					linhas.push(`${t.name}: –${n} em testes de perícia até o fim da cena`);
				}
			}
			if (res.acao === "tique") {
				html += "<h3>Tique-Taque Dominador</h3><p>Uma vez por cena, alcance médio, só quem está sob o Injetor Parasitário.</p>";
				for (const t of alvos) {
					const injetado = t.actor.effects.some((x) => x.getFlag("world", "fdtInjetor") || x.name.startsWith("Injetor"));
					if (!injetado) { linhas.push(`${t.name}: sem o injetor, não é afetado`); continue; }
					const v = await vont(t.actor);
					if (v < 35) await cond(t.actor, "confuso");
					linhas.push(`${t.name}: Vontade ${v}${v >= 35 ? ", resiste" : ", <b>confuso</b>"}`);
				}
			}
			if (res.acao === "tendoes") {
				html += "<h3>Romper Tendões</h3>";
				for (const t of alvos) {
					await cond(t.actor, "lento");
					await cond(t.actor, "vulneravel");
					linhas.push(`${t.name}: <b>lento</b> e <b>vulnerável</b>`);
				}
			}
			if (res.acao === "maos") {
				const t = alvos[0];
				const a = await rolar("1d20 + 34");
				const d = await rolar(`1d20 + ${Math.max(Number(t.actor.system.pericias?.luta?.value) || 0, Number(t.actor.system.pericias?.atle?.value) || 0)}`);
				if (a > d) await cond(t.actor, "agarrado");
				html += `<h3>Mãos Independentes</h3><p>As mãos flutuam até ${t.name}: agarrar ${a} contra ${d}. ${a > d ? "<b>Agarrado pela garganta</b>: condição terrível para lançar magias e começa a sufocar." : "Não agarram e voltam para Ghorskander."}</p>`;
			}
		}
		html += linhas.length ? `<ul>${linhas.map((l) => `<li>${l}</li>`).join("")}</ul>` : "";
		ChatMessage.create({ content: html, rolls });
	}

	async function macroSuprimentos() {
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		if (!tokens.length) return ui.notifications.warn("Selecione os personagens que passaram um turno na Guarita da Praia.");
		const modelo = (role) => game.items.find((i) => i.getFlag("world", "fdt") === "a2av7" && i.getFlag("world", "fdtRole") === role);
		const itens = ["pocao", "po-azul"].map(modelo).filter(Boolean).map((i) => i.toObject());
		if (!itens.length) return ui.notifications.error("Não achei a poção e o pó azul da Aventura 7. Importe o Ato 2 de novo.");
		for (const t of tokens) await t.actor.createEmbeddedDocuments("Item", itens);
		ChatMessage.create({ content: `<h3>Suprimentos da Guarita da Praia</h3><p>Valkaria está em caos e a Guarita abre todos os recursos: ${tokens.map((t) => t.name).join(", ")} recebe${tokens.length > 1 ? "m" : ""}, cada um, uma <b>poção de curar ferimentos</b> (11d8+11 PV) e uma dose de <b>pó azul</b> (ação completa, 2d4 PM).</p>` });
	}

	const macro = (name, img, fn) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Arco 2 · Aventura 7 · gerado por a2-av7-mecano-lagarto-terror.js\n(${fn.toString()})();`
	});
	const macros = await Macro.createDocuments([
		macro("Av7 · Caminho de Destruição", ICO.pisotear, macroCaminho),
		macro("Av7 · Situação em Valkaria", ICO.explosao, macroSituacao),
		macro("Av7 · Escalar e Sabotar", ICO.engrenagens, macroEscalar),
		macro("Av7 · Defesas do Mecano-Lagarto-Terror", ICO.metralhadora, macroDefesas),
		macro("Av7 · Ghorskander em Combate", ICO.relogio, macroGhorskander),
		macro("Av7 · Suprimentos da Guarita", ICO.pocao, macroSuprimentos)
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
	const enxames = enxameAv5 ? `${L(enxameAv5)}${alfaAv5 ? ` (ou ${L(alfaAv5)})` : ""}` : "enxames de dragões do esgoto (Aventura 5)";

	await JournalEntry.create({
		name: "Arco 2 · Aventura 7 · O Ataque do Mecano-Lagarto-Terror de 50 Metros de Altura",
		folder: pasta.JournalEntry,
		flags: FLAGS(),
		pages: [
			pagina("Guia do Mestre", `
				<blockquote><p>Um imenso lagarto-terror, como aqueles que existem em Galrasia, mas com partes metálicas. Armas espalhadas pelo corpo: armas de fogo giratórias cospem rajada atrás de rajada, bombas são lançadas de canhões [...] Este é o caos que estava para tomar Valkaria. <b>O Mecano-Lagarto-Terror de 50 Metros de Altura.</b></p></blockquote>
				<h2>O vilão e seu objetivo</h2>
				<p>Última aventura do arco. O vilão é ${L(atores.ghorskander)}, o oficial médico da Roca: desestabilizar Valkaria até a nobreza se sentir ameaçada e aceitar refúgio com Arthemus Vesper em Galrasia. Quando a violência toma as ruas, os Imagodutos canalizam a raiva dos valkarianos e materializam o monstro projetado a partir das pesquisas de Khenzarr: ${L(atores.mecano)}.</p>
				<p>Se o grupo resolveu a maior parte das aventuras, Ghorskander perde várias vantagens: a importância de tudo que fizeram deve ficar evidente agora.</p>
				<h2>Fases</h2>
				${lista([
					"<b>Fase 0 · Normalidade:</b> não há. A aventura começa quando o contador de Lei & Ordem chega a 0, faça o grupo o que fizer.",
					"<b>Fase 1 · O Monstro que Pisoteou Valkaria:</b> a perseguição pelo mapa de hexágonos, com as situações em cada hexágono.",
					"<b>Fase 2 · O Rei dos Monstros:</b> escalar e desativar quatro segmentos do monstro.",
					`<b>Fase 3 · A Luta pelo Destino de Valkaria:</b> ${L(atores.ghorskander)}, a partir do terceiro segmento desativado.`,
					"<b>Fase 4 · Desfecho:</b> Valkaria segue em frente, e o caminho para Galrasia."
				])}
				<h2>Criaturas</h2>
				${lista([
					`${L(atores.ghorskander)} (ND 12) e ${L(atores.torgo)} (ND 10, no tronco e depois na cabeça).`,
					`${L(atores.mecano)}: guarda as armas do monstro inteiro.`,
					`Pontos fracos: ${[atores.pernas, atores.cauda, atores.tronco, atores.ombro, atores.sopro, atores.olho].map(L).join(", ")}.`,
					`Defesas: ${L(atores.ninho)} e ${L(atores.missil)}.`,
					`Quatro ${enxames} no tronco e quatro na cabeça.`
				])}
				<h2>Macros</h2>
				${lista([
					`${linkMacro("Caminho")}: a ascensão, o avanço do monstro a cada rodada, hexágonos destruídos, estátua e palácio, Lagarto Teimoso, segmentos desativados e os gastos de ${leiOrdem ? L(leiOrdem) : "Lei & Ordem"}.`,
					`${linkMacro("Situação")}: sorteia a situação e os NPCs, resolve um teste por personagem selecionado (com a melhor perícia permitida), aplica as falhas, o sucesso ou o fracasso e as chances de morte dos NPCs.`,
					`${linkMacro("Escalar")}: escaladas e abordagens alternativas, sabotagem dos pontos fracos, pisoteio, golpe e sacudida da cauda e descargas das plataformas.`,
					`${linkMacro("Defesas")}: ninhos, lança-mísseis, garras, sopro e raios contra os personagens num segmento, com alvos sorteados.`,
					`${linkMacro("Ghorskander")} e ${linkMacro("Suprimentos")}.`
				])}
				<h2>Ataque inconveniente</h2>
				<p>O monstro surge fora do controle dos personagens: talvez logo depois de outra aventura, com poucos PV e PM. A Guarita da Praia abre todos os recursos: quem passa um turno lá recebe ${L(itemRole("pocao"))} e ${L(itemRole("po-azul"))}. Se o contador não chegou a 0, os pontos restantes viram ${L(itemRole("lo-beneficios"))}.</p>
				<h3>"Shivara deve ter visto isso!"</h3>
				<p>Shivara nota o ataque, mas aprendeu na Guerra Artoniana o que acontece quando sai de circulação. Coordena dezenas de grupos de heróis e soldados para salvar vidas, e lida com as queixas dos nobres e com a perda de habilidades dos aventureiros. Os heróis épicos estão em outros problemas ou foram afetados pelas mensagens subliminares. Ela só age pessoalmente se o pior acontecer (o grupo falhar).</p>`, 100),
			pagina("Fase 1 · O Monstro que Pisoteou Valkaria", `
				<blockquote><p>As paredes tremem com um rugido aterrorizante. [...] Algo primitivo se agita dentro de vocês, um medo ancestral que os faz se sentirem pequenos e vulneráveis, um eco da Era de Megalokk, quando monstros reinavam sobre Arton.</p></blockquote>
				<p>No início da sessão, gritos, vidro quebrando e luta generalizada. Bandos de cidadãos enlouquecidos passam com armas e tochas. Um detetive da Guarita da Praia arrasta um criminoso da Companhia dos Irmãos, que ri: em breve não haverá Guarda e a cidade será governada pelo crime. Uma comitiva de nobres passa ignorando o povo.</p>
				<h2>Tudo de acordo com o plano</h2>
				${lista([
					"<b>Aventura 1 não resolvida:</b> cada personagem perde acesso às duas últimas habilidades ativáveis que adquiriu.",
					"<b>Aventura 3:</b> situação Quadrilha antes de perseguir o monstro; o grupo não avança nessa rodada, o monstro sim.",
					"<b>Aventura 5:</b> situação Monstros à Solta (depois da Quadrilha, se for o caso), com a mesma regra.",
					"<b>Aventura 6:</b> nobres vão embora já: Valkaria sofre 1 hexágono de dano."
				])}
				<p>Se o grupo tomou medidas contra um efeito sem resolver a aventura (como cristais rosados contra as mensagens), evita o efeito. A macro ${linkMacro("Caminho")} (opção <i>Tudo de acordo com o plano</i>) registra.</p>
				<h2>A ascensão</h2>
				<p>No hexágono do grupo quando o contador chega a 0, role 1d6 para a direção (1 é a face de cima, depois em sentido horário) e 2d4 para a distância em hexágonos. Fora das muralhas, role de novo.</p>
				<h2>Contingência: excesso de Lei &amp; Ordem</h2>
				<p>Se o contador nunca chegar a 0, o monstro se ergue assim que o grupo termina o quarto caso investigado. É um desafio bem menor e cada ponto restante vira um benefício (a qualquer momento): ${L(itemRole("lo-beneficios"))}. O autor recomenda limitar o ganho de Lei &amp; Ordem e converter o excesso aqui.</p>
				<h2>Caminho de Destruição</h2>
				<p>Cada rodada é uma cena. Na ordem:</p>
				${lista([
					"O monstro avança um hexágono numa direção aleatória (1d6) e destrói o hexágono que deixou para trás.",
					"Os aventureiros escolhem um hexágono adjacente e avançam.",
					"Role a situação no hexágono do grupo."
				])}
				<p>Se o grupo terminar uma rodada no hexágono do monstro, começa a fase 2. Com <b>10 hexágonos destruídos</b> (pelo monstro ou por situações), a nobreza abandona a capital: o monstro continua matando, Ghorskander tenta fugir e deixa Torgo para deter o grupo, e volta no Arco 3.</p>
				<p><b>Hexágonos destruídos:</b> +5 na CD das situações e +10% de chance de morte de NPCs.</p>
				<h3>A estátua e o palácio</h3>
				<p>Se o monstro chega ao hexágono da estátua de Valkaria, não destrói esse hexágono: ataca a deusa petrificada e fica parado na rodada seguinte. Na terceira rodada segue normalmente; Valkaria sofre 1 hexágono de dano e, a partir daí, todos os hexágonos contam como destruídos. O mesmo vale para o Palácio Imperial. Com os dois: +10 nas CD e +20% de morte. Muito provavelmente todos os NPCs rolados morrem.</p>
				<h3>Locais de destaque destruídos</h3>
				<p>Lugares muito resistentes (Rocha Cinzenta, Arena de Valkaria) ficam de pé. Os outros são destruídos. NPCs não rolados muito ligados a um local destruído (como Stugrid e a Catedral) têm 50% de chance de morrer.</p>
				<h3>Lagarto Teimoso</h3>
				<p>Até três vezes, uma por rodada, o monstro avança um hexágono adicional (mesmo detido por Lei &amp; Ordem) sem destruí-lo e sacrifica os ninhos de metralhadoras de um ombro. Serve para prolongar a perseguição.</p>
				<h3>Velozes e Valorosos</h3>
				<p>${L(itemRole("velozes"))}: com acesso o tempo todo a um meio rápido, o grupo avança um hexágono adicional numa única rodada, sem situação.</p>`, 200),
			pagina("Situações em Valkaria", `
				<p>Sempre que o grupo entra num hexágono, role 1d12 em ${L(tabSituacoes)} e 1d100 em ${L(tabNpcs)}. Cada situação é um teste estendido aberto: <b>cada personagem faz um único teste</b>, e o grupo fracassa ao juntar três falhas ou ao não conseguir os sucessos. Quase sempre dá para <b>ignorar</b> e avançar um hexágono adicional, com as consequências. Use ${linkMacro("Situação")}.</p>
				<h3>NPCs</h3>
				<p>Ignore NPCs mortos, presos, ausentes ou já com o grupo. Mantenha os que o grupo não conhece (boa chance de apresentar um coadjuvante), a menos que complique demais. NPCs com recursos estão isolados e sem equipamento; os poderosos (Janara, Torzogh) estão feridos ou exaustos. Com <b>99-00</b>, o NPC está com o pleno poder e enfurecido: não dá para ignorar, +5 nas CD e cada teste falho custa 2d6 PV.</p>
				<h3>As doze situações</h3>
				<table><tr><th>Situação</th><th>Teste</th><th>Falha no teste</th><th>Sucesso</th><th>Fracasso</th><th>Ignorar</th></tr>
					<tr><td>1. Saque</td><td>Luta, Pontaria, Diplomacia, Intimidação ou Misticismo CD 30, 3</td><td>Perde 1 consumível (ou 1d6 PV)</td><td>Um consumível de até T$ 100</td><td>–2 em testes com equipamento na próxima rodada; NPCs 50%</td><td>NPCs 80%</td></tr>
					<tr><td>2. Quadrilha</td><td>Mesmas perícias, CD 32, 4</td><td>2d6 PV</td><td>1d4 de bônus num teste até o fim da fase 1</td><td>Não avança na próxima rodada; 50%</td><td>1d6 PV cada; 60%</td></tr>
					<tr><td>3. Desabamento</td><td>Atletismo (ou Misticismo com magia) CD 30, 3</td><td>4d6 impacto</td><td>Caminho livre</td><td>4d6 impacto cada, não avança; 65%</td><td>65%, sem o hexágono extra</td></tr>
					<tr><td>4. Incêndio</td><td>Fortitude (ou Misticismo) CD 32, 4</td><td>4d6 fogo</td><td>—</td><td>4d6 fogo e fatigado; 65%</td><td>2d6 fogo cada; 80%</td></tr>
					<tr><td>5. Monstros à Solta</td><td>Adestramento (ou Misticismo) CD 32, 3</td><td>2d6 PV</td><td>—</td><td>65% e monstros perseguem</td><td>75% e monstros perseguem (1d6 PV por teste falho; +5 na CD para se livrar)</td></tr>
					<tr><td>6. Mortos-Vivos</td><td>Luta, Pontaria, Misticismo ou Religião CD 33, 4 (Canalizar Energia: 6 PM por um sucesso)</td><td>4d6 trevas</td><td>75% de um NPC morto na fase 1 voltar à vida</td><td>65%; espíritos causam 2d6 trevas por rodada até uma rodada parada</td><td>Não pode</td></tr>
					<tr><td>7. Alagamento de Poções</td><td>Fortitude, Ofício (alquimista) ou Reflexos CD 32, 3</td><td>Condição 1d4: alquebrado, cego, enjoado, lento</td><td>1d4 preparados de até T$ 50</td><td>50%; condições até uma rodada de recuperação</td><td>65%; 1d12 PV por veneno (Fort CD 32 metade)</td></tr>
					<tr><td>8. Magia Selvagem</td><td>Fortitude, Reflexos, Vontade ou Misticismo CD 33, 4 (Dissipar Magia: 3 PM por um sucesso)</td><td>—</td><td>1d4 PM cada</td><td>65%; efeitos por sucessos (6d6 fogo; perda de vida; mutação; teleporte)</td><td>75%; 50% de se repetir, –10% por rodada</td></tr>
					<tr><td>9. Tumulto</td><td>Diplomacia, Guerra ou Intimidação CD 33, 3; três NPCs</td><td>4d6 impacto (metade com escalada ou voo)</td><td>—</td><td>50%; arrastados a um hexágono aleatório</td><td>75%</td></tr>
					<tr><td>10. Batalha Campal</td><td>Diplomacia, Guerra, Intimidação, Luta, Misticismo ou Pontaria CD 35, 3 por grupo; três NPCs (dois lados e inocentes); pode fazer dois testes com –5</td><td>3d4 PV</td><td>Grupo protegido salvo, outros 75%; dois grupos: +1 hexágono sem situação</td><td>Escolhido 65%, outros 80%; hexágono destruído</td><td>Não pode</td></tr>
					<tr><td>11. Aventureiros em Pânico</td><td>Três perícias da Tabela 6-6 (T20 p. 279) CD 33, 4</td><td>2d6 PV ou 1 PM</td><td>Próximo sucesso dá +1 hexágono</td><td>50%; 2d6 PV e 1d4 PM cada</td><td>65%; NPCs têm 10% de se voltar contra o grupo</td></tr>
					<tr><td>12. Cultistas</td><td>Luta, Misticismo, Pontaria ou Religião CD 35, 5</td><td>1d6 PM</td><td>Uma noite de descanso</td><td>50%; abominação enfraquecida (1 hexágono a cada 3 rodadas)</td><td>75%; abominação (1 hexágono a cada 2 rodadas; 1 Lei &amp; Ordem anula)</td></tr></table>
				<p style="font-size:0.85em">As porcentagens são a chance de morte de cada NPC presente.</p>`, 300),
			pagina("Fase 2 · O Rei dos Monstros", `
				<blockquote><p>Ao chegar perto da criatura, vocês percebem a enormidade da tarefa de destruí-la. Seria como atacar uma montanha, como desafiar um vulcão.</p></blockquote>
				<p>Ghorskander sabe que o monstro não sobrevive: o melhor para a Roca é mesmo que seja eliminado, depois de causar estrago. O monstro tem <b>cinco segmentos</b> (pernas, cauda, tronco, braços e cabeça), cada um um objeto Colossal com RD 10, Defesa e PV próprios e um ponto fraco. <b>Sabotar</b>: ação completa, Ladinagem ou Ofício (engenhoqueiro) CD 25; o ponto fraco perde PV iguais ao resultado. Desativar <b>quatro segmentos</b> quaisquer encerra a fase 2 (a cabeça conta como dois).</p>
				<p>Do chão, só as pernas e a cauda. Conduza como um combate normal: <b>a cada 5 rodadas</b> (10 com as pernas desabilitadas), o monstro anda 1 hexágono por Valkaria e destrói 1; role situação e NPC. O grupo pode descer automaticamente para lidar com ela, mas terá de escalar de novo. Ghorskander só enfrenta o grupo depois do terceiro segmento.</p>
				<h3>Defesas</h3>
				${lista([
					`${L(atores.ninho)}: Grande, dispara duas vezes por rodada na última contagem, +32 (4d8 perfuração, 19/×3, alcance longo), dois alvos sorteados. Defesa 35, RD 5, 60 PV; sabotar com Ladinagem ou engenhoqueiro CD 30.`,
					`${L(atores.missil)}: Grande, uma vez por rodada na última contagem, a até 90m: 6d10 impacto e –2 cumulativo em todos os testes por 1 rodada (Ref CD 30 metade e evita). Defesa 35, RD 5, 60 PV; sabotar com Ladinagem CD 30.`
				])}
				<h3>Pernas · ${L(atores.pernas)}</h3>
				<p>Antes de subir, criaturas Grandes ou menores são pisoteadas: 12d6 impacto (Ref CD 32 metade), ignora RD. Sem passarelas: plataformas de manutenção a 20m, escalada CD 25. Dois ninhos nos joelhos no fim de cada rodada; descargas de 4d6 eletricidade e ofuscado no início de cada turno nas plataformas (Ref CD 32 evita). Defesa 28, RD 10, 500 PV. Opcional: das plataformas se segue ao tronco. Desabilitadas: metade da velocidade e sem pisoteio.</p>
				<h3>Cauda · ${L(atores.cauda)}</h3>
				<p>Antes de subir: 8d6 impacto e empurrado 1 hexágono (Ref CD 33 metade e evita), ignora RD. Escotilha a 20m, escalada CD 22. Quatro plataformas a meia altura, um lança-mísseis em cada. No fim de cada rodada, quem ainda escala faz Atletismo ou Reflexos CD 33: 4d6 impacto, e cai se falhar por 5. Defesa 26, RD 10, 450 PV. Desabilitada: –2 na CD de todos os efeitos do monstro e sem golpe de cauda.</p>
				<h3>Rápidos e mortos (o grupo descobre ao chegar no tronco)</h3>
				<p>Os braços protegem a cabeça com golpes muito poderosos: é mais seguro desabilitá-los antes, mas são mais rodadas com o monstro andando. Em compensação, quando o grupo chega à cabeça <b>o monstro para</b>. Se a cabeça cair cedo e ainda faltarem segmentos, ele volta a andar.</p>
				<h3>Tronco · ${L(atores.tronco)}</h3>
				<p>Sem testes de escalada para chegar e se move livremente aqui e para os braços. Cinco mecanismos (ação de movimento para alcançar cada um), 250 PV e Defesa 15 cada. Dois ninhos, quatro lança-mísseis, quatro ${enxames} e ${L(atores.torgo)}. Desativado: o ódio se desfaz e não se rolam mais situações.</p>
				<h3>Braços · ${L(atores.ombro)}</h3>
				<p>Cada ombro: dois ninhos e dois lança-mísseis (o Lagarto Teimoso sacrifica os ninhos de um ombro). Cada garra ataca o ombro oposto: +28 (4d12+16 corte, 19) contra todos ali, ignora RD. Passarelas: sem testes. Mecanismos do ombro: Defesa 30, RD 10, 350 PV cada; os dois desabilitam o segmento e impedem a defesa da cabeça.</p>
				<h3>Cabeça · ${L(atores.sopro)} e ${L(atores.olho)}</h3>
				<p>A 10m de escalada do tronco ou dos braços (CD 25). Se demorarem mais de uma rodada, sofrem dois ataques das garras no fim da primeira, a menos que escalem pelas costas (20m). Sem ponto fraco único: cai quando todas as defesas caem. Quatro ${enxames} (e os que sobraram correm para cá), Torgo se estiver vivo e, se for a última luta, Ghorskander. Os defensores são imunes aos mecanismos.</p>
				${lista([
					"<b>Sopro de fúria</b> (contagem 20): cone de 9m, 8d6 essência, 1 PM por 6 nos dados (Ref CD 30 metade e evita a perda), ignora RD; 0 PM é frenesi. Defesa 28, 150 PV; quem o desabilita falha automaticamente.",
					"<b>Raios oculares</b> (contagem 15): cada olho, 6d6 luz e ofuscado (Fort CD 30 evita a condição), ignora RD. Defesa 25, 100 PV; quem o desabilita falha automaticamente.",
					"<b>Garras</b> (contagem 10): cada braço funcional ataca todos na cabeça."
				])}
				<p>Destruir a cabeça conta como desabilitar dois segmentos.</p>
				<h3>Dando a volta por cima</h3>
				<p>Pular de um prédio, voar ou teletransportar: CD 25 para o tronco ou braços, 30 para a cabeça (Acrobacia ou Atletismo para saltar; Acrobacia, Pilotagem ou Misticismo para voar; Misticismo para teletransporte; Ofício não serve). Falhar no salto é uma queda; falhar no voo é sofrer a barragem sem abordar. Logo antes de abordar, todos levam a barragem do segmento: tronco (2 ninhos e 4 mísseis), braços (4 ninhos, 2 mísseis e 2 garras), cabeça (sopro, 2 raios e 2 garras), com alvos sorteados. Invisibilidade não protege; teletransporte pode, a critério do Mestre.</p>
				<h3>O mapa</h3>
				<p>Não há mapa oficial: os segmentos são complexos demais. Na stream, havia "reatores" onde quem caísse morria: perigosos para os dois lados.</p>`, 400),
			pagina("Fase 3 · A Luta pelo Destino de Valkaria", `
				<blockquote><p>Ghorskander, o oficial médico da Roca, é uma figura estranha. Alto e esquálido [...] veste uma cartola, como se zombasse dos modos artonianos, além de uma capa e um avental sujo de sangue. [...] A parte traseira de seu crânio é achatada: é o mostrador de um relógio.</p></blockquote>
				<p>O discurso completo está na macro ${linkMacro("Ghorskander")} (opção <i>O discurso</i>).</p>
				<h3>Como conduzir</h3>
				<p>${L(atores.ghorskander)} não é um lutador nato, mas usa todas as táticas. Diferente de Syvarian, despreza os heróis; não tem honra e mata primeiro o aventureiro mais frágil (sem antagonizar jogadores menos experientes). Não teme ser destruído: com o fim do tempo, tudo será uma coisa só. Vencidos o monstro e Ghorskander, Valkaria está em paz relativa... mas em algum lugar da cidade outra batalha épica acontece.</p>
				<h3>Eu &lt;3 Valkaria</h3>
				<p>${L(itemRole("eu-valkaria"))}. Use se o grupo teve apreço pela cidade, de preferência quando estiver levando a pior. Recrie o clima dos filmes de heróis: esta é a grande retribuição de Valkaria.</p>
				<h3>Relato da mesa original</h3>
				<p>A luta quase matou todo o grupo na primeira rodada: os Cães das Colinas chegaram à cabeça sem desabilitar os braços. Por causa desse playtest entrou a regra de o monstro parar quando o grupo chega à cabeça. Com um grupo inexperiente, diga com franqueza que lutar na cabeça sem desabilitar os braços será muito mais difícil e que a morte de todos é provável.</p>`, 500),
			pagina("Fase 4 · Desfecho", `
				<blockquote><p>"Comprem aqui mesmo!", grita uma menina de no máximo doze anos. "Suvenires da luta contra o monstro que pisoteou Valkaria! Tudo legítimo, na minha mão!" [...] É uma cena movimentada, cômica, trágica, banal e épica. Valkaria passou por mais isso, absorveu a experiência e segue em frente. [...] Mas, por enquanto, vocês estão atravancando o caminho e os valkarianos querem passar.</p></blockquote>
				<h2>O caminho para Galrasia</h2>
				${lista([
					"<b>Paollus:</b> aliado ao verdadeiro Paollus, o grupo recebe tudo sobre a localização da Roca e o covil de Vesper.",
					"<b>A Ploigoníada:</b> com contato pacífico via o Cobrador, a guilda troca o paradeiro da Roca pelo perdão de parte da dívida de Arton.",
					"<b>Meios sobrenaturais:</b> deixe dar certo, com um motivo para a informação não ter vindo antes. Ninguém mandou outros heróis porque há outras sagas: \"Vocês são os heróis!\"",
					"<b>Arthemus Vesper:</b> se teve relação cordial com o grupo, pode convidá-lo a Galrasia para ver o \"refúgio\".",
					"<b>A druida de bordo ou a própria Roca:</b> só como culminação de um interesse ao longo do arco.",
					"<b>A Academia Arcana:</b> adivinhações, contatos e alguém que viu a Roca cair anos atrás.",
					"<b>Xerife Mathilda Nolt:</b> lagartos-terror vêm de algum lugar; nobres levados a um ponto distante e inacessível: Galrasia.",
					"<b>A Coroa:</b> Shivara aparece, curta, impressionante e decisiva, ou manda um pergaminho assinado.",
					"<b>NPCs:</b> Yolana, Alfraye, os Goblins da Gazeta, Justine, o Avatar da Cidade, Anatole (e agora o grupo deve a ele), até um vilão do Clube de Cavalheiros.",
					"<b>Capangas:</b> um delator da Companhia dos Irmãos com medo do verdadeiro Paollus."
				])}
				<h2>Epílogo</h2>
				<p>O trabalho em Valkaria acabou; os próximos passos estão em Galrasia. Reserve ao menos uma sessão para amarrar pontas soltas e despedidas. O grupo não perde negócios, residências e vínculos: use o poder atual para justificar o acesso remoto. No terceiro arco, os heróis são pessoas do mundo.</p>
				<h3>Destino dos NPCs</h3>
				${lista([
					"<b>Mathilda e os detetives:</b> ficam na Guarda; Mathilda pode virar Reguladora (Ulnsariann, Throgarimm ou Hannah no lugar).",
					"<b>Blixto Arting:</b> desconto perene; talvez uma filial da Metais em Lysianassa, com Basil indo junto.",
					"<b>Felicia Daratramm:</b> livre para ficar com Belinda nas Colinas Centrais.",
					"<b>Os Mata-Malvados:</b> se amigos, podem ir a Galrasia.",
					"<b>Click e as bandas:</b> talvez uma taverna em Lysianassa.",
					"<b>O Povo dos Túneis:</b> sem lugar na Mansão do Sono e Suplício, podem ir a Galrasia (têm experiência com lagartos-terror).",
					"<b>Alfraye:</b> pode acompanhar o grupo e montar uma base em Lysianassa, mas o mais provável é ficar e manter contato mágico.",
					"<b>A juventude nobre:</b> Archibald e Melynna, Drekaag em Sckharshantallas, Loranth atrás de novas substâncias...",
					"<b>Gnuk:</b> pode ir pesquisar transportes (inclua uma missão para tirá-lo de encrenca).",
					"<b>O Castelo do Sabor:</b> uma filial fora de Valkaria.",
					"<b>Bebê Corisco:</b> talvez capturar uma montaria ainda mais radical em Galrasia.",
					"<b>Os Goblins da Gazeta:</b> o grupo é manchete, elogiosa ou escandalosa.",
					"<b>A Residência Paterfax:</b> a despedida deve ser o mais melodramática possível.",
					"<b>Anatole:</b> vira \"agente de aventureiros\" em Lysianassa.",
					"<b>Justine:</b> fica, mas o grupo sempre será bem-vindo."
				])}
				<h3>Informações para o futuro</h3>
				${lista([
					"A Roca caiu em Galrasia e continua lá.",
					"Há uma druida de bordo muito próxima da nave viva.",
					"O Dr. Arthemus Vesper construiu uma base na ilha.",
					"Nobres e ricaços foram levados a Galrasia para que Vesper tivesse acesso aos recursos deles.",
					"O plano está nas últimas fases e deve chegar a um ponto culminante.",
					"A única cidade verdadeira de Galrasia é Lysianassa: qualquer expedição começa lá."
				])}`, 600)
		]
	});

	ui.notifications.info("Fim dos Tempos · Arco 2 · Aventura 7 (O Ataque do Mecano-Lagarto-Terror): conteúdo criado.");
})();
