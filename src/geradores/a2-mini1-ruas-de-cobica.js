/* =====================================================================
 * FIM DOS TEMPOS · ARCO 2 · MINI-AVENTURA 1 · "RUAS DE COBIÇA"
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Arco 2 · Mini 1 · Ruas de Cobiça" com:
 *      - Ameaças: os seis aventureiros-capangas (guerreiro, clérigo, caçador, ladino, mago e
 *        cavaleiro) e o Cobrador da Ploigoníada.
 *      - Itens: os 12 itens especiais efêmeros e as comidas especiais que os capangas derrubam.
 *      - Tabelas: Aventureiros-Capangas (1d6), Itens Especiais (1d12) e Comidas Especiais (1d8).
 *      - Diário com guia, a mensagem da Ploigoníada, a rua, o Cobrador e o desfecho.
 *      - Macros: Mensagem da Ploigoníada, Andar e Bater, Cobrador em Combate e Desfecho.
 *   3. Blixto Arting é o ator da Aventura 0 (não é recriado aqui).
 *   4. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "a2mini1".
 *
 * Feito a partir do código do sistema (1.6.4, out/2026). Validado no Foundry simulado do
 * módulo giriarpg-fim-dos-tempos; veja o guia a2-mini1-ruas-de-cobica.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "a2mini1";
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
			window: { title: "Mini-Aventura 1 do Arco 2: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para a Mini-Aventura 1 do Arco 2.</p>
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
	const NOME_PASTA = "FdT · Arco 2 · Mini 1 · Ruas de Cobiça";
	const pasta = {};
	for (const type of ["Actor", "Item", "JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#8a6d1f", flags: FLAGS() })).id;
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
	const ICO = {
		guerreiro: `${T20I}/ameacas/bandido.png`,
		clerigo: `${T20I}/ameacas/capelao-de-guerra.png`,
		cacador: `${T20I}/racas/humano.webp`,
		ladino: `${T20I}/ameacas/chefe-bandido.png`,
		mago: `${T20I}/racas/elfo.webp`,
		cavaleiro: `${T20I}/ameacas/guerreiro-de-chifres.png`,
		cobrador: `${T20I}/ameacas/golem-de-ferro.png`,
		marreta: `${EQ}/marreta.webp`,
		martelo: `${EQ}/martelo-de-guerra.webp`,
		arco: `${EQ}/arco-longo.webp`,
		espadaCurta: `${EQ}/espada-curta.webp`,
		adaga: `${EQ}/adaga.webp`,
		bastarda: `${EQ}/espada-bastarda.webp`,
		chifres: `${T20I}/poderes/ameacas/chifres.webp`,
		furtivo: `${T20I}/poderes/ameacas/ataque-furtivo.webp`,
		pergaminho: `${GE}/pergaminho.webp`,
		comida: `${GE}/refeicao-comum.webp`,
		trobo: `${GE}/carnes.webp`
	};

	/* ------------------------------------------------------------------ */
	/* 2. Ameaças                                                           */
	/* ------------------------------------------------------------------ */
	const atores = {};
	const CAPANGA = { nd: 5, cd: 20, tipo: "hum", papel: "lackey", tesouro: "Nenhum." };
	const BIO_CAPANGA = "Aventureiro aposentado ou fracassado do Altar de Heróis, contratado pelo Cobrador para guardar a rua. A função real é atrasar o grupo e forçá-lo a gastar recursos. Via de regra, ataca um personagem que chegue a 5 quadrados de distância. Se os heróis mostrarem o dinheiro do resgate, deixam passar.";
	const COMIDA = "Ao ser derrotado, 20% de chance de deixar cair uma comida especial (macro <i>Andar e Bater</i>).";

	atores.guerreiro = await criarNPC({
		...CAPANGA, name: "Guerreiro Capanga", role: "guerreiro", img: ICO.guerreiro, raca: "humano",
		atr: { for: 3, des: 1, con: 2, int: -1, sab: 0, car: -1 }, pv: 40, def: 23, walk: 9,
		pericias: { inic: 5, perc: 4, fort: 16, refl: 11, vont: 6, atle: 9, luta: 20 },
		ataquesTxt: "Marreta ×2 +20 (4d4+19).", equipTxt: "Couro batido, marreta.",
		bio: p(BIO_CAPANGA, COMIDA),
		items: [
			arma("Marreta", ICO.marreta, { dano: "4d4+19", tipo: "impacto", desc: p("Dois ataques por ação agredir.") }),
			poder("Sequência Debilitante", ICO.marreta, p("Uma criatura atingida pelos <b>dois ataques</b> corpo a corpo na mesma rodada sofre <b>–5 em testes de perícia por 1 rodada</b>. Botão no card."),
				{ exec: "passive", effects: [fx("Sequência debilitante (–5 em perícias)", ICO.marreta, [["system.modificadores.pericias.geral", "-5"]], { duration: { value: 1, units: "rounds" } })] })
		]
	});
	atores.clerigo = await criarNPC({
		...CAPANGA, name: "Clérigo Capanga", role: "clerigo", img: ICO.clerigo, raca: "anão",
		atr: { for: 1, des: -1, con: 2, int: 0, sab: 3, car: 0 }, pv: 42, def: 23, walk: 6, sentidos: ["escuro"],
		pericias: { inic: 3, perc: 7, fort: 11, refl: 6, vont: 16, reli: 9, luta: 20 },
		ataquesTxt: "Martelo de guerra +20 (2d8+19, ×3).", equipTxt: "Brunea, escudo leve, martelo de guerra, símbolo sagrado.",
		bio: p(BIO_CAPANGA, COMIDA),
		items: [
			arma("Martelo de Guerra", ICO.martelo, { dano: "2d8+19", tipo: "impacto", critX: 3 }),
			magia("Curar Ferimentos", `${MG}/curar-ferimentos.webp`, p("<b>Movimento.</b> Cura <b>4d8+4 PV</b> de uma criatura em até 9m. Mire o alvo e use Aplicar Cura no card."),
				{ exec: "move", circulo: 1, alcance: "short", rolls: [["Cura", [["4d8+4", "curapv"]]]] })
		]
	});
	atores.cacador = await criarNPC({
		...CAPANGA, name: "Caçador Capanga", role: "cacador", img: ICO.cacador, raca: "humano",
		atr: { for: 0, des: 3, con: 2, int: -1, sab: 1, car: -1 }, pv: 38, def: 21, walk: 9,
		pericias: { inic: 7, perc: 5, fort: 11, refl: 16, vont: 6, acro: 9, pont: 20 },
		ataquesAdTxt: "Arco longo ×2 +20 (2d8+19, ×3).", equipTxt: "Arco longo, couro batido, flechas ×20.",
		bio: p(BIO_CAPANGA, COMIDA),
		items: [
			distancia("Arco Longo", ICO.arco, { dano: "2d8+19", tipo: "perfuracao", critX: 3, alcance: "medium", desc: p("Dois ataques por ação agredir.") }),
			poder("Disparo Retardante", ICO.arco, p("Uma criatura atingida pelo ataque à distância é <b>empurrada 3m</b> na direção oposta. <b>Movimento.</b>"), { exec: "move" })
		]
	});
	atores.ladino = await criarNPC({
		...CAPANGA, name: "Ladino Capanga", role: "ladino", img: ICO.ladino, raca: "",
		atr: { for: 1, des: 3, con: 2, int: -1, sab: 0, car: -1 }, pv: 40, def: 22, walk: 12,
		pericias: { inic: 7, perc: 4, fort: 6, refl: 16, vont: 11, furt: 9, luta: 20, pont: 20 },
		resTxt: "Evasão.",
		ataquesTxt: "Espada curta +20 (2d6+19, 19).", ataquesAdTxt: "Adaga +20 (2d4+19, 19).", equipTxt: "Couro batido, espada curta.",
		bio: p(BIO_CAPANGA, COMIDA),
		items: [
			arma("Espada Curta", ICO.espadaCurta, { dano: "2d6+19", tipo: "perfuracao", critM: 19,
				effects: [aoUsar("Ataque Furtivo (+3d6)", ICO.furtivo, [["dano", "3d6"]], ["attack"])] }),
			distancia("Adaga", ICO.adaga, { dano: "2d4+19", tipo: "perfuracao", critM: 19, alcance: "short",
				effects: [aoUsar("Ataque Furtivo (+3d6)", ICO.furtivo, [["dano", "3d6"]], ["attack"])] }),
			poder("Ataque Furtivo", ICO.furtivo, p("+3d6 contra alvos desprevenidos ou flanqueados. Marque o aprimoramento na janela de ataque."), { exec: "passive" }),
			poder("Estocada Atordoante", ICO.furtivo, p("Uma criatura atingida pelo Ataque Furtivo fica <b>atordoada por 1 rodada</b> (só uma vez por cena). <b>Fortitude CD 20</b> evita. Botão no card."),
				{ exec: "passive", save: "Fortitude CD 20 evita", effects: [cond("Atordoado")] }),
			poder("Evasão", "icons/svg/wing.svg", p("Passando num teste de Reflexos que reduziria o dano à metade, não sofre dano."), { exec: "passive" })
		]
	});
	atores.mago = await criarNPC({
		...CAPANGA, name: "Mago Capanga", role: "mago", img: ICO.mago, raca: "elfo",
		atr: { for: -1, des: 2, con: 0, int: 3, sab: 0, car: 0 }, pv: 36, def: 21, walk: 12, sentidos: ["penumbra"],
		pericias: { inic: 6, perc: 6, fort: 6, refl: 11, vont: 16, mist: 9 },
		resTxt: "Escudo Arcano (RD 30 contra dano mundano).",
		ataquesAdTxt: "Raio Arcano (3d12 de fogo, Ref CD 22).", equipTxt: "Nenhum.",
		bio: p(BIO_CAPANGA, COMIDA),
		effects: [chave("Escudo Arcano (RD 30, dano mundano)", `${MG}/armadura-arcana.webp`, [["system.tracos.resistencias.dano.bonus", "30"]], true,
			"RD 30 só contra dano mundano. Se sofrer dano mágico, desligue por 1 rodada.")],
		items: [
			poder("Raio Arcano", `${MG}/seta-infalivel.webp`, p("<b>Padrão.</b> Uma criatura em alcance médio sofre <b>3d12 de fogo</b> e fica <b>em chamas</b>. <b>Reflexos CD 22</b> reduz à metade e evita a condição."),
				{ exec: "action", alcance: "medium", save: "Reflexos CD 22 reduz à metade e evita a condição", rolls: [["Dano", [["3d12", "fogo"]]]], effects: [emChamas()] }),
			poder("Escudo Arcano", `${MG}/armadura-arcana.webp`, p("Redução de dano 30, mas apenas contra dano mundano. Se sofrer dano mágico, perde a redução por 1 rodada (efeito na aba de efeitos)."), { exec: "passive" })
		]
	});
	atores.cavaleiro = await criarNPC({
		...CAPANGA, name: "Cavaleiro Capanga", role: "cavaleiro", img: ICO.cavaleiro, raca: "minotauro",
		atr: { for: 3, des: 0, con: 3, int: -1, sab: 0, car: -1 }, pv: 50, def: 35, walk: 6, sentidos: ["faro"],
		pericias: { inic: 4, perc: 4, fort: 16, refl: 6, vont: 11, atle: 9, luta: 20 },
		ataquesTxt: "Espada bastarda +20 (2d10+19, 19) e chifres +20 (2d6+19).", equipTxt: "Brunea, escudo grande, espada bastarda.",
		bio: p(BIO_CAPANGA, COMIDA),
		items: [
			arma("Espada Bastarda", ICO.bastarda, { dano: "2d10+19", tipo: "corte", critM: 19 }),
			arma("Chifres", ICO.chifres, { dano: "2d6+19", tipo: "perfuracao" }),
			poder("Chifrada Oportuna", ICO.chifres, p("<b>Reação, 1×/rodada.</b> Quando uma criatura erra um ataque corpo a corpo contra ele, faz um ataque de chifres contra ela."), { exec: "reaction" }),
			poder("Guarda Aberta", ICO.bastarda, p("Quando erra um ataque com arma empunhada, sofre <b>–10 na Defesa</b> contra o alvo desse ataque por 1 rodada."),
				{ exec: "passive", effects: [fx("Guarda aberta (–10 Defesa)", ICO.bastarda, [["system.attributes.defesa.bonus", "-10"]], { duration: { value: 1, units: "rounds" } })] })
		]
	});

	atores.cobrador = await criarNPC({
		name: "Cobrador da Ploigoníada",
		tokenName: "Cobrador",
		role: "cobrador",
		link: true,
		img: ICO.cobrador,
		nd: 9,
		cd: 28,
		tipo: "con",
		raca: "inevitável",
		papel: "solo",
		atr: { for: 5, des: 2, con: 3, int: 0, sab: 3, car: 1 },
		pv: 400,
		pm: 52,
		def: 33,
		walk: 9,
		sentidos: ["escuro"],
		pericias: { inic: 6, perc: 12, fort: 13, refl: 7, vont: 19, conh: 8, dipl: 9, intu: 9, mist: 8, nobr: 8, reli: 9, luta: 21 },
		res: { dano: { base: 5 }, frio: { imunidade: true } },
		resTxt: "Cura acelerada 5, imunidade a frio, redução de dano 5, resistência a magia +5.",
		ataquesTxt: "Espada bastarda ×2 +21 (1d10+16, 19, mais 2d6 de frio).",
		equipTxt: "Espada bastarda, loriga segmentada.",
		bio: p("Um tipo específico de inevitável (Deuses de Arton, p. 278) com a única missão de cobrar devedores inadimplentes. Não se preocupa com justiça, mas segue a letra da lei. Só potências econômicas como a Ploigoníada podem invocar um destes agentes burocráticos letais.",
			"Invocado pela cláusula do contrato da Roca, não achou Ghorskander (protegido por magia) e foi atrás de quem estava mais perto dele: os personagens. Como eles não podem pagar, raptou quem talvez possa: <b>Blixto Arting</b>.",
			"<i>\"Vocês estão em dívida com a Ploigoníada. Para pagá-la, apresentem o valor previamente combinado. Para morrer, por favor continuem lutando.\"</i>",
			"Magias como um clérigo de 9º nível (CD 28). Macro <i>Cobrador em Combate</i>."),
		effects: [aoUsar("Resistência a magia (+5)", `${MG}/resistencia-a-energia.webp`, [["roll", 5]], ["skill"], ["Fortitude", "Reflexos", "Vontade"])],
		items: [
			arma("Espada Bastarda", ICO.bastarda, { dano: "1d10+16", tipo: "corte", critM: 19, extra: [["2d6", "frio"]], desc: p("Dois ataques por ação agredir.") }),
			poder("Cura Acelerada 5", "icons/svg/regen.svg", p("Recupera 5 PV no início de cada turno (macro <i>Cobrador em Combate</i>)."), { exec: "passive" }),
			poder("Analisar Suspeito", `${MG}/visao-da-verdade.webp`, p("<b>Completa.</b> Analisa uma criatura em alcance médio. Até o fim do dia, recebe <b>+2 em testes de perícia</b> contra ela."),
				{ exec: "full", alcance: "medium", effects: [aoUsar("Suspeito analisado (+2)", `${MG}/visao-da-verdade.webp`, [["roll", 2]], ["skill", "attack"])] }),
			poder("Encontrar o Culpado", `${MG}/localizacao.webp`, p("Sempre sabe onde está a criatura que deve caçar, como sob <i>Localização</i> com área de toda Arton."), { exec: "passive" }),
			poder("Ler Seus Direitos", ICO.pergaminho, p("<b>Movimento, 3 PM.</b> Uma criatura em alcance curto fica <b>pasma por 1 rodada</b>, ou <b>atordoada por 1 rodada</b> se for a criatura que ele deve caçar. <b>Fortitude CD 28</b> evita."),
				{ exec: "move", custo: 3, alcance: "short", save: "Fortitude CD 28 evita", effects: [cond("Pasmo"), cond("Atordoado")] }),
			poder("Negar Recurso", ICO.pergaminho, p("<b>Movimento, 3 PM.</b> Uma criatura em alcance médio faz <b>Vontade CD 28</b>. Se falhar, não pode usar uma habilidade à escolha do Cobrador até o fim da cena (cada magia conta como uma habilidade). Uma criatura só tem uma habilidade negada por vez."),
				{ exec: "move", custo: 3, alcance: "medium", save: "Vontade CD 28 evita" }),
			poder("Visão da Justiça", `${MG}/visao-da-verdade.webp`, p("Permanentemente sob o efeito básico de <i>Visão da Verdade</i>."), { exec: "passive" }),
			magia("Disfarce Ilusório", `${MG}/disfarce-ilusorio.webp`, p("<b>Padrão, 3 PM.</b> Até o fim da cena, muda a própria aparência (equipamento, odores, altura, voz...). +20 em Enganação para disfarce (Vontade desacredita)."),
				{ exec: "action", custo: 3, circulo: 1, tipoMagia: "arc", escola: "ilu" }),
			magia("Dissipar Magia", `${MG}/dissipar-magia.webp`, p("<b>Padrão, 3 PM.</b> Escolhe uma criatura, objeto ou esfera de 3m em alcance médio e faz um teste de <b>Misticismo</b>. Todas as magias no alvo com CD igual ou menor que o resultado são dissipadas."),
				{ exec: "action", custo: 3, circulo: 2, alcance: "medium", escola: "abj" }),
			magia("Imobilizar", `${MG}/imobilizar.webp`, p("<b>Padrão, 7 PM.</b> Uma criatura em alcance curto fica <b>paralisada</b> (<b>Vontade CD 28</b>: fica lenta). A cada rodada, a vítima pode gastar uma ação completa para um novo teste de Vontade; se passar, liberta-se."),
				{ exec: "action", custo: 7, circulo: 3, alcance: "short", escola: "enc", save: "Vontade CD 28 muda para lenta", effects: [cond("Paralisado"), cond("Lento")] }),
			magia("Silêncio", `${MG}/silencio.webp`, p("<b>Padrão, 3 PM, sustentada.</b> Esfera de 6m em alcance médio. Criaturas na área ficam <b>surdas</b> e não podem lançar magias."),
				{ exec: "action", custo: 3, circulo: 2, alcance: "medium", area: "esfera de 6m", escola: "ilu", effects: [cond("Surdo")] })
		]
	});
	const blixto = game.actors.find((a) => a.getFlag("world", "fdt") === "a2av0" && a.getFlag("world", "fdtRole") === "blixto");

	/* ------------------------------------------------------------------ */
	/* 3. Itens                                                             */
	/* ------------------------------------------------------------------ */
	const itemDoc = (d, role) => ({ ...d, folder: pasta.Item, flags: FLAGS(role) });
	const EFEMERO = p("<b>Item efêmero da Ploigoníada.</b> Cinco usos (a quantidade conta os usos, inclusive os dos capangas). Largado e não apanhado por 3 rodadas, ou não empunhado ativamente por 3 rodadas, se desfaz. Não pode ser guardado. Um personagem só empunha um destes itens por vez. Quem empunha usa as próprias estatísticas de ataque, modificadas pelo item.");
	const especial = (n, name, img, desc, effects = []) => itemDoc({
		name, type: "equipamento", img, effects,
		system: { description: { value: p(desc) + EFEMERO }, qtd: 5, preco: 0, peso: 0, espacos: 1 }
	}, `especial-${n}`);
	const usoAtk = (name, img, changes) => aoUsar(name, img, changes, ["attack"]);
	const ESPECIAIS = [
		especial(1, "Espada Exagerada", `${EQ}/montante.webp`, "Grande demais até para duas mãos, mas é uma arma comum e pode ser empunhada com uma só. <b>+1d10 no dano corpo a corpo.</b>",
			[usoAtk("Espada exagerada (+1d10)", `${EQ}/montante.webp`, [["dano", "1d10"]])]),
		especial(2, "Faca Veloz", `${EQ}/adaga.webp`, "Este punhal está ansioso por perfurar barrigas. Na ação agredir, <b>um ataque adicional</b> uma vez por rodada."),
		especial(3, "Escudo Bloqueador", `${EQ}/escudo-leve.webp`, "Pode ser usado sem proficiência em escudos. Sempre que for atingido por um ataque, faz um <b>teste de Luta oposto ao resultado do ataque</b>; se vencer, evita o ataque."),
		especial(4, "Tijolo", `${EQ}/pedras.webp`, "Às vezes o mais simples é o mais eficiente. Uma criatura atingida por um ataque à distância de tijolo fica <b>atordoada por 1 rodada</b> (só uma vez por cena; <b>Fortitude CD 25</b> evita).",
			[cond("Atordoado")]),
		especial(5, "Chicote da Rasteira", `${EQ}/chicote.webp`, "Bom para enredar os pés dos inimigos. Ao acertar um ataque corpo a corpo, pode fazer a manobra <b>derrubar como ação livre</b>."),
		especial(6, "Besta Maldosa", `${EQ}/besta-leve.webp`, "Os virotes desta besta leve procuram olhos e gargantas. Ataques à distância recebem <b>+4 na margem de ameaça e +2 no multiplicador</b> de crítico.",
			[usoAtk("Besta maldosa (+4 margem, +2 multiplicador)", `${EQ}/besta-leve.webp`, [["criticoM", "-4"], ["criticoX", "2"]])]),
		especial(7, "Maça Exagerada", `${EQ}/maca-de-guerra.webp`, "Parece a coluna de um templo com uma bola de demolição na ponta, mas é uma arma comum de duas mãos. <b>+2d12 no dano corpo a corpo com armas de duas mãos.</b>",
			[usoAtk("Maça exagerada (+2d12)", `${EQ}/maca-de-guerra.webp`, [["dano", "2d12"]])]),
		especial(8, "Tomo Fumegante", `${GE}/tomo-hermetico.webp`, "A única palavra escrita é <i>\"Fogo!\"</i>. Magias que causam dano causam <b>+2d6 de fogo</b>.",
			[aoUsar("Tomo fumegante (+2d6 fogo)", `${GE}/tomo-hermetico.webp`, [["dano", "2d6[fogo]"]], ["spell"])]),
		especial(9, "Pergaminho Piedoso", `${GE}/pergaminho.webp`, "Só duas palavras: <i>\"Hoje não!\"</i>. Magias de cura não rolam dados: <b>curam sempre o máximo</b>."),
		especial(10, "Varinha Repetitiva", `${GE}/varinha-arcana.webp`, "Repete qualquer magia de até 3º círculo usada neste turno, <b>no turno seguinte</b> do conjurador, sem gastar PM nem ação."),
		especial(11, "Aspersório Cheiroso", `${GE}/agua-benta.webp`, "Uma magia divina afeta o <b>dobro de alvos</b> ou o <b>dobro da área</b> normal."),
		especial(12, "Escudo Esbodegado", `${EQ}/escudo-pesado.webp`, "Este enorme escudo parece prestes a se quebrar, mas aguenta alguns golpes. Pode ser usado sem proficiência. <b>Absorve 50 pontos de dano</b> no total (o usuário não sofre dano; o escudo se destrói quando absorve 50). Use a quantidade para contar o dano restante.")
	];
	ESPECIAIS[11].system.qtd = 50;

	const UM_DIA = { value: 86400, units: "seconds" };
	const DESFAZ = p("<b>Comida especial da Ploigoníada.</b> Consumir é uma <b>ação completa</b>. Desfaz-se 3 rodadas depois de cair.");
	const comida = (n, name, img, desc, o = {}) => itemDoc({
		name, type: "consumivel", img, effects: o.effects ?? [],
		system: {
			description: { value: p(desc) + DESFAZ }, tipo: "food", qtd: 1, preco: 0, peso: 0, espacos: 0,
			ativacao: { execucao: "full", custo: 0, qtd: "", condicao: "", special: "" },
			duracao: { value: 0, units: o.durU ?? "inst", special: "" },
			resistencia: { pericia: "", atributo: "", bonus: 0, txt: "" },
			rolls: (o.rolls ?? []).map((r, i) => rolagem(r[0], r[1], i))
		}
	}, `comida-${n}`);
	const doSistema = async (n, id, nome, img) => {
		const d = await deCompendio("tormenta20.equipamentos", id, nome, DESFAZ, img);
		if (!d) return comida(n, nome, img, "Veja Tormenta20, p. 162.");
		d.flags = foundry.utils.mergeObject(d.flags ?? {}, FLAGS(`comida-${n}`));
		if (d.system.ativacao) d.system.ativacao.execucao = "full";
		// Alguns efeitos do sistema apontam para ícones que não existem: usa o ícone da comida.
		for (const ef of d.effects ?? []) ef.img = d.img;
		return d;
	};
	const COMIDAS = [
		await doSistema(1, "GkIO0G6YH5VjXNIK", "Batata Valkariana", `${GE}/batata-ambiciosa.webp`),
		await doSistema(2, "MdkgD1o9m4WHNZJs", "Gorad Quente", `${GE}/gorad-quente.webp`),
		await doSistema(3, "qOJQpsOhHltX2BUZ", "Macarrão de Yuvalin", `${GE}/macarrao-de-mineiro.webp`),
		comida(4, "Doppelganger", ICO.comida, "Sanduíche \"duplo\" do Castelo do Sabor, com dois pedaços de carne de procedência duvidosa e o Molho do Castelo. A sensação de estar empanturrado concede <b>RD 1 por um dia</b>.",
			{ durU: "day", effects: [fx("Doppelganger (RD 1)", ICO.comida, [["system.tracos.resistencias.dano.bonus", "1"]], { duration: UM_DIA, transfer: false })] }),
		comida(5, "Batata do Castelo", `${GE}/batata-ambiciosa.webp`, "Melora garante que não é a mesma coisa que a batata valkariana: tem muito mais sabor! <b>+1d4 num único teste</b> à sua escolha nesse dia.",
			{ effects: [aoUsar("Batata do Castelo (+1d4, uma vez)", `${GE}/batata-ambiciosa.webp`, [["roll", "1d4"]], ["skill", "attack"])] }),
		comida(6, "Cestinha Uivante", `${GE}/leite.webp`, "Creme gelado muito doce numa cesta comestível. Não pergunte como o restaurante o mantém gelado. Concede <b>2 PM temporários</b> por um dia."),
		comida(7, "Alqui-Fruta", `${GE}/bebida-comum.webp`, "Bebida exclusiva do Castelo do Sabor: líquido negro e extremamente doce, de receita alquímica secreta. Deixa qualquer um agitado: <b>+3m de deslocamento</b> por um dia.",
			{ durU: "day", effects: [fx("Alqui-Fruta (+3m)", `${GE}/bebida-comum.webp`, [["system.attributes.movement.walk.bonus", "3"]], { duration: UM_DIA })] }),
		comida(8, "Coxa de Trobo Assada", ICO.trobo, "Uma coxa enorme, ainda quente. <b>Cura 1d6 PM e 1d6 PV.</b>",
			{ rolls: [["Cura", [["1d6", "curapv"]]], ["Mana", [["1d6", "curapm"]]]] })
	];
	const itensCriados = await Item.createDocuments([...ESPECIAIS, ...COMIDAS]);
	const itemRole = (role) => itensCriados.find((i) => i.getFlag("world", "fdtRole") === role);

	/* ------------------------------------------------------------------ */
	/* 4. Tabelas                                                           */
	/* ------------------------------------------------------------------ */
	const tabela = (name, formula, linhas, description, img, role) => RollTable.create({
		name, img, folder: pasta.RollTable, flags: FLAGS(role), formula, replacement: true, displayRoll: true, description,
		results: linhas.map(([de, ate, nome, desc, doc]) => doc
			? { type: "document", documentUuid: doc.uuid, range: [de, ate], weight: ate - de + 1, name: doc.name, img: doc.img, description: desc ?? "" }
			: { type: "text", range: [de, ate], weight: ate - de + 1, name: nome, description: desc ?? "" })
	});
	const TIPOS = ["guerreiro", "clerigo", "cacador", "ladino", "mago", "cavaleiro"];
	const tabCapangas = await tabela("Aventureiros-Capangas", "1d6", TIPOS.map((k, i) => [i + 1, i + 1, atores[k].name, "", atores[k]]),
		"Cada grupo tem um capanga a mais que o total de personagens, mais 1 (personagens + 2), em qualquer combinação. Nível 9: quatro grupos; +1 grupo por nível acima de 9.", ICO.guerreiro, "capangas");
	const tabItens = await tabela("Itens Especiais da Ploigoníada", "1d12", ESPECIAIS.map((d, i) => [i + 1, i + 1, d.name, "", itemRole(`especial-${i + 1}`)]),
		"Em média, um a cada cinco aventureiros-capangas tem um destes itens. Se o item não fizer sentido para a classe do capanga, role de novo ou escolha.", `${EQ}/montante.webp`, "itens");
	const tabComidas = await tabela("Comidas Especiais", "1d8", COMIDAS.map((d, i) => [i + 1, i + 1, d.name, "", itemRole(`comida-${i + 1}`)]),
		"Um capanga derrotado tem 20% de chance (1 ou 2 em 1d10) de deixar cair uma destas comidas. Consumir é uma ação completa; desfazem-se em 3 rodadas.", ICO.comida, "comidas");

	/* ------------------------------------------------------------------ */
	/* 5. Macros                                                            */
	/* ------------------------------------------------------------------ */

	async function macroMensagem() {
		const CHAVE = "fdtPloigoniada";
		const agora = () => Number(game.time?.worldTime) || 0;
		const e = game.user.getFlag("world", CHAVE);
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Mensagem da Ploigoníada" },
			content: `<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="ler">O pergaminho de luz surge (mostrar aos jogadores e iniciar o prazo de 12 horas)</option>
					<option value="prazo">Quanto falta do prazo</option>
					<option value="pericia">Os selecionados entendem o contrato (Misticismo, Religião ou Nobreza)</option></select></div>
				${e ? `<p>Prazo iniciado: restam cerca de <b>${Math.max(0, Math.ceil((e.fim - agora()) / 3600))} h</b> pelo relógio do mundo.</p>` : ""}`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		if (res.acao === "ler") {
			await game.user.setFlag("world", CHAVE, { inicio: agora(), fim: agora() + 12 * 3600 });
			return ChatMessage.create({ content: `<h3>Um brilho surge no meio da sala</h3><p>O clarão arrefece e toma a forma de um pergaminho feito de luz, flutuando no ar:</p>
				<blockquote><p>"Vocês foram responsabilizados pela dívida contraída por Arthemus Vesper e sua tripulação para com a Ploigoníada. Verificamos que não dispõem dos fundos necessários para realizar o pagamento e assim colocamos em prática o procedimento padrão."</p>
				<p>"O hynne Blixto Arting foi tomado como refém. Caso o valor de <b>T$ 50.000.000,00</b> não seja pago no prazo estipulado, ele será executado e sua oficina, a Metais do Baixote, será tomada pela Ploigoníada como compensação."</p>
				<p>"Vocês têm <b>12 (doze) horas</b>, a partir do momento em que esta mensagem está sendo lida, para se apresentar no galpão mostrado no mapa (anexo) com a quantia previamente citada. A presença de quaisquer autoridades, heróis ou pessoas além do grupo de aventureiros será considerada quebra de contrato e provocará a morte imediata de Blixto Arting, assim como o supracitado confisco de seu negócio."</p>
				<p>"Aguardamos sua chegada com o pagamento."<br>"Cordialmente,"<br>"A Ploigoníada"</p></blockquote>
				<p>O pergaminho se desvanece e dá lugar a um pequeno mapa, com o galpão indicado: uma rua do Altar de Heróis.</p>` });
		}
		if (res.acao === "prazo") {
			if (!e) return ui.notifications.warn("O prazo ainda não foi iniciado.");
			const h = (e.fim - agora()) / 3600;
			return ChatMessage.create({ whisper: ChatMessage.getWhisperRecipients("GM"), content: `<h3>Prazo da Ploigoníada</h3><p>${h > 0 ? `Restam <b>${Math.ceil(h)} h</b>.` : "<b>O prazo acabou.</b> Blixto é executado e a Metais do Baixote é confiscada (veja Efeitos de Derrota na macro <i>Desfecho</i>)."}</p>` });
		}
		const tokens = canvas.tokens.controlled.filter((t) => t.actor);
		if (!tokens.length) return ui.notifications.warn("Selecione os personagens.");
		const rolls = [];
		const linhas = [];
		for (const t of tokens) {
			const pe = t.actor.system.pericias ?? {};
			const [k, v] = ["mist", "reli", "nobr"].map((x) => [x, Number(pe[x]?.value) || 0]).sort((a, b) => b[1] - a[1])[0];
			const r = await new Roll(`1d20 + ${v}`).evaluate();
			rolls.push(r);
			linhas.push(`<li>${t.name} (${{ mist: "Misticismo", reli: "Religião", nobr: "Nobreza" }[k]}): ${r.total}.</li>`);
		}
		ChatMessage.create({ rolls, content: `<h3>O contrato da Ploigoníada</h3><ul>${linhas.join("")}</ul>
			<p>Qualquer teste revela o mesmo: a Ploigoníada quer reaver ao menos parte do lucro. O valor é exorbitante de propósito, para "forçar" a cláusula seguinte: o confisco da Metais do Baixote. É assassinato e roubo em enorme escala com alguns passos a mais, cuidadosamente dentro da letra da lei, para que a guilda continue podendo invocar Cobradores. Discutir a jurisdição de um contrato do éter leva meses, não horas.</p>` });
	}

	async function macroRua() {
		const NOMES = { guerreiro: "Guerreiro", clerigo: "Clérigo", cacador: "Caçador", ladino: "Ladino", mago: "Mago", cavaleiro: "Cavaleiro" };
		const TIPOS = Object.keys(NOMES);
		const pjs = game.actors.filter((a) => a.type === "character" && a.hasPlayerOwner);
		const nivelMedio = pjs.length ? Math.round(pjs.reduce((s, a) => s + (Number(a.system.attributes?.nivel?.value) || 9), 0) / pjs.length) : 9;
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Andar e Bater" },
			content: `<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="montar">Montar os grupos de aventureiros-capangas</option>
					<option value="derrotado">Um capanga foi derrotado (20% de comida)</option>
					<option value="item">O selecionado apanha um item especial (1d12)</option>
					<option value="dinheiro">Os heróis mostram o "dinheiro" do resgate</option></select></div>
				<div class="form-group"><label>Personagens</label><input type="number" name="pjs" value="${pjs.length || 4}" min="1"></div>
				<div class="form-group"><label>Nível médio</label><input type="number" name="nivel" value="${Math.max(1, nivelMedio)}" min="1"></div>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const rolls = [];
		const rolar = async (f) => { const r = await new Roll(f).evaluate(); rolls.push(r); return r.total; };
		const meus = (role) => game.items.find((i) => i.getFlag("world", "fdt") === "a2mini1" && i.getFlag("world", "fdtRole") === role);
		const ator = (role) => game.actors.find((a) => a.getFlag("world", "fdt") === "a2mini1" && a.getFlag("world", "fdtRole") === role);
		const link = (d, nome) => (d ? `@UUID[${d.uuid}]{${d.name}}` : nome);
		if (res.acao === "montar") {
			const n = Math.max(1, Number(res.pjs) || 4);
			const nivel = Math.max(1, Number(res.nivel) || 9);
			const grupos = 4 + Math.max(0, nivel - 9);
			let html = `<h3>Andar e Bater</h3><p>${grupos} grupos de ${n + 2} aventureiros-capangas ao longo da rua coberta. Uma vez dentro, só dá para ir em frente. Um capanga ataca quem chegar a 5 quadrados. A função deles é atrasar e gastar recursos.</p><ol>`;
			let total = 0;
			let comItem = 0;
			for (let g = 0; g < grupos; g++) {
				const membros = [];
				for (let i = 0; i < n + 2; i++) {
					const tipo = TIPOS[(await rolar("1d6")) - 1];
					total += 1;
					let extra = "";
					if ((await rolar("1d5")) === 1) {
						const it = meus(`especial-${await rolar("1d12")}`);
						extra = ` com ${link(it, "item especial")}`;
						comItem += 1;
					}
					membros.push(`${link(ator(tipo), NOMES[tipo])}${extra}`);
				}
				html += `<li>${membros.join(", ")}</li>`;
			}
			html += `</ol><p>${total} capangas, ${comItem} com itens especiais. Ajuste se o item não fizer sentido para a classe. Depois, a porta do galpão abre sem teste: o Cobrador espera lá dentro.</p>`;
			return ChatMessage.create({ whisper: ChatMessage.getWhisperRecipients("GM"), content: html, rolls });
		}
		if (res.acao === "derrotado") {
			const d = await rolar("1d10");
			let html = `<h3>Capanga derrotado</h3><p>1d10 = ${d}: `;
			if (d <= 2) {
				const c = meus(`comida-${await rolar("1d8")}`);
				html += `cai ao lado dele: <b>${link(c, "uma comida especial")}</b>. Comer é uma ação completa; desfaz-se em 3 rodadas. (As regras de contratação terceirizada da Ploigoníada devem obrigar os lanches.)</p>`;
				const tk = canvas.tokens.controlled.find((t) => t.actor?.type === "character");
				if (c && tk) {
					await tk.actor.createEmbeddedDocuments("Item", [c.toObject()]);
					html += `<p>${tk.name} apanha a comida.</p>`;
				}
			} else html += "nenhuma comida.</p>";
			return ChatMessage.create({ content: html, rolls });
		}
		if (res.acao === "item") {
			const tk = canvas.tokens.controlled.find((t) => t.actor);
			if (!tk) return ui.notifications.warn("Selecione quem apanha o item.");
			const ja = tk.actor.items.find((i) => String(i.getFlag("world", "fdtRole") ?? "").startsWith("especial-"));
			if (ja) return ui.notifications.warn(`${tk.name} já empunha ${ja.name}: um item por vez (medida de segurança da Ploigoníada).`);
			const it = meus(`especial-${await rolar("1d12")}`);
			if (it) await tk.actor.createEmbeddedDocuments("Item", [it.toObject()]);
			return ChatMessage.create({ rolls, content: `<h3>Item especial</h3><p>${tk.name} apanha ${link(it, "um item especial")}. Cinco usos; desfaz-se se não for empunhado por 3 rodadas.</p>` });
		}
		ChatMessage.create({ content: "<h3>O dinheiro do resgate</h3><p>Se os heróis mostrarem o dinheiro (ou algo que passe por ele), os aventureiros-capangas deixam o grupo passar. Ilusões e falsificações podem funcionar com eles; com o Cobrador, que tem Visão da Justiça, não.</p>" });
	}

	async function macroCobrador() {
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Cobrador em Combate" },
			content: `<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="turno">Início do turno: cura acelerada 5</option>
					<option value="direitos">Ler Seus Direitos no alvo (3 PM, Fortitude CD 28)</option>
					<option value="negar">Negar Recurso no alvo (3 PM, Vontade CD 28)</option>
					<option value="imobilizar">Imobilizar o alvo (7 PM, Vontade CD 28)</option>
					<option value="silencio">Silêncio nos alvos (3 PM)</option>
					<option value="analisar">Analisar Suspeito (+2 contra o alvo até o fim do dia)</option>
					<option value="falar">O Cobrador fala</option></select></div>
				<div class="form-group"><label>O alvo é a criatura que ele deve caçar (atordoado em vez de pasmo)</label><input type="checkbox" name="devedor"></div>
				<div class="form-group"><label>Habilidade negada</label><input type="text" name="habilidade" placeholder="ex.: Ataque Furtivo, Bola de Fogo"></div>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const cob = game.actors.find((a) => a.getFlag("world", "fdt") === "a2mini1" && a.getFlag("world", "fdtRole") === "cobrador");
		if (!cob) return ui.notifications.warn("O Cobrador não foi encontrado (rode o gerador da Mini-Aventura 1).");
		const alvos = [...game.user.targets].filter((t) => t.actor);
		const rolls = [];
		const cond = async (a, c) => { if (!a.statuses?.has(c)) await a.toggleStatusEffect(c, { active: true }); };
		const salvar = async (a, k) => { const r = await new Roll(`1d20 + ${Number(a.system.pericias?.[k]?.value) || 0}`).evaluate(); rolls.push(r); return r.total; };
		const gastar = async (n) => {
			const pm = Number(cob.system.attributes.pm.value) || 0;
			if (pm < n) return false;
			await cob.update({ "system.attributes.pm.value": pm - n });
			return true;
		};
		let html = "<h3>Cobrador da Ploigoníada</h3>";
		if (res.acao === "turno") {
			const pv = cob.system.attributes.pv;
			const novo = Math.min(Number(pv.max) || 400, (Number(pv.value) || 0) + 5);
			await cob.update({ "system.attributes.pv.value": novo });
			html += `<p>Cura acelerada: <b>${novo} PV</b>.</p>`;
		} else if (res.acao === "falar") {
			const FALAS = ["\"Vocês estão em dívida com a Ploigoníada. Para pagá-la, apresentem o valor previamente combinado. Para morrer, por favor continuem lutando.\"",
				"\"A resistência ao pagamento foi registrada e será acrescida ao montante devido.\"",
				"\"Este procedimento segue a cláusula 7, parágrafo único, do contrato de trabalho da Roca.\"",
				"\"Sua reclamação será encaminhada ao setor responsável. O prazo de resposta é de 90 anos.\""];
			const r = await new Roll(`1d${FALAS.length}`).evaluate();
			html += `<p><i>${FALAS[r.total - 1]}</i></p>`;
			return ChatMessage.create({ content: html, speaker: ChatMessage.getSpeaker({ actor: cob }) });
		} else {
			if (!alvos.length) return ui.notifications.warn("Mire os alvos.");
			const CUSTO = { direitos: 3, negar: 3, imobilizar: 7, silencio: 3, analisar: 0 };
			if (!(await gastar(CUSTO[res.acao]))) return ui.notifications.warn(`O Cobrador não tem ${CUSTO[res.acao]} PM.`);
			const lista = [];
			for (const t of res.acao === "silencio" ? alvos : alvos.slice(0, 1)) {
				const a = t.actor;
				if (res.acao === "direitos") {
					const r = await salvar(a, "fort");
					const c = res.devedor ? "atordoado" : "pasmo";
					if (r < 28) await cond(a, c);
					lista.push(`<li>${t.name}: Fortitude ${r}, ${r >= 28 ? "resiste" : `<b>${c} por 1 rodada</b>`}.</li>`);
				} else if (res.acao === "negar") {
					const r = await salvar(a, "vont");
					lista.push(`<li>${t.name}: Vontade ${r}, ${r >= 28 ? "resiste" : `não pode usar <b>${res.habilidade || "a habilidade escolhida"}</b> até o fim da cena`}.</li>`);
				} else if (res.acao === "imobilizar") {
					const r = await salvar(a, "vont");
					await cond(a, r >= 28 ? "lento" : "paralisado");
					lista.push(`<li>${t.name}: Vontade ${r}, <b>${r >= 28 ? "lento" : "paralisado"}</b>. Ação completa por rodada para um novo teste de Vontade CD 28; passando, liberta-se.</li>`);
				} else if (res.acao === "silencio") {
					await cond(a, "surdo");
					lista.push(`<li>${t.name}: <b>surdo</b> e sem lançar magias enquanto estiver na esfera.</li>`);
				} else {
					lista.push(`<li>${t.name}: analisado. O Cobrador recebe +2 em testes de perícia contra ele até o fim do dia (marque na janela de rolagem).</li>`);
				}
			}
			html += `<p>${{ direitos: "<b>Ler Seus Direitos</b> (movimento).", negar: "<b>Negar Recurso</b> (movimento).", imobilizar: "<b>Imobilizar</b> (padrão).", silencio: "<b>Silêncio</b> (padrão, sustentada): esfera de 6m em alcance médio.", analisar: "<b>Analisar Suspeito</b> (completa)." }[res.acao]} PM: ${cob.system.attributes.pm.value}.</p><ul>${lista.join("")}</ul>`;
		}
		ChatMessage.create({ content: html, rolls });
	}

	async function macroDesfecho() {
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Ruas de Cobiça · Desfecho" },
			content: `<div class="form-group"><label>Resultado</label><select name="acao">
					<option value="vitoria">O Cobrador foi derrotado e Blixto está salvo</option>
					<option value="derrota">Blixto não foi salvo (demora, derrota ou desistência)</option>
					<option value="tesouro">Calcular um tesouro com o bônus de 10% da Metais</option>
					<option value="preco">Calcular um preço com o aumento de 20%</option></select></div>
				<div class="form-group"><label>Valor (T$)</label><input type="number" name="valor" value="100" min="0"></div>`,
			ok: { label: "OK", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const v = Number(res.valor) || 0;
		const estado = game.user.getFlag("world", "fdtMini1");
		if (res.acao === "vitoria" || res.acao === "derrota") await game.user.setFlag("world", "fdtMini1", res.acao);
		const TXT = {
			vitoria: "<p>Sem o construto burocrático, a Ploigoníada não tem como cobrar a \"dívida\": os heróis estão livres. Blixto fica muito grato e, mais importante, a Metais do Baixote está salva.</p><p><b>Efeitos de vitória:</b> a Metais passa a financiar as aventuras do grupo. <b>Todo tesouro, de qualquer fonte, aumenta 10%</b> até o fim do arco, cortesia do Baixote em pessoa.</p>",
			derrota: "<p>A Metais do Baixote é tomada pela Ploigoníada. Em questão de horas, todos os recursos do império comercial são vendidos e o dinheiro vai magicamente para os cofres da guilda do éter.</p><p><b>Efeitos de derrota:</b> com a falta de oferta, <b>todo item comprado em Valkaria custa 20% a mais</b> até o fim do arco. Serviços e alimentação não são afetados.</p>",
			tesouro: `<p>Tesouro de T$ ${v} com o bônus da Metais: <b>T$ ${Math.round(v * 1.1)}</b>.${estado !== "vitoria" ? " (O desfecho registrado não é vitória.)" : ""}</p>`,
			preco: `<p>Preço de T$ ${v} com o aumento: <b>T$ ${Math.round(v * 1.2)}</b>.${estado !== "derrota" ? " (O desfecho registrado não é derrota.)" : ""}</p>`
		};
		ChatMessage.create({ content: `<h3>Ruas de Cobiça</h3>${TXT[res.acao]}<p style="font-size:0.85em">Completar Ruas de Cobiça não rende nível nem pagamento.</p>` });
	}

	const macro = (name, img, fn) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Arco 2 · Mini-Aventura 1 · gerado por a2-mini1-ruas-de-cobica.js\n(${fn.toString()})();`
	});
	const macros = await Macro.createDocuments([
		macro("Mini 1 · Mensagem da Ploigoníada", ICO.pergaminho, macroMensagem),
		macro("Mini 1 · Andar e Bater", ICO.marreta, macroRua),
		macro("Mini 1 · Cobrador em Combate", ICO.cobrador, macroCobrador),
		macro("Mini 1 · Desfecho", `${GE}/gemas-preciosas.webp`, macroDesfecho)
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
	const BLIXTO = blixto ? L(blixto) : "Blixto Arting";

	await JournalEntry.create({
		name: "Arco 2 · Mini-Aventura 1 · Ruas de Cobiça",
		folder: pasta.JournalEntry,
		flags: FLAGS(),
		pages: [
			pagina("Guia do Mestre", `
				<p><b>Gancho:</b> se os heróis completarem as Aventuras 1 e 5, conhecem a base dos planos de Ghorskander (controle mental dos valkarianos e o Mecano-Lagarto-Terror) e atraem a atenção da Ploigoníada. Assim que completarem as duas, conduza a cena em que recebem a mensagem: ${BLIXTO} foi raptado!</p>
				<p><b>Nível presumido:</b> 4 personagens de nível 9. <b>Recompensa:</b> não rende nível nem pagamento, mas talvez seja a missão mais lucrativa do arco.</p>
				<h2>Fases</h2>
				${lista([
					"<b>Fase 0 · Os Inimigos dos Inimigos:</b> a Ploigoníada e o Cobrador.",
					"<b>Fase 1 · Levado!:</b> o pergaminho de luz e o resgate impossível.",
					"<b>Fase 2 · Andar e Bater:</b> a rua coberta cheia de aventureiros-capangas.",
					"<b>Fase 3 · O Chefão Final:</b> o Cobrador no galpão.",
					"<b>Fase 4 · Desfecho:</b> efeitos de vitória ou de derrota."
				])}
				<h2>Criaturas</h2>
				${lista([...TIPOS.map((k) => `${L(atores[k])} (ND 5)`), `${L(atores.cobrador)} (ND 9)`])}
				<h2>Macros e tabelas</h2>
				${lista([
					`${linkMacro("Mensagem")}: mostra o pergaminho, controla o prazo de 12 horas e os testes sobre o contrato.`,
					`${linkMacro("Andar e Bater")}: monta os grupos (com itens especiais), rola as comidas dos derrotados e dá itens especiais a quem os apanha.`,
					`${linkMacro("Cobrador")}: cura acelerada, Ler Seus Direitos, Negar Recurso, Imobilizar, Silêncio, Analisar Suspeito e falas.`,
					`${linkMacro("Desfecho")}: registra vitória ou derrota e calcula os +10% de tesouro ou os +20% de preço.`,
					`${L(tabCapangas)}, ${L(tabItens)} e ${L(tabComidas)}.`
				])}`, 100),
			pagina("Fases 0 e 1 · A Ploigoníada e o Resgate", `
				<h2>Os inimigos dos inimigos</h2>
				<p>A tripulação da Roca trabalhava para a <b>Ploigoníada</b>, a gigantesca corporação mercante que domina parte do éter divino, antes de se rebelar. Para os mercadores do éter, são culpados do pior crime possível: privar a corporação de seus lucros. Os experimentos do Dr. Vesper e o assassinato da Capitã Ygda poderiam ser perdoados se o dinheiro continuasse fluindo. Foi uma fuga das naves da Ploigoníada que fez a Roca naufragar no Mundo de Aharadak.</p>
				<p>A guilda continuou contabilizando a dívida e localizou a Roca. Mas mandar tropas a Arton não é economicamente viável: a viagem etérea é caríssima, fere os gog'magogues, e soldados de outro mundo seriam vistos como invasão. Por sorte (ou azar dos heróis), todo contrato da Ploigoníada é selado por magia, e o da Roca tinha uma cláusula que invoca um guardião em caso de quebra: um <b>Cobrador</b>.</p>
				<p>O Cobrador surgiu em Valkaria. Não localizou Ghorskander (protegido por magia), então achou quem considera mais próximo do oficial médico: os personagens. Percebeu que eles não podem pagar e raptou quem talvez possa: Blixto, dono da Metais do Baixote. Tomou uma rua inteira do <b>Altar de Heróis</b>, reduto de aventureiros aposentados e fracassados, contratou vários deles como seguranças e ocupou um galpão, onde Blixto está amarrado e amordaçado.</p>
				<h2>Levado!</h2>
				<blockquote><p>Os últimos dias foram cheios de investigações, perseguições e batalhas. Vocês chegam em casa ansiosos por relaxar um pouco, colocar os pensamentos em ordem, tentar entender o que acontece em Valkaria. [...] Então um brilho surge no meio da sala.</p></blockquote>
				<p>Use ${linkMacro("Mensagem")} para mostrar o pergaminho de luz: <b>T$ 50.000.000,00 em 12 horas</b>, ou Blixto morre e a Metais é confiscada. Qualquer teste de Misticismo, Religião, Nobreza ou similar revela o mesmo: o valor é exagerado de propósito, para "forçar" o confisco, de um jeito tecnicamente legal e "ordeiro". A Ploigoníada precisa cumprir a letra da lei para continuar invocando Cobradores (um construto divino da ordem nunca compactuaria com uma organização criminosa).</p>
				<h3>Planos criativos</h3>
				<p>Falsificar dinheiro, manipular o mercado de arte, trabalhar para a Ploigoníada ou se aliar a ela contra a Roca: você pode permitir, mas aí precisa planejar ou improvisar uma aventura nova. Esta mini-aventura considera que o prazo não basta para burlar um contrato da Ploigoníada. Resta ir ao endereço e lutar.</p>`, 200),
			pagina("Fase 2 · Andar e Bater", `
				<p>Menos uma rua do que um beco: ladeada por prédios, uma linha reta que desemboca no galpão, coberta por um teto (era palco de uma feira). <b>Uma vez dentro, só dá para ir em frente.</b></p>
				<p>A rua está guarnecida pelos aventureiros-capangas. A menos que os heróis mostrem o dinheiro que teoricamente vieram trazer, são atacados.</p>
				${lista([
					"Cada grupo tem <b>personagens + 2</b> capangas, em qualquer combinação de tipos.",
					"<b>4 grupos</b> se o nível médio for 9, mais 1 grupo por nível acima de 9.",
					"Não enxameiam todos de uma vez: postam-se ao longo da rua para atrasar o grupo e forçá-lo a gastar recursos. Um capanga ataca quem chegar a <b>5 quadrados</b>; quem corre na frente \"chama\" os inimigos.",
					"Passados todos os grupos, a porta do galpão abre sem teste."
				])}
				<p>Macro: ${linkMacro("Andar e Bater")}. Capangas: ${TIPOS.map((k) => L(atores[k])).join(", ")}.</p>
				<h2>Itens especiais</h2>
				<p>Poderosos mas efêmeros, trazidos pelo construto para este combate. Em média um a cada cinco capangas tem um (${L(tabItens)}). <b>Cinco usos</b> cada (contando os dos capangas). Largado e não apanhado por 3 rodadas, ou sem ser empunhado por 3 rodadas, se desfaz; não pode ser guardado. <b>Um item por personagem</b> (medida de segurança da Ploigoníada contra mau uso do equipamento da empresa). Quem empunha usa as próprias estatísticas, modificadas pelo item.</p>
				${lista(ESPECIAIS.map((d, i) => L(itemRole(`especial-${i + 1}`))))}
				<h2>Comidas especiais</h2>
				<p>Parece estranho que capangas carreguem lanches, mas as regras de contratação terceirizada da Ploigoníada devem obrigar. Cada capanga derrotado tem <b>20%</b> (1 ou 2 em 1d10) de deixar cair uma comida (${L(tabComidas)}). Comer é uma <b>ação completa</b>; desfazem-se 3 rodadas depois de cair (provavelmente contenção de custos).</p>
				${lista(COMIDAS.map((d, i) => L(itemRole(`comida-${i + 1}`))))}`, 300),
			pagina("Fase 3 · O Chefão Final", `
				<blockquote><p>Vocês entram no galpão e veem Blixto amarrado e amordaçado num canto. De pé ao lado dele está uma criatura feita de metal polido, com a postura de um cavaleiro, usando espada e escudo. Contudo, quando palavras emergem da face metálica, não são juramentos de vingança ou exaltações à honra. O que o construto diz é:</p>
				<p>"Vocês estão em dívida com a Ploigoníada. Para pagá-la, apresentem o valor previamente combinado. Para morrer, por favor continuem lutando."</p></blockquote>
				<p>${L(atores.cobrador)} (ND 9): um tipo específico de inevitável (Deuses de Arton, p. 278). Segue a letra da lei, não a justiça. 400 PV, cura acelerada 5, RD 5, imune a frio, resistência a magia +5, magias como clérigo de 9º nível (CD 28).</p>
				${lista([
					"<b>Ler Seus Direitos</b> (movimento, 3 PM): pasmo por 1 rodada, ou atordoado se for a criatura que deve caçar (Fort CD 28 evita).",
					"<b>Negar Recurso</b> (movimento, 3 PM): Vontade CD 28 ou não usa uma habilidade escolhida até o fim da cena.",
					"<b>Imobilizar</b> (7 PM): paralisado (Vontade muda para lento).",
					"<b>Silêncio</b>, <b>Dissipar Magia</b> e <b>Disfarce Ilusório</b>.",
					"<b>Analisar Suspeito</b>, <b>Encontrar o Culpado</b> e <b>Visão da Justiça</b> (Visão da Verdade permanente)."
				])}
				<p>Macro: ${linkMacro("Cobrador")}.</p>`, 400),
			pagina("Fase 4 · Desfecho", `
				<p>Derrotado o construto planar burocrático, a Ploigoníada não tem como cobrar a "dívida": os heróis estão livres. ${BLIXTO} fica muito grato.</p>
				<h3>Efeitos de vitória</h3>
				<p>Os heróis salvaram Blixto e, mais importante, a Metais do Baixote. A partir de agora, a Metais financia as aventuras: <b>todo tesouro, de qualquer fonte, aumenta 10%</b>, cortesia do Baixote em pessoa.</p>
				<h3>Efeitos de derrota</h3>
				<p>Se a mini-aventura começar e os heróis não salvarem Blixto (demora, derrota, desistência ou qualquer outra razão), a Metais é tomada pela Ploigoníada. Em horas, os recursos são vendidos e o dinheiro vai para os cofres da guilda do éter. Pela falta de oferta, <b>todo item comprado em Valkaria fica 20% mais caro</b> até o fim do arco (serviços e alimentação não são afetados).</p>
				<p>Macro: ${linkMacro("Desfecho")}.</p>
				<h3>Para o futuro</h3>
				<p>Na Aventura 7, com contato pacífico via o Cobrador, a guilda pode trocar o paradeiro da Roca pelo perdão de parte da dívida.</p>`, 500)
		]
	});

	ui.notifications.info("Fim dos Tempos · Arco 2 · Mini-Aventura 1 (Ruas de Cobiça): conteúdo criado.");
})();
