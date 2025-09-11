let casoData;
let preguntasHechas = {};
let conversacion = {};
let sospechosoActivo = null;

fetch('caso1.json')
  .then(res => res.json())
  .then(data => {
    casoData = data;
    inicializarVariables();
    inicializarCaso();
  });

// Inicializa las estructuras de control
function inicializarVariables() {
  casoData.sospechosos.forEach(s => {
    preguntasHechas[s.nombre] = [];
    conversacion[s.nombre] = [];
  });
}

// Inicializa el caso: interfaz y selects
function inicializarCaso() {
  actualizarIntroduccion();
  crearListadoSospechosos();
  inicializarSelectores();
  cargarDossier();
}

// Muestra objetos hallados
function actualizarIntroduccion() {
  const ul = document.getElementById("objetos-introduccion");
  ul.innerHTML = "";
  casoData.objetos.forEach(h => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${h.objeto}:</strong> ${h.detalle}`;
    ul.appendChild(li);
  });
}

// Crea botones de sospechosos
function crearListadoSospechosos() {
  const cont = document.getElementById("sospechosos-container");
  cont.innerHTML = "";
  casoData.sospechosos.forEach(s => {
    const btn = document.createElement("button");
    btn.textContent = s.nombre;
    btn.className = "sospechoso";
    btn.onclick = () => mostrarPreguntas(s.nombre);
    cont.appendChild(btn);
  });
}

// Muestra preguntas del sospechoso activo
function mostrarPreguntas(sos) {
  sospechosoActivo = sos;
  const cont = document.getElementById("preguntas-container");
  cont.innerHTML = "";

  // Preguntas básicas
  casoData.preguntasBasicas.forEach(p => {
    if (!preguntasHechas[sos].includes(p)) {
      const btn = document.createElement("button");
      btn.textContent = p;
      btn.onclick = () => hacerPregunta(sos, p, "Respuesta estándar relacionada con la pregunta.");
      cont.appendChild(btn);
    }
  });

  // Preguntas avanzadas
  if (casoData.preguntasAvanzadas[sos]) {
    casoData.preguntasAvanzadas[sos].forEach(pObj => {
      if (!preguntasHechas[sos].includes(pObj.texto)) {
        const btn = document.createElement("button");
        btn.textContent = pObj.texto;
        btn.className = "destacada";
        btn.onclick = () => hacerPreguntaAvanzado(sos, pObj);
        cont.appendChild(btn);
      }
    });
  }

  mostrarRegistroConversacion();
}

// Ejecuta una pregunta básica
function hacerPregunta(sos, preg, resp) {
  registrarRespuesta(sos, preg, resp);
}

// Ejecuta una pregunta avanzada
function hacerPreguntaAvanzado(sos, pObj) {
  registrarRespuesta(sos, pObj.texto, pObj.respuesta);
  if (pObj.desbloqueo) {
    pObj.desbloqueo.forEach(d => {
      if (!casoData.preguntasAvanzadas[d.sospechoso]) casoData.preguntasAvanzadas[d.sospechoso] = [];
      // Evitar duplicados
      if (!casoData.preguntasAvanzadas[d.sospechoso].some(q => q.texto === d.nuevaPregunta)) {
        casoData.preguntasAvanzadas[d.sospechoso].push({ texto: d.nuevaPregunta, respuesta: "Pendiente", desbloqueo: [] });
      }
    });
  }
}

// Registra la respuesta y actualiza registro y pistas
function registrarRespuesta(sos, preg, resp) {
  preguntasHechas[sos].push(preg);
  conversacion[sos].push({ pregunta: preg, respuesta: resp });
  generarPistas(sos, preg, resp);
  mostrarRegistroConversacion();
  mostrarPreguntas(sos);
}

// Muestra el registro del sospechoso activo
function mostrarRegistroConversacion() {
  const cont = document.getElementById("registro-conversacion");
  cont.innerHTML = "";
  if (!sospechosoActivo) return;
  conversacion[sospechosoActivo].forEach(r => {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${sospechosoActivo} - ${r.pregunta}</strong><br>${r.respuesta}`;
    cont.appendChild(p);
  });
}

