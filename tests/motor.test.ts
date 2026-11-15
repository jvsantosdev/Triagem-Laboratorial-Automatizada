import { describe, expect, it } from "vitest";
import { exame } from "../src/data/exames";
import { classificar, encontrarFaixa, flag, piorNivel, prioridade } from "../src/core/motor";
import type { Paciente } from "../src/core/tipos";

const homem: Paciente = { nome: "H", sexo: "M", idade: 40 };
const mulher: Paciente = { nome: "M", sexo: "F", idade: 40 };

const nivel = (id: string, valor: number, p: Paciente = homem) => classificar(exame(id), valor, p).faixa.nivel;
const rotulo = (id: string, valor: number, p: Paciente = homem) => classificar(exame(id), valor, p).faixa.rotulo;

describe("encontrarFaixa", () => {
  const faixas = [
    { ate: 10, rotulo: "baixo", nivel: "alterado" as const },
    { ate: 20, rotulo: "normal", nivel: "normal" as const },
    { rotulo: "alto", nivel: "alterado" as const },
  ];

  it("usa o limite superior como exclusivo", () => {
    expect(encontrarFaixa(faixas, 9.99).rotulo).toBe("baixo");
    expect(encontrarFaixa(faixas, 10).rotulo).toBe("normal");
    expect(encontrarFaixa(faixas, 20).rotulo).toBe("alto");
  });
});

describe("glicose de jejum (critérios ADA)", () => {
  it.each([
    [35, "critico", "Hipoglicemia grave (valor crítico)"],
    [65, "alterado", "Hipoglicemia"],
    [70, "normal", "Normoglicemia"],
    [99, "normal", "Normoglicemia"],
    [100, "alterado", "Glicemia de jejum alterada (pré-diabetes)"],
    [125, "alterado", "Glicemia de jejum alterada (pré-diabetes)"],
    [126, "alterado", "Compatível com diabetes (confirmar com 2ª amostra)"],
    [520, "critico", "Hiperglicemia grave (valor crítico)"],
  ])("%d mg/dL → %s", (valor, esperadoNivel, esperadoRotulo) => {
    expect(nivel("glicose", valor)).toBe(esperadoNivel);
    expect(rotulo("glicose", valor)).toBe(esperadoRotulo);
  });
});

describe("hemoglobina depende do sexo", () => {
  it("12,5 g/dL é anemia no homem e normal na mulher", () => {
    expect(rotulo("hemoglobina", 12.5, homem)).toBe("Anemia");
    expect(nivel("hemoglobina", 12.5, mulher)).toBe("normal");
  });

  it("limites da faixa normal são inclusivos", () => {
    expect(nivel("hemoglobina", 13.0, homem)).toBe("normal");
    expect(nivel("hemoglobina", 17.5, homem)).toBe("normal");
    expect(nivel("hemoglobina", 17.6, homem)).toBe("alterado");
  });

  it("abaixo de 7 g/dL é valor crítico para os dois sexos", () => {
    expect(nivel("hemoglobina", 6.5, homem)).toBe("critico");
    expect(nivel("hemoglobina", 6.5, mulher)).toBe("critico");
  });
});

describe("valores críticos", () => {
  it.each([
    ["potassio", 2.4], ["potassio", 6.8],
    ["sodio", 118], ["sodio", 165],
    ["plaquetas", 15000],
    ["leucocitos", 1500], ["leucocitos", 35000],
    ["neutrofilos", 400],
  ])("%s = %d é crítico", (id, valor) => {
    expect(nivel(id, valor)).toBe("critico");
  });

  it("limite crítico superior é inclusivo como alterado (K 6,5 ainda não é crítico)", () => {
    expect(nivel("potassio", 6.5)).toBe("alterado");
  });
});

describe("TFG por estágio KDIGO", () => {
  it.each([
    [95, "G1: normal ou alta"],
    [75, "G2: redução leve"],
    [50, "G3a: redução leve a moderada"],
    [35, "G3b: redução moderada a grave"],
    [20, "G4: redução grave"],
    [10, "G5: falência renal"],
  ])("TFG %d → %s", (valor, esperado) => {
    expect(rotulo("tfg", valor)).toBe(esperado);
  });
});

describe("prioridade", () => {
  const r = (id: string, valor: number) => classificar(exame(id), valor, homem);

  it("baixa quando tudo é normal", () => {
    expect(prioridade([r("glicose", 90), r("hemoglobina", 15)])).toBe("baixa");
  });

  it("média quando há algum alterado", () => {
    expect(prioridade([r("glicose", 110), r("hemoglobina", 15)])).toBe("media");
  });

  it("alta quando há algum crítico, mesmo com outros normais", () => {
    const resultados = [r("glicose", 90), r("potassio", 7.0), r("hemoglobina", 15)];
    expect(piorNivel(resultados)).toBe("critico");
    expect(prioridade(resultados)).toBe("alta");
  });
});

describe("flags L/H", () => {
  const f = (id: string, valor: number) => flag(classificar(exame(id), valor, homem));

  it.each([
    ["glicose", 90, ""],
    ["glicose", 65, "L"],
    ["glicose", 35, "LL"],
    ["glicose", 110, "H"],
    ["glicose", 520, "HH"],
    ["hdl", 35, "L"],
    ["tgo", 80, "H"],
    ["tfg", 50, "L"],
    ["tfg", 10, "LL"],
  ])("%s = %d → '%s'", (id, valor, esperado) => {
    expect(f(id, valor)).toBe(esperado);
  });
});
