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

// Preguntas avanzadas con callejones sin salida
const preguntasAvanzadas={
  "Sofia":[
    {texto:"¿Viste a alguien manipular la cerradura?", desbloqueo:{pista:"Llave del Faro"}},
    {texto:"¿Por qué ocultaste información sobre Mateo?", desbloqueo:{respuesta:{sospechoso:"Mateo",pregunta:1,valor:"Con Clara"}}},
    {texto:"¿Alguien te molestó mientras estabas sola?", callejon:true}
  ],
  "Mateo":[
    {texto:"¿Qué discutiste con Sofia la noche del crimen?", desbloqueo:{respuesta:{sospechoso:"Sofia",pregunta:0,valor:"Estaba en el faro sola"}}},
    {texto:"¿Notaste algo extraño en el faro?", callejon:true}
  ],
  "Lucas":[
    {texto:"¿Revisaste todas las armas disponibles?", desbloqueo:{pista:"Cuchillo roto"}},
    {texto:"¿Qué hiciste con la llave del faro?", desbloqueo:{pista:"Llave del Faro"}}
  ]
};

// Hallazgos iniciales
const hallazgos = [
  {objeto:"Huella en la ventana", detalle:"Se detectan huellas parciales en la ventana norte"},
  {objeto:"Llave del Faro", detalle:"Llave encontrada cerca del faro, parece reciente"},
  {objeto:"Zapato roto", detalle:"Zapato izquierdo roto, huella cerca del muelle"},
  {objeto:"Cuchillo", detalle:"Cuchillo encontrado en la cocina, con marcas de uso"},
  {objeto:"Palo manchado", detalle:"Resto de sangre detectado en el palo"},
  {objeto:"Carta críptica", detalle:"Carta con mensaje ambiguo y posibles indicios de cómplice"}
];

// Inicialización de localStorage
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

// Funciones principales

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

function iniciarInterrogatorio(s){
  mostrarPreguntas(s);
  mostrarRegistroConversacion(s);
  // Actualizar resumen
  let registros=JSON.parse(localStorage.getItem("resumenSospechosos"+casoActual)) || [];
  if(!registros.includes(s)){
    registros.push(s);
    localStorage.setItem("resumenSospechosos"+casoActual,JSON.stringify(registros));
  }
  cargarCaso();
}

function mostrarPreguntas(s){
  const cont=document.getElementById("preguntas-container");
  cont.innerHTML="";
  const preguntasHechas=JSON.parse(localStorage.getItem("preguntasHechas"+casoActual)) || {};
  if(!preguntasHechas[s]) preguntasHechas[s]=[];

  preguntasBasicas.forEach((p,index)=>{
    if(!preguntasHechas[s].includes(index)){
      const btn=document.createElement("button");
      btn.textContent=p;
      btn.onclick=()=>hacerPregunta(s,index);
      cont.appendChild(btn);
    }
  });

  if(preguntasAvanzadas[s]){
    preguntasAvanzadas[s].forEach((pObj,i)=>{
      let desbloqueada=false;
      if(pObj.desbloqueo?.pista){
        const pistas=JSON.parse(localStorage.getItem("pistas"+casoActual)) || [];
        if(pistas.includes(pObj.desbloqueo.pista)) desbloqueada=true;
      }
      if(pObj.desbloqueo?.respuesta){
        const conv=JSON.parse(localStorage.getItem("conversacion"+casoActual)) || {};
        const respSos=conv[pObj.desbloqueo.respuesta.sospechoso];
        if(respSos){
          respSos.forEach(r=>{
            if(r.pregunta===preguntasBasicas[pObj.desbloqueo.respuesta.pregunta] &&
               r.respuesta===pObj.desbloqueo.respuesta.valor) desbloqueada=true;
          });
        }
      }
      if(desbloqueada || !pObj.callejon){
        const btn=document.createElement("button");
        btn.textContent=pObj.texto;
        btn.onclick=()=>hacerPreguntaAvanzado(s,i);
        cont.appendChild(btn);
      }
    });
  }
}

function hacerPregunta(s,index){
  const resp=respuestas[s][index];
  guardarRespuesta(s,preguntasBasicas[index],resp);
}

function hacerPreguntaAvanzado(s,index){
  const pObj=preguntasAvanzadas[s][index];
  const resp="Respuesta avanzada"; 
  guardarRespuesta(s,pObj.texto,resp);
}

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

