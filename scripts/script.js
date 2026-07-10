// 1. Criamos a lista vazia
let historicoPacientes = []; 

// 2. IMEDIATAMENTE vamos ao armário buscar o passado (se existir)
const dadosSalvos = localStorage.getItem("laudos_biomedicos");
if (dadosSalvos) {
  historicoPacientes = JSON.parse(dadosSalvos);
}

// 3. Capturamos os elementos da tela
const nomeInput = document.querySelector('#nome-paciente');
const sexoSelect = document.querySelector('#sexo-paciente');
const glicoseInput = document.querySelector('#valor-glicose');
const hemoglobinaInput = document.querySelector('#valor-hemoglobina');
const leucocitosInput = document.querySelector('#valor-leucocitos');
const btnAnalisar = document.querySelector('#btn-analisar');
const resultadoDiv = document.querySelector('#resultado-laudo');

// 4. Configura o clique do botão
btnAnalisar.addEventListener('click', () => {
  const nome = nomeInput.value;
  const sexo = sexoSelect.value; 
  const glicose = Number(glicoseInput.value);
  const hemoglobina = Number(hemoglobinaInput.value);
  const leucocitos = Number(leucocitosInput.value);

  let diagnosticoGlicose = "";
  let diagnosticoHemoglobina = "";
  let diagnosticoLeucocitos = "";

  // Lógica da Glicose
  if (glicose < 70) {
    diagnosticoGlicose = "Hipoglicemia (Abaixo do referencial)";
  } else if (glicose >= 70 && glicose < 100) {
    diagnosticoGlicose = "Normoglicemia (Normal)";
  } else if (glicose >= 100 && glicose <= 125) {
    diagnosticoGlicose = "Glicemia de Jejum Alterada (Pré-diabetes)";
  } else {
    diagnosticoGlicose = "Compatível com Diabetes Mellitus tipo 2";
  }

  // Lógica dos Leucócitos
  if (leucocitos < 3600) {
    diagnosticoLeucocitos = "Leucopenia (Abaixo do referencial)";
  } else if (leucocitos > 12000) {
    diagnosticoLeucocitos = "Leucocitose (Acima do referencial)";
  } else {
    diagnosticoLeucocitos = "Leucócitos Normais (Normal)";
  }

  // Lógica da Hemoglobina (Aninhada por Sexo)
  if (sexo === "M") {
    if (hemoglobina < 12.5) {
      diagnosticoHemoglobina = "Anemia (Abaixo do referencial masculino)";
    } else if (hemoglobina > 17.0) {
      diagnosticoHemoglobina = "Poliglobulia / Hemoglobina Alta (Acima do referencial masculino)";
    } else {
      diagnosticoHemoglobina = "Hemoglobina Normal";
    }
  } else if (sexo === "F") {
    if (hemoglobina < 11.5) {
      diagnosticoHemoglobina = "Anemia (Abaixo do referencial feminino)";
    } else if (hemoglobina > 15.0) {
      diagnosticoHemoglobina = "Poliglobulia / Hemoglobina Alta (Acima do referencial feminino)";
    } else {
      diagnosticoHemoglobina = "Hemoglobina Normal";
    }
  }

  // Montando o template do laudo técnico para injetar na tela
  resultadoDiv.innerHTML = `
    <h4>Paciente: ${nome} (${sexo === 'M' ? 'Masculino' : 'Feminino'})</h4>
    <ul>
      <li><strong>Série Vermelha (Hemoglobina):</strong> ${diagnosticoHemoglobina}</li>
      <li><strong>Série Branca (Leucócitos):</strong> ${diagnosticoLeucocitos}</li>
      <li><strong>Bioquímica (Glicose):</strong> ${diagnosticoGlicose}</li>
    </ul>
  `;

  // A FICHA DO PACIENTE FICA AQUI DENTRO!
  const fichaPaciente = {
    nome: nome,
    sexo: sexo,
    glicose: glicose,
    diagnosticoGlicose: diagnosticoGlicose,
    hemoglobina: hemoglobina,
    diagnosticoHemoglobina: diagnosticoHemoglobina,
    leucocitos: leucocitos,
    diagnosticoLeucocitos: diagnosticoLeucocitos
  };
  
  historicoPacientes.push(fichaPaciente);
  localStorage.setItem("laudos_biomedicos", JSON.stringify(historicoPacientes));
  
  console.log("Histórico Atualizado:", historicoPacientes);
}); // <--- O BOTÃO SÓ FECHA AQUI AGORA!