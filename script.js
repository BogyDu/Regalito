document.getElementById('submit-btn').addEventListener('click', function() {
    const selector = document.getElementById('routine-selector');
    const selectedValue = selector.value;
    const routineInfo = document.getElementById('routine-info');
    const tableContainer = document.getElementById('table-container');

    let routineName = '';
    let exercises = [];

    switch(selectedValue) {
        case 'brazo-hombro':
            routineName = 'Brazo y Hombro';
            exercises = [
                'Laterales mancuernas', 
                'Press maquina', 
                'Extension triceps barra Z', 
                'Lateral cable'
            ];
            break;
        case 'brazo-abs':
            routineName = 'Brazo y Abs';
            exercises = [
                'Patarriba', 
                'Gamba', 
                'Remo T', 
                'Jalon pecho cerrado', 
                'Remo polea', 
                'Facepull'
            ];
            break;
        case 'cuadriceps':
            routineName = 'Cuadriceps';
            exercises = [
                'Abductores', 
                'Hip', 
                'Prensa', 
                'Bulgara multi', 
                'Patada culo'
            ];
            break;
        case 'femoral':
            routineName = 'Femoral';
            exercises = [
                'Curl tumbado', 
                'Hip', 
                'Peso rumano', 
                'Patada culo', 
                'Abductor'
            ];
            break;
        default:
            routineName = '';
    }

    routineInfo.innerText = `Has seleccionado la rutina de ${routineName}.`;
    createTable(exercises);
});

function createTable(exercises) {
    const tableContainer = document.getElementById('table-container');
    tableContainer.innerHTML = '';  // Clear previous table if any

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const headerRow = document.createElement('tr');
    const headers = ['Nombre ejercicio', 'Serie 1', 'Serie 2', 'Serie 3'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.innerText = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    exercises.forEach(exercise => {
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.innerText = exercise;
        row.appendChild(nameCell);

        for (let i = 0; i < 3; i++) {
            const cell = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.dataset.exercise = exercise;
            input.dataset.series = `serie${i + 1}`;
            input.addEventListener('blur', saveData);
            cell.appendChild(input);
            row.appendChild(cell);
        }
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    loadData(exercises);
}

function saveData(event) {
    const input = event.target;
    const exercise = input.dataset.exercise;
    const series = input.dataset.series;
    const value = input.value;

    let data = JSON.parse(localStorage.getItem('routineData')) || {};
    if (!data[exercise]) {
        data[exercise] = {};
    }
    data[exercise][series] = value;

    localStorage.setItem('routineData', JSON.stringify(data));
}

function loadData(exercises) {
    let data = JSON.parse(localStorage.getItem('routineData')) || {};

    exercises.forEach(exercise => {
        for (let i = 0; i < 3; i++) {
            const series = `serie${i + 1}`;
            const input = document.querySelector(`input[data-exercise="${exercise}"][data-series="${series}"]`);
            if (data[exercise] && data[exercise][series]) {
                input.value = data[exercise][series];
            }
        }
    });
}