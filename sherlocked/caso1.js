// --- Pistas ---
const pistas = {
  forense: `
    <h3>Informe Forense</h3>
    <p>Hora de muerte: entre las 23:00 y 23:45. Cráneo fracturado por un objeto contundente.
    No hay signos de lucha fuerte: el agresor era alguien en quien confiaba.</p>
    <p>Se detectó olor a queroseno en la ropa de la víctima.</p>
  `,
  escena: `
    <h3>Escena del Faro</h3>
    <p>El cuerpo estaba al pie de la escalera. Tres objetos con manchas de sangre:
    una linterna metálica, una llave inglesa y un pesado libro náutico.</p>
    <p>Ventana abierta, restos de arena húmeda cerca de la puerta. 
    Una silla caída en la sala de control.</p>
  `,
  bitacora: `
    <h3>Bitácora del Faro</h3>
    <p>Última entrada de Julián Ortega: 
    "He descubierto que alguien usa el faro para contrabando. 
    Si me pasa algo, busquen en los registros de barcos."</p>
  `,
  ramirez: `
    <h3>Notas del detective Ramírez</h3>
    <p>“El pescador miente sobre dónde estaba.”<br>
    “La sobrina oculta algo relacionado con la herencia.”<br>
    “La periodista sabía demasiado del contrabando.”<br>
    “El cura y el guardia… protectores de secretos.”</p>
  `
};

// --- Sospechosos ---
const sospechosos = {
  sofia: `
    <h3>Sofía Ortega (sobrina)</h3>
    <p>Heredera directa. Dice estar en casa leyendo. 
    Una vecina afirma haber visto su silueta salir cerca de medianoche.</p>
    <p>Motivo: necesitaba dinero para pagar deudas.</p>
  `,
  mateo: `
    <h3>Mateo Duarte (pescador)</h3>
    <p>Asegura que estaba faenando en el mar, pero no hay testigos fiables. 
    En su bote se hallaron cajas vacías con olor a tabaco de contrabando.</p>
    <p>Motivo: el farero amenazaba con denunciarlo.</p>
  `,
  camila: `
    <h3>Camila Torres (periodista)</h3>
    <p>Investigaba tráfico ilegal en el puerto. Dice que estaba entrevistando a una fuente, 
    pero no da nombre. Su libreta contiene apuntes sobre el faro y la policía.</p>
    <p>Motivo: silenciar al farero para quedarse con la exclusiva.</p>
  `,
  ernesto: `
    <h3>Ernesto Vega (guardia portuario)</h3>
    <p>Afirma que hacía ronda en el muelle. Registros muestran un hueco de 45 minutos. 
    Huellas de botas similares a las suyas en el faro.</p>
    <p>Motivo: implicado en contrabando, Ortega lo descubrió.</p>
  `,
  padre: `
    <h3>Padre Anselmo (cura local)</h3>
    <p>Dice estar en la sacristía, pero nadie lo vio. 
    En el faro se halló un rosario roto que llevaba su marca.</p>
    <p>Motivo: protegía a feligreses involucrados en los negocios turbios.</p>
  `
};

// --- Contradicciones posibles ---
const contradicciones = {
  "sofia-mateo": {
    texto: "Sofía dijo que estaba en casa, pero Mateo asegura haberla visto en el puerto cerca de medianoche.",
    pista: "Documento de herencia con firmas recientes, hallado en el despacho del farero."
  },
  "mateo-sofia": {
    texto: "Sofía dijo que estaba en casa, pero Mateo asegura haberla visto en el puerto cerca de medianoche.",
    pista: "Documento de herencia con firmas recientes, hallado en el despacho del farero."
  },
  "camila-ernesto": {
    texto: "Camila afirma que el guardia portuario conocía del contrabando, Ernesto lo niega.",
    pista: "Registro de barcos: Ernesto autorizó entrada de un navío sin inspección la noche del crimen."
  },
  "ernesto-camila": {
    texto: "Camila afirma que el guardia portuario conocía del contrabando, Ernesto lo niega.",
    pista: "Registro de barcos: Ernesto autorizó entrada de un navío sin inspección la noche del crimen."
  }
};

// --- Mostrar pistas y sospechosos ---
function mostrarPista(id) {
  document.getElementById("pistas").innerHTML = pistas[id];
}

function mostrarSospechoso(id) {
  document.getElementById("sospechosos").innerHTML = sospechosos[id];
}

// --- Confrontación ---
function confrontar() {
  const s1 = document.getElementById("conf1").value;
  const s2 = document.getElementById("conf2").value;
  const div = document.getElementById("confrontacion");

  if (!s1 || !s2 || s1 === s2) {
    div.innerHTML = "<p style='color:red;'>Debes elegir dos sospechosos distintos.</p>";
    return;
  }

  const key = `${s1}-${s2}`;
  if (contradicciones[key]) {
    div.innerHTML = `<p style='color:green;'><strong>Contradicción encontrada:</strong> ${contradicciones[key].texto}</p>`;
    desbloquearPista(contradicciones[key].pista);
  } else {
    div.innerHTML = "<p style='color:gray;'>No se detectaron contradicciones claras.</p>";
  }
}

// --- Desbloquear nueva pista secreta ---
function desbloquearPista(texto) {
  const divSecretas = document.getElementById("pistas-secretas");
  const p = document.createElement("p");
  p.innerHTML = `<strong>Pista secreta desbloqueada:</strong> ${texto}`;
  divSecretas.appendChild(p);
}

// --- Resolver ---
function resolverCaso() {
  const seleccion = document.getElementById("culpable").value;
  const resultadoDiv = document.getElementById("resultado");

  if (!seleccion) {
    resultadoDiv.innerHTML = "<p style='color:red;'>Debes seleccionar un sospechoso.</p>";
    return;
  }

  if (seleccion === "ernesto") {
    resultadoDiv.innerHTML = `
      <p style='color:green;'><strong>Correcto:</strong> 
      Ernesto Vega, el guardia portuario, es el asesino. 
      Tenía acceso, coartada débil y huellas en la escena. 
      Mató a Julián para silenciarlo sobre el contrabando en el faro.</p>`;
    marcarCasoResuelto("caso1");
  } else {
    resultadoDiv.innerHTML = "<p style='color:red;'><strong>Incorrecto:</strong> Ese sospechoso no es el culpable. Vuelve a analizar las pistas.</p>";
  }
}

// --- Guardar progreso ---
function marcarCasoResuelto(idCaso) {
  const progreso = JSON.parse(localStorage.getItem("progresoCasos")) || {};
  progreso[idCaso] = true;
  localStorage.setItem("progresoCasos", JSON.stringify(progreso));
}
