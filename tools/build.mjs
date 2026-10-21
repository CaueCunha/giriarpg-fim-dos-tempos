/**
 * Build do módulo: roda os geradores (src/geradores) num Foundry simulado com o sistema
 * Tormenta20 real (modelo de dados e compêndios), captura o que eles criam e grava:
 *   - src/packs/<pack>/*.json  fontes dos compêndios (formato do foundryvtt-cli, revisáveis no git)
 *   - module.json              com a lista de compêndios e pastas
 *   - build/relatorio.md       o que foi ligado ao sistema e qualquer aviso
 * Depois, "npm run pack" compila as fontes em packs/ (LevelDB), que é o que o Foundry lê.
 *
 * Uso: node tools/build.mjs [--sem-pack]
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { criarMundo } from "./sim/mundo.mjs";
import { ATOS, TIPOS, MODULO } from "./conteudo.mjs";
import { ligarAoSistema, indiceSistema } from "./ligar-sistema.mjs";
import { RAIZ, GERADORES, FONTE_PACKS } from "./caminhos.mjs";
import { deepClone } from "./sim/utils.mjs";

const COLECAO = { Actor: "actors", Item: "items", JournalEntry: "journal", RollTable: "tables", Macro: "macros", Folder: "folders" };
const EMBUTIDOS = { Actor: { items: "Item", effects: "ActiveEffect" }, Item: { effects: "ActiveEffect" }, JournalEntry: { pages: "JournalEntryPage" }, RollTable: { results: "TableResult" } };

const lerGerador = (nome) => fs.readFileSync(path.join(GERADORES, `${nome}.js`), "utf8");

/* ------------------------------------------------------------------------ */
/* 1. Captura                                                                */
/* ------------------------------------------------------------------------ */

export async function capturarAto(ato, { semente } = {}) {
	const mundo = await criarMundo({ semente: semente ?? ato.id });
	try {
		for (const g of ato.geradores) await mundo.executar(lerGerador(g), { nome: g });
		const problemas = [
			...mundo.erros.map((e) => `${e.origem}: ${e.erro?.message ?? e.erro}`),
			...mundo.notificacoes.filter((n) => n.tipo === "error").map((n) => `${n.origem}: notificação de erro: ${n.msg}`),
			...mundo.relatorio.filter((r) => r.tipo === "erro").map((r) => `${r.origem}: ${r.documento} ${r.caminho}: ${r.mensagem}`)
		];
		if (problemas.length) throw new Error(`Geradores do ${ato.rotulo} falharam:\n  ${problemas.join("\n  ")}`);
		const docs = {};
		for (const tipo of Object.keys(COLECAO)) {
			docs[tipo] = mundo.colecoes[tipo].contents.map((d) => d.toObject());
		}
		for (const [i, m] of (ato.macros ?? []).entries()) {
			docs.Macro.push({
				_id: `${i + 1}x`,
				name: m.nome,
				type: "script",
				img: m.img,
				scope: "global",
				command: m.comando ?? fs.readFileSync(path.join(GERADORES, `${m.arquivo}.js`), "utf8"),
				folder: null,
				flags: { world: { fdt: "fdtcampanha", fdtRole: m.role } }
			});
		}
		return { docs, relatorio: mundo.relatorio.filter((r) => r.tipo !== "erro"), mundo };
	} finally {
		mundo.encerrar();
	}
}

/* ------------------------------------------------------------------------ */
/* 2. IDs estáveis                                                           */
/* ------------------------------------------------------------------------ */

const BASE62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function idEstavel(chave) {
	const h = crypto.createHash("sha256").update(chave).digest();
	let id = "";
	for (let i = 0; i < 16; i++) id += BASE62[h[i] % 62];
	return id;
}

/**
 * Troca os IDs aleatórios por IDs derivados de (marca, tipo, nome, ocorrência). Assim, gerar de
 * novo dá os mesmos IDs, e reimportar o módulo não quebra tokens já colocados em cenas.
 */
