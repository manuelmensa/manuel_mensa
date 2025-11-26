/**
 * Sistema de Slugs URL-Friendly
 * 
 * Mapea nombres amigables de URL (slugs) a los IDs internos de los proyectos.
 * Esto permite usar URLs como #telones en lugar de #casaERCP
 * 
 * Los slugs se generan automáticamente desde los textos del índice.
 */

// Función para crear un slug a partir de un texto
function createSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .normalize('NFD') // Normalizar caracteres especiales
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9]+/g, '-') // Reemplazar espacios y caracteres especiales con guiones
        .replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final
}

// Mapeo de slugs a IDs internos (se genera automáticamente al cargar)
let slugToIdMap = {};
let idToSlugMap = {};

/**
 * Genera el mapeo de slugs a IDs desde los links del índice
 * Se ejecuta cuando el DOM está cargado
 */
function generateSlugMapping() {
    slugToIdMap = {};
    idToSlugMap = {};
    
    // Buscar todos los links en el índice que apuntan a proyectos
    const indiceColumn = document.getElementById('indice');
    if (!indiceColumn) {
        // Si no existe todavía, reintentar después
        setTimeout(generateSlugMapping, 100);
        return;
    }
    
    const links = indiceColumn.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        const href = link.getAttribute('href');
        const text = link.textContent.trim();
        
        if (href && text && href !== '#indice') {
            const id = href.replace(/^#/, '');
            const slug = createSlug(text);
            
            // Solo agregar si el ID existe en el DOM
            if (document.getElementById(id)) {
                slugToIdMap[slug] = id;
                idToSlugMap[id] = slug;
            }
        }
    });
    
    // Marcar como listo
    window.slugMappingReady = true;
}

/**
 * Obtiene el ID interno a partir de un slug
 * @param {string} slug - Slug de la URL (ej: 'telones')
 * @returns {string|null} - ID interno (ej: 'casaERCP') o null si no existe
 */
function getIdFromSlug(slug) {
    return slugToIdMap[slug] || null;
}

/**
 * Obtiene el slug a partir de un ID interno
 * @param {string} id - ID interno (ej: 'casaERCP')
 * @returns {string|null} - Slug (ej: 'telones') o null si no existe
 */
function getSlugFromId(id) {
    return idToSlugMap[id] || null;
}

/**
 * Convierte un hash de URL a ID interno
 * Soporta tanto slugs como IDs antiguos (backward compatibility)
 * Sub-columnas (con números) siempre usan IDs directamente
 * @param {string} hash - Hash de la URL (ej: '#telones' o '#casaERCP' o '#casaERCP2')
 * @returns {string|null} - ID interno o null si no existe
 */
function hashToId(hash) {
    if (!hash) return null;
    // Remover el # si existe
    const cleanHash = hash.replace(/^#/, '');
    
    // Primero intentar como slug (para proyectos principales)
    // Esto debe ir antes de verificar si termina en número, porque slugs pueden contener números
    const idFromSlug = getIdFromSlug(cleanHash);
    if (idFromSlug) return idFromSlug;
    
    // Si no funciona como slug, verificar si es un ID existente (backward compatibility)
    const element = document.getElementById(cleanHash);
    if (element) return cleanHash;
    
    // Si el hash termina en número y no se encontró como slug ni como ID directo,
    // podría ser una sub-columna - intentar como ID directamente
    if (/\d+$/.test(cleanHash)) {
        // Ya verificamos arriba con getElementById, así que si llegamos aquí no existe
        return null;
    }
    
    return null;
}

// Generar el mapeo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    generateSlugMapping();
    // Hacer disponible globalmente para debugging
    window.slugMappingReady = true;
});
