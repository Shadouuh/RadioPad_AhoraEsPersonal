# Troubleshooting - Problemas con Programas en Supabase

## Diagnóstico Rápido

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Importa el test en la consola del navegador
// O agrega esto temporalmente en tu componente:
import { testSupabaseConnection, testCreateProgram } from './utils/testSupabase'

// Luego ejecuta:
await testSupabaseConnection()
await testCreateProgram()
```

## Problemas Comunes

### 1. Error: "relation 'programs' does not exist"

**Causa**: Las tablas no existen en Supabase.

**Solución**:
1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Ejecuta el archivo `supabase-schema.sql`

### 2. Error: "new row violates row-level security policy"

**Causa**: Las políticas RLS están bloqueando la operación.

**Solución**:
1. Ve a **Authentication** > **Policies** en Supabase
2. Verifica que las políticas para `programs` y `sounds` estén habilitadas
3. Las políticas deben permitir operaciones para usuarios `authenticated`
4. Si no existen, ejecuta el script `supabase-schema.sql`

**Verificación rápida**:
```sql
-- Ejecuta esto en SQL Editor para ver las políticas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('programs', 'sounds');
```

### 3. Error: "JWT expired" o "Invalid token"

**Causa**: La sesión de autenticación expiró.

**Solución**:
1. Cierra sesión y vuelve a iniciar sesión
2. Verifica que el token se esté enviando correctamente
3. Revisa la configuración de `supabaseClient.js`

### 4. Error: "permission denied for table"

**Causa**: RLS está habilitado pero no hay políticas configuradas.

**Solución**:
1. Ejecuta el script `supabase-schema.sql` completo
2. O desactiva RLS temporalmente (NO recomendado para producción):
```sql
ALTER TABLE programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE sounds DISABLE ROW LEVEL SECURITY;
```

### 5. No se cargan los datos (loading infinito)

**Causa**: Error silencioso en la consulta.

**Solución**:
1. Abre la consola del navegador (F12)
2. Busca logs con prefijo `[programSupabase]` o `[soundSupabase]`
3. Revisa el mensaje de error específico
4. Verifica que el usuario esté autenticado

### 6. Error al insertar: "null value in column violates not-null constraint"

**Causa**: Falta un campo requerido.

**Solución**:
- Los campos requeridos son: `name` (programs), `name`, `scope`, `file_url` (sounds)
- El código ahora maneja valores vacíos automáticamente

## Verificación de Configuración

### Paso 1: Verificar cliente Supabase

Archivo: `src/lib/supabaseClient.js`

```javascript
import { createClient } from '@supabase/supabase-js'

const url = "TU_SUPABASE_URL"
const anonKey = "TU_SUPABASE_ANON_KEY"

export const supabase = url && anonKey ? createClient(url, anonKey) : null
```

✅ Verifica que `url` y `anonKey` sean correctos
✅ Verifica que `supabase` no sea `null`

### Paso 2: Verificar autenticación

En la consola del navegador:

```javascript
import { supabase } from './lib/supabaseClient'

// Verificar sesión
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)

// Si no hay sesión, el usuario no está autenticado
```

### Paso 3: Verificar tablas

En SQL Editor de Supabase:

```sql
-- Ver todas las tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Ver estructura de programs
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'programs';

-- Ver estructura de sounds
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sounds';
```

### Paso 4: Verificar políticas RLS

```sql
-- Ver si RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('programs', 'sounds');

-- Ver políticas existentes
SELECT * FROM pg_policies
WHERE tablename IN ('programs', 'sounds');
```

## Logs de Depuración

Los servicios ahora incluyen logs detallados:

### Logs de Programs
- `[programSupabase] Supabase client not initialized` - Cliente no inicializado
- `[programSupabase] Error fetching programs:` - Error al cargar
- `[programSupabase] Programs fetched successfully:` - Carga exitosa
- `[programSupabase] Creating program with payload:` - Intentando crear
- `[programSupabase] Error creating program:` - Error al crear
- `[programSupabase] Program created successfully:` - Creación exitosa

### Logs de Sounds
- `[soundSupabase] Supabase client not initialized` - Cliente no inicializado
- `[soundSupabase] Error fetching sounds:` - Error al cargar
- `[soundSupabase] Sounds fetched successfully:` - Carga exitosa
- `[soundSupabase] Creating sound with payload:` - Intentando crear
- `[soundSupabase] Error creating sound:` - Error al crear
- `[soundSupabase] Sound created successfully:` - Creación exitosa

## Solución Paso a Paso

1. **Ejecuta el script SQL**: `supabase-schema.sql` en Supabase SQL Editor
2. **Verifica las tablas**: Asegúrate de que `programs` y `sounds` existan
3. **Verifica RLS**: Asegúrate de que las políticas estén configuradas
4. **Inicia sesión**: Asegúrate de estar autenticado en la aplicación
5. **Abre la consola**: F12 para ver los logs de depuración
6. **Prueba cargar**: Ve a la página de Programas
7. **Revisa logs**: Busca errores en la consola
8. **Prueba crear**: Intenta crear un programa
9. **Revisa logs**: Verifica el payload y el error si hay

## Contacto de Soporte

Si después de seguir estos pasos sigues teniendo problemas:
1. Copia el error completo de la consola
2. Copia el payload que se está enviando
3. Verifica las políticas RLS en Supabase
4. Revisa la documentación de Supabase sobre RLS
