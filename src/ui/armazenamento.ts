import type { Valores } from "../core/calculos";
import { triar, type Triagem } from "../core/triagem";
import type { Paciente } from "../core/tipos";

const CHAVE = "triagem_v2_historico";

/** Só o que foi digitado vai para o localStorage; a análise é refeita ao carregar.
 *  Assim, se a tabela de referência mudar, o histórico é reclassificado com as regras novas. */
interface Registro {
  id: string;
  dataISO: string;
  paciente: Paciente;
  valores: Valores;
}

export function carregar(): Triagem[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return [];
    const registros = JSON.parse(bruto) as Registro[];
    return registros.map((r) => ({ ...triar(r.paciente, r.valores, new Date(r.dataISO)), id: r.id }));
  } catch {
    // Dado corrompido não pode travar o app.
    return [];
  }
}

export function salvar(triagens: Triagem[]): void {
  const registros: Registro[] = triagens.map(({ id, dataISO, paciente, valores }) => ({ id, dataISO, paciente, valores }));
  localStorage.setItem(CHAVE, JSON.stringify(registros));
}
