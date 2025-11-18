/**
 * Sistema de Zoom de Imágenes con Copia Flotante
 * 
 * Este archivo maneja el zoom de imágenes creando una copia flotante
 * que se posiciona sobre la imagen original sin afectar el layout.
 */

// Array para almacenar múltiples copias zoomed (imágenes o videos)
let zoomedImages = []; // Cada elemento: { clone, original, rafId }
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
    
    // PRIMERO: Verificar si el clic está dentro del área de alguna imagen zoomed
    // Esto debe verificarse ANTES de procesar cualquier otra cosa
    const clickedZoomed = zoomedImages.find(item => {
        // Usar el overlay si existe, sino usar el clone
        const element = item.overlay || item.clone;
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    });
    
    if (clickedZoomed && clickedZoomed.original) {
        // Si el clic está en el área de una imagen zoomed, cerrarla
        // Verificar si el target es la imagen original zoomed (para permitir cerrar haciendo clic en la original)
        const isClickingOwnOriginal = target === clickedZoomed.original;
        
        // Si NO es una imagen/video de otra columna, cerrar el zoom
        // (permitir cerrar si es clic en el área zoomed o en la propia imagen original)
        const isClickingOtherImage = target && 
            (target.tagName === 'IMG' || target.tagName === 'VIDEO') &&
            target.closest('.column') &&
            target !== clickedZoomed.original;
        
        if (isClickingOwnOriginal || !isClickingOtherImage) {
            e.stopPropagation();
            e.preventDefault();
            removeZoomedImage(clickedZoomed.original);
            clickedZoomed.original.classList.remove('zoomed');
            return;
        }
    }
    
    // Solo procesar imágenes o videos en columnas y en desktop
    if (target && (target.tagName === 'IMG' || target.tagName === 'VIDEO') &&
        target.closest('.column') &&
        window.innerWidth > 768) {
        
        // Verificar si esta imagen ya está zoomed
        const existingZoomed = zoomedImages.find(item => item.original === target);
        
        if (existingZoomed) {
            // Si ya está zoomed, remover solo esta imagen
            e.stopPropagation();
            removeZoomedImage(target);
            target.classList.remove('zoomed');
        } else {
            // Agregar zoom a esta nueva imagen (sin cerrar las otras)
            e.stopPropagation();
            createZoomedImage(target);
            target.classList.add('zoomed');
        }
        return;
    }
    
    // Si hay imágenes zoomed activas y se hace click fuera de una imagen, no hacer nada
    // (Permite mantener múltiples imágenes abiertas)
});

/**
 * Crea una copia flotante de la imagen
 * @param {HTMLElement} originalImage - Imagen original
 */
