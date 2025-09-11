// Mostrar el formulario de resolución en un modal SweetAlert2
function mostrarModalResolverCaso() {
  if (!window.Swal) {
    alert('SweetAlert2 no está cargado.');
    return;
  }
  // Crear un contenedor temporal para el formulario
  const tempDiv = document.createElement('div');
  // Asegurarse de que exista el div #resolver-form (aunque no esté en el HTML)
  let divResolver = document.getElementById('resolver-form');
  let creadoTemporal = false;
  if (!divResolver) {
    divResolver = document.createElement('div');
    divResolver.id = 'resolver-form';
    divResolver.style.display = 'none';
    document.body.appendChild(divResolver);
    creadoTemporal = true;
  }
  prepararResolucion(window.casoActual); // Esto actualiza el #resolver-form normalmente
  // Copiar el HTML del formulario
  const formHtml = divResolver.innerHTML;
  tempDiv.innerHTML = `<form id='form-resolver-modal'>${formHtml}</form>`;
  if (creadoTemporal) divResolver.remove();
  Swal.fire({
    title: 'Resolver el caso',
    html: tempDiv.innerHTML,
    showCancelButton: true,
    confirmButtonText: 'Resolver',
    cancelButtonText: 'Cancelar',
    customClass: {
      popup: 'resolver-caso-panel'
    },
    preConfirm: () => {
      // Tomar los valores seleccionados
      const culpable = Swal.getPopup().querySelector('#culpable')?.value;
      const arma = Swal.getPopup().querySelector('#arma')?.value;
      const motivo = Swal.getPopup().querySelector('#motivo')?.value;
      return { culpable, arma, motivo };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      // Simular selección en el formulario real para usar la función existente
      document.getElementById('culpable').value = result.value.culpable;
      document.getElementById('arma').value = result.value.arma;
      document.getElementById('motivo').value = result.value.motivo;
      resolverCaso();
      // Mostrar el resultado en un nuevo modal
      setTimeout(() => {
        const resultadoDiv = document.getElementById('resultado-resolver');
        if (resultadoDiv) {
          Swal.fire({
            title: 'Resultado',
            html: resultadoDiv.outerHTML,
            icon: resultadoDiv.textContent.includes('¡Caso resuelto!') ? 'success' : 'error',
            customClass: { popup: 'resolver-caso-panel' }
          });
        }
      }, 100);
    }
  });
}

// Asignar evento al botón de resolver en modal al cargar el caso
document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('btn-resolver-modal');
  if (btn) {
    btn.onclick = mostrarModalResolverCaso;
  }
});
// Panel visual de hilos rojos (relaciones y pistas)
function mostrarPanelHilos() {
  let panel = document.getElementById("panel-hilos");
  if (!panel) return;
  // Recoger sospechosos y pistas
let sospechosos = window.casoActual.sospechosos.filter(s => !s.oculta);
let pistas = JSON.parse(localStorage.getItem(`pistas-${window.casoActual.id}`)) || [];
  // Crear nodos
  let html = `<div style='position:relative;width:100%;height:320px;background:#f8f0e6;border:2px solid #b22222;border-radius:10px;overflow:auto;'>`;
  // Nodos sospechosos
  sospechosos.forEach((s, i) => {
    html += `<div style='position:absolute;left:${30 + i*120}px;top:30px;width:100px;text-align:center;'>
      <div style='background:#fff;border:2px solid #b22222;border-radius:6px;padding:6px 4px;margin-bottom:4px;'>${s.nombre}</div>
      <div style='font-size:11px;color:#b22222;'>${s.id}</div>
    </div>`;
  });
  // Nodos pistas
  pistas.forEach((p, i) => {
    html += `<div style='position:absolute;left:${60 + i*100}px;top:180px;width:120px;text-align:center;'>
      <div style='background:#fff8;border:2px dashed #b22222;border-radius:6px;padding:4px 2px;color:#b22222;'>${p}</div>
    </div>`;
  });
  // Hilos (líneas SVG)
  html += `<svg width='100%' height='320' style='position:absolute;left:0;top:0;pointer-events:none;'>`;
  sospechosos.forEach((s, i) => {
    pistas.forEach((p, j) => {
      // Si la pista menciona el nombre o id del sospechoso, dibujar hilo
      if (typeof p === 'string' && (p.toLowerCase().includes(s.id) || p.toLowerCase().includes(s.nombre.split(' ')[0].toLowerCase()))) {
        html += `<line x1='${80 + i*120}' y1='60' x2='${120 + j*100}' y2='200' stroke='#b22222' stroke-width='2'/>`;
      }
    });
  });
  html += `</svg></div>`;
  panel.innerHTML = html;
}
// Restaurar desbloqueos de sospechosos y preguntas
// Restaurar preguntas ya realizadas desde localStorage
function restaurarPreguntasRealizadas(data) {
  data.sospechosos.forEach(s => {
    const preguntasKey = `preguntas-realizadas-${data.id}-${s.id}`;
    let preguntasRealizadas = JSON.parse(localStorage.getItem(preguntasKey)) || [];
    if (s.preguntas) {
      s.preguntas.forEach(p => {
        if (preguntasRealizadas.includes(p.id)) {
          p.desbloqueada = false;
        }
      });
    }
  });
}
function restaurarDesbloqueos(data) {
  // Sospechosos
  const keySospechosos = `sospechosos-desbloqueados-${data.id}`;
  let desbloqueados = JSON.parse(localStorage.getItem(keySospechosos)) || [];
  data.sospechosos.forEach(s => {
    if (desbloqueados.includes(s.id)) {
      s.oculta = false;
      s.desbloqueada = true;
    }
    // Preguntas
    const keyPregs = `preguntas-desbloqueadas-${data.id}-${s.id}`;
    let pregDesbloqueadas = JSON.parse(localStorage.getItem(keyPregs)) || [];
    if (s.preguntas) {
      s.preguntas.forEach(p => {
        if (pregDesbloqueadas.includes(p.id)) {
          p.desbloqueada = true;
        }
      });
    }
  });
}

