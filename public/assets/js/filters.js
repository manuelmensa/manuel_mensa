/**
 * Sistema de Filtros para el Website de Manuel Mensa
 * 
 * Este archivo contiene la funcionalidad para filtrar columnas por categorías.
 * Las categorías permiten mostrar/ocultar columnas manteniendo su orden original.
 */

// Definición de categorías y sus PROYECTOS asociados (no columnas individuales)
const categories = {
    'ensayos': {
        nameES: 'Ensayos',
        nameEN: 'Essays',
        projects: ['matters', 'personajismo', 'MPV', 'cuerpo', 'postponed', 'never', 'sinFin', 'mundo']
    },
    'construido': {
        nameES: 'Construido',
        nameEN: 'Built Work',
        projects: ['casaERCP', 'casaJBRC', 'casaFG']
    },
    'estudios': {
        nameES: 'Estudios',
        nameEN: 'Studies',
        projects: ['edificioSCW', 'casaFKL', 'erewhon', 'ultimate', 'revolucion', 'ciencias', 'laberinto']
    },
    'investigacion': {
        nameES: 'Investigación',
        nameEN: 'Research',
        projects: ['cute', 'edificios', 'sinEstado', 'vanguardia', 'omu', 'ametralladora', 'vicios', 'imperio', 'masas', 'deleuze', 'web']
    },
    'pabellones': {
        nameES: 'Pabellones',
        nameEN: 'Pavilions',
        projects: ['mothership', 'muro', 'invisibles', 'estudio']
    },
    'publicaciones': {
        nameES: 'Publicaciones',
        nameEN: 'Publications',
        projects: ['creciendo', 'singular', 'noche', 'estados', 'militancia', 'amorosa']
    }
};

// Detectar idioma basado en el título del índice
function detectLanguage() {
    const indiceColumn = document.getElementById('indice');
    if (!indiceColumn) return 'es';
    
    const indexTitle = Array.from(indiceColumn.querySelectorAll('h3')).find(h3 => {
        const text = h3.textContent.trim();
        return text === 'Índice' || text === 'Index';
    });
    
    if (!indexTitle) return 'es';
    return indexTitle.textContent.trim() === 'Index' ? 'en' : 'es';
}

// Obtener nombre de categoría según idioma
function getCategoryName(categoryKey, lang) {
    const category = categories[categoryKey];
    if (!category) return '';
    return lang === 'en' ? category.nameEN : category.nameES;
}

// Estado actual de los filtros
let activeFilters = new Set();
let allColumns = [];
let projectGroups = {}; // Agrupa columnas por proyecto

/**
 * Inicializa el sistema de filtros
 * Se ejecuta cuando el DOM está completamente cargado
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeFilters();
    createFilterButtons();
    collectAllColumns();
    
    // Esperar a que el mapeo de slugs esté listo antes de actualizar los links
    // Esto asegura que los links del índice se inicialicen correctamente
    function waitForSlugMapping() {
        if (window.slugMappingReady) {
            // Inicializar los links del índice (mostrar todos por defecto)
            updateIndexLinks(null);
        } else {
            setTimeout(waitForSlugMapping, 50);
        }
    }
    waitForSlugMapping();
});

/**
 * Inicializa el sistema de filtros
 * Configura los event listeners y el estado inicial
 */
function initializeFilters() {
    // console.log('Inicializando sistema de filtros...');
    
    // Agregar estilos CSS para los filtros
    addFilterStyles();
}

/**
 * Crea los botones de filtro en el HTML
 * Los botones se insertan entre la información de contacto y el título "Índice" o "Index"
 */
