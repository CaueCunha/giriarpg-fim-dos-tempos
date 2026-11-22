/**
 * Atualização única das macros do mundo (testes no chat, 0.22.0).
 */
import { MODULO, assinatura } from "./assinatura.mjs";
import { classe, marca, esc } from "./constantes.mjs";
import { catalogo } from "./importador.mjs";


/**
 * Rodada da atualização única das macros (0.22.0, pedido do Cauê): as macros passaram a pedir os testes no chat e a
 * deixar o Mestre aplicar tudo por botões. Ao abrir o mundo, o Mestre ativo troca o código (command) de toda macro do
 * mundo que veio do módulo: as puxadas do compêndio, as dos geradores antigos e as arrastadas para a barra de atalhos.
 * A macro continua a mesma (id, nome, pasta, permissões e lugar na barra); só o código muda. A que foi editada à mão
 * ganha antes uma cópia "(sua edição)" na pasta "Fim dos Tempos · Cópias das suas edições (0.22.0)", sem as marcas do
 * módulo (nenhuma macro nem atualização mexe nela). Roda uma vez por mundo e rodada.
 */
export const RODADA_MACROS = "0.22.0";

export async function atualizarMacros({ rodada = RODADA_MACROS, forcar = false } = {}) {
	if (!game.user?.isGM) return null;
	if (!forcar && game.settings.get(MODULO, "macrosAtualizadas") === rodada) return null;
	const cat = (await catalogo()).filter((c) => c.tipo === "Macro");
	const RE = new RegExp(`^Compendium\\.${MODULO.replace(/-/g, "\\-")}\\.[^.]+\\.Macro\\.([A-Za-z0-9]{16})$`);
	const linhas = [];
	let trocadas = 0;
	let copias = 0;
	let pasta = null;
	const garantirPasta = async () => {
		if (pasta) return pasta;
		const nome = `Fim dos Tempos · Cópias das suas edições (${rodada})`;
		pasta = game.folders.find((f) => f.type === "Macro" && f.name === nome) ?? (await classe("Folder").create({ name: nome, type: "Macro", color: "#555555", sorting: "a" }));
		return pasta;
	};
	for (const c of cat) {
		const comp = await c.pack.getDocument(c.id);
		if (!comp) continue;
		const doMundo = game.macros.filter((w) => {
			if (w.folder && (w.folder.id ?? w.folder) === pasta?.id) return false;
			const fonte = w._stats?.compendiumSource ?? w.flags?.core?.sourceId ?? "";
			const m = fonte.match(RE);
			if (m) return m[1] === c.id;
			if (w.id === c.id) return true;
			return !!c.marca && marca(w) === c.marca && w.name === c.nome;
		});
		for (const w of doMundo) {
			if (w.command === comp.command) continue;
			const editada = !c.assinaturas.includes(assinatura(w.toObject(), "Macro"));
			if (editada) {
				const dados = w.toObject();
				delete dados._id;
				dados.name = `${w.name} (sua edição)`;
				dados.folder = (await garantirPasta()).id;
				if (dados.flags?.world) {
					delete dados.flags.world.fdt;
					delete dados.flags.world.fdtRole;
				}
				if (dados.flags?.[MODULO]) delete dados.flags[MODULO];
				if (dados._stats) delete dados._stats.compendiumSource;
				await classe("Macro").createDocuments([dados]);
				copias++;
			}
			await w.update({ command: comp.command });
			trocadas++;
			linhas.push(`<li>${esc(w.name)}${editada ? " <i>(sua edição guardada)</i>" : ""}</li>`);
		}
	}
	await game.settings.set(MODULO, "macrosAtualizadas", rodada);
	if (trocadas)
		await ChatMessage.create({
			whisper: ChatMessage.getWhisperRecipients("GM").map((u) => u.id),
			speaker: { alias: "Giria T20 - Fim dos Tempos (Campanha)" },
			content:
				`<h3>Fim dos Tempos ${esc(rodada)}: macros atualizadas</h3><p>As macros do mundo (inclusive as que você puxou dos compêndios ou pôs na barra) ` +
				`agora pedem os testes no chat: cada jogador clica no botão do seu personagem e rola, e você aplica o resultado pelos botões do card. ` +
				`Nenhuma macro aplica dano, condição ou efeito sozinha.</p><ul>${linhas.join("")}</ul>` +
				(copias ? `<p>${copias} macro(s) que você tinha editado ficaram guardadas em <b>Fim dos Tempos · Cópias das suas edições (${esc(rodada)})</b>, com "(sua edição)" no nome.</p>` : "")
		});
	return { trocadas, copias };
}

