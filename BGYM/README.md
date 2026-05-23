# FitCore — Plan de Fuerza & Nutrición

App web progresiva para seguimiento de entrenamiento de fuerza y nutrición.
Diseñada para guardarse como app en iOS (Safari → "Añadir a pantalla de inicio").

## Archivos del proyecto

```
fitcore/
├── index.html        ← Punto de entrada principal
├── styles.css        ← Sistema de diseño completo (responsive + iOS)
├── data.js           ← Todos los datos: ejercicios, dieta, suplementos
├── store.js          ← Gestión de estado y localStorage
├── app.js            ← Lógica de la aplicación
└── README.md         ← Este archivo
```

## Despliegue en GitHub Pages

1. Crea un repositorio en GitHub (ej: `fitcore`)
2. Sube todos los archivos a la raíz del repositorio
3. Ve a **Settings → Pages → Source → main branch / root**
4. Tu app estará en: `https://tu-usuario.github.io/fitcore/`

## Añadir a pantalla de inicio en iOS

1. Abre la URL en Safari en tu iPhone/iPad
2. Toca el botón de compartir (cuadrado con flecha)
3. Selecciona **"Añadir a pantalla de inicio"**
4. La app se comportará como una app nativa

## Características

- ✅ **Dashboard** con estadísticas, progreso y semana actual
- ✅ **Entreno** con selector de tipo de día (Push / Pull / Core / Fútbol / Descanso)
- ✅ **Combinar grupos musculares** (Pecho + Core, etc.)
- ✅ **Imágenes GIF** de cada ejercicio con técnica explicada
- ✅ **Checklist de series** con input de peso y repeticiones
- ✅ **Días de fútbol** sin gimnasio, con checklist propio
- ✅ **Dieta** con 7 días, 4 comidas/día y 3 opciones por comida
- ✅ **Suplementos** con dosis y explicación
- ✅ **Registro** persistente en localStorage (peso, gym, fútbol, comida)
- ✅ **Gráfica de evolución** de peso
- ✅ **Full responsive** — funciona en móvil, tablet y escritorio
- ✅ **iOS PWA ready** — menú nativo bottom tab en móvil

## Técnico

- Sin dependencias externas (excepto Google Fonts y Chart.js via CDN)
- Todo el estado se guarda en localStorage
- Compatible con iOS Safari como PWA
- Imágenes de ejercicios: muscles.wiki (CDN público)