async function cargarCaso(casoId) {
  try {
    // Cargar info general
    const response = await fetch(`data/${casoId}/info.json`);
    const data = await response.json();

    // Cargar sospechosos individuales
    const sospechososCompletos = await Promise.all(
      data.sospechosos.map(async (s) => {
        const sospechosoResp = await fetch(`data/${casoId}/${s.archivo}`);
        const sospechosoData = await sospechosoResp.json();
        // Mantener campos extra de info.json (como nombre personalizado, id, etc)
        return { ...sospechosoData, ...s };
      })
    );
    data.sospechosos = sospechososCompletos;

    // Guardar datos en memoria
    window.casoActual = data;

    restaurarDesbloqueos(data);
    restaurarPreguntasRealizadas(data);
    mostrarIntroduccion(data);
    mostrarSospechosos(data);
    prepararResolucion(data);
    cargarProgreso(casoId); // Para mantener lo descubierto en localStorage
    mostrarPistas();
    mostrarTimeline();
    mostrarPanelHilos();
  } catch (err) {
    console.error("Error cargando caso:", err);
  }
}

function mostrarIntroduccion(data) {
  // Título y descripción
  const titulo = document.getElementById("tituloCaso");
  const descripcion = document.getElementById("descripcionCaso");
  if (titulo) titulo.textContent = data.titulo;
  if (descripcion) {
    // Conversación entre policías presentando el caso y las pistas iniciales
    let dialogo = `<div style='font-family:monospace;'>`;
    dialogo += `<b>Oficial Bogdan:</b> ¿Ya leíste el informe? Encontraron a Julián muerto en la sala de maquinaria del faro durante la tormenta.<br>`;
    dialogo += `<b>Oficial Paola:</b> Sí, la situación es complicada. Hay varias tensiones entre los habitantes y muchas pistas por revisar.<br>`;
    dialogo += `<b>Oficial Bogdan:</b> Estas son las primeras pistas que tenemos, pero solo Paola podrá descubrir la verdad.<ul style='margin-top:4px;'>`;
    if (data.objetos && data.objetos.length > 0) {
      data.objetos.forEach(o => {
        dialogo += `<li>${o}</li>`;
      });
    }
    dialogo += `</ul>`;
    dialogo += `<b>Oficial Paola:</b> Yo me encargaré de descubrir quién es el culpable, con qué arma y el motivo. ¡Vamos allá!`;
    dialogo += `</div>`;
    descripcion.innerHTML = dialogo;
  }
}

