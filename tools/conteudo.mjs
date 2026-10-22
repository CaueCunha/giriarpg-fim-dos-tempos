/**
 * O que entra no módulo, por ato. Cada gerador em src/geradores é a fonte do conteúdo dele: o build
 * roda os geradores num Foundry simulado, na ordem abaixo (a mesma do mega script), e grava o
 * resultado como compêndios. Para incluir uma aventura nova, ponha o gerador em src/geradores,
 * acrescente o nome aqui e rode "npm run build".
 */
export const MODULO = "giriarpg-fim-dos-tempos";

export const ATOS = [
	{
		id: "ato1",
		rotulo: "Ato 1 · Colinas Centrais",
		cor: "#7a5a2a",
		geradores: [
			// Av1 (Tragam-me a Cabeça de Bartram Zonnar) ainda não tem gerador.
			"av2-lefou-adolescente",
			"a1-guloseimas-gronko",
			"av3-cultistas-puristas",
			"av4-terror-do-ceu",
			"av45-plano-5-colinas",
			"av5-maniacos-aberrantes",
			"a1-templo-do-vacuo",
			"a1-especial-de-gatal",
			"a1-encontros-colinas"
		]
	},
	{
		id: "ato2",
		rotulo: "Ato 2 · Valkaria",
		cor: "#2f4a6b",
		geradores: [
			"a2-av0-valkaria",
			"a2-av1-stremtol",
			"a2-av2-vectora",
			"a2-av3-rocha-cinzenta",
			"a2-av4-taverna-maniacos",
			"a2-av5-tuneis-famintos",
			"a2-av6-baile-debutantes",
			"a2-av7-mecano-lagarto-terror"
		]
	},
	{
		id: "campanha",
		rotulo: "Campanha (o grupo e utilidades)",
		cor: "#3f6b4a",
		geradores: ["fdt-grupo"],
		/** Macros avulsas: o arquivo inteiro (ou o comando) vira o comando da macro. */
		macros: [
			{
				comando: '// Abre a janela de importação do módulo Fim dos Tempos.\ngame.modules.get("giriarpg-fim-dos-tempos")?.api?.abrirImportador();',
				nome: "FdT · Importar conteúdo do módulo",
				img: "icons/svg/download.svg",
				role: "importador"
			},
			{
				arquivo: "poder-combate-defensivo",
				nome: "Poder · Combate Defensivo",
				img: "systems/tormenta20/icons/poderes/combate.webp",
				role: "combateDefensivo"
			}
		]
	}
];

/** Tipos de documento e o compêndio de cada um (sufixo do nome do pack). */
export const TIPOS = [
	{ documento: "Actor", pack: "ameacas", rotulo: "Ameaças e NPCs", colecao: "actors" },
	{ documento: "Item", pack: "itens", rotulo: "Itens", colecao: "items" },
	{ documento: "JournalEntry", pack: "diarios", rotulo: "Diários", colecao: "journal" },
	{ documento: "RollTable", pack: "tabelas", rotulo: "Tabelas", colecao: "tables" },
	{ documento: "Macro", pack: "macros", rotulo: "Macros", colecao: "macros" }
];

/** Valores que sobrevivem a uma reimportação (o importador copia do documento antigo). */
export const PRESERVAR = [
	{ documento: "Actor", role: "leiordem", caminhos: ["system.resources"] },
	{ documento: "JournalEntry", role: "grupo", caminhos: ["flags.world.fdtGrupo"] }
];
