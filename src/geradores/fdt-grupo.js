/* =====================================================================
 * FIM DOS TEMPOS · O GRUPO · REGRAS DE GRUPO + PODERES DE GRUPO
 * Gerador para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria a pasta "FdT · O Grupo" (itens, macros e diário) com:
 *      - Os 3 benefícios de "Regras para Grupos" (Fim dos Tempos, Arco 1, p. 60): Nome, Líder e Base.
 *      - Os 20 Poderes de Grupo (Heróis de Arton, p. 92-95), automatizados quando dá.
 *      - Macros: "Grupo · Montar o Grupo", "Grupo · Dar Poderes de Grupo",
 *        "Grupo · Sincronizar Cena", "Grupo · PM da Base" e "Grupo · Ações de Grupo".
 *      - Diário "FdT · O Grupo" com a ficha do grupo, as regras e o que cada poder automatiza.
 *   3. Rodar de novo apaga (depois de confirmar) e recria só documentos com flags.world.fdt = "fdtgrupo".
 *      A ficha do grupo (nome, líder, base, membros, PM da base) é preservada.
 *      Itens já colocados nas fichas dos PJs continuam lá.
 *
 * Feito a partir do código do sistema (master v1.6.5, out/2026); não foi testado num Foundry rodando.
 * Veja o guia fdt-grupo.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "fdtgrupo";
	const FLAGS = (extra = {}) => ({ world: { fdt: TAG, ...extra } });
	const T20I = "systems/tormenta20/icons";
	const NOME_PASTA = "FdT · O Grupo";

	/* ------------------------------------------------------------------ */
	/* 0. Limpeza (preserva a ficha do grupo)                               */
	/* ------------------------------------------------------------------ */
	const isOurs = (d) => d.getFlag?.("world", "fdt") === TAG;
	const diarioAntigo = game.journal.find((j) => isOurs(j) && j.getFlag("world", "fdtRole") === "grupo");
	const estadoAntigo = diarioAntigo?.getFlag("world", "fdtGrupo") ?? null;
	const colecoes = [game.items, game.journal, game.macros];
	const antigos = colecoes.flatMap((c) => c.filter(isOurs));
	if (antigos.length) {
		const ok = await foundry.applications.api.DialogV2.confirm({
			window: { title: "O Grupo: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados antes (itens modelo, macros e diário).</p>
				<p>Eles serão <b>apagados e recriados</b>. A ficha do grupo (nome, líder, base, membros e PM da base)
				é mantida, e os poderes já colocados nas fichas dos PJs continuam lá.</p><p>Continuar?</p>`
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
	/* 1. Construtores                                                       */
	/* ------------------------------------------------------------------ */
	const IMG = `${T20I}/poderes/combate.webp`;
	const p = (...linhas) => linhas.map((l) => `<p>${l}</p>`).join("");

	/**
	 * Efeito de poder de grupo. modo:
	 *  - "passivo": a sincronização liga quando o grupo está ativo e desliga quando não está.
	 *  - "alternar": o jogador liga e desliga na ficha; a sincronização só força desligado se o grupo cair.
	 *  - "uso": Efeito de Uso (aparece na janela de rolagem); some da janela se o grupo cair.
	 *  - "card": botão "aplicar" no card do poder (vai para os tokens alvo).
	 * escala: se > 0, todo valor numérico vira escala × (aliados na cena com o mesmo poder).
	 */
	const ef = (name, changes, o = {}) => ({
		name,
		img: o.img ?? IMG,
		type: "base",
		transfer: o.transfer ?? true,
		disabled: o.disabled ?? false,
		duration: o.duration ?? {},
		description: o.description ?? "",
		statuses: [],
		flags: FLAGS({ fdtModo: o.modo ?? "", fdtEscala: o.escala ?? 0, fdtTipos: o.types ?? [] }),
		system: {
			changes: changes.map(([key, value, type]) => ({ key, value, type: type ?? "add", phase: "initial", priority: null })),
			onuse: o.onuse ?? false,
			abilityUse: { types: o.types ?? [], names: [], automatic: false, aumenta: o.aumenta ?? false, custo: o.custo ?? 0, description: "" }
		}
	});
	const passivo = (name, changes, o = {}) => ef(name, changes, { ...o, modo: "passivo", disabled: true });
	const alternar = (name, changes, o = {}) => ef(name, changes, { ...o, modo: "alternar", disabled: true });
	const uso = (name, changes, types, o = {}) => ef(name, changes, { ...o, modo: "uso", onuse: true, disabled: true, types });
	const card = (name, changes, o = {}) => ef(name, changes, { ...o, modo: "card", transfer: false });

	const FONTE_HDA = "Heróis de Arton, cap. 1, Poderes de Grupo (p. 92-95)";
	const FONTE_FDT = "Fim dos Tempos, Arco 1, Introdução, Regras para Grupos (p. 60)";
	const AVISO = "<p><i>Poder de grupo: só funciona se outro personagem jogador com este mesmo poder estiver na cena. NPCs, parceiros e efeitos que emprestam poderes não contam.</i></p>";

	const poderItem = (slug, name, desc, o = {}) => ({
		name,
		type: "poder",
		img: o.img ?? IMG,
		folder: pasta.Item,
		ownership: { default: 2 },
		flags: FLAGS(o.beneficio ? { fdtBeneficio: o.beneficio } : { fdtPoder: slug, fdtPre: o.pre ?? "" }),
		effects: o.effects ?? [],
		system: {
			description: { value: desc + (o.beneficio ? "" : AVISO) + (o.auto ? `<p><b>Automação:</b> ${o.auto}</p>` : "") },
			source: o.beneficio ? FONTE_FDT : FONTE_HDA,
			tipo: "geral",
			subtipo: o.beneficio ? "Grupo · Fim dos Tempos" : "Grupo",
			ativacao: { execucao: o.exec ?? "passive", custo: o.custo ?? 0, qtd: "", condicao: o.condicao ?? "", special: "" },
			alcance: o.alcance ?? "none",
			area: "",
			duracao: { value: o.durV ?? 0, units: o.durU ?? "inst", special: "" },
			resistencia: { pericia: "", atributo: "", bonus: 0, txt: "" },
			rolls: []
		}
	});

	/* ------------------------------------------------------------------ */
	/* 2. Benefícios de grupo do Fim dos Tempos (modelos)                    */
	/* ------------------------------------------------------------------ */
	const beneficios = [
		poderItem("nome", "Grupo · Nome",
			p("O grupo tem um nome que funciona em Arton, e todos se identificam como membros (brasão, grito de guerra e lema são opcionais).",
				"<b>Benefício:</b> a ação <b>ajudar</b> concede <b>+1 de bônus adicional</b> entre os membros do grupo.",
				"Lembrete da regra de ajudar: cada ajudante testa contra CD 10 e concede +1, mais +1 a cada 10 pontos acima da CD (+2 com 20, +3 com 30)."),
			{
				beneficio: "nome",
				auto: "na janela de rolagem de perícias e ataques aparece <b>Ajuda de membro do grupo</b>. Marque uma vez por ajudante que passou; cada marca soma +2 (+1 da ajuda e +1 do grupo). Se o ajudante tirou 20 ou mais, some o +1 extra à mão.",
				effects: [
					uso("Ajuda de membro do grupo (+2 por ajudante)", [["roll", 2]], ["skill"], { aumenta: true }),
					uso("Ajuda de membro do grupo no ataque (+2 por ajudante)", [["ataque", 2]], ["attack"], { aumenta: true })
				]
			}),
		poderItem("lider", "Grupo · Liderança",
			p("Os jogadores escolheram um líder. Ele não manda em ninguém: a mesa decide o que significa ter um líder.",
				"<b>Benefício:</b> o grupo recebe <b>+1 em Iniciativa por membro</b>, dividido como quiserem (+1 para cada, +3/+2...)."),
			{
				beneficio: "lider",
				auto: "o efeito <b>Liderança</b> soma na Iniciativa a parte deste personagem, definida na macro Grupo · Montar o Grupo.",
				effects: [ef("Liderança (Iniciativa)", [["system.pericias.inic.bonus", 1]], { modo: "beneficio" })]
			}),
		poderItem("base", "Grupo · Base",
			p("Todos chamam a base de lar e se encontram nela quase todos os dias.",
				"<b>Benefício:</b> além dos próprios PM, quando estão <b>fisicamente na base</b>, os personagens dispõem dos <b>PM da base</b>: a soma dos PM de todos dividida pelo número de personagens (a média). Qualquer um pode gastar desses PM, mas só enquanto estiver na base. Os PM da base se recuperam à taxa de <b>1 por dia</b>."),
			{ beneficio: "base", auto: "a macro <b>Grupo · PM da Base</b> guarda o total, recalcula o máximo, entrega PM ao personagem (como PM temporários, gastos primeiro pelo sistema) e recupera 1 por dia." })
	];

	/* ------------------------------------------------------------------ */
	/* 3. Os 20 Poderes de Grupo (Heróis de Arton)                           */
	/* ------------------------------------------------------------------ */
	const poderes = [
		poderItem("abrir-guarda", "Abrir a Guarda",
			p("Quando você agarra ou derruba um inimigo, aliados com este poder em alcance curto desse inimigo podem gastar 2 PM para fazer um ataque contra ele. Cada personagem só pode fazer um ataque dessa forma por rodada.", "Pré-requisito: treinado em Luta ou Pontaria."),
			{ pre: "Treinado em Luta ou Pontaria", exec: "reaction", custo: 2, alcance: "short", auto: "card com o custo de 2 PM. Depois, ataque normalmente com a arma." }),
		poderItem("ajuda-amador", "Ajuda do Amador",
			p("Você pode gastar uma ação padrão e fazer um teste para ajudar, mas para atrapalhar um inimigo em alcance curto, usando qualquer perícia que possa justificar e que seja aprovada pelo mestre. Se fizer isso, seus aliados com este poder aplicam o bônus da ajuda em seus testes de ataque contra esse inimigo por 1 rodada."),
			{
				exec: "action", alcance: "short", durV: 1, durU: "round",
				auto: "role a perícia escolhida (CD 10). Se passar, mire (T) os aliados com este poder e clique em aplicar no card: +1 em ataques por 1 rodada. Com 20 ou mais, edite para +2 (30 ou mais, +3).",
				effects: [card("Ajuda do Amador (+1 ataque contra o inimigo)", [["system.modificadores.ataque.geral", "1"]])]
			}),
		poderItem("apontar-fraqueza", "Apontar Fraqueza",
			p("Quando você faz um acerto crítico, cada aliado com este poder pode gastar 2 PM em seu primeiro ataque contra o mesmo alvo nessa rodada. Se acertar, o ataque é um crítico. Cada personagem só pode fazer um acerto crítico dessa forma por cena."),
			{
				auto: "na janela de ataque aparece <b>Apontar Fraqueza</b> (2 PM): marcado, a margem de ameaça vira 1, então qualquer acerto é crítico. Use uma vez por cena.",
				effects: [uso("Apontar Fraqueza (acerto vira crítico)", [["criticoM", "1", "override"]], ["attack"], { custo: 2 })]
			}),
		poderItem("barragem-golpes", "Barragem de Golpes",
			p("Quando você causa dano em um inimigo, seus aliados com este poder recebem um bônus de +1 em rolagens de dano contra o mesmo alvo pela cena (limitado, para cada personagem, pelo nível dele). O bônus acaba se nenhum personagem com este poder causar dano ao inimigo em uma rodada."),
			{
				auto: "na janela de ataque aparece <b>Barragem de Golpes</b>. Marque uma vez para cada dano que os aliados com o poder já causaram ao alvo nesta cena (+1 por marca, até o seu nível).",
				effects: [uso("Barragem de Golpes (+1 dano por golpe dos aliados)", [["dano", 1]], ["attack"], { aumenta: true })]
			}),
		poderItem("bode-expiatorio", "Bode Expiatório",
			p("Sempre que a categoria de atitude de um NPC piorar em relação a um personagem com este poder, você pode automaticamente assumir a culpa por qualquer evento ou interação que tenha causado isso. A categoria de atitude do NPC piora para você, permanecendo a mesma para seu aliado."),
			{ exec: "reaction", auto: "nenhuma (narrativo)." }),
		poderItem("bote-coletivo", "Bote Coletivo",
			p("Você recebe um bônus igual ao número de aliados com este poder em testes de Iniciativa e, na primeira rodada de cada combate, em testes de perícia e na CD de suas habilidades.", "Pré-requisito: treinado em Iniciativa."),
			{
				pre: "Treinado em Iniciativa",
				auto: "a sincronização põe na Iniciativa o número de aliados com o poder na cena. Na primeira rodada, marque <b>Bote Coletivo (1ª rodada)</b> na janela de perícia, de ataque ou de magia/poder (soma o mesmo bônus no teste ou na CD).",
				effects: [
					passivo("Bote Coletivo (Iniciativa)", [["system.pericias.inic.bonus", 0]], { escala: 1 }),
					uso("Bote Coletivo (1ª rodada, perícia)", [["roll", 0]], ["skill"], { escala: 1 }),
					uso("Bote Coletivo (1ª rodada, ataque)", [["ataque", 0]], ["attack"], { escala: 1 }),
					uso("Bote Coletivo (1ª rodada, CD)", [["cd", 0]], ["spell", "power"], { escala: 1 })
				]
			}),
		poderItem("conforto-familiar", "Conforto Familiar",
			p("Independente das condições de descanso, sempre que você dorme perto de aliados com este poder (na mesma estalagem, no mesmo acampamento, na mesma ala do castelo...), para cada um desses aliados com este poder, você começa o dia seguinte com 3 PV e 1 PM temporários por patamar."),
			{ auto: "macro <b>Grupo · Ações de Grupo</b> → Conforto Familiar: marque quem dormiu junto e ela dá os PV e PM temporários." }),
		poderItem("conselhos-salvadores", "Conselhos Salvadores",
			p("Você pode gastar 2 PM para fazer um teste de resistência usando o valor de perícia de um aliado em alcance curto que tenha este poder."),
			{ exec: "reaction", custo: 2, alcance: "short", auto: "macro <b>Grupo · Ações de Grupo</b> → Conselhos Salvadores: escolhe o aliado e a resistência, rola com o valor dele e gasta seus 2 PM." }),
		poderItem("corrente-corpos", "Corrente de Corpos",
			p("Uma vez por rodada, você pode entregar um item que esteja empunhando a qualquer aliado com este poder como uma ação livre. Para isso, vocês devem estar em alcance curto um do outro ou deve haver outros aliados com este poder entre os dois."),
			{ exec: "free", auto: "nenhuma (arraste o item de uma ficha para a outra)." }),
		poderItem("defesa-martir", "Defesa do Mártir",
			p("Uma vez por rodada, quando um aliado em alcance curto que também tenha este poder sofrer dano, você pode gastar 2 PM para sofrer esse dano no lugar dele."),
			{ exec: "reaction", custo: 2, alcance: "short", auto: "card com o custo de 2 PM. Aplique o dano no seu token em vez do aliado." }),
		poderItem("dinheiro-atrai", "Dinheiro Atrai Dinheiro",
			p("Cada personagem com este poder adiciona 5% ao resultado das tabelas em todas as rolagens de tesouro do grupo. Esse benefício só vale para tesouro rolado (não recompensas fixas) e só para tesouro encontrado por todo o grupo."),
			{ auto: "a sincronização (e a macro Ações → Dinheiro Atrai Dinheiro) diz o total: +5% por personagem com o poder na cena. Some à rolagem de tesouro." }),
		poderItem("escudo-vivo", "Escudo Vivo",
			p("Quando mais de um personagem com este poder for afetado por dano em área, você pode gastar 2 PM para sofrer o dano no lugar desses aliados que estejam em alcance curto. Cada um faz um teste de resistência normalmente. Você sofre todo o dano que seus aliados sofreriam de acordo com seus testes de resistência. Suas próprias imunidades e RD se aplicam normalmente."),
			{ exec: "reaction", custo: 2, alcance: "short", auto: "card com o custo de 2 PM. Aplique no seu token a soma do dano dos aliados." }),
		poderItem("espirito-uniao", "Espírito de União",
			p("Este poder só funciona se <b>todos</b> os membros do grupo o tiverem escolhido. No início da rodada, cada personagem com este poder pode gastar 2 PM. Se fizerem isso, até o fim da cena, esses personagens compartilham um total de PV igual à soma dos PV de cada um. Dano, recuperação e perda de vida são todos aplicados a esse total (após RD etc.). Se o total acabar, todos sofrem os efeitos de serem reduzidos a 0 PV ou menos (cada um ainda morre no seu limite individual). No fim da cena, divida os PV restantes igualmente.", "Pré-requisitos: Exército de Um Grupo Só, outro poder de grupo."),
			{
				pre: "Exército de Um Grupo Só e outro poder de grupo",
				exec: "free", custo: 2,
				auto: "macro <b>Grupo · Ações de Grupo</b> → Espírito de União: <i>iniciar</i> gasta 2 PM de cada um e mostra o total; durante a cena aplique o dano em qualquer um deles (o total é a soma); <i>encerrar</i> divide igualmente o que sobrou. Só fica ativo se todos os membros do grupo tiverem o poder e estiverem na cena."
			}),
		poderItem("exercito", "Exército de Um Grupo Só",
			p("Você pode gastar uma ação padrão e 2 PM para formar um bando com seus aliados com este poder, desde que cada um gaste uma ação padrão e 2 PM na mesma rodada. Enquanto estiverem formando um bando com você, os aliados não podem executar ações (exceto reações), mas cada um fornece +2 em seus testes de ataque. Quando você ataca, causa metade do dano mesmo que erre e, se acertar por 10 ou mais, seus aliados podem rolar o dano de um único ataque que poderiam fazer com uma ação padrão e somar ao dano do seu ataque (esse dano não é multiplicado em caso de acerto crítico). O bando se mantém até um personagem desfazer a formação (ação livre) ou ficar inconsciente, ou até o fim da cena.", "Pré-requisito: treinado em Guerra."),
			{
				pre: "Treinado em Guerra",
				exec: "action", custo: 2,
				auto: "na janela de ataque do líder do bando aparece <b>Exército (bando)</b>: marque uma vez por aliado no bando (+2 cada). Errou: aplique metade do dano à mão. Acertou por 10+: os aliados rolam o dano deles e somam.",
				effects: [uso("Exército de Um Grupo Só (bando, +2 por aliado)", [["ataque", 2]], ["attack"], { aumenta: true })]
			}),
		poderItem("magia-comunitaria", "Magia Comunitária",
			p("Uma vez por rodada, quando você lança uma magia com alvo você ou 1 criatura, para cada aliado em alcance curto com este poder você pode pagar o custo da magia novamente para que ele também se beneficie do efeito. Se o efeito tiver duração sustentada, cada personagem afetado precisa pagar seu custo individualmente."),
			{ auto: "nenhuma: mire (T) os aliados extras ao aplicar o efeito do card e gaste o custo de novo para cada um." }),
		poderItem("mao-amiga", "Mão Amiga",
			p("Sempre que você fizer uma ação que demora mais de uma semana, seus aliados com este poder podem ajudá-lo. Cada aliado que gastar uma semana ao mesmo tempo que você adiciona uma semana ao tempo de sua ação. Por exemplo, fabricar um item superior (um mês) com três aliados com este poder leva só uma semana."),
			{ exec: "special", auto: "nenhuma (tempo entre aventuras)." }),
		poderItem("parede-escudos", "Parede de Escudos",
			p("Se você estiver usando um escudo, pode gastar uma ação de movimento para formar uma parede de escudos com um ou mais aliados adjacentes com este poder que também estejam usando escudos. Enquanto permanecerem adjacentes, os participantes da parede recebem +5 na Defesa e RD 5."),
			{
				exec: "move",
				auto: "efeito <b>Parede de Escudos</b> na aba de efeitos da ficha: ligue enquanto a parede estiver formada (+5 Defesa e RD 5) e desligue quando sair dela.",
				effects: [alternar("Parede de Escudos (+5 Defesa, RD 5)", [["system.attributes.defesa.bonus", 5], ["system.tracos.resistencias.dano.bonus", 5]])]
			}),
		poderItem("presenca-luminosa", "Presença Luminosa",
			p("Todos os personagens com este poder podem gastar 2 PM. Se fizerem isso, até o fim da cena, cada personagem pode usar o maior valor de cada perícia baseada em Carisma de cada personagem com este poder em suas rolagens."),
			{ exec: "free", custo: 2, durU: "scene", auto: "macro <b>Grupo · Ações de Grupo</b> → Presença Luminosa: gasta 2 PM de cada participante e dá a cada um, até o fim da cena, o bônus que iguala suas perícias de Carisma às maiores do grupo." }),
		poderItem("saude-coletiva", "Saúde Coletiva",
			p("Sempre que você curar outro membro do grupo que também possui este poder, os PV recuperados aumentam em +2 por dado de cura."),
			{
				auto: "na janela de magia, poder ou consumível de cura aparece <b>Saúde Coletiva</b>: marque quando o alvo tiver o poder (+2 por dado).",
				effects: [uso("Saúde Coletiva (+2 por dado de cura)", [["dano", "d*2", "custom"]], ["spell", "power", "consumable"])]
			}),
		poderItem("uma-mao-lava", "Uma Mão Lava a Outra",
			p("Quando faz um teste de perícia, você pode gastar 1 PM para rolar novamente esse teste. Você pode usar este poder um número de vezes por cena igual ao total de membros do grupo com este poder. Este poder não funciona em cenas de combate.", "Pré-requisito: Mão Amiga."),
			{ pre: "Mão Amiga", exec: "free", custo: 1, auto: "card com o custo de 1 PM; role o teste de novo. A sincronização diz quantos usos por cena o grupo tem." })
	];

	const itens = await Item.createDocuments([...beneficios, ...poderes]);

	/* ------------------------------------------------------------------ */
	/* 4. Código comum das macros (precisa ser autossuficiente)              */
	/* ------------------------------------------------------------------ */
	function comum() {
		const TAG = "fdtgrupo";
		const NOMES = {
			"abrir-guarda": "Abrir a Guarda", "ajuda-amador": "Ajuda do Amador", "apontar-fraqueza": "Apontar Fraqueza",
			"barragem-golpes": "Barragem de Golpes", "bode-expiatorio": "Bode Expiatório", "bote-coletivo": "Bote Coletivo",
			"conforto-familiar": "Conforto Familiar", "conselhos-salvadores": "Conselhos Salvadores", "corrente-corpos": "Corrente de Corpos",
			"defesa-martir": "Defesa do Mártir", "dinheiro-atrai": "Dinheiro Atrai Dinheiro", "escudo-vivo": "Escudo Vivo",
			"espirito-uniao": "Espírito de União", "exercito": "Exército de Um Grupo Só", "magia-comunitaria": "Magia Comunitária",
			"mao-amiga": "Mão Amiga", "parede-escudos": "Parede de Escudos", "presenca-luminosa": "Presença Luminosa",
			"saude-coletiva": "Saúde Coletiva", "uma-mao-lava": "Uma Mão Lava a Outra"
		};
		const gm = () => game.users.filter((u) => u.isGM).map((u) => u.id);
		const diario = () => game.journal.find((j) => j.getFlag("world", "fdt") === TAG && j.getFlag("world", "fdtRole") === "grupo");
		const estado = () => diario()?.getFlag("world", "fdtGrupo") ?? null;
		const pjs = () => game.actors.filter((a) => a.type === "character" && a.hasPlayerOwner);
		const pjsNaCena = () => {
			const ids = new Set((canvas.scene?.tokens ?? []).map((t) => t.actor?.id).filter(Boolean));
			return pjs().filter((a) => ids.has(a.id));
		};
		const slugs = (a) => new Set(a.items.map((i) => i.getFlag("world", "fdtPoder")).filter(Boolean));
		const tem = (a, slug) => slugs(a).has(slug);
		const membrosDoGrupo = () => {
			const e = estado();
			const ids = e?.membros?.length ? e.membros : pjs().map((a) => a.id);
			return ids.map((id) => game.actors.get(id)).filter(Boolean);
		};
		const formulario = async (title, content, label = "OK") => {
			const r = await foundry.applications.api.DialogV2.wait({
				window: { title },
				position: { width: 460 },
				content,
				buttons: [{ action: "ok", label, default: true, callback: (e, b) => new foundry.applications.ux.FormDataExtended(b.form).object }],
				rejectClose: false
			});
			return r && r !== "ok" ? r : null;
		};
		const checks = (lista, prefixo, marcado = () => true) => lista
			.map((a) => `<div class="form-group"><label>${a.name}</label><input type="checkbox" name="${prefixo}${a.id}" ${marcado(a) ? "checked" : ""}></div>`).join("");

		/** Liga/desliga e ajusta os efeitos dos poderes de grupo de todos os PJs conforme quem está na cena. */
		async function sincronizar({ silencioso = false } = {}) {
			const todos = pjs();
			const naCena = new Set(pjsNaCena().map((a) => a.id));
			const membros = membrosDoGrupo().map((a) => a.id);
			const quem = {};
			for (const a of todos) for (const s of slugs(a)) (quem[s] ??= new Set()).add(a.id);
			const naCenaCom = (s) => [...(quem[s] ?? [])].filter((id) => naCena.has(id));
			const ativoPara = (a, s) => {
				if (!naCena.has(a.id)) return false;
				if (s === "espirito-uniao") return membros.length >= 2 && membros.every((id) => quem[s]?.has(id) && naCena.has(id));
				return naCenaCom(s).length >= 2;
			};
			let mudancas = 0;
			for (const a of todos) {
				for (const it of a.items) {
					const s = it.getFlag("world", "fdtPoder");
					if (!s) continue;
					const ativo = ativoPara(a, s);
					const aliados = Math.max(naCenaCom(s).length - 1, 0);
					const updates = [];
					for (const e of it.effects) {
						const modo = e.getFlag("world", "fdtModo");
						if (!modo) continue;
						const upd = { _id: e.id };
						let mudou = false;
						if (modo === "passivo" && e.disabled === ativo) { upd.disabled = !ativo; mudou = true; }
						if (modo === "alternar" && !ativo && !e.disabled) { upd.disabled = true; mudou = true; }
						if (modo === "uso") {
							const tipos = ativo ? (e.getFlag("world", "fdtTipos") ?? []) : [];
							const atuais = [...(e.system.abilityUse?.types ?? [])];
							if ([...atuais].sort().join() !== [...tipos].sort().join()) { upd["system.abilityUse.types"] = tipos; mudou = true; }
						}
						const escala = Number(e.getFlag("world", "fdtEscala")) || 0;
						if (escala) {
							const atuais = e.system.changes ?? [];
							const novas = atuais.map((c) => ({ ...c, value: String(escala * aliados) }));
							if (novas.some((c, i) => String(atuais[i].value) !== c.value)) { upd["system.changes"] = novas; mudou = true; }
						}
						if (mudou) updates.push(upd);
					}
					if (updates.length) { await it.updateEmbeddedDocuments("ActiveEffect", updates); mudancas += updates.length; }
				}
			}
			if (silencioso && !mudancas) return;
			const linhas = Object.keys(NOMES).filter((s) => quem[s]?.size).map((s) => {
				const nomes = naCenaCom(s).map((id) => game.actors.get(id).name);
				const fora = [...quem[s]].filter((id) => !naCena.has(id)).map((id) => game.actors.get(id).name);
				const ok = s === "espirito-uniao" ? membros.length >= 2 && membros.every((id) => quem[s].has(id) && naCena.has(id)) : nomes.length >= 2;
				let extra = "";
				if (ok && s === "bote-coletivo") extra = ` · +${nomes.length - 1} Iniciativa (e no 1º turno)`;
				if (ok && s === "dinheiro-atrai") extra = ` · +${nomes.length * 5}% no tesouro rolado`;
				if (ok && s === "uma-mao-lava") extra = ` · ${quem[s].size} rerrolagens por cena (fora de combate)`;
				if (s === "espirito-uniao" && !ok) extra = " · precisa de todos os membros do grupo com o poder, na cena";
				return `<li>${ok ? "🟢" : "⚪"} <b>${NOMES[s]}</b>: ${nomes.join(", ") || "ninguém na cena"}${fora.length ? ` <i>(fora da cena: ${fora.join(", ")})</i>` : ""}${extra}</li>`;
			});
			ChatMessage.create({
				speaker: { alias: "Poderes de Grupo" },
				whisper: gm(),
				content: `<h3>Poderes de grupo na cena</h3>${linhas.length ? `<ul>${linhas.join("")}</ul>` : "<p>Nenhum PJ tem poderes de grupo.</p>"}<p><small>${mudancas} efeito(s) ajustado(s). 🟢 ativo · ⚪ inativo.</small></p>`
			});
		}

		return { TAG, NOMES, gm, diario, estado, pjs, pjsNaCena, slugs, tem, membrosDoGrupo, formulario, checks, sincronizar };
	}

	/* ------------------------------------------------------------------ */
	/* 5. Macros                                                             */
	/* ------------------------------------------------------------------ */

	/** Montar o Grupo: nome, líder, base, membros e divisão da Iniciativa. */
	async function macroMontar(FDT) {
		if (!game.user.isGM) return ui.notifications.warn("Só o Mestre monta o grupo.");
		const todos = FDT.pjs();
		if (!todos.length) return ui.notifications.warn("Nenhum personagem jogador no mundo.");
		const e = FDT.estado() ?? {};
		const eMembro = (a) => (e.membros?.length ? e.membros.includes(a.id) : true);
		const opLider = todos.map((a) => `<option value="${a.id}" ${a.id === e.lider ? "selected" : ""}>${a.name}</option>`).join("");
		const linhas = todos.map((a) => `<div class="form-group"><label>${a.name}</label>
			<input type="checkbox" name="m_${a.id}" ${eMembro(a) ? "checked" : ""}>
			<span style="flex:0 0 auto">Iniciativa +</span><input type="number" name="i_${a.id}" value="${e.iniciativa?.[a.id] ?? 1}" style="flex:0 0 3em"></div>`).join("");
		const d = await FDT.formulario("Montar o Grupo", `
			<p>Fim dos Tempos, Regras para Grupos: o grupo precisa de <b>nome</b>, <b>líder</b> e <b>base</b>.</p>
			<div class="form-group"><label>Nome do grupo</label><input type="text" name="nome" value="${e.nome ?? ""}"></div>
			<div class="form-group"><label>Líder</label><select name="lider"><option value="">(ainda sem líder)</option>${opLider}</select></div>
			<div class="form-group"><label>Base</label><input type="text" name="base" value="${e.base?.nome ?? ""}" placeholder="ex.: Forte Cabeça-de-Martelo"></div>
			<hr><p><b>Membros</b> e a parte de cada um no bônus de Iniciativa do líder (total = nº de membros):</p>${linhas}`, "Salvar");
		if (!d) return;
		const membros = todos.filter((a) => d[`m_${a.id}`]);
		if (!membros.length) return ui.notifications.warn("Marque ao menos um membro.");
		const iniciativa = Object.fromEntries(membros.map((a) => [a.id, Math.max(Number(d[`i_${a.id}`]) || 0, 0)]));
		const somaIni = Object.values(iniciativa).reduce((s, v) => s + v, 0);
		if (d.lider && somaIni !== membros.length) ui.notifications.warn(`A Iniciativa distribuída soma +${somaIni}, mas o grupo tem ${membros.length} membros. Salvei assim mesmo; ajuste se quiser.`);
		const max = Math.floor(membros.reduce((s, a) => s + (a.system.attributes.pm.max || 0), 0) / membros.length);
		const pmAtual = e.base?.pm ?? max;
		const estado = { nome: d.nome?.trim() ?? "", lider: d.lider || "", membros: membros.map((a) => a.id), iniciativa, base: { nome: d.base?.trim() ?? "", max, pm: Math.min(pmAtual, max) } };
		const j = FDT.diario();
		if (!j) return ui.notifications.error("Diário \"FdT · O Grupo\" não encontrado. Importe a Campanha do módulo Fim dos Tempos.");
		await j.setFlag("world", "fdtGrupo", estado);

		// Benefícios nas fichas
		const modelos = game.items.filter((i) => i.getFlag("world", "fdt") === FDT.TAG && i.getFlag("world", "fdtBeneficio"));
		const lider = game.actors.get(estado.lider);
		const nomeBen = { nome: estado.nome ? `Grupo · ${estado.nome}` : null, lider: lider ? `Grupo · Liderança de ${lider.name}` : null, base: estado.base.nome ? `Grupo · Base: ${estado.base.nome}` : null };
		for (const a of FDT.pjs()) {
			const velhos = a.items.filter((i) => i.getFlag("world", "fdtBeneficio")).map((i) => i.id);
			if (velhos.length) await a.deleteEmbeddedDocuments("Item", velhos);
			if (!estado.membros.includes(a.id)) continue;
			const novos = [];
			for (const m of modelos) {
				const tipo = m.getFlag("world", "fdtBeneficio");
				if (!nomeBen[tipo]) continue;
				const obj = m.toObject();
				delete obj._id;
				delete obj.folder;
				obj.name = nomeBen[tipo];
				if (tipo === "lider") {
					const v = iniciativa[a.id] ?? 0;
					obj.name += ` (+${v} Iniciativa)`;
					for (const ef of obj.effects) {
						ef.system.changes = ef.system.changes.map((c) => ({ ...c, value: v }));
						ef.disabled = v === 0;
					}
				}
				novos.push(obj);
			}
			if (novos.length) await a.createEmbeddedDocuments("Item", novos);
		}

		// Ficha do grupo no diário
		const nomes = membros.map((a) => `${a.name}${a.id === estado.lider ? " ⭐" : ""} (Iniciativa +${iniciativa[a.id]})`).join("<br>");
		const html = `<h2>${estado.nome || "<i>(grupo sem nome)</i>"}</h2>
			<p><b>Líder:</b> ${lider?.name ?? "<i>(ainda sem líder)</i>"}</p>
			<p><b>Base:</b> ${estado.base.nome || "<i>(ainda sem base)</i>"} · PM da base: ${estado.base.pm}/${estado.base.max}</p>
			<p><b>Membros:</b><br>${nomes}</p>
			<p><i>Atualizado pela macro Grupo · Montar o Grupo. Não edite à mão: rode a macro de novo.</i></p>`;
		const pag = j.pages.getName("Ficha do Grupo");
		if (pag) await pag.update({ "text.content": html });
		ChatMessage.create({ speaker: { alias: "O Grupo" }, content: `<h3>${estado.nome || "O grupo"}</h3>${html}` });
	}

	/** Dar ou remover Poderes de Grupo nas fichas. */
	async function macroDar(FDT) {
		if (!game.user.isGM) return ui.notifications.warn("Só o Mestre distribui poderes.");
		const todos = FDT.pjs();
		const modelos = game.items.filter((i) => i.getFlag("world", "fdt") === FDT.TAG && i.getFlag("world", "fdtPoder"));
		if (!modelos.length) return ui.notifications.error("Itens modelo não encontrados. Importe a Campanha do módulo Fim dos Tempos.");
		const membros = new Set(FDT.membrosDoGrupo().map((a) => a.id));
		const opPoderes = modelos.map((m) => {
			const pre = m.getFlag("world", "fdtPre");
			return `<div class="form-group"><label>${m.name}${pre ? ` <small>(${pre})</small>` : ""}</label><input type="checkbox" name="p_${m.id}"></div>`;
		}).join("");
		const d = await FDT.formulario("Dar Poderes de Grupo", `
			<div class="form-group"><label>Ação</label><select name="acao"><option value="dar">Dar</option><option value="remover">Remover</option></select></div>
			<p><b>Personagens</b></p>${FDT.checks(todos, "a_", (a) => membros.has(a.id))}
			<hr><p><b>Poderes</b></p>${opPoderes}
			<hr><div class="form-group"><label>Ignorar pré-requisitos</label><input type="checkbox" name="ignorar"></div>
			<div class="form-group"><label>Trocar cópias antigas pela versão atual</label><input type="checkbox" name="trocar"></div>`, "Aplicar");
		if (!d) return;
		const alvos = todos.filter((a) => d[`a_${a.id}`]);
		// dependentes por último, para os pré-requisitos dados no mesmo lote contarem
		const ordem = ["espirito-uniao", "uma-mao-lava"];
		const escolhidos = modelos.filter((m) => d[`p_${m.id}`])
			.sort((x, y) => ordem.indexOf(x.getFlag("world", "fdtPoder")) - ordem.indexOf(y.getFlag("world", "fdtPoder")));
		if (!alvos.length || !escolhidos.length) return ui.notifications.warn("Marque ao menos um personagem e um poder.");

		const pre = (a, s) => {
			const per = a.system.pericias ?? {};
			const ss = FDT.slugs(a);
			if (s === "abrir-guarda") return per.luta?.treinado || per.pont?.treinado ? "" : "não é treinado em Luta nem Pontaria";
			if (s === "bote-coletivo") return per.inic?.treinado ? "" : "não é treinado em Iniciativa";
			if (s === "exercito") return per.guer?.treinado ? "" : "não é treinado em Guerra";
			if (s === "uma-mao-lava") return ss.has("mao-amiga") ? "" : "não tem Mão Amiga";
			if (s === "espirito-uniao") return ss.has("exercito") && [...ss].filter((x) => x !== "espirito-uniao").length >= 2 ? "" : "precisa de Exército de Um Grupo Só e outro poder de grupo";
			return "";
		};
		const log = [];
		for (const a of alvos) {
			for (const m of escolhidos) {
				const s = m.getFlag("world", "fdtPoder");
				const existentes = a.items.filter((i) => i.getFlag("world", "fdtPoder") === s).map((i) => i.id);
				if (d.acao === "remover") {
					if (existentes.length) { await a.deleteEmbeddedDocuments("Item", existentes); log.push(`➖ ${a.name}: ${m.name}`); }
					continue;
				}
				if (existentes.length && !d.trocar) { log.push(`· ${a.name} já tem ${m.name}`); continue; }
				const falta = pre(a, s);
				if (falta && !d.ignorar) { log.push(`⚠️ ${a.name} não recebeu ${m.name}: ${falta}`); continue; }
				if (existentes.length) await a.deleteEmbeddedDocuments("Item", existentes);
				const obj = m.toObject();
				delete obj._id;
				delete obj.folder;
				await a.createEmbeddedDocuments("Item", [obj]);
				log.push(`➕ ${a.name}: ${m.name}${falta ? " (pré-requisito ignorado)" : ""}`);
			}
		}
		await ChatMessage.create({ speaker: { alias: "Poderes de Grupo" }, whisper: FDT.gm(), content: `<h3>Poderes de grupo</h3><p>${log.join("<br>")}</p>` });
		await FDT.sincronizar();
	}

	/** Sincronizar: liga o que está ativo na cena atual. Opcionalmente fica automático até recarregar. */
	async function macroSincronizar(FDT, scope) {
		if (!game.user.isGM) return ui.notifications.warn("Só o Mestre sincroniza (ele mexe nas fichas de todos).");
		if (scope?.auto) return FDT.sincronizar({ silencioso: true });
		const ligado = !!globalThis.fdtGrupoAuto;
		const d = await FDT.formulario("Sincronizar Poderes de Grupo", `
			<p>Confere quem está na cena atual e liga/desliga os efeitos dos poderes de grupo nas fichas.</p>
			<div class="form-group"><label>Automático nesta sessão (troca de cena e tokens entrando/saindo)</label>
			<input type="checkbox" name="auto" ${ligado ? "checked" : ""}></div>`, "Sincronizar");
		if (!d) return;
		if (d.auto && !ligado) {
			const rodar = foundry.utils.debounce(() => FDT.sincronizar({ silencioso: true }), 750);
			globalThis.fdtGrupoAuto = [["canvasReady", Hooks.on("canvasReady", rodar)], ["createToken", Hooks.on("createToken", rodar)], ["deleteToken", Hooks.on("deleteToken", rodar)]];
			ui.notifications.info("Poderes de grupo: sincronização automática ligada até recarregar o mundo.");
		} else if (!d.auto && ligado) {
			for (const [hook, id] of globalThis.fdtGrupoAuto) Hooks.off(hook, id);
			delete globalThis.fdtGrupoAuto;
			ui.notifications.info("Poderes de grupo: sincronização automática desligada.");
		}
		await FDT.sincronizar();
	}

	/** PM da Base. */
	async function macroBase(FDT) {
		if (!game.user.isGM) return ui.notifications.warn("Só o Mestre mexe nos PM da base.");
		const j = FDT.diario();
		const e = FDT.estado();
		if (!j || !e?.membros?.length) return ui.notifications.warn("Monte o grupo primeiro (macro Grupo · Montar o Grupo).");
		const membros = FDT.membrosDoGrupo();
		const base = { ...e.base };
		const op = membros.map((a) => `<option value="${a.id}">${a.name}</option>`).join("");
		const d = await FDT.formulario(`PM da Base${base.nome ? `: ${base.nome}` : ""}`, `
			<p>PM da base agora: <b>${base.pm}/${base.max}</b> (máximo = média dos PM máximos dos ${membros.length} membros).</p>
			<div class="form-group"><label>Ação</label><select name="acao">
				<option value="sacar">Entregar PM a um personagem (vira PM temporário)</option>
				<option value="dia">Passar dias (+1 PM por dia)</option>
				<option value="recalcular">Recalcular o máximo (subiu de nível)</option>
				<option value="definir">Definir o valor atual</option></select></div>
			<div class="form-group"><label>Personagem</label><select name="pj">${op}</select></div>
			<div class="form-group"><label>Quantidade (PM ou dias)</label><input type="number" name="qtd" value="1"></div>`);
		if (!d) return;
		const qtd = Math.max(Number(d.qtd) || 0, 0);
		let msg = "";
		if (d.acao === "recalcular") {
			base.max = Math.floor(membros.reduce((s, a) => s + (a.system.attributes.pm.max || 0), 0) / membros.length);
			base.pm = Math.min(base.pm, base.max);
			msg = `Máximo recalculado: ${base.max}.`;
		} else if (d.acao === "dia") {
			base.pm = Math.min(base.pm + qtd, base.max);
			msg = `${qtd} dia(s) na base: +${qtd} PM.`;
		} else if (d.acao === "definir") {
			base.pm = Math.min(qtd, base.max);
			msg = `PM da base definidos em ${base.pm}.`;
		} else {
			const a = game.actors.get(d.pj);
			const dar = Math.min(qtd, base.pm);
			if (!a || !dar) return ui.notifications.warn("Não há PM suficientes na base.");
			base.pm -= dar;
			await a.update({ "system.attributes.pm.temp": (a.system.attributes.pm.temp || 0) + dar });
			msg = `${a.name} usou <b>${dar} PM da base</b> (entraram como PM temporários e são gastos primeiro). Só vale enquanto estiver na base: se sair, tire o que sobrou.`;
		}
		await j.setFlag("world", "fdtGrupo", { ...e, base });
		const pag = j.pages.getName("Ficha do Grupo");
		if (pag) await pag.update({ "text.content": (pag.text.content ?? "").replace(/PM da base: \d+\/\d+/, `PM da base: ${base.pm}/${base.max}`) });
		ChatMessage.create({ speaker: { alias: "PM da Base" }, content: `<p>${msg}</p><p>PM da base: <b>${base.pm}/${base.max}</b></p>` });
	}

	/** Ações de Grupo: Conselhos Salvadores, Presença Luminosa, Conforto Familiar, Espírito de União, Dinheiro. */
	async function macroAcoes(FDT) {
		const d0 = await FDT.formulario("Ações de Grupo", `
			<div class="form-group"><label>Ação</label><select name="acao">
				<option value="conselhos">Conselhos Salvadores (resistência com o valor de um aliado)</option>
				<option value="presenca">Presença Luminosa (perícias de Carisma)</option>
				<option value="conforto">Conforto Familiar (dormiram juntos)</option>
				<option value="uniao-ini">Espírito de União: iniciar</option>
				<option value="uniao-fim">Espírito de União: encerrar (dividir PV)</option>
				<option value="dinheiro">Dinheiro Atrai Dinheiro (bônus no tesouro)</option></select></div>`, "Escolher");
		if (!d0) return;
		const naCena = FDT.pjsNaCena();
		const cenaOuTodos = naCena.length ? naCena : FDT.pjs();
		const com = (s) => cenaOuTodos.filter((a) => FDT.tem(a, s));
		const fala = (content, whisper = false) => ChatMessage.create({ speaker: { alias: "Poderes de Grupo" }, content, ...(whisper ? { whisper: FDT.gm() } : {}) });

		if (d0.acao === "conselhos") {
			const lista = com("conselhos-salvadores");
			if (lista.length < 2) return ui.notifications.warn("Precisa de dois PJs com Conselhos Salvadores na cena.");
			const eu = canvas.tokens.controlled[0]?.actor ?? game.user.character;
			const op = lista.map((a) => `<option value="${a.id}" ${a.id === eu?.id ? "selected" : ""}>${a.name}</option>`).join("");
			const d = await FDT.formulario("Conselhos Salvadores", `
				<div class="form-group"><label>Quem faz o teste</label><select name="quem">${op}</select></div>
				<div class="form-group"><label>Aliado que aconselha</label><select name="aliado">${op}</select></div>
				<div class="form-group"><label>Resistência</label><select name="per"><option value="fort">Fortitude</option><option value="refl">Reflexos</option><option value="vont">Vontade</option></select></div>
				<div class="form-group"><label>CD (opcional)</label><input type="number" name="cd"></div>`, "Rolar");
			if (!d) return;
			const quem = game.actors.get(d.quem), aliado = game.actors.get(d.aliado);
			if (!quem || !aliado || quem.id === aliado.id) return ui.notifications.warn("Escolha um aliado diferente de quem faz o teste.");
			const valor = aliado.system.pericias[d.per].value;
			const nome = CONFIG.T20.pericias[d.per].label;
			await quem.spendMana(2);
			const roll = await new Roll(`1d20 + ${valor}`).evaluate();
			const cd = Number(d.cd) || null;
			await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: quem }), flavor: `Conselhos Salvadores: ${nome} de ${quem.name} com o valor de ${aliado.name} (+${valor})${cd ? ` · CD ${cd} ${roll.total >= cd ? "✔️" : "❌"}` : ""}` });
			return;
		}

		if (d0.acao === "presenca") {
			const lista = com("presenca-luminosa");
			if (lista.length < 2) return ui.notifications.warn("Precisa de dois PJs com Presença Luminosa na cena.");
			const d = await FDT.formulario("Presença Luminosa", `<p>Quem gasta 2 PM agora (até o fim da cena)?</p>${FDT.checks(lista, "a_")}`, "Ativar");
			if (!d) return;
			const part = lista.filter((a) => d[`a_${a.id}`]);
			if (part.length < 2) return ui.notifications.warn("Precisa de pelo menos dois participantes.");
			const pericias = Object.keys(CONFIG.T20.pericias).filter((k) => part.some((a) => a.system.pericias[k]?.atributo === "car"));
			const maior = Object.fromEntries(pericias.map((k) => [k, Math.max(...part.map((a) => a.system.pericias[k]?.value ?? -99))]));
			const linhas = [];
			for (const a of part) {
				await a.spendMana(2);
				const velhos = a.effects.filter((e) => e.getFlag("world", "fdt") === FDT.TAG && e.name.startsWith("Presença Luminosa")).map((e) => e.id);
				if (velhos.length) await a.deleteEmbeddedDocuments("ActiveEffect", velhos);
				const changes = pericias.map((k) => ({ key: `system.pericias.${k}.bonus`, value: Math.max(maior[k] - (a.system.pericias[k]?.value ?? 0), 0), type: "add", phase: "initial", priority: null })).filter((c) => c.value > 0);
				if (changes.length) {
					await a.createEmbeddedDocuments("ActiveEffect", [{
						name: "Presença Luminosa", img: "icons/magic/light/explosion-star-glow-silhouette.webp", type: "base",
						duration: { expiry: "sceneEnd", units: "rounds", value: null },
						flags: { world: { fdt: FDT.TAG } },
						system: { changes }
					}]);
				}
				linhas.push(`${a.name}: ${changes.map((c) => `${CONFIG.T20.pericias[c.key.split(".")[2]].label} +${c.value}`).join(", ") || "já tem os maiores valores"}`);
			}
			return fala(`<h3>Presença Luminosa</h3><p>Até o fim da cena, cada um usa os maiores valores de Carisma do grupo:</p><p>${linhas.join("<br>")}</p>`);
		}

		if (d0.acao === "conforto") {
			const lista = FDT.pjs().filter((a) => FDT.tem(a, "conforto-familiar"));
			if (lista.length < 2) return ui.notifications.warn("Precisa de dois PJs com Conforto Familiar.");
			const d = await FDT.formulario("Conforto Familiar", `<p>Quem dormiu perto um do outro?</p>${FDT.checks(lista, "a_")}`, "Amanheceu");
			if (!d) return;
			const part = lista.filter((a) => d[`a_${a.id}`]);
			if (part.length < 2) return ui.notifications.warn("Precisa de pelo menos dois.");
			const linhas = [];
			for (const a of part) {
				const patamar = a.getRollData().patamar || 1;
				const n = part.length - 1;
				const pv = 3 * patamar * n, pm = patamar * n;
				const s = a.system.attributes;
				await a.update({ "system.attributes.pv.temp": Math.max(s.pv.temp || 0, pv), "system.attributes.pm.temp": Math.max(s.pm.temp || 0, pm) });
				linhas.push(`${a.name}: ${pv} PV e ${pm} PM temporários`);
			}
			return fala(`<h3>Conforto Familiar</h3><p>${linhas.join("<br>")}</p><p><small>PV/PM temporários não se acumulam: fica o maior valor.</small></p>`);
		}

		if (d0.acao === "uniao-ini" || d0.acao === "uniao-fim") {
			const lista = com("espirito-uniao");
			if (lista.length < 2) return ui.notifications.warn("Precisa de PJs com Espírito de União na cena.");
			const membros = FDT.membrosDoGrupo();
			const faltam = membros.filter((a) => !FDT.tem(a, "espirito-uniao")).map((a) => a.name);
			if (faltam.length) ui.notifications.warn(`Espírito de União só funciona se todos os membros tiverem o poder. Falta: ${faltam.join(", ")}.`);
			const d = await FDT.formulario("Espírito de União", `<p>Participantes:</p>${FDT.checks(lista, "a_")}`, d0.acao === "uniao-ini" ? "Gastar 2 PM e unir" : "Dividir PV");
			if (!d) return;
			const part = lista.filter((a) => d[`a_${a.id}`]);
			if (part.length < 2) return;
			const total = part.reduce((s, a) => s + (a.system.attributes.pv.value || 0), 0);
			if (d0.acao === "uniao-ini") {
				for (const a of part) await a.spendMana(2);
				return fala(`<h3>Espírito de União</h3><p>${part.map((a) => a.name).join(", ")} compartilham <b>${total} PV</b> até o fim da cena.</p><p><small>Aplique dano e cura em qualquer um deles normalmente: o total é a soma dos PV atuais. Se a soma chegar a 0, todos sofrem os efeitos de 0 PV. No fim da cena, use "encerrar".</small></p>`);
			}
			const cada = Math.floor(total / part.length);
			const linhas = [];
			for (const a of part) {
				const v = Math.min(cada, a.system.attributes.pv.max);
				await a.update({ "system.attributes.pv.value": v });
				linhas.push(`${a.name}: ${v} PV`);
			}
			return fala(`<h3>Espírito de União: fim da cena</h3><p>Total restante: ${total} PV, divididos igualmente.</p><p>${linhas.join("<br>")}</p>`);
		}

		if (d0.acao === "dinheiro") {
			const lista = com("dinheiro-atrai");
			const n = lista.length >= 2 ? lista.length : 0;
			return fala(`<h3>Dinheiro Atrai Dinheiro</h3><p>${n ? `${lista.map((a) => a.name).join(", ")}: <b>+${n * 5}%</b> no resultado das tabelas de tesouro rolado pelo grupo todo.` : "Inativo: precisa de pelo menos dois PJs com o poder."}</p>`, true);
		}
	}

	const COMUM = `const FDT = (${comum.toString()})();`;
	const macro = (name, img, fn) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · O Grupo · gerado por fdt-grupo.js\n${COMUM}\nawait (${fn.toString()})(FDT, typeof scope !== "undefined" ? scope : {});`
	});
	const macros = await Macro.createDocuments([
		macro("Grupo · Montar o Grupo", "icons/environment/settlement/tent.webp", macroMontar),
		macro("Grupo · Dar Poderes de Grupo", "icons/skills/social/diplomacy-handshake.webp", macroDar),
		macro("Grupo · Sincronizar Cena", "icons/svg/regen.svg", macroSincronizar),
		macro("Grupo · PM da Base", "icons/magic/symbols/runes-star-pentagon-blue.webp", macroBase),
		macro("Grupo · Ações de Grupo", "icons/skills/social/thumbsup-approval-like.webp", macroAcoes)
	]);
	const L = (d) => `@UUID[${d.uuid}]{${d.name}}`;
	const M = (trecho) => L(macros.find((m) => m.name.includes(trecho)));
	const I = (nome) => { const i = itens.find((x) => x.name === nome); return i ? L(i) : nome; };

	/* ------------------------------------------------------------------ */
	/* 6. Diário                                                             */
	/* ------------------------------------------------------------------ */
	const pagina = (name, html) => ({ name, type: "text", text: { content: html, format: 1 } });
	const e = estadoAntigo;
	const fichaInicial = e
		? `<h2>${e.nome || "<i>(grupo sem nome)</i>"}</h2><p><b>Base:</b> ${e.base?.nome || "-"} · PM da base: ${e.base?.pm ?? 0}/${e.base?.max ?? 0}</p><p>Rode ${M("Montar")} para atualizar esta página.</p>`
		: `<p>O grupo ainda não foi montado. Rode ${M("Montar")}.</p>`;
	const tabela = poderes.map((pi) => `<tr><td>${I(pi.name)}</td><td>${pi.flags.world.fdtPre || "-"}</td><td>${pi.system.description.value.split("<b>Automação:</b> ")[1]?.replace("</p>", "") ?? "-"}</td></tr>`).join("");
	const j = await JournalEntry.create({
		name: "FdT · O Grupo",
		folder: pasta.JournalEntry,
		flags: FLAGS({ fdtRole: "grupo", ...(e ? { fdtGrupo: e } : {}) }),
		pages: [
			pagina("Ficha do Grupo", fichaInicial),
			pagina("Regras para Grupos (Fim dos Tempos)", `
				<p><i>${FONTE_FDT}.</i> Se o grupo tiver um nome, um líder e uma base, recebe benefícios:</p>
				<ul>
					<li><b>Nome:</b> a ação ajudar concede +1 de bônus adicional entre os membros. ${I("Grupo · Nome")}</li>
					<li><b>Líder:</b> +1 em Iniciativa por membro, dividido como quiserem. ${I("Grupo · Liderança")}</li>
					<li><b>Base:</b> na base, todos dispõem dos PM da base (média dos PM do grupo), que se recuperam 1 por dia. ${I("Grupo · Base")}</li>
				</ul>
				<p>Use ${M("Montar")} quando o grupo escolher nome, líder e base. Ela coloca os benefícios na ficha de cada membro. ${M("PM da Base")} cuida dos PM da base.</p>`),
			pagina("Poderes de Grupo (Heróis de Arton)", `
				<p><i>${FONTE_HDA}.</i> São poderes gerais com bônus maiores, mas só funcionam se outro personagem jogador com o mesmo poder estiver na cena. NPCs e parceiros não contam. Se um membro morrer, o jogador pode trocar o poder entre aventuras.</p>
				<p><b>Jogador ausente:</b> o livro sugere que o personagem conte para o pré-requisito se estiver em risco na sessão (pode morrer ou sofrer consequências).</p>
				<table><tr><th>Poder</th><th>Pré-requisito</th><th>Automação</th></tr>${tabela}</table>`),
			pagina("Como usar", `
				<ol>
					<li>${M("Montar")}: nome, líder, base, membros e a divisão da Iniciativa.</li>
					<li>${M("Dar Poderes")}: quando um PJ escolher um poder de grupo (no lugar de um poder geral), marque o PJ e o poder. Ela confere os pré-requisitos.</li>
					<li>${M("Sincronizar")}: no começo de cada cena (ou ligue o modo automático da sessão). Liga os efeitos de quem tem parceiro de poder na cena e desliga o resto. Também diz no chat o que está ativo.</li>
					<li>${M("Ações")}: Conselhos Salvadores, Presença Luminosa, Conforto Familiar, Espírito de União e Dinheiro Atrai Dinheiro.</li>
					<li>Os demais poderes usam o card (custo em PM) e os <b>Efeitos de Uso</b> na janela de rolagem (abra a janela sem Shift).</li>
				</ol>`)
		]
	});

	ui.notifications.info(`O Grupo: ${itens.length} itens, ${macros.length} macros e o diário "${j.name}" criados.${e ? " Ficha do grupo preservada." : ""}`);
})();
