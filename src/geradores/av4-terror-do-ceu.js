/* =====================================================================
 * FIM DOS TEMPOS · AVENTURA 4 · "O TERROR QUE VEIO DO CÉU"
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Av4 · Terror que Veio do Céu" com:
 *      - Ameaças: Bandoleiro (com variantes de artilheiro e timoneira), Cão do Inferno, Torgo,
 *        Canhão de Fogo e dois atores de apoio: "Harpia, o Gog'magogue" e "Fazendas Gallobalt".
 *      - Itens: Essência Abissal, Implante de Cristal de Vadrinne, Instruções de Syvarian.
 *      - Diário com guia do mestre, aviso, família Gallobalt, investigação, o ataque,
 *        regras a bordo, a Harpia, a carta de Syvarian e o desfecho.
 *      - Macros: Ataque do Céu, Luz da Harpia, Turno da Harpia, Testes a Bordo,
 *        Cirurgia do Implante, Elemental Elétrico (Torgo) e Montar cenas dos mapas (cria as cenas com as imagens do módulo).
 *   3. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "av4".
 *
 * Feito a partir do código do sistema (master, out/2026); não foi testado num Foundry rodando.
 * Veja o guia av4-terror-do-ceu.md.
 * ===================================================================== */
(async () => {
	// Testes dos PJs: a macro pede, o jogador rola pelo card no chat (módulo; sem ele, a macro rola).
	const FDT_TESTE = 'const fdtApi = game.modules.get("giriarpg-fim-dos-tempos")?.api;\nif (!fdtApi?.testes) throw new Error("Fim dos Tempos: ative o módulo Giria T20 - Fim dos Tempos (Campanha) para usar esta macro.");\nconst fdtTestes = (lista) => fdtApi.testes.lista(lista);\nconst fdtTeste = async (ator, pericia, o = {}) => (await fdtTestes([{ ...o, ator, pericia }]))[0];\nconst fdtAplicar = fdtApi.testes.coletor();\nconst fdtEnviar = (dados) => fdtAplicar.enviar(dados);\n';
	// Macros que pedem testes ou aplicam algo: o prefixo acima entra no comando, a macro roda dentro de um try/finally
	// (no fim, os botões que sobraram vão para o Mestre) e as mensagens dela levam os botões do Mestre (fdtEnviar).
	const usaFdt = (fn) => /fdtTestes?\(|fdtAplicar|fdtEnviar/.test(fn.toString());
	const codigo = (fn) => (usaFdt(fn) ? fn.toString().replace(/\bChatMessage\.create\(/g, "fdtEnviar(") : fn.toString());
	const chamar = (fn, chamada) => (usaFdt(fn) ? `try {\n\tawait ${chamada};\n} finally {\n\tawait fdtAplicar.fim();\n}` : `await ${chamada};`);
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "av4";
	const FLAGS = (role) => ({ world: role ? { fdt: TAG, fdtRole: role } : { fdt: TAG } });
	const T20I = "systems/tormenta20/icons";
	const ARTE = "modules/giriarpg-fim-dos-tempos/assets/arco1/av4-terror";

	/* ------------------------------------------------------------------ */
	/* 0. Limpeza do que foi gerado antes                                   */
	/* ------------------------------------------------------------------ */
	const isOurs = (d) => d.getFlag?.("world", "fdt") === TAG;
	const colecoes = [game.actors, game.items, game.journal, game.tables, game.macros];
	const antigos = colecoes.flatMap((c) => c.filter(isOurs));
	if (antigos.length) {
		const ok = await foundry.applications.api.DialogV2.confirm({
			window: { title: "Aventura 4: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para a Aventura 4.</p>
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
	/* 1. Construtores (mesmos da Av2 e Av3)                                */
	/* ------------------------------------------------------------------ */
	const NOME_PASTA = "FdT · Av4 · Terror que Veio do Céu";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#6b3a3a", flags: FLAGS() })).id;
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

	const ATR_PERICIA = { luta: "for", atle: "for", pont: "des", inic: "des", refl: "des", furt: "des", acro: "des", fort: "con", perc: "sab", vont: "sab", intu: "sab", sobr: "sab", reli: "sab", atua: "car", enga: "car", dipl: "car", inti: "car", mist: "int", ofi0: "int", conh: "int" };

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

	const CRISTAIS = "Os olhos foram substituídos por <b>cristais rosados</b> (implantes do Dr. Vesper). Por isso a luz da Harpia não os ofusca. Capturados, revelam tudo o que sabem, mas não sabem quase nada: foram levados a algum lugar, apagaram no caminho e acordaram já operados.";

	/* ------------------------------------------------------------------ */
	/* 2. Ameaças                                                           */
	/* ------------------------------------------------------------------ */
	const atores = {};

	const furtivo = () => aoUsar("Ataque Furtivo (+1d6)", "icons/magic/perception/silhouette-stealth-shadow.webp", [["dano", "1d6"]], ["attack"]);

	atores.bandoleiro = await criarNPC({
		name: "Bandoleiro da Harpia",
		tokenName: "Bandoleiro",
		role: "bandoleiro",
		img: `${ARTE}/bandoleiro-espada.webp`,
		token: `${ARTE}/bandoleiro-espada-token.webp`,
		nd: "1/2",
		cd: 15,
		tipo: "hum",
		raca: "humano",
		papel: "lackey",
		atr: { for: 2, des: 3, con: 1, int: -1, sab: 0, car: 1 },
		pv: 10,
		def: 15,
		walk: 9,
		pericias: { inic: 5, perc: 2, fort: 3, refl: 5, vont: 0, luta: 9, pont: 9, acro: 5, atle: 4 },
		ic: ["ofuscado"],
		resTxt: "Imune a ofuscado (olhos de cristal).",
		ataquesTxt: "Espada longa +9 (1d8+2, 19).",
		ataquesAdTxt: "Besta leve +9 (1d8+2, 19).",
		equipTxt: "Couro batido, espada longa, besta leve, virotes.",
		tesouro: "Metade.",
		bio: p(
			"Criminosos recrutados em Zakharov que servem a Torgo e Syvarian. Trabalham em células e conhecem pouco além da própria tarefa. " + CRISTAIS,
			`<b>Arte do arqueiro</b>, para variar os tokens na cena: retrato <code>${ARTE}/bandoleiro-arco.webp</code> e token <code>${ARTE}/bandoleiro-arco-token.webp</code> (aba Token do token colocado).`,
			"<b>Variantes com a mesma ficha:</b>",
			"<b>Artilheiro do canhão:</b> ligue o efeito <i>Cobertura do canhão (+5 Def)</i>. Se for derrotado, o Canhão de Fogo fica inativo por 1d3 rodadas (enquanto outro bandoleiro assume). Cada artilheiro derrotado sai dos 12 capangas do interior da nave.",
			"<b>Timoneira:</b> enquanto estiver no comando, personagens desprevenidos pelo piso escorregadio sofrem –2 em perícias. Incapacitada, a nave se estabiliza.",
			"<b>Defensores da escada de corda:</b> só chutam (use a arma <i>Chute</i>, +8, 1d3+2) para derrubar quem sobe."
		),
		effects: [
			chave("Cobertura do canhão (+5 Def)", `${T20I}/magias/explosao-de-chamas.webp`, [["system.attributes.defesa.bonus", "5"]], false,
				"Só para os artilheiros do Canhão de Fogo: a estrutura do canhão dá cobertura.")
		],
		items: [
			arma("Espada Longa", `${T20I}/itens/equipamentos/espada-longa.webp`, { dano: "1d8+2", tipo: "corte", critM: 19, effects: [furtivo()] }),
			distancia("Besta Leve", `${T20I}/itens/equipamentos/besta-leve.webp`, { dano: "1d8+2", tipo: "perfuracao", critM: 19, alcance: "medio", effects: [furtivo()] }),
			arma("Chute (na escada de corda)", "icons/svg/falling.svg", { ajuste: -1, dano: "1d3+2", tipo: "impacto",
				desc: p("Só para quem defende as escadas de corda: usa as mãos para se segurar e chuta quem tenta subir.") }),
			poder("Ataque Furtivo", "icons/magic/perception/silhouette-stealth-shadow.webp",
				p("Uma vez por rodada, +1d6 de dano com ataques corpo a corpo, ou à distância em alcance curto, contra alvos desprevenidos ou que esteja flanqueando. Marque o aprimoramento na janela de ataque."),
				{ exec: "passive" }),
			poder("Olhos de Cristal", "icons/magic/perception/eye-ringed-glow-angry-small-teal.webp", p("Imune a ofuscado. Por isso consegue lutar dentro do brilho da Harpia."), { exec: "passive" })
		]
	});

	atores.cao = await criarNPC({
		name: "Cão do Inferno",
		role: "cao",
		img: `${T20I}/ameacas/cao-do-inferno.png`,
		token: `${ARTE}/cao-do-inferno-token.webp`,
		nd: 2,
		cd: 17,
		tipo: "esp",
		papel: "lackey",
		tamanho: "gra",
		tokenSize: 2,
		atr: { for: 6, des: 3, con: 4, int: -2, sab: 1, car: -2 },
		pv: 95,
		def: 21,
		walk: 12,
		sentidos: ["escuro", "faro"],
		pericias: { inic: 6, perc: 4, fort: 11, refl: 9, vont: 7, luta: 14, atle: 9 },
		ic: ["ofuscado"],
		res: { fogo: { imunidade: true }, frio: { vulnerabilidade: true }, dano: { base: 10 } },
		resTxt: "Imune a ofuscado e fogo; redução de dano 10/mágico; vulnerável a frio.",
		ataquesTxt: "Mordida +14 (2d6+6 mais 2d6 fogo).",
		tesouro: "1d4 doses de essência abissal (Ofício alquimista ou Misticismo CD 17 para extrair).",
		recursos: { primary: { label: "Sopro carregado", value: 1, max: 1 } },
		bio: p(
			"Cães demoníacos que caçam as cabras e queimam as plantações dos Gallobalt. Dois saltam da Harpia na primeira rodada; há mais dois dentro da nave.",
			"<b>RD 10/mágico:</b> a ficha usa RD 10 geral. Ataques mágicos ignoram essa RD: nesses casos, devolva os 10 PV à mão (ou use a opção de ignorar RD da rolagem).",
			"<b>Sopro:</b> o recurso <i>Sopro carregado</i> marca se ele pode soprar. Gaste ao soprar; ele recarrega com uma ação de movimento."
		),
		items: [
			arma("Mordida", "icons/creatures/abilities/mouth-teeth-long-red.webp", { dano: "2d6+6", tipo: "perfuracao", extra: [["2d6", "fogo"]] }),
			poder("Sopro Infernal", "icons/creatures/abilities/dragon-fire-breath-orange.webp",
				p("<b>Ação padrão.</b> Cone de 6m: <b>4d6+4 de fogo</b> (Reflexos CD 17 reduz à metade).",
					"<b>Recarga:</b> ação de movimento. Use o recurso <i>Sopro carregado</i> para controlar."),
				{ exec: "action", area: "Cone de 6m", save: "Reflexos CD 17 reduz à metade", rolls: [["Fogo", [["4d6+4", "fogo"]]]] }),
			poder("Natureza Infernal", "icons/svg/fire-shield.svg",
				p("Imune a fogo e a ofuscado. Redução de dano 10/mágico. Vulnerável a frio (o sistema já aplica +50% no dano de frio)."), { exec: "passive" })
		]
	});

	atores.torgo = await criarNPC({
		name: "Torgo, Golem do Dr. Vesper",
		tokenName: "Torgo",
		role: "torgo",
		link: true,
		img: `${ARTE}/torgo.webp`,
		token: `${ARTE}/torgo-token.webp`,
		nd: 5,
		cd: 20,
		tipo: "con",
		raca: "golem",
		papel: "solo",
		atr: { for: 6, des: 3, con: 5, int: 0, sab: 1, car: -2 },
		pv: 170,
		def: 24,
		walk: 9,
		sentidos: ["escuro"],
		pericias: { inic: 7, perc: 5, fort: 13, refl: 10, vont: 8, luta: 16, acro: 9, atle: 15 },
		ic: ["cansaco", "metabolismo", "veneno"],
		res: { dano: { base: 5 } },
		resTxt: "Imune a efeitos de cansaço, metabólicos e de veneno; redução de dano 5.",
		ataquesTxt: "Duas pancadas +16 (1d8+6 mais 1d6 eletricidade).",
		equipTxt: "Poção de relâmpago (granada, área em alvos escolhidos).",
		recursos: {
			primary: { label: "Olhar Elétrico carregado", value: 1, max: 1 },
			secondary: { label: "Fúria (1 por cena)", value: 1, max: 1 }
		},
		bio: p(
			"\"O homem de mantos escuros\": golem do Dr. Vesper, com um relógio no peito. Fala com expressões populares e o jeito dos criminosos, quase sempre fora de lugar. Brutamontes um pouco infantil, totalmente leal e muito perigoso.",
			"Obedece a <b>Syvarian</b>. Na Harpia, foge pelos cordames sem ficar ofuscado e espera o grupo na ponte de comando. Se a luta for mal, <b>pula da nave</b> (a morte é quase certa, mas ele não se importa).",
			"<b>Autodestruição:</b> se estiver prestes a revelar algo ou for preso sem esperança de fuga, explode (8d6 em raio de 6m) com <b>uma rodada de aviso</b>: os olhos brilham e os ponteiros do relógio giram descontrolados.",
			"<i>\"Aventureiros? Que jeito é esse de ganhar a vida? (...) Se não querem ouvir o bom senso, vão ouvir minha mão fechada, que é quase a mesma coisa!\"</i>"
		),
		effects: [
			chave("Fúria de Torgo (+2)", "icons/creatures/claws/claw-bear-paw-swipe-red.webp",
				[["system.modificadores.ataque.cac", "2"], ["system.modificadores.dano.cac", "2"]], false,
				"Ação de movimento, uma vez por cena. Termina se, ao fim da rodada, Torgo não tiver atacado nem sido alvo de efeito hostil.")
		],
		items: [
			arma("Pancada", `${T20I}/magias/relampago.webp`, { dano: "1d8+6", tipo: "impacto", extra: [["1d6", "eletricidade"]],
				desc: p("Torgo faz <b>duas pancadas</b> por ação padrão (role duas vezes).", "Acertar uma criatura viva <b>recarrega o Olhar Elétrico</b>."),
				effects: [aoUsar("Carga elétrica (+1d6)", `${T20I}/magias/relampago.webp`, [["dano", "1d6"]], ["attack"])] }),
			poder("Olhar Elétrico", `${T20I}/magias/relampago.webp`,
				p("<b>Ação de movimento.</b> Linha de 1,5m em alcance curto: <b>4d6 de eletricidade</b> (Reflexos CD 20 reduz à metade).",
					"<b>Recarga:</b> acertar uma pancada numa criatura viva. Use o recurso <i>Olhar Elétrico carregado</i>.",
					"Com <i>Carga elétrica</i> (Elemental Elétrico), causa +1d6."),
				{ exec: "move", alcance: "short", area: "Linha de 1,5m", save: "Reflexos CD 20 reduz à metade",
					rolls: [["Eletricidade", [["4d6", "eletricidade"]]], ["Com carga elétrica", [["5d6", "eletricidade"]]]] }),
			poder("Elemental Elétrico", `${T20I}/magias/relampago-flamejante.webp`,
				p("Se for sofrer dano <b>mágico de eletricidade</b>, em vez disso recupera PV iguais à metade do dano. Até o fim do próximo turno, pancadas e Olhar Elétrico causam <b>+1d6 de eletricidade</b>.",
					"Use a macro <i>Elemental Elétrico</i>: ela cura Torgo e lembra da carga. Na pancada, marque o aprimoramento <i>Carga elétrica</i>."),
				{ exec: "reaction" }),
			poder("Fúria", "icons/creatures/claws/claw-bear-paw-swipe-red.webp",
				p("<b>Ação de movimento, uma vez por cena.</b> +2 em ataque e dano corpo a corpo; não pode fazer ações que exijam calma e concentração. Termina se, ao fim da rodada, não tiver atacado nem sido alvo de efeito hostil.",
					"Ligue o efeito <i>Fúria de Torgo</i> na aba de efeitos."),
				{ exec: "move" }),
			poder("Poção de Relâmpago (granada)", `${T20I}/itens/gerais/bomba.webp`,
				p("Arremessada como granada, com o aprimoramento de área em alvos escolhidos da magia <i>Relâmpago</i>: <b>6d6 de eletricidade</b> nas criaturas que Torgo escolher na área (Reflexos reduz à metade).",
					"O livro não dá a CD; use a do Torgo (20) se quiser um número."),
				{ exec: "action", alcance: "short", save: "Reflexos reduz à metade", rolls: [["Eletricidade", [["6d6", "eletricidade"]]]] }),
			poder("Autodestruição", "icons/magic/fire/explosion-fireball-large-red-orange.webp",
				p("Prestes a revelar algo ou preso sem esperança de fuga: <b>uma rodada de aviso</b> (olhos brilhando, ponteiros girando descontrolados) e então explode, causando <b>8d6 de dano em raio de 6m</b>.",
					"O livro não dá tipo nem teste de resistência para a explosão."),
				{ exec: "free", area: "Raio de 6m", rolls: [["Explosão", [["8d6", ""]]]] })
		]
	});

	atores.canhao = await criarNPC({
		name: "Canhão de Fogo da Harpia",
		tokenName: "Canhão de Fogo",
		role: "canhao",
		link: true,
		img: `${T20I}/magias/explosao-de-chamas.webp`,
		nd: "1/4",
		cd: 20,
		tipo: "con",
		papel: "special",
		atr: { for: 0, des: -5, con: 0, int: -5, sab: -5, car: -5 },
		pv: 40,
		def: 10,
		walk: 0,
		ic: ["mental", "metabolismo", "cansaco"],
		res: { dano: { base: 10 } },
		recursos: { primary: { label: "Rodadas inativo", value: 0, max: 3 } },
		resTxt: "Objeto: 40 PV, RD 10. A Defesa 10 é sugestão (não está no livro).",
		bio: p(
			"Canhão operado pelos artilheiros bandoleiros. <b>40 PV e RD 10</b> (livro). Defesa 10 é sugestão.",
			"Uma vez por rodada: linha de 30m, <b>4d6 de fogo</b> e em chamas (Reflexos CD 20 reduz à metade e evita em chamas). Use a macro <i>Turno da Harpia</i>.",
			"Se um artilheiro cair, o canhão fica inativo por 1d3 rodadas (use o recurso <i>Rodadas inativo</i>)."
		),
		items: [
			poder("Disparo do Canhão de Fogo", `${T20I}/magias/explosao-de-chamas.webp`,
				p("Linha de 30m: <b>4d6 de fogo</b> e a vítima fica em chamas. Reflexos CD 20 reduz à metade e evita ficar em chamas."),
				{ exec: "action", area: "Linha de 30m", save: "Reflexos CD 20 reduz à metade e evita em chamas",
					rolls: [["Fogo", [["4d6", "fogo"]]]], effects: [emChamas()] }),
			poder("Inativo por 1d3 rodadas", "icons/svg/cancel.svg", p("Quando um artilheiro é derrotado."), { exec: "free", rolls: [["Rodadas", [["1d3", ""]]]] })
		]
	});

	/* ---------- Ator de apoio: a Harpia ---------- */
	atores.harpia = await criarNPC({
		name: "Harpia, o Gog'magogue (perigos)",
		tokenName: "Harpia",
		role: "harpia",
		link: true,
		img: `${T20I}/magias/raio-solar.webp`,
		nd: 5,
		cd: 20,
		tipo: "ani",
		papel: "special",
		atr: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
		pv: 1,
		def: 10,
		recursos: { primary: { label: "Rodada do ataque", value: 0, max: 10 } },
		bio: p(
			"<b>Ator de apoio, não vai para o mapa como combatente.</b> Cada item é um perigo da Harpia com a CD e os botões de efeito. Mire os personagens antes de clicar nos botões do card.",
			"Gog'magogue fêmea nascida em Arton, cega pelos captores e cortada todos os dias para que o sangue brilhante cegue os inimigos. Não tem nome; os \"bípedes\" a chamam de Harpia. Só deseja liberdade e sente que deve subir, cada vez mais alto.",
			"Na primeira rodada da iniciativa, só a Harpia (o canhão) age e dois cães saltam. Bandoleiros e cães agem a partir da segunda rodada. Use a macro <i>Ataque do Céu</i> para avançar as rodadas."
		),
		items: [
			poder("Luz Cegante", `${T20I}/magias/luz.webp`,
				p("O sangue brilhante da Harpia deixa <b>cego</b> quem está na área. Uma <b>ação de movimento ou 1 PM</b> para proteger os olhos reduz para <b>ofuscado</b> por 1 rodada.",
					"Ver a forma real dela exige 20 natural em Percepção; depois do primeiro contato, CD 30. Bandoleiros, cães e Torgo não são afetados. Dentro da nave, o brilho não incomoda mais.",
					"Use a macro <i>Luz da Harpia</i> ou os botões abaixo."),
				{ exec: "passive", effects: [cond("Cego"), cond("Ofuscado")] }),
			poder("Bater das Nadadeiras", `${T20I}/magias/sopro-das-uivantes.webp`,
				p("<b>Uma vez por rodada.</b> Cone de 9m. Ataques à distância no cone sofrem –5; chamas se apagam; névoa e fumaça se dispersam; mover-se em direção à Harpia conta como terreno difícil.",
					"Criaturas no cone são <b>empurradas 6m</b> e sofrem <b>1d6 de impacto</b> se baterem em algo. <b>Fortitude CD 20</b> reduz o empurrão à metade e evita o dano. Criaturas voando sofrem –5 no teste."),
				{ exec: "free", area: "Cone de 9m", save: "Fortitude CD 20 reduz à metade e evita o dano", rolls: [["Colisão", [["1d6", "impacto"]]]] }),
			poder("Canhão de Fogo", `${T20I}/magias/explosao-de-chamas.webp`,
				p("<b>Uma vez por rodada.</b> Linha de 30m: <b>4d6 de fogo</b> e em chamas (Reflexos CD 20 reduz à metade e evita em chamas). O canhão tem 40 PV e RD 10 (ator próprio)."),
				{ exec: "free", area: "Linha de 30m", save: "Reflexos CD 20 reduz à metade e evita em chamas",
					rolls: [["Fogo", [["4d6", "fogo"]]]], effects: [emChamas()] }),
			poder("Escadas de Corda e Escalada", `${T20I}/itens/gerais/corda.webp`,
				p("Na segunda rodada a Harpia desce escadas de corda. Ver as escadas: <b>Percepção CD 20</b>. Escalar leva 2 rodadas, às cegas. Defensores chutam quem sobe.",
					"A porta da nave: <b>Investigação CD 15</b> para achar como abaixar; abaixar é uma ação padrão.",
					"Quando a Harpia se afasta, há <b>3 rodadas</b> para alcançá-la (Atletismo, Acrobacia ou Cavalgar). Boas ideias continuam valendo depois disso."),
				{ exec: "passive" }),
			poder("Regras a Bordo", "icons/svg/hazard.svg",
				p("<b>Piso escorregadio</b> (Acrobacia CD 10 para equilíbrio).",
					"<b>Escadas entre deques:</b> custam 4,5m. Para descer de graça, Acrobacia CD 12; falha por 5 ou mais é queda com 1d6 de impacto.",
					"<b>Aberturas:</b> quem for empurrado para fora faz Reflexos CD 15 para se segurar.",
					"<b>Timoneira:</b> enquanto comanda, desprevenidos pelo piso sofrem –2 em perícias.",
					"<b>Espaço apertado:</b> armas de duas mãos sofrem –2 no ataque.",
					"<b>Túnel colapsado:</b> três testes de Força CD 25. <b>Cordames:</b> dois testes de Atletismo CD 15, às cegas; falha por 10 ou mais é queda (Reflexos CD 20 evita).",
					"<b>Leme:</b> Pilotagem CD 25 para assumir, sob ataque constante.",
					"Use a macro <i>Testes a Bordo</i>."),
				{ exec: "passive", rolls: [["Queda da escada", [["1d6", "impacto"]]]] })
		]
	});

	/* ---------- A família Gallobalt (sem ficha no livro: só para os tokens) ---------- */
	const SEM_FICHA = "<b>Não tem ficha no livro.</b> Este ator existe para o token no mapa e para mostrar a arte aos jogadores.";
	const gallobalt = (role, name, arq, raca, atr, bio) => criarNPC({
		name, role, img: `${ARTE}/${arq}.webp`, disposition: 0, link: true,
		nd: 1, tipo: raca === "osteon" ? "mor" : "hum", raca, papel: "special", atr, pv: 10, def: 10, bio: p(bio, SEM_FICHA)
	});
	atores.nathanael = await gallobalt("nathanael", "Nathanael Gallobalt", "nathanael", "suraggel", { for: 2, des: 1, con: 2, int: 0, sab: 1, car: 0 },
		"Comanda a fazenda com a irmã Salisha. Pôs o aviso no quadro do Forte. Acha que o ataque é coisa de uma guilda rival. Desconfia de forasteiros e de autoridades.");
	atores.salisha = await gallobalt("salisha", "Salisha Gallobalt", "salisha", "suraggel", { for: 1, des: 2, con: 1, int: 0, sab: 1, car: 1 },
		"Comanda a fazenda com o irmão Nathanael. Acha que o ataque é obra de um demônio.");
	atores.ritanna = await gallobalt("ritanna", "Ritanna Gallobalt", "ritanna", "medusa", { for: 0, des: 2, con: 1, int: 1, sab: 1, car: 1 },
		"Medusa da família Gallobalt.");
	atores.haran = await gallobalt("haran", "Haran Gallobalt", "haran", "osteon", { for: 1, des: 1, con: 1, int: 0, sab: 1, car: 0 },
		"Osteon da família Gallobalt.");
	atores.jansel = await gallobalt("jansel", "Jansel Gallobalt", "jansel", "suraggel", { for: 1, des: 1, con: 1, int: 0, sab: 0, car: 1 },
		"18 anos, casado com Vadrinne. Acha que o ataque é uma possessão. Troca olhares cúmplices com a esposa (Percepção ou Intuição 20).");
	atores.alon = await gallobalt("alon", "Alon Gallobalt", "alon", "suraggel", { for: -1, des: 2, con: 0, int: 0, sab: 1, car: 1 },
		"10 anos, inquieto com tudo o que está acontecendo (Percepção ou Intuição para notar).");
	atores.vadrinne = await gallobalt("vadrinne", "Vadrinne Gallobalt", "vadrinne", "dahllan", { for: 0, des: 1, con: 1, int: 0, sab: 0, car: 2 },
		"Dahllan, irmã de Annabel (das Dahllan Daninhas), casada com Jansel. Carrega o <b>implante de cristal</b>: na rodada 2 do ataque ele liga e ela caminha até a plantação em 5 rodadas. Use a macro <i>Cirurgia do Implante</i> para retirá-lo.");

	/* ---------- Ator de apoio: a fazenda ---------- */
	atores.fazenda = await criarNPC({
		name: "Fazendas Gallobalt (investigação)",
		tokenName: "Fazendas Gallobalt",
		role: "fazenda",
		disposition: 1,
		img: "icons/svg/village.svg",
		nd: 4,
		cd: 20,
		tipo: "hum",
		papel: "special",
		atr: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
		pv: 1,
		def: 10,
		bio: p("<b>Ator de apoio, não vai para o mapa.</b> Cada item é uma pista ou teste da investigação nas Fazendas Gallobalt, com a CD do livro."),
		items: [
			poder("Autópsia das Cabras", "icons/svg/skull.svg",
				p("<b>Cura ou Investigação CD 25:</b> as cabras foram mortas por fogo, por algo que as arremessou com força (o vento das nadadeiras) e por espadas.",
					"Mais um teste CD 25 revela outros detalhes do ataque."), { exec: "passive" }),
			poder("Plantação Queimada", "icons/svg/fire.svg",
				p("<b>Investigação ou Sobrevivência CD 20:</b> pegadas de botas e de cães grandes. <b>CD 25:</b> marcas de gazuas na cerca.",
					"<b>Misticismo CD 20:</b> resquícios de uma aura infernal."), { exec: "passive" }),
			poder("Testemunhos da Família", "icons/svg/eye.svg",
				p("<b>Percepção ou Intuição:</b> Alon está inquieto. <b>20 ou mais:</b> nota Jansel e Vadrinne trocando um olhar cúmplice.",
					"Cada Gallobalt tem uma teoria: Salisha acha que é um demônio; Jansel, uma possessão; Nathanael, uma guilda rival."), { exec: "passive" }),
			poder("Implante de Vadrinne", `${T20I}/itens/gerais/po-de-cristal.webp`,
				p("Pequeno objeto de cristal sob a pele da dahllan. <b>Retirar:</b> teste estendido de <b>Cura CD 25, 3 sucessos</b>. Na falha, Vadrinne tem complicações e a cirurgia só pode ser retomada em 1d4+1 dias. Use a macro <i>Cirurgia do Implante</i>.",
					"<b>Examinar:</b> Ofício (engenhoqueiro) ou Misticismo CD 30 (+5 se já removido). Revela uma junção de ciência e magia que controla o corpo dela por períodos curtos, ligada aos olhos.",
					"<b>Quando liga</b> (rodada 2 do ataque): CD 25 percebe que monitora, CD 30 que transmite, CD 35 que busca uma mente. Vadrinne caminha até a plantação ao longo de 5 rodadas."),
				{ exec: "passive", rolls: [["Dias até retomar a cirurgia", [["1d4+1", ""]]]] }),
			poder("Abordagem Passiva", "icons/svg/clockwork.svg",
				p("Se o grupo apenas esperar, o próximo ataque vem em <b>2d10 dias</b>."), { exec: "passive", rolls: [["Dias até o ataque", [["2d10", ""]]]] })
		]
	});

	/* ------------------------------------------------------------------ */
	/* 3. Itens                                                             */
	/* ------------------------------------------------------------------ */
	const itemDoc = (d) => ({ ...d, folder: pasta.Item, flags: FLAGS() });
	const novosItens = [];

	const essencia = await game.packs.get("tormenta20.equipamentos")?.getDocument("wvhGMjj9dIItdm7P").catch(() => null);
	if (essencia) {
		const data = essencia.toObject();
		delete data._id;
		data.folder = pasta.Item;
		data.flags = foundry.utils.mergeObject(data.flags ?? {}, FLAGS());
		data.system.description.value = `${p("Extraída dos cães do inferno: 1d4 doses por cão (Ofício alquimista ou Misticismo CD 17).")}<hr>${data.system.description.value ?? ""}`;
		novosItens.push(data);
	} else {
		novosItens.push(itemDoc({
			name: "Essência Abissal",
			type: "tesouro",
			img: `${T20I}/itens/gerais/essencia-abissal.webp`,
			system: { description: { value: p("Extraída dos cães do inferno: 1d4 doses por cão (CD 17).") }, qtd: 1, preco: 0, peso: 0, espacos: 0 }
		}));
	}

	novosItens.push(
		itemDoc({
			name: "Implante de Cristal de Vadrinne",
			type: "tesouro",
			img: `${T20I}/itens/gerais/po-de-cristal.webp`,
			system: {
				description: { value: p(
					"Cristal rosado retirado de baixo da pele de Vadrinne, igual aos olhos dos bandoleiros e aos cristais da máquina de Lorelei.",
					"Ofício (engenhoqueiro) ou Misticismo CD 30 (+5 por já estar removido): ciência e magia juntas; controla o corpo da hospedeira por períodos curtos e está ligado aos olhos dela."
				) },
				qtd: 1, preco: 0, peso: 0, espacos: 0
			}
		}),
		itemDoc({
			name: "Instruções de Syvarian a Torgo",
			type: "tesouro",
			img: `${T20I}/itens/gerais/pergaminho.webp`,
			system: {
				description: { value: p("Pergaminho encontrado no gog'magogue, com um sinete de relógio. O texto está no diário da aventura (handout).") },
				qtd: 1, preco: 0, peso: 0, espacos: 0
			}
		})
	);
	const itensCriados = await Item.createDocuments(novosItens);
	const itemPorNome = (inicio) => itensCriados.find((i) => i.name.startsWith(inicio));

	/* ------------------------------------------------------------------ */
	/* 4. Macros de mesa                                                    */
	/* ------------------------------------------------------------------ */

	async function macroAtaqueDoCeu() {
		const harpia = game.actors.find((a) => a.getFlag("world", "fdtRole") === "harpia");
		if (!harpia) return ui.notifications.error("Ator da Harpia não encontrado (puxe a aventura do compêndio com a macro FdT · Puxar do compêndio).");
		const atual = harpia.system.resources.primary.value;
		const FASES = [
			"<b>Rodada 1 · Aproximação.</b> Uma luz cegante surge no céu e desce sobre a fazenda. Todos na área ficam <b>cegos</b> (ação de movimento ou 1 PM para reduzir a ofuscado por 1 rodada). Só a Harpia age: <b>Canhão de Fogo</b>. <b>Dois cães do inferno</b> saltam. Quatro bandoleiros e dois cães já estão em solo (Percepção CD 20 para notá-los).",
			"<b>Rodada 2 · Escadas.</b> A Harpia desce as escadas de corda (Percepção CD 20 para vê-las). <b>O implante de Vadrinne liga</b>: ela começa a caminhar até a plantação (5 rodadas). Bandoleiros e cães agem a partir de agora. A Harpia usa Canhão e Nadadeiras.",
			"<b>Rodada 3.</b> Vadrinne avança (faltam 4 rodadas). Quem subir a escada leva 2 rodadas, às cegas, e enfrenta os chutes dos defensores.",
			"<b>Rodada 4.</b> Vadrinne avança (faltam 3 rodadas).",
			"<b>Rodada 5.</b> Vadrinne avança (faltam 2 rodadas).",
			"<b>Rodada 6.</b> Vadrinne avança (falta 1 rodada).",
			"<b>Rodada 7.</b> Vadrinne chega à plantação. Se os bandoleiros não derrubarem os heróis no convés, recuam para dentro da nave. Quando a Harpia começar a se afastar, o grupo tem <b>3 rodadas</b> para alcançá-la."
		];
		const escolha = await foundry.applications.api.DialogV2.wait({
			window: { title: `Ataque do Céu · rodada ${atual}` },
			content: "<p>Avançar o ataque uma rodada, ou zerar o contador?</p>",
			buttons: [
				{ action: "avancar", label: "Avançar", default: true },
				{ action: "zerar", label: "Zerar" }
			]
		});
		if (escolha === "zerar") return harpia.update({ "system.resources.primary.value": 0 });
		if (escolha !== "avancar") return;
		const nova = atual + 1;
		await harpia.update({ "system.resources.primary.value": Math.min(nova, harpia.system.resources.primary.max || 10) });
		const txt = FASES[nova - 1] ?? `<b>Rodada ${nova}.</b> A Harpia continua: Canhão de Fogo e Bater das Nadadeiras, uma vez cada. A luz continua cegando quem está fora da nave.`;
		ChatMessage.create({ content: `<h3>O Terror que Veio do Céu</h3><p>${txt}</p>` });
	}

	async function macroLuz() {
		const alvos = game.user.targets.size ? [...game.user.targets] : canvas.tokens.controlled;
		if (!alvos.length) return ui.notifications.warn("Mire ou selecione os tokens dentro da luz.");
		const escolha = await foundry.applications.api.DialogV2.wait({
			window: { title: "Luz da Harpia" },
			content: `<p>${alvos.length} token(s). O que aconteceu?</p>`,
			buttons: [
				{ action: "cegar", label: "Cegar", default: true },
				{ action: "proteger", label: "Protegeu os olhos (ofuscado)" },
				{ action: "limpar", label: "Saiu da luz" }
			]
		});
		if (!escolha) return;
		const nomes = [];
		for (const t of alvos) {
			const a = t.actor;
			if (!a) continue;
			if (escolha === "cegar" && a.system.tracos?.ic?.value?.includes("ofuscado")) {
				nomes.push(`${a.name} (imune)`);
				continue;
			}
			await fdtAplicar.status(a, "cego", { active: escolha === "cegar" });
			await fdtAplicar.status(a, "ofuscado", { active: escolha === "proteger" });
			nomes.push(a.name);
		}
		const msg = { cegar: "fica <b>cego</b> pela luz", proteger: "protege os olhos e fica <b>ofuscado</b> por 1 rodada (ação de movimento ou 1 PM)", limpar: "sai da luz" }[escolha];
		ChatMessage.create({ content: `<h3>Luz da Harpia</h3><p>${nomes.join(", ")}: ${msg}.</p>` });
	}

	async function macroTurnoHarpia() {
		const alvos = [...game.user.targets].map((t) => t.actor).filter(Boolean);
		if (!alvos.length) return ui.notifications.warn("Mire (target) as criaturas no cone ou na linha.");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Turno da Harpia" },
			content: `
				<div class="form-group"><label>Ação</label><select name="acao">
					<option value="canhao">Canhão de Fogo (linha 30m, Ref CD 20)</option>
					<option value="nadadeiras">Bater das Nadadeiras (cone 9m, Fort CD 20)</option></select></div>
				<div class="form-group"><label>Nadadeiras: alvos voando (–5)</label><input type="checkbox" name="voando"></div>
				<div class="form-group"><label>Nadadeiras: quem falhou bate em algo</label><input type="checkbox" name="colide" checked></div>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		let html = "";
		if (res.acao === "canhao") {
			const dano = await new Roll("4d6[fogo]").evaluate();
			rolls.push(dano);
			html = `<h3>Canhão de Fogo</h3><p>Linha de 30m: <b>${dano.total}</b> de fogo. Reflexos CD 20 reduz à metade e evita em chamas.</p><ul>`;
			const chamas = {
				name: "Incendiado (em chamas)",
				img: "icons/magic/fire/flame-burning-embers-yellow.webp",
				type: "base",
				statuses: ["emchamas"],
				description: "1d6 de fogo no início de cada turno. Ação padrão para apagar.",
				flags: { world: { fdt: "av4", fdtChamas: true } },
				system: { changes: [{ key: "danoContinuo", value: "1d6[fogo]", type: "custom", phase: "initial", priority: null }] }
			};
			// O card leva o dano (metade para quem passa) e o efeito em chamas para quem falha: o Mestre aplica pelos botões.
			const testes = await fdtTestes(alvos.map((a) => ({ ator: a, pericia: "refl", cd: 20, dano, metade: true, titulo: "Canhão de Fogo", falha: "dano total e fica em chamas.", falhaEfeito: chamas })));
			for (const [i, a] of alvos.entries()) {
				const r = testes[i];
				rolls.push(r);
				const ok = r.total >= 20;
				html += `<li>${a.name}: Reflexos <b>${r.total}</b> ${ok ? "✔️ metade" : "❌ dano total e em chamas"}</li>`;
			}
			html += "</ul>";
		} else {
			const pen = res.voando ? -5 : 0;
			html = "<h3>Bater das Nadadeiras</h3><p>Cone de 9m. Ataques à distância no cone sofrem –5, chamas se apagam, névoa e fumaça se dispersam e avançar em direção à Harpia é terreno difícil.</p><ul>";
			const testes = await fdtTestes(alvos.map((a) => ({ ator: a, pericia: "fort", cd: 20, extra: pen, titulo: "Bater das Nadadeiras", falha: `empurrado 6m${res.colide ? " e bate em algo (1d6 de impacto)" : ""}.`, sucesso: "empurrado só 3m, sem dano." })));
			for (const [i, a] of alvos.entries()) {
				const r = testes[i];
				rolls.push(r);
				const ok = r.total >= 20;
				let extra = "";
				if (!ok && res.colide) {
					const d = await new Roll("1d6[impacto]").evaluate();
					rolls.push(d);
					await fdtAplicar.dano(a, d, 1);
					extra = `, bate e sofre ${d.total} de impacto`;
				}
				html += `<li>${a.name}: Fortitude <b>${r.total}</b> ${ok ? "✔️ empurrado só 3m, sem dano" : `❌ empurrado 6m${extra}`}</li>`;
			}
			html += "</ul><p style=\"font-size:0.85em\">Mova os tokens à mão, para longe da Harpia.</p>";
		}
		ChatMessage.create({ content: html + "<p style=\"font-size:0.85em\">O Mestre aplica o dano pelos botões (a RD entra na hora).</p>", rolls });
	}

	async function macroBordo() {
		const atores = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		if (!atores.length) return ui.notifications.warn("Selecione os tokens dos personagens.");
		const SIT = {
			piso: { nome: "Equilíbrio no piso escorregadio", pericia: "acro", cd: 10 },
			escada: { nome: "Descer a escada entre deques", pericia: "acro", cd: 12 },
			borda: { nome: "Segurar-se na borda (empurrado para fora)", pericia: "refl", cd: 15 },
			cordame: { nome: "Cordames (às cegas)", pericia: "atle", cd: 15 },
			queda: { nome: "Evitar a queda do cordame", pericia: "refl", cd: 20 },
			tunel: { nome: "Desbloquear túnel colapsado", pericia: "atle", cd: 25, atributo: "for" },
			leme: { nome: "Assumir o leme", pericia: "pilo", cd: 25 },
			alcancar: { nome: "Alcançar a Harpia que foge", pericia: "atle", cd: 15 }
		};
		const opcoes = Object.entries(SIT).map(([k, s]) => `<option value="${k}">${s.nome} (CD ${s.cd})</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Testes a Bordo da Harpia" },
			content: `
				<div class="form-group"><label>Situação</label><select name="sit">${opcoes}</select></div>
				<div class="form-group"><label>Perícia no lugar (opcional)</label><select name="troca">
					<option value="">A da situação</option><option value="acro">Acrobacia</option><option value="atle">Atletismo</option>
					<option value="cava">Cavalgar</option><option value="pilo">Pilotagem</option></select></div>
				<div class="form-group"><label>Timoneira no comando (–2 se desprevenido)</label><input type="checkbox" name="timoneira" checked></div>
				<div class="form-group"><label>Modificador extra</label><input type="number" name="mod" value="0"></div>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const s = SIT[res.sit];
		const rolls = [];
		let html = `<h3>${s.nome}</h3><p>CD ${s.cd}</p><ul>`;
		const per = res.troca || s.pericia;
		const penDe = (a) => (res.timoneira && a.statuses?.has?.("desprevenido") ? -2 : 0);
		const testes = await fdtTestes(atores.map((a) => ({ ator: a, pericia: s.atributo ? null : per, atributo: s.atributo, cd: s.cd, extra: penDe(a) + (Number(res.mod) || 0), titulo: s.nome })));
		for (const [i, a] of atores.entries()) {
			const pen = penDe(a);
			const r = testes[i];
			rolls.push(r);
			const ok = r.total >= s.cd;
			const falhaPor = s.cd - r.total;
			let txt = ok ? "✔️" : "❌";
			switch (res.sit) {
				case "piso": {
					const treinado = a.system.pericias?.acro?.treinado;
					if (ok) txt += " avança metade do deslocamento";
					else if (falhaPor >= 5) { txt += " cai"; await fdtAplicar.status(a, "caido", { active: true }); }
					else txt += " não avança";
					if (!treinado) { txt += " · desprevenido (não treinado)"; await fdtAplicar.status(a, "desprevenido", { active: true }); }
					break;
				}
				case "escada": {
					if (ok) txt += " desce sem gastar deslocamento";
					else if (falhaPor >= 5) {
						const d = await new Roll("1d6[impacto]").evaluate();
						rolls.push(d);
						await fdtAplicar.dano(a, d, 1);
						await fdtAplicar.status(a, "caido", { active: true });
						txt += ` cai: ${d.total} de impacto e caído`;
					} else txt += " gasta 4,5m de deslocamento";
					break;
				}
				case "cordame":
					txt += ok ? " avança (2 sucessos atravessam)" : falhaPor >= 10 ? " <b>cai!</b> Role Reflexos CD 20 (situação seguinte)" : " não progride";
					break;
				case "queda": txt += ok ? " se agarra" : " despenca da nave"; break;
				case "borda": txt += ok ? " se segura na beirada" : " cai da nave"; break;
				case "tunel": txt += ok ? " um sucesso (3 desbloqueiam)" : " não move os escombros"; break;
				case "leme": txt += ok ? " assume o leme, sob ataque constante" : " a timoneira mantém o controle"; break;
				case "alcancar": txt += ok ? " alcança a nave" : " fica para trás"; break;
			}
			html += `<li>${a.name}: <b>${r.total}</b> ${txt}${pen ? " (–2 timoneira)" : ""}</li>`;
		}
		html += "</ul>";
		if (res.sit === "alcancar") html += "<p style=\"font-size:0.85em\">A CD 15 é sugestão: o livro só diz Atletismo, Acrobacia ou Cavalgar, com 3 rodadas antes de a nave ficar longe demais.</p>";
		ChatMessage.create({ content: html, rolls });
	}

	async function macroCirurgia() {
		const medico = canvas.tokens.controlled[0]?.actor;
		if (!medico) return ui.notifications.warn("Selecione o token de quem faz a cirurgia.");
		const CHAVE = "fdtCirurgia";
		const estado = game.user.getFlag("world", CHAVE) ?? { sucessos: 0, falhas: 0 };
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Cirurgia do Implante de Vadrinne" },
			content: `
				<p>Cura CD 25, teste estendido: <b>3 sucessos antes de 3 falhas</b>. Progresso: ${estado.sucessos} sucessos, ${estado.falhas} falhas.</p>
				<div class="form-group"><label>Modificador extra</label><input type="number" name="mod" value="0"></div>
				<div class="form-group"><label>Zerar o progresso antes</label><input type="checkbox" name="zerar"></div>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.zerar) { estado.sucessos = 0; estado.falhas = 0; }
		const r = await fdtTeste(medico, "cura", { cd: 25, extra: Number(res.mod) || 0, titulo: "Cirurgia do Implante", motivo: `Teste estendido: 3 sucessos antes de 3 falhas (${estado.sucessos} sucessos, ${estado.falhas} falhas até agora).` });
		const rolls = [r];
		if (r.total >= 25) estado.sucessos++; else estado.falhas++;
		let html = `<h3>Cirurgia do Implante</h3><p>${medico.name}: Cura <b>${r.total}</b> (CD 25) ${r.total >= 25 ? "✔️" : "❌"}</p><p>Progresso: <b>${estado.sucessos}/3</b> sucessos, <b>${estado.falhas}/3</b> falhas.</p>`;
		if (estado.sucessos >= 3) html += "<p><b>O cristal sai!</b> Examiná-lo: Ofício (engenhoqueiro) ou Misticismo CD 30, com +5 agora que foi removido.</p>";
		else if (estado.falhas >= 3) {
			const d = await new Roll("1d4+1").evaluate();
			rolls.push(d);
			html += `<p><b>Complicações!</b> A vida de Vadrinne corre risco e a cirurgia é interrompida. Só pode ser retomada em <b>${d.total} dias</b>.</p>`;
		}
		if (estado.sucessos >= 3 || estado.falhas >= 3) await game.user.unsetFlag("world", CHAVE);
		else await game.user.setFlag("world", CHAVE, estado);
		ChatMessage.create({ content: html, rolls });
	}

	async function macroElemental() {
		const torgo = game.actors.find((a) => a.getFlag("world", "fdtRole") === "torgo");
		if (!torgo) return ui.notifications.error("Torgo não encontrado (puxe a aventura do compêndio com a macro FdT · Puxar do compêndio).");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Elemental Elétrico" },
			content: `<p>Dano <b>mágico de eletricidade</b> que Torgo sofreria (antes da RD):</p>
				<div class="form-group"><label>Dano</label><input type="number" name="dano" value="0" autofocus></div>`,
			ok: { label: "Absorver", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const cura = Math.floor((Number(res.dano) || 0) / 2);
		await fdtAplicar.curar(torgo, cura, `${torgo.name}: recupera ${cura} PV`);
		ChatMessage.create({ content: `<h3>Elemental Elétrico</h3><p>A eletricidade é absorvida pelo relógio no peito de ${torgo.name}: ele <b>recupera ${cura} PV</b>.</p><p>Até o fim do próximo turno, pancadas e Olhar Elétrico causam <b>+1d6 de eletricidade</b> (marque <i>Carga elétrica</i> na pancada; use a rolagem \"Com carga elétrica\" do Olhar).</p>` });
	}

	/* Macro: monta as cenas dos mapas da Av4 (imagens do módulo, grid, paredes, portas, luzes e notas do Mestre).
	 * As coordenadas foram traçadas à mão sobre uma cópia reduzida de cada imagem; "k" converte para pixels da
	 * cena (1 quadrado = 100 px = 1,5 m). Confira no editor de paredes. Cenas que já existem não são tocadas,
	 * a não ser que o Mestre peça. */
	async function macroCenas() {
		const DIR = "modules/giriarpg-fim-dos-tempos/assets/arco1/av4-terror/mapas";
		const TIPOS = {
			parede: { move: 20, sight: 20, light: 20, sound: 20 },
			janela: { move: 20, sight: 0, light: 0, sound: 10 },
			mureta: { move: 20, sight: 0, light: 0, sound: 0 },
			porta: { move: 20, sight: 20, light: 20, sound: 20, door: 1, ds: 0 }
		};
		const LUZ = {
			lareira: { bright: 2, dim: 6, color: "#ff8a3d", alpha: 0.45, animation: { type: "torch", speed: 3, intensity: 3 } },
			lampiao: { bright: 2, dim: 6, color: "#ffc070", alpha: 0.4, animation: { type: "torch", speed: 2, intensity: 2 } },
			vela: { bright: 1, dim: 3, color: "#ffb35c", alpha: 0.35, animation: { type: "torch", speed: 2, intensity: 2 } }
		};
		const CENAS = [
			{
				id: "av4-fazenda", nome: "Av4 · Fazendas Gallobalt · Chegada", arquivo: "entrada-fazenda", w: 14, h: 21, k: 1.909, escuro: 0, dia: true,
				paredes: [
					["parede", [733, 128, 250, 128, 250, 360, 450, 360, 450, 578, 555, 578]],
					["porta", [555, 578, 605, 578]],
					["parede", [605, 578, 683, 578, 683, 522, 733, 522]]
				],
				luzes: [],
				notas: [
					[580, 610, "Porta do casarão: o interior é a cena do casarão"],
					[130, 860, "Estrada da chegada (F2)"],
					[50, 450, "Plantação de achbuld (detalhe na cena da plantação)"],
					[580, 700, "Depósito de barris e ferramentas"]
				]
			},
			{
				id: "av4-casarao", nome: "Av4 · Fazendas Gallobalt · Casarão", arquivo: "casarao-gallobalt", w: 21, h: 12, k: 1.909, escuro: 0.3,
				paredes: [
					["parede", [83, 300, 83, 68, 122, 68, 122, 25, 220, 25, 220, 68, 318, 68, 318, 28, 688, 28, 688, 68, 890, 68, 890, 25, 985, 25, 985, 68, 1030, 68, 1030, 590, 690, 590, 690, 300, 540, 300]],
					["porta", [540, 300, 475, 300]],
					["parede", [475, 300, 265, 300]],
					["janela", [265, 300, 260, 330, 250, 360, 160, 360, 140, 330, 100, 300]], ["parede", [100, 300, 83, 300]],
					["parede", [320, 68, 320, 165]], ["porta", [320, 165, 320, 205]], ["parede", [320, 205, 320, 300]],
					["parede", [688, 68, 688, 120]], ["porta", [688, 120, 688, 180]], ["parede", [688, 180, 688, 300]],
					["parede", [750, 240, 750, 250]], ["porta", [750, 250, 750, 290]], ["parede", [750, 290, 750, 380]],
					["porta", [750, 380, 750, 420]], ["parede", [750, 420, 750, 480]],
					["parede", [750, 240, 1030, 240]], ["parede", [750, 362, 1030, 362]],
					["porta", [695, 480, 745, 480]], ["parede", [745, 480, 1030, 480]],
					["parede", [905, 480, 905, 520]], ["porta", [905, 520, 905, 560]], ["parede", [905, 560, 905, 590]],
					["mureta", [95, 300, 95, 590, 530, 590]]
				],
				luzes: [["lareira", 170, 95], ["lareira", 937, 95], ["vela", 500, 160], ["vela", 890, 300], ["vela", 890, 420]],
				notas: [
					[200, 200, "Sala: o vinho de Nathanael"],
					[500, 120, "Sala de jantar: acolhida e depoimentos (F2 e F3)"],
					[880, 150, "Cozinha"],
					[890, 300, "Quarto de Jansel e Vadrinne"],
					[890, 420, "Quarto de Alon"],
					[790, 540, "Escritório"],
					[250, 480, "Quintal"],
					[1000, 560, "Este mapa também serve para as outras duas casas da fazenda"]
				]
			},
			{
				id: "av4-plantacao", nome: "Av4 · Fazendas Gallobalt · Plantação de achbuld", arquivo: "plantacao-achbuld", w: 22, h: 32, k: 2.907, escuro: 0, dia: true,
				paredes: [
					["mureta", [0, 200, 205, 200, 205, 145]],
					["mureta", [350, 0, 350, 268, 425, 268]], ["mureta", [545, 268, 677, 268]]
				],
				luzes: [],
				notas: [
					[100, 90, "Galpão de secagem"],
					[520, 120, "Armazém da colheita"],
					[380, 600, "Faixas queimadas: o rastro do Ataque do Céu (F3 e F5)"],
					[380, 380, "F5 Contato Imediato: a Harpia paira sobre a plantação (macros Luz da Harpia, Ataque do Céu e Turno da Harpia)"],
					[150, 330, "Vadrinne leva 5 rodadas para chegar da casa até aqui"],
					[650, 900, "Fumaça das faixas queimadas"]
				]
			},
			{
				id: "av4-conves", nome: "Av4 · A Harpia · Convés", arquivo: "harpia-conves", w: 18, h: 27, k: 2.4557, escuro: 0.7,
				paredes: [
					["mureta", [367, 0, 415, 40, 445, 100, 470, 170, 540, 175, 570, 240, 585, 330, 590, 450, 590, 600, 580, 700, 555, 800, 520, 900, 470, 1020, 290, 1020, 240, 920, 195, 820, 160, 720, 145, 600, 145, 450, 150, 330, 165, 240, 195, 175, 265, 170, 290, 100, 320, 40, 367, 0]],
					["parede", [335, 715, 335, 800]], ["parede", [410, 715, 410, 800]],
					["parede", [230, 860, 335, 860]], ["parede", [410, 860, 525, 860]], ["parede", [370, 880, 370, 1020]]
				],
				luzes: [["lampiao", 370, 820], ["vela", 465, 770], ["vela", 300, 790]],
				notas: [
					[370, 400, "Canhão de Fogo: linha de 30 m, 4d6 de fogo, Reflexos CD 20 reduz à metade. 40 PV, RD 10; o artilheiro ganha +5 na Defesa"],
					[370, 250, "Regras a bordo: piso escorregadio (CD 10), escadas contam 3 quadrados, armas de duas mãos −2 (macro Testes a Bordo)"],
					[250, 590, "Escotilha: desce para os túneis e a estufa"],
					[150, 420, "Escada de corda"],
					[585, 420, "Escada de corda"],
					[210, 735, "Guincho"],
					[370, 525, "Emblema do relógio"],
					[100, 900, "Nadadeiras: cone de 9 m, empurra 6 m"]
				]
			},
			{
				id: "av4-leme", nome: "Av4 · A Harpia · Ponte de comando", arquivo: "harpia-leme", w: 21, h: 12, k: 1.909, escuro: 0.6,
				paredes: [
					["parede", [318, 505, 318, 230, 360, 140]],
					["janela", [360, 140, 440, 85, 545, 62, 650, 85, 730, 140]],
					["parede", [730, 140, 772, 230, 772, 505, 700, 555, 620, 530, 590, 528]],
					["porta", [590, 528, 500, 528]],
					["parede", [500, 528, 470, 530, 390, 555, 318, 505]]
				],
				luzes: [["lampiao", 435, 165], ["lampiao", 650, 165]],
				notas: [
					[545, 300, "Timão: Pilotagem CD 25 para controlar a Harpia"],
					[545, 450, "Luta final contra Torgo (F6)"],
					[700, 240, "Luneta"],
					[730, 380, "Painel de comando"]
				]
			}
		];

		const ids = new Set(CENAS.map((c) => c.id));
		const existentes = game.scenes.filter((s) => ids.has(s.getFlag("world", "fdtCena")));
		let recriar = false;
		if (existentes.length) {
			recriar = await foundry.applications.api.DialogV2.confirm({
				window: { title: "Av4: cenas dos mapas" },
				content: `<p>Já existem <b>${existentes.length}</b> cenas da Av4 criadas por esta macro.</p>
					<p><b>Sim</b> apaga essas cenas e cria de novo (tokens, paredes e ajustes feitos à mão nelas se perdem).<br>
					<b>Não</b> mantém as que existem e cria só as que faltam.</p>`
			});
			if (recriar) await Scene.deleteDocuments(existentes.map((s) => s.id));
		}
		const ja = new Set(recriar ? [] : existentes.map((s) => s.getFlag("world", "fdtCena")));
		const diario = game.journal.find((j) => j.name?.startsWith("Aventura 4 ·"));
		const criadas = [];
		const pulei = [];
		for (const c of CENAS) {
			if (ja.has(c.id)) {
				pulei.push(c.nome);
				continue;
			}
			const src = `${DIR}/${c.arquivo}.webp`;
			const W = c.w * 100;
			const H = c.h * 100;
			const px = (v, max) => Math.min(max, Math.max(0, Math.round(v * c.k)));
			const walls = [];
			for (const [tipo, p] of c.paredes) {
				for (let i = 0; i + 3 < p.length; i += 2) walls.push({ c: [px(p[i], W), px(p[i + 1], H), px(p[i + 2], W), px(p[i + 3], H)], ...TIPOS[tipo] });
			}
			const dados = {
				name: c.nome,
				navigation: false,
				width: W,
				height: H,
				padding: 0.1,
				backgroundColor: "#111111",
				grid: { type: 1, size: 100, distance: 1.5, units: "m" },
				tokenVision: true,
				environment: { darknessLevel: c.escuro, globalLight: { enabled: !!c.dia } },
				walls,
				lights: c.luzes.map(([t, x, y]) => ({ x: px(x, W), y: px(y, H), config: { ...LUZ[t] } })),
				notes: c.notas.map(([x, y, text]) => ({ x: px(x, W), y: px(y, H), text, entryId: diario?.id ?? null, iconSize: 32, texture: { src: "icons/svg/book.svg" } })),
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
			criadas.push(cena);
		}
		const lista = criadas.map((s) => `<li>@UUID[${s.uuid}]{${s.name}}</li>`).join("");
		ChatMessage.create({
			whisper: [game.user.id],
			content: `<h3>Av4 · Cenas dos mapas</h3>${criadas.length ? `<p>Criadas:</p><ul>${lista}</ul>` : "<p>Nenhuma cena nova.</p>"}${pulei.length ? `<p>Já existiam (não mexi): ${pulei.join(", ")}.</p>` : ""}<p style="font-size:0.85em">Grid de 1,5 m, paredes, portas, luzes e notas do Mestre. As paredes foram traçadas sobre as imagens: confira e ajuste no editor de paredes antes da sessão. A amurada da Harpia e as cercas dos galpões são muretas (bloqueiam passagem, não a visão).</p>`
		});
	}

	const macro = (name, img, fn) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Aventura 4 · gerado por av4-terror-do-ceu.js\n${usaFdt(fn) ? FDT_TESTE : ""}${chamar(fn, `(${codigo(fn)})()`)}`
	});
	const macros = await Macro.createDocuments([
		macro("Av4 · Ataque do Céu", `${T20I}/magias/raio-solar.webp`, macroAtaqueDoCeu),
		macro("Av4 · Luz da Harpia", `${T20I}/magias/luz.webp`, macroLuz),
		macro("Av4 · Turno da Harpia", `${T20I}/magias/explosao-de-chamas.webp`, macroTurnoHarpia),
		macro("Av4 · Testes a Bordo", `${T20I}/itens/gerais/corda.webp`, macroBordo),
		macro("Av4 · Cirurgia do Implante", `${T20I}/itens/gerais/po-de-cristal.webp`, macroCirurgia),
		macro("Av4 · Elemental Elétrico (Torgo)", `${T20I}/magias/relampago.webp`, macroElemental),
		macro("Av4 · Montar cenas dos mapas", "icons/svg/house.svg", macroCenas)
	]);
	const linkMacro = (trecho) => {
		const m = macros.find((x) => x.name.includes(trecho));
		return m ? `@UUID[${m.uuid}]{${m.name}}` : trecho;
	};

	/* ------------------------------------------------------------------ */
	/* 5. Diário da aventura                                                */
	/* ------------------------------------------------------------------ */
	const L = (d) => (d?.uuid ? `@UUID[${d.uuid}]{${d.name}}` : "");
	const pagina = (name, content, sort) => ({ name, type: "text", sort, text: { content, format: 1 } });

	await JournalEntry.create({
		name: "Aventura 4 · O Terror que Veio do Céu",
		folder: pasta.JournalEntry,
		flags: FLAGS(),
		pages: [
			pagina("Guia do Mestre", `
				<h2>Resumo</h2>
				<p>${L(atores.torgo)}, sob ordens diretas de Syvarian, quer expulsar os Gallobalt das Colinas para ficar com o achbuld que eles plantam. A bordo da Harpia, um gog'magogue escravizado e cego, ele ataca à noite com uma luz cegante, cães do inferno e bandoleiros de olhos de cristal. Vadrinne, a dahllan da família, carrega um implante que a controla.</p>
				<h2>Fases</h2>
				<ol>
					<li><b>O aviso</b> de Nathanael Gallobalt no quadro do Forte.</li>
					<li><b>As Fazendas Gallobalt:</b> família, teorias e investigação (cabras, plantação, implante).</li>
					<li><b>O ataque</b>: a luz no céu, cães, bandoleiros e o Canhão de Fogo.</li>
					<li><b>A bordo da Harpia:</b> deques, cordames e Torgo na ponte de comando.</li>
					<li><b>Desfecho:</b> o destino da Harpia e as instruções de Syvarian.</li>
				</ol>
				<h2>Fichas</h2>
				<ul>
					<li>${L(atores.bandoleiro)} (ND 1/2): 4 em solo, artilheiros, timoneira e 12 capangas dentro da nave (menos os artilheiros derrotados).</li>
					<li>${L(atores.cao)} (ND 2): 2 em solo, 2 saltam na rodada 1, mais 2 dentro da nave.</li>
					<li>${L(atores.torgo)} (ND 5) e o ${L(atores.canhao)}.</li>
					<li>Perigos: ${L(atores.harpia)}. Investigação: ${L(atores.fazenda)}.</li>
				</ul>
				<h2>Macros</h2>
				<ul>
					<li>${linkMacro("Ataque do Céu")}: avança as rodadas do ataque com a narração (luz, escadas, implante, Vadrinne).</li>
					<li>${linkMacro("Luz da Harpia")}: marca cego, troca para ofuscado ou limpa nos tokens mirados (pula os imunes).</li>
					<li>${linkMacro("Turno da Harpia")}: Canhão de Fogo ou Bater das Nadadeiras nos alvos mirados, com teste, dano (com RD) e em chamas.</li>
					<li>${linkMacro("Testes a Bordo")}: piso, escadas, borda, cordames, túnel, leme e perseguição.</li>
					<li>${linkMacro("Cirurgia")}: teste estendido de Cura para tirar o implante.</li>
					<li>${linkMacro("Elemental Elétrico")}: cura Torgo quando ele sofre dano mágico de eletricidade.</li>
				</ul>`, 100),
			pagina("Handout · Aviso de Nathanael", `
				<blockquote><p><i>"É, não podemos mais resolver tudo sozinhos. Nossas cabras estão desaparecendo ou sendo trucidadas. Que tipo de desgraçado sem mãe faz isso com cabras? Nossas plantações estão sendo queimadas. Se puderem mandar alguém aqui para ajudar, vão mostrar que o pessoal daqui está errado sobre forasteiros. Mas não vão, né? Tudo bem, vamos continuar nos virando aqui, como sempre.</i></p>
				<p><i>Nathanael Gallobalt, Fazendas Gallobalt, depois da Pedra do Corcunda, a dois dias de viagem a norte se vocês não forem lerdos demais."</i></p></blockquote>`, 200),
			pagina("A Família Gallobalt", `
				<ul>
					<li>${L(atores.nathanael)} e ${L(atores.salisha)}: irmãos suraggel que comandam a fazenda.</li>
					<li>${L(atores.ritanna)} (medusa) e ${L(atores.haran)} (osteon).</li>
					<li>${L(atores.alon)} (10 anos) e ${L(atores.jansel)} (18 anos).</li>
					<li>${L(atores.vadrinne)}: dahllan, irmã de Annabel (das Dahllan Daninhas). Carrega o implante.</li>
				</ul>
				<p>Plantam <b>achbuld</b> atrás de um muro de pedra e guardam armas de fogo. Desconfiam de forasteiros e de autoridades.</p>
				<h3>Teorias</h3>
				<ul>
					<li><b>Salisha:</b> é um demônio.</li>
					<li><b>Jansel:</b> é uma possessão.</li>
					<li><b>Nathanael:</b> é uma guilda rival.</li>
				</ul>
				<p>Percepção ou Intuição: Alon está inquieto. Com 20 ou mais, nota Jansel e Vadrinne trocando um olhar.</p>`, 300),
			pagina("Investigação", `
				<table>
					<tr><th>Pista</th><th>Teste</th><th>Resultado</th></tr>
					<tr><td>Cabras mortas</td><td>Cura ou Investigação CD 25</td><td>Fogo, algo que as arremessou e espadas.</td></tr>
					<tr><td>Plantação</td><td>Investigação ou Sobrevivência CD 20</td><td>Botas e cães grandes.</td></tr>
					<tr><td>Cerca</td><td>Investigação ou Sobrevivência CD 25</td><td>Marcas de gazuas.</td></tr>
					<tr><td>Plantação</td><td>Misticismo CD 20</td><td>Aura infernal.</td></tr>
					<tr><td>Implante (retirar)</td><td>Cura, estendido, CD 25, 3 sucessos</td><td>Falha: complicações, retomar em 1d4+1 dias.</td></tr>
					<tr><td>Implante (examinar)</td><td>Ofício (engenhoqueiro) ou Misticismo CD 30 (+5 removido)</td><td>Ciência e magia; controla o corpo por períodos curtos, ligado aos olhos.</td></tr>
					<tr><td>Implante ligado</td><td>CD 25 / 30 / 35</td><td>Monitora / transmite / busca uma mente.</td></tr>
				</table>
				<p><b>Abordagem passiva:</b> o próximo ataque vem em 2d10 dias.</p>`, 400),
			pagina("O Ataque", `
				<ol>
					<li><b>Rodada 1:</b> a luz desce (cego; ação de movimento ou 1 PM para ofuscado por 1 rodada). Só a Harpia age (Canhão de Fogo) e dois cães saltam. Em solo há 4 bandoleiros e 2 cães (Percepção CD 20 para notá-los).</li>
					<li><b>Rodada 2:</b> escadas de corda descem (Percepção CD 20 para vê-las). O implante de Vadrinne liga e ela caminha 5 rodadas até a plantação. Bandoleiros e cães passam a agir.</li>
					<li><b>Depois:</b> a Harpia usa Canhão e Nadadeiras uma vez por rodada cada. Escalar leva 2 rodadas, às cegas; a porta abaixa com Investigação CD 15 e uma ação padrão.</li>
					<li><b>Fuga:</b> quando a Harpia se afasta, o grupo tem 3 rodadas para alcançá-la (Atletismo, Acrobacia ou Cavalgar).</li>
				</ol>
				<p>Ver a forma real da Harpia: 20 natural em Percepção (depois, CD 30).</p>`, 500),
			pagina("A Bordo da Harpia", `
				<ul>
					<li>Piso escorregadio: Acrobacia CD 10 para equilíbrio.</li>
					<li>Escadas entre deques custam 4,5m; Acrobacia CD 12 desce de graça; falha por 5+ é queda com 1d6 de impacto.</li>
					<li>Empurrado por uma abertura: Reflexos CD 15 para se segurar.</li>
					<li>Timoneira no comando: desprevenidos pelo piso sofrem –2 em perícias.</li>
					<li>Armas de duas mãos sofrem –2.</li>
					<li>Túnel colapsado: três testes de Força CD 25. Cordames: dois de Atletismo CD 15, às cegas; falha por 10+ é queda (Reflexos CD 20 evita).</li>
					<li>Leme: Pilotagem CD 25.</li>
				</ul>
				<p>Deques selados hermeticamente (Conhecimento percebe), com cobertura de cristal e o símbolo do relógio da tripulação. Plantas por toda a ponte de comando e na estufa. Dentro da nave: 2 cães e 12 capangas, espalhados. Torgo é visto no primeiro deque e foge pelos cordames; espera na ponte com a timoneira.</p>`, 600),
			pagina("A Harpia", `
				<p>Gog'magogue fêmea nascida em Arton (e de algum modo sabe que isso está errado). Foi cegada para não revelar de onde os vilões operam e é cortada todos os dias para que o sangue brilhe. Não conhece kliren, nomes nem objetivos dos "bípedes". Só quer liberdade e sente que deve subir cada vez mais.</p>
				<p>Quem fala com animais (ou Vadrinne) consegue contato. Quem entende de natureza nota que ela é viva e está em agonia.</p>
				<p>Se o grupo vencer e abandoná-la, ela foge às cegas, o mais alto e longe que puder.</p>
				<h3>Torgo, na ponte</h3>
				<blockquote><p><i>"Malditos aventureiros! Não aprenderam a não meter o nariz onde não foram chamados? Sua mãe não ensinou pra vocês? Seus lorpas, bexiguentos! Inconvenientes! Podiam ter ficado quietinhos, deixado Syvarian fazer seu trabalho! Nem são daqui, o que vocês se importam com esses capiaus no meio do nada? Estamos fazendo um favor pra eles! Agora calem a boca, não aguento mais ouvir suas vozes! Vão morrer aqui mesmo e vou enterrá-los nessas Colinas, só pra vocês verem o que é bom pra tosse! Vão ficar a eternidade toda puxando as patas dos bodes! Eu juro por essa luz que me alumia!"</i></p></blockquote>`, 700),
			pagina("Handout · Instruções de Syvarian", `
				<blockquote>
				<p><i>Torgo,</i></p>
				<p><i>Espero que estas instruções sejam cumpridas sem questionamentos e sem falhas. Você sabe o que está em jogo. Sabe o que tem a perder.</i></p>
				<p><i>Não demonstre clemência pelo gog'magogue. Não deixe ela saber o que é. Chame-a apenas pelo nome de "Harpia". Ela é mais inteligente do que aparenta. Quer fugir, mas só conhece Arton. A ignorância da criatura é a proteção de sua tripulação. Enquanto ela não souber onde é seu lar, vocês estarão seguros. Se ela se revoltar, pode acabar com todos vocês em um instante. Mantenha-a no escuro.</i></p>
				<p><i>É preciso abrir novos cortes todos os dias, antes que os antigos possam cicatrizar, para que ela continue fraca. Preserve o brilho. Use a superstição. Se qualquer um de nossos alvos conhecer a verdade, toda a missão pode estar perdida.</i></p>
				<p><i>Não negligencie as plantas. Você não precisa entender sua finalidade. Tudo que importa é que elas continuem fortes. São mais importantes que qualquer um de seus marujos. Use a druida sempre que for possível.</i></p>
				<p><i>A tripulação é descartável. Não hesite em sacrificá-los. Não são divinautas, receberam apenas o treinamento básico. Há centenas de parasitas como eles nas sarjetas de qualquer cidade, podemos sempre conseguir mais.</i></p>
				<p><i>Mate os Gallobalt apenas em último caso. Preserve tanto achbuld quanto possível. É a recompensa de nossos aliados. Enquanto houver achbuld e a família estiver viva, ninguém vai chamar nenhuma autoridade. Lembre-se do objetivo: intimidá-los e expulsá-los, fazer com que pareçam tolos com medo do céu.</i></p>
				<p><i>Você está dando um passo em direção a sua própria recompensa.</i></p>
				<p><i>Os ponteiros se movem, Torgo.</i></p>
				<p><i>Está chegando a hora do fim e do início.</i></p>
				<p><i>Syvarian</i></p>
				<p>(Um sinete com a imagem de um relógio completa a assinatura.)</p>
				</blockquote>
				<p>Item: ${L(itemPorNome("Instruções"))}.</p>`, 800),
			pagina("Desfecho", `
				<ul>
					<li><b>Vitória completa:</b> a Harpia é libertada e sobe ao éter divino (pode voltar mais tarde na campanha). Os Gallobalt ajudam o grupo na Aventura 5.</li>
					<li><b>Vitória parcial:</b> a Harpia foge às cegas; os ataques param, mas Torgo pode ter escapado.</li>
					<li><b>Bandoleiros capturados:</b> recrutados em Zakharov, trabalham em células; passaram por experimentos do Dr. Vesper mas não conseguem denunciá-lo.</li>
					<li><b>Torgo capturado:</b> se autodestrói (8d6, raio de 6m, uma rodada de aviso) antes de revelar algo.</li>
					<li>Tesouro: ${L(itemPorNome("Essência"))} dos cães, o ${L(itemPorNome("Implante"))} e as instruções de Syvarian.</li>
				</ul>`, 900)
		]
	});

	ui.notifications.info("Aventura 4 criada: 13 atores, itens, diário e 6 macros. Veja a pasta \"" + NOME_PASTA + "\".");
})();