export function estabilizarIds(docs) {
	const mapa = new Map();
	const contagem = new Map();
	const novoId = (chave) => {
		const n = contagem.get(chave) ?? 0;
		contagem.set(chave, n + 1);
		return idEstavel(`${chave}#${n}`);
	};
	const visitar = (doc, tipo, prefixo) => {
		const marca = doc.flags?.world?.fdt ?? "sem-marca";
		const chave = prefixo ? `${prefixo}|${tipo}|${doc.name}` : `${MODULO}|${marca}|${tipo}${doc.type && tipo === "Folder" ? `:${doc.type}` : ""}|${doc.name}`;
		const id = novoId(chave);
		if (doc._id) mapa.set(doc._id, id);
		for (const [campo, sub] of Object.entries(EMBUTIDOS[tipo] ?? {})) for (const e of doc[campo] ?? []) visitar(e, sub, id);
	};
	for (const tipo of ["Folder", "Actor", "Item", "JournalEntry", "RollTable", "Macro"]) for (const d of docs[tipo] ?? []) visitar(d, tipo, null);
	let json = JSON.stringify(docs);
	// UUIDs de compêndios do sistema ficam intactos: um item clonado de uma ameaça do sistema
	// carrega o mesmo ID do original, e trocar o ID dentro do link quebraria a referência.
	const protegidos = [];
	json = json.replace(/Compendium\.tormenta20\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9]+)+/g, (m) => `\u0000${protegidos.push(m) - 1}\u0000`);
	// IDs do Foundry são 16 caracteres alfanuméricos; troca só ocorrências isoladas.
	json = json.replace(/(?<![A-Za-z0-9])[A-Za-z0-9]{16}(?![A-Za-z0-9])/g, (m) => mapa.get(m) ?? m);
	json = json.replace(/\u0000(\d+)\u0000/g, (_, i) => protegidos[Number(i)]);
	// IDs temporários das macros avulsas
	json = json.replace(/"_id":"(\d+x)"/g, (_, t) => `"_id":"${mapa.get(t) ?? idEstavel(t)}"`);
	return JSON.parse(json);
}

/* ------------------------------------------------------------------------ */
/* 3. Escrita das fontes                                                     */
/* ------------------------------------------------------------------------ */

const STATS = (versaoSistema, origem) => ({
	coreVersion: "14.366",
	systemId: "tormenta20",
	systemVersion: versaoSistema,
	createdTime: null,
	modifiedTime: null,
	lastModifiedBy: null,
	compendiumSource: origem ?? null,
	duplicateSource: null,
	exportSource: null
});

function comChaves(doc, tipo, colecaoPai, idsPai, versao) {
	const out = deepClone(doc);
	const colecao = colecaoPai ?? COLECAO[tipo];
	const ids = [...idsPai, out._id];
	out._key = `!${colecao}!${ids.join(".")}`;
	out._stats = STATS(versao, doc._stats?.compendiumSource);
	for (const [campo, sub] of Object.entries(EMBUTIDOS[tipo] ?? {})) {
		out[campo] = (out[campo] ?? []).map((e) => comChaves(e, sub, `${colecao}.${campo}`, ids, versao));
	}
	return out;
}

const slug = (s) =>
	String(s)
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^A-Za-z0-9]+/g, "_")
		.replace(/^_|_$/g, "")
		.slice(0, 60) || "doc";

export function escreverFontes(ato, docs, versaoSistema) {
	const packs = [];
	for (const t of TIPOS) {
		const lista = docs[t.documento] ?? [];
		if (!lista.length) continue;
		const nome = `${ato.id}-${t.pack}`;
		const dir = path.join(FONTE_PACKS, nome);
		fs.rmSync(dir, { recursive: true, force: true });
		fs.mkdirSync(dir, { recursive: true });
		const pastas = (docs.Folder ?? []).filter((f) => f.type === t.documento);
		for (const f of pastas) {
			const out = comChaves(f, "Folder", null, [], versaoSistema);
			fs.writeFileSync(path.join(dir, `_Folder_${slug(f.name)}_${f._id}.json`), `${JSON.stringify(out, null, 2)}\n`);
		}
		for (const d of lista) {
			const out = comChaves(d, t.documento, null, [], versaoSistema);
			fs.writeFileSync(path.join(dir, `${t.documento}_${slug(d.name)}_${d._id}.json`), `${JSON.stringify(out, null, 2)}\n`);
		}
		packs.push({ nome, tipo: t.documento, rotulo: `${ato.rotulo.split(" · ")[0]} · ${t.rotulo}`, documentos: lista.length, pastas: pastas.length });
	}
	return packs;
}

/* ------------------------------------------------------------------------ */
/* 4. module.json                                                            */
/* ------------------------------------------------------------------------ */

