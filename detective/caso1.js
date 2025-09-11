/* caso1.js
   Lógica del Caso 1: desbloqueos, persistencia, registro con subrayado de pistas
*/

let casoData = null;
let preguntasHechas = {};     // { "Sofia": ["preg1","preg2"], ... }
let conversacion = {};        // { "Sofia": [{pregunta:"",respuesta:""}], ... }
let sospechosoActivo = null;
let unlockedQuestions = {};   // track unlocked advanced question texts per suspect (persistible)

// --- Fallback JSON (usa si fetch falla) ---
const FALLBACK_JSON = `__FALLBACK_JSON__`;

/* Nota: el placeholder __FALLBACK_JSON__ será reemplazado en tiempo de ejecución por el contenido
   del caso1.json si fetch no funciona. Para compatibilidad si sirves el archivo con un servidor,
   fetch cargará el JSON externo; si abres directamente el HTML, se usará el fallback. */

// Load JSON with fetch and fallback
(function loadCase(){
  fetch('caso1.json').then(r=>{
    if(!r.ok) throw new Error('no file');
    return r.json();
  }).then(data=>{
    initWithData(data);
  }).catch(err=>{
    // fallback: parse embedded JSON (we'll inject it programmatically)
    try {
      const parsed = JSON.parse(window.__CASO1_EMBEDDED_JSON__ || FALLBACK_JSON);
      initWithData(parsed);
    } catch(e){
      console.error("No se pudo cargar el caso (fetch y fallback fallaron).", e);
    }
  });
})();

function initWithData(data){
  casoData = data;
  // init structures and read localStorage
  casoData.sospechosos.forEach(s=>{
    preguntasHechas[s.nombre] = JSON.parse(localStorage.getItem('preguntas-' + s.nombre)) || [];
    conversacion[s.nombre] = JSON.parse(localStorage.getItem('conversacion-' + s.nombre)) || [];
    unlockedQuestions[s.nombre] = JSON.parse(localStorage.getItem('unlockedQ-' + s.nombre)) || [];
    // mark suspect unlocked only if in initial list or previously unlocked
    s.desbloqueado = (casoData.sospechososIniciales || []).includes(s.nombre) || JSON.parse(localStorage.getItem('sus-'+s.nombre))===true;
  });

  // if any advanced questions have 'initiallyHidden' true, they start locked -- do nothing
  renderAll();
}

// Render all UI
function renderAll(){
  renderObjetos();
  renderSuspects();
  renderSelectors();
  cargarDossier();
  refreshQuestionsArea();
  restoreActiveView();
}

// restore previously active suspect view if any
function restoreActiveView(){
  const last = localStorage.getItem('sospechosoActivo-' + casoData.nombre);
  if(last && casoData.sospechosos.some(s=>s.nombre===last && s.desbloqueado)){
    mostrarPreguntas(last);
  }
}

// ----- RENDER: Objetos -----
function renderObjetos(){
  const ul = document.getElementById('objetos-introduccion');
  ul.innerHTML = '';
  (casoData.objetos||[]).forEach(o=>{
    const li = document.createElement('li');
    li.innerHTML = `<strong>${escapeHtml(o.objeto)}:</strong> ${escapeHtml(o.detalle)}`;
    ul.appendChild(li);
  });
}

// ----- RENDER: Sospechosos -----
function renderSuspects(){
  const cont = document.getElementById('sospechosos-container');
  cont.innerHTML = '';
  casoData.sospechosos.forEach(s=>{
    if(!s.desbloqueado) return; // do not render locked suspects
    const btn = document.createElement('button');
    btn.className = 'sus-btn sus-btn-' + s.nombre;
    btn.textContent = s.nombre;
    btn.onclick = ()=> mostrarPreguntas(s.nombre);
    cont.appendChild(btn);
  });
}

// ----- Mostrar preguntas (al seleccionar sospechoso) -----
function mostrarPreguntas(sos){
  sospechosoActivo = sos;
  localStorage.setItem('sospechosoActivo-' + casoData.nombre, sos);
  refreshQuestionsArea();
  mostrarRegistroConversacion();
}

