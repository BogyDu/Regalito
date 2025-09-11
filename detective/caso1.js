window.casoActual="caso1";

// Sospechosos y resúmenes
const sospechosos=["Sofia","Mateo","Clara","Javier","Lucas"];
const infoSospechosos={
  "Sofia":"Edad:28, Bióloga marina, Vecina del faro",
  "Mateo":"Edad:35, Periodista, Conocido de vista",
  "Clara":"Edad:30, Fotógrafa, Sin relación directa",
  "Javier":"Edad:40, Historiador, Amigo cercano",
  "Lucas":"Edad:32, Guardián del faro, Trabajaba allí"
};

// Preguntas básicas
const preguntasBasicas=[
  "¿Dónde estabas la noche del crimen?",
  "¿Con quién estabas?",
  "¿Qué estabas haciendo?",
  "¿Viste algo extraño?",
  "¿Tienes relación con la víctima o alguien más implicado?"
];

// Respuestas por sospechoso
const respuestas={
  "Sofia":["Estaba en el faro sola","No estaba con nadie","Observando el mar","Vi a alguien cerca","No conocía a nadie directamente"],
  "Mateo":["Revisando la torre","Con Clara","Tomando notas","Sofia estaba cerca","Conocía a la víctima de vista"],
  "Clara":["Tomando fotos","Con Mateo","Fotografiando la torre","Nada extraño","No relacionada"],
  "Javier":["Explorando el faro","Solo","Buscando documentos","Vi a Lucas salir apresurado","Amigo de la víctima"],
  "Lucas":["Revisando puertas","Solo","Verificando seguridad","Todo normal","Trabajaba allí"]
};

// Preguntas avanzadas desbloqueadas
const preguntasAvanzadas={
  "Sofia":[
    {texto:"¿Viste a alguien manipular la cerradura?", desbloqueo:{pista:"Llave del Faro"}},
    {texto:"¿Por qué ocultaste información sobre Mateo?", desbloqueo:{respuesta:{sospechoso:"Mateo", pregunta:1, valor:"Con Clara"}}}
  ],
  "Mateo":[
    {texto:"¿Qué discutiste con Sofia la noche del crimen?", desbloqueo:{respuesta:{sospechoso:"Sofia", pregunta:0, valor:"Estaba en el faro sola"}}}
  ]
};

// Objetos
const objetos=["Huella en la ventana","Llave del Faro","Zapato roto","Cuchillo"];
if(!localStorage.getItem("objetosEncontrados"+casoActual)) localStorage.setItem("objetosEncontrados"+casoActual, JSON.stringify([]));

// Inicialización localStorage
["respuestas"+casoActual,"preguntasHechas"+casoActual,"pistas"+casoActual,"pistasSecretas"+casoActual,"notas"+casoActual,"resumenSospechosos"+casoActual,"conversacion"+casoActual].forEach(k=>{
  if(!localStorage.getItem(k)) localStorage.setItem(k,JSON.stringify(k.includes("pistas")||k.includes("resumen")?[]:{}));
});

// Culpable, complice, arma y motivo
const datosCulpables={
  "Sofia":{armas:["Cuchillo","Veneno"],motivos:["Celos","Venganza"]},
  "Mateo":{armas:["Cuerda","Cuchillo"],motivos:["Dinero","Rencor"]},
  "Clara":{armas:["Cuchillo"],motivos:["Celos"]},
  "Javier":{armas:["Cuerda"],motivos:["Herencia"]},
  "Lucas":{armas:["Cuchillo","Palo"],motivos:["Rabia","Protección del Faro"]}
};

// Inicialización
function crearListadoSospechosos(){
  const cont=document.getElementById("listado-sospechosos");
  cont.innerHTML="";
  sospechosos.forEach(s=>{
    const btn=document.createElement("button");
    btn.textContent=s;
    btn.className="interaccion-boton";
    btn.onclick=()=>iniciarInterrogatorio(s);
    cont.appendChild(btn);
  });
}

// Iniciar interrogatorio
function iniciarInterrogatorio(s){
  mostrarPreguntas(s);
  mostrarRegistroConversacion(s);
  // Resumen
  let registros=JSON.parse(localStorage.getItem("resumenSospechosos"+casoActual)) || [];
  if(!registros.includes(s)){
    registros.push(s);
    localStorage.setItem("resumenSospechosos"+casoActual,JSON.stringify(registros));
    cargarCaso();
  }
}

