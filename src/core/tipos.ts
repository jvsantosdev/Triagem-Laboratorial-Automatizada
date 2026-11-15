export type Sexo = "M" | "F";

export interface Paciente {
  nome: string;
  sexo: Sexo;
  /** Idade em anos completos. */
  idade: number;
}

/** Gravidade de um resultado. A ordem importa: é usada para a fila de prioridade. */
export type Nivel = "normal" | "alterado" | "critico";

/**
 * Uma faixa de classificação. As faixas de uma variante são lidas em ordem:
 * o valor cai na primeira faixa cujo `ate` é maior que ele (limite superior EXCLUSIVO).
 * A última faixa não tem `ate` e pega tudo o que sobrou.
 */
export interface Faixa {
  ate?: number;
  rotulo: string;
  nivel: Nivel;
}

/** Conjunto de faixas que vale para um sexo e/ou uma faixa etária. */
export interface Variante {
  sexo?: Sexo;
  idadeMin?: number;
  idadeMax?: number;
  faixas: Faixa[];
}

export type Grupo =
  | "Hemograma"
  | "Glicemia"
  | "Lipidograma"
  | "Função renal"
  | "Função hepática"
  | "Tireoide"
  | "Metabolismo do ferro"
  | "Eletrólitos";

export interface Exame {
  id: string;
  nome: string;
  grupo: Grupo;
  unidade: string;
  /** Casas decimais para exibir o valor. */
  casas: number;
  /** Texto curto com a faixa de referência mostrada no laudo. */
  referencia: string | Partial<Record<Sexo, string>>;
  variantes: Variante[];
  /** Exames calculados não aparecem no formulário: vêm de outros resultados. */
  calculado?: boolean;
  observacao?: string;
}

export interface Resultado {
  exame: Exame;
  valor: number;
  faixa: Faixa;
  referencia: string;
}

export type Prioridade = "alta" | "media" | "baixa";
