// SweetAlert2 CDN loader
(function(){
  function loadScript(src, onload) {
    var script = document.createElement('script');
    script.src = src;
    script.onload = onload;
    document.head.appendChild(script);
  }
  if (!window.Swal) {
    // Intenta cargar local primero
    loadScript('js/sweetalert.js', function() {
      if (!window.Swal) {
        // Si falla, intenta CDN
        loadScript('https://cdn.jsdelivr.net/npm/sweetalert2@11', function() {
          window.sweetalertLoaded = true;
        });
      } else {
        window.sweetalertLoaded = true;
      }
    });
  }
})();