function createZoomedImage(originalImage) {
    // Obtener coordenadas del elemento respecto a la ventana
    const rect = originalImage.getBoundingClientRect();
    
    // Crear copia de la imagen
    const zoomedImageClone = originalImage.cloneNode(true);
    zoomedImageClone.classList.add('zoomed-clone');
    
    // Guardar referencia al original para seguimiento
    const zoomedItem = {
        clone: zoomedImageClone,
        original: originalImage,
        rafId: null
    };
    
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
    zoomedImageClone.style.pointerEvents = 'none'; // No bloquear eventos para permitir scroll
    
    // Crear overlay invisible para capturar clics pero permitir scroll
    const clickOverlay = document.createElement('div');
    clickOverlay.classList.add('zoomed-click-overlay');
    clickOverlay.style.position = 'fixed';
    clickOverlay.style.left = rect.left + 'px';
    clickOverlay.style.top = rect.top + 'px';
    clickOverlay.style.width = rect.width + 'px';
    clickOverlay.style.height = rect.height + 'px';
    clickOverlay.style.zIndex = '1001'; // Por encima del clon
    clickOverlay.style.cursor = 'pointer';
    clickOverlay.style.pointerEvents = 'auto'; // Capturar clics
    clickOverlay.style.backgroundColor = 'transparent'; // Invisible
    
    // Variables para detectar si es scroll o clic
    let isScrolling = false;
    let scrollTimeout = null;
    let mouseDownTime = 0;
    let mouseDownPos = { x: 0, y: 0 };
    
    // Detectar mousedown para distinguir entre clic y scroll
    clickOverlay.addEventListener('mousedown', function(e) {
        mouseDownTime = Date.now();
        mouseDownPos = { x: e.clientX, y: e.clientY };
        isScrolling = false;
    });
    
    // Detectar scroll y permitir que pase a través
    clickOverlay.addEventListener('wheel', function(e) {
        isScrolling = true;
        // Encontrar la columna más cercana y hacer scroll en ella
        const column = originalImage.closest('.column');
        if (column) {
            // Scroll vertical
            if (e.deltaY !== 0) {
                column.scrollTop += e.deltaY;
            }
            // Scroll horizontal
            if (e.deltaX !== 0) {
                column.scrollLeft += e.deltaX;
            }
        }
        
        // También permitir scroll horizontal en el contenedor principal
        const container = document.querySelector('.container');
        if (container && e.deltaX !== 0) {
            container.scrollLeft += e.deltaX;
        }
        
        // Resetear el flag después de un tiempo
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
        }, 100);
    }, { passive: true });
    
    // Capturar clics para cerrar el zoom (solo si no es scroll)
    clickOverlay.addEventListener('click', function(e) {
        // Si acabamos de hacer scroll, no cerrar
        if (isScrolling) {
            return;
        }
        
        // Verificar que fue un clic rápido (no arrastre)
        const clickDuration = Date.now() - mouseDownTime;
        const clickDistance = Math.sqrt(
            Math.pow(e.clientX - mouseDownPos.x, 2) + 
            Math.pow(e.clientY - mouseDownPos.y, 2)
        );
        
        if (clickDuration < 300 && clickDistance < 5) {
            e.stopPropagation();
            e.preventDefault();
            removeZoomedImage(originalImage);
            originalImage.classList.remove('zoomed');
        }
    });
    
    // Guardar referencia al overlay en el zoomedItem
    zoomedItem.overlay = clickOverlay;
    
    // Agregar al body
    document.body.appendChild(zoomedImageClone);
    document.body.appendChild(clickOverlay);
    
    // Agregar al array de imágenes zoomed
    zoomedImages.push(zoomedItem);
    
    // Animar el zoom después de un pequeño delay
    setTimeout(() => {
        if (zoomedItem.clone && zoomedImages.includes(zoomedItem)) {
            // Detectar orientación: horizontal (landscape), cuadrada o vertical (portrait)
            // Horizontales: zoom 3x, cuadradas: zoom 2.5x, verticales: zoom 2x
            const aspectRatio = rect.width / rect.height;
            let scale;
            if (aspectRatio > 1.1) {
                // Horizontal (landscape): zoom 3x
                scale = 3.0;
            } else if (aspectRatio < 0.9) {
                // Vertical (portrait): zoom 2x
                scale = 2.0;
            } else {
                // Cuadrada (aspect ratio cercano a 1): zoom 2.5x
                scale = 2.5;
            }
            const newWidth = rect.width * scale;
            const newHeight = rect.height * scale;
            // Persistir tamaño objetivo para recalcular posición al scrollear
            zoomedImageClone.dataset.zoomWidth = String(newWidth);
            zoomedImageClone.dataset.zoomHeight = String(newHeight);
            updateZoomedClonePosition(zoomedItem);
            startZoomFollowLoop(zoomedItem);
            // Quitar transición tras la animación inicial para que siga sin lag
            setTimeout(() => {
                if (zoomedItem.clone && zoomedImages.includes(zoomedItem)) {
                    zoomedImageClone.style.transition = 'none';
                }
            }, 220);
            // Adjuntar listeners de scroll/resize para actualización inmediata
            attachZoomFollowListeners();
        }
    }, 10);
}

/**
 * Remueve la copia flotante de la imagen
 * @param {HTMLElement} originalImage - Imagen original a remover (opcional, si no se pasa remueve todas)
 */
function removeZoomedImage(originalImage = null) {
    if (originalImage) {
        // Remover solo la imagen específica
        const index = zoomedImages.findIndex(item => item.original === originalImage);
        if (index !== -1) {
            const zoomedItem = zoomedImages[index];
            if (zoomedItem.clone) {
                zoomedItem.clone.remove();
            }
            if (zoomedItem.overlay) {
                zoomedItem.overlay.remove();
            }
            if (zoomedItem.rafId) {
                cancelAnimationFrame(zoomedItem.rafId);
            }
            zoomedImages.splice(index, 1);
        }
    } else {
        // Remover todas las imágenes
        zoomedImages.forEach(zoomedItem => {
            if (zoomedItem.clone) {
                zoomedItem.clone.remove();
            }
            if (zoomedItem.overlay) {
                zoomedItem.overlay.remove();
            }
            if (zoomedItem.rafId) {
                cancelAnimationFrame(zoomedItem.rafId);
            }
        });
        zoomedImages = [];
        detachZoomFollowListeners();
    }
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
    if (e.key === 'Escape' && zoomedImages.length > 0) {
        // Remover todas las imágenes zoomed
        zoomedImages.forEach(item => {
            if (item.original) {
                item.original.classList.remove('zoomed');
            }
        });
        removeZoomedImage();
    }
});

