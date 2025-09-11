const casoActual="caso1";

const sospechosos=["Sofia","Mateo","Lucas","Clara","Javier"];
const infoSospechosos={
  "Sofia":"Trabajadora del faro, conoce bien la zona.",
  "Mateo":"Ayudante del faro, siempre atento a la torre.",
  "Lucas":"Guardia nocturno, celoso y reservado.",
  "Clara":"Fotógrafa visitante, curiosa y observadora.",
  "Javier":"Historiador, interesado en documentos antiguos."
};

const hallazgos=[
  {objeto:"Cuchillo",detalle:"Encontrado ligeramente doblado, con restos de sangre."},
  {objeto:"Llave del Faro",detalle:"Llave marcada, podría haber sido usada recientemente."},
  {objeto:"Zapato roto",detalle:"Encontrado cerca del muelle, posible evidencia de huellas."}
];

const preguntasBasicas=[
"¿Con quién estabas la noche del crimen?",
"¿Qué hora estabas en ese lugar?",
"¿Qué estabas haciendo en relación con el crimen?",
"¿Viste algo extraño?",
"¿Alguien te molestó durante la noche?"
];

// Preguntas avanzadas ya definidas previamente (10+ por sospechoso)
const preguntasAvanzadas={/* ...usar estructura del mensaje anterior ampliado... */};

let preguntasHechas={};
sospechosos.forEach(s=>preguntasHechas[s]=[]);

const datosCulpables={
  "Lucas":{armas:["Cuchillo","Palo"],motivos:["Protección del Faro"]},
  "Mateo":{armas:["Cuchillo"],motivos:["Celos"]},
  "Sofia":{armas:["Palo"],motivos:["Venganza"]},
  "Clara":{armas:["Cuerda"],motivos:["Envidia"]},
  "Javier":{armas:["Cuchillo"],motivos:["Codicia"]}
};

// Generar botones de sospechosos
function crearListadoSospechosos(){
  const cont=document.getElementById("sospechosos-container");
  cont.innerHTML="";
  sospechosos.forEach(s=>{
    const btn=document.createElement("button");
    btn.textContent=s;
    btn.className="sospechoso";
    btn.onclick=()=>mostrarPreguntas(s);
    cont.appendChild(btn);
  });
}

// Mostrar preguntas
function mostrarPreguntas(s){
  const cont=document.getElementById("preguntas-container");
  cont.innerHTML="";
  const preguntas=JSON.parse(localStorage.getItem("preguntasHechas"+casoActual)) || {};
  if(!preguntas[s]) preguntas[s]=[];

  preguntasBasicas.forEach(p=>{
    if(!preguntas[s].includes(p)){
      const btn=document.createElement("button");
      btn.textContent=p;
      btn.onclick=()=>hacerPregunta(s,p,false);
      cont.appendChild(btn);
    }
  });

  if(preguntasAvanzadas[s]){
    preguntasAvanzadas[s].forEach(pObj=>{
      if(!preguntas[s].includes(pObj.texto)){
        const btn=document.createElement("button");
        btn.textContent=pObj.texto;
        btn.className="destacada";
        btn.onclick=()=>hacerPreguntaAvanzado(s,pObj);
        cont.appendChild(btn);
      }
    });
  }
}

// Guardar respuesta
function hacerPregunta(s,p,esAvanzada){
  const resp="Respuesta narrativa para "+p;
  guardarRespuesta(s,p,resp);
}

function hacerPreguntaAvanzado(s,pObj){
  const resp=pObj.respuesta || "Sin información";
  guardarRespuesta(s,pObj.texto,resp);

  if(pObj.desbloqueo){
    pObj.desbloqueo.forEach(d=>{
      if(!preguntasAvanzadas[d.sospechoso]) preguntasAvanzadas[d.sospechoso]=[];
      preguntasAvanzadas[d.sospechoso].push({
        texto:d.nuevaPregunta,
        respuesta:"Respuesta pendiente",
        desbloqueo:[]
      });
    });
  }
}

function guardarRespuesta(s,preg,resp){
  let preguntas=JSON.parse(localStorage.getItem("preguntasHechas"+casoActual)) || {};
  if(!preguntas[s]) preguntas[s]=[];
  preguntas[s].push(preg);
  localStorage.setItem("preguntasHechas"+casoActual,JSON.stringify(preguntas));

  let conv=JSON.parse(localStorage.getItem("conversacion"+casoActual)) || {};
  if(!conv[s]) conv[s]=[];
  conv[s].push({pregunta:preg,respuesta:resp});
  localStorage.setItem("conversacion"+casoActual,JSON.stringify(conv));

  generarPistas(s,preg,resp);
  mostrarRegistroConversacion(s);
  mostrarPreguntas(s);
}

