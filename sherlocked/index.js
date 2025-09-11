// Lista de casos disponibles
const casos = [
  {
    id: "caso1",
    titulo: "Caso 1: El Asesinato de Arturo Salcedo",
    archivo: "caso1.html"
  }
];

// Cargar estado de progreso desde localStorage
function cargarProgreso() {
  return JSON.parse(localStorage.getItem("progresoCasos")) || {};
}

// Guardar progreso en localStorage
function guardarProgreso(progreso) {
  localStorage.setItem("progresoCasos", JSON.stringify(progreso));
}

// Mostrar lista de casos
function mostrarCasos() {
  const lista = document.getElementById("casos-lista");
  lista.innerHTML = "";

  const progreso = cargarProgreso();

  casos.forEach(caso => {
    const li = document.createElement("li");

    const link = document.createElement("a");
    link.href = caso.archivo;
    link.textContent = caso.titulo;

    const estado = document.createElement("span");
    estado.textContent = progreso[caso.id] ? " ✅ Resuelto" : " ⏳ Pendiente";
    estado.className = progreso[caso.id] ? "resuelto" : "pendiente";

    li.appendChild(link);
    li.appendChild(estado);
    lista.appendChild(li);
  });
}

mostrarCasos();