// refresh preguntas area (buttons)
function refreshQuestionsArea(){
  const cont = document.getElementById('preguntas-container');
  cont.innerHTML = '';

  if(!sospechosoActivo) {
    cont.innerHTML = '<p class="small-muted">Selecciona un sospechoso para ver preguntas desbloqueadas.</p>';
    return;
  }

  // Basic questions: always visible for unlocked suspect, unless already asked
  const basicas = (casoData.preguntasBasicas && casoData.preguntasBasicas[sospechosoActivo]) || [];
  basicas.forEach(q=>{
    if(!preguntasHechas[sospechosoActivo].includes(q.texto)){
      const btn = document.createElement('button');
      btn.textContent = q.texto;
      btn.onclick = ()=> hacerPregunta(sospechosoActivo, q.texto, q.respuesta);
      cont.appendChild(btn);
    }
  });

  // Advanced questions: only show those that are unlocked
  const avanzadas = (casoData.preguntasAvanzadas && casoData.preguntasAvanzadas[sospechosoActivo]) || [];
  avanzadas.forEach(q=>{
    const isUnlocked = unlockedQuestions[sospechosoActivo] && unlockedQuestions[sospechosoActivo].includes(q.texto);
    const initiallyHidden = q.initiallyHidden === true;
    // If question has 'requires' array, only unlock after those base questions answered
    let reqSatisfied = true;
    if(Array.isArray(q.requires) && q.requires.length){
      reqSatisfied = q.requires.every(reqText => preguntasHechas[sospechosoActivo].includes(reqText));
    }
    // If previously unlocked (persisted) or requirement satisfied, show
    if(isUnlocked || reqSatisfied){
      // ensure persisted unlocked
      if(!unlockedQuestions[sospechosoActivo].includes(q.texto)){
        unlockedQuestions[sospechosoActivo].push(q.texto);
        localStorage.setItem('unlockedQ-' + sospechosoActivo, JSON.stringify(unlockedQuestions[sospechosoActivo]));
      }
      // only show if not yet asked
      if(!preguntasHechas[sospechosoActivo].includes(q.texto)){
        const btn = document.createElement('button');
        btn.textContent = q.texto;
        btn.className = (q.markAsNew? 'destacada':'' ) + (btn.className||'');
        // visually mark recently unlocked (if it's in unlockedQuestions but was just unlocked this session)
        if(q.markAsNew) btn.classList.add('destacada');
        btn.onclick = ()=> hacerPreguntaAvanzado(sospechosoActivo, q);
        cont.appendChild(btn);
      }
    }
  });

  // If no questions available:
  const anyAvailable = cont.querySelectorAll('button').length;
  if(!anyAvailable){
    cont.innerHTML = '<p class="small-muted">No hay preguntas disponibles por ahora. Avanza en otras entrevistas para desbloquear nuevas líneas.</p>';
  }
}

// ----- Hacer pregunta básica -----
function hacerPregunta(sos, texto, respuesta){
  // register answer
  registrarRespuesta(sos, texto, respuesta);
  // check unlock rules triggered by answering this basic question
  checkUnlocksAfterAnswer(sos, texto, respuesta);
}

// ----- Hacer pregunta avanzada -----
function hacerPreguntaAvanzado(sos, qObj){
  const respuesta = qObj.respuesta || "(respuesta no definida)";
  registrarRespuesta(sos, qObj.texto, respuesta);
  // apply unlocks specified inside the question object
  if(Array.isArray(qObj.desbloqueo)){
    qObj.desbloqueo.forEach(d=>{
      applyUnlock(d);
    });
  }
  // After running possible unlocks, refresh UI
  renderSuspectsAndQuestions();
}

// apply unlock object: may unlock suspect and/or insert new question into target suspect
function applyUnlock(d){
  if(!d || !d.sospechoso) return;
  const target = casoData.sospechosos.find(s=>s.nombre===d.sospechoso);
  if(!target) return;
  // Unlock suspect if locked
  if(!target.desbloqueado){
    target.desbloqueado = true;
    localStorage.setItem('sus-' + target.nombre, true);
  }
  // Add a new advanced question for target if nuevaQuestion provided
  if(d.nuevaPregunta){
    if(!casoData.preguntasAvanzadas[target.nombre]) casoData.preguntasAvanzadas[target.nombre] = [];
    // avoid duplicates
    if(!casoData.preguntasAvanzadas[target.nombre].some(q=>q.texto === d.nuevaPregunta)){
      casoData.preguntasAvanzadas[target.nombre].push({
        texto: d.nuevaPregunta,
        respuesta: d.respuesta || 'Información recién desbloqueada.',
        requires: d.requires || [],
        initiallyHidden: d.initiallyHidden || false,
        markAsNew: true,
        desbloqueo: d.desbloqueo || []
      });
    }
  }
  // persist unlockedQuestions arrays maybe needed
}

