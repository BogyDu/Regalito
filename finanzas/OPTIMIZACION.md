
Análisis del archivo original:
- HTML monolítico (~56848 caracteres).
- CSS y JS incrustados en un único archivo.
- Firebase cargado directamente desde CDN.
- Lógica de UI, estado y persistencia mezcladas.

Recomendaciones:
1. Separar CSS, JS y HTML.
2. Crear módulos: auth.js, firebase.js, budgets.js, transactions.js, ui.js.
3. Añadir Service Worker para caché offline.
4. Añadir manifest.json para instalación PWA.
5. Lazy loading de páginas.
6. Debounce centralizado para guardados.
7. Sustituir manipulación DOM repetitiva por componentes reutilizables.
8. Configuración Firebase mediante variables de entorno.
