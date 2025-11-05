/**
 * Sistema de Filtros para el Website de Manuel Mensa
 * 
 * Este archivo contiene la funcionalidad para filtrar columnas por categorías.
 * Las categorías permiten mostrar/ocultar columnas manteniendo su orden original.
 */

// Definición de categorías y sus PROYECTOS asociados (no columnas individuales)
const categories = {
    'teoria': {
        nameES: 'Teoría Arquitectónica',
        nameEN: 'Architectural Theory',
        projects: ['matters', 'sinEstado', 'estados', 'cuerpo', 'sinFin', 'revolucion', 'muro', 'invisibles', 'mundo', 'deleuze']
    },
    'residencial': {
        nameES: 'Proyectos Residenciales',
        nameEN: 'Residential Projects',
        projects: ['casaERCP', 'casaJBRC', 'casaFG', 'casaFKL', 'casaFV']
    },
    'instalaciones': {
        nameES: 'Instalaciones Artísticas',
        nameEN: 'Artistic Installations',
        projects: ['cute', 'amorosa', 'never', 'noche', 'militancia', 'postponed', 'web']
    },
    'publicos': {
        nameES: 'Espacios Públicos',
        nameEN: 'Public Spaces',
        projects: ['ciencias', 'laberinto', 'edificios', 'mothership', 'edificioSCW']
    },
    'investigacion': {
        nameES: 'Investigación',
        nameEN: 'Research',
        projects: ['creciendo', 'erewhon', 'personajismo', 'MPV', 'singular', 'vanguardia', 'omu', 'ultimate', 'ametralladora', 'vicios', 'imperio', 'masas', 'estudio']
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
        <h3>${texts[lang].filters}</h3>
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
 * Alterna el estado de un filtro
 * @param {string} category - Categoría a alternar
 */
function toggleFilter(category) {
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
