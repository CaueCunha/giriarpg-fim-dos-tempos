/**
 * Giria T20 - Fim dos Tempos (Campanha) · módulo da campanha (Foundry v14 + Tormenta20 1.6.x)
 *
 * Organizado como o módulo do Duelo de Dragões:
 *   - main.mjs        ganchos, configurações e a API (game.modules.get("giriarpg-fim-dos-tempos").api)
 *   - constantes.mjs  constantes e ajudantes comuns
 *   - importador.mjs  catálogo dos compêndios, Puxar, Atualizar, Limpar e os UUIDs antigos
 *   - tokens.mjs      token padrão das ameaças
 *   - macros.mjs      atualização única das macros do mundo
 *   - testes.mjs      testes no chat (o jogador rola, o Mestre aplica)
 *   - assinatura.mjs  assinatura dos documentos e TOKEN_PADRAO (também usado pelo build)
 *
 * O conteúdo fica nos compêndios do módulo, um por aventura e tipo, nas pastas Ato › aventura da aba de
 * Compêndios. NADA vai para o mundo sozinho:
 *   - o Mestre arrasta do compêndio o que quiser, ou usa "Puxar do compêndio" para trazer aventuras inteiras
 *     (só cria o que falta, com os mesmos IDs, e nunca mexe no que já está no mundo);
 *   - "Atualizar do compêndio" lista os documentos do mundo que vieram do módulo e mudaram numa versão nova.
 *     Cada documento tem uma assinatura (scripts/assinatura.mjs) e o compêndio guarda as de todas as versões
 *     publicadas. Documento do mundo igual a alguma delas pode ser atualizado (vem marcado); diferente de
 *     todas foi editado à mão e fica como está.
 *
 * As macros da campanha procuram atores, tabelas, diários e outras macros no MUNDO pelas marcas
 * flags.world.fdt/fdtRole: puxe a aventura antes de usar as macros dela.
 */
import { MODULO, PRESERVAR, assinatura, TOKEN_PADRAO } from "./assinatura.mjs";
import { api as apiTestes, pedirTeste, pedirTestes, registrarTestes, registrarSocket } from "./testes.mjs";
import { modulo, marca, esc, atos } from "./constantes.mjs";
import {
	catalogo,
	puxar,
	abrirPuxar,
	atualizar,
	abrirAtualizar,
	procurarAtualizacoes,
	atualizarDocumento,
	limpar,
	abrirLimpar,
	procurarParaLimpar,
	abrirMenu,
	registrarRedirecionamentos
} from "./importador.mjs";
import { corrigirTokens, registrarGanchosToken } from "./tokens.mjs";
import { atualizarMacros } from "./macros.mjs";

export { PRESERVAR };

/* ------------------------------------------------------------------------ */
/* Ganchos                                                                    */
/* ------------------------------------------------------------------------ */