function mostrarSospechosos(data) {
  const lista = document.getElementById("sospechosos");
  if (!lista) return;
  lista.innerHTML = "";
  data.sospechosos.forEach(s => {
    // Si es oculto y no está desbloqueado, no mostrar
    if (s.oculta && !s.desbloqueada) return;
    const btn = document.createElement("button");
    btn.textContent = s.nombre;
    // Indicador visual de nuevas preguntas
    const preguntasKey = `preguntas-realizadas-${window.casoActual.id}-${s.id}`;
    let preguntasRealizadas = JSON.parse(localStorage.getItem(preguntasKey)) || [];
    let nuevas = 0;
    if (s.preguntas) {
      nuevas = s.preguntas.filter(p => p.desbloqueada && !preguntasRealizadas.includes(p.id)).length;
    }
    if (nuevas > 0) {
      const badge = document.createElement("span");
      badge.textContent = ` +${nuevas}`;
      badge.style.background = "#b22222";
      badge.style.color = "#fff";
      badge.style.borderRadius = "8px";
      badge.style.fontSize = "0.9em";
      badge.style.marginLeft = "8px";
      badge.style.padding = "2px 7px";
      badge.style.verticalAlign = "middle";
      btn.appendChild(badge);
    }
    btn.onclick = () => seleccionarSospechoso(s);
    lista.appendChild(btn);
  });
}

function seleccionarSospechoso(sospechoso) {
  const preguntasDiv = document.getElementById("preguntas");
  if (!preguntasDiv) return;
  preguntasDiv.innerHTML = `<h3>Preguntas a ${sospechoso.nombre}</h3>`;
  // Mostrar todas las preguntas desbloqueadas SIEMPRE, marcando las ya realizadas
  const preguntasKey = `preguntas-realizadas-${window.casoActual.id}-${sospechoso.id}`;
  let preguntasRealizadas = JSON.parse(localStorage.getItem(preguntasKey)) || [];
  sospechoso.preguntas.forEach(p => {
    if (!p.desbloqueada) return;
    const btn = document.createElement("button");
    btn.textContent = p.texto + (preguntasRealizadas.includes(p.id) ? " (ya preguntada)" : "");
    btn.disabled = preguntasRealizadas.includes(p.id);
    btn.onclick = () => hacerPregunta(sospechoso, p);
    preguntasDiv.appendChild(btn);
  });
  mostrarRegistro(sospechoso.id);
}


// Guardar desbloqueo de sospechoso en localStorage
function guardarDesbloqueoSospechoso(casoId, sospechosoId) {
  const key = `sospechosos-desbloqueados-${casoId}`;
  let desbloqueados = JSON.parse(localStorage.getItem(key)) || [];
  if (!desbloqueados.includes(sospechosoId)) {
    desbloqueados.push(sospechosoId);
    localStorage.setItem(key, JSON.stringify(desbloqueados));
  }
}

// Guardar desbloqueo de pregunta en localStorage
function guardarDesbloqueoPregunta(casoId, sospechosoId, preguntaId) {
  const key = `preguntas-desbloqueadas-${casoId}-${sospechosoId}`;
  let desbloqueadas = JSON.parse(localStorage.getItem(key)) || [];
  if (!desbloqueadas.includes(preguntaId)) {
    desbloqueadas.push(preguntaId);
    localStorage.setItem(key, JSON.stringify(desbloqueadas));
  }
}

