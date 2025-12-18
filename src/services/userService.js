import { supabase } from '../lib/supabaseClient'

const ADMIN_BASE_URL =
  import.meta.env.VITE_ADMIN_BASE_URL || import.meta.env.VITE_UPLOAD_BASE_URL || 'http://localhost:3002'

async function adminFetch(path, init) {
  const session = await supabase?.auth.getSession()
  const token = session?.data?.session?.access_token || ''
  const headers = {
    'Content-Type': 'application/json',
    ...(init?.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const res = await fetch(`${ADMIN_BASE_URL}${path}`, { ...init, headers })
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  return res.json()
}

export async function getUsers() {
  try {
    return await adminFetch('/admin/users')
  } catch {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, role, assigned_program_ids, legacy_id')
      .order('legacy_id', { ascending: true })
    if (error) {
      throw new Error('Profiles fetch failed')
    }
    return (Array.isArray(data) ? data : []).map((p) => ({
      id: Number(p.legacy_id ?? 0) || 0,
      username: '',
      fullName: p.full_name || '',
      role: p.role || 'operator',
      assignedProgramIds: Array.isArray(p.assigned_program_ids)
        ? p.assigned_program_ids.map((n) => Number(n))
        : [],
    }))
  }
}

export function createUser({ username, password, fullName, role, assignedProgramIds }) {
  return adminFetch('/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
      fullName,
      role,
      assignedProgramIds: Array.isArray(assignedProgramIds) ? assignedProgramIds : [],
    }),
  })
}

export function updateUser(id, patch) {
  return adminFetch(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch || {}),
  })
}

export function deleteUser(id) {
  return adminFetch(`/admin/users/${id}`, { method: 'DELETE' })
}
