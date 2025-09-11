let casoData;
let preguntasHechas={};
let conversacion={};

fetch('caso1.json')
  .then(res=>res.json())
  .then(data=>{
    casoData=data;
    inicializarVariables();
    inicializarCaso();
  });

function inicializarVariables(){
  casoData.sospechosos.forEach(s=>{ preguntasHechas[s.nombre]=[]; conversacion[s.nombre]=[]; });
}

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
    const btn=document.createElement("button");
    btn.textContent=s.nombre;
    btn.className="sospechoso";
    btn.onclick=()=>mostrarPreguntas(s.nombre);
    cont.appendChild(btn);
  });
}

function mostrarPreguntas(sos){
  const cont=document.getElementById("preguntas-container");
  cont.innerHTML="";
  // Preguntas basicas
  casoData.preguntasBasicas.forEach(p=>{
    if(!preguntasHechas[sos].includes(p)){
      const btn=document.createElement("button");
      btn.textContent=p;
      btn.onclick=()=>hacerPregunta(sos,p,false);
      cont.appendChild(btn);
    }
  });
  // Preguntas avanzadas
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
}

function hacerPregunta(sos,p,esAvanzada){
  const resp="Respuesta pendiente"; // para preguntas basicas, puedes personalizar
  registrarRespuesta(sos,p,resp);
}

function hacerPreguntaAvanzado(sos,pObj){
  registrarRespuesta(sos,pObj.texto,pObj.respuesta);
  if(pObj.desbloqueo){
    pObj.desbloqueo.forEach(d=>{
      if(!casoData.preguntasAvanzadas[d.sospechoso]) casoData.preguntasAvanzadas[d.sospechoso]=[];
      casoData.preguntasAvanzadas[d.sospechoso].push({texto:d.nuevaPregunta,respuesta:"Pendiente",desbloqueo:[]});
    });
  }
}

function registrarRespuesta(sos,preg,resp){
  preguntasHechas[sos].push(preg);
  conversacion[sos].push({pregunta:preg,respuesta:resp});
  generarPistas(sos,preg,resp);
  mostrarRegistroConversacion();
  mostrarPreguntas(sos);
}

function mostrarRegistroConversacion(){
  const cont=document.getElementById("registro-conversacion");
  cont.innerHTML="";
  casoData.sospechosos.forEach(s=>{
    conversacion[s.nombre].forEach(r=>{
      const p=document.createElement("p");
      p.innerHTML=`<strong>${s.nombre} - ${r.pregunta}</strong><br>${r.respuesta}`;
      cont.appendChild(p);
    });
  });
}

function generarPistas(sos,preg,resp){
  const pistas=JSON.parse(localStorage.getItem("pistas"+casoData.nombre))||[];
  const secretas=JSON.parse(localStorage.getItem("pistasSecretas"+casoData.nombre))||[];

  if(resp.includes("Lucas") && !secretas.includes("Huella coincide con Lucas")) secretas.push("Huella coincide con Lucas");
  if(resp.includes("Contradicción") && !secretas.includes("Contradicción detectada")) secretas.push("Contradicción detectada entre sospechosos");

  localStorage.setItem("pistas"+casoData.nombre,JSON.stringify(pistas));
  localStorage.setItem("pistasSecretas"+casoData.nombre,JSON.stringify(secretas));
  cargarDossier();
}

function cargarDossier(){
  const pistas=document.getElementById("pistas");
  pistas.innerHTML="";
  const p=JSON.parse(localStorage.getItem("pistas"+casoData.nombre))||[];
  p.forEach(pi=>{ const li=document.createElement("li"); li.textContent=pi; pistas.appendChild(li); });

  const secretas=document.getElementById("secretas");
  secretas.innerHTML="";
  const s=JSON.parse(localStorage.getItem("pistasSecretas"+casoData.nombre))||[];
  s.forEach(se=>{ const li=document.createElement("li"); li.textContent=se; secretas.appendChild(li); });

  const resumen=document.getElementById("resumen-sospechosos");
  resumen.innerHTML="";
  casoData.sospechosos.forEach(s=>{ const li=document.createElement("li"); li.innerHTML=`<strong>${s.nombre}</strong>: ${s.resumen}`; resumen.appendChild(li); });
}

function inicializarSelectores(){
  const selC=document.getElementById("culpable");
  const selCo=document.getElementById("complice");
  const selA=document.getElementById("arma");
  const selM=document.getElementById("motivo");

  selC.innerHTML='<option value="">Selecciona culpable</option>';
  casoData.sospechosos.forEach(s=>{ const o=document.createElement("option"); o.value=s.nombre; o.textContent=s.nombre; selC.appendChild(o); });

  selCo.innerHTML='<option value="">Ninguno</option>';
  casoData.sospechosos.forEach(s=>{ const o=document.createElement("option"); o.value=s.nombre; o.textContent=s.nombre; selCo.appendChild(o); });

  selA.innerHTML='<option value="">Selecciona arma</option>';
  selM.innerHTML='<option value="">Selecciona motivo</option>';
  selA.innerHTML+=`<option value="${casoData.resolucion.arma}">${casoData.resolucion.arma}</option>`;
  selM.innerHTML+=`<option value="${casoData.resolucion.motivo}">${casoData.resolucion.motivo}</option>`;
}

function resolverCasoAvanzado(){
  const c=document.getElementById("culpable").value;
  const co=document.getElementById("complice").value;
  const a=document.getElementById("arma").value;
  const m=document.getElementById("motivo").value;
  const res=document.getElementById("resultado-avanzado");

  if(!c || !a || !m){ res.textContent="Debes seleccionar culpable, arma y motivo."; return; }

  const valido=(c===casoData.resolucion.culpable && co===casoData.resolucion.complice && a===casoData.resolucion.arma && m===casoData.resolucion.motivo);

  res.textContent=valido?"¡Caso resuelto correctamente! ✅":"Combinación incorrecta ❌";
  if(valido) localStorage.setItem("progresoCasos",JSON.stringify({[casoData.nombre]:true}));
}
