window.casoActual = "caso3";

const pistas = {
  "Carta rota":"Una carta rota encontrada en el despacho.",
  "Cenicero con huella":"Se detectó huella parcial en un cenicero de la sala.",
  "Llave de la biblioteca":"Llave antigua encontrada en el pasillo principal."
};

const sospechosos = {
  "Dueño":"Propietario de la mansión.",
  "Jardinero":"Encargado del jardín y exteriores.",
  "Mayordomo":"Conoce todos los accesos internos.",
  "Invitado":"Persona que asistió a la cena.",
  "Ama de llaves":"Encargada de las habitaciones."
};

const respuestas = {
  "Dueño":{
    "¿Dónde estabas a las 22:00?":"Revisaba documentos en mi despacho.",
    "¿Alguien más estaba cerca de la biblioteca?":"No, nadie debería estar allí."
  },
  "Jardinero":{
    "¿Qué estabas haciendo a esa hora?":"Cuidando el jardín, revisando luces.",
    "¿Viste movimientos extraños?":"Vi al invitado salir de la biblioteca."
  },
  "Mayordomo":{
    "¿Controlaste accesos?":"Sí, todo estaba bajo control.",
    "¿Alguien rompió reglas?":"No noté nada fuera de lo común."
  },
  "Invitado":{
    "¿Qué hacías a las 22:00?":"Explorando la mansión por curiosidad.",
    "¿Viste algo sospechoso?":"El mayordomo parecía nervioso."
  },
  "Ama de llaves":{
    "¿Quién tenía acceso a la biblioteca?":"Solo el dueño y yo.",
    "¿Observaste algo extraño?":"La carta rota indica que alguien estuvo revisando documentos."
  }
};

const culpableReal = "Invitado";

const contradicciones = {
  "Dueño-Invitado":{
    texto:"El dueño dice que nadie debería estar en la biblioteca, pero el invitado admitió estar allí.",
    pista:"Diario de la Mansión",
    sospechosoDesbloqueado:{
      id:"Inspector",
      descripcion:"Inspector privado contratado por el dueño",
      respuestas:{
        "¿Qué revela la investigación?":"El invitado manipuló documentos importantes.",
        "¿Hay huellas?":"Sí, en el escritorio y cenicero."
      }
    }
  },
  "Jardinero-Mayordomo":{
    texto:"Jardinero vio al invitado, pero mayordomo dice que nadie debía estar allí.",
    pista:"Cámara secreta"
  }
};

const pistasSecretasDescripcion = {
  "Diario de la Mansión":"Registra la entrada del invitado a la biblioteca y sus acciones.",
  "Cámara secreta":"Revela movimientos de los sospechosos en pasillos internos."
};

for(const key in pistasSecretasDescripcion){
  if(!localStorage.getItem(`desc-${window.casoActual}-${key}`)){
    localStorage.setItem(`desc-${window.casoActual}-${key}`, pistasSecretasDescripcion[key]);
  }
}