function hacerPregunta(sospechoso, pregunta) {
  const registroKey = `registro-${window.casoActual.id}-${sospechoso.id}`;
  let registro = JSON.parse(localStorage.getItem(registroKey)) || [];

  // Mostrar respuesta
  registro.push({ pregunta: pregunta.texto, respuesta: pregunta.respuesta });
  localStorage.setItem(registroKey, JSON.stringify(registro));

  // Marcar la pregunta como usada
  pregunta.desbloqueada = false;
  // Guardar en localStorage que esta pregunta ya fue realizada
  const preguntasKey = `preguntas-realizadas-${window.casoActual.id}-${sospechoso.id}`;
  let preguntasRealizadas = JSON.parse(localStorage.getItem(preguntasKey)) || [];
  if (!preguntasRealizadas.includes(pregunta.id)) {
    preguntasRealizadas.push(pregunta.id);
    localStorage.setItem(preguntasKey, JSON.stringify(preguntasRealizadas));
  }

  // Desbloquear preguntas adicionales o sospechosos
  let nuevosDesbloqueos = false;
  if (pregunta.desbloquea) {
    pregunta.desbloquea.forEach(idDesbloqueo => {
      // 1. Intentar desbloquear pregunta en el mismo sospechoso
      let target = sospechoso.preguntas.find(p => p.id === idDesbloqueo);
      if (target && !target.desbloqueada) {
        target.desbloqueada = true;
        guardarDesbloqueoPregunta(window.casoActual.id, sospechoso.id, target.id);
        nuevosDesbloqueos = true;
        return;
      }
      // 2. Intentar desbloquear pregunta en otros sospechosos
      let sospechosoEncontrado = window.casoActual.sospechosos.find(s => s.preguntas && s.preguntas.some(p => p.id === idDesbloqueo));
      if (sospechosoEncontrado) {
        let preguntaTarget = sospechosoEncontrado.preguntas.find(p => p.id === idDesbloqueo);
        if (preguntaTarget && !preguntaTarget.desbloqueada) {
          preguntaTarget.desbloqueada = true;
          guardarDesbloqueoPregunta(window.casoActual.id, sospechosoEncontrado.id, preguntaTarget.id);
          nuevosDesbloqueos = true;
        }
        // Si el sospechoso estaba oculto, mostrarlo
        if (sospechosoEncontrado.oculta) {
          sospechosoEncontrado.oculta = false;
          sospechosoEncontrado.desbloqueada = true;
          guardarDesbloqueoSospechoso(window.casoActual.id, sospechosoEncontrado.id);
          nuevosDesbloqueos = true;
        }
        return;
      }
      // 3. Intentar desbloquear sospechoso oculto por id exacto
      let sospechosoPorId = window.casoActual.sospechosos.find(s => s.id === idDesbloqueo && s.oculta);
      if (sospechosoPorId) {
        sospechosoPorId.oculta = false;
        sospechosoPorId.desbloqueada = true;
        guardarDesbloqueoSospechoso(window.casoActual.id, sospechosoPorId.id);
        // Desbloquear su primera pregunta si existe
        if (sospechosoPorId.preguntas && sospechosoPorId.preguntas.length > 0 && !sospechosoPorId.preguntas[0].desbloqueada) {
          sospechosoPorId.preguntas[0].desbloqueada = true;
          guardarDesbloqueoPregunta(window.casoActual.id, sospechosoPorId.id, sospechosoPorId.preguntas[0].id);
        }
        nuevosDesbloqueos = true;
      }
    });
  }
  if (nuevosDesbloqueos) {
    mostrarSospechosos(window.casoActual);
  }


// Restaurar desbloqueos de sospechosos y preguntas
function restaurarDesbloqueos(data) {
  // Sospechosos
  const keySospechosos = `sospechosos-desbloqueados-${data.id}`;
  let desbloqueados = JSON.parse(localStorage.getItem(keySospechosos)) || [];
  data.sospechosos.forEach(s => {
    if (desbloqueados.includes(s.id)) {
      s.oculta = false;
      s.desbloqueada = true;
    }
    // Preguntas
    const keyPregs = `preguntas-desbloqueadas-${data.id}-${s.id}`;
    let pregDesbloqueadas = JSON.parse(localStorage.getItem(keyPregs)) || [];
    if (s.preguntas) {
      s.preguntas.forEach(p => {
        if (pregDesbloqueadas.includes(p.id)) {
          p.desbloqueada = true;
        }
      });
    }
  });
}

  // Registrar pistas si las hay
  if (pregunta.pistas) {
    registrarPistas(pregunta.pistas);
  }

  // Refrescar lista de sospechosos y preguntas
  mostrarSospechosos(window.casoActual);
  seleccionarSospechoso(sospechoso);
}

function mostrarRegistro(sospechosoId) {
  const registroKey = `registro-${window.casoActual.id}-${sospechosoId}`;
  let registro = JSON.parse(localStorage.getItem(registroKey)) || [];
  const registroDiv = document.getElementById("conversacion");
  if (!registroDiv) return;
  registroDiv.innerHTML = "<h3>Conversación</h3>";
  registro.forEach(r => {
    const entry = document.createElement("p");
    entry.innerHTML = `<strong>Tú:</strong> ${r.pregunta}<br><strong>${sospechosoId}:</strong> ${r.respuesta}`;
    registroDiv.appendChild(entry);
  });
}

