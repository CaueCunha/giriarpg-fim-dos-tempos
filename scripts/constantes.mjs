/**
 * Constantes e ajudantes comuns do módulo (o mesmo papel do constantes.mjs do Duelo de Dragões).
 */
import { MODULO } from "./assinatura.mjs";

export { MODULO };

export const TIPOS = ["Actor", "Item", "JournalEntry", "RollTable", "Macro"];
export const CAMPOS_INDICE = [`flags.${MODULO}`, "flags.world.fdt", "flags.world.fdtRole", "folder"];

export const modulo = () => game.modules.get(MODULO);
export const colecao = (tipo) => game.collections?.get?.(tipo) ?? { Actor: game.actors, Item: game.items, JournalEntry: game.journal, RollTable: game.tables, Macro: game.macros, Folder: game.folders }[tipo];
export const classe = (tipo) => CONFIG[tipo]?.documentClass ?? globalThis[tipo];
export const marca = (d) => d?.flags?.world?.fdt ?? d?.getFlag?.("world", "fdt");
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const nomeTipo = (t, n = 2) => {
	const k = `DOCUMENT.${t}${n > 1 ? "s" : ""}`;
	const s = game.i18n?.localize?.(k);
	return s && s !== k ? s : t;
};
export const RE_COMP = new RegExp(`Compendium\\.${MODULO.replace(/-/g, "\\-")}\\.([A-Za-z0-9_-]+)\\.(Actor|Item|JournalEntry|RollTable|Macro)\\.([A-Za-z0-9]{16})`, "g");

/** Compêndios do módulo. */
export const packs = () => game.packs.filter((p) => p.metadata?.packageName === MODULO);

/** Atos descritos no module.json. */
export function atos() {
	const info = modulo()?.flags?.[MODULO]?.atos ?? {};
	return Object.entries(info).map(([id, a]) => ({ id, rotulo: a.rotulo }));
}

/**
 * De que ato e aventura é um compêndio, e as pastas que o Puxar cria no mundo para ele (module.json,
 * flags.<módulo>.packs; o build grava). Vazio para compêndios de versões antigas.
 * @returns {{ato?: string, aventura?: string, rotulo?: string, pastas?: object[]}}
 */
export const infoPack = (pack) => modulo()?.flags?.[MODULO]?.packs?.[pack?.metadata?.name] ?? {};
