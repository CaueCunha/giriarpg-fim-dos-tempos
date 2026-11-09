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
			"av1-cabeca-de-bartram",
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
			"a2-av7-mecano-lagarto-terror",
			"a2-mini1-ruas-de-cobica",
			"a2-mini2-irmandade-maxima",
			"a2-labirinto-liberto",
			"a2-encontros-valkaria",
			"a2-ruas-valkaria",
			"a2-lendas-linhas",
			"a2-apendices"
		]
	},
	{
		id: "campanha",
		rotulo: "Campanha (o grupo e utilidades)",
		cor: "#3f6b4a",
		geradores: ["fdt-grupo", "fdt-poderes-pjs"],
		/** Macros avulsas: o arquivo inteiro (ou o comando) vira o comando da macro. */
		macros: [
			{
				comando: '// Puxa do compêndio para o mundo só as aventuras escolhidas (nada é substituído).\ngame.modules.get("giriarpg-fim-dos-tempos")?.api?.abrirPuxar();',
				nome: "FdT · Puxar do compêndio",
				img: "icons/svg/download.svg",
				role: "importador"
			},
			{
				comando: '// Lista o que mudou no compêndio e atualiza só o que você marcar (o que foi editado à mão fica como está).\ngame.modules.get("giriarpg-fim-dos-tempos")?.api?.abrirAtualizar();',
				nome: "FdT · Atualizar do compêndio",
				img: "icons/svg/upgrade.svg",
				role: "atualizador"
			},
			{
				comando: '// Apaga do mundo o conteúdo do Fim dos Tempos para você puxar só o que quiser do compêndio.\n// Guarda uma cópia num compêndio do mundo e não apaga o que você editou, a não ser que você marque.\ngame.modules.get("giriarpg-fim-dos-tempos")?.api?.abrirLimpar();',
				nome: "FdT · Limpar do mundo",
				img: "icons/svg/trash.svg",
				role: "limpador"
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

/**
 * Compêndios do módulo, um por tipo (como no Giria T20). Dentro de cada um: uma pasta por ato e, nela, as
 * pastas das aventuras (as mesmas que os geradores criam). `filtro` escolhe os documentos do tipo que entram.
 * `antigo` é o sufixo dos compêndios por ato até a v0.16 (ato1-ameacas...), para redirecionar os UUIDs antigos.
 */
export const PACKS = [
	{ nome: "ameacas", documento: "Actor", rotulo: "Ameaças e NPCs", colecao: "actors", antigo: "ameacas" },
	{ nome: "poderes", documento: "Item", rotulo: "Poderes", colecao: "items", antigo: "itens", filtro: (d) => d.type === "poder" },
	{ nome: "itens", documento: "Item", rotulo: "Itens", colecao: "items", antigo: "itens", filtro: (d) => d.type !== "poder" },
	{ nome: "diarios", documento: "JournalEntry", rotulo: "Diários", colecao: "journal", antigo: "diarios" },
	{ nome: "tabelas", documento: "RollTable", rotulo: "Tabelas", colecao: "tables", antigo: "tabelas" },
	{ nome: "macros", documento: "Macro", rotulo: "Macros", colecao: "macros", antigo: "macros" }
];

/** Valores que sobrevivem a uma atualização (a mesa muda; a atualização copia do documento antigo). */
export { PRESERVAR } from "../scripts/assinatura.mjs";
