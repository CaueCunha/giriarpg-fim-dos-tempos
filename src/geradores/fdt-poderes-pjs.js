/* =====================================================================
 * FIM DOS TEMPOS · PODERES DOS PJs · REVISÃO E AUTOMAÇÃO
 * Gerador para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * Revisão das fichas de Tariq, Rak, Hannah, Felix, Elyas e Balthazar (out/2026),
 * conferida no código do sistema 1.6.4. O que estava quebrado vira uma correção
 * automática; o que não tinha automação ganhou macro.
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute
 *      (ou importe a Campanha do módulo, que já traz tudo pronto).
 *   2. Ele cria a pasta "FdT · Poderes dos PJs" com:
 *      - "PJs · Corrigir poderes": acha e conserta os poderes quebrados nas fichas
 *        (mostra a lista antes, guarda cópia para desfazer).
 *      - "PJs · Mau Cheiro": a habilidade do trog, com os testes de Fortitude de todos em volta.
 *      - "PJs · Rolar de novo": Sortudo (3 PM) e Sorte Salvadora (1 PM) sobre o último teste.
 *      - "PJs · Automações": Temeroso (abalado ao lado de inimigo) e Provocação Petulante
 *        (teste de Vontade dos inimigos no início do turno).
 *      - Armas naturais modelo (Mordida e Cauda) e o diário "FdT · Poderes dos PJs" com a revisão.
 *   3. Rodar de novo apaga e recria só o que tem flags.world.fdt = "fdtpoderes".
 *      As fichas dos PJs não são tocadas pelo gerador, só pela macro de correção.
 *
 * Feito a partir do código do sistema (1.6.4, commit 9e88b318); não foi testado num
 * Foundry rodando. Veja o guia fdt-poderes-pjs.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "fdtpoderes";
	const FLAGS = (extra = {}) => ({ world: { fdt: TAG, ...extra } });
	const NOME_PASTA = "FdT · Poderes dos PJs";

	/* ------------------------------------------------------------------ */
	/* 0. Limpeza                                                           */
	/* ------------------------------------------------------------------ */
	const isOurs = (d) => d.getFlag?.("world", "fdt") === TAG;
	const colecoes = [game.items, game.journal, game.macros];
	const antigos = colecoes.flatMap((c) => c.filter(isOurs));
	if (antigos.length) {
		const ok = await foundry.applications.api.DialogV2.confirm({
			window: { title: "Poderes dos PJs: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados antes (macros, armas modelo e diário).</p>
				<p>Eles serão <b>apagados e recriados</b>. As fichas dos PJs não mudam.</p><p>Continuar?</p>`
		});
		if (!ok) return;
		for (const c of colecoes) {
			const ids = c.filter(isOurs).map((d) => d.id);
			if (ids.length) await c.documentClass.deleteDocuments(ids);
		}
		const pastas = game.folders.filter(isOurs).map((f) => f.id);
		if (pastas.length) await Folder.deleteDocuments(pastas);
	}
	const pasta = {};
	for (const type of ["Item", "JournalEntry", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#3f6b4a", flags: FLAGS() })).id;
	}

	/* ------------------------------------------------------------------ */
	/* 1. Código comum das macros                                            */
	/* ------------------------------------------------------------------ */
	function comum() {
		const TAG = "fdtpoderes";
		const MODULO = "giriarpg-fim-dos-tempos";
		const MARCA = "fdtPoderPJ";
		const BACKUP = "fdtPoderesBackup";
		const gm = () => game.users.filter((u) => u.isGM).map((u) => u.id);
		const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
		const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
		const poderes = (a, re) => a.items.filter((i) => i.type === "poder" && re.test(norm(i.name)));
		const tem = (a, re) => poderes(a, re).length > 0;
		const marca = (e) => e.getFlag?.("world", MARCA) ?? e.flags?.world?.[MARCA];
		const formulario = async (title, content, label = "OK") => {
			const r = await foundry.applications.api.DialogV2.wait({
				window: { title },
				position: { width: 520 },
				content,
				buttons: [{ action: "ok", label, default: true, callback: (e, b) => new foundry.applications.ux.FormDataExtended(b.form).object }],
				rejectClose: false
			});
			return r && r !== "ok" ? r : null;
		};

		/** Personagens: tokens selecionados, senão o personagem do usuário, senão todos os PJs (só Mestre). */
		const atoresAlvo = ({ todos = false } = {}) => {
			const sel = [...new Set((canvas.tokens?.controlled ?? []).map((t) => t.actor).filter(Boolean))];
			if (sel.length) return sel;
			if (game.user.character) return [game.user.character];
			if (todos && game.user.isGM) return game.actors.filter((a) => a.type === "character" && a.hasPlayerOwner);
			return [];
		};

		const muda = (key, value, type = "add") => ({ key, value: String(value), type, phase: "initial", priority: null });
		/** Efeito de item. o.uso = Efeito de Uso (janela de rolagem); o.card = vai para o card do poder. */
		const efeito = (name, changes, o = {}) => ({
			name,
			img: o.img ?? "icons/svg/aura.svg",
			type: "base",
			transfer: o.transfer ?? !o.card,
			disabled: o.disabled ?? (!!o.uso && !o.card),
			duration: o.card ? { value: null, units: "rounds", expiry: "sceneEnd" } : {},
			description: o.description ?? "",
			statuses: [],
			flags: { world: { [MARCA]: o.marca ?? name } },
			system: {
				changes,
				onuse: !!o.uso,
				abilityUse: {
					types: o.types ?? [],
					names: o.names ?? [],
					automatic: o.automatic ?? false,
					aumenta: o.aumenta ?? false,
					custo: o.custo ?? null,
					description: ""
				}
			}
		});

		/* ---- armas naturais ---- */
		const NATURAIS = {
			mordida: { nome: "Mordida", dado: "1d6", tipo: "perfuracao", img: "icons/creatures/abilities/mouth-teeth-sharp.webp" },
			cauda: { nome: "Cauda", dado: "1d6", tipo: "impacto", img: "icons/creatures/abilities/tail-swipe-green.webp" }
		};
		const armaNatural = (k, extra = {}) => {
			const n = NATURAIS[k];
			return {
				name: n.nome,
				type: "arma",
				img: n.img,
				...extra,
				system: {
					description: { value: `<p>Arma natural (${n.dado}, crítico x2, ${n.tipo === "perfuracao" ? "perfuração" : n.tipo}). Uma vez por rodada, quando usa a ação agredir com outra arma, pode gastar 1 PM para fazer um ataque corpo a corpo extra com ela (sem PM com Arma Natural Hábil).</p><p><i>Criada pela revisão de poderes do Fim dos Tempos: como arma, recebe a Fúria, os passos de dano e o crítico dos poderes.</i></p>` },
					rolls: [
						{ name: "Ataque", key: "ataque0", type: "ataque", parts: [["1d20", "", ""], ["luta", "", ""], ["0", "", ""]], versatil: "", adaptavel: "" },
						{ name: "Dano", key: "dano1", type: "dano", parts: [[n.dado, n.tipo, ""], ["@for", "", ""]], versatil: "", adaptavel: "" }
					],
					criticoM: 20,
					criticoX: 2,
					proficiencia: "natural",
					proposito: "corpo-a-corpo",
					empunhadura: "leve",
					equipado: 0,
					carregado: true,
					espacos: 0,
					qtd: 1
				}
			};
		};
		const nomesNaturais = (a) => {
			const nomes = a.items.filter((i) => i.type === "arma" && i.system.proficiencia === "natural").map((i) => i.name);
			return nomes.length ? nomes : ["Mordida"];
		};
		const temMordida = (a) => a.items.some((i) => (i.type === "arma" && /^mordida/.test(norm(i.name))) || (i.type === "poder" && /^mordida/.test(norm(i.name))));

		const ELEMENTOS = { frio: "frio (qareen da água)", eletricidade: "eletricidade (do ar)", fogo: "fogo (do fogo)", acido: "ácido (da terra)", luz: "luz (da luz)", trevas: "trevas (das trevas)" };
		const elementoProvavel = (a) => Object.keys(ELEMENTOS).find((k) => Number(a._source?.system?.tracos?.resistencias?.[k]?.base) === 10) ?? "fogo";
		const temChave = (item, re) => item.effects.some((e) => (e.system.changes ?? []).some((c) => re.test(c.key)));
		const legado = (e) => !!(e.flags?.tormenta20?.onuse && !e.system.onuse);
		const tam = (x) => x?.size ?? x?.length ?? 0;
		const numero = (v) => v !== "" && v != null && !Number.isNaN(Number(v));

		/* ---------------------------------------------------------------- */
		/* As correções. Cada uma acha o problema e sabe consertar.          */
		/* ---------------------------------------------------------------- */
		const CORRECOES = [
			{
				id: "arma-natural",
				nome: "Mordida / Cauda (arma natural)",
				buscar: (a) => {
					const out = [];
					for (const k of Object.keys(NATURAIS)) {
						const lista = poderes(a, new RegExp(`^${k}\\b`)).filter((i) => i.system.rolls?.length);
						if (!lista.length || a.items.some((i) => i.type === "arma" && norm(i.name) === k)) continue;
						const extra = lista.length > 1 ? ` As cópias ${lista.slice(1).map((i) => `"${i.name}"`).join(", ")} (com Presas/Fúria embutidos à mão) são apagadas: os poderes agora fazem isso sozinhos.` : "";
						out.push({ item: lista[0], problema: `O ataque está dentro do poder: não recebe a Fúria (+2 ataque/dano corpo a corpo), nem passos de dano e crítico de outros poderes${/@for/.test(JSON.stringify(lista[0].system.rolls)) ? "" : ", e o dano está sem a Força"}. Vira a arma natural "${NATURAIS[k].nome}".${extra}` });
					}
					return out;
				},
				corrigir: async (a, item, ctx) => {
					const k = Object.keys(NATURAIS).find((x) => norm(item.name).startsWith(x));
					await ctx.criar(a, [armaNatural(k, { flags: { world: { [MARCA]: "arma-natural" } } })]);
					const copias = poderes(a, new RegExp(`^${k}\\b`)).filter((i) => i.id !== item.id && i.system.rolls?.length);
					for (const c of copias) await ctx.apagar(a, c);
					await ctx.atualizar(a, item, {
						name: NATURAIS[k].nome,
						"system.rolls": [],
						"system.description.value": `${item.system.description?.value ?? ""}<p><b>Fim dos Tempos:</b> o ataque é a arma natural <b>${NATURAIS[k].nome}</b> no inventário.</p>`
					});
					return `arma natural ${NATURAIS[k].nome} criada${copias.length ? `; ${copias.length} cópia(s) apagada(s)` : ""}`;
				}
			},
			{
				id: "resistencia-elemental",
				nome: "Resistência Elemental",
				buscar: (a) => poderes(a, /^resistencia elemental/)
					.filter((i) => temChave(i, /\?\?\?/) || !temChave(i, /^system\.tracos\.resistencias\.\w+\.bonus$/))
					.map((item) => {
						const digitada = Object.keys(ELEMENTOS).find((k) => Number(a._source?.system?.tracos?.resistencias?.[k]?.base) === 10);
						return { item, escolha: "elemento", problema: `O efeito tem o tipo de dano em branco (resistencias.???): a resistência 10 não vale. Escolha o elemento abaixo.${digitada ? ` A ficha tem resistência a ${digitada} 10 digitada à mão: ela passa para o efeito.` : ""}` };
					}),
				corrigir: async (a, item, ctx) => {
					const tipo = ctx.dados[`el_${a.id}`] || elementoProvavel(a);
					await ctx.trocarEfeitos(a, item, [efeito(`Resistência Elemental (${tipo})`, [muda(`system.tracos.resistencias.${tipo}.bonus`, 10)], { img: item.img })]);
					if (Number(a._source.system.tracos?.resistencias?.[tipo]?.base) === 10) await ctx.atualizarAtor(a, { [`system.tracos.resistencias.${tipo}.base`]: 0 });
					return `resistência ${tipo} 10 pelo efeito`;
				}
			},
			{
				id: "presentes-ssaazzaas",
				nome: "Presentes de Ssaazzaas",
				buscar: (a) => poderes(a, /^presentes de ssaazzaas/).filter((i) => !i.effects.some((e) => marca(e) === "veneno"))
					.map((item) => ({ item, problema: "Falta a resistência a veneno +5." })),
				corrigir: async (a, item, ctx) => {
					await ctx.criarEfeitos(a, item, [efeito("Resistência a veneno (+5)", [muda("roll", 5)], { uso: true, types: ["skill"], names: ["Fortitude"], marca: "veneno", img: item.img, description: "<p>Marque em testes de Fortitude contra veneno.</p>" })]);
					return "caixa +5 contra veneno nos testes de Fortitude";
				}
			},
			{
				id: "fraquezas-ofidicas",
				nome: "Fraquezas Ofídicas",
				buscar: (a) => poderes(a, /^fraquezas ofidicas/).filter((i) => !temChave(i, /resistencias\.frio\.danoPorDado/))
					.map((item) => ({ item, problema: "Sem efeito: não soma +1 por dado de frio nem dá −5 contra Músicas de bardo." })),
				corrigir: async (a, item, ctx) => {
					await ctx.trocarEfeitos(a, item, [
						efeito("Fraquezas Ofídicas (frio)", [muda("system.tracos.resistencias.frio.danoPorDado", "true", "override")], { img: item.img }),
						efeito("Contra Música de bardo (−5)", [muda("roll", -5)], { uso: true, types: ["skill"], names: ["Fortitude", "Reflexos", "Vontade"], img: item.img, description: "<p>Marque em testes de resistência contra Músicas de bardo.</p>" })
					]);
					return "+1 por dado de frio e caixa −5 contra Música";
				}
			},
			{
				id: "ossos-frageis",
				nome: "Ossos Frágeis",
				buscar: (a) => poderes(a, /^ossos frageis/).filter((i) => !temChave(i, /resistencias\.impacto\.danoPorDado/))
					.map((item) => ({ item, problema: "Sem efeito: não soma +1 por dado de dano de impacto." })),
				corrigir: async (a, item, ctx) => {
					await ctx.trocarEfeitos(a, item, [efeito("Ossos Frágeis", [muda("system.tracos.resistencias.impacto.danoPorDado", "true", "override")], { img: item.img })]);
					return "+1 por dado de impacto";
				}
			},
			{
				id: "visao-trevas",
				nome: "Visão nas Trevas",
				buscar: (a) => poderes(a, /^visao nas trevas/).filter((i) => !temChave(i, /sentidos/))
					.map((item) => ({ item, problema: "Sem efeito: a ficha não ganha visão no escuro." })),
				corrigir: async (a, item, ctx) => {
					await ctx.trocarEfeitos(a, item, [efeito("Visão nas Trevas", [muda("system.attributes.sentidos.value", "escuro")], { img: item.img })]);
					return "visão no escuro";
				}
			},
			{
				id: "furia",
				nome: "Fúria",
				buscar: (a) => poderes(a, /^furia$/).filter((i) => !["special", "scene"].includes(i.system.duracao?.units) || i.system.ativacao?.execucao !== "free")
					.map((item) => ({ item, problema: `Duração "${item.system.duracao?.value} ${item.system.duracao?.units}": o efeito da Fúria some sozinho depois de ${item.system.duracao?.value} rodadas, em vez de durar até você parar (fim da cena no máximo). Execução volta a ser ação livre.` })),
				corrigir: async (a, item, ctx) => {
					await ctx.atualizar(a, item, { "system.duracao.units": "special", "system.ativacao.execucao": "free" });
					return "duração especial (até o fim da cena), ação livre";
				}
			},
			{
				id: "furia-bestial",
				nome: "Fúria Bestial",
				buscar: (a) => poderes(a, /^furia bestial/).filter((i) => !poderes(a, /^furia$/).some((f) => f.effects.some((e) => marca(e) === "furia-bestial")) && !i.effects.some((e) => marca(e) === "furia-bestial"))
					.map((item) => ({ item, problema: "O efeito está no formato antigo (antes do 1.6) e desligado: os +2 passos e o +1 no multiplicador de crítico nunca entram no ataque." })),
				corrigir: async (a, item, ctx) => {
					const furia = poderes(a, /^furia$/)[0];
					const changes = [muda("passos", 2, "custom"), muda("criticoX", 1)];
					const desc = "<p>Fúria Bestial: armas naturais +2 passos de dano e +1 no multiplicador de crítico enquanto em fúria.</p>";
					await ctx.trocarEfeitos(a, item, []);
					if (furia) {
						await ctx.criarEfeitos(a, furia, [efeito("Fúria Bestial · armas naturais", changes, { uso: true, card: true, automatic: true, names: nomesNaturais(a), marca: "furia-bestial", img: item.img, description: desc })]);
						return `no card da Fúria aparece "Fúria Bestial · armas naturais"; aplicado, entra sozinho em ${nomesNaturais(a).join(", ")}`;
					}
					await ctx.criarEfeitos(a, item, [efeito("Fúria Bestial", changes, { uso: true, names: nomesNaturais(a), marca: "furia-bestial", img: item.img, description: desc })]);
					return "caixa nos ataques com armas naturais";
				}
			},
			{
				id: "presas-primordiais",
				nome: "Presas Primordiais",
				buscar: (a) => poderes(a, /^presas primordiais/).filter((i) => temMordida(a) && !i.effects.some((e) => marca(e) === "presas"))
					.map((item) => ({ item, problema: "Com mordida da raça, o poder só aumenta o dano dela em 2 passos. Hoje o +2 fica como caixa em QUALQUER ataque, sem gastar o PM, e soma +2 no dano em vez de subir o dado (tipo \"add\" em vez de \"custom\")." })),
				corrigir: async (a, item, ctx) => {
					await ctx.trocarEfeitos(a, item, [efeito("Presas Primordiais · mordida (+2 passos)", [muda("passos", 2, "custom")], { uso: true, card: true, automatic: true, names: ["Mordida"], marca: "presas", img: item.img, description: "<p>Até o fim da cena, o dano da mordida aumenta em dois passos.</p>" })]);
					await ctx.atualizar(a, item, { "system.rolls": [], "system.ativacao.custo": 1 });
					return "usar o poder (1 PM) traz o efeito da cena; aplicado, a Mordida sobe 2 passos sozinha";
				}
			},
			{
				id: "infusao-distante",
				nome: "Infusão Distante",
				buscar: (a) => poderes(a, /^infusao distante/).filter((i) => !i.effects.some((e) => e.system.onuse && (e.system.changes ?? []).some((c) => c.key === "alcance")))
					.map((item) => ({ item, problema: "Efeito no formato antigo (antes do 1.6), sem mudanças: não aparece ao usar alquímicos." })),
				corrigir: async (a, item, ctx) => {
					await ctx.trocarEfeitos(a, item, [efeito("Infusão Distante", [muda("alcance", "curto", "override")], { uso: true, types: ["consumable"], custo: 1, img: item.img, description: "<p>Alquímico ou poção que afetaria um alvo adjacente afeta um alvo em alcance curto (médio com Granadeiro).</p>" })]);
					return "caixa de 1 PM ao usar consumíveis (alcance curto)";
				}
			},
			{
				id: "legado",
				nome: "Efeito de Uso antigo",
				buscar: (a) => a.items.filter((i) => i.effects.some(legado) && !/^(furia bestial|infusao distante)/.test(norm(i.name)))
					.map((item) => ({ item, problema: "Efeito de Uso no formato antigo (antes do 1.6, em flags): o sistema não o mostra na janela de rolagem." })),
				corrigir: async (a, item, ctx) => {
					const tiposK = ["self", "ability", "attack", "consumable", "equipment", "power", "skill", "spell"];
					const upd = item.effects.filter(legado).map((e) => {
						const f = e.flags.tormenta20;
						let types = tiposK.filter((k) => f[k]);
						let names = String(f.items ?? "").replaceAll(",", ";").split(";").map((s) => s.trim()).filter(Boolean);
						let changes = e.system.changes;
						// Sem tipo marcado e só bônus de perícia ("+5 em Percepção para..."): vira caixa naquela perícia
						const pericias = changes.map((c) => c.key.match(/^system\.pericias\.(\w+)\.bonus$/)?.[1]);
						if (!types.length && !names.length && changes.length && pericias.every(Boolean)) {
							types = ["skill"];
							names = pericias.map((k) => a.system.pericias?.[k]?.label ?? k);
							changes = changes.map((c) => muda("roll", c.value));
						}
						return {
							_id: e.id,
							disabled: true,
							"flags.tormenta20.onuse": false,
							"system.onuse": true,
							"system.changes": changes,
							"system.abilityUse.types": types,
							"system.abilityUse.names": names,
							"system.abilityUse.custo": numero(f.custo) ? Number(f.custo) : null,
							"system.abilityUse.aumenta": !!f.aumenta
						};
					});
					await ctx.atualizarEfeitos(a, item, upd);
					return `${upd.length} Efeito(s) de Uso migrado(s)`;
				}
			},
			{
				id: "vanguardista",
				nome: "Vanguardista",
				buscar: (a) => poderes(a, /^vanguardista/).filter((i) => i.effects.some((e) => e.system.onuse && (e.system.changes ?? []).some((c) => c.key === "roll") && !tam(e.system.abilityUse.names)))
					.map((item) => ({ item, problema: "Além do +2 fixo no Ofício, há um Efeito de Uso que oferece +2 em QUALQUER perícia." })),
				corrigir: async (a, item, ctx) => {
					for (const e of item.effects.filter((e) => e.system.onuse)) await ctx.apagarEfeito(a, item, e);
					const fixo = item.effects.find((e) => !e.system.onuse);
					if (fixo) await ctx.atualizarEfeitos(a, item, [{ _id: fixo.id, "system.changes": fixo.system.changes.map((c) => ({ ...c, value: String(c.value).replace(/^\+/, "") })) }]);
					return "fica só o +2 no Ofício escolhido";
				}
			},
			{
				id: "adepto",
				nome: "Adepto (parceiro)",
				buscar: (a) => poderes(a, /^adepto$/).filter((i) => i.effects.filter((e) => e.system.onuse).length > 1)
					.map((item) => ({ item, problema: `${item.effects.filter((e) => e.system.onuse).length} caixas de −1 PM iguais: marcando todas, a magia sai −${item.effects.filter((e) => e.system.onuse).length} PM. Iniciante é −1 PM em magias de 1º círculo.` })),
				corrigir: async (a, item, ctx) => {
					const usos = item.effects.filter((e) => e.system.onuse);
					for (const e of usos.slice(1)) await ctx.apagarEfeito(a, item, e);
					await ctx.atualizarEfeitos(a, item, [{ _id: usos[0].id, name: "Adepto (−1 PM, 1º círculo)", description: "<p>Iniciante: −1 PM em magias de 1º círculo. Veterano: também 2º círculo. Mestre: acumula com outras reduções.</p>" }]);
					return "uma caixa só";
				}
			},
			{
				id: "foco-em-magia",
				nome: "Foco em Magia",
				buscar: (a) => poderes(a, /^foco em magia/).filter((i) => i.effects.some((e) => e.system.onuse && !tam(e.system.abilityUse.names)) && magiaDoFoco(a, i))
					.map((item) => ({ item, problema: `O −1 PM aparece como caixa em todas as magias; deveria valer só para ${magiaDoFoco(a, item).name}, sempre.` })),
				corrigir: async (a, item, ctx) => {
					const m = magiaDoFoco(a, item);
					const uso = item.effects.find((e) => e.system.onuse);
					await ctx.atualizarEfeitos(a, item, [{ _id: uso.id, "system.abilityUse.types": [], "system.abilityUse.names": [m.name], "system.abilityUse.automatic": true }]);
					return `−1 PM automático em ${m.name}`;
				}
			},
			{
				id: "citadino",
				nome: "Citadino",
				buscar: (a) => poderes(a, /^citadino/).filter((i) => temChave(i, /pericias\.atr\.car$/) && !temChave(i, /pericias\.ades\.bonus$/))
					.map((item) => ({ item, problema: "O +2 nas perícias de Carisma também entra em Adestramento (o poder exclui)." })),
				corrigir: async (a, item, ctx) => {
					const e = item.effects.find((x) => (x.system.changes ?? []).some((c) => /pericias\.atr\.car$/.test(c.key)));
					await ctx.atualizarEfeitos(a, item, [{ _id: e.id, "system.changes": [...e.system.changes, muda("system.pericias.ades.bonus", -2)] }]);
					return "−2 em Adestramento compensa";
				}
			},
			{
				id: "montaria-mestre",
				nome: "Montaria (Mestre)",
				buscar: (a) => a.items.filter((i) => i.type === "poder" && i.effects.some((e) => /mestre$/i.test(e.name) && (e.system.changes ?? []).filter((c) => c.key === "system.pericias.fort.bonus").length > 1))
					.map((item) => ({ item, problema: "O efeito Mestre soma +15 em Fortitude em vez de +5 em Fortitude, Reflexos e Vontade." })),
				corrigir: async (a, item, ctx) => {
					const upd = item.effects.filter((e) => /mestre$/i.test(e.name)).map((e) => {
						const resto = e.system.changes.filter((c) => c.key !== "system.pericias.fort.bonus");
						const v = e.system.changes.find((c) => c.key === "system.pericias.fort.bonus").value;
						return { _id: e.id, "system.changes": [...resto, ...["fort", "refl", "vont"].map((p) => muda(`system.pericias.${p}.bonus`, v))] };
					});
					await ctx.atualizarEfeitos(a, item, upd);
					return "+5 em Fortitude, Reflexos e Vontade";
				}
			},
			{
				id: "combate-defensivo",
				nome: "Combate Defensivo",
				buscar: (a) => poderes(a, /^combate defensivo/).filter(() => !a.effects.some((e) => e.getFlag("world", "fdtCombateDefensivo") === "uso"))
					.map((item) => ({ item, problema: "O poder do compêndio só aplica o −2 no ataque; o +5 na Defesa nunca chega ao card." })),
				corrigir: async (a, item, ctx) => {
					// O mesmo que a macro "Poder · Combate Defensivo" (poder-combate-defensivo.js) faz
					const FLAG = "fdtCombateDefensivo";
					const NOME_DEFESA = "Combate Defensivo · Defesa";
					const defesa = {
						name: NOME_DEFESA, img: item.img, type: "base", transfer: true, disabled: true,
						duration: { value: 1, units: "rounds", expiry: "turnStart" },
						description: "<p>Até o início do seu próximo turno: +5 na Defesa e −2 em todos os testes de ataque.</p>",
						statuses: [], flags: { world: { [FLAG]: "defesa" } },
						system: { changes: [muda("system.attributes.defesa.bonus", 5), muda("system.modificadores.pericias.ataque", -2)], onuse: false, abilityUse: { types: [], names: [], automatic: false, aumenta: false, custo: 0, description: "" } }
					};
					const upd = item.effects.filter((e) => e.system.onuse && e.getFlag("world", FLAG) == null)
						.map((e) => ({ _id: e.id, name: "Combate Defensivo (compêndio, desativado)", "system.abilityUse.types": [] }));
					const velha = item.effects.find((e) => e.getFlag("world", FLAG) === "defesa") ?? item.effects.find((e) => !e.system.onuse && e.getFlag("world", FLAG) == null);
					if (velha) upd.push({ _id: velha.id, ...defesa });
					if (upd.length) await ctx.atualizarEfeitos(a, item, upd);
					if (!velha) await ctx.criarEfeitos(a, item, [defesa]);
					const [uso] = await a.createEmbeddedDocuments("ActiveEffect", [{
						name: "Combate Defensivo", img: item.img, type: "base", transfer: false, disabled: true, origin: item.uuid, duration: {},
						description: "<p>Ação agredir defensiva: −2 neste ataque e o card traz o efeito de +5 na Defesa até seu próximo turno.</p>",
						statuses: [], flags: { world: { [FLAG]: "uso" } },
						system: { changes: [muda("ataque", -2), muda("efeito", NOME_DEFESA)], onuse: true, abilityUse: { types: ["attack"], names: [], automatic: false, aumenta: false, custo: null, description: "" } }
					}]);
					ctx.guardar(a, { tipo: "efeitoCriado", id: uso.id });
					return "caixa no ataque (−2) e o card traz +5 na Defesa até o próximo turno";
				}
			},
			{
				id: "provocacao-petulante",
				nome: "Provocação Petulante",
				buscar: (a) => poderes(a, /^provocacao petulante/).filter((i) => !i.effects.some((e) => marca(e) === "postura"))
					.map((item) => ({ item, problema: "Sem efeito: a postura não fica marcada na ficha e ninguém testa Vontade." })),
				corrigir: async (a, item, ctx) => {
					await ctx.criarEfeitos(a, item, [efeito("Provocação Petulante (postura)", [], { card: true, marca: "postura", img: item.img, description: "<p>Postura ativa. Com a macro PJs · Automações ligada, inimigos que começam o turno em alcance curto testam Vontade.</p>" })]);
					return "o card traz a postura; com PJs · Automações ligada, os inimigos testam Vontade";
				}
			},
			{
				id: "efeito-solto",
				nome: "Efeito avulso no ator",
				buscar: (a) => a.effects.map((e) => {
					if (e.getFlag("world", "fdt") || marca(e) || e.getFlag("world", "fdtCombateDefensivo") || e.statuses?.size) return null;
					const ch = e.system.changes ?? [];
					const chaves = ch.map((c) => c.key || "(vazia)").join(", ");
					// Cópia à mão do Efeito de Uso de um poder da ficha (ex.: "Engenhosidade", ou descrição "Presas Primordiais")
					if (e.system.onuse) {
						const texto = norm(`${e.name} ${String(e.description ?? "").replace(/<[^>]+>/g, " ")}`);
						const dono = a.items.find((i) => i.type === "poder" && i.effects.size && texto.includes(norm(i.name)));
						if (dono) return { efeitoAtor: e, rotulo: `Efeito no ator "${e.name}"`, problema: `Efeito de Uso "${e.name}" criado à mão no ator, copiando "${dono.name}" (chave ${chaves}). Com o poder corrigido, a caixa apareceria duas vezes${ch.some((c) => c.key === "passos" && c.type === "add") ? "; e esta soma +2 no dano de qualquer arma em vez de subir o dado" : ""}.` };
						if (!tam(e.system.abilityUse.types) && !tam(e.system.abilityUse.names)) return { efeitoAtor: e, rotulo: `Efeito no ator "${e.name}"`, problema: `Efeito de Uso "${e.name}" no ator sem tipo nem item: não aparece em nenhuma rolagem.` };
						return null;
					}
					if (e.disabled && ch.length && ch.every((c) => !/^(system|flags|token|macro)\./.test(c.key))) return { efeitoAtor: e, rotulo: `Efeito no ator "${e.name}"`, problema: `Efeito "${e.name}" desligado no ator com a chave "${chaves}", que só funciona em Efeito de Uso: não faz nada.` };
					return null;
				}).filter(Boolean),
				corrigir: async (a, _item, ctx, achado) => {
					ctx.guardar(a, { tipo: "efeitoAtor", dados: achado.efeitoAtor.toObject() });
					await achado.efeitoAtor.delete();
					return "apagado";
				}
			}
		];

		/** A magia que um "Foco em Magia (X)" nomeia, se a ficha tem. */
		function magiaDoFoco(a, item) {
			const alvo = norm(item.name.match(/\((.+)\)/)?.[1]);
			if (!alvo) return null;
			const palavras = alvo.split(/\s+/).filter((p) => p.length > 2);
			return a.items.find((i) => i.type === "magia" && norm(i.name) === alvo)
				?? a.items.find((i) => i.type === "magia" && palavras.every((p) => norm(i.name).includes(p.slice(0, 4))));
		}

		/** Poderes que já funcionam por macro (não há o que corrigir na ficha). */
		const MACROS = [
			[/^mau cheiro/, "PJs · Mau Cheiro"],
			[/^sortudo/, "PJs · Rolar de novo"],
			[/^sorte salvadora/, "PJs · Rolar de novo"],
			[/^temeroso/, "PJs · Automações (abalado ao lado de inimigo)"],
			[/^provocacao petulante/, "PJs · Automações (Vontade no início do turno)"]
		];

		/** Lista do que está errado no ator. */
		const planejar = (a) => CORRECOES.flatMap((c) => c.buscar(a).map((x) => ({ ...x, correcao: c, ator: a })));

		/** Contexto de aplicação: faz as mudanças e guarda o necessário para desfazer. */
		const contexto = (dados) => {
			const passos = new Map();
			const guardar = (a, p) => {
				if (!passos.has(a.id)) passos.set(a.id, []);
				passos.get(a.id).push(p);
			};
			const guardados = new Set();
			const guardarItem = async (a, item) => {
				if (guardados.has(item.uuid)) return;
				guardados.add(item.uuid);
				guardar(a, { tipo: "item", dados: item.toObject() });
			};
			return {
				dados,
				passos,
				guardar,
				guardarItem,
				async criar(a, itens) {
					const criados = await a.createEmbeddedDocuments("Item", itens);
					for (const c of criados) guardar(a, { tipo: "criado", id: c.id });
					return criados;
				},
				async apagar(a, item) {
					await guardarItem(a, item);
					await item.delete();
				},
				async atualizar(a, item, upd) {
					await guardarItem(a, item);
					await item.update(upd);
				},
				async atualizarAtor(a, upd) {
					guardar(a, { tipo: "ator", dados: Object.fromEntries(Object.keys(upd).map((k) => [k, foundry.utils.getProperty(a._source, k)])) });
					await a.update(upd);
				},
				async trocarEfeitos(a, item, novos) {
					await guardarItem(a, item);
					const ids = item.effects.map((e) => e.id);
					if (ids.length) await item.deleteEmbeddedDocuments("ActiveEffect", ids);
					if (novos.length) await item.createEmbeddedDocuments("ActiveEffect", novos);
				},
				async criarEfeitos(a, item, novos) {
					await guardarItem(a, item);
					await item.createEmbeddedDocuments("ActiveEffect", novos);
				},
				async atualizarEfeitos(a, item, upd) {
					await guardarItem(a, item);
					await item.updateEmbeddedDocuments("ActiveEffect", upd);
				},
				async apagarEfeito(a, item, e) {
					await guardarItem(a, item);
					await e.delete();
				}
			};
		};

		/** Aplica os achados escolhidos. Devolve as linhas do relatório por ator. */
		async function aplicar(achados, dados = {}) {
			const ctx = contexto(dados);
			const log = new Map();
			for (const x of achados) {
				const a = x.ator;
				const item = x.item ? a.items.get(x.item.id) : null;
				if (x.item && !item) continue; // apagado por outra correção (cópia de mordida)
				let txt;
				try {
					txt = await x.correcao.corrigir(a, item, ctx, x);
				} catch (err) {
					console.warn("FdT · Poderes dos PJs:", err);
					txt = `⚠️ falhou: ${err.message}`;
				}
				if (!log.has(a.id)) log.set(a.id, []);
				log.get(a.id).push(`<b>${esc(x.rotulo ?? x.item?.name ?? x.correcao.nome)}</b>: ${esc(txt)}`);
			}
			for (const [id, passos] of ctx.passos) await game.actors.get(id).setFlag("world", BACKUP, { quando: new Date().toISOString(), passos });
			return log;
		}

		/** Desfaz a última correção do ator. */
		async function desfazer(a) {
			const b = a.getFlag("world", BACKUP);
			if (!b?.passos?.length) return false;
			for (const p of [...b.passos].reverse()) {
				if (p.tipo === "criado") await a.items.get(p.id)?.delete();
				else if (p.tipo === "efeitoCriado") await a.effects.get(p.id)?.delete();
				else if (p.tipo === "efeitoAtor" && !a.effects.get(p.dados._id)) await a.createEmbeddedDocuments("ActiveEffect", [p.dados], { keepId: true });
				else if (p.tipo === "ator") await a.update(p.dados);
				else if (p.tipo === "item") {
					await a.items.get(p.dados._id)?.delete();
					await a.createEmbeddedDocuments("Item", [p.dados], { keepId: true });
				}
			}
			await a.unsetFlag("world", BACKUP);
			return true;
		}

		/* ---------------------------------------------------------------- */
		/* Automações de cena (Temeroso, Provocação Petulante)               */
		/* ---------------------------------------------------------------- */
		const hostis = (t1, t2) => (t1.document.disposition ?? 0) * (t2.document.disposition ?? 0) < 0;
		const adjacentes = (t1, t2) => {
			const gs = canvas.grid.size;
			const r = (t) => ({ x0: t.document.x, y0: t.document.y, x1: t.document.x + (t.document.width ?? 1) * gs, y1: t.document.y + (t.document.height ?? 1) * gs });
			const a = r(t1), b = r(t2);
			const gx = Math.max(b.x0 - a.x1, a.x0 - b.x1, 0) / gs;
			const gy = Math.max(b.y0 - a.y1, a.y0 - b.y1, 0) / gs;
			return gx < 0.5 && gy < 0.5;
		};
		const distancia = (t1, t2) => canvas.grid.measurePath([t1.center, t2.center]).distance;
		/** Dados de uma condição do sistema, para criar um efeito com outro nome. */
		const condicao = (id) => {
			const st = CONFIG.statusEffects[id];
			const d = foundry.utils.deepClone(st?._source ?? st ?? { name: id, statuses: [id] });
			delete d._id;
			delete d.id;
			if (d.system?.aura) delete d.system.aura.disposition;
			d.type ??= "base";
			return d;
		};
		const vivo = (t) => (t.actor?.system?.attributes?.pv?.value ?? 1) > 0;

		/** Temeroso: abalado enquanto adjacente a um inimigo. */
		async function checarTemeroso() {
			if (!canvas.scene) return;
			const tokens = canvas.tokens.placeables.filter((t) => t.actor);
			for (const t of tokens) {
				const a = t.actor;
				if (!tem(a, /^temeroso/)) continue;
				const perto = tokens.some((o) => o !== t && o.actor !== a && hostis(t, o) && vivo(o) && adjacentes(t, o));
				const atual = a.effects.find((e) => e.getFlag("world", "fdtTemeroso"));
				if (perto && !atual) {
					const base = condicao("abalado");
					base.name = "Temeroso · abalado (inimigo adjacente)";
					base.flags = { ...(base.flags ?? {}), world: { fdtTemeroso: true } };
					await a.createEmbeddedDocuments("ActiveEffect", [base]);
				} else if (!perto && atual) await atual.delete();
			}
		}

		/** Provocação Petulante: no início do turno de um inimigo em alcance curto, teste de Vontade. */
		async function checarProvocacao(combat) {
			const c = combat?.combatant;
			const tokDoc = c?.token;
			if (!tokDoc) return;
			const alvo = canvas.tokens.get(tokDoc.id);
			if (!alvo?.actor || !vivo(alvo)) return;
			const chave = `${combat.id}.${combat.round}.${combat.turn}`;
			const st = (globalThis.fdtPoderesAuto ??= { hooks: [], vistos: new Set() });
			if (st.vistos.has(chave)) return;
			st.vistos.add(chave);
			const provocadores = canvas.tokens.placeables.filter((t) => t.actor && t !== alvo && t.actor.effects.some((e) => e.getFlag("world", MARCA) === "postura" && !e.disabled));
			for (const p of provocadores) {
				if (!hostis(p, alvo) || distancia(p, alvo) > 9) continue;
				const pa = p.actor;
				const cd = 10 + Math.floor((Number(pa.system.attributes?.nivel?.value) || 1) / 2) + (Number(pa.system.atributos?.car?.value) || 0);
				const r = await new Roll("1d20 + @v", { v: Number(alvo.actor.system.pericias?.vont?.value) || 0 }).evaluate();
				const falhou = r.total < cd;
				if (falhou) {
					await alvo.actor.createEmbeddedDocuments("ActiveEffect", [{
						name: `Provocado por ${pa.name}`,
						img: "icons/skills/social/intimidation-impressing.webp",
						type: "base",
						duration: { value: 1, units: "rounds", expiry: "turnEnd" },
						description: `<p>Qualquer ação hostil deste turno precisa ter ${esc(pa.name)} como alvo (Provocação Petulante).</p>`,
						flags: { world: { fdtProvocado: pa.id } },
						system: { changes: [] }
					}]);
				}
				await ChatMessage.create({
					speaker: { alias: "Provocação Petulante" },
					rolls: [r],
					content: `<p><b>${esc(alvo.name)}</b> começa o turno perto de <b>${esc(pa.name)}</b> e testa Vontade (CD ${cd}): <b>${r.total}</b>. ${falhou ? "Falhou: ações hostis deste turno precisam ter " + esc(pa.name) + " como alvo." : "Passou."}</p>`
				});
			}
		}

		const lider = () => game.user.isGM && (!game.users.activeGM || game.users.activeGM === game.user);
		function ligarAutomacoes() {
			if (globalThis.fdtPoderesAuto?.hooks?.length) return false;
			const st = (globalThis.fdtPoderesAuto ??= { hooks: [], vistos: new Set() });
			const temeroso = foundry.utils.debounce(() => lider() && checarTemeroso(), 300);
			st.hooks = [
				["updateToken", Hooks.on("updateToken", (doc, mudou) => { if ("x" in mudou || "y" in mudou || "disposition" in mudou) temeroso(); })],
				["createToken", Hooks.on("createToken", () => temeroso())],
				["deleteToken", Hooks.on("deleteToken", () => temeroso())],
				["canvasReady", Hooks.on("canvasReady", () => temeroso())],
				["updateCombat", Hooks.on("updateCombat", (combat, mudou) => {
					if (!lider() || !("turn" in mudou || "round" in mudou)) return;
					temeroso();
					return checarProvocacao(combat);
				})]
			];
			temeroso();
			return true;
		}
		function desligarAutomacoes() {
			for (const [h, id] of globalThis.fdtPoderesAuto?.hooks ?? []) Hooks.off(h, id);
			delete globalThis.fdtPoderesAuto;
		}

		return { TAG, MODULO, MARCA, BACKUP, ELEMENTOS, MACROS, condicao, gm, norm, esc, poderes, tem, formulario, atoresAlvo, armaNatural, elementoProvavel, planejar, aplicar, desfazer, checarTemeroso, checarProvocacao, ligarAutomacoes, desligarAutomacoes };
	}

	/* ------------------------------------------------------------------ */
	/* 2. Macros                                                              */
	/* ------------------------------------------------------------------ */

	/** PJs · Corrigir poderes */
	async function macroCorrigir(P) {
		if (!game.user.isGM) return ui.notifications.warn("Só o Mestre corrige as fichas.");
		const atores = P.atoresAlvo({ todos: true });
		if (!atores.length) return ui.notifications.warn("Nenhum personagem: selecione tokens ou dê dono aos PJs.");
		const achados = atores.flatMap((a) => P.planejar(a));
		const comBackup = atores.filter((a) => a.getFlag("world", P.BACKUP));
		const linhas = atores.map((a) => {
			const meus = achados.filter((x) => x.ator === a);
			const macros = P.MACROS.filter(([re]) => P.tem(a, re)).map(([, m]) => m);
			const lis = meus.map((x, i) => {
				const n = achados.indexOf(x);
				const el = x.escolha === "elemento"
					? `<br><select name="el_${a.id}">${Object.entries(P.ELEMENTOS).map(([k, v]) => `<option value="${k}" ${k === P.elementoProvavel(a) ? "selected" : ""}>${v}</option>`).join("")}</select>`
					: "";
				return `<li><label><input type="checkbox" name="c_${n}" checked> <b>${P.esc(x.rotulo ?? x.item?.name ?? x.correcao.nome)}</b></label>: ${P.esc(x.problema)}${el}</li>`;
			}).join("");
			return `<h3>${P.esc(a.name)}</h3>${lis ? `<ul>${lis}</ul>` : "<p>Nada para corrigir.</p>"}${macros.length ? `<p style="font-size:0.85em">Por macro: ${[...new Set(macros)].map(P.esc).join(" · ")}</p>` : ""}`;
		}).join("");
		const d = await P.formulario("Poderes dos PJs", `
			<div class="form-group"><label>Ação</label><select name="acao">
				<option value="corrigir">Corrigir o que está marcado</option>
				<option value="relatorio">Só mandar o relatório para o chat</option>
				<option value="desfazer">Desfazer a última correção${comBackup.length ? ` (${comBackup.map((a) => P.esc(a.name)).join(", ")})` : ""}</option>
			</select></div>
			<p style="font-size:0.85em">Antes de mexer, a macro guarda uma cópia de cada poder alterado na ficha (dá para desfazer).</p>
			<div style="max-height:420px;overflow-y:auto">${linhas}</div>`, "Executar");
		if (!d) return;
		const fala = (html) => ChatMessage.create({ speaker: { alias: "Poderes dos PJs" }, whisper: P.gm(), content: html });
		if (d.acao === "desfazer") {
			const feitos = [];
			for (const a of atores) if (await P.desfazer(a)) feitos.push(a.name);
			return fala(`<h3>Poderes dos PJs: desfeito</h3><p>${feitos.length ? feitos.map(P.esc).join(", ") : "Nenhuma ficha tinha correção para desfazer."}</p>`);
		}
		if (d.acao === "relatorio") {
			return fala(`<h3>Poderes dos PJs: revisão</h3>${atores.map((a) => {
				const meus = achados.filter((x) => x.ator === a);
				return `<p><b>${P.esc(a.name)}</b>: ${meus.length ? meus.map((x) => `${P.esc(x.rotulo ?? x.item?.name ?? x.correcao.nome)} (${P.esc(x.problema)})`).join("; ") : "tudo certo"}</p>`;
			}).join("")}`);
		}
		const escolhidos = achados.filter((x, n) => d[`c_${n}`]);
		if (!escolhidos.length) return ui.notifications.info("Nada marcado para corrigir.");
		const log = await P.aplicar(escolhidos, d);
		await fala(`<h3>Poderes dos PJs: corrigido</h3>${[...log].map(([id, l]) => `<p><b>${P.esc(game.actors.get(id)?.name)}</b><br>${l.join("<br>")}</p>`).join("")}<p style="font-size:0.85em">Para voltar atrás: rode esta macro de novo e escolha "Desfazer".</p>`);
	}

	/** PJs · Mau Cheiro (trog) */
	async function macroMauCheiro(P) {
		const [a] = P.atoresAlvo();
		if (!a) return ui.notifications.warn("Selecione o token do trog.");
		const poder = P.poderes(a, /^mau cheiro/)[0];
		if (!poder) return ui.notifications.warn(`${a.name} não tem o poder Mau Cheiro.`);
		const origem = a.getActiveTokens?.()[0] ?? canvas.tokens.controlled[0];
		if (!origem) return ui.notifications.warn("O trog precisa de um token na cena.");
		const cd = 10 + Math.floor((Number(a.system.attributes?.nivel?.value) || 1) / 2) + (Number(a.system.atributos?.con?.value) || 0);
		const agora = game.time.worldTime;
		const trog = (x) => /trog/i.test(x.name) || x.items.some((i) => i.type === "raca" && /trog/i.test(i.name));
		const alvos = canvas.tokens.placeables.filter((t) => t !== origem && t.actor && t.actor !== a && !trog(t.actor) && canvas.grid.measurePath([origem.center, t.center]).distance <= 9);
		const imunes = alvos.filter((t) => (t.actor.getFlag("world", "fdtMauCheiro")?.[a.id] ?? -1) > agora);
		const testam = alvos.filter((t) => !imunes.includes(t));
		const d = await P.formulario("Mau Cheiro", `
			<p><b>${P.esc(a.name)}</b> gasta uma ação padrão e 2 PM. Criaturas em alcance curto (9 m), menos trogs, testam Fortitude contra veneno (CD ${cd}). Falha: enjoadas por 1d6 rodadas. Quem passa fica imune por um dia.</p>
			<p>${testam.length} criatura(s) testam${imunes.length ? `; imunes hoje: ${imunes.map((t) => P.esc(t.name)).join(", ")}` : ""}.</p>
			<div class="form-group"><label>Gastar 2 PM</label><input type="checkbox" name="pm" checked></div>`, "Expelir o gás");
		if (!d) return;
		if (!testam.length) return ui.notifications.info("Ninguém em alcance curto para testar.");
		if (d.pm) await a.spendMana(2);
		const rolls = [];
		const linhas = [];
		for (const t of testam) {
			const x = t.actor;
			const bonus = Number(x.system.pericias?.fort?.value) || 0;
			const veneno = P.tem(x, /^presentes de ssaazzaas/) ? 5 : 0;
			const r = await new Roll("1d20 + @b + @v", { b: bonus, v: veneno }).evaluate();
			rolls.push(r);
			if (r.total >= cd) {
				await x.setFlag("world", "fdtMauCheiro", { ...(x.getFlag("world", "fdtMauCheiro") ?? {}), [a.id]: agora + 86400 });
				linhas.push(`${P.esc(t.name)}: ${r.total} · passou (imune por um dia)`);
				continue;
			}
			const dur = await new Roll("1d6").evaluate();
			rolls.push(dur);
			const ef = P.condicao("enjoado");
			ef.name = `${ef.name} (Mau Cheiro)`;
			ef.duration = { value: dur.total, units: "rounds", expiry: "turnStart" };
			ef.origin = a.uuid;
			await x.createEmbeddedDocuments("ActiveEffect", [ef]);
			linhas.push(`${P.esc(t.name)}: ${r.total} · <b>enjoado por ${dur.total} rodada(s)</b>`);
		}
		await ChatMessage.create({
			speaker: ChatMessage.getSpeaker({ actor: a }),
			rolls,
			content: `<h3>Mau Cheiro</h3><p>Fortitude contra veneno, CD ${cd}.</p><p>${linhas.join("<br>")}</p>`
		});
	}

	/** PJs · Rolar de novo (Sortudo / Sorte Salvadora) */
	async function macroRolarDeNovo(P) {
		const [a] = P.atoresAlvo();
		if (!a) return ui.notifications.warn("Selecione o token do personagem.");
		const opcoes = [];
		if (P.tem(a, /^sortudo/)) opcoes.push({ k: "sortudo", nome: "Sortudo", pm: 3, regra: "qualquer teste, uma vez por teste" });
		if (P.tem(a, /^sorte salvadora/)) opcoes.push({ k: "sorte", nome: "Sorte Salvadora", pm: 1, regra: "só testes de resistência" });
		if (!opcoes.length) return ui.notifications.warn(`${a.name} não tem Sortudo nem Sorte Salvadora.`);
		const msgs = game.messages.contents.filter((m) => m.speaker?.actor === a.id && m.rolls?.length).slice(-8).reverse();
		if (!msgs.length) return ui.notifications.warn(`Nenhum teste recente de ${a.name} no chat.`);
		const rotulo = (m) => {
			const txt = (m.flavor || m.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 50) || "teste";
			return `${txt} · ${m.rolls[0].total}${m.getFlag("world", "fdtRerrolado") ? " (já rolado de novo)" : ""}`;
		};
		const d = await P.formulario("Rolar de novo", `
			<div class="form-group"><label>Poder</label><select name="poder">${opcoes.map((o) => `<option value="${o.k}">${o.nome} (${o.pm} PM, ${o.regra})</option>`).join("")}</select></div>
			<div class="form-group"><label>Teste</label><select name="msg">${msgs.map((m) => `<option value="${m.id}">${P.esc(rotulo(m))}</option>`).join("")}</select></div>`, "Rolar");
		if (!d) return;
		const o = opcoes.find((x) => x.k === d.poder) ?? opcoes[0];
		const m = game.messages.get(d.msg) ?? msgs[0];
		const resist = /fortitude|reflexos|vontade/i.test(`${m.flavor ?? ""} ${m.content ?? ""}`);
		if (o.k === "sorte" && !resist) ui.notifications.warn("Sorte Salvadora vale só para testes de resistência (Fortitude, Reflexos ou Vontade).");
		if (o.k === "sortudo" && m.getFlag("world", "fdtRerrolado")) return ui.notifications.warn("Sortudo: este teste já foi rolado de novo.");
		const antiga = m.rolls[0];
		const nova = await new Roll(antiga.formula, antiga.data ?? {}).evaluate();
		await a.spendMana(o.pm);
		await m.setFlag("world", "fdtRerrolado", o.k);
		await ChatMessage.create({
			speaker: ChatMessage.getSpeaker({ actor: a }),
			rolls: [nova],
			flavor: `${o.nome} (${o.pm} PM): ${P.esc(rotulo(m).split(" · ")[0])}`,
			content: `<p>Antes: <s>${antiga.total}</s> · Agora: <b>${nova.total}</b></p>`
		});
	}

	/** PJs · Automações (Temeroso, Provocação Petulante) */
	async function macroAutomacoes(P, scope) {
		const salvar = async (v) => {
			try {
				await game.settings.set(P.MODULO, "automacoesPJs", v);
			} catch {
				// sem o módulo (macro colada à mão): vale só até recarregar
			}
		};
		if (scope?.auto) return P.ligarAutomacoes();
		if (!game.user.isGM) return ui.notifications.warn("Só o Mestre liga as automações (elas mexem nas fichas de todos).");
		const ligado = !!globalThis.fdtPoderesAuto?.hooks?.length;
		const d = await P.formulario("Automações dos poderes", `
			<ul>
				<li><b>Temeroso:</b> quem tem o poder fica abalado enquanto estiver adjacente a um inimigo (token de disposição oposta) e deixa de ficar quando se afasta.</li>
				<li><b>Provocação Petulante:</b> com a postura no ator (aplique o efeito do card do poder), cada inimigo que começa o turno em alcance curto testa Vontade (CD Car). Falhou: ganha o lembrete "Provocado por ..." até o fim do turno.</li>
			</ul>
			<div class="form-group"><label>Ligado (volta sozinho ao abrir o mundo)</label><input type="checkbox" name="ligar" ${ligado ? "checked" : ""}></div>`, "Salvar");
		if (!d) return;
		if (d.ligar) {
			P.ligarAutomacoes();
			await salvar(true);
			await P.checarTemeroso();
			ui.notifications.info("Automações de poderes ligadas.");
		} else {
			P.desligarAutomacoes();
			await salvar(false);
			ui.notifications.info("Automações de poderes desligadas.");
		}
	}

	const COMUM = `const P = (${comum.toString()})();`;
	const macro = (name, img, fn, role) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS({ fdtRole: role }),
		command: `// Fim dos Tempos · Poderes dos PJs · gerado por fdt-poderes-pjs.js\n${COMUM}\nawait (${fn.toString()})(P, typeof scope !== "undefined" ? scope : {});`
	});
	const macros = await Macro.createDocuments([
		macro("PJs · Corrigir poderes", "icons/tools/smithing/anvil.webp", macroCorrigir, "pjsCorrigir"),
		macro("PJs · Mau Cheiro", "icons/magic/air/fog-gas-smoke-green.webp", macroMauCheiro, "pjsMauCheiro"),
		macro("PJs · Rolar de novo", "icons/sundries/gaming/dice-runed-brown.webp", macroRolarDeNovo, "pjsRolarDeNovo"),
		macro("PJs · Automações", "icons/svg/regen.svg", macroAutomacoes, "pjsAutomacoes")
	]);

	/* ------------------------------------------------------------------ */
	/* 3. Armas naturais modelo                                               */
	/* ------------------------------------------------------------------ */
	const P = comum();
	const itens = await Item.createDocuments(["mordida", "cauda"].map((k) => P.armaNatural(k, { folder: pasta.Item, ownership: { default: 2 }, flags: FLAGS() })));

	/* ------------------------------------------------------------------ */
	/* 4. Diário com a revisão                                                */
	/* ------------------------------------------------------------------ */
	const L = (d) => `@UUID[${d.uuid}]{${d.name}}`;
	const M = (role) => L(macros.find((m) => m.getFlag("world", "fdtRole") === role));
	const linha = (poder, situacao, feito) => `<tr><td>${poder}</td><td>${situacao}</td><td>${feito}</td></tr>`;
	const tabela = (...ls) => `<table><thead><tr><th>Poder</th><th>Como estava</th><th>Agora</th></tr></thead><tbody>${ls.join("")}</tbody></table>`;
	const OK = "Funciona";
	const SEM = "Sem automação (regra de mesa)";
	const CORR = `Corrigido por ${M("pjsCorrigir")}`;
	const pagina = (name, html) => ({ name, type: "text", text: { content: html, format: 1 } });

	await JournalEntry.create({
		name: "FdT · Poderes dos PJs",
		folder: pasta.JournalEntry,
		flags: FLAGS({ fdtRole: "poderesPJs" }),
		pages: [
			pagina("Como usar", `
				<p>Revisão dos poderes de <b>Tariq, Rak, Hannah, Felix, Elyas e Balthazar</b> (fichas exportadas em out/2026), conferida no código do Tormenta20 1.6.4.</p>
				<ol>
					<li>Selecione os tokens dos PJs (ou nenhum, para todos os PJs com jogador) e rode ${M("pjsCorrigir")}. Ela lista cada problema achado; desmarque o que não quiser e clique em Executar. Cada poder alterado é guardado na ficha antes, e a opção <i>Desfazer</i> volta tudo.</li>
					<li>Ligue ${M("pjsAutomacoes")} uma vez: Temeroso e Provocação Petulante passam a funcionar sozinhos, e voltam ligados ao abrir o mundo.</li>
					<li>Na mesa: ${M("pjsMauCheiro")} para o Rak e ${M("pjsRolarDeNovo")} para o Felix (Sortudo e Sorte Salvadora).</li>
				</ol>
				<p>A macro de correção acha os problemas pelo nome do poder, então serve também para personagens novos com os mesmos poderes. Armas naturais modelo: ${itens.map(L).join(", ")}.</p>
				<h3>Por que estavam quebrados</h3>
				<ul>
					<li><b>Efeitos de Uso antigos.</b> Até o 1.5 o "Efeito de Uso" ficava em <code>flags.tormenta20</code>. O 1.6 migrou o mundo uma vez; poderes que vieram depois de módulos ou compêndios não migrados (Engenhosidade do Elyas, Fúria Bestial, Infusão Distante) ficaram desligados para sempre.</li>
					<li><b>Ataques dentro de poderes.</b> Mordida e Cauda tinham a rolagem no próprio poder. Poder não recebe os modificadores de ataque e dano corpo a corpo (a Fúria), nem passos e crítico. Como arma natural, recebem.</li>
					<li><b>Passos com tipo errado.</b> A chave <code>passos</code> só sobe o dado com tipo <i>custom</i>; com <i>add</i> o sistema soma o número no dano (Presas Primordiais do compêndio tem esse erro).</li>
					<li><b>Chave em branco.</b> Resistência Elemental do compêndio vem com <code>resistencias.???.value</code>, que o sistema ignora; e <code>.value</code> é recalculado, o certo é somar em <code>.bonus</code>.</li>
				</ul>`),
			pagina("Tariq (paladino qareen)", tabela(
				linha("Resistência Elemental", "Chave <code>???</code>: não valia. A ficha tinha luz 10 digitada à mão", `${CORR}: escolha o elemento; o valor passa para o efeito e o digitado zera`),
				linha("Desejos", "Caixa −1 PM em magias", OK),
				linha("Tatuagem Mística", "Caixa −1 PM em magias (só vale se aprender a magia de novo)", OK),
				linha("Impulsivo, Abençoado, Abraço da Fênix (imunidade a fogo)", "Efeitos certos", `${OK}. A cura com dano mágico de fogo é à mão`),
				linha("Golpe Divino, Cura pelas Mãos", "Iguais ao compêndio", OK),
				linha("Montaria: Trobo", "Mestre dava +15 em Fortitude", `${CORR}: +5 em Fortitude, Reflexos e Vontade`),
				linha("Combate Defensivo", "Só o −2 no ataque", `${CORR} (usa a macro Poder · Combate Defensivo)`),
				linha("Provocação Petulante", "Sem efeito", `${CORR}: o card traz a postura; com ${M("pjsAutomacoes")} os inimigos testam Vontade no início do turno`),
				linha("Herança, Código do Herói, Dom da Imortalidade, Paladino do Reino", "Texto", SEM),
				linha("Grupo · Nome, Grupo · Liderança", "Do módulo", OK))),
			pagina("Rak (bárbaro trog)", tabela(
				linha("Mordida (P.P) e Mordida (P.P+Fúria)", "Duas cópias do ataque com Presas e Fúria embutidos à mão; sem o bônus da Fúria", `${CORR}: vira a arma natural Mordida (1d6); as cópias somem`),
				linha("Presas Primordiais", "+2 como caixa em qualquer ataque, somando +2 no dano", `${CORR}: usar o poder (1 PM) traz o efeito da cena, que sobe a Mordida 2 passos sozinho`),
				linha("Fúria", "Durava 10 rodadas fixas", `${CORR}: até parar (fim da cena no máximo)`),
				linha("Fúria Bestial", "Formato antigo, nunca entrava", `${CORR}: o card da Fúria traz "Fúria Bestial · armas naturais" (+2 passos, crítico +1)`),
				linha("Mau Cheiro", "Sem automação", `${M("pjsMauCheiro")}: testes de Fortitude de todos em 9 m, enjoado 1d6 rodadas, imunidade de um dia`),
				linha("Efeito solto \"Rak Wraith Raiser\" no ator", "Chave passos fora de Efeito de Uso", `${CORR}: apagado`),
				linha("Reptiliano, Sangue Frio, Sentidos Aguçados, Chato", "Efeitos certos", OK),
				linha("Arma Natural Hábil, À Prova de Tudo", "Texto", SEM))),
			pagina("Hannah (feiticeira nagah)", tabela(
				linha("Cauda", "Ataque dentro do poder, sem a Força no dano", `${CORR}: arma natural Cauda (1d6 + For)`),
				linha("Presentes de Ssaazzaas", "Faltava resistência a veneno +5", `${CORR}: caixa +5 na Fortitude`),
				linha("Fraquezas Ofídicas", "Sem efeito", `${CORR}: +1 por dado de frio e caixa −5 contra Música`),
				linha("Foco em Magia (cura ferimentos)", "−1 PM como caixa em toda magia", `${CORR}: −1 PM automático em Curar Ferimentos`),
				linha("Temeroso", "Só o −5 em Luta", `${OK}; o abalado ao lado de inimigo vem de ${M("pjsAutomacoes")}`),
				linha("Inocência Dissimulada", "+2 Enganação", `${OK}. Trocar o teste por Enganação (2 PM) é à mão`),
				linha("Cura Gentil, Dom da Esperança, Caminho do Arcanista", "Efeitos certos", OK),
				linha("Aspirante a herói, Linhagem Abençoada, Magia Ilimitada, Recurvado, Conhecimento Mágico", "Texto", SEM))),
			pagina("Felix (bardo hynne)", tabela(
				linha("Citadino", "+2 também em Adestramento", `${CORR}: −2 em Adestramento compensa`),
				linha("Sortudo, Sorte Salvadora", "Sem automação", `${M("pjsRolarDeNovo")}: escolhe o teste no chat, gasta os PM e rola de novo`),
				linha("Temeroso", "Só o −5 em Luta", `${OK}; abalado por ${M("pjsAutomacoes")}`),
				linha("Arremessador, Pequeno e Rechonchudo, Dom Artístico, Golpista Divino, Eclético, Inspiração, Magias", "Efeitos certos", OK),
				linha("Aumentar Repertório", "Texto", SEM))),
			pagina("Elyas (alquimista meio-elfo)", tabela(
				linha("Engenhosidade", "Formato antigo: a caixa de +Int nunca aparecia", `${CORR}: caixa de 2 PM nos testes de perícia`),
				linha("Infusão Distante", "Formato antigo, sem mudanças", `${CORR}: caixa de 1 PM nos consumíveis`),
				linha("Visão nas Trevas", "Sem efeito", `${CORR}: visão no escuro`),
				linha("Efeito solto \"Engenhosidade\" no ator", "Chave vazia", `${CORR}: apagado`),
				linha("Temeroso", "Só o −5 em Luta", `${OK}; abalado por ${M("pjsAutomacoes")}`),
				linha("Entre Dois Mundos, Sangue Élfico, Inventário Organizado, Aumento de Atributo, Saque Rápido", "Efeitos certos", OK),
				linha("Ambição Herdada, Laboratório Pessoal, Alquimista Iniciado, Ginete, Recurvado, Aspirante a herói, Perícias", "Texto", SEM))),
			pagina("Balthazar (mago kliren)", tabela(
				linha("Vanguardista", "Caixa de +2 em qualquer perícia, além do +2 no Ofício", `${CORR}: fica só o +2 em Ofício (escriba)`),
				linha("Adepto", "Três caixas de −1 PM (até −3 numa magia)", `${CORR}: uma caixa`),
				linha("Ossos Frágeis", "Sem efeito", `${CORR}: +1 por dado de impacto`),
				linha("Engenhosidade (Kliren), Caminho do Arcanista: Mago, Distraído", "Efeitos certos", OK),
				linha("Híbrido, Teurgista Místico, Familiar Elemental, Escrever Pergaminho, Memória Súbita", "Texto", SEM)))
		]
	});

	ui.notifications.info("Poderes dos PJs: macros, armas naturais e diário criados. Rode PJs · Corrigir poderes.");
})();
