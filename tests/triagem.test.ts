import { describe, expect, it } from "vitest";
import { achados, filaDePrioridade, triar } from "../src/core/triagem";
import type { Paciente } from "../src/core/tipos";

const paciente: Paciente = { nome: "Maria Teste", sexo: "F", idade: 55 };

describe("triar", () => {
  it("monta o laudo com calculados e define prioridade", () => {
    const t = triar(paciente, {
      hemoglobina: 10.5, hematocrito: 32, hemacias: 4.2,
      colesterol_total: 230, hdl: 45, triglicerides: 180,
      creatinina: 0.9,
    });

    const ids = t.resultados.map((r) => r.exame.id);
    expect(ids).toEqual(expect.arrayContaining(["vcm", "hcm", "chcm", "ldl", "nao_hdl", "tfg"]));
    expect(t.prioridade).toBe("media");
    expect(achados(t).map((r) => r.exame.id)).toContain("hemoglobina");
  });

  it("valor crítico gera prioridade alta e aparece primeiro nos achados", () => {
    const t = triar(paciente, { glicose: 110, potassio: 7.1 });
    expect(t.prioridade).toBe("alta");
    expect(achados(t)[0].exame.id).toBe("potassio");
  });

  it("avisa quando o paciente é menor de idade", () => {
    const t = triar({ ...paciente, idade: 12 }, { glicose: 90 });
    expect(t.avisos.some((a) => a.mensagem.includes("adultos"))).toBe(true);
  });
});

describe("filaDePrioridade", () => {
  it("ordena por prioridade e, no empate, pela mais antiga", () => {
    const antiga = triar(paciente, { glicose: 110 }, new Date("2026-01-01T08:00:00Z"));
    const nova = triar(paciente, { glicose: 110 }, new Date("2026-01-01T09:00:00Z"));
    const critica = triar(paciente, { potassio: 7.0 }, new Date("2026-01-01T10:00:00Z"));
    const normal = triar(paciente, { glicose: 90 }, new Date("2026-01-01T07:00:00Z"));

    expect(filaDePrioridade([normal, nova, critica, antiga]).map((t) => t.id)).toEqual([
      critica.id, antiga.id, nova.id, normal.id,
    ]);
  });
});
