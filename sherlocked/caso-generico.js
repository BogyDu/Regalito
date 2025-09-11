// Funciones genéricas
function mostrarPista(id){
  document.getElementById("pistas").innerHTML = pistas[id];
  guardarLista("pistas"+casoActual, id);
}

function mostrarSospechoso(id){
  document.getElementById("sospechosos").innerHTML = sospechosos[id];
  guardarLista("interrogados"+casoActual, id);
}

function interrogar(){
  const s = document.getElementById("inter-sospechoso").value;
  const p = document.getElementById("inter-pregunta").value;
  if(!s||!p) return;
  const r = respuestas[s][p];
  document.getElementById("respuesta-interrogatorio").innerHTML = `<strong>${s}</strong>: ${r}`;
  
  let resp = JSON.parse(localStorage.getItem("respuestasInterrogatorio")) || {};
  if(!resp[casoActual]) resp[casoActual]={};
  if(!resp[casoActual][s]) resp[casoActual][s]={};
  resp[casoActual][s][p]=r;
  localStorage.setItem("respuestasInterrogatorio", JSON.stringify(resp));
}

function confrontar(){
  const s1=document.getElementById("conf1").value;
  const s2=document.getElementById("conf2").value;
  if(!s1||!s2||s1===s2){ document.getElementById("confrontacion").innerHTML="Selecciona dos sospechosos distintos."; return;}
  const key = `${s1}-${s2}`;
  if(contradicciones[key]){
    document.getElementById("confrontacion").innerHTML = `Contradicción: ${contradicciones[key].texto}`;
    desbloquearPista(contradicciones[key].pista);
  } else { document.getElementById("confrontacion").innerHTML = "No hay contradicciones.";}
}

function desbloquearPista(texto){
  let secretas = JSON.parse(localStorage.getItem("pistasSecretas"+casoActual)) || [];
  if(!secretas.includes(texto)){ secretas.push(texto); localStorage.setItem("pistasSecretas"+casoActual, JSON.stringify(secretas)); }
}

function resolverCaso(){
  const seleccion = document.getElementById("culpable").value;
  if(seleccion===culpableReal){
    document.getElementById("resultado").innerHTML = "Correcto! Caso resuelto.";
    marcarCasoResuelto(casoActual);
  } else { document.getElementById("resultado").innerHTML = "Incorrecto. Sigue investigando."; }
}

function guardarLista(nombre, item){
  let lista = JSON.parse(localStorage.getItem(nombre)) || [];
  if(!lista.includes(item)){ lista.push(item); localStorage.setItem(nombre, JSON.stringify(lista)); }
}

function marcarCasoResuelto(id){
  const progreso = JSON.parse(localStorage.getItem("progresoCasos")) || {};
  progreso[id]=true;
  localStorage.setItem("progresoCasos", JSON.stringify(progreso));
}
