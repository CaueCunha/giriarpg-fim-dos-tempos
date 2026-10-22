/* =====================================================================
 * FIM DOS TEMPOS · ARCO 2 · APÊNDICES (NEGÓCIOS E DISTINÇÕES)
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Arco 2 · Apêndices" com:
 *      - Os poderes de distinção do Cavaleiro da Redenção e do Vigilante Mascarado (com as
 *        marcas Presença Protetora e Traje das Sombras).
 *      - Diário com as regras de Negócios (os 45 ativos), Distinções e as duas distinções.
 *      - Macros: Negócios (criar, subir de nível, ativos, rendimentos, cassino e os benefícios
 *        para o grupo) e Distinções (admissão, bônus que crescem com os poderes e os gastos de PM).
 *   3. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "a2apendices". Os negócios
 *      ficam guardados nos atores dos donos (flag fdtNegocios) e sobrevivem.
 *
 * Feito a partir do código do sistema (1.6.4, out/2026). Validado no Foundry simulado do
 * módulo giriarpg-fim-dos-tempos; veja o guia a2-apendices.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "a2apendices";
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
			window: { title: "Apêndices: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para os Apêndices.</p>
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
	/* 1. Pastas e construtores                                             */
	/* ------------------------------------------------------------------ */
	const NOME_PASTA = "FdT · Arco 2 · Apêndices";
	const pasta = {};
	for (const type of ["Item", "JournalEntry", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#8a6d2b", flags: FLAGS() })).id;
	}
	const L = (d) => (d?.uuid ? `@UUID[${d.uuid}]{${d.name}}` : "");
	const lista = (itens) => `<ul>${itens.map((t) => `<li>${t}</li>`).join("")}</ul>`;
	const pagina = (name, content, sort) => ({ name, type: "text", sort, text: { content, format: 1 } });
	const PD = `${T20I}/poderes`;

	const fx = (name, img, changes = [], o = {}) => ({
		name,
		img: img ?? "icons/svg/aura.svg",
		type: "base",
		transfer: o.transfer ?? true,
		disabled: o.disabled ?? false,
		duration: {},
		description: o.description ?? "",
		statuses: [],
		flags: o.flags ?? FLAGS(),
		system: {
			changes: changes.map(([key, value, type]) => ({ key, value: String(value), type: type ?? "add", phase: "initial", priority: null })),
			onuse: false,
			abilityUse: { types: [], names: [], automatic: false, aumenta: false, custo: 0, description: "" }
		}
	});
	const poder = (name, img, desc, o = {}) => ({
		name,
		type: "poder",
		img,
		folder: pasta.Item,
		flags: FLAGS(o.role),
		effects: o.effects ?? [],
		system: {
			description: { value: desc },
			tipo: "distincao",
			subtipo: "",
			ativacao: { execucao: o.exec ?? "passive", custo: o.custo ?? 0, qtd: "", condicao: o.condicao ?? "", special: "" },
			alcance: o.alcance ?? "",
			area: "",
			duracao: { value: 0, units: o.durU ?? "", special: "" },
			resistencia: { pericia: "", atributo: "", bonus: 0, txt: "" },
			rolls: o.rolls ?? []
		}
	});

	/* ------------------------------------------------------------------ */
	/* 2. Negócios: os ativos                                               */
	/* ------------------------------------------------------------------ */
	// pre: { nivel, ativos: [] }. fx: bônus aplicados pela macro aos personagens com acesso ao negócio.
	// alvo: "div"/"arc" só para conjuradores desse tipo; "patamar" escala com o patamar do personagem.
	const OFICIOS = ["alfa", "alqu", "arme", "arte", "cozi", "enge"];
	const ATIVOS = [
		{ k: "academia", nome: "Academia", pre: { nivel: 7 }, desc: "Seu negócio é tão vasto e famoso que atrai pessoas extraordinárias de todo o mundo para aprender com você e seus companheiros: uma verdadeira escola de aventureiros. Você recebe um <b>parceiro veterano</b> humanoide de um tipo à sua escolha (exceto montaria). Se o parceiro for morto, é substituído na próxima vez que você passar na Academia." },
		{ k: "alfaiataria", nome: "Alfaiataria", pre: { ativos: ["oficina"] }, desc: "Costureiros atentos à moda da nobreza e realeza, com tecidos e joias de alta qualidade. Você pode se beneficiar de <b>um item vestido adicional</b>." },
		{ k: "alojamentos", nome: "Alojamentos", desc: "Camas, bacias com água para higiene e o descanso merecido após a última aventura. As condições de descanso no negócio se tornam <b>confortáveis</b>." },
		{ k: "altar", nome: "Altar", alvo: "div", fx: [["system.attributes.pm.bonus.total", 2]], desc: "Um local de oração, com símbolos de uma ou mais divindades. Você recebe <b>+2 PM</b>, mas apenas se for um conjurador divino." },
		{ k: "arena", nome: "Arena", desc: "Um espaço para lutas de todos os tipos. Você recebe <b>proficiência em uma arma marcial</b> à sua escolha (ou uma exótica, se já for proficiente com armas marciais)." },
		{ k: "bazar", nome: "Bazar", desc: "Contatos com guildas de artesãos, caravaneiros e capitães mercantes, e a estrutura para vender. Quando compra ou vende itens mundanos (não superiores e não mágicos), o preço muda <b>10% a seu favor</b>." },
		{ k: "botica", nome: "Botica", fx: [["system.pericias.fort.bonus", 1]], desc: "Remédios, bálsamos e ervas medicinais que garantem boa saúde. Você recebe <b>+1 em Fortitude</b>." },
		{ k: "cassino", nome: "Cassino", fx: [["system.pericias.joga.bonus", 1]], desc: "Jogos de azar e apostas. Alguns dizem que é abençoado por Nimb; outros, que é amaldiçoado... Você recebe <b>+1 em Jogatina</b>. Uma vez por aventura (ou mês), role um dado: par, recebe <b>TO 10 × nível do negócio²</b>; ímpar, perde metade dessa quantia (sem fundos, fica devendo para a próxima vez)." },
		{ k: "centro", nome: "Centro de Pesquisa", pre: { ativos: ["oficina"] }, desc: "Um local protegido para experimentos longe dos olhos (e dos rostos) alheios. A quantidade de <b>engenhocas</b> que você pode manter aumenta em <b>+1</b>." },
		{ k: "circulo", nome: "Círculo de Poder", alvo: "arc", fx: [["system.attributes.pm.bonus.total", 2]], desc: "Objetos encantados e padrões no chão, como pentagramas e runas, atraem as energias místicas. Você recebe <b>+2 PM</b>, mas apenas se for um conjurador arcano." },
		{ k: "clinica", nome: "Clínica", fx: [["system.attributes.pv.bonus.total", 3]], desc: "Macas, bandagens, ervas e o necessário para curar ferimentos e doenças. Você recebe <b>+3 PV</b>." },
		{ k: "cocheira", nome: "Cocheira", desc: "Espaço para animais descansarem, isolados do barulho, com alimentação e tratadores. Você pode ter até <b>um parceiro montaria</b> que não conta no limite de parceiros." },
		{ k: "conservatorio", nome: "Conservatório", desc: "Uma escola especializada para aprender as minúcias do instrumento. Você pode usar <b>Atuação no lugar de Diplomacia</b>." },
		{ k: "cozinha", nome: "Cozinha", desc: "Fornos, panelas, utensílios limpos e um bom estoque de ingredientes. Os bônus em perícias dos <b>alimentos que você cozinha aumentam em +1</b>." },
		{ k: "creche", nome: "Creche", desc: "Um lugar seguro para filhos e protegidos, que deixa você mais disposto a se arriscar. Uma vez por aventura (ou mês), você pode <b>sofrer um efeito nocivo no lugar de um aliado adjacente</b>." },
		{ k: "dojo", nome: "Dojo", desc: "Local de treino das artes marciais tamuranianas, com tablado, bonecos estofados e um pequeno altar a Lin-Wu. Você recebe <b>+1 em testes de ataque desarmado ou com armas naturais</b>." },
		{ k: "emporio", nome: "Empório", pre: { ativos: ["bazar"] }, desc: "Se algo existe em Arton, está à venda no seu negócio. O negócio passa a render <b>100 TO × nível</b> por mês (ou o resultado do teste de Ofício ou Nobreza × 10 × nível)." },
		{ k: "escritorio", nome: "Escritório", desc: "Ábacos, pergaminhos e funcionários estressados que cuidam da contabilidade e da administração. O <b>custo em tibares para aumentar o nível</b> do negócio é <b>metade</b> do normal." },
		{ k: "espionagem", nome: "Espionagem Industrial", pre: { nivel: 3 }, desc: "Agentes atentos às tendências e segredos dos outros negócios. Escolha um ativo que o negócio não tenha, mas cujos pré-requisitos cumpra: o negócio fornece os benefícios dele. Uma vez por aventura (ou mês), você pode trocar o ativo escolhido." },
		{ k: "estagiarios", nome: "Estagiários", pre: { ativos: ["oficina"] }, desc: "Jovens aprendizes que trabalham muito e recebem pouco (ou nada). Quando fabrica um item não consumível, você pode sofrer <b>–5 no teste para fabricar dois itens</b> da mesma categoria, pagando o custo de ambos." },
		{ k: "estudio", nome: "Estúdio", desc: "Um espaço para os gênios, inovadores, loucos e criativos que você emprega. A <b>CD do teste para aumentar o nível</b> do negócio diminui em <b>–5</b>." },
		{ k: "fachada", nome: "Fachada", fx: [["system.pericias.furt.bonus", 1]], desc: "Aparentemente um estabelecimento respeitável, as autoridades não batem à porta. Você recebe <b>+1 em Furtividade</b> e pode conduzir atividades ilegais no negócio (culto a deuses proibidos, armas de fogo, receptação...). Isso não impede tramas em que o negócio seja ameaçado. A critério do mestre, também anula a má fama de quem frequenta o negócio." },
		{ k: "forjaria", nome: "Forjaria", pre: { ativos: ["oficina"] }, desc: "Fornalha, bigorna, fole e malho para itens de grande qualidade. Você recebe <b>20% de desconto</b> para comprar ou fabricar <b>itens superiores</b>." },
		{ k: "fortificacao", nome: "Fortificação", desc: "Muralhas de pedra, portões de ferro e janelas gradeadas. Se o negócio for atacado, seus defensores recebem <b>+2 na Defesa e em testes de resistência</b>." },
		{ k: "galeria", nome: "Galeria de Arte", desc: "As obras mais inovadoras do Reinado, que muitos não entendem. Mas será que há algo para entender? Você pode substituir testes de <b>Atuação por Enganação</b>." },
		{ k: "ginasio", nome: "Ginásio", desc: "Invenção dos minotauros que se espalha pelo Reinado (a maioria ainda acha as máquinas parecidas com instrumentos de tortura). Você recebe <b>+1 em rolagens de dano desarmado e com armas naturais</b>." },
		{ k: "guilda", nome: "Guilda de Aventureiros", pre: { ativos: ["salaoComunal"] }, desc: "Um salão onde heróis andarilhos trocam histórias. Toda <b>XP que você recebe aumenta em +10%</b>. Com a regra de avanço por marcos (Tormenta20, p. 326), em vez disso você recebe +2 PV e +2 PM a cada novo patamar." },
		{ k: "integracao", nome: "Integração", pre: { nivel: 3 }, desc: "Um programa de treinamento para novos contratados. Você recebe <b>+2 em testes de treinamento</b> (Tormenta20, p. 277)." },
		{ k: "jardim", nome: "Jardim", desc: "Flores e árvores: o contato com a natureza, mesmo tênue, fortalece a ligação com os poderes selvagens. O custo de <b>Forma Selvagem diminui em –1 PM</b>." },
		{ k: "labAlquimico", nome: "Laboratório Alquímico", pre: { ativos: ["oficina"] }, desc: "Ampulhetas, balanças e frascos com todo tipo de ingrediente. Os efeitos dos seus <b>preparados alquímicos aumentam em um dado</b> (fogo alquímico causa 2d6 em vez de 1d6)." },
		{ k: "labSecreto", nome: "Laboratório Secreto", pre: { nivel: 5, ativos: ["fachada"] }, desc: "Um covil para experimentos ilegais, perigosos, profanos ou antinaturais. Você recebe <b>um poder da Tormenta</b> (com a perda de Carisma normal)." },
		{ k: "livraria", nome: "Livraria", fx: [["system.pericias.conh.bonus", 1]], desc: "Prateleiras de livros, tomos e pergaminhos sobre assuntos variados. Você recebe <b>+1 em Conhecimento</b>." },
		{ k: "logistica", nome: "Logística", fx: [["system.attributes.carga.bonus", 5]], desc: "Especialistas em armazenamento, transporte e manuseio de carga. Seu <b>limite de carga aumenta em 5 espaços</b>." },
		{ k: "multinivel", nome: "Mercado Multinivelado", pre: { nivel: 3 }, desc: "As pessoas pagam para trabalhar para você, desde que recrutem outras que paguem para trabalhar para elas, e assim por diante (há pequenos detalhes, como as multas e as dívidas, mas não vamos falar sobre isso). A cada aventura (ou mês) em que recrutar <b>um NPC com nome</b>, você recebe <b>T$ nível × 100</b>; com dois, nível × 200; e assim por diante, até um multiplicador igual ao nível do negócio. O mestre decide o que é preciso para recrutar (interpretação, testes sociais e uma vítima, digo, futuro associado com propensão a embarcar nessa)." },
		{ k: "oficina", nome: "Oficina", fx: OFICIOS.map((k) => [`system.pericias.${k}.bonus`, 1]), desc: "Bancadas, ferramentas e auxiliares para exercer o ofício com perfeição. Você recebe <b>+1 em Ofício</b>." },
		{ k: "ourivesaria", nome: "Ourivesaria", desc: "Acessórios de todos os tipos, de joias genuínas a bijuterias. No início de cada aventura (ou mês), escolha um item seu para receber os benefícios das melhorias <b>banhado a ouro ou cravejado de gemas</b>, sem contar no limite de melhorias." },
		{ k: "palco", nome: "Palco", desc: "Músicos, malabaristas, atores, mímicos... Você pode usar <b>poderes de Música com uma ação de movimento</b> (em vez de padrão)." },
		{ k: "patio", nome: "Pátio de Treinamento", desc: "Armas variadas, alvos de madeira e espaço para golpear sem machucar ninguém. Escolha uma arma: <b>+1 em testes de ataque</b> com ela." },
		{ k: "carreira", nome: "Plano de Carreira", pre: { nivel: 3 }, desc: "O negócio ajuda os funcionários em seus próprios objetivos. Você recebe <b>+2 em testes de buscas</b> (Tormenta20, p. 278)." },
		{ k: "propaganda", nome: "Propaganda", pre: { nivel: 2 }, fx: [["system.pericias.dipl.bonus", 1]], desc: "Arautos nas arenas, cartazes nas paredes, brasões bordados nas roupas de aventureiros famosos. Você recebe <b>+1 em Diplomacia ou Enganação</b> (a macro dá Diplomacia; troque no efeito se quiser Enganação)." },
		{ k: "salaoComunal", nome: "Salão Comunal", desc: "Mesas e cadeiras para beber e comemorar; o burburinho camufla os sussurros. Você pode usar o poder <b>Mestre dos Sussurros</b> (Tormenta20, p. 45). Se já o possui, soma o nível do negócio nos testes de perícia com ele." },
		{ k: "salaoBaile", nome: "Salão de Baile", fx: [["system.pericias.nobr.bonus", 1]], desc: "Nobres e figurões alugam o espaço para festas ou reuniões exclusivas. Você recebe <b>+1 em Nobreza</b>." },
		{ k: "marah", nome: "Salão de Marah", alvo: "patamar", fx: [["system.attributes.pm.bonus.total", 1]], desc: "Lugares que oferecem o amor (ou o simulacro que pode ser comprado). Uma visita deixa qualquer aventureiro mais disposto. Seu total de <b>PM aumenta em +1 por patamar</b>." },
		{ k: "santuario", nome: "Santuário", pre: { ativos: ["altar"] }, desc: "Um lugar sagrado de comunhão. Se for devoto da divindade do santuário, você aprende <b>uma magia divina adicional</b> de qualquer círculo que possa lançar." },
		{ k: "torre", nome: "Torre Arcana", pre: { ativos: ["circulo"] }, desc: "Um espaço para estudar e testar magias em paz (e sem desintegrar nenhum inocente). Você aprende <b>uma magia arcana adicional</b> de qualquer círculo que possa lançar." }
	];

	/* ------------------------------------------------------------------ */
	/* 3. Distinções: poderes                                              */
	/* ------------------------------------------------------------------ */
	const ADM_CAVALEIRO = [
		"Ter cometido erros graves e chegado ao fundo do poço: um crime, a morte de alguém próximo, renunciar ao dever por razões mesquinhas, voltar as costas a um amigo ou falta igualmente séria. O juiz do quão fundo é o poço é o próprio candidato; o principal é a culpa e a vontade de mudar.",
		"Encontrar um Cavaleiro da Redenção e pedir ajuda (às vezes o mentor encontra o candidato, uma grande bênção de Thyatis, mas não se pode só esperar).",
		"Contar ao mentor seus erros e o motivo do desejo de mudança, e cumprir a tarefa que ele impõe para corrigi-los: de reconstruir uma aldeia a apresentar-se às autoridades. Restaurar as vidas que prejudicou, tanto quanto possível.",
		"Ser um redentor, não só um redimido: procurar alguém que precise de uma segunda chance e ajudá-lo a mudar, compensando as vítimas dos erros desse desgarrado (que não vira Cavaleiro e pode nem entender o que o candidato faz).",
		"Com os erros corrigidos e a segunda chance aceita, uma rápida cerimônia e a designação de um dever, decidida pelo mentor."
	];
	const ADM_VIGILANTE = [
		"Uma experiência ou acontecimento muito forte, pontual e transformador que dê um bom motivo para perseguir criminosos pela noite (talvez inspirando o codinome e o uniforme).",
		"Expressar o juramento, a alguém ou a si mesmo, e embarcar numa jornada de transformação.",
		"Desenvolver um uniforme marcante, com um tema, que esconda a identidade (feito por ele mesmo ou por alguém de confiança; o segredo não pode passar de uma ou duas pessoas). Criar um codinome.",
		"Desenvolver uma técnica ou ataque marcante (uma manobra de combate, uma maneira de desvendar mistérios), único o bastante para virar assunto de sussurros amedrontados no submundo.",
		"Combater o crime sob a identidade secreta, usando a técnica registrada (impedir um roubo, capturar um assassino, resgatar um prisioneiro). Nessa missão, não pode revelar a identidade nem receber ajuda do grupo."
	];
	const PODERES = [
		poder("Presença Protetora (Marca da Distinção)", `${PD}/distincao.webp`, `<p><i>Cavaleiro da Redenção.</i> Qualquer aliado se sente mais seguro nas proximidades de um Cavaleiro da Redenção. O efeito da sua <b>Égide Sagrada</b> se estende para aliados em <b>alcance curto</b> (e não apenas adjacentes).</p>`, { role: "marcaCavaleiro" }),
		poder("Escudo Redentor", `${PD}/concedidos-ressurreicao.webp`, `<p><i>Cavaleiro da Redenção.</i> Quando um aliado dentro do efeito da sua Égide Sagrada se torna alvo de um ataque ou efeito hostil, você pode gastar <b>2 PM</b> para protegê-lo com seu próprio escudo. Apenas contra esse ataque ou efeito, o aliado aplica os bônus do seu escudo na Defesa, em testes de resistência e em redução de dano (benefício do poder, não de equipamento). Se o aliado sofrer dano, <b>você sofre metade no lugar dele</b>.</p><p><b>Pré-requisitos:</b> treinado em Diplomacia, Luta e Vontade, Égide Sagrada, devoto de Thyatis.</p>`, { role: "cavEscudo", exec: "reaction", custo: 2 }),
		poder("Conceder Segunda Chance", `${PD}/concedidos-ressurreicao.webp`, `<p><i>Cavaleiro da Redenção.</i> Uma vez por rodada, quando um aliado em alcance curto falha em um teste, você pode gastar <b>2 PM</b> para que ele <b>role novamente</b>. Para cada dois outros poderes de Cavaleiro da Redenção, uma vez adicional por rodada (mas não no mesmo teste).</p><p><b>Pré-requisito:</b> Escudo Redentor.</p>`, { role: "cavSegunda", exec: "reaction", custo: 2, alcance: "short" }),
		poder("Palavras Redentoras", `${PD}/concedidos-ressurreicao.webp`, `<p><i>Cavaleiro da Redenção.</i> A maior arma de um Cavaleiro é uma palavra amiga. Você aprende e pode lançar <b>Escudo da Fé</b> e <b>Tranquilidade</b> (atributo-chave Carisma).</p><p><b>Pré-requisito:</b> Escudo Redentor.</p>`, { role: "cavPalavras" }),
		poder("Provocação Flamejante", `${PD}/concedidos-ressurreicao.webp`, `<p><i>Cavaleiro da Redenção.</i> Quando um inimigo passa no teste de Vontade contra sua <b>Provocação Petulante</b>, você pode gastar <b>1 PM</b> para causar <b>2d6 de fogo</b> nele. Para cada outro poder de Cavaleiro da Redenção, você pode gastar +1 PM para aumentar o dano em +2d6.</p><p><b>Pré-requisitos:</b> Escudo Redentor, Provocação Petulante.</p>`, { role: "cavProvocacao", exec: "reaction", custo: 1, rolls: [{ name: "Fogo", key: "dano0", type: "dano", parts: [["2d6", "fogo", ""]], versatil: "", adaptavel: "" }] }),
		poder("Revoada da Fênix", `${PD}/concedidos-ressurreicao.webp`, `<p><i>Cavaleiro da Redenção.</i> Uma vez por rodada, você pode gastar <b>2 PM</b> para receber uma <b>ação de movimento adicional</b>, que só pode ser usada para se deslocar em direção a um aliado.</p><p><b>Pré-requisito:</b> Escudo Redentor.</p>`, { role: "cavRevoada", exec: "free", custo: 2 }),
		poder("Traje das Sombras (Marca da Distinção)", `${PD}/distincao.webp`, `<p><i>Vigilante Mascarado.</i> Escolha uma armadura ou item de vestuário: ele se torna seu traje das sombras. Enquanto o estiver vestindo, você recebe <b>+1 em Furtividade e Intimidação</b> e, se o item impuser penalidade de armadura, ela diminui em –1. Esses benefícios aumentam em +1 para cada poder de vigilante mascarado que você possuir. Se perder o traje, crie outro com um dia de trabalho e T$ 100.</p><p>O efeito abaixo é atualizado pela macro Distinções conforme os poderes. Desligue-o quando estiver sem o traje.</p>`, { role: "marcaVigilante", effects: [fx("Traje das Sombras", `${PD}/distincao.webp`, [["system.pericias.furt.bonus", 1], ["system.pericias.inti.bonus", 1]], { flags: { world: { fdt: TAG, fdtRole: "efTraje" } }, description: "Vestindo o traje das sombras. Penalidade de armadura do traje –1 por nível de bônus (ajuste no item)." })] }),
		poder("Cavaleiro das Trevas", `${PD}/concedidos-trevas.webp`, `<p><i>Vigilante Mascarado.</i> Você recebe <b>visão no escuro</b> e pode usar <b>Ataque Furtivo</b> contra criaturas sob qualquer condição de medo, mesmo que não estejam desprevenidas nem flanqueadas. Quando desfere um acerto crítico ou Ataque Furtivo, pode gastar <b>1 PM</b> para ignorar a imunidade a críticos e/ou a ataques furtivos da criatura.</p><p><b>Pré-requisitos:</b> treinado em Furtividade, Intimidação e Luta, Ataque Furtivo.</p>`, { role: "vigTrevas" }),
		poder("Criatura da Noite", `${PD}/concedidos-trevas.webp`, `<p><i>Vigilante Mascarado.</i> Escolha uma das formas selvagens de druida (Tormenta20, p. 63) e um animal ligado ao seu disfarce. Vestindo o traje das sombras, você pode gastar uma <b>ação completa e 3 PM</b> para virar uma versão humanoide desse animal: recebe os benefícios da forma selvagem escolhida, mas não assume completamente a forma (e não recebe o bônus em Enganação). No mais, funciona como Forma Selvagem. Com três poderes de vigilante, pode gastar <b>6 PM</b> para a versão aprimorada; com cinco, <b>10 PM</b> para a superior.</p><p><b>Pré-requisitos:</b> Cavaleiro das Trevas, ter a imagem do animal estampada no traje.</p>`, { role: "vigCriatura", exec: "full", custo: 3 }),
		poder("Mobilidade Urbana", `${PD}/concedidos-trevas.webp`, `<p><i>Vigilante Mascarado.</i> Em ambiente urbano, você recebe <b>+1 na Defesa e em Acrobacia, Atletismo, Furtividade, Investigação e Percepção</b>, +1 para cada outro poder de vigilante mascarado. Em terreno elevado (um telhado), pode gastar <b>2 PM</b> para uma investida pulando sobre um oponente no chão: faça um teste de Acrobacia para amortecer queda (Tormenta20, p. 115); se passar, além da investida normal, cada dado de dano de queda que reduzir dá <b>+1d6 de dano</b> ao ataque.</p><p><b>Pré-requisitos:</b> treinado em Acrobacia, Cavaleiro das Trevas.</p><p>O efeito abaixo (ligue em ambiente urbano) é atualizado pela macro Distinções.</p>`, { role: "vigMobilidade", effects: [fx("Mobilidade Urbana (ambiente urbano)", `${PD}/concedidos-trevas.webp`, [["system.attributes.defesa.bonus", 1], ["system.pericias.acro.bonus", 1], ["system.pericias.atle.bonus", 1], ["system.pericias.furt.bonus", 1], ["system.pericias.inve.bonus", 1], ["system.pericias.perc.bonus", 1]], { disabled: true, flags: { world: { fdt: TAG, fdtRole: "efMobilidade" } }, description: "Ligue em ambiente urbano." })] }),
		poder("Símbolo de Esperança", `${PD}/concedidos-trevas.webp`, `<p><i>Vigilante Mascarado.</i> No início de uma cena, ou sempre que reduzir um inimigo a 0 PV com um ataque corpo a corpo, vestindo o traje das sombras, você pode gastar <b>3 PM</b> para inspirar os aliados em alcance curto: você e eles recebem <b>+2 na Defesa e em testes de resistência</b> até o fim da cena, e a próxima habilidade que cada aliado usar na cena custa <b>–1 PM</b>.</p><p><b>Pré-requisito:</b> Cavaleiro das Trevas.</p>`, { role: "vigSimbolo", exec: "free", custo: 3, alcance: "short" }),
		poder("Vingador Sem Rosto", `${PD}/concedidos-trevas.webp`, `<p><i>Vigilante Mascarado.</i> Você se torna <b>imune a todas as formas de detecção da sua identidade secreta</b>, incluindo Intuição, Percepção e magias como Visão da Verdade. Você ainda pode ser detectado, mas isso nunca revela sua identidade. A única forma de descobri-la é arrancar a máscara do traje das sombras enquanto você estiver inconsciente ou paralisado.</p><p><b>Pré-requisito:</b> Cavaleiro das Trevas.</p>`, { role: "vigVingador" })
	];
	const itens = await Item.createDocuments(PODERES);
	const it = (role) => itens.find((i) => i.getFlag("world", "fdtRole") === role);
	const CAVALEIRO = ["cavEscudo", "cavSegunda", "cavPalavras", "cavProvocacao", "cavRevoada"];
	const VIGILANTE = ["vigTrevas", "vigCriatura", "vigMobilidade", "vigSimbolo", "vigVingador"];

	/* ------------------------------------------------------------------ */
	/* 4. Macros                                                            */
	/* ------------------------------------------------------------------ */

	/** Negócios dos heróis: criar, crescer, ativos, rendimentos e os benefícios para o grupo. */
	async function macroNegocios(D) {
		const TAG = "a2apendices";
		const FLAG = "fdtNegocios";
		const pjs = game.actors.filter((a) => a.type === "character");
		const sel = (canvas.tokens?.controlled ?? []).map((t) => t.actor).filter((a) => a?.type === "character");
		const todos = pjs.flatMap((a) => (a.getFlag("world", FLAG) ?? []).map((n, i) => ({ a, i, n })));
		const ativo = (k) => D.ativos.find((x) => x.k === k);
		const opNeg = todos.length ? todos.map((x, j) => `<option value="${j}">${x.n.nome} (nível ${x.n.nivel}, de ${x.a.name})</option>`).join("") : `<option value="">(nenhum negócio ainda)</option>`;
		const opAtivo = D.ativos.map((x) => `<option value="${x.k}">${x.nome}${x.pre ? ` (${[x.pre.nivel ? `nível ${x.pre.nivel}` : "", ...(x.pre.ativos ?? []).map((k) => ativo(k).nome)].filter(Boolean).join(", ")})` : ""}</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Valkaria · Negócios" },
			position: { width: 560 },
			content: `
				<p style="font-size:0.85em">Para criar, selecione o token do dono. Os benefícios valem para quem tem acesso ao negócio (selecione o grupo; sem seleção, todos os personagens).</p>
				<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="ver">Ver os negócios do grupo</option>
					<option value="criar">Criar um negócio (1 mês, T$ 1.000, CD 20)</option>
					<option value="subir">Subir de nível (1 mês, CD 20 + 2 × próximo nível)</option>
					<option value="ativo">Acrescentar um ativo sem teste (negócio já existente)</option>
					<option value="tirar">Tirar um ativo</option>
					<option value="rendimento">Rendimento da aventura (ou mês)</option>
					<option value="cassino">Cassino: rolar o dado</option>
					<option value="multinivel">Mercado Multinivelado: NPCs recrutados</option>
					<option value="beneficios">Aplicar os benefícios dos ativos ao grupo</option>
					<option value="longe">Tirar os benefícios (o grupo está longe)</option>
					<option value="fechar">Fechar o negócio</option></select></div>
				<div class="form-group"><label>Negócio</label><select name="j">${opNeg}</select></div>
				<div class="form-group"><label>Ativo</label><select name="ativo">${opAtivo}</select></div>
				<div class="form-group"><label>Nome (ao criar)</label><input type="text" name="nome" placeholder="Empório de Armamentos"></div>
				<div class="form-group"><label>Onde fica (ao criar)</label><input type="text" name="local" placeholder="Cidade da Praia"></div>
				<div class="form-group"><label>Dedicou o mês inteiro ao negócio (rendimento)</label><input type="checkbox" name="mes"></div>
				<div class="form-group"><label>NPCs com nome recrutados (Multinivelado)</label><input type="number" name="npcs" value="1" min="0"></div>
				<div class="form-group"><label>Descontar e creditar o dinheiro na ficha</label><input type="checkbox" name="dinheiro"></div>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const whisper = ChatMessage.getWhisperRecipients("GM");
		const rolls = [];
		const val = (a, k) => Number(a.system.pericias?.[k]?.value) || 0;
		const melhor = (a) => [...D.oficios, "nobr"].reduce((m, k) => (val(a, k) > val(a, m) ? k : m), "nobr");
		const testar = async (a) => {
			const k = melhor(a);
			const r = await new Roll(`1d20 + ${val(a, k)}`).evaluate();
			rolls.push(r);
			return { k, r };
		};
		const tibares = async (a, campo, delta) => {
			if (!res.dinheiro || !delta) return "";
			const atual = Number(a.system.dinheiro?.[campo]) || 0;
			if (atual + delta < 0) return ` <i>(${a.name} não tem ${campo === "to" ? "TO" : "T$"} ${-delta}: desconte à mão)</i>`;
			await a.update({ [`system.dinheiro.${campo}`]: atual + delta });
			return ` <i>(${delta > 0 ? "creditado" : "descontado"} na ficha de ${a.name})</i>`;
		};
		const salvar = async (a, lista) => a.setFlag("world", FLAG, lista);
		const descrever = (n) => `<b>${n.nome}</b>${n.local ? ` (${n.local})` : ""}, nível ${n.nivel}: ${n.ativos.length ? n.ativos.map((k) => ativo(k)?.nome ?? k).join(", ") : "sem ativos"}${n.ativos.length < n.nivel ? ` <i>(falta escolher ${n.nivel - n.ativos.length} ativo(s))</i>` : ""}`;
		const prereq = (n, k) => {
			const x = ativo(k);
			if (n.ativos.includes(k)) return `${x.nome} já faz parte do negócio.`;
			if (x.pre?.nivel && n.nivel < x.pre.nivel) return `${x.nome} exige negócio de nível ${x.pre.nivel}.`;
			const falta = (x.pre?.ativos ?? []).filter((y) => !n.ativos.includes(y));
			if (falta.length) return `${x.nome} exige ${falta.map((y) => ativo(y).nome).join(" e ")}.`;
			return "";
		};
		const alvo = todos[Number(res.j)];

		if (res.acao === "ver") {
			const linhas = todos.map((x) => {
				const n = x.n;
				const prox = n.nivel + 1;
				const cd = 20 + 2 * prox - (n.ativos.includes("estudio") ? 5 : 0);
				const custo = 1000 * prox / (n.ativos.includes("escritorio") ? 2 : 1);
				return `<li>${descrever(n)}. Dono: ${x.a.name}. ${n.nivel < 7 ? `Próximo nível: CD ${cd}, T$ ${custo}.` : "Nível máximo."} Rende T$ ${100 * n.nivel}${n.ativos.includes("emporio") ? ` (Empório: TO ${100 * n.nivel})` : ""}.${n.divida ? ` Dívida do cassino: TO ${n.divida}.` : ""}</li>`;
			});
			return ChatMessage.create({ whisper, content: `<h3>Negócios do grupo</h3>${linhas.length ? `<ul>${linhas.join("")}</ul>` : "<p>Nenhum negócio ainda.</p>"}` });
		}
		if (res.acao === "criar") {
			const a = sel[0];
			if (!a) return ui.notifications.warn("Selecione o token do personagem dono do negócio.");
			const nome = String(res.nome ?? "").trim() || `Negócio de ${a.name}`;
			const t = await testar(a);
			const ok = t.r.total >= 20;
			let html = `<h3>Criando um negócio: ${nome}</h3><p>Um mês procurando lugar, conseguindo alvarás com um Lorde Urbano, contratando e comprando mercadorias. ${a.name} · ${D.pericias[t.k]} <b>${t.r.total}</b> contra CD 20: ${ok ? "✔️" : "❌"}</p>`;
			html += await tibares(a, "tp", -1000).then((s) => `<p>Custo: T$ 1.000.${s}</p>`);
			if (ok) {
				const lista = a.getFlag("world", FLAG) ?? [];
				const n = { nome, local: String(res.local ?? "").trim(), nivel: 1, ativos: [] };
				const erro = prereq(n, res.ativo);
				if (!erro) n.ativos.push(res.ativo);
				lista.push(n);
				await salvar(a, lista);
				html += `<p>✔️ <b>Negócio de nível 1 criado.</b> ${erro ? `Primeiro ativo não escolhido: ${erro}` : `Primeiro ativo: <b>${ativo(res.ativo).nome}</b>.`} Crie um nome para o estabelecimento, defina onde fica (áreas nobres são quase exclusivas de famílias tradicionais; perto da estátua é caríssimo) e alguns empregados.</p>`;
			} else html += "<p>❌ Não consegue criar o negócio. Pode tentar de novo com mais um mês e T$ 1.000.</p>";
			return ChatMessage.create({ whisper, rolls, content: html });
		}
		if (!alvo && !["beneficios", "longe"].includes(res.acao)) return ui.notifications.warn("Ainda não há negócio. Crie um primeiro.");
		const lista = alvo ? foundry.utils.deepClone(alvo.a.getFlag("world", FLAG) ?? []) : [];
		const n = alvo ? lista[alvo.i] : null;

		if (res.acao === "subir") {
			if (n.nivel >= 7) return ui.notifications.warn(`${n.nome} já está no nível máximo (7).`);
			const erro = prereq({ ...n, nivel: n.nivel + 1 }, res.ativo);
			if (erro) return ui.notifications.warn(`Escolha outro ativo para o novo nível: ${erro}`);
			const quem = sel[0] ?? alvo.a;
			const prox = n.nivel + 1;
			const cd = 20 + 2 * prox - (n.ativos.includes("estudio") ? 5 : 0);
			const custo = 1000 * prox / (n.ativos.includes("escritorio") ? 2 : 1);
			const t = await testar(quem);
			const ok = t.r.total >= cd;
			let html = `<h3>${n.nome}: nível ${n.nivel} → ${prox}</h3><p>Um mês de trabalho. ${quem.name} · ${D.pericias[t.k]} <b>${t.r.total}</b> contra CD ${cd}${n.ativos.includes("estudio") ? " (Estúdio: –5)" : ""}: ${ok ? "✔️" : "❌"}</p>`;
			html += `<p>Custo: T$ ${custo}${n.ativos.includes("escritorio") ? " (Escritório: metade)" : ""}.${await tibares(alvo.a, "tp", -custo)}</p>`;
			if (ok) {
				n.nivel = prox;
				n.ativos.push(res.ativo);
				await salvar(alvo.a, lista);
				html += `<p>✔️ <b>${n.nome}</b> agora é de nível ${prox}, com o ativo <b>${ativo(res.ativo).nome}</b>.</p>`;
			} else html += "<p>❌ O negócio não cresce este mês.</p>";
			return ChatMessage.create({ whisper, rolls, content: html });
		}
		if (res.acao === "ativo") {
			const erro = prereq(n, res.ativo);
			if (erro) return ui.notifications.warn(erro);
			if (n.ativos.length >= n.nivel) return ui.notifications.warn(`${n.nome} já tem ${n.nivel} ativo(s), um por nível.`);
			n.ativos.push(res.ativo);
			await salvar(alvo.a, lista);
			return ChatMessage.create({ whisper, content: `<p>${descrever(n)}.</p>` });
		}
		if (res.acao === "tirar") {
			n.ativos = n.ativos.filter((k) => k !== res.ativo);
			await salvar(alvo.a, lista);
			return ChatMessage.create({ whisper, content: `<p>${descrever(n)}.</p>` });
		}
		if (res.acao === "fechar") {
			lista.splice(alvo.i, 1);
			await salvar(alvo.a, lista);
			return ChatMessage.create({ whisper, content: `<p>${n.nome} fechou as portas.</p>` });
		}
		if (res.acao === "rendimento") {
			const emporio = n.ativos.includes("emporio");
			let valor = 100 * n.nivel;
			let html = `<h3>Rendimento: ${n.nome}</h3>`;
			if (res.mes) {
				const t = await testar(alvo.a);
				valor = t.r.total * 10 * n.nivel;
				html += `<p>${alvo.a.name} dedicou o mês ao negócio: ${D.pericias[t.k]} <b>${t.r.total}</b> × 10 × ${n.nivel}.</p>`;
			}
			const campo = emporio ? "to" : "tp";
			html += `<p><b>${emporio ? "TO" : "T$"} ${valor}</b>${emporio ? " (Empório)" : ""}.${await tibares(alvo.a, campo, valor)}</p>`;
			return ChatMessage.create({ whisper, rolls, content: html });
		}
		if (res.acao === "cassino") {
			if (!n.ativos.includes("cassino")) return ui.notifications.warn(`${n.nome} não tem Cassino.`);
			const r = await new Roll("1d6").evaluate();
			rolls.push(r);
			const base = 10 * n.nivel * n.nivel;
			let html = `<h3>Cassino: ${n.nome}</h3><p>Uma vez por aventura (ou mês). 1d6 = <b>${r.total}</b>.</p>`;
			if (r.total % 2 === 0) {
				const pago = Math.min(base, n.divida ?? 0);
				n.divida = (n.divida ?? 0) - pago;
				html += `<p>✔️ Par: <b>ganha TO ${base}</b>${pago ? ` (TO ${pago} pagam a dívida)` : ""}.${await tibares(alvo.a, "to", base - pago)}</p>`;
			} else {
				const perda = Math.floor(base / 2);
				const tem = res.dinheiro ? Number(alvo.a.system.dinheiro?.to) || 0 : perda;
				const paga = Math.min(perda, tem);
				if (paga < perda) n.divida = (n.divida ?? 0) + perda - paga;
				html += `<p>❌ Ímpar: <b>perde TO ${perda}</b>${paga < perda ? `; fica devendo TO ${perda - paga} para a próxima vez` : ""}.${await tibares(alvo.a, "to", -paga)}</p>`;
			}
			await salvar(alvo.a, lista);
			return ChatMessage.create({ whisper, rolls, content: html });
		}
		if (res.acao === "multinivel") {
			if (!n.ativos.includes("multinivel")) return ui.notifications.warn(`${n.nome} não tem Mercado Multinivelado.`);
			const qtd = Math.max(0, Math.floor(Number(res.npcs) || 0));
			const mult = Math.min(qtd, n.nivel);
			const valor = n.nivel * 100 * mult;
			return ChatMessage.create({ whisper, content: `<h3>Mercado Multinivelado: ${n.nome}</h3><p>${qtd} NPC(s) com nome recrutado(s) nesta aventura (ou mês); multiplicador ${mult} (máximo ${n.nivel}).</p><p><b>T$ ${valor}</b>.${await tibares(alvo.a, "tp", valor)}</p><p style="font-size:0.85em">É hora de ser seu próprio chefe e realizar seus sonhos!</p>` });
		}

		// Benefícios: estruturas não acumulam entre si, então cada ativo conta uma vez para o grupo.
		const grupo = sel.length ? sel : pjs;
		for (const a of grupo) {
			const velhos = a.effects.filter((e) => e.getFlag("world", "fdt") === TAG && e.getFlag("world", "fdtNegocio")).map((e) => e.id);
			if (velhos.length) await a.deleteEmbeddedDocuments("ActiveEffect", velhos);
		}
		if (res.acao === "longe") return ChatMessage.create({ whisper, content: `<p>Benefícios dos negócios removidos de ${grupo.map((a) => a.name).join(", ")}. Voltam quando o grupo voltar a ter acesso ao negócio.</p>` });
		const ks = [...new Set(todos.flatMap((x) => x.n.ativos))];
		const comFx = ks.map(ativo).filter((x) => x?.fx);
		const patamar = (a) => { const nv = Number(a.system.attributes?.nivel?.value) || 1; return nv >= 17 ? 4 : nv >= 11 ? 3 : nv >= 5 ? 2 : 1; };
		const conjura = (a, tipo) => a.items.some((i) => i.type === "magia" && (i.system.tipo === tipo || i.system.tipo === "uni"));
		const linhas = [];
		for (const a of grupo) {
			const changes = [];
			const nomes = [];
			for (const x of comFx) {
				if ((x.alvo === "div" || x.alvo === "arc") && !conjura(a, x.alvo)) continue;
				const mult = x.alvo === "patamar" ? patamar(a) : 1;
				for (const [key, v] of x.fx) changes.push({ key, value: String(v * mult), type: "add", phase: "initial", priority: null });
				nomes.push(x.nome);
			}
			if (!changes.length) continue;
			await a.createEmbeddedDocuments("ActiveEffect", [{
				name: "Negócios do grupo", img: "icons/svg/item-bag.svg", type: "base",
				description: `Benefícios de estruturas (não acumulam com outras estruturas, como dádivas, domínios e bases): ${nomes.join(", ")}. Valem enquanto houver acesso ao negócio e por até um mês depois.`,
				flags: { world: { fdt: TAG, fdtNegocio: true } },
				system: { changes }
			}]);
			linhas.push(`<li>${a.name}: ${nomes.join(", ")}</li>`);
		}
		const semFx = ks.map(ativo).filter((x) => x && !x.fx);
		await ChatMessage.create({ whisper, content: `<h3>Benefícios dos negócios</h3>${linhas.length ? `<ul>${linhas.join("")}</ul>` : "<p>Nenhum ativo com bônus automático.</p>"}${semFx.length ? `<p><b>Lembre à mão:</b> ${semFx.map((x) => x.nome).join(", ")}.</p>` : ""}<p style="font-size:0.85em">Quem se beneficia de um ativo está frequentando o negócio (o clérigo de Azgher no altar de Tenebra do colega pode arranjar inimigos).</p>` });
	}

	/** Distinções: admissão, bônus que crescem com os poderes e os gastos de PM em jogo. */
	async function macroDistincoes(D) {
		const TAG = "a2apendices";
		const a = (canvas.tokens?.controlled ?? []).map((t) => t.actor).find((x) => x?.type === "character");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Arco 2 · Distinções" },
			position: { width: 520 },
			content: `
				<p>Selecione o token do personagem${a ? ` (agora: <b>${a.name}</b>)` : ""}. Mire aliados ou inimigos quando o poder pedir.</p>
				<div class="form-group"><label>O que fazer</label><select name="acao">
					<optgroup label="Admissão">
						<option value="admCavaleiro">Ver a admissão do Cavaleiro da Redenção</option>
						<option value="admVigilante">Ver a admissão do Vigilante Mascarado</option>
						<option value="marcaCavaleiro">Admitir: dar a marca Presença Protetora</option>
						<option value="marcaVigilante">Admitir: dar a marca Traje das Sombras</option></optgroup>
					<optgroup label="Vigilante Mascarado">
						<option value="atualizar">Atualizar Traje das Sombras e Mobilidade Urbana</option>
						<option value="simbolo">Símbolo de Esperança (3 PM)</option>
						<option value="criatura">Criatura da Noite (3, 6 ou 10 PM)</option>
						<option value="desmascarado">Foi desmascarado</option>
						<option value="mascara">Recuperou a identidade secreta</option>
						<option value="fimCena">Fim da cena (tira o Símbolo de Esperança)</option></optgroup>
					<optgroup label="Cavaleiro da Redenção">
						<option value="escudo">Escudo Redentor (2 PM)</option>
						<option value="segunda">Conceder Segunda Chance (2 PM)</option>
						<option value="provocacao">Provocação Flamejante (1 PM + extras)</option>
						<option value="revoada">Revoada da Fênix (2 PM)</option></optgroup></select></div>
				<div class="form-group"><label>PM extras (Provocação Flamejante)</label><input type="number" name="extra" value="0" min="0"></div>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const whisper = ChatMessage.getWhisperRecipients("GM");
		if (res.acao === "admCavaleiro" || res.acao === "admVigilante") {
			const cav = res.acao === "admCavaleiro";
			return ChatMessage.create({ whisper, content: `<h3>Admissão: ${cav ? "Cavaleiro da Redenção" : "Vigilante Mascarado"}</h3><ol>${(cav ? D.admCavaleiro : D.admVigilante).map((t) => `<li>${t}</li>`).join("")}</ol><p style="font-size:0.85em">A admissão acontece na mesa, nunca fora de cena nem no passado do personagem. Só a partir do patamar veterano (5º nível) se obtêm os poderes.</p>` });
		}
		if (!a) return ui.notifications.warn("Selecione o token do personagem.");
		const doMundo = (role) => game.items.find((i) => i.getFlag("world", "fdt") === TAG && i.getFlag("world", "fdtRole") === role);
		const tem = (role) => a.items.find((i) => i.getFlag("world", "fdt") === TAG && i.getFlag("world", "fdtRole") === role);
		const conta = (roles) => roles.filter((r) => tem(r)).length;
		const nCav = conta(D.cavaleiro);
		const nVig = conta(D.vigilante);
		const desmascarado = !!a.getFlag("world", "fdtDesmascarado");
		const gastar = async (pm, nome) => {
			const atual = Number(a.system.attributes?.pm?.value) || 0;
			if (atual < pm) { ui.notifications.warn(`${a.name} não tem ${pm} PM para ${nome}.`); return false; }
			await a.update({ "system.attributes.pm.value": atual - pm });
			return true;
		};
		const precisa = (role, nome) => {
			if (tem(role)) return true;
			ui.notifications.warn(`${a.name} não tem o poder ${nome}.`);
			return false;
		};
		if (res.acao === "marcaCavaleiro" || res.acao === "marcaVigilante") {
			if (tem(res.acao)) return ui.notifications.info(`${a.name} já tem essa marca.`);
			const item = doMundo(res.acao);
			if (!item) return ui.notifications.warn("A marca não está neste mundo: importe os Apêndices do Ato 2.");
			const nivel = Number(a.system.attributes?.nivel?.value) || 1;
			await a.createEmbeddedDocuments("Item", [item.toObject()]);
			return ChatMessage.create({ content: `<p><b>${a.name}</b> conquistou a distinção <b>${res.acao === "marcaCavaleiro" ? "Cavaleiro da Redenção" : "Vigilante Mascarado"}</b> e recebe a marca ${item.name}.${nivel < 5 ? " <i>Os poderes da distinção só podem ser escolhidos a partir do 5º nível.</i>" : ""}</p>` });
		}
		if (["atualizar", "desmascarado", "mascara"].includes(res.acao)) {
			if (res.acao === "desmascarado") await a.setFlag("world", "fdtDesmascarado", true);
			if (res.acao === "mascara") await a.unsetFlag("world", "fdtDesmascarado");
			const fora = res.acao === "desmascarado" || (res.acao === "atualizar" && desmascarado);
			const ups = [];
			const traje = tem("marcaVigilante")?.effects.find((e) => e.getFlag("world", "fdtRole") === "efTraje");
			const mob = tem("vigMobilidade")?.effects.find((e) => e.getFlag("world", "fdtRole") === "efMobilidade");
			const ajustar = async (ef, valor, disabled) => {
				const changes = ef.system.changes.map((c) => ({ ...c, value: String(valor) }));
				await ef.update({ "system.changes": changes, ...(disabled === undefined ? {} : { disabled }) });
			};
			if (traje) { await ajustar(traje, 1 + nVig, fora ? true : res.acao === "mascara" ? false : undefined); ups.push(`Traje das Sombras: +${1 + nVig} em Furtividade e Intimidação (penalidade de armadura do traje –${1 + nVig})`); }
			if (mob) { await ajustar(mob, nVig, fora ? true : undefined); ups.push(`Mobilidade Urbana: +${nVig} na Defesa, Acrobacia, Atletismo, Furtividade, Investigação e Percepção em ambiente urbano`); }
			let html = `<h3>${a.name}: Vigilante Mascarado</h3><p>${nVig} poder(es) de vigilante.</p>${ups.length ? `<ul>${ups.map((t) => `<li>${t}</li>`).join("")}</ul>` : "<p>Sem a marca Traje das Sombras.</p>"}`;
			if (fora) html += `<p>🎭 <b>Desmascarado:</b> perde todos os bônus da marca e não pode usar nenhum poder da distinção. Para recuperar, passe de novo pela admissão (sem a etapa da motivação). Desmentindo a identidade revelada, não precisa de traje nem técnica novos, mas precisa fazer o público acreditar que a revelação era falsa.</p>`;
			else if (res.acao === "mascara") html += "<p>Identidade secreta restabelecida: o Traje das Sombras volta a valer (ligue a Mobilidade Urbana em ambiente urbano).</p>";
			return ChatMessage.create({ whisper, content: html });
		}
		if (D.vigilante.includes({ simbolo: "vigSimbolo", criatura: "vigCriatura" }[res.acao]) && desmascarado) return ui.notifications.warn(`${a.name} foi desmascarado e não pode usar poderes de vigilante.`);
		if (res.acao === "fimCena") {
			for (const t of canvas.tokens?.placeables ?? []) {
				const ids = t.actor?.effects.filter((e) => e.getFlag("world", "fdt") === TAG && e.getFlag("world", "fdtSimbolo")).map((e) => e.id) ?? [];
				if (ids.length) await t.actor.deleteEmbeddedDocuments("ActiveEffect", ids);
			}
			return ChatMessage.create({ whisper, content: "<p>Fim da cena: Símbolo de Esperança encerrado.</p>" });
		}
		if (res.acao === "simbolo") {
			if (!precisa("vigSimbolo", "Símbolo de Esperança") || !(await gastar(3, "Símbolo de Esperança"))) return;
			const aliados = [a, ...[...(game.user.targets ?? [])].map((t) => t.actor).filter((x) => x && x !== a)];
			for (const x of aliados) {
				await x.createEmbeddedDocuments("ActiveEffect", [{
					name: `Símbolo de Esperança (${a.name})`, img: "icons/svg/sun.svg", type: "base", description: "+2 na Defesa e em testes de resistência até o fim da cena. A próxima habilidade nesta cena custa –1 PM.",
					flags: { world: { fdt: TAG, fdtSimbolo: true } },
					system: { changes: [["system.attributes.defesa.bonus", 2], ["system.pericias.fort.bonus", 2], ["system.pericias.refl.bonus", 2], ["system.pericias.vont.bonus", 2]].map(([key, value]) => ({ key, value: String(value), type: "add", phase: "initial", priority: null })) }
				}]);
			}
			return ChatMessage.create({ content: `<p>🦇 <b>${a.name}</b> surge como Símbolo de Esperança (3 PM): ${aliados.map((x) => x.name).join(", ")} recebem <b>+2 na Defesa e em testes de resistência</b> até o fim da cena, e a próxima habilidade de cada aliado custa –1 PM.</p>` });
		}
		if (res.acao === "criatura") {
			if (!precisa("vigCriatura", "Criatura da Noite")) return;
			const custo = nVig >= 5 ? 10 : nVig >= 3 ? 6 : 3;
			const forma = nVig >= 5 ? "superior" : nVig >= 3 ? "aprimorada" : "básica";
			if (!(await gastar(custo, "Criatura da Noite"))) return;
			return ChatMessage.create({ content: `<p><b>${a.name}</b> se transforma na versão humanoide do seu animal (ação completa, ${custo} PM): forma selvagem <b>${forma}</b>, sem o bônus em Enganação. Exige estar com o traje das sombras.</p>` });
		}
		if (res.acao === "escudo") {
			if (!precisa("cavEscudo", "Escudo Redentor") || !(await gastar(2, "Escudo Redentor"))) return;
			const alvo = [...(game.user.targets ?? [])][0]?.actor;
			return ChatMessage.create({ content: `<p>🛡️ <b>${a.name}</b> usa o Escudo Redentor (2 PM)${alvo ? ` em ${alvo.name}` : ""}: contra este ataque ou efeito, o aliado aplica os bônus do escudo de ${a.name} na Defesa, em testes de resistência e em RD. Se sofrer dano, <b>${a.name} sofre metade no lugar dele</b>.</p>` });
		}
		if (res.acao === "segunda") {
			if (!precisa("cavSegunda", "Conceder Segunda Chance") || !(await gastar(2, "Conceder Segunda Chance"))) return;
			const usos = 1 + Math.floor((nCav - 1) / 2);
			return ChatMessage.create({ content: `<p>🔥 <b>${a.name}</b> concede uma segunda chance (2 PM): o aliado <b>rola o teste de novo</b>. ${a.name} pode fazer isso ${usos} vez(es) por rodada (nunca no mesmo teste).</p>` });
		}
		if (res.acao === "provocacao") {
			if (!precisa("cavProvocacao", "Provocação Flamejante")) return;
			const extra = Math.max(0, Math.min(Math.floor(Number(res.extra) || 0), nCav - 1));
			if (!(await gastar(1 + extra, "Provocação Flamejante"))) return;
			const r = await new Roll(`${2 + 2 * extra}d6[fogo]`).evaluate();
			const alvos = [...(game.user.targets ?? [])].map((t) => t.actor).filter(Boolean);
			for (const x of alvos) await x.applyDamageV2(r, 1);
			return ChatMessage.create({ rolls: [r], content: `<p>🔥 A ira de Thyatis: o inimigo resistiu à Provocação Petulante de <b>${a.name}</b> e sofre <b>${r.total} de fogo</b> (${1 + extra} PM${extra < Number(res.extra || 0) ? `; no máximo ${nCav - 1} PM extra(s) com ${nCav} poder(es)` : ""}).${alvos.length ? ` Aplicado em ${alvos.map((x) => x.name).join(", ")}.` : " Mire o inimigo para aplicar o dano."}</p>` });
		}
		if (res.acao === "revoada") {
			if (!precisa("cavRevoada", "Revoada da Fênix") || !(await gastar(2, "Revoada da Fênix"))) return;
			return ChatMessage.create({ content: `<p>🐦‍🔥 <b>${a.name}</b> desce como a fênix (2 PM): uma <b>ação de movimento adicional</b>, só para se deslocar em direção a um aliado.</p>` });
		}
	}

	const macro = (name, img, fn, dados = null) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Arco 2 · Apêndices · gerado por a2-apendices.js\n${dados ? `const DADOS = ${JSON.stringify(dados)};\n` : ""}(${fn.toString()})(${dados ? "DADOS" : ""});`
	});
	const PERICIAS = { nobr: "Nobreza", alfa: "Ofício (alfaiate)", alqu: "Ofício (alquimista)", arme: "Ofício (armeiro)", arte: "Ofício (artesão)", cozi: "Ofício (cozinheiro)", enge: "Ofício (engenhoqueiro)" };
	const macros = await Macro.createDocuments([
		macro("Valkaria · Negócios", "icons/svg/item-bag.svg", macroNegocios, { ativos: ATIVOS.map(({ k, nome, pre, fx: f, alvo }) => ({ k, nome, pre, fx: f, alvo })), oficios: OFICIOS, pericias: PERICIAS }),
		macro("Arco 2 · Distinções", `${PD}/distincao.webp`, macroDistincoes, { admCavaleiro: ADM_CAVALEIRO, admVigilante: ADM_VIGILANTE, cavaleiro: CAVALEIRO, vigilante: VIGILANTE })
	]);
	const linkMacro = (trecho) => {
		const m = macros.find((x) => x.name.includes(trecho));
		return m ? `@UUID[${m.uuid}]{${m.name}}` : trecho;
	};

	/* ------------------------------------------------------------------ */
	/* 5. Diário                                                            */
	/* ------------------------------------------------------------------ */
	const preTxt = (x) => (x.pre ? ` <i>Pré-requisito: ${[x.pre.nivel ? `negócio de nível ${x.pre.nivel}` : "", ...(x.pre.ativos ?? []).map((k) => ATIVOS.find((y) => y.k === k).nome)].filter(Boolean).join(", ")}.</i>` : "");
	await JournalEntry.create({
		name: "Arco 2 · Apêndices",
		folder: pasta.JournalEntry,
		flags: FLAGS("diarioApendices"),
		pages: [
			pagina("Guia do Mestre", `
				<p>Os Apêndices do livro do Arco 2 (pp. 309–319): regras de negócios dos heróis e duas novas distinções.</p>
				${lista([
					`${linkMacro("Negócios")}: cria o negócio (teste e custo), sobe de nível (CD, custo, Estúdio e Escritório), controla os ativos e os pré-requisitos, paga o rendimento (com o mês dedicado e o Empório), rola o Cassino (com a dívida) e o Mercado Multinivelado, e aplica os benefícios dos ativos ao grupo como um efeito \"Negócios do grupo\". Os negócios ficam guardados no ator do dono.`,
					`${linkMacro("Distinções")}: mostra as admissões, dá a marca, atualiza o Traje das Sombras e a Mobilidade Urbana conforme os poderes, controla o desmascaramento e gasta os PM dos poderes (Símbolo de Esperança aplica +2 aos aliados mirados; Provocação Flamejante rola e aplica o fogo).`
				])}
				<p><b>Poderes de distinção:</b> ${itens.map(L).join(", ")}.</p>`, 100),
			pagina("Negócios", `
				<p>Cedo ou tarde, algum jogador quer fazer parte de Valkaria de vez: uma casa, uma família... e um negócio. Quem fica o tempo todo na taverna não é bom aventureiro, mas um herói pode ter um negócio de qualquer tipo, administrado por empregados ou familiares, que só supervisiona entre uma masmorra e outra. O que importa é que seja permanente, lucrativo e fonte de satisfação, complicações e aventuras.</p>
				<p>O jogador cria o nome do estabelecimento e ajuda a decidir onde fica (áreas nobres são quase exclusivas de famílias tradicionais; um espaço perto da estátua é caríssimo, mesmo para uma tenda de pães doces) e cria alguns empregados. O negócio vira parte integral da campanha, como um NPC aliado, um item mágico ou um navio do grupo.</p>
				<h2>Criando um negócio</h2>
				<p>Um mês de trabalho, <b>T$ 1.000</b> e um teste de <b>Ofício ou Nobreza (CD 20)</b>: procurar lugar, audiência com um Lorde Urbano para os alvarás, contratar, comprar mercadorias. Passou: negócio de nível 1. Falhou: tente de novo com mais um mês e T$ 1.000.</p>
				<h2>Níveis</h2>
				<p>De 1 a 7. Níveis 1 e 2: poucos empregados, mercadorias baratas (pequena oficina, tenda de comida). 3 a 5: vários empregados ou mercadorias valiosas (taverna, estábulo, bazar). 6 e 7: proeminentes (empórios abastecidos por caravanas, laboratórios alquímicos de alto poder). Para subir: teste de Ofício ou Nobreza contra <b>CD 20 + 2 × o próximo nível</b>, um mês de trabalho e <b>T$ 1.000 × o próximo nível</b> (do 3 para o 4: CD 28 e T$ 4.000).</p>
				<h2>Ativos</h2>
				<p>Um ativo por nível: empregados, mercadorias e instalações, que dizem que tipo de negócio é. Cada ativo dá um benefício ao dono e ao resto do grupo enquanto tiverem acesso ao negócio e por até um mês depois (longe é não poder frequentá-lo ao menos uma vez por semana; a critério do mestre, perde-se após uma aventura inteira fora). O único \"custo\" é de interpretação: quem se beneficia frequenta o negócio (o clérigo de Azgher no Altar do colega devoto de Tenebra pode ganhar inimigos, até o próprio patrono). São benefícios de estruturas: acumulam com habilidades, perícias, itens, magias, parceiros e ambiente, mas não com outras estruturas (dádivas, domínios, bases).</p>
				<h2>Rendimentos</h2>
				<p>Todo negócio rende <b>T$ 100 × nível</b> por aventura (ou mês). Quem dedica o mês inteiro ao negócio faz um teste de Ofício ou Nobreza: o rendimento do mês é <b>o resultado × 10 × o nível</b>.</p>`, 200),
			pagina("Os Ativos", `${lista(ATIVOS.map((x) => `<b>${x.nome}.</b> ${x.desc}${preTxt(x)}${x.fx ? " <i>(automático na macro)</i>" : ""}`))}`, 210),
			pagina("Distinções", `
				<p>Há aventureiros para quem o trivial não basta, por mais poder que traga: o piedoso e orgulhoso Cavaleiro da Redenção, o misterioso e imprevisível vigilante mascarado. Eles buscam uma <b>distinção</b>, ligada a uma organização, um grupo de estudiosos, uma filosofia ou ao resultado de eventos e escolhas da história do personagem. Conquistá-la é parte da história do aventureiro.</p>
				<h2>Em jogo</h2>
				${lista([
					"<b>Admissão:</b> as tarefas e requisitos para conquistar a distinção, quase sempre ações na história. Nunca acontece no passado do personagem (começar em nível alto não dá distinções) nem fora de cena: só na mesa. O mestre tem a palavra final.",
					"<b>Marca da distinção:</b> uma habilidade recebida automaticamente ao conquistar a distinção.",
					"<b>Poderes da distinção:</b> poderes exclusivos escolhidos como poderes gerais, com seus pré-requisitos. Efeitos que contam \"poderes da distinção\" só contam os daquela distinção. Poderes escolhidos mais de uma vez contam separadamente.",
					"Qualquer um pode cumprir a admissão, mas só personagens de patamar <b>veterano</b> (a partir do 5º nível) obtêm os poderes."
				])}
				<h2>Usando distinções</h2>
				<p>O principal é a história. A disponibilidade depende da campanha: sem Ignis Crae nem outro NPC da Ordem, é difícil virar Cavaleiro da Redenção. Os jogadores devem conversar com o mestre e apresentar os objetivos antes. Uma distinção não é um direito, é uma recompensa por esforço, criatividade e construção da história.</p>
				${lista([
					"<b>Aventuras de admissão:</b> algumas admissões são uma aventura inteira ou parte de uma, para o grupo todo colaborar (o evento que leva alguém a virar vigilante mascarado).",
					"<b>Tempo entre aventuras e testes estendidos:</b> para partes exclusivas do candidato ou muito objetivas (confeccionar o traje das sombras), com moderação. Nunca resolva toda a admissão assim.",
					"<b>História e ideias:</b> nenhuma mecânica acha um mentor sozinha; é preciso visitar lugares, investigar boatos. O jogador é o principal responsável.",
					"<b>Mentores:</b> um NPC de pelo menos patamar veterano, com no mínimo três poderes da distinção (e o que mais a organização exigir), com vontade e paciência para ensinar."
				])}
				<p><i>\"Eu não passei pela admissão, a admissão passou por mim!\"</i></p>
				<h2>E agora?</h2>
				<p>Conquistar uma distinção é um marco: às vezes uma cerimônia formal (a iniciação de um Cavaleiro da Redenção), às vezes só uma realização profunda, às vezes uma transformação (o vigilante ganha uma vida dupla, com uma identidade secreta não revelada nem ao grupo). São escolhas conscientes do personagem, não obrigações.</p>`, 300),
			pagina("Cavaleiro da Redenção", `
				<p>A Ordem da Cavalaria da Redenção é indissociável de seu criador, o golem paladino de Thyatis <b>Ignis Crae</b>. Criado pelo inventor Austerion Victtus, banhado pela paz de Marah ao despertar, logo se viu inquieto; a visão de um pássaro de fogo o levou a Thyatis. Sua missão: corrigir injustiças e oferecer segundas chances a quem passou por situações terríveis ou cometeu atos malignos. Dois de seus primeiros seguidores foram o dragão mendigo <b>Elmer</b> e a ex-purista <b>Lorelei Wulff</b>.</p>
				<p>A sede da Ordem fica nas Colinas Centrais, em Zakharov, mas seus membros surgem em outros lugares, principalmente Valkaria. Não há protocolos formais nem cerimônias rígidas. Ser um Cavaleiro da Redenção é assumir a própria imperfeição, os próprios pecados, talvez os próprios crimes; ostentar o brasão é mostrar ao mundo a marca dos seus erros... e da sua perseverança. Nem todo Cavaleiro monta a cavalo de armadura pesada: alguns oferecem segundas chances pelo combate, outros pela caridade.</p>
				<h2>Admissão</h2>
				<ol>${ADM_CAVALEIRO.map((t) => `<li>${t}</li>`).join("")}</ol>
				<h2>Marca e poderes</h2>
				${lista(["marcaCavaleiro", ...CAVALEIRO].map((r) => L(it(r))))}`, 400),
			pagina("Vigilante Mascarado", `
				<p><i>Criminosos são um bando covarde e supersticioso.</i> Debocham da Guarda, desafiam aventureiros, mas tremem diante de um vingador urbano implacável, cuja identidade e capacidades ninguém conhece. O vigilante mascarado treinou corpo e mente até o limite para caçar vilões nas ruas de Valkaria e domina os becos e telhados, as sombras e as sarjetas. Todo vigilante veste um uniforme (de uma fantasia elaborada que remete a animais ou deuses a um simples manto e uma máscara); o mais importante é o segredo.</p>
				<p>Tem duas vidas: a do nome verdadeiro, com amigos, família e talvez uma profissão, e a do codinome. Muitos são aventureiros com grupos e reputações heroicas! Os motivos variam: métodos que o grupo não aprovaria, proteger entes queridos de represálias, colher informações sobre as irmandades, combater figuras \"respeitáveis\" ligadas ao crime, ou só intimidar. Alguns são altruístas, outros carniceiros tão cruéis quanto os criminosos; alguns pertencem a sociedades secretas, outros agem sozinhos. Aos olhos dos criminosos, é um demônio imortal e incansável. <i>Goblin Herói, Extinção, Curandeiro e Vingador de Val: amigões da vizinhança!</i></p>
				<h2>Admissão</h2>
				<ol>${ADM_VIGILANTE.map((t) => `<li>${t}</li>`).join("")}</ol>
				<p>Com sucesso, o candidato abandona a vida comum: para sempre terá um segredo, até das pessoas mais próximas.</p>
				<h2>Por trás da máscara</h2>
				<p>Só de uma a três pessoas podem conhecer a identidade. Se o vigilante for desmascarado publicamente, se a identidade for divulgada ou muita gente (a critério do mestre) souber, <b>perde todos os bônus da marca e não pode usar os poderes da distinção</b>. Para recuperar, cria uma nova identidade ou \"prova\" que a revelação era falsa: passa pela admissão de novo, pulando a motivação (desmentindo, não precisa de traje nem técnica novos, mas precisa convencer o público). Nenhum vigilante revela a identidade ao grupo (no máximo a um companheiro): seria visto perto deles com frequência, e um vilão esperto vasculharia as mentes dos outros.</p>
				<h2>Marca e poderes</h2>
				${lista(["marcaVigilante", ...VIGILANTE].map((r) => L(it(r))))}
				<p><i>Berthun, da Guarita da Praia, é o vigilante Curandeiro.</i></p>`, 500)
		]
	});

	ui.notifications.info(`Apêndices criados: ${itens.length} poderes de distinção, diário e ${macros.length} macros. Veja a pasta "${NOME_PASTA}".`);
})();
