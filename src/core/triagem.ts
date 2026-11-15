import { EXAMES } from "../data/exames";
import { calcularDerivados, type Aviso, type Valores } from "./calculos";
import { classificar, ordenarPorGravidade, piorNivel, prioridade } from "./motor";
import type { Nivel, Paciente, Prioridade, Resultado } from "./tipos";

export interface Triagem {
  id: string;
  dataISO: string;
  paciente: Paciente;
  /** Valores digitados (sem os calculados), para poder refazer a análise. */
  valores: Valores;
  resultados: Resultado[];
  avisos: Aviso[];
  nivel: Nivel;
  prioridade: Prioridade;
}

/** Roda a triagem completa: calcula derivados, classifica cada exame e define a prioridade. */
export function triar(paciente: Paciente, valores: Valores, agora = new Date()): Triagem {
  const { valores: completos, avisos } = calcularDerivados(valores, paciente);

  if (paciente.idade < 18) {
    avisos.push({ exameId: "*", mensagem: "Valores de referência são para adultos. Para menores de 18 anos, usar referências pediátricas." });
  }

  // Segue a ordem da tabela, para o laudo sair organizado por grupo.
  const resultados = EXAMES.filter((e) => completos[e.id] !== undefined).map((e) =>
    classificar(e, completos[e.id] as number, paciente),
  );

  return {
    id: `${agora.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    dataISO: agora.toISOString(),
    paciente,
    valores,
    resultados,
    avisos,
    nivel: piorNivel(resultados),
    prioridade: prioridade(resultados),
  };
}

/** Alterados e críticos, do mais grave para o mais leve: o "resumo" do laudo. */
export function achados(t: Triagem): Resultado[] {
  return ordenarPorGravidade(t.resultados.filter((r) => r.faixa.nivel !== "normal"));
}

const ORDEM_PRIORIDADE: Record<Prioridade, number> = { alta: 0, media: 1, baixa: 2 };

/** Fila de atendimento: prioridade alta primeiro; dentro da mesma prioridade, a mais antiga primeiro. */
export function filaDePrioridade(triagens: Triagem[]): Triagem[] {
  return [...triagens].sort(
    (a, b) => ORDEM_PRIORIDADE[a.prioridade] - ORDEM_PRIORIDADE[b.prioridade] || a.dataISO.localeCompare(b.dataISO),
  );
}
