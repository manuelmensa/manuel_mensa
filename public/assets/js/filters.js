/**
 * Sistema de Filtros para el Website de Manuel Mensa
 * 
 * Este archivo contiene la funcionalidad para filtrar columnas por categorías.
 * Las categorías permiten mostrar/ocultar columnas manteniendo su orden original.
 */

// Definición de categorías y sus PROYECTOS asociados (no columnas individuales)
const categories = {
    'teoria': {
        name: 'Teoría Arquitectónica',
        projects: ['matters', 'sinEstado', 'estados', 'cuerpo', 'sinFin', 'revolucion', 'muro', 'invisibles', 'mundo', 'deleuze']
    },
    'residencial': {
        name: 'Proyectos Residenciales', 
        projects: ['casaERCP', 'casaJBRC', 'casaFG', 'casaFKL', 'casaFV']
    },
    'instalaciones': {
        name: 'Instalaciones Artísticas',
        projects: ['cute', 'amorosa', 'never', 'noche', 'militancia', 'postponed', 'web']
    },
    'publicos': {
        name: 'Espacios Públicos',
        projects: ['ciencias', 'laberinto', 'edificios', 'mothership', 'edificioSCW']
    },
    'investigacion': {
        name: 'Investigación',
        projects: ['creciendo', 'erewhon', 'personajismo', 'MPV', 'singular', 'vanguardia', 'omu', 'ultimate', 'ametralladora', 'vicios', 'imperio', 'masas', 'estudio']
    }
};

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
    console.log('Inicializando sistema de filtros...');
    
    // Agregar estilos CSS para los filtros
    addFilterStyles();
}

/**
 * Crea los botones de filtro en el HTML
 * Los botones se insertan entre la información de contacto y el título "Índice"
 */
function createFilterButtons() {
    const indiceColumn = document.getElementById('indice');
    if (!indiceColumn) {
        console.error('No se encontró la columna índice');
        return;
    }

    // Crear contenedor de filtros
    const filterContainer = document.createElement('div');
    filterContainer.id = 'filter-container';
    filterContainer.innerHTML = `
        <div class="filter-buttons">
            <button class="filter-btn active" data-category="all">Todos</button>
            ${Object.keys(categories).map(category => 
                `<button class="filter-btn" data-category="${category}">${categories[category].name}</button>`
            ).join('')}
        </div>
    `;

    // Buscar el h3 que dice exactamente "Índice"
    const indiceTitle = Array.from(indiceColumn.querySelectorAll('h3')).find(h3 => 
        h3.textContent.trim() === 'Índice'
    );
    
    if (indiceTitle) {
        // Insertar los filtros justo antes del título "Índice"
        indiceColumn.insertBefore(filterContainer, indiceTitle);
        console.log('Filtros insertados correctamente antes del título "Índice"');
    } else {
        // Fallback: insertar al final de la columna
        indiceColumn.appendChild(filterContainer);
        console.warn('No se encontró el título "Índice", filtros insertados al final');
    }

    // Agregar event listeners a los botones
    const filterButtons = filterContainer.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
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
    
    console.log(`Se encontraron ${allColumns.length} columnas agrupadas en ${Object.keys(projectGroups).length} proyectos`);
    console.log('Proyectos encontrados:', Object.keys(projectGroups));
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
            console.log(`Filtro '${category}' desactivado - Mostrando todas las columnas`);
        } else {
            // Si no está activo, activarlo y aplicar el filtro
            activeFilters.clear(); // Limpiar otros filtros activos
            activeFilters.add(category);
            applyCategoryFilter(category);
            updateFilterButtons(category);
            console.log(`Filtro '${category}' activado`);
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
    console.log('Mostrando todas las columnas');
}

/**
 * Aplica filtro por categoría específica
 * @param {string} category - Categoría a mostrar
 */
function applyCategoryFilter(category) {
    const categoryData = categories[category];
    if (!categoryData) {
        console.error(`Categoría no encontrada: ${category}`);
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
    
    console.log(`Aplicando filtro: ${categoryData.name} - Mostrando ${categoryData.projects.length} proyectos`);
}

/**
 * Actualiza el estado visual de los botones de filtro
 * @param {string} activeCategory - Categoría activa
 */
function updateFilterButtons(activeCategory) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.classList.remove('active');
        if (button.getAttribute('data-category') === activeCategory) {
            button.classList.add('active');
        }
    });
    
    // Log para debug
    console.log(`Botón activo: ${activeCategory}`);
}

/**
 * Agrega estilos CSS para los filtros
 * Inyecta estilos necesarios para el funcionamiento de los filtros
 */
function addFilterStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #filter-container {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .filter-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 10px;
        }
        
        .filter-btn {
            padding: 6px 12px;
            border: 1px solid black;
            background-color: transparent;
            color: black;
            font-family: PitagonSerif;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            border-radius: 2px;
            white-space: nowrap;
        }
        
        .filter-btn:hover {
            background-color: black;
            color: white;
        }
        
        .filter-btn.active {
            background-color: black;
            color: white;
            font-weight: bold;
        }
        
        .filter-btn.active:hover {
            background-color: #333;
        }
        
        /* Responsive para móviles */
        @media (max-width: 768px) {
            .filter-buttons {
                flex-direction: column;
                gap: 4px;
            }
            
            .filter-btn {
                width: 100%;
                text-align: center;
                padding: 8px;
                font-size: 11px;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Función de utilidad para debug
 * Permite verificar el estado actual de los filtros
 */
function debugFilters() {
    console.log('Estado actual de filtros:');
    console.log('Categorías disponibles:', Object.keys(categories));
    console.log('Columnas totales:', allColumns.length);
    console.log('Filtros activos:', Array.from(activeFilters));
}
