# Manuel Mensa Portfolio

## Cómo agregar nuevas categorías/filtros

Sigue estos pasos cuando necesites sumar una categoría nueva a los filtros del índice (por ejemplo, para un nuevo grupo de proyectos):

1. **Identifica los IDs de los proyectos**  
   - Cada columna principal en `public/index.html` tiene un `id` (ej. `casaERCP`, `mothership`).  
   - Si un proyecto tiene sub-columnas numeradas (`casaERCP2`, `casaERCP3`), usa siempre el ID base sin números (`casaERCP`).

2. **Edita `public/assets/js/filters.js`**  
   - Dentro del objeto `categories`, agrega una nueva entrada con una clave única (solo minúsculas y sin espacios).  
   - Incluye `nameES`, `nameEN` y el arreglo `projects` con los IDs base del paso anterior, por ejemplo:

     ```js
     'nuevaCategoria': {
         nameES: 'Nombre en español',
         nameEN: 'Name in English',
         projects: ['idProyecto1', 'idProyecto2']
     }
     ```

3. **Guarda y prueba**  
   - Recarga el sitio; el botón aparece automáticamente antes del título “Índice/Index”.  
   - Activa el filtro y verifica que solo se muestren las columnas listadas y que los links del índice se deshabiliten correctamente para el resto.

4. **(Opcional) Reordena los filtros**  
   - Los botones se muestran en el mismo orden que las claves dentro del objeto `categories`. Cambia ese orden si necesitas que la nueva categoría aparezca antes o después de las existentes.

## Cómo comprimir imágenes

Para mantener el sitio liviano, usá una herramienta online (TinyJPG/TinyPNG o similar) y reemplazá los archivos existentes.

1. **Duplicá la imagen original** que querés optimizar para tener un respaldo manual.
2. **Subila a la herramienta de compresión** (por ejemplo [TinyJPG](https://tinyjpg.com/) o [TinyPNG](https://tinypng.com/)) y descargá la versión optimizada.
3. **Verificá que el nombre del archivo coincida** exactamente con el original dentro de `public/assets/img/...` para evitar romper referencias.
4. **Reemplazá el archivo** en `public/assets/img/...` por la versión optimizada.
5. **Recargá el sitio** para confirmar que se sigue viendo correctamente (especialmente si es un PNG con transparencias).

## Links Directos a Proyectos

Puedes compartir links directos a proyectos específicos usando slugs URL-friendly basados en los nombres del índice.

### Ejemplos de URLs:

Los slugs se generan automáticamente desde los nombres del índice. Ejemplos:

- `#matters-of-fact` (Matters of Fact)
- `#telones` (Telones)
- `#buque` (Buque)
- `#cuadra` (Cuadra)
- `#cute-chitecture` (Cute-chitecture)
- `#masoquismo-de-codigo` (Masoquismo de Código)
- `#belle` (Belle)
- `#creciendo-en-publico` (Creciendo en Público)
- `#erewhon` (Erewhon)
- `#personajismo` (Personajismo)
- `#muros-puertas-y-vanos` (Muros, Puertas y Vanos)
- `#edificios-mundo` (Edificios Mundo)
- `#mothershiptheatre` (MothershipTheatre)
- `#arquitectura-sin-estado` (Arquitectura sin Estado)
- `#singular-00` (Singular 00)
- `#vanguardias-o-nada` (Vanguardias o Nada)
- `#oswald-mathias-ungers-es-igual-a-uno` (Oswald Mathias Ungers es Igual a Uno)
- `#la-casa-de-los-arquetipos-ultimos` (La Casa de los Arquetipos Últimos)
- `#ametralladora-de-utopias` (Ametralladora de Utopías)
- `#vicios-ludicos-publicos` (Vicios Lúdicos Públicos)
- `#el-imperio-de-los-valores-arquitectonicos` (El Imperio de los Valores Arquitectónicos)
- `#masas-finas` (Masas Finas)
- `#pasar-la-noche-juntos` (Pasar la Noche Juntos)
- `#estados-de-la-arquitectura` (Estados de la Arquitectura)
- `#agrupacion-militancia-arquitectura` (Agrupación Militancia Arquitectura)
- `#el-cuerpo-hueco-de-la-arquitectura` (El Cuerpo Hueco de la Arquitectura)
- `#architecture-postponed` (Architecture Postponed)
- `#tu-amorosa` (Tu Amorosa)
- `#never-even` (Never Even)
- `#hacia-una-arquitectura-sin-fin` (Hacia una Arquitectura sin Fin)
- `#un-memorial-para-la-revolucion` (Un Memorial para la Revolución)
- `#en-el-muro` (En el Muro)
- `#parque-de-las-ciencias` (Parque de las Ciencias)
- `#laberinto` (Laberinto)
- `#geometrias-invisibles` (Geometrías Invisibles)
- `#hoy-el-mundo` (Hoy el Mundo)
- `#logic-of-sensation-gilles-deleuze` (Logic of Sensation. Gilles Deleuze)
- `#estudio` (Estudio)
- `#sitio-web` (Sitio Web)

### Notas:

- Los slugs se generan automáticamente desde los nombres del índice
- Los slugs son URL-friendly (sin acentos, espacios convertidos a guiones, minúsculas)
- Las sub-columnas (con números, ej: `#casaERCP2`) mantienen sus IDs originales
- Los IDs antiguos siguen funcionando (backward compatibility)

### Ejemplo de uso:

```
https://manuelmensa.com/#telones
https://manuelmensa.com/#arquitectura-sin-estado
https://manuelmensa.com/#matters-of-fact
```