Hooks.once("init", () => {
	game.settings.register(MODULO, "avisarVersao", {
		name: "Avisar quando houver melhorias",
		hint: "Quando sai uma versão nova do módulo, o Mestre recebe no chat (uma vez) quantos documentos do mundo têm melhorias no compêndio. Nada é mudado sem a macro FdT · Atualizar do compêndio.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	game.settings.register(MODULO, "avisado", { scope: "world", config: false, type: String, default: "" });
	game.settings.register(MODULO, "corrigirTokens", {
		name: "Token padrão nas ameaças",
		hint: "Ao abrir o mundo, o Mestre corrige o token das ameaças do módulo que já estão no mundo e os tokens delas nas cenas: nome ao passar o mouse, visão, barras de PV (embaixo) e PM (em cima, azul). Ameaças e tokens novos sempre vêm assim.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	// Ligado pela macro "PJs · Automações" (Temeroso e Provocação Petulante); religa ao abrir o mundo.
	game.settings.register(MODULO, "automacoesPJs", { scope: "world", config: false, type: Boolean, default: false });
	// Testes no chat: card com o dano e um botão Rolar por personagem; o Mestre aplica pelos botões.
	registrarTestes();
	// Última atualização única das macros feita neste mundo (ver atualizarMacros).
	game.settings.register(MODULO, "macrosAtualizadas", { scope: "world", config: false, type: String, default: "" });

	const Base = foundry.applications?.api?.ApplicationV2;
	if (Base) {
		const menu = (chave, abrir, dados) => {
			class Janela extends Base {
				render() {
					abrir();
					return this;
				}
			}
			game.settings.registerMenu(MODULO, chave, { ...dados, type: Janela, restricted: true });
		};
		menu("puxar", () => abrirPuxar(), {
			name: "Puxar do compêndio",
			label: "Puxar aventuras",
			hint: "Traz para o mundo as aventuras escolhidas. Só cria o que falta; nada é substituído.",
			icon: "fa-solid fa-file-import"
		});
		menu("atualizar", () => abrirAtualizar(), {
			name: "Atualizar do compêndio",
			label: "Ver atualizações",
			hint: "Lista o que mudou na versão nova. Só os documentos que você não editou podem ser atualizados, e só os que você marcar.",
			icon: "fa-solid fa-rotate"
		});
		menu("limpar", () => abrirLimpar(), {
			name: "Limpar do mundo",
			label: "Limpar conteúdo",
			hint: "Apaga do mundo o conteúdo do módulo para você puxar só o que quiser. Guarda uma cópia e não toca no que você editou, a não ser que você marque.",
			icon: "fa-solid fa-broom"
		});
	}

	const m = modulo();
	if (m) {
		m.api = {
			puxar,
			abrirPuxar,
			atualizar,
			abrirAtualizar,
			procurarAtualizacoes,
			atualizarDocumento,
			limpar,
			abrirLimpar,
			procurarParaLimpar,
			abrirMenu,
			catalogo,
			atos,
			assinatura,
			PRESERVAR,
			TOKEN_PADRAO,
			corrigirTokens,
			atualizarMacros,
			// testes no chat (scripts/testes.mjs); pedirTeste/pedirTestes são os nomes das macros da 0.21
			testes: apiTestes,
			pedirTeste,
			pedirTestes,
			// nomes antigos (macro "FdT · Importar conteúdo do módulo" das versões até a 0.16)
			abrirImportador: abrirPuxar,
			importar: (ids) => puxar({ atos: ids })
		};
	}
});

// No setup (depois do init do Bar Brawl), para o padrão do módulo vencer o do mundo e o do Bar Brawl.
Hooks.once("setup", () => registrarGanchosToken());

Hooks.once("ready", async () => {
	registrarSocket();
	await registrarRedirecionamentos();
	if (!game.user.isGM || (game.users.activeGM && game.users.activeGM !== game.user)) return;
	if (game.settings.get(MODULO, "corrigirTokens")) {
		const { atores, tokens } = await corrigirTokens();
		if (atores || tokens) console.log(`${MODULO} | token padrão: ${atores} ameaça(s) e ${tokens} token(s) corrigidos`);
	}
	try {
		await atualizarMacros();
	} catch (e) {
		console.error(`${MODULO} | macros`, e);
	}
	if (game.settings.get(MODULO, "automacoesPJs")) {
		const auto = game.macros.find((m) => marca(m) === "fdtpoderes" && m.getFlag("world", "fdtRole") === "pjsAutomacoes");
		await auto?.execute({ auto: true });
	}
	// Versão nova: só um aviso no chat, nada muda no mundo
	const versao = modulo()?.version;
	if (!game.settings.get(MODULO, "avisarVersao") || game.settings.get(MODULO, "avisado") === versao) return;
	await game.settings.set(MODULO, "avisado", versao);
	const lista = await procurarAtualizacoes();
	if (!lista.length) return;
	const desat = lista.filter((p) => p.estado === "desatualizado").length;
	await ChatMessage.create({
		whisper: ChatMessage.getWhisperRecipients("GM").map((u) => u.id),
		speaker: { alias: "Giria T20 - Fim dos Tempos (Campanha)" },
		content: `<p><b>Fim dos Tempos v${esc(versao)}</b>: ${desat} documento(s) do mundo têm melhorias no compêndio${lista.length - desat ? ` e ${lista.length - desat} que você editou ficam como estão` : ""}.
			Nada foi mudado. Para escolher o que atualizar, rode a macro <i>FdT · Atualizar do compêndio</i> ou use o botão <i>Fim dos Tempos</i> na aba de Compêndios.</p>`
	});
});

Hooks.on("renderCompendiumDirectory", (app, html) => {
	if (!game.user.isGM) return;
	const raiz = html instanceof HTMLElement ? html : html?.[0];
	if (!raiz || raiz.querySelector(".fdt-importar")) return;
	const botao = document.createElement("button");
	botao.type = "button";
	botao.className = "fdt-importar";
	botao.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Fim dos Tempos';
	botao.addEventListener("click", () => abrirMenu());
	const alvo = raiz.querySelector(".header-actions") ?? raiz.querySelector(".directory-header") ?? raiz;
	alvo.append(botao);
});
