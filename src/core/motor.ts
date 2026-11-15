import type { Exame, Faixa, Nivel, Paciente, Prioridade, Resultado, Variante } from "./tipos";

/** Escolhe a variante que vale para o paciente (por sexo e idade). */
export function escolherVariante(exame: Exame, paciente: Paciente): Variante {
  const variante = exame.variantes.find(
    (v) =>
      (v.sexo === undefined || v.sexo === paciente.sexo) &&
      (v.idadeMin === undefined || paciente.idade >= v.idadeMin) &&
      (v.idadeMax === undefined || paciente.idade <= v.idadeMax),
  );
  if (!variante) {
    throw new Error(`Exame "${exame.id}" não tem variante para ${paciente.sexo}, ${paciente.idade} anos.`);
  }
  return variante;
}

/** Encontra a faixa do valor: a primeira cujo limite superior (exclusivo) é maior que o valor. */
export function encontrarFaixa(faixas: Faixa[], valor: number): Faixa {
  const faixa = faixas.find((f) => f.ate === undefined || valor < f.ate);
  // A validação dos dados garante que a última faixa não tem `ate`.
  return faixa ?? faixas[faixas.length - 1];
}

export function referenciaPara(exame: Exame, paciente: Paciente): string {
  return typeof exame.referencia === "string"
    ? exame.referencia
    : (exame.referencia[paciente.sexo] ?? "—");
}

export function classificar(exame: Exame, valor: number, paciente: Paciente): Resultado {
  if (!Number.isFinite(valor)) {
    throw new Error(`Valor inválido para "${exame.id}": ${valor}`);
  }
  const variante = escolherVariante(exame, paciente);
  return {
    exame,
    valor,
    faixa: encontrarFaixa(variante.faixas, valor),
    referencia: referenciaPara(exame, paciente),
  };
}

const PESO: Record<Nivel, number> = { normal: 0, alterado: 1, critico: 2 };

/** Pior nível entre os resultados (crítico > alterado > normal). */
export function piorNivel(resultados: Resultado[]): Nivel {
  return resultados.reduce<Nivel>(
    (pior, r) => (PESO[r.faixa.nivel] > PESO[pior] ? r.faixa.nivel : pior),
    "normal",
  );
}

/** Prioridade na fila: valor crítico = alta, alterado = média, tudo normal = baixa. */
export function prioridade(resultados: Resultado[]): Prioridade {
  const nivel = piorNivel(resultados);
  return nivel === "critico" ? "alta" : nivel === "alterado" ? "media" : "baixa";
}

/** Ordena resultados do mais grave para o mais leve, mantendo a ordem original no empate. */
export function ordenarPorGravidade(resultados: Resultado[]): Resultado[] {
  return [...resultados].sort((a, b) => PESO[b.faixa.nivel] - PESO[a.faixa.nivel]);
}
