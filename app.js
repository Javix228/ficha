(function () {
  "use strict";

  //PROTECCIÓN DE TECLADO Y EVENTOS 
  document.addEventListener("keydown", function (e) {
    //Bloquear Ctrl+S (Guardar), Ctrl+U (Ver código fuente), Ctrl+P (Imprimir), F12
    if (
      (e.ctrlKey &&
        (e.key === "s" ||
          e.key === "S" ||
          e.key === "u" ||
          e.key === "U" ||
          e.key === "p" ||
          e.key === "P")) ||
      e.key === "F12"
    ) {
      e.preventDefault();
      return false;
    }
  });

  //VALIDACIÓN DEL PARÁMETRO ?id= DEL QR
  const params = new URLSearchParams(window.location.search);
  const idRaw = params.get("id");

  const vistaCarga = document.getElementById("vista-carga");
  const vistaBloqueo = document.getElementById("vista-bloqueo");
  const vistaFicha = document.getElementById("vista-ficha");

  function mostrarBloqueo() {
    vistaCarga.classList.add("oculto");
    vistaFicha.classList.add("oculto");
    vistaBloqueo.classList.remove("oculto");
  }

  const regexIdSeguro = /^[a-z0-9_-]{3,60}$/i;
  if (!idRaw || !regexIdSeguro.test(idRaw)) {
    mostrarBloqueo();
    return;
  }

  const idLimpio = idRaw.toLowerCase();

  //DIBUJAR LA FOTOGRAFÍA EN EL <CANVAS> CON MARCA DE AGUA SUTIL
  function renderizarFotoProtegida(urlImagen) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = function () {
        const canvas = document.getElementById("lienzo-foto");
        const ctx = canvas.getContext("2d");

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        ctx.drawImage(img, 0, 0);
        const fontSize = Math.max(16, Math.round(canvas.width * 0.018));
        ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
        const textoMarca = "© @javixcortesph_";
        const padding = Math.round(fontSize * 0.8);

        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        const anchoTexto = ctx.measureText(textoMarca).width;
        ctx.fillRect(
          canvas.width - anchoTexto - padding * 2,
          canvas.height - fontSize - padding * 1.6,
          anchoTexto + padding * 1.4,
          fontSize + padding,
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.fillText(
          textoMarca,
          canvas.width - anchoTexto - padding * 1.3,
          canvas.height - padding * 0.9,
        );

        resolve();
      };

      img.onerror = function () {
        reject(new Error("No se pudo cargar la imagen."));
      };

      img.src = urlImagen;
    });
  }

  //CONFIGURAR EL REPRODUCTOR DE SONIDO
  function configurarAudioAve(urlAudio) {
  const bloqueAudio = document.getElementById("bloque-audio");
  const btnAudio = document.getElementById("btn-audio");
  const reproductor = document.getElementById("reproductor-mp3");
  const iconoAudio = document.getElementById("icono-audio");
  const estadoAudio = document.getElementById("estado-audio");
  const ondas = document.getElementById("ondas-audio");

  if (!urlAudio) {
    bloqueAudio.classList.add("oculto");
    return;
  }

  reproductor.src = urlAudio;
  bloqueAudio.classList.remove("oculto");

  function actualizarEstado(reproduciendo) {
    iconoAudio.textContent = reproduciendo ? "Ⅱ" : "▶";

    estadoAudio.textContent = reproduciendo
      ? "Reproduciendo canto..."
      : "Escuchar canto del ave";

    ondas.classList.toggle("oculto", !reproduciendo);

    btnAudio.setAttribute(
      "aria-label",
      reproduciendo ? "Pausar canto del ave" : "Reproducir canto del ave"
    );
  }

  btnAudio.addEventListener("click", function () {
    if (reproductor.paused) {
      reproductor.play().catch(() => {
        estadoAudio.textContent = "Audio no disponible";
        iconoAudio.textContent = "▶";
        ondas.classList.add("oculto");
      });
    } else {
      reproductor.pause();
    }
  });

  reproductor.addEventListener("play", function () {
    actualizarEstado(true);
  });

  reproductor.addEventListener("pause", function () {
    actualizarEstado(false);
  });

  reproductor.addEventListener("ended", function () {
    actualizarEstado(false);
  });

  actualizarEstado(false);
}

  //CARGAR ÚNICAMENTE EL ARCHIVO JSON DE ESA FOTO DE FORMA AISLADA
  fetch(`datos/${idLimpio}.json`, { cache: "no-store" })
    .then((respuesta) => {
      if (!respuesta.ok) {
        throw new Error("Ficha no encontrada");
      }
      return respuesta.json();
    })
    .then(async (ficha) => {
      document.getElementById("txt-titulo").textContent =
        ficha.titulo || "Sin título";
      document.getElementById("txt-lugar").textContent =
        ficha.lugar || "Curacautín, La Araucanía";
      document.getElementById("txt-fecha").textContent = ficha.fecha || "-";
      document.getElementById("txt-descripcion").textContent =
        ficha.descripcion || "";

      const exif = ficha.exif || {};
      document.getElementById("exif-velocidad").textContent =
        exif.velocidad || "-";
      document.getElementById("exif-apertura").textContent =
        exif.apertura || "-";
      document.getElementById("exif-iso").textContent = exif.iso || "-";
      document.getElementById("exif-focal").textContent = exif.focal || "-";
      document.getElementById("exif-equipo").textContent = exif.equipo
        ? `Equipo: ${exif.equipo}`
        : "";

      // Diferenciar automáticamente entre AVE y PAISAJE
    const txtCientifico = document.getElementById("txt-cientifico");
    const tituloDescripcion = document.getElementById("titulo-descripcion");

    if (ficha.tipo === "ave") {
      tituloDescripcion.textContent = "Sobre esta especie";
      if (ficha.nombre_cientifico) {
        txtCientifico.textContent = ficha.nombre_cientifico;
        txtCientifico.classList.remove("oculto");
      }
      configurarAudioAve(ficha.audio);
    } else {
      tituloDescripcion.textContent = "Sobre este lugar";
      txtCientifico.classList.add("oculto");
      document.getElementById("bloque-audio").classList.add("oculto");
    }
      
      await renderizarFotoProtegida(ficha.imagen);
      vistaCarga.classList.add("oculto");
      vistaFicha.classList.remove("oculto");
    })
    .catch(() => {
      mostrarBloqueo();
    });
})();