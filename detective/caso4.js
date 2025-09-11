window.casoActual = "caso4";

const pistas = {
  "Billete rasgado":"Billete encontrado con manchas de sangre.",
  "Maleta abierta":"Maleta con cerradura forzada.",
  "Carta anónima":"Carta indicando que habría un robo durante el viaje."
};

const sospechosos = {
  "Pasajero1":"Viajaba solo y parece nervioso.",
  "Pasajero2":"Grupo de turistas.",
  "Conductor":"Encargado del tren.",
  "Inspector":"Viajaba en el tren para revisar seguridad.",
  "Camarera":"Personal de servicio del tren."
};

const respuestas = {
  "Pasajero1":{
    "¿Qué estabas haciendo en el tren?":"Leyendo, no presté atención a nada.",
    "¿Viste algo extraño?":"Vi a alguien cerca del vagón de carga."
  },
  "Pasajero2":{
    "¿Dónde estabais todos?":"Nos sentamos juntos en el vagón principal.",
    "¿Alguien se comportó raro?":"Pasajero1 parecía inquieto."
  },
  "Conductor":{
    "¿Controlaste el tren durante la noche?":"Sí, todo parecía normal.",
    "¿Alguien subió sin permiso?":"No que yo haya visto."
  },
  "Inspector":{
    "¿Qué inspeccionaste?":"Revisé seguridad y compartimentos.",
    "¿Alguna irregularidad?":"Vi la maleta abierta con cierre forzado."
  },
  "Camarera":{
    "¿Qué observaste?":"Algunos pasajeros parecían nerviosos.",
    "¿Alguien pidió algo extraño?":"Alguien dejó una carta en mi bandeja."
  }
};

const culpableReal = "Pasajero1";

const contradicciones = {
  "Pasajero1-Pasajero2":{
    texto:"Pasajero1 estaba solo, pero Pasajero2 dice que lo vio cerca del vagón de carga.",
    pista:"Informe del Compartimento",
    sospechosoDesbloqueado:{
      id:"AgenteSecreto",
      descripcion:"Agente que viaja encubierto investigando el tren",
      respuestas:{
        "¿Qué detectaste?":"Se confirma que Pasajero1 abrió la maleta.",
        "¿Alguien más estuvo involucrado?":"Pasajero2 tenía información pero no actuó."
      }
    }
  },
  "Conductor-Camarera":{
    texto:"El conductor dice que nadie subió sin permiso, la camarera notó la carta anónima.",
    pista:"Registro de vigilancia"
  }
};

const pistasSecretasDescripcion = {
  "Informe del Compartimento":"Confirma movimientos sospechosos de Pasajero1.",
  "Registro de vigilancia":"Muestra que alguien abrió la maleta sin autorización."
};

for(const key in pistasSecretasDescripcion){
  if(!localStorage.getItem(`desc-${window.casoActual}-${key}`)){
    localStorage.setItem(`desc-${window.casoActual}-${key}`, pistasSecretasDescripcion[key]);
  }
}
