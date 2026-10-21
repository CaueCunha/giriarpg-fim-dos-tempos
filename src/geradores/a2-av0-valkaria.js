/* =====================================================================
 * FIM DOS TEMPOS · ARCO 2 · AVENTURA 0 · "CHEGADA A VALKARIA"
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Arco 2 · Av0 · Chegada a Valkaria" com:
 *      - Ameaças do primeiro caso: Bandido Descarado, Barnett e a Gárgula da Metrópole.
 *      - Blixto Arting e a Xerife Mathilda Nolt (tokens para a parte social).
 *      - Ator "Valkaria · Lei & Ordem" com o contador do arco inteiro.
 *      - Itens: carta de Belinda, Medalhão da Gárgula, distintivo da Guarda.
 *      - Tabelas: Encontros em Valkaria (1d20) e Eventos da Perseguição (1d20).
 *      - Diário com guia, handouts (carta, Quadro de Casos), fases, elenco da guarita,
 *        regras de Lei & Ordem, atividades e moradias.
 *      - Macros: Lei & Ordem e Perseguição (servem para o arco todo).
 *   3. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo,
 *      mantendo o valor de Lei & Ordem. Só são apagados documentos com a marca
 *      flags.world.fdt = "a2av0".
 *
 * Feito a partir do código do sistema (master, out/2026); não foi testado num Foundry rodando.
 * Veja o guia a2-av0-valkaria.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "a2av0";
	const FLAGS = (role) => ({ world: role ? { fdt: TAG, fdtRole: role } : { fdt: TAG } });
	const T20I = "systems/tormenta20/icons";

	/* ------------------------------------------------------------------ */
	/* 0. Limpeza do que foi gerado antes                                   */
	/* ------------------------------------------------------------------ */
	const isOurs = (d) => d.getFlag?.("world", "fdt") === TAG;
	const colecoes = [game.actors, game.items, game.journal, game.tables, game.macros];
	const antigos = colecoes.flatMap((c) => c.filter(isOurs));
	// O contador de Lei & Ordem sobrevive a uma recriação.
	const loAntigo = foundry.utils.deepClone(game.actors.find((a) => isOurs(a) && a.getFlag("world", "fdtRole") === "leiordem")?.system.resources ?? null);
	if (antigos.length) {
		const ok = await foundry.applications.api.DialogV2.confirm({
			window: { title: "Aventura 0 do Arco 2: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para a Aventura 0 do Arco 2.</p>
				<p>O valor atual de Lei &amp; Ordem é mantido.</p>
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
	const NOME_PASTA = "FdT · Arco 2 · Av0 · Chegada a Valkaria";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#2f4a6b", flags: FLAGS() })).id;
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


	/* ------------------------------------------------------------------ */
	/* 2. Ameaças do primeiro caso                                          */
	/* ------------------------------------------------------------------ */
	const atores = {};
	const furtivo = (d) => aoUsar(`Ataque Furtivo (+${d})`, "icons/magic/perception/silhouette-stealth-shadow.webp", [["dano", d]], ["attack"]);
	const confianca = () => poder("Confiança Desavergonhada", "icons/svg/upgrade.svg",
		p("<b>Reação.</b> Passa automaticamente no primeiro teste de resistência de cada cena."), { exec: "reaction" });

	atores.bandido = await criarNPC({
		name: "Bandido Descarado",
		role: "bandido",
		img: `${T20I}/ameacas/bandido.png`,
		nd: 4,
		cd: 18,
		tipo: "hum",
		raca: "humano",
		papel: "lackey",
		atr: { for: 2, des: 3, con: 2, int: 0, sab: 1, car: 1 },
		pv: 30,
		def: 21,
		walk: 9,
		pericias: { inic: 8, perc: 5, fort: 9, refl: 14, vont: 7, luta: 17, acro: 8, atle: 7, furt: 8, inti: 6 },
		ataquesTxt: "Espada curta ×2 +17 (1d6+8, 18). Ataque furtivo +2d6.",
		equipTxt: "Couro batido, espada curta.",
		tesouro: "Metade.",
		bio: p("Jaylyn, Nok, Abrott, Fredda e Gullna: canalhas que tomaram uma rua mercantil perto da Guarita da Praia para \"mostrar serviço\" e entrar numa irmandade. Não têm contato com nenhuma. Não é gancho: o caso começa e termina aqui.",
			"<b>Táticas:</b> dois lutam, concentrando ataques num herói que pareça ameaçador mas não invulnerável; três fogem em direções diferentes (use a macro <i>Perseguição</i>). Gullna é a mais forte, a menos esperta e totalmente leal a Barnett.",
			"Eles vigiam os arredores: armadilhas ou preparativos à vista pedem Furtividade ou Enganação contra a Percepção ou Intuição deles."),
		items: [
			arma("Espada Curta (×2)", `${T20I}/itens/equipamentos/espada-curta.webp`, { dano: "1d6+8", tipo: "perfuracao", critM: 18, effects: [furtivo("2d6")],
				desc: p("Dois ataques por ação padrão.") }),
			poder("Ataque Furtivo", "icons/magic/perception/silhouette-stealth-shadow.webp",
				p("+2d6 contra alvos desprevenidos ou flanqueados. Marque o aprimoramento na janela de ataque."), { exec: "passive" }),
			confianca()
		]
	});

	atores.barnett = await criarNPC({
		name: "Barnett",
		role: "barnett",
		link: true,
		img: `${T20I}/ameacas/chefe-bandido.png`,
		nd: 5,
		cd: 19,
		tipo: "hum",
		raca: "humano",
		papel: "special",
		atr: { for: 2, des: 4, con: 2, int: 2, sab: 1, car: 1 },
		pv: 98,
		def: 23,
		walk: 9,
		pericias: { inic: 8, perc: 5, fort: 7, refl: 16, vont: 10, luta: 17, pont: 17, acro: 10, atle: 7, furt: 9, inti: 6 },
		resTxt: "Evasão.",
		ataquesTxt: "Espada curta ×2 +17 (1d6+12, 18). Ataque furtivo +3d6.",
		ataquesAdTxt: "Besta leve +17 (1d8+12, 18).",
		equipTxt: "Besta leve, couro batido, espada curta, sapatos de camurça, virotes (20).",
		tesouro: "Metade mais medalhão da gárgula.",
		bio: p("O \"cérebro\" do grupo: consegue pensar em algo além de bater na cabeça de alguém e pegar o dinheiro. Franzino e arrogante.",
			"<b>Na primeira rodada:</b> move-se e usa uma ação padrão para ativar o <i>Medalhão da Gárgula</i>. A gárgula da metrópole desce de um prédio próximo e o carrega voando.",
			"<b>Carregado pela gárgula:</b> no início de cada rodada da perseguição, pode atirar com a besta para atrapalhar um perseguidor em alcance médio (opção na macro <i>Perseguição</i>)."),
		items: [
			arma("Espada Curta (×2)", `${T20I}/itens/equipamentos/espada-curta.webp`, { dano: "1d6+12", tipo: "perfuracao", critM: 18, effects: [furtivo("3d6")],
				desc: p("Dois ataques por ação padrão.") }),
			distancia("Besta Leve", `${T20I}/itens/equipamentos/besta-leve.webp`, { dano: "1d8+12", tipo: "perfuracao", critM: 18, alcance: "medio", effects: [furtivo("3d6")] }),
			poder("Ataque Furtivo", "icons/magic/perception/silhouette-stealth-shadow.webp",
				p("+3d6 contra alvos desprevenidos ou flanqueados. Marque o aprimoramento na janela de ataque."), { exec: "passive" }),
			confianca(),
			poder("Não me Pega", "icons/svg/daze.svg",
				p("<b>Reação.</b> Quando sofre dano pela primeira vez numa rodada, sofre só metade."), { exec: "reaction" }),
			poder("Evasão", "icons/svg/shield.svg",
				p("Quando sofre um efeito que permite Reflexos para reduzir o dano à metade, não sofre dano algum se passar."), { exec: "passive" }),
			poder("Ativar o Medalhão da Gárgula", `${T20I}/itens/gerais/medalhao-de-prata.webp`,
				p("<b>Ação padrão, uso único.</b> Encanta a gárgula da metrópole de um prédio próximo para que ela o carregue voando. A magia se esgota depois disso."),
				{ exec: "action" }),
			poder("Atrapalhar Perseguidor", `${T20I}/itens/equipamentos/besta-leve.webp`,
				p("No início de cada rodada da perseguição, se estiver sendo carregado: teste de ajuda com a besta (+17, ou +19 se estiver acima do alvo) contra CD 10. Em vez de bônus, impõe a penalidade no teste de perseguição do alvo: –1, e –1 a mais a cada 10 pontos acima da CD."),
				{ exec: "free", rolls: [["Teste de ajuda (besta)", [["1d20+17", ""]]]] })
		]
	});

	atores.gargula = await criarNPC({
		name: "Gárgula da Metrópole",
		role: "gargula",
		img: `${T20I}/ameacas/gargula.png`,
		nd: 6,
		cd: 22,
		tipo: "con",
		papel: "solo",
		atr: { for: 6, des: 2, con: 5, int: -2, sab: 0, car: -2 },
		pv: 240,
		def: 27,
		walk: 12,
		sentidos: ["escuro"],
		pericias: { inic: 5, perc: 5, fort: 18, refl: 6, vont: 12, luta: 20, atle: 14 },
		ic: ["petrificado"],
		res: { dano: { base: 5 } },
		resTxt: "Imunidade a petrificado, redução de dano 5.",
		ataquesTxt: "Duas garras +20 (2d6+20).",
		bio: p("As metrópoles, com mármore, concreto e materiais sofisticados, permitem gárgulas mais astutas, malignas e poderosas que as normais. Esta foi encantada pelo medalhão de Barnett.",
			"<b>Deslocamento:</b> 12m, voo 18m.",
			"<b>Na perseguição:</b> Atletismo +14 (já inclui +6 pelo voo e –2 por carregar Barnett; a ficha está assim e a macro não soma o bônus de deslocamento para ela).",
			"<b>Derrubar Barnett:</b> sempre que sofrer 20 ou mais de dano de uma mesma fonte, faz Fortitude com CD igual ao dano; se falhar, derruba Barnett (opção na macro <i>Perseguição</i>)."),
		items: [
			arma("Garra (×2)", "icons/creatures/claws/claw-bear-paw-swipe-red.webp", { dano: "2d6+20", tipo: "corte", desc: p("Duas garras por ação padrão.") }),
			poder("Imobilidade", "icons/svg/castle.svg",
				p("Completamente imóvel, só é percebida como criatura com Percepção CD 35."), { exec: "passive" }),
			poder("Nuvem de Detritos", "icons/svg/falling.svg",
				p("<b>Livre, só na primeira rodada de combate.</b> Telhas, tijolos e detritos urbanos atingem 3m de raio abaixo da gárgula: atordoado por 1 rodada (uma vez por cena) e 6d6 de impacto. <b>Reflexos CD 22</b> reduz à metade e evita a condição. Cada gárgula a mais no encontro: +1,5m de raio e +2d6."),
				{ exec: "free", area: "3m de raio", save: "Reflexos CD 22 reduz à metade e evita atordoado",
					rolls: [["Detritos", [["6d6", "impacto"]]]], effects: [cond("Atordoado")] })
		]
	});
	await atores.gargula?.update({ "system.attributes.movement.fly.base": 18, "flags.world.fdtPerseguicao": { semBonusDeslocamento: true } });

	/* ---------- Personagens da cidade (só para token) ---------- */
	const social = (d) => criarNPC({ nd: 1, cd: 10, papel: "special", disposition: 1, link: true, pv: 10, def: 10, atr: { for: 0, des: 0, con: 0, int: 1, sab: 1, car: 1 }, ...d });
	atores.blixto = await social({
		name: "Blixto Arting",
		role: "blixto",
		img: `${T20I}/racas/hynne.webp`,
		tipo: "hum",
		raca: "hynne",
		tamanho: "peq",
		bio: p("Hynne armeiro, dono da Metais do Baixote, primo de Belinda. Quis provar que um hynne é tão bom ferreiro quanto um anão, e conseguiu: a matriz ocupa mais de um quarteirão na Cidade da Praia. Sempre com um charuto (muitas vezes apagado).",
			"Prático, direto, nunca para de trabalhar e distribui tarefas a quem fala com ele sem perceber. Não se ofende e espera que ninguém se ofenda. Quer ouvir sobre ações, não intenções. Por trás disso, solidão: nunca casou, considera o sobrinho Basil um filho.",
			"Vê aventureiros como <b>investimento</b>: não contrata nem dá missões, mas apadrinha. Oferece dicas, um lugar para dormir e ajuda com negócios. Leva o grupo à Xerife Mathilda.",
			"A ficha é só para ter o token (o livro não dá estatísticas).")
	});
	atores.mathilda = await social({
		name: "Xerife Mathilda Nolt",
		role: "mathilda",
		img: `${T20I}/classes/clerigo.webp`,
		tipo: "hum",
		raca: "humana",
		bio: p("Xerife da Guarita da Praia, clériga de Tanna-Toh: <b>não pode mentir</b>. Prodígio, detetive brilhante, honesta demais para alguns colegas. Um ataque ao quartel dela a deixou cadeirante; foi promovida a Xerife na reforma da Guarda. Sabe que guardas corruptos estão ligados ao atentado e já disse isso em voz alta, então continua um alvo.",
			"Realista e analítica. Não se importa com os métodos, só com o resultado dentro do regulamento. Quer que os aventureiros fiquem e sejam competentes. Primeira fala: <i>\"Trouxe novas vítimas?\"</i>",
			"A ficha é só para ter o token (o livro não dá estatísticas).")
	});

	/* ---------- Lei & Ordem ---------- */
	atores.leiOrdem = await criarNPC({
		name: "Valkaria · Lei & Ordem",
		tokenName: "Lei & Ordem",
		role: "leiordem",
		img: `${T20I}/ameacas/sargento-da-guarda.png`,
		disposition: 0,
		nd: 1,
		cd: 10,
		tipo: "hum",
		papel: "special",
		atr: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
		pv: 1,
		def: 10,
		recursos: {
			primary: { label: "Lei & Ordem", value: loAntigo?.primary?.value ?? 20, max: 99 },
			secondary: { label: "Provas nesta aventura (máx. 5)", value: loAntigo?.secondary?.value ?? 0, max: 5 }
		},
		bio: p("<b>Ator de apoio, não vai para o mapa.</b> Guarda o contador de Lei &amp; Ordem do Arco 2 e as provas da aventura atual. Use a macro <i>Lei &amp; Ordem</i>.",
			"Reimportar o módulo (ou rodar o gerador de novo) mantém o valor atual."),
		items: [
			poder("Lei & Ordem (regra)", "icons/svg/book.svg",
				p("Começa em <b>20</b> e cai <b>1 por sessão</b> (sessões muito curtas ou atípicas podem não contar, decidido fora do jogo; devem ser poucas).",
					"Cada <b>atividade em Valkaria</b> custa 1. Atividades simultâneas de vários personagens custam 1 no total; em momentos separados, multiplicam.",
					"Cada <b>prova</b> entregue no fim de uma aventura do quadro rende +1, até 5 por aventura. A Av0 e aventuras fora do quadro não rendem.",
					"Ao chegar a <b>0</b>, começa a Aventura 7. Se o grupo nunca deixar zerar, a Av7 começa depois do último caso que ele resolver, e o que sobrar vira bônus nela.",
					"Não deixe qualquer boa ação aumentar o contador: ajudar uma velhinha é menos que uma gota no oceano."),
				{ exec: "passive" }),
			poder("Provas", "icons/svg/item-bag.svg",
				p("Relatos de testemunhas, evidências físicas, análises de peritos, confissões, cadáveres, pistas da cena do crime: o que convença um Juiz de Khalmyr de que o vilão era culpado e o caso está resolvido.",
					"Todos os testemunhos juntos contam como <b>uma</b> prova. Evidências materiais em geral contam individualmente. O mestre decide."),
				{ exec: "passive" }),
			poder("Segredos de Lei & Ordem (mestre)", "icons/svg/eye.svg",
				p("O contador mede o efeito dos <b>Imagodutos</b> de Ghorskander, que captam e espalham emoções agressivas. São dezenas: impossível achar todos.",
					"Quando chegar a zero, os pensamentos de raiva e medo da cidade se materializam como um lagarto-terror gigante (o Mecano-Lagarto-Terror) e a população estará furiosa demais para se unir contra ele."),
				{ exec: "passive" })
		]
	});

	/* ------------------------------------------------------------------ */
	/* 3. Itens                                                             */
	/* ------------------------------------------------------------------ */
	const itemDoc = (d) => ({ ...d, folder: pasta.Item, flags: FLAGS() });
	const tesouro = (name, img, html, preco = 0, qtd = 1) => itemDoc({ name, type: "tesouro", img, system: { description: { value: html }, qtd, preco, peso: 0, espacos: 0 } });
	const itensCriados = await Item.createDocuments([
		tesouro("Carta de Belinda para Blixto", `${T20I}/itens/gerais/pergaminho.webp`,
			p("A carta de apresentação que o grupo leva das Colinas Centrais. Texto no diário (handout).")),
		tesouro("Medalhão da Gárgula", `${T20I}/itens/gerais/medalhao-de-prata.webp`,
			p("A magia se esgotou quando Barnett encantou a gárgula e não volta. Mas as energias que restam podem ser usadas por quem conhece magia.",
				"Um personagem <b>treinado em Misticismo</b> pode vesti-lo (ocupa 1 espaço). Quando usar uma habilidade mágica com custo em PM, pode gastar 1 carga para pagar 1 PM desse custo.",
				"<b>3 cargas.</b> Depois vira uma bijuteria mundana de T$ 50. Controle as cargas na quantidade do item."), 50, 3),
		tesouro("Distintivo da Guarda de Valkaria", `${T20I}/itens/gerais/insignia-milicia.webp`,
			p("Latão, totalmente genérico. Um está amassado e dois ainda têm manchas de sangue.",
				"Regulamento: use o mínimo possível. Nada de confiscar cavalos ou comer de graça na taverna. Cidadãos podem barrar a entrada de um guarda na propriedade deles."))
	]);
	const itemPorNome = (inicio) => itensCriados.find((i) => i.name.startsWith(inicio));

	/* ------------------------------------------------------------------ */
	/* 4. Tabelas                                                           */
	/* ------------------------------------------------------------------ */
	const tabela = (name, img, formula, description, linhas) => RollTable.create({
		name, img, folder: pasta.RollTable, flags: FLAGS(), formula, replacement: true, displayRoll: true, description,
		results: linhas.map(([de, ate, nome, desc]) => ({ type: "text", range: [de, ate], weight: ate - de + 1, name: nome, description: desc }))
	});

	const ENCONTROS = [
		["Gnuk e a Carroça de Lagarto Interno", "Pode explodir. Na terceira vez, ele doa a carroça, que cruza um hexágono em 5 minutos."],
		["Farboraff e Brungamm", "Chapeleiros rivais. Chapéus a T$ 50, cada um com +1 numa perícia."],
		["Wynstar, o unicórnio burocrata", "Formulários com CD 20, ou multa de 20%."],
		["Drelene, deusa sem portfólio", "Regras de devoção; +2 para converter fiéis."],
		["Castelo do Sabor", "Fast-food do necromante Jorir, atendido por Melora. Quatro pratos com bônus; o vício custa –2 PM."],
		["Residência Paterfax", "Casa senciente. Base gratuita com +5 PM."],
		["Galswell, o falso Klunc", "Atuação +10."],
		["Elemental da Poluição", "3 testes CD 25 para ser entendido; tocá-lo pede Fortitude CD 20."],
		["Assalto ao Mercado do Ouro Tolo", "Dez bandidos. Rende até 3 provas e +3 Lei & Ordem."],
		["Bebê Corisco, ginete extremo", "Cinco testes de Cavalgar; aposta de T$ 500 para ganhar T$ 2.500."],
		["Goblins da Gazeta do Reinado", "Tabela de entrevista; o melhor resultado é parecer desinteressante."],
		["Orfanato das Pobres e Desgraçadas Crianças Infelizes", "Abençoado por Nimb."],
		["Yolana, nagah do Silêncio Aberrante", "Memética +15."],
		["Depósito de Lixo", "Investigação por turno, tabela de itens e risco de infecção. Local fixo."],
		["Anatole, empresário de aventureiros", "Cobra T$ 10.000 mais 30%."],
		["Avatar da Cidade", "Memória +15. Segredos de NPCs com CD 30, segredos da campanha com CD 35."],
		["Clube de Cavalheiros", "Taverna de vilões famosos (Damien, Nefretum, Lorde Enxame, Lamashtu, Edauros, Ellen Redblade...). Atacar ali é suicídio. Local fixo."],
		["Qualificatórias da Arena", "Cinco lutas, tabela de lutadores, Atuação CD 30 para Glamour. Libera a atividade Luta na Arena de Valkaria."],
		["Justine, candidata a Dama Urbana", "Dos Telhados sem Sapé. Eleita com 500 pontos ou mais, dá –1 PM nos telhados."],
		["Tilliann, antigo Deus dos Gnomos", "Com 5 pedaços de metal arco-íris, concede o poder Procrastinação Criativa."]
	];
	const tabEncontros = await tabela("Encontros em Valkaria", "icons/svg/village.svg", "1d20",
		"Role sempre que o grupo se desloca pela cidade. Detalhes de cada encontro no livro (Introdução do Arco 2).",
		ENCONTROS.map(([n, d], i) => [i + 1, i + 1, n, d]));

	const tabPerseguicao = await tabela("Eventos da Perseguição (Valkaria)", "icons/svg/target.svg", "1d20",
		"Uma vez por rodada. Obstáculo: todos testam; quem falha avança metade. Atalho: quem tenta e passa avança o dobro, quem falha avança metade. A macro Perseguição já rola isto.",
		[
			[1, 2, "Nenhum", "Nada acontece."],
			[3, 3, "Pilha de caixotes", "Obstáculo: Força CD 15."],
			[4, 5, "Multidão se interpõe", "Obstáculo: Intimidação CD 20."],
			[6, 7, "Carroça puxada por bois", "Obstáculo: Atletismo CD 20."],
			[8, 9, "Frutas derramadas no chão", "Obstáculo: Acrobacia CD 20."],
			[10, 11, "Desabamento de marquise", "Obstáculo: Reflexos CD 22. Falha: também 5d6 de impacto."],
			[12, 13, "Explosão de engenhoca goblin", "Obstáculo: Percepção CD 22. Falha: também –2 no próximo teste de Atletismo."],
			[14, 15, "Dois NPCs carregando um vidro enorme", "Obstáculo: Acrobacia CD 22. Falha: também 2d6 de corte."],
			[16, 17, "Bueiro se abre", "Obstáculo: Reflexos CD 25. Falha: cai no bueiro, 2d6 de impacto e perde uma rodada escalando."],
			[18, 19, "Carrinho de bebê descontrolado", "Obstáculo: Acrobacia ou Reflexos CD 25 (esquivar ou pular) ou Força CD 15 (atropelar o carrinho e mandar a criança voando)."],
			[20, 20, "Atalho", "Atalho: Percepção ou Misticismo CD 20. Sucesso: além do movimento dobrado, +5 no teste de Atletismo."]
		]);

	/* ------------------------------------------------------------------ */
	/* 5. Macros de mesa                                                    */
	/* ------------------------------------------------------------------ */

	async function macroLeiOrdem() {
		const ator = game.actors.find((a) => a.getFlag("world", "fdtRole") === "leiordem");
		if (!ator) return ui.notifications.error("Não achei o ator \"Valkaria · Lei & Ordem\". Importe o Ato 2 do módulo Fim dos Tempos.");
		const lo = ator.system.resources.primary.value;
		const provas = ator.system.resources.secondary.value;
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Lei & Ordem" },
			content: `
				<p>Lei &amp; Ordem: <b>${lo}</b>. Provas nesta aventura: <b>${provas}/5</b>.</p>
				<div class="form-group"><label>O que aconteceu</label><select name="acao">
					<option value="sessao">Fim de sessão (–1)</option>
					<option value="atividade">Atividades em Valkaria</option>
					<option value="provas">Provas entregues no fim do caso</option>
					<option value="novo">Começar um novo caso (zera as provas)</option>
					<option value="ajuste">Ajuste do livro ou do mestre</option></select></div>
				<div class="form-group"><label>Quantidade</label><input type="number" name="qtd" value="1"></div>
				<p style="font-size:0.85em">Atividades: conte 1 por momento separado (vários personagens ao mesmo tempo contam 1). Ajuste: use número negativo para tirar.</p>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const qtd = Math.trunc(Number(res.qtd) || 0);
		let novo = lo;
		let novasProvas = provas;
		let texto = "";
		if (res.acao === "sessao") { novo = lo - 1; texto = "Mais uma sessão: a cidade fica um pouco mais tensa."; }
		else if (res.acao === "atividade") { novo = lo - Math.max(qtd, 1); texto = `Atividades em Valkaria: –${Math.max(qtd, 1)}. Enquanto os detetives se divertem, ninguém patrulha as ruas.`; }
		else if (res.acao === "provas") {
			const validas = Math.max(0, Math.min(qtd, 5 - provas));
			novasProvas = provas + validas;
			novo = lo + validas;
			texto = `Provas entregues ao Juiz de Khalmyr: +${validas}.` + (validas < qtd ? ` (O limite é 5 por aventura; ${qtd - validas} não contaram.)` : "");
		} else if (res.acao === "novo") { novasProvas = 0; texto = "Novo caso aberto no Quadro de Casos."; }
		else { novo = lo + qtd; texto = `Ajuste: ${qtd >= 0 ? "+" : ""}${qtd}.`; }
		novo = Math.max(0, novo);
		await ator.update({ "system.resources.primary.value": novo, "system.resources.secondary.value": novasProvas });
		let html = `<h3>Lei &amp; Ordem: ${lo} → <b>${novo}</b></h3><p>${texto}</p>`;
		if (novo === 0 && lo > 0) html += "<p><b>Lei &amp; Ordem chegou a zero.</b> Valkaria transborda. Começa a Aventura 7.</p>";
		else if (novo <= 5) html += "<p>A tensão na cidade é palpável. Todos sentem que algo está para acontecer.</p>";
		ChatMessage.create({ content: html, speaker: ChatMessage.getSpeaker({ actor: ator }) });
	}

	async function macroPerseguicao() {
		const CHAVE = "fdtPerseguicao";
		const estado = game.user.getFlag("world", CHAVE);
		const EVENTOS = [
			{ ate: 2, nome: "Nenhum" },
			{ ate: 3, nome: "Pilha de caixotes", testes: [["for", 15]] },
			{ ate: 5, nome: "Multidão se interpõe", testes: [["inti", 20]] },
			{ ate: 7, nome: "Carroça puxada por bois", testes: [["atle", 20]] },
			{ ate: 9, nome: "Frutas derramadas no chão", testes: [["acro", 20]] },
			{ ate: 11, nome: "Desabamento de marquise", testes: [["refl", 22]], dano: "5d6[impacto]" },
			{ ate: 13, nome: "Explosão de engenhoca goblin", testes: [["perc", 22]], penal: 2 },
			{ ate: 15, nome: "Vidro enorme atravessando a rua", testes: [["acro", 22]], dano: "2d6[corte]" },
			{ ate: 17, nome: "Bueiro se abre", testes: [["refl", 25]], dano: "2d6[impacto]", perdeRodada: true },
			{ ate: 19, nome: "Carrinho de bebê descontrolado", testes: [["acro", 25], ["refl", 25], ["for", 15]] },
			{ ate: 20, nome: "Atalho", testes: [["perc", 20], ["mist", 20]], atalho: true }
		];
		const NOMES = { for: "Força", inti: "Intimidação", atle: "Atletismo", acro: "Acrobacia", refl: "Reflexos", perc: "Percepção", mist: "Misticismo" };
		const bonus = (a, k) => (k === "for" ? Number(a.system.atributos?.for?.value) || 0 : Number(a.system.pericias?.[k]?.value) || 0);
		const atorDe = (part) => canvas.tokens.get(part.token)?.actor ?? game.actors.get(part.actor);

		const opcoes = estado
			? `<option value="rodada">Próxima rodada (${estado.rodada + 1})</option>
				<option value="gargula">A gárgula sofreu 20+ de dano de uma fonte</option>
				<option value="encerrar">Encerrar a perseguição</option>`
			: `<option value="iniciar">Iniciar: selecionados perseguem, alvos (T) fogem</option>`;
		const perseguidores = estado?.parts.filter((x) => x.lado === "p" && !x.fora) ?? [];
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Perseguição" },
			content: `
				<div class="form-group"><label>Ação</label><select name="acao">${opcoes}</select></div>
				${estado ? `
				<div class="form-group"><label>Barnett atrapalha</label><select name="barnett"><option value="">Ninguém</option>
					${perseguidores.map((x) => `<option value="${x.id}">${x.nome}</option>`).join("")}</select></div>
				<div class="form-group"><label>Barnett está acima do alvo (+2)</label><input type="checkbox" name="acima" checked></div>
				<div class="form-group"><label>Dano na gárgula</label><input type="number" name="dano" value="20"></div>` : `
				<div class="form-group"><label>Vantagem dos fugitivos (quadrados)</label><input type="number" name="vantagem" value="6"></div>
				<div class="form-group"><label>Fugitivos escapam com (quadrados)</label><input type="number" name="meta" value="80"></div>
				<p style="font-size:0.85em">Disfarçados ou esgueirando-se: pouca ou nenhuma vantagem. Voz de prisão de longe: 10 ou mais. 80 quadrados = 120 m.</p>`}`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;

		if (res.acao === "encerrar") {
			await game.user.unsetFlag("world", CHAVE);
			return ChatMessage.create({ content: "<h3>Perseguição encerrada</h3>" });
		}

		if (res.acao === "iniciar") {
			const ps = canvas.tokens.controlled;
			const fs = [...game.user.targets];
			if (!ps.length || !fs.length) return ui.notifications.warn("Selecione os perseguidores e marque como alvo (T) os fugitivos.");
			const vantagem = Number(res.vantagem) || 0;
			const parts = [
				...ps.map((t) => ({ id: foundry.utils.randomID(), token: t.id, actor: t.actor?.id, nome: t.name, lado: "p", dist: 0 })),
				...fs.map((t) => ({ id: foundry.utils.randomID(), token: t.id, actor: t.actor?.id, nome: t.name, lado: "f", dist: vantagem }))
			].map((x) => ({ ...x, correu: 0, testesFort: 0, penal: 0, fora: false, perdeRodada: false, status: "" }));
			await game.user.setFlag("world", CHAVE, { rodada: 0, meta: Number(res.meta) || 80, parts });
			return ChatMessage.create({
				content: `<h3>Perseguição!</h3><p>Perseguidores: ${ps.map((t) => t.name).join(", ")}.</p>
					<p>Fugitivos: ${fs.map((t) => t.name).join(", ")} (${vantagem} quadrados de vantagem; escapam aos ${Number(res.meta) || 80}).</p>`
			});
		}

		const rolls = [];
		const rolar = async (formula) => { const r = await new Roll(formula).evaluate(); rolls.push(r); return r; };

		if (res.acao === "gargula") {
			const garg = estado.parts.find((x) => atorDe(x)?.getFlag("world", "fdtRole") === "gargula");
			const fort = garg ? bonus(atorDe(garg), "fort") : 18;
			const cd = Number(res.dano) || 20;
			const r = await rolar(`1d20 + ${fort}`);
			return ChatMessage.create({
				content: `<h3>A gárgula é atingida</h3><p>Fortitude ${r.total} contra CD ${cd}: ${r.total >= cd ? "segura Barnett." : "<b>derruba Barnett!</b> Ele cai e continua a pé (mova o token dele para o chão)."}</p>`,
				rolls
			});
		}

		// Rodada
		estado.rodada += 1;
		const d = await rolar("1d20");
		const ev = EVENTOS.find((e) => d.total <= e.ate);
		let html = `<h3>Perseguição · rodada ${estado.rodada}</h3><p>Evento (${d.total}): <b>${ev.nome}</b>${ev.testes ? ` · ${ev.testes.map(([k, cd]) => `${NOMES[k]} CD ${cd}`).join(" ou ")}` : ""}</p>`;

		// Barnett atrapalha
		let alvoBarnett = null;
		let penalBarnett = 0;
		if (res.barnett) {
			const r = await rolar(`1d20 + 17 + ${res.acima ? 2 : 0}`);
			penalBarnett = r.total >= 10 ? 1 + Math.floor((r.total - 10) / 10) : 0;
			alvoBarnett = res.barnett;
			const nome = estado.parts.find((x) => x.id === alvoBarnett)?.nome;
			html += `<p>Barnett atira em ${nome} para atrapalhar (${r.total}): <b>–${penalBarnett}</b> no teste de perseguição.</p>`;
		}

		html += "<table><tr><th>Quem</th><th>Evento</th><th>Atletismo</th><th>Avança</th><th>Total</th></tr>";
		for (const x of estado.parts) {
			if (x.fora) continue;
			const a = atorDe(x);
			if (!a) { x.fora = true; continue; }
			if (x.perdeRodada) {
				x.perdeRodada = false;
				html += `<tr><td>${x.nome}</td><td colspan="3">Escalando o bueiro</td><td>${x.dist}</td></tr>`;
				continue;
			}
			let mult = 1;
			let extra = 0;
			let evTxt = "—";
			if (ev.testes) {
				const [k, cd] = ev.testes.reduce((m, t) => (bonus(a, t[0]) - t[1] > bonus(a, m[0]) - m[1] ? t : m));
				const r = await rolar(`1d20 + ${bonus(a, k)}`);
				const ok = r.total >= cd;
				evTxt = `${NOMES[k]} ${r.total} ${ok ? "✔️" : "❌"}`;
				if (ev.atalho) {
					mult = ok ? 2 : 0.5;
					if (ok) extra += 5;
				} else if (!ok) {
					mult = 0.5;
					if (ev.dano) {
						const dano = await rolar(ev.dano);
						try { await a.applyDamageV2(dano, 1); } catch (e) { console.warn(e); }
						evTxt += ` (${dano.total} de dano)`;
					}
					if (ev.penal) x.penal += ev.penal;
					if (ev.perdeRodada) x.perdeRodada = true;
				}
			}
			const semDesl = a.getFlag("world", "fdtPerseguicao")?.semBonusDeslocamento;
			const desl = Number(a.system.attributes?.movement?.walk?.value) || 9;
			const modDesl = semDesl ? 0 : Math.round(((desl - 9) / 1.5) * 2);
			const penal = x.penal + (x.id === alvoBarnett ? penalBarnett : 0);
			x.penal = 0;
			const r = await rolar(`1d20 + ${bonus(a, "atle")} + ${modDesl + extra - penal}`);
			const avanca = Math.max(0, Math.floor(r.total * mult));
			x.dist += avanca;
			x.correu += 1;
			html += `<tr><td>${x.nome}</td><td>${evTxt}</td><td>${r.total}</td><td>${avanca}</td><td><b>${x.dist}</b></td></tr>`;

			// Cansaço: 1 + Constituição rodadas, depois Fortitude CD 15 +1 por teste anterior.
			const con = Number(a.system.atributos?.con?.value) || 0;
			if (x.correu > 1 + con) {
				const cd = 15 + x.testesFort;
				x.testesFort += 1;
				const f = await rolar(`1d20 + ${bonus(a, "fort")}`);
				if (f.total < cd) {
					x.fora = true;
					x.status = "fatigado";
					html += `<tr><td colspan="5">${x.nome} falha em Fortitude (${f.total} contra CD ${cd}): fica <b>fatigado</b> e sai da perseguição.</td></tr>`;
				}
			}
		}
		html += "</table>";

		// Quem alcançou quem, quem escapou
		const ativosP = estado.parts.filter((x) => x.lado === "p" && x.status !== "fatigado");
		for (const f of estado.parts.filter((x) => x.lado === "f" && !x.fora)) {
			const pegou = ativosP.find((pp) => pp.dist > f.dist);
			if (pegou) {
				f.fora = true;
				f.status = "alcançado";
				html += `<p><b>${pegou.nome} alcança ${f.nome}!</b> Ele se rende ou começa um combate.</p>`;
			} else if (f.dist >= estado.meta) {
				f.fora = true;
				f.status = "escapou";
				html += `<p><b>${f.nome} escapa</b> por um bueiro, beco ou esconderijo do submundo.</p>`;
			}
		}
		const restam = estado.parts.filter((x) => x.lado === "f" && !x.fora);
		const perseguindo = estado.parts.filter((x) => x.lado === "p" && !x.fora);
		if (!restam.length || !perseguindo.length) {
			html += "<p><i>Fim da perseguição.</i></p>";
			await game.user.unsetFlag("world", CHAVE);
		} else {
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
		command: `// Fim dos Tempos · Arco 2 · Aventura 0 · gerado por a2-av0-valkaria.js\n(${fn.toString()})();`
	});
	const macros = await Macro.createDocuments([
		macro("Arco 2 · Lei & Ordem", "icons/svg/book.svg", macroLeiOrdem),
		macro("Arco 2 · Perseguição", "icons/svg/target.svg", macroPerseguicao)
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

	const ATIVIDADES = [
		["Atelier de Esculturas das Medusas", "Numa cena à escolha, +5 em Furtividade se ficar parado.", 100],
		["Aula Aberta", "+2 numa perícia de Inteligência à escolha.", 100],
		["Aula de Magia", "Conhece uma magia arcana adicional de 1º círculo.", 100],
		["Autópsia Extraplanar", "+2 em Cura, +2 em Misticismo.", 50],
		["Baile da Corte", "+2 em Diplomacia, +2 em Nobreza.", 50],
		["Baile do Populacho", "+2 em Enganação, +2 em Fortitude.", 50],
		["Banho de Sol com os Trogs", "Um uso de Mau Cheiro (ou um uso sem custo, se já tiver).", 150],
		["Banquete Hynne", "+2 em Constituição.", 150],
		["Briga de Rua", "+1 em Força, +1 em Destreza.", 150],
		["Briga de Taverna", "+2 em Guerra, +1d4 PV temporários.", 100],
		["Cassino", "Pode rolar de novo um único teste.", 150],
		["Causos dos Osteon", "Um uso de Lendas e Histórias (ou um uso sem custo, se já tiver).", 100],
		["Circo (animais)", "+2 em Adestramento, +2 em Fortitude.", 50],
		["Circo (palhaços)", "+2 em Enganação, +2 em Ladinagem.", 50],
		["Circo (trapézio)", "+2 em Atletismo, +2 em Reflexos.", 50],
		["Competição de Queda de Braço", "+1 em Força, +2 em Intimidação.", 100],
		["Competição de Tiro ao Alvo", "+1 em Pontaria, +2 em Percepção.", 100],
		["Corrida", "Deslocamento +3m.", 100],
		["Corrida de Bigas", "+2 em Pilotagem; o veículo recebe +3m de deslocamento.", 100],
		["Corrida de Cavalos", "+2 em Cavalgar; +3m de deslocamento montado.", 100],
		["Degustação de Cervejas Anãs", "+2 em Guerra, resistência a magia +1.", 100],
		["Degustação de Vinhos Élficos", "+2 em Percepção, +1 na CD de magias.", 100],
		["Discurso da Rainha-Imperatriz (1×/semana, no Palácio)", "+2 em Carisma.", 150],
		["Discussão Filosófica", "+1 em Inteligência, +1 em Sabedoria.", 150],
		["Duelo de Bardos", "+2 em Atuação, +2 em Iniciativa.", 50],
		["Duelo de Espadachins", "+1 em Luta, +2 em Iniciativa.", 100],
		["Espetáculo de Bardos Arruaceiros", "1d6 PV temporários.", 100],
		["Espetáculo de Bardos Dançantes", "+1 em Destreza, +2 em Enganação.", 100],
		["Espetáculo de Bardos Refinados", "+1 em Carisma, +2 em Conhecimento.", 100],
		["Espetáculo de Bardos Rurais", "+2 em Fortitude, +2 em Vontade.", 100],
		["Espetáculo de Mago de Rua", "+2 em Misticismo, resistência a magia arcana +1.", 50],
		["Festa Ilegal", "+2 em Furtividade, +2 em Investigação.", 50],
		["Galeria de Arte Contemporânea", "+2 em Enganação, +2 em Percepção.", 50],
		["Galeria de Arte Tradicional", "+2 em Conhecimento, +2 em Ofício.", 50],
		["Hospitalidade Goblin", "+5 em Fortitude contra venenos e doenças.", 100],
		["Jardinagem com as Dahllan", "Dorme ao relento e recupera PV e PM como em quarto confortável.", 100],
		["Jejum com os Suraggel", "+2 na CD de magias divinas.", 100],
		["Leilão", "+2 em Intuição, +2 em Ofício (qualquer).", 50],
		["Leilão Ilegal", "+2 em Furtividade, +2 em Intuição, +2 em Ladinagem.", 100],
		["Luta de Arena Menor", "+2 em Cura, +2 em Atuação.", 50],
		["Luta em Arena Ilegal", "+2 em Furtividade, +2 em Intimidação.", 50],
		["Meditação com Guru", "+1 em Sabedoria, +2 em Misticismo.", 100],
		["Missa na Catedral de Valkaria (1×/semana)", "Conhece uma magia divina adicional do maior círculo que pode lançar.", 150],
		["Narguilés Qareen", "+2 na CD de magias arcanas.", 100],
		["Noite Romântica", "+1 em Constituição, +1 em Carisma.", 150],
		["Ópera Anã", "+1 em Inteligência, +2 em Fortitude.", 150],
		["Palestra na Academia Arcana (1×/semana)", "Conhece uma magia arcana adicional do maior círculo que pode lançar.", 150],
		["Pregação do Fim do Mundo", "+2 em Religião, resistência a magia divina +1.", 50],
		["Pregar Peças com as Sílfides", "Imunidade a um único efeito de ilusão à escolha.", 150],
		["Refeição em Taverna", "+2 em Diplomacia, +1d4 PM temporários.", 100],
		["Restaurante de Luxo", "+2 em Nobreza, +1d4 PM temporários.", 100],
		["Rezar na Igreja", "Conhece uma magia divina adicional de 1º círculo.", 100],
		["Sarau no Cemitério", "+2 em Furtividade, +2 em Intimidação.", 50],
		["Serviço Voluntário (desastre)", "+1 em Destreza, +2 em Sobrevivência.", 100],
		["Serviço Voluntário (escola)", "+1 em Inteligência, +2 em Diplomacia.", 100],
		["Serviço Voluntário (guarda)", "+1 em Força, +2 em Investigação.", 100],
		["Serviço Voluntário (hospital)", "+1 em Carisma, +2 em Cura.", 100],
		["Serviço Voluntário (masmorra)", "+1 em Sabedoria, +2 em Ladinagem.", 100],
		["Serviço Voluntário (refeitório)", "+1 em Constituição, +2 em Vontade.", 100],
		["Teatro (comédia)", "+2 em Ladinagem, +2 em Atuação.", 50],
		["Teatro (tragédia)", "+2 em Nobreza, +2 em Atuação.", 50],
		["Termas com as Sereias", "Imunidade a um único efeito mental à escolha.", 150],
		["Teste de Invento", "+2 em Conhecimento, +1d4 PM temporários.", 150],
		["Treinamento Militar Minotauro", "Ignora uma única condição de cansaço.", 50],
		["Treino Esportivo", "+1 em Destreza, +2 em Atletismo.", 100],
		["Luta na Arena de Valkaria (1×/semana; só quem passou nas qualificatórias)", "+2 em Força, +2 em Luta.", 0]
	];
	const VECTORA = [
		["Audiência com Vectorius", "Quem sabe o que o maior arquimago de Arton tem a oferecer? Recebe o grupo todo junto.", "5.000"],
		["Celebração na Dança de Marah", "Recupera 2 de Lei & Ordem (ganho real de 1).", "1.000"],
		["Cirurgia no Grêmio dos Médicos Monstros", "Rerrola um atributo físico; fica com o maior. Permanente.", "1.000"],
		["Compra de Livros na Biblioteca das Respostas", "Revela um material escrito da campanha ou uma pista aprovada pelo mestre.", "200"],
		["Estadia no Hotel Reinos dos Deuses", "Recuperação de estadia luxuosa (triplo do normal).", "250"],
		["Leilão de Itens Mágicos", "Compra qualquer item mágico do livro básico pelo preço normal.", "500"],
		["Passeio de Balão", "+5 em Sobrevivência ou Investigação para se orientar em Valkaria.", "150"],
		["Passeio de Grifo", "Localiza um lugar fixo da tabela de Encontros em Valkaria.", "200"],
		["Treinamento com Herói Lendário", "Troca um poder permanentemente.", "1.000"],
		["Turismo Planar", "Rerrola um atributo mental; fica com o maior. Permanente.", "1.000"]
	];
	const MORADIAS = [
		["Apartamento na Cidade da Praia", "10%"],
		["Casa na Cidade da Praia ou apartamento em bairros \"normais\"", "20%"],
		["Apartamento ruim no Bairro do Recomeço ou casa em bairros \"normais\"", "30%"],
		["Apartamento bom no Bairro do Recomeço ou mansão na Cidade da Praia", "40%"],
		["Casa no Bairro do Recomeço, apartamento no Refúgio da Felicidade ou mansão em bairros \"normais\"", "50%"],
		["Casa no Refúgio da Felicidade", "60%"],
		["Mansão no Bairro do Recomeço", "70%"],
		["Palacete, fortaleza, torre ou pequeno castelo na Cidade da Praia, ou mansão no Refúgio da Felicidade", "80%"],
		["Palacete, fortaleza, torre ou pequeno castelo em bairros \"normais\"", "90%"],
		["Palacete, fortaleza, torre ou pequeno castelo no Bairro do Recomeço ou no Refúgio da Felicidade", "100%"]
	];
	const tabelaHtml = (cab, linhas) => `<table><tr>${cab.map((c) => `<th>${c}</th>`).join("")}</tr>${linhas.map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table>`;

	await JournalEntry.create({
		name: "Arco 2 · Aventura 0 · Chegada a Valkaria",
		folder: pasta.JournalEntry,
		flags: FLAGS(),
		pages: [
			pagina("Guia do Mestre", `
				<h2>Resumo</h2>
				<p>O grupo chega a Valkaria com a ${L(itemPorNome("Carta"))}, conhece ${L(atores.blixto)} na Metais do Baixote e é levado à Guarita da Praia, onde a ${L(atores.mathilda)} os testa com um caso simples: capturar seis bandidos que tomaram uma rua mercantil. Termina com o juramento de detetives e o Quadro de Casos.</p>
				<p><b>Não dá nível nem Lei &amp; Ordem.</b> É uma vitrine dos novos locais e NPCs, com uma cena de ação curta.</p>
				<h2>Fases</h2>
				<ol>
					<li><b>Chegada</b> à cidade e à Metais do Baixote. Se quiser, role uma vez em ${L(tabEncontros)}, mas é melhor ir direto.</li>
					<li><b>Justiça, Dever e Dinheiro:</b> Blixto, a Guarita da Praia, Mathilda e o regulamento.</li>
					<li><b>Primeiro Caso:</b> ${L(atores.bandido)} ×5, ${L(atores.barnett)} e a ${L(atores.gargula)}, com perseguição.</li>
					<li><b>Juramento</b> e o ${L(itemPorNome("Distintivo"))}.</li>
					<li><b>Desfecho:</b> o Quadro de Casos.</li>
				</ol>
				<h2>Para o arco todo</h2>
				${lista([
					`${L(atores.leiOrdem)} guarda o contador (começa em 20). Use ${linkMacro("Lei & Ordem")} no fim de cada sessão, a cada atividade e ao entregar provas.`,
					`${L(tabEncontros)}: role sempre que o grupo se desloca.`,
					`${linkMacro("Perseguição")} serve para qualquer perseguição do arco (selecione os perseguidores, marque os fugitivos como alvo). Usa ${L(tabPerseguicao)}.`,
					"As páginas <i>Lei &amp; Ordem e Provas</i>, <i>Atividades em Valkaria</i> e <i>Moradias</i> podem ser mostradas aos jogadores (o autor diz que o texto das regras não tem spoilers)."
				])}`, 100),
			pagina("Handout · Carta de Belinda", `
				<p><i>Destinatário: Blixto Arting<br>Metais do Baixote, Cidade da Praia, Valkaria</i></p>
				<blockquote><p><i>"Caro primo, vim até as Colinas Centrais para provar que posso ser uma comerciante e ferreira tão boa quanto você. Não consegui ainda, mas Tibar me abençoou com as ferramentas certas para fazer isso. Descobri o metal arco-íris, um material que só existe aqui, com uma história francamente inacreditável. Mas esta carta não é sobre isso. Quando disse que as Centrais me deram as ferramentas certas, não estava falando só do metal. Falo também de um grupo de aventureiros.</i></p>
				<p><i>Eles têm futuro. Podem não parecer, podem ter a cara e o jeito de quem vai levá-lo à falência, podem começar a brigar entre si antes que terminem de se apresentar, mas são bons. E vão precisar de uma base de operações, de algum apoio, de ajuda para montar de novo suas vidas. É aí que você entra.</i></p>
				<p><i>Eles são bons investimentos. Talvez o defendam de um ataque de lontras fantasmas assassinas, talvez façam propaganda das suas armas. De qualquer forma, vão render dividendos. E lembre-se: lucro para mim é sagrado! Tibar confia nesses moleques.</i></p>
				<p><i>Até a próxima,<br>Belinda Arting</i></p>
				<p><i>Metais do Baixote Forja &amp; Armazém, Forte Cabeça-de-Martelo, Colinas Centrais"</i></p></blockquote>`, 200),
			pagina("Fase 0 · Chegada", `
				<p>A aventura começa numa das maiores mudanças na vida dos heróis. Descreva Valkaria como quiser: a campanha enfatiza o lado perigoso, sujo, movimentado e moderno da capital.</p>
				<h3>Pontos para narrar</h3>
				${lista([
					"Na viagem, o \"mundo real\" volta: ninguém mais anda com arma de fogo, o grupo atrai olhares, aparecem estradas e aldeias.",
					"Uma montanha no horizonte... que é uma estátua. A deusa anuncia a capital.",
					"Mais de um dia atravessando a periferia, um oceano de gente. Em Valkaria, é como se os outros não existissem.",
					"Horas na fila do portão com comerciantes, peregrinos, nobres, turistas, imigrantes e talvez vilões. Ninguém é barrado.",
					"Dentro das muralhas, um mundo de retalhos de outros mundos. Só lembra o Mundo de Tilliann, das memórias dos gnomos."
				])}
				<p>O destino é a matriz da <b>Metais do Baixote</b>, na Cidade da Praia. Enfatize o cansaço, que não conhecem nada e que hospedagem na metrópole é cara.</p>
				<h3>Contingência: Perdidos em Valkaria</h3>
				<p><b>Recomendado:</b> diga com franqueza que neste início é melhor focar na Metais e nos NPCs principais; haverá tempo para o resto.</p>
				<p><b>Mais sutil:</b> tudo existe em Valkaria, mas ninguém sabe onde. Sem mapas, placas ou endereços; ruas de dois metros, sem planejamento; distâncias em horas ou dias. Use a demora para se preparar, role pelo menos uma vez em ${L(tabEncontros)} e ofereça atividades.</p>
				<h3>A Metais do Baixote</h3>
				<p>Uma fortaleza comercial que ocupa mais de um quarteirão: várias entradas (a primeira é de serviço e eles são gentilmente expulsos; a segunda dá num salão de forjas), loja lotada, taverna, área de testes de armas. Mencionando Belinda, são levados a uma figura baixa e frenética, deixando um rastro de fumaça de charuto.</p>`, 300),
			pagina("Fase 1 · Justiça, Dever e Dinheiro", `
				<h3>Blixto</h3>
				<blockquote><p><i>"Se minha prima escreveu isso sobre vocês, só pode significar uma de duas coisas. Ou ela foi enfeitiçada ou são bons mesmo! Podem começar se provando agora. Vamos, não fiquem parados, venham atrás de mim! Não posso deixar o trabalho se acumular desse jeito!"</i></p></blockquote>
				${lista([
					"Aventureiros são <b>investimento</b>. Não contrata nem tem missões, mas apadrinha.",
					"Bom coração, mas \"salvar o mundo\" é vago: se o mundo inteiro está em risco, outros heróis também sabem. Pergunta do que precisam e aonde querem chegar.",
					"Tem relação próxima com a Guarda, em especial a Guarita da Praia. Explica a Guarda e o papel dos patrocinadores.",
					"Para vigiar vilões ligados ao crime e às irmandades, o melhor é trabalhar com a Guarda. <b>Enfatize isso.</b> Se não colar, diga aos jogadores com franqueza que o arco envolve uma parceria com a Guarda.",
					"A criminalidade cresce: as irmandades estão ousadas, quase em guerra aberta, e alguns ostentam o brasão.",
					"A Cidade da Praia é território da Companhia dos Irmãos. A Metais nunca foi extorquida, mas há semanas Irmãos passam na frente várias vezes por dia ou ficam parados olhando.",
					"A Casa Blasanov já fez incursões no bairro, deixando cadáveres de Irmãos e de inocentes.",
					"Não sabe quase nada da Companhia e não consegue detectar vilões como a tripulação da Roca.",
					"Oferece dicas e um lugar para dormir; manda alguém ajudar a achar moradia (por conta de cada um).",
					"Quem tiver um <b>negócio</b> retoma de onde parou nas Colinas, com ajuda dele.",
					"Apresenta o grupo à Xerife Mathilda Nolt."
				])}
				<h3>A Guarita da Praia</h3>
				<p>Parece um mosteiro: prédio largo e baixo, cortado por canais, com espelho d'água, colunas decoradas e alcovas de meditação. Mas é colorido e barulhento: roupas penduradas, patrulheiros comendo na porta, cidadãos entrando e saindo como donos, gritos de suspeitos e vítimas. Janelas reforçadas, porta como portão de castelo.</p>
				<p>O escritório de Mathilda tem prateleiras de laboratório alquímico, colecionador de bizarrias ou assassino serial, tudo rotulado: \"Provas\", \"Referências\", \"Reagentes\". <i>"Trouxe novas vítimas?"</i></p>
				<p>Mathilda explica as regras e aceita testar o grupo pela recomendação de Blixto. Os guardas veteranos sentem que \"algo\" vai acontecer em alguns meses. O grupo é convidado (ou intimado) a ser <b>detetive temporário</b>, se provar competência.</p>
				<p>Escolha dois ou três NPCs da guarita para interagir (boas opções: Dra. Zymni, Saeba e Finley). Ao longo disso Mathilda explica o Quadro de Casos e então oferece uma missão rápida de teste.</p>
				<h3>Pagamento</h3>
				<p>Sem salário: a cada aventura o grupo recebe do NPC que fez a queixa o equivalente ao tesouro de uma aventura normal. É só uma mudança estética, como o velhinho da taverna que paga para investigar os bandidos.</p>
				<h3>Não Saia do Regulamento!</h3>
				<p>Estético, não limitante. Nenhum tipo de personagem é vetado e os métodos continuam livres; Mathilda só se importa com o resultado:</p>
				${lista([
					"Trazer os culpados vivos sempre que possível.",
					"Evitar ferir inocentes (mentir, enganar ou intimidar um pouco está fora do controle dela).",
					"Pelo menos tentar não causar dano à cidade e à propriedade.",
					"Usar o distintivo o mínimo possível.",
					"Cidadãos podem barrar a entrada de um guarda; para se infiltrar, métodos normais de aventureiro.",
					"<b>A regra mais importante: coletar provas.</b>"
				])}
				<p>Diga aos jogadores que não precisam imitar policiais de filmes nem mudar o jeito de jogar. A Guarda os limita tanto quanto o Exército do Reinado nas Colinas. A única diferença real é a coleta de provas.</p>`, 400),
			pagina("Elenco da Guarita da Praia", `
				<p><b>${L(atores.mathilda)}</b>: clériga de Tanna-Toh, não mente, cadeirante desde um atentado cujo mandante desconhece (suspeita de guardas corruptos).</p>
				<p><b>Dra. Zymni</b>: trog legista, achada no ovo por aventureiros de Salistick e criada por cientistas. Curiosa, à vontade com cadáveres, humor inapropriado. Come no anexo de autópsias.</p>
				<p><b>Ulnsariann e Throgarimm</b>: elfo e anão, ousado e cauteloso, nobre e plebeu. Brigam o tempo todo e se recusam a trabalhar separados. Métodos pouco convencionais, mas dão resultado.</p>
				<p><b>Saeba</b>: tamuraniano vestido de samurai, mas age sozinho e cheio de truques: o \"Guarda Ninja\". Entrou na Guarda para vingar a irmã mais nova, morta por uma irmandade.</p>
				<p><b>Hannah</b>: aasimar apegada demais à justiça, intolerante com criminosos e com qualquer infração obscura. Leal à Guarda.</p>
				<p><b>Finley</b>: o detetive mais jovem, entusiasmado, ingênuo e verde. Já foi enganado por criminosos (houve pelo menos uma fuga). Mathilda tem pena dele.</p>
				<p><b>Tullia Blasanov</b>: lefou da família criminosa Blasanov, que sempre a rejeitou. Sofre preconceito duplo e sabe que traz perigo à guarita.</p>
				<p><b>Berthun</b>: veterano que poderia ser Xerife, mas dorme em serviço, se atrasa e aparece ferido. Todos acham que é bêbado. <span class="secret">Na verdade é o vigilante mascarado <b>Curandeiro</b>, que caça os criminosos que escapam das investigações.</span></p>`, 500),
			pagina("Fase 2 · Primeiro Caso", `
				<p>Seis criminosos se instalaram numa rua mercantil perto da guarita: pequenos roubos, extorsão, mercadoria roubada barata, incomodando todo mundo. Não são de nenhuma irmandade, mas querem \"mostrar serviço\" para entrar numa. <b>Todos devem ser capturados</b>; se um escapar, vai continuar infernizando os mercadores. Mathilda prefere que ninguém morra, mas é melhor um pouco de sangue do que deixar como está.</p>
				<h3>Pare em Nome da Lei!</h3>
				<p>A rua é movimentada, colorida, cheia de sotaques e cheiro de especiarias. Os bandidos se exibem. O grupo tem liberdade total (emboscada, disfarce, fingir querer entrar no bando, atacar de longe...). Os bandidos vigiam: preparativos à vista pedem Furtividade ou Enganação contra Percepção ou Intuição.</p>
				<h3>Encontro: Grupo Descarado</h3>
				${lista([
					`Cinco ${L(atores.bandido)}: dois lutam (concentrando num herói ameaçador mas não invulnerável), três fogem em direções diferentes.`,
					`${L(atores.barnett)}: move-se e ativa o medalhão. A ${L(atores.gargula)} desce de um prédio e o carrega voando.`
				])}
				<h3>Perseguição</h3>
				<p>Use ${linkMacro("Perseguição")}: selecione os perseguidores, marque os fugitivos como alvo (T) e rode <i>Iniciar</i>. Depois uma vez por rodada.</p>
				${lista([
					"<b>Vantagem inicial:</b> conforme as ideias do grupo. Disfarçados ou se esgueirando, talvez nenhuma. Voz de prisão de longe, 10 ou mais quadrados.",
					"<b>Escapam</b> se percorrerem <b>80 quadrados (120 m)</b> antes de alcançados: bueiros, becos, esconderijos do submundo. Correm por telhados e jogam obstáculos.",
					"<b>Corrida:</b> Atletismo, avança quadrados iguais ao resultado; ±2 por 1,5 m de deslocamento acima ou abaixo de 9 m. Corre por 1 + Constituição rodadas; depois Fortitude CD 15 (+1 por teste), falha = fatigado e fora. A macro faz tudo isso.",
					"<b>Gárgula:</b> Atletismo +14 na perseguição (já com voo e o peso de Barnett). Com 20+ de dano de uma fonte, Fortitude CD = dano ou derruba Barnett (opção na macro).",
					"<b>Barnett carregado:</b> no início de cada rodada, atira para atrapalhar um perseguidor em alcance médio (opção na macro)."
				])}
				<h3>Os bandidos</h3>
				<p><b>Barnett</b>, o \"cérebro\": franzino e arrogante. <b>Jaylyn, Nok, Abrott e Fredda</b>: bandidos comuns, traiçoeiros, sem lealdade entre si. <b>Gullna</b>, os músculos: a menos esperta, totalmente leal a Barnett.</p>
				<p>Capturados, são só canalhas aproveitando o clima de insegurança. Sonham com a Companhia, mas não têm contato. <b>Deixe claro que não é gancho.</b></p>
				<p>Tesouro: o ${L(itemPorNome("Medalhão"))}.</p>`, 600),
			pagina("Fase 3 · Juramento", `
				<p>Deixe claro que tudo foi rápido demais e que é estranho aceitar desconhecidos sem treinamento: é o quanto a capital precisa de guardas. O mesmo acontece em várias guaritas.</p>
				<p>Cerimônia rápida, sem que o resto pare: gritos, suspeitos acorrentados passando, a Xerife interrompida para decidir algo. Mathilda empurra a cadeira até o centro; os detetives fazem silêncio, cheios de respeito por ela.</p>
				<blockquote><p><i>"Eu juro, por Khalmyr e pela Rainha-Imperatriz<br>
				Defender a cidade, e o povo acima dela<br>
				Honrar meus companheiros, e a lei acima deles<br>
				Buscar em todos os casos a verdade, e a justiça acima disso<br>
				Zelar pela ordem, e pela vida acima de tudo<br>
				Colocar o dever acima de mim mesmo<br>
				E, acima do dever, o bem"</i></p></blockquote>
				<p>Um patrulheiro entrega os distintivos de latão (${L(itemPorNome("Distintivo"))}): um amassado, dois com manchas de sangue. Mathilda sorri: <i>"Bem-vindos ao moedor de carne, detetives."</i></p>
				<h3>Contingência: O Crime Compensa</h3>
				${lista([
					"Se o grupo capturou pelo menos um, já basta: Mathilda explica que sucesso total é raro na Guarda.",
					"Estender a cena: achar o esconderijo ou esperar que reapareçam roubando em outro lugar.",
					"Se falharem totalmente, Saeba ou Berthun intercedem, querendo um favor em troca.",
					"Não \"roube\" para o grupo vencer. Uma falha é história emergente; melhor Blixto garantir a entrada (talvez com dinheiro) do que direcionar combates."
				])}
				<h3>Fase 4 · Desfecho</h3>
				<p>Encerre no juramento ou apresente o resto da guarita. Ao lado da mesa central está o <b>Quadro de Casos</b> (próxima página). Lembre aos jogadores que você precisa de tempo para preparar o caso escolhido.</p>
				<p>Eles não precisam se reportar todo dia: são aventureiros com um patrono fixo. Estão livres para explorar, achar moradia, vasculhar a Metais...</p>`, 700),
			pagina("Handout · Quadro de Casos", `
				<p><i>Pergaminhos pregados no quadro ao lado da mesa central da Guarita da Praia.</i></p>
				<h3>1</h3>
				<blockquote><p><i>"Nossa colega foi capturada e está em cárcere privado! Se ela estivesse na torre de um necromante, no fundo de uma masmorra ou no covil de um troll, saberíamos o que fazer. Mas ela está presa aqui mesmo na cidade e estamos de mãos amarradas! Precisamos que a Guarda a traga de volta em segurança. Quando Valkaria ficou mais perigosa que os ermos?"</i></p>
				<p>Torzogh Meio-Machado, na Taverna do Esqueleto Gordo</p></blockquote>
				<h3>2</h3>
				<blockquote><p><i>"Temos informações sobre a venda de mercadorias ilegais, imorais, irreligiosas e indecentes que acontecerá na próxima vez que Vectora atracar em Valkaria! Não podemos falar mais agora, mas é de interesse da Guarda e de todo o Reinado! Pelo menos esperamos que a Guarda de Valkaria ainda tenha algum interesse em preservar a segurança e a pureza dos cidadãos da capital, e que ainda reste algum respeito pela integridade dos artonianos neste Reinado em farrapos!"</i></p>
				<p>Sociedade Pontifícia de Intercessão Moral Artoniana (SPIMA), segundo andar da casa verde na Rua dos Facóceros</p></blockquote>
				<h3>3</h3>
				<blockquote><p><i>"Tenho um trabalho especial para quem estiver disposto a arriscar a pele sem nenhuma recompensa. Coisa interna. Apenas saibam que, depois que ouvirem sobre o caso, precisam resolvê-lo imediatamente. Quem pegar a missão vai entender."</i></p>
				<p>Xerife Mathilda Nolt, aqui mesmo na guarita</p></blockquote>
				<h3>4</h3>
				<blockquote><p><i>"Não aguento mais brigas de taverna! Se fossem só brigas, eu até acharia normal... Ou quase. Mas é praticamente uma batalha campal toda noite! Eu me esforço para trazer os melhores bardos e oferecer as melhores cervejas anãs, mas só atraio malucos e bandidos! Preciso de ajuda para limpar a taverna, e rápido!"</i></p>
				<p>Click, Taverna Terceira Opção</p></blockquote>
				<h3>5</h3>
				<blockquote><p><i>"Estou sendo acusado de atos inomináveis. Sou inocente, mas cada vez mais pessoas estão convencidas de minha culpa e meu tormento de todas as noites se torna ainda pior. Uma mortalha de mentiras recai sobre mim... E até mesmo a alma mais afeita às trevas pode sucumbir sob a noite perene do ódio."</i></p>
				<p>Vladmir Mors, na Mansão do Sono e Suplício, na Baixa Vila de Lena<br>PS: venham depois do pôr do sol</p></blockquote>
				<h3>6</h3>
				<blockquote><p><i>"Há um assassino serial à solta e ninguém se importa! Um massacre sem solução, vítimas totalmente descartadas por suas famílias, pela nobreza e pelas autoridades. Não interessa o que todos digam, eu sei o que vi e sei que a morte brutal de todos os meus amigos permanece impune. O Baile da Primavera está cancelado até que alguém tome uma atitude."</i></p>
				<p>Duquesa Alfraye Oppulak de Trylon e Foltomett, vocês sabem muito bem onde me encontrar</p>
				<p>Escrito logo abaixo, numa letra diferente: <i>"Esqueça esse caso! É insolúvel porque é a fantasia de uma nobre desocupada! Está aqui há mais de dois anos e ninguém chegou nem perto de resolvê-lo."</i> Throgarimm</p>
				<p>(O pergaminho está bastante amassado e sujo, como se já tivesse passado por diversas mãos.)</p></blockquote>
				<section class="secret"><h3>Para o mestre</h3>
				${lista([
					"1 = Aventura 1 (Os Aventureiros de Stremtol). 2 = Av2 (Conexão Vectora). 3 = Av3 (Fuga da Rocha Cinzenta). 4 = Av4 (Massacre na Taverna dos Maníacos). 5 = Av5 (Túneis Famintos). 6 = Av6 (Baile de Debutantes Sangrento).",
					"A Av2 só pode ser escolhida quando Vectora atracar: role 1d6 depois de cada aventura; chega no 6, e o limiar cai 1 por aventura.",
					"Ordem presumida de nível: Av1 e Av2 no 7, Av3 e Av4 no 8, Av5 no 9, Av6 no 10. Ajuste ±1 nos testes e ±10 PV por nível de diferença.",
					"Versão curta do arco: só Av1, 3, 4 e 5.",
					"Av1 + Av5 liberam a Mini 1 (Ploigoníada); Av3 + Av6 liberam a Mini 2 (Paollus)."
				])}</section>`, 800),
			pagina("Lei & Ordem e Provas", `
				<p>Desde que pisam em Valkaria, os aventureiros notam que a violência e o caos estão prestes a estourar. <b>Lei &amp; Ordem</b> mede o senso de comunidade, o respeito às leis, a confiança nas autoridades, a tranquilidade do povo, a capacidade dos heróis de manter os vilões sob controle e a prosperidade da cidade. Quando chegar a zero, algo vai acontecer: guerra urbana, saques, crime ostensivo, omissão da Guarda... ou pior.</p>
				${lista([
					"Começa em <b>20</b> e cai <b>1 por sessão</b>. Não é culpa de vocês: não dá para resolver todos os crimes de Valkaria.",
					"Cada <b>Atividade em Valkaria</b> custa 1 (vários personagens ao mesmo tempo custam 1; em momentos separados, multiplica).",
					"Cada <b>prova</b> entregue no fim de um caso do quadro rende +1, até <b>5 por caso</b>. Testemunhos juntos contam como uma prova; evidências materiais em geral contam uma a uma.",
					"Só os casos do Quadro rendem Lei &amp; Ordem. Missões pessoais e o teste de entrada (esta aventura) não.",
					"Vinte sessões não bastam para tudo: escolham os casos mais importantes."
				])}
				<p>Provas são relatos de testemunhas, evidências físicas, análises de peritos (arcanistas, inventores), confissões, cadáveres de vítimas, pistas na cena do crime: o que demonstre a um Juiz de Khalmyr que o suspeito preso ou morto era culpado e que o caso foi resolvido. Cada caso sugere provas, mas tragam suas próprias ideias.</p>
				<p>Valor atual: veja ${L(atores.leiOrdem)}.</p>`, 900),
			pagina("Atividades em Valkaria", `
				<p>Cada atividade dura 8 horas, dá um bônus que vale por uma aventura e custa tibares e <b>1 de Lei &amp; Ordem</b>. Só uma por personagem por dia. Não é preciso \"achar\" a atividade, a não ser as semanais.</p>
				${tabelaHtml(["Atividade", "Bônus", "T$"], ATIVIDADES.map(([n, b, t]) => [n, b, t || "—"]))}
				<h3>Atividades em Vectora (só enquanto o Mercado nas Nuvens estiver atracado)</h3>
				${tabelaHtml(["Atividade", "Efeito", "T$"], VECTORA)}`, 1000),
			pagina("Moradias", `
				<p>Em vez de aluguel e custo de vida, quem quer uma casa paga uma porcentagem de todo tesouro ou lucro que receber. Os valores presumem uma moradia por personagem; vários PJs podem dividir (cinco pagando 20% cada têm um palacete no Recomeço). NPCs que morem junto não pagam.</p>
				${tabelaHtml(["Moradia", "% dos ganhos"], MORADIAS)}
				<p>Se o grupo todo morar junto, a moradia usa as regras de bases do Arco 1 (com Heróis de Arton, os custos da base somam ao aluguel). Quem tem negócio com o ativo Alojamentos não paga moradia.</p>
				<p>Amontoados num apartamento na Cidade da Praia: sem penalidade, mas sem conforto nem privacidade, longe das áreas nobres. Um palacete no Recomeço não dá bônus, mas o endereço impressiona e abre portas.</p>`, 1100)
		]
	});

	ui.notifications.info("Arco 2, Aventura 0 criada: ameaças, Blixto, Mathilda, Lei & Ordem, tabelas, diário e 2 macros. Veja a pasta \"" + NOME_PASTA + "\".");
})();
