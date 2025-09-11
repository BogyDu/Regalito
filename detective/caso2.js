window.casoActual = "caso2";

const pistas = {
  "Huella en vitrina":"Se detectó una huella en la vitrina de la sala principal.",
  "Cámara de seguridad":"El video muestra movimientos extraños a las 21:00.",
  "Luz apagada":"Algunos sensores indican que la luz principal fue apagada."
};

const sospechosos = {
  "Diego":"Guardia del museo, conoce los horarios y accesos.",
  "Marcos":"Visitante frecuente, interesado en obras antiguas.",
  "Ana":"Conservadora de arte, responsable de las salas.",
  "Laura":"Investigadora externa invitada.",
  "Roberto":"Técnico de iluminación."
};

const respuestas = {
  "Diego":{
    "¿Qué hacías esa noche?":"Estaba haciendo la ronda habitual.",
    "¿Viste algo raro?":"Sí, noté que una vitrina estaba abierta momentáneamente."
  },
  "Marcos":{
    "¿Estabas en la sala principal a las 21:00?":"Sí, pero no vi nada sospechoso.",
    "¿Alguien más estaba allí?":"Solo Diego y Ana."
  },
  "Ana":{
    "¿Viste algo extraño?":"La luz principal se apagó unos segundos.",
    "¿Alguien manipuló obras?":"No, todo parecía correcto."
  },
  "Laura":{
    "¿Cuál era tu propósito en el museo?":"Investigar artefactos antiguos.",
    "¿Viste algo sospechoso?":"No directamente."
  },
  "Roberto":{
    "¿Encendiste o apagaste las luces?":"Apagué por mantenimiento, pero solo temporalmente.",
    "¿Viste algún movimiento extraño?":"Vi a Marcos cerca de una vitrina."
  }
};

const culpableReal = "Marcos";

const contradicciones = {
  "Diego-Marcos":{
    texto:"Diego vio a Marcos cerca de la vitrina, pero Marcos dice que no hizo nada.",
    pista:"Informe de CCTV",
    sospechosoDesbloqueado:{
      id:"Sergio",
      descripcion:"Inspector forense que llega tras el informe de CCTV",
      respuestas:{
        "¿Qué revelan las grabaciones?":"Se ve que Marcos manipuló la vitrina.",
        "¿Hay evidencia física?":"Sí, huellas parciales en la vitrina."
      }
    }
  },
  "Ana-Roberto":{
    texto:"Ana afirma que nadie manipuló las obras, pero Roberto indica movimientos inusuales.",
    pista:"Registro de guardias"
  }
};

const pistasSecretasDescripcion = {
  "Informe de CCTV":"El informe revela que Marcos manipuló una vitrina a las 21:00.",
  "Registro de guardias":"El registro muestra inconsistencias en los horarios de los guardias."
};

// Inicializar pistas secretas
for(const key in pistasSecretasDescripcion){
  if(!localStorage.getItem(`desc-${window.casoActual}-${key}`)){
    localStorage.setItem(`desc-${window.casoActual}-${key}`, pistasSecretasDescripcion[key]);
  }
}