function createFilterButtons() {
    const indiceColumn = document.getElementById('indice');
    if (!indiceColumn) {
        // console.error('No se encontró la columna índice');
        return;
    }

    // Detectar idioma
    const lang = detectLanguage();
    const texts = {
        es: { filters: 'Filtros', all: 'Todos' },
        en: { filters: 'Filters', all: 'All' }
    };

    // Crear contenedor de filtros
    const filterContainer = document.createElement('div');
    filterContainer.id = 'filter-container';
    filterContainer.innerHTML = `
        <p style="margin-bottom: -10px"><a class="filter-link active" href="#" data-category="all">${texts[lang].all}</a></p>
        ${Object.keys(categories).map(category => 
            `<p style="margin-bottom: -10px"><a class="filter-link" href="#" data-category="${category}">${getCategoryName(category, lang)}</a></p>`
        ).join('')}
    `;

    // Buscar el h3 que dice "Índice" o "Index"
    const indiceTitle = Array.from(indiceColumn.querySelectorAll('h3')).find(h3 => {
        const text = h3.textContent.trim();
        return text === 'Índice' || text === 'Index';
    });
    
    if (indiceTitle) {
        // Insertar los filtros justo antes del título
        indiceColumn.insertBefore(filterContainer, indiceTitle);
        // console.log('Filtros insertados correctamente antes del título');
    } else {
        // Fallback: insertar al final de la columna
        indiceColumn.appendChild(filterContainer);
        // console.warn('No se encontró el título, filtros insertados al final');
    }

    // Agregar event listeners a los links de filtro
    const filterLinks = filterContainer.querySelectorAll('.filter-link');
    filterLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.getAttribute('data-category');
            toggleFilter(category);
        });
    });
}

/**
 * Recolecta todas las columnas del documento y las agrupa por proyecto
 * Un proyecto puede tener múltiples columnas (texto, dibujos, fotografías, etc.)
 */
function collectAllColumns() {
    allColumns = Array.from(document.querySelectorAll('.column')).filter(column => 
        column.id && 
        column.id !== 'indice' && 
        !column.classList.contains('gap')
    );
    
    // Agrupar columnas por proyecto
    projectGroups = {};
    allColumns.forEach(column => {
        const projectId = getProjectId(column.id);
        if (!projectGroups[projectId]) {
            projectGroups[projectId] = [];
        }
        projectGroups[projectId].push(column);
    });
    
    // console.log(`Se encontraron ${allColumns.length} columnas agrupadas en ${Object.keys(projectGroups).length} proyectos`);
    // console.log('Proyectos encontrados:', Object.keys(projectGroups));
}

/**
 * Obtiene el ID del proyecto base a partir del ID de la columna
 * Ejemplo: 'casaERCP2' -> 'casaERCP', 'matters' -> 'matters'
 */
function getProjectId(columnId) {
    // Si el ID termina en número, es una subcolumna del proyecto
    const match = columnId.match(/^(.+?)(\d+)?$/);
    return match ? match[1] : columnId;
}

/**
 * Elimina el zoom de todas las imágenes activas
 * Se llama cuando se aplica un filtro para evitar que las imágenes queden atrapadas
 */
function removeAllZooms() {
    // Verificar si la función removeZoomedImage existe (del archivo zoom-images.js)
    if (typeof removeZoomedImage === 'function') {
        // Remover todas las imágenes zoomed
        removeZoomedImage();
        
        // También remover la clase 'zoomed' de todas las imágenes y videos originales
        const zoomedElements = document.querySelectorAll('.column img.zoomed, .column video.zoomed');
        zoomedElements.forEach(element => {
            element.classList.remove('zoomed');
        });
    }
}

/**
 * Alterna el estado de un filtro
 * @param {string} category - Categoría a alternar
 */
function toggleFilter(category) {
    // Eliminar todos los zooms activos antes de aplicar el filtro
    removeAllZooms();
    
    if (category === 'all') {
        // Mostrar todas las columnas
        showAllColumns();
        updateFilterButtons('all');
    } else {
        // Verificar si el filtro ya está activo
        const isCurrentlyActive = activeFilters.has(category);
        
        if (isCurrentlyActive) {
            // Si ya está activo, desactivarlo y mostrar todas las columnas
            activeFilters.delete(category);
            showAllColumns();
            updateFilterButtons('all');
            // console.log(`Filtro '${category}' desactivado - Mostrando todas las columnas`);
        } else {
            // Si no está activo, activarlo y aplicar el filtro
            activeFilters.clear(); // Limpiar otros filtros activos
            activeFilters.add(category);
            applyCategoryFilter(category);
            updateFilterButtons(category);
            // console.log(`Filtro '${category}' activado`);
        }
    }
}