function mostrarRegistroConversacion(s){
  const cont=document.getElementById("registro-conversacion");
  cont.innerHTML="";
  const conv=JSON.parse(localStorage.getItem("conversacion"+casoActual)) || {};
  if(conv[s]){
    conv[s].forEach(r=>{
      const p=document.createElement("p"); 
      p.innerHTML=`<strong>${r.pregunta}</strong><br>${r.respuesta}`;
      cont.appendChild(p);
    });
  }
}

function generarPistas(s,preg,resp){
  let pistas=JSON.parse(localStorage.getItem("pistas"+casoActual)) || [];
  let secretas=JSON.parse(localStorage.getItem("pistasSecretas"+casoActual)) || [];

  if(resp.includes("observando el mar") && !pistas.includes("Zapato roto detectado")) pistas.push("Zapato roto detectado");
  if(resp.includes("Lucas") && !secretas.includes("Huella coincide con Lucas")) secretas.push("Huella coincide con Lucas");

  const conv=JSON.parse(localStorage.getItem("conversacion"+casoActual)) || {};
  if(conv["Sofia"] && conv["Mateo"]){
    const respSofia=conv["Sofia"].find(r=>r.pregunta===preguntasBasicas[1]);
    const respMateo=conv["Mateo"].find(r=>r.pregunta===preguntasBasicas[1]);
    if(respSofia && respMateo && respSofia.respuesta !== respMateo.respuesta){
      if(!secretas.includes("Contradicción detectada entre Sofia y Mateo")) secretas.push("Contradicción detectada entre Sofia y Mateo");
    }
  }

  if(preg.includes("Alguien te molestó") && !pistas.includes("Pregunta sin información útil")) pistas.push("Pregunta sin información útil");

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

  const pistas=JSON.parse(localStorage.getItem("pistas"+casoActual)) || [];
  const secretas=JSON.parse(localStorage.getItem("pistasSecretas"+casoActual)) || [];

  if(pistas.includes("Zapato roto detectado") && !ul.innerHTML.includes("Zapato roto")) ul.innerHTML+=`<li><strong>Hallazgo Forense:</strong> Zapato roto coincide con huella hallada</li>`;
  if(secretas.includes("Huella coincide con Lucas") && !ul.innerHTML.includes("Lucas")) ul.innerHTML+=`<li><strong>Hallazgo Forense:</strong> Huella coincide con Lucas</li>`;
}

function guardarNotas(){
  const notas=document.getElementById("notas-caso1").value;
  localStorage.setItem("notas"+casoActual,JSON.stringify(notas));
  alert("Notas guardadas");
}

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

function cargarCaso(){
  const progreso=JSON.parse(localStorage.getItem("progresoCasos"))||{};
  const estadoSpan=document.getElementById("estado-caso");
  const estado=progreso[casoActual]?"Resuelto ✅":"Pendiente 🟡";
  estadoSpan.textContent=estado;
  estadoSpan.className=progreso[casoActual]?"estado resuelto":"estado pendiente";

  const ulP=document.getElementById("pistas");
  const p=JSON.parse(localStorage.getItem("pistas"+casoActual))||[];
  ulP.innerHTML=""; p.forEach(pi=>{ const li=document.createElement("li"); li.textContent=pi; li.className="nueva"; ulP.appendChild(li); });

  const ulS=document.getElementById("secretas");
  const s=JSON.parse(localStorage.getItem("pistasSecretas"+casoActual))||[];
  ulS.innerHTML=""; s.forEach(ss=>{ const li=document.createElement("li"); li.textContent=ss; li.className="secretas"; ulS.appendChild(li); });

  const ulR=document.getElementById("resumen-sospechosos");
  const reg=JSON.parse(localStorage.getItem("resumenSospechosos"+casoActual))||[];
  ulR.innerHTML=""; reg.forEach(s=>{ const li=document.createElement("li"); li.textContent=s+" - "+infoSospechosos[s]; ulR.appendChild(li); });

  document.getElementById("notas-caso1").value=JSON.parse(localStorage.getItem("notas"+casoActual))||"";
  actualizarIntroduccion();
}

// Inicialización
crearListadoSospechosos();
inicializarSelectores();
setInterval(cargarCaso,500);
cargarCaso();
