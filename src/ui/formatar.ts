import type { Nivel, Prioridade } from "../core/tipos";

export function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function formatarNumero(valor: number, casas: number): string {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function formatarData(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export const ROTULO_NIVEL: Record<Nivel, string> = { normal: "Normal", alterado: "Alterado", critico: "Crítico" };

export const ROTULO_PRIORIDADE: Record<Prioridade, string> = {
  alta: "Prioridade alta: valor crítico, comunicar imediatamente",
  media: "Prioridade média: resultados alterados",
  baixa: "Prioridade baixa: resultados dentro da referência",
};
