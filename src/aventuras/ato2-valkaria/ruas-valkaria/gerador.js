/* =====================================================================
 * FIM DOS TEMPOS · ARCO 2 · AS RUAS TRAIÇOEIRAS DE VALKARIA
 * Gerador de conteúdo para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * COMO USAR
 *   1. Crie uma macro do tipo "Script" (como Mestre), cole este arquivo inteiro e execute.
 *   2. Ele cria pastas "FdT · Arco 2 · Ruas de Valkaria" com:
 *      - Tokens de apoio para os Valkarianos Notáveis que nenhuma aventura cria (Stugrid,
 *        Felicia, Reynard, Merikyzz, Basil, os vizinhos de Stremtol, a SPIMA, os súditos do
 *        Marquês, a Dama da Justiça e os detetives da Guarita da Praia).
 *      - Diário "As Ruas Traiçoeiras de Valkaria": Montando a Campanha, Mestrando em Valkaria,
 *        um núcleo de notáveis por página (com links para as fichas das aventuras) e a Guarda.
 *      - Diário "Nossa Valkaria", onde o grupo registra as vizinhanças sem nome do mapa.
 *      - Macros: Deslocamento (1 hexágono = meia hora), Notáveis, Juramento e Direitos e
 *        Vazios no Mapa.
 *   3. Rodar de novo apaga (depois de confirmar) o que foi criado antes e recria tudo.
 *      Só são apagados documentos com a marca flags.world.fdt = "a2ruas". As vizinhanças que o
 *      grupo inventou ficam num diário à parte, com a marca "a2ruasMapa", e são preservadas.
 *
 * Feito a partir do código do sistema (1.6.4, out/2026). Validado no Foundry simulado do
 * módulo giriarpg-fim-dos-tempos; veja o guia a2-ruas-valkaria.md.
 * ===================================================================== */
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode rodar este gerador.");

	const TAG = "a2ruas";
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
			window: { title: "Ruas de Valkaria: recriar conteúdo" },
			content: `<p>Já existem <b>${antigos.length}</b> documentos gerados para As Ruas Traiçoeiras de Valkaria.</p>
				<p>Eles serão <b>apagados e recriados</b>. Tokens já colocados em cenas continuam lá, mas
				perdem o vínculo com os atores antigos. O diário "Nossa Valkaria" não é apagado.</p><p>Continuar?</p>`
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
	const NOME_PASTA = "FdT · Arco 2 · Ruas de Valkaria";
	const pasta = {};
	for (const type of ["Actor", "JournalEntry", "Macro"]) {
		pasta[type] = (await Folder.create({ name: NOME_PASTA, type, color: "#7a5c3e", flags: FLAGS() })).id;
	}

	const p = (...linhas) => linhas.map((l) => `<p>${l}</p>`).join("");


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
	const A = `${T20I}/ameacas`;
	const R = `${T20I}/racas`;
	const C = `${T20I}/classes`;

	/* ------------------------------------------------------------------ */
	/* 2. Dados (fonte única para atores, diário e macros)                  */
	/* ------------------------------------------------------------------ */
	// Cada notável tem "busca" (trecho do nome de uma ficha criada por outra aventura, ligada aqui)
	// ou "novo" (token de apoio criado por este gerador). "publico" é o que os jogadores podem saber.
	const NUCLEOS = [
		{ k: "catedral", nome: "Catedral de Valkaria",
			intro: "O maior templo da Deusa da Humanidade, aos pés da estátua. Nobres, heróis e o povo comum dividem as mesmas ruelas em volta.",
			gente: [
				{ k: "stugrid", nome: "Stugrid, a Apóstata", novo: { img: `${C}/clerigo.webp`, raca: "humana", tipo: "hum", atr: { for: 0, des: 0, con: 1, int: 2, sab: 4, car: 3 } },
					publico: "A Alta Clériga da Catedral. Tem a palavra <b>HEREGE</b> queimada a ferro na testa e a ostenta com orgulho. Seus sermões são inflamados e polêmicos.",
					bio: ["Tecnicamente devota da Deusa da Humanidade, mas sua maior ambição é <b>destruí-la e tomar seu lugar</b>. Já tinha esse objetivo há anos; a ascensão de Arsenal e Thwor tornou o plano megalomaníaco uma possibilidade concreta.",
						"Já foi punida por rituais profanos. Uma maldição impede que se livre da marca de \"HEREGE\" na testa. Os devotos tradicionalistas dizem que ela espalha uma mensagem distorcida entre os fiéis."] }
			] },
		{ k: "academia", nome: "Academia Arcana",
			intro: "A maior escola de magia de Arton, recém-reformulada. Lugar de pesquisadores, não de aventureiros: quase ninguém tem tempo para o grupo.",
			gente: [
				{ k: "felicia", nome: "Felicia Daratramm", novo: { img: `${R}/anao.webp`, raca: "anã", tipo: "hum", atr: { for: 0, des: 1, con: 1, int: 4, sab: 1, car: 1 } },
					publico: "Anã pesquisadora de itens mágicos e de técnicas perdidas de encantamento. Sonhadora, curiosa e tranquila.",
					bio: ["Estuda a construção de itens mágicos e técnicas perdidas de encantamento. Também se interessa por luthieria: ensinou à namorada, <b>Belinda</b>, técnicas avançadas de construção e manutenção de instrumentos especiais.",
						"Parece o oposto de Belinda, e talvez por isso as duas se deem bem. Lamenta que a amada tenha ido realizar a vocação nas Colinas Centrais, mas compreende (quase sempre).",
						"Foi uma das idealizadoras da reformulação da Academia Arcana, desde quando era um projeto secreto. Por isso tomou a decisão prática e fria (rara para ela) de ficar em Valkaria. Trabalha com Merikyzz no Bureau Theuderulf."] },
				{ k: "reynard", nome: "Reynard", novo: { img: `${C}/arcanista.webp`, raca: "humano", tipo: "hum", atr: { for: -1, des: 0, con: 0, int: 5, sab: 2, car: 0 } },
					publico: "Arquimago impassível e metódico, pesquisador residente da Academia Arcana. Não tem um dos braços.",
					bio: ["Foi o líder da <b>Companhia Rubra</b>, o mais notório grupo de exploradores da Tormenta de que se tem notícia. Depois da incursão desastrosa pela Área de Tormenta de Zakharov, perdeu os companheiros e um braço.",
						"Muitas vezes está ausente, em alguma incursão por uma área de Tormenta. Leva muito a sério qualquer informação sobre a Tempestade Rubra, mas não pode dar atenção a todos os aventureiros que o procuram."] },
				{ k: "merikyzz", nome: "Merikyzz", novo: { img: `${A}/grifo.png`, raca: "harpia", tipo: "mon", atr: { for: 0, des: 2, con: 0, int: 3, sab: 1, car: -1 } },
					publico: "Uma harpia (asas de abutre no lugar dos braços, garras no lugar dos pés) entre os pesquisadores da Academia Arcana. Rude e sarcástica.",
					bio: ["Harpias quase só existem em masmorras, semi-ferais; Merikyzz é uma visão única até na Academia. Pesquisa <b>magias sonoras e comunicação mágica</b>, interesse que veio do grito aterrorizante da raça.",
						"Trabalha no Bureau Theuderulf, muitas vezes com Felicia, porque a luthieria mágica da anã tem pontos em comum com a pesquisa dela. Não abandona o jeito rude e sarcástico, mas em geral é bem-intencionada."] }
			] },
		{ k: "metais", nome: "Metais do Baixote",
			intro: "Uma das oficinas mais famosas da capital. Explodiu em fama quando o herói Nargom usou suas armas e quando ajudou no esforço de guerra contra os puristas. Ocupa mais de um quarteirão da Cidade da Praia e parece uma fortaleza: loja, forja, pátio de treino, taverna, alojamentos, estábulo e guaritas. Ao lado fica o Coliseu do Baixote.",
			gente: [
				{ k: "blixto", nome: "Blixto Arting", busca: "Blixto Arting",
					publico: "O hynne dono da Metais do Baixote. Sempre com um charuto (muitas vezes apagado) entre os dentes, dinâmico, entusiasmado e acelerado.",
					bio: ["Quis provar que um hynne podia ser armeiro tão bom quanto qualquer anão; para os valkarianos, conseguiu. O diferencial é o preço. Saiu dos negócios de charuto e comida da família e hoje emprega a família inteira e boa parte da vizinhança.",
						"Apaixonado pela Cidade da Praia (\"brega e tosca\"): prefere funcionários, fornecedores e clientes do bairro. Os anões que fiquem com os ricaços esnobes do Refúgio da Felicidade!",
						"Mesmo rico, vive como se precisasse garantir cada refeição: opera a forja, atende no balcão, negocia. Distribui tarefas sem perceber: quem vem falar com ele logo está consertando uma cadeira ou servindo vinho.",
						"Nunca se casou nem teve filhos; considera o sobrinho Basil um filho. Depois de alguns canecos deixa escapar a solidão: não se arrepende da vida dedicada à Metais, só lamenta não ter achado alguém com a mesma paixão (ou obsessão)."] },
				{ k: "basil", nome: "Basil Arting", novo: { img: `${R}/hynne.webp`, raca: "hynne", tipo: "hum", atr: { for: 0, des: 2, con: 1, int: 1, sab: 1, car: 2 } },
					publico: "Sobrinho de Blixto e dono do Coliseu do Baixote. Relaxado, tranquilo e um pouco indolente.",
					bio: ["Foi o primeiro e único funcionário da Metais: dormia, inventava desculpas, tomava poções que simulavam doenças e forjava cartas para fugir do trabalho. Blixto o convidou para um jantar e o emboscou com clérigos: expulsaram um pequeno <b>demônio da preguiça</b> que o possuíra quando leu tomos religiosos que não devia.",
						"Eternamente grato, ajudou a oficina a crescer. Quando Blixto chegou ao limite como administrador, Basil abriu o <b>Coliseu do Baixote</b>, ao lado da Metais: lutadores demonstram as armas de Blixto, há apostas, comida, bebida e um templo do Panteão. Comer, beber, apostar e rezar no mesmo prédio!",
						"Parte da preguiça era só dele: aceita qualquer desculpa para atrasos e não liga para uma cerveja em serviço. Alguns funcionários preferem trabalhar no Coliseu por isso."] }
			] },
		{ k: "stremtol", nome: "Vizinhança de Stremtol",
			intro: "Uma região no extremo do Refúgio da Felicidade: casas de médio porte com jardins, clima pacato e cordialidade entre vizinhos. Vidas sossegadas, sem grandes surpresas. Vários aventureiros aposentados escolhem morar aqui. (É o palco da Aventura 1.)",
			gente: [
				{ k: "osmont", nome: "Osmont Elbannise", novo: { img: `${C}/nobre.webp`, raca: "humano", tipo: "hum", atr: { for: 0, des: 0, con: 0, int: 1, sab: 0, car: 2 } },
					publico: "Conde, ex-frequentador das cortes da alta nobreza. Preocupa-se muito com aparências: lembra a todos que é nobre e tenta parecer o mais \"normal\" possível.",
					bio: ["Capturado por salteadores numa viagem ao Império de Tauron, foi salvo por aventureiros e se apaixonou pela caçadora Aldanna. Venceu pela insistência; casaram depois de um ano.",
						"Esperava que ela largasse as aventuras e a viu partir numa missão dias depois do casamento. Viveram brigando, até que Aldanna subitamente desistiu e fixou raízes na capital. Hoje vivem numa casa confortável, bem menos luxuosa do que ele conheceu, e ele é feliz na devoção total da esposa.",
						"Odeia falar da época de aventureira de Aldanna."] },
				{ k: "aldanna", nome: "Aldanna Elbannise", novo: { img: `${C}/cacador.webp`, raca: "humana", tipo: "hum", atr: { for: 1, des: 3, con: 1, int: 0, sab: 2, car: 1 } },
					publico: "Dona de casa polida e graciosa, ótima cozinheira, sempre maquiada e arrumada. Sobre o passado de aventureira, sorri e fala de \"loucuras da juventude\".",
					bio: ["Era uma caçadora especialista em sobrevivência nos ermos, mais à vontade numa floresta do que numa casa. Hoje não guarda nenhuma semelhança com o que foi.",
						"Tinha um companheiro animal, o javali <b>Aníbal</b>. Para comemorar a nova vida, preparou Aníbal para o jantar e o serviu ao marido na primeira refeição na casa nova. Não fala do antigo companheiro e muda de assunto quando alguém menciona o nome.",
						"O dia a dia gira em torno da casa e dos vizinhos, quase todos casais com pelo menos um aventureiro aposentado. Parece muito feliz em Stremtol."] },
				{ k: "remont", nome: "Remont Ronchetillon", novo: { img: `${C}/nobre.webp`, raca: "humano", tipo: "hum", atr: { for: 0, des: 0, con: 0, int: 1, sab: 0, car: 2 } },
					publico: "Um dos vários filhos da família nobre Ronchetillon. Com a esposa Ysmenne, foi o primeiro morador de Stremtol. Não trabalha, mas vai muito à corte.",
					bio: ["Apaixonou-se por Ysmenne, cavaleira da família, mas a diferença social impedia o casamento. Os Ronchetillon financiam a <b>Escola de Etiqueta e Bom Comportamento de Madame Margebell</b>; depois de uma temporada lá, Ysmenne foi aceita pela família.",
						"Casamento de sonhos. Foram morar em Stremtol para começar vida nova longe (mas não muito) da família dele."] },
				{ k: "ysmenne", nome: "Ysmenne Ronchetillon", novo: { img: `${C}/cavaleiro.webp`, raca: "humana", tipo: "hum", atr: { for: 3, des: 0, con: 2, int: 0, sab: 1, car: 1 } },
					publico: "Esposa de Remont. Antiga cavaleira da família Ronchetillon, hoje perfeitamente à vontade na corte.",
					bio: ["Aprendeu na Escola de Madame Margebell tudo o que precisava para, apesar do nascimento, se portar na corte e ser aceita pelos Ronchetillon."] },
				{ k: "inagar", nome: "Inagar", novo: { img: `${C}/arcanista.webp`, raca: "humano", tipo: "hum", atr: { for: 0, des: 0, con: 0, int: 3, sab: 1, car: 0 } },
					publico: "Ex-mago, casado com o contador Albert. Hoje é aprendiz na Guilda de Contadores.",
					bio: ["Guarda os grimórios no porão, com certa vergonha. Albert conseguiu para ele um posto de aprendiz na guilda onde trabalha; os dois passam quase o tempo todo juntos."] },
				{ k: "albert", nome: "Albert", novo: { img: `${R}/humano.webp`, raca: "humano", tipo: "hum", atr: { for: 0, des: 0, con: 0, int: 2, sab: 1, car: 0 } },
					publico: "Contador da Guilda de Contadores, casado com Inagar.",
					bio: ["A guilda presta serviços a altos nobres de Valkaria; Albert já conhecia alguns dos vizinhos atuais pelo trabalho."] },
				{ k: "illydna", nome: "Illydna", novo: { img: `${R}/elfo.webp`, raca: "elfa", tipo: "hum", atr: { for: 0, des: 1, con: 0, int: 2, sab: 1, car: 2 } },
					publico: "Elfa que prosperou servindo à família Ronchetillon. Casada com o goblin Alvuriell.",
					bio: ["Não mora mais na propriedade dos patrões: ganhou o direito a casa própria e vai ao trabalho todos os dias.",
						"Conheceu Grug, um ladino goblin, quando ele se esgueirava pelos corredores da propriedade. Apiedou-se, tirou-o da vida de aventuras, deu-lhe um belo nome élfico e casou com ele para protegê-lo. Não o deixa trabalhar nem administrar a casa: prefere mantê-lo confortável e descansado."] },
				{ k: "alvuriell", nome: "Alvuriell", novo: { img: `${R}/goblin.webp`, raca: "goblin", tipo: "hum", atr: { for: -1, des: 3, con: 1, int: 1, sab: 0, car: 0 } },
					publico: "Goblin de nome élfico, marido de Illydna. Não trabalha.",
					bio: ["Ex-ladino. O nome original era <b>Grug</b> e fazia parte de um grupo de aventureiros urbanos, até ser pego por Illydna nos corredores dos Ronchetillon."] },
				{ k: "hugo", nome: "Hugo", novo: { img: `${R}/humano.webp`, raca: "humano", tipo: "hum", atr: { for: 1, des: 0, con: 1, int: 1, sab: 1, car: 1 } },
					publico: "Vizinho de roupas simples que acorda cedo para cuidar da horta. Vive quase como aldeão, com a esposa Rosa e o bebê Luka.",
					bio: ["Era o <b>Conde Kasthafore Horatio Hugo Godefroy de Lilac e Labonnet</b>. Casou com Rosa, abandonou a vida na corte e os dois trocaram de nome. Têm existências pacatas, parecendo quase comuns demais."] },
				{ k: "rosa", nome: "Rosa (e o bebê Luka)", novo: { img: `${A}/necromante.png`, raca: "humana", tipo: "hum", atr: { for: 0, des: 0, con: 0, int: 4, sab: 1, car: 1 } },
					publico: "Esposa de Hugo, de roupas simples, cuidando do filho bebê, Luka.",
					bio: ["Era a necromante <b>Rozaryth Dez Caveiras</b>, por causa dos crânios animados que adornavam seus mantos. Capturada por heróis contratados pela família Labonnet, foi matriculada na Escola de Madame Margebell e saiu de lá \"totalmente regenerada\"."] }
			] },
		{ k: "spima", nome: "Sociedade Pontifícia de Intercessão Moral Artoniana (SPIMA)",
			intro: "Associação de clérigos sem deveres comunitários ou aventurescos, porque seus deuses não existem mais. Querem restaurar os \"velhos e bons tempos\", quando os jovens respeitavam os mais velhos. Culpam a decadência moral pela Tormenta: duyshidakk, puristas, o Kishinauros, o Paladino gigante, Valkaria espalhando poderes fora de Deheon, heróis nobres, heróis inventores, bardos, a Gazeta do Reinado, música de taverna... Tudo é corrupção ou obra de cultistas. Até hoje só escreveram cartas (a burocratas, à Gazeta, à Rainha-Imperatriz e a heróis \"tradicionais\").",
			gente: [
				{ k: "crisantemo", nome: "Crisântemo Horizonte", novo: { img: `${C}/bardo.webp`, raca: "humano", tipo: "hum", atr: { for: -1, des: 1, con: 0, int: 0, sab: 2, car: 1 } },
					publico: "Humano clérigo de Glórienn. Toca músicas élficas na rua por moedas e vende artesanato \"élfico\".",
					bio: ["Era coletor de impostos, com filhos, netos e outro nome. Fascinado por uma comunidade élfica, largou tudo, adotou um nome \"ligado às vibrações da alma élfica\" e sagrou-se clérigo de Glórienn em 1404. Em 1405 Glórienn caiu e virou deusa menor.",
						"Contrariando a família e os elfos, continuou clérigo, sozinho numa \"comunidade\" que quase não existia, até 1414, quando Glórienn se tornou mortal. Hoje sua principal atividade é achar culpados pelas quedas da deusa, junto à SPIMA."] },
				{ k: "calavius", nome: "Calavius Caelius Cumolonimbus", novo: { img: `${R}/minotauro.webp`, raca: "minotauro", tipo: "hum", atr: { for: 2, des: 0, con: 1, int: 3, sab: 2, car: 1 } },
					publico: "Minotauro clérigo de Tauron, sábio e filósofo outrora renomado no Império de Tauron.",
					bio: ["Sua filosofia dizia que Tauron, Deus da Força, era primordial e não podia morrer: se morresse, toda a Criação ficaria mais fraca que algo sem força e deixaria de existir.",
						"Estava em Valkaria quando Tauron morreu. Virou charlatão da noite para o dia: suas obras foram expurgadas e cartas educadas avisaram que \"não precisava mais comparecer\" ao Senado. Não lhe falta dinheiro, mas prestígio e respeito, sim. Procura uma nova corrente filosófica que o devolva ao topo da torre de marfim."] },
				{ k: "laenne", nome: "Laenne", novo: { img: `${R}/elfo.webp`, raca: "elfa", tipo: "hum", atr: { for: 1, des: 2, con: 1, int: 2, sab: 1, car: 0 } },
					publico: "Elfa clériga de Keenn, sem poderes, que faz bicos como segurança de tavernas e guarda-costas de figurões.",
					bio: ["Quando Glórienn caiu, disse \"eu avisei\": os elfos, perfeitos, deviam se espalhar por todos os ofícios e ensinar aos outros povos. Fazia sentido que um elfo logo desbancasse Mestre Arsenal como sumo-sacerdote de Keenn.",
						"Quando Arsenal ascendeu, achou que era um erro de comunicação com o Deus da Guerra. Lutou na Guerra Artoniana com seu conhecimento militar. Na SPIMA chama Arsenal de \"aquele barbudinho insolente\", \"o gritão\" e \"o amante de árvores\"."] },
				{ k: "brunhilda", nome: "Brunhilda", novo: { img: `${R}/anao.webp`, raca: "anã", tipo: "hum", atr: { for: 1, des: 0, con: 2, int: 0, sab: 2, car: 1 } },
					publico: "Anã clériga de Valkaria. A única da SPIMA cuja deusa ainda é deusa, e não cansa de corrigir e admoestar os demais.",
					bio: ["Queria só um bom emprego na capital: um templo numa ruela, uma congregação modesta que pagasse o dízimo, e depois uma cerveja na taverna. Pregava que os fiéis eram preguiçosos, sentada em sua poltrona.",
						"Quando Valkaria foi libertada, os devotos foram proibidos de ficar muito tempo no mesmo lugar. Brunhilda arrumou a mochila, mas precisava de botas novas, deu um mau jeito no ombro, começou a chover... O rebanho se esvaiu. Mora na sede da SPIMA, sustentada pelos companheiros."] },
				{ k: "vlorax", nome: "Vlorax", novo: { img: `${A}/cultista-da-traicao.png`, raca: "humano", tipo: "hum", atr: { for: 1, des: 1, con: 1, int: 2, sab: 2, car: 1 } },
					publico: "Humano clérigo de Leen (depois Ragnar). Um ex-vilão que se diz cansado de tudo.",
					bio: ["Fazia sacrifícios, combatia heróis e tramava em nome do insidioso Leen. Quando Leen virou Ragnar, adotou os modos bárbaros e peregrinou a Lamnor. Quando finalmente se acostumou, Ragnar morreu.",
						"Furioso, entregou-se à Guarda para ser julgado, mas os crimes eram antigos demais e não havia registros: foi liberado. Tentou ser vilão de novo, mas não tinha mais graça. Na SPIMA, repete sua opinião mais forte: <b>o mundo está tão perdido que não se consegue nem ser maligno</b>."] }
			] },
		{ k: "rocha", nome: "A Rocha Cinzenta",
			intro: "A principal prisão de Valkaria, capaz de limitar as capacidades dos aventureiros. É o palco da Aventura 3.",
			gente: [
				{ k: "bartolakk", nome: "Bartolakk", busca: "Bartolakk",
					publico: "O diretor da Rocha Cinzenta: um golem criado pela Academia Arcana para a função. Totalmente literal, lógico e frio.",
					bio: ["Nunca saiu da Rocha. Trata penas e cotidiano dos presos de forma matemática, sem indignação nem compaixão: busca a melhor forma de reabilitar ou controlar o preso com o mínimo dano a vidas mortais.",
						"Três diretrizes: não descumprir a lei e fazer a lei ser cumprida; não ferir mortais (exceto se conflitar com a primeira); defender a própria vida (exceto se conflitar com as duas primeiras).",
						"Não entende as ligações emocionais dos mortais. Por que várias roupas e não um uniforme? Por que \"bom dia\"? Por que sentar para comer?"] },
				{ k: "stoke", nome: "Carcereiro Stoke", busca: "Carcereiro Stoke",
					publico: "Carcereiro chefe de uma equipe na Rocha Cinzenta.",
					bio: ["Sádico, corrupto, violento e covarde: a última pessoa que deveria ter poder sobre os outros, e por isso quis ser carcereiro. Fez acordo com a Companhia dos Irmãos e é garoto de recados para o mundo exterior.",
						"Está abaixo de todos os irmãos por não ter feito juramento: os criminosos mandam, ele obedece e desconta nos presos \"comuns\"."] },
				{ k: "benfeitor", nome: "O Benfeitor", busca: "O Benfeitor",
					publico: "Um preso minotauro tratado como nobre dentro da Rocha. Todos parecem dever algo a ele.",
					bio: ["Khabrias Minareus, irmão do meio da Companhia dos Irmãos, preso numa ação conjunta da Guarda e três grupos de aventureiros durante uma venda de itens amaldiçoados. Encurralado, matou um guarda da forma mais cruel possível, e mais dois antes de cair.",
						"Com essa fama e o posto na irmandade, reuniu um pequeno exército de detentos e corrompeu Stoke. A irmandade lhe mandou uma clériga cirurgiã e um meio de contornar as limitações de magia da prisão.",
						"Consegue qualquer coisa para qualquer preso, em troca de dívida permanente. Comanda operações lá fora através de Stoke e lucra com o tráfico de <b>achbuld</b>. Não quer sair. Ouviu dos irmãos que <b>em breve todos os aventureiros de Valkaria terão as mesmas limitações dos detentos</b>, e só os criminosos terão capacidades extraordinárias..."] },
				{ k: "farhuk", nome: "Farhuk/Majid", busca: "Farhuk",
					publico: "\"Majid\", o conselheiro qareen do Benfeitor, preso com a equipe dele.",
					bio: ["Detetive qareen da Guarda infiltrado na Companhia dos Irmãos sob o nome Majid (algo nunca feito antes). Largou os poucos amigos e entrou na irmandade sob Khabrias.",
						"Foi preso com a equipe dele. Sem magia nem habilidades, não tem como contatar o mundo exterior nem provar quem é. Caiu nas graças do Benfeitor: trouxe soldados, negociou mercadorias, engambelou carcereiros e virou \"conselheiro\". Tem acesso a muita informação, mas está sempre sob vigilância do minotauro."] }
			] },
		{ k: "terceira", nome: "Taverna Terceira Opção",
			intro: "Na Cidade da Praia, uma taverna para quem gosta de música de verdade: cerveja anã trazida de Doherimm, palco, bardos pagos e composições próprias, não as cantigas de sempre. Atraiu corredores de carruagem, gladiadores, artistas e aventureiros. Agora as brigas estão cada vez mais violentas, viram batalhas, afastam a clientela e atraem arruaceiros. É o palco da Aventura 4. <i>Onde toda música começa com uma contagem 1-2-3-4.</i>",
			bandas: [
				["Naxia e os Monstros Errantes", "música macabra com toque agressivo. Naxia Nix, dahllan toda de preto, e três humanos de maquiagem pesada (Maxir, Almia, Zugont)."],
				["Brasão de Kor Kovith", "extremamente agressiva, quase tudo sobre combater os puristas; acusam o Reinado de conivência. Chazz (lefou, vocal/alaúde), Durk (goblin, vocal/alaúde), Nulliandor (elfo, violoncelo), Mirne (sereia, pratos/tambor)."],
				["Tarsos", "músicas rápidas, simples e divertidas, de gosto duvidoso (<i>Quero Ser Seu Simbionte</i>, <i>Glórienn É Minha Namorada</i>, <i>Romance em Hangpharstyth</i>). Tarso Drake, Tarso Galtran, Tarso Algherulff e Tarso Khoshkothruk se vestem iguais, imitando o esqueleto Tarso."],
				["Reles Rancor", "\"superbanda\" de bardos de Aslothia mortos ao longo dos séculos, todos aos 27 anos: Jarynn (povoamento de Bielefeld), Spud (Guerra Civil), Glenna (executada por Ferren Asloth por usar magia) e Nasto (afogado no próprio vômito). Mistura pesada de gêneros de cada época."],
				["Vyrgillia de Azgher", "barda de Smokestone. Diz ter sido xerife de Azgher e ter um passado sombrio. Canta as planícies, a solidão dos foras da lei e os arrependimentos da bebida e das armas de pólvora."],
				["Senomar", "o velho bardo continua rápido e agressivo. Às vezes aparece e até se apresenta."],
				["Crânio de Pedra", "três piratas sem instrumentos, com rimas rápidas e ácidas: Larkin Rasga-Faca (troglodita), Vitta Voltania (humana) e Bolo (anão largo como um barril, que batuca em qualquer coisa e incentiva o público a fazer o mesmo). Sucessos: <i>Mar Salgado/Sangue Salgado</i>, <i>Fogo no Reinado</i>, <i>3 Bucaneiros</i>."],
				["Homúnculo", "dupla de inventoras de Moreania, Alabarda (herdeira da raposa) e Acha d'Armas (herdeira da coruja), com autômatos mesclados a instrumentos de percussão, em apresentações experimentais e performáticas."]
			],
			gente: [
				{ k: "click", nome: "Click", busca: "Click",
					publico: "O taverneiro: um anão osteon cuja mandíbula estala quando ele fala.",
					bio: ["Morreu na Guerra Artoniana e garante que se ergueu da tumba porque não aguentava mais a música perto do cemitério: canções melosas, melodias que não ofendem ninguém, versões para bailes elegantes. Tudo lixo!",
						"Nunca foi bardo, mas ama música. Com o tesouro saqueado dos puristas, abriu a Terceira Opção para músicos que não têm medo de gritar e escandalizar os valkarianos de bem. O nome: quem quer um lugar tranquilo só vem se as tavernas comuns estiverem fechadas ou lotadas.",
						"Tem acordo exclusivo com a Guilda dos Cervejeiros de Doherimm. O nome antigo era Bhulgarassimm; \"Click\" soa muito mais natural."] },
				{ k: "drasala", nome: "Drasala", busca: "Drasala",
					publico: "A segurança da Terceira Opção: uma medusa forte e vigorosa, ex-gladiadora da Arena de Valkaria, com metade das serpentes da cabeça cortadas.",
					bio: ["Nunca foi hábil nem chamativa, mas aguentava dano como ninguém, e a raça fez dela a \"vilã\" natural das lutas de exibição. As lutas eram falsas, o dano não: devia perder, e os adversários às vezes pesavam a mão. Um machado cortou metade das serpentes da cabeça dela.",
						"Aposentou-se (já estava velha) e faz bicos onde é preciso alguém forte, resistente e amedrontador. Parecia um trabalho fácil... até as brigas começarem."] }
			] },
		{ k: "lena", nome: "Baixa Vila de Lena",
			intro: "O principal bairro boêmio da capital: acordado à noite, jovens com cálices e canecas com brasões das tavernas, bardos em cada esquina e movimentos artísticos novos (e esquisitos) a cada instante. Embaixo, os esgotos do Povo dos Túneis. É o palco da Aventura 5.",
			gente: [
				{ k: "vladmir", nome: "Marquês Vladmir Mors", busca: "Vladmir Mors",
					publico: "Um vampiro conhecido de todos, rico, sempre cercado de admiradores, em festas, falando o tempo todo. Mora na Mansão do Sono e Suplício, de portas sempre abertas.",
					bio: ["Aristocrata solitário, torturado e soturno que não parece nada disso. A quem diz que é fachada: <i>\"É preciso um sofrimento ainda maior para que minha dor vos satisfaça... Então logo estarão felizes, pois meu tormento não tem limite e não tem fim!\"</i>",
						"Existe na Baixa Vila pelo menos desde a construção de Vectora (diz ter visitado o Mercado nas Nuvens atrás de uma cura) e às vezes sugere que estava aqui antes dos refugiados de Lamnor. Aqui é Valkaria, onde até os sanguessugas pagam impostos.",
						"Diz que não mata para se alimentar. Tem um séquito de \"crianças da noite\", \"inocentes amaldiçoados\", \"sonâmbulos do sangue\": devotos de Tenebra e jovens entediados, muitos deixam que ele beba seu sangue esperando ser transformados. Ele é claro: <b>nunca</b> passará adiante a terrível existência eterna de riqueza, adulação e festas.",
						"A mansão funciona como castelo, aberta ao público (exceto os aposentos e o caixão), onde ele atende os \"súditos\"."] },
				{ k: "fido", nome: "Fido", busca: "Fido",
					publico: "O único servo oficial do Marquês. Um humano um pouco caipira, muito nervoso, medroso e totalmente leal.",
					bio: ["Lobisomem: perde o controle e se transforma nas noites de lua cheia. Pediu ajuda a Vladmir, o único que poderia entender sua condição; o vampiro o acolheu e o acorrenta sempre que há risco. Daí uma lealdade... canina."] },
				{ k: "ozeanna", nome: "Ozeanna", novo: { img: `${R}/qareen.webp`, raca: "qareen", tipo: "hum", atr: { for: 0, des: 1, con: 0, int: 1, sab: 0, car: 3 } },
					publico: "Súdita do Marquês. Uma qareen bela e sempre na moda, com seu próprio séquito de seguidores.",
					bio: [] },
				{ k: "vancort", nome: "Vancort", novo: { img: `${R}/hynne.webp`, raca: "hynne", tipo: "hum", atr: { for: -1, des: 2, con: -1, int: 1, sab: 0, car: 1 } },
					publico: "Súdito do Marquês. Um jovem hynne franzino e alérgico, fascinado pela vida noturna.",
					bio: [] },
				{ k: "mildred", nome: "Mildred", novo: { img: `${A}/necromante-veterano.png`, raca: "humana", tipo: "hum", atr: { for: 0, des: 0, con: 0, int: 3, sab: 2, car: 1 } },
					publico: "Súdita do Marquês. Arcanista e devota de Tenebra de meia-idade.",
					bio: ["Fascinada pelo vampirismo e obcecada pela ideia de viver para sempre."] },
				{ k: "ellan", nome: "Ellan'grag'dakrimm", busca: "Ellan'grag",
					publico: "Um dos membros mais ativos do Povo dos Túneis, nos esgotos. Não sabe que sua aparência e seu nome são estranhos.",
					bio: ["Uma junção de elfo, anão e goblin: partes de cada raça costuradas numa colcha de retalhos viva. As memórias são fragmentos contraditórios das três: lembra de uma guilda de ferreiros e da terra natal invadida por monstros, mas a terra natal era uma região pobre de Valkaria. Não sabe que são lembranças de Doherimm, de Lenórienn e da Favela dos Goblins."] },
				{ k: "gaus", nome: "Gausbloppasremme", busca: "Gausblop",
					publico: "Uma das líderes do Povo dos Túneis, que tenta agir como irmã mais velha dos outros.",
					bio: ["Um misto de partes de minotauro, hynne e dahllan, sem notar que isso tem algo de estranho. As memórias conflitantes (era um legionário que vendia charutos numa floresta idílica) tornam difícil ter qualquer experiência útil para a comunidade."] },
				{ k: "athizsa", nome: "Athizsa", busca: "Athisza",
					publico: "Uma sereia do esgoto, nascida sem olhos, líder natural do Povo dos Túneis.",
					bio: ["Lembra dos pais, mas não do que lhes aconteceu; as primeiras lembranças já são dos esgotos. Acredita ser a geração mais nova de uma longa linhagem de sereias do esgoto (nasceu sem olhos, adaptação de quem vive longe da luz).",
						"Conheceu os piratas do esgoto, fugiu dos monstros e encontrou o Povo dos Túneis, que não estava adaptado aos esgotos nem lembrava como chegou lá. É a única que conhece os esgotos o bastante para manter os protegidos um passo à frente do inimigo.",
						"Determinada e prática, mas a reação natural é fugir ou se esconder: o \"povo de cima\" raramente desce com boas intenções, e coragem quase sempre é sinônimo de idiotice."] }
			] },
		{ k: "nobres", nome: "A Juventude Nobre",
			intro: "A alta nobreza de Valkaria está tão acima da nobreza \"comum\" quanto um nobre comum está do mais reles plebeu. Nunca lidaram com dinheiro: simplesmente possuem tudo. Nem a Rainha-Imperatriz pode desestabilizá-los sem fazer metade do Reinado ruir, e nem um deus está fora do seu alcance. Muitas famílias têm sangue élfico, divino, angelical, feérico ou dracônico. Os jovens vivem de festas, esportes, viagens, fofoca, roupas e às vezes estudo; muitos nem sabem que houve uma guerra (\"uma dessas brigas de plebeus\"). São os convidados da Aventura 6.",
			gente: [
				{ k: "alfraye", nome: "Alfraye", busca: "Duquesa Alfraye",
					publico: "Duquesa Alfraye Oppulak de Trylon e Foltomett. Melancólica e reclusa, alvo de pena ou piadas.",
					bio: ["Órfã desde que os pais morreram na Guerra Artoniana, assumiu a chefia da família. Passou a ser considerada esquisita depois de um baile em que, segundo ela, <b>todos os seus amigos morreram</b>. O problema: nenhum deles parece estar morto! Fica sozinha no castelo da família, com livros e trivialidades."] },
				{ k: "kalyon", nome: "Kalyon", busca: "Kalyon",
					publico: "Duque Kalyon Montalbert Arkystan III. Bonito, carismático, cativante e totalmente ingênuo.",
					bio: ["Tão desconectado do mundo que não transparece maldade, tão privilegiado que não entende como alguém poderia não gostar dele. Os boatos de assassinatos de jovens nobres o chocaram: isso ficou no passado, não? Ataque de Mestre Arsenal, corrupção do Paladino, rapto da Princesa Tanya: histórias divertidas, que nunca aconteceriam no mundo real!"] },
				{ k: "angeliese", nome: "Angeliese", busca: "Angeliese",
					publico: "Viscondessa Angeliese Michon-Albanez de Wallas e Ramannt. Uma das poucas jovens nobres que tenta ajudar o mundo \"normal\".",
					bio: ["Já organizou um evento beneficente para a \"família carente\" da rainha de Namalkah, doou vestidos para os refugiados da guerra usarem em seus bailes e tentou um acordo diplomático entre Azgher e Tenebra. Não sabe ajudar as pessoas comuns nem conhece os próprios limites, mas a boa vontade é inegável."] },
				{ k: "archibald", nome: "Archibald", busca: "Archibald",
					publico: "Conde Archibald Benessar Xendros Tranalyell Whorp. Baixinho, magro e desajeitado, estudioso, quer ser arcanista.",
					bio: ["Tem talento para ser um grande mago: a vaga na Academia Arcana está garantida e já tem alguns artefatos. A paixão pela Duquesa Melynna o distraiu da magia para os bailes e roupas. Suspeita que só o convidam pela influência dos pais, mas não deixa isso atrapalhar os grandes gestos para conquistar Melynna."] },
				{ k: "melynna", nome: "Melynna", busca: "Melynna",
					publico: "Duquesa Melynna Trewnwryte Stolinsson Fröghstassen Jurdluchstnach, \"a Vigésima-Primeira Deusa do Panteão\". Talvez a pessoa mais bela da cidade.",
					bio: ["A herdeira mais cobiçada de Arton: senadores de Tauron ofereceram províncias por um encontro; príncipes angelicais pediram sua mão; bardos desistiram da arte ao vê-la. A família é rica até para os padrões valkarianos. Se você nunca ouviu falar, é porque não merece.",
						"Sabe da própria beleza. Deu-se o epíteto e todos aceitaram. Arrogante e condescendente: não se acha melhor que ninguém, <i>sabe</i> que é melhor que todos, e não só mortais."] },
				{ k: "loranth", nome: "Loranth", busca: "Loranth",
					publico: "Barão Loranth Okanjyll Lessamar Lodek, \"o Teleporte\". Especialista em drogas e alucinógenos.",
					bio: ["Faz os amigos \"irem para outro lugar\" num piscar de olhos. Ninguém sabe o que são suas combinações de plantas, alquimia e magia, nem ele: \"Semiplaninho de Wynna\", \"Amansa-Ogro\", \"Holy Absolver\", \"Uefel\", \"Masmorrite\", \"Aliança Verde\"...",
						"Acredita em teorias da conspiração e \"verdades alternativas\", quase todas sobre heróis famosos de Arton usarem substâncias recreativas."] },
				{ k: "axel", nome: "Axel", busca: "Axel",
					publico: "Conde Axel Trelock Dezzenhal da Grande Batalha. Alto, forte, treinado como guerreiro, de pavio curto.",
					bio: ["A família não era nobre: um antepassado foi sagrado cavaleiro na Grande Batalha. São \"novos ricos\" eternamente recém-chegados. O epíteto faz os descendentes se acharem grandes heróis, mas nenhum saiu em aventura desde então.",
						"Não perde chance de mostrar força e \"valentia\", sobretudo perto de mulheres. Inseguro quanto às origens, desafia qualquer um que pareça questionar sua nobreza."] },
				{ k: "irludde", nome: "Irludde", busca: "Irludde",
					publico: "Marquesa Irludde Dyssindar Veront-Faryllia. Imersa em fofoca, pequenas competições e minúsculos escândalos.",
					bio: ["Jogadora iniciante do <b>Grande Jogo</b>, a teia de maquinações, alianças e insultos dos \"adultos\" da elite. Não é maligna nem exatamente maliciosa, mas não perde chance de divulgar segredos ou apontar defeitos. Aventureiros que se aproximam e a deixam falar descobrem muita coisa."] },
				{ k: "drekaag", nome: "Drekaag", busca: "Drekaag",
					publico: "Príncipe Drekaag de Sckharshantallas. Pupilas verticais, cabelos vermelhos e pequenas escamas; adora ouro, invoca o nome de Sckhar e mexe com fogo.",
					bio: ["Um dos poucos não humanos da alta nobreza: descendente do próprio Sckhar (bisneto, tataraneto, sobrinho-tataraneto em terceiro grau, algo assim). Distante o bastante para nunca ter visto o Dragão-Rei, perto o bastante para ser rico e respeitado.",
						"Veio quando Sckharshantallas ainda era do Reinado e ficou. Mais velho que os amigos, mas com a cabeça de quem sai da adolescência. Sendo o único meio-dragão que conhece, imita o que imagina ser o comportamento de seu povo."] }
			] }
	];

	// A Guarda: a Guarita da Praia (a Xerife e os detetives) e a Dama da Justiça.
	const GUARDA = [
		{ k: "xarynn", nome: "Xarynn Libra, a Dama da Justiça", novo: { img: `${R}/lefou.webp`, raca: "lefou", tipo: "hum", atr: { for: 0, des: 0, con: 1, int: 4, sab: 3, car: 1 } },
			publico: "A atual Dama da Justiça, chefe de toda a Guarda de Valkaria. Lefou devota de Khalmyr, fascinada pela ordem, pelas leis e pela burocracia.",
			bio: ["Surgiu aparentemente do nada. Talvez a única pessoa que entende a teia de atribuições dos Lordes Urbanos e a matemática bizarra da eleição: invocou regras obscuras, falou com as pessoas certas e se elegeu por uma série interminável de tecnicalidades. Recusar a vitória seria invalidar o próprio processo.",
				"Está se provando uma boa Dama da Justiça. Fez parte do conselho que criou a nova Guarda (estatística, logística, meandros legais). Ignora bem e mal, tradições, heroísmo e ameaças cósmicas: faz valer a lei como está escrita, igual para todos. Já prendeu temporariamente a sumo-sacerdotisa de Marah por barulho demais ao salvar vítimas de um incêndio.",
				"Muitos gostam da previsibilidade. Alguns dizem que, como ninguém conhece a lei tão bem quanto ela, ninguém pode ter certeza de que ela não inventa as próprias regras..."] },
		{ k: "mathilda", nome: "Xerife Mathilda Nolt", busca: "Xerife Mathilda",
			publico: "A Xerife da Guarita da Praia, talvez a mais jovem da cidade. Clériga de Tanna-Toh, só fala a verdade. Perdeu o uso das pernas.",
			bio: ["Geração mais recente de uma família de guardas. Ouviu o chamado de Tanna-Toh ainda criança e se ordenou no início da adolescência; virou \"mascote\" nas guaritas da mãe e dos tios e criou sistemas arcanos de detecção de pistas antes de adulta. Carreira meteórica de detetive.",
				"A honestidade e a competência incomodaram. Numa tarde em que seus desafetos estavam fora, bandidos que não queriam nada atacaram o quartel; Mathilda parecia o alvo. Atravessada por uma lança e baleada, estancou os ferimentos com a própria magia e instruiu os colegas até chegarem clérigos.",
				"Promovida a Xerife na reforma. Não descobriu os culpados, mas sabe que guardas corruptos têm ligação. Como só fala a verdade, já disse isso mais de uma vez, e continua sendo um alvo..."] },
		{ k: "zymni", nome: "Dra. Zymni", novo: { img: `${R}/trog.webp`, raca: "troglodita", tipo: "hum", atr: { for: 1, des: 1, con: 2, int: 3, sab: 2, car: -1 } },
			publico: "A médica da Guarita da Praia, uma troglodita que examina cadáveres e provas no anexo, onde até faz as refeições.",
			bio: ["Encontrada no ovo por aventureiros de Salistick e adotada por uma família de cientistas. Formou-se no Colégio Real de Médicos. Em Valkaria descobriu que a maioria dos humanos não queria ser tratada por uma trog, mas a Guarda Arcana sempre precisa de especialistas.",
				"Curiosa, com uma naturalidade desconcertante perto de cadáveres e cenas grotescas, e um senso de humor inapropriado que é só dela. A maioria dos guardas evita o anexo; ela não se importa."] },
		{ k: "ulnsariann", nome: "Ulnsariann", busca: "Ulnsariann",
			publico: "Detetive elfo, ousado, jovem (para os padrões élficos) e nobre. Parceiro inseparável de Throgarimm.",
			bio: ["A dupla é famosa em toda a Cidade da Praia pelas brigas constantes e por desafiar o regulamento. Pergunte algo aos dois e ouvirá duas respostas opostas. Reclamam um do outro, mas se recusam a trabalhar com outros ou sozinhos (\"é preciso ficar de olho no anão\"). Mathilda odeia os métodos, mas admite que dão resultado."] },
		{ k: "throgarimm", nome: "Throgarimm", busca: "Throgarimm",
			publico: "Detetive anão, cauteloso, velho e plebeu. Parceiro inseparável de Ulnsariann.",
			bio: ["\"O elfo vai ser enganado pelo suspeito\"; \"é preciso dois detetives para invadir o covil\": sempre há uma justificativa para não se separar de Ulnsariann."] },
		{ k: "saeba", nome: "Saeba, o Guarda Ninja", novo: { img: `${C}/ladino.webp`, raca: "humano (tamuraniano)", tipo: "hum", atr: { for: 1, des: 4, con: 1, int: 1, sab: 2, car: 0 } },
			publico: "Detetive tamuraniano que se veste de samurai e usa armas tradicionais, mas age sozinho, sorrateiro e cheio de truques. Não confirma nem desmente os boatos.",
			bio: ["Entrou na Guarda para vingar a irmã mais nova, vítima de uma Irmandade. Começou o ataque sozinho, mas, ao se ver enfrentando guardas tanto quanto criminosos, decidiu ficar do lado da lei. Um dos detetives mais marcantes e eficientes da Guarita da Praia."] },
		{ k: "hannah", nome: "Hannah", novo: { img: `${R}/suraggel.webp`, raca: "suraggel (aggelus)", tipo: "hum", atr: { for: 1, des: 1, con: 1, int: 1, sab: 2, car: 2 } },
			publico: "Detetive de herança celestial, extremamente apegada à justiça e talvez intolerante demais com criminosos.",
			bio: ["Vê como dever acabar com o crime em Valkaria e se perde em infrações insignificantes. A lealdade à Guarda é inquestionável, mas Mathilda às vezes a repreende pelo tratamento aos suspeitos e aos cidadãos que descumprem qualquer lei obscura."] },
		{ k: "finley", nome: "Finley", novo: { img: `${A}/guarda-de-cidade.png`, raca: "humano", tipo: "hum", atr: { for: 1, des: 1, con: 1, int: 0, sab: 0, car: 1 } },
			publico: "O detetive mais jovem da Guarita da Praia: entusiasmado, ingênuo, sempre disposto a ajudar e completamente verde.",
			bio: ["A burocracia o promoveu e Mathilda se apiedou dele. Não é um prodígio: é um rapaz normal numa situação muito além das suas capacidades. Já foi enganado várias vezes por criminosos (pelo menos uma fuga). A Xerife não é tão severa quanto poderia, mas todos conhecem os erros dele."] },
		{ k: "tullia", nome: "Tullia Blasanov", novo: { img: `${R}/lefou.webp`, raca: "lefou", tipo: "hum", atr: { for: 1, des: 2, con: 1, int: 1, sab: 1, car: 0 } },
			publico: "Detetive lefou com o sobrenome de uma das famílias criminosas mais notórias da capital.",
			bio: ["Sofre preconceito por ser lefou e, dentro da Guarda, por ser uma Blasanov. Nunca fez parte da Irmandade, mas cresceu na <b>Casa Blasanov</b>, que só compete com a Companhia dos Irmãos no crime organizado. Considera ter nascido lefou uma bênção: indesejada pela família, viu como ela era cruel e violenta.",
				"Sabe que é um risco para qualquer guarita (os Blasanov são vingativos) e se esforça para compensar. Muitas vezes alude ao que presenciou crescendo na família."] },
		{ k: "berthun", nome: "Berthun", novo: { img: `${A}/sargento-da-guarda.png`, raca: "humano", tipo: "hum", atr: { for: 2, des: 1, con: 2, int: 1, sab: 2, car: 0 } },
			publico: "Detetive veterano que viu a reforma da Guarda. Poderia ser Xerife, não fossem as infrações: dorme em serviço, chega atrasado, falta às reuniões e muitas vezes aparece ferido ou mancando.",
			bio: ["Não é desonesto, negligente nem violento demais. A esposa e os filhos notam suas ausências por várias noites; a maioria dos guardas acha que é um bêbado que se mete em brigas de taverna.",
				"<b>Segredo:</b> é o vigilante mascarado conhecido como <b>Curandeiro</b>, que caça os criminosos que escapam das investigações normais. Ele mesmo não sabe se a exaustão não os ajuda a escapar impunes."] }
	];

	const JURAMENTO = [
		"Eu juro, por Khalmyr e pela Rainha-Imperatriz",
		"Defender a cidade, e o povo acima dela",
		"Honrar meus companheiros, e a lei acima deles",
		"Buscar em todos os casos a verdade, e a justiça acima disso",
		"Zelar pela ordem, e pela vida acima de tudo",
		"Colocar o dever acima de mim mesmo",
		"E, acima do dever, o bem"
	];
	const DIREITOS = "Você é acusado de {crime} pela Guarda de Valkaria, sob a verdade de Khalmyr e Tanna-Toh. Você está sob responsabilidade da cidade de Valkaria e tem o direito de ser alimentado e abrigado. Tem o direito de receber a visita de um clérigo de qualquer deus do qual for devoto, desde que não represente perigo ou profanação. Tem o direito de estar a salvo de qualquer controle mental, leitura de pensamentos ou vigilância de sua alma. Ao aceitar esses direitos, reconhece ser um habitante inteligente e não monstruoso do mundo material, sujeito às leis dos mortais.";
	const FORCA = [
		["Presença e ordens verbais", "O primeiro nível de força, pela cartilha que existe há séculos: \"Guarda de Valkaria! Parado!\""],
		["Técnicas não letais", "Se o suspeito resiste, mas não é violento nem está armado."],
		["Força letal", "Só se o suspeito ataca o guarda ou outra pessoa. Mesmo assim, o juramento manda se esforçar para não matar. Todo guarda deve fazer um esforço real para capturar suspeitos com vida."]
	];
	const PUNICOES = [
		["Infrações simples", "Danos materiais, descumprir ordem direta (\"Eu falei para vocês não se meterem com o barão!\"), equipamento ilegal: uma ou duas semanas de afastamento e suspensão do pagamento do caso resolvido de forma irregular. O guarda entrega espada e distintivo e, teoricamente, se afasta de todos os assuntos da Guarda (por alguma razão, isso raramente é cumprido). Investigadas por outra guarita ou punidas de forma simples."],
		["Desrespeito flagrante às autoridades", "Prosseguir numa investigação encerrada, invadir propriedade sem autorização, usar magia ilegal num suspeito, mesmo com as melhores intenções: expulsão e perda de aposentadoria (curiosamente, uma ameaça que aflige muitos guardas prestes a se aposentar)."],
		["Crimes", "Execuções, acusações falsas e chantagem: investigação detalhada, expulsão e/ou qualquer pena cabível. A Rocha Cinzenta é um lugar terrível para ex-guardas."]
	];
	const VAZIOS_IDEIAS = [
		"<b>Meia-Cidade</b>: um bairro hynne dominado por uma gangue de contrabandistas de itens mágicos.",
		"<b>Nuvem Sombria</b>: vizinhança com fama de amaldiçoada, para onde são mandados os indesejados das famílias nobres.",
		"<b>A Sopa</b>: zona de laboratórios onde as sarjetas são rios de ingredientes alquímicos com propriedades imprevisíveis."
	];

	/* ------------------------------------------------------------------ */
	/* 3. Atores: tokens de apoio e ligação com as fichas das aventuras     */
	/* ------------------------------------------------------------------ */
	const SEM_FICHA = "<b>Não tem ficha no livro.</b> Este ator existe para o token no mapa e para mostrar aos jogadores. Use as regras de NPC do livro básico se precisar de números.";
	const atores = {};
	const ligados = {};
	const TODOS = [...NUCLEOS.flatMap((n) => n.gente.map((g) => ({ ...g, nucleo: n.k }))), ...GUARDA.map((g) => ({ ...g, nucleo: "guarda" }))];
	// Fichas de outras aventuras: o primeiro ator (de outra marca) cujo nome contém o trecho.
	// Replicoides da Aventura 6 têm o nome do original e ficam de fora.
	const achar = (trecho) => game.actors.find((a) => a.getFlag("world", "fdt") !== TAG && a.name.includes(trecho) && !/Replicoide/.test(a.name));
	for (const g of TODOS) {
		if (g.busca) {
			const a = achar(g.busca);
			if (a) ligados[g.k] = a;
			continue;
		}
		atores[g.k] = await criarNPC({
			name: g.nome, role: g.k, img: g.novo.img, disposition: 1, link: true, nd: 1, tipo: g.novo.tipo, raca: g.novo.raca,
			papel: "special", atr: g.novo.atr, pv: 10, def: 10, bio: p(g.publico, ...g.bio, SEM_FICHA)
		});
	}
	const ficha = (k) => atores[k] ?? ligados[k];
	const nomeLink = (g) => (ficha(g.k) ? L(ficha(g.k)) : `<b>${g.nome}</b>`);

	/* ------------------------------------------------------------------ */
	/* 4. Macros                                                            */
	/* ------------------------------------------------------------------ */

	/** Deslocamento pela cidade: cada hexágono do mapa é meia hora de caminhada. */
	async function macroDeslocamento(D) {
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Valkaria · Deslocamento" },
			position: { width: 460 },
			content: `
				<p>Cada <b>hexágono</b> do mapa de Valkaria é <b>meia hora</b> de caminhada (cinco minutos numa metrópole do nosso mundo). Montaria não ajuda: todos dividem as mesmas ruas estreitas e lotadas.</p>
				<div class="form-group"><label>Hexágonos</label><input type="number" name="hex" value="1" min="0" step="1"></div>
				<div class="form-group"><label>Como</label><select name="modo">
					<option value="pe">A pé ou montado (30 min por hexágono)</option>
					<option value="carroca">Carroça de Lagarto Interno pronta (5 min por hexágono)</option></select></div>
				<div class="form-group"><label>Avançar o relógio do mundo</label><input type="checkbox" name="avancar"></div>
				<div class="form-group"><label>Só para o Mestre</label><input type="checkbox" name="mestre"></div>`,
			ok: { label: "Calcular", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const hex = Math.max(0, Math.floor(Number(res.hex) || 0));
		const porHex = res.modo === "carroca" ? 5 : 30;
		const min = hex * porHex;
		const h = Math.floor(min / 60);
		const m = min % 60;
		const tempo = h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
		let html = `<h3>Deslocamento em Valkaria</h3><p><b>${hex}</b> hexágono(s) ${res.modo === "carroca" ? "de Carroça de Lagarto Interno" : "a pé"}: <b>${tempo}</b>.</p>`;
		if (res.modo === "pe" && hex) html += `<p style="font-size:0.85em">No caminho é preciso desviar de uma construção gigantesca, esperar uma comitiva nobre passar, evitar um duelo de feiticeiros, espremer-se numa multidão...</p>`;
		if (min >= 8 * 60) html += `<p>${D.longe}</p>`;
		if (res.avancar && min) {
			await game.time.advance(min * 60);
			html += `<p style="font-size:0.85em">Relógio do mundo avançado em ${tempo}.</p>`;
		}
		await ChatMessage.create({ content: html, whisper: res.mestre ? ChatMessage.getWhisperRecipients("GM") : [] });
	}

	/** Os Valkarianos Notáveis: mostrar, abrir a ficha ou pôr o token na cena. */
	async function macroNotaveis(D) {
		const TAG = "a2ruas";
		const ator = (g) => game.actors.find((a) => a.getFlag("world", "fdt") === TAG && a.getFlag("world", "fdtRole") === g.k)
			?? (g.busca ? game.actors.find((a) => a.getFlag("world", "fdt") !== TAG && a.name.includes(g.busca) && !/Replicoide/.test(a.name)) : null);
		const op = D.nucleos.map((n) => `<optgroup label="${n.nome}">${D.gente.filter((g) => g.nucleo === n.k).map((g) => `<option value="${g.k}">${g.nome}</option>`).join("")}</optgroup>`).join("");
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Valkaria · Notáveis" },
			position: { width: 520 },
			content: `
				<div class="form-group"><label>Notável</label><select name="k">${op}</select></div>
				<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="mestre">Mostrar ao Mestre (tudo, com os segredos)</option>
					<option value="jogadores">Mostrar aos jogadores (só o que se sabe)</option>
					<option value="ficha">Abrir a ficha</option>
					<option value="token">Pôr o token na cena</option>
					<option value="nucleo">Listar o núcleo inteiro ao Mestre</option></select></div>
				<p style="font-size:0.85em">Quem tem ficha numa aventura usa essa ficha (importe a aventura). Os demais têm um token de apoio, sem ficha no livro.</p>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const g = D.gente.find((x) => x.k === res.k);
		if (!g) return;
		const nucleo = D.nucleos.find((n) => n.k === g.nucleo);
		const a = ator(g);
		const whisper = ChatMessage.getWhisperRecipients("GM");
		const img = a ? `<img src="${a.img}" width="64" height="64" style="float:right;border:none;margin-left:6px">` : "";
		if (res.acao === "nucleo") {
			const linhas = D.gente.filter((x) => x.nucleo === g.nucleo).map((x) => {
				const y = ator(x);
				return `<li>${y ? `@UUID[${y.uuid}]{${x.nome}}` : `<b>${x.nome}</b> (sem ficha neste mundo)`}: ${x.publico}</li>`;
			});
			return ChatMessage.create({ whisper, content: `<h3>${nucleo.nome}</h3><p>${nucleo.intro}</p><ul>${linhas.join("")}</ul>` });
		}
		if (res.acao === "jogadores") {
			return ChatMessage.create({ content: `${img}<h3>${g.nome}</h3><p>${g.publico}</p><p style="font-size:0.85em;clear:both">${nucleo.nome}</p>` });
		}
		if (res.acao === "mestre") {
			return ChatMessage.create({ whisper, content: `${img}<h3>${g.nome}</h3><p><i>${nucleo.nome}</i></p><p>${g.publico}</p>${g.bio.map((t) => `<p>${t}</p>`).join("")}
				<p style="font-size:0.85em;clear:both">${a ? `Ficha: @UUID[${a.uuid}]{${a.name}}` : `Sem ficha neste mundo${g.fonte ? `: importe ${g.fonte}` : ""}.`}</p>` });
		}
		if (!a) return ui.notifications.warn(`${g.nome} não tem ficha neste mundo${g.fonte ? `: importe ${g.fonte}` : ""}.`);
		if (res.acao === "ficha") return a.sheet.render(true);
		if (!canvas.scene) return ui.notifications.warn("Abra uma cena primeiro.");
		const gs = canvas.grid.size;
		const x = Math.round((canvas.stage.pivot.x - gs / 2) / gs) * gs;
		const y = Math.round((canvas.stage.pivot.y - gs / 2) / gs) * gs;
		await canvas.scene.createEmbeddedDocuments("Token", [(await a.getTokenDocument({ x, y })).toObject()]);
		ui.notifications.info(`${a.name} colocado no centro da tela.`);
	}

	/** A Guarda de Valkaria: o juramento, os direitos dos suspeitos e as regras de conduta. */
	async function macroGuarda(D) {
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Guarda · Juramento e Direitos" },
			position: { width: 480 },
			content: `
				<div class="form-group"><label>O que mostrar</label><select name="acao">
					<option value="juramento">Juramento da Guarda (os selecionados juram)</option>
					<option value="direitos">Direitos dos Suspeitos (ao prender alguém)</option>
					<option value="forca">Níveis de força permitidos</option>
					<option value="punicoes">Punições a guardas</option>
					<option value="cargos">Quem é quem na Guarda</option></select></div>
				<div class="form-group"><label>Crime do suspeito (para os direitos)</label><input type="text" name="crime" placeholder="roubo de um item mágico"></div>`,
			ok: { label: "Mostrar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const lista = (pares) => `<ul>${pares.map(([t, d]) => `<li><b>${t}.</b> ${d}</li>`).join("")}</ul>`;
		let html = "";
		if (res.acao === "juramento") {
			const quem = canvas.tokens?.controlled.map((t) => t.name) ?? [];
			html = `<h3>Juramento da Guarda de Valkaria</h3>${quem.length ? `<p><i>Juram: ${quem.join(", ")}.</i></p>` : ""}<blockquote>${D.juramento.join("<br>")}</blockquote>`;
		} else if (res.acao === "direitos") {
			const crime = String(res.crime ?? "").trim() || "(crime do qual o suspeito é acusado)";
			html = `<h3>Direitos dos Suspeitos</h3><blockquote>“${D.direitos.replace("{crime}", crime)}”</blockquote>`;
		} else if (res.acao === "forca") {
			html = `<h3>Ninguém Acima da Lei: níveis de força</h3>${lista(D.forca)}<p>Ao capturar, recite os direitos. Suspeitos são interrogados; quem é pego em flagrante passa aos Juízes de Khalmyr, e os guardas só fornecem provas e testemunhas. Depois, relatórios e papelada.</p>`;
		} else if (res.acao === "punicoes") {
			html = `<h3>Punições a guardas</h3>${lista(D.punicoes)}`;
		} else {
			html = `<h3>Quem é quem na Guarda</h3>${lista(D.cargos)}`;
		}
		await ChatMessage.create({ content: html });
	}

	/** Vazios no mapa: o grupo dá nome e identidade às vizinhanças sem nome. */
	async function macroVazios(D) {
		const MARCA = "a2ruasMapa";
		const NOME = "Nossa Valkaria · Vizinhanças do Grupo";
		const res = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Valkaria · Vazios no Mapa" },
			position: { width: 500 },
			content: `
				<p>Quando os personagens passarem por uma região sem nome, pergunte ao grupo que lugar é esse. Cada vizinhança vira uma página do diário <i>${NOME}</i>, que o gerador não apaga.</p>
				<div class="form-group"><label>O que fazer</label><select name="acao">
					<option value="registrar">Registrar uma vizinhança</option>
					<option value="listar">Listar as vizinhanças do grupo</option>
					<option value="ideias">Mostrar exemplos do livro</option></select></div>
				<div class="form-group"><label>Nome</label><input type="text" name="nome" placeholder="Meia-Cidade"></div>
				<div class="form-group"><label>Onde no mapa</label><input type="text" name="onde" placeholder="coluna F, linha 7"></div>
				<div class="form-group"><label>Quem sugeriu</label><input type="text" name="quem"></div>
				<div class="form-group stacked"><label>Identidade do lugar</label><textarea name="desc" rows="3" placeholder="Um bairro hynne dominado por contrabandistas de itens mágicos."></textarea></div>`,
			ok: { label: "Aplicar", callback: (ev, button) => Object.fromEntries(new FormData(button.form)) }
		});
		if (!res) return;
		const whisper = ChatMessage.getWhisperRecipients("GM");
		if (res.acao === "ideias") {
			return ChatMessage.create({ whisper, content: `<h3>Vazios no mapa</h3><p>Valkaria acomoda tudo o que você e o grupo imaginarem. Exemplos:</p><ul>${D.ideias.map((t) => `<li>${t}</li>`).join("")}</ul><p>Aproveite os adesivos e marque essas vizinhanças no mapa, tornando-o único.</p>` });
		}
		let diario = game.journal.find((j) => j.getFlag("world", "fdt") === MARCA);
		if (res.acao === "listar") {
			const paginas = diario ? diario.pages.contents : [];
			return ChatMessage.create({ whisper, content: `<h3>${NOME}</h3>${paginas.length ? `<ul>${paginas.map((pg) => `<li>@UUID[${pg.uuid}]{${pg.name}}</li>`).join("")}</ul>` : "<p>Nenhuma vizinhança registrada ainda.</p>"}` });
		}
		const nome = String(res.nome ?? "").trim();
		if (!nome) return ui.notifications.warn("Dê um nome à vizinhança.");
		diario ??= await JournalEntry.create({ name: NOME, flags: { world: { fdt: MARCA } } });
		const esc = (s) => String(s ?? "").trim().replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]);
		const conteudo = `${res.onde ? `<p><b>No mapa:</b> ${esc(res.onde)}</p>` : ""}<p>${esc(res.desc) || "<i>Identidade a definir.</i>"}</p>${res.quem ? `<p><i>Ideia de ${esc(res.quem)}.</i></p>` : ""}`;
		const [pg] = await diario.createEmbeddedDocuments("JournalEntryPage", [{ name: nome, type: "text", sort: (diario.pages.size + 1) * 100, text: { content: conteudo, format: 1 } }]);
		await ChatMessage.create({ whisper, content: `<p>Nova vizinhança em ${NOME}: @UUID[${pg.uuid}]{${pg.name}}.</p>` });
	}

	const macro = (name, img, fn, dados = null) => ({
		name,
		type: "script",
		img,
		folder: pasta.Macro,
		flags: FLAGS(),
		command: `// Fim dos Tempos · Arco 2 · As Ruas Traiçoeiras de Valkaria · gerado por a2-ruas-valkaria.js\n${dados ? `const DADOS = ${JSON.stringify(dados)};\n` : ""}(${fn.toString()})(${dados ? "DADOS" : ""});`
	});
	const FONTE = { metais: "", stremtol: "", rocha: "a Aventura 3", terceira: "a Aventura 4", lena: "a Aventura 5", nobres: "a Aventura 6", guarda: "a Aventura 0" };
	const CARGOS = [
		["Dama da Justiça", "Xarynn Libra, eleita pelos Lordes Urbanos. Chefia toda a Guarda."],
		["Reguladores", "Figurões de um conselho, sob a vigilância dos Juízes de Khalmyr. Cada Xerife responde a um Regulador."],
		["Xerife", "Comanda uma guarita com bastante autonomia, dentro das regras básicas da Guarda. Escolhe os detetives e a prioridade dos casos."],
		["Detetives", "Investigam cenas de crime, suspeitos, desaparecidos e casos de todo tipo. Quase aventureiros a serviço da Guarda; agem em duplas ou equipes. Não fazem rondas nem portam apito. Ganham por caso resolvido no mês: quanto mais provas, mais o caso rende. Heróis de confiança podem receber o posto honorário."],
		["Alcaides", "Comandantes de equipes de patrulha (portões, áreas de patrulha intensa). Mesmo nível dos detetives, mas em geral não ascendem."],
		["Patrulheiros", "O posto mais baixo e o maior contingente: rondas em duplas ou pequenos grupos, apito, primeiros a responder. Salário fixo da cidade; rodam entre guaritas. Chamam detetives para todo crime que não viram com os próprios olhos."],
		["Guarda do Palácio", "Protege o Palácio Imperial e arredores, com prestígio e pouquíssima liberdade. Nunca atua em outras áreas."],
		["Guarda Arcana", "Arcanistas, clérigos, inventores e outros: magia de adivinhação nas cenas, traços mágicos, pesquisa e, recentemente, autópsias. Raramente entram na ação."]
	];
	const GENTE_MACRO = TODOS.map(({ k, nucleo, nome, busca, publico, bio }) => ({ k, nucleo, nome, busca, publico, bio, fonte: FONTE[nucleo] || "" }));
	const NUCLEOS_MACRO = [...NUCLEOS.map(({ k, nome, intro }) => ({ k, nome, intro })), { k: "guarda", nome: "A Guarda de Valkaria", intro: "A Guarita da Praia, na Cidade da Praia (um antigo mosteiro cercado por um espelho d'água), e a chefia da Guarda." }];
	const LONGE = "Grandes distâncias: a maioria dos valkarianos vive numa área da cidade e quase nunca vai longe. Quando precisa, dorme pelo menos uma noite numa estalagem, como numa jornada pelos ermos. Comprar algo de um leiloeiro do outro lado da cidade pode levar dois ou três dias.";
	const macros = await Macro.createDocuments([
		macro("Valkaria · Deslocamento", "icons/svg/clockwork.svg", macroDeslocamento, { longe: LONGE }),
		macro("Valkaria · Notáveis", "icons/svg/mystery-man.svg", macroNotaveis, { nucleos: NUCLEOS_MACRO, gente: GENTE_MACRO }),
		macro("Guarda · Juramento e Direitos", `${C}/paladino.webp`, macroGuarda, { juramento: JURAMENTO, direitos: DIREITOS, forca: FORCA, punicoes: PUNICOES, cargos: CARGOS }),
		macro("Valkaria · Vazios no Mapa", "icons/svg/village.svg", macroVazios, { ideias: VAZIOS_IDEIAS })
	]);
	const linkMacro = (trecho) => {
		const m = macros.find((x) => x.name.includes(trecho));
		return m ? `@UUID[${m.uuid}]{${m.name}}` : trecho;
	};

	/* ------------------------------------------------------------------ */
	/* 5. Diário                                                            */
	/* ------------------------------------------------------------------ */
	const pagina = (name, content, sort) => ({ name, type: "text", sort, text: { content, format: 1 } });
	const lista = (itens) => `<ul>${itens.map((t) => `<li>${t}</li>`).join("")}</ul>`;
	// Diários e fichas de outras aventuras, quando já estão no mundo.
	const diarioDe = (prefixo) => game.journal.find((j) => j.getFlag("world", "fdt") !== TAG && j.name.startsWith(prefixo));
	const AV = Object.fromEntries([0, 1, 2, 3, 4, 5, 6, 7].map((n) => [n, diarioDe(`Arco 2 · Aventura ${n} `)]));
	const avLink = (n, txt) => (AV[n] ? `${L(AV[n])}` : `<i>${txt}</i>`);
	const leiOrdem = game.actors.find((a) => a.getFlag("world", "fdtRole") === "leiordem");
	const margebell = game.actors.find((a) => a.getFlag("world", "fdt") !== TAG && a.name === "Madame Margebell");
	const pistasStremtol = game.actors.find((a) => a.getFlag("world", "fdt") !== TAG && a.name.startsWith("Vizinhança de Stremtol"));
	const pessoa = (g) => `<h3>${nomeLink(g)}</h3><p><i>${g.publico}</i></p>${g.bio.map((t) => `<p>${t}</p>`).join("")}`;
	const NUCLEO_EXTRA = {
		academia: "<p><i>Felicia é a namorada de Belinda, das Colinas Centrais (Arco 1).</i></p>",
		stremtol: `<p>Na Aventura 1 (${avLink(1, "Aventura 1")}) a vizinhança é investigada: veja ${pistasStremtol ? L(pistasStremtol) : "o ator de pistas de Stremtol"} e ${margebell ? L(margebell) : "Madame Margebell"}, da Escola de Etiqueta que \"regenerou\" Ysmenne e Rosa.</p>`,
		rocha: `<p>Aventura: ${avLink(3, "Aventura 3 · Fuga da Rocha Cinzenta")}.</p>`,
		terceira: `<p>Aventura: ${avLink(4, "Aventura 4")}.</p>`,
		lena: `<p>Aventura: ${avLink(5, "Aventura 5")}. <i>A ordem dos nomes de Ozeanna, Vancort e Mildred no livro é ambígua (texto em colunas); veja o guia do gerador.</i></p>`,
		nobres: `<p>Aventura: ${avLink(6, "Aventura 6 · Baile de Debutantes Sangrento")}.</p>`
	};
	const paginaNucleo = (n, i) => pagina(n.nome, `
		<p>${n.intro}</p>
		${n.gente.map(pessoa).join("")}
		${n.bandas ? `<h2>As bandas</h2>${lista(n.bandas.map(([b, d]) => `<b>${b}:</b> ${d}`))}` : ""}
		${NUCLEO_EXTRA[n.k] ?? ""}`, 500 + i * 10);

	const fichasNovas = Object.values(atores);
	const fichasLigadas = Object.values(ligados);
	await JournalEntry.create({
		name: "Arco 2 · As Ruas Traiçoeiras de Valkaria",
		folder: pasta.JournalEntry,
		flags: FLAGS("diarioRuas"),
		pages: [
			pagina("Guia do Mestre", `
				<p>Este diário traz o capítulo de introdução do Arco 2: como montar e mestrar a campanha em Valkaria, os <b>Valkarianos Notáveis</b> de cada núcleo e a <b>Guarda de Valkaria</b>. A descrição completa da cidade está no <i>Atlas de Arton</i> (pp. 69–77); as fichas de algumas criaturas, em <i>Ameaças de Arton</i>.</p>
				<h2>Ferramentas</h2>
				${lista([
					`${linkMacro("Deslocamento")}: tempo de viagem pelo mapa (1 hexágono = meia hora; a Carroça de Lagarto Interno pronta faz em 5 minutos). Pode avançar o relógio do mundo.`,
					`${linkMacro("Notáveis")}: escolhe um notável e mostra ao Mestre (com os segredos) ou aos jogadores (só o que se sabe), abre a ficha ou põe o token na cena.`,
					`${linkMacro("Juramento")}: o juramento da Guarda, os Direitos dos Suspeitos (com o crime), os níveis de força, as punições e os cargos.`,
					`${linkMacro("Vazios")}: registra as vizinhanças sem nome que o grupo inventar, num diário próprio que o gerador nunca apaga.`,
					`${leiOrdem ? L(leiOrdem) : "O contador de Lei &amp; Ordem (Aventura 0)"} continua sendo o relógio do arco.`
				])}
				<h2>Fichas</h2>
				<p><b>Tokens de apoio</b> (sem ficha no livro): ${fichasNovas.map(L).join(", ")}.</p>
				<p><b>Fichas das aventuras</b> ligadas aqui: ${fichasLigadas.length ? fichasLigadas.map(L).join(", ") : "importe as aventuras do Ato 2 para ver os links"}.</p>`, 100),
			pagina("Montando a Campanha", `
				<h2>O vilão e seu objetivo</h2>
				<p>O vilão de Fim dos Tempos é o <b>Dr. Arthemus Vesper</b>, inventor kliren que caiu em Arton com a tripulação da Roca, seu gog'magogue, num plano ensandecido para acabar com o tempo. No Arco 1 seus desígnios eram cumpridos por Syvarian, honrado mas implacável. No Arco 2, por <b>Ghorskander</b>, o oficial médico da Roca: um sádico que faz experimentos em cobaias inteligentes e manipula e tortura até os aliados.</p>
				<p>Ghorskander quer instaurar pânico, medo, insegurança e violência, afundando a capital no caos, e ao mesmo tempo manipular a alta nobreza. Se tudo funcionar, Valkaria afunda em crime, culminando no ataque de um gigantesco <b>lagarto-trovão mutante mecanizado</b>, enquanto os aventureiros da capital estão sem suas capacidades especiais e a aristocracia está enredada numa seita. Os nobres então apoiam e financiam a única figura que lhes oferece segurança: o Dr. Vesper, que terá meios para criar as máquinas que acabam com o tempo. Autoridades e grandes heróis estarão desacreditados.</p>
				<h2>Valkaria</h2>
				<p>A maior cidade do mundo conhecido: todas as raças, aventureiros, deuses e reinos, e coisas que parecem só existir aqui (irmandades criminosas, vigilantes mascarados, uma prisão que limita aventureiros, a política intrincada, a estátua de uma deusa). O preço: sempre há várias ameaças globais em curso, e os personagens não podem chamar a Rainha-Imperatriz ou um campeão épico. São os únicos responsáveis por deter o inimigo, com a ajuda de patrulheiros, detetives e cidadãos.</p>
				<h2>Personagens apropriados</h2>
				<p>O ideal são os mesmos do Arco 1. Personagens novos começam no <b>7º nível</b> e <b>não</b> devem ser nativos de Valkaria: chegar à metrópole, ser desafiado e acolhido por ela é parte da experiência. O grupo precisa de combate, furtividade, magia, cura e principalmente interação social. Quem não convive em ambiente urbano ou com NPCs (fanáticos de Megalokk ou Aharadak, druidas intolerantes, quem odeia um povo) não se encaixa bem; converse. Nenhuma raça é estranha demais para Valkaria. Quem quer fazer parte da sociedade (negócios, nobreza, cargos públicos, tavernas, casamento) aproveita mais.</p>
				<p>O arco presume que o grupo fixa raízes em Valkaria e trabalha com a Guarda como detetives independentes. Não force: alguns NPCs sugerem a parceria; se houver dúvida, converse e explique a proposta. O grupo pode até agir do lado errado da lei.</p>
				<h2>Leitura e preparação</h2>
				<p>A campanha é uma caixa de areia cheia de NPCs: o ideal é ler o livro todo antes da primeira aventura e conhecer as subtramas paralelas (a ascensão do crime, o desaparecimento de nobres, o comportamento estranho da Companhia dos Irmãos, as lendas urbanas). Os vídeos da stream ajudam a ver o caos se desenrolando, mas não é preciso imitar ninguém. Se algo diminuir a sua diversão, descarte.</p>
				<h2>Testes sociais</h2>
				<p>Um \"teste social\" é um teste de perícia de interação: Diplomacia, Enganação ou Intimidação; a critério do mestre, outras como Atuação.</p>
				<h2>Complicando as coisas</h2>
				<p>O Arco 1 foi propositalmente simples (preparação e combate). As aventuras do Arco 2 têm em geral três partes (duas de investigação ou interação, depois combate ou ação), várias resoluções e muitos coadjuvantes; NPCs famosos infestam a capital. Nenhum \"erro\" ao mestrar tem consequência no mundo real. Em troca, há muito mais diversão para o mestre: um baile, um show de bardos arruaceiros, uma perseguição aérea, uma caçada nos esgotos, uma revolta na prisão.</p>
				<h2>Ordem das aventuras</h2>
				<p>A <b>Aventura 0</b> apresenta Valkaria e a Guarda e termina no juramento de detetives, com um quadro de seis casos (as Aventuras 1 a 6), jogáveis em qualquer ordem. Pela mecânica de Lei &amp; Ordem, é quase impossível resolver todos: o grupo escolhe os mais interessantes e úteis contra a Roca. A <b>Aventura 2</b> só pode ser escolhida quando Vectora chega à cidade (e pode ser ignorada: o grupo original fez isso). A <b>Aventura 7</b> não é escolhida: começa quando Lei &amp; Ordem chega a zero.</p>
				<h2>Fases e cenas</h2>
				<p>As aventuras são divididas em <b>fases</b>, não cenas: são conjuntos de situações, não histórias predeterminadas. Quando uma fase se resolve num só lugar ou com um só grupo de NPCs, ela é uma cena. Em princípio, considere uma fase uma cena e adapte.</p>
				<h2>Materiais adicionais</h2>
				<p>Não é preciso repetir as descrições ou as caixas de texto ao pé da letra; o importante é todos se comunicarem. Sem o <i>Atlas de Arton</i>, junte o que o livro e a stream dizem de cada lugar (a Baixa Vila de Lena é um bairro boêmio, por exemplo) ou proponha uma vaquinha pela versão digital. Sem <i>Ameaças de Arton</i>, use equivalentes do livro básico (este módulo já traz as fichas montadas).</p>
				<h2>Mestrando sem preparação</h2>
				${lista([
					"Encare o jogo como um jogo: você descobre a aventura junto com o grupo.",
					"Comece cada aventura com o grupo escolhendo um caso no Quadro de Casos da Guarita da Praia e leia em voz alta a fase 0.",
					"Os jogadores cuidam de tudo que não depende de você: calculam o tempo de deslocamento no mapa (use a macro), fazem compras pelo livro básico (em Valkaria quase tudo está à venda) e listam as ações que dependem de você, de preferência uma por jogador, já em ordem.",
					"Enquanto isso, leia os títulos das fases, os NPCs em negrito e as listas de pistas.",
					"Resolva as ações; peça a um jogador que leia em voz alta a descrição de um NPC se ajudar. Todos podem dar dicas (\"o livro diz que Finley é desastrado...\").",
					"Na próxima fase, leia em voz alta também o texto explicativo antes do itálico. Diga as opções claras e quantas pistas há.",
					"Um jogador separa as fichas de Ameaças de Arton e lembra habilidades; outro lembra de ajustar CDs e quantidade de inimigos ao nível do grupo.",
					"Perto do fim, faça um momento de metajogo para discutir o desenrolar mais lógico. Leia <i>O que Realmente Aconteceu</i> antes da cena final."
				])}`, 200),
			pagina("Mestrando em Valkaria", `
				<p>Todos os elementos de Arton estão aqui (vilões, monstros, masmorras, armadilhas), mas num contexto maior: tudo o que o grupo faz tem consequências, e os coadjuvantes têm vidas que não giram em torno dele.</p>
				<h2>Imigrantes</h2>
				<p>O que é novo para os jogadores também é novo para os personagens. Ressalte o tamanho de tudo: a estátua impossivelmente alta, multidões infinitas, idiomas sem fim, cheiros fétidos e deliciosos. Parques, irmandades, vigilantes mascarados, bairros bem definidos: muito é único. Há imigrantes de toda parte, então tramas pessoais de qualquer canto de Arton cabem aqui (a irmã assassina da cavaleira de Bielefeld pode estar em Valkaria atrás de contatos ou refúgio).</p>
				<h2>Beleza e feiura</h2>
				<p>Metrópole mágica ou buraco fétido? <b>Sim.</b> Luxo e pobreza, magia e banalidade, maravilhas e horrores, lado a lado: uma árvore abençoada por Allihanna ao lado de uma taverna da Companhia dos Irmãos; um círculo de teleporte numa praça de execuções. Às vezes se confundem: a maga no tapete voador procurando um sapateiro é maravilhosa ou banal? Não amenize o feio nem diminua o belo. Quem vive em Valkaria aceita os contrastes.</p>
				<h2>Distâncias</h2>
				<p>Não há calçada: pessoas, animais e veículos dividem ruas estreitas e serpenteantes, sem planejamento. O que levaria cinco minutos leva <b>meia hora</b>. Por isso os valkarianos estão sempre com pressa e as naves aéreas são comuns. A maioria vive numa área e raramente vai longe; quando vai, dorme numa estalagem. Aventureiros são a exceção e podem ser o elo entre NPCs de bairros distantes.</p>
				<h2>Anacronismo</h2>
				<p>Valkaria se parece mais com São Paulo, Nova York, Londres ou Tóquio do que com outras cidades de fantasia. Bardos formam bandas e tocam em casas de espetáculo; o povo teme irmandades, não guildas de ladrões; detetives investigam; cidadãos votam em Lordes Urbanos; arautos distribuem panfletos; a Gazeta do Reinado espalha notícias; turistas visitam as maravilhas. Nada é genérico: não há \"uma oficina de ferreiro\", há o império Metais do Baixote e seus concorrentes, e brasões e \"logotipos\" nas fachadas. Há nobres e altos nobres, miseráveis, abastados e uma enorme classe média em prédios de apartamentos e subúrbios pacatos. Não transforme Valkaria em paródia de uma cidade real, mas lembre que o cotidiano dos valkarianos se parece mais com o nosso que com o de uma vila artoniana.</p>
				<h2>Heróis por toda parte</h2>
				<p>Campeões das Colinas no 7º nível, os personagens chegam como peixes pequenos e, mesmo no fim do arco, serão apenas alguns dos heróis poderosos da capital. O valkariano médio é esperto, cosmopolita e calejado: diante de um necromante enfrentando aventureiros, protege-se, mas não interrompe o caminho. Quase todos já viram um combate assim (o cerco da Guerra Artoniana, os minotauros nos portões). O grupo é especial para os amigos, as vizinhanças e os detetives da Guarita da Praia, e faz parte da grande tradição de heróis valkarianos. <b>A capital não vira as costas para os seus.</b></p>
				<h2>Bairrismo</h2>
				<p>Quem mora aqui diz que é \"de Valkaria\", não anão ou deheoni. Pode reclamar à vontade da cidade, mas, se um forasteiro disser o mesmo, atrai sua fúria: para criticar Valkaria, é preciso abraçar Valkaria. Entre valkarianos, porém, vale o bairro:</p>
				${lista([
					"<b>Cidade da Praia:</b> afastada do centro, sotaque próprio, menos abastada, considerada \"menos valkariana\", e por isso defende o bairro com ferocidade. Odeia os esnobes do Refúgio da Felicidade.",
					"<b>Refúgio da Felicidade:</b> novos ricos que se dizem \"verdadeiros valkarianos\" e são chamados de \"falsos valkarianos\" pela Cidade da Praia e pelos nobres tradicionais do Bairro do Recomeço.",
					"<b>Baixa Vila de Lena:</b> sem rivalidades, mas com manias próprias. O bairro boêmio fica acordado à noite; tudo o que é moderno na arte nasceu ou passou por aqui. Alguns artistas o acham um bairro de fingidores."
				])}
				<p>Os valkarianos são bairristas e têm opinião sobre tudo. Agora que o grupo faz parte da capital, vai adquirir essas lealdades e rivalidades.</p>`, 300),
			pagina("Usando o Mapa e Vazios no Mapa", `
				<h2>Usando o mapa</h2>
				<p>O mapa tem linhas e colunas para orientação, mas em jogo vale a divisão em <b>hexágonos</b>: cada um é <b>meia hora de caminhada</b> (pouco mais de cinco minutos numa metrópole do nosso mundo). Controle o tempo para visualizar como o grupo se desloca; quando todos se acostumarem com o ritmo, descreva os deslocamentos de forma mais abstrata. Use ${linkMacro("Deslocamento")}.</p>
				<h2>Vazios no mapa</h2>
				<p>Nem toda vizinhança tem nome ou descrição, de propósito: Valkaria acolhe toda interpretação de si mesma. Quando os personagens passarem por uma região sem nome, pergunte ao grupo que lugar é esse:</p>
				${lista(VAZIOS_IDEIAS)}
				<p>Só você e o grupo podem decidir. Marque essas vizinhanças no mapa: sem essas intervenções, Valkaria nunca estará completa na sua mesa. Registre-as com ${linkMacro("Vazios")}.</p>`, 400),
			pagina("Valkarianos Notáveis", `
				<p>Contatos importantes do grupo ou NPCs centrais das aventuras, divididos em núcleos pelos lugares onde podem ser encontrados. Lugares sem descrição aqui estão no <i>Atlas de Arton</i>. Cada núcleo tem uma página.</p>
				${lista([...NUCLEOS.map((n) => `<b>${n.nome}:</b> ${n.gente.map(nomeLink).join(", ")}`), `<b>A Guarda de Valkaria:</b> ${GUARDA.map(nomeLink).join(", ")}`])}
				<p>Mostre qualquer um com ${linkMacro("Notáveis")}.</p>`, 450),
			...NUCLEOS.map(paginaNucleo),
			pagina("A Guarda de Valkaria", `
				<p>Uma instituição antiga, com tradições de ordens de cavalaria de Lamnor, que muda com a cidade. Até a Guerra Artoniana, era quase militar: capitães, sargentos, salário fixo e um quartel por região. O influxo de veteranos e refugiados tornou isso inviável: os casos pulavam de quartel em quartel e os próprios quartéis eram realocados. Pior, os cofres secaram (a guerra, o sumiço da Rainha-Imperatriz, o ouro que \"sumiu\" nos jogos de poder): sem salário, os guardas faziam missões de aventureiro e eram incentivados a ser incompetentes no emprego. A Guarda virava uma irmandade que só se mexia por recompensa. Após a guerra, as maiores autoridades, incluindo a Rainha-Imperatriz, reformularam tudo.</p>
				<h2>Quem é a lei</h2>
				<p>Não há mais quartéis, mas <b>guaritas</b>, cada uma comandada por um <b>Xerife</b>, que responde a um <b>Regulador</b> (de um conselho vigiado pelos Juízes de Khalmyr). Abaixo vêm os <b>detetives</b> (quase aventureiros, com restrições; heróis de confiança podem receber o posto honorário) e os <b>patrulheiros</b>, com seus <b>alcaides</b>.</p>
				<p>A jurisdição não depende de geografia: qualquer cidadão procura qualquer guarita, e há <b>caixas de mensagens</b> pela cidade para queixas endereçadas à guarita preferida. O regulamento manda investigar todos os casos que chegam assim. Cada Xerife define as prioridades (alguns designam, outros deixam os detetives escolher, alguns deixam a vítima escolher o detetive).</p>
				<p>As guaritas são <b>apadrinhadas</b> por negócios, famílias nobres, igrejas, heróis ou torres de magos. Como qualquer um pode recorrer a qualquer guarita, uma guarita eficiente perto de um palacete só atrai o povo à zona rica. O trunfo da Guarda contra aventureiros e mercenários é a eficiência e a honestidade; queixas contra guardas vão direto aos Juízes de Khalmyr, e as guaritas vigiam umas às outras. Dizem que alguns nobres espalham boatos contra os ricaços que não contribuem.</p>
				<p>Os <b>detetives ganham por caso resolvido no mês</b>, com provas materiais ou testemunhos: quanto mais sólido o caso, mais rende. Isso não impede conspirações com provas forjadas e testemunhas enfeitiçadas, e faz os casos insolúveis passarem de mão em mão como batatas quentes. Os <b>patrulheiros</b> continuam pagos e equipados pela cidade e rodam entre guaritas; quando promovidos, são escolhidos por um Xerife (ou viram alcaides, ou são dispensados).</p>
				<p><i>No sistema judicial valkariano, o povo é representado por dois grupos separados e igualmente importantes: a Guarda, que investiga os crimes, e os promotores, que trazem os criminosos à justiça. Essas são suas histórias. DUN-DUN!</i></p>
				<h2>O Alto Comando</h2>
				<p>Os <b>Lordes Urbanos</b> (um para cada bairro, outros para vários bairros, como o Lorde Urbano dos Andares Acima do Terceiro, e outros para pequenas áreas, como o Lorde Urbano das Oficinas na Cidade da Praia) elegem o <b>Lorde (ou Dama) da Justiça</b>, chefe de toda a Guarda. Os votos têm pesos que mudam: o Lorde Urbano dos Telhados Nevados não vota em invernos \"muito rigorosos\"; o dos Quartéis com Mais de Vinte Soldados tem voto triplicado se há guerra perto de Deheon; um clérigo de Oceano perdeu sendo o mais votado porque a chuva torrencial reduziu seus votos como reprimenda ao deus. Qualquer um pode se candidatar (um ex-morador de rua foi dos mais celebrados), mas quase sempre vencem altos nobres ou guardas experientes.</p>
				${pessoa(GUARDA[0])}
				<h2>Cargos e divisões</h2>
				${lista(CARGOS.map(([t, d]) => `<b>${t}:</b> ${d}`))}
				<h2>Juramento da Guarda de Valkaria</h2>
				<blockquote>${JURAMENTO.join("<br>")}</blockquote>
				<p>Use ${linkMacro("Juramento")} quando o grupo jurar, no fim da Aventura 0 (${avLink(0, "Aventura 0")}).</p>`, 700),
			pagina("Ninguém Acima da Lei", `
				<p>Para um herói a serviço da Guarda, não basta resolver o mistério e matar os criminosos. <b>Todo guarda deve fazer um esforço real para capturar suspeitos com vida</b>, por mais perigosos que sejam.</p>
				${lista(FORCA.map(([t, d]) => `<b>${t}:</b> ${d}`))}
				<p>Ao capturar, o guarda recita os direitos (ser alimentado sob custódia, receber um clérigo, recusar magias de controle mental). Suspeitos são interrogados. Pegos em flagrante, passam aos Juízes de Khalmyr; os guardas só fornecem provas e testemunhas. Depois, relatórios e papelada.</p>
				<h2>Direitos dos Suspeitos</h2>
				<blockquote>“${DIREITOS.replace("{crime}", "(crime do qual o suspeito é acusado)")}”</blockquote>
				<h2>Punições</h2>
				${lista(PUNICOES.map(([t, d]) => `<b>${t}:</b> ${d}`))}
				<p>Para o verdadeiro guarda, a grande motivação não é o pagamento nem o heroísmo: é o cumprimento do dever. Quem se importa com heróis empolados que contam vantagem depois de saquear meia dúzia de masmorras? Os guardas defendem o povo todos os dias, sem fraquejar.</p>
				<p><i>Isto é uma obra de ficção: a Guarda de Valkaria é tão realista como polícia quanto grupos de aventureiros são como solução para a política internacional. Tudo foi pensado para o jogo, não como plataforma ideológica.</i></p>`, 710),
			pagina("A Guarita da Praia", `
				<p>O principal centro de lei e ordem da Cidade da Praia: um antigo mosteiro convertido em prédio público, cercado por um espelho d'água, com colunas decoradas e alcovas de meditação que hoje servem à agitação investigativa e burocrática.${AV[0] ? ` O elenco resumido também está em ${L(AV[0])} › Elenco da Guarita da Praia.` : ""}</p>
				${GUARDA.slice(1).map(pessoa).join("")}`, 720),
			pagina("Escolhendo os Casos", `
				<p>Os jogadores devem saber que a chance de resolver todos os casos antes que \"algo aconteça\" é bem pequena. Blixto, Mathilda ou qualquer detetive pode dizer isso; diga você mesmo, sem meias-palavras, se houver dúvida.</p>
				<p>O livro presume que o grupo escolha os casos que, pelo palpite dele, têm a ver com a trama, mas pode escolher só os mais divertidos. Cada caso ligado à trama principal dá informações e vantagens para a última aventura. ${leiOrdem ? `Controle o tempo com ${L(leiOrdem)}.` : ""}</p>`, 730),
			pagina("Relatos da Mesa Original", `
				<p>Nas Colinas Centrais, os personagens conheceram quase todos os NPCs e os jogadores lembravam nomes e características. Em Valkaria houve bem menos conexão com os coadjuvantes, mas nunca faltou o que fazer. <b>No interior não havia nada para fazer, mas todos se conheciam; na capital nunca há tédio, mas ninguém conhece os vizinhos.</b></p>
				<p>Abrace essa dinâmica. Blixto não é uma nova Belinda; os detetives da Guarita da Praia não são os novos soldados do Forte Cabeça-de-Martelo. Mesmo sem se envolver no crescimento de Finley ou no drama de Tullia, o grupo original interagiu com a cidade pelos negócios, pelas atividades e pelas aventuras, e as relações que fez foram marcantes: Vladmir Mors, Alfraye, Jaydill e até Paollus ascenderam naturalmente a papéis de destaque.</p>`, 800)
		]
	});

	ui.notifications.info(`Ruas de Valkaria criadas: ${fichasNovas.length} tokens de apoio, ${fichasLigadas.length} fichas ligadas, diário e ${macros.length} macros. Veja a pasta "${NOME_PASTA}".`);
})();
