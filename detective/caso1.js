// Caso 1 - El Faro
window.casoActual = "caso1";

// Datos del caso
const sospechosos = ["Sofia","Mateo","Clara","Javier","Lucas"];
const respuestas = {
  "Sofia":{"¿Qué viste la noche del crimen?":"Vi a Mateo salir del faro a las 10 pm.","¿Conoces a los demás sospechosos?":"Sí, los he visto varias veces."},
  "Mateo":{"¿Dónde estabas a las 10 pm?":"Estaba con Clara… pero el diario del faro muestra que eso no coincide.","¿Ves a alguien sospechoso?":"No puedo decir, todos parecen normales."},
  "Clara":{"¿Qué estabas haciendo en el faro?":"Tomando fotos de la torre.","¿Viste algo extraño?":"No, todo parecía tranquilo."},
  "Javier":{"¿Cuál era tu propósito en el faro?":"Investigar la historia del faro.","¿Alguien más estaba allí?":"Sí, vi a Mateo y Lucas."},
  "Lucas":{"¿Guardabas el faro esa noche?":"Sí, estuve revisando cada hora.","¿Alguien entró sin permiso?":"No estoy seguro, pero la puerta estaba cerrada."}
};
const pistas = ["Huella en la ventana","Llave del faro","Zapato roto"];
const pistasSecretas = ["Documento Secreto: Diario del Faro","Carta del Historiador"];

// Inicializar localStorage
if(!localStorage.getItem("pistas"+casoActual)) localStorage.setItem("pistas"+casoActual, JSON.stringify(pistas));
if(!localStorage.getItem("pistasSecretas"+casoActual)) localStorage.setItem("pistasSecretas"+casoActual, JSON.stringify([]));
if(!localStorage.getItem("interrogados"+casoActual)) localStorage.setItem("interrogados"+casoActual, JSON.stringify([]));
if(!localStorage.getItem("notas"+casoActual)) localStorage.setItem("notas"+casoActual, JSON.stringify(""));

// Crear botones de sospechosos para interrogar
function crearBotonesSospechosos(){
  const cont = document.getElementById("botones-sospechosos");
  cont.innerHTML="";
  sospechosos.forEach(s=>{
    const btn = document.createElement("button");
    btn.textContent = s;
    btn.className="interaccion-boton";
    btn.onclick = ()=>interrogar(s);
    cont.appendChild(btn);
  });
}

// Crear botones de confrontación
function crearBotonesConfrontar(){
  const cont = document.getElementById("botones-confrontar");
  cont.innerHTML="";
  sospechosos.forEach(s=>{
    const btn = document.createElement("button");
    btn.textContent = s;
    btn.className="interaccion-boton";
    btn.onclick = ()=>confrontar(s);
    cont.appendChild(btn);
  });
}

// Interrogar sospechoso
function interrogar(nombre){
  let interrogados = JSON.parse(localStorage.getItem("interrogados"+casoActual)) || [];
  if(!interrogados.includes(nombre)) interrogados.push(nombre);
  localStorage.setItem("interrogados"+casoActual, JSON.stringify(interrogados));

  // Descubrir pista secreta si corresponde
  if(nombre==="Mateo"){
    let secretas = JSON.parse(localStorage.getItem("pistasSecretas"+casoActual)) || [];
    if(!secretas.includes("Documento Secreto: Diario del Faro")){
      secretas.push("Documento Secreto: Diario del Faro");
      localStorage.setItem("pistasSecretas"+casoActual, JSON.stringify(secretas));
      alert("Se ha descubierto una pista secreta!");
    }
  }
}

// Confrontar sospechosos
function confrontar(nombre){
  alert("Confrontando a " + nombre + "...");
  if(nombre==="Sofia"){
    alert("Sofia admite haber visto a Mateo salir del faro.");
  } else if(nombre==="Mateo"){
    alert("Mateo se muestra nervioso y se contradice con la evidencia del diario.");
  } else {
    alert(nombre + " no aporta información relevante.");
  }
}

// Guardar notas
function guardarNotas(){
  const notas = document.getElementById("notas-caso1").value;
  localStorage.setItem("notas"+casoActual, JSON.stringify(notas));
  alert("Notas guardadas");
}

// Cargar estado, pistas y notas
function cargarCaso(){
  // Estado del caso
  const progreso = JSON.parse(localStorage.getItem("progresoCasos")) || {};
  const estadoSpan = document.getElementById("estado-caso");
  const estado = progreso[casoActual] ? "Resuelto ✅" : "Pendiente 🟡";
  estadoSpan.textContent = estado;
  estadoSpan.className = progreso[casoActual] ? "estado resuelto" : "estado pendiente";

  // Pistas
  const ulPistas = document.getElementById("pistas");
  const listaPistas = JSON.parse(localStorage.getItem("pistas"+casoActual)) || [];
  ulPistas.innerHTML="";
  listaPistas.forEach(p=>{
    let li = document.createElement("li");
    li.textContent = p;
    li.className="nueva";
    ulPistas.appendChild(li);
  });

  // Pistas secretas
  const ulSecretas = document.getElementById("secretas");
  const listaSecretas = JSON.parse(localStorage.getItem("pistasSecretas"+casoActual)) || [];
  ulSecretas.innerHTML="";
  listaSecretas.forEach(s=>{
    let li = document.createElement("li");
    li.textContent = s;
    li.className="secretas";
    ulSecretas.appendChild(li);
  });

  // Notas
  document.getElementById("notas-caso1").value = JSON.parse(localStorage.getItem("notas"+casoActual)) || "";
}

crearBotonesSospechosos();
crearBotonesConfrontar();
setInterval(cargarCaso,500);
cargarCaso();
