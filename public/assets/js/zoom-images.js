/**
 * Sistema de Zoom de Imágenes con Copia Flotante
 * 
 * Este archivo maneja el zoom de imágenes creando una copia flotante
 * que se posiciona sobre la imagen original sin afectar el layout.
 */

// Variable para almacenar la copia del medio (imagen o video)
let zoomedImageClone = null;
// Referencia al elemento original y bucle de seguimiento
let zoomedOriginalEl = null;
let zoomFollowRafId = null;
let zoomFollowListenersAttached = false;

/**
 * Inicializa el sistema de zoom
 * Se ejecuta cuando el DOM está completamente cargado
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeZoomSystem();
});

/**
 * Inicializa el sistema de zoom
 * Configura los event listeners para las imágenes
 */
function initializeZoomSystem() {
//     console.log('Inicializando sistema de zoom de imágenes...');
    
    // Agregar estilos CSS para la imagen zoomed
    addZoomStyles();
}

/**
 * Maneja el click en las imágenes
 * Crea o remueve la copia flotante de la imagen
 */
document.addEventListener('click', function (e) {
    var target = e.target;
    
//     console.log('Click detectado en:', target.tagName);
    
    // Si hay una imagen zoomed activa, cerrarla al hacer click en cualquier lugar
    if (zoomedImageClone) {
        // console.log('Click con imagen zoomed activa, cerrando...');
        e.stopPropagation();
        removeZoomedImage();
        // Remover clase de la imagen original
        const originalZoomed = document.querySelector('.column img.zoomed, .column video.zoomed');
        if (originalZoomed) {
            originalZoomed.classList.remove('zoomed');
        }
        return;
    }
    
    // Solo procesar imágenes o videos en columnas y en desktop
    if (target && (target.tagName === 'IMG' || target.tagName === 'VIDEO') &&
        target.closest('.column') &&
        window.innerWidth > 768) {
        
        // console.log('Imagen clickeada, procesando zoom...');
        e.stopPropagation();
        
        if (target.classList.contains('zoomed')) {
            // Remover zoom
        //     console.log('Removiendo zoom...');
            removeZoomedImage();
            target.classList.remove('zoomed');
        } else {
            // Agregar zoom
        //     console.log('Agregando zoom...');
            createZoomedImage(target);
            target.classList.add('zoomed');
        }
    }
});

/**
 * Crea una copia flotante de la imagen
 * @param {HTMLElement} originalImage - Imagen original
 */
function createZoomedImage(originalImage) {
    // Remover cualquier imagen zoomed existente
    removeZoomedImage();
    
    // Limpiar todas las clases zoomed de todas las imágenes
    const allZoomedImages = document.querySelectorAll('.column img.zoomed, .column video.zoomed');
    allZoomedImages.forEach(img => img.classList.remove('zoomed'));
    
    // Obtener coordenadas del elemento respecto a la ventana
    const rect = originalImage.getBoundingClientRect();
    
    // Crear copia de la imagen
    zoomedImageClone = originalImage.cloneNode(true);
    zoomedImageClone.classList.add('zoomed-clone');
    // Guardar referencia al original para seguimiento
    zoomedOriginalEl = originalImage;
    
    // Si es video, asegurarnos de que no reproduzca sonido ni interfiera
    if (originalImage.tagName === 'VIDEO') {
        try {
            // Sin controles, muteado y pausado para mostrar el frame actual
            zoomedImageClone.controls = false;
            zoomedImageClone.muted = true;
            // Intentar sincronizar el frame mostrado y mantener reproducción
            zoomedImageClone.currentTime = originalImage.currentTime || 0;
            const playPromise = zoomedImageClone.play();
            if (playPromise && typeof playPromise.then === 'function') {
                playPromise.catch(() => {
                    // Algunos navegadores bloquean autoplay; si falla, al menos queda en el frame actual
                });
            }
        } catch (e) {
            // Silencioso si el navegador no permite ajustar currentTime inmediatamente
        }
    }
    
    // Configurar estilos de la copia como fija a la ventana
    zoomedImageClone.style.position = 'fixed';
    zoomedImageClone.style.left = rect.left + 'px';
    zoomedImageClone.style.top = rect.top + 'px';
    zoomedImageClone.style.width = rect.width + 'px';
    zoomedImageClone.style.height = rect.height + 'px';
    zoomedImageClone.style.zIndex = '1000';
    zoomedImageClone.style.cursor = 'pointer';
    zoomedImageClone.style.transition = 'all 0.2s ease';
    zoomedImageClone.style.pointerEvents = 'none'; // No bloquear eventos
    
    // Agregar al body para que quede fija y no dependa del scroll de la columna
    document.body.appendChild(zoomedImageClone);
    
    // Animar el zoom después de un pequeño delay
    setTimeout(() => {
        if (zoomedImageClone) {
            const scale = 1.5;
            const newWidth = rect.width * scale;
            const newHeight = rect.height * scale;
            // Persistir tamaño objetivo para recalcular posición al scrollear
            zoomedImageClone.dataset.zoomWidth = String(newWidth);
            zoomedImageClone.dataset.zoomHeight = String(newHeight);
            updateZoomedClonePosition();
            startZoomFollowLoop();
            // Quitar transición tras la animación inicial para que siga sin lag
            setTimeout(() => {
                if (zoomedImageClone) {
                    zoomedImageClone.style.transition = 'none';
                }
            }, 220);
            // Adjuntar listeners de scroll/resize para actualización inmediata
            attachZoomFollowListeners();
        }
    }, 10);
    
//     console.log('Imagen zoomed creada');
}