// Genera pistas y pistas secretas automáticas
function generarPistas(sos, preg, resp) {
  let pistas = JSON.parse(localStorage.getItem("pistas" + casoData.nombre)) || [];
  let secretas = JSON.parse(localStorage.getItem("pistasSecretas" + casoData.nombre)) || [];

  // Lógica de ejemplo para pistas basadas en palabras clave
  if (resp.includes("Lucas") && !secretas.includes("Huella coincide con Lucas")) secretas.push("Huella coincide con Lucas");
  if (resp.includes("Contradicción") && !secretas.includes("Contradicción detectada")) secretas.push("Contradicción detectada entre sospechosos");
  if (resp.includes("Cuchillo") && !pistas.includes("Cuchillo doblado y con sangre")) pistas.push("Cuchillo doblado y con sangre");

  localStorage.setItem("pistas" + casoData.nombre, JSON.stringify(pistas));
  localStorage.setItem("pistasSecretas" + casoData.nombre, JSON.stringify(secretas));
  cargarDossier();
}

// Carga el dossier con pistas, secretas y resumen de sospechosos
function cargarDossier() {
  // Pistas normales
  const pistas = document.getElementById("pistas");
  pistas.innerHTML = "";
  const p = JSON.parse(localStorage.getItem("pistas" + casoData.nombre)) || [];
  p.forEach(pi => {
    const li = document.createElement("li");
    li.textContent = pi;
    pistas.appendChild(li);
  });

  // Pistas secretas
  const secretasElem = document.getElementById("secretas");
  secretasElem.innerHTML = "";
  const s = JSON.parse(localStorage.getItem("pistasSecretas" + casoData.nombre)) || [];
  s.forEach(se => {
    const li = document.createElement("li");
    li.textContent = se;
    secretasElem.appendChild(li);
  });

  // Resumen de sospechosos
  const resumen = document.getElementById("resumen-sospechosos");
  resumen.innerHTML = "";
  casoData.sospechosos.forEach(s => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${s.nombre}</strong>: ${s.resumen}`;
    resumen.appendChild(li);
  });
}

// Inicializa selects para resolver caso
function inicializarSelectores() {
  const selC = document.getElementById("culpable");
  const selCo = document.getElementById("complice");
  const selA = document.getElementById("arma");
  const selM = document.getElementById("motivo");

  selC.innerHTML = '<option value="">Selecciona culpable</option>';
  casoData.sospechosos.forEach(s => {
    const o = document.createElement("option");
    o.value = s.nombre;
    o.textContent = s.nombre;
    selC.appendChild(o);
  });

  selCo.innerHTML = '<option value="">Ninguno</option>';
  casoData.sospechosos.forEach(s => {
    const o = document.createElement("option");
    o.value = s.nombre;
    o.textContent = s.nombre;
    selCo.appendChild(o);
  });

  selA.innerHTML = '<option value="">Selecciona arma</option>';
  selA.innerHTML += `<option value="${casoData.resolucion.arma}">${casoData.resolucion.arma}</option>`;

  selM.innerHTML = '<option value="">Selecciona motivo</option>';
  selM.innerHTML += `<option value="${casoData.resolucion.motivo}">${casoData.resolucion.motivo}</option>`;
}

// Resolver caso
function resolverCasoAvanzado() {
  const c = document.getElementById("culpable").value;
  const co = document.getElementById("complice").value;
  const a = document.getElementById("arma").value;
  const m = document.getElementById("motivo").value;
  const res = document.getElementById("resultado-avanzado");

  if (!c || !a || !m) {
    res.textContent = "Debes seleccionar culpable, arma y motivo.";
    return;
  }

  const valido = (
    c === casoData.resolucion.culpable &&
    co === casoData.resolucion.complice &&
    a === casoData.resolucion.arma &&
    m === casoData.resolucion.motivo
  );

  res.textContent = valido ? "¡Caso resuelto correctamente! ✅" : "Combinación incorrecta ❌";

  if (valido) {
    localStorage.setItem("progresoCasos", JSON.stringify({ [casoData.nombre]: true }));
  }
}
