import type { Exame, Faixa, Variante } from "../core/tipos";

/**
 * Tabela de exames e valores de referência para ADULTOS.
 *
 * ⚠️ Projeto educacional. Os valores são aproximados e baseados em referências usuais de
 * laboratório clínico, SBPC/ML, ADA, SBC 2017 e KDIGO. Cada laboratório define as próprias
 * faixas conforme método e população. Não use para decisão clínica.
 *
 * Para adicionar um exame, basta acrescentar um item na lista `EXAMES`.
 */

interface OpcoesFaixa {
  baixo?: string;
  alto?: string;
  criticoAbaixo?: number;
  criticoAcima?: number;
  rotuloCriticoBaixo?: string;
  rotuloCriticoAlto?: string;
}

/** Monta faixas no formato [crítico baixo] → baixo → normal → alto → [crítico alto]. */
function faixasEntre(min: number, max: number, o: OpcoesFaixa = {}): Faixa[] {
  const faixas: Faixa[] = [];
  if (o.criticoAbaixo !== undefined) {
    faixas.push({ ate: o.criticoAbaixo, rotulo: o.rotuloCriticoBaixo ?? "Valor crítico (muito baixo)", nivel: "critico" });
  }
  faixas.push({ ate: min, rotulo: o.baixo ?? "Abaixo da referência", nivel: "alterado" });
  // `max` é inclusivo para o normal: valores até `max` ainda são normais.
  faixas.push({ ate: proximo(max), rotulo: "Dentro da referência", nivel: "normal" });
  if (o.criticoAcima !== undefined) {
    faixas.push({ ate: proximo(o.criticoAcima), rotulo: o.alto ?? "Acima da referência", nivel: "alterado" });
    faixas.push({ rotulo: o.rotuloCriticoAlto ?? "Valor crítico (muito alto)", nivel: "critico" });
  } else {
    faixas.push({ rotulo: o.alto ?? "Acima da referência", nivel: "alterado" });
  }
  return faixas;
}

/** Para exames com só limite superior (ex.: TGO até 40). */
function faixasAte(max: number, alto = "Acima da referência"): Faixa[] {
  return [
    { ate: proximo(max), rotulo: "Dentro da referência", nivel: "normal" },
    { rotulo: alto, nivel: "alterado" },
  ];
}

/** Menor número representável acima de `n` na escala dos exames (evita erro de vírgula flutuante). */
function proximo(n: number): number {
  return n + 1e-9;
}

const porSexo = (m: Faixa[], f: Faixa[]): Variante[] => [
  { sexo: "M", faixas: m },
  { sexo: "F", faixas: f },
];

const unica = (faixas: Faixa[]): Variante[] => [{ faixas }];

