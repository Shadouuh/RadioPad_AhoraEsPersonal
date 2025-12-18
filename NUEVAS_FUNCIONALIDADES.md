# Nuevas Funcionalidades - Gestión de FX en Programas

## Resumen de Cambios

Se ha mejorado completamente la funcionalidad de asignación de FX en la página de Programas, agregando:

1. **Carga directa de archivos de audio** para programas específicos
2. **Sistema de categorías** para organizar sonidos
3. **Cálculo automático de duración** de archivos de audio
4. **Interfaz mejorada** con tabs para seleccionar o cargar FX

---

## 1. Carga Directa de Archivos de Audio

### Funcionalidad
Ahora puedes cargar archivos de audio directamente para un programa sin necesidad de que existan previamente en la biblioteca general.

### Cómo usar
1. Ve a la página de **Programas**
2. Selecciona un programa
3. Haz clic en **"Asignar FX"**
4. Selecciona la pestaña **"Cargar nuevo"**
5. Completa los campos:
   - **Nombre del sonido**: Nombre descriptivo (ej: "Cortina de apertura")
   - **Archivo de audio**: Selecciona un archivo desde tu computadora
   - **Categorías**: Etiquetas separadas por comas (opcional)
6. Haz clic en **"Crear y Asignar"**

### Características
- ✅ Cálculo automático de duración del audio
- ✅ Soporte para todos los formatos de audio (mp3, wav, ogg, etc.)
- ✅ Validación de tipo de archivo
- ✅ Vista previa del archivo seleccionado con tamaño y duración
- ✅ El archivo se guarda con su ruta local para reproducción posterior

---

## 2. Sistema de Categorías

### Funcionalidad
Los sonidos ahora pueden tener múltiples categorías/etiquetas para mejor organización y búsqueda.

### Ejemplos de categorías
- `musica` - Para cortinas musicales, fondos, etc.
- `comedia` - Para efectos cómicos, risas, etc.
- `noticia` - Para cortinas de noticias, alertas, etc.
- `institucional` - Para identificadores de la emisora
- `deportes` - Para efectos deportivos
- `clima` - Para cortinas de clima
- Cualquier etiqueta personalizada que necesites

### Cómo usar
Al crear o cargar un sonido, ingresa las categorías separadas por comas:
```
musica, institucional, apertura
```

### Visualización
Las categorías se muestran como badges de color azul en las tarjetas de sonidos.

---

## 3. Estructura de Datos Mejorada

### Tabla `sounds` actualizada