function mostrarRegistroConversacion(s){
  const cont=document.getElementById("registro-conversacion");
  cont.innerHTML="";
  const conv=JSON.parse(localStorage.getItem("conversacion"+casoActual)) || {};
  sospechosos.forEach(sos=>{
    if(conv[sos]){
      conv[sos].forEach(r=>{
        const p=document.createElement("p");
        p.innerHTML=`<strong>${sos} - ${r.pregunta}</strong><br>${r.respuesta}`;
        cont.appendChild(p);
      });
    }
  });
}

function generarPistas(s,preg,resp){
  let pistas=JSON.parse(localStorage.getItem("pistas"+casoActual)) || [];
  let secretas=JSON.parse(localStorage.getItem("pistasSecretas"+casoActual)) || [];

  if(resp.includes("Lucas") && !secretas.includes("Huella coincide con Lucas")) secretas.push("Huella coincide con Lucas");
  if(resp.includes("Contradicción") && !secretas.includes("Contradicción detectada")) secretas.push("Contradicción detectada entre sospechosos");

  localStorage.setItem("pistas"+casoActual,JSON.stringify(pistas));
  localStorage.setItem("pistasSecretas"+casoActual,JSON.stringify(secretas));
  cargarCaso();
}

function actualizarIntroduccion(){
  const ul=document.getElementById("objetos-introduccion");
  ul.innerHTML="";
  hallazgos.forEach(h=>{
    const li=document.createElement("li");
    li.innerHTML=`<strong>${h.objeto}:</strong> ${h.detalle}`;
    ul.appendChild(li);
  });
}

function guardarNotas(){
  const notas=document.getElementById("notas-caso1").value;
  localStorage.setItem("notas"+casoActual,JSON.stringify(notas));
  alert("Notas guardadas");
}

// Inicializar selectores para resolución
function inicializarSelectores(){
  const selC=document.getElementById("culpable");
  const selCo=document.getElementById("complice");
  const selA=document.getElementById("arma");
  const selM=document.getElementById("motivo");

  selC.innerHTML='<option value="">Selecciona culpable</option>';
  Object.keys(datosCulpables).forEach(c=>{
    const o=document.createElement("option"); o.value=c; o.textContent=c; selC.appendChild(o);
  });

  selCo.innerHTML='<option value="">Ninguno</option>';
  sospechosos.forEach(c=>{ const o=document.createElement("option"); o.value=c; o.textContent=c; selCo.appendChild(o); });

  selA.innerHTML='<option value="">Selecciona arma</option>';
  selM.innerHTML='<option value="">Selecciona motivo</option>';
}

function resolverCasoAvanzado(){
  const c=document.getElementById("culpable").value;
  const co=document.getElementById("complice").value;
  const a=document.getElementById("arma").value;
  const m=document.getElementById("motivo").value;
  const res=document.getElementById("resultado-avanzado");

  if(!c || !a || !m){ res.textContent="Debes seleccionar culpable, arma y motivo."; return; }

  const valido=(datosCulpables[c].armas.includes(a) && datosCulpables[c].motivos.includes(m) && (co=="" || co!="Lucas")); // ejemplo complice

  res.textContent=valido?"¡Caso resuelto correctamente! ✅":"Combinación incorrecta ❌";
  if(valido) localStorage.setItem("progresoCasos",JSON.stringify({[casoActual]:true}));
  cargarCaso();
}

// Cargar dossier
function cargarCaso(){
  actualizarIntroduccion();

  const pistas=document.getElementById("pistas");
  pistas.innerHTML="";
  const p=JSON.parse(localStorage.getItem("pistas"+casoActual)) || [];
  p.forEach(pi=>{ const li=document.createElement("li"); li.textContent=pi; pistas.appendChild(li); });

  const secretas=document.getElementById("secretas");
  secretas.innerHTML="";
  const s=JSON.parse(localStorage.getItem("pistasSecretas"+casoActual)) || [];
  s.forEach(se=>{ const li=document.createElement("li"); li.textContent=se; secretas.appendChild(li); });

  const resumen=document.getElementById("resumen-sospechosos");
  resumen.innerHTML="";
  sospechosos.forEach(sos=>{
    const li=document.createElement("li");
    li.innerHTML=`<strong>${sos}</strong>: ${infoSospechosos[sos]}`;
    resumen.appendChild(li);
  });

  const notas=JSON.parse(localStorage.getItem("notas"+casoActual)) || "";
  document.getElementById("notas-caso1").value=notas;

  mostrarRegistroConversacion();
}

// Inicialización
crearListadoSospechosos();
inicializarSelectores();
cargarCaso();
