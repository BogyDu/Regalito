// Caso 1 - El Faro
window.casoActual = "caso1";

// Sospechosos y resumen
const sospechosos = ["Sofia","Mateo","Clara","Javier","Lucas"];
const infoSospechosos = {
  "Sofia": "Edad: 28, Profesión: Bióloga marina, Relación con la víctima: Vecina del faro",
  "Mateo": "Edad: 35, Profesión: Periodista, Relación con la víctima: Conocido de vista",
  "Clara": "Edad: 30, Profesión: Fotógrafa, Relación con la víctima: Sin relación directa",
  "Javier": "Edad: 40, Profesión: Historiador, Relación con la víctima: Amigo cercano",
  "Lucas": "Edad: 32, Profesión: Guardián del faro, Relación con la víctima: Trabajaba allí"
};

const preguntas = [
  "¿Dónde estabas la noche del crimen?",
  "¿Con quién estabas?",
  "¿Qué estabas haciendo en el lugar?",
  "¿Viste algo extraño o sospechoso?",
  "¿Tienes alguna relación con la víctima o alguien más implicado?"
];

const respuestas = {
  "Sofia":["Estaba en el faro sola","No estaba con nadie","Observando el mar","Vi a alguien cerca del faro","No conocía a nadie directamente"],
  "Mateo":["Estaba revisando la torre","Con Clara","Tomando notas","Sofia estaba cerca","Conocía a la víctima de vista"],
  "Clara":["Tomando fotos","Con Mateo","Fotografiando la torre","Nada extraño","No relacionada"],
  "Javier":["Explorando el faro","Solo","Buscando documentos antiguos","Vi a Lucas salir apresurado","Amigo de la víctima"],
  "Lucas":["Revisando puertas","Solo","Verificando seguridad","Todo normal","Trabajaba allí"]
};

// Objetos que se pueden analizar
const objetos = ["Huella en la ventana","Llave del faro","Zapato roto","Cuchillo"];

// Inicializar localStorage
if(!localStorage.getItem("respuestas"+casoActual)) localStorage.setItem("respuestas"+casoActual, JSON.stringify({}));
if(!localStorage.getItem("preguntasHechas"+casoActual)) localStorage.setItem("preguntasHechas"+casoActual, JSON.stringify({}));
if(!localStorage.getItem("pistas"+casoActual)) localStorage.setItem("pistas"+casoActual, JSON.stringify([]));
if(!localStorage.getItem("pistasSecretas"+casoActual)) localStorage.setItem("pistasSecretas"+casoActual, JSON.stringify([]));
if(!localStorage.getItem("notas"+casoActual)) localStorage.setItem("notas"+casoActual, JSON.stringify(""));
if(!localStorage.getItem("resumenSospechosos"+casoActual)) localStorage.setItem("resumenSospechosos"+casoActual, JSON.stringify([]));

// Crear listado de sospechosos con resumen
function crearListadoSospechosos(){
  const cont = document.getElementById("listado-sospechosos");
  cont.innerHTML="";
  sospechosos.forEach(s=>{
    const btn = document.createElement("button");
    btn.textContent = s;
    btn.className="interaccion-boton";
    btn.onclick = ()=>mostrarResumen(s);
    cont.appendChild(btn);
  });
}

// Mostrar resumen y registrar en dosier
function mostrarResumen(sospechoso){
  alert(infoSospechosos[sospechoso]);
  let registros = JSON.parse(localStorage.getItem("resumenSospechosos"+casoActual)) || [];
  if(!registros.includes(sospechoso)){
    registros.push(sospechoso);
    localStorage.setItem("resumenSospechosos"+casoActual, JSON.stringify(registros));
  }
  cargarCaso();
}

// Crear select de sospechosos para interrogatorio
const selectSos = document.getElementById("selectSospechoso");
sospechosos.forEach(s=> {
  let opt = document.createElement("option"); opt.value=s; opt.text=s; selectSos.appendChild(opt);
});
selectSos.addEventListener("change",()=>mostrarPreguntas(selectSos.value));

// Mostrar preguntas no hechas
function mostrarPreguntas(sospechoso){
  const cont = document.getElementById("preguntas-container");
  cont.innerHTML="";
  const preguntasHechas = JSON.parse(localStorage.getItem("preguntasHechas"+casoActual)) || {};
  if(!preguntasHechas[sospechoso]) preguntasHechas[sospechoso]=[];
  localStorage.setItem("preguntasHechas"+casoActual, JSON.stringify(preguntasHechas));

  preguntas.forEach((p,index)=>{
    if(!preguntasHechas[sospechoso].includes(index)){
      const btn = document.createElement("button"); btn.textContent=p;
      btn.onclick = ()=>hacerPregunta(sospechoso,index);
      cont.appendChild(btn);
    }
  });
}

