# 🧪 Triagem Laboratorial Automatizada

Sistema web de **triagem laboratorial** que classifica resultados de 36 exames, calcula índices clínicos e organiza as amostras numa **fila de prioridade por valor crítico**. Foi feito por um biomédico que virou dev, a partir dos gargalos que eu via na rotina de laboratório.

> ⚠️ **Projeto educacional.** Os valores de referência são aproximados (adultos) e variam entre laboratórios e métodos. Não use para decisão clínica. Use só dados fictícios.

## O que ele faz

- **36 exames em 8 grupos:** hemograma completo (com leucograma e plaquetas), glicemia e HbA1c, lipidograma, função renal, função hepática, tireoide, metabolismo do ferro e eletrólitos.
- **Referência por sexo e idade:** hemoglobina, creatinina, ferritina e outros exames têm faixas diferentes para homens e mulheres.
- **Três níveis de resultado:** normal, alterado e **crítico** (ex.: K⁺ > 6,5, plaquetas < 20.000, Hb < 7).
- **Cálculos automáticos:**
  - VCM, HCM e CHCM a partir de Hb, Ht e hemácias
  - LDL por **Friedewald** (só calcula com TG < 400 e avisa quando não dá)
  - Colesterol **não-HDL**
  - **TFG pela CKD-EPI 2021**, com estágio KDIGO (G1–G5)
- **Fila de prioridade:** valores críticos sobem para o topo; com a mesma prioridade, a amostra mais antiga vem primeiro.
- **Laudo preliminar:** um resumo dos achados, do mais grave ao mais leve, e tabelas por grupo.
- **Histórico no navegador** (localStorage). A análise é refeita ao carregar, então mudanças nas regras valem também para o histórico.

## Como funciona: motor de regras

A versão 1 tinha 3 exames escritos em `if/else`. Na versão 2, **os exames são dados**. Cada exame é uma linha em [`src/data/exames.ts`](src/data/exames.ts), com faixas ordenadas:

```ts
{
  id: "glicose", nome: "Glicose de jejum", unidade: "mg/dL",
  variantes: [{ faixas: [
    { ate: 40,  rotulo: "Hipoglicemia grave (valor crítico)", nivel: "critico" },
    { ate: 70,  rotulo: "Hipoglicemia", nivel: "alterado" },
    { ate: 100, rotulo: "Normoglicemia", nivel: "normal" },
    { ate: 126, rotulo: "Glicemia de jejum alterada (pré-diabetes)", nivel: "alterado" },
    { ate: 500, rotulo: "Compatível com diabetes", nivel: "alterado" },
    {           rotulo: "Hiperglicemia grave (valor crítico)", nivel: "critico" },
  ]}],
}
```

O motor ([`src/core/motor.ts`](src/core/motor.ts)) escolhe a variante pelo sexo e pela idade do paciente e encaixa o valor na primeira faixa cujo limite é maior que ele. **Para adicionar um exame, basta acrescentar uma linha na tabela.** Um teste de consistência garante que as faixas estão em ordem e que cada variante tem exatamente uma faixa normal.

```
src/
├── core/
│   ├── tipos.ts      → tipos do domínio (Paciente, Exame, Faixa, Resultado)
│   ├── motor.ts      → classificação, pior nível, prioridade
│   ├── calculos.ts   → VCM/HCM/CHCM, Friedewald, não-HDL, CKD-EPI 2021
│   └── triagem.ts    → junta tudo: triagem completa e fila
├── data/exames.ts    → tabela de exames e valores de referência
├── ui/               → renderização, formatação e localStorage
└── main.ts
tests/                → 93 testes (Vitest)
```

## Stack

- **TypeScript** (strict) + **Vite**, sem framework: o foco está na lógica de domínio.
- **Vitest**: 93 testes cobrindo as faixas de cada exame, os limites (inclusivo/exclusivo), os valores críticos, as fórmulas (TFG conferida com a equação publicada) e a integridade da tabela.
- **GitHub Actions**: roda os testes e o build a cada push e publica no GitHub Pages.

## Rodar localmente

```bash
npm install
npm run dev     # abre em http://localhost:5173
npm test        # roda os testes
npm run build   # gera a versão de produção em dist/
```

## Referências usadas

- Critérios de glicemia e HbA1c: American Diabetes Association (Standards of Care).
- Lipidograma: Atualização da Diretriz Brasileira de Dislipidemias (SBC, 2017).
- TFG: equação CKD-EPI 2021 (Inker et al., *NEJM* 2021) e estágios KDIGO.
- Hemograma, valores críticos e demais faixas: referências usuais de laboratório clínico (SBPC/ML).

## Próximos passos

- [ ] Gráfico da evolução de cada exame por paciente
- [ ] Laudo em PDF
- [ ] Importação de resultados por CSV
- [ ] Backend (FastAPI + PostgreSQL) com papéis de usuário e log de auditoria (LGPD)
- [ ] Assistente com IA/RAG que explica o resultado em linguagem simples, baseado em diretrizes

---

Feito por [João Vitor Santos de Oliveira](https://www.linkedin.com/in/joao-vitor-santos-de-oliveira): biomédico e dev full stack.
