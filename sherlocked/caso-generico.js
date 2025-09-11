// -------------------
// Datos del caso (modificar para cada caso)
// -------------------
const pistas = {
  forense: "Informe forense detallado del caso...",
  escena: "Descripción de la escena del crimen...",
  bitacora: "Bitácora de la víctima o documentos relevantes...",
  ramirez: "Notas del detective sobre el caso..."
};

const sospechosos = {
  sofia: "Sofía Ortega: descripción breve.",
  mateo: "Mateo Duarte: descripción breve.",
  camila: "Camila Torres: descripción breve.",
  ernesto: "Ernesto Vega: descripción breve.",
  padre: "Padre Anselmo: descripción breve."
};

const respuestas = {
  sofia: { donde:"", motivo:"", relacion:"" },
  mateo: { donde:"", motivo:"", relacion:"" },
  camila: { donde:"", motivo:"", relacion:"" },
  ernesto: { donde:"", motivo:"", relacion:"" },
  padre: { donde:"", motivo:"", relacion:"" }
};

const contradicciones = {
  "sofia-mateo": { texto:"Sofía y Mateo contradicen sus coartadas", pista:"Documento relevante" }
};

// Indica cuál es el culpable para resolver
const culpableReal = "ernesto";

// -------------------
// Funciones genéricas
// -------------------
function mostrarPista(id) {
  document.getElementById("pistas").innerHTML = pistas[id];
  guardarLista("pistasCasoActual", id);
  actualizarDossier();
}

function mostrarSospechoso(id) {
  document.getElementById("sospechosos").innerHTML = sospechosos[id];
  guardarLista("sospechososCasoActual", id);
  actualizarDossier();
}

function confrontar() {
  const s1 = document.getElementById("conf1").value;
  const s2 = document.getElementById("conf2").value;
  const div = document.getElementById("confrontacion");

  if(!s1 || !s2 || s1===s2) {
    div.innerHTML = "<p style='color:red;'>Selecciona dos sospechosos distintos.</p>";
    return;
  }

  const key = `${s1}-${s2}`;
  if(contradicciones[key]) {
    div.innerHTML = `<p style='color:green;'>Contradicción encontrada: ${contradicciones[key].texto}</p>`;
    desbloquearPista(contradicciones[key].pista);
  } else {
    div.innerHTML = "<p style='color:gray;'>No se detectaron contradicciones.</p>";
  }
}

function interrogar() {
  const sospechoso = document.getElementById("inter-sospechoso").value;
  const pregunta = document.getElementById("inter-pregunta").value;
  const div = document.getElementById("respuesta-interrogatorio");
  if(!sospechoso || !pregunta){ div.innerHTML="<p style='color:red;'>Selecciona ambos.</p>"; return; }
  const respuesta = respuestas[sospechoso][pregunta];
  div.innerHTML = `<p><strong>${sospechoso} responde:</strong> ${respuesta}</p>`;

  let interrogados = JSON.parse(localStorage.getItem("interrogadosCasoActual")) || [];
  if(!interrogados.includes(sospechoso)){ interrogados.push(sospechoso); localStorage.setItem("interrogadosCasoActual", JSON.stringify(interrogados)); }

  let resp = JSON.parse(localStorage.getItem("respuestasInterrogatorio")) || {};
  if(!resp[sospechoso]) resp[sospechoso]={};
  resp[sospechoso][pregunta]=respuesta;
  localStorage.setItem("respuestasInterrogatorio", JSON.stringify(resp));

  actualizarDossier();
}

function resolverCaso(){
  const seleccion = document.getElementById("culpable").value;
  const div = document.getElementById("resultado");
  if(!seleccion){ div.innerHTML="<p style='color:red;'>Selecciona un sospechoso</p>"; return; }
  if(seleccion===culpableReal){
    div.innerHTML="<p style='color:green;'>Correcto! Has resuelto el caso.</p>";
    marcarCasoResuelto("casoActual");
  } else {
    div.innerHTML="<p style='color:red;'>Incorrecto. Sigue investigando.</p>";
  }
}

// -------------------
// Funciones auxiliares
// -------------------
function guardarLista(nombre, item){
  let lista = JSON.parse(localStorage.getItem(nombre)) || [];
  if(!lista.includes(item)){ lista.push(item); localStorage.setItem(nombre, JSON.stringify(lista)); }
}

function desbloquearPista(texto){
  let pistasSecretas = JSON.parse(localStorage.getItem("pistasSecretasCasoActual")) || [];
  if(!pistasSecretas.includes(texto)) { pistasSecretas.push(texto); localStorage.setItem("pistasSecretasCasoActual", JSON.stringify(pistasSecretas)); }
  actualizarDossier();
}

function actualizarDossier(){
  // Se puede llamar al dossier.html para refrescar listas
}

function abrirDossier(){
  window.open("dossier.html", "Dossier", "width=800,height=600,scrollbars=yes");
}

function marcarCasoResuelto(id){
  const progreso = JSON.parse(localStorage.getItem("progresoCasos")) || {};
  progreso[id]=true;
  localStorage.setItem("progresoCasos", JSON.stringify(progreso));
}

// -------------------
// Inicialización: generar botones y selects
// -------------------
document.addEventListener("DOMContentLoaded", ()=>{
  const pistasSec = document.getElementById("pistas-seccion");
  for(const id in pistas){ 
    let btn=document.createElement("button"); 
    btn.textContent=id; 
    btn.onclick=()=>mostrarPista(id); 
    pistasSec.appendChild(btn);
  }

  const sospSec=document.getElementById("sospechosos-seccion");
  const selects = [document.getElementById("conf1"), document.getElementById("conf2"), document.getElementById("inter-sospechoso"), document.getElementById("culpable")];
  for(const id in sospechosos){
    let btn=document.createElement("button");
    btn.textContent=id;
    btn.onclick=()=>mostrarSospechoso(id);
    sospSec.appendChild(btn);
    selects.forEach(sel=>{
      let opt=document.createElement("option"); opt.value=id; opt.text=id; sel.add(opt);
    });
  }
});
