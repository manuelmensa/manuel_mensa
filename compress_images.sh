#!/bin/bash

# =============================================================================
# SCRIPT DE COMPRESIÓN DE IMÁGENES CON IMAGEMAGICK
# =============================================================================
# 
# DESCRIPCIÓN:
#   Comprime todas las imágenes JPG, JPEG y PNG en el directorio assets/img
#   reduciendo su tamaño sin perder calidad visual significativa.
#
# FUNCIONALIDADES:
#   - Crea backup automático antes de modificar archivos
#   - Comprime JPG con calidad 85% (balance calidad/tamaño)
#   - Optimiza PNG eliminando metadatos innecesarios
#   - Muestra progreso en tiempo real
#   - Genera reporte final con estadísticas
#
# REQUISITOS:
#   - ImageMagick 7.x instalado (comando: magick)
#   - macOS/Linux con bash
#
# USO:
#   chmod +x compress_images.sh
#   ./compress_images.sh
#
# AUTOR: Asistente AI
# FECHA: $(date)
# =============================================================================

echo "🖼️  Iniciando compresión de imágenes..."
echo "📁 Directorio: /Users/pedro/Documents/manuel_mensa/public/assets/img"
echo ""

# =============================================================================
# CONFIGURACIÓN INICIAL
# =============================================================================

# Crear directorio de backup con timestamp para evitar conflictos
BACKUP_DIR="/Users/pedro/Documents/manuel_mensa/public/assets/img_backup_$(date +%Y%m%d_%H%M%S)"
echo "📦 Creando backup en: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Contadores para estadísticas finales
total_files=0
compressed_files=0
saved_space=0

# =============================================================================
# FUNCIÓN DE COMPRESIÓN
# =============================================================================

# Función para comprimir una imagen individual
compress_image() {
    local file="$1"
    local relative_path="${file#/Users/pedro/Documents/manuel_mensa/public/assets/img/}"
    local backup_file="$BACKUP_DIR/$relative_path"
    
    # Crear directorio de backup si no existe (mantiene estructura de carpetas)
    mkdir -p "$(dirname "$backup_file")"
    
    # Copiar archivo original al backup (seguridad)
    cp "$file" "$backup_file"
    
    # Obtener tamaño original en bytes (compatible con macOS)
    local original_size=$(stat -f%z "$file" 2>/dev/null || echo "0")
    
    # =====================================================================
    # COMPRESIÓN SEGÚN TIPO DE ARCHIVO
    # =====================================================================
    
    # Extraer extensión del archivo y convertir a minúsculas
    local extension="${file##*.}"
    local lower_extension=$(echo "$extension" | tr '[:upper:]' '[:lower:]')
    
    case "$lower_extension" in
        jpg|jpeg)
            # Comprimir JPG con calidad 85% (excelente balance calidad/tamaño)
            # -quality 85: Reduce tamaño manteniendo calidad visual
            # -strip: Elimina metadatos EXIF innecesarios
            magick "$file" -quality 85 -strip "$file"
            ;;
        png)
            # Optimizar PNG eliminando metadatos y maximizando compresión
            # -strip: Elimina metadatos
            # -define png:compression-level=9: Máxima compresión PNG
            magick "$file" -strip -define png:compression-level=9 "$file"
            ;;
        *)
            # Formato no soportado - saltar archivo
            echo "⚠️  Formato no soportado: $file"
            return
            ;;
    esac
    
    # =====================================================================
    # CÁLCULO DE AHORRO Y REPORTE
    # =====================================================================
    
    # Obtener nuevo tamaño después de la compresión
    local new_size=$(stat -f%z "$file" 2>/dev/null || echo "0")
    local space_saved=$((original_size - new_size))
    
    # Actualizar contadores y mostrar resultado
    if [ $space_saved -gt 0 ]; then
        compressed_files=$((compressed_files + 1))
        saved_space=$((saved_space + space_saved))
        # Mostrar ahorro en MB con 1 decimal
        echo "✅ $relative_path - Ahorrado: $(echo $space_saved | awk '{printf "%.1f MB", $1/1024/1024}')"
    else
        echo "ℹ️  $relative_path - Sin cambios"
    fi
    
    total_files=$((total_files + 1))
}

# =============================================================================
# PROCESAMIENTO PRINCIPAL
# =============================================================================

echo "🔄 Procesando imágenes..."
echo ""

# Buscar todas las imágenes JPG, JPEG y PNG (incluyendo mayúsculas)
# y procesarlas una por una
find /Users/pedro/Documents/manuel_mensa/public/assets/img -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.JPG" \) | while read -r file; do
    compress_image "$file"
done

# =============================================================================
# REPORTE FINAL
# =============================================================================

echo ""
echo "📊 Resumen de compresión:"
echo "   Total de archivos procesados: $total_files"
echo "   Archivos comprimidos: $compressed_files"
echo "   Espacio ahorrado: $(echo $saved_space | awk '{printf "%.1f MB", $1/1024/1024}')"
echo "   Backup creado en: $BACKUP_DIR"
echo ""
echo "✨ ¡Compresión completada!"
echo ""
echo "💡 CONSEJOS:"
echo "   - Si estás satisfecho con los resultados, puedes eliminar el backup:"
echo "     rm -rf $BACKUP_DIR"
echo "   - Para comprimir más agresivamente, cambia -quality 85 a -quality 75"
echo "   - Para WebP (más compresión), considera usar: magick input.jpg output.webp"