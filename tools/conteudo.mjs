/**
 * O que entra no módulo, organizado como as revistas do Duelo de Dragões: um ato (o "patamar") com as suas
 * aventuras (as "revistas"). Cada aventura tem a sua pasta em src/aventuras/<ato>/<aventura>/, com o gerador
 * (gerador.js, a fonte do conteúdo) e o guia dele (LEIA-ME.md); as artes ficam em assets/<arco>/<pasta>/.
 *
 * O build roda os geradores de cada ato num Foundry simulado, na ordem abaixo (a mesma do mega script), e grava
 * cada aventura nos compêndios dela: <ato>-<sigla>-<tipo> (ex.: a1-av3-ameacas), dentro da pasta da aventura na
 * aba de Compêndios (Giria T20 - Fim dos Tempos (Campanha) › Ato 1 · Colinas Centrais › Av3 · Cultistas Puristas).
 *
 * Para incluir uma aventura nova: crie src/aventuras/<ato>/<pasta>/gerador.js (e o LEIA-ME.md), acrescente a
 * linha dela em `aventuras` e rode "npm run build".
 *   id      nome do gerador (o mesmo dos arquivos do projeto e do mega script)
 *   pasta   pasta dentro de src/aventuras/<ato>/
 *   sigla   prefixo dos compêndios da aventura (curto e sem acento)
 *   rotulo  nome da pasta da aventura na aba de Compêndios
 *   assets  pasta das artes, se houver
 */
import path from "node:path";
import { AVENTURAS_DIR } from "./caminhos.mjs";

export const MODULO = "giriarpg-fim-dos-tempos";

const av = (id, pasta, sigla, rotulo, assets) => ({ id, pasta, sigla, rotulo, ...(assets ? { assets } : {}) });

export const ATOS = [
	{
		id: "ato1",
		prefixo: "a1",
		pasta: "ato1-colinas-centrais",
		rotulo: "Ato 1 · Colinas Centrais",
		cor: "#7a5a2a",
		aventuras: [
			av("av1-cabeca-de-bartram", "av1-cabeca-de-bartram", "av1", "Av1 · Tragam-me a Cabeça de Bartram Zonnar"),
			av("av2-lefou-adolescente", "av2-lefou-adolescente", "av2", "Av2 · Lefou Adolescente", "assets/arco1/av2-lefou"),
			av("a1-guloseimas-gronko", "guloseimas-do-gronko", "gronko", "Av2 · Guloseimas do Gronko"),
			av("av3-cultistas-puristas", "av3-cultistas-puristas", "av3", "Av3 · Cultistas Puristas", "assets/arco1/av3-cultistas"),
			av("av4-terror-do-ceu", "av4-terror-do-ceu", "av4", "Av4 · Terror que Veio do Céu", "assets/arco1/av4-terror"),
			av("av45-plano-5-colinas", "av45-plano-5-colinas", "av45", "Av4.5 · Plano 5 das Colinas Centrais"),
			av("av5-maniacos-aberrantes", "av5-maniacos-aberrantes", "av5", "Av5 · Noite dos Maníacos Aberrantes"),
			av("a1-templo-do-vacuo", "templo-do-vacuo", "templo", "Templo do Vácuo"),
			av("a1-especial-de-gatal", "especial-de-gatal", "gatal", "Especial de Gatal"),
			av("a1-encontros-colinas", "encontros-colinas", "colinas", "Encontros nas Colinas Centrais")
		]
	},
	{
		id: "ato2",
		prefixo: "a2",
		pasta: "ato2-valkaria",
		rotulo: "Ato 2 · Valkaria",
		cor: "#2f4a6b",
		aventuras: [
			av("a2-av0-valkaria", "av0-valkaria", "av0", "Av0 · Chegada a Valkaria"),
			av("a2-av1-stremtol", "av1-stremtol", "av1", "Av1 · Os Aventureiros de Stremtol"),
			av("a2-av2-vectora", "av2-vectora", "av2", "Av2 · Conexão Vectora"),
			av("a2-av3-rocha-cinzenta", "av3-rocha-cinzenta", "av3", "Av3 · Fuga da Rocha Cinzenta"),
			av("a2-av4-taverna-maniacos", "av4-taverna-maniacos", "av4", "Av4 · Massacre na Taverna dos Maníacos"),
			av("a2-av5-tuneis-famintos", "av5-tuneis-famintos", "av5", "Av5 · Túneis Famintos"),
			av("a2-av6-baile-debutantes", "av6-baile-debutantes", "av6", "Av6 · Baile de Debutantes Sangrento"),
			av("a2-av7-mecano-lagarto-terror", "av7-mecano-lagarto-terror", "av7", "Av7 · O Ataque do Mecano-Lagarto-Terror"),
			av("a2-mini1-ruas-de-cobica", "mini1-ruas-de-cobica", "mini1", "Mini 1 · Ruas de Cobiça"),
			av("a2-mini2-irmandade-maxima", "mini2-irmandade-maxima", "mini2", "Mini 2 · Irmandade Máxima"),
			av("a2-labirinto-liberto", "labirinto-liberto", "labirinto", "O Labirinto Liberto"),
			av("a2-encontros-valkaria", "encontros-valkaria", "encontros", "Encontros em Valkaria"),
			av("a2-ruas-valkaria", "ruas-valkaria", "ruas", "Ruas de Valkaria"),
			av("a2-lendas-linhas", "lendas-linhas", "lendas", "Lendas e Linhas Narrativas"),
			av("a2-apendices", "apendices", "apendices", "Apêndices")
		]
	},
	{
		id: "campanha",
		prefixo: "geral",
		pasta: "campanha",
		rotulo: "Campanha (o grupo e utilidades)",
		/** Nome da pasta na aba de Compêndios (no mundo, a pasta continua com o rótulo acima). */
		rotuloCompendio: "Ferramentas gerais",
		cor: "#6b5a2f",
		aventuras: [
			av("fdt-grupo", "grupo", "grupo", "O Grupo"),
			av("fdt-poderes-pjs", "poderes-pjs", "pjs", "Poderes dos PJs"),
			/** Sem gerador: as macros avulsas abaixo. */
			{ id: "ferramentas", pasta: "ferramentas", sigla: "ferramentas", rotulo: "Ferramentas", semGerador: true }
		],
		/** Macros avulsas (aventura "ferramentas"): o arquivo inteiro (ou o comando) vira o comando da macro. */
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
				arquivo: "ferramentas/poder-combate-defensivo.js",
				nome: "Poder · Combate Defensivo",
				img: "systems/tormenta20/icons/poderes/combate.webp",
				role: "combateDefensivo"
			}
		]
	}
];

