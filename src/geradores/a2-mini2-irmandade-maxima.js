/* =====================================================================
 * FIM DOS TEMPOS · ARCO 2 · MINI-AVENTURA 2 · "IRMANDADE MÁXIMA"
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Arco 2 · Mini 2 · Irmandade Máxima" com:
 *      - Ameaças: Irmão da Companhia, Bando Desesperado, Arcano Brutal, Replicoide Paollus e o
 *        barril de pólvora; Paollus (o verdadeiro) e Yeremin Blasanov como NPCs de apoio.
 *      - Itens: Paollus como parceiro assassino mestre e o poder Costas com Costas.
 *      - Diário com guia, Paollus bate à porta, o Balé da Morte, a fortaleza e o desfecho.
 *      - Macros: Paollus Bate à Porta, Balé da Morte, Replicoide Paollus, Arcanos Brutais e Desfecho.
 *   3. Torgo é o ator da Aventura 7 e Lei & Ordem é o ator da Aventura 0 (não são recriados aqui).
 *   4. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "a2mini2".
 *
 * Feito a partir do código do sistema (1.6.4, out/2026). Validado no Foundry simulado do
 * módulo giriarpg-fim-dos-tempos; veja o guia a2-mini2-irmandade-maxima.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "a2mini2";
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
			window: { title: "Mini-Aventura 2 do Arco 2: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para a Mini-Aventura 2 do Arco 2.</p>
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
	const NOME_PASTA = "FdT · Arco 2 · Mini 2 · Irmandade Máxima";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#5a2a3a", flags: FLAGS() })).id;
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
	/** Copia um documento de um compêndio do sistema, com a marca deste gerador. */
	async function deCompendio(packId, docId, nome, descExtra, img) {
		const doc = await game.packs.get(packId)?.getDocument(docId).catch(() => null);
		if (!doc) return null;
		const data = doc.toObject();
		delete data._id;
		data.name = nome;
		data.folder = pasta.Item;
		if (img) data.img = img;
		data.flags = foundry.utils.mergeObject(data.flags ?? {}, FLAGS());
		data.system.description.value = `${descExtra}<hr>${data.system.description.value ?? ""}`;
		return data;
	}
	const EQ = `${T20I}/itens/equipamentos`;
	const GE = `${T20I}/itens/gerais`;
	const MG = `${T20I}/magias`;
	const FURTIVO_IMG = "icons/magic/perception/silhouette-stealth-shadow.webp";
	const furtivo = (d) => aoUsar(`Ataque Furtivo (+${d})`, FURTIVO_IMG, [["dano", d]], ["attack"]);
	const ICO = {
		irmao: `${T20I}/ameacas/chefe-bandido.png`,
		bando: `${T20I}/ameacas/falange.png`,
		arcano: `${T20I}/ameacas/hobgoblin-mago-de-batalha.png`,
		replicoide: `${T20I}/ameacas/golem-de-ferro.png`,
		paollus: `${T20I}/racas/humano.webp`,
		yeremin: `${T20I}/racas/humano.webp`,
		barril: `${GE}/bomba.webp`,
		bomba: `${GE}/bomba.webp`,
		espadaCurta: `${EQ}/espada-curta.webp`,
		espadaLonga: `${EQ}/espada-longa.webp`,
		pistola: `${EQ}/pistola.webp`,
		arcoCurto: `${EQ}/arco-curto.webp`,
		pombas: `${GE}/aves.webp`,
		forca: `${GE}/corda.webp`,
		costas: `${EQ}/pistola.webp`
	};

	/* ------------------------------------------------------------------ */
	/* 2. Ameaças                                                           */
	/* ------------------------------------------------------------------ */
	const atores = {};
	atores.irmao = await criarNPC({
		name: "Irmão da Companhia",
		role: "irmao",
		img: ICO.irmao,
		nd: 1,
		cd: 16,
		tipo: "hum",
		raca: "humano",
		papel: "lackey",
		atr: { for: 1, des: 3, con: 0, int: 0, sab: 1, car: 0 },
		pv: 12,
		def: 15,
		walk: 9,
		pericias: { inic: 5, perc: 3, fort: 3, refl: 8, vont: 5, luta: 11, pont: 11, furt: 5, inti: 2 },
		ataquesTxt: "Espada curta +11 (1d6+6, 19).",
		ataquesAdTxt: "Pistola +11 (2d6, 19/x3).",
		equipTxt: "Armadura de couro, balas x20, bomba (1 em 4 irmãos), espada curta, pistola.",
		recursos: { primary: { label: "Bomba (1 em cada 4 irmãos)", value: 0, max: 1 } },
		bio: p("Os mesmos irmãos da Companhia do Arco 1, servindo ao replicoide que tomou o lugar de Paollus. Seis guarnecem as ameias e o portão; 22 estão no interior da fortaleza; 4 ficam no cadafalso, ao lado do Replicoide.",
			"<b>Bomba:</b> só um em cada quatro irmãos carrega. Ponha 1 no recurso <i>Bomba</i> desse token. Um tiro de pistola que erra alguém ao lado de um barril de pólvora pode explodi-lo (macro <i>Balé da Morte</i>)."),
		items: [
			arma("Espada Curta", ICO.espadaCurta, { dano: "1d6+6", tipo: "perfuracao", critM: 19, effects: [furtivo("2d6")] }),
			distancia("Pistola", ICO.pistola, { dano: "2d6", tipo: "perfuracao", critM: 19, critX: 3, alcance: "short", effects: [furtivo("2d6")] }),
			poder("Ataque Furtivo", FURTIVO_IMG, p("Uma vez por rodada, +2d6 contra alvos desprevenidos ou flanqueados (corpo a corpo ou à distância em alcance curto). Marque o aprimoramento na janela de ataque."), { exec: "passive" }),
			poder("Bomba", ICO.bomba, p("<b>Ação completa.</b> Explode num raio de 3m em alcance curto: <b>6d6 de impacto</b> (Reflexos CD 16 reduz à metade). Só um em cada quatro irmãos tem uma."),
				{ exec: "full", alcance: "short", area: "Raio de 3m", save: "Reflexos CD 16 reduz à metade", rolls: [["Impacto", [["6d6", "impacto"]]]] })
		]
	});
	atores.bando = await criarNPC({
		name: "Bando Desesperado",
		role: "bando",
		img: ICO.bando,
		nd: 4,
		cd: 18,
		tipo: "hum",
		raca: "humano (bando)",
		papel: "solo",
		tamanho: "gra",
		tokenSize: 2,
		atr: { for: 2, des: 3, con: 1, int: -1, sab: 0, car: 1 },
		pv: 50,
		def: 15,
		walk: 9,
		pericias: { inic: 7, perc: 4, fort: 5, refl: 7, vont: 2, luta: 19, pont: 19, furt: 5, inti: 4 },
		ataquesTxt: "Espada curta +19 (2d6+4, 19).",
		ataquesAdTxt: "Arco curto +19 (2d6, x3).",
		equipTxt: "Arco curto, armadura de couro, bomba, espada curta, flechas x10.",
		recursos: { primary: { label: "Bombas (1 por cena)", value: 1, max: 1 } },
		bio: p("Os mesmos bandos do Arco 1: escória contratada pelo replicoide, perigosa em números. Dois do lado de fora, oito no interior."),
		items: [
			arma("Espada Curta", ICO.espadaCurta, { dano: "2d6+4", tipo: "perfuracao", critM: 19, effects: [furtivo("4d6")] }),
			distancia("Arco Curto", ICO.arcoCurto, { dano: "2d6", tipo: "perfuracao", critX: 3, alcance: "medium", effects: [furtivo("4d6")] }),
			poder("Ataque em Bando", "icons/svg/sword.svg",
				p("Se um ataque exceder a Defesa do alvo por <b>10 ou mais</b>, causa o <b>dobro</b> do dano. Se <b>errar</b>, ainda causa <b>metade</b> do dano.",
					"Use a rolagem abaixo com a metade do dano (sem crítico) quando o bando errar."),
				{ exec: "passive", rolls: [["Metade (espada, errou)", [["(2d6+4)/2", "perfuracao"]]], ["Metade (arco, errou)", [["(2d6)/2", "perfuracao"]]]] }),
			poder("Ataque Furtivo", FURTIVO_IMG, p("Uma vez por rodada, +4d6 contra alvos desprevenidos ou flanqueados. Marque o aprimoramento na janela de ataque."), { exec: "passive" }),
			poder("Bombas", ICO.bomba, p("<b>Ação completa, uma vez por cena.</b> Raio de 4,5m em alcance curto: <b>12d6 de impacto</b> (Reflexos CD 18 reduz à metade)."),
				{ exec: "full", alcance: "short", area: "Raio de 4,5m", save: "Reflexos CD 18 reduz à metade", rolls: [["Impacto", [["12d6", "impacto"]]]] }),
			poder("Forma Coletiva", "icons/svg/mystery-man.svg",
				p("Imune a efeitos que afetam só uma criatura e não causam dano. Sofre <b>50% a mais</b> de dano de efeitos de área. Quem tem <i>Trespassar</i> e acerta o bando pode fazer um ataque adicional contra ele (uma vez por turno)."),
				{ exec: "passive" })
		]
	});
	atores.arcano = await criarNPC({
		name: "Arcano Brutal",
		role: "arcano",
		img: ICO.arcano,
		nd: 6,
		cd: 24,
		tipo: "hum",
		raca: "humano",
		papel: "solo",
		atr: { for: 2, des: 3, con: 2, int: 6, sab: 1, car: 0 },
		pv: 140,
		pm: 48,
		def: 24,
		walk: 6,
		conjuracao: "int",
		pericias: { inic: 8, perc: 6, fort: 8, refl: 13, vont: 18, conh: 13, guer: 15, mist: 13, luta: 18 },
		resTxt: "Resistência a magia +2.",
		ataquesTxt: "Espada curta +18 (1d6+6, 19).",
		equipTxt: "Espada curta, armadura completa.",
		tesouro: "Padrão.",
		bio: p("Arcanista de armadura pesada a serviço do replicoide. Seis estão no interior da fortaleza. Magias como um arcanista de 6º nível (CD 24, limite de PM 12). A Inteligência já está somada ao dano das magias (Arcano de Batalha).",
			"Macro <i>Arcanos Brutais</i> para o Sopro das Uivantes e o Campo de Força."),
		effects: [
			aoUsar("Resistência a magia (+2)", `${MG}/resistencia-a-energia.webp`, [["roll", 2]], ["skill"], ["Fortitude", "Reflexos", "Vontade"]),
			aoUsar("Salto Dimensional (+5 Reflexos)", `${MG}/salto-dimensional.webp`, [["roll", 5]], ["skill"], ["Reflexos"])
		],
		items: [
			arma("Espada Curta", ICO.espadaCurta, { dano: "1d6+6", tipo: "perfuracao", critM: 19 }),
			poder("Conjurador Brutamontes", `${MG}/armadura-arcana.webp`, p("Lança magias de armadura pesada sem testes de Misticismo. Em todo teste de Misticismo, rola dois dados e usa o melhor."), { exec: "passive" }),
			magia("Campo de Força", `${MG}/campo-de-forca.webp`, p("<b>Reação, 4 PM.</b> Quando sofre dano, recebe <b>RD 30</b> contra esse dano."), { exec: "reaction", custo: 4, circulo: 1, tipoMagia: "arc", escola: "abj" }),
			magia("Névoa", `${MG}/nevoa.webp`, p("<b>Padrão, 3 PM.</b> Nuvem quase sólida de 6m de raio e 6m de altura num ponto em alcance curto. A até 1,5m, camuflagem leve; a partir de 3m, camuflagem total. Criaturas escolhidas pelo arcano enxergam através dela."),
				{ exec: "action", custo: 3, circulo: 1, tipoMagia: "arc", escola: "con", alcance: "short", area: "Nuvem de 6m de raio" }),
			magia("Salto Dimensional", `${MG}/salto-dimensional.webp`, p("<b>Reação, 5 PM.</b> +5 na Defesa e em Reflexos contra um ataque ou efeito prestes a atingi-lo; depois, salta para um espaço adjacente desocupado. O +5 de Reflexos está na janela de rolagem."),
				{ exec: "reaction", custo: 5, circulo: 1, tipoMagia: "arc", escola: "con", effects: [fx("Salto dimensional (+5 Defesa)", `${MG}/salto-dimensional.webp`, [["system.attributes.defesa.bonus", "5"]], { duration: { value: 1, units: "rounds" } })] }),
			magia("Sopro das Uivantes", `${MG}/sopro-das-uivantes.webp`, p("<b>Padrão, 11 PM.</b> Cone de 9m: <b>12d6+6 de frio</b>; Médias ou menores ficam <b>caídas</b> e são empurradas 6m. Batendo numa parede ou objeto sólido, para e sofre +2d6 de impacto. <b>Fortitude CD 24</b> reduz à metade e evita a queda e o empurrão."),
				{ exec: "action", custo: 11, circulo: 3, tipoMagia: "arc", escola: "evo", area: "Cone de 9m", save: "Fortitude CD 24 reduz à metade e evita caído e empurrão", rolls: [["Frio", [["12d6+6", "frio"]]], ["Parede", [["2d6", "impacto"]]]], effects: [cond("Caído")] }),
			magia("Toque Chocante", `${MG}/toque-chocante.webp`, p("<b>Padrão, 11 PM.</b> Um ataque corpo a corpo. Se acertar, além do dano normal, <b>10d8+16 de eletricidade</b>."),
				{ exec: "action", custo: 11, circulo: 3, tipoMagia: "arc", escola: "evo", alcance: "touch", rolls: [["Eletricidade", [["10d8+16", "eletricidade"]]]] })
		]
	});
	atores.replicoide = await criarNPC({
		name: "Replicoide Paollus",
		tokenName: "Paollus",
		role: "replicoide",
		link: true,
		img: ICO.replicoide,
		nd: 9,
		cd: 28,
		tipo: "con",
		papel: "solo",
		atr: { for: 2, des: 5, con: 3, int: 2, sab: 0, car: 3 },
		pv: 340,
		def: 32,
		walk: 9,
		sentidos: ["escuro"],
		pericias: { inic: 15, perc: 8, fort: 20, refl: 15, vont: 10, atle: 10, dipl: 21, enga: 21, furt: 15, ladi: 15, nobr: 20, luta: 27, pont: 27 },
		ic: ["mental"],
		res: { dano: { base: 5 } },
		resTxt: "Evasão, imunidade a efeitos mentais, redução de dano 5.",
		ataquesTxt: "Espada longa +27 ×2 (2d8+8, 19, mais 3d6 de eletricidade).",
		ataquesAdTxt: "Pistola +27 (4d6+18, 19).",
		equipTxt: "Balas ×20, couro batido, pistola.",
		bio: p("O golem criado por Ghorskander que tomou o lugar de Paollus, o irmão mais velho da Companhia dos Irmãos, depois de uma emboscada há mais de um ano. Os outros irmãos nunca desconfiaram: o líder continuava igual, só com atitudes inusitadas. Contratou bandidos medíocres, operou fora da capital e aproximou Syvarian do círculo interno.",
			"Agora quer executar Yeremin Blasanov, de forma semipública, no meio do território da Casa Blasanov, para provocar uma guerra de irmandades. Não tem pudor em sacrificar dezenas de irmãos.",
			"Enganação +31 para se passar por Paollus. Macro <i>Replicoide Paollus</i>."),
		effects: [aoUsar("Disfarce de Paollus (+10 Enganação)", ICO.replicoide, [["roll", 10]], ["skill"], ["Enganação"])],
		items: [
			arma("Espada Longa", ICO.espadaLonga, { dano: "2d8+8", tipo: "corte", critM: 19, extra: [["3d6", "eletricidade"]], desc: p("Dois ataques por ação agredir."), effects: [furtivo("6d6")] }),
			distancia("Pistola", ICO.pistola, { dano: "4d6+18", tipo: "perfuracao", critM: 19, alcance: "short", desc: p("<b>Recarga:</b> ação de movimento."), effects: [furtivo("6d6")] }),
			poder("Armamento Embutido", ICO.pistola, p("Na primeira vez em cada cena em que ataca com a pistola, o alvo fica <b>surpreendido</b> contra esse ataque."), { exec: "passive", effects: [cond("Surpreendido")] }),
			poder("Ataque Furtivo", FURTIVO_IMG, p("+6d6 contra alvos desprevenidos ou flanqueados. Marque o aprimoramento na janela de ataque."), { exec: "passive" }),
			poder("Criar Vulnerabilidade", FURTIVO_IMG, p("<b>Reação.</b> Ao fazer um Ataque Furtivo, pode abrir mão do dano adicional para impor <b>–5 na Defesa</b> do alvo até o fim da cena. Botão no card."),
				{ exec: "reaction", effects: [fx("Vulnerabilidade criada (–5 Defesa)", FURTIVO_IMG, [["system.attributes.defesa.bonus", "-5"]])] }),
			poder("Explorar Capangas", "icons/svg/combat.svg", p("<b>Livre.</b> Escolhe um comandado em alcance médio. O comandado perde a ação padrão nesta rodada e, até o fim da rodada, <b>todos os ataques de Paollus são Ataques Furtivos</b>."), { exec: "free" }),
			poder("Sacrifício Involuntário", "icons/svg/skull.svg", p("<b>Reação.</b> Quando sofre dano ou um efeito negativo, pode sacrificar um comandado em alcance curto que não tenha sido alvo do mesmo efeito: o comandado sofre o efeito no lugar dele."), { exec: "reaction" }),
			poder("Evasão", "icons/svg/wing.svg", p("Passando num teste de Reflexos que reduziria o dano à metade, não sofre dano."), { exec: "passive" })
		]
	});
	atores.barril = await criarNPC({
		name: "Barril de Pólvora",
		role: "barril",
		img: ICO.barril,
		disposition: 0,
		nd: 1,
		cd: 20,
		tipo: "con",
		papel: "special",
		tamanho: "peq",
		atr: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
		pv: 1,
		def: 10,
		walk: 0,
		bio: p("Cinco barris estão espalhados pela fortaleza. Sempre que um ataque de pistola erra um personagem adjacente a um barril, há <b>50% de chance</b> de ele explodir. Pode ser atacado com fogo, tiros de arma de fogo e efeitos semelhantes (Defesa 10, 1 PV); atingido assim, explode.",
			"<b>Explosão:</b> 6d6 de fogo em todos os quadrados adjacentes (Reflexos CD 20 reduz à metade). Macro <i>Balé da Morte</i>."),
		items: [poder("Explosão", ICO.barril, p("<b>6d6 de fogo</b> em todos os quadrados adjacentes. <b>Reflexos CD 20</b> reduz à metade."),
			{ exec: "passive", area: "Quadrados adjacentes", save: "Reflexos CD 20 reduz à metade", rolls: [["Fogo", [["6d6", "fogo"]]]] })]
	});

	/* ---------- apoio ---------- */
	const SEM_FICHA = "<b>Não tem ficha no livro.</b> Este ator existe para o token no mapa e para mostrar aos jogadores.";
	atores.paollus = await criarNPC({
		name: "Paollus, o Irmão Mais Velho", tokenName: "Paollus", role: "paollus", img: ICO.paollus, disposition: 1, link: true, nd: 1, tipo: "hum", raca: "humano (sangue élfico)", papel: "special",
		atr: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 }, pv: 10, def: 10,
		bio: p("O verdadeiro líder da Companhia dos Irmãos. Humano com sangue élfico, durão, com cicatrizes e cabelo oleado para trás; curtido por uma vida de crime. Sujo, cansado e maltrapilho, mas ainda com o orgulho de sua posição no submundo.",
			"Sobreviveu à emboscada há mais de um ano e vive nas sombras, ajudado por poucos irmãos leais. Prático e brutal, ainda que não tão brutal quanto o replicoide. Despreza aventureiros, mas precisa deles.",
			"<b>Como parceiro:</b> assassino mestre, ou o poder <i>Costas com Costas</i>.", SEM_FICHA)
	});
	atores.yeremin = await criarNPC({
		name: "Yeremin Blasanov", role: "yeremin", img: ICO.yeremin, disposition: 0, link: true, nd: 1, tipo: "hum", raca: "humano", papel: "special",
		atr: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 }, pv: 10, def: 10,
		bio: p("Capitão da Casa Blasanov, capturado pela Companhia dos Irmãos. Está num cadafalso no centro da fortaleza, com o pescoço na forca. Se for executado, explode a guerra de irmandades.", SEM_FICHA)
	});
	const torgo = game.actors.find((a) => a.getFlag("world", "fdt") === "a2av7" && a.getFlag("world", "fdtRole") === "torgo");
	const leiOrdem = game.actors.find((a) => a.getFlag("world", "fdtRole") === "leiordem");

	/* ------------------------------------------------------------------ */
	/* 3. Itens                                                             */
	/* ------------------------------------------------------------------ */
	const itemDoc = (d, role) => ({ ...d, folder: pasta.Item, flags: FLAGS(role) });
	const DESC_PARCEIRO = p("<b>Paollus (o verdadeiro) como parceiro:</b> conta como um parceiro <b>assassino mestre</b>. Como alternativa, o personagem pode receber o poder <i>Costas com Costas</i>.");
	const parceiroSistema = await deCompendio("tormenta20.parceiros", "BNhavlxkPCr8P4Vi", "Paollus (Assassino mestre)", DESC_PARCEIRO);
	if (parceiroSistema) parceiroSistema.flags = foundry.utils.mergeObject(parceiroSistema.flags ?? {}, FLAGS("parceiro"));
	const novosItens = [
		parceiroSistema ?? itemDoc(poder("Paollus (Assassino mestre)", `${GE}/parceiros.webp`, DESC_PARCEIRO, { tipo: "geral", subtipo: "Parceiros" }), "parceiro"),
		itemDoc(poder("Costas com Costas", ICO.costas,
			p("O aventureiro e Paollus ficam de costas um para o outro, disparando. <b>Ação completa</b>, abrindo mão do bônus de parceiro assassino de Paollus: faz <b>quatro ataques à distância</b>, cada um contra um alvo diferente (precisa empunhar armas suficientes ou recarregar como ação livre).",
				"Só para quem tem Paollus como parceiro."),
			{ exec: "full", tipo: "geral", subtipo: "Parceiros" }), "costas")
	];
	const itensCriados = await Item.createDocuments(novosItens);
	const itemRole = (role) => itensCriados.find((i) => i.getFlag("world", "fdtRole") === role);

	/* ------------------------------------------------------------------ */
	/* 4. Macros                                                            */
	/* ------------------------------------------------------------------ */

	async function macroPaollus() {
		const CHAVE = "fdtIrmandade";
		const agora = () => Number(game.time?.worldTime) || 0;
		const e = game.user.getFlag("world", CHAVE);
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Paollus Bate à Porta" },
			content: `<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="porta">Batidas na porta: Paollus aparece (iniciar o prazo)</option>
					<option value="proposta">Paollus explica o plano</option>
					<option value="ganho">O que os heróis ganham</option>
					<option value="prazo">Quanto falta para a execução</option></select></div>
				<div class="form-group"><label>Horas até a execução</label><select name="horas"><option value="12">12 (à noite)</option><option value="16">16 (para cair à noite)</option><option value="18">18 (para cair à noite)</option></select></div>
				${e ? `<p>Prazo iniciado: restam cerca de <b>${Math.max(0, Math.ceil((e.fim - agora()) / 3600))} h</b> pelo relógio do mundo.</p>` : ""}`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "porta") {
			const h = Number(res.horas) || 12;
			await game.user.setFlag("world", CHAVE, { inicio: agora(), fim: agora() + h * 3600 });
			return ChatMessage.create({ content: `<h3>Descanso curto</h3><p>Vocês acabaram de chegar em casa. Estão exaustos, feridos, meio atordoados com as últimas revelações... Mas vitoriosos. O primeiro de vocês finalmente senta para descansar quando todos ouvem batidas na porta. Furtivas, rápidas, insistentes.</p>
				<p>À sua frente está um humano com sangue élfico. Um tipo durão, com algumas cicatrizes, cabelo oleado para trás. Já tem certa idade e é curtido por uma vida de crime. Está sujo, cansado, maltrapilho, mas ainda guarda o orgulho de sua posição no submundo da capital.</p>
				<p>Após alguns instantes, vocês o reconhecem. Este é <b>Paollus, o líder da Companhia dos Irmãos</b>.</p>` });
		}
		if (res.acao === "proposta") {
			return ChatMessage.create({ content: `<h3>Paollus</h3><p>Ele senta e coloca os pés sobre a mesa, como se fosse o dono do lugar.</p>
				<blockquote><p>"Se vocês não são idiotas totais, devem ter percebido que a Companhia dos Irmãos vem agindo de forma estranha há mais de um ano. Os sussurros no submundo dizem que 'Paollus enlouqueceu'! Isso é porque não sou mais eu no comando. Fui substituído por uma cópia, algum tipo de golem ou coisa assim! Tentaram me matar, mas consegui fugir. Desde então, vivo escondido, com a ajuda de alguns poucos irmãos que conhecem a verdade e ainda são leais a mim. Mas agora chegou a hora de retomar o controle da irmandade, antes que minha cópia afogue Valkaria em sangue... E vocês vão me ajudar."</p></blockquote>
				<ul><li>A Companhia capturou <b>Yeremin Blasanov</b>, capitão da Casa Blasanov, e vai executá-lo em <b>12 horas</b>.</li>
				<li>A execução é numa fortaleza abandonada em <b>Pura Valkaria</b>, reduto purista clandestino no território dos Blasanov, de forma semipública: para a notícia vazar e a Casa Blasanov revidar.</li>
				<li>O plano: atacar a fortaleza durante a execução, salvar Yeremin e destruir o replicoide e seus capangas. Será um banho de sangue.</li>
				<li>Sem a Casa Blasanov (semanas de negociação) e sem a Guarda: a Xerife Mathilda nunca ajudaria a reinstaurar um criminoso. Tentaria prendê-lo! Aliados de fora, só os mínimos e de total confiança.</li></ul>` });
		}
		if (res.acao === "ganho") {
			return ChatMessage.create({ content: "<h3>O que os heróis ganham</h3><ul><li>Tirar um replicoide do poder.</li><li>Paollus fica devendo <b>um favor a cada um</b>.</li><li>Se a guerra for evitada, uma Valkaria mais estável: as atividades na capital deixam de custar Lei &amp; Ordem.</li></ul><p style=\"font-size:0.85em\">Completar Irmandade Máxima não rende nível nem pagamento.</p>" });
		}
		if (!e) return ui.notifications.warn("O prazo ainda não foi iniciado.");
		const h = (e.fim - agora()) / 3600;
		ChatMessage.create({ whisper: ChatMessage.getWhisperRecipients("GM"), content: `<h3>Prazo da execução</h3><p>${h > 0 ? `Restam <b>${Math.ceil(h)} h</b>. A batalha precisa ser à noite.` : "<b>A hora chegou.</b> A execução começa na fortaleza."}</p>` });
	}

	async function macroBale() {
		const CHAVE = "fdtBaleMorte";
		const e = foundry.utils.mergeObject({ forca: null, yeremin: "preso", barris: 5, pombas: 4 }, game.user.getFlag("world", CHAVE) ?? {}, { inplace: false });
		const rodadaAtual = () => Number(game.combat?.round) || 0;
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Balé da Morte" },
			content: `<p>Yeremin: <b>${e.yeremin}</b>${e.forca !== null && e.yeremin === "enforcando" ? ` (desde a rodada ${e.forca})` : ""} · barris: <b>${e.barris}</b> · bandos de pombas: <b>${e.pombas}</b></p>
				<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="inimigos">Os inimigos na fortaleza</option>
					<option value="forca">O Replicoide puxa a alavanca (começa o enforcamento)</option>
					<option value="rodada">Turno do Replicoide: o enforcamento avança</option>
					<option value="salvar">Yeremin foi salvo (corda cortada, pés sustentados...)</option>
					<option value="tiro">Um tiro de pistola errou alguém ao lado de um barril (50%)</option>
					<option value="barril">Um barril de pólvora explode nos alvos</option>
					<option value="pombas">O selecionado espanta um bando de pombas contra o alvo</option>
					<option value="zerar">Recomeçar a batalha</option></select></div>
				<p style="font-size:0.85em">Para explosões, mire as criaturas adjacentes ao barril. Para as pombas, selecione quem espanta e mire o oponente.</p>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "zerar") {
			await game.user.unsetFlag("world", CHAVE);
			return ui.notifications.info("Balé da Morte recomeçado.");
		}
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r; };
		const alvos = [...game.user.targets].filter((t) => t.actor);
		let html = "<h3>Balé da Morte</h3>";
		const explodir = async () => {
			if (e.barris > 0) e.barris -= 1;
			const dano = await rolar("6d6[fogo]");
			const linhas = [];
			for (const t of alvos) {
				const r = (await rolar(`1d20 + ${Number(t.actor.system.pericias?.refl?.value) || 0}`)).total;
				const metade = r >= 20;
				const total = metade ? Math.floor(dano.total / 2) : dano.total;
				try { await t.actor.applyDamageV2(await new Roll(`${total}[fogo]`).evaluate(), 1); } catch (err) { console.warn(err); }
				linhas.push(`<li>${t.name}: Reflexos ${r}, ${metade ? "metade" : "dano total"} (${total}).</li>`);
			}
			return `<p><b>O barril explode!</b> ${dano.total} de fogo em todos os quadrados adjacentes (Reflexos CD 20 reduz à metade). Restam ${e.barris} barris.</p>${linhas.length ? `<ul>${linhas.join("")}</ul>` : "<p>Mire as criaturas adjacentes para aplicar o dano.</p>"}`;
		};
		if (res.acao === "inimigos") {
			html += `<p><b>Do lado de fora</b> (ameias e portão): 6 irmãos da Companhia e 2 bandos desesperados.</p>
				<p><b>No interior:</b> 22 irmãos da Companhia, 8 bandos desesperados, 6 arcanos brutais e o Replicoide Paollus. No cadafalso, ao lado de Yeremin, o Replicoide e 4 irmãos.</p>
				<p>Um em cada quatro irmãos tem uma bomba. Se o grupo for especialmente eficiente (ou se ainda não o viu neste arco), inclua Torgo.</p>
				<p>Espalhe <b>5 barris de pólvora</b> e <b>4 bandos de pombas</b> pela fortaleza. Não há negociação, nem resgate só com furtividade: é um combate aguerrido, talvez o mais sangrento do arco.</p>`;
		} else if (res.acao === "forca") {
			e.forca = rodadaAtual();
			e.yeremin = "enforcando";
			html += `<p>Ação padrão: o Replicoide puxa a alavanca e o alçapão do cadafalso se abre. <b>Yeremin começa a ser enforcado.</b> Os heróis têm <b>3 rodadas</b>: na terceira, no turno do Replicoide, ele morre.</p>`;
		} else if (res.acao === "rodada") {
			if (e.yeremin !== "enforcando") return ui.notifications.warn(`Yeremin está ${e.yeremin}.`);
			e.passadas = (e.passadas ?? 0) + 1;
			if (e.passadas >= 3) {
				e.yeremin = "morto";
				html += "<p><b>Yeremin Blasanov morre na forca.</b> Uma guerra de irmandades vai explodir em Valkaria (Efeitos de Derrota, mesmo que o Replicoide seja destruído).</p>";
			} else html += `<p>Yeremin se debate na forca: <b>${3 - e.passadas}</b> ${3 - e.passadas === 1 ? "rodada" : "rodadas"} até o turno do Replicoide em que ele morre.</p>`;
		} else if (res.acao === "salvar") {
			e.yeremin = "salvo";
			html += "<p><b>Yeremin está salvo.</b> A guerra de irmandades ainda pode ser evitada, se o Replicoide cair.</p>";
		} else if (res.acao === "tiro") {
			const d = (await rolar("1d100")).total;
			html += `<p>1d100 = ${d}: ${d <= 50 ? await explodir() : "o barril aguenta."}</p>`;
		} else if (res.acao === "barril") {
			html += await explodir();
		} else if (res.acao === "pombas") {
			const tk = canvas.tokens.controlled.find((t) => t.actor);
			const alvo = alvos[0];
			if (!tk || !alvo) return ui.notifications.warn("Selecione quem espanta as pombas e mire o oponente.");
			if (e.pombas <= 0) return ui.notifications.warn("Não sobrou nenhum bando de pombas.");
			e.pombas -= 1;
			await alvo.actor.createEmbeddedDocuments("ActiveEffect", [{
				name: "Pombas! (–5 Defesa e Reflexos)", img: "systems/tormenta20/icons/itens/gerais/aves.webp", type: "base",
				duration: { value: 1, units: "rounds" },
				system: { changes: [
					{ key: "system.attributes.defesa.bonus", value: "-5", type: "add", phase: "initial", priority: null },
					{ key: "system.pericias.refl.bonus", value: "-5", type: "add", phase: "initial", priority: null }
				] }
			}]);
			html += `<p>Ação padrão: ${tk.name} espanta um bando de pombas brancas (justifique: um tiro, um som estridente...). ${alvo.name} sofre <b>–5 em Defesa e Reflexos</b> contra um ataque ou efeito até o próximo turno de ${tk.name}. Restam ${e.pombas} bandos.</p><p style="font-size:0.85em">Se tem pombas brancas no meio de uma cena de ação, é um filme de Hong Kong.</p>`;
		}
		await game.user.setFlag("world", CHAVE, e);
		ChatMessage.create({ content: html, rolls });
	}

	async function macroReplicoide() {
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Replicoide Paollus" },
			content: `<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="explorar">Explorar Capangas (o comandado mirado perde a ação padrão)</option>
					<option value="sacrificio">Sacrifício Involuntário (o comandado mirado sofre no lugar)</option>
					<option value="vulnerabilidade">Criar Vulnerabilidade no alvo (–5 Defesa até o fim da cena)</option>
					<option value="embutido">Armamento Embutido (primeiro tiro da cena: alvo surpreendido)</option>
					<option value="fala">O Replicoide fala</option></select></div>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rep = game.actors.find((a) => a.getFlag("world", "fdt") === "a2mini2" && a.getFlag("world", "fdtRole") === "replicoide");
		const alvo = [...game.user.targets].find((t) => t.actor);
		let html = "<h3>Replicoide Paollus</h3>";
		if (res.acao === "fala") {
			const FALAS = ["\"Irmãos! Quem trouxer a cabeça de um desses heróis vira gêmeo amanhã.\"", "\"Puxem a alavanca. Quero que a Casa Blasanov ouça o pescoço dele quebrar.\"", "\"Eu? Uma cópia? Olhem bem para mim. Eu sou Paollus.\"", "\"Morram por mim, irmãos. É para isso que servem.\""];
			const r = await new Roll(`1d${FALAS.length}`).evaluate();
			return ChatMessage.create({ content: `${html}<p><i>${FALAS[r.total - 1]}</i></p>`, speaker: ChatMessage.getSpeaker({ actor: rep }) });
		}
		if (!alvo) return ui.notifications.warn("Mire o alvo (ou o comandado).");
		const fx = (name, changes) => ({ name, img: "icons/magic/perception/silhouette-stealth-shadow.webp", type: "base", system: { changes: changes.map(([key, value]) => ({ key, value, type: "add", phase: "initial", priority: null })) } });
		if (res.acao === "explorar") html += `<p><b>Livre.</b> ${alvo.name} perde a ação padrão nesta rodada. Até o fim da rodada, <b>todos os ataques do Replicoide são Ataques Furtivos</b> (+6d6: marque na janela de ataque).</p>`;
		if (res.acao === "sacrificio") html += `<p><b>Reação.</b> O Replicoide puxa ${alvo.name} para a frente: o comandado sofre o dano ou efeito no lugar dele. (Só um comandado em alcance curto que não tenha sido alvo do mesmo efeito.)</p>`;
		if (res.acao === "vulnerabilidade") {
			await alvo.actor.createEmbeddedDocuments("ActiveEffect", [fx("Vulnerabilidade criada (–5 Defesa)", [["system.attributes.defesa.bonus", "-5"]])]);
			html += `<p><b>Reação.</b> O Replicoide abre mão do Ataque Furtivo: ${alvo.name} sofre <b>–5 na Defesa</b> até o fim da cena (apague o efeito ao fim da cena).</p>`;
		}
		if (res.acao === "embutido") {
			if (!alvo.actor.statuses?.has("surpreendido")) await alvo.actor.toggleStatusEffect("surpreendido", { active: true });
			html += `<p>A pistola sai do braço do golem: ${alvo.name} fica <b>surpreendido</b> contra este ataque (só na primeira vez em cada cena). Tire a condição depois do ataque.</p>`;
		}
		ChatMessage.create({ content: html });
	}

	async function macroArcanos() {
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Arcanos Brutais" },
			content: `<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="sopro">Sopro das Uivantes nos alvos (11 PM, Fortitude CD 24)</option>
					<option value="campo">Campo de Força (4 PM, RD 30 contra um dano)</option>
					<option value="nevoa">Névoa (3 PM)</option></select></div>
				<div class="form-group"><label>Os alvos batem numa parede (+2d6 de impacto)</label><input type="checkbox" name="parede"></div>
				<p style="font-size:0.85em">Selecione o arcano brutal e mire os alvos.</p>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const tk = canvas.tokens.controlled.find((t) => t.actor?.getFlag("world", "fdtRole") === "arcano") ?? canvas.tokens.placeables.find((t) => t.actor?.getFlag("world", "fdt") === "a2mini2" && t.actor.getFlag("world", "fdtRole") === "arcano");
		if (!tk) return ui.notifications.warn("Não há um Arcano Brutal na cena.");
		const CUSTO = { sopro: 11, campo: 4, nevoa: 3 };
		const pm = Number(tk.actor.system.attributes.pm.value) || 0;
		if (pm < CUSTO[res.acao]) return ui.notifications.warn(`${tk.name} não tem ${CUSTO[res.acao]} PM.`);
		await tk.actor.update({ "system.attributes.pm.value": pm - CUSTO[res.acao] });
		const rolls = [];
		let html = `<h3>${tk.name}</h3>`;
		if (res.acao === "sopro") {
			const alvos = [...game.user.targets].filter((t) => t.actor && t !== tk);
			const dano = await new Roll("12d6+6").evaluate();
			rolls.push(dano);
			const linhas = [];
			for (const t of alvos) {
				const r = await new Roll(`1d20 + ${Number(t.actor.system.pericias?.fort?.value) || 0}`).evaluate();
				rolls.push(r);
				const passou = r.total >= 24;
				let total = passou ? Math.floor(dano.total / 2) : dano.total;
				let extra = "";
				if (!passou) {
					const tam = t.actor.system.tracos?.tamanho ?? "med";
					if (["min", "peq", "med"].includes(tam)) {
						if (!t.actor.statuses?.has("caido")) await t.actor.toggleStatusEffect("caido", { active: true });
						extra = ", <b>caído</b> e empurrado 6m";
						if (res.parede) {
							const pd = await new Roll("2d6").evaluate();
							rolls.push(pd);
							try { await t.actor.applyDamageV2(await new Roll(`${pd.total}[impacto]`).evaluate(), 1); } catch (err) { console.warn(err); }
							extra += ` (bate na parede: +${pd.total} de impacto)`;
						}
					}
				}
				try { await t.actor.applyDamageV2(await new Roll(`${total}[frio]`).evaluate(), 1); } catch (err) { console.warn(err); }
				linhas.push(`<li>${t.name}: Fortitude ${r.total}, ${passou ? "metade" : "dano total"} (${total} de frio)${extra}.</li>`);
			}
			html += `<p><b>Sopro das Uivantes:</b> cone de 9m, ${dano.total} de frio.</p>${linhas.length ? `<ul>${linhas.join("")}</ul>` : "<p>Mire os alvos no cone.</p>"}`;
		}
		if (res.acao === "campo") html += "<p><b>Campo de Força</b> (reação): RD 30 contra este dano. Devolva até 30 PV do dano que acabou de sofrer.</p>";
		if (res.acao === "nevoa") html += "<p><b>Névoa:</b> nuvem de 6m de raio e 6m de altura em alcance curto. Camuflagem leve a até 1,5m, total a partir de 3m; os escolhidos pelo arcano enxergam através.</p>";
		html += `<p>PM: ${tk.actor.system.attributes.pm.value}.</p>`;
		ChatMessage.create({ content: html, rolls });
	}

	async function macroDesfecho() {
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Irmandade Máxima · Desfecho" },
			content: `<div class="form-group"><label>O Replicoide Paollus foi destruído</label><input type="checkbox" name="replicoide"></div>
				<div class="form-group"><label>Yeremin Blasanov foi executado</label><input type="checkbox" name="executado"></div>
				<div class="form-group"><label>Descontar os 2 pontos de Lei &amp; Ordem (se Yeremin morreu)</label><input type="checkbox" name="descontar" checked></div>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const lo = game.actors.find((a) => a.getFlag("world", "fdtRole") === "leiordem");
		let html = `<h3>Irmandade Máxima</h3><p><i>A fortaleza está atapetada de corpos. Fumaça sobe ao céu noturno de Valkaria, enquanto chamas iluminam a escuridão. Nesta noite, um grupo de detetives lutou ao lado de um dos maiores criminosos do mundo... Contra um inimigo que ambos os lados odeiam mais do que um ao outro.</i></p>`;
		if (res.executado) {
			let txt = "";
			if (res.descontar && lo) {
				const v = Number(lo.system.resources?.primary?.value) || 0;
				await lo.update({ "system.resources.primary.value": v - 2 });
				txt = ` Lei &amp; Ordem: ${v} → <b>${v - 2}</b>.`;
			} else if (res.descontar) txt = " (Ator de Lei &amp; Ordem não encontrado: desconte à mão.)";
			html += `<p><b>Efeitos de derrota:</b> uma guerra de irmandades começa em Valkaria. A capital perde <b>2 pontos de Lei &amp; Ordem</b>.${txt} ${res.replicoide ? "O verdadeiro Paollus vai ter que se esforçar muito para restaurar a paz sem perder o respeito de inimigos e comandados." : "Com a derrota total, é só o começo de uma época sanguinolenta para a capital..."}</p>`;
		}
		if (res.replicoide && !res.executado) {
			html += "<p><b>Efeitos de vitória:</b> o verdadeiro Paollus fica devendo <b>um favor a cada aventureiro</b> (aprovado pelo Mestre: dinheiro no negócio de um herói, um item superior não mágico ou informações sobre o submundo).</p><p>Com as irmandades relativamente estáveis, os detetives não precisam trabalhar a cada minuto do dia: <b>realizar uma atividade em Valkaria deixa de consumir 1 ponto de Lei &amp; Ordem</b> (o custo em dinheiro e tempo permanece).</p><p>Paollus pode virar parceiro (assassino mestre, ou o poder Costas com Costas).</p>";
		} else if (res.replicoide) {
			html += "<p>O Replicoide foi destruído e Paollus volta ao poder, mas a guerra explodiu mesmo assim. Paollus ainda fica devendo um favor a cada um; as atividades em Valkaria continuam custando Lei &amp; Ordem até a paz voltar.</p>";
		} else if (!res.executado) {
			html += "<p>O Replicoide sobreviveu, mas Yeremin está vivo: a guerra foi adiada, não evitada. O golem continua no comando da Companhia.</p>";
		}
		await game.user.setFlag("world", "fdtMini2", { replicoide: !!res.replicoide, executado: !!res.executado });
		ChatMessage.create({ content: `${html}<p style="font-size:0.85em">Completar Irmandade Máxima não rende nível nem pagamento.</p>` });
	}

	const macro = (name, img, fn) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Arco 2 · Mini-Aventura 2 · gerado por a2-mini2-irmandade-maxima.js\n(${fn.toString()})();`
	});
	const macros = await Macro.createDocuments([
		macro("Mini 2 · Paollus Bate à Porta", ICO.paollus, macroPaollus),
		macro("Mini 2 · Balé da Morte", ICO.barril, macroBale),
		macro("Mini 2 · Replicoide Paollus", ICO.replicoide, macroReplicoide),
		macro("Mini 2 · Arcanos Brutais", `${MG}/sopro-das-uivantes.webp`, macroArcanos),
		macro("Mini 2 · Desfecho", `${GE}/corda.webp`, macroDesfecho)
	]);
	const linkMacro = (trecho) => {
		const m = macros.find((x) => x.name.includes(trecho));
		return m ? `@UUID[${m.uuid}]{${m.name}}` : trecho;
	};

	/* ------------------------------------------------------------------ */
	/* 5. Diário                                                            */
	/* ------------------------------------------------------------------ */
	const pagina = (name, content, sort) => ({ name, type: "text", sort, text: { content, format: 1 } });
	const lista = (itens) => `<ul>${itens.map((i) => `<li>${i}</li>`).join("")}</ul>`;

	await JournalEntry.create({
		name: "Arco 2 · Mini-Aventura 2 · Irmandade Máxima",
		folder: pasta.JournalEntry,
		flags: FLAGS(),
		pages: [
			pagina("Guia do Mestre", `
				<p><b>Gancho:</b> se os heróis completarem as Aventuras 3 e 6, estão envolvidos com a Companhia dos Irmãos e sabem que pessoas importantes estão sendo substituídas por golens. Assim que completarem as duas, conduza a cena em que ${L(atores.paollus)} os aborda.</p>
				<p><b>Nível presumido:</b> 4 personagens de nível 9. <b>Recompensa:</b> não rende nível nem pagamento, mas há recompensas muito valiosas.</p>
				<h2>Fases</h2>
				${lista([
					"<b>Fase 0 · Acontecimentos nos Bastidores:</b> o replicoide no comando da Companhia.",
					"<b>Fase 1 · Descanso Curto:</b> Paollus bate à porta.",
					"<b>Fase 2 · Balé da Morte:</b> o ataque à fortaleza em Pura Valkaria.",
					"<b>Fase 3 · Desfecho:</b> efeitos de vitória e/ou de derrota."
				])}
				<h2>Criaturas</h2>
				${lista([`${L(atores.irmao)} (ND 1)`, `${L(atores.bando)} (ND 4)`, `${L(atores.arcano)} (ND 6)`, `${L(atores.replicoide)} (ND 9)`, torgo ? `${L(torgo)} (opcional, da Aventura 7)` : "Torgo (opcional; veja a Aventura 7)", `${L(atores.barril)} (elemento da fortaleza)`, `Apoio: ${L(atores.paollus)} e ${L(atores.yeremin)}.`])}
				<h2>Macros</h2>
				${lista([
					`${linkMacro("Porta")}: a cena, a proposta, o que os heróis ganham e o prazo.`,
					`${linkMacro("Balé")}: os inimigos, o enforcamento de Yeremin (3 rodadas), barris de pólvora e pombas.`,
					`${linkMacro("Replicoide")}: Explorar Capangas, Sacrifício Involuntário, Criar Vulnerabilidade, Armamento Embutido e falas.`,
					`${linkMacro("Arcanos")}: Sopro das Uivantes, Campo de Força e Névoa, gastando os PM do arcano.`,
					`${linkMacro("Desfecho")}: efeitos de vitória e de derrota, descontando Lei &amp; Ordem${leiOrdem ? ` de ${L(leiOrdem)}` : ""}.`
				])}`, 100),
			pagina("Fases 0 e 1 · Bastidores e Descanso Curto", `
				<h2>Acontecimentos nos bastidores</h2>
				<p>Valkaria não gira em torno dos heróis. Uma trama paralela é a substituição de pessoas importantes por golens, os replicoides de Ghorskander. Um deles vem abalando as fundações da capital: o que substituiu <b>Paollus</b>, o líder da Companhia dos Irmãos.</p>
				<p>Desde as Colinas Centrais, os heróis ouvem que "Paollus enlouqueceu". A irmandade passou a contratar bandidos medíocres (os capangas que atacaram o Forte Cabeça-de-Martelo), a operar fora da capital (o gog'magogue nas Fazendas Gallobalt), e Syvarian surgiu "do nada" no círculo interno. Quem está no comando não é mais Paollus!</p>
				<p>O verdadeiro sobreviveu a uma emboscada há mais de um ano e vive nas sombras, informado por um ou dois irmãos leais. Esperava o replicoide em terreno aberto, com poucos capangas, para um ataque preciso. Não pode mais esperar: o falso Paollus está prestes a provocar uma guerra contra a <b>Casa Blasanov</b>, que arruinaria as duas irmandades e causaria um massacre.</p>
				<h2>Descanso curto</h2>
				<p>Não dê tempo para os heróis se recuperarem da última missão. Batidas na porta: é Paollus (macro ${linkMacro("Porta")}). A Companhia capturou ${L(atores.yeremin)} e vai executá-lo em <b>12 horas</b>, numa fortaleza abandonada em <b>Pura Valkaria</b>, reduto purista clandestino no território dos Blasanov. A execução será semipública, para que a notícia vaze e a Casa revide.</p>
				<p>Paollus não faz rodeios: é preciso atacar a fortaleza, salvar Yeremin e matar o replicoide e seus capangas, sem a Casa Blasanov e sem a Guarda. Não há tempo para reconquistar a lealdade da irmandade; criminosos nem entenderiam a trama. Ganhos: tirar um replicoide do poder e um favor de Paollus para cada um.</p>`, 200),
			pagina("Fase 2 · Balé da Morte", `
				<p>Os heróis têm 12 horas para se preparar (poções, PM, equipamento). Se isso cair de dia, mude para 16 ou 18 horas: <b>o combate precisa ser à noite</b>. Só o recrutamento é limitado: gente "de fora", só a mínima e de total confiança. <b>A Guarita da Praia não é opção:</b> a Xerife Mathilda não ajudaria a reinstaurar Paollus; tentaria prendê-lo!</p>
				<p>Conduza a jornada rápido, sem Encontros em Valkaria. Na fortaleza, deixe o grupo planejar: infiltração, ataque frontal ou os dois. Mas, uma vez iniciado, o combate é cruel e feroz. Não dá para negociar, desabilitar sem dano ou resgatar só com furtividade.</p>
				<h3>Inimigos</h3>
				${lista([
					`<b>Fora</b> (ameias e portão): 6 ${L(atores.irmao)} e 2 ${L(atores.bando)}.`,
					`<b>Dentro:</b> 22 irmãos, 8 bandos, 6 ${L(atores.arcano)} e o ${L(atores.replicoide)}.`,
					`Opcional: ${torgo ? L(torgo) : "Torgo"}, se o grupo for muito eficiente ou se ele ainda não apareceu no arco.`
				])}
				<h3>Elementos da fortaleza</h3>
				<p><b>5 ${L(atores.barril)}:</b> um tiro de pistola que erra um personagem adjacente tem 50% de chance de explodir o barril: 6d6 de fogo nos quadrados adjacentes (Reflexos CD 20 reduz à metade). Atacados com fogo ou tiros (Defesa 10, 1 PV), explodem.</p>
				<p><b>4 bandos de pombas empoleiradas:</b> ação padrão, justificada (um tiro, um som estridente...), para impor <b>–5 em Defesa e Reflexos</b> a um oponente contra um ataque ou efeito até o próximo turno do personagem (pode ser o de outro). Oponente e pombas em alcance curto. O bando se dispersa. <i>Se tem pombas brancas no meio de uma cena de ação, é um filme de Hong Kong.</i></p>
				<h3>O condenado</h3>
				<p>Yeremin está num cadafalso no centro da fortaleza, com a forca no pescoço; ao lado, o Replicoide e 4 irmãos. Assim que o combate começa, o Replicoide puxa a alavanca (ação padrão). Os heróis têm <b>3 rodadas</b> (cortar a corda, sustentar os pés...): na terceira, no turno do Replicoide, Yeremin morre. Executado, explode a guerra, mesmo que o Replicoide seja destruído: o grupo pode receber os efeitos de vitória e de derrota.</p>
				<p>Macro: ${linkMacro("Balé")}.</p>`, 300),
			pagina("O Replicoide e os Arcanos", `
				<p>${L(atores.replicoide)} (ND 9): 340 PV, RD 5, evasão, imune a efeitos mentais. Espada longa +27 ×2 com 3d6 de eletricidade e pistola +27 (4d6+18), Ataque Furtivo +6d6.</p>
				${lista([
					"<b>Armamento Embutido:</b> no primeiro tiro de pistola da cena, o alvo fica surpreendido.",
					"<b>Criar Vulnerabilidade</b> (reação): troca o Ataque Furtivo por –5 na Defesa do alvo até o fim da cena.",
					"<b>Explorar Capangas</b> (livre): um comandado perde a ação padrão e todos os ataques do Replicoide viram furtivos até o fim da rodada.",
					"<b>Sacrifício Involuntário</b> (reação): um comandado em alcance curto sofre o dano ou efeito no lugar dele.",
					"Enganação +31 para se passar por Paollus."
				])}
				<p>${L(atores.arcano)} (ND 6): arcanista de 6º nível (CD 24) de armadura completa. Campo de Força, Névoa, Salto Dimensional, Sopro das Uivantes (12d6+6 de frio em cone de 9m, caído e empurrão) e Toque Chocante (+10d8+16 de eletricidade).</p>
				<p>Macros: ${linkMacro("Replicoide")} e ${linkMacro("Arcanos")}.</p>`, 400),
			pagina("Fase 3 · Desfecho", `
				<blockquote><p>A fortaleza está atapetada de corpos. Fumaça sobe ao céu noturno de Valkaria, enquanto chamas iluminam a escuridão. Nesta noite, um grupo de detetives lutou ao lado de um dos maiores criminosos do mundo... Contra um inimigo que ambos os lados odeiam mais do que um ao outro.</p></blockquote>
				<p>Aconteça o que acontecer, o resultado deve ser espetacular, com os heróis em risco real e muitos capangas em pedaços.</p>
				<h3>Efeitos de derrota</h3>
				<p>Se Yeremin for executado, começa uma guerra de irmandades: <b>Valkaria perde 2 pontos de Lei &amp; Ordem</b>. Com o Replicoide destruído, o verdadeiro Paollus terá muito trabalho para restaurar a paz; com a derrota total, é só o começo de uma época sanguinolenta.</p>
				<h3>Efeitos de vitória</h3>
				<p>Guerra evitada e Replicoide destruído: Paollus deve <b>um favor a cada aventureiro</b> (aprovado pelo Mestre: dinheiro no negócio de um herói, um item superior não mágico, informações do submundo). A maior recompensa é uma mudança de regra: <b>realizar uma atividade em Valkaria deixa de consumir 1 ponto de Lei &amp; Ordem</b>; o custo em dinheiro e tempo permanece.</p>
				<h3>Paollus como parceiro</h3>
				<p>${L(itemRole("parceiro"))}, ou o poder ${L(itemRole("costas"))}.</p>
				<p>Macro: ${linkMacro("Desfecho")}.</p>
				<h3>Para o futuro</h3>
				<p>Na Aventura 7, aliado ao verdadeiro Paollus, o grupo recebe tudo sobre a localização da Roca e o covil de Vesper.</p>`, 500)
		]
	});

	ui.notifications.info("Fim dos Tempos · Arco 2 · Mini-Aventura 2 (Irmandade Máxima): conteúdo criado.");
})();
