import { EXAMES } from "../data/exames";
import { flag } from "../core/motor";
import { achados, filaDePrioridade, type Triagem } from "../core/triagem";
import type { Exame, Grupo, Resultado } from "../core/tipos";
import { escaparHtml, formatarData, formatarNumero, ROTULO_NIVEL, ROTULO_PRIORIDADE } from "./formatar";

/** Tubo de coleta usado de verdade para cada grupo; a cor da tampa identifica a seção. */
const TUBO: Record<Grupo, { classe: string; nome: string }> = {
  Hemograma: { classe: "tubo-edta", nome: "tubo roxo, EDTA" },
  Glicemia: { classe: "tubo-fluoreto", nome: "tubo cinza, fluoreto" },
  Lipidograma: { classe: "tubo-gel", nome: "tubo amarelo, gel separador" },
  "Função renal": { classe: "tubo-gel", nome: "tubo amarelo, gel separador" },
  "Função hepática": { classe: "tubo-gel", nome: "tubo amarelo, gel separador" },
  Tireoide: { classe: "tubo-gel", nome: "tubo amarelo, gel separador" },
  "Metabolismo do ferro": { classe: "tubo-gel", nome: "tubo amarelo, gel separador" },
  Eletrólitos: { classe: "tubo-gel", nome: "tubo amarelo, gel separador" },
};

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
      const tubo = TUBO[grupo];
      const calculados = EXAMES.filter((e) => e.calculado && e.grupo === grupo).map((e) => e.nome);
      return `
      <details class="secao ${tubo.classe}" ${i === 0 ? "open" : ""}>
        <summary>
          <span class="tampa" aria-hidden="true"></span>
          <span class="secao-nome">${grupo}</span>
          <span class="secao-tubo">${tubo.nome}</span>
        </summary>
        ${calculados.length ? `<p class="secao-calc">Também calcula: ${calculados.join(", ")}.</p>` : ""}
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
      <span>${e.nome}</span>
      <span class="entrada">
        <input type="number" inputmode="decimal" step="${passo}" min="0" name="${e.id}" data-exame="${e.id}">
        <small>${e.unidade}</small>
      </span>
    </label>`;
}

export function renderizarLaudo(t: Triagem): string {
  const p = t.paciente;
  const principais = achados(t);
  const grupos = agrupar(t.resultados, (r) => r.exame.grupo);

  return `
    <article class="folha">
      <header class="folha-topo">
        <dl class="dados">
          <div><dt>Paciente</dt><dd>${escaparHtml(p.nome) || "Sem nome"}</dd></div>
          <div><dt>Sexo</dt><dd>${p.sexo === "M" ? "Masculino" : "Feminino"}</dd></div>
          <div><dt>Idade</dt><dd>${p.idade} anos</dd></div>
          <div><dt>Análise</dt><dd>${formatarData(t.dataISO)}</dd></div>
        </dl>
        <p class="prioridade prioridade-${t.prioridade}">${ROTULO_PRIORIDADE[t.prioridade]}</p>
      </header>

      ${t.avisos.map((a) => `<p class="aviso">${escaparHtml(a.mensagem)}</p>`).join("")}

      ${
        principais.length
          ? `<section class="achados">
               <h3>${principais.length === 1 ? "1 resultado fora da referência" : `${principais.length} resultados fora da referência`}</h3>
               <ul>${principais.map((r) => `<li class="nivel-${r.faixa.nivel}"><b class="flag">${flag(r)}</b><span>${r.exame.nome}: ${r.faixa.rotulo}</span></li>`).join("")}</ul>
             </section>`
          : `<p class="tudo-normal">Todos os resultados informados estão dentro da referência.</p>`
      }

      ${[...grupos]
        .map(
          ([grupo, resultados]) => `
        <table class="tabela ${TUBO[grupo].classe}">
          <caption><span class="tampa" aria-hidden="true"></span>${grupo}</caption>
          <thead><tr><th scope="col">Exame</th><th scope="col" class="num">Resultado</th><th scope="col"><abbr title="Indicador: L baixo, H alto, LL/HH crítico">Flag</abbr></th><th scope="col">Referência</th><th scope="col">Interpretação</th></tr></thead>
          <tbody>${resultados.map(linha).join("")}</tbody>
        </table>`,
        )
        .join("")}
      <p class="rodape">Triagem automatizada para fins educacionais. Não substitui laudo liberado por profissional habilitado.</p>
    </article>`;
}

function linha(r: Resultado): string {
  const e = r.exame;
  return `
    <tr class="nivel-${r.faixa.nivel}">
      <th scope="row">${e.nome}${e.calculado ? ` <span class="calc" title="${escaparHtml(e.observacao ?? "")}">calculado</span>` : ""}</th>
      <td class="num">${formatarNumero(r.valor, e.casas)} <small>${e.unidade}</small></td>
      <td class="flag">${flag(r)}</td>
      <td>${r.referencia}</td>
      <td><span class="sr">${ROTULO_NIVEL[r.faixa.nivel]}: </span>${r.faixa.rotulo}</td>
    </tr>`;
}

export function renderizarFila(triagens: Triagem[], selecionada?: string): string {
  if (!triagens.length) {
    return `<p class="vazio">Nenhuma amostra na fila. As amostras analisadas aparecem aqui.</p>`;
  }
  return `
    <ol class="fila">
      ${filaDePrioridade(triagens)
        .map((t) => {
          const n = achados(t).length;
          return `
        <li class="item prioridade-${t.prioridade} ${t.id === selecionada ? "ativa" : ""}">
          <button type="button" class="abrir" data-abrir="${t.id}" aria-current="${t.id === selecionada}">
            <span class="item-nome">${escaparHtml(t.paciente.nome) || "Sem nome"}</span>
            <span class="item-info">${n === 0 ? "Sem alterações" : n === 1 ? "1 alteração" : `${n} alterações`}, ${formatarData(t.dataISO)}</span>
          </button>
          <button type="button" class="remover" data-remover="${t.id}" aria-label="Remover amostra de ${escaparHtml(t.paciente.nome) || "paciente sem nome"}">Remover</button>
        </li>`;
        })
        .join("")}
    </ol>`;
}