function registrarPistas(pistas) {
  let lista = JSON.parse(localStorage.getItem(`pistas-${window.casoActual.id}`)) || [];
  let sospechososDesbloqueados = false;
  pistas.forEach(p => {
    if (!lista.includes(p)) lista.push(p);
    // Desbloquear sospechosos ocultos si la pista los menciona
    window.casoActual.sospechosos.forEach(s => {
      if (s.oculta && (p.toLowerCase().includes(s.id) || p.toLowerCase().includes(s.nombre.split(' ')[0].toLowerCase()))) {
        s.oculta = false;
        s.desbloqueada = true;
        guardarDesbloqueoSospechoso(window.casoActual.id, s.id);
        // Desbloquear su primera pregunta si existe
        if (s.preguntas && s.preguntas.length > 0) {
          s.preguntas[0].desbloqueada = true;
          guardarDesbloqueoPregunta(window.casoActual.id, s.id, s.preguntas[0].id);
        }
        sospechososDesbloqueados = true;
      }
    });
  });
  localStorage.setItem(`pistas-${window.casoActual.id}`, JSON.stringify(lista));
  mostrarPistas();
  if (sospechososDesbloqueados) {
    mostrarSospechosos(window.casoActual);
  }
}

function mostrarPistas() {
  let lista = JSON.parse(localStorage.getItem(`pistas-${window.casoActual.id}`)) || [];
  const ul = document.getElementById("pistas");
  if (!ul) return;
  ul.innerHTML = "";
  lista.forEach(p => {
    let li = document.createElement("li");
    li.textContent = p;
    ul.appendChild(li);
  });

}

function prepararResolucion(data) {
  // Si quieres agregar el formulario de resolución, crea un div con id="resolver-form" en el HTML
  const div = document.getElementById("resolver-form");
  if (!div) return;
  // Sospechosos desbloqueados
  const sospechososVisibles = data.sospechosos.filter(s => !s.oculta || s.desbloqueada);
  // Armas y motivos descubiertos por pistas
  let pistas = JSON.parse(localStorage.getItem(`pistas-${data.id}`)) || [];
  // Buscar armas/motivos mencionados en pistas
  const armasDescubiertas = data.armas.filter(a => pistas.some(p => p.toLowerCase().includes(a.toLowerCase())));
  const motivosDescubiertos = data.motivos.filter(m => pistas.some(p => p.toLowerCase().includes(m.toLowerCase())));
  // Si no se ha descubierto ninguna arma/motivo, mostrar solo un placeholder
  div.innerHTML = `
    <label>Culpable:</label>
    <select id="culpable">
      ${sospechososVisibles.length > 0 ? sospechososVisibles.map(s => `<option value="${s.id}">${s.nombre}</option>`).join("") : '<option disabled selected>No has descubierto sospechosos</option>'}
    </select>
    <label>Arma:</label>
    <select id="arma">
      ${armasDescubiertas.length > 0 ? armasDescubiertas.map(a => `<option value="${a}">${a}</option>`).join("") : '<option disabled selected>No has descubierto armas</option>'}
    </select>
    <label>Motivo:</label>
    <select id="motivo">
      ${motivosDescubiertos.length > 0 ? motivosDescubiertos.map(m => `<option value="${m}">${m}</option>`).join("") : '<option disabled selected>No has descubierto motivos</option>'}
    </select>
    <button onclick="resolverCaso()">Resolver</button>
  `;

// Si no existe el div, simplemente no muestra el formulario

}

