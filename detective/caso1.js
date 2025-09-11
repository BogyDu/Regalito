let casoData;
let preguntasHechas = {};
let conversacion = {};
let sospechosoActivo = null;

fetch('caso1.json').then(res=>res.json()).then(data=>{
  casoData = data;

  // Inicializar desbloqueos
  casoData.sospechosos.forEach(s=>{
    s.desbloqueado = casoData.sospechososIniciales.includes(s.nombre);
    preguntasHechas[s.nombre] = JSON.parse(localStorage.getItem('preguntas-'+s.nombre)) || [];
    conversacion[s.nombre] = JSON.parse(localStorage.getItem('conversacion-'+s.nombre)) || [];
  });

  inicializarCaso();
});

function inicializarCaso(){
  actualizarIntroduccion();
  crearListadoSospechosos();
  inicializarSelectores();
  cargarDossier();
}

function actualizarIntroduccion(){
  const ul=document.getElementById("objetos-introduccion");
  ul.innerHTML="";
  casoData.objetos.forEach(h=>{
    const li=document.createElement("li");
    li.innerHTML=`<strong>${h.objeto}:</strong> ${h.detalle}`;
    ul.appendChild(li);
  });
}

function crearListadoSospechosos(){
  const cont=document.getElementById("sospechosos-container");
  cont.innerHTML="";
  casoData.sospechosos.forEach(s=>{
    if(s.desbloqueado){
      const btn=document.createElement("button");
      btn.textContent=s.nombre;
      btn.className="sospechoso";
      btn.onclick=()=>mostrarPreguntas(s.nombre);
      cont.appendChild(btn);
    }
  });
}

function mostrarPreguntas(sos){
  sospechosoActivo=sos;
  const cont=document.getElementById("preguntas-container");
  cont.innerHTML="";

  if(casoData.preguntasBasicas[sos]){
    casoData.preguntasBasicas[sos].forEach(p=>{
      if(!preguntasHechas[sos].includes(p.texto)){
        const btn=document.createElement("button");
        btn.textContent=p.texto;
        btn.onclick=()=>hacerPregunta(sos,p.texto,p.respuesta);
        cont.appendChild(btn);
      }
    });
  }

  if(casoData.preguntasAvanzadas[sos]){
    casoData.preguntasAvanzadas[sos].forEach(pObj=>{
      if(!preguntasHechas[sos].includes(pObj.texto)){
        const btn=document.createElement("button");
        btn.textContent=pObj.texto;
        btn.className="destacada";
        btn.onclick=()=>hacerPreguntaAvanzado(sos,pObj);
        cont.appendChild(btn);
      }
    });
  }
  mostrarRegistroConversacion();
}

function hacerPregunta(sos,preg,resp){registrarRespuesta(sos,preg,resp);}
function hacerPreguntaAvanzado(sos,pObj){
  registrarRespuesta(sos,pObj.texto,pObj.respuesta);

  if(pObj.desbloqueo){
    pObj.desbloqueo.forEach(d=>{
      const sospechosoNuevo = casoData.sospechosos.find(s => s.nombre===d.sospechoso);
      if(sospechosoNuevo && !sospechosoNuevo.desbloqueado){
        sospechosoNuevo.desbloqueado=true;
      }
      if(!casoData.preguntasAvanzadas[d.sospechoso]) casoData.preguntasAvanzadas[d.sospechoso]=[];
      if(!casoData.preguntasAvanzadas[d.sospechoso].some(q=>q.texto===d.nuevaPregunta)){
        casoData.preguntasAvanzadas[d.sospechoso].push({texto:d.nuevaPregunta,respuesta:d.respuesta,desbloqueo:[]});
      }
    });
  }
  mostrarPreguntas(sos);
  crearListadoSospechosos();
}

function registrarRespuesta(sos,preg,resp){
  preguntasHechas[sos].push(preg);
  conversacion[sos].push({pregunta: preg, respuesta: resp});

  localStorage.setItem('preguntas-'+sos,JSON.stringify(preguntasHechas[sos]));
  localStorage.setItem('conversacion-'+sos,JSON.stringify(conversacion[sos]));

  // Detectar pistas
  const pistasDetectadas = [];
  casoData.objetos.forEach(obj=>{
    if(resp.includes(obj.objeto) && !pistasDetectadas.includes(obj.objeto)) pistasDetectadas.push(obj.objeto);
  });
  if(resp.includes("Cuchillo") && !pistasDetectadas.includes("Cuchillo")) pistasDetectadas.push("Cuchillo");
  if(resp.includes("Lucas") && !pistasDetectadas.includes("Lucas")) pistasDetectadas.push("Lucas");

  generarPistas(sos,preg,resp,pistasDetectadas);
  mostrarRegistroConversacion();
  mostrarPreguntas(sos);
}