// Mostrar preguntas
function mostrarPreguntas(s){
  const cont=document.getElementById("preguntas-container");
  cont.innerHTML="";
  const preguntasHechas=JSON.parse(localStorage.getItem("preguntasHechas"+casoActual)) || {};
  if(!preguntasHechas[s]) preguntasHechas[s]=[];

  // Básicas
  preguntasBasicas.forEach((p,index)=>{
    if(!preguntasHechas[s].includes(index)){
      const btn=document.createElement("button"); btn.textContent=p;
      btn.onclick=()=>hacerPregunta(s,index);
      cont.appendChild(btn);
    }
  });

  // Avanzadas
  if(preguntasAvanzadas[s]){
    preguntasAvanzadas[s].forEach((pObj,i)=>{
      let desbloqueada=false;
      if(pObj.desbloqueo.pista){
        const pistas=JSON.parse(localStorage.getItem("pistas"+casoActual)) || [];
        if(pistas.includes(pObj.desbloqueo.pista)) desbloqueada=true;
      }
      if(pObj.desbloqueo.respuesta){
        const conv=JSON.parse(localStorage.getItem("conversacion"+casoActual)) || {};
        const respSos=conv[pObj.desbloqueo.respuesta.sospechoso];
        if(respSos){
          respSos.forEach(r=>{
            if(r.pregunta===preguntasBasicas[pObj.desbloqueo.respuesta.pregunta] &&
               r.respuesta===pObj.desbloqueo.respuesta.valor) desbloqueada=true;
          });
        }
      }
      if(desbloqueada){
        const btn=document.createElement("button");
        btn.textContent=pObj.texto;
        btn.onclick=()=>hacerPreguntaAvanzado(s,i);
        cont.appendChild(btn);
      }
    });
  }
}

// Hacer pregunta básica
function hacerPregunta(s,index){
  const resp=respuestas[s][index];
  guardarRespuesta(s,preguntasBasicas[index],resp);
}

// Hacer pregunta avanzada
function hacerPreguntaAvanzado(s,index){
  const pObj=preguntasAvanzadas[s][index];
  const resp="Respuesta avanzada"; // Simulación
  guardarRespuesta(s,pObj.texto,resp);
}

// Guardar respuesta y actualizar registro
function guardarRespuesta(s,preg,resp){
  const preguntasHechas=JSON.parse(localStorage.getItem("preguntasHechas"+casoActual)) || {};
  if(!preguntasHechas[s]) preguntasHechas[s]=[];
  preguntasHechas[s].push(preg);
  localStorage.setItem("preguntasHechas"+casoActual,JSON.stringify(preguntasHechas));

  const conv=JSON.parse(localStorage.getItem("conversacion"+casoActual)) || {};
  if(!conv[s]) conv[s]=[];
  conv[s].push({pregunta:preg,respuesta:resp});
  localStorage.setItem("conversacion"+casoActual,JSON.stringify(conv));

  generarPistas(s,preg,resp);
  mostrarRegistroConversacion(s);
  mostrarPreguntas(s);
}

// Mostrar registro conversación
function mostrarRegistroConversacion(s){
  const cont=document.getElementById("registro-conversacion");
  cont.innerHTML="";
  const conv=JSON.parse(localStorage.getItem("conversacion"+casoActual)) || {};
  if(conv[s]){
    conv[s].forEach(r=>{
      const p=document.createElement("p"); p.innerHTML=`<strong>${r.pregunta}</strong><br>${r.respuesta}`;
      cont.appendChild(p);
    });
  }
}

// Generar pistas a partir de respuesta
function generarPistas(s,preg,resp){
  let pistas=JSON.parse(localStorage.getItem("pistas"+casoActual)) || [];
  let secretas=JSON.parse(localStorage.getItem("pistasSecretas"+casoActual)) || [];

  if(resp.includes("observando el mar") && !pistas.includes("Zapato roto detectado")) pistas.push("Zapato roto detectado");
  if(resp.includes("Lucas") && !secretas.includes("Huella coincide con Lucas")) secretas.push("Huella coincide con Lucas");
  localStorage.setItem("pistas"+casoActual,JSON.stringify(pistas));
  localStorage.setItem("pistasSecretas"+casoActual,JSON.stringify(secretas));
  cargarCaso();
}

// Analizar objetos
function crearBotonesObjetos(){
  const cont=document.getElementById("objetos-container");
  objetos.forEach(obj=>{
    const btn=document.createElement("button"); btn.textContent=obj;
    btn.onclick=()=>analizarObjeto(obj);
    cont.appendChild(btn);
  });
}

