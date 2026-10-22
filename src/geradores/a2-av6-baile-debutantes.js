/* =====================================================================
 * FIM DOS TEMPOS · ARCO 2 · AVENTURA 6 · "BAILE DE DEBUTANTES SANGRENTO"
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Arco 2 · Av6 · Baile de Debutantes Sangrento" com:
 *      - Ameaças: Lakshrimi (a replicoide Duquesa Alfraye) e um replicoide para cada convidado
 *        de honra, cada um com o seu armamento embutido (o token tem o nome do convidado).
 *      - Apoio: a Duquesa Alfraye, os oito convidados de honra e os detetives Ulnsariann e
 *        Throgarimm (sem ficha no livro).
 *      - Itens: aura de paz, as máscaras da chapelaria, bênçãos e efeitos dos cômodos, o
 *        batatino, o instrumento abençoado e as provas.
 *      - Tabelas: Vítimas, Regras Quebradas, Salas Mágicas e Saída da Sala Mágica.
 *      - Diário com guia, os detetives e Alfraye, becos sem saída, o que realmente aconteceu,
 *        o baile, o palácio, o banho de sangue, o confronto e o desfecho.
 *      - Macros: Baile da Primavera (cenas e vítimas), Passagens Secretas, Cômodos do Palácio,
 *        Adega do Palácio, Cassino dos Sentimentos, Investigar no Baile e Lakshrimi em Combate.
 *   3. Lei & Ordem continua no ator e na macro criados pela Aventura 0 (não são recriados aqui).
 *   4. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "a2av6".
 *
 * Feito a partir do código do sistema (1.6.4, out/2026). Validado no Foundry simulado do
 * módulo giriarpg-fim-dos-tempos; veja o guia a2-av6-baile-debutantes.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "a2av6";
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
			window: { title: "Aventura 6 do Arco 2: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para a Aventura 6 do Arco 2.</p>
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
	const NOME_PASTA = "FdT · Arco 2 · Av6 · Baile de Debutantes Sangrento";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#8a3a5c", flags: FLAGS() })).id;
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
		golem: `${T20I}/ameacas/golem-de-ferro.png`,
		adaga: `${T20I}/itens/equipamentos/adaga.webp`,
		canhao: `${T20I}/itens/equipamentos/mosquete.webp`,
		granada: `${T20I}/itens/itens-magicos/pocao-granada.webp`,
		mordida: `${PA}/mordida.webp`,
		mao: `${PA}/agarrar.webp`,
		sopro: `${PA}/sopro-gas.webp`,
		furtivo: `${PA}/ataque-furtivo.webp`,
		grito: `${PA}/gritador.webp`,
		cristal: `${T20I}/itens/itens-magicos/bola-de-cristal.webp`,
		marah: `${T20I}/magias/santuario.webp`,
		bencao: `${T20I}/magias/bencao.webp`,
		traje: `${T20I}/itens/gerais/traje-da-corte.webp`,
		diario: `${T20I}/itens/gerais/diario.webp`,
		humano: `${T20I}/racas/humano.webp`,
		elfo: `${T20I}/racas/elfo.webp`,
		anao: `${T20I}/racas/anao.webp`
	};
	const furtivo = (d) => aoUsar(`Ataque Furtivo (+${d})`, ICO.furtivo, [["dano", d]], ["attack"]);

	/* ------------------------------------------------------------------ */
	/* 2. Ameaças                                                           */
	/* ------------------------------------------------------------------ */
	const atores = {};

	const embutido = (alvo) => poder("Armamento Embutido", ICO.canhao,
		p(`Na primeira vez em cada cena em que usa ${alvo}, os alvos ficam <b>surpreendidos</b> contra esse ataque.`),
		{ exec: "passive", effects: [cond("Surpreendido")] });
	const convidar = poder("Convidar Amigos", ICO.cristal,
		p("<b>Completa. Recarga (movimento).</b> Usa o cristal rosado do corpo para invocar um replicoide convidado que ainda não esteja em combate. Ele surge num espaço desocupado a até 9m e ataca a partir da próxima rodada. A macro <i>Lakshrimi em Combate</i> lista os replicoides disponíveis."),
		{ exec: "full" });
	const descarga = poder("Descarga Elétrica", `${T20I}/magias/relampago.webp`,
		p("Os ataques corpo a corpo causam <b>+3d6 de eletricidade</b> (já somados nas armas)."), { exec: "passive" });
	const mente = poder("Mente Programada", `${PA}/imunidade-magia.webp`,
		p("Imune a efeitos mentais. Sem valor de Inteligência: <b>não é afetado pela Aura de Paz</b> do palácio."), { exec: "passive" });
	const copia = (quem) => poder("Cópia Programada", ICO.traje,
		p(`Emula ${quem} de forma quase perfeita: +10 em Diplomacia, Enganação e Nobreza e +10 adicional em Enganação para se passar por essa pessoa (já somados). No palácio, +10 em Furtividade e Percepção.`,
			"<b>Notar a troca:</b> Intuição CD 35, +2 por detalhe que o jogador descrever (macro <i>Investigar no Baile</i>)."),
		{ exec: "passive" });

	atores.lakshrimi = await criarNPC({
		name: "Lakshrimi, Replicoide Duquesa Alfraye",
		tokenName: "Duquesa Alfraye",
		role: "lakshrimi",
		link: true,
		img: ICO.golem,
		nd: 10,
		cd: 32,
		tipo: "con",
		papel: "solo",
		atr: { for: 2, des: 2, con: 3, int: 6, sab: 3, car: 5 },
		pv: 250,
		def: 33,
		walk: 9,
		sentidos: ["escuro"],
		pericias: { inic: 11, perc: 12, fort: 22, refl: 16, vont: 10, atle: 13, dipl: 25, enga: 24, furt: 13, nobr: 25, luta: 25, pont: 25 },
		ic: ["mental"],
		res: { dano: { base: 5 } },
		resTxt: "Imunidade a efeitos mentais, redução de dano 5.",
		ataquesTxt: "Adaga +25 ×2 (2d4+16, 18, mais 3d6 eletricidade).",
		ataquesAdTxt: "Canhão Peitoral +25 ×2 (5d12 impacto, 19/×3, alcance curto).",
		equipTxt: "Adaga precisa, traje da corte aprimorado.",
		bio: p("A teóloga de bordo da Roca: a navegadora que traçava os rumos do gog'magogue pelo éter divino. Não era kliren: transferiu a mente para um golem (a cobaia do que seria Torgo), trocou de corpo várias vezes e ganhou de Ghorskander uma cobertura orgânica com a aparência da <b>Duquesa Alfraye</b>. Fica em animação suspensa entre os Planos e o ritual do Baile da Primavera a ativa e a traz ao palácio.",
			"Leal ao Dr. Vesper e apaixonada por Ghorskander. Não aceita ser levada até a Alfraye verdadeira de jeito nenhum. Desmascarada, arranca a pele do rosto e o vestido e vira uma máquina de matar.",
			"<b>Autodestruição:</b> se for capturada ou cair abaixo de 0 PV, explode, como Torgo.",
			"Examinar a falsa duquesa: Investigação ou Intuição contra a Enganação dela (+34 para se passar por Alfraye)."),
		effects: [
			aoUsar("Passar-se por Alfraye (+10)", ICO.traje, [["roll", 10]], ["skill"], ["Enganação"]),
			aoUsar("No palácio (+10)", ICO.marah, [["roll", 10]], ["skill"], ["Furtividade", "Percepção"])
		],
		items: [
			arma("Adaga (×2)", ICO.adaga, { dano: "2d4+16", tipo: "perfuracao", critM: 18, extra: [["3d6", "eletricidade"]], effects: [furtivo("5d6")],
				desc: p("Dois ataques por ação padrão. Inclui os 3d6 de eletricidade da descarga elétrica.") }),
			distancia("Canhão Peitoral (×2)", ICO.canhao, { dano: "5d12", tipo: "impacto", critM: 19, critX: 3, alcance: "short", effects: [furtivo("5d6")],
				desc: p("Dois ataques por ação padrão, alcance curto.") }),
			poder("Ataque Furtivo", ICO.furtivo, p("+5d6 contra alvos desprevenidos ou flanqueados. Marque o aprimoramento na janela de ataque."), { exec: "passive" }),
			embutido("o canhão peitoral"),
			convidar,
			poder("Gravação Estridente", ICO.grito,
				p("<b>Reação.</b> Na primeira vez que sofre dano em combate, grita num raio de 9m. Outras criaturas inteligentes na área sofrem <b>6d12 de dano psíquico</b> e ficam <b>atordoadas</b> por 1 rodada (Vontade CD 32 reduz à metade e evita a condição). Mental. A macro <i>Lakshrimi em Combate</i> aplica nos alvos."),
				{ exec: "reaction", area: "raio de 9m", save: "Vontade CD 32 reduz à metade e evita", rolls: [["Grito", [["6d12", "psiquico"]]]], effects: [cond("Atordoado")] }),
			poder("Mão a Jato", ICO.mao,
				p("<b>Padrão. Recarga (movimento).</b> Dispara a mão inábil na garganta de uma criatura em alcance curto: <b>6d6 de impacto mais 3d6 de eletricidade</b> e fica agarrada pela mão (Reflexos CD 32 reduz à metade e evita o agarrão). A vítima se move normalmente, mas sufoca enquanto estiver agarrada; solta-se vencendo um teste oposto de agarrar (+23). Recarregar solta quem estiver preso."),
				{ exec: "action", alcance: "short", alvo: "1 criatura", save: "Reflexos CD 32 reduz à metade e evita o agarrão", rolls: [["Mão a jato", [["6d6", "impacto"], ["3d6", "eletricidade"]]]], effects: [cond("Agarrado")] }),
			poder("Sopro Cáustico", ICO.sopro,
				p("<b>Movimento. Recarga (movimento).</b> Gás venenoso num cubo de 3m: as criaturas dentro <b>perdem 4d12 PV</b> e ficam <b>enjoadas</b> (Fortitude CD 32 reduz à metade e evita a condição). Veneno."),
				{ exec: "move", area: "cubo de 3m", save: "Fortitude CD 32 reduz à metade e evita", rolls: [["Perda de vida", [["4d12", ""]]]], effects: [cond("Enjoado")] }),
			descarga,
			mente,
			copia("a Duquesa Alfraye"),
			poder("Autodestruição", `${T20I}/magias/explosao-de-chamas.webp`, p("Se for capturada ou cair abaixo de 0 PV, um dispositivo faz o corpo explodir, para não comprometer os segredos do Dr. Vesper."), { exec: "passive" })
		]
	});

	/* ---------- replicoides convidados ---------- */
	const ARMAMENTOS = {
		canhao: () => [distancia("Canhão Peitoral (×2)", ICO.canhao, { dano: "4d12", tipo: "impacto", critM: 19, critX: 3, alcance: "short", effects: [furtivo("4d6")],
			desc: p("<b>Armamento embutido.</b> Dois ataques por ação padrão, alcance curto.") }), embutido("o canhão peitoral")],
		granada: () => [poder("Granada Ocular", ICO.granada,
			p("<b>Padrão. Armamento embutido.</b> Projeta um globo ocular que explode num ponto em alcance curto: <b>6d6 de impacto</b> a até 3m (Reflexos CD 24 reduz à metade). Surpreendidos que falham também sofrem o Ataque Furtivo (+4d6). Tem <b>duas</b> granadas; usá-las não prejudica a visão."),
			{ exec: "action", alcance: "short", area: "esfera de 3m de raio", save: "Reflexos CD 24 reduz à metade", rolls: [["Explosão", [["6d6", "impacto"]]], ["Ataque Furtivo", [["4d6", ""]]]] }), embutido("a granada ocular")],
		mandibula: () => [arma("Mandíbula de Ferro", ICO.mordida, { dano: "1d6+12", tipo: "perfuracao", ajuste: 1, extra: [["3d6", "eletricidade"]], effects: [furtivo("4d6")],
			desc: p("<b>Armamento embutido.</b> Ataque natural de mordida (+25) que se soma aos ataques de adaga.") }), embutido("a mandíbula de ferro")],
		mao: () => [poder("Mão a Jato", ICO.mao,
			p("<b>Padrão. Recarga (movimento). Armamento embutido.</b> Uma criatura em alcance curto sofre <b>3d6 de impacto mais 3d6 de eletricidade</b> e fica agarrada pela mão (Reflexos CD 24 reduz à metade e evita o agarrão). Sufoca enquanto agarrada; solta-se vencendo um teste oposto de agarrar (+22)."),
			{ exec: "action", alcance: "short", alvo: "1 criatura", save: "Reflexos CD 24 reduz à metade e evita o agarrão", rolls: [["Mão a jato", [["3d6", "impacto"], ["3d6", "eletricidade"]]]], effects: [cond("Agarrado")] }), embutido("a mão a jato")],
		sopro: () => [poder("Sopro Cáustico", ICO.sopro,
			p("<b>Movimento. Recarga (movimento). Armamento embutido.</b> Gás venenoso num cubo de 3m: <b>perdem 2d12 PV</b> e ficam <b>enjoadas</b> (Fortitude CD 24 reduz à metade e evita a condição). Veneno."),
			{ exec: "move", area: "cubo de 3m", save: "Fortitude CD 24 reduz à metade e evita", rolls: [["Perda de vida", [["2d12", ""]]]], effects: [cond("Enjoado")] }), embutido("o sopro cáustico")]
	};
	const NOME_ARMAMENTO = { canhao: "canhão peitoral", granada: "granada ocular", mandibula: "mandíbula de ferro", mao: "mão a jato", sopro: "sopro cáustico" };
	const CONVIDADOS = [
		{ k: "drekaag", nome: "Drekaag", titulo: "Príncipe Drekaag de Sckharshantallas", arm: "canhao", img: ICO.humano, raca: "humano (sangue de dragão)" },
		{ k: "kalyon", nome: "Kalyon", titulo: "Duque Kalyon Montalbert Arkystan III", arm: "mandibula", img: ICO.humano, raca: "humano" },
		{ k: "angeliese", nome: "Angeliese", titulo: "Viscondessa Angeliese Michon-Albanez de Wallas e Ramannt", arm: "mao", img: ICO.humano, raca: "humana" },
		{ k: "archibald", nome: "Archibald", titulo: "Conde Archibald Benessar Xendros Tranalyell Whorp", arm: "granada", img: ICO.humano, raca: "humano" },
		{ k: "melynna", nome: "Melynna", titulo: "Duquesa Melynna Trewnwryte Stolinsson Fröghstassen Jurdluchstnach, \"a Vigésima-Primeira Deusa do Panteão\"", arm: "mandibula", img: ICO.humano, raca: "humana" },
		{ k: "loranth", nome: "Loranth", titulo: "Barão Loranth Okanjyll Lessamar Lodek, \"o Teleporte\"", arm: "sopro", img: ICO.humano, raca: "humano" },
		{ k: "axel", nome: "Axel", titulo: "Conde Axel Trelock Dezzenhal da Grande Batalha", arm: "canhao", img: ICO.humano, raca: "humano" },
		{ k: "irludde", nome: "Irludde", titulo: "Marquesa Irludde Dyssindar Veront-Faryllia", arm: "mao", img: ICO.humano, raca: "humana" }
	];
	const BIO_CONVIDADO = {
		drekaag: ["Um dos poucos não humanos da alta nobreza: descendente distante de Sckhar (pupilas verticais, cabelos vermelhos, escamas). Mais velho que os amigos, mas com a cabeça de quem sai da adolescência. Exagera o \"comportamento dracônico\": ouro, o nome de Sckhar, fogo. A herança é mais pose do que qualquer outra coisa.",
			"<b>É sempre a primeira vítima</b> (os não humanos morrem primeiro: Lakshrimi teme que criaturas mágicas notem sua natureza).",
			"Atividades: conta que Sckhar lhe pediu um conselho; cria fogo para impressionar; finge não entender palavras comuns para parecer \"exótico\"."],
		kalyon: ["Bonito, carismático e totalmente ingênuo; tão desconectado que não entende como alguém pode não gostar dele. Acha que assassinatos são coisa de histórias.",
			"Atividades: organiza uma caridade (perfume para os soldados perto da Tormenta); tenta assumir a cozinha para \"ajudar\"; pergunta quando foi o último assassinato em Valkaria (há mais de 100 anos, não?)."],
		angeliese: ["Tem alguma noção das tragédias do mundo \"normal\" e quer ajudar, mas não sabe como: já doou vestidos para os refugiados usarem em seus bailes.",
			"Atividades: pergunta sobre a vida de um herói, interessada de verdade; questiona se os puristas eram tão ruins; dá conselhos ao deus de um devoto."],
		archibald: ["Quer ser arcanista e tem talento (a Academia Arcana já o espera), mas a paixão por Melynna o distraiu. Baixinho, magro e desajeitado. É o maior interessado no baile: acha que terá mais chance sob a bênção de Marah.",
			"Atividades: faz perguntas sem fim a um arcanista ou estudioso; pede conselhos para conquistar Melynna; tenta se apresentar para ela e falha miseravelmente.",
			"Se rolar <i>Faz sexo</i>, a proposta é uma brincadeira cruel de outro nobre."],
		melynna: ["Talvez a pessoa mais bela da cidade e a herdeira mais cobiçada de Arton. Deu a si mesma o epíteto de \"Vigésima-Primeira Deusa do Panteão\". Arrogante e condescendente: sabe que é melhor que todos.",
			"Atividades: rejeita uma proposta de casamento; dá uma \"gorjeta\" para um herói sair da festa; pergunta com enfado a um artista se vai ter de aturar mais uma obra em sua homenagem."],
		loranth: ["Um dos maiores especialistas em drogas do mundo, \"o Teleporte\": faz os amigos \"irem para outro lugar\" com Semiplaninho de Wynna, Amansa-Ogro, Holy Absolver, Masmorrite... Acredita em teorias de conspiração.",
			"Atividades: ri descontroladamente de algo dito a sério; oferece \"substâncias\"; explica que Arton é o sonho de uma criança.",
			"Se for a vítima, a regra quebrada é sempre <i>Usa drogas</i>. A réplica dele não usa substâncias."],
		axel: ["Família de \"novos ricos\" sagrada na Grande Batalha. Alto, forte, treinou como guerreiro; pavio curto, mostra força perto das garotas e desafia quem questione sua nobreza.",
			"Atividades: puxa briga por qualquer coisa; conta histórias exageradas de bandidos derrotados; desafia o mais forte do grupo para queda de braço."],
		irludde: ["Vive para as pequenas intrigas do Grande Jogo: fofocas, competições e escândalos. Não é maligna, mas não perde a chance de divulgar segredos. Quem a deixa falar descobre muita coisa.",
			"Atividades: comenta a roupa de um herói para forçar algo comprometedor; tenta arrancar um segredo; conta, \"escandalizada\", o que um amigo fez (útil para guiar o grupo até uma vítima).",
			"A réplica dela não espalha fofocas."]
	};

	const replicoide = (c) => criarNPC({
		name: `Replicoide de ${c.nome}`,
		tokenName: c.nome,
		role: `rep-${c.k}`,
		img: ICO.golem,
		nd: 7,
		cd: 24,
		tipo: "con",
		papel: "solo",
		atr: { for: 2, des: 2, con: 3, int: 0, sab: 0, car: 0 },
		pv: 64,
		def: 29,
		walk: 9,
		sentidos: ["escuro"],
		pericias: { inic: 9, perc: 9, fort: 19, refl: 14, vont: 8, atle: 9, dipl: 18, enga: 17, furt: 9, nobr: 17, luta: 24, pont: 25 },
		ic: ["mental"],
		resTxt: "Imunidade a efeitos mentais.",
		ataquesTxt: "Adaga +24 ×2 (2d4+12, 19, mais 3d6 eletricidade).",
		equipTxt: "Adaga, traje da corte aprimorado.",
		bio: p(`O golem que substitui <b>${c.titulo}</b>. Mata o original, traga o corpo para o cristal rosado (leva um ou dois minutos) e toma o lugar dele, comportando-se de forma sutilmente diferente. Depois arranja uma desculpa para ficar perto da próxima vítima.`,
			`<b>Armamento embutido escolhido:</b> ${NOME_ARMAMENTO[c.arm]} (o livro deixa a escolha ao mestre; troque o item se quiser).`,
			"Int –: o livro não dá valor de Inteligência (aqui fica 0). Não é afetado pela Aura de Paz."),
		effects: [
			aoUsar(`Passar-se por ${c.nome} (+10)`, ICO.traje, [["roll", 10]], ["skill"], ["Enganação"]),
			aoUsar("No palácio (+10)", ICO.marah, [["roll", 10]], ["skill"], ["Furtividade", "Percepção"])
		],
		items: [
			arma("Adaga (×2)", ICO.adaga, { dano: "2d4+12", tipo: "perfuracao", critM: 19, extra: [["3d6", "eletricidade"]], effects: [furtivo("4d6")],
				desc: p("Dois ataques por ação padrão. Inclui os 3d6 de eletricidade da descarga elétrica.") }),
			...ARMAMENTOS[c.arm](),
			poder("Ataque Furtivo", ICO.furtivo, p("+4d6 contra alvos desprevenidos ou flanqueados."), { exec: "passive" }),
			convidar,
			descarga,
			mente,
			copia(c.nome)
		]
	});
	for (const c of CONVIDADOS) atores[`rep-${c.k}`] = await replicoide(c);

	/* ---------- NPCs sem ficha no livro ---------- */
	const SEM_FICHA = "<b>Não tem ficha no livro.</b> Este ator existe para o token no mapa e para mostrar aos jogadores. Em testes opostos para driblar a vigilância, os nobres têm <b>+20</b> nas perícias relevantes (tudo com magia) e controle mental contra eles falha automaticamente.";
	const apoio = (role, name, img, raca, atr, bio, extra = {}) => criarNPC({
		name, role, img, disposition: 1, link: true, nd: 1, tipo: "hum", raca, papel: "special", atr, pv: 10, def: 10, bio: p(...bio, SEM_FICHA), ...extra
	});
	atores.alfraye = await apoio("alfraye", "Duquesa Alfraye Oppulak de Trylon e Foltomett", ICO.humano, "humana", { for: 0, des: 1, con: 0, int: 2, sab: 1, car: 2 }, [
		"Jovem (menos de vinte anos), chefe da família Oppulak desde que os pais e tios morreram na Guerra Artoniana. Melancólica, despojada, descalça e sempre com um livro. Odeia honoríficos e vai direto ao ponto. Mora no Castelo Oppulak, no Bairro do Recomeço.",
		"Dois anos atrás viu seis amigos mortos no Baile da Primavera, e todos estavam vivos depois. Ninguém acredita nela; cancelou o baile. É a \"última garota\": só é vítima se for rolada duas vezes seguidas.",
		"Uma das NPCs mais prestativas de Valkaria: paga poções, produtos alquímicos, munições e consumíveis para quem a leva a sério (não armas nem armaduras). Fica decepcionada com quem a usa pelo dinheiro. Não, o nome dela não é Airfryer."
	], { tokenName: "Alfraye" });
	for (const c of CONVIDADOS) {
		atores[c.k] = await apoio(c.k, c.titulo, c.img, c.raca, { for: c.k === "axel" ? 3 : 0, des: 1, con: 0, int: c.k === "archibald" ? 3 : 1, sab: 0, car: c.k === "melynna" ? 4 : 2 },
			[...BIO_CONVIDADO[c.k], `Replicoide: ${L(atores[`rep-${c.k}`])}.`], { tokenName: c.nome, disposition: 0 });
	}
	atores.ulnsariann = await apoio("ulnsariann", "Ulnsariann", ICO.elfo, "elfo", { for: 0, des: 2, con: 0, int: 2, sab: 1, car: 1 }, [
		"Detetive da Guarita da Praia, parceiro (e rival) de Throgarimm. Elfo ousado, nobre, que prefere iniciativa a manuais. Investigou o caso de Alfraye dois anos atrás e acha que não há nada a investigar.",
		"Se o grupo dividir o mérito com a dupla, ele e o anão pagam vinhos élficos e cervejas anãs para todos; se esfregarem o caso resolvido na cara deles, viram rivais."
	]);
	atores.throgarimm = await apoio("throgarimm", "Throgarimm", ICO.anao, "anão", { for: 2, des: 0, con: 2, int: 1, sab: 1, car: 0 }, [
		"Detetive anão da Guarita da Praia, cauteloso e plebeu, sempre brigando com Ulnsariann. Escreveu no pergaminho do caso: <i>\"Esqueça esse caso! É insolúvel porque é a fantasia de uma nobre desocupada!\"</i>",
		"Entrevistou todas as \"vítimas\" (\"eram bem tagarelas para cadáveres\"), trouxe a Dra. Zymni para descartar mortos-vivos e desistiu em uma semana, com a aprovação da Xerife Mathilda."
	]);

	/* ------------------------------------------------------------------ */
	/* 3. Itens                                                             */
	/* ------------------------------------------------------------------ */
	const itemDoc = (d) => ({ ...d, folder: pasta.Item, flags: FLAGS() });
	const tesouro = (name, img, html) => itemDoc({ name, type: "tesouro", img, system: { description: { value: html }, qtd: 1, preco: 0, peso: 0, espacos: 0 } });
	const BAILE = { world: { fdt: TAG, fdtBaile: true } };
	const efeitoBaile = (name, img, changes, description) => fx(name, img, changes, { transfer: true, description, flags: BAILE });

	const MASCARAS = [
		["Coroa", "nobr", "enga", "Nobreza", "Enganação"],
		["Dados", "joga", "reli", "Jogatina", "Religião"],
		["Nota musical", "atua", "nobr", "Atuação", "Nobreza"],
		["Pena", "conh", "refl", "Conhecimento", "Reflexos"],
		["Raposa", "intu", "fort", "Intuição", "Fortitude"],
		["Rosa", "dipl", "inti", "Diplomacia", "Intimidação"],
		["Serpente", "enga", "dipl", "Enganação", "Diplomacia"],
		["Urso", "inti", "conh", "Intimidação", "Conhecimento"],
		["Vela", "reli", null, "Religião", "ataques"]
	];
	const mascaraChanges = ([, mais, menos]) => [[`system.pericias.${mais}.bonus`, "2"], menos ? [`system.pericias.${menos}.bonus`, "-2"] : ["system.modificadores.ataque.geral", "-2"]];

	const novosItens = [
		itemDoc(poder("Aura de Paz (Palácio do Coração Florido)", ICO.marah,
			p("Durante o Baile da Primavera, nenhuma criatura com valor de Inteligência pode realizar <b>qualquer ação hostil</b> (ataques, dano, condições negativas, envenenar, controle mental...). Sem teste e sem imunidade possível para personagens jogadores. É possível se esgueirar, observar, seguir e convencer com perícias sociais.",
				"Os replicoides são imunes (não têm Inteligência). Quando Alfraye decreta o fim do baile, o efeito cessa (macro <i>Baile da Primavera</i>)."),
			{ exec: "passive" })),
		...MASCARAS.map((m) => itemDoc({
			name: `Máscara Alegórica: ${m[0]}`,
			type: "equipamento",
			img: `${T20I}/itens/gerais/bandana.webp`,
			effects: [efeitoBaile(`Máscara: ${m[0]}`, `${T20I}/itens/gerais/bandana.webp`, mascaraChanges(m), `+2 em ${m[3]}, –2 em ${m[4]} até o fim do baile.`)],
			system: { description: { value: p(`Pedida na chapelaria do palácio. <b>+2 em ${m[3]}, –2 em ${m[4]}</b>. Efeito mágico do palácio: uma vez usada, dura até o fim da festa.`) }, qtd: 1, preco: 0, espacos: 0 }
		})),
		itemDoc(poder("Bênção da Capela de Marah", ICO.bencao,
			p("Quem reza na capela recebe <b>+1 em Sabedoria e Carisma</b> até o fim do baile, enquanto seguir as obrigações e restrições de Marah."),
			{ exec: "passive", effects: [efeitoBaile("Bênção da capela", ICO.bencao, [["system.atributos.sab.bonus", "1"], ["system.atributos.car.bonus", "1"]], "+1 em Sabedoria e Carisma enquanto seguir as obrigações de Marah.")] })),
		itemDoc(poder("Ateliê da Inspiração", `${T20I}/poderes/magia.webp`,
			p("Uma cena nesta sala mágica dá <b>+5 em Atuação e Ofício</b> até o fim do baile (o efeito soma em Atuação; some o +5 de Ofício na rolagem)."),
			{ exec: "passive", effects: [efeitoBaile("Ateliê da inspiração", `${T20I}/poderes/magia.webp`, [["system.pericias.atua.bonus", "5"]], "+5 em Atuação e Ofício até o fim do baile.")] })),
		itemDoc(poder("Calor do Coração", `${T20I}/magias/enfeiticar.webp`,
			p("Duas pessoas que possam se atrair fazem Carisma CD 10. Se ambas passam, despertam sentimentos românticos (ou amizade profunda): sabem onde a outra está e, em alcance curto, recebem <b>+2 em testes de perícia</b> até o fim do baile."),
			{ exec: "passive", effects: [fx("Calor do coração (+2 perto do par)", `${T20I}/magias/enfeiticar.webp`, [["system.pericias.*.bonus", "2"]], { disabled: true, transfer: true, flags: BAILE, description: "Ligue quando o par estiver em alcance curto." })] })),
		itemDoc(poder("Batatino da Estufa", `${T20I}/magias/controlar-plantas.webp`,
			p("Tubérculo animado que cuida da estufa. Um devoto de Marah ou treinado em Sobrevivência convence um a acompanhá-lo: parceiro que dá <b>+2 em Sobrevivência</b> e permite lançar <i>Controlar Plantas</i> (CD Sab; quem já conhece paga –1 PM). Não conta no limite de parceiros durante o baile; depois, conta."),
			{ exec: "passive", effects: [fx("Batatino (+2 Sobrevivência)", `${T20I}/magias/controlar-plantas.webp`, [["system.pericias.sobr.bonus", "2"]], { transfer: true })] })),
		itemDoc({
			name: "Instrumento Abençoado do Palácio",
			type: "equipamento",
			img: `${T20I}/itens/gerais/instrumento-musical.webp`,
			system: { description: { value: p("Uma única vez no baile, quem toca um dos instrumentos dos bastidores no salão de música e tira 30 ou mais em Atuação recebe a bênção do palácio: o instrumento vira mágico, com o efeito de uma <b>flauta fantasma</b> (<i>Tormenta20</i>, p. 344).") }, qtd: 1, preco: 0, espacos: 1 }
		}),
		tesouro("Pedaço do Corpo Metálico de Lakshrimi", ICO.golem, p("Placas, cabos e hastes da teóloga de bordo, com restos de pele orgânica.", "<b>Prova.</b>")),
		tesouro("Fragmento de Cristal Rosado", ICO.cristal,
			p("Um cristal do corpo de um replicoide. Liga o corpo ao espaço entre os Planos, onde os cadáveres foram guardados; também \"engole\" magias de detecção (como Visão da Verdade). Acessar esse espaço está fora do alcance do grupo por enquanto, mas o fragmento pode ser útil mais tarde.", "<b>Prova.</b>")),
		tesouro("Depoimento da Duquesa Alfraye", ICO.diario,
			p("O relato de Alfraye (ou de outro nobre) sobre o baile, os corpos e o que a falsa duquesa fez.", "<b>Prova.</b> Também servem: o cadáver de uma vítima e o relato de quem viu um cadáver ser tragado para dentro de um cristal."))
	];
	const itensCriados = await Item.createDocuments(novosItens);
	const itemPorNome = (inicio) => itensCriados.find((i) => i.name.startsWith(inicio));

	/* ------------------------------------------------------------------ */
	/* 4. Tabelas                                                           */
	/* ------------------------------------------------------------------ */
	const tabela = (name, formula, linhas, description, img = ICO.marah) => RollTable.create({
		name, img, folder: pasta.RollTable, flags: FLAGS(), formula, replacement: true, displayRoll: true, description,
		results: linhas.map(([de, ate, nome, desc]) => ({ type: "text", range: [de, ate], weight: ate - de + 1, name: nome, description: desc ?? "" }))
	});
	const tabVitimas = await tabela("Vítimas do Baile", "1d8", [
		[1, 1, "Kalyon"], [2, 2, "Angeliese"], [3, 3, "Archibald"], [4, 4, "Melynna"], [5, 5, "Loranth", "A regra quebrada é sempre Usa drogas."],
		[6, 6, "Axel"], [7, 7, "Irludde"], [8, 8, "Alfraye", "Role de novo: só é vítima se sair duas vezes seguidas."]
	], "A cada duas cenas, role uma vítima e uma regra quebrada. A primeira vítima é sempre Drekaag. Quem já morreu não vale: role de novo.", ICO.adaga);
	const tabRegras = await tabela("Regras Quebradas", "1d10", [
		[1, 1, "Usa drogas.", "Loranth está envolvido de alguma forma."],
		[2, 2, "Vai investigar um barulho estranho."],
		[3, 3, "Diz \"Já volto\"."],
		[4, 4, "Faz sexo.", "Role outra vítima: os dois morrem (ou o \"parceiro\" é um replicoide). Com Archibald, é uma brincadeira cruel de outro nobre."],
		[5, 5, "Intimida ou ameaça outro personagem."],
		[6, 6, "Registra tudo num diário, porque \"o resto do mundo precisa saber\"."],
		[7, 7, "Acusa outro personagem de ser o assassino."],
		[8, 8, "Diz que o assassino não existe ou já está morto.", "\"Nenhum assassino poderia ter sobrevivido a isso!\""],
		[9, 9, "Diz que não tem medo do assassino."],
		[10, 10, "Conta ou lê uma história de terror.", "Aproveite para usar uma lenda urbana."]
	], "Em princípio, cada resultado só acontece uma vez.", ICO.diario);
	const tabSalas = await tabela("Salas Mágicas", "1d4", [
		[1, 1, "Ateliê da Inspiração (M1)", "Uma cena aqui: +5 em Atuação e Ofício até o fim do baile."],
		[2, 2, "Calor do Coração (M2)", "Carisma CD 10 para cada um do par: sabem onde o outro está e +2 em perícias em alcance curto."],
		[3, 3, "Ninho de Prazer (M3)", "Quem se atrai mutuamente pode usar, até o fim do baile, um poder ou perícia treinada do outro."],
		[4, 4, "Santuário da Esperança (M4)", "1 hora (uma cena): PM temporários iguais ao nível até o fim do baile."]
	], "Para o jardim interno ou uma sala mágica sorteada. Cada sala dura uma cena ou enquanto houver alguém dentro; cadáveres e objetos trazidos são expulsos para um cômodo adjacente.");
	const COMODOS = { A: "Hall de Entrada", B: "Átrio", C: "Chapelaria", D: "Salão Principal", E: "Salão de Banquete", F: "Adega", G: "Cozinha Principal", H: "Lavabo Principal", I: "Sacada Interna", J: "Jardim Interno", K: "Salão de Música", L: "Bastidores", M: "Biblioteca", N: "Estufa", O: "Galeria de Arte", P: "Cassino", Q: "Capela", R: "Sala de Troféus" };
	const tabSaida = await tabela("Saída da Sala Mágica", "1d20", [
		...Object.entries(COMODOS).map(([letra, nome], i) => [i + 1, i + 1, `${nome} (${letra})`]),
		[19, 19, "Dois cômodos", "Role mais duas vezes."],
		[20, 20, "Qualquer cômodo", "À escolha do personagem."]
	], "Cada sala mágica pode ter uma saída para outro cômodo. Se cair no cômodo de origem, só há saída para ele.");

	/* ------------------------------------------------------------------ */
	/* 5. Macros                                                            */
	/* ------------------------------------------------------------------ */

	async function macroBaile() {
		const CHAVE = "fdtBaile";
		const NOMES = { drekaag: "Drekaag", kalyon: "Kalyon", angeliese: "Angeliese", archibald: "Archibald", melynna: "Melynna", loranth: "Loranth", axel: "Axel", irludde: "Irludde", alfraye: "Alfraye" };
		const VITIMAS = ["kalyon", "angeliese", "archibald", "melynna", "loranth", "axel", "irludde", "alfraye"];
		const REGRAS = ["Usa drogas.", "Vai investigar um barulho estranho.", "Diz \"Já volto\".", "Faz sexo.", "Intimida ou ameaça outro personagem.", "Registra tudo num diário, porque \"o resto do mundo precisa saber\".", "Acusa outro personagem de ser o assassino.", "Diz que o assassino não existe ou que já está morto.", "Diz que não tem medo do assassino.", "Conta ou lê uma história de terror."];
		const e = foundry.utils.mergeObject({ cena: 0, mortos: [], regras: [], sorteios: 0, encerrado: false }, game.user.getFlag("world", CHAVE) ?? {}, { inplace: false });
		const vivos = Object.keys(NOMES).filter((k) => !e.mortos.includes(k));
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Baile da Primavera" },
			content: `<p>Cena <b>${e.cena}</b> · substituídos: ${e.mortos.length ? e.mortos.map((k) => NOMES[k]).join(", ") : "ninguém"}${e.encerrado ? " · <b>baile encerrado</b>" : ""}</p>
				<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="cena">Passar uma cena (a cada duas, sorteia vítima e regra)</option>
					<option value="sortear">Sortear vítima e regra agora</option>
					<option value="morto">Convidado foi morto e substituído</option>
					<option value="vivo">Desfazer: convidado está vivo</option>
					<option value="fim">Alfraye encerra o baile (fim da Aura de Paz)</option>
					<option value="zerar">Recomeçar o baile</option></select></div>
				<div class="form-group"><label>Convidado</label><select name="quem">${Object.entries(NOMES).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></div>
				<p style="font-size:0.85em">Vivos: ${vivos.map((k) => NOMES[k]).join(", ")}. Os sorteios vão só para o Mestre.</p>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const gm = ChatMessage.getWhisperRecipients("GM");
		const linkRep = (k) => {
			const a = game.actors.find((x) => x.getFlag("world", "fdt") === "a2av6" && x.getFlag("world", "fdtRole") === `rep-${k}`);
			return a ? `@UUID[${a.uuid}]{${a.name}}` : `replicoide de ${NOMES[k]}`;
		};
		if (res.acao === "zerar") {
			await game.user.unsetFlag("world", CHAVE);
			return ui.notifications.info("Baile da Primavera recomeçado.");
		}
		if (res.acao === "fim") {
			e.encerrado = true;
			let n = 0;
			for (const a of game.actors) {
				const ids = a.effects.filter((x) => x.getFlag("world", "fdtBaile")).map((x) => x.id);
				if (ids.length) { await a.deleteEmbeddedDocuments("ActiveEffect", ids); n += ids.length; }
			}
			await game.user.setFlag("world", CHAVE, e);
			return ChatMessage.create({ content: `<h3>Fim do Baile da Primavera</h3><p>Alfraye decreta o fim do baile: a <b>Aura de Paz</b> acaba e todos podem agir com hostilidade. Os efeitos do palácio terminam (${n} removidos).</p>` });
		}
		const quem = res.quem in NOMES ? res.quem : "drekaag";
		if (res.acao === "morto" || res.acao === "vivo") {
			e.mortos = res.acao === "morto" ? [...new Set([...e.mortos, quem])] : e.mortos.filter((k) => k !== quem);
			await game.user.setFlag("world", CHAVE, e);
			return ChatMessage.create({
				whisper: gm,
				content: `<h3>Baile da Primavera</h3><p>${res.acao === "morto" ? `<b>${NOMES[quem]}</b> foi morto e substituído. Troque o token pelo ${quem === "alfraye" ? "ator de Lakshrimi" : linkRep(quem)} (o token tem o mesmo nome). A réplica age de forma sutilmente diferente e fica perto da próxima vítima.` : `${NOMES[quem]} está vivo.`}</p>`
			});
		}
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r.total; };
		const sortearVitima = async (excluir = []) => {
			if (!e.mortos.includes("drekaag") && e.sorteios === 0 && !excluir.includes("drekaag")) return "drekaag";
			const validos = VITIMAS.filter((k) => !e.mortos.includes(k) && !excluir.includes(k));
			if (!validos.length) return null;
			if (validos.length === 1) return validos[0];
			for (let i = 0; i < 40; i++) {
				const k = VITIMAS[(await rolar("1d8")) - 1];
				if (!validos.includes(k)) continue;
				if (k !== "alfraye") return k;
				const k2 = VITIMAS[(await rolar("1d8")) - 1];
				if (k2 === "alfraye") return "alfraye";
				if (validos.includes(k2)) return k2;
			}
			return validos.find((k) => k !== "alfraye") ?? validos[0];
		};
		let html = "";
		let sortear = res.acao === "sortear";
		if (res.acao === "cena") {
			e.cena += 1;
			html += `<p>Cena <b>${e.cena}</b>.</p>`;
			sortear = e.cena % 2 === 0;
			if (!sortear) html += "<p>Use as atividades dos convidados nos cômodos. Na próxima cena, sorteie uma vítima.</p>";
		}
		if (sortear && !e.encerrado) {
			const v = await sortearVitima();
			if (!v) html += "<p>Não há mais vítimas: todos foram substituídos.</p>";
			else {
				e.sorteios += 1;
				let regra;
				if (v === "loranth") regra = 0;
				else {
					const livres = REGRAS.map((x, i) => i).filter((i) => !e.regras.includes(i));
					for (let i = 0; i < 40 && regra === undefined; i++) {
						const r = (await rolar("1d10")) - 1;
						if (!livres.length || livres.includes(r)) regra = r;
					}
					regra ??= livres[0] ?? 0;
				}
				e.regras = [...new Set([...e.regras, regra])];
				html += `<p>Vítima em risco: <b>${NOMES[v]}</b>${v === "drekaag" ? " (a primeira vítima é sempre ele)" : ""}.</p><p>Regra quebrada: <b>${REGRAS[regra]}</b></p>`;
				if (regra === 0 && v !== "loranth") html += "<p>Loranth está envolvido de alguma forma.</p>";
				if (regra === 3) {
					if (v === "archibald") html += "<p>Com Archibald, a proposta é uma <b>brincadeira cruel</b> de outro nobre.</p>";
					else {
						const par = await sortearVitima([v, "drekaag"]);
						html += par ? `<p>Os dois morrem: o par é <b>${NOMES[par]}</b> (ou faça o \"parceiro\" ser um replicoide).</p>` : "";
					}
				}
				const assassino = e.mortos.length ? `o ${linkRep(e.mortos[e.mortos.length - 1])}` : "Lakshrimi (disfarçada de Alfraye), trazendo o replicoide";
				html += `<p style="font-size:0.85em">Quem mata: ${assassino}. Seguir até a sala mágica: Investigação, Nobreza ou Religião CD 30 (+5 por ter visto a passagem). Sem demora: vivo; 2+ rodadas: o corpo; mais de 1 minuto: substituído. Use <i>Convidado foi morto</i> para registrar.</p>`;
			}
		}
		await game.user.setFlag("world", CHAVE, e);
		ChatMessage.create({ content: `<h3>Baile da Primavera</h3>${html}`, rolls, whisper: gm });
	}

	async function macroPassagens() {
		const COMODOS = { A: "Hall de Entrada", B: "Átrio", C: "Chapelaria", D: "Salão Principal", E: "Salão de Banquete", F: "Adega", G: "Cozinha Principal", H: "Lavabo Principal", I: "Sacada Interna", J: "Jardim Interno", K: "Salão de Música", L: "Bastidores", M: "Biblioteca", N: "Estufa", O: "Galeria de Arte", P: "Cassino", Q: "Capela", R: "Sala de Troféus" };
		const SALAS = { m1: "Ateliê da Inspiração (M1)", m2: "Calor do Coração (M2)", m3: "Ninho de Prazer (M3)", m4: "Santuário da Esperança (M4)" };
		const QUATRO = { 1: "m1", 2: "m2", 3: "m3", 4: "m4" };
		const PASSAGENS = { B: { 1: "m2" }, C: { 1: "m1" }, D: QUATRO, E: { 1: "m1", 2: "m2", 3: "m2", 4: "m3", 5: "m3", 6: "m4" }, F: QUATRO, I: { 1: "m4" }, K: { 1: "m1" }, M: { 1: "m1", 2: "m3", 3: "m4" }, N: QUATRO, O: QUATRO, P: QUATRO, Q: QUATRO, R: QUATRO };
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Passagens Secretas do Palácio" },
			content: `<div class="form-group"><label>Cômodo</label><select name="comodo">${Object.entries(COMODOS).map(([k, n]) => `<option value="${k}">${k} · ${n}</option>`).join("")}</select></div>
				<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="procurar">Personagem selecionado procura uma passagem (CD 30)</option>
					<option value="npc">Sortear a passagem que um convidado usa (sem teste)</option></select></div>
				<div class="form-group"><label>Perícia</label><select name="pericia"><option value="inve">Investigação</option><option value="nobr">Nobreza</option><option value="reli">Religião</option></select></div>
				<div class="form-group"><label>Viu alguém usar esta passagem (+5)</label><input type="checkbox" name="viu"></div>
				<div class="form-group"><label>Devoto de Marah (+2)</label><input type="checkbox" name="devoto"></div>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const origem = res.comodo in COMODOS ? res.comodo : "D";
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r.total; };
		let html = `<h3>Passagens · ${COMODOS[origem]}</h3>`;
		if (res.acao === "procurar") {
			const tk = canvas.tokens.controlled[0];
			if (!tk?.actor) return ui.notifications.warn("Selecione quem procura a passagem.");
			const pericia = ["inve", "nobr", "reli"].includes(res.pericia) ? res.pericia : "inve";
			const total = await rolar(`1d20 + ${Number(tk.actor.system.pericias?.[pericia]?.value) || 0}${res.viu ? " + 5" : ""}${res.devoto ? " + 2" : ""}`);
			html += `<p>${tk.name} gasta uma ação completa: <b>${total}</b> contra CD 30. ${total >= 30 ? "Encontrou uma passagem!" : "Não encontrou; só pode tentar de novo com alguma informação nova sobre esta passagem."}</p>`;
			if (total < 30) return ChatMessage.create({ content: html, rolls });
		}
		let sala = null;
		if (origem === "J") sala = QUATRO[await rolar("1d4")];
		else if (PASSAGENS[origem]) sala = PASSAGENS[origem][await rolar("1d6")] ?? null;
		if (!PASSAGENS[origem] && origem !== "J") html += "<p>Este cômodo não tem passagens mágicas.</p>";
		else if (!sala) html += "<p>A passagem não leva a lugar nenhum desta vez.</p>";
		else {
			html += `<p>A passagem leva a: <b>${SALAS[sala]}</b>${origem === "J" ? " (no jardim interno, também pode ir a qualquer sala já aberta)" : ""}.</p>`;
			const letras = Object.keys(COMODOS);
			const saida = async () => {
				const d = await rolar("1d20");
				if (d <= 18) return [letras[d - 1]];
				if (d === 20) return ["*"];
				return [...(await saida()), ...(await saida())];
			};
			const saidas = [...new Set(await saida())];
			const txt = saidas.map((s) => (s === "*" ? "qualquer cômodo, à escolha do personagem" : s === origem ? `só de volta para ${COMODOS[s]}` : `${COMODOS[s]} (${s})`));
			html += `<p>Saída da sala: ${txt.join(" e ")}.</p>`;
		}
		ChatMessage.create({ content: html, rolls, whisper: res.acao === "npc" ? ChatMessage.getWhisperRecipients("GM") : undefined });
	}

	async function macroComodos() {
		const MASCARAS = { coroa: ["Coroa", "nobr", "enga"], dados: ["Dados", "joga", "reli"], nota: ["Nota musical", "atua", "nobr"], pena: ["Pena", "conh", "refl"], raposa: ["Raposa", "intu", "fort"], rosa: ["Rosa", "dipl", "inti"], serpente: ["Serpente", "enga", "dipl"], urso: ["Urso", "inti", "conh"], vela: ["Vela", "reli", null] };
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Cômodos do Palácio" },
			content: `<div class="form-group"><label>Cômodo</label><select name="acao">
					<option value="atrio">Átrio: Carisma CD 15, +3 PM temporários (primeira visita)</option>
					<option value="mascara">Chapelaria: vestir uma máscara</option>
					<option value="principal">Salão principal: +2 Diplomacia e Investigação, –2 Furtividade e Ladinagem</option>
					<option value="sacada">Sacada interna: +2 Intuição e Percepção</option>
					<option value="lavabo">Lavabo: –2 em Percepção</option>
					<option value="sair">Sair do cômodo (tira os efeitos de lugar)</option>
					<option value="musica">Salão de música: Atuação +5 contra CD 25</option>
					<option value="galeria">Galeria de arte: Sabedoria CD 15 (poder de Marah)</option>
					<option value="capela">Capela: bênção de Marah (+1 Sab e Car)</option>
					<option value="atelie">Ateliê da inspiração: +5 em Atuação e Ofício</option>
					<option value="santuario">Santuário da esperança: PM temporários = nível</option>
					<option value="calor">Calor do coração: Carisma CD 10 dos dois selecionados</option></select></div>
				<div class="form-group"><label>Máscara</label><select name="mascara">${Object.entries(MASCARAS).map(([k, m]) => `<option value="${k}">${m[0]}</option>`).join("")}</select></div>
				<p style="font-size:0.85em">Selecione os personagens. Os efeitos duram até o fim do baile (macro Baile da Primavera).</p>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		if (!tokens.length) return ui.notifications.warn("Selecione os personagens.");
		const ICONE = "systems/tormenta20/icons/magias/santuario.webp";
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r.total; };
		const atr = (a, k) => Number(a.system.atributos?.[k]?.value) || 0;
		const efeito = (a, name, changes, local = false) => a.createEmbeddedDocuments("ActiveEffect", [{
			name, img: ICONE, type: "base",
			flags: { world: { fdtBaile: true, fdtLocal: local } },
			system: { changes: changes.map(([key, value]) => ({ key, value, type: "add", phase: "initial", priority: null })) }
		}]);
		const tirarLocal = async (a) => {
			const ids = a.effects.filter((x) => x.getFlag("world", "fdtLocal")).map((x) => x.id);
			if (ids.length) await a.deleteEmbeddedDocuments("ActiveEffect", ids);
		};
		const linhas = [];
		if (res.acao === "calor") {
			const [x, y] = tokens;
			if (!y) return ui.notifications.warn("Selecione as duas pessoas.");
			const rx = await rolar(`1d20 + ${atr(x.actor, "car")}`);
			const ry = await rolar(`1d20 + ${atr(y.actor, "car")}`);
			const ok = rx >= 10 && ry >= 10;
			linhas.push(`${x.name}: ${rx}; ${y.name}: ${ry} (CD 10). ${ok ? "Despertam sentimentos românticos ou amizade profunda: sabem onde o outro está e recebem +2 em perícias em alcance curto." : "Nada desperta."}`);
			if (ok) for (const t of [x, y]) await efeito(t.actor, `Calor do coração (${t === x ? y.name : x.name})`, [["system.pericias.*.bonus", "2"]]);
		}
		else for (const t of tokens) {
			const a = t.actor;
			const nivel = Number(a.system.attributes?.nivel?.value) || Number(a.system.attributes?.nd) || 1;
			switch (res.acao) {
			case "atrio": {
				if (a.getFlag("world", "fdtAtrio")) { linhas.push(`${t.name}: já visitou o átrio neste baile.`); break; }
				const r = await rolar(`1d20 + ${atr(a, "car")}`);
				await a.setFlag("world", "fdtAtrio", true);
				if (r >= 15) await a.update({ "system.attributes.pm.temp": (Number(a.system.attributes.pm?.temp) || 0) + 3 });
				linhas.push(`${t.name}: Carisma ${r} (CD 15). ${r >= 15 ? "Inspirado: <b>+3 PM temporários</b>." : "Nada."}`);
				break;
			}
			case "mascara": {
				const m = MASCARAS[res.mascara] ?? MASCARAS.coroa;
				const velhas = a.effects.filter((x) => x.name.startsWith("Máscara:")).map((x) => x.id);
				if (velhas.length) await a.deleteEmbeddedDocuments("ActiveEffect", velhas);
				await efeito(a, `Máscara: ${m[0]}`, [[`system.pericias.${m[1]}.bonus`, "2"], m[2] ? [`system.pericias.${m[2]}.bonus`, "-2"] : ["system.modificadores.ataque.geral", "-2"]]);
				linhas.push(`${t.name} veste a máscara <b>${m[0]}</b>.`);
				break;
			}
			case "principal":
				await tirarLocal(a);
				await efeito(a, "No salão principal", [["system.pericias.dipl.bonus", "2"], ["system.pericias.inve.bonus", "2"], ["system.pericias.furt.bonus", "-2"], ["system.pericias.ladi.bonus", "-2"]], true);
				linhas.push(`${t.name} está no salão principal.`);
				break;
			case "sacada":
				await tirarLocal(a);
				await efeito(a, "Na sacada interna", [["system.pericias.intu.bonus", "2"], ["system.pericias.perc.bonus", "2"]], true);
				linhas.push(`${t.name} observa da sacada (e fica em evidência).`);
				break;
			case "lavabo":
				await tirarLocal(a);
				await efeito(a, "No lavabo", [["system.pericias.perc.bonus", "-2"]], true);
				linhas.push(`${t.name} está no lavabo (–2 em Percepção).`);
				break;
			case "sair":
				await tirarLocal(a);
				linhas.push(`${t.name}: sem efeitos de lugar.`);
				break;
			case "musica": {
				const r = await rolar(`1d20 + ${Number(a.system.pericias?.atua?.value) || 0} + 5`);
				linhas.push(`${t.name}: Atuação ${r} (CD 25). ${r >= 25 ? `Pode usar <b>${r}</b> no lugar de um teste de perícia no palácio até o fim do baile.` : "Sem efeito."}${r >= 30 ? " Com um instrumento dos bastidores, ele vira mágico (flauta fantasma)." : ""}`);
				break;
			}
			case "galeria": {
				const r = await rolar(`1d20 + ${atr(a, "sab")}`);
				linhas.push(`${t.name}: Sabedoria ${r} (CD 15). ${r >= 15 ? "Escolhe um <b>poder concedido de Marah</b> para usar até o fim do baile." : "Nada."}`);
				break;
			}
			case "capela":
				if (!a.effects.some((x) => x.name === "Bênção da capela")) await efeito(a, "Bênção da capela", [["system.atributos.sab.bonus", "1"], ["system.atributos.car.bonus", "1"]]);
				linhas.push(`${t.name}: +1 em Sabedoria e Carisma enquanto seguir as obrigações de Marah.`);
				break;
			case "atelie":
				if (!a.effects.some((x) => x.name === "Ateliê da inspiração")) await efeito(a, "Ateliê da inspiração", [["system.pericias.atua.bonus", "5"]]);
				linhas.push(`${t.name}: +5 em Atuação e Ofício (some o +5 de Ofício na rolagem).`);
				break;
			case "santuario":
				await a.update({ "system.attributes.pm.temp": (Number(a.system.attributes.pm?.temp) || 0) + nivel });
				linhas.push(`${t.name}: <b>+${nivel} PM temporários</b> até o fim do baile.`);
				break;
			default:
				break;
			}
		}
		ChatMessage.create({ content: `<h3>Palácio do Coração Florido</h3><ul>${linhas.map((l) => `<li>${l}</li>`).join("")}</ul>`, rolls });
	}

	async function macroAdega() {
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Adega do Palácio" },
			content: `<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="beber">Beber (começar ou continuar nesta cena)</option>
					<option value="parar">Parar de beber</option>
					<option value="manha">Manhã seguinte (acaba a embriaguez)</option></select></div>
				<p style="font-size:0.85em">+5 em Diplomacia enquanto beber. Fortitude CD 15, +2 por teste anterior no baile. As penalidades da embriaguez não valem em Diplomacia.</p>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		if (!tokens.length) return ui.notifications.warn("Selecione quem bebe.");
		const ICONE = "systems/tormenta20/icons/itens/gerais/bebida-comum.webp";
		const rolls = [];
		const linhas = [];
		const ae = (name, changes, extra = {}) => ({ name, img: ICONE, type: "base", flags: { world: { fdtAdega: name } }, ...extra, system: { changes: changes.map(([key, value]) => ({ key, value, type: "add", phase: "initial", priority: null })) } });
		for (const t of tokens) {
			const a = t.actor;
			const tem = (n) => a.effects.find((x) => x.getFlag("world", "fdtAdega") === n);
			if (res.acao === "manha") {
				const ids = a.effects.filter((x) => x.getFlag("world", "fdtAdega")).map((x) => x.id);
				if (ids.length) await a.deleteEmbeddedDocuments("ActiveEffect", ids);
				await a.unsetFlag("world", "fdtTestesAdega");
				if (a.statuses?.has("desprevenido")) await a.toggleStatusEffect("desprevenido", { active: false });
				linhas.push(`${t.name}: sóbrio.`);
				continue;
			}
			if (res.acao === "parar") {
				const b = tem("Bebendo na adega");
				if (b) await b.delete();
				linhas.push(`${t.name} para de beber: perde o +5 em Diplomacia (a embriaguez continua).`);
				continue;
			}
			if (!tem("Bebendo na adega")) await a.createEmbeddedDocuments("ActiveEffect", [ae("Bebendo na adega", [["system.pericias.dipl.bonus", "5"]])]);
			const feitos = Number(a.getFlag("world", "fdtTestesAdega")) || 0;
			const cd = 15 + 2 * feitos;
			const r = await new Roll(`1d20 + ${Number(a.system.pericias?.fort?.value) || 0}`).evaluate();
			rolls.push(r);
			await a.setFlag("world", "fdtTestesAdega", feitos + 1);
			let txt = `${t.name}: Fortitude ${r.total} contra CD ${cd}. `;
			if (r.total >= cd) txt += "Aguenta firme.";
			else if (!tem("Embriagado")) {
				await a.createEmbeddedDocuments("ActiveEffect", [ae("Embriagado", [["system.modificadores.atributos.des", "-2"], ["system.modificadores.atributos.car", "-2"], ["system.pericias.dipl.bonus", "2"]])]);
				txt += "<b>Embriagado</b> (–2 em testes de Destreza e Carisma, exceto Diplomacia) até a manhã seguinte.";
			} else if (!tem("Bebum")) {
				await a.createEmbeddedDocuments("ActiveEffect", [ae("Bebum", [["system.modificadores.atributos.des", "-3"], ["system.modificadores.atributos.car", "-3"], ["system.pericias.dipl.bonus", "3"]])]);
				if (!a.statuses?.has("desprevenido")) await a.toggleStatusEffect("desprevenido", { active: true });
				txt += "<b>Bebum</b>: desprevenido e –5 em testes de Destreza e Carisma (exceto Diplomacia).";
			} else txt += "Já está bebum.";
			linhas.push(txt);
		}
		ChatMessage.create({ content: `<h3>Adega do Palácio</h3><ul>${linhas.map((l) => `<li>${l}</li>`).join("")}</ul>`, rolls });
	}

	async function macroCassino() {
		const APOSTAS = {
			inspiracao: ["Inspiração", "PM máximos –1", [["system.attributes.pm.bonus.total", "-1"]]],
			coracao: ["Coração", "fica enfeitiçado pelo vencedor da mesa", []],
			coragem: ["Coragem", "PV máximos –3", [["system.attributes.pv.bonus.total", "-3"]]],
			talento: ["Talento", "perde uma perícia treinada à escolha", []]
		};
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Cassino dos Sentimentos" },
			content: `<div class="form-group"><label>Aposta</label><select name="aposta">${Object.entries(APOSTAS).map(([k, x]) => `<option value="${k}">${x[0]} (${x[1]})</option>`).join("")}</select></div>
				<p style="font-size:0.85em">Selecione os apostadores (dois ou mais). Cada um rola Jogatina; quem tirar menos perde a aposta e o vencedor ganha o que um perdedor perdeu (mais um para cada vez que multiplicar o valor da aposta, a critério do Mestre). Tudo dura até o fim do baile.</p>`,
			ok: { label: "Apostar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		if (tokens.length < 2) return ui.notifications.warn("Selecione pelo menos dois apostadores.");
		const ap = APOSTAS[res.aposta] ?? APOSTAS.inspiracao;
		const ICONE = "systems/tormenta20/icons/itens/itens-magicos/baralho-do-caos.webp";
		const rolls = [];
		const placar = [];
		for (const t of tokens) {
			const r = await new Roll(`1d20 + ${Number(t.actor.system.pericias?.joga?.value) || 0}`).evaluate();
			rolls.push(r);
			placar.push({ t, total: r.total });
		}
		placar.sort((x, y) => y.total - x.total);
		const [venc, ...perdedores] = placar;
		const ae = (name, changes) => ({ name, img: ICONE, type: "base", flags: { world: { fdtBaile: true } }, system: { changes: changes.map(([key, value]) => ({ key, value, type: "add", phase: "initial", priority: null })) } });
		let html = `<h3>Cassino · aposta de ${ap[0]}</h3><ol>${placar.map((x) => `<li>${x.t.name}: Jogatina ${x.total}</li>`).join("")}</ol><p><b>${venc.t.name}</b> vence a mesa.</p><ul>`;
		for (const x of perdedores) {
			if (ap[2].length) await x.t.actor.createEmbeddedDocuments("ActiveEffect", [ae(`Aposta perdida: ${ap[0]}`, ap[2])]);
			if (res.aposta === "coracao" && !x.t.actor.statuses?.has("enfeiticado")) await x.t.actor.toggleStatusEffect("enfeiticado", { active: true });
			const vezes = Math.max(1, Math.floor(venc.total / Math.max(1, x.total)));
			html += `<li>${x.t.name} perde: ${ap[1]}${res.aposta === "coracao" ? ` (por ${venc.t.name})` : ""}. O vencedor multiplicou a aposta ${vezes}×.</li>`;
		}
		html += "</ul>";
		const ganho = ap[2].map(([k, v]) => [k, String(-Number(v))]);
		if (ganho.length) await venc.t.actor.createEmbeddedDocuments("ActiveEffect", [ae(`Aposta ganha: ${ap[0]}`, ganho)]);
		html += `<p>${venc.t.name} recebe o que um apostador perdeu${ganho.length ? " (efeito aplicado)" : res.aposta === "talento" ? " (uma perícia treinada de um perdedor)" : ""}.</p>`;
		ChatMessage.create({ content: html, rolls });
	}

	async function macroInvestigar() {
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Investigar no Baile" },
			content: `<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="notar">Notar que um convidado foi substituído (Intuição CD 35)</option>
					<option value="falsa">Examinar a falsa Alfraye (contra Enganação +34)</option>
					<option value="seguir">Seguir um convidado sem ser visto (contra Percepção +10)</option>
					<option value="vigiar">Os nobres tentam despistar a vigilância (+20)</option>
					<option value="chegar">Chegar à sala mágica depois de uma vítima</option></select></div>
				<div class="form-group"><label>Detalhes descritos pelo jogador (+2 cada)</label><input type="number" name="detalhes" value="0"></div>
				<div class="form-group"><label>Perícia contra a falsa Alfraye</label><select name="pericia"><option value="intu">Intuição</option><option value="inve">Investigação</option></select></div>
				<div class="form-group"><label>Rodadas de demora (para chegar à sala)</label><input type="number" name="rodadas" value="0"></div>
				<div class="form-group"><label>O convidado é um replicoide</label><input type="checkbox" name="replicoide"></div>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const gm = ChatMessage.getWhisperRecipients("GM");
		if (res.acao === "chegar") {
			const r = Math.max(0, Number(res.rodadas) || 0);
			const txt = r === 0 ? "Sem perder tempo e com sucesso imediato: <b>a vítima está viva</b> e o assassino é pego no ato." : r <= 10 ? "Duas rodadas ou mais: encontram <b>o corpo</b> (o replicoide está tragando o cadáver para o cristal, um ou dois minutos)." : "Mais de um minuto: <b>não há nada</b>. A vítima foi substituída; só o comportamento a denuncia.";
			const msg = r === 1 ? "Uma rodada: decida entre o flagrante e o corpo." : txt;
			return ChatMessage.create({ content: `<h3>Investigar no Baile</h3><p>Demora de ${r} rodada(s). ${msg}</p>`, whisper: gm });
		}
		const tk = canvas.tokens.controlled[0];
		if (!tk?.actor) return ui.notifications.warn("Selecione o personagem.");
		const pv = (k) => Number(tk.actor.system.pericias?.[k]?.value) || 0;
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r.total; };
		let html = "<h3>Investigar no Baile</h3>";
		if (res.acao === "notar") {
			const det = Math.max(0, Number(res.detalhes) || 0);
			const r = await rolar(`1d20 + ${pv("intu")} + ${2 * det}`);
			html += `<p>${tk.name}: Intuição <b>${r}</b> (+${2 * det} por ${det} detalhe(s)) contra CD 35.</p>`;
			html += res.replicoide ? `<p>${r >= 35 ? "<b>Percebe que não é a mesma pessoa!</b>" : "Nada parece errado."}</p>` : "<p>Não é um replicoide: nada de estranho.</p>";
			return ChatMessage.create({ content: html, rolls, whisper: gm });
		}
		if (res.acao === "falsa") {
			const k = res.pericia === "inve" ? "inve" : "intu";
			const r = await rolar(`1d20 + ${pv(k)}`);
			const d = await rolar("1d20 + 34");
			html += `<p>${tk.name}: ${k === "inve" ? "Investigação" : "Intuição"} <b>${r}</b> contra Enganação de Lakshrimi <b>${d}</b>. ${r > d ? "<b>Há algo estranho na duquesa.</b> Ela se recusa a ir até a Alfraye verdadeira." : "Parece a própria Alfraye."}</p>`;
			return ChatMessage.create({ content: html, rolls, whisper: gm });
		}
		if (res.acao === "seguir") {
			const r = await rolar(`1d20 + ${pv("furt")}`);
			const d = await rolar("1d20 + 10");
			html += `<p>${tk.name}: Furtividade <b>${r}</b> contra Percepção do convidado <b>${d}</b>. ${r > d ? "Segue sem ser notado. Lakshrimi e os replicoides só atacam se o herói estiver escondido, invisível ou disfarçado." : "Foi notado: o convidado não vai para onde ia sozinho."}</p>`;
			return ChatMessage.create({ content: html, rolls });
		}
		const r = await rolar(`1d20 + ${pv("perc")}`);
		const d = await rolar("1d20 + 20");
		html += `<p>Os nobres tentam se livrar da vigilância (magia de comunicação, invisibilidade e truques: +20). ${tk.name}: Percepção <b>${r}</b> contra <b>${d}</b>. ${r >= d ? "Não conseguiram despistar." : "<b>Escaparam da vigilância!</b> Quem ficar sozinho vai quebrar alguma regra."}</p>`;
		ChatMessage.create({ content: html, rolls });
	}

	async function macroLakshrimi() {
		const NOMES = { drekaag: "Drekaag", kalyon: "Kalyon", angeliese: "Angeliese", archibald: "Archibald", melynna: "Melynna", loranth: "Loranth", axel: "Axel", irludde: "Irludde" };
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Lakshrimi em Combate" },
			content: `<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="gravacao">Gravação Estridente nos alvos (Vontade CD 32)</option>
					<option value="convidar">Convidar Amigos: replicoides disponíveis</option>
					<option value="explodir">Autodestruição</option></select></div>
				<p style="font-size:0.85em">Gravação: mire as criaturas inteligentes a até 9m. Na primeira vez que Lakshrimi sofre dano.</p>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rep = (k) => game.actors.find((x) => x.getFlag("world", "fdt") === "a2av6" && x.getFlag("world", "fdtRole") === `rep-${k}`);
		if (res.acao === "convidar") {
			const mortos = (game.user.getFlag("world", "fdtBaile")?.mortos ?? []).filter((k) => k in NOMES);
			const naCena = new Set((canvas.scene?.tokens ?? []).map((t) => t.actorId));
			const lista = mortos.map((k) => rep(k)).filter(Boolean).map((a) => `<li>@UUID[${a.uuid}]{${a.name}}${naCena.has(a.id) ? " (já na cena)" : ""}</li>`);
			return ChatMessage.create({
				whisper: ChatMessage.getWhisperRecipients("GM"),
				content: `<h3>Convidar Amigos</h3><p>Ação completa, recarga (movimento). O replicoide surge a até 9m e ataca a partir da próxima rodada. Arraste um para a cena:</p>${lista.length ? `<ul>${lista.join("")}</ul>` : "<p>Nenhum convidado foi substituído: não há replicoides para chamar.</p>"}`
			});
		}
		if (res.acao === "explodir") {
			return ChatMessage.create({ content: "<h3>Autodestruição</h3><p>Capturada ou abaixo de 0 PV, Lakshrimi explode para proteger os segredos do Dr. Vesper. Sobram só pedaços do corpo metálico e fragmentos do cristal rosado.</p>" });
		}
		const alvos = [...game.user.targets].filter((t) => t.actor);
		if (!alvos.length) return ui.notifications.warn("Mire as criaturas atingidas pelo grito.");
		const rolls = [];
		const dano = await new Roll("6d12").evaluate();
		rolls.push(dano);
		let html = `<h3>Gravação Estridente</h3><p>Grito de <b>${dano.total}</b> de dano psíquico num raio de 9m.</p><ul>`;
		for (const t of alvos) {
			const v = await new Roll(`1d20 + ${Number(t.actor.system.pericias?.vont?.value) || 0}`).evaluate();
			rolls.push(v);
			const ok = v.total >= 32;
			const valor = ok ? Math.floor(dano.total / 2) : dano.total;
			const r = await new Roll(`${valor}[psiquico]`).evaluate();
			try { await t.actor.applyDamageV2(r, 1); } catch (err) { console.warn(err); }
			if (!ok && !t.actor.statuses?.has("atordoado")) await t.actor.toggleStatusEffect("atordoado", { active: true });
			html += `<li>${t.name}: Vontade ${v.total}. ${ok ? `Metade (${valor}).` : `${valor} e <b>atordoado</b> por 1 rodada.`}</li>`;
		}
		html += "</ul>";
		ChatMessage.create({ content: html, rolls });
	}

	const macro = (name, img, fn) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Arco 2 · Aventura 6 · gerado por a2-av6-baile-debutantes.js\n(${fn.toString()})();`
	});
	const macros = await Macro.createDocuments([
		macro("Av6 · Baile da Primavera (cenas e vítimas)", ICO.marah, macroBaile),
		macro("Av6 · Passagens Secretas", `${T20I}/magias/teletransporte.webp`, macroPassagens),
		macro("Av6 · Cômodos do Palácio", `${T20I}/magias/bencao.webp`, macroComodos),
		macro("Av6 · Adega do Palácio", `${T20I}/itens/gerais/bebida-comum.webp`, macroAdega),
		macro("Av6 · Cassino dos Sentimentos", `${T20I}/itens/itens-magicos/baralho-do-caos.webp`, macroCassino),
		macro("Av6 · Investigar no Baile", `${PA}/visao-ampla.webp`, macroInvestigar),
		macro("Av6 · Lakshrimi em Combate", ICO.grito, macroLakshrimi)
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
	const conv = (k) => L(atores[k]);

	await JournalEntry.create({
		name: "Arco 2 · Aventura 6 · Baile de Debutantes Sangrento",
		folder: pasta.JournalEntry,
		flags: FLAGS(),
		pages: [
			pagina("Guia do Mestre", `
				<blockquote><p><i>\"Há um assassino serial à solta e ninguém se importa! [...] O Baile da Primavera está cancelado até que alguém tome uma atitude.\"</i> Duquesa Alfraye Oppulak de Trylon e Foltomett. Embaixo, noutra letra: <i>\"Esqueça esse caso! É insolúvel porque é a fantasia de uma nobre desocupada!\"</i> Throgarimm.</p></blockquote>
				<h2>Resumo</h2>
				<p>Nível 10. A vilã é ${L(atores.lakshrimi)}, a teóloga de bordo da Roca, sob o comando de Ghorskander. O plano: no Baile da Primavera, quando a segurança relaxa, matar jovens nobres e trocá-los por golens (<b>replicoides</b>). Dois anos atrás, ${L(atores.alfraye)} viu os corpos dos amigos e ninguém acreditou; ela cancelou o baile e, sem saber, pausou o plano. A aventura simula um filme de terror adolescente: só se resolve com um novo baile.</p>
				<h2>Fases</h2>
				${lista([
					`<b>Fase 0 · Normalidade:</b> ${L(atores.ulnsariann)} e ${L(atores.throgarimm)} contam o caso pela visão deles.`,
					"<b>Fase 1 · Em Busca do Crime:</b> a visita a Alfraye no Castelo Oppulak (Bairro do Recomeço); role uma vez em Encontros em Valkaria no caminho.",
					"<b>Fase 2 · Becos sem Saída:</b> todas as linhas de investigação dão em nada, exceto realizar o baile.",
					"<b>Fase 3 · O Baile da Primavera:</b> a \"masmorra social\" do Palácio do Coração Florido.",
					"<b>Fase 4 · Banho de Sangue:</b> as mortes, as substituições e o confronto.",
					"<b>Fase 5 · Desfecho.</b>"
				])}
				<h2>Macros</h2>
				${lista([
					`${linkMacro("Baile da Primavera")}: conta as cenas e, a cada duas, sorteia vítima e regra quebrada com todas as exceções do livro; registra quem foi substituído e encerra o baile.`,
					`${linkMacro("Passagens")}: procura passagens (CD 30) e sorteia a sala mágica e a saída.`,
					`${linkMacro("Cômodos")}, ${linkMacro("Adega")} e ${linkMacro("Cassino")}: os benefícios de cada cômodo.`,
					`${linkMacro("Investigar")}: notar replicoides, examinar a falsa Alfraye, seguir convidados e chegar à sala mágica a tempo.`,
					`${linkMacro("Lakshrimi")}: Gravação Estridente, Convidar Amigos e autodestruição.`
				])}
				<p>${leiOrdem ? `Lei &amp; Ordem: ${L(leiOrdem)}.` : "Lei &amp; Ordem fica no ator da Aventura 0 (importe o Ato 2 do módulo)."}</p>`, 100),
			pagina("Os Detetives e a Duquesa", `
				<p>\"Esqueçam isso\", diz o elfo. \"Não façam ele começar...\" \"Esse caso, esse caso, sempre esse caso!\", Throgarimm esbraveja.</p>
				<h3>Informações de Ulnsariann e Throgarimm</h3>
				${lista([
					"A família Oppulak faz o Baile da Primavera todo ano no Palácio do Coração Florido. Não aconteceu no ano passado e provavelmente não acontecerá neste.",
					"Alfraye, muito jovem, é a chefe da família: os pais e tios morreram na Guerra Artoniana. Ela decide a data do baile.",
					"Na própria noite do baile, dois anos atrás, ela relatou os crimes. Os detetives entrevistaram todas as \"vítimas\": ninguém relatou nada, exceto a fuga da anfitriã.",
					"Trouxeram a Dra. Zymni para garantir que não eram mortos-vivos; um nobre deixou a mente ser vasculhada. Alfraye não permitiu investigação mágica sobre ela.",
					"Desistiram depois de uma semana, com a aprovação da Xerife Mathilda. Outros detetives tentaram depois e chegaram à mesma conclusão."
				])}
				<h3>O Castelo Oppulak e Alfraye</h3>
				<p>Paredes brancas de mármore, o símbolo de Marah entalhado e salas vazias há anos. Alfraye, descalça e de roupas simples, lê numa poltrona: \"Sou Alfraye, muito prazer! Por favor, me digam que finalmente a Guarda de Valkaria está me levando a sério!\" Criados para improvisar: Erlonis, Poltiarthas, Umitha, Strelin, Bubid, Ghesfar, Dholba.</p>
				<p><b>As supostas vítimas:</b> todas deixaram Valkaria com as famílias, servos e agregados (Investigação ou Nobreza CD 20), como os nobres dos Avatares do Futuro Eterno. Conde Tolassant Hyulligard-Evansser, Marquesa Lyppitt de Delawoff-Urlant, Duque Felcid Juynald Gyloimm Mastradig Volynn Volunn Chrostrarx Waclov, Condessa Nommia Astraberg, Duquesa Quelad de Gthorank e Oxopald e Visconde Phobert do Escudo da Manhã Cristalina de Todos os Deuses.</p>
				<h3>A sequência do último baile</h3>
				${lista([
					"Alfraye discursou e o teto se abriu numa chuva de pétalas. Ao buscar uma bebida da adega, entrou numa passagem mágica e achou <b>Lypitt</b> (sangue élfico) com a garganta cortada. Correu, gritou, e Lypitt estava viva no salão.",
					"<b>Tolassant</b> disse \"já volto\"; <b>Felcid</b> estranhou a demora e foi atrás. Alfraye achou os dois mortos no jardim interno. Chamou Nomnia, bêbada demais para levar a sério; os dois chegaram vivos.",
					"<b>Quelad e Phobert</b> tinham se esgueirado para ficar a sós: mortos num quarto secreto. Na fuga, o cadáver de <b>Nomnia</b> (muito bêbada).",
					"No salão, todos os \"mortos\" estavam vivos. Alfraye fugiu e se trancou no castelo. Meses depois, todas as famílias saíram de Valkaria."
				])}
				<h3>Regras de sobrevivência a filmes de terror</h3>
				<p>Espalhe estes detalhes enquanto Alfraye fala, sem revelar que são \"regras\": a primeira foi a não humana; \"já volto\" e quem foi atrás; a bêbada; o casal que se esgueirou. Eles serão úteis no baile.</p>
				<h3>Interpretando Alfraye</h3>
				<p>Simpática, bondosa, sozinha e desamparada, não chorona nem gótica. Generosa, mas acostumada a aproveitadores (está cercada de proteções contra manipulação). Os jogadores vão chamá-la de \"Airfryer\": não lute contra isso, só garanta que lembrem o nome verdadeiro. Se demonstrarem empatia, ela aceita ser sondada mentalmente.</p>`, 200),
			pagina("Becos sem Saída", `
				<p>Aceite todas as ideias, mas todas chegam ao mesmo resultado: não há nada a descobrir. A aventura só se resolve com um novo Baile da Primavera.</p>
				${lista([
					"<b>As vítimas:</b> as famílias foram embora sem deixar rastro, sem ameaças nem motivo, cada uma por conta própria.",
					"<b>O palácio:</b> fechado e desabitado fora do baile; os servos não viram nada. O palácio muda durante o baile: só o ritual reproduz as condições dos crimes.",
					"<b>Inimigos de Alfraye:</b> nenhum. Os pais morreram em batalha; não há maldição nem pacto.",
					"<b>Investigação mística:</b> o ritual é legítimo e bem documentado; a mente de Alfraye não foi manipulada. O cristal rosado \"engole\" magias como Visão da Verdade.",
					`<b>Os convidados:</b> ${CONVIDADOS.map((c) => conv(c.k)).join(", ")}. Nada liga nenhum deles ao último baile. Archibald é o maior interessado no baile; Drekaag parece suspeito pelo sangue de dragão, mas é pose.`,
					"<b>Os servos:</b> interrogatórios mundanos e mágicos (até falar com deuses) não acham nada: são inocentes."
				])}
				<p>Se alguém concluir que os nobres foram trocados por \"clones\", não desminta: deixe que cheguem ao baile desconfiando de todos.</p>
				<h3>Contingências</h3>
				${lista([
					"<b>Frustração:</b> lembre que vários detetives já tentaram; transforme a fase em \"eliminar o que os NPCs já tentaram\"; resuma as cenas sem resultado; use a pressão da alta sociedade pelo baile; faça uma ideia do grupo apontar o baile como melhor tática.",
					"<b>Por essa eu não esperava:</b> pense bem antes de aceitar uma ideia irrefutável. Lakshrimi aprisionou as almas e mandou os traços dos cadáveres para o espaço entre os Planos (nem o Helladarion sabe); Syvarian não conhecia o plano. Se mesmo assim não houver furo, deixe a ideia funcionar.",
					"<b>Sem convidados:</b> um baile falso não atrai ninguém. A nobreza se ofende, a pressão aumenta e o baile verdadeiro acontece (o clero de Marah pode abrir uma nova \"janela\", já que não houve baile no ano passado)."
				])}`, 300),
			pagina("O que Realmente Aconteceu", `
				<p>Lakshrimi, a navegadora da Roca pelo éter divino, transferiu a mente para um golem anos atrás. O último corpo tem um grande cristal rosado que liga objetos através do éter; Ghorskander o cobriu com pele orgânica idêntica à de Alfraye. Ela apagou a consciência e ficou em animação suspensa entre os Planos, visitada por Ghorskander para atualizar o rosto.</p>
				<p>O ritual do baile acendeu o cristal e a trouxe ao palácio. Sob a bênção de Marah ela não podia ser violenta, mas podia trazer um <b>replicoide</b> (não consciente, imune à bênção) idêntico à vítima. O replicoide mata, traga o corpo para o cristal em um ou dois minutos e toma o lugar. O plano era que cada replicoide matasse o próximo, para sempre.</p>
				<p>A verdadeira Alfraye interrompeu o primeiro. Lakshrimi \"piscou\" para longe com o replicoide e voltou para sumir com o corpo, e passou a noite trazendo os replicoides ela mesma, fugindo da duquesa. Não podia matá-la: a Roca precisa dela para manter o baile. Depois, os replicoides convenceram \"suas\" famílias a seguir os Avatares do Futuro Eterno rumo a Galrasia. Há replicoides prontos para a próxima leva de nobres.</p>
				<p><b>Muito conveniente…</b> Como num slasher, o assassino sempre tem um truque na manga. Se um jogador estranhar a quantidade de coincidências, incentive: é a pista para observar as regras quebradas e a sequência das vítimas.</p>`, 400),
			pagina("O Baile da Primavera", `
				<p>\"Chega mais uma vez a hora de comemorar! [...] Que tenha início o Baile da Primavera!\" O palácio parece de cristal e brilha em luz multicolorida; cada passo e cada taça viram música. Os guardas são cerimoniais (armaduras douradas com flores, espadas cravejadas).</p>
				<h3>Conduzindo o baile</h3>
				${lista([
					"Trate o palácio como uma <b>masmorra social</b>: os jogadores têm o mapa, mas não sabem onde ficam as passagens.",
					"Cada atividade ou interação conta como uma <b>cena</b> (meia hora ou uma hora; até o amanhecer, 12 ou 24 cenas). Se o grupo se dividir, cada jogador faz uma atividade por cena; peça para um jogador controlar a ordem.",
					`A cada duas cenas, role uma vítima e uma regra quebrada (${L(tabVitimas)}, ${L(tabRegras)}; ou a macro ${linkMacro("Baile da Primavera")}).`,
					"Quem morre para de fazer as atividades da lista: é a dica de que foi substituído. Nem toda ida a uma sala mágica termina em morte, e nem toda morte acontece perto dos heróis.",
					"Sem demora e com sucesso imediato, o grupo acha a vítima viva; com 2 ou mais rodadas, o corpo; com mais de um minuto, nada."
				])}
				<h3>Os convidados de honra e suas atividades</h3>
				${lista(CONVIDADOS.map((c) => `${conv(c.k)}: ${BIO_CONVIDADO[c.k].find((t) => t.startsWith("Atividades")) ?? ""}`))}`, 500),
			pagina("O Palácio do Coração Florido", `
				<p><b>${L(itemPorNome("Aura de Paz"))}:</b> nenhuma criatura com Inteligência pode agir com hostilidade, sem teste e sem imunidade para personagens jogadores. Os replicoides são imunes. Acaba quando Alfraye encerra o baile.</p>
				<p><b>Procurar passagens:</b> ação completa e Investigação, Nobreza ou Religião CD 30 (+5 se viu alguém usar a passagem, +2 devoto de Marah). Passou: acha a passagem, mas não sabe para onde vai. ${linkMacro("Passagens")}.</p>
				<h3>Cômodos</h3>
				${lista([
					"<b>A · Hall de Entrada:</b> liga ao átrio. Sem passagens.",
					"<b>B · Átrio:</b> na primeira visita, Carisma CD 15: 3 PM temporários até o fim do baile. Liga a A, C, P, D. Passagem 1d6: 1 calor do coração.",
					`<b>C · Chapelaria:</b> máscaras alegóricas que duram até o fim da festa: ${MASCARAS.map((m) => `${L(itemPorNome(`Máscara Alegórica: ${m[0]}`))} (+2 ${m[3]}, –2 ${m[4]})`).join("; ")}. Liga a B, P, D. Passagem 1d6: 1 ateliê.`,
					"<b>D · Salão Principal:</b> +2 em Diplomacia (para obter informações) e Investigação; –2 em Furtividade e Ladinagem. Liga a B, E, I, J, O. Passagem 1d6: 1 ateliê, 2 calor, 3 ninho, 4 santuário.",
					"<b>E · Salão de Banquete:</b> o benefício de um prato especial à escolha. Liga a G, D, H, F, K. Passagem 1d6: 1 ateliê, 2–3 calor, 4–5 ninho, 6 santuário.",
					`<b>F · Adega:</b> +5 em Diplomacia enquanto beber; Fortitude CD 15 (+2 por teste anterior) a cada cena: embriagado, depois bebum (as penalidades não valem em Diplomacia). ${linkMacro("Adega")}. Liga a G, D, E. Passagem 1d6: 1–4 as quatro salas.`,
					"<b>G · Cozinha Principal:</b> fazendo amizade com os cozinheiros, um segundo prato especial (acumula). Liga a E, F.",
					"<b>H · Lavabo Principal:</b> –2 em Percepção; bom lugar para surpreender alguém. Liga a L, E.",
					"<b>I · Sacada Interna (duas):</b> +2 em Intuição e Percepção observando o salão, mas em evidência. Liga a D. Passagem 1d6: 1 santuário (uma rolagem por sacada).",
					"<b>J · Jardim Interno:</b> liga a D, K, M, N, R e a qualquer sala mágica já aberta, ou 1d4 entre as quatro.",
					`<b>K · Salão de Música:</b> Atuação +5 contra CD 25: o resultado substitui um teste de perícia no palácio. Liga a Q, E, D, L. Passagem 1d6: 1 ateliê.`,
					`<b>L · Bastidores:</b> instrumentos aprimorados; uma vez no baile, Atuação 30+ com um deles no palco: ${L(itemPorNome("Instrumento"))}. Liga a K, H.`,
					"<b>M · Biblioteca:</b> rolar de novo um teste de Int ou Sab feito no dia, com +5 (uma vez por personagem). Liga a O, J. Passagem 1d6: 1 ateliê, 2 ninho (o livro diz \"cofre das artes\"), 3 santuário.",
					`<b>N · Estufa:</b> ${L(itemPorNome("Batatino"))}, para devotos de Marah ou treinados em Sobrevivência. Liga a J, O. Passagem 1d6: 1–4 as quatro salas.`,
					"<b>O · Galeria de Arte:</b> Sabedoria CD 15: um poder concedido de Marah até o fim do baile. Liga a M, N, D, P. Passagem 1d6: 1–4.",
					`<b>P · Cassino:</b> apostas de Inspiração (PM máx. –1), Coração (enfeitiçado pelo vencedor), Coragem (PV máx. –3) ou Talento (uma perícia treinada), em testes de Jogatina. ${linkMacro("Cassino")}. Liga a B, C, O. Passagem 1d6: 1–4.`,
					`<b>Q · Capela:</b> ${L(itemPorNome("Bênção da Capela"))}. Liga a J, K, R. Passagem 1d6: 1–4.`,
					"<b>R · Sala de Troféus:</b> escolhe um interesse romântico verdadeiro: até o próximo baile, Diplomacia para conquistá-lo rola dois dados e usa o melhor. Liga a J, Q. Passagem 1d6: 1–4."
				])}
				<h3>Salas mágicas</h3>
				<p>${L(tabSalas)} e ${L(tabSaida)}. Cada sala é única para o cômodo de acesso e dura uma cena ou enquanto houver alguém dentro. ${L(itemPorNome("Ateliê"))}, ${L(itemPorNome("Calor"))}; no ninho de prazer, cada um pode usar um poder ou perícia treinada do outro até o fim do baile; no santuário da esperança, PM temporários iguais ao nível.</p>`, 600),
			pagina("Banho de Sangue", `
				${lista([
					"A cada duas interações das atividades (ou uma, se longa), uma morte. A primeira é sempre <b>Drekaag</b> (não humano).",
					"Alfraye rolada: role de novo; só morre se sair duas vezes. Loranth: a regra é sempre <i>Usa drogas</i>; se outro rolar <i>Usa drogas</i>, Loranth está envolvido.",
					"<i>Faz sexo</i>: role outra vítima, os dois morrem (ou o \"parceiro\" é um golem). Com Archibald, é uma brincadeira cruel de outro nobre.",
					"Se Drekaag morrer como previsto, o replicoide dele mata a próxima vítima, e assim por diante; o replicoide arranja desculpa para ficar perto da próxima vítima (uma das maiores pistas). Lakshrimi só se esgueira para garantir que tudo dá certo.",
					"Cada vítima e cada regra só valem uma vez (use o bom senso)."
				])}
				<h3>Envolvendo os personagens</h3>
				${lista([
					"<b>Notar a troca:</b> Intuição CD 35, +2 por detalhe que o jogador descrever. A réplica de Loranth não usa substâncias, a de Irludde não fofoca, Archibald perde o interesse em Melynna, Kalyon mostra malícia.",
					"Magias que mostram o passado de um lugar revelam o crime, se o grupo chegar ao local.",
					"<b>Seguir quem quebrou uma regra:</b> Furtividade contra Percepção +10. Ninguém ataca um convidado acompanhado: o herói precisa estar escondido, invisível ou disfarçado.",
					"<b>A falsa Alfraye:</b> Investigação ou Intuição contra a Enganação de Lakshrimi. Ela se recusa a ir até a verdadeira; arrastá-la é impossível durante o baile."
				])}
				<p>Macro: ${linkMacro("Investigar")}.</p>
				<h3>Contingência: os guarda-costas</h3>
				<p>Há mais convidados que heróis, e eles se rebelam contra a vigilância: comunicação mágica, invisibilidade e truques (+20 nas perícias); não se deixam convencer e controle mental falha. Quem fica sozinho quebra alguma regra: role vítimas só entre os vulneráveis (até fora da ordem, até Alfraye primeiro). Se ainda assim o grupo vigiar todos, o baile acaba sem mortes e é preciso outra tática.</p>
				<h3>Contingência: prefiro enfrentar um psicopata</h3>
				<p>Se tudo for complexo demais: relacione cada elemento a um clichê (Alfraye é a última sobrevivente, Archibald o nerd, Axel o valentão, Melynna a popular), assista aos episódios 19 a 24 do Arco 2 da stream ou fixe a ordem das vítimas e das regras, com um mapa mais simples.</p>`, 700),
			pagina("Confronto", `
				<p>Descoberta, Lakshrimi abandona a discrição e ataca com todos os replicoides que já substituíram convidados. Os replicoides não estão sob a bênção, mas os heróis estão: Alfraye decreta o fim do baile (macro ${linkMacro("Baile da Primavera")}). Se Alfraye morreu, o efeito já acabou. Os guardas dos nobres não ajudam e os reforços chegam só depois da luta.</p>
				<blockquote><p>O que antes parecia ser a Duquesa Alfraye arranca a própria pele: por baixo, uma cabeça metálica de golem. <i>\"Vocês são monstros ou apenas idiotas. Preservam as vidas fúteis desses nobres desocupados, enquanto o Dr. Vesper luta pela felicidade de toda a Criação? [...] Têm coragem de desafiar o homem maravilhoso que é Ghorskander?\"</i></p></blockquote>
				<p><b>Criaturas:</b> ${L(atores.lakshrimi)} e os replicoides dos convidados mortos: ${CONVIDADOS.map((c) => L(atores[`rep-${c.k}`])).join(", ")}. Cada replicoide tem um armamento embutido (escolha deste módulo; troque à vontade). Use ${linkMacro("Lakshrimi")}.</p>
				<p>Ela conta tudo: o papel de teóloga (navegadora), a missão de achar o metal arco-íris (odeia os heróis por terem destruído seus esforços nas Colinas Centrais, que considera sagradas), as trocas de corpo e o amor por Ghorskander. Se a aventura for cedo no arco, é a primeira menção a ele. Capturada ou abaixo de 0 PV, <b>explode</b>.</p>`, 800),
			pagina("Desfecho, Provas e Pagamento", `
				<p>Os nobres não são gratos: a Guarda só fez o trabalho dela, e talvez nem lembrem dos nomes. A exceção é Alfraye, tocada por terem acreditado nela (no fim do arco, um item mágico ou benefício especial; antes, favores de influência). Os corpos tragados pelos cristais não podem ser recuperados.</p>
				<h3>Provas</h3>
				${lista([
					`${L(itemPorNome("Pedaço do Corpo"))}.`,
					`${L(itemPorNome("Fragmento"))} (ou um replicoide inteiro).`,
					`${L(itemPorNome("Depoimento"))}.`,
					"O cadáver de uma das vítimas.",
					"O relato de quem viu um cadáver ser tragado para dentro de um cristal."
				])}
				<h3>Pagamento</h3>
				<p>Com Lakshrimi vencida, os assassinatos elucidados e o baile de volta: níveis 8 ou 9, <b>T$ 12.000</b>; nível 10, <b>T$ 24.000</b>; nível 11, <b>T$ 32.000</b>.</p>
				<p>Ulnsariann e Throgarimm viram rivais se o grupo esfregar o caso na cara deles, ou pagam cervejas anãs e vinhos élficos se dividirem o mérito. Se não for a última aventura do arco, o grupo ganha o máximo respeito da Xerife Mathilda até sair de Valkaria.</p>`, 900)
		]
	});

	ui.notifications.info("Fim dos Tempos · Arco 2 · Aventura 6 (Baile de Debutantes Sangrento): conteúdo criado.");
})();