/**
 * Remueve la copia flotante de la imagen
 */
function removeZoomedImage() {
    if (zoomedImageClone) {
        zoomedImageClone.remove();
        zoomedImageClone = null;
        // console.log('Imagen zoomed removida');
    }
    zoomedOriginalEl = null;
    if (zoomFollowRafId) {
        cancelAnimationFrame(zoomFollowRafId);
        zoomFollowRafId = null;
    }
    detachZoomFollowListeners();
}

/**
 * Agrega estilos CSS para el sistema de zoom
 */
function addZoomStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Estilos para la imagen original cuando está zoomed */
        .column img.zoomed {
            opacity: 0.3;
            transition: opacity 0.3s ease;
        }
        
        /* Estilos para el video original cuando está zoomed */
        .column video.zoomed {
            opacity: 0.3;
            transition: opacity 0.3s ease;
        }
        
        /* Estilos para la copia flotante */
        .zoomed-clone {
            pointer-events: none;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            border-radius: 4px;
        }
        
        /* Fondo semi-transparente para la imagen zoomed */
        .zoomed-clone::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.1);
            z-index: -1;
            pointer-events: none;
        }
        
        /* Responsive para móviles */
        @media (max-width: 768px) {
            .column img {
                cursor: pointer;
            }
            .column video {
                cursor: pointer;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Cierra el zoom con la tecla Escape
 */
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && zoomedImageClone) {
        // console.log('Escape presionado, cerrando zoom...');
        removeZoomedImage();
        const originalZoomed = document.querySelector('.column img.zoomed, .column video.zoomed');
        if (originalZoomed) {
            originalZoomed.classList.remove('zoomed');
        }
    }
});

/**
 * Actualiza la posición de la copia para que siga al elemento original
 */
function updateZoomedClonePosition() {
    if (!zoomedImageClone || !zoomedOriginalEl) return;
    const rectNow = zoomedOriginalEl.getBoundingClientRect();
    const newWidth = parseFloat(zoomedImageClone.dataset.zoomWidth || '0') || rectNow.width * 1.5;
    const newHeight = parseFloat(zoomedImageClone.dataset.zoomHeight || '0') || rectNow.height * 1.5;
    zoomedImageClone.style.left = (rectNow.left + rectNow.width / 2 - newWidth / 2) + 'px';
    zoomedImageClone.style.top = (rectNow.top + rectNow.height / 2 - newHeight / 2) + 'px';
    zoomedImageClone.style.width = newWidth + 'px';
    zoomedImageClone.style.height = newHeight + 'px';
}

/**
 * Inicia un loop para seguir la posición del original mientras hay zoom
 */
function startZoomFollowLoop() {
    const loop = () => {
        if (!zoomedImageClone || !zoomedOriginalEl) return;
        updateZoomedClonePosition();
        zoomFollowRafId = requestAnimationFrame(loop);
    };
    zoomFollowRafId = requestAnimationFrame(loop);
}

/**
 * Adjunta listeners para actualizar posición en eventos de scroll/resize
 */
function attachZoomFollowListeners() {
    if (zoomFollowListenersAttached) return;
    // Scroll global y de elementos (captura para atrapar scroll en columnas)
    document.addEventListener('scroll', updateZoomedClonePosition, true);
    window.addEventListener('resize', updateZoomedClonePosition);
    zoomFollowListenersAttached = true;
}

/**
 * Remueve listeners del seguimiento
 */
function detachZoomFollowListeners() {
    if (!zoomFollowListenersAttached) return;
    document.removeEventListener('scroll', updateZoomedClonePosition, true);
    window.removeEventListener('resize', updateZoomedClonePosition);
    zoomFollowListenersAttached = false;
}


/**
 * Limpia el sistema cuando se cambia de página
 */
window.addEventListener('beforeunload', function() {
    removeZoomedImage();
});

/**
 * Función de utilidad para debug
 */
function debugZoomSystem() {
//     console.log('Estado del sistema de zoom:');
//     console.log('Imagen zoomed activa:', zoomedImageClone ? 'Sí' : 'No');
    if (zoomedImageClone) {
        // console.log('Posición:', zoomedImageClone.style.left, zoomedImageClone.style.top);
        // console.log('Tamaño:', zoomedImageClone.style.width, zoomedImageClone.style.height);
    }
}