function analizarObjeto(obj){
  let objetosF=JSON.parse(localStorage.getItem("objetosEncontrados"+casoActual)) || [];
  if(!objetosF.includes(obj)) objetosF.push(obj);
  localStorage.setItem("objetosEncontrados"+casoActual,JSON.stringify(objetosF));
  // Pistas relacionadas
  if(obj==="Cuchillo" && !JSON.parse(localStorage.getItem("pistasSecretas"+casoActual)).includes("Cuchillo roto")) {
    let s=JSON.parse(localStorage.getItem("pistasSecretas"+casoActual));
    s.push("Cuchillo roto");
    localStorage.setItem("pistasSecretas"+casoActual,JSON.stringify(s));
  }
  actualizarObjetosIntroduccion();
  cargarCaso();
}

// Actualizar introducción con objetos
function actualizarObjetosIntroduccion(){ 
  const ul=document.getElementById("objetos-introduccion");
  const objs=JSON.parse(localStorage.getItem("objetosEncontrados"+casoActual)) || [];
  ul.innerHTML="";
  objs.forEach(o=>{ let li=document.createElement("li"); li.textContent=o; ul.appendChild(li); });
}

// Guardar notas
function guardarNotas(){
  const notas=document.getElementById("notas-caso1").value;
  localStorage.setItem("notas"+casoActual,JSON.stringify(notas));
  alert("Notas guardadas");
}

// Resolver caso avanzado
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
  let armas=[]; Object.values(datosCulpables).forEach(d=>armas=armas.concat(d.armas));
  [...new Set(armas)].forEach(a=>{ const o=document.createElement("option"); o.value=a; o.textContent=a; selA.appendChild(o); });

  selM.innerHTML='<option value="">Selecciona motivo</option>';
  let motivos=[]; Object.values(datosCulpables).forEach(d=>motivos=motivos.concat(d.motivos));
  [...new Set(motivos)].forEach(m=>{ const o=document.createElement("option"); o.value=m; o.textContent=m; selM.appendChild(o); });
}

function resolverCasoAvanzado(){
  const c=document.getElementById("culpable").value;
  const co=document.getElementById("complice").value;
  const a=document.getElementById("arma").value;
  const m=document.getElementById("motivo").value;
  const r=document.getElementById("resultado-avanzado");
  if(!c || !a || !m){ r.textContent="Selecciona culpable, arma y motivo"; return; }

  const correcto={culpable:"Lucas",complice:"Mateo",arma:"Cuchillo",motivo:"Protección del Faro"};
  const esCorrecto=(c===correcto.culpable && co===correcto.complice && a===correcto.arma && m===correcto.motivo);
  if(esCorrecto){
    r.textContent="¡Caso resuelto correctamente! ✅";
    let progreso=JSON.parse(localStorage.getItem("progresoCasos"))||{};
    progreso[casoActual]=true;
    localStorage.setItem("progresoCasos",JSON.stringify(progreso));
  } else r.textContent="Combinación incorrecta ❌";
}

// Cargar estado y pistas
function cargarCaso(){
  const progreso=JSON.parse(localStorage.getItem("progresoCasos"))||{};
  const estadoSpan=document.getElementById("estado-caso");
  const estado=progreso[casoActual]?"Resuelto ✅":"Pendiente 🟡";
  estadoSpan.textContent=estado;
  estadoSpan.className=progreso[casoActual]?"estado resuelto":"estado pendiente";

  // Pistas
  const ulP=document.getElementById("pistas");
  const p=JSON.parse(localStorage.getItem("pistas"+casoActual))||[];
  ulP.innerHTML=""; p.forEach(pi=>{ const li=document.createElement("li"); li.textContent=pi; li.className="nueva"; ulP.appendChild(li); });

  // Pistas secretas
  const ulS=document.getElementById("secretas");
  const s=JSON.parse(localStorage.getItem("pistasSecretas"+casoActual))||[];
  ulS.innerHTML=""; s.forEach(ss=>{ const li=document.createElement("li"); li.textContent=ss; li.className="secretas"; ulS.appendChild(li); });

  // Resumen sospechosos
  const ulR=document.getElementById("resumen-sospechosos");
  const reg=JSON.parse(localStorage.getItem("resumenSospechosos"+casoActual))||[];
  ulR.innerHTML=""; reg.forEach(s=>{ const li=document.createElement("li"); li.textContent=s+" - "+infoSospechosos[s]; ulR.appendChild(li); });

  // Notas
  document.getElementById("notas-caso1").value=JSON.parse(localStorage.getItem("notas"+casoActual))||"";
}

crearListadoSospechosos();
crearBotonesObjetos();
actualizarObjetosIntroduccion();
inicializarSelectores();
setInterval(cargarCaso,500);
cargarCaso();
