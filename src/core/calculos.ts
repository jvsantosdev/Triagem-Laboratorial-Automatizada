import type { Paciente } from "./tipos";

/** Valores digitados, por id do exame. Exames não informados ficam de fora. */
export type Valores = Partial<Record<string, number>>;

export interface Aviso {
  exameId: string;
  mensagem: string;
}

const tem = (v: number | undefined): v is number => v !== undefined && Number.isFinite(v);

/** VCM (fL) = Ht (%) ÷ Hemácias (milhões/µL) × 10 */
export function vcm(hematocrito: number, hemacias: number): number {
  return (hematocrito / hemacias) * 10;
}

/** HCM (pg) = Hb (g/dL) ÷ Hemácias (milhões/µL) × 10 */
export function hcm(hemoglobina: number, hemacias: number): number {
  return (hemoglobina / hemacias) * 10;
}

/** CHCM (g/dL) = Hb (g/dL) ÷ Ht (%) × 100 */
export function chcm(hemoglobina: number, hematocrito: number): number {
  return (hemoglobina / hematocrito) * 100;
}

/** LDL por Friedewald (mg/dL) = CT − HDL − TG/5. Só é válido com TG < 400 mg/dL. */
export function ldlFriedewald(colesterolTotal: number, hdl: number, triglicerides: number): number | null {
  if (triglicerides >= 400) return null;
  return colesterolTotal - hdl - triglicerides / 5;
}

/** Colesterol não-HDL (mg/dL) = CT − HDL */
export function naoHdl(colesterolTotal: number, hdl: number): number {
  return colesterolTotal - hdl;
}

/**
 * TFG estimada pela equação CKD-EPI 2021 (sem coeficiente de raça), em mL/min/1,73m².
 * TFG = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^−1,200 × 0,9938^idade × 1,012 [se mulher]
 * κ = 0,7 (F) ou 0,9 (M); α = −0,241 (F) ou −0,302 (M).
 */
export function tfgCkdEpi2021(creatinina: number, idade: number, sexo: Paciente["sexo"]): number {
  const feminino = sexo === "F";
  const kappa = feminino ? 0.7 : 0.9;
  const alfa = feminino ? -0.241 : -0.302;
  const razao = creatinina / kappa;
  return (
    142 *
    Math.min(razao, 1) ** alfa *
    Math.max(razao, 1) ** -1.2 *
    0.9938 ** idade *
    (feminino ? 1.012 : 1)
  );
}

/**
 * Acrescenta aos valores digitados os exames calculados que dá para obter.
 * Um valor calculado nunca sobrescreve um valor que já foi informado.
 */
export function calcularDerivados(valores: Valores, paciente: Paciente): { valores: Valores; avisos: Aviso[] } {
  const v: Valores = { ...valores };
  const avisos: Aviso[] = [];
  const definir = (id: string, valor: number | null) => {
    if (valor !== null && Number.isFinite(valor) && !tem(v[id])) v[id] = valor;
  };

  if (tem(v.hematocrito) && tem(v.hemacias) && v.hemacias > 0) definir("vcm", vcm(v.hematocrito, v.hemacias));
  if (tem(v.hemoglobina) && tem(v.hemacias) && v.hemacias > 0) definir("hcm", hcm(v.hemoglobina, v.hemacias));
  if (tem(v.hemoglobina) && tem(v.hematocrito) && v.hematocrito > 0) definir("chcm", chcm(v.hemoglobina, v.hematocrito));

  if (tem(v.colesterol_total) && tem(v.hdl)) {
    definir("nao_hdl", naoHdl(v.colesterol_total, v.hdl));
    if (tem(v.triglicerides)) {
      const ldl = ldlFriedewald(v.colesterol_total, v.hdl, v.triglicerides);
      if (ldl === null) {
        avisos.push({ exameId: "ldl", mensagem: "LDL não calculado: triglicerídeos ≥ 400 mg/dL invalidam a fórmula de Friedewald. Dosar LDL direto." });
      } else {
        definir("ldl", ldl);
      }
    }
  }

  if (tem(v.creatinina) && v.creatinina > 0) {
    definir("tfg", tfgCkdEpi2021(v.creatinina, paciente.idade, paciente.sexo));
  }

  return { valores: v, avisos };
}