export const EXAMES: Exame[] = [
  // ───────────── Hemograma: série vermelha ─────────────
  {
    id: "hemacias", nome: "Hemácias", grupo: "Hemograma", unidade: "milhões/µL", casas: 2,
    referencia: { M: "4,50 – 5,90", F: "4,00 – 5,20" },
    variantes: porSexo(faixasEntre(4.5, 5.9, { baixo: "Eritropenia", alto: "Eritrocitose" }),
                       faixasEntre(4.0, 5.2, { baixo: "Eritropenia", alto: "Eritrocitose" })),
  },
  {
    id: "hemoglobina", nome: "Hemoglobina", grupo: "Hemograma", unidade: "g/dL", casas: 1,
    referencia: { M: "13,0 – 17,5", F: "12,0 – 15,5" },
    variantes: porSexo(
      faixasEntre(13.0, 17.5, { baixo: "Anemia", alto: "Poliglobulia", criticoAbaixo: 7, criticoAcima: 20 }),
      faixasEntre(12.0, 15.5, { baixo: "Anemia", alto: "Poliglobulia", criticoAbaixo: 7, criticoAcima: 20 }),
    ),
  },
  {
    id: "hematocrito", nome: "Hematócrito", grupo: "Hemograma", unidade: "%", casas: 1,
    referencia: { M: "40 – 52", F: "36 – 46" },
    variantes: porSexo(faixasEntre(40, 52, { criticoAbaixo: 20, criticoAcima: 60 }),
                       faixasEntre(36, 46, { criticoAbaixo: 20, criticoAcima: 60 })),
  },
  {
    id: "vcm", nome: "VCM", grupo: "Hemograma", unidade: "fL", casas: 1, calculado: true,
    referencia: "80 – 100",
    variantes: unica(faixasEntre(80, 100, { baixo: "Microcitose", alto: "Macrocitose" })),
    observacao: "Calculado: Ht ÷ Hemácias × 10",
  },
  {
    id: "hcm", nome: "HCM", grupo: "Hemograma", unidade: "pg", casas: 1, calculado: true,
    referencia: "27 – 33",
    variantes: unica(faixasEntre(27, 33, { baixo: "Hipocromia", alto: "Hipercromia" })),
    observacao: "Calculado: Hb ÷ Hemácias × 10",
  },
  {
    id: "chcm", nome: "CHCM", grupo: "Hemograma", unidade: "g/dL", casas: 1, calculado: true,
    referencia: "32 – 36",
    variantes: unica(faixasEntre(32, 36, { baixo: "Hipocromia", alto: "CHCM elevado (verificar esferocitose/lipemia)" })),
    observacao: "Calculado: Hb ÷ Ht × 100",
  },
  {
    id: "rdw", nome: "RDW", grupo: "Hemograma", unidade: "%", casas: 1,
    referencia: "11,5 – 14,5",
    variantes: unica(faixasEntre(11.5, 14.5, { alto: "Anisocitose" })),
  },

  // ───────────── Hemograma: série branca e plaquetas ─────────────
  {
    id: "leucocitos", nome: "Leucócitos", grupo: "Hemograma", unidade: "/µL", casas: 0,
    referencia: "4.000 – 11.000",
    variantes: unica(faixasEntre(4000, 11000, { baixo: "Leucopenia", alto: "Leucocitose", criticoAbaixo: 2000, criticoAcima: 30000 })),
  },
  {
    id: "neutrofilos", nome: "Neutrófilos", grupo: "Hemograma", unidade: "/µL", casas: 0,
    referencia: "1.800 – 7.700",
    variantes: unica(faixasEntre(1800, 7700, {
      baixo: "Neutropenia", alto: "Neutrofilia",
      criticoAbaixo: 500, rotuloCriticoBaixo: "Neutropenia grave (valor crítico)",
    })),
  },
  {
    id: "linfocitos", nome: "Linfócitos", grupo: "Hemograma", unidade: "/µL", casas: 0,
    referencia: "1.000 – 4.800",
    variantes: unica(faixasEntre(1000, 4800, { baixo: "Linfopenia", alto: "Linfocitose" })),
  },
  {
    id: "monocitos", nome: "Monócitos", grupo: "Hemograma", unidade: "/µL", casas: 0,
    referencia: "200 – 1.000",
    variantes: unica(faixasEntre(200, 1000, { baixo: "Monocitopenia", alto: "Monocitose" })),
  },
  {
    id: "eosinofilos", nome: "Eosinófilos", grupo: "Hemograma", unidade: "/µL", casas: 0,
    referencia: "até 500",
    variantes: unica(faixasAte(500, "Eosinofilia")),
  },
  {
    id: "basofilos", nome: "Basófilos", grupo: "Hemograma", unidade: "/µL", casas: 0,
    referencia: "até 200",
    variantes: unica(faixasAte(200, "Basofilia")),
  },
  {
    id: "plaquetas", nome: "Plaquetas", grupo: "Hemograma", unidade: "/µL", casas: 0,
    referencia: "150.000 – 450.000",
    variantes: unica(faixasEntre(150000, 450000, {
      baixo: "Plaquetopenia", alto: "Plaquetose",
      criticoAbaixo: 20000, criticoAcima: 1000000,
    })),
  },

  // ───────────── Glicemia ─────────────
  {
    id: "glicose", nome: "Glicose de jejum", grupo: "Glicemia", unidade: "mg/dL", casas: 0,
    referencia: "70 – 99",
    variantes: unica([
      { ate: 40, rotulo: "Hipoglicemia grave (valor crítico)", nivel: "critico" },
      { ate: 70, rotulo: "Hipoglicemia", nivel: "alterado" },
      { ate: 100, rotulo: "Normoglicemia", nivel: "normal" },
      { ate: 126, rotulo: "Glicemia de jejum alterada (pré-diabetes)", nivel: "alterado" },
      { ate: 500, rotulo: "Compatível com diabetes (confirmar com 2ª amostra)", nivel: "alterado" },
      { rotulo: "Hiperglicemia grave (valor crítico)", nivel: "critico" },
    ]),
  },
  {
    id: "hba1c", nome: "Hemoglobina glicada (HbA1c)", grupo: "Glicemia", unidade: "%", casas: 1,
    referencia: "< 5,7",
    variantes: unica([
      { ate: 5.7, rotulo: "Normal", nivel: "normal" },
      { ate: 6.5, rotulo: "Pré-diabetes", nivel: "alterado" },
      { rotulo: "Compatível com diabetes", nivel: "alterado" },
    ]),
  },

  // ───────────── Lipidograma ─────────────
  {
    id: "colesterol_total", nome: "Colesterol total", grupo: "Lipidograma", unidade: "mg/dL", casas: 0,
    referencia: "< 190 (desejável)",
    variantes: unica([
      { ate: 190, rotulo: "Desejável", nivel: "normal" },
      { rotulo: "Elevado", nivel: "alterado" },
    ]),
  },
  {
    id: "hdl", nome: "HDL-colesterol", grupo: "Lipidograma", unidade: "mg/dL", casas: 0,
    referencia: "> 40 (desejável)",
    variantes: unica([
      { ate: 40, rotulo: "HDL baixo", nivel: "alterado" },
      { rotulo: "Desejável", nivel: "normal" },
    ]),
  },
  {
    id: "triglicerides", nome: "Triglicerídeos", grupo: "Lipidograma", unidade: "mg/dL", casas: 0,
    referencia: "< 150 (jejum)",
    variantes: unica([
      { ate: 150, rotulo: "Desejável", nivel: "normal" },
      { ate: 500, rotulo: "Elevado", nivel: "alterado" },
      { rotulo: "Muito elevado (risco de pancreatite)", nivel: "alterado" },
    ]),
  },
  {
    id: "ldl", nome: "LDL-colesterol", grupo: "Lipidograma", unidade: "mg/dL", casas: 0, calculado: true,
    referencia: "< 130 (baixo risco)",
    variantes: unica([
      { ate: 130, rotulo: "Desejável para baixo risco", nivel: "normal" },
      { ate: 190, rotulo: "Acima da meta de baixo risco", nivel: "alterado" },
      { rotulo: "Muito elevado (investigar hipercolesterolemia familiar)", nivel: "alterado" },
    ]),
    observacao: "Calculado por Friedewald (CT − HDL − TG/5), só quando TG < 400. A meta depende do risco cardiovascular.",
  },
  {
    id: "nao_hdl", nome: "Colesterol não-HDL", grupo: "Lipidograma", unidade: "mg/dL", casas: 0, calculado: true,
    referencia: "< 160 (baixo risco)",
    variantes: unica([
      { ate: 160, rotulo: "Desejável para baixo risco", nivel: "normal" },
      { rotulo: "Acima da meta de baixo risco", nivel: "alterado" },
    ]),
    observacao: "Calculado: CT − HDL",
  },

  // ───────────── Função renal ─────────────
  {
    id: "ureia", nome: "Ureia", grupo: "Função renal", unidade: "mg/dL", casas: 0,
    referencia: "15 – 45",
    variantes: unica(faixasEntre(15, 45)),
  },
  {
    id: "creatinina", nome: "Creatinina", grupo: "Função renal", unidade: "mg/dL", casas: 2,
    referencia: { M: "0,70 – 1,30", F: "0,60 – 1,10" },
    variantes: porSexo(faixasEntre(0.7, 1.3), faixasEntre(0.6, 1.1)),
  },
  {
    id: "tfg", nome: "TFG estimada (CKD-EPI 2021)", grupo: "Função renal", unidade: "mL/min/1,73m²", casas: 0, calculado: true,
    referencia: "≥ 90",
    variantes: unica([
      { ate: 15, rotulo: "G5: falência renal", nivel: "critico" },
      { ate: 30, rotulo: "G4: redução grave", nivel: "alterado" },
      { ate: 45, rotulo: "G3b: redução moderada a grave", nivel: "alterado" },
      { ate: 60, rotulo: "G3a: redução leve a moderada", nivel: "alterado" },
      { ate: 90, rotulo: "G2: redução leve", nivel: "alterado" },
      { rotulo: "G1: normal ou alta", nivel: "normal" },
    ]),
    observacao: "Calculada pela creatinina, idade e sexo (equação CKD-EPI 2021, sem raça).",
  },

  // ───────────── Função hepática ─────────────
  {
    id: "tgo", nome: "TGO (AST)", grupo: "Função hepática", unidade: "U/L", casas: 0,
    referencia: { M: "até 40", F: "até 32" },
    variantes: porSexo(faixasAte(40), faixasAte(32)),
  },
  {
    id: "tgp", nome: "TGP (ALT)", grupo: "Função hepática", unidade: "U/L", casas: 0,
    referencia: { M: "até 41", F: "até 33" },
    variantes: porSexo(faixasAte(41), faixasAte(33)),
  },
  {
    id: "ggt", nome: "Gama-GT", grupo: "Função hepática", unidade: "U/L", casas: 0,
    referencia: { M: "8 – 61", F: "5 – 36" },
    variantes: porSexo(faixasEntre(8, 61), faixasEntre(5, 36)),
  },
  {
    id: "fosfatase_alcalina", nome: "Fosfatase alcalina", grupo: "Função hepática", unidade: "U/L", casas: 0,
    referencia: { M: "40 – 129", F: "35 – 104" },
    variantes: porSexo(faixasEntre(40, 129), faixasEntre(35, 104)),
  },
  {
    id: "bilirrubina_total", nome: "Bilirrubina total", grupo: "Função hepática", unidade: "mg/dL", casas: 2,
    referencia: "0,30 – 1,20",
    variantes: unica(faixasEntre(0.3, 1.2, { alto: "Hiperbilirrubinemia" })),
  },

  // ───────────── Tireoide ─────────────
  {
    id: "tsh", nome: "TSH", grupo: "Tireoide", unidade: "mUI/L", casas: 2,
    referencia: "0,40 – 4,50",
    variantes: unica(faixasEntre(0.4, 4.5, { baixo: "TSH suprimido (avaliar hipertireoidismo)", alto: "TSH elevado (avaliar hipotireoidismo)" })),
  },
  {
    id: "t4_livre", nome: "T4 livre", grupo: "Tireoide", unidade: "ng/dL", casas: 2,
    referencia: "0,90 – 1,70",
    variantes: unica(faixasEntre(0.9, 1.7)),
  },

  // ───────────── Metabolismo do ferro ─────────────
  {
    id: "ferro", nome: "Ferro sérico", grupo: "Metabolismo do ferro", unidade: "µg/dL", casas: 0,
    referencia: { M: "65 – 175", F: "50 – 170" },
    variantes: porSexo(faixasEntre(65, 175), faixasEntre(50, 170)),
  },
  {
    id: "ferritina", nome: "Ferritina", grupo: "Metabolismo do ferro", unidade: "ng/mL", casas: 0,
    referencia: { M: "30 – 400", F: "15 – 150" },
    variantes: porSexo(
      faixasEntre(30, 400, { baixo: "Estoque de ferro baixo", alto: "Ferritina elevada (inflamação/sobrecarga)" }),
      faixasEntre(15, 150, { baixo: "Estoque de ferro baixo", alto: "Ferritina elevada (inflamação/sobrecarga)" }),
    ),
  },

  // ───────────── Eletrólitos ─────────────
  {
    id: "sodio", nome: "Sódio", grupo: "Eletrólitos", unidade: "mEq/L", casas: 0,
    referencia: "135 – 145",
    variantes: unica(faixasEntre(135, 145, { baixo: "Hiponatremia", alto: "Hipernatremia", criticoAbaixo: 120, criticoAcima: 160 })),
  },
  {
    id: "potassio", nome: "Potássio", grupo: "Eletrólitos", unidade: "mEq/L", casas: 1,
    referencia: "3,5 – 5,1",
    variantes: unica(faixasEntre(3.5, 5.1, { baixo: "Hipocalemia", alto: "Hipercalemia", criticoAbaixo: 2.5, criticoAcima: 6.5 })),
  },
];

export const EXAMES_POR_ID: ReadonlyMap<string, Exame> = new Map(EXAMES.map((e) => [e.id, e]));

export function exame(id: string): Exame {
  const e = EXAMES_POR_ID.get(id);
  if (!e) throw new Error(`Exame desconhecido: ${id}`);
  return e;
}
