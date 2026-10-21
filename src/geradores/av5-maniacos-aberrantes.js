/* =====================================================================
 * FIM DOS TEMPOS · AVENTURA 5 · "A NOITE DOS MANÍACOS ABERRANTES"
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Av5 · Noite dos Maníacos Aberrantes" com:
 *      - Ameaças: Bandoleiro, Cão do Inferno, Irmão da Companhia, Bando Desesperado,
 *        Syvarian, Torgo, os lefeu (uktril, geraktril, reishid) e os LeBlanc corrompidos.
 *      - Perigos com ficha: Horda de Zumbis (400 PV), Tentáculos Lefeu (200 PV),
 *        Bombardeio, Ygor e os quatro abrigos dos inocentes.
 *      - Atores de apoio: Forte Cabeça-de-Martelo (preparação, paliçada, parceiros).
 *      - Itens: um parceiro para cada NPC da lista do livro, o pergaminho de Syvarian,
 *        o esconderijo de Nadine e o chá de Raguria.
 *      - Diário com guia, recrutamento, preparação, as cinco ondas e os handouts.
 *      - Macros: Noite no Inferno, Aproximação, Preparar o Forte, Treinar Parceiros,
 *        Parceiros, Bombardeio, Horda Zumbi, Tentáculos e Abrigos.
 *   3. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "av5".
 *
 * Feito a partir do código do sistema (master, out/2026); não foi testado num Foundry rodando.
 * Veja o guia av5-maniacos-aberrantes.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "av5";
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
			window: { title: "Aventura 5: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para a Aventura 5.</p>
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
	/* 1. Construtores (mesmos das Av2 a Av4)                                */
	/* ------------------------------------------------------------------ */
	const NOME_PASTA = "FdT · Av5 · Noite dos Maníacos Aberrantes";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#5a2a4a", flags: FLAGS() })).id;
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


	/** Copia uma ameaça do compêndio do sistema, com a marca da Av5. */
	const clonarAmeaca = async (id, nome, o = {}) => {
		const doc = await game.packs.get("tormenta20.ameacas")?.getDocument(id).catch(() => null);
		if (!doc) return null;
		const data = doc.toObject();
		delete data._id;
		data.name = nome;
		data.folder = pasta.Actor;
		data.flags = foundry.utils.mergeObject(data.flags ?? {}, FLAGS(o.role));
		data.prototypeToken.name = o.tokenName ?? nome;
		data.prototypeToken.actorLink = false;
		if (o.disposition !== undefined) data.prototypeToken.disposition = o.disposition;
		data.system.detalhes ??= {};
		data.system.detalhes.biography ??= { value: "", public: "" };
		data.system.detalhes.biography.value = `${o.bio ?? ""}<hr>${data.system.detalhes.biography.value ?? ""}`;
		if (o.ic) data.system.tracos.ic.value = [...new Set([...(data.system.tracos.ic.value ?? []), ...o.ic])];
		const actor = await Actor.create(data);
		if (o.res) {
			const up = {};
			for (const [tipo, r] of Object.entries(o.res)) for (const [campo, v] of Object.entries(r)) up[`system.tracos.resistencias.${tipo}.${campo}`] = v;
			await actor.update(up);
		}
		return actor;
	};

	// Imunidades de lefeu e de mortos-vivos da Tormenta.
	const RES_LEFEU = { acido: { imunidade: true }, eletricidade: { imunidade: true }, fogo: { imunidade: true }, frio: { imunidade: true }, luz: { imunidade: true }, trevas: { imunidade: true } };
	const IC_LEFEU = ["cansaco", "metabolismo", "metamorfose", "veneno", "paralisado"];

	/* ------------------------------------------------------------------ */
	/* 2. Ameaças                                                           */
	/* ------------------------------------------------------------------ */
	const atores = {};
	const furtivo = (d) => aoUsar(`Ataque Furtivo (+${d})`, "icons/magic/perception/silhouette-stealth-shadow.webp", [["dano", d]], ["attack"]);

	atores.bandoleiro = await criarNPC({
		name: "Bandoleiro de Syvarian",
		tokenName: "Bandoleiro",
		role: "bandoleiro",
		img: `${T20I}/ameacas/bandido.png`,
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
		bio: p("Mesma ficha da Aventura 4 (o livro manda usar a página 122). Escória das estradas e sarjetas de Deheon, Zakharov e Ahlen, apavorada com a Tormenta. Capturados, revelam tudo o que sabem (testes sociais opostos contra Intuição ou Vontade).",
			"<b>Na paliçada:</b> leva 3 rodadas para escalar e fica desprevenido (–5 na Defesa) enquanto escala. Adjacente à paliçada, fica 4 rodadas sem agir e abre um buraco de 4 quadrados (cada colega a mais tira 1 rodada, mínimo 1)."),
		effects: [chave("Escalando a paliçada (desprevenido)", "icons/svg/falling.svg", [["system.attributes.defesa.bonus", "-5"]], false, "3 rodadas para escalar; –5 na Defesa enquanto isso.")],
		items: [
			arma("Espada Longa", `${T20I}/itens/equipamentos/espada-longa.webp`, { dano: "1d8+2", tipo: "corte", critM: 19, effects: [furtivo("1d6")] }),
			distancia("Besta Leve", `${T20I}/itens/equipamentos/besta-leve.webp`, { dano: "1d8+2", tipo: "perfuracao", critM: 19, alcance: "medio", effects: [furtivo("1d6")] }),
			poder("Ataque Furtivo", "icons/magic/perception/silhouette-stealth-shadow.webp",
				p("Uma vez por rodada, +1d6 contra alvos desprevenidos ou flanqueados (corpo a corpo ou à distância em alcance curto). Marque o aprimoramento na janela de ataque."), { exec: "passive" })
		]
	});

	atores.cao = await criarNPC({
		name: "Cão do Inferno",
		role: "cao",
		img: `${T20I}/ameacas/cao-do-inferno.png`,
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
		tesouro: "1d4 doses de essência abissal (CD 17 para extrair).",
		recursos: { primary: { label: "Sopro carregado", value: 1, max: 1 } },
		bio: p("Mesma ficha da Aventura 4. Na 1ª onda, um cão entra por abertura na paliçada no início de cada rodada (até 4).",
			"<b>Mesa original:</b> o autor cortou os PV dos cães pela metade (47) para a luta não se arrastar. Se quiser fazer o mesmo, edite os PV no token.",
			"<b>RD 10/mágico:</b> a ficha usa RD 10 geral; contra ataques mágicos, devolva os 10 PV à mão."),
		items: [
			arma("Mordida", "icons/creatures/abilities/mouth-teeth-long-red.webp", { dano: "2d6+6", tipo: "perfuracao", extra: [["2d6", "fogo"]] }),
			poder("Sopro Infernal", "icons/creatures/abilities/dragon-fire-breath-orange.webp",
				p("<b>Ação padrão.</b> Cone de 6m: <b>4d6+4 de fogo</b> (Reflexos CD 17 reduz à metade). <b>Recarga:</b> ação de movimento (recurso <i>Sopro carregado</i>)."),
				{ exec: "action", area: "Cone de 6m", save: "Reflexos CD 17 reduz à metade", rolls: [["Fogo", [["4d6+4", "fogo"]]]] })
		]
	});

	atores.irmao = await criarNPC({
		name: "Irmão da Companhia",
		role: "irmao",
		img: `${T20I}/ameacas/chefe-bandido.png`,
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
		bio: p("Membros de verdade da Companhia dos Irmãos, a irmandade de Valkaria onde Syvarian é capitão. São os únicos atacantes que já eram da Companhia (os de pistola). Na 4ª onda, um deles procura os abrigos dos aldeões (Percepção CD 20).",
			"<b>Bomba:</b> só um em cada quatro irmãos carrega. Ponha 1 no recurso <i>Bomba</i> desse token."),
		items: [
			arma("Espada Curta", `${T20I}/itens/equipamentos/espada-curta.webp`, { dano: "1d6+6", tipo: "perfuracao", critM: 19, effects: [furtivo("2d6")] }),
			distancia("Pistola", `${T20I}/itens/equipamentos/pistola.webp`, { dano: "2d6", tipo: "perfuracao", critM: 19, critX: 3, alcance: "curto", effects: [furtivo("2d6")] }),
			poder("Ataque Furtivo", "icons/magic/perception/silhouette-stealth-shadow.webp",
				p("Uma vez por rodada, +2d6 contra alvos desprevenidos ou flanqueados (corpo a corpo ou à distância em alcance curto). Marque o aprimoramento na janela de ataque."), { exec: "passive" }),
			poder("Bomba", `${T20I}/itens/gerais/bomba.webp`,
				p("<b>Ação completa.</b> Explode num raio de 3m em alcance curto: <b>6d6 de impacto</b> (Reflexos CD 16 reduz à metade). Só um em cada quatro irmãos tem uma."),
				{ exec: "full", alcance: "short", area: "Raio de 3m", save: "Reflexos CD 16 reduz à metade", rolls: [["Impacto", [["6d6", "impacto"]]]] })
		]
	});

	atores.bando = await criarNPC({
		name: "Bando Desesperado",
		role: "bando",
		img: `${T20I}/ameacas/falange.png`,
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
		bio: p("Os últimos bandos da 4ª onda: escória que foge assim que o perigo fica grande demais, mas perigosa em números. Seis bandos, liderados por irmãos da Companhia.",
			"Só passam por buracos na paliçada. Sem buracos, cada unidade causa 2 pontos de dano por rodada à paliçada. Atacam os abrigos dos aldeões depois que um irmão os encontra."),
		items: [
			arma("Espada Curta", `${T20I}/itens/equipamentos/espada-curta.webp`, { dano: "2d6+4", tipo: "perfuracao", critM: 19, effects: [furtivo("4d6")] }),
			distancia("Arco Curto", `${T20I}/itens/equipamentos/arco-curto.webp`, { dano: "2d6", tipo: "perfuracao", critX: 3, alcance: "medio", effects: [furtivo("4d6")] }),
			poder("Ataque em Bando", "icons/svg/sword.svg",
				p("Se um ataque exceder a Defesa do alvo por <b>10 ou mais</b>, causa o <b>dobro</b> do dano. Se <b>errar</b>, ainda causa <b>metade</b> do dano.",
					"Use a rolagem abaixo com a metade do dano de espada (sem crítico) quando o bando errar."),
				{ exec: "passive", rolls: [["Metade (espada, errou)", [["(2d6+4)/2", "perfuracao"]]], ["Metade (arco, errou)", [["(2d6)/2", "perfuracao"]]]] }),
			poder("Ataque Furtivo", "icons/magic/perception/silhouette-stealth-shadow.webp",
				p("Uma vez por rodada, +4d6 contra alvos desprevenidos ou flanqueados. Marque o aprimoramento na janela de ataque."), { exec: "passive" }),
			poder("Bombas", `${T20I}/itens/gerais/bomba.webp`,
				p("<b>Ação completa, uma vez por cena.</b> Raio de 4,5m em alcance curto: <b>12d6 de impacto</b> (Reflexos CD 18 reduz à metade)."),
				{ exec: "full", alcance: "short", area: "Raio de 4,5m", save: "Reflexos CD 18 reduz à metade", rolls: [["Impacto", [["12d6", "impacto"]]]] }),
			poder("Forma Coletiva", "icons/svg/mystery-man.svg",
				p("Imune a efeitos que afetam só uma criatura e não causam dano (como <i>Raio do Enfraquecimento</i>). Sofre <b>50% a mais</b> de dano de efeitos de área. Quem tem <i>Trespassar</i> e acerta o bando pode fazer um ataque adicional contra ele (uma vez por turno)."),
				{ exec: "passive" })
		]
	});

	atores.syvarian = await criarNPC({
		name: "Syvarian, Oficial de Segurança da Roca",
		tokenName: "Syvarian",
		role: "syvarian",
		link: true,
		img: `${T20I}/ameacas/goblin-engenhoqueiro.png`,
		nd: 5,
		cd: 20,
		tipo: "hum",
		raca: "kliren",
		papel: "solo",
		atr: { for: 1, des: 4, con: 3, int: 5, sab: 2, car: 1 },
		pv: 180,
		def: 25,
		walk: 6,
		pericias: { inic: 10, perc: 9, fort: 12, refl: 13, vont: 9, luta: 17, pont: 17, atle: 5, furt: 7, pilo: 10 },
		ic: ["atordoado"],
		res: { dano: { base: 5 }, impacto: { danoPorDado: true } },
		resTxt: "Imune a atordoamento e a efeitos que dependam de respiração; redução de dano 5. Ossos frágeis: +1 de dano por dado de impacto.",
		ataquesTxt: "Serra giratória +17 (2d6+9, 19/x3).",
		ataquesAdTxt: "Lançador de arpão +17 (1d12+4, x3, alcance médio).",
		equipTxt: "Escafandro, serra giratória, lançador de arpão, granada sônica x3.",
		tesouro: "As armas e o escafandro só ele sabe usar. Desmontados: T$ 1.000 em matéria-prima para armas, armaduras e engenhocas (todos num mesmo item: –5 na CD de Ofício armeiro).",
		recursos: { primary: { label: "Granadas sônicas", value: 3, max: 3 }, secondary: { label: "Arpão carregado", value: 1, max: 1 } },
		bio: p(
			"Oficial de segurança da Roca, fanático pelo Dr. Vesper, a quem vê como um deus. Incitou o assassinato da capitã. Em Valkaria virou capitão (\"gêmeo\") da Companhia dos Irmãos. Despreza os criminosos que comanda.",
			"Usa um escafandro completo; tira o elmo e revela o rosto anguloso com um <b>relógio na testa</b>. Sua voz se projeta magicamente como um trovão.",
			"Capturado, morre pelos implantes antes de revelar mais sobre o plano do Dr. Vesper.",
			"<b>Forma Final:</b> com 60 PV ou menos, ligue o efeito <i>Forma Final</i> e use só as <i>Pancadas de Tentáculo</i>; dispare a <i>Transformação Enlouquecedora</i> nos alvos que virem."
		),
		effects: [
			chave("Forma Final (monstro)", "icons/creatures/claws/claw-bear-paw-swipe-red.webp", [], false,
				"Reduzido a 60 PV ou menos: vira monstro, ganha tentáculos e perde todos os outros ataques e habilidades. Use as Pancadas de Tentáculo.")
		],
		items: [
			arma("Serra Giratória", "icons/svg/sword.svg", { dano: "2d6+9", tipo: "corte", critM: 19, critX: 3,
				desc: p("Rola <b>dois d20</b> e usa o melhor (já automático). Se exceder a Defesa do alvo por 10 ou mais, <b>+2d6</b> de dano: marque o aprimoramento."),
				effects: [
					fx("Serra giratória (dois d20)", "icons/svg/sword.svg", [["ataque", "kh", "custom"]], { onuse: true, disabled: true, transfer: true, types: ["attack"], automatic: true }),
					aoUsar("Serra: excedeu a Defesa por 10 (+2d6)", "icons/svg/sword.svg", [["dano", "2d6"]], ["attack"])
				] }),
			distancia("Lançador de Arpão", "icons/svg/target.svg", { dano: "1d12+4", tipo: "perfuracao", critX: 3, alcance: "medio",
				desc: p("O alvo atingido é <b>empurrado 4,5m</b> para trás (Fortitude CD 20 evita). Se bater num objeto, fica <b>imóvel</b>, preso pelo arpão; ação padrão e Força CD 15 para se soltar.",
					"<b>Recarregar:</b> ação de movimento (recurso <i>Arpão carregado</i>)."),
				effects: [cond("Imóvel")] }),
			poder("Granada Sônica", `${T20I}/itens/gerais/bomba.webp`,
				p("<b>Ação padrão.</b> Um ponto em alcance médio; criaturas a até 3m sofrem <b>4d6 de impacto</b> e ficam <b>atordoadas</b> por 1 rodada (Reflexos CD 20 reduz à metade e evita atordoado). Três granadas."),
				{ exec: "action", alcance: "medium", area: "Raio de 3m", save: "Reflexos CD 20 reduz à metade e evita atordoado", rolls: [["Impacto", [["4d6", "impacto"]]]], effects: [cond("Atordoado")] }),
			poder("Engenhosidade", "icons/svg/clockwork.svg",
				p("<b>Livre, uma vez por rodada.</b> Soma a Inteligência (+5) num teste de perícia (exceto ataque)."),
				{ exec: "free", effects: [aoUsar("Engenhosidade (+5)", "icons/svg/clockwork.svg", [["roll", 5]], ["skill"])] }),
			poder("Evasão Blindada", "icons/svg/shield.svg",
				p("Contra efeitos que permitem Reflexos para reduzir à metade: passar = nenhum dano; falhar = dano normal. Não funciona se estiver imóvel."), { exec: "passive" }),
			poder("Ossos Frágeis", "icons/svg/bones.svg",
				p("Sofre +1 ponto de dano por dado de dano de impacto. A ficha já aplica isso (RD de impacto com \"dano por dado\")."), { exec: "passive" }),
			poder("Forma Final", "icons/creatures/claws/claw-bear-paw-swipe-red.webp",
				p("<b>Reação.</b> Reduzido a 60 PV ou menos, tentáculos brotam do corpo e o escafandro se abre para eles. Vira <b>monstro</b>, perde os outros ataques e habilidades e ganha <b>três pancadas</b> +17 (1d8+9, alcance 3m)."),
				{ exec: "reaction" }),
			arma("Pancadas de Tentáculo (Forma Final)", "icons/creatures/claws/claw-bear-paw-swipe-red.webp", { dano: "1d8+9", tipo: "impacto",
				desc: p("Só na Forma Final: <b>três pancadas</b> por ação, alcance 3m.") }),
			poder("Transformação Enlouquecedora", "icons/magic/control/fear-fright-monster-purple-blue.webp",
				p("Quem testemunha a transformação fica <b>alquebrado</b> até o fim da cena (Vontade CD 20 evita)."),
				{ exec: "free", save: "Vontade CD 20 evita", durU: "scene", effects: [cond("Alquebrado")] })
		]
	});

	atores.torgo = await criarNPC({
		name: "Torgo, Golem do Dr. Vesper",
		tokenName: "Torgo",
		role: "torgo",
		link: true,
		img: `${T20I}/ameacas/golem-de-ferro.png`,
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
		recursos: { primary: { label: "Olhar Elétrico carregado", value: 1, max: 1 }, secondary: { label: "Fúria (1 por cena)", value: 1, max: 1 } },
		bio: p("Mesma ficha da Aventura 4. Se escapou da Harpia, luta ao lado de Syvarian na 5ª onda. Capturado, morre pelos implantes (ou se autodestrói) antes de revelar algo.",
			"<i>\"Impertinentes! Porcos imundos! Leprosos, sarnentos! Estão sempre dando dor de cabeça! Vão virar picadinho, pra depois darmos de comer para as galinhas!\"</i>"),
		effects: [chave("Fúria de Torgo (+2)", "icons/creatures/claws/claw-bear-paw-swipe-red.webp", [["system.modificadores.ataque.cac", "2"], ["system.modificadores.dano.cac", "2"]], false,
			"Ação de movimento, uma vez por cena. Termina se, ao fim da rodada, não tiver atacado nem sido alvo de efeito hostil.")],
		items: [
			arma("Pancada", `${T20I}/magias/relampago.webp`, { dano: "1d8+6", tipo: "impacto", extra: [["1d6", "eletricidade"]],
				desc: p("<b>Duas pancadas</b> por ação. Acertar uma criatura viva recarrega o Olhar Elétrico."),
				effects: [aoUsar("Carga elétrica (+1d6)", `${T20I}/magias/relampago.webp`, [["dano", "1d6"]], ["attack"])] }),
			poder("Olhar Elétrico", `${T20I}/magias/relampago.webp`,
				p("<b>Movimento.</b> Linha de 1,5m em alcance curto: <b>4d6 de eletricidade</b> (Reflexos CD 20 reduz à metade). Recarga: acertar uma pancada numa criatura viva."),
				{ exec: "move", alcance: "short", area: "Linha de 1,5m", save: "Reflexos CD 20 reduz à metade", rolls: [["Eletricidade", [["4d6", "eletricidade"]]], ["Com carga elétrica", [["5d6", "eletricidade"]]]] }),
			poder("Elemental Elétrico", `${T20I}/magias/relampago-flamejante.webp`,
				p("Dano <b>mágico de eletricidade</b> cura metade em vez de ferir; até o fim do próximo turno, pancadas e Olhar causam +1d6 de eletricidade. Cure à mão (ou com a macro da Av4)."), { exec: "reaction" }),
			poder("Fúria", "icons/creatures/claws/claw-bear-paw-swipe-red.webp",
				p("<b>Movimento, uma vez por cena.</b> +2 em ataque e dano corpo a corpo. Ligue o efeito <i>Fúria de Torgo</i>."), { exec: "move" }),
			poder("Autodestruição", "icons/magic/fire/explosion-fireball-large-red-orange.webp",
				p("Prestes a revelar algo ou preso sem fuga: uma rodada de aviso e explode, <b>8d6 de dano em raio de 6m</b> (o livro não dá tipo nem teste)."),
				{ exec: "free", area: "Raio de 6m", rolls: [["Explosão", [["8d6", ""]]]] })
		]
	});

	/* ---------- Lefeu (copiados do compêndio do sistema) ---------- */
	const BIO_LEFEU = (n) => p(`Lefeu da 4ª onda: Syvarian convoca ${n} em desespero. Escalam a paliçada.`,
		"<b>Insanidade da Tormenta:</b> cada criatura testa uma vez por dia contra o lefeu de maior ND (+1 PM perdido por lefeu além do primeiro).");
	atores.uktril = await clonarAmeaca("a4o3vOZbpJJdoN1N", "Uktril (Formiga Aberrante)", { role: "uktril", tokenName: "Uktril", bio: BIO_LEFEU("5 uktril") });
	atores.geraktril = await clonarAmeaca("BdRSaQ7u74LMUELW", "Geraktril (Formiga Aberrante Maior)", { role: "geraktril", tokenName: "Geraktril", bio: BIO_LEFEU("3 geraktril") });
	atores.reishid = await clonarAmeaca("CvA2wgBaDeyhE23C", "Reishid (Assassino Aberrante)", { role: "reishid", tokenName: "Reishid", bio: BIO_LEFEU("2 reishid") });
	atores.corrompido = await clonarAmeaca("aDJoJf7PgQ33UvNA", "LeBlanc Corrompido (zumbi da Tormenta)", {
		role: "corrompido", ic: IC_LEFEU, res: RES_LEFEU,
		bio: p("<b>04:00.</b> Bastien, Clothilde e Blanche enlouquecem: antenas, patas serrilhadas e carapaça brotam dos olhos, ouvidos e boca. Atacam como zumbis da Tormenta. Não há salvação para os três. Gaspar ataca junto, mas pode ser apaziguado com perícias sociais.",
			"Se os heróis ajudaram os LeBlanc contra a Tormenta e os três foram treinados como parceiros, o jogador responsável faz Vontade CD 20 por cada um; sucesso impede a corrupção.",
			"<b>O livro não dá ficha.</b> Esta é a ficha de Zumbi do sistema com as imunidades dos lefeu acrescentadas (sugestão).")
	});

	/* ---------- Perigos com ficha ---------- */
	atores.horda = await criarNPC({
		name: "Horda de Zumbis da Tormenta (3ª onda)",
		tokenName: "Horda Zumbi",
		role: "horda",
		link: true,
		img: `${T20I}/ameacas/turba-de-zumbis.png`,
		nd: 6,
		cd: 25,
		tipo: "mor",
		papel: "special",
		tamanho: "eno",
		tokenSize: 4,
		atr: { for: 0, des: 0, con: 0, int: -5, sab: 0, car: -5 },
		pv: 400,
		def: 25,
		walk: 6,
		ic: IC_LEFEU,
		res: RES_LEFEU,
		pericias: { fort: 10, refl: 10, vont: 10 },
		resTxt: "Imune a acertos críticos, ácido, cansaço, eletricidade, fogo, frio, luz, paralisia, metabolismo, metamorfose, trevas e veneno. +10 em todos os testes de resistência. Sofre 50% a mais de dano em área.",
		bio: p(
			"<b>Perigo complexo.</b> Objetivo: causar <b>400 pontos de dano</b> à horda (os PV desta ficha). Ataques e ações contra a horda são contra <b>CD 25</b> (a Defesa da ficha).",
			"Com 200 de dano, Syvarian invoca um vislumbre da Tormenta: <b>todas as CDs sobem +5</b> (ligue o efeito <i>Tempestade Rubra</i>). A macro <i>Horda Zumbi</i> faz isso sozinha.",
			"Só entra por buracos na paliçada; sem buracos, ataca a paliçada (+1 de dano por rodada em cada área danificada; intacta, 4 rodadas). Enquanto ataca a paliçada, quem defende não sofre dano por falha.",
			"Dano em área: +50% (aplique com o multiplicador 1,5)."
		),
		effects: [chave("Tempestade Rubra (+5 nas CDs)", "icons/magic/control/fear-fright-monster-purple-blue.webp", [["system.attributes.defesa.bonus", "5"]], false,
			"Ligado quando a horda sofreu 200 de dano: todas as dificuldades da onda sobem +5.")]
	});

	atores.tentaculos = await criarNPC({
		name: "Tentáculos Lefeu (4ª onda)",
		tokenName: "Tentáculos Lefeu",
		role: "tentaculos",
		link: true,
		img: `${T20I}/ameacas/otyugh.png`,
		nd: 5,
		cd: 25,
		tipo: "mon",
		papel: "special",
		tamanho: "gra",
		tokenSize: 2,
		atr: { for: 5, des: 2, con: 4, int: -5, sab: 0, car: -5 },
		pv: 200,
		def: 23,
		walk: 0,
		ic: IC_LEFEU,
		res: RES_LEFEU,
		pericias: { fort: 12, refl: 11, luta: 15 },
		resTxt: "Imunidades de lefeu. Sofrem 50% a mais de dano em área.",
		bio: p(
			"A cada rodada desde que o primeiro lefeu entra no Forte, role 1d4: no 1, os tentáculos surgem do fosso (macro <i>Tentáculos Lefeu</i>).",
			"Área de 6 quadrados (9m) ao redor do poço. Quem entra ou começa o turno ali faz <b>Luta CD 25</b> contra agarrar. Agarrado: <b>2d6 impacto + 2d6 ácido</b> no fim de cada turno; soltar-se com agarrar CD 25.",
			"Cada tentáculo tem Defesa 23, Fort +12, Ref +11 e <b>25 PV</b>: 25 de dano no tentáculo solta a vítima. Os tentáculos somem com <b>200 de dano no total</b> (os PV desta ficha).",
			"Inconsciente na área no fim do turno: puxado 3m para o fosso. Dentro do fosso, o dano dobra e a CD para soltar vira 30.",
			"Parceiros usados dentro da área: o dado de ferimento vira 1d4."
		),
		items: [
			poder("Agarrar dos Tentáculos", "icons/creatures/claws/pincer-crab-red.webp",
				p("Luta CD 25 para resistir. Agarrado: 2d6 de impacto e 2d6 de ácido no fim de cada turno (o dobro dentro do fosso)."),
				{ exec: "free", save: "Luta CD 25 evita", rolls: [["Esmagar e corroer", [["2d6", "impacto"], ["2d6", "acido"]]], ["No fosso (dobro)", [["4d6", "impacto"], ["4d6", "acido"]]]], effects: [cond("Agarrado")] })
		]
	});

	atores.ygor = await criarNPC({
		name: "Ygor, Autômato do Dr. Vesper",
		tokenName: "Ygor",
		role: "ygor",
		link: true,
		disposition: 0,
		img: `${T20I}/itens/gerais/engrenagens.webp`,
		nd: "1/4",
		cd: 25,
		tipo: "con",
		papel: "special",
		tamanho: "min",
		atr: { for: -2, des: 1, con: 0, int: -5, sab: 0, car: -5 },
		pv: 5,
		def: 12,
		walk: 6,
		bio: p(
			"Pequeno autômato que Belinda encontra na oficina às 04:00, \"esquecido\" pelo Dr. Vesper. Na verdade foi deixado de propósito.",
			"<b>Ofício (engenhoqueiro, armeiro ou alquimista) CD 25:</b> é uma bomba ativada à distância, com um artefato parecido com o implante de Vadrinne.",
			"Se não for descoberto, na 5ª onda se ativa (Percepção CD 25 para notar), leva uma rodada para chegar aos heróis e, no turno dos vilões, <b>explode: 8d6 de impacto em raio de 3m</b> (Reflexos CD 25 reduz à metade). Dos destroços surge a imagem do Dr. Vesper.",
			"PV e Defesa da ficha são sugestão (o livro não dá)."
		),
		items: [
			poder("Explosão de Ygor", "icons/magic/fire/explosion-fireball-large-red-orange.webp",
				p("Raio de 3m: <b>8d6 de impacto</b> (Reflexos CD 25 reduz à metade). De preferência não fere Syvarian e Torgo."),
				{ exec: "free", area: "Raio de 3m", save: "Reflexos CD 25 reduz à metade", rolls: [["Impacto", [["8d6", "impacto"]]]] })
		]
	});

	/* ---------- Abrigos dos aldeões (4ª onda) ---------- */
	const ABRIGOS = [["Ponta de Pedra", 300], ["Darandell", 200], ["Placidez", 50], ["Dornbach", 200]];
	atores.abrigos = [];
	for (const [nome, inocentes] of ABRIGOS) {
		atores.abrigos.push(await criarNPC({
			name: `Abrigo · ${nome}`,
			role: "abrigo",
			link: true,
			disposition: 1,
			img: "icons/svg/village.svg",
			nd: "1/4",
			cd: 15,
			tipo: "con",
			papel: "special",
			tamanho: "eno",
			tokenSize: 3,
			atr: { for: 0, des: -5, con: 0, int: -5, sab: -5, car: -5 },
			pv: 100,
			def: 10,
			walk: 0,
			recursos: { primary: { label: "Inocentes vivos", value: inocentes, max: inocentes }, secondary: { label: "Focos de incêndio", value: 0, max: 20 } },
			bio: p(`Prédio onde os não combatentes de ${nome} se abrigam (os jogadores escolhem qual).`,
				"<b>100 PV.</b> Enquanto tiver PV, os inocentes não podem ser atacados. Com 0 PV, os bandoleiros entram e <b>cada ponto de dano mata um inocente</b> (recurso <i>Inocentes vivos</i>).",
				"Tocha: 1d6 de dano e +1 foco de incêndio. Cada foco causa 1d6 de fogo por rodada; os heróis apagam um por vez, ou um efeito de área apaga todos os do prédio. Use a macro <i>Abrigos em Chamas</i>.",
				"A Defesa 10 é sugestão (o livro não dá).")
		}));
	}

	/* ---------- Atores de apoio ---------- */
	atores.forte = await criarNPC({
		name: "Forte Cabeça-de-Martelo (defesa e regras)",
		tokenName: "Forte Cabeça-de-Martelo",
		role: "forte",
		link: true,
		disposition: 1,
		img: "icons/svg/castle.svg",
		nd: 5,
		cd: 20,
		tipo: "hum",
		papel: "special",
		atr: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
		pv: 1,
		def: 10,
		recursos: { primary: { label: "Hora da noite (0 = antes das 18:00)", value: 0, max: 12 }, secondary: { label: "Dias até o ataque", value: 0, max: 12 } },
		bio: p("<b>Ator de apoio, não vai para o mapa.</b> Regras do cerco, da preparação e da paliçada. O recurso <i>Hora da noite</i> é usado pela macro <i>Noite no Inferno</i>."),
		items: [
			poder("Dias até o Ataque", "icons/svg/clockwork.svg",
				p("O pergaminho diz \"em duas semanas\", mas não se sabe quando foi escrito. Role <b>14 – 2d4</b> (12 a 6 dias). Os heróis só sabem o prazo se interrogarem algum inimigo."),
				{ exec: "passive", rolls: [["Dias restantes", [["14-2d4", ""]]]] }),
			poder("Construindo Defesas", "icons/svg/hazard.svg",
				p("Cada PJ ou NPC treinado em <b>Ofício ou Guerra</b> faz um teste por dia de preparação (e não faz mais nada naquele dia). <b>CD 20</b> gera 1d4 pontos de mana; cada 10 acima gera +1d4. Some todos os d4 de todos os dias e role: o total paga magias que representam as defesas (ex.: <i>Muralha Elemental</i> de chamas ao redor da paliçada).",
					"As defesas são mundanas: não podem ser anuladas como magia. Use a macro <i>Preparar o Forte</i>."),
				{ exec: "passive" }),
			poder("Ativar Defesa do Forte", "icons/svg/hazard.svg",
				p("<b>Ação completa</b> durante a aproximação: coordenar defensores para acionar uma defesa. <b>Guerra ou Ofício (engenhoqueiro)</b> contra a Defesa dos atacantes (CD 20 nas ondas de perigo complexo). Mesmo magias sem teste exigem este teste. Sentinelas não ativam defesas."),
				{ exec: "full" }),
			poder("Treinando Parceiros", "icons/svg/upgrade.svg",
				p("Só NPCs com nome que já tiveram destaque. Cada professor treina até <b>Carisma</b> NPCs por vez, por <b>1d6 dias</b> (dia inteiro). No fim: professor faz <b>Diplomacia ou Conhecimento</b> e a perícia relacionada (Luta, Pontaria, Cura, Misticismo...), ambos <b>CD 20</b>; cada aluno faz <b>Inteligência CD 10</b>. Tudo certo: o aluno vira parceiro <b>iniciante</b> do tipo escolhido (ou ganha um tipo a mais).",
					"O livro de armas de fogo das Fazendas Gallobalt permite a qualquer um treinar atiradores."),
				{ exec: "passive", rolls: [["Dias de treino", [["1d6", ""]]]] }),
			poder("Paliçada: Destruir e Consertar", "icons/svg/ruins.svg",
				p("Inimigo adjacente à paliçada: <b>4 rodadas sem agir</b> (ação completa) e abre um buraco de <b>4 quadrados</b>. Cada colega junto tira 1 rodada (mínimo 1). Marque quadrados danificados; outro inimigo pode continuar o trabalho.",
					"<b>Consertar</b> (entre ondas): 1 quadrado por hora, Ofício (carpinteiro, engenheiro ou similar) CD 20. Belinda conserta o dobro; os mecanículos consertam uma falha sem teste."),
				{ exec: "passive" }),
			poder("Na Paliçada", "icons/svg/castle.svg",
				p("Defensores na paliçada: <b>cobertura (+5 na Defesa)</b> contra quem está fora e <b>+2 em ataque</b> pelo terreno elevado, mas só atacam quem está no chão à distância.",
					"Sofrer <b>crítico</b> na paliçada: cai e sofre <b>2d6 de impacto</b> (Fortitude CD 20 evita a queda). Use o botão para dar o efeito ao PJ."),
				{ exec: "passive", save: "Fortitude CD 20 evita a queda", rolls: [["Queda da paliçada", [["2d6", "impacto"]]]],
					effects: [fx("Na Paliçada (+5 Def, +2 ataque)", "icons/svg/castle.svg", [["system.attributes.defesa.bonus", "5"], ["system.modificadores.ataque.geral", "2"]], { description: "Cobertura e terreno elevado. Remova ao descer." })] }),
			poder("Sentinelas e Aproximação", "icons/svg/eye.svg",
				p("Sentinela da esquerda vê o que vem da esquerda e da frente; a da direita, o que vem da direita e da frente. Com sentinelas, os heróis veem tudo de fora sem teste.",
					"<b>Aproximação:</b> Guerra ou Percepção <b>CD 20</b> (CD 25 na 4ª onda). Passou: 3 rodadas de antecedência; falhou: 2; falhou por 10 ou mais (5 na 4ª onda): 1. Ataques nessas rodadas contam como alcance médio. Use a macro <i>Aproximação</i>."),
				{ exec: "passive" }),
			poder("Ferimentos e Morte de Parceiros", "icons/svg/blood.svg",
				p("Cada PJ comanda até <b>6 parceiros</b> por rodada (uma ordem cada: Ajudar, Mover, Atacar). Atacar: fortões e atiradores causam seu dano extra; os outros, 1d6.",
					"Fim da rodada do jogador: role <b>1d6</b> (1d4 na área dos tentáculos); se for ≤ parceiros usados, um parceiro aleatório é <b>ferido</b> e sai.",
					"Fim de cada onda: um dado por parceiro ferido; <b>ímpar = morre</b>. Os vivos voltam com cura. Tirar de jogo um parceiro médico salva um ferido da rolagem de morte.",
					"Use a macro <i>Parceiros</i>."),
				{ exec: "passive" })
		]
	});

	atores.bombardeio = await criarNPC({
		name: "2ª Onda · Bombardeio (perigo complexo)",
		tokenName: "Bombardeio",
		role: "bombardeio",
		link: true,
		img: `${T20I}/itens/gerais/bomba.webp`,
		nd: 5,
		cd: 20,
		tipo: "hum",
		papel: "special",
		atr: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
		pv: 1,
		def: 20,
		recursos: { primary: { label: "Rodada do bombardeio (de 5)", value: 0, max: 5 } },
		bio: p("<b>Ator de apoio.</b> Vespas lefeu carregando bandoleiros e quatro grandes explosivos encostados na paliçada. Objetivo: desarmar os <b>4 explosivos em 5 rodadas</b>. Use a macro <i>Bombardeio</i>."),
		items: [
			poder("Bombas e Disparos (início do turno)", `${T20I}/itens/gerais/bomba.webp`,
				p("Início do turno de cada personagem: <b>Reflexos CD 20</b>. Falha: <b>4d6</b> de impacto ou ácido; falha por 10+: também perde a ação.",
					"Quem está junto de um explosivo é alvo de pistolas e mosquetes: <b>CD 25</b> e dano de <b>perfuração</b>."),
				{ exec: "passive", save: "Reflexos CD 20 evita", rolls: [["Bombas e ácido", [["4d6", "impacto"]]], ["Pistolas e mosquetes", [["4d6", "perfuracao"]]]] }),
			poder("Detonação", "icons/magic/fire/explosion-fireball-large-red-orange.webp",
				p("Fim da 5ª rodada: cada explosivo não desarmado destrói <b>8 quadrados</b> da paliçada e causa <b>10d6 de impacto</b> em quem está adjacente (Reflexos CD 20 reduz à metade)."),
				{ exec: "passive", save: "Reflexos CD 20 reduz à metade", rolls: [["Explosivo", [["10d6", "impacto"]]]] }),
			poder("Ações da 2ª Onda", "icons/svg/book.svg",
				`<table><tr><th>Ação</th><th>Teste</th><th>Efeito</th></tr>
				<tr><td>Ajudar</td><td>Ladinagem CD 10</td><td>Ajuda num desarme (um ajudante por vez).</td></tr>
				<tr><td>Atacar</td><td>Luta CD 20</td><td>Um personagem perto de um explosivo não testa Reflexos.</td></tr>
				<tr><td>Ativar defesa</td><td>Guerra ou Ofício (eng.) CD 20</td><td>+5 num teste para os próximos, ou um teste à distância.</td></tr>
				<tr><td>Carregar</td><td>Força CD 15</td><td>Desarma levando para longe. Falha por 5: +2 na CD daquele explosivo. Falha por 10: detona.</td></tr>
				<tr><td>Desarmar</td><td>Ladinagem CD 25</td><td>3 sucessos por explosivo; até 2 pessoas por explosivo por rodada.</td></tr>
				<tr><td>Disparo de cobertura</td><td>Pontaria CD 10</td><td>Ajuda nos Reflexos de todos na próxima rodada.</td></tr>
				<tr><td>Esconder-se</td><td>—</td><td>+5 no próximo teste de Reflexos.</td></tr>
				<tr><td>Mover-se</td><td>—</td><td>Uma ação para chegar a cada explosivo (fora da paliçada).</td></tr>
				<tr><td>Proteger</td><td>Defesa –10, CD 10</td><td>Ajuda nos Reflexos de protegidos da mesma área; o protetor sofre metade do dano deles se passarem.</td></tr></table>
				<p>Parceiros podem dar +2 com ideias criativas (atirador com dedos ágeis, fortão para carregar, NPC acostumado a pólvora).</p>`,
				{ exec: "passive" })
		]
	});

	/* ------------------------------------------------------------------ */
	/* 3. Itens: parceiros e tesouros                                       */
	/* ------------------------------------------------------------------ */
	const itemDoc = (d) => ({ ...d, folder: pasta.Item, flags: FLAGS() });
	const novosItens = [];

	const deCompendio = async (pack, id, nome, descExtra) => {
		const doc = await game.packs.get(pack)?.getDocument(id).catch(() => null);
		if (!doc) return null;
		const data = doc.toObject();
		delete data._id;
		data.name = nome;
		data.folder = pasta.Item;
		data.flags = foundry.utils.mergeObject(data.flags ?? {}, FLAGS());
		data.system.description.value = `${descExtra}<hr>${data.system.description.value ?? ""}`;
		return data;
	};

	const ID_PARCEIRO = {
		adepto: "WP0roXCa40nveA4L", ajudante: "ROdJSxDCkvamfzX7", assassino: "BNhavlxkPCr8P4Vi",
		atirador: "OvBibhyfED5HKbsz", combatente: "nNpGA5SWMj7rtUQR", destruidor: "FIJfKOIU8dzbvSDG",
		fortao: "YAcnW6C7ok7xjdg6", guardiao: "Un1h4jcM8qtf4F8L", magivocador: "EBDU8TfXg0iVLvCT",
		medico: "rntcrujiIc63hKOp", perseguidor: "0MvC3jJCv0311Ysr", vigilante: "DpTB2ElpvJ9mK0Bn"
	};
	const parceiro = async (tipos, nome, desc) => {
		const chaves = [].concat(tipos);
		const data = await deCompendio("tormenta20.parceiros", ID_PARCEIRO[chaves[0]], nome, desc);
		if (data) {
			if (chaves.length > 1) data.system.description.value = `${desc}<p><b>Também é:</b> ${chaves.slice(1).join(", ")}. Veja a descrição dos outros tipos no compêndio de parceiros.</p><hr>${data.system.description.value ?? ""}`;
			return data;
		}
		return itemDoc(poder(nome, `${T20I}/itens/gerais/parceiros.webp`, desc, { tipo: "geral", subtipo: "Parceiros" }));
	};

	// Lista do livro. [nome do item, tipos de parceiro, descrição]
	const LISTA_PARCEIROS = [
		["Abner (Médico iniciante)", ["medico"], "1 PM: cura 1d8+1 PV de um adjacente, uma vez por turno. O jovem pastor aceita o convite quase sem argumento nenhum."],
		["Annabel (Atiradora e médica iniciante)", ["atirador", "medico"], "+1d6 num dano à distância, ou 1 PM para curar 1d8+1 PV. Se o grupo a hostilizou, ela não sai do carvalho oco."],
		["Arlo \"Olho de Leite\" (Atirador veterano e perseguidor iniciante)", ["atirador", "perseguidor"], "+2 em Percepção e Sobrevivência e +1d10 num dano à distância, uma vez por rodada. Fale em termos de conspiração para ganhar bônus nos testes de recrutá-lo."],
		["Astelle (Adepta iniciante)", ["adepto"], "Magias de 1º círculo custam –1 PM."],
		["Bartram Zonnar (Ajudante iniciante)", ["ajudante"], "Se estiver vivo e lutando: +2 em Ofício (armeiro) e Ofício (carpinteiro)."],
		["Belinda Arting (Médica veterana)", ["medico"], "3 PM: cura 3d8+3 PV ou remove uma condição prejudicial de um adjacente. <b>Especial:</b> o personagem pode gastar uma ação de movimento para lançar Bênção, Físico Divino, Mente Divina ou Orientação pagando o PM normal. Se for usada para consertar o Forte, conserta o dobro."],
		["Cletus Rigby (parceiro instável)", ["ajudante"], "A cada onda, teste de perícia social <b>CD 25</b> ou ele vai embora ofendido. Se for <b>morto</b>, em vez disso se ofende, mata dois NPCs aleatórios e vai embora. Defina o bônus com a mesa (o livro não dá um tipo)."],
		["Dona Erneshia (ponto forte do inimigo)", ["ajudante"], "Não luta. Uma vez por rodada revela uma habilidade, vulnerabilidade ou resistência de um inimigo sem nome. Precisa ser usada como parceiro, mas todos ficam sabendo. Morre como qualquer parceiro."],
		["Doran Derinarion (Assassino iniciante)", ["assassino"], "O personagem recebe Ataque Furtivo +1d6."],
		["Edwina (Ajudante iniciante)", ["ajudante"], "+2 em Guerra e Conhecimento."],
		["Elmer (baforada de arco-íris)", ["ajudante"], "<b>Inútil como parceiro</b> e elimina um parceiro do Forte (escolha dos jogadores). Se o grupo o livrou do vício, vira extraordinário: uma vez no combate, a baforada reduz a onda à metade (metade dos inimigos, ou metade dos sucessos de um perigo complexo). Não funciona na última onda nem contra inimigos com nome."],
		["Fermond Aldaman (\"Combatente iniciante\")", ["combatente"], "<b>Mentira do mestre:</b> diga ao jogador que é +1 em ataque, mas subtraia 2 dos resultados dele em segredo (o efeito real é –1). A cada rodada o jogador pode testar Guerra, Intuição ou Percepção <b>CD 15</b> para perceber. Inspirado, vira +0; só em circunstâncias extraordinárias, +1."],
		["Gaspar LeBlanc (Adepto e magivocador mestre)", ["adepto", "magivocador"], "Magias de 1º e 2º círculo custam –1 PM (cumulativo), +2 na CD das magias do personagem e +2 dados de dano do mesmo tipo. <b>Especial:</b> se Mabel for ferida, ele abandona o personagem e cuida dela (a chance de morte dela cai para 10%)."],
		["Grena (Vigilante iniciante)", ["vigilante"], "+2 em Iniciativa e Percepção."],
		["Haran Gallobalt (Combatente iniciante)", ["combatente"], "+1 em testes de ataque."],
		["Isabrine (Fortona iniciante)", ["fortao"], "+1d8 num dano corpo a corpo, uma vez por rodada."],
		["Jansel Gallobalt (Atirador iniciante)", ["atirador"], "+1d6 num dano à distância, uma vez por rodada."],
		["Jonid, o Homem-Bode (Perseguidor veterano)", ["perseguidor"], "+2 em Percepção e Sobrevivência e o poder Sentidos Aguçados. <b>Cuidado:</b> na 3ª onda ele abre a porta para os zumbis achando que são a família dele (Intuição CD 20 para notar, Iniciativa CD 20 para impedir)."],
		["Lena (Ajudante e fortão iniciante)", ["ajudante", "fortao"], "+2 em Atuação e Diplomacia e +1d8 num dano corpo a corpo, uma vez por rodada."],
		["Lorelei Wulff (Fortona e combatente veterana)", ["fortao", "combatente"], "Se o grupo a poupou e recrutou: +2 em ataque e +1d12 num dano corpo a corpo, uma vez por rodada."],
		["Mabel LeBlanc (Ajudante veterana)", ["ajudante"], "+2 em Fortitude, Reflexos e Vontade. Faz a sopa LeBlanc se tiver acesso à cozinha e ela não for atacada."],
		["Marah (Combatente iniciante)", ["combatente"], "+1 em testes de ataque."],
		["Mecanículos (Combatente iniciante)", ["combatente"], "Contam como um só parceiro e exigem testes para reprogramar. Podem consertar uma falha na paliçada entre ondas sem teste. Reprogramados para atacar: +1 em testes de ataque."],
		["Moira (Guardiã iniciante)", ["guardiao"], "+2 na Defesa. <b>Especial (não conte ao jogador):</b> uma vez no combate, num momento de crise, Moira cura 1d8+1 PV do personagem sem perder o bônus de Defesa. Às 02:00 ela pode virar paladina (veja a linha de tempo)."],
		["Morgan de Molok (Fortão veterano e guardião iniciante)", ["fortao", "guardiao"], "+2 na Defesa e +1d12 num dano corpo a corpo, uma vez por rodada. <b>Especial:</b> o personagem recebe o poder Comandar. Sob ordens de um personagem, Morgan é sempre o primeiro a ser ferido, mas aguenta um ferimento a mais antes de sair."],
		["Mortimer (Combatente iniciante)", ["combatente"], "+1 em testes de ataque. <b>Especial:</b> usado junto com Morgan, conta como parceiro íntimo."],
		["Nada Mais que a Verdade Reston (Ajudante iniciante)", ["ajudante"], "+2 em Conhecimento e Religião. Na fase 1, ela pode avisar um NPC no lugar do grupo com sucesso automático (exceto Gormaggor e Cletus)."],
		["Nadine (Combatente iniciante)", ["combatente"], "+1 em testes de ataque. Às 22:00 ela se oferece para buscar os itens que esconde nas Colinas (Cavalgar +8, estendido CD 20)."],
		["Nathanael Gallobalt (Atirador veterano)", ["atirador"], "+1d10 num dano à distância, uma vez por rodada."],
		["Quimby Ulysses Arronax (Destruidor e ajudante iniciante)", ["destruidor", "ajudante"], "1 PM: 2d6 de fogo num alvo em alcance curto, uma vez por turno; +2 em Enganação e Ladinagem. Enganação <b>nunca</b> funciona para recrutá-lo, nem com 20 natural: só sinceridade."],
		["Raguria (Destruidora veterana)", ["destruidor"], "2 PM: 4d6 de ácido num alvo em alcance curto, uma vez por rodada. <b>Especial:</b> se ficar uma cena inteira no mesmo ambiente que Moira, se volta contra a paladina (Intuição CD 20 para notar antes). Sem providência, tira Moira de combate de vez no fim da onda."],
		["Ritanna Gallobalt (Guardiã iniciante)", ["guardiao"], "+2 na Defesa."],
		["Salisha Gallobalt (Atiradora veterana)", ["atirador"], "+1d10 num dano à distância, uma vez por rodada."],
		["Tarik (Atirador iniciante)", ["atirador"], "+1d6 num dano à distância, uma vez por rodada."],
		["Vadrinne (Médica iniciante)", ["medico"], "1 PM: cura 1d8+1 PV de um adjacente, uma vez por rodada."],
		["Zagar (Fortão iniciante)", ["fortao"], "+1d8 num dano corpo a corpo, uma vez por rodada."],
		["Gronko \"Bocão\" (engolir)", ["fortao"], "Uma vez por onda, engole automaticamente um inimigo sem nome, tirando-o de combate."],
		["Gormaggor (uma onda inteira)", ["fortao"], "Só se o grupo tiver feito algo <b>extraordinário</b> por ele: o gigante caminha até o Forte, dá alguns safanões e elimina uma onda inteira, depois volta a dormir por décadas."]
	];
	const NAO_AJUDAM = ["Andrisse", "Blanche, Bastien, Clothilde e Pascal LeBlanc", "Mungo Joe (fornece bebida à vontade)"];

	for (const [nome, tipos, desc] of LISTA_PARCEIROS) {
		novosItens.push(await parceiro(tipos, `Parceiro: ${nome}`, p(desc)));
	}

	novosItens.push(
		itemDoc(poder("Parceiros que não ajudam", `${T20I}/itens/gerais/parceiros.webp`,
			p("Estes NPCs podem ir ao Forte, mas não viram parceiros:", `<ul>${NAO_AJUDAM.map((n) => `<li>${n}</li>`).join("")}</ul>`,
				"<b>Parceiro íntimo:</b> um por herói. Pode dar o mesmo tipo de bônus que outro parceiro já está dando."),
			{ tipo: "geral", subtipo: "Parceiros", exec: "passive" })),
		itemDoc({
			name: "Pergaminho com as Ordens de Syvarian",
			type: "tesouro",
			img: `${T20I}/itens/gerais/pergaminho.webp`,
			system: {
				description: { value: p(
					"<i>\"Todas as tropas estão convocadas. Passaremos por cada aldeia, cada casebre, cada buraco onde o povo destas Colinas se esconde e vamos matar todos. Convergimos ao alvo principal em duas semanas. Todos juntos, para que não reste ninguém vivo lá dentro. O Forte Cabeça-de-Martelo vai cair. Syvarian\"</i>",
					"Pode aparecer em qualquer lugar: com Zardu (numa versão que o recrimina), deixado na cabine da Harpia por Torgo, ou nas instruções de Lorelei. <b>Dias até o ataque: 14 – 2d4</b> (12 a 6), e os heróis só sabem o prazo interrogando um inimigo."
				) },
				qtd: 1, preco: 0, peso: 0, espacos: 0
			}
		}),
		itemDoc({
			name: "Esconderijo de Nadine (22:00)",
			type: "tesouro",
			img: `${T20I}/itens/gerais/corda.webp`,
			system: {
				description: { value: p(
					"Presentes da mãe de Nadine, escondidos nas Colinas: <b>1d6 poções de Curar Ferimentos (2d8+2)</b>, <b>1d4 essências de mana</b> e uma <b>poção de Físico Perfeito</b>.",
					"Ela se oferece para buscá-los a cavalo: teste estendido de <b>Cavalgar CD 20</b> (três sucessos antes de três falhas), com Cavalgar +8. Um herói também pode ir."
				) },
				qtd: 1, preco: 0, peso: 0, espacos: 0
			}
		}),
		itemDoc({
			name: "Chá de Raguria (01:00)",
			type: "tesouro",
			img: `${T20I}/itens/gerais/essencia-mana.webp`,
			system: {
				description: { value: p("Se Raguria estiver no Forte e não estiver cozinhando, oferece um \"chazinho\" de um jeito sinistro. É <b>essência de mana</b>: ela tem <b>2d4</b> doses.") },
				qtd: 1, preco: 0, peso: 0, espacos: 0
			}
		})
	);

	const itensCriados = await Item.createDocuments(novosItens);
	const itemPorNome = (inicio) => itensCriados.find((i) => i.name.startsWith(inicio));

	/* ------------------------------------------------------------------ */
	/* 4. Macros de mesa                                                    */
	/* ------------------------------------------------------------------ */

	async function macroNoite() {
		const forte = game.actors.find((a) => a.getFlag("world", "fdtRole") === "forte");
		if (!forte) return ui.notifications.error("Ator do Forte não encontrado (importe o conteúdo do módulo Fim dos Tempos).");
		const HORAS = [
			["18:00", "<b>1ª Onda · Invasão de Bandoleiros</b> (combate). 40 bandoleiros, 4 cães do inferno e 4 irmãos da Companhia. 20 escalam a paliçada (3 rodadas, desprevenidos), 20 abrem buracos em duplas. No início de cada rodada, cada abertura solta um cão (até 4); depois os irmãos, 1 por rodada por abertura. <b>Vitória:</b> derrotar todos os cães e irmãos mais 30 bandoleiros."],
			["19:00", "<b>Discurso de Syvarian.</b> Ele aparece de escafandro completo, fora do alcance, tira o elmo e revela o relógio na testa. Deixe o grupo conversar e arrancar revelações com testes (veja o diário). Matá-lo ou feri-lo gravemente agora começa a 2ª onda na hora."],
			["20:00", "<b>Fermond</b> tenta uma \"aliança de elites\" com Syvarian. Exposto aos soldados, Isabrine o nocauteia (conta como ferido). <b>Belinda</b> oferece preparar poções se ficar a noite inteira na oficina em segurança."],
			["21:00", "<b>2ª Onda · Bombardeio</b> (perigo complexo). Vespas lefeu carregando bandoleiros e <b>4 explosivos</b> na paliçada, programados para 5 rodadas. Use a macro <i>Bombardeio</i>."],
			["22:00", "<b>Nadine</b> revela o esconderijo dela (poções e essências) e se oferece para buscá-lo a cavalo: estendido de Cavalgar CD 20, com Cavalgar +8."],
			["23:00", "<b>Mabel</b> anuncia a sopa LeBlanc: precisa da cozinha sem ataques. Uma hora por grupo (cada PJ + parceiros = um grupo). Com Raguria no Forte, as duas brigam; mediada, a dupla cozinha em metade do tempo ou faz um prato especial."],
			["00:00", "<b>3ª Onda · Horda de Zumbis</b> (perigo complexo). Objetivo: <b>400 de dano</b> à horda. Nadine volta avisando (mais uma rodada de preparo se chegar a salvo). Cuidado com o Homem-Bode abrindo a porta. Use a macro <i>Horda Zumbi</i>."],
			["01:00", "<b>Alon Gallobalt desaparece</b> procurando uma arma nos depósitos: três testes de Investigação (CD 18, 20 e 22), uma hora inteira. Sem busca, todos os Gallobalt vão embora do Forte. <b>Raguria</b> oferece o \"chazinho\" (2d4 essências de mana)."],
			["02:00", "<b>Moira reza.</b> Com dois PJs ou mais rezando, teste de Religião (+1 por NPC rezando, +3 se houver paladino no grupo). <b>30 ou mais:</b> Khalmyr ouve e Moira vira paladina (11 PM, paladina de Khalmyr de 3º nível, Compaixão e Caridade: 1 PM e uma ação de movimento curam 2d6+1 PV em alcance curto). Com Mungo Joe e o alambique, Belinda sai com uma poção de até 2º círculo para cada PJ."],
			["03:00", "<b>4ª Onda · Última Cartada</b> (combate). 6 bandos desesperados, 10 irmãos da Companhia, 5 uktril, 3 geraktril e 2 reishid. Os inimigos procuram os abrigos dos aldeões (Percepção CD 20). Tentáculos lefeu podem surgir do fosso (1d4, no 1)."],
			["04:00", "<b>Bastien, Clothilde e Blanche enlouquecem</b> e viram zumbis da Tormenta; Gaspar ataca, mas pode ser apaziguado. Se os heróis protegeram os LeBlanc e os três foram treinados, Vontade CD 20 por cada um evita. <b>Morgan</b> pede para morrer lutando, ou (se houver amizade) decide viver e se aposentar. <b>Cletus</b> presenteia um item mágico. <b>Belinda</b> entrega as poções e traz <b>Ygor</b>."],
			["05:00", "<b>5ª Onda · Tudo ou Nada</b> (combate). Syvarian e Torgo com alguns capangas. Sem sentinelas nem aproximação. Ygor explode no momento em que os heróis estiverem mais juntos (8d6, raio de 3m, Reflexos CD 25) e a imagem do Dr. Vesper revela todo o plano."]
		];
		const atual = forte.system.resources.primary.value;
		const escolha = await foundry.applications.api.DialogV2.wait({
			window: { title: `Noite no Inferno · ${atual ? HORAS[atual - 1][0] : "antes das 18:00"}` },
			content: "<p>Avançar uma hora da noite, repetir a hora atual ou zerar?</p>",
			buttons: [
				{ action: "avancar", label: "Avançar uma hora", default: true },
				{ action: "repetir", label: "Repetir esta hora" },
				{ action: "zerar", label: "Zerar" }
			]
		});
		if (escolha === "zerar") return forte.update({ "system.resources.primary.value": 0 });
		if (!escolha) return;
		const i = escolha === "repetir" ? Math.max(atual, 1) : Math.min(atual + 1, HORAS.length);
		await forte.update({ "system.resources.primary.value": i });
		const [hora, txt] = HORAS[i - 1];
		ChatMessage.create({ content: `<h3>Noite no Inferno · ${hora}</h3><p>${txt}</p>` });
	}

	async function macroAproximacao() {
		const atores = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		if (!atores.length) return ui.notifications.warn("Selecione os tokens das sentinelas.");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Aproximação da onda" },
			content: `
				<div class="form-group"><label>Onda</label><select name="onda">
					<option value="20">1ª, 2ª ou 3ª onda (CD 20)</option>
					<option value="25">4ª onda (CD 25)</option></select></div>
				<div class="form-group"><label>Perícia</label><select name="pericia">
					<option value="guer">Guerra</option><option value="perc">Percepção</option></select></div>
				<div class="form-group"><label>Nadine voltou a salvo (3ª onda, +1 rodada)</label><input type="checkbox" name="nadine"></div>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const cd = Number(res.onda);
		const margem = cd === 25 ? 5 : 10;
		const rolls = [];
		let melhor = 0;
		let html = `<h3>Aproximação</h3><p>${res.pericia === "guer" ? "Guerra" : "Percepção"} CD ${cd}</p><ul>`;
		for (const a of atores) {
			const r = await new Roll(`1d20 + ${a.system.pericias?.[res.pericia]?.value ?? 0}`).evaluate();
			rolls.push(r);
			melhor = Math.max(melhor, r.total);
			html += `<li>${a.name}: <b>${r.total}</b></li>`;
		}
		let rodadas = melhor >= cd ? 3 : melhor <= cd - margem ? 1 : 2;
		if (res.nadine) rodadas += 1;
		html += `</ul><p>Melhor resultado: <b>${melhor}</b> → <b>${rodadas} rodada(s)</b> de antecedência.</p>
			<p style="font-size:0.85em">Nessas rodadas valem ações normais, ataques (alcance médio) e ações completas para ativar defesas (Guerra ou Ofício engenhoqueiro). Sentinela destacada não ativa defesa.</p>`;
		ChatMessage.create({ content: html, rolls });
	}

	async function macroPreparar() {
		const atores = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Preparar o Forte" },
			content: `
				<p>Cada PJ ou NPC treinado em Ofício ou Guerra faz um teste por dia (e não faz mais nada naquele dia). CD 20 gera 1d4 de mana; cada 10 acima, +1d4.</p>
				<div class="form-group"><label>Perícia</label><select name="pericia">
					<option value="ofi0">Ofício</option><option value="guer">Guerra</option>
					<option value="furt">Furtividade (coberturas)</option><option value="ladi">Ladinagem (armadilhas)</option></select></div>
				<div class="form-group"><label>Bônus fixo (se o token não tiver a perícia na ficha)</label><input type="number" name="bonus" value="0"></div>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		let dados = 0;
		let html = "<h3>Construindo Defesas</h3><ul>";
		const lista = atores.length ? atores : [null];
		for (const a of lista) {
			const bonus = a ? (a.system.pericias?.[res.pericia]?.value ?? 0) : Number(res.bonus) || 0;
			const r = await new Roll(`1d20 + ${bonus}`).evaluate();
			rolls.push(r);
			const d = r.total >= 20 ? 1 + Math.floor((r.total - 20) / 10) : 0;
			dados += d;
			html += `<li>${a ? a.name : "Teste"}: <b>${r.total}</b> → ${d ? `${d}d4` : "nada"}</li>`;
		}
		if (dados) {
			const mana = await new Roll(`${dados}d4`).evaluate();
			rolls.push(mana);
			html += `</ul><p>Orçamento deste dia: <b>${dados}d4 = ${mana.total} pontos de mana</b>.</p>
				<p style="font-size:0.85em">Some os d4 de todos os dias antes de rolar, se preferir. Gaste o total em magias que representem as defesas (ex.: Muralha Elemental). As defesas são mundanas: não podem ser anuladas como magia.</p>`;
		} else html += "</ul><p>Nenhum sucesso: nenhum ponto de mana neste dia.</p>";
		ChatMessage.create({ content: html, rolls });
	}

	async function macroTreinar() {
		const prof = canvas.tokens.controlled[0]?.actor;
		if (!prof) return ui.notifications.warn("Selecione o token do professor.");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Treinando Parceiros" },
			content: `
				<p>Professor: <b>${prof.name}</b>. Pode treinar até <b>Carisma</b> NPCs por vez (Car ${prof.system.atributos?.car?.value ?? 0}).</p>
				<div class="form-group"><label>Teste social</label><select name="social">
					<option value="dipl">Diplomacia</option><option value="conh">Conhecimento</option></select></div>
				<div class="form-group"><label>Perícia do tipo de parceiro</label><select name="pericia">
					<option value="luta">Luta (combatente, fortão)</option><option value="pont">Pontaria (atirador)</option>
					<option value="cura">Cura (médico)</option><option value="mist">Misticismo (adepto, magivocador)</option></select></div>
				<div class="form-group"><label>Quantos alunos</label><input type="number" name="alunos" value="1" min="1" max="10"></div>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		const dias = await new Roll("1d6").evaluate();
		rolls.push(dias);
		const social = await new Roll(`1d20 + ${prof.system.pericias?.[res.social]?.value ?? 0}`).evaluate();
		const tecnica = await new Roll(`1d20 + ${prof.system.pericias?.[res.pericia]?.value ?? 0}`).evaluate();
		rolls.push(social, tecnica);
		let html = `<h3>Treinando Parceiros</h3><p>Leva <b>${dias.total} dia(s)</b> (dia inteiro de trabalho).</p>
			<ul><li>${res.social === "dipl" ? "Diplomacia" : "Conhecimento"}: <b>${social.total}</b> (CD 20) ${social.total >= 20 ? "✔️" : "❌"}</li>
			<li>${res.pericia.toUpperCase()}: <b>${tecnica.total}</b> (CD 20) ${tecnica.total >= 20 ? "✔️" : "❌"}</li></ul>`;
		if (social.total < 20 || tecnica.total < 20) {
			html += "<p><b>O professor falhou:</b> os dias estão perdidos, ninguém vira parceiro.</p>";
		} else {
			html += "<p>Testes de Inteligência dos alunos (CD 10):</p><ul>";
			for (let i = 1; i <= Number(res.alunos); i++) {
				const r = await new Roll("1d20").evaluate();
				rolls.push(r);
				html += `<li>Aluno ${i}: <b>${r.total}</b> ${r.total >= 10 ? "✔️ vira parceiro iniciante" : "❌ não aprendeu"}</li>`;
			}
			html += "</ul><p style=\"font-size:0.85em\">Some o modificador de Inteligência do NPC ao resultado, se ele tiver ficha. Todo treinamento gera parceiros <b>iniciantes</b>.</p>";
		}
		ChatMessage.create({ content: html, rolls });
	}

	async function macroParceiros() {
		const CHAVE = "fdtParceiros";
		const estado = game.user.getFlag("world", CHAVE) ?? { feridos: 0 };
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Parceiros" },
			content: `
				<p>Feridos acumulados nesta onda: <b>${estado.feridos}</b>.</p>
				<div class="form-group"><label>O que rolar</label><select name="acao">
					<option value="ferimento">Fim da rodada: alguém se feriu?</option>
					<option value="morte">Fim da onda: quem morreu?</option></select></div>
				<div class="form-group"><label>Parceiros usados nesta rodada</label><input type="number" name="usados" value="1" min="0" max="6"></div>
				<div class="form-group"><label>Na área dos tentáculos (1d4)</label><input type="checkbox" name="tentaculos"></div>
				<div class="form-group"><label>Parceiros feridos (fim da onda)</label><input type="number" name="feridos" value="${estado.feridos}" min="0"></div>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		let html = "";
		if (res.acao === "ferimento") {
			const usados = Number(res.usados) || 0;
			const r = await new Roll(res.tentaculos ? "1d4" : "1d6").evaluate();
			rolls.push(r);
			const ferido = r.total <= usados;
			if (ferido) estado.feridos += 1;
			html = `<h3>Ferimento de parceiro</h3><p>${res.tentaculos ? "1d4" : "1d6"}: <b>${r.total}</b> contra ${usados} parceiro(s) usado(s). ${ferido ? "<b>Um parceiro aleatório é ferido e sai de combate.</b>" : "Ninguém se feriu."}</p>
				<p>Feridos nesta onda: <b>${estado.feridos}</b>.</p>`;
			await game.user.setFlag("world", CHAVE, estado);
		} else {
			const n = Number(res.feridos) || 0;
			html = `<h3>Fim da onda · chance de morte</h3><p>Um dado por parceiro ferido; <b>ímpar = morre</b>.</p><ul>`;
			let mortos = 0;
			for (let i = 1; i <= n; i++) {
				const r = await new Roll("1d6").evaluate();
				rolls.push(r);
				const morreu = r.total % 2 === 1;
				if (morreu) mortos++;
				html += `<li>Ferido ${i}: <b>${r.total}</b> ${morreu ? "❌ morreu" : "✔️ sobreviveu (volta com cura)"}</li>`;
			}
			html += `</ul><p>Mortos: <b>${mortos}</b> de ${n}.</p>
				<p style="font-size:0.85em">Antes de rolar, o grupo pode tirar de jogo um parceiro médico de vez para salvar um ferido da rolagem (ele não volta ao combate, mas não morre).</p>`;
			estado.feridos = 0;
			await game.user.setFlag("world", CHAVE, estado);
		}
		ChatMessage.create({ content: html, rolls });
	}

	async function macroBombardeio() {
		const onda = game.actors.find((a) => a.getFlag("world", "fdtRole") === "bombardeio");
		if (!onda) return ui.notifications.error("Ator do Bombardeio não encontrado (importe o conteúdo do módulo Fim dos Tempos).");
		const alvos = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		const rodada = onda.system.resources.primary.value;
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: `Bombardeio · rodada ${rodada} de 5` },
			content: `
				<div class="form-group"><label>O que rolar</label><select name="acao">
					<option value="inicio">Início do turno: bombas e disparos (Reflexos)</option>
					<option value="desarmar">Desarmar um explosivo (Ladinagem CD 25)</option>
					<option value="carregar">Carregar o explosivo para longe (Força CD 15)</option>
					<option value="detonar">Fim da 5ª rodada: detonar os que sobraram</option>
					<option value="zerar">Zerar o contador de rodadas</option></select></div>
				<div class="form-group"><label>Perto de um explosivo (CD 25, perfuração)</label><input type="checkbox" name="perto"></div>
				<div class="form-group"><label>CD extra naquele explosivo (acelerado)</label><input type="number" name="extra" value="0"></div>
				<div class="form-group"><label>Explosivos ainda armados (detonar)</label><input type="number" name="armados" value="4" min="0" max="4"></div>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "zerar") return onda.update({ "system.resources.primary.value": 0 });
		const rolls = [];
		let html = "";
		if (res.acao === "inicio") {
			await onda.update({ "system.resources.primary.value": Math.min(rodada + 1, 5) });
			const cd = res.perto ? 25 : 20;
			const tipo = res.perto ? "perfuracao" : "impacto";
			html = `<h3>Bombardeio · rodada ${Math.min(rodada + 1, 5)} de 5</h3><p>Reflexos CD ${cd}.</p><ul>`;
			for (const a of alvos) {
				const r = await new Roll(`1d20 + ${a.system.pericias?.refl?.value ?? 0}`).evaluate();
				rolls.push(r);
				if (r.total >= cd) { html += `<li>${a.name}: <b>${r.total}</b> ✔️ se desvia</li>`; continue; }
				const d = await new Roll(`4d6[${tipo}]`).evaluate();
				rolls.push(d);
				await a.applyDamageV2(d, 1);
				const perdeAcao = r.total <= cd - 10;
				html += `<li>${a.name}: <b>${r.total}</b> ❌ ${d.total} de ${tipo}${perdeAcao ? " e <b>perde a ação</b>" : ""}</li>`;
			}
			html += "</ul>";
		} else if (res.acao === "desarmar" || res.acao === "carregar") {
			const desarmar = res.acao === "desarmar";
			const cd = (desarmar ? 25 : 15) + (Number(res.extra) || 0);
			const pericia = desarmar ? "ladi" : null;
			html = `<h3>${desarmar ? "Desarmar" : "Carregar"} o explosivo</h3><p>${desarmar ? "Ladinagem" : "Força"} CD ${cd}</p><ul>`;
			for (const a of alvos) {
				const bonus = desarmar ? (a.system.pericias?.[pericia]?.value ?? 0) : (a.system.atributos?.for?.value ?? 0);
				const r = await new Roll(`1d20 + ${bonus}`).evaluate();
				rolls.push(r);
				const falhaPor = cd - r.total;
				let txt = r.total >= cd ? (desarmar ? "✔️ um sucesso (3 desarmam)" : "✔️ levou o explosivo para longe: desarmado") : "❌";
				if (r.total < cd && !desarmar) {
					if (falhaPor >= 10) txt += " <b>detonou o explosivo!</b>";
					else if (falhaPor >= 5) txt += " acelerou o detonador: +2 na CD deste explosivo";
					else txt += " não conseguiu erguer";
				}
				html += `<li>${a.name}: <b>${r.total}</b> ${txt}</li>`;
			}
			html += "</ul><p style=\"font-size:0.85em\">Até dois personagens por explosivo por rodada. Ajudar: Ladinagem CD 10.</p>";
		} else {
			const n = Number(res.armados) || 0;
			html = `<h3>Detonação</h3><p><b>${n}</b> explosivo(s) não desarmado(s): cada um destrói <b>8 quadrados</b> da paliçada.</p><ul>`;
			for (const a of alvos) {
				const r = await new Roll(`1d20 + ${a.system.pericias?.refl?.value ?? 0}`).evaluate();
				rolls.push(r);
				const ok = r.total >= 20;
				let total = 0;
				for (let i = 0; i < n; i++) {
					const d = await new Roll("10d6[impacto]").evaluate();
					rolls.push(d);
					await a.applyDamageV2(d, ok ? 0.5 : 1);
					total += d.total;
				}
				html += `<li>${a.name}: Reflexos <b>${r.total}</b> (CD 20) ${ok ? "✔️ metade" : "❌ total"} de ${total}</li>`;
			}
			html += "</ul><p style=\"font-size:0.85em\">Só quem está adjacente aos explosivos sofre o dano. Dano já aplicado com RD.</p>";
			await onda.update({ "system.resources.primary.value": 0 });
		}
		ChatMessage.create({ content: html, rolls });
	}

	async function macroHorda() {
		const horda = game.actors.find((a) => a.getFlag("world", "fdtRole") === "horda");
		if (!horda) return ui.notifications.error("Ator da Horda não encontrado (importe o conteúdo do módulo Fim dos Tempos).");
		const alvos = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		const pv = horda.system.attributes.pv;
		const tempestade = horda.effects.find((e) => e.name.startsWith("Tempestade Rubra"));
		const extra = tempestade && !tempestade.disabled ? 5 : 0;
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: `Horda Zumbi · ${pv.max - pv.value} de ${pv.max} de dano` },
			content: `
				<p>CDs desta onda: <b>${25 + extra}</b>${extra ? " (Tempestade Rubra ativa)" : ""}.</p>
				<div class="form-group"><label>O que rolar</label><select name="acao">
					<option value="inicio">Início do turno (Fortitude ou Vontade)</option>
					<option value="horda">Ação da horda (1d4)</option>
					<option value="dano">Registrar dano causado à horda</option></select></div>
				<div class="form-group"><label>Resistência</label><select name="save">
					<option value="fort">Fortitude</option><option value="vont">Vontade</option></select></div>
				<div class="form-group"><label>Dano causado à horda</label><input type="number" name="dano" value="0"></div>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const cd = 25 + extra;
		const rolls = [];
		let html = "";
		if (res.acao === "dano") {
			const novo = Math.max(pv.value - (Number(res.dano) || 0), 0);
			await horda.update({ "system.attributes.pv.value": novo });
			const feito = pv.max - novo;
			html = `<h3>Horda Zumbi</h3><p>Dano total na horda: <b>${feito} de ${pv.max}</b>.</p>`;
			if (feito >= pv.max) html += "<p><b>A horda é repelida!</b> Os zumbis que sobraram recuam.</p>";
			else if (feito >= pv.max / 2 && !extra) {
				if (tempestade) await tempestade.update({ disabled: false });
				html += "<p><b>Metade da horda caiu.</b> Syvarian invoca um vislumbre da Tempestade Rubra: os céus ficam avermelhados e <b>todas as dificuldades desta onda sobem +5</b> (CD 30).</p>";
			}
			html += "<p style=\"font-size:0.85em\">Efeitos de área causam +50% de dano na horda. Os zumbis têm +10 em testes de resistência e são imunes a crítico, ácido, eletricidade, fogo, frio, luz, trevas, veneno, paralisia, cansaço, metabolismo e metamorfose.</p>";
		} else if (res.acao === "inicio") {
			html = `<h3>Loucura da Horda · início do turno</h3><p>${res.save === "fort" ? "Fortitude" : "Vontade"} CD ${cd}.</p><ul>`;
			for (const a of alvos) {
				const r = await new Roll(`1d20 + ${a.system.pericias?.[res.save]?.value ?? 0}`).evaluate();
				rolls.push(r);
				if (r.total >= cd) { html += `<li>${a.name}: <b>${r.total}</b> ✔️</li>`; continue; }
				const pm = a.system.attributes.pm;
				if (pm.value >= 2) {
					await a.update({ "system.attributes.pm.value": pm.value - 2 });
					html += `<li>${a.name}: <b>${r.total}</b> ❌ perde <b>2 PM</b> (ou, por escolha do jogador, um parceiro aleatório é ferido)</li>`;
				} else html += `<li>${a.name}: <b>${r.total}</b> ❌ sem PM: <b>perde 1 parceiro</b> automaticamente</li>`;
			}
			html += "</ul><p style=\"font-size:0.85em\">Parceiros feridos assim saem da cena e têm 50% de chance de morrer. <i>Coordenar Defensores</i> (Diplomacia, Guerra ou Vontade CD 10) ajuda nestes testes na rodada seguinte.</p>";
		} else {
			const r = await new Roll("1d4").evaluate();
			rolls.push(r);
			const ACOES = {
				1: ["Insanidade da Tormenta", `Todos os personagens sofrem <b>–2 em testes</b> nesta rodada (Vontade CD ${cd} evita).`],
				2: ["Enxame de Braços", `Uma massa de membros se joga contra um defensor aleatório: fica <b>agarrado</b> e sofre <b>2d8+4 de impacto</b> (Fortitude ou Luta CD ${cd} reduz à metade e evita agarrar). Agarrado pode gastar a ação para repetir o teste; falhando, sofre o dano de novo.`],
				3: ["Catapulta de Vísceras", `Todos os defensores fazem <b>Guerra ou Reflexos CD ${cd}</b>, com os mesmos efeitos do teste de início de turno (2 PM ou um parceiro ferido).`],
				4: ["Perseguir Parceiro", `Um personagem aleatório faz <b>Luta, Pontaria ou Reflexos CD ${cd}</b> ou um parceiro aleatório é ferido. Falha por 5 ou mais: o parceiro é arrastado e <b>morto no fim da rodada</b>; qualquer personagem pode salvá-lo gastando a ação para Atacar ou Usar Habilidade. Se morrer, <b>cada personagem perde 1 PM</b>.`]
			};
			const [nome, txt] = ACOES[r.total];
			html = `<h3>Ação da Horda (1d4 = ${r.total})</h3><p><b>${nome}.</b> ${txt}</p>`;
			if (r.total === 2) {
				const d = await new Roll("2d8+4[impacto]").evaluate();
				rolls.push(d);
				html += `<p>Dano rolado: <b>${d.total}</b>.</p>`;
			}
		}
		ChatMessage.create({ content: html, rolls });
	}

	async function macroTentaculos() {
		const tent = game.actors.find((a) => a.getFlag("world", "fdtRole") === "tentaculos");
		if (!tent) return ui.notifications.error("Ator dos Tentáculos não encontrado (importe o conteúdo do módulo Fim dos Tempos).");
		const alvos = canvas.tokens.controlled.map((t) => t.actor).filter(Boolean);
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Tentáculos Lefeu" },
			content: `
				<p>Tentáculos: <b>${tent.system.attributes.pv.value} de ${tent.system.attributes.pv.max} PV</b> (somem com 200 de dano).</p>
				<div class="form-group"><label>O que rolar</label><select name="acao">
					<option value="surgir">Surgem nesta rodada? (1d4, surge no 1)</option>
					<option value="agarrar">Resistir a agarrar (Luta CD 25)</option>
					<option value="dano">Dano em quem está agarrado</option></select></div>
				<div class="form-group"><label>Dentro do fosso (dano dobrado, CD 30)</label><input type="checkbox" name="fosso"></div>`,
			ok: { label: "Rolar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		let html = "";
		if (res.acao === "surgir") {
			const r = await new Roll("1d4").evaluate();
			rolls.push(r);
			html = `<h3>Tentáculos Lefeu</h3><p>1d4: <b>${r.total}</b> — ${r.total === 1 ? "<b>os tentáculos surgem do fosso!</b> Todos os efeitos valem já nesta rodada, em 6 quadrados ao redor do poço." : "nada acontece nesta rodada."}</p>`;
		} else if (res.acao === "agarrar") {
			const cd = res.fosso ? 30 : 25;
			html = `<h3>Agarrar dos Tentáculos</h3><p>Luta CD ${cd}.</p><ul>`;
			for (const a of alvos) {
				const r = await new Roll(`1d20 + ${a.system.pericias?.luta?.value ?? 0}`).evaluate();
				rolls.push(r);
				const ok = r.total >= cd;
				await a.toggleStatusEffect("agarrado", { active: !ok });
				html += `<li>${a.name}: <b>${r.total}</b> ${ok ? "✔️ escapa" : "❌ agarrado"}</li>`;
			}
			html += "</ul><p style=\"font-size:0.85em\">Atacar o tentáculo também solta: Defesa 23, Fort +12, Ref +11 e 25 PV por tentáculo.</p>";
		} else {
			const mult = res.fosso ? 2 : 1;
			html = `<h3>Dano dos Tentáculos</h3><p>Fim do turno de quem está agarrado${res.fosso ? ", dentro do fosso (dobro)" : ""}.</p><ul>`;
			for (const a of alvos) {
				const d = await new Roll(`${2 * mult}d6[impacto] + ${2 * mult}d6[acido]`).evaluate();
				rolls.push(d);
				await a.applyDamageV2(d, 1);
				html += `<li>${a.name}: <b>${d.total}</b> (impacto e ácido, já com RD)</li>`;
			}
			html += "</ul>";
		}
		ChatMessage.create({ content: html, rolls });
	}

	async function macroAbrigos() {
		const abrigos = game.actors.filter((a) => a.getFlag("world", "fdtRole") === "abrigo");
		if (!abrigos.length) return ui.notifications.error("Atores de abrigo não encontrados (importe o conteúdo do módulo Fim dos Tempos).");
		const opcoes = abrigos.map((a) => `<option value="${a.id}">${a.name} · ${a.system.attributes.pv.value} PV</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Abrigos dos Inocentes" },
			content: `
				<div class="form-group"><label>Abrigo</label><select name="id">${opcoes}</select></div>
				<div class="form-group"><label>O que rolar</label><select name="acao">
					<option value="tocha">Tocha: 1d6 de dano e +1 foco de incêndio</option>
					<option value="incendio">Queima dos focos de incêndio (1d6 cada)</option>
					<option value="apagar">Apagar um foco</option>
					<option value="apagarTodos">Apagar todos os focos (efeito de área)</option>
					<option value="dano">Dano direto no abrigo</option></select></div>
				<div class="form-group"><label>Dano direto</label><input type="number" name="dano" value="0"></div>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const abrigo = abrigos.find((a) => a.id === res.id);
		const rolls = [];
		const focos = abrigo.system.resources.secondary;
		let dano = 0;
		let txt = "";
		if (res.acao === "tocha") {
			const d = await new Roll("1d6").evaluate();
			rolls.push(d);
			dano = d.total;
			await abrigo.update({ "system.resources.secondary.value": focos.value + 1 });
			txt = `Tocha atirada: <b>${dano}</b> de dano e <b>+1 foco de incêndio</b> (agora ${focos.value + 1}).`;
		} else if (res.acao === "incendio") {
			if (!focos.value) return ChatMessage.create({ content: `<h3>${abrigo.name}</h3><p>Nenhum foco de incêndio aceso.</p>` });
			const d = await new Roll(`${focos.value}d6`).evaluate();
			rolls.push(d);
			dano = d.total;
			txt = `<b>${focos.value}</b> foco(s) de incêndio: <b>${dano}</b> de dano de fogo nesta rodada.`;
		} else if (res.acao === "apagar" || res.acao === "apagarTodos") {
			const novo = res.acao === "apagar" ? Math.max(focos.value - 1, 0) : 0;
			await abrigo.update({ "system.resources.secondary.value": novo });
			txt = res.acao === "apagar" ? `Um foco apagado. Restam <b>${novo}</b>.` : "<b>Todos os focos apagados</b> por um efeito de área.";
		} else {
			dano = Number(res.dano) || 0;
			txt = `<b>${dano}</b> de dano no abrigo.`;
		}
		let html = `<h3>${abrigo.name}</h3><p>${txt}</p>`;
		if (dano) {
			const pv = abrigo.system.attributes.pv;
			const resto = pv.value - dano;
			await abrigo.update({ "system.attributes.pv.value": Math.max(resto, 0) });
			if (resto <= 0) {
				const mortos = Math.min(-resto, abrigo.system.resources.primary.value);
				if (mortos > 0) await abrigo.update({ "system.resources.primary.value": abrigo.system.resources.primary.value - mortos });
				html += `<p><b>O abrigo caiu!</b> Os atacantes entram e cada ponto de dano mata um inocente${mortos ? `: <b>${mortos} morto(s)</b> nesta rodada` : ""}. Restam <b>${abrigo.system.resources.primary.value}</b> inocentes.</p>`;
			} else html += `<p>O abrigo fica com <b>${resto} de 100 PV</b>. Enquanto tiver 1 PV, os inocentes não podem ser atacados.</p>`;
		}
		ChatMessage.create({ content: html, rolls });
	}

	const macro = (name, img, fn) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Aventura 5 · gerado por av5-maniacos-aberrantes.js\n(${fn.toString()})();`
	});
	const macros = await Macro.createDocuments([
		macro("Av5 · Noite no Inferno", "icons/svg/clockwork.svg", macroNoite),
		macro("Av5 · Aproximação", "icons/svg/eye.svg", macroAproximacao),
		macro("Av5 · Preparar o Forte", "icons/svg/hazard.svg", macroPreparar),
		macro("Av5 · Treinar Parceiros", `${T20I}/itens/gerais/parceiros.webp`, macroTreinar),
		macro("Av5 · Parceiros (ferimento e morte)", "icons/svg/blood.svg", macroParceiros),
		macro("Av5 · Bombardeio (2ª onda)", `${T20I}/itens/gerais/bomba.webp`, macroBombardeio),
		macro("Av5 · Horda Zumbi (3ª onda)", `${T20I}/ameacas/turba-de-zumbis.png`, macroHorda),
		macro("Av5 · Tentáculos Lefeu", `${T20I}/ameacas/otyugh.png`, macroTentaculos),
		macro("Av5 · Abrigos dos Inocentes", "icons/svg/village.svg", macroAbrigos)
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
		name: "Aventura 5 · A Noite dos Maníacos Aberrantes",
		folder: pasta.JournalEntry,
		flags: FLAGS(),
		pages: [
			pagina("Guia do Mestre", `
				<h2>Resumo</h2>
				<p>${L(atores.syvarian)} reuniu criminosos, cães do inferno, zumbis da Tormenta e lefeu para varrer as Colinas Centrais e derrubar o Forte Cabeça-de-Martelo. Os heróis precisam avisar e recrutar os NPCs que conheceram, preparar o Forte e sobreviver a <b>cinco ondas</b> até o amanhecer.</p>
				<h2>Fases</h2>
				<ol>
					<li><b>Corrida contra o relógio:</b> o ${L(itemPorNome("Pergaminho"))} dá o prazo (14 – 2d4 dias, de 12 a 6; os heróis só sabem se interrogarem um inimigo). Avisar e trazer NPCs.</li>
					<li><b>Construindo defesas:</b> defesas do Forte como pontos de mana e treino de parceiros (${L(atores.forte)}).</li>
					<li><b>Noite no inferno:</b> cinco ondas, das 18:00 às 05:00.</li>
					<li><b>Desfecho:</b> o que os capangas revelam e o caminho para Valkaria.</li>
				</ol>
				<h2>Fichas</h2>
				<ul>
					<li>${L(atores.bandoleiro)} (ND 1/2), ${L(atores.cao)} (ND 2), ${L(atores.irmao)} (ND 1), ${L(atores.bando)} (ND 4)</li>
					<li>${L(atores.uktril)}, ${L(atores.geraktril)} e ${L(atores.reishid)} (lefeu da 4ª onda)</li>
					<li>${L(atores.syvarian)} e ${L(atores.torgo)} (ND 5 cada)</li>
					<li>Perigos: ${L(atores.bombardeio)}, ${L(atores.horda)}, ${L(atores.tentaculos)}, ${L(atores.ygor)}</li>
					<li>Abrigos: ${atores.abrigos.map(L).join(", ")}</li>
					<li>${L(atores.corrompido)} (às 04:00)</li>
				</ul>
				<h2>Macros</h2>
				<ul>
					<li>${linkMacro("Noite no Inferno")}: avança hora a hora e posta tudo o que acontece (ondas, NPCs e cenas).</li>
					<li>${linkMacro("Aproximação")}: rola as sentinelas e diz quantas rodadas de antecedência o grupo tem.</li>
					<li>${linkMacro("Preparar o Forte")} e ${linkMacro("Treinar Parceiros")}: a fase de preparação.</li>
					<li>${linkMacro("Parceiros (ferimento")}: o 1d6 de ferimento no fim da rodada e as mortes no fim da onda.</li>
					<li>${linkMacro("Bombardeio")}, ${linkMacro("Horda Zumbi")}, ${linkMacro("Tentáculos")} e ${linkMacro("Abrigos")}: os perigos de cada onda.</li>
				</ul>
				<h2>Dica do autor</h2>
				<p>A noite é longa e tem muitas partes móveis. Se ficar pesado, simplifique: uma só espécie de inimigo por onda, só o ataque mais forte de cada um, menos ações de NPC. O autor também cortou os PV dos cães do inferno pela metade na mesa original.</p>`, 100),
			pagina("Handout · Ordens de Syvarian", `
				<blockquote><p><i>"Todas as tropas estão convocadas. Passaremos por cada aldeia, cada casebre, cada buraco onde o povo destas Colinas se esconde e vamos matar todos. Convergimos ao alvo principal em duas semanas. Todos juntos, para que não reste ninguém vivo lá dentro. O Forte Cabeça-de-Martelo vai cair.</i></p>
				<p><i>Syvarian"</i></p></blockquote>
				<p class="secret">O pergaminho pode aparecer em qualquer lugar e momento: com Zardu (numa versão que o recrimina por não cumprir a missão), deixado por Torgo na cabine da Harpia, ou nas instruções que Lorelei recebeu para se juntar ao ataque.</p>`, 200),
			pagina("Fase 1 · Recrutando os NPCs", `
				<p>Toda a primeira parte é o grupo escolhendo quem avisar e trazer. Se os jogadores forem passivos, diga na cara que todos os NPCs das Colinas morrerão e que o Forte sozinho não aguenta. Grupos ativos chegam sozinhos à conclusão (ou com testes de Guerra, Conhecimento ou Inteligência).</p>
				<p><b>Aviso do autor:</b> a mesa original dividiu o grupo por duas sessões. Funcionou, mas por pouco. Duas sessões com gente esperando é o limite da paciência da maioria; combine antes como fazer isso não ficar maçante.</p>
				<table>
					<tr><th>NPC</th><th>Como convencer</th></tr>
					<tr><td><b>Annabel</b> (Dahllan Daninhas)</td><td>Se é inimiga do grupo, não sai do carvalho (nem com 20 natural; só manda Grena levar Astelle). Neutra: sucesso automático se os heróis não tolerarem a rabugice dela e disserem que está se apegando mais à casa e à teimosia do que ao futuro de Astelle. Isso levará as irmãs a Valkaria, para Astelle estudar na Academia Arcana.</td></tr>
					<tr><td><b>Mabel LeBlanc</b></td><td>Se salvaram Gaspar, ela ouve qualquer coisa. Condição: levar toda a família. Bastien se recusa (precisa ser arrastado — qualquer dano faz Mabel desistir — ou convencido de que o Forte precisa dele). Clothilde precisa de garantias. Blanche precisa ser convencida pelos delírios dela.</td></tr>
					<tr><td><b>Gallobalt</b></td><td>Amizade ou cordialidade: aceitam na hora e todos (menos Alon) lutam. Se o grupo os hostilizou ou mexeu com o achbuld: bons testes sociais e, mesmo assim, só vão armados e com um herói como refém.</td></tr>
					<tr><td><b>Gormaggor</b></td><td>Não entende o pedido e nada nesta fase o afeta. Só algo <b>extraordinário</b>, que o mestre nunca teria imaginado, o faz eliminar uma onda inteira.</td></tr>
					<tr><td><b>Raguria</b></td><td>Aceita prontamente e é poderosa. Não convidada, escapa viva. Hostilizada, pode amaldiçoar o grupo.</td></tr>
					<tr><td><b>Arlo "Olho de Leite"</b></td><td>Muita interpretação e ótimos testes. Falar na língua dele (conspiração, o Reinado por trás de tudo) dá bônus.</td></tr>
					<tr><td><b>Mungo Joe</b></td><td>Aceita na hora. Levando o alambique, ele ajuda Belinda a fazer poções.</td></tr>
					<tr><td><b>Jonid, o Homem-Bode</b></td><td>Mais fácil do que parece: segue o grupo quase como animal domesticado.</td></tr>
					<tr><td><b>Erneshia</b></td><td>Aceita, mas insiste em levar os "espécimes" e as anotações sobre o Diabo das Colinas.</td></tr>
					<tr><td><b>Cletus Rigby</b></td><td>Recusa terminantemente. Com confiança já conquistada, boa interpretação e ótimos testes: convença-o de que a vitória dos vilões traz mais bagunça e intrusos.</td></tr>
					<tr><td><b>Nada Mais que a Verdade</b></td><td>Aceita e ainda avisa um NPC no lugar do grupo, com sucesso automático (exceto Gormaggor e Cletus).</td></tr>
					<tr><td><b>Elmer</b></td><td>Ótimos testes ou tentação com achbuld. No Forte, é um estorvo e elimina um parceiro. Livre do vício, vira extraordinário.</td></tr>
					<tr><td><b>Abner</b></td><td>Quase nenhum argumento: acha que foi Khalmyr que mandou os heróis.</td></tr>
					<tr><td><b>Quimby</b></td><td>Quer se salvar primeiro. Devotos de Hyninn ajudam, mas ainda exige testes. <b>Enganação nunca funciona</b>, nem com 20 natural: só sinceridade.</td></tr>
				</table>`, 300),
			pagina("Fase 2 · Defesas e Parceiros", `
				<p>Todas as regras de preparação estão no ator ${L(atores.forte)}: construir defesas, treinar parceiros, consertar a paliçada, sentinelas e as ordens dos parceiros.</p>
				<h3>Resumo</h3>
				<ul>
					<li><b>Defesas:</b> um teste de Ofício ou Guerra por dia e por personagem (que não faz mais nada). CD 20 = 1d4 de mana; +1d4 por cada 10 acima. O total paga magias que representam as defesas. Elas são mundanas: não podem ser anuladas como magia.</li>
					<li><b>Treino:</b> só NPCs com nome e com destaque anterior. Cada professor treina até Carisma alunos, por 1d6 dias. Professor: dois testes CD 20; aluno: Inteligência CD 10. Resultado: parceiro <b>iniciante</b>.</li>
					<li><b>Parceiros:</b> cada PJ comanda até 6 por rodada, uma ordem cada (Ajudar, Mover, Atacar). Fim da rodada: 1d6; se der ≤ parceiros usados, um é ferido. Fim da onda: um dado por ferido, ímpar morre.</li>
					<li><b>Salvar um parceiro:</b> tire de jogo permanentemente um parceiro médico antes de rolar a morte.</li>
					<li><b>Parceiro íntimo:</b> um por herói; pode repetir um tipo de bônus que outro parceiro já dá.</li>
				</ul>
				<p>A lista completa de parceiros do livro está na pasta de itens, um item por NPC, já com o poder de parceiro do compêndio do sistema.</p>
				<h3>Discurso de Belinda</h3>
				<blockquote><p><i>"Quem diria que o roubo das minhas armas levaria a isso, hein? (...) Esta batalha não é só sobre invasores contra habitantes locais. É sobre parasitas contra gente que se esforça! E os parasitas sempre vão perder, porque são perdedores. Então, se tiverem que entregar a vida para defender o Forte... Não entreguem, vendam! E vendam bem caro! Um brinde! E não se preocupem, essa rodada é por conta da casa."</i></p></blockquote>`, 400),
			pagina("Fase 3 · As Cinco Ondas", `
				<p>Use a macro ${linkMacro("Noite no Inferno")} para avançar hora a hora.</p>
				<table>
					<tr><th>Hora</th><th>O que acontece</th></tr>
					<tr><td><b>18:00</b></td><td><b>1ª onda (combate):</b> 40 bandoleiros, 4 cães do inferno, 4 irmãos da Companhia. 20 escalam (3 rodadas, desprevenidos), 20 abrem buracos em duplas; cada abertura solta um cão por rodada (até 4), depois os irmãos. <b>Vitória:</b> todos os cães e irmãos mais 30 bandoleiros.</td></tr>
					<tr><td><b>19:00</b></td><td>Discurso de Syvarian e as revelações sobre ele.</td></tr>
					<tr><td><b>20:00</b></td><td>Fermond tenta negociar; Isabrine o nocauteia se for exposto. Belinda oferece poções (noite inteira na oficina).</td></tr>
					<tr><td><b>21:00</b></td><td><b>2ª onda (perigo complexo):</b> bombardeio. Desarmar 4 explosivos em 5 rodadas.</td></tr>
					<tr><td><b>22:00</b></td><td>Nadine busca o ${L(itemPorNome("Esconderijo"))} (estendido de Cavalgar CD 20, Cavalgar +8).</td></tr>
					<tr><td><b>23:00</b></td><td>Sopa LeBlanc: uma hora por grupo. Raguria e Mabel brigam; mediadas, cozinham em metade do tempo.</td></tr>
					<tr><td><b>00:00</b></td><td><b>3ª onda (perigo complexo):</b> a horda zumbi, 400 de dano. Nadine volta avisando (+1 rodada de preparo). Cuidado com o Homem-Bode.</td></tr>
					<tr><td><b>01:00</b></td><td>Alon desaparece (Investigação CD 18, 20 e 22; uma hora). Sem busca, os Gallobalt vão embora. ${L(itemPorNome("Chá"))} de Raguria.</td></tr>
					<tr><td><b>02:00</b></td><td>Moira reza: Religião 30 ou mais e ela vira paladina (11 PM, 3º nível, Compaixão e Caridade: 1 PM e movimento curam 2d6+1 em alcance curto). Com Mungo Joe, Belinda entrega poções de até 2º círculo.</td></tr>
					<tr><td><b>03:00</b></td><td><b>4ª onda (combate):</b> 6 bandos desesperados, 10 irmãos, 5 uktril, 3 geraktril, 2 reishid. Inimigos atacam os abrigos; tentáculos podem surgir.</td></tr>
					<tr><td><b>04:00</b></td><td>Os três LeBlanc enlouquecem. Morgan pede para morrer lutando (ou decide viver). Cletus dá um item mágico. Belinda traz Ygor.</td></tr>
					<tr><td><b>05:00</b></td><td><b>5ª onda (combate):</b> Syvarian e Torgo. Ygor explode e o Dr. Vesper se revela.</td></tr>
				</table>
				<h3>Aproximação (ondas 1 a 4)</h3>
				<p>Sentinela da esquerda vê o que vem da esquerda e da frente; a da direita, o que vem da direita e da frente. Guerra ou Percepção CD 20 (CD 25 na 4ª onda): 3 rodadas de antecedência; falha, 2; falha por 10 (ou 5 na 4ª), 1. Sentinela destacada não ativa defesas.</p>`, 500),
			pagina("Handout · Discurso de Syvarian (19:00)", `
				<blockquote><p><i>"Vocês escolheram morrer. Todos aqui tiveram chance de ir embora. Tiveram chance de aceitar ouro em troca de suas terras miseráveis, de deixar este lugar que são incapazes de sequer compreender. Estas Colinas não pertencem mais aos dejetos que as infestaram durante séculos. Elas nunca pertenceram ao Reinado. Elas já são nossas. Por ouro ou por sangue, com acordos ou com cadáveres, as Colinas Centrais têm novos mestres. Soldados! Aventureiros! Esta é sua última chance. Deem as costas aos esfarrapados, canibais, loucos e isolacionistas! Parem de proteger essa escória. Permitirei que saiam em paz. Apenas... saiam."</i></p></blockquote>
				<h3>Revelações (testes durante a conversa)</h3>
				<ul>
					<li><b>Guerra ou Intuição CD 20:</b> não se porta como criminoso; parece oficial treinado numa marinha muito avançada.</li>
					<li><b>Percepção ou Investigação CD 20:</b> semelhanças físicas muito específicas com Zardu (sem parentesco). Sucesso extraordinário: o Dr. Vesper tem as mesmas.</li>
					<li><b>Conhecimento ou Ofício (armeiro) CD 15:</b> o escafandro protege contra frio extremo e é vedado, sem deixar ar escapar.</li>
					<li><b>Intuição ou Religião CD 20:</b> chama os habitantes de escória, mas trata as Colinas em si com certa reverência.</li>
					<li><b>Intuição CD 20:</b> Torgo está sob comando dele, mas não o vê como autoridade; não são próximos.</li>
					<li><b>Guerra ou Intuição CD 20:</b> ele e os capangas estão confiantes demais; devem ter truques na manga.</li>
					<li><b>Misticismo CD 25:</b> o relógio na testa tem poder mágico e está ligado ao kliren.</li>
					<li><b>Conhecimento, Ofício (armeiro/engenhoqueiro) ou Percepção CD 30:</b> partes do escafandro e da arma lembram os inventos do Dr. Vesper.</li>
				</ul>
				<p>Se o grupo matar ou ferir gravemente Syvarian agora, a 2ª onda começa imediatamente. Se só começarem um combate, a 2ª onda vem reforçada por Syvarian e Torgo.</p>`, 600),
			pagina("Handout · Dr. Vesper (05:00)", `
				<blockquote>
				<p><i>"Vocês relutam! Protegem o inferno que conhecem, sem saber que estou lhes oferecendo a felicidade eterna! Rendam-se e os perdoarei. Eu não os odeio. Não odeio ninguém. Eu amo todas as pessoas."</i></p>
				<p><i>"Tudo se transforma e isso gera sofrimento. Tudo morre. Até mesmo um deus pode perder sua divindade. Foi isso que compreendi quando tive contato com o Cofre Encarnatório de Ganymere! Foi isso que senti ao viver as vidas de milhares de gnomos! Tudo decai, tudo se deteriora. Tudo tem fim, e o culpado é um só: o Tempo."</i></p>
				<p><i>"Vocês veem os lefeu como insetoides, mas eu sou capaz de enxergar sua verdadeira forma! A Tormenta não é algo a ser reverenciado, é uma ferramenta! E vou usá-la para cumprir minha missão. A única missão que importa, a única batalha que deve ser travada."</i></p>
				<p><i>"Conquistarei o fim da dor, o fim da morte, o fim da tristeza. O fim do fim."</i></p>
				<p><i>"O fim do tempo."</i></p>
				</blockquote>
				<p>E Syvarian, se o grupo já tinha percebido que o Dr. Vesper era o vilão desde o começo:</p>
				<blockquote><p><i>"Vocês estiveram na presença de um gênio e ignoraram isso! (...) O Dr. Vesper é o abençoado que vai salvar a Criação de seu maior inimigo, o visionário que vai arrastar Arton ao paraíso! Não importa quantos cadáveres precisem pavimentar a estrada para essa nova era! Não importa que eu mesmo morra! O Dr. Vesper triunfará!"</i></p></blockquote>
				<p>Garanta que a imagem do Dr. Vesper revele tudo: o plano, o histórico e as motivações. É a hora do grande discurso vilanesco.</p>`, 700),
			pagina("Desfecho", `
				<ul>
					<li><b>Syvarian e Torgo:</b> a proposta é que morram. Capturados, os implantes os matam antes de revelarem qualquer coisa.</li>
					<li><b>Capangas:</b> muito mais fáceis e úteis de capturar. Revelam tudo com testes sociais opostos contra Intuição ou Vontade. Você pode decidir que há capangas que não participaram e se rendem ao ver os líderes caírem.</li>
				</ul>
				<h3>O que os capangas sabem</h3>
				<ul>
					<li>São desesperados de Deheon, Zakharov, Ahlen e vizinhos, querendo entrar numa grande organização. Só os de pistola já eram da Companhia dos Irmãos.</li>
					<li>Syvarian era capitão ("gêmeo") da Companhia e subiu meteoricamente. Na mesma época, Paollus, o irmão mais velho, mudou radicalmente: de cauteloso para agressivo, e começou uma guerra contra a Casa Blasanov pelo achbuld. Syvarian ganhou autonomia enorme e a permissão inédita de operar fora de Valkaria.</li>
					<li>A equipe dele foi treinada em armas de fogo e sofreu experimentos nas mãos do Dr. Vesper. Vários capangas receberam implantes para coisas prosaicas, como ver no escuro.</li>
					<li>Todos estão apavorados com a Tormenta: nem os mais empedernidos estavam prontos para compactuar com a Tempestade Rubra. Alguns ficam aliviados de serem capturados.</li>
					<li>Ninguém sabe quem era Torgo nem de onde veio. Syvarian parecia já conhecê-lo, mas não eram íntimos; o golem falava diferente e parecia fora da cadeia de comando.</li>
					<li>Tudo aponta para envolvimento pesado da Companhia dos Irmãos, mas a organização parece estar sendo infiltrada. A tecnologia do Dr. Vesper é avançada demais, não é coisa de criminoso nem de Valkaria.</li>
				</ul>
				<h3>Epílogo</h3>
				<p>Se o grupo não decidir ir a Valkaria sozinho, Belinda sugere: eles serão apadrinhados pelo primo dela, <b>Blixto Arting</b>. Ela também manda uma carta para a namorada <b>Felicia</b> e, se quiserem, dá contatos que compram os mosquetes e armas ilegais recolhidos como tesouro. Nada sugere pressa — os planos de Syvarian foram frustrados.</p>
				<p><b>Se todos morrerem:</b> Syvarian toma as Colinas Centrais e o plano do Dr. Vesper avança mais rápido. A campanha continua com outro grupo, que ouve falar do sacrifício heroico no Forte Cabeça-de-Martelo.</p>`, 800)
		]
	});

	ui.notifications.info("Aventura 5 criada: ameaças, perigos, parceiros, diário e 9 macros. Veja a pasta \"" + NOME_PASTA + "\".");
})();
