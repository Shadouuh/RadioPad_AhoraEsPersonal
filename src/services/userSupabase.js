import { supabase } from '../lib/supabaseClient'

// Función simple de hash (NOTA: En producción usar bcrypt)
async function simpleHash(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function mapUserRow(row) {
  if (!row) return null
  return {
    id: Number(row.id),
    username: row.username || '',
    fullName: row.full_name || '',
    role: row.role || 'operator',
    assignedProgramIds: Array.isArray(row.assigned_program_ids) 
      ? row.assigned_program_ids.map(id => Number(id)) 
      : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getUsers() {
  try {
    console.log('[userSupabase] Fetching users...')
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.error('[userSupabase] Error fetching users:', error)
      throw new Error(`Error al cargar usuarios: ${error.message}`)
    }

    console.log('[userSupabase] Users fetched successfully:', data?.length || 0)
    return (data || []).map(mapUserRow).filter(Boolean)
  } catch (err) {
    console.error('[userSupabase] Exception in getUsers:', err)
    throw err
  }
}

export async function createUser({ username, password, fullName, role, assignedProgramIds }) {
  try {
    console.log('[userSupabase] Creating user:', { username, fullName, role })

    if (!username || !password || !fullName || !role) {
      throw new Error('Todos los campos son obligatorios')
    }

    // Hash de la contraseña
    const passwordHash = await simpleHash(password)

    const { data, error } = await supabase
      .from('users')
      .insert({
        username: username.trim(),
        password_hash: passwordHash,
        full_name: fullName.trim(),
        role: role,
        assigned_program_ids: Array.isArray(assignedProgramIds) ? assignedProgramIds : [],
      })
      .select()
      .single()

    if (error) {
      console.error('[userSupabase] Error creating user:', error)
      if (error.code === '23505') {
        throw new Error('El nombre de usuario ya existe')
      }
      throw new Error(`Error al crear usuario: ${error.message}`)
    }

    console.log('[userSupabase] User created successfully:', data?.id)
    return mapUserRow(data)
  } catch (err) {
    console.error('[userSupabase] Exception in createUser:', err)
    throw err
  }
}

export async function updateUser(id, patch) {
  try {
    console.log('[userSupabase] Updating user:', id, patch)

    const updates = {}
    
    if (patch.username !== undefined) updates.username = patch.username
    if (patch.fullName !== undefined) updates.full_name = patch.fullName
    if (patch.role !== undefined) updates.role = patch.role
    if (patch.assignedProgramIds !== undefined) {
      updates.assigned_program_ids = Array.isArray(patch.assignedProgramIds) 
        ? patch.assignedProgramIds 
        : []
    }
    
    // Si se proporciona una nueva contraseña, hashearla
    if (patch.password) {
      updates.password_hash = await simpleHash(patch.password)
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[userSupabase] Error updating user:', error)
      throw new Error(`Error al actualizar usuario: ${error.message}`)
    }

    console.log('[userSupabase] User updated successfully:', data?.id)
    return mapUserRow(data)
  } catch (err) {
    console.error('[userSupabase] Exception in updateUser:', err)
    throw err
  }
}

export async function deleteUser(id) {
  try {
    console.log('[userSupabase] Deleting user:', id)

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[userSupabase] Error deleting user:', error)
      throw new Error(`Error al eliminar usuario: ${error.message}`)
    }

    console.log('[userSupabase] User deleted successfully:', id)
    return { success: true }
  } catch (err) {
    console.error('[userSupabase] Exception in deleteUser:', err)
    throw err
  }
}

export async function authenticateUser(username, password) {
  try {
    console.log('[userSupabase] Authenticating user:', username)

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !data) {
      console.error('[userSupabase] User not found:', username)
      throw new Error('Usuario o contraseña incorrectos')
    }

    // Verificar contraseña
    const passwordHash = await simpleHash(password)
    const isValid = passwordHash === data.password_hash
    
    if (!isValid) {
      console.error('[userSupabase] Invalid password for user:', username)
      throw new Error('Usuario o contraseña incorrectos')
    }

    console.log('[userSupabase] User authenticated successfully:', data.id)
    return mapUserRow(data)
  } catch (err) {
    console.error('[userSupabase] Exception in authenticateUser:', err)
    throw err
  }
}
