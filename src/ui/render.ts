import { EXAMES } from "../data/exames";
import { achados, filaDePrioridade, type Triagem } from "../core/triagem";
import type { Exame, Grupo, Resultado } from "../core/tipos";
import { escaparHtml, formatarData, formatarNumero, ROTULO_NIVEL, ROTULO_PRIORIDADE } from "./formatar";

/** Agrupa preservando a ordem em que os grupos aparecem na tabela. */
function agrupar<T>(itens: T[], grupoDe: (item: T) => Grupo): Map<Grupo, T[]> {
  const mapa = new Map<Grupo, T[]>();
  for (const item of itens) {
    const g = grupoDe(item);
    mapa.set(g, [...(mapa.get(g) ?? []), item]);
  }
  return mapa;
}

/** Campos do formulário, gerados a partir da tabela (exames calculados ficam de fora). */
export function renderizarCampos(): string {
  const grupos = agrupar(EXAMES.filter((e) => !e.calculado), (e) => e.grupo);
  return [...grupos]
    .map(([grupo, exames], i) => {
      const calculados = EXAMES.filter((e) => e.calculado && e.grupo === grupo).map((e) => e.nome);
      return `
      <details class="painel" ${i === 0 ? "open" : ""}>
        <summary>${grupo}${calculados.length ? ` <span class="calc-info">+ calcula ${calculados.join(", ")}</span>` : ""}</summary>
        <div class="grade">
          ${exames.map(campo).join("")}
        </div>
      </details>`;
    })
    .join("");
}

function campo(e: Exame): string {
  const passo = e.casas === 0 ? "1" : `0.${"0".repeat(e.casas - 1)}1`;
  return `
    <label class="campo">
      <span>${e.nome} <small>(${e.unidade})</small></span>
      <input type="number" inputmode="decimal" step="${passo}" min="0" name="${e.id}" data-exame="${e.id}">
    </label>`;
}

export function renderizarLaudo(t: Triagem): string {
  const p = t.paciente;
  const principais = achados(t);
  const grupos = agrupar(t.resultados, (r) => r.exame.grupo);

  return `
    <div class="laudo-cabecalho">
      <div>
        <h4>${escaparHtml(p.nome) || "Paciente sem nome"}</h4>
        <p class="meta">${p.sexo === "M" ? "Masculino" : "Feminino"} · ${p.idade} anos · ${formatarData(t.dataISO)}</p>
      </div>
      <span class="badge prioridade-${t.prioridade}">${ROTULO_PRIORIDADE[t.prioridade]}</span>
    </div>

    ${t.avisos.map((a) => `<p class="aviso">⚠️ ${escaparHtml(a.mensagem)}</p>`).join("")}

    ${
      principais.length
        ? `<div class="resumo"><strong>Achados (${principais.length}):</strong>
             <ul>${principais.map((r) => `<li class="nivel-${r.faixa.nivel}">${r.exame.nome}: ${r.faixa.rotulo}</li>`).join("")}</ul>
           </div>`
        : `<p class="tudo-normal">✔ Todos os resultados informados estão dentro da referência.</p>`
    }

    ${[...grupos]
      .map(
        ([grupo, resultados]) => `
      <table class="tabela">
        <caption>${grupo}</caption>
        <thead><tr><th>Exame</th><th>Resultado</th><th>Referência</th><th>Interpretação</th></tr></thead>
        <tbody>${resultados.map(linha).join("")}</tbody>
      </table>`,
      )
      .join("")}
    <p class="rodape">Triagem automatizada para fins educacionais. Não substitui laudo liberado por profissional habilitado.</p>`;
}

function linha(r: Resultado): string {
  const e = r.exame;
  return `
    <tr class="nivel-${r.faixa.nivel}">
      <td>${e.nome}${e.calculado ? ` <span class="tag" title="${escaparHtml(e.observacao ?? "")}">calculado</span>` : ""}</td>
      <td class="num">${formatarNumero(r.valor, e.casas)} <small>${e.unidade}</small></td>
      <td>${r.referencia}</td>
      <td><span class="badge nivel-${r.faixa.nivel}">${ROTULO_NIVEL[r.faixa.nivel]}</span> ${r.faixa.rotulo}</td>
    </tr>`;
}

export function renderizarFila(triagens: Triagem[], selecionada?: string): string {
  if (!triagens.length) return `<p class="vazio">Nenhuma amostra triada ainda.</p>`;
  return `
    <ol class="fila">
      ${filaDePrioridade(triagens)
        .map(
          (t) => `
        <li class="${t.id === selecionada ? "ativa" : ""}">
          <button class="item-fila" data-abrir="${t.id}">
            <span class="ponto prioridade-${t.prioridade}"></span>
            <span class="nome">${escaparHtml(t.paciente.nome) || "Sem nome"}</span>
            <span class="meta">${achados(t).length} achado(s) · ${formatarData(t.dataISO)}</span>
          </button>
          <button class="remover" data-remover="${t.id}" title="Remover da fila" aria-label="Remover">✕</button>
        </li>`,
        )
        .join("")}
    </ol>`;
}