// helper to re-render suspects and question area
function renderSuspectsAndQuestions(){
  renderSuspects();
  refreshQuestionsArea();
  renderSelectors();
  cargarDossier();
}

// ----- Registrar respuesta y persistir -----
function registrarRespuesta(sos, pregunta, respuesta){
  // save question as asked
  if(!preguntasHechas[sos]) preguntasHechas[sos] = [];
  preguntasHechas[sos].push(pregunta);
  localStorage.setItem('preguntas-' + sos, JSON.stringify(preguntasHechas[sos]));

  // save conversation item
  if(!conversacion[sos]) conversacion[sos] = [];
  conversacion[sos].push({pregunta: pregunta, respuesta: respuesta, timestamp: Date.now()});
  localStorage.setItem('conversacion-' + sos, JSON.stringify(conversacion[sos]));

  // check for pistas in respuesta
  const pistasDetectadas = detectPistasEnTexto(respuesta);
  if(pistasDetectadas.length) {
    pistasDetectadas.forEach(pi=>{
      addPista(pi, sos);
    });
  }

  // After registering, check general unlock rules that depend on answered questions:
  checkGlobalUnlockRequirements();

  // Show updated conversation and questions
  mostrarRegistroConversacion();
  refreshQuestionsArea();
}

// ----- Detectar pistas dentro de un texto -----
function detectPistasEnTexto(text){
  const found = [];
  if(!text || !casoData) return found;
  // check known objects
  (casoData.objetos || []).forEach(o=>{
    const key = o.objeto;
    if(key && text.toLowerCase().includes(key.toLowerCase())){
      if(!found.includes(key)) found.push(key);
    }
  });
  // additional keywords that imply clues
  const keywords = ['cuchillo','sangre','huella','llave','zapato','documento','contradicción','intruso','sombra','murmullos'];
  keywords.forEach(k=>{
    if(text.toLowerCase().includes(k) && !found.includes(k)) found.push(k);
  });
  return found;
}

// ----- Añadir pista y nota automática en la conversación -----
function addPista(pista, sospechosoOrigen){
  const pistaKey = pista;
  let pistas = JSON.parse(localStorage.getItem('pistas-' + casoData.nombre)) || [];
  if(!pistas.includes(pistaKey)){
    pistas.push(pistaKey);
    localStorage.setItem('pistas-' + casoData.nombre, JSON.stringify(pistas));
    // Añadir nota automática en el registro del sospechoso que soltó la pista
    if(!conversacion[sospechosoOrigen]) conversacion[sospechosoOrigen] = [];
    const nota = `(Nota automática) Se ha descubierto una nueva pista: ${pistaKey}`;
    conversacion[sospechosoOrigen].push({pregunta: '(Sistema)', respuesta: nota, timestamp: Date.now()});
    localStorage.setItem('conversacion-' + sospechosoOrigen, JSON.stringify(conversacion[sospechosoOrigen]));
  }
  // optionally: add to secretas if important keywords
  const secretKeywords = ['huella','sangre','contradicción'];
  const lower = pistaKey.toLowerCase();
  if(secretKeywords.some(sk => lower.includes(sk))){
    let secretas = JSON.parse(localStorage.getItem('pistasSecretas-' + casoData.nombre)) || [];
    if(!secretas.includes(pistaKey)){
      secretas.push(pistaKey);
      localStorage.setItem('pistasSecretas-' + casoData.nombre, JSON.stringify(secretas));
    }
  }
  // update dossier UI
  cargarDossier();
}

