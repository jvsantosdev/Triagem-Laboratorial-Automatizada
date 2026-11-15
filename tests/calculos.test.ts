import { describe, expect, it } from "vitest";
import { calcularDerivados, chcm, hcm, ldlFriedewald, naoHdl, tfgCkdEpi2021, vcm } from "../src/core/calculos";

describe("índices hematimétricos", () => {
  it("calcula VCM, HCM e CHCM de um hemograma normal", () => {
    // Hb 15 g/dL, Ht 45%, Hemácias 5,0 milhões/µL
    expect(vcm(45, 5)).toBeCloseTo(90, 5);
    expect(hcm(15, 5)).toBeCloseTo(30, 5);
    expect(chcm(15, 45)).toBeCloseTo(33.33, 2);
  });
});

describe("lipidograma", () => {
  it("calcula LDL por Friedewald", () => {
    // 200 − 50 − 150/5 = 120
    expect(ldlFriedewald(200, 50, 150)).toBe(120);
  });

  it("não calcula LDL com TG ≥ 400 (a fórmula perde validade)", () => {
    expect(ldlFriedewald(250, 40, 400)).toBeNull();
  });

  it("calcula colesterol não-HDL", () => {
    expect(naoHdl(200, 50)).toBe(150);
  });
});

describe("TFG CKD-EPI 2021", () => {
  // Valores conferidos com a equação publicada (Inker et al., NEJM 2021).
  it("homem, 50 anos, creatinina 1,0 → ~92", () => {
    expect(tfgCkdEpi2021(1.0, 50, "M")).toBeCloseTo(91.7, 1);
  });

  it("mulher, 60 anos, creatinina 0,8 → ~84", () => {
    expect(tfgCkdEpi2021(0.8, 60, "F")).toBeCloseTo(84.3, 1);
  });

  it("creatinina abaixo de κ usa o expoente α", () => {
    // Mulher, 30 anos, creatinina 0,5 (Scr/κ < 1)
    const esperado = 142 * (0.5 / 0.7) ** -0.241 * 0.9938 ** 30 * 1.012;
    expect(tfgCkdEpi2021(0.5, 30, "F")).toBeCloseTo(esperado, 6);
  });

  it("cai com a idade e com a creatinina", () => {
    expect(tfgCkdEpi2021(1.0, 70, "M")).toBeLessThan(tfgCkdEpi2021(1.0, 40, "M"));
    expect(tfgCkdEpi2021(2.0, 50, "M")).toBeLessThan(tfgCkdEpi2021(1.0, 50, "M"));
  });
});

describe("calcularDerivados", () => {
  const paciente = { nome: "Teste", sexo: "M" as const, idade: 50 };

  it("acrescenta só os derivados possíveis", () => {
    const { valores } = calcularDerivados({ hemoglobina: 15, hematocrito: 45 }, paciente);
    expect(valores.chcm).toBeCloseTo(33.33, 2);
    expect(valores.vcm).toBeUndefined(); // falta hemácias
    expect(valores.tfg).toBeUndefined(); // falta creatinina
  });

  it("não sobrescreve um valor informado pelo usuário", () => {
    const { valores } = calcularDerivados({ hemoglobina: 15, hematocrito: 45, hemacias: 5, vcm: 88 }, paciente);
    expect(valores.vcm).toBe(88);
  });

  it("avisa quando o LDL não pode ser calculado", () => {
    const { valores, avisos } = calcularDerivados({ colesterol_total: 250, hdl: 40, triglicerides: 450 }, paciente);
    expect(valores.ldl).toBeUndefined();
    expect(valores.nao_hdl).toBe(210);
    expect(avisos.map((a) => a.exameId)).toContain("ldl");
  });

  it("calcula a TFG a partir da creatinina", () => {
    const { valores } = calcularDerivados({ creatinina: 1.0 }, paciente);
    expect(valores.tfg).toBeCloseTo(91.7, 1);
  });
});
