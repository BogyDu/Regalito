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

const preguntasAvanzadas={
  "Sofia":[
    {texto:"¿Viste a alguien manipular la cerradura?", respuesta:"Sí, mientras revisaba la zona, vi a Lucas cerca de la cerradura; parecía nervioso. Esto me hace sospechar que podría haber querido entrar sin ser visto, tal vez involucrado con la llave que encontramos.", desbloqueo:[{sospechoso:"Sofia", nuevaPregunta:"¿Quién podría querer usar la llave del faro?"},{sospechoso:"Lucas", nuevaPregunta:"¿Dónde estuviste cuando alguien vio la cerradura?"}]},
    {texto:"¿Por qué ocultaste información sobre Mateo?", respuesta:"No quería comprometerlo sin pruebas. Sin embargo, mientras hablaba con él, noté que intentaba ocultar que estaba con Clara, lo que podría ser una pista importante.", desbloqueo:[{sospechoso:"Sofia", nuevaPregunta:"¿Qué sabías sobre la relación entre Mateo y Clara?"}]},
    {texto:"¿Alguien te molestó mientras estabas sola?", respuesta:"Nadie me molestó, pero encontré un zapato roto cerca del muelle, que podría estar relacionado con la víctima o con alguien que intentó escapar rápidamente.", callejon:true}
  ],
  "Mateo":[
    {texto:"¿Qué discutiste con Sofia la noche del crimen?", respuesta:"Le pregunté sobre sus movimientos, y noté que evitaba ciertos detalles sobre la torre. Esto podría indicar que alguien manipula información importante para encubrir algo.", desbloqueo:[{sospechoso:"Mateo", nuevaPregunta:"¿Qué observaste exactamente en la torre?"}]},
    {texto:"¿Notaste algo extraño en el faro?", respuesta:"Vi a Lucas manipulando algo en la cocina, parecía preocupado por la llave y el cuchillo. Esto podría estar relacionado con la escena del crimen.", desbloqueo:[{sospechoso:"Sofia", nuevaPregunta:"¿Viste a Lucas manipular algún objeto en la cocina?"}]}
  ],
  "Lucas":[
    {texto:"¿Revisaste todas las armas disponibles?", respuesta:"Sí, revisé el cuchillo y el palo, y noté que el cuchillo estaba ligeramente doblado, podría ser relevante para el asesinato. También encontré restos de sangre, que seguramente coincidían con la víctima.", desbloqueo:[{sospechoso:"Lucas", nuevaPregunta:"¿Qué hiciste con el cuchillo después de encontrarlo?"}]},
    {texto:"¿Qué hiciste con la llave del faro?", respuesta:"La dejé en la mesa de control del faro para evitar que alguien entrara sin permiso. Noté que estaba marcada, como si alguien más hubiera intentado usarla.", desbloqueo:[{sospechoso:"Sofia", nuevaPregunta:"¿Qué viste respecto a la llave en el faro?"}]}
  ],
  "Clara":[
    {texto:"¿Qué hiciste durante la noche del crimen?", respuesta:"Estaba tomando fotos del faro y alrededores. Pude observar movimientos sospechosos, especialmente de Mateo, quien parecía evitar ser visto.", desbloqueo:[{sospechoso:"Clara", nuevaPregunta:"¿Qué lugares específicos viste que evitaba Mateo?"}]}
  ],
  "Javier":[
    {texto:"¿Dónde estabas la noche del crimen?", respuesta:"Exploraba los niveles superiores del faro, buscando documentos antiguos. Noté que Lucas parecía apresurado y algo ocultaba.", desbloqueo:[{sospechoso:"Javier", nuevaPregunta:"¿Qué viste de Lucas en los niveles superiores?"}]}
  ]
};

let preguntasHechas={};
sospechosos.forEach(s=>preguntasHechas[s]=[]);

const datosCulpables={
  "Lucas":{armas:["Cuchillo","Palo"],motivos:["Protección del Faro"]},
  "Mateo":{armas:["Cuchillo"],motivos:["Celos"]},
  "Sofia":{armas:["Palo"],motivos:["Venganza"]},
  "Clara":{armas:["Cuerda"],motivos:["Envidia"]},
  "Javier":{armas:["Cuchillo"],motivos:["Codicia"]}
};

function crearListadoSospechosos(){
  const sel=document.getElementById("sospechoso-select");
  sel.innerHTML="";
  sospechosos.forEach(s=>{
    const o=document.createElement("option");
    o.value=s;
    o.textContent=s;
    sel.appendChild(o);
  });
  sel.addEventListener("change",()=>mostrarPreguntas(sel.value));
}

function mostrarPreguntas(s){
  const cont=document.getElementById("preguntas-container");
  cont.innerHTML="";
  const preguntas=JSON.parse(localStorage.getItem("preguntasHechas"+casoActual)) || {};
  if(!preguntas[s]) preguntas[s]=[];

  // Básicas
  preguntasBasicas.forEach((p)=>{
    if(!preguntas[s].includes(p)){
      const btn=document.createElement("button");
      btn.textContent=p;
      btn.onclick=()=>hacerPregunta(s,p,false);
      cont.appendChild(btn);
    }
  });

  // Avanzadas
  if(preguntasAvanzadas[s]){
    preguntasAvanzadas[s].forEach((pObj)=>{
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

function hacerPregunta(s,p,esAvanzada){
  const resp="Respuesta narrativa para "+p;
  guardarRespuesta(s,p,resp);
}

function hacerPreguntaAvanzado(s,pObj){
  const resp=pObj.respuesta || "Sin información";
  guardarRespuesta(s,pObj.texto,resp);

  // Desbloquear nuevas preguntas
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
  const estadoSpan=document.getElementById("resultado-avanzado"); 
  actualizarIntroduccion();

  const ulP=document.getElementById("pistas");
  const p=JSON.parse(localStorage.getItem("pistas"+casoActual))||[];
  ulP.innerHTML=""; p.forEach(pi=>{ const li=document.createElement("li"); li.textContent=pi; li.className="nueva"; ulP.appendChild(li); });

  const ulS=document.getElementById("secretas");
  const s=JSON.parse(localStorage.getItem("pistasSecretas"+casoActual))||[];
  ulS.innerHTML=""; s.forEach(ss=>{ const li=document.createElement("li"); li.textContent=ss; li.className="secretas"; ulS.appendChild(li); });

  const ulR=document.getElementById("resumen-sospechosos");
  ulR.innerHTML=""; sospechosos.forEach(s=>{ const li=document.createElement("li"); li.textContent=s+" - "+infoSospechosos[s]; ulR.appendChild(li); });
}

// Inicialización
crearListadoSospechosos();
inicializarSelectores
