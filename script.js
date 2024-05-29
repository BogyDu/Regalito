const routine = {
    1: {
        day: "Día 1: Pecho y Tríceps",
        exercises: [
            { name: "Press de banca con barra", series: 4, reps: "8-12" },
            { name: "Press inclinado con mancuernas", series: 3, reps: "10-12" },
            { name: "Fondos en paralelas", series: 3, reps: "8-10" },
            { name: "Aperturas con mancuernas", series: 3, reps: 12 },
            { name: "Press francés con barra", series: 3, reps: "10-12" },
            { name: "Extensiones de tríceps con cable", series: 3, reps: 12 }
        ]
    },
    2: {
        day: "Día 2: Espalda y Bíceps",
        exercises: [
            { name: "Dominadas", series: 4, reps: "6-10" },
            { name: "Remo con barra", series: 3, reps: "8-12" },
            { name: "Remo con mancuernas a un brazo", series: 3, reps: "10-12" },
            { name: "Jalón al pecho", series: 3, reps: 12 },
            { name: "Curl con barra", series: 3, reps: "10-12" },
            { name: "Curl de bíceps con mancuernas alterno", series: 3, reps: 12 }
        ]
    },
    3: {
        day: "Día 3: Piernas y Abdomen",
        exercises: [
            { name: "Sentadillas", series: 4, reps: "8-12" },
            { name: "Prensa de pierna", series: 3, reps: "10-12" },
            { name: "Peso muerto rumano", series: 3, reps: "10-12" },
            { name: "Extensiones de cuádriceps", series: 3, reps: 12 },
            { name: "Curl de pierna", series: 3, reps: 12 },
            { name: "Elevación de talones (gemelos)", series: 4, reps: "15-20" },
            { name: "Crunch abdominal", series: 3, reps: 20 },
            { name: "Elevación de piernas", series: 3, reps: 15 }
        ]
    },
    4: {
        day: "Día 4: Hombros y Trapecios",
        exercises: [
            { name: "Press militar con barra", series: 4, reps: "8-12" },
            { name: "Elevaciones laterales", series: 3, reps: 12 },
            { name: "Elevaciones frontales", series: 3, reps: 12 },
            { name: "Pájaros (elevaciones posteriores)", series: 3, reps: 12 },
            { name: "Encogimientos de hombros con barra", series: 4, reps: 15 }
        ]
    }
};

let currentDay = new Date().getDay()-1; // 0 (domingo) a 6 (sábado)

// Ajusta el índice del día para que coincida con la rutina (1-4)
if (currentDay === 0 || currentDay === 6) currentDay = 1; // Descanso los domingos y sábados

function updateRoutine(day) {
    const routineDay = routine[day];
    document.getElementById("day-title").innerText = routineDay.day;
    const exercisesTable = document.getElementById("exercises");
    exercisesTable.innerHTML = "";

    routineDay.exercises.forEach((exercise, index) => {
        const sets = exercise.series;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${exercise.name}</td>
            <td>${exercise.series}</td>
            <td>${exercise.reps}</td>
            <td>
                ${[...Array(sets).keys()].map(i => `<input type="number" id="weight-${index}-${i+1}" data-exercise="${index}" class="weight-input" placeholder="Set ${i+1}">`).join('')}
            </td>
            <td>
                ${[...Array(sets).keys()].map(i => `<input type="number" id="reps-${index}-${i+1}" data-exercise="${index}" class="reps-input" placeholder="Set ${i+1}">`).join('')}
            </td>
        `;
        exercisesTable.appendChild(row);
    });

    // Cargar datos desde el localStorage
    const savedData = JSON.parse(localStorage.getItem(`day-${currentDay}-data`)) || [];
    savedData.forEach((data, index) => {
        data.weights.forEach((weight, i) => {
            document.getElementById(`weight-${index}-${i+1}`).value = weight || "";
            document.getElementById(`reps-${index}-${i+1}`).value = data.reps[i] || "";
        });
    });

    // Mostrar campos de entrada solo en el día actual
    document.querySelectorAll('.weight-input, .reps-input').forEach(input => {
        input.disabled = !(day === getDayIndex(new Date()));
    });
}

function saveData() {
    const data = [];
    document.querySelectorAll('.weight-input').forEach(input => {
        const index = input.getAttribute('data-exercise');
        const setIndex = parseInt(input.id.split('-')[2], 10) - 1;
        const weight = input.value;
        if (!data[index]) {
            data[index] = { weights: [], reps: [] };
        }
        data[index].weights[setIndex] = weight;
        const repsInput = document.getElementById(`reps-${index}-${setIndex + 1}`);
        data[index].reps[setIndex] = repsInput ? repsInput.value : "";
    });
    localStorage.setItem(`day-${currentDay}-data`, JSON.stringify(data));
    alert("Datos guardados");
}

function getDayIndex(date) {
    const day = date.getDay();
    return (day === 0 || day === 6) ? 1 : day; // Ajuste para días de descanso
}

document.getElementById("prev").addEventListener("click", () => {
    currentDay = currentDay > 1 ? currentDay - 1 : 4;
    updateRoutine(currentDay);
});

document.getElementById("next").addEventListener("click", () => {
    currentDay = currentDay < 4 ? currentDay + 1 : 1;
    updateRoutine(currentDay);
});

document.getElementById("save").addEventListener("click", saveData);

// Inicializa la rutina con el día actual
updateRoutine(currentDay);