// Mostrar timeline si existe el div
function mostrarTimeline() {
  const timelineDiv = document.getElementById("timeline");
  if (!timelineDiv) return;
  let alibis = [];
  // Recorrer sospechosos y sus preguntas
  window.casoActual.sospechosos.forEach(s => {
    const preguntasKey = `preguntas-realizadas-${window.casoActual.id}-${s.id}`;
    let preguntasRealizadas = JSON.parse(localStorage.getItem(preguntasKey)) || [];
    s.preguntas.forEach(p => {
      if (preguntasRealizadas.includes(p.id) && p.alibi) {
        alibis.push({
          persona: p.alibi.persona,
          hora: p.alibi.hora,
          lugar: p.alibi.lugar,
          sospechoso: s.nombre,
          pregunta: p.texto
        });
      }
    });
  });

  // Mostrar coartadas (alibis) y buscar discrepancias
  let alibiEventos = [];
  let discrepancias = [];
  // Agrupar por persona y hora
  let alibiMap = {};
  alibis.forEach(a => {
    let key = `${a.persona}|${a.hora}`;
    if (!alibiMap[key]) alibiMap[key] = [];
    alibiMap[key].push(a);
  });
  // Buscar discrepancias: misma persona, misma hora, lugares diferentes
  Object.keys(alibiMap).forEach(key => {
    let grupo = alibiMap[key];
    let lugares = [...new Set(grupo.map(a => a.lugar))];
    if (lugares.length > 1) {
      // Discrepancia detectada
      discrepancias.push({
        persona: grupo[0].persona,
        hora: grupo[0].hora,
        lugares,
        fuentes: grupo.map(a => a.sospechoso)
      });
    }
    // Mostrar coartada
    grupo.forEach(a => {
      alibiEventos.push({
        texto: `<b>${a.persona}</b> estuvo en <b>${a.lugar}</b> a las <b>${a.hora}</b> (según ${a.sospechoso})<br><span style='font-size:0.9em;color:#555'>Pregunta: ${a.pregunta}</span>`,
        discrepancia: lugares.length > 1
      });
    });
  });

  // Mostrar solo coartadas y discrepancias
  let html = "<ul style='list-style:none;padding:0;'>";
  if (alibiEventos.length > 0) {
    html += `<li style='margin:12px 0 4px 0;'><b>Coartadas y ubicaciones:</b></li>`;
    alibiEventos.forEach(ae => {
      html += `<li style='margin-bottom:6px;${ae.discrepancia ? "background:#ffe0e0;border-left:4px solid #b22222;" : ""}'>${ae.texto}${ae.discrepancia ? " <span style='color:#b22222;font-weight:bold;'>(¡Discrepancia!)</span>" : ""}</li>`;
    });
  }
  if (discrepancias.length > 0) {
    html += `<li style='margin:12px 0 4px 0;'><b>Discrepancias detectadas:</b></li>`;
    discrepancias.forEach(d => {
      html += `<li style='margin-bottom:6px;background:#ffe0e0;border-left:4px solid #b22222;'>` +
        `<b>${d.persona}</b> a las <b>${d.hora}</b> fue ubicado en lugares diferentes: <b>${d.lugares.join(" / ")}</b> (según ${d.fuentes.join(", ")})</li>`;
    });
  }
  html += "</ul>";
  timelineDiv.innerHTML = alibiEventos.length ? html : "<em>Aún no has descubierto coartadas ni ubicaciones.</em>";
}

// Actualización automática del timeline cada 1 segundo
setInterval(() => {
  if (window.casoActual) mostrarTimeline();
}, 1000);
function resolverCaso() {
  const culpable = document.getElementById("culpable").value;
  const arma = document.getElementById("arma").value;
  const motivo = document.getElementById("motivo").value;

  const solucion = window.casoActual.solucion;
  let resultadoDiv = document.getElementById("resultado-resolver");
  if (!resultadoDiv) {
    resultadoDiv = document.createElement("div");
    resultadoDiv.id = "resultado-resolver";
    resultadoDiv.style.marginTop = "12px";
    resultadoDiv.style.fontWeight = "bold";
    resultadoDiv.style.padding = "10px";
    resultadoDiv.style.borderRadius = "8px";
    document.getElementById("resolver-form").appendChild(resultadoDiv);
  }
  if (culpable === solucion.culpable && arma === solucion.arma && motivo === solucion.motivo) {
    resultadoDiv.textContent = "¡Caso resuelto! Has encontrado la verdad.";
    resultadoDiv.style.background = "#d4edda";
    resultadoDiv.style.color = "#155724";
    resultadoDiv.style.border = "2px solid #155724";
    localStorage.setItem(`progreso-${window.casoActual.id}`, true);
  } else {
    resultadoDiv.textContent = "Esa combinación no resuelve el caso. Sigue investigando...";
    resultadoDiv.style.background = "#f8d7da";
    resultadoDiv.style.color = "#721c24";
    resultadoDiv.style.border = "2px solid #721c24";
  }
}

function cargarProgreso(casoId) {
  mostrarPistas();
}