/**
 * Muestra todas las columnas
 * Restaura la visibilidad de todas las columnas
 */
function showAllColumns() {
    allColumns.forEach(column => {
        column.style.display = 'block';
    });
    // Habilitar todos los links del índice
    updateIndexLinks(null);
    // console.log('Mostrando todas las columnas');
}

/**
 * Aplica filtro por categoría específica
 * @param {string} category - Categoría a mostrar
 */
function applyCategoryFilter(category) {
    const categoryData = categories[category];
    if (!categoryData) {
        // console.error(`Categoría no encontrada: ${category}`);
        return;
    }

    // Ocultar/mostrar proyectos completos
    Object.keys(projectGroups).forEach(projectId => {
        const shouldShow = categoryData.projects.includes(projectId);
        const projectColumns = projectGroups[projectId];
        
        projectColumns.forEach(column => {
            column.style.display = shouldShow ? 'block' : 'none';
        });
    });
    
    // Actualizar links del índice según el filtro
    updateIndexLinks(categoryData.projects);
    
    const lang = detectLanguage();
    const categoryName = getCategoryName(category, lang);
    // console.log(`Aplicando filtro: ${categoryName} - Mostrando ${categoryData.projects.length} proyectos`);
}

/**
 * Actualiza el estado visual de los links de filtro
 * @param {string} activeCategory - Categoría activa
 */
function updateFilterButtons(activeCategory) {
    const filterLinks = document.querySelectorAll('.filter-link');
    filterLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-category') === activeCategory) {
            link.classList.add('active');
        }
    });
}

/**
 * Actualiza los links del índice según el filtro activo
 * @param {Array<string>|null} visibleProjects - Array de IDs de proyectos visibles, o null para mostrar todos
 */
function updateIndexLinks(visibleProjects) {
    const indiceColumn = document.getElementById('indice');
    if (!indiceColumn) return;
    
    // Obtener todos los links del índice que apuntan a proyectos
    const indexLinks = indiceColumn.querySelectorAll('a[href^="#"]');
    
    indexLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href === '#indice') return;
        
        // Convertir el href (puede ser slug o ID) al ID del proyecto
        let projectId = null;
        
        // Si existe la función hashToId, usarla para convertir slug a ID
        if (typeof hashToId === 'function') {
            projectId = hashToId(href);
        } else {
            // Fallback: asumir que el href es directamente el ID
            projectId = href.replace(/^#/, '');
        }
        
        // Si no encontramos un ID válido, saltar este link
        if (!projectId) return;
        
        // Obtener el ID base del proyecto (sin números de subcolumna)
        const baseProjectId = getProjectId(projectId);
        
        // Verificar si el proyecto está visible
        const isVisible = visibleProjects === null || visibleProjects.includes(baseProjectId);
        
        if (isVisible) {
            // Habilitar el link
            link.classList.remove('index-link-disabled');
        } else {
            // Deshabilitar el link
            link.classList.add('index-link-disabled');
        }
    });
}

/**
 * Agrega estilos CSS para los filtros
 * Usa el mismo estilo que los links del índice
 */
function addFilterStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #filter-container {
            margin-bottom: 2rem;
        }
        
        .filter-link {
            color: black;
            text-decoration: none;
            font-family: PitagonSerif;
            font-size: 15px;
            cursor: pointer;
        }
        
        .filter-link:hover {
            color: #191970;
            font-weight: bold;
        }
        
        .filter-link.active {
            color: #191970;
            font-weight: bold;
        }
        
        /* Estilos para links del índice deshabilitados */
        .index-link-disabled {
            color: #d3d3d3 !important;
            pointer-events: none !important;
            cursor: default !important;
        }
        
        .index-link-disabled:hover {
            color: #d3d3d3 !important;
            font-weight: normal !important;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Función de utilidad para debug
 * Permite verificar el estado actual de los filtros
 */
function debugFilters() {
    // console.log('Estado actual de filtros:');
    // console.log('Categorías disponibles:', Object.keys(categories));
    // console.log('Columnas totales:', allColumns.length);
    // console.log('Filtros activos:', Array.from(activeFilters));
}