// ----- Comprobar reglas de desbloqueo global (por ejemplo, si ciertas preguntas básicas respondidas) -----
function checkGlobalUnlockRequirements(){
  // Example: iterate all advanced questions and if they have 'requires' array and requirements satisfied, mark unlocked.
  (casoData.sospechosos || []).forEach(s=>{
    const adv = (casoData.preguntasAvanzadas && casoData.preguntasAvanzadas[s.nombre]) || [];
    adv.forEach(q=>{
      if(Array.isArray(q.requires) && q.requires.length){
        const satisfied = q.requires.every(reqText => preguntasHechas[s.nombre] && preguntasHechas[s.nombre].includes(reqText));
        if(satisfied && !(unlockedQuestions[s.nombre]||[]).includes(q.texto)){
          // mark unlocked
          unlockedQuestions[s.nombre] = unlockedQuestions[s.nombre] || [];
          unlockedQuestions[s.nombre].push(q.texto);
          localStorage.setItem('unlockedQ-' + s.nombre, JSON.stringify(unlockedQuestions[s.nombre]));
          // mark visual highlight
          q.markAsNew = true;
        }
      }
    });
  });
  // Re-render question area if active suspect
  refreshQuestionsArea();
  renderSuspects();
}

// ----- Mostrar solo registro del sospechoso activo, subrayando pistas -----
function mostrarRegistroConversacion(){
  const cont = document.getElementById('registro-conversacion');
  cont.innerHTML = '';
  if(!sospechosoActivo) {
    cont.innerHTML = '<p class="small-muted">Selecciona un sospechoso para ver su registro.</p>';
    return;
  }
  const conv = conversacion[sospechosoActivo] || [];
  conv.forEach(item=>{
    const div = document.createElement('div');
    div.className = 'registro-item' + (item.pregunta && item.pregunta.startsWith('(Nota') ? ' note' : '');
    // Escape and then mark claves
    let text = escapeHtml(item.respuesta);
    // get current pistas list to underline
    const pistas = JSON.parse(localStorage.getItem('pistas-' + casoData.nombre)) || [];
    pistas.forEach(pi=>{
      const re = new RegExp(escapeRegExp(pi),'ig');
      text = text.replace(re, `<span class="highlight-u">${pi}</span>`);
    });
    div.innerHTML = `<strong>${escapeHtml(item.pregunta)}</strong><div>${text}</div>`;
    cont.appendChild(div);
  });
  // auto scroll to bottom
  cont.scrollTop = cont.scrollHeight;
}

// ----- Cargar dossier (solo pistas descubiertas y sospechosos visibles) -----
function cargarDossier(){
  // pistas
  const ulP = document.getElementById('pistas');
  ulP.innerHTML = '';
  (JSON.parse(localStorage.getItem('pistas-' + casoData.nombre)) || []).forEach(p=>{
    const li = document.createElement('li'); li.textContent = p; ulP.appendChild(li);
  });
  // secretas
  const ulS = document.getElementById('secretas');
  ulS.innerHTML = '';
  (JSON.parse(localStorage.getItem('pistasSecretas-' + casoData.nombre)) || []).forEach(p=>{
    const li = document.createElement('li'); li.textContent = p; ulS.appendChild(li);
  });
  // resumen sospechosos desbloqueados
  const ulR = document.getElementById('resumen-sospechosos');
  ulR.innerHTML = '';
  casoData.sospechosos.forEach(s=>{
    if(s.desbloqueado){
      const li = document.createElement('li'); li.innerHTML = `<strong>${escapeHtml(s.nombre)}</strong>: ${escapeHtml(s.resumen)}`;
      ulR.appendChild(li);
    }
  });
}

// ----- Render / init selector options with only visible suspects -----
function renderSelectors(){
  const selC = document.getElementById('culpable');
  const selCo = document.getElementById('complice');
  const selA = document.getElementById('arma');
  const selM = document.getElementById('motivo');

  selC.innerHTML = '<option value="">(Selecciona)</option>';
  selCo.innerHTML = '<option value="">(Ninguno)</option>';
  (casoData.sospechosos || []).forEach(s=>{
    if(s.desbloqueado){
      const o1 = document.createElement('option'); o1.value = s.nombre; o1.textContent = s.nombre; selC.appendChild(o1);
      const o2 = document.createElement('option'); o2.value = s.nombre; o2.textContent = s.nombre; selCo.appendChild(o2);
    }
  });
  // armas y motivos: use resolution data only (could be expanded)
  selA.innerHTML = `<option value="">(Selecciona)</option><option value="${escapeHtml(casoData.resolucion.arma)}">${escapeHtml(casoData.resolucion.arma)}</option>`;
  selM.innerHTML = `<option value="">(Selecciona)</option><option value="${escapeHtml(casoData.resolucion.motivo)}">${escapeHtml(casoData.resolucion.motivo)}</option>`;
}

