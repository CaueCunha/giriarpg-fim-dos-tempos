/* =====================================================================
 * FIM DOS TEMPOS · PODER "COMBATE DEFENSIVO" AUTOMATIZADO
 * Macro para Foundry VTT v14 + sistema Tormenta20 (Vizael 1.6.x)
 *
 * Regra (Tormenta20 JdA, p. 124): quando usa a ação agredir, você pode usar
 * este poder. Até seu próximo turno, sofre −2 em todos os testes de ataque,
 * mas recebe +5 na Defesa.
 *
 * COMO USAR
 *   1. O personagem já precisa ter o poder "Combate Defensivo" na ficha
 *      (arraste do compêndio de Poderes). Se não tiver, a macro cria um.
 *   2. Crie uma macro do tipo "Script", cole este arquivo inteiro e execute
 *      com o token do personagem selecionado (pode selecionar vários).
 *      Sem token selecionado, usa o personagem do usuário.
 *   3. Pronto. No ataque, marque "Combate Defensivo" na janela de uso
 *      (caixa de marcar). O ataque sai com −2 e o card ganha o botão do efeito
 *      "Combate Defensivo · Defesa" (+5 Defesa, −2 nos ataques). Com o token
 *      selecionado, clique nele. O efeito some no início do próximo turno.
 *   Rodar de novo só atualiza; não duplica nada.
 *
 * POR QUE O POWER DO COMPÊNDIO NÃO FUNCIONA SOZINHO
 *   O Efeito de Uso do compêndio só tem "ataque −2". O efeito de +5 está no
 *   poder, mas nada o leva ao card do ataque. A chave "efeito" (que levaria)
 *   não acha efeitos de outro item quando o Efeito de Uso mora num item:
 *   ability-use.mjs:419-423 procura em ef.parent.items, e o pai é o poder,
 *   que não tem itens. Por isso o Efeito de Uso aqui fica no ATOR, com
 *   origin apontando para o poder, e o efeito de Defesa fica no poder.
 *
 * Feito a partir do código do sistema (master 1.6.4, 11/10/2026); não foi
 * testado num Foundry rodando. Veja poder-combate-defensivo.md.
 * ===================================================================== */
(async () => {
	const NOME_PODER = "Combate Defensivo";
	const NOME_DEFESA = "Combate Defensivo · Defesa";
	const IMG = "systems/tormenta20/icons/poderes/combate.webp";
	const FLAG = "fdtCombateDefensivo";

	const muda = (key, value) => ({ key, value, type: "add", phase: "initial", priority: null });

	// Efeito que vai para o card e é aplicado no próprio personagem.
	// Fica DESLIGADO no poder (senão valeria o tempo todo); o card o liga ao aplicar.
	const dadosDefesa = {
		name: NOME_DEFESA,
		img: IMG,
		type: "base",
		transfer: true,
		disabled: true,
		duration: { value: 1, units: "rounds", expiry: "turnStart" },
		description: "<p>Até o início do seu próximo turno: +5 na Defesa e −2 em todos os testes de ataque.</p>",
		statuses: [],
		flags: { world: { [FLAG]: "defesa" } },
		system: {
			changes: [
				muda("system.attributes.defesa.bonus", "5"),
				// −2 em Luta e Pontaria: vale para ataques com arma e manobras
				muda("system.modificadores.pericias.ataque", "-2")
			],
			onuse: false,
			abilityUse: { types: [], names: [], automatic: false, aumenta: false, custo: 0, description: "" }
		}
	};

	// Efeito de Uso no ATOR: −2 neste ataque + manda o efeito de Defesa para o card.
	// Caixa simples (aumenta: false). A ordem importa: "ataque" vem antes de "efeito",
	// assim o −2 não é copiado para dentro do efeito de Defesa (ability-use.mjs:689-725).
	const dadosUso = (poder) => ({
		name: NOME_PODER,
		img: IMG,
		type: "base",
		transfer: false,
		disabled: true,
		origin: poder.uuid,
		duration: {},
		description: "<p>Ação agredir defensiva: −2 neste ataque e o card traz o efeito de +5 na Defesa até seu próximo turno.</p>",
		statuses: [],
		flags: { world: { [FLAG]: "uso" } },
		system: {
			changes: [
				muda("ataque", "-2"),
				muda("efeito", NOME_DEFESA)
			],
			onuse: true,
			abilityUse: { types: ["attack"], names: [], automatic: false, aumenta: false, custo: null, description: "" }
		}
	});

	const atores = canvas.tokens?.controlled?.length
		? [...new Set(canvas.tokens.controlled.map((t) => t.actor).filter(Boolean))]
		: [game.user.character].filter(Boolean);
	if (!atores.length) return ui.notifications.warn("Selecione o token do personagem (ou defina seu personagem).");

	const feitos = [];
	for (const actor of atores) {
		if (!actor.isOwner) {
			ui.notifications.warn(`Sem permissão para editar ${actor.name}.`);
			continue;
		}

		// 1. Poder na ficha
		let poder = actor.items.find((i) => i.type === "poder" && i.name === NOME_PODER);
		if (!poder) {
			[poder] = await actor.createEmbeddedDocuments("Item", [{
				name: NOME_PODER,
				type: "poder",
				img: IMG,
				system: {
					description: {
						value: "<p>Quando usa a ação agredir, você pode usar este poder. Se fizer isso, até seu próximo turno, sofre –2 em todos os testes de ataque, mas recebe +5 na Defesa. Pré-requisito: Int 1.</p>"
					}
				}
			}]);
		}

		// 2. Efeitos dentro do poder
		const efsPoder = [...poder.effects];
		// 2a. Efeito de Uso do compêndio: desliga, senão aparece duplicado na janela de ataque
		const updPoder = efsPoder
			.filter((e) => e.system.onuse && e.getFlag("world", FLAG) == null)
			.map((e) => ({ _id: e.id, name: `${NOME_PODER} (compêndio, desativado)`, "system.abilityUse.types": [] }));
		// 2b. Efeito de Defesa: reaproveita o do compêndio (o que não é de uso) ou o nosso
		const defesa = efsPoder.find((e) => e.getFlag("world", FLAG) === "defesa")
			?? efsPoder.find((e) => !e.system.onuse && e.getFlag("world", FLAG) == null);
		if (defesa) updPoder.push({ _id: defesa.id, ...dadosDefesa });
		if (updPoder.length) await poder.updateEmbeddedDocuments("ActiveEffect", updPoder);
		if (!defesa) await poder.createEmbeddedDocuments("ActiveEffect", [dadosDefesa]);

		// 3. Efeito de Uso no ator
		const uso = actor.effects.find((e) => e.getFlag("world", FLAG) === "uso");
		if (uso) await uso.update(dadosUso(poder));
		else await actor.createEmbeddedDocuments("ActiveEffect", [dadosUso(poder)]);

		feitos.push(actor.name);
	}

	if (feitos.length) ui.notifications.info(`Combate Defensivo configurado: ${feitos.join(", ")}.`);
})();