// Hacer pregunta y generar pistas
function hacerPregunta(sospechoso,index){
  const resp = respuestas[sospechoso][index];
  alert(`${sospechoso} responde: ${resp}`);
  const resps = JSON.parse(localStorage.getItem("respuestas"+casoActual));
  if(!resps[sospechoso]) resps[sospechoso]={};
  resps[sospechoso][preguntas[index]]=resp;
  localStorage.setItem("respuestas"+casoActual, JSON.stringify(resps));

  const preguntasHechas = JSON.parse(localStorage.getItem("preguntasHechas"+casoActual));
  preguntasHechas[sospechoso].push(index);
  localStorage.setItem("preguntasHechas"+casoActual, JSON.stringify(preguntasHechas));

  generarPistas(sospechoso,index,resp);
  mostrarPreguntas(sospechoso);
}

// Generar pistas progresivas
function generarPistas(sospechoso,index,resp){
  let pistas = JSON.parse(localStorage.getItem("pistas"+casoActual));
  let secretas = JSON.parse(localStorage.getItem("pistasSecretas"+casoActual));

  if(resp.includes("Mateo") && !secretas.includes("Documento secreto")) secretas.push("Documento secreto");
  if(resp.includes("Lucas") && !pistas.includes("Zapato roto detectado")) pistas.push("Zapato roto detectado");
  localStorage.setItem("pistas"+casoActual, JSON.stringify(pistas));
  localStorage.setItem("pistasSecretas"+casoActual, JSON.stringify(secretas));
}

// Analizar objetos
function analizarObjeto(obj){
  let pistas = JSON.parse(localStorage.getItem("pistas"+casoActual));
  let secretas = JSON.parse(localStorage.getItem("pistasSecretas"+casoActual));
  if(obj=="Cuchillo" && !pistas.includes("Cuchillo roto")) pistas.push("Cuchillo roto encontrado");
  if(obj=="Huella en la ventana" && !secretas.includes("Huella coincide con Lucas")) secretas.push("Huella coincide con Lucas");
  localStorage.setItem("pistas"+casoActual, JSON.stringify(pistas));
  localStorage.setItem("pistasSecretas"+casoActual, JSON.stringify(secretas));
  cargarCaso();
}

// Crear botones de análisis
function crearBotonesObjetos(){
  const cont = document.getElementById("objetos-container");
  objetos.forEach(obj=>{
    const btn = document.createElement("button"); btn.textContent=obj;
    btn.onclick = ()=>analizarObjeto(obj);
    cont.appendChild(btn);
  });
}

// Guardar notas
function guardarNotas(){
  const notas = document.getElementById("notas-caso1").value;
  localStorage.setItem("notas"+casoActual, JSON.stringify(notas));
  alert("Notas guardadas");
}

// Cargar estado y pistas
function cargarCaso(){
  const progreso = JSON.parse(localStorage.getItem("progresoCasos")) || {};
  const estadoSpan = document.getElementById("estado-caso");
  const estado = progreso[casoActual] ? "Resuelto ✅" : "Pendiente 🟡";
  estadoSpan.textContent = estado;
  estadoSpan.className = progreso[casoActual] ? "estado resuelto" : "estado pendiente";

  // Pistas
  const ulPistas = document.getElementById("pistas");
  const listaPistas = JSON.parse(localStorage.getItem("pistas"+casoActual)) || [];
  ulPistas.innerHTML="";
  listaPistas.forEach(p=>{ let li=document.createElement("li"); li.textContent=p; li.className="nueva"; ulPistas.appendChild(li); });

  // Pistas secretas
  const ulSecretas = document.getElementById("secretas");
  const listaSecretas = JSON.parse(localStorage.getItem("pistasSecretas"+casoActual)) || [];
  ulSecretas.innerHTML="";
  listaSecretas.forEach(s=>{ let li=document.createElement("li"); li.textContent=s; li.className="secretas"; ulSecretas.appendChild(li); });

  // Resumen sospechosos
  const ulResumen = document.getElementById("resumen-sospechosos");
  const registros = JSON.parse(localStorage.getItem("resumenSospechosos"+casoActual)) || [];
  ulResumen.innerHTML="";
  registros.forEach(s=>{ let li=document.createElement("li"); li.textContent=s+" - "+infoSospechosos[s]; ulResumen.appendChild(li); });

  // Notas
  document.getElementById("notas-caso1").value = JSON.parse(localStorage.getItem("notas"+casoActual)) || "";
}

crearListadoSospechosos();
crearBotonesObjetos();
setInterval(cargarCaso,500);
cargarCaso();
mostrarPreguntas(selectSos.value);
