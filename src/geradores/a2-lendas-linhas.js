/* =====================================================================
 * FIM DOS TEMPOS · ARCO 2 · LENDAS URBANAS E LINHAS NARRATIVAS
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Arco 2 · Lendas e Linhas Narrativas" com:
 *      - Diário do Mestre: as seis Lendas Urbanas (com o subtexto), as duas Linhas Narrativas,
 *        Ghorskander, Torgo, Cronologia e níveis, Simplificando e a Linha do Tempo sem os Heróis.
 *      - Diário "Documentos da Trama": os cinco Pergaminhos dos Avatares do Futuro Eterno e as
 *        cinco entradas do Diário Científico de Ghorskander, ocultos até o Mestre revelar.
 *      - Tabela: Lendas Urbanas de Valkaria (1d6).
 *      - Macros: Lenda Urbana, Documentos da Trama, Linha do Tempo e Ajustar ao Nível.
 *   3. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "a2lendas". O que já foi
 *      revelado e a linha do tempo ficam guardados no usuário (flag fdtLendas) e sobrevivem.
 *
 * Feito a partir do código do sistema (1.6.4, out/2026). Validado no Foundry simulado do
 * módulo giriarpg-fim-dos-tempos; veja o guia a2-lendas-linhas.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "a2lendas";
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
			window: { title: "Lendas e Linhas Narrativas: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para Lendas Urbanas e Linhas Narrativas.</p>
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
	/* 1. Pastas e utilidades                                               */
	/* ------------------------------------------------------------------ */
	const NOME_PASTA = "FdT · Arco 2 · Lendas e Linhas Narrativas";
	const pasta = {};
	for (const type of ["JournalEntry", "RollTable", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#6b3f5e", flags: FLAGS() })).id;
	}
	const p = (...linhas) => linhas.map((l) => `<p>${l}</p>`).join("");
	const L = (d) => (d?.uuid ? `@UUID[${d.uuid}]{${d.name}}` : "");
	const lista = (itens) => `<ul>${itens.map((t) => `<li>${t}</li>`).join("")}</ul>`;
	const pagina = (name, content, sort, extra = {}) => ({ name, type: "text", sort, text: { content, format: 1 }, ...extra });

	/* ------------------------------------------------------------------ */
	/* 2. Dados                                                             */
	/* ------------------------------------------------------------------ */
	// av: a aventura de que a lenda dá uma dica (0 = trama geral de Ghorskander).
	const LENDAS = [
		{ k: "vampiros", nome: "Os Vampiros de Pensamentos", av: 1,
			texto: ["Existem criaturas invisíveis que se alimentam de nossos pensamentos e emoções. Elas podem comer qualquer coisa que passe em nossa mente, mas preferem sentimentos fortes e pensamentos importantes.",
				"Os nobres conhecem essas criaturas, mas não fazem nada contra elas porque são úteis. Quando elas devoram nossas emoções mais fortes, não conseguimos sentir ódio dos nobres. Quando elas sugam nossos pensamentos mais importantes, não conseguimos planejar ou fazer descobertas.",
				"A única coisa que bloqueia os vampiros de pensamentos são metais preciosos — por isso os nobres usam coroas nas cabeças. Se uma dessas criaturas nos nota, o melhor é não se deixar levar por nenhum sentimento muito forte, nem pensar em nada muito complicado, até conseguir a proteção de uma coroa ou um elmo feito de ouro ou outro metal precioso."],
			subtexto: "Alguns valkarianos notam que aventureiros e até vilões estão \"se acomodando\" e deixando de lado as atividades e emoções extremas. É efeito da Escola de Etiqueta e Bom Comportamento de Madame Margebell, que resulta na vizinhança pacata demais de Stremtol." },
		{ k: "serva", nome: "A Serva e o Bardo", av: 4,
			texto: ["É bom ter cuidado com a música que seus filhos, familiares e até servos escutam. Hoje em dia, bardos de todos os tipos ficam famosos em Valkaria e as pessoas se tornam tão obcecadas pela música que esquecem de todo o resto.",
				"Certa vez uma serva de uma família nobre recebeu permissão para ir a uma taverna. Ficou a noite toda ouvindo os bardos. No dia seguinte, estava tão fascinada pela música que continuou dançando e cantando enquanto trabalhava. Seus deveres naquele dia eram preparar o jantar e ninar o filho de seus senhores. Distraída desse jeito, não percebeu quando colocou um faisão cru no berço e a criança no forno...",
				"Infelizmente, até hoje algumas pessoas acham que uma música vale mais que uma vida."],
			subtexto: "As músicas dos bardos que se apresentam na Terceira Opção e em tavernas parecidas estão espalhando fúria e loucura." },
		{ k: "megan", nome: "Megan Miserável", av: 6,
			texto: ["A inveja de algumas pessoas dura até depois da morte.",
				"Megan era uma plebeia que tinha muita inveja das roupas e joias que as nobres usavam. Ela ficou tão consumida pela inveja que não conseguiu mais trabalhar e caiu na pobreza. A última coisa que Megan vendeu foi seu espelho, onde ficava se admirando o dia inteiro, imaginando-se com os vestidos e adornos das nobres. Ela morreu de fome e frio, sozinha, enquanto se olhava no espelho.",
				"Hoje em dia, se você ficar na frente de um espelho e falar \"Megan Miserável\" cinco vezes, o fantasma de Megan aparece e leva você para dentro do espelho. Alguns dizem que isso só funciona se você for nobre, ou se estiver usando joias, ou se estiver dentro de um palácio."],
			subtexto: "Reflete a boataria sobre os nobres raptados e substituídos no Baile da Primavera. A história real não tem nada a ver com espelhos, mas esse elemento representa a sensação de que os jovens nobres são as vítimas, especialmente quando estão arrumados para uma festa." },
		{ k: "praga", nome: "Os Doentes da Praga", av: 0,
			texto: ["Todos sabem que a Praga Coral foi criada por humanos para se livrar dos orcs no antigo reino de Lomatubar. O que poucos sabem é que existe uma forma muito fácil de transmitir a Praga Coral: basta ter um pedaço da \"casca\" que as vítimas da Praga adquirem e transformá-la em pó. Uma mera pitada desse pó em qualquer comida ou bebida é suficiente para contaminar com a Praga Coral.",
				"Existem verdadeiros exércitos de vilões insanos espalhando a Praga Coral, principalmente para crianças, em tendas de petiscos e refrescos nas ruas e nos mercados. Outros loucos deixam agulhas infectadas com a Praga Coral escondidas nas arquibancadas da Arena Imperial, nos bancos de apresentações teatrais e até mesmo nas cadeiras de tavernas.",
				"Se, ao sentar, você for picado por uma dessas agulhas, está contaminado para sempre. Muitas vezes o culpado fica por perto, esperando para ver o rosto de sua vítima."],
			subtexto: "O contexto real não está na praga, mas nos \"exércitos de vilões insanos\" que fazem maldade sem ganhar nada, só por sadismo. Os valkarianos notam que as pessoas à sua volta ficam mais violentas, cruéis e perigosas sem motivo. É efeito do plano de Ghorskander (os Imagodutos)." },
		{ k: "golem", nome: "O Golem Errado", av: 6,
			texto: ["Havia em Valkaria um mago especialista em fabricar golens e encantar objetos. Ele tinha muitos golens e muitos itens mágicos em sua torre. Um dia o mago foi viajar e sua torre foi invadida por um casal de jovens ladrões. Eles sabiam que não podiam levar muita coisa, então examinaram os golens e os itens. Achavam que, se cada um levasse apenas um item, o mago não daria falta.",
				"A moça logo notou um golem enorme e vistoso, segurando um martelo. Tirou o martelo das mãos do golem e decidiu levá-lo. O rapaz viu que o golem também tinha uma espada muito bonita. Quase pôs as mãos nela, mas achou que levar uma arma era arriscado demais. Afastou-se daquele golem e escolheu um singelo anel mágico.",
				"Os dois estavam tão confiantes que, em vez de fugir logo, decidiram dormir na própria torre. De manhã, o rapaz acordou para descobrir sua namorada morta, com a cabeça esmagada. Olhou para cima e viu o tal golem, com o martelo ensanguentado nas mãos. O golem disse: \"SORTE SUA QUE NÃO ESCOLHEU A ESPADA\".",
				"A espada era a Holy Avenger. O \"golem\" era ninguém menos que Mestre Arsenal, que estava lá para roubar os itens do mago."],
			subtexto: "A noção de que pode haver confusão entre um golem e uma pessoa, e de que um assassino perigoso pode estar logo ao lado, reflete as substituições dos jovens nobres no último Baile da Primavera." },
		{ k: "dragoes", nome: "Existem Dragões nos Esgotos de Valkaria", av: 5,
			texto: ["Muitos aventureiros matam dragões, mas ficam com pena de destruir seus ovos. Eles então trazem os ovos de volta à cidade e tentam criar os dragões bebês, achando que eles poderão ser aliados fiéis e que, com bastante amor, não se tornarão malignos.",
				"Mas dragões bebês são responsabilidade demais para aventureiros. Cuidar deles é muito caro e, mais cedo ou mais tarde, eles mostram seu lado maligno. Os aventureiros então jogam os dragõezinhos em bueiros, para que se afoguem ou sejam levados embora. Nos esgotos, eles têm contato com produtos alquímicos e todo tipo de dejetos. Ficam deformados e ainda mais ferozes que o normal.",
				"Qualquer um pode ser pego por um deles, então repasse para todas as pessoas que você conhece."],
			subtexto: "A lenda com o subtexto mais óbvio: os \"dragões do esgoto\" criados por Khenzarr." }
	];
	// Quem conta nunca conhece o protagonista, mas conhece alguém que conhece: dois intermediários.
	const ABERTURAS = [
		"Isso aconteceu com o primo de uma amiga minha, juro por Khalmyr.",
		"Quem me contou foi o cunhado do taverneiro, e ele conhece a família.",
		"Uma colega da guilda ouviu de um guarda que estava lá.",
		"A vizinha da minha tia viu com os próprios olhos, não é boato.",
		"O irmão de um aprendiz da Academia contou para o meu sócio.",
		"Um amigo do meu amigo trabalha no Palácio, então é verdade."
	];
	const DOCS = [
		{ k: "perg1", grupo: "pergaminho", nome: "Pergaminho 1 · Convite",
			texto: "<p>Você está convidado para um jantar e celebração num dos salões privativos da Catedral de Valkaria! Boa comida, boa bebida e novos amigos estarão esperando por você. Após o banquete, teremos um seminário especial com uma oradora convidada e uma oportunidade que você não pode perder!</p><p><i>Não é necessário confirmar sua presença, apareça se quiser uma noite de diversão descontraída. Este convite é pessoal e intransferível. Pedimos que guarde segredo.</i></p>",
			mestre: "A data do convite é de três anos atrás." },
		{ k: "perg2", grupo: "pergaminho", nome: "Pergaminho 2 · Traços de Pessoas Negativas",
			texto: "<p><b>Traços de pessoas negativas:</b></p><ul><li>Não têm iniciativa, esperam receber dos deuses o que desejam.</li><li>Veem o pior em cada situação antes de pensar no melhor.</li><li>Acham que Arton é um mundo de problemas e não de oportunidades.</li><li>Desejam abandonar o mundo em vez de aprimorar o mundo.</li><li>Aceitam sofrer quando poderiam ser felizes.</li></ul><p>Se você notar pessoas negativas a sua volta, cuidado! São fonte de inveja e maus pensamentos. É mais fácil para elas bloquear seu caminho rumo à plenitude do que trilhar elas mesmas esse caminho.</p><p>Se estiver experimentando pensamentos negativos, reporte-se o mais rápido possível a um Avatar de degrau superior.</p>" },
		{ k: "perg3", grupo: "pergaminho", nome: "Pergaminho 3 · Missões dos Avatares",
			texto: "<p><b>Missões dos Avatares do Futuro Eterno</b></p><p><b>1° degrau:</b> comprometer-se com a busca da felicidade.</p><p><b>2° degrau:</b> aceitar que os reinos dos deuses não são a única recompensa possível e libertar-se do Ciclo de Espera Dolorosa.</p><p><b>3° degrau:</b> libertar outras pessoas do CED, aprender a reconhecer seus próprios Mecanismos de Supressão da Felicidade. Renegar Portadores de Paciência Punitiva.</p><p><b>4° degrau:</b> secreto.</p><p><b>5° degrau:</b> secreto.</p>" },
		{ k: "perg4", grupo: "pergaminho", nome: "Pergaminho 4 · Exclusivo do 4° Degrau",
			texto: "<p><i>Exclusivo para Avatares do Futuro Eterno de 4° degrau ou superior. Não divulgar!</i></p><p>O pensamento tem tanta materialidade quanto o corpo e a alma. A mentalidade de resignação passiva típica do CED cria circunstâncias materiais que levam a MSF pessoais e coletivos. É preciso se isolar dos PPP porque eles criam muralhas literais ao redor de si mesmos e de todos os outros, com seus pensamentos. Também é uma ilusão típica dos PPP imaginar que apenas pensamentos considerados bons e amigáveis são forças positivas no mundo. Sem agressividade, ficamos todos presos ao CED.</p><p>Um Avatar do Futuro Eterno de 4° degrau deve estar disposto a pensar de forma combativa contra quaisquer MSF físicos, mentais ou espirituais. É dever de todo Avatar do Futuro Eterno de 4° degrau dedicar ao menos três horas todas as noites a pensamentos de raiva e destruição contra o CED e todos os MSF.</p><p>Caso comece a sentir ódio dos PPP a seu redor, não tenha medo! É apenas seu desejo por felicidade se manifestando.</p>" },
		{ k: "perg5", grupo: "pergaminho", nome: "Pergaminho 5 · Bem-Vindo ao 5° Degrau",
			texto: "<p>Bem-vindo ao 5° degrau dos Avatares do Futuro Eterno! Se você chegou até aqui, enfrentou um caminho cheio de dificuldades, mas sempre impostas pelos outros. Você está prestes a se libertar do CED físico e rumar ao paraíso artoniano que sempre soube que existia em algum lugar!</p><p>Está na hora de conhecer seus guias nesta jornada rumo à felicidade.</p><p><b>Lakshrimi</b>, Desbravadora de Grilhões Vagarosos<br><b>Ghorskander</b>, Engenheiro de Mentalidade Positiva<br><b>Dr. Arthemus Vesper</b>, nosso mestre</p>" },
		{ k: "diario1", grupo: "diario", nome: "Diário de Ghorskander · Entrada 1",
			texto: "<p>A ideia de que corpo e alma são fundamentalmente diferentes já é tida como superstição tacanha por todos os discípulos do Dr. Vesper. A simples acessibilidade dos reinos dos deuses atesta o fato de que, no máximo, corpo e alma são reflexos intercambiáveis. Ou, segundo minhas próprias especulações, partes de um todo que, por falta de um termo melhor, posso chamar de indivíduo. Não fosse assim, o Doutor não poderia ter desenvolvido as técnicas de cirurgia em almas. Antevejo um dia, num futuro próximo, em que pedaços da alma possam ser enxertados no corpo e vice-versa.</p><p>Mas há mais uma faceta nesse conjunto. Nem corpo nem alma descrevem com precisão o que os indivíduos pensam e sentem. As memórias no Cofre Encarnatório não são corpos ou almas, mas inegavelmente estão ali. E, como toda a tripulação pode atestar, inegavelmente são indivíduos, ou pelo menos parte deles. De que forma esses pensamentos podem se manifestar no mundo material? De que forma podem modificá-lo?</p>" },
		{ k: "diario2", grupo: "diario", nome: "Diário de Ghorskander · Entrada 2",
			texto: "<p>O primeiro passo é sistematizar as relações entre as três faces do que por enquanto chamo de indivíduo. Embora tudo isto seja de conhecimento geral, não fui capaz de encontrar nenhum tomo que explore o assunto satisfatoriamente.</p><p>O corpo interfere na alma e na mente de maneira óbvia, simples e primitiva. Alguém que tenha sido ferido por um cão terá medo de cães. Sua mente terá sido alterada. Se, após a morte, acabar no Reino de Allihanna, estará num inferno. Sua alma terá sido alterada.</p><p>A alma interfere no corpo e na mente de modos também inegáveis. Se a fé de um devoto é suficiente para realizar milagres e curar seus ferimentos, o corpo terá sido alterado pela alma. Se esta mesma pessoa, após manifestar milagres, decidir tomar um caminho heroico ou vilanesco, a mente terá sido afetada pela alma.</p><p>A mente esconde as relações mais sutis e instigantes. Sabe-se que a fé dos artonianos pode fazer divindades ascenderem ou caírem. Isso talvez não tenha a ver com a alma do indivíduo, mas é pensamento e emoção alterando a esfera divina. Será que esta mesma fé, estes mesmos pensamentos, podem fazer algo no mundo material prosperar ou decair?</p>" },
		{ k: "diario3", grupo: "diario", nome: "Diário de Ghorskander · Entrada 3",
			texto: "<p>Meu erro estava em procurar as relações entre corpo, alma e mente. O que eu devo fazer é criá-las. O que os mortais veem como relações transcendentais são, na verdade, triviais. Crença fazendo divindades ascenderem, emoções afetando almas nos reinos dos deuses... Estamos muito acima de deuses! Lidamos com a Criação! A magia arcana pode ser vista como um meio de manifestar a mente no mundo material, mas passa por um intermediário — Wynna. Meu desejo é interferência direta!</p><p>Foi com essa mentalidade que obtive meu primeiro sucesso. Uma cobaia foi exposta a repetidos relatos da história do Paladino de Arton, na presença de uma máquina experimental de captação de pensamentos. Após 48 horas ouvindo a narrativa, foi submetida a uma cirurgia física durante a qual extraí do interior de seu crânio uma cópia de um Rubi da Virtude. O objeto era tênue e durou poucos instantes, mas senti-o em minhas mãos antes que se desfizesse.</p><p>Os próximos passos são aumentar a longevidade da manifestação material, preservar a vida da cobaia e por fim eliminar a necessidade de cirurgia.</p>" },
		{ k: "diario4", grupo: "diario", nome: "Diário de Ghorskander · Entrada 4",
			texto: "<p>Vários meses de experimentos com a manifestação de construtos da mente. Vários meses de fracassos. Cobaias de diferentes raças e faixas etárias demonstraram basicamente o mesmo potencial. Todos os objetos são transitórios, o mais longevo tendo sido um prato de cerâmica que se manifestou dentro do pulmão esquerdo de uma anã e durou cerca de quatro horas.</p><p>Curiosamente, foi a impaciência que me levou para mais perto do sucesso. Farto de fracassos com indivíduos, reuni vinte cobaias na mesma sala e as obriguei a repetir a palavra \"arame\" por três dias, impulsionados por uma máquina simples que causava dor a todos caso um dos participantes se calasse. Para minha surpresa, no fim do terceiro dia um pedaço de arame se manifestou no meio da sala.</p><p>Minhas impressões: a natureza do objeto foi afetada pelo estado emocional das cobaias. O arame surgiu coberto de ferrugem e com extremidades afiadas. O objeto continua sólido duas semanas após seu surgimento. A morte das cobaias que lhe deram origem não parece afetar sua materialidade.</p>" },
		{ k: "diario5", grupo: "diario", nome: "Diário de Ghorskander · Entrada 5",
			texto: "<p>A tendência natural dos artonianos é manifestar o potencial da mente de forma coletiva, não individual. Imagens e emoções experimentadas por grandes grupos são mais intensas e se prestam mais à materialização do que seria possível com indivíduos.</p><p>Perceber esse potencial também revelou a principal limitação de meus experimentos até agora. Eu dependia da interpretação e visualização de artonianos médios, presos por baixa capacidade cognitiva e imaginação tolhida por valores morais mundanos. Não preciso, na verdade, da mente de minhas cobaias. Preciso de sua capacidade de pensar e sentir. Um rio não quer mover o moinho, ele simplesmente o move. Potencial puro, que será canalizado e moldado por um intelecto superior.</p><p>A instalação de Imagodutos em diferentes pontos da cidade está avançada. Os captadores funcionam perfeitamente e os projetores respondem bem a meus direcionamentos. Venho mantendo uma rotina de meditação diária para treinar minha mente. Quando o momento chegar, as emoções dos valkarianos serão moldadas de acordo com meu ideal.</p>" }
	];
	// Linha de tempo sem os heróis. antes: já aconteceu quando o grupo chega. av: a parte do arco ligada ao acontecimento.
	const LINHA = [
		{ t: "Chegada de Ghorskander e Lakshrimi à cidade.", antes: true },
		{ t: "Ghorskander transfere a consciência de Lakshrimi para um golem, e ela se esconde num espaço entre as dimensões.", antes: true, av: "Aventura 6" },
		{ t: "Os Avatares do Futuro Eterno começam a recrutar nobres.", antes: true },
		{ t: "Primeiros assassinatos no Baile da Primavera; a Duquesa Alfraye cancela os próximos bailes.", antes: true, av: "Aventura 6" },
		{ t: "Ghorskander ensina Khenzarr.", antes: true, av: "Aventura 5" },
		{ t: "Algumas famílias nobres deixam Valkaria.", antes: true },
		{ t: "Madame Margebell aprende técnicas de pintura de doutrinação.", antes: true, av: "Aventura 1" },
		{ t: "Ghorskander opera Tryphne e lhe ensina a operar outros prisioneiros.", antes: true, av: "Aventura 3" },
		{ t: "Aldanna é \"educada\" por Madame Margebell e deixa seu grupo de aventureiros.", antes: true, av: "Aventura 1" },
		{ t: "Os dragões do esgoto começam a fazer vítimas na Baixa Vila de Lena.", antes: true, av: "Aventura 5" },
		{ t: "Ghorskander instala Imagodutos em vários pontos de Valkaria.", antes: true, av: "Aventuras 4 e 5" },
		{ t: "Calliko é internado na Casa de Repouso Millicent.", antes: true, av: "Aventura 4" },
		{ t: "Chegada dos personagens jogadores a Valkaria.", antes: true, av: "Aventura 0" },
		{ t: "A violência em Valkaria aumenta cada vez mais.", av: "Lei & Ordem" },
		{ t: "Aventureiros começam a se ver incapazes de usar seus poderes e capacidades especiais.", av: "Aventura 1" },
		{ t: "As mortes na Baixa Vila de Lena aumentam.", av: "Aventura 5" },
		{ t: "Vladmir Mors é preso pelos crimes e vai parar na Rocha Cinzenta.", av: "Aventura 5" },
		{ t: "A Rocha Cinzenta é quase toda dominada pela Companhia dos Irmãos e vira uma fortaleza onde os criminosos recebem implantes de cristal rosado para manter poderes e habilidades.", av: "Aventura 3" },
		{ t: "Brigas gigantescas e cada vez mais violentas forçam a Terceira Opção a fechar as portas.", av: "Aventura 4" },
		{ t: "As partituras de Calliko continuam circulando, agora pela cidade inteira.", av: "Aventura 4" },
		{ t: "Paollus executa um membro da Casa Blasanov, uma irmandade rival, e provoca uma guerra de irmandades. As mortes de criminosos e inocentes chegam às centenas.", av: "Mini-Aventura 2 (Irmandade Máxima); com a Aventura 1 resolvida, há heróis para evitar o massacre" },
		{ t: "A Xerife Mathilda Nolt tenta intervir na guerra criminosa.", av: "Mini-Aventura 2" },
		{ t: "Uma retaliação da Companhia dos Irmãos destrói a Guarita da Praia e mata a maior parte dos detetives. A reforma da Guarda parece um fracasso total.", av: "Mini-Aventura 2; a Aventura 1 resolvida evita a destruição da Guarita" },
		{ t: "Aventureiros tentam tomar a lei nas próprias mãos, mas se veem indefesos frente a criminosos e até a turbas de plebeus furiosos.", av: "Aventura 1" },
		{ t: "A nobreza exige uma intervenção de Shivara. O Exército do Reinado toma as ruas, e logo começam excessos e explosões de violência dos \"pacificadores\"." },
		{ t: "Pressionada, a Academia Arcana envia representantes para defender a população, mas eles não conseguem usar magia em Valkaria. Vários morrem.", av: "Aventura 1" },
		{ t: "Valkaria é tomada por uma guerra urbana de todos contra todos: irmandades, Exército, aventureiros, cidadãos e guardas. Alguns heróis famosos tentam intervir e são mortos." },
		{ t: "O mecano-lagarto-terror se materializa na capital e pisoteia as ruas. Ninguém é capaz de detê-lo. Shivara intervém pessoalmente, é derrotada e quase morre.", av: "Aventura 7" },
		{ t: "Depois de espalhar destruição, o mecano-lagarto-terror deixa Valkaria e desaparece nas planícies de Deheon. A reconstrução será longa e custosa; talvez a cidade nunca mais seja a mesma.", av: "Aventura 7" },
		{ t: "A maior parte da nobreza perde a confiança em Shivara e no Reinado, abandona a capital e se junta ao Dr. Vesper, que, com recursos praticamente ilimitados e o apoio de muitas das pessoas mais influentes do mundo, põe seu plano em prática com tranquilidade.", av: "Aventuras 6 e 7" }
	];
	const NIVEIS = [
		["Aventura 0", "não concede nível (pouco mais que um combate e alguma interpretação)"],
		["Aventuras 1 e 2", "nível 7"],
		["Aventuras 3 e 4", "nível 8"],
		["Aventura 5", "nível 9"],
		["Aventura 6", "nível 10"],
		["Labirinto Liberto", "sempre igual, presume 11º nível (há desafios mortais e outros fáceis)"],
		["Aventura 7", "não diminua a dificuldade: sem chance, o grupo tenta sair vivo e salvar NPCs"]
	];

	/* ------------------------------------------------------------------ */
	/* 3. Tabela                                                            */
	/* ------------------------------------------------------------------ */
	const tabLendas = await RollTable.create({
		name: "Lendas Urbanas de Valkaria", img: "icons/svg/book.svg", folder: pasta.RollTable, flags: FLAGS("lendas"), formula: "1d6", replacement: true, displayRoll: true,
		description: "Contadas por NPCs, lidas em diários e anotações ou publicadas na Gazeta do Reinado. Quem conta acredita nela e conhece alguém que conhece o protagonista. Cada lenda dá uma dica de uma aventura do arco. A macro Lenda Urbana conta com a abertura e manda o subtexto ao Mestre.",
		results: LENDAS.map((l, i) => ({ type: "text", range: [i + 1, i + 1], weight: 1, name: l.nome, description: `${l.texto[0]} <i>Subtexto:</i> ${l.subtexto}` }))
	});

	/* ------------------------------------------------------------------ */
	/* 4. Diários                                                           */
	/* ------------------------------------------------------------------ */
	const documentos = await JournalEntry.create({
		name: "Arco 2 · Documentos da Trama",
		folder: pasta.JournalEntry,
		flags: FLAGS("documentos"),
		ownership: { default: 0 },
		pages: DOCS.map((d, i) => pagina(d.nome, d.texto, 100 + i * 10, { ownership: { default: 0 }, flags: { world: { fdt: TAG, fdtRole: d.k } } }))
	});
	const paginaDoc = (k) => documentos.pages.find((pg) => pg.getFlag("world", "fdtRole") === k);

	const diarioDe = (prefixo) => game.journal.find((j) => j.getFlag("world", "fdt") !== TAG && j.name.startsWith(prefixo));
	const AV = Object.fromEntries([0, 1, 2, 3, 4, 5, 6, 7].map((n) => [n, diarioDe(`Arco 2 · Aventura ${n} `)]));
	const avLink = (n) => (n ? (AV[n] ? L(AV[n]) : `Aventura ${n}`) : "a trama geral de Ghorskander");
	const ghorskander = game.actors.find((a) => a.getFlag("world", "fdt") !== TAG && a.name === "Ghorskander");
	const torgo = game.actors.find((a) => a.getFlag("world", "fdt") !== TAG && a.name.startsWith("Torgo (Arco 2"));
	const lakshrimi = game.actors.find((a) => a.getFlag("world", "fdt") !== TAG && a.name.startsWith("Lakshrimi"));
	const labirinto = diarioDe("Arco 2 · Espaço de Masmorra") ?? game.journal.find((j) => j.getFlag("world", "fdt") !== TAG && j.name.includes("Labirinto Liberto"));
	const leiOrdem = game.actors.find((a) => a.getFlag("world", "fdtRole") === "leiordem");
	const ficha = (a, txt) => (a ? L(a) : `<b>${txt}</b>`);

	/* ------------------------------------------------------------------ */
	/* 5. Macros                                                            */
	/* ------------------------------------------------------------------ */

	/** Conta uma lenda urbana: o texto vai para todos, o subtexto só para o Mestre. */
	async function macroLenda(D) {
		const ESTADO = "fdtLendas";
		const est = foundry.utils.deepClone(game.user.getFlag("world", ESTADO) ?? {});
		est.contadas ??= [];
		const op = D.lendas.map((l, i) => `<option value="${i + 1}">${i + 1}. ${l.nome}${est.contadas.includes(l.k) ? " (já contada)" : ""}</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Valkaria · Lenda Urbana" },
			position: { width: 500 },
			content: `
				<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="rolar">Rolar 1d6</option>
					<option value="escolher">Contar a lenda escolhida</option>
					<option value="colecao">Mostrar as lendas que o grupo já ouviu</option>
					<option value="zerar">Zerar a coleção</option></select></div>
				<div class="form-group"><label>Lenda</label><select name="n">${op}</select></div>
				<div class="form-group"><label>Quem conta</label><input type="text" name="quem" placeholder="o token selecionado, ou um nome"></div>
				<div class="form-group"><label>Como chega ao grupo</label><select name="meio">
					<option value="fala">Contada por alguém</option>
					<option value="escrita">Lida num diário ou anotação</option>
					<option value="gazeta">Publicada na Gazeta do Reinado</option></select></div>`,
			ok: { label: "Contar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const whisper = ChatMessage.getWhisperRecipients("GM");
		if (res.acao === "zerar") {
			await game.user.setFlag("world", ESTADO, { ...est, contadas: [] });
			return ChatMessage.create({ whisper, content: "<p>Lendas urbanas: coleção zerada.</p>" });
		}
		if (res.acao === "colecao") {
			const ja = D.lendas.filter((l) => est.contadas.includes(l.k));
			return ChatMessage.create({ content: `<h3>Lendas urbanas ouvidas</h3>${ja.length ? `<ul>${ja.map((l) => `<li>${l.nome}</li>`).join("")}</ul>` : "<p>Nenhuma ainda.</p>"}<p style="font-size:0.85em">${ja.length} de ${D.lendas.length}.</p>` });
		}
		const rolls = [];
		let n = Number(res.n) || 1;
		if (res.acao === "rolar") {
			const r = await new Roll("1d6").evaluate();
			rolls.push(r);
			n = r.total;
		}
		const l = D.lendas[n - 1];
		const quem = String(res.quem ?? "").trim() || canvas.tokens?.controlled.find((t) => t.actor?.type !== "character")?.name || "";
		let abre = "";
		if (res.meio === "fala") {
			const a = D.aberturas[Math.floor(Math.random() * D.aberturas.length)];
			abre = `<p><i>${quem ? `${quem}, baixando a voz:` : "Alguém baixa a voz:"} "${a}"</i></p>`;
		} else if (res.meio === "escrita") abre = "<p><i>Anotado às pressas, à margem de um diário:</i></p>";
		else abre = "<p><i>Gazeta do Reinado, página de curiosidades:</i></p>";
		await ChatMessage.create({ rolls, content: `<h3>${l.nome}</h3>${abre}${l.texto.map((t) => `<p>${t}</p>`).join("")}` });
		await ChatMessage.create({ whisper, content: `<p><b>Subtexto de ${l.nome}:</b> ${l.subtexto}</p><p style="font-size:0.85em">Dica de: ${l.dica}.</p>` });
		if (!est.contadas.includes(l.k)) est.contadas.push(l.k);
		await game.user.setFlag("world", ESTADO, est);
	}

	/** Revela aos jogadores os pergaminhos dos Avatares e o diário de Ghorskander. */
	async function macroDocumentos(D) {
		const TAG = "a2lendas";
		const diario = game.journal.find((j) => j.getFlag("world", "fdt") === TAG && j.getFlag("world", "fdtRole") === "documentos");
		if (!diario) return ui.notifications.warn("O diário Documentos da Trama não está neste mundo.");
		const pg = (k) => diario.pages.find((x) => x.getFlag("world", "fdtRole") === k);
		const visivel = (x) => (x?.ownership?.default ?? 0) >= 2;
		const op = (grupo) => D.docs.filter((d) => d.grupo === grupo).map((d) => `<option value="${d.k}">${d.nome}${visivel(pg(d.k)) ? " (revelado)" : ""}</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Valkaria · Documentos da Trama" },
			position: { width: 520 },
			content: `
				<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="revelar">Revelar o documento aos jogadores</option>
					<option value="ocultar">Esconder o documento de novo</option>
					<option value="estado">Ver o que já foi revelado</option>
					<option value="investigar">O grupo investiga os Avatares do Futuro Eterno</option></select></div>
				<div class="form-group"><label>Documento</label><select name="k">
					<optgroup label="Pergaminhos dos Avatares do Futuro Eterno">${op("pergaminho")}</optgroup>
					<optgroup label="Diário Científico de Ghorskander">${op("diario")}</optgroup></select></div>
				<p style="font-size:0.85em">Pergaminhos: em qualquer investigação em Valkaria. Diário: nos lugares ligados ao plano de Ghorskander, como o laboratório de Khenzarr e a Casa de Repouso Millicent.</p>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const whisper = ChatMessage.getWhisperRecipients("GM");
		if (res.acao === "estado") {
			const linhas = D.docs.map((d) => `<li>${visivel(pg(d.k)) ? "✔️" : "·"} ${d.nome}</li>`);
			return ChatMessage.create({ whisper, content: `<h3>Documentos da Trama</h3><ul>${linhas.join("")}</ul>` });
		}
		if (res.acao === "investigar") {
			const rolls = [];
			const linhas = [];
			for (const t of canvas.tokens?.controlled ?? []) {
				const a = t.actor;
				if (!a) continue;
				const r = await new Roll(`1d20 + ${Number(a.system.pericias?.inve?.value) || 0}`).evaluate();
				rolls.push(r);
				linhas.push(`<li>${a.name} · Investigação <b>${r.total}</b></li>`);
			}
			return ChatMessage.create({ whisper, rolls, content: `<h3>Investigando os Avatares do Futuro Eterno</h3>${linhas.length ? `<ul>${linhas.join("")}</ul>` : ""}<p>${D.investigar}</p>` });
		}
		const d = D.docs.find((x) => x.k === res.k);
		const x = pg(res.k);
		if (!d || !x) return;
		if (res.acao === "ocultar") {
			await x.update({ "ownership.default": 0 });
			return ChatMessage.create({ whisper, content: `<p>${d.nome} escondido dos jogadores.</p>` });
		}
		if (!diario.ownership?.default || diario.ownership.default < 1) await diario.update({ "ownership.default": 1 });
		await x.update({ "ownership.default": 2 });
		await ChatMessage.create({ content: `<h3>${d.nome}</h3>${d.texto}<p style="font-size:0.85em">No diário: @UUID[${x.uuid}]{${x.name}}</p>` });
		if (d.mestre) await ChatMessage.create({ whisper, content: `<p><b>${d.nome}:</b> ${d.mestre}</p>` });
	}

	/** A linha do tempo de Valkaria sem os heróis: marque o que aconteceu e veja o que vem. */
	async function macroLinha(D) {
		const ESTADO = "fdtLendas";
		const est = foundry.utils.deepClone(game.user.getFlag("world", ESTADO) ?? {});
		est.linha ??= D.linha.map((e) => !!e.antes);
		est.evitados ??= [];
		const prox = est.linha.findIndex((f, i) => !f && !est.evitados.includes(i));
		const op = D.linha.map((e, i) => `<option value="${i}"${i === prox ? " selected" : ""}>${i + 1}. ${est.linha[i] ? "✔️ " : est.evitados.includes(i) ? "🚫 " : ""}${e.t.slice(0, 70)}${e.t.length > 70 ? "..." : ""}</option>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Valkaria · Linha do Tempo" },
			position: { width: 600 },
			content: `
				<p>Valkaria sem a intervenção dos heróis. Não há momento fixo: descreva o estado da cidade de acordo com o que o grupo não resolveu (na mesa original, o arco durou 6 meses).</p>
				<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="acontece">O acontecimento escolhido acontece</option>
					<option value="evitado">O grupo evitou o acontecimento escolhido</option>
					<option value="desfazer">Desmarcar o acontecimento escolhido</option>
					<option value="ver">Ver a linha do tempo</option>
					<option value="zerar">Recomeçar (só o que já aconteceu antes da chegada)</option></select></div>
				<div class="form-group"><label>Acontecimento</label><select name="i">${op}</select></div>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const whisper = ChatMessage.getWhisperRecipients("GM");
		const i = Number(res.i) || 0;
		const e = D.linha[i];
		let html = "";
		if (res.acao === "zerar") {
			est.linha = D.linha.map((x) => !!x.antes);
			est.evitados = [];
			html = "<p>Linha do tempo recomeçada.</p>";
		} else if (res.acao === "acontece" && e) {
			est.linha[i] = true;
			est.evitados = est.evitados.filter((x) => x !== i);
			await ChatMessage.create({ content: `<h3>Valkaria</h3><p>${e.t}</p>` });
			html = `<p>Marcado como acontecido: ${i + 1}.${e.av ? ` Ligado a: ${e.av}.` : ""}</p>`;
		} else if (res.acao === "evitado" && e) {
			est.linha[i] = false;
			if (!est.evitados.includes(i)) est.evitados.push(i);
			html = `<p>Evitado pelo grupo: ${e.t}</p>`;
		} else if (res.acao === "desfazer" && e) {
			est.linha[i] = false;
			est.evitados = est.evitados.filter((x) => x !== i);
			html = `<p>Desmarcado: ${i + 1}.</p>`;
		}
		const linhas = D.linha.map((x, j) => `<li>${est.linha[j] ? "✔️" : est.evitados.includes(j) ? "🚫" : "·"} ${x.t}${x.av ? ` <i>(${x.av})</i>` : ""}</li>`);
		const seguinte = D.linha.findIndex((x, j) => !est.linha[j] && !est.evitados.includes(j));
		html += res.acao === "ver" || res.acao === "zerar"
			? `<h3>Linha do tempo sem os heróis</h3><ol style="padding-left:1.2em;list-style:none">${linhas.join("")}</ol>`
			: seguinte >= 0 ? `<p><b>Próximo:</b> ${D.linha[seguinte].t}</p>` : "<p>Não há mais acontecimentos.</p>";
		await game.user.setFlag("world", ESTADO, est);
		await ChatMessage.create({ whisper, content: html });
	}

	/** Ajusta um oponente ao nível do grupo: ±1 em testes e dano e ±10 PV por nível de diferença. */
	async function macroAjustar(D) {
		const TAG = "a2lendas";
		const alvos = (canvas.tokens?.controlled ?? []).map((t) => t.actor).filter((a) => a?.type === "npc");
		const pjs = game.actors.filter((a) => a.type === "character" && a.hasPlayerOwner);
		const media = pjs.length ? Math.round(pjs.reduce((s, a) => s + (Number(a.system.attributes?.nivel?.value) || 0), 0) / pjs.length) : 7;
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Arco 2 · Ajustar ao Nível" },
			position: { width: 500 },
			content: `
				<p>Selecione os tokens dos NPCs. ${alvos.length} NPC(s) selecionado(s).</p>
				<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="solo">Oponente único: ajustar testes, dano e PV</option>
					<option value="grupo">Vários oponentes: sugerir a quantidade</option>
					<option value="remover">Tirar o ajuste dos selecionados</option>
					<option value="niveis">Mostrar os níveis presumidos das aventuras</option></select></div>
				<div class="form-group"><label>Nível do grupo</label><input type="number" name="nivel" value="${media}" min="1" max="20"></div>
				<div class="form-group"><label>Nível presumido da aventura</label><input type="number" name="presumido" value="7" min="1" max="20"></div>
				<div class="form-group"><label>Quantidade de criaturas no livro</label><input type="number" name="qtd" value="4" min="1"></div>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const whisper = ChatMessage.getWhisperRecipients("GM");
		const dif = (Number(res.nivel) || 0) - (Number(res.presumido) || 0);
		const sinal = (v) => (v > 0 ? `+${v}` : `${v}`);
		if (res.acao === "niveis") {
			return ChatMessage.create({ whisper, content: `<h3>Níveis presumidos</h3><ul>${D.niveis.map(([a, n]) => `<li><b>${a}:</b> ${n}</li>`).join("")}</ul><p>${D.ordem}</p>` });
		}
		if (res.acao === "grupo") {
			const qtd = Math.max(1, Number(res.qtd) || 1);
			const nova = Math.max(1, Math.round(qtd * Math.pow(2, dif / 2)));
			return ChatMessage.create({ whisper, content: `<h3>Ajustar ao nível: vários oponentes</h3><p>Diferença de <b>${sinal(dif)}</b> nível(is). Aumente ou diminua a quantidade de criaturas para que o ND do encontro seja igual ao nível do grupo.</p><p>Sugestão: <b>${qtd} → ${nova}</b> criatura(s) (cada vez que o número dobra, o ND sobe cerca de 2).</p><p style="font-size:0.85em">${D.julgamento}</p>` });
		}
		if (!alvos.length) return ui.notifications.warn("Selecione os tokens dos NPCs.");
		// O PV máximo de NPC é um valor fixo da ficha: o ajuste muda o valor e guarda a diferença para desfazer.
		for (const a of alvos) {
			const velhos = a.effects.filter((e) => e.getFlag("world", "fdt") === TAG && e.getFlag("world", "fdtAjuste")).map((e) => e.id);
			if (velhos.length) await a.deleteEmbeddedDocuments("ActiveEffect", velhos);
			const antes = Number(a.getFlag("world", "fdtAjustePV")) || 0;
			if (antes) {
				const max = (Number(a.system.attributes?.pv?.max) || 0) - antes;
				await a.update({ "system.attributes.pv.max": max, "system.attributes.pv.value": Math.min(Number(a.system.attributes?.pv?.value) || 0, max), "flags.world.-=fdtAjustePV": null });
			}
		}
		if (res.acao === "remover") {
			return ChatMessage.create({ whisper, content: `<p>Ajuste de nível removido de ${alvos.map((a) => a.name).join(", ")}.</p>` });
		}
		if (!dif) return ChatMessage.create({ whisper, content: "<p>O grupo está no nível presumido: nada a ajustar.</p>" });
		const changes = [
			["system.modificadores.ataque.geral", dif],
			["system.modificadores.dano.geral", dif],
			["system.modificadores.pericias.geral", dif]
		];
		for (const a of alvos) {
			await a.createEmbeddedDocuments("ActiveEffect", [{
				name: `Ajuste ao nível do grupo (${sinal(dif)})`, img: "icons/svg/upgrade.svg", type: "base",
				description: `${sinal(dif)} em testes e rolagens de dano, ${sinal(dif * 10)} PV.`,
				flags: { world: { fdt: TAG, fdtAjuste: true } },
				system: { changes: changes.map(([key, value]) => ({ key, value: String(value), type: "add", phase: "initial", priority: null })) }
			}]);
			const max = Math.max(1, (Number(a.system.attributes?.pv?.max) || 0) + dif * 10);
			await a.update({ "system.attributes.pv.max": max, "system.attributes.pv.value": max, "flags.world.fdtAjustePV": dif * 10 });
		}
		await ChatMessage.create({ whisper, content: `<h3>Ajustar ao nível: oponente único</h3><p>${alvos.map((a) => a.name).join(", ")}: <b>${sinal(dif)}</b> em ataques, perícias e rolagens de dano, <b>${sinal(dif * 10)} PV</b> (PV cheios).</p><p style="font-size:0.85em">${D.julgamento}</p>` });
	}

	const macro = (name, img, fn, dados = null) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Arco 2 · Lendas Urbanas e Linhas Narrativas · gerado por a2-lendas-linhas.js\n${dados ? `const DADOS = ${JSON.stringify(dados)};\n` : ""}(${fn.toString()})(${dados ? "DADOS" : ""});`
	});
	const DICA = (n) => (n ? `Aventura ${n}` : "a trama geral de Ghorskander (os Imagodutos)");
	const INVESTIGAR = "Peça testes de Investigação (o livro não dá CD) ou deixe o grupo conversar com NPCs que tenham contato com a nobreza: Wynstar, Drelene, os Goblins da Gazeta do Reinado, o Avatar da Cidade, os moradores de Stremtol e outros. Então revele que <b>as famílias que tiveram contato com os Avatares deixaram Valkaria</b>. Use famílias deste arco (principalmente da Aventura 6) ou crie as suas.";
	const JULGAMENTO = "Esses ajustes não são totalmente precisos e dependem do seu julgamento. Leve em conta a experiência dos jogadores e a composição do grupo. O Labirinto Liberto não se ajusta, e a Aventura 7 não deve ficar mais fácil.";
	const ORDEM = "Ordem presumida, sem ajustes: escolha entre as Aventuras 1 e 2 no nível 7, entre a 3 e a 4 no nível 8, depois a 5 e a 6. Com os níveis 7 a 13 do arco, o grupo deve terminar no 13º nível (o Arco 3 começa nele).";
	const macros = await Macro.createDocuments([
		macro("Valkaria · Lenda Urbana", "icons/svg/book.svg", macroLenda, { lendas: LENDAS.map((l) => ({ k: l.k, nome: l.nome, texto: l.texto, subtexto: l.subtexto, dica: DICA(l.av) })), aberturas: ABERTURAS }),
		macro("Valkaria · Documentos da Trama", "icons/svg/eye.svg", macroDocumentos, { docs: DOCS.map(({ k, grupo, nome, texto, mestre }) => ({ k, grupo, nome, texto, mestre })), investigar: INVESTIGAR }),
		macro("Valkaria · Linha do Tempo", "icons/svg/clockwork.svg", macroLinha, { linha: LINHA }),
		macro("Arco 2 · Ajustar ao Nível", "icons/svg/upgrade.svg", macroAjustar, { niveis: NIVEIS, ordem: ORDEM, julgamento: JULGAMENTO })
	]);
	const linkMacro = (trecho) => {
		const m = macros.find((x) => x.name.includes(trecho));
		return m ? `@UUID[${m.uuid}]{${m.name}}` : trecho;
	};

	await JournalEntry.create({
		name: "Arco 2 · Lendas Urbanas e Linhas Narrativas",
		folder: pasta.JournalEntry,
		flags: FLAGS("diarioLendas"),
		pages: [
			pagina("Guia do Mestre", `
				<p>Os capítulos Lendas Urbanas (p. 62) e Linhas Narrativas da Campanha (pp. 65–73) do livro do Arco 2.</p>
				${lista([
					`${linkMacro("Lenda Urbana")}: rola ou escolhe uma lenda, conta com uma abertura de \"amigo do amigo\" (ou como anotação, ou na Gazeta) e manda o subtexto ao Mestre. Guarda a coleção que o grupo já ouviu. Tabela: ${L(tabLendas)}.`,
					`${linkMacro("Documentos")}: revela aos jogadores os pergaminhos dos Avatares do Futuro Eterno e as entradas do diário de Ghorskander, que ficam ocultos em ${L(documentos)} até lá.`,
					`${linkMacro("Linha do Tempo")}: o que acontece em Valkaria sem os heróis. Marque o que aconteceu ou foi evitado e veja o próximo passo.`,
					`${linkMacro("Ajustar")}: aplica o ajuste de nível do livro num oponente único (±1 em testes e dano, ±10 PV por nível) ou sugere a quantidade de criaturas.`
				])}
				<p>Fichas: ${ficha(ghorskander, "Ghorskander")} e ${ficha(torgo, "Torgo")} (Aventura 7). Relógio do arco: ${ficha(leiOrdem, "Lei &amp; Ordem")}.</p>`, 100),
			pagina("Lendas Urbanas", `
				<p>Em Arton é difícil separar lenda de história, mas cada região cria tradições orais que expressam medos e preocupações locais. Em Valkaria, elas são <b>lendas urbanas</b>: anedotas sobre fatos fictícios que expressam sentimentos e contextos reais. Têm fundo de verdade, mas são factualmente falsas. São lições de moral ou alertas (nem sempre corretos). O perigo de que avisam em geral não é real, mas o medo é, e sempre há outro perigo por trás. Às vezes servem para difamar um grupo: os jovens, povos não humanos pouco conhecidos, sábios de estudos exóticos, quem age diferente.</p>
				<p>Use como quiser: contadas por NPCs, lidas em diários e anotações, até publicadas na Gazeta do Reinado. O segredo do \"folclore moderno\" é que quem conta acredita nela e nunca conhece o protagonista, só alguém que conhece. Podem ser só interpretação, ou ser colecionadas por grupos que gostam de esgotar o cenário. <b>Cada lenda dá uma dica de uma aventura do arco</b> ou do panorama de Valkaria.</p>
				<h2>A verdade chocante: como contar</h2>
				${lista([
					"<b>Dois intermediários.</b> Quem ouviu de um \"amigo de um amigo\" não repassa como \"amigo de um amigo de um amigo\": sempre ficam só dois.",
					"<b>Uma frase forte no começo ou no fim</b>, de indignação ou pavor (\"Infelizmente, até hoje algumas pessoas acham que uma música vale mais que uma vida\"). Questionar a lenda parece questionar o sentimento, e isso desencoraja o pensamento crítico.",
					"<b>Uma ação exigida do ouvinte</b>: proteger-se ou repassar a história (\"então repasse para todas as pessoas que você conhece\").",
					"<b>Vagueza.</b> Os protagonistas não têm nome (\"a serva\", \"o ladrão\") e a história acaba quando é conveniente: por que Mestre Arsenal ficou parado? Quem era o mago?"
				])}
				<h2>As seis lendas</h2>
				${lista(LENDAS.map((l) => `<b>${l.nome}</b>: dica de ${avLink(l.av)}`))}`, 200),
			...LENDAS.map((l, i) => pagina(l.nome, `${l.texto.map((t) => `<p>${t}</p>`).join("")}<h3>Subtexto</h3><p>${l.subtexto}</p><p style="font-size:0.85em">Dica de ${avLink(l.av)}.</p>`, 210 + i * 10)),
			pagina("Linha Narrativa 1 · Caos em Valkaria", `
				<p>A tripulação da Roca continua no plano de destruir o tempo; o espaço de masmorra continua opcional. A diferença do Arco 1 é a complexidade: conspirações, tramoias da nobreza e a manipulação das mentes de toda Valkaria.</p>
				<p>Ao chegar, o grupo encontra a cidade tomada pelo crime, pela insegurança e pela violência. Talvez já tenha uma dica do Arco 1: membros interrogados da Companhia dos Irmãos diziam que Paollus estava cada vez mais brutal e imprevisível. Essa derrocada é representada pelas regras de Lei &amp; Ordem.</p>
				<h2>O objetivo: dinheiro e poder</h2>
				<p>Ghorskander deve conseguir o apoio incondicional e a subserviência da nobreza valkariana para o Dr. Vesper, que precisa de uma riqueza inimaginável para o aparato que destruirá o tempo (ainda mais se os heróis impediram o acesso ao metal arco-íris no Arco 1). A calamidade torna a população violenta, os aventureiros inúteis e a Rainha-Imperatriz impotente; a nobreza rejeita o Reinado e segue Vesper, que oferece segurança, prazeres irrestritos e a promessa de \"parar o tempo\".</p>
				<h2>As engrenagens</h2>
				${lista([
					"<b>Os Avatares do Futuro Eterno:</b> um culto secreto restrito à nobreza, para atrair famílias à ilha de Galrasia com seus recursos, deixando fortunas e influência nas mãos de Vesper.",
					`<b>Os golens de Lakshrimi:</b> a teóloga de bordo da Roca, infiltrada numa família nobre, substitui jovens nobres por golens que lhe obedecem. Quando uma jovem nobre descobriu parte da conspiração, os golens motivaram as famílias a ir para Galrasia. (${avLink(6)}; ${ficha(lakshrimi, "Lakshrimi")}.)`,
					`<b>Os Imagodutos:</b> máquinas mágicas em lugares de extrema insegurança, desigualdade e ódio que captam, moldam, potencializam e disseminam os pensamentos mais violentos, num círculo vicioso. (${avLink(4)} e ${avLink(5)}.)`,
					`<b>As pinturas:</b> pichações e imagens com técnicas e tintas especiais que bloqueiam os poderes dos aventureiros. O efeito não é mágico, é psicológico: heróis viram covardes, rebeldes viram conformistas. (${avLink(1)}.)`,
					`<b>A nova ciência:</b> fazer os pensamentos tomarem forma material, sem magia, somada aos estudos dos lagartos-terror de Galrasia. No ápice do caos, os Imagodutos materializam um lagarto-terror modificado, gigantesco, que ataca a cidade. (${avLink(7)}.)`
				])}
				<p>O plano é desnecessariamente complexo de propósito: conspirações dentro de conspirações. Cada aventura tem uma caixa explicando onde se encaixa. Basta lembrar: <b>Valkaria está decaindo ao caos; quando chegar lá, um dinossauro enorme será formado a partir dos pensamentos e emoções dos valkarianos.</b></p>`, 300),
			pagina("Linha Narrativa 2 · Espaço de Masmorra", `
				<p>Muito mais simples que no Arco 1: existe uma masmorra dentro da estátua de Valkaria, mesmo depois da libertação da deusa. Ela esconde tesouros e, segundo boatos, concede autoconhecimento a seus desbravadores. Explorar ou não fica a cargo dos jogadores.${labirinto ? ` Veja ${L(labirinto)}.` : ""}</p>`, 310),
			pagina("Ghorskander", `
				<p><b>ND 12 · Vilão final do segundo arco.</b> Ficha: ${ficha(ghorskander, "Ghorskander (Aventura 7)")}.</p>
				<p>Oficial médico e de ciências da Roca, em pé de igualdade com Vesper, a quem via como um agitador egomaníaco. Pragmático e materialista, estudou medicina porque sempre haveria demanda num gog'magogue. Via a Capitã Ygda como uma chefe de guilda, os tripulantes como colegas, e só reivindicava dinheiro e conforto. Achava Lakshrimi uma inconveniência.</p>
				<p>Foi o único que votou por entregar o Cofre Encarnatório à Ploigoníada. Respeitou a maioria, mas não viveu as memórias dos gnomos e confidenciava à Capitã que deviam denunciar a Roca. A mudança veio quando Vesper pediu ajuda nas pesquisas sobre corpo e alma: diante das cobaias, percebeu que ouro e luxo não valem nada se tudo tem fim. Visitou o Cofre com Lakshrimi, viveu as vidas de vários gnomos e começou um relacionamento com ela (apaixonada; para ele, um experimento social). Passou a ver Vesper como mestre, incentivou o assassinato da Capitã quando ela os denunciou e não questionou a revelação sobre o fim do tempo: a realidade era só mais uma cobaia.</p>
				<p>Em Arton, acompanhou Vesper a Salistick. Ao reencontrar Lakshrimi em Valkaria, convenceu-a a sacrificar o próprio corpo, e encarou com frieza a transferência da mente e da alma dela. Hoje os procedimentos nas cobaias são um prazer por si só. O fim do tempo é, antes de tudo, um triunfo pessoal: eternizar seu deleite. Vê todos como extensões da própria vontade.</p>`, 400),
			pagina("Torgo", `
				<p><b>ND 10 · Capanga recorrente.</b> Ficha: ${ficha(torgo, "Torgo (Aventura 7)")}.</p>
				<p>Provavelmente destruído no fim do Arco 1 (ou convencido a largar Vesper e destruído por ele), o golem gorila está de volta: a Roca usa seus vários corpos como bucha de canhão. Em Valkaria sua participação é menos marcante (não tem perfil para conspiração sutil), mas ainda é uma pedra no sapato.</p>
				<p>Sua principal função no Arco 2 é fazer os jogadores perceberem que ele só pode ser redimido ou libertado com acesso às suas memórias ou \"alma\". Convencê-lo ou derrotá-lo só faz com que volte.</p>
				<p><i>Se você conhece a referência do nome \"Torgo\", deve estar escutando a música na sua cabeça...</i></p>`, 410),
			pagina("Os Avatares do Futuro Eterno", `
				<p>Os pergaminhos podem ser achados ao longo das investigações. Os membros são exclusivamente altos nobres. Use-os para dar a sensação de que a nobreza está sendo manipulada e que há vários planos para desestabilizá-la, para introduzir a ilha de <b>Galrasia</b> (o Arco 3) e para o tom anacrônico e \"moderno\" de Valkaria.</p>
				<h2>Sopa de letrinhas</h2>
				<p>As siglas e jargões imitam cultos da vida real. A finalidade é convencer os nobres a seguir o Dr. Vesper:</p>
				${lista([
					"<b>Libertar-se do Ciclo de Espera Dolorosa (CED):</b> entregar-se a qualquer prazer imediatamente.",
					"<b>Reconhecer os Mecanismos de Supressão da Felicidade (MSF):</b> abandonar a moralidade e a empatia.",
					"<b>Renegar os Portadores de Paciência Punitiva (PPP):</b> afastar-se de todos que apontam a maldade disso.",
					"<b>Rumar ao paraíso artoniano:</b> isolar-se com Vesper em Galrasia."
				])}
				<p>Uma nobreza que não tolera esperar, só deseja o hedonismo e não se importa com ninguém é exatamente quem pode financiar o plano-mestre. O Pergaminho 4 também prepara o terreno dos Imagodutos: três horas por noite de pensamentos de raiva e destruição.</p>
				<h2>Investigando a seita</h2>
				<p>${INVESTIGAR}</p>
				<p>Os documentos estão em ${L(documentos)}; revele com ${linkMacro("Documentos")}. O <b>Diário Científico de Ghorskander</b> aparece em lugares muito ligados ao plano, como o laboratório de Khenzarr e a Casa de Repouso Millicent, para o grupo entender aos poucos a nova ciência e manter Ghorskander presente, já que só o encontrará no fim do arco.</p>
				<ol>${DOCS.map((d) => `<li>${L(paginaDoc(d.k))}${d.mestre ? ` <i>(${d.mestre})</i>` : ""}</li>`).join("")}</ol>`, 420),
			pagina("Cronologia e Níveis", `
				<p>Não há ordem fixa: o grupo examina o Quadro de Casos da Guarita da Praia e escolhe os casos e a ordem. O arco é feito para não dar tempo de jogar tudo: Lei &amp; Ordem o encerra antes.</p>
				<p>A Aventura 0 não dá nível; as Aventuras 1 a 6 dão um nível cada. Começando no 7º, o grupo poderia chegar ao 13º, mas a maioria não joga todas: maneje os níveis para que o grupo <b>termine o arco no 13º nível</b>. Na mesa original: quatro aventuras (11º), um nível extra por vencer os principais desafios do Labirinto Liberto, incluindo o monstro final (12º na Aventura 7) e o 13º ao terminar. O Arco 3 começa no 13º.</p>
				<h2>Ordem presumida das aventuras</h2>
				${lista(NIVEIS.map(([a, n]) => `<b>${a}:</b> ${n}`))}
				<p>${ORDEM} O lembrete do nível presumido está no início de cada aventura.</p>
				<h2>Adaptando ao nível dos personagens</h2>
				${lista([
					"<b>Vários oponentes:</b> aumente ou diminua a quantidade de criaturas para que o ND do encontro seja o nível do grupo.",
					"<b>Um único oponente:</b> +1 ou –1 em todos os testes e rolagens de dano e +10 ou –10 PV por nível de diferença."
				])}
				<p>${JULGAMENTO} Use ${linkMacro("Ajustar")}.</p>`, 500),
			pagina("Simplificando", `
				<p>Se o Arco 2 parecer complexo demais:</p>
				${lista([
					"Esqueça o contador de Lei &amp; Ordem.",
					"Não apresente todos os casos do quadro: só as Aventuras 1, 3, 4 e 5. A Aventura 2 exige \"roubar\" e brincar com as regras; a 6 tem um ambiente intrincado e cheio de NPCs no Palácio do Coração Florido.",
					"Elimine a subtrama dos nobres substituídos por golens (já que não vão jogar a Aventura 6).",
					"Se ainda houver variáveis demais, elimine a regra de atividades em Valkaria."
				])}
				<p>O autor recomenda não simplificar: aproveite tudo, sem se preocupar com erros, confusões ou inconsistências. Mas, se não for divertido para você, descarte o que quiser.</p>`, 510),
			pagina("Linha do Tempo sem os Heróis", `
				<p>Os personagens não são obrigados a fazer nada: podem ignorar missões, falhar e até morrer, e a campanha segue. Não há momento fixo para cada acontecimento (na mesa original, o arco durou 6 meses, por causa da trama pessoal de Ayla). Descreva Valkaria de acordo com as aventuras que o grupo não resolver. Exemplo: sem a Mini-Aventura Irmandade Máxima, há uma guerra de irmandades; mas, com a Aventura 1 resolvida, há heróis para impedir o massacre de inocentes e a destruição da Guarita da Praia. Algumas aventuras protegem pouco: a Aventura 2 não impede nada, e a 5 revela os Imagodutos sem impedir que sejam usados.</p>
				<ol>${LINHA.map((e) => `<li>${e.t}${e.antes ? " <i>(antes da chegada do grupo)</i>" : ""}${e.av && !e.antes ? ` <i>(${e.av})</i>` : ""}</li>`).join("")}</ol>
				<p>Acompanhe com ${linkMacro("Linha do Tempo")}. <i>As ligações entre acontecimentos e aventuras são uma leitura deste módulo; veja o guia do gerador.</i></p>`, 520)
		]
	});

	ui.notifications.info(`Lendas e Linhas Narrativas criadas: 2 diários, 1 tabela e ${macros.length} macros. Veja a pasta "${NOME_PASTA}".`);
})();
