let score = 0;
let dart = document.getElementById('dart');
let isDragging = false;
let startX, startY;

function preventDefault(e) {
    e.preventDefault();
}

dart.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    dart.style.position = 'absolute';
    dart.style.cursor = 'grabbing';
    document.addEventListener('touchmove', preventDefault, { passive: false });
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', onStopDrag);
});

dart.addEventListener('touchstart', (e) => {
    isDragging = true;
    let touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    dart.style.position = 'absolute';
    dart.style.cursor = 'grabbing';
    document.addEventListener('touchmove', onDrag);
    document.addEventListener('touchend', onStopDrag);
});

function onDrag(e) {
    if (isDragging) {
        let clientX = e.clientX || e.touches[0].clientX;
        let clientY = e.clientY || e.touches[0].clientY;
        let dx = clientX - startX;
        let dy = clientY - startY;
        dart.style.transform = `translate(${dx}px, ${dy}px)`;
    }
}

function onStopDrag(e) {
    if (isDragging) {
        isDragging = false;
        dart.style.cursor = 'grab';
        dart.style.transition = 'transform 0.5s ease-out';
        
        let clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
        let clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);
        let dx = clientX - startX;
        let dy = clientY - startY;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx);
        let velocity = distance / 10;

        dart.style.transform = `translate(${dx + Math.cos(angle) * velocity}px, ${dy + Math.sin(angle) * velocity}px)`;

        setTimeout(() => {
            dart.style.transition = 'none';
            dart.style.transform = 'none';
            dart.style.position = 'static';
        }, 500);

        let hit = Math.floor(Math.random() * 60) + 1;
        score += hit;
        document.getElementById('score').innerText = `Puntuación: ${score}`;
        
        document.removeEventListener('touchmove', preventDefault, { passive: false });
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', onStopDrag);
        document.removeEventListener('touchmove', onDrag);
        document.removeEventListener('touchend', onStopDrag);
    }
}