```sql
CREATE TABLE sounds (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,                    -- Nombre del sonido
  scope TEXT NOT NULL,                   -- 'institutional', 'program', 'personal', 'effect'
  program_id BIGINT,                     -- ID del programa (si scope='program')
  owner_user_id BIGINT,                  -- ID del usuario dueño (si scope='personal')
  file_url TEXT NOT NULL,                -- Ruta local del archivo de audio
  play_count INTEGER DEFAULT 0,          -- Contador de reproducciones
  duration_seconds NUMERIC,              -- Duración en segundos (calculada automáticamente)
  categories TEXT[] DEFAULT '{}',        -- Array de categorías/etiquetas
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Campos importantes

#### `file_url`
- Guarda la **ruta local** del archivo de audio
- Ejemplo: `C:\Users\Usuario\Music\cortina.mp3`
- Se usa para reproducir el sonido posteriormente

#### `duration_seconds`
- Se calcula **automáticamente** al cargar el archivo
- No es necesario ingresarlo manualmente
- Se muestra en formato `MM:SS` en la interfaz

#### `categories`
- Array de strings con las etiquetas
- Ejemplo: `['musica', 'comedia', 'noticia']`
- Opcional, puede estar vacío

#### `scope`
- `'institutional'` - Sonidos globales para todos (biblioteca institucional)
- `'program'` - Sonidos específicos de un programa
- `'personal'` - Sonidos personales de un usuario
- `'effect'` - Efectos globales (sección de efectos)

---

## 4. Interfaz Mejorada

### Modal de Asignar FX

El modal ahora tiene **dos pestañas**:

#### Pestaña "Seleccionar existente"
- Lista de FX institucionales disponibles
- Lista de FX personales disponibles
- Búsqueda por nombre
- Indicador de FX ya asignados
- Botón "Asignar" para agregar al programa

#### Pestaña "Cargar nuevo"
- Campo de nombre del sonido
- Selector de archivo de audio con preview
- Campo de categorías (opcional)
- Botón "Crear y Asignar"

### Componente AudioFileUploader

Nuevo componente que:
- ✅ Permite seleccionar archivos de audio
- ✅ Valida que sea un archivo de audio válido
- ✅ Calcula la duración automáticamente
- ✅ Muestra preview con nombre, tamaño y duración
- ✅ Permite quitar el archivo seleccionado

### Visualización de Sonidos

Las tarjetas de sonidos ahora muestran:
- **Nombre** del sonido
- **Scope** (institutional, program, etc.)
- **Duración** en formato MM:SS
- **Categorías** como badges azules
- **Ruta del archivo** (en modo no-minimal)
- Botones de **Play/Pause** y **Eliminar**

---

## 5. Archivos Modificados/Creados

### Archivos Modificados

#### `supabase-schema.sql`
- ✅ Agregado campo `categories TEXT[]` a tabla `sounds`
- ✅ Actualizado CHECK constraint para incluir scope 'effect'
- ✅ Agregados comentarios explicativos

#### `src/services/soundSupabase.js`
- ✅ Actualizado `mapSoundRow` para incluir `categories`
- ✅ Actualizado `getSounds` para seleccionar campo `categories`
- ✅ Actualizado `createSound` para aceptar `durationSeconds` y `categories`
- ✅ Mejorado manejo de errores con logs detallados

#### `src/pages/ProgramsPage.jsx`
- ✅ Agregados estados para modo upload y datos del nuevo sonido
- ✅ Actualizada función `onCreateSound` para manejar ambos modos
- ✅ Agregado modal con tabs para seleccionar o cargar
- ✅ Integrado componente `AudioFileUploader`
- ✅ Agregados campos para nombre y categorías

#### `src/components/sounds/SoundGrid.jsx`
- ✅ Prioriza `durationSeconds` de la BD sobre cálculo dinámico
- ✅ Muestra categorías como badges azules
- ✅ Mejorado rendimiento al evitar recalcular duraciones

### Archivos Creados

#### `src/components/AudioFileUploader.jsx`
- ✅ Componente reutilizable para seleccionar archivos de audio
- ✅ Calcula duración automáticamente usando Web Audio API
- ✅ Muestra preview del archivo con tamaño y duración
- ✅ Validación de tipo de archivo
- ✅ Manejo de errores

---

## 6. Flujo de Trabajo

### Escenario 1: Asignar FX existente
```
1. Usuario abre modal "Asignar FX"
2. Pestaña "Seleccionar existente" está activa por defecto
3. Usuario busca y selecciona un FX de la lista
4. Usuario hace clic en "Asignar"
5. El FX se copia al programa con sus datos (nombre, duración, categorías)
```

### Escenario 2: Cargar FX nuevo
```
1. Usuario abre modal "Asignar FX"
2. Usuario cambia a pestaña "Cargar nuevo"
3. Usuario ingresa nombre del sonido
4. Usuario selecciona archivo de audio desde su PC
5. Sistema calcula duración automáticamente
6. Usuario ingresa categorías (opcional)
7. Usuario hace clic en "Crear y Asignar"
8. El sonido se crea y se asigna al programa
```

---

## 7. Validaciones Implementadas

### Al seleccionar FX existente
- ✅ Verifica que se haya seleccionado un FX
- ✅ Verifica que el FX tenga archivo asociado
- ✅ Previene duplicados (mismo archivo ya asignado)

### Al cargar FX nuevo
- ✅ Verifica que se haya ingresado un nombre
- ✅ Verifica que se haya seleccionado un archivo
- ✅ Valida que sea un archivo de audio
- ✅ Calcula duración automáticamente
- ✅ Procesa categorías (trim, split, filter)

---

## 8. Próximos Pasos

### Para usar las nuevas funcionalidades:

1. **Ejecuta el script SQL actualizado**
   ```bash
   # En Supabase Dashboard → SQL Editor
   # Ejecuta: supabase-schema.sql
   ```

2. **Verifica la estructura de la tabla**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'sounds';
   ```

3. **Prueba la funcionalidad**
   - Abre la página de Programas
   - Selecciona un programa
   - Haz clic en "Asignar FX"
   - Prueba ambas pestañas (Seleccionar/Cargar)

---

## 9. Notas Técnicas

### Cálculo de Duración
- Se usa la API nativa de HTML5 Audio
- Se carga solo metadata, no el archivo completo
- Se maneja en el frontend antes de enviar a BD
- Fallback a cálculo dinámico si no está en BD

### Almacenamiento de Archivos
- Los archivos se guardan **localmente** en tu PC
- Solo la **ruta** se guarda en la base de datos
- Esto permite reproducción sin necesidad de servidor de archivos
- Asegúrate de no mover/eliminar los archivos originales

### Categorías
- Se guardan como array PostgreSQL (`TEXT[]`)
- Se procesan en el frontend (split por comas, trim)
- Se muestran como badges en la UI
- Futuro: podrían usarse para filtrado y búsqueda

---

## 10. Troubleshooting

### El archivo no se carga
- Verifica que sea un formato de audio válido
- Revisa la consola del navegador para errores
- Asegúrate de que el archivo no esté corrupto

### No se calcula la duración
- Algunos formatos pueden no soportar metadata
- El navegador debe poder decodificar el formato
- Verifica que el archivo sea accesible

### Error al crear sonido
- Revisa los logs en consola con prefijo `[soundSupabase]`
- Verifica que las políticas RLS estén configuradas
- Asegúrate de estar autenticado

---

## Resumen

✅ **Carga directa de archivos** para programas específicos  
✅ **Sistema de categorías** para mejor organización  
✅ **Cálculo automático de duración** sin intervención manual  
✅ **Interfaz mejorada** con tabs intuitivos  
✅ **Validaciones robustas** para prevenir errores  
✅ **Logs detallados** para debugging  
✅ **Documentación completa** de la funcionalidad
