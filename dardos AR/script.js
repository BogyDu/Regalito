// Configuración de AR.js
AFRAME.registerComponent('dart-game', {
    schema: {
        marker: { type: 'string' },
        dartboard: { type: 'string' }
    },
    init: function() {
        this.marker = document.getElementById(this.data.marker);
        this.dartboard = document.getElementById(this.data.dartboard);
        this.threeScene = new THREE.Scene();
        this.threeCamera = new THREE.Camera();
        this.threeRenderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('ar-container'),
            antialias: true
        });
        this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
        this.threeScene.add(this.threeCamera);
        this.createDartboard();
        this.createDarts();
    },
    createDartboard: function() {
        // Crea el modelo 3D del tablero de dardos
        const dartboardGeometry = new THREE.CircleGeometry(150, 32);
        const dartboardMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.dartboardMesh = new THREE.Mesh(dartboardGeometry, dartboardMaterial);
        this.threeScene.add(this.dartboardMesh);
    },
    createDarts: function() {
        // Crea los dardos virtuales
        this.darts = [];
        for (let i = 0; i < 3; i++) {
            const dartGeometry = new THREE.SphereGeometry(10, 32, 32);
            const dartMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const dartMesh = new THREE.Mesh(dartGeometry, dartMaterial);
            dartMesh.position.set(0, 0, -100);
            this.threeScene.add(dartMesh);
            this.darts.push(dartMesh);
        }
    },
    tick: function() {
        // Actualiza la posición de los dardos según la cámara
        const cameraPosition = this.threeCamera.position;
        for (let i = 0; i < this.darts.length; i++) {
            const dart = this.darts[i];
            dart.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z - 100);
        }
    },
    shoot: function() {
        // Lanza un dardo virtual cuando el usuario toca la pantalla
        const dart = this.darts.pop();
        if (dart) {
            dart.position.set(this.threeCamera.position.x, this.threeCamera.position.y, this.threeCamera.position.z - 100);
            this.threeScene.add(dart);
        }
    }
});

// Inicializa el juego
const dartGame = document.getElementById('ar-container');
dartGame.setAttribute('dart-game', '');
dartGame.components.dartGame.init();

// Agrega un listener para detectar cuando el usuario toca la pantalla
document.addEventListener('touchstart', function() {
    dartGame.components.dartGame.shoot();
});