window.casoActual = "caso1";

// Pistas iniciales del caso
const pistas = {
  "Huella en la ventana": "Se encontró una huella parcial en la ventana norte del faro.",
  "Llave del faro": "Una llave antigua fue hallada en la caja fuerte del faro.",
  "Zapato roto": "Un zapato con suela rota fue encontrado cerca de la escena del crimen."
};

// Sospechosos
const sospechosos = {
  "Sofia": "Vecina del faro, conoce a todos los trabajadores.",
  "Mateo": "Ayudante del farero, tenía acceso a todas las áreas.",
  "Clara": "Fotógrafa que estaba en el lugar por un encargo.",
  "Javier": "Historiador que investigaba el faro.",
  "Lucas": "Guarda del faro, entrada restringida."
};

// Respuestas a interrogatorios
const respuestas = {
  "Sofia": {
    "¿Qué viste la noche del crimen?": "Vi a Mateo salir del faro a las 10 pm.",
    "¿Conoces a los demás sospechosos?": "Sí, los he visto varias veces en el faro."
  },
  "Mateo": {
    "¿Dónde estabas a las 10 pm?": "Estaba con Clara… pero el diario del faro muestra que eso no coincide.",
    "¿Ves a alguien sospechoso?": "No puedo decir, todos parecen normales."
  },
  "Clara": {
    "¿Qué estabas haciendo en el faro?": "Tomando fotos de la torre.",
    "¿Viste algo extraño?": "No, todo parecía tranquilo."
  },
  "Javier": {
    "¿Cuál era tu propósito en el faro?": "Investigar la historia del faro.",
    "¿Alguien más estaba allí?": "Sí, vi a Mateo y Lucas."
  },
  "Lucas": {
    "¿Guardabas el faro esa noche?": "Sí, estuve revisando cada hora.",
    "¿Alguien entró sin permiso?": "No estoy seguro, pero la puerta estaba cerrada."
  }
};

// Culpable real
const culpableReal = "Mateo";

// Contradicciones que desbloquean pistas secretas
const contradicciones = {
  "Sofia-Mateo": {
    texto: "Sofía dice que vio a Mateo salir del faro a las 10 pm, pero Mateo afirma que estaba con Clara.",
    pista: "Documento Secreto: Diario del Faro"
  },
  "Javier-Lucas": {
    texto: "Javier vio a Lucas cerca de la torre, pero Lucas dice que estaba en la entrada.",
    pista: "Carta del Historiador"
  }
};

// Funciones de caso generico (se asume que se importa caso-generico.js)
// mostrarPista(id), mostrarSospechoso(id), interrogar(), confrontar(), resolverCaso(), inicializarCaso()

// Guardar pistas secretas con descripción completa
const pistasSecretasDescripcion = {
  "Documento Secreto: Diario del Faro": "El diario revela que Mateo estuvo en el faro a las 10 pm y que hay inconsistencias en su coartada.",
  "Carta del Historiador": "La carta indica que alguien manipuló las luces del faro antes del asesinato."
};

// Inicializar caso y agregar pistas secretas a localStorage si no existen
for(const key in pistasSecretasDescripcion){
  if(!localStorage.getItem(`desc-${window.casoActual}-${key}`)){
    localStorage.setItem(`desc-${window.casoActual}-${key}`, pistasSecretasDescripcion[key]);
  }
}
