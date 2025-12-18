# Configuración de Supabase para RadioPad

## Problema identificado

La página de Programas tiene errores al cargar y al insertar datos debido a problemas con la configuración de Supabase.

## Pasos para solucionar

### 1. Verificar estructura de base de datos

Ejecuta el script SQL en tu proyecto de Supabase:

1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor**
3. Copia y pega el contenido del archivo `supabase-schema.sql`
4. Ejecuta el script

Este script creará:
- Tabla `programs` con columnas: id, name, description, created_at, updated_at
- Tabla `sounds` con columnas: id, name, scope, program_id, owner_user_id, file_url, play_count, duration_seconds, created_at, updated_at
- Índices para optimizar consultas
- Políticas RLS (Row Level Security) para permitir operaciones CRUD

### 2. Verificar políticas RLS

Las políticas RLS son críticas para que las operaciones funcionen. El script incluye políticas que permiten:
- **SELECT**: Lectura para usuarios autenticados
- **INSERT**: Inserción para usuarios autenticados
- **UPDATE**: Actualización para usuarios autenticados
- **DELETE**: Eliminación para usuarios autenticados

Si necesitas políticas más restrictivas, modifícalas según tus necesidades.

### 3. Verificar autenticación

Asegúrate de que:
1. El usuario esté autenticado correctamente en Supabase
2. El token de autenticación sea válido
3. La sesión no haya expirado

### 4. Debugging

Los servicios ahora incluyen logs detallados en la consola del navegador:
- `[programSupabase]` - Operaciones de programas
- `[soundSupabase]` - Operaciones de sonidos

Abre las **DevTools del navegador** (F12) y revisa la consola para ver:
- Errores específicos de Supabase
- Payloads enviados
- Respuestas recibidas

### 5. Errores comunes y soluciones

#### Error: "relation 'programs' does not exist"
**Solución**: Ejecuta el script SQL para crear las tablas.

#### Error: "new row violates row-level security policy"
**Solución**: Verifica que las políticas RLS estén configuradas correctamente y que el usuario esté autenticado.

#### Error: "null value in column violates not-null constraint"
**Solución**: Asegúrate de que todos los campos requeridos tengan valores. Los servicios ahora manejan valores vacíos correctamente.

#### Error: "permission denied for table"
**Solución**: Verifica que las políticas RLS permitan la operación que intentas realizar.

### 6. Verificar configuración del cliente

El archivo `src/lib/supabaseClient.js` debe tener:
- URL correcta de tu proyecto Supabase
- Anon key válida
- Cliente inicializado correctamente

### 7. Probar funcionalidad

1. **Cargar programas**: Abre la página de Programas y verifica que cargue sin errores
2. **Crear programa**: Intenta crear un nuevo programa
3. **Asignar FX**: Intenta asignar un FX a un programa
4. **Eliminar FX**: Intenta eliminar un FX de un programa

## Cambios realizados

### Servicios mejorados

- ✅ Mejor manejo de errores con mensajes descriptivos
- ✅ Logs de depuración en consola
- ✅ Validación de cliente Supabase inicializado
- ✅ Try-catch para capturar excepciones
- ✅ Mensajes de error específicos de Supabase

### Script SQL

- ✅ Estructura completa de tablas
- ✅ Políticas RLS configuradas
- ✅ Índices para optimización
- ✅ Triggers para actualización automática de timestamps

## Próximos pasos

1. Ejecuta el script SQL en Supabase
2. Verifica que las tablas se crearon correctamente
3. Prueba la funcionalidad en la aplicación
4. Revisa la consola del navegador para ver los logs
5. Si hay errores, copia el mensaje completo y ajusta las políticas RLS según sea necesario