// ----- Resolver caso (comprobación exacta) -----
function resolverCasoAvanzado(){
  const c = document.getElementById('culpable').value;
  const co = document.getElementById('complice').value;
  const a = document.getElementById('arma').value;
  const m = document.getElementById('motivo').value;
  const out = document.getElementById('resultado-avanzado');
  if(!c || !a || !m){ out.textContent = 'Debes seleccionar culpable, arma y motivo.'; return; }
  const ok = c === casoData.resolucion.culpable && co === casoData.resolucion.complice && a === casoData.resolucion.arma && m === casoData.resolucion.motivo;
  if(ok){
    out.textContent = '¡Caso resuelto correctamente! ✅';
    const prog = JSON.parse(localStorage.getItem('progresoCasos') || '{}');
    prog[casoData.nombre] = true;
    localStorage.setItem('progresoCasos', JSON.stringify(prog));
  } else {
    out.textContent = 'Combinación incorrecta. Revisa el dossier y las conversaciones.';
  }
}

// ----- Utilities -----
function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]; }); }
function escapeRegExp(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Provide embedded JSON when fetch fails: inject actual JSON content here
// We'll set window.__CASO1_EMBEDDED_JSON__ to the same JSON used in caso1.json to guarantee fallback
(function embedFallback(){
  window.__CASO1_EMBEDDED_JSON__ = `{
  "nombre":"El Faro",
  "sospechososIniciales":["Sofia","Mateo","Lucas","Clara","Javier"],
  "objetos":[
    {"objeto":"Cuchillo","detalle":"Encontrado ligeramente doblado, con restos de sangre en la empuñadura y hoja."},
    {"objeto":"Llave del Faro","detalle":"Llave metálica con marca de uso reciente; no corresponde al llavero general."},
    {"objeto":"Zapato roto","detalle":"Zapato masculino, suela desgastada y lazo roto; huellas parciales en la arena."},
    {"objeto":"Documento antiguo","detalle":"Documento con anotaciones sobre accesos y cierre nocturno; alguien lo había hojeado recientemente."}
  ],
  "sospechosos":[
    {"nombre":"Sofia","resumen":"Trabajadora del faro, responsable de cierres. Conoce horarios y llaves."},
    {"nombre":"Mateo","resumen":"Ayudante, hace tareas en la torre. Cercano a Sofia."},
    {"nombre":"Lucas","resumen":"Guardia nocturno, celoso de la víctima y conocedor del almacén de herramientas."},
    {"nombre":"Clara","resumen":"Fotógrafa; pasó la noche tomando imágenes para su proyecto."},
    {"nombre":"Javier","resumen":"Historiador; investiga documentos del faro y pistas antiguas."},
    {"nombre":"Ricardo","resumen":"Visitante desconocido; observado fugazmente en el muelle (sospechoso desbloqueable)."}
  ],
  "preguntasBasicas":{
    "Sofia":[
      {"texto":"¿Con quién estabas la noche del crimen?","respuesta":"Al principio con Mateo en la torre. Más tarde estuve sola hasta las 23:30. Escuché pasos y vi una sombra moverse por el muelle."},
      {"texto":"¿Qué hora llegaste y te fuiste del faro?","respuesta":"Llegué a las 20:50 para el cierre y me fui a las 23:30 tras comprobar las cerraduras."},
      {"texto":"¿Viste algún objeto fuera de lugar?","respuesta":"Sí: noté un cuchillo fuera de su sitio y algo de sangre en la mesa de la cocina."}
    ],
    "Mateo":[
      {"texto":"¿Qué hacías durante la noche del crimen?","respuesta":"Inspeccionaba los niveles inferiores y reparaba una lámpara. Vi a alguien extraño a lo lejos, parecía observarnos."},
      {"texto":"¿Alguien te siguió?","respuesta":"Sentí que alguien me observaba desde la oscuridad del muelle; no logré identificarle claramente."},
      {"texto":"¿Notaste algo en el suelo?","respuesta":"Encontré un zapato roto cerca del muelle, con arena fresca alrededor."}
    ],
    "Lucas":[
      {"texto":"¿Cuál era tu ronda esa noche?","respuesta":"Patrullaba el muelle y revisaba el área de almacenaje. Vi a Mateo bajar a niveles inferiores y luego noté movimiento en la cocina."},
      {"texto":"¿Viste a alguien junto a la cerradura?","respuesta":"No estuve junto a la cerradura cuando se movió, pero noté que alguien pasó junto a ella con prisa."}
    ],
    "Clara":[
      {"texto":"¿Qué hacías esa noche?","respuesta":"Tomaba fotografías nocturnas. Vi a Lucas y Mateo moverse con cautela y algo parecía fuera de sitio—un cuchillo en la mesa."}
    ],
    "Javier":[
      {"texto":"¿Qué investigabas en el faro?","respuesta":"Buscaba planos antiguos. Vi sombras en la cubierta superior y alguien hojeando documentos que no eran míos."}
    ],
    "Ricardo":[
      {"texto":"¿Qué hacías en el muelle?","respuesta":"Pasaba por el muelle por curiosidad. No quería problemas; solo observaba desde la distancia."}
    ]
  },
  "preguntasAvanzadas":{
    "Sofia":[
      {"texto":"¿Quién crees que podría haber usado la llave fuera de horario?","respuesta":"Lucas parecía demasiado pendiente de las llaves y del almacén; le vi revisar objetos personales cerca de la mesa después del cierre.","requires":["¿Viste algún objeto fuera de lugar?"],"desbloqueo":[{"sospechoso":"Lucas","nuevaPregunta":"¿Por qué revisabas objetos cerca de la mesa tras el cierre?","respuesta":"Estaba comprobando que nada faltara del almacén; no toqué el cuchillo."}]},
      {"texto":"¿Escuchaste voces cerca del muelle?","respuesta":"Sí: murmullos apagados y pasos que se alejaban; alguien conocía la zona y no parecía turista.","requires":["¿Con quién estabas la noche del crimen?"],"desbloqueo":[{"sospechoso":"Ricardo","nuevaPregunta":"¿Por qué estabas merodeando el muelle?","respuesta":"Solo estaba pasando; me llamó la atención una luz extraña."}]},
      {"texto":"¿Dónde viste la sangre inicialmente?","respuesta":"En la mesa de la cocina, cerca del cajón donde se guardan herramientas; fue lo que me alarmó y me hizo llamar a Lucas."}
    ],
    "Mateo":[
      {"texto":"¿Qué hiciste al ver el zapato roto?","respuesta":"Marqué su ubicación y fui a avisar a Sofia. La suela estaba con arena reciente, como si hubieran huido hacia el muelle.","requires":["¿Notaste algo en el suelo?"],"desbloqueo":[{"sospechoso":"Ricardo","nuevaPregunta":"¿Tenías zapatos mojados o rotos esa noche?","response":"No, los míos estaban bien."}]},
      {"texto":"¿Viste a alguien pasar apresurado?","respuesta":"Sí, a una figura oscura pasar junto a la cocina en dirección al muelle; parecía conocer los accesos."}
    ],
    "Lucas":[
      {"texto":"¿Qué hiciste en la cocina tras la alarma?","respuesta":"Recogí el cuchillo y lo aseguré; estaba doblado y con manchas que parecían sangre, por eso lo llevé a un lugar seguro.","requires":["¿Cuál era tu ronda esa noche?"],"desbloqueo":[{"sospechoso":"Javier","nuevaPregunta":"¿Ves relación entre los documentos y la escena de la cocina?","response":"Los documentos tenían anotaciones recientes que hablaban de accesos; alguien los había mirado."}]},
      {"texto":"¿Por qué estabas tan pendiente del almacén?","respuesta":"Porque en los últimos días han desaparecido pequeñas herramientas; yo vigilaba que no faltara nada."}
    ],
    "Clara":[
      {"texto":"¿Qué notaste en tus fotos relevante para el caso?","respuesta":"En una foto se ve a una figura a la distancia junto al muelle y en otra, una sombra que entra en la cocina; si se amplía quizá veamos rasgos."}
    ],
    "Javier":[
      {"texto":"¿Qué documento pareció haber sido manipulado?","respuesta":"Un cuaderno con apuntes sobre cierres; alguien había desplegado hojas con anotaciones recientes y marcas de dedos."}
    ],
    "Ricardo":[
      {"texto":"¿Por qué estabas rondando el muelle?","respuesta":"Me interesaba ver el faro por la noche; vi movimientos y me alejé. No hablé con nadie.","initiallyHidden":true}
    ]
  },
  "resolucion":{"culpable":"Lucas","complice":"Mateo","arma":"Cuchillo","motivo":"Protección del Faro"}
}`;
})();