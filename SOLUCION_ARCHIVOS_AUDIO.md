# Solución: Problema de Reproducción de Archivos de Audio

## Problema Identificado

Los archivos de audio cargados no se reproducen porque se están guardando **blob URLs** temporales en la base de datos en lugar de rutas permanentes.

### ¿Qué son los Blob URLs?

Los blob URLs son URLs temporales creadas por el navegador:
- Formato: `blob:http://localhost:5173/1769730804009-605966246`
- **Solo funcionan durante la sesión actual del navegador**
- Se invalidan cuando se cierra la pestaña o se recarga la página
- No se pueden usar para reproducir archivos después

### Ejemplo del Problema

```
Base de datos guarda: blob:http://localhost:5173/1769730804009-605966246
Nombre del archivo real: HVNVBI - Palabras de Papel [Video Official].mp3
```

Cuando intentas reproducir el sonido más tarde, el blob URL ya no existe.

---

## Soluciones Implementadas

### Solución 1: Usar File System Access API (Recomendado para Electron)

Si estás usando Electron, puedes acceder a la ruta completa del archivo:

```javascript
// En AudioFileUploader.jsx
const filePath = file.path // Ruta completa en Electron
// Ejemplo: C:\Users\Usuario\Music\cancion.mp3
```

**Ventajas:**
- ✅ Ruta permanente y accesible
- ✅ Funciona después de recargar
- ✅ No requiere servidor adicional

**Desventajas:**
- ❌ Solo funciona en Electron, no en navegadores web

### Solución 2: Guardar Archivos en Carpeta Local del Proyecto

Copiar los archivos a una carpeta dentro del proyecto:

```javascript
// Estructura sugerida
RadioPad_AhoraEsPersonal/
  public/
    uploads/
      audio/
        1234567890-cancion.mp3
```

**Implementación:**

```javascript
// Servicio para copiar archivos
async function saveAudioFile(file) {
  const timestamp = Date.now()
  const fileName = `${timestamp}-${file.name}`
  const destPath = `public/uploads/audio/${fileName}`
  
  // Copiar archivo usando Node.js fs (en Electron)
  // O usar un endpoint del servidor
  
  return `/uploads/audio/${fileName}` // Ruta relativa para la BD
}
```

**Ventajas:**
- ✅ Rutas permanentes
- ✅ Fácil de respaldar
- ✅ Funciona en desarrollo y producción

**Desventajas:**
- ❌ Requiere lógica adicional de copia de archivos
- ❌ Ocupa espacio en el proyecto

### Solución 3: Servidor de Archivos Dedicado

Usar un servidor para almacenar los archivos:

```javascript
// uploadService.js ya implementado
async function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch('http://localhost:3002/upload', {
    method: 'POST',
    body: formData
  })
  
  const { url } = await response.json()
  return url // Ejemplo: http://localhost:3002/uploads/audio.mp3
}
```

**Ventajas:**
- ✅ Centralizado
- ✅ Escalable
- ✅ Fácil de respaldar

**Desventajas:**
- ❌ Requiere servidor corriendo
- ❌ Más complejo de configurar

---

## Solución Actual Implementada

### AudioFileUploader.jsx

```javascript
// Retorna tanto el blob URL (para preview) como la ruta del archivo
onFileSelect({
  file,
  filePath: file.path || file.name,  // Ruta completa o nombre
  fileUrl: url,                       // Blob URL para preview temporal
  duration: durationInSeconds,
  name: file.name.replace(/\.[^/.]+$/, ''),
})
```

### Uso en ProgramsPage y FxPadPage

```javascript
// Se guarda el fileUrl (blob) o filePath según disponibilidad
fileUrl: newSoundFile.fileUrl || newSoundFile.filePath
```

---

## Recomendación Final

### Para Aplicación Electron (Desktop)

**Opción A: Usar rutas absolutas del sistema**

```javascript
// Modificar AudioFileUploader para usar file.path directamente
if (file.path) {
  // Guardar ruta absoluta: C:\Users\Usuario\Music\audio.mp3
  fileUrl: file.path
}
```

**Ventajas:**
- Simple
- No requiere copiar archivos
- Acceso directo al archivo original