function generarPistas(sos,preg,resp,pistasDetectadas){
  let pistas=JSON.parse(localStorage.getItem("pistas"+casoData.nombre))||[];
  let secretas=JSON.parse(localStorage.getItem("pistasSecretas"+casoData.nombre))||[];

  pistasDetectadas.forEach(pi=>{
    if(!pistas.includes(pi)){
      pistas.push(pi);
      conversacion[sos].push({pregunta:"(Nota automática)",respuesta:`Se ha descubierto una nueva pista: ${pi}`});
    }
  });

  localStorage.setItem("pistas"+casoData.nombre,JSON.stringify(pistas));
  localStorage.setItem("pistasSecretas"+casoData.nombre,JSON.stringify(secretas));
  cargarDossier();
}

function mostrarRegistroConversacion(){
  const cont=document.getElementById("registro-conversacion");
  cont.innerHTML="";
  if(!sospechosoActivo) return;

  conversacion[sospechosoActivo].forEach(r=>{
    const p=document.createElement("p");
    let respText=r.respuesta;

    const pistas=JSON.parse(localStorage.getItem("pistas"+casoData.nombre))||[];
    pistas.forEach(pi=>{
      const regex=new RegExp(`(${pi})`,"gi");
      respText=respText.replace(regex,'<u>$1</u>');
    });

    p.innerHTML=`<strong>${sospechosoActivo} - ${r.pregunta}</strong><br>${respText}`;
    cont.appendChild(p);
  });
}

function cargarDossier(){
  const pistas=document.getElementById("pistas"); pistas.innerHTML="";
  (JSON.parse(localStorage.getItem("pistas"+casoData.nombre))||[]).forEach(pi=>{
    const li=document.createElement("li"); li.textContent=pi; pistas.appendChild(li);
  });

  const secretasElem=document.getElementById("secretas"); secretasElem.innerHTML="";
  (JSON.parse(localStorage.getItem("pistasSecretas"+casoData.nombre))||[]).forEach(se=>{
    const li=document.createElement("li"); li.textContent=se; secretasElem.appendChild(li);
  });

  const resumen=document.getElementById("resumen-sospechosos"); resumen.innerHTML="";
  casoData.sospechosos.forEach(s=>{
    if(s.desbloqueado){
      const li=document.createElement("li"); li.innerHTML=`<strong>${s.nombre}</strong>: ${s.resumen}`; resumen.appendChild(li);
    }
  });
}

function inicializarSelectores(){
  const selC=document.getElementById("culpable");
  const selCo=document.getElementById("complice");
  const selA=document.getElementById("arma");
  const selM=document.getElementById("motivo");

  selC.innerHTML='<option value="">Selecciona culpable</option>';
  casoData.sospechosos.forEach(s=>{if(s.desbloqueado){let o=document.createElement("option");o.value=s.nombre;o.textContent=s.nombre;selC.appendChild(o);}});
  selCo.innerHTML='<option value="">Ninguno</option>';
  casoData.sospechosos.forEach(s=>{if(s.desbloqueado){let o=document.createElement("option");o.value=s.nombre;o.textContent=s.nombre;selCo.appendChild(o);}});
  selA.innerHTML=`<option value="">Selecciona arma</option><option value="${casoData.resolucion.arma}">${casoData.resolucion.arma}</option>`;
  selM.innerHTML=`<option value="">Selecciona motivo</option><option value="${casoData.resolucion.motivo}">${casoData.resolucion.motivo}</option>`;
}

function resolverCasoAvanzado(){
  const c=document.getElementById("culpable").value;
  const co=document.getElementById("complice").value;
  const a=document.getElementById("arma").value;
  const m=document.getElementById("motivo").value;
  const res=document.getElementById("resultado-avanzado");

  if(c===casoData.resolucion.culpable && co===casoData.resolucion.complice && a===casoData.resolucion.arma && m===casoData.resolucion.motivo){
    res.textContent="¡Caso resuelto correctamente! ✅";
    let progreso=JSON.parse(localStorage.getItem("progresoCasos"))||{};
    progreso[casoData.nombre]=true;
    localStorage.setItem("progresoCasos",JSON.stringify(progreso));
  } else res.textContent="Datos incorrectos. El caso continúa.";
}