/** Lista dos geradores de cada ato, na ordem (compatível com o que os testes e o build já usavam). */
for (const ato of ATOS) ato.geradores = ato.aventuras.filter((a) => !a.semGerador).map((a) => a.id);

/** Todas as aventuras, com o ato. */
export const AVENTURAS = ATOS.flatMap((ato) => ato.aventuras.map((a) => ({ ...a, ato })));

/** Pasta da aventura (src/aventuras/<ato>/<pasta>). */
export const pastaAventura = (a) => path.join(AVENTURAS_DIR, a.ato.pasta, a.pasta);

/** Caminho do gerador pelo id (ex.: "av3-cultistas-puristas"). */
export function arquivoGerador(id) {
	const a = AVENTURAS.find((x) => x.id === id);
	if (!a || a.semGerador) throw new Error(`Gerador desconhecido: ${id} (veja tools/conteudo.mjs)`);
	return path.join(pastaAventura(a), "gerador.js");
}

/** Arquivo de uma macro avulsa de um ato (relativo à pasta do ato). */
export const arquivoDoAto = (ato, rel) => path.join(AVENTURAS_DIR, ato.pasta, rel);

/** Nome do compêndio de um tipo numa aventura: a1-av3-ameacas, geral-grupo-macros. */
export const nomePack = (ato, aventura, tipo) => `${ato.prefixo}-${aventura.sigla}-${tipo}`;

/**
 * Tipos de compêndio. Cada aventura ganha um compêndio de cada tipo que usar (a1-av3-ameacas, a1-av3-macros...),
 * sem pastas dentro: as pastas do mundo (Ato › aventura) vão no module.json (flags.<módulo>.packs) e o Puxar as cria.
 * `filtro` escolhe os documentos do tipo que entram. Para os UUIDs antigos continuarem valendo, cada documento
 * guarda os compêndios onde já esteve: `<ato>-<antigo>` (por ato, até a v0.16) e `<nome>` (por tipo, v0.17 a v0.24).
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
