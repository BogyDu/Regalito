let score = 0;
let dart = document.getElementById('dart');
let isDragging = false;
let startX, startY;

dart.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    dart.style.position = 'absolute';
    dart.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        let dx = e.clientX - startX;
        let dy = e.clientY - startY;
        dart.style.transform = `translate(${dx}px, ${dy}px)`;
    }
});

document.addEventListener('mouseup', (e) => {
    if (isDragging) {
        isDragging = false;
        dart.style.cursor = 'grab';
        dart.style.transition = 'transform 0.5s ease-out';
        
        // Simula el lanzamiento
        let dx = e.clientX - startX;
        let dy = e.clientY - startY;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx);
        let velocity = distance / 10; // Ajusta la velocidad según tus necesidades

        dart.style.transform = `translate(${dx + Math.cos(angle) * velocity}px, ${dy + Math.sin(angle) * velocity}px)`;

        // Restablece la posición del dardo después de lanzarlo
        setTimeout(() => {
            dart.style.transition = 'none';
            dart.style.transform = 'none';
            dart.style.position = 'static';
        }, 500);

        // Calcula la puntuación basada en la posición de aterrizaje
        let hit = Math.floor(Math.random() * 60) + 1; // Simulación básica de puntuación
        score += hit;
        document.getElementById('score').innerText = `Puntuación: ${score}`;
    }
});
