/**
 * Token padrão das ameaças (TOKEN_PADRAO em assinatura.mjs): ganchos de criação e correção do que já está no mundo.
 */
import { ehAmeacaDoModulo, comTokenPadrao, correcaoToken, TOKEN_PADRAO } from "./assinatura.mjs";

const tokenDeAmeaca = (t) => ehAmeacaDoModulo(game.actors?.get(t?.actorId ?? t?._source?.actorId) ?? t?.actor);

/** Dados de updateSource que põem o padrão por cima, campo a campo (mantém nome, arte, tamanho...). */
const padraoPorCampo = (src) => {
	const novo = comTokenPadrao(src);
	return Object.fromEntries(Object.keys(TOKEN_PADRAO).map((k) => [k, novo[k]]));
};

/**
 * Corrige no mundo as ameaças do módulo (protótipo) e os tokens delas nas cenas. Só mexe nos campos do
 * padrão que estão diferentes; a assinatura não inclui o token, então nada passa a contar como editado.
 */
export async function corrigirTokens() {
	let atores = 0;
	let tokens = 0;
	for (const a of game.actors ?? []) {
		if (!ehAmeacaDoModulo(a)) continue;
		const c = correcaoToken(a._source?.prototypeToken ?? a.prototypeToken);
		if (!Object.keys(c).length) continue;
		await a.update(Object.fromEntries(Object.entries(c).map(([k, v]) => [`prototypeToken.${k}`, v])));
		atores++;
	}
	for (const cena of game.scenes ?? []) {
		const updates = [];
		for (const t of cena.tokens ?? []) {
			if (!tokenDeAmeaca(t)) continue;
			const c = correcaoToken(t._source ?? t);
			if (Object.keys(c).length) updates.push({ _id: t.id, ...c });
		}
		if (!updates.length) continue;
		await cena.updateEmbeddedDocuments("Token", updates);
		tokens += updates.length;
	}
	return { atores, tokens };
}

/** No setup (depois do init do Bar Brawl), para o padrão do módulo vencer o do mundo e o do Bar Brawl. */
export function registrarGanchosToken() {
	Hooks.on("preCreateActor", (actor) => {
		if (!ehAmeacaDoModulo(actor)) return;
		const proto = actor._source?.prototypeToken ?? {};
		if (Object.keys(correcaoToken(proto)).length) actor.updateSource({ prototypeToken: comTokenPadrao(proto) });
	});
	Hooks.on("preCreateToken", (token) => {
		if (!tokenDeAmeaca(token)) return;
		const src = token._source ?? {};
		if (Object.keys(correcaoToken(src)).length) token.updateSource(padraoPorCampo(src));
	});
}