/**
 * Actualiza la posición de una imagen zoomed específica
 * Ajusta solo la posición horizontal para evitar que se recorte en los bordes del viewport
 * @param {Object} zoomedItem - Item con clone y original
 */
function updateZoomedClonePosition(zoomedItem) {
    if (!zoomedItem || !zoomedItem.clone || !zoomedItem.original) return;
    
    const rectNow = zoomedItem.original.getBoundingClientRect();
    const newWidth = parseFloat(zoomedItem.clone.dataset.zoomWidth || '0') || rectNow.width * 2.0;
    const newHeight = parseFloat(zoomedItem.clone.dataset.zoomHeight || '0') || rectNow.height * 2.0;
    
    // Calcular posición ideal (centrada)
    let left = rectNow.left + rectNow.width / 2 - newWidth / 2;
    let top = rectNow.top + rectNow.height / 2 - newHeight / 2;
    
    // Solo aplicar ajuste de bordes si la imagen tiene la clase 'last-edge-image'
    if (zoomedItem.original.classList.contains('last-edge-image')) {
        // Obtener dimensiones del viewport
        const viewportWidth = window.innerWidth;
        
        // Ajustar solo posición horizontal si se sale por la derecha
        if (left + newWidth > viewportWidth) {
            left = viewportWidth - newWidth;
        }
        
        // Ajustar solo posición horizontal si se sale por la izquierda
        if (left < 0) {
            left = 0;
        }
    }
    
    // No ajustar posición vertical para no interferir con el scroll de las columnas
    zoomedItem.clone.style.left = left + 'px';
    zoomedItem.clone.style.top = top + 'px';
    zoomedItem.clone.style.width = newWidth + 'px';
    zoomedItem.clone.style.height = newHeight + 'px';
    
    // Actualizar también la posición del overlay
    if (zoomedItem.overlay) {
        zoomedItem.overlay.style.left = left + 'px';
        zoomedItem.overlay.style.top = top + 'px';
        zoomedItem.overlay.style.width = newWidth + 'px';
        zoomedItem.overlay.style.height = newHeight + 'px';
    }
}

/**
 * Actualiza la posición de todas las imágenes zoomed
 */
function updateAllZoomedPositions() {
    zoomedImages.forEach(zoomedItem => {
        updateZoomedClonePosition(zoomedItem);
    });
}

/**
 * Inicia un loop para seguir la posición del original mientras hay zoom
 * @param {Object} zoomedItem - Item con clone y original
 */
function startZoomFollowLoop(zoomedItem) {
    const loop = () => {
        // Verificar que el item todavía existe en el array
        if (!zoomedImages.includes(zoomedItem) || !zoomedItem.clone || !zoomedItem.original) {
            return;
        }
        // Actualizar solo esta imagen específica
        updateZoomedClonePosition(zoomedItem);
        zoomedItem.rafId = requestAnimationFrame(loop);
    };
    zoomedItem.rafId = requestAnimationFrame(loop);
}

/**
 * Adjunta listeners para actualizar posición en eventos de scroll/resize
 */
function attachZoomFollowListeners() {
    if (zoomFollowListenersAttached) return;
    // Scroll global y de elementos (captura para atrapar scroll en columnas)
    document.addEventListener('scroll', updateAllZoomedPositions, true);
    window.addEventListener('resize', updateAllZoomedPositions);
    zoomFollowListenersAttached = true;
}

/**
 * Remueve listeners del seguimiento
 */
function detachZoomFollowListeners() {
    if (!zoomFollowListenersAttached) return;
    document.removeEventListener('scroll', updateAllZoomedPositions, true);
    window.removeEventListener('resize', updateAllZoomedPositions);
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
//     console.log('Imágenes zoomed activas:', zoomedImages.length);
    zoomedImages.forEach((item, index) => {
        if (item.clone) {
            // console.log(`Imagen ${index + 1}:`, item.clone.style.left, item.clone.style.top);
        }
    });
}