export function escreverManifesto(packsPorAto) {
	const pkg = JSON.parse(fs.readFileSync(path.join(RAIZ, "package.json"), "utf8"));
	const versao = pkg.version;
	const repo = "https://github.com/CaueCunha/giriarpg-fim-dos-tempos";
	const manifesto = {
		id: MODULO,
		title: "Fim dos Tempos · Campanha (Tormenta20)",
		description: "<p>Conteúdo da campanha <b>Fim dos Tempos</b> para o sistema Tormenta20: ameaças, itens, diários, tabelas e macros do Ato 1 (Colinas Centrais) e do Ato 2 (Valkaria), além das regras de grupo. Importe pelo botão no topo da aba de Compêndios ou pela macro do compêndio Campanha.</p>",
		version: versao,
		compatibility: { minimum: "14", verified: "14" },
		authors: [{ name: "Cauê", url: "https://github.com/CaueCunha" }],
		relationships: { systems: [{ id: "tormenta20", type: "system", compatibility: { minimum: "1.6.0" } }] },
		esmodules: ["scripts/fdt.mjs"],
		styles: ["styles/fdt.css"],
		languages: [{ lang: "pt-BR", name: "Português (Brasil)", path: "lang/pt-BR.json" }],
		packs: [],
		packFolders: [{ name: "Fim dos Tempos", sorting: "m", color: "#6b2f2f", packs: [], folders: [] }],
		flags: { [MODULO]: { atos: {} } },
		url: repo,
		manifest: `${repo}/releases/latest/download/module.json`,
		download: `${repo}/releases/download/v${versao}/module.zip`,
		readme: `${repo}#readme`,
		bugs: `${repo}/issues`
	};
	for (const ato of ATOS) {
		const lista = packsPorAto[ato.id] ?? [];
		for (const p of lista) {
			manifesto.packs.push({
				name: p.nome,
				label: p.rotulo,
				path: `packs/${p.nome}`,
				type: p.tipo,
				system: "tormenta20",
				ownership: { PLAYER: "NONE", ASSISTANT: "OWNER" },
				flags: { [MODULO]: { ato: ato.id } }
			});
		}
		manifesto.packFolders[0].folders.push({ name: ato.rotulo, sorting: "m", color: ato.cor, packs: lista.map((p) => p.nome) });
		manifesto.flags[MODULO].atos[ato.id] = { rotulo: ato.rotulo, packs: lista.map((p) => p.nome) };
	}
	fs.writeFileSync(path.join(RAIZ, "module.json"), `${JSON.stringify(manifesto, null, 2)}\n`);
	return manifesto;
}

/* ------------------------------------------------------------------------ */
/* main                                                                       */
/* ------------------------------------------------------------------------ */

async function main() {
	const linhas = ["# Relatório do build", ""];
	const packsPorAto = {};
	let indice = null;
	let versaoSistema = "1.6.4";
	for (const ato of ATOS) {
		console.log(`» ${ato.rotulo}: ${ato.geradores.length} gerador(es)`);
		const { docs, relatorio, mundo } = await capturarAto(ato);
		versaoSistema = mundo.sistema.versao;
		indice ??= indiceSistema(mundo.sistema.packs);
		const semMarca = Object.entries(docs).flatMap(([t, l]) => l.filter((d) => !d.flags?.world?.fdt).map((d) => `${t} "${d.name}"`));
		if (semMarca.length) throw new Error(`Documentos sem a marca flags.world.fdt: ${semMarca.join(", ")}`);
		const ligacoes = ligarAoSistema(docs, indice, ato.id);
		const estaveis = estabilizarIds(docs);
		packsPorAto[ato.id] = escreverFontes(ato, estaveis, versaoSistema);
		linhas.push(`## ${ato.rotulo}`, "");
		for (const p of packsPorAto[ato.id]) linhas.push(`- \`${p.nome}\`: ${p.documentos} documento(s), ${p.pastas} pasta(s)`);
		linhas.push("", `### Ligações com o sistema (${ligacoes.length})`, "", "| Dono | Item | Tipo | O que foi feito |", "|---|---|---|---|");
		for (const l of ligacoes) linhas.push(`| ${l.dono} | ${l.item} | ${l.tipo} | ${l.acao} |`);
		const avisos = relatorio.filter((r) => r.tipo !== "descartado");
		const descartes = relatorio.filter((r) => r.tipo === "descartado");
		linhas.push("", `### Avisos do Foundry simulado (${avisos.length + descartes.length})`, "");
		for (const r of [...descartes, ...avisos]) linhas.push(`- ${r.tipo}: ${r.origem} · ${r.documento} · \`${r.caminho}\` · ${r.mensagem}`);
		linhas.push("");
		console.log(`  ${packsPorAto[ato.id].map((p) => `${p.nome}(${p.documentos})`).join(" ")} · ${ligacoes.length} ligações · ${descartes.length} descartes · ${avisos.length} avisos`);
	}
	const m = escreverManifesto(packsPorAto);
	fs.mkdirSync(path.join(RAIZ, "build"), { recursive: true });
	fs.writeFileSync(path.join(RAIZ, "build", "relatorio.md"), `${linhas.join("\n")}\n`);
	console.log(`module.json ${m.version}: ${m.packs.length} compêndios. Relatório em build/relatorio.md`);
	if (!process.argv.includes("--sem-pack")) {
		const { compilar } = await import("./pack.mjs");
		await compilar();
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
