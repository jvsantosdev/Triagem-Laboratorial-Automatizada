import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "./style.css";
import { triar, type Triagem } from "./core/triagem";
import type { Valores } from "./core/calculos";
import type { Sexo } from "./core/tipos";
import { carregar, salvar } from "./ui/armazenamento";
import { renderizarCampos, renderizarFila, renderizarLaudo } from "./ui/render";

const $ = <T extends Element>(seletor: string) => document.querySelector<T>(seletor)!;

const form = $<HTMLFormElement>("#form-triagem");
const camposExames = $<HTMLDivElement>("#campos-exames");
const laudo = $<HTMLDivElement>("#resultado-laudo");
const fila = $<HTMLDivElement>("#fila");
const erro = $<HTMLParagraphElement>("#erro");

let triagens: Triagem[] = carregar();
let selecionada: string | undefined;

camposExames.innerHTML = renderizarCampos();
atualizarFila();

form.addEventListener("submit", (ev) => {
  ev.preventDefault();
  erro.textContent = "";

  const dados = new FormData(form);
  const nome = String(dados.get("nome") ?? "").trim();
  const sexo = dados.get("sexo") as Sexo;
  const idade = Number(dados.get("idade"));

  const valores: Valores = {};
  form.querySelectorAll<HTMLInputElement>("input[data-exame]").forEach((input) => {
    // Aceita vírgula decimal, como se digita no Brasil.
    const texto = input.value.trim().replace(",", ".");
    if (texto !== "") valores[input.dataset.exame!] = Number(texto);
  });

  if (!Number.isInteger(idade) || idade < 0 || idade > 120) {
    erro.textContent = "Informe uma idade válida (0 a 120 anos).";
    return;
  }
  if (Object.keys(valores).length === 0) {
    erro.textContent = "Preencha pelo menos um exame.";
    return;
  }
  if (Object.values(valores).some((v) => v === undefined || !Number.isFinite(v) || v < 0)) {
    erro.textContent = "Há valores inválidos. Use só números positivos.";
    return;
  }

  const t = triar({ nome, sexo, idade }, valores);
  triagens = [...triagens, t];
  salvar(triagens);
  mostrar(t);
});

fila.addEventListener("click", (ev) => {
  const alvo = (ev.target as HTMLElement).closest<HTMLElement>("[data-abrir],[data-remover]");
  if (!alvo) return;
  if (alvo.dataset.remover) {
    triagens = triagens.filter((t) => t.id !== alvo.dataset.remover);
    salvar(triagens);
    if (selecionada === alvo.dataset.remover) {
      selecionada = undefined;
      laudo.innerHTML = `<p class="vazio">Amostra removida. Escolha outra na fila ou analise uma nova.</p>`;
    }
    atualizarFila();
  } else {
    const t = triagens.find((x) => x.id === alvo.dataset.abrir);
    if (t) mostrar(t);
  }
});

$<HTMLButtonElement>("#limpar-form").addEventListener("click", () => {
  form.reset();
  erro.textContent = "";
});

function mostrar(t: Triagem) {
  selecionada = t.id;
  laudo.innerHTML = renderizarLaudo(t);
  atualizarFila();
  const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  laudo.scrollIntoView({ behavior: suave ? "smooth" : "auto", block: "start" });
}

function atualizarFila() {
  fila.innerHTML = renderizarFila(triagens, selecionada);
}
