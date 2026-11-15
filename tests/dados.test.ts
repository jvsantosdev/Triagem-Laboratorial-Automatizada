import { describe, expect, it } from "vitest";
import { EXAMES } from "../src/data/exames";

/** Garante que a tabela de referência é consistente, para que adicionar exame não quebre nada. */
describe("tabela de exames", () => {
  it("ids são únicos", () => {
    const ids = EXAMES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(EXAMES.map((e) => [e.id, e] as const))("%s: faixas válidas", (_id, exame) => {
    expect(exame.variantes.length).toBeGreaterThan(0);

    for (const variante of exame.variantes) {
      const { faixas } = variante;
      expect(faixas.length).toBeGreaterThan(1);

      // Só a última faixa fica sem limite superior.
      faixas.slice(0, -1).forEach((f) => expect(f.ate).toBeTypeOf("number"));
      expect(faixas[faixas.length - 1].ate).toBeUndefined();

      // Limites em ordem crescente.
      const limites = faixas.slice(0, -1).map((f) => f.ate as number);
      expect([...limites].sort((a, b) => a - b)).toEqual(limites);

      // Exatamente uma faixa normal.
      expect(faixas.filter((f) => f.nivel === "normal")).toHaveLength(1);
    }
  });

  it("todo exame cobre os dois sexos", () => {
    for (const exame of EXAMES) {
      for (const sexo of ["M", "F"] as const) {
        const cobre = exame.variantes.some((v) => v.sexo === undefined || v.sexo === sexo);
        expect(cobre, `${exame.id} sem variante para ${sexo}`).toBe(true);
      }
    }
  });

  it("referência por sexo existe quando as faixas dependem do sexo", () => {
    for (const exame of EXAMES) {
      if (exame.variantes.some((v) => v.sexo) && typeof exame.referencia !== "string") {
        expect(exame.referencia.M, exame.id).toBeTruthy();
        expect(exame.referencia.F, exame.id).toBeTruthy();
      }
    }
  });
});
