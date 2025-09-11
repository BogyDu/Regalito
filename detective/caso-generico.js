const casoActual = window.casoActual || "caso1";

function mostrarPista(id){
  const contenido = pistas[id];
  document.getElementById("pistas").innerHTML = contenido;
  let lista = JSON.parse(localStorage.getItem("pistas"+casoActual)) || [];
  if(!lista.includes(id)) lista.push(id);
  localStorage.setItem("pistas"+casoActual, JSON.stringify(lista));
  localStorage.setItem("desc-"+casoActual+"-"+id, contenido);
}

function mostrarSospechoso(id){
  const contenido = sospechosos[id];
  document.getElementById("sospechosos").innerHTML = contenido;
  let lista = JSON.parse(localStorage.getItem("interrogados"+casoActual)) || [];
  if(!lista.includes(id)) lista.push(id);
  localStorage.setItem("interrogados"+casoActual, JSON.stringify(lista));
}

function interrogar(){
  const s = document.getElementById("inter-sospechoso").value;
  const p = document.getElementById("inter-pregunta").value;
  if(!s || !p) return alert("Selecciona sospechoso y pregunta");
  const r = respuestas[s][p];
  document.getElementById("respuesta-interrogatorio").innerHTML = `<strong>${s}</strong>: ${r}`;
  let allRes = JSON.parse(localStorage.getItem("respuestasInterrogatorio")) || {};
  if(!allRes[casoActual]) allRes[casoActual]={};
  if(!allRes[casoActual][s]) allRes[casoActual][s]={};
  allRes[casoActual][s][p] = r;
  localStorage.setItem("respuestasInterrogatorio", JSON.stringify(allRes));
  let lista = JSON.parse(localStorage.getItem("interrogados"+casoActual)) || [];
  if(!lista.includes(s)) lista.push(s);
  localStorage.setItem("interrogados"+casoActual, JSON.stringify(lista));
}

function confrontar(){
  const s1 = document.getElementById("conf1").value;
  const s2 = document.getElementById("conf2").value;
  if(!s1 || !s2 || s1===s2) { 
    document.getElementById("confrontacion").innerHTML = "Selecciona dos sospechosos distintos."; 
    return;
  }
  const key1 = `${s1}-${s2}`;
  const key2 = `${s2}-${s1}`;
  if(contradicciones[key1] || contradicciones[key2]){
    const contr = contradicciones[key1] || contradicciones[key2];
    document.getElementById("confrontacion").innerHTML = `Contradicción: ${contr.texto}`;
    let secretas = JSON.parse(localStorage.getItem("pistasSecretas"+casoActual)) || [];
    if(!secretas.includes(contr.pista)) secretas.push(contr.pista);
    localStorage.setItem("pistasSecretas"+casoActual, JSON.stringify(secretas));
    localStorage.setItem("desc-"+casoActual+"-"+contr.pista, contr.pista);
    if(contr.sospechosoDesbloqueado){
      sospechosos[contr.sospechosoDesbloqueado.id] = contr.sospechosoDesbloqueado.descripcion;
      respuestas[contr.sospechosoDesbloqueado.id] = contr.sospechosoDesbloqueado.respuestas;
    }
  } else {
    document.getElementById("confrontacion").innerHTML = "No hay contradicciones.";
  }
}

function resolverCaso(){
  const seleccion = document.getElementById("culpable").value;
  if(!seleccion) return alert("Selecciona un culpable");
  if(seleccion === culpableReal){
    document.getElementById("resultado").innerHTML = "✅ Correcto! Caso resuelto.";
    marcarCasoResuelto(casoActual);
  } else {
    document.getElementById("resultado").innerHTML = "❌ Incorrecto. Sigue investigando.";
  }
}

function marcarCasoResuelto(id){
  const progreso = JSON.parse(localStorage.getItem("progresoCasos")) || {};
  progreso[id] = true;
  localStorage.setItem("progresoCasos", JSON.stringify(progreso));
}

function inicializarCaso(){
  const pistasSec = document.getElementById("pistas-seccion");
  for(const id in pistas){
    let btn = document.createElement("button");
    btn.textContent = id;
    btn.onclick = ()=>mostrarPista(id);
    pistasSec.appendChild(btn);
  }
  const sospSec = document.getElementById("sospechosos-seccion");
  const selects = [document.getElementById("conf1"), document.getElementById("conf2"), document.getElementById("inter-sospechoso"), document.getElementById("culpable")];
  for(const id in sospechosos){
    let btn = document.createElement("button");
    btn.textContent = id;
    btn.onclick = ()=>mostrarSospechoso(id);
    sospSec.appendChild(btn);
    selects.forEach(s=>{
      let opt = document.createElement("option");
      opt.value = id; opt.textContent = id;
      s.appendChild(opt);
    });
  }
}