**Desventajas:**
- Si el usuario mueve/elimina el archivo, se rompe el enlace

**Opción B: Copiar archivos a carpeta del proyecto**

```javascript
// Crear carpeta: RadioPad_AhoraEsPersonal/audio-files/
// Copiar archivos ahí y guardar ruta relativa
fileUrl: './audio-files/1234567890-audio.mp3'
```

**Ventajas:**
- Archivos siempre disponibles
- Fácil de respaldar
- Portabilidad del proyecto

**Desventajas:**
- Duplica archivos
- Requiere lógica de copia

### Para Aplicación Web

**Usar servidor de archivos:**

```javascript
// Implementar endpoint de upload
POST /api/upload
Response: { url: 'http://server.com/uploads/audio.mp3' }

// Guardar URL completa en BD
fileUrl: 'http://server.com/uploads/audio.mp3'
```

---

## Implementación Recomendada (Electron)

### 1. Crear servicio de archivos locales

```javascript
// src/services/localFileService.js
import fs from 'fs'
import path from 'path'

const AUDIO_DIR = path.join(process.cwd(), 'audio-files')

// Crear directorio si no existe
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true })
}

export async function saveAudioFile(file) {
  const timestamp = Date.now()
  const ext = path.extname(file.name)
  const fileName = `${timestamp}${ext}`
  const destPath = path.join(AUDIO_DIR, fileName)
  
  // Copiar archivo
  const buffer = await file.arrayBuffer()
  fs.writeFileSync(destPath, Buffer.from(buffer))
  
  // Retornar ruta relativa
  return `audio-files/${fileName}`
}
```

### 2. Actualizar AudioFileUploader

```javascript
import { saveAudioFile } from '../services/localFileService'

// En handleFileChange
const savedPath = await saveAudioFile(file)

onFileSelect({
  file,
  filePath: savedPath,  // audio-files/1234567890.mp3
  fileUrl: url,         // blob para preview
  duration: durationInSeconds,
  name: file.name.replace(/\.[^/.]+$/, ''),
})
```

### 3. Usar filePath en lugar de fileUrl

```javascript
// En createSound
fileUrl: newSoundFile.filePath  // Usar ruta guardada, no blob
```

---

## Estado Actual

### ✅ Implementado
- AudioFileUploader con cálculo de duración
- Guardado de nombre de archivo original
- Preview con blob URL
- Integración en ProgramsPage y FxPadPage

### ⚠️ Pendiente
- Implementar copia de archivos a carpeta local
- O usar file.path directamente si es Electron
- Actualizar para usar filePath permanente en lugar de blob URL

---

## Pasos para Solucionar

### Opción 1: Rápida (Usar file.path)

1. Verificar que la app corre en Electron
2. Modificar AudioFileUploader para priorizar `file.path`
3. Guardar `file.path` directamente en la BD

```javascript
// AudioFileUploader.jsx
const filePath = file.path || file.name

onFileSelect({
  filePath: filePath,  // Ruta completa del sistema
  // ... resto
})
```

### Opción 2: Robusta (Copiar archivos)

1. Crear carpeta `audio-files` en el proyecto
2. Implementar `localFileService.js`
3. Copiar archivos al seleccionarlos
4. Guardar ruta relativa en BD

```javascript
// En AudioFileUploader
const savedPath = await saveAudioFile(file)
// Retorna: audio-files/1234567890.mp3
```

---

## Testing

### Verificar que funciona:

1. Cargar un archivo de audio
2. Guardar en BD
3. **Recargar la página**
4. Intentar reproducir el sonido
5. ✅ Debe reproducirse correctamente

### Si no funciona:

- Verificar la ruta guardada en BD
- Verificar que el archivo existe en esa ruta
- Verificar permisos de lectura del archivo
- Revisar consola del navegador para errores

---

## Conclusión

El problema actual es que se guardan **blob URLs temporales** que no persisten entre sesiones.

**Solución recomendada:** Copiar archivos a carpeta local del proyecto y guardar rutas relativas permanentes.

**Alternativa rápida:** Usar `file.path` directamente si estás en Electron (pero archivos pueden moverse/eliminarse